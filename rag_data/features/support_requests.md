# Yêu cầu phim mới và báo lỗi video

## Mục tiêu của module

Phân hệ này cho phép user chủ động phản hồi để hệ thống hoàn thiện kho nội dung. User có thể yêu cầu một bộ phim chưa có hoặc báo lỗi đối với video hiện tại.

## Những gì user có thể làm

1. Gửi yêu cầu thêm phim mới.
2. Gửi ghi chú cho yêu cầu phim.
3. Báo lỗi video đang xem.
4. Mô tả loại lỗi và chi tiết lỗi.

## Dữ liệu thật mà hệ thống đang có

- `movie_requests`
  gồm `title`, `note`, `status`, `created_at`
- `video_reports`
  gồm `video_id`, `issue_type`, `description`, `status`, `created_at`

## Trạng thái thường gặp

### Movie request

- `PENDING`
- `APPROVED`
- `DONE`
- `REJECTED`

### Video report

- `PENDING`
- `RESOLVED`
- `IGNORED`

## Ví dụ lỗi video phổ biến

1. Video không phát được.
2. Subtitle sai hoặc thiếu.
3. Audio lệch subtitle.
4. Chất lượng nguồn video kém.

## Những câu user thường hỏi

1. Làm sao để yêu cầu thêm phim?
2. Tôi nên báo lỗi video theo cách nào?
3. Vì sao tôi đã gửi yêu cầu nhưng chưa thấy phim xuất hiện?
4. Báo lỗi rồi thì admin có thấy không?
5. Tôi nên chọn loại lỗi nào nếu subtitle sai?

## Cách chatbox nên trả lời

1. Nếu user muốn xem một phim chưa có trong hệ thống, hãy hướng dẫn sang luồng yêu cầu phim.
2. Nếu user đang xem một video lỗi, hãy hướng dẫn sang luồng báo lỗi video.
3. Nếu user hỏi trạng thái xử lý, nên giải thích ý nghĩa các trạng thái trước khi suy đoán thêm.

## Điều chatbox không nên bịa

1. Không hứa chính xác khi nào phim sẽ được thêm.
2. Không nói yêu cầu đã được duyệt nếu DB chưa có trạng thái tương ứng.
3. Không tự đoán lỗi video thuộc loại nào nếu user chưa mô tả hoặc chưa có context.
