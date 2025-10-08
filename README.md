# World Explorer Quiz

Interactive Street View guessing game inspired by GeoGuessr. Built with Google Maps JavaScript API and Street View Service.

Setup
1. Copy `config.js` and add your Google Maps API key: `const GOOGLE_MAPS_API_KEY = 'YOUR_KEY';`
2. Ensure the following APIs are enabled in Google Cloud Console: `Maps JavaScript API` and `Street View API/Service`.
3. Run locally or deploy to GitHub Pages.

Running locally (recommended)
1. Install a simple static server (the start script uses `http-server`):

```powershell
npx http-server -c-1 -p 8080
```

2. Open http://localhost:8080 in your browser.

Notes on the API key
- Keep your API key restricted to the domains where you'll deploy (e.g., GitHub Pages origin).
- If you open `index.html` with `file://` you may find Maps does not load reliably — use the static server above.

Notes
- This is a static client-side app. Keep your API key restricted in the Google Console.
- Add your pin icons to `assets/icons/` or use the provided sample images.

Deployment

Automatic deploy with GitHub Actions

1. Push this repository to GitHub (to the `main` branch).
2. The included GitHub Actions workflow (.github/workflows/gh-pages.yml) will automatically publish the repository root to the `gh-pages` branch on every push to `main`.
3. Wait a minute for the action to finish, then enable GitHub Pages in the repository settings (select the `gh-pages` branch and `/ (root)` folder).
 Add MAPS_API_KEY secret (for secure deploy)
 1. Go to your repository on GitHub → Settings → Secrets and variables → Actions → New repository secret
 2. Name the secret: MAPS_API_KEY
 3. Paste your Google Maps API key into the Value field and Save
 4. Push any commit to `main` — the workflow will pick up the secret, write `config.js`, and deploy to `gh-pages`.

 Verify deployment
 1. After the workflow finishes, open the workflow run logs and look for the "Deployment info" step — it will print the URL.
 2. Or open: https://<your-github-username>.github.io/<repo>/ and verify the site loads and the map/streetview render.

Manual quick deploy

