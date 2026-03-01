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

class Subtitle(db.Model):
    __tablename__ = 'subtitles'
    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    video_id = db.Column(db.Integer, db.ForeignKey('videos.id'), nullable=False, index=True)
    start_time = db.Column(db.Float, nullable=False) 
    end_time = db.Column(db.Float, nullable=False) 
    content_en = db.Column(db.Text, nullable=False) 
    content_vi = db.Column(db.Text) 
    video = db.relationship('Video', back_populates='subtitles')
