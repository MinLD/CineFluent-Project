from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from ..utils.response import success_response, error_response
from ..services.tmdb_service import get_movie_metadata_translated, search_movie
from ..services.video_service import save_subtitles_from_content

tmdb_bp = Blueprint('api/tmdb', __name__)
@jwt_required()
@tmdb_bp.route('/search', methods=['GET'])
def search_tmdb_movies():
    try:
        query = request.args.get('query')
        if not query:
            return error_response("Vui lòng cung cấp từ khóa tìm kiếm", 400)
        
        results = search_movie(query)
        return success_response(data=results)
    except Exception as e:
        print(f"[ERROR] {__name__}: {e}")
        return error_response(str(e), 500) # Ép về 500 để dễ debug

@tmdb_bp.route('/metadata/<int:tmdb_id>', methods=['GET'])
@jwt_required()
def get_tmdb_metadata(tmdb_id):
    """
    Endpoint lấy metadata từ TMDB (đã dịch sang tiếng Việt).
    """
    try:
        metadata = get_movie_metadata_translated(tmdb_id)
        if not metadata:
            return error_response("Không tìm thấy phim trên TMDB", 404)
        return success_response(data=metadata)
    except Exception as e:
        return error_response(str(e), 400)

@tmdb_bp.route('/subtitles/vtt', methods=['POST'])
@jwt_required()
def upload_vtt_subtitles():
    """
    Endpoint nhận file hoặc nội dung VTT (EN/VN) để lưu vào DB của video.
    Body: { "video_id": int, "en_vtt": "string", "vi_vtt": "string" }
    Hoặc có thể nhận multipart/form-data nếu cần upload file.
    """
    try:
        data = request.get_json()
        video_id = data.get('video_id')
        en_vtt = data.get('en_vtt')
        vi_vtt = data.get('vi_vtt')

        if not video_id or (not en_vtt and not vi_vtt):
            return error_response("Thiếu video_id hoặc nội dung vtt phụ đề", 400)

        count = save_subtitles_from_content(video_id, en_vtt, vi_vtt)
        return success_response(message=f"Đã lưu thành công {count} câu phụ đề", data={"count": count})
    except Exception as e:
        return error_response(str(e), 400)
