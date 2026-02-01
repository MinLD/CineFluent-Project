from flask import Blueprint, request
from ..utils.response import success_response, error_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.video_service import import_youtube_video
from ..schemas.video_schema import VideoSchema, VideoDetailSchema, SubtitleSchema
from ..models.models_model import Video, Subtitle

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


@video_bp.route('/<int:video_id>', methods=['GET'])
@jwt_required()
def get_video_detail(video_id):
    video = Video.query.get(video_id)
    if not video:
        return error_response("Không tìm thấy video", 404)

    # Lấy list sub đã sắp xếp
    ordered_subs = video.subtitles.order_by(Subtitle.start_time.asc()).all()

    # Dump data: Truyền video nhưng ghi đè subtitles bằng list đã sort
    result = VideoDetailSchema().dump(video)
    result['subtitles'] = SubtitleSchema(many=True).dump(ordered_subs)

    return success_response(data=result)