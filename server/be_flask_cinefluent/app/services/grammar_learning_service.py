import json
from datetime import datetime

from google.genai import types

from ..extensions import db
from ..models.models_model import (
    GrammarLesson,
    GrammarReviewAttempt,
    GrammarReviewExercise,
    GrammarTag,
)
from ..utils.ai_engine import cinefluent_ai
from ..utils.grammar_catalog import GRAMMAR_TAG_PRESENTATION


LESSON_MODEL_NAME = "gemini-2.5-flash"
REVIEW_MODEL_NAME = "gemini-2.5-flash"


def _resolve_tag_display(tag: GrammarTag) -> dict:
    catalog = GRAMMAR_TAG_PRESENTATION.get(tag.id, {})
    return {
        "label_en": catalog.get("label_en") or tag.name_en or f"Tag {tag.id}",
        "label_vi": catalog.get("label_vi") or tag.name_vi or f"Tag {tag.id}",
    }


def _build_lesson_payload(tag: GrammarTag, stored: GrammarLesson) -> dict:
    display = _resolve_tag_display(tag)
    content = stored.content_json or {}
    return {
        "lesson_id": stored.id,
        "tag_id": tag.id,
        "label_en": display["label_en"],
        "label_vi": display["label_vi"],
        "title": stored.title,
        "model_name": stored.model_name,
        "version": stored.version,
        "created_at": stored.created_at.isoformat() if stored.created_at else None,
        "updated_at": stored.updated_at.isoformat() if stored.updated_at else None,
        **content,
    }


def _build_review_payload(tag: GrammarTag, exercise: GrammarReviewExercise) -> dict:
    display = _resolve_tag_display(tag)
    quiz_data = exercise.quiz_data or {}
    return {
        "exercise_id": exercise.id,
        "tag_id": tag.id,
        "label_en": display["label_en"],
        "label_vi": display["label_vi"],
        "title": exercise.title,
        "question_count": exercise.question_count,
        "model_name": exercise.model_name,
        "created_at": exercise.created_at.isoformat() if exercise.created_at else None,
        "updated_at": exercise.updated_at.isoformat() if exercise.updated_at else None,
        **quiz_data,
    }


def _generate_lesson_payload_with_ai(tag: GrammarTag, display: dict) -> dict:
    lesson_schema = {
        "type": "OBJECT",
        "properties": {
            "title": {"type": "STRING"},
            "summary": {"type": "STRING"},
            "formula": {"type": "STRING"},
            "usage_notes": {"type": "ARRAY", "items": {"type": "STRING"}},
            "examples": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "sentence_en": {"type": "STRING"},
                        "sentence_vi": {"type": "STRING"},
                        "explanation_vi": {"type": "STRING"},
                    },
                    "required": ["sentence_en", "sentence_vi", "explanation_vi"],
                },
            },
            "vocabulary": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "word": {"type": "STRING"},
                        "meaning_vi": {"type": "STRING"},
                        "usage_hint": {"type": "STRING"},
                    },
                    "required": ["word", "meaning_vi", "usage_hint"],
                },
            },
            "common_mistakes": {"type": "ARRAY", "items": {"type": "STRING"}},
            "movie_tip": {"type": "STRING"},
        },
        "required": [
            "title",
            "summary",
            "formula",
            "usage_notes",
            "examples",
            "vocabulary",
            "common_mistakes",
            "movie_tip",
        ],
    }

    prompt = f"""
    Bạn là gia sư ngữ pháp cho ứng dụng học tiếng Anh qua phim CineFluent.

    Hãy tạo một bài học NGẮN, DỄ HỌC, THỰC DỤNG cho điểm ngữ pháp sau:
    - Tag ID: {tag.id}
    - Tên tiếng Anh: {display['label_en']}
    - Tên tiếng Việt: {display['label_vi']}

    Yêu cầu:
    - Viết hoàn toàn bằng tiếng Việt tự nhiên, dễ hiểu cho người Việt.
    - "summary" dài 2-3 câu, giải thích bản chất của điểm ngữ pháp.
    - "formula" phải ngắn gọn và dễ nhớ.
    - "usage_notes": 3 gạch đầu dòng rõ ràng.
    - "examples": đúng 3 ví dụ, gần ngữ cảnh phim hoặc hội thoại đời thường.
    - "vocabulary": đúng 4 mục, chọn từ hoặc cụm từ hay đi với cấu trúc này.
    - "common_mistakes": đúng 3 lỗi sai phổ biến.
    - "movie_tip": 1 mẹo ngắn để người học dễ nhận ra cấu trúc này khi xem phim.

    Chỉ trả về JSON hợp lệ.
    """

    response = cinefluent_ai.models.generate_content(
        model=LESSON_MODEL_NAME,
        contents=[prompt],
        config=types.GenerateContentConfig(
            temperature=0.6,
            response_mime_type="application/json",
            response_schema=lesson_schema,
        ),
    )
    return json.loads(response.text)


def _generate_review_payload_with_ai(tag: GrammarTag, display: dict, question_count: int) -> dict:
    review_schema = {
        "type": "OBJECT",
        "properties": {
            "title": {"type": "STRING"},
            "instructions": {"type": "STRING"},
            "questions": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "question": {"type": "STRING"},
                        "options": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"},
                            "minItems": 4,
                            "maxItems": 4,
                        },
                        "answer": {"type": "STRING"},
                        "correct_explanation_vi": {"type": "STRING"},
                        "option_feedback": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "option": {"type": "STRING"},
                                    "is_correct": {"type": "BOOLEAN"},
                                    "feedback_vi": {"type": "STRING"},
                                },
                                "required": ["option", "is_correct", "feedback_vi"],
                            },
                        },
                    },
                    "required": [
                        "question",
                        "options",
                        "answer",
                        "correct_explanation_vi",
                        "option_feedback",
                    ],
                },
            },
        },
        "required": ["title", "instructions", "questions"],
    }

    prompt = f"""
    Bạn đang tạo mini quiz ôn tập cho CineFluent.

    Điểm ngữ pháp:
    - Tag ID: {tag.id}
    - Tên tiếng Anh: {display['label_en']}
    - Tên tiếng Việt: {display['label_vi']}

    Yêu cầu:
    - Tạo đúng {question_count} câu trắc nghiệm 4 lựa chọn.
    - Mỗi câu tập trung đúng vào điểm ngữ pháp này.
    - "question" là câu tiếng Anh có chỗ trống hoặc lựa chọn đúng về cấu trúc.
    - "options" gồm đúng 4 đáp án ngắn.
    - "answer" phải trùng chính xác một phần tử trong options.
    - "correct_explanation_vi" giải thích tại sao đáp án đúng.
    - "option_feedback" phải có đúng 4 mục, tương ứng từng option trong options.
    - Với mỗi option, "feedback_vi" phải giải thích ngắn gọn tại sao option đó đúng hoặc sai.
    - Độ khó từ dễ đến vừa, phù hợp người học phổ thông.

    Chỉ trả về JSON hợp lệ.
    """

    response = cinefluent_ai.models.generate_content(
        model=REVIEW_MODEL_NAME,
        contents=[prompt],
        config=types.GenerateContentConfig(
            temperature=0.5,
            response_mime_type="application/json",
            response_schema=review_schema,
        ),
    )
    payload = json.loads(response.text)
    payload["questions"] = (payload.get("questions") or [])[:question_count]
    return payload


def generate_grammar_lesson_service(tag_id: int, force_refresh: bool = False):
    grammar_tag = GrammarTag.query.get(tag_id)
    if not grammar_tag:
        return {"success": False, "error": "Không tìm thấy điểm ngữ pháp", "code": 404}

    stored_lesson = GrammarLesson.query.filter_by(tag_id=tag_id).first()
    if stored_lesson and not force_refresh:
        return {"success": True, "data": _build_lesson_payload(grammar_tag, stored_lesson)}

    display = _resolve_tag_display(grammar_tag)

    try:
        payload = _generate_lesson_payload_with_ai(grammar_tag, display)
    except Exception as exc:
        return {"success": False, "error": str(exc), "code": 500}

    if stored_lesson:
        stored_lesson.title = payload.get("title") or display["label_vi"]
        stored_lesson.content_json = payload
        stored_lesson.model_name = LESSON_MODEL_NAME
        stored_lesson.version += 1
        stored_lesson.updated_at = datetime.utcnow()
    else:
        stored_lesson = GrammarLesson(
            tag_id=grammar_tag.id,
            title=payload.get("title") or display["label_vi"],
            content_json=payload,
            model_name=LESSON_MODEL_NAME,
            version=1,
        )
        db.session.add(stored_lesson)

    db.session.commit()
    return {"success": True, "data": _build_lesson_payload(grammar_tag, stored_lesson)}


def generate_grammar_review_service(tag_id: int, question_count: int = 5, force_refresh: bool = False):
    grammar_tag = GrammarTag.query.get(tag_id)
    if not grammar_tag:
        return {"success": False, "error": "Không tìm thấy điểm ngữ pháp", "code": 404}

    normalized_count = max(3, min(int(question_count or 5), 8))
    stored_exercise = (
        GrammarReviewExercise.query.filter_by(
            tag_id=tag_id,
            question_count=normalized_count,
            is_active=True,
        )
        .order_by(GrammarReviewExercise.updated_at.desc(), GrammarReviewExercise.id.desc())
        .first()
    )

    if stored_exercise and not force_refresh:
        return {"success": True, "data": _build_review_payload(grammar_tag, stored_exercise)}

    display = _resolve_tag_display(grammar_tag)

    try:
        payload = _generate_review_payload_with_ai(grammar_tag, display, normalized_count)
    except Exception as exc:
        return {"success": False, "error": str(exc), "code": 500}

    if stored_exercise and force_refresh:
        stored_exercise.is_active = False

    new_exercise = GrammarReviewExercise(
        tag_id=grammar_tag.id,
        title=payload.get("title") or f"Ôn tập {display['label_vi']}",
        question_count=normalized_count,
        quiz_data=payload,
        model_name=REVIEW_MODEL_NAME,
        is_active=True,
    )
    db.session.add(new_exercise)
    db.session.commit()

    return {"success": True, "data": _build_review_payload(grammar_tag, new_exercise)}


def get_existing_grammar_review_service(tag_id: int, question_count: int = 5):
    grammar_tag = GrammarTag.query.get(tag_id)
    if not grammar_tag:
        return {"success": False, "error": "Không tìm thấy điểm ngữ pháp", "code": 404}

    normalized_count = max(3, min(int(question_count or 5), 8))
    stored_exercise = (
        GrammarReviewExercise.query.filter_by(
            tag_id=tag_id,
            question_count=normalized_count,
            is_active=True,
        )
        .order_by(GrammarReviewExercise.updated_at.desc(), GrammarReviewExercise.id.desc())
        .first()
    )

    if not stored_exercise:
        return {
            "success": False,
            "error": "Chưa có bài ôn tập được tạo cho điểm ngữ pháp này",
            "code": 404,
        }

    return {"success": True, "data": _build_review_payload(grammar_tag, stored_exercise)}


def submit_grammar_review_service(user_id: str, exercise_id: int, user_answers: dict | None):
    exercise = GrammarReviewExercise.query.get(exercise_id)
    if not exercise:
        return {"success": False, "error": "Không tìm thấy bài ôn tập", "code": 404}

    raw_questions = (exercise.quiz_data or {}).get("questions") or []
    normalized_answers = user_answers or {}
    review_items = []
    correct_answers = 0

    for index, question in enumerate(raw_questions):
        answer_key = str(index)
        selected_answer = normalized_answers.get(answer_key)
        correct_answer = question.get("answer")
        option_feedback = question.get("option_feedback") or []

        selected_feedback = None
        correct_feedback = None
        for item in option_feedback:
            option_value = item.get("option")
            if option_value == selected_answer:
                selected_feedback = item.get("feedback_vi")
            if option_value == correct_answer:
                correct_feedback = item.get("feedback_vi")

        is_correct = selected_answer == correct_answer
        if is_correct:
            correct_answers += 1

        review_items.append(
            {
                "question_index": index,
                "question": question.get("question"),
                "selected_answer": selected_answer,
                "correct_answer": correct_answer,
                "is_correct": is_correct,
                "selected_feedback_vi": selected_feedback,
                "correct_explanation_vi": question.get("correct_explanation_vi"),
                "correct_option_feedback_vi": correct_feedback,
                "option_feedback": option_feedback,
            }
        )

    total_questions = len(raw_questions)
    score = round((correct_answers / total_questions) * 100, 2) if total_questions else 0.0

    attempt = GrammarReviewAttempt(
        review_exercise_id=exercise.id,
        user_id=user_id,
        user_answers=normalized_answers,
        result_json={"items": review_items},
        score=score,
        total_questions=total_questions,
        correct_answers=correct_answers,
        status="COMPLETED",
        submitted_at=datetime.utcnow(),
    )
    db.session.add(attempt)
    db.session.commit()

    return {
        "success": True,
        "data": {
            "attempt_id": attempt.id,
            "exercise_id": exercise.id,
            "tag_id": exercise.tag_id,
            "score": score,
            "correct_answers": correct_answers,
            "total_questions": total_questions,
            "result": attempt.result_json,
            "submitted_at": attempt.submitted_at.isoformat() if attempt.submitted_at else None,
        },
    }


def get_grammar_review_by_exercise_service(exercise_id: int):
    exercise = GrammarReviewExercise.query.get(exercise_id)
    if not exercise:
        return {"success": False, "error": "Không tìm thấy bộ câu ôn tập", "code": 404}

    grammar_tag = exercise.grammar_tag
    if not grammar_tag:
        return {"success": False, "error": "Không tìm thấy điểm ngữ pháp", "code": 404}

    return {"success": True, "data": _build_review_payload(grammar_tag, exercise)}


def get_grammar_review_history_service(user_id: str, tag_id: int, limit: int = 10):
    normalized_limit = max(1, min(int(limit or 10), 30))
    attempts = (
        GrammarReviewAttempt.query.join(
            GrammarReviewExercise,
            GrammarReviewAttempt.review_exercise_id == GrammarReviewExercise.id,
        )
        .filter(
            GrammarReviewAttempt.user_id == user_id,
            GrammarReviewExercise.tag_id == tag_id,
        )
        .order_by(
            GrammarReviewAttempt.submitted_at.desc(),
            GrammarReviewAttempt.id.desc(),
        )
        .limit(normalized_limit)
        .all()
    )

    history = []
    for attempt in attempts:
        exercise = attempt.review_exercise
        history.append(
            {
                "attempt_id": attempt.id,
                "exercise_id": attempt.review_exercise_id,
                "score": attempt.score,
                "correct_answers": attempt.correct_answers,
                "total_questions": attempt.total_questions,
                "status": attempt.status,
                "submitted_at": attempt.submitted_at.isoformat() if attempt.submitted_at else None,
                "created_at": attempt.created_at.isoformat() if attempt.created_at else None,
                "title": exercise.title if exercise else None,
                "question_count": exercise.question_count if exercise else attempt.total_questions,
            }
        )

    return {
        "success": True,
        "data": {
            "tag_id": tag_id,
            "items": history,
        },
    }
