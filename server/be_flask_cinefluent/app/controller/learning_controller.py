from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.learning_service import evaluate_audio_shadowing_service, get_quick_dictionary_service
from  ..utils.response import  success_response, error_response
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

