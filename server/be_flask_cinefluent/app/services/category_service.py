from ..models.models_model import Category
from ..extensions import db
from slugify import slugify
from .upload_service import upload_file
from ..schemas.category_schema import CategoryResponse
from sqlalchemy import or_


def get_category(**filters):
    return Category.query.filter_by(**filters).first()


def get_category_by_id(cat_id):
    return Category.query.get(cat_id)


def create_category(data, avatar_file):
    if get_category(name=data.name):
        raise ValueError(f"Category '{data.name}' already exists")

    slug = slugify(data.name)
    if get_category(slug=slug):
        raise ValueError(f"Slug '{slug}' already exists")

    new_category = Category(name=data.name, slug=slug, description=data.description)

    if avatar_file:
        cloud_data = upload_file(avatar_file)
        if cloud_data:
            new_category.avatar_url = cloud_data['secure_url']

    try:
        db.session.add(new_category)
        db.session.commit()
        return new_category
    except Exception as e:
        db.session.rollback()
        raise e


def update_category(cat_id, data, avatar_file):
    cat = get_category_by_id(cat_id)
    if not cat:
        raise ValueError("Category does not exist")

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        if key == 'name' and value != cat.name:
            if get_category(name=value):
                raise ValueError(f"Category '{value}' already exists")
            cat.slug = slugify(value)
        setattr(cat, key, value)

    if avatar_file:
        cloud_data = upload_file(avatar_file)
        if cloud_data:
            cat.avatar_url = cloud_data['secure_url']  # Gán trực tiếp URL

    try:
        db.session.commit()
        return cat
    except Exception as e:
        db.session.rollback()
        raise e


def get_all_categoies(page, per_page):
    paginated_result = Category.query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        "categories": CategoryResponse().dump(paginated_result.items, many=True),
        "pagination": {
            "current_page": paginated_result.page,
            "total_items": paginated_result.total,
            "total_pages": paginated_result.pages,
            "has_next": paginated_result.has_next,
            "has_prev": paginated_result.has_prev
        }
    }


def delete_category(cat_id):
    cat = get_category_by_id(cat_id)
    if not cat:
        raise ValueError("Category does not exist")
    try:
        db.session.delete(cat)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise e


def search_category(keyword, page, per_page):
    if not keyword:
        raise ValueError("Keyword is required")
    search_pattern = f"%{keyword}%"
    paginated_result = Category.query.filter(
        or_(
            Category.name.ilike(search_pattern),
            Category.description.ilike(search_pattern),
            Category.slug.ilike(search_pattern),
            Category.id.ilike(search_pattern)
        )
    ).paginate(page=page, per_page=per_page, error_out=False)

    return {
        "categories": CategoryResponse().dump(paginated_result.items, many=True),
        "pagination": {
            "current_page": paginated_result.page,
            "total_items": paginated_result.total,
            "total_pages": paginated_result.pages
        }
    }