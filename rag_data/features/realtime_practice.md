# Luyện tập realtime, video call 1:1 và chủ đề gợi ý bởi AI

## Mục tiêu của module

Phân hệ này giúp user chuyển từ học một mình sang thực hành tương tác. Hệ thống có luồng realtime qua socket và có thể dùng AI để gợi ý chủ đề hội thoại cho user khi gọi 1:1.

## Những gì hệ thống hiện có

1. Realtime socket cho một số luồng kết nối và ghép cặp.
2. Sự kiện socket như:
- `register`
- `find_tutor`
- `accept_request`
- `cancel_request`
3. API tạo chủ đề hội thoại ngắn bằng AI.

## Cách AI được dùng trong phần này

Service hiện tại có thể sinh:

1. Một `topic` hội thoại ngắn, dễ mở đầu.
2. `questions` để phá băng khi nói chuyện.
3. `vocabulary` liên quan đến topic kèm nghĩa tiếng Việt ngắn.

## Những câu user thường hỏi

1. Tôi nên nói gì khi bắt đầu call 1:1?
2. Chủ đề AI vừa gợi ý phù hợp để nói về điều gì?
3. Tôi nên học từ vựng nào trước khi call?
4. Tôi bị bí ý tưởng khi nói thì làm sao?
5. Vì sao tôi chưa ghép cặp được?

## Runtime context cần có khi chat ở realtime practice

1. User đang ở màn hình nào: call 1:1 hay typing realtime.
2. Chủ đề AI mới nhất nếu có.
3. Danh sách câu hỏi gợi ý đã sinh.
4. Từ vựng gợi ý đi kèm topic.

## Cách chatbox nên trả lời

1. Nếu có topic AI hiện tại, hãy bám vào topic đó.
2. Nếu user bí ý, hãy đề xuất dùng 1 trong 3 câu hỏi gợi ý làm câu mở đầu.
3. Nếu user hỏi từ vựng cần biết trước khi call, hãy ưu tiên nhóm từ AI vừa sinh cho topic hiện tại.
4. Nếu user hỏi lỗi ghép cặp realtime, có thể chuyển sang hướng kiểm tra kết nối hoặc thử lại.

## Điều chatbox không nên bịa

1. Không hứa chắc sẽ có người ghép cặp ngay lập tức.
2. Không nói user đang trong phòng nào nếu backend chưa gửi room context.
3. Không bịa topic mới khác với topic AI đã sinh mà không nói rõ đó là gợi ý bổ sung.

## Gợi ý hành động tiếp theo nên đề xuất

1. Xem lại 5 từ vựng do AI đề xuất trước khi call.
2. Dùng câu hỏi mở đầu ngắn thay vì cố nói dài.
3. Nếu chưa ghép cặp được, luyện bằng typing game hoặc shadowing trong lúc chờ.
