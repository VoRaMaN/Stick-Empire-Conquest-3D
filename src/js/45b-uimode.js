/* ---------------- interface: PC or Mobile layout ----------------
   Two layouts over the same game. PC keeps the full-size panels for a mouse and a large screen. Mobile is a compact
   layout for touch screens that leaves the battlefield in view: in landscape a phone is only 320-430 px tall, and the
   PC layout's top bar, cards, map and three dock rows filled almost all of it. The player picks one at first launch,
   before using the title menu, and can switch any time in Settings. Both layouts accept mouse and touch alike; only
   the arrangement and the wording of the hints change. (No module-level constants here: these functions are hoisted
   and syncSettingsUI can call them before this part of the script has run.) */
function uiSuggest(){
  try{ const mm=window.matchMedia;
    if(mm){ const coarse=mm('(pointer:coarse)').matches, fine=mm('(any-pointer:fine)').matches;
      if(coarse&&!fine) return 'mobile';
      if(fine) return 'pc'; } }catch(e){}
  const s=Math.min(window.innerWidth||0,window.innerHeight||0); return s>0&&s<600?'mobile':'pc';
}
function uiMode(){ const m=settings.uiMode; return m==='pc'||m==='mobile'?m:uiSuggest(); }
// the hint above the dock: "tap" on Mobile, "click" and the mouse controls on PC
function hintText(sel){ const pc=uiMode()==='pc';
  const rts=pc&&settings.rts!==false;
  if(sel) return rts?'Right-click the ground to march · right-click an enemy to attack · H hold · C charge · X rejoin · Esc let go':pc?'Click the ground to move · click an enemy to attack':'Tap the ground to move · tap an enemy to attack · Box or All to select more';
  if(game.mode==='battle') return rts?'Drag a box round your soldiers (or click one) · right-click to order · WASD, middle-drag or the screen edges to scroll · right-drag to turn':pc?'Drag to move the camera · scroll to zoom · right-drag to turn · click your soldiers to command their regiment':'Drag to move the camera · tap your soldiers to command their regiment · Box to select several';
  return pc?'Pick a unit · drag to orbit · scroll to zoom':'Pick a unit · drag to orbit · pinch to zoom';
}
function applyUiMode(){ const m=uiMode();
  setBodyClass('ui-pc',m==='pc'); setBodyClass('ui-mobile',m==='mobile');
  if(typeof setPills==='function') setPills($('#uiPills'),'ui',m);
  const h=$('#hint'); if(h) h.textContent=hintText(typeof selReg!=='undefined'&&!!selReg&&game.mode==='battle');
  if(typeof layoutTop==='function') layoutTop();
}
function setUiMode(m){ if(m!=='pc'&&m!=='mobile') return; settings.uiMode=m; saveSettings(); applyUiMode(); }

// the first-launch question: shown over the title menu until the player answers
function uiPickOpen(){ const el=$('#uiPick'); if(!el) return; const sug=uiSuggest();
  if(el.querySelectorAll) el.querySelectorAll('.ui-opt').forEach(b=>{ const s=b.dataset.ui===sug; b.classList[s?'add':'remove']('sugg'); const t=b.querySelector('.tag'); if(t) t.hidden=!s; });
  el.hidden=false;
  const f=el.querySelector&&el.querySelector('.ui-opt.sugg'); if(f&&f.focus) setTimeout(()=>{ try{ f.focus({preventScroll:true}); }catch(e){} },60);
}
{ const el=$('#uiPick');
  if(el&&el.addEventListener) el.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('.ui-opt'); if(!b) return;
    sfx('ui'); setUiMode(b.dataset.ui); el.hidden=true;
    toast((b.dataset.ui==='pc'?'PC':'Mobile')+' layout. Change it any time in Settings.'); }); }
pillClicks($('#uiPills'),b=>setUiMode(b.dataset.ui));
