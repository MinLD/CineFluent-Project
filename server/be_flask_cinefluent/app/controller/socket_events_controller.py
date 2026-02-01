# app/socket_events.py
from flask import request
from ..extensions import socketio
# Import Service vừa tạo
from ..services import socket_service

@socketio.on('connect')
def handle_connect():
    # Controller chỉ log, không xử lý logic phức tạp
    print(f"✅ Connection attempt: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    # Gọi service để dọn dẹp user online
    socket_service.remove_online_user(request.sid)

@socketio.on('register')
def handle_register(data):
    user_id = data.get('user_id')
    if user_id:
        socket_service.add_online_user(user_id, request.sid)

@socketio.on('find_tutor')
def handle_find_tutor(data):
    # Controller chuyển ngay quả bóng cho Service
    socket_service.process_find_tutor(data, request.sid)

@socketio.on('accept_request')
def handle_accept(data):
    socket_service.process_accept_request(data, request.sid)

@socketio.on('cancel_request')
def handle_cancel_request(data):
    socket_service.process_cancel_request(data, request.sid)