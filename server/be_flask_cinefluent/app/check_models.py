import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

print("--- Danh sách các Model khả dụng với Key của bạn ---")
try:
    # Trong SDK mới, chúng ta chỉ cần lấy thuộc tính name
    for m in client.models.list():
        print(f"Dùng tên này trong code: {m.name}")
except Exception as e:
    print(f"Lỗi: {e}")