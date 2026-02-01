from marshmallow import Schema, fields

class CategorySchema(Schema):
    id = fields.Int()
    name = fields.Str()
    avatar_url = fields.Str()

class SubtitleSchema(Schema):
    start_time = fields.Float()
    end_time = fields.Float()
    content_en = fields.Str()
    content_vi = fields.Str()

class VideoSchema(Schema):
    id = fields.Int()
    youtube_id = fields.Str()
    title = fields.Str()
    thumbnail_url = fields.Str()
    level = fields.Str()
    view_count = fields.Int()
    category = fields.Nested(CategorySchema)
    subtitles = fields.List(fields.Nested(SubtitleSchema))



class VideoDetailSchema(Schema):
        id = fields.Int()
        youtube_id = fields.Str()
        title = fields.Str()
        thumbnail_url = fields.Str()
        source_url = fields.Str()
        # Lồng danh sách subtitles vào đây
        subtitles = fields.List(fields.Nested(SubtitleSchema))