/* StreetViewHandler: finds random valid Street View panoramas and renders them */
const StreetViewHandler = (function(){
  let panoramaInstance = null;

  function getRandomCoordinates(){
    const lat = (Math.random() * 180 - 90);
    const lng = (Math.random() * 360 - 180);
    return { lat, lng };
  }

  function getValidStreetViewLocation(callback, tries=0){
    // if Maps script previously errored with BillingNotEnabled, abort and show message
    if (window.__mapsScriptError && /BillingNotEnabled/i.test((window.__mapsScriptError && window.__mapsScriptError.message) || '')){
      showStreetViewError('Street View blocked: Google Maps billing is not enabled for this API key.');
      return;
    }
    if (!window.google || !window.google.maps) return setTimeout(()=>getValidStreetViewLocation(callback,tries),200);
    const streetViewService = new window.google.maps.StreetViewService();
    const coords = getRandomCoordinates();
    // increase radius to increase hit-rate
    const radius = 100000; // 100km
    const location = new window.google.maps.LatLng(coords.lat, coords.lng);
    streetViewService.getPanorama({ location, radius }, (data, status) => {
      // handle different statuses explicitly
      if (status === window.google.maps.StreetViewStatus.OK) {
        const panoId = data && data.location && data.location.pano ? data.location.pano : null;
        hideStreetViewError();
        callback(data.location.latLng, { pano: panoId, raw: data });
      } else if (status === window.google.maps.StreetViewStatus.ZERO_RESULTS) {
        // no panorama near this random coord -> retry
        if (tries < 25) setTimeout(()=>getValidStreetViewLocation(callback, tries+1), 200);
        else {
          console.warn('Could not find Street View panorama after multiple tries');
          showStreetViewError('No Street View imagery found for random spots. Try again.');
        }
      } else {
        // other statuses (e.g., REQUEST_DENIED, UNKNOWN) often indicate API/key/billing issues
        const msg = `Street View service returned status: ${status}`;
        console.error(msg);
        showStreetViewError(msg + ' — check your API key and billing in Google Cloud.');
      }
    });
  }

  function showStreetViewError(message){
    try{
      const pane = document.getElementById('streetviewPane') || document.getElementById('streetview');
      let el = document.getElementById('svOverlay');
      if (!el){
        el = document.createElement('div');
        el.id = 'svOverlay';
          el.style.position = 'absolute';
          el.style.left = '12px';
          el.style.right = '12px';
          el.style.top = '12px';
          el.style.padding = '10px';
          el.style.background = 'rgba(0,0,0,0.8)';
          el.style.color = '#fff';
          el.style.borderRadius = '8px';
          el.style.zIndex = '99999';
          el.style.pointerEvents = 'auto';
          el.style.cursor = 'pointer';
          el.title = 'Click to retry loading this panorama';
          if (pane && pane.appendChild) pane.appendChild(el);
          // clicking the overlay will dispatch a retry event the app can listen to
          el.addEventListener('click', ()=>{
            const ev = new CustomEvent('svRetryRequested');
            window.dispatchEvent(ev);
          });
      }
      el.textContent = message;
      el.classList.remove('hidden');
    }catch(e){ console.warn('Could not show Street View error', e); }
  }

  function hideStreetViewError(){
    try{ const el = document.getElementById('svOverlay'); if (el) el.classList.add('hidden'); }catch(e){}
  }

  function renderPanorama(container, panoramaData){
    if (!window.google || !window.google.maps) return setTimeout(()=>renderPanorama(container, panoramaData),200);
    // Reuse single panorama instance to avoid multiple DOM/canvas recreations
    if (!panoramaInstance){
      panoramaInstance = new window.google.maps.StreetViewPanorama(container, {
        pov: { heading: 34, pitch: 0 },
        visible: true,
        enableCloseButton: false,
        addressControl: false,
        linksControl: false,
        panControl: false,
        clickToGo: false,
        motionTracking: false
      });
      // restrict user's movement: allow only rotation
      panoramaInstance.setOptions({ motionTracking: false, clickToGo: false, scrollwheel: false });
    } else {
      // ensure the panorama is attached to the requested container
      if (panoramaInstance.getDiv() !== container){
        // remove old node and append new container if necessary (safe reattach)
        container.innerHTML = '';
        container.appendChild(panoramaInstance.getDiv());
      }
    }

    // Use pano id when available (more reliable). Otherwise set position.
    if (panoramaData && panoramaData.pano){
      try{ panoramaInstance.setPano(panoramaData.pano); }catch(e){ console.warn('setPano failed, falling back to position', e); }
    } else if (panoramaData && panoramaData.raw && panoramaData.raw.location && panoramaData.raw.location.latLng){
      panoramaInstance.setPosition(panoramaData.raw.location.latLng);
    }

    // small animated heading tweak for life
    try{
      let heading = panoramaInstance.getPov().heading || 0;
      let step = 0;
      const anim = setInterval(()=>{
        step += 1;
        panoramaInstance.setPov({ heading: heading + Math.sin(step/20)*6, pitch: 0 });
        if (step > 60) clearInterval(anim);
      }, 60);
    }catch(e){ /* ignore animation errors */ }

    // detect blank/black panorama and retry a few times if necessary
    const blankCheck = (attempt=0) => {
      try{
        // heuristics: check if panorama container has child nodes or if tiles appear
        const div = panoramaInstance.getDiv();
        const hasChildren = div && div.querySelector && div.querySelector('canvas, img, video');
        if (!hasChildren && attempt < 3){
          // retry setting pano or position
          setTimeout(()=>{
            if (panoramaData && panoramaData.pano){
              try{ panoramaInstance.setPano(panoramaData.pano); }catch(e){}
            } else if (panoramaData && panoramaData.raw && panoramaData.raw.location && panoramaData.raw.location.latLng){
              try{ panoramaInstance.setPosition(panoramaData.raw.location.latLng); }catch(e){}
            }
            blankCheck(attempt+1);
          }, 700);
        }
      }catch(e){ /* ignore blank check errors */ }
    };
    setTimeout(()=>blankCheck(0), 700);

    return panoramaInstance;
  }

  return { getValidStreetViewLocation, renderPanorama };
})();
