/* ---------- campaign ----------
   The campaign runs on the regions of the war-table world (32z data, 33a generation, 33b the 3D table).
   Owners are numbers from the player's point of view: 0 yours, 1 the rival main empire, 2 the Wildlands
   Confederacy, -1 the free holds (rebels). A region can be attacked only from a region you hold next to it. */
let CAMP_DEF=null, CAMP_START=null, CAMP_STR=null;
const campSide=()=>settings.side==='chaos'?'chaos':'order';
const campOwnerOf=fac=>fac===campSide()?0:fac==='rebel'?-1:fac==='wild'?2:1;
const campMyCap=()=>campSide()==='chaos'?'keep':'sparta', campFoeCap=()=>campSide()==='chaos'?'sparta':'keep';
// the region list in the campaign's own shape (svg position for the 2D fallback map, neighbours from the region grid)
function campInit(){
  if(CAMP_DEF&&CAMP_DEF.side===campSide()) return;
  cwBuildGrid();
  CAMP_DEF=CW_REGIONS.map(R=>({id:R.id,name:R.name,x:(R.x+100)*2,y:(R.z+65)/130*240,adj:CW.adj[R.id],cap:!!R.capital,note:R.note,R}));
  CAMP_DEF.side=campSide();
  CAMP_START={}; CAMP_STR={}; for(const R of CW_REGIONS){ CAMP_START[R.id]=campOwnerOf(R.fac); CAMP_STR[R.id]=R.capital?4:(R.s||1); }
}
let camp=null;
function campLoad(){ try{ const s=JSON.parse(localStorage.getItem('se3d-campaign')||'null'); if(s&&s.owner){ campInit(); for(const id in CAMP_START) if(s.owner[id]===undefined) s.owner[id]=CAMP_START[id]; return s; } }catch(e){} return null; }
function campSave(){ try{ localStorage.setItem('se3d-campaign',JSON.stringify(camp)); }catch(e){} }
function campNew(){ campInit(); camp={v:2,owner:Object.assign({},CAMP_START),turn:1,pending:null,sel:null,msg:'Pick a region next to yours and march.',over:null}; campSave(); }
const campT=id=>{ campInit(); return CAMP_DEF.find(t=>t.id===id); };
const campName=id=>{ const t=campT(id); return t?t.name:id; };
const OWNER_NAME=o=>o===0?FACTIONS[campSide()].team[0]:o===1?FACTIONS[otherSide(campSide())].team[1]:o===2?CW_FACTIONS.wild.name:CW_FACTIONS.rebel.name;
const campFoe=o=>OWNER_NAME(o===undefined?1:o);
const campOwnerCol=o=>o===0?'var(--gold)':o===1?'var(--crimson)':o===2?'#4fae6a':'#8f8270';
function campCanAttack(id){ if(!camp||camp.over||camp.pending) return false; const t=campT(id); return !!t&&camp.owner[id]!==0&&t.adj.some(a=>camp.owner[a]===0); }
function openCampaign(){
  campInit(); if(!camp) camp=campLoad(); if(!camp) campNew();
  const rb=$('#cReset'); if(rb.dataset) { delete rb.dataset.armed; rb.textContent='New campaign'; }
  game.paused=true; $('#camp').hidden=false; renderCampaign();
  if(typeof cwOpen==='function') cwOpen();   // the 3D war table (33b); the flat map stays as a fallback
}
function closeCampaign(){ $('#camp').hidden=true; game.paused=false; if(typeof cwClose==='function') cwClose();
  // the last campaign battle is finished: don't leave the player on a destroyed field
  if(game.spent){ game.spent=false; game.campFight=null; if(game.mode==='battle'){ setTerrain('skirmish'); resetBattle(); } } }
function campSelect(id){ if(!camp) return; camp.sel=id; renderCampaign(); }
function renderCampaign(){
  campInit();
  const svg=$('#cMap'); const C={0:'var(--gold)',1:'var(--crimson)',2:'#4fae6a','-1':'#8f8270'};
  let h='';
  const drawn=new Set();
  for(const t of CAMP_DEF) for(const a of t.adj){ const k=[t.id,a].sort().join(); if(drawn.has(k)) continue; drawn.add(k); const b=campT(a);
    h+='<line x1="'+t.x+'" y1="'+t.y+'" x2="'+b.x+'" y2="'+b.y+'" class="road"/>'; }
  for(const t of CAMP_DEF){ const own=camp.owner[t.id], R=t.cap?11:8.5, pts=[];
    for(let k=0;k<6;k++){ const a=Math.PI/6+k*Math.PI/3; pts.push((t.x+R*Math.cos(a)).toFixed(1)+','+(t.y+R*Math.sin(a)).toFixed(1)); }
    const cls='hex'+(camp.sel===t.id?' sel':'')+(campCanAttack(t.id)?' can':'')+(camp.pending&&camp.pending.id===t.id?' threat':'');
    h+='<g class="terr" data-id="'+t.id+'" tabindex="0" role="button" aria-label="'+t.name+'"><polygon points="'+pts.join(' ')+'" class="'+cls+'" style="fill:'+C[own]+'"/>';
    if(t.cap) h+='<text x="'+t.x+'" y="'+(t.y+4)+'" class="star">★</text>';
    h+='<text x="'+t.x+'" y="'+(t.y+R+7)+'" class="tname">'+campName(t.id)+'</text></g>'; }
  svg.innerHTML=h;
  svg.querySelectorAll('.terr').forEach(g=>{ const id=g.getAttribute('data-id'); const go=()=>{ camp.sel=id; renderCampaign(); if(typeof cwRefresh==='function') cwRefresh(); }; g.addEventListener('click',go); g.addEventListener('keydown',e=>{ if(e.key==='Enter') go(); }); });
  const owned=Object.values(camp.owner).filter(v=>v===0).length;
  $('#cTurn').textContent='Turn '+camp.turn+' · '+owned+' of '+CAMP_DEF.length+' regions';
  const t=camp.sel&&campT(camp.sel); let msg=camp.msg, btn='March', can=false;
  if(camp.over){ btn='New campaign'; can=true; }
  else if(camp.pending){ const p=campT(camp.pending.id), pn=campName(p.id); msg=(camp.msg&&camp.msg.indexOf('marches')<0?camp.msg+' ':'')+'Now the '+campFoe(camp.pending.by)+' marches on <b>'+pn+'</b>! Defend it or lose it.'; btn='Defend '+pn; can=true; }
  else if(t){ const R=t.R, own=camp.owner[t.id], tn=campName(t.id), B=CW_BIOME[R.biome], nb=t.adj.map(a=>'<span class="cnb" style="border-color:'+campOwnerCol(camp.owner[a])+'">'+campName(a)+'</span>').join(' ');
    const rel=own===0?'Held by you':own===1||own===2?'Enemy: '+OWNER_NAME(own):'Free hold (rebels)', border=own===0&&t.adj.some(a=>camp.owner[a]!==0);
    msg='<b>'+tn+'</b>'+(R.capital?' ★ capital':'')+(R.strat?' ◆ '+R.strat:'')+'<br><small>'+CW_TERR[R.terr].name+' · '+B.name+' · '+(SET_NAME[R.set]||'open country')+'</small><br>'+
      R.note+'<br><small>'+rel+(border?' · borders enemy land':'')+' · garrison '+'●'.repeat(CAMP_STR[t.id]||1)+' · tribute +'+campTribute(t.id)+' gold for your battles</small>'+
      '<div class="cnbs"><small>Neighbours:</small> '+nb+'</div>';
    can=campCanAttack(t.id); btn=can?'March on '+tn:(own===0?'Already yours':'Not next to your land'); }
  $('#cMsg').innerHTML=msg; $('#cGo').textContent=btn; $('#cGo').disabled=!can;
}
const SET_NAME={capital:'capital city',castle:'castle',fort:'fort',village:'village',tower:'watchtower',camp:'war camp',chaosfort:'dark fortress',timber:'timber hold'};
const campTribute=id=>{ const t=campT(id); return t&&t.R.capital?150:t&&t.R.strat?90:50; };
function campGo(){
  if(camp.over){ campNew(); renderCampaign(); if(typeof cwRefresh==='function') cwRefresh(); return; }
  if(camp.pending){ startCampFight(camp.pending.id,false); return; }
  if(camp.sel&&campCanAttack(camp.sel)) startCampFight(camp.sel,true);
}
// the battlefield for a region: river crossings are fought on Riverlands, the rest on the ground preset of its biome
function campPreset(id){ const t=campT(id), R=t&&t.R; if(!R) return 'skirmish'; if(R.strat==='River crossing') return 'riverlands'; if(TPRESET[id]) return id; return CW_BIOME[R.biome].preset||'skirmish'; }
function startCampFight(id,attacking){
  campInit();
  const owned=CAMP_DEF.filter(t=>camp.owner[t.id]===0).reduce((a,t)=>a+campTribute(t.id),0), str=attacking?(CAMP_STR[id]||1):Math.min(4,2+Math.floor(camp.turn/3));
  if(game.demo||!menuEl.hidden) closeMenu();
  game.campFight={id,attacking,str,foe:attacking?camp.owner[id]:(camp.pending&&camp.pending.by)||1}; game.spent=false; game.tutorial=null; endCoach();
  closeCampaign(); setFactions(campSide(),game.campFight.foe===2?'wild':otherSide(campSide())); if(game.mode!=='battle'){ game.mode='battle'; } syncModeUI();
  setTerrain(campPreset(id));
  resetBattle({gold:[Math.min(4200,600+owned),500+520*str],enemyExtra:str,statueHp:[2600,1800+500*str]});
  showBanner(campName(id),(attacking?'Attack':'Defend')+' · '+campFoe(game.campFight.foe)+' · strength '+'●'.repeat(str),2.8);
  setTab('camp');
}
function finishCampFight(winner){
  const f=game.campFight; game.campFight=null; if(!camp||!f) return; game.spent=true;
  const tn=campName(f.id);
  if(f.attacking){ if(winner===0){ camp.owner[f.id]=0; camp.msg='Victory! '+tn+' is yours.'; } else camp.msg='Defeat at '+tn+'. Your army fell back.'; }
  else { camp.pending=null; if(winner===0) camp.msg='You held '+tn+'!'; else { const by=f.foe||1; camp.owner[f.id]=by; camp.msg=tn+' has fallen to the '+campFoe(by)+'.'; } }
  if(camp.owner[campFoeCap()]===0){ camp.over='win'; camp.msg=campName(campFoeCap())+' has fallen. The campaign is won!'; }
  else if(camp.owner[campMyCap()]!==0){ camp.over='lose'; camp.msg=campName(campMyCap())+' has fallen. The campaign is lost.'; }
  else { camp.turn++; campEnemyTurn(); }
  camp.sel=null; campSave(); openCampaign();
}
// the other powers move: each may swallow a free hold next to it, and one of them may strike at your border
function campEnemyTurn(){
  for(const o of [1,2]){ if(Math.random()<.3){ const opts=CAMP_DEF.filter(x=>camp.owner[x.id]===-1&&x.adj.some(a=>camp.owner[a]===o)); if(opts.length){ const x=opts[Math.floor(Math.random()*opts.length)]; camp.owner[x.id]=o; camp.msg+=' The '+campFoe(o)+' took '+x.name+'.'; } } }
  const border=CAMP_DEF.filter(x=>camp.owner[x.id]===0&&x.adj.some(a=>camp.owner[a]===1||camp.owner[a]===2));
  if(border.length&&Math.random()<.55){ const b=border[Math.floor(Math.random()*border.length)], by=b.adj.map(a=>camp.owner[a]).find(o=>o===1||o===2)||1; camp.pending={id:b.id,by}; }
}
