/* ---------------- RTS controls ----------------
   PC: drag a box to select regiments (Shift adds), click one to select it, double-click to take every regiment of
   that kind on screen, right-click the ground to march (several regiments line up side by side), right-click an
   enemy to attack, right-drag to turn the camera, middle-drag / WASD / arrow keys / the screen edges to scroll.
   Keys: Ctrl+A all · Shift or Ctrl + 1–9 makes a group, 1–9 picks it (twice: look at it) · H hold · C charge ·
   X rejoin the army · Z capture a zone · Space looks at the selection · Esc lets go. Right-click the map to march there.
   Phone: tap to select and to order as before; Box turns the next drag into a selection box; All takes every regiment. */
const RTS={boxMode:false,groups:{},lastG:null,lastGT:0,mx:-1,my:-1,over:false,lastClick:{t:0,type:null}};
const rtsOn=()=>settings.rts!==false&&!game.tutorial;   // the training battle keeps the plain drag-to-look controls it teaches
// the soldier drawn nearest a screen point (an enemy you can't see doesn't count)
function unitAt(x,y,maxPx){
  let best=null, bd=(maxPx||46)**2;
  for(const u of units){ if(!u.alive||u.fowH) continue; _proj.copy(u.j.chest).project(camera); if(_proj.z>1) continue;
    const sx=(_proj.x*.5+.5)*innerWidth, sy=(-_proj.y*.5+.5)*innerHeight, d=(sx-x)**2+(sy-y)**2; if(d<bd){ bd=d; best=u; } }
  return best?{u:best,d:Math.sqrt(bd)}:null;
}
const myRegs=()=>regs.filter(r=>r.team===myTeam()&&regAlive(r).length);
function onScreen(u){ _proj.copy(u.j.chest).project(camera); return _proj.z<1&&Math.abs(_proj.x)<1&&Math.abs(_proj.y)<1; }
function centerOn(list){ let x=0,z=0,n=0; for(const r of list) for(const u of regAlive(r)){ x+=u.pos.x; z+=u.pos.z; n++; } if(!n) return;
  if(cam.follow){ cam.follow=null; updateFollowUI(); } cam.goal.set(x/n,0,z/n); clampGoal(); }
// left click (PC) / tap (phone)
function rtsClick(x,y,shift){
  if(game.mode!=='battle'||game.paused) return;
  const me=myTeam(), hit=unitAt(x,y), u=hit&&hit.u, now=performance.now();
  if(u&&u.team===me&&u.reg){
    const dbl=RTS.lastClick.type===u.reg.type&&now-RTS.lastClick.t<350; RTS.lastClick={t:now,type:u.reg.type};
    if(dbl){ setSelection(myRegs().filter(r=>r.type===u.reg.type&&regAlive(r).some(onScreen))); sfx('ui'); return; }
    if(shift) setSelection(selRegs.includes(u.reg)?selRegs.filter(r=>r!==u.reg):selRegs.concat([u.reg]));
    else setSelection([u.reg]);
    sfx('ui'); return; }
  // a building (and nobody standing right where you clicked): open it, or show what the enemy's is
  if(!hit||hit.d>20){ const bb=pickBuilding(x,y); if(bb){ if(bb.team===me) openPanel(bb); else { setHover(bb,x,y); setTimeout(()=>{ if(hoverB===bb) setHover(null); },1800); } return; } }
  if(selRegs.length&&!shift){ setSelection([]); return; }
  cam.follow=u||null; if(u) cam.dGoal=Math.min(cam.dGoal,u.s>1.5?14:9); updateFollowUI();
}
// right click (PC) / tap with a selection (phone): march, attack or storm the statue
function rtsOrderAt(x,y){
  if(game.mode!=='battle'||game.paused||!selRegs.length) return false;
  const me=myTeam(), foe=1-me, hit=unitAt(x,y,40), u=hit&&hit.u;
  if(u&&u.team===foe){ for(const r of selRegs) issue('reg',{r:r.id,k:'attack',tr:u.reg?u.reg.id:0,tu:u.id}); sfx('order'); updateRegbar(); return true; }
  const gp=groundPoint(x,y); if(!gp) return false;
  if(Math.hypot(gp.x-BASE_X[foe],gp.z)<5){ for(const r of selRegs) issue('reg',{r:r.id,k:'charge'}); marker.at(BASE_X[foe]-DIRX[foe]*3,0,'#ff5a4f'); sfx('order'); updateRegbar(); return true; }
  rtsMoveMany(selRegs,gp.x,gp.z); marker.at(gp.x,gp.z,'#ffd36b'); sfx('order'); updateRegbar(); return true;   // one marker, where you clicked
}
// several regiments marching to one point stand side by side across the way they are going, in the order they
// already stand, instead of all piling onto the same spot
function rtsMoveMany(list,gx,gz){
  const L=list.filter(r=>regAlive(r).length); if(!L.length) return;
  const mv=(r,x,z)=>issue('reg',{r:r.id,k:'move',x:+x.toFixed(2),z:+z.toFixed(2)});
  if(L.length===1){ mv(L[0],gx,gz); return; }
  let cx=0,cz=0; const C=L.map(r=>regCenter(r)); for(const c of C){ cx+=c.x; cz+=c.z; } cx/=L.length; cz/=L.length;
  let fx=gx-cx, fz=gz-cz; const l=Math.hypot(fx,fz); if(l<1){ fx=myTeam()?-1:1; fz=0; } else { fx/=l; fz/=l; }
  const px=fz, pz=-fx, W=r=>{ const F=FORM[r.type]||{cols:5,gap:1.4}; return (Math.min(regAlive(r).length,F.cols)-1)*F.gap+2.6; };
  const idx=L.map((r,i)=>i).sort((a,b)=>(C[a].x*px+C[a].z*pz)-(C[b].x*px+C[b].z*pz));
  // up to ~60 m a line; more than that forms a second line behind
  const lines=[[]]; let w=0; for(const i of idx){ const ww=W(L[i]); if(w+ww>60&&lines[lines.length-1].length){ lines.push([]); w=0; } lines[lines.length-1].push(i); w+=ww; }
  lines.forEach((ln,k)=>{ const tot=ln.reduce((a,i)=>a+W(L[i]),0); let s=-tot/2;
    for(const i of ln){ const ww=W(L[i]), m=s+ww/2; s+=ww; mv(L[i],gx+px*m-fx*k*6,gz+pz*m-fz*k*6); } });
}
// the regiment bar's buttons and the hotkeys act on the whole selection
function rtsCmd(k){
  if(!selRegs.length) return;
  if(k==='capture'){ const Z=rlCaptureTarget(selReg); if(!Z) return; sfx('order'); rtsMoveMany(selRegs,Z.x,Z.z); marker.at(Z.x,Z.z,'#ffd36b'); updateRegbar(); return; }
  if(k==='form'){ const f=FORMS[(FORMS.indexOf(selReg.form||'line')+1)%FORMS.length]; for(const r of selRegs) issue('reg',{r:r.id,k:'form',f}); sfx('order'); updateRegbar(); toast('Formation: '+FORM_NAME[f]); return; }
  for(const r of selRegs) issue('reg',{r:r.id,k}); sfx(k==='charge'?'horn':'order'); updateRegbar();
}
// the selection box
function rtsBoxDraw(p){ const b=$('#selBox'); if(!b) return; const x0=Math.min(p.sx,p.x), y0=Math.min(p.sy,p.y);
  b.hidden=false; b.style.left=x0+'px'; b.style.top=y0+'px'; b.style.width=Math.abs(p.x-p.sx)+'px'; b.style.height=Math.abs(p.y-p.sy)+'px'; }
function rtsBoxEnd(p,shift){
  const b=$('#selBox'); if(b) b.hidden=true;
  const x0=Math.min(p.sx,p.x), x1=Math.max(p.sx,p.x), y0=Math.min(p.sy,p.y), y1=Math.max(p.sy,p.y), got=[];
  for(const r of myRegs()){ for(const u of regAlive(r)){ _proj.copy(u.j.chest).project(camera); if(_proj.z>1) continue;
      const sx=(_proj.x*.5+.5)*innerWidth, sy=(-_proj.y*.5+.5)*innerHeight; if(sx>=x0&&sx<=x1&&sy>=y0&&sy<=y1){ got.push(r); break; } } }
  if(shift) setSelection(selRegs.concat(got)); else setSelection(got);
  if(got.length) sfx('ui');
  if(RTS.boxMode){ RTS.boxMode=false; rtsToolsSync(); }
}
function selectAllMine(){ setSelection(myRegs()); if(selRegs.length) sfx('ui'); }
// phone buttons: Box and All (the PC also gets All)
function rtsToolsSync(){ for(const id of ['#oBox','#rgBox']){ const b=$(id); if(b) b.setAttribute('aria-pressed',RTS.boxMode); } }
for(const id of ['#oBox','#rgBox']){ const b=$(id); if(b) b.onclick=()=>{ sfx('ui'); RTS.boxMode=!RTS.boxMode; rtsToolsSync(); if(RTS.boxMode) toast('Drag across your soldiers to select them'); }; }
for(const id of ['#oAll','#rgAll']){ const b=$(id); if(b) b.onclick=()=>selectAllMine(); }
window.addEventListener('keydown',e=>{
  if(CW3.on||game.mode!=='battle'||game.paused||(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT'))) return;
  const k=(e.key||'').toLowerCase(), code=e.code||'', dig=/^Digit[1-9]$/.test(code)?code.slice(5):(/^[1-9]$/.test(e.key)?e.key:null);
  if(k==='escape'&&selRegs.length){ setSelection([]); return; }
  if((e.ctrlKey||e.metaKey)&&k==='a'){ e.preventDefault(); selectAllMine(); return; }
  if(dig){ if(e.ctrlKey||e.metaKey||e.shiftKey){ e.preventDefault(); if(selRegs.length){ RTS.groups[dig]=selRegs.map(r=>r.id); toast('Group '+dig+': '+selRegs.length+' regiment'+(selRegs.length>1?'s':'')); } return; }
    const L=(RTS.groups[dig]||[]).map(id=>regs.find(r=>r.id===id)).filter(r=>r&&regAlive(r).length); if(!L.length) return;
    const now=performance.now(); setSelection(L); if(RTS.lastG===dig&&now-RTS.lastGT<420) centerOn(L); RTS.lastG=dig; RTS.lastGT=now; return; }
  if(!selRegs.length) return;
  if(k==='v') rtsCmd('form'); else if(k==='h') rtsCmd('hold'); else if(k==='c') rtsCmd('charge'); else if(k==='x') rtsCmd('army'); else if(k==='z'&&MAP.id!=='classic') rtsCmd('capture');
  else if(k===' '){ e.preventDefault(); centerOn(selRegs); }
});
// the screen edges scroll the camera (mouse over the battlefield only)
canvas.addEventListener('pointermove',e=>{ if(e.pointerType==='mouse'){ RTS.mx=e.clientX; RTS.my=e.clientY; RTS.over=true; } });
canvas.addEventListener('pointerleave',()=>{ RTS.over=false; });
window.addEventListener('blur',()=>{ RTS.over=false; });
function rtsFrame(rdt){
  if(!rtsOn()||!RTS.over||game.mode!=='battle'||game.paused||uiMode()!=='pc'||ptrs.size) return;
  const m=14, W=innerWidth, Hh=innerHeight, v=760*rdt; let dx=0, dy=0;
  if(RTS.mx<m) dx=v; else if(RTS.mx>W-m) dx=-v; if(RTS.my<m) dy=v; else if(RTS.my>Hh-m) dy=-v;
  if(dx||dy) pan(dx,dy);
}
