/* ============ TRIKI - TOP EN VIVO (Firebase) ============ */
(function(){
  const $=id=>document.getElementById(id);
  const DB=()=>window.TrikiDB;

  const cmp=(a,b)=>{ a=String(a); b=String(b);
    if(a.length!==b.length) return a.length-b.length;
    return a<b?-1:a>b?1:0; };

  function fmtCorto(s){
    s=String(s); const L=s.length;
    if(L<=3) return s;
    const opts=[[3,'k'],[6,'M'],[9,'B'],[12,'T'],[15,'Q'],[18,'Qi'],[21,'Sx']];
    let d=0,su='';
    for(const [p,name] of opts){ if(L-1>=p && L-p<=4){ d=p; su=name; } }
    if(!su) return s;
    const head=s.slice(0,L-d), dec=s.slice(L-d,L-d+2);
    return head+'.'+dec+su;
  }

  const SVG_CORONA='<svg class="badge" viewBox="0 0 32 32">'+
    '<path d="M4 22 L6 9 L11 16 L16 5 L21 16 L26 9 L28 22 Z" fill="url(#gOro)" stroke="#fff3b0" stroke-width="1.2"/>'+
    '<rect x="4" y="22" width="24" height="5" rx="2" fill="url(#gOro)" stroke="#fff3b0" stroke-width="1.2"/>'+
    '<circle cx="16" cy="17" r="2.2" fill="#ff2e93"/><circle cx="9.5" cy="19" r="1.5" fill="#28e0ff"/>'+
    '<circle cx="22.5" cy="19" r="1.5" fill="#3dff7c"/><circle cx="6" cy="8" r="1.8" fill="#fff3b0"/>'+
    '<circle cx="16" cy="4" r="1.8" fill="#fff3b0"/><circle cx="26" cy="8" r="1.8" fill="#fff3b0"/></svg>';
  const SVG_MED2='<svg class="badge" viewBox="0 0 32 32">'+
    '<path d="M11 3h4l3 7-4 2z" fill="#8a8aa0"/><path d="M21 3h-4l-3 7 4 2z" fill="#c0c0d0"/>'+
    '<circle cx="16" cy="19" r="8.5" fill="url(#gPlata)" stroke="#f5f5fa" stroke-width="1.4"/>'+
    '<text x="16" y="23" text-anchor="middle" font-size="10" font-weight="900" fill="#33334a">2</text></svg>';
  const SVG_MED3='<svg class="badge" viewBox="0 0 32 32">'+
    '<path d="M11 3h4l3 7-4 2z" fill="#7a4a1d"/><path d="M21 3h-4l-3 7 4 2z" fill="#cd7f32"/>'+
    '<circle cx="16" cy="19" r="8.5" fill="url(#gBronce)" stroke="#e8a06a" stroke-width="1.4"/>'+
    '<text x="16" y="23" text-anchor="middle" font-size="10" font-weight="900" fill="#3d2800">3</text></svg>';

  function podHTML(u,rank){
    const badge= rank===1?SVG_CORONA: rank===2?SVG_MED2:SVG_MED3;
    const nom=(u.nombre||'Jugador');
    return badge+
      '<div class="avatar">'+nom.charAt(0).toUpperCase()+'</div>'+
      '<div class="pname">'+nom+'</div>'+
      '<div class="pcoins">'+fmtCorto(u.saldo||0)+'</div>'+
      '<div class="base"></div>';
  }

  let lista=[];
  function render(){
    if(lista.length>0){
      $('pod1').innerHTML=podHTML(lista[0],1);
      $('pod2').innerHTML=podHTML(lista[1]||{nombre:'-',saldo:0},2);
      $('pod3').innerHTML=podHTML(lista[2]||{nombre:'-',saldo:0},3);
    }
    const wrap=$('topList'); wrap.innerHTML='';
    lista.forEach((u,i)=>{
      const row=document.createElement('div');
      row.className='top-row'+(u.id===DB().uid?' mi':'');
      row.id='row-'+i;
      row.innerHTML='<div class="pos">'+(i+1)+'</div>'+
        '<div class="ava">'+(u.nombre||'?').charAt(0).toUpperCase()+'</div>'+
        '<div class="who"><b>'+(u.nombre||'Jugador')+'</b><span>#'+(i+1)+'</span></div>'+
        '<div class="full">'+fmtCorto(u.saldo||0)+'</div>';
      wrap.appendChild(row);
    });
    const me=lista.find(u=>u.id===DB().uid);
    if(me){
      const idx=lista.indexOf(me);
      $('mbFull').textContent=String(me.saldo||0);
      $('myRank').innerHTML='<div class="pos">#'+(idx+1)+'</div><div class="lbl">Tu posición</div><div class="full">'+fmtCorto(me.saldo||0)+'</div>';
      $('myRank').onclick=()=>{ const r=$('row-'+idx); if(r) r.scrollIntoView({behavior:'smooth',block:'center'}); };
    }
  }

  async function cargar(){
    if(!DB()||!DB().listo) return;
    try{
      lista=await DB().top(50);
      lista.sort((a,b)=>cmp(b.saldo||0,a.saldo||0));
      render();
    }catch(e){ console.error('top error',e); }
  }

  document.querySelectorAll('.tab').forEach(b=>{
    if(b.dataset.page==='p-top') b.addEventListener('click',cargar);
  });
  setInterval(()=>{
    const activa=document.getElementById('p-top').classList.contains('activa');
    if(activa && document.visibilityState==='visible') cargar();
  },30000);

  if(DB()&&DB().listo) cargar();
  window.addEventListener('triki-db-listo',cargar);
})();
