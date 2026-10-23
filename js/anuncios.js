/* ============ TRIKI - MOTOR DE ANUNCIOS v3 (AdsGram real + Monetag) ============ */
(function(){
  const CFG=window.TRIKI_CONFIG;
  const A=window.TrikiAnuncios={ ocupado:false };

  const monetagListo=()=> typeof window.show_11992190==='function';
  const adsgramListo=()=> typeof window.Adsgram==='object' && window.Adsgram!==null;
  const dbListo=()=> window.TrikiDB && window.TrikiDB.listo;

  function toast(msg){
    const t=document.createElement('div');
    t.textContent=msg;
    t.style.cssText='position:fixed;left:50%;bottom:120px;transform:translateX(-50%);z-index:300;background:rgba(10,6,18,.92);border:1px solid rgba(255,255,255,.25);color:#fff;font-size:12px;font-weight:700;padding:10px 16px;border-radius:100px;backdrop-filter:blur(10px)';
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),2500);
  }

  // UN anuncio a la vez. Sin demo. Sin regalar monedas si no hay real.
  A.recompensado=function(plat, cb){
    if(A.ocupado){ toast('Espera, hay un anuncio activo'); return; }
    if(!dbListo()){ toast('Conectando... intenta en unos segundos'); return; }
    A.ocupado=true;
    let fin=false;
    const done=(ok)=>{ if(fin)return; fin=true; A.ocupado=false;
      if(ok&&cb) cb(); else if(!ok) toast('Anuncio no disponible ahora'); };
    const guard=setTimeout(()=>done(false),45000);

    if(plat==='monetag' && monetagListo()){
      try{
        window.show_11992190()
          .then(()=>{ clearTimeout(guard); done(true); })
          .catch(()=>{ clearTimeout(guard); done(false); });
      }catch(e){ clearTimeout(guard); done(false); }
    }
    else if(plat==='adsgram' && adsgramListo()){
      try{
        // Método OFICIAL de AdsGram para Telegram
        const controller=window.Adsgram.init({ blockId: CFG.adsgram.rewarded });
        controller.show()
          .then(()=>{ clearTimeout(guard); done(true); })
          .catch(()=>{ clearTimeout(guard); done(false); });
      }catch(e){ clearTimeout(guard); done(false); }
    }
    else { clearTimeout(guard); done(false); }
  };

  // BANNER DE ABAJO: rota cada 30s (AdsGram ↔ Monetag), +10 por rotación
  let turno=0, bannerOcupado=false;
  function pintar(plat){
    const slot=document.getElementById('bannerSlot'); if(!slot) return;
    const color=(plat==='adsgram')?'#8beeff':'#ffd21f';
    const nombre=(plat==='adsgram')?'AdsGram':'Monetag';
    slot.innerHTML='<div style="width:100%;height:100%;display:grid;place-items:center;font-size:11px;font-weight:800;letter-spacing:1px;color:'+color+'">'+nombre+'</div>';
  }
  function rotar(){
    if(bannerOcupado) return;
    bannerOcupado=true;
    const plat=(turno%2===0)?'adsgram':'monetag'; turno++;
    pintar(plat);
    setTimeout(()=>{
      if(dbListo() && window.TrikiSaldo) window.TrikiSaldo.sumar(CFG.recompensas.bannerAbajo);
      bannerOcupado=false;
    },30000);
  }
  setInterval(rotar,30000);
  setTimeout(rotar,3000);

  // pedido del reproductor (anti-colisión)
  A.reproductorPide=function(cb){ A.recompensado('monetag', cb); };
})();
