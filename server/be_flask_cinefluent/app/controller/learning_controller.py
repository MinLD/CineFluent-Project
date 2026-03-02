from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.learning_service import evaluate_audio_shadowing_service, get_quick_dictionary_service, generate_flashcard_exercises_service
from ..utils.response import success_response, error_response
from ..models.models_model import FlashcardExercise
from ..extensions import db
learning_bp = Blueprint('learning', __name__)


@learning_bp.route('/test-audio', methods=['POST'])
def test_audio_analysis():
    try:
        data = request.json
        
        original_text = data.get('original_text')
        audio_base64 = data.get('audio_base64')
        
        if not original_text or not audio_base64:
            return error_response(message='Missing original_text or audio_base64', code=400)
        
        # Gọi AI phân tích audio
        result = evaluate_audio_shadowing_service(original_text, audio_base64)
        
        if result.get('success'):
            return success_response(data=result['data'], message='Audio analysis completed', code=200)
        else:
            return error_response(message=f"AI Error: {result.get('error')}", code=500)
            
    except Exception as e:
        return error_response(message=f"Server Error: {str(e)}", code=500)

@learning_bp.route('/quick-dictionary', methods=['POST'])
def quick_dictionary_lookup():
    try:
        data = request.json
        word = data.get('word')
        context = data.get('context')

        if not word or not context:
            return error_response(message='Missing word or context', code=400)

        # Gọi AI tra từ
        result = get_quick_dictionary_service(word, context)

        if result.get('success'):
            return success_response(data=result['data'], message='Dictionary lookup completed', code=200)
        else:
            return error_response(message=f"AI Error: {result.get('error')}", code=500)

    except Exception as e:
        return error_response(message=f"Server Error: {str(e)}", code=500)

@learning_bp.route('/generate_exercises', methods=['POST'])
@jwt_required()
def generate_exercises():
    try:
        data = request.json
        flashcards = data.get('flashcards')

        if not flashcards or not isinstance(flashcards, list):
            return error_response(message='Missing or invalid flashcards data', code=400)

        # Gọi AI tạo bài tập
        result = generate_flashcard_exercises_service(flashcards)

        if result.get('success'):
            quiz_data = result['data']
            user_id = get_jwt_identity()

            # Calculate total questions
            total_questions = (
                len(quiz_data.get('multiple_choice', [])) +
                len(quiz_data.get('fill_in_blank', [])) +
                len(quiz_data.get('translation', []))
            )

            # Save to database
            new_exercise = FlashcardExercise(
                user_id=user_id,
                quiz_data=quiz_data,
                total_questions=total_questions,
                status='PENDING'
            )
            db.session.add(new_exercise)
            db.session.commit()

            return success_response(
                data={
                    "id": new_exercise.id,
                    "quiz_data": quiz_data,
                    "status": new_exercise.status,
                    "total_questions": total_questions
                }, 
                message='Exercise generation completed and saved', 
                code=200
            )
        else:
            return error_response(message=f"AI Error: {result.get('error')}", code=500)

    except Exception as e:
        return error_response(message=f"Server Error: {str(e)}", code=500)

@learning_bp.route('/exercises', methods=['GET'])
@jwt_required()
def get_exercises_history():
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)

        exercises_query = FlashcardExercise.query.filter_by(user_id=user_id).order_by(FlashcardExercise.created_at.desc())
        pagination = exercises_query.paginate(page=page, per_page=per_page)

        exercises_list = []
        for ex in pagination.items:
            exercises_list.append({
                "id": ex.id,
                "score": ex.score,
                "total_questions": ex.total_questions,
                "status": ex.status,
                "created_at": ex.created_at.isoformat(),
                "quiz_data": ex.quiz_data,
                "user_answers": ex.user_answers
            })

        return success_response(data={
            "exercises": exercises_list,
            "pagination": {
                "current_page": pagination.page,
                "per_page": pagination.per_page,
                "total_items": pagination.total,
                "total_pages": pagination.pages,
                "has_next": pagination.has_next,
                "has_prev": pagination.has_prev
            }
        }, message='Exercises history retrieved')

    except Exception as e:
        return error_response(message=f"Server Error: {str(e)}", code=500)

@learning_bp.route('/exercises/<int:exercise_id>/submit', methods=['POST'])
@jwt_required()
def submit_exercise(exercise_id):
    try:
        user_id = get_jwt_identity()
        data = request.json
        score = data.get('score')
        user_answers = data.get('user_answers') # New field

        if score is None:
            return error_response(message='Missing score', code=400)

        exercise = FlashcardExercise.query.get_or_404(exercise_id)
        
        if exercise.user_id != user_id:
            return error_response(message='Unauthorized', code=403)

        exercise.score = float(score)
        exercise.user_answers = user_answers # Save them!
        exercise.status = 'COMPLETED'
        db.session.commit()

        return success_response(message='Score submitted successfully')

    except Exception as e:
        return error_response(message=f"Server Error: {str(e)}", code=500)

@learning_bp.route('/exercises/<int:exercise_id>/reset', methods=['POST'])
@jwt_required()
def reset_exercise(exercise_id):
    try:
        user_id = get_jwt_identity()
        exercise = FlashcardExercise.query.get_or_404(exercise_id)

        if exercise.user_id != user_id:
            return error_response(message='Unauthorized', code=403)

        exercise.score = None
        exercise.user_answers = None
        exercise.status = 'PENDING'
        db.session.commit()

        return success_response(message='Exercise reset successfully')

    except Exception as e:
        return error_response(message=f"Server Error: {str(e)}", code=500)

