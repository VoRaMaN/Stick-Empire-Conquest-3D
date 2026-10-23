/* ---------------- combat ---------------- */
function meleeHit(u,t,e,dm){
  if(isAir(t)&&!u.fl) return 'miss';   // a blade can't reach a wing archer in the air
  const nm=t.action&&t.action.c.name, at=t.action?t.action.t:0;
  const dx=u.pos.x-t.pos.x,dz=u.pos.z-t.pos.z,d=Math.hypot(dx,dz)||1, facing=(dx*t.fwdW.x+dz*t.fwdW.z)/d>.2;
  const spark=guardPoint(t,new V3()), cp=e.part?partPoint(t,e.part,new V3()):t.j.chest.clone();
  if(nm==='dodge'&&at>.05&&at<.48){ puff(t.pos,2,.18,1); sfx('swing',t.pos,.6); return 'dodge'; }
  if(nm==='parry'&&facing&&at<.42&&u.type!=='giant'){ // deflected: attacker is thrown off balance, defender gets the next move
    puff(spark,7,.07,3.6,'#fff1b8'); shakeAt(spark,.08); game.hitstop=.06; sfx('parry',spark);
    play(u,'recoil'); u.fwdScale=1; u.cdT=1.1; t.cdT=0; return 'parry'; }
  let mul=1;
  if(nm==='block'&&facing){
    mul=u.type==='giant'?.45:(t.type==='spear'?.06:.14);
    puff(spark,5,.06,3,'#ffe9a8'); react(u,new V3(-dx/d,0,-dz/d).negate(),.5); sfx(t.type==='spear'?'shield':u.type==='giant'?'heavy':'clang',spark);
    t.vel.addScaledVector(new V3(-dx/d,0,-dz/d),1.6*(u.type==='giant'?2:1)/t.s);
    if(u.type==='giant'){ play(t,'flinch'); t.fwdScale=1; }
  }
  const tm=game.mode==='battle'?tacticMods(u,t,true):null;
  if(tm){ dm*=tm.mul; t.morale=Math.max(0,t.morale-tm.mor); if(tm.txt&&(mul===1||tm.txt==='Braced!')) callout(t,tm.txt,tm.col); }
  dm=hitMods(u,t,dm,mul);
  damage(t,dm*mul,u,null,(e.kb||1.2)*(mul<1?.45:1)*(tm?tm.kb:1),e.up,mul<1,cp);
  if(mul===1){ puff(cp,2,.12,1.5,'#f4ead6'); hitSfx(u,e,cp); }
  return mul<1?'block':'hit';
}
function react(t,dirW,mag){
  if(!t.alive) return; const dz=dirW.x*t.fwdW.x+dirW.z*t.fwdW.z, dx=dirW.x*t.rightW.x+dirW.z*t.rightW.z;
  const m=mag/Math.sqrt(t.s); t.rsz.v+=dz*6*m; t.rsx.v+=dx*5*m; t.headS.v+=dz*4*m;
  t.vel.addScaledVector(dirW,mag*.6/t.s);
}
function damage(t,amt,src,dirW,kb,up,blocked,at){
  if(!t.alive) return;
  if(RL.on&&src&&src.T&&src.T.ranged&&t.isUnit&&rlAvoid(t,src)) return;   // Riverlands: dodged or caught on the guard (37e)
  if(!dirW){ dirW=_tmp.subVectors(t.pos,src.pos); dirW.y=0; dirW.normalize(); dirW=dirW.clone(); }
  react(t,dirW,kb||1); if(t.fl) t.fl.vy-=Math.min(3,(kb||1)*.45);
  if(!blocked&&!t.action&&t.state!=='stunned'&&Math.random()<.5){ play(t,'flinch'); t.fwdScale=1; }
  if(!blocked&&amt>0) bleed(at||_tmp.copy(t.j.chest).lerp(t.j.neck,Math.random()).clone(),dirW.clone().setY(.25).normalize(),clamp(Math.round(amt/6),2,9),2.4,.55);
  if(!blocked&&amt>0&&t.T.crawler&&!t.T.horse) puff(at||t.j.chest,3,.09,2.6,'#ff7a2a');   // magma spills from a wounded Hellcrawler
  if(t.invuln||NET.guest) return;   // online guest: health only ever comes from the host
  if(amt>0) t.hurtAt=game.time;   // Chaos regeneration waits for the wounds to stop
  if(src&&src.team!==undefined&&src.team<2){ t.lastHitTeam=src.team; t.lastHitBy=src; }
  t.hp-=amt*(1-(t.T.armor||0))*(game.classicMix?1:resDamageMul(t,src)*vetDealt(src)*vetTaken(t)*formTaken(t,src))*(RL.on?rlDmgMul(src)*rlSysMul(t,src):1)*(game.classicMix?1:heroMul(t,src)); if(game.mode==='battle'&&!game.classicMix){ alertHit(t,src); fightMark(t); if(src&&src.team<2&&game.stats&&game.stats.dmg) game.stats.dmg[src.team]+=amt; } if(game.mode==='battle') t.morale=Math.max(0,t.morale-amt/t.maxHp*40);
  if(t.hp<=0){ kill(t,dirW.clone().multiplyScalar(2.5*(kb||1)).add(new V3(0,1.8+(kb||1)*.6+(up||0),0)),{}); }
}
function kill(t,impWorld,opt){
  if(!t.alive||(NET.guest&&!NET.allowKill)) return;
  shakeMorale(t); onKill(t);
  if(t.isUnit){ if(t.type==='giant') sfx('roar',t.j.head,.9,{rate:.8}); else if(t.T.horse) sfx('roar',t.j.head,.6,{rate:1.6}); else if(t.T.crawler) crSfx('crDie','roar',t.j.head,.85); else if(Math.random()<.75) sfx('death',t.j.head,.9,{rate:t.type==='miner'?1.08:1}); }
  if(t.fin&&t.fin.rag) releaseRag(t.fin.rag,new V3(0,0,0));
  if(t.fin&&t.fin.victim&&t.fin.victim.alive){ unstun(t.fin.victim); }
  t.fin=null; t.target=null;
  if(t.cr&&(t.T.horse||t.rider)) throwRider(t,impWorld);
  toRagdoll(t,impWorld,opt);
}
function unstun(v){ v.state='ok'; v.invuln=false; v.action=null; v.stunBy=null; }

function pickAttack(u,t){
  if(u.T.pick) return u.T.pick(u,t);
  const L=u.T.attacks;
  if(u.type==='archer'){ const d=t?Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z):99;
    const pool=d<2.4?ARCHER_MELEE:L.filter(n=>!ARCHER_MELEE.includes(n)); return pool[Math.floor(Math.random()*pool.length)]; }
  let n,g=0; do{ n=L[Math.floor(Math.random()*L.length)]; }while(n===u.lastAtk&&++g<5);
  return n;
}
// Charging: picks one of the unit's 10 charge styles when it breaks into a sprint at the enemy, and drops it
// when the charge is spent (the strike lands) or the order changes.
function updateCharge(u,dt){
  if(!u.isUnit) return;
  u.chgCD=Math.max(0,(u.chgCD||0)-dt);
  let mode=false;
  if(game.mode==='battle'&&u.state==='ok'&&!u.routing){ const ro=u.reg?u.reg.order:null; mode=ro&&ro.kind!=='army'?(ro.kind==='charge'||ro.kind==='attack'):game.stance[u.team]==='charge'; }
  else if(game.mode==='duel') mode=!!u.chgLab;
  const t=u.target, d=t&&t.isUnit&&t.alive?Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z):99, fast=u.spd>.5*u.T.speed;
  if(NET.guest){ const want=u.chg&&!u.action&&u.spd>.45*u.T.speed?1:0; u.chgW=(u.chgW||0)+(want-(u.chgW||0))*(1-Math.exp(-dt*7)); return; }   // the host picks the charge style
  if(mode&&!u.chg&&!u.chgCD&&fast&&!u.action&&d>3.5&&d<30&&(!u.T.worker||d<12)) u.chg={i:Math.floor(Math.random()*CHG[u.type].length)};
  if(u.chg&&!mode&&game.mode==='battle') u.chg=null;
  if(u.chg&&!u.action&&u.spd<.2*u.T.speed){ u.chgStop=(u.chgStop||0)+dt; if(u.chgStop>.8&&game.mode==='battle') u.chg=null; } else u.chgStop=0;
  const want=u.chg&&!u.action&&u.spd>.45*u.T.speed?1:0;
  u.chgW=(u.chgW||0)+(want-(u.chgW||0))*(1-Math.exp(-dt*7));
}
function startAttack(u,t,forced){
  const T=u.T, tUnit=t&&t.isUnit?t:null;
  if(!forced&&tUnit&&canFinish(u,tUnit)) return startFinisher(u,tUnit);
  // the blow at the end of a charge is the charge's own strike
  let cname=null; if(!forced&&u.chg&&tUnit){ const id='chg_'+CHG[u.type][u.chg.i].id; if(CLIPS[u.type][id]&&(T.ranged||u.spd>.4*T.speed||u.chgLab)) cname=id; }
  const name=forced||cname||pickAttack(u,t), c=CLIPS[u.type][name]; u.lastAtk=name;
  play(u,name); u.atkTarget=t; u.fwdScale=1;
  if((!T.ranged||T.meleeSet&&T.meleeSet.has(name))&&!T.noSwing&&c.hitT!==undefined) sfx(u.type==='giant'?'swingHeavy':'swing',u.pos,.8,{delay:Math.max(0,c.hitT-.14)}); u.charging=!!(t&&t.isUnit&&!T.ranged&&(u.spd>.55*T.speed||cname));
  if(cname){ u.chg=null; u.chgCD=1.5; u.chgW=0; }
  if(tUnit){ const d=Math.hypot(tUnit.pos.x-u.pos.x,tUnit.pos.z-u.pos.z), fwd=c.keys.reduce((m,k)=>Math.max(m,k.fwd),0)*u.s;
    u.fwdScale=fwd>0?clamp((d-(T.reach+(tUnit.s-1)*.35))/fwd,0,2.4):1;
    planDefense(tUnit,u,c); if(RL.on) ambushStart(u); if(RL.on&&T.ranged&&!(T.meleeSet&&T.meleeSet.has(name))) rlProjDefense(tUnit,u,c); }
  if(c.aim&&t){ const d=Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z); u.aimPitch=clamp(d*.018,0,.3);
    if(RL.on&&d>18){ const Tf=arrowT(d), up=.5*14*Tf/(d/Tf); u.aimPitch=clamp(up*.9,.3,1.05); } }   // a far shot: the bow points up into the sky
  u.cdT=T.cd*rand(.85,1.15)*(c.dur>1.2?1.12:1);
  if(T.swarm&&tUnit&&u.action) packFrenzy(u,tUnit);
}
// The defender reads the incoming blow and times a block, parry or dodge to meet it.
function planDefense(t,u,c){
  const h=c.ev.find(e=>e.e==='hit'); if(!h) return;
  if(!t.alive||t.state==='stunned'||t.fin||(t.action&&!t.action.c.idle)||t.defQ||t.routing) return;
  const lab=game.mode==='duel'&&game.duel&&t===game.duel.dum;
  if(t.ai===false&&!(lab&&game.duelDefend)) return;
  const o=DEF_ODDS[t.type]; let pb=o.block,pp=o.parry,pd=o.dodge;
  if(lab){ const sum=pb+pp+pd||1; pb=pb/sum*.9; pp=pp/sum*.9; pd=pd/sum*.9; }
  const r=Math.random(); let kind=r<pb?'block':r<pb+pp?'parry':r<pb+pp+pd?'dodge':null;
  if(!kind) return;
  if(u.type==='giant'&&kind==='parry') kind='block';
  const lead={block:.22,parry:.12,dodge:.2}[kind];
  t.defQ={kind,from:u,t:Math.max(0,h.t-lead)+rand(-.03,.03)};
}
function canFinish(u,t){
  if(game.mode==='duel') return false;
  if(game.finMode===0||!t.alive||t.state==='stunned'||t.fin||t.type==='giant'||t.invuln||t.fl) return false;
  if(u.T.ranged&&Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z)>(u.T.finR||1.9)) return false;
  const expected=u.T.dmg*(1-(t.T.armor||0));
  if(t.hp>expected*1.05) return false;
  return game.finMode===2||Math.random()<.4;
}
function startFinisher(u,v,forced){
  if(u.team<2){ v.lastHitTeam=u.team; v.lastHitBy=u; }   // the finisher's kill is his (veterans, camp gold)
  const list=FINS[u.type]; let name=forced;
  if(!name){ let g=0; do{ name=list[Math.floor(Math.random()*list.length)]; }while(name===u.lastFin&&++g<6); }
  u.lastFin=name;
  if(NET.host||NET.rec) netCapFin(u,v,name);
  NET.noCap++; try{ startFinisher0(u,v,name,list); } finally { NET.noCap--; }
}
function startFinisher0(u,v,name,list){
  const def=FIN[name], clip=CLIPS[u.type][def.clip], hitT=def.hitT!==undefined?def.hitT:clip.hitT;
  u.fin={victim:v,def,rag:null}; onFinisher(u);
  v.state='stunned'; v.invuln=true; v.stunBy=u; v.target=null; v.fin=null; v.defQ=null;
  play(v,def.victim||'stagger');
  const dx=v.pos.x-u.pos.x, dz=v.pos.z-u.pos.z, d=Math.hypot(dx,dz)||.01;
  u.face=u.faceGoal=Math.atan2(dx,dz); v.faceGoal=Math.atan2(-dx,-dz);
  // keep the authored footwork and add a smooth approach so the blow lands exactly at the contact distance
  const fHit=evalClip(clip,hitT).fwd*u.s;
  u.fwdScale=1; u.finApproach=(d-def.contact)-fHit; u.finHitT=Math.max(.05,hitT||.3);
  play(u,def.clip);
  u.cdT=u.T.cd;
  if(game.mode==='duel'||cam.follow===u||cam.follow===v){ showBanner(def.name,TYPES[u.type].name+' finisher · '+(list.indexOf(name)+1)+' of '+list.length); }
}
function play(u,name){ if(NET.guest&&!NET.allowPlay) return; const c=CLIPS[u.type][name]; if(!c) return; u.action={c,t:0,age:0,fired:0,prevFwd:0}; if((NET.host||NET.rec)&&!NET.noCap) netCapPlay(u,name); }

function updateAction(u,dt){
  const a=u.action; if(!a) return;
  a.t+=dt*(a.sp||1); a.age+=dt;
  const c=a.c;
  // root motion
  const f1=evalClip(c,Math.min(a.t,c.dur)).fwd; const sc=(c.hitT===undefined||a.t<=c.hitT+1e-3)?u.fwdScale:1; let df=(f1-a.prevFwd)*sc*u.s; a.prevFwd=f1;
  if(u.fin&&u.finApproach&&c.name===u.fin.def.clip){ const h=u.finHitT; df+=u.finApproach*(smooth(clamp(a.t/h,0,1))-smooth(clamp((a.t-dt)/h,0,1))); }
  if(df){ u.pos.x+=Math.sin(u.face)*df; u.pos.z+=Math.cos(u.face)*df; }
  while(a.fired<c.ev.length&&c.ev[a.fired].t<=a.t){ handleEvent(u,c.ev[a.fired]); a.fired++; if(u.action!==a) return; }
  if(a.t>=c.dur){
    if(c.loop){ a.t-=c.dur; a.fired=0; a.prevFwd=0; }
    else { u.action=null; if(u.fin){ u.fin=null; } }
  }
}
const _iw=new V3();
// where a finisher blow actually lands: the aimed part, else the victim part nearest the weapon
function hitPoint(u,v,e){
  if(e.part) return partPoint(v,e.part,new V3());
  const wp=strikePoint(u,'tip',new V3()); let best='chest',bd=1e9;
  for(const k of ['head','neck','chest','gut','thigh']){ const d=partPoint(v,k,_tmp2).distanceTo(wp); if(d<bd){bd=d;best=k;} }
  return partPoint(v,best,new V3()); }
function handleEvent(u,e){
  const f=NET.on&&!!u.fin; if(f){ NET.allowPlay++; NET.allowKill++; NET.noCap++; }
  try{ handleEvent0(u,e); } finally { if(f){ NET.allowPlay--; NET.allowKill--; NET.noCap--; } }
}
function handleEvent0(u,e){
  const T=u.T, fin=u.fin, v=fin&&fin.victim;
  if(e.fx) spellFx(u,e,v);
  switch(e.e){
    case 'hit':{
      if(u.mining){ const tip=_tmp.copy(u.j.hR).addScaledVector(u.wRw,.7*u.s); puff(tip,3,.08,2.2,u.type==='thrall'?'#ff5a3a':'#ffd34d'); u.mineT--; sfx('mine',tip,.6); break; }
      const t=u.atkTarget, dm=T.dmg*(e.dmg||1)*rand(.88,1.12);
      const aoe=e.aoe||(T.aoe&&!e.arc&&!e.single?1:0);
      if(aoe){
        const c=_tmp2.copy(u.pos).addScaledVector(u.fwdW,e.stomp?.75*u.s:2.1*u.s*.5+.9); c.y=H(c.x,c.z);
        const Rr=(T.aoe||1.6)*aoe;
        ring(c,Rr*1.3); puff(c,8,.5*Math.sqrt(aoe),3); shakeAt(c,.35*aoe); sfx('heavy',c,1.1);
        for(const o of units){ if(!o.alive||o.team===u.team||isAir(o)) continue; const d=Math.hypot(o.pos.x-c.x,o.pos.z-c.z);
          if(d<Rr+o.s*.3){ const nm=o.action&&o.action.c.name; if(nm==='dodge'&&o.action.t>.05) continue;
            const dir=new V3(o.pos.x-c.x,0,o.pos.z-c.z).normalize();
            const blk=nm==='block'&&(dir.x*o.fwdW.x+dir.z*o.fwdW.z)<-.2;
            if(blk) puff(o.j.chest,4,.07,3,'#ffe9a8');
            damage(o,dm*(d<1.2?1:.6)*(blk?.45:1),u,dir,(e.kb||3.2)*(blk?.6:1),e.up); } }
        const st=statues[1-u.team]; if(st&&Math.hypot(st.pos.x-c.x,st.pos.z-c.z)<3) hitStatue(st,dm);
        break; }
      if(e.arc){
        const Rr=T.reach+.75+(e.arc-1)*1.6+(e.tail?.9:0);
        for(const o of units){ if(!o.alive||o.team===u.team) continue; const dx=o.pos.x-u.pos.x,dz=o.pos.z-u.pos.z,d=Math.hypot(dx,dz)||1;
          if(d<Rr+(o.s-1)*.4&&(e.around||(dx*u.fwdW.x+dz*u.fwdW.z)/d*(e.tail?-1:1) >.25)){ const r=meleeHit(u,o,e,dm); if(r==='parry') break; if(e.cleave&&r!=='dodge'&&r!=='miss') cleaveHit(u,o); if(e.rend&&r==='hit') curse(o,u); } }
        if(e.cleave) cleaveFx(u);
        const st=statues[1-u.team]; if(st&&Math.hypot(st.pos.x-u.pos.x,st.pos.z-u.pos.z)<Rr+2) hitStatue(st,dm);
        break; }
      if(t&&t.isUnit){ if(t.alive&&Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z)<T.reach+.5+(t.s-1)*.5){ const r=meleeHit(u,t,e,dm); if(e.kd&&r==='hit') knockDown(t,u); if(e.rend&&r==='hit') curse(t,u); } }
      else if(t&&t.isStatue&&Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z)<4) hitStatue(t,dm);
      break; }
    case 'fire':{
      if(T.bolt){ fireBolts(u,e); break; }
      const t=u.atkTarget; if(!t) break;
      let aim;
      if(t.isUnit){ if(!t.alive) break; const dd=u.pos.distanceTo(t.pos); aim=t.j.chest.clone().addScaledVector(t.av,RL.on&&dd>18?arrowT(dd,e):clamp(dd/24,.16,1));   /* lead the target by the arrow's time in the air */ if(RL.on&&dd>15){ aim.x+=rand(-1,1)*dd*.012; aim.z+=rand(-1,1)*dd*.012; } }
      else aim=new V3(t.pos.x,t.pos.y+3.5,t.pos.z);
      const n=e.n||1, fireA=u.type==='archer'&&!game.classicMix&&hasRes(u.team,'fireArrows');
      for(let i=0;i<n;i++){ const off=(i-(n-1)/2)*(e.spread||0), dx=aim.x-u.pos.x, dz=aim.z-u.pos.z, c=Math.cos(off), sn=Math.sin(off);
        const a2=new V3(u.pos.x+dx*c+dz*sn,aim.y,u.pos.z-dx*sn+dz*c);
        fireArrow(u,a2,T.dmg*(e.dmg||1),null,{lob:e.lob,power:e.power,fire:fireA}); }
      sfx('bow',u.j.hL,.9); if(fireA) sfx('ignite',u.j.hL,.45);
      break; }
    case 'land':{ puff(u.pos,3,.22*u.s,1.4); sfx(u.s>1.5?'giantStep':'land',u.pos,.8); break; }
    case 'whoosh': break;
    case 'kill':{
      if(!v||!v.alive) break;
      const iw=impW(u,e.imp,new V3());
      const hi=e.headImp?impW(u,e.headImp,new V3()):null;
      const cp=hitPoint(u,v,e);
      v.invuln=false; kill(v,iw,{decap:e.decap,headImp:hi,spin:e.spin}); fin.rag2=v.rag;
      puff(cp,4,.18,2.4,'#f4ead6'); shakeAt(v.pos,e.shake||.1); bleed(cp,iw.clone().normalize(),14,3.2,.5); game.hitstop=.07; hitSfx(u,e,cp,1.1); sfx('finisher',cp,.9);
      if(e.ring){ const c=v.pos.clone(); ring(c,1.6*u.s); puff(c,8,.45,3); } break; }
    case 'jolt':{ // a blow that lands but doesn't kill yet
      if(!v||!v.alive) break;
      const dir=new V3(v.pos.x-u.pos.x,0,v.pos.z-u.pos.z).normalize(); react(v,dir,e.mag||1.5);
      const cp=hitPoint(u,v,e); puff(cp,3,.12,2,'#f4ead6'); shakeAt(v.pos,.05); hitSfx(u,e,cp,.9); if(e.aim&&e.aim[0]!=='hL'&&e.aim[0]!=='foot'&&e.aim[0]!=='pommel'&&u.type!=='giant') bleed(cp,dir,5,2,.4);
      if(e.victim) play(v,e.victim); break; }
    case 'victim':{ if(v&&v.alive) play(v,e.clip); break; }
    case 'stabRag':{ // strike a body that's already down (or held)
      const rg=(fin&&(fin.rag||fin.rag2))||(v&&v.rag); if(!rg) break;
      const pt=e.at==='foot'?u.j.fR.clone():strikePoint(u,e.aim?e.aim[0]:'tip',new V3());
      const iw=impW(u,e.imp,new V3());
      let ni=1,nd=1e9; if(e.part&&RAG_OF[e.part]!==undefined) ni=RAG_OF[e.part]; else rg.p.forEach((q,i)=>{const d=q.distanceTo(pt); if(d<nd){nd=d;ni=i;}});
      for(const vv of rg.v) vv.addScaledVector(iw,.35); rg.v[ni].add(iw); wakeRag(rg); bleed(rg.p[ni],UP,9,2.2,.6); game.hitstop=.05;
      puff(rg.p[ni],4,.14,2.4,'#f4ead6'); shakeAt(rg.p[ni],e.shake||.1); hitSfx(u,e,rg.p[ni],1);
      if(e.ring){ ring(rg.p[ni],1.4*u.s); puff(rg.p[ni],6,.4,3); } break; }
    case 'roar':{ shakeAt(u.pos,.12); puff(u.j.head,4,.25,2.5); sfx(u.type==='giant'?'roar':'warcry',u.j.head,u.type==='giant'?1:.35); break; }
    case 'knock':{
      if(!v||!v.alive) break; v.invuln=false; const cp=hitPoint(u,v,e); const rg=toRagdoll(v,impW(u,e.imp,new V3()),{}); fin.rag2=rg; if(e.aim&&e.aim[0]!=='foot'&&e.aim[0]!=='hL'||!e.aim) bleed(cp,u.fwdW,5,2,.5); puff(cp,3,.15,2); shakeAt(v.pos,.08); hitSfx(u,e,cp,1); break; }
    case 'execute':{
      const rg=fin&&(fin.rag2||(T.bolt&&fin.rag)); if(!rg) break;
      if(T.bolt){ fireArrow(u,rg.p[RAG_OF[e.part]!==undefined?RAG_OF[e.part]:1].clone(),0,{rag:rg},{from:crossbowTip(u,new V3())}); sfx('crossbow',u.j.hR,.9); break; }
      fireArrow(u,rg.p[RAG_OF[e.part]!==undefined?RAG_OF[e.part]:1].clone(),0,{rag:rg}); break; }
    case 'grab':{
      if(!v||!v.alive) break; v.invuln=false;
      const cp=hitPoint(u,v,e), rg=toRagdoll(v,new V3(),{}); fin.rag=rg; if(e.at!=='hL'&&e.at!=='tk') bleed(cp,u.fwdW,10,2.4,.5);
      const s=u.s, uu=u, by=e.aim?e.aim[0]:'tip';
      if(e.at==='tip'||e.at==='wtip') pinRag(rg,1,out=>strikePoint(uu,by,out));
      else if(e.at==='tk') pinRag(rg,1,out=>out.copy(uu.j.hL).addScaledVector(uu.fwdW,1.05*s).addScaledVector(UP,.1*s));
      else if(e.at==='jaw') pinRag(rg,2,out=>out.copy(uu.j.head).addScaledVector(uu.cr.hd,.06*s));
      else if(e.at==='tail') pinRag(rg,1,out=>out.copy(uu.cr.tailTip));
      else if(e.at==='haft') pinRag(rg,2,out=>out.copy(uu.j.hR).addScaledVector(uu.wRw,-.2*s));
      else pinRag(rg,1,out=>out.copy(uu.j.hL).addScaledVector(uu.spine,-.12*s));
      puff(cp,4,.16,2); shakeAt(v.pos,.1); hitSfx(u,e,cp,1); break; }
    case 'release':{
      if(fin&&fin.rag){ const rg=fin.rag; releaseRag(rg,impW(u,e.imp,new V3())); fin.rag2=rg; fin.rag=null; shakeAt(u.pos,e.shake||.1);
        if(e.slam){ const c=rg.p[1].clone(); c.y=H(c.x,c.z); ring(c,1.8*u.s); puff(c,10,.5,3.5); sfx('heavy',c,1.1); } } break; }
    default: if(EXTRA_EV[e.e]) EXTRA_EV[e.e](u,e,fin,v);
  }
}

