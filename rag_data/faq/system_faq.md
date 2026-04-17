# FAQ tổng quan về CineFluent

## CineFluent là gì?

CineFluent là nền tảng học tiếng Anh tương tác lấy phim làm trung tâm. User có thể xem phim với subtitle song ngữ, tra từ theo ngữ cảnh, lưu flashcard, luyện nói shadowing, luyện gõ và học theo roadmap AI.

## Chatbox AI có tự biết tôi đang làm gì trong hệ thống không?

Có, nếu frontend gửi đúng `context_type`, `context_id` và trạng thái hiện tại như `current_time` của video hoặc `day_number` của roadmap. Nếu thiếu context này thì AI sẽ trả lời chung hơn hoặc nói rõ là chưa đủ dữ liệu.

## Vì sao hệ thống không đưa toàn bộ dữ liệu người dùng vào RAG?

Vì dữ liệu user như roadmap hiện tại, flashcard cá nhân, subtitle đang xem hoặc vị trí video là dữ liệu động. Chúng nên được lấy trực tiếp từ database để nhanh, đúng và rẻ hơn.

## Khi nào CineFluent dùng RAG?

RAG phù hợp cho tri thức tĩnh như:

- FAQ hệ thống
- hướng dẫn dùng tính năng
- playbook học theo module
- cách xử lý lỗi phổ biến

## Chatbox AI có thay thế hoàn toàn các module như roadmap hay flashcard không?

Không. Chatbox chỉ là lớp hỗ trợ giải thích, định hướng và gợi ý. Logic học tập chính vẫn nằm ở các module hiện có như phim, flashcard, typing game và roadmap AI.

## Nếu AI trả lời “không đủ dữ liệu” thì có nghĩa là gì?

Điều đó thường có nghĩa là:

1. frontend chưa gửi đủ context
2. user chưa có dữ liệu tương ứng trong hệ thống
3. module đang hỏi chưa có bản ghi thật trong DB

## Điều gì làm câu trả lời của chatbox tốt hơn?

1. hỏi ngay trong đúng màn hình đang học
2. gửi kèm context đúng
3. hỏi rõ user đang muốn hiểu nghĩa, muốn ôn tập hay muốn gợi ý bước tiếp theo
