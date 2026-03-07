from flask import request
from ..extensions import socketio
from ..services.typing_socket_service import (
    handle_create_room, handle_join_room, handle_leave_room, 
    handle_start_game, handle_update_progress
)

@socketio.on('typing_create_room')
def on_typing_create_room(data):
    handle_create_room(request.sid, data)

@socketio.on('typing_join_room')
def on_typing_join_room(data):
    handle_join_room(request.sid, data)

@socketio.on('typing_leave_room')
def on_typing_leave_room():
    handle_leave_room(request.sid)

@socketio.on('typing_start_game')
def on_typing_start_game(data):
    handle_start_game(request.sid, data)

@socketio.on('typing_update_progress')
def on_typing_update_progress(data):
    handle_update_progress(request.sid, data)

@socketio.on('disconnect')
def on_disconnect():
    handle_leave_room(request.sid)
