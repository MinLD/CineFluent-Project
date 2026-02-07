from app import create_app
from app.models.models_model import Video
from app.services.video_service import create_unique_slug
from app.extensions import db

app = create_app()

with app.app_context():
    videos = Video.query.filter(
        (Video.slug == None) | (Video.slug == '')
    ).all()

    print(f"🔍 Found {len(videos)} videos missing slug")

    for video in videos:
        video.slug = create_unique_slug(Video, video.title)
        print(f"✅ {video.id} → {video.slug}")

    db.session.commit()
    print("🎉 Slug backfill completed")