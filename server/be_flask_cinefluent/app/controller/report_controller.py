from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.models_model import VideoReport, Video, User
from ..extensions import db
from ..utils.response import success_response, error_response
import logging

report_bp = Blueprint('report_bp', __name__)
logger = logging.getLogger(__name__)

@report_bp.route('/', methods=['POST'])
@jwt_required()
def create_report():
    try:
        
        current_user_id = get_jwt_identity()
        data = request.get_json()

        video_id = data.get('video_id')
        issue_type = data.get('issue_type')
        description = data.get('description', '')

        if not video_id or not issue_type:
            return error_response(message="Thiếu thông tin video_id hoặc issue_type", code=400)

        # Kiểm tra video tồn tại
        video = Video.query.get(video_id)
        if not video:
            return error_response(message="Video không tồn tại", code=404)

        # Tạo report mới
        new_report = VideoReport(
            user_id=current_user_id,
            video_id=video_id,
            issue_type=issue_type,
            description=description,
            status='PENDING'
        )

        db.session.add(new_report)
        db.session.commit()

        return success_response(
            message="Báo cáo lỗi đã được gửi thành công, cảm ơn bạn!",
            data={"report_id": new_report.id},
            code=201
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Lỗi khi gửi báo cáo video: {str(e)}")
        return error_response(message="Có lỗi xảy ra khi gửi báo cáo", code=500)

@report_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_reports():
    # TODO: Add Admin check here
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 5, type=int)

        pagination = VideoReport.query.order_by(VideoReport.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        reports = pagination.items

        result = []
        for r in reports:
            # Lấy thông tin user (email hoặc tên)
            user_info = "Unknown"
            if r.user:
                user_info = r.user.profile.fullname if (r.user.profile and r.user.profile.fullname) else r.user.email

            result.append({
                "id": r.id,
                "user_id": r.user_id,
                "user_info": user_info,
                "video_id": r.video_id,
                "video_title": r.video.title if r.video else "Unknown",
                "issue_type": r.issue_type,
                "description": r.description,
                "status": r.status,
                "created_at": r.created_at.isoformat()
            })
            
        return success_response(data={
            "reports": result,
            "pagination": {
                "current_page": pagination.page,
                "total_pages": pagination.pages,
                "total_items": pagination.total,
                "per_page": pagination.per_page,
            }
        })
    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách báo cáo: {str(e)}")
        return error_response(message="Có lỗi xảy ra", code=500)

@report_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_report(id):
    # TODO: Add Admin check here
    try:
        video_report = VideoReport.query.get(id)
        if not video_report:
            return error_response(message="Không tìm thấy báo lỗi này", code=404)

        db.session.delete(video_report)
        db.session.commit()
        return success_response(message="Xóa báo cáo lỗi thành công")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Lỗi khi xóa báo lỗi video: {str(e)}")
        return error_response(message="Có lỗi xảy ra", code=500)
