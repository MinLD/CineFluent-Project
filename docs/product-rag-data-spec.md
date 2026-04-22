# Product-RAG Data Spec cho CineFluent

## 1. Mục tiêu

Tài liệu này mô tả cách chuẩn bị dữ liệu cho chatbox AI theo đúng hệ thống CineFluent. Trọng tâm là tách rõ:

1. dữ liệu nào thuộc `runtime context`
2. dữ liệu nào thuộc `Product-RAG`
3. câu hỏi nào nên đi `runtime`, `rag` hoặc `hybrid`

## 2. Nguồn dữ liệu cần dùng

### 2.1. Runtime context từ database

Không ingest các dữ liệu này vào vector DB. Chúng phải được query trực tiếp khi user chat.

#### `context_type = movie`

- `videos`
- `subtitles`
- `movie_ai_analyses`
- `watch_history`
- `flashcards` theo `user_id` và `video_id`

#### `context_type = flashcard`

- `flashcards`
- `flashcard_exercises`

#### `context_type = roadmap`

- `ai_assessments`
- `study_roadmaps`
- `daily_tasks`

#### `context_type = typing_game`

- `typing_game_maps`
- `typing_game_stages`

#### `context_type = realtime_practice`

- dữ liệu topic AI vừa sinh
- câu hỏi gợi ý và vocabulary kèm topic
- trạng thái realtime nếu backend có thể cung cấp

### 2.2. Tri thức tĩnh trong `rag_data`

Các tài liệu trong `rag_data` chỉ nhằm:

1. giải thích đúng tính năng
2. hướng dẫn cách dùng
3. hỗ trợ troubleshooting
4. cung cấp playbook trả lời theo module

## 3. Routing câu hỏi

### 3.1. Chỉ dùng runtime context

Áp dụng cho các câu hỏi như:

- phim này có hợp level của tôi không
- câu subtitle hiện tại nghĩa là gì
- hôm nay tôi nên học gì trong roadmap
- tôi sai bài flashcard nào
- chapter hiện tại của typing game đang luyện gì

### 3.2. Chỉ dùng Product-RAG

Áp dụng cho các câu hỏi như:

- CineFluent là gì
- vì sao hệ thống dùng RAG
- làm sao gửi yêu cầu phim
- vì sao AI báo không đủ dữ liệu

### 3.3. Dùng hybrid

Áp dụng cho các câu hỏi như:

- từ này có nên lưu vào flashcard không
- tôi nên ôn từ nào trước
- tôi nên nói gì khi bắt đầu call 1:1
- nếu tôi chưa xong task hôm nay thì nên làm sao

## 4. Thiết kế metadata

Mỗi tài liệu trong `rag_data` có metadata:

- `doc_group`
  cho biết loại tài liệu: `feature`, `faq`, `playbook`, `troubleshooting`
- `topic`
  chủ đề logic để filter retrieval
- `context_types`
  những context nên ưu tiên tài liệu đó
- `keywords`
  từ khóa hỗ trợ semantic retrieval hoặc hybrid retrieval

## 5. Khuyến nghị ingest

1. Chunk theo heading lớn.
2. Không cắt lẫn nhiều module vào cùng chunk.
3. `playbooks/` nên được boost điểm retrieval cao hơn khi context khớp.
4. `troubleshooting/` nên được boost khi câu hỏi có dấu hiệu lỗi, không thấy, không dùng được, tại sao AI không biết.

## 6. Tối thiểu phải có trước khi code chatbox

1. Bộ `rag_data` hoàn chỉnh.
2. `metadata.jsonl` đồng bộ với tất cả file.
3. `eval/questions.jsonl` đủ nhiều để test routing.
4. Bản đồ `context_type -> bảng DB` chốt xong.

## 7. Kết luận

Hướng an toàn và đúng nhất cho CineFluent là:

1. dùng DB cho dữ liệu cá nhân và dữ liệu màn hình hiện tại
2. dùng Product-RAG cho tri thức tĩnh của chính sản phẩm
3. không biến chatbox thành hệ thống dạy toàn bộ tiếng Anh ngoài scope hiện tại
