# controller / users_controller
from flask import Blueprint, request

from ..utils.response import success_response, error_response
from flask import request
from .auth_controller import Role_required
from ..services.users_service import  model_search_user, model_register, get_all_users, \
    update_user_profile, delete_user, get_user_by_id, update_password, create_user_by_admin, admin_update_user_profile
from ..schemas.schemas import UserSchema
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..schemas.user_schema import CreateUserRequest, RegisterRequest, UpdateProfileRequest, AdminUpdateProfileRequest

users_bp = Blueprint('api/users', __name__)



@users_bp.route('/search', methods=['GET'])
def search_user():
    keyword = request.args.get('keyword')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    response_data, error = model_search_user({'keyword': keyword}, page, per_page)
    if error:
        return error_response(message=error, code=400, error_code="SEARCH_ERROR")
    return success_response(data=response_data, code=200, message="Search user successfully")
@users_bp.route('/', methods=['GET'])
@Role_required(role='admin')
@jwt_required()
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    return success_response(data=get_all_users(page, per_page), code=201, message="Get all users successfully")

@users_bp.route('/admin', methods=['POST'])
@Role_required(role='admin')
@jwt_required()
def create_admin():
    request_data = CreateUserRequest(**request.get_json())
    new_user = create_user_by_admin(request_data)
    return success_response(
        data=UserSchema().dump(new_user),
        code=201,
        message="Created user successfully"
    )

    

@users_bp.route('/', methods=['POST'], strict_slashes=False)
def register(): 
    request_data = RegisterRequest(**request.get_json())
    req = model_register(request_data)
    return success_response(code=201 , data=UserSchema().dump(req), message="Người dùng tạo tài khoản thành công" )



     

@users_bp.route('/<string:user_id>', methods=['PATCH'])
@Role_required(role='admin')
@jwt_required()
def update_user(user_id):
    current_user_id = user_id

    form_data = request.form.to_dict()
    request_data = AdminUpdateProfileRequest(**form_data)

    avatar_file = request.files.get('avatar')

    updated_user = admin_update_user_profile(user_id=current_user_id, data=request_data, avatar_file=avatar_file)
    return success_response(
        data=UserSchema().dump(updated_user),
        message="Profile updated successfully"
    )


@users_bp.route('/profile', methods=['PATCH'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()

    form_data = request.form.to_dict()
    request_data = UpdateProfileRequest(**form_data)

    avatar_file = request.files.get('avatar')

    updated_user = update_user_profile(user_id=current_user_id, data=request_data, avatar_file=avatar_file)
    return success_response(
        data=UserSchema().dump(updated_user),
        message="Profile updated successfully"
    )


@users_bp.route('/<string:user_id>', methods=['DELETE'])
@jwt_required()
@Role_required(role='admin')
def controller_delete_user(user_id):
    user = delete_user(user_id)
    return success_response(message=user, code=200, data="")

@users_bp.route('/<string:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    user = get_user_by_id(user_id)
    if not user:
        return error_response("User not found", 404, error_code="USER_NOT_FOUND")
    return success_response(data=UserSchema().dump(user), code=200, message="Get user successfully")

@users_bp.route('/password/<string:user_id>', methods=['PATCH'])
@jwt_required()
def update_password_user(user_id):
    data = request.get_json()
    error = update_password(user_id, data)
    if error:
        return error_response(error, 400)
    return success_response(message="Update password successfully", code=201, )


   

