import json
import os
import re
import threading
from collections import Counter
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModelForSequenceClassification, AutoConfig


MODEL_NAME = "FacebookAI/xlm-roberta-base"
MAX_LENGTH = 128
DEFAULT_MODEL_DIR = "storage/models/grammar_xlm_roberta"

# Load spaCy for automated masking
import spacy
try:
    nlp = spacy.load("en_core_web_sm")
except:
    # Fail-safe if model not downloaded
    nlp = None

_MODEL_BUNDLE = None
_MODEL_LOCK = threading.Lock()


# Old XLMRMultiTaskModel removed. Using AutoModelForSequenceClassification instead.


def _clean_subtitle_text(text: str) -> str:
    if not isinstance(text, str):
        return ""

    text = re.sub(r"<[^>]*>", " ", text)
    text = re.sub(r"{\\.*?}", " ", text)
    text = re.sub(r"\[.*?\]", " ", text)
    text = re.sub(r"\(.*?\)", " ", text)
    text = text.replace("â™ª", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _resolve_model_dir() -> Path:
    env_dir = os.getenv("MOVIE_AI_MODEL_DIR")
    if env_dir:
        return Path(env_dir)

    current_file = Path(__file__).resolve()
    # Search in common locations
    search_paths = [
        current_file.parents[2] / "storage" / "models" / "grammar_xlm_roberta",
        Path(DEFAULT_MODEL_DIR)
    ]

    for candidate in search_paths:
        if candidate.exists() and (candidate / "model.safetensors").exists():
            return candidate

    raise FileNotFoundError(
        f"KhÃ´ng tÃ¬m tháº¥y thÆ° má»¥c model AI táº¡i {search_paths}. "
        "HÃ£y Ä‘áº£m báº£o model Ä‘Ã£ Ä‘Æ°á»£c Ä‘áº·t trong storage/models/grammar_xlm_roberta/."
    )


def _load_score_bins(model_dir: Path):
    with open(model_dir / "score_bins.json", "r", encoding="utf-8") as f:
        score_bins = json.load(f)

    ordered_bins = sorted(score_bins, key=lambda item: int(item["id"]))
    midpoint_vector = np.array([float(item["midpoint"]) for item in ordered_bins], dtype=np.float32)
    return ordered_bins, midpoint_vector


def _load_grammar_label_map(model_dir: Path):
    with open(model_dir / "grammar_label_map.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    id_to_label = data.get("grammar_id_to_label", {})
    return {int(key): value for key, value in id_to_label.items()}


def _score_to_label(score: float) -> str:
    if score <= 1.60:
        return "easy"
    if score <= 2.30:
        return "medium"
    return "hard"


def _score_to_cefr(score: float) -> str:
    if score <= 1.60:
        return "A2"
    if score <= 2.30:
        return "B1"
    return "B2"


def _score_to_movie_level(score: float) -> str:
    if score <= 1.60:
        return "Beginner"
    if score <= 2.30:
        return "Intermediate"
    return "Advanced"


def _build_cefr_range(cefr_ratios: dict) -> str:
    ordered = ["A2", "B1", "B2"]
    present = [label for label in ordered if cefr_ratios.get(label, 0.0) >= 0.15]
    if not present:
        return "B1"
    if len(present) == 1:
        return present[0]
    return f"{present[0]}-{present[-1]}"


def _normalize_ratios(counter: Counter, ordered_labels: list[str]) -> dict:
    total = sum(counter.values())
    if total <= 0:
        return {label: 0.0 for label in ordered_labels}
    return {label: round(counter.get(label, 0) / total, 4) for label in ordered_labels}


def load_movie_ai_bundle():
    global _MODEL_BUNDLE

    if _MODEL_BUNDLE is not None:
        return _MODEL_BUNDLE

    with _MODEL_LOCK:
        if _MODEL_BUNDLE is not None:
            return _MODEL_BUNDLE

        model_dir = _resolve_model_dir()
        grammar_id_to_label = _load_grammar_label_map(model_dir)

        tokenizer = AutoTokenizer.from_pretrained(str(model_dir), local_files_only=True)
        model = AutoModelForSequenceClassification.from_pretrained(str(model_dir), local_files_only=True)

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.to(device)
        model.eval()

        _MODEL_BUNDLE = {
            "model_dir": str(model_dir),
            "model_name": MODEL_NAME,
            "device": device,
            "tokenizer": tokenizer,
            "model": model,
            "grammar_id_to_label": grammar_id_to_label,
        }
        return _MODEL_BUNDLE


def generate_cloze_data(text: str):
    """
    Sá»­ dá»¥ng spaCy Ä‘á»ƒ tá»± Ä‘á»™ng Ä‘á»¥c lá»— Äá»™ng tá»« chÃ­nh vÃ  táº¡o Ä‘Ã¡p Ã¡n nhiá»…u.
    """
    if not nlp:
        return None

    doc = nlp(text)
    # TÃ¬m Ä‘á»™ng tá»« chÃ­nh (thÆ°á»ng lÃ  VERB, khÃ´ng pháº£i AUX)
    verbs = [token for token in doc if token.pos_ == "VERB" and not token.is_stop]
    if not verbs:
        verbs = [token for token in doc if token.pos_ == "AUX"] # Fail-safe sang trá»£ Ä‘á»™ng tá»«

    if not verbs:
        return None

    # Chá»n Ä‘á»™ng tá»« quan trá»ng nháº¥t (thÆ°á»ng lÃ  cÃ¡i Ä‘áº§u tiÃªn hoáº·c dÃ i nháº¥t, á»Ÿ Ä‘Ã¢y chá»n cÃ¡i Ä‘áº§u tiÃªn)
    target = verbs[0]
    lemma = target.lemma_.lower()

    # Sinh Ä‘Ã¡p Ã¡n nhiá»…u cÆ¡ báº£n dá»±a trÃªn lemma (Gá»£i Ã½ quy luáº­t)
    distractors = set()
    if lemma.endswith('e'):
        distractors.add(lemma + "ing")
    else:
        distractors.add(lemma + "ing")

    distractors.add(lemma + "ed")
    distractors.add(lemma + "s")
    distractors.add(lemma)

    # Loáº¡i bá» Ä‘Ã¡p Ã¡n Ä‘Ãºng ra khá»i list nhiá»…u
    distractors.discard(target.text.lower())

    # Format tráº£ vá» cho Frontend
    final_distractors = list(distractors)[:3] # Láº¥y tá»‘i Ä‘a 3 cÃ¡i

    return {
        "masked_text": text.replace(target.text, "____", 1),
        "target_word": target.text,
        "distractors": final_distractors,
        "cloze_type": "grammar_verb"
    }

def _predict_grammar_only(cleaned_rows: list[dict], batch_size: int = 16) -> list[dict]:
    bundle = load_movie_ai_bundle()
    tokenizer = bundle["tokenizer"]
    model = bundle["model"]
    device = bundle["device"]
    grammar_id_to_label = bundle["grammar_id_to_label"]

    results = []
    for index in range(0, len(cleaned_rows), batch_size):
        batch_rows = cleaned_rows[index:index + batch_size]
        texts = [row["subtitle_text_clean"] for row in batch_rows]
        encoded = tokenizer(
            texts,
            truncation=True,
            padding=True,
            max_length=MAX_LENGTH,
            return_tensors="pt",
        )
        encoded = {key: value.to(device) for key, value in encoded.items()}

        with torch.no_grad():
            outputs = model(**encoded)
            logits = outputs.logits

        probs = torch.softmax(logits, dim=-1).cpu().numpy()
        pred_ids = np.argmax(probs, axis=-1)

        for row, prob, g_idx in zip(batch_rows, probs, pred_ids):
            label = grammar_id_to_label.get(int(g_idx), "unknown")
            # Táº¡o Cloze Data tá»± Ä‘á»™ng
            cloze = generate_cloze_data(row["subtitle_text_clean"])

            results.append({
                "scene_id": row["scene_id"],
                "subtitle_text_clean": row["subtitle_text_clean"],
                "start_time": row["start_time"],
                "end_time": row["end_time"],
                "grammar_tag": label,
                "grammar_tag_id": int(g_idx),
                "confidence": float(np.max(prob)),
                "cloze_data": cloze
            })

    return results


def analyze_video_subtitles_service(video, subtitles) -> dict:
    from ..extensions import db

    cleaned_rows = []
    # Dictionary to map subtitle scene_id back to subtitle object
    id_to_sub = { f"subtitle_{s.id}": s for s in subtitles }

    # Clear stale AI metadata before writing a fresh analysis pass.
    for subtitle in subtitles:
        subtitle.grammar_tag_id = None
        subtitle.cloze_data = None

    for subtitle in subtitles:
        cleaned_text = _clean_subtitle_text(subtitle.content_en)
        # Bá» qua cÃ¢u quÃ¡ ngáº¯n (< 3 tá»«) Ä‘á»ƒ AI ko dÃ¡n nhÃ£n bá»«a
        if not cleaned_text or len(cleaned_text.split()) < 3:
            continue

        cleaned_rows.append(
            {
                "scene_id": f"subtitle_{subtitle.id}",
                "subtitle_text_clean": cleaned_text,
                "start_time": float(subtitle.start_time or 0),
                "end_time": float(subtitle.end_time or 0),
            }
        )

    if not cleaned_rows:
        raise ValueError("Video nÃ y chÆ°a cÃ³ subtitle tiáº¿ng Anh Ä‘á»§ dÃ i (>= 3 tá»«) Ä‘á»ƒ dÃ¡n nhÃ£n ngá»¯ phÃ¡p.")

    # Gá»i bá»™ nÃ£o AI 12 thÃ¬
    predictions = _predict_grammar_only(cleaned_rows)

    # LÆ°u káº¿t quáº£ vÃ o Database cho tá»«ng Subtitle
    for pred in predictions:
        sub_obj = id_to_sub.get(pred["scene_id"])
        if sub_obj:
            sub_obj.grammar_tag_id = pred["grammar_tag_id"]
            sub_obj.cloze_data = pred["cloze_data"]

    db.session.commit()

    grammar_counter = Counter(item["grammar_tag"] for item in predictions)
    dominant_grammar_tags = [tag for tag, _ in grammar_counter.most_common(5)]

    results = {
        "video_id": video.id,
        "video_title": video.title,
        "segment_count": len(predictions),
        "dominant_grammar_tags": dominant_grammar_tags,
        "predicted_segments": predictions,
        "model_meta": {
            "model_name": "XLM-Roberta-Grammar-Only",
            "model_dir": load_movie_ai_bundle()["model_dir"],
            "mode": "grammar_classification_v2",
        },
    }
    return results


def analyze_subtitle_content_service(subtitle_content: str, source_name: str | None = None) -> dict:
    from ..utils.subtitle_utils import parse_srt, parse_vtt

    normalized_content = (subtitle_content or "").replace("\r\n", "\n").replace("\r", "\n").strip()
    if not normalized_content:
        raise ValueError("Noi dung subtitle trong.")

    lowered_name = (source_name or "").lower()
    is_vtt = lowered_name.endswith(".vtt") or normalized_content.upper().startswith("WEBVTT")
    parser = parse_vtt if is_vtt else parse_srt
    parsed_entries = parser(normalized_content)

    cleaned_rows = []
    for index, entry in enumerate(parsed_entries, start=1):
        cleaned_text = _clean_subtitle_text(entry.get("text"))
        if not cleaned_text or len(cleaned_text.split()) < 3:
            continue

        start_time = float(entry.get("start_time", 0) or 0)
        end_time = float(entry.get("end_time", 0) or 0)
        cleaned_rows.append(
            {
                "scene_id": f"segment_{index:05d}",
                "subtitle_text_clean": cleaned_text,
                "start_time": start_time,
                "end_time": end_time,
            }
        )

    if not cleaned_rows:
        raise ValueError("Khong parse duoc subtitle du dai (>= 3 tu) tu noi dung gui len.")

    predictions = _predict_grammar_only(cleaned_rows)
    grammar_counter = Counter(item["grammar_tag"] for item in predictions)
    dominant_grammar_tags = [tag for tag, _ in grammar_counter.most_common(5)]

    return {
        "source_name": source_name or ("uploaded_subtitle.vtt" if is_vtt else "uploaded_subtitle.srt"),
        "segment_count": len(predictions),
        "dominant_grammar_tags": dominant_grammar_tags,
        "predicted_segments": predictions,
        "model_meta": {
            "model_name": "XLM-Roberta-Grammar-Only",
            "model_dir": load_movie_ai_bundle()["model_dir"],
            "mode": "grammar_classification_v2",
        },
    }


def mark_video_ai_analysis_processing_service(video):
    from ..extensions import db
    from ..models.models_model import MovieAIAnalysis

    analysis = MovieAIAnalysis.query.filter_by(video_id=video.id).first()
    if not analysis:
        analysis = MovieAIAnalysis(video_id=video.id)
        db.session.add(analysis)

    analysis.model_name = "XLM-Roberta-Grammar-Only"
    analysis.model_mode = "grammar_classification_v2"
    analysis.segment_count = 0
    analysis.movie_score = 0.0
    analysis.movie_level = "Grammar Optimized"
    analysis.movie_cefr_range = ""
    analysis.difficulty_ratios = {}
    analysis.cefr_ratios = {}
    analysis.dominant_grammar_tags = []
    analysis.top_hard_segments = []
    analysis.status = "PROCESSING"
    analysis.error_message = None

    db.session.commit()
    return analysis


def save_video_ai_analysis_service(video, subtitles) -> dict:
    from ..extensions import db
    from ..models.models_model import MovieAIAnalysis

    # Thá»±c hiá»‡n phÃ¢n tÃ­ch ngá»¯ phÃ¡p vÃ  Ä‘á»¥c lá»—
    mark_video_ai_analysis_processing_service(video)
    report = analyze_video_subtitles_service(video, subtitles)

    analysis = MovieAIAnalysis.query.filter_by(video_id=video.id).first()
    if not analysis:
        analysis = MovieAIAnalysis(video_id=video.id)
        db.session.add(analysis)

    analysis.model_name = report["model_meta"].get("model_name", "XLM-Roberta-Grammar-Only")
    analysis.model_mode = report["model_meta"].get("mode", "grammar_classification_v2")
    analysis.segment_count = int(report["segment_count"])
    # Äáº·t cÃ¡c giÃ¡ trá»‹ cÅ© vá» 0 vÃ¬ model nÃ y khÃ´ng dá»± Ä‘oÃ¡n Ä‘á»™ khÃ³
    analysis.movie_score = 0.0
    analysis.movie_level = "Grammar Optimized"
    analysis.movie_cefr_range = ""
    analysis.difficulty_ratios = {}
    analysis.cefr_ratios = {}
    analysis.dominant_grammar_tags = report["dominant_grammar_tags"]
    analysis.top_hard_segments = []
    analysis.status = "PROCESSING"
    analysis.error_message = None

    db.session.commit()

    # [VTT_OPTIMIZATION] Export enriched VTT immediately after AI finishes
    from .video_service import export_subtitle_to_vtt
    export_subtitle_to_vtt(video.id)

    analysis.status = "READY"
    db.session.commit()

    return report

def save_video_ai_analysis_failure_service(video, error_message: str):
    from ..extensions import db
    from ..models.models_model import MovieAIAnalysis

    analysis = MovieAIAnalysis.query.filter_by(video_id=video.id).first()
    if not analysis:
        analysis = MovieAIAnalysis(
            video_id=video.id,
            model_name="XLM-Roberta-Grammar-Only",
            model_mode="grammar_classification_v2",
            segment_count=0,
            movie_score=0.0,
            movie_level="FAILED",
            movie_cefr_range="",
            difficulty_ratios={},
            cefr_ratios={},
        )
        db.session.add(analysis)

    analysis.status = "FAILED"
    analysis.error_message = error_message
    analysis.dominant_grammar_tags = []
    analysis.top_hard_segments = []

    db.session.commit()
    return analysis
