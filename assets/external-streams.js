// thiraiX external stream overrides
//
// Use ONLY direct media URLs that you are authorized to stream.
// Supported by the existing custom player:
//   - direct MP4/WebM URLs the browser can decode
//   - multiple quality sources via { sources: [...] }
//   - external subtitle tracks via { subtitles: [...] }
//
// IMPORTANT: Do not put a normal webpage/embedded player URL here.
// A direct <video> source prevents third-party page scripts/popups from loading,
// while keeping your own site ad system in assets/ads.js unchanged.

window.THIRAI_X_STREAM_OVERRIDES = {
  // Paste authorized direct media URLs below. Title matching is automatic.
  // "x men": "https://dub.onestream.today/stream/video/39664",
  // "x2 x men united": "https://dub.onestream.today/stream/video/60633",
  // "captain america the first avenger": "https://dub.onestream.today/stream/video/38091",
  // "the avengers": "https://dub.onestream.today/stream/video/47249",
  // "avengers infinity war": "https://dub.onestream.today/stream/video/56829",
  // "avengers endgame": "https://dub.onestream.today/stream/video/60627"
};
