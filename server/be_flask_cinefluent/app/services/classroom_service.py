import random
import string
import base64
import json
import os
import time
from datetime import datetime
from pathlib import Path

from flask import current_app
from google.genai import types
from werkzeug.datastructures import FileStorage

from ..extensions import db
from ..models.models_model import (
    ClassSessionAssignment,
    ClassSessionAssignmentSubmission,
    ClassSession,
    ClassSessionRecap,
    ClassSessionRecording,
    Classroom,
    ClassroomMember,
    GrammarTag,
    MovieAIAnalysis,
    Subtitle,
    User,
    Video,
)
from ..utils.ai_engine import cinefluent_ai


RECAP_MODEL_NAME = "gemini-2.5-flash"
RECAP_FALLBACK_MODEL_NAME = "gemini-2.5-flash-lite"
RECAP_SUMMARY_MAX_CHARS = 320
RECAP_POINT_MAX_CHARS = 110
RECAP_HOMEWORK_MAX_CHARS = 160
CLASS_ASSIGNMENT_MAX_QUESTIONS = 10


def _generate_invite_code(length: int = 6) -> str:
    alphabet = string.ascii_uppercase + string.digits
    for _ in range(12):
        code = "".join(random.choice(alphabet) for _ in range(length))
        if not Classroom.query.filter_by(invite_code=code).first():
            return code
    raise RuntimeError("KhÃ´ng thá»ƒ táº¡o mÃ£ lá»›p duy nháº¥t")


def _serialize_user(user: User | None) -> dict | None:
    if not user:
        return None

    return {
        "id": user.id,
        "email": user.email,
        "fullname": user.profile.fullname if user.profile else None,
        "avatar_url": user.profile.avatar_url if user.profile else None,
    }


def _serialize_member(member: ClassroomMember) -> dict:
    return {
        "id": member.id,
        "user_id": member.user_id,
        "role": member.role,
        "joined_at": member.joined_at.isoformat() if member.joined_at else None,
        "user": _serialize_user(member.user),
    }


def _serialize_session(session: ClassSession) -> dict:
    recap = session.recap
    return {
        "id": session.id,
        "classroom_id": session.classroom_id,
        "title": session.title,
        "description": session.description,
        "scheduled_at": session.scheduled_at.isoformat() if session.scheduled_at else None,
        "grammar_focus": session.grammar_focus or [],
        "teacher_notes": session.teacher_notes,
        "status": session.status,
        "recap": _serialize_recap(recap) if recap else None,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "updated_at": session.updated_at.isoformat() if session.updated_at else None,
    }


def _serialize_recording(recording: ClassSessionRecording) -> dict:
    return {
        "id": recording.id,
        "session_id": recording.session_id,
        "uploaded_by": recording.uploaded_by,
        "mime_type": recording.mime_type,
        "file_size": recording.file_size,
        "duration_seconds": recording.duration_seconds,
        "status": recording.status,
        "error_message": recording.error_message,
        "created_at": recording.created_at.isoformat() if recording.created_at else None,
        "updated_at": recording.updated_at.isoformat() if recording.updated_at else None,
    }


def _serialize_recap(recap: ClassSessionRecap) -> dict:
    return {
        "id": recap.id,
        "session_id": recap.session_id,
        "recording_id": recap.recording_id,
        "summary_text": recap.summary_text,
        "key_points": recap.key_points or [],
        "examples": recap.examples or [],
        "homework_text": recap.homework_text,
        "review_suggestions": recap.review_suggestions or [],
        "transcript_text": recap.transcript_text,
        "model_name": recap.model_name,
        "created_at": recap.created_at.isoformat() if recap.created_at else None,
        "updated_at": recap.updated_at.isoformat() if recap.updated_at else None,
    }


def _normalize_text_for_compare(value: str | None) -> str:
    return " ".join(str(value or "").strip().lower().replace("_", " ").split())


def _resolve_grammar_focus_tag_ids(grammar_focus) -> list[int]:
    normalized_values = {
        _normalize_text_for_compare(item) for item in _normalize_grammar_focus(grammar_focus)
    }
    if not normalized_values:
        return []

    tags = GrammarTag.query.all()
    matched_ids = []
    for tag in tags:
        candidates = {
            _normalize_text_for_compare(tag.name_en),
            _normalize_text_for_compare(tag.name_vi),
        }
        if normalized_values.intersection(candidates):
            matched_ids.append(tag.id)
    return matched_ids


def _build_assignment_question(subtitle: Subtitle, index: int) -> dict | None:
    cloze_data = subtitle.cloze_data or {}
    masked_text = (cloze_data.get("masked_text") or "").strip()
    answer = (cloze_data.get("target_word") or "").strip()
    distractors = cloze_data.get("distractors") or []

    options = [answer, *[str(item).strip() for item in distractors if str(item).strip()]]
    seen = set()
    normalized_options = []
    for option in options:
        key = option.lower()
        if key in seen or not option:
            continue
        seen.add(key)
        normalized_options.append(option)

    if not masked_text or not answer or len(normalized_options) < 2:
        return None

    random.shuffle(normalized_options)
    explanation = (
        f'Đáp án đúng là "{answer}" vì đây là từ gốc bị che trong câu subtitle.'
    )

    return {
        "id": f"q_{subtitle.id}_{index}",
        "subtitle_id": int(subtitle.id),
        "prompt": masked_text,
        "translation": subtitle.content_vi,
        "full_sentence": subtitle.content_en,
        "answer": answer,
        "options": normalized_options,
        "tag_id": subtitle.grammar_tag_id,
        "explanation": explanation,
    }


def _serialize_assignment_submission(submission: ClassSessionAssignmentSubmission | None) -> dict | None:
    if not submission:
        return None

    return {
        "id": submission.id,
        "assignment_id": submission.assignment_id,
        "user_id": submission.user_id,
        "user_name": submission.user.profile.fullname if submission.user and submission.user.profile else None,
        "user_email": submission.user.email if submission.user else None,
        "answers": submission.answers or [],
        "result_json": submission.result_json or [],
        "score": submission.score,
        "total_questions": submission.total_questions,
        "correct_answers": submission.correct_answers,
        "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
        "created_at": submission.created_at.isoformat() if submission.created_at else None,
        "updated_at": submission.updated_at.isoformat() if submission.updated_at else None,
    }


def _serialize_assignment(
    assignment: ClassSessionAssignment,
    *,
    include_answers: bool,
    user_submission: ClassSessionAssignmentSubmission | None = None,
    include_submission_summaries: bool = False,
) -> dict:
    questions = []
    for item in assignment.quiz_data or []:
        question = {
            "id": item.get("id"),
            "subtitle_id": item.get("subtitle_id"),
            "prompt": item.get("prompt"),
            "translation": item.get("translation"),
            "full_sentence": item.get("full_sentence"),
            "options": item.get("options") or [],
            "tag_id": item.get("tag_id"),
        }
        if include_answers:
            question["answer"] = item.get("answer")
            question["explanation"] = item.get("explanation")
        questions.append(question)

    payload = {
        "id": assignment.id,
        "classroom_id": assignment.classroom_id,
        "created_by": assignment.created_by,
        "source_video_id": assignment.source_video_id,
        "source_video_title": assignment.source_video.title if assignment.source_video else None,
        "title": assignment.title,
        "instructions": assignment.instructions,
        "grammar_focus": assignment.grammar_focus or [],
        "question_count": assignment.question_count,
        "status": assignment.status,
        "questions": questions,
        "submission": _serialize_assignment_submission(user_submission),
        "created_at": assignment.created_at.isoformat() if assignment.created_at else None,
        "updated_at": assignment.updated_at.isoformat() if assignment.updated_at else None,
    }

    if include_submission_summaries:
        submissions = (
            assignment.submissions.order_by(
                ClassSessionAssignmentSubmission.submitted_at.desc(),
                ClassSessionAssignmentSubmission.id.desc(),
            ).all()
        )
        payload["submission_summaries"] = [
            _serialize_assignment_submission(submission) for submission in submissions
        ]

    return payload


def _get_classroom_or_error(user_id: str, classroom_id: int):
    membership = _get_membership(user_id, classroom_id)
    if not membership:
        return None, None, {"success": False, "error": "Bạn không thuộc lớp học này", "code": 403}

    classroom = Classroom.query.get(classroom_id)
    if not classroom or classroom.status != "ACTIVE":
        return None, None, {"success": False, "error": "Không tìm thấy lớp học", "code": 404}

    return membership, classroom, None


def _build_assignment_payload(
    *,
    classroom: Classroom,
    video: Video,
    question_count: int,
    grammar_focus_override=None,
):
    tag_ids = _resolve_grammar_focus_tag_ids(grammar_focus_override)

    query = Subtitle.query.filter(
        Subtitle.video_id == video.id,
        Subtitle.cloze_data.isnot(None),
    )
    if tag_ids:
        query = query.filter(Subtitle.grammar_tag_id.in_(tag_ids))

    candidates = query.order_by(Subtitle.start_time.asc()).all()
    if not candidates:
        raise ValueError("Phim này chưa có đủ subtitle AI để tạo bài tập theo trọng tâm đã chọn.")

    random.shuffle(candidates)
    questions = []
    for subtitle in candidates:
        question = _build_assignment_question(subtitle, len(questions) + 1)
        if not question:
            continue
        questions.append(question)
        if len(questions) >= question_count:
            break

    if not questions:
        raise ValueError("Không tạo được câu hỏi hợp lệ từ subtitle AI của phim này.")

    if len(questions) < question_count:
        question_count = len(questions)

    grammar_focus = grammar_focus_override or []
    title = f"Bài tập về nhà - {classroom.name}"
    instructions = "Chọn đáp án đúng theo câu subtitle đã bị che từ. Làm xong để xem điểm và giải thích."

    return {
        "title": title,
        "instructions": instructions,
        "grammar_focus": _normalize_grammar_focus(grammar_focus),
        "question_count": question_count,
        "quiz_data": questions,
    }


def _serialize_classroom(
    classroom: Classroom,
    user_id: str | None = None,
    include_members: bool = False,
    include_sessions: bool = False,
) -> dict:
    members = classroom.members.order_by(ClassroomMember.joined_at.asc()).all()
    current_member = None
    if user_id:
        current_member = next((member for member in members if member.user_id == user_id), None)

    payload = {
        "id": classroom.id,
        "name": classroom.name,
        "description": classroom.description,
        "invite_code": classroom.invite_code,
        "status": classroom.status,
        "teacher_id": classroom.teacher_id,
        "teacher": _serialize_user(classroom.teacher),
        "member_count": len(members),
        "my_role": current_member.role if current_member else None,
        "created_at": classroom.created_at.isoformat() if classroom.created_at else None,
        "updated_at": classroom.updated_at.isoformat() if classroom.updated_at else None,
    }

    if include_members:
        payload["members"] = [_serialize_member(member) for member in members]

    if include_sessions:
        sessions = (
            classroom.sessions.order_by(
                ClassSession.scheduled_at.desc(),
                ClassSession.created_at.desc(),
                ClassSession.id.desc(),
            ).all()
        )
        payload["sessions"] = [_serialize_session(session) for session in sessions]

    return payload


def _get_membership(user_id: str, classroom_id: int) -> ClassroomMember | None:
    return ClassroomMember.query.filter_by(
        classroom_id=classroom_id,
        user_id=user_id,
    ).first()


def _parse_scheduled_at(value: str | None):
    if not value:
        return None

    normalized = str(value).strip()
    if not normalized:
        return None

    try:
        return datetime.fromisoformat(normalized.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return None


def _normalize_grammar_focus(value):
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    return []


def _get_recordings_dir() -> Path:
    storage_root = current_app.config.get("CLASS_RECORDING_STORAGE_DIR")
    if not storage_root:
        storage_root = os.path.join(current_app.root_path, "..", "storage", "class_recordings")
    recordings_dir = Path(storage_root).resolve()
    recordings_dir.mkdir(parents=True, exist_ok=True)
    return recordings_dir


def _normalize_short_text(value, max_chars: int) -> str:
    text = " ".join(str(value or "").split()).strip()
    if not text:
        return ""
    if len(text) <= max_chars:
        return text
    return text[: max_chars - 1].rstrip(" ,;:.") + "…"


def _normalize_short_list(values, *, limit: int, max_chars: int) -> list[str]:
    normalized = []
    for value in values or []:
        text = _normalize_short_text(value, max_chars=max_chars)
        if not text:
            continue
        normalized.append(text)
        if len(normalized) >= limit:
            break
    return normalized


def _compact_recap_payload(payload: dict) -> dict:
    summary_text = _normalize_short_text(
        payload.get("summary_text") or "Chưa có tóm tắt ngắn cho buổi học này.",
        max_chars=RECAP_SUMMARY_MAX_CHARS,
    )
    key_points = _normalize_short_list(
        payload.get("key_points"),
        limit=3,
        max_chars=RECAP_POINT_MAX_CHARS,
    )
    homework_text = _normalize_short_text(
        payload.get("homework_text"),
        max_chars=RECAP_HOMEWORK_MAX_CHARS,
    )
    review_suggestions = _normalize_short_list(
        payload.get("review_suggestions"),
        limit=2,
        max_chars=RECAP_POINT_MAX_CHARS,
    )

    payload["summary_text"] = summary_text
    payload["key_points"] = key_points
    payload["homework_text"] = homework_text
    payload["review_suggestions"] = review_suggestions
    return payload


def _generate_recap_content(model_name: str, prompt: str, audio_base64: str, mime_type: str, recap_schema: dict):
    return cinefluent_ai.models.generate_content(
        model=model_name,
        contents=[
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type or "audio/webm",
                            "data": audio_base64,
                        }
                    },
                ]
            }
        ],
        config=types.GenerateContentConfig(
            temperature=0.25,
            response_mime_type="application/json",
            response_schema=recap_schema,
        ),
    )


def _build_recap_with_ai(session: ClassSession, audio_base64: str, mime_type: str):
    recap_schema = {
        "type": "OBJECT",
        "properties": {
            "transcript_text": {"type": "STRING"},
            "summary_text": {"type": "STRING"},
            "key_points": {"type": "ARRAY", "items": {"type": "STRING"}},
            "examples": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "title": {"type": "STRING"},
                        "content": {"type": "STRING"},
                    },
                    "required": ["title", "content"],
                },
            },
            "homework_text": {"type": "STRING"},
            "review_suggestions": {"type": "ARRAY", "items": {"type": "STRING"}},
        },
        "required": [
            "transcript_text",
            "summary_text",
            "key_points",
            "examples",
            "homework_text",
            "review_suggestions",
        ],
    }

    grammar_focus = ", ".join(session.grammar_focus or []) or "chưa chọn"
    prompt = f"""
    Nghe audio lớp học và trả JSON.
    Chỉ dùng nội dung thực sự nghe được, không tự thêm kiến thức.
    Context chỉ để tham khảo, không dùng để bịa thêm: title={session.title}; focus={grammar_focus}; notes={session.teacher_notes or "Không có"}.

    Bắt buộc:
    - summary_text: tóm tắt 2-3 câu, tối đa 100 ký tự.
    - key_points: tối đa 3 ý, mỗi ý ngắn.
    - examples: chỉ ghi khi audio có ví dụ thật; không có thì [].
    - homework_text: 1 câu ngắn; nếu không có thì "Chưa ghi nhận bài tập được giao."
    - review_suggestions: tối đa 2 ý rất ngắn, chỉ dựa trên audio.
    - Nếu audio quá ngắn hoặc không rõ, phải nói rõ là thông tin hạn chế.

    JSON fields: transcript_text, summary_text, key_points, examples, homework_text, review_suggestions.
    """

    errors = []
    for model_name in [RECAP_MODEL_NAME, RECAP_FALLBACK_MODEL_NAME]:
        for attempt in range(3):
            try:
                response = _generate_recap_content(
                    model_name=model_name,
                    prompt=prompt,
                    audio_base64=audio_base64,
                    mime_type=mime_type,
                    recap_schema=recap_schema,
                )
                payload = _compact_recap_payload(json.loads(response.text))
                payload["_model_name"] = model_name
                return payload
            except Exception as exc:
                error_text = str(exc)
                errors.append(f"{model_name}: {error_text}")
                is_temporary = (
                    "503" in error_text
                    or "UNAVAILABLE" in error_text
                    or "429" in error_text
                    or "RESOURCE_EXHAUSTED" in error_text
                )
                if not is_temporary:
                    raise
                if attempt < 2:
                    time.sleep(2 * (attempt + 1))

    raise RuntimeError(
        "Gemini đang quá tải, vui lòng thử tạo recap lại sau vài phút. "
        + " | ".join(errors[-2:])
    )

def create_classroom_service(user_id: str, name: str, description: str | None = None):
    normalized_name = (name or "").strip()
    if not normalized_name:
        return {"success": False, "error": "TÃªn lá»›p khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng", "code": 400}

    classroom = Classroom(
        teacher_id=user_id,
        name=normalized_name,
        description=(description or "").strip() or None,
        invite_code=_generate_invite_code(),
        status="ACTIVE",
    )
    db.session.add(classroom)
    db.session.flush()

    db.session.add(
        ClassroomMember(
            classroom_id=classroom.id,
            user_id=user_id,
            role="teacher",
        )
    )
    db.session.commit()

    return {
        "success": True,
        "data": _serialize_classroom(classroom, user_id=user_id, include_members=True),
    }


def list_my_classrooms_service(user_id: str):
    memberships = (
        ClassroomMember.query.filter_by(user_id=user_id)
        .join(Classroom, ClassroomMember.classroom_id == Classroom.id)
        .filter(Classroom.status == "ACTIVE")
        .order_by(Classroom.updated_at.desc(), Classroom.id.desc())
        .all()
    )

    classrooms = [
        _serialize_classroom(member.classroom, user_id=user_id, include_members=False)
        for member in memberships
        if member.classroom
    ]

    return {"success": True, "data": {"classrooms": classrooms}}


def get_classroom_detail_service(user_id: str, classroom_id: int):
    membership = _get_membership(user_id, classroom_id)
    if not membership:
        return {"success": False, "error": "Báº¡n khÃ´ng thuá»™c lá»›p há»c nÃ y", "code": 403}

    classroom = Classroom.query.get(classroom_id)
    if not classroom or classroom.status != "ACTIVE":
        return {"success": False, "error": "KhÃ´ng tÃ¬m tháº¥y lá»›p há»c", "code": 404}

    return {
        "success": True,
        "data": _serialize_classroom(
            classroom,
            user_id=user_id,
            include_members=True,
            include_sessions=True,
        ),
    }


def join_classroom_service(user_id: str, invite_code: str):
    normalized_code = (invite_code or "").strip().upper()
    if not normalized_code:
        return {"success": False, "error": "Thiáº¿u mÃ£ lá»›p", "code": 400}

    classroom = Classroom.query.filter_by(invite_code=normalized_code, status="ACTIVE").first()
    if not classroom:
        return {"success": False, "error": "MÃ£ lá»›p khÃ´ng há»£p lá»‡", "code": 404}

    existing = ClassroomMember.query.filter_by(
        classroom_id=classroom.id,
        user_id=user_id,
    ).first()
    if existing:
        return {
            "success": True,
            "data": _serialize_classroom(classroom, user_id=user_id, include_members=True),
        }

    db.session.add(
        ClassroomMember(
            classroom_id=classroom.id,
            user_id=user_id,
            role="student",
        )
    )
    db.session.commit()

    return {
        "success": True,
        "data": _serialize_classroom(classroom, user_id=user_id, include_members=True),
    }


def list_class_sessions_service(user_id: str, classroom_id: int):
    membership = _get_membership(user_id, classroom_id)
    if not membership:
        return {"success": False, "error": "Báº¡n khÃ´ng thuá»™c lá»›p há»c nÃ y", "code": 403}

    classroom = Classroom.query.get(classroom_id)
    if not classroom or classroom.status != "ACTIVE":
        return {"success": False, "error": "KhÃ´ng tÃ¬m tháº¥y lá»›p há»c", "code": 404}

    sessions = (
        ClassSession.query.filter_by(classroom_id=classroom_id)
        .order_by(
            ClassSession.scheduled_at.desc(),
            ClassSession.created_at.desc(),
            ClassSession.id.desc(),
        )
        .all()
    )

    return {
        "success": True,
        "data": {"sessions": [_serialize_session(session) for session in sessions]},
    }


def create_class_session_service(
    user_id: str,
    classroom_id: int,
    title: str,
    description: str | None = None,
    scheduled_at: str | None = None,
    grammar_focus=None,
    teacher_notes: str | None = None,
):
    membership = _get_membership(user_id, classroom_id)
    if not membership:
        return {"success": False, "error": "Báº¡n khÃ´ng thuá»™c lá»›p há»c nÃ y", "code": 403}
    if membership.role != "teacher":
        return {"success": False, "error": "Chá»‰ giÃ¡o viÃªn má»›i Ä‘Æ°á»£c táº¡o buá»•i há»c", "code": 403}

    classroom = Classroom.query.get(classroom_id)
    if not classroom or classroom.status != "ACTIVE":
        return {"success": False, "error": "KhÃ´ng tÃ¬m tháº¥y lá»›p há»c", "code": 404}

    normalized_title = (title or "").strip()
    if not normalized_title:
        return {"success": False, "error": "TÃªn buá»•i há»c khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng", "code": 400}

    session = ClassSession(
        classroom_id=classroom_id,
        title=normalized_title,
        description=(description or "").strip() or None,
        scheduled_at=_parse_scheduled_at(scheduled_at),
        grammar_focus=_normalize_grammar_focus(grammar_focus),
        teacher_notes=(teacher_notes or "").strip() or None,
        status="PLANNED",
    )
    db.session.add(session)
    db.session.commit()

    return {"success": True, "data": _serialize_session(session)}


def upload_session_recording_service(
    user_id: str,
    classroom_id: int,
    session_id: int,
    audio_file: FileStorage | None,
    duration_seconds: float | None = None,
):
    membership = _get_membership(user_id, classroom_id)
    if not membership:
        return {"success": False, "error": "Báº¡n khÃ´ng thuá»™c lá»›p há»c nÃ y", "code": 403}
    if membership.role != "teacher":
        return {"success": False, "error": "Chá»‰ giÃ¡o viÃªn má»›i Ä‘Æ°á»£c ghi Ã¢m vÃ  táº¡o recap", "code": 403}

    session = ClassSession.query.filter_by(id=session_id, classroom_id=classroom_id).first()
    if not session:
        return {"success": False, "error": "KhÃ´ng tÃ¬m tháº¥y buá»•i há»c", "code": 404}
    if not audio_file:
        return {"success": False, "error": "Thiáº¿u file ghi Ã¢m", "code": 400}

    mime_type = audio_file.mimetype or "audio/webm"
    extension = "webm"
    if "mp4" in mime_type:
        extension = "mp4"
    elif "mpeg" in mime_type or "mp3" in mime_type:
        extension = "mp3"
    elif "wav" in mime_type:
        extension = "wav"

    recordings_dir = _get_recordings_dir()
    filename = f"classroom_{classroom_id}_session_{session_id}_{int(datetime.utcnow().timestamp())}.{extension}"
    file_path = recordings_dir / filename
    audio_file.save(file_path)
    file_size = file_path.stat().st_size

    recording = ClassSessionRecording(
        session_id=session.id,
        uploaded_by=user_id,
        file_path=str(file_path),
        mime_type=mime_type,
        file_size=file_size,
        duration_seconds=duration_seconds,
        status="UPLOADED",
    )
    db.session.add(recording)
    db.session.flush()

    try:
        audio_base64 = base64.b64encode(file_path.read_bytes()).decode("utf-8")
        payload = _build_recap_with_ai(session, audio_base64, mime_type)

        recap = ClassSessionRecap.query.filter_by(session_id=session.id).first()
        if not recap:
            recap = ClassSessionRecap(session_id=session.id, summary_text="")
            db.session.add(recap)

        recap.recording_id = recording.id
        recap.summary_text = payload.get("summary_text") or "AI chÆ°a táº¡o Ä‘Æ°á»£c tÃ³m táº¯t rÃµ rÃ ng."
        recap.key_points = payload.get("key_points") or []
        recap.examples = payload.get("examples") or []
        recap.homework_text = payload.get("homework_text")
        recap.review_suggestions = payload.get("review_suggestions") or []
        recap.transcript_text = payload.get("transcript_text")
        recap.model_name = payload.get("_model_name") or RECAP_MODEL_NAME
        recap.updated_at = datetime.utcnow()

        recording.status = "PROCESSED"
        db.session.commit()

        return {
            "success": True,
            "data": {
                "recording": _serialize_recording(recording),
                "recap": _serialize_recap(recap),
            },
        }
    except Exception as exc:
        recording.status = "FAILED"
        recording.error_message = str(exc)
        db.session.commit()
        return {"success": False, "error": str(exc), "code": 500}


def get_session_recap_service(user_id: str, classroom_id: int, session_id: int):
    membership = _get_membership(user_id, classroom_id)
    if not membership:
        return {"success": False, "error": "Báº¡n khÃ´ng thuá»™c lá»›p há»c nÃ y", "code": 403}

    session = ClassSession.query.filter_by(id=session_id, classroom_id=classroom_id).first()
    if not session:
        return {"success": False, "error": "KhÃ´ng tÃ¬m tháº¥y buá»•i há»c", "code": 404}

    recap = ClassSessionRecap.query.filter_by(session_id=session.id).first()
    if not recap:
        return {"success": False, "error": "Buá»•i há»c nÃ y chÆ°a cÃ³ recap", "code": 404}

    return {"success": True, "data": _serialize_recap(recap)}


def list_assignment_sources_service(user_id: str, classroom_id: int):
    membership, classroom, error = _get_classroom_or_error(user_id, classroom_id)
    if error:
        return error

    videos = (
        Video.query.join(MovieAIAnalysis, MovieAIAnalysis.video_id == Video.id)
        .filter(Video.source_type == "local")
        .filter(MovieAIAnalysis.status == "READY")
        .order_by(Video.release_year.desc(), Video.id.desc())
        .limit(40)
        .all()
    )

    payload = []
    for video in videos:
        query = Subtitle.query.filter(
            Subtitle.video_id == video.id,
            Subtitle.cloze_data.isnot(None),
        )
        total_candidate_count = query.count()
        if total_candidate_count <= 0:
            continue

        payload.append(
            {
                "id": video.id,
                "title": video.title,
                "level": video.level,
                "release_year": video.release_year,
                "candidate_count": total_candidate_count,
            }
        )

    tags = (
        GrammarTag.query.order_by(GrammarTag.id.asc()).all()
    )
    tag_payload = [
        {
            "id": tag.id,
            "name_en": tag.name_en,
            "name_vi": tag.name_vi,
        }
        for tag in tags
    ]

    return {"success": True, "data": {"sources": payload, "grammar_tags": tag_payload}}


def list_homework_assignments_service(user_id: str, classroom_id: int):
    membership, classroom, error = _get_classroom_or_error(user_id, classroom_id)
    if error:
        return error

    assignments = (
        ClassSessionAssignment.query.filter_by(classroom_id=classroom.id)
        .order_by(ClassSessionAssignment.created_at.desc(), ClassSessionAssignment.id.desc())
        .all()
    )

    serialized = []
    include_answers = membership.role == "teacher"
    include_submission_summaries = membership.role == "teacher"
    for assignment in assignments:
        submission = ClassSessionAssignmentSubmission.query.filter_by(
            assignment_id=assignment.id,
            user_id=user_id,
        ).first()
        serialized.append(
            _serialize_assignment(
                assignment,
                include_answers=include_answers,
                user_submission=submission,
                include_submission_summaries=include_submission_summaries,
            )
        )

    return {"success": True, "data": {"assignments": serialized}}


def create_homework_assignment_service(
    user_id: str,
    classroom_id: int,
    video_id: int,
    question_count: int | None = None,
    grammar_focus=None,
):
    membership, classroom, error = _get_classroom_or_error(user_id, classroom_id)
    if error:
        return error
    if membership.role != "teacher":
        return {"success": False, "error": "Chỉ giáo viên mới được tạo bài tập", "code": 403}

    try:
        normalized_video_id = int(video_id)
    except (TypeError, ValueError):
        return {"success": False, "error": "Phim nguồn không hợp lệ", "code": 400}

    video = Video.query.get(normalized_video_id)
    if not video:
        return {"success": False, "error": "Không tìm thấy phim nguồn", "code": 404}

    try:
        final_question_count = int(question_count or 5)
    except (TypeError, ValueError):
        final_question_count = 5
    final_question_count = max(1, min(final_question_count, CLASS_ASSIGNMENT_MAX_QUESTIONS))

    try:
        payload = _build_assignment_payload(
            classroom=classroom,
            video=video,
            question_count=final_question_count,
            grammar_focus_override=grammar_focus,
        )
    except ValueError as exc:
        return {"success": False, "error": str(exc), "code": 400}

    (
        ClassSessionAssignment.query.filter_by(classroom_id=classroom.id, status="ACTIVE")
        .update({"status": "CLOSED", "updated_at": datetime.utcnow()})
    )

    assignment = ClassSessionAssignment(
        classroom_id=classroom.id,
        created_by=user_id,
        source_video_id=video.id,
        title=payload["title"],
        instructions=payload["instructions"],
        grammar_focus=payload["grammar_focus"],
        question_count=payload["question_count"],
        quiz_data=payload["quiz_data"],
        status="ACTIVE",
    )
    db.session.add(assignment)
    db.session.commit()

    return {
        "success": True,
        "data": _serialize_assignment(
            assignment,
            include_answers=True,
            include_submission_summaries=True,
        ),
    }


def delete_homework_assignment_service(
    user_id: str,
    classroom_id: int,
    assignment_id: int,
):
    membership, classroom, error = _get_classroom_or_error(user_id, classroom_id)
    if error:
        return error
    if membership.role != "teacher":
        return {"success": False, "error": "Chỉ giáo viên mới được xóa bài tập", "code": 403}

    assignment = ClassSessionAssignment.query.filter_by(
        id=assignment_id,
        classroom_id=classroom.id,
    ).first()
    if not assignment:
        return {"success": False, "error": "Không tìm thấy bài tập", "code": 404}

    db.session.delete(assignment)
    db.session.commit()
    return {"success": True, "data": {"id": assignment_id}}


def submit_homework_assignment_service(
    user_id: str,
    classroom_id: int,
    assignment_id: int,
    answers,
):
    membership, classroom, error = _get_classroom_or_error(user_id, classroom_id)
    if error:
        return error

    assignment = ClassSessionAssignment.query.filter_by(
        id=assignment_id,
        classroom_id=classroom.id,
    ).first()
    if not assignment:
        return {"success": False, "error": "Không tìm thấy bài tập", "code": 404}

    raw_answers = answers if isinstance(answers, list) else []
    answer_map = {}
    for item in raw_answers:
        if not isinstance(item, dict):
            continue
        question_id = str(item.get("question_id") or "").strip()
        selected_option = str(item.get("selected_option") or "").strip()
        if question_id:
            answer_map[question_id] = selected_option

    results = []
    correct_answers = 0
    total_questions = len(assignment.quiz_data or [])
    for question in assignment.quiz_data or []:
        selected_option = answer_map.get(question.get("id"), "")
        correct_answer = question.get("answer") or ""
        is_correct = selected_option == correct_answer
        if is_correct:
            correct_answers += 1

        if selected_option:
            selected_explanation = (
                f'"{selected_option}" đúng với từ gốc trong câu.'
                if is_correct
                else f'"{selected_option}" không khớp với câu gốc. Từ đúng là "{correct_answer}".'
            )
        else:
            selected_explanation = "Bạn chưa chọn đáp án cho câu này."

        results.append(
            {
                "question_id": question.get("id"),
                "selected_option": selected_option,
                "correct_answer": correct_answer,
                "is_correct": is_correct,
                "explanation": question.get("explanation"),
                "selected_explanation": selected_explanation,
            }
        )

    score = round((correct_answers / total_questions) * 10, 2) if total_questions else 0.0

    submission = ClassSessionAssignmentSubmission.query.filter_by(
        assignment_id=assignment.id,
        user_id=user_id,
    ).first()
    if not submission:
        submission = ClassSessionAssignmentSubmission(
            assignment_id=assignment.id,
            user_id=user_id,
        )
        db.session.add(submission)

    submission.answers = raw_answers
    submission.result_json = results
    submission.score = score
    submission.total_questions = total_questions
    submission.correct_answers = correct_answers
    submission.submitted_at = datetime.utcnow()
    submission.updated_at = datetime.utcnow()
    db.session.commit()

    return {
        "success": True,
        "data": {
            "submission": _serialize_assignment_submission(submission),
            "assignment": _serialize_assignment(
                assignment,
                include_answers=False,
                user_submission=submission,
            ),
        },
    }
