# Lỗi thường gặp ở luyện tập realtime và video call

## 1. AI không biết topic call hiện tại

### Nguyên nhân

- frontend chưa gửi topic AI vừa sinh
- backend chưa lưu hoặc chưa truyền `questions` và `vocabulary`

### Hướng dẫn xử lý

1. gửi topic, questions và vocabulary hiện tại vào context
2. nếu không có topic, chatbox chỉ nên trả lời ở mức hướng dẫn chung

## 2. User hỏi vì sao chưa ghép cặp được

### Nguyên nhân

- đây là trạng thái realtime, không phải lúc nào cũng có partner
- chatbox không nắm dữ liệu hàng đợi nếu backend không cung cấp

### Hướng dẫn xử lý

1. không hứa chắc sẽ ghép cặp ngay
2. gợi ý user luyện bằng typing game hoặc shadowing trong lúc chờ

## 3. AI gợi ý sai hướng khi user đang ở typing game

### Nguyên nhân

- routing nhầm sang context call 1:1
- không có `map_id` và `chapter_number`

### Hướng dẫn xử lý

1. tách rõ `typing_game` và `realtime_practice`
2. ép frontend gửi context đúng màn hình
