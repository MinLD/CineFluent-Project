import os
import json
import numpy as np
import onnxruntime as ort
from datetime import datetime

class DKTInferenceSingleton:
    """
    Class Singleton chịu trách nhiệm nạp mô hình ONNX một lần duy nhất vào RAM
    để phục vụ hàng ngàn request mà không tốn thời gian tải lại.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DKTInferenceSingleton, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        model_path = os.path.join(base_dir, 'storage', 'cinefluent_dkt.onnx')
        
        self.max_seq_len = 100  # Khớp với MAX_SEQ_LEN lúc Train trên Colab
        
        try:
            # ExecutionProvider giúp chạy nhẹ trên CPU của VPS/Server
            self.session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
            print(f"[CineFluent AI] Da nap thanh cong bo nao DKT tu: {model_path}")
        except Exception as e:
            print(f"[CineFluent AI] Loi nap mo hinh DKT: {str(e)}")
            self.session = None

    def predict_probabilities(self, history_sequence):
        """
        Đưa chuỗi tương tác trong quá khứ của User vào ONNX để dự đoán TẤT CẢ các thẻ.
        - history_sequence: list chứa các cặp `[tag_id, is_correct]`
        VD: [[10, 1], [15, 0], [12, 1]]
        """
        if self.session is None:
            return None # Trả về None để API bên ngoài tự xử lý fail-safe

        seq_len = len(history_sequence)
        
        # Nếu chuỗi quá dài 100, cắt lấy 100 cái mới nhất
        if seq_len > self.max_seq_len:
            history_sequence = history_sequence[-self.max_seq_len:]
            seq_len = self.max_seq_len

        # Tạo mảng rỗng (Padding bằng số 0)
        tags = np.zeros(self.max_seq_len, dtype=np.int64)
        answers = np.zeros(self.max_seq_len, dtype=np.int64)

        # Trút dữ liệu thật vào
        for i, (t, a) in enumerate(history_sequence):
            tags[i] = t
            answers[i] = a

        # Nặn dữ liệu về đúng Format (1, 100) mà Colab yêu cầu
        ort_inputs = {
            'question_seq': np.expand_dims(tags, axis=0),
            'answer_seq': np.expand_dims(answers, axis=0)
        }

        # Gọi linh hồn ONNX suy luận!
        ort_outs = self.session.run(None, ort_inputs)
        preds = ort_outs[0] # output shape: (1, 100, NUM_TAGS)

        # Lấy Mảng xác suất ở đuôi của chuỗi (mốc thời gian hiện tại)
        # Để phán đoán cho Tương lai (step N+1)
        valid_idx = max(0, seq_len - 1)
        prob_vector = preds[0, valid_idx] # Mảng 1 chiều chứa Xác suất 1D: [0.3, 0.9, 0.45...]

        return prob_vector

    def calculate_decay_score(self, mastery_score, last_practiced_at, interval_days):
        """
        Tính Toán Lười Biếng (Lazy Evaluation) do Khoa lâu ngày không học thẻ.
        """
        if not last_practiced_at:
            return mastery_score
            
        time_diff = datetime.utcnow() - last_practiced_at
        days_passed = time_diff.total_seconds() / (24 * 3600)
        
        # Nếu chưa vượt quá kỳ hạn interval_days, thì chưa quên
        if days_passed < interval_days:
            return mastery_score
            
        # Cơ chế quên: Vượt ngưỡng bao nhiêu ngày thì trừ bấy nhiêu điểm
        # Ở bài toán này mình cấu hình rớt 5 điểm cho ngày trễ hạn đầu tiên, và rớt thêm dần
        overdue_days = days_passed - interval_days
        decayed_score = mastery_score - (overdue_days * 5.0) 
        
        # Đáy thấp nhất là 0 điểm
        return max(0.0, decayed_score)

# Khởi tạo Singleton toàn cục để dùng chung trên toàn App Flask
dkt_engine = DKTInferenceSingleton()
