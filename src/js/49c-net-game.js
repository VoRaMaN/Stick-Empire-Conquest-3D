/* ================= Online multiplayer, part 3: the battle =================
   Host-authoritative. The host's browser runs the real simulation (every unit, castle, research, projectile and death
   is decided there) with the AI general switched off: both armies belong to people. Every player — the host included —
   changes the battle only through commands: { cid, sq, type, payload } signed by the sender. The host checks each one
   (sender is a current member, the team their seat gives them, sequence, duplicates, payload, ownership, gold, souls,
   mana, population, legality) and applies it or refuses it; teammates in 2v2 share their team's army and treasury, and
   commands are applied in the order the host receives them.
   NET_HZ times a second the host broadcasts a compact snapshot (positions, facing, health, status flags, regiments and
   their orders, treasuries, castles, statues) plus the events since the last one (an animation started, a finisher,
   a death with its impulse, a unit walking out of a door or climbing out of the Hellpit, research finished, the end).
   Guests run the same engine for looks only: soldiers are puppets that follow the snapshots ~0.2 s behind, play the
   host's animations, and fall as ragdolls when the host says they died. A guest never deals damage, kills, spends or
   spawns on its own. */
const NTYPES=Object.keys(TYPES).sort(), NTI={}; NTYPES.forEach((t,i)=>NTI[t]=i);
const NET_DELAY=210;                 // ms the guests' view runs behind the host (two snapshots of slack)
const NETG={ev:[],acks:[],seen:new Set(),seqOf:{},q:[],evq:[],byId:new Map(),off:null,offS:[],lastTick:0,lastN:-1,rt:0,
  tickAcc:0,tickN:0,t0:0,over:null,reported:false,pending:new Map(),missing:new Map(),gone:{},bgLast:0,worker:null,uiT:0,stats:{bytes:0,n:0,max:0}};
const NETT={};   // test hooks (read by tests/nettest.js)
const hostNow=()=>Math.round(performance.now()-NETG.t0);
const r2=v=>Math.round(v*100), r3=v=>Math.round(v*1000);

/* ---------------- host: recording what happens ---------------- */
const netId=u=>u&&(u.isUnit||u.garrison)?u.id:0;
function netCapPlay(u,name){ if(!NETG.cap||!(u.isUnit||u.garrison)) return; NETG.ev.push({t:hostNow(),k:'p',u,name,a:u.action}); }
function netCapFin(u,v,name){ if(!NETG.cap) return; NETG.ev.push({t:hostNow(),e:['f',u.id,v.id,name]}); }
function netCapDeath(u,imp,opt){ if(!NETG.cap||!(u.isUnit||u.garrison)) return; const i=imp||{x:0,y:0,z:0};
  NETG.ev.push({t:hostNow(),e:['d',u.id,r2(i.x),r2(i.y),r2(i.z),(opt&&opt.decap?1:0)|(u.state==='stunned'?2:0)]}); }
function netCapNew(u,how,b){ if(!NETG.cap) return; NETG.ev.push({t:hostNow(),e:['n',u.id,how,b.id]}); }
function netCapEvent(e){ if(!NETG.cap) return; NETG.ev.push({t:hostNow(),e}); }
function netCapOver(w,reason){ if(!NET.host||NETG.over) return; NETG.over={w,r:reason,stats:netStatsSummary()}; NETG.ev.push({t:hostNow(),e:['o',w===null?-1:w,reason,NETG.over.stats]}); NETG.reportP=netReportResult(); }
function netStatsSummary(){ const S=game.stats||{}; return {kills:S.kills||[0,0],losses:S.losses||[0,0],fins:S.fins||[0,0],peak:S.peak||[0,0],t:Math.round(game.time-(S.t0||0))}; }
// flush the recorded events into wire form ([kind, ms before the snapshot, ...])
function netFlushEvents(t){
  const out=[];
  for(const x of NETG.ev){ const dt=Math.max(0,t-x.t);
    if(x.k==='p'){ const u=x.u, same=u.action===x.a, tg=same?u.atkTarget:null;
      const tgt=tg?(tg.isStatue?'s'+tg.team:netId(tg)):0;
      out.push(['p',dt,u.id,x.name,tgt,same?r2(u.fwdScale||0):100,same?r3(u.aimPitch||0):0]); }
    else out.push([x.e[0],dt,...x.e.slice(1)]); }
  NETG.ev.length=0; return out;
}

/* ---------------- host: the snapshot ---------------- */
const ORD={army:0,move:1,hold:2,attack:3,charge:4}, ORDN=['army','move','hold','attack','charge'];
function unitFlags(u){ const S=u.st||{};
  return (u.routing?1:0)|(u.inCastle?2:0)|(u.state==='stunned'?4:0)|(S.burn?8:0)|(S.poison?16:0)|(S.rend?32:0)|(u.rage>0?64:0)|(u.cloak?128:0)
    |(u.fl&&u.fl.air?256:0)|(u.emerge?512:0)|(u.carry?1024:0)|(u.mining?2048:0); }
function netSnapshot(){
  const t=hostNow(), U=[], R=[];
  for(const u of units){ if(!u.alive||!u.isUnit) continue;
    U.push([u.id,NTI[u.type],u.team,r2(u.pos.x),r2(u.pos.z),r3(wrapA(u.face)),Math.max(1,Math.round(u.hp)),Math.round(u.maxHp),unitFlags(u),u.reg?u.reg.id:0,
      Math.abs(u.s-u.T.s)>1e-3?r2(u.s):0,u.chg?u.chg.i+1:0]); }
  for(const r of regs){ if(!regAlive(r).length) continue; const o=r.order||{kind:'army'};
    R.push([r.id,r.team,NTI[r.type],r.num,ORD[o.kind]||0,o.x!==undefined?r2(o.x):0,o.z!==undefined?r2(o.z):0,o.a!==undefined?r3(o.a):0,o.target?o.target.id:0,o.unit&&o.unit.alive?o.unit.id:0]); }
  const C=CASTLES.map(Cs=>{ if(!Cs) return null; const b={};
    for(const B of [...Cs.list,Cs.keep]){ const tr=B.train, rs=B.res;
      if(!(B.q&&B.q.length)&&!tr&&!(B.exitQ&&B.exitQ.length)&&!rs) continue;
      b[B.id]=[(B.q||[]).map(x=>NTI[x]),tr?NTI[tr.type]:-1,tr?Math.round(tr.t*10):0,tr?Math.round(tr.tot*10):0,(B.exitQ||[]).length,rs?rs.id:'',rs?rs.lvl:0,rs?Math.round(rs.t*10):0,rs?Math.round(rs.tot*10):0]; }
    return {res:Cs.res,b,g:Cs.garrison.map(g=>[g.id,r3(wrapA(g.face))])}; });
  return {v:BUILD.version,n:++NETG.tickN,t,g:game.gold.map(Math.floor),m:game.mana.map(Math.floor),st:game.stance.slice(),au:game.auto.slice(0,2).map(x=>x?1:0),
    hx:game.holdX.map(r2),sh:statues.map(s=>[Math.ceil(s.hp),Math.round(s.max)]),u:U,r:R,c:C,e:netFlushEvents(t),a:NETG.acks.splice(0),ov:NETG.over};
}
function netHostTick(rdt){
  NETG.tickAcc+=rdt; const hz=NETC.room&&NETC.room.mode==='2v2'?8:NET_HZ;
  if(NETG.tickAcc<1/hz) return; NETG.tickAcc=Math.min(NETG.tickAcc-1/hz,.5);
  const s=netSnapshot(); const body={s};
  netSend('tick',body).then(()=>{});
  const size=JSON.stringify(body).length; NETG.stats.n++; NETG.stats.bytes+=size; NETG.stats.max=Math.max(NETG.stats.max,size); NETG.stats.last=size;
  NETT.lastTick=s; if(NETT.collect) NETT.collect.push(s);
}

/* ---------------- commands: one way in for every state change ---------------- */
// offline: applied at once for team 0. Host: validated and applied for the host's own team. Guest: signed and sent.
function issue(type,p){
  if(!NET.on) return applyCmd(0,type,p,true)===true;
  if(NET.host){ const r=applyCmd(NET.team,type,p,true); if(r!==true) netDenied(type,r); return r===true; }
  if(NET.guest){ netSendCmd(type,p); return true; }
  return false;
}
const CMD_TYPES={buy:1,res:1,stance:1,reg:1,auto:1,surrender:1};
function applyCmd(team,type,p,local){
  if(!CMD_TYPES[type]) return 'unknown_command';
  if(!p||typeof p!=='object'||Array.isArray(p)) return 'bad_payload';
  if(game.mode!=='battle'||(game.over>0&&type!=='surrender')) return 'not_active';
  switch(type){
    case 'buy': return typeof p.t==='string'&&TYPES[p.t]?buyFor(team,p.t,!local):'bad_payload';
    case 'res':{ const R=typeof p.id==='string'&&RES_BY_ID[p.id]; if(!R) return 'bad_payload';
      if(!CASTLES[team]||!resBuilding(team,R.bid)) return 'not_your_building';
      return startResearch(team,p.id)?true:'research_refused'; }
    case 'stance': if(!['defend','hold','charge'].includes(p.st)) return 'bad_payload'; armyOrder(p.st,team); return true;
    case 'reg':{ const r=regs.find(x=>x.id===p.r); if(!r||r.team!==team) return 'not_your_regiment'; if(!regAlive(r).length) return 'regiment_gone';
      const quiet=!local;
      if(p.k==='move'){ const x=+p.x, z=+p.z; if(!isFinite(x)||!isFinite(z)||Math.abs(x)>80||Math.abs(z)>40) return 'bad_payload'; orderMove(r,{x,z},quiet); return true; }
      if(p.k==='hold'){ orderHold(r,quiet); return true; }
      if(p.k==='charge'){ r.order={kind:'charge'}; return true; }
      if(p.k==='army'){ r.order={kind:'army'}; return true; }
      if(p.k==='attack'){ const tr=p.tr?regs.find(x=>x.id===p.tr):null, tu=p.tu?units.find(u=>u.id===p.tu&&u.alive&&u.isUnit):null;
        if(tr&&(tr.team===team||!regAlive(tr).length)) return 'bad_target';
        if(!tr&&(!tu||tu.team===team)) return 'bad_target';
        orderAttack(r,tr,tr?null:tu,quiet); return true; }
      return 'bad_payload'; }
    case 'auto': game.auto[team]=!!p.on; if(team===myTeam()) syncBattleButtons(); return true;
    case 'surrender': if(!NET.on) return 'not_active'; netEndMatch(1-team,'surrender'); return true;
  }
  return 'unknown_command';
}
const DENY={gold:'Not enough ',mana:'Not enough mana',population:'Your army is at full strength',research_refused:'That research can’t start now',not_your_building:'That building isn’t yours',
  not_your_regiment:'That regiment isn’t yours',regiment_gone:'That regiment has fallen',bad_target:'That isn’t an enemy',not_in_roster:'Your army can’t train that unit',not_active:'The battle is over',timeout:'The host didn’t confirm that order'};
function netDenied(type,r){ if(type==='buy'||type==='res') sfx('deny'); const msg=(DENY[r]||'Refused: '+r)+(r==='gold'?money(myTeam()):''); callFloat(msg); }
function callFloat(msg){ netNotice(msg); }
// a short notice in the connection bar (who joined or dropped out, a refused order)
function netNotice(t){ NETG.note=t; NETG.noteT=performance.now()+4000; const n=$('#netNote'); if(n) n.textContent=t; }
// guest: send a command; the host's acknowledgement (in a later snapshot) confirms or refuses it
function netSendCmd(type,p){
  const cid=Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
  NETG.pending.set(cid,{type,p,at:performance.now()});
  netSend('cmd',{cid,type,p});
  if(type==='reg'){ const r=regs.find(x=>x.id===p.r); if(p.k==='move') marker.at(p.x,p.z,'#ffd36b'); else if(p.k==='attack'){ const u=NETG.byId.get(p.tu); if(u) marker.at(u.pos.x,u.pos.z,'#ff5a4f'); } else if(p.k==='hold'&&r){ const c=regCenter(r); marker.at(c.x,c.z,'#ffd36b'); } }
  if(type==='buy'||type==='res') sfx('ui');
  NETT.lastCmd={cid,type,p};
}
function netAck(a){
  for(const [cid,ok,r] of a){ const P=NETG.pending.get(cid); if(!P) continue; NETG.pending.delete(cid);
    NETT.acks=(NETT.acks||[]).concat([[cid,ok,r]]).slice(-50);
    if(ok){ if(P.type==='buy'){ sfx('buy'); unitVoice(P.p.t); } }
    else { if(P.type==='buy'&&r==='gold') narrate('noGold',3); if(P.type==='buy'&&r==='mana') narrate('noMana',3); netDenied(P.type,r); } }
}
// host: a command from another player
function netHostCommand(uid,m){
  const seat=NETC.room&&NETC.room.players.find(p=>p.user_id===uid&&!p.left);
  const ack=(ok,r)=>NETG.acks.push([m.cid,ok?1:0,r||'']);
  if(!seat) return;                                                  // not a member (signature already checked against seats)
  if(typeof m.cid!=='string'||m.cid.length>32||NETG.seen.has(m.cid)) return;   // malformed or duplicate: dropped
  // sequence numbers run per signing key: a player who reloads (new key) starts afresh, and nothing signed with an
  // old key verifies any more, so old commands can't be replayed
  const sk=uid+':'+(seat.key?seat.key.x:'');
  if(!(typeof m.sq==='number'&&m.sq>(NETG.seqOf[sk]||0))) return ack(false,'stale_sequence');
  NETG.seqOf[sk]=m.sq; NETG.seen.add(m.cid); if(NETG.seen.size>4000){ NETG.seen=new Set([...NETG.seen].slice(-2000)); }
  if(!CMD_TYPES[m.type]) return ack(false,'unknown_command');
  if(JSON.stringify(m.p||{}).length>600) return ack(false,'bad_payload');
  const r=applyCmd(seat.team,m.type,m.p,false);
  NETT.hostCmds=(NETT.hostCmds||0)+1;
  ack(r===true,r===true?'':r);
}

/* ---------------- dispatch of verified channel messages ---------------- */
function netDispatch(uid,m,size){
  const room=NETC.room; if(!room) return;
  if(m.k==='tick'){ if(uid!==room.host||!NET.guest) return; netGuestReceive(m.s,size); return; }
  if(m.k==='cmd'){ if(NET.host) netHostCommand(uid,m); return; }
  if(m.k==='hi'){ if(NET.host){ const p=room.players.find(x=>x.user_id===uid); if(p&&m.v!==BUILD.version) netLog('player '+p.name+' runs version '+m.v);
      if(p&&NETG.started){ NETG.tickAcc=1; if(NETG.helloFrom!==uid){ NETG.helloFrom=uid; callout0(p.name+' joined the battle'); } } } return; }
}
function callout0(t){ netNotice(t); }

/* ---------------- guest: receiving the host's battle ---------------- */
function netGuestReceive(s,size){
  if(!s||typeof s.n!=='number'||!Array.isArray(s.u)) return;
  if(s.v&&s.v!==BUILD.version){ netFatal('The host runs a different version of the game ('+s.v+'). Both players need to reload the page.'); return; }
  if(s.n<=NETG.lastN) return; NETG.lastN=s.n;
  const now=performance.now(), sample=s.t-now;
  NETG.offS.push(sample); if(NETG.offS.length>40) NETG.offS.shift();
  const best=Math.max(...NETG.offS); NETG.off=NETG.off===null?best:Math.max(best,NETG.off-0.5);   // the lowest-latency sample, drifting slowly
  NETG.lastTick=now; NETG.stats.n++; NETG.stats.bytes+=size||0;
  // positions go into each unit's buffer right away, so interpolation always has the next point
  for(const rec of s.u){ const u=NETG.byId.get(rec[0]); if(u&&u.alive) pushSample(u,s.t,rec); }
  for(const e of (s.e||[])) NETG.evq.push({t:s.t-e[1],e});
  if(NETG.evq.length>4000) NETG.evq.splice(0,NETG.evq.length-4000);   // a tab left in the background doesn't pile up events forever
  if(s.a&&s.a.length) netAck(s.a);
  NETG.q.push(s);
  if(!NETG.firstTick){ NETG.firstTick=true; netWaitUI(false); }
}
function pushSample(u,t,rec){ const b=u.nb||(u.nb=[]); if(b.length&&b[b.length-1].t>=t) return; b.push({t,x:rec[3]/100,z:rec[4]/100,f:rec[5]/1000}); if(b.length>12) b.shift(); }
function netRenderTime(){ return performance.now()+(NETG.off||0)-NET_DELAY; }
// each frame on a guest: apply the snapshots and events whose time has come
function netGuestFrame(){
  NETG.rt=netRenderTime(); const rt=NETG.rt;
  // events, in time order; one that names a unit we don't have yet waits (up to 1.5 s) for the snapshot that creates it
  NETG.evq.sort((a,b)=>a.t-b.t);
  let keep=[];
  for(const x of NETG.evq){ if(x.t>rt){ keep.push(x); continue; }
    if(!netApplyEvent(x.e)&&rt-x.t<1500) keep.push(x); }
  NETG.evq=keep;
  while(NETG.q.length&&NETG.q[0].t<=rt){ netApplyTick(NETG.q.shift()); }
  if(NETG.q.length>40) NETG.q.splice(0,NETG.q.length-40);
  // deaths held back for a finisher that is still playing out here
  for(const u of units) if(u.net&&u.alive&&u.netDeath&&performance.now()>u.netDeath.at) netKill(u,u.netDeath.imp,0,true);
}
function regById(id){ return regs.find(r=>r.id===id)||null; }
function netApplyTick(s){
  NETT.applied=(NETT.applied||0)+1;
  game.gold=[s.g[0],s.g[1]]; game.mana=[s.m[0],s.m[1]];
  for(let t=0;t<2;t++){ if(game.stance[t]!==s.st[t]){ game.stance[t]=s.st[t]; if(t===myTeam()) for(const [id,v] of [['oDefend','defend'],['oHold','hold'],['oCharge','charge']]) $('#'+id).setAttribute('aria-pressed',s.st[t]===v); } }
  const au=[!!s.au[0],!!s.au[1]]; if(au[myTeam()]!==game.auto[myTeam()]){ game.auto=au; syncBattleButtons(); } else game.auto=au;
  game.holdX=[s.hx[0]/100,s.hx[1]/100];
  s.sh.forEach((h,i)=>{ const st=statues[i]; if(st){ st.hp=h[0]; st.max=h[1]; } });
  // regiments first (units point at them)
  const seenR=new Set();
  for(const R of s.r){ const [id,team,ti,num,ok,ox,oz,oa,tr,tu]=R; seenR.add(id); let r=regById(id);
    if(!r){ r={id,team,type:NTYPES[ti],units:[],num,order:{kind:'army'}}; regs.push(r); makeBanner(r); if(team===0) regNum[0]=Math.max(regNum[0],num); else regNum[1]=Math.max(regNum[1],num); }
    const k=ORDN[ok]||'army';
    r.order=k==='move'||k==='hold'?{kind:k,x:ox/100,z:oz/100,a:oa/1000}:k==='attack'?{kind:'attack',target:tr?regById(tr):null,unit:tu?NETG.byId.get(tu)||null:null}:{kind:k}; }
  for(let i=regs.length-1;i>=0;i--){ const r=regs[i]; if(!seenR.has(r.id)){ if(r.banner) dropRoot(r.banner); if(selReg===r) selectReg(null); regs.splice(i,1); } }
  for(const r of regs) r.units.length=0;
  // units: create the newcomers, update everyone, retire the ones the host no longer has
  const seen=new Set();
  for(const rec of s.u){ const id=rec[0]; seen.add(id); let u=NETG.byId.get(id);
    if(!u||!u.alive){ if(NETG.gone[id]) continue; u=netMakePuppet(rec,s.t); if(!u) continue; }
    netUpdatePuppet(u,rec);
    const r=rec[9]?regById(rec[9]):null; u.reg=r; if(r) r.units.push(u); }
  for(const u of units){ if(!u.net||!u.alive||seen.has(u.id)) continue;
    const n=(NETG.missing.get(u.id)||0)+1; NETG.missing.set(u.id,n);
    if(n>=3) netKill(u,null,0,true); }   // gone without a death event (missed while reconnecting): it fell
  for(const id of seen) NETG.missing.delete(id);
  if(selReg&&!regs.includes(selReg)) selectReg(null);
  // castles: what is queued, training and being researched; who stands on the walls
  s.c.forEach((cs,t)=>{ const C=CASTLES[t]; if(!cs||!C) return;
    const before=C.res.castleArchers||0; C.res=Object.assign({},cs.res);
    for(const B of [...C.list,C.keep]){ const x=cs.b[B.id];
      if(!x){ if(B.q) B.q.length=0; B.train=null; if(B.exitQ) B.exitQ.length=0; B.res=null; continue; }
      B.q=x[0].map(i=>NTYPES[i]); B.train=x[1]>=0?{type:NTYPES[x[1]],t:x[2]/10,tot:x[3]/10}:null; B.exitQ=new Array(x[4]).fill('?');
      B.res=x[5]?{id:x[5],lvl:x[6],t:x[7]/10,tot:x[8]/10}:null;
      if(B.exitQ.length&&B.door) openDoor(B,1.2); }
    if((C.res.castleArchers||0)!==before||C.garrison.length!==cs.g.length) syncGarrison(C);
    cs.g.forEach((g,i)=>{ const G=C.garrison[i]; if(!G) return; if(G.id!==g[0]){ NETG.byId.delete(G.id); G.id=g[0]; } NETG.byId.set(G.id,G); G.netFace=g[1]/1000; }); });
  if(s.ov&&!NETG.over) netGuestOver(s.ov);
}
// a soldier the host has and we don't: built with the real model at its spot
function netMakePuppet(rec,t){
  const [id,ti,team,x100,z100,f1000,hp,maxHp,fl,reg,s100]=rec, type=NTYPES[ti]; if(!TYPES[type]) return null;
  const opt={}; if(s100) opt.s=s100/100;
  const keep=uid, u=makeUnit(type,team,x100/100,z100/100,opt); uid=keep;
  u.id=id; u.isUnit=true; u.net=true; u.ai=false; u.inCastle=!!(fl&2);
  units.push(u); NETG.byId.set(id,u);
  placeUnit(u,x100/100,z100/100,f1000/1000);
  if(u.fl&&!(fl&256)){ u.fl.air=false; u.fl.mode='ground'; u.fl.takeT=.2; }
  u.nb=[]; pushSample(u,t,rec);
  for(const q of NETG.q) for(const r of q.u) if(r[0]===id){ pushSample(u,q.t,r); break; }   // snapshots already received for it
  return u;
}
// the wall garrison on a guest: faces where the host's sentries face; their shots arrive as animation events
function netGarrison(C,dt){
  for(const g of C.garrison){
    g.faceGoal=g.netFace!==undefined?g.netFace:(g.team?-Math.PI/2:Math.PI/2);
    updateUnit(g,dt);
    g.pos.x=cwx(g.team,g.post[0]); g.pos.z=g.post[2]; if(g.vel) g.vel.set(0,0,0);
  }
}
function netUpdatePuppet(u,rec){
  const fl=rec[8]; u.hp=rec[6]; u.maxHp=rec[7];
  u.routing=!!(fl&1);
  if(u.inCastle&&!(fl&2)) leaveCastle(u); else if(!u.inCastle&&(fl&2)) u.inCastle=true;
  const S=u.st||(u.st={});
  if(fl&8){ if(!S.burn) S.burn={t:.6,dps:0,acc:0,src:null}; else S.burn.t=.6; }
  if(fl&16){ if(!S.poison) S.poison={t:.6,dps:0,acc:0,src:null}; else S.poison.t=.6; }
  S.rend=fl&32?{t:.6,src:null}:null;
  if(fl&128){ if(!u.cloak) startCloak(u); u.cloak.t=8; } else if(u.cloak) endCloak(u);
  u.rage=fl&64?1:0; u.carry=!!(fl&1024); u.mining=!!(fl&2048);
  if(u.fl&&(fl&256)&&!u.fl.air&&u.fl.mode==='ground'&&!u.inCastle) u.fl.takeT=Math.min(u.fl.takeT,.05);
  u.chg=rec[11]?{i:rec[11]-1}:null;
  if(u.G&&u.G.b&&u.type==='miner') u.G.b.visible=u.carry;
}
// where the host had this soldier at render time (interpolated between snapshots, never extrapolated far)
function netSample(u){
  const b=u.nb, rt=NETG.rt; if(!b||!b.length) return null;
  if(rt<=b[0].t) return {x:b[0].x,z:b[0].z,f:b[0].f,vx:0,vz:0};
  for(let i=1;i<b.length;i++){ const a=b[i-1], c=b[i]; if(c.t>=rt){ const k=(rt-a.t)/Math.max(1,c.t-a.t), dt=Math.max(.001,(c.t-a.t)/1000);
      return {x:a.x+(c.x-a.x)*k,z:a.z+(c.z-a.z)*k,f:a.f+wrapA(c.f-a.f)*k,vx:(c.x-a.x)/dt,vz:(c.z-a.z)/dt}; } }
  const L=b[b.length-1]; return {x:L.x,z:L.z,f:L.f,vx:0,vz:0,stale:rt-L.t};
}
// a puppet's "brain": walk where the host's soldier is (so the legs, IK and lean all animate as they would offline)
function netPuppet(u,dt){
  u.desired.set(0,0,0);
  if(u.state==='stunned'||u.fin) return;
  const s=netSample(u); if(!s) return;
  const dx=s.x-u.pos.x, dz=s.z-u.pos.z, d=Math.hypot(dx,dz);
  if(d>3.5&&!u.emerge){ placeUnit(u,s.x,s.z,s.f); return; }   // teleports (a Reaper's shadow step) and long gaps snap
  const cap=u.T.speed*2.2+2;
  let vx=s.vx+dx*5, vz=s.vz+dz*5; const sp=Math.hypot(vx,vz); if(sp>cap){ vx*=cap/sp; vz*=cap/sp; }
  if(sp<.08&&d<.05){ vx=0; vz=0; }
  u.desired.set(vx,0,vz);
  u.faceGoal=s.f;
}
// during an animation (root motion moves the body) keep it on the host's track
function netPuppetCorrect(u,dt){
  if(u.state==='stunned'||u.fin||!u.action||u.action.c.idle) return;
  const s=netSample(u); if(!s) return;
  const k=1-Math.exp(-dt*2.5); u.pos.x+=(s.x-u.pos.x)*k; u.pos.z+=(s.z-u.pos.z)*k;
}
// a death the host announced: the guest's own ragdoll takes over from here
function netKill(u,imp,flags,now){
  if(!u||!u.alive) return;
  if(!now&&(u.state==='stunned'&&u.stunBy&&u.stunBy.alive&&u.stunBy.fin)){ u.netDeath={at:performance.now()+2600,imp}; return; }   // its finisher plays out first
  NETG.gone[u.id]=1;
  NET.allowKill++; try{ kill(u,imp||new V3(0,1,0),{decap:!!(flags&1)}); } finally { NET.allowKill--; }
}
function netApplyEvent(e){
  const k=e[0];
  if(k==='p'){ const u=NETG.byId.get(e[2]); if(!u) return false; if(!u.alive) return true;
    const name=e[3], c=CLIPS[u.type][name]; if(!c) return true;
    NET.allowPlay++; try{ play(u,name); } finally { NET.allowPlay--; }
    const tg=e[4]; u.atkTarget=typeof tg==='string'?statues[+tg.slice(1)]||null:tg?NETG.byId.get(tg)||null:null;
    u.fwdScale=e[5]/100; u.aimPitch=e[6]/1000;
    const T=u.T; if(c.hitT!==undefined&&!c.idle&&!T.noSwing&&(!T.ranged||T.meleeSet&&T.meleeSet.has(name))&&(T.attacks&&T.attacks.includes(name)||name.startsWith('chg_')))
      sfx(u.type==='giant'?'swingHeavy':'swing',u.pos,.8,{delay:Math.max(0,c.hitT-.14)});
    if(name.startsWith('chg_')){ u.chg=null; }
    return true; }
  if(k==='f'){ const a=NETG.byId.get(e[2]), v=NETG.byId.get(e[3]); if(!a||!v) return false; if(!a.alive||!v.alive||!FIN[e[4]]) return true;
    if(v.fin) v.fin=null;
    NET.allowPlay++; try{ startFinisher(a,v,e[4]); } finally { NET.allowPlay--; }
    return true; }
  if(k==='d'){ const u=NETG.byId.get(e[2]); if(!u) return !!NETG.gone[e[2]]||false; if(!u.alive) return true;
    netKill(u,new V3(e[3]/100,e[4]/100,e[5]/100),e[6],false); return true; }
  if(k==='n'){ const u=NETG.byId.get(e[2]); if(!u) return false; const C=CASTLES[u.team], b=C&&(C.B[e[4]]||(e[4]==='pit'?C.pit:null)); if(!b) return true;
    if(e[3]===1){ openDoor(b,2.2); if(u.type==='giant'&&u.team===myTeam()) narrate('giantUnleashed',25); }
    if(e[3]===2&&u.alive&&!u.emerge){ const gy=H(u.pos.x,u.pos.z), s=u.s; u.emerging=true; u.emerge={t:0,dur:1.15,y0:gy-1.25*s,yg:gy}; u.gy=gy-1.25*s;
      _tp.set(u.pos.x,gy+.2,u.pos.z); puff(_tp,6,.35,2.4,'#ff7a2a'); crSfx('pitRise','stone',_tp,.8); }
    return true; }
  if(k==='rs'){ const t=e[2], C=CASTLES[t]; if(!C) return true; C.res[e[3]]=e[4]; const R=RES_BY_ID[e[3]];
    if(e[3]==='resilience'){} if(t===myTeam()&&R){ sfx('research',null,.9); narrate('researchDone',0); showBanner(rName(R,t)+(R.lv>1?' '+['I','II','III'][e[4]-1]:''),'research complete',1.4); if(panelB) refreshPanel(); }
    return true; }
  if(k==='o'){ netGuestOver({w:e[2]<0?null:e[2],r:e[3],stats:e[4]}); return true; }
  return true;
}
// the host says the battle is over: the statue falls here too, then the results
function netGuestOver(ov){
  if(NETG.over) return; NETG.over=ov;
  const w=ov.w;
  if(ov.r==='statue_destroyed'&&w!==null){ const st=statues[1-w]; if(st&&!st.fig.rag){ st.hp=0; const fig=st.fig; fig.av.set(0,0,0); toRagdoll(fig,new V3(st.team===0?-3:3,4,rand(-1,1)),{}); fig.rag.keep=true;
      puff(st.pos,14,.9,4,'#cbbd9f'); shakeAt(st.pos,.5); sfx('crumble',st.pos,1.4); } }
  game.over=2.6; game.winner=w===null?undefined:w;
  if(w!==null) narrate(w===myTeam()?'victory':'defeat');
  showBanner(w===null?'Battle ended':teamName(w)+' wins',ov.r==='statue_destroyed'?'statue destroyed':ov.r==='surrender'?'surrender':'no result',2.4);
}
function netGuestStep(rdt){
  if(game.over>0){ game.over-=rdt; if(game.over<=0) battleEnded(); }
}

/* ---------------- host: ending the battle ---------------- */
function netEndMatch(w,reason){
  if(!NET.host||NETG.over||game.over>0&&NETG.over) return;
  if(w!==null){ game.winner=w; narrate(w===myTeam()?'victory':'defeat'); }
  game.over=2.6;
  netCapOver(w,reason);
  showBanner(w===null?'Battle ended':teamName(w)+' wins',reason==='surrender'?'surrender':reason==='abandoned'?'a player disconnected: no result':'',2.4);
  NETG.tickAcc=1;   // the next snapshot (with the end) goes out straight away
}
async function netReportResult(){
  if(!NET.host||NETG.reported||!NETC.room) return; NETG.reported=true;
  const o=NETG.over, room=NETC.room;
  const res=o.r==='statue_destroyed'||o.r==='surrender'?o.r:'abandoned';
  for(let i=0;i<3;i++){
    try{ const r=await netRpc('se3d_report_result',{p_match:room.id,p_winner:res==='abandoned'?null:o.w,p_result:res,p_duration:o.stats.t,p_summary:o.stats}); if(r) netSetRoom(r); NETT.reported=res; return; }
    catch(e){ netLog('result report failed: '+e.message); if(e.code&&e.code!=='network') return; await new Promise(r=>setTimeout(r,1500*(i+1))); } }
}

/* ---------------- starting, running and leaving an online battle ---------------- */
function netCamera(team){
  const x=BASE_X[team]+DIRX[team]*13; cam.follow=null; cam.pitch=.42; cam.yaw=team?Math.PI:0;
  cam.goal.set(x,H(x,0)+1.2,0); cam.target.copy(cam.goal); cam.dGoal=cam.dist=36; updateFollowUI();
}
function netResetState(){
  NETG.ev.length=0; NETG.acks.length=0; NETG.seen=new Set(); NETG.seqOf={}; NETG.q.length=0; NETG.evq.length=0; NETG.byId=new Map(); NETG.off=null; NETG.offS=[];
  NETG.lastTick=0; NETG.lastN=-1; NETG.tickAcc=0; NETG.tickN=0; NETG.over=null; NETG.reported=false; NETG.pending=new Map(); NETG.missing=new Map(); NETG.gone={};
  NETG.firstTick=false; NETG.started=false; NETG.discon={}; NETG.lost=0; NETG.abandonTry=0; NETG.stats={bytes:0,n:0,max:0};
}
// both sides: build the battlefield from the room's shared configuration (factions, size)
function netBattleScene(cfg,host){
  closeMenu(); closeOverlays(); closeCampaign(); game.demo=false; game.tutorial=null; game.campFight=null; game.classicMix=false; game.paused=false;
  setFactions(cfg.factions[0],cfg.factions[1]); game.size=cfg.size===1?1:0; game.finMode=1;
  game.mode='battle'; syncModeUI(); setTab('battle'); setTerrain('skirmish');
  if(host){ resetBattle(); }
  else { clearAll(); game.over=0; game.winner=undefined; game.mana=[150,150]; game.gold=[0,0]; ensureCastles(); syncTeamNames(); setupStatues(); statsReset(); resetCastles(); closePanel();
    game.stance=['defend','defend']; game.bt=0; }
  game.auto=[false,false]; syncBattleButtons(); renderChips();
  for(const [id,v] of [['oDefend','defend'],['oHold','hold'],['oCharge','charge']]) $('#'+id).setAttribute('aria-pressed',game.stance[NET.team]===v);
  netCamera(NET.team);
}
function netBeginBattle(){
  const room=NETC.room, me=NETC.me; if(!room||!me) return;
  const host=room.host===NETC.user.id, cfg=room.config||{factions:['order','chaos'],size:0};
  netResetState();
  NET.on=true; NET.host=host; NET.guest=!host; NET.team=me.team; NET.after=false;
  NETC.phase='battle'; NETG.t0=performance.now();
  netBattleScene(cfg,host);
  NETG.cap=host; NETG.started=true;
  netHeartbeat(true,5000);
  $('#netbar').hidden=false;
  if(host){ netRpc('se3d_mark_playing',{p_match:room.id}).then(r=>{ if(r) netSetRoom(r); }).catch(e=>netLog('mark playing: '+e.message)); netBgTicker(true);
    showBanner('Battle!','you are '+teamName(NET.team)+(room.mode==='2v2'?' with your ally':''),2.2); sfx('horn'); }
  else { netWaitUI(true,'Waiting for the host…','The battle appears as soon as the host’s first update arrives.'); NETG.waitSince=performance.now(); netSend('hi',{v:BUILD.version}); }
}
function netWaitUI(on,h,s){ const w=$('#netWait'); if(!w) return; w.hidden=!on; if(on){ $('#netWaitH').textContent=h||'Waiting…'; $('#netWaitS').textContent=s||''; } }
function netBeforeStep(rdt){ if(NET.guest&&NETC.phase==='battle') netGuestFrame(); }
function netAfterStep(rdt){
  if(NETC.phase!=='battle') return;
  if(NET.host) netHostTick(rdt);
  NETG.uiT-=rdt; if(NETG.uiT<=0){ NETG.uiT=.25; netWatch(); netBarUI(); }
}
// a host tab in the background keeps simulating (browsers stop animation frames there, not workers)
function netBgTicker(on){
  try{
    if(on&&!NETG.worker&&typeof Worker!=='undefined'&&typeof Blob!=='undefined'){
      const src='let t=null;onmessage=e=>{clearInterval(t);if(e.data>0)t=setInterval(()=>postMessage(0),e.data)};';
      NETG.worker=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'}))); NETG.bgLast=performance.now();
      NETG.worker.onmessage=()=>{ const now=performance.now(), el=Math.min(.25,(now-NETG.bgLast)/1000); NETG.bgLast=now;
        if(!document.hidden||!NET.host||NETC.phase!=='battle') return;
        let left=el; while(left>1e-4){ const d=Math.min(left,1/40); step(d); netAfterStep(d); left-=d; } };
      NETG.worker.postMessage(50);
    } else if(!on&&NETG.worker){ NETG.worker.terminate(); NETG.worker=null; }
  }catch(e){ netLog('background ticker unavailable: '+e.message); }
}
// connection watch: stale snapshots, players dropping out, the host vanishing
function netWatch(){
  const room=NETC.room; if(!room||NETG.over) return; const now=performance.now();
  if(NET.guest){
    const quiet=NETG.lastTick?now-NETG.lastTick:now-(NETG.waitSince||now), hostOn=netOnline(room.host);
    if(!NETG.firstTick&&quiet>30000) { netFatal('The host never started sending the battle. The match was not started.'); return; }
    if(NETG.firstTick&&quiet>8000){
      const left=Math.max(0,Math.round(30-(quiet/1000)));
      netWaitUI(true,'Connection to the host lost',hostOn?'The host is still online; waiting for the battle to resume…':'Waiting for the host to come back'+(left?' ('+left+' s)':'')+'. If they don’t, the match ends with no winner.');
      if(quiet>30000&&now-(NETG.abandonTry||0)>15000){ NETG.abandonTry=now;
        netRpc('se3d_abandon_match',{p_match:room.id}).then(r=>{ if(r) netSetRoom(r); netGuestOver({w:null,r:'host_disconnected',stats:null}); netWaitUI(false); })
          .catch(e=>{ if(e.code==='host_alive') netLog('host still heartbeating'); else netLog('abandon: '+e.message); }); }
      if(quiet>150000) netFatal('The host has been unreachable for over two minutes.');
    } else if(NETG.firstTick&&quiet<=8000&&!$('#netWait').hidden) netWaitUI(false);
  }
  if(NET.host){
    // a team with nobody connected for 60 s ends the battle with no winner (a dropped connection never hands out a victory)
    const players=room.players.filter(p=>!p.left);
    for(const p of players){ if(p.user_id===NETC.user.id) continue; const on=netOnline(p.user_id);
      if(!on&&!NETG.discon[p.user_id]){ NETG.discon[p.user_id]=now; callout0(p.name+' lost connection'); }
      else if(on&&NETG.discon[p.user_id]){ delete NETG.discon[p.user_id]; callout0(p.name+' reconnected'); } }
    for(let t=0;t<2;t++){ const team=players.filter(p=>p.team===t); if(!team.length) continue;
      const anyOn=team.some(p=>p.user_id===NETC.user.id||!NETG.discon[p.user_id]||now-NETG.discon[p.user_id]<60000);
      const left=room.players.filter(p=>p.team===t).every(p=>p.left);
      if(!anyOn||left){ netEndMatch(null,'abandoned'); break; } }
  }
}
function netBarUI(){
  const bar=$('#netbar'); if(!bar||!NETC.room) return; const room=NETC.room, now=performance.now();
  let s='ok', txt;
  if(NETC.chState!=='ok'){ s='err'; txt='Reconnecting to the match…'; }
  else if(NET.host){ const lost=Object.keys(NETG.discon||{}).length; s=lost?'warn':'ok';
    txt='Online · you host'+(NETG.stats.last?' · '+(NETG.stats.last/1024).toFixed(1)+' KB/update':'')+(lost?' · '+lost+' player'+(lost>1?'s':'')+' disconnected':''); }
  else { const q=NETG.lastTick?now-NETG.lastTick:0; s=!NETG.firstTick||q>2500?'warn':'ok';
    txt=!NETG.firstTick?'Waiting for the host…':q>2500?'Connection to the host unstable ('+(q/1000).toFixed(0)+' s)':'Online · '+(room.mode)+' · host '+((room.players.find(p=>p.user_id===room.host)||{}).name||''); }
  bar.dataset.s=s; $('#netTxt').textContent=txt;
  if(NETG.note&&now>NETG.noteT){ NETG.note=''; $('#netNote').textContent=''; }
  $('#netPlayers').textContent=room.players.filter(p=>!p.left).map(p=>(netOnline(p.user_id)||p.user_id===NETC.user.id?'● ':'○ ')+p.name+(p.team===myTeam()?'':'')).join('  ');
}
function netPauseMenu(){
  $('#pause').hidden=false; $('#pauseH').textContent='Online battle'; $('#pRestart').hidden=true;
  $('#pauseSub').textContent='The battle keeps going while this menu is open · '+(NET.host?'you are the host':'host: '+((NETC.room.players.find(p=>p.user_id===NETC.room.host)||{}).name||''));
  $('#pResume').innerHTML='<span>Back to the battle</span>'; $('#pMenu').textContent=NET.host?'End the match and leave':NETC.room.mode==='1v1'?'Surrender and leave':'Leave the match';
}
function netLeavePressed(){
  const b=$('#pMenu'); if(!b.dataset.armed){ b.dataset.armed='1'; b.textContent='Tap again to confirm'; setTimeout(()=>{ delete b.dataset.armed; if(NET.on) netPauseMenu(); },3000); return; }
  delete b.dataset.armed; $('#pause').hidden=true;
  netLeaveMatch(true);
}
// leave the battle on purpose. A host ends it with no winner; a 1v1 guest surrenders; a 2v2 guest leaves their ally to fight on
async function netLeaveMatch(toMenu){
  const room=NETC.room;
  if(room&&NETC.phase==='battle'&&!NETG.over){
    if(NET.host){ netEndMatch(null,'abandoned'); const s=netSnapshot(); await netSend('tick',{s}); await (NETG.reportP||Promise.resolve()); }
    else if(room.mode==='1v1'){ netSendCmd('surrender',{}); await new Promise(r=>setTimeout(r,600)); }
  }
  if(room){ try{ await netRpc('se3d_leave_room',{p_match:room.id}); }catch(e){ netLog('leave: '+e.message); } }
  netShutdown();
  if(toMenu!==false) openMenu();
}
function netShutdown(){
  netBgTicker(false); netHeartbeat(false); netLeaveChannel();
  NET.on=NET.host=NET.guest=false; NET.team=0; NETG.cap=false; NETC.phase='off';
  NETC.room=null; NETC.me=null; $('#netbar').hidden=true; netWaitUI(false);
  for(const u of units) u.net=false;
}
function netFatal(msg){ netShutdown(); openMenu('menuOnline'); openOnline(msg,true); }
function netShowResults(){
  const S=NETG.over&&NETG.over.stats, me=myTeam(), w=NETG.over?NETG.over.w:null, why=NETG.over?NETG.over.r:'abandoned';
  const R=$('#results'); R.hidden=false; R.classList.remove('win','lose'); if(w!==null) R.classList.add(w===me?'win':'lose');
  $('#resH').textContent=w===null?'No result':w===me?'Victory':'Defeat';
  const time=fmtTime(S?S.t:game.time-game.stats.t0);
  $('#resSub').textContent=w===null?(why==='host_disconnected'?'The host disconnected. The match ended with no winner after '+time+'.':'A player left or disconnected. The match ended with no winner after '+time+'.')
    :why==='surrender'?(w===me?'The enemy surrendered after '+time+'.':'Your side surrendered after '+time+'.')
    :(w===me?'The '+teamName(1-me)+' statue fell after '+time+'.':'Your statue fell after '+time+'.');
  const st=S||netStatsSummary();
  const rows=[['Enemies slain',st.kills[me]],['Soldiers lost',st.losses[me]],['Finishers',st.fins[me]],['Largest army',st.peak[me]]];
  $('#resStats').innerHTML=rows.map(r=>'<dt>'+r[0]+'</dt><dd>'+Number(r[1]||0).toLocaleString()+'</dd>').join('');
  $('#rAgain').innerHTML='<span>Online menu</span>'; musicStinger(w===me);
  NET.after=true;
  const room=NETC.room; netShutdown(); NET.after=true;
  if(room) netRpc('se3d_leave_room',{p_match:room.id}).catch(()=>{});
}
function netResultsAgain(){ NET.after=false; $('#results').hidden=true; openMenu('menuOnline'); openOnline(); }
function netResultsMenu(){ NET.after=false; $('#results').hidden=true; openMenu(); }
function netPresenceChanged(){ if(NETC.phase==='lobby'&&typeof renderLobby==='function') renderLobby(); }
function netConnUI(){ if(typeof onlineConnUI==='function') onlineConnUI(); }

/* ---------------- test hooks: run the replication without a network (tests/nettest.js drives a host and guests) ---------------- */
Object.assign(NETT,{
  begin(room,uid){ NETC.user={id:uid}; NETC.onRoom=null; netSetRoom(room); NETC.chState='ok'; NETC.phase='lobby'; netBeginBattle(); },
  presence(uids){ NETC.presence={}; for(const u of uids) NETC.presence[u]=[{uid:u}]; },
  hostCommand:(uid,m)=>netHostCommand(uid,m),
  receive:s=>netGuestReceive(s,0),
  shutdown:()=>netShutdown(),
  problem:()=>onlineProblem(),
  mapError:e=>netMapError(e),
  pending:()=>NETG.pending.size,
  over:()=>NETG.over,
  stats:()=>NETG.stats,
  types:()=>NTYPES,
});
