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
            "feedback": {"type": "STRING", "description": "Đóng vai giáo viên bản xứ: Chỉ ra 1 lỗi sai quan trọng nhất (âm cuối, trọng âm, nối âm,IPA) và hướng dẫn cách sửa cụ thể bằng tiếng Việt. Giọng văn tự nhiên, khích lệ. Dưới 30 từ."}
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
        print(f"Lỗi AI Audio Analysis: {e}")
        return {"success": False, "error": str(e)}

