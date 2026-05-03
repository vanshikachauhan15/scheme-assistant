from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

DEFAULT_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATASET = ROOT / "cleaned_schemes.csv"
CACHE_DIR = ROOT / "backend" / ".cache"
INDEX_PATH = CACHE_DIR / "schemes.index.faiss"
META_PATH = CACHE_DIR / "schemes.meta.json"


def _pick(row: dict[str, Any], keys: list[str], default: str = "") -> str:
    for key in keys:
        value = row.get(key)
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return default


def _compose_eligibility(row: dict[str, str]) -> tuple[str, str, str, str]:
    base_eligibility = _pick(row, ["Eligibility", "Occupation", "eligibility", "occupation"])
    min_age = _pick(row, ["Min Age", "Minimum Age", "min_age", "minAge"])
    max_age = _pick(row, ["Max Age", "Maximum Age", "max_age", "maxAge"])
    income_limit = _pick(row, ["Income Limit", "income_limit", "incomeLimit"])

    extra_parts: list[str] = []
    if min_age:
        extra_parts.append(f"Minimum age: {min_age}")
    if max_age:
        extra_parts.append(f"Maximum age: {max_age}")
    if income_limit:
        extra_parts.append(f"Income limit: {income_limit}")

    combined = base_eligibility
    if extra_parts:
        extra_text = "; ".join(extra_parts)
        combined = f"{base_eligibility}; {extra_text}" if base_eligibility else extra_text

    return combined, min_age, max_age, income_limit


def load_scheme_rows(csv_path: str | Path = DEFAULT_DATASET) -> list[dict[str, str]]:
    path = Path(csv_path)
    if not path.exists():
        raise FileNotFoundError(f"Scheme dataset not found at: {path}")
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        return [dict(row) for row in reader if row]


def build_scheme_document(row: dict[str, str]) -> dict[str, str]:
    name = _pick(row, ["Scheme Name", "name", "scheme_name"], default="अज्ञात योजना")
    description = _pick(row, ["Description", "Full Text", "full_text"])
    eligibility, min_age, max_age, income_limit = _compose_eligibility(row)
    benefits = _pick(row, ["Benefits", "benefits"], default="जानकारी उपलब्ध नहीं")
    documents = _pick(row, ["Documents", "documents"])
    state = _pick(row, ["State", "state"])
    apply_process = _pick(row, ["Application Process", "How to Apply", "apply_process"], default="ऑनलाइन या CSC के माध्यम से आवेदन करें")
    searchable_text = (
        f"Scheme Name: {name}\n"
        f"Description: {description}\n"
        f"Eligibility: {eligibility}\n"
        f"Benefits: {benefits}\n"
        f"Documents: {documents}\n"
        f"State: {state}\n"
        f"Application Process: {apply_process}"
    )
    return {
        "name": name,
        "description": description,
        "eligibility": eligibility,
        "benefits": benefits,
        "documents": documents,
        "state": state,
        "min_age": min_age,
        "max_age": max_age,
        "income_limit": income_limit,
        "application_process": apply_process,
        "searchable_text": searchable_text,
    }


@dataclass
class EmbeddingIndex:
    model_name: str = DEFAULT_MODEL
    dataset_path: Path = DEFAULT_DATASET
    index_path: Path = INDEX_PATH
    meta_path: Path = META_PATH

    def __post_init__(self) -> None:
        self.model = SentenceTransformer(self.model_name)
        self.index: faiss.Index | None = None
        self.metadata: list[dict[str, str]] = []

    def _encode(self, texts: list[str]) -> np.ndarray:
        vectors = self.model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        return np.asarray(vectors, dtype="float32")

    def build(self) -> None:
        rows = load_scheme_rows(self.dataset_path)
        docs = [build_scheme_document(row) for row in rows]
        texts = [doc["searchable_text"] for doc in docs]
        embeddings = self._encode(texts)
        self.index = faiss.IndexFlatIP(embeddings.shape[1])
        self.index.add(embeddings)
        self.metadata = docs
        self._persist()

    def _persist(self) -> None:
        if self.index is None:
            return
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, str(self.index_path))
        self.meta_path.write_text(json.dumps(self.metadata, ensure_ascii=False), encoding="utf-8")

    def load_or_build(self) -> None:
        if self.index_path.exists() and self.meta_path.exists():
            self.index = faiss.read_index(str(self.index_path))
            self.metadata = json.loads(self.meta_path.read_text(encoding="utf-8"))
            # Rebuild when cached metadata is from an older schema.
            if self.metadata:
                sample = self.metadata[0]
                required = {"min_age", "max_age", "income_limit"}
                if required.issubset(sample.keys()):
                    return
            self.build()
            return
        self.build()

    def search(self, query: str, top_k: int = 3) -> list[dict[str, Any]]:
        if self.index is None:
            self.load_or_build()
        if self.index is None or self.index.ntotal == 0:
            return []
        q = self._encode([query])
        scores, indices = self.index.search(q, top_k)
        out: list[dict[str, Any]] = []
        for score, idx in zip(scores[0], indices[0], strict=False):
            if idx < 0 or idx >= len(self.metadata):
                continue
            item = dict(self.metadata[idx])
            item["score"] = float(score)
            out.append(item)
        return out
