import yt_dlp
from slugify import slugify
from ..models.models_model import Video, Subtitle, Category
from ..extensions import db
from ..schemas.video_schema import VideoSchema


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


def import_youtube_video(url, level, user_id):
    meta = fetch_youtube_metadata(url)
    yt_id = meta['youtube_id']

    # 1. Xử lý Category


    # 2. Kiểm tra Video tồn tại chưa
    video = Video.query.filter_by(youtube_id=yt_id).first()
    if video:
        return video

    try:
        import os
        import yt_dlp
        import json
        import tempfile

        # Tìm file cookies
        current_dir = os.path.dirname(os.path.abspath(__file__))
        cookie_path = os.path.join(current_dir, "../utils/www.youtube.com_cookies.txt")
        cookie_path = os.path.abspath(cookie_path)

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

        if os.path.exists(cookie_path):
            ydl_opts['cookiefile'] = cookie_path
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

        # Nếu không có .en.json3, thử tìm .en-*.json3
        if not os.path.exists(en_file):
            import glob
            en_files = glob.glob(os.path.join(temp_dir, f"{yt_id}.en*.json3"))
            if en_files:
                en_file = en_files[0]

        if not os.path.exists(vi_file):
            import glob
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
        
        from deep_translator import GoogleTranslator
        import time
        
        translator = GoogleTranslator(source='en', target='vi')
        
        # Tính batch size động dựa trên độ dài text
        total_chars = sum(len(item['text']) for item in transcript)
        avg_chars = total_chars / len(transcript) if transcript else 50
        
        MAX_CHARS_PER_BATCH = 4500  # An toàn dưới giới hạn 5000
        SEPARATOR = ' |||SUBTITLE_SEP||| '
        SEPARATOR_LENGTH = len(SEPARATOR)
        
        # Tính batch size tối ưu
        BATCH_SIZE = int(MAX_CHARS_PER_BATCH / (avg_chars + SEPARATOR_LENGTH))
        BATCH_SIZE = max(10, min(BATCH_SIZE, 200))  # Giới hạn 10-200
        
        print(f"   📊 Total subtitles: {len(transcript)}")
        print(f"   📏 Average chars per subtitle: {avg_chars:.1f}")
        print(f"   🎯 Optimal batch size: {BATCH_SIZE}")
        
        transcript_vi = []
        total_batches = (len(transcript) + BATCH_SIZE - 1) // BATCH_SIZE
        print(f"   📦 Total batches: {total_batches}")
        
        def translate_with_retry(text, max_retries=3):
            """Dịch với retry logic cho rate limiting"""
            for attempt in range(max_retries):
                try:
                    return translator.translate(text)
                except Exception as e:
                    error_str = str(e)
                    # Kiểm tra rate limiting
                    if '429' in error_str or 'Too Many Requests' in error_str or 'rate' in error_str.lower():
                        if attempt < max_retries - 1:
                            wait_time = (2 ** attempt) * 2  # Exponential backoff: 2s, 4s, 8s
                            print(f"      ⚠️ Rate limited, waiting {wait_time}s before retry...")
                            time.sleep(wait_time)
                        else:
                            raise Exception(f"Rate limit exceeded after {max_retries} retries")
                    else:
                        raise
            raise Exception("Translation failed after max retries")
        
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
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)

        from .learning_service import suggest_video_category

        # 3. Xử lý Category (AI Suggestion) - moved here to save tokens
        print(f"Asking AI to categorize: {meta['title']}...")
        ai_result = suggest_video_category(meta['title'], meta.get('description', ''))
        
        if ai_result.get('success'):
            category_name = ai_result['data'].get('category', 'General')
            print(f"   AI Suggested: {category_name}")
        else:
            print(f"   AI Error, fallback to General. Error: {ai_result.get('error')}")
            category_name = 'General'

        # Tạo Slug từ tên AI gợi ý
        category_slug = slugify(category_name)
        
        # Tìm trong DB bằng SLUG
        category = Category.query.filter_by(slug=category_slug).first()
        
        if not category:
            print(f"   Creating new category: {category_name} ({category_slug})")
            category = Category(name=category_name, slug=category_slug)
            db.session.add(category)
            db.session.flush()
        else:
            print(f"   Found existing category: {category.name}")


        # 4. Khởi tạo Object Video
        video = Video(
            source_type='youtube',
            source_url=url,
            youtube_id=yt_id,
            title=meta['title'],
            thumbnail_url=meta['thumbnail'],
            category_id=category.id,
            level=level,
            slug = create_unique_slug(Video, meta['title']),
            added_by_user_id=user_id
        )
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
        return video

    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"❌ Error: {str(e)}")
        print(traceback.format_exc())
        raise ValueError(f"Lỗi nhập liệu từ YouTube: {str(e)}")
def get_all_videos(page, per_page, category_id=None):
    query = Video.query
    if category_id:
        query = query.filter_by(category_id=category_id)

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