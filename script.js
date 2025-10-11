let rounds = 5;
let currentRound = 0;
let totalScore = 0;
let roundData = [];
let timerInterval = null;
let timeLeft = 60;
let isGoogleMapsLoaded = false;

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreFromDistance(km) {
  if (km < 100) return 1000;
  if (km < 500) return 850;
  if (km < 1000) return 700;
  if (km < 3000) return 500;
  if (km < 7000) return 300;
  return 100;
}

function timeBonus(seconds) {
  if (seconds >= 45) return 100;
  if (seconds >= 30) return 60;
  if (seconds >= 15) return 30;
  return 0;
}

function updateHeader() {
  document.getElementById('current-round').textContent = `${currentRound}/${rounds}`;
  document.getElementById('current-score').textContent = `${totalScore}`;
}

function setLoading(state) {
  document.getElementById('loading-screen').classList.toggle('hidden', !state);
}

function startTimer() {
  timeLeft = 60;
  document.getElementById('timer').textContent = `${timeLeft}s`;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft -= 1;
    document.getElementById('timer').textContent = `${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      autoSubmit();
    }
  }, 1000);
}

function autoSubmit() {
  const guess = window.getGuessLatLng ? window.getGuessLatLng() : null;
  if (!guess && window.placeGuess) {
    window.placeGuess(new google.maps.LatLng(0, 0));
  }
  const submitBtn = document.getElementById('submit-guess');
  if (submitBtn && !submitBtn.disabled) {
    submitBtn.click();
  }
}

async function startRound() {
  if (!isGoogleMapsLoaded) {
    console.error('Google Maps not loaded yet');
    return;
  }
  
  currentRound += 1;
  updateHeader();
  setLoading(true);
  
  if (window.clearRound) {
    window.clearRound();
  }
  
  try {
    const latLng = await window.loadRandomPano();
    setLoading(false);
    startTimer();
  } catch (error) {
    console.error('Error loading panorama:', error);
    setLoading(false);
  }
}

function endRound(distanceKm, points) {
  totalScore += points;
  updateHeader();
  document.getElementById('result-distance').textContent = `${distanceKm.toFixed(1)} km`;
  document.getElementById('result-points').textContent = `${points}`;
  document.getElementById('round-result').classList.remove('hidden');
  document.getElementById('next-round').classList.remove('hidden');
}

function finalizeGame() {
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('summary-screen').classList.remove('hidden');
  document.getElementById('final-score').textContent = totalScore;
  const rank = totalScore >= 3500 ? 'Globetrotter' : totalScore >= 2200 ? 'Traveler' : 'Wanderer';
  document.getElementById('player-rank').textContent = `Rank: ${rank}`;
  
  // Create simple chart
  const chart = document.getElementById('rounds-chart');
  chart.innerHTML = '';
  roundData.forEach((r, i) => {
    const bar = document.createElement('div');
    bar.style.cssText = `
      height: ${Math.min(100, Math.max(10, 100 - r.distance / 100))}px;
      width: 40px;
      margin: 0 4px;
      background: linear-gradient(180deg, rgba(255,191,0,0.8), rgba(255,191,0,0.2));
      border-radius: 4px 4px 0 0;
      position: relative;
    `;
    bar.title = `Round ${i + 1}: ${r.distance.toFixed(0)} km / ${r.points} pts`;
    chart.appendChild(bar);
  });
}

function attachUI() {
  const startBtn = document.getElementById('start-btn');
  startBtn.addEventListener('click', () => {
    if (!isGoogleMapsLoaded) {
      alert('Please wait for Google Maps to load...');
      return;
    }
    // Prevent double clicks
    startBtn.disabled = true;
    document.getElementById('intro-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    startRound();
  });

  document.getElementById('submit-guess').addEventListener('click', () => {
    clearInterval(timerInterval);
    const actual = window.getCurrentPanoLatLng ? window.getCurrentPanoLatLng() : null;
    const guess = window.getGuessLatLng ? window.getGuessLatLng() : null;
    
    if (!guess || !actual) {
      console.error('Missing guess or actual location');
      return;
    }
    
    if (window.revealActual) {
      window.revealActual(actual);
    }
    
    const distance = calculateDistance(guess.lat(), guess.lng(), actual.lat(), actual.lng());
    const points = scoreFromDistance(distance) + timeBonus(timeLeft);
    roundData.push({ distance, points, actual: actual.toJSON(), guess: guess.toJSON() });
    endRound(distance, points);
    
    // Play sound feedback
    playSound(points >= 700 ? 'correct' : 'wrong');
  });

  document.getElementById('next-round').addEventListener('click', () => {
    document.getElementById('round-result').classList.add('hidden');
    document.getElementById('next-round').classList.add('hidden');
    if (currentRound >= rounds) {
      finalizeGame();
    } else {
      startRound();
    }
  });

  // 'Continue' button inside round-result modal (some markup uses a different id)
  const nextAfter = document.getElementById('next-after-result');
  if (nextAfter) {
    nextAfter.addEventListener('click', () => {
      // Reuse next-round handler behavior
      document.getElementById('round-result').classList.add('hidden');
      document.getElementById('next-round').classList.add('hidden');
      if (currentRound >= rounds) {
        finalizeGame();
      } else {
        startRound();
      }
    });
  }

  document.getElementById('play-again').addEventListener('click', () => {
    currentRound = 0;
    totalScore = 0;
    roundData = [];
    updateHeader();
    document.getElementById('summary-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    startRound();
  });

  document.getElementById('share-score').addEventListener('click', async () => {
    const text = `GeoSphere Challenge: Scored ${totalScore} in ${rounds} rounds! 🌍✨`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'GeoSphere Challenge', text, url: location.href });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Score copied to clipboard!');
    }
  });

  document.getElementById('skip-round').addEventListener('click', () => {
    if (window.placeGuess) {
      window.placeGuess(new google.maps.LatLng(0, 0));
    }
    document.getElementById('submit-guess').click();
  });

  // Watch for a placed guess (if mapHandler exposes getGuessLatLng)
  // Enables submit button when a guess is available and disables it after submit to avoid duplicates
  let lastGuessKey = null;
  const submitBtn = document.getElementById('submit-guess');
  const guessIndicator = document.getElementById('guess-indicator');

  setInterval(() => {
    try {
      if (typeof window.getGuessLatLng === 'function') {
        const g = window.getGuessLatLng();
        if (g && typeof g.lat === 'function' && typeof g.lng === 'function') {
          const key = `${g.lat().toFixed(6)},${g.lng().toFixed(6)}`;
          if (key !== lastGuessKey) {
            lastGuessKey = key;
            // enable submit
            if (submitBtn) submitBtn.disabled = false;
            if (guessIndicator) guessIndicator.style.opacity = '1';
          }
        } else {
          // no guess placed
          if (submitBtn) submitBtn.disabled = true;
          if (guessIndicator) guessIndicator.style.opacity = '0.7';
          lastGuessKey = null;
        }
      }
    } catch (e) {
      // ignore
    }
  }, 350);
}

function playSound(type) {
  try {
    const el = new Audio(type === 'correct' ? 'assets/sounds/correct.mp3' : 'assets/sounds/wrong.mp3');
    el.volume = 0.35;
    el.play().catch(e => console.log('Audio play failed:', e));
  } catch (error) {
    console.log('Audio not available:', error);
  }
}

// This function will be called by Google Maps API
function initApp() {
  console.log('Initializing GeoSphere Challenge...');
  
  try {
    if (typeof google === 'undefined') {
      console.error('Google Maps API not loaded');
      return;
    }
    
    // Initialize components
    if (window.initStreetView) {
      window.initStreetView('streetview');
    }
    
    if (window.initMap) {
      window.initMap('map');
    }
    
    isGoogleMapsLoaded = true;
    attachUI();
    console.log('GeoSphere Challenge initialized successfully!');
    
  } catch (error) {
    console.error('Error initializing app:', error);
  }
}

// Make initApp globally available
window.initApp = initApp;