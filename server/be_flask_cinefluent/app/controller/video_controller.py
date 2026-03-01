from flask import Blueprint, request
from ..utils.response import success_response, error_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.video_service import (
    import_youtube_video, 
    get_all_videos, 
    delete_video_youtube, 
    import_local_video_by_tmdb, 
    import_video_local
)
from ..services.upload_service import upload_file
from ..schemas.video_schema import VideoSchema, VideoDetailSchema, SubtitleSchema, ImportYoutubeRequest, ImportLocalRequest, ImportLocalManualRequest, UpdateVideoRequest
from ..models.models_model import Video, Subtitle
from ..extensions import db
from google.auth.transport.requests import Request
import requests
import os
video_bp = Blueprint('api/videos', __name__)


@video_bp.route('/import/youtube', methods=['POST'])
@jwt_required()
def controller_import_youtube():
    req_data = ImportYoutubeRequest(**request.get_json())
    uid = get_jwt_identity()

    from flask import Response, stream_with_context
    import json

    def generate_progress():
        try:
            for progress in import_youtube_video(
                user_id=uid, 
                data=req_data
            ):
                yield json.dumps(progress) + "\n"
        except Exception as ex:
            yield json.dumps({"status": "error", "message": str(ex)}) + "\n"
    
    return Response(stream_with_context(generate_progress()), mimetype='application/json')

@video_bp.route('/import/local/tmdb', methods=['POST'])
@jwt_required()
def controller_import_local_by_tmdb():
    req_data = ImportLocalRequest(**request.get_json())
    uid = get_jwt_identity()

    video = import_local_video_by_tmdb(
        user_id=uid, 
        data=req_data
    )
    return success_response(data=VideoSchema().dump(video), message="Thêm phim thành công", code=201)

@video_bp.route('/import/local', methods=['POST'])
@jwt_required()
def importVideoLocal():
    # 1. Thu thập dữ liệu từ request.form
    form_dict = request.form.to_dict()
    
    # 2. Xử lý category_ids (Lấy danh sách ID từ form-data)
    cat_ids_raw = request.form.getlist('category_ids')
    category_ids = []
    for cid in cat_ids_raw:
        try:
            # Nếu gửi chuỗi JSON "[1,2]" hoặc gửi ID lẻ
            if cid.startswith('['):
                import json
                category_ids.extend(json.loads(cid))
            else:
                category_ids.append(int(cid))
        except:
            continue
    form_dict['category_ids'] = category_ids

    # 3. Xử lý File Upload (Linh hoạt: chấp nhận cả Key là _url hoặc _file)
    file_map = {
        'thumbnail_file': 'thumbnail_url',
        'thumbnail_url': 'thumbnail_url',
        'backdrop_file': 'backdrop_url',
        'backdrop_url': 'backdrop_url'
    }

    for file_key, target_field in file_map.items():
        if file_key in request.files:
            file_obj = request.files[file_key]
            if file_obj.filename != '':
                upload_res = upload_file(file_obj)
                if upload_res:
                    form_dict[target_field] = upload_res['secure_url']

    # 4. Validate bằng Schema (Sử dụng đối tượng Schema chuyên nghiệp)
    req_data = ImportLocalManualRequest(**form_dict)
    uid = get_jwt_identity()

    video = import_video_local(user_id=uid, data=req_data)
    
    return success_response(
        data=VideoSchema().dump(video), 
        message="Thêm phim thành công", 
        code=201
    )

@video_bp.route('/<int:video_id>', methods=['DELETE'])
def controller_delete_video(video_id):
    delete_video_youtube(video_id)
    return success_response(message='video deleted successfully')

@video_bp.route('/', methods=['GET'])
def get_videos():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    cat_id = request.args.get('category_id', type=int)
    release_year = request.args.get('release_year', type=int)
    source_type = request.args.get('source_type')
    status = request.args.get('status', 'public') # Mặc định chỉ lấy phim public
    keyword = request.args.get('keyword')

    if source_type and source_type not in ['youtube', 'local']:
        raise ValueError(f'source_type: {source_type} is not valid')

    result = get_all_videos(page, per_page, cat_id, release_year, source_type, status, keyword)
    return success_response(data=result)

@video_bp.route('/<string:slug>', methods=['GET'])
def get_detail(slug: str):
    video = Video.query.filter_by(slug=slug).first()
    if not video:
        return error_response("Không tìm thấy phim", 404)
    
    if video.status == 'private':
        # Tạm thời cho phép xem nếu có token (có thể check role admin sau)
        # Nhưng theo yêu cầu viewer không được xem phim private
        return error_response("Phim này hiện đang ở chế độ riêng tư", 403)



    # Tăng lượt xem (tùy chọn)
    video.view_count += 1
    db.session.commit()

    res_data = VideoDetailSchema().dump(video)

    return success_response(data=res_data)

@video_bp.route('/<int:video_id>', methods=['GET'])
def get_video_detail_by_id(video_id):
    from ..services.video_service import get_video_by_id
    video = get_video_by_id(video_id)
    if not video:
        return error_response("Video not found", 404)
    return success_response(data=VideoDetailSchema().dump(video))

@video_bp.route('/<int:video_id>', methods=['PATCH'])
@jwt_required()
def update_video_info(video_id):
    from ..services.video_service import update_video
    
    # 1. Thu thập dữ liệu (Thống nhất dùng Form-data theo yêu cầu)
    data_dict = request.form.to_dict()
    
    # Xử lý category_ids từ form-data (Có thể nhận mảng [1, 2] hoặc từng ID lẻ)
    cat_ids_raw = request.form.getlist('category_ids')
    if cat_ids_raw:
        category_ids = []
        for cid in cat_ids_raw:
            try:
                if cid.startswith('['):
                    import json
                    category_ids.extend(json.loads(cid))
                else:
                    category_ids.append(int(cid))
            except: continue
        data_dict['category_ids'] = list(set(category_ids)) # Loại bỏ ID trùng lặp

    # 2. Xử lý File Upload nếu có (PATCH ảnh)
    file_map = {
        'thumbnail_url': 'thumbnail_url',
        'thumbnail_file': 'thumbnail_url',
        'backdrop_url': 'backdrop_url',
        'backdrop_file': 'backdrop_url'
    }

    for file_key, target_field in file_map.items():
        if file_key in request.files:
            file_obj = request.files[file_key]
            if file_obj.filename != '':
                upload_res = upload_file(file_obj)
                if upload_res:
                    data_dict[target_field] = upload_res['secure_url']

    # 3. Validate bằng Pydantic Model và thực hiện Update
    req_data = UpdateVideoRequest(**data_dict)
    updated_video = update_video(video_id, req_data)
    
    return success_response(
        data=VideoDetailSchema().dump(updated_video), 
        message="Cập nhật phim thành công"
    )

@video_bp.route('/<int:video_id>/subtitles', methods=['GET'])
def get_subtitles(video_id, ordered_subs=None):
    video = Video.query.get(video_id)
    if not video:
        return error_response("Video not found", 404)

    return success_response(data=SubtitleSchema(many=True).dump(ordered_subs))

from flask import Response, stream_with_context
from app.services.google_drive_service import stream_file_content, get_file_metadata, get_drive_service
import re

drive_service = get_drive_service()
def generate(file_id, start, end):
    try:
        creds = drive_service._creds
        if not creds.valid:
            creds.refresh(Request())

        url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media"
        headers = {"Authorization": f"Bearer {creds.token}", "Range": f"bytes={start}-{end}"}

        # Sử dụng stream=True giúp xả chunk ngay lập tức
        with requests.get(url, headers=headers, stream=True, timeout=(3.0, 10.0)) as r:
            for chunk in r.iter_content(chunk_size=512 * 1024):  # 512KB
                if chunk:
                    yield chunk
    except (ConnectionResetError, StopIteration):
        # Đây là chỗ xử lý lỗi 10054 lặng lẽ
        print("[INFO] Stream interrupted by user (seeking/closing).")
    except Exception as e:
        print(f"[ERROR] Stream failed: {e}")

@video_bp.route('/stream/drive/<file_id>', strict_slashes=False)
def stream_drive_video(file_id):

    service = get_drive_service()
    if not service:
        return {"error": "Drive service not initialized"}, 500

    creds = service._creds
    if not creds.valid:
        creds.refresh(Request())

    metadata = get_file_metadata(file_id)
    if not metadata:
        return {"error": "Video not found"}, 404

    file_size = int(metadata.get('size', 0))
    mime_type = metadata.get('mimeType', 'video/mp4')
    file_name = metadata.get('name', 'video.mp4')
    google_drive_url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media"

    # 2. KIỂM TRA MÔI TRƯỜNG: Nếu có Header X-Accel-Mapping hoặc đang chạy qua Nginx
    # Thường thì trên Production chúng ta sẽ set một biến môi trường FLASK_ENV
    is_production = os.getenv('FLASK_ENV') == 'production'

    if is_production:
        # --- PHƯƠNG ÁN PRODUCTION: Giao việc cho Nginx ---
        response = Response(None)
        # Sử dụng URL trỏ đích /internal_drive_stream/<file_id>
        response.headers['X-Accel-Redirect'] = f'/internal_drive_stream/{file_id}'
        
        # Không cần X-Video-Url nữa vì Nginx tự tạo
        response.headers['X-Google-Token'] = f"Bearer {creds.token}"
        response.headers['Content-Type'] = mime_type
        response.headers['Content-Disposition'] = f"inline; filename=\"{file_name}\""
        response.headers['X-Streaming-By'] = "Nginx-Accel"
        # Nginx Slice Module sẽ tự xử lý Range Header dựa trên cấu hình 1MB của bạn
        return response

    else:
        range_header = request.headers.get('Range', None)
        byte1, byte2 = 0, None

        if range_header:
            match = re.search(r'bytes=(\d+)-(\d*)', range_header)
            if match:
                byte1 = int(match.group(1))
                if match.group(2):
                    byte2 = int(match.group(2))

        if byte2 is None:
            byte2 = file_size - 1

        length = byte2 - byte1 + 1

        resp = Response(
            stream_with_context(generate(file_id, byte1, byte2)),
            status=206,
            mimetype=mime_type,
            direct_passthrough=True
        )
        resp.headers.add('Content-Range', f'bytes {byte1}-{byte2}/{file_size}')
        resp.headers.add('Accept-Ranges', 'bytes')
        resp.headers.add('Content-Length', str(length))
        resp.headers.add('X-Streaming-By', 'Flask-Python')
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



@video_bp.route('/<int:video_id>/subtitles/upload', methods=['POST'])
@jwt_required()
def upload_subtitles(video_id):
    from ..services.video_service import save_subtitles_from_content
    
    en_file = request.files.get('en_file')
    vi_file = request.files.get('vi_file')

    if not en_file and not vi_file:
        return error_response("Bạn cần upload ít nhất một file phụ đề (en_file hoặc vi_file)", 400)
    
    def safe_decode(file_obj) -> str:
        if not file_obj: return ""
        raw_bytes = file_obj.read()
        
        # Danh sách các bảng mã ưu tiên (Đặc biệt thêm cp1258 cho sub Việt cũ)
        encodings = ['utf-8', 'utf-16', 'cp1258', 'windows-1252', 'latin-1']
        
        for enc in encodings:
            try:
                return raw_bytes.decode(enc)
            except UnicodeDecodeError:
                continue
                
        # Nếu tất cả fail, fallback về decode dạng càn quét bỏ lỗi chữ
        return raw_bytes.decode('utf-8', errors='replace')

    try:
        # Đọc nội dung file với cơ chế rà soát bảng mã an toàn
        en_content = safe_decode(en_file)
        vi_content = safe_decode(vi_file)
        
        # Gọi hàm xử lý hợp nhất (Tự động nhận diện định dạng bên trong service)
        count = save_subtitles_from_content(video_id, en_content, vi_content)
        
        return success_response(
            data={"count": count}, 
            message=f"Đã xử lý và lưu thành công {count} dòng phụ đề. (Hệ thống đã tự động nhận diện từ file bạn gửi)"
        )
    except Exception as e:
        return error_response(f"Lỗi khi xử lý phụ đề: {str(e)}", 500)

@video_bp.route('/<int:video_id>/subtitles', methods=['DELETE'])
@jwt_required()
def controller_delete_all_subtitles(video_id):
    from ..services.video_service import delete_all_subtitles
    try:
        delete_all_subtitles(video_id)
        return success_response(message="Đã xóa toàn bộ phụ đề thành công")
    except Exception as e:
        return error_response(str(e), 500)
