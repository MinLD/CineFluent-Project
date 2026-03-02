from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.models_model import TypingGameMap, TypingGameStage
from ..services.learning_service import generate_typing_game_content_service
from ..extensions import db
from ..utils.response import success_response, error_response
import logging

logger = logging.getLogger(__name__)

typing_game_bp = Blueprint('typing_game', __name__)

@typing_game_bp.route('/maps', methods=['GET'])
def get_maps():
    try:
        maps = TypingGameMap.query.all()
        return success_response(data=[m.to_dict() for m in maps])
    except Exception as e:
        return error_response(message=str(e), code=500)

@typing_game_bp.route('/maps/<int:map_id>/stages', methods=['GET'])
def get_map_stages(map_id):
    try:
        stages = TypingGameStage.query.filter_by(map_id=map_id).order_by(TypingGameStage.chapter_number).all()
        return success_response(data=[s.to_dict() for s in stages])
    except Exception as e:
        return error_response(message=str(e), code=500)

# Admin routes
@typing_game_bp.route('/admin/maps', methods=['POST'])
@jwt_required()
def create_map():
    try:
        data = request.json
        new_map = TypingGameMap(
            name=data.get('name'),
            thumbnail_url=data.get('thumbnail_url'),
            description=data.get('description'),
            total_chapters=data.get('total_chapters', 5)
        )
        db.session.add(new_map)
        db.session.commit()
        return success_response(data=new_map.to_dict(), message="Map created successfully", code=201)
    except Exception as e:
        db.session.rollback()
        return error_response(message=str(e), code=500)

@typing_game_bp.route('/admin/maps/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
def handle_map(id):
    map_obj = TypingGameMap.query.get_or_404(id)
    if request.method == 'DELETE':
        try:
            # Delete associated stages first
            TypingGameStage.query.filter_by(map_id=id).delete()
            db.session.delete(map_obj)
            db.session.commit()
            return success_response(message="Map and its stages deleted successfully")
        except Exception as e:
            db.session.rollback()
            return error_response(message=str(e), code=500)
    
    try:
        data = request.json
        map_obj.name = data.get('name', map_obj.name)
        map_obj.thumbnail_url = data.get('thumbnail_url', map_obj.thumbnail_url)
        map_obj.description = data.get('description', map_obj.description)
        map_obj.total_chapters = data.get('total_chapters', map_obj.total_chapters)
        db.session.commit()
        return success_response(message="Map updated successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(message=str(e), code=500)

@typing_game_bp.route('/admin/stages', methods=['POST'])
@jwt_required()
def create_stage():
    try:
        data = request.json
        new_stage = TypingGameStage(
            map_id=data.get('map_id'),
            chapter_number=data.get('chapter_number'),
            content=data.get('content'),
            difficulty=data.get('difficulty', 'Medium')
        )
        db.session.add(new_stage)
        db.session.commit()
        return success_response(data=new_stage.to_dict(), message="Stage created successfully", code=201)
    except Exception as e:
        db.session.rollback()
        return error_response(message=str(e), code=500)

@typing_game_bp.route('/admin/stages/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
def handle_stage(id):
    stage = TypingGameStage.query.get_or_404(id)
    if request.method == 'DELETE':
        try:
            db.session.delete(stage)
            db.session.commit()
            return success_response(message="Stage deleted successfully")
        except Exception as e:
            db.session.rollback()
            return error_response(message=str(e), code=500)
            
    try:
        data = request.json
        stage.chapter_number = data.get('chapter_number', stage.chapter_number)
        stage.content = data.get('content', stage.content)
        stage.difficulty = data.get('difficulty', stage.difficulty)
        db.session.commit()
        return success_response(message="Stage updated successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(message=str(e), code=500)

@typing_game_bp.route('/admin/generate-ai', methods=['POST'])
@jwt_required()
def generate_ai_map():
    try:
        data = request.json
        topic = data.get('topic')
        if not topic:
            return error_response(message="Vui lòng cung cấp chủ đề (topic)", code=400)

        # 1. Gọi service AI
        ai_result = generate_typing_game_content_service(topic)
        if not ai_result.get('success'):
            return error_response(message=ai_result.get('error'), code=500)
        
        game_data = ai_result['data']
        
        # 2. Lưu Map
        new_map = TypingGameMap(
            name=game_data['name'],
            description=game_data['description'],
            total_chapters=len(game_data['stages'])
        )
        db.session.add(new_map)
        db.session.flush() # Để lấy map_id
        
        # 3. Lưu Stages
        for s in game_data['stages']:
            new_stage = TypingGameStage(
                map_id=new_map.id,
                chapter_number=s['chapter_number'],
                content=s['content'],
                difficulty=s['difficulty']
            )
            db.session.add(new_stage)
        
        db.session.commit()
        return success_response(data={"id": new_map.id}, message="AI đã tạo map thành công!", code=201)

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error AI generating map: {str(e)}")
        return error_response(message=f"Lỗi khi lưu map AI: {str(e)}", code=500)
