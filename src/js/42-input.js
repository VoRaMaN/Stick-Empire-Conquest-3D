/* ---------------- camera + input ---------------- */
const ptrs=new Map(); let pinch=null, lastTap=null;
const inputStats={panned:0,turned:0};   // read by the training battle
function camRight(){return new V3(Math.cos(cam.yaw),0,-Math.sin(cam.yaw));}
function camFwd(){return new V3(-Math.sin(cam.yaw),0,-Math.cos(cam.yaw));}
function pan(dx,dy){ const k=cam.dist*.0016; const r=camRight(), f=camFwd(); cam.goal.addScaledVector(r,-dx*k).addScaledVector(f,dy*k); inputStats.panned+=Math.hypot(dx,dy); if(cam.follow){ cam.follow=null; updateFollowUI(); } clampGoal(); }
function orbit(dx,dy){ cam.yaw-=dx*.0065; cam.pitch=clamp(cam.pitch+dy*.005,.04,1.35); inputStats.turned+=Math.abs(dx); }
function clampGoal(){ cam.goal.x=clamp(cam.goal.x,-MAP.cx,MAP.cx); cam.goal.z=clamp(cam.goal.z,-MAP.cz,MAP.cz); cam.goal.y=H(cam.goal.x,cam.goal.z)+1.1; }
// one finger (or left mouse) pans the field in battle and orbits in the Lab; right mouse / shift does the other
const orbitDrag=p=>{ const o=game.mode==='duel'||game.mode==='viewer'||settings.drag==='orbit'; return p.alt?!o:o; };
function twoFinger(){ const [a,b]=[...ptrs.values()]; return {d:Math.hypot(a.x-b.x,a.y-b.y),mx:(a.x+b.x)/2,my:(a.y+b.y)/2,ang:Math.atan2(b.y-a.y,b.x-a.x)}; }
canvas.addEventListener('pointerdown',e=>{
  canvas.setPointerCapture&&canvas.setPointerCapture(e.pointerId);
  // RTS (42b): with a mouse the left button drags a selection box and the middle one pans; on a phone, Box does the same for one drag
  const mouse=e.pointerType==='mouse', rts=rtsOn()&&game.mode==='battle'&&!game.paused, bx=rts&&((mouse&&e.button===0&&uiMode()==='pc')||(!mouse&&RTS.boxMode&&!ptrs.size));
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now(),btn:e.button,mouse,alt:e.button===2||(e.shiftKey&&!bx),box:bx,panB:rts&&mouse&&e.button===1});
  if(ptrs.size===2) pinch=twoFinger();
});
canvas.addEventListener('pointermove',e=>{
  const p=ptrs.get(e.pointerId); if(!p) return;
  const dx=e.clientX-p.x, dy=e.clientY-p.y; p.x=e.clientX; p.y=e.clientY;
  if(ptrs.size===1){ if(p.box){ if(Math.hypot(p.x-p.sx,p.y-p.sy)>6){ p.boxing=true; rtsBoxDraw(p); } } else if(p.panB) pan(dx,dy); else if(orbitDrag(p)) orbit(dx,dy); else pan(dx,dy); }
  else if(ptrs.size===2&&pinch){ const q=twoFinger();
    if(q.d>10&&pinch.d>10) cam.dGoal=clamp(cam.dGoal*pinch.d/q.d,3.5,MAP.zmax||70);                       // pinch: zoom
    const da=wrapA(q.ang-pinch.ang); if(Math.abs(da)<.5){ cam.yaw+=da; inputStats.turned+=Math.abs(da)*150; }   // twist: turn
    const mx=q.mx-pinch.mx, my=q.my-pinch.my;
    if(game.mode!=='duel'&&game.mode!=='viewer'&&settings.drag!=='orbit') cam.pitch=clamp(cam.pitch+my*.004,.04,1.35);  // two-finger drag: tilt
    else if(Math.hypot(mx,my)>.5) pan(mx,my);
    pinch=q; }
});
// double-tap the ground to zoom in there; double-tap the sky to pull back
function zoomAt(x,y){ const gp=groundPoint(x,y);
  if(gp){ if(cam.follow){ cam.follow=null; updateFollowUI(); } cam.goal.set(gp.x,0,gp.z); clampGoal(); cam.dGoal=Math.max(7,cam.dGoal*.55); }
  else cam.dGoal=Math.min(60,cam.dGoal*1.7); }
function endPtr(e){
  const p=ptrs.get(e.pointerId); if(!p) return;
  const now=performance.now(), tap=ptrs.size===1&&Math.hypot(e.clientX-p.sx,e.clientY-p.sy)<9&&now-p.t<(p.mouse?800:350);
  ptrs.delete(e.pointerId); if(ptrs.size<2) pinch=null; else pinch=twoFinger();
  if(p.boxing){ const b=$('#selBox'); if(b) b.hidden=true; if(e.type==='pointerup') rtsBoxEnd(p,e.shiftKey); return; }
  if(!tap||e.type!=='pointerup') return;
  // RTS with a mouse: left click selects, right click gives the order
  if(p.mouse&&rtsOn()&&game.mode==='battle'&&uiMode()==='pc'){ if(p.btn===2) rtsOrderAt(e.clientX,e.clientY); else if(p.btn===0) rtsClick(e.clientX,e.clientY,e.shiftKey); return; }
  if(lastTap&&now-lastTap.t<320&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<40&&!selReg&&game.mode==='battle'){ lastTap=null; zoomAt(e.clientX,e.clientY); return; }
  lastTap={x:e.clientX,y:e.clientY,t:now};
  pick(e.clientX,e.clientY);
}
canvas.addEventListener('pointerup',endPtr); canvas.addEventListener('pointercancel',endPtr);
canvas.addEventListener('wheel',e=>{ e.preventDefault(); cam.dGoal=clamp(cam.dGoal*Math.exp(e.deltaY*.0012),3.5,MAP.zmax||70); },{passive:false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('gesturestart',e=>e.preventDefault()); document.addEventListener('gesturechange',e=>e.preventDefault());
document.addEventListener('touchmove',e=>{ if(e.target===canvas) e.preventDefault(); },{passive:false});
document.addEventListener('dblclick',e=>e.preventDefault());
window.addEventListener('keydown',e=>{ const k=e.key.toLowerCase(), s=cam.dist*.03;
  if(e.target&&(e.target.tagName==='INPUT')) return;
  if(k==='w'||k==='arrowup') pan(0,-60*s); if(k==='s'||k==='arrowdown') pan(0,60*s); if(k==='a'||k==='arrowleft') pan(60*s,0); if(k==='d'||k==='arrowright') pan(-60*s,0);
  if(k==='q') orbit(-24,0); if(k==='e') orbit(24,0); if(k==='r') orbit(0,-16); if(k==='f') orbit(0,16);
  if(k==='+'||k==='=') cam.dGoal=clamp(cam.dGoal*.85,3.5,MAP.zmax||70); if(k==='-') cam.dGoal=clamp(cam.dGoal*1.18,3.5,MAP.zmax||70); });
const _proj=new V3();
const _ray=new THREE.Raycaster(), _ndc=new THREE.Vector2();
function groundPoint(x,y){ _ndc.set(x/innerWidth*2-1,-(y/innerHeight)*2+1); _ray.setFromCamera(_ndc,camera); const h=_ray.intersectObject(MAP.ground||groundMesh,true); return h.length?h[0].point:null; }
function pick(x,y){
  if(game.mode!=='battle'||game.paused) return;
  let best=null,bd=46*46;
  for(const u of units){ if(!u.alive||u.fowH) continue; _proj.copy(u.j.chest).project(camera); if(_proj.z>1) continue;
    const sx=(_proj.x*.5+.5)*innerWidth, sy=(-_proj.y*.5+.5)*innerHeight, d=(sx-x)**2+(sy-y)**2; if(d<bd){bd=d;best=u;} }
  // a building (and nobody standing right where you tapped): open it, or show what the enemy's is
  const me=myTeam(), foe=1-me;
  if(!selReg&&(!best||bd>20*20)){ const bb=pickBuilding(x,y); if(bb){ if(bb.team===me) openPanel(bb); else { setHover(bb,x,y); setTimeout(()=>{ if(hoverB===bb) setHover(null); },1800); } return; } }
  if(best&&best.team===me&&best.reg){ if(selRegs.length>1&&selRegs.includes(best.reg)) setSelection(selRegs.filter(r=>r!==best.reg)); else selectReg(best.reg); return; }   // tap your regiment: select it
  if(selReg){ rtsOrderAt(x,y); return; }   // tap an enemy: attack; tap the ground: march there (every selected regiment, 42b)
  cam.follow=best; if(best) cam.dGoal=Math.min(cam.dGoal,best.s>1.5?14:9);
  updateFollowUI();
}
const CAM_HOME=new V3(0,1.2,0), camOK=v=>isFinite(v.x+v.y+v.z);
function updateCamera(rdt){
  const D=game.duel;
  if(game.mode==='duel'&&D){
    const a=D.att.rag?D.att.j.pelvis:D.att.pos, b=D.dum.rag?D.dum.j.pelvis:D.dum.pos;
    if(D.att.script){ cam.goal.set(a.x,0,a.z); cam.dGoal=D.att.s>1.5?12:8; }
    else cam.goal.set((a.x+b.x)/2,0,(a.z+b.z)/2);
    cam.goal.y=H(cam.goal.x,cam.goal.z)+1.1*(D.att.s>1.5?1.6:1);
  } else if(game.mode==='viewer'&&VW.u){ viewerCamera(rdt);
  } else if(cam.follow){
    const f=cam.follow; const p=f.rag?f.j.pelvis:f.pos; cam.goal.set(p.x,H(p.x,p.z)+1.1*Math.sqrt(f.s),p.z);
    if(!f.alive&&f.rag&&f.rag.age>3){ cam.follow=null; updateFollowUI(); }
  }
  // never let a bad number stick: a non-finite goal keeps the last good one, and a broken camera snaps back
  if(!camOK(cam.goal)) cam.goal.copy(camOK(cam.target)?cam.target:CAM_HOME);
  if(!isFinite(cam.dGoal)) cam.dGoal=12; if(!isFinite(cam.yaw)) cam.yaw=.5; if(!isFinite(cam.pitch)) cam.pitch=.36;
  if(!camOK(cam.target)||!isFinite(cam.dist)){ cam.target.copy(cam.goal); cam.dist=cam.dGoal; }
  const k=1-Math.exp(-rdt*5);
  cam.target.lerp(cam.goal,k); cam.dist=lerp(cam.dist,cam.dGoal,1-Math.exp(-rdt*6));
  const cp=Math.cos(cam.pitch);
  camera.position.set(cam.target.x+Math.sin(cam.yaw)*cp*cam.dist,cam.target.y+Math.sin(cam.pitch)*cam.dist,cam.target.z+Math.cos(cam.yaw)*cp*cam.dist);
  const minY=H(camera.position.x,camera.position.z)+.6; if(camera.position.y<minY) camera.position.y=minY;
  camera.lookAt(cam.target);
  if(cam.shake>.001){ const s=cam.shake; camera.position.x+=rand(-s,s); camera.position.y+=rand(-s,s)*.7; cam.shake*=Math.exp(-rdt*9); }
}
// keep the score cards clear of the header, however the header wraps on narrow phones
function layoutTop(){ const t=document.querySelector('.top'); if(!t||!t.getBoundingClientRect) return; const b=t.getBoundingClientRect().bottom, root=document.documentElement.style; if(b>0) root.setProperty('--hudTop',Math.round(b+6)+'px');
  const h=$('#hudBattle'); if(h&&h.getBoundingClientRect){ const r=h.getBoundingClientRect(); root.setProperty('--hudBottom',Math.round(!h.hidden&&r.bottom>0?r.bottom+8:b+10)+'px'); }
  const d=$('#dock'); if(d&&d.getBoundingClientRect&&!d.hidden){ const r=d.getBoundingClientRect(); if(r.height>0) root.setProperty('--dockH',Math.round(Math.max(0,(window.innerHeight||0)-r.top))+'px'); } }
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(layoutTop);
// a hidden or collapsed page reports a 0×0 window: keep the last real size (a zero size made the camera's aspect
// NaN and the screen showed nothing but the sky colour); the main loop re-checks the size every frame
let vpW=0, vpH=0;
function resize(){ const w=window.innerWidth,h=window.innerHeight; if(!(w>0&&h>0)) return;
  layoutTop(); vpW=w; vpH=h; renderer.setSize(w,h,false); camera.aspect=w/h; camera.fov=w<h?60:45; camera.updateProjectionMatrix(); }
window.addEventListener('resize',resize); window.addEventListener('orientationchange',()=>setTimeout(resize,250)); resize();

