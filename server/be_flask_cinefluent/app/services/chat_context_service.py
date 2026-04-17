from __future__ import annotations

from sqlalchemy import and_

from ..models.models_model import (
    AIAssessment,
    DailyTask,
    Flashcard,
    FlashcardExercise,
    StudyRoadmap,
    Subtitle,
    TypingGameMap,
    TypingGameStage,
    Video,
    WatchHistory,
)


def _safe_float(value) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _safe_int(value) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _serialize_subtitle(subtitle: Subtitle | None) -> dict | None:
    if not subtitle:
        return None
    return {
        "id": subtitle.id,
        "start_time": subtitle.start_time,
        "end_time": subtitle.end_time,
        "content_en": subtitle.content_en,
        "content_vi": subtitle.content_vi,
    }


def _serialize_flashcard(flashcard: Flashcard) -> dict:
    return {
        "id": flashcard.id,
        "word": flashcard.word,
        "context_sentence": flashcard.context_sentence,
        "ipa": flashcard.ipa,
        "pos": flashcard.pos,
        "definition_vi": flashcard.definition_vi,
        "example_en": flashcard.example_en,
        "example_vi": flashcard.example_vi,
        "created_at": flashcard.created_at.isoformat() if flashcard.created_at else None,
    }


def _serialize_flashcard_exercise(exercise: FlashcardExercise | None) -> dict | None:
    if not exercise:
        return None

    user_answers = exercise.user_answers or {}
    answered_count = len(user_answers) if isinstance(user_answers, dict) else 0
    correct_answers = exercise.correct_answers or 0
    wrong_answer_count = max(0, answered_count - correct_answers)

    return {
        "id": exercise.id,
        "score": exercise.score,
        "status": exercise.status,
        "total_questions": exercise.total_questions,
        "correct_answers": exercise.correct_answers,
        "answered_count": answered_count,
        "wrong_answer_count": wrong_answer_count,
        "created_at": exercise.created_at.isoformat() if exercise.created_at else None,
        "updated_at": exercise.updated_at.isoformat() if exercise.updated_at else None,
        "quiz_data": exercise.quiz_data,
        "user_answers": exercise.user_answers,
    }


def _serialize_assessment(assessment: AIAssessment | None) -> dict | None:
    if not assessment:
        return None
    return {
        "id": assessment.id,
        "overall_score": assessment.overall_score,
        "grammar_feedback": assessment.grammar_feedback,
        "vocab_feedback": assessment.vocab_feedback,
        "strengths": assessment.strengths or [],
        "weaknesses": assessment.weaknesses or [],
        "status": assessment.status,
        "is_fallback": bool(assessment.is_fallback),
        "created_at": assessment.created_at.isoformat() if assessment.created_at else None,
        "updated_at": assessment.updated_at.isoformat() if assessment.updated_at else None,
    }


def _serialize_roadmap(roadmap: StudyRoadmap | None) -> dict | None:
    if not roadmap:
        return None
    return {
        "id": roadmap.id,
        "current_score": roadmap.current_score,
        "target_score": roadmap.target_score,
        "duration_days": roadmap.duration_days,
        "blueprint_json": roadmap.blueprint_json,
        "created_at": roadmap.created_at.isoformat() if roadmap.created_at else None,
    }


def _serialize_daily_task(task: DailyTask | None) -> dict | None:
    if not task:
        return None
    return {
        "id": task.id,
        "roadmap_id": task.roadmap_id,
        "day_number": task.day_number,
        "task_detail_json": task.task_detail_json,
        "status": task.status,
        "score": task.score,
        "created_at": task.created_at.isoformat() if task.created_at else None,
    }


def _serialize_typing_map(map_obj: TypingGameMap | None) -> dict | None:
    if not map_obj:
        return None
    return {
        "id": map_obj.id,
        "name": map_obj.name,
        "thumbnail_url": map_obj.thumbnail_url,
        "description": map_obj.description,
        "total_chapters": map_obj.total_chapters,
        "created_at": map_obj.created_at.isoformat() if map_obj.created_at else None,
    }


def _serialize_typing_stage(stage: TypingGameStage | None) -> dict | None:
    if not stage:
        return None
    return {
        "id": stage.id,
        "map_id": stage.map_id,
        "chapter_number": stage.chapter_number,
        "content": stage.content,
        "difficulty": stage.difficulty,
        "created_at": stage.created_at.isoformat() if stage.created_at else None,
    }


def _find_current_subtitle(video_id: int, current_time: float) -> Subtitle | None:
    subtitle = (
        Subtitle.query.filter(
            and_(
                Subtitle.video_id == video_id,
                Subtitle.start_time <= current_time,
                Subtitle.end_time >= current_time,
            )
        )
        .order_by(Subtitle.start_time.desc())
        .first()
    )
    if subtitle:
        return subtitle

    previous_subtitle = (
        Subtitle.query.filter(
            and_(
                Subtitle.video_id == video_id,
                Subtitle.start_time <= current_time,
            )
        )
        .order_by(Subtitle.start_time.desc())
        .first()
    )
    if previous_subtitle:
        return previous_subtitle

    return (
        Subtitle.query.filter(Subtitle.video_id == video_id)
        .order_by(Subtitle.start_time.asc())
        .first()
    )


def build_movie_context_service(
    user_id: str,
    video_id: int,
    client_state: dict | None = None,
):
    video = Video.query.get(video_id)
    if not video:
        return {"success": False, "error": "Không tìm thấy video", "code": 404}

    client_state = client_state or {}
    requested_current_time = _safe_float(client_state.get("current_time"))

    watch_history = (
        WatchHistory.query.filter_by(user_id=user_id, video_id=video_id)
        .order_by(WatchHistory.watched_at.desc())
        .first()
    )

    history_current_time = _safe_float(watch_history.last_position) if watch_history else None
    effective_current_time = requested_current_time if requested_current_time is not None else history_current_time
    time_source = (
        "client_state"
        if requested_current_time is not None
        else "watch_history"
        if history_current_time is not None
        else None
    )

    current_subtitle = (
        _find_current_subtitle(video_id, effective_current_time)
        if effective_current_time is not None
        else None
    )

    recent_flashcards = (
        Flashcard.query.filter_by(user_id=user_id, video_id=video_id)
        .order_by(Flashcard.created_at.desc())
        .limit(5)
        .all()
    )

    ai_analysis = video.ai_analysis
    missing: list[str] = []
    if not ai_analysis:
        missing.append("movie_ai_analysis")
    if effective_current_time is None:
        missing.append("current_time")
    if effective_current_time is not None and not current_subtitle:
        missing.append("current_subtitle")

    payload = {
        "context_type": "movie",
        "video": {
            "id": video.id,
            "title": video.title,
            "slug": video.slug,
            "description": video.description,
            "original_title": video.original_title,
            "release_year": video.release_year,
            "runtime": video.runtime,
            "level": video.level,
            "status": video.status,
            "view_count": video.view_count,
        },
        "runtime": {
            "requested_current_time": requested_current_time,
            "effective_current_time": effective_current_time,
            "time_source": time_source,
        },
        "current_subtitle": _serialize_subtitle(current_subtitle),
        "user_history": {
            "last_position": watch_history.last_position,
            "duration": watch_history.duration,
            "watched_at": watch_history.watched_at.isoformat() if watch_history and watch_history.watched_at else None,
        }
        if watch_history
        else None,
        "movie_analysis": {
            "movie_score": ai_analysis.movie_score,
            "movie_level": ai_analysis.movie_level,
            "movie_cefr_range": ai_analysis.movie_cefr_range,
            "dominant_grammar_tags": ai_analysis.dominant_grammar_tags or [],
            "top_hard_segments": (ai_analysis.top_hard_segments or [])[:3],
        }
        if ai_analysis
        else None,
        "recent_flashcards": [_serialize_flashcard(item) for item in recent_flashcards],
        "missing": missing,
    }

    return {"success": True, "data": payload}


def build_flashcard_context_service(
    user_id: str,
    flashcard_id: int | None = None,
):
    selected_flashcard = None
    if flashcard_id is not None:
        selected_flashcard = Flashcard.query.filter_by(
            id=flashcard_id,
            user_id=user_id,
        ).first()
        if not selected_flashcard:
            return {"success": False, "error": "Không tìm thấy flashcard", "code": 404}

    recent_flashcards = (
        Flashcard.query.filter_by(user_id=user_id)
        .order_by(Flashcard.created_at.desc())
        .limit(10)
        .all()
    )

    recent_exercise = (
        FlashcardExercise.query.filter_by(user_id=user_id)
        .order_by(FlashcardExercise.created_at.desc(), FlashcardExercise.id.desc())
        .first()
    )

    missing: list[str] = []
    if not recent_flashcards:
        missing.append("flashcards")
    if not recent_exercise:
        missing.append("flashcard_exercise")

    payload = {
        "context_type": "flashcard",
        "selected_flashcard": _serialize_flashcard(selected_flashcard) if selected_flashcard else None,
        "recent_flashcards": [_serialize_flashcard(item) for item in recent_flashcards],
        "recent_exercise": _serialize_flashcard_exercise(recent_exercise),
        "missing": missing,
    }

    return {"success": True, "data": payload}


def build_roadmap_context_service(
    user_id: str,
    roadmap_id: int | None = None,
    client_state: dict | None = None,
):
    client_state = client_state or {}
    day_number = _safe_int(client_state.get("day_number"))

    selected_roadmap = None
    if roadmap_id is not None:
        selected_roadmap = StudyRoadmap.query.filter_by(id=roadmap_id, user_id=user_id).first()
        if not selected_roadmap:
            return {"success": False, "error": "Không tìm thấy roadmap", "code": 404}
    else:
        selected_roadmap = (
            StudyRoadmap.query.filter_by(user_id=user_id)
            .order_by(StudyRoadmap.created_at.desc(), StudyRoadmap.id.desc())
            .first()
        )

    latest_assessment = (
        AIAssessment.query.filter_by(user_id=user_id, status="COMPLETED")
        .order_by(AIAssessment.updated_at.desc(), AIAssessment.id.desc())
        .first()
    )

    current_task = None
    generated_tasks: list[DailyTask] = []
    if selected_roadmap:
        generated_tasks = (
            DailyTask.query.filter_by(roadmap_id=selected_roadmap.id)
            .order_by(DailyTask.day_number.asc())
            .limit(5)
            .all()
        )

        if day_number is not None:
            current_task = DailyTask.query.filter_by(
                roadmap_id=selected_roadmap.id,
                day_number=day_number,
            ).first()

        if not current_task:
            current_task = (
                DailyTask.query.filter_by(roadmap_id=selected_roadmap.id, status="pending")
                .order_by(DailyTask.day_number.asc())
                .first()
            )

        if not current_task:
            current_task = (
                DailyTask.query.filter_by(roadmap_id=selected_roadmap.id)
                .order_by(DailyTask.day_number.desc(), DailyTask.id.desc())
                .first()
            )

    missing: list[str] = []
    if not latest_assessment:
        missing.append("assessment")
    if not selected_roadmap:
        missing.append("roadmap")
    if selected_roadmap and not current_task:
        missing.append("daily_task")

    payload = {
        "context_type": "roadmap",
        "runtime": {
            "requested_day_number": day_number,
        },
        "latest_assessment": _serialize_assessment(latest_assessment),
        "selected_roadmap": _serialize_roadmap(selected_roadmap),
        "current_task": _serialize_daily_task(current_task),
        "generated_tasks_preview": [_serialize_daily_task(task) for task in generated_tasks],
        "missing": missing,
    }

    return {"success": True, "data": payload}


def build_typing_game_context_service(
    user_id: str,
    map_id: int | None = None,
    client_state: dict | None = None,
):
    del user_id
    client_state = client_state or {}

    resolved_map_id = map_id if map_id is not None else _safe_int(client_state.get("map_id"))
    requested_chapter_number = _safe_int(client_state.get("chapter_number"))

    selected_map = None
    if resolved_map_id is not None:
        selected_map = TypingGameMap.query.get(resolved_map_id)
        if not selected_map:
            return {"success": False, "error": "Không tìm thấy typing map", "code": 404}
    else:
        selected_map = TypingGameMap.query.order_by(TypingGameMap.created_at.desc(), TypingGameMap.id.desc()).first()

    current_stage = None
    preview_stages: list[TypingGameStage] = []
    if selected_map:
        preview_stages = (
            TypingGameStage.query.filter_by(map_id=selected_map.id)
            .order_by(TypingGameStage.chapter_number.asc())
            .limit(5)
            .all()
        )

        if requested_chapter_number is not None:
            current_stage = TypingGameStage.query.filter_by(
                map_id=selected_map.id,
                chapter_number=requested_chapter_number,
            ).first()

        if not current_stage:
            current_stage = (
                TypingGameStage.query.filter_by(map_id=selected_map.id)
                .order_by(TypingGameStage.chapter_number.asc())
                .first()
            )

    missing: list[str] = []
    if not selected_map:
        missing.append("typing_map")
    if selected_map and not current_stage:
        missing.append("typing_stage")

    payload = {
        "context_type": "typing_game",
        "runtime": {
            "requested_map_id": resolved_map_id,
            "requested_chapter_number": requested_chapter_number,
        },
        "selected_map": _serialize_typing_map(selected_map),
        "current_stage": _serialize_typing_stage(current_stage),
        "stages_preview": [_serialize_typing_stage(stage) for stage in preview_stages],
        "missing": missing,
    }

    return {"success": True, "data": payload}


def build_realtime_practice_context_service(
    user_id: str,
    client_state: dict | None = None,
):
    del user_id
    client_state = client_state or {}

    topic = client_state.get("topic")
    questions = client_state.get("questions") if isinstance(client_state.get("questions"), list) else []
    vocabulary = client_state.get("vocabulary") if isinstance(client_state.get("vocabulary"), list) else []

    missing: list[str] = []
    if not topic:
        missing.append("topic")
    if not questions:
        missing.append("questions")
    if not vocabulary:
        missing.append("vocabulary")

    payload = {
        "context_type": "realtime_practice",
        "runtime": {
            "mode": client_state.get("mode"),
            "room_id": client_state.get("room_id"),
            "match_status": client_state.get("match_status"),
            "partner_name": client_state.get("partner_name"),
        },
        "topic_bundle": {
            "topic": topic,
            "questions": questions,
            "vocabulary": vocabulary,
        },
        "missing": missing,
    }

    return {"success": True, "data": payload}


def build_general_context_service(user_id: str):
    del user_id
    return {
        "success": True,
        "data": {
            "context_type": "general",
            "missing": [],
        },
    }


def build_chat_context_service(
    user_id: str,
    context_type: str = "general",
    context_id: int | None = None,
    client_state: dict | None = None,
):
    if context_type == "movie":
        if context_id is None:
            return {"success": False, "error": "Thiếu context_id cho movie", "code": 400}
        return build_movie_context_service(user_id=user_id, video_id=context_id, client_state=client_state)

    if context_type == "flashcard":
        return build_flashcard_context_service(user_id=user_id, flashcard_id=context_id)

    if context_type == "roadmap":
        return build_roadmap_context_service(user_id=user_id, roadmap_id=context_id, client_state=client_state)

    if context_type == "typing_game":
        return build_typing_game_context_service(user_id=user_id, map_id=context_id, client_state=client_state)

    if context_type == "realtime_practice":
        return build_realtime_practice_context_service(user_id=user_id, client_state=client_state)

    return build_general_context_service(user_id=user_id)
