# GeoSphere Challenge

An immersive, futuristic geography guessing game powered by Google Street View and Maps.

## Features
- Random global Street View selection with graceful retry
- Dual-pane layout: Street View and interactive world map
- Scoring via Haversine distance and time bonus
- Neon-glass UI with aurora background and particle effects
- Animated reveal: pins + amber beam + auto-zoom
- 5-round game with summary and share

## Tech Stack
- HTML5, CSS3, Vanilla JS
- Google Maps JavaScript API + Street View Service
- Hosting: GitHub Pages

## Setup
1. Create a Google Cloud project and enable Maps JavaScript API + Street View.
2. Add your API key to `config.js`. Restrict by HTTP referrer for security.
3. Serve the folder locally or push to GitHub Pages.

## Local Development
Use any static server. Example:

```bash
npx serve .
```

Then open http://localhost:3000 (or the printed URL).

## Deployment (GitHub Pages)
- Commit and push this repository.
- In repo settings, enable GitHub Pages for the `main` branch `/root`.

## Assets
Place generated assets:
- assets/icons/pin-guess.png
- assets/icons/pin-actual.png
- assets/icons/neon-globe.svg
- assets/bg/aurora.mp4
- assets/bg/stars.webp
- assets/sounds/correct.mp3
- assets/sounds/wrong.mp3

## Notes
- Movement in Street View is disabled for fairness (clickToGo=false, links hidden).
- Timer auto-submits if no guess.
- Fine-tune scoring thresholds in `script.js` if desired.

## License
MIT