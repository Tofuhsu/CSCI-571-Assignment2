# 🎬 Movie Explorer (CSCI 571 Assignment 2)

A full-stack movie search web application built with **Flask**, **JavaScript**, and deployed on **Google Cloud Run**.

---

## 🔗 Live Demo

👉 https://movie-explorer-394763791461.us-central1.run.app/

---

## 📌 Project Overview

This project allows users to:

- 🔍 Search for movies using the TMDB API
- 🎞 View movie details including overview, genres, runtime
- 👥 Display top cast members
- ▶ Watch trailers embedded from YouTube
- ❌ Handle invalid or empty searches gracefully

---

## 🖼 Features

### 1️⃣ Search Movies
- Input-based search
- Real-time results using Flask backend
- Displays movie posters, titles, ratings

### 2️⃣ Movie Details Page
- Large backdrop + poster
- Title + tagline
- Rating badge + runtime
- Genres displayed as tags
- Top cast list
- Embedded YouTube trailer

### 3️⃣ UX Improvements
- Smooth transitions between results and detail view
- Back to results navigation
- Handles no-results and error states
- Responsive layout

---

## 🛠 Tech Stack

### Frontend
- HTML5
- CSS3 (custom styling, no frameworks)
- Vanilla JavaScript (ES6)

### Backend
- Python (Flask)
- Requests library

### Deployment
- Docker
- Google Cloud Run
- Google Cloud Build

---

## 🔐 API Integration

Uses **TMDB API** and **YouTube trailers**

- API key stored securely as environment variable:
```python
os.environ.get("TMDB_API_KEY")
