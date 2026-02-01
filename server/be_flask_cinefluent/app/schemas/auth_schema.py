from pydantic import BaseModel, EmailStr, Field



class AuthRequest(BaseModel):
    email: EmailStr = Field(..., description="Email người dùng")
    password: str = Field(..., min_length=8, description="Mật khẩu tối thiểu 8 ký tự")



    

