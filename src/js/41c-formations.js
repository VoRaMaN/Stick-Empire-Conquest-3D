/* ================= The formation editor (v0.33): how your army lines up, saved per army =================
   Where each kind of soldier stands when the army forms its battle line: four rows from the front rank to the rear,
   several kinds side by side in a row, how close the ranks stand (tight, normal, loose) and how wide each block is.
   Built-in formations (the Classic Line, Shield Wall, Ranged Screen, Hammer and Anvil, Deep Column, Wide Line)
   and your own, saved and named per faction (settings.formations). The chosen one is used every time your army
   forms up (assignSlots, 31-army) and can be changed in battle from the pause screen: the army re-forms at once.
   Rows 0-3: 0 the front rank (toward the enemy). */
const FORM_BUILTIN=[
  {id:'classic',name:'Classic Line',desc:'Every kind in its own line, spears first (the standard order)'},
  {id:'shield',name:'Shield Wall',desc:'Spears and heavies in front, blades behind, the bows covered, cavalry in reserve',roles:{pike:0,heavy:0,inf:1,fast:1,rng:2,cast:2,cav:3,sup:3,air:3}},
  {id:'screen',name:'Ranged Screen',desc:'Archers and casters out front to thin the enemy before the lines meet',roles:{rng:0,cast:1,pike:1,inf:1,fast:2,heavy:2,cav:3,sup:3,air:3}},
  {id:'hammer',name:'Hammer and Anvil',desc:'Heavies and cavalry lead the charge, the foot follow',roles:{heavy:0,cav:0,pike:1,inf:1,fast:1,rng:2,cast:2,sup:3,air:3}},
  {id:'column',name:'Deep Column',desc:'Narrow, deep blocks packed tight: hard to break, quick to the gap',colsK:.65,gapK:.86,roles:{inf:0,pike:0,heavy:1,fast:1,cav:1,rng:2,cast:2,sup:3,air:3}},
  {id:'wide',name:'Wide Line',desc:'A long, loose front that overlaps the enemy and is safe from splash',colsK:1.5,gapK:1.18,roles:{pike:0,inf:0,heavy:0,fast:0,cav:1,rng:1,cast:1,sup:2,air:2}},
];
const FORM_ROLE_ROW={pike:0,inf:0,heavy:1,fast:1,cav:2,rng:2,cast:2,sup:3,air:3};
function formRowOf(type){ const r=FORM_ROLE_ROW[aiRole(type)]; return r===undefined?1:r; }
function formStore(fac){ const A=settings.formations||(settings.formations={}); return A[fac]||(A[fac]={active:'classic',custom:[]}); }
// the formation an army uses (null: the classic line)
function formPreset(team){
  if(game.classicMix||team!==myTeam()) return null;   // the computer general keeps the classic line
  const S=settings.formations&&settings.formations[facOf(team)]; if(!S) return null; return formResolve(S.active);
}
function formResolve(id){
  if(!id||id==='classic') return null;
  if(id.startsWith('c:')){ const fac=id.split(':')[1], S=settings.formations&&settings.formations[fac], P=S&&S.custom.find(c=>'c:'+fac+':'+c.name===id); return P?{rows:P.rows,gapK:P.gapK||1,colsK:P.colsK||1}:null; }
  const B=FORM_BUILTIN.find(b=>b.id===id); if(!B||!B.roles) return null;
  const rows={}; for(const t of FORM_ORDER){ const r=B.roles[aiRole(t)]; rows[t]=r===undefined?formRowOf(t):r; } return {rows,gapK:B.gapK||1,colsK:B.colsK||1};
}
const FMV={fac:null,el:null};
const fmName=(t,fac,pl)=>fac==='wild'&&WILD_DEF[t]?WILD_DEF[t][pl?'pl':'name']:pl?(TYPE_PL[t]||TYPES[t].name+'s'):TYPES[t].name;
function formOpen(){
  FMV.fac=FMV.fac||(game.mode==='battle'?facOf(myTeam()):settings.side||'order');
  let P=document.getElementById('forms');
  if(!P){ if(!(document.body&&document.body.appendChild)) return; P=document.createElement('div'); P.id='forms'; P.className='overlay forms-ov'; document.body.appendChild(P); }
  P.hidden=false; FMV.el=P; formRender();
}
function formClose(){ const P=document.getElementById('forms'); if(P) P.hidden=true; if(game.mode==='battle'&&!game.classicMix) assignSlots(myTeam()); }
function formRender(){
  const P=FMV.el; if(!P) return; const fac=FMV.fac, S=formStore(fac), roster=(FACTIONS[fac].roster||[]).filter(t=>TYPES[t]&&!TYPES[t].worker&&FORM[t]);
  const act=S.active||'classic', cur=formResolve(act), isC=act.startsWith('c:');
  const opts=FORM_BUILTIN.map(b=>'<option value="'+b.id+'"'+(b.id===act?' selected':'')+'>'+esc3(b.name)+'</option>').concat(S.custom.map(c=>{ const id='c:'+fac+':'+c.name; return '<option value="'+esc3(id)+'"'+(id===act?' selected':'')+'>★ '+esc3(c.name)+'</option>'; })).join('');
  const B=FORM_BUILTIN.find(b=>b.id===act), rowsOf=t=>cur?cur.rows[t]:null;
  const ROWN=['Front','Second','Third','Rear'];
  P.innerHTML='<div class="card forms-card" role="dialog" aria-modal="true" aria-labelledby="fmH"><h2 id="fmH" class="card-h">Formations</h2>'+
    '<div class="pills" role="tablist">'+['order','chaos','wild'].map(f=>'<button role="tab" data-ff="'+f+'" aria-selected="'+(f===fac)+'">'+esc3(FACTIONS[f].name)+'</button>').join('')+'</div>'+
    '<div class="fm-row"><label for="fmSel">Formation</label><select id="fmSel">'+opts+'</select></div>'+
    '<p class="card-sub">'+esc3(B?B.desc:isC?'Your own formation':'')+'</p>'+
    '<canvas id="fmPrev" class="fm-prev" height="170" aria-label="Preview: the front rank at the top"></canvas>'+
    '<div class="fm-types">'+roster.map(t=>{ const r=rowsOf(t); return '<div class="fm-t"><b>'+esc3(fmName(t,fac,1))+'</b><span class="pills sm">'+ROWN.map((n,i)=>'<button data-t="'+t+'" data-r="'+i+'" aria-pressed="'+(cur?r===i:i===Math.min(3,FORM_ORDER.indexOf(t)%4))+'"'+(cur?'':' disabled')+'>'+n+'</button>').join('')+'</span></div>'; }).join('')+'</div>'+
    (cur?'':'<p class="note">The Classic Line puts every kind in its own line. Choose another formation, or press <b>Customise</b> to make your own.</p>')+
    '<div class="fm-row"><span>Ranks</span><span class="pills sm">'+[['Tight',.86],['Normal',1],['Loose',1.2]].map(([n,v])=>'<button data-g="'+v+'" aria-pressed="'+(cur&&Math.abs((cur.gapK||1)-v)<.05)+'"'+(cur?'':' disabled')+'>'+n+'</button>').join('')+'</span></div>'+
    '<div class="fm-row"><span>Blocks</span><span class="pills sm">'+[['Narrow',.65],['Normal',1],['Wide',1.5]].map(([n,v])=>'<button data-c="'+v+'" aria-pressed="'+(cur&&Math.abs((cur.colsK||1)-v)<.05)+'"'+(cur?'':' disabled')+'>'+n+'</button>').join('')+'</span></div>'+
    '<div class="stack fm-act"><button id="fmCustom" class="mm small">'+(isC?'Save a copy':'Customise')+'</button>'+(isC?'<button id="fmRename" class="mm small">Rename</button><button id="fmDel" class="mm small">Delete</button>':'')+
    '<button id="fmDone" class="mm primary"><span>'+(game.mode==='battle'?'Re-form the army':'Done')+'</span></button></div></div>';
  for(const b of qsa(P,'button[data-ff]')) b.onclick=()=>{ sfx('ui'); FMV.fac=b.dataset.ff; formRender(); };
  const sel=P.querySelector&&P.querySelector('#fmSel'); if(sel) sel.onchange=()=>{ sfx('ui'); S.active=sel.value; saveSettings(); formRender(); };
  // editing: a built-in becomes your own copy first
  const own=()=>{ if(S.active.startsWith('c:')) return S.custom.find(c=>'c:'+fac+':'+c.name===S.active);
    const base=formResolve(S.active)||formResolve('shield'); let n=1; while(S.custom.some(c=>c.name==='My formation '+n)) n++;
    const C={name:'My formation '+n,rows:Object.assign({},base.rows),gapK:base.gapK,colsK:base.colsK}; S.custom.push(C); S.active='c:'+fac+':'+C.name; return C; };
  for(const b of qsa(P,'button[data-t]')) b.onclick=()=>{ if(b.disabled) return; sfx('ui'); const C=own(); C.rows[b.dataset.t]=+b.dataset.r; saveSettings(); formRender(); };
  for(const b of qsa(P,'button[data-g]')) b.onclick=()=>{ if(b.disabled) return; sfx('ui'); const C=own(); C.gapK=+b.dataset.g; saveSettings(); formRender(); };
  for(const b of qsa(P,'button[data-c]')) b.onclick=()=>{ if(b.disabled) return; sfx('ui'); const C=own(); C.colsK=+b.dataset.c; saveSettings(); formRender(); };
  const q=id=>P.querySelector&&P.querySelector(id);
  const cu=q('#fmCustom'); if(cu) cu.onclick=()=>{ sfx('ui'); if(S.active.startsWith('c:')){ const C=own(); let n=2; while(S.custom.some(c=>c.name===C.name+' ('+n+')')) n++; const D={name:C.name+' ('+n+')',rows:Object.assign({},C.rows),gapK:C.gapK,colsK:C.colsK}; S.custom.push(D); S.active='c:'+fac+':'+D.name; } else own(); saveSettings(); formRender(); };
  const rn=q('#fmRename'); if(rn) rn.onclick=()=>{ const C=own(); const nm=typeof prompt==='function'?prompt('Name this formation',C.name):null; if(!nm) return; const clean=String(nm).replace(/[<>:]/g,'').trim().slice(0,28); if(!clean||S.custom.some(c=>c!==C&&c.name===clean)) return; C.name=clean; S.active='c:'+fac+':'+clean; saveSettings(); formRender(); };
  const dl=q('#fmDel'); if(dl) dl.onclick=()=>{ sfx('ui'); const C=own(); S.custom=S.custom.filter(c=>c!==C); S.active='classic'; saveSettings(); formRender(); };
  const dn=q('#fmDone'); if(dn) dn.onclick=()=>{ sfx('order'); formClose(); };
  formPreview(q('#fmPrev'),fac,cur,roster);
}
// the preview: the army as it would form up, seen from above, front rank at the top
function formPreview(cv,fac,cur,roster){
  if(!cv||!cv.getContext) return; const dpr=Math.min(2,window.devicePixelRatio||1), W=cv.clientWidth||320, Hh=170; cv.width=W*dpr; cv.height=Hh*dpr; const c=cv.getContext('2d'); c.scale(dpr,dpr);
  c.fillStyle='#3c4a2c'; c.fillRect(0,0,W,Hh); c.fillStyle='rgba(255,255,255,.08)'; c.fillRect(0,0,W,14); c.fillStyle='rgba(245,236,217,.75)'; c.font='10px '+getComputedStyle(document.body).fontFamily; c.textAlign='center'; c.fillText('▲ the enemy',W/2,10);
  const groups=[]; if(cur){ const R=[[],[],[],[]]; for(const t of FORM_ORDER) if(roster.includes(t)) R[clamp(cur.rows[t]===undefined?formRowOf(t):cur.rows[t],0,3)].push(t); for(const g of R) if(g.length) groups.push(g); }
  else for(const t of FORM_ORDER) if(roster.includes(t)) groups.push([t]);
  const N=t=>Math.min(REG_SIZE[t]||6,8), lines=[]; let y=0;
  for(const g of groups){ let L=null; for(const t of g){ const F0=FORM[t], gk=cur?cur.gapK:1, ck=cur?cur.colsK:1, cols=Math.min(N(t),Math.max(1,Math.round(F0.cols*(cur?ck:1)))), rows=Math.ceil(N(t)/cols), w=(cols-1)*F0.gap*gk, d=rows*F0.depth*gk;
      if(!L||L.w+w+1.6>30){ L={b:[],w:-1.6,d:0}; lines.push(L); } L.b.push({t,cols,rows,gap:F0.gap*gk,dep:F0.depth*gk,w}); L.w+=w+1.6; L.d=Math.max(L.d,d); } }
  let tot=0; for(const L of lines) tot+=L.d+1.3; const sc=Math.min((W-20)/32,(Hh-24)/Math.max(8,tot));
  const ROLEC={pike:'#e2ae35',inf:'#d8d0c0',heavy:'#c0603a',fast:'#9a7ad8',cav:'#d85a5a',rng:'#6ac06a',cast:'#5aa8e0',sup:'#f0f0a0',air:'#a0d8ff'};
  y=18; for(const L of lines){ let x=W/2-L.w*sc/2;
    for(const B of L.b){ const col=ROLEC[aiRole(B.t)]||'#ddd'; c.fillStyle=col;
      for(let i=0;i<N(B.t);i++){ const r=Math.floor(i/B.cols), k=i%B.cols; c.beginPath(); c.arc(x+k*B.gap*sc,y+r*B.dep*sc+3,Math.max(1.6,Math.min(3.2,.35*sc)),0,TAU); c.fill(); }
      c.fillStyle='rgba(245,236,217,.85)'; c.textAlign='center'; c.fillText(fmName(B.t,fac).split(' ').pop(),x+B.w*sc/2,y+B.rows*B.dep*sc+10);
      x+=(B.w+1.6)*sc; }
    y+=(L.d+1.3)*sc+8; }
}
