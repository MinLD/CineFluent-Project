# Product-RAG Step 1 Runbook

Tài liệu này mô tả bước đầu tiên để đưa `rag_data` vào trạng thái có thể kiểm thử được.

## 1. Mục tiêu

Hoàn thành 2 việc:

1. ingest toàn bộ `rag_data` thành vector store
2. chạy smoke test bằng bộ câu hỏi eval để kiểm tra retrieval

## 2. Những file đã có

### Bộ dữ liệu

- [README.md](/d:/Projects/CineFluent-Project/rag_data/README.md)
- [metadata.jsonl](/d:/Projects/CineFluent-Project/rag_data/metadata.jsonl)
- [questions.jsonl](/d:/Projects/CineFluent-Project/rag_data/eval/questions.jsonl)

### Service nền

- [config.py](/d:/Projects/CineFluent-Project/server/be_flask_cinefluent/app/services/product_rag/config.py)
- [corpus.py](/d:/Projects/CineFluent-Project/server/be_flask_cinefluent/app/services/product_rag/corpus.py)
- [embeddings.py](/d:/Projects/CineFluent-Project/server/be_flask_cinefluent/app/services/product_rag/embeddings.py)
- [stores.py](/d:/Projects/CineFluent-Project/server/be_flask_cinefluent/app/services/product_rag/stores.py)
- [retrieval.py](/d:/Projects/CineFluent-Project/server/be_flask_cinefluent/app/services/product_rag/retrieval.py)

### Script vận hành

- [product_rag_ingest.py](/d:/Projects/CineFluent-Project/server/be_flask_cinefluent/scripts/product_rag_ingest.py)
- [product_rag_smoke_test.py](/d:/Projects/CineFluent-Project/server/be_flask_cinefluent/scripts/product_rag_smoke_test.py)

## 3. Cách chạy ingest

Chạy trong thư mục backend:

```powershell
cd d:\Projects\CineFluent-Project\server\be_flask_cinefluent
python scripts\product_rag_ingest.py --store json
```

Nếu muốn chỉnh chunk:

```powershell
python scripts\product_rag_ingest.py --store json --chunk-size 1000 --chunk-overlap 120
```

Kết quả sẽ được ghi ra:

- `server/be_flask_cinefluent/storage/product_rag/vector_store.json`
- `server/be_flask_cinefluent/storage/product_rag/ingest_report.json`

## 4. Cách chạy smoke test

```powershell
cd d:\Projects\CineFluent-Project\server\be_flask_cinefluent
python scripts\product_rag_smoke_test.py --store json --top-k 5
```

Kết quả sẽ được ghi ra:

- `server/be_flask_cinefluent/storage/product_rag/smoke_test_report.json`

## 5. Đọc kết quả như thế nào

### Ingest report

Bạn cần chú ý:

1. `documents`
2. `chunks`
3. `inserted`

Ba số này phải hợp lý và không được bằng 0.

### Smoke test report

Bạn cần chú ý:

1. `questions_scored`
2. `questions_passed`
3. `topic_match_accuracy`
4. `results[].top_topics`

Mục tiêu của step 1 chưa phải trả lời hoàn hảo, mà là:

1. retrieval tìm đúng module tương đối ổn
2. các câu `product_rag` và `hybrid` không bị retrieve lệch quá mạnh

## 6. Lưu ý kỹ thuật

1. Bản hiện tại dùng `HashEmbeddingProvider` để chạy nền local, không phụ thuộc mạng.
2. `QdrantVectorStore` đã có khung nhưng chưa bắt buộc phải dùng ngay.
3. Khi chất lượng retrieval ổn hơn, có thể thay embedding provider và vector store mà không phải đập lại `rag_data`.

## 7. Bước tiếp theo sau Step 1

Sau khi smoke test ổn, bước kế tiếp là:

1. tạo `chat_sessions`, `chat_messages`, `chat_feedback`
2. viết `context_builder` cho `movie`, `flashcard`, `roadmap`, `typing_game`, `realtime_practice`
3. viết `chat orchestrator` quyết định `runtime`, `rag` hay `hybrid`
