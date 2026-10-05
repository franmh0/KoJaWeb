'use strict';
const tripStops = [
  {name:'Barcelona',date:'Salida · agosto 2024',country:'España',lat:41.3874,lng:2.1686,copy:'Aquí empieza todo. Las maletas, los nervios y un mundo por descubrir juntos.',src:'assets/gallery/photo-0002.webp'},
  ...stops,
  {name:'Barcelona',date:'De vuelta a casa',country:'España',lat:41.3874,lng:2.1686,copy:'Volvemos al principio, con miles de recuerdos nuevos. El viaje se queda con nosotros.',src:'assets/gallery/photo-0002.webp'}
];
let map, traveler, route, routeFrame, routePlaying=false, routeIndex=0, legIndex=0, legElapsed=0, routeLast=0, cameraPhase='';
const legDuration=9000, cityMarkers=[];
const planeSVG='<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M37 20 23 15 18 3h-5l3 13-10 1-3-5H0l2 8-2 8h3l3-5 10 1-3 13h5l5-12z" fill="currentColor"/></svg>';
const trainSVG='<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="5" y="8" width="30" height="23" rx="8" fill="currentColor"/><path d="M11 14h7v8h-7zm11 0h7v8h-7" fill="#17261f"/><path d="m12 31-4 6m20-6 4 6M10 35h20" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="27" r="2" fill="#17261f"/><circle cx="28" cy="27" r="2" fill="#17261f"/></svg>';
const isFlight=i=>i===0||i===3||i===10;
// Schematic curves, not actual flight paths or railway tracks.
const legs=tripStops.slice(0,-1).map((a,i)=>{
  const b=tripStops[i+1],dx=b.lng-a.lng,dy=b.lat-a.lat,bend=isFlight(i)?Math.min(19,Math.abs(dx)*.22):Math.min(.4,Math.abs(dx)*.1);
  return Array.from({length:121},(_,j)=>{const t=j/120;return [a.lat+dy*t+Math.sin(Math.PI*t)*bend,a.lng+dx*t];});
});
document.querySelector('#ruta .heading h2').innerHTML='El mundo, contigo.<br><em>Un viaje de ida y vuelta.</em>';
document.querySelector('#ruta .heading > p').textContent='De Barcelona a Corea y Japón. Sigue el hilo de nuestro viaje y vuelve a aterrizar en cada recuerdo.';
$('#stops').innerHTML=tripStops.map((s,i)=>`<button data-stop="${i}" aria-pressed="${i===0}"><span>${String(i+1).padStart(2,'0')}</span> ${s.name}${i===0?' · salida':i===11?' · regreso':''}</button>`).join('');
document.querySelector('.map-shell').insertAdjacentHTML('beforeend','<div class="route-hud"><span class="route-kicker">NUESTRO ATLAS · 2024</span><strong id="route-leg">Barcelona → Seúl</strong><span id="route-state" role="status">Todo empieza aquí</span></div><div class="route-meter"><span id="route-fill"></span></div><div class="route-legend">✈ Vuelos <span>━ Trenes</span> · Recorrido ilustrado</div>');
document.querySelector('.route-panel').insertAdjacentHTML('afterbegin','<span class="route-chapter" id="route-chapter">01 / 12</span>');
function selectStop(i,pan=true){
  routeIndex=Math.max(0,Math.min(i,tripStops.length-1));const s=tripStops[routeIndex];
  $('#stop-date').textContent=`${s.date} / ${s.country}`;$('#stop-title').textContent=s.name;$('#stop-photo').src=s.src;$('#stop-photo').alt=routeIndex===0||routeIndex===11?'Recuerdo de la salida del viaje':`${s.name}, ${s.date} de 2024`;$('#stop-copy').textContent=s.copy;
  $('#route-chapter').textContent=`${String(routeIndex+1).padStart(2,'0')} / 12`;
  document.querySelectorAll('[data-stop]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.stop)===routeIndex));
  cityMarkers.forEach((m,j)=>m.getElement()?.classList.toggle('is-current',j===routeIndex));
  $('#route-prev').disabled=routeIndex===0;$('#route-next').disabled=routeIndex===11;
  if(map&&pan)map.flyTo([s.lat,s.lng],9,{animate:!reduced,duration:1.8});
}
function setVehicle(i){traveler.setIcon(L.divIcon({className:'route-vehicle',html:`<div class="vehicle-halo"></div><div class="vehicle-body ${isFlight(i)?'plane':'train'}">${isFlight(i)?planeSVG:trainSVG}</div>`,iconSize:[44,44],iconAnchor:[22,22]}));}
function drawLeg(t){
  const points=legs[legIndex],n=Math.min(119,Math.floor(t*120)),f=t*120-n;
  const pos=points[n].map((v,k)=>v+(points[n+1][k]-v)*f);
  route.setLatLngs([...legs.slice(0,legIndex).flat(),...points.slice(0,n+1),pos]);traveler.setLatLng(pos);
  if(isFlight(legIndex)){const a=map.project(points[n]),b=map.project(points[n+1]);traveler.getElement().querySelector('.vehicle-body').style.transform=`rotate(${Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI}deg)`;}
  $('#route-fill').style.width=`${(legIndex+t)/legs.length*100}%`;
}
function stopRoute(){routePlaying=false;cancelAnimationFrame(routeFrame);if(map)map.stop();$('#route-play').textContent=legElapsed?'▶ Continuar ruta':'▶ Animar ruta';}
function jumpTo(i){stopRoute();selectStop(i);legIndex=Math.min(routeIndex,10);legElapsed=0;cameraPhase='';$('#route-play').textContent=routeIndex===11?'↻ Repetir ruta':'▶ Animar ruta';if(map){setVehicle(legIndex);route.setLatLngs(legs.slice(0,routeIndex).flat());traveler.setLatLng([tripStops[routeIndex].lat,tripStops[routeIndex].lng]);}$('#route-fill').style.width=`${routeIndex/11*100}%`;$('#route-leg').textContent=routeIndex===11?'Tokio → Barcelona':`${tripStops[routeIndex].name} → ${tripStops[routeIndex+1].name}`;$('#route-state').textContent=routeIndex===11?'En casa, con todos nuestros recuerdos':'Listos para el siguiente capítulo';}
function routeTick(time){
  if(!routePlaying)return;if(routeLast)legElapsed+=Math.min(time-routeLast,100);routeLast=time;
  const phase=legElapsed<1600?'departure':legElapsed<7000?'travel':'arrival';
  if(phase!==cameraPhase){cameraPhase=phase;const a=tripStops[legIndex],b=tripStops[legIndex+1];
    if(phase==='departure'){selectStop(legIndex,false);setVehicle(legIndex);$('#route-leg').textContent=`${a.name} → ${b.name}`;$('#route-state').textContent=isFlight(legIndex)?'Preparados para despegar':'El siguiente recuerdo nos espera';map.flyTo([a.lat,a.lng],8,{animate:!reduced,duration:1.3});}
    if(phase==='travel'){map.flyToBounds(L.latLngBounds(legs[legIndex]),{paddingTopLeft:[55,125],paddingBottomRight:[55,80],maxZoom:8,animate:!reduced,duration:2});$('#route-state').textContent=isFlight(legIndex)?'En vuelo · cruzando el horizonte':'En tren · entre ciudades';}
    if(phase==='arrival'){selectStop(legIndex+1,false);map.flyTo([b.lat,b.lng],9,{animate:!reduced,duration:1.8});$('#route-state').textContent=legIndex===10?'De vuelta en casa ♥':`Llegamos a ${b.name}`;}
  }
  drawLeg(Math.max(0,Math.min(1,(legElapsed-1600)/5400)));
  if(legElapsed>=legDuration){if(legIndex===10){stopRoute();legElapsed=0;$('#route-play').textContent='↻ Repetir ruta';return;}legIndex++;legElapsed=0;cameraPhase='';}
  routeFrame=requestAnimationFrame(routeTick);
}
try{
  if(!window.L)throw Error('Mapa no disponible');
  map=L.map('map',{scrollWheelZoom:false,zoomControl:false});L.control.zoom({position:'bottomright'}).addTo(map);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
  legs.forEach((points,i)=>L.polyline(points,{color:isFlight(i)?'#cba971':'#83a99b',weight:2,opacity:.6,dashArray:isFlight(i)?'4 9':null}).addTo(map));
  route=L.polyline([],{color:'#ffe0a0',weight:4,opacity:1,className:'route-trail'}).addTo(map);
  tripStops.forEach((s,i)=>{const m=L.marker([s.lat,s.lng],{icon:L.divIcon({className:'route-city',html:'<span></span>',iconSize:[16,16],iconAnchor:[8,8]}),title:`${s.name} · ${s.date}`}).addTo(map).on('click',()=>jumpTo(i));if(![3,10,11].includes(i))m.bindTooltip(s.name,{permanent:true,direction:'right',offset:[10,0],className:'route-city-label'});cityMarkers.push(m);});
  traveler=L.marker([tripStops[0].lat,tripStops[0].lng],{interactive:false,zIndexOffset:1000}).addTo(map);setVehicle(0);
  const fit=()=>map.fitBounds(L.latLngBounds(legs.flat()),{paddingTopLeft:[45,125],paddingBottomRight:[45,80],animate:!reduced});fit();
  $('#fit').onclick=()=>{stopRoute();fit();};
  map.on('dragstart',()=>stopRoute());
  $('#route-play').onclick=()=>{if(routePlaying){stopRoute();return;}if(routeIndex===11&&!legElapsed)jumpTo(0);routePlaying=true;routeLast=0;cameraPhase='';$('#route-play').textContent='Ⅱ Pausar ruta';routeFrame=requestAnimationFrame(routeTick);};
}catch(e){$('#map').innerHTML='<p class="map-error">El mapa no se ha podido cargar. Puedes seguir explorando las paradas del viaje.</p>';$('#fit').hidden=true;$('#route-play').disabled=true;}
$('#stops').onclick=e=>{const b=e.target.closest('[data-stop]');if(b)jumpTo(Number(b.dataset.stop));};$('#route-prev').onclick=()=>jumpTo(routeIndex-1);$('#route-next').onclick=()=>jumpTo(routeIndex+1);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&routePlaying)stopRoute();});
selectStop(0,false);
