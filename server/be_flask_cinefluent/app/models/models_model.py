# app/models/models.py
from sqlalchemy.orm import backref
from ..extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from uuid import uuid4
from datetime import datetime

# Bảng trung gian N-N
class Role_User(db.Model):
    __tablename__ = 'role_user'
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True)

class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255), nullable=False)

    # Relationships
    users = db.relationship('User', secondary='role_user', back_populates='roles')

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='active')

    created_at = db.Column(db.DateTime(), nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    roles = db.relationship('Role', secondary='role_user', back_populates='users')
    profile = db.relationship('UserProfile', uselist=False, back_populates='user', cascade='all, delete-orphan')
    video_reports = db.relationship('VideoReport', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    movie_requests = db.relationship('MovieRequest', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    flashcards = db.relationship('Flashcard', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    flashcard_exercises = db.relationship('FlashcardExercise', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    grammar_review_attempts = db.relationship('GrammarReviewAttempt', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    watch_history = db.relationship('WatchHistory', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    study_roadmaps = db.relationship('StudyRoadmap', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    ai_assessments = db.relationship('AIAssessment', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    chat_sessions = db.relationship('ChatSession', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    chat_messages = db.relationship('ChatMessage', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    knowledge_state = db.relationship('UserKnowledgeState', uselist=False, back_populates='user', cascade='all, delete-orphan')
    tag_masteries = db.relationship('UserTagMastery', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    discovered_tags = db.relationship('UserDiscoveredTag', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

class UserProfile(db.Model):
    __tablename__ = 'user_profile'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    fullname = db.Column(db.String(255), nullable=True)
    bio = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(10), nullable=True)
    date_of_birth = db.Column(db.DateTime(), nullable=True)
    avatar_url = db.Column(db.String(500), nullable=True)
    is_online = db.Column(db.Boolean(), nullable=False, default=False)

    english_level = db.Column(db.Enum('Beginner', 'Intermediate', 'Advanced'), default='Beginner')
    total_points = db.Column(db.Integer, default=0)
    streak_days = db.Column(db.Integer, default=0)

    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True)
    user = db.relationship('User', back_populates='profile')

class UserKnowledgeState(db.Model):
    __tablename__ = 'user_knowledge_states'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    
    # Lưu trạng thái Hidden State của LSTM (Từ Numpy mảng -> JSON)
    # Lưu kiểu JSON cho tốc độ cao và thân thiện với môi trường SQL
    latent_state = db.Column(db.JSON, nullable=True) 
    
    # Bộ đếm lượt xem (optional)
    interaction_count = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Quan hệ vòng
    user = db.relationship('User', back_populates='knowledge_state')

class UserTagMastery(db.Model):
    __tablename__ = 'user_tag_masteries'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    tag_id = db.Column(db.Integer, db.ForeignKey('grammar_tags.id'), nullable=False, index=True) # Chỉ mục thẻ ngữ pháp (Ví dụ 10, 15)
    
    # Lặp lại ngắt quãng (Spaced Repetition)
    mastery_score = db.Column(db.Float, default=0.0)      # Điểm thông thạo hiện tại (0-100)
    interval_days = db.Column(db.Float, default=1.0)      # Khoảng cách ngày lý tưởng trước khi bị trừ điểm cực đoan
    last_practiced_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Đảm bảo mỗi (User, Tag) là 1 dòng duy nhất
    __table_args__ = (db.UniqueConstraint('user_id', 'tag_id', name='uq_user_tag_mastery'),)

    user = db.relationship('User', back_populates='tag_masteries')
    grammar_tag = db.relationship('GrammarTag', back_populates='user_masteries')

class UserDiscoveredTag(db.Model):
    __tablename__ = 'user_discovered_tags'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    tag_id = db.Column(db.Integer, db.ForeignKey('grammar_tags.id', ondelete='CASCADE'), nullable=False, index=True)
    source = db.Column(db.String(50), nullable=False, default='movie')
    encounter_count = db.Column(db.Integer, nullable=False, default=1)
    discovered_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    last_seen_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('user_id', 'tag_id', name='uq_user_discovered_tag'),)

    user = db.relationship('User', back_populates='discovered_tags')
    grammar_tag = db.relationship('GrammarTag', back_populates='discovered_by_users')

class TokenBlocklist(db.Model):
    __tablename__ = 'token_blocklist'
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

# Bảng trung gian N-N giữa Video và Category
video_categories = db.Table('video_categories',
    db.Column('video_id', db.Integer, db.ForeignKey('videos.id', ondelete='CASCADE'), primary_key=True),
    db.Column('category_id', db.Integer, db.ForeignKey('categories.id', ondelete='CASCADE'), primary_key=True)
)

# moduels 2
class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    slug = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.String(255), nullable=True)
    avatar_url = db.Column(db.String(500), nullable=True)

    videos = db.relationship('Video', secondary='video_categories', back_populates='categories', lazy='dynamic')

class Video(db.Model):
    __tablename__ = 'videos'
    id = db.Column(db.Integer, primary_key=True)
    source_type = db.Column(db.Enum('youtube', 'local'), default='local', index=True)
    tmdb_id = db.Column(db.Integer, nullable=True)
    runtime = db.Column(db.Integer, nullable=True)
    release_year = db.Column(db.Integer) 
    original_title = db.Column(db.String(255), nullable=True) # Tiêu đề gốc (ví dụ tiếng Anh)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True) # Mô tả phim
    author = db.Column(db.String(255), nullable=True, index=True) # Tác giả/Đạo diễn
    country = db.Column(db.String(100), nullable=True, index=True) # Quốc gia
    slug = db.Column(db.String(100), unique=True, index=True)
    backdrop_url = db.Column(db.String(500), nullable=True)
    # Media URLs
    source_url = db.Column(db.String(500), index=True, nullable= True)
    stream_url = db.Column(db.String(500), nullable= True) 
    thumbnail_url = db.Column(db.String(500), nullable= True)
    # [VTT_OPTIMIZATION] Thêm cột lưu URL file VTT
    subtitle_vtt_url = db.Column(db.String(500), nullable=True) 
    # Metadata
    view_count = db.Column(db.Integer, default=0, index=True) 
    level = db.Column(db.Enum('Beginner', 'Intermediate', 'Advanced'), default='Intermediate', index=True)
    status = db.Column(db.Enum('public', 'private'), default='private', index=True, nullable=False)

    # Relationships
    categories = db.relationship('Category', secondary='video_categories', back_populates='videos')
    subtitles = db.relationship('Subtitle', back_populates='video', cascade='all, delete-orphan', lazy='dynamic')
    reports = db.relationship('VideoReport', back_populates='video', lazy='dynamic', cascade='all, delete-orphan')
    flashcards = db.relationship('Flashcard', back_populates='video', lazy='dynamic', cascade='all, delete-orphan')
    watch_history = db.relationship('WatchHistory', back_populates='video', lazy='dynamic', cascade='all, delete-orphan')
    ai_analysis = db.relationship('MovieAIAnalysis', back_populates='video', uselist=False, cascade='all, delete-orphan')

class GrammarBranch(db.Model):
    __tablename__ = 'grammar_branches'
    id = db.Column(db.Integer, primary_key=True)
    name_en = db.Column(db.String(100), nullable=False, unique=True, index=True)
    name_vi = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    display_order = db.Column(db.Integer, nullable=False, default=0)

    tags = db.relationship('GrammarTag', back_populates='branch', lazy='dynamic')

# Bảng từ điển các Thẻ Ngữ Pháp (Dùng cho AI DKT và Tooltip Frontend)
class GrammarTag(db.Model):
    __tablename__ = 'grammar_tags'
    id = db.Column(db.Integer, primary_key=True) # Mapping với ID của XLM-R Model (0, 1, 2...)
    name_en = db.Column(db.String(100), nullable=False, index=True) # VD: present_simple
    name_vi = db.Column(db.String(255), nullable=True) # VD: Thì Hiện tại đơn
    description = db.Column(db.Text, nullable=True) # Giải thích quy tắc ngữ pháp
    branch_id = db.Column(db.Integer, db.ForeignKey('grammar_branches.id'), nullable=True, index=True)
    
    # Quan hệ
    branch = db.relationship('GrammarBranch', back_populates='tags')
    subtitles = db.relationship('Subtitle', back_populates='grammar_tag', lazy='dynamic')
    user_masteries = db.relationship('UserTagMastery', back_populates='grammar_tag', lazy='dynamic')
    discovered_by_users = db.relationship('UserDiscoveredTag', back_populates='grammar_tag', lazy='dynamic')
    lessons = db.relationship('GrammarLesson', back_populates='grammar_tag', lazy='dynamic', cascade='all, delete-orphan')
    review_exercises = db.relationship('GrammarReviewExercise', back_populates='grammar_tag', lazy='dynamic', cascade='all, delete-orphan')

class Subtitle(db.Model):
    __tablename__ = 'subtitles'
    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    video_id = db.Column(db.Integer, db.ForeignKey('videos.id'), nullable=False, index=True)
    start_time = db.Column(db.Float, nullable=False) 
    end_time = db.Column(db.Float, nullable=False) 
    content_en = db.Column(db.Text, nullable=False) 
    content_vi = db.Column(db.Text) 

    # [XLM-R NLP Integration]
    grammar_tag_id = db.Column(db.Integer, db.ForeignKey('grammar_tags.id'), nullable=True, index=True)
    cloze_data = db.Column(db.JSON, nullable=True) # Chứa JSON đục lỗ: {"masked": "...", "answer": "...", "distractors": ["...", "..."]}
    
    video = db.relationship('Video', back_populates='subtitles')
    grammar_tag = db.relationship('GrammarTag', back_populates='subtitles')

# Bảng quản lý báo lỗi thẻ phạt/phim mờ/không play được
class VideoReport(db.Model):
    __tablename__ = 'video_reports'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    video_id = db.Column(db.Integer, db.ForeignKey('videos.id', ondelete='CASCADE'), nullable=False, index=True)
    issue_type = db.Column(db.String(50), nullable=False) # e.g., 'not_playing', 'wrong_subtitle', 'audio_sync_issue', 'other'
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.Enum('PENDING', 'RESOLVED', 'IGNORED'), default='PENDING', nullable=False, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Khai báo Relationship một chiều từ Report -> User và Video để truy vấn nhanh
    user = db.relationship('User', back_populates='video_reports')
    video = db.relationship('Video', back_populates='reports')

# Bảng quản lý yêu cầu phim mới của user
class MovieRequest(db.Model):
    __tablename__ = 'movie_requests'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False) # Tên phim User yêu cầu
    note = db.Column(db.Text, nullable=True) # Ghi chú thêm
    status = db.Column(db.Enum('PENDING', 'APPROVED', 'DONE', 'REJECTED'), default='PENDING', nullable=False, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Khai báo Relationship
    user = db.relationship('User', back_populates='movie_requests')

class Flashcard(db.Model):
    __tablename__ = 'flashcards'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    video_id = db.Column(db.Integer, db.ForeignKey('videos.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Core word info
    word = db.Column(db.String(100), nullable=False)
    context_sentence = db.Column(db.Text, nullable=True) # Câu sub gốc chứa từ đó
    
    # AI Generated Dictionary Info
    ipa = db.Column(db.String(100), nullable=True)
    pos = db.Column(db.String(50), nullable=True) # Part of speech
    definition_vi = db.Column(db.Text, nullable=True)
    example_en = db.Column(db.Text, nullable=True)
    example_vi = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='flashcards')
    video = db.relationship('Video', back_populates='flashcards')

class FlashcardExercise(db.Model):
    __tablename__ = 'flashcard_exercises'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Store the entire exact JSON output generated by the AI
    # (multiple_choice, fill_in_blank, translation arrays)
    quiz_data = db.Column(db.JSON, nullable=False)
    
    # Store user's specific answers for review
    user_answers = db.Column(db.JSON, nullable=True)
    
    # Track the assessment
    score = db.Column(db.Float, nullable=True) # Score out of 10
    total_questions = db.Column(db.Integer, nullable=False, default=0)
    correct_answers = db.Column(db.Integer, nullable=True) # optional detailed tracking
    
    status = db.Column(db.Enum('PENDING', 'COMPLETED'), default='PENDING', nullable=False, index=True)
    
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    user = db.relationship('User', back_populates='flashcard_exercises')


class GrammarLesson(db.Model):
    __tablename__ = 'grammar_lessons'

    id = db.Column(db.Integer, primary_key=True)
    tag_id = db.Column(db.Integer, db.ForeignKey('grammar_tags.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    title = db.Column(db.String(255), nullable=False)
    content_json = db.Column(db.JSON, nullable=False)
    model_name = db.Column(db.String(100), nullable=False, default='gemini-2.5-flash')
    version = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    grammar_tag = db.relationship('GrammarTag', back_populates='lessons')


class GrammarReviewExercise(db.Model):
    __tablename__ = 'grammar_review_exercises'

    id = db.Column(db.Integer, primary_key=True)
    tag_id = db.Column(db.Integer, db.ForeignKey('grammar_tags.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    question_count = db.Column(db.Integer, nullable=False, default=5)
    quiz_data = db.Column(db.JSON, nullable=False)
    model_name = db.Column(db.String(100), nullable=False, default='gemini-2.5-flash')
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    grammar_tag = db.relationship('GrammarTag', back_populates='review_exercises')
    attempts = db.relationship('GrammarReviewAttempt', back_populates='review_exercise', lazy='dynamic', cascade='all, delete-orphan')


class GrammarReviewAttempt(db.Model):
    __tablename__ = 'grammar_review_attempts'

    id = db.Column(db.Integer, primary_key=True)
    review_exercise_id = db.Column(db.Integer, db.ForeignKey('grammar_review_exercises.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    user_answers = db.Column(db.JSON, nullable=True)
    result_json = db.Column(db.JSON, nullable=True)
    score = db.Column(db.Float, nullable=True)
    total_questions = db.Column(db.Integer, nullable=False, default=0)
    correct_answers = db.Column(db.Integer, nullable=True)
    status = db.Column(db.Enum('PENDING', 'COMPLETED'), default='PENDING', nullable=False, index=True)
    submitted_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', back_populates='grammar_review_attempts')
    review_exercise = db.relationship('GrammarReviewExercise', back_populates='attempts')


class TypingGameMap(db.Model):
    __tablename__ = 'typing_game_maps'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    thumbnail_url = db.Column(db.String(500), nullable=True)
    description = db.Column(db.Text, nullable=True)
    total_chapters = db.Column(db.Integer, default=5)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to stages
    stages = db.relationship('TypingGameStage', backref='map', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'thumbnail_url': self.thumbnail_url,
            'description': self.description,
            'total_chapters': self.total_chapters,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class TypingGameStage(db.Model):
    __tablename__ = 'typing_game_stages'
    id = db.Column(db.Integer, primary_key=True)
    map_id = db.Column(db.Integer, db.ForeignKey('typing_game_maps.id', ondelete='CASCADE'), nullable=False)
    chapter_number = db.Column(db.Integer, nullable=False)
    content = db.Column(db.Text, nullable=False)
    difficulty = db.Column(db.Enum('Easy', 'Medium', 'Hard'), default='Medium')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'map_id': self.map_id,
            'chapter_number': self.chapter_number,
            'content': self.content,
            'difficulty': self.difficulty,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class WatchHistory(db.Model):
    __tablename__ = 'watch_history'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    video_id = db.Column(db.Integer, db.ForeignKey('videos.id', ondelete='CASCADE'), nullable=False, index=True)
    watched_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    last_position = db.Column(db.Float, nullable=True, default=0.0)
    duration = db.Column(db.Float, nullable=True, default=0.0)
    
    user = db.relationship('User', back_populates='watch_history')
    video = db.relationship('Video', back_populates='watch_history')

class MovieAIAnalysis(db.Model):
    __tablename__ = 'movie_ai_analyses'

    id = db.Column(db.Integer, primary_key=True)
    video_id = db.Column(db.Integer, db.ForeignKey('videos.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)

    model_name = db.Column(db.String(100), nullable=False, default='FacebookAI/xlm-roberta-base')
    model_mode = db.Column(db.String(50), nullable=False, default='multitask_inference')
    segment_count = db.Column(db.Integer, nullable=False, default=0)

    movie_score = db.Column(db.Float, nullable=False)
    movie_level = db.Column(db.String(50), nullable=False)
    movie_cefr_range = db.Column(db.String(20), nullable=False)

    difficulty_ratios = db.Column(db.JSON, nullable=False)
    cefr_ratios = db.Column(db.JSON, nullable=False)
    dominant_grammar_tags = db.Column(db.JSON, nullable=True)
    top_hard_segments = db.Column(db.JSON, nullable=True)

    status = db.Column(db.Enum('PROCESSING', 'READY', 'FAILED'), default='READY', nullable=False, index=True)
    error_message = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    video = db.relationship('Video', back_populates='ai_analysis')


class StudyRoadmap(db.Model):
    __tablename__ = 'study_roadmaps'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    current_score = db.Column(db.Float, nullable=False)
    target_score = db.Column(db.Float, nullable=False)
    duration_days = db.Column(db.Integer, nullable=False)
    blueprint_json = db.Column(db.JSON, nullable=True) # Layer 1 skeleton
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    user = db.relationship('User', back_populates='study_roadmaps')
    daily_tasks = db.relationship('DailyTask', back_populates='roadmap', lazy='dynamic', cascade='all, delete-orphan')

class DailyTask(db.Model):
    __tablename__ = 'daily_tasks'
    id = db.Column(db.Integer, primary_key=True)
    roadmap_id = db.Column(db.Integer, db.ForeignKey('study_roadmaps.id', ondelete='CASCADE'), nullable=False, index=True)
    day_number = db.Column(db.Integer, nullable=False)
    task_detail_json = db.Column(db.JSON, nullable=True) # Layer 2 daily tasks
    status = db.Column(db.Enum('pending', 'done'), default='pending', nullable=False)
    score = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    roadmap = db.relationship('StudyRoadmap', back_populates='daily_tasks')

class AIAssessment(db.Model):
    __tablename__ = 'ai_assessments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Store the entire exact JSON output generated by the AI
    # (listening, reading, writing, speaking)
    quiz_data = db.Column(db.JSON, nullable=False)
    
    # Store user's specific answers for review
    user_answers = db.Column(db.JSON, nullable=True)
    
    # Results
    overall_score = db.Column(db.Float, nullable=True)
    grammar_feedback = db.Column(db.Text, nullable=True)
    vocab_feedback = db.Column(db.Text, nullable=True)
    strengths = db.Column(db.JSON, nullable=True)
    weaknesses = db.Column(db.JSON, nullable=True)
    
    status = db.Column(db.Enum('PENDING', 'COMPLETED'), default='PENDING', nullable=False, index=True)
    is_fallback = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship('User', back_populates='ai_assessments')


class ChatSession(db.Model):
    __tablename__ = 'chat_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.String(36),
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    title = db.Column(db.String(255), nullable=True)
    context_type = db.Column(
        db.Enum('general', 'movie', 'flashcard', 'roadmap', 'typing_game', 'realtime_practice'),
        nullable=False,
        default='general',
        index=True,
    )
    context_id = db.Column(db.String(100), nullable=True, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', back_populates='chat_sessions')
    messages = db.relationship(
        'ChatMessage',
        back_populates='session',
        lazy='dynamic',
        cascade='all, delete-orphan',
    )


class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(
        db.Integer,
        db.ForeignKey('chat_sessions.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    user_id = db.Column(
        db.String(36),
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    role = db.Column(
        db.Enum('system', 'user', 'assistant'),
        nullable=False,
        index=True,
    )
    content = db.Column(db.Text, nullable=False)
    context_used = db.Column(db.JSON, nullable=True)
    sources = db.Column(db.JSON, nullable=True)
    usage = db.Column(db.JSON, nullable=True)
    latency_ms = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    session = db.relationship('ChatSession', back_populates='messages')
    user = db.relationship('User', back_populates='chat_messages')
    feedback = db.relationship(
        'ChatFeedback',
        back_populates='message',
        uselist=False,
        cascade='all, delete-orphan',
    )


class ChatFeedback(db.Model):
    __tablename__ = 'chat_feedback'

    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(
        db.Integer,
        db.ForeignKey('chat_messages.id', ondelete='CASCADE'),
        nullable=False,
        unique=True,
        index=True,
    )
    is_helpful = db.Column(db.Boolean, nullable=False)
    note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    message = db.relationship('ChatMessage', back_populates='feedback')
