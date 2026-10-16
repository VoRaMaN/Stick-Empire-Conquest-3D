/* ---------------- training battle ----------------
   A small guided battle: look around, recruit, take command of a regiment, beat a raiding party,
   charge, and bring down a weakened enemy statue. Each step waits for the player to actually do it. */
const TUT=[
  {text:'Drag one finger across the battlefield to look around.', enter:()=>{ inputStats.panned=0; }, done:()=>inputStats.panned>220},
  {text:'Pinch with two fingers to zoom in and out. On a computer, scroll.', enter:t=>{ t.z0=cam.dGoal; }, done:t=>Math.abs(Math.log(cam.dGoal/t.z0))>.3},
  {text:'Twist two fingers to turn the camera. On a computer, press Q or E.', enter:()=>{ inputStats.turned=0; }, done:()=>inputStats.turned>90},
  {text:'Your miners dig the gold. Tap the Swordsman card to recruit a soldier.', hl:'#chip-sword', enter:()=>{ game.gold[0]=Math.max(game.gold[0],400); }, done:()=>game.stats.bought>=1},
  {text:'Tap one of your soldiers to take command of his regiment.', done:()=>!!(selReg&&selReg.team===0)},
  {text:'Crimson raiders are coming. Keep a regiment selected and tap a raider to attack him.', enter:t=>{ spawnRaiders(t); },
    done:t=>(selReg&&selReg.order&&selReg.order.kind==='attack')||t.raiders.every(u=>!u.alive)},
  {text:'Now send the whole army forward: tap Charge in the orders below.', hl:'#oCharge', enter:()=>{ selectReg(null); }, done:()=>game.stance[0]==='charge'},
  {text:'Bring down the Crimson statue on the far side to win.', enter:()=>{ selectReg(null); }, done:()=>false}
];
function spawnRaiders(t){
  t.raiders=[];
  for(let i=0;i<3;i++){ const u=spawn('sword',1,4+i*.8,-2+i*2); t.raiders.push(u); }
  setStance(1,'charge');
  showBanner('Raiders!','three Crimson swordsmen',1.4); sfx('hornEnemy');
  cam.goal.set(-6,0,0); clampGoal();
}
function startTutorial(){
  closeMenu(); closeOverlays(); selectReg(null);
  game.demo=false; game.campFight=null; game.spent=false; game.paused=false;
  game.mode='battle'; syncModeUI(); setTab('battle'); setTerrain('skirmish'); game.size=0;
  resetBattle({gold:[700,0],statueHp:[2600,650]});
  for(const u of units) if(u.team===1&&u.type!=='miner'){ u.alive=false; destroyGear(u); }   // the enemy starts with only its miners
  game.auto=[false,false]; syncBattleButtons();
  game.tutorial={i:-1,wait:0,raiders:[]};
  $('#coach').hidden=false; $('#follow').hidden=true;
  tutorialNext();
}
function tutorialNext(){
  const T=game.tutorial; if(!T) return;
  if(T.hl){ const el=$(T.hl); if(el&&el.classList) el.classList.remove('pulse'); T.hl=null; }
  T.i++; const S=TUT[T.i]; if(!S) return;
  if(S.enter) S.enter(T);
  $('#coachText').textContent=S.text; $('#coachStep').textContent='Training · '+(T.i+1)+' of '+TUT.length;
  $('#coachDots').innerHTML=TUT.map((_,k)=>'<i class="'+(k<T.i?'done':'')+'"></i>').join('');
  if(S.hl){ const el=$(S.hl); if(el&&el.classList){ el.classList.add('pulse'); T.hl=S.hl; } }
}
function tutorialTick(dt){
  const T=game.tutorial; if(!T||T.i<0) return;
  if(T.wait>0){ T.wait-=dt||1/60; if(T.wait<=0) tutorialNext(); return; }
  const S=TUT[T.i]; if(S&&S.done(T)){ sfx('order'); $('#coachText').textContent='Done!'; T.wait=.8; }
}
function endCoach(){ const c=$('#coach'); if(c) c.hidden=true; document.querySelectorAll&&document.querySelectorAll('.pulse').forEach(el=>{ if(el.id!=='mmTraining') el.classList.remove('pulse'); }); }
$('#coachSkip').onclick=()=>{ sfx('ui'); settings.tutorialDone=true; saveSettings(); game.tutorial=null; endCoach(); openMenu(); };
