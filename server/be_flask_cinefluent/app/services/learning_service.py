from google.genai import types
import json
import base64
from ..utils.ai_engine import cinefluent_ai


def evaluate_audio_shadowing_service(original_text: str, audio_base64: str):
    shadowing_schema = {
        "type": "OBJECT",
        "properties": {
            "transcript": {"type": "STRING"},
            "score": {"type": "INTEGER"},
            "wrong_words": { 
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "description": "List of words from the TARGET TEXT that were mispronounced or omitted"
            },
            "feedback": {"type": "STRING", "description": "Đóng vai giáo viên bản xứ khó tính: Chỉ ra vài lỗi sai quan trọng nhất (âm cuối, trọng âm, nối âm,IPA) và hướng dẫn cách sửa cụ thể bằng tiếng Việt. Giọng văn tự nhiên. Dưới 40 từ."}
        },
        "required": ["transcript", "score", "wrong_words"]
    }


    optimized_prompt = f"Target text: {original_text}"

    try:

        response = cinefluent_ai.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                {
                    "parts": [
                        {"text": optimized_prompt},
                        {
                            "inline_data": {
                                "mime_type": "audio/webm",
                                "data": audio_base64
                            }
                        }
                    ]
                }
            ],
            config=types.GenerateContentConfig(
                temperature=0.3,
                response_mime_type="application/json",
                response_schema=shadowing_schema  # <--- CHÌA KHÓA TỐI ƯU Ở ĐÂY
            )
        )

        result = json.loads(response.text)


        return {"success": True, "data": result}

    except Exception as e:
        error_str = str(e)
        print(f"Lỗi AI Audio Analysis: {error_str}")
        
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
             return {"success": False, "error": "Hệ thống đang quá tải (Rate Limit). Vui lòng thử lại sau 30 giây."}
        
        return {"success": False, "error": error_str}

def get_quick_dictionary_service(word: str, context_sentence: str):
    dictionary_schema = {
        "type": "OBJECT",
        "properties": {
            "word": {"type": "STRING"},
            "ipa": {"type": "STRING"},
            "pos": {"type": "STRING", "description": "Part of speech"},
            "definition_vi": {"type": "STRING"},
            "example_en": {"type": "STRING"},
            "example_vi": {"type": "STRING"}
        },
        "required": ["word", "ipa", "pos", "definition_vi", "example_en", "example_vi"]
    }

    prompt = f"""
    Word: "{word}"
    Sentence: "{context_sentence}"

    Rules:
    - Meaning must match the sentence
    - One meaning only
    - "word" must be base form
    - definition_vi: ONE short Vietnamese sentence (max 20 words)

    Return JSON with:
    word, ipa, pos, definition_vi, example_en, example_vi
    """

    try:
        response = cinefluent_ai.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt],
            config=types.GenerateContentConfig(
                temperature=0.3,
                response_mime_type="application/json",
                response_schema=dictionary_schema
            )
        )

        result = json.loads(response.text)
        return {"success": True, "data": result}

    except Exception as e:
        error_str = str(e)
        print(f"Lỗi Quick Dictionary: {error_str}")
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
            return {"success": False, "error": "Hệ thống đang quá tải. Vui lòng thử lại sau."}
        return {"success": False, "error": error_str}



