from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.models_model import db, UserKnowledgeState, UserTagMastery
from ..services.learning_tree_service import discover_learning_tag_service
from ..services.kt_inference_service import dkt_engine
from ..utils.response import success_response, error_response
from datetime import datetime

kt_bp = Blueprint('kt', __name__)

@kt_bp.route('/predict', methods=['POST'])
@jwt_required()
def predict_kt():
    """
    API để Frontend ném lên danh sách Thẻ Ngữ pháp của Câu sắp tới.
    Trả về Id Thẻ nào nên đục lỗ nhất (Dựa vào AI và Spaced Repetition).
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'tag_ids' not in data:
        return error_response("Missing tag_ids", code=400)
        
    tag_ids = data['tag_ids']
    
    # 1. Rút "Bản ghi nhớ lưu game" của học sinh ra
    knowledge_state = UserKnowledgeState.query.filter_by(user_id=user_id).first()
    history = []
    if knowledge_state and knowledge_state.latent_state:
        history = list(knowledge_state.latent_state)
        
    probabilities = {}    
    
    # 2. Quăng vô AI (Chỉ tốn ~10ms nhờ Singleton)
    prob_vector = dkt_engine.predict_probabilities(history)
    
    # 3. Phân tích điểm lai tạo (Hybrid)
    target_cloze = None
    min_prob = 1.0 # Tìm thằng có xác suất đúng thấp nhất để đục!
    
    for tag in tag_ids:
        # A. Tính Toán Lười Biếng (Thuật toán Thời gian mài mòn)
        mastery = UserTagMastery.query.filter_by(user_id=user_id, tag_id=tag).first()
        if mastery:
            decay_score = dkt_engine.calculate_decay_score(
                mastery.mastery_score, 
                mastery.last_practiced_at, 
                mastery.interval_days
            )
        else:
            decay_score = 0.0 # Newbie chưa từng gặp
            
        # B. Rút xác suất AI phán
        ai_prob = 0.5
        if prob_vector is not None and tag < len(prob_vector):
            ai_prob = float(prob_vector[tag])
            
        probabilities[tag] = {
            "mastery_score": decay_score,
            "ai_probability": ai_prob
        }
        
        # Quyết định Vàng: Giới hạn Thẻ đã giỏi >= 80 điểm thì THA không đục!
        if decay_score < 80.0:
            # Còn yếu? Đè đầu thằng rớt thảm nhất (ai_prob thấp nhất) ra để trích xuất
            if ai_prob < min_prob:
                min_prob = ai_prob
                target_cloze = tag
                
    return success_response(data={"target_tag_to_cloze": target_cloze, "details": probabilities})

@kt_bp.route('/update_state', methods=['POST'])
@jwt_required()
def update_state():
    """
    API Frontend báo cáo Người dùng điền ĐÚNG hay SAI lỗ vừa đục.
    Cập nhật mảng Trí nhớ AI và Cộng trừ điểm Spaced Repetition.
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'tag_id' not in data or 'is_correct' not in data:
        return error_response("Missing required parameters", code=400)
        
    tag_id = int(data['tag_id'])
    is_correct = int(data['is_correct'])

    discover_learning_tag_service(user_id=user_id, tag_id=tag_id, source='quiz')
    
    # --- BƯỚC 1: XỬ LÝ TRÍ NHỚ MÔ HÌNH AI (DKT HISTORY) ---
    knowledge_state = UserKnowledgeState.query.filter_by(user_id=user_id).first()
    if not knowledge_state:
        # Lần đầu tiên ghi nhận user này
        knowledge_state = UserKnowledgeState(user_id=user_id, latent_state=[], interaction_count=0)
        db.session.add(knowledge_state)
        db.session.flush() # Lấy ID gốc tạm thời
        
    history = list(knowledge_state.latent_state) if knowledge_state.latent_state else []
    
    # Nạp kiến thức vào não
    history.append([tag_id, is_correct])
    if len(history) > 100:
        history = history[-100:] # Cắt chóp giữ đúng 100 câu mới nhất
        
    knowledge_state.latent_state = history
    knowledge_state.interaction_count += 1
    
    # --- BƯỚC 2: TÍNH ĐIỂM HỌC THUẬT SUPERMEMO (SRS) ---
    mastery = UserTagMastery.query.filter_by(user_id=user_id, tag_id=tag_id).first()
    if not mastery:
        mastery = UserTagMastery(user_id=user_id, tag_id=tag_id, mastery_score=0.0, interval_days=1.0)
        db.session.add(mastery)
        
    if is_correct == 1:
        # Vượt câu: Thưởng 20% Học lực, kéo chuỗi quên ra gấp đôi (Giỏi rồi thì cho lâu quên hơn)
        mastery.mastery_score = min(100.0, mastery.mastery_score + 20.0)
        mastery.interval_days *= 2.0 
    else:
        # Đuối sức: Giáng chức 15% Học lực, gọt chuỗi quên đi 1 nửa bắt ôn sấp mặt
        mastery.mastery_score = max(0.0, mastery.mastery_score - 15.0)
        mastery.interval_days = max(1.0, mastery.interval_days / 2.0)
        
    mastery.last_practiced_at = datetime.utcnow()
    
    # Lưu sạch xuống CSDL
    db.session.commit()
    
    return success_response(
        message="Trí nhớ của User đã được ghi nạp!", 
        data={"new_mastery": mastery.mastery_score, "is_correct": bool(is_correct)}
    )
