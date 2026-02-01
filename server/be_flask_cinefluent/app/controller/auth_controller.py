#controller/auth_controller.py
from flask import Blueprint, request, jsonify
from ..utils.response import success_response, error_response
from flask_jwt_extended import jwt_required, get_jwt
from functools import wraps
from ..services.auth_service import generate_tokens, whoami, logout, refresh_token, login_with_google
from ..schemas.auth_schema import AuthRequest
auth_bp = Blueprint('api/auth', __name__)
def Role_required(role='admin'):
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()  
        def decorator(*args, **kwargs):
            claims = get_jwt()
            print(claims)
            if role in claims.get("roles", []):
                return fn(*args, **kwargs)
            else:
                return jsonify({"message": "Admin access required!"}), 403
        return decorator
    return wrapper


@auth_bp.route('/login', methods=['POST'])
def login():
    data_request = AuthRequest(**request.get_json())
    access_token, refresh_token = generate_tokens(data_request)

    return success_response(code=201, data={
        'access_token': access_token,
        'refresh_token': refresh_token
    }, message="Login successfully")
@auth_bp.route('/google-login', methods=['POST'])
def google_auth():
    data = request.json
    token = data.get('credential') # Token Google gửi từ Frontend

    if not token:
        return error_response(message="Invalid credential", error_code="invalid_credential", code=404 )

    try:
        # Gọi service
        result = login_with_google(token)
        return success_response(code=200, data=result, message="Login successfully")
    except ValueError:
        return error_response(message="Invalid credential", error_code="invalid_credential", code=404)
    except Exception as e:
        return error_response(message=str(e), error_code=500)
@auth_bp.route('/whoami', methods=['GET'])
@jwt_required()
def whoami_controller():
    return success_response(data=whoami(), code=201, message="Whoami successfully")

@auth_bp.route('/refresh', methods=['POST']) 
@jwt_required(refresh=True)
def refresh():
    new_access_token = refresh_token()
    return success_response(data={'access_token': new_access_token}, code=201, message="Refresh successfully")

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout_controller():
    return success_response(data=logout(), code=201, message="Logout successfully")

   


   

