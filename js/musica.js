/* ============ TRIKI - REPRODUCTOR DE MÚSICA v2 ============ */
(function(){
  // c = portada/fondo (gradiente), g = color de respaldo y glow (si no hay portada real)
  const CANCIONES=[
    { t:'Neon Dreams',  a:'Triki Sounds', c:'linear-gradient(135deg,#ff2e93,#b04dff)', g:'#ff2e93', dur:216 },
    { t:'Cyber Wave',   a:'Triki Sounds', c:'linear-gradient(135deg,#28e0ff,#0a5bd6)', g:'#28e0ff', dur:198 },
    { t:'Golden Rush',  a:'Triki Sounds', c:'linear-gradient(135deg,#ffd21f,#ff7a00)', g:'#ffd21f', dur:232 },
    { t:'Toxic Garden', a:'Triki Sounds', c:'linear-gradient(135deg,#3dff7c,#0a8f4e)', g:'#3dff7c', dur:187 },
    { t:'Sunset Drive', a:'Triki Sounds', c:'linear-gradient(135deg,#ff7a00,#ff2e93)', g:'#ff7a00', dur:224 },
    { t:'Ocean Pulse',  a:'Triki Sounds', c:'linear-gradient(135deg,#00d9a3,#28e0ff)', g:'#00d9a3', dur:205 },
    { t:'Midnight Sky', a:'Triki Sounds', c:'linear-gradient(135deg,#6a4bff,#ff2e93)', g:'#6a4bff', dur:241 },
    { t:'Neon Jungle',  a:'Triki Sounds', c:'linear-gradient(135deg,#ffd21f,#3dff7c)', g:'#aaff00', dur:193 }
  ];
  const DEMO_SPEED=20;
  let songIdx=0, playing=false, progress=0, adT=null, pendingCb=null;

  const $=id=>document.getElementById(id);
  const musicBg=$('musicBg'), cover=$('cover'), mTitle=$('mTitle'), mArtist=$('mArtist');
  const mFill=$('mFill'), mCur=$('mCur'), mDur=$('mDur');
  const mPlay=$('mPlay'), mPrev=$('mPrev'), mNext=$('mNext');
  const miniPlayer=$('miniPlayer'), miniCover=$('miniCover'), miniPrev=$('miniPrev'), miniPlay=$('miniPlay'), miniNext=$('miniNext');
  const searchInput=$('searchInput'), searchBtn=$('searchBtn'), searchResults=$('searchResults');
  const musicAdSlot=$('musicAdSlot'), musicAdCount=$('musicAdCount'), musicAdSkip=$('musicAdSkip');
  const ad30Full=$('ad30Full'), adCount=$('adCount'), adSkip=$('adSkip');
  const pJuego=$('p-juego');

  const SVG_PLAY='<svg viewBox="0 0 24 24" width="26" height="26" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
  const SVG_PAUSE='<svg viewBox="0 0 24 24" width="26" height="26" fill="#fff"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
  const SVG_PREV='<svg viewBox="0 0 24 24" width="24" height="24" fill="#fff"><path d="M6 6h2v12H6zM20 6l-10 6 10 6z"/></svg>';
  const SVG_NEXT='<svg viewBox="0 0 24 24" width="24" height="24" fill="#fff"><path d="M16 6h2v12h-2zM4 6l10 6-10 6z"/></svg>';
  mPlay.innerHTML=SVG_PLAY; mPrev.innerHTML=SVG_PREV; mNext.innerHTML=SVG_NEXT;
  miniPlay.textContent='▶';

  const fmt=s=>{ s=Math.max(0,Math.floor(s)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };

  function setSong(i){
    songIdx=i; progress=0;
    const s=CANCIONES[i];
    musicBg.style.background=s.c;                       // fondo ilumina TODA la pantalla
    cover.style.background=s.c;                         // portada
    cover.style.boxShadow='0 14px 34px rgba(0,0,0,.45), 0 0 80px 22px '+s.g+'88'; // halo que ilumina alrededor
    miniCover.style.background=s.c;
    mTitle.textContent=s.t; mArtist.textContent=s.a;
    mDur.textContent=fmt(s.dur); mCur.textContent='0:00'; mFill.style.width='0%';
    $('songName').textContent='Sonando: '+s.t;
  }

  /* ---- buscador con listado de resultados ---- */
  function pintaResultados(){
    const q=searchInput.value.toLowerCase().trim();
    if(!q){ searchResults.hidden=true; searchResults.innerHTML=''; return; }
    const lista=CANCIONES.filter(s=> s.t.toLowerCase().includes(q) || s.a.toLowerCase().includes(q));
    searchResults.innerHTML='';
    if(!lista.length){ searchResults.hidden=true; return; }
    lista.forEach(s=>{
      const i=CANCIONES.indexOf(s);
      const d=document.createElement('div'); d.className='sr-item';
      d.innerHTML='<div class="sr-thumb" style="background:'+s.c+'"></div><div><b>'+s.t+'</b><span>'+s.a+'</span></div>';
      d.addEventListener('click',()=>{ setSong(i); playing=true; mPlay.innerHTML=SVG_PAUSE; miniPlay.textContent='⏸';
        searchResults.hidden=true; searchInput.value=''; });
      searchResults.appendChild(d);
    });
    searchResults.hidden=false;
  }
  searchInput.addEventListener('input',pintaResultados);
  searchBtn.addEventListener('click',pintaResultados);

  /* ---- anuncio de 30s al terminar canción, en el slot de la pestaña activa ---- */
  function contar30(el, cb){
    pendingCb=cb; let s=30; el.textContent=s;
    adT=setInterval(()=>{ s--; el.textContent=s;
      if(s<=0){ clearInterval(adT); adT=null; const f=pendingCb; pendingCb=null; f(); } },1000);
  }
  function saltarAnuncio(){
    if(adT){ clearInterval(adT); adT=null; const f=pendingCb; pendingCb=null; if(f) f(); }
  }
  adSkip.addEventListener('click',saltarAnuncio);
  musicAdSkip.addEventListener('click',saltarAnuncio);

  function finCancion(){
    playing=false; mPlay.innerHTML=SVG_PLAY; miniPlay.textContent='▶';
    const trasAnuncio=()=>{ setSong((songIdx+1)%CANCIONES.length); playing=true;
      mPlay.innerHTML=SVG_PAUSE; miniPlay.textContent='⏸'; };
    if(pJuego.classList.contains('activa')){
      miniPlayer.hidden=true; ad30Full.hidden=false;
      contar30(adCount, ()=>{ ad30Full.hidden=true; miniPlayer.hidden=false; trasAnuncio(); });
    } else {
      musicAdSlot.hidden=false;
      contar30(musicAdCount, ()=>{ musicAdSlot.hidden=true; trasAnuncio(); });
    }
  }

  /* ---- controles (panel grande y mini del juego) ---- */
  function togglePlay(){ playing=!playing; mPlay.innerHTML= playing?SVG_PAUSE:SVG_PLAY; miniPlay.textContent= playing?'⏸':'▶'; }
  function next(){ setSong((songIdx+1)%CANCIONES.length); }
  function prev(){ setSong((songIdx-1+CANCIONES.length)%CANCIONES.length); }
  mPlay.addEventListener('click',togglePlay); miniPlay.addEventListener('click',togglePlay);
  mNext.addEventListener('click',next); miniNext.addEventListener('click',next);
  mPrev.addEventListener('click',prev); miniPrev.addEventListener('click',prev);

  /* ---- progreso ---- */
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
