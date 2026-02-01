#service/auth_service.py
from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt, get_jwt_identity

from .upload_service import upload_file
from ..extensions import db
from ..models.models_model import TokenBlocklist, User, UserProfile
from ..services.users_service import get_user_by_email
from google.oauth2 import id_token
from google.auth.transport import requests
import uuid

def login_with_google(token_from_frontend):
    try:
        # 1. Xác thực token với Google
        id_info = id_token.verify_oauth2_token(
            token_from_frontend,
            requests.Request(),
            current_app.config['GOOGLE_CLIENT_ID']
        )
        # 2. Lấy thông tin từ Google
        email = id_info.get('email')
        name = id_info.get('name')
        google_picture = id_info.get('picture') # URL ảnh từ Google

        # 3. Kiểm tra User tồn tại chưa
        user = User.query.filter_by(email=email).first()

        if not user:
            # Tạo mật khẩu ngẫu nhiên cho user đăng nhập Google lần đầu
            random_password = str(uuid.uuid4())

            user = User(
                email=email,
                status='active' # Mặc định active [cite: 49]
            )
            user.set_password(random_password)

            # Tạo Profile với các trường đặc thù của CineFluent
            new_profile = UserProfile(
                fullname=name,
                avatar_url=google_picture, # Lưu thẳng URL, không cần qua Media
                is_online=True,
                english_level='Beginner', # Mặc định cho user mới [cite: 56]
                total_points=0,           # Khởi tạo điểm [cite: 57]
                streak_days=0,            # Khởi tạo streak [cite: 58]
                user=user
            )

            db.session.add(user)
            db.session.add(new_profile)
            db.session.commit()
        else:
            # Nếu user đã tồn tại, cập nhật trạng thái và ảnh mới nhất (nếu có)
            if user.profile:
                user.profile.is_online = True
                if google_picture:
                    user.profile.avatar_url = google_picture
                db.session.commit()

        # 4. Tạo JWT Token
        # Lấy danh sách roles để thêm vào additional_claims (giống generate_tokens)
        user_roles = [role.name for role in user.roles]
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={"roles": user_roles}
        )
        refresh_token = create_refresh_token(identity=str(user.id))

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    except ValueError:
        raise ValueError("Invalid Google Token")
    except Exception as e:
        db.session.rollback()
        raise e
def logout():
    jwt_payload = get_jwt()
    jti = jwt_payload["jti"]
    token = TokenBlocklist(jti=jti)
    db.session.add(token)
    db.session.commit()
def whoami():
    claims = get_jwt()
    return claims
def refresh_token():
        identity = get_jwt_identity()
        user = User.query.get(identity)
        if not user:
            raise ValueError ("User not found")

        user_roles = [role.name for role in user.roles]
        additional_claims = {"roles": user_roles}

        new_access_token = create_access_token(
            identity=str(user.id),
            additional_claims=additional_claims
        )
        
        return new_access_token


def generate_tokens(data):
        user = get_user_by_email(email=data.email)
        if not user:
            raise ValueError("Account not found")

        if user and user.check_password(password=data.password):
            user_roles = [role.name for role in user.roles]
            additional_claims = {"roles": user_roles}
            access_token = create_access_token(
            identity=str(user.id), 
            additional_claims=additional_claims
        )
            refresh_token = create_refresh_token(identity=user.id)
            return access_token, refresh_token

        raise ValueError("Invalid email or password")