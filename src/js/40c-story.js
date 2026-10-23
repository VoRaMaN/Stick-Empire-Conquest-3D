/* ================= Story: The River War — five missions on Riverlands =================
   Each mission is a normal Riverlands battle with its own set-up, objective and end: hold the stone bridge against
   waves, escort a column of miners through forests full of raiders, hold three shrines at once, clear the ogre dens
   against the clock, and the last battle at Elderwood against the Wildlands (the Chaos Empire if you are the
   Wildlands). Missions unlock one after another; progress is kept in the settings. The objective panel (#mission)
   shows what to do and how it is going; the field shows the objective as a ring of light. */
const STORY=[
  {id:'bridge',name:'Hold the Stone Bridge',place:'The stone bridge, Riverlands',
    brief:'The enemy is massing on the far bank. Hold the west end of the stone bridge for five minutes against their waves. If they hold the bridgehead with none of yours on it for 20 seconds, it is lost.',
    gold:2600,foeGold:900},
  {id:'escort',name:'Escort the Miners',place:'The north road to Ashford',
    brief:'Six miners must reach the village of Ashford through the northern woods. Raiders lie in wait among the trees. Bring at least three of them home.',
    gold:1800,foeGold:0,passive:true},
  {id:'shrines',name:'The Three Shrines',place:'Shrines A and D, market B',
    brief:'Take shrine A, shrine D and market B and hold all three at once for a full minute. You have twelve minutes.',
    gold:3200,foeGold:1600},
  {id:'ogres',name:'The Ogre Dens',place:'The north-west and south-east dens',
    brief:'Two ogre dens raid the valley. Clear both before eight minutes are up. The enemy army will stay behind its walls.',
    gold:4200,foeGold:0,passive:true},
  {id:'elderwood',name:'Elderwood',place:'The enemy castle',
    brief:'The last battle. The enemy comes with everything it has, its general at the head. Destroy their statue.',
    gold:3000,foeGold:2600,extra:3},
];
const STORY_ROLE={order:{melee:'sword',ranged:'archer',heavy:'spear',worker:'miner'},chaos:{melee:'dread',ranged:'harvester',heavy:'crawler',worker:'thrall'},wild:{melee:'sword',ranged:'archer',heavy:'giant',worker:'miner'}};
const storyRole=(t,r)=>(STORY_ROLE[facOf(t)]||STORY_ROLE.order)[r];
const storyDone=()=>(settings.story&&settings.story.done)||{};
const storyUnlocked=i=>i===0||!!storyDone()[STORY[i-1].id];
let MS=null;   // the mission being fought (game.mission points at it too)

function startStory(i){
  const D=STORY[i]; if(!D||!storyUnlocked(i)) return;
  closeMenu(); game.campFight=null; game.tutorial=null; game.size=0;
  const side=FACTIONS[settings.side]?settings.side:'order', foe=D.id==='elderwood'?(side==='wild'?'chaos':'wild'):otherSide(side);
  game.mode='battle'; setFactions(side,foe); syncModeUI(); setTab('battle'); setTerrain('riverlands');
  resetBattle({gold:[D.gold,D.foeGold],enemyExtra:D.extra||0});
  MS={i,id:D.id,D,t:0,state:null,lost:0,held:0,arrived:0,wave:0,fired:{}}; game.mission=MS;
  game.auto=[settings.auto,!D.passive]; syncBattleButtons();
  storySetup(MS);
  showBanner(D.name,D.place,2.6); sfx('horn');
  setTimeout(()=>{ if(game.mission===MS&&game.over<=0) toast(D.brief,null,null,10); },900);
  storyHud(true);
}
const ring2=(x,z)=>({x,z});
function spawnSquad(team,types,x,z,spread){ const out=[]; for(const ty of types){ const u=spawn(ty,team,x+rand(-spread,spread),z+rand(-spread,spread)); out.push(u); } return out; }
function storySetup(M){
  const me=0, foe=1;
  if(M.id==='bridge'){ M.P=ring2(-13,0);
    spawnSquad(me,[storyRole(me,'heavy'),storyRole(me,'heavy'),storyRole(me,'heavy'),storyRole(me,'heavy'),storyRole(me,'melee'),storyRole(me,'melee'),storyRole(me,'melee'),storyRole(me,'melee'),storyRole(me,'ranged'),storyRole(me,'ranged'),storyRole(me,'ranged'),storyRole(me,'ranged'),storyRole(me,'ranged')],-20,0,4);
    for(const r of regs) if(r.team===me&&!r.hero&&regAlive(r).some(u=>Math.hypot(u.pos.x+20,u.pos.z)<9)) orderMove(r,{x:-17+rand(-2,2),z:rand(-5,5)},true); }
  else if(M.id==='escort'){ M.P=ring2(-58,76);
    const path=[{x:-96,z:26},{x:-84,z:42},{x:-72,z:56},{x:-62,z:68},{x:-58,z:76}];
    M.miners=[]; for(let i=0;i<6;i++){ const u=spawn(storyRole(me,'worker'),me,-108+(i%2)*1.4,16-Math.floor(i/2)*1.6); u.escort=true;
      u.script={pts:path.map(p=>new V3(p.x+rand(-.8,.8),0,p.z+rand(-.8,.8))),i:0,speed:0,then:v=>{ v.escortDone=true; M.arrived++; puff(v.pos,8,.25,1.4,'#ffd36a'); }}; M.miners.push(u); }
    const esc=spawnSquad(me,[storyRole(me,'melee'),storyRole(me,'melee'),storyRole(me,'melee'),storyRole(me,'melee'),storyRole(me,'melee'),storyRole(me,'melee'),storyRole(me,'ranged'),storyRole(me,'ranged'),storyRole(me,'ranged'),storyRole(me,'ranged'),storyRole(me,'heavy')],-104,12,3);
    M.escRegs=[...new Set(esc.map(u=>u.reg).filter(Boolean))]; M.go=20;   // the column sets off after 20 s; the escort keeps beside it until you order it elsewhere
    M.ambush=[{at:-90,ax:-72,az:20},{at:-80,ax:-98,az:62},{at:-68,ax:-44,az:54},{at:-61,ax:-72,az:96}]; }
  else if(M.id==='shrines'){ M.zones=['A','B','D']; }
  else if(M.id==='ogres'){ M.limit=480; spawnSquad(me,[storyRole(me,'heavy'),storyRole(me,'heavy'),storyRole(me,'melee'),storyRole(me,'melee'),storyRole(me,'melee'),storyRole(me,'melee'),storyRole(me,'ranged'),storyRole(me,'ranged'),storyRole(me,'ranged'),storyRole(me,'ranged')],-96,10,4); }
}
function storyEnd(win,why){
  const M=MS; if(!M||M.state) return; M.state=win?'won':'lost'; M.why=why;
  if(win){ const S=settings.story||(settings.story={done:{}}); S.done=S.done||{}; S.done[M.id]=1; saveSettings(); }
  game.winner=win?0:1; game.over=2.6; showBanner(win?'Mission complete':'Mission failed',why,2.4); narrate(win?'victory':'defeat'); sfx(win?'horn':'hornEnemy');
}
function storyTick(dt){
  const M=MS; if(!M||game.mission!==M||M.state||game.over>0) return; M.t+=dt;
  const me=0, foe=1;
  if(M.id==='bridge'){
    // waves every 40 s from the east bank
    if(M.wave<7&&M.t>15+M.wave*40){ M.wave++; const n=4+M.wave*2, L=[]; for(let i=0;i<n;i++) L.push(i%3===2?storyRole(foe,'ranged'):i%5===4?storyRole(foe,'heavy'):storyRole(foe,'melee'));
      spawnSquad(foe,L,30,rand(-6,6),4); for(const r of regs) if(r.team===foe&&!r.hero) r.order={kind:'charge'};
      alertPush('Wave '+M.wave+' of 7 crosses the river','danger',16,0,'wave'+M.wave); }
    let f=0,e=0; for(const u of units){ if(!u.alive||!u.isUnit||u.team>1) continue; if(Math.hypot(u.pos.x-M.P.x,u.pos.z-M.P.z)<12) u.team===me?f++:e++; }
    if(e&&!f) M.lost+=dt; else M.lost=Math.max(0,M.lost-dt*.5);
    if(M.lost>=20) storyEnd(false,'The bridgehead fell'); else if(M.t>=300) storyEnd(true,'The bridge held'); }
  else if(M.id==='escort'){
    if(M.go>0){ M.go-=dt; if(M.go<=0){ for(const u of M.miners) if(u.alive&&u.script) u.script.speed=2.1; alertPush('The column sets off for Ashford','hero',-100,20); } }
    const c=M.miners.filter(u=>u.alive&&!u.escortDone), cx=c.length?c.reduce((a,u)=>a+u.pos.x,0)/c.length:-58;
    M.escT=(M.escT||0)-dt; if(M.escT<=0&&c.length){ M.escT=2.5; const cz=c.reduce((a,u)=>a+u.pos.z,0)/c.length; let k=0;
      for(const r of M.escRegs){ if(!regAlive(r).length) continue; const o=r.order; if(o!==r._auto&&o.kind!=='army') continue; const side=(k++%2?1:-1)*6; orderMove(r,{x:cx+side*.6,z:cz-side},true); r._auto=r.order; } }
    for(const A of M.ambush) if(!A.done&&M.go<=0&&cx>A.at){ A.done=true; const sq=spawnSquad(foe,[storyRole(foe,'melee'),storyRole(foe,'melee'),storyRole(foe,'melee'),storyRole(foe,'ranged')],A.ax,A.az,3);
      for(const r of regs) if(r.team===foe&&sq.some(u=>u.reg===r)) r.order={kind:'charge'}; alertPush('Raiders in the woods!','danger',A.ax,A.az); }
    const alive=M.miners.filter(u=>u.alive).length;
    if(M.arrived>=3) storyEnd(true,M.arrived+' of 6 miners reached Ashford'); else if(alive<3) storyEnd(false,'Too many miners fell'); }
  else if(M.id==='shrines'){
    const all=M.zones.every(id=>{ const Z=RL.zones.find(z=>z.id===id); return Z&&Z.owner===me; });
    if(all) M.held+=dt; if(M.held>=60) storyEnd(true,'All three shrines held for a minute'); else if(M.t>=720) storyEnd(false,'Time ran out'); }
  else if(M.id==='ogres'){
    const dens=RL_NCAMPS.filter(C=>C.kind==='ogres'), done=dens.filter(C=>C.cleared).length; M.held=done;
    if(done>=dens.length) storyEnd(true,'Both dens cleared'); else if(M.t>=M.limit) storyEnd(false,'Time ran out'); }
  storyHud();
}
// the objective panel
function storyHud(force){
  const el=$('#mission'); if(!el) return; const M=MS;
  if(!M||game.mission!==M||game.mode!=='battle'){ el.hidden=true; return; }
  M.hT=(M.hT||0)-1; if(!force&&M.hT>0) return; M.hT=6;
  el.hidden=false; const mm=s=>fmtTime(Math.max(0,s));
  let goal='', prog=0, sub='';
  if(M.id==='bridge'){ goal='Hold the bridgehead'; prog=M.t/300; sub=mm(300-M.t)+' left · wave '+M.wave+' of 7'+(M.lost>0?' · bridgehead under threat '+Math.ceil(20-M.lost)+' s':''); }
  else if(M.id==='escort'){ const alive=M.miners?M.miners.filter(u=>u.alive).length:6; goal='Bring 3 miners to Ashford'; prog=M.arrived/3; sub=(M.go>0?'the column sets off in '+Math.ceil(M.go)+' s · ':'')+M.arrived+' arrived · '+alive+' alive'; }
  else if(M.id==='shrines'){ goal='Hold A, B and D together'; prog=M.held/60; sub=Math.floor(M.held)+' / 60 s held · '+mm(720-M.t)+' left'; }
  else if(M.id==='ogres'){ goal='Clear both ogre dens'; prog=(M.held||0)/2; sub=(M.held||0)+' of 2 cleared · '+mm((M.limit||480)-M.t)+' left'; }
  else { goal='Destroy the enemy statue'; const st=statues[1]; prog=st?1-st.hp/st.max:0; sub='statue '+(st?Math.ceil(st.hp):0)+' / '+(st?Math.ceil(st.max):0); }
  el.innerHTML='<b>'+M.D.name+'</b><span>'+goal+'</span><i class="mbar"><i style="width:'+(100*clamp(prog,0,1)).toFixed(1)+'%"></i></i><small>'+sub+'</small>';
}
// the objective on the field: a ring of light
function storyDraw(){
  const M=MS; if(!M||game.mission!==M||game.mode!=='battle'||M.state) return;
  const pts=[]; if(M.P) pts.push([M.P.x,M.P.z,M.id==='bridge'?12:6]);
  if(M.id==='escort'&&M.miners) for(const u of M.miners) if(u.alive&&!u.escortDone){ _op1.set(u.pos.x,u.pos.y+2.3*u.s,u.pos.z); _s.setScalar(.14); _m.compose(_op1,_qi,_s); put(glowIM,scol('#ffe08a')); }
  if(M.id==='shrines') for(const id of M.zones){ const Z=RL.zones.find(z=>z.id===id); if(Z) pts.push([Z.x,Z.z,RL_ZR+1]); }
  if(M.id==='ogres') for(const C of RL_NCAMPS) if(C.kind==='ogres'&&!C.cleared) pts.push([C.x,C.z,9]);
  const tt=game.time;
  for(const [x,z,R] of pts) for(let i=0;i<36;i++){ const a=i/36*TAU+tt*.2; _op1.set(x+Math.cos(a)*R,0,z+Math.sin(a)*R); _op1.y=H(_op1.x,_op1.z)+.15; _s.setScalar(.16); _m.compose(_op1,_qi,_s); put(glowIM,scol('#ffe08a')); }
}
// the mission list in the menu
function renderStory(){
  const box=$('#storyList'); if(!box) return; const done=storyDone();
  box.innerHTML=STORY.map((D,i)=>{ const open=storyUnlocked(i), ok=!!done[D.id];
    return '<button class="story'+(ok?' done':'')+'" data-i="'+i+'"'+(open?'':' disabled')+'><span class="sn">'+(i+1)+'</span><span class="st"><b>'+D.name+'</b><small>'+(open?D.brief:'Win the mission before to unlock it')+'</small></span><span class="ss">'+(ok?'✓':open?'▶':'🔒')+'</span></button>'; }).join('');
  if(box.querySelectorAll) box.querySelectorAll('button.story').forEach(b=>b.addEventListener('click',()=>{ sfx('ui'); startStory(+b.dataset.i); }));
}
