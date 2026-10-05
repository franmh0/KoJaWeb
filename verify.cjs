const { chromium } = require('C:/Users/Rei_I/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const server=http.createServer((req,res)=>{const file=path.join(__dirname,decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));fs.readFile(file,(e,data)=>{if(e){res.writeHead(404);res.end();return;}const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data);});});
(async()=>{await new Promise(r=>server.listen(4173,r));const browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:4173');await page.waitForFunction(()=>document.querySelector('#photo-count')?.textContent==='4.111',{timeout:10000}).catch(async()=>{throw Error(`Gallery load failed: count=${await page.locator('#photo-count').textContent()}; errors=${errors.join('|')}`)});await page.waitForSelector('.photo-card[data-gallery-start]');await page.waitForSelector('.leaflet-tile-loaded');
for(const width of [1440,390,768]){await page.setViewportSize({width,height:900});await page.screenshot({path:`qa-${width}.png`,fullPage:true});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error('Overflow '+width);await page.locator('#album').scrollIntoViewIfNeeded();await page.locator('.photo-card img').first().evaluate(img=>img.decode());await page.screenshot({path:`qa-album-${width}.png`});await page.locator('#historia').scrollIntoViewIfNeeded();await page.screenshot({path:`qa-story-${width}.png`});await page.locator('#inicio').scrollIntoViewIfNeeded();}
await page.getByRole('button',{name:'Revivir nuestro viaje'}).click();await page.getByRole('button',{name:'Pausar',exact:true}).click();if(await page.locator('#cinema-progress button').count()!==100)throw Error('Not exactly 100');await page.locator('#cinema-progress button').nth(0).click();await page.waitForTimeout(700);const fill1=parseFloat(await page.locator('#cinema-progress button').nth(0).evaluate(e=>getComputedStyle(e).getPropertyValue('--fill')));if(fill1<5)throw Error('Progress did not fill');await page.locator('#cinema-progress button').nth(49).click();if(await page.locator('#cinema-count').textContent()!=='50 / 100')throw Error('Segment seek');await page.getByRole('button',{name:'Siguiente foto'}).click();if(await page.locator('#cinema-count').textContent()!=='51 / 100')throw Error('Cinema next');await page.keyboard.press(' ');if(await page.getByRole('button',{name:'Reproducir',exact:true}).count()!==1)throw Error('Keyboard pause');await page.keyboard.press('Escape');
await page.getByRole('button',{name:'Japón',exact:true}).click();const japanCount=await page.evaluate(async()=> (await (await fetch('album.json')).json()).filter(p=>Number(p.date.slice(-2))>=10).length);const japanCountText=String(japanCount).replace(/\B(?=(\d{3})+(?!\d))/g,'.');await page.locator('.photo-card[data-gallery-start]').first().click();let caption=await page.locator('#viewer-caption').textContent();if(!caption.endsWith(`de ${japanCountText}`))throw Error('Full album filtered count');await page.keyboard.press('ArrowRight');caption=await page.locator('#viewer-caption').textContent();if(!caption.endsWith(`de ${japanCountText}`))throw Error('Full album keyboard navigation');await page.keyboard.press('Escape');await page.getByRole('button',{name:'Todo el viaje',exact:true}).click();await page.locator('.photo-card[data-gallery-start]').first().click();if(!(await page.locator('#viewer-caption').textContent()).endsWith('de 4.111'))throw Error('All photo count');await page.keyboard.press('Escape');await page.getByRole('button',{name:'Página siguiente'}).click();if(!(await page.locator('#page-count').textContent()).startsWith('Lugares 5'))throw Error('Pagination');
await page.getByRole('button',{name:'Siguiente parada'}).click();if(await page.locator('#stop-title').textContent()!=='Seúl')throw Error('Route');await page.getByRole('button',{name:'Animar ruta'}).click();await page.waitForTimeout(2500);await page.getByRole('button',{name:'Pausar ruta'}).click();
await page.locator('[data-stop="0"]').click();
if(await page.locator('[data-stop]').count()!==12)throw Error('Missing Barcelona endpoints');
await page.getByRole('button',{name:'Animar ruta'}).click();
await page.waitForTimeout(1800);
if(await page.locator('.vehicle-body.plane').count()!==1)throw Error('Departure plane missing');
await page.getByRole('button',{name:'Pausar ruta'}).click();
const paused=await page.evaluate(()=>legElapsed);await page.waitForTimeout(200);
if(await page.evaluate(()=>legElapsed)!==paused)throw Error('Route pause');
for(let i=0;i<11;i++){
  await page.evaluate(i=>{jumpTo(i);routePlaying=true;cameraPhase='travel';legElapsed=3600+travelDuration(i);routeLast=0;routeTick(performance.now());cancelAnimationFrame(routeFrame);},i);
  if(await page.locator('#stop-title').textContent()!==await page.evaluate(i=>tripStops[i+1].name,i))throw Error('Arrival '+i);
}
await page.evaluate(()=>{jumpTo(0);map.stop();routePlaying=true;cameraPhase='travel';legElapsed=18000;routeLast=0;routeTick(performance.now());cancelAnimationFrame(routeFrame);});
if(!await page.evaluate(()=>map.getZoom()===5&&map.getCenter().distanceTo(traveler.getLatLng())<500))throw Error('Camera must follow vehicle at steady zoom');
await page.locator('.map-shell').screenshot({path:'qa-route-follow.png'});
await page.evaluate(()=>stopRoute());
await page.evaluate(async()=>{jumpTo(0);await prepareFlash('Seúl');routePlaying=true;cameraPhase='travel';legElapsed=3600+travelDuration(0);routeLast=0;routeTick(performance.now());cancelAnimationFrame(routeFrame);routeTick(performance.now());cancelAnimationFrame(routeFrame);});
if(await page.locator('#route-flash').isHidden())throw Error('Arrival flash missing');
if(await page.evaluate(()=>flashPhotos.length)!==10)throw Error('Need ten photos');
if(await page.evaluate(()=>new Set(flashPhotos.map(p=>p.src)).size)!==10)throw Error('Duplicate photos');
if(!await page.evaluate(()=>flashPhotos.every(p=>cityPlaces['Seúl'].includes(p.place))))throw Error('Wrong city photos');
await page.evaluate(()=>stopRoute());
const flashPaused=await page.evaluate(()=>flashElapsed);await page.waitForTimeout(1100);
if(await page.evaluate(()=>flashElapsed)!==flashPaused)throw Error('Flash pause');
await page.setViewportSize({width:390,height:900});
await page.locator('.map-shell').screenshot({path:'qa-route-flash.png'});
for(let j=1;j<10;j++){
 await page.evaluate(j=>{routePlaying=true;flashElapsed=j*1000;routeLast=0;routeTick(performance.now());cancelAnimationFrame(routeFrame);},j);
 if(await page.locator('#route-flash-count').textContent()!==`${j+1} / 10`)throw Error('Flash counter');
}
await page.evaluate(()=>{flashElapsed=10000;routeLast=0;routeTick(performance.now());cancelAnimationFrame(routeFrame);});
if(!await page.locator('#route-flash').isHidden())throw Error('Flash did not end');
if(await page.evaluate(()=>legIndex)!==1)throw Error('Route did not continue');
await page.evaluate(()=>{jumpTo(10);routePlaying=true;cameraPhase='travel';legElapsed=3600+travelDuration(10);routeLast=0;routeTick(performance.now());});
if(!await page.locator('#route-flash').isHidden())throw Error('Barcelona must not show flash');
await page.evaluate(()=>{stopRoute();jumpTo(4);});
if(await page.locator('.vehicle-body.train').count()!==1)throw Error('Train missing');
await page.setViewportSize({width:1440,height:1000});
await page.locator('#ruta').scrollIntoViewIfNeeded();await page.waitForTimeout(2200);
await page.locator('.route-layout').screenshot({path:'qa-route-desktop.png'});
await page.setViewportSize({width:390,height:900});await page.waitForTimeout(500);
await page.locator('.route-layout').screenshot({path:'qa-route-mobile.png'});
await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForSelector('[data-stop="11"]');
await page.locator('[data-stop="11"]').click();if(await page.locator('#stop-title').textContent()!=='Barcelona')throw Error('Return Barcelona');
if(errors.length)throw Error(errors.join(';'));console.log('PASS: 1440/768/390 px, no overflow; map tiles, route animation, cinema pause/next/Escape, album filter/pagination/lightbox/keyboard; no JS errors.');await browser.close();server.close();})().catch(e=>{console.error(e);server.close();process.exit(1)});


