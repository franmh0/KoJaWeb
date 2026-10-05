'use strict';
const routeLayout=document.querySelector('.route-layout'),mapShell=document.querySelector('.map-shell');
mapShell.insertAdjacentHTML('beforeend',`<div class="route-arrival" hidden><span>UN NUEVO RECUERDO</span><strong id="arrival-title"></strong><small id="arrival-date"></small></div>
<div class="route-ending" hidden><span>BARCELONA · DE VUELTA EN CASA</span><h3>Volvería a cada lugar.<br><em>Contigo.</em></h3><p>El viaje termina. Lo nuestro sigue.</p><button id="route-replay">Volver a vivirlo ↗</button></div>
<div class="route-tools"><button id="route-immersive" aria-pressed="false">⛶ Vivir la ruta</button><button id="route-sound" aria-pressed="false">♫ Activar sonido</button><label class="route-volume" hidden>Volumen <input id="route-volume" type="range" min="0" max="100" value="25" aria-label="Volumen del viaje"></label></div>
<div class="immersive-controls"><button id="immersive-prev" aria-label="Ciudad anterior">←</button><button id="immersive-play">Reproducir</button><button id="immersive-next" aria-label="Ciudad siguiente">→</button><button id="immersive-exit">Salir ✕</button></div>`);
routeLayout.insertAdjacentHTML('beforeend',`<div class="route-itinerary"><div class="itinerary-heading"><span>EL HILO DE NUESTRO VIAJE</span><small>Elige una ciudad para volver</small></div><div class="itinerary-track" role="group" aria-label="Ciudades del viaje">${tripStops.map((s,i)=>`<button data-visit="${i}" aria-label="${s.name}, parada ${i+1}"><span class="itinerary-dot">${String(i+1).padStart(2,'0')}</span><strong>${s.name}</strong><small>${i===0?'Salida':i===11?'En casa':s.date}</small></button>`).join('')}</div><div class="visit-choice" hidden><strong id="visit-city"></strong><button id="visit-memories">Ver sus recuerdos</button><button id="visit-continue">Continuar desde aquí →</button><button id="visit-close" aria-label="Cerrar opciones de ciudad">✕</button></div></div>`);
$('#route-flash').insertAdjacentHTML('afterbegin','<img id="route-flash-back" alt="" aria-hidden="true">');
let completedRoute=map?L.polyline([],{color:'#b6c8bc',weight:1.5,opacity:.35,smoothFactor:0,noClip:true}).addTo(map):null;
let soundContext,soundGain,soundEnabled=false,musicTimer,selectedVisit=0,memoriesOnly=false,endingTimer,lastTimelineStop=-1;
function syncJourney(){
  document.querySelectorAll('[data-visit]').forEach((b,i)=>{b.classList.toggle('visited',i<routeIndex);b.setAttribute('aria-current',i===routeIndex?'step':'false');});
  if(lastTimelineStop!==routeIndex){
    const track=$('.itinerary-track'),active=track.querySelector('[aria-current="step"]');
    track.scrollTo({left:active.offsetLeft-track.offsetLeft-track.clientWidth/2+active.clientWidth/2,behavior:reduced?'instant':'smooth'});
    lastTimelineStop=routeIndex;
  }
  $('#immersive-play').textContent=routePlaying?'Pausar':'Reproducir';
  $('#immersive-prev').disabled=routeIndex===0;$('#immersive-next').disabled=routeIndex===11;
  routeLayout.classList.toggle('route-paused',!routePlaying);
  if(soundGain&&soundContext)soundGain.gain.setTargetAtTime(soundEnabled&&routePlaying?Number($('#route-volume').value)/100*.22:0,soundContext.currentTime,.3);
}
function announceArrival(){
  $('#arrival-title').textContent='Llegamos a '+tripStops[routeIndex].name;
  $('#arrival-date').textContent=tripStops[routeIndex].date+' · 2024';
  $('.route-arrival').hidden=false;
  cityMarkers[routeIndex]?.getElement()?.classList.add('arrival-pulse');
  playChime();
}
const originalSelect=selectStop;
selectStop=function(i,pan=true){originalSelect(i,pan);syncJourney();};
const originalDraw=drawLeg;
drawLeg=function(t){
  originalDraw(t);
  const points=legs[legIndex],n=Math.min(119,Math.floor(t*120)),f=t*120-n;
  const pos=points[n].map((v,k)=>v+(points[n+1][k]-v)*f);
  completedRoute.setLatLngs(legs.slice(0,legIndex));
  route.setLatLngs([...points.slice(0,n+1),pos]);
};
const originalShow=showFlash;
showFlash=function(i){
  const back=$('#route-flash-back'),front=$('#route-flash-img');
  back.src=i===0?flashPhotos[i].src:front.getAttribute('src')||flashPhotos[i].src;
  originalShow(i);
  front.style.animation='none';void front.offsetWidth;front.style.animation='';
};
const originalJump=jumpTo;
jumpTo=function(i){
  clearTimeout(endingTimer);mapShell.classList.remove('has-ending');memoriesOnly=false;$('.route-ending').hidden=true;$('.route-arrival').hidden=true;$('.visit-choice').hidden=true;
  cityMarkers.forEach(m=>m.getElement()?.classList.remove('arrival-pulse'));
  originalJump(i);
  completedRoute?.setLatLngs(legs.slice(0,routeIndex));route?.setLatLngs([]);
  syncJourney();
};
const originalStop=stopRoute;
stopRoute=function(){originalStop();syncJourney();};
const originalNext=nextLeg;
nextLeg=function(){
  $('.route-arrival').hidden=true;
  if(memoriesOnly){hideFlash();stopRoute();memoriesOnly=false;legIndex=Math.min(routeIndex,10);legElapsed=0;cameraPhase='';syncJourney();return;}
  if(legIndex===10){
    originalNext();completedRoute.setLatLngs(legs);route.setLatLngs([]);
    map.flyToBounds(L.latLngBounds(legs.flat()),{padding:[65,65],animate:!reduced,duration:5});
    endingTimer=setTimeout(()=>{mapShell.classList.add('has-ending');$('.route-ending').hidden=false;},reduced?0:4500);
    return;
  }
  originalNext();syncJourney();
};
$('#route-play').addEventListener('click',syncJourney);
$('#route-flash-skip').addEventListener('click',()=>{if(!routePlaying)$('#route-play').click();});
$('#route-replay').onclick=()=>{jumpTo(0);$('#route-play').click();};
$('#immersive-play').onclick=()=>$('#route-play').click();
$('#immersive-prev').onclick=()=>jumpTo(routeIndex-1);
$('#immersive-next').onclick=()=>jumpTo(routeIndex+1);
let immersiveFocus;
function setImmersive(on){
  if(on)immersiveFocus=document.activeElement;
  routeLayout.classList.toggle('is-immersive',on);document.body.classList.toggle('route-immersive-open',on);
  $('#route-immersive').setAttribute('aria-pressed',String(on));$('#route-immersive').textContent=on?'⛶ Salir de pantalla completa':'⛶ Vivir la ruta';
  requestAnimationFrame(()=>map?.invalidateSize({pan:false}));
  if(on)$('#immersive-exit').focus();else immersiveFocus?.focus();
}
$('#route-immersive').onclick=()=>setImmersive(!routeLayout.classList.contains('is-immersive'));
$('#immersive-exit').onclick=()=>setImmersive(false);
document.addEventListener('keydown',e=>{
  if(!routeLayout.classList.contains('is-immersive'))return;
  if(e.key==='Escape'){setImmersive(false);return;}
  if(e.key==='Tab'){
    const nodes=[...routeLayout.querySelectorAll('button:not(:disabled),input,a[href]')].filter(el=>el.getClientRects().length);
    const first=nodes[0],last=nodes[nodes.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
});
document.querySelector('.itinerary-track').onclick=e=>{
  const b=e.target.closest('[data-visit]');if(!b)return;
  stopRoute();selectedVisit=Number(b.dataset.visit);
  $('#visit-city').textContent=tripStops[selectedVisit].name;
  $('#visit-memories').hidden=selectedVisit===0||selectedVisit===11;
  $('.visit-choice').hidden=false;$('#visit-continue').focus();
};
$('#visit-close').onclick=()=>{$('.visit-choice').hidden=true;document.querySelector('[data-visit="'+selectedVisit+'"]').focus();};
$('#visit-continue').onclick=()=>{jumpTo(selectedVisit);if(selectedVisit!==11)$('#route-play').click();};
$('#visit-memories').onclick=()=>{
  jumpTo(selectedVisit);memoriesOnly=true;legIndex=selectedVisit-1;
  prepareFlash(tripStops[selectedVisit].name);cameraPhase='flash';routePlaying=true;routeLast=0;
  $('#route-play').textContent='Ⅱ Pausar ruta';syncJourney();routeFrame=requestAnimationFrame(routeTick);
};
// A quiet, original ambient score, synthesized locally only after an explicit click.
function note(frequency,when,duration,level=.08){
  const osc=soundContext.createOscillator(),gain=soundContext.createGain();
  osc.type='sine';osc.frequency.value=frequency;gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(level,when+.12);gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
  osc.connect(gain);gain.connect(soundGain);osc.start(when);osc.stop(when+duration+.1);
  osc.onended=()=>{osc.disconnect();gain.disconnect();};
}
let chordIndex=0;
function musicPhrase(){
  if(!soundEnabled||!routePlaying)return;
  const chords=[[130.81,196,261.63,329.63],[110,164.81,220,329.63],[87.31,174.61,261.63,349.23],[98,196,293.66,392]];
  const chord=chords[chordIndex++%chords.length],now=soundContext.currentTime;
  chord.forEach((f,i)=>{note(f,now+i*.65,4.5,.1);note(f*2,now+2+i*.45,2.7,.035);});
}
function playChime(){if(soundEnabled&&soundContext&&routePlaying){const now=soundContext.currentTime;[523.25,659.25,783.99].forEach((f,i)=>note(f,now+i*.17,1.6,.12));}}
function playDeparture(){
  if(!soundEnabled||!soundContext)return;
  const now=soundContext.currentTime;
  if(!isFlight(legIndex)){[0,.22,.55,.77].forEach(t=>note(130.81,now+t,.2,.12));return;}
  const buffer=soundContext.createBuffer(1,soundContext.sampleRate*2,soundContext.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.15;
  const source=soundContext.createBufferSource(),filter=soundContext.createBiquadFilter(),gain=soundContext.createGain();
  source.buffer=buffer;filter.type='lowpass';filter.frequency.setValueAtTime(150,now);filter.frequency.linearRampToValueAtTime(900,now+1);
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.5,now+.8);gain.gain.linearRampToValueAtTime(0,now+2);
  source.connect(filter);filter.connect(gain);gain.connect(soundGain);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
}
$('#route-sound').onclick=async()=>{
  try{
    if(!soundContext){soundContext=new (window.AudioContext||window.webkitAudioContext)();soundGain=soundContext.createGain();soundGain.gain.value=0;soundGain.connect(soundContext.destination);}
    await soundContext.resume();soundEnabled=!soundEnabled;
    $('#route-sound').setAttribute('aria-pressed',String(soundEnabled));$('#route-sound').textContent=soundEnabled?'♫ Silenciar':'♫ Activar sonido';$('.route-volume').hidden=!soundEnabled;
    clearInterval(musicTimer);syncJourney();if(soundEnabled){musicPhrase();musicTimer=setInterval(musicPhrase,6000);}
  }catch(e){$('#route-sound').textContent='Sonido no disponible';}
};
$('#route-volume').oninput=syncJourney;
window.addEventListener('pagehide',()=>{clearInterval(musicTimer);soundContext?.suspend();});
syncJourney();
