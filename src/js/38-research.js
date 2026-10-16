/* ================= Research & upgrades (the Stick Empires model), mana, narrator, building panel =================
   Every building researches its own upgrades, one at a time, for gold and mana. Effects only ever add to the
   original units (rage, shield wall, fire arrows, giant growth…); the newer units' special spells are unlocked
   here. The Finisher Lab ignores research (everything unlocked), and the classic regression battle has none. */
const RESEARCH={
  castle:[
    {id:'castleArchers',name:'Castle Archers',lv:3,cost:[[300,0],[450,100],[650,200]],t:[14,20,26],desc:'Two more archers man the battlements'},
    {id:'income',name:'Passive Income',lv:3,cost:[[250,0],[450,80],[700,160]],t:[14,20,26],desc:'+3 gold and +1.5 mana every second'},
    {id:'resilience',name:'Resilience',lv:1,cost:[[500,120]],t:[24],desc:'The statue gains 40% more health'},
  ],
  mine:[{id:'hustle',name:'Miner Hustle',lv:1,cost:[[300,0]],t:[16],desc:'Miners dig faster and carry 80 gold a trip'}],
  barracks:[
    {id:'rage',name:'Rage',lv:1,cost:[[400,100]],t:[20],desc:'Swordsmen fly into a rage at close quarters: faster, +30% damage'},
    {id:'shieldWall',name:'Shield Wall',lv:1,cost:[[500,60]],t:[22],desc:'Spartans holding formation take 35% less damage (50% from arrows)'},
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
  temple:[{id:'cure',name:'Cure',lv:1,cost:[[300,150]],t:[16],desc:'Clerics cleanse poison and burning'}],
  aerie:[{id:'blazing',name:'Blazing Bolts',lv:1,cost:[[500,200]],t:[22],desc:'Wing Archers loose burning bolts'}],
  prison:[{id:'growth',name:'Giant Growth',lv:2,cost:[[600,200],[900,300]],t:[24,32],desc:'Giants grow 12% bigger and 30% tougher'}],
};
const RES_BY_ID={}; for(const k in RESEARCH) for(const r of RESEARCH[k]) RES_BY_ID[r.id]=Object.assign({bid:k},r);
const MANA_COST={wizard:75,cleric:40,wing:40};
const unitMana=t=>castleOn()?(MANA_COST[t]||0):0;
function resLvl(team,id){ if(game.mode==='duel') return RES_BY_ID[id]?RES_BY_ID[id].lv:1; if(game.classicMix||!CASTLES[team]) return 0; return CASTLES[team].res[id]||0; }
const hasRes=(team,id)=>resLvl(team,id)>0;
function researchScale(team,type){ return type==='giant'?1+.12*resLvl(team,'growth'):1; }
function researchApplyUnit(u){ if(u.type==='giant'){ const k=1+.3*resLvl(u.team,'growth'); if(k!==1){ u.hp*=k; u.maxHp*=k; } } }
function researchTrainMul(){ return 1; }
// damage modifiers: the attacker's upgrades and the target's (called from damage())
function resDamageMul(t,src){
  if(game.classicMix||game.mode!=='battle') return 1;
  let k=1;
  if(src&&src.team!==undefined){ if(src.rage>0) k*=1.3; if(src.type==='archer'&&hasRes(src.team,'volley')) k*=1.2; }
  if(t.type==='spear'&&hasRes(t.team,'shieldWall')&&t.spd<1.2&&game.stance[t.team]!=='charge') k*=src&&src.T&&src.T.ranged?.5:.65;
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
function resNext(team,id){ const R=RES_BY_ID[id], l=CASTLES[team].res[id]||0; return l<R.lv?{R,l,cost:R.cost[l],t:R.t[l]}:null; }
function startResearch(team,id){
  const R=RES_BY_ID[id], b=resBuilding(team,R.bid), N=resNext(team,id), me=team===0;
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
  if(r.id==='resilience'){ const st=statues[t]; if(st){ const add=st.max*.4; st.max+=add; st.hp+=add; } }
  if(t===0){ sfx('research',null,.9); narrate(r.id==='castleArchers'?'castleArchers':(C.nDone=(C.nDone||0)+1)%2?'researchDone':'upgradeDone',0);
    const R=RES_BY_ID[r.id]; showBanner(R.name+(R.lv>1?' '+['I','II','III'][r.lvl-1]:''),'research complete',1.4); refreshPanel(); }
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
  if(Math.random()<.55||game.time<(aiSave['n'+team]||0)) return;
  const have={}; for(const u of units) if(u.alive&&u.team===team&&u.isUnit) have[u.type]=1;
  const want=['income','castleArchers','hustle','volley','rage','shieldWall','fireArrows','growth','resilience','cure','shinobi','poison','ewall','blazing','income','castleArchers'];
  const UNIT_OF={hustle:'miner',rage:'sword',shieldWall:'spear',fireArrows:'archer',volley:'archer',growth:'giant',cure:'cleric',shinobi:'ninja',poison:'wizard',ewall:'wizard',blazing:'wing'};
  for(const id of want){ const N=resNext(team,id); if(!N) continue; if(UNIT_OF[id]&&!have[UNIT_OF[id]]) continue;
    const b=resBuilding(team,N.R.bid); if(b.res) continue;
    aiSave[team]={id,until:game.time+25}; aiSave['n'+team]=game.time+20; return; }
}
const aiSaving=team=>!!aiSave[team];
// gold and mana trickle in during a castle battle
function resetAiResearch(){ aiSave[0]=aiSave[1]=null; aiSave.n0=aiSave.n1=0; }
function castleIncome(dt){
  if(!castleOn()||game.over>0) return;
  for(let t=0;t<2;t++){ const l=CASTLES[t].res.income||0; game.mana[t]+=(2.5+1.5*l)*dt; if(l) game.gold[t]+=3*l*dt; }
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
function buyUnit(t){
  const T=TYPES[t], m=unitMana(t);
  if(count(0)+queued(0)>=POP_CAP){ narrate('fullStrength',6); sfx('deny'); return false; }
  if(game.gold[0]<T.cost){ narrate('noGold',3); sfx('deny'); return false; }
  if(game.mana[0]<m){ narrate('noMana',3); sfx('deny'); return false; }
  game.gold[0]-=T.cost; game.mana[0]-=m; recruit(t,0); sfx('buy'); onRecruit(t); unitVoice(t);
  if(panelB) refreshPanel();
  return true;
}

/* ---------- building panel (tap a building) and hover outline/tooltip (mouse) ---------- */
let panelB=null, hoverB=null, panelT=0;
const bpEl=$('#bpanel'), tipEl=$('#btip');
function refreshEmblemCss(){ if(EMBLEM_URL&&document.documentElement&&document.documentElement.style&&document.documentElement.style.setProperty) document.documentElement.style.setProperty('--emb','url('+EMBLEM_URL+')'); }
const embPos=i=>(i%3)*50+'% '+Math.floor(i/3)*50+'%';
function costTxt(g,m){ return g+' gold'+(m?' · '+m+' mana':''); }
function openPanel(b){
  panelB=b; if(!bpEl) return; bpEl.hidden=false; sfx('ui');
  $('#bpEmb').style.backgroundPosition=embPos(b.emb); $('#bpName').textContent=b.name; $('#bpDesc').textContent=b.desc;
  const box=$('#bpUnits'); box.innerHTML=''; const trains=b.trains||[];
  $('#bpTrainSec').hidden=!trains.length;
  for(const t of trains){ const T=TYPES[t], btn=document.createElement('button'); btn.className='bpu'; btn.dataset.t=t;
    btn.innerHTML='<img alt="" src="'+(ICONS[t]||'')+'"><span class="n">'+T.name+'</span><span class="s">'+costTxt(T.cost,unitMana(t))+'</span><span class="qn"></span>';
    btn.addEventListener('click',()=>buyUnit(t)); box.appendChild(btn); }
  const rb=$('#bpRes'); rb.innerHTML='';
  for(const R of RESEARCH[b.id]||[]){ const d=document.createElement('button'); d.className='bpr'; d.dataset.id=R.id;
    d.innerHTML='<span class="rn"></span><span class="rd">'+R.desc+'</span><span class="rc"></span><i class="rp"><b></b></i>';
    d.addEventListener('click',()=>{ startResearch(0,R.id); }); rb.appendChild(d); }
  refreshPanel();
}
function closePanel(){ panelB=null; if(bpEl) bpEl.hidden=true; }
function refreshPanel(){
  const b=panelB; if(!b||!bpEl||bpEl.hidden) return;
  const C=CASTLES[0];
  if(bpEl.querySelectorAll){
    bpEl.querySelectorAll('.bpu').forEach(el=>{ const t=el.dataset.t, q=queuedType(0,t);
      el.querySelector('.qn').textContent=q?('×'+q+' training'):''; el.classList.toggle('poor',game.gold[0]<TYPES[t].cost||game.mana[0]<unitMana(t)); });
    bpEl.querySelectorAll('.bpr').forEach(el=>{ const R=RES_BY_ID[el.dataset.id], l=C.res[R.id]||0, N=resNext(0,R.id), busy=b.res&&b.res.id===R.id;
      el.querySelector('.rn').textContent=R.name+(R.lv>1?' '+['I','II','III'][Math.min(R.lv-1,busy?b.res.lvl-1:l)]:'');
      el.querySelector('.rc').textContent=busy?'researching… '+Math.ceil(b.res.t)+'s':N?costTxt(N.cost[0],N.cost[1])+' · '+N.t+'s':'done';
      el.querySelector('.rp b').style.width=(busy?100*(1-b.res.t/b.res.tot):N?0:100)+'%';
      el.classList.toggle('done',!N); el.classList.toggle('busy',!!busy); el.classList.toggle('poor',!!N&&!busy&&(game.gold[0]<N.cost[0]||game.mana[0]<N.cost[1])); });
  }
  const gs=$('#bpGarr'); if(gs){ gs.hidden=b.id!=='castle'; if(b.id==='castle'){ const st=statues[0]; gs.textContent=C.garrison.length+' archers on the walls · statue '+(st?Math.ceil(st.hp)+' / '+Math.ceil(st.max):''); } }
  const tr=$('#bpTrain'); if(tr){ const cur=b.train; tr.textContent=cur?'Training '+TYPES[cur.type].name+' · '+Math.max(0,cur.t).toFixed(1)+'s':(b.q&&b.q.length?b.q.length+' waiting':''); }
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
  const own=b.team===0, C=CASTLES[b.team];
  let sub=b.trains?'Trains '+b.trains.map(t=>TYPES[t].name).join(', '):'Research: castle archers, income, resilience';
  if(own&&b.res) sub+=' · researching '+RES_BY_ID[b.res.id].name;
  if(own&&b.train) sub+=' · training '+TYPES[b.train.type].name;
  const done=(RESEARCH[b.id]||[]).filter(R=>(C.res[R.id]||0)>0).length;
  tipEl.innerHTML='<b>'+(own?'':'Crimson ')+b.name+'</b><span>'+sub+'</span>'+(own?'<em>'+done+' of '+(RESEARCH[b.id]||[]).length+' upgrades · tap to open</em>':'');
  tipEl.hidden=false; tipEl.style.left=Math.min(innerWidth-250,x+16)+'px'; tipEl.style.top=Math.max(8,y-12)+'px';
}
canvas.addEventListener('pointermove',e=>{ if(e.pointerType!=='mouse'||e.buttons||game.paused){ if(hoverB&&e.buttons) setHover(null); return; } setHover(pickBuilding(e.clientX,e.clientY),e.clientX,e.clientY); });
canvas.addEventListener('pointerleave',()=>setHover(null));
// hover/selection effects: glowing outline, brighter windows, a soft gold pulse
const _wgc=new THREE.Color("#d98a3e"), _wgh=new THREE.Color("#ffe9a8");
function castleFx(){
  const tt=game.time;
  for(const C of CASTLES) for(const b of C.list){ const on=b===hoverB||b===panelB;
    if(b.hull){ b.hull.visible=on; if(on) b.hull.material.opacity=.55+.3*Math.sin(tt*5); }
    if(b.glowMat){ b.glowMat.color.copy(_wgc).lerp(_wgh,on?.6+.4*Math.sin(tt*6):.05+.05*Math.sin(tt*2.3+b.bx)); } }
  // torches by the gates
  for(const C of CASTLES) for(const p of C.torches){ _tp.set(cwx(C.team,p.x+.05),CGY[C.team]+p.y,p.z); glowAt(_tp,.22+.05*Math.sin(tt*13+p.z),'#ffa040'); }
  drawPits();
}
