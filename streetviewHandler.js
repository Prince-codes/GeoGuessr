// streetviewHandler.js
let panorama = null;
let currentPanoLatLng = null;

function getRandomCoordinates(){
  return {
    lat: +(Math.random()*180 - 90).toFixed(6),
    lng: +(Math.random()*360 - 180).toFixed(6)
  };
}

function getValidStreetView(callback){
  const service = new google.maps.StreetViewService();
  const coords = getRandomCoordinates();
  service.getPanorama({ location: coords, radius: 50000 }, (data, status) => {
    if(status === google.maps.StreetViewStatus.OK){
      callback(data.location.latLng);
    }else{
      // Try again recursively
      getValidStreetView(callback);
    }
  });
}

function initStreetView(containerId){
  panorama = new google.maps.StreetViewPanorama(document.getElementById(containerId),{
    disableDefaultUI:true,
    clickToGo:false,
    linksControl:false,
    motionTracking:false,
    showRoadLabels:false,
    addressControl:false,
    zoomControl:true,
    fullscreenControl:false,
    panControl:false
  });
}

function loadRandomPano(){
  return new Promise((resolve)=>{
    getValidStreetView((latLng)=>{
      currentPanoLatLng = latLng;
      panorama.setPosition(latLng);
      panorama.setPov({heading:0, pitch:0, zoom:0});
      resolve(latLng);
    });
  });
}

function getCurrentPanoLatLng(){
  return currentPanoLatLng;
}

window.initStreetView = initStreetView;
window.loadRandomPano = loadRandomPano;
window.getCurrentPanoLatLng = getCurrentPanoLatLng;