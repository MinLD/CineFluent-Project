# Lộ trình Triển khai Hệ thống Điền khuyết Phim ảnh Thích nghi (Adaptive Cloze Test)

Tài liệu này vạch ra lộ trình từ đầu đến cuối (End-to-End Roadmap) để tích hợp mô hình Deep Knowledge Tracing (DKT) vào hạ tầng CineFluent hiện tại.

## User Review Required
> [!IMPORTANT]
> Lộ trình này trải dài qua nhiều nền tảng (Colab, Flask, Database, Frontend). Bạn hãy duyệt qua các luồng thực thi dưới đây xem có phù hợp với nguồn lực và Tech Stack (Next.js/React + Flask) của team không nhé.

---

## ✅ XONG: Phase 1: Huấn luyện Mô hình Kiến thức (Google Colab)
Tại bước này, chúng ta sẽ huấn luyện cỗ máy DKT để đo lường đường cong lẵng quên của học sinh.

### 1. Xây dựng Dataloader & Định nghĩa Mock Map
- Chọn ra 50 mã Tags phổ biến nhất từ bộ `EdNet_10k_MVP_Part5.csv`.
- Gán ngẫu nhiên 50 mã này tương ứng với 50 Điểm Ngữ pháp mà SpaCy bắt được (Mock Mapping).
- Viết Pytorch Dataloader ép chuỗi tương tác thành Tensors có Padding.

### 2. Định nghĩa Mô hình Điện toán (Architecture)
- Cài đặt mô hình **LSTM-DKT** hoặc **SAKT** (Self-Attentive Knowledge Tracing - cực nhẹ & chạy siêu nhanh).
- Train mô hình (Loss: Binary Cross Entropy / Metric: AUC-ROC).

### 3. Đóng gói & Xuất xưởng Mô hình (Model Export)
- Sau khi train xong, convert mô hình sang định dạng **TorchScript (`.pt`)** hoặc **ONNX** để có thể chạy vèo vèo siêu nhẹ trên Flask Server mà không cần cài đặt môi trường rườm rà.

---

## Phase 2: Cập nhật Database (CineFluent Flask Backend)
Khi mô hình có khả năng tracking, Backend của bạn phải có chỗ để "nhớ" trạng thái của User.

### 1. Bảng Trí nhớ Cốt lõi AI (`UserKnowledgeState`)
- **[ĐÃ HOÀN TẤT]** Model lưu Trạng thái Ẩn của người dùng (Latent Vector). 
- Lưu dưới dạng chuỗi JSON hoặc Byte Array để khi User quay lại, gọi Vector này lên nhét vào Mô hình dự đoán tiếp.

### 2. Bảng Lặp lại ngắt quãng SRS (`UserTagMastery`)
- **[NEW]** Tạo bảng lưu Điểm Thông Thạo ngầm cho từng Tag độc lập của User.
- Các cột cơ bản: `tag_id`, `mastery_score` (Điểm từ 0-100), `last_practiced_at` (Mốc thời gian lần cuối đụng chạm), `interval_days` (Khoảng cách ôn tập lý tưởng). Bảng này đóng vai trò lõi cho việc "Quên do lâu ngày chưa ôn".

### 3. Chạy Migration CSDL
- Sử dụng Alembic (`flask db migrate`) cập nhật lược đồ cho CSDL gốc với các bảng mới.

---

## Phase 3: Xây dựng Core API (CineFluent Flask Backend)
Biến hệ thống thụ động thành hệ thống AI thông minh (AI Inference).

### 1. Tải Model vào Flask Memory
- [NEW] Thư mục `app/services/kt_inference.py`. Model DKT được nạp dưới dạng Singleton Pattern vào RAM máy chủ Flask.

### 2. Viết API Dự đoán Đục lỗ - Hybrid (Prediction)
- Tạo API `POST /api/kt/predict`. 
- Input: `user_id` và mảng `tag_ids` (Danh sách các Ngữ pháp của câu sub sắp tới).
- **Tính toán Lười biếng (Lazy Evaluation)**: Flask quét bảng `UserTagMastery` để tính xem với Số ngày bị bỏ xó, số điểm gốc đã bị tụt rớt bao nhiêu phần trăm (Time Decay).
- **Quyết định (Trigger Logic)**: 
  - Nếu điểm rớt xuống dưới Ngưỡng (VD: < 80 điểm) 👉 Chọn để Đục lỗ che mờ liền!. 
  - Nếu có 2 thẻ cùng rớt xuống < 80, bưng qua nhờ **Mô hình AI ONNX** chạy suy luận xem cái nào xác suất sai cao hơn thì Đục cái đó. Kết hợp Hoàn hảo!

### 3. Viết API Nạp đạn (State Update & SuperMemo)
- Tạo API `POST /api/kt/update_state`.
- Nhận phản hồi đúng/sai từ Frontend. 
- 1. Gọi thuật toán SRS (Ví dụ SuperMemo) để tăng/giảm Điểm số Mastery trong bảng `UserTagMastery`, và set ngày tháng `last_practiced_at = NOW()`.
- 2. Cập nhật lại Mảng trí nhớ (Latent State) của AI trong bảng `UserKnowledgeState` cho những lần sau.

---

## Phase 4: Tích hợp Giao diện (Frontend - Next.js)
Cho ra mắt tính năng Adaptive Cloze Test trực tiếp trên `VideoPlayerWrapper.tsx`.

### 1. Data Mocking (Xử lý Tag cho Subtitle VTT)
Hiện tại file VTT không chứa mảng `tag_ids`. Để chạy thử nghiệm MVP nghiệm thu, ta sẽ thêm logic Mock Data trực tiếp ở Frontend:
- Tự động chèn ngẫu nhiên mảng `tag_ids` (ví dụ `[10, 15, 20]`) vào mỗi object `Subtitle` khi Web Worker đọc xong file VTT.
- *Câu hỏi mở:* Sau này bạn định xử lý Map Tag này trên DB Backend hay muốn Next.js gọi API bốc tách Tag ngay lúc xem phim?

### 2. Vòng lặp Look-ahead (Look_ahead Loop)
- Trong `useEffect` của `VideoPlayerWrapper.tsx` xử lý đếm thời gian (thay vì quét mỗi 50ms), ta sẽ quét trước: "Câu subtitle tiếp theo có `tag_ids` không?".
- Nếu câu tiếp theo có `tag_ids`, gọi API `POST /api/kt/predict` ngầm trước 3-5 giây để Backend nạp não AI phân tích và trả về `target_tag_to_cloze`.
- Ngay khi `currentTime` chạm ngưỡng `start_time` của câu đó -> **Dừng Video (Pause)**.

### 3. Giao diện Cloze Test Overlay
- Bật Modal `AdaptiveClozeModal.tsx` (tương đương `ShadowingSubtitle/DictationModal`).
- Trong Modal:
  - Hiển thị lại câu Subtitle gốc nhưng đục lổ 1 cụm từ, dựa vào `target_tag_to_cloze`.
  - Sinh 3 đáp án nhiễu (Dùng danh sách từ vựng/ngữ pháp giả lập cho MVP).
  - Bấm chọn Đúng/Sai: Gọi `POST /api/kt/update_state` để nộp bài.
  - Tắt Modal -> Ấn Play Video tiếp tục.

## Phase 5: Xây dựng NLP Grammar Pipeline (Offline)

**Mục tiêu (Version 2.0 theo ý Sếp):** Vứt bỏ mô hình Multi-task cũ yếu kém. Phá bớt rườm rà. Huấn luyện lại rặt một con chuyên gia Ngữ pháp (Single-task) từ `Tense-dataset`. Lưu trữ kết quả phân tích AI NLP thẳng vào Database trong khâu Upload Phim, đồng thời bộ tự động sinh Câu hỏi đục lỗ (Cloze Generator) ngay tại Backend.

### Bước 1: Train lại Mô hình XLM-R (Chỉ tập trung Ngữ pháp)
- **[NEW SCRIPT]**: Chuyển file `traning_model_xlm_roberta.py` về dạng Single-task Classification (chỉ dùng `AutoModelForSequenceClassification`). Dẹp bỏ hoàn toàn head dự đoán Difficulty.
- **[DATASET & LỌC RÁC]**: 
  - Đưa `Tense-dataset` chuẩn xác vào huấn luyện. 
  - Khai sinh thêm một nhãn (Label) tên là `none` hoặc `filler` (hoặc để rules tự xử lý) cho những câu *"Wow", "Oh no"*.

### Bước 2: Bảng `GrammarTag` & Admin CRUD
- **[NEW] Bảng `GrammarTag` (`models_model.py`)**: 
  - Tạo bảng lưu từ điển: `id` (Khớp ID của XLM-Roberta), `name_en` (VD: "present_simple"), `name_vi` ("Thì Hiện tại đơn"), `description` (Giải thích quy tắc).
- **[NEW] API Admin CRUD**:
  - Viết bộ API cho Admin `GET/POST/PUT/DELETE` thẻ Ngữ pháp này để Admin vào UI gõ lời giải thích cho thân thiện với học viên Việt Nam.

### Bước 3: Đục lỗ thông minh (spaCy) & Cắm Data vào Phim
- **[MODIFY] Bảng `Subtitle` (`models_model.py`)**:
  - Thêm `grammar_tag_id` (trỏ vào `GrammarTag`) và cột `cloze_data` (lưu JSON thông tin đục lỗ).
- **[MODIFY] Cỗ máy `movie_ai_service.py` lúc Upload**:
  - Lọc rác trước khi chạy mô hình: Dùng thuật toán siêu nhẹ đếm từ (Ví dụ: < 3 chữ) hoặc dùng spaCy không tìm thấy Động từ -> BỎ QUA không ghi nhận Ngữ pháp. Khử đẹp tụi *"Oh no", "Wow"*!
  - Chạy mô hình XLM-R mới -> Dán nhãn `grammar_tag_id`.
  - Chạy `spaCy` bóc Động Từ ra đục lỗ, sinh từ giả `Distractors`. Đóng gói thành `cloze_data`. Lưu 1 lượt vào DB!

### Bước 4: Đồng bộ Frontend "Nhẹ Tựa Lông Hồng"
- DKT nhận nguyên mâm `nextSub.grammar_tag_id` để xét xử nghiệm thu.
- Frontend không cần code logic tạo đề, chỉ việc nhận cục `nextSub.cloze_data.distractors` bưng thẳng ra màn hình cho Học viên luyện tập.

## Open Questions
- Is on-the-fly NLP extraction via XLM-R fast enough for a 4-second look-ahead? (Prediction: Yes, CPU inference for a single sub is ~50ms, easily beating the 4s threshold).
- Do we want to ignore a specific `tag_id` if it maps to "No obvious grammar" (e.g. tag 0)? We will check what `grammar_idx` returns.
> [!WARNING]
> 1. Trên Frontend, Team đang xài Trình phát Video (Video Player) nào? (VD: Video.js, tùy chỉnh HTML5, ReactPlayer). Sự can thiệp dừng phim cần hook vào được API kiện tua/pause của Player.
> 2. Phía Backend Flask Server hiện tại đang có cơ chế Background Queue (như Celery hay RQ) chưa? Chạy suy luận (Inference) Model AI nên cắm vào nền để không block main thread của Gunicorn.

## Verification Plan
1. **P1:** Chạy Code Colab, Accuracy Loss giảm dần, đo AUC > 0.73. File `model.onnx` xuất được ra ổ cứng.
2. **P2 & P3:** Gọi thử API qua Postman. Nạp Tag số 5 -> Xác suất trả về là `0.65`.
3. **P4:** Upload thử video mẫu. Nhảy tới dây thứ 10 có chứa Ngữ pháp, Video "khựng lại" và ném pop-up đục lỗ chuẩn xác. Trả lời xong, F5 làm lại, nới đó xác suất sẽ tăng lên và Video Mượt mà bỏ qua không đục lỗ nữa (Vì hệ thống nhận thấy người dùng đã biết đáp án)!
