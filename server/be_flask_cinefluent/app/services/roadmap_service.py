import json
import random
import re
from typing import Any

from google.genai import types

from ..extensions import db
from ..models.models_model import (
    AIAssessment,
    DailyTask,
    Flashcard,
    StudyRoadmap,
    WatchHistory,
)
from ..utils.ai_engine import cinefluent_ai


ASSESSMENT_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-8b"]
ROADMAP_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-8b"]
DAILY_TASK_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-8b"]
ALLOWED_ROADMAP_DURATIONS = {30, 60, 90}

ASSESSMENT_FALLBACK_POOL = [
    {
        "listening": {
            "audio_script": "Cinematography is the art of photography and visual storytelling in a motion picture. It involves technical choices like lighting and camera movement.",
            "questions": [
                {
                    "question": "What is cinematography?",
                    "options": [
                        "Acting in movies",
                        "Visual storytelling",
                        "Sound editing",
                        "Writing scripts",
                    ],
                    "answer": "Visual storytelling",
                },
                {
                    "question": "What does it involve?",
                    "options": ["Cooking", "Lighting", "Dancing", "Singing"],
                    "answer": "Lighting",
                },
                {
                    "question": "Where is it used?",
                    "options": [
                        "In books",
                        "In motion pictures",
                        "In radio",
                        "In paintings",
                    ],
                    "answer": "In motion pictures",
                },
                {
                    "question": "Cinematography is primarily concerned with...",
                    "options": [
                        "Visual content",
                        "The budget",
                        "The actors' pay",
                        "The theater layout",
                    ],
                    "answer": "Visual content",
                },
            ],
        },
        "reading": {
            "passage": "Modern cinema relies heavily on Digital Image Processing (DIP) to create realistic visual effects...",
            "questions": [
                {
                    "question": "What is DIP used for?",
                    "options": ["Scripts", "Visual effects", "Audio", "Marketing"],
                    "answer": "Visual effects",
                },
                {
                    "question": "What does 'Modern' mean here?",
                    "options": ["Old", "Current", "Future", "Ancient"],
                    "answer": "Current",
                },
                {
                    "question": "Is DIP essential for visual effects?",
                    "options": ["No", "Yes", "Maybe", "Only for audio"],
                    "answer": "Yes",
                },
                {
                    "question": "Digital Image Processing is basically...",
                    "options": [
                        "Analog film",
                        "The core of modern VFX",
                        "A type of projector",
                        "A popcorn brand",
                    ],
                    "answer": "The core of modern VFX",
                },
            ],
        },
        "writing": {
            "topic": "The impact of special effects on storytelling in modern blockbusters.",
            "min_words": 150,
        },
        "speaking": {
            "prompt": "Describe a movie with impressive visual effects that you have watched."
        },
    },
    {
        "listening": {
            "audio_script": "The role of a film director is like the conductor of an orchestra. They must balance creative vision with the technical requirements of production.",
            "questions": [
                {
                    "question": "A director is compared to...",
                    "options": ["A chef", "A conductor", "A pilot", "A teacher"],
                    "answer": "A conductor",
                },
                {
                    "question": "What must they balance?",
                    "options": [
                        "Money and time",
                        "Vision and technicality",
                        "Actors and script",
                        "Camera and lights",
                    ],
                    "answer": "Vision and technicality",
                },
                {
                    "question": "Is the role creative?",
                    "options": ["No", "Partially", "Highly creative", "Only technical"],
                    "answer": "Highly creative",
                },
                {
                    "question": "The primary goal of a director is to...",
                    "options": [
                        "Manage the budget",
                        "Direct the creative flow",
                        "Write the music",
                        "Design costumes",
                    ],
                    "answer": "Direct the creative flow",
                },
            ],
        },
        "reading": {
            "passage": "Method acting is a technique where actors aspire to create a sincere emotional performance by inhabiting the psyche of their character...",
            "questions": [
                {
                    "question": "What is method acting?",
                    "options": [
                        "Script reading",
                        "Emotional inhabitation",
                        "Learning stunts",
                        "Directing others",
                    ],
                    "answer": "Emotional inhabitation",
                },
                {
                    "question": "What do actors aspire to?",
                    "options": [
                        "Sincere performance",
                        "High salary",
                        "Fame",
                        "Better lighting",
                    ],
                    "answer": "Sincere performance",
                },
                {
                    "question": "Does it involve the psyche?",
                    "options": ["No", "Yes", "Only physical", "Only for voice"],
                    "answer": "Yes",
                },
                {
                    "question": "Character inhabitation leads to...",
                    "options": [
                        "Confusion",
                        "Emotional sincerity",
                        "Accidents",
                        "Better scripts",
                    ],
                    "answer": "Emotional sincerity",
                },
            ],
        },
        "writing": {
            "topic": "Should actors undergo extreme physical changes for their roles? Discuss the ethics.",
            "min_words": 150,
        },
        "speaking": {
            "prompt": "Tell me about an actor whose performance you found particularly moving and why."
        },
    },
    {
        "listening": {
            "audio_script": "Documentaries aim to educate while entertaining. Unlike fiction, they rely on interviews and real-world footage to tell stories of our reality.",
            "questions": [
                {
                    "question": "What is the aim of documentaries?",
                    "options": [
                        "Educate and entertain",
                        "Only scare",
                        "Make money",
                        "Hide truth",
                    ],
                    "answer": "Educate and entertain",
                },
                {
                    "question": "What do they rely on?",
                    "options": [
                        "Fake news",
                        "Interviews and real footage",
                        "Actors only",
                        "CGI",
                    ],
                    "answer": "Interviews and real footage",
                },
                {
                    "question": "Are they fiction?",
                    "options": ["Yes", "Sometimes", "No", "Always"],
                    "answer": "No",
                },
                {
                    "question": "Documentaries provide a glimpse into...",
                    "options": ["Fantasy", "Reality", "The future", "History only"],
                    "answer": "Reality",
                },
            ],
        },
        "reading": {
            "passage": "Film festivals like Cannes or Sundance play a vital role in showcasing independent films that might not reach mainstream theaters...",
            "questions": [
                {
                    "question": "What festivals are mentioned?",
                    "options": ["Oscars", "Cannes and Sundance", "Grammys", "MTV"],
                    "answer": "Cannes and Sundance",
                },
                {
                    "question": "What movies do they showcase?",
                    "options": [
                        "Blockbusters",
                        "Independent films",
                        "Horror only",
                        "Old movies",
                    ],
                    "answer": "Independent films",
                },
                {
                    "question": "Do these reach mainstream easily?",
                    "options": ["Yes", "No", "Always", "Frequently"],
                    "answer": "No",
                },
                {
                    "question": "Festivals provide platform for...",
                    "options": [
                        "Rich studios",
                        "Independent voices",
                        "Famous stars",
                        "Critics",
                    ],
                    "answer": "Independent voices",
                },
            ],
        },
        "writing": {
            "topic": "Why are independent films important for the diversity of culture?",
            "min_words": 150,
        },
        "speaking": {
            "prompt": "Talk about a non-mainstream or foreign film you enjoyed."
        },
    },
]

GRAMMAR_TOPICS = [
    "Hiện tại đơn",
    "Hiện tại tiếp diễn",
    "Quá khứ đơn",
    "Quá khứ tiếp diễn",
    "Tương lai đơn",
    "Hiện tại hoàn thành",
    "So sánh hơn",
    "So sánh nhất",
    "Câu điều kiện loại 1",
    "Câu điều kiện loại 2",
    "Bị động cơ bản",
    "Mệnh đề quan hệ",
    "Động từ khuyết thiếu",
    "Câu tường thuật",
    "Danh động từ và To-infinitive",
]

VOCAB_TOPICS = [
    "gia đình",
    "giáo dục",
    "công việc",
    "du lịch",
    "cảm xúc",
    "phim ảnh",
    "công nghệ",
    "ẩm thực",
    "sức khỏe",
    "môi trường",
    "bạn bè",
    "giao tiếp",
    "thời trang",
    "giải trí",
    "mục tiêu cá nhân",
]


def get_user_context(user_id: str):
    recent_history = (
        WatchHistory.query.filter_by(user_id=user_id)
        .order_by(WatchHistory.watched_at.desc())
        .limit(10)
        .all()
    )

    movie_titles = []
    movie_genres = set()
    for item in recent_history:
        if item.video:
            movie_titles.append(item.video.title)
            for category in item.video.categories:
                movie_genres.add(category.name)

    recent_flashcards = (
        Flashcard.query.filter_by(user_id=user_id)
        .order_by(Flashcard.created_at.desc())
        .limit(20)
        .all()
    )

    vocab_list = []
    for vocab in recent_flashcards:
        meaning = vocab.definition_vi or ""
        vocab_list.append(f"{vocab.word} ({meaning})")

    return {
        "recent_movies": movie_titles,
        "favorite_genres": list(movie_genres) if movie_genres else ["Action", "Comedy", "Drama"],
        "recent_vocabulary": vocab_list,
    }


def _normalize_text(value: Any) -> str:
    if value is None:
        return ""
    return " ".join(str(value).strip().lower().split())


def _round_band(score: float) -> float:
    return round(max(0.0, min(9.0, score)) * 2) / 2


def _compact_prompt(text: str, max_length: int, fallback: str) -> str:
    cleaned = " ".join((text or "").split())
    if not cleaned:
        return fallback

    first_sentence = re.split(r"(?<=[.!?])\s+", cleaned)[0].strip()
    compact = first_sentence or cleaned
    if len(compact) <= max_length:
        return compact

    return f"{compact[: max_length - 3].rstrip()}..."


def compact_assessment_payload(assessment_payload: dict):
    if not assessment_payload:
        return assessment_payload

    writing_payload = assessment_payload.get("writing") or {}
    writing_payload["topic"] = _compact_prompt(
        writing_payload.get("topic", ""),
        120,
        "Nêu ý kiến về tác động của một bộ phim bạn yêu thích.",
    )
    writing_payload["min_words"] = max(
        120,
        min(int(writing_payload.get("min_words", 150) or 150), 200),
    )
    assessment_payload["writing"] = writing_payload

    speaking_payload = assessment_payload.get("speaking") or {}
    speaking_payload["prompt"] = _compact_prompt(
        speaking_payload.get("prompt", ""),
        90,
        "Nói ngắn gọn về một bộ phim bạn thích.",
    )
    assessment_payload["speaking"] = speaking_payload

    return assessment_payload


def _estimate_mc_band(correct_answers: int, total_questions: int) -> float:
    if total_questions <= 0:
        return 0.0
    ratio = correct_answers / total_questions
    if ratio == 1:
        return 8.0
    if ratio >= 0.75:
        return 6.5
    if ratio >= 0.5:
        return 5.0
    if ratio >= 0.25:
        return 3.5
    if ratio > 0:
        return 2.5
    return 1.0


def _extract_section_answer(section_answers: Any, index: int) -> Any:
    if isinstance(section_answers, list):
        return section_answers[index] if index < len(section_answers) else None
    if isinstance(section_answers, dict):
        return section_answers.get(str(index), section_answers.get(index))
    return None


def _build_mc_section_review(section_payload: dict, submitted_answers: Any):
    questions = section_payload.get("questions", []) if isinstance(section_payload, dict) else []
    review_items = []
    correct_answers = 0

    for index, question in enumerate(questions):
        user_answer = _extract_section_answer(submitted_answers, index)
        correct_answer = question.get("answer")
        is_correct = _normalize_text(user_answer) == _normalize_text(correct_answer)
        if is_correct:
            correct_answers += 1

        review_items.append(
            {
                "index": index,
                "question": question.get("question"),
                "options": question.get("options", []),
                "correct_answer": correct_answer,
                "user_answer": user_answer,
                "is_correct": is_correct,
            }
        )

    total_questions = len(questions)
    return {
        "items": review_items,
        "correct": correct_answers,
        "total": total_questions,
        "estimated_band": _estimate_mc_band(correct_answers, total_questions),
    }


def build_assessment_review(assessment_data: dict, user_answers: dict | None):
    if not assessment_data:
        return None

    user_answers = user_answers or {}
    listening_review = _build_mc_section_review(
        assessment_data.get("listening", {}),
        user_answers.get("listening"),
    )
    reading_review = _build_mc_section_review(
        assessment_data.get("reading", {}),
        user_answers.get("reading"),
    )

    writing_payload = assessment_data.get("writing", {})
    writing_answer = (user_answers.get("writing") or "").strip()
    speaking_payload = assessment_data.get("speaking", {})
    speaking_answer = user_answers.get("speaking") or ""
    speaking_mode = "audio" if isinstance(speaking_answer, str) and speaking_answer.startswith("data:audio") else "text"

    return {
        "listening": listening_review,
        "reading": reading_review,
        "writing": {
            "topic": writing_payload.get("topic"),
            "min_words": writing_payload.get("min_words"),
            "user_answer": writing_answer,
            "word_count": len([word for word in writing_answer.split() if word]),
        },
        "speaking": {
            "prompt": speaking_payload.get("prompt"),
            "user_answer": None if speaking_mode == "audio" else speaking_answer,
            "input_mode": speaking_mode,
        },
        "totals": {
            "mc_correct": listening_review["correct"] + reading_review["correct"],
            "mc_total": listening_review["total"] + reading_review["total"],
            "listening_band": listening_review["estimated_band"],
            "reading_band": reading_review["estimated_band"],
        },
    }


def serialize_assessment(assessment: AIAssessment):
    review = build_assessment_review(assessment.quiz_data, assessment.user_answers)
    return {
        "id": assessment.id,
        "quiz_data": assessment.quiz_data,
        "user_answers": assessment.user_answers,
        "overall_score": assessment.overall_score,
        "grammar_feedback": assessment.grammar_feedback,
        "vocab_feedback": assessment.vocab_feedback,
        "strengths": assessment.strengths or [],
        "weaknesses": assessment.weaknesses or [],
        "status": assessment.status,
        "is_fallback": bool(assessment.is_fallback),
        "created_at": assessment.created_at.isoformat(),
        "updated_at": assessment.updated_at.isoformat(),
        "review": review,
    }


def _normalize_day_type(raw_type: str | None, title: str = "") -> str:
    normalized = _normalize_text(raw_type)
    title_normalized = _normalize_text(title)

    if normalized in {"study", "review", "practice", "homework", "assessment"}:
        return normalized
    if "assessment" in normalized or "test" in normalized or "kiểm tra" in title_normalized:
        return "assessment"
    if "homework" in normalized or "bài tập về nhà" in title_normalized:
        return "homework"
    if "review" in normalized or "ôn" in title_normalized:
        return "review"
    if "practice" in normalized or "luyện" in title_normalized:
        return "practice"
    return "study"


def _normalize_day_entry(day_entry: Any, absolute_day: int):
    if isinstance(day_entry, str):
        title = day_entry
        return {
            "day": absolute_day,
            "title": title,
            "type": _normalize_day_type("", title),
            "grammar_focus": "",
            "vocabulary_focus": "",
            "exercise_hint": "",
        }

    title = day_entry.get("title") or day_entry.get("topic") or f"Ngày {absolute_day}"
    return {
        "day": absolute_day,
        "title": title,
        "type": _normalize_day_type(day_entry.get("type"), title),
        "grammar_focus": day_entry.get("grammar_focus", "") or "",
        "vocabulary_focus": day_entry.get("vocabulary_focus", "") or "",
        "exercise_hint": day_entry.get("exercise_hint", "") or "",
    }


def normalize_blueprint(blueprint_json: dict | None, duration_days: int):
    if not blueprint_json:
        return {"duration_days": duration_days, "months": [], "days": []}

    if isinstance(blueprint_json.get("months"), list):
        months = []
        flat_days = []
        for month_index, month_payload in enumerate(blueprint_json.get("months", []), start=1):
            month_days = []
            for day_entry in month_payload.get("days", []):
                normalized = _normalize_day_entry(day_entry, len(flat_days) + 1)
                month_days.append(normalized)
                flat_days.append(normalized)
            months.append(
                {
                    "month": month_payload.get("month", month_index),
                    "focus": month_payload.get("focus", f"Month {month_index}"),
                    "days": month_days,
                }
            )
        return {
            "duration_days": duration_days or len(flat_days),
            "months": months,
            "days": flat_days,
        }

    month_keys = sorted(
        [key for key in blueprint_json.keys() if key.startswith("month_")],
        key=lambda key: int(key.split("_")[1]),
    )

    months = []
    flat_days = []
    for month_index, month_key in enumerate(month_keys, start=1):
        month_payload = blueprint_json.get(month_key, {})
        month_days = []
        for day_entry in month_payload.get("days", []):
            normalized = _normalize_day_entry(day_entry, len(flat_days) + 1)
            month_days.append(normalized)
            flat_days.append(normalized)
        months.append(
            {
                "month": month_index,
                "focus": month_payload.get("focus") or month_payload.get("f") or f"Month {month_index}",
                "days": month_days,
            }
        )

    return {
        "duration_days": duration_days or len(flat_days),
        "months": months,
        "days": flat_days,
    }


def serialize_daily_task(task: DailyTask):
    return {
        "id": task.id,
        "day_number": task.day_number,
        "status": task.status,
        "score": task.score,
        "task_detail_json": task.task_detail_json,
        "created_at": task.created_at.isoformat(),
    }


def serialize_roadmap(roadmap: StudyRoadmap, include_tasks: bool = False):
    normalized_blueprint = normalize_blueprint(roadmap.blueprint_json, roadmap.duration_days)
    generated_task_days = sorted(
        task.day_number
        for task in roadmap.daily_tasks.order_by(DailyTask.day_number.asc()).all()
        if task.task_detail_json
    )

    payload = {
        "id": roadmap.id,
        "current_score": roadmap.current_score,
        "target_score": roadmap.target_score,
        "duration_days": roadmap.duration_days,
        "created_at": roadmap.created_at.isoformat(),
        "blueprint": normalized_blueprint,
        "generated_task_days": generated_task_days,
    }

    if include_tasks:
        payload["tasks"] = [
            serialize_daily_task(task)
            for task in roadmap.daily_tasks.order_by(DailyTask.day_number.asc()).all()
        ]

    return payload


def _load_roadmap_for_user(user_id: str, roadmap_id: int):
    roadmap = StudyRoadmap.query.get(roadmap_id)
    if not roadmap or roadmap.user_id != user_id:
        return None
    return roadmap


def _get_day_plan_from_roadmap(roadmap: StudyRoadmap, day_number: int):
    normalized_blueprint = normalize_blueprint(roadmap.blueprint_json, roadmap.duration_days)
    for day_entry in normalized_blueprint.get("days", []):
        if day_entry.get("day") == day_number:
            return day_entry
    return None


def _format_theory_text(theory: str):
    raw_text = re.sub(r"\r\n?", "\n", (theory or "").strip())
    if not raw_text:
        return raw_text

    if "\n" in raw_text:
        lines = [re.sub(r"\s+", " ", line).strip(" -") for line in raw_text.splitlines() if line.strip()]
    else:
        working_text = re.sub(r"\s*;\s*", ";\n", raw_text)
        working_text = re.sub(r"(?<=[.!?])\s+", "\n\n", working_text)
        lines = [re.sub(r"\s+", " ", line).strip(" -") for line in working_text.splitlines() if line.strip()]

    normalized_lines = []
    for line in lines:
        if len(line) > 220 and ";" in line:
            normalized_lines.extend(part.strip() for part in line.split(";") if part.strip())
        else:
            normalized_lines.append(line)

    if len(normalized_lines) <= 1:
        sentences = [sentence.strip() for sentence in re.split(r"(?<=[.!?])\s+", raw_text) if sentence.strip()]
        if len(sentences) <= 2:
            return "\n\n".join(sentences)

        normalized_lines = []
        for index in range(0, len(sentences), 2):
            normalized_lines.append(" ".join(sentences[index : index + 2]))

    return "\n\n".join(normalized_lines)


def _normalize_vocab_term(term: str):
    cleaned = re.sub(r"\s+", " ", (term or "").strip())
    cleaned = re.sub(r"^[A-D][.)]\s*", "", cleaned)
    cleaned = re.sub(r"^(term|word)\s*:\s*", "", cleaned, flags=re.IGNORECASE)
    return cleaned.strip(" -:")


def _default_vocab_meaning(term: str, day_plan: dict | None):
    lookup = {
        "hello": "xin chào",
        "hi": "chào, xin chào",
        "good morning": "chào buổi sáng",
        "nice to meet you": "rất vui được gặp bạn",
        "name": "tên",
        "friend": "bạn bè",
        "smile": "mỉm cười, nụ cười",
        "family": "gia đình",
        "mother": "mẹ",
        "father": "bố, cha",
        "teacher": "giáo viên",
        "student": "học sinh, sinh viên",
        "classmate": "bạn cùng lớp",
        "homework": "bài tập về nhà",
        "need": "cần, nhu cầu",
        "want": "muốn",
        "help": "giúp đỡ",
        "school": "trường học",
        "lesson": "bài học",
        "dialogue": "đoạn hội thoại",
        "scene": "cảnh phim",
        "emotion": "cảm xúc",
        "subtitle": "phụ đề",
        "repeat": "lặp lại",
        "pronunciation": "phát âm",
    }

    normalized_term = term.lower()
    if normalized_term in lookup:
        return lookup[normalized_term]

    focus = (day_plan or {}).get("vocabulary_focus") or "chủ đề trong bài học hôm nay"
    return f"Từ/cụm từ quan trọng thuộc chủ đề {focus.lower()}."


def _default_vocab_example(term: str):
    normalized_term = term.strip()
    if not normalized_term:
        return "Example: I use this word when I talk about the movie scene."

    return f'Example: I can use "{normalized_term}" when I describe a movie scene.'


def _build_fallback_vocabulary(day_plan: dict | None):
    vocabulary_focus = (day_plan or {}).get("vocabulary_focus", "")
    raw_terms = [item.strip() for item in re.split(r"[;,/]", vocabulary_focus) if item.strip()]

    focus_lower = vocabulary_focus.lower()
    if "chào" in focus_lower or "giới thiệu" in focus_lower:
        raw_terms.extend(["hello", "nice to meet you", "name", "friend", "smile"])
    elif "gia đình" in focus_lower:
        raw_terms.extend(["family", "mother", "father", "parents", "sibling"])
    elif "giáo dục" in focus_lower or "school" in focus_lower:
        raw_terms.extend(["school", "teacher", "student", "classmate", "homework"])
    elif "nhu cầu" in focus_lower or "need" in focus_lower:
        raw_terms.extend(["need", "want", "help", "water", "food"])
    else:
        raw_terms.extend(["scene", "dialogue", "emotion", "subtitle", "repeat"])

    fallback_items = []
    seen_terms = set()

    for raw_term in raw_terms:
        term = _normalize_vocab_term(raw_term)
        if not term:
            continue

        key = term.lower()
        if key in seen_terms:
            continue

        seen_terms.add(key)
        fallback_items.append(
            {
                "term": term,
                "meaning": _default_vocab_meaning(term, day_plan),
                "example": _default_vocab_example(term),
            }
        )

        if len(fallback_items) >= 6:
            break

    while len(fallback_items) < 5:
        extra_term = ["movie scene", "character", "practice", "pronunciation", "keyword"][len(fallback_items)]
        fallback_items.append(
            {
                "term": extra_term,
                "meaning": _default_vocab_meaning(extra_term, day_plan),
                "example": _default_vocab_example(extra_term),
            }
        )

    return fallback_items


def _sanitize_practice_text(value: str, strip_trailing_answer: bool = False):
    cleaned = re.sub(r"\s+", " ", (value or "").strip())
    cleaned = re.sub(r"^[A-D][.)]\s*", "", cleaned)

    if strip_trailing_answer:
        cleaned = re.sub(r"(?i)\b(answer|correct answer|đáp án)\b\s*[:\-].*$", "", cleaned).strip()
    else:
        cleaned = re.sub(r"(?i)^(answer|correct answer|đáp án)\s*[:\-]\s*", "", cleaned).strip()

    return cleaned


def _normalize_daily_task_detail(detail_json: dict | None, day_plan: dict | None = None):
    detail_json = detail_json or {}
    fallback_detail = _build_fallback_daily_task(day_plan or {})

    normalized = {
        "theory": _format_theory_text(detail_json.get("theory", "")),
        "vocabulary": detail_json.get("vocabulary") or [],
        "practice": detail_json.get("practice") or [],
        "action_item": detail_json.get("action_item", ""),
    }

    normalized_vocab = []
    seen_terms = set()

    def add_vocab_item(term: str, meaning: str, example: str):
        normalized_term = _normalize_vocab_term(term)
        if not normalized_term:
            return

        key = normalized_term.lower()
        if key in seen_terms:
            return

        seen_terms.add(key)
        normalized_vocab.append(
            {
                "term": normalized_term,
                "meaning": (meaning or _default_vocab_meaning(normalized_term, day_plan)).strip(),
                "example": (example or _default_vocab_example(normalized_term)).strip(),
            }
        )

    for item in normalized["vocabulary"][:6]:
        if isinstance(item, str):
            pieces = [piece.strip() for piece in re.split(r"[:\-–]\s*", item, maxsplit=1) if piece.strip()]
            if len(pieces) == 2:
                add_vocab_item(pieces[0], pieces[1], "")
            else:
                add_vocab_item(item, "", "")
            continue

        add_vocab_item(
            item.get("term") or item.get("word") or "keyword",
            item.get("meaning") or "",
            item.get("example") or "",
        )

    for fallback_item in fallback_detail["vocabulary"]:
        if len(normalized_vocab) >= 5:
            break

        add_vocab_item(
            fallback_item.get("term") or "",
            fallback_item.get("meaning") or "",
            fallback_item.get("example") or "",
        )

    normalized_practice = []
    for item in normalized["practice"][:3]:
        if not isinstance(item, dict):
            continue

        question = _sanitize_practice_text(item.get("question", ""), strip_trailing_answer=True)
        options = []
        seen_options = set()
        for option in item.get("options") or []:
            cleaned_option = _sanitize_practice_text(option)
            if not cleaned_option:
                continue

            option_key = cleaned_option.lower()
            if option_key in seen_options:
                continue

            seen_options.add(option_key)
            options.append(cleaned_option)

        answer = _sanitize_practice_text(item.get("answer", ""))
        explanation = re.sub(r"\s+", " ", (item.get("explanation") or "").strip())

        if answer and answer not in options and len(options) < 4:
            options.append(answer)

        if question and len(options) >= 2 and answer:
            normalized_practice.append(
                {
                    "question": question,
                    "options": options,
                    "answer": answer,
                    "explanation": explanation or "Review the grammar and context, then try again.",
                }
            )

    for fallback_item in fallback_detail["practice"]:
        if len(normalized_practice) >= 3:
            break
        normalized_practice.append(fallback_item)

    normalized["theory"] = normalized["theory"] or fallback_detail["theory"]
    normalized["vocabulary"] = normalized_vocab[:6] or fallback_detail["vocabulary"]
    normalized["practice"] = normalized_practice[:3]
    normalized["action_item"] = normalized["action_item"] or fallback_detail["action_item"]
    return normalized


def _build_daily_task_prompt(day_plan: dict):
    grammar_focus = day_plan.get("grammar_focus", "")
    vocabulary_focus = day_plan.get("vocabulary_focus", "")
    exercise_hint = day_plan.get("exercise_hint", "")

    return f"""
    You are creating one compact daily IELTS-style lesson for CineFluent.

    Day title: {day_plan.get("title")}
    Day type: {day_plan.get("type")}
    Grammar focus: {grammar_focus or "None"}
    Vocabulary focus: {vocabulary_focus or "None"}
    Exercise hint: {exercise_hint or "Create a practical review activity"}

    Requirements:
    - theory: concise explanation in Vietnamese, but keep English examples where useful.
    - theory must use 3 to 5 short paragraphs separated by blank lines, not one long paragraph.
    - vocabulary: exactly 5 useful words/phrases. Each item must include: term, clear Vietnamese meaning, and one short English example.
    - practice: exactly 3 multiple-choice questions.
    - do not reveal the answer inside the question text or the option text.
    - action_item: one concrete action tied to movie-based learning.
    - Keep the lesson practical and beginner-friendly when the plan says review/homework.

    Return strict JSON only.
    """


def _build_fallback_daily_task(day_plan: dict):
    title = day_plan.get("title", "Bài học trong ngày")
    grammar_focus = day_plan.get("grammar_focus") or "ngữ pháp trọng tâm"
    vocabulary_focus = day_plan.get("vocabulary_focus") or "chủ đề từ vựng"

    return {
        "theory": (
            f"Hôm nay bạn học chủ đề '{title}'.\n\n"
            f"Ngữ pháp trọng tâm là {grammar_focus}. Hãy ưu tiên câu ngắn, đúng thì và đúng chủ ngữ.\n\n"
            f"Phần từ vựng tập trung vào {vocabulary_focus}. Hãy nhắc lại từ theo ngữ cảnh phim và tự tạo ví dụ riêng của bạn."
        ),
        "vocabulary": _build_fallback_vocabulary(day_plan),
        "practice": [
            {
                "question": f"Chọn câu đúng với trọng tâm {grammar_focus}.",
                "options": [
                    "She go to school every day.",
                    "She goes to school every day.",
                    "She going to school every day.",
                    "She gone to school every day.",
                ],
                "answer": "She goes to school every day.",
                "explanation": "Câu hiện tại đơn với chủ ngữ số ít cần thêm 's/es' cho động từ.",
            },
            {
                "question": f"Từ nào phù hợp nhất với chủ đề {vocabulary_focus}?",
                "options": ["audience", "teacher", "planet", "kitchen"],
                "answer": "teacher",
                "explanation": "Từ 'teacher' phù hợp với ngữ cảnh học tập và giáo dục.",
            },
            {
                "question": "Đâu là cách ôn tập hiệu quả nhất sau khi xem một đoạn phim?",
                "options": [
                    "Bỏ qua phụ đề và không ghi chú",
                    "Lặp lại câu thoại và tự đặt câu mới",
                    "Chỉ học nghĩa tiếng Việt",
                    "Chỉ xem poster phim",
                ],
                "answer": "Lặp lại câu thoại và tự đặt câu mới",
                "explanation": "Việc lặp lại câu thoại giúp ghi nhớ cấu trúc và áp dụng từ vựng trong ngữ cảnh.",
            },
        ],
        "action_item": f"Xem lại 5 phút phim yêu thích và viết 3 câu dùng {grammar_focus} cùng từ vựng về {vocabulary_focus}.",
    }


def _build_daily_task_schema():
    return {
        "type": "OBJECT",
        "properties": {
            "theory": {"type": "STRING"},
            "vocabulary": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "term": {"type": "STRING"},
                        "meaning": {"type": "STRING"},
                        "example": {"type": "STRING"},
                    },
                    "required": ["term", "meaning", "example"],
                },
                "minItems": 5,
                "maxItems": 6,
            },
            "practice": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "question": {"type": "STRING"},
                        "options": {"type": "ARRAY", "items": {"type": "STRING"}},
                        "answer": {"type": "STRING"},
                        "explanation": {"type": "STRING"},
                    },
                    "required": ["question", "options", "answer", "explanation"],
                },
                "minItems": 3,
                "maxItems": 3,
            },
            "action_item": {"type": "STRING"},
        },
        "required": ["theory", "vocabulary", "practice", "action_item"],
    }


def _build_fallback_blueprint(duration_months: int):
    months = []
    flat_days = []

    for month_index in range(1, duration_months + 1):
        month_days = []
        for _ in range(30):
            absolute_day = len(flat_days) + 1
            grammar_focus = GRAMMAR_TOPICS[(absolute_day - 1) % len(GRAMMAR_TOPICS)]
            vocabulary_focus = VOCAB_TOPICS[(absolute_day - 1) % len(VOCAB_TOPICS)]

            if absolute_day % 7 == 0:
                day_type = "assessment"
                title = "Kiểm tra ngắn theo tuần"
                exercise_hint = "Làm quiz 10 câu và viết 1 đoạn ngắn tổng hợp"
            elif absolute_day % 4 == 0:
                day_type = "homework"
                title = f"Bài tập về nhà: {grammar_focus}"
                exercise_hint = "Hoàn thành worksheet và tự ghi âm 3 câu"
            elif absolute_day % 2 == 0:
                day_type = "review"
                title = f"Ôn tập {grammar_focus} & {vocabulary_focus}"
                exercise_hint = "Làm bài ôn ngắn và nhắc lại câu thoại mẫu"
            else:
                day_type = "study"
                title = f"{grammar_focus} & từ vựng {vocabulary_focus}"
                exercise_hint = "Học lý thuyết ngắn, làm quiz và viết câu ví dụ"

            day_entry = {
                "day": absolute_day,
                "title": title,
                "type": day_type,
                "grammar_focus": grammar_focus,
                "vocabulary_focus": vocabulary_focus,
                "exercise_hint": exercise_hint,
            }
            month_days.append(day_entry)
            flat_days.append(day_entry)

        months.append(
            {
                "month": month_index,
                "focus": f"Tháng {month_index}: xây nền ngữ pháp, từ vựng và phản xạ theo phim",
                "days": month_days,
            }
        )

    return {
        "duration_days": duration_months * 30,
        "months": months,
        "days": flat_days,
    }


def generate_four_skills_assessment_service(user_id: str):
    context = get_user_context(user_id)
    assessment_schema = {
        "type": "OBJECT",
        "properties": {
            "listening": {
                "type": "OBJECT",
                "properties": {
                    "audio_script": {
                        "type": "STRING",
                        "description": "Một kịch bản ngắn bằng tiếng Anh về phim ảnh để dùng cho TTS",
                    },
                    "questions": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "question": {"type": "STRING"},
                                "options": {
                                    "type": "ARRAY",
                                    "items": {"type": "STRING"},
                                    "description": "4 lựa chọn",
                                },
                                "answer": {"type": "STRING"},
                            },
                            "required": ["question", "options", "answer"],
                        },
                        "minItems": 4,
                        "maxItems": 4,
                    },
                },
                "required": ["audio_script", "questions"],
            },
            "reading": {
                "type": "OBJECT",
                "properties": {
                    "passage": {
                        "type": "STRING",
                        "description": "Một đoạn văn ngắn (từ 150-200 từ)",
                    },
                    "questions": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "question": {"type": "STRING"},
                                "options": {
                                    "type": "ARRAY",
                                    "items": {"type": "STRING"},
                                    "description": "4 lựa chọn",
                                },
                                "answer": {"type": "STRING"},
                            },
                            "required": ["question", "options", "answer"],
                        },
                        "minItems": 4,
                        "maxItems": 4,
                    },
                },
                "required": ["passage", "questions"],
            },
            "writing": {
                "type": "OBJECT",
                "properties": {
                    "topic": {
                        "type": "STRING",
                        "description": "Một đề bài viết luận về thể loại phim yêu thích của họ",
                    },
                    "min_words": {"type": "INTEGER"},
                },
                "required": ["topic", "min_words"],
            },
            "speaking": {
                "type": "OBJECT",
                "properties": {
                    "prompt": {
                        "type": "STRING",
                        "description": "Một chủ đề nói để trả lời trong 1-2 phút",
                    }
                },
                "required": ["prompt"],
            },
        },
        "required": ["listening", "reading", "writing", "speaking"],
    }

    context_str = f"Phim đã xem: {', '.join(context['recent_movies']) if context['recent_movies'] else 'Chưa có'}. "
    context_str += f"Thể loại yêu thích: {', '.join(context['favorite_genres'])}. "
    context_str += f"Từ vựng đã lưu: {', '.join(context['recent_vocabulary']) if context['recent_vocabulary'] else 'Chưa có'}."

    prompt = f"""
    Bạn là một chuyên gia giám khảo IELTS. Người dùng có bối cảnh học tập sau:
    {context_str}

    Dựa trên bối cảnh này, hãy tạo một bài kiểm tra đánh giá 4 kỹ năng tiếng Anh cá nhân hóa.
    Yêu cầu:
    1. Listening: 1 đoạn hội thoại ngắn, tối đa 2-3 câu và khoảng 45-65 từ, 4 câu hỏi trắc nghiệm.
    2. Reading: 1 đoạn văn phê bình phim hoặc tóm tắt phim, 4 câu hỏi trắc nghiệm.
    3. Writing: 1 câu hỏi viết thật ngắn, rõ, chỉ 1 câu, liên quan đến tác động của điện ảnh.
    4. Speaking: 1 câu hỏi nói thật ngắn, rõ, chỉ 1 câu, dễ trả lời bằng 1-2 phút.

    Hãy sáng tạo nội dung mới lạ, không lặp lại các kịch bản cũ. Độ khó gần với IELTS thực tế.
    Trả về JSON khớp chính xác với schema.
    """

    existing_pending = (
        AIAssessment.query.filter_by(user_id=user_id, status="PENDING")
        .order_by(AIAssessment.created_at.desc())
        .first()
    )
    if existing_pending:
        return {
            "success": True,
            "data": compact_assessment_payload(existing_pending.quiz_data),
            "assessment_id": existing_pending.id,
            "is_fallback": bool(existing_pending.is_fallback),
            "reused": True,
        }

    last_error = None
    for model_name in ASSESSMENT_MODELS:
        try:
            response = cinefluent_ai.models.generate_content(
                model=model_name,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    response_mime_type="application/json",
                    response_schema=assessment_schema,
                ),
            )
            result = compact_assessment_payload(json.loads(response.text))
            assessment = AIAssessment(
                user_id=user_id,
                quiz_data=result,
                status="PENDING",
            )
            db.session.add(assessment)
            db.session.commit()

            return {"success": True, "data": result, "assessment_id": assessment.id}
        except Exception as exc:
            last_error = str(exc)
            continue

    db.session.rollback()
    fallback_test = compact_assessment_payload(random.choice(ASSESSMENT_FALLBACK_POOL))
    final_fallback = AIAssessment(
        user_id=user_id,
        quiz_data=fallback_test,
        status="PENDING",
        is_fallback=True,
    )
    db.session.add(final_fallback)
    db.session.commit()

    return {
        "success": True,
        "data": fallback_test,
        "assessment_id": final_fallback.id,
        "is_fallback": True,
        "warning": last_error,
    }


def get_assessment_history_service(user_id: str):
    assessments = (
        AIAssessment.query.filter_by(user_id=user_id)
        .order_by(AIAssessment.created_at.desc())
        .all()
    )
    return {"success": True, "data": [serialize_assessment(item) for item in assessments]}


def submit_assessment_service(user_id: str, assessment_id: int, user_answers: dict):
    assessment = AIAssessment.query.get(assessment_id)
    if not assessment or assessment.user_id != user_id:
        return {"success": False, "error": "Bài đánh giá không hợp lệ.", "code": 404}

    if not user_answers:
        return {"success": False, "error": "Thiếu câu trả lời để chấm điểm.", "code": 400}

    assessment_data = assessment.quiz_data
    review = build_assessment_review(assessment_data, user_answers)
    speaking_content = user_answers.get("speaking", "")
    speaking_input = speaking_content

    if isinstance(speaking_content, str) and speaking_content.startswith("data:audio"):
        import base64

        header, b64_data = speaking_content.split(",", 1)
        mime_match = re.match(r"data:(audio/[^;]+);base64", header)
        mime_type = mime_match.group(1) if mime_match else "audio/webm"
        speaking_input = types.Part.from_bytes(
            data=base64.b64decode(b64_data),
            mime_type=mime_type,
        )

    prompt_user_answers = dict(user_answers)
    if isinstance(prompt_user_answers.get("speaking"), str) and prompt_user_answers["speaking"].startswith("data:audio"):
        prompt_user_answers["speaking"] = "[Audio response attached separately]"

    objective_summary = review["totals"]
    scoring_schema = {
        "type": "OBJECT",
        "properties": {
            "overall_score": {"type": "NUMBER", "description": "Ước tính điểm IELTS từ 0 đến 9.0"},
            "grammar_feedback": {"type": "STRING", "description": "Nhận xét ngữ pháp bằng tiếng Việt"},
            "vocab_feedback": {"type": "STRING", "description": "Nhận xét vốn từ bằng tiếng Việt"},
            "strengths": {"type": "ARRAY", "items": {"type": "STRING"}},
            "weaknesses": {"type": "ARRAY", "items": {"type": "STRING"}},
        },
        "required": ["overall_score", "grammar_feedback", "vocab_feedback", "strengths", "weaknesses"],
    }

    prompt = f"""
    Bạn là một giám khảo IELTS chuyên nghiệp.

    Đây là bài test đã giao:
    {json.dumps(assessment_data, ensure_ascii=False)}

    Đây là câu trả lời của người dùng:
    {json.dumps(prompt_user_answers, ensure_ascii=False)}

    Điểm khách quan đã chấm sẵn:
    - Listening band gần đúng: {objective_summary['listening_band']}, số câu đúng: {review['listening']['correct']}/{review['listening']['total']}
    - Reading band gần đúng: {objective_summary['reading_band']}, số câu đúng: {review['reading']['correct']}/{review['reading']['total']}
    - Writing word count: {review['writing']['word_count']}

    Nhiệm vụ của bạn:
    1. KHÔNG chấm lại Listening/Reading theo cảm tính, hãy tôn trọng số câu đúng ở trên.
    2. Đánh giá Writing và Speaking theo chuẩn IELTS gần đúng.
    3. Đưa ra overall_score làm tròn đến 0.5 gần nhất.
    4. Trả feedback ngắn gọn, thực tế, bằng tiếng Việt.

    Trả về JSON chính xác theo schema.
    """

    contents = [prompt]
    if isinstance(speaking_input, types.Part):
        contents.append("Dưới đây là file ghi âm phần nói của người dùng:")
        contents.append(speaking_input)

    last_error = None
    result = None
    for model_name in ASSESSMENT_MODELS:
        try:
            response = cinefluent_ai.models.generate_content(
                model=model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    response_mime_type="application/json",
                    response_schema=scoring_schema,
                ),
            )
            result = json.loads(response.text)
            break
        except Exception as exc:
            last_error = str(exc)
            continue

    if not result:
        return {
            "success": False,
            "error": f"Chấm điểm thất bại do lỗi hệ thống: {last_error}",
            "code": 500,
            "data": {"review": review},
        }

    try:
        assessment.user_answers = user_answers
        assessment.overall_score = _round_band(float(result.get("overall_score", 0)))
        assessment.grammar_feedback = result.get("grammar_feedback")
        assessment.vocab_feedback = result.get("vocab_feedback")
        assessment.strengths = result.get("strengths", [])
        assessment.weaknesses = result.get("weaknesses", [])
        assessment.status = "COMPLETED"
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return {
            "success": False,
            "error": f"Không thể lưu kết quả bài đánh giá: {exc}",
            "code": 500,
        }

    return {"success": True, "data": serialize_assessment(assessment)}


def reset_assessment_service(user_id: str, assessment_id: int):
    assessment = AIAssessment.query.get(assessment_id)
    if not assessment or assessment.user_id != user_id:
        return {"success": False, "error": "Bài đánh giá không hợp lệ.", "code": 404}

    assessment.user_answers = None
    assessment.overall_score = None
    assessment.grammar_feedback = None
    assessment.vocab_feedback = None
    assessment.strengths = None
    assessment.weaknesses = None
    assessment.status = "PENDING"
    db.session.commit()

    return {"success": True, "data": serialize_assessment(assessment)}


def _build_blueprint_schema(duration_months: int):
    blueprint_schema = {"type": "OBJECT", "properties": {}, "required": []}

    for month_index in range(1, duration_months + 1):
        month_key = f"month_{month_index}"
        blueprint_schema["properties"][month_key] = {
            "type": "OBJECT",
            "properties": {
                "focus": {"type": "STRING"},
                "days": {
                    "type": "ARRAY",
                    "minItems": 30,
                    "maxItems": 30,
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "title": {"type": "STRING"},
                            "type": {"type": "STRING"},
                            "grammar_focus": {"type": "STRING"},
                            "vocabulary_focus": {"type": "STRING"},
                            "exercise_hint": {"type": "STRING"},
                        },
                        "required": [
                            "title",
                            "type",
                            "grammar_focus",
                            "vocabulary_focus",
                            "exercise_hint",
                        ],
                    },
                },
            },
            "required": ["focus", "days"],
        }
        blueprint_schema["required"].append(month_key)

    return blueprint_schema


def _transform_generated_blueprint(raw_json: dict, duration_months: int):
    months = []
    flat_days = []

    for month_index in range(1, duration_months + 1):
        month_key = f"month_{month_index}"
        month_payload = raw_json.get(month_key, {})
        month_days = []
        for day_entry in month_payload.get("days", []):
            normalized = _normalize_day_entry(day_entry, len(flat_days) + 1)
            month_days.append(normalized)
            flat_days.append(normalized)

        months.append(
            {
                "month": month_index,
                "focus": month_payload.get("focus", f"Tháng {month_index}"),
                "days": month_days,
            }
        )

    return {
        "duration_days": duration_months * 30,
        "months": months,
        "days": flat_days,
    }


def generate_roadmap_blueprint_service(
    user_id: str,
    current_score: float,
    target_score: float,
    duration_days: int,
):
    if duration_days not in ALLOWED_ROADMAP_DURATIONS:
        return {
            "success": False,
            "error": "duration_days chỉ được phép là 30, 60 hoặc 90.",
            "code": 400,
        }

    if target_score <= current_score:
        return {
            "success": False,
            "error": "Điểm mục tiêu phải lớn hơn điểm hiện tại.",
            "code": 400,
        }

    duration_months = duration_days // 30
    context = get_user_context(user_id)
    ctx = f"M:{','.join(context['recent_movies'])}.G:{','.join(context['favorite_genres'])}.V:{','.join(context['recent_vocabulary'])}."
    blueprint_schema = _build_blueprint_schema(duration_months)

    prompt = f"""
    You are CineFluent AI roadmap planner.

    Current IELTS score: {current_score}
    Target IELTS score: {target_score}
    Duration: {duration_days} days
    Context: {ctx}

    Build a day-by-day roadmap grouped by month.
    Rules:
    - Exactly 30 days for each month.
    - Mix these day types naturally: study, review, practice, homework, assessment.
    - Each study day should clearly mention grammar and vocabulary focus.
    - Titles should be concise, easy to understand, and written in Vietnamese.
    - exercise_hint should describe a short task or review format.
    - Keep the plan practical for movie-based English learning.

    Return strict JSON matching the schema exactly.
    """

    blueprint_json = None
    used_fallback = False
    last_error = None
    for model_name in ROADMAP_MODELS:
        try:
            response = cinefluent_ai.models.generate_content(
                model=model_name,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    temperature=0.4,
                    response_mime_type="application/json",
                    response_schema=blueprint_schema,
                ),
            )
            blueprint_json = _transform_generated_blueprint(
                json.loads(response.text),
                duration_months,
            )
            break
        except Exception as exc:
            last_error = str(exc)
            continue

    if not blueprint_json:
        blueprint_json = _build_fallback_blueprint(duration_months)
        used_fallback = True

    roadmap = StudyRoadmap(
        user_id=user_id,
        current_score=current_score,
        target_score=target_score,
        duration_days=duration_days,
        blueprint_json=blueprint_json,
    )
    db.session.add(roadmap)
    db.session.commit()

    data = serialize_roadmap(roadmap)
    if last_error and used_fallback:
        data["warning"] = last_error

    return {"success": True, "data": data}


def list_roadmaps_service(user_id: str):
    roadmaps = (
        StudyRoadmap.query.filter_by(user_id=user_id)
        .order_by(StudyRoadmap.created_at.desc())
        .all()
    )
    return {"success": True, "data": [serialize_roadmap(roadmap) for roadmap in roadmaps]}


def get_roadmap_detail_service(user_id: str, roadmap_id: int):
    roadmap = _load_roadmap_for_user(user_id, roadmap_id)
    if not roadmap:
        return {"success": False, "error": "Roadmap không hợp lệ.", "code": 404}
    return {"success": True, "data": serialize_roadmap(roadmap, include_tasks=True)}


def get_daily_task_service(user_id: str, roadmap_id: int, day_number: int):
    roadmap = _load_roadmap_for_user(user_id, roadmap_id)
    if not roadmap:
        return {"success": False, "error": "Roadmap không hợp lệ.", "code": 404}
    if day_number < 1 or day_number > roadmap.duration_days:
        return {"success": False, "error": "Ngày học không hợp lệ.", "code": 400}

    task = DailyTask.query.filter_by(roadmap_id=roadmap_id, day_number=day_number).first()
    if not task:
        return {"success": True, "data": None}

    day_plan = _get_day_plan_from_roadmap(roadmap, day_number)
    normalized_detail = _normalize_daily_task_detail(task.task_detail_json, day_plan)
    if normalized_detail != task.task_detail_json:
        task.task_detail_json = normalized_detail
        db.session.commit()

    return {"success": True, "data": serialize_daily_task(task)}


def generate_daily_task_service(user_id: str, roadmap_id: int, day_number: int, day_plan: dict | None):
    roadmap = _load_roadmap_for_user(user_id, roadmap_id)
    if not roadmap:
        return {"success": False, "error": "Roadmap không hợp lệ.", "code": 404}
    if day_number < 1 or day_number > roadmap.duration_days:
        return {"success": False, "error": "Ngày học không hợp lệ.", "code": 400}

    day_plan = day_plan or {"title": f"Ngày {day_number}", "type": "study"}
    normalized_plan = _normalize_day_entry(day_plan, day_number)
    existing_task = DailyTask.query.filter_by(roadmap_id=roadmap_id, day_number=day_number).first()
    if existing_task and existing_task.task_detail_json:
        normalized_detail = _normalize_daily_task_detail(existing_task.task_detail_json, normalized_plan)
        if normalized_detail != existing_task.task_detail_json:
            existing_task.task_detail_json = normalized_detail
            db.session.commit()
        return {"success": True, "data": serialize_daily_task(existing_task), "cached": True}

    daily_schema = _build_daily_task_schema()

    detail_json = None
    for model_name in DAILY_TASK_MODELS:
        try:
            response = cinefluent_ai.models.generate_content(
                model=model_name,
                contents=[_build_daily_task_prompt(normalized_plan)],
                config=types.GenerateContentConfig(
                    temperature=0.5,
                    response_mime_type="application/json",
                    response_schema=daily_schema,
                ),
            )
            detail_json = json.loads(response.text)
            break
        except Exception:
            continue

    if not detail_json:
        detail_json = _build_fallback_daily_task(normalized_plan)
    detail_json = _normalize_daily_task_detail(detail_json, normalized_plan)

    if existing_task:
        existing_task.task_detail_json = detail_json
        task = existing_task
    else:
        task = DailyTask(
            roadmap_id=roadmap_id,
            day_number=day_number,
            task_detail_json=detail_json,
        )
        db.session.add(task)

    db.session.commit()
    return {"success": True, "data": serialize_daily_task(task)}
