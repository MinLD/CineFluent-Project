from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..services.chat_orchestrator_service import (
    send_chat_message_with_ai_service,
    send_public_chat_message_with_ai_service,
)
from ..services.chat_service import (
    append_chat_message_service,
    create_chat_session_service,
    get_chat_session_messages_service,
    list_chat_sessions_service,
)
from ..utils.response import error_response, success_response


chat_bp = Blueprint("chat_bp", __name__)


@chat_bp.route("/sessions", methods=["POST"])
@jwt_required()
def create_chat_session():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    context_type = data.get("context_type", "general")
    context_id = data.get("context_id")
    title = data.get("title")

    result = create_chat_session_service(
        user_id=user_id,
        context_type=context_type,
        context_id=context_id,
        title=title,
    )
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể tạo phiên chat"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Tạo phiên chat thành công",
        code=201,
    )


@chat_bp.route("/sessions", methods=["GET"])
@jwt_required()
def list_chat_sessions():
    user_id = get_jwt_identity()
    result = list_chat_sessions_service(user_id)
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể lấy danh sách phiên chat"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Lấy danh sách phiên chat thành công",
        code=200,
    )


@chat_bp.route("/sessions/<int:session_id>/messages", methods=["GET"])
@jwt_required()
def get_chat_session_messages(session_id: int):
    user_id = get_jwt_identity()
    result = get_chat_session_messages_service(user_id, session_id)
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể lấy tin nhắn"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Lấy tin nhắn thành công",
        code=200,
    )


@chat_bp.route("/sessions/<int:session_id>/messages", methods=["POST"])
@jwt_required()
def append_chat_message(session_id: int):
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    role = data.get("role")
    content = data.get("content")
    context_used = data.get("context_used")
    sources = data.get("sources")
    usage = data.get("usage")
    latency_ms = data.get("latency_ms")

    result = append_chat_message_service(
        user_id=user_id,
        session_id=session_id,
        role=role,
        content=content,
        context_used=context_used,
        sources=sources,
        usage=usage,
        latency_ms=latency_ms,
    )
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể thêm tin nhắn"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Thêm tin nhắn thành công",
        code=201,
    )


@chat_bp.route("/sessions/<int:session_id>/ask", methods=["POST"])
@jwt_required()
def ask_chat_assistant(session_id: int):
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    content = data.get("content")
    client_state = data.get("client_state")

    result = send_chat_message_with_ai_service(
        user_id=user_id,
        session_id=session_id,
        content=content,
        client_state=client_state,
    )
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể gửi câu hỏi cho trợ lý AI"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Trợ lý AI phản hồi thành công",
        code=201,
    )


@chat_bp.route("/public/ask", methods=["POST"])
def ask_public_chat_assistant():
    data = request.get_json() or {}

    content = data.get("content")
    client_state = data.get("client_state")
    history = data.get("history")

    result = send_public_chat_message_with_ai_service(
        content=content,
        client_state=client_state,
        history=history,
    )
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể gửi câu hỏi cho trợ lý AI"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Trợ lý AI phản hồi thành công",
        code=201,
    )
