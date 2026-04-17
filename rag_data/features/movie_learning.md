# Học qua phim, subtitle song ngữ và luyện phản xạ

## Mục tiêu của module

Phân hệ này biến một bộ phim hoặc video học tập thành môi trường luyện tiếng Anh theo ngữ cảnh thật. Trọng tâm không chỉ là xem video, mà là vừa xem vừa hiểu, vừa nghe vừa nói, vừa lưu từ và ôn lại sau đó.

## Những gì user có thể làm

1. Xem phim với subtitle Anh - Việt đồng bộ theo thời gian.
2. Tạm dừng tại từng câu subtitle để hiểu nội dung theo ngữ cảnh.
3. Tra nhanh từ hoặc cụm từ ngay trên câu đang xem.
4. Lưu từ mới thành flashcard cá nhân.
5. Luyện nói shadowing theo từng câu thoại.
6. Luyện nghe chép câu hoặc nghe - gõ lại nội dung.
7. Xem độ khó phim nếu phim đã được AI phân tích.

## Dữ liệu thật mà hệ thống đang có

Phân hệ này bám vào các bảng và quan hệ sau:

- `videos`
  lưu thông tin phim, tiêu đề, mô tả, level, trạng thái public/private, lượt xem
- `subtitles`
  lưu từng câu subtitle với `start_time`, `end_time`, `content_en`, `content_vi`
- `movie_ai_analyses`
  lưu kết quả AI như `movie_score`, `movie_level`, `movie_cefr_range`, `dominant_grammar_tags`, `top_hard_segments`
- `watch_history`
  lưu lần xem gần nhất, thời lượng và vị trí đang xem
- `flashcards`
  lưu từ user đã lấy từ phim hiện tại

## Giá trị học tập chính

1. User hiểu câu thoại trong ngữ cảnh thay vì học từ rời rạc.
2. User thấy được phim có phù hợp level của mình hay không.
3. User có thể chuyển ngay từ “xem” sang “luyện nói” và “lưu từ”.
4. Một từ hoặc một cấu trúc ngữ pháp có thể được học lại nhiều lần qua phim, flashcard và bài tập.

## Những loại câu hỏi user hay hỏi trong context này

1. Câu subtitle này nghĩa là gì theo ngữ cảnh?
2. Từ này nên hiểu theo nghĩa nào trong câu hiện tại?
3. Phim này có hợp với trình độ của tôi không?
4. Tôi có nên lưu từ này vào flashcard không?
5. Vì sao tôi shadowing câu này khó?
6. Tôi nên luyện lại đoạn nào của phim?
7. CEFR hoặc level của phim này là gì?

## Runtime context cần có khi chat ở trang phim

Nếu user chat trong lúc đang xem phim, backend nên cố gắng đưa vào prompt:

1. `video_id`
2. `video.title`
3. `video.level`
4. `movie_ai_analyses.movie_cefr_range` nếu có
5. câu subtitle hiện tại hoặc subtitle gần nhất theo `current_time`
6. các flashcard gần đây của user lấy từ phim này
7. watch history gần nhất của user cho video hiện tại

## Cách chatbox nên trả lời

1. Ưu tiên bám vào câu subtitle hiện tại trước.
2. Nếu có `content_vi`, có thể dùng để đối chiếu nhưng vẫn nên giải thích thêm sắc thái của `content_en`.
3. Nếu user hỏi từ vựng, nên giải thích theo đúng câu đang phát thay vì đưa nghĩa từ điển chung chung.
4. Nếu user hỏi “có nên lưu từ này không”, nên đánh giá theo:
- mức độ quan trọng trong ngữ cảnh
- tần suất xuất hiện dự kiến
- tính ứng dụng trong giao tiếp
5. Nếu user hỏi phim có phù hợp hay không, ưu tiên dựa trên `movie_level` và `movie_cefr_range`.

## Những điều chatbox không được bịa

1. Không đoán nội dung subtitle nếu backend chưa gửi câu hiện tại.
2. Không tự kết luận phim thuộc CEFR nào nếu chưa có `movie_ai_analyses`.
3. Không nói user đã lưu một từ nào đó nếu database chưa có flashcard tương ứng.
4. Không khẳng định user đã tiến bộ chỉ dựa trên cảm tính.

## Gợi ý hành động tiếp theo nên đề xuất

Nếu phù hợp ngữ cảnh, chatbox có thể gợi ý:

1. Lưu từ vào flashcard.
2. Luyện shadowing lại đúng câu đang hỏi.
3. Luyện nghe - gõ cho câu vừa sai.
4. Xem thêm đoạn khó trong `top_hard_segments`.
5. Báo lỗi nếu subtitle sai hoặc lệch.
