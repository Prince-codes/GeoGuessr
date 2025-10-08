/* MapHandler: wraps Google Maps interactions for guessing */
const MapHandler = (function(){
  let map = null;
  let guessMarker = null;
  let actualMarker = null;
  let line = null;
  let clickListener = null;

  function init(){
    // lazy init when google maps is available
    const wait = () => {
      // if the Maps script previously errored (captured by loader), surface it immediately
      if (window.__mapsScriptError){
        const msg = (window.__mapsScriptError && (window.__mapsScriptError.message || (typeof window.__mapsScriptError === 'string' && window.__mapsScriptError))) || '';
        if (/BillingNotEnabled/i.test(msg)){
          showBillingOverlay();
          return; // stop trying to initialize until user fixes billing
        }
      }

      if (window.google && window.google.maps){
        try{
          map = new window.google.maps.Map(document.getElementById('map'), { center: {lat:0,lng:0}, zoom:2, disableDefaultUI:true, styles:[] });
          console.info('Map initialized');
          watchTileLoading();
        }catch(e){
          console.error('Error creating map:', e);
        }
      } else {
        // keep retrying but also log helpful hint after a few attempts
        if (!wait.attempts) wait.attempts = 0;
        wait.attempts += 1;
        if (wait.attempts > 25 && !document.querySelector('.map-error')){
          const hint = document.createElement('div');
          hint.className = 'map-error';
          hint.style.position='absolute';
          hint.style.left='20px';
          hint.style.top='20px';
          hint.style.padding='8px 12px';
          hint.style.background='rgba(0,0,0,0.8)';
          hint.style.borderRadius='6px';
          hint.style.zIndex='9999';
          hint.style.color='#fff';
          // improve message by including maps script error if present
          const mapsErr = window.__mapsScriptError;
          if (mapsErr && mapsErr.message && /BillingNotEnabled/.test(mapsErr.message)){
            hint.innerHTML = 'Google Maps billing is not enabled for your API key. Enable billing in the Google Cloud Console. <a href="https://developers.google.com/maps/gmp-get-started" target="_blank" style="color:#ffd160">Get started</a>';
          } else if (mapsErr && mapsErr.message){
            hint.textContent = 'Failed to load Google Maps JS: ' + mapsErr.message;
          } else {
            hint.textContent = 'Maps JavaScript not loaded. Check your API key in config.js and network.';
          }
          document.body.appendChild(hint);
        }
        setTimeout(wait, 200);
      }
    };
    wait();
  }

  function showBillingOverlay(){
    try{
      if (document.getElementById('mapsBillingOverlay')) return;
      const o = document.createElement('div');
      o.id = 'mapsBillingOverlay';
      o.style.position = 'fixed';
      o.style.left = '12px';
      o.style.right = '12px';
      o.style.top = '12px';
      o.style.padding = '14px';
      o.style.background = 'rgba(0,0,0,0.88)';
      o.style.color = '#fff';
      o.style.borderRadius = '8px';
      o.style.zIndex = '99999';
      o.style.boxShadow = '0 6px 24px rgba(0,0,0,0.5)';
  o.innerHTML = `<strong>Google Maps billing not enabled</strong><div style="margin-top:6px">The Maps API key used by this app does not have billing enabled, so map tiles and Street View are blocked. Enable billing for the project in Google Cloud Console.</div><div style="margin-top:8px"><a href="https://developers.google.com/maps/documentation/javascript/error-messages#billing-not-enabled-map-error" target="_blank" rel="noopener noreferrer" style="color:#ffd160">How to enable billing (Google)</a></div>`;
      const btn = document.createElement('button');
      btn.textContent = 'Retry after fix';
      btn.style.marginTop = '8px';
      btn.className = 'btn';
      btn.onclick = () => { reloadMapsScript(); };
      o.appendChild(btn);
      document.body.appendChild(o);
    }catch(e){ console.warn('showBillingOverlay failed', e); }
  }

  function removeBillingOverlay(){ try{ const el = document.getElementById('mapsBillingOverlay'); if (el) el.remove(); }catch(e){} }

  function reloadMapsScript(){
    try{
      // remove existing Maps script tags
      const scripts = Array.from(document.querySelectorAll('script'));
      scripts.forEach(s=>{
        if (s.src && s.src.indexOf('maps.googleapis.com') !== -1) s.remove();
      });
      // re-inject using config key
      if (typeof GOOGLE_MAPS_API_KEY === 'string' && GOOGLE_MAPS_API_KEY.length>8){
        window.__mapsScriptError = null;
        removeBillingOverlay();
        const s = document.createElement('script');
        s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly&callback=initMapHandler&loading=async`;
        s.async = true; s.defer = true; try{ s.setAttribute('loading','async'); }catch(e){}
        s.onerror = (ev) => { window.__mapsScriptError = ev || { message: 'Script load error' }; showBillingOverlay(); };
        document.head.appendChild(s);
      } else {
        showBillingOverlay();
      }
    }catch(e){ console.error('reloadMapsScript failed', e); }
  }

  function watchTileLoading(){
    try{
      const overlayEl = document.getElementById('mapOverlay');
      let tilesLoaded = false;
      // Google Maps fires 'tilesloaded' when tiles are rendered
      const onTiles = () => { tilesLoaded = true; if (overlayEl) overlayEl.classList.add('hidden'); };
      map.addListener('tilesloaded', onTiles);
      // safeguard: if after 8s tiles not loaded, show overlay with hint
      setTimeout(()=>{
        if (!tilesLoaded && overlayEl) {
          overlayEl.classList.remove('hidden');
          // if the maps script had an error, surface a clearer message
          const mapsErr = window.__mapsScriptError;
          if (mapsErr && mapsErr.message && /BillingNotEnabled/.test(mapsErr.message)){
            overlayEl.textContent = 'Map imagery blocked: Google Maps billing is not enabled for this API key. Enable billing in Google Cloud.';
          }
        }
      }, 8000);
    }catch(e){
      console.warn('watchTileLoading failed', e);
    }
  }

  // allow external trigger (in case script loaded after maps)
  function ensureInit(){ init(); }

  function enableGuessing(cb){
    if (!map) return setTimeout(()=>enableGuessing(cb),200);
    if (clickListener && window.google && window.google.maps) window.google.maps.event.removeListener(clickListener);
    clickListener = map.addListener('click', e=>{
      placeGuess(e.latLng);
      if (typeof cb==='function') cb(e.latLng);
    });
  }

  function disableGuessing(){
    if (clickListener && window.google && window.google.maps) window.google.maps.event.removeListener(clickListener);
    clickListener = null;
  }

  function placeGuess(latLng){
    if (!map) return;
    if (guessMarker) guessMarker.setMap(null);
    guessMarker = new window.google.maps.Marker({ position: latLng, map, title:'Your Guess', icon:{ url:'assets/icons/pin-guess.png', scaledSize: new window.google.maps.Size(36,36) } });
    map.panTo(latLng);
  }

  function showActualAndGuess(actual, guess){
    if (!map) return;
    if (actualMarker) actualMarker.setMap(null);
    actualMarker = new window.google.maps.Marker({ position: actual, map, title:'Actual Location', icon:{ url:'assets/icons/pin-actual.png', scaledSize: new window.google.maps.Size(36,36) } });
    // ensure guess marker exists
    if (!guessMarker && guess) {
      guessMarker = new window.google.maps.Marker({ position: guess, map, title:'Your Guess', icon:{ url:'assets/icons/pin-guess.png', scaledSize: new window.google.maps.Size(36,36) } });
    }
    // draw line
    if (line) line.setMap(null);
    line = new window.google.maps.Polyline({ path: [guess, actual], geodesic:true, strokeColor:'#ffda66', strokeOpacity:0.9, strokeWeight:3, map });
    // fit bounds
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(guess);
    bounds.extend(actual);
    map.fitBounds(bounds, 80);
  }

  function clearRound(){
    if (guessMarker) { guessMarker.setMap(null); guessMarker = null; }
    if (actualMarker) { actualMarker.setMap(null); actualMarker = null; }
    if (line) { line.setMap(null); line = null; }
  }

  // initialize on load
  window.addEventListener('load', init);
  // also try to init when Maps API finishes loading (global callback if needed)
  window.initMapHandler = init;

  return { enableGuessing, disableGuessing, placeGuess, showActualAndGuess, clearRound, ensureInit };
})();
