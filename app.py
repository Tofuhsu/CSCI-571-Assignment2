import os
import requests
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

TMDB_API_KEY = os.environ.get("TMDB_API_KEY")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"


def tmdb_image(path, size="w500"):
    if not path:
        return ""
    return f"{TMDB_IMAGE_BASE}/{size}{path}"


def tmdb_get(path, params=None):
    if not TMDB_API_KEY:
        raise RuntimeError("TMDB_API_KEY is not set")

    query_params = {
        "api_key": TMDB_API_KEY,
        "language": "en-US",
    }
    if params:
        query_params.update(params)

    response = requests.get(f"{TMDB_BASE_URL}{path}", params=query_params, timeout=10)
    response.raise_for_status()
    return response.json()


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/test")
def test_api():
    return jsonify({"message": "Flask API is working!"})


@app.route("/api/search")
def search_movies():
    query = request.args.get("query", "").strip()

    if not query:
        return jsonify({"error": "query is required", "results": []}), 400

    try:
        data = tmdb_get(
            "/search/movie",
            {
                "query": query,
                "include_adult": "false",
                "page": 1,
            },
        )
    except RuntimeError as exc:
        return jsonify({"error": str(exc), "results": []}), 500
    except requests.RequestException as exc:
        return jsonify({"error": "TMDB request failed", "details": str(exc), "results": []}), 502

    results = []
    for movie in data.get("results", []):
        release_date = movie.get("release_date") or ""
        results.append(
            {
                "id": movie.get("id"),
                "title": movie.get("title") or movie.get("name") or "",
                "year": release_date[:4] if release_date else "",
                "poster": tmdb_image(movie.get("poster_path")),
                "rating": round(movie.get("vote_average", 0) or 0, 1),
                "overview": movie.get("overview", ""),
            }
        )

    return jsonify({"query": query, "results": results})


@app.route("/api/movie/<int:movie_id>")
def movie_detail(movie_id):
    try:
        movie = tmdb_get(f"/movie/{movie_id}")
        credits = tmdb_get(f"/movie/{movie_id}/credits")
        videos = tmdb_get(f"/movie/{movie_id}/videos")
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 500
    except requests.RequestException as exc:
        return jsonify({"error": "TMDB request failed", "details": str(exc)}), 502

    genres = [g.get("name") for g in movie.get("genres", []) if g.get("name")]

    cast = []
    for person in credits.get("cast", [])[:8]:
        name = person.get("name")
        character = person.get("character") or ""
        if name:
            cast.append({"name": name, "character": character})

    trailer = ""
    for video in videos.get("results", []):
        if (
            video.get("site") == "YouTube"
            and video.get("type") == "Trailer"
            and video.get("key")
        ):
            trailer = f"https://www.youtube.com/watch?v={video.get('key')}"
            break

    release_date = movie.get("release_date") or ""

    return jsonify(
        {
            "id": movie.get("id"),
            "title": movie.get("title") or "",
            "tagline": movie.get("tagline") or "",
            "overview": movie.get("overview") or "",
            "poster": tmdb_image(movie.get("poster_path")),
            "backdrop": tmdb_image(movie.get("backdrop_path"), "w780"),
            "year": release_date[:4] if release_date else "",
            "runtime": movie.get("runtime"),
            "rating": round(movie.get("vote_average", 0) or 0, 1),
            "genres": genres,
            "cast": cast,
            "trailer": trailer,
        }
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)