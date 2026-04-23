from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..services.grammar_learning_service import (
    generate_grammar_lesson_service,
    generate_grammar_review_service,
    get_existing_grammar_review_service,
    get_grammar_review_by_exercise_service,
    get_grammar_review_history_service,
    submit_grammar_review_service,
)
from ..services.learning_tree_service import (
    discover_learning_tag_service,
    get_learning_tree_service,
    get_learning_tree_summary_service,
)
from ..utils.response import error_response, success_response


learning_tree_bp = Blueprint("learning_tree_bp", __name__)


@learning_tree_bp.route("", methods=["GET"], strict_slashes=False)
@jwt_required()
def get_learning_tree():
    user_id = get_jwt_identity()
    result = get_learning_tree_service(user_id)
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể lấy cây khám phá ngữ pháp"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Lấy cây khám phá ngữ pháp thành công",
        code=200,
    )


@learning_tree_bp.route("/summary", methods=["GET"], strict_slashes=False)
@jwt_required()
def get_learning_tree_summary():
    user_id = get_jwt_identity()
    result = get_learning_tree_summary_service(user_id)
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể lấy tóm tắt cây khám phá ngữ pháp"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Lấy tóm tắt cây khám phá ngữ pháp thành công",
        code=200,
    )


@learning_tree_bp.route("/discover", methods=["POST"], strict_slashes=False)
@jwt_required()
def discover_learning_tag():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    tag_id = data.get("tag_id")
    source = data.get("source", "movie")

    if tag_id is None:
        return error_response(message="Thiếu tag_id", code=400)

    try:
        normalized_tag_id = int(tag_id)
    except (TypeError, ValueError):
        return error_response(message="tag_id không hợp lệ", code=400)

    result = discover_learning_tag_service(
        user_id=user_id,
        tag_id=normalized_tag_id,
        source=source,
    )
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể mở khóa kiến thức ngữ pháp"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Mở khóa kiến thức ngữ pháp thành công",
        code=200,
    )


@learning_tree_bp.route("/tags/<int:tag_id>/lesson", methods=["GET"], strict_slashes=False)
@jwt_required()
def get_grammar_lesson(tag_id: int):
    force_refresh = request.args.get("refresh", default=0, type=int) == 1
    result = generate_grammar_lesson_service(tag_id, force_refresh=force_refresh)
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể tạo bài học ngữ pháp"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Tạo bài học ngữ pháp thành công",
        code=200,
    )


@learning_tree_bp.route("/tags/<int:tag_id>/review", methods=["GET"], strict_slashes=False)
@jwt_required()
def get_grammar_review(tag_id: int):
    question_count = request.args.get("count", default=5, type=int)
    result = get_existing_grammar_review_service(
        tag_id,
        question_count=question_count,
    )
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể lấy bài ôn tập ngữ pháp"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Lấy bài ôn tập ngữ pháp thành công",
        code=200,
    )


@learning_tree_bp.route("/tags/<int:tag_id>/review/generate", methods=["POST"], strict_slashes=False)
@jwt_required()
def generate_grammar_review(tag_id: int):
    data = request.get_json() or {}
    question_count = int(data.get("count") or 5)
    force_refresh = bool(data.get("refresh"))

    result = generate_grammar_review_service(
        tag_id,
        question_count=question_count,
        force_refresh=force_refresh,
    )
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể tạo bài ôn tập ngữ pháp"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Tạo bài ôn tập ngữ pháp thành công",
        code=200,
    )


@learning_tree_bp.route("/reviews/<int:exercise_id>", methods=["GET"], strict_slashes=False)
@jwt_required()
def get_grammar_review_by_exercise(exercise_id: int):
    result = get_grammar_review_by_exercise_service(exercise_id)
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể lấy bộ câu ôn tập"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Lấy bộ câu ôn tập thành công",
        code=200,
    )


@learning_tree_bp.route("/tags/<int:tag_id>/reviews/history", methods=["GET"], strict_slashes=False)
@jwt_required()
def get_grammar_review_history(tag_id: int):
    user_id = get_jwt_identity()
    limit = request.args.get("limit", default=10, type=int)
    result = get_grammar_review_history_service(
        user_id=user_id,
        tag_id=tag_id,
        limit=limit,
    )
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể lấy lịch sử ôn tập"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Lấy lịch sử ôn tập thành công",
        code=200,
    )


@learning_tree_bp.route("/reviews/<int:exercise_id>/submit", methods=["POST"], strict_slashes=False)
@jwt_required()
def submit_grammar_review(exercise_id: int):
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    user_answers = data.get("user_answers") or {}

    result = submit_grammar_review_service(
        user_id=user_id,
        exercise_id=exercise_id,
        user_answers=user_answers,
    )
    if not result.get("success"):
        return error_response(
            message=result.get("error", "Không thể lưu kết quả bài ôn tập"),
            code=result.get("code", 500),
        )

    return success_response(
        data=result.get("data"),
        message="Lưu kết quả bài ôn tập thành công",
        code=200,
    )
