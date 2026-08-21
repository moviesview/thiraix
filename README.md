# thiraiX - GitHub Pages Frontend

This folder is ready to upload directly to a GitHub repository.

## Files

- `index.html` - main website entry point
- `assets/style.css` - customized thiraiX neon theme
- `assets/app.js` - catalog, search and player logic
- `assets/config.js` - API URL configuration
- `assets/thiraix-logo.png` - provided logo asset

## Publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload the **contents** of this folder to the repository root.
3. Make sure `index.html` is at the repository root.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select `main` and `/ (root)`.
7. Save.

Your site will be available at:

`https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`

## Current mode

The frontend starts in **demo mode** because the Google Drive + Cloudflare Worker API has not been connected yet.

Edit `assets/config.js` and set:

```js
window.MILES_CONFIG = {
  API_URL: "https://YOUR-WORKER.workers.dev/videos",
  SITE_NAME: "thiraiX",
  DEMO_MODE: false
};
```

## Important

Do not upload your video files to GitHub.

GitHub Pages should host only the frontend. The actual videos should remain in Google Drive and be delivered through the separate API layer.
