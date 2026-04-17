from __future__ import annotations

import json
import math
from pathlib import Path

from .types import RagChunk, RetrievalHit


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right:
        return 0.0
    numerator = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(a * a for a in left))
    right_norm = math.sqrt(sum(b * b for b in right))
    if left_norm == 0.0 or right_norm == 0.0:
        return 0.0
    return numerator / (left_norm * right_norm)


class JsonVectorStore:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def upsert(self, chunks: list[RagChunk], vectors: list[list[float]]) -> int:
        records = []
        for chunk, vector in zip(chunks, vectors):
            records.append(
                {
                    "id": chunk.chunk_id,
                    "vector": vector,
                    "payload": chunk.to_payload(),
                }
            )
        self.path.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
        return len(records)

    def load_records(self) -> list[dict]:
        if not self.path.exists():
            return []
        return json.loads(self.path.read_text(encoding="utf-8"))

    def search(
        self,
        query_vector: list[float],
        top_k: int = 5,
        context_type: str | None = None,
    ) -> list[RetrievalHit]:
        records = self.load_records()
        hits: list[RetrievalHit] = []
        for record in records:
            payload = record["payload"]
            if context_type and context_type not in payload.get("context_types", []):
                if "general" not in payload.get("context_types", []):
                    continue
            score = _cosine_similarity(query_vector, record["vector"])
            hits.append(RetrievalHit(chunk_id=record["id"], score=score, payload=payload))

        hits.sort(key=lambda item: item.score, reverse=True)
        return hits[:top_k]


class QdrantVectorStore:
    def __init__(self, url: str, collection_name: str, api_key: str | None = None) -> None:
        self.url = url
        self.collection_name = collection_name
        self.api_key = api_key

    def _client(self):
        try:
            from qdrant_client import QdrantClient
        except ImportError as exc:
            raise RuntimeError(
                "qdrant-client chưa được cài. Hãy cài qdrant-client trước khi dùng QdrantVectorStore."
            ) from exc
        return QdrantClient(url=self.url, api_key=self.api_key)

    def upsert(self, chunks: list[RagChunk], vectors: list[list[float]]) -> int:
        client = self._client()

        try:
            from qdrant_client.http import models
        except ImportError as exc:
            raise RuntimeError("Không import được qdrant_client.http.models.") from exc

        if not client.collection_exists(self.collection_name):
            client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(size=len(vectors[0]), distance=models.Distance.COSINE),
            )

        points = [
            models.PointStruct(
                id=index,
                vector=vector,
                payload=chunk.to_payload() | {"chunk_id": chunk.chunk_id},
            )
            for index, (chunk, vector) in enumerate(zip(chunks, vectors), start=1)
        ]
        client.upsert(collection_name=self.collection_name, points=points, wait=True)
        return len(points)

    def search(
        self,
        query_vector: list[float],
        top_k: int = 5,
        context_type: str | None = None,
    ) -> list[RetrievalHit]:
        client = self._client()
        query_filter = None
        if context_type:
            try:
                from qdrant_client.http import models
            except ImportError as exc:
                raise RuntimeError("Không import được qdrant_client.http.models.") from exc
            query_filter = models.Filter(
                should=[
                    models.FieldCondition(key="context_types[]", match=models.MatchValue(value=context_type)),
                    models.FieldCondition(key="context_types[]", match=models.MatchValue(value="general")),
                ]
            )
        raw_hits = client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            limit=top_k,
            with_payload=True,
            query_filter=query_filter,
        ).points

        return [
            RetrievalHit(
                chunk_id=(item.payload or {}).get("chunk_id", str(item.id)),
                score=float(item.score or 0.0),
                payload=item.payload or {},
            )
            for item in raw_hits
        ]
