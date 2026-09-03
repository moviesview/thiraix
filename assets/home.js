(() => {
  const orders = window.THIRAI_X_WATCH_ORDERS || [];
  const thumbs = window.THIRAI_X_THUMBNAILS || {};
  const $ = s => document.querySelector(s);
  const heroTrack = $('#heroTrack');
  const heroDots = $('#heroDots');
  const heroPrev = $('#heroPrev');
  const heroNext = $('#heroNext');
  const categoryCards = $('#categoryCards');
  const searchToggle = $('#searchToggle');
  const searchBar = $('#searchBar');
  const searchInput = $('#searchInput');
  const searchClose = $('#searchClose');
  let heroIndex = 0;
  let heroTimer = null;
  let scrollTimer = null;

  function key(value='') {
    return String(value).toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  }
  const aliases = {
    'spiderman':'spider man','spiderman 2':'spider man 2','spiderman 3':'spider man 3',
    'the amazing spiderman':'the amazing spider man','the amazing spiderman 2':'the amazing spider man 2',
    'x men first class':'x men first class','dark phoenix':'x men dark phoenix','avengers':'the avengers'
  };
  function posterFor(collection) {
    for (const item of collection.items || []) {
      const raw = key(item);
      const normalized = aliases[raw] || raw;
      if (thumbs[normalized]) return thumbs[normalized];
    }
    return collection.banner || '';
  }
  function collectionUrl(id) { return `collection.html?collection=${encodeURIComponent(id)}`; }

  function buildHero() {
    if (!heroTrack || !heroDots) return;
    heroTrack.innerHTML=''; heroDots.innerHTML='';
    orders.forEach((c,i) => {
      const slide=document.createElement('article');
      slide.className='hero-slide';
      slide.dataset.index=String(i);
      slide.innerHTML=`<div class="hero-media"><img src="${c.banner || posterFor(c)}" alt="${c.title} banner" loading="${i===0?'eager':'lazy'}" /></div><div class="hero-overlay"></div><div class="hero-content"><p>${c.eyebrow||'COLLECTION'}</p><h1>${c.title}</h1><span>${c.description||''}</span><div class="hero-actions"><button type="button" class="hero-cta">View collection</button><small>${c.presentation||''}</small></div></div>`;
      slide.querySelector('.hero-cta').addEventListener('click',()=>location.href=collectionUrl(c.id));
      heroTrack.appendChild(slide);
      const dot=document.createElement('button'); dot.type='button'; dot.setAttribute('aria-label',`Show ${c.title}`); dot.addEventListener('click',()=>goTo(i)); heroDots.appendChild(dot);
    });
    updateDots(); restartTimer();
  }
  function buildCollections(filter='') {
    if (!categoryCards) return;
    const q=filter.trim().toLowerCase();
    categoryCards.innerHTML='';
    orders.filter(c=>!q || `${c.title} ${c.eyebrow} ${c.description} ${c.presentation}`.toLowerCase().includes(q)).forEach(c=>{
      const card=document.createElement('button'); card.type='button'; card.className='category-card';
      const poster=posterFor(c);
      card.innerHTML=`<div class="category-card-media"><img src="${poster}" alt="${c.title}" loading="lazy" /></div><div class="category-card-overlay"></div><div class="category-card-body"><p>${c.eyebrow||'COLLECTION'}</p><h3>${c.title}</h3><strong>${c.presentation||c.description||''}</strong><span>Open collection →</span></div>`;
      card.addEventListener('click',()=>location.href=collectionUrl(c.id));
      categoryCards.appendChild(card);
    });
  }
  function updateDots(){ heroDots?.querySelectorAll('button').forEach((d,i)=>d.classList.toggle('active',i===heroIndex)); }
  function goTo(index, behavior='smooth') {
    const slides=[...(heroTrack?.children||[])]; if(!slides.length) return;
    heroIndex=(index+slides.length)%slides.length;
    heroTrack.scrollTo({left:slides[heroIndex].offsetLeft,behavior}); updateDots(); restartTimer();
  }
  function restartTimer(){ clearInterval(heroTimer); heroTimer=setInterval(()=>goTo(heroIndex+1),5500); }
  function syncIndexFromScroll(){
    clearTimeout(scrollTimer);
    scrollTimer=setTimeout(()=>{
      const slides=[...(heroTrack?.children||[])]; if(!slides.length) return;
      const x=heroTrack.scrollLeft;
      let best=0,dist=Infinity;
      slides.forEach((s,i)=>{ const d=Math.abs(s.offsetLeft-x); if(d<dist){dist=d;best=i;} });
      heroIndex=best; updateDots();
    },80);
  }
  heroPrev?.addEventListener('click',()=>goTo(heroIndex-1));
  heroNext?.addEventListener('click',()=>goTo(heroIndex+1));
  heroTrack?.addEventListener('scroll',syncIndexFromScroll,{passive:true});
  heroTrack?.addEventListener('pointerdown',restartTimer,{passive:true});
  heroTrack?.addEventListener('mouseenter',()=>clearInterval(heroTimer));
  heroTrack?.addEventListener('mouseleave',restartTimer);
  searchToggle?.addEventListener('click',()=>{searchBar?.classList.remove('hidden');searchInput?.focus();});
  searchClose?.addEventListener('click',()=>{if(searchInput)searchInput.value='';searchBar?.classList.add('hidden');buildCollections('');});
  searchInput?.addEventListener('input',e=>buildCollections(e.target.value));
  buildHero(); buildCollections();
  const loader=$('#siteLoader'); if(loader){loader.classList.add('hide');setTimeout(()=>loader.classList.add('hidden'),320);}
})();
