import os
import json
import tempfile
import time
import shutil
import glob
import traceback
import yt_dlp
from datetime import timedelta
from slugify import slugify
from deep_translator import GoogleTranslator

# Global Translator instance
translator = GoogleTranslator(source='en', target='vi')

def translate_with_retry(text, max_retries=3):
    """Dịch với retry logic cho rate limiting"""
    for attempt in range(max_retries):
        try:
            return translator.translate(text)
        except Exception as e:
            error_str = str(e)
            if '429' in error_str or 'Too Many Requests' in error_str or 'rate' in error_str.lower():
                if attempt < max_retries - 1:
                    wait_time = (2 ** attempt) * 2  # Exponential backoff: 2s, 4s, 8s
                    print(f"      ⚠️ Rate limited, waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                else:
                    raise Exception(f"Rate limit exceeded after {max_retries} retries")
            else:
                raise
    return text

from ..models.models_model import Video, Subtitle, Category
from ..extensions import db, socketio
from ..schemas.video_schema import VideoSchema
from ..utils.subtitle_utils import parse_vtt
from .tmdb_service import search_movie_by_tmdb
from .learning_service import suggest_multiple_categories
from ..schemas.video_schema import (
    ImportYoutubeRequest, 
    ImportLocalRequest, 
    ImportLocalManualRequest,
    UpdateVideoRequest
)

# --- CONFIGURATION & PATHS ---
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
COOKIE_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "../utils/www.youtube.com_cookies.txt"))

def fetch_youtube_metadata(url):
    """Sử dụng yt-dlp để lấy Title và Thumbnail từ link YouTube."""
    ydl_opts = {'quiet': True, 'no_warnings': True}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        return {
            'title': info.get('title'),
            'thumbnail': info.get('thumbnail'),
            'duration': info.get('duration'),
            'youtube_id': info.get('id'),
            'description': info.get('description')
        }
def delete_video_youtube(id):
    video = Video.query.get(id)
    if not video:
        raise ValueError('Video id {} not found'.format(id))
    db.session.delete(video)
    db.session.commit()
def create_unique_slug(model, base_title, max_length=100):
    base_slug = slugify(base_title)[:max_length]
    slug = base_slug
    counter = 1
    while model.query.filter_by(slug=slug).first():
        suffix = f"-{counter}"
        slug = f"{base_slug[:max_length - len(suffix)]}{suffix}"
        counter += 1

    return slug


def import_youtube_video(user_id, data: ImportYoutubeRequest):
    """
    Hàm này được chuyển thành Generator để yield thông báo tiến độ.
    """
    url = data.url
    yield {"status": "processing", "message": "Đang lấy thông tin video từ YouTube...", "step": 1}
    meta = fetch_youtube_metadata(url)
    yt_id = meta['youtube_id']
    canonical_url = f"https://www.youtube.com/watch?v={yt_id}"

    # 1. Xử lý Categories
    youtube_category = Category.query.filter_by(slug='youtube').first()
    if not youtube_category:
        youtube_category = Category(
            name='YouTube', 
            slug='youtube', 
            description='Danh mục tổng hợp các video từ YouTube'
        )
        db.session.add(youtube_category)
        db.session.flush()
    
    categories = [youtube_category]
    if data.category_ids:
        additional_cats = Category.query.filter(Category.id.in_(data.category_ids)).all()
        for cat in additional_cats:
            if cat.id != youtube_category.id:
                categories.append(cat)

    # 2. Kiểm tra Video tồn tại chưa (Sử dụng Canonical URL hoặc YouTube ID)
    video = Video.query.filter(
        (Video.source_url == canonical_url) | 
        (Video.source_url.contains(yt_id))
    ).first()

    if video:
        # Cập nhật thêm categories nếu chưa có
        for cat in categories:
            if cat not in video.categories:
                video.categories.append(cat)
        
        # Nếu URL cũ không phải canonical, cập nhật lại luôn cho đẹp
        if video.source_url != canonical_url:
            video.source_url = canonical_url
            
        db.session.commit()
        yield {"status": "completed", "message": "Video này đã tồn tại trong hệ thống. Đã cập nhật danh mục.", "video_id": video.id}
        return

    try:
        # Tạo thư mục tạm
        temp_dir = tempfile.mkdtemp()
        # Cấu hình yt-dlp
        ydl_opts = {
            'skip_download': True,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': ['en', 'vi'],
            'subtitlesformat': 'json3',
            'outtmpl': os.path.join(temp_dir, '%(id)s.%(ext)s'),
            'quiet': True,
            'no_warnings': True,
        }

        if os.path.exists(COOKIE_PATH):
            ydl_opts['cookiefile'] = COOKIE_PATH
            print(f"Using cookies")

        # Download subtitles và lấy metadata
        print(f"Downloading subtitles for: {url}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract info để lấy metadata
            info = ydl.extract_info(url, download=False)

            # Kiểm tra subtitle metadata
            subtitles = info.get('subtitles', {})
            automatic_captions = info.get('automatic_captions', {})

            # Log thông tin subtitle
            print("\nSubtitle Information:")
            print(f"   Manual subtitles available: {list(subtitles.keys())}")
            print(f"   Auto-generated captions available: {list(automatic_captions.keys())}")

            # Kiểm tra tiếng Anh
            if 'en' in subtitles:
                print(f"   English: MANUAL (human-created)")
                en_type = "manual"
            elif 'en' in automatic_captions:
                print(f"   English: AUTO-GENERATED")
                en_type = "auto"
            else:
                print(f"   English: NOT FOUND")
                en_type = "none"

            # Kiểm tra tiếng Việt
            if 'vi' in subtitles:
                print(f"   Vietnamese: MANUAL (human-created)")
                vi_type = "manual"
            elif 'vi' in automatic_captions:
                print(f"   Vietnamese: AUTO-GENERATED")
                vi_type = "auto"
            else:
                print(f"   Vietnamese: NOT FOUND (will use auto-translate)")
                vi_type = "translated"

            print()  # Empty line for readability

            yield {"status": "processing", "message": f"Đang tải phụ đề ({en_type}/{vi_type})...", "step": 2}
            # Download subtitles
            ydl.download([url])

        # Parse subtitle files
        def parse_json3_file(filepath):
            """Parse subtitle từ file json3"""
            if not os.path.exists(filepath):
                return []

            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)

            result = []
            for event in data.get('events', []):
                if 'segs' in event and event.get('segs'):
                    text = ''.join(seg.get('utf8', '') for seg in event['segs'])
                    if text.strip():
                        result.append({
                            'text': text.strip(),
                            'start': event.get('tStartMs', 0) / 1000.0,
                            'duration': event.get('dDurationMs', 0) / 1000.0
                        })
            return result

        # Tìm file subtitle đã download
        en_file = os.path.join(temp_dir, f"{yt_id}.en.json3")
        vi_file = os.path.join(temp_dir, f"{yt_id}.vi.json3")

        # Tìm file subtitle đã download
        if not os.path.exists(en_file):
            en_files = glob.glob(os.path.join(temp_dir, f"{yt_id}.en*.json3"))
            if en_files:
                en_file = en_files[0]

        if not os.path.exists(vi_file):
            vi_files = glob.glob(os.path.join(temp_dir, f"{yt_id}.vi*.json3"))
            if vi_files:
                vi_file = vi_files[0]

        print(f"Temp directory: {temp_dir}")
        print(f"English file: {en_file} (exists: {os.path.exists(en_file)})")
        print(f"Vietnamese file: {vi_file} (exists: {os.path.exists(vi_file)})")

        # Parse English subtitles
        transcript = parse_json3_file(en_file)
        if not transcript:
            raise ValueError("Không tìm thấy phụ đề tiếng Anh")

        print(f"Got {len(transcript)} English entries ({en_type})")

        # Dịch subtitle bằng Google Translate API (BATCH MODE - Tối ưu động)
        print("Translating subtitles using Google Translate (Dynamic Batch mode)...")
        
        # Tái sử dụng translator toàn cục
        # Tính batch size động dựa trên độ dài text
        total_chars = sum(len(item['text']) for item in transcript)
        avg_chars = total_chars / len(transcript) if transcript else 50
        
        MAX_CHARS_PER_BATCH = 4500
        SEPARATOR = ' |||SUBTITLE_SEP||| '
        SEPARATOR_LENGTH = len(SEPARATOR)
        
        BATCH_SIZE = int(MAX_CHARS_PER_BATCH / (avg_chars + SEPARATOR_LENGTH))
        BATCH_SIZE = max(10, min(BATCH_SIZE, 200))
        
        transcript_vi = []
        total_batches = (len(transcript) + BATCH_SIZE - 1) // BATCH_SIZE
        print(f"   🎯 Optimal batch size: {BATCH_SIZE}, Total batches: {total_batches}")
        yield {"status": "processing", "message": f"Đang dịch {len(transcript)} câu phụ đề (chia làm {total_batches} đợt)...", "step": 3}
        
        for batch_idx in range(0, len(transcript), BATCH_SIZE):
            batch_num = (batch_idx // BATCH_SIZE) + 1
            batch = transcript[batch_idx:batch_idx + BATCH_SIZE]
            
            # Tính số ký tự trong batch này
            batch_chars = sum(len(item['text']) for item in batch)
            
            try:
                # Gộp tất cả câu trong batch thành 1 string
                combined_text = SEPARATOR.join([item['text'] for item in batch])
                
                print(f"   📦 Batch {batch_num}/{total_batches}: {len(batch)} subtitles ({batch_chars} chars)...")
                
                # Dịch 1 lần cho cả batch với retry
                translated_combined = translate_with_retry(combined_text)
                
                # Tách lại thành các câu riêng lẻ
                translated_parts = translated_combined.split('|||SUBTITLE_SEP|||')
                
                # Clean up whitespace
                translated_parts = [part.strip() for part in translated_parts]
                
                # Kiểm tra số lượng có khớp không
                if len(translated_parts) != len(batch):
                    print(f"      ⚠️ Warning: Expected {len(batch)} parts, got {len(translated_parts)}")
                    # Fallback: dịch từng câu nếu batch translation fail
                    print(f"      🔄 Falling back to single-sentence translation...")
                    translated_parts = []
                    for item in batch:
                        try:
                            vi_text = translate_with_retry(item['text'])
                            translated_parts.append(vi_text)
                        except:
                            translated_parts.append('')
                
                # Thêm vào kết quả
                for i, item in enumerate(batch):
                    vi_text = translated_parts[i] if i < len(translated_parts) else ''
                    transcript_vi.append({
                        'text': vi_text,
                        'start': item['start'],
                        'duration': item['duration']
                    })
                
                print(f"      ✅ Batch {batch_num}/{total_batches} completed!")
                yield {"status": "processing", "message": f"Đã dịch xong {min(batch_idx + BATCH_SIZE, len(transcript))}/{len(transcript)} câu...", "step": 3}
                
                # Thêm delay nhỏ giữa các batch để tránh rate limit
                if batch_num < total_batches:
                    time.sleep(0.5)
                
            except Exception as e:
                print(f"      ❌ Batch {batch_num} failed: {str(e)}")
                print(f"      🔄 Falling back to single-sentence translation...")
                
                # Fallback: dịch từng câu
                for item in batch:
                    try:
                        vi_text = translate_with_retry(item['text'])
                    except:
                        vi_text = ''
                    
                    transcript_vi.append({
                        'text': vi_text,
                        'start': item['start'],
                        'duration': item['duration']
                    })
                    time.sleep(0.3)  # Delay nhỏ giữa các câu
        
        print(f"✅ Translated {len(transcript_vi)}/{len(transcript)} subtitles successfully (Dynamic Batch mode)")

        # Cleanup temp files
        shutil.rmtree(temp_dir, ignore_errors=True)

        # 3. Khởi tạo Object Video
        raw_title = meta['title']
        translated_title = translate_with_retry(raw_title)
        
        video = Video(
            source_type='youtube',
            source_url=canonical_url,
            original_title=raw_title,
            title=translated_title,
            description=meta.get('description'),
            thumbnail_url=meta['thumbnail'],
            level=data.level,
            slug = create_unique_slug(Video, translated_title), # Dùng title dịch cho slug
            author = meta.get('author'),
            country = meta.get('country'),
            status = data.status
        )
        # Gán danh sách categories (N-N)
        video.categories = categories
        db.session.add(video)
        db.session.flush()

        # 4. Lưu phụ đề
        saved_count = 0
        for i, item in enumerate(transcript):
            if item['text']:
                db.session.add(Subtitle(
                    video_id=video.id,
                    start_time=item['start'],
                    end_time=item['start'] + item['duration'],
                    content_en=item['text'],
                    content_vi=transcript_vi[i]['text']
                ))
                saved_count += 1

        print(f"💾 Saved {saved_count} subtitle entries")
        print(f"📊 Summary: EN={en_type}, VI={vi_type}\n")

        db.session.commit()
        
        # [VTT_OPTIMIZATION] Tự động xuất file VTT ngay sau khi lưu DB thành công
        yield {"status": "processing", "message": "Đang khởi tạo file phụ đề VTT tối ưu...", "step": 4}
        export_subtitle_to_vtt(video.id)

        yield {"status": "completed", "message": "Hoàn tất! Video đã sẵn sàng trên hệ thống.", "video_id": video.id}
        return

    except Exception as e:
        db.session.rollback()
        print(f"❌ Error: {str(e)}")
        print(traceback.format_exc())
        print(traceback.format_exc())
        raise ValueError(f"Lỗi nhập liệu từ YouTube: {str(e)}")

def import_local_video_by_tmdb(user_id, data: ImportLocalRequest): 
    tmdb_id = data.tmdb_id
    movie = search_movie_by_tmdb(tmdb_id)       
    if not movie:
        raise ValueError(f"Không tìm thấy phim với TMDB ID {tmdb_id}")

    # 0. Kiểm tra Video đã tồn tại theo TMDB ID chưa
    if Video.query.filter_by(tmdb_id=tmdb_id).first():
        raise ValueError(f"Phim với TMDB ID {tmdb_id} đã tồn tại")

    
    # 1. AI gợi ý Categories dựa trên Tiêu đề và Năm
    ai_res = suggest_multiple_categories(movie['title'], movie['year'])
    category_names = ai_res.get("data", []) if ai_res.get("success") else ["Phim"]
    
    # Chuẩn hóa tên Category (Viết hoa chữ cái đầu)
    categories = []
    for name in category_names:
        name = name.strip().title()
        slug = slugify(name)
        if not slug: continue
        
        # Tìm hoặc tạo mới Category
        category = Category.query.filter_by(slug=slug).first()
        if not category:
            category = Category(
                name=name,
                slug=slug,
                description=f"Phim thuộc thể loại {name}"
            )
            db.session.add(category)
            db.session.flush() # Lấy ID ngay lập tức
        
        if category not in categories:
            categories.append(category)

    # 2. Tạo đối tượng Video mới nếu chưa có
    video = Video(
        source_type='local',
        tmdb_id=tmdb_id,
        title=movie['title'],
        original_title=movie.get('original_title'),
        description=movie['overview'],
        author=movie.get('author') or "Unknown",
        country=movie.get('country') or "Unknown",
        release_year=movie.get('year'),
        thumbnail_url=movie['poster_path'],
        backdrop_url=movie['backdrop_path'],
        level='Intermediate', 
        slug=create_unique_slug(Video, movie['title']),
        view_count=0,
        runtime=movie.get('runtime'),
        status='private' # Mặc định là private để admin duyệt trước
    )
    video.categories = categories # Gán quan hệ n-n
    
    db.session.add(video)
    db.session.commit()
 
    return video

def import_video_local(user_id, data: ImportLocalManualRequest):
    # 1. Xử lý Categories từ danh sách ID
    categories = []
    if data.category_ids:
        categories = Category.query.filter(Category.id.in_(data.category_ids)).all()

    # 2. Tạo đối tượng Video bằng cách truy cập trực tiếp thuộc tính của Model
    video = Video(
        tmdb_id=data.tmdb_id,
        source_type='local',
        title=data.title,
        original_title=data.original_title,
        description=data.description,
        author=data.author or "Unknown",
        country=data.country or "Unknown",
        release_year=data.release_year,
        thumbnail_url=data.thumbnail_url,
        backdrop_url=data.backdrop_url,
        runtime=data.runtime,
        level=data.level,
        status=data.status,
        slug=create_unique_slug(Video, data.title),
        view_count=0
    )
    
    # Gán categories (N-N)
    if categories:
        video.categories = categories
    
    db.session.add(video)
    db.session.commit()

    return video

def save_subtitles_from_content(video_id, en_content, vi_content=None):
    """
    Parse và lưu phụ đề từ nội dung text (SRT hoặc VTT) vào database.
    Tự động nhận diện định dạng dựa trên nội dung.
    """
    from ..utils.subtitle_utils import parse_vtt, parse_srt
    
    video = Video.query.get(video_id)
    if not video:
        raise ValueError(f"Video ID {video_id} không tồn tại")

    # Xóa sub cũ
    Subtitle.query.filter_by(video_id=video_id).delete()

    # Nhận diện định dạng cho file Anh
    if en_content:
        parser_en = parse_vtt if 'WEBVTT' in en_content.upper() else parse_srt
        en_subs = parser_en(en_content)
    else:
        en_subs = []
    
    # Nhận diện định dạng cho file Việt
    vi_subs = []
    if vi_content:
        parser_vi = parse_vtt if 'WEBVTT' in vi_content.upper() else parse_srt
        vi_subs = parser_vi(vi_content)

    # Sắp xếp để đảm bảo logic so sánh thời gian chính xác
    en_subs.sort(key=lambda x: x['start_time'])
    vi_subs.sort(key=lambda x: x['start_time'])
    # Nếu người dùng chỉ upload file Việt, dùng file Việt làm trục chính
    if not en_subs and vi_subs:
        en_subs = vi_subs
        vi_subs = []

    count = 0
    en_midpoints = [(sub['start_time'] + sub['end_time']) / 2.0 for sub in en_subs]
    vi_matched_texts = [[] for _ in en_subs]

    en_idx = 0
    num_en = len(en_subs)

    for vi_sub in vi_subs:
        if num_en == 0:
            break
            
        vi_mid = (vi_sub['start_time'] + vi_sub['end_time']) / 2.0
        
        # Tiến en_idx để tìm midpoint gần nhất
        while en_idx < num_en - 1:
            dist_curr = abs(en_midpoints[en_idx] - vi_mid)
            dist_next = abs(en_midpoints[en_idx + 1] - vi_mid)
            if dist_next <= dist_curr:
                en_idx += 1
            else:
                break
        
        if en_idx < num_en:
            # Ngưỡng 10 giây (nếu lệch quá 10s so với câu EN gần nhất thì bỏ qua)
            if abs(en_midpoints[en_idx] - vi_mid) <= 10.0:
                vi_matched_texts[en_idx].append(vi_sub['text'])

    for i, en_sub in enumerate(en_subs):
        best_vi_text = " ".join(vi_matched_texts[i])

        # Trường hợp chỉ có 1 file (đã map vi_subs sang en_subs ở trên)
        if not en_content and vi_content:
            en_text = ""
            vi_text = en_sub['text']
        else:
            en_text = en_sub['text']
            vi_text = best_vi_text

        new_sub = Subtitle(
            video_id=video_id,
            start_time=en_sub['start_time'],
            end_time=en_sub['end_time'],
            content_en=en_text,
            content_vi=vi_text
        )
        db.session.add(new_sub)
        count += 1

    db.session.commit()
    
    # Xuất ra file VTT tổng hợp cho Frontend
    export_subtitle_to_vtt(video_id)
    
    return count


def get_all_videos(page, per_page, category_id=None, release_year=None, source_type=None, status='public', keyword=None):
    query = Video.query
    
    if status and status != 'all':
        query = query.filter_by(status=status)
    
    if keyword:
        # Tìm kiếm theo tiêu đề (không phân biệt hoa thường)
        query = query.filter(Video.title.ilike(f"%{keyword}%"))

    if category_id:
        # Lọc theo Many-to-Many
        query = query.filter(Video.categories.any(id=category_id))
        
    if release_year:
        query = query.filter(Video.release_year == release_year)
    
    if source_type and source_type in ['youtube', 'local']:
        query = query.filter_by(source_type=source_type)
        
    query = query.order_by(Video.id.desc())

    paginated_result = query.paginate(page=page, per_page=per_page, error_out=False)

    return {
        "videos": VideoSchema(many=True).dump(paginated_result.items),
        "pagination": {
            "current_page": paginated_result.page,
            "total_items": paginated_result.total,
            "total_pages": paginated_result.pages,
            "has_next": paginated_result.has_next,
            "has_prev": paginated_result.has_prev
        }
    }

def get_video_by_id(video_id):
    return Video.query.get(video_id)

def update_video(video_id, data: UpdateVideoRequest):
    video = Video.query.get(video_id)
    if not video:
        raise ValueError('Không tìm thấy video')

    # Chuyển Model thành dict, loại bỏ các giá trị None (Chỉ update những gì được gửi)
    update_data = data.model_dump(exclude_unset=True)

    if 'title' in update_data:
        video.title = update_data['title']
        video.slug = create_unique_slug(Video, update_data['title'])
    
    if 'category_ids' in update_data:
        categories = Category.query.filter(Category.id.in_(update_data['category_ids'])).all()
        video.categories = categories

    # Tự động cập nhật các field còn lại nếu có trong Model
    for field, value in update_data.items():
        if field not in ['title', 'category_ids'] and hasattr(video, field):
            setattr(video, field, value)

    try:
        db.session.commit()
        return video
    except Exception as e:
        db.session.rollback()
        raise e

def delete_all_subtitles(video_id):
    """Xóa toàn bộ phụ đề của một video."""
    video = Video.query.get(video_id)
    if not video:
        raise ValueError(f"Video ID {video_id} không tồn tại")
    
    Subtitle.query.filter_by(video_id=video_id).delete()
    video.subtitle_vtt_url = None
    db.session.commit()
    
    # Xóa file vật lý nếu có
    storage_dir = os.path.abspath(os.path.join(os.getcwd(), 'storage', 'subtitles'))
    file_path = os.path.join(storage_dir, f"video_{video_id}.vtt")
    if os.path.exists(file_path):
        os.remove(file_path)
        
    return True

# [VTT_OPTIMIZATION] Cung cấp hàm xuất sub ra file vật lý để tăng hiệu năng
def export_subtitle_to_vtt(video_id):
    import os
    from datetime import timedelta
    from ..models.models_model import Video, Subtitle

    video = Video.query.get(video_id)
    if not video:
        raise ValueError(f"Video ID {video_id} không tồn tại")

    # 1. Tạo thư mục lưu trữ nếu chưa có
    storage_dir = os.path.abspath(os.path.join(os.getcwd(), 'storage', 'subtitles'))
    os.makedirs(storage_dir, exist_ok=True)
    
    file_name = f"video_{video_id}.vtt"
    file_path = os.path.join(storage_dir, file_name)

    # 2. Lấy danh sách phụ đề sắp xếp theo thời gian
    subs = Subtitle.query.filter_by(video_id=video_id).order_by(Subtitle.start_time.asc()).all()
    
    def format_vtt_time(seconds):
        td = timedelta(seconds=seconds)
        total_seconds = int(td.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        secs = total_seconds % 60
        millis = int((td.total_seconds() - total_seconds) * 1000)
        return f"{hours:02}:{minutes:02}:{secs:02}.{millis:03}"

    # 3. Ghi file theo chuẩn WebVTT
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write("WEBVTT\n\n")
        for i, sub in enumerate(subs):
            start = format_vtt_time(sub.start_time)
            end = format_vtt_time(sub.end_time)
            # Ghi cả tiếng Anh và tiếng Việt (tùy nhu cầu UI, ở đây ta gộp hoặc tách tùy ý)
            # Frontend thường cần text đơn thuần, ta có thể format đặc biệt nếu muốn
            f.write(f"{i+1}\n")
            f.write(f"{start} --> {end}\n")
            # Encode nội dung tiếng Việt rành mạch
            content = sub.content_en
            if sub.content_vi:
                content += f"\n{sub.content_vi}"
            f.write(f"{content}\n\n")

    # 4. Cập nhật đường dẫn vào Database (URL tương đối cho Frontend)
    # Không để /api ở đầu vì sẽ bị nhân đôi khi quan qua Proxy/API_BASE_URL
    video.subtitle_vtt_url = f"/static/subs/{file_name}"
    db.session.commit()
    
    print(f"✅ Exported VTT for Video {video_id}: {file_path}")
    return video.subtitle_vtt_url
