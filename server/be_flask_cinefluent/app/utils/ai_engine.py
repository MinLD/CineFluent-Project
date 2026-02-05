import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()


def init_ai_engine():
    """Khởi tạo CineFluent AI Engine bằng SDK mới (google.genai)."""

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("LỖI: GEMINI_API_KEY không tồn tại trong file .env.")

    # Khởi tạo Client thay vì configure toàn cục
    client = genai.Client(api_key=api_key)

    return client


# Khởi tạo instance client duy nhất
cinefluent_ai = init_ai_engine()