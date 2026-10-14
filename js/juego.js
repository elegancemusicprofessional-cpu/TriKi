/* ============ TRIKI - MOTOR DEL JUEGO ============ */
(function(){
  const canvas=document.getElementById('gameCanvas');
  const ctx=canvas.getContext('2d');
  const area=document.getElementById('gameArea');

  const COLS=15, ROWS=21;
  let cell=0, offX=0, offY=0;

  // Semilla fija => laberinto SIEMPRE igual (estático)
  function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  const rnd=mulberry32(20261015);

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
    // abrir ciclos para que se parezca más a Pac-Man
    for(let r=1;r<ROWS-1;r++)for(let c=1;c<COLS-1;c++){
      if(grid[r][c]===1&&rnd()<0.14){
        if(grid[r][c-1]===0&&grid[r][c+1]===0) grid[r][c]=0;
        else if(grid[r-1][c]===0&&grid[r+1][c]===0) grid[r][c]=0;
      }
    }
    // puerta arriba-derecha conectada
    grid[DOOR.r][DOOR.c]=0; grid[DOOR.r][DOOR.c-1]=0; grid[DOOR.r+1][DOOR.c]=0;
  }

  const esCamino=(r,c)=> r>=0&&r<ROWS&&c>=0&&c<COLS&&grid[r][c]===0;

  // ---- estado ----
  let started=false, paused=false, gameOver=false;
  let lives=3, coins=0, skill=5;
  let player, zombies, bullets, coinSet;

  function centro(r,c){ return { x:offX+c*cell+cell/2, y:offY+r*cell+cell/2 }; }

  function nuevaEntidad(r,c){ return { r,c, tr:r, tc:c, t:0, moving:false, dir:null, px:0, py:0 }; }

  function reset(){
    genMaze();
    player=nuevaEntidad(1,1); player.dir='right';
    zombies=[];
    const zr=Math.floor(ROWS/2), zc=Math.floor(COLS/2);
    let sr=zr, sc=zc;
    outer: for(let r=1;r<ROWS-1;r++){ for(let c=1;c<COLS-1;c++){ if(grid[r][c]===0&&Math.abs(r-zr)+Math.abs(c-zc)<4){ sr=r; sc=c; break outer; } } }
    const cols=['#3dff7c','#b04dff','#28e0ff','#ff2e93'];
    for(let i=0;i<4;i++) zombies.push(Object.assign(nuevaEntidad(sr,sc),{ color:cols[i], alive:true, respawn:0 }));
    bullets=[];
    coinSet=new Set();
    for(let r=1;r<ROWS-1;r++)for(let c=1;c<COLS-1;c++){
      if(grid[r][c]===0 && (r+c)%2===0 && !(r===1&&c===1) && !(r===DOOR.r&&c===DOOR.c))
        coinSet.add(r+','+c);
    }
    lives=3; coins=0; skill=5; gameOver=false;
    updateHud(); updateSkill();
  }

  function updateHud(){
    document.getElementById('hudLives').textContent='❤️ '+lives;
    document.getElementById('hudCoins').textContent='🪙 '+coins;
  }
  function updateSkill(){ document.getElementById('skillCount').textContent=skill; }

  // ---- input: palanca + teclado ----
  let inputDir=null;
  const joyZone=document.getElementById('joyZone'), joyKnob=document.getElementById('joyKnob');
  function dirDesdeVector(dx,dy){
    if(Math.abs(dx)>Math.abs(dy)) return dx>0?'right':'left';
    return dy>0?'down':'up';
  }
  function moverKnob(dx,dy){
    const max=22;
    const len=Math.hypot(dx,dy)||1;
    const k=Math.min(len,max)/len;
    joyKnob.style.transform='translate('+(dx*k)+'px,'+(dy*k)+'px)';
  }
  joyZone.addEventListener('pointerdown',e=>{
    joyZone.setPointerCapture(e.pointerId);
    handleJoy(e);
  });
  joyZone.addEventListener('pointermove',e=>{ if(e.buttons||e.pointerType==='touch') handleJoy(e); });
  function handleJoy(e){
    const r=joyZone.getBoundingClientRect();
    const dx=e.clientX-(r.left+r.width/2);
    const dy=e.clientY-(r.top+r.height/2);
    moverKnob(dx,dy);
    if(Math.hypot(dx,dy)>8) inputDir=dirDesdeVector(dx,dy);
  }
  joyZone.addEventListener('pointerup',()=>{ reflejarKnob(); });
  joyZone.addEventListener('pointercancel',()=>{ reflejarKnob(); });
  function reflejarKnob(){
    const d=player?player.dir:null;
    const map={ right:[18,0], left:[-18,0], down:[0,18], up:[0,-18] };
    if(d&&started&&!paused){ const v=map[d]; joyKnob.style.transform='translate('+v[0]+'px,'+v[1]+'px)'; }
    else joyKnob.style.transform='translate(0,0)';
  }
  window.addEventListener('keydown',e=>{
    const k=e.key;
    if(k==='ArrowRight'||k==='d') inputDir='right';
    if(k==='ArrowLeft'||k==='a') inputDir='left';
    if(k==='ArrowDown'||k==='s') inputDir='down';
    if(k==='ArrowUp'||k==='w') inputDir='up';
  });

  // ---- botones ----
  document.getElementById('startBtn').addEventListener('click',()=>{
    started=true; document.getElementById('startOverlay').hidden=true;
  });
  document.getElementById('pauseBtn').addEventListener('click',()=>{
    if(!started||gameOver) return;
    paused=!paused;
    document.getElementById('pauseOverlay').hidden=!paused;
  });
  document.getElementById('resumeBtn').addEventListener('click',()=>{
    paused=false; document.getElementById('pauseOverlay').hidden=true;
  });
  document.getElementById('restartBtn').addEventListener('click',()=>{
    reset(); started=true;
    document.getElementById('overOverlay').hidden=true;
  });
  document.getElementById('livesAdBtn').addEventListener('click',()=>{
    // DEMO: en la versión real aquí va el anuncio de 30s (AdsGram/Monetag)
    lives+=3; updateHud();
    document.getElementById('overOverlay').hidden=true;
    gameOver=false; started=true;
  });
  document.getElementById('skillBtn').addEventListener('click',()=>{
    if(!started||paused||gameOver) return;
    if(skill<=0){
      // DEMO: en la real, anuncio de 30s por +5 bolitas
      skill=5; updateSkill(); return;
    }
    if(!player.dir) return;
    skill--; updateSkill();
    bullets.push({ x:player.px, y:player.py, dir:player.dir });
  });

  // ---- movimiento ----
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
    const opts=['right','left','down','up'].filter(d=>{
      const [dr,dc]=DELTA[d]; return esCamino(z.r+dr,z.c+dc);
    });
    if(!opts.length) return;
    const back={ right:'left', left:'right', down:'up', up:'down' }[z.dir];
    let pool=opts.filter(d=>d!==back); if(!pool.length) pool=opts;
    // elige el que más acerca al jugador (con algo de ruido)
    pool.sort((d1,d2)=>{
      const [a1,b1]=DELTA[d1], [a2,b2]=DELTA[d2];
      const d1v=Math.abs(z.r+a1-player.r)+Math.abs(z.c+b1-player.c);
      const d2v=Math.abs(z.r+a2-player.r)+Math.abs(z.c+b2-player.c);
      return d1v-d2v;
    });
    const pick=(Math.random()<0.8)? pool[0] : pool[Math.floor(Math.random()*pool.length)];
    tryMove(z,pick);
  }

  // ---- bucle ----
  let last=performance.now();
  function loop(now){
    const dt=Math.min((now-last)/1000,0.05); last=now;
    resize();
    if(started&&!paused&&!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function update(dt){
    // jugador
    if(!player.moving){
      if(inputDir) tryMove(player,inputDir);
    } else {
      // al llegar, sigue con inputDir si puede
    }
    stepEnt(player,6,dt);
    if(!player.moving&&inputDir) tryMove(player,inputDir);
    reflejarKnobSilente();

    // comer moneda
    const key=player.r+','+player.c;
    if(coinSet.has(key)){
      coinSet.delete(key); coins++; updateHud();
      setTimeout(()=>{ if(grid[player.r]&&esCamino(parseInt(key),key.split(',')[1])) {} },0);
      const [rr,cc]=key.split(',').map(Number);
      setTimeout(()=>{ if(esCamino(rr,cc)) coinSet.add(key); },10000);
    }

    // zombies
    zombies.forEach(z=>{
      if(!z.alive){
        z.respawn-=dt;
        if(z.respawn<=0){ z.alive=true; z.r=DOOR.r; z.c=DOOR.c; z.tr=z.r; z.tc=z.c; z.t=0; z.moving=false; }
        return;
      }
      if(!z.moving) zombieDecide(z);
      stepEnt(z,4.2,dt);
      if(!z.moving) zombieDecide(z);
      // chocar jugador
      if(Math.hypot(z.px-player.px,z.py-player.py)<cell*0.6) perderVida();
    });

    // bolitas
    for(let i=bullets.length-1;i>=0;i--){
      const b=bullets[i];
      const [dr,dc]=DELTA[b.dir];
      b.x+=dc*cell*10*dt; b.y+=dr*cell*10*dt;
      const cr=Math.floor((b.y-offY)/cell), cc2=Math.floor((b.x-offX)/cell);
      if(!esCamino(cr,cc2)){ bullets.splice(i,1); continue; }
      let hit=false;
      zombies.forEach(z=>{
        if(z.alive&&z.r===cr&&z.c===cc2){ z.alive=false; z.respawn=10; hit=true; }
      });
      if(hit){ bullets.splice(i,1); }
    }
  }

  function reflejarKnobSilente(){
    // la palanca se menee con el personaje (si no se está tocando)
    if(document.pointerLockElement) return;
    const d=player.dir;
    const map={ right:[14,0], left:[-14,0], down:[0,14], up:[0,-14] };
    if(d&&player.moving){ const v=map[d]; joyKnob.style.transform='translate('+v[0]+'px,'+v[1]+'px)'; }
  }

  function perderVida(){
    lives--; updateHud();
    if(lives<=0){ gameOver=true; document.getElementById('overOverlay').hidden=false; return; }
    player.r=1; player.c=1; player.tr=1; player.tc=1; player.t=0; player.moving=false;
  }

  // ---- render ----
  function resize(){
    const w=area.clientWidth, h=area.clientHeight;
    if(canvas.width!==w||canvas.height!==h){ canvas.width=w; canvas.height=h; }
    cell=Math.min(w/COLS,h/ROWS);
    offX=(w-cell*COLS)/2; offY=(h-cell*ROWS)/2;
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // pasto
    ctx.fillStyle='#177a2c'; ctx.fillRect(offX,offY,cell*COLS,cell*ROWS);
    ctx.fillStyle='rgba(255,255,255,.04)';
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){ if((r+c)%2===0) ctx.fillRect(offX+c*cell,offY+r*cell,cell,cell); }

    // muros (efecto muro/seto)
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      if(grid[r][c]===1){
        const x=offX+c*cell, y=offY+r*cell;
        ctx.fillStyle='#0d4d1c'; ctx.fillRect(x,y,cell,cell);
        ctx.fillStyle='#1f8f38'; ctx.fillRect(x+1,y+1,cell-2,cell-2);
        ctx.fillStyle='rgba(255,255,255,.18)'; ctx.fillRect(x+1,y+1,cell-2,3);
        ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(x+1,y+cell-4,cell-2,3);
      }
    }

    // puerta (spawn zombies)
    {
      const p=centro(DOOR.r,DOOR.c);
      ctx.fillStyle='#8f130c';
      ctx.fillRect(p.x-cell*0.4,p.y-cell*0.45,cell*0.8,cell*0.9);
      ctx.fillStyle='#e8332a';
      ctx.fillRect(p.x-cell*0.3,p.y-cell*0.35,cell*0.6,cell*0.7);
      ctx.fillStyle='#ffd21f';
      ctx.beginPath(); ctx.arc(p.x+cell*0.15,p.y,cell*0.06,0,7); ctx.fill();
    }

    // monedas
    coinSet.forEach(k=>{
      const [r,c]=k.split(',').map(Number);
      const p=centro(r,c);
      ctx.fillStyle='#ffd21f';
      ctx.beginPath(); ctx.arc(p.x,p.y,cell*0.16,0,7); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.7)';
      ctx.beginPath(); ctx.arc(p.x-cell*0.05,p.y-cell*0.05,cell*0.05,0,7); ctx.fill();
    });

    // bolitas
    bullets.forEach(b=>{
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(b.x,b.y,cell*0.14,0,7); ctx.fill();
      ctx.fillStyle='rgba(40,224,255,.8)';
      ctx.beginPath(); ctx.arc(b.x,b.y,cell*0.08,0,7); ctx.fill();
    });

    // zombies
    zombies.forEach(z=>{
      if(!z.alive) return;
      ctx.fillStyle=z.color;
      ctx.beginPath(); ctx.arc(z.px,z.py,cell*0.34,0,7); ctx.fill();
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(z.px-cell*0.12,z.py-cell*0.06,cell*0.1,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(z.px+cell*0.12,z.py-cell*0.06,cell*0.1,0,7); ctx.fill();
      ctx.fillStyle='#111';
      ctx.beginPath(); ctx.arc(z.px-cell*0.1,z.py-cell*0.05,cell*0.045,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(z.px+cell*0.14,z.py-cell*0.05,cell*0.045,0,7); ctx.fill();
    });

    // jugador (burbuja celeste + zapatos rojos)
    {
      const p=player;
      ctx.fillStyle='#e8332a';
      ctx.beginPath(); ctx.ellipse(p.px-cell*0.16,p.py+cell*0.3,cell*0.14,cell*0.08,0,0,7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(p.px+cell*0.16,p.py+cell*0.3,cell*0.14,cell*0.08,0,0,7); ctx.fill();
      const g=ctx.createRadialGradient(p.px-cell*0.1,p.py-cell*0.12,cell*0.05,p.px,p.py,cell*0.36);
      g.addColorStop(0,'#d8fbff'); g.addColorStop(.5,'#59e6ff'); g.addColorStop(1,'#0aa9d6');
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.arc(p.px,p.py,cell*0.34,0,7); ctx.fill();
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(p.px-cell*0.12,p.py-cell*0.06,cell*0.1,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(p.px+cell*0.12,p.py-cell*0.06,cell*0.1,0,7); ctx.fill();
      ctx.fillStyle='#111';
      ctx.beginPath(); ctx.arc(p.px-cell*0.1,p.py-cell*0.05,cell*0.045,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(p.px+cell*0.14,p.py-cell*0.05,cell*0.045,0,7); ctx.fill();
      ctx.strokeStyle='#111'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(p.px,p.py+cell*0.1,cell*0.14,0.2*Math.PI,0.8*Math.PI); ctx.stroke();
    }
  }

  reset();
  requestAnimationFrame(loop);
})();
