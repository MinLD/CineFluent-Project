from flask import Blueprint, current_app, request

from ..services.movie_ai_service import analyze_subtitle_content_service
from ..utils.response import error_response, success_response


ai_bp = Blueprint("api/ai", __name__)


def _safe_decode(file_obj) -> str:
    if not file_obj:
        return ""

    raw_bytes = file_obj.read()
    encodings = ["utf-8", "utf-16", "cp1258", "windows-1252", "latin-1"]

    for encoding in encodings:
        try:
            return raw_bytes.decode(encoding)
        except UnicodeDecodeError:
            continue

    return raw_bytes.decode("utf-8", errors="replace")


@ai_bp.route("/movie-difficulty/predict", methods=["POST"])
def predict_movie_difficulty():
    try:
        subtitle_file = request.files.get("subtitle_file") or request.files.get("file")
        source_name = None
        subtitle_text = ""

        if subtitle_file and getattr(subtitle_file, "filename", ""):
            source_name = subtitle_file.filename
            subtitle_text = _safe_decode(subtitle_file)
        elif request.is_json:
            payload = request.get_json(silent=True) or {}
            subtitle_text = (payload.get("subtitle_text") or payload.get("content") or "").strip()
            source_name = payload.get("filename") or payload.get("source_name")
        else:
            subtitle_text = (request.form.get("subtitle_text") or request.form.get("content") or "").strip()
            source_name = request.form.get("filename") or request.form.get("source_name")

        if not subtitle_text:
            return error_response(
                "Hay gui subtitle bang file .srt/.vtt (field 'subtitle_file' hoac 'file') "
                "hoac raw text bang 'subtitle_text'.",
                400,
                error_code="SUBTITLE_INPUT_REQUIRED",
            )

        current_app.logger.info(
            "[AI_DEMO_PREDICT_START] source_name=%s content_length=%s",
            source_name,
            len(subtitle_text),
        )

        report = analyze_subtitle_content_service(subtitle_text, source_name=source_name)
        response_payload = {
            "source_name": report.get("source_name"),
            "segment_count": report["segment_count"],
            "dominant_grammar_tags": report["dominant_grammar_tags"],
            "predicted_segments": report["predicted_segments"],
            "model_meta": report["model_meta"],
        }
        return success_response(
            data=response_payload,
            message="Phan tich ngu phap subtitle thanh cong.",
        )
    except Exception as ex:
        current_app.logger.exception("[AI_DEMO_PREDICT_ERROR]")
        return error_response(
            f"{type(ex).__name__}: {str(ex).strip()}" if str(ex).strip() else type(ex).__name__,
            500,
            error_code="AI_DEMO_PREDICT_FAILED",
        )
