/* ---------------- IK ---------------- */
// Two-bone IK. The bend plane comes from the pole; two things keep it stable (v0.34):
//  · alt: when the pole lines up with the limb (an arm hanging straight at a pole that points down, a hand behind the
//    back at a pole that points back) its perpendicular part shrinks to noise and the elbow used to flip sides from one
//    frame to the next. Below a 40% hold the bend leans on a second, roughly perpendicular hint instead.
//  · st: the limb remembers its bend direction and turns it no faster than maxTurn radians per call, so a switch of
//    poles between keyframes or a target crossing the pole axis swings the elbow round instead of snapping it.
// Both are optional: callers that pass neither (riders, crawlers) behave exactly as before.
const _a=new V3(),_b=new V3(),_c=new V3(),_ikP=new V3();
function ik2(root,target,l1,l2,pole,outMid,outEnd,st,alt,maxTurn,front){
  _a.subVectors(target,root); let dist=_a.length();
  if(dist<1e-6){_a.set(0,-1,0); dist=1e-3;} else _a.multiplyScalar(1/dist);
  if(st) st.reach=dist/(l1+l2);   // >1: the target is out of reach (the debug view shows it)
  dist=clamp(dist,Math.abs(l1-l2)+1e-3,(l1+l2)*.999);
  const cosA=clamp((l1*l1+dist*dist-l2*l2)/(2*l1*dist),-1,1), along=l1*cosA, h=Math.sqrt(Math.max(0,l1*l1-along*along));
  _b.subVectors(pole,root); const pl=_b.length(); _b.addScaledVector(_a,-_b.dot(_a));
  let bl=_b.length();
  if(alt){ const q=pl>1e-6?bl/pl:0;
    if(q<.4){ _c.copy(alt).addScaledVector(_a,-alt.dot(_a)); const cl=_c.length();
      if(cl>1e-4){ const w=1-q/.4; if(bl>1e-6) _b.multiplyScalar((1-w)/bl); else _b.set(0,0,0); _b.addScaledVector(_c,w/cl); bl=_b.length(); } } }
  if(bl<1e-4){ if(st&&st.ok) _b.copy(st.b).addScaledVector(_a,-st.b.dot(_a)); if(_b.lengthSq()<1e-8){ _b.crossVectors(_a,UP); if(_b.lengthSq()<1e-8)_b.set(1,0,0); } }
  _b.normalize();
  if(st){
    if(st.ok){ _c.copy(st.b).addScaledVector(_a,-st.b.dot(_a)); const cl=_c.length();
      if(cl>1e-3){ _c.multiplyScalar(1/cl); const d=clamp(_c.dot(_b),-1,1), mt=maxTurn||.3;
        if(Math.acos(d)>mt){ _ikP.copy(_b).addScaledVector(_c,-d); if(_ikP.lengthSq()<1e-8) _ikP.crossVectors(_a,_c); _ikP.normalize();
          _b.copy(_c).multiplyScalar(Math.cos(mt)).addScaledVector(_ikP,Math.sin(mt)).normalize(); st.turned=true; } else st.turned=false; } }
    st.b.copy(_b); st.ok=true; }
  if(front){ // a hinge joint limit: the bend may not point behind `front` (a knee never folds backward)
    _ikP.copy(front).addScaledVector(_a,-front.dot(_a)); const fl=_ikP.length();   // `front` within the bend plane
    if(fl>.35){ _ikP.multiplyScalar(1/fl); const d=_b.dot(_ikP);   // (a leg pointing along `front` has no 'behind')
      if(d<0){ _b.addScaledVector(_ikP,-d); if(_b.lengthSq()<1e-6) _b.copy(_ikP); _b.normalize(); if(st){ st.b.copy(_b); st.limited=true; } }
      else if(st) st.limited=false; } }
  outMid.copy(root).addScaledVector(_a,along).addScaledVector(_b,h);
  outEnd.copy(root).addScaledVector(_a,dist);
}
function ikState(u){ return u.ikS||(u.ikS={R:{b:new V3(),ok:false},L:{b:new V3(),ok:false},kL:{b:new V3(),ok:false},kR:{b:new V3(),ok:false}}); }
function spring(sp,target,k,c,dt){sp.v+=(k*(target-sp.x)-c*sp.v)*dt; sp.x+=sp.v*dt;}

/* ---------------- pose + skeleton ---------------- */
// Smooths the pose a soldier is asked to take. Hand targets and body values follow the asked-for pose through a short
// low-pass; jump height, root motion, bow draw and whole-body spin follow it exactly (they are timed to the blow).
// v0.34 — transitions: a clip blends in from the locomotion pose, so when one clip replaces another (a parry's recoil
// mid-swing, a flinch mid-spin, one swing chained onto the last, a stun) or is cut off, the pose used to jump from where
// the body was to the walking pose on that frame — a hand flying a metre, the body dropping 30 cm out of a leap or
// snapping 170° out of a spin. Now the difference between the pose on screen and the new pose is carried over and eased
// out across 0.22 s, so every transition starts exactly where the body was and the new clip's own timing is untouched.
const CARRY_T=.22;
function filterPose(u,p,dt){
  let q=u.ps; if(!q){ q=u.ps={}; for(const f of PF) q[f]=p[f]?p[f].slice():null; for(const f of NF) q[f]=p[f]; u.actRef=u.action; return q; }
  if(u.actRef!==u.action){
    const C=u.pc||(u.pc={});
    for(const f of PF){ const a=q[f], b=p[f]; C[f]=a&&b?[a[0]-b[0],a[1]-b[1],a[2]-b[2]]:null; }
    for(const f of NF) C[f]=f==='fwd'||f==='draw'?0:f==='yaw'?wrapA((q.yaw||0)-(p.yaw||0)):(q[f]||0)-(p[f]||0);
    u.pcT=0; u.actRef=u.action; }
  let cw=0; if(u.pcT!==undefined&&u.pcT<CARRY_T){ u.pcT+=dt; cw=1-smooth(clamp(u.pcT/CARRY_T,0,1)); }
  const C=cw>0?u.pc:null;
  const k=1-Math.exp(-dt*(u.action?26:16));
  for(const f of PF){ const a=q[f], b=p[f]; if(!b){ q[f]=null; continue; } if(!a){ q[f]=b.slice(); continue; }
    const c=C&&C[f]; const bx=b[0]+(c?c[0]*cw:0), by=b[1]+(c?c[1]*cw:0), bz=b[2]+(c?c[2]*cw:0);
    a[0]+=(bx-a[0])*k; a[1]+=(by-a[1])*k; a[2]+=(bz-a[2])*k; }
  for(const f of NF){ const c=C?C[f]*cw:0;
    if(f==='jump') q[f]=Math.max(0,p[f]+c); else if(f==='yaw') q[f]=wrapA(p[f]+c); else if(f==='fwd'||f==='draw') q[f]=p[f];
    else q[f]=q[f]+(p[f]+c-q[f])*k; }
  return q;
}
function computePose(u){
  const P=POSES[u.type], sp=clamp(u.spd/u.T.speed,0,1);
  let p=lerpPose(P.idle,P.move,smooth(sp));
  const sw=u.swing*sp;
  if(P.swingL){p.L=[p.L[0],p.L[1]+Math.abs(sw)*.04,p.L[2]+sw*P.swingL];}
  if(P.swingR){p.R=[p.R[0],p.R[1]+Math.abs(sw)*.03,p.R[2]-sw*P.swingR];}
  p.twist-=sw*.22;
  if(u.T.worker&&u.carry){p.L=[-.08,.28,-.05];}
  if(u.chg&&u.chgW>.002&&!u.action){ // charging: carry the weapon the charge's way at a full sprint
    const C=CHG[u.type][u.chg.i], k=u.chgW, run=C.anim?Object.assign({},C.run,C.anim(game.time+u.id*.37,C.run)):C.run;
    for(const f of ['R','L','wR','wL']) if(run[f]){ const a=p[f]||run[f], b=run[f]; p[f]=[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k]; }
    if(run.pR!==undefined&&k>.5) p.pR=run.pR; if(run.pL!==undefined&&k>.5) p.pL=run.pL;
    p.lean+=(run.lean||0)*k; p.crouch+=(run.crouch||0)*k; if(run.twist!==undefined) p.twist+=(run.twist-p.twist)*k;
    if(u.T.cAnim) for(const f of CA_RUN_ST) if(run[f]!==undefined) p[f]+=(run[f]-p[f])*k; }   // a creature's wings, tail and jaw (13m)
  if(u.routing&&!u.action&&!u.fl){ const w=game.time*13+u.id; p.R=[.3,.32+.12*Math.sin(w),.08]; p.L=[-.3,.32+.12*Math.cos(w),.08]; p.lean=.3; }
  const a=u.action;
  if(a){
    const cp=evalClip(a.c,a.t);
    const w=a.c.loop?smooth(clamp(a.age/.12,0,1)):smooth(clamp(a.t/.12,0,1))*smooth(clamp((a.c.dur-a.t)/.26,0,1));
    p=lerpPose(p,cp,w); p.jump=cp.jump; p.draw=cp.draw; p.yaw=wrapA(cp.yaw);
    if(a.c.aim&&!u.T.bolt){p.wL=[p.wL[0],p.wL[1]+u.aimPitch*w,p.wL[2]]; p.L=[p.L[0],p.L[1]+u.aimPitch*.32*w,p.L[2]];}
  }
  if(u.fl) flyPose(u,p);
  return p;
}

const _f=new V3(),_r=new V3(),_sp=new V3(),_fl=new V3(),_rt=new V3(),_hd=new V3(),_tmp=new V3(),_tmp2=new V3(),_pole=new V3(),_home=new V3();
const _gR0=new V3(),_gW0=new V3(),_gOff=new V3(),_gQ=new THREE.Quaternion(),_ikAlt=new V3();
// Two-handed holds (v0.34): the off hand counts as gripping the weapon when it is empty (no shield, bow, second blade)
// and the pose puts the two fists together on the handle — within ~20 cm (scale 1) and not out along the blade.
// Returns a 0..1 weight so a hand sliding onto or off the handle blends.
function twoHandGrip(u,p){
  const G=u.G; if(!p.R||!p.L||!p.wR||!G||!G.w||G.w.dropped||G.str||G.w2||(G.o&&!G.o.dropped)) return 0;
  const rx=p.L[0]-p.R[0], ry=p.L[1]-p.R[1], rz=p.L[2]-p.R[2], d=Math.hypot(rx,ry,rz);
  if(d>.23) return 0;
  const wl=Math.hypot(p.wR[0],p.wR[1],p.wR[2])||1, along=-(rx*p.wR[0]+ry*p.wR[1]+rz*p.wR[2])/wl;   // + toward the pommel
  return smooth(clamp((.23-d)/.07,0,1))*smooth(clamp((along+.08)/.05,0,1));
}
function toW(out,origin,v,s){return out.copy(origin).addScaledVector(_r,v[0]*s).addScaledVector(_sp,v[1]*s).addScaledVector(_fl,v[2]*s);}
function dirW(out,v){return out.set(0,0,0).addScaledVector(_r,v[0]).addScaledVector(_sp,v[1]).addScaledVector(_fl,v[2]).normalize();}

function buildSkel(u,p,dt){
  const s=u.s,j=u.j,k=150*tune.spring*tune.spring,c=2*Math.sqrt(k)*.62;
  _f.set(Math.sin(u.face+(p.yaw||0)),0,Math.cos(u.face+(p.yaw||0))); _r.set(_f.z,0,-_f.x);   // yaw = whole-body spin moves
  u.fwdW.copy(_f); u.rightW.copy(_r);
  const sp=clamp(u.spd/u.T.speed,0,1);
  // springs: lean follows pose, head lags behind
  const accel=u.accF||0;
  spring(u.leanS,p.lean*(u.action?1:lerp(1,tune.lean,sp))+clamp(accel*.035,-.25,.3),k,c,dt);
  spring(u.headS,u.leanS.x,k*.55,c*.55,dt);
  spring(u.rsz,0,k*.9,c*.6,dt); spring(u.rsx,0,k*.9,c*.6,dt);
  spring(u.sideS,p.side+clamp((u.turnV||0)*-.06,-.25,.25),k,c,dt);
  const lean=u.leanS.x+u.rsz.x, side=u.sideS.x+u.rsx.x;
  _sp.copy(UP).multiplyScalar(Math.cos(lean)).addScaledVector(_f,Math.sin(lean)).addScaledVector(_r,Math.sin(side)).normalize();
  _fl.copy(_f).multiplyScalar(Math.cos(lean)).addScaledVector(UP,-Math.sin(lean)).normalize();
  u.spine.copy(_sp);
  // feet + pelvis
  const airborne=p.jump>.04;
  updateFeet(u,dt,airborne);
  const gy=groundAt(u,u.pos.x,u.pos.z);
  let bob=0; for(const ft of u.feet) if(ft.t>=0) bob=Math.max(bob,Math.sin(Math.PI*ft.t));
  const bobAmp=(.03+.045*sp)*s*tune.bob;
  const breathe=Math.sin(game.time*(u.type==='giant'?1.6:2.6)+u.id)*(.006+.01*(1-sp))*s;
  if(!u.aim&&u.aimDy) u.aimDyT=0; if(u.aimDy!==undefined||u.aimDyT) u.aimDy=(u.aimDy||0)+((u.aimDyT||0)-(u.aimDy||0))*(1-Math.exp(-dt*10));
  j.pelvis.set(u.pos.x,gy+(.885-p.crouch)*s+p.jump*s+(bob-.4)*bobAmp+breathe+(u.aimDy||0),u.pos.z).addScaledVector(_f,-Math.sin(lean)*.1*s);
  j.hipL.copy(j.pelvis).addScaledVector(_r,-.05*s); j.hipR.copy(j.pelvis).addScaledVector(_r,.05*s);
  // hip height: the planted feet decide how high the pelvis may ride (a straight leg, no higher), and the hips glide to
  // that height. v0.34: the cap is part of the glide's target — it used to be applied after the glide, so the pelvis
  // dropped by the full cap the frame a far foot planted and sprang back the frame it lifted (a 15–20 cm jolt in a jog).
  let cap=1e9, capPlanted=1e9;
  if(!airborne){ // keep planted feet reachable
    const reach=.89*s*.985; let lo=1e9,hi=-1e9,n=0, ahead=1e9;
    for(let i=0;i<2;i++){const ft=u.feet[i]; if(i===1&&(p.kick>.05||(u.aim&&u.aim.by==='foot'))) continue; const hip=i?j.hipR:j.hipL;
      if(ft.t>=0){ // a foot about to land: lower the hips for it during the stride, not on the frame it lands
        if(ft.t>.45){ const dx=hip.x-ft.to.x,dz=hip.z-ft.to.z, w=smooth(clamp((ft.t-.45)/.5,0,1)), my=groundAt(u,ft.to.x,ft.to.z)+.045*s+Math.sqrt(Math.max(0,reach*reach-dx*dx-dz*dz));
          ahead=Math.min(ahead,my+(1-w)*s); }
        continue; }
      const dx=hip.x-ft.pos.x,dz=hip.z-ft.pos.z,h2=dx*dx+dz*dz, maxY=ft.pos.y+.045*s+Math.sqrt(Math.max(0,reach*reach-h2));
      lo=Math.min(lo,maxY); hi=Math.max(hi,maxY); n++; }
    if(n) capPlanted=Math.min(hi,lo+.08*s);
    cap=Math.min(capPlanted,ahead);
  }
  { // glide the hips toward their target height (no glide in the air: a leap follows its clip exactly)
    const ty=Math.min(j.pelvis.y,cap);
    if(u.pyS===undefined||airborne) u.pyS=ty; else u.pyS+=(ty-u.pyS)*(1-Math.exp(-dt*(ty<u.pyS?60:22)));
    u.wasAir=airborne;
    // a planted leg may not over-stretch by more than ~1 cm while the glide catches up
    const lim=Math.min(u.pyS,capPlanted+.008*s), d=j.pelvis.y-lim;
    const D=u.ikD||(u.ikD={}); D.raw=j.pelvis.y; D.cap=cap; D.capP=capPlanted; D.pyS=u.pyS; D.bob=bob; D.y=lim;   // the debug view reads these
    j.pelvis.y-=d; j.hipL.y-=d; j.hipR.y-=d; }
  j.chest.copy(j.pelvis).addScaledVector(_sp,.54*s);
  j.neck.copy(j.pelvis).addScaledVector(_sp,.62*s);
  const hl=u.headS.x-u.leanS.x+u.rsz.x*.7;
  u.look=p.look||0;
  _hd.copy(_sp).addScaledVector(_fl,Math.sin(hl)*1.2).addScaledVector(_r,Math.sin(u.look)*.3).normalize();
  j.head.copy(j.neck).addScaledVector(_hd,.19*s);
  // shoulders twist
  const tw=p.twist+(p.look||0)*.25;
  _rt.copy(_r).multiplyScalar(Math.cos(tw)).addScaledVector(_f,Math.sin(tw));
  const shw=(u.T.shW||.07)*s;   // half the shoulder width (the Dreadguard is built broad)
  j.sR.copy(j.chest).addScaledVector(_rt,shw);
  j.sL.copy(j.chest).addScaledVector(_rt,-shw);
  // arms
  toW(u.hand.R,j.chest,p.R,s); toW(u.hand.L,j.chest,p.L,s);
  dirW(u.wRw,p.wR); dirW(u.wLw,p.wL);
  const grip=twoHandGrip(u,p);   // 0..1: the off hand is authored on the weapon's handle
  if(grip){ _gR0.copy(u.hand.R); _gW0.copy(u.wRw); }
  if(u.aim) applyAim(u,dt,p);
  if(u.fl) flyArms(u,p,dt);
  if(p.pR) toW(_pole,j.sR,p.pR,s); else _pole.copy(j.sR).addScaledVector(UP,-1*s).addScaledVector(_r,.38*s).addScaledVector(_f,-.08*s);
  if(u.T.handHook) u.T.handHook(u,p,s);   // a Ballista's crewman keeps his hands on its grips (27k)
  const al=.32*s*(u.T.armK||1);   // a Devil Bat's arms are long
  const IKS=ikState(u), mt=clamp(dt*13,.12,.45); u.ikMt=mt;   // an elbow or knee swings round at up to ~13 rad/s
  // when the pole lines up with the arm, the elbow falls back on pointing back and out (and a little down)
  _ikAlt.copy(_f).multiplyScalar(-.7).addScaledVector(_r,.6).addScaledVector(UP,-.25);
  ik2(j.sR,u.hand.R,al,al,_pole,j.eR,j.hR,IKS.R,_ikAlt,mt);
  if(grip){ // the off hand rides the handle: the aim warp and an out-of-reach target move only the weapon hand, so carry
    // the authored hand-to-hand offset with the weapon (turned as the blade turned) to where the weapon hand really is.
    // Fully from half weight up: a partial follow left the off hand 10 cm behind when the aim moved the weapon hand.
    _gQ.setFromUnitVectors(_gW0,u.wRw); _gOff.subVectors(u.hand.L,_gR0).applyQuaternion(_gQ); _tmp2.copy(j.hR).add(_gOff); u.hand.L.lerp(_tmp2,smooth(clamp(grip*2,0,1))); }
  if(u.type==='spear'&&u.G&&u.G.o&&!u.G.o.dropped) hopliteArm(u,s);
  else { if(p.pL) toW(_pole,j.sL,p.pL,s); else _pole.copy(j.sL).addScaledVector(UP,-1*s).addScaledVector(_r,-.38*s).addScaledVector(_f,-.08*s);
    _ikAlt.copy(_f).multiplyScalar(-.7).addScaledVector(_r,-.6).addScaledVector(UP,-.25);
    ik2(j.sL,u.hand.L,al,al,_pole,j.eL,j.hL,IKS.L,_ikAlt,mt); }
  u.grip=grip;
  u.draw=p.draw;
  // legs
  for(let i=0;i<2;i++){
    const hip=i?j.hipR:j.hipL, ft=u.feet[i], knee=i?j.kR:j.kL, foot=i?j.fR:j.fL;
    _tmp.copy(ft.pos); _tmp.y+=.045*s;
    if(i===1&&p.kick>.01){ // front kick / stomp: foot driven forward to knee height
      _tmp2.copy(hip).addScaledVector(_f,.55*s).addScaledVector(UP,-.36*s); _tmp.lerp(_tmp2,clamp(p.kick,0,1)); }
    if(i===1&&u.aim&&u.aim.by==='foot') _tmp.lerp(u.aim.T,u.aim.w);
    _pole.copy(hip).addScaledVector(_f,1.2*s).addScaledVector(_r,(i?1:-1)*.2*s);
    // a leg kicked out level points along its own pole: the knee then rises (chambered) rather than flipping
    _ikAlt.copy(UP).addScaledVector(_f,.3);
    ik2(hip,_tmp,.445*s,.445*s,_pole,knee,foot,i?IKS.kR:IKS.kL,_ikAlt,mt*3,_f);   // knees follow a turning body closely and never fold backward
  }
}

// Hoplite shield arm. The authored left-hand target is where the aspis should sit; like a real hoplite the
// forearm runs across the back of the shield (through the armband at its centre) to the grip near the right rim,
// with the elbow out to the left, so the shield turns and tilts with the arm instead of standing upright.
const _hn=new V3(),_hf=new V3(),_hh=new V3(),_hv=new V3();
function hopliteArm(u,s){
  const j=u.j, C=u.hand.L;
  _hn.copy(u.wLw).addScaledVector(_r,-.3).normalize();            // shield face: the pose's wL, angled a little to the left flank
  _hf.crossVectors(_sp,_hn); if(_hf.lengthSq()<1e-4) _hf.copy(_r); _hf.normalize();   // across the body, toward the right
  _hh.copy(C).addScaledVector(_hf,.2*s);                           // grip (antilabe)
  _pole.copy(C).addScaledVector(_hf,-.55*s).addScaledVector(_sp,-.12*s).addScaledVector(_hn,-.05*s);
  for(let it=0;it<3;it++){
    _hv.subVectors(_hh,j.sL); const d=_hv.length(), mx=.54*s; if(d>mx) _hh.copy(j.sL).addScaledVector(_hv,mx/d);   // keep the elbow bent
    if(it===2){ ik2(j.sL,_hh,.32*s,.32*s,_pole,j.eL,j.hL,ikState(u).L,null,u.ikMt||.3); break; }
    ik2(j.sL,_hh,.32*s,.32*s,_pole,j.eL,j.hL);
    // nudge the grip so the armband (shield centre) lands where the pose wants the shield
    _hv.subVectors(j.hL,j.eL).normalize(); _hh.add(_hv.multiplyScalar(-.09*s).sub(j.eL).add(C));
  }
}
// shield frame from the actual forearm: centre on the armband, face turned toward the pose's wL, Λ kept upright
const _gf=new V3(),_gn=new V3(),_gy=new V3(),_gc=new V3();
function aspisFrame(u){
  const j=u.j, s=u.s; _gf.subVectors(j.hL,j.eL); if(_gf.lengthSq()<1e-8) _gf.copy(u.rightW); _gf.normalize();
  _gn.copy(u.wLw).addScaledVector(u.rightW,-.3); _gn.addScaledVector(_gf,-_gn.dot(_gf));
  if(_gn.lengthSq()<.04){ _gn.copy(u.fwdW).addScaledVector(_gf,-u.fwdW.dot(_gf)); if(_gn.lengthSq()<1e-4) _gn.set(0,1,0); }
  _gn.normalize(); _gy.crossVectors(_gn,_gf); if(_gy.dot(u.spine)<0) _gy.negate();
  _gc.copy(j.eL).addScaledVector(_gf,.09*s).addScaledVector(_gn,.02*s);
}
function updateFeet(u,dt,airborne){
  if(u.fl&&u.fl.air){ flyFeet(u,dt); return; }
  const s=u.s, rs=Math.sqrt(s), spd=u.spd, ft=u.feet;
  const dur=clamp((.34-spd*.034/rs)*rs,.13*rs,.42*rs);
  const lead=dur*.55;
  // gait swing signal for arms
  const dfx=(ft[1].pos.x-ft[0].pos.x)*_f.x+(ft[1].pos.z-ft[0].pos.z)*_f.z;
  u.swing=clamp(dfx/(.55*s),-1,1);
  if(airborne){
    for(let i=0;i<2;i++){const sd=i?1:-1;
      _tmp.copy(u.pos).addScaledVector(_r,sd*.12*s).addScaledVector(_f,(i?.18:-.08)*s); _tmp.y=u.j.pelvis.y-.62*s;
      ft[i].pos.lerp(_tmp,1-Math.exp(-dt*18)); ft[i].t=-1; ft[i].air=true;}
    return;
  }
  let stepping=-1;
  for(let i=0;i<2;i++){
    const f=ft[i]; const sd=i?1:-1;
    if(f.air){ f.air=false; const g=groundAt(u,f.pos.x,f.pos.z), hgt=f.pos.y-g;
      // landing (v0.34): a tucked foot finishes its fall as the back half of a quick step instead of snapping to the ground
      if(hgt>.02*s&&hgt<1.2*s){ f.from.copy(f.pos); f.to.copy(f.pos); f.t=.55; f.dur=.16*rs; f.lift=hgt/.864; }
      else f.pos.y=g;
      if(u.s>1.5) {puff(f.pos,3,.35*s,1.2); shakeAt(f.pos,.06);} }
    if(f.t>=0){
      if(f.dur>dur) f.dur+=(dur-f.dur)*(1-Math.exp(-dt*12));   // speeding up mid-stride: quicken the step
      f.t+=dt/f.dur;
      _home.copy(u.pos).addScaledVector(_r,sd*.13*s).addScaledVector(_f,-sd*.07*s).addScaledVector(u.av,lead+f.dur*Math.max(0,1-f.t)*.5);
      clampOffset(_home,u.pos,.42*s*tune.step);
      f.to.lerp(_home,1-Math.exp(-dt*20));
      const e=EASE.io(Math.pow(Math.min(f.t,1),.9));
      f.pos.x=lerp(f.from.x,f.to.x,e); f.pos.z=lerp(f.from.z,f.to.z,e);
      // the foot's arc: up early, down late, and (v0.34) leaving and meeting the ground at zero speed — sin(πt^.75)
      // threw the foot ~13 cm up on a stride's first frame and slapped it down on the last
      const tt=Math.min(f.t,1);
      f.pos.y=groundAt(u,f.pos.x,f.pos.z)+f.lift*(.5-.5*Math.cos(2*Math.PI*Math.pow(tt,.8)));
      { // running heel-flick: the foot kicks up behind before swinging through, like the 2D sprinters (eased in as well)
        const kick=clamp((spd-1.8)/2.5,0,1)*.2*s*(.5-.5*Math.cos(2*Math.PI*tt))*(1-tt)*2.15;
        f.pos.x-=_f.x*kick; f.pos.z-=_f.z*kick; f.pos.y+=kick*.9; }
      if(f.t>=1){f.t=-1; f.pos.y=groundAt(u,f.pos.x,f.pos.z); u.settle=0; if(u.s>1.5){puff(f.pos,2,.3*s,.8); shakeAt(f.pos,.05); sfx('giantStep',f.pos,.55);}}
      else stepping=i;
    }
  }
  u.settle+=dt;
  const running=spd>2;
  let canStart=stepping<0||(running&&ft[stepping].t>.55);
  if(!canStart){ // a lunge can outrun a slow step: never leave the planted foot more than a stride behind
    const o=ft[1-stepping], sd=stepping?-1:1; _home.copy(u.pos).addScaledVector(_r,sd*.13*s);
    if(o.t<0&&Math.hypot(o.pos.x-_home.x,o.pos.z-_home.z)>.55*s) canStart=true; }
  if(!canStart) return;
  let best=-1,bestErr=0;
  for(let i=0;i<2;i++){
    if(ft[i].t>=0) continue; const sd=i?1:-1;
    _home.copy(u.pos).addScaledVector(_r,sd*.13*s).addScaledVector(_f,-sd*.07*s).addScaledVector(u.av,lead);
    const ex=ft[i].pos.x-_home.x, ez=ft[i].pos.z-_home.z, err=Math.sqrt(ex*ex+ez*ez);
    if(err>bestErr){bestErr=err;best=i;}
  }
  if(best<0) return;
  const thresh=clamp((.08+spd*.075)*s*tune.step,.06*s,.44*s*tune.step);
  const idleSettle=spd<.25&&bestErr>.055*s&&u.settle>.16;
  if(bestErr>thresh||idleSettle){
    const f=ft[best], sd=best?1:-1;
    f.from.copy(f.pos); f.t=0; f.dur=idleSettle&&spd<.25?.2*rs:dur; f.lift=(.07+.05*Math.min(spd,5))*s*(u.type==='giant'?1.4:1);
    f.to.copy(u.pos).addScaledVector(_r,sd*.13*s).addScaledVector(_f,-sd*.07*s).addScaledVector(u.av,lead+f.dur*.5); clampOffset(f.to,u.pos,.42*s*tune.step);
  }
}
function clampOffset(p,c,max){const dx=p.x-c.x,dz=p.z-c.z,d=Math.sqrt(dx*dx+dz*dz); if(d>max){p.x=c.x+dx/d*max; p.z=c.z+dz/d*max;}}

/* ---------------- gear placement ---------------- */
const _x=new V3(),_y=new V3(),_z=new V3(),_mb=new THREE.Matrix4();
function orient(g,pos,ydir,zhint){
  _y.copy(ydir).normalize(); _x.crossVectors(_y,zhint); if(_x.lengthSq()<1e-6){_x.crossVectors(_y,UP); if(_x.lengthSq()<1e-6)_x.set(1,0,0);} _x.normalize(); _z.crossVectors(_x,_y);
  _mb.makeBasis(_x,_y,_z); g.quaternion.setFromRotationMatrix(_mb); g.position.copy(pos);
}
function updateGear(u){
  const G=u.G, j=u.j; if(!G) return;
  const fl=_tmp2.copy(u.fwdW).addScaledVector(u.spine,-u.fwdW.dot(u.spine)).normalize();
  if(G.w&&!G.w.dropped){ orient(G.w,j.hR,u.wRw,u.rightW); }
  if(G.o&&!G.o.dropped&&!u.T.siege){
    if(u.type==='spear'){ aspisFrame(u); orient(G.o,_gc,_gy,_gn); }
    else orient(G.o,j.hL,_tmp.copy(u.spine).addScaledVector(u.wLw,-u.spine.dot(u.wLw)),u.wLw);
  }
  if(G.h&&!G.h.dropped){ _tmp.subVectors(j.head,j.neck); const lk=u.alive?(u.look||0):0; if(lk){ fl.multiplyScalar(Math.cos(lk)).addScaledVector(u.rightW,Math.sin(lk)).normalize(); } orient(G.h,j.head,_tmp,fl); }
  if(G.b&&!u.T.siege){ _tmp.copy(j.chest).addScaledVector(fl,-.19*u.s).addScaledVector(u.spine,-.1*u.s); orient(G.b,_tmp,u.spine,fl); if(u.T.worker) G.b.visible=u.carry; }
  if(G.str&&G.o&&!G.o.dropped){
    G.o.updateMatrixWorld(); const a=G.str.a.copy(BOW_TOP).applyMatrix4(G.o.matrixWorld), b=G.str.b.copy(BOW_BOT).applyMatrix4(G.o.matrixWorld);
    const d=u.alive?u.draw:0;
    const mid=G.str.m.copy(a).add(b).multiplyScalar(.5).lerp(j.hR,clamp(d*1.2,0,1)); G.str.vis=true;
    G.nock.visible=u.alive&&d>.12;
    if(G.nock.visible){ _tmp.subVectors(j.hL,mid); const L=_tmp.length(); _tmp.multiplyScalar(1/Math.max(L,1e-4)); _tmp2.copy(mid).addScaledVector(_tmp,.4*u.s); orient(G.nock,_tmp2,_tmp,u.rightW);}
  }
  if(u.T.gearHook) u.T.gearHook(u);   // the Ballista, the Hawk Archer's hawk (27k)
  if(u.T.gearX) updateGearX(u);
}

