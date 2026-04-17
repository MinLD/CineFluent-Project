# Flashcard cá nhân và bài tập AI

## Mục tiêu của module

Phân hệ flashcard giúp user không bị quên từ sau khi xem phim. Từ vựng được lưu cùng ngữ cảnh và có thể được dùng lại để sinh bài tập AI.

## Những gì user có thể làm

1. Lưu từ vựng trực tiếp từ trang xem phim.
2. Xem lại danh sách flashcard cá nhân.
3. Ôn lại nghĩa, IPA, từ loại và ví dụ.
4. Tạo bài tập AI từ chính bộ flashcard đã lưu.
5. Làm bài tập và nhận điểm, số câu đúng, trạng thái hoàn thành.
6. Reset bài tập cũ để làm lại nếu cần.

## Dữ liệu thật mà hệ thống đang có

- `flashcards`
  gồm `word`, `context_sentence`, `ipa`, `pos`, `definition_vi`, `example_en`, `example_vi`, `video_id`, `created_at`
- `flashcard_exercises`
  gồm `quiz_data`, `user_answers`, `score`, `total_questions`, `correct_answers`, `status`

## Logic học tập của module

1. User lưu từ mới trong đúng ngữ cảnh phim đang xem.
2. Hệ thống không chỉ lưu nghĩa, mà lưu luôn ví dụ và câu gốc chứa từ đó.
3. Bài tập AI không lấy từ vựng ngẫu nhiên, mà dựa trên flashcard user đang có.
4. User có thể dùng kết quả bài tập để biết mình đang nhớ hay quên những từ nào.

## Dạng bài tập AI đang phù hợp với module này

Theo service hiện tại, hệ thống có thể sinh ít nhất 3 dạng:

1. Multiple choice
  đoán từ còn thiếu trong câu tiếng Anh
2. Fill in the blank
  nhìn gợi ý nghĩa tiếng Việt và điền từ còn thiếu
3. Translation
  dịch câu có chứa từ mục tiêu sang tiếng Anh

## Những câu user thường hỏi ở màn hình flashcard

1. Tôi nên ôn từ nào trước?
2. Từ này trong phim mang sắc thái gì?
3. Bạn cho tôi thêm ví dụ mới với từ này được không?
4. Tôi sai bài tập này ở đâu?
5. Flashcard này thuộc phim nào?
6. Tôi nên học ít từ nhưng nhớ sâu hay lưu nhiều từ?

## Runtime context cần có khi chat trong flashcard

1. Các flashcard gần đây nhất của user.
2. Flashcard đang được chọn hoặc đang xem.
3. Video nguồn của flashcard đó.
4. Bài tập flashcard gần nhất và điểm số tương ứng.
5. Các câu user làm sai nếu backend có thể lấy ra.

## Cách chatbox nên trả lời

1. Ưu tiên giải thích từ theo `context_sentence`.
2. Nếu user hỏi ôn từ nào trước, nên cân nhắc:
- từ mới lưu gần đây
- từ user vừa làm bài sai
- từ có tính ứng dụng cao trong giao tiếp
3. Nếu user hỏi vì sao sai, nên bám vào `quiz_data` và `user_answers`.
4. Nếu user chưa có flashcard nào, nên hướng dẫn quay lại trang phim và lưu từ từ subtitle.

## Điều chatbox không nên làm

1. Không bịa ra rằng một từ đã có trong bộ flashcard nếu DB không có.
2. Không tự chấm điểm bài tập nếu không có dữ liệu `user_answers`.
3. Không đưa lời khuyên “học lại toàn bộ” nếu chưa kiểm tra dữ liệu gần nhất.

## Gợi ý hành động tiếp theo nên đề xuất

1. Làm một bài tập AI ngắn từ 5 từ gần nhất.
2. Ôn lại các từ sai trong bài gần nhất.
3. Quay lại phim gốc để nhìn lại ngữ cảnh.
4. Tạo thêm ví dụ mới cho một từ khó nhớ.
