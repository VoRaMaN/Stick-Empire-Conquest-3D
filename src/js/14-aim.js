/* ---------- contact aim: every finisher blow lands on the body part it is meant for ----------
   Each contact event names a striker and a target part. While the blow comes in, the IK target of the
   striking hand / foot (and the weapon direction for thrusts) is bent so the striker meets that part
   exactly at the event; the root slides, turns and drops when the part is out of reach.
   by: tip (thrust point) · blade (edge / shaft / club) · pick (pick point) · pommel · hL (fist, shield, bow, giant hand) · foot */
const FIN_AIM={
  cleave:[[.86,'blade','neck']],
  runThrough:[[.3,'tip','chest']],
  spinBehead:[[.55,'blade','neck']],
  xCut:[[.22,'blade','chest'],[.6,'blade','chest']],
  executioner:[[1.28,'blade','neck']],
  risingLaunch:[[.2,'blade','gut'],[.52,'blade','chest']],
  bootAndStab:[[.2,'foot','gut'],[.95,'tip','chest']],
  thousandCuts:[[.12,'blade','chest'],[.36,'blade','gut'],[.6,'blade','chest'],[.84,'tip','gut'],[1.3,'blade','chest']],
  pommelBehead:[[.18,'pommel','head'],[.6,'blade','neck']],
  tornadoCleave:[[.86,'blade','head']],
  skewer:[[.35,'tip','chest']],
  shieldCrush:[[.2,'hL','chest'],[.6,'hL','chest'],[1.2,'tip','chest']],
  tripAndPin:[[.3,'blade','shin'],[.9,'tip','chest']],
  whirlwindThrust:[[.45,'blade','chest'],[.85,'tip','chest']],
  shieldLauncher:[[.25,'hL','chest'],[.82,'tip','chest']],
  chargingSkewer:[[.35,'tip','chest']],
  hammerFall:[[.85,'tip','neck']],
  lowAndHigh:[[.2,'hL','chest'],[.55,'tip','thigh'],[.95,'tip','head']],
  vaultKick:[[.55,'foot','chest']],
  shieldAndBoot:[[.2,'hL','chest'],[.62,'foot','gut']],
  hurl:[[.45,'hL','neck']],
  pancake:[[1.0,'blade','head']],
  grabSlam:[[.45,'hL','neck']],
  stompOut:[[.45,'blade','chest'],[1.4,'foot','chest']],
  homeRun:[[.82,'blade','chest']],
  whackAMole:[[.8,'blade','head'],[1.5,'blade','head']],
  squeeze:[[.45,'hL','neck']],
  hammerThrow:[[.45,'hL','neck']],
  skyLauncher:[[.8,'blade','gut']],
  golfSwing:[[.3,'blade','head'],[1.15,'blade','chest']],
  bonk:[[.75,'pick','head']],
  pickExecution:[[.88,'pick','head']],
  hookAndFlip:[[.3,'pick','chest']],
  headbuttCombo:[[.18,'head','chest'],[.52,'head','chest'],[1.02,'pick','head']],
  kickAndPick:[[.22,'foot','gut'],[.98,'pick','chest']],
  spinningBonk:[[.55,'pick','head']],
  haymaker:[[.45,'hL','head']],
  whackWhack:[[.25,'pick','head'],[.7,'pick','head']],
  leapingPick:[[.56,'pick','head']],
  dragAndBonk:[[.3,'pick','chest'],[1.72,'pick','head']],
  pointblank:[[.3,'hL','head']],
  doubleTap:[[.22,'foot','gut']],
  bowCombo:[[.22,'hL','head'],[.62,'hL','head'],[.85,'foot','gut']],
  skyShot:[[.25,'foot','chest']],
  spinKick:[[.45,'foot','chest']],
  backflipShot:[[.22,'foot','gut']],
  kneeElbowBow:[[.98,'hL','head']],
  volley:[[.22,'foot','gut']],
};
// where an unaimed contact lands (FX only): headbutts, knees, elbows, arrows
const FIN_HIT={kneeElbowBow:{.2:'gut',.5:'head'},kneelingExecution:{1.28:'head',1.3:'head'},pinShot:{.62:'chest'}};
if(typeof FIN_AIM_X!=='undefined'){ Object.assign(FIN_AIM,FIN_AIM_X); Object.assign(FIN_HIT,FIN_HIT_X); }
for(const t in FINS) for(const n of FINS[t]){ const A=FIN_AIM[n], Hh=FIN_HIT[n], ev=RAW[t][FIN[n].clip].ev; if(!ev||(!A&&!Hh)) continue;
  let prevT=0; for(const e of ev.slice().sort((a,b)=>a.t-b.t)){
    const s=A&&A.find(x=>Math.abs(x[0]-e.t)<1e-3); if(s&&e.e!=='release'){ e.aim=[s[1],s[2]]; e.pre=clamp((e.t-prevT)*.7,.08,.22); prevT=e.t; }
    if(Hh&&Hh[e.t]) e.part=Hh[e.t]; if(!e.part&&e.aim) e.part=e.aim[1];
    // archer shots: the bow swings onto the body the arrow is meant for
    if(t==='archer'&&(e.e==='execute'||(e.e==='kill'&&Hh&&Hh[e.t]&&!e.aim))){ if(!e.part) e.part='chest'; e.aim=['bow',e.part]; e.pre=.3; } } }
// regular attacks: where each blow is meant to land (blocked blows land on the guard, dodged ones whiff)
const ATK_AIM={
  sword:{slash1:[['blade','neck']],slash2:[['blade','chest']],jumpslash:[['blade','neck']],doubleChop:[['blade','neck'],['blade','chest']],lungeStab:[['tip','chest']],
    spinSlash:[['blade','chest']],sweepLow:[['blade','shin']],backhandCut:[['blade','chest']],kickSlash:[['foot','gut'],['blade','neck']],pommelBash:[['pommel','head']],
    flurry:[['tip','chest'],['tip','chest'],['tip','gut']],leapStab:[['tip','chest']],shoulderCharge:[['shoulder','chest'],['blade','neck']]},
  spear:{thrust:[['tip','chest']],lowThrust:[['tip','thigh']],doubleThrust:[['tip','chest'],['tip','chest']],shieldBash:[['hL','chest']],spearSweep:[['blade','chest']],
    chargeThrust:[['tip','chest']],overheadSlam:[['blade','neck']],spinSweep:[['blade','chest']],shieldPushStab:[['hL','chest'],['tip','chest']],jumpThrust:[['tip','chest']],braceThrust:[['tip','chest']]},
  giant:{smash:[['blade','head']],sideSweep:[['blade','chest']],doubleSmash:[['blade','head'],['blade','head']],backhandSwing:[['blade','chest']],uppercutSwing:[['blade','gut']],
    spinSwing:[['blade','chest']],clubJab:[['tip','chest']],leapSlam:[['blade','head']],shoulderBarge:[['shoulder','head']]},
  miner:{mine:[['pick','head']],pickChop:[['pick','head']],sideSwing:[['pick','chest']],pickHook:[['pick','head']],headbutt:[['head','chest']],kick:[['foot','gut']],doubleChop:[['pick','head'],['pick','chest']],
    spinSwing:[['pick','chest']],jab:[['pick','chest']],leapChop:[['pick','head']],uppercut:[['hL','head']]},
  archer:{bowBash:[['hL','head']],kick:[['foot','gut']]},
};
if(typeof ATK_AIM_X!=='undefined') Object.assign(ATK_AIM,ATK_AIM_X);
for(const t in ATK_AIM) for(const n in ATK_AIM[t]){ const c=RAW[t][n]; if(!c||!c.ev) continue; let i=0, prevT=0;
  for(const e of c.ev.slice().sort((a,b)=>a.t-b.t)){ if(e.e!=='hit') continue; const a=ATK_AIM[t][n][i++];
    if(a){ e.aim=a; e.part=a[1]; e.pre=clamp((e.t-prevT)*.7,.08,.2); } else e.part='chest'; prevT=e.t; }
  c.atk=1; }
for(const t in CHG) for(const c of CHG[t]){ let prevT=0; for(const e of c.ev.slice().sort((a,b)=>a.t-b.t)){ if(e.e==='hit'&&e.aim){ e.part=e.aim[1]; e.pre=clamp((e.t-prevT)*.7,.08,.2); prevT=e.t; } } }
// a defender's guard: the shield face, or the weapon held across the body
function guardPoint(v,out){
  if(v.type==='spear'&&v.G&&v.G.o&&!v.G.o.dropped) return out.copy(v.G.o.position).add(_aimX.set(0,0,1).applyQuaternion(v.G.o.quaternion).multiplyScalar(.1*v.s));
  if(v.type==='archer') return out.copy(v.j.hL);
  return out.copy(v.j.hR).addScaledVector(v.wRw,(v.type==='giant'?.55:.32)*v.s); }
function defKind(v){ const d=v.defQ&&v.defQ.kind, nm=v.action&&v.action.c.name; return d||(nm==='block'||nm==='parry'||nm==='dodge'?nm:null); }
// where on the weapon the contact happens (in body-scale units along the weapon from the hand)
// tip = how deep a finishing thrust runs the target through; hit = a normal thrust that just goes in
const AIMW={sword:{tip:.78,hit:.84,blade:[.3,.86],pommel:-.07,r:0},spear:{tip:1.25,hit:1.6,blade:[.1,1.5],r:.03},giant:{tip:1.1,hit:1.1,blade:[.45,1.15],r:.11},miner:{tip:.62,hit:.62,blade:[.2,.7],r:.03},archer:{tip:.3,hit:.3,blade:[0,.3],r:.04}};
const RAG_OF={head:3,neck:2,chest:1,gut:1,pelvis:0,thigh:10,shin:11};
function partPoint(v,at,out){ const j=v.j;
  switch(at){
    // the 'chest' joint is the shoulder line, so the sternum sits ~3/4 of the way up the torso
    case 'head': return out.copy(j.head);
    case 'neck': return out.copy(j.chest).lerp(j.neck,.8);
    case 'gut': return out.copy(j.pelvis).lerp(j.chest,.4);
    case 'pelvis': return out.copy(j.pelvis);
    case 'thigh': return out.copy(j.hipR).add(j.hipL).add(j.kR).add(j.kL).multiplyScalar(.25);
    case 'shin': return out.copy(j.kR).add(j.kL).add(j.fR).add(j.fL).multiplyScalar(.25).lerp(_tmp3.copy(j.kR).add(j.kL).multiplyScalar(.5),.2);
    default: return out.copy(j.pelvis).lerp(j.chest,.74);
  } }
const PART_R={head:.19,neck:.09,chest:.1,gut:.1,pelvis:.1,thigh:.07,shin:.06};
// the point of the striker that should touch the target (world space, current skeleton)
function strikePoint(u,by,out,T){
  const W=AIMW[u.type], s=u.s, j=u.j;
  switch(by){
    case 'tip': return out.copy(j.hR).addScaledVector(u.wRw,(u.fin?W.tip:W.hit)*s);
    case 'pommel': return out.copy(j.hR).addScaledVector(u.wRw,(W.pommel||0)*s);
    case 'pick': { _aimX.crossVectors(u.wRw,u.rightW).normalize(); out.copy(j.hR).addScaledVector(u.wRw,.7*s);
      const sg=T?(u.pickSg=_aimY.subVectors(T,out).dot(_aimX)<0?-1:1):(u.pickSg||1); return out.addScaledVector(_aimX,.34*s*sg); }
    case 'blade': { const a=W.blade[0]*s,b=W.blade[1]*s, l=T?clamp(_aimY.subVectors(T,j.hR).dot(u.wRw),a,b):b; return out.copy(j.hR).addScaledVector(u.wRw,l); }
    case 'foot': return out.copy(j.fR);
    case 'hL': if(u.type==='spear'&&u.G&&u.G.o&&!u.G.o.dropped) return out.copy(u.G.o.position); return out.copy(j.hL);
    case 'head': return out.copy(j.head);
    case 'shoulder': return out.copy(j.chest).addScaledVector(u.fwdW,.1*s);
    case 'tail': return out.copy(u.cr?u.cr.tailTip:j.pelvis);
  } return out.copy(j.hR); }
const _aimX=new V3(),_aimY=new V3(),_aimT=new V3(),_aimP=new V3(),_aimD=new V3(),_aimQ=new V3(),_aimH=new V3();
// predicted strike point at clip time te for a root at `root` (motion warping looks ahead with this)
const _pf=new V3(),_pr=new V3(),_psp=new V3(),_pfl=new V3(),_pp=new V3(),_pq=new V3(),_pd=new V3(),_pH=new V3(),_pS=new V3();
let _pReach=.62;
function predictStrike(u,c,te,by,root,out){
  if(u.T.crawler) return crPredict(u,c,te,by,root,out);
  const k=evalClip(c,te), s=u.s, yaw=u.face+(k.yaw||0);
  _pf.set(Math.sin(yaw),0,Math.cos(yaw)); _pr.set(_pf.z,0,-_pf.x);
  // the lean spring lags the pose by ~0.13s; account for it when the blow is close
  const ln=u.leanS?k.lean+(u.leanS.x-k.lean)*Math.exp(-Math.max(0,te-(u.action?u.action.t:0))/.13):k.lean;
  const cl=Math.cos(ln), sl=Math.sin(ln);
  _psp.copy(UP).multiplyScalar(cl).addScaledVector(_pf,sl); _pfl.copy(_pf).multiplyScalar(cl).addScaledVector(UP,-sl);
  _pp.copy(root); _pp.y=root.y+(.885-k.crouch+k.jump)*s+(u.fl?flyAltAt(u,c,k):0); _pp.addScaledVector(_pf,-sl*.1*s);
  if(by==='foot'){ _pS.copy(_pp).addScaledVector(_pr,.05*s); _pq.copy(_pS).addScaledVector(_pf,.55*s).addScaledVector(UP,-.36*s);
    out.copy(root).addScaledVector(_pr,.13*s); out.y=root.y+.045*s; out.lerp(_pq,clamp(k.kick,0,1)); _pH.copy(out); _pReach=.88*s; return out; }
  if(by==='head'){ _pS.copy(_pp); _pReach=.01; out.copy(_pp).addScaledVector(_psp,.81*s); _pH.copy(out); return out; }
  _pp.addScaledVector(_psp,.54*s);
  if(by==='shoulder'){ _pS.copy(_pp); _pReach=.01; out.copy(_pp).addScaledVector(_pfl,.1*s); _pH.copy(out); return out; }
  const v=by==='hL'?k.L:k.R;
  out.copy(_pp).addScaledVector(_pr,v[0]*s).addScaledVector(_psp,v[1]*s).addScaledVector(_pfl,v[2]*s);
  // the arm can't stretch past full reach from its shoulder
  const rch=(by==='hL'&&u.type==='spear'?.42:.62)*s;
  _pS.copy(_pp).addScaledVector(_pr,(by==='hL'?-.07:.07)*s); _pd.subVectors(out,_pS); const dl=_pd.length(); if(dl>rch) out.copy(_pS).addScaledVector(_pd,rch/dl);
  _pH.copy(out); _pReach=rch;
  if(by==='hL') return out;
  const wv=k.wR; _pd.set(0,0,0).addScaledVector(_pr,wv[0]).addScaledVector(_psp,wv[1]).addScaledVector(_pfl,wv[2]).normalize();
  const W=AIMW[u.type];
  return out.addScaledVector(_pd,(by==='tip'?(u.fin?W.tip:W.hit):by==='pommel'?(W.pommel||0):by==='pick'?.7:W.blade[1]*.88)*s);
}
function aimTarget(u,v,by,at,out){
  if(!u.fin&&v.alive){ const dk=defKind(v); if(dk==='dodge') return null; if(dk==='block'||dk==='parry'){ guardPoint(v,out); return out; } }
  partPoint(v,at,out);
  // blunt strikers touch the surface; edges and points go in
  const blunt=by==='hL'||by==='foot'||by==='pommel'||by==='head'||by==='shoulder'||(by==='blade'&&u.type!=='sword');
  if(blunt){ _aimD.subVectors(u.j.chest,out); _aimD.y*=.3; if(_aimD.lengthSq()>1e-6) out.addScaledVector(_aimD.normalize(),(PART_R[at]||.1)*v.s*.85+(by==='blade'?AIMW[u.type].r*u.s:by==='hL'&&u.type==='spear'?.14*u.s:by==='head'?.19*u.s:by==='shoulder'?.06*u.s:.04*u.s)); }
  return out;
}
const _wT=new V3(),_wP=new V3(),_wR=new V3();
// pick the live aim for this frame: weight ramps in over the blow, holds at contact and eases out
function updateFinAim(u,dt){
  if(u.residX||u.residZ){ u.pos.x+=u.residX||0; u.pos.z+=u.residZ||0; u.residX=u.residZ=0; }
  const a=u.action, f=u.fin; u.aim=null;
  const fin=!!(a&&f&&a.c.name===f.def.clip&&f.victim), at=a&&!fin&&a.c.atk&&u.atkTarget&&u.atkTarget.isUnit&&u.atkTarget.alive?u.atkTarget:null;
  if(!fin&&!at){ u.aimDyT=0; return; }
  let best=null,bw=0,next=null,prevT=0;
  for(const e of a.c.ev){ if(!e.aim) continue; const t=a.t, te=e.t;
    if(te>t+1e-4&&!next) next=e; if(te<=t) prevT=te;
    const hold=e.aim[0]==='tip'?.12:e.aim[0]==='bow'?.18:.05, post=e.aim[0]==='tip'||e.aim[0]==='bow'?.22:.16;
    const w=t<=te?smooth(clamp((t-(te-e.pre))/e.pre,0,1)):1-smooth(clamp((t-te-hold)/post,0,1));
    if(w>bw){bw=w;best=e;} }
  const v=fin?f.victim:at, c=a.c;
  // motion warping: steer the root (position, facing, hip height) so the authored strike lands on its part
  if(next){ const left=next.t-a.t, win=Math.min(.5,next.t-prevT);
    const T=left<=win&&next.aim[0]!=='bow'?aimTarget(u,v,next.aim[0],next.aim[1],_wT):null;
    if(T){ const by=next.aim[0], s=u.s;
      let ahead=(evalClip(c,next.t).fwd-evalClip(c,a.t).fwd)*s*(fin?1:(u.fwdScale||1)); if(fin&&u.finApproach&&a.t<u.finHitT) ahead+=u.finApproach*(1-smooth(clamp(a.t/u.finHitT,0,1)));
      _wR.copy(u.pos).addScaledVector(_pf.set(Math.sin(u.face),0,Math.cos(u.face)),ahead); _wR.y=u.pos.y;
      const k=Math.min(1,dt/Math.max(left,dt));
      let P=predictStrike(u,c,next.t,by,_wR,_wP);
      const ph=Math.hypot(P.x-_wR.x,P.z-_wR.z), th=Math.hypot(T.x-_wR.x,T.z-_wR.z);
      if(ph>.3*s&&th>.3*s){ const da=wrapA(Math.atan2(T.x-_wR.x,T.z-_wR.z)-Math.atan2(P.x-_wR.x,P.z-_wR.z)); u.face=wrapA(u.face+clamp(da*k,-7*dt,7*dt)); P=predictStrike(u,c,next.t,by,_wR,_wP); }
      let ex=T.x-P.x, ez=T.z-P.z;
      // after lining up, the limb still has to reach any height difference: step in further if it can't
      _pd.copy(_pH).add(_aimT.subVectors(T,P)).sub(_pS); _pd.x-=ex; _pd.z-=ez; const dl=_pd.length();
      if(dl>_pReach){ const f2=1-_pReach/dl; ex+=_pd.x*f2; ez+=_pd.z*f2; }
      const m=Math.hypot(ex,ez);
      const body=BODY_BLOW[by], cap=(fin?1:body?1.5:.45)*s;
      if(u.warpE!==next){ u.warpE=next; u.warpAcc=0; }
      if(m>.03*s&&u.warpAcc<cap){ const mv=Math.min(m*k,(body&&!fin?7:5)*dt,cap-u.warpAcc); u.pos.x+=ex/m*mv; u.pos.z+=ez/m*mv; u.warpAcc+=mv; }
      // low targets: sink the hips (the arm takes up to ~20cm itself)
      u.aimDyT=clamp(T.y-P.y+(body&&by!=='hL'&&by!=='foot'?.04:.2)*s,-.42*s,0)*smooth(clamp(1-left/win,0,1)); } }
  else if(!best) u.aimDyT=0;
  // never walk into the victim: keep feet and upper bodies apart (the whole finisher, not just the warp window)
  if(!fin){}
  else if(v.alive){ const ss=u.s+v.s;
    const us=u.s, vs=v.s;
    for(const [a2,b2,mind] of [[u.pos,v.pos,.3*ss],[u.j.chest,v.j.chest,.12*ss+.1],[u.j.head,v.j.head,.2*ss+.02],[u.j.head,v.j.chest,.19*us+.12*vs+.05],[u.j.chest,v.j.head,.12*us+.19*vs+.05]]){
      const dx=a2.x-b2.x, dz=a2.z-b2.z, dd=Math.hypot(dx,dz); if(dd<mind){ const fx=dd>1e-4?dx/dd:-Math.sin(u.face), fz=dd>1e-4?dz/dd:-Math.cos(u.face), k2=(mind-dd)*.6; u.pos.x+=fx*k2; u.pos.z+=fz*k2; } } }
  else { const dx=u.pos.x-v.j.pelvis.x, dz=u.pos.z-v.j.pelvis.z, dd=Math.hypot(dx,dz), mind=.28*u.s; if(dd<mind&&dd>1e-4){ u.pos.x=v.j.pelvis.x+dx/dd*mind; u.pos.z=v.j.pelvis.z+dz/dd*mind; } }
  if(!best||bw<.002) return;
  const T=aimTarget(u,v,best.aim[0],best.aim[1],new V3()); if(!T) return;
  u.aim={by:best.aim[0],T,w:bw,e:best};
}
// last few centimetres the look-ahead missed: lean the step in toward a target the limb can't quite reach
function residualStep(u,dir,frac,w,dt){
  if(w<.4||dir.x*u.fwdW.x+dir.z*u.fwdW.z<=0) return;
  const k=Math.min(1,dt*16)*frac*w; u.residX=(u.residX||0)+dir.x*k; u.residZ=(u.residZ||0)+dir.z*k; }
// called inside buildSkel once the pose's hand targets and weapon direction are known
function applyAim(u,dt,p){
  const A=u.aim, s=u.s, j=u.j, w=A.w, T=A.T, by=A.by, reach=(u.T.armReach||.62)*s;
  if(by==='tip'||by==='blade'||by==='pick'||by==='pommel'){
    const H0=u.hand.R, sh=j.sR; _aimQ.copy(u.wRw);
    if(by==='tip'){ _aimD.subVectors(T,sh).normalize(); u.wRw.lerp(_aimD,.55).normalize(); }
    // hand position that puts the strike point on the target with this weapon direction
    j.hR.copy(H0); strikePoint(u,by,_aimP,T); const Hd=_aimH.copy(H0).add(_aimT.subVectors(T,_aimP));
    // beyond arm's reach: hold the hand at full stretch and turn the weapon to bridge the gap
    _aimD.subVectors(Hd,sh); const d=_aimD.length();
    if(d>reach){ const ex=d-reach; residualStep(u,_aimD,ex/d,w,dt); Hd.copy(sh).addScaledVector(_aimD,reach/d);
      if(by!=='pommel'){ _aimD.subVectors(T,Hd); if(by==='pick'){ _aimX.crossVectors(u.wRw,u.rightW).normalize(); _aimD.addScaledVector(_aimX,-.34*s*(u.pickSg||1)); }
        const L=_aimD.length(); if(L>1e-4) u.wRw.lerp(_aimD.multiplyScalar(1/L),clamp(ex/(.15*s),0,1)).normalize(); } }
    H0.lerp(Hd,w); _aimQ.lerp(u.wRw,w); u.wRw.copy(_aimQ.normalize());
  } else if(by==='bow'){ // bow arm points the bow at the body, the draw hand rides the arrow line behind it
    _aimD.subVectors(T,j.sL).normalize(); _aimH.copy(j.sL).addScaledVector(_aimD,.6*s); u.hand.L.lerp(_aimH,w); u.wLw.lerp(_aimD,w).normalize();
    _aimH.copy(u.hand.L).addScaledVector(_aimD,-(.16+.42*clamp(p.draw||0,0,1))*s); u.hand.R.lerp(_aimH,w*.85);
  } else if(by==='hL'){ const H0=u.hand.L, rl=u.type==='spear'?.42*s:reach; _aimD.subVectors(T,j.sL); const d=_aimD.length(); _aimH.copy(T); if(d>rl){ residualStep(u,_aimD,(d-rl)/d,w,dt); _aimH.copy(j.sL).addScaledVector(_aimD,rl/d); } H0.lerp(_aimH,w); }
  else if(by==='foot'){ _aimD.subVectors(T,j.hipR); const d=_aimD.length(); if(d>.88*s) residualStep(u,_aimD,(d-.88*s)/d,w,dt); }
}

function normClip(raw,idle,name){
  const keys=[]; let prev=fillPose(idle,null); prev.fwd=0; prev.jump=0; prev.draw=0; prev.pR=null; prev.pL=null;
  for(const k of raw.keys){
    const base=k.rest?Object.assign(fillPose(idle,null),{fwd:prev.fwd,jump:0,draw:0,kick:0,yaw:0,pR:null,pL:null}):prev;
    const o=fillPose(k,base); o.t=k.t; o.e=k.e||'io'; keys.push(o); prev=o;
  }
  return {name,keys,dur:keys[keys.length-1].t,ev:(raw.ev||[]).slice().sort((a,b)=>a.t-b.t),loop:!!raw.loop,aim:!!raw.aim,idle:!!raw.idle,atk:!!raw.atk,alt:!!raw.alt,hitT:((raw.ev||[]).find(e=>['hit','fire','kill','grab','knock','jolt'].includes(e.e))||{}).t};
}
const CLIPS={};
for(const t in TYPES){CLIPS[t]={}; const idle=POSES[t].idle; for(const src of [RAW.common,RAW[t]]) for(const n in src) CLIPS[t][n]=normClip(src[n],idle,n);}
function evalClip(c,t){const K=c.keys; if(t<=K[0].t) return K[0];
  for(let i=0;i<K.length-1;i++){const a=K[i],b=K[i+1]; if(t<=b.t) return lerpPose(a,b,EASE[b.e]((t-a.t)/Math.max(1e-4,b.t-a.t)));}
  return K[K.length-1];}

