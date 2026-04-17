from __future__ import annotations

from datetime import datetime

from ..extensions import db
from ..models.models_model import ChatMessage, ChatSession


ALLOWED_CONTEXT_TYPES = {
    "general",
    "movie",
    "flashcard",
    "roadmap",
    "typing_game",
    "realtime_practice",
}

ALLOWED_MESSAGE_ROLES = {"system", "user", "assistant"}


def serialize_chat_session(session: ChatSession) -> dict:
    return {
        "id": session.id,
        "title": session.title,
        "context_type": session.context_type,
        "context_id": session.context_id,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "updated_at": session.updated_at.isoformat() if session.updated_at else None,
    }


def serialize_chat_message(message: ChatMessage) -> dict:
    return {
        "id": message.id,
        "session_id": message.session_id,
        "user_id": message.user_id,
        "role": message.role,
        "content": message.content,
        "context_used": message.context_used,
        "sources": message.sources,
        "usage": message.usage,
        "latency_ms": message.latency_ms,
        "created_at": message.created_at.isoformat() if message.created_at else None,
    }


def create_chat_session_service(
    user_id: str,
    context_type: str = "general",
    context_id: str | None = None,
    title: str | None = None,
):
    if context_type not in ALLOWED_CONTEXT_TYPES:
        return {"success": False, "error": "context_type không hợp lệ", "code": 400}

    session = ChatSession(
        user_id=user_id,
        context_type=context_type,
        context_id=str(context_id) if context_id is not None else None,
        title=title or "Cuộc trò chuyện mới",
    )

    db.session.add(session)
    db.session.commit()

    return {"success": True, "data": serialize_chat_session(session)}


def list_chat_sessions_service(user_id: str):
    sessions = (
        ChatSession.query.filter_by(user_id=user_id)
        .order_by(ChatSession.updated_at.desc(), ChatSession.id.desc())
        .all()
    )
    return {
        "success": True,
        "data": [serialize_chat_session(session) for session in sessions],
    }


def get_chat_session_messages_service(user_id: str, session_id: int):
    session = ChatSession.query.get(session_id)
    if not session or session.user_id != user_id:
        return {"success": False, "error": "Không tìm thấy phiên chat", "code": 404}

    messages = (
        session.messages.order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc()).all()
    )
    return {
        "success": True,
        "data": {
            "session": serialize_chat_session(session),
            "messages": [serialize_chat_message(message) for message in messages],
        },
    }


def append_chat_message_service(
    user_id: str,
    session_id: int,
    role: str,
    content: str,
    context_used: dict | None = None,
    sources: list | None = None,
    usage: dict | None = None,
    latency_ms: int | None = None,
):
    if role not in ALLOWED_MESSAGE_ROLES:
        return {"success": False, "error": "role không hợp lệ", "code": 400}

    normalized_content = (content or "").strip()
    if not normalized_content:
        return {"success": False, "error": "content không được để trống", "code": 400}

    session = ChatSession.query.get(session_id)
    if not session or session.user_id != user_id:
        return {"success": False, "error": "Không tìm thấy phiên chat", "code": 404}

    message = ChatMessage(
        session_id=session.id,
        user_id=user_id,
        role=role,
        content=normalized_content,
        context_used=context_used,
        sources=sources,
        usage=usage,
        latency_ms=latency_ms,
    )

    db.session.add(message)
    session.updated_at = datetime.utcnow()
    db.session.commit()

    return {"success": True, "data": serialize_chat_message(message)}
