/* ---------------- UI ---------------- */
let bannerTimer=0;
function showBanner(t,s,dur){ $('#bannerT').textContent=t; $('#bannerS').textContent=s||''; $('#banner').classList.add('show'); bannerTimer=dur||1.6; }
function renderChips(){
  const box=$('#chips'); box.innerHTML='';
  for(const t of (game.mode==='duel'?ORDER.concat(CHAOS):FAC(0).roster)){ const T=TYPES[t]; const b=document.createElement('button'); b.className='chip'+(T.chaos?' chaos':''); b.id='chip-'+t;
    const mc=game.mode==='battle'&&!game.classicMix?(MANA_COST[t]||0):0;
    b.innerHTML='<span class="n">'+T.name+'</span><span class="s">'+(game.mode==='battle'?T.cost+' '+money(0)+(mc?' · '+mc+' mana':''):'10 finishers · 10 charges')+'</span><span class="qn"></span>';
    if(game.mode==='duel') b.setAttribute('aria-pressed',game.duelSel===t);
    b.addEventListener('click',()=>{
      if(game.mode==='battle'){ if(!buyUnit(t)){ b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); } }
      else { sfx('ui'); game.duelSel=t; game.finI=-1; game.idleI=-1; renderChips(); duelDo('fin'); unitVoice(t); }
    });
    box.appendChild(b); }
  applyIcons();
}
const FINL=['Off','Sometimes','Always'];
// an army-wide order calls every regiment back under the general's command
const armyOrder=st=>{ for(const r of regs) if(r.team===0) r.order={kind:'army'}; setStance(0,st); };
$('#oDefend').onclick=()=>{ sfx('order'); armyOrder('defend'); showBanner('Defend','form up by the statue',1); narrate('defend',2); };
$('#oHold').onclick=()=>{ sfx('order'); armyOrder('hold'); showBanner('Hold the line','form up where the army stands',1); narrate('hold',2); };
$('#oCharge').onclick=()=>{ sfx('horn'); sfx('warcry'); armyOrder('charge'); showBanner('Charge!','',1); narrate('charge',2); };
function setAutoSpawn(on){ game.auto[0]=on; settings.auto=on; saveSettings(); syncBattleButtons(); }
function setFinMode(m){ game.finMode=m; settings.finMode=m; saveSettings(); syncBattleButtons(); }
function syncBattleButtons(){ $('#bAuto').textContent='Auto-spawn: '+(game.auto[0]?'On':'Off'); $('#bFin').textContent='Finishers: '+FINL[game.finMode]; if(typeof syncSettingsUI==='function') syncSettingsUI(); }
$('#bAuto').onclick=()=>{ sfx('ui'); setAutoSpawn(!game.auto[0]); };
$('#bFin').onclick=()=>{ sfx('ui'); setFinMode((game.finMode+1)%3); };
$('#dChg').onclick=()=>duelDo('charge'); $('#dFin').onclick=()=>duelDo('fin'); $('#dIdle').onclick=()=>duelDo('idle'); $('#dAtk').onclick=()=>duelDo('atk'); $('#dWalk').onclick=()=>duelDo('walk');
$('#dDef').onclick=()=>{ game.duelDefend=!game.duelDefend; $('#dDef').textContent='Defender: '+(game.duelDefend?'On':'Off'); };
$('#dSlow').onclick=()=>{ game.slow=!game.slow; $('#dSlow').textContent='Slow-mo: '+(game.slow?'On':'Off'); };
$('#mBattle').onclick=()=>{ const sp=game.spent; closeCampaign(); if(!sp&&(game.mode!=='battle'||game.campFight)){ game.campFight=null; setTerrain('skirmish'); setMode('battle'); } };
$('#mCamp').onclick=()=>{ setTab('camp'); openCampaign(); };
$('#cClose').onclick=()=>{ closeCampaign(); setTab(game.mode==='duel'?'duel':(game.campFight?'camp':'battle')); };
$('#cGo').onclick=()=>campGo(); $('#cReset').onclick=()=>{ const b=$('#cReset'); if(!b.dataset.armed){ b.dataset.armed='1'; b.textContent='Tap again to restart'; return; } delete b.dataset.armed; b.textContent='New campaign'; campNew(); renderCampaign(); };
$('#rgClose').onclick=()=>selectReg(null);
$('#rgHold').onclick=()=>{ if(selReg){ orderHold(selReg); updateRegbar(); } };
$('#rgCharge').onclick=()=>{ if(selReg){ selReg.order={kind:'charge'}; updateRegbar(); } };
$('#rgRelease').onclick=()=>{ if(selReg){ selReg.order={kind:'army'}; updateRegbar(); } };
$('#rgFollow').onclick=()=>{ if(selReg){ const b=regAlive(selReg)[0]; if(b){ cam.follow=b; cam.dGoal=Math.min(cam.dGoal,b.s>1.5?14:10); updateFollowUI(); } } };
$('#mDuel').onclick=()=>{ game.spent=false; closeCampaign(); if(game.mode!=='duel'){ game.campFight=null; setTerrain('skirmish'); setMode('duel'); } };
for(const [id,key] of [['Step','step'],['Bob','bob'],['Lean','lean'],['Spring','spring'],['Speed','speed']]){
  const el=$('#s'+id), out=$('#o'+id); el.addEventListener('input',()=>{ tune[key]=+el.value; out.textContent=(+el.value).toFixed(2)+'×'; });
}
$('#sDbg').addEventListener('change',e=>{tune.dbg=e.target.checked;});
$('#sBlood').addEventListener('change',e=>{tune.blood=e.target.checked; settings.blood=tune.blood; saveSettings(); if(!tune.blood){ drops.length=0; splats.length=0; }});
$('#unfollow').onclick=()=>{cam.follow=null; updateFollowUI();};
function updateFollowUI(){ const f=cam.follow; $('#follow').hidden=!f||game.mode!=='battle'||!!selReg; if(f) $('#followT').textContent='Following '+teamName(f.team).split(' ')[0]+' '+f.T.name; }

// the unit row scrolls with a mouse too: the wheel scrolls it sideways, and it can be dragged; a drag doesn't count as a click
{ const row=$('#chips'); let drag=null;
  row.addEventListener('wheel',e=>{ const d=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY; if(!d||row.scrollWidth<=row.clientWidth) return;
    e.preventDefault(); row.scrollLeft+=d*(e.deltaMode===1?32:1); },{passive:false});
  row.addEventListener('pointerdown',e=>{ if(e.pointerType!=='mouse'||e.button!==0) return; drag={x:e.clientX,s:row.scrollLeft,moved:false}; });
  window.addEventListener('pointermove',e=>{ if(!drag) return; const dx=e.clientX-drag.x; if(Math.abs(dx)>5) drag.moved=true; if(drag.moved){ row.scrollLeft=drag.s-dx; row.classList.add('dragging'); } });
  window.addEventListener('pointerup',()=>{ if(!drag) return; const m=drag.moved; drag=null; row.classList.remove('dragging'); if(m) row.dataset.justDragged='1'; setTimeout(()=>{ delete row.dataset.justDragged; },0); });
  row.addEventListener('click',e=>{ if(row.dataset.justDragged){ e.stopPropagation(); e.preventDefault(); } },true); }
