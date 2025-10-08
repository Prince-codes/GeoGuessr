(function(){
  const start = document.getElementById('start');
  const reload = document.getElementById('reload');
  const statusEl = document.getElementById('statustxt');
  const results = document.getElementById('results');

  function setStatus(s){ statusEl.textContent = s; }

  function append(msg, cls){
    const d = document.createElement('div'); d.className = cls || ''; d.textContent = msg; results.appendChild(d);
  }

  function loadMaps(){
    return new Promise((resolve,reject)=>{
      if (!window.GOOGLE_MAPS_API_KEY) return reject(new Error('config.js must define GOOGLE_MAPS_API_KEY'));
      // remove any existing maps scripts
      Array.from(document.querySelectorAll('script')).forEach(s=>{ if (s.src && s.src.indexOf('maps.googleapis.com')!==-1) s.remove(); });
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly&callback=__diagInit&loading=async`;
      s.async = true; s.defer = true; try{ s.setAttribute('loading','async'); }catch(e){}
      s.onerror = (ev)=>{ window.__mapsScriptError = ev || { message: 'Script load error' }; reject(window.__mapsScriptError); };
      window.__diagInit = function(){ resolve(); };
      document.head.appendChild(s);
    });
  }

  function testPanorama(lat,lng){
    return new Promise((resolve)=>{
      if (!window.google || !window.google.maps) return resolve({ status:'nogoogle' });
      const service = new window.google.maps.StreetViewService();
      service.getPanorama({ location: new window.google.maps.LatLng(lat,lng), radius: 50000 }, (data, status)=>{
        resolve({ lat,lng, status, data: !!data });
      });
    });
  }

  start.addEventListener('click', async ()=>{
    results.innerHTML = '';
    setStatus('loading maps');
    try{
      await loadMaps();
      setStatus('maps loaded');
      append('Maps JS loaded', 'ok');
      // run a few known coordinates: NY, London, rural ocean
      const coords = [ {lat:40.730610,lng:-73.935242, name:'NYC'}, {lat:51.5074,lng:-0.1278,name:'London'}, {lat:0,lng:-160,name:'Pacific (likely none)'} ];
      for (const c of coords){
        setStatus(`testing ${c.name}`);
        const r = await testPanorama(c.lat,c.lng);
        const el = document.createElement('div');
        el.innerHTML = `<strong>${c.name}</strong>: status=${r.status} data=${r.data}`;
        if (r.status === 'OK' || r.status === window.google.maps.StreetViewStatus.OK) el.className='ok'; else el.className='bad';
        results.appendChild(el);
      }
      setStatus('done');
    }catch(err){
      setStatus('error');
      append('Maps load failed: ' + (err && (err.message || err.toString())), 'bad');
      if (window.__mapsScriptError) append('Captured script error: ' + JSON.stringify(window.__mapsScriptError), 'bad');
    }
  });

  reload.addEventListener('click', ()=>{ location.reload(); });
})();
