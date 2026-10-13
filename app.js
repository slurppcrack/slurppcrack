// NEXUS LAB — one file to rule them all
const $ = s=>document.querySelector(s);
const $$ = s=>[...document.querySelectorAll(s)];

// global state
let interactions = 0;
function bump(){ interactions++; const a=$('#statInteract'); if(a) a.textContent=interactions; const b=$('#clickCount'); if(b) b.textContent=interactions; }
document.addEventListener('click', bump);
document.addEventListener('keydown', bump);

// cursor
const cursor=$('#cursor'), dot=$('#cursorDot');
let mx=innerWidth/2, my=innerHeight/2, cmx=mx, cmy=my;
addEventListener('mousemove', e=>{ mx=e.clientX; my=e.clientY; });
(function loopCursor(){
  cmx += (mx-cmx)*0.15; cmy+= (my-cmy)*0.15;
  if(cursor){ cursor.style.left=cmx+'px'; cursor.style.top=cmy+'px'; }
  if(dot){ dot.style.left=mx+'px'; dot.style.top=my+'px'; }
  requestAnimationFrame(loopCursor);
})();
$$('.cap').forEach(c=>{
  c.addEventListener('mousemove', e=>{
    const r=c.getBoundingClientRect();
    c.style.setProperty('--mx', ((e.clientX-r.left)/r.width*100)+'%');
    c.style.setProperty('--my', ((e.clientY-r.top)/r.height*100)+'%');
  });
});
// tilt
$$('[data-tilt]').forEach(el=>{
  el.addEventListener('mousemove', e=>{
    const r=el.getBoundingClientRect();
    const px=(e.clientX-r.left)/r.width-0.5, py=(e.clientY-r.top)/r.height-0.5;
    el.style.transform=`perspective(700px) rotateY(${px*8}deg) rotateX(${-py*8}deg) translateY(-4px)`;
  });
  el.addEventListener('mouseleave', ()=> el.style.transform='');
});

// clock & fps
function tickClock(){ const d=new Date(); $('#clock').textContent=d.toLocaleTimeString('ru-RU'); }
setInterval(tickClock,1000); tickClock();
let fpsEl=$('#fps'), frames=0, lastFps=performance.now();
(function fpsLoop(){
  frames++; const now=performance.now();
  if(now-lastFps>500){ const fps=Math.round(frames*1000/(now-lastFps)); if(fpsEl) fpsEl.textContent=fps+' FPS'; if(window.physFPS) $('#physFPS').textContent=fps+' FPS'; frames=0; lastFps=now; }
  requestAnimationFrame(fpsLoop);
})();

// lines counter animation
let lines=0; const linesEl=$('#statLines');
setInterval(()=>{ if(lines<8421){ lines+= Math.floor(Math.random()*37+12); if(lines>8421) lines=8421; linesEl.textContent=lines.toLocaleString('ru-RU'); } },90);

// burger & tabs
$('#burger')?.addEventListener('click', ()=> document.querySelector('.nav').classList.toggle('open'));
$$('.tab').forEach(t=> t.addEventListener('click', ()=>{
  $$('.tab').forEach(x=>x.classList.remove('active')); t.classList.add('active');
  $$('.panel').forEach(p=>p.classList.remove('active'));
  const id='panel-'+t.dataset.tab; document.getElementById(id)?.classList.add('active');
  if(t.dataset.tab==='generative') setTimeout(()=>genDraw(),50);
}));

// HERO PARTICLES
(function(){
  const c=$('#heroCanvas'); if(!c) return; const ctx=c.getContext('2d');
  let w,h,dpr, particles=[];
  function resize(){ dpr=Math.min(devicePixelRatio||1,2); w=c.clientWidth= c.offsetWidth; h=c.clientHeight= c.offsetHeight; c.width=w*dpr; c.height=h*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
  function init(){ particles=[]; const n= Math.min(140, Math.floor(w*h/9000)); for(let i=0;i<n;i++) particles.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*0.7,vy:(Math.random()-.5)*0.7,r:Math.random()*1.8+0.6}) }
  let mouse={x: innerWidth/2, y: innerHeight/2, active:false};
  addEventListener('mousemove', e=>{ mouse.x=e.clientX; mouse.y=e.clientY; mouse.active=true; });
  addEventListener('resize', ()=>{ resize(); init(); });
  resize(); init();
  let t=0;
  (function loop(){
    t+=0.004;
    ctx.clearRect(0,0,w,h);
    // subtle gradient
    const g=ctx.createRadialGradient(w*0.5,h*0.35,0,w*0.5,h*0.35,Math.max(w,h));
    g.addColorStop(0,'rgba(124,92,255,.08)'); g.addColorStop(1,'transparent');
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    // update & draw particles
    for(const p of particles){
      // gentle drift + mouse
      if(mouse.active){
        const dx=mouse.x - p.x, dy=mouse.y - p.y, dist=Math.hypot(dx,dy);
        if(dist<180){ p.vx += dx*0.00008; p.vy += dy*0.00008; }
      }
      p.x += p.vx + Math.sin(t + p.y*0.01)*0.12;
      p.y += p.vy + Math.cos(t + p.x*0.01)*0.12;
      p.vx*=0.998; p.vy*=0.998;
      if(p.x<0||p.x>w) p.vx*=-1;
      if(p.y<0||p.y>h) p.vy*=-1;
      p.x=Math.max(0,Math.min(w,p.x)); p.y=Math.max(0,Math.min(h,p.y));
    }
    // connections
    ctx.lineWidth=0.7;
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const a=particles[i], b=particles[j];
        const d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d<130){
          ctx.strokeStyle=`rgba(124,92,255,${(1-d/130)*0.22})`;
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
    }
    for(const p of particles){
      ctx.fillStyle='rgba(220,225,255,.95)';
      ctx.shadowColor='rgba(124,92,255,.6)'; ctx.shadowBlur=8;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
    }
    requestAnimationFrame(loop);
  })();
})();

// ============ NEURAL NETWORK (2-4-1) ============
(function(){
  const canvas=$('#neuralCanvas'); if(!canvas) return; const ctx=canvas.getContext('2d');
  function resize(){ const r=canvas.getBoundingClientRect(); const dpr=Math.min(devicePixelRatio,2); canvas.width=r.width*dpr; canvas.height=r.height*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
  addEventListener('resize', resize); resize();
  const W = ()=>canvas.width/Math.min(devicePixelRatio,2), H=()=>canvas.height/Math.min(devicePixelRatio,2);
  // params
  let w1, b1, w2, b2;
  function rand(){ return Math.random()*2-1; }
  function init(){
    w1 = Array.from({length:4}, ()=> [rand(), rand()]);
    b1 = Array.from({length:4}, ()=> rand()*0.5);
    w2 = Array.from({length:4}, ()=> rand());
    b2 = rand()*0.5;
    epoch=0; loss=1; acc=0; updateTable();
  }
  const sigmoid = x=>1/(1+Math.exp(-x));
  const dsigmoid = y=> y*(1-y);
  let epoch=0, loss=0, acc=0;
  const data = [[0,0,0],[0,1,1],[1,0,1],[1,1,0]];
  function forward(x0,x1){
    const h=[]; for(let i=0;i<4;i++){ const s=x0*w1[i][0]+x1*w1[i][1]+b1[i]; h.push(sigmoid(s)); }
    let o=0; for(let i=0;i<4;i++) o+= h[i]*w2[i]; o+=b2; o=sigmoid(o);
    return {h, o};
  }
  function trainStep(lr=0.5){
    let tot=0;
    for(const [x0,x1,y] of data){
      const {h,o}=forward(x0,x1);
      const err=y-o; tot+= err*err;
      const d_o = err * dsigmoid(o);
      // update w2,b2
      for(let i=0;i<4;i++) w2[i]+= lr * d_o * h[i];
      b2+= lr*d_o;
      // hidden
      for(let i=0;i<4;i++){
        const d_h = d_o * w2[i] * dsigmoid(h[i]);
        w1[i][0]+= lr*d_h*x0;
        w1[i][1]+= lr*d_h*x1;
        b1[i]+= lr*d_h;
      }
    }
    epoch++; loss=tot/4;
    // acc
    let correct=0; for(const [a,b,y] of data){ const p=forward(a,b).o>0.5?1:0; if(p===y) correct++; }
    acc=correct/4;
  }
  function train(n=500){ for(let i=0;i<n;i++) trainStep(); updateUI(); }
  function updateUI(){
    $('#epoch').textContent=epoch;
    $('#loss').textContent=loss.toFixed(4);
    $('#acc').textContent=Math.round(acc*100)+'%';
    updateTable();
  }
  function updateTable(){
    const el=$('#xorTable'); el.innerHTML='';
    for(const [a,b,y] of data){
      const out=forward(a,b).o; const pred=out>0.5?1:0; const ok=pred===y;
      const d=document.createElement('div'); d.className='xor-cell '+(ok?'ok':'bad');
      d.innerHTML=`${a} ⊕ ${b} = ${pred}<br><span style="opacity:.6">${out.toFixed(2)}</span>`;
      el.appendChild(d);
    }
  }
  // draw
  let hover=null;
  canvas.addEventListener('mousemove', e=>{
    const r=canvas.getBoundingClientRect(); const x=(e.clientX-r.left), y=(e.clientY-r.top);
    // detect nearest neuron
    const Wv=W(), Hv=H();
    const positions = getPositions(Wv,Hv);
    hover=null; let best=30;
    positions.forEach((p,i)=>{ const d=Math.hypot(p.x-x,p.y-y); if(d<best){ best=d; hover=i; }});
  });
  canvas.addEventListener('mouseleave', ()=> hover=null);
  function getPositions(W,H){
    const left=90, right=W-90, midY=H/2;
    return [
      {x:left,y:midY-60,label:'x₁',type:'in'}, {x:left,y:midY+60,label:'x₂',type:'in'},
      {x:W/2-40,y:midY-70,label:'h₁',type:'h'}, {x:W/2-13,y:midY-23,label:'h₂',type:'h'},
      {x:W/2+13,y:midY+23,label:'h₃',type:'h'}, {x:W/2+40,y:midY+70,label:'h₄',type:'h'},
      {x:right,y:midY,label:'y',type:'out'}
    ];
  }
  (function drawLoop(){
    const Wv=W(), Hv=H();
    ctx.clearRect(0,0,Wv,Hv);
    const pos=getPositions(Wv,Hv);
    // connections
    // input -> hidden
    for(let i=0;i<2;i++) for(let j=0;j<4;j++){
      const a=pos[i], b=pos[2+j]; const w=w1[j][i];
      ctx.strokeStyle= w>0 ? `rgba(0,229,255,${Math.min(1,Math.abs(w))})` : `rgba(255,59,154,${Math.min(1,Math.abs(w))})`;
      ctx.lineWidth= Math.min(4, Math.abs(w)*3+0.6);
      ctx.beginPath(); ctx.moveTo(a.x,a.y); // curved
      const mx=(a.x+b.x)/2; ctx.quadraticCurveTo(mx, (a.y+b.y)/2 + (j%2?14:-14), b.x,b.y); ctx.stroke();
    }
    // hidden -> out
    for(let j=0;j<4;j++){
      const a=pos[2+j], b=pos[6]; const w=w2[j];
      ctx.strokeStyle= w>0 ? `rgba(0,229,255,${Math.min(1,Math.abs(w))})` : `rgba(255,59,154,${Math.min(1,Math.abs(w))})`;
      ctx.lineWidth= Math.min(5, Math.abs(w)*4+0.8);
      ctx.beginPath(); ctx.moveTo(a.x,a.y); const mx=(a.x+b.x)/2; ctx.quadraticCurveTo(mx, (a.y+b.y)/2, b.x,b.y); ctx.stroke();
    }
    // nodes
    pos.forEach((p,idx)=>{
      const isHover = hover===idx;
      const r = isHover? 22:18;
      // glow
      ctx.shadowColor = p.type==='in' ? 'rgba(0,229,255,.6)' : p.type==='out' ? 'rgba(124,92,255,.7)' : 'rgba(255,255,255,.35)';
      ctx.shadowBlur = isHover?18:10;
      ctx.fillStyle = p.type==='in' ? '#0e2a33' : p.type==='out' ? '#1a1633' : '#1e212e';
      if(isHover) ctx.fillStyle='#252a40';
      ctx.strokeStyle='rgba(255,255,255,.14)';
      ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.shadowBlur=0;
      ctx.fillStyle='#eef0ff'; ctx.font=`700 ${isHover?12:11}px JetBrains Mono`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(p.label, p.x, p.y);
      if(isHover){
        // tooltip with weights
        let txt='';
        if(p.type==='h'){ txt=`w: ${w1[idx-2][0].toFixed(2)}, ${w1[idx-2][1].toFixed(2)} • b ${b1[idx-2].toFixed(2)}`; }
        else if(p.type==='out'){ txt=`b ${b2.toFixed(2)} • w [${w2.map(v=>v.toFixed(2)).join(', ')}]`; }
        else txt='вход';
        ctx.fillStyle='rgba(0,0,0,.72)'; ctx.fillRect(p.x-70,p.y+r+6,140,18);
        ctx.fillStyle='#b9c1ff'; ctx.font='10px JetBrains Mono'; ctx.fillText(txt,p.x,p.y+r+15);
      }
    });
    // loss sparkline maybe
    requestAnimationFrame(drawLoop);
  })();
  init(); updateUI();
  $('#trainBtn').addEventListener('click', ()=> train(500));
  $('#resetNet').addEventListener('click', ()=>{ init(); updateUI(); });
  let auto=null;
  $('#autoTrain').addEventListener('click', e=>{
    if(auto){ clearInterval(auto); auto=null; e.target.textContent='Авто: ВЫКЛ'; e.target.classList.remove('primary'); }
    else { auto=setInterval(()=>{ train(12); }, 40); e.target.textContent='Авто: ON'; e.target.classList.add('primary'); }
  });
})();

// ============ GENERATIVE ============
(function(){
  const canvas=$('#genCanvas'); if(!canvas) return; const ctx=canvas.getContext('2d');
  function fit(){ const r=canvas.getBoundingClientRect(); const dpr=Math.min(devicePixelRatio,2); canvas.width=r.width*dpr; canvas.height=r.height*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); return {w:r.width,h:r.height}; }
  let W,H; function resize(){ const s=fit(); W=s.w; H=s.h; }
  addEventListener('resize', resize); resize();
  const chaosEl=$('#chaos'), densEl=$('#density'), chaosV=$('#chaosV'), densV=$('#densV');
  chaosEl.addEventListener('input', ()=> chaosV.textContent=chaosEl.value);
  densEl.addEventListener('input', ()=> densV.textContent=densEl.value);
  const palettes=[
    ['#7c5cff','#00e5ff','#ff3b9a','#ffe74c'],
    ['#00ffb8','#00a3ff','#7c5cff','#ffffff'],
    ['#ff6a00','#ff006a','#7c5cff','#00e5ff'],
    ['#0aff6e','#00e5ff','#7c5cff','#ff3b9a'],
    ['#fff','#aaa','#7c5cff','#00e5ff']
  ];
  let curPal=0;
  function renderPalette(){
    const el=$('#palette'); el.innerHTML='';
    palettes[curPal].forEach(c=>{ const s=document.createElement('span'); s.style.background=c; s.title=c; el.appendChild(s); });
  }
  renderPalette();
  function noiseAngle(x,y, t, chaos){
    // pseudo noise via sin
    const s = chaos/35;
    return Math.sin(x*0.008*s + t) * Math.cos(y*0.008*s - t*0.7) * Math.PI*4 + Math.sin((x+y)*0.003)*2;
  }
  function genDraw(){
    const c = parseInt(chaosEl.value,10), dens=parseInt(densEl.value,10);
    ctx.clearRect(0,0,W,H);
    // bg
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#0b0c12'); g.addColorStop(1,'#0f1320');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    // subtle vignette
    const rg=ctx.createRadialGradient(W*0.5,H*0.5,0,W*0.5,H*0.5,Math.max(W,H)*0.8);
    rg.addColorStop(0,'transparent'); rg.addColorStop(1,'rgba(0,0,0,.35)');
    ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
    const cols=palettes[curPal];
    const t=Math.random()*100;
    ctx.lineWidth=1.1; ctx.lineCap='round';
    for(let i=0;i<dens;i++){
      let x=Math.random()*W, y=Math.random()*H;
      const hue = cols[Math.floor(Math.random()*cols.length)];
      ctx.strokeStyle=hue; ctx.globalAlpha=0.85; ctx.beginPath(); ctx.moveTo(x,y);
      const steps= 18 + Math.random()*22 * (c/50+0.5);
      for(let s=0;s<steps;s++){
        const a=noiseAngle(x,y,t,c); const len= 6 + Math.random()*6;
        x += Math.cos(a)*len; y+= Math.sin(a)*len;
        if(x<0||x>W||y<0||y>H) break;
        // add wobble
        ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
  window.genDraw=genDraw;
  $('#genNew').addEventListener('click', ()=>{ curPal=(curPal+1)%palettes.length; renderPalette(); genDraw(); });
  $('#genSave').addEventListener('click', ()=>{
    const a=document.createElement('a'); a.download='nexus-generative.png'; a.href=canvas.toDataURL('image/png'); a.click();
  });
  setTimeout(genDraw,200);
})();

// ============ PHYSICS ============
(function(){
  const canvas=$('#physCanvas'); if(!canvas) return; const ctx=canvas.getContext('2d');
  let W,H,dpr; function fit(){ const r=canvas.getBoundingClientRect(); dpr=Math.min(devicePixelRatio,2); W=r.width; H=r.height; canvas.width=W*dpr; canvas.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
  addEventListener('resize', fit); fit();
  let balls=[]; let gravity=true; let ballSize=14;
  $('#ballSize').addEventListener('input', e=>{ ballSize=parseInt(e.target.value,10); $('#ballSizeV').textContent=ballSize; });
  $('#physGravity').addEventListener('click', e=>{ gravity=!gravity; e.target.textContent='Гравитация: '+(gravity?'ON':'OFF'); });
  function addBalls(n, x, y){
    for(let i=0;i<n;i++){
      const r = ballSize*(0.7+Math.random()*0.8);
      balls.push({
        x: x ?? Math.random()*W, y: y ?? Math.random()*60,
        vx:(Math.random()-.5)*6, vy:(Math.random()-.5)*4,
        r, m:r,
        c:`hsl(${260+ Math.random()*60},100%,${62+Math.random()*14}%)`,
        life:1
      });
    }
  }
  addBalls(14);
  $('#physAdd').addEventListener('click', ()=> addBalls(20));
  $('#physClear').addEventListener('click', ()=> balls=[]);
  // interaction
  let drag=null, mouse={x:0,y:0,down:false};
  function pos(e){
    const r=canvas.getBoundingClientRect();
    const p=e.touches? e.touches[0]: e;
    return {x: (p.clientX-r.left), y:(p.clientY-r.top)};
  }
  canvas.addEventListener('mousedown', e=>{
    const p=pos(e); mouse.down=true; mouse.x=p.x; mouse.y=p.y;
    // find ball
    for(let i=balls.length-1;i>=0;i--){ const b=balls[i]; if(Math.hypot(b.x-p.x,b.y-p.y)<b.r+6){ drag={b, dx:b.x-p.x, dy:b.y-p.y}; break; } }
    if(!drag) addBalls(1,p.x,p.y);
  });
  canvas.addEventListener('mousemove', e=>{ const p=pos(e); mouse.x=p.x; mouse.y=p.y; if(drag){ drag.b.x=p.x+drag.dx; drag.b.y=p.y+drag.dy; drag.b.vx=0; drag.b.vy=0; }});
  addEventListener('mouseup', ()=>{
    if(drag){ const dx=mouse.x - (drag.b.x - drag.dx), dy=mouse.y-(drag.b.y-drag.dy); // approx velocity
      // compute velocity from movement
    }
    drag=null; mouse.down=false;
  });
  canvas.addEventListener('touchstart', e=>{ const p=pos(e); addBalls(1,p.x,p.y); }, {passive:true});
  canvas.addEventListener('dblclick', e=>{
    const p=pos(e);
    // explosion
    for(const b of balls){
      const dx=b.x-p.x, dy=b.y-p.y, d=Math.hypot(dx,dy)||1;
      const f= 1800/(d+30); b.vx+= dx/d*f*0.09; b.vy+= dy/d*f*0.09;
    }
    // flash
    ctx.fillStyle='rgba(255,255,255,.12)'; ctx.fillRect(0,0,W,H);
  });
  // physics loop
  function step(){
    // draw bg
    ctx.clearRect(0,0,W,H);
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#0b0d14'); g.addColorStop(1,'#0e1220');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    // grid
    ctx.strokeStyle='rgba(255,255,255,.04)'; ctx.lineWidth=1;
    for(let x=0;x<W;x+=28){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for(let y=0;y<H;y+=28){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    // update
    for(const b of balls){
      if(drag && drag.b===b) continue;
      if(gravity) b.vy+=0.28;
      b.vy*=0.998; b.vx*=0.998;
      b.x+=b.vx; b.y+=b.vy;
      // walls
      if(b.x-b.r<0){ b.x=b.r; b.vx*=-0.86; }
      if(b.x+b.r>W){ b.x=W-b.r; b.vx*=-0.86; }
      if(b.y+b.r>H){ b.y=H-b.r; b.vy*=-0.72; b.vx*=0.96; if(Math.abs(b.vy)<0.35) b.vy=0; }
      if(b.y-b.r<0){ b.y=b.r; b.vy*=-0.86; }
    }
    // collisions O(n^2) but n ~ <120
    for(let i=0;i<balls.length;i++) for(let j=i+1;j<balls.length;j++){
      const a=balls[i], b=balls[j];
      const dx=b.x-a.x, dy=b.y-a.y, d=Math.hypot(dx,dy), min=a.r+b.r;
      if(d<min && d>0.1){
        const nx=dx/d, ny=dy/d, overlap=(min-d)/2;
        if(!(drag && (drag.b===a||drag.b===b))){
          a.x-= nx*overlap; a.y-= ny*overlap; b.x+= nx*overlap; b.y+= ny*overlap;
          // elastic
          const dvx=b.vx-a.vx, dvy=b.vy-a.vy, dot=dvx*nx + dvy*ny;
          if(dot<0){
            const imp = (2*dot)/(a.m+b.m);
            a.vx+= imp*b.m*nx; a.vy+= imp*b.m*ny;
            b.vx-= imp*a.m*nx; b.vy-= imp*a.m*ny;
            // damping
            a.vx*=0.99; a.vy*=0.99; b.vx*=0.99; b.vy*=0.99;
          }
        }
      }
    }
    // draw balls
    for(const b of balls){
      ctx.shadowColor=b.c; ctx.shadowBlur=14;
      ctx.fillStyle=b.c;
      ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
      // highlight
      ctx.fillStyle='rgba(255,255,255,.22)';
      ctx.beginPath(); ctx.arc(b.x-b.r*0.28,b.y-b.r*0.32,b.r*0.3,0,Math.PI*2); ctx.fill();
    }
    // drag line
    if(drag){
      ctx.strokeStyle='rgba(0,229,255,.7)'; ctx.setLineDash([6,6]); ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(drag.b.x,drag.b.y); ctx.lineTo(mouse.x,mouse.y); ctx.stroke(); ctx.setLineDash([]);
    }
    $('#physCount').textContent=balls.length+' тел';
    requestAnimationFrame(step);
  }
  step();
})();

// ============ HOLOGRAM ============
(function(){
  const scene=$('#holoScene'), cube=$('#cube'), stage=$('#holoStage');
  if(!scene||!cube) return;
  let rx=-22, ry=34, scale=1, auto=true, shape='cube', wire=false;
  let dragging=false, lastX=0, lastY=0;
  function apply(){
    scene.style.transform=`scale(${scale}) rotateX(${rx}deg) rotateY(${ry}deg)`;
    if(wire) cube.style.setProperty('--wire','1'); else cube.style.removeProperty('--wire');
  }
  function anim(){
    if(auto && !dragging){ ry+=0.32; apply(); }
    requestAnimationFrame(anim);
  }
  anim(); apply();
  stage.addEventListener('mousedown', e=>{ dragging=true; lastX=e.clientX; lastY=e.clientY; });
  addEventListener('mouseup', ()=> dragging=false);
  addEventListener('mousemove', e=>{
    if(!dragging) return;
    ry += (e.clientX-lastX)*0.42; rx -= (e.clientY-lastY)*0.42;
    lastX=e.clientX; lastY=e.clientY; auto=false; $('#holoAuto').textContent='Авто-вращение'; apply();
  });
  stage.addEventListener('wheel', e=>{
    e.preventDefault(); scale = Math.max(0.55, Math.min(1.8, scale + (-e.deltaY*0.001))); apply();
  }, {passive:false});
  // touch
  stage.addEventListener('touchstart', e=>{ dragging=true; lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; }, {passive:true});
  stage.addEventListener('touchmove', e=>{
    if(!dragging) return; const t=e.touches[0]; ry+=(t.clientX-lastX)*0.42; rx-=(t.clientY-lastY)*0.42; lastX=t.clientX; lastY=t.clientY; apply();
  }, {passive:true});
  stage.addEventListener('touchend', ()=> dragging=false);
  $('#holoAuto').addEventListener('click', e=>{
    auto=!auto; e.target.textContent= auto? 'Авто: ON':'Авто-вращение';
  });
  $('#holoWire').addEventListener('click', e=>{
    wire=!wire; e.target.textContent='Каркас: '+(wire?'ON':'OFF');
    cube.querySelectorAll('.face').forEach(f=>{
      f.style.background = wire? 'transparent' : '';
      f.style.border = wire? '1px solid rgba(124,92,255,.9)':'';
      f.style.boxShadow = wire? 'none':'';
    });
  });
  $('#holoShape').addEventListener('click', e=>{
    const shapes=['cube','pyramid','prism']; // fake cycle just color cycle for demo
    shape = shape==='cube'?'pyramid':'cube';
    e.target.textContent='Форма: '+(shape==='cube'?'КУБ':'ПИРАМИДА');
    if(shape==='pyramid'){
      cube.style.transform='rotateX(8deg)';
      cube.querySelectorAll('.face').forEach((f,i)=>{
        f.style.background=`linear-gradient(135deg, hsl(${280+i*24},100%,62%), hsl(${190+i*12},100%,60%))`;
        f.style.clipPath = i<4 ? 'polygon(50% 0, 100% 100%, 0 100%)' : '';
      });
    } else {
      cube.style.transform='';
      cube.querySelectorAll('.face').forEach(f=>{ f.style.clipPath=''; f.style.background='';});
    }
  });
})();

// ============ DOJO ============
(function(){
  const canvas=$('#dojoCanvas'), ctx=canvas.getContext('2d');
  const ta=$('#code'), out=$('#console'), runBtn=$('#runBtn');
  if(!canvas) return;
  function fit(){ const r=canvas.getBoundingClientRect(); const dpr=Math.min(devicePixelRatio,2); canvas.width=r.width*dpr; canvas.height=r.height*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); return {w:r.width,h:r.height}; }
  let W,H; function resize(){ const s=fit(); W=s.w; H=s.h; if(!hasRun) drawWelcome(); }
  addEventListener('resize', resize); resize();
  let hasRun=false;
  function drawWelcome(){
    ctx.clearRect(0,0,W,H);
    const g=ctx.createRadialGradient(W*0.3,H*0.2,0,W*0.3,H*0.2,Math.max(W,H));
    g.addColorStop(0,'rgba(124,92,255,.18)'); g.addColorStop(1,'transparent');
    ctx.fillStyle='#0b0c12'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  }
  drawWelcome();
  function print(...args){
    const line=document.createElement('div'); line.className='console-line'; line.textContent='› '+args.join(' ');
    out.appendChild(line); out.scrollTop=out.scrollHeight;
  }
  function clearConsole(){ out.innerHTML=''; }
  window.print=print; // for snippets
  window.clear=()=>{ ctx.clearRect(0,0,W,H); ctx.fillStyle='#0b0c12'; ctx.fillRect(0,0,W,H); };
  window.confetti=()=>{
    for(let i=0;i<140;i++){
      const x=Math.random()*W, y=Math.random()*H*0.2;
      const vx=(Math.random()-.5)*10, vy=Math.random()*6+2;
      const col=`hsl(${260+Math.random()*60},100%,65%)`;
      let X=x,Y=y,VX=vx,VY=vy;
      const tick=()=>{
        X+=VX; Y+=VY; VY+=0.22; VX*=0.99;
        ctx.fillStyle=col; ctx.fillRect(X,Y,4,6);
        if(Y<H+20) requestAnimationFrame(tick);
      }; tick();
    }
    print('🎉 confetti!');
  };
  window.matrix=()=>{
    ctx.fillStyle='rgba(11,12,18,.28)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#00ff88'; ctx.font='12px JetBrains Mono';
    const cols=Math.floor(W/12); const drops=Array(cols).fill(0).map(()=> Math.random()*H);
    let frame=0;
    const id=setInterval(()=>{
      ctx.fillStyle='rgba(11,12,18,.18)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#7aff9e'; ctx.shadowColor='#00ff88'; ctx.shadowBlur=6;
      drops.forEach((y,i)=>{
        const x=i*12; const ch= String.fromCharCode(0x30A0+Math.random()*96);
        ctx.fillText(ch,x,y);
        drops[i]= y>H? 0 : y+12+Math.random()*10;
      });
      ctx.shadowBlur=0;
      if(++frame>140) clearInterval(id);
    },42);
    print('matrix rain activated');
  };
  window.particles=(n=120)=>{
    clear();
    const ps=[]; for(let i=0;i<n;i++) ps.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,r:Math.random()*3+1});
    let f=0; (function loop(){
      ctx.fillStyle='rgba(11,12,18,.18)'; ctx.fillRect(0,0,W,H);
      for(const p of ps){
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>W) p.vx*=-1; if(p.y<0||p.y>H) p.vy*=-1;
        ctx.fillStyle=`hsl(${260+ (p.x/W)*60},100%,65%)`; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      }
      for(let i=0;i<ps.length;i++) for(let j=i+1;j<ps.length;j++){
        const a=ps[i],b=ps[j],d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d<90){ ctx.strokeStyle=`rgba(124,92,255,${0.18*(1-d/90)})`; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
      }
      if(f++<400) requestAnimationFrame(loop);
    })();
    print(`particles(${n}) запущены`);
  };
  window.fractal=()=>{
    clear(); ctx.strokeStyle='rgba(124,92,255,.9)'; ctx.lineWidth=1.2;
    function branch(x,y,len,ang,depth){
      if(depth===0) return;
      const x2=x+Math.cos(ang)*len, y2=y+Math.sin(ang)*len;
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x2,y2); ctx.stroke();
      branch(x2,y2,len*0.68,ang-0.52,depth-1);
      branch(x2,y2,len*0.68,ang+0.52,depth-1);
    }
    branch(W/2,H, 74, -Math.PI/2, 9);
    print('fractal tree drawn');
  };
  function run(){
    hasRun=true; clearConsole();
    const code=ta.value;
    try{
      const fn=new Function('w','h','ctx','print','clear','confetti','matrix','particles','fractal', code);
      // ensure canvas cleared with default bg if not cleared
      ctx.fillStyle='#0b0c12'; ctx.fillRect(0,0,W,H);
      fn(W,H,ctx,print, window.clear, window.confetti, window.matrix, window.particles, window.fractal);
      const ok=document.createElement('div'); ok.className='console-line ok'; ok.textContent='✓ выполнено без ошибок'; out.appendChild(ok);
    }catch(e){
      const er=document.createElement('div'); er.className='console-line err'; er.textContent='✗ '+e.message; out.appendChild(er);
    }
  }
  runBtn.addEventListener('click', run);
  ta.addEventListener('keydown', e=>{
    if((e.ctrlKey||e.metaKey) && e.key==='Enter'){ e.preventDefault(); run(); }
    if(e.key==='Tab'){ e.preventDefault(); const s=ta.selectionStart, en=ta.selectionEnd; ta.value=ta.value.substring(0,s)+'  '+ta.value.substring(en); ta.selectionStart=ta.selectionEnd=s+2; }
  });
  window.insertSnippet=(s)=>{
    const st=ta.selectionStart; ta.value=ta.value.slice(0,st)+s+ta.value.slice(ta.selectionEnd);
    ta.focus(); ta.selectionStart=ta.selectionEnd=st+s.length; run();
  };
  // auto run init code once
  setTimeout(run, 400);
})();

// ============ GAME ============
(function(){
  const c=$('#gameCanvas'), ctx=c.getContext('2d');
  if(!c) return;
  let W,H,dpr; function fit(){ const r=c.getBoundingClientRect(); dpr=Math.min(devicePixelRatio,2); W=r.width; H=r.height; c.width=W*dpr; c.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
  addEventListener('resize', fit); fit();
  const scoreEl=$('#score'), timeEl=$('#time'), livesEl=$('#lives'), btn=$('#gameBtn'), overlay=$('#gameOverlay'), titleEl=$('#gameTitle'), subEl=$('#gameSub');
  let player={x:0,y:0,w:54,h:14,tx:0}, blocks=[], orbs=[], particles=[], score=0, lives=3, time=30, running=false, last=0, keys={}, dash=0;
  function reset(){
    player.x=W/2-27; player.y=H-22; player.tx=player.x;
    blocks=[]; orbs=[]; particles=[]; score=0; lives=3; time=30; dash=0;
    for(let i=0;i<5;i++) spawnBlock(true);
    updateHUD();
  }
  function spawnBlock(initial){
    const w= 28+Math.random()*38, h=14+Math.random()*16;
    blocks.push({x:Math.random()*(W-w), y: initial? Math.random()*-H : -h-10, w,h, vy: 2+Math.random()*3 + score*0.03, rot:Math.random()*Math.PI, vr:(Math.random()-.5)*0.06, col: `hsl(${260+Math.random()*30},100%,65%)`});
  }
  function spawnOrb(){
    orbs.push({x:Math.random()*(W-16), y:-16, r:8, vy:2.2+Math.random()*1.8, phase:Math.random()*Math.PI*2});
  }
  function updateHUD(){ scoreEl.textContent=score; livesEl.textContent=lives; timeEl.textContent=time.toFixed(1); }
  // controls
  addEventListener('keydown', e=>{
    keys[e.key.toLowerCase()]=true;
    if(e.code==='Space' && running && dash<=0){ dash=12; // dash invuln
      for(let i=0;i<12;i++) particles.push({x:player.x+player.w/2,y:player.y+player.h/2,vx:(Math.random()-.5)*9,vy:(Math.random()-.5)*6,life:1,dec:0.045,col:'#00e5ff'});
    }
  });
  addEventListener('keyup', e=> keys[e.key.toLowerCase()]=false);
  let touchX=null;
  c.addEventListener('touchstart', e=>{ touchX=e.touches[0].clientX; }, {passive:true});
  c.addEventListener('touchmove', e=>{
    if(touchX!==null){ const dx=e.touches[0].clientX - touchX; player.tx+= dx*0.9; touchX=e.touches[0].clientX; e.preventDefault(); }
  }, {passive:false});
  c.addEventListener('touchend', ()=> touchX=null);
  c.addEventListener('mousemove', e=>{
    if(!running) return;
    const r=c.getBoundingClientRect(); const x=(e.clientX-r.left); if(mouseDown) player.tx = x - player.w/2;
  });
  let mouseDown=false; c.addEventListener('mousedown', ()=> mouseDown=true); addEventListener('mouseup', ()=> mouseDown=false);
  function loop(ts){
    if(!running) return;
    const dt=Math.min(32, ts-last)/16.66; last=ts;
    // player move
    const speed= dash>0? 14:7;
    if(keys['arrowleft']||keys['a']) player.tx-= speed*dt;
    if(keys['arrowright']||keys['d']) player.tx+= speed*dt;
    player.tx=Math.max(0,Math.min(W-player.w, player.tx));
    player.x += (player.tx - player.x)*0.28;
    if(dash>0) dash--;
    // blocks
    if(Math.random()<0.045) spawnBlock();
    if(Math.random()<0.018) spawnOrb();
    for(const b of blocks){ b.y+= b.vy*dt; b.rot+= b.vr*dt; }
    for(const o of orbs){ o.y+= o.vy*dt; o.phase+=0.12; }
    // collisions
    for(let i=blocks.length-1;i>=0;i--){
      const b=blocks[i];
      if(b.y>H+40){ blocks.splice(i,1); continue; }
      const hit = b.x < player.x+player.w && b.x+b.w > player.x && b.y < player.y+player.h && b.y+b.h > player.y;
      if(hit){
        if(dash>0){
          // destroy block with effect
          for(let k=0;k<10;k++) particles.push({x:b.x+b.w/2,y:b.y+b.h/2,vx:(Math.random()-.5)*8,vy:(Math.random()-.5)*8 -2,life:1,dec:0.04,col:b.col});
          blocks.splice(i,1); score+=25; spawnBlock();
        } else {
          // hit
          lives--; // flash
          for(let k=0;k<14;k++) particles.push({x:player.x+player.w/2,y:player.y+player.h/2,vx:(Math.random()-.5)*9,vy:(Math.random()-.5)*9,life:1,dec:0.03,col:'#ff3b9a'});
          blocks.splice(i,1); spawnBlock();
          if(lives<=0){ gameOver(false); return; }
        }
      }
    }
    for(let i=orbs.length-1;i>=0;i--){
      const o=orbs[i];
      if(o.y>H+20){ orbs.splice(i,1); continue; }
      const dx=(o.x - (player.x+player.w/2)), dy=(o.y - (player.y+player.h/2)), d=Math.hypot(dx,dy);
      if(d< 22){
        score+=15; orbs.splice(i,1);
        for(let k=0;k<8;k++) particles.push({x:o.x,y:o.y,vx:(Math.random()-.5)*5,vy:(Math.random()-.5)*5,life:1,dec:0.05,col:'#ffe74c'});
      }
    }
    for(const p of particles){ p.x+=p.vx; p.y+=p.vy; p.vy+=0.18; p.vx*=0.99; p.life-=p.dec; }
    particles=particles.filter(p=>p.life>0);
    time-= dt/60; if(time<=0){ time=0; gameOver(true); return; }
    updateHUD();
    render();
    requestAnimationFrame(loop);
  }
  function render(){
    ctx.clearRect(0,0,W,H);
    // bg
    ctx.fillStyle='#0a0b10'; ctx.fillRect(0,0,W,H);
    const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'rgba(124,92,255,.10)'); g.addColorStop(1,'transparent');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    // grid
    ctx.strokeStyle='rgba(255,255,255,.04)'; ctx.lineWidth=1;
    for(let x=0;x<W;x+=36){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for(let y=0;y<H;y+=36){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    // orbs
    for(const o of orbs){
      ctx.shadowColor='#ffe74c'; ctx.shadowBlur=14; ctx.fillStyle='#ffe74c';
      ctx.beginPath(); ctx.arc(o.x+ Math.sin(o.phase)*6, o.y, o.r,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
      ctx.fillStyle='rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(o.x+Math.sin(o.phase)*6 -2,o.y-2,2.2,0,Math.PI*2); ctx.fill();
    }
    // blocks
    for(const b of blocks){
      ctx.save(); ctx.translate(b.x+b.w/2,b.y+b.h/2); ctx.rotate(b.rot);
      ctx.fillStyle=b.col; ctx.shadowColor=b.col; ctx.shadowBlur=12; ctx.fillRect(-b.w/2,-b.h/2,b.w,b.h);
      ctx.shadowBlur=0; ctx.strokeStyle='rgba(255,255,255,.18)'; ctx.strokeRect(-b.w/2,-b.h/2,b.w,b.h);
      ctx.restore();
    }
    // player
    ctx.shadowColor= dash>0? '#00e5ff':'#7c5cff'; ctx.shadowBlur= dash>0? 22:16;
    const grad=ctx.createLinearGradient(player.x,player.y,player.x,player.y+player.h);
    grad.addColorStop(0, dash>0?'#00e5ff':'#7c5cff'); grad.addColorStop(1, dash>0?'#7c5cff':'#00e5ff');
    ctx.fillStyle=grad;
    // rounded rect
    const r=7; ctx.beginPath();
    ctx.moveTo(player.x+r, player.y); ctx.lineTo(player.x+player.w-r, player.y); ctx.quadraticCurveTo(player.x+player.w, player.y, player.x+player.w, player.y+r);
    ctx.lineTo(player.x+player.w, player.y+player.h-r); ctx.quadraticCurveTo(player.x+player.w, player.y+player.h, player.x+player.w-r, player.y+player.h);
    ctx.lineTo(player.x+r, player.y+player.h); ctx.quadraticCurveTo(player.x, player.y+player.h, player.x, player.y+player.h-r);
    ctx.lineTo(player.x, player.y+r); ctx.quadraticCurveTo(player.x, player.y, player.x+r, player.y); ctx.closePath(); ctx.fill();
    ctx.shadowBlur=0;
    // particles
    for(const p of particles){
      ctx.globalAlpha=p.life; ctx.fillStyle=p.col; ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill();
    } ctx.globalAlpha=1;
    // time bar
    ctx.fillStyle='rgba(255,255,255,.08)'; ctx.fillRect(0,0,W,4);
    ctx.fillStyle='linear-gradient' ; ctx.fillStyle='#7c5cff'; ctx.fillRect(0,0, W*(time/30),4);
  }
  function gameOver(win){
    running=false; btn.textContent='▶ ЕЩЁ РАЗ'; btn.style.display=''; overlay.style.display='grid';
    if(win){
      titleEl.textContent = score>250 ? 'ЛЕГЕНДА! 👑' : 'ПОБЕДА! 🎉';
      subEl.innerHTML=`Счёт: <b>${score}</b> • Ты выжил 30 секунд!<br>Нажми СТАРТ чтобы улучшить рекорд`;
      confetti();
    } else {
      titleEl.textContent='РАЗБИТ 💥'; subEl.innerHTML=`Счёт: <b>${score}</b> • Попробуй ещё — используй рывок (пробел)`;
    }
    render();
  }
  function start(){
    reset(); running=true; overlay.style.display='none'; btn.textContent='⏸ ПАУЗА'; last=performance.now();
    requestAnimationFrame(loop);
  }
  btn.addEventListener('click', ()=>{
    if(running){ running=false; btn.textContent='▶ ПРОДОЛЖИТЬ'; overlay.style.display='grid'; titleEl.textContent='ПАУЗА'; subEl.textContent='Нажми продолжить'; }
    else start();
  });
  reset(); render();
  // keyboard focus for game
  c.tabIndex=0;
})();

// ============ SONIC ============
(function(){
  const piano=$('#piano'); if(!piano) return;
  const audioCtxRef={ctx:null};
  function getCtx(){
    if(!audioCtxRef.ctx) audioCtxRef.ctx=new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtxRef.ctx.state==='suspended') audioCtxRef.ctx.resume();
    return audioCtxRef.ctx;
  }
  const notes=[
    {n:'C4',f:261.63},{n:'C#4',f:277.18,black:true},{n:'D4',f:293.66},{n:'D#4',f:311.13,black:true},{n:'E4',f:329.63},{n:'F4',f:349.23},{n:'F#4',f:369.99,black:true},{n:'G4',f:392.00},{n:'G#4',f:415.30,black:true},{n:'A4',f:440.00},{n:'A#4',f:466.16,black:true},{n:'B4',f:493.88},{n:'C5',f:523.25}
  ];
  // build piano
  const whiteNotes = notes.filter(n=>!n.black);
  whiteNotes.forEach(n=>{
    const wrap=document.createElement('div'); wrap.className='white-wrap';
    const key=document.createElement('div'); key.className='key'; key.dataset.f=n.f; key.dataset.n=n.n;
    wrap.appendChild(key);
    // add black keys that belong to this white
    // find sharps between this white and next white
    piano.appendChild(wrap);
  });
  // place blacks manually
  // simpler: recreate full
  piano.innerHTML='';
  notes.forEach((n,i)=>{
    if(n.black) return;
    const wrap=document.createElement('div'); wrap.className='white-wrap';
    const key=document.createElement('div'); key.className='key'; key.dataset.f=n.f; key.textContent='';
    key.addEventListener('pointerdown', ()=> play(n.f, key));
    key.addEventListener('pointerup', ()=> key.classList.remove('active'));
    key.addEventListener('pointerleave', ()=> key.classList.remove('active'));
    wrap.appendChild(key);
    // check if next note is black
    const next=notes[i+1]; if(next && next.black){
      const b=document.createElement('div'); b.className='key black'; b.dataset.f=next.f;
      b.addEventListener('pointerdown', e=>{ e.stopPropagation(); play(next.f,b); });
      b.addEventListener('pointerup', ()=> b.classList.remove('active'));
      b.addEventListener('pointerleave', ()=> b.classList.remove('active'));
      wrap.appendChild(b);
    }
    piano.appendChild(wrap);
  });
  function play(freq, el){
    const ctx=getCtx(); const osc=ctx.createOscillator(), gain=ctx.createGain(), filt=ctx.createBiquadFilter();
    const wave=$('#wave').value;
    osc.type=wave; osc.frequency.value=freq;
    gain.gain.value=0.0;
    filt.type='lowpass'; filt.frequency.value= 2200 + parseInt($('#reverb').value,10)*18;
    osc.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
    const now=ctx.currentTime;
    gain.gain.setValueAtTime(0,now); gain.gain.linearRampToValueAtTime(0.32, now+0.02); gain.gain.exponentialRampToValueAtTime(0.001, now+1.1);
    osc.start(now); osc.stop(now+1.2);
    if(el){ el.classList.add('active'); setTimeout(()=>el.classList.remove('active'),180); }
    // visual pulse on audio canvas maybe
    pulseAudio(freq);
  }
  // keyboard mapping
  const keyMap={ 'a':261.63,'w':277.18,'s':293.66,'e':311.13,'d':329.63,'f':349.23,'t':369.99,'g':392,'y':415.30,'h':440,'u':466.16,'j':493.88,'k':523.25 };
  addEventListener('keydown', e=>{
    const f=keyMap[e.key.toLowerCase()]; if(f && !e.repeat){ const el=[...document.querySelectorAll('.key')].find(k=> Math.abs(parseFloat(k.dataset.f)-f)<0.01); play(f,el); }
  });
  // visualizer
  const canvas=$('#audioCanvas'), ctx2=canvas.getContext('2d');
  function fit(){ const r=canvas.getBoundingClientRect(); const dpr=Math.min(devicePixelRatio,2); canvas.width=r.width*dpr; canvas.height=r.height*dpr; ctx2.setTransform(dpr,0,0,dpr,0,0); }
  addEventListener('resize', fit); fit();
  let analyser, dataArray, source, animId;
  function pulseAudio(freq){
    // fake pulse if no mic
    if(analyser) return;
    const base = 20 + (freq-260)/12;
    let t=0; (function loop(){
      if(t>30) { drawIdle(); return; }
      ctx2.clearRect(0,0,canvas.width,canvas.height);
      ctx2.fillStyle='#0b0c12'; ctx2.fillRect(0,0,canvas.width,canvas.height);
      ctx2.strokeStyle='#7c5cff'; ctx2.lineWidth=2; ctx2.beginPath();
      for(let x=0;x<canvas.width;x++){
        const y= canvas.height/2 + Math.sin(x*0.02 + t*0.6)* (18+ base) * Math.exp(-t*0.06) * Math.sin(x*0.01);
        if(x===0) ctx2.moveTo(x,y); else ctx2.lineTo(x,y);
      } ctx2.stroke();
      t++; requestAnimationFrame(loop);
    })();
  }
  function drawIdle(){
    ctx2.clearRect(0,0,canvas.width,canvas.height);
    ctx2.fillStyle='#0b0c12'; ctx2.fillRect(0,0,canvas.width,canvas.height);
    ctx2.fillStyle='rgba(255,255,255,.06)'; ctx2.font='12px JetBrains Mono'; ctx2.textAlign='center';
    ctx2.fillText('нажми клавишу или дай доступ к микрофону', canvas.width/2, canvas.height/2);
  }
  drawIdle();
  $('#micBtn').addEventListener('click', async (e)=>{
    try{
      const s=await navigator.mediaDevices.getUserMedia({audio:true});
      const ctx=getCtx(); analyser=ctx.createAnalyser(); analyser.fftSize=512; dataArray=new Uint8Array(analyser.frequencyBinCount);
      source=ctx.createMediaStreamSource(s); source.connect(analyser);
      e.target.textContent='● запись...'; e.target.disabled=true;
      (function draw(){
        animId=requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        ctx2.clearRect(0,0,canvas.width,canvas.height);
        ctx2.fillStyle='#0b0c12'; ctx2.fillRect(0,0,canvas.width,canvas.height);
        const barW= canvas.width / dataArray.length * 2.2;
        let x=0;
        for(let i=0;i<dataArray.length;i++){
          const v=dataArray[i]/255; const h=v* canvas.height*0.9;
          const hue= 260+ v*60; ctx2.fillStyle=`hsl(${hue},100%,62%)`;
          ctx2.fillRect(x, canvas.height - h, barW-1, h);
          x+= barW;
        }
      })();
    }catch(err){ alert('Не получилось: '+err.message); }
  });
  $('#demoAudio').addEventListener('click', ()=>{
    const ctx=getCtx(); const tempo=0.22;
    const seq=[261.63,293.66,329.63,392,329.63,293.66,261.63,392,440,493.88,523.25,493.88,440,392];
    seq.forEach((f,i)=>{
      setTimeout(()=> play(f, [...document.querySelectorAll('.key')].find(k=> Math.abs(parseFloat(k.dataset.f)-f)<2)), i*tempo*1000);
    });
  });
})();

// ============ TERMINAL ============
(function(){
  const input=$('#termInput'), body=$('#termBody'), term=$('#terminal');
  const cmds={
    help: ()=> `команды: <b>help</b>, <b>clear</b>, <b>hack</b>, <b>matrix</b>, <b>confetti</b>, <b>whoami</b>, <b>greet &lt;имя&gt;</b>, <b>time</b>, <b>neofetch</b>`,
    clear: ()=>{ body.innerHTML=''; return 'очищено'; },
    hack: ()=>{ let s=''; for(let i=0;i<16;i++) s+= Math.random().toString(16).slice(2,12)+' '; matrix(); return 'взлом... '+s.slice(0,120); },
    matrix: ()=>{ matrix(); return 'matrix rain...'; },
    confetti: ()=>{ confetti(); return 'boom!'; },
    whoami: ()=> 'ты — исследователь NEXUS. уровень доступа: ∞',
    time: ()=> new Date().toString(),
    neofetch: ()=> `<pre style="color:#7c5cff">⬢ NEXUS OS\nOS: Future v2.0\nKernel: JS 2026\nCPU: 8 cores (браузер)\nRAM: ∞\nGPU: Canvas/WebGL</pre>`,
    greet: (a)=> `привет, <b>${a||'незнакомец'}</b>! 👋`,
  };
  function print(html){
    const d=document.createElement('div'); d.innerHTML='> '+html; body.appendChild(d); body.scrollTop=body.scrollHeight;
  }
  input.addEventListener('keydown', e=>{
    if(e.key==='Enter'){
      const v=input.value.trim(); if(!v) return;
      print(`<span style="opacity:.6">${v}</span>`);
      const [cmd, ...rest]=v.split(/\s+/); const fn=cmds[cmd.toLowerCase()];
      if(fn){ const res=fn(rest.join(' ')); if(res) print(res); } else print(`неизвестная команда: ${cmd} (введи help)`);
      input.value='';
    }
  });
  term.addEventListener('click', ()=> input.focus());
})();

// konami
(function(){
  const seq=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let p=0;
  addEventListener('keydown', e=>{
    if(e.key===seq[p]){ p++; if(p===seq.length){ p=0; confetti(); matrix(); document.body.style.filter='hue-rotate(180deg)'; setTimeout(()=>document.body.style.filter='',2200); const t=$('#termBody'); if(t){ const d=document.createElement('div'); d.innerHTML='> KONAMI CODE! 🎉 ты нашёл секрет.'; t.appendChild(d); } } }
    else p=0;
  });
  $('#konamiHint').addEventListener('click', ()=> alert('Попробуй классику: ↑ ↑ ↓ ↓ ← → ← → B A'));
})();

// global confetti/matrix for inline
function confetti(){ window.confetti&&window.confetti(); }
function matrix(){ window.matrix&&window.matrix(); }

// easter: click anywhere 50 times
let easter=0; addEventListener('click', ()=>{ easter++; if(easter===50){ confetti(); alert('50 кликов! Ты настоящий исследователь. Держи ачивку 🏆'); } });

// konami hint button already above

// initial confetti after 1.2s
setTimeout(()=>{ if(window.confetti) window.confetti(); }, 1200);
