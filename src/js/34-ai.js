// Crimson general: masses an army in formation, charges when strong, falls back to the line when beaten.
function enemyCommander(dt){
  if(game.tutorial||NET.on) return;   // online, both armies are commanded by people
  game.aiT-=dt; if(game.aiT>0) return; game.aiT=2;
  aiResearch(1); if(game.demo) aiResearch(0);
  const power=t=>units.filter(u=>u.alive&&u.team===t&&u.isUnit&&!u.T.worker&&!u.routing).reduce((a,u)=>a+u.T.cost/econ(t),0);
  const mine=power(1), theirs=power(0), st=game.stance[1];
  const threat=units.some(u=>u.alive&&u.team===0&&!u.T.worker&&u.pos.x>14);
  game.bt=(game.bt||0)+2;   // seconds since the battle began (this runs every 2s)
  const full=count(1)>=Math.min(POP_CAP*.9,Math.max(24,BATTLE_SIZES[game.size].start*1.15))&&game.bt>20;
  if(st!=='charge'&&(mine>Math.max(1500,theirs*1.25)||full||(threat&&mine>theirs))) { setStance(1,'charge'); if(game.mode==='battle'&&!game.demo){ showBanner(teamName(1).split(' ').pop()+' charges!','',1.4); sfx('hornEnemy'); }
    const archers=regs.filter(r=>r.team===0&&r.type==='archer'&&regAlive(r).length);
    for(const r of regs) if(r.team===1&&r.type==='sword'&&archers.length&&Math.random()<.45) r.order={kind:'attack',target:archers[Math.floor(Math.random()*archers.length)]}; }
  else if(st==='charge'&&mine<theirs*.6&&!full){ setStance(1,'defend'); for(const r of regs) if(r.team===1) r.order={kind:'army'}; }
}
// the nearest enemy on foot within r, by plain distance (nearestEnemy's crowd penalty would hide one already brawling with our own)
function closeThreat(u,r){ let best=null, bd=r*r;
  gridEach(u.pos.x,u.pos.z,r,o=>{ if(!o.alive||o.team===u.team||isAir(o)||!canTarget(u,o)) return; const dx=o.pos.x-u.pos.x,dz=o.pos.z-u.pos.z,d=dx*dx+dz*dz; if(d<bd){ bd=d; best=o; } });
  return best; }
function brain(u,dt){
  if(NET.guest&&u.net){ netPuppet(u,dt); return; }   // online guest: the host's snapshots steer this soldier
  u.desired.set(0,0,0);
  if(u.script){ const sc=u.script, w=sc.pts[sc.i]; const dx=w.x-u.pos.x,dz=w.z-u.pos.z,d=Math.hypot(dx,dz);
    if(d<.6){ sc.i++; if(sc.i>=sc.pts.length){ u.script=null; if(sc.then) sc.then(u); return; } }
    u.desired.set(dx/d*sc.speed,0,dz/d*sc.speed); u.faceGoal=sc.face&&sc.face.alive?Math.atan2(sc.face.pos.x-u.pos.x,sc.face.pos.z-u.pos.z):Math.atan2(dx,dz); return; }
  if(!u.ai) return;
  if(u.state==='stunned') return;
  if(u.T.brain&&u.T.brain(u,dt)) return;
  u.retarget-=dt;
  if(u.retarget<=0||(u.target&&(!u.target.alive||u.target.state==='stunned'))){ u.target=nearestEnemy(u); const far=u.target?Math.hypot(u.target.pos.x-u.pos.x,u.target.pos.z-u.pos.z):99; u.retarget=(far>18?.9:.3)+Math.random()*.25; }
  if(u.routing){ // fleeing back to the statue, arms flailing
    const gx=BASE_X[u.team]+DIRX[u.team]*3, dx=gx-u.pos.x, dz=-u.pos.z*.3, d=Math.hypot(dx,dz)||1, sp=u.T.speed*1.1;
    u.desired.set(dx/d*sp,0,dz/d*sp); u.faceGoal=Math.atan2(dx,dz); return; }
  if(u.T.worker){ const near=u.target&&Math.hypot(u.target.pos.x-u.pos.x,u.target.pos.z-u.pos.z)<4.5; if(!near){ minerLogic(u,dt); return; } }
  const ro=u.reg&&game.mode==='battle'?u.reg.order:null;
  // a caster with a blade (the Soul Harvester) turns on whoever gets within arm's reach, unless ordered to move
  if(u.T.meleeR&&!(ro&&ro.kind==='move')){ const th=closeThreat(u,u.T.meleeR); if(th){ u.target=th; const dx=th.pos.x-u.pos.x,dz=th.pos.z-u.pos.z; return fightBrain(u,th,dx,dz,Math.hypot(dx,dz)||1e-3); } }
  if(ro&&(ro.kind==='move'||ro.kind==='hold'||ro.kind==='attack')&&regBrain(u,ro)) return;
  const st=ro&&ro.kind==='charge'?'charge':(game.mode==='battle'?game.stance[u.team]:'charge');
  if(st!=='charge'&&!u.T.worker&&u.slot){
    const ranged=u.T.ranged, sl=u.slot, guard=ranged?u.T.range:7.5, leash=ranged?3:11;
    u.sfT=(u.sfT||0)-dt; if(u.sfT<=0||u.sFoe&&!u.sFoe.alive){ u.sfT=.25+Math.random()*.1; u.sFoe=nearestFoe(sl.x,sl.z,u.team,ranged?guard+4:guard+.5,u); }
    const foe=u.sFoe&&u.sFoe.alive?u.sFoe:null, fd=foe?Math.hypot(foe.pos.x-sl.x,foe.pos.z-sl.z):1e9;
    const fromSlot=Math.hypot(u.pos.x-sl.x,u.pos.z-sl.z);
    if(foe&&fd<guard&&fromSlot<leash){ u.target=foe; const dx=foe.pos.x-u.pos.x,dz=foe.pos.z-u.pos.z; return fightBrain(u,foe,dx,dz,Math.hypot(dx,dz)||1e-3); }
    if(foe&&ranged&&fromSlot<1.5){ const dx=foe.pos.x-u.pos.x,dz=foe.pos.z-u.pos.z,d=Math.hypot(dx,dz); if(d<u.T.range+4){ u.target=foe; u.faceGoal=Math.atan2(dx,dz);
      if(d<u.T.range&&!u.action&&u.cdT<=0&&Math.abs(wrapA(u.faceGoal-u.face))<.4) startAttack(u,foe); return; } }
    const dx=sl.x-u.pos.x,dz=sl.z-u.pos.z,d=Math.hypot(dx,dz);
    if(d>.35){ const sp=u.T.speed*clamp(d/1.6,.25,1)*(d>6?1:.8); u.desired.set(dx/d*sp,0,dz/d*sp); u.faceGoal=d>1.2?Math.atan2(dx,dz):(u.team===0?Math.PI/2:-Math.PI/2); }
    else u.faceGoal=u.team===0?Math.PI/2:-Math.PI/2;
    return;
  }
  u.mining=false;
  let t=u.target, gx,gz,range;
  if(t){ gx=t.pos.x; gz=t.pos.z; range=u.T.range+t.s*.25+u.s*.15; }
  else { const st=statues[1-u.team]; if(!st||st.hp<=0) return; t=st; gx=st.pos.x+(u.team?2.4:-2.4)+ (u.T.ranged?(u.team?10:-10):0); gz=st.pos.z+u.zoff*.5; range=u.type==='archer'?1.5:.8; }
  const dx=gx-u.pos.x,dz=gz-u.pos.z,d=Math.hypot(dx,dz)||1e-3;
  if(t.isUnit){ return fightBrain(u,t,dx,dz,d); }
  if(d>range){ const sp=u.T.speed; u.desired.set(dx/d*sp,0,dz/d*sp); u.faceGoal=Math.atan2(dx,dz); }
  else{
    const ax=(t.isStatue?t.pos.x:gx)-u.pos.x, az=(t.isStatue?t.pos.z:gz)-u.pos.z; u.faceGoal=Math.atan2(ax,az);
    if(u.T.ranged&&!u.fl&&t.isUnit&&d<2.2&&!canFinish(u,t)){ u.desired.set(-dx/d*u.T.speed*.8,0,-dz/d*u.T.speed*.8); return; }
    if(!u.action&&u.cdT<=0&&Math.abs(wrapA(u.faceGoal-u.face))<.5) startAttack(u,t);
  }
}
// Real-fight footwork: hold a fighting distance, circle while waiting, lunge in to strike, then back off.
function fightBrain(u,t,dx,dz,d){
  const T=u.T, nx=dx/d, nz=dz/d, sp=T.speed;
  let eng=T.engage+(t.s-1)*.6+(u.s-1)*.3;
  // only two fighters press an enemy at once; the rest wait their turn a step further back
  let rank=0; if(!u.T.ranged&&t.atk) for(const o of t.atk){ if(o===u||!o.alive||o.team!==u.team||o.target!==t) continue;
    if(Math.hypot(t.pos.x-o.pos.x,t.pos.z-o.pos.z)<d-.05) rank++; }
  const lim=T.swarm?4:2, waiting=rank>=lim; if(waiting) eng+=1.5+(rank-lim)*.6;   // a swarm surrounds its prey four at a time
  u.faceGoal=Math.atan2(dx,dz);
  if(T.ranged){
    if(T.meleeR&&!isAir(t)&&d<T.meleeR+(t.s-1)*.4){   // too close to cast: stand and fight with the blade
      const eg=T.reach+.5+(t.s-1)*.35;
      if(d>eg+.25) u.desired.set(nx*sp*.6,0,nz*sp*.6); else if(d<eg*.7) u.desired.set(-nx*sp*.4,0,-nz*sp*.4);
      if(!u.action&&u.cdT<=0&&Math.abs(wrapA(u.faceGoal-u.face))<.45){ startAttack(u,t); if(u.action&&!u.fin) u.cdT=Math.min(u.cdT,T.meleeCd*rand(.85,1.15)); }
      return;
    }
    if(d>T.range){ u.desired.set(nx*sp,0,nz*sp); return; }
    if(d<(T.kite||4.5)&&!(d<2.6&&canFinish(u,t))){ u.desired.set(-nx*sp*.85,0,-nz*sp*.85); if(d<2.2) return; }
    if(!u.action&&u.cdT<=0&&Math.abs(wrapA(u.faceGoal-u.face))<.4) startAttack(u,t);
    return;
  }
  if(d>eng+.35){ // close in, slowing as we reach fighting distance
    const k=clamp((d-eng)/1.5,.35,1);
    if(T.swarm&&d<eng+4){ const a=((u.id*7)%9-4)*.2*clamp((d-eng)/3,0,1), ca=Math.cos(a), sa=Math.sin(a); u.desired.set((nx*ca+nz*sa)*sp*k,0,(nz*ca-nx*sa)*sp*k); }   // fan out round it
    else u.desired.set(nx*sp*k,0,nz*sp*k);
    if(!waiting&&d<eng+.8&&!u.action&&u.cdT<=0&&Math.abs(wrapA(u.faceGoal-u.face))<.35) startAttack(u,t);
    return;
  }
  const ready=!waiting&&!u.action&&u.cdT<=0&&Math.abs(wrapA(u.faceGoal-u.face))<.35;
  if(ready){ startAttack(u,t); return; }
  // footwork: keep the gap, side-step around the opponent
  const px=-nz, pz=nx, side=Math.sin(game.time*(.7+(u.id%5)*.13)+u.id*1.7);
  let bx=0,bz=0; if(d<eng*.85){ bx=-nx*sp*.6; bz=-nz*sp*.6; } else if(d>eng+.15){ bx=nx*sp*.3; bz=nz*sp*.3; }
  const strafe=sp*(u.type==='giant'?.12:.32);
  u.desired.set(bx+px*side*strafe,0,bz+pz*side*strafe);
}
function minerLogic(u,dt){
  const m=MINE[u.team];
  if(u.mstate==='toMine'){
    _goal.set(m.x+Math.cos(u.slot)*1.7,0,m.z+Math.sin(u.slot)*1.7);
    const dx=_goal.x-u.pos.x,dz=_goal.z-u.pos.z,d=Math.hypot(dx,dz);
    if(d<.35){ u.mstate='mining'; u.mineT=workerDig(u); }
    else { const sp=u.T.speed*clamp(d/1.2,.3,1); u.desired.set(dx/d*sp,0,dz/d*sp); u.faceGoal=Math.atan2(dx,dz); }
  } else if(u.mstate==='mining'){
    u.faceGoal=Math.atan2(m.x-u.pos.x,m.z-u.pos.z); u.mining=true;
    if(!u.action&&Math.abs(wrapA(u.faceGoal-u.face))<.4){ if(u.mineT<=0){ u.mstate='toBase'; u.carry=true; u.mining=false; } else { play(u,'mine'); u.fwdScale=0; } }
  } else {
    u.mining=false;
    _goal.set(BASE_X[u.team]+(u.team?-2.6:2.6),0,u.zoff*.3);
    const dx=_goal.x-u.pos.x,dz=_goal.z-u.pos.z,d=Math.hypot(dx,dz);
    if(d<.8){ u.carry=false; u.mstate='toMine'; if(game.mode==='battle'){ const g=workerYield(u); game.gold[u.team]+=g; onGold(u.team,g); if(u.team===0){ if(u.type==='thrall') crSfx('crystal','coin',u.pos,.8); else sfx('coin',u.pos,.8); } } }
    else { const sp=u.T.speed*.85; u.desired.set(dx/d*sp,0,dz/d*sp); u.faceGoal=Math.atan2(dx,dz); }
  }
}

