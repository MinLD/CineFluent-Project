from __future__ import annotations

from .embeddings import HashEmbeddingProvider


def run_retrieval(
    question: str,
    vector_store,
    embedding_provider: HashEmbeddingProvider,
    top_k: int = 5,
    context_type: str | None = None,
):
    query_vector = embedding_provider.embed_text(question)
    return vector_store.search(query_vector=query_vector, top_k=top_k, context_type=context_type)
