from __future__ import annotations

import argparse
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app import create_app
from app.extensions import db
from app.models.models_model import MovieAIAnalysis, Subtitle, Video
from app.services.movie_ai_service import (
    load_movie_ai_bundle,
    save_video_ai_analysis_failure_service,
    save_video_ai_analysis_service,
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Dong bo du lieu AI phan tich do kho cho video."
    )
    parser.add_argument(
        "--video-id",
        type=int,
        action="append",
        dest="video_ids",
        help="Chi phan tich video co id chi dinh. Co the truyen nhieu lan.",
    )
    parser.add_argument(
        "--only-missing",
        action="store_true",
        help="Chi phan tich nhung video chua co ban ghi movie_ai_analyses.",
    )
    parser.add_argument(
        "--include-failed",
        action="store_true",
        help="Khi dung --only-missing, van lay them nhung video co status FAILED.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Gioi han so video xu ly trong mot lan chay.",
    )
    parser.add_argument(
        "--public-only",
        action="store_true",
        help="Chi xu ly video public.",
    )
    return parser.parse_args()


def build_query(args):
    query = Video.query.order_by(Video.id.asc())

    if args.video_ids:
        query = query.filter(Video.id.in_(args.video_ids))

    if args.public_only:
        query = query.filter(Video.status == "public")

    if args.only_missing:
        query = query.outerjoin(MovieAIAnalysis, MovieAIAnalysis.video_id == Video.id)
        if args.include_failed:
            query = query.filter(
                (MovieAIAnalysis.id.is_(None))
                | (MovieAIAnalysis.status == "FAILED")
            )
        else:
            query = query.filter(MovieAIAnalysis.id.is_(None))

    if args.limit:
        query = query.limit(args.limit)

    return query


def get_ordered_subtitles(video_id: int):
    return (
        Subtitle.query.filter_by(video_id=video_id)
        .order_by(Subtitle.start_time.asc())
        .all()
    )


def main():
    args = parse_args()
    app = create_app()

    with app.app_context():
        print("[movie-ai-sync] Warming up AI model bundle...")
        bundle = load_movie_ai_bundle()
        print(
            f"[movie-ai-sync] Model ready: {bundle.get('model_name')} from {bundle.get('model_dir')}"
        )

        videos = build_query(args).all()
        print(f"[movie-ai-sync] Found {len(videos)} video(s) to process.")

        summary = {
            "processed": 0,
            "ready": 0,
            "failed": 0,
            "skipped": 0,
        }

        for index, video in enumerate(videos, start=1):
            subtitles = get_ordered_subtitles(video.id)
            english_subtitles = [
                subtitle for subtitle in subtitles if (subtitle.content_en or "").strip()
            ]

            if not english_subtitles:
                summary["skipped"] += 1
                print(
                    f"[movie-ai-sync] [{index}/{len(videos)}] Skip video_id={video.id} title={video.title!r}: no English subtitles."
                )
                continue

            try:
                print(
                    f"[movie-ai-sync] [{index}/{len(videos)}] Processing video_id={video.id} title={video.title!r} subtitles={len(english_subtitles)}"
                )
                report = save_video_ai_analysis_service(video, english_subtitles)
                summary["processed"] += 1
                summary["ready"] += 1
                print(
                    f"[movie-ai-sync] READY video_id={video.id} level={report['movie_level']} score={report['movie_score']}"
                )
            except Exception as ex:
                db.session.rollback()
                error_detail = str(ex).strip()
                error_message = (
                    f"{type(ex).__name__}: {error_detail}"
                    if error_detail
                    else type(ex).__name__
                )
                save_video_ai_analysis_failure_service(video, error_message)
                summary["processed"] += 1
                summary["failed"] += 1
                print(
                    f"[movie-ai-sync] FAILED video_id={video.id} title={video.title!r}: {error_message}"
                )

        print("[movie-ai-sync] Done.")
        print(
            "[movie-ai-sync] Summary: "
            f"processed={summary['processed']} ready={summary['ready']} failed={summary['failed']} skipped={summary['skipped']}"
        )


if __name__ == "__main__":
    main()
