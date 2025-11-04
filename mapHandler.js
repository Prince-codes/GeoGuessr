// mapHandler.js
let map, guessMarker, actualMarker, polyline;

function initMap(containerId){
  map = new google.maps.Map(document.getElementById(containerId),{
    center:{lat:20,lng:0}, zoom:2, minZoom:1, maxZoom:8,
    disableDefaultUI:true, gestureHandling:'greedy', mapTypeId:'roadmap',
    styles:[
      {elementType:'geometry', stylers:[{color:'#1B1212'}]},
      {elementType:'labels.text.stroke', stylers:[{color:'#1B1212'}]},
      {elementType:'labels.text.fill', stylers:[{color:'#FFBF00'}]},
      {featureType:'administrative', elementType:'geometry', stylers:[{visibility:'off'}]},
      {featureType:'poi', stylers:[{visibility:'off'}]},
      {featureType:'road', stylers:[{visibility:'off'}]},
      {featureType:'water', elementType:'geometry', stylers:[{color:'#0b0b0f'}]}
    ]
  });

  map.addListener('click', (e)=>{
    placeGuess(e.latLng);
  });
}

function placeGuess(latLng){
  if(guessMarker){guessMarker.setMap(null)}
  guessMarker = new google.maps.Marker({
    position:latLng, map, animation:google.maps.Animation.DROP
  });
  document.getElementById('submit-guess').disabled = false;
}

function revealActual(actualLatLng){
  if(actualMarker){actualMarker.setMap(null)}
  actualMarker = new google.maps.Marker({
    position:actualLatLng, map,
  });

  if(polyline){polyline.setMap(null)}
  if(guessMarker){
    polyline = new google.maps.Polyline({
      path:[guessMarker.getPosition(), actualLatLng], map,
      strokeColor:'#FFBF00', strokeOpacity:0.9, strokeWeight:3,
      icons:[{icon:{path:google.maps.SymbolPath.FORWARD_OPEN_ARROW, scale:2, strokeColor:'#FFBF00'}, offset:'50%'}]
    });
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(guessMarker.getPosition());
    bounds.extend(actualLatLng);
    map.fitBounds(bounds, 60);
  }
}

function clearRound(){
  if(guessMarker){guessMarker.setMap(null); guessMarker=null}
  if(actualMarker){actualMarker.setMap(null); actualMarker=null}
  if(polyline){polyline.setMap(null); polyline=null}
  document.getElementById('submit-guess').disabled = true;
}

function getGuessLatLng(){
  return guessMarker ? guessMarker.getPosition() : null;
}

window.initMap = initMap;
window.placeGuess = placeGuess;
window.revealActual = revealActual;
window.clearRound = clearRound;
window.getGuessLatLng = getGuessLatLng;