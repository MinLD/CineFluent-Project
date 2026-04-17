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
    load_rag_chunks,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest rag_data into Product-RAG vector store.")
    parser.add_argument("--store", choices=["json", "qdrant"], default="json")
    parser.add_argument("--chunk-size", type=int, default=1200)
    parser.add_argument("--chunk-overlap", type=int, default=120)
    parser.add_argument("--embedding-dim", type=int, default=256)
    parser.add_argument("--json-store", type=str, default="")
    return parser.parse_args()


def build_store(settings: ProductRagSettings):
    if settings.store_kind == "qdrant":
        if not settings.qdrant_url:
            raise RuntimeError("Thiếu QDRANT_URL để ingest vào Qdrant.")
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
    settings.chunk_size = args.chunk_size
    settings.chunk_overlap = args.chunk_overlap
    settings.embedding_dim = args.embedding_dim
    if args.json_store:
        settings.json_store_path = Path(args.json_store)

    chunks = load_rag_chunks(
        base_dir=settings.base_dir,
        max_chars=settings.chunk_size,
        overlap_chars=settings.chunk_overlap,
    )
    embedder = HashEmbeddingProvider(dim=settings.embedding_dim)
    vectors = embedder.embed_texts([chunk.text for chunk in chunks])
    store = build_store(settings)
    inserted = store.upsert(chunks=chunks, vectors=vectors)

    report = {
        "store_kind": settings.store_kind,
        "chunk_size": settings.chunk_size,
        "chunk_overlap": settings.chunk_overlap,
        "embedding_dim": settings.embedding_dim,
        "documents": len({chunk.doc_id for chunk in chunks}),
        "chunks": len(chunks),
        "inserted": inserted,
        "json_store_path": str(settings.json_store_path) if settings.json_store_path else None,
    }

    output_dir = settings.base_dir / "server" / "be_flask_cinefluent" / "storage" / "product_rag"
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "ingest_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
