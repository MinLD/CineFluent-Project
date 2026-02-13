

import os
import requests
from typing import Optional, List, Dict, Any

# Lấy API Key từ .env
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE_URL = "https://api.themoviedb.org/3"


def search_movie(query: str, page: int = 1) -> Dict[str, Any]:
    if not TMDB_API_KEY:
        raise ValueError("TMDB_API_KEY not found in environment variables!")
    
    url = f"{TMDB_BASE_URL}/search/movie"
    params = {
        "api_key": TMDB_API_KEY,
        "query": query,
        "page": page,
        "language": "vi-VN",  # Lấy title tiếng Việt nếu có
        "include_adult": False
    }
    
    response = requests.get(url, params=params)
    response.raise_for_status()  # Raise exception nếu lỗi HTTP
    
    data = response.json()
    
    # Format lại kết quả cho dễ dùng
    results = []
    for movie in data.get("results", []):
        results.append({
            "tmdb_id": movie.get("id"),
            "title": movie.get("title"),
            "original_title": movie.get("original_title"),
            "release_date": movie.get("release_date"),
            "year": movie.get("release_date", "")[:4] if movie.get("release_date") else None,
            "poster_path": f"https://image.tmdb.org/t/p/w500{movie.get('poster_path')}" if movie.get("poster_path") else None,
            "backdrop_path": f"https://image.tmdb.org/t/p/original{movie.get('backdrop_path')}" if movie.get("backdrop_path") else None,
            "overview": movie.get("overview"),
            "vote_average": movie.get("vote_average"),
        })
    
    return {
        "results": results,
        "total_results": data.get("total_results", 0),
        "total_pages": data.get("total_pages", 0),
        "page": data.get("page", 1)
    }


def get_movie_details(tmdb_id: int) -> Optional[Dict[str, Any]]:
    if not TMDB_API_KEY:
        raise ValueError("TMDB_API_KEY not found in environment variables!")
    
    url = f"{TMDB_BASE_URL}/movie/{tmdb_id}"
    params = {
        "api_key": TMDB_API_KEY,
        "language": "vi-VN",
        "append_to_response": "external_ids"  # ← Để lấy IMDb ID
    }
    
    response = requests.get(url, params=params)
    
    if response.status_code == 404:
        return None  # Phim không tồn tại
    
    response.raise_for_status()
    movie = response.json()
    
    # Lấy genres dạng list string
    genres = [genre.get("name") for genre in movie.get("genres", [])]
    
    # Lấy IMDb ID từ external_ids
    external_ids = movie.get("external_ids", {})
    imdb_id = external_ids.get("imdb_id") or movie.get("imdb_id")
    
    return {
        "tmdb_id": movie.get("id"),
        "imdb_id": imdb_id,  # ← Cái này dùng để gọi VidSrc + OpenSubtitles
        "title": movie.get("title"),
        "original_title": movie.get("original_title"),
        "release_date": movie.get("release_date"),
        "year": movie.get("release_date", "")[:4] if movie.get("release_date") else None,
        "runtime": movie.get("runtime"),  # Độ dài phim (phút)
        "genres": genres,
        "poster_path": f"https://image.tmdb.org/t/p/w500{movie.get('poster_path')}" if movie.get("poster_path") else None,
        "backdrop_path": f"https://image.tmdb.org/t/p/original{movie.get('backdrop_path')}" if movie.get("backdrop_path") else None,
        "overview": movie.get("overview"),
        "vote_average": movie.get("vote_average"),
        "tagline": movie.get("tagline"),
    }
