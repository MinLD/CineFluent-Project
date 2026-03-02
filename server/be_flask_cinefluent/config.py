# config.py
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Cấu hình cơ bản."""
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SECRET_KEY = os.getenv('SECRET_KEY')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    CLOUDINARY_CLOUD_NAME=os.getenv('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY=os.getenv('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET=os.getenv('CLOUDINARY_API_SECRET')

    





class DevelopmentConfig(Config):
    """Cấu hình cho môi trường phát triển."""
    DEBUG = True

class ProductionConfig(Config):
    """Cấu hình cho môi trường sản phẩm."""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv('PRODUCTION_DATABASE_URL', Config.SQLALCHEMY_DATABASE_URI)

# THÊM ĐOẠN NÀY VÀO CUỐI FILE
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}