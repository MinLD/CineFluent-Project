# Product-RAG Roadmap Cho CineFluent

## 1. Ket luan kien truc

CineFluent nen di theo huong `Hybrid Product-RAG`:

1. `DB Runtime Context`
- dung cho du lieu dong cua user
- query truc tiep tu SQLAlchemy / service

2. `RAG Knowledge Base`
- dung cho tri thuc tinh cua san pham
- FAQ, playbook, huong dan dung tinh nang, troubleshooting

3. `Gemini 2.5 Flash`
- la model sinh cau tra loi
- khong dong vai tro "bo nho"

## 2. Nhung gi khong nen lam

1. Khong dua toan bo subtitle vao vector DB.
2. Khong dua roadmap, flashcard, assessment cua user vao vector DB.
3. Khong xay bo tri thuc tieng Anh qua rong ngay tu dau.
4. Khong lam chatbot tong quat truoc khi lam chatbot theo san pham.

## 3. Nhung gi can chuan bi

### 3.1. Du lieu runtime tu he thong

Can xac dinh ro `context_type` va bang DB su dung:

1. `movie`
- `videos`
- `subtitles`
- `movie_ai_analyses`
- `watch_history`
- `flashcards` theo `video_id`

2. `flashcard`
- `flashcards`
- `flashcard_exercises`

3. `roadmap`
- `study_roadmaps`
- `daily_tasks`
- `ai_assessments`

4. `typing_game`
- `typing_game_maps`
- `typing_game_stages`

### 3.2. Du lieu tinh cho RAG

Can chuan bi tai lieu noi bo:

1. FAQ he thong
2. Huong dan hoc qua phim
3. Huong dan dung flashcard va bai tap AI
4. Huong dan typing game
5. Huong dan roadmap va assessment
6. Troubleshooting AI chatbox

### 3.3. Metadata

Moi tai lieu can:

1. `doc_id`
2. `title`
3. `topic`
4. `level`
5. `lang`
6. `source_type`
7. `updated_at`
8. `path`

### 3.4. Eval questions

Can toi thieu 30-50 cau hoi test theo 4 context:

1. movie
2. flashcard
3. roadmap
4. typing_game
5. system_help

## 4. Lo trinh chi tiet

### Phase 1: Context-first chatbox

Muc tieu:
- chatbox tra loi dung theo man hinh hien tai
- chua dung vector DB

Can lam:

1. Tao bang:
- `chat_sessions`
- `chat_messages`
- `chat_feedback`

2. Tao backend:
- `chat_controller.py`
- `chat_service.py`
- `context_builder.py`

3. Tao frontend:
- widget chatbox
- tao session
- gui message
- hien thi lich su

4. Context builder phai ho tro:
- `movie`
- `flashcard`
- `roadmap`
- `typing_game`
- `general`

Tieu chi xong:
- AI co the tra loi dung theo phim dang xem hoac roadmap hien tai.

### Phase 2: Product help RAG

Muc tieu:
- AI biet cach giai thich tinh nang cua CineFluent
- AI biet huong dan user dung he thong

Can lam:

1. Chuan hoa `rag_data/`
2. Tao script ingest:
- parse markdown
- chunk
- save metadata
- embedding
- upsert vector DB

3. Tao `retrieval_service.py`
4. Tao prompt hop nhat:
- system instruction
- runtime context neu co
- retrieved docs neu co
- user message

Tieu chi xong:
- user hoi ve cach dung flashcard, roadmap, phim, typing game thi AI tra loi dung he thong.

### Phase 3: Guardrails + quality

Can lam:

1. Rule: neu context khong du -> noi ro "khong du du lieu"
2. Rule: neu retrieval score thap -> khong bịa
3. Log:
- latency
- token usage
- retrieved docs
- final sources

4. Feedback:
- helpful / not helpful

Tieu chi xong:
- giam hallucination
- do duoc chat luong chatbox

### Phase 4: Production polish

Can lam:

1. Rate limit theo user
2. Luu session title tu dong
3. Them quick prompts theo tung man hinh
4. Dashboard admin cho chat quality

## 5. API contract de xuat

### `POST /api/ai/chat/messages`

Input:
- `session_id`
- `message`
- `context_type`
- `context_id`
- `client_state`

Output:
- `answer`
- `sources`
- `context_used`
- `latency_ms`
- `usage`

### `POST /api/ai/chat/feedback`

Input:
- `message_id`
- `is_helpful`
- `note`

## 6. Mapping context builder

### `context_type = movie`

Can lay:
- video metadata
- CEFR / level
- subtitle hien tai
- flashcard lien quan den phim

### `context_type = flashcard`

Can lay:
- flashcards gan day
- bai tap flashcard gan day
- score

### `context_type = roadmap`

Can lay:
- roadmap hien tai
- daily task hom nay
- assessment gan nhat

### `context_type = typing_game`

Can lay:
- map hien tai
- chapter hien tai
- difficulty

## 7. Ket luan

Huong dung nhat cho CineFluent la:

1. `Khong lam RAG tong quat`
2. `Khong vectorize du lieu runtime`
3. `Lam Product-RAG ket hop DB context`

Huong nay vua dung voi he thong hien tai, vua de demo, vua tranh sai lam over-engineering.
