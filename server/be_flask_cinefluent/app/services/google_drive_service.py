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

def get_drive_service():
    """Authenticates and returns the Google Drive service."""
    creds = None
    if os.path.exists(SERVICE_ACCOUNT_FILE):
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    else:
        # Fallback to default credentials if no file found (e.g. cloud run)
        # But for this use case, we strongly expect the json file.
        print(f"[{__name__}] Warning: {SERVICE_ACCOUNT_FILE} not found.")
        return None

    try:
        service = build('drive', 'v3', credentials=creds)
        service._creds = creds # Attach creds to service for token extraction
        return service
    except Exception as e:
        print(f"[{__name__}] Error building Drive service: {e}")
        return None

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
                for chunk in response.iter_content(chunk_size=256*1024):
                    if chunk:
                        yield chunk
            else:
                print(f"[{__name__}] Error downstream: {response.status_code} - {response.text}")
                
    except Exception as e:
        print(f"[{__name__}] Error streaming direct: {e}")
