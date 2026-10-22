/* ---------------- title screen, pause, battle results ---------------- */
const bodyEl=document.body;
const setBodyClass=(c,on)=>{ if(bodyEl&&bodyEl.classList) bodyEl.classList[on?'add':'remove'](c); };

// battle statistics for the results screen
function statsReset(){ game.stats={t0:game.time,kills:[0,0],losses:[0,0],fins:[0,0],arrows:[0,0],gold:[0,0],peak:[0,0],bought:0}; }
statsReset();
function onKill(t){ if(!t.isUnit||!game.stats) return; game.stats.losses[t.team]++; game.stats.kills[1-t.team]++; }
function onFinisher(u){ if(game.stats) game.stats.fins[u.team]++; }
function onArrow(u){ if(game.stats&&u&&u.team!==undefined) game.stats.arrows[u.team]++; }
function onGold(team,n){ if(game.stats) game.stats.gold[team]+=n; }
function onRecruit(){ if(game.stats) game.stats.bought++; }
function statsTick(){ if(!game.stats||game.mode!=='battle') return; for(let t=0;t<2;t++) game.stats.peak[t]=Math.max(game.stats.peak[t],count(t)); }

/* ---------- title screen with a battle playing behind it ---------- */
const menuEl=$('#menu');
let menuSize=settings.size||0;
function showPanel(id){ for(const p of ['menuMain','menuSkirmish','menuInstall','menuOnline']) { const el=$('#'+p); if(el) el.hidden=p!==id; } }
function openMenu(panel){
  closeOverlays(); closeCampaign(); selectReg(null);
  game.paused=false; game.tutorial=null; endCoach(); game.campFight=null; game.spent=false;
  menuEl.hidden=false; setBodyClass('in-menu',true); audio.inMenu=true;
  showPanel(panel||'menuMain'); refreshMenu();
  startDemo();
}
function closeMenu(){ menuEl.hidden=true; setBodyClass('in-menu',false); audio.inMenu=false; game.demo=false; $('#dock').hidden=false; }
function refreshMenu(){
  const sv=campLoad(), cont=sv&&!sv.over;
  $('#mmContinue').hidden=!cont;
  if(cont){ const owned=Object.values(sv.owner).filter(v=>v===0).length; $('#mmContinueSub').textContent='Turn '+sv.turn+' · '+owned+' of 8 territories'; }
  const cb=$('#mmCampaign'); if(cb.dataset) delete cb.dataset.armed; $('#mmCampaignSub').textContent=cont?'Start a new conquest':'Conquer eight territories';
  $('#mmTraining').classList[settings.tutorialDone?'remove':'add']('pulse');
  $('#ver').textContent='Version '+BUILD.version+(BUILD.target==='web'?'':' · preview');
  updateInstallButton();
  menuEl.querySelectorAll&&menuEl.querySelectorAll('.size').forEach(b=>b.setAttribute('aria-checked',String(+b.dataset.size===menuSize)));
  menuEl.querySelectorAll&&menuEl.querySelectorAll('.mapc').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.map===(settings.map==='river'?'river':'classic'))));
}
function startDemo(){
  game.demo=true; game.mode='battle'; setFactions(settings.side); syncModeUI(); setTerrain('skirmish');
  const keep=game.size; game.size=0; resetBattle({gold:[2600,2600]}); game.size=keep;
  game.auto=[true,true]; game.demoT=0;
  cam.follow=null; cam.dGoal=22; cam.pitch=.36; cam.yaw=.5; demoCamera(5); cam.target.copy(cam.goal); cam.dist=cam.dGoal;
}
function demoTick(dt){
  game.demoT+=dt;
  if(game.demoT>5&&game.stance[0]!=='charge'){ setStance(0,'charge'); setStance(1,'charge'); }
}
// slow cinematic orbit over wherever the fighting is
const _dc=new V3();
function demoCamera(rdt){
  let n=0; _dc.set(0,0,0);
  for(const u of units){ if(!u.alive||!u.isUnit||u.T.worker) continue; if(u.action&&!u.action.c.idle||u.target){ _dc.x+=u.pos.x; _dc.z+=u.pos.z; n++; } }
  if(!n){ for(const u of units){ if(!u.alive||!u.isUnit||u.T.worker) continue; _dc.x+=u.pos.x; _dc.z+=u.pos.z; n++; } }
  if(n){ _dc.multiplyScalar(1/n);
    // look at a point a little in front of the action so the soldiers sit in the top half, above the menu buttons
    const k=cam.dist*.42; _dc.x+=Math.sin(cam.yaw)*k; _dc.z+=Math.cos(cam.yaw)*k;
    cam.goal.x+=(clamp(_dc.x,-40,40)-cam.goal.x)*Math.min(1,rdt*.6); cam.goal.z+=(clamp(_dc.z,-18,18)-cam.goal.z)*Math.min(1,rdt*.6); }
  cam.goal.y=H(cam.goal.x,cam.goal.z)+1.2;
  cam.yaw+=rdt*.05; cam.pitch+=(.36-cam.pitch)*Math.min(1,rdt); cam.dGoal+=(22-cam.dGoal)*Math.min(1,rdt*.5);
}
function startSkirmish(size){
  game.size=size; settings.size=size; saveSettings();
  closeMenu(); game.campFight=null; game.tutorial=null;
  const river=settings.map==='river';
  game.mode='battle'; setFactions(settings.side); syncModeUI(); setTab('battle'); setTerrain(river?'riverlands':'skirmish'); resetBattle();
  game.auto=[settings.auto,true]; syncBattleButtons();
  showBanner(river?'Riverlands':BATTLE_SIZES[size].name+' battle',river?BATTLE_SIZES[size].name+' · '+BATTLE_SIZES[size].start+' soldiers a side':BATTLE_SIZES[size].start+' soldiers a side',1.8);
  sfx('horn');
  if(river) setTimeout(()=>{ if(game.mode==='battle'&&MAP.id==='river'&&!game.demo&&game.over<=0) toast('Markets B and C pay gold · shrines A and D give mana and +10% damage · held zones heal and reveal. Only the bridges cross the river.',null,null,9); },2600);
}
function menuClick(id,fn){ const b=$('#'+id); if(b) b.onclick=()=>{ sfx('ui'); fn(); }; }
menuClick('mmSkirmish',()=>showPanel('menuSkirmish'));
// your side: Order or Chaos (the enemy fields the other); the battle behind the title switches with it
function syncSideUI(){ if(menuEl.querySelectorAll) menuEl.querySelectorAll('.side-pick').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.side===(settings.side||'order')))); }
if(menuEl.querySelectorAll) menuEl.querySelectorAll('.side-pick').forEach(b=>b.addEventListener('click',()=>{ sfx('ui'); const sd=b.dataset.side; if(sd===(settings.side||'order')) return;
  settings.side=sd; saveSettings(); syncSideUI(); if(game.demo) startDemo(); }));
syncSideUI();
menuClick('skBack',()=>showPanel('menuMain'));
menuClick('skStart',()=>startSkirmish(menuSize));
if(menuEl.querySelectorAll) menuEl.querySelectorAll('.size').forEach(b=>b.addEventListener('click',()=>{ sfx('ui'); menuSize=+b.dataset.size; refreshMenu(); }));
if(menuEl.querySelectorAll) menuEl.querySelectorAll('.mapc').forEach(b=>b.addEventListener('click',()=>{ sfx('ui'); settings.map=b.dataset.map==='river'?'river':'classic'; saveSettings(); refreshMenu(); }));
menuClick('mmContinue',()=>{ closeMenu(); game.demo=false; camp=campLoad(); setTab('camp'); openCampaign(); });
menuClick('mmCampaign',()=>{ const sv=campLoad(), b=$('#mmCampaign');
  if(sv&&!sv.over&&!b.dataset.armed){ b.dataset.armed='1'; $('#mmCampaignSub').textContent='Tap again to replace your saved campaign'; return; }
  delete b.dataset.armed; closeMenu(); game.demo=false; if(sv&&!sv.over) campNew(); else camp=sv; setTab('camp'); openCampaign(); });
menuClick('mmTraining',()=>startTutorial());
menuClick('mmLab',()=>{ closeMenu(); game.campFight=null; setTerrain('skirmish'); setMode('duel'); });
menuClick('mmViewer',()=>{ closeMenu(); game.campFight=null; setTerrain('skirmish'); setMode('viewer'); });
menuClick('mmOnline',()=>openOnline());
menuClick('mmSettings',()=>openSheet('settings'));
menuClick('mmHelp',()=>openSheet('help'));
menuClick('mmInstall',()=>{ if(installEvt){ installEvt.prompt(); installEvt.userChoice&&installEvt.userChoice.finally(()=>{ installEvt=null; updateInstallButton(); }); } else showPanel('menuInstall'); });
menuClick('inBack',()=>showPanel('menuMain'));
// closing the campaign map when no campaign battle is under way goes back to the title screen
$('#cClose').onclick=()=>{ sfx('ui'); closeCampaign(); if(!game.campFight&&game.mode!=='duel') openMenu(); else setTab(game.mode==='duel'?'duel':(game.campFight?'camp':'battle')); };

/* ---------- pause ---------- */
function closeOverlays(){ $('#pause').hidden=true; $('#results').hidden=true; for(const s of ['settings','help','tune']) $('#'+s).hidden=true; sheetBack=null; }
function pauseGame(){
  if(!menuEl.hidden||!$('#camp').hidden||!$('#results').hidden) return;
  if(NET.on){ netPauseMenu(); return; }   // an online battle never stops for one player: the menu opens over it
  game.paused=true; $('#pause').hidden=false; $('#pRestart').hidden=false; $('#pauseH').textContent='Paused'; $('#pResume').innerHTML='<span>Resume</span>'; $('#pMenu').textContent='Main menu';
  $('#pauseSub').textContent=game.tutorial?'Training':game.mode==='duel'?'Finisher Lab':game.mode==='viewer'?'Unit Viewer':game.campFight?campName(game.campFight.id)+' · campaign battle':BATTLE_SIZES[game.size].name+' skirmish · '+fmtTime(game.time-game.stats.t0);
  $('#pRestart').textContent=game.mode==='duel'?'Reset the lab':game.mode==='viewer'?'Reset the viewer':'Restart battle';
}
function resumeGame(){ $('#pause').hidden=true; for(const s of ['settings','help','tune']) $('#'+s).hidden=true; $('#dock').hidden=false; game.paused=false; }
$('#bPause').onclick=()=>{ sfx('ui'); if(game.paused&&!$('#pause').hidden) resumeGame(); else pauseGame(); };
menuClick('pResume',resumeGame);
menuClick('pRestart',()=>{ resumeGame();
  if(game.mode==='duel') resetDuel();
  else if(game.mode==='viewer') resetViewer();
  else if(game.tutorial) startTutorial();
  else if(game.campFight){ const f=game.campFight; startCampFight(f.id,f.attacking); }
  else resetBattle(); });
menuClick('pSettings',()=>openSheet('settings'));
menuClick('pHelp',()=>openSheet('help'));
menuClick('pMenu',()=>{ if(NET.on){ netLeavePressed(); return; } openMenu(); });
window.addEventListener('keydown',e=>{ if(e.key==='Escape'){ if(!menuEl.hidden) return; if(!$('#pause').hidden) resumeGame(); else pauseGame(); } });
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&menuEl.hidden&&game.mode==='battle'&&!game.over&&!NET.on) pauseGame(); });

/* ---------- results ---------- */
const fmtTime=s=>{ s=Math.max(0,Math.round(s)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
function battleEnded(){
  if(game.demo){ startDemo(); return; }
  if(NET.on){ netShowResults(); return; }
  if(game.autoResults){ if(game.campFight) finishCampFight(game.winner); else resetBattle(); return; }   // used by the test suite
  showResults();
}
function showResults(){
  const win=game.winner===0, S=game.stats, tut=!!game.tutorial, f=game.campFight;
  if(tut) endCoach();
  const R=$('#results'); R.hidden=false; R.classList.remove('win','lose'); R.classList.add(win?'win':'lose');
  $('#resH').textContent=tut?(win?'Trained':'Defeated'):(win?'Victory':'Defeat');
  const time=fmtTime(game.time-S.t0);
  $('#resSub').textContent=tut?(win?'You can command an army. The field is yours.':'The training statue fell. Try again.'):
    f?campName(f.id)+(win?' is won':' is lost')+' after '+time+'.':(win?'The '+teamName(1)+' statue fell after '+time+'.':'Your statue fell after '+time+'.');
  const rows=[['Enemies slain',S.kills[0]],['Soldiers lost',S.losses[0]],['Finishers',S.fins[0]],['Arrows loosed',S.arrows[0]],['Gold mined',Math.round(S.gold[0])],['Largest army',S.peak[0]]];
  $('#resStats').innerHTML=rows.map(r=>'<dt>'+r[0]+'</dt><dd>'+Number(r[1]).toLocaleString()+'</dd>').join('');
  $('#rAgain').innerHTML='<span>'+(tut?'Play a skirmish':f?'Back to the map':'Play again')+'</span>';
  musicStinger(win); settings.played=(settings.played||0)+1;
  if(tut&&win){ settings.tutorialDone=true; } saveSettings();
}
menuClick('rAgain',()=>{ $('#results').hidden=true;
  if(NET.on||NET.after){ netResultsAgain(); return; }
  if(game.tutorial){ game.tutorial=null; endCoach(); startSkirmish(settings.size||0); return; }
  if(game.campFight){ finishCampFight(game.winner); return; }
  resetBattle(); });
menuClick('rMenu',()=>{ if(NET.on||NET.after){ netResultsMenu(); return; } if(game.campFight){ finishCampFight(game.winner); closeCampaign(); } openMenu(); });

/* ---------- install ---------- */
let installEvt=null;
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); installEvt=e; updateInstallButton(); });
function updateInstallButton(){
  const nav=window.navigator||{}, ua=nav.userAgent||'';
  const standalone=(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||(window.matchMedia&&window.matchMedia('(display-mode: fullscreen)').matches)||nav.standalone;
  const ios=/iphone|ipad|ipod/i.test(ua)||(/macintosh/i.test(ua)&&nav.maxTouchPoints>1);
  $('#mmInstall').hidden=BUILD.target!=='web'||standalone||!(installEvt||ios);
}
