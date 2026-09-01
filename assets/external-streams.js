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
  // "x men": "https://cdn.example.com/x-men.mp4",
  // "x2 x men united": "https://cdn.example.com/x-men-2.mp4",
  // "captain america the first avenger": "https://cdn.example.com/captain-america.mp4",
  // "the avengers": "https://cdn.example.com/the-avengers.mp4",
  // "avengers infinity war": "https://cdn.example.com/infinity-war.mp4",
  // "avengers endgame": "https://cdn.example.com/endgame.mp4"
};
