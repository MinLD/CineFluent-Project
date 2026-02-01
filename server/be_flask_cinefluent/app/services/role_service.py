from app.models.models_model import Role
def get_role_by_name(name):
    return Role.query.filter_by(name=name).first()