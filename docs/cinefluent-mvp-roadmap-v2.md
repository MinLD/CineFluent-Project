# CineFluent MVP Roadmap V2

Tài liệu này chốt lại lộ trình MVP tiếp theo của CineFluent theo hướng:

1. `Learning Tree` cho người học theo dõi tiến trình ngữ pháp.
2. `Daily Adaptive Lesson` để mỗi ngày hệ thống tạo ra bài học và bài tập dựa trên điểm yếu thật.
3. `Online Classroom` cho giáo viên tổ chức lớp học, giao bài từ subtitle phim, và dùng AI để tóm tắt lại buổi học.

Tài liệu này dùng để theo dõi tiến độ thực hiện. Khi hoàn thành hạng mục nào, đổi dấu từ `[ ]` sang `[x]`.

---

## 1. Mục tiêu sản phẩm

### 1.1. Mục tiêu tổng quát

Biến CineFluent từ một hệ thống học tiếng Anh qua phim có quiz ngữ pháp thích nghi thành một hệ sinh thái học tập có 3 lớp giá trị:

- Lớp 1: `Adaptive Learning`
  - Hệ thống hiểu người học đang yếu tag ngữ pháp nào.
- Lớp 2: `Personalized Guidance`
  - Hệ thống đề xuất chính xác hôm nay nên học gì.
- Lớp 3: `Teacher Support`
  - Giáo viên tạo bài, theo dõi lớp, và có AI hỗ trợ tổng hợp nội dung buổi học.

### 1.2. Mục tiêu MVP

Ở bản MVP, hệ thống cần đạt được các năng lực tối thiểu sau:

- Người học nhìn thấy tiến trình ngữ pháp của mình theo dạng cây/nhánh.
- Mỗi ngày người học có 1 bài học rõ ràng, được sinh từ dữ liệu tiến trình thật chứ không phải chỉ là text do Gemini bịa ra.
- Giáo viên có thể tạo một lớp học online cơ bản.
- Giáo viên có thể giao bài tập ngữ pháp lấy từ subtitle phim.
- AI có thể tổng hợp lại nội dung buổi học để học viên xem lại.

### 1.3. Nguyên tắc thiết kế

- `DKT/UserTagMastery` quyết định học gì.
- `Gemini` chỉ hỗ trợ diễn đạt, giải thích, và tóm tắt.
- `Subtitle + grammar_tag_id + cloze_data` là nguồn nội dung học tập quan trọng nhất.
- Tận dụng tối đa hạ tầng đã có, không dựng lại từ đầu.

---

## 2. Trạng thái hiện tại của hệ thống

Phần này ghi nhận các nền tảng đã hoàn thành trước khi bắt đầu roadmap mới.

### 2.1. Nền tảng AI và quiz qua phim

- [x] Mô hình grammar classification đã tích hợp vào backend.
- [x] Mô hình DKT ONNX đã tích hợp vào player.
- [x] Subtitle đã có `grammar_tag_id`.
- [x] Subtitle đã có `cloze_data`.
- [x] Player có thể bật quiz ngữ pháp theo look-ahead trigger.
- [x] Kết quả đúng/sai đã có thể cập nhật lại mastery state.
- [x] Admin UI đã đồng bộ sang pipeline `grammar-only`.
- [x] Luồng phân tích AI đã có trạng thái `PROCESSING`.

### 2.2. Nền tảng dữ liệu học tập

- [x] Đã có bảng `UserKnowledgeState`.
- [x] Đã có bảng `UserTagMastery`.
- [x] Đã có bảng `GrammarTag`.
- [x] Đã có bảng `StudyRoadmap`.
- [x] Đã có bảng `DailyTask`.

### 2.3. Nền tảng nội dung

- [x] Hệ thống đã có subtitle song ngữ và metadata VTT.
- [x] Hệ thống đã có nguồn câu từ phim để sinh quiz.
- [x] Hệ thống đã có chatbox chung dùng Product-RAG.

### 2.4. Kết luận về trạng thái hiện tại

Kết luận: CineFluent đã hoàn tất phần lõi kỹ thuật cho `AI Grammar Quiz via Movies`. Roadmap dưới đây là giai đoạn `MVP mở rộng sản phẩm`.

---

## 3. Scope MVP mới

Roadmap MVP này chia thành 3 khối chính:

1. `Learning Tree`
2. `Daily Adaptive Lesson`
3. `Online Classroom + AI Session Recap`

Mỗi khối đều phải bám vào dữ liệu ngữ pháp thật của hệ thống.

---

## 4. Workstream A: Discovery Learning Tree

## 4.1. Mục tiêu

Cho người học thấy tiến trình ngữ pháp theo cấu trúc trực quan, nhưng theo hướng `khám phá dần` thay vì hiện toàn bộ cây ngay từ đầu.

## 4.2. Giá trị người dùng

- Biết mình mạnh/yếu ở nhánh nào.
- Biết hôm nay nên tập trung vào phần nào.
- Có cảm giác tiến bộ rõ ràng theo thời gian.

## 4.3. Định nghĩa sản phẩm

Thay vì hiển thị toàn bộ hệ thống ngữ pháp ngay khi user mới vào, `Discovery Learning Tree` sẽ hoạt động theo nguyên tắc:

- User gặp kiến thức nào qua phim thì mở khóa kiến thức đó.
- User làm quiz hoặc học daily lesson về kiến thức đó thì node được cập nhật điểm.
- Cây tri thức lớn dần theo hành trình học thật của user.
- Những phần chưa từng gặp có thể:
  - ẩn hoàn toàn
  - hoặc hiện mờ dưới dạng `Chưa khám phá`

Điểm cốt lõi:

- Đây không phải là `giáo trình hiện sẵn`.
- Đây là `bản đồ khám phá kiến thức`.

## 4.4. Định nghĩa MVP

Ở bản MVP, `Discovery Learning Tree` chỉ cần:

- Một `Grammar Branch` chứa nhiều `GrammarTag`.
- Chỉ hiển thị các tag user đã khám phá.
- Mỗi `GrammarTag` hiển thị:
  - `mastery_score`
  - `last_practiced_at`
  - `encounter_count`
  - trạng thái node
- UI có:
  - sơ đồ nhánh
  - số lượng kiến thức đã khám phá
  - khu vực `Mới khám phá`
  - khu vực `Đang học`
  - khu vực `Yếu nhất hôm nay`

## 4.5. Trạng thái node

Mỗi node trong cây có 3 trạng thái chính:

- `Locked`
  - User chưa từng gặp kiến thức này.
- `Discovered`
  - User đã gặp qua phim hoặc quiz, nhưng mastery còn thấp hoặc mới mở khóa.
- `Mastered`
  - User đã luyện đủ tốt để xem là đã nắm tương đối vững.

## 4.6. Thiết kế dữ liệu

### 4.6.1. Bảng cần có

- [x] Tạo bảng `GrammarBranch`
  - `id`
  - `name_en`
  - `name_vi`
  - `description`
  - `display_order`

- [x] Thêm quan hệ `GrammarTag -> GrammarBranch`
  - thêm `branch_id` vào `GrammarTag`

### 4.6.2. Cơ chế unlock

Ở phần MVP, có 2 phương án:

#### Phương án A: không tạo bảng mới

- xem một tag là `đã khám phá` nếu user đã có dòng `UserTagMastery`

Ưu điểm:

- làm nhanh
- ít thay đổi database

Nhược điểm:

- chưa phân biệt rõ user mới gặp lần đầu hay đã học khá sâu

#### Phương án B: tạo bảng riêng `UserDiscoveredTag`

- [x] Tạo bảng `UserDiscoveredTag`
  - `user_id`
  - `tag_id`
  - `discovered_at`
  - `encounter_count`
  - `source`

`source` có thể là:

- `movie`
- `quiz`
- `daily_lesson`

Ưu điểm:

- đúng bản chất khám phá
- dễ mở rộng UI kiểu unlock
- dễ thống kê hành trình học

Nhược điểm:

- phải thêm model và migration

Đề xuất:

- MVP gọn: dùng `Phương án A`
- MVP chuẩn chỉnh: dùng `Phương án B`

Trạng thái hiện tại:

- [x] Đã chốt và triển khai `Phương án B`

### 4.6.3. Dữ liệu cần sinh ra

- [x] Xây dựng công thức tính `review_priority`
  - đầu vào:
    - `mastery_score`
    - `last_practiced_at`
    - số lần sai gần đây

- [ ] Xây dựng dữ liệu tổng hợp theo branch:
  - `average_mastery`
  - `weakest_tag`
  - `due_count`

### 4.6.4. Dữ liệu hiển thị trên cây

- [x] Tổng số tag đã khám phá
- [x] Tổng số tag đã thành thạo
- [x] Tag mới mở gần đây
- [ ] Nhánh có nhiều kiến thức mới nhất

## 4.7. Backend cần làm

### 4.7.1. Nền dữ liệu phase đầu

- [x] Tạo `GrammarBranch`
- [x] Map `GrammarTag -> GrammarBranch`
- [x] Chốt cơ chế `unlock`
- [x] Tạo service tính node state:
  - `locked`
  - `discovered`
  - `mastered`

### 4.7.2. API phase đầu

- [x] API `GET /api/learning-tree`
  - trả về các branch và tag user đã khám phá
  - có thể kèm danh sách tag `locked_count`

- [x] API `GET /api/learning-tree/summary`
  - trả về:
    - tag yếu nhất
    - branch yếu nhất
    - số tag cần ôn hôm nay
    - số tag mới khám phá

- [x] Service tổng hợp tiến trình theo `UserTagMastery`
- [x] API `POST /api/learning-tree/discover`
  - mở khóa tag mới khi user gặp kiến thức qua phim, quiz hoặc daily lesson

## 4.8. Frontend cần làm

- [ ] Tạo trang `Learning Tree`
- [ ] Hiển thị `Discovery Tree`
- [ ] Chỉ render các nhánh đã mở khóa hoặc có tiến trình
- [ ] Mỗi tag có trạng thái màu:
  - xám: chưa khám phá
  - vàng: mới khám phá / đang học
  - xanh: đã nắm khá tốt
  - đỏ: đang yếu và cần ôn lại

- [ ] Tạo khối:
  - `Mới khám phá`
  - `Điểm yếu hôm nay`
  - `Tiến bộ gần đây`
  - `Nên ôn lại`
  - `Bạn đã khám phá bao nhiêu kiến thức`

## 4.9. Tiêu chí nghiệm thu

- [ ] User mới không bị nhìn thấy toàn bộ cây ngữ pháp ngay từ đầu.
- [ ] Sau khi user gặp một tag mới qua phim hoặc quiz, cây được mở khóa thêm node mới.
- [ ] Hệ thống xác định được ít nhất 3 tag yếu nhất trong số các tag đã khám phá.
- [ ] Sau khi làm quiz, dữ liệu trong tree thay đổi đúng theo tiến trình mới.

## 4.10. Ngoài scope MVP

- [ ] Không làm socket realtime ở phase đầu.
- [ ] Không làm animation cây quá nặng.
- [ ] Không làm visualization 3D.
- [ ] Không ép user phải mở hết toàn bộ chương ngữ pháp từ đầu.

---

## 5. Workstream B: Daily Adaptive Lesson

## 5.1. Mục tiêu

Thay roadmap hiện tại từ kiểu “Gemini sinh nội dung chung chung” sang kiểu:

`Hệ thống chọn đúng điểm yếu -> sinh bài học mỗi ngày -> user vào học đúng 1 bài đáng học`

## 5.2. Giá trị người dùng

- Không bị quá tải bởi lộ trình dài và chung chung.
- Vào mỗi ngày là biết ngay cần học gì.
- Bài học gắn với lỗi thật của mình.

## 5.3. Định nghĩa MVP

Mỗi ngày user chỉ cần có:

- 1 chủ điểm ngữ pháp chính
- 1 phần giải thích ngắn
- 3 đến 5 ví dụ thật từ subtitle phim
- 5 đến 10 câu luyện tập
- 1 đoạn recap sau bài học

## 5.4. Logic chọn bài học

Hệ thống không được chọn bài chỉ bằng prompt của Gemini.

Rule đề xuất:

- ưu tiên tag có `mastery_score` thấp
- ưu tiên tag lâu chưa ôn
- ưu tiên tag user vừa làm sai gần đây
- nếu nhiều tag cùng yếu, chọn 1 tag chính và 1 tag phụ

## 5.5. Vai trò của AI

### 5.5.1. AI được làm

- [ ] Viết lời giải thích dễ hiểu
- [ ] Viết mẹo ghi nhớ
- [ ] Tóm tắt bài học cuối buổi
- [ ] Sinh thêm ví dụ phụ trợ nếu cần

### 5.5.2. AI không được làm

- [ ] Không tự quyết định toàn bộ roadmap
- [ ] Không bỏ qua dữ liệu mastery thật
- [ ] Không sinh bài học hoàn toàn tách rời subtitle phim

## 5.6. Backend cần làm

### 5.6.1. Engine chọn bài học hôm nay

- [ ] Tạo service `daily_lesson_engine`
- [ ] Input:
  - user id
  - `UserTagMastery`
  - lịch sử quiz gần đây
  - review priority

- [ ] Output:
  - `focus_tag`
  - `secondary_tags`
  - `examples`
  - `practice_questions`

### 5.6.2. DailyTask generation

- [ ] Mở rộng `DailyTask` để lưu:
  - `focus_tag_id`
  - `lesson_payload`
  - `practice_payload`
  - `recap_payload`

- [ ] API `POST /api/daily-lessons/generate`
- [ ] API `GET /api/daily-lessons/today`
- [ ] API `POST /api/daily-lessons/:id/complete`

### 5.6.3. Nguồn ví dụ

- [ ] Lấy subtitle theo `grammar_tag_id`
- [ ] Ưu tiên subtitle có `cloze_data` tốt
- [ ] Loại câu quá ngắn hoặc quá nhiễu

## 5.7. Frontend cần làm

- [ ] Tạo trang `Daily Lesson`
- [ ] Hiển thị:
  - mục tiêu hôm nay
  - lý do hệ thống chọn bài này
  - ví dụ từ phim
  - bài tập
  - recap cuối bài

- [ ] Nút:
  - `Bắt đầu học`
  - `Làm bài`
  - `Đánh dấu hoàn thành`

- [ ] Khối nhỏ trên dashboard:
  - `Bài học hôm nay`

## 5.8. Tiêu chí nghiệm thu

- [ ] Mỗi user có thể nhận được 1 bài học hôm nay.
- [ ] Bài học bám đúng vào tag yếu thật.
- [ ] Bài học có ví dụ thật từ subtitle.
- [ ] Sau khi hoàn thành bài học, hệ thống cập nhật trạng thái tiến trình.

## 5.9. Ngoài scope MVP

- [ ] Không làm roadmap 30 ngày quá phức tạp ở phase đầu.
- [ ] Không làm nhiều mục tiêu học tập song song.
- [ ] Không làm adaptive curriculum quá sâu bằng nhiều tầng mô hình.

---

## 6. Workstream C: Online Classroom + AI Session Recap

## 6.1. Mục tiêu

Tạo một môi trường lớp học online cơ bản để giáo viên:

- tạo lớp
- tổ chức buổi học
- giao bài tập lấy từ subtitle phim
- và sau buổi học, AI tổng hợp lại nội dung cô đã dạy cho học viên xem lại

## 6.2. Giá trị người dùng

### 6.2.1. Với giáo viên

- Dùng dữ liệu subtitle phim để tạo bài tập nhanh
- Theo dõi tiến trình lớp theo tag ngữ pháp
- Có AI hỗ trợ tóm tắt bài dạy

### 6.2.2. Với học viên

- Xem lại bài sau buổi học
- Biết hôm nay cô dạy gì
- Xem ví dụ, bài tập và phần cần ôn

## 6.3. Định nghĩa MVP

Lớp học online ở đây là lớp học quản trị nội dung và bài tập, chưa cần video call phức tạp.

MVP cần có:

- `Classroom`
- `Class Session`
- `Assignment`
- `Assignment from subtitles`
- `AI Session Recap`

## 6.4. Thiết kế dữ liệu

### 6.4.1. Bảng cần tạo

- [ ] `Classroom`
  - `id`
  - `name`
  - `description`
  - `teacher_id`
  - `status`

- [ ] `ClassroomMember`
  - `classroom_id`
  - `student_id`
  - `role`

- [ ] `ClassSession`
  - `classroom_id`
  - `title`
  - `description`
  - `scheduled_at`
  - `grammar_focus`
  - `teacher_notes`

- [ ] `ClassAssignment`
  - `classroom_id`
  - `session_id`
  - `title`
  - `source_type`
  - `due_at`

- [ ] `ClassAssignmentQuestion`
  - `assignment_id`
  - `subtitle_id`
  - `grammar_tag_id`
  - `question_payload`

- [ ] `ClassSessionRecap`
  - `session_id`
  - `summary_text`
  - `key_points`
  - `homework_text`
  - `review_suggestions`

## 6.5. Use case giáo viên

### 6.5.1. Tạo lớp học

- [ ] Giáo viên tạo lớp
- [ ] Thêm học viên vào lớp

### 6.5.2. Tạo buổi học

- [ ] Tạo `ClassSession`
- [ ] Chọn các grammar tag trọng tâm
- [ ] Ghi chú ngắn về nội dung bài dạy

### 6.5.3. Tạo bài tập từ subtitle phim

- [ ] Giáo viên chọn phim
- [ ] Chọn `grammar_tag`
- [ ] Hệ thống lọc subtitle theo tag
- [ ] Giáo viên chọn các câu muốn giao
- [ ] Hệ thống sinh thành bài tập

## 6.6. Use case học viên

- [ ] Xem lớp mình tham gia
- [ ] Xem buổi học hôm nay
- [ ] Xem recap buổi học
- [ ] Làm bài tập được giao
- [ ] Theo dõi bài nào đã hoàn thành

## 6.7. AI Session Recap

## 6.7.1. Mục tiêu

Sau mỗi buổi học, AI sẽ tổng hợp:

- hôm nay cô dạy những gì
- các điểm ngữ pháp chính
- ví dụ minh họa
- bài tập về nhà
- phần cần ôn lại

## 6.7.2. Input cho AI

- [ ] `teacher_notes`
- [ ] danh sách `grammar_tags` của session
- [ ] danh sách bài tập đã giao
- [ ] subtitle tiêu biểu đã dùng trong buổi học

## 6.7.3. Output từ AI

- [ ] `Tóm tắt buổi học`
- [ ] `Các điểm chính đã học`
- [ ] `Ví dụ quan trọng`
- [ ] `Bài tập cần làm`
- [ ] `Phần cần ôn lại`

## 6.8. Backend cần làm

- [ ] API `POST /api/classrooms`
- [ ] API `GET /api/classrooms/:id`
- [ ] API `POST /api/classrooms/:id/members`
- [ ] API `POST /api/classrooms/:id/sessions`
- [ ] API `GET /api/classrooms/:id/sessions`
- [ ] API `POST /api/classrooms/:id/assignments/from-subtitles`
- [ ] API `GET /api/classrooms/:id/assignments`
- [ ] API `POST /api/class-sessions/:id/generate-recap`
- [ ] API `GET /api/class-sessions/:id/recap`

## 6.9. Frontend cần làm

- [ ] Trang `Teacher Classroom Dashboard`
- [ ] Trang `Class Session Detail`
- [ ] Trang `Create Assignment from Subtitle`
- [ ] Trang `Student Class View`
- [ ] Trang `Session Recap`

## 6.10. Tiêu chí nghiệm thu

- [ ] Giáo viên tạo được lớp học.
- [ ] Giáo viên tạo được buổi học.
- [ ] Giáo viên giao được bài từ subtitle phim theo tag ngữ pháp.
- [ ] Học viên xem được recap buổi học.
- [ ] AI recap tạo ra nội dung đọc lại được, có cấu trúc rõ ràng.

## 6.11. Ngoài scope MVP

- [ ] Không làm video meeting riêng trong phase đầu.
- [ ] Không làm whiteboard realtime.
- [ ] Không làm chấm nói trực tiếp trong lớp.

---

## 7. Thứ tự triển khai MVP

Để không vỡ scope, thứ tự ưu tiên nên là:

### Phase 1: Dữ liệu nền cho Discovery Tree

- [x] Tạo `GrammarBranch`
- [x] Map `GrammarTag -> GrammarBranch`
- [x] Chốt cơ chế `unlock/discovery`
- [x] Tính `review_priority`
- [x] API learning tree

### Phase 2: Learning Tree UI

- [ ] Làm trang tiến trình kiểu khám phá
- [ ] Chỉ hiển thị phần đã mở
- [ ] Hiển thị khối mới khám phá, yếu nhất và cần ôn

### Phase 3: Daily Adaptive Lesson Engine

- [ ] Service chọn bài hôm nay
- [ ] DailyTask mới theo tag yếu
- [ ] Sinh lesson + examples + quiz + recap

### Phase 4: Daily Lesson UI

- [ ] Trang bài học hôm nay
- [ ] Hiển thị ví dụ từ phim
- [ ] Hiển thị bài tập
- [ ] Đánh dấu hoàn thành

### Phase 5: Classroom Core

- [ ] Tạo lớp học
- [ ] Tạo buổi học
- [ ] Thêm học viên
- [ ] Danh sách assignment

### Phase 6: Assignment from Movie Subtitles

- [ ] Lọc subtitle theo grammar tag
- [ ] Tạo bài tập từ subtitle
- [ ] Học viên làm bài

### Phase 7: AI Session Recap

- [ ] Sinh recap sau buổi học
- [ ] Hiển thị recap cho học viên

---

## 8. Kiến trúc tổng thể đề xuất

## 8.1. Luồng người học

`Movie Quiz / Daily Lesson / Assignment -> Discover Tag -> Update Mastery -> Update Discovery Tree -> Generate Next Lesson`

## 8.2. Luồng giáo viên

`Create Session -> Select Grammar Focus -> Select Movie Subtitles -> Generate Assignment -> Teach -> Generate AI Recap`

## 8.3. Luồng AI

- `DKT + UserTagMastery`
  - theo dõi tiến trình
- `Grammar classifier`
  - phân loại subtitle
- `Gemini`
  - viết giải thích
  - viết recap bài học
  - viết recap buổi học

---

## 9. Rủi ro và lưu ý kỹ thuật

## 9.1. Rủi ro về dữ liệu

- [x] `GrammarTag` hiện tại đã được map vào `GrammarBranch` trong code và migration.
- [ ] Subtitle có thể nhiễu, cần lọc trước khi đưa vào assignment.
- [ ] Cloze data có thể chưa đủ chất lượng cho mọi câu.

## 9.2. Rủi ro về AI

- [ ] Không để Gemini tự quyết định lộ trình học.
- [ ] AI recap phải bám vào dữ liệu buổi học thật.
- [ ] Cần giới hạn prompt để tránh recap lan man.

## 9.3. Rủi ro về UX

- [ ] Cây tiến trình quá phức tạp sẽ làm user rối.
- [ ] Daily Lesson nếu quá dài user sẽ bỏ qua.
- [ ] Classroom nếu làm giống LMS lớn quá sớm sẽ vỡ scope.

---

## 10. Định nghĩa hoàn thành MVP

MVP này được xem là hoàn thành khi tất cả điều kiện sau đã đạt:

- [ ] User có thể xem `Learning Tree`.
- [ ] User có `Daily Lesson` thật sự bám theo điểm yếu.
- [ ] Giáo viên có thể tạo lớp học online cơ bản.
- [ ] Giáo viên giao được bài tập từ subtitle phim.
- [ ] AI có thể tổng hợp lại buổi học cho học viên xem lại.

---

## 11. Gợi ý quản lý tiến độ

Để dùng tài liệu này hiệu quả, nên cập nhật theo quy tắc:

- Hạng mục chưa làm: `[ ]`
- Hạng mục đang làm: thêm ghi chú `đang làm`
- Hạng mục xong: `[x]`

Ví dụ:

- `[x] Tạo API learning tree`
- `[ ] Làm trang Session Recap`
- `[ ] Generate assignment from subtitle (đang làm backend)`

---

## 12. Kết luận

Roadmap MVP này không đi theo hướng thêm tính năng rời rạc, mà mở rộng CineFluent theo một trục sản phẩm thống nhất:

- `Discovery Learning Tree` để trực quan hóa tiến trình theo hướng khám phá dần
- `Daily Adaptive Lesson` để biến tiến trình thành hành động học mỗi ngày
- `Online Classroom + AI Session Recap` để mở rộng hệ thống cho giáo viên và lớp học

Nếu đi đúng thứ tự trong tài liệu này, CineFluent sẽ tiến từ một nền tảng `quiz ngữ pháp qua phim` thành một hệ thống `học tập thích nghi + hỗ trợ giảng dạy` có định hướng rất rõ ràng.
