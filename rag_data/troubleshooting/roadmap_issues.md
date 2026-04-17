# Lỗi thường gặp ở module roadmap

## 1. AI kết luận điểm yếu của user nhưng không có căn cứ

### Nguyên nhân

- không dùng `weaknesses`
- không dùng `grammar_feedback` hoặc `vocab_feedback`
- assessment chưa hoàn thành nhưng vẫn bị lấy ra làm nguồn

### Hướng dẫn xử lý

1. chỉ dùng assessment có `status=COMPLETED`
2. ưu tiên assessment gần nhất

## 2. AI không biết hôm nay user nên học gì

### Nguyên nhân

- chưa lấy `roadmap_id`
- chưa lấy `day_number`
- chưa load `daily_task`

### Hướng dẫn xử lý

1. nếu đang ở lesson page, gửi cả `roadmap_id` và `day_number`
2. nếu chỉ ở dashboard roadmap, chọn daily task gần nhất hoặc task của ngày hiện tại

## 3. AI bảo user chưa có roadmap dù thực tế có

### Nguyên nhân

- query nhầm user
- route list roadmap thành công nhưng context builder không lấy dữ liệu

### Hướng dẫn xử lý

1. kiểm tra `user_id`
2. lấy roadmap mới nhất hoặc roadmap đang được chọn trên UI
