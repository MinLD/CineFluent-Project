from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass(slots=True)
class RagMetadata:
    doc_id: str
    title: str
    doc_group: str
    topic: str
    level: str
    lang: str
    source_type: str
    context_types: list[str]
    keywords: list[str]
    updated_at: str
    path: str


@dataclass(slots=True)
class RagChunk:
    chunk_id: str
    doc_id: str
    title: str
    doc_group: str
    topic: str
    level: str
    lang: str
    source_type: str
    context_types: list[str]
    keywords: list[str]
    updated_at: str
    path: str
    section_title: str
    chunk_index: int
    text: str

    def to_payload(self) -> dict:
        return asdict(self)


@dataclass(slots=True)
class RetrievalHit:
    chunk_id: str
    score: float
    payload: dict
