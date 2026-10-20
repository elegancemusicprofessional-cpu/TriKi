/* ============ TRIKI - TAREAS v3 (con bloqueo diario y sincronización) ============ */
(function(){
  const $=id=>document.getElementById(id);
  const S=()=>window.TrikiSaldo;
  const DB=()=>window.TrikiDB;

  const fmtK=n=>{
    if(n>=1e6) return (n/1e6).toFixed(n%1e6?1:0).replace('.0','')+'M';
    if(n>=1000) return (n/1000).toFixed(n%1000?1:0).replace('.0','')+'k';
    return ''+n;
  };
  const pintaSaldo=()=>{ $('tBalance').textContent=fmtK(S()?S().valor:0); };
  if(S()) S().on(pintaSaldo);
  window.addEventListener('triki-db-listo', ()=>{ if(S()) S().on(pintaSaldo); });

  document.querySelectorAll('.t-tab').forEach(b=>{
    b.addEventListener('click',()=>{
      document.querySelectorAll('.t-tab').forEach(x=>x.classList.remove('activa'));
      document.querySelectorAll('.t-page').forEach(x=>x.classList.remove('activa'));
      b.classList.add('activa');
      $(b.dataset.t).classList.add('activa');
    });
  });

  // ---- anuncio 30s demo ----
  let adT=null, pend=null;
  function anuncio30(cb){
    if(adT) return;
    pend=cb;
    const ov=document.createElement('div');
    ov.className='game-overlay'; ov.style.position='fixed'; ov.style.zIndex=200;
    ov.innerHTML='<div class="ov-title">ANUNCIO 30s</div><div class="ov-title" style="font-size:40px" id="tAdC">30</div>';
    document.body.appendChild(ov);
    let s=30; const el=ov.querySelector('#tAdC');
    adT=setInterval(()=>{
      s--; el.textContent=s;
      if(s<=0){ clearInterval(adT); adT=null; ov.remove(); const f=pend; pend=null; if(f) f(); }
    },1000);
  }

  // ---- RECOMPENSAS DIARIAS con bloqueo 24h ----
  const dias=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const vals=[7000,1000,2000,3000,4000,5000,6000]; // Dom=7k, Lun=1k, ..., Sáb=6k

  // Fecha en formato YYYY-MM-DD (zona horaria del usuario)
  function fechaHoy(){
    const d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  // Día de la semana real (0=Dom, 1=Lun, ... 6=Sáb)
  function diaHoyIdx(){ return new Date().getDay(); }

  let ultimaFecha=null; // fecha de última reclamación (YYYY-MM-DD)
  let diaIdx=diaHoyIdx();

  function puedeReclamar(){
    return ultimaFecha !== fechaHoy();
  }

  function pintaDias(){
    const wrap=$('dailyDays'); wrap.innerHTML='';
    dias.forEach((d,i)=>{
      const s=document.createElement('span');
      s.textContent=d+' '+fmtK(vals[i]);
      if(i===diaIdx) s.classList.add('hoy');
      if(i<diaIdx) s.classList.add('hecho');
      wrap.appendChild(s);
    });
  }
  function actualizarBoton(){
    const btn=$('claimBtn');
    if(puedeReclamar()){
      btn.textContent='RECLAMAR';
      btn.disabled=false;
      btn.style.opacity='1';
    } else {
      btn.textContent='VUELVE MAÑANA';
      btn.disabled=true;
      btn.style.opacity='.5';
    }
  }

  // cargar progreso de diarias desde Firebase
  async function cargarDiarias(){
    if(!DB() || !DB().listo) return;
    const d = await DB().leer();
    if(d && d.ultimaDiaria) ultimaFecha = d.ultimaDiaria;
    pintaDias();
    actualizarBoton();
  }

  $('claimBtn').addEventListener('click',()=>{
    if(!puedeReclamar()) return;
    anuncio30(async ()=>{
      S().sumar(vals[diaIdx]);
      ultimaFecha = fechaHoy();
      if(DB() && DB().listo){
        try{ await DB().escribir({ ultimaDiaria: ultimaFecha }); }catch(e){}
      }
      pintaDias();
      actualizarBoton();
    });
  });

  // ---- botones de anuncios (+5k) ----
  $('adsgramBtn').addEventListener('click',()=>anuncio30(()=>S().sumar(5000)));
  $('monetagBtn').addEventListener('click',()=>anuncio30(()=>S().sumar(5000)));

  // ---- tareas del creador ----
  document.querySelectorAll('.task-creator').forEach(b=>{
    b.addEventListener('click',()=>{
      b.classList.add('pend');
      b.querySelector('.reward').textContent='PEND.';
    });
  });

  // ---- invitados ----
  $('inviteCode').textContent='TRIKI-'+Math.floor(1000+Math.random()*9000);
  $('copyBtn').addEventListener('click',()=>{
    const c=$('inviteCode').textContent;
    if(navigator.clipboard) navigator.clipboard.writeText(c);
    $('copyBtn').textContent='¡Copiado!';
    setTimeout(()=>{ $('copyBtn').textContent='Copiar código'; },1500);
  });
  const tabla=$('inviteTable'); tabla.innerHTML='';
  for(let i=1;i<=3;i++){
    const r=document.createElement('div'); r.className='inv-row';
    r.innerHTML='<span>Amigo '+i+'</span><span>+5k</span>';
    tabla.appendChild(r);
  }
  $('invCount').textContent='3';

  pintaSaldo();
  cargarDiarias();
  window.addEventListener('triki-db-listo', cargarDiarias);

  // refrescar al cambiar de día mientras la app está abierta
  setInterval(()=>{
    if(diaIdx !== diaHoyIdx()){ diaIdx=diaHoyIdx(); pintaDias(); actualizarBoton(); }
  },60000);
})();
