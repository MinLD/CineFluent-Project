from pydantic import BaseModel, Field
from typing import Optional
from marshmallow import fields, Schema

class CreateCategoryRequest(BaseModel):
    name: str = Field(..., min_length=2, description="Tên danh mục (vd: Phim Hành Động)")
    description: Optional[str] = Field(None, description="Mô tả ngắn về danh mục")

class UpdateCategoryRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2)
    description: Optional[str] = Field(None)

class CategoryResponse(Schema):
    id = fields.Integer()
    name = fields.String()
    slug = fields.String()
    description = fields.String()
    avatar_url = fields.String() # Trả về URL string trực tiếp