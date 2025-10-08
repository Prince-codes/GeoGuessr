/* Core game logic for World Explorer Quiz */
const TOTAL_ROUNDS = 5;

let state = {
  currentRound: 0,
  totalScore: 0,
  rounds: [], // {actual:{lat,lng}, guess:{lat,lng}, distance, points}
  currentActual: null,
  currentGuess: null,
};

const dom = {
  playBtn: document.getElementById('playBtn'),
  restartBtn: document.getElementById('restartBtn'),
  submitBtn: document.getElementById('submitBtn'),
  nextBtn: document.getElementById('nextBtn'),
  loading: document.getElementById('loading'),
  roundNum: document.getElementById('roundNum'),
  totalScore: document.getElementById('totalScore'),
  overlay: document.getElementById('overlay'),
  summary: document.getElementById('summary'),
  summaryTitle: document.getElementById('summaryTitle'),
  summaryContent: document.getElementById('summaryContent'),
  closeSummary: document.getElementById('closeSummary')
};

function resetGame(){
  state.currentRound = 0;
  state.totalScore = 0;
  state.rounds = [];
  dom.totalScore.textContent = '0';
  dom.roundNum.textContent = '0';
  dom.restartBtn.hidden = true;
}

function startGame(){
  // Validate Maps API availability
  if (!(window.google && window.google.maps && window.google.maps.StreetViewService)){
    const el = document.getElementById('apiHint');
    if (el){
      el.classList.remove('hidden');
      el.textContent = 'Google Maps API or Street View Service is not loaded. Add your API key to config.js and enable Maps JS API in Google Cloud.';
    } else {
      alert('Google Maps JavaScript API or Street View Service is not loaded. Please add your API key to config.js and ensure the Maps JS API is enabled.');
    }
    console.error('Maps or StreetViewService not available:', !!window.google && !!window.google.maps, !!(window.google && window.google.maps && window.google.maps.StreetViewService));
    return;
  }
  resetGame();
  dom.playBtn.hidden = true;
  dom.restartBtn.hidden = false;
  nextRound();
}

function nextRound(){
  state.currentRound += 1;
  dom.roundNum.textContent = state.currentRound;
  dom.submitBtn.disabled = true;
  dom.nextBtn.disabled = true;
  dom.loading.classList.remove('hidden');
  // Clear map markers/lines
  MapHandler.clearRound();
  state.currentActual = null;
  state.currentGuess = null;
  // fetch a valid street view and render with a safety timeout
  let roundTimedOut = false;
  const TIMEOUT = 12000; // 12s
  const timeoutHandle = setTimeout(()=>{
    roundTimedOut = true;
    dom.loading.classList.add('hidden');
    StreetViewHandler.showStreetViewError && StreetViewHandler.showStreetViewError('Took too long to find a panorama. Click the Street View area to retry.');
  }, TIMEOUT);

  const onFound = (latLng, panorama) => {
    if (roundTimedOut) return; // ignore late responses
    clearTimeout(timeoutHandle);
    state.currentActual = { lat: latLng.lat(), lng: latLng.lng() };
    const pano = StreetViewHandler.renderPanorama(document.getElementById('streetview'), panorama);
    // enable map clicking
    MapHandler.enableGuessing(onMapGuess);
    dom.loading.classList.add('hidden');
  };

  StreetViewHandler.getValidStreetViewLocation(onFound);

  // allow clicking the overlay to retry the current round
  const retryHandler = () => {
    if (roundTimedOut) {
      dom.loading.classList.remove('hidden');
      roundTimedOut = false;
      // restart the round fetch
      StreetViewHandler.getValidStreetViewLocation(onFound);
    }
  };
  window.addEventListener('svRetryRequested', retryHandler, { once: true });
}

function onMapGuess(latLng){
  state.currentGuess = { lat: latLng.lat(), lng: latLng.lng() };
  dom.submitBtn.disabled = false;
}

function submitGuess(){
  if (!state.currentGuess || !state.currentActual) return;
  // freeze further guessing
  MapHandler.disableGuessing();
  const d = calculateDistance(state.currentActual.lat, state.currentActual.lng, state.currentGuess.lat, state.currentGuess.lng); // meters
  const pts = pointsForDistance(d);
  state.totalScore += pts;
  state.rounds.push({ actual: state.currentActual, guess: state.currentGuess, distance: d, points: pts });
  dom.totalScore.textContent = state.totalScore;

  // show markers and line
  MapHandler.showActualAndGuess(state.currentActual, state.currentGuess);

  // show summary overlay for this round
  dom.summaryTitle.textContent = `Round ${state.currentRound} Result`;
  const distStr = d < 1000 ? `${Math.round(d)} m` : `${(d/1000).toFixed(2)} km`;
  dom.summaryContent.innerHTML = `<p>Distance: ${distStr}</p><p>Points: ${pts}</p>`;
  dom.overlay.classList.remove('hidden');

  dom.nextBtn.disabled = false;
  dom.submitBtn.disabled = true;
}

function endRoundAndContinue(){
  dom.overlay.classList.add('hidden');
  if (state.currentRound >= TOTAL_ROUNDS){
    showFinalSummary();
  } else {
    nextRound();
  }
}

function showFinalSummary(){
  dom.summaryTitle.textContent = `Game Summary`;
  let html = `<p>Total Score: ${state.totalScore}</p>`;
  html += `<table class="table-summary"><thead><tr><th>Round</th><th>Distance (km)</th><th>Points</th></tr></thead><tbody>`;
  state.rounds.forEach((r,i)=>{
    const km = (r.distance/1000).toFixed(2);
    html += `<tr><td>${i+1}</td><td>${km}</td><td>${r.points}</td></tr>`;
  });
  html += `</tbody></table>`;
  dom.summaryContent.innerHTML = html;
  dom.overlay.classList.remove('hidden');
}

function calculateDistance(lat1, lon1, lat2, lon2){
  // Haversine formula (returns meters)
  const toNum = v => Number(v) || 0;
  lat1 = toNum(lat1); lon1 = toNum(lon1); lat2 = toNum(lat2); lon2 = toNum(lon2);
  const R = 6371e3; // metres
  const toRad = a => a * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const meters = R * c;
  if (!isFinite(meters) || meters < 0) return 0;
  return meters;
}

function pointsForDistance(meters){
  // Scoring tiers (meters)
  // <=100m: 5000
  // <=1000m: 3000
  // <=10000m (10km): 1000
  // <=50000m (50km): 500
  // <=200000m (200km): 250
  // <=500000m (500km): 100
  // >500km: 0
  const m = Math.max(0, Number(meters) || 0);
  if (m <= 100) return 5000;
  if (m <= 1000) return 3000;
  if (m <= 10000) return 1000;
  if (m <= 50000) return 500;
  if (m <= 200000) return 250;
  if (m <= 500000) return 100;
  return 0;
}

// wire up buttons
dom.playBtn.addEventListener('click', ()=>{
  // mark todo in-progress -> complete
  startGame();
  // update todo list: mark current as completed and set next in-progress
});
dom.restartBtn.addEventListener('click', ()=>{ resetGame(); dom.playBtn.hidden=false; dom.restartBtn.hidden=true; });
dom.submitBtn.addEventListener('click', submitGuess);
dom.nextBtn.addEventListener('click', ()=>{ endRoundAndContinue(); });
dom.closeSummary.addEventListener('click', ()=>{ dom.overlay.classList.add('hidden'); });

// Diagnostics: test Maps JS URL and display error information
// Remove diagnostics UI for production. Map overlay will still show if tiles fail to load.

// When overlay is visible during final summary, change Play Again behavior
const observer = new MutationObserver(()=>{
  // if overlay visible and we've finished rounds, show play again button
  const visible = !dom.overlay.classList.contains('hidden');
  if (visible && state.currentRound >= TOTAL_ROUNDS){
    dom.restartBtn.hidden = false;
  }
});
observer.observe(dom.overlay, { attributes: true, attributeFilter: ['class'] });

// Expose for handlers
window.Game = {
  calculateDistance,
  pointsForDistance
};
