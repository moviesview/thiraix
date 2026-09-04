const API_URL = (window.MILES_CONFIG && window.MILES_CONFIG.API_URL) || "";

let videos = [];
let query = "";
let dateFrom = "";
let dateTo = "";
let controlsTimer = null;
let currentVideo = null;
let currentMenu = "";
let attachedExternalTracks = [];
let activeCollectionId = new URLSearchParams(window.location.search).get("collection") || "doomsday";
let heroIndex = 0;
let heroTimer = null;
let currentQualitySelection = "Auto";
let closingPlayerFromHistory = false;

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
  volume: $("#volumeSlider"),
  settings: $("#settingsToggle"),
  seekWrap: $("#seekWrap"),
  seekTooltip: $("#seekTooltip"),
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
  heroTrack: $("#heroTrack"),
  heroPrev: $("#heroPrev"),
  heroNext: $("#heroNext"),
  heroDots: $("#heroDots"),
  categoryCards: $("#categoryCards"),
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


const DIRECT_MOVIE_STREAMS = {
  "x men": "https://updown.azurecdn.cc/uploads/59bdb2f8-25cd-4d32-802d-8d4029ce675d/59bdb2f8-25cd-4d32-802d-8d4029ce675d?response-content-disposition=attachment%3B+filename%3DMoviesda.Gardeni_-_Pallaburusu_2026_Original_1080p_HD.mp4&AWSAccessKeyId=LTAI5tNAscvKGr2VLyHa2FL4&Expires=1788538383&Signature=mX7Z67W%2BDy6%2BrEOyNEFj0tpvghY%3D",
  "x2 x men united": "https://dub6-1.uptodub.ch/files/Tamil%20Dubbed%20Collections/X%20Men%20Complete%20Collections/X%20Men%202%20(2003)/X%20Men%202%20(640x360)/X%20Men%202%202003%20HD.mp4?h=4df2314fa831df51028817f1b1950e037597361a9fbcf35e30f0a5522d9c47d3&e=1789102620",
  "captain america the first avenger": "https://dub6-1.uptodub.ch/files/Tamil%20Dubbed%20Collections/Captain%20America%20Duology%20Collections/Captain%20America%20(2011)/Mp4%20HD%20(640x360)/Captain%20America%20(2011)%20HD%20(640x360).mp4?h=fb60d8d1bb3dad9652b5d0dcb3595f8634a3b437e76b679148173a3714c91ddf&e=1789102636",
  "the avengers": "https://dub6-1.uptodub.ch/files/Tamil%20Dubbed%20Collections/The%20Avengers%20Trilogy%20Collections/The%20Avengers%20(2012)/The%20Avengers%20(640x360)/The%20Avengers%20HD.mp4?h=00f9c12d279dc0ad394c5f48a7e6165d5f3dd698aecbfbaf1b2f9c75aa7ddb76&e=1789102724",
  "spider man no way home": "https://dub2-1.uptodub.ch/files/Tamil%20Dubbed%20Movies/Spider-Man%20No%20Way%20Home%20(2021)/Spider-Man%20No%20Way%20Home%20(Original)/Spider-Man%20No%20Way%20Home%20(720p%20HD)/Spider-Man%20No%20Way%20Home%202021%20720p%20HD.mp4?h=d6af89ba4beb67b62216a38768c37c143a855f1f044cac11f043e17088ecdd5c&e=1789276958",
  "doctor strange in the multiverse of madness": "https://dub4-1.uptodub.ch/files/Tamil%20Dubbed%20Movies/Doctor%20Strange%20in%20the%20Multiverse%20of%20Madness%20(2022)/Doctor%20Strange%20in%20the%20Multiverse%20of%20Madness%20(720p%20HD)/Doctor%20Strange%20in%20the%20Multiverse%20of%20Madness%202022%20720p%20HD.mp4?h=9988165902d4fc34fbf04745106aa04c5b565179427ba970288171968fb3cd12&e=1789278032",
  "deadpool and wolverine": "https://dub1-1.uptodub.ch/files/Tamil%20Dubbed%20Movies/Deadpool%20and%20Wolverine%20(2024)/Deadpool%20and%20Wolverine%20(Original)/Deadpool%20and%20Wolverine%20(720p%20HD)/Deadpool%20and%20Wolverine%202024%20720p%20HD.mp4?h=60e9ebebef14ff5537e801965e0c07911f8d333896215378234bac418208276b&e=1789278082",
  "black panther wakanda forever": "https://dub1-1.uptodub.ch/files/Tamil%20Dubbed%20Movies/Black%20Panther%20Wakanda%20Forever%20(2022)/Black%20Panther%20Wakanda%20Forever%20(720p%20HD)/isaiDub.Com%20-%20Black%20Panther%20Wakanda%20Forever%202022%20Original%20720p%20HD.mp4?h=e7a976eb00ebe2332e7186920fded1b9ec3af126b8c2aa2a6f5d5e390d4cb57c&e=1789282173",
  "captain america brave new world": "https://dub7-1.uptodub.ch/files/Tamil%20Dubbed%20Movies/Captain%20America%20Brave%20New%20World%20(2025)/Captain%20America%20Brave%20New%20World%20(Original)/Captain%20America%20Brave%20New%20World%20(720p%20HD)/Captain%20America%20Brave%20New%20World%202025%20720p%20HD.mp4?h=c94ff3e5fd81265f9f87bd1f6c9bca1ad0131e705806868a60b6e4eb81ead9c3&e=1789282268",
  "thunderbolts": "https://dub7-1.uptodub.ch/files/Tamil%20Dubbed%20Movies/Thunderbolts%20(2025)/Thunderbolts%20(Original)/Thunderbolts%20(1080p%20HD)/Thunderbolts%202025%20Original%201080p%20HD.mp4?h=d89f9c1b899f1d172368640f82a6a1b36f69bf0afd3a14d8eab2a475fca99e7e&e=1789282625",
  "x men the last stand": "https://dub6-1.uptodub.ch/files/Tamil%20Dubbed%20Collections/X%20Men%20Complete%20Collections/X%20Men%20The%20Last%20Stand%20(2006)/X%20Men%20The%20Last%20Stand%20(English)/X%20Men%20The%20Last%20Stand%20(640x360)/X%20Men%20The%20Last%20Stand%202006%20English%20HD.mp4?h=a8f4fa39c4b93e90d8f444b20e0e28c9eb024a1f27e0b3ff2c6a7d076e34fd75&e=1789283071",
  "x men origins wolverine": "https://dub6-1.uptodub.ch/files/Tamil%20Dubbed%20Collections/X%20Men%20Complete%20Collections/X%20Men%20Origins%20Wolverine%20(2009)/Mp4%20HD%20(640x360)/X%20Men%20Origins%20Wolverine%20(2009)%20HD%20(640x360).mp4?h=b73a461c795be82d38728fca218199c2205504d644e23081ffd18918fe8b4077&e=1789283147",
  "x men first class": "https://dub6-1.uptodub.ch/files/Tamil%20Dubbed%20Collections/X%20Men%20Complete%20Collections/X%20Men%20First%20Class%20(2011)/Mp4%20HD%20(640x360)/X%20Men%20First%20Class%20(2011)%20HD%20(640x360).mp4?h=95beb9b5e08354e98e8db3128b33cb7a963d77341944df4e8f0ecebef25e45e2&e=1789283307",
  "x men days of future past": "https://dub6-1.uptodub.ch/files/Tamil%20Dubbed%20Collections/X%20Men%20Complete%20Collections/X%20Men%20Days%20Of%20Future%20Past%20(2014)/Mp4%20HD%20(640x360)/X%20Men%20Days%20Of%20Future%20Past%20(2014)%20HD%20(640x360).mp4?h=c4dcbfc45846652d04d53926d2c52d6f2caf36584f1fb341daa711ca9f1bf769&e=1789283395",
  "x men dark phoenix": "https://dub6-1.uptodub.ch/files/Tamil%20Dubbed%20Movies/X%20Men%20Dark%20Phoenix%20(2019)/X%20Men%20Dark%20Phoenix%20(640x360)/X-Men%20Dark%20Phoenix%202019%20HD.mp4?h=777a5360d67d9cd9e7cda38a6b3c13ad27bd9b0ba0442362872aeab0ef7b5a2c&e=1789283509",
  "x men apocalypse": "https://dub3-1.uptodub.ch/files/Tamil%20Dubbed%20Movies/X-Men%20Apocalypse%20(2016)/X-Men%20Apocalypse%20(640x360)/X-Men%20Apocalypse%20HD.mp4?h=0185958a10c5cdbf636d2b8a95a6647030af2d967caa388b8f12a79581332626&e=1789283600",
  "deadpool": "https://dub1-1.uptodub.ch/files/Tamil%20Dubbed%20Movies/Deadpool%20(2016)/Mp4%20HD%20(640x360)/Deadpool%20(2016)%20HD%20(640x360).mp4?h=61172eaabd9dbf623778a60efb440d8953148d6c0b800114d69a7c275650cad7&e=1789283751",
  "deadpool 2": "https://dub1-1.uptodub.ch/files/Tamil%20Dubbed%20Movies/Deadpool%202%20(2018)/Deadpool%202%20(640x360)/Deadpool%202%20HD.mp4?h=1b0811223a207b7cce9ac67db09deaa86b9ed75ef5f338eec60ed6bad4c72ded&e=1789283789",
  "logan": "https://dub3-1.uptodub.ch/files/Tamil%20Dubbed%20Movies/Logan%20(2017)/Logan%20(Original)/Logan%20(720p%20HD)/Logan%202017%20720p%20HD.mp4?h=2087668f3bd673f7e1f112d0e27e6f6b04f06bb786da95b16e826905a31bf9ea&e=1789283925",
  "the wolverine": "https://dub6-1.uptodub.ch/files/Tamil%20Dubbed%20Collections/X%20Men%20Complete%20Collections/The%20Wolverine%20(2013)/Mp4%20HD%20(640x360)/The%20Wolverine%20(2013)%20HD%20(640x360).mp4?h=26e85444e980885701c75b284bed5988aa5c8f8c85e7fcea1dd30b4ba41c561b&e=1789295230",
  "the amazing spider man": "https://dub6-1.uptodub.ch/files/Tamil%20Dubbed%20Collections/Spider%20Man%20Pentalogy%20Collections/The%20Amazing%20Spiderman%20(2012)/Mp4%20HD%20(640x360)/The%20Amazing%20Spiderman%20(2012)%20HD%20(640x360).mp4?h=401515b0122a16c25f63172cf97ec0db17334968237aef417f35bef0eccd7191&e=1789295327",
  "the amazing spider man 2": "https://dub6-1.uptodub.ch/files/Tamil%20Dubbed%20Collections/Spider%20Man%20Pentalogy%20Collections/The%20Amazing%20Spider%20Man%202%20(2014)/Mp4%20HD%20(640x360)/The%20Amazing%20Spider%20Man%202%20(2014)%20HD%20(640x360).mp4?h=250fd249120e6cac28544c62cd37544f1a700302f440d6328f5e0a546eee6efd&e=1789295371",
  "spider man": "https://dub8-1.uptodub.ch/files/Tamil%20Dubbed%20Movies/Spider%20Man%20(2002)/Spider%20Man%20(Original)/Spider%20Man%20(1080p%20HD)/Spider%20Man%202002%20Original%201080p%20HD.mp4?h=4ab77263bf097c95e1a83aaf22a60b326b598d63608308d6c80d2c9f69f795f5&e=1789295507",
  "spider man 2": "https://dub8-1.uptodub.ch/files/Tamil%20Dubbed%20Movies/Spider%20Man%202%20(2004)/Spider%20Man%202%20(Original)/Spider%20Man%202%20(1080p%20HD)/Spider%20Man%202%202004%20Original%201080p%20HD.mp4?h=73941157f8b5d99ef033cf034057244f09f4e856bb4b61ee96ea4fbae8f0c2aa&e=1789295599",
  "spider man 3": "https://dub8-1.uptodub.ch/files/Tamil%20Dubbed%20Movies/Spider-Man%203%20(2007)/Spider-Man%203%20(Original)/Spider-Man%203%20(1080p%20HD)/Spider-Man%203%202007%20Original%201080p%20HD.mp4?h=477b359d04974007386b445e8092a73a80c018ea368c7fad71e69a2f7f857d78&e=1789295650",
  "thor": "https://dub6-1.uptodub.ch/files/Tamil%20Dubbed%20Collections/Thor%20Duology%20Collections/Thor%20(2011)/Mp4%20HD%20(640x360)/Thor%20(2011)%20HD%20(640x360).mp4?h=e0a4329f6153a5f50ae94794f41ef32779b0d4d9f92adf1ebe67f2adcf244d01&e=1789295799",
  "thor 2": "https://dub6-1.uptodub.ch/files/Tamil%20Dubbed%20Collections/Thor%20Duology%20Collections/Thor%202%20(2013)/Mp4%20HD%20(640x360)/Thor%202%20(2013)%20HD%20(640x360).mp4?h=4a69dd2dd015739c5a6e79429f279fca5b95d4eff87f2984c658a80966d58ea7&e=1789295822",
  "avengers infinity war": "https://dub1-1.uptodub.ch/files/Tamil%20Dubbed%20Movies/Avengers%20Infinity%20War%20(2018)/Avengers%20Infinity%20War%20(640x360)/Avengers%20Infinity%20War%20HD.mp4?h=6c80199b5a2d5a8578b27349a7bfcc686593cdff7631549550570542fd5e32e5&e=1789295954",
  "avengers endgame": "https://dub1-1.uptodub.ch/files/Tamil%20Dubbed%20Movies/Avengers%20Endgame%20(2019)/Avengers%20Endgame%20(Original%20V2)/Avengers%20Endgame%20(640x360)/Avengers%20Endgame%202019%20HD.mp4?h=7f6d1e5d2c157b6c39f59f72bb7df0c0c3416ac0bdb1a769b58abe63314fe37d&e=1789296060"
};

const STATIC_DIRECT_MOVIES = [
  "Spider-Man: No Way Home", "Doctor Strange in the Multiverse of Madness", "Deadpool & Wolverine",
  "Black Panther: Wakanda Forever", "Captain America: Brave New World", "Thunderbolts*",
  "X-Men: The Last Stand", "X-Men Origins: Wolverine", "X-Men: First Class", "X-Men: Days of Future Past",
  "X-Men: Dark Phoenix", "X-Men: Apocalypse", "Deadpool", "Deadpool 2", "Logan", "The Wolverine",
  "The Amazing Spider-Man", "The Amazing Spider-Man 2", "Spider-Man", "Spider-Man 2", "Spider-Man 3",
  "Thor", "Thor 2", "Avengers: Infinity War", "Avengers: Endgame"
].map((title, index) => ({
  id: `direct-movie-${index + 1}`,
  name: title,
  title,
  type: "Movie",
  folder: "Movies/Direct",
  description: "Movie"
}));

function directStreamMeta(url = "") {
  if (/1080p/i.test(url)) return { label: "1080p", height: 1080 };
  if (/720p/i.test(url)) return { label: "720p", height: 720 };
  return { label: "360p", height: 360 };
}

function getDirectMovieStream(title = "") {
  const key = watchKey(title);
  return DIRECT_MOVIE_STREAMS[key] || "";
}

function normalizeVideo(video = {}) {
  const rawName = video.name || video.title || "";
  const parsed = parseDriveFilename(rawName);
  const title = parsed.title || video.title || video.name || "Untitled Movie";
  const mappedThumb = (window.THIRAI_X_THUMBNAILS && window.THIRAI_X_THUMBNAILS[watchKey(title)]) || "";
  const directStream = getDirectMovieStream(title);
  return {
    ...video,
    title,
    posterBase: parsed.posterBase || parsed.title || video.title || "Untitled Movie",
    episode: "",
    type: "Movie",
    description: video.description || "Movie",
    apiThumbnail: video.thumbnail || "",
    thumbnail: mappedThumb || video.thumbnail || "",
    ...(directStream ? {
      videoUrl: directStream,
      sources: [{ src: directStream, ...directStreamMeta(directStream), type: "video/mp4" }],
      playbackSource: "Direct MP4"
    } : {})
  };
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
  "captain america first avenger": "captain america the first avenger",
  "spiderman": "spider man",
  "spiderman 2": "spider man 2",
  "spiderman 3": "spider man 3",
  "the amazing spiderman": "the amazing spider man",
  "the amazing spiderman 2": "the amazing spider man 2",
  "x men the last stand english": "x men the last stand",
  "dark phoenix": "x men dark phoenix",
  "thor the dark world": "thor 2",
  "avengers end game": "avengers endgame"
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
  const mapped = window.THIRAI_X_THUMBNAILS && window.THIRAI_X_THUMBNAILS[watchKey(v.title)];
  const remote = [...new Set([mapped, v.thumbnail, v.apiThumbnail].filter(Boolean))];
  return {
    local: [],
    remote,
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
  if (Array.isArray(remote) && remote.length) {
    Promise.all(remote.map(preloadImage)).then(results => {
      const found = results.find(Boolean);
      if (found) use(found);
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

function getWatchOrders() {
  return window.THIRAI_X_WATCH_ORDERS || [];
}

function activeCollection() {
  return getWatchOrders().find(x => x.id === activeCollectionId) || getWatchOrders()[0] || null;
}

function collectionPrimaryMatch(collection) {
  return collectionMatches(collection)[0] || null;
}

function syncCollectionSelectors() {
  els.watchTabs.forEach(tab => {
    const active = tab.dataset.watchTab === activeCollectionId;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-pressed", active ? "true" : "false");
  });
  if (els.categoryCards) {
    els.categoryCards.querySelectorAll(".category-card").forEach(card => {
      card.classList.toggle("active", card.dataset.collection === activeCollectionId);
    });
  }
  if (els.heroDots) {
    els.heroDots.querySelectorAll("button").forEach((dot, idx) => {
      const collectionId = dot.dataset.collection || "";
      const active = collectionId === activeCollectionId || idx === heroIndex;
      dot.classList.toggle("active", active);
      dot.setAttribute("aria-current", active ? "true" : "false");
    });
  }
  if (els.heroTrack) {
    els.heroTrack.querySelectorAll(".hero-slide").forEach((slide, idx) => {
      const active = slide.dataset.collection === activeCollectionId || idx === heroIndex;
      slide.classList.toggle("active", active);
    });
  }
}

function buildHeroSlide(collection, index) {
  const item = collectionPrimaryMatch(collection);
  const video = item && item.video;
  const slide = document.createElement("article");
  slide.className = "hero-slide";
  slide.dataset.collection = collection.id;
  slide.innerHTML = `
    <div class="hero-media"><img alt="${escapeHtml(collection.title)} banner" /></div>
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <p>${escapeHtml(collection.eyebrow || "Collection")}</p>
      <h1>${escapeHtml(collection.title)}</h1>
      <span>${escapeHtml(collection.description || "Curated watch list")}</span>
      <div class="hero-actions">
        <button class="hero-cta" type="button">Open watchlist</button>
        <small>${item ? `${collectionMatches(collection).length} titles available` : "Coming soon"}</small>
      </div>
    </div>`;
  const img = slide.querySelector("img");
  if (video) bindPosterFast(img, video, index === 0); else img.src = fallbackPoster(collection.title);
  const activate = () => setActiveCollection(collection.id, { focus: true });
  slide.querySelector(".hero-cta")?.addEventListener("click", activate);
  slide.addEventListener("click", event => {
    if (event.target.closest("button")) return;
    activate();
  });
  return slide;
}

function updateHeroDots() {
  if (!els.heroDots) return;
  els.heroDots.querySelectorAll("button").forEach((dot, index) => {
    const active = index === heroIndex;
    dot.classList.toggle("active", active);
    dot.setAttribute("aria-current", active ? "true" : "false");
  });
}

function goHero(index, smooth = true) {
  if (!els.heroTrack) return;
  const slides = Array.from(els.heroTrack.children);
  if (!slides.length) return;
  heroIndex = (index + slides.length) % slides.length;
  const slide = slides[heroIndex];
  slide.scrollIntoView({ behavior: smooth ? "smooth" : "auto", inline: "start", block: "nearest" });
  const collectionId = slide.dataset.collection;
  if (collectionId && collectionId !== activeCollectionId) setActiveCollection(collectionId, { focus: false });
  updateHeroDots();
  restartHeroTimer();
}

function restartHeroTimer() {
  clearInterval(heroTimer);
  if (!els.heroTrack || els.heroTrack.children.length < 2) return;
  heroTimer = setInterval(() => goHero(heroIndex + 1, true), 5500);
}

function setupHeroScrollSync() {
  if (!els.heroTrack) return;
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const slides = Array.from(els.heroTrack.children);
      if (!slides.length) { ticking = false; return; }
      const trackRect = els.heroTrack.getBoundingClientRect();
      let closestIndex = 0;
      let closestDistance = Infinity;
      slides.forEach((slide, index) => {
        const rect = slide.getBoundingClientRect();
        const distance = Math.abs(rect.left - trackRect.left);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      heroIndex = closestIndex;
      const collectionId = slides[heroIndex]?.dataset.collection;
      if (collectionId && collectionId !== activeCollectionId) setActiveCollection(collectionId, { focus: false });
      updateHeroDots();
      ticking = false;
    });
  };
  els.heroTrack.addEventListener("scroll", onScroll, { passive: true });
}

function renderHero() {
  if (!els.heroTrack || !els.heroDots) return;
  const orders = getWatchOrders();
  els.heroTrack.innerHTML = "";
  els.heroDots.innerHTML = "";
  orders.forEach((collection, index) => {
    const slide = buildHeroSlide(collection, index);
    els.heroTrack.appendChild(slide);
    const dot = document.createElement("button");
    dot.type = "button";
    dot.dataset.collection = collection.id;
    dot.setAttribute("aria-label", `${collection.title} banner`);
    dot.addEventListener("click", () => { heroIndex = index; goHero(index, true); });
    els.heroDots.appendChild(dot);
  });
  const activeIndex = Math.max(0, orders.findIndex(x => x.id === activeCollectionId));
  heroIndex = activeIndex >= 0 ? activeIndex : 0;
  requestAnimationFrame(() => {
    const slides = Array.from(els.heroTrack.children);
    slides[heroIndex]?.scrollIntoView({ behavior: "auto", inline: "start", block: "nearest" });
    updateHeroDots();
    restartHeroTimer();
  });
}

function renderCategoryCards() {
  if (!els.categoryCards) return;
  els.categoryCards.innerHTML = "";
  getWatchOrders().forEach((collection, index) => {
    const match = collectionPrimaryMatch(collection);
    const video = match && match.video;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "category-card";
    card.dataset.collection = collection.id;
    card.innerHTML = `
      <div class="category-card-media"><img alt="${escapeHtml(collection.title)} image" /></div>
      <div class="category-card-body">
        <p>${escapeHtml(collection.eyebrow || "Collection")}</p>
        <h3>${escapeHtml(collection.title)}</h3>
        <span>${escapeHtml(collection.description || "Curated watch list")}</span>
        <strong>${collectionMatches(collection).length} titles</strong>
      </div>`;
    const img = card.querySelector("img");
    if (video) bindPosterFast(img, video, index === 0); else img.src = fallbackPoster(collection.title);
    card.addEventListener("click", () => setActiveCollection(collection.id, { focus: true }));
    els.categoryCards.appendChild(card);
  });
}

function setActiveCollection(id, { focus = false } = {}) {
  const exists = (window.THIRAI_X_WATCH_ORDERS || []).some(x => x.id === id);
  activeCollectionId = exists ? id : "doomsday";
  syncCollectionSelectors();
  render();
  if (focus) {
    const section = els.collections.find(x => x.dataset.collection === activeCollectionId);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function render() {
  const orders = window.THIRAI_X_WATCH_ORDERS || [];
  renderHero();
  renderCategoryCards();
  let totalVisible = 0;
  els.collections.forEach(section => {
    const isActive = section.dataset.collection === activeCollectionId;
    section.classList.toggle("hidden", !isActive);
    if (!isActive) return;
    const collection = orders.find(x => x.id === section.dataset.collection);
    if (!collection) return;
    const eyebrowNode = section.querySelector("[data-role=collection-eyebrow]");
    const titleNode = section.querySelector("[data-role=collection-title]");
    const descNode = section.querySelector("[data-role=collection-description]");
    if (eyebrowNode) eyebrowNode.textContent = collection.eyebrow || "COLLECTION";
    if (titleNode) titleNode.textContent = collection.title || "Collection";
    if (descNode) descNode.textContent = collection.presentation || collection.description || "";
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
  syncCollectionSelectors();
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
      <p>Next in this collection</p>
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
  if (els.quality) els.quality.textContent = currentQualitySelection || "Auto";
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
  const muted = els.video.muted || els.video.volume === 0;
  els.mute.textContent = muted ? "🔇" : (els.video.volume < 0.5 ? "🔉" : "🔊");
  if (els.volume && document.activeElement !== els.volume) els.volume.value = muted ? "0" : String(els.video.volume);
  const duration = Number.isFinite(els.video.duration) ? els.video.duration : 0;
  const current = Number.isFinite(els.video.currentTime) ? els.video.currentTime : 0;
  const progress = duration ? (current / duration) * 100 : 0;
  els.seek.value = String(progress);
  els.seek.style.setProperty("--seek-progress", `${Math.max(0, Math.min(100, progress))}%`);
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
    const state = { ...(history.state || {}), thiraixPlayer: true, videoId: String(v.id) };
    const playerAlreadyOpen = !els.modal.classList.contains("hidden") || history.state?.thiraixPlayer;
    if (playerAlreadyOpen) history.replaceState(state, "", url);
    else history.pushState(state, "", url);
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
  currentQualitySelection = "Auto";
  els.video.src = sources[0]?.src || v.videoUrl;
  els.video.playbackRate = 1;
  els.modal.classList.remove("hidden");
  document.body.classList.add("player-open");
  const resumeKey = `thiraix:resume:${v.id || watchKey(v.title || "movie")}`;
  const savedTime = Number(localStorage.getItem(resumeKey) || 0);
  if (savedTime > 5) {
    const restoreResume = () => {
      if (Number.isFinite(els.video.duration) && savedTime < els.video.duration - 20) els.video.currentTime = savedTime;
      els.video.removeEventListener("loadedmetadata", restoreResume);
    };
    els.video.addEventListener("loadedmetadata", restoreResume);
  }

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

function closePlayerInternal() {
  persistPlaybackPosition();
  hideVideoLoader();
  closePlayerMenu();
  currentVideo = null;
  els.video.pause();
  els.video.removeAttribute("src");
  clearExternalTracks();
  els.video.load();
  els.modal.classList.add("hidden");
  document.body.classList.remove("player-open");
  clearTimeout(controlsTimer);
}

function closePlayer() {
  if (closingPlayerFromHistory) {
    closePlayerInternal();
    return;
  }

  // When the player was opened from a collection page, Back should return
  // to that page instead of navigating out of thiraiX.
  if (history.state?.thiraixPlayer) {
    history.back();
    return;
  }

  // Safety fallback for unusual/direct navigation states. Keep the user
  // inside thiraiX and remove only the player query parameter.
  const url = new URL(window.location.href);
  url.searchParams.delete("video");
  history.replaceState({ ...(history.state || {}), thiraixPlayer: false }, "", url);
  closePlayerInternal();
}

function playbackStorageKey() {
  if (!currentVideo) return "";
  return `thiraix:resume:${currentVideo.id || watchKey(currentVideo.title || "movie")}`;
}

function persistPlaybackPosition() {
  const key = playbackStorageKey();
  if (!key || !Number.isFinite(els.video.currentTime)) return;
  if (els.video.ended || (Number.isFinite(els.video.duration) && els.video.duration - els.video.currentTime < 15)) localStorage.removeItem(key);
  else if (els.video.currentTime > 3) localStorage.setItem(key, String(els.video.currentTime));
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

  if (kind === "settings") {
    els.playerMenuTitle.textContent = "Settings";
    const currentQuality = els.quality?.textContent || currentQualitySelection || "Auto";
    const speedLabel = `${els.video.playbackRate || 1}×`;
    els.playerMenuOptions.appendChild(menuOption("Playback speed", speedLabel, false, () => openPlayerMenu("speed")));
    els.playerMenuOptions.appendChild(menuOption("Quality", currentQuality, false, () => openPlayerMenu("quality")));
    const tracks = Array.from(els.video.textTracks || []);
    const activeSub = tracks.find(t => t.mode === "showing");
    els.playerMenuOptions.appendChild(menuOption("Subtitles", activeSub ? (activeSub.label || activeSub.language || "On") : "Off", false, () => openPlayerMenu("subtitle")));
    const audioTracks = els.video.audioTracks;
    if (audioTracks && typeof audioTracks.length === "number" && audioTracks.length > 1) {
      els.playerMenuOptions.appendChild(menuOption("Audio track", els.audio?.textContent || "Audio", false, () => openPlayerMenu("audio")));
    }
    return;
  }

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
      els.playerMenuOptions.appendChild(menuOption("Auto", "Best available quality", currentQualitySelection === "Auto", () => {
        currentQualitySelection = "Auto";
        setVideoSource((sources[0] && sources[0].src) || (currentVideo && currentVideo.videoUrl) || "", true);
        closePlayerMenu();
      }));
      sources.forEach((source, idx) => {
        const active = els.video.currentSrc === new URL(source.src, window.location.href).href || (!els.video.currentSrc && idx === 0);
        els.playerMenuOptions.appendChild(menuOption(source.label || qualityLabel(source.height), source.height ? `${source.height}p source` : "", active, () => {
          currentQualitySelection = source.label || qualityLabel(source.height);
          els.quality.textContent = currentQualitySelection;
          setVideoSource(source.src, true);
          closePlayerMenu();
        }));
      });
    } else {
      const detail = els.video.videoWidth && els.video.videoHeight ? `${els.video.videoWidth} × ${els.video.videoHeight}` : "Best available quality";
      els.playerMenuOptions.appendChild(menuOption("Auto", detail, true, () => {}, true));
    }
  }
}

function closePlayerMenu() {
  currentMenu = "";
  if (els.playerMenu) els.playerMenu.classList.add("hidden");
  showControls();
}

async function loadVideos() {
  const availableCollections = window.THIRAI_X_WATCH_ORDERS || [];
  if (!availableCollections.some(x => x.id === activeCollectionId)) activeCollectionId = "doomsday";
  if (els.collections.length === 1 && document.body.classList.contains("collection-page")) {
    els.collections[0].dataset.collection = activeCollectionId;
  }
  try {
    if (!API_URL) {
      videos = STATIC_DIRECT_MOVIES.map(normalizeVideo);
      render();
      return;
    }
    const r = await fetch(API_URL, { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`API ${r.status}`);
    const data = await r.json();
    const incoming = Array.isArray(data) ? data : (data.videos || []);
    const apiMovies = incoming.filter(isMovieRecord).map(normalizeVideo);
    const existingKeys = new Set(apiMovies.map(v => watchKey(v.title)));
    const directOnly = STATIC_DIRECT_MOVIES.map(normalizeVideo).filter(v => !existingKeys.has(watchKey(v.title)));
    videos = [...apiMovies, ...directOnly];
    render();
  } catch (err) {
    console.error("thiraiX API error:", err);
    videos = STATIC_DIRECT_MOVIES.map(normalizeVideo);
    render();
  } finally {
    hideSiteLoader();
    const sharedId = new URLSearchParams(window.location.search).get("video");
    if (sharedId && els.modal.classList.contains("hidden")) {
      const sharedVideo = videos.find(v => String(v.id) === String(sharedId));
      if (sharedVideo && (sharedVideo.videoUrl || normalizeSources(sharedVideo).length)) {
        // A directly opened shared player URL gets a safe collection-page
        // history entry beneath it. Android/browser Back will therefore
        // close the player and remain on this site.
        const playerUrl = new URL(window.location.href);
        const baseUrl = new URL(window.location.href);
        baseUrl.searchParams.delete("video");
        history.replaceState({ ...(history.state || {}), thiraixPlayer: false }, "", baseUrl);
        history.pushState({ thiraixPlayer: true, videoId: String(sharedId) }, "", playerUrl);
        openPlayer(sharedVideo, { skipHistory: true });
      }
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
if (els.heroPrev) els.heroPrev.addEventListener("click", () => goHero(heroIndex - 1, true));
if (els.heroNext) els.heroNext.addEventListener("click", () => goHero(heroIndex + 1, true));
setupHeroScrollSync();
if (els.heroTrack) {
  els.heroTrack.addEventListener("pointerdown", restartHeroTimer, { passive: true });
  els.heroTrack.addEventListener("mouseenter", () => clearInterval(heroTimer));
  els.heroTrack.addEventListener("mouseleave", restartHeroTimer);
}
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

let lastTapAt = 0;
let lastTapZone = "";

els.stage.addEventListener("pointerup", (event) => {
  if (playerPointerMoved) return;
  const target = event.target;
  if (target.closest("button, input, .custom-controls, .player-menu, .player-inline-ad")) return;

  const rect = els.stage.getBoundingClientRect();
  const ratio = rect.width ? (event.clientX - rect.left) / rect.width : .5;
  const zone = ratio < .34 ? "left" : (ratio > .66 ? "right" : "center");
  const now = Date.now();
  const isDouble = now - lastTapAt < 330 && zone === lastTapZone;
  lastTapAt = now;
  lastTapZone = zone;

  if (isDouble) {
    lastTapAt = 0;
    runDoubleTapAction(zone);
    return;
  }

  if (event.pointerType === "touch" || event.pointerType === "pen") {
    const isHidden = els.controls.classList.contains("fade");
    if (isHidden) showControls();
    else if (!els.video.paused) {
      clearTimeout(controlsTimer);
      els.controls.classList.add("fade");
    }
  } else {
    togglePlayback();
    showControls();
  }
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
els.video.addEventListener("pause", () => { persistPlaybackPosition(); updatePlayerUI(); });
els.video.addEventListener("ended", () => { persistPlaybackPosition(); updatePlayerUI(); });
let lastResumeSave = 0;
els.video.addEventListener("timeupdate", () => {
  updatePlayerUI();
  const now = Date.now();
  if (now - lastResumeSave > 5000) { lastResumeSave = now; persistPlaybackPosition(); }
});
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
if (els.seekWrap && els.seekTooltip) {
  const updateSeekTooltip = (event) => {
    const rect = els.seek.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)));
    const preview = (Number.isFinite(els.video.duration) ? els.video.duration : 0) * ratio;
    els.seekTooltip.textContent = formatTime(preview);
    els.seekTooltip.style.left = `${ratio * 100}%`;
  };
  els.seek.addEventListener("pointermove", updateSeekTooltip);
  els.seek.addEventListener("pointerenter", (event) => { updateSeekTooltip(event); els.seekTooltip.classList.add("show"); });
  els.seek.addEventListener("pointerleave", () => els.seekTooltip.classList.remove("show"));
}
els.back10.addEventListener("click", () => { els.video.currentTime = Math.max(0, els.video.currentTime - 10); showControls(); });
els.forward10.addEventListener("click", () => { els.video.currentTime = Math.min(els.video.duration || Infinity, els.video.currentTime + 10); showControls(); });
els.mute.addEventListener("click", () => {
  if (els.video.muted || els.video.volume === 0) {
    els.video.muted = false;
    if (els.video.volume === 0) els.video.volume = 1;
  } else els.video.muted = true;
  showControls();
});
if (els.volume) els.volume.addEventListener("input", () => {
  els.video.muted = false;
  els.video.volume = Math.max(0, Math.min(1, Number(els.volume.value)));
  showControls();
});
if (els.settings) els.settings.addEventListener("click", () => openPlayerMenu("settings"));
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

window.addEventListener("popstate", () => {
  if (!els.modal) return;
  const url = new URL(window.location.href);
  const videoId = url.searchParams.get("video");

  if (!videoId) {
    if (!els.modal.classList.contains("hidden")) {
      closingPlayerFromHistory = true;
      closePlayerInternal();
      closingPlayerFromHistory = false;
    }
    return;
  }

  // Supports browser Forward after the player was closed.
  const video = videos.find(v => String(v.id) === String(videoId));
  if (video && (els.modal.classList.contains("hidden") || String(currentVideo?.id) !== String(videoId))) {
    openPlayer(video, { skipHistory: true });
  }
});

document.addEventListener("keydown", e => {
  if (els.modal.classList.contains("hidden")) return;
  const tag = (e.target && e.target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return;
  const key = e.key.toLowerCase();
  if (e.key === "Escape") { if (!els.playerMenu.classList.contains("hidden")) closePlayerMenu(); else closePlayer(); return; }
  if (e.key === " " || key === "k") { e.preventDefault(); togglePlayback(); return; }
  if (key === "j") { els.video.currentTime = Math.max(0, els.video.currentTime - 10); flashGesture(els.gestureBackFeedback, "↶ 10s"); return; }
  if (key === "l") { els.video.currentTime = Math.min(els.video.duration || Infinity, els.video.currentTime + 10); flashGesture(els.gestureForwardFeedback, "10s ↷"); return; }
  if (e.key === "ArrowLeft") { e.preventDefault(); els.video.currentTime = Math.max(0, els.video.currentTime - 5); return; }
  if (e.key === "ArrowRight") { e.preventDefault(); els.video.currentTime = Math.min(els.video.duration || Infinity, els.video.currentTime + 5); return; }
  if (e.key === "ArrowUp") { e.preventDefault(); els.video.muted = false; els.video.volume = Math.min(1, els.video.volume + 0.05); return; }
  if (e.key === "ArrowDown") { e.preventDefault(); els.video.volume = Math.max(0, els.video.volume - 0.05); return; }
  if (key === "m") { els.video.muted = !els.video.muted; return; }
  if (key === "f") { els.fullscreen.click(); return; }
  if (key === "c") { els.subtitle.click(); return; }
});

loadVideos();
