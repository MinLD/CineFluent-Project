# Các lỗi phổ biến của Product-RAG và chatbox

## 1. AI trả lời quá chung chung

### Nguyên nhân thường gặp

- frontend không gửi `context_type`
- frontend không gửi `context_id`
- backend chưa build runtime context

### Hướng xử lý

1. kiểm tra payload gửi lên
2. kiểm tra context builder
3. kiểm tra có đang gọi đúng module theo màn hình hay không

## 2. AI trả lời không giống dữ liệu thật của user

### Nguyên nhân thường gặp

- prompt đang ưu tiên text tĩnh thay vì DB runtime
- lấy nhầm roadmap hoặc assessment cũ
- không nạp subtitle hiện tại theo `current_time`

### Hướng xử lý

1. ưu tiên DB runtime trước RAG
2. luôn lấy bản ghi gần nhất hoặc đúng `context_id`
3. log rõ `context_used`

## 3. AI nói “không đủ dữ liệu” quá nhiều

### Nguyên nhân thường gặp

- routing chưa đúng
- context builder quá nghèo
- user thực sự chưa có dữ liệu trong module đó

### Hướng xử lý

1. kiểm tra xem câu hỏi nên đi `runtime`, `rag` hay `hybrid`
2. nếu chưa có dữ liệu, hướng dẫn user làm bước khởi tạo đầu tiên

## 4. AI trả lời lâu

### Nguyên nhân thường gặp

- context quá dài
- retrieve quá nhiều tài liệu
- chat history không được rút gọn

### Hướng xử lý

1. giới hạn `top_k`
2. cắt gọn history
3. chỉ lấy 1-2 tài liệu đúng module thay vì kéo toàn bộ KB
