from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.product_rag import (  # noqa: E402
    HashEmbeddingProvider,
    JsonVectorStore,
    ProductRagSettings,
    QdrantVectorStore,
    run_retrieval,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Smoke test Product-RAG retrieval using eval questions.")
    parser.add_argument("--store", choices=["json", "qdrant"], default="json")
    parser.add_argument("--json-store", type=str, default="")
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--limit", type=int, default=0)
    return parser.parse_args()


def load_eval_questions(base_dir: Path) -> list[dict]:
    questions_path = base_dir / "rag_data" / "eval" / "questions.jsonl"
    rows: list[dict] = []
    with questions_path.open("r", encoding="utf-8") as handle:
        for raw_line in handle:
            line = raw_line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows


def build_store(settings: ProductRagSettings):
    if settings.store_kind == "qdrant":
        if not settings.qdrant_url:
            raise RuntimeError("Thiếu QDRANT_URL để chạy smoke test với Qdrant.")
        return QdrantVectorStore(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            collection_name=settings.qdrant_collection,
        )
    return JsonVectorStore(settings.json_store_path)


def main() -> int:
    args = parse_args()
    settings = ProductRagSettings.from_env(REPO_ROOT)
    settings.store_kind = args.store
    if args.json_store:
        settings.json_store_path = Path(args.json_store)

    store = build_store(settings)
    embedder = HashEmbeddingProvider(dim=settings.embedding_dim)

    questions = load_eval_questions(settings.base_dir)
    if args.limit > 0:
        questions = questions[: args.limit]

    results = []
    scored_total = 0
    scored_passed = 0

    for item in questions:
        expected_source = item.get("expected_source")
        expected_context_type = item.get("expected_context_type")
        hits = run_retrieval(
            question=item["question"],
            vector_store=store,
            embedding_provider=embedder,
            top_k=args.top_k,
            context_type=None if expected_context_type == "general" else expected_context_type,
        )
        top_topics = [hit.payload.get("topic") for hit in hits]
        top_docs = [hit.payload.get("path") for hit in hits]

        if expected_source in {"product_rag", "hybrid"}:
            scored_total += 1
            matched = item["expected_topic"] in top_topics
            if matched:
                scored_passed += 1
        else:
            matched = item["expected_topic"] in top_topics

        results.append(
            {
                "id": item["id"],
                "question": item["question"],
                "expected_topic": item["expected_topic"],
                "expected_source": expected_source,
                "matched_expected_topic": matched,
                "top_topics": top_topics,
                "top_docs": top_docs,
                "top_scores": [round(hit.score, 4) for hit in hits],
            }
        )

    accuracy = round((scored_passed / scored_total) * 100, 2) if scored_total else 0.0
    report = {
        "store_kind": settings.store_kind,
        "top_k": args.top_k,
        "questions_total": len(questions),
        "questions_scored": scored_total,
        "questions_passed": scored_passed,
        "topic_match_accuracy": accuracy,
        "results": results,
    }

    output_dir = settings.base_dir / "server" / "be_flask_cinefluent" / "storage" / "product_rag"
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "smoke_test_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
