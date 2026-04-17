from __future__ import annotations

import hashlib
import math
import re


class HashEmbeddingProvider:
    def __init__(self, dim: int = 256) -> None:
        if dim <= 0:
            raise ValueError("Embedding dimension must be positive.")
        self.dim = dim

    def embed_text(self, text: str) -> list[float]:
        vector = [0.0] * self.dim
        tokens = re.findall(r"[\wÀ-ỹ]+", text.lower())
        if not tokens:
            return vector

        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            index = int.from_bytes(digest[:4], byteorder="big") % self.dim
            sign = 1.0 if digest[4] % 2 == 0 else -1.0
            weight = 1.0 + (digest[5] / 255.0)
            vector[index] += sign * weight

        norm = math.sqrt(sum(value * value for value in vector))
        if norm == 0.0:
            return vector
        return [value / norm for value in vector]

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        return [self.embed_text(item) for item in texts]
