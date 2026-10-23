/* ---------------- unit update ---------------- */
function updateUnit(u,dt){
  if(!u.desired) u.desired=new V3();
  u.cdT-=dt; if(!NET.guest) moraleTick(u,dt); if(u.st) updateStatus(u,dt); if(!u.alive) return;
  if(u.defQ){ u.defQ.t-=dt; if(u.defQ.t<=0){ const q=u.defQ; u.defQ=null;
      if((!u.action||u.action.c.idle)&&u.state!=='stunned'&&q.from.alive){ play(u,q.kind); u.fwdScale=1; u.atkTarget=q.from; u.faceGoal=Math.atan2(q.from.pos.x-u.pos.x,q.from.pos.z-u.pos.z); } } }
  if(u.state==='stunned'){ u.desired.set(0,0,0); if(u.stunBy) u.faceGoal=Math.atan2(u.stunBy.pos.x-u.pos.x,u.stunBy.pos.z-u.pos.z); if(!u.stunBy||!u.stunBy.alive||!u.stunBy.fin) unstun(u); }
  else if(!u.action) brain(u,dt);
  else if(u.action.c.idle){ const keep=u.action; u.action=null; brain(u,dt); if(!u.action&&Math.hypot(u.desired.x,u.desired.z)<.35) u.action=keep; }
  else { u.desired.set(0,0,0); if(u.atkTarget&&u.atkTarget.isUnit&&u.atkTarget.alive&&!u.fin) u.faceGoal=Math.atan2(u.atkTarget.pos.x-u.pos.x,u.atkTarget.pos.z-u.pos.z); }
  if(!u.action&&u.state==='ok'&&!u.routing&&!u.defQ&&!u.script&&!u.fin&&u.spd<.15&&Math.hypot(u.desired.x,u.desired.z)<.1&&u.isUnit){
    u.idleT=(u.idleT===undefined?rand(1.5,6):u.idleT)-dt;
    if(u.idleT<=0){ u.idleT=rand(4,10); if(!nearestEnemy(u,9)&&!(game.mode==='duel'&&game.duel&&game.duel.q)){ const L=(u.T.wild&&IDLES_WILD[u.type])||IDLES[u.type]; play(u,L[Math.floor(Math.random()*L.length)]); u.fwdScale=0; } }
  }
  if(u.type==='sword'&&!game.classicMix&&game.mode==='battle'&&!NET.guest) rageTick(u,dt);
  if(u.rootT>game.time) u.desired.set(0,0,0); else if(u.spurT>game.time) u.desired.multiplyScalar(1.4); else if(u.rallyT>game.time) u.desired.multiplyScalar(1.12);
  if(u.slowT>game.time) u.desired.multiplyScalar(.65);   // a wyvern's screech (27f)
  if(u.T.crawler) crawlerTick(u,dt);   // Rage research (never in the classic battle)
  if(u.T.chaos) chaosTick(u,dt);       // Infernal Regeneration, glows
  const acc=u.T.acc||(u.type==='giant'?3:9);
  if(MAP.obst&&!u.inCastle&&!u.garrison&&!isAir(u)){ mapWade(u); mapSteer(u,dt); }   // Riverlands: wading slows, obstacles are walked round (37d)
  u.vel.lerp(u.desired,1-Math.exp(-dt*acc));
  u.last.copy(u.pos);
  u.pos.addScaledVector(u.vel,dt);
  // turning
  const turn=(u.action&&!u.fin?.35:1)*u.T.turn, da=wrapA(u.faceGoal-u.face), step=clamp(da*(1-Math.exp(-dt*turn*.9)),-turn*dt,turn*dt);
  if(!(u.fin&&u.action)) { u.face=wrapA(u.face+step); }
  u.turnV=lerp(u.turnV||0,step/Math.max(dt,1e-4),.2);
  updateAction(u,dt);
  if(!u.alive) return;
  if(NET.guest&&u.net) netPuppetCorrect(u,dt);   // keep a replicated soldier on the host's track
  updateFinAim(u,dt); updateCharge(u,dt);
  if(!u.inCastle&&!u.garrison){ u.pos.x=clamp(u.pos.x,MAP.fx0,MAP.fx1); u.pos.z=clamp(u.pos.z,MAP.fz0,MAP.fz1); if(MAP.obst&&!isAir(u)) mapCollide(u); } u.pos.y=groundAt(u,u.pos.x,u.pos.z);
  const rv=_tmp.subVectors(u.pos,u.last).multiplyScalar(1/Math.max(dt,1e-4)); rv.y=0;
  const prevF=u.av.x*Math.sin(u.face)+u.av.z*Math.cos(u.face);
  u.av.lerp(rv,1-Math.exp(-dt*12)); u.spd=Math.hypot(u.av.x,u.av.z);
  const nowF=u.av.x*Math.sin(u.face)+u.av.z*Math.cos(u.face);
  u.accF=lerp(u.accF||0,(nowF-prevF)/Math.max(dt,1e-4),.15);
  if(u.fl) updateFly(u,dt);
  if(u.T.crawler) buildCrawlSkel(u,filterPose(u,computeCrawlPose(u),dt),dt);
  else buildSkel(u,filterPose(u,computePose(u),dt),dt);
  updateGear(u);
}
// shoulder charges, headbutts, shield shoves and kicks need the bodies to actually meet
const BODY_BLOW={hL:1,head:1,shoulder:1,foot:1,pommel:1,tail:1};
function bodyBlow(a,b){ return !!(a.aim&&BODY_BLOW[a.aim.by]&&a.atkTarget===b); }
function separate(){
  gridBuild();
  for(let i=0;i<units.length;i++){ const a=units[i]; if(!a.alive) continue; const ia=gI(a.pos.x), ja=gJ(a.pos.z);
    for(let gj=Math.max(0,ja-1);gj<=Math.min(GNZ-1,ja+1);gj++) for(let gi=Math.max(0,ia-1);gi<=Math.min(GNX-1,ia+1);gi++){ const cell=gridCells[gj*GNX+gi];
    for(let k=0;k<cell.length;k++){ const b=cell[k]; if(b===a||!b.alive||b.id<a.id) continue;
      if(isAir(a)!==isAir(b)) continue;   // a flyer passes over soldiers on the ground
      const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,d2=dx*dx+dz*dz,min=(a.s+b.s)*(a.team===b.team?.58:(bodyBlow(a,b)||bodyBlow(b,a)?.26:.42))*(a.fl&&b.fl&&a.fl.air&&b.fl.air?2.2:1); if(d2>=min*min||d2<1e-8) continue;
      const d=Math.sqrt(d2),pen=(min-d), fa=(a.fin||a.state==='stunned'||!a.isUnit)?0:b.s*b.s, fb=(b.fin||b.state==='stunned'||!b.isUnit)?0:a.s*a.s, ft=fa+fb; if(!ft) continue;
      const nx=dx/d,nz=dz/d; a.pos.x-=nx*pen*fa/ft; a.pos.z-=nz*pen*fa/ft; b.pos.x+=nx*pen*fb/ft; b.pos.z+=nz*pen*fb/ft; } } }
}

/* ---------------- drawing ---------------- */
const _fq=new THREE.Quaternion(),_fz=new V3(0,0,1),_fp=new V3(),_ff=new V3();
// Bold Stick Empire build: thick tapered limbs, broad torso, big round head, rounded boot-shaped feet.
const _vb=new V3();
function drawFigure(j,s,col,thick,fwd,set,robe,skel){
  const rl=.068*s*thick, ra=rl*.86, rt=rl*1.45, LI=set?set.limb:limbIM, TO=set?set.torso:torsoIM, SP=set?set.sph:sphIM, JO=set?set.joint:jointIM;
  if(skel){ drawSkeleton(j,s,col,fwd,LI,SP,JO); return; }
  cyl(j.pelvis,j.chest,rt,col,TO); cyl(j.chest,j.neck,rt,col,LI);
  sph(j.pelvis,rt*.8,col,JO); sph(j.chest,rt,col,JO); sph(j.neck,rt*.84,col,JO);
  sph(j.head,.19*s*Math.min(1.08,.92+thick*.08),col,SP);
  for(const [sh,el,ha] of [[j.sL,j.eL,j.hL],[j.sR,j.eR,j.hR]]){
    cyl(sh,el,ra,col,LI); sph(el,ra*.86,col,JO); cyl(el,ha,ra*.86,col,LI); sph(ha,ra*.98,col,JO); }
  _ff.set(fwd?fwd.x:0,0,fwd?fwd.z:1); if(_ff.lengthSq()<1e-4)_ff.set(0,0,1); _ff.normalize(); _fq.setFromUnitVectors(_fz,_ff);
  for(const [hp,kn,ft] of [[j.hipL,j.kL,j.fL],[j.hipR,j.kR,j.fR]]){
    if(!robe){ cyl(hp,kn,rl,col,LI); sph(kn,rl*.86,col,JO); cyl(kn,ft,rl*.86,col,LI); }
    _fp.copy(ft).addScaledVector(_ff,.05*s); _fp.y-=.012*s;
    _s.set(rl*1.05,rl*.72,rl*1.75); _m.compose(_fp,_fq,_s); put(JO,col); }
}
// a walking skeleton (the Soul Harvester): a thin column of vertebrae instead of a torso, collarbones, a hip bar and
// thin bones with knobbed joints. The rib cage, pelvis and shroud are gear (27b) that follow the spine.
function drawSkeleton(j,s,col,fwd,LI,SP,JO){
  const rb=.02*s, rk=.03*s;
  cyl(j.pelvis,j.neck,.015*s,col,LI); cyl(j.neck,j.head,.014*s,col,LI);
  for(let k=1;k<=8;k++){ _vb.copy(j.pelvis).lerp(j.neck,k/9); sph(_vb,.023*s,col,JO); }
  sph(j.neck,.021*s,col,JO); sph(j.pelvis,.03*s,col,JO);
  sph(j.head,.14*s,col,SP);
  cyl(j.sL,j.sR,.013*s,col,LI);
  for(const [sh,el,ha] of [[j.sL,j.eL,j.hL],[j.sR,j.eR,j.hR]]){
    sph(sh,rk,col,JO); cyl(sh,el,rb,col,LI); sph(el,rk*.85,col,JO); cyl(el,ha,rb*.8,col,LI); sph(ha,rk*.9,col,JO); }
  cyl(j.hipL,j.hipR,.017*s,col,LI);
  _ff.set(fwd?fwd.x:0,0,fwd?fwd.z:1); if(_ff.lengthSq()<1e-4)_ff.set(0,0,1); _ff.normalize(); _fq.setFromUnitVectors(_fz,_ff);
  for(const [hp,kn,ft] of [[j.hipL,j.kL,j.fL],[j.hipR,j.kR,j.fR]]){
    sph(hp,rk,col,JO); cyl(hp,kn,rb*1.1,col,LI); sph(kn,rk*.95,col,JO); cyl(kn,ft,rb*.9,col,LI);
    _fp.copy(ft).addScaledVector(_ff,.05*s); _fp.y-=.012*s; _s.set(rk*1.15,rk*.6,rk*2.3); _m.compose(_fp,_fq,_s); put(JO,col); }
}
const BAR_BG=new THREE.Color('#121212'), _cr=new V3(), _cb=new V3(), _bp=new V3();
function drawBar(u){
  const frac=clamp(u.hp/u.maxHp,0,1), W=.62*Math.sqrt(u.s), h=.075;
  _bp.copy(u.j.head).addScaledVector(UP,.45*u.s);
  _s.set(W+.05,h+.05,1); _m.compose(_bp,camera.quaternion,_s); put(barIM,BAR_BG);
  const w=Math.max(.001,W*frac); _bp.addScaledVector(_cr,-(W-w)/2).addScaledVector(_cb,.01);
  _s.set(w,h,1); _m.compose(_bp,camera.quaternion,_s); put(barIM,u.routing?ROUT_C:TEAM[u.team].bar);
  if(game.mode==='battle'&&u.morale<99){ // thin gold morale strip
    const mw=Math.max(.001,W*u.morale/100); _bp.copy(u.j.head).addScaledVector(UP,.45*u.s-.085).addScaledVector(_cr,-(W-mw)/2).addScaledVector(_cb,.01);
    _s.set(mw,.035,1); _m.compose(_bp,camera.quaternion,_s); put(barIM,MORALE_C); }
}
const ROUT_C=new THREE.Color('#f2f2f2'), MORALE_C=new THREE.Color('#e9b949');
function drawDebug(u){
  const s=u.s;
  for(const ft of u.feet){ sph(ft.t>=0?ft.to:ft.pos,.06*s,ft.t>=0?DBG.step:DBG.plant,dbgIM); }
  sph(u.hand.R,.05*s,DBG.hand,dbgIM); sph(u.hand.L,.05*s,DBG.hand,dbgIM);
  sph(u.j.kL,.035*s,DBG.pole,dbgIM); sph(u.j.kR,.035*s,DBG.pole,dbgIM);
}

