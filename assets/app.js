const API_URL = (window.MILES_CONFIG && window.MILES_CONFIG.API_URL) || "";

const demoVideos = [
  { id: "d1", title: "Thendrale_Mella_Pesu_S01E355_360p.mkv", type: "Serial", date: "2026-08-21", description: "Latest episode", thumbnail: "", videoUrl: "" },
  { id: "d2", title: "Thaai_Maaman_E84.mkv", type: "Serial", date: "2026-08-21", description: "Latest episode", thumbnail: "", videoUrl: "" },
  { id: "d3", title: "Weekend_Show_E12.mp4", type: "Show", date: "2026-08-20", description: "Latest show", thumbnail: "", videoUrl: "" }
];

let videos = [];
let activeType = "Serial";
let query = "";
let dateFrom = "";
let dateTo = "";
let controlsTimer = null;
let currentVideo = null;

const $ = (s) => document.querySelector(s);
const els = {
  grid: $("#videoGrid"), empty: $("#emptyState"), count: $("#resultCount"), sectionTitle: $("#sectionTitle"), sectionEyebrow: $("#sectionEyebrow"),
  searchToggle: $("#searchToggle"), searchBar: $("#searchBar"), searchInput: $("#searchInput"), searchClose: $("#searchClose"),
  filterToggle: $("#filterToggle"), filterDot: $("#filterDot"), filterSheet: $("#filterSheet"), dateFrom: $("#dateFrom"), dateTo: $("#dateTo"),
  applyDate: $("#applyDate"), resetDate: $("#resetDate"), clearFilters: $("#clearFilters"),
  modal: $("#playerModal"), video: $("#videoPlayer"), stage: $("#videoStage"), close: $("#playerClose"),
  playerTitle: $("#playerTitle"), playerMeta: $("#playerMeta"), playerDisplayTitle: $("#playerDisplayTitle"), playerDescription: $("#playerDescription"), playerBadge: $("#playerBadge"),
  bigPlay: $("#bigPlay"), controls: $("#playerControls"), playPause: $("#playPause"), seek: $("#seekBar"), time: $("#timeText"), back10: $("#back10"), forward10: $("#forward10"), mute: $("#muteToggle"), fullscreen: $("#fullscreenToggle"),
  volumeDown: $("#volumeDown"), volumeUp: $("#volumeUp"), share: $("#shareVideo"), gestureLayer: $("#gestureLayer"),
  gestureBackFeedback: $("#gestureBackFeedback"), gestureCenterFeedback: $("#gestureCenterFeedback"), gestureForwardFeedback: $("#gestureForwardFeedback"),
  siteLoader: $("#siteLoader"), videoLoader: $("#videoLoader")
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]));
}

function parseDriveFilename(rawTitle = "") {
  let name = String(rawTitle || "").trim();
  if (!name) return { title: "", episode: "" };
  name = name.replace(/\.(mkv|mp4|avi|mov|webm|m4v|ts)$/i, "");
  const episodeMatch = name.match(/(?:^|[_.\-\s])(?:S\d{1,3})?E(\d{1,5})(?=$|[_.\-\s])/i);
  if (episodeMatch) {
    const markerIndex = episodeMatch.index + (episodeMatch[0].match(/^[_.\-\s]/) ? 1 : 0);
    const titlePart = name.slice(0, markerIndex);
    const cleanTitle = titlePart.replace(/[_.]+/g, " ").replace(/\s*-\s*/g, " ").replace(/\s+/g, " ").trim();
    return { title: cleanTitle || name, episode: `Episode ${episodeMatch[1]}` };
  }
  const cleanTitle = name
    .replace(/(?:[_.\-\s]+)(?:2160p|1080p|720p|480p|360p|JIOHS|WEB|WEBRIP|WEB-DL|HDRIP|HDTV)(?=$|[_.\-\s])/gi, " ")
    .replace(/[_.]+/g, " ").replace(/\s+/g, " ").trim();
  return { title: cleanTitle || name, episode: "" };
}

function normalizeVideo(video = {}) {
  const parsed = parseDriveFilename(video.title || video.name || "");
  return { ...video, title: parsed.title || video.title || video.name || "Untitled", episode: parsed.episode || video.episode || "" };
}

function dateValue(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value) {
  const d = dateValue(value);
  if (!d) return value || "";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function filteredVideos() {
  const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
  const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
  return videos.filter(v => {
    if (String(v.type || "").toLowerCase() !== activeType.toLowerCase()) return false;
    if (query) {
      const haystack = [v.title, v.episode, v.type, v.description].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    const d = dateValue(v.date);
    if (from && (!d || d < from)) return false;
    if (to && (!d || d > to)) return false;
    return true;
  }).sort((a,b) => (dateValue(b.date)?.getTime() || 0) - (dateValue(a.date)?.getTime() || 0));
}

function fallbackPoster(title) {
  const safe = encodeURIComponent((title || "thiraiX").slice(0, 22));
  return `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='400' viewBox='0 0 640 400'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23ff145f'/%3E%3Cstop offset='.6' stop-color='%237d2cff'/%3E%3Cstop offset='1' stop-color='%23ff9800'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='640' height='400' fill='%230c0c10'/%3E%3Ccircle cx='320' cy='190' r='58' fill='url(%23g)'/%3E%3Cpath d='M304 157l52 33-52 33z' fill='white'/%3E%3Ctext x='320' y='300' font-family='Arial,sans-serif' font-size='28' font-weight='700' fill='white' text-anchor='middle'%3E${safe}%3C/text%3E%3C/svg%3E`;
}

function videoCard(v) {
  const el = document.createElement("article");
  el.className = "video-card";
  el.tabIndex = 0;
  const meta = [v.episode, formatDate(v.date)].filter(Boolean).join(" · ");
  el.innerHTML = `
    <div class="poster">
      <img src="${escapeHtml(v.thumbnail || fallbackPoster(v.title))}" alt="${escapeHtml(v.title)}" loading="lazy" />
      <span class="badge">${escapeHtml(v.type || "Video")}</span>
      <span class="play-dot">▶</span>
    </div>
    <div class="card-copy">
      <h3>${escapeHtml(v.title)}</h3>
      <p>${escapeHtml(meta)}</p>
    </div>`;
  const play = () => openPlayer(v);
  el.addEventListener("click", play);
  el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(); } });
  return el;
}

function render() {
  const list = filteredVideos();
  els.grid.innerHTML = "";
  list.forEach(v => els.grid.appendChild(videoCard(v)));
  els.empty.classList.toggle("hidden", list.length !== 0);
  els.grid.classList.toggle("hidden", list.length === 0);
  els.count.textContent = `${list.length} video${list.length === 1 ? "" : "s"}`;
  els.sectionEyebrow.textContent = activeType.toUpperCase();
  els.sectionTitle.textContent = `Latest ${activeType}s`;
  els.filterDot.classList.toggle("hidden", !dateFrom && !dateTo);
}

function setActiveType(type) {
  activeType = type;
  document.querySelectorAll(".category").forEach(btn => btn.classList.toggle("active", btn.dataset.type === type));
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function localISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function setQuickRange(range) {
  const end = new Date();
  const start = new Date();
  if (range === "today") {
    // same day
  } else {
    start.setDate(start.getDate() - (Number(range) - 1));
  }
  els.dateFrom.value = localISO(start);
  els.dateTo.value = localISO(end);
  document.querySelectorAll("[data-range]").forEach(b => b.classList.toggle("active", b.dataset.range === range));
}

function showFilter() { els.filterSheet.classList.remove("hidden"); document.body.style.overflow = "hidden"; }
function hideFilter() { els.filterSheet.classList.add("hidden"); document.body.style.overflow = ""; }

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  seconds = Math.max(0, Math.floor(seconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2,"0");
  return h ? `${h}:${String(m).padStart(2,"0")}:${s}` : `${m}:${s}`;
}

function showControls() {
  els.controls.classList.remove("fade");
  clearTimeout(controlsTimer);
  if (!els.video.paused) controlsTimer = setTimeout(() => els.controls.classList.add("fade"), 2600);
}

function updatePlayerUI() {
  const playing = !els.video.paused && !els.video.ended;
  els.playPause.textContent = playing ? "❚❚" : "▶";
  els.bigPlay.textContent = playing ? "❚❚" : "▶";
  els.bigPlay.classList.toggle("hidden", playing);
  els.mute.textContent = els.video.muted || els.video.volume === 0 ? "🔇" : "🔊";
  const duration = Number.isFinite(els.video.duration) ? els.video.duration : 0;
  const current = Number.isFinite(els.video.currentTime) ? els.video.currentTime : 0;
  els.seek.value = duration ? String((current / duration) * 100) : "0";
  els.time.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
}

function togglePlayback() {
  if (els.video.paused || els.video.ended) els.video.play().catch(() => {}); else els.video.pause();
  showControls();
}

function openPlayer(v, options = {}) {
  if (!v.videoUrl) {
    alert("This video does not have a playable URL yet.");
    return;
  }
  currentVideo = v;
  if (!options.skipHistory && v.id) {
    const url = new URL(window.location.href);
    url.searchParams.set("video", v.id);
    history.replaceState(null, "", url);
  }
  const meta = [v.type, v.episode, formatDate(v.date)].filter(Boolean).join(" · ");
  els.playerTitle.textContent = v.title || "Video";
  els.playerMeta.textContent = meta;
  els.playerDisplayTitle.textContent = v.title || "Video";
  els.playerDescription.textContent = v.description || meta;
  els.playerBadge.textContent = v.type || "Video";
  showVideoLoader("Loading video...");
  els.video.src = v.videoUrl;
  els.modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  updatePlayerUI();
  showControls();
  els.video.play().catch(() => {});
}

function closePlayer() {
  hideVideoLoader();
  currentVideo = null;
  const url = new URL(window.location.href);
  url.searchParams.delete("video");
  history.replaceState(null, "", url);
  els.video.pause();
  els.video.removeAttribute("src");
  els.video.load();
  els.modal.classList.add("hidden");
  document.body.style.overflow = "";
  clearTimeout(controlsTimer);
}

function hideSiteLoader() {
  if (!els.siteLoader) return;
  els.siteLoader.classList.add("hide");
  setTimeout(() => els.siteLoader.classList.add("hidden"), 320);
}

function showVideoLoader(message = "Loading video...") {
  if (!els.videoLoader) return;
  const label = els.videoLoader.querySelector("span");
  if (label) label.textContent = message;
  els.videoLoader.classList.remove("hidden");
}

function hideVideoLoader() {
  if (els.videoLoader) els.videoLoader.classList.add("hidden");
}

function getShareUrl(v) {
  const url = new URL(window.location.href);
  if (v && v.id) url.searchParams.set("video", v.id);
  return url.toString();
}

async function shareCurrentVideo() {
  if (!currentVideo) return;
  const shareUrl = getShareUrl(currentVideo);
  const shareData = {
    title: currentVideo.title || "thiraiX Video",
    text: [currentVideo.title, currentVideo.episode].filter(Boolean).join(" - "),
    url: shareUrl
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    alert("Video link copied to clipboard.");
  } catch (err) {
    if (err && err.name === "AbortError") return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Video link copied to clipboard.");
    } catch (_) {
      window.prompt("Copy this video link:", shareUrl);
    }
  }
}

async function loadVideos() {
  try {
    if (!API_URL) {
      videos = demoVideos.map(normalizeVideo);
      render();
      return;
    }
    const r = await fetch(API_URL, { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`API ${r.status}`);
    const data = await r.json();
    videos = (Array.isArray(data) ? data : (data.videos || [])).map(normalizeVideo);
    render();
  } catch (err) {
    console.error("thiraiX API error:", err);
    videos = demoVideos.map(normalizeVideo);
    render();
  } finally {
    hideSiteLoader();
    const sharedId = new URLSearchParams(window.location.search).get("video");
    if (sharedId && els.modal.classList.contains("hidden")) {
      const sharedVideo = videos.find(v => String(v.id) === String(sharedId));
      if (sharedVideo && sharedVideo.videoUrl) openPlayer(sharedVideo, { skipHistory: true });
    }
  }
}

// Category tabs
document.querySelectorAll(".category").forEach(btn => btn.addEventListener("click", () => setActiveType(btn.dataset.type)));

// Search
els.searchToggle.addEventListener("click", () => {
  els.searchBar.classList.remove("hidden");
  els.searchInput.focus();
});
els.searchClose.addEventListener("click", () => {
  els.searchBar.classList.add("hidden");
  els.searchInput.value = "";
  query = "";
  render();
});
els.searchInput.addEventListener("input", e => { query = e.target.value.trim().toLowerCase(); render(); });

// Date filter
els.filterToggle.addEventListener("click", showFilter);
document.querySelectorAll("[data-close-sheet]").forEach(x => x.addEventListener("click", hideFilter));
document.querySelectorAll("[data-range]").forEach(btn => btn.addEventListener("click", () => setQuickRange(btn.dataset.range)));
els.applyDate.addEventListener("click", () => {
  dateFrom = els.dateFrom.value;
  dateTo = els.dateTo.value;
  if (dateFrom && dateTo && dateFrom > dateTo) [dateFrom, dateTo] = [dateTo, dateFrom];
  els.dateFrom.value = dateFrom;
  els.dateTo.value = dateTo;
  hideFilter();
  render();
});
els.resetDate.addEventListener("click", () => {
  dateFrom = dateTo = "";
  els.dateFrom.value = els.dateTo.value = "";
  document.querySelectorAll("[data-range]").forEach(b => b.classList.remove("active"));
  render();
});
els.clearFilters.addEventListener("click", () => {
  query = dateFrom = dateTo = "";
  els.searchInput.value = els.dateFrom.value = els.dateTo.value = "";
  render();
});

// Custom built-in player controls

function changeVolume(delta) {
  els.video.muted = false;
  els.video.volume = Math.max(0, Math.min(1, els.video.volume + delta));
  showControls();
}

function flashGesture(el, text) {
  if (!el) return;
  if (text) el.textContent = text;
  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 520);
}

function gestureZoneFromEvent(e) {
  const rect = els.gestureLayer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const ratio = rect.width ? x / rect.width : .5;
  if (ratio < .34) return "left";
  if (ratio > .66) return "right";
  return "center";
}

function runDoubleTapAction(zone) {
  if (zone === "left") {
    els.video.currentTime = Math.max(0, els.video.currentTime - 10);
    flashGesture(els.gestureBackFeedback, "↶ 10s");
  } else if (zone === "right") {
    els.video.currentTime = Math.min(els.video.duration || Infinity, els.video.currentTime + 10);
    flashGesture(els.gestureForwardFeedback, "10s ↷");
  } else {
    togglePlayback();
    flashGesture(els.gestureCenterFeedback, els.video.paused ? "❚❚" : "▶");
  }
  showControls();
}

let lastTapTime = 0;
let lastTapZone = "";
let singleTapTimer = null;

els.gestureLayer.addEventListener("pointerup", e => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  const now = Date.now();
  const zone = gestureZoneFromEvent(e);
  const isDouble = now - lastTapTime <= 330 && zone === lastTapZone;

  if (isDouble) {
    clearTimeout(singleTapTimer);
    singleTapTimer = null;
    lastTapTime = 0;
    lastTapZone = "";
    runDoubleTapAction(zone);
  } else {
    lastTapTime = now;
    lastTapZone = zone;
    clearTimeout(singleTapTimer);
    singleTapTimer = setTimeout(() => {
      showControls();
      lastTapTime = 0;
      lastTapZone = "";
    }, 340);
  }
});
els.close.addEventListener("click", closePlayer);
els.bigPlay.addEventListener("click", togglePlayback);
els.playPause.addEventListener("click", togglePlayback);
els.video.addEventListener("play", updatePlayerUI);
els.video.addEventListener("pause", updatePlayerUI);
els.video.addEventListener("ended", updatePlayerUI);
els.video.addEventListener("timeupdate", updatePlayerUI);
els.video.addEventListener("durationchange", updatePlayerUI);
els.video.addEventListener("volumechange", updatePlayerUI);
els.video.addEventListener("loadstart", () => showVideoLoader("Loading video..."));
els.video.addEventListener("waiting", () => { showVideoLoader("Buffering..."); showControls(); });
els.video.addEventListener("stalled", () => showVideoLoader("Buffering..."));
els.video.addEventListener("seeking", () => showVideoLoader("Loading..."));
els.video.addEventListener("loadeddata", hideVideoLoader);
els.video.addEventListener("canplay", hideVideoLoader);
els.video.addEventListener("playing", hideVideoLoader);
els.video.addEventListener("seeked", hideVideoLoader);
els.video.addEventListener("error", hideVideoLoader);
els.stage.addEventListener("pointermove", showControls);
els.stage.addEventListener("pointerdown", showControls);
els.seek.addEventListener("input", () => {
  if (Number.isFinite(els.video.duration)) els.video.currentTime = (Number(els.seek.value) / 100) * els.video.duration;
  showControls();
});
els.back10.addEventListener("click", () => { els.video.currentTime = Math.max(0, els.video.currentTime - 10); showControls(); });
els.forward10.addEventListener("click", () => { els.video.currentTime = Math.min(els.video.duration || Infinity, els.video.currentTime + 10); showControls(); });
els.mute.addEventListener("click", () => { els.video.muted = !els.video.muted; showControls(); });
els.volumeDown.addEventListener("click", () => changeVolume(-0.1));
els.volumeUp.addEventListener("click", () => changeVolume(0.1));
els.share.addEventListener("click", shareCurrentVideo);
els.fullscreen.addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      if (els.stage.requestFullscreen) await els.stage.requestFullscreen();
      else if (els.video.webkitEnterFullscreen) els.video.webkitEnterFullscreen();
    } else if (document.exitFullscreen) await document.exitFullscreen();
  } catch (e) { console.warn("Fullscreen unavailable", e); }
  showControls();
});

document.addEventListener("keydown", e => {
  if (!els.modal.classList.contains("hidden")) {
    if (e.key === "Escape") closePlayer();
    if (e.key === " ") { e.preventDefault(); togglePlayback(); }
    if (e.key === "ArrowLeft") els.video.currentTime = Math.max(0, els.video.currentTime - 10);
    if (e.key === "ArrowRight") els.video.currentTime = Math.min(els.video.duration || Infinity, els.video.currentTime + 10);
  } else if (e.key === "Escape" && !els.filterSheet.classList.contains("hidden")) hideFilter();
});

loadVideos();
