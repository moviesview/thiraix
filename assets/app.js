const cfg = window.MILES_CONFIG || {};
const API_URL = cfg.API_URL || "";

const demoVideos = [
  {
    id: "demo-1",
    title: "Ethirneechal",
    episode: "Episode 125",
    type: "Serial",
    date: "2026-08-21",
    description: "Latest episode. Connect the Google Drive API to replace this demo card with your real thiraiX videos.",
    thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80",
    videoUrl: "",
    featured: true
  },
  {
    id: "demo-2",
    title: "Siragadikka Aasai",
    episode: "Episode 309",
    type: "Serial",
    date: "2026-08-21",
    description: "Demo serial card for thiraiX.",
    thumbnail: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    videoUrl: ""
  },
  {
    id: "demo-3",
    title: "Tamil Entertainment",
    episode: "Episode 45",
    type: "Show",
    date: "2026-08-20",
    description: "Demo show card for thiraiX.",
    thumbnail: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=1200&q=80",
    videoUrl: ""
  },
  {
    id: "demo-4",
    title: "Weekend Special",
    episode: "Episode 12",
    type: "Show",
    date: "2026-08-19",
    description: "Demo show card.",
    thumbnail: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?auto=format&fit=crop&w=1200&q=80",
    videoUrl: ""
  },
  {
    id: "demo-5",
    title: "Prime Serial",
    episode: "Episode 76",
    type: "Serial",
    date: "2026-08-18",
    description: "Demo serial card.",
    thumbnail: "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1200&q=80",
    videoUrl: ""
  }
];

let videos = [];
let currentFeatured = null;

const els = {
  latestGrid: document.querySelector("#latestGrid"),
  serialGrid: document.querySelector("#serialGrid"),
  showGrid: document.querySelector("#showGrid"),
  emptyState: document.querySelector("#emptyState"),
  searchPanel: document.querySelector("#searchPanel"),
  searchInput: document.querySelector("#searchInput"),
  searchToggle: document.querySelector("#searchToggle"),
  searchClose: document.querySelector("#searchClose"),
  hero: document.querySelector("#hero"),
  heroTitle: document.querySelector("#heroTitle"),
  heroDescription: document.querySelector("#heroDescription"),
  heroPlay: document.querySelector("#heroPlay"),
  heroInfo: document.querySelector("#heroInfo"),
  playerModal: document.querySelector("#playerModal"),
  infoModal: document.querySelector("#infoModal"),
  videoPlayer: document.querySelector("#videoPlayer"),
  playerTitle: document.querySelector("#playerTitle"),
  playerDescription: document.querySelector("#playerDescription"),
  playerMeta: document.querySelector("#playerMeta"),
  infoTitle: document.querySelector("#infoTitle"),
  infoDescription: document.querySelector("#infoDescription")
};

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function card(video) {
  const article = document.createElement("article");
  article.className = "video-card";
  article.tabIndex = 0;
  article.innerHTML = `
    <div class="poster">
      <img src="${video.thumbnail || ""}" alt="${escapeHtml(video.title)}" loading="lazy" />
      <span class="badge">${escapeHtml(video.type || "Video")}</span>
      <span class="play-dot">▶</span>
    </div>
    <div class="card-copy">
      <h3>${escapeHtml(video.title)}</h3>
      <p>${escapeHtml(video.episode || "")}${video.date ? ` · ${formatDate(video.date)}` : ""}</p>
    </div>
  `;
  article.addEventListener("click", () => playVideo(video));
  article.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") playVideo(video);
  });
  return article;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

function render(list = videos) {
  els.latestGrid.innerHTML = "";
  els.serialGrid.innerHTML = "";
  els.showGrid.innerHTML = "";

  const sorted = [...list].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const serials = sorted.filter(v => String(v.type).toLowerCase() === "serial");
  const shows = sorted.filter(v => String(v.type).toLowerCase() === "show");

  sorted.slice(0, 10).forEach(v => els.latestGrid.appendChild(card(v)));
  serials.forEach(v => els.serialGrid.appendChild(card(v)));
  shows.forEach(v => els.showGrid.appendChild(card(v)));

  const noResults = sorted.length === 0;
  els.emptyState.classList.toggle("hidden", !noResults);

  document.querySelectorAll(".content-section").forEach(section => {
    const grid = section.querySelector(".card-grid");
    if (grid) section.classList.toggle("hidden", grid.children.length === 0);
  });
}

function setHero(video) {
  if (!video) return;
  currentFeatured = video;
  els.heroTitle.textContent = video.title || "thiraiX";
  els.heroDescription.textContent =
    [video.episode, video.description].filter(Boolean).join(" — ") ||
    "Fresh episodes, popular serials and shows — all organized in a sleek streaming-style interface.";
  if (video.thumbnail) {
    els.hero.style.setProperty("--hero-image", `url("${video.thumbnail}")`);
  }
}

function playVideo(video) {
  if (!video.videoUrl) {
    els.infoTitle.textContent = video.title;
    els.infoDescription.textContent =
      "Demo mode is active. Connect your Cloudflare Worker / Google Drive API and this card will play the real video.";
    els.infoModal.classList.remove("hidden");
    return;
  }

  els.playerTitle.textContent = video.title || "";
  els.playerDescription.textContent = video.description || "";
  els.playerMeta.textContent = [video.type, video.episode, formatDate(video.date)].filter(Boolean).join(" · ");
  els.videoPlayer.src = video.videoUrl;
  els.playerModal.classList.remove("hidden");
  els.videoPlayer.play().catch(() => {});
}

function closeModal(which) {
  if (which === "player") {
    els.videoPlayer.pause();
    els.videoPlayer.removeAttribute("src");
    els.videoPlayer.load();
    els.playerModal.classList.add("hidden");
  } else {
    els.infoModal.classList.add("hidden");
  }
}

async function loadVideos() {
  if (!API_URL) {
    videos = demoVideos;
    setHero(videos.find(v => v.featured) || videos[0]);
    render();
    return;
  }

  try {
    const response = await fetch(API_URL, { headers: { "Accept": "application/json" } });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    videos = Array.isArray(data) ? data : (data.videos || []);
    if (!videos.length) throw new Error("No videos returned");
    setHero(videos.find(v => v.featured) || videos[0]);
    render();
  } catch (error) {
    console.error("thiraiX API error:", error);
    videos = demoVideos;
    setHero(videos[0]);
    render();
  }
}

els.searchToggle.addEventListener("click", () => {
  els.searchPanel.classList.remove("hidden");
  els.searchInput.focus();
});

els.searchClose.addEventListener("click", () => {
  els.searchPanel.classList.add("hidden");
  els.searchInput.value = "";
  render(videos);
});

els.searchInput.addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) return render(videos);
  render(videos.filter(v =>
    [v.title, v.episode, v.type, v.description]
      .filter(Boolean)
      .some(x => String(x).toLowerCase().includes(q))
  ));
});

document.querySelectorAll(".nav-link").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    const filter = btn.dataset.filter;

    if (filter === "all" || filter === "latest") return render(videos);
    render(videos.filter(v => String(v.type).toLowerCase() === filter.toLowerCase()));
  });
});

els.heroPlay.addEventListener("click", () => currentFeatured && playVideo(currentFeatured));
els.heroInfo.addEventListener("click", () => {
  if (!currentFeatured) return;
  els.infoTitle.textContent = currentFeatured.title || "";
  els.infoDescription.textContent = currentFeatured.description || "";
  els.infoModal.classList.remove("hidden");
});

document.addEventListener("click", (e) => {
  const close = e.target.closest("[data-close]");
  if (close) closeModal(close.dataset.close);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal("player");
    closeModal("info");
  }
});

loadVideos();
