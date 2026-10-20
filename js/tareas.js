/* ============ TRIKI - PESTAÑA TAREAS (conectada al cerebro) ============ */
(function(){
  const $=id=>document.getElementById(id);
  const S=()=>window.TrikiSaldo;

  const fmtK=n=>{
    if(n>=1e6) return (n/1e6).toFixed(n%1e6?1:0).replace('.0','')+'M';
    if(n>=1000) return (n/1000).toFixed(n%1000?1:0).replace('.0','')+'k';
    return ''+n;
  };
  const pintaSaldo=()=>{ $('tBalance').textContent=fmtK(S()?S().valor:0); };

  // suscribe el balance en vivo
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

  // anuncio 30s demo
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

  // recompensas diarias
  const dias=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const vals=[1000,2000,3000,4000,5000,6000,7000];
  let diaIdx=0;
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
  $('claimBtn').addEventListener('click',()=>{
    anuncio30(()=>{ S().sumar(vals[diaIdx]); diaIdx=(diaIdx+1)%7; pintaDias(); });
  });

  // botones de portales de anuncio (+5k) -> guardan en el cerebro
  $('adsgramBtn').addEventListener('click',()=>anuncio30(()=>S().sumar(5000)));
  $('monetagBtn').addEventListener('click',()=>anuncio30(()=>S().sumar(5000)));

  // tareas del creador (pendientes de aprobación)
  document.querySelectorAll('.task-creator').forEach(b=>{
    b.addEventListener('click',()=>{
      b.classList.add('pend');
      b.querySelector('.reward').textContent='PEND.';
    });
  });

  // invitados
  $('inviteCode').textContent='TRIKI-'+Math.floor(1000+Math.random()*9000);
  $('copyBtn').addEventListener('click',()=>{
    const c=$('inviteCode').textContent;
    if(navigator.clipboard) navigator.clipboard.writeText(c);
    $('copyBtn').textContent='¡Copiado!';
    setTimeout(()=>{ $('copyBtn').textContent='Copiar código'; },1500);
  });
  const tabla=$('inviteTable');
  for(let i=1;i<=3;i++){
    const r=document.createElement('div'); r.className='inv-row';
    r.innerHTML='<span>Amigo '+i+'</span><span>+5k</span>';
    tabla.appendChild(r);
  }
  $('invCount').textContent='3';

  pintaSaldo(); pintaDias();
})();
