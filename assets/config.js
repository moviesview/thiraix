window.MILES_CONFIG = {
  API_URL: "https://thiraix-api.anyaclaire0.workers.dev/videos",
  SITE_NAME: "thiraiX",
  DEMO_MODE: false,
  // Optional global views endpoint. If empty/unavailable, the site falls back to device-local counts.
  // Expected API: GET ?video=<id> -> {views:number}; POST {video:<id>} -> {views:number}
  VIEWS_API_URL: ""
};
