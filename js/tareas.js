/* ============ TRIKI - TAREAS v4 (anuncios reales + enlaces reales) ============ */
(function(){
  const $=id=>document.getElementById(id);
  const S=()=>window.TrikiSaldo;
  const DB=()=>window.TrikiDB;
  const A=()=>window.TrikiAnuncios;
  const CFG=window.TRIKI_CONFIG;

  const fmtK=n=>{
    if(n>=1e6) return (n/1e6).toFixed(n%1e6?1:0).replace('.0','')+'M';
    if(n>=1000) return (n/1000).toFixed(n%1000?1:0).replace('.0','')+'k';
    return ''+n;
  };
  const pintaSaldo=()=>{ $('tBalance').textContent=fmtK(S()?S().valor:0); };
  if(S()) S().on(pintaSaldo);
  window.addEventListener('triki-db-listo', ()=>{ if(S()) S().on(pintaSaldo); });

  // sub-pestañas
  document.querySelectorAll('.t-tab').forEach(b=>{
    b.addEventListener('click',()=>{
      document.querySelectorAll('.t-tab').forEach(x=>x.classList.remove('activa'));
      document.querySelectorAll('.t-page').forEach(x=>x.classList.remove('activa'));
      b.classList.add('activa');
      $(b.dataset.t).classList.add('activa');
    });
  });

  // ---- RECOMPENSA DIARIA (1 por día, alterna plataforma) ----
  const dias=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const vals=CFG.recompensas.diaria;
  const fechaHoy=()=>{ const d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
  const diaHoyIdx=()=>new Date().getDay();
  const platDelDia=()=> (new Date().getDate()%2===0)?'adsgram':'monetag';

  let ultimaFecha=null, diaIdx=diaHoyIdx();
  const puede=()=> ultimaFecha!==fechaHoy();

  function pintaDias(){
    const w=$('dailyDays'); w.innerHTML='';
    dias.forEach((d,i)=>{
      const s=document.createElement('span');
      s.textContent=d+' '+fmtK(vals[i]);
      if(i===diaIdx) s.classList.add('hoy');
      if(i<diaIdx) s.classList.add('hecho');
      w.appendChild(s);
    });
  }
  function boton(){
    const b=$('claimBtn');
    if(puede()){ b.disabled=false; b.style.opacity='1';
      b.textContent='RECLAMAR ('+(platDelDia()==='adsgram'?'AdsGram':'Monetag')+')';
    } else { b.disabled=true; b.style.opacity='.5'; b.textContent='VUELVE MAÑANA'; }
  }
  async function cargarDiaria(){
    if(!DB()||!DB().listo) return;
    const d=await DB().leer();
    if(d && d.ultimaDiaria) ultimaFecha=d.ultimaDiaria;
    pintaDias(); boton();
  }
  $('claimBtn').addEventListener('click',()=>{
    if(!puede()||!A()) return;
    A().recompensado(platDelDia(), async ()=>{
      S().sumar(vals[diaIdx]);
      ultimaFecha=fechaHoy();
      if(DB()&&DB().listo){ try{ await DB().escribir({ ultimaDiaria: ultimaFecha }); }catch(e){} }
      pintaDias(); boton();
    });
  });

  // ---- BOTONES DE ANUNCIO (+1k c/u, anuncio real) ----
  $('adsgramBtn').addEventListener('click',()=>{ if(A()) A().recompensado('adsgram', ()=>S().sumar(CFG.recompensas.clicAnuncio)); });
  $('monetagBtn').addEventListener('click',()=>{ if(A()) A().recompensado('monetag', ()=>S().sumar(CFG.recompensas.clicAnuncio)); });

  // ---- TAREAS DEL CREADOR (enlaces reales) ----
  const abrir=url=>window.open(url,'_blank');
  const pend=b=>{ b.classList.add('pend'); b.querySelector('.reward').textContent='PEND.'; };

  $('tYouTube').addEventListener('click',function(){ abrir(CFG.enlaces.youtube); pend(this); });
  $('tSpotify').addEventListener('click',function(){ abrir(CFG.enlaces.spotify); pend(this); });
  $('tLike1').addEventListener('click',function(){ abrir('https://youtu.be/'+CFG.enlaces.video1); pend(this); });
  $('tLike2').addEventListener('click',function(){ abrir('https://youtu.be/'+CFG.enlaces.video2); pend(this); });

  // ver 30s de video embebido (automático, 1 vez por día)
  $('tVer30').addEventListener('click',async function(){
    if(!DB()||!DB().listo) return;
    const d=await DB().leer();
    if(d && d.tareas && d.tareas.verVideo30===fechaHoy()) return; // ya hoy
    const ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;z-index:220;background:rgba(3,6,15,.85);display:flex;align-items:center;justify-content:center;padding:16px';
    ov.innerHTML='<div style="width:100%;max-width:360px;background:#0b0614;border:1px solid rgba(255,255,255,.2);border-radius:18px;padding:12px">'+
      '<div style="font-size:12px;font-weight:900;margin-bottom:8px">MIRA 30 SEGUNDOS: <span id="v30c" style="color:#ffd21f">30</span></div>'+
      '<iframe style="width:100%;aspect-ratio:16/9;border:none;border-radius:12px" src="https://www.youtube.com/embed/'+CFG.enlaces.video1+'?autoplay=1" allow="autoplay"></iframe></div>';
    document.body.appendChild(ov);
    let s=30; const el=ov.querySelector('#v30c');
    const t=setInterval(async ()=>{
      s--; el.textContent=s;
      if(s<=0){ clearInterval(t); ov.remove();
        S().sumar(CFG.recompensas.verVideo30);
        try{ await DB().escribir({ 'tareas.verVideo30': fechaHoy() }); }catch(e){}
      }
    },1000);
  });

  // ---- INVITADOS: copiar enlace único ----
  $('copyBtn').addEventListener('click',()=>{
    const cod=$('inviteCode').textContent;
    const url=location.origin+location.pathname+'?inv='+cod;
    if(navigator.clipboard) navigator.clipboard.writeText(url);
    $('copyBtn').textContent='¡Enlace copiado!';
    setTimeout(()=>{ $('copyBtn').textContent='Copiar código'; },1500);
  });

  pintaSaldo(); pintaDias(); boton();
  cargarDiaria();
  window.addEventListener('triki-db-listo', cargarDiaria);
  setInterval(()=>{ if(diaIdx!==diaHoyIdx()){ diaIdx=diaHoyIdx(); pintaDias(); boton(); } },60000);
})();
