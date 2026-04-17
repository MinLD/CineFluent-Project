# Lỗi thường gặp ở module phim và flashcard

## 1. AI không biết user đang xem phim nào

### Nguyên nhân

- thiếu `context_type=movie`
- thiếu `context_id=video_id`
- thiếu `client_state.current_time`

### Hướng dẫn xử lý

1. gửi đúng `video_id`
2. gửi thời gian hiện tại của player
3. lấy subtitle gần nhất trước khi gọi model

## 2. AI giải thích sai nghĩa của câu

### Nguyên nhân

- không nạp `content_en` của subtitle hiện tại
- chỉ đưa từ đơn lẻ mà không đưa cả câu

### Hướng dẫn xử lý

1. luôn ưu tiên câu đầy đủ
2. nếu có `content_vi`, dùng như tín hiệu phụ để đối chiếu

## 3. AI không biết user đã lưu flashcard hay chưa

### Nguyên nhân

- chưa query flashcards theo `user_id`
- chưa lọc theo `video_id` hiện tại

### Hướng dẫn xử lý

1. lấy các flashcard mới nhất của user
2. ưu tiên flashcard có cùng `video_id` nếu đang hỏi trong trang phim
