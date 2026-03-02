from marshmallow import Schema, fields, post_dump
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List

class VideoReportSchema(Schema):
    id = fields.Int(dump_only=True)
    user_id = fields.Int()
    video_id = fields.Int()
    issue_type = fields.Str()
    description = fields.Str()
    status = fields.Str()
    created_at = fields.DateTime()

class VideoReportRequest(BaseModel):
    user_id: int = Field(..., description="ID người dùng")
    video_id: int = Field(..., description="ID video")
    issue_type: str = Field(..., description="Loại vấn đề")
    description: str = Field(..., description="Mô tả chi tiết vấn đề")

    @field_validator('issue_type')
    def validate_issue_type(cls, v):
        if v not in ['not_playing', 'wrong_subtitle', 'audio_sync_issue', 'other']:
            raise ValueError("issue_type phải là 'not_playing', 'wrong_subtitle', 'audio_sync_issue', 'other'")
        return v