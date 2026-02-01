from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime


# Request đăng ký mặc định cho User
class RegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="Email người dùng")
    password: str = Field(..., min_length=8, description="Mật khẩu tối thiểu 8 ký tự")
    fullname: str = Field(..., min_length=2, max_length=50, description="Họ và tên")


# Request tạo User từ phía Admin
class CreateUserRequest(BaseModel):
    email: EmailStr = Field(..., description="Email duy nhất")
    password: str = Field(..., min_length=8, description="Mật khẩu")
    fullname: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=10, pattern=r'^\d+$')
    bio: Optional[str] = Field(None, max_length=255)
    date_of_birth: Optional[datetime] = Field(None)

    # CineFluent Fields
    english_level: Optional[str] = Field("Beginner", description="Beginner, Intermediate, Advanced")
    role: str = Field(..., description="admin, user")

    @field_validator('role')
    def lowercase_role(cls, v):
        return v.lower()


# Request người dùng tự cập nhật Profile
class UpdateProfileRequest(BaseModel):
    fullname: Optional[str] = Field(None, min_length=2, max_length=100)
    bio: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=10, pattern=r'^\d+$')
    date_of_birth: Optional[datetime] = Field(None)

    # Cho phép người dùng cập nhật trình độ mong muốn
    english_level: Optional[str] = Field(None)


# Request Admin cập nhật thông tin User
class AdminUpdateProfileRequest(BaseModel):
    email: Optional[EmailStr] = None
    fullname: Optional[str] = None
    status: Optional[str] = None  # active, banned, pending
    role: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None

    # CineFluent Stats
    english_level: Optional[str] = None
    total_points: Optional[int] = None
    streak_days: Optional[int] = None

    @field_validator('role')
    def lowercase_role(cls, v):
        return v.lower() if v else None