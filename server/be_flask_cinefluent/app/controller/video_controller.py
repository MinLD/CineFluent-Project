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

@video_bp.route('/<int:video_id>/subtitles', methods=['GET'])
def get_subtitles(video_id, ordered_subs=None):
    """
    Lấy danh sách phụ đề của một video theo ID.
    Dùng cho ExternalVideoPlayer khi load sub.
    """
    video = Video.query.get(video_id)
    if not video:
        return error_response("Video not found", 404)

    return success_response(data=SubtitleSchema(many=True).dump(ordered_subs))

from flask import Response, stream_with_context
from app.services.google_drive_service import stream_file_content, get_file_metadata
import re

@video_bp.route('/stream/drive/<file_id>', methods=['GET'])
def stream_drive_video(file_id):
    """
    Stream video directly from Google Drive with Range support.
    """
    range_header = request.headers.get('Range', None)
    
    # Get file metadata to know size
    metadata = get_file_metadata(file_id)
    if not metadata:
        return error_response("Video not found", 404)
        
    file_size = int(metadata.get('size', 0))
    mime_type = metadata.get('mimeType', 'video/mp4')
    print(f"[DEBUG] VideoController - Stream ID: {file_id} | Mime: {mime_type}")
    
    byte1, byte2 = 0, None
    if range_header:
        match = re.search(r'bytes=(\d+)-(\d*)', range_header)
        if match:
            groups = match.groups()
            byte1 = int(groups[0])
            if groups[1]:
                byte2 = int(groups[1])
    
    if byte2 is None:
        byte2 = file_size - 1
        
    length = byte2 - byte1 + 1
    
    # Stream content generator
    def generate():

        stream = stream_file_content(file_id, byte1, byte2)
        if stream:
            for chunk in stream:
                yield chunk
        else:
            return
            
    # Response
    resp = Response(stream_with_context(generate()), 
                    status=206, 
                    mimetype=mime_type, 
                    direct_passthrough=True)
    resp.headers.add('Cache-Control', 'no-cache')
    resp.headers.add('Content-Range', f'bytes {byte1}-{byte2}/{file_size}')
    resp.headers.add('Accept-Ranges', 'bytes')
    resp.headers.add('Content-Length', str(length))
    
    return resp

@video_bp.route('/subtitles/parse', methods=['POST'])
def parse_subtitle_file():
    """
    Parse file SRT upload thành JSON.
    Input: File .srt (multipart/form-data)
    Output: JSON array các subtitle lines.
    """
    if 'file' not in request.files:
        return error_response("No file part", 400)
        
    file = request.files['file']
    if file.filename == '':
        return error_response("No selected file", 400)
        
    if not file.filename.endswith('.srt'):
        return error_response("File must be .srt", 400)
        
    try:
        # Đọc nội dung file
        content = file.read().decode('utf-8')
        
        # Import hàm parse từ service cũ (để tận dụng code)
        from app.utils.subtitle_utils import parse_srt
        
        # Parse
        subtitles = parse_srt(content)
        
        return success_response(data=subtitles, message="Parsed successfully")
        
    except UnicodeDecodeError:
        return error_response("File encoding must be UTF-8", 400)
    except Exception as e:
        return error_response(str(e), 500)