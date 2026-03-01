from marshmallow import Schema, fields, post_dump
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List

class ImportVideoBase(BaseModel):
    level: str = Field("Intermediate", description="Trình độ: Beginner, Intermediate, Advanced")
    category_ids: Optional[List[int]] = Field(None, description="Mảng ID danh mục")
    status: str = Field("private", description="Trạng thái: public, private")

    @field_validator('level')
    def validate_level(cls, v):
        if v not in ['Beginner', 'Intermediate', 'Advanced']:
            raise ValueError("level phải là 'Beginner', 'Intermediate' hoặc 'Advanced'")
        return v

    @field_validator('status')
    def validate_status(cls, v):
        if v not in ['public', 'private']:
            raise ValueError("status phải là 'public' hoặc 'private'")
        return v

class ImportYoutubeRequest(ImportVideoBase):
    url: str = Field(..., description="YouTube URL")

class ImportLocalRequest(ImportVideoBase):
    tmdb_id: str = Field(..., description="TMDB ID")

class ImportLocalManualRequest(ImportVideoBase):
    title: str = Field(..., min_length=1, max_length=255, description="Tiêu đề phim")
    original_title: Optional[str] = Field(None, max_length=255, description="Tiêu đề gốc")
    description: str = Field(..., max_length=2000, description="Mô tả phim")
    author: str = Field(..., max_length=255, description="Đạo diễn/Tác giả")
    country: str = Field(..., max_length=100, description="Quốc gia")
    release_year: int = Field(..., description="Năm phát hành")
    runtime: int = Field(..., gt=0, description="Thời lượng (phút)")
    thumbnail_url: str = Field(..., max_length=500, description="URL ảnh bìa")
    backdrop_url: str = Field(..., max_length=500, description="URL ảnh nền")
    category_ids: List[int] = Field(..., description="Danh sách ID danh mục")
    tmdb_id: Optional[str] = Field(None, description="TMDB ID")
    @field_validator('release_year')
    def validate_year(cls, v):
        if v is not None:
            from datetime import datetime
            current_year = datetime.now().year
            if not (1888 <= v <= current_year + 5):
                raise ValueError(f"release_year phải từ 1888 đến {current_year + 5}")
        return v

class UpdateVideoRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    original_title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    author: Optional[str] = Field(None, max_length=255)
    country: Optional[str] = Field(None, max_length=100)
    release_year: Optional[int] = Field(None)
    runtime: Optional[int] = Field(None, gt=0)
    level: Optional[str] = Field(None)
    status: Optional[str] = Field(None)
    category_ids: Optional[List[int]] = Field(None)
    tmdb_id: Optional[str] = Field(None)
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    backdrop_url: Optional[str] = Field(None, max_length=500)
    stream_url: Optional[str] = Field(None, max_length=1000)

    @field_validator('level')
    def validate_level(cls, v):
        if v is not None and v not in ['Beginner', 'Intermediate', 'Advanced']:
            raise ValueError("level phải là 'Beginner', 'Intermediate' hoặc 'Advanced'")
        return v

    @field_validator('status')
    def validate_status(cls, v):
        if v is not None and v not in ['public', 'private']:
            raise ValueError("status phải là 'public' hoặc 'private'")
        return v

    @field_validator('release_year')
    def validate_year(cls, v):
        if v is not None:
            from datetime import datetime
            current_year = datetime.now().year
            if not (1888 <= v <= current_year + 5):
                raise ValueError(f"release_year phải từ 1888 đến {current_year + 5}")
        return v

class CategorySchema(Schema):
    id = fields.Int()
    name = fields.Str()
    slug = fields.Str()
    avatar_url = fields.Str()

class SubtitleSchema(Schema):
    id = fields.Int()
    start_time = fields.Float()
    end_time = fields.Float()
    content_en = fields.Str()
    content_vi = fields.Str()

class VideoSchema(Schema):
    id = fields.Int()
    tmdb_id = fields.Int()
    title = fields.Str()
    original_title = fields.Str()
    description = fields.Str()
    slug = fields.Str()
    backdrop_url = fields.Str()
    source_url = fields.Str()
    stream_url = fields.Str()
    thumbnail_url = fields.Str()
    subtitle_vtt_url = fields.Str()
    author = fields.Str()
    runtime = fields.Int()
    country = fields.Str()
    release_year = fields.Int()
    source_type = fields.Str()
    level = fields.Str()
    status = fields.Str()
    view_count = fields.Int()
    categories = fields.List(fields.Nested(CategorySchema))
    # subtitles = fields.List(fields.Nested(SubtitleSchema))

class VideoDetailSchema(VideoSchema):
    pass