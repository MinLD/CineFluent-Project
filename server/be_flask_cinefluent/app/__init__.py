# app/__init__.py

from flask import Flask , jsonify

from .extensions import db, migrate, jwt, cors, socketio
from config import config
from .models.models_model import User, TokenBlocklist
import cloudinary

from .utils.error_handlers import register_error_handlers
from .utils.response import error_response, success_response


def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    app.json.sort_keys = False
    db.init_app(app)
    register_error_handlers(app)
    # Gọi hàm init_app từ đối tượng cors
    cors.init_app(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}},
                  supports_credentials=True)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cloudinary.config(
        cloud_name=app.config['CLOUDINARY_CLOUD_NAME'],
        api_key=app.config['CLOUDINARY_API_KEY'],
        api_secret=app.config['CLOUDINARY_API_SECRET']
    )



    from .controller.auth_controller import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    from .controller.users_controller import users_bp
    app.register_blueprint(users_bp, url_prefix='/api/users')

    from  .controller.category_controller import  category_bp
    app.register_blueprint(category_bp, url_prefix='/api/categories')

    from .controller.video_controller import video_bp
    app.register_blueprint(video_bp, url_prefix='/api/videos')









    



    


    # check_if_token_in_blocklist
    @jwt.token_in_blocklist_loader
    def check_if_token_in_blocklist(jwt_header, jwt_data):
        jti = jwt_data["jti"]
        return TokenBlocklist.query.filter_by(jti=jti).first() is not None

    #load user
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        return User.query.get(identity)

    #additional clams

    @jwt.additional_claims_loader
    def make_additional_claims(identity):
        
        if identity == "admin":
            return {'is_admin': True}
        return {'is_admin': False}


    # jwt error handler
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        return error_response(message="The token has expired",error_code="TOKEN_EXPIRED", code=401 )


    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return error_response(message="Signature verification failed.", code=401, error_code="invalid_token" )
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return error_response(message="Unauthorized.", code=401, error_code="invalid_token")
    
    from .models import models_model
    from .services import users_service, role_service, auth_service,upload_service
    return app