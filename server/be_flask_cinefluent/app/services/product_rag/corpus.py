from __future__ import annotations

import json
import re
from pathlib import Path

from .types import RagChunk, RagMetadata

_HEADING_RE = re.compile(r"^(#{1,6})\s+(.+)$", re.MULTILINE)


def _read_jsonl(path: Path) -> list[dict]:
    rows: list[dict] = []
    with path.open("r", encoding="utf-8") as handle:
        for raw_line in handle:
            line = raw_line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows


def load_rag_metadata(base_dir: Path) -> list[RagMetadata]:
    metadata_path = base_dir / "rag_data" / "metadata.jsonl"
    rows = _read_jsonl(metadata_path)
    return [RagMetadata(**row) for row in rows]


def _split_markdown_sections(content: str) -> list[tuple[str, str]]:
    matches = list(_HEADING_RE.finditer(content))
    if not matches:
        return [("root", content.strip())]

    sections: list[tuple[str, str]] = []
    for index, match in enumerate(matches):
        title = match.group(2).strip()
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(content)
        body = content[start:end].strip()
        if body:
            sections.append((title, body))
    return sections or [("root", content.strip())]


def _split_long_text(text: str, max_chars: int, overlap_chars: int) -> list[str]:
    paragraphs = [paragraph.strip() for paragraph in re.split(r"\n\s*\n", text) if paragraph.strip()]
    if not paragraphs:
        return [text.strip()] if text.strip() else []

    chunks: list[str] = []
    buffer = ""

    for paragraph in paragraphs:
        candidate = paragraph if not buffer else f"{buffer}\n\n{paragraph}"
        if len(candidate) <= max_chars:
            buffer = candidate
            continue

        if buffer:
            chunks.append(buffer.strip())
            tail = buffer[-overlap_chars:] if overlap_chars > 0 else ""
            buffer = f"{tail}\n\n{paragraph}".strip() if tail else paragraph
            if len(buffer) <= max_chars:
                continue

        while len(paragraph) > max_chars:
            chunks.append(paragraph[:max_chars].strip())
            paragraph = paragraph[max_chars - overlap_chars :].strip() if overlap_chars > 0 else paragraph[max_chars:].strip()
        buffer = paragraph

    if buffer:
        chunks.append(buffer.strip())

    return [chunk for chunk in chunks if chunk]


def load_rag_chunks(base_dir: Path, max_chars: int = 1200, overlap_chars: int = 120) -> list[RagChunk]:
    chunks: list[RagChunk] = []
    for metadata in load_rag_metadata(base_dir):
        doc_path = base_dir / "rag_data" / Path(metadata.path)
        content = doc_path.read_text(encoding="utf-8")
        sections = _split_markdown_sections(content)

        chunk_index = 0
        for section_title, section_body in sections:
            text_parts = _split_long_text(section_body, max_chars=max_chars, overlap_chars=overlap_chars)
            for part in text_parts:
                chunk_id = f"{metadata.doc_id}::chunk_{chunk_index:03d}"
                chunks.append(
                    RagChunk(
                        chunk_id=chunk_id,
                        doc_id=metadata.doc_id,
                        title=metadata.title,
                        doc_group=metadata.doc_group,
                        topic=metadata.topic,
                        level=metadata.level,
                        lang=metadata.lang,
                        source_type=metadata.source_type,
                        context_types=metadata.context_types,
                        keywords=metadata.keywords,
                        updated_at=metadata.updated_at,
                        path=metadata.path,
                        section_title=section_title,
                        chunk_index=chunk_index,
                        text=f"{section_title}\n\n{part}".strip(),
                    )
                )
                chunk_index += 1

    return chunks
