from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.models_model import Flashcard
from ..extensions import db
from ..utils.response import success_response, error_response
import logging

logger = logging.getLogger(__name__)

flashcard_bp = Blueprint('flashcard_bp', __name__)

@flashcard_bp.route('/', methods=['POST'])
@jwt_required()
def add_flashcard():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        video_id = data.get('video_id')
        word = data.get('word')
        context_sentence = data.get('context_sentence')
        ipa = data.get('ipa')
        pos = data.get('pos')
        definition_vi = data.get('definition_vi')
        example_en = data.get('example_en')
        example_vi = data.get('example_vi')

        if not video_id or not word:
            return error_response(message="Thiếu video_id hoặc từ vựng", code=400)

        new_flashcard = Flashcard(
            user_id=user_id,
            video_id=video_id,
            word=word,
            context_sentence=context_sentence,
            ipa=ipa,
            pos=pos,
            definition_vi=definition_vi,
            example_en=example_en,
            example_vi=example_vi
        )

        db.session.add(new_flashcard)
        db.session.commit()

        return success_response(
            message="Đã lưu từ vựng vào Flashcard thành công",
            data={"flashcard_id": new_flashcard.id},
            code=201
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Lỗi khi thêm flashcard: {str(e)}")
        return error_response(message="Có lỗi hệ thống khi lưu từ vựng", code=500)


@flashcard_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_flashcards():
    try:
        user_id = get_jwt_identity()

        flashcards = Flashcard.query.filter_by(user_id=user_id).order_by(Flashcard.created_at.desc()).all()
        
        result = []
        for f in flashcards:
            result.append({
                "id": f.id,
                "video_id": f.video_id,
                "word": f.word,
                "context_sentence": f.context_sentence,
                "ipa": f.ipa,
                "pos": f.pos,
                "definition_vi": f.definition_vi,
                "example_en": f.example_en,
                "example_vi": f.example_vi,
                "created_at": f.created_at.isoformat()
            })

        return success_response(data=result)

    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách flashcard: {str(e)}")
        return error_response(message="Có lỗi hệ thống", code=500)
