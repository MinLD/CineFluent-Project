# Typing game, map luyện gõ và nội dung AI

## Mục tiêu của module

Phân hệ typing game giúp user luyện phản xạ gõ tiếng Anh thông qua các map và chapter có nội dung ngắn, rõ độ khó và có thể tăng dần theo tiến trình.

## Những gì user có thể làm

1. Xem danh sách các map typing game.
2. Chọn một map để xem các chapter.
3. Luyện gõ theo nội dung của từng chapter.
4. Tham gia các phòng realtime hoặc luồng luyện tập có yếu tố tương tác.

## Những gì admin có thể làm

1. Tạo map thủ công.
2. Sửa hoặc xóa map.
3. Thêm, sửa, xóa chapter.
4. Dùng AI để sinh một map mới theo topic.

## Dữ liệu thật mà hệ thống đang có

- `typing_game_maps`
  gồm `name`, `thumbnail_url`, `description`, `total_chapters`
- `typing_game_stages`
  gồm `map_id`, `chapter_number`, `content`, `difficulty`

## Cách AI được dùng trong module này

Service hiện tại có thể sinh:

1. Tên map.
2. Mô tả ngắn của map.
3. Danh sách 5 chapter.
4. Nội dung tiếng Anh cho từng chapter.
5. Độ khó tăng dần từ Easy đến Hard.

## Những câu user thường hỏi

1. Chapter này đang luyện kỹ năng gì?
2. Vì sao chapter này khó hơn chapter trước?
3. Tôi nên chơi map nào trước?
4. Typing game có phù hợp để ôn từ vựng không?
5. Tôi nên luyện game này trước hay xem phim trước?

## Runtime context cần có khi chat ở typing game

1. `map_id` hiện tại.
2. `chapter_number` hiện tại.
3. `difficulty` của chapter hiện tại.
4. Tên map và mô tả map.

## Cách chatbox nên trả lời

1. Nếu user đang đứng trong một chapter, nên giải thích dựa trên chapter đó trước.
2. Nếu user hỏi “vì sao khó hơn”, nên bám vào `difficulty` và độ dài hoặc độ phức tạp của nội dung.
3. Nếu không có `map_id` hoặc `chapter_number`, chỉ nên đưa hướng dẫn chung về cách dùng tính năng.

## Điều chatbox không nên bịa

1. Không bịa nội dung chapter chưa được load từ DB.
2. Không nói user đã mở map nào nếu không có context.
3. Không hứa chắc kết quả luyện gõ sẽ cải thiện kỹ năng nào nếu không có dữ liệu tiến độ thật.

## Gợi ý hành động tiếp theo nên đề xuất

1. Chơi từ chapter dễ trước nếu user mới bắt đầu.
2. Dùng typing game như phần khởi động trước khi vào phim.
3. Chọn map AI-generated theo topic user thích.
