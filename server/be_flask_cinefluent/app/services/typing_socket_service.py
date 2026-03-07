import random
import string
from ..extensions import socketio
from flask_socketio import emit, join_room as socketio_join_room, leave_room as socketio_leave_room

# In-memory store for typing game rooms and players
# In production, use Redis.
typing_rooms = {}  # { room_code: { 'host': sid, 'players': [sid1, sid2], 'status': 'waiting', 'map_id': None } }
typing_players = {} # { sid: { 'username': str, 'room': str, 'progress': 0, 'wpm': 0, 'is_ready': False } }

def generate_room_code():
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if code not in typing_rooms:
            return code

def handle_create_room(sid, data):
    username = data.get('username', 'Anonymous')
    map_id = data.get('map_id')
    room_code = generate_room_code()
    
    typing_rooms[room_code] = {
        'host': sid,
        'players': [sid],
        'status': 'waiting',
        'map_id': map_id
    }
    typing_players[sid] = {
        'username': username,
        'room': room_code,
        'progress': 0,
        'wpm': 0,
        'is_ready': True
    }
    
    socketio_join_room(room_code)
    
    emit('room_created', {'room_code': room_code, 'host': sid}, room=sid)
    _broadcast_room_state(room_code)

def handle_join_room(sid, data):
    username = data.get('username', 'Anonymous')
    room_code = data.get('room_code', '').upper()
    
    if room_code not in typing_rooms:
        emit('error', {'message': 'Mã phòng không tồn tại.'}, room=sid)
        return
        
    room = typing_rooms[room_code]
    if room['status'] != 'waiting':
        emit('error', {'message': 'Phòng đã bắt đầu chơi.'}, room=sid)
        return
        
    if sid not in room['players']:
        room['players'].append(sid)
        
    typing_players[sid] = {
        'username': username,
        'room': room_code,
        'progress': 0,
        'wpm': 0,
        'is_ready': True
    }
    
    socketio_join_room(room_code)
    _broadcast_room_state(room_code)

def handle_leave_room(sid):
    if sid not in typing_players:
        return
    
    player_data = typing_players[sid]
    room_code = player_data['room']
    
    if room_code in typing_rooms:
        room = typing_rooms[room_code]
        if sid in room['players']:
            room['players'].remove(sid)
            socketio_leave_room(room_code)
            
        if sid == room['host']:
            # If host leaves, close the room or re-assign host
            if len(room['players']) > 0:
                room['host'] = room['players'][0]
                _broadcast_room_state(room_code)
            else:
                del typing_rooms[room_code]
        elif len(room['players']) > 0:
            _broadcast_room_state(room_code)
        else:
            del typing_rooms[room_code]
            
    del typing_players[sid]

def handle_start_game(sid, data):
    room_code = data.get('room_code')
    map_id = data.get('map_id') # host might change map in lobby
    
    if room_code in typing_rooms and typing_rooms[room_code]['host'] == sid:
        typing_rooms[room_code]['status'] = 'playing'
        if map_id:
            typing_rooms[room_code]['map_id'] = map_id
            
        # Broadcast start event so clients start countdown and load map
        emit('game_started', {'map_id': typing_rooms[room_code]['map_id']}, room=room_code)

def handle_update_progress(sid, data):
    if sid not in typing_players:
        return
        
    player = typing_players[sid]
    room_code = player['room']
    
    player['progress'] = data.get('progress', player['progress'])
    player['wpm'] = data.get('wpm', player['wpm'])
    
    # Broadcast to everyone in the room except sender (or including sender to sync)
    emit('player_progress_updated', {
        'sid': sid,
        'username': player['username'],
        'progress': player['progress'],
        'wpm': player['wpm']
    }, room=room_code)

def _broadcast_room_state(room_code):
    if room_code in typing_rooms:
        room = typing_rooms[room_code]
        players_info = []
        for p_sid in room['players']:
            if p_sid in typing_players:
                p_data = typing_players[p_sid]
                players_info.append({
                    'sid': p_sid,
                    'username': p_data['username'],
                    'is_host': p_sid == room['host']
                })
                
        emit('room_state_updated', {
            'room_code': room_code,
            'host': room['host'],
            'players': players_info,
            'status': room['status'],
            'map_id': room['map_id']
        }, room=room_code)
