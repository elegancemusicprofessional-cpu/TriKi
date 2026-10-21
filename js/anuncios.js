/* ============ TRIKI - MOTOR DE ANUNCIOS (rotación + anti-colisión) ============ */
(function(){
  const CFG=window.TRIKI_CONFIG;
  const A=window.TrikiAnuncios={ ocupado:false, cola:[], sdkAdsgram:false };

  // carga SDK de AdsGram una sola vez
  (function(){
    const s=document.createElement('script');
    s.src=CFG.adsgram.sdk; s.async=true;
    s.onload=()=>{ A.sdkAdsgram=true; };
    document.head.appendChild(s);
  })();

  const monetagListo=()=> typeof window.show_11992190==='function';

  function liberar(){ A.ocupado=false; const sig=A.cola.shift(); if(sig) sig(); }
  function ocupar(fn){ if(A.ocupado){ A.cola.push(fn); return; } A.ocupado=true; fn(); }

  // overlay demo de 30s (respaldo si el SDK real no carga)
  function demo30(cb){
    const ov=document.createElement('div');
    ov.className='game-overlay'; ov.style.position='fixed'; ov.style.zIndex=200;
    ov.innerHTML='<div class="ov-title">ANUNCIO 30s</div><div class="ov-title" style="font-size:40px">30</div>';
    document.body.appendChild(ov);
    let s=30; const el=ov.querySelectorAll('.ov-title')[1];
    const t=setInterval(()=>{ s--; el.textContent=s;
      if(s<=0){ clearInterval(t); ov.remove(); cb(); } },1000);
  }

  // ---- ANUNCIO RECOMPENSADO REAL (con respaldo demo) ----
  A.recompensado=function(plat, cb){
    ocupar(()=>{
      let fin=false;
      const terminar=(ok)=>{ if(fin) return; fin=true; clearTimeout(guard);
        if(ok&&cb) cb(); liberar(); };
      const guard=setTimeout(()=>terminar(false),60000); // seguridad: nunca queda trabado

      if(plat==='monetag' && monetagListo()){
        try{ window.show_11992190().then(()=>terminar(true)).catch(()=>terminar(false)); }
        catch(e){ terminar(false); }
      } else if(plat==='adsgram' && A.sdkAdsgram && window.Adgram){
        try{
          const inst=new window.Adgram(CFG.adsgram.rewarded);
          inst.show().then(()=>terminar(true)).catch(()=>terminar(false));
        }catch(e){ terminar(false); }
      } else {
        demo30(()=>terminar(true)); // respaldo para pruebas
      }
    });
  };

  // ---- BANNER DE ABAJO: rotación AdsGram <-> Monetag cada 30s (+10 c/u) ----
  let turno=0;
  function pintarBanner(plat){
    const slot=document.getElementById('bannerSlot');
    if(!slot) return;
    slot.innerHTML='';
    if(plat==='adsgram'){
      try{
        if(A.sdkAdsgram && window.Adgram){
          const d=document.createElement('div'); d.id='ag-banner'; slot.appendChild(d);
          const inst=new window.Adgram(CFG.adsgram.banner);
          if(inst && inst.show) inst.show();
        }
      }catch(e){}
      setTimeout(()=>{ if(!slot.childElementCount) slot.innerHTML='<div style="width:100%;height:100%;display:grid;place-items:center;font-size:11px;font-weight:800;color:#8beeff">AdsGram</div>'; },800);
    } else {
      try{
        const s=document.createElement('script');
        s.src='//libtl.com/sdk.js';
        s.setAttribute('data-zone',CFG.monetag.banner);
        s.setAttribute('data-sdk','show_'+CFG.monetag.banner);
        slot.appendChild(s);
      }catch(e){}
      setTimeout(()=>{ if(!slot.childElementCount) slot.innerHTML='<div style="width:100%;height:100%;display:grid;place-items:center;font-size:11px;font-weight:800;color:#ffd21f">Monetag</div>'; },800);
    }
  }
  function rotar(){
    ocupar(()=>{
      const plat=(turno%2===0)?'adsgram':'monetag'; turno++;
      pintarBanner(plat);
      setTimeout(()=>{
        if(window.TrikiSaldo) window.TrikiSaldo.sumar(CFG.recompensas.bannerAbajo);
        liberar();
      },30000);
    });
  }
  setInterval(rotar, 30000); // un banner cada 30s, siempre
  setTimeout(rotar, 3000);  // primer banner al abrir

  // ---- pedido del reproductor (anti-colisión): espera su turno en la cola ----
  A.reproductorPide=function(cb){ A.recompensado('monetag', cb); };
})();
