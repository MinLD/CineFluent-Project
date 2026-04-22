from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path

from google.genai import types

from ..models.models_model import ChatMessage, ChatSession
from ..utils.ai_engine import cinefluent_ai
from .chat_context_service import build_chat_context_service
from .chat_service import append_chat_message_service
from .product_rag.config import ProductRagSettings
from .product_rag.embeddings import HashEmbeddingProvider
from .product_rag.retrieval import run_retrieval
from .product_rag.stores import JsonVectorStore, QdrantVectorStore


CHAT_MODEL_NAME = "gemini-2.5-flash"


def _get_repo_root() -> Path:
    return Path(__file__).resolve().parents[4]


def _load_vector_store(settings: ProductRagSettings):
    if settings.store_kind == "qdrant" and settings.qdrant_url:
        return QdrantVectorStore(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            collection_name=settings.qdrant_collection,
        )
    return JsonVectorStore(settings.json_store_path)


def _serialize_retrieval_hits(hits: list) -> list[dict]:
    sources: list[dict] = []
    for item in hits:
        payload = item.payload or {}
        sources.append(
            {
                "chunk_id": item.chunk_id,
                "score": round(float(item.score or 0.0), 4),
                "doc_id": payload.get("doc_id"),
                "title": payload.get("title"),
                "topic": payload.get("topic"),
                "path": payload.get("path"),
                "section_title": payload.get("section_title"),
                "text": payload.get("text"),
            }
        )
    return sources


def _format_chat_history(session_id: int, limit: int = 6) -> str:
    messages = (
        ChatMessage.query.filter_by(session_id=session_id)
        .order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc())
        .limit(limit)
        .all()
    )
    if not messages:
        return "Chưa có lịch sử hội thoại."

    ordered_messages = list(reversed(messages))
    lines: list[str] = []
    for item in ordered_messages:
        role = (
            "Người dùng"
            if item.role == "user"
            else "Trợ lý"
            if item.role == "assistant"
            else "Hệ thống"
        )
        lines.append(f"{role}: {item.content}")
    return "\n".join(lines)


def _resolve_orchestration_mode(context_type: str) -> str:
    if context_type == "general":
        return "rag"
    return "hybrid"


def _build_rag_context_text(sources: list[dict]) -> str:
    if not sources:
        return "Không có tài liệu Product-RAG phù hợp."

    blocks: list[str] = []
    for index, item in enumerate(sources, start=1):
        blocks.append(
            "\n".join(
                [
                    f"[Tài liệu {index}]",
                    f"Tiêu đề: {item.get('title') or 'Không rõ'}",
                    f"Chủ đề: {item.get('topic') or 'Không rõ'}",
                    f"Mục: {item.get('section_title') or 'Không rõ'}",
                    f"Nội dung: {item.get('text') or ''}",
                ]
            )
        )
    return "\n\n".join(blocks)


def _build_prompt(
    user_message: str,
    orchestration_mode: str,
    runtime_context: dict | None,
    rag_sources: list[dict],
    chat_history_text: str,
) -> str:
    runtime_text = (
        json.dumps(runtime_context, ensure_ascii=False, indent=2)
        if runtime_context is not None
        else "Không có runtime context."
    )
    rag_text = _build_rag_context_text(rag_sources)

    return f"""
Bạn là CineFluent AI Assistant, trợ lý học tiếng Anh bên trong hệ thống CineFluent.

Nguyên tắc trả lời:
- Ưu tiên đúng dữ liệu CineFluent hiện tại hơn là trả lời chung chung.
- Nếu runtime context hoặc tài liệu Product-RAG chưa đủ để kết luận chắc chắn, hãy nói rõ đang thiếu gì.
- Trả lời bằng tiếng Việt tự nhiên, rõ ràng, ngắn gọn vừa đủ. Nếu người dùng yêu cầu tiếng Anh thì mới đổi ngôn ngữ.
- Nếu người dùng hỏi về tính năng hệ thống, hãy bám vào Product-RAG.
- Nếu người dùng hỏi về tình trạng học hiện tại của họ, hãy bám vào runtime context.
- Không bịa đặt dữ liệu không có trong context.

Chế độ điều phối hiện tại: {orchestration_mode}

Lịch sử hội thoại gần đây:
{chat_history_text}

Runtime context:
{runtime_text}

Product-RAG context:
{rag_text}

Câu hỏi hiện tại của người dùng:
{user_message}
""".strip()


def _extract_usage(response) -> dict | None:
    usage = getattr(response, "usage_metadata", None)
    if not usage:
        return None

    return {
        "prompt_token_count": getattr(usage, "prompt_token_count", None),
        "candidates_token_count": getattr(usage, "candidates_token_count", None),
        "total_token_count": getattr(usage, "total_token_count", None),
    }


def _run_ai_chat_completion(
    *,
    content: str,
    context_type: str,
    runtime_context: dict | None,
    chat_history_text: str,
):
    orchestration_mode = _resolve_orchestration_mode(context_type)

    rag_sources: list[dict] = []
    if orchestration_mode in {"rag", "hybrid"}:
        repo_root = _get_repo_root()
        rag_settings = ProductRagSettings.from_env(repo_root)
        vector_store = _load_vector_store(rag_settings)
        embedding_provider = HashEmbeddingProvider(dim=rag_settings.embedding_dim)
        rag_hits = run_retrieval(
            question=content,
            vector_store=vector_store,
            embedding_provider=embedding_provider,
            top_k=5,
            context_type=context_type,
        )
        rag_sources = _serialize_retrieval_hits(rag_hits)

    prompt = _build_prompt(
        user_message=content,
        orchestration_mode=orchestration_mode,
        runtime_context=runtime_context,
        rag_sources=rag_sources,
        chat_history_text=chat_history_text,
    )

    started_at = time.perf_counter()
    try:
        response = cinefluent_ai.models.generate_content(
            model=CHAT_MODEL_NAME,
            contents=[prompt],
            config=types.GenerateContentConfig(
                temperature=0.4,
                max_output_tokens=700,
            ),
        )
        latency_ms = int((time.perf_counter() - started_at) * 1000)
        assistant_text = (getattr(response, "text", "") or "").strip()
        if not assistant_text:
            assistant_text = "Mình chưa tạo được phản hồi phù hợp. Bạn thử diễn đạt cụ thể hơn giúp mình nhé."
    except Exception as exc:
        return {
            "success": False,
            "error": str(exc),
            "code": 500,
        }

    return {
        "success": True,
        "data": {
            "mode": orchestration_mode,
            "assistant_text": assistant_text,
            "context_used": runtime_context,
            "sources": rag_sources,
            "usage": _extract_usage(response),
            "latency_ms": latency_ms,
        },
    }


def _build_ephemeral_chat_message(
    *,
    role: str,
    content: str,
    context_used: dict | None = None,
    sources: list[dict] | None = None,
    usage: dict | None = None,
    latency_ms: int | None = None,
):
    return {
        "id": int(time.time() * 1000),
        "session_id": 0,
        "user_id": "guest",
        "role": role,
        "content": content,
        "context_used": context_used,
        "sources": sources,
        "usage": usage,
        "latency_ms": latency_ms,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


def _format_ephemeral_chat_history(history: list[dict] | None, limit: int = 6) -> str:
    if not isinstance(history, list):
        return "Chưa có lịch sử hội thoại trước đó của khách."

    normalized_history: list[dict] = []
    for item in history:
        if not isinstance(item, dict):
            continue

        role = str(item.get("role") or "").strip()
        content = str(item.get("content") or "").strip()
        if role not in {"system", "user", "assistant"} or not content:
            continue

        normalized_history.append({"role": role, "content": content})

    if not normalized_history:
        return "Chưa có lịch sử hội thoại trước đó của khách."

    lines: list[str] = []
    for item in normalized_history[-limit:]:
        role_label = (
            "Người dùng"
            if item["role"] == "user"
            else "Trợ lý"
            if item["role"] == "assistant"
            else "Hệ thống"
        )
        lines.append(f"{role_label}: {item['content']}")
    return "\n".join(lines)


def send_chat_message_with_ai_service(
    user_id: str,
    session_id: int,
    content: str,
    client_state: dict | None = None,
):
    session = ChatSession.query.get(session_id)
    if not session or session.user_id != user_id:
        return {"success": False, "error": "Không tìm thấy phiên chat", "code": 404}

    user_message_result = append_chat_message_service(
        user_id=user_id,
        session_id=session_id,
        role="user",
        content=content,
    )
    if not user_message_result.get("success"):
        return user_message_result

    runtime_result = build_chat_context_service(
        user_id=user_id,
        context_type=session.context_type,
        context_id=(
            int(session.context_id)
            if session.context_id is not None and str(session.context_id).isdigit()
            else None
        ),
        client_state=client_state,
    )
    if not runtime_result.get("success"):
        return runtime_result

    runtime_context = runtime_result.get("data")
    chat_history_text = _format_chat_history(session_id=session_id, limit=6)
    ai_result = _run_ai_chat_completion(
        content=content,
        context_type=session.context_type,
        runtime_context=runtime_context,
        chat_history_text=chat_history_text,
    )
    if not ai_result.get("success"):
        return ai_result

    ai_payload = ai_result.get("data") or {}

    assistant_message_result = append_chat_message_service(
        user_id=user_id,
        session_id=session_id,
        role="assistant",
        content=ai_payload.get("assistant_text"),
        context_used=ai_payload.get("context_used"),
        sources=ai_payload.get("sources"),
        usage=ai_payload.get("usage"),
        latency_ms=ai_payload.get("latency_ms"),
    )
    if not assistant_message_result.get("success"):
        return assistant_message_result

    return {
        "success": True,
        "data": {
            "session_id": session_id,
            "mode": ai_payload.get("mode"),
            "user_message": user_message_result.get("data"),
            "assistant_message": assistant_message_result.get("data"),
            "context_used": ai_payload.get("context_used"),
            "sources": ai_payload.get("sources"),
        },
    }


def send_public_chat_message_with_ai_service(
    content: str,
    client_state: dict | None = None,
    history: list[dict] | None = None,
):
    normalized_content = (content or "").strip()
    if not normalized_content:
        return {"success": False, "error": "content không được để trống", "code": 400}

    runtime_result = build_chat_context_service(
        user_id="guest",
        context_type="general",
        context_id=None,
        client_state=client_state,
    )
    if not runtime_result.get("success"):
        return runtime_result

    runtime_context = runtime_result.get("data")
    ai_result = _run_ai_chat_completion(
        content=normalized_content,
        context_type="general",
        runtime_context=runtime_context,
        chat_history_text=_format_ephemeral_chat_history(history),
    )
    if not ai_result.get("success"):
        return ai_result

    ai_payload = ai_result.get("data") or {}

    return {
        "success": True,
        "data": {
            "session_id": 0,
            "mode": ai_payload.get("mode"),
            "user_message": _build_ephemeral_chat_message(
                role="user",
                content=normalized_content,
            ),
            "assistant_message": _build_ephemeral_chat_message(
                role="assistant",
                content=ai_payload.get("assistant_text") or "",
                context_used=ai_payload.get("context_used"),
                sources=ai_payload.get("sources"),
                usage=ai_payload.get("usage"),
                latency_ms=ai_payload.get("latency_ms"),
            ),
            "context_used": ai_payload.get("context_used"),
            "sources": ai_payload.get("sources"),
        },
    }
