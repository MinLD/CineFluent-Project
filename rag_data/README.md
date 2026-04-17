# Bộ dữ liệu Product-RAG cho CineFluent

Thư mục `rag_data` là kho tri thức tĩnh dành riêng cho chatbox AI của CineFluent.

Mục tiêu của bộ dữ liệu này không phải là dạy toàn bộ tiếng Anh, mà là giúp AI:

1. Hiểu đúng các tính năng thật đang có trong hệ thống.
2. Giải thích cách học và cách dùng tính năng theo đúng sản phẩm.
3. Trả lời có căn cứ khi user hỏi về phim, flashcard, typing game, roadmap, video call 1:1, yêu cầu phim và báo lỗi.
4. Giảm hallucination khi user hỏi về logic hệ thống.

## Nguyên tắc kiến trúc

### 1. Không đưa dữ liệu runtime của user vào RAG

Những dữ liệu sau phải lấy trực tiếp từ database hoặc service runtime:

- phim user đang xem
- subtitle hiện tại theo `current_time`
- flashcard user đã lưu
- bài tập flashcard đã làm
- roadmap hiện tại
- daily task hôm nay
- assessment gần nhất
- map hoặc chapter typing game hiện tại

### 2. Chỉ đưa tri thức tĩnh của sản phẩm vào RAG

Những gì nên nằm trong `rag_data`:

- mô tả từng module sản phẩm
- FAQ hệ thống
- playbook trả lời theo từng ngữ cảnh
- hướng dẫn xử lý lỗi phổ biến
- quy tắc gợi ý tiếp theo cho user

## Cấu trúc thư mục

- `features/`: mô tả từng phân hệ thật của CineFluent
- `faq/`: câu hỏi thường gặp theo góc nhìn người dùng
- `playbooks/`: quy tắc trả lời dành cho chatbox theo từng context
- `troubleshooting/`: tình huống lỗi thường gặp và cách hướng dẫn user
- `metadata.jsonl`: metadata để ingest vào vector DB
- `eval/questions.jsonl`: bộ câu hỏi kiểm thử routing, retrieval và answer quality

## Cách dùng đúng

1. Khi user đang ở một màn hình cụ thể như xem phim, roadmap hoặc flashcard:
- hệ thống lấy `runtime context` từ DB trước
- sau đó mới retrieve thêm tài liệu tĩnh từ `rag_data` nếu cần

2. Khi user hỏi câu mang tính “hướng dẫn dùng hệ thống”:
- có thể dùng `rag_data` làm nguồn chính

3. Khi user hỏi câu cần dữ liệu cá nhân hiện tại:
- `rag_data` chỉ đóng vai trò phụ trợ
- câu trả lời chính vẫn phải dựa vào DB runtime

## Format metadata khuyến nghị

Mỗi dòng trong `metadata.jsonl` nên có:

- `doc_id`
- `title`
- `doc_group`
- `topic`
- `level`
- `lang`
- `source_type`
- `context_types`
- `keywords`
- `updated_at`
- `path`

## Format eval khuyến nghị

Mỗi dòng trong `eval/questions.jsonl` nên có:

- `id`
- `question`
- `expected_topic`
- `expected_context_type`
- `expected_source`
- `gold_hint`

## Lưu ý triển khai

1. Không nên chunk lẫn nhiều module vào cùng một đoạn.
2. Mỗi file nên tập trung vào một chủ đề rõ ràng.
3. Tài liệu trong `playbooks/` nên được ưu tiên cao hơn khi câu hỏi thuộc đúng context.
4. Tài liệu trong `troubleshooting/` nên được ưu tiên khi user hỏi theo kiểu lỗi, không dùng được, không thấy dữ liệu, AI trả sai, AI không biết.
