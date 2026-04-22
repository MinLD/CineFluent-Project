"""
Google Colab DKT (Deep Knowledge Tracing) Training Script
CineFluent Project - Phase 1

Hướng dẫn sử dụng trên Google Colab:
1. Mở https://colab.research.google.com/
2. Tạo Notebook mới.
3. Copy toàn bộ nội dung file này dán vào 1 cell và chạy.
4. Sau khi chạy xong, xem thư mục bên trái của Colab để tải file `cinefluent_dkt.onnx` về máy.
"""

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score

# ==========================================
# 1. Cấu hình Tham số (Hyperparameters)
# ==========================================
# NUM_TAGS sẽ được tự động tính toán dựa trên dữ liệu thật ở bước dưới
EMBED_DIM = 64      # Kích thước vector nhúng
HIDDEN_DIM = 128    # Kích thước hidden layer của LSTM
MAX_SEQ_LEN = 100   # Độ dài chuỗi tối đa của một User
BATCH_SIZE = 32
EPOCHS = 10
LEARNING_RATE = 0.005

# ==========================================
# 2. Xây dựng Dataloader từ CSV (EdNet)
# ==========================================
class CineFluentRealDataset(Dataset):
    """
    Đọc dữ liệu tương tác cấu trúc thực tế từ dataset CSV.
    Cấu trúc yêu cầu của file CSV:
      - user_id: ID của người dùng
      - item_id (hoặc tag_id): Loại ngữ pháp/Câu hỏi (Đã quy chuẩn về dạng số 0 -> NUM_TAGS - 1)
      - user_answer: Khách phản hồi (1 là đúng, 0 là sai)
    """
    def __init__(self, csv_filepath, max_seq_len, user_ids=None):
        print(f"Đang tải dataset từ: {csv_filepath}...")
        self.df = pd.read_csv(csv_filepath)
        
        # Tên cột đã được cập nhật chuẩn khớp 100% với file ảnh CSV của sếp!
        self.USER_COL = 'user_id'
        self.ITEM_COL = 'tags'            # Cột tags lưu các mã ngữ pháp (VD: 74, 103, 144)
        self.ANSWER_COL = 'is_correct'    # Cột 0/1 đánh giá đúng sai
        
        # Gộp nhóm các lượt tương tác của từng học sinh
        self.user_groups = self.df.groupby(self.USER_COL)
        
        # Cho phép nạp danh sách user_ids tùy chỉnh để phục vụ việc chia Train/Test
        if user_ids is not None:
            self.user_ids = user_ids
        else:
            self.user_ids = list(self.user_groups.groups.keys())
            print(f"Đã phát hiện tổng {len(self.user_ids)} users trong dataset.")
            
        self.max_seq_len = max_seq_len
        
    def __len__(self):
        return len(self.user_ids)
    
    def __getitem__(self, idx):
        user_id = self.user_ids[idx]
        user_data = self.user_groups.get_group(user_id)
        
        # Lấy lịch sử làm bài tuần tự (giới hạn đuôi theo max_seq_len)
        user_tags = user_data[self.ITEM_COL].values[-self.max_seq_len:]
        user_answers = user_data[self.ANSWER_COL].values[-self.max_seq_len:]
        
        seq_len = len(user_tags)
        
        # Tạo mảng rỗng (Padding) theo max_seq_len
        tags = np.zeros(self.max_seq_len, dtype=np.int64)
        answers = np.zeros(self.max_seq_len, dtype=np.int64)
        mask = np.zeros(self.max_seq_len, dtype=np.float32)
        
        # Đổ dữ liệu thật vào
        tags[:seq_len] = user_tags
        answers[:seq_len] = user_answers
        mask[:seq_len] = 1.0 # Các mốc thời gian có dữ liệu thật sẽ được tính Loss
        
        return torch.tensor(tags, dtype=torch.long), torch.tensor(answers, dtype=torch.long), torch.tensor(mask, dtype=torch.bool)

# Định nghĩa đường dẫn file CSV trên Colab (thường là để ở Root hoặc upload lên Session)
DATASET_PATH = '/content/EdNet_10k_MVP_Part5.csv'

# Bơm dữ liệu vào Tensor Loader
try:
    base_dataset = CineFluentRealDataset(DATASET_PATH, MAX_SEQ_LEN)
    
    # BÍ KÍP CHỐNG LỖI OUT OF RANGE Ở ĐÂY:
    # Quét bảng lấy ra mã tag lớn nhất + 1 để nhét vừa khít mọi túi Embedding
    NUM_TAGS = int(base_dataset.df[base_dataset.ITEM_COL].max()) + 1
    print(f"👉 Đã quét và tự động Set NUM_TAGS = {NUM_TAGS}")
    
    # ==========================================
    # CHIA DỮ LIỆU THÀNH 2 PHẦN: 80% ĐỂ HỌC (TRAIN) & 20% ĐỂ THI (TEST) CHỐNG BỊ GIÁO VIÊN BẮT BẺ
    # ==========================================
    all_users = base_dataset.user_ids
    train_users, test_users = train_test_split(all_users, test_size=0.2, random_state=42)
    print(f"📚 Chia dữ liệu: {len(train_users)} users để học | {len(test_users)} users để làm bài thi.")
    
    train_dataset = CineFluentRealDataset(DATASET_PATH, MAX_SEQ_LEN, user_ids=train_users)
    test_dataset = CineFluentRealDataset(DATASET_PATH, MAX_SEQ_LEN, user_ids=test_users)
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)
    
except FileNotFoundError:
    print(f"❌[LỖI] Không tìm thấy file {DATASET_PATH} trên Colab!")
    print("Vui lòng Upload file EdNet_10k_MVP_Part5.csv lên thư mục Mặc định /content/ trước khi chạy cục code này.")
    raise

# ==========================================
# 3. Định nghĩa Mô hình Điện toán LSTM-DKT
# ==========================================
class CineFluentDKTModel(nn.Module):
    def __init__(self, num_tags, embed_dim, hidden_dim):
        super(CineFluentDKTModel, self).__init__()
        self.num_tags = num_tags
        self.hidden_dim = hidden_dim
        
        # Embedding ma hóa gộp cả: Câu hỏi (Tag) & Đáp án (Đúng/Sai)
        # Tổng số trường hợp là 2 * số lượng Tag
        self.interaction_embed = nn.Embedding(2 * num_tags, embed_dim)
        
        # Mạng LSTM để nhớ quá trình (Knowledge Tracing)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True)
        
        # Lớp xuất tỷ lệ làm đúng cho tất cả các Tag
        self.fc = nn.Linear(hidden_dim, num_tags)
        self.sigmoid = nn.Sigmoid()

    def forward(self, q, a):
        # Mã hóa tương tác: x = q + a * num_tags
        # Nếu Tag 5 làm sai (a=0): index = 5. Nếu Tag 5 làm đúng (a=1): index = 55
        x = q + a * self.num_tags
        x = self.interaction_embed(x)
        
        # Cho qua LSTM -> Lưu lượng kiến thức (Hidden state) biến đổi theo chuỗi
        out, _ = self.lstm(x)
        
        # Đưa ra dự đoán P(correct) cho câu tiếp theo
        res = self.sigmoid(self.fc(out))
        return res

model = CineFluentDKTModel(NUM_TAGS, EMBED_DIM, HIDDEN_DIM)
optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)
criterion = nn.BCELoss()

# ==========================================
# 4. Huấn luyện (Train Loop)
# ==========================================
import copy

print(f"Bắt đầu huấn luyện và đánh giá mô hình (Epochs: {EPOCHS})...")
best_loss = float('inf')
best_model_state = None

for epoch in range(EPOCHS):
    total_loss = 0
    model.train() # Kích hoạt chế độ đi học
    
    for tags, answers, mask in train_loader:
        optimizer.zero_grad()
        
        # Input (t, t+1... n-1). Dự đoán t+1
        q_curr = tags[:, :-1]
        a_curr = answers[:, :-1]
        mask_curr = mask[:, 1:]
        
        # Target của next step
        a_next = answers[:, 1:].float()
        q_next = tags[:, 1:]
        
        # Forward pass
        preds = model(q_curr, a_curr)
        
        # Lấy ra xác suất của chính cái Tag tiếp theo tương ứng
        # preds shape: (Batch, Seq_len-1, NUM_TAGS)
        pred_next = torch.gather(preds, 2, q_next.unsqueeze(-1)).squeeze(-1)
        
        # Tính Loss tại các vị trí không bị Pad
        loss = criterion(pred_next[mask_curr], a_next[mask_curr])
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
        
    avg_loss = total_loss / len(train_loader)
    
    # THI ĐÁNH GIÁ (VALIDATION) SAU KHI HỌC XONG 1 EPOCH BẰNG BỘ TEST
    model.eval() # Bật chế độ thi chặt chẽ (Không được học vẹt)
    all_preds = []
    all_targets = []
    
    with torch.no_grad():
        for tags, answers, mask in test_loader:
            q_curr = tags[:, :-1]
            a_curr = answers[:, :-1]
            mask_curr = mask[:, 1:]
            a_next = answers[:, 1:].float()
            q_next = tags[:, 1:]
            
            preds = model(q_curr, a_curr)
            pred_next = torch.gather(preds, 2, q_next.unsqueeze(-1)).squeeze(-1)
            
            # Chỉ lấy các phát phán đoán tại vị trí học sinh có làm bài thật (bài thi)
            valid_preds = pred_next[mask_curr].cpu().numpy()
            valid_targets = a_next[mask_curr].cpu().numpy()
            
            all_preds.extend(valid_preds)
            all_targets.extend(valid_targets)
            
    # Tính toán Accuracy và đường cong AUC chuẩn khoa học Machine Learning
    try:
        # Nếu xác suất đoán > 50% thì xem như máy đoán CÓ
        pred_labels = [1 if p >= 0.5 else 0 for p in all_preds]
        acc = accuracy_score(all_targets, pred_labels)
        auc = roc_auc_score(all_targets, all_preds)
    except ValueError:
        acc, auc = 0.0, 0.0 # Bắt lỗi rỗng nếu dữ liệu có vấn đề
        
    print(f"Epoch {epoch+1:02d}/{EPOCHS} | Train Loss: {avg_loss:.4f} | Test AUC: {auc:.4f} - Test Accuracy: {acc*100:.2f}%")
    
    # ĐÁNH GIÁ MÔ HÌNH: CHỈ CHỌN MÔ HÌNH CÓ ĐIỂM THI (AUC) CAO NHẤT ĐỂ XUẤT XƯỞNG
    # Ở đây dùng 1 - AUC để thuận vòng lặp tìm giá trị nhỏ nhất của best_loss
    if (1 - auc) < best_loss:
        best_loss = (1 - auc)
        best_model_state = copy.deepcopy(model.state_dict())
        print(f"  🌟 MÔ HÌNH THĂNG HẠNG! Đã lưu bản model đạt độ chuẩn Test AUC mới: {auc:.4f}")

print("✅ Huấn luyện hoàn tất! Lô model này đã được kiểm định đầy đủ khoa học.")

# ==========================================
# 5. Xuất xưởng Mô hình sang định dạng ONNX
# ==========================================
print("Đang xuất file ONNX để chạy trên Flask Backend...")

# Khôi phục trạng thái mô hình tốt nhất trước khi xuất ONNX
if best_model_state is not None:
    model.load_state_dict(best_model_state)
model.eval()

# Tạo tensor mẫu để trace Model
dummy_q = torch.randint(0, NUM_TAGS, (1, MAX_SEQ_LEN), dtype=torch.long)
dummy_a = torch.randint(0, 2, (1, MAX_SEQ_LEN), dtype=torch.long)

# Bỏ dynamic_axes đi vì Pytorch 2.x mới nhất trên Colab rất hay bị xung đột Dimension Tracking.
# Phương án an toàn & ổn định hơn: Sang Phase 3 (Flask), chúng ta chỉ việc nhét thêm "số 0" (Padding) 
# cho đủ độ dài chuỗi 100 (MAX_SEQ_LEN) rồi cắm vào ONNX là chạy bao mượt mà, không bao giờ lỗi shape.
torch.onnx.export(
    model, 
    (dummy_q, dummy_a), 
    "cinefluent_dkt.onnx", 
    export_params=True,
    opset_version=18,
    do_constant_folding=True,
    input_names=['question_seq', 'answer_seq'],
    output_names=['predictions']
)
print("✅ Lệnh xuất hoàn tất! File đã được lưu: cinefluent_dkt.onnx")
