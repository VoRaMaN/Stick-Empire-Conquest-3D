/* ---------------- fire: glowing, flickering flames ----------------
   Soft round billboards blended additively (they add light, so overlapping flames burn brighter, and bloom makes
   them glow), each drawn twice: a small white-yellow core inside a larger orange-to-red halo. They rise and
   sway, swell then shrink, cool from white through orange to deep red, and leave a little dark smoke.
   Every fire-coloured puff in the game (bombs, burning soldiers, hellfire, breath, braziers' sparks) comes here. */
const MAXFIRE=1100;
const fireTex=(()=>{ try{ if(typeof document==='undefined'||!document.createElement) return null; const c=document.createElement('canvas'); if(!c||!c.getContext) return null;
  c.width=c.height=64; const g=c.getContext('2d'); if(!g||!g.createRadialGradient) return null; const gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.22,'rgba(255,255,255,.8)'); gr.addColorStop(.55,'rgba(255,255,255,.25)'); gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gr; g.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); }catch(e){ return null; } })();
const fireMat=new THREE.MeshBasicMaterial({color:'#ffffff',map:fireTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
const fireIM=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),fireMat,MAXFIRE*2);
// colours first: three.js sizes the colour buffer from the instance count at that moment
{ const w=new THREE.Color(1,1,1); for(let i=0;i<MAXFIRE*2;i++) fireIM.setColorAt(i,w); }
fireIM.userData.cap=MAXFIRE*2; fireIM.frustumCulled=false; fireIM.renderOrder=6; fireIM.count=0;
scene.add(fireIM); CNT.set(fireIM,0);
// the flame's body: alpha-blended so it reads as solid fire even against bright sand and sky; the additive layer above it glows
const fireBodyMat=new THREE.MeshBasicMaterial({color:'#ffffff',map:fireTex,transparent:true,opacity:.9,depthWrite:false,toneMapped:false});
const fireBodyIM=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),fireBodyMat,MAXFIRE);
{ const w=new THREE.Color(1,1,1); for(let i=0;i<MAXFIRE;i++) fireBodyIM.setColorAt(i,w); }
fireBodyIM.userData.cap=MAXFIRE; fireBodyIM.frustumCulled=false; fireBodyIM.renderOrder=5; fireBodyIM.count=0;
scene.add(fireBodyIM); CNT.set(fireBodyIM,0);
const flames=[];
// is this puff colour a flame? (hot, saturated orange-red; not gold, sand, sparks of steel or souls)
const FIRE_COL={};
function isFireCol(c){ if(typeof c!=='string'||c[0]!=='#'||c.length!==7) return false; let v=FIRE_COL[c];
  if(v===undefined){ const n=parseInt(c.slice(1),16), r=(n>>16&255)/255, g=(n>>8&255)/255, b=(n&255)/255; v=FIRE_COL[c]=r>.85&&b<.32&&g<.8; } return v; }
function emitFire(p,n,size,vx,vy,vz,spread,life){
  if(partK!==1) n=Math.max(1,Math.round(n*partK));
  for(let i=0;i<n;i++){ let f; if(flames.length>=MAXFIRE){ f=flames[Math.floor(Math.random()*flames.length)]; } else { f={p:new V3(),v:new V3()}; flames.push(f); }
    f.p.copy(p); f.v.set(vx+rand(-spread,spread),vy+rand(0,spread),vz+rand(-spread,spread)); f.age=0; f.life=(life||.7)*rand(.7,1.3); f.size=size*rand(.7,1.3); f.ph=Math.random()*6.28; f.sm=0; }
}
// a burst of flame at a point (bombs, hellfire): n flames thrown outward and up
function fireBurst(p,n,size,speed,life){ for(let i=0;i<n;i++){ const a=Math.random()*6.28, s=speed*rand(.3,1); emitFire(p,1,size,Math.cos(a)*s,speed*rand(.2,.9),Math.sin(a)*s,.2,life); } }
function updateFire(dt){
  for(let i=flames.length-1;i>=0;i--){ const f=flames[i]; f.age+=dt;
    if(f.age>=f.life){ flames[i]=flames[flames.length-1]; flames.pop(); continue; }
    f.v.y+=2.8*dt; f.v.multiplyScalar(Math.exp(-dt*2.4));
    const t=game.time; f.p.x+=(f.v.x+Math.sin(t*9+f.ph)*.35)*dt; f.p.y+=f.v.y*dt; f.p.z+=(f.v.z+Math.cos(t*8+f.ph*1.3)*.3)*dt;
    if(!f.sm&&f.age>f.life*.7&&f.size>.12&&(f.ph*7|0)%9===0){ f.sm=1; if(puffs.length<MAXPUFF) puffs.push({p:f.p.clone(),c:new THREE.Color('#3e3430'),v:new V3(0,.6,0),age:0,life:.7,size:f.size*.6}); } }
}
const FIRE_GRAD=['#fff6d0','#ffc458','#ff7a1e','#c8300a','#3a0c04'].map(c=>new THREE.Color(c));
const _fcA=new THREE.Color(), _fcB=new THREE.Color(), _fsz=new V3();
function fireCol(out,h){ const x=Math.min(Math.max(h,0)*4,3.999), i=Math.floor(x); return out.copy(FIRE_GRAD[i]).lerp(FIRE_GRAD[i+1],x-i); }
function drawFire(){
  if(!flames.length) return; const q=camera.quaternion, t=game.time;
  for(const f of flames){ if(!fowVisP(f.p)) continue; const k=f.age/f.life, fl=.8+.2*Math.sin(t*31+f.ph*5), grow=k<.18?.5+k*2.8:1-(k-.18)*.75, r=f.size*grow*fl;
    fireCol(_fcA,Math.min(1,k*.95+.05)); const bs=r*(1-k*k); _fsz.set(bs*1.35,bs*1.9,1); _m.compose(f.p,q,_fsz); put(fireBodyIM,_fcA);
    fireCol(_fcA,Math.min(1,k*1.1+.18)).multiplyScalar((1-k)*(.5+.25*fl)); _fsz.set(r*2,r*2.7,1); _m.compose(f.p,q,_fsz); put(fireIM,_fcA);
    fireCol(_fcB,k*.85).multiplyScalar(Math.pow(1-k,1.2)*1.15); _fsz.set(r*.9,r*1.3,1); _m.compose(f.p,q,_fsz); put(fireIM,_fcB); }
}
