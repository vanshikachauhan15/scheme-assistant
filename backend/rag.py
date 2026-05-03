from __future__ import annotations

from typing import Any

from .embeddings import EmbeddingIndex


class SchemeRAG:
    def __init__(self) -> None:
        self.index = EmbeddingIndex()
        self.index.load_or_build()

    def retrieve(self, query: str, top_k: int = 3) -> list[dict[str, Any]]:
        return self.index.search(query=query, top_k=top_k)

    @staticmethod
    def build_context(items: list[dict[str, Any]]) -> str:
        if not items:
            return ""
        chunks = []
        for idx, item in enumerate(items, start=1):
            chunks.append(
                (
                    f"[{idx}] Scheme name: {item.get('name', '')}\n"
                    f"Description: {item.get('description', '')}\n"
                    f"Eligibility: {item.get('eligibility', '')}\n"
                    f"Benefits: {item.get('benefits', '')}\n"
                    f"Application process: {item.get('application_process', '')}\n"
                    f"State: {item.get('state', '')}"
                )
            )
        return "\n\n".join(chunks)
