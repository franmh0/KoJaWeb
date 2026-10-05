'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const formatCount = value => String(value).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  let all = [], visible = [], current = 0, page = 0;
  const perPage = 12;
  const placeNames = {Salida:'Salida',Seul:'Seúl',Gwanghwamun:'Gwanghwamun',OlympicPark:'Olympic Park',Busan:'Busan',Namsan:'Namsan',Myeongdon:'Myeongdong',Akihabara:'Akihabara',Shibuya:'Shibuya',Asakusa:'Asakusa',Odaiba:'Odaiba',Nagoya:'Nagoya',Arashiyama:'Arashiyama',FushimiInari:'Fushimi Inari',Nara:'Nara',Hiroshima:'Hiroshima',Osaka:'Osaka',Pokemon:'Pokémon',Mitaka:'Mitaka',Descanso:'Día tranquilo',Kamakura:'Kamakura',Roppongi:'Roppongi'};
  const placeByDay = new Map(Object.entries({
    '01':'Salida','02':'Seul','03':'Gwanghwamun','04':'OlympicPark','05':'Busan','06':'Busan','07':'Busan','08':'Namsan','09':'Myeongdon','10':'Akihabara','11':'Shibuya','12':'Asakusa','13':'Odaiba','14':'Nagoya','15':'Arashiyama','16':'FushimiInari','17':'Nara','18':'Hiroshima','19':'Osaka','20':'Pokemon','21':'Mitaka','22':'Descanso','23':'Kamakura','24':'Roppongi','25':'Descanso','26':'Descanso'
  }).map(([day,name])=>[day,placeNames[name]]));

  function renderCards() {
    const groups = new Map();
    visible.forEach((photo,index) => {
      const place=photo.place||'Sin ubicación';
      if(!groups.has(place)) groups.set(place,[]);
      groups.get(place).push({photo,index});
    });
    const entries=[...groups.entries()];
    const pageCount=Math.ceil(entries.length/perPage);
    page=Math.max(0,Math.min(page,pageCount-1));
    $('#book').innerHTML=entries.slice(page*perPage,(page+1)*perPage).map(([place,items],j)=>{
      const cover=items[Math.floor(Math.random()*items.length)];
      return `<button class="photo-card" data-gallery-start="${cover.index}" style="--rotation:${[-1.5,1,-.7,1.8][j%4]}deg"><img src="${cover.photo.src}" alt="${place}, ${items.length} fotos" loading="lazy"><small>${items.length} FOTOS · ${cover.photo.day?`${cover.photo.day} AGOSTO 2024`:cover.photo.date}</small><span>${place}</span></button>`;
    }).join('');
    $('#page-count').textContent=`Lugares ${page*perPage+1}–${Math.min((page+1)*perPage,entries.length)} de ${entries.length}`;
    $('#book-prev').disabled=page===0;
    $('#book-next').disabled=page>=pageCount-1;
  }

  function showPhoto(index) {
    current=(index+visible.length)%visible.length;
    const photo=visible[current];
    $('#viewer-img').src=photo.src;
    $('#viewer-img').alt=`${photo.place}, ${photo.day||photo.date} agosto 2024`;
    $('#viewer-caption').textContent=`${photo.place} · ${photo.day?`${photo.day} agosto 2024`:photo.date} · ${current+1} de ${formatCount(visible.length)}`;
  }

  function filter(kind) {
    visible=all.filter(photo=>kind==='all'||(kind==='korea'?photo.country==='Corea':kind==='japan'?photo.country==='Japón':photo.country==='España'));
    page=0;
    document.querySelectorAll('[data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===kind)));
    renderCards();
  }

  document.addEventListener('click',event=>{
    const cover=event.target.closest('[data-gallery-start]');
    if(cover){event.preventDefault();event.stopImmediatePropagation();showPhoto(Number(cover.dataset.galleryStart));$('#viewer').showModal();return;}
    const filterButton=event.target.closest('[data-filter]');
    if(filterButton){event.preventDefault();event.stopImmediatePropagation();filter(filterButton.dataset.filter);return;}
    if(event.target.closest('#book-prev')){event.preventDefault();event.stopImmediatePropagation();page--;renderCards();return;}
    if(event.target.closest('#book-next')){event.preventDefault();event.stopImmediatePropagation();page++;renderCards();}
  },true);
  document.addEventListener('click',event=>{
    if(event.target.closest('#viewer-prev')){event.stopImmediatePropagation();showPhoto(current-1);}
    if(event.target.closest('#viewer-next')){event.stopImmediatePropagation();showPhoto(current+1);}
  },true);
  document.addEventListener('keydown',event=>{
    if(!$('#viewer').open)return;
    if(event.key==='ArrowRight'){event.preventDefault();event.stopImmediatePropagation();showPhoto(current+1);}
    if(event.key==='ArrowLeft'){event.preventDefault();event.stopImmediatePropagation();showPhoto(current-1);}
  },true);

  fetch('album.json').then(response=>{if(!response.ok)throw Error('No se pudo cargar el álbum');return response.json();}).then(data=>{
    all=data.map(photo=>{
      const day=photo.date.match(/2024-08-(\d{2})/)?.[1]||null;
      return {...photo,day,place:day?placeByDay.get(day)||'Recuerdos del día':'Sin fecha',country:day==='01'?'España':day&&Number(day)<10?'Corea':day?'Japón':'Sin fecha'};
    });
    visible=all;
    $('#photo-count').textContent=formatCount(all.length);
    renderCards();
  }).catch(()=>{ $('#book').textContent='No se ha podido cargar la colección completa. Recarga la página para volver a intentarlo.'; });
})();
