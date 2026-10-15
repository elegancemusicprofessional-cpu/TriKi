/* ============ TRIKI - REPRODUCTOR DE MÚSICA ============ */
(function(){
  const CANCIONES=[
    { t:'Neon Dreams',  a:'Triki Sounds', c:'linear-gradient(135deg,#ff2e93,#b04dff)', dur:216 },
    { t:'Cyber Wave',   a:'Triki Sounds', c:'linear-gradient(135deg,#28e0ff,#0a5bd6)', dur:198 },
    { t:'Golden Rush',  a:'Triki Sounds', c:'linear-gradient(135deg,#ffd21f,#ff7a00)', dur:232 },
    { t:'Toxic Garden', a:'Triki Sounds', c:'linear-gradient(135deg,#3dff7c,#0a8f4e)', dur:187 },
    { t:'Sunset Drive', a:'Triki Sounds', c:'linear-gradient(135deg,#ff7a00,#ff2e93)', dur:224 },
    { t:'Ocean Pulse',  a:'Triki Sounds', c:'linear-gradient(135deg,#00d9a3,#28e0ff)', dur:205 },
    { t:'Midnight Sky', a:'Triki Sounds', c:'linear-gradient(135deg,#6a4bff,#ff2e93)', dur:241 },
    { t:'Neon Jungle',  a:'Triki Sounds', c:'linear-gradient(135deg,#ffd21f,#3dff7c)', dur:193 }
  ];
  const DEMO_SPEED=20; // acelera el progreso solo para probar el flujo rápido
  let songIdx=0, playing=false, progress=0, adTimer=null;

  const musicBg=document.getElementById('musicBg');
  const cover=document.getElementById('cover');
  const mTitle=document.getElementById('mTitle'), mArtist=document.getElementById('mArtist');
  const mFill=document.getElementById('mFill'), mCur=document.getElementById('mCur'), mDur=document.getElementById('mDur');
  const mPlay=document.getElementById('mPlay'), mPrev=document.getElementById('mPrev'), mNext=document.getElementById('mNext');
  const wheelBtn=document.getElementById('wheelBtn'), colorPanel=document.getElementById('colorPanel'), colorList=document.getElementById('colorList');
  const searchInput=document.getElementById('searchInput'), searchBtn=document.getElementById('searchBtn');
  const musicAdSlot=document.getElementById('musicAdSlot'), musicAdCount=document.getElementById('musicAdCount'), musicAdSkip=document.getElementById('musicAdSkip');

  const SVG_PLAY='<svg viewBox="0 0 24 24" width="26" height="26" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
  const SVG_PAUSE='<svg viewBox="0 0 24 24" width="26" height="26" fill="#fff"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
  const SVG_PREV='<svg viewBox="0 0 24 24" width="24" height="24" fill="#fff"><path d="M6 6h2v12H6zM20 6l-10 6 10 6z"/></svg>';
  const SVG_NEXT='<svg viewBox="0 0 24 24" width="24" height="24" fill="#fff"><path d="M16 6h2v12h-2zM4 6l10 6-10 6z"/></svg>';
  mPlay.innerHTML=SVG_PLAY; mPrev.innerHTML=SVG_PREV; mNext.innerHTML=SVG_NEXT;

  const fmt=s=>{ s=Math.max(0,Math.floor(s)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
  const filtro=()=>{ const q=searchInput.value.toLowerCase().trim();
    return q? CANCIONES.filter(s=>s.t.toLowerCase().includes(q)) : CANCIONES; };

  function pintaColores(){
    colorList.innerHTML='';
    filtro().forEach(s=>{
      const i=CANCIONES.indexOf(s);
      const d=document.createElement('div');
      d.className='color-dot'+(i===songIdx?' sel':'');
      d.style.background=s.c; d.title=s.t;
      d.addEventListener('click',()=>{ setSong(i); });
      colorList.appendChild(d);
    });
  }

  function setSong(i){
    songIdx=i; progress=0;
    const s=CANCIONES[i];
    musicBg.style.background=s.c;   // fondo refleja el tono de la portada
    cover.style.background=s.c;     // portada dentro del panel cristal
    mTitle.textContent=s.t; mArtist.textContent=s.a;
    mDur.textContent=fmt(s.dur); mCur.textContent='0:00'; mFill.style.width='0%';
    const sn=document.getElementById('songName');
    if(sn) sn.textContent='Sonando: '+s.t;
    pintaColores();
  }

  function finCancion(){
    playing=false; mPlay.innerHTML=SVG_PLAY;
    // aparece el slot tipo banner con el anuncio de 30s (no sale "en la cara")
    musicAdSlot.hidden=false;
    let s=30; musicAdCount.textContent=s;
    adTimer=setInterval(()=>{
      s--; musicAdCount.textContent=s;
      if(s<=0){ clearInterval(adTimer); trasAnuncio(); }
    },1000);
  }
  function trasAnuncio(){
    musicAdSlot.hidden=true;
    setSong((songIdx+1)%CANCIONES.length);
    playing=true; mPlay.innerHTML=SVG_PAUSE;
  }
  musicAdSkip.addEventListener('click',()=>{ clearInterval(adTimer); trasAnuncio(); });

  mPlay.addEventListener('click',()=>{ playing=!playing; mPlay.innerHTML= playing?SVG_PAUSE:SVG_PLAY; });
  mNext.addEventListener('click',()=>{ setSong((songIdx+1)%CANCIONES.length); });
  mPrev.addEventListener('click',()=>{ setSong((songIdx-1+CANCIONES.length)%CANCIONES.length); });
  wheelBtn.addEventListener('click',()=>{ colorPanel.hidden=!colorPanel.hidden; });
  searchInput.addEventListener('input',pintaColores);
  searchBtn.addEventListener('click',pintaColores);

  let last=performance.now();
  function tick(now){
    const dt=Math.min((now-last)/1000,0.05); last=now;
    if(playing){
      progress += (dt*DEMO_SPEED)/CANCIONES[songIdx].dur;
      if(progress>=1){ progress=1; finCancion(); }
      mFill.style.width=(progress*100)+'%';
      mCur.textContent=fmt(progress*CANCIONES[songIdx].dur);
    }
    requestAnimationFrame(tick);
  }

  setSong(0);
  requestAnimationFrame(tick);
})();
