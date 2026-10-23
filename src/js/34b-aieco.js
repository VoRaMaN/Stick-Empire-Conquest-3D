/* ================= The generals' economy (v0.23) =================
   The computer general runs its treasury the way a good player does:
   - Miners (Order gold) and Thralls (Chaos soul crystals) are recruited to a target that moves with the
     battle: more as it goes on, more for Chaos (a Thrall carries less), fewer while the treasury is already
     full or the army is near its cap, and none while the castle is being pressed and the army is losing;
     lost workers are replaced first. A mine holds only so many diggers; past that they add nothing.
   - Workers run for the keep when soldiers come at them and nobody is near to cover them, and on the
     Riverlands a threatened mine's diggers move to the other mine.
   - A miner under attack calls the nearest idle regiment to drive the raiders off.
   - Recruits are chosen against what the enemy fields: a few candidates from the faction's own mix are
     scored on how well they answer the enemy's archers, cavalry, heavies and footmen, and on what the
     treasury can bear. The classic regression mix (game.classicMix) keeps the old rules exactly. */
const AIE={comp:[null,null],press:[false,false],t:[0,0],help:[0,0]};
// what a soldier is, for counter-picking
const AI_ROLE={sword:'inf',spear:'pike',archer:'rng',giant:'heavy',ninja:'fast',wizard:'cast',cleric:'sup',wing:'air',knight:'cav',
  crawler:'fast',hound:'cav',dread:'heavy',harvester:'rng',boner:'inf',bomber:'cast',oracle:'sup',reaper:'inf',cerberus:'cav',hades:'heavy',sapling:'inf'};
function aiRole(type){ const r=AI_ROLE[type]; if(r) return r; const T=TYPES[type]||{}; return T.ranged||(T.range||0)>4?'rng':(T.cost||0)>=300?'heavy':'inf'; }
// how well the first role answers the second
const AI_BEATS={
  cav:{rng:1,cast:1,sup:.9,inf:.2},fast:{rng:.8,cast:.9,sup:.8},pike:{cav:1.3,fast:.5,air:.3},
  rng:{heavy:.9,inf:.4,pike:.6,air:.7},heavy:{inf:.8,pike:.6,fast:.4},cast:{inf:.7,pike:.7,fast:.3},
  air:{heavy:.8,rng:.3,cast:.5},inf:{rng:.5,cast:.5,fast:.3,sup:.4},sup:{inf:.25,heavy:.25,pike:.25}};
const aiFighter=u=>u.alive&&u.isUnit&&!u.T.worker&&!u.routing;
// every couple of seconds: what the enemy fields, and whether our castle is being pressed
function aiEcoTick(t){
  if(game.classicMix) return;
  const foe=1-t, C={}, n={v:0}; let near=0, mineNear=0, bx=MAP.id==='classic'?BASE_X[t]:(t?1:-1)*RL_CF;
  for(const u of units){ if(!aiFighter(u)) continue; const dx=Math.abs(u.pos.x-bx);
    if(u.team===foe){ const r=aiRole(u.type); C[r]=(C[r]||0)+u.T.cost; n.v+=u.T.cost; if(dx<(RL.on?45:22)) near+=u.T.cost; }
    else if(dx<(RL.on?50:24)) mineNear+=u.T.cost; }
  for(const k in C) C[k]/=n.v||1; AIE.comp[t]=C;
  AIE.press[t]=near>0&&near>mineNear*1.1;
  aiDefendMiners(t);
}
// a raided miner gets help: the nearest regiment that isn't busy goes for the raider
function aiDefendMiners(t){
  if(AIE.help[t]>game.time) return;
  let raid=null;
  for(const u of units) if(u.alive&&u.team===t&&u.T.worker&&u.fleeT>game.time&&u.fleeFrom&&u.fleeFrom.alive){ raid=u.fleeFrom; break; }
  if(!raid) return;
  let best=null, bd=1e9;
  for(const r of regs){ if(r.team!==t||r.hero) continue; const A=regAlive(r); if(A.length<2||A.some(u=>u.routing)) continue;
    const o=r.order; if(o&&o.kind==='attack') continue; const c=regCenter(r), d=Math.hypot(c.x-raid.pos.x,c.z-raid.pos.z); if(d<bd){ bd=d; best=r; } }
  if(best&&bd<(RL.on?140:60)){ best.order={kind:'attack',unit:raid,aiHelp:true}; AIE.help[t]=game.time+12; }
}
// how many workers the general wants right now
function aiWorkerTarget(t){
  if(game.classicMix) return rlWorkerTarget(t);
  const F=FAC(t), chaos=F.id==='chaos', bt=game.bt||game.time||0, have=count(t,F.worker);
  const mines=RL.on?2:1, sat=(chaos?8:6)*mines;   // a pit holds more Thralls (each carries less)
  let n=(RL.on?5:3)+Math.floor(bt/(RL.on?35:45));
  if(chaos) n=Math.round(n*1.35);
  n+=aiPers(t).workers;   // a Rusher digs less, a Turtle more (34c)
  const g=game.gold[t]; if(g>2600) n-=2; else if(g<250&&bt>40) n+=1;   // a full treasury needs fighters, an empty one diggers
  const floor=RL.on?4:2;
  if(have>=floor&&(AIE.press[t]||count(t)>=POP_CAP*.85)) n=Math.min(n,have);   // pressed or crowded: soldiers first (but always replace the losses)
  return clamp(n,floor,sat);
}
// the recruit: a few candidates from the faction's own mix, scored against what the enemy fields
function aiPick(t){
  if(game.classicMix) return factionPick(t);
  const C=AIE.comp[t]; if(!C) return factionPick(t);
  if(t!==myTeam()||game.demo||game.auto[t]){ const cands=[]; for(let i=0;i<4;i++){ const c=factionPick(t); if(TYPES[c]) cands.push(c); } const m=cands.length&&aiPickMind(t,cands); if(m) return m; }   // the general's mind (34c)
  const g=game.gold[t]; let best=null, bs=-1;
  for(let i=0;i<4;i++){ const c=factionPick(t); if(!TYPES[c]) continue;
    const B=AI_BEATS[aiRole(c)]||{}; let s=1; for(const k in C) s+=C[k]*(B[k]||0)*1.6;
    const cost=TYPES[c].cost; if(cost>g*1.6&&g<1200) s*=.55; else if(g>2000&&cost>=250) s*=1.25;   // poor: cheap troops now; rich: the expensive ones
    s*=.85+Math.random()*.3;
    if(s>bs){ bs=s; best=c; } }
  return best||factionPick(t);
}
// a worker with soldiers on him and nobody near to cover him runs for the keep (and, on the Riverlands, for the other mine)
function minerFlee(u,dt){
  if(game.classicMix||game.mode!=='battle') return false;
  u.fleeChk=(u.fleeChk||0)-dt;
  if(u.fleeChk<=0){ u.fleeChk=.5;
    const f=nearestFoe(u.pos.x,u.pos.z,u.team,6.5,null);
    if(f&&f.isUnit&&!f.T.worker&&!f.routing){ let mine=0; gridEach(u.pos.x,u.pos.z,7,o=>{ if(o.alive&&o.team===u.team&&o.isUnit&&!o.T.worker) mine+=o.T.cost; });
      if(mine<f.T.cost*1.2){ if(!(u.fleeT>game.time)&&RL.on&&u.rlMine!==undefined){ const o=RL_MINE[u.team][1-u.rlMine]; if(nearestFoe(o.x,o.z,u.team,18,null)==null) u.rlSwap=true; }
        u.fleeT=game.time+4; u.fleeFrom=f; } } }
  if(!(u.fleeT>game.time)){ if(u.rlSwap){ u.rlSwap=false; u.rlMine=1-u.rlMine; u.mstate=u.carry?'toBase':'toMine'; } return false; }
  u.mining=false;
  if(MAP.id==='classic') _goal.set(BASE_X[u.team]+(u.team?-2.6:2.6),0,u.zoff*.3); else rlDropOf(u,_goal);
  const dx=_goal.x-u.pos.x, dz=_goal.z-u.pos.z, d=Math.hypot(dx,dz);
  if(d<1){ if(u.carry){ u.carry=false; const g=workerYield(u); game.gold[u.team]+=g; onGold(u.team,g); } u.mstate='toMine'; u.desired.set(0,0,0); return true; }
  const sp=u.T.speed*1.1; u.desired.set(dx/d*sp,0,dz/d*sp); u.faceGoal=Math.atan2(dx,dz); return true;
}
