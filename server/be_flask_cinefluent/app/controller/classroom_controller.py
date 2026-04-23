from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..services.classroom_service import (
    create_homework_assignment_service,
    create_class_session_service,
    create_classroom_service,
    delete_homework_assignment_service,
    get_classroom_detail_service,
    get_session_recap_service,
    join_classroom_service,
    list_assignment_sources_service,
    list_class_sessions_service,
    list_homework_assignments_service,
    list_my_classrooms_service,
    submit_homework_assignment_service,
    upload_session_recording_service,
)
from ..utils.response import error_response, success_response


classroom_bp = Blueprint("classroom_bp", __name__)


@classroom_bp.route("", methods=["GET"], strict_slashes=False)
@jwt_required()
def list_my_classrooms():
    user_id = get_jwt_identity()
    result = list_my_classrooms_service(user_id)
    return success_response(
        data=result.get("data"),
        message="Lấy danh sách lớp học thành công",
        code=200,
    )


@classroom_bp.route("", methods=["POST"], strict_slashes=False)
@jwt_required()
def create_classroom():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    result = create_classroom_service(
        user_id=user_id,
        name=data.get("name"),
        description=data.get("description"),
    )
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể tạo lớp học"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Tạo lớp học thành công",
        code=201,
    )


@classroom_bp.route("/join", methods=["POST"], strict_slashes=False)
@jwt_required()
def join_classroom():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    result = join_classroom_service(
        user_id=user_id,
        invite_code=data.get("invite_code"),
    )
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể tham gia lớp học"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Tham gia lớp học thành công",
        code=200,
    )


@classroom_bp.route("/<int:classroom_id>", methods=["GET"], strict_slashes=False)
@jwt_required()
def get_classroom_detail(classroom_id: int):
    user_id = get_jwt_identity()
    result = get_classroom_detail_service(user_id, classroom_id)
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể lấy thông tin lớp học"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Lấy thông tin lớp học thành công",
        code=200,
    )


@classroom_bp.route("/<int:classroom_id>/sessions", methods=["GET"], strict_slashes=False)
@jwt_required()
def list_class_sessions(classroom_id: int):
    user_id = get_jwt_identity()
    result = list_class_sessions_service(user_id, classroom_id)
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể lấy danh sách buổi học"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Lấy danh sách buổi học thành công",
        code=200,
    )


@classroom_bp.route("/<int:classroom_id>/sessions", methods=["POST"], strict_slashes=False)
@jwt_required()
def create_class_session(classroom_id: int):
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    result = create_class_session_service(
        user_id=user_id,
        classroom_id=classroom_id,
        title=data.get("title"),
        description=data.get("description"),
        scheduled_at=data.get("scheduled_at"),
        grammar_focus=data.get("grammar_focus"),
        teacher_notes=data.get("teacher_notes"),
    )
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể tạo buổi học"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Tạo buổi học thành công",
        code=201,
    )


@classroom_bp.route(
    "/<int:classroom_id>/sessions/<int:session_id>/recordings",
    methods=["POST"],
    strict_slashes=False,
)
@jwt_required()
def upload_session_recording(classroom_id: int, session_id: int):
    user_id = get_jwt_identity()
    audio_file = request.files.get("audio")
    duration_raw = request.form.get("duration_seconds")
    try:
        duration_seconds = float(duration_raw) if duration_raw else None
    except ValueError:
        duration_seconds = None

    result = upload_session_recording_service(
        user_id=user_id,
        classroom_id=classroom_id,
        session_id=session_id,
        audio_file=audio_file,
        duration_seconds=duration_seconds,
    )
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể xử lý ghi âm buổi học"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Đã tạo recap từ ghi âm buổi học",
        code=201,
    )


@classroom_bp.route(
    "/<int:classroom_id>/sessions/<int:session_id>/recap",
    methods=["GET"],
    strict_slashes=False,
)
@jwt_required()
def get_session_recap(classroom_id: int, session_id: int):
    user_id = get_jwt_identity()
    result = get_session_recap_service(user_id, classroom_id, session_id)
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể lấy recap buổi học"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Lấy recap buổi học thành công",
        code=200,
    )


@classroom_bp.route(
    "/<int:classroom_id>/homework-sources",
    methods=["GET"],
    strict_slashes=False,
)
@jwt_required()
def list_assignment_sources(classroom_id: int):
    user_id = get_jwt_identity()
    result = list_assignment_sources_service(user_id, classroom_id)
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể lấy nguồn tạo bài tập"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Lấy nguồn tạo bài tập thành công",
        code=200,
    )


@classroom_bp.route(
    "/<int:classroom_id>/homeworks",
    methods=["GET"],
    strict_slashes=False,
)
@jwt_required()
def list_homeworks(classroom_id: int):
    user_id = get_jwt_identity()
    result = list_homework_assignments_service(user_id, classroom_id)
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể lấy danh sách bài tập"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Lấy danh sách bài tập thành công",
        code=200,
    )


@classroom_bp.route(
    "/<int:classroom_id>/homeworks",
    methods=["POST"],
    strict_slashes=False,
)
@jwt_required()
def create_homework(classroom_id: int):
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    result = create_homework_assignment_service(
        user_id=user_id,
        classroom_id=classroom_id,
        video_id=data.get("video_id"),
        question_count=data.get("question_count"),
        grammar_focus=data.get("grammar_focus"),
    )
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể tạo bài tập"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Tạo bài tập thành công",
        code=201,
    )


@classroom_bp.route(
    "/<int:classroom_id>/homeworks/<int:assignment_id>",
    methods=["DELETE"],
    strict_slashes=False,
)
@jwt_required()
def delete_homework(classroom_id: int, assignment_id: int):
    user_id = get_jwt_identity()

    result = delete_homework_assignment_service(
        user_id=user_id,
        classroom_id=classroom_id,
        assignment_id=assignment_id,
    )
    if not result.get("success"):
        return error_response(
            message=result.get("error", "KhÃ´ng thá»ƒ xÃ³a bÃ i táº­p"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="XÃ³a bÃ i táº­p thÃ nh cÃ´ng",
        code=200,
    )


@classroom_bp.route(
    "/<int:classroom_id>/homeworks/<int:assignment_id>/submit",
    methods=["POST"],
    strict_slashes=False,
)
@jwt_required()
def submit_homework(classroom_id: int, assignment_id: int):
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    result = submit_homework_assignment_service(
        user_id=user_id,
        classroom_id=classroom_id,
        assignment_id=assignment_id,
        answers=data.get("answers"),
    )
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể nộp bài tập"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Nộp bài tập thành công",
        code=200,
    )
