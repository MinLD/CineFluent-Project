from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.models_model import MovieRequest, User
from ..extensions import db
from ..utils.response import success_response, error_response
import logging

request_bp = Blueprint('request_bp', __name__)
logger = logging.getLogger(__name__)

@request_bp.route('/', methods=['POST'])
@jwt_required()
def create_request():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        title = data.get('title')
        note = data.get('note', '')

        if not title:
            return error_response(message="Tên phim là bắt buộc!", code=400)

        # Tạo request mới
        new_request = MovieRequest(
            user_id=current_user_id,
            title=title,
            note=note,
            status='PENDING'
        )

        db.session.add(new_request)
        db.session.commit()

        return success_response(
            message="Yêu cầu phim đã được gửi đi! Admin sẽ sớm thêm vào bộ sưu tập!",
            data={"request_id": new_request.id},
            code=201
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Lỗi khi gửi yêu cầu phim mới: {str(e)}")
        return error_response(message="Có lỗi hệ thống khi gửi tin báo", code=500)

@request_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_requests():
    # TODO: Add Admin check here
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 5, type=int)

        pagination = MovieRequest.query.order_by(MovieRequest.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        requests = pagination.items
        result = []
        for r in requests:
            # Lấy thông tin user (email hoặc tên)
            user_info = "Unknown"
            if r.user:
                user_info = r.user.profile.fullname if (r.user.profile and r.user.profile.fullname) else r.user.email

            result.append({
                "id": r.id,
                "user_id": r.user_id,
                "user_info": user_info,
                "title": r.title,
                "note": r.note,
                "status": r.status,
                "created_at": r.created_at.isoformat()
            })
            
        return success_response(data={
            "requests": result,
            "pagination": {
                "current_page": pagination.page,
                "total_pages": pagination.pages,
                "total_items": pagination.total,
                "per_page": pagination.per_page,
            }
        })
    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách yêu cầu phim: {str(e)}")
        return error_response(message="Có lỗi xảy ra", code=500)

@request_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_request(id):
    # TODO: Add Admin check here
    try:
        movie_request = MovieRequest.query.get(id)
        if not movie_request:
            return error_response(message="Không tìm thấy yêu cầu này", code=404)

        db.session.delete(movie_request)
        db.session.commit()
        return success_response(message="Xóa yêu cầu phim thành công")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Lỗi khi xóa yêu cầu phim: {str(e)}")
        return error_response(message="Có lỗi xảy ra", code=500)
