<br>

<p align="center">
  <strong style="font-size:22px">🚧 Development in progress — full release coming soon🚧</strong>
  <br/>
  <em style="display:inline-block;margin-top:6px;color:#888">This project is under active development. Expect frequent updates and improvements.</em>
</p>


<br>
<br>
<br>

---

# GeoSphere Challenge

An immersive, futuristic geography guessing game built with Google Street View and Maps.

## Quick status

- Status: Active development (WIP)
- Planned release: Upcoming (subscribe / watch the repo for updates)

## What changed (this README)

This README was rewritten to include the current file structure, setup instructions, and developer notes. It also adds a friendly development banner at the top to let visitors know the project is not yet a polished public release.

## Project overview

GeoSphere Challenge drops players into a random Google Street View location somewhere on Earth. Players must guess the location on an interactive world map. Rounds are scored by geographic distance (Haversine) and time-based bonuses. The UI uses a neon-glass aesthetic with animated reveal effects.

## Repository structure

Top-level files:

- `index.html` — main app HTML (loads Street View and map panes)
- `style.css` — global styles and neon/aurora theming
- `script.js` — game logic, scoring, and UI glue code
- `mapHandler.js` — map initialization and guess handling
- `streetviewHandler.js` — Street View loading and camera control
- `config.js` — add your Google Maps API key here (not committed)
- `README.md` — this file

Assets folder:

- `assets/`
  - `bg/` — background images and videos (aurora, stars, etc.)
    - `aurora.png` (or `aurora.mp4` if using video background)
    - `stars.png`
  - `icons/` — map pins and UI icons
    - `pin-actual.png`
    - `pin-guess.png`
    - `neon-globe.svg` (optional)
  - `sounds/` — short sound effects
    - `correct.mp3`
    - `wrong.mp3`

## Features

- Random global Street View location selection with graceful retry if imagery isn't available
- Dual pane UI: a Street View pane and an interactive world map for guessing
- Scoring uses Haversine distance and a time bonus for faster guesses
- Neon-glass UI with aurora/stars background and subtle particle effects
- Animated reveal sequence: pins, amber beam, and auto-zoom to the correct location
- 5-round game with summary and share options

## Setup (developer)

1. Create a Google Cloud project and enable the following APIs:
   - Maps JavaScript API
   - Street View Static/Service (if applicable)

2. Add your API key to `config.js` in the project root. Example `config.js`:

```js
// config.js (do not commit your real key)
const CONFIG = {
  GOOGLE_MAPS_API_KEY: 'YOUR_API_KEY_HERE'
};

export default CONFIG;
```

3. Run a local static server to serve the files. Example (requires Node.js):

```powershell
npx serve .
```

Open the printed URL in your browser (commonly http://localhost:3000).

Notes on security: restrict your API key to the specific domain(s) or local development origin in the Google Cloud Console.

## Local development tips

- Use the browser devtools to inspect console logs for Street View load errors (imagery missing, quota issues).
- If Street View imagery isn't available for a selected location the game retries with a new random point.
- To speed up styling edits, use a live-reload server or browser extension.

## Deployment

- This project is suitable for static hosting (GitHub Pages, Netlify, Vercel). Ensure your API key restrictions allow the hosted domain.
- For GitHub Pages: push to the `main` branch and enable Pages in repository settings.

## Contributing

- Issues and pull requests are welcome. Label changes or big UI rewrites as "WIP" until stable.
- Please do not commit API keys. Use `config.js` locally and add a note in `.gitignore` if you create a file with secrets.

## File checklist (recommended additions)

- Add or confirm these assets exist in `assets/`:
  - `assets/icons/pin-guess.png`
  - `assets/icons/pin-actual.png`
  - `assets/icons/neon-globe.svg`
  - `assets/bg/aurora.mp4` or `assets/bg/aurora.png`
  - `assets/bg/stars.webp` or `assets/bg/stars.png`
  - `assets/sounds/correct.mp3`
  - `assets/sounds/wrong.mp3`

## Notes for maintainers

- Movement in Street View is disabled by default for fairness (`clickToGo=false` and `linksControl=false`), so tests and UI rely on the fixed camera.
- Scoring thresholds live in `script.js` — tweak to balance difficulty and scoring fairness.

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

© 2025 Prince Raj Singh (Group Carnage Sentinels) · SPDX: MIT

This project is released under the MIT License. 
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---
