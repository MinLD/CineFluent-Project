import yt_dlp
from slugify import slugify
from ..models.models_model import Video, Subtitle, Category
from ..extensions import db

def fetch_youtube_metadata(url):
    """Sử dụng yt-dlp để lấy Title và Thumbnail từ link YouTube."""
    ydl_opts = {'quiet': True, 'no_warnings': True}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        return {
            'title': info.get('title'),
            'thumbnail': info.get('thumbnail'),
            'duration': info.get('duration'),
            'youtube_id': info.get('id')
        }


from youtube_transcript_api import YouTubeTranscriptApi


def import_youtube_video(url, level, user_id):
    meta = fetch_youtube_metadata(url)
    yt_id = meta['youtube_id']

    # 1. Xử lý Category
    category_name = meta.get('category', 'General')
    category = Category.query.filter_by(name=category_name).first()
    if not category:
        category = Category(name=category_name, slug=slugify(category_name))
        db.session.add(category)
        db.session.flush()

    # 2. Kiểm tra Video tồn tại chưa
    video = Video.query.filter_by(youtube_id=yt_id).first()

    if not video:
        try:
            # KHỞI TẠO INSTANCE (BẮT BUỘC với v1.x)
            ytt_api = YouTubeTranscriptApi()

            fetched_transcript = ytt_api.fetch(yt_id, languages=['en'])
            transcript = fetched_transcript.to_raw_data()

        except Exception as e:
            raise ValueError(f"Không lấy được phụ đề: {str(e)}")

        # 3. Khởi tạo Object Video
        video = Video(
            source_type='youtube',
            source_url=url,
            youtube_id=yt_id,
            title=meta['title'],
            thumbnail_url=meta['thumbnail'],
            category_id=category.id,
            level=level,
            added_by_user_id=user_id
        )
        db.session.add(video)
        db.session.flush()

        # 4. Lưu danh sách phụ đề
        for item in transcript:
            db.session.add(Subtitle(
                video_id=video.id,
                start_time=item['start'],
                end_time=item['start'] + item['duration'],
                content_en=item['text']
            ))

    db.session.commit()
    return video