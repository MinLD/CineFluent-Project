from google.genai import types
import json
import base64
from ..utils.ai_engine import cinefluent_ai
from deep_translator import GoogleTranslator


def translate_text(text: str, target_lang: str = 'vi') -> str:
    try:
        if not text:
            return ""
        # translator = GoogleTranslator(source='auto', target=target_lang)
        return GoogleTranslator(source='auto', target=target_lang).translate(text)
    except Exception as e:
        print(f"Translation error: {e}")
        return text


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
            "feedback": {"type": "STRING", "description": "Đóng vai giáo viên bản xứ khó tính: Chỉ ra vài lỗi sai quan trọng nhất (âm cuối, trọng âm, nối âm,IPA) và hướng dẫn cách sửa cụ thể bằng tiếng Việt. Giọng văn tự nhiên. Dưới 20 từ."}
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


def suggest_multiple_categories(title: str, year: str = None):
  
    category_list_schema = {
        "type": "OBJECT",
        "properties": {
            "categories": {
                "type": "ARRAY",
                "items": {"type": "STRING"}
            }
        },
        "required": ["categories"]
    }

    year_str = f" ({year})" if year else ""
    prompt = f"""
    Title: "{title}{year_str}"

    Hãy gợi ý danh sách các thể loại phim (Genres/Themes) phù hợp nhất bằng tiếng Việt.
    
    Quy định:
    - Trả về danh sách từ 2-5 thể loại quan trọng nhất.
    - Tên thể loại phải phổ thông, ngắn gọn (1-3 từ).
    - Ví dụ: "Hành động", "Viễn tưởng", "Lãng mạn", "Hoạt hình", "Gia đình", "Kinh dị".
    - Viết hoa chữ cái đầu cho mỗi từ.

    Chỉ trả về JSON.
    """

    try:
        response = cinefluent_ai.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt],
            config=types.GenerateContentConfig(
                temperature=0.4,
                response_mime_type="application/json",
                response_schema=category_list_schema
            )
        )

        result = json.loads(response.text)
        categories = result.get("categories", [])
        print(f"✅ AI Suggested Categories: {categories}")
        return {"success": True, "data": categories}

    except Exception as e:
        print(f"❌ Lỗi AI Multiple Category Suggestion: {str(e)}")
        if 'response' in locals() and hasattr(response, 'text'):
            print(f"🔍 AI Raw Response: {response.text}")
        # Fallback cơ bản
        return {"success": False, "error": str(e), "data": ["Phim"]}


def translate_batch(texts: list[str], target_lang: str = 'vi') -> list[str]:
    """
    Dịch danh sách văn bản sang ngôn ngữ đích sử dụng Batch request.
    Tối ưu hóa tốc độ bằng cách gộp nhiều câu thành 1 request.
    """
    if not texts:
        return []

    from deep_translator import GoogleTranslator
    import time

    def _translate_with_retry(text, max_retries=3):
        for attempt in range(max_retries):
            try:
                return GoogleTranslator(source='auto', target=target_lang).translate(text)
            except Exception as e:
                error_str = str(e)
                # Check for rate limit errors
                if '429' in error_str or 'Too Many Requests' in error_str:
                    if attempt < max_retries - 1:
                        time.sleep((2 ** attempt) * 1)
                    else:
                        raise e
                else:
                    raise e
        return text

    # Tính batch size động
    total_chars = sum(len(text) for text in texts)
    avg_chars = total_chars / len(texts) if texts else 50
    
    MAX_CHARS_PER_BATCH = 4500
    SEPARATOR = ' |||SUBTITLE_SEP||| '
    SEPARATOR_LENGTH = len(SEPARATOR)
    
    # Tính batch size tối ưu (tránh quá dài)
    BATCH_SIZE = int(MAX_CHARS_PER_BATCH / (avg_chars + SEPARATOR_LENGTH))
    BATCH_SIZE = max(10, min(BATCH_SIZE, 100)) # Giới hạn 10-100 câu/batch
    
    results = []
    
    for batch_idx in range(0, len(texts), BATCH_SIZE):
        batch = texts[batch_idx:batch_idx + BATCH_SIZE]
        
        try:
            combined_text = SEPARATOR.join(batch)
            translated_combined = _translate_with_retry(combined_text)
            
            # Tách lại
            parts = translated_combined.split('|||SUBTITLE_SEP|||')
            parts = [p.strip() for p in parts]
            
            # Nếu số lượng không khớp, fallback về dịch từng câu
            if len(parts) != len(batch):
                print(f"Batch translation mismatch ({len(parts)} vs {len(batch)}). Fallback to single.")
                parts = []
                for text in batch:
                    try:
                        parts.append(_translate_with_retry(text))
                    except:
                         parts.append(text)
            
            results.extend(parts)
            
            # Delay nhẹ
            if batch_idx + BATCH_SIZE < len(texts):
                time.sleep(0.5)
                
        except Exception as e:
            print(f"Batch translation error: {e}. Fallback to single.")
            for text in batch:
                    try:
                        results.append(_translate_with_retry(text))
                    except:
                        results.append(text) # Giữ nguyên nếu lỗi
    
    return results



