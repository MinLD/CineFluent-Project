Prompt: "Hãy xây dựng một Component Next.js (React) tên là ShadowingPlayer chuyên dụng cho việc luyện tiếng Anh.Yêu cầu Kỹ thuật:Video Control: Sử dụng thẻ <video> HTML5 nguyên bản. Dùng useRef để kiểm soát các hàm play(), pause() và currentTime.Logic Tự động dừng: Lắng nghe sự kiện onTimeUpdate. Khi video.currentTime vượt quá end_time của phụ đề hiện tại, video phải dừng ngay lập tức và hiển thị một lớp phủ (Overlay).Ghi âm (Recording): Sử dụng Web Speech API (window.SpeechRecognition) để nhận diện giọng nói. Khi người dùng nhấn nút 'Ghi âm', hệ thống phải lắng nghe, chuyển giọng nói thành văn bản (transcript).API Interaction: Khi ghi âm xong, tự động gửi transcript và subtitle_id lên endpoint /api/learning/evaluate bằng fetch (có kèm JWT Token).UI/UX States: >    - State 1 (Watching): Video chạy bình thường, hiển thị phụ đề phía dưới.State 2 (Recording): Video dừng, hiện Overlay lớn trung tâm có nội dung câu thoại, nút Mic nhấp nháy.State 3 (Evaluating): Hiện loading spinner trong khi chờ Backend phản hồi.State 4 (Result): Hiển thị điểm số (ProgressBar), lời khuyên (Native Tip) và nút 'Tiếp tục' để chạy câu kế tiếp.Style: Dùng Tailwind CSS để giao diện trông hiện đại, chuyên nghiệp như các app học ngoại ngữ (Duolingo, Elsa)."2. Đặc tả dữ liệu Backend (Dành cho Frontend)Để Frontend của bạn có thể vẽ được giao diện, Backend Flask cần phải "trải thảm" dữ liệu qua một API lấy chi tiết video. Cấu trúc dữ liệu trả về phải đầy đủ như sau:Object: video_detailTrường dữ liệuKiểu dữ liệuMục đích ở Frontendvideo_urlStringTruyền vào thuộc tính src của thẻ video.subtitlesArrayDanh sách các câu thoại để duyệt qua từng câu.Object con: subtitle_itemMỗi phần tử trong mảng subtitles cần có:id: Dùng để gửi lên API chấm điểm (Để Backend biết đang chấm câu nào).content_en: Hiển thị chữ trên màn hình để người dùng đọc theo.start_time: Để khi nhấn "Nghe lại", video nhảy đúng về giây này.end_time: Để Frontend biết chính xác khi nào thì phải dừng video lại.3. Thư viện và Công nghệ khuyên dùngVì bạn đang làm đồ án cuối khóa, hãy ưu tiên các thư viện tiêu chuẩn để dễ bảo trì:Ghi âm/Nhận diện: Web Speech API (Có sẵn trong trình duyệt Chrome/Edge/Safari).Ưu điểm: Không cần cài thêm thư viện, độ trễ cực thấp vì nhận diện trực tiếp trên máy người dùng.Quản lý trạng thái: React Context hoặc Zustand.Mục đích: Giữ current_score, total_points và thông tin người dùng xuyên suốt buổi học.Hiệu ứng (Animation): Framer Motion.Mục đích: Làm cho cái Overlay kết quả hiện lên mượt mà, điểm số chạy từ 0 đến 100 nhìn sẽ "pro" hơn rất nhiều.

def evaluate_shadowing_service(original_text, user_text):
    prompt = f"""
        Bạn là một chuyên gia huấn luyện phát âm tiếng Anh (Pronunciation Coach). 
        Hãy đánh giá phần nói Shadowing của người dùng:
        - Câu gốc (Phim): "{original_text}"
        - Người dùng nói: "{user_text}"

        Hãy trả về JSON duy nhất với các yêu cầu sau cho phần 'native_tip':
        1. Chỉ tập trung vào cách phát âm, trọng âm, và âm cuối (ending sounds).
        2. Nếu người dùng nói dư từ, hãy dùng cụm từ "phát âm thừa" hoặc "từ dư thừa khi nói".
        3. Tóm gọn trong 2 ý chính, tối đa 20 từ.

        JSON format:
        {{
            "score": (0-100),
            "accuracy_percent": (%),
            "mispronounced_words": [],
            "native_tip": "- [Ý 1]\\n- [Ý 2]"
        }}
        """
    try:
        response = cinefluent_ai.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Lỗi AI Engine: {e}")
        return None

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

    from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.learning_service import evaluate_shadowing_service
from ..models.models_model import Subtitle, UserLearningProgress, UserProfile, db
from  ..utils.response import  success_response, error_response
learning_bp = Blueprint('learning', __name__)


@learning_bp.route('/evaluate', methods=['POST'])
@jwt_required()
def post_evaluate():
    user_id = get_jwt_identity()
    data = request.json

    subtitle_id = data.get('subtitle_id')
    user_text = data.get('user_text')  # Văn bản từ Web Speech API gửi lên

    # 1. Tìm câu gốc trong database
    subtitle = Subtitle.query.get(subtitle_id)
    if not subtitle:
        return  error_response(400, 'Subtitle not found')

    # 2. Gọi AI chấm điểm qua Service
    evaluation = evaluate_shadowing_service(subtitle.content_en, user_text)
    if not evaluation:
        return error_response(400, 'Evaluation not found')

    # 3. Lưu lịch sử luyện tập vào DB
    new_progress = UserLearningProgress(
        user_id=user_id,
        subtitle_id=subtitle_id,
        user_attempt_text=user_text,
        score=evaluation['score'],
        feedback=evaluation
    )
    db.session.add(new_progress)

    # 4. Cộng điểm vào hồ sơ người dùng (Gamification)
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    if profile:
        profile.total_points += evaluation['score']

    db.session.commit()

    return success_response(data= evaluation, message='Evaluation completed', code=200)

    from flask import Blueprint, request
from ..utils.response import success_response, error_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.video_service import import_youtube_video, get_all_videos
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


@video_bp.route('/', methods=['GET'])
def get_videos():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    cat_id = request.args.get('category_id', type=int)

    result = get_all_videos(page, per_page, cat_id)
    return success_response(data=result)

@video_bp.route('/<int:video_id>', methods=['GET'])
def get_detail(video_id):
    video = Video.query.get(video_id)
    if not video:
        return error_response("Không tìm thấy phim", 404)

    # Sắp xếp phụ đề theo thời gian để người dùng học đúng thứ tự
    ordered_subs = Subtitle.query.filter_by(video_id=video_id).order_by(Subtitle.start_time.asc()).all()

    # Tăng lượt xem (tùy chọn)
    video.view_count += 1
    db.session.commit()

    res_data = VideoDetailSchema().dump(video)
    res_data['subtitles'] = SubtitleSchema(many=True).dump(ordered_subs)

    return success_response(data=res_data)