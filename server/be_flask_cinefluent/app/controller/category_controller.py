from flask import Blueprint, request
from ..schemas.category_schema import CreateCategoryRequest, CategoryResponse, UpdateCategoryRequest
from ..utils.response import success_response, error_response
from ..services.category_service import (
    create_category,  update_category,
    get_all_categoies, delete_category, search_category
)

category_bp = Blueprint('api/categories', __name__)

@category_bp.route('/', methods=['POST'])
def create():
    try:
        form_data = request.form.to_dict()
        req_data = CreateCategoryRequest(**form_data)
        avatar = request.files.get('avatar')
        new_cat = create_category(req_data, avatar)
        return success_response(data=CategoryResponse().dump(new_cat), code=201)
    except Exception as e:
        return error_response(str(e), 400)

@category_bp.route('/', methods=['GET'])
def get_all():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    return success_response(data=get_all_categoies(page, per_page))

@category_bp.route('/<int:cat_id>', methods=['PATCH'])
def update(cat_id):
    try:
        form_data = request.form.to_dict()
        req_data = UpdateCategoryRequest(**form_data)
        avatar = request.files.get('avatar')
        updated_cat = update_category(cat_id, req_data, avatar)
        return success_response(data=CategoryResponse().dump(updated_cat))
    except Exception as e:
        return error_response(str(e), 400)

@category_bp.route('/search', methods=['GET'])
def search():
    keyword = request.args.get('keyword')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    return success_response(data=search_category(keyword, page, per_page))

@category_bp.route('/<int:cat_id>', methods=['DELETE'])
def delete(cat_id):
    try:
        delete_category(cat_id)
        return success_response(message="Category deleted")
    except Exception as e:
        return error_response(str(e), 400)