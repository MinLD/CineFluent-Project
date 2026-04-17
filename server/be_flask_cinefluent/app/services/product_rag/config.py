from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(slots=True)
class ProductRagSettings:
    base_dir: Path
    store_kind: str = "json"
    chunk_size: int = 1200
    chunk_overlap: int = 120
    embedding_dim: int = 256
    json_store_path: Path | None = None
    qdrant_url: str | None = None
    qdrant_api_key: str | None = None
    qdrant_collection: str = "cinefluent_product_rag"

    @classmethod
    def from_env(cls, base_dir: Path) -> "ProductRagSettings":
        storage_dir = base_dir / "server" / "be_flask_cinefluent" / "storage" / "product_rag"
        return cls(
            base_dir=base_dir,
            store_kind=os.getenv("PRODUCT_RAG_STORE", "json").strip().lower() or "json",
            chunk_size=int(os.getenv("PRODUCT_RAG_CHUNK_SIZE", "1200")),
            chunk_overlap=int(os.getenv("PRODUCT_RAG_CHUNK_OVERLAP", "120")),
            embedding_dim=int(os.getenv("PRODUCT_RAG_EMBEDDING_DIM", "256")),
            json_store_path=Path(os.getenv("PRODUCT_RAG_JSON_STORE", storage_dir / "vector_store.json")),
            qdrant_url=os.getenv("QDRANT_URL"),
            qdrant_api_key=os.getenv("QDRANT_API_KEY"),
            qdrant_collection=os.getenv("QDRANT_COLLECTION", "cinefluent_product_rag"),
        )
