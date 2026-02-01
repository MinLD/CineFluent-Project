from marshmallow import fields, Schema


class RoleSchema(Schema):
    id = fields.Integer()
    name = fields.String()
    description = fields.String()


class UserProfileSchema(Schema):
    # Cấu trúc đã được làm phẳng và loại bỏ MediaSchema
    fullname = fields.String()
    bio = fields.String()
    phone = fields.String()
    date_of_birth = fields.DateTime()
    avatar_url = fields.String()  # Thay đổi quan trọng: Trả về URL string trực tiếp
    is_online = fields.Boolean()

    # CineFluent Fields
    english_level = fields.String()  # [cite: 56]
    total_points = fields.Integer()  # [cite: 57]
    streak_days = fields.Integer()  # [cite: 58]


class UserSchema(Schema):
    id = fields.String()
    email = fields.String()
    status = fields.String()  # active, banned, pending [cite: 49]
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
    profile = fields.Nested(UserProfileSchema, dump_only=True)
    roles = fields.Nested(RoleSchema, many=True, dump_only=True)


class UserIDSchema(Schema):
    id = fields.String()