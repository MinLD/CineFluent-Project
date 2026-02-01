
1. Tổng Quan Hệ Sinh Thái (Edutainment)
cinefluent là nền tảng học tiếng Anh qua phim ảnh, kết hợp giữa việc tự học (Solo Learning) và tương tác cộng đồng (Social/Gamification). Dự án giúp chuyển đổi từ việc xem phim thụ động sang chủ động thông qua các công cụ tương tác trực tiếp trên trình phát video.
2. Thiết Kế Database Chi Tiết (Chuẩn MySQL)
Dữ liệu được chia thành các Module độc lập nhưng có mối liên kết chặt chẽ để đảm bảo hiệu năng khi mở rộng.
Module 1: Auth & User (Hệ thống & Phân quyền)
•	roles: Quản lý cấp độ (Admin, User).
•	users: Thông tin xác thực, bao gồm email, password_hash, và google_id (để hỗ trợ Login Google).
•	profiles: Thông tin cá nhân, trình độ tiếng Anh và các chỉ số tích lũy (total_points, streak_days).
Module 2: Content & Community Library (Nội dung & Thư viện chung)
•	videos: Lưu thông tin phim từ YouTube/Drive. Bổ sung trường added_by_user_id (người đóng góp) và view_count (lượt xem công khai) để phục vụ tính năng gợi ý phim cho cộng đồng.
•	subtitles: Lưu trữ phụ đề song ngữ chi tiết từng câu thoại với mốc thời gian start_time, end_time.
•	user_video_history: (Bảng mới) Lưu lại lịch sử xem, tiến độ (giây thứ mấy) để người dùng xem tiếp và hệ thống gợi ý cho người khác.
Module 3: Learning Logic (Cơ chế học tập)
•	flashcards: Lưu từ vựng kèm ngữ cảnh phim, sử dụng thuật toán Spaced Repetition (next_review).
•	user_activity_log: Lưu lịch sử học tập hàng ngày để vẽ biểu đồ tiến độ (Dashboard).
Module 4: Multiplayer & Gamification (Giải trí xã hội)
•	rooms: Quản lý phòng chơi thời gian thực.
•	room_members: Quản lý người chơi và điểm số trong từng ván đấu.
•	ai_questions_bank: Ngân hàng câu hỏi do Gemini tạo ra từ kịch bản video để tiết kiệm chi phí API.
3. Luồng Hoạt Động Module 2 (Cải tiến)
1.	Đóng góp: Người dùng dán link YouTube. Backend (Flask) sử dụng youtube-transcript-api để tự động bóc tách phụ đề.
2.	Lưu trữ: Thông tin phim được đẩy vào kho dữ liệu chung (Public Library).
3.	Tương tác: Player hiển thị lớp Overlay chứa phụ đề. Người dùng có thể click từng từ để tra nghĩa hoặc lưu vào Flashcard.
4.	Gợi ý: Hệ thống thống kê các phim được xem nhiều nhất để hiển thị tại trang chủ cho người dùng khác.
4. Công Nghệ Áp Dụng
•	Frontend: Next.js (TypeScript), Tailwind CSS, Zustand (Quản lý trạng thái), Socket.io-client (Real-time).
•	Backend: Flask (Python), Flask-SQLAlchemy (MySQL), Flask-SocketIO.
•	AI & Media: Google Generative AI (Gemini 1.5 Flash), Web Speech API (Shadowing), PeerJS (Video Call).



5. Roadmap Thực Hiện 8 Tuần (2 Tháng)
Giai đoạn	Tuần	Công việc trọng tâm	Kết quả đạt được
Tháng 1: Core & Solo	1	Setup Auth, Login Google, Database User/Profile.	Đăng nhập & quản lý cá nhân.
	2	Xây dựng Module 2: Lưu link YouTube, bóc phụ đề vào DB.	Có kho phim để bắt đầu học.
	3	Smart Player: Overlay phụ đề, Click tra từ, đồng bộ thời gian.	Xem phim có tương tác.
	4	Active Learning: Chế độ Shadowing (thu âm) và Dictation.	Tự luyện nói & nghe.
Tháng 2: Social & AI	5	AI Integration: Gemini giải thích ngữ cảnh & quản lý Flashcards.	Hệ thống thông minh hơn.
	6	Real-time Lobby: Tạo phòng, mời bạn bè qua mã Code.	Kết nối người chơi.
	7	Multiplayer Games: Arcade & Cinema Room (AI Game Master).	Chơi game thi đấu.
	8	Video Call 1:1 (PeerJS), Dashboard tiến độ & Deploy.	Sản phẩm hoàn chỉnh.

