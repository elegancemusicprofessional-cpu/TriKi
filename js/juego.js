/* ============ TRIKI - MOTOR DEL JUEGO v5 ============ */
(function(){
  const canvas=document.getElementById('gameCanvas');
  const ctx=canvas.getContext('2d');
  const area=document.getElementById('gameArea');
  const navEl=document.querySelector('nav');

  const COLS=15, ROWS=21;
  let cell=0, offX=0, offY=0;

  function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  let rnd=mulberry32(20261015);

  let grid=[];
  const DOOR={r:1,c:COLS-2};

  function genMaze(){
    grid=[];
    for(let r=0;r<ROWS;r++){ grid[r]=[]; for(let c=0;c<COLS;c++) grid[r][c]=1; }
    const stack=[[1,1]]; grid[1][1]=0;
    while(stack.length){
      const [r,c]=stack[stack.length-1];
      const dirs=[[0,2],[0,-2],[2,0],[-2,0]].filter(([dr,dc])=>{
        const nr=r+dr,nc=c+dc;
        return nr>0&&nr<ROWS-1&&nc>0&&nc<COLS-1&&grid[nr][nc]===1;
      });
      if(!dirs.length){ stack.pop(); continue; }
      const [dr,dc]=dirs[Math.floor(rnd()*dirs.length)];
      grid[r+dr/2][c+dc/2]=0; grid[r+dr][c+dc]=0;
      stack.push([r+dr,c+dc]);
    }
    for(let r=1;r<ROWS-1;r++)for(let c=1;c<COLS-1;c++){
      if(grid[r][c]===1&&rnd()<0.14){
        if(grid[r][c-1]===0&&grid[r][c+1]===0) grid[r][c]=0;
        else if(grid[r-1][c]===0&&grid[r+1][c]===0) grid[r][c]=0;
      }
    }
    grid[DOOR.r][DOOR.c]=0; grid[DOOR.r][DOOR.c-1]=0; grid[DOOR.r+1][DOOR.c]=0;
  }
  const esCamino=(r,c)=> r>=0&&r<ROWS&&c>=0&&c<COLS&&grid[r][c]===0;

  let started=false, paused=false, gameOver=false;
  let lives=5, coins=0, skill=5, invuln=0, usandoAnuncio=false;
  let player, zombies, bullets, coinSet;

  const centro=(r,c)=>({ x:offX+c*cell+cell/2, y:offY+r*cell+cell/2 });
  const nuevaEntidad=(r,c)=>({ r,c, tr:r, tc:c, t:0, moving:false, dir:null, px:0, py:0 });

  function regenerarMonedas(){
    coinSet=new Set();
    for(let r=1;r<ROWS-1;r++)for(let c=1;c<COLS-1;c++){
      if(grid[r][c]===0 && (r+c)%2===0 && !(r===1&&c===1) && !(r===DOOR.r&&c===DOOR.c))
        coinSet.add(r+','+c);
    }
  }
  function colocarZombies(){
    zombies=[];
    const zr=Math.floor(ROWS/2), zc=Math.floor(COLS/2);
    let sr=zr, sc=zc;
    outer: for(let r=1;r<ROWS-1;r++){ for(let c=1;c<COLS-1;c++){ if(grid[r][c]===0&&Math.abs(r-zr)+Math.abs(c-zc)<4){ sr=r; sc=c; break outer; } } }
    const cols=['#3dff7c','#b04dff','#28e0ff','#ff2e93'];
    for(let i=0;i<4;i++) zombies.push(Object.assign(nuevaEntidad(sr,sc),{ color:cols[i], alive:true, respawn:0 }));
  }
  function colocarJugador(){ player={ gx:1.5, gy:1.5, dir:'right' }; }
  const jpx=()=> offX+player.gx*cell;
  const jpy=()=> offY+player.gy*cell;

  function resize(){
    const w=area.clientWidth, h=area.clientHeight;
    if(canvas.width!==w||canvas.height!==h){ canvas.width=w; canvas.height=h; }
    cell=Math.min(w/COLS,h/ROWS);
    offX=(w-cell*COLS)/2; offY=(h-cell*ROWS)/2;
  }
  function setNav(visible){ navEl.style.display=visible?'':'none'; }

  function reset(){
    resize();
    rnd=mulberry32(Date.now()%100000);
    genMaze(); colocarJugador(); colocarZombies(); regenerarMonedas(); bullets=[];
    lives=5; coins=0; skill=5; gameOver=false; invuln=1.5;
    updateHud(); updateSkill();
  }
  function nuevaPartida(){
    resize();
    genMaze(); colocarJugador(); colocarZombies(); regenerarMonedas(); bullets=[];
    lives=5; skill=5; gameOver=false; invuln=1.5;
    updateHud(); updateSkill();
  }

  function updateHud(){
    document.getElementById('hudLives').textContent='❤️ '+lives;
    document.getElementById('hudCoins').textContent='🪙 '+coins;
  }
  function updateSkill(){ const el=document.getElementById('skillCount'); if(el) el.textContent=skill; }

  /* ===== JOYSTICK (más grande, vía JS) ===== */
  const joyZone=document.getElementById('joyZone'), joyKnob=document.getElementById('joyKnob');
  joyZone.style.width='150px'; joyZone.style.height='104px';
  joyKnob.style.width='46px'; joyKnob.style.height='46px'; joyKnob.style.margin='-23px 0 0 -23px';

  let inputDir=null, touching=false;
  function dirPorAngulo(dx,dy){
    const a=Math.atan2(dy,dx)*180/Math.PI;
    if(a>=-45&&a<45) return 'right';
    if(a>=45&&a<135) return 'down';
    if(a>=-135&&a<-45) return 'up';
    return 'left';
  }
  function moverKnob(dx,dy){
    const max=30, len=Math.hypot(dx,dy)||1, k=Math.min(len,max)/len;
    joyKnob.style.transform='translate('+(dx*k)+'px,'+(dy*k)+'px)';
  }
  function handleJoy(e){
    const r=joyZone.getBoundingClientRect();
    const dx=e.clientX-(r.left+r.width/2), dy=e.clientY-(r.top+r.height/2);
    moverKnob(dx,dy);
    if(Math.hypot(dx,dy)>6) inputDir=dirPorAngulo(dx,dy);
  }
  joyZone.addEventListener('pointerdown',e=>{ touching=true; joyZone.setPointerCapture(e.pointerId); handleJoy(e); e.preventDefault(); });
  joyZone.addEventListener('pointermove',e=>{ if(touching) handleJoy(e); });
  function soltar(){ touching=false; inputDir=null; joyKnob.style.transform='translate(0,0)'; }
  joyZone.addEventListener('pointerup',soltar);
  joyZone.addEventListener('pointercancel',soltar);
  window.addEventListener('keydown',e=>{
    const k=e.key;
    if(k==='ArrowRight'||k==='d') inputDir='right';
    if(k==='ArrowLeft'||k==='a') inputDir='left';
    if(k==='ArrowDown'||k==='s') inputDir='down';
    if(k==='ArrowUp'||k==='w') inputDir='up';
  });
  window.addEventListener('keyup',()=>{ inputDir=null; });

  /* ===== ANUNCIO DEMO ===== */
  function mostrarAnuncioDemo(callback){
    if(usandoAnuncio) return;
    usandoAnuncio=true;
    const ov=document.createElement('div');
    ov.className='game-overlay'; ov.style.position='fixed'; ov.style.zIndex=200;
    ov.innerHTML='<div class="ov-title">ANUNCIO 30s</div><div class="ov-title" style="font-size:40px" id="adDemoCount">30</div>';
    document.body.appendChild(ov);
    let s=30;
    const el=ov.querySelector('#adDemoCount');
    const t=setInterval(()=>{
      s--; el.textContent=s;
      if(s<=0){ clearInterval(t); ov.remove(); usandoAnuncio=false; callback(); }
    },1000);
  }
  function mostrarConfirmAnuncio(onSi){
    paused=true;
    const ov=document.createElement('div');
    ov.className='game-overlay'; ov.style.position='fixed'; ov.style.zIndex=200;
    ov.innerHTML=
      '<div class="ov-title" style="font-size:18px">¿Quieres 5 bolitas de fuego más?</div>'+
      '<button class="ov-btn" id="cfSi">📺 SÍ, VER ANUNCIO (30s)</button>'+
      '<button class="ov-btn sec" id="cfNo">NO, GRACIAS</button>';
    document.body.appendChild(ov);
    ov.querySelector('#cfSi').addEventListener('click',()=>{ ov.remove(); mostrarAnuncioDemo(()=>{ onSi(); paused=false; }); });
    ov.querySelector('#cfNo').addEventListener('click',()=>{ ov.remove(); paused=false; });
  }

  /* ===== BOTÓN DISPARO: bola de fuego 3D (no emoji) ===== */
  const skillBtn=document.getElementById('skillBtn');
  skillBtn.innerHTML=
    '<span style="width:26px;height:26px;border-radius:50%;display:block;'+
    'background:radial-gradient(circle at 35% 30%, #fff3b0, #ffd21f 40%, #ff7a00 75%, #e8332a 100%);'+
    'box-shadow:0 0 12px rgba(255,120,0,.85), inset 0 -3px 6px rgba(0,0,0,.35), inset 0 2px 3px rgba(255,255,255,.55);"></span>'+
    '<span class="cnt" id="skillCount">5</span>';

  function disparar(){
    if(!started||paused||gameOver) return;
    if(skill<=0){ mostrarConfirmAnuncio(()=>{ skill=5; updateSkill(); }); return; }
    skill--; updateSkill();
    let target=null, best=1e9;
    zombies.forEach(z=>{ if(!z.alive) return;
      const d=Math.hypot(z.px-jpx(), z.py-jpy()); if(d<best){ best=d; target=z; } });
    bullets.push({ x:jpx(), y:jpy(), target, dx:0, dy:-1, life:2.5 });
  }
  canvas.addEventListener('pointerdown',()=>{ disparar(); });
  skillBtn.addEventListener('click',()=>{ disparar(); });

  /* ===== BOTONES ===== */
  document.getElementById('restartBtn').style.display='none';
  document.getElementById('livesAdBtn').textContent='📺 VER ANUNCIO (30s) Y JUGAR DE NUEVO';
  document.getElementById('startBtn').addEventListener('click',()=>{
    started=true; document.getElementById('startOverlay').hidden=true; setNav(false);
  });
  document.getElementById('pauseBtn').addEventListener('click',()=>{
    if(!started||gameOver) return;
    paused=!paused;
    document.getElementById('pauseOverlay').hidden=!paused;
    setNav(paused); // al pausar aparece la tabbar
  });
  document.getElementById('resumeBtn').addEventListener('click',()=>{
    paused=false; document.getElementById('pauseOverlay').hidden=true; setNav(false);
  });
  document.getElementById('livesAdBtn').addEventListener('click',()=>{
    mostrarAnuncioDemo(()=>{ nuevaPartida(); document.getElementById('overOverlay').hidden=true; started=true; setNav(false); });
  });

  /* ===== MOVIMIENTO JUGADOR ===== */
  function puedeMoverGrid(gx,gy){
    const r=0.32;
    const minC=Math.floor(gx-r), maxC=Math.floor(gx+r);
    const minR=Math.floor(gy-r), maxR=Math.floor(gy+r);
    for(let rr=minR;rr<=maxR;rr++)for(let cc=minC;cc<=maxC;cc++){
      if(rr<0||rr>=ROWS||cc<0||cc>=COLS||grid[rr][cc]===1) return false;
    }
    return true;
  }
  function moverJugador(dt){
    if(!inputDir) return;
    const vel=6.5*dt;
    if(inputDir==='left'||inputDir==='right'){
      const ngx=player.gx+(inputDir==='right'?vel:-vel);
      if(puedeMoverGrid(ngx,player.gy)) player.gx=ngx;
      const targetY=Math.floor(player.gy)+0.5;
      const dy=targetY-player.gy;
      const s=Math.sign(dy)*Math.min(Math.abs(dy),vel);
      if(puedeMoverGrid(player.gx,player.gy+s)) player.gy+=s;
    } else {
      const ngy=player.gy+(inputDir==='down'?vel:-vel);
      if(puedeMoverGrid(player.gx,ngy)) player.gy=ngy;
      const targetX=Math.floor(player.gx)+0.5;
      const dx=targetX-player.gx;
      const s=Math.sign(dx)*Math.min(Math.abs(dx),vel);
      if(puedeMoverGrid(player.gx+s,player.gy)) player.gx+=s;
    }
    player.dir=inputDir;
  }

  const DELTA={ right:[0,1], left:[0,-1], down:[1,0], up:[-1,0] };
  function tryMove(ent,dir){
    const [dr,dc]=DELTA[dir];
    const nr=ent.r+dr, nc=ent.c+dc;
    if(esCamino(nr,nc)){ ent.tr=nr; ent.tc=nc; ent.t=0; ent.moving=true; ent.dir=dir; return true; }
    return false;
  }
  function stepEnt(ent,speed,dt){
    if(ent.moving){
      ent.t+=speed*dt;
      if(ent.t>=1){ ent.r=ent.tr; ent.c=ent.tc; ent.t=0; ent.moving=false; }
    }
    const a=centro(ent.r,ent.c);
    if(ent.moving){ const b=centro(ent.tr,ent.tc);
      ent.px=a.x+(b.x-a.x)*ent.t; ent.py=a.y+(b.y-a.y)*ent.t;
    } else { ent.px=a.x; ent.py=a.y; }
  }
  function playerCelda(){ return { r:Math.floor(player.gy), c:Math.floor(player.gx) }; }
  function zombieDecide(z){
    const pc=playerCelda();
    const opts=['right','left','down','up'].filter(d=>{ const [dr,dc]=DELTA[d]; return esCamino(z.r+dr,z.c+dc); });
    if(!opts.length) return;
    const back={ right:'left', left:'right', down:'up', up:'down' }[z.dir];
    let pool=opts.filter(d=>d!==back); if(!pool.length) pool=opts;
    pool.sort((d1,d2)=>{
      const [a1,b1]=DELTA[d1], [a2,b2]=DELTA[d2];
      return (Math.abs(z.r+a1-pc.r)+Math.abs(z.c+b1-pc.c))-(Math.abs(z.r+a2-pc.r)+Math.abs(z.c+b2-pc.c));
    });
    tryMove(z,(Math.random()<0.8)?pool[0]:pool[Math.floor(Math.random()*pool.length)]);
  }

  let last=performance.now();
  function loop(now){
    const dt=Math.min((now-last)/1000,0.05); last=now;
    resize();
    if(started&&!paused&&!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function update(dt){
    if(invuln>0) invuln-=dt;
    moverJugador(dt);

    const pc=playerCelda();
    const key=pc.r+','+pc.c;
    if(coinSet.has(key)){
      coinSet.delete(key); coins++; updateHud();
      const [rr,cc]=key.split(',').map(Number);
      setTimeout(()=>{ if(esCamino(rr,cc)) coinSet.add(key); },10000);
    }

    zombies.forEach(z=>{
      if(!z.alive){
        z.respawn-=dt;
        if(z.respawn<=0){ z.alive=true; z.r=DOOR.r; z.c=DOOR.c; z.tr=z.r; z.tc=z.c; z.t=0; z.moving=false; }
        return;
      }
      if(!z.moving) zombieDecide(z);
      stepEnt(z,3.4,dt);
      if(!z.moving) zombieDecide(z);
      if(invuln<=0 && Math.hypot(z.px-jpx(), z.py-jpy())<cell*0.6) perderVida();
    });

    // bolas de fuego: homing garantizado (no chocan muro), impacto seguro
    for(let i=bullets.length-1;i>=0;i--){
      const b=bullets[i];
      b.life-=dt;
      if(b.life<=0){ bullets.splice(i,1); continue; }
      if(b.target&&b.target.alive){
        const dx=b.target.px-b.x, dy=b.target.py-b.y;
        const d=Math.hypot(dx,dy)||1;
        b.dx=dx/d; b.dy=dy/d;
        b.x+=b.dx*cell*14*dt; b.y+=b.dy*cell*14*dt;
        if(d<cell*0.5){ b.target.alive=false; b.target.respawn=10; bullets.splice(i,1); continue; }
      } else {
        bullets.splice(i,1); continue;
      }
    }
  }

  function perderVida(){
    lives--; updateHud();
    if(lives<=0){ gameOver=true; document.getElementById('overOverlay').hidden=false; setNav(true); return; }
    genMaze(); colocarJugador(); colocarZombies(); regenerarMonedas(); bullets=[];
    skill=5; updateSkill();   // recarga bolitas al perder un corazón
    invuln=1.5;
  }

  /* ===== DIBUJO ===== */
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#177a2c'; ctx.fillRect(offX,offY,cell*COLS,cell*ROWS);
    ctx.fillStyle='rgba(255,255,255,.04)';
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){ if((r+c)%2===0) ctx.fillRect(offX+c*cell,offY+r*cell,cell,cell); }

    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      if(grid[r][c]===1){
        const x=offX+c*cell, y=offY+r*cell;
        ctx.fillStyle='#0d4d1c'; ctx.fillRect(x,y,cell,cell);
        ctx.fillStyle='#1f8f38'; ctx.fillRect(x+1,y+1,cell-2,cell-2);
        ctx.fillStyle='rgba(255,255,255,.18)'; ctx.fillRect(x+1,y+1,cell-2,3);
        ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(x+1,y+cell-4,cell-2,3);
      }
    }

    { const p=centro(DOOR.r,DOOR.c);
      ctx.fillStyle='#8f130c'; ctx.fillRect(p.x-cell*0.4,p.y-cell*0.45,cell*0.8,cell*0.9);
      ctx.fillStyle='#e8332a'; ctx.fillRect(p.x-cell*0.3,p.y-cell*0.35,cell*0.6,cell*0.7);
      ctx.fillStyle='#ffd21f'; ctx.beginPath(); ctx.arc(p.x+cell*0.15,p.y,cell*0.06,0,7); ctx.fill(); }

    ctx.textAlign='center'; ctx.textBaseline='middle';
    coinSet.forEach(k=>{
      const [r,c]=k.split(',').map(Number);
      const p=centro(r,c);
      ctx.fillStyle='#ffd21f';
      ctx.beginPath(); ctx.arc(p.x,p.y,cell*0.18,0,7); ctx.fill();
      ctx.strokeStyle='#a8760a'; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle='#7a5200';
      ctx.font='900 '+Math.max(6,cell*0.16)+'px Inter, sans-serif';
      ctx.fillText('TC',p.x,p.y+1);
    });

    bullets.forEach(b=>{
      ctx.fillStyle='rgba(255,120,0,.4)';
      ctx.beginPath(); ctx.arc(b.x-b.dx*7,b.y-b.dy*7,cell*0.22,0,7); ctx.fill();
      ctx.fillStyle='#ff7a00';
      ctx.beginPath(); ctx.arc(b.x,b.y,cell*0.17,0,7); ctx.fill();
      ctx.fillStyle='#ffd21f';
      ctx.beginPath(); ctx.arc(b.x,b.y,cell*0.09,0,7); ctx.fill();
    });

    zombies.forEach(z=>{
      if(!z.alive) return;
      ctx.fillStyle=z.color;
      ctx.beginPath(); ctx.arc(z.px,z.py,cell*0.34,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(z.px-cell*0.36,z.py+cell*0.1,cell*0.1,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(z.px+cell*0.36,z.py+cell*0.1,cell*0.1,0,7); ctx.fill();
      ctx.fillStyle='rgba(0,0,0,.25)';
      ctx.beginPath(); ctx.arc(z.px-cell*0.15,z.py+cell*0.15,cell*0.07,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(z.px+cell*0.18,z.py+cell*0.1,cell*0.05,0,7); ctx.fill();
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(z.px-cell*0.12,z.py-cell*0.08,cell*0.11,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(z.px+cell*0.12,z.py-cell*0.08,cell*0.11,0,7); ctx.fill();
      ctx.fillStyle='#111';
      ctx.beginPath(); ctx.arc(z.px-cell*0.1,z.py-cell*0.07,cell*0.05,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(z.px+cell*0.14,z.py-cell*0.07,cell*0.05,0,7); ctx.fill();
      ctx.fillStyle='#fff';
      ctx.fillRect(z.px-cell*0.14,z.py+cell*0.14,cell*0.08,cell*0.08);
      ctx.fillRect(z.px+cell*0.04,z.py+cell*0.14,cell*0.08,cell*0.08);
    });

    { const px=jpx(), py=jpy();
      if(invuln>0 && Math.floor(invuln*10)%2===0) ctx.globalAlpha=0.5;
      ctx.fillStyle='#e8332a';
      ctx.beginPath(); ctx.ellipse(px-cell*0.16,py+cell*0.3,cell*0.14,cell*0.08,0,0,7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(px+cell*0.16,py+cell*0.3,cell*0.14,cell*0.08,0,0,7); ctx.fill();
      const g=ctx.createRadialGradient(px-cell*0.1,py-cell*0.12,cell*0.05,px,py,cell*0.36);
      g.addColorStop(0,'#d8fbff'); g.addColorStop(.5,'#59e6ff'); g.addColorStop(1,'#0aa9d6');
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.arc(px,py,cell*0.34,0,7); ctx.fill();
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(px-cell*0.12,py-cell*0.06,cell*0.1,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(px+cell*0.12,py-cell*0.06,cell*0.1,0,7); ctx.fill();
      ctx.fillStyle='#111';
      ctx.beginPath(); ctx.arc(px-cell*0.1,py-cell*0.05,cell*0.045,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(px+cell*0.14,py-cell*0.05,cell*0.045,0,7); ctx.fill();
      ctx.strokeStyle='#111'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(px,py+cell*0.1,cell*0.14,0.2*Math.PI,0.8*Math.PI); ctx.stroke();
      ctx.globalAlpha=1; }
  }

  reset();
  requestAnimationFrame(loop);
})();
