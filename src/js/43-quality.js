/* ---------------- graphics quality, frame rate, settings screen ---------------- */
// Quality ladder, cheapest first. "Auto" walks it: down a rung when frames drop, back up after a long smooth spell.
const DPR=Math.max(1,window.devicePixelRatio||1);
const LADDER=[
  {pr:.7,sh:0},{pr:.85,sh:0},{pr:1,sh:0},{pr:1,sh:1,map:1024},{pr:1.25,sh:1,map:1024},
  {pr:1.5,sh:1,map:1024},{pr:1.75,sh:1,map:2048},{pr:2,sh:1,map:2048,soft:1}
];
const PRESET={low:1,medium:4,high:7,ultra:7,custom:7};
const isTouch=(window.matchMedia&&window.matchMedia('(pointer:coarse)').matches)||('ontouchstart' in window);
const qa={rung:-1,start:isTouch?5:7,win:[],t:0,good:0,lockUp:0,shown:''};
function rungFor(){ return settings.quality==='auto'?(qa.rung<0?qa.start:qa.rung):PRESET[settings.quality]; }
let shadowsOn=true, shadowMap=2048, shadowSoft=true, curPR=Math.min(DPR,2);   // what 02-scene starts with
function setShadows(on,map,soft){
  map=map||1024; soft=!!soft;
  if(on===shadowsOn&&map===shadowMap&&soft===shadowSoft) return;
  const recompile=on!==shadowsOn||soft!==shadowSoft;
  shadowsOn=on; shadowMap=map; shadowSoft=soft;
  renderer.shadowMap.enabled=on; renderer.shadowMap.type=soft?THREE.PCFSoftShadowMap:THREE.PCFShadowMap;
  sun.castShadow=on;
  if(sun.shadow.mapSize.x!==map){ sun.shadow.mapSize.set(map,map); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map=null; } }
  if(recompile) scene.traverse(o=>{ const m=o.material; if(!m) return; (Array.isArray(m)?m:[m]).forEach(x=>x.needsUpdate=true); });
}
// the Quality choice (or Auto's current rung) becomes a full graphics configuration: see 43b-graphics
function applyQuality(){ applyGfx(gfxCfg()); if(typeof gfxSync==='function') gfxSync(); }
// called every animation frame with the real time since the last one (ms)
const fpsEl=$('#fps'); let fpsAcc=0, fpsN=0, fpsT=0;
function perfTick(ms){
  if(!(ms>0)||ms>250) return;
  fpsAcc+=ms; fpsN++; fpsT+=ms;
  if(fpsT>=500){ const avg=fpsAcc/fpsN; if(settings.fps&&fpsEl){ fpsEl.textContent=Math.round(1000/avg)+' fps · '+qa.shown; } fpsAcc=0; fpsN=0; fpsT=0; }
  if(settings.quality!=='auto'||game.paused||document.hidden) return;
  qa.win.push(ms); qa.t+=ms;
  if(qa.t<1500) return;
  const w=qa.win.slice().sort((a,b)=>a-b), med=w[Math.floor(w.length*.5)], p90=w[Math.floor(w.length*.9)];
  qa.win.length=0; qa.t=0; if(qa.rung<0) qa.rung=qa.start; qa.lockUp=Math.max(0,qa.lockUp-1.5);
  if(med>21||p90>34){ if(qa.rung>0){ qa.rung--; qa.good=0; qa.lockUp=30; applyQuality(); } }        // under ~48 fps: step down
  else if(med<17.6&&p90<20){ qa.good+=1.5; if(qa.good>=9&&qa.lockUp<=0&&qa.rung<LADDER.length-1&&Math.min(DPR,LADDER[qa.rung+1].pr)>=Math.min(DPR,LADDER[qa.rung].pr)){ qa.rung++; qa.good=0; qa.lockUp=12; applyQuality(); } }
  else qa.good=0;
}

/* ---------- sheets (settings, how to play, animation tuning) ---------- */
let sheetBack=null;
function openSheet(id,back){ for(const s of ['settings','help','tune','gfx']) $('#'+s).hidden=s!==id; $('#dock').hidden=true; sheetBack=back||null; if(id==='settings') syncSettingsUI(); }
function closeSheet(id){ $('#'+id).hidden=true; if(sheetBack){ const b=sheetBack; sheetBack=null; openSheet(b); return; } $('#dock').hidden=false; }
$('#setClose').onclick=()=>{ sfx('ui'); closeSheet('settings'); };
$('#helpClose').onclick=()=>{ sfx('ui'); closeSheet('help'); };
$('#tClose').onclick=()=>{ sfx('ui'); closeSheet('tune'); };
$('#bSettings').onclick=()=>{ sfx('ui'); openSheet('settings'); };
$('#setTune').onclick=()=>{ sfx('ui'); openSheet('tune','settings'); };

function setPills(box,attr,val){ if(!box||!box.querySelectorAll) return; box.querySelectorAll('button').forEach(b=>b.setAttribute('aria-checked',String(b.dataset[attr]===String(val)))); }
function syncSettingsUI(){
  setPills($('#qPills'),'q',settings.quality); setPills($('#dragPills'),'drag',settings.drag); setPills($('#finPills'),'fin',game.finMode);
  $('#sFps').checked=settings.fps; if($('#sVoice')) $('#sVoice').checked=settings.voice!==false; $('#sBlood').checked=tune.blood; $('#sMini').checked=settings.minimap; $('#sAuto').checked=game.auto[0];
  for(const [id,k] of [['Master','master'],['Music','music'],['Sfx','sfx']]){ $('#s'+id).value=settings[k]; $('#o'+id).textContent=Math.round(settings[k]*100)+'%'; }
  if($('#sShake')){ const k=settings.shake===undefined?1:settings.shake; $('#sShake').value=k; $('#oShake').textContent=Math.round(k*100)+'%'; }
  if(fpsEl) fpsEl.hidden=!settings.fps;
}
function pillClicks(box,fn){ if(box&&box.addEventListener) box.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('button'); if(b){ sfx('ui'); fn(b); syncSettingsUI(); } }); }
pillClicks($('#qPills'),b=>{ settings.quality=b.dataset.q; if(settings.quality==='auto') qa.rung=-1; saveSettings(); applyQuality(); });
pillClicks($('#dragPills'),b=>{ settings.drag=b.dataset.drag; saveSettings(); });
pillClicks($('#finPills'),b=>setFinMode(+b.dataset.fin));
if($('#sVoice')) $('#sVoice').addEventListener('change',e=>{ settings.voice=e.target.checked; saveSettings(); applyVolumes(); });
$('#sFps').addEventListener('change',e=>{ settings.fps=e.target.checked; saveSettings(); syncSettingsUI(); });
$('#sMini').addEventListener('change',e=>{ settings.minimap=e.target.checked; saveSettings(); syncMinimap(); });
$('#sAuto').addEventListener('change',e=>setAutoSpawn(e.target.checked));
for(const [id,k] of [['Master','master'],['Music','music'],['Sfx','sfx']]) $('#s'+id).addEventListener('input',e=>{ settings[k]=+e.target.value; $('#o'+id).textContent=Math.round(settings[k]*100)+'%'; applyVolumes(); saveSettings(); });
if($('#sShake')) $('#sShake').addEventListener('input',e=>{ settings.shake=+e.target.value; $('#oShake').textContent=Math.round(settings.shake*100)+'%'; saveSettings(); if(settings.shake>0) cam.shake=Math.max(cam.shake,.12*settings.shake); });
$('#setTutorial').onclick=()=>{ sfx('ui'); closeSheet('settings'); $('#dock').hidden=false; startTutorial(); };
$('#setErase').onclick=()=>{ const b=$('#setErase');
  if(!b.classList.contains('armed')){ b.classList.add('armed'); b.textContent='Tap again to erase'; return; }
  b.classList.remove('armed'); b.textContent='Erase saved progress';
  try{ localStorage.removeItem(SETTINGS_KEY); localStorage.removeItem('se3d-campaign'); }catch(e){}
  Object.assign(settings,SETTINGS_DEFAULTS); camp=null; game.finMode=settings.finMode; game.auto[0]=settings.auto; tune.blood=settings.blood;
  applyQuality(); applyVolumes(); syncBattleButtons(); syncMinimap(); toast('Saved progress and settings erased'); };

/* ---------- toast ---------- */
let toastTimer=0;
function toast(text,btn,fn,secs){ const t=$('#toast'); $('#toastT').textContent=text; const b=$('#toastBtn'); b.hidden=!btn; if(btn){ b.textContent=btn; b.onclick=()=>{ t.hidden=true; fn&&fn(); }; } t.hidden=false; toastTimer=secs||(btn?12:3); }
function updateToast(rdt){ if(toastTimer>0){ toastTimer-=rdt; if(toastTimer<=0) $('#toast').hidden=true; } }
