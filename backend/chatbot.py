from __future__ import annotations

import importlib
import re
import threading
from typing import Any

import requests

from .rag import SchemeRAG

DISCOVERY = "DISCOVERY"
INFORMATION = "INFORMATION"
UNKNOWN_MESSAGE = "माफ कीजिए, यह जानकारी उपलब्ध नहीं है"
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
OLLAMA_MODEL = "phi3"

_memory: dict[str, dict[str, str]] = {}
_rag: SchemeRAG | None = None
_rag_lock = threading.Lock()

HINGLISH_MAP = {
    "mujhe": "मुझे",
    "yojana": "योजना",
    "batao": "बताओ",
    "kya hai": "क्या है",
    "kya": "क्या",
    "kaise": "कैसे",
    "eligibility": "पात्रता",
    "benefits": "लाभ",
    "apply": "आवेदन",
    "farmer": "किसान",
    "farmers": "किसान",
    "scheme": "योजना",
    "schemes": "योजनाएं",
    "btao": "बताओ",
    "btayo": "बताओ",
    "baare me": "के बारे में",
    "bare me": "के बारे में",
    "about": "के बारे में",
    "details": "विवरण",
    "detail": "विवरण",
    "info": "जानकारी",
    "information": "जानकारी",
}


def normalize_hinglish(text: str) -> str:
    normalized = text.strip().lower()
    for src, dst in HINGLISH_MAP.items():
        normalized = normalized.replace(src, dst)
    return normalized


def _get_rag() -> SchemeRAG:
    global _rag
    if _rag is not None:
        return _rag
    with _rag_lock:
        if _rag is None:
            _rag = SchemeRAG()
    return _rag


def _tokenize(text: str) -> list[str]:
    toks = re.findall(r"[\w\u0900-\u097F]+", text.lower())
    stop = {
        "mujhe",
        "m",
        "mein",
        "में",
        "ke",
        "की",
        "का",
        "के",
        "for",
        "liye",
        "लिए",
        "yojana",
        "योजना",
        "scheme",
        "बताओ",
        "batao",
        "kya",
        "क्या",
        "hai",
        "है",
    }
    return [t for t in toks if t and t not in stop]


def _name_overlap(query: str, name: str) -> int:
    q = set(_tokenize(query))
    n = set(_tokenize(name))
    return len(q & n)


def _best_retrieval(query: str, top_k: int = 8) -> list[dict[str, Any]]:
    items = _get_rag().retrieve(query, top_k=top_k)
    if not items:
        return []
    ranked = sorted(
        items,
        key=lambda item: (_name_overlap(query, str(item.get("name", ""))), float(item.get("score", 0.0))),
        reverse=True,
    )
    return ranked


def classify_query(query: str) -> str:
    raw = query.strip().lower()
    q = normalize_hinglish(query)
    information_keys = [
        "क्या है",
        "पात्रता",
        "लाभ",
        "documents",
        "आवेदन",
        "कैसे",
        "eligibility",
        "के बारे में",
        "जानकारी",
        "विवरण",
        "ke baare",
        "baare",
        "about",
    ]
    if any(k in q for k in information_keys):
        return INFORMATION

    # If query appears to mention a specific scheme name, treat as information.
    looks_specific = (
        ("pm " in raw)
        or ("yojana" in raw)
        or (" योजना " in f" {q} ")
        or bool(re.search(r"\b(pradhan|awas|kisan|poshan|ayushman|scholarship)\b", raw))
    )
    asks_suggestion = any(k in q for k in ["मेरे लिए", "suggest", "recommend", "सुझाव"])
    if looks_specific and len(_tokenize(raw)) >= 2 and not asks_suggestion:
        return INFORMATION

    discovery_keys = [
        "बताओ",
        "सुझाव",
        "recommend",
        "suggest",
        "योजना",
        "schemes",
        "किसान",
        "मेरे लिए",
    ]
    if any(k in q for k in discovery_keys):
        return DISCOVERY
    return INFORMATION


def _call_existing_ml_function(query: str) -> list[str]:
    candidate_modules = ["model", "ml_model", "recommender", "backend.model"]
    candidate_functions = ["recommend_schemes", "get_recommendations", "predict_recommendations", "recommend"]
    for module_name in candidate_modules:
        try:
            module = importlib.import_module(module_name)
        except Exception:
            continue
        for fn_name in candidate_functions:
            fn = getattr(module, fn_name, None)
            if callable(fn):
                try:
                    result = fn(query)
                    if isinstance(result, list):
                        return [str(x) for x in result if x]
                except Exception:
                    continue
    docs = _get_rag().retrieve(query, top_k=5)
    return [doc.get("name", "") for doc in docs if doc.get("name")]


def generate_response(context: str, query: str) -> str:
    prompt = (
        "आप एक सरकारी योजना सहायक हैं।\n"
        "केवल दिए गए Context से उत्तर दें।\n"
        f"यदि जानकारी context में न मिले तो सिर्फ यह लिखें: {UNKNOWN_MESSAGE}\n"
        "उत्तर सरल हिंदी में दें और यह फॉर्मेट रखें:\n"
        "योजना का नाम\n"
        "पात्रता\n"
        "लाभ\n"
        "आवेदन प्रक्रिया\n\n"
        f"Context:\n{context}\n\n"
        f"User Query: {query}"
    )
    payload = {"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
    try:
        resp = requests.post(OLLAMA_URL, json=payload, timeout=90)
        resp.raise_for_status()
        output = (resp.json().get("response") or "").strip()
        return output or UNKNOWN_MESSAGE
    except Exception:
        return UNKNOWN_MESSAGE


def _format_discovery(names: list[str]) -> str:
    if not names:
        return "आपके प्रश्न के लिए अभी कोई योजना नहीं मिली। कृपया और विवरण दें।"
    top = names[:5]
    bullets = "\n".join([f"- {name}" for name in top])
    return f"आपके लिए संभावित योजनाएं:\n{bullets}"


def _fallback_information_answer(item: dict[str, Any]) -> str:
    return (
        f"योजना का नाम: {item.get('name', 'जानकारी उपलब्ध नहीं')}\n"
        f"पात्रता: {item.get('eligibility', 'जानकारी उपलब्ध नहीं') or 'जानकारी उपलब्ध नहीं'}\n"
        f"लाभ: {item.get('benefits', 'जानकारी उपलब्ध नहीं') or 'जानकारी उपलब्ध नहीं'}\n"
        f"आवेदन प्रक्रिया: {item.get('application_process', 'जानकारी उपलब्ध नहीं') or 'जानकारी उपलब्ध नहीं'}"
    )


def get_chatbot_response(query: str, conversation_id: str = "default") -> str:
    normalized = normalize_hinglish(query)
    mode = classify_query(normalized)
    state = _memory.setdefault(conversation_id, {})

    if mode == DISCOVERY:
        names = _call_existing_ml_function(normalized)
        if names:
            state["last_scheme"] = names[0]
        return _format_discovery(names)

    followup_keys = ["पात्रता", "लाभ", "आवेदन", "eligibility", "benefits", "apply"]
    if state.get("last_scheme") and any(k in normalized for k in followup_keys):
        normalized = f"{state['last_scheme']} {normalized}"

    items = _best_retrieval(normalized, top_k=8)[:3]
    if items:
        state["last_scheme"] = items[0].get("name", state.get("last_scheme", ""))
    context = _get_rag().build_context(items)
    if not context:
        return UNKNOWN_MESSAGE
    answer = generate_response(context=context, query=normalized)
    if answer.strip() == UNKNOWN_MESSAGE and items:
        return _fallback_information_answer(items[0])
    return answer or UNKNOWN_MESSAGE
