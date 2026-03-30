document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("q");
  const searchBtn = document.getElementById("searchBtn");
  const statusText = document.getElementById("status");
  const results = document.getElementById("results");

  const detailSection = document.getElementById("detail-section");
  const backBtn = document.getElementById("backBtn");
  const detailBackdropWrap = document.getElementById("detailBackdropWrap");
  const detailBackdrop = document.getElementById("detailBackdrop");
  const detailImage = document.getElementById("detailImage");
  const detailTitle = document.getElementById("detailTitle");
  const detailTagline = document.getElementById("detailTagline");
  const detailBadges = document.getElementById("detailBadges");
  const overviewText = document.getElementById("overviewText");
  const castList = document.getElementById("castList");
  const trailerContainer = document.getElementById("trailerContainer");

  const placeholderPoster = "https://via.placeholder.com/500x750?text=No+Image";
  const placeholderBackdrop = "https://via.placeholder.com/1280x720?text=No+Backdrop";

  function escapeHtml(text = "") {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function hideDetail() {
    detailSection.classList.add("hidden");
    if (detailBackdropWrap) detailBackdropWrap.classList.add("hidden");
    if (detailBackdrop) {
      detailBackdrop.src = "";
      detailBackdrop.alt = "";
    }
    detailImage.src = "";
    detailImage.alt = "";
    detailTitle.textContent = "";
    detailTagline.textContent = "";
    detailBadges.innerHTML = "";
    overviewText.textContent = "";
    castList.innerHTML = "";
    trailerContainer.innerHTML = "";
  }

  function showResults() {
    results.classList.remove("hidden");
  }

  function hideResults() {
    results.classList.add("hidden");
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildBadge(text, type = "") {
    const span = document.createElement("span");
    span.className = type ? `badge ${type}` : "badge";
    span.textContent = text;
    return span;
  }

  function buildChip(text) {
    const span = document.createElement("span");
    span.className = "chip";
    span.textContent = text;
    return span;
  }

  function renderResults(movies) {
    results.innerHTML = "";

    movies.forEach((movie) => {
      const card = document.createElement("article");
      card.className = "card";

      const poster = movie.poster || placeholderPoster;

      card.innerHTML = `
        <div class="thumb">
          <img src="${escapeHtml(poster)}" alt="${escapeHtml(movie.title || "Movie")}" />
        </div>
        <div class="card-body">
          <h3>${escapeHtml(movie.title || "Untitled")}</h3>
          <p>${escapeHtml(movie.year || "")}</p>
          <p>Rating: ★ ${escapeHtml(movie.rating?.toString() || "N/A")}</p>
          <div style="margin-top:10px;">
            <button class="btn">View</button>
          </div>
        </div>
      `;

      card.querySelector("button").addEventListener("click", () => {
        loadMovieDetail(movie.id, movie.poster);
      });

      results.appendChild(card);
    });
  }

  function youtubeEmbedUrl(url) {
    if (!url) return "";
    try {
      const parsed = new URL(url);
      const v = parsed.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length) return `https://www.youtube.com/embed/${parts[parts.length - 1]}`;
    } catch (_) {
      return "";
    }
    return "";
  }

  async function loadMovieDetail(movieId, fallbackPoster = "") {
    hideResults();
    detailSection.classList.remove("hidden");
    detailBackdropWrap.classList.add("hidden");

    detailTitle.textContent = "Loading...";
    detailTagline.textContent = "";
    detailBadges.innerHTML = "";
    overviewText.textContent = "Loading details...";
    castList.innerHTML = "";
    trailerContainer.innerHTML = "";

    try {
      const response = await fetch(`/api/movie/${movieId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load movie details");
      }

      const poster = data.poster || fallbackPoster || placeholderPoster;
      const backdrop = data.backdrop || "";

      detailImage.src = poster;
      detailImage.alt = data.title || "Movie";

      if (backdrop) {
        detailBackdrop.src = backdrop;
        detailBackdrop.alt = data.title || "Backdrop";
        detailBackdropWrap.classList.remove("hidden");
      } else {
        detailBackdropWrap.classList.add("hidden");
      }

      detailTitle.textContent = data.title || "Untitled";
      detailTagline.textContent = data.tagline || "";

      detailBadges.innerHTML = "";
      if (data.rating !== undefined && data.rating !== null) {
        detailBadges.appendChild(buildBadge(`★ ${data.rating}/10`, "rating"));
      }
      if (data.runtime) {
        detailBadges.appendChild(buildBadge(`${data.runtime} min`, "runtime"));
      }
      if (data.genres && data.genres.length) {
        data.genres.forEach((genre) => {
          detailBadges.appendChild(buildBadge(genre, "genre"));
        });
      }

      overviewText.textContent = data.overview || "No overview available.";

      castList.innerHTML = "";
      if (data.cast && data.cast.length) {
        data.cast.forEach((person) => {
          castList.appendChild(
            buildChip(person.name)
          );
        });
      } else {
        castList.appendChild(buildChip("Cast information not available."));
      }

      trailerContainer.innerHTML = "";
      const embed = youtubeEmbedUrl(data.trailer);
      if (embed) {
        const iframe = document.createElement("iframe");
        iframe.src = `${embed}?autoplay=1&mute=1&rel=0`;
        iframe.title = `${data.title || "Movie"} trailer`;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        trailerContainer.appendChild(iframe);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "iframe-placeholder";
        placeholder.textContent = "Trailer unavailable.";
        trailerContainer.appendChild(placeholder);
      }

      scrollToTop();
    } catch (error) {
      console.error(error);
      detailTitle.textContent = "Failed to load details";
      overviewText.textContent = "Please try again.";
      trailerContainer.innerHTML = "";
    }
  }

  async function onSearch() {
    const query = (searchInput.value || "").trim();

    hideDetail();
    showResults();
    results.innerHTML = "";

    if (!query) {
      statusText.textContent = "Please enter a search term";
      statusText.style.display = "block";
      return;
    }

    statusText.textContent = "Searching...";
    statusText.style.display = "block";

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        statusText.textContent = data.error || "Search failed.";
        return;
      }

      const movies = data.results || [];

      if (movies.length === 0) {
        statusText.textContent = "No movies found. Try a different search term.";
        statusText.style.display = "block";
        return;
      }

      statusText.style.display = "none";
      renderResults(movies);
    } catch (error) {
      console.error(error);
      statusText.textContent = "Network error. Try again.";
      statusText.style.display = "block";
    }
  }

  searchBtn.addEventListener("click", onSearch);

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      onSearch();
    }
  });

  backBtn.addEventListener("click", () => {
    hideDetail();
    showResults();
    scrollToTop();
  });

  hideDetail();
  showResults();
  statusText.textContent = "Please enter a search term";
  statusText.style.display = "block";
});