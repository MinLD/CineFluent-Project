# service/users_service.py


from ..models.models_model import User, UserProfile
from ..extensions import db
from .role_service import get_role_by_name
from ..schemas.schemas import UserSchema
from ..services.upload_service import upload_file
from sqlalchemy import  or_

import re
USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9]+$")

def get_user_by_email(email):
    return User.query.filter_by(email=email).first()

def get_user_by_id(user_id):
    return User.query.filter_by(id=user_id).first()


def get_email_profile(email):
    return UserProfile.query.filter_by(email=email).first()

def save(data):
    db.session.add(data)
    db.session.commit()
    
def delete(data):
    db.session.delete(data)
    db.session.commit()
#done
def model_search_user(data, page, per_page):
    search_query = data.get('keyword')
    if not search_query:
        return None, "Thiếu thông tin bắt buộc"
    search_pattern = f"%{search_query}%"
    try:
        paginated_result = User.query.join(UserProfile).filter(
            or_(
                UserProfile.phone.ilike(search_pattern),
                User.email.ilike(search_pattern),
                UserProfile.fullname.ilike(search_pattern)
            )
        ).paginate(page=page, per_page=per_page, error_out=False)
        user_data = UserSchema().dump(paginated_result.items, many=True)
        response_data = {
            "users": user_data,
            "pagination": {
                "current_page": paginated_result.page,
                "per_page": paginated_result.per_page,
                "total_items": paginated_result.total,
                "total_pages": paginated_result.pages,
                "has_next": paginated_result.has_next,
                "has_prev": paginated_result.has_prev
            }
        }
        return response_data, None
    
    except Exception as e:
        db.session.rollback() 
        return None, f"Lỗi: {e}"

#done
def model_register(data):
    if User.query.filter_by(email=data.email).first():
        raise ValueError("Email already exists")

    default_role = get_role_by_name(name="user")
    if not default_role:
        raise ValueError("System error: Default role 'user' not found.")

    # Khởi tạo profile với thông tin mặc định của CineFluent
    new_profile = UserProfile(
        fullname=data.fullname,
        english_level='Beginner',
        total_points=0,
        streak_days=0
    )

    new_user = User(email=data.email)
    new_user.profile = new_profile
    new_user.set_password(data.password)
    new_user.roles.append(default_role)

    db.session.add(new_user)
    db.session.commit()
    return new_user
#done
def create_user_by_admin(data):
    if User.query.filter_by(email=data.email).first():
        raise ValueError(f"Email '{data.email}' is already taken")

    role_obj = get_role_by_name(name=data.role)
    if not role_obj:
        raise ValueError(f"Role '{data.role}' not found")

    new_profile = UserProfile(
        fullname=data.fullname,
        bio=data.bio,
        phone=data.phone,
        date_of_birth=data.date_of_birth,
        english_level=getattr(data, 'english_level', 'Beginner'), # Mới
        is_online=False
    )

    new_user = User(
        email=data.email,
        status='active'
    )

    new_user.set_password(data.password)
    new_user.profile = new_profile
    new_user.roles.append(role_obj)

    try:
        db.session.add(new_user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise ValueError(f"System error: {e}")
    return new_user

#done
def update_user_profile(user_id, data, avatar_file=None):
    user = User.query.get(user_id)
    if not user:
        raise ValueError("User not found")

    update_data = data.model_dump(exclude_unset=True)

    if not update_data and not avatar_file:
        raise ValueError("No data provided for update")

    # Cập nhật thông tin text
    for key, value in update_data.items():
        if key == 'email':
            if value != user.email:
                if User.query.filter_by(email=value).first():
                    raise ValueError(f"Email '{value}' is already taken")
                user.email = value
        # Thêm 'english_level' vào danh sách cho phép update
        elif key in ['fullname', 'bio', 'phone', 'date_of_birth', 'english_level']:
            setattr(user.profile, key, value)

    # CẬP NHẬT ẢNH: Lưu trực tiếp URL string vào avatar_url
    if avatar_file:
        cloud_data = upload_file(avatar_file)
        if not cloud_data:
            raise ValueError("Failed to upload file to Cloud")

        # Gán thẳng URL từ Cloudinary vào trường String
        user.profile.avatar_url = cloud_data['secure_url']

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise ValueError(f"System error while updating: {e}")

    return user
#done
def admin_update_user_profile(user_id, data, avatar_file=None):
    user = User.query.get(user_id)
    if not user:
        raise ValueError("User not found")

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        if key == 'role':
            role_obj = get_role_by_name(name=value)
            if role_obj:
                user.roles = [role_obj]
        elif key == 'email':
            if value != user.email:
                if User.query.filter_by(email=value).first():
                    raise ValueError(f"Email '{value}' is already taken")
                user.email = value
        elif key in ['status']: # Giữ lại các trường cũ nếu cần
            setattr(user, key, value)
        elif key in ['fullname', 'bio', 'phone', 'date_of_birth', 'english_level', 'total_points', 'streak_days']:
            setattr(user.profile, key, value)

    # CẬP NHẬT ẢNH CHO ADMIN
    if avatar_file:
        cloud_data = upload_file(avatar_file)
        if cloud_data:
            user.profile.avatar_url = cloud_data['secure_url']

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise ValueError(f"System error: {e}")

    return user

def delete_user(user_id):
    user = get_user_by_id(user_id)
    if not user:
        raise ValueError("User not found")
    db.session.delete(user)
    db.session.commit()
    return "Delete user successfully"

def get_all_users (page , per_page):
    paginated_result = User.query.paginate(page=page, per_page=per_page)
    users_data = UserSchema().dump(paginated_result, many=True)
    return {
        "users": users_data,
        "pagination": {
            "current_page": paginated_result.page,
            "per_page": paginated_result.per_page,
            "total_items": paginated_result.total,
            "total_pages": paginated_result.pages,
            "has_next": paginated_result.has_next,
            "has_prev": paginated_result.has_prev
        }
    }

def update_password(user_id, data):
    user = get_user_by_id(user_id)
    if not user:
        return "Không tìm thấy người dùng"
    if not data or not data.get('password_old') or not data.get('password_new'):
        return "Thiếu thông tin mật khẩu cũ hoặc mật khẩu mới"
    password_old = data.get('password_old')
    password_new = data.get('password_new')
    if not user.check_password(password=password_old):
        return "Mật khẩu cũ không đúng"

    user.set_password(password_new)
    db.session.commit()
    
    return None 

