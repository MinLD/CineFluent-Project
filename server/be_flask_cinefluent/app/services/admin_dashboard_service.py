from datetime import datetime, timedelta

from sqlalchemy import func

from ..extensions import db
from ..models.models_model import (
    MovieAIAnalysis,
    MovieRequest,
    Subtitle,
    User,
    UserProfile,
    Video,
    VideoReport,
    WatchHistory,
)


def get_admin_dashboard_overview(days: int = 7, top: int = 5):
    total_users = User.query.with_entities(func.count(User.id)).scalar() or 0

    active_users = (
        db.session.query(func.count(UserProfile.id))
        .filter(UserProfile.is_online.is_(True))
        .scalar()
        or 0
    )

    total_videos = db.session.query(func.count(Video.id)).scalar() or 0

    public_videos = (
        db.session.query(func.count(Video.id))
        .filter(Video.status == "public")
        .scalar()
        or 0
    )

    pending_requests = (
        db.session.query(func.count(MovieRequest.id))
        .filter(MovieRequest.status == "PENDING")
        .scalar()
        or 0
    )

    pending_reports = (
        db.session.query(func.count(VideoReport.id))
        .filter(VideoReport.status == "PENDING")
        .scalar()
        or 0
    )

    videos_with_ai = db.session.query(func.count(MovieAIAnalysis.id)).scalar() or 0
    videos_with_subtitle = (
        db.session.query(func.count(func.distinct(Subtitle.video_id))).scalar() or 0
    )

    videos_without_ai = max(0, total_videos - videos_with_ai)
    videos_without_subtitle = max(0, total_videos - videos_with_subtitle)

    days = max(3, min(days, 90))
    today = datetime.utcnow().date()
    day_list = [today - timedelta(days=offset) for offset in range(days - 1, -1, -1)]
    start_date = day_list[0]

    new_user_rows = (
        db.session.query(func.date(User.created_at), func.count(User.id))
        .filter(func.date(User.created_at) >= start_date)
        .group_by(func.date(User.created_at))
        .all()
    )
    new_user_map = {str(d): c for d, c in new_user_rows}

    active_rows = (
        db.session.query(
            func.date(WatchHistory.watched_at),
            func.count(func.distinct(WatchHistory.user_id)),
        )
        .filter(func.date(WatchHistory.watched_at) >= start_date)
        .group_by(func.date(WatchHistory.watched_at))
        .all()
    )
    active_map = {str(d): c for d, c in active_rows}

    growth_dates = [d.isoformat() for d in day_list]
    growth_new_users = [new_user_map.get(d.isoformat(), 0) for d in day_list]
    growth_active_users = [active_map.get(d.isoformat(), 0) for d in day_list]

    top = max(3, min(top, 20))
    
    top_rows = (
        db.session.query(
        Video.id,
        Video.title,
        Video.slug,
        Video.view_count,
        Video.status,
        Video.level,
        MovieAIAnalysis.movie_cefr_range,
        func.count(Subtitle.id).label("subtitle_count"),
        )
        .outerjoin(Subtitle, Subtitle.video_id == Video.id)
        .outerjoin(MovieAIAnalysis, MovieAIAnalysis.video_id == Video.id)
        .group_by(
            Video.id,
            Video.title,
            Video.slug,
            Video.view_count,
            Video.status,
            Video.level,
            MovieAIAnalysis.movie_cefr_range,
        )
        .order_by(Video.view_count.desc(), Video.id.desc())
        .limit(top)
        .all()
    )
    top_videos = [
    {
        "id": row.id,
        "title": row.title,
        "slug": row.slug,
        "view_count": row.view_count or 0,
        "status": row.status,
        "level": row.level,
        "cefr": row.movie_cefr_range,
        "subtitle_count": row.subtitle_count or 0,
    }
    for row in top_rows
]
    
    alerts = []
    
    if pending_reports > 0:
        alerts.append(
            {
                "key": "pending_reports",
                "level": "critical",
                "title": "Co bao loi video chua xu ly",
                "value": pending_reports,
            }
        )
    
    if pending_requests > 0:
        alerts.append(
            {
                "key": "pending_requests",
                "level": "warning",
                "title": "Co yeu cau phim cho xu ly",
                "value": pending_requests,
            }
        )
    
    if videos_without_subtitle > 0:
        alerts.append(
            {
                "key": "videos_without_subtitle",
                "level": "warning",
                "title": "Co phim chua co subtitle",
                "value": videos_without_subtitle,
            }
        )

    if videos_without_ai > 0:
        alerts.append(
            {
                "key": "videos_without_ai",
                "level": "info",
                "title": "Co phim chua phan tich do kho AI",
                "value": videos_without_ai,
            }
        )
    recent_users = (
        db.session.query(User.email, User.created_at)
        .order_by(User.created_at.desc())
        .limit(5)
        .all()
    )
    recent_requests = (
        db.session.query(MovieRequest.title, MovieRequest.created_at)
        .order_by(MovieRequest.created_at.desc())
        .limit(5)
        .all()
    )

    recent_reports = (
        db.session.query(VideoReport.issue_type, VideoReport.created_at)
        .order_by(VideoReport.created_at.desc())
        .limit(5)
        .all()
    )

    recent_activities = []

    for row in recent_users:
        recent_activities.append(
            {
                "type": "user_registered",
                "label": f"User moi: {row.email}",
                "created_at": row.created_at.isoformat(),
            }
        )

    for row in recent_requests:
        recent_activities.append(
            {
                "type": "movie_request",
                "label": f"Yeu cau phim: {row.title}",
                "created_at": row.created_at.isoformat(),
            }
        )

    for row in recent_reports:
        recent_activities.append(
            {
                "type": "video_report",
                "label": f"Bao loi: {row.issue_type}",
                "created_at": row.created_at.isoformat(),
            }
        )

    recent_activities = sorted(
        recent_activities,
        key=lambda x: x["created_at"],
        reverse=True,
    )[:10]
    
    return {
        "summary": {
            "total_users": total_users,
            "active_users": active_users,
            "total_videos": total_videos,
            "public_videos": public_videos,
            "pending_requests": pending_requests,
            "pending_reports": pending_reports,
        },
        "charts": {
            "user_growth": {
                "dates": growth_dates,
                "new_users": growth_new_users,
                "active_users": growth_active_users,
            },
            "content_status": {
                "videos_with_ai": videos_with_ai,
                "videos_without_ai": videos_without_ai,
                "videos_with_subtitle": videos_with_subtitle,
                "videos_without_subtitle": videos_without_subtitle,
            },
        },
        "top_videos": top_videos,
        "alerts": alerts,
        "recent_activities": recent_activities,
    }
