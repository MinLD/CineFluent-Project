from flask import Blueprint, request
from ..utils.response import success_response, error_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.video_service import import_youtube_video, get_all_videos, delete_video_youtube
from ..schemas.video_schema import VideoSchema, VideoDetailSchema, SubtitleSchema
from ..models.models_model import Video, Subtitle
from ..extensions import db
video_bp = Blueprint('api/videos', __name__)


@video_bp.route('/import', methods=['POST'])
@jwt_required()
def controller_import_video():
    data = request.get_json()
    url = data.get('url')
    level = data.get('level', 'Intermediate')
    uid = get_jwt_identity()

    if not url:  # Chỉ cần url là đủ
        return error_response("Thiếu link video", 400)

    try:
        # Gọi service với tham số đã rút gọn
        video = import_youtube_video(url, level, uid)
        return success_response(data=VideoSchema().dump(video), message="Thêm phim thành công")
    except Exception as e:
        return error_response(str(e), 400)

@video_bp.route('/<int:video_id>', methods=['DELETE'])
def controller_delete_video(video_id):
    delete_video_youtube(video_id)
    return success_response(message='video deleted successfully')


@video_bp.route('/', methods=['GET'])
def get_videos():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    cat_id = request.args.get('category_id', type=int)

    result = get_all_videos(page, per_page, cat_id)
    return success_response(data=result)

@video_bp.route('/<string:slug>', methods=['GET'])
def get_detail(slug: str):
    video = Video.query.filter_by(slug=slug).first()
    if not video:
        return error_response("Không tìm thấy phim", 404)

    # Sắp xếp phụ đề theo thời gian để người dùng học đúng thứ tự
    ordered_subs = Subtitle.query.filter_by(video_id=video.id).order_by(Subtitle.start_time.asc()).all()

    # Tăng lượt xem (tùy chọn)
    video.view_count += 1
    db.session.commit()

    res_data = VideoDetailSchema().dump(video)
    res_data['subtitles'] = SubtitleSchema(many=True).dump(ordered_subs)

    return success_response(data=res_data)