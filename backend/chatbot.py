from __future__ import annotations

import importlib
import re
import threading
from typing import Any

import requests

from .rag import SchemeRAG

DISCOVERY = "DISCOVERY"
INFORMATION = "INFORMATION"
UNKNOWN_MESSAGE = "Sorry, this information is not available"
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


def _is_hindi_like(text: str) -> bool:
    return bool(re.search(r"[\u0900-\u097F]", text))


def _normalize_text_for_match(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^\w\u0900-\u097F\s]", " ", text.lower())).strip()


def _contains_phrase(text: str, phrases: list[str]) -> bool:
    normalized_text = f" {_normalize_text_for_match(text)} "
    for phrase in phrases:
        normalized_phrase = _normalize_text_for_match(phrase)
        if not normalized_phrase:
            continue
        if f" {normalized_phrase} " in normalized_text:
            return True
    return False


def _get_basic_intent_response(query: str) -> tuple[str | None, str | None]:
    normalized = _normalize_text_for_match(normalize_hinglish(query))
    hindi_like = _is_hindi_like(query) or _contains_phrase(
        normalized, ["namaste", "dhanyavad", "shukriya", "madad", "aap", "tum", "kaise", "haal", "theek", "haan"]
    )

    greeting_phrases = [
        "hi",
        "hello",
        "hey",
        "hii",
        "hiii",
        "namaste",
        "नमस्ते",
        "हेलो",
        "राम राम",
        "good morning",
        "good afternoon",
        "good evening",
        "गुड मॉर्निंग",
        "गुड आफ्टरनून",
        "गुड ईवनिंग",
        "सुप्रभात",
        "शुभ संध्या",
    ]
    capability_phrases = [
        "what can you do",
        "how can you help",
        "help me",
        "can you help",
        "आप क्या कर सकते",
        "तुम क्या कर सकते",
        "क्या कर सकते हो",
        "क्या मदद कर सकते",
        "madad",
        "help",
    ]
    thanks_phrases = ["thanks", "thank you", "thx", "धन्यवाद", "शुक्रिया", "thanks a lot"]
    bye_phrases = [
        "bye",
        "goodbye",
        "see you",
        "take care",
        "good night",
        "alvida",
        "अलविदा",
        "फिर मिलेंगे",
        "बाय",
        "शुभ रात्रि",
        "गुड नाइट",
    ]
    wellbeing_phrases = [
        "how are you",
        "how r u",
        "how are u",
        "kaise ho",
        "kaisa hai",
        "kya haal",
        "क्या हाल",
        "कैसे हो",
        "कैसी हो",
        "कैसा है",
    ]
    acknowledge_phrases = [
        "ok",
        "okay",
        "kk",
        "cool",
        "great",
        "nice",
        "hmm",
        "hmmm",
        "acha",
        "accha",
        "achha",
        "theek",
        "ठीक",
        "ठीक है",
        "ओके",
    ]
    yes_phrases = ["yes", "yep", "yaa", "haan", "han", "जी", "हाँ", "हां", "yes please"]
    no_phrases = ["no", "nope", "nah", "nahi", "ना", "नहीं", "मत"]

    if _contains_phrase(normalized, greeting_phrases):
        if hindi_like:
            return (
                "GREETING",
                "नमस्ते! मैं सरकारी योजनाओं की जानकारी देने में मदद कर सकता हूँ। आप योजना का नाम, पात्रता, लाभ, या आवेदन प्रक्रिया पूछ सकते हैं।",
            )
        return (
            "GREETING",
            "Hi! I can help with government scheme information. You can ask about scheme names, eligibility, benefits, or application steps.",
        )

    if _contains_phrase(normalized, capability_phrases):
        if hindi_like:
            return (
                "CAPABILITY",
                "मैं आपकी इन चीजों में मदद कर सकता हूँ:\n- योजनाएँ ढूँढना\n- पात्रता समझाना\n- लाभ बताना\n- आवेदन प्रक्रिया समझाना\nआप अपनी स्थिति (राज्य, उम्र, आय, श्रेणी) बताकर बेहतर सुझाव ले सकते हैं।",
            )
        return (
            "CAPABILITY",
            "I can help you with:\n- finding relevant schemes\n- checking eligibility\n- explaining benefits\n- sharing application steps\nFor better suggestions, include your state, age, income, or category.",
        )

    if _contains_phrase(normalized, wellbeing_phrases):
        if hindi_like:
            return (
                "WELLBEING",
                "मैं ठीक हूँ, धन्यवाद! 😊\nमैं आपकी सरकारी योजना से जुड़ी मदद के लिए यहाँ हूँ। आप अपनी जरूरत बताइए, जैसे किसान, छात्रवृत्ति, स्वास्थ्य या आवास।",
            )
        return (
            "WELLBEING",
            "I am doing well, thanks! 😊\nI am here to help with government schemes. Tell me your need, like farmer support, scholarship, health, or housing.",
        )

    if _contains_phrase(normalized, thanks_phrases):
        if hindi_like:
            return ("THANKS", "खुशी हुई मदद करके। अगर चाहें तो मैं और योजनाएँ भी सुझा सकता हूँ।")
        return ("THANKS", "Glad to help. I can suggest more schemes if you want.")

    if _contains_phrase(normalized, bye_phrases):
        if hindi_like:
            return ("BYE", "धन्यवाद! फिर मिलते हैं। जब चाहें योजना से जुड़ा सवाल पूछें।")
        return ("BYE", "Thanks! See you soon. Ask anytime when you need scheme guidance.")

    if _contains_phrase(normalized, acknowledge_phrases):
        if hindi_like:
            return ("ACK", "ठीक है। अब आप योजना का नाम या अपनी प्रोफाइल (राज्य, उम्र, आय) बताएं, मैं सही योजना सुझाऊंगा।")
        return ("ACK", "Great. Now share a scheme name or your profile (state, age, income), and I will guide you better.")

    if _contains_phrase(normalized, yes_phrases):
        if hindi_like:
            return ("YES", "बिलकुल! अपनी जरूरत बताइए, मैं उसी हिसाब से योजना सुझाता हूँ।")
        return ("YES", "Sure! Tell me your requirement and I will suggest suitable schemes.")

    if _contains_phrase(normalized, no_phrases):
        if hindi_like:
            return ("NO", "कोई बात नहीं। जब चाहें योजना, पात्रता या आवेदन प्रक्रिया के बारे में पूछ सकते हैं।")
        return ("NO", "No problem. Whenever you are ready, ask me about any scheme, eligibility, or application process.")

    return (None, None)


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
        "You are a government scheme assistant.\n"
        "Answer only from the given Context.\n"
        f"If information is not found in context, write only: {UNKNOWN_MESSAGE}\n"
        "Give answer in simple English and maintain this format:\n"
        "Scheme name\n"
        "Eligibility\n"
        "Benefits\n\n"
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
        return "No schemes found for your query. Please provide more details."
    top = names[:5]
    bullets = "\n".join([f"- {name}" for name in top])
    return f"Possible schemes for you:\n{bullets}"


def _split_documents_into_items(text: str) -> list[str]:
    """Turn raw dataset Documents text into a list of items for bullet rendering."""
    t = (text or "").strip()
    if not t:
        return []
    t = re.sub(r"[\r\n]+", " ", t)
    t = re.sub(r"\s+", " ", t).strip()

    if "Copy of" in t:
        parts = re.split(r",\s*(?=Copy of)", t)
        parts = [p.strip() for p in parts if p.strip()]
        if len(parts) >= 2:
            return parts

    segments = re.split(r"\.\s+", t)
    items = []
    for seg in segments:
        seg = seg.strip()
        if seg:
            items.append(seg.rstrip(".").strip())
    if len(items) >= 2:
        return items

    if ";" in t:
        semi = [x.strip() for x in t.split(";") if x.strip()]
        if len(semi) >= 2:
            return semi

    if "," in t:
        comma_parts = [x.strip() for x in t.split(",") if x.strip()]
        if len(comma_parts) >= 3 and max(len(p) for p in comma_parts) < 150:
            return comma_parts

    return [t]


def _clean_document_item(item: str) -> str:
    cleaned = (item or "").strip()
    if not cleaned:
        return ""
    # Remove serial numbering at beginning (e.g., "1", "1.", "1)", "(1)")
    cleaned = re.sub(r"^\(?\d+\)?[\.\)]?\s*", "", cleaned).strip()
    # Remove trailing serial numbers added in some rows (e.g., "... details 4")
    cleaned = re.sub(r"\s+\d+$", "", cleaned).strip()
    # Trim connector punctuation after stripping numbers.
    cleaned = cleaned.strip(" -:;,.")
    return cleaned


def _format_documents_bullets(documents: str) -> str:
    items = _split_documents_into_items(documents)
    if not items:
        return ""
    cleaned_items = []
    for item in items:
        cleaned = _clean_document_item(item)
        if cleaned and not cleaned.isdigit():
            cleaned_items.append(cleaned)
    if not cleaned_items:
        return ""
    return "\n".join(f"- {item}" for item in cleaned_items)


def _documents_section_from_item(item: dict[str, Any]) -> str:
    bullets = _format_documents_bullets(item.get("documents") or "")
    if not bullets:
        return ""
    return f"Documents required:\n{bullets}"


def _combined_eligibility_from_item(item: dict[str, Any]) -> str:
    base = (item.get("eligibility") or "").strip()
    min_age = (item.get("min_age") or "").strip()
    max_age = (item.get("max_age") or "").strip()
    income_limit = (item.get("income_limit") or "").strip()

    age_parts: list[str] = []
    if min_age:
        age_parts.append(f"Minimum age: {min_age}")
    if max_age:
        age_parts.append(f"Maximum age: {max_age}")
    if not min_age and not max_age:
        age_parts.append("No age limit")

    parts: list[str] = age_parts
    if income_limit:
        parts.append(f"Income limit: {income_limit}")
    else:
        parts.append("No income limit")

    combined = "; ".join(parts)
    if base:
        return f"{base}; {combined}"
    return combined


def _fallback_information_answer(item: dict[str, Any]) -> str:
    doc_block = _documents_section_from_item(item)
    doc_line = f"\n\n{doc_block}" if doc_block else ""
    eligibility_text = _combined_eligibility_from_item(item)
    return (
        f"Scheme name: {item.get('name', 'Information not available')}\n"
        f"Eligibility: {eligibility_text}\n"
        f"Benefits: {item.get('benefits', 'Information not available') or 'Information not available'}"
        f"{doc_line}"
    )


def get_chatbot_response(query: str, conversation_id: str = "default") -> str:
    state = _memory.setdefault(conversation_id, {})
    basic_intent, basic_response = _get_basic_intent_response(query)
    if basic_response:
        if basic_intent == "BYE":
            state.clear()
        return basic_response

    normalized = normalize_hinglish(query)
    mode = classify_query(normalized)

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
    answer = answer or UNKNOWN_MESSAGE
    if items and answer.strip() != UNKNOWN_MESSAGE:
        doc_block = _documents_section_from_item(items[0])
        if doc_block:
            answer = f"{answer.rstrip()}\n\n{doc_block}"
    return answer
