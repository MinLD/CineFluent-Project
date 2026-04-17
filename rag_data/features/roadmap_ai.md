# Roadmap AI, assessment và daily task

## Mục tiêu của module

Phân hệ roadmap giúp user không học rời rạc. Hệ thống dùng assessment để hiểu tương đối trình độ hiện tại, sau đó sinh roadmap tổng quan và daily task theo từng ngày.

## Những gì user có thể làm

1. Tạo bài assessment AI 4 kỹ năng.
2. Nộp assessment và nhận kết quả phân tích.
3. Xem lịch sử các lần assessment.
4. Reset một assessment đang làm dở hoặc muốn làm lại.
5. Tạo roadmap mới từ điểm hiện tại, điểm mục tiêu và số ngày học.
6. Xem danh sách roadmap đã tạo.
7. Xem chi tiết một roadmap.
8. Xem hoặc sinh daily task cho từng ngày.

## Dữ liệu thật mà hệ thống đang có

- `ai_assessments`
  gồm `quiz_data`, `user_answers`, `overall_score`, `grammar_feedback`, `vocab_feedback`, `strengths`, `weaknesses`, `status`, `is_fallback`
- `study_roadmaps`
  gồm `current_score`, `target_score`, `duration_days`, `blueprint_json`
- `daily_tasks`
  gồm `day_number`, `task_detail_json`, `status`, `score`

## Vai trò của assessment

Assessment là bước nền để roadmap có căn cứ hơn. Theo service hiện tại:

1. Assessment có thể được tạo bằng AI.
2. Nếu AI không sẵn sàng, hệ thống có thể dùng bộ câu hỏi fallback.
3. Sau khi user nộp bài, hệ thống có thể trả về:
- `overall_score`
- `grammar_feedback`
- `vocab_feedback`
- `strengths`
- `weaknesses`

## Vai trò của roadmap blueprint

Roadmap blueprint là “khung học tập” tổng quát trong nhiều ngày. Nó không phải từng câu hỏi chi tiết ngay từ đầu, mà là một kế hoạch chia theo ngày với các loại ngày như:

- study
- review
- practice
- homework
- assessment

## Vai trò của daily task

Daily task là phần user dùng để học thực tế trong từng ngày. Mỗi ngày có thể chứa:

1. Mục tiêu học.
2. Nội dung chính cần hoàn thành.
3. Bài tập hoặc nhiệm vụ cụ thể.
4. Trạng thái hoàn thành.

## Những câu user thường hỏi ở context roadmap

1. Hôm nay tôi nên học gì trước?
2. Điểm yếu lớn nhất của tôi là gì?
3. Vì sao roadmap này phù hợp với tôi?
4. Tôi đang yếu ngữ pháp hay từ vựng hơn?
5. Nếu tôi bỏ lỡ một ngày thì có sao không?
6. Tôi nên học daily task hôm nay trong bao lâu?

## Runtime context cần có khi chat ở roadmap

1. Assessment gần nhất đã hoàn thành.
2. `overall_score` gần nhất.
3. `grammar_feedback` và `vocab_feedback`.
4. `strengths` và `weaknesses`.
5. Roadmap hiện tại.
6. Daily task của ngày đang mở.

## Cách chatbox nên trả lời

1. Nếu user đã có roadmap, ưu tiên trả lời theo roadmap hiện tại.
2. Nếu user chưa có roadmap nhưng đã có assessment, nên gợi ý tạo roadmap.
3. Nếu user chưa có assessment, nên nói rõ rằng hệ thống chưa có đủ dữ liệu để xây roadmap cá nhân.
4. Nếu user hỏi “điểm yếu của tôi là gì”, phải dựa trên `weaknesses` hoặc feedback thật.
5. Nếu user hỏi “hôm nay học gì”, nên dựa trên `task_detail_json` của ngày hiện tại.

## Điều chatbox không nên bịa

1. Không tự kết luận user yếu phần nào khi chưa có assessment hoàn chỉnh.
2. Không nói user đang có roadmap nếu DB chưa có bản ghi.
3. Không tự tạo ra daily task mới trong câu trả lời mà không nói rõ đó chỉ là gợi ý.

## Gợi ý hành động tiếp theo nên đề xuất

1. Làm assessment nếu chưa từng đánh giá đầu vào.
2. Tạo roadmap mới nếu đã có điểm hiện tại và mục tiêu rõ ràng.
3. Mở daily task của ngày hiện tại.
4. Ôn lại một kỹ năng hoặc điểm yếu vừa được đánh dấu trong feedback.
