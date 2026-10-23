/* ============ TRIKI - MÚSICA v2 (Jamendo real) ============ */
(function(){
  const $=id=>document.getElementById(id);
  const S=()=>window.TrikiSaldo;
  const A=()=>window.TrikiAnuncios;
  const CFG=window.TRIKI_CONFIG;

  const JAMENDO_ID='8061d2e4';
  const API='https://api.jamendo.com/v3.0/tracks/?client_id='+JAMENDO_ID+'&format=json&limit=25&audioformat=mp32&include=+musicinfo';
  let tracks=[], idx=0, audio=null, progresoT=null, anunciando=false;

  function grad(){
    const cols=[['#ff2e93','#b04dff'],['#28e0ff','#3dff7c'],['#ffd21f','#ff7a00'],['#b04dff','#28e0ff']];
    const c=cols[Math.floor(Math.random()*cols.length)];
    return 'linear-gradient(135deg,'+c[0]+','+c[1]+')';
  }

  async function cargar(){
    try{
      const r=await fetch(API); const j=await r.json();
      tracks=(j.results||[]).filter(t=>t.audio && t.image);
      if(tracks.length>0) mostrar();
    }catch(e){ console.error('jamendo error',e); }
  }

  function mostrar(){
    const t=tracks[idx]; if(!t) return;
    $('mTitle').textContent=t.name||'Sin título';
    $('mArtist').textContent=t.artist_name||'Artista';
    $('cover').style.background='url('+t.image+') center/cover';
    $('songName').textContent='Sonando: '+(t.name||'?');
    const g=grad();
    $('musicBg').style.background=g;
    $('miniCover').style.background=g;
  }

  function fmt(s){ const m=Math.floor(s/60), sec=Math.floor(s%60); return m+':'+(sec<10?'0':'')+sec; }

  function tocar(){
    if(!tracks[idx]) return;
    if(!audio){ audio=new Audio(); audio.addEventListener('ended', siguiente); }
    audio.src=tracks[idx].audio;
    audio.play().catch(()=>{});
    $('mPlay').innerHTML='<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
    clearInterval(progresoT);
    progresoT=setInterval(()=>{
      if(!audio||!audio.duration) return;
      $('mFill').style.width=(audio.currentTime/audio.duration*100)+'%';
      $('mCur').textContent=fmt(audio.currentTime);
      $('mDur').textContent=fmt(audio.duration);
    },500);
  }

  function pausar(){ if(audio) audio.pause(); $('mPlay').innerHTML='<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'; }

  function anuncioAntesDeCambiar(cb){
    if(anunciando||!A()) { cb(); return; }
    anunciando=true;
    const ov=document.getElementById('ad30Full');
    if(ov){ ov.hidden=false; $('adCount').textContent='30'; }
    let s=30;
    const t=setInterval(()=>{ s--;
      if(ov && $('adCount')) $('adCount').textContent=s;
      if(s<=0){ clearInterval(t); if(ov) ov.hidden=true; anunciando=false;
        if(S()) S().sumar(CFG.recompensas.bannerAbajo);
        cb();
      }
    },1000);
  }

  function siguiente(){
    anuncioAntesDeCambiar(()=>{ idx=(idx+1)%tracks.length; mostrar(); tocar(); });
  }
  function anterior(){ anuncioAntesDeCambiar(()=>{ idx=(idx-1+tracks.length)%tracks.length; mostrar(); tocar(); }); }

  $('mPlay').addEventListener('click',()=>{ if(audio && !audio.paused) pausar(); else tocar(); });
  $('mNext').addEventListener('click',siguiente);
  $('mPrev').addEventListener('click',anterior);
  $('miniPlay').addEventListener('click',()=>{ if(audio && !audio.paused) pausar(); else tocar(); });
  $('miniNext').addEventListener('click',siguiente);
  $('miniPrev').addEventListener('click',anterior);

  // búsqueda
  $('searchBtn').addEventListener('click', async ()=>{
    const q=$('searchInput').value.trim(); if(!q) return;
    try{
      const r=await fetch('https://api.jamendo.com/v3.0/tracks/?client_id='+JAMENDO_ID+'&format=json&limit=15&search='+encodeURIComponent(q));
      const j=await r.json();
      const res=$('searchResults'); res.innerHTML=''; res.hidden=false;
      (j.results||[]).forEach(t=>{
        const d=document.createElement('div'); d.className='sr-item';
        d.innerHTML='<img class="sr-thumb" src="'+t.image+'"><div><b>'+(t.name||'?')+'</b><span>'+(t.artist_name||'?')+'</span></div>';
        d.addEventListener('click',()=>{
          tracks.splice(idx+1,0,t); idx++; mostrar(); tocar();
          res.hidden=true; $('searchInput').value='';
        });
        res.appendChild(d);
      });
    }catch(e){}
  });
  document.addEventListener('click',(e)=>{
    const r=$('searchResults');
    if(!r.contains(e.target) && e.target!==$('searchBtn') && e.target!==$('searchInput')) r.hidden=true;
  });

  cargar();
  mostrar();
})();
