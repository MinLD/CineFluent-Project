import os
from pathlib import Path


def get_subtitle_storage_dir() -> str:
    configured_dir = os.getenv("SUBTITLE_STORAGE_DIR")
    if configured_dir:
        storage_dir = Path(configured_dir)
    else:
        project_root = Path(__file__).resolve().parents[2]
        storage_dir = project_root / "storage" / "subtitles"

    storage_dir.mkdir(parents=True, exist_ok=True)
    return str(storage_dir)
