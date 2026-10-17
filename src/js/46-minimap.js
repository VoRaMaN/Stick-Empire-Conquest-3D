/* ---------------- battlefield map (top of the screen) ----------------
   The whole field as a strip: both statues, every soldier as a dot, and the patch of ground the camera
   currently shows. Tap or drag on it to move the camera there. */
const MM={x0:-62,x1:62,z0:-19,z1:17};   // the field plus the front of each castle
const mmEl=$('#minimap'); const mmCtx=mmEl&&mmEl.getContext?mmEl.getContext('2d'):null;
let mmT=0, mmDrag=false;
const _mmRay=new THREE.Raycaster(), _mmN=new THREE.Vector2(), _mmPlane=new THREE.Plane(new V3(0,1,0),0), _mmHit=new V3();
function syncMinimap(){ if(!mmEl) return; mmEl.hidden=!settings.minimap||game.mode!=='battle'; if(typeof layoutTop==='function') layoutTop(); }
function mmSize(){ const r=mmEl.getBoundingClientRect?mmEl.getBoundingClientRect():{width:0,height:0}; const dpr=Math.min(2,window.devicePixelRatio||1), w=Math.round(r.width*dpr), h=Math.round(r.height*dpr);
  if(w>0&&h>0&&(mmEl.width!==w||mmEl.height!==h)){ mmEl.width=w; mmEl.height=h; } return {w:mmEl.width,h:mmEl.height,dpr}; }
const mmX=(x,w)=>(x-MM.x0)/(MM.x1-MM.x0)*w, mmZ=(z,h)=>(z-MM.z0)/(MM.z1-MM.z0)*h;
// where a screen corner's ray meets the ground (or the far edge of the field when it points at the sky)
function viewCorner(nx,ny,out){ _mmN.set(nx,ny); _mmRay.setFromCamera(_mmN,camera); _mmPlane.constant=-cam.target.y;
  if(_mmRay.ray.intersectPlane(_mmPlane,out)&&out.distanceTo(camera.position)<140) return out;
  return out.copy(_mmRay.ray.direction).setY(0).normalize().multiplyScalar(90).add(camera.position); }
function drawMinimap(){
  if(!mmCtx||mmEl.hidden) return;
  mmT-=1; if(mmT>0) return; mmT=5;            // every 5th frame is plenty
  const {w,h,dpr}=mmSize(); if(!w) return; const c=mmCtx;
  c.clearRect(0,0,w,h);
  if(MAP.id!=='classic') rlMinimapBg(c,w,h,dpr); else {
  // ground: a soft band for the playable field, darker beyond it
  c.fillStyle='rgba(191,154,104,.22)'; c.fillRect(mmX(-42,w),mmZ(-15,h),mmX(42,w)-mmX(-42,w),mmZ(15,h)-mmZ(-15,h));
  c.strokeStyle='rgba(245,236,217,.12)'; c.lineWidth=dpr; c.beginPath(); c.moveTo(w/2,mmZ(-15,h)); c.lineTo(w/2,mmZ(15,h)); c.stroke();
  // the castles: walls, yard and gate
  for(let t=0;t<2;t++){ const s=t?1:-1, xa=mmX(s*46,w), xb=mmX(s*82,w), x0=Math.min(xa,xb), x1=Math.max(xa,xb), y0=mmZ(-20,h), y1=mmZ(14,h);
    c.fillStyle='rgba(120,108,92,.5)'; c.fillRect(x0,y0,x1-x0,y1-y0); c.fillStyle=t?'rgba(208,70,90,.8)':'rgba(228,178,58,.8)'; c.fillRect(xa+(t?0:-2*dpr),y0,2*dpr,y1-y0);
    c.fillStyle='rgba(30,22,14,.9)'; c.fillRect(xa+(t?-1:-1)*dpr,mmZ(3.5,h),2*dpr,mmZ(8.5,h)-mmZ(3.5,h)); }
  // mines
  c.fillStyle='rgba(228,178,58,.55)'; for(const m of MINE){ c.beginPath(); c.arc(mmX(m.x,w),mmZ(m.z,h),2.6*dpr,0,TAU); c.fill(); }
  }
  // statues with their health
  for(const st of statues){ const x=mmX(st.pos.x,w), y=mmZ(st.pos.z,h), s=5*dpr, col=st.team?'#d0465a':'#e4b23a';
    c.fillStyle='rgba(0,0,0,.45)'; c.fillRect(x-s,y-s,2*s,2*s); c.fillStyle=col; const f=clamp(st.hp/st.max,0,1); c.fillRect(x-s,y+s-2*s*f,2*s,2*s*f);
    c.strokeStyle=col; c.lineWidth=dpr; c.strokeRect(x-s,y-s,2*s,2*s); }
  // soldiers
  const r=Math.max(1.2,1.5*dpr);
  for(const team of [0,1]){ c.fillStyle=team?'#ff6b7d':'#ffd25e';
    for(const u of units){ if(!u.alive||u.team!==team||!u.isUnit) continue; const rr=u.s>1.5?r*1.9:r; c.fillRect(mmX(u.pos.x,w)-rr,mmZ(u.pos.z,h)-rr,rr*2,rr*2); } }
  if(selReg){ c.strokeStyle='#ffffff'; c.lineWidth=dpr; for(const u of selReg.units){ if(!u.alive) continue; c.strokeRect(mmX(u.pos.x,w)-r*1.8,mmZ(u.pos.z,h)-r*1.8,r*3.6,r*3.6); } }
  // camera footprint
  const P=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>viewCorner(a,b,new V3()));
  c.save(); c.beginPath(); c.rect(0,0,w,h); c.clip();
  c.beginPath(); P.forEach((p,i)=>{ const x=mmX(p.x,w), y=mmZ(p.z,h); i?c.lineTo(x,y):c.moveTo(x,y); }); c.closePath();
  c.fillStyle='rgba(255,255,255,.1)'; c.fill(); c.strokeStyle='rgba(255,255,255,.75)'; c.lineWidth=1.2*dpr; c.stroke(); c.restore();
  c.fillStyle='rgba(255,255,255,.9)'; c.beginPath(); c.arc(mmX(cam.target.x,w),mmZ(cam.target.z,h),1.8*dpr,0,TAU); c.fill();
  if(MAP.id!=='classic') rlMinimapZones(c,w,h,dpr);
}
function mmJump(e){ const r=mmEl.getBoundingClientRect(); const fx=(e.clientX-r.left)/r.width, fz=(e.clientY-r.top)/r.height;
  if(cam.follow){ cam.follow=null; updateFollowUI(); }
  cam.goal.set(MM.x0+fx*(MM.x1-MM.x0),0,MM.z0+fz*(MM.z1-MM.z0)); clampGoal(); mmT=0; }
if(mmEl&&mmEl.addEventListener){
  mmEl.addEventListener('pointerdown',e=>{ e.stopPropagation(); mmDrag=true; mmEl.setPointerCapture&&mmEl.setPointerCapture(e.pointerId); mmJump(e); });
  mmEl.addEventListener('pointermove',e=>{ if(mmDrag) mmJump(e); });
  const end=()=>{ mmDrag=false; }; mmEl.addEventListener('pointerup',end); mmEl.addEventListener('pointercancel',end);
}
