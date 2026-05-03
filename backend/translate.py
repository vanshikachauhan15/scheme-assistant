from __future__ import annotations
from dotenv import load_dotenv
load_dotenv()
import re
import os
import sys
import html
from typing import List
import requests


# -----------------------------
# CLIENT SETUP
# -----------------------------

def get_translate_api_key() -> str:
    api_key = os.getenv("GOOGLE_TRANSLATE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_TRANSLATE_API_KEY not set")
    return api_key


# -----------------------------
# BASIC TRANSLATION
# -----------------------------
def translate_text(text: str, target_language: str = "hi") -> str:
    if not text or not text.strip():
        return text

    api_key = get_translate_api_key()
    endpoint = "https://translation.googleapis.com/language/translate/v2"
    payload = {
        "q": text,
        "target": target_language,
        "format": "text",
    }
    params = {"key": api_key}

    try:
        resp = requests.post(endpoint, params=params, json=payload, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        translated = data["data"]["translations"][0]["translatedText"]
        return html.unescape(translated)
    except Exception as exc:
        print(f"ERROR in translate_text: {str(exc)}", file=sys.stderr)
        return text


# -----------------------------
# BETTER TRANSLATION FOR LONG TEXT
# -----------------------------
 # 👈 add this at top of file if not present

def translate_long_text(text: str, target_language: str = "hi") -> str:
    if not text:
        return text

    # 🔥 Step 1: clean problematic symbols
    text = text.replace("₹", "rupees ")
    text = text.replace("/-", "")
    text = text.replace("\n", " ")

    # 🔥 Step 2: normalize technical words
    text = text.replace("DBT", "Direct Benefit Transfer")

    # 🔥 Step 3: smart sentence splitting
    sentences = re.split(r'(?<=[.!?])\s+', text)

    translated_sentences = []

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue

        try:
            translated = translate_text(sentence, target_language)
            translated_sentences.append(translated)
        except Exception:
            translated_sentences.append(sentence)

    # 🔥 Step 4: join properly
    return " ".join(translated_sentences)

# -----------------------------
# SIMPLE HINDI LABELS
# -----------------------------
FIELD_NAME_MAP = {
    "scheme name": "योजना का नाम",
    "eligibility": "कौन लोग ले सकते हैं",
    "benefits": "क्या फायदा मिलेगा",
    "application process": "कैसे आवेदन करें",
    "documents required": "कौन से कागज चाहिए",
    "description": "योजना का विवरण",
    "state": "राज्य",
    "minimum age": "न्यूनतम उम्र",
    "maximum age": "अधिकतम उम्र",
    "income limit": "आय सीमा",
}


# -----------------------------
# MAIN FUNCTION
# -----------------------------
def parse_and_translate_response(response: str, target_language: str = "hi") -> str:
    if not response or not response.strip():
        return response

    print(f"Starting translation: {len(response)} chars", file=sys.stderr)

    lines = response.split("\n")
    translated_lines: List[str] = []

    field_prefixes = list(FIELD_NAME_MAP.keys())

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        if not line:
            translated_lines.append("")
            i += 1
            continue

        line_lower = line.lower()

        # Detect field
        matched_prefix = None
        for prefix in field_prefixes:
            if line_lower.startswith(prefix):
                matched_prefix = prefix
                break

        if matched_prefix and ":" in line:
            parts = line.split(":", 1)
            field_name = parts[0].strip()
            field_value = parts[1].strip() if len(parts) > 1 else ""

            # Skip the Application process field entirely
            if matched_prefix == "application process":
                j = i + 1
                while j < len(lines):
                    next_line = lines[j].strip().lower()
                    if any(next_line.startswith(p) for p in field_prefixes):
                        break
                    j += 1
                i = j
                continue

            # Collect multiline content
            field_lines = [field_value] if field_value else []
            j = i + 1

            while j < len(lines):
                next_line = lines[j].strip()
                next_lower = next_line.lower()

                if any(next_lower.startswith(p) for p in field_prefixes):
                    break

                field_lines.append(next_line)
                j += 1

            full_value = "\n".join(field_lines).strip()

            # 🔥 IMPORTANT: use long text translator
            translated_value = translate_long_text(full_value, target_language)

            # Simple Hindi label
            simple_label = FIELD_NAME_MAP.get(matched_prefix, field_name)

            translated_lines.append(f"{simple_label}: {translated_value}")

            i = j
            continue

        # Non-field text
        translated_line = translate_long_text(line, target_language)
        translated_lines.append(translated_line)

        i += 1

    result = "\n".join(translated_lines)

    print(f"Translation complete: {len(result)} chars", file=sys.stderr)

    return result