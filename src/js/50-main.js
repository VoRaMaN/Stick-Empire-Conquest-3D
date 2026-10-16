/* ---------------- main loop ---------------- */
const hudEls={gA:$('#gA'),gB:$('#gB'),mA:$('#mA'),mB:$('#mB'),hpA:$('#hpA'),hpB:$('#hpB'),cA:$('#cA'),cB:$('#cB')};
let hudCache='';
function step(rdt){
  updateToast(rdt);
  if(game.paused) return;
  // time scale: slow-mo in finisher lab or when the followed unit performs a finisher
  let slow=1;
  if(game.mode==='duel'&&game.slow&&game.duel){ const D=game.duel; if(D.att.fin) slow=.38; else if(D.att.action&&!D.att.action.c.idle||D.dum.action&&!D.dum.action.c.idle) slow=.5; }
  if(game.mode==='battle'&&cam.follow&&cam.follow.fin) slow=.45;
  game.ts=lerp(game.ts,slow,1-Math.exp(-rdt*8));
  let dt=Math.min(rdt*game.ts*tune.speed,1/30);
  if(!(dt>0)) return;   // no time passed (the first frame): velocities divided by dt would be NaN
  if(game.hitstop>0){ game.hitstop-=rdt; dt*=.08; } // brief freeze-frame on heavy blows
  game.time+=dt;

  if(game.mode==='battle'){
    if(game.over>0){ game.over-=rdt; if(game.over<=0) battleEnded(); }
    else {
      if(game.demo) demoTick(dt);
      if(game.tutorial) tutorialTick(dt);
      game.slotT=(game.slotT||0)-dt; if(game.slotT<=0){ game.slotT=1; assignSlots(0); assignSlots(1); }
      enemyCommander(dt);
    }
    game.statT=(game.statT||0)-dt; if(game.statT<=0){ game.statT=1; statsTick(); }
    if(game.over<=0) for(let t=0;t<2;t++){ game.gold[t]+=22*dt*econ(t); if(game.auto[t]||(t===1&&!game.tutorial)){ game.spawnT[t]-=dt; if(game.spawnT[t]<=0){ game.spawnT[t]=rand(1,1.8); autoSpend(t);} } }
  } else if(game.duel&&game.duel.q){
    const q=game.duel.q; q.t-=dt; if(q.t<=0){ game.duel.q=null; const D=game.duel;
      if(q.kind==='fin'&&D.att.alive&&D.dum.alive){ D.dum.hp=1; startFinisher(D.att,D.dum,q.name); }
      if(q.kind==='atk') duelDo('atk'); }
  }
  if(game.mode==='duel'&&game.duel&&game.duel.home&&!game.duel.q){ // both fighters walk back to their marks between moves
    const D=game.duel;
    for(const [u,h,f] of [[D.att,D.home.a,D.dum],[D.dum,D.home.d,D.att]]){
      if(!u.alive||u.action||u.script||u.fin||u.defQ) continue;
      if(Math.hypot(h.x-u.pos.x,h.z-u.pos.z)>.3) u.script={pts:[h.clone()],i:0,speed:u.T.speed*.45,face:f};
    }
  }
  for(const u of units){ u.engaged=0; if(u.atk) u.atk.length=0; }
  for(const u of units) if(u.alive&&u.target&&u.target.isUnit&&!u.T.ranged){ const t=u.target; t.engaged++; (t.atk||(t.atk=[])).push(u); }
  gridBuild();
  for(let i=0;i<units.length;i++){ const u=units[i]; if(u.alive) updateUnit(u,dt); }
  separate();
  for(let i=units.length-1;i>=0;i--) if(!units[i].alive) units.splice(i,1);
  for(let i=corpses.length-1;i>=0;i--){ const u=corpses[i]; stepRag(u.rag,dt); updateGear(u);
    if(u.dropT!==undefined){ u.dropT-=dt; if(u.dropT<=0){ u.dropT=undefined; if(!u.statue||!u.rag.keep) dropGear(u); } }
    if(u.rag.age>18.5&&!u.rag.keep){ destroyGear(u); corpses.splice(i,1); if(cam.follow===u){cam.follow=null; updateFollowUI();} } }
  game.regT=(game.regT||0)-dt; if(game.regT<=0){ game.regT=.4; cleanRegs(); if(selReg) updateRegbar(); }
  if(game.mode==='battle'){ updateCastles(dt); castleIncome(dt); } else if(castleReady) updateCastles(dt);
  if(panelB) panelTick(rdt);
  updateArrows(dt); updateSpells(dt); updateChaos(dt); updateBlood(dt); updateLoose(dt);
  { const half=capes.length>24; game.capeF=(game.capeF||0)+1; for(let i=0;i<capes.length;i++) if(!half||((i+game.capeF)&1)===0) stepCape(capes[i],half?dt*2:dt); }
  for(let i=puffs.length-1;i>=0;i--){ const p=puffs[i]; p.age+=dt; const t=p.age/p.life;
    if(t>=1){ puffs.splice(i,1); continue; }
    p.v.multiplyScalar(Math.exp(-dt*3)); p.v.y+=dt*.4; p.p.addScaledVector(p.v,dt); }
  for(let i=rings.length-1;i>=0;i--){ const r=rings[i]; r.age+=dt; const t=r.age/r.life; if(t>=1){ scene.remove(r.m); r.m.material.dispose(); rings.splice(i,1); continue; }
    r.m.scale.setScalar(r.size*(.2+EASE.o(t))); r.m.material.opacity=.8*(1-t); }
  if(bannerTimer>0){ bannerTimer-=rdt; if(bannerTimer<=0) $('#banner').classList.remove('show'); }
}
function draw(){
  draw.frame=(draw.frame||0)+1;
  for(const im of CNT.keys()) CNT.set(im,0);
  for(const L of [units,corpses]) for(const u of L) if(u.cr) crPrep(u);   // Hellcrawler models: posed only when on screen
  drawGear();
  _cr.set(1,0,0).applyQuaternion(camera.quaternion); _cb.set(0,0,1).applyQuaternion(camera.quaternion);
  for(const st of statues){ const f=st.fig; if(!f.rag) drawFigure(f.j,f.s,f.col,f.thick,f.fwdW); }
  for(const u of units) if(u.alive){ drawUnit(u); if(tune.dbg) drawDebug(u);
    if(u.isUnit&&(u.hp<u.maxHp||u.morale<99||cam.follow===u)&&!u.invuln) drawBar(u); }
  for(const u of corpses) drawUnit(u);
  for(const C of CASTLES) for(const g of C.garrison) drawUnit(g);
  castleFx();
  for(const list of [units,corpses,CASTLES[0].garrison,CASTLES[1].garrison]) for(const u of list){ const st=u.G&&u.G.str; if(st&&st.vis&&!u.G.o.dropped){ cyl(st.a,st.m,.006*u.s,WHITE,strIM); cyl(st.m,st.b,.006*u.s,WHITE,strIM); } }
  drawPuffs(); drawSpells(); drawChaos();
  for(const [im,n] of CNT){ im.count=n; im.instanceMatrix.needsUpdate=true; if(im.instanceColor) im.instanceColor.needsUpdate=true; }
  if(game.mode==='battle'){
    const s=game.stance.join()+Math.floor(game.gold[0])+'|'+Math.floor(game.gold[1])+'|'+Math.floor(game.mana[0])+'|'+Math.floor(game.mana[1])+'|'+Math.ceil(statues[0].hp)+'|'+Math.ceil(statues[1].hp)+'|'+count(0)+'|'+count(1);
    if(s!==hudCache){ hudCache=s; hudEls.gA.textContent=Math.floor(game.gold[0]).toLocaleString(); hudEls.gB.textContent=Math.floor(game.gold[1]).toLocaleString();
      const mOn=!game.classicMix; if(hudEls.mA){ hudEls.mA.textContent=Math.floor(game.mana[0]); hudEls.mB.textContent=Math.floor(game.mana[1]); if(hudEls.mA.parentNode) hudEls.mA.parentNode.hidden=!mOn; if(hudEls.mB.parentNode) hudEls.mB.parentNode.hidden=!mOn; }
      hudEls.hpA.style.width=(statues[0].hp/statues[0].max*100)+'%'; hudEls.hpB.style.width=(statues[1].hp/statues[1].max*100)+'%';
      const SN={defend:'defending',hold:'holding',charge:'charging'}; hudEls.cA.textContent=count(0)+' units · '+SN[game.stance[0]]; hudEls.cB.textContent=count(1)+' units · '+SN[game.stance[1]];
      for(const t of FAC(0).roster){ const el=document.getElementById('chip-'+t); if(el){ el.style.opacity=game.gold[0]>=TYPES[t].cost&&game.mana[0]>=unitMana(t)?1:.55; const q=el.querySelector&&el.querySelector('.qn'); if(q){ const n=castleOn()?queuedType(0,t):0; q.textContent=n?'×'+n:''; } } } }
  }
  drawArrows(); drawBlood(); updateBanners(); drawSelection(1/60); updateCallouts(1/60);
  drawMinimap();
  // the sun's shadow box follows the camera along the field, so the castles get shadows when you look at them
  { const sx=clamp(Math.round(cam.target.x/1.9765625)*1.9765625,-40,40); if(sx!==sun.userData.sx){ sun.userData.sx=sx; sun.position.set(-16+sx,30,16); sun.target.position.set(sx,0,0); sun.target.updateMatrixWorld(); } }
  renderFrame();
}
let last=performance.now();
let capT=0;
function frame(now){
  requestAnimationFrame(frame);
  if(GFX.fpsCap){ const iv=1000/GFX.fpsCap; if(now-capT<iv-2) return; capT=now; }
  const ms=now-last, rdt=Math.min(.05,Math.max(0,ms/1000)); last=now;
  perfTick(ms);
  if(window.innerWidth!==vpW||window.innerHeight!==vpH||!isFinite(camera.aspect)) resize();   // a resize event can be missed when the page is hidden and shown again
  step(rdt); if(game.demo&&!game.paused) demoCamera(rdt); updateCamera(rdt); updateAudio(); draw();
}
// debug and test hooks (used by tests/ and the browser checks)
window.__SE3D={closeMenu,openMenu,startTutorial,audio,settings,showResults,pauseGame,openSheet,setStance,units,corpses,game,step,setMode,duelDo,statues,regs,camera,cam,resetBattle,assignSlots,formLines,CHG,arrows,getAr:()=>arIM,CNT,draw,spawn,clearAll,setupStatues,H,placeUnit,play,EXTRA_EV,FINS,FIN,IDLES,TYPES,CLIPS,startAttack,startFinisher,spells:()=>({orbs,walls,clouds,zaps,beams,flashes,souls,wisps}),FACTIONS,setFactions,facOf,econ,ensureCastles,
  renderer,sceneRef:scene,sunScreen,applyQuality,GFX_PRESETS,GFX_DEF,post,GFX:()=>GFX,CASTLES,recruit,buyUnit,startResearch,resLvl,hasRes,openPanel,closePanel,pickBuilding,setHover,queued,ICONS,makeUnitIcons,VOX,narrate,loadAssets,BUILDINGS};
// start: apply saved settings, then open on the title screen with a battle playing behind it
game.finMode=settings.finMode; game.auto[0]=settings.auto; game.size=settings.size; tune.blood=settings.blood;
syncBattleButtons(); syncSettingsUI(); syncMinimap(); applyQuality();
setMode('battle');
openMenu();
setTimeout(()=>{ $('#hint').style.transition='opacity .6s'; $('#hint').style.opacity='.0'; },14000);
requestAnimationFrame(frame);
// portraits of every unit for the dock and the building panels, once the first frames are on screen
setTimeout(()=>{ try{ makeUnitIcons(); }catch(e){} },400);
