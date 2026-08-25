const API_URL = (window.MILES_CONFIG && window.MILES_CONFIG.API_URL) || "";
const params = new URLSearchParams(window.location.search);
const videoId = params.get("video");

function loadAdFrame(frame, src) {
  if (!frame || frame.dataset.loaded === "1" || !src) return;
  frame.src = src;
  frame.dataset.loaded = "1";
}
function loadResponsiveAd(frame) {
  if (!frame || frame.dataset.loaded === "1") return;
  const desktop = window.matchMedia("(min-width: 761px)").matches;
  loadAdFrame(frame, desktop ? frame.dataset.desktopSrc : frame.dataset.mobileSrc);
}
function initAds() {
  loadResponsiveAd(document.querySelector("#downloadTopAd"));
  loadResponsiveAd(document.querySelector("#downloadBottomAd"));
  ["#downloadSquareAd", "#downloadNativeAd"].forEach(sel => {
    const el = document.querySelector(sel); loadAdFrame(el, el?.dataset.src);
  });
  if (window.matchMedia("(min-width: 1180px)").matches) {
    ["#downloadTallAd", "#downloadMediumAd"].forEach(sel => {
      const el = document.querySelector(sel); loadAdFrame(el, el?.dataset.src);
    });
  }
}

function safeFilename(title = "video") {
  return String(title).replace(/[\\/:*?"<>|]+/g, "-").trim() || "video";
}

async function getVideo() {
  if (!videoId || !API_URL) return null;
  const r = await fetch(API_URL, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`API ${r.status}`);
  const data = await r.json();
  const list = Array.isArray(data) ? data : (data.videos || []);
  return list.find(v => String(v.id) === String(videoId)) || null;
}

function startCountdown(video) {
  const number = document.querySelector("#countdownNumber");
  const message = document.querySelector("#countdownMessage");
  const button = document.querySelector("#finalDownload");
  let remaining = 30;
  number.textContent = remaining;

  const tick = setInterval(() => {
    remaining -= 1;
    number.textContent = Math.max(0, remaining);
    if (remaining <= 0) {
      clearInterval(tick);
      message.textContent = "Your download is ready.";
      button.href = video.videoUrl;
      button.setAttribute("download", safeFilename(video.title));
      button.classList.remove("hidden");
      document.querySelector("#countdownRing")?.classList.add("ready");
    }
  }, 1000);
}

async function init() {
  initAds();
  const title = document.querySelector("#downloadTitle");
  const meta = document.querySelector("#downloadMeta");
  const message = document.querySelector("#countdownMessage");
  try {
    const video = await getVideo();
    if (!video || !video.videoUrl) throw new Error("Video unavailable");
    title.textContent = video.title || "Prepare download";
    meta.textContent = [video.type, video.episode, video.date].filter(Boolean).join(" · ") || "Video download";
    startCountdown(video);
  } catch (err) {
    console.error(err);
    title.textContent = "Download unavailable";
    meta.textContent = "This video could not be loaded. Return to thiraiX and try again.";
    message.textContent = "No download link is available.";
    document.querySelector("#countdownRing")?.classList.add("hidden");
  }
}

init();
