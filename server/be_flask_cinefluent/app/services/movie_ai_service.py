import json
import os
import re
import threading
from collections import Counter
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from transformers import AutoTokenizer, XLMRobertaConfig, XLMRobertaModel


MODEL_NAME = "FacebookAI/xlm-roberta-base"
MAX_LENGTH = 128
DEFAULT_MODEL_DIR = "/app/ai_models/movie_difficulty_multitask"

_MODEL_BUNDLE = None
_MODEL_LOCK = threading.Lock()


class XLMRMultiTaskModel(nn.Module):
    def __init__(self, num_difficulty_labels: int, num_grammar_labels: int):
        super().__init__()
        # The Colab checkpoint was trained from xlm-roberta-base.
        # We recreate the encoder architecture with matching XLM-R defaults
        # before loading the saved state_dict from multitask_model.pt.
        encoder_config = XLMRobertaConfig(
            vocab_size=250002,
            max_position_embeddings=514,
            type_vocab_size=1,
            hidden_size=768,
            num_hidden_layers=12,
            num_attention_heads=12,
            intermediate_size=3072,
            hidden_dropout_prob=0.1,
            attention_probs_dropout_prob=0.1,
            pad_token_id=1,
            bos_token_id=0,
            eos_token_id=2,
        )
        self.encoder = XLMRobertaModel(encoder_config)
        hidden_size = self.encoder.config.hidden_size
        dropout_prob = getattr(self.encoder.config, "hidden_dropout_prob", 0.1)

        self.dropout = nn.Dropout(dropout_prob)
        self.difficulty_head = nn.Linear(hidden_size, num_difficulty_labels)
        self.grammar_head = nn.Linear(hidden_size, num_grammar_labels)

    def forward(self, input_ids=None, attention_mask=None):
        outputs = self.encoder(
            input_ids=input_ids,
            attention_mask=attention_mask,
            return_dict=True,
        )
        pooled = outputs.last_hidden_state[:, 0]
        pooled = self.dropout(pooled)
        difficulty_logits = self.difficulty_head(pooled)
        grammar_logits = self.grammar_head(pooled)
        return difficulty_logits, grammar_logits


def _clean_subtitle_text(text: str) -> str:
    if not isinstance(text, str):
        return ""

    text = re.sub(r"<[^>]*>", " ", text)
    text = re.sub(r"{\\.*?}", " ", text)
    text = re.sub(r"\[.*?\]", " ", text)
    text = re.sub(r"\(.*?\)", " ", text)
    text = text.replace("♪", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _resolve_model_dir() -> Path:
    env_dir = os.getenv("MOVIE_AI_MODEL_DIR")
    candidates = []
    if env_dir:
        candidates.append(Path(env_dir))

    candidates.append(Path(DEFAULT_MODEL_DIR))

    current_file = Path(__file__).resolve()
    for parent in current_file.parents:
        candidates.append(parent / "ai_bootstrap" / "models" / "movie_difficulty_multitask")

    for candidate in candidates:
        if candidate.exists():
            return candidate

    raise FileNotFoundError(
        "Không tìm thấy thư mục model AI. Hãy mount model vào /app/ai_models/movie_difficulty_multitask "
        "hoặc đặt trong ai_bootstrap/models/movie_difficulty_multitask."
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
        required_files = [
            "multitask_model.pt",
            "tokenizer.json",
            "tokenizer_config.json",
            "score_bins.json",
            "grammar_label_map.json",
        ]
        missing_files = [name for name in required_files if not (model_dir / name).exists()]
        if missing_files:
            raise FileNotFoundError(
                f"Thiếu file model AI trong {model_dir}: {', '.join(missing_files)}"
            )

        score_bins, midpoint_vector = _load_score_bins(model_dir)
        grammar_id_to_label = _load_grammar_label_map(model_dir)

        tokenizer = AutoTokenizer.from_pretrained(str(model_dir), local_files_only=True)

        model = XLMRMultiTaskModel(
            num_difficulty_labels=len(score_bins),
            num_grammar_labels=len(grammar_id_to_label),
        )
        state_dict = torch.load(model_dir / "multitask_model.pt", map_location="cpu")
        model.load_state_dict(state_dict)

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.to(device)
        model.eval()

        _MODEL_BUNDLE = {
            "model_dir": str(model_dir),
            "model_name": MODEL_NAME,
            "device": device,
            "tokenizer": tokenizer,
            "model": model,
            "score_bins": score_bins,
            "midpoint_vector": midpoint_vector,
            "grammar_id_to_label": grammar_id_to_label,
        }
        return _MODEL_BUNDLE


def _predict_subtitles(cleaned_rows: list[dict], batch_size: int = 16) -> list[dict]:
    bundle = load_movie_ai_bundle()
    tokenizer = bundle["tokenizer"]
    model = bundle["model"]
    device = bundle["device"]
    midpoint_vector = bundle["midpoint_vector"]
    grammar_id_to_label = bundle["grammar_id_to_label"]

    predictions = []
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
            difficulty_logits, grammar_logits = model(**encoded)

        difficulty_probs = torch.softmax(difficulty_logits, dim=-1).cpu().numpy()
        grammar_probs = torch.softmax(grammar_logits, dim=-1).cpu().numpy()
        pred_scores = difficulty_probs @ midpoint_vector
        pred_grammar_ids = np.argmax(grammar_probs, axis=-1)

        for row, pred_score, diff_prob, grammar_prob, grammar_idx in zip(
            batch_rows,
            pred_scores,
            difficulty_probs,
            grammar_probs,
            pred_grammar_ids,
        ):
            predictions.append(
                {
                    "scene_id": row["scene_id"],
                    "subtitle_text_clean": row["subtitle_text_clean"],
                    "duration": round(float(row["duration"]), 3),
                    "start_time": round(float(row["start_time"]), 3),
                    "end_time": round(float(row["end_time"]), 3),
                    "pred_score": round(float(pred_score), 4),
                    "pred_label": _score_to_label(float(pred_score)),
                    "pred_cefr": _score_to_cefr(float(pred_score)),
                    "pred_grammar_tag": grammar_id_to_label.get(int(grammar_idx), "unknown"),
                    "difficulty_confidence": round(float(np.max(diff_prob)), 4),
                    "grammar_confidence": round(float(np.max(grammar_prob)), 4),
                }
            )

    return predictions


def analyze_video_subtitles_service(video, subtitles) -> dict:
    cleaned_rows = []
    for subtitle in subtitles:
        cleaned_text = _clean_subtitle_text(subtitle.content_en)
        if not cleaned_text:
            continue

        duration = max(float(subtitle.end_time or 0) - float(subtitle.start_time or 0), 0.1)
        cleaned_rows.append(
            {
                "scene_id": f"subtitle_{subtitle.id}",
                "subtitle_text_clean": cleaned_text,
                "duration": duration,
                "start_time": float(subtitle.start_time or 0),
                "end_time": float(subtitle.end_time or 0),
            }
        )

    if not cleaned_rows:
        raise ValueError("Video này chưa có subtitle tiếng Anh hợp lệ để phân tích.")

    predictions = _predict_subtitles(cleaned_rows)

    weights = np.array([max(item["duration"], 0.1) for item in predictions], dtype=np.float32)
    scores = np.array([item["pred_score"] for item in predictions], dtype=np.float32)
    movie_score = float(np.average(scores, weights=weights))

    difficulty_counter = Counter(item["pred_label"] for item in predictions)
    cefr_counter = Counter(item["pred_cefr"] for item in predictions)
    grammar_counter = Counter(item["pred_grammar_tag"] for item in predictions)

    difficulty_ratios = _normalize_ratios(difficulty_counter, ["easy", "medium", "hard"])
    cefr_ratios = _normalize_ratios(cefr_counter, ["A2", "B1", "B2"])
    dominant_grammar_tags = [tag for tag, _ in grammar_counter.most_common(3)]

    top_hard_segments = sorted(
        predictions,
        key=lambda item: (item["pred_score"], item["difficulty_confidence"], item["duration"]),
        reverse=True,
    )[:10]

    return {
        "video_id": video.id,
        "video_title": video.title,
        "segment_count": len(predictions),
        "movie_score": round(movie_score, 4),
        "movie_level": _score_to_movie_level(movie_score),
        "movie_cefr_range": _build_cefr_range(cefr_ratios),
        "difficulty_ratios": difficulty_ratios,
        "cefr_ratios": cefr_ratios,
        "dominant_grammar_tags": dominant_grammar_tags,
        "top_hard_segments": top_hard_segments,
        "predicted_segments": predictions,
        "model_meta": {
            "model_name": MODEL_NAME,
            "model_dir": load_movie_ai_bundle()["model_dir"],
            "mode": "multitask_inference",
        },
    }


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
        if not cleaned_text:
            continue

        start_time = float(entry.get("start_time", 0) or 0)
        end_time = float(entry.get("end_time", 0) or 0)
        cleaned_rows.append(
            {
                "scene_id": f"segment_{index:05d}",
                "subtitle_text_clean": cleaned_text,
                "duration": max(end_time - start_time, 0.1),
                "start_time": start_time,
                "end_time": end_time,
            }
        )

    if not cleaned_rows:
        raise ValueError("Khong parse duoc subtitle hop le tu noi dung gui len.")

    predictions = _predict_subtitles(cleaned_rows)

    weights = np.array([max(item["duration"], 0.1) for item in predictions], dtype=np.float32)
    scores = np.array([item["pred_score"] for item in predictions], dtype=np.float32)
    movie_score = float(np.average(scores, weights=weights))

    difficulty_counter = Counter(item["pred_label"] for item in predictions)
    cefr_counter = Counter(item["pred_cefr"] for item in predictions)
    grammar_counter = Counter(item["pred_grammar_tag"] for item in predictions)

    difficulty_ratios = _normalize_ratios(difficulty_counter, ["easy", "medium", "hard"])
    cefr_ratios = _normalize_ratios(cefr_counter, ["A2", "B1", "B2"])
    dominant_grammar_tags = [tag for tag, _ in grammar_counter.most_common(3)]

    top_hard_segments = sorted(
        predictions,
        key=lambda item: (item["pred_score"], item["difficulty_confidence"], item["duration"]),
        reverse=True,
    )[:10]

    return {
        "source_name": source_name or ("uploaded_subtitle.vtt" if is_vtt else "uploaded_subtitle.srt"),
        "segment_count": len(predictions),
        "movie_score": round(movie_score, 4),
        "movie_level": _score_to_movie_level(movie_score),
        "movie_cefr_range": _build_cefr_range(cefr_ratios),
        "difficulty_ratios": difficulty_ratios,
        "cefr_ratios": cefr_ratios,
        "dominant_grammar_tags": dominant_grammar_tags,
        "top_hard_segments": top_hard_segments,
        "predicted_segments": predictions,
        "model_meta": {
            "model_name": MODEL_NAME,
            "model_dir": load_movie_ai_bundle()["model_dir"],
            "mode": "multitask_inference",
        },
    }


def save_video_ai_analysis_service(video, subtitles) -> dict:
    from ..extensions import db
    from ..models.models_model import MovieAIAnalysis

    report = analyze_video_subtitles_service(video, subtitles)

    analysis = MovieAIAnalysis.query.filter_by(video_id=video.id).first()
    if not analysis:
        analysis = MovieAIAnalysis(video_id=video.id)
        db.session.add(analysis)

    analysis.model_name = report["model_meta"].get("model_name", MODEL_NAME)
    analysis.model_mode = report["model_meta"].get("mode", "multitask_inference")
    analysis.segment_count = int(report["segment_count"])
    analysis.movie_score = float(report["movie_score"])
    analysis.movie_level = report["movie_level"]
    analysis.movie_cefr_range = report["movie_cefr_range"]
    analysis.difficulty_ratios = report["difficulty_ratios"]
    analysis.cefr_ratios = report["cefr_ratios"]
    analysis.dominant_grammar_tags = report["dominant_grammar_tags"]
    analysis.top_hard_segments = report["top_hard_segments"][:10]
    analysis.status = "READY"
    analysis.error_message = None

    db.session.commit()
    return report
def save_video_ai_analysis_failure_service(video, error_message: str):
    from ..extensions import db
    from ..models.models_model import MovieAIAnalysis

    analysis = MovieAIAnalysis.query.filter_by(video_id=video.id).first()
    if not analysis:
        analysis = MovieAIAnalysis(
            video_id=video.id,
            model_name=MODEL_NAME,
            model_mode="multitask_inference",
            segment_count=0,
            movie_score=0.0,
            movie_level="Unknown",
            movie_cefr_range="Unknown",
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
