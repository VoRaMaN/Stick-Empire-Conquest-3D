/* ================= The enemy general's mind: difficulty and personality (v0.33) =================
   Difficulty no longer means only a bigger purse. It changes how the computer general thinks:
     Recruit   how often he reads your army and counter-picks it (Easy rarely, Brutal always)
     Tempo     how quickly he reacts (orders every 4 s on Easy, every 0.8 s on Brutal)
     Nerve     when he commits to a charge and when he pulls a beaten army back
     Research  how keenly he spends on upgrades
     Tactics   from Hard up: focus fire on your casters and archers, wounded regiments pulled out of the line,
               a flanking detachment sent round your army onto your archers; Brutal adds feints and harassment
   His gold income is the same at every level.
   Personalities (Settings and the skirmish screen; Auto picks one per battle):
     Rusher  few miners, cheap fast troops, charges early and keeps charging
     Turtle  a fat economy behind his walls, ranged and heavy troops, upgrades first, one great push when full
     Raider  fast detachments (Ninjas, Hounds, Knights, Wing Archers…) hunt your miners and your back line
             while the main army holds; he strikes where you are not
     Balanced  the general of v0.32 */
const AI_DIFF={
  easy:{name:'Easy',tick:4,counter:.25,research:.3,chargeAdv:1.0,chargeMin:900,fallback:.45,tactics:0,focus:0,abilityCd:2.2},
  normal:{name:'Normal',tick:2,counter:.75,research:.8,chargeAdv:1.25,chargeMin:1500,fallback:.6,tactics:0,focus:.2,abilityCd:1},
  hard:{name:'Hard',tick:1.2,counter:.95,research:1,chargeAdv:1.35,chargeMin:1700,fallback:.72,tactics:1,focus:.7,abilityCd:.8},
  brutal:{name:'Brutal',tick:.8,counter:1,research:1,chargeAdv:1.3,chargeMin:1600,fallback:.78,tactics:2,focus:1,abilityCd:.6}};
const AI_PERS={
  balanced:{name:'Balanced',workers:0,chargeK:1,full:1,mix:null,raid:0},
  rusher:{name:'Rusher',workers:-2,chargeK:.7,full:.7,mix:{inf:1.5,fast:1.8,cav:1.4,heavy:.6,rng:.7,sup:.5,cast:.6},raid:0,noFallback:.4,desc:'charges early and keeps charging'},
  turtle:{name:'Turtle',workers:2,chargeK:1.6,full:1.25,mix:{rng:1.7,pike:1.5,heavy:1.3,cast:1.3,sup:1.3,fast:.5,cav:.6},raid:0,research:1.5,desc:'digs in behind its walls, then one great push'},
  raider:{name:'Raider',workers:0,chargeK:1.2,full:1.1,mix:{fast:2,cav:1.8,air:1.6,rng:1,inf:.7,heavy:.6},raid:1,desc:'hunts your miners and your back line'}};
const AIM={said:false,pers:['balanced','balanced'],raidT:[0,0],flankT:[0,0],focusT:[0,0],feintT:[0,0]};
const aiDiff=()=>AI_DIFF[settings.aiDiff]||AI_DIFF.normal;
const aiPers=t=>AI_PERS[AIM.pers[t]]||AI_PERS.balanced;
// a new battle: the general's character (Auto: by difficulty, a little more cunning the harder it is)
function aiMindReset(){
  AIM.said=false; if(game.classicMix){ AIM.pers=['balanced','balanced']; return; }   // the regression battle keeps the old general (and its random numbers)
  for(const t of [0,1]){ const p=settings.aiPers;
    if(p&&AI_PERS[p]) AIM.pers[t]=p;
    else { const L=settings.aiDiff==='easy'?['balanced','rusher','turtle']:['balanced','rusher','turtle','raider','raider']; AIM.pers[t]=L[Math.floor(Math.random()*L.length)]; }
    AIM.raidT[t]=AIM.flankT[t]=AIM.focusT[t]=AIM.feintT[t]=0; }
}
function aiMindLabel(t){ const P=aiPers(t); return aiDiff().name+' · '+P.name; }
// the recruit, as this general would choose it
function aiPickMind(t,cands){
  const D=aiDiff(), P=aiPers(t), C=AIE.comp[t], g=game.gold[t];
  if(Math.random()>D.counter||!C) { // he doesn't read your army: his habits only
    let best=null, bs=-1; for(const c of cands){ const s=(P.mix&&P.mix[aiRole(c)]||1)*(.7+Math.random()*.6); if(s>bs){ bs=s; best=c; } } return best; }
  let best=null, bs=-1;
  for(const c of cands){ const B=AI_BEATS[aiRole(c)]||{}; let s=1; for(const k in C) s+=C[k]*(B[k]||0)*1.6*(.6+D.counter*.6);
    if(C.air&&TYPES[c]&&TYPES[c].antiAir) s+=C.air*2.2*D.counter;   // flyers on the field: the anti-air troops
    const cost=TYPES[c].cost; if(cost>g*1.6&&g<1200) s*=.55; else if(g>2000&&cost>=250) s*=1.25;
    s*=P.mix&&P.mix[aiRole(c)]||1; s*=.85+Math.random()*.3*(1.3-D.counter);
    if(s>bs){ bs=s; best=c; } }
  return best; }
// the charge and the fallback, by nerve and character
function aiChargeRule(t,mine,theirs,full,threat){
  const D=aiDiff(), P=aiPers(t), bt=game.bt||0;
  if(P===AI_PERS.rusher&&bt>35&&mine>Math.max(500,theirs*.85)) return 'charge';
  if(P===AI_PERS.turtle&&!full&&!threat&&mine<theirs*1.9) return 'hold';
  if(mine>Math.max(D.chargeMin*P.chargeK,theirs*D.chargeAdv*P.chargeK)||full||(threat&&mine>theirs)) return 'charge';
  if(mine<theirs*(P.noFallback||D.fallback)&&!full) return 'fallback';
  return null; }
// tactics from Hard up, and the Raider's hunts
function aiTactics(t){
  const D=aiDiff(), P=aiPers(t), now=game.time, foe=1-t, mine=regs.filter(r=>r.team===t&&!r.hero&&regAlive(r).length);
  if(!mine.length) return;
  const center=r=>regCenter(r), dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const foes=units.filter(u=>u.alive&&u.team===foe&&u.isUnit&&!u.inCastle);
  // focus fire: archers and casters shoot the most valuable soft target in reach
  if(D.focus>0&&AIM.focusT[t]<now&&Math.random()<D.focus){ AIM.focusT[t]=now+5;
    for(const r of mine){ const T=TYPES[r.type]; if(!T||!T.ranged) continue; const c=center(r); let best=null, bs=0;
      for(const o of foes){ const d=dist(c,o.pos); if(d>(T.range||10)+4) continue; const sc=(o.T.ranged||o.T.support||o.T.staff?2:1)*(o.T.cost/200)*(1.6-o.hp/o.maxHp)/(1+d*.05); if(sc>bs){ bs=sc; best=o; } }
      if(best&&!(r.order&&r.order.kind==='move')) r.order={kind:'attack',unit:best,ai:1}; } }
  if(D.tactics>=1){
    // a regiment cut to pieces leaves the line
    for(const r of mine){ const A=regAlive(r), n0=r.n0||(r.n0=Math.max(A.length,1)); if(A.length<=Math.max(1,n0*.3)&&r.order&&r.order.kind==='attack'&&!r.order.aiHelp) r.order={kind:'army'}; else if(A.length>n0) r.n0=A.length; }
    // the flank: fast troops go round onto your archers
    if(AIM.flankT[t]<now){ AIM.flankT[t]=now+(D.tactics>=2?18:28);
      const arch=foes.filter(o=>o.T.ranged&&!isAir(o)); const fast=mine.filter(r=>{ const ro=aiRole(r.type); return (ro==='fast'||ro==='cav')&&!(r.order&&r.order.kind==='attack'); });
      if(arch.length&&fast.length){ const tgt=arch[Math.floor(Math.random()*arch.length)]; for(const r of fast.slice(0,D.tactics>=2?2:1)) r.order={kind:'attack',unit:tgt,ai:1}; } }
  }
  // the Raider (and a Brutal general of any kind now and then) hunts the miners
  if((P.raid||D.tactics>=2&&Math.random()<.3)&&AIM.raidT[t]<now){ AIM.raidT[t]=now+(P.raid?16:30);
    const miners=foes.filter(o=>o.T.worker); const fast=mine.filter(r=>{ const ro=aiRole(r.type); return (ro==='fast'||ro==='cav'||ro==='air')&&!(r.order&&r.order.kind==='attack'&&r.order.raid); });
    if(miners.length&&fast.length){ const m=miners[Math.floor(Math.random()*miners.length)]; for(const r of fast.slice(0,P.raid?2:1)) r.order={kind:'attack',unit:m,ai:1,raid:1};
      if(t!==myTeam()&&game.mode==='battle'&&!game.demo&&Math.random()<.6) alertPush('Raiders are going for your miners!','warn',m.pos.x,m.pos.z,'aiRaid'); } }
}
// called once per battle start (resetBattle) and from the commander
function aiTick(t){ if(game.classicMix) return;
  if(!AIM.said&&t===1&&!game.demo&&!NET.on){ AIM.said=true; const P=aiPers(1); alertPush('Enemy general: '+P.name+' ('+aiDiff().name+')'+(P.desc?' — '+P.desc:''),'info',undefined,undefined,'aiGeneral'); }
  aiTactics(t); }
