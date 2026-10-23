/* ================= The command HUD: abilities, control groups, alerts, the build queue, tooltips, pings,
   the order path, the end-of-battle report, the phone's radial menu and the accessibility options =================
   Everything here is DOM over the battlefield (plus a few dots on the ground and on the map), refreshed a few
   times a second; nothing here changes the simulation except through issue() like every other control. */
const HUD3={t:0,abSig:'',grpSig:'',qSig:'',pingArm:false,tip:null,tipT:0,tipXY:[0,0],chipTip:null,lp:null};
const COUNTER={
  miner:['Digs gold for the army','Everything'],thrall:['Digs soul crystals','Everything'],
  sword:['Archers, Thralls, casters','Spartans, Giants'],spear:['Knights, Cerberus, Hounds, charges','Archers, Wizards'],
  archer:['Spartans, Giants, slow troops','Knights, Ninjas, Hounds'],giant:['Swordsmen, packed crowds','Archers, Ninjas'],
  ninja:['Archers, Wizards, Clerics','Spartans, Swordsmen'],wizard:['Packed crowds','Knights, Ninjas'],cleric:['Keeps the line alive','Knights, Ninjas'],
  wing:['Giants and slow troops','Archers, Harvesters'],knight:['Archers, casters, crowds (from the air)','Spartans; archers when aloft'],
  crawler:['Archers and light troops','Spartans, Giants'],hound:['Stragglers, archers','Spartans'],dread:['Swordsmen, shield walls','Archers, Wizards'],
  harvester:['Spartans, Giants','Knights, Ninjas'],boner:['Archers','Spartans'],bomber:['Packed crowds','Knights, Archers'],oracle:['Keeps the horde alive','Knights, Ninjas'],
  reaper:['Swordsmen, crowds','Archers'],hades:['Almost anything','Massed archers'],cerberus:['Crowds, Swordsmen','Spartans, Archers'],
};
const hud3On=()=>{ if(game.mode!=='battle'||game.demo||CW3.on||!menuEl.hidden) return false; const r=$('#results'), p=$('#pause'); return !(r&&!r.hidden)&&!(p&&!p.hidden); };
const qsa=(el,q)=>{ const r=el&&el.querySelectorAll?el.querySelectorAll(q):null; return r&&r.length!==undefined?Array.from(r):[]; };
const esc3=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- the ability bar: your general (always) and the selection's specials ---------- */
function abEntries(){
  const me=myTeam(), out=[];
  const hu=HEROS.u[me];
  if(heroOn()||hu) for(const ab of heroDef(me).ab){ const A=HERO_AB[ab], end=HEROS.cd[me][ab]||0;
    out.push({id:'h:'+ab,ab,hero:1,name:A.name,ico:A.ico,key:A.key,desc:A.desc,cd:A.cd,end,off:!hu||!hu.alive}); }
  const seen={};
  for(const r of selRegs) for(const ab of regAbilities(r)){ const A=UNIT_AB[ab], end=r.abT&&r.abT[ab]||0;
    if(!seen[ab]){ seen[ab]={id:'u:'+ab,ab,name:A.name,ico:A.ico,key:A.key,desc:A.desc,cd:A.cd,end,off:false}; out.push(seen[ab]); }
    else seen[ab].end=Math.min(seen[ab].end,end); }
  return out;
}
function abUse(id){
  if(game.mode!=='battle'||game.paused) return;
  const [k,ab]=id.split(':');
  if(k==='h'){ const me=myTeam(); if(!heroReady(me,ab)){ toast(HERO_AB[ab].name+' is not ready yet'); sfx('deny'); return; }
    if(!HEROS.u[me]||!HEROS.u[me].alive){ toast('Your '+heroDef(me).name+' is not on the field'); sfx('deny'); return; }
    if(!NET.on){ const r=heroCast(me,ab); if(r!==true){ if(r==='no_target') toast('No enemies close enough to the Warlord'); sfx('deny'); } else sfx('order'); }
    else { issue('hero',{ab}); sfx('order'); }
    return; }
  let n=0; for(const r of selRegs) if(regAbilities(r).includes(ab)&&regAbReady(r,ab)){ issue('ab',{r:r.id,ab}); n++; }
  if(n) sfx('order'); else { sfx('deny'); toast(UNIT_AB[ab].name+' is not ready yet'); }
}
function abRender(){
  const bar=$('#abBar'); if(!bar) return;
  const L=hud3On()?abEntries():[], me=myTeam(), hu=HEROS.u[me];
  const showHero=hud3On()&&(heroOn()||hu);
  bar.hidden=!L.length&&!showHero; if(bar.hidden) return;
  const sig=L.map(e=>e.id).join(',')+'|'+(showHero?1:0);
  if(sig!==HUD3.abSig){ HUD3.abSig=sig;
    let h='';
    if(showHero){ const D=heroDef(me), ty=D.type; h+='<div class="ab-hero" id="abHero" title="Your '+D.name+'"><i class="ab-por" style="'+(ICONS[ty]?'background-image:url('+ICONS[ty]+')':'')+'"></i><div class="ab-ht"><b id="abHn">'+D.name+'</b><span class="ab-hp"><i id="abHhp"></i></span><span class="ab-xp"><i id="abHxp"></i></span><small id="abHs"></small></div></div>'; }
    h+=L.map(e=>'<button class="ab'+(e.hero?' hero':'')+'" data-ab="'+e.id+'" aria-label="'+esc3(e.name)+' ('+e.key+')"><span class="ico">'+e.ico+'</span><span class="nm">'+esc3(e.name)+'</span><kbd>'+e.key+'</kbd><i class="cd"></i><span class="cdt"></span></button>').join('');
    bar.innerHTML=h;
    for(const b of qsa(bar,'button.ab')){ b.onclick=()=>abUse(b.dataset.ab);
      b.onmouseenter=()=>{ const e=abEntries().find(x=>x.id===b.dataset.ab); if(e) tipShow('<b>'+esc3(e.name)+'</b><span>'+esc3(e.desc)+'</span><em>Cooldown '+e.cd+' s · key '+e.key+'</em>',b); };
      b.onmouseleave=()=>tipHide(); }
    const hc=$('#abHero'); if(hc) hc.onclick=()=>{ const u=HEROS.u[myTeam()]; if(u&&u.alive&&u.reg){ setSelection([u.reg]); centerOn([u.reg]); sfx('ui'); } };
  }
  // cooldown sweeps and the general's card
  const now=game.time;
  for(const b of qsa(bar,'button.ab')){ const e=L.find(x=>x.id===b.dataset.ab); if(!e) continue; const left=Math.max(0,e.end-now);
    b.style.setProperty('--cd',(left/e.cd).toFixed(3)); b.querySelector('.cdt').textContent=left>0?Math.ceil(left):''; b.classList.toggle('ready',left<=0&&!e.off); b.disabled=!!e.off; }
  if(showHero){ const hp=$('#abHhp'), xp=$('#abHxp'), s=$('#abHs'), n=$('#abHn'), D=heroDef(me);
    if(hu&&hu.alive){ hp.style.width=(100*clamp(hu.hp/hu.maxHp,0,1)).toFixed(1)+'%'; const lv=hu.heroLv||1, x0=HERO_XP[lv-1]||0, x1=HERO_XP[lv]||x0+1, xx=HEROS.xp[me];
      xp.style.width=(lv>=5?100:100*clamp((xx-x0)/(x1-x0),0,1)).toFixed(1)+'%'; n.textContent=D.name+' · Lv '+lv; s.textContent=lv>=5?'max level':(Math.max(0,x1-xx))+' kills to level '+(lv+1); }
    else { hp.style.width='0%'; n.textContent=D.name; const left=HEROS.respawn[me]?Math.max(0,HEROS.respawn[me]-now):0; s.textContent=left>0?'back in '+Math.ceil(left)+' s':'fallen'; } }
}

/* ---------- control groups ---------- */
function grpRender(){
  const bar=$('#grpBar'); if(!bar) return;
  if(!hud3On()||!rtsOn()){ bar.hidden=true; return; }
  const G=[]; for(let d=1;d<=9;d++){ const L=(RTS.groups[d]||[]).map(id=>regs.find(r=>r.id===id)).filter(r=>r&&regAlive(r).length); if(L.length){ let n=0; const k={}; for(const r of L){ const m=regAlive(r).length; n+=m; k[r.type]=(k[r.type]||0)+m; } G.push({d,L,n,ty:Object.keys(k).sort((a,b)=>k[b]-k[a])[0]}); } }
  const canAdd=selRegs.length>0&&G.length<9;
  bar.hidden=!G.length&&!canAdd; if(bar.hidden) return;
  const sig=G.map(g=>g.d+':'+g.n+':'+g.ty+':'+(g.L.every(r=>selRegs.includes(r))&&g.L.length===selRegs.length?1:0)).join(',')+'|'+(canAdd?1:0);
  if(sig===HUD3.grpSig) return; HUD3.grpSig=sig;
  bar.innerHTML=G.map(g=>{ const on=g.L.every(r=>selRegs.includes(r))&&g.L.length===selRegs.length;
    return '<button class="grp'+(on?' on':'')+'" data-g="'+g.d+'" title="Group '+g.d+': '+g.L.length+' regiment'+(g.L.length>1?'s':'')+' · click to select, twice to look"><kbd>'+g.d+'</kbd><i class="gi" style="'+(ICONS[g.ty]?'background-image:url('+ICONS[g.ty]+')':'')+'"></i><span>'+g.n+'</span></button>'; }).join('')
    +(canAdd?'<button class="grp add" id="grpAdd" title="Make a group of the selection (Ctrl+1–9)">+</button>':'');
  for(const b of qsa(bar,'button.grp[data-g]')) b.onclick=()=>grpPick(b.dataset.g);
  const a=$('#grpAdd'); if(a) a.onclick=()=>{ let d=1; while(d<=9&&(RTS.groups[d]||[]).some(id=>regs.some(r=>r.id===id&&regAlive(r).length))) d++; if(d>9) return; RTS.groups[d]=selRegs.map(r=>r.id); sfx('ui'); toast('Group '+d+': '+selRegs.length+' regiment'+(selRegs.length>1?'s':'')+' · press '+d+' to pick it'); HUD3.grpSig=''; };
}
function grpPick(dig){
  const L=(RTS.groups[dig]||[]).map(id=>regs.find(r=>r.id===id)).filter(r=>r&&regAlive(r).length); if(!L.length) return;
  const now=performance.now(); setSelection(L); sfx('ui'); if(RTS.lastG===dig&&now-RTS.lastGT<420) centerOn(L); RTS.lastG=dig; RTS.lastGT=now; HUD3.grpSig='';
}

/* ---------- alerts ---------- */
function alertsRender(){
  const box=$('#alerts'); if(!box) return;
  const now=performance.now(); for(let i=ALERTS.length-1;i>=0;i--) if(now-ALERTS[i].at>9000) ALERTS.splice(i,1);
  box.hidden=!hud3On()||!ALERTS.length; if(box.hidden){ box.innerHTML=''; return; }
  const sig=ALERTS.map(a=>a.id).join(','); if(box._sig===sig) return; box._sig=sig;
  box.innerHTML=ALERTS.map(a=>'<button class="alert k-'+a.kind+'" data-id="'+a.id+'"'+(a.x===undefined?' disabled':'')+'><i></i><span>'+esc3(a.text)+'</span>'+(a.x===undefined?'':'<em>look</em>')+'</button>').join('');
  for(const b of qsa(box,'button.alert')) b.onclick=()=>{ const a=ALERTS.find(x=>String(x.id)===b.dataset.id); if(!a||a.x===undefined) return; alertJump(a); };
}
function alertJump(a){ if(cam.follow){ cam.follow=null; updateFollowUI(); } cam.goal.set(a.x,0,a.z); clampGoal(); cam.dGoal=Math.min(cam.dGoal,34); sfx('ui');
  const i=ALERTS.indexOf(a); if(i>=0) ALERTS.splice(i,1); alertsRender(); }

/* ---------- the build and research queue ---------- */
function qRender(){
  const box=$('#qPanel'); if(!box) return;
  const C=hud3On()&&castleOn()?CASTLES[myTeam()]:null, rows=[];
  if(C) for(const B of [...C.list,C.keep]){ if(!B) continue;
    if(B.train){ const T=TYPES[B.train.type]; rows.push({B,key:B.id+'t',ty:B.train.type,name:T?tName(B.train.type):B.train.type,k:1-clamp(B.train.t/Math.max(.01,B.train.tot),0,1),left:B.train.t,more:(B.q||[]).length}); }
    else if(B.q&&B.q.length) rows.push({B,key:B.id+'q',ty:B.q[0],name:TYPES[B.q[0]]?tName(B.q[0]):B.q[0],k:0,left:0,more:B.q.length-1,wait:1});
    if(B.res){ const R=RES_BY_ID[B.res.id]; rows.push({B,key:B.id+'r',res:1,name:R?rName(R,myTeam())+(R.lv>1?' '+['I','II','III'][B.res.lvl-1]:''):B.res.id,k:1-clamp(B.res.t/Math.max(.01,B.res.tot),0,1),left:B.res.t,more:0}); } }
  box.hidden=!rows.length; if(box.hidden) return;
  const sig=rows.map(r=>r.key+r.ty+r.more).join(',');
  if(sig!==HUD3.qSig){ HUD3.qSig=sig;
    box.innerHTML='<h4>Training &amp; research</h4>'+rows.map((r,i)=>'<button class="qrow'+(r.res?' res':'')+'" data-i="'+i+'"><i class="qi" style="'+(r.ty&&ICONS[r.ty]?'background-image:url('+ICONS[r.ty]+')':'')+'">'+(r.res?'⚗':'')+'</i><span class="qn">'+esc3(r.name)+(r.more?' <b>+'+r.more+'</b>':'')+'<small>'+esc3(r.B.name||'')+'</small></span><span class="qb"><i></i></span><span class="qt"></span></button>').join('');
    box._rows=rows; qsa(box,'.qrow').forEach(b=>{ b.onclick=()=>{ const r=box._rows[+b.dataset.i]; if(r&&r.B) openPanel(r.B); }; }); }
  box._rows=rows;
  qsa(box,'.qrow').forEach((b,i)=>{ const r=rows[i]; if(!r) return; b.querySelector('.qb i').style.width=(100*r.k).toFixed(1)+'%'; b.querySelector('.qt').textContent=r.wait?'waiting':Math.ceil(r.left)+' s'; });
}

/* ---------- hover tooltips: soldiers on the field, units in the dock ---------- */
function tipShow(html,anchor,x,y){
  const t=$('#utip'); if(!t) return; t.innerHTML=html; t.hidden=false;
  let px=x, py=y; if(anchor){ const r=anchor.getBoundingClientRect(); px=r.left+r.width/2; py=r.top-8; t.style.transform='translate(-50%,-100%)'; } else t.style.transform='';
  const w=t.offsetWidth||220, h=t.offsetHeight||100;
  if(!anchor){ px=Math.min(innerWidth-w-8,px+16); py=Math.min(innerHeight-h-8,py+16); } else { px=clamp(px,w/2+8,innerWidth-w/2-8); py=Math.max(h+8,py); }
  t.style.left=px+'px'; t.style.top=py+'px';
}
function tipHide(){ const t=$('#utip'); if(t) t.hidden=true; HUD3.tip=null; }
function unitTipHTML(u){
  const T=u.T, me=myTeam(), C=COUNTER[u.type]||['',''], own=u.team===me;
  let name=T.name; if(u.summonT) name='Treant (summoned)'; else if(u.hero) name=heroDef(u.team).name+' · level '+(u.heroLv||1); else if(u.rider) name='Cerberus · Hell Rider'; else if(u.camp) name=(u.type==='giant'?'Ogre':'Bandit')+' (neutral)';
  const side=u.team>1?'Neutral camp':own?'Your army':teamName(u.team);
  const st=[]; const S=u.st||{}; if(S.burn) st.push('burning'); if(S.poison) st.push('poisoned'); if(S.rend) st.push('cursed'); if(u.routing) st.push('routing'); if(u.noSupply) st.push('out of supply'); if(u.wallT>game.time) st.push('shield wall'); if(u.rallyT>game.time) st.push('rallied'); if(u.auraT>game.time&&!u.hero) st.push('inspired');
  const arm=Math.round(100*((T.armor||0)+(u.rider?.15:0))), stars=u.reg&&u.reg.rank?' '+'★'.repeat(u.reg.rank):'';
  return '<b>'+esc3(name)+stars+'</b><span class="tside'+(own?' own':u.team>1?' neu':' foe')+'">'+esc3(side)+(u.reg&&!u.reg.hero&&u.team<2?' · Regiment '+ROMAN(u.reg.num):'')+'</span>'
    +'<span class="thp"><i style="width:'+(100*clamp(u.hp/u.maxHp,0,1)).toFixed(0)+'%"></i></span><span>'+Math.ceil(u.hp)+' / '+Math.round(u.maxHp)+' health · armour '+arm+'%'+(u.team<2?' · morale '+Math.round(u.morale):'')+'</span>'
    +(st.length?'<span class="tst">'+st.join(' · ')+'</span>':'')+(C[0]?'<em>Strong against: '+esc3(C[0])+'</em><em>Weak against: '+esc3(C[1])+'</em>':'');
}
function typeTipHTML(t){
  const T=unitT(t,myTeam()), C=COUNTER[t]||['',''], mc=MANA_COST[t]||0;
  return '<b>'+esc3(T.name)+'</b><span>'+T.cost+' '+money(myTeam())+(mc?' · '+mc+' mana':'')+' · '+T.hp+' health · '+T.dmg+' damage · speed '+T.speed+(T.armor?' · armour '+Math.round(T.armor*100)+'%':'')+'</span>'
    +(C[0]?'<em>Strong against: '+esc3(C[0])+'</em><em>Weak against: '+esc3(C[1])+'</em>':'');
}
canvas.addEventListener('pointermove',e=>{ if(e.pointerType!=='mouse') return; HUD3.tipXY=[e.clientX,e.clientY]; HUD3.tipT=0; });
canvas.addEventListener('pointerleave',()=>tipHide());
function tipTick(rdt){
  if(!hud3On()||uiMode()!=='pc'||ptrs.size||HUD3.chipTip){ if(HUD3.tip) tipHide(); return; }
  HUD3.tipT-=rdt; if(HUD3.tipT>0) return; HUD3.tipT=.12;
  const [x,y]=HUD3.tipXY; if(!x&&!y) return;
  const hit=unitAt(x,y,26), u=hit&&hit.u;
  if(!u||!u.isUnit&&!u.camp){ if(HUD3.tip) tipHide(); return; }
  HUD3.tip=u; tipShow(unitTipHTML(u),null,x,y);
}
{ const ch=$('#chips'); if(ch){
  ch.addEventListener('mouseover',e=>{ const b=e.target.closest&&e.target.closest('.chip'); if(!b||game.mode!=='battle') return; const t=b.id.replace('chip-',''); if(!TYPES[t]) return; HUD3.chipTip=t; tipShow(typeTipHTML(t),b); });
  ch.addEventListener('mouseout',e=>{ const b=e.target.closest&&e.target.closest('.chip'); if(b&&!b.contains(e.relatedTarget)){ HUD3.chipTip=null; tipHide(); } }); } }

/* ---------- pings: P (or the ping button), then click the field or the map ---------- */
function pingArm(on){ HUD3.pingArm=on; const b=$('#pingB'); if(b) b.setAttribute('aria-pressed',on); document.body.classList.toggle('ping-arm',on); if(on) toast('Click the field or the map to ping it for your team'); }
{ const b=$('#pingB'); if(b) b.onclick=()=>{ sfx('ui'); pingArm(!HUD3.pingArm); }; }
canvas.addEventListener('pointerdown',e=>{ if(!HUD3.pingArm||game.mode!=='battle') return; const gp=groundPoint(e.clientX,e.clientY); pingArm(false); if(gp){ pingSend(gp.x,gp.z); e.stopImmediatePropagation(); } },true);
function hud3Late(){   // after every file has loaded (the map and the menus are defined further on)
  if(mmEl&&mmEl.addEventListener) mmEl.addEventListener('pointerdown',e=>{ if(!HUD3.pingArm) return; const r=mmEl.getBoundingClientRect(); pingArm(false); pingSend(MM.x0+(e.clientX-r.left)/r.width*(MM.x1-MM.x0),MM.z0+(e.clientY-r.top)/r.height*(MM.z1-MM.z0)); e.stopImmediatePropagation(); },true);
  applyAccess(); accessUI();
}

/* ---------- keys: T Y the general, U I the selection's specials, L the latest alert, P ping ---------- */
window.addEventListener('keydown',e=>{
  if(CW3.on||game.mode!=='battle'||game.paused||e.ctrlKey||e.metaKey||e.altKey||(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))) return;
  const k=(e.key||'').toUpperCase();
  if(k==='P'){ pingArm(!HUD3.pingArm); return; }
  if(k==='L'){ const a=ALERTS.find(x=>x.x!==undefined); if(a) alertJump(a); return; }
  if('TYUI'.includes(k)&&k.length===1){ const L=abEntries().filter(x=>x.key===k); if(L.length){ e.preventDefault(); abUse(L[0].id); } return; }
  const kk=(e.shiftKey?'⇧':'')+k;   // the Wyvern Knight: G, J K N M B, Shift + J K N M B (27f)
  if(/^(⇧?[JKNMB]|G)$/.test(kk)){ const L=abEntries().filter(x=>x.key===kk); if(L.length){ e.preventDefault(); abUse(L[0].id); } }
});

/* ---------- the order path: dots on the ground from the regiment to each waypoint, and on the map ---------- */
const _op1=new V3(), _op2=new V3();
function regPath(r){ const o=r.order; if(!o||o.kind!=='move') return null; const c=regCenter(r), P=[{x:c.x,z:c.z},{x:o.x,z:o.z}]; if(o.q) for(const w of o.q) P.push(w); return P; }
function drawOrderPaths(){
  if(game.mode!=='battle') return; storyDraw(); let budget=520; const tt=game.time;
  for(const r of selRegs){ const P=regPath(r); if(!P) continue;
    for(let i=1;i<P.length&&budget>0;i++){ const a=P[i-1], b=P[i], L=Math.hypot(b.x-a.x,b.z-a.z), n=Math.floor(L/1.6);
      for(let k=1;k<n&&budget>0;k++){ const f=(k+((tt*1.5)%1))/n; if(f>=1) continue; _op1.set(a.x+(b.x-a.x)*f,0,a.z+(b.z-a.z)*f); _op1.y=H(_op1.x,_op1.z)+.1;
        _s.setScalar(.13); _m.compose(_op1,_qi,_s); put(glowIM,scol(i>1?'#9fe0ff':'#ffd36b')); budget--; }
      _op2.set(b.x,H(b.x,b.z)+.12,b.z); _s.setScalar(.32); _m.compose(_op2,_qi,_s); put(glowIM,scol(i>1?'#9fe0ff':'#ffd36b')); } }
  // pings: a bright beacon for a few seconds
  for(const p of PINGS){ const age=tt-p.t; if(age>6||age<0) continue; for(let i=0;i<6;i++){ _op1.set(p.x,H(p.x,p.z)+.3+i*.8+((tt*3)%1)*.8,p.z); _s.setScalar(.22*(1-i/7)); _m.compose(_op1,_qi,_s); put(glowIM,scol('#7fe0ff')); } }
}
// the map: queued paths, the fights going on now, pings
function minimapExtras(c,w,h,dpr){
  c.save(); c.setLineDash([3*dpr,3*dpr]); c.lineWidth=1.3*dpr;
  for(const r of selRegs){ const P=regPath(r); if(!P) continue; c.strokeStyle='rgba(255,226,140,.9)'; c.beginPath(); P.forEach((p,i)=>{ const x=mmX(p.x,w), y=mmZ(p.z,h); i?c.lineTo(x,y):c.moveTo(x,y); }); c.stroke();
    c.fillStyle='#9fe0ff'; for(let i=2;i<P.length;i++){ c.beginPath(); c.arc(mmX(P[i].x,w),mmZ(P[i].z,h),2*dpr,0,TAU); c.fill(); } }
  c.setLineDash([]);
  const tt=game.time;
  for(const k in FIGHT){ const f=FIGHT[k], age=tt-f.t; if(age>2.5){ if(age>20) delete FIGHT[k]; continue; } if(FOW.on&&!fowVisXZ(f.x,f.z)) continue;
    const ph=(tt*1.6)%1; c.strokeStyle='rgba(255,90,70,'+(.85*(1-ph)*(1-age/2.5)).toFixed(3)+')'; c.lineWidth=1.4*dpr; c.beginPath(); c.arc(mmX(f.x,w),mmZ(f.z,h),(3+ph*7)*dpr,0,TAU); c.stroke(); }
  for(const p of PINGS){ const age=tt-p.t; if(age>6||age<0) continue; const ph=(tt*1.2)%1; c.strokeStyle='rgba(127,224,255,'+(1-ph).toFixed(3)+')'; c.lineWidth=2*dpr; c.beginPath(); c.arc(mmX(p.x,w),mmZ(p.z,h),(4+ph*10)*dpr,0,TAU); c.stroke();
    c.fillStyle='#7fe0ff'; c.beginPath(); c.arc(mmX(p.x,w),mmZ(p.z,h),2.4*dpr,0,TAU); c.fill(); }
  c.restore();
}

/* ---------- the phone's radial menu: hold a finger on the field ---------- */
function radialOpen(x,y){
  const gp=groundPoint(x,y); if(!gp) return false; const box=$('#radial'); if(!box) return false;
  const Z=MAP.id!=='classic'&&RL.zones?RL.zones.find(z=>Math.hypot(z.x-gp.x,z.z-gp.z)<RL_ZR*1.2):null;
  const has=selRegs.length>0;
  const opts=[];
  if(has){ opts.push(['march','March here','➜'],['hold','Hold position','■'],['charge','Charge','⚔']); if(Z) opts.push(['cap','Capture '+Z.id,'⚑']); opts.push(['form','Formation','▦']); }
  else opts.push(['all','Select all','◎']);
  opts.push(['ping','Ping','◉']); if(has) opts.push(['clear','Let go','✕']);
  box.innerHTML=opts.map(([k,l,i],n)=>{ const a=-Math.PI/2+n/opts.length*TAU, R=74; return '<button data-k="'+k+'" style="left:'+(Math.cos(a)*R).toFixed(0)+'px;top:'+(Math.sin(a)*R).toFixed(0)+'px"><span>'+i+'</span><small>'+esc3(l)+'</small></button>'; }).join('')+'<i class="rc"></i>';
  box.style.left=clamp(x,100,innerWidth-100)+'px'; box.style.top=clamp(y,100,innerHeight-100)+'px'; box.hidden=false;
  for(const b of qsa(box,'button')) b.onclick=ev=>{ ev.stopPropagation(); radialDo(b.dataset.k,gp,Z); radialClose(); };
  if(navigator.vibrate) try{ navigator.vibrate(12); }catch(_){}
  return true;
}
function radialClose(){ const b=$('#radial'); if(b) b.hidden=true; }
function radialDo(k,gp,Z){
  if(k==='march'){ rtsMoveMany(selRegs,gp.x,gp.z); marker.at(gp.x,gp.z,'#ffd36b'); sfx('order'); }
  else if(k==='hold') rtsCmd('hold');
  else if(k==='charge') rtsCmd('charge');
  else if(k==='cap'&&Z){ rtsMoveMany(selRegs,Z.x,Z.z); marker.at(Z.x,Z.z,'#ffd36b'); sfx('order'); }
  else if(k==='form') rtsCmd('form');
  else if(k==='all') selectAllMine();
  else if(k==='ping') pingSend(gp.x,gp.z);
  else if(k==='clear') setSelection([]);
  updateRegbar();
}
canvas.addEventListener('pointerdown',e=>{
  radialClose(); if(e.pointerType==='mouse'||game.mode!=='battle'||game.paused) return;
  const id=e.pointerId, x=e.clientX, y=e.clientY;
  clearTimeout(HUD3.lpT); HUD3.lp={id,x,y,fired:false};
  HUD3.lpT=setTimeout(()=>{ const L=HUD3.lp; if(!L||L.id!==id||ptrs.size!==1) return; const p=ptrs.get(id); if(!p||Math.hypot(p.x-x,p.y-y)>10||p.box) return;
    if(radialOpen(x,y)){ L.fired=true; p.longPress=true; } },480);
});
canvas.addEventListener('pointermove',e=>{ const L=HUD3.lp; if(L&&L.id===e.pointerId&&Math.hypot(e.clientX-L.x,e.clientY-L.y)>10){ clearTimeout(HUD3.lpT); HUD3.lp=null; } });
canvas.addEventListener('pointerup',()=>{ clearTimeout(HUD3.lpT); });

/* ---------- accessibility: UI scale, larger text, colour-blind colours, calm mode ---------- */
const PAL={dot:['#ffd25e','#ff6b7d'],zone:['rgba(190,140,40,.92)','rgba(150,40,60,.9)'],ring:['#e4b23a','#d0465a'],chart:['#b88a1e','#e0566a'],bar:['#3bdc3b','#e8473f'],cb:false};
function applyAccess(){
  const cb=!!settings.cblind; PAL.cb=cb;
  PAL.dot=cb?['#5aa8ff','#ff9a3a']:['#ffd25e','#ff6b7d']; PAL.zone=cb?['rgba(50,120,220,.92)','rgba(220,120,20,.92)']:['rgba(190,140,40,.92)','rgba(150,40,60,.9)'];
  PAL.ring=cb?['#3d8de0','#e07a12']:['#e4b23a','#d0465a']; PAL.chart=cb?['#3d8de0','#cc6c0c']:['#b88a1e','#e0566a']; PAL.bar=cb?['#4aa3ff','#ff8c1a']:['#3bdc3b','#e8473f'];
  RL_TEAMC[0]=PAL.ring[0]; RL_TEAMC[1]=PAL.ring[1]; TEAM[0].bar.set(PAL.bar[0]); TEAM[1].bar.set(PAL.bar[1]);
  const root=document.documentElement.style; root.setProperty('--uiS',String(clamp(+settings.uiScale||1,.8,1.5)));
  setBodyClass('big-text',!!settings.bigText); setBodyClass('calm',!!settings.calm); setBodyClass('cblind',cb);
  if(typeof layoutTop==='function') setTimeout(layoutTop,0);
}
function accessUI(){
  const sc=$('#sUiScale'), so=$('#oUiScale'); if(sc){ sc.value=settings.uiScale||1; if(so) so.textContent=Math.round((settings.uiScale||1)*100)+'%';
    sc.oninput=()=>{ settings.uiScale=+sc.value; if(so) so.textContent=Math.round(settings.uiScale*100)+'%'; applyAccess(); saveSettings(); }; }
  for(const [id,key] of [['#sBigText','bigText'],['#sCblind','cblind'],['#sCalm','calm'],['#sHeroes','heroes'],['#sTheme','themeMusic']]){ const el=$(id); if(!el) continue;
    el.checked=key==='heroes'||key==='themeMusic'?settings[key]!==false:!!settings[key]; el.onchange=()=>{ settings[key]=el.checked; saveSettings(); applyAccess(); }; }
}

/* ---------- the end-of-battle report: two charts over time and the regiment of the battle ---------- */
function resultsReport(me){
  const box=$('#resCharts'); if(!box) return; const S=game.stats; box.innerHTML='';
  const ser=S&&S.series||[]; if(ser.length<2){ box.hidden=true; return; } box.hidden=false;
  // the regiment of the battle, and the damage each side dealt
  let mvp=null; for(const id in (S.regK||{})){ const e=S.regK[id]; if(e.team===me&&(!mvp||e.k>mvp.k)) mvp=e; }
  const extra=[]; if(S.dmg) extra.push('Damage dealt <b>'+Math.round(S.dmg[me]).toLocaleString()+'</b> · taken <b>'+Math.round(S.dmg[1-me]).toLocaleString()+'</b>');
  if(mvp) extra.push('Regiment of the battle: <b>'+(mvp.hero?heroDef(me).name:'Regiment '+ROMAN(mvp.num)+' ('+tPl(mvp.type,me)+')')+'</b> · '+mvp.k+' kills');
  if(HEROS.lv[me]>1) extra.push('Your '+heroDef(me).name+' reached level <b>'+HEROS.lv[me]+'</b>');
  box.innerHTML=(extra.length?'<p class="rc-x">'+extra.join('<br>')+'</p>':'')+
    '<div class="rc-legend"><span><i style="background:'+PAL.chart[me]+'"></i>'+esc3(teamName(me))+' (you)</span><span><i class="dash" style="border-color:'+PAL.chart[1-me]+'"></i>'+esc3(teamName(1-me))+'</span></div>'+
    '<figure><figcaption>Army strength (gold value of the soldiers on the field)</figcaption><canvas id="rcArmy" height="120"></canvas></figure>'+
    '<figure><figcaption>Enemies slain</figcaption><canvas id="rcKills" height="120"></canvas></figure><div class="rc-tip" id="rcTip" hidden></div>';
  const mk=(id,get,fmt)=>chartLine($('#'+id),ser,get,me,fmt);
  requestAnimationFrame(()=>{ mk('rcArmy',(s,t)=>s.p?s.p[t]:s.a[t],v=>v>=1000?(v/1000).toFixed(1)+'k':String(Math.round(v))); mk('rcKills',(s,t)=>s.k[t],v=>String(Math.round(v))); });
}
function chartLine(cv,ser,get,me,fmt){
  if(!cv||!cv.getContext) return; const dpr=Math.min(2,window.devicePixelRatio||1), W=cv.clientWidth||300, Hh=120; cv.width=W*dpr; cv.height=Hh*dpr; const c=cv.getContext('2d'); c.scale(dpr,dpr);
  const padL=34, padR=44, padT=8, padB=18, t0=ser[0].t, t1=ser[ser.length-1].t||1;
  let mx=1; for(const s of ser) for(let t=0;t<2;t++) mx=Math.max(mx,get(s,t)); mx*=1.1;
  const X=t=>padL+(t-t0)/Math.max(1,t1-t0)*(W-padL-padR), Y=v=>padT+(1-v/mx)*(Hh-padT-padB);
  const draw=(hover)=>{
    c.clearRect(0,0,W,Hh); c.strokeStyle='rgba(245,236,217,.12)'; c.lineWidth=1; c.fillStyle='rgba(245,236,217,.6)'; c.font='11px '+getComputedStyle(document.body).fontFamily; c.textAlign='right'; c.textBaseline='middle';
    for(let g=0;g<=2;g++){ const v=mx/1.1*g/2, y=Y(v); c.beginPath(); c.moveTo(padL,y); c.lineTo(W-padR,y); c.stroke(); c.fillText(fmt(v),padL-5,y); }
    c.textAlign='center'; c.textBaseline='top'; c.fillText(fmtTime(t0),padL,Hh-padB+4); c.fillText(fmtTime(t1),W-padR,Hh-padB+4);
    for(const t of [1-me,me]){ c.strokeStyle=PAL.chart[t]; c.lineWidth=2; c.lineJoin='round'; c.setLineDash(t===me?[]:[5,4]); c.beginPath(); ser.forEach((s,i)=>{ const x=X(s.t), y=Y(get(s,t)); i?c.lineTo(x,y):c.moveTo(x,y); }); c.stroke(); c.setLineDash([]);
      const L=ser[ser.length-1]; c.fillStyle='rgba(245,236,217,.85)'; c.textAlign='left'; c.textBaseline='middle'; c.fillText(fmt(get(L,t)),X(L.t)+5,Y(get(L,t))); }
    if(hover){ const s=hover, x=X(s.t); c.strokeStyle='rgba(245,236,217,.45)'; c.lineWidth=1; c.beginPath(); c.moveTo(x,padT); c.lineTo(x,Hh-padB); c.stroke();
      for(const t of [0,1]){ c.fillStyle=PAL.chart[t]; c.strokeStyle='#1e160e'; c.lineWidth=2; c.beginPath(); c.arc(x,Y(get(s,t)),4,0,TAU); c.fill(); c.stroke(); } } };
  draw(null);
  const tip=$('#rcTip');
  cv.onpointermove=e=>{ const r=cv.getBoundingClientRect(), px=e.clientX-r.left; let best=ser[0],bd=1e9; for(const s of ser){ const d=Math.abs(X(s.t)-px); if(d<bd){ bd=d; best=s; } } draw(best);
    if(tip){ tip.hidden=false; tip.innerHTML='<b>'+fmtTime(best.t)+'</b><span>'+esc3(teamName(me))+': '+fmt(get(best,me))+'</span><span>'+esc3(teamName(1-me))+': '+fmt(get(best,1-me))+'</span>';
      const pr=cv.parentElement.parentElement.getBoundingClientRect(); tip.style.left=(e.clientX-pr.left+12)+'px'; tip.style.top=(e.clientY-pr.top-10)+'px'; } };
  cv.onpointerleave=()=>{ draw(null); if(tip) tip.hidden=true; };
}

/* ---------- once a frame ---------- */
function hud3Tick(rdt){
  HUD3.t-=rdt; tipTick(rdt);
  if(HUD3.t>0) return; HUD3.t=.1;
  // a pause nobody can see (no pause screen, no campaign map, no paused replay) is a stale flag: lift it
  if(game.paused&&game.mode==='battle'&&!CW3.on){ const vis=s=>{ const e=$(s); return e&&!e.hidden; };
    if(!vis('#pause')&&!vis('#camp')&&!vis('#settings')&&!vis('#help')&&!vis('#tune')&&!vis('#menu')&&!(RPL.play&&RPL.play.paused)&&!vis('#results')){ HUD3.stale=(HUD3.stale||0)+1; if(HUD3.stale>=5){ game.paused=false; HUD3.stale=0; } } else HUD3.stale=0; }
  HUD3.lay=(HUD3.lay||0)+1; if(HUD3.lay%5===0&&hud3On()&&typeof layoutTop==='function') layoutTop();   // the dock grows and shrinks with the regiment bar
  abRender(); grpRender(); qRender(); const al=$('#alerts'); if(ALERTS.length||al&&!al.hidden) alertsRender();
  const pb=$('#pingB'); if(pb) pb.hidden=!hud3On();
}
setTimeout(hud3Late,0);
