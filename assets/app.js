const API_URL = (window.MILES_CONFIG && window.MILES_CONFIG.API_URL) || "";

let videos = [];
let query = "";
let dateFrom = "";
let dateTo = "";
let controlsTimer = null;
let currentVideo = null;
let currentMenu = "";
let attachedExternalTracks = [];
let activeCollectionId = "doomsday";

const $ = (s) => document.querySelector(s);
const els = {
  grid: $("#videoGrid"),
  empty: $("#emptyState"),
  count: $("#resultCount"),
  sectionTitle: $("#sectionTitle"),
  sectionEyebrow: $("#sectionEyebrow"),
  searchToggle: $("#searchToggle"),
  searchBar: $("#searchBar"),
  searchInput: $("#searchInput"),
  searchClose: $("#searchClose"),
  filterToggle: $("#filterToggle"),
  filterDot: $("#filterDot"),
  filterSheet: $("#filterSheet"),
  dateFrom: $("#dateFrom"),
  dateTo: $("#dateTo"),
  applyDate: $("#applyDate"),
  resetDate: $("#resetDate"),
  clearFilters: $("#clearFilters"),
  modal: $("#playerModal"),
  video: $("#videoPlayer"),
  stage: $("#videoStage"),
  close: $("#playerClose"),
  playerTitle: $("#playerTitle"),
  playerMeta: $("#playerMeta"),
  playerDisplayTitle: $("#playerDisplayTitle"),
  playerDescription: $("#playerDescription"),
  playerBadge: $("#playerBadge"),
  bigPlay: $("#bigPlay"),
  controls: $("#playerControls"),
  playPause: $("#playPause"),
  seek: $("#seekBar"),
  time: $("#timeText"),
  back10: $("#back10"),
  forward10: $("#forward10"),
  mute: $("#muteToggle"),
  speed: $("#speedToggle"),
  subtitle: $("#subtitleToggle"),
  audio: $("#audioToggle"),
  quality: $("#qualityToggle"),
  fullscreen: $("#fullscreenToggle"),
  share: $("#shareVideo"),
  gestureLayer: $("#gestureLayer"),
  gestureBackFeedback: $("#gestureBackFeedback"),
  gestureCenterFeedback: $("#gestureCenterFeedback"),
  gestureForwardFeedback: $("#gestureForwardFeedback"),
  siteLoader: $("#siteLoader"),
  videoLoader: $("#videoLoader"),
  recommendedVideos: $("#recommendedVideos"),
  recommendedCount: $("#recommendedCount"),
  playerMenu: $("#playerMenu"),
  playerMenuTitle: $("#playerMenuTitle"),
  playerMenuOptions: $("#playerMenuOptions"),
  playerMenuClose: $("#playerMenuClose"),
  playerInlineAd: $("#playerInlineAd"),
  playerInlineAdClose: $("#playerInlineAdClose"),
  collections: Array.from(document.querySelectorAll(".watch-collection")),
  watchTabs: Array.from(document.querySelectorAll("[data-watch-tab]"))
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]));
}

function parseDriveFilename(rawTitle = "") {
  let name = String(rawTitle || "").trim();
  if (!name) return { title: "", posterBase: "" };
  const withoutExt = name.replace(/\.(mkv|mp4|avi|mov|webm|m4v|ts)$/i, "");
  const cleanTitle = withoutExt
    .replace(/(?:[_.\-\s]+)(?:2160p|1080p|720p|480p|360p|JIOHS|WEB|WEBRIP|WEB-DL|HDRIP|HDTV)(?=$|[_.\-\s])/gi, " ")
    .replace(/[_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { title: cleanTitle || withoutExt, posterBase: withoutExt.trim() };
}

function isMovieRecord(video = {}) {
  const type = String(video.type || "").trim().toLowerCase();
  const folder = String(video.folder || video.description || "").trim().toLowerCase();
  // Strictly exclude the old categories first.
  if (type === "serial" || type === "show" || folder.includes("serial") || folder.includes("show")) return false;
  if (type === "movie") return true;
  return /(^|[ /\\])movies?($|[ /\\])/.test(folder);
}

function normalizeVideo(video = {}) {
  const rawName = video.name || video.title || "";
  const parsed = parseDriveFilename(rawName);
  const normalized = {
    ...video,
    title: parsed.title || video.title || video.name || "Untitled Movie",
    posterBase: parsed.posterBase || parsed.title || video.title || "Untitled Movie",
    episode: "",
    type: "Movie",
    description: video.description || "Movie"
  };

  // Optional title-based source override. Only direct, authorized media URLs
  // should be placed in assets/external-streams.js. We never iframe or open
  // third-party streaming pages inside the player.
  const overrides = window.THIRAI_X_STREAM_OVERRIDES || {};
  const override = overrides[watchKey(normalized.title)];
  if (override) {
    if (typeof override === "string") {
      normalized.videoUrl = override;
      normalized.sources = [{ src: override, label: "External" }];
    } else if (typeof override === "object") {
      if (override.videoUrl) normalized.videoUrl = override.videoUrl;
      if (Array.isArray(override.sources)) normalized.sources = override.sources;
      if (Array.isArray(override.subtitles)) normalized.subtitles = override.subtitles;
    }
  }

  return normalized;
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

function normalizeWatchTitle(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/\.(mkv|mp4|avi|mov|webm|m4v|ts)$/gi, "")
    .replace(/^\s*\d{1,3}[.)_ -]+/, "")
    .replace(/\b(19|20)\d{2}\b/g, " ")
    .replace(/\b(seasons?|season)\s*([0-9]+)\s*[-–—to]+\s*([0-9]+)\b/g, "s$2 s$3")
    .replace(/\bseason\s*([0-9]+)\b/g, "s$1")
    .replace(/\bseries\s*([0-9]+)\b/g, "s$1")
    .replace(/\s+/g, " ")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const WATCH_ALIASES = {
  "x men 2": "x2 x men united",
  "x2": "x2 x men united",
  "avengers": "the avengers",
  "fantastic four first steps": "the fantastic four first steps",
  "guardians galaxy 2": "guardians of the galaxy vol 2",
  "guardians of galaxy 2": "guardians of the galaxy vol 2",
  "guardians galaxy 3": "guardians of the galaxy vol 3",
  "spiderman no way home": "spider man no way home",
  "spiderman homecoming": "spider man homecoming",
  "spiderman far from home": "spider man far from home",
  "deadpool and wolverine": "deadpool and wolverine",
  "captain america first avenger": "captain america the first avenger"
};

function watchKey(value = "") {
  const key = normalizeWatchTitle(value);
  return WATCH_ALIASES[key] || key;
}

function findVideoForWatchItem(item, pool = videos) {
  const target = watchKey(item);
  return pool.find(v => watchKey(v.title) === target || watchKey(v.name) === target || watchKey(v.posterBase) === target) || null;
}

function collectionMatches(collection) {
  const out = [];
  const seen = new Set();
  collection.items.forEach((item, index) => {
    const video = findVideoForWatchItem(item);
    if (!video || seen.has(String(video.id))) return;
    if (query) {
      const haystack = [video.title, item, video.description].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(query)) return;
    }
    seen.add(String(video.id));
    out.push({ video, item, order: index + 1 });
  });
  return out;
}

function filteredVideos() {
  const ids = new Set();
  const list = [];
  (window.THIRAI_X_WATCH_ORDERS || []).forEach(collection => {
    collectionMatches(collection).forEach(({video}) => {
      if (!ids.has(String(video.id))) { ids.add(String(video.id)); list.push(video); }
    });
  });
  return list;
}

function fallbackPoster(title) {
  const safe = encodeURIComponent((title || "thiraiX").slice(0, 22));
  return `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='400' viewBox='0 0 640 400'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23ff145f'/%3E%3Cstop offset='.6' stop-color='%237d2cff'/%3E%3Cstop offset='1' stop-color='%23ff9800'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='640' height='400' fill='%230c0c10'/%3E%3Ccircle cx='320' cy='190' r='58' fill='url(%23g)'/%3E%3Cpath d='M304 157l52 33-52 33z' fill='white'/%3E%3Ctext x='320' y='300' font-family='Arial,sans-serif' font-size='28' font-weight='700' fill='white' text-anchor='middle'%3E${safe}%3C/text%3E%3C/svg%3E`;
}

function localPosterCandidates(v) {
  const bases = [...new Set([v.posterBase, v.title].filter(Boolean).map(x => String(x).trim()))];
  const mapped = window.THIRAI_X_THUMBNAILS && window.THIRAI_X_THUMBNAILS[watchKey(v.title)];
  const local = [];

  // A mapped thumbnail is always the fastest/most reliable local choice.
  if (mapped) local.push(mapped);

  // Probe common local names in parallel instead of waiting for 404s one-by-one.
  const exts = ["jpg", "webp", "png", "jpeg"];
  for (const base of bases) {
    for (const ext of exts) local.push(`assets/thumbnail/${encodeURIComponent(base)}.${ext}`);
  }

  return {
    local: [...new Set(local)],
    remote: v.thumbnail || "",
    fallback: fallbackPoster(v.title)
  };
}

function preloadImage(src) {
  return new Promise(resolve => {
    if (!src) return resolve(null);
    const test = new Image();
    test.decoding = "async";
    test.onload = () => resolve(src);
    test.onerror = () => resolve(null);
    test.src = src;
  });
}

function bindPosterFast(img, v, eager = false) {
  const { local, remote, fallback } = localPosterCandidates(v);

  // Paint immediately so the card never waits on network/image discovery.
  img.src = fallback;
  img.decoding = "async";
  img.fetchPriority = eager ? "high" : "auto";
  img.loading = eager ? "eager" : "lazy";

  let settled = false;
  const use = src => {
    if (!src || settled) return false;
    settled = true;
    img.src = src;
    return true;
  };

  // Exact mapped/local files get priority. All local candidates are checked in parallel.
  Promise.all(local.map(preloadImage)).then(results => {
    const found = results.find(Boolean);
    if (found) use(found);
  });

  // Start Drive thumbnail at the same time; use it if local lookup has not completed first.
  if (remote) {
    preloadImage(remote).then(src => {
      if (src) use(src);
    });
  }
}

function videoCard(v, orderNo = null, masterTitle = "", eager = false) {
  const el = document.createElement("article");
  el.className = "video-card ordered-card";
  el.tabIndex = 0;
  const meta = masterTitle && masterTitle !== v.title ? masterTitle : "Ready to watch";
  const number = orderNo ? String(orderNo).padStart(2, "0") : "";
  el.innerHTML = `
    <div class="poster">
      <img alt="${escapeHtml(v.title)}" />
      ${number ? `<span class="order-number">${number}</span>` : ""}
      <span class="play-dot">▶</span>
    </div>
    <div class="card-copy">
      <h3>${escapeHtml(v.title)}</h3>
      <p>${escapeHtml(meta)}</p>
    </div>`;
  bindPosterFast(el.querySelector("img"), v, eager);
  const play = () => openPlayer(v);
  el.addEventListener("click", play);
  el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(); } });
  return el;
}

function setActiveCollection(id, { focus = false } = {}) {
  const exists = (window.THIRAI_X_WATCH_ORDERS || []).some(x => x.id === id);
  activeCollectionId = exists ? id : "doomsday";
  els.watchTabs.forEach(tab => {
    const active = tab.dataset.watchTab === activeCollectionId;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-pressed", active ? "true" : "false");
  });
  render();
  if (focus) {
    const section = els.collections.find(x => x.dataset.collection === activeCollectionId);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function render() {
  const orders = window.THIRAI_X_WATCH_ORDERS || [];
  let totalVisible = 0;
  els.collections.forEach(section => {
    const isActive = section.dataset.collection === activeCollectionId;
    section.classList.toggle("hidden", !isActive);
    if (!isActive) return;
    const collection = orders.find(x => x.id === section.dataset.collection);
    if (!collection) return;
    const grid = section.querySelector(".ordered-grid");
    const count = section.querySelector(".collection-count");
    const matches = collectionMatches(collection);
    grid.innerHTML = "";
    matches.forEach(({video, item, order}, index) => grid.appendChild(videoCard(video, order, item, index < 6)));
    totalVisible = matches.length;
    if (count) count.textContent = `${matches.length} / ${collection.items.length} available`;
    section.classList.toggle("search-empty", Boolean(query) && matches.length === 0);
  });
  if (els.empty) els.empty.classList.toggle("hidden", totalVisible !== 0 || !query);
}

function nextWatchRecommendations(current, limit = 8) {
  const orders = window.THIRAI_X_WATCH_ORDERS || [];
  const active = orders.find(x => x.id === activeCollectionId);
  const orderedCollections = active ? [active, ...orders.filter(x => x.id !== activeCollectionId)] : orders;
  for (const collection of orderedCollections) {
    const currentIndex = collection.items.findIndex(item => watchKey(item) === watchKey(current?.title));
    if (currentIndex < 0) continue;
    const result = [];
    for (let i = currentIndex + 1; i < collection.items.length && result.length < limit; i++) {
      const video = findVideoForWatchItem(collection.items[i]);
      if (video && String(video.id) !== String(current?.id) && !result.some(x => String(x.id) === String(video.id))) result.push(video);
    }
    if (result.length) return result;
  }
  return filteredVideos().filter(v => String(v.id) !== String(current?.id)).slice(0, limit);
}

function recommendedCard(v) {
  const el = document.createElement("article");
  el.className = "recommended-card";
  el.tabIndex = 0;
  el.innerHTML = `
    <div class="recommended-poster">
      <img alt="${escapeHtml(v.title)}" />
      <span class="recommended-play">▶</span>
    </div>
    <div class="recommended-copy">
      <h3>${escapeHtml(v.title)}</h3>
      <p>Next in watch order</p>
    </div>`;
  bindPosterFast(el.querySelector("img"), v, false);
  const play = () => { openPlayer(v); document.querySelector(".player-page")?.scrollTo({ top: 0, behavior: "smooth" }); };
  el.addEventListener("click", play);
  el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(); } });
  return el;
}

function renderRecommendations(current) {
  if (!els.recommendedVideos) return;
  const list = nextWatchRecommendations(current);
  els.recommendedVideos.innerHTML = "";
  list.forEach(v => els.recommendedVideos.appendChild(recommendedCard(v)));
  if (els.recommendedCount) els.recommendedCount.textContent = `${list.length} next`;
  const section = els.recommendedVideos.closest(".recommended-section");
  if (section) section.classList.toggle("hidden", list.length === 0);
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
  if (range !== "today") start.setDate(start.getDate() - (Number(range) - 1));
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
  if (!els.video.paused && els.playerMenu.classList.contains("hidden")) {
    controlsTimer = setTimeout(() => els.controls.classList.add("fade"), 3000);
  }
}

function qualityLabel(height) {
  const h = Number(height) || 0;
  if (h >= 2160) return "2160p";
  if (h >= 1440) return "1440p";
  if (h >= 1080) return "1080p";
  if (h >= 720) return "720p";
  if (h >= 480) return "480p";
  if (h >= 360) return "360p";
  if (h > 0) return `${h}p`;
  return "Auto";
}

function updateTrackButtons() {
  if (els.speed) els.speed.textContent = `${els.video.playbackRate || 1}×`;
  if (els.quality) els.quality.textContent = qualityLabel(els.video.videoHeight);
  if (els.subtitle) {
    const tracks = Array.from(els.video.textTracks || []);
    const active = tracks.find(t => t.mode === "showing");
    els.subtitle.textContent = active ? (active.language ? active.language.toUpperCase() : "CC On") : "CC";
  }
  if (els.audio) {
    const list = els.video.audioTracks;
    if (list && typeof list.length === "number" && list.length > 1) {
      let selected = null;
      for (let i = 0; i < list.length; i++) if (list[i].enabled) selected = list[i];
      els.audio.textContent = selected?.language ? selected.language.toUpperCase() : "Audio";
    } else {
      els.audio.textContent = "Audio";
    }
  }
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
  updateTrackButtons();
}

function togglePlayback() {
  if (els.video.paused || els.video.ended) els.video.play().catch(() => {}); else els.video.pause();
  showControls();
}

function clearExternalTracks() {
  attachedExternalTracks.forEach(node => node.remove());
  attachedExternalTracks = [];
}

function addExternalSubtitleTracks(v) {
  clearExternalTracks();
  const list = Array.isArray(v.subtitles) ? v.subtitles : [];
  list.forEach((track, idx) => {
    if (!track || !track.src) return;
    const el = document.createElement("track");
    el.kind = "subtitles";
    el.src = track.src;
    el.srclang = track.language || track.srclang || `track-${idx + 1}`;
    el.label = track.label || track.language || `Subtitle ${idx + 1}`;
    if (track.default) el.default = true;
    els.video.appendChild(el);
    attachedExternalTracks.push(el);
  });
}

function normalizeSources(v) {
  const out = [];
  const raw = Array.isArray(v.sources) ? v.sources : (Array.isArray(v.qualities) ? v.qualities : []);
  raw.forEach((src, idx) => {
    if (typeof src === "string") out.push({ src, label: `Source ${idx + 1}` });
    else if (src && (src.src || src.url)) out.push({
      src: src.src || src.url,
      label: src.label || src.quality || (src.height ? `${src.height}p` : `Source ${idx + 1}`),
      height: Number(src.height) || 0,
      type: src.type || ""
    });
  });
  if (!out.length && v.videoUrl) out.push({ src: v.videoUrl, label: "Auto" });
  return out;
}

function setVideoSource(src, preserve = true) {
  if (!src) return;
  const time = preserve && Number.isFinite(els.video.currentTime) ? els.video.currentTime : 0;
  const wasPlaying = !els.video.paused;
  showVideoLoader("Changing quality...");
  els.video.src = src;
  els.video.load();
  const restore = () => {
    if (time > 0 && Number.isFinite(els.video.duration)) els.video.currentTime = Math.min(time, Math.max(0, els.video.duration - 0.25));
    if (wasPlaying) els.video.play().catch(() => {});
    els.video.removeEventListener("loadedmetadata", restore);
  };
  els.video.addEventListener("loadedmetadata", restore);
}

function openPlayer(v, options = {}) {
  if (!v.videoUrl && !normalizeSources(v).length) {
    alert("This movie does not have a playable URL yet.");
    return;
  }
  currentVideo = v;
  if (!options.skipHistory && v.id) {
    const url = new URL(window.location.href);
    url.searchParams.set("video", v.id);
    history.replaceState(null, "", url);
  }
  const meta = [formatDate(v.date)].filter(Boolean).join(" · ");
  els.playerTitle.textContent = v.title || "Movie";
  els.playerMeta.textContent = meta;
  els.playerDisplayTitle.textContent = v.title || "Movie";
  els.playerDescription.textContent = v.description || meta || "Movie";
  els.playerBadge.textContent = "Movie";
  renderRecommendations(v);
  closePlayerMenu();
  showVideoLoader("Loading video...");
  addExternalSubtitleTracks(v);
  const sources = normalizeSources(v);
  els.video.src = sources[0]?.src || v.videoUrl;
  els.video.playbackRate = 1;
  els.modal.classList.remove("hidden");

  // Show a compact, closeable in-player ad before playback begins.
  // It is automatically hidden as soon as the video starts playing.
  if (els.playerInlineAd) {
    els.playerInlineAd.classList.remove("hidden");
    window.dispatchEvent(new CustomEvent("thiraix:player-ad-show"));
  }

  updatePlayerUI();
  showControls();
  els.video.play().catch(() => {});
}

function closePlayer() {
  hideVideoLoader();
  closePlayerMenu();
  currentVideo = null;
  const url = new URL(window.location.href);
  url.searchParams.delete("video");
  history.replaceState(null, "", url);
  els.video.pause();
  els.video.removeAttribute("src");
  clearExternalTracks();
  els.video.load();
  els.modal.classList.add("hidden");
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
  const shareData = { title: currentVideo.title || "thiraiX Movie", text: currentVideo.title || "Movie", url: shareUrl };
  try {
    if (navigator.share) { await navigator.share(shareData); return; }
    await navigator.clipboard.writeText(shareUrl);
    alert("Movie link copied to clipboard.");
  } catch (err) {
    if (err && err.name === "AbortError") return;
    try { await navigator.clipboard.writeText(shareUrl); alert("Movie link copied to clipboard."); }
    catch (_) { window.prompt("Copy this movie link:", shareUrl); }
  }
}

function menuOption(label, sublabel, selected, onClick, disabled = false) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `player-menu-option${selected ? " selected" : ""}`;
  btn.disabled = disabled;
  btn.innerHTML = `<span><strong>${escapeHtml(label)}</strong>${sublabel ? `<small>${escapeHtml(sublabel)}</small>` : ""}</span><span class="menu-check">${selected ? "✓" : ""}</span>`;
  if (!disabled) btn.addEventListener("click", onClick);
  return btn;
}

function openPlayerMenu(kind) {
  currentMenu = kind;
  els.playerMenuOptions.innerHTML = "";
  els.playerMenu.classList.remove("hidden");
  els.controls.classList.remove("fade");
  clearTimeout(controlsTimer);

  if (kind === "speed") {
    els.playerMenuTitle.textContent = "Playback speed";
    [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].forEach(rate => {
      els.playerMenuOptions.appendChild(menuOption(`${rate}×`, rate === 1 ? "Normal" : "", Math.abs(els.video.playbackRate - rate) < 0.001, () => {
        els.video.playbackRate = rate;
        updateTrackButtons();
        closePlayerMenu();
      }));
    });
    return;
  }

  if (kind === "subtitle") {
    els.playerMenuTitle.textContent = "Subtitles";
    const tracks = Array.from(els.video.textTracks || []);
    const activeIndex = tracks.findIndex(t => t.mode === "showing");
    els.playerMenuOptions.appendChild(menuOption("Off", "Disable subtitles", activeIndex === -1, () => {
      tracks.forEach(t => t.mode = "disabled");
      updateTrackButtons();
      closePlayerMenu();
    }));
    if (!tracks.length) {
      els.playerMenuOptions.appendChild(menuOption("No subtitle tracks detected", "Embedded subtitle support depends on the video format/browser.", false, () => {}, true));
    } else {
      tracks.forEach((track, idx) => {
        const label = track.label || track.language || `Subtitle ${idx + 1}`;
        const language = track.language ? track.language.toUpperCase() : "";
        els.playerMenuOptions.appendChild(menuOption(label, language, track.mode === "showing", () => {
          tracks.forEach((t, i) => t.mode = i === idx ? "showing" : "disabled");
          updateTrackButtons();
          closePlayerMenu();
        }));
      });
    }
    return;
  }

  if (kind === "audio") {
    els.playerMenuTitle.textContent = "Audio language";
    const tracks = els.video.audioTracks;
    if (tracks && typeof tracks.length === "number" && tracks.length > 0) {
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const label = track.label || track.language || `Audio ${i + 1}`;
        const language = track.language ? track.language.toUpperCase() : "";
        els.playerMenuOptions.appendChild(menuOption(label, language, !!track.enabled, () => {
          for (let j = 0; j < tracks.length; j++) tracks[j].enabled = j === i;
          updateTrackButtons();
          closePlayerMenu();
        }));
      }
    } else {
      els.playerMenuOptions.appendChild(menuOption("Default audio", "No switchable audio tracks exposed by this browser.", true, () => {}, true));
    }
    return;
  }

  if (kind === "quality") {
    els.playerMenuTitle.textContent = "Video quality";
    const sources = currentVideo ? normalizeSources(currentVideo) : [];
    if (sources.length > 1) {
      sources.forEach((source, idx) => {
        const active = els.video.currentSrc === new URL(source.src, window.location.href).href || (!els.video.currentSrc && idx === 0);
        els.playerMenuOptions.appendChild(menuOption(source.label || qualityLabel(source.height), source.height ? `${source.height}p source` : "", active, () => {
          setVideoSource(source.src, true);
          els.quality.textContent = source.label || qualityLabel(source.height);
          closePlayerMenu();
        }));
      });
    } else {
      const detected = qualityLabel(els.video.videoHeight);
      const detail = els.video.videoWidth && els.video.videoHeight ? `${els.video.videoWidth} × ${els.video.videoHeight}` : "Detected after video metadata loads";
      els.playerMenuOptions.appendChild(menuOption(detected, detail, true, () => {}, true));
    }
  }
}

function closePlayerMenu() {
  currentMenu = "";
  if (els.playerMenu) els.playerMenu.classList.add("hidden");
  showControls();
}

async function loadVideos() {
  try {
    if (!API_URL) {
      videos = [];
      render();
      return;
    }
    const r = await fetch(API_URL, { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`API ${r.status}`);
    const data = await r.json();
    const incoming = Array.isArray(data) ? data : (data.videos || []);
    videos = incoming.filter(isMovieRecord).map(normalizeVideo);
    render();
  } catch (err) {
    console.error("thiraiX API error:", err);
    videos = [];
    render();
  } finally {
    hideSiteLoader();
    const sharedId = new URLSearchParams(window.location.search).get("video");
    if (sharedId && els.modal.classList.contains("hidden")) {
      const sharedVideo = videos.find(v => String(v.id) === String(sharedId));
      if (sharedVideo && (sharedVideo.videoUrl || normalizeSources(sharedVideo).length)) openPlayer(sharedVideo, { skipHistory: true });
    }
  }
}

// Watch-list selector
// Switch immediately on the first pointer/touch press. The click handler is
// retained only for keyboard activation and browsers without Pointer Events.
let lastWatchTabPointerAt = 0;
els.watchTabs.forEach(tab => {
  const activate = (event, fromPointer = false) => {
    if (fromPointer) {
      lastWatchTabPointerAt = Date.now();
      // Prevent the synthetic click generated after touch/pointer activation.
      event.preventDefault();
    } else if (Date.now() - lastWatchTabPointerAt < 650) {
      return;
    }
    event.stopPropagation();
    setActiveCollection(tab.dataset.watchTab, { focus: false });
  };

  if (window.PointerEvent) {
    tab.addEventListener("pointerdown", event => activate(event, true), { passive: false });
  } else {
    tab.addEventListener("touchstart", event => activate(event, true), { passive: false });
  }

  tab.addEventListener("click", event => activate(event, false));
});

// Search
els.searchToggle.addEventListener("click", () => { els.searchBar.classList.remove("hidden"); els.searchInput.focus(); });
els.searchClose.addEventListener("click", () => { els.searchBar.classList.add("hidden"); els.searchInput.value = ""; query = ""; render(); });
els.searchInput.addEventListener("input", e => { query = e.target.value.trim().toLowerCase(); render(); });

// Watch-order pages intentionally do not sort/filter by upload date.

// Player controls
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
    flashGesture(els.gestureCenterFeedback, els.video.paused ? "▶" : "❚❚");
  }
  showControls();
}

let playerPointerMoved = false;
let playerPointerStartY = 0;

// Single-tap player interaction. Vertical swipes are left to the browser so
// the player page can scroll naturally on Chrome/mobile.
els.stage.addEventListener("pointerdown", (event) => {
  playerPointerMoved = false;
  playerPointerStartY = event.clientY;
}, { passive: true });

els.stage.addEventListener("pointermove", (event) => {
  if (Math.abs(event.clientY - playerPointerStartY) > 10) playerPointerMoved = true;
}, { passive: true });

els.stage.addEventListener("pointerup", (event) => {
  if (playerPointerMoved) return;
  const target = event.target;
  if (target.closest("button, input, .custom-controls, .player-menu, .player-inline-ad")) return;
  togglePlayback();
  showControls();
}, { passive: true });

els.close.addEventListener("click", closePlayer);
els.bigPlay.addEventListener("click", togglePlayback);
els.playPause.addEventListener("click", togglePlayback);
if (els.playerInlineAdClose) {
  els.playerInlineAdClose.addEventListener("click", (event) => {
    event.stopPropagation();
    if (els.playerInlineAd) els.playerInlineAd.classList.add("hidden");
  });
}

els.video.addEventListener("play", () => {
  if (els.playerInlineAd) els.playerInlineAd.classList.add("hidden");
  updatePlayerUI();
});
els.video.addEventListener("pause", updatePlayerUI);
els.video.addEventListener("ended", updatePlayerUI);
els.video.addEventListener("timeupdate", updatePlayerUI);
els.video.addEventListener("durationchange", updatePlayerUI);
els.video.addEventListener("volumechange", updatePlayerUI);
els.video.addEventListener("ratechange", updateTrackButtons);
els.video.addEventListener("loadstart", () => showVideoLoader("Loading video..."));
els.video.addEventListener("waiting", () => { showVideoLoader("Buffering..."); showControls(); });
els.video.addEventListener("stalled", () => showVideoLoader("Buffering..."));
els.video.addEventListener("seeking", () => showVideoLoader("Loading..."));
els.video.addEventListener("loadedmetadata", () => { hideVideoLoader(); updateTrackButtons(); if (currentMenu === "quality") openPlayerMenu("quality"); });
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
els.speed.addEventListener("click", () => openPlayerMenu("speed"));
els.subtitle.addEventListener("click", () => openPlayerMenu("subtitle"));
els.audio.addEventListener("click", () => openPlayerMenu("audio"));
els.quality.addEventListener("click", () => openPlayerMenu("quality"));
els.playerMenuClose.addEventListener("click", closePlayerMenu);
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
    if (e.key === "Escape") { if (!els.playerMenu.classList.contains("hidden")) closePlayerMenu(); else closePlayer(); }
    if (e.key === " ") { e.preventDefault(); togglePlayback(); }
    if (e.key === "ArrowLeft") els.video.currentTime = Math.max(0, els.video.currentTime - 10);
    if (e.key === "ArrowRight") els.video.currentTime = Math.min(els.video.duration || Infinity, els.video.currentTime + 10);
  }
});

loadVideos();
