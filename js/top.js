/* ============ TRIKI - PESTAÑA TOP v2 ============ */
(function(){
  const $=id=>document.getElementById(id);

  // DEMO: después vendrá del BACKEND en tiempo real
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

  const cmp=(a,b)=>{ a=String(a); b=String(b);
    if(a.length!==b.length) return a.length-b.length;
    return a<b?-1:a>b?1:0; };
  users.sort((x,y)=> cmp(y.c, x.c));

  // formato corto: 1k, 10k, 100k, 1M, 1.1M, 1.10M
  function fmtCorto(s){
    s=String(s); const L=s.length;
    if(L<=3) return s;
    const opts=[[3,'k'],[6,'M'],[9,'B'],[12,'T'],[15,'Q'],[18,'Qi'],[21,'Sx']];
    let d=0, su='';
    for(const [p,name] of opts){ if(L-1>=p && L-p<=4){ d=p; su=name; } }
    if(!su) return s;
    const head=s.slice(0, L-d), dec=s.slice(L-d, L-d+2);
    return head+'.'+dec+su;
  }

  // Corona NEÓN elaborada (1º) y medallas neón (2º/3º) — sin emojis
  const SVG_CORONA='<svg class="badge" viewBox="0 0 32 32">'+
    '<path d="M4 22 L6 9 L11 16 L16 5 L21 16 L26 9 L28 22 Z" fill="url(#gOro)" stroke="#fff3b0" stroke-width="1.2"/>'+
    '<rect x="4" y="22" width="24" height="5" rx="2" fill="url(#gOro)" stroke="#fff3b0" stroke-width="1.2"/>'+
    '<circle cx="16" cy="17" r="2.2" fill="#ff2e93"/>'+
    '<circle cx="9.5" cy="19" r="1.5" fill="#28e0ff"/>'+
    '<circle cx="22.5" cy="19" r="1.5" fill="#3dff7c"/>'+
    '<circle cx="6" cy="8" r="1.8" fill="#fff3b0"/>'+
    '<circle cx="16" cy="4" r="1.8" fill="#fff3b0"/>'+
    '<circle cx="26" cy="8" r="1.8" fill="#fff3b0"/></svg>';
  const SVG_MED2='<svg class="badge" viewBox="0 0 32 32">'+
    '<path d="M11 3h4l3 7-4 2z" fill="#8a8aa0"/><path d="M21 3h-4l-3 7 4 2z" fill="#c0c0d0"/>'+
    '<circle cx="16" cy="19" r="8.5" fill="url(#gPlata)" stroke="#f5f5fa" stroke-width="1.4"/>'+
    '<text x="16" y="23" text-anchor="middle" font-size="10" font-weight="900" fill="#33334a">2</text></svg>';
  const SVG_MED3='<svg class="badge" viewBox="0 0 32 32">'+
    '<path d="M11 3h4l3 7-4 2z" fill="#7a4a1d"/><path d="M21 3h-4l-3 7 4 2z" fill="#cd7f32"/>'+
    '<circle cx="16" cy="19" r="8.5" fill="url(#gBronce)" stroke="#e8a06a" stroke-width="1.4"/>'+
    '<text x="16" y="23" text-anchor="middle" font-size="10" font-weight="900" fill="#3d2800">3</text></svg>';

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

  // TU BALANCE COMPLETO (después del podio, sin límite de dígitos)
  const meIdx=users.findIndex(u=>u.me);
  if(meIdx>=0) $('mbFull').textContent=users[meIdx].c;

  // listado con formato CORTO
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
      '<div class="full">'+fmtCorto(u.c)+'</div>';
    list.appendChild(row);
  });

  // mi posición (sticky abajo) con formato corto; al tocar lleva a mi fila
  const my=$('myRank');
  if(meIdx>=0){
    my.innerHTML=
      '<div class="pos">#'+(meIdx+1)+'</div>'+
      '<div class="lbl">Tu posición</div>'+
      '<div class="full">'+fmtCorto(users[meIdx].c)+'</div>';
    my.addEventListener('click',()=>{
      const r=$('row-'+meIdx);
      if(r) r.scrollIntoView({ behavior:'smooth', block:'center' });
    });
  } else { my.style.display='none'; }
})();
