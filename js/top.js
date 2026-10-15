/* ============ TRIKI - PESTAÑA TOP (clasificación) ============ */
(function(){
  const $=id=>document.getElementById(id);

  // DEMO: después esto vendrá del BACKEND (cerebro) en tiempo real
  // c = monedas como STRING para soportar hasta 40+ dígitos sin perder precisión
  let users=[
    { n:'Wall Breaker', h:'@wallbreaker', c:'1234567890123456789012345678901234567890' },
    { n:'Zombie King',  h:'@zombieking',  c:'98765432109876543210' },
    { n:'Neon Queen',   h:'@neonqueen',   c:'84300000' },
    { n:'Triki Master', h:'@trikimaster', c:'76700000' },
    { n:'Coin Hunter',  h:'@coinhunter',  c:'55900000' },
    { n:'Tú',           h:'@tu',          c:'12500000', me:true },
    { n:'Ghost Rider',  h:'@ghostrider',  c:'9800000' },
    { n:'Maze Runner',  h:'@mazerunner',  c:'7400000' },
    { n:'Pac Lord',     h:'@paclord',     c:'5100000' },
    { n:'Dot Eater',    h:'@doteater',    c:'3200000' }
  ];

  // ordena por monto (strings numéricos)
  const cmp=(a,b)=>{ a=String(a); b=String(b);
    if(a.length!==b.length) return a.length-b.length;
    return a<b?-1:a>b?1:0; };
  users.sort((x,y)=> cmp(y.c, x.c));

  // formato corto para el podio (1k, 84.3M, 98.7Qi)
  function fmtCorto(s){
    s=String(s); const L=s.length;
    if(L<=3) return s;
    const opts=[[3,'k'],[6,'M'],[9,'B'],[12,'T'],[15,'Q'],[18,'Qi'],[21,'Sx']];
    let d=0, su='';
    for(const [p,name] of opts){ if(L-1>=p && L-p<=4){ d=p; su=name; } }
    if(!su) return s;
    const head=s.slice(0, L-d), dec=s.slice(L-d, L-d+1);
    return head+'.'+dec+su;
  }

  const SVG_CORONA='<svg class="badge" viewBox="0 0 24 24"><path d="M3 8l4 4 5-6 5 6 4-4v9H3z" fill="url(#gOro)"/><rect x="3" y="17" width="18" height="3" rx="1" fill="url(#gOro)"/><circle cx="12" cy="12" r="1.4" fill="#ff2e93"/><circle cx="7" cy="13" r="1" fill="#28e0ff"/><circle cx="17" cy="13" r="1" fill="#3dff7c"/></svg>';
  const SVG_MED2='<svg class="badge" viewBox="0 0 24 24"><path d="M8 2h3l2 5-3 1z" fill="#8a8aa0"/><path d="M16 2h-3l-2 5 3 1z" fill="#c0c0d0"/><circle cx="12" cy="14" r="7" fill="url(#gPlata)"/><text x="12" y="17.5" text-anchor="middle" font-size="9" font-weight="900" fill="#33334a">2</text></svg>';
  const SVG_MED3='<svg class="badge" viewBox="0 0 24 24"><path d="M8 2h3l2 5-3 1z" fill="#7a4a1d"/><path d="M16 2h-3l-2 5 3 1z" fill="#cd7f32"/><circle cx="12" cy="14" r="7" fill="url(#gBronce)"/><text x="12" y="17.5" text-anchor="middle" font-size="9" font-weight="900" fill="#3d2800">3</text></svg>';

  function podHTML(u, rank){
    const badge = rank===1? SVG_CORONA : rank===2? SVG_MED2 : SVG_MED3;
    return badge+
      '<div class="avatar">'+u.n.charAt(0)+'</div>'+
      '<div class="pname">'+u.n+'</div>'+
      '<div class="pcoins">'+fmtCorto(u.c)+'</div>'+
      '<div class="base"></div>';
  }
  $('pod1').innerHTML=podHTML(users[0],1);
  $('pod2').innerHTML=podHTML(users[1],2);
  $('pod3').innerHTML=podHTML(users[2],3);

  // listado ancho completo con números COMPLETOS
  const list=$('topList');
  list.innerHTML='';
  users.forEach((u,i)=>{
    const row=document.createElement('div');
    row.className='top-row'+(u.me?' mi':'');
    row.id='row-'+i;
    row.innerHTML=
      '<div class="pos">'+(i+1)+'</div>'+
      '<div class="ava">'+u.n.charAt(0)+'</div>'+
      '<div class="who"><b>'+u.n+'</b><span>'+u.h+'</span></div>'+
      '<div class="full">'+u.c+'</div>';
    list.appendChild(row);
  });

  // mi posición (tarjeta fija abajo); al tocarla, lleva a mi fila
  const meIdx=users.findIndex(u=>u.me);
  const my=$('myRank');
  if(meIdx>=0){
    my.innerHTML=
      '<div class="pos">#'+(meIdx+1)+'</div>'+
      '<div class="lbl">Tu posición</div>'+
      '<div class="full">'+users[meIdx].c+'</div>';
    my.addEventListener('click',()=>{
      const r=$('row-'+meIdx);
      if(r) r.scrollIntoView({ behavior:'smooth', block:'center' });
    });
  } else { my.style.display='none'; }
})();
