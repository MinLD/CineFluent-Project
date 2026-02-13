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
    # 1-1 relationship: uselist=False biến nó thành object đơn thay vì list
    profile = db.relationship('UserProfile', uselist=False, back_populates='user', cascade='all, delete-orphan')
    learning_progresses = db.relationship('UserLearningProgress', back_populates='user', cascade='all, delete-orphan')


    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

class UserProfile(db.Model):
    __tablename__ = 'user_profile'
    # ID của profile nên là UUID giống User
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

    # Foreign Key liên kết với User
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True)

    # Relationship ngược lại User
    user = db.relationship('User', back_populates='profile')



class TokenBlocklist(db.Model):
    __tablename__ = 'token_blocklist'
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

# moduels 2
class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    slug = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.String(255), nullable=True)
    avatar_url = db.Column(db.String(500), nullable=True)

    videos = db.relationship('Video', back_populates= 'category', lazy='dynamic')

class Video(db.Model):
    __tablename__ = 'videos'
    id = db.Column(db.Integer, primary_key=True)
    # Hỗ trợ đa nguồn: youtube, drive, local, external (VidSrc)
    source_type = db.Column(db.Enum('youtube', 'drive', 'local', 'external'), default='youtube')
    source_url = db.Column(db.String(500), nullable=True) # Có thể null nếu dùng stream_url
    
    # YouTube specific
    youtube_id = db.Column(db.String(50), unique=True, nullable=True)
    
    # External Movie specific (VidSrc / TMDb)
    imdb_id = db.Column(db.String(20), unique=True, nullable=True) # tt1234567
    stream_url = db.Column(db.String(500), nullable=True) # Link .m3u8 hoặc embed
    backdrop_url = db.Column(db.String(500), nullable=True) # Ảnh nền to
    
    slug = db.Column(db.String(100), nullable=True, unique=True)
    title = db.Column(db.String(255), nullable=False)
    thumbnail_url = db.Column(db.String(500))
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))  # Link sang bảng Category

    level = db.Column(db.Enum('Beginner', 'Intermediate', 'Advanced'), default='Intermediate')
    view_count = db.Column(db.Integer, default=0)
    added_by_user_id = db.Column(db.String(36), db.ForeignKey('users.id'))


    subtitles = db.relationship(
        'Subtitle',
        back_populates='video',
        cascade='all, delete-orphan',
        lazy='dynamic'
    )
    category = db.relationship('Category', back_populates='videos')

class Subtitle(db.Model):
    __tablename__ = 'subtitles'
    id = db.Column(db.Integer, primary_key=True)
    video_id = db.Column(db.Integer, db.ForeignKey('videos.id'), nullable=False)
    start_time = db.Column(db.Float, nullable=False)  # Thời điểm bắt đầu câu thoại [cite: 72]
    end_time = db.Column(db.Float, nullable=False)  # Thời điểm kết thúc câu thoại [cite: 73]
    content_en = db.Column(db.Text, nullable=False)  # Phụ đề gốc [cite: 74]
    content_vi = db.Column(db.Text)  # Phụ đề dịch [cite: 75]
    learning_progresses = db.relationship(
        'UserLearningProgress',
        back_populates='subtitle',
        cascade='all, delete-orphan'
    )
    video = db.relationship('Video', back_populates='subtitles')

# moduels 3
class UserLearningProgress(db.Model):
    __tablename__ = 'user_learning_progress'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    subtitle_id = db.Column(db.Integer, db.ForeignKey('subtitles.id'), nullable=False)

    user_attempt_text = db.Column(db.Text)
    score = db.Column(db.Integer)
    feedback = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    subtitle = db.relationship('Subtitle', back_populates='learning_progresses')
    user = db.relationship('User', back_populates='learning_progresses')