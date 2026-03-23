from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..services.roadmap_service import (
    generate_daily_task_service,
    generate_four_skills_assessment_service,
    generate_roadmap_blueprint_service,
    get_assessment_history_service,
    get_daily_task_service,
    get_roadmap_detail_service,
    list_roadmaps_service,
    reset_assessment_service,
    submit_assessment_service,
)
from ..utils.response import error_response, success_response


roadmap_bp = Blueprint("api/roadmap", __name__)


@roadmap_bp.route("/assessment/generate", methods=["GET"])
@jwt_required()
def generate_assessment():
    user_id = get_jwt_identity()
    result = generate_four_skills_assessment_service(user_id)

    if not result.get("success"):
        return error_response(message=result.get("error", "Lỗi tạo bài test"), code=result.get("code", 500))

    message = (
        "Tiếp tục bài test AI đang làm dở."
        if result.get("reused")
        else "Tạo bài test AI thành công."
    )
    if result.get("is_fallback"):
        message = "Tạo bài test AI bằng bộ câu hỏi dự phòng."

    payload = dict(result.get("data", {}))
    payload["assessment_id"] = result.get("assessment_id")
    payload["is_fallback"] = bool(result.get("is_fallback"))
    return success_response(data=payload, message=message)


@roadmap_bp.route("/assessment/history", methods=["GET"])
@jwt_required()
def get_assessment_history():
    user_id = get_jwt_identity()
    result = get_assessment_history_service(user_id)

    if not result.get("success"):
        return error_response(message=result.get("error", "Không thể lấy lịch sử đánh giá"), code=result.get("code", 500))

    return success_response(data=result.get("data"), message="Lấy lịch sử đánh giá thành công.")


@roadmap_bp.route("/assessment/submit", methods=["POST"])
@jwt_required()
def submit_assessment():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    assessment_id = data.get("assessment_id")
    user_answers = data.get("user_answers")

    if not assessment_id or not user_answers:
        return error_response("Thiếu dữ liệu bài test hoặc câu trả lời", 400)

    result = submit_assessment_service(user_id, int(assessment_id), user_answers)
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Lỗi chấm điểm"),
            code=result.get("code", 500),
        )

    return success_response(data=result.get("data"), message="Chấm điểm hoàn tất.")


@roadmap_bp.route("/assessment/<int:assessment_id>/reset", methods=["POST"])
@jwt_required()
def reset_assessment(assessment_id: int):
    user_id = get_jwt_identity()
    result = reset_assessment_service(user_id, assessment_id)

    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể reset bài đánh giá"),
            code=result.get("code", 500),
        )

    return success_response(data=result.get("data"), message="Reset bài đánh giá thành công.")


@roadmap_bp.route("/generate-blueprint", methods=["POST"])
@jwt_required()
def generate_blueprint():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    try:
        current_score = float(data.get("current_score", 0.0))
        target_score = float(data.get("target_score", 5.0))
        duration_days = int(data.get("duration_days", 30))
    except (TypeError, ValueError):
        return error_response(
            message="Dữ liệu điểm hoặc số ngày không hợp lệ.",
            code=400,
        )

    result = generate_roadmap_blueprint_service(
        user_id,
        current_score,
        target_score,
        duration_days,
    )

    if not result.get("success"):
        return error_response(
            message=result.get("error", "Lỗi tạo lộ trình"),
            code=result.get("code", 500),
        )

    return success_response(data=result.get("data"), message="Tạo lộ trình tổng quan thành công.")


@roadmap_bp.route("/", methods=["GET"])
@jwt_required()
def list_roadmaps():
    user_id = get_jwt_identity()
    result = list_roadmaps_service(user_id)

    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể lấy danh sách lộ trình"),
            code=result.get("code", 500),
        )

    return success_response(data=result.get("data"), message="Lấy danh sách lộ trình thành công.")


@roadmap_bp.route("/<int:roadmap_id>", methods=["GET"])
@jwt_required()
def get_roadmap_detail(roadmap_id: int):
    user_id = get_jwt_identity()
    result = get_roadmap_detail_service(user_id, roadmap_id)

    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể lấy chi tiết lộ trình"),
            code=result.get("code", 500),
        )

    return success_response(data=result.get("data"), message="Lấy chi tiết lộ trình thành công.")


@roadmap_bp.route("/<int:roadmap_id>/task/<int:day_number>", methods=["GET"])
@jwt_required()
def get_daily_task(roadmap_id: int, day_number: int):
    user_id = get_jwt_identity()
    result = get_daily_task_service(user_id, roadmap_id, day_number)

    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể lấy bài học trong ngày"),
            code=result.get("code", 500),
        )

    return success_response(data=result.get("data"), message="Lấy bài học theo ngày thành công.")


@roadmap_bp.route("/<int:roadmap_id>/task/<int:day_number>", methods=["POST"])
@jwt_required()
def generate_daily_task(roadmap_id: int, day_number: int):
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    day_plan = data.get("day_plan")

    if not day_plan:
        topic = data.get("topic", f"Ngày {day_number}")
        day_plan = {"title": topic, "type": "study"}

    result = generate_daily_task_service(user_id, roadmap_id, day_number, day_plan)

    if not result.get("success"):
        return error_response(
            message=result.get("error", "Lỗi tạo bài học"),
            code=result.get("code", 500),
        )

    message = "Dùng lại bài học đã tạo trước đó." if result.get("cached") else "Tạo chi tiết bài học thành công."
    return success_response(data=result.get("data"), message=message)
