/* ---------------- modes ---------------- */
function clearAll(){
  for(const u of units) destroyGear(u); units.length=0;
  for(const u of corpses) if(!u.statue||!statues.some(s=>s.fig===u)) destroyGear(u);
  corpses.length=0;
  arrows.length=0; drops.length=0; splats.length=0; for(const L of loose) dropRoot(L.g); loose.length=0; souls.length=0; wisps.length=0;
  bombs.length=0; flames.length=0; orbs.length=0; walls.length=0; clouds.length=0; zaps.length=0; beams.length=0; flashes.length=0;   // spells in flight must not follow you into the next battle or the Lab
  for(const r of regs) if(r.banner) dropRoot(r.banner); regs.length=0; regNum[0]=regNum[1]=0; selectReg(null);
  for(const c of callouts) c.age=1;
  cam.follow=null; updateFollowUI();
}
function resetBattle(opt){
  opt=opt||{};
  clearAll(); game.paused=false; game.over=0; game.winner=undefined;   // a new battle never starts frozen (a stale pause from the campaign map stuck the Riverlands)
  game.mana=[150,150]; game.mission=null;   // a story mission sets itself up again after this (40c)
  ensureCastles(); syncTeamNames();
  const BS=BATTLE_SIZES[game.size], n=BS.start, g0=opt.gold||[BS.gold,BS.gold];
  game.gold=[g0[0]*econ(0),g0[1]*econ(1)];   // a Chaos treasury counts in souls (see ECON)
  if(game.classicMix) uid=48;   // the classic regression battle always numbers its soldiers from the same id, whatever ran before it
  setupStatues(opt.statueHp); statsReset(); resetCastles(); closePanel(); if(MAP.id!=='classic') rlResetZones();
  // each side's opening army: the faction's eight (Normal), or its regiments in ranks (Large, Epic)
  const start=t=>game.classicMix?(n<=8?['miner','miner','sword','sword','sword','archer','archer','spear']:armyMix(n)):factionStart(t,n);
  for(let t=0;t<2;t++) for(const ty of start(t)) spawn(ty,t);
  heroReset();   // each army's general (37g; not in the classic battle, the demo or the training)
  const extra=facOf(1)==='chaos'?['dread','crawler','harvester','crawler']:['spear','sword','archer','giant']; for(let k=0;k<(opt.enemyExtra||0);k++) spawn(extra[k%4],1);
  game.stance=['defend','defend']; game.aiT=4; game.bt=0; setStance(0,'defend'); setStance(1,'defend');
  if(n>8) for(const u of units) if(u.slot&&u.isUnit&&!u.T.worker){ placeUnit(u,u.slot.x,u.slot.z,u.team?-Math.PI/2:Math.PI/2); }
  frameBattle();
  replayStart();   // offline battles are recorded for "Watch replay" (49d)
  if(!game.demo&&!game.classicMix) setTimeout(()=>{ if(!game.demo&&game.mode==='battle'&&game.over<=0){ narrate('prepare'); if(!VOX.said.destroy){ VOX.said.destroy=1; setTimeout(()=>{ if(!game.demo&&game.mode==='battle') narrate('destroyStatue'); },3200); } } },700);
}
// open the battle on your own army, pulled back just far enough to take in all its ranks
function frameBattle(){
  const a=units.filter(u=>u.alive&&u.team===0&&u.isUnit&&!u.T.worker&&u.slot); let lo=BASE_X[0]+6, hi=BASE_X[0]+12;
  if(a.length){ lo=1e9; hi=-1e9; for(const u of a){ lo=Math.min(lo,u.slot.x); hi=Math.max(hi,u.slot.x); } }
  const tanH=Math.tan(camera.fov*Math.PI/360)*Math.max(.4,innerWidth/innerHeight), x=(lo+hi)/2+1;
  cam.follow=null; cam.pitch=.42; cam.yaw=0; cam.goal.set(x,H(x,0)+1.2,0); cam.target.copy(cam.goal);
  cam.dGoal=cam.dist=clamp((hi-lo+7)/(2*tanH),26,52);
}
// the classic regression army of n soldiers (a few miners, then mostly swordsmen, Spartans and archers, a handful of giants)
function armyMix(n){ const out=['miner','miner','miner','miner']; const pat=game.classicMix?['sword','spear','sword','archer','spear','sword','archer','sword','spear','archer','sword','giant']
    :['sword','spear','sword','archer','ninja','spear','sword','archer','wizard','sword','spear','archer','cleric','sword','ninja','giant','wing','spear','archer','sword'];
  for(let i=0;out.length<n;i++) out.push(pat[i%pat.length]); return out; }
// teleport a fresh unit (feet included) — used to deploy big armies straight into their ranks
function placeUnit(u,x,z,face){ u.pos.set(x,H(x,z),z); u.face=u.faceGoal=face; const f=new V3(Math.sin(face),0,Math.cos(face)), r=new V3(f.z,0,-f.x);
  u.feet.forEach((ft,i)=>{ const sd=i?1:-1; ft.pos.set(x+r.x*sd*.13*u.s,0,z+r.z*sd*.13*u.s); ft.pos.y=H(ft.pos.x,ft.pos.z); ft.t=-1; }); u.pyS=undefined; if(u.fl) flyInstant(u); if(u.cr) crPlace(u); }
const DUEL_X=0, DUEL_Z=-1.3;
function resetDuel(){
  clearAll(); ensureCastles(); syncTeamNames(); setupStatues(); resetCastles(); closePanel();
  const ty=game.duelSel;
  let gap0=ty==='archer'?(game.labFin?1.7:3.2):TYPES[ty].engage+(TYPES[ty].s-1)*.3;
  if(TYPES[ty].gearX&&game.labFin){ const F=FIN[FINS[ty][Math.max(0,game.finI||0)]]; if(F) gap0=F.contact+.25; }
  const att=spawn(ty,0,DUEL_X+1-gap0,DUEL_Z); att.ai=false;
  const dum=spawn('sword',1,DUEL_X+1,DUEL_Z); dum.ai=false;
  att.face=att.faceGoal=Math.PI/2; dum.face=dum.faceGoal=-Math.PI/2;
  for(const u of [att,dum]){ const f=new V3(Math.sin(u.face),0,Math.cos(u.face)), r=new V3(f.z,0,-f.x);
    u.feet.forEach((ft,i)=>{const sd=i?1:-1; ft.pos.set(u.pos.x+r.x*sd*.13*u.s,0,u.pos.z+r.z*sd*.13*u.s); ft.pos.y=H(ft.pos.x,ft.pos.z);}); }
  if(att.fl) flyInstant(att); if(att.cr) crPlace(att);
  game.duel={att,dum,q:null,home:{a:att.pos.clone(),d:dum.pos.clone()}};
  cam.goal.set(DUEL_X,H(DUEL_X,DUEL_Z)+(ty==='wing'?2.2:1.1),DUEL_Z); cam.dGoal=ty==='giant'?10.5:ty==='wing'?11:ty==='cerberus'?12:TYPES[ty].crawler||ty==='dread'?9:ty==='archer'||ty==='wizard'||ty==='harvester'?8.5:7.5;
}
function duelDo(kind){
  const D=game.duel;
  if(kind==='fin'){ const L=FINS[game.duelSel]; game.finI=((game.finI===undefined?-1:game.finI)+1)%L.length; game.labFin=true; resetDuel(); game.labFin=false; game.duel.q={t:.7,kind:'fin',name:L[game.finI]}; return; }
  if(kind==='idle'){
    if(!D||!D.att.alive||D.dum&&!D.dum.alive){ resetDuel(); }
    const a=game.duel.att; if(a.script&&a.script.walk) return; a.script=null;
    const L=IDLES[a.type]; game.idleI=((game.idleI===undefined?-1:game.idleI)+1)%L.length; const n=L[game.idleI];
    play(a,n); a.fwdScale=0; a.idleT=8;
    showBanner(IDLE_NAMES[n.slice(5)]||n,TYPES[a.type].name+' idle · '+(game.idleI+1)+' of '+L.length,1.4); return; }
  if(kind==='atk'){
    if(!D||!D.dum.alive||!D.att.alive) { const keep=D&&D.att.atkI; resetDuel(); if(keep!==undefined) game.duel.att.atkI=keep; game.duel.q={t:.5,kind:'atk'}; return; }
    if(D.att.action&&!D.att.action.c.idle||D.att.script&&D.att.script.walk) return;
    D.att.script=null; D.dum.invuln=true;
    const L=D.att.T.attacks; D.att.atkI=((D.att.atkI===undefined?-1:D.att.atkI)+1)%L.length; const name=L[D.att.atkI];
    // a caster's close-range move: walk up to blade's reach first (the Lab walks him back to his mark afterwards)
    const T=D.att.T, dx=D.dum.pos.x-D.att.pos.x, dz=D.dum.pos.z-D.att.pos.z, dd=Math.hypot(dx,dz), want=T.reach+.6;
    if(T.meleeSet&&T.meleeSet.has(name)&&dd>want+.4){ const k=(dd-want)/dd;
      D.att.script={pts:[new V3(D.att.pos.x+dx*k,0,D.att.pos.z+dz*k)],i:0,speed:T.speed,walk:true,face:D.dum,then:()=>{ if(D.att.alive&&D.dum.alive) startAttack(D.att,D.dum,name); }}; }
    else startAttack(D.att,D.dum,name);
    showBanner(MOVE_NAMES[name]||name,TYPES[D.att.type].name+' · move '+(D.att.atkI+1)+' of '+L.length,1.3);
    return; }
  if(kind==='charge'){ // run in from far away with the next charge style and crash into the dummy
    const L=CHG[game.duelSel]; game.chgI=((game.chgI===undefined?-1:game.chgI)+1)%L.length; const C=L[game.chgI];
    resetDuel(); const a=game.duel.att, dm=game.duel.dum; dm.invuln=true;
    const back=a.T.ranged?9:10; placeUnit(a,a.pos.x-back,a.pos.z,Math.PI/2);
    a.chgLab=true; a.chg={i:game.chgI}; a.target=dm;
    const stop=a.T.ranged?(a.T.chgStop||6):Math.max(a.T.engage+(a.s-1)*.3,1.4);
    a.script={pts:[new V3(dm.pos.x-stop,0,dm.pos.z)],i:0,speed:a.T.speed*1.15,face:dm,then:u=>{ startAttack(u,dm); }};
    showBanner(C.name,TYPES[a.type].name+' charge · '+(game.chgI+1)+' of '+L.length,1.6); return; }
  if(kind==='walk'){
    if(!D||!D.att.alive){ resetDuel(); }
    const att=game.duel.att; att.action=null; const pts=[];
    for(let i=0;i<=16;i++){ const a=-Math.PI/2+i/16*Math.PI*2; pts.push(new V3(Math.cos(a)*4.6,0,5+Math.sin(a)*4.6)); }
    pts.unshift(new V3(att.pos.x,0,att.pos.z+.5));
    pts.push(new V3(DUEL_X-1.4,0,DUEL_Z));
    att.script={pts,i:0,speed:att.T.speed*.75,walk:true};
    showBanner('Foot IK','walking the hill',1.3);
  }
}
function setTab(t){ $('#mBattle').setAttribute('aria-selected',t==='battle'); $('#mCamp').setAttribute('aria-selected',t==='camp'); $('#mDuel').setAttribute('aria-selected',t==='duel'); }
function syncModeUI(){ const m=game.mode; selectReg(null);
  $('#hudBattle').hidden=m!=='battle'; $('#actBattle').hidden=m!=='battle'; $('#orders').hidden=m!=='battle'; $('#actDuel').hidden=m!=='duel'; $('#actView').hidden=m!=='viewer'; $('#viewer').hidden=m!=='viewer'; renderChips(); syncMinimap(); }
function setMode(m){
  if(ARM.on&&m!=='viewer') armClose();
  if(game.demo&&menuEl&&!menuEl.hidden) closeMenu();
  game.mode=m; setTab(m==='duel'?'duel':(game.campFight?'camp':'battle'));
  syncModeUI();
  if(m==='battle') resetBattle();
  else if(m==='viewer'){ resetViewer(); cam.yaw=.35; }
  else { VW.u=null; resetDuel(); cam.pitch=.22; cam.yaw=.35; }
  renderChips();
}

