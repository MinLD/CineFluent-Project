# BÁO CÁO CHUYÊN ĐỀ

## Xây dựng mô hình Multi-task Learning với XLM-RoBERTa để dự đoán độ khó và ngữ pháp của phụ đề phim

Ghi chú sử dụng:

- Tài liệu này bám theo khung báo cáo mẫu nhưng chỉ tập trung vào phần AI: mô hình `XLM-RoBERTa multitask` cho subtitle phim.
- Các chỗ có dạng `[ĐIỀN THÔNG TIN]`, `[CHÈN HÌNH]` là nơi nhóm có thể bổ sung thêm theo yêu cầu trình bày. Các số liệu cốt lõi trong Chương 3 và Chương 4 đã được điền lại trực tiếp từ notebook Colab huấn luyện.
- Bản này đã được viết lại theo hướng ít đề mục hơn, mỗi mục đủ dài và có nội dung rõ ràng, tránh chia nhỏ lan man.

---

## DANH MỤC VIẾT TẮT

| Viết tắt | Tên đầy đủ | Giải thích |
|---|---|---|
| AI | Artificial Intelligence | Trí tuệ nhân tạo |
| NLP | Natural Language Processing | Xử lý ngôn ngữ tự nhiên |
| MTL | Multi-task Learning | Học đa nhiệm |
| XLM-R | Cross-lingual Language Model - RoBERTa | Phiên bản viết tắt của mô hình XLM-RoBERTa |
| CEFR | Common European Framework of Reference for Languages | Khung tham chiếu trình độ ngôn ngữ chung châu Âu |
| SRT | SubRip Subtitle | Định dạng tệp phụ đề `.srt` |
| VTT | WebVTT | Định dạng tệp phụ đề `.vtt` |
| CSV | Comma-Separated Values | Định dạng tệp dữ liệu dạng bảng |
| JSON | JavaScript Object Notation | Định dạng trao đổi dữ liệu |
| API | Application Programming Interface | Giao diện lập trình ứng dụng |
| UI | User Interface | Giao diện người dùng |
| SQL | Structured Query Language | Ngôn ngữ truy vấn cơ sở dữ liệu |
| CLS | Classification Token | Token đại diện dùng cho phân loại trong mô hình Transformer |
| GPU | Graphics Processing Unit | Bộ xử lý đồ họa dùng để tăng tốc huấn luyện mô hình |
| CPU | Central Processing Unit | Bộ xử lý trung tâm |
| F1 | F1-score | Chỉ số đánh giá cân bằng giữa Precision và Recall |
| EDA | Exploratory Data Analysis | Phân tích khám phá dữ liệu |

---

## LỜI MỞ ĐẦU

Trong những năm gần đây, việc học ngoại ngữ không còn chỉ dừng lại ở lớp học truyền thống hay giáo trình tĩnh, mà ngày càng chuyển dịch sang những môi trường học tập có ngữ cảnh, giàu tính tương tác và gần với đời sống thật. Trong số các loại học liệu hiện đại, phim ảnh và phụ đề được xem là nguồn tài nguyên có giá trị đặc biệt vì chúng cung cấp ngôn ngữ trong bối cảnh sử dụng tự nhiên. Khi người học tiếp cận tiếng Anh thông qua lời thoại trong phim, họ không chỉ học từ vựng mà còn tiếp xúc với cấu trúc ngữ pháp, sắc thái giao tiếp, tốc độ nói và tình huống sử dụng ngôn ngữ. Tuy nhiên, hiệu quả của việc học qua phim phụ thuộc rất lớn vào khả năng lựa chọn bộ phim phù hợp với trình độ.

Một vấn đề thực tế là phần lớn người học hiện nay vẫn chọn phim theo cảm tính, theo mức độ yêu thích hoặc theo độ nổi tiếng của phim, thay vì dựa trên độ phù hợp ngôn ngữ. Điều này dẫn đến hai tình huống phổ biến. Thứ nhất, người học chọn phim quá dễ, làm cho trải nghiệm học tập thiếu thử thách và không tạo ra tiến bộ rõ rệt. Thứ hai, người học chọn phim quá khó, dẫn đến quá tải từ vựng, khó theo dõi phụ đề và nhanh chóng mất động lực. Bên cạnh đó, chỉ số "độ khó" của một bộ phim không đơn giản chỉ là số lượng từ mới, mà còn liên quan đến cấu trúc câu, mật độ lời thoại, mức độ cô đọng về ngữ nghĩa và các hiện tượng ngữ pháp xuất hiện trong subtitle.

Trong bối cảnh đó, việc xây dựng một mô hình có khả năng tự động đánh giá độ khó của subtitle phim và đồng thời nhận diện đặc trưng ngữ pháp chính là bài toán có ý nghĩa cả về mặt học thuật lẫn ứng dụng. Nếu hệ thống có thể phân tích từng dòng phụ đề ở mức câu, sau đó tổng hợp thành mức độ chung của cả bộ phim, người học sẽ có thêm một công cụ lựa chọn học liệu chính xác hơn. Mặt khác, quản trị viên của hệ thống cũng có thêm dữ liệu để phân loại nội dung, gắn nhãn, xây dựng lộ trình học và nâng cao chất lượng phục vụ người dùng.

Xuất phát từ yêu cầu đó, đề tài lựa chọn hướng tiếp cận `Multi-task Learning` dựa trên `XLM-RoBERTa`, một mô hình Transformer mạnh trong bài toán xử lý ngôn ngữ tự nhiên đa ngôn ngữ. Điểm quan trọng của đề tài không chỉ nằm ở việc huấn luyện mô hình trên notebook nghiên cứu, mà còn ở việc triển khai mô hình đó vào hệ thống CineFluent để tạo ra giá trị thật trong sản phẩm. Sau khi được huấn luyện, mô hình đã được đóng gói, tích hợp vào backend Flask, kết nối với database, hỗ trợ suy luận trên subtitle thật và trả kết quả lên giao diện quản trị lẫn giao diện người học. Vì vậy, đề tài thể hiện rõ sự kết nối giữa nghiên cứu AI và ứng dụng phần mềm thực tế.

---

## CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI

### 1.1. Giới thiệu

Đề tài "Xây dựng mô hình Multi-task Learning với XLM-RoBERTa để dự đoán độ khó và ngữ pháp của phụ đề phim" là một nhánh AI ứng dụng trong hệ thống học tiếng Anh CineFluent. Trong hệ thống này, subtitle phim không còn chỉ đóng vai trò hiển thị lời thoại mà trở thành dữ liệu trung tâm để phục vụ học tập. Từ subtitle, hệ thống có thể xây dựng nhiều chức năng như xem phim song ngữ, quick dictionary, lưu flashcard theo ngữ cảnh, luyện nói shadowing, luyện nghe dictation và phân tích mức độ khó của phim.

Trong số các khả năng trên, việc đánh giá độ khó của subtitle và của toàn bộ phim là một nhu cầu cốt lõi. Mỗi subtitle là một đơn vị nội dung ngắn, có tính hội thoại cao, chứa thông tin ngữ nghĩa và ngữ pháp đủ để phản ánh mức độ khó. Tuy nhiên, nếu chỉ dựa trên độ dài câu hoặc số lượng từ, việc đánh giá sẽ không chính xác. Một câu ngắn vẫn có thể khó nếu sử dụng cấu trúc ngữ pháp phức tạp, đảo ngữ, thành ngữ, câu điều kiện hoặc cách diễn đạt mang tính hội thoại cao. Do đó, việc kết hợp dự đoán độ khó với dự đoán ngữ pháp trong cùng một mô hình là hướng tiếp cận hợp lý.

Đầu vào chính của mô hình là `subtitle_text_clean`, tức là nội dung subtitle sau khi đã làm sạch các ký hiệu, thẻ kỹ thuật và phần nhiễu không mang nhiều ý nghĩa ngôn ngữ. Song song với đó, dữ liệu huấn luyện còn chứa `difficulty_score` biểu thị mức độ khó, và `grammar_tag_primary` biểu thị hiện tượng ngữ pháp chính của subtitle. Mục tiêu của mô hình là học được biểu diễn ngữ nghĩa đủ tốt để đồng thời giải hai nhiệm vụ:

- Dự đoán độ khó của subtitle theo các lớp rời rạc được xây dựng từ `difficulty_score`.
- Dự đoán nhãn ngữ pháp chính của subtitle.

Từ kết quả ở mức câu, hệ thống tiếp tục tổng hợp để tạo ra các chỉ số ở mức phim như `movie_score`, `movie_level`, `movie_cefr_range`, `difficulty_ratios`, `cefr_ratios`, `dominant_grammar_tags` và `top_hard_segments`. Đây là phần biến mô hình nghiên cứu thành một thành phần nghiệp vụ có thể sử dụng ngay trong sản phẩm.

### 1.2. Khảo sát hiện trạng

Trước đây, việc đánh giá mức độ khó của tài liệu học ngoại ngữ thường dựa vào phương pháp thủ công hoặc các chỉ số bề mặt như số lượng từ mới, độ dài câu hoặc cấp độ giáo trình. Các cách làm này có giá trị nhất định, nhưng khi áp dụng vào subtitle phim thì bộc lộ nhiều hạn chế. Một subtitle có thể rất ngắn nhưng vẫn khó vì chứa thành ngữ, câu rút gọn, câu hỏi tu từ hoặc sắc thái hội thoại mạnh. Ngược lại, có những subtitle dài hơn nhưng lại là cấu trúc rất đơn giản và dễ hiểu. Điều đó cho thấy việc đánh giá độ khó cần dựa trên biểu diễn ngữ nghĩa sâu hơn.

Trong lĩnh vực xử lý ngôn ngữ tự nhiên, các mô hình Transformer đã cho thấy hiệu quả vượt trội ở những bài toán phân loại văn bản. Trong đó, BERT, RoBERTa và XLM-RoBERTa là những backbone phổ biến nhờ khả năng học biểu diễn ngữ cảnh tốt. So với các phương pháp đặc trưng thủ công hoặc word embedding cổ điển, Transformer có ưu thế rõ rệt trong việc nắm bắt mối quan hệ giữa các thành phần trong câu, đặc biệt là với những hiện tượng ngữ pháp phụ thuộc ngữ cảnh.

XLM-RoBERTa là lựa chọn phù hợp cho đề tài vì đây là mô hình mạnh, ổn định, có sẵn hệ sinh thái tốt trên Hugging Face và xử lý tốt tokenization dưới dạng subword. Dù dữ liệu trong bài toán hiện tại chủ yếu là subtitle tiếng Anh, việc sử dụng XLM-RoBERTa vẫn có lợi vì mô hình này đủ linh hoạt để mở rộng sang các ngữ cảnh song ngữ hoặc đa ngữ trong tương lai.

Bên cạnh việc chọn backbone mạnh, bài toán còn đặt ra yêu cầu về thiết kế nhiệm vụ học. Nếu tách riêng một mô hình cho độ khó và một mô hình cho grammar tag, nhóm sẽ phải huấn luyện hai hệ thống độc lập, tăng chi phí tính toán và không tận dụng được mối liên hệ giữa hai nhiệm vụ. Trong khi đó, độ khó và ngữ pháp rõ ràng có quan hệ nội tại với nhau. Đây là lý do Multi-task Learning trở thành hướng tiếp cận trung tâm của đề tài.

### 1.3. Lí do chọn đề tài

Lý do thứ nhất là tính thực tiễn. CineFluent là một hệ thống học tiếng Anh lấy phim làm trung tâm, nên việc phân tích độ khó subtitle không phải một bài toán phụ mà là một nhu cầu nghiệp vụ thật. Kết quả của mô hình có thể tác động trực tiếp đến cách hệ thống hiển thị badge độ khó, cách quản trị viên phân loại phim và cách người học lựa chọn nội dung.

Lý do thứ hai là tính phù hợp về mặt kỹ thuật. Hai bài toán dự đoán độ khó và dự đoán ngữ pháp cùng sử dụng chung một đầu vào là văn bản subtitle. Điều này tạo điều kiện tốt để áp dụng kiến trúc chia sẻ encoder. Cách tiếp cận này vừa tận dụng được mối liên hệ giữa hai nhiệm vụ, vừa giảm chi phí suy luận khi triển khai.

Lý do thứ ba là khả năng triển khai sản phẩm. Nhiều đề tài AI chỉ dừng ở mức báo cáo metric trên notebook. Đề tài này được chọn vì có thể đi tiếp sang giai đoạn đóng gói model, xây dựng API, lưu database và hiển thị lên frontend. Đây là yếu tố giúp bài làm có chiều sâu ứng dụng và phù hợp với tinh thần đồ án công nghệ.

### 1.4. Mục tiêu đề tài

Mục tiêu tổng quát của đề tài là xây dựng một mô hình Multi-task Learning dựa trên XLM-RoBERTa để đồng thời dự đoán độ khó và ngữ pháp của subtitle phim, sau đó triển khai mô hình này vào hệ thống CineFluent nhằm hỗ trợ đánh giá độ khó ở mức câu và mức phim.

Từ mục tiêu tổng quát đó, đề tài đặt ra các mục tiêu cụ thể sau:

- Chuẩn hóa bộ dữ liệu subtitle phục vụ huấn luyện.
- Xây dựng cơ chế chuyển `difficulty_score` sang nhãn phân lớp.
- Huấn luyện mô hình đa nhiệm cho hai đầu ra `difficulty` và `grammar`.
- Đánh giá mô hình bằng các metric phù hợp như Accuracy và Macro F1.
- Xây dựng quy trình suy luận cho subtitle mới từ file `.srt` hoặc `.vtt`.
- Tổng hợp dự đoán mức subtitle thành các chỉ số ở mức phim.
- Tích hợp kết quả AI vào backend, database và giao diện người dùng.

### 1.5. Phạm vi đề tài

Đề tài chỉ tập trung vào module phân tích subtitle phim bằng AI. Cụ thể:

- Dữ liệu đầu vào là subtitle tiếng Anh.
- Nhãn độ khó được xây dựng từ `difficulty_score` trong khoảng 1.0 đến 3.0.
- Nhãn ngữ pháp được lấy từ `grammar_tag_primary`.
- Phần triển khai tập trung vào backend Flask, database MySQL và giao diện của CineFluent.
- Các module khác như shadowing, flashcard, roadmap hay chatbox chỉ được nhắc đến ở mức liên kết sử dụng kết quả AI.

### 1.6. Nội dung thực hiện và phương pháp

Do báo cáo tập trung chủ yếu vào quá trình huấn luyện mô hình, nhóm chia công việc thành hai phần chính: một người phụ trách chuẩn bị dữ liệu và tạo nhãn, người còn lại phụ trách xây dựng, huấn luyện và đánh giá mô hình.

#### 1.6.1. Người thực hiện 1: Phụ trách dữ liệu và tạo nhãn

- Nội dung thực hiện 1: Khảo sát và làm sạch dữ liệu subtitle.
  + Sử dụng phương pháp kiểm tra cấu trúc dữ liệu đầu vào để xác định các cột cần thiết cho quá trình huấn luyện.
  + Sử dụng phương pháp làm sạch dữ liệu bằng `pandas`, loại bỏ dòng rỗng, giá trị thiếu và chuẩn hóa nội dung subtitle.

- Nội dung thực hiện 2: Thiết kế nhãn cho hai nhiệm vụ học.
  + Sử dụng phương pháp chia `difficulty_score` thành 6 mức `bin_1` đến `bin_6` để tạo nhãn cho nhiệm vụ dự đoán độ khó.
  + Sử dụng phương pháp ánh xạ `grammar_tag_primary` sang `label id` để tạo nhãn cho nhiệm vụ dự đoán ngữ pháp.

- Nội dung thực hiện 3: Chuẩn bị dữ liệu cho mô hình.
  + Sử dụng phương pháp tokenization bằng `AutoTokenizer` của `XLM-RoBERTa` với `max_length = 128`.
  + Sử dụng phương pháp chia tập dữ liệu bằng `GroupShuffleSplit` theo `movie_id` để tạo tập train, validation và test.

#### 1.6.2. Người thực hiện 2: Phụ trách xây dựng và huấn luyện mô hình

- Nội dung thực hiện 1: Thiết kế mô hình Multi-task Learning với XLM-RoBERTa.
  + Sử dụng phương pháp học đa nhiệm với một encoder chung `XLM-RoBERTa` và hai nhánh phân loại cho `difficulty` và `grammar`.
  + Sử dụng phương pháp kết hợp hàm mất mát có trọng số để huấn luyện đồng thời hai nhiệm vụ.

- Nội dung thực hiện 2: Huấn luyện mô hình.
  + Sử dụng phương pháp huấn luyện với `Trainer` của Hugging Face và các siêu tham số như `learning_rate`, `batch_size`, `num_train_epochs`, `weight_decay`.
  + Sử dụng phương pháp lưu mô hình tốt nhất theo chỉ số `difficulty_f1_macro`.

- Nội dung thực hiện 3: Đánh giá và phân tích kết quả mô hình.
  + Sử dụng phương pháp đánh giá bằng các chỉ số `Accuracy`, `Macro F1` và `classification_report` trên tập validation và test.
  + Sử dụng phương pháp trực quan hóa kết quả để hỗ trợ nhận xét sau huấn luyện.

- Nội dung thực hiện 4: Chuẩn bị mô hình cho suy luận.
  + Sử dụng phương pháp lưu trọng số mô hình, tokenizer và file ánh xạ nhãn để phục vụ dự đoán trên dữ liệu mới.
  + Sử dụng phương pháp xây dựng hàm suy luận trên file subtitle `.srt` để kiểm tra khả năng áp dụng mô hình sau khi train.

Nhìn chung, phần công việc của hai thành viên đều bám vào quy trình huấn luyện mô hình từ chuẩn bị dữ liệu, tạo nhãn, xây dựng kiến trúc, huấn luyện, đánh giá cho đến chuẩn bị suy luận sau huấn luyện. Khi nộp báo cáo chính thức, nhóm có thể thay cụm từ "Người thực hiện 1" và "Người thực hiện 2" bằng tên thật của từng thành viên.

### 1.7. Cấu trúc báo cáo

Báo cáo được tổ chức thành bốn chương:

- Chương 1 trình bày tổng quan, bối cảnh, lý do chọn đề tài và mục tiêu thực hiện.
- Chương 2 trình bày cơ sở lý thuyết, từ bài toán subtitle đến Transformer, XLM-RoBERTa, Multi-task Learning và CEFR.
- Chương 3 tập trung vào thiết kế dữ liệu, tiền xử lý, nhãn, kiến trúc mô hình, huấn luyện và suy luận.
- Chương 4 trình bày môi trường thực nghiệm, đánh giá mô hình và quá trình triển khai vào hệ thống thực tế.

---

## CHƯƠNG 2: CƠ SỞ LÝ THUYẾT

### 2.1. Bài toán đánh giá độ khó và ngữ pháp của subtitle phim

Về bản chất, bài toán trong đề tài là một bài toán phân loại văn bản có giám sát. Mỗi subtitle sau khi được làm sạch được xem là một mẫu độc lập. Từ mẫu đó, hệ thống cần trả về hai loại thông tin. Thông tin thứ nhất là mức độ khó của subtitle, được lượng hóa thông qua các nhãn phân lớp xây dựng từ `difficulty_score`. Thông tin thứ hai là hiện tượng ngữ pháp chính xuất hiện trong subtitle đó. Cả hai đầu ra đều có giá trị riêng, nhưng chỉ thật sự phát huy ý nghĩa khi được đặt trong cùng một pipeline phân tích.

Khác với nhiều bài toán phân lớp câu thông thường, subtitle phim có một số đặc điểm riêng. Đây là dạng văn bản ngắn, gắn với hội thoại, nhiều câu rút gọn và mang tính khẩu ngữ mạnh. Một subtitle có thể không đầy đủ chủ ngữ, có thể bỏ bớt thành phần, hoặc mang hàm ý ngữ dụng phụ thuộc tình huống. Do đó, nếu chỉ nhìn bề mặt câu chữ thì rất khó đánh giá đúng độ khó. Ví dụ, một câu ngắn như “You gotta be kidding me” chứa cách nói rút gọn và sắc thái biểu cảm, nên có thể khó hơn một câu dài nhưng cấu trúc đơn giản.

Điều này dẫn đến một kết luận quan trọng: độ khó của subtitle không thể tách rời khỏi hiện tượng ngữ pháp và ngữ nghĩa. Một câu bị động, câu điều kiện, câu có mệnh đề quan hệ hoặc một câu dùng thành ngữ đời thường đều có thể làm tăng độ khó với người học. Vì vậy, việc đồng thời dự đoán grammar tag không chỉ là một nhiệm vụ phụ, mà còn là một cách tăng khả năng diễn giải cho đầu ra của mô hình.

### 2.2. Transformer và lý do chọn XLM-RoBERTa

Các mô hình tuần tự truyền thống như RNN, LSTM hay GRU từng được dùng nhiều trong xử lý ngôn ngữ tự nhiên, nhưng chúng có hạn chế về khả năng ghi nhớ phụ thuộc dài và khó song song hóa. Khi bài toán cần hiểu mối quan hệ giữa nhiều thành phần trong câu, đặc biệt là với dữ liệu ngôn ngữ có tính ngữ cảnh mạnh như subtitle, các mô hình này thường không còn là lựa chọn tối ưu. Transformer ra đời để giải quyết đúng điểm yếu đó bằng cơ chế self-attention.

Self-attention cho phép mô hình xem xét mọi token trong câu khi xây dựng biểu diễn cho từng token. Nhờ vậy, mô hình không còn bị ràng buộc bởi chiều đọc tuyến tính từ trái sang phải. Trong bài toán subtitle, điều này rất quan trọng vì để hiểu một hiện tượng ngữ pháp, mô hình phải nhìn được mối quan hệ giữa chủ ngữ, động từ, phủ định, mệnh đề phụ hoặc thành phần rút gọn. Multi-head attention còn cho phép mô hình học nhiều góc nhìn khác nhau của câu cùng lúc, chẳng hạn một head chú ý đến quan hệ cú pháp, trong khi head khác chú ý đến tín hiệu ngữ nghĩa hoặc cảm xúc hội thoại.

Từ nền tảng Transformer, họ mô hình BERT và RoBERTa đã chứng minh hiệu quả vượt trội ở các bài toán phân loại văn bản. XLM-RoBERTa là biến thể đa ngôn ngữ, kế thừa tinh thần của RoBERTa nhưng được pretrain trên tập dữ liệu cực lớn và sử dụng tokenization theo SentencePiece. Dù dữ liệu hiện tại chủ yếu là subtitle tiếng Anh, việc chọn `xlm-roberta-base` vẫn hợp lý vì mô hình này mạnh, ổn định, dễ fine-tune và có khả năng mở rộng sang các kịch bản đa ngôn ngữ trong tương lai. So với một mô hình quá lớn, bản `base` cân bằng hơn giữa chất lượng và chi phí huấn luyện, đặc biệt trong môi trường Colab và khi triển khai vào backend thật.

### 2.3. Multi-task Learning và ý nghĩa trong đề tài

Multi-task Learning là chiến lược huấn luyện một mô hình để giải nhiều nhiệm vụ cùng lúc, thay vì huấn luyện các mô hình độc lập. Trong thiết kế phổ biến gọi là `hard parameter sharing`, các nhiệm vụ dùng chung một encoder và chỉ tách riêng ở phần output head. Đề tài áp dụng đúng hướng này: XLM-RoBERTa đóng vai trò encoder dùng chung, sau đó tách thành một head cho phân loại độ khó và một head cho phân loại ngữ pháp.

Lợi ích của cách làm này đến từ chính bản chất của dữ liệu. Một subtitle khó thường có xu hướng gắn với cấu trúc ngữ pháp phức tạp hơn, trong khi những câu dễ thường thuộc về cấu trúc cơ bản và từ vựng quen thuộc hơn. Khi hai nhiệm vụ cùng học trên một biểu diễn chung, mô hình có thể khai thác tri thức bổ trợ lẫn nhau. Nói cách khác, nhiệm vụ grammar giúp encoder học được cấu trúc ngôn ngữ tinh hơn, còn nhiệm vụ difficulty giúp encoder nhạy hơn với mức độ dễ-khó của ngôn ngữ dùng trong subtitle.

Tất nhiên, Multi-task Learning cũng có thách thức. Nếu không cân bằng loss hợp lý, một nhiệm vụ có thể lấn át nhiệm vụ còn lại. Trong đề tài, nhóm chọn công thức:

`Loss = 0.6 * Loss_difficulty + 0.4 * Loss_grammar`

Việc ưu tiên nhánh difficulty nhiều hơn phản ánh đúng trọng tâm nghiệp vụ của sản phẩm, vì `movie_score` và `movie_level` là các đầu ra được sử dụng trực tiếp trên giao diện người dùng. Tuy nhiên, nhánh grammar vẫn đủ quan trọng để giúp mô hình học biểu diễn ngôn ngữ có chiều sâu hơn.

### 2.4. CEFR, độ khó và cách lượng hóa đầu ra

Trong hệ thống học ngoại ngữ, việc hiển thị một điểm số nội bộ thường không trực quan bằng việc ánh xạ nó sang một chuẩn quen thuộc. Vì lý do đó, đề tài không dừng lại ở `difficulty_score` hay `difficulty_bin`, mà còn xây dựng thêm lớp diễn giải ở mức `easy`, `medium`, `hard` và mức CEFR tương ứng. Cách ánh xạ được dùng trong code như sau:

| Khoảng điểm | Nhãn độ khó | CEFR |
| --- | --- | --- |
| `<= 1.60` | easy | A2 |
| `1.61 - 2.30` | medium | B1 |
| `> 2.30` | hard | B2 |

Ở mức kỹ thuật, mô hình không dự đoán trực tiếp một score liên tục mà dự đoán xác suất trên 6 bin độ khó. Sau đó, hệ thống dùng vector midpoint để quy đổi xác suất thành `pred_score`. Cách làm này kết hợp được ưu điểm của phân lớp và hồi quy. Mô hình được huấn luyện ổn định hơn vì giải một bài toán phân lớp, nhưng đầu ra cuối cùng vẫn có thể chuyển về dạng điểm liên tục để tiện tổng hợp thành `movie_score`.

Ý nghĩa của cách lượng hóa này rất rõ trong sản phẩm. Người dùng có thể thấy một bộ phim thuộc `Beginner`, `Intermediate` hay `Advanced`, đi kèm khoảng CEFR như `A2`, `B1` hoặc `B2`. Trong khi đó, quản trị viên vẫn có được score nội bộ và các tỷ lệ phân bố để theo dõi chi tiết hơn. Dù vậy, cần lưu ý rằng ánh xạ CEFR hiện tại vẫn mang tính thực dụng cho sản phẩm, chưa phải một hệ chuẩn hóa bởi giáo viên hoặc chuyên gia ngôn ngữ.

### 2.5. Các metric đánh giá và công nghệ hỗ trợ

Trong bài toán phân lớp, `Accuracy` là chỉ số dễ hiểu nhưng chưa đủ, đặc biệt khi dữ liệu có thể mất cân bằng giữa các lớp. Vì vậy, đề tài sử dụng thêm `macro F1` cho cả nhánh difficulty và grammar. Macro F1 có ưu điểm là tính trung bình F1 của từng lớp, không để các lớp xuất hiện nhiều lấn át hoàn toàn các lớp hiếm. Điều này quan trọng với cả 6 bin độ khó lẫn tập grammar tags, nơi số lượng mẫu giữa các lớp có thể chênh lệch khá mạnh.

Ngoài metric, một điểm quan trọng khác trong cơ sở phương pháp là cách chia dữ liệu bằng `GroupShuffleSplit` theo `movie_id`. Nếu chia ngẫu nhiên theo từng subtitle, cùng một phim có thể rơi vào cả train và test, làm kết quả đánh giá bị lạc quan giả tạo. Chia theo `movie_id` giúp đảm bảo mỗi phim chỉ nằm trong một tập duy nhất, từ đó phản ánh đúng hơn khả năng tổng quát hóa của mô hình trên phim mới.

Về mặt công nghệ, đề tài dựa trên các thư viện chính sau: `transformers` để dùng tokenizer, backbone model và Trainer API; `datasets` để quản lý tập dữ liệu và tokenization; `PyTorch` để xây dựng lớp mô hình đa nhiệm; `pandas`, `numpy`, `scikit-learn` để làm sạch dữ liệu và tính metric; `Flask`, `MySQL`, `Docker` để triển khai vào hệ thống thật. Tập hợp công nghệ này vừa đủ mạnh để phục vụ huấn luyện, vừa phù hợp với yêu cầu triển khai thực tế.

### 2.6. Tiểu kết chương 2

Chương 2 đã trình bày nền tảng lý thuyết của bài toán, từ đặc thù của subtitle phim, vai trò của Transformer và XLM-RoBERTa, cho đến hướng Multi-task Learning và cách lượng hóa đầu ra bằng score, CEFR và metric đánh giá. Từ góc nhìn phương pháp, các lựa chọn này cho thấy đề tài không xây dựng mô hình một cách ngẫu nhiên, mà dựa trên những cơ sở phù hợp với đặc điểm dữ liệu, mục tiêu sản phẩm và khả năng triển khai thực tế.

---

## CHƯƠNG 3: MÔ HÌNH LÝ THUYẾT

### 3.1. Mô tả dữ liệu và phân tích khám phá

Bộ dữ liệu huấn luyện được đưa vào dưới dạng file CSV và phải chứa tối thiểu các cột: `movie_id`, `movie_title`, `scene_id`, `duration`, `subtitle_text_clean`, `difficulty_score`, `grammar_tag_primary`. Đây là một cấu trúc dữ liệu rất phù hợp với bài toán vì nó vừa phục vụ huấn luyện ở mức subtitle, vừa hỗ trợ tổng hợp lên mức phim. `movie_id` đặc biệt quan trọng vì nó là chìa khóa để chia tập theo phim và tránh rò rỉ dữ liệu.

Trước khi huấn luyện, notebook thực hiện bước phân tích khám phá để trả lời các câu hỏi cơ bản: tổng số dòng dữ liệu là bao nhiêu, có bao nhiêu phim, phân bố các bin độ khó có cân bằng hay không, grammar tags nào xuất hiện nhiều nhất. Phần này có ý nghĩa rất lớn trong thực nghiệm vì nó cho biết bài toán có bị mất cân bằng lớp hay không, đồng thời giúp nhóm hiểu cấu trúc học liệu của hệ thống.

Bảng 3.1. Thống kê dữ liệu tổng quát

| Chỉ số | Giá trị |
| --- | --- |
| Số dòng sau làm sạch | `21.528` |
| Số phim | `16` |
| Số nhãn grammar | `4` |

Các giá trị trên được lấy trực tiếp từ output của notebook Colab sau bước làm sạch dữ liệu. Notebook hiện tại không in ra độ dài subtitle trung bình và thời lượng subtitle trung bình, vì vậy hai chỉ số này không được đưa vào bảng để tránh tự suy đoán ngoài kết quả thực nghiệm.

Bảng 3.2. Phân bố nhãn độ khó sau khi rời rạc hóa

| Difficulty bin | Số lượng mẫu |
| --- | --- |
| `bin_1` | `8.367` |
| `bin_2` | `1.855` |
| `bin_3` | `6.894` |
| `bin_4` | `2.362` |
| `bin_5` | `1.326` |
| `bin_6` | `724` |

Bảng 3.3. Phân bố nhãn ngữ pháp chính trong tập dữ liệu

| Grammar tag | Số lượng mẫu |
| --- | --- |
| `present_simple` | `16.780` |
| `question_form` | `3.860` |
| `conditional` | `727` |
| `imperative` | `161` |

[CHÈN HÌNH] Hình 3.1. Biểu đồ phân bố `difficulty_bin`.

[CHÈN HÌNH] Hình 3.2. Biểu đồ top 10 `grammar_tag_primary`.

Về mặt sư phạm, các biểu đồ này không chỉ phục vụ máy học. Nếu dữ liệu tập trung nhiều ở các bin đầu, hệ thống có thể có lợi thế khi xây dựng kho phim cho người mới. Nếu các grammar tags phức tạp xuất hiện dày, nhóm có thể dự đoán trước rằng một phần nội dung sẽ thiên về người học trình độ trung cấp hoặc cao hơn.

### 3.2. Tiền xử lý dữ liệu, xây dựng nhãn và chia tập

Sau khi đọc dữ liệu, notebook kiểm tra sự tồn tại của các cột bắt buộc. Nếu thiếu cột, chương trình dừng ngay bằng `ValueError`. Sau đó, các trường được chuẩn hóa kiểu dữ liệu: `subtitle_text_clean` về string và loại khoảng trắng thừa, `difficulty_score` và `duration` được ép sang numeric, còn `grammar_tag_primary` được đưa về lowercase để đồng nhất nhãn.

Nhóm loại bỏ tất cả các mẫu không hợp lệ, bao gồm subtitle rỗng, score không hợp lệ, duration không hợp lệ hoặc grammar tag rỗng. Tiếp theo, `difficulty_score` được giới hạn trong khoảng `[1.0, 3.0]`. Việc clip score giúp tránh ảnh hưởng của các giá trị ngoại lai và giữ tất cả mẫu trong không gian mà hệ thống binning đã định nghĩa.

Về thiết kế nhãn, đề tài không huấn luyện hồi quy trực tiếp mà chia `difficulty_score` thành 6 bin:

| ID | Tên bin | Low | High | Midpoint |
| --- | --- | --- | --- | --- |
| 0 | `bin_1` | 1.00 | 1.30 | 1.15 |
| 1 | `bin_2` | 1.31 | 1.60 | 1.46 |
| 2 | `bin_3` | 1.61 | 1.90 | 1.76 |
| 3 | `bin_4` | 1.91 | 2.20 | 2.05 |
| 4 | `bin_5` | 2.21 | 2.50 | 2.36 |
| 5 | `bin_6` | 2.51 | 3.00 | 2.75 |

Cách chia này giúp mô hình học chi tiết hơn ở vùng chuyển tiếp giữa dễ và khó. Đồng thời, việc lưu midpoint cho từng bin cho phép nhóm quy đổi xác suất dự đoán trở lại thành `pred_score` ở giai đoạn suy luận.

Đối với grammar, nhóm lấy tất cả các giá trị duy nhất trong `grammar_tag_primary`, sắp xếp tăng dần rồi tạo `GRAMMAR_LABEL_TO_ID` và `GRAMMAR_ID_TO_LABEL`. Cách làm này đơn giản, rõ ràng và đủ tốt cho bài toán single-label classification. Tuy nhiên, nó cũng có một giới hạn là một subtitle chỉ được xem như có một hiện tượng ngữ pháp chính, trong khi thực tế có thể có nhiều hiện tượng cùng lúc.

Khâu chia dữ liệu là một điểm phương pháp quan trọng của đề tài. Thay vì chia ngẫu nhiên từng dòng, nhóm dùng `GroupShuffleSplit` với `movie_id` làm group. Quy trình gồm hai bước: chia `train_valid` và `test` theo tỷ lệ `80/20`, sau đó chia tiếp `train` và `validation` trong phần còn lại theo tỷ lệ `80/20`. Như vậy, tỷ lệ xấp xỉ cuối cùng là 64% train, 16% validation và 20% test. Việc chia theo phim giúp đảm bảo một phim chỉ xuất hiện trong đúng một tập, tránh việc mô hình vô tình học phong cách lời thoại của phim đã thấy từ trước.

Bảng 3.4. Kết quả chia dữ liệu theo `movie_id`

| Tập dữ liệu | Số subtitle | Số phim |
| --- | --- | --- |
| Train | `12.987` | `9` |
| Validation | `3.471` | `3` |
| Test | `5.070` | `4` |

[CHÈN HÌNH] Hình 3.3. Biểu đồ kích thước train, validation và test.

### 3.3. Thiết kế mô hình XLM-RoBERTa đa nhiệm

Sau bước chuẩn hóa dữ liệu, nhóm chuyển `train_df`, `valid_df` và `test_df` sang `datasets.Dataset`, chỉ giữ các trường cần thiết là `subtitle_text_clean`, `labels_difficulty` và `labels_grammar`. Tokenizer được khởi tạo bằng:

`AutoTokenizer.from_pretrained("FacebookAI/xlm-roberta-base")`

Mỗi subtitle được tokenize với `truncation=True` và `max_length=128`. Việc dùng `DataCollatorWithPadding` giúp hệ thống pad động theo batch, tiết kiệm bộ nhớ hơn so với việc pad toàn bộ dữ liệu lên cùng một chiều dài cố định.

Kiến trúc mô hình được định nghĩa trong lớp `XLMRMultiTaskModel`. Phần encoder chung là `AutoModel.from_pretrained(model_name)`, tức backbone `xlm-roberta-base`. Từ output của encoder, nhóm lấy vector tại token đầu tiên `last_hidden_state[:, 0]` như một biểu diễn tóm tắt cho toàn câu. Vector này đi qua một lớp `Dropout`, sau đó tách thành hai nhánh:

- `difficulty_head` là một lớp `Linear` với số chiều đầu ra bằng 6.
- `grammar_head` là một lớp `Linear` với số chiều đầu ra bằng số grammar tags trong dữ liệu.

Hai nhánh đều sử dụng `CrossEntropyLoss`, sau đó gộp lại thành loss tổng:

`loss = 0.6 * loss_diff + 0.4 * loss_gram`

Thiết kế này mang đúng tinh thần `hard parameter sharing`. Toàn bộ khả năng hiểu ngôn ngữ của mô hình nằm ở encoder chung. Hai head chỉ đóng vai trò chuyển biểu diễn ẩn đó thành đầu ra riêng cho từng nhiệm vụ. Ưu điểm của cách làm này là giảm số tham số, tận dụng mối liên hệ giữa hai nhiệm vụ và giảm chi phí suy luận khi triển khai thực tế.

![Hình 3.4. Sơ đồ kiến trúc mô hình Multi-task Learning với XLM-RoBERTa](./hinh-3-4-kien-truc-xlmr-multitask.svg)

Nguồn Mermaid để chỉnh sửa sơ đồ: `docs/hinh-3-4-kien-truc-xlmr-multitask.mmd`.

Hình 3.4. Sơ đồ kiến trúc mô hình Multi-task Learning với XLM-RoBERTa.

### 3.4. Cấu hình huấn luyện và quy trình đánh giá

Phần huấn luyện được xây dựng dựa trên `TrainingArguments` và `Trainer` của Hugging Face. Các tham số chính gồm:

| Tham số | Giá trị |
| --- | --- |
| Learning rate | `2e-5` |
| Batch size train | `8` |
| Batch size eval | `8` |
| Số epoch | `3` |
| Weight decay | `0.01` |
| Eval strategy | `epoch` |
| Save strategy | `epoch` |
| `metric_for_best_model` | `difficulty_f1_macro` |
| Seed | `42` |

Learning rate `2e-5` là mức khá tiêu chuẩn cho fine-tune Transformer cỡ base. Số epoch là `3`, đủ để mô hình thích nghi với nhiệm vụ mới mà chưa đi quá sâu vào nguy cơ overfitting. Việc dùng `weight_decay = 0.01` giúp regularization tốt hơn, còn `load_best_model_at_end = True` đảm bảo checkpoint tốt nhất theo `difficulty_f1_macro` được dùng cho suy luận.

Hàm `compute_metrics` là phần quan trọng trong quá trình đánh giá. Từ `difficulty_logits` và `grammar_logits`, nhóm lấy `argmax` để thu được nhãn dự đoán, rồi tính bốn chỉ số:

- `difficulty_accuracy`
- `difficulty_f1_macro`
- `grammar_accuracy`
- `grammar_f1_macro`

Việc theo dõi tách biệt hai nhánh giúp nhóm đánh giá được nhánh nào đang học tốt hơn, nhánh nào có nguy cơ bị yếu do dữ liệu hoặc do thiết kế loss. Sau khi train xong, nhóm gọi `trainer.evaluate()` trên validation và test, đồng thời tạo `classification_report` để phân tích chi tiết hơn theo từng lớp.

### 3.5. Quy trình suy luận và tổng hợp kết quả mức phim

Sau khi huấn luyện xong, đề tài không dừng ở việc đo metric mà tiếp tục xây dựng quy trình suy luận cho subtitle mới. Trong notebook demo, nhóm upload file `.srt`, dùng các hàm parse để tách từng segment, chuyển mốc thời gian sang giây và làm sạch text. Logic làm sạch này tương tự logic dùng trong backend, bao gồm bỏ HTML, ký hiệu kỹ thuật, phần mô tả trong ngoặc và chuẩn hóa khoảng trắng. Việc thống nhất cách làm sạch giữa train và infer là điều rất quan trọng để tránh lệch phân phối dữ liệu.

Sau khi có `infer_ds`, nhóm dùng `trainer.predict(infer_ds)` để lấy `difficulty_logits` và `grammar_logits`. Từ đó, hệ thống tính `difficulty_probs` và `grammar_probs` bằng softmax. Điểm dự đoán liên tục được tạo bởi:

`pred_score = difficulty_probs @ MIDPOINT_VECTOR`

Sau đó, `pred_score` tiếp tục được ánh xạ sang `pred_label` (`easy`, `medium`, `hard`) và `pred_cefr` (`A2`, `B1`, `B2`). Đồng thời, nhãn grammar có xác suất cao nhất được chọn làm `pred_grammar_tag`. Hệ thống cũng lưu `difficulty_confidence` và `grammar_confidence` để phục vụ việc sắp xếp hoặc diễn giải mức độ tin cậy.

Từ tất cả các subtitle của một phim, hệ thống tính `movie_score` bằng trung bình có trọng số theo `duration`. Cách làm này hợp lý hơn trung bình đơn giản vì một subtitle xuất hiện lâu trên màn hình thường có giá trị tiếp xúc lớn hơn với người học. Sau khi có `movie_score`, hệ thống tiếp tục suy ra:

- `movie_level` theo ba mức `Beginner`, `Intermediate`, `Advanced`.
- `movie_cefr_range` dựa trên tỷ lệ xuất hiện của các nhãn CEFR.
- `difficulty_ratios` là tỷ lệ `easy`, `medium`, `hard`.
- `dominant_grammar_tags` là ba grammar tags nổi bật nhất.
- `top_hard_segments` là các subtitle khó nhất theo score và độ tin cậy.

Cuối cùng, mô hình được lưu thành bundle gồm `multitask_model.pt`, tokenizer, `score_bins.json` và `grammar_label_map.json`. Việc lưu đầy đủ các file này là điều kiện cần để backend có thể tái tạo đúng pipeline suy luận trong môi trường sản phẩm.

### 3.6. Tiểu kết chương 3

Chương 3 đã trình bày toàn bộ phần thiết kế của đề tài, từ dữ liệu, tiền xử lý, xây dựng nhãn, chia tập, mô hình, huấn luyện cho đến suy luận và tổng hợp kết quả ở mức phim. Điểm quan trọng nhất là mọi thành phần trong pipeline đều được thiết kế để vừa phục vụ huấn luyện trên notebook, vừa có thể chuyển sang môi trường backend thật mà không phải viết lại tư duy từ đầu.

---

## CHƯƠNG 4: TRIỂN KHAI VÀ THỰC NGHIỆM MÔ HÌNH

### 4.1. Môi trường thực nghiệm

Quá trình huấn luyện được thực hiện trên Google Colab. Đây là môi trường phù hợp vì hỗ trợ notebook, dễ cài đặt thư viện và đủ thuận tiện để thử nghiệm nhiều lần với mô hình Transformer. Metadata của notebook cho thấy phiên chạy được thực hiện với GPU `T4`, phù hợp với nhu cầu fine-tune `xlm-roberta-base` trong bối cảnh đồ án sinh viên. Trong notebook, nhóm cố định các phiên bản thư viện chính:

- `transformers==4.57.1`
- `tokenizers>=0.22,<0.23`
- `huggingface_hub>=0.34,<1.0`
- `accelerate>=1.0,<2.0`
- `datasets>=3.0,<4.0`
- `sentencepiece`

Việc khóa phiên bản giúp giảm rủi ro do thay đổi API trong quá trình huấn luyện và đảm bảo notebook có tính tái lập tốt hơn. Ngoài ra, nhóm đặt `SEED = 42` cho `random`, `numpy`, `torch` và `torch.cuda` để làm cho quá trình thực nghiệm ổn định hơn giữa các lần chạy.

Sau huấn luyện, mô hình được triển khai trong hệ thống CineFluent có kiến trúc gồm backend Flask, frontend Next.js, database MySQL, reverse proxy Nginx và đóng gói bằng Docker Compose. Trong Dockerfile backend, model bundle được copy vào thư mục:

`/app/ai_models/movie_difficulty_multitask`

Đây là điểm cho thấy đề tài không chỉ dừng ở mức notebook mà đã được tính đến bài toán vận hành trong môi trường ứng dụng thật.

Bảng 4.1. Môi trường thực nghiệm và triển khai

| Thành phần | Môi trường | Ghi chú |
| --- | --- | --- |
| Huấn luyện | Google Colab | Notebook Python |
| GPU huấn luyện | NVIDIA T4 | Theo metadata của notebook |
| Backbone | `FacebookAI/xlm-roberta-base` | Mô hình encoder |
| Framework | PyTorch, Transformers | Huấn luyện và suy luận |
| Backend | Flask | API AI và nghiệp vụ |
| Database | MySQL | Lưu kết quả movie AI |
| Đóng gói | Docker, Docker Compose | Triển khai đồng nhất |

### 4.2. Kết quả huấn luyện và đánh giá mô hình

Sau khi huấn luyện, mô hình được đánh giá trên validation set và test set bằng `trainer.evaluate()`. Các số liệu dưới đây được trích trực tiếp từ output của notebook Colab mà nhóm dùng để huấn luyện mô hình:

Bảng 4.2. Kết quả trên validation

| Metric | Giá trị |
| --- | --- |
| `valid_difficulty_accuracy` | `0.8297` |
| `valid_difficulty_f1_macro` | `0.6580` |
| `valid_grammar_accuracy` | `0.9870` |
| `valid_grammar_f1_macro` | `0.9111` |

Bảng 4.3. Kết quả trên test

| Metric | Giá trị |
| --- | --- |
| `test_difficulty_accuracy` | `0.7730` |
| `test_difficulty_f1_macro` | `0.5858` |
| `test_grammar_accuracy` | `0.9791` |
| `test_grammar_f1_macro` | `0.8070` |

[CHÈN HÌNH] Hình 4.1. Biểu đồ kết quả đánh giá trên tập test.

Ngoài các chỉ số tổng quát, notebook còn sinh `classification_report` cho cả hai nhiệm vụ. Kết quả này có giá trị hơn việc chỉ nhìn accuracy vì nó cho thấy cụ thể mô hình mạnh ở lớp nào và còn yếu ở lớp nào.

Bảng 4.4. F1-score theo từng nhãn difficulty trên tập test

| Nhãn difficulty | Support | F1-score |
| --- | --- | --- |
| `bin_1` | `1.377` | `0.9371` |
| `bin_2` | `215` | `0.2049` |
| `bin_3` | `2.054` | `0.8539` |
| `bin_4` | `681` | `0.5851` |
| `bin_5` | `479` | `0.3683` |
| `bin_6` | `264` | `0.5656` |

Bảng 4.5. F1-score theo từng nhãn grammar trên tập test

| Nhãn grammar | Support | F1-score |
| --- | --- | --- |
| `conditional` | `224` | `0.7575` |
| `imperative` | `22` | `0.4848` |
| `present_simple` | `3.725` | `0.9861` |
| `question_form` | `1.099` | `0.9995` |

Về mặt diễn giải kết quả, `difficulty_f1_macro` là chỉ số quan trọng nhất của đề tài. Nếu chỉ nhìn accuracy, mô hình có thể đạt vẻ ngoài tốt nhưng thực ra vẫn bỏ quên các lớp ít mẫu. Macro F1 giúp đánh giá công bằng hơn giữa các mức độ khó, đặc biệt trong bối cảnh dữ liệu subtitle không chắc cân bằng đều trên 6 bin.

Quan sát kết quả thực tế cho thấy nhánh grammar học tốt hơn hẳn nhánh difficulty. Trên validation, `grammar_f1_macro = 0.9111`, còn `difficulty_f1_macro = 0.6580`. Trên test, khoảng cách này vẫn giữ nguyên xu hướng với `0.8070` so với `0.5858`. Điều đó phù hợp với bản chất bài toán: grammar là nhận diện một hiện tượng chính, còn difficulty là khái niệm tổng hợp chịu tác động đồng thời của từ vựng, ngữ pháp, tải nghe và ngữ cảnh.

### 4.3. Phân tích lỗi và nhận xét kết quả

Từ kết quả `classification_report`, có thể thấy một số điểm rất rõ trong hành vi của mô hình. Ở nhánh difficulty, mô hình dự đoán rất tốt cho `bin_1` với F1 là `0.9371` và `bin_3` với F1 là `0.8539`. Ngược lại, hai lớp `bin_2` và `bin_5` có kết quả thấp hơn đáng kể, lần lượt chỉ đạt `0.2049` và `0.3683`. Đây là dấu hiệu cho thấy mô hình gặp khó ở các vùng chuyển tiếp giữa những mức độ gần nhau, tức các subtitle không quá dễ nhưng cũng chưa thật sự khó thường dễ bị nhầm lẫn.

Ở nhánh grammar, mô hình đạt kết quả rất cao với `present_simple` và `question_form`, lần lượt có F1 là `0.9861` và `0.9995`. Tuy nhiên, lớp `imperative` chỉ có `22` mẫu trong tập test và đạt F1 `0.4848`, thấp hơn rõ rệt so với các lớp còn lại. Điều này cho thấy chất lượng mô hình không chỉ phụ thuộc vào kiến trúc XLM-RoBERTa hay Multi-task Learning, mà còn phụ thuộc rất mạnh vào mức cân bằng dữ liệu giữa các nhãn. Khi một nhãn có quá ít mẫu, mô hình khó học được ranh giới đủ ổn định để tổng quát hóa.

Từ bản chất dữ liệu subtitle, có thể dự đoán thêm một số dạng lỗi điển hình. Nhóm thứ nhất là các câu rất ngắn nhưng khó vì chứa thành ngữ, tiếng lóng, cấu trúc rút gọn hoặc sắc thái hội thoại mạnh. Những câu này dễ bị đánh giá thấp độ khó nếu mô hình quá phụ thuộc vào tín hiệu độ dài bề mặt. Nhóm thứ hai là các câu dài nhưng lại có cấu trúc đơn giản và từ vựng phổ thông; nếu mô hình nhìn quá nhiều vào độ dài, nó có thể đẩy các câu này lên mức khó cao hơn thực tế. Ngoài ra, việc mỗi subtitle chỉ có một `grammar_tag_primary` cũng tạo ra giới hạn vì trong thực tế một câu có thể đồng thời chứa nhiều hiện tượng ngữ pháp.

Nhìn tổng thể, nếu kết quả validation và test không chênh lệch quá xa, có thể xem đó là dấu hiệu tốt về khả năng tổng quát hóa. Đặc biệt, việc chia tập theo `movie_id` làm bài toán khó hơn, nên nếu mô hình vẫn đạt kết quả ổn định thì đây là một điểm mạnh đáng nêu trong phần nhận xét.

### 4.4. Triển khai mô hình vào hệ thống CineFluent

Điểm mạnh lớn nhất của chuyên đề nằm ở chỗ mô hình đã được đưa vào hệ thống thật thay vì chỉ dừng ở notebook. Phần trung tâm của backend nằm trong file `server/be_flask_cinefluent/app/services/movie_ai_service.py`. Service này chịu trách nhiệm tìm model bundle, kiểm tra các file bắt buộc, load tokenizer, khởi tạo lại kiến trúc XLM-RoBERTa đa nhiệm, nạp `state_dict`, thực hiện suy luận theo batch và hậu xử lý đầu ra.

Model bundle mà backend yêu cầu gồm các file:

- `multitask_model.pt`
- `tokenizer.json`
- `tokenizer_config.json`
- `score_bins.json`
- `grammar_label_map.json`

Việc lưu và nạp đủ các file trên là rất quan trọng. Nếu thiếu `score_bins.json`, backend không thể tái tạo `pred_score`; nếu thiếu `grammar_label_map.json`, backend không thể giải mã đúng nhãn grammar; nếu chỉ có trọng số mà không có tokenizer, pipeline suy luận sẽ không còn tương thích với lúc huấn luyện.

Backend hiện có hai luồng chính. Luồng thứ nhất là API demo chung trong `ai_controller.py` với endpoint:

`POST /api/ai/movie-difficulty/predict`

API này cho phép gửi file `.srt`, `.vtt` hoặc raw subtitle text để nhận về báo cáo tổng hợp, rất hữu ích cho việc demo với giảng viên hoặc kiểm thử nhanh. Luồng thứ hai là API nghiệp vụ trong `video_controller.py` với endpoint:

`POST /api/videos/{video_id}/ai-analysis`

Endpoint này được dùng khi admin đã upload subtitle tiếng Anh cho một phim. Backend lấy toàn bộ subtitle của phim, chạy suy luận bất đồng bộ và lưu kết quả vào bảng `movie_ai_analyses`. Thiết kế bất đồng bộ là một quyết định hợp lý vì phân tích cả phim có thể mất thời gian, đặc biệt với phim dài và có nhiều segment.

Về mặt dữ liệu, migration `6f4c1b2d9a10_add_movie_ai_analyses_table.py` tạo bảng `movie_ai_analyses` với các trường quan trọng như `movie_score`, `movie_level`, `movie_cefr_range`, `difficulty_ratios`, `cefr_ratios`, `dominant_grammar_tags`, `top_hard_segments`, `status`, `error_message`. Quan hệ giữa `videos` và `movie_ai_analyses` là quan hệ 1:1, giúp mỗi phim giữ một bản phân tích AI có thể tái sử dụng nhiều lần mà không cần chạy lại model mỗi khi người dùng mở trang.

Phần frontend cũng đã được tích hợp đầy đủ. Ở giao diện admin, modal subtitle có nút `Phân tích độ khó phim`, đồng thời có màn hình hiển thị `AI Movie Analysis` để xem `movie_score`, `movie_cefr_range`, `segment_count`, các grammar tags nổi bật và các subtitle khó tiêu biểu. Ở giao diện người học, hệ thống có `MovieDifficultyBadge` và `MovieAIAnalysisCard` để hiển thị mức độ phim, score và các thông tin AI liên quan. Điều này cho thấy mô hình đã đi trọn vòng từ dữ liệu, backend đến giao diện.

[CHÈN HÌNH] Hình 4.2. Giao diện admin bấm `Phân tích độ khó phim`.

[CHÈN HÌNH] Hình 4.3. Giao diện xem `AI Movie Analysis` trên trang admin.

[CHÈN HÌNH] Hình 4.4. `MovieDifficultyBadge` trên giao diện người học.

Ngoài ra, hệ thống còn có script:

`server/be_flask_cinefluent/scripts/sync_movie_ai_analyses.py`

Script này hỗ trợ phân tích lại hàng loạt phim đã có subtitle, chỉ xử lý phim còn thiếu kết quả AI hoặc xử lý lại các phim ở trạng thái `FAILED`. Đây là một chi tiết nhỏ nhưng có ý nghĩa lớn về vận hành, vì nó chứng minh mô hình được thiết kế để phục vụ sản phẩm thật chứ không chỉ để chạy demo một lần.

### 4.5. Giá trị thực tiễn, hạn chế và hướng phát triển

Về giá trị thực tiễn, module này mang lại lợi ích rõ ràng cho cả ba đối tượng. Với quản trị viên, hệ thống có thêm công cụ để phân loại phim, hiểu nhanh mức độ khó và các điểm ngữ pháp nổi bật trong subtitle. Với người học, kết quả AI giúp họ chọn phim phù hợp với trình độ và chuẩn bị tốt hơn trước khi xem. Với chính hệ thống, dữ liệu phân tích AI trở thành một lớp metadata có thể tái sử dụng trong nhiều luồng, từ giao diện xem phim đến các tính năng AI khác.

Về ưu điểm kỹ thuật, giải pháp hiện tại có nhiều điểm mạnh. Thứ nhất, đề tài dùng một backbone đủ mạnh và phù hợp là `xlm-roberta-base`. Thứ hai, kiến trúc Multi-task Learning tận dụng được mối liên hệ giữa độ khó và ngữ pháp. Thứ ba, dữ liệu được chia theo `movie_id`, tránh rò rỉ. Thứ tư, kết quả không dừng ở một nhãn cứng mà còn được quy đổi sang score, CEFR và mức phim. Thứ năm, mô hình đã được triển khai hoàn chỉnh vào backend, database và frontend.

Tuy nhiên, hệ thống hiện tại vẫn còn những giới hạn cần nêu rõ. Đề tài chưa có phần so sánh trực tiếp với nhiều baseline khác như RoBERTa đơn nhiệm, Logistic Regression hay các mô hình nhẹ hơn cho production. Grammar hiện mới được thiết kế theo dạng single-label. `MAX_LENGTH = 128` có thể chưa tối ưu với một số subtitle dài. Quan trọng hơn, chất lượng cuối cùng vẫn phụ thuộc mạnh vào chất lượng nhãn `difficulty_score` và `grammar_tag_primary`.

Trong tương lai, nhóm có thể phát triển theo ba hướng. Hướng thứ nhất là dữ liệu: mở rộng bộ dữ liệu, chuẩn hóa quy trình gán nhãn và cân nhắc multi-label grammar. Hướng thứ hai là mô hình: thử thêm class weights, focal loss, dynamic loss weighting hoặc so sánh với các backbone khác. Hướng thứ ba là triển khai: thêm logging chi tiết, dashboard theo dõi chất lượng AI, versioning model bundle và cơ chế batch job định kỳ để cập nhật phân tích cho kho phim.

### 4.6. Tiểu kết chương 4

Chương 4 đã cho thấy toàn bộ vòng đời thực nghiệm và triển khai của mô hình, từ môi trường Colab đến hệ thống CineFluent thật. Giá trị của đề tài không chỉ nằm ở các metric huấn luyện mà còn nằm ở việc biến kết quả đó thành một thành phần dịch vụ thật, có database, có API, có giao diện và có khả năng vận hành trên nhiều phim. Đây chính là phần giúp chuyên đề có chiều sâu ứng dụng rõ ràng và khác với một bài thử nghiệm AI thuần túy.

---

## KẾT LUẬN

Đề tài đã xây dựng thành công một mô hình Multi-task Learning dựa trên XLM-RoBERTa để đồng thời dự đoán độ khó và ngữ pháp của subtitle phim. Bằng cách tổ chức dữ liệu theo `movie_id`, thiết kế nhãn độ khó theo 6 bin, huấn luyện trên kiến trúc chia sẻ encoder và hậu xử lý đầu ra thành score cùng CEFR, đề tài đã tạo ra một pipeline khá hoàn chỉnh từ mức học máy đến mức thông tin có giá trị cho sản phẩm.

Điểm đáng giá nhất của chuyên đề là sự gắn kết giữa nghiên cứu AI và triển khai phần mềm. Mô hình không chỉ đạt kết quả trên notebook mà còn được đóng gói, nạp trong backend Flask, lưu kết quả vào bảng `movie_ai_analyses` và hiển thị trên giao diện admin lẫn người học trong CineFluent. Điều đó cho thấy chuyên đề đã đi trọn vòng từ ý tưởng, dữ liệu, mô hình, đánh giá đến ứng dụng thật.

Trong tương lai, nếu tiếp tục mở rộng dữ liệu và tối ưu thêm kiến trúc, module này có thể trở thành một thành phần nền cho việc gợi ý học liệu, cá nhân hóa lộ trình học và hỗ trợ nhiều tính năng AI sâu hơn trong hệ thống. Đây là hướng phát triển phù hợp với mục tiêu xây dựng một nền tảng học tiếng Anh thông minh, lấy phim làm trung tâm nhưng có khả năng phân tích ngôn ngữ một cách có cấu trúc và có giá trị sử dụng thật.

---

## DANH MỤC TÀI LIỆU THAM KHẢO

[1] A. Conneau et al., “Unsupervised Cross-lingual Representation Learning at Scale,” in *Proc. 58th Annu. Meeting Assoc. Comput. Linguistics (ACL)*, Online, Jul. 2020, pp. 8440–8451, doi: 10.18653/v1/2020.acl-main.747.

[2] R. Caruana, “Multitask Learning,” *Machine Learning*, vol. 28, pp. 41–75, Jul. 1997, doi: 10.1023/A:1007379606734.

[3] A. Vaswani et al., “Attention Is All You Need,” in *Advances in Neural Information Processing Systems*, vol. 30, 2017. [Online]. Available: https://proceedings.neurips.cc/paper/2017/hash/3f5ee243547dee91fbd053c1c4a845aa-Abstract.html

[4] J. Devlin, M.-W. Chang, K. Lee, and K. Toutanova, “BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding,” in *Proc. 2019 Conf. North American Chapter of the Assoc. for Computational Linguistics: Human Language Technologies, Volume 1 (Long and Short Papers)*, Minneapolis, MN, USA, Jun. 2019, pp. 4171–4186, doi: 10.18653/v1/N19-1423.

[5] Y. Liu et al., “RoBERTa: A Robustly Optimized BERT Pretraining Approach,” *arXiv preprint* arXiv:1907.11692, Jul. 2019. [Online]. Available: https://arxiv.org/abs/1907.11692

[6] T. Kudo and J. Richardson, “SentencePiece: A simple and language independent subword tokenizer and detokenizer for Neural Text Processing,” in *Proc. 2018 Conf. Empirical Methods in Natural Language Processing: System Demonstrations*, Brussels, Belgium, Nov. 2018, pp. 66–71, doi: 10.18653/v1/D18-2012.

[7] T. Wolf et al., “Transformers: State-of-the-Art Natural Language Processing,” in *Proc. 2020 Conf. Empirical Methods in Natural Language Processing: System Demonstrations*, Online, Oct. 2020, pp. 38–45, doi: 10.18653/v1/2020.emnlp-demos.6.

[8] Q. Lhoest et al., “Datasets: A Community Library for Natural Language Processing,” in *Proc. 2021 Conf. Empirical Methods in Natural Language Processing: System Demonstrations*, Online and Punta Cana, Dominican Republic, Nov. 2021, pp. 175–184, doi: 10.18653/v1/2021.emnlp-demo.21.

[9] A. Paszke et al., “PyTorch: An Imperative Style, High-Performance Deep Learning Library,” in *Advances in Neural Information Processing Systems*, vol. 32, 2019. [Online]. Available: https://papers.nips.cc/paper/9015-pytorch-an-imperative-style-high-performance-deep-learning-library

[10] Council of Europe, *Common European Framework of Reference for Languages: Learning, Teaching, Assessment – Companion Volume*, 2020. [Online]. Available: https://book.coe.int/en/education-and-modern-languages/8152-common-european-framework-of-reference-for-languages-learning-teaching-assessment-companion-volume.html. [Accessed: Apr. 16, 2026].

[11] Hugging Face, “XLM-RoBERTa,” *Transformers Documentation*. [Online]. Available: https://huggingface.co/docs/transformers/model_doc/xlm-roberta. [Accessed: Apr. 16, 2026].

[12] Hugging Face, “Auto Classes (AutoTokenizer),” *Transformers Documentation*, ver. 4.57.1. [Online]. Available: https://huggingface.co/docs/transformers/v4.57.1/en/model_doc/auto. [Accessed: Apr. 16, 2026].

[13] Hugging Face, “Data Collator (DataCollatorWithPadding),” *Transformers Documentation*, ver. 4.57.1. [Online]. Available: https://huggingface.co/docs/transformers/v4.57.1/en/main_classes/data_collator. [Accessed: Apr. 16, 2026].

[14] Hugging Face, “Trainer,” *Transformers Documentation*, ver. 4.57.1. [Online]. Available: https://huggingface.co/docs/transformers/v4.57.1/en/main_classes/trainer. [Accessed: Apr. 16, 2026].

[15] Facebook AI and Hugging Face, “FacebookAI/xlm-roberta-base,” *Model Card*. [Online]. Available: https://huggingface.co/FacebookAI/xlm-roberta-base. [Accessed: Apr. 16, 2026].

[16] PyTorch, “CrossEntropyLoss,” *PyTorch Documentation*. [Online]. Available: https://docs.pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html. [Accessed: Apr. 16, 2026].

[17] scikit-learn developers, “GroupShuffleSplit,” *scikit-learn Documentation*. [Online]. Available: https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.GroupShuffleSplit.html. [Accessed: Apr. 16, 2026].

[18] scikit-learn developers, “accuracy_score,” *scikit-learn Documentation*. [Online]. Available: https://scikit-learn.org/stable/modules/generated/sklearn.metrics.accuracy_score.html. [Accessed: Apr. 16, 2026].

[19] scikit-learn developers, “f1_score,” *scikit-learn Documentation*. [Online]. Available: https://scikit-learn.org/stable/modules/generated/sklearn.metrics.f1_score.html. [Accessed: Apr. 16, 2026].

[20] scikit-learn developers, “classification_report,” *scikit-learn Documentation*. [Online]. Available: https://scikit-learn.org/stable/modules/generated/sklearn.metrics.classification_report.html. [Accessed: Apr. 16, 2026].

---

## PHỤ LỤC

### Phụ lục A. Link Colab huấn luyện

`https://colab.research.google.com/drive/1KRaYAJP4i95Xdr7iWBJ0SgaRmTXNmrqy?usp=sharing`

### Phụ lục B. Các file code liên quan trong dự án

- `server/be_flask_cinefluent/app/services/movie_ai_service.py`
- `server/be_flask_cinefluent/app/controller/ai_controller.py`
- `server/be_flask_cinefluent/app/controller/video_controller.py`
- `server/be_flask_cinefluent/app/models/models_model.py`
- `server/be_flask_cinefluent/app/schemas/video_schema.py`
- `server/be_flask_cinefluent/migrations/versions/6f4c1b2d9a10_add_movie_ai_analyses_table.py`
- `server/be_flask_cinefluent/scripts/sync_movie_ai_analyses.py`
- `client/Fe_CineFluent/app/components/admin/admin_subtitles_modal/index.tsx`
- `client/Fe_CineFluent/app/components/admin/admin_video_ai_modal/index.tsx`
- `client/Fe_CineFluent/app/components/movies/MovieAIAnalysisCard.tsx`
- `client/Fe_CineFluent/app/components/movies/MovieDifficultyBadge.tsx`

### Phụ lục C. Các bảng và hình nên bổ sung từ Colab

- Bảng thống kê số dòng dữ liệu và số phim.
- Bảng phân bố 6 bin độ khó.
- Bảng top grammar tags.
- Bảng metric validation.
- Bảng metric test.
- Classification report cho difficulty.
- Classification report rút gọn cho grammar.
- Ảnh biểu đồ `difficulty_bin`.
- Ảnh biểu đồ top grammar tags.
- Ảnh biểu đồ kích thước train/validation/test.
- Ảnh giao diện admin và giao diện người học có hiển thị kết quả AI.
