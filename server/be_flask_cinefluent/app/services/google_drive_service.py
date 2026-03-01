import os
import io
import google.auth
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from flask import current_app
import requests
from google.auth.transport.requests import Request

SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, 'utils', 'service-account.json')
# Biến toàn cục để lưu trữ service đã khởi tạo (Singleton)
_drive_service_instance = None


def get_drive_service():
    """
    Khởi tạo và trả về Google Drive service.
    Sử dụng cơ chế Singleton để không phải đọc file JSON và xác thực lại nhiều lần.
    """
    global _drive_service_instance

    # Nếu đã có instance và token còn hạn, trả về luôn
    if _drive_service_instance is not None:
        return _drive_service_instance

    creds = None
    # 1. Kiểm tra file Service Account
    if os.path.exists(SERVICE_ACCOUNT_FILE):
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    else:
        print(f"[ERROR] Service Account file không tồn tại tại: {SERVICE_ACCOUNT_FILE}")
        return None

    try:
        # 2. Build service
        service = build('drive', 'v3', credentials=creds)

        # 3. Đính kèm creds vào service để các hàm khác có thể gọi creds.refresh()
        service._creds = creds

        # 4. Lưu vào biến global
        _drive_service_instance = service
        print("[SUCCESS] Google Drive Service initialized successfully.")
        return _drive_service_instance

    except Exception as e:
        print(f"[ERROR] Không thể khởi tạo Drive service: {e}")
        return None

import functools

@functools.lru_cache(maxsize=128)
def get_file_metadata(file_id):
    """Gets file metadata (size, mimeType, name)."""
    service = get_drive_service()
    if not service:
        return None
    
    try:
        file = service.files().get(fileId=file_id, fields="id, name, size, mimeType").execute()
        return file
    except Exception as e:
        print(f"[{__name__}] Error getting metadata for {file_id}: {e}")
        return None

def stream_file_content(file_id, start_byte, end_byte, chunk_size=None):
    """
    Streams a file from Google Drive using direct HTTP request for low latency.
    This bypasses the Google Client Library's chunking overhead.
    """
    service = get_drive_service()
    if not service:
        return None
        
    try:
        # 1. Get Access Token
        creds = service._creds
        if not creds.valid:
            creds.refresh(Request())
        token = creds.token
        
        # 2. Build Request URL
        url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media"
        
        # 3. Headers for Range and Auth
        headers = {
            "Authorization": f"Bearer {token}",
            "Range": f"bytes={start_byte}-{end_byte}"
        }
        
        # 4. Stream Request (Low Latency)
        # stream=True ensures we don't download everything at once
        # timeout is added to prevent hanging
        with requests.get(url, headers=headers, stream=True, timeout=30) as response:
            if response.status_code in [200, 206]:
                # Yield small chunks (32KB) directly to client as they arrive
                # This drastically reduces TTFB (Time To First Byte)
                for chunk in response.iter_content(chunk_size=128*1024):
                    if chunk:
                        yield chunk
            else:
                print(f"[{__name__}] Error downstream: {response.status_code} - {response.text}")
                
    except Exception as e:
        print(f"[{__name__}] Error streaming direct: {e}")