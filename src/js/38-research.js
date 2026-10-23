/* ================= Research & upgrades (the Stick Empires model), mana, narrator, building panel =================
   Every building researches its own upgrades, one at a time, for gold and mana. Effects only ever add to the
   original units (rage, shield wall, fire arrows, giant growth…); the newer units' special spells are unlocked
   here. The Finisher Lab ignores research (everything unlocked), and the classic regression battle has none. */
const RESEARCH={
  castle:[
    {id:'castleArchers',name:'Castle Archers',cname:'Wall Harvesters',lv:3,cost:[[300,0],[450,100],[650,200]],t:[14,20,26],desc:'Two more archers man the battlements',cdesc:'Two more Soul Harvesters man the battlements'},
    {id:'income',name:'Passive Income',lv:3,cost:[[250,0],[450,80],[700,160]],t:[14,20,26],desc:'+3 gold and +1.5 mana every second'},
    {id:'resilience',name:'Resilience',lv:1,cost:[[500,120]],t:[24],desc:'The statue gains 40% more health'},
  ],
  mine:[{id:'hustle',name:'Miner Hustle',lv:1,cost:[[300,0]],t:[16],desc:'Miners dig faster and carry 80 gold a trip'}],
  barracks:[
    {id:'rage',name:'Rage',lv:1,cost:[[400,100]],t:[20],desc:'Swordsmen fly into a rage at close quarters: faster, +30% damage'},
    {id:'shieldWall',nofac:'wild',name:'Shield Wall',lv:1,cost:[[500,60]],t:[22],desc:'Spartans holding formation take 35% less damage (50% from arrows)'},
  ],
  range:[
    {id:'fireArrows',name:'Fire Arrows',lv:1,cost:[[500,150]],t:[22],desc:'Archers light their arrows; targets burn'},
    {id:'volley',name:'Volley Drill',lv:1,cost:[[350,50]],t:[16],desc:'Archers, including the garrison, deal 20% more damage'},
  ],
  dojo:[{id:'shinobi',name:'Shinobi',lv:1,cost:[[400,150]],t:[20],desc:'Ninjas learn to vanish and strike from the shadows'}],
  mage:[
    {id:'ewall',name:'Electric Wall',lv:1,cost:[[500,250]],t:[24],desc:'Wizards raise a crackling wall of lightning'},
    {id:'poison',name:'Poison Spray',lv:1,cost:[[400,200]],t:[20],desc:'Wizards spray poison over packed enemies'},
  ],
  temple:[{id:'cure',name:'Cure',lv:1,cost:[[300,150]],t:[16],desc:'Clerics cleanse poison and burning'},
    {id:'grove',name:'Call of the Forest',lv:1,cost:[[450,150]],t:[24],desc:'Druids can summon Treants out of the ground (ability bar, I): two in a forest, for 40 s',fac:'wild'}],
  aerie:[{id:'blazing',name:'Blazing Bolts',lv:1,cost:[[500,200]],t:[22],desc:'Wing Archers loose burning bolts'},
    {id:'wyArts',name:"Knight's Arts",lv:1,cost:[[600,200]],t:[26],desc:"Wyvern Knights learn Royal Lance Charge, Aerial Execution, Shield of the Crown, Royal Pursuit and King's Judgment, and use them on their own"},
    {id:'wyMastery',name:'Wyvern Mastery',lv:1,cost:[[650,220]],t:[28],desc:"Wyverns learn Infernal Breath, Talon Dive, Wingstorm, Predator's Screech and Aerial Assault, and use them on their own"}],
  prison:[{id:'growth',name:'Giant Growth',lv:2,cost:[[600,200],[900,300]],t:[24,32],desc:'Giants grow 12% bigger and 30% tougher'}],
  // Chaos (prices in souls)
  quarry:[{id:'soulSiphon',name:'Soul Siphon',lv:1,cost:[[120,0]],t:[16],desc:'Thralls dig faster and haul more crystals a trip',native:1}],
  pit:[{id:'magmaClaws',name:'Magma Claws',lv:1,cost:[[170,100]],t:[20],desc:'Hellcrawler claws set their prey on fire',native:1},
    {id:'cerbRider',name:'Hell Riders',lv:1,cost:[[240,180]],t:[28],desc:'An armoured rider with a lance mounts every Cerberus: +150 health, 15% less damage, lance thrusts of its own',native:1}],
  forge:[{id:'hellCleave',name:'Hellforged Cleave',lv:1,cost:[[200,120]],t:[22],desc:'Dreadguards sweep a white-hot cleave that breaks a line and its shield wall',native:1},
    {id:'infernalPlate',name:'Infernal Plate',lv:1,cost:[[210,80]],t:[22],desc:'Dreadguards take 20% less damage',native:1}],
  spire:[{id:'soulRend',name:'Soul Rend',lv:1,cost:[[170,150]],t:[20],desc:'Soul fragments curse what they hit: it takes 25% more damage for 5 s',native:1}],
};
const rName=(R,team)=>R.cname&&facOf(team)==='chaos'?R.cname:R.name, rDesc=(R,team)=>R.cdesc&&facOf(team)==='chaos'?R.cdesc:R.desc;
const RES_BY_ID={}; for(const k in RESEARCH) for(const r of RESEARCH[k]) RES_BY_ID[r.id]=Object.assign({bid:k},r);
const MANA_COST={wizard:75,cleric:40,wing:40,oracle:40,hades:100,knight:80};   // v0.31: the wyvern costs mana too
const unitMana=t=>castleOn()?(MANA_COST[t]||0):0;
function resLvl(team,id){ if(game.mode==='duel') return RES_BY_ID[id]?RES_BY_ID[id].lv:1; if(game.classicMix||!CASTLES[team]) return 0; return CASTLES[team].res[id]||0; }
const hasRes=(team,id)=>resLvl(team,id)>0;
function researchScale(team,type){ return type==='giant'?1+.12*resLvl(team,'growth'):1; }
function researchApplyUnit(u){ if(u.type==='cerberus'&&game.mode==='battle'&&hasRes(u.team,'cerbRider')) mountRider(u); if(u.type==='giant'){ const k=1+.3*resLvl(u.team,'growth'); if(k!==1){ u.hp*=k; u.maxHp*=k; } } }
function researchTrainMul(){ return 1; }
// damage modifiers: the attacker's upgrades and the target's (called from damage())
function resDamageMul(t,src){
  if(game.classicMix||game.mode!=='battle') return 1;
  let k=1;
  if(src&&src.team!==undefined){ if(src.rage>0) k*=1.3; if(src.type==='archer'&&hasRes(src.team,'volley')) k*=1.2; }
  if(t.type==='spear'&&hasRes(t.team,'shieldWall')&&t.spd<1.2&&game.stance[t.team]!=='charge'&&!(t.brokeT>game.time)) k*=src&&src.T&&src.T.ranged?.5:.65;
  if(t.st&&t.st.rend) k*=1.25;                                         // Soul Rend
  if(t.type==='dread'&&hasRes(t.team,'infernalPlate')) k*=.8;
  k*=cavMul(t,src);
  return k;
}
// swordsmen with Rage: a red-eyed burst of speed and fury when the enemy is close
function rageTick(u,dt){
  if(u.rage>0){ u.rage-=dt; u.desired.multiplyScalar(1.3); if(Math.random()<dt*6) puff(u.j.chest,1,.1,.6,'#d8321e'); }
  u.rageCd=(u.rageCd||0)-dt;
  if(u.rageCd<=0&&u.target&&u.target.alive&&hasRes(u.team,'rage')&&Math.hypot(u.target.pos.x-u.pos.x,u.target.pos.z-u.pos.z)<5){
    u.rage=6; u.rageCd=18; callout(u,'Rage!','#ff5a3a'); puff(u.j.chest,6,.16,1.6,'#d8321e'); sfx('rage',u.j.head,.8); }
}

/* ---------- starting and finishing research ---------- */
function resBuilding(team,bid){ const C=CASTLES[team]; return bid==='castle'?C.keep:C.B[bid]; }
const resFits=(R,fac)=>!(R.fac&&R.fac!==fac)&&!(R.nofac&&R.nofac===fac);
function resNext(team,id){ const R=RES_BY_ID[id]; if(!R||!resFits(R,facOf(team))||!resBuilding(team,R.bid)) return null; const l=CASTLES[team].res[id]||0; return l<R.lv?{R,l,cost:[Math.round(R.cost[l][0]*(R.native?1:econ(team))),R.cost[l][1]],t:R.t[l]}:null; }
function startResearch(team,id){
  const R=RES_BY_ID[id], b=resBuilding(team,R.bid), N=R&&b?resNext(team,id):null, me=team===myTeam();
  if(!N) return false;
  if(b.res){ if(me){ narrate('researchBusy',3); sfx('deny'); } return false; }
  if(game.gold[team]<N.cost[0]){ if(me){ narrate('noGold',3); sfx('deny'); } return false; }
  if(game.mana[team]<N.cost[1]){ if(me){ narrate('noMana',3); sfx('deny'); } return false; }
  game.gold[team]-=N.cost[0]; game.mana[team]-=N.cost[1];
  b.res={id,lvl:N.l+1,t:N.t,tot:N.t};
  if(me){ sfx('buy'); refreshPanel(); }
  return true;
}
function finishResearch(C,b){
  const r=b.res, t=C.team; b.res=null; C.res[r.id]=r.lvl;
  if(r.id==='castleArchers') syncGarrison(C);
  if(r.id==='cerbRider') for(const u of units) if(u.alive&&u.team===t&&u.type==='cerberus') mountRider(u);
  if(r.id==='resilience'){ const st=statues[t]; if(st){ const add=st.max*.4; st.max+=add; st.hp+=add; } }
  if(NET.host||NET.rec) netCapEvent(['rs',t,r.id,r.lvl]);
  if(t===myTeam()){ sfx('research',null,.9); narrate(r.id==='castleArchers'?'castleArchers':(C.nDone=(C.nDone||0)+1)%2?'researchDone':'upgradeDone',0);
    const R=RES_BY_ID[r.id]; alertPush('Research complete: '+rName(R,t),'good',undefined,undefined); showBanner(rName(R,t)+(R.lv>1?' '+['I','II','III'][r.lvl-1]:''),'research complete',1.4); refreshPanel(); }
}
function updateResearch(C,dt){
  for(const b of [...C.list,C.keep]) if(b.res){ b.res.t-=dt; if(b.res.t<=0) finishResearch(C,b); }
}
// the Crimson general researches too: cheap economy first, then upgrades for the troops it fields
// The general saves up for one upgrade at a time (his recruiting pauses for up to 25 s while he does).
const aiSave=[null,null];
function aiResearch(team){
  if(!castleOn()) return;
  const sv=aiSave[team];
  if(sv){ const N=resNext(team,sv.id), b=N&&resBuilding(team,N.R.bid);
    if(!N||game.time>sv.until){ aiSave[team]=null; return; }
    if(!b.res&&game.gold[team]>=N.cost[0]&&game.mana[team]>=N.cost[1]){ startResearch(team,sv.id); aiSave[team]=null; }
    return; }
  if(Math.random()>.45*(game.classicMix?1:aiDiff().research*(aiPers(team).research||1))||game.time<(aiSave['n'+team]||0)) return;   // a keener general researches more (34c)
  const have={}; for(const u of units) if(u.alive&&u.team===team&&u.isUnit) have[u.type]=1;
  const want=facOf(team)==='chaos'?['income','castleArchers','soulSiphon','soulRend','hellCleave','magmaClaws','infernalPlate','cerbRider','resilience','income','castleArchers']
    :facOf(team)==='wild'?['income','castleArchers','hustle','volley','rage','fireArrows','grove','growth','resilience','cure','shinobi','wyArts','wyMastery','income','castleArchers']
    :['income','castleArchers','hustle','volley','rage','shieldWall','fireArrows','growth','resilience','cure','shinobi','poison','ewall','blazing','wyArts','wyMastery','income','castleArchers'];
  const UNIT_OF={hustle:'miner',rage:'sword',shieldWall:'spear',fireArrows:'archer',volley:'archer',growth:'giant',cure:'cleric',grove:'cleric',shinobi:'ninja',poison:'wizard',ewall:'wizard',blazing:'wing',wyArts:'knight',wyMastery:'knight',
    soulSiphon:'thrall',magmaClaws:'crawler',hellCleave:'dread',infernalPlate:'dread',soulRend:'harvester'};
  for(const id of want){ const N=resNext(team,id); if(!N) continue; if(UNIT_OF[id]&&!have[UNIT_OF[id]]) continue;
    const b=resBuilding(team,N.R.bid); if(b.res) continue;
    aiSave[team]={id,until:game.time+25}; aiSave['n'+team]=game.time+20; return; }
}
const aiSaving=team=>!!aiSave[team];
// gold and mana trickle in during a castle battle
function resetAiResearch(){ aiSave[0]=aiSave[1]=null; aiSave.n0=aiSave.n1=0; }
function castleIncome(dt){
  if(!castleOn()||game.over>0||NET.guest) return;
  for(let t=0;t<2;t++){ const l=CASTLES[t].res.income||0; game.mana[t]+=(2.5+1.5*l)*dt; if(l) game.gold[t]+=3*l*dt*econ(t); }
}

/* ---------- narrator and unit voices (ElevenLabs lines, decoded after the first tap) ---------- */
const VOX={buf:{},ch:{n:null,u:null},last:{},said:{}};
function playVoice(name,vol,chan){
  const c=audio.ctx, b=VOX.buf[name]; if(!b||!c||!audio.ready||c.state!=='running') return false;
  const old=VOX.ch[chan]; if(old){ try{ old.stop(); }catch(e){} }
  const src=c.createBufferSource(); src.buffer=b; const g=c.createGain(); g.gain.value=vol;
  src.connect(g); g.connect(audio.voiceBus||audio.master); src.start();
  VOX.ch[chan]=src; audio.talk=(audio.talk||0)+1; applyVolumes();
  src.onended=()=>{ if(VOX.ch[chan]===src) VOX.ch[chan]=null; audio.talk=Math.max(0,(audio.talk||1)-1); applyVolumes(); try{ src.disconnect(); g.disconnect(); }catch(e){} };
  return true;
}
// the old wizard who narrates the battle; cool = seconds before the same line may repeat
function narrate(key,cool){
  if(game.demo||game.mode!=='battle'||!settings.voice) return;
  const now=performance.now()/1000; if(cool&&now-(VOX.last[key]||-1e9)<cool) return;
  if(playVoice('n_'+key,1.05,'n')) VOX.last[key]=now;
}
function unitVoice(type){ if(!settings.voice) return; playVoice('u_'+type+'_'+(1+Math.floor(Math.random()*3)),.9,'u'); }

/* ---------- buying: the dock chips and the building panel share this ---------- */
function buyUnit(t){ return issue('buy',{t}); }   // the dock and the building panel: offline it buys at once, online it asks the host
// the purchase itself, checked against this team's roster, population, treasury and mana (the online host runs it for every player)
function buyFor(team,t,quiet){
  const T=TYPES[t], m=unitMana(t), me=!quiet&&team===myTeam();
  if(!T||!FAC(team).roster.includes(t)) return 'not_in_roster';
  if(count(team)+queued(team)>=POP_CAP){ if(me){ narrate('fullStrength',6); sfx('deny'); } return 'population'; }
  if(game.gold[team]<T.cost){ if(me){ narrate('noGold',3); sfx('deny'); } return 'gold'; }
  if(game.mana[team]<m){ if(me){ narrate('noMana',3); sfx('deny'); } return 'mana'; }
  game.gold[team]-=T.cost; game.mana[team]-=m; recruit(t,team); onRecruit(t);
  if(me){ sfx('buy'); unitVoice(t); }
  if(panelB) refreshPanel();
  return true;
}

/* ---------- building panel (tap a building) and hover outline/tooltip (mouse) ---------- */
let panelB=null, hoverB=null, panelT=0;
const bpEl=$('#bpanel'), tipEl=$('#btip');
function refreshEmblemCss(){ if(EMBLEM_URL&&document.documentElement&&document.documentElement.style&&document.documentElement.style.setProperty) document.documentElement.style.setProperty('--emb','url('+EMBLEM_URL+')'); }
const embPos=i=>(i%3)*50+'% '+Math.floor(i/3)*50+'%';
function costTxt(g,m,team){ return g+' '+money(team||0)+(m?' · '+m+' mana':''); }
function openPanel(b){
  panelB=b; if(!bpEl) return; bpEl.hidden=false; sfx('ui');
  $('#bpEmb').style.backgroundPosition=embPos(b.emb); $('#bpEmb').style.backgroundImage=b.fac==='chaos'&&CHAOS_EMB_URL?'url('+CHAOS_EMB_URL+')':''; $('#bpName').textContent=b.name; $('#bpDesc').textContent=b.desc;
  const box=$('#bpUnits'); box.innerHTML=''; const trains=b.trains||[];
  $('#bpTrainSec').hidden=!trains.length;
  for(const t of trains){ const T=TYPES[t], btn=document.createElement('button'); btn.className='bpu'; btn.dataset.t=t;
    btn.innerHTML='<img alt="" src="'+(ICONS[t]||'')+'"><span class="n">'+tName(t)+'</span><span class="s">'+costTxt(T.cost,unitMana(t),myTeam())+'</span><span class="qn"></span>';
    btn.addEventListener('click',()=>buyUnit(t)); box.appendChild(btn); }   // costs shown in this army's currency
  const rb=$('#bpRes'); rb.innerHTML='';
  for(const R of RESEARCH[b.id]||[]){ if(!resFits(R,b.fac)) continue; const d=document.createElement('button'); d.className='bpr'; d.dataset.id=R.id;
    d.innerHTML='<span class="rn"></span><span class="rd">'+rDesc(R,myTeam())+'</span><span class="rc"></span><i class="rp"><b></b></i>';
    d.addEventListener('click',()=>{ issue('res',{id:R.id}); }); rb.appendChild(d); }
  refreshPanel();
}
function closePanel(){ panelB=null; if(bpEl) bpEl.hidden=true; }
function refreshPanel(){
  const b=panelB; if(!b||!bpEl||bpEl.hidden) return;
  const me=myTeam(), C=CASTLES[me];
  if(bpEl.querySelectorAll){
    bpEl.querySelectorAll('.bpu').forEach(el=>{ const t=el.dataset.t, q=queuedType(me,t);
      el.querySelector('.qn').textContent=q?('×'+q+' training'):''; el.classList.toggle('poor',game.gold[me]<TYPES[t].cost||game.mana[me]<unitMana(t)); });
    bpEl.querySelectorAll('.bpr').forEach(el=>{ const R=RES_BY_ID[el.dataset.id], l=C.res[R.id]||0, N=resNext(me,R.id), busy=b.res&&b.res.id===R.id;
      el.querySelector('.rn').textContent=rName(R,me)+(R.lv>1?' '+['I','II','III'][Math.min(R.lv-1,busy?b.res.lvl-1:l)]:'');
      el.querySelector('.rc').textContent=busy?'researching… '+Math.ceil(b.res.t)+'s':N?costTxt(N.cost[0],N.cost[1],me)+' · '+N.t+'s':'done';
      el.querySelector('.rp b').style.width=(busy?100*(1-b.res.t/b.res.tot):N?0:100)+'%';
      el.classList.toggle('done',!N); el.classList.toggle('busy',!!busy); el.classList.toggle('poor',!!N&&!busy&&(game.gold[me]<N.cost[0]||game.mana[me]<N.cost[1])); });
  }
  const gs=$('#bpGarr'); if(gs){ gs.hidden=b.id!=='castle'; if(b.id==='castle'){ const st=statues[me]; gs.textContent=C.garrison.length+(C.fac==='chaos'?' Soul Harvesters':' archers')+' on the walls · statue '+(st?Math.ceil(st.hp)+' / '+Math.ceil(st.max):''); } }
  const tr=$('#bpTrain'); if(tr){ const cur=b.train; tr.textContent=cur?'Training '+tName(cur.type)+' · '+Math.max(0,cur.t).toFixed(1)+'s':(b.q&&b.q.length?b.q.length+' waiting':''); }
}
function panelTick(dt){ panelT-=dt; if(panelT<=0){ panelT=.25; refreshPanel(); } }
if($('#bpClose')) $('#bpClose').onclick=()=>{ sfx('ui'); closePanel(); };

// ray against every building's world box; nearest hit wins
const _br=new THREE.Raycaster(), _bn=new THREE.Vector2(), _bh=new V3();
function pickBuilding(x,y){
  if(game.mode!=='battle'||!castleReady) return null;
  _bn.set(x/innerWidth*2-1,-(y/innerHeight)*2+1); _br.setFromCamera(_bn,camera);
  let best=null,bd=1e9;
  for(const C of CASTLES) for(const b of [...C.list,C.keep]){ const p=_br.ray.intersectBox(b.wbox,_bh); if(p){ const d=p.distanceTo(_br.ray.origin); if(d<bd){bd=d;best=b;} } }
  return best;
}
function setHover(b,x,y){
  if(hoverB!==b){ hoverB=b; if(canvas.style) canvas.style.cursor=b?'pointer':''; }
  if(!tipEl) return;
  if(!b){ tipEl.hidden=true; return; }
  const own=b.team===myTeam(), C=CASTLES[b.team];
  let sub=b.trains?'Trains '+b.trains.map(t=>tName(t,b.team)).join(', '):'Research: '+(C.fac==='chaos'?'wall harvesters':C.fac==='wild'?'wall rangers':'castle archers')+', income, resilience';
  if(own&&b.res) sub+=' · researching '+rName(RES_BY_ID[b.res.id],b.team);
  if(own&&b.train) sub+=' · training '+tName(b.train.type,b.team);
  const done=(RESEARCH[b.id]||[]).filter(R=>resFits(R,b.fac)&&(C.res[R.id]||0)>0).length;
  tipEl.innerHTML='<b>'+(own?'':teamName(b.team).split(' ')[0]+' ')+b.name+'</b><span>'+sub+'</span>'+(own?'<em>'+done+' of '+(RESEARCH[b.id]||[]).filter(R=>resFits(R,b.fac)).length+' upgrades · tap to open</em>':'');
  tipEl.hidden=false; tipEl.style.left=Math.min(innerWidth-250,x+16)+'px'; tipEl.style.top=Math.max(8,y-12)+'px';
}
canvas.addEventListener('pointermove',e=>{ if(e.pointerType!=='mouse'||e.buttons||game.paused){ if(hoverB&&e.buttons) setHover(null); return; } setHover(pickBuilding(e.clientX,e.clientY),e.clientX,e.clientY); });
canvas.addEventListener('pointerleave',()=>setHover(null));
// hover/selection effects: glowing outline, brighter windows, a soft gold pulse
const _wgc=new THREE.Color("#d98a3e"), _wgh=new THREE.Color("#ffe9a8"), _wgcC=new THREE.Color("#d8401a"), _wghC=new THREE.Color("#ffb070");
function castleFx(){
  const tt=game.time;
  for(const C of CASTLES) for(const b of C.list){ const on=b===hoverB||b===panelB;
    if(b.hull){ b.hull.visible=on; if(on) b.hull.material.opacity=.55+.3*Math.sin(tt*5); }
    if(b.glowMat){ const ch=b.fac==='chaos'; b.glowMat.color.copy(ch?_wgcC:_wgc).lerp(ch?_wghC:_wgh,on?.6+.4*Math.sin(tt*6):.05+.05*Math.sin(tt*2.3+b.bx)); if(emitK!==1) b.glowMat.color.multiplyScalar(emitK); } }
  for(const C of CASTLES) if(C.deco) for(const b of C.deco){ if(b.glowMat){ b.glowMat.color.copy(_wgcC).lerp(_wghC,.25+.2*Math.sin(tt*3.1+b.bx)); if(emitK!==1) b.glowMat.color.multiplyScalar(emitK); }
    if(b.fires) for(const f of b.fires){ _tp.set(cwx(C.team,f.x),CGY[C.team]+f.y,f.z); glowAt(_tp,.5+.12*Math.sin(tt*11+f.x),'#ff6a1e'); } }
  // torches by the gates
  for(const C of CASTLES) for(const p of C.torches){ _tp.set(cwx(C.team,p.x+.05),CGY[C.team]+p.y,p.z); glowAt(_tp,.22+.05*Math.sin(tt*13+p.z),C.fac==='chaos'?'#ff4a1a':'#ffa040'); }
  drawPits();
}
