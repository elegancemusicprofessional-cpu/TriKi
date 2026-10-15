/* ============ TRIKI - MOTOR DEL JUEGO v3 ============ */
(function(){
  const canvas=document.getElementById('gameCanvas');
  const ctx=canvas.getContext('2d');
  const area=document.getElementById('gameArea');

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
  let lives=3, coins=0, skill=5, invuln=0, usandoAnuncio=false;
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
  function colocarJugador(){
    const p=centro(1,1);
    player={ x:p.x, y:p.y, dir:'right' };
  }

  function reset(){
    rnd=mulberry32(Date.now()%100000);
    genMaze(); colocarJugador(); colocarZombies(); regenerarMonedas(); bullets=[];
    lives=3; coins=0; skill=5; gameOver=false; invuln=1.5;
    updateHud(); updateSkill();
  }
  function nuevaPartida(){
    genMaze(); colocarJugador(); colocarZombies(); regenerarMonedas(); bullets=[];
    lives=3; skill=5; gameOver=false; invuln=1.5;
    updateHud(); updateSkill();
  }

  function updateHud(){
    document.getElementById('hudLives').textContent='❤️ '+lives;
    document.getElementById('hudCoins').textContent='🪙 '+coins;
  }
  function updateSkill(){ document.getElementById('skillCount').textContent=skill; }

  /* ===== JOYSTICK 360 ===== */
  let inputDir=null, touching=false;
  const joyZone=document.getElementById('joyZone'), joyKnob=document.getElementById('joyKnob');
  function dirPorAngulo(dx,dy){
    const a=Math.atan2(dy,dx)*180/Math.PI;
    if(a>=-45&&a<45) return 'right';
    if(a>=45&&a<135) return 'down';
    if(a>=-135&&a<-45) return 'up';
    return 'left';
  }
  function moverKnob(dx,dy){
    const max=24, len=Math.hypot(dx,dy)||1, k=Math.min(len,max)/len;
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

  /* ===== ANUNCIO DEMO (uno solo) ===== */
  function mostrarAnuncioDemo(callback){
    if(usandoAnuncio) return;
    usandoAnuncio=true;
    const ov=document.createElement('div');
    ov.className='game-overlay';
    ov.style.position='fixed'; ov.style.zIndex=200;
    ov.innerHTML='<div class="ov-title">ANUNCIO 30s</div><div class="ov-title" style="font-size:40px" id="adDemoCount">30</div>';
    document.body.appendChild(ov);
    let s=30;
    const el=ov.querySelector('#adDemoCount');
    const t=setInterval(()=>{
      s--; el.textContent=s;
      if(s<=0){ clearInterval(t); ov.remove(); usandoAnuncio=false; callback(); }
    },1000);
  }

  /* ===== DISPARO (tap en pantalla o botón) ===== */
  function disparar(){
    if(!started||paused||gameOver) return;
    if(skill<=0){ mostrarAnuncioDemo(()=>{ skill=5; updateSkill(); }); return; }
    skill--; updateSkill();
    let target=null, best=1e9;
    zombies.forEach(z=>{ if(!z.alive) return;
      const d=Math.hypot(z.px-player.x, z.py-player.y); if(d<best){ best=d; target=z; } });
    bullets.push({ x:player.x, y:player.y, target, dx:0, dy:-1 });
  }
  canvas.addEventListener('pointerdown',()=>{ disparar(); });
  document.getElementById('skillBtn').addEventListener('click',()=>{ disparar(); });

  /* ===== BOTONES ===== */
  document.getElementById('restartBtn').style.display='none';
  document.getElementById('livesAdBtn').textContent='📺 VER ANUNCIO (30s) Y JUGAR DE NUEVO';
  document.getElementById('startBtn').addEventListener('click',()=>{ started=true; document.getElementById('startOverlay').hidden=true; });
  document.getElementById('pauseBtn').addEventListener('click',()=>{
    if(!started||gameOver) return;
    paused=!paused; document.getElementById('pauseOverlay').hidden=!paused;
  });
  document.getElementById('resumeBtn').addEventListener('click',()=>{ paused=false; document.getElementById('pauseOverlay').hidden=true; });
  document.getElementById('livesAdBtn').addEventListener('click',()=>{
    mostrarAnuncioDemo(()=>{ nuevaPartida(); document.getElementById('overOverlay').hidden=true; started=true; });
  });

  /* ===== COLISIÓN JUGADOR (continuo) ===== */
  function puedeMover(nx,ny){
    const r=cell*0.32;
    const minC=Math.floor((nx-r-offX)/cell), maxC=Math.floor((nx+r-offX)/cell);
    const minR=Math.floor((ny-r-offY)/cell), maxR=Math.floor((ny+r-offY)/cell);
    for(let rr=minR;rr<=maxR;rr++)for(let cc=minC;cc<=maxC;cc++){
      if(rr<0||rr>=ROWS||cc<0||cc>=COLS||grid[rr][cc]===1) return false;
    }
    return true;
  }
  function moverJugador(dt){
    if(!inputDir) return; // al soltar, se detiene (control total)
    const vel=cell*6.5*dt;
    if(inputDir==='left'||inputDir==='right'){
      const nx=player.x+(inputDir==='right'?vel:-vel);
      if(puedeMover(nx,player.y)) player.x=nx;
      const cy=Math.floor((player.y-offY)/cell);
      const targetY=offY+cy*cell+cell/2;
      const dy=targetY-player.y;
      const s=Math.sign(dy)*Math.min(Math.abs(dy),vel);
      if(puedeMover(player.x,player.y+s)) player.y+=s;
    } else {
      const ny=player.y+(inputDir==='down'?vel:-vel);
      if(puedeMover(player.x,ny)) player.y=ny;
      const cx=Math.floor((player.x-offX)/cell);
      const targetX=offX+cx*cell+cell/2;
      const dx=targetX-player.x;
      const s=Math.sign(dx)*Math.min(Math.abs(dx),vel);
      if(puedeMover(player.x+s,player.y)) player.x+=s;
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
  function zombieDecide(z){
    const opts=['right','left','down','up'].filter(d=>{ const [dr,dc]=DELTA[d]; return esCamino(z.r+dr,z.c+dc); });
    if(!opts.length) return;
    const back={ right:'left', left:'right', down:'up', up:'down' }[z.dir];
    let pool=opts.filter(d=>d!==back); if(!pool.length) pool=opts;
    pool.sort((d1,d2)=>{
      const [a1,b1]=DELTA[d1], [a2,b2]=DELTA[d2];
      return (Math.abs(z.r+a1-playerCelda().r)+Math.abs(z.c+b1-playerCelda().c))-
             (Math.abs(z.r+a2-playerCelda().r)+Math.abs(z.c+b2-playerCelda().c));
    });
    tryMove(z,(Math.random()<0.8)?pool[0]:pool[Math.floor(Math.random()*pool.length)]);
  }
  function playerCelda(){
    return { r:Math.floor((player.y-offY)/cell), c:Math.floor((player.x-offX)/cell) };
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
      stepEnt(z,3.4,dt);   // zombies un poco más lentos
      if(!z.moving) zombieDecide(z);
      if(invuln<=0 && Math.hypot(z.px-player.x, z.py-player.y)<cell*0.6) perderVida();
    });

    for(let i=bullets.length-1;i>=0;i--){
      const b=bullets[i];
      if(b.target&&b.target.alive){
        const dx=b.target.px-b.x, dy=b.target.py-b.y;
        const d=Math.hypot(dx,dy)||1;
        b.dx=dx/d; b.dy=dy/d;
        if(d<cell*0.4){ b.target.alive=false; b.target.respawn=10; bullets.splice(i,1); continue; }
      }
      b.x+=b.dx*cell*16*dt; b.y+=b.dy*cell*16*dt;
      const cr=Math.floor((b.y-offY)/cell), cc2=Math.floor((b.x-offX)/cell);
      if(!esCamino(cr,cc2)) bullets.splice(i,1);
    }
  }

  function perderVida(){
    lives--; updateHud();
    if(lives<=0){ gameOver=true; document.getElementById('overOverlay').hidden=false; return; }
    genMaze(); colocarJugador(); colocarZombies(); regenerarMonedas(); bullets=[];
    invuln=1.5; // respiro tras perder vida
  }

  function resize(){
    const w=area.clientWidth, h=area.clientHeight;
    if(canvas.width!==w||canvas.height!==h){ canvas.width=w; canvas.height=h; }
    cell=Math.min(w/COLS,h/ROWS);
    offX=(w-cell*COLS)/2; offY=(h-cell*ROWS)/2;
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
      ctx.beginPath(); ctx.arc(b.x-b.dx*6,b.y-b.dy*6,cell*0.2,0,7); ctx.fill();
      ctx.fillStyle='#ff7a00';
      ctx.beginPath(); ctx.arc(b.x,b.y,cell*0.16,0,7); ctx.fill();
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

    { const p=player;
      // parpadeo si es invulnerable
      if(invuln>0 && Math.floor(invuln*10)%2===0) ctx.globalAlpha=0.5;
      ctx.fillStyle='#e8332a';
      ctx.beginPath(); ctx.ellipse(p.x-cell*0.16,p.y+cell*0.3,cell*0.14,cell*0.08,0,0,7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(p.x+cell*0.16,p.y+cell*0.3,cell*0.14,cell*0.08,0,0,7); ctx.fill();
      const g=ctx.createRadialGradient(p.x-cell*0.1,p.y-cell*0.12,cell*0.05,p.x,p.y,cell*0.36);
      g.addColorStop(0,'#d8fbff'); g.addColorStop(.5,'#59e6ff'); g.addColorStop(1,'#0aa9d6');
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.arc(p.x,p.y,cell*0.34,0,7); ctx.fill();
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(p.x-cell*0.12,p.y-cell*0.06,cell*0.1,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x+cell*0.12,p.y-cell*0.06,cell*0.1,0,7); ctx.fill();
      ctx.fillStyle='#111';
      ctx.beginPath(); ctx.arc(p.x-cell*0.1,p.y-cell*0.05,cell*0.045,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x+cell*0.14,p.y-cell*0.05,cell*0.045,0,7); ctx.fill();
      ctx.strokeStyle='#111'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(p.x,p.y+cell*0.1,cell*0.14,0.2*Math.PI,0.8*Math.PI); ctx.stroke();
      ctx.globalAlpha=1; }
  }

  reset();
  requestAnimationFrame(loop);
})();
