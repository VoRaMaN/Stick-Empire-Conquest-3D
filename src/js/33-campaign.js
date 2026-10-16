/* ---------- campaign ---------- */
const CAMP_DEF=[
  {id:'sparta',name:'Sparta Hills',x:62,y:192,adj:['olive','bronze'],cap:true,note:'Rolling hills around your capital.'},
  {id:'olive',name:'Olive Coast',x:70,y:76,adj:['sparta','bronze','flats'],note:'Gentle coastal slopes.'},
  {id:'bronze',name:'Bronze Pass',x:160,y:146,adj:['sparta','olive','flats','ford'],note:'A narrow pass between two ridges.'},
  {id:'flats',name:'Salt Flats',x:176,y:44,adj:['olive','bronze','dunes'],note:'Dead flat. Nowhere to hide.'},
  {id:'ford',name:'Stone Ford',x:250,y:196,adj:['bronze','dunes','ash'],note:'Twin hills overlook the crossing.'},
  {id:'dunes',name:'Red Dunes',x:262,y:92,adj:['flats','ford','ash','keep'],note:'Broken ground of small dunes.'},
  {id:'ash',name:'Ash Valley',x:334,y:170,adj:['ford','dunes','keep'],note:'One great hill. Whoever holds it rules.'},
  {id:'keep',name:'Crimson Keep',x:344,y:56,adj:['dunes','ash'],cap:true,note:'The enemy capital, on high ground.'},
];
const CAMP_START={sparta:0,olive:0,bronze:-1,flats:-1,ford:1,dunes:1,ash:1,keep:1};
const CAMP_STR={bronze:1,flats:1,ford:2,dunes:2,ash:3,keep:4};
let camp=null;
function campLoad(){ try{ const s=JSON.parse(localStorage.getItem('se3d-campaign')||'null'); if(s&&s.owner) return s; }catch(e){} return null; }
function campSave(){ try{ localStorage.setItem('se3d-campaign',JSON.stringify(camp)); }catch(e){} }
function campNew(){ camp={owner:Object.assign({},CAMP_START),turn:1,pending:null,sel:null,msg:'Pick a territory next to yours and march.',over:null}; campSave(); }
const campT=id=>CAMP_DEF.find(t=>t.id===id);
// the two capitals take their names from the factions that hold them
const campName=id=>id==='sparta'?FACTIONS[settings.side==='chaos'?'chaos':'order'].cap[0]:id==='keep'?FACTIONS[otherSide(settings.side==='chaos'?'chaos':'order')].cap[1]:campT(id).name;
const campFoe=()=>FACTIONS[otherSide(settings.side==='chaos'?'chaos':'order')].team[1];
function campCanAttack(id){ if(!camp||camp.over||camp.pending) return false; const t=campT(id); return camp.owner[id]!==0&&t.adj.some(a=>camp.owner[a]===0); }
function openCampaign(){
  if(!camp) camp=campLoad(); if(!camp) campNew();
  const rb=$('#cReset'); if(rb.dataset) { delete rb.dataset.armed; rb.textContent='New campaign'; }
  game.paused=true; $('#camp').hidden=false; renderCampaign();
}
function closeCampaign(){ $('#camp').hidden=true; game.paused=false;
  // the last campaign battle is finished: don't leave the player on a destroyed field
  if(game.spent){ game.spent=false; game.campFight=null; if(game.mode==='battle'){ setTerrain('skirmish'); resetBattle(); } } }
function renderCampaign(){
  const svg=$('#cMap'); const C={0:'var(--gold)',1:'var(--crimson)','-1':'#8f8270'};
  let h='';
  const drawn=new Set();
  for(const t of CAMP_DEF) for(const a of t.adj){ const k=[t.id,a].sort().join(); if(drawn.has(k)) continue; drawn.add(k); const b=campT(a);
    h+='<line x1="'+t.x+'" y1="'+t.y+'" x2="'+b.x+'" y2="'+b.y+'" class="road"/>'; }
  for(const t of CAMP_DEF){ const own=camp.owner[t.id], R=t.cap?27:23, pts=[];
    for(let k=0;k<6;k++){ const a=Math.PI/6+k*Math.PI/3; pts.push((t.x+R*Math.cos(a)).toFixed(1)+','+(t.y+R*Math.sin(a)).toFixed(1)); }
    const cls='hex'+(camp.sel===t.id?' sel':'')+(campCanAttack(t.id)?' can':'')+(camp.pending&&camp.pending.id===t.id?' threat':'');
    h+='<g class="terr" data-id="'+t.id+'" tabindex="0" role="button" aria-label="'+t.name+'"><polygon points="'+pts.join(' ')+'" class="'+cls+'" style="fill:'+C[own]+'"/>';
    if(t.cap) h+='<text x="'+t.x+'" y="'+(t.y+5)+'" class="star">★</text>';
    else if(own!==0){ const s=CAMP_STR[t.id]||1; h+='<text x="'+t.x+'" y="'+(t.y+4)+'" class="pips">'+'●'.repeat(s)+'</text>'; }
    h+='<text x="'+t.x+'" y="'+(t.y+R+12)+'" class="tname">'+campName(t.id)+'</text></g>'; }
  svg.innerHTML=h;
  svg.querySelectorAll('.terr').forEach(g=>{ const id=g.getAttribute('data-id'); const go=()=>{ camp.sel=id; renderCampaign(); }; g.addEventListener('click',go); g.addEventListener('keydown',e=>{ if(e.key==='Enter') go(); }); });
  const owned=Object.values(camp.owner).filter(v=>v===0).length;
  $('#cTurn').textContent='Turn '+camp.turn+' · '+owned+' of 8 territories';
  const t=camp.sel&&campT(camp.sel); let msg=camp.msg, btn='March', can=false;
  if(camp.over){ btn='New campaign'; can=true; }
  else if(camp.pending){ const p=campT(camp.pending.id), pn=campName(p.id); msg=(camp.msg&&camp.msg.indexOf('marches')<0?camp.msg+' ':'')+'Now the '+campFoe()+' marches on <b>'+pn+'</b>! Defend it or lose it.'; btn='Defend '+pn; can=true; }
  else if(t){ const own=camp.owner[t.id], tn=campName(t.id); msg='<b>'+tn+'</b> · '+t.note+' '+(own===0?'Held by you.':(own===1?campFoe().split(' ')[0]+' garrison ':'Rebel garrison ')+'●'.repeat(CAMP_STR[t.id]||1)+'.');
    can=campCanAttack(t.id); btn=can?'March on '+tn:(own===0?'Already yours':'Not next to your land'); }
  $('#cMsg').innerHTML=msg; $('#cGo').textContent=btn; $('#cGo').disabled=!can;
}
function campGo(){
  if(camp.over){ campNew(); renderCampaign(); return; }
  if(camp.pending){ startCampFight(camp.pending.id,false); return; }
  if(camp.sel&&campCanAttack(camp.sel)) startCampFight(camp.sel,true);
}
function startCampFight(id,attacking){
  const owned=Object.values(camp.owner).filter(v=>v===0).length, str=attacking?(CAMP_STR[id]||1):Math.min(4,2+Math.floor(camp.turn/3));
  if(game.demo||!menuEl.hidden) closeMenu();
  game.campFight={id,attacking,str}; game.spent=false; game.tutorial=null; endCoach();
  closeCampaign(); setFactions(settings.side); if(game.mode!=='battle'){ game.mode='battle'; } syncModeUI();
  setTerrain(id);
  resetBattle({gold:[800+260*owned,500+520*str],enemyExtra:str,statueHp:[2600,1800+500*str]});
  showBanner(campName(id),(attacking?'Attack':'Defend')+' · enemy strength '+'●'.repeat(str),2.8);
  setTab('camp');
}
function finishCampFight(winner){
  const f=game.campFight; game.campFight=null; if(!camp||!f) return; game.spent=true;
  const tn=campName(f.id);
  if(f.attacking){ if(winner===0){ camp.owner[f.id]=0; camp.msg='Victory! '+tn+' is yours.'; } else camp.msg='Defeat at '+tn+'. Your army fell back.'; }
  else { camp.pending=null; if(winner===0) camp.msg='You held '+tn+'!'; else { camp.owner[f.id]=1; camp.msg=tn+' has fallen to the '+campFoe()+'.'; } }
  if(camp.owner.keep===0){ camp.over='win'; camp.msg=campName('keep')+' has fallen. The campaign is won!'; }
  else if(camp.owner.sparta===1){ camp.over='lose'; camp.msg=campName('sparta')+' has fallen. The campaign is lost.'; }
  else { camp.turn++;
    // the enemy strikes back at one of your border territories
    const border=CAMP_DEF.filter(x=>camp.owner[x.id]===0&&x.adj.some(a=>camp.owner[a]===1));
    if(border.length&&Math.random()<.55){ const b=border[Math.floor(Math.random()*border.length)]; camp.pending={id:b.id}; } }
  camp.sel=null; campSave(); openCampaign();
}

