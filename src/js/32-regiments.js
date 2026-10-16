/* ================= PHASE 3: regiments, tactics, campaign ================= */

/* ---------- regiments ---------- */
const regs=[]; const regNum=[0,0]; let selReg=null, chaosReg=0;
const REG_SIZE={sword:12,spear:12,archer:10,giant:3};
const FORM={spear:{cols:6,gap:1.3,depth:1.35},sword:{cols:6,gap:1.3,depth:1.35},archer:{cols:5,gap:1.35,depth:1.4},giant:{cols:3,gap:3.1,depth:3.1}};
const ROMAN=n=>{const r=[[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];let s='';for(const [v,c] of r) while(n>=v){s+=c;n-=v;} return s;};
const TYPE_PL={sword:'Swordsmen',spear:'Spartans',archer:'Archers',giant:'Giants'};
function assignRegiment(u){
  if(!REG_SIZE[u.type]||game.mode!=='battle') return;
  let r=regs.find(r=>r.team===u.team&&r.type===u.type&&r.units.filter(x=>x.alive).length<REG_SIZE[u.type]);
  if(!r){ r={id:u.T.chaos?-(++chaosReg):++uid,team:u.team,type:u.type,units:[],num:++regNum[u.team],order:{kind:'army'}}; regs.push(r); makeBanner(r); }   // Chaos packs number apart, so they never shift the army's ids
  r.units.push(u); u.reg=r;
}
function regAlive(r){ return r.units.filter(x=>x.alive); }
function regCenter(r){ const a=regAlive(r); const c=new V3(); if(!a.length) return c; for(const u of a) c.add(u.pos); return c.multiplyScalar(1/a.length); }
const GEO_POLE=new THREE.CylinderGeometry(.016,.016,1.5,5), GEO_FLAG=new THREE.PlaneGeometry(.52,.36,4,1);
function makeBanner(r){
  const g=new THREE.Group(); gearRoots.add(g); const pole=mesh(GEO_POLE,M.wood,0,.75,0);
  let mat=new THREE.MeshLambertMaterial({color:r.team?'#7d2a8a':'#e2ae35',side:THREE.DoubleSide});
  const c=document.createElement('canvas'), ctx=c.getContext&&c.getContext('2d');
  if(ctx){ c.width=96; c.height=64; ctx.fillStyle=r.team?'#5a1c66':'#c9971f'; ctx.fillRect(0,0,96,64);
    ctx.fillStyle=r.team?'#e8473f':'#8f1016'; ctx.fillRect(0,0,96,8); ctx.fillRect(0,56,96,8);
    ctx.fillStyle='#fff6e0'; ctx.font='bold 34px Georgia, serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(ROMAN(r.num),48,34);
    mat=new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}); }
  const flag=new THREE.Mesh(GEO_FLAG,mat); flag.position.set(-.27,1.3,0); flag.castShadow=true;
  g.add(pole,flag); r.banner=g; r.flag=flag;
}
function updateBanners(){
  for(const r of regs){ if(!r.banner) continue; const b=regAlive(r)[0];
    if(!b||b.fl){ r.banner.visible=false; continue; } r.banner.visible=true;   // wing archers carry their wings, not a banner
    const s=b.s, pos=_tmp.copy(b.j.chest).addScaledVector(b.fwdW,-.2*s).addScaledVector(b.spine,-.15*s);
    orient(r.banner,pos,b.spine,b.rightW); r.banner.scale.setScalar(s*(b.type==='giant'?.8:1));
    r.flag.rotation.y=Math.sin(game.time*4+r.id)*.18; }
}
function cleanRegs(){
  for(let i=regs.length-1;i>=0;i--){ const r=regs[i]; r.units=r.units.filter(u=>u.alive);
    if(!r.units.length){ if(r.banner) dropRoot(r.banner); if(selReg===r) selectReg(null); regs.splice(i,1); continue; }
    const o=r.order;
    if(o.kind==='attack'&&!(o.target&&regAlive(o.target).length)&&!(o.unit&&o.unit.alive)){ const c=regCenter(r); r.order={kind:'hold',x:c.x,z:c.z,a:r.team?-Math.PI/2:Math.PI/2}; }
    if(o.kind==='move'){ const a=regAlive(r); if(a.every(u=>{const s=regSlot(r,u); return Math.hypot(s.x-u.pos.x,s.z-u.pos.z)<1.3;})) o.kind='hold'; }
  }
}
function regSlot(r,u){
  const a=regAlive(r).sort((p,q)=>p.id-q.id), i=Math.max(0,a.indexOf(u)), n=a.length, o=r.order;
  const F=FORM[r.type], cols=Math.min(n,F.cols), gap=F.gap, row=Math.floor(i/cols), col=i%cols, inRow=Math.min(cols,n-row*cols);
  const fx=Math.sin(o.a), fz=Math.cos(o.a), rx=fz, rz=-fx;
  return {x:o.x+rx*(col-(inRow-1)/2)*gap-fx*row*F.depth, z:o.z+rz*(col-(inRow-1)/2)*gap-fz*row*F.depth};
}
// unit-level behaviour for an ordered regiment; returns true when it handled the unit
function regBrain(u,o){
  if(o.kind==='attack'){
    let t=null,bd=1e9; const pool=o.target?regAlive(o.target):(o.unit&&o.unit.alive?[o.unit]:[]);
    for(const e of pool){ if(e.state==='stunned'||!canTarget(u,e)) continue; const d=Math.hypot(e.pos.x-u.pos.x,e.pos.z-u.pos.z); if(d<bd){bd=d;t=e;} }
    if(!t) return false; u.target=t; const dx=t.pos.x-u.pos.x,dz=t.pos.z-u.pos.z; fightBrain(u,t,dx,dz,Math.hypot(dx,dz)||1e-3); return true;
  }
  const sl=regSlot(u.reg,u), moving=o.kind==='move';
  const ranged=u.T.ranged, guard=ranged?u.T.range:(moving?2.5:7), leash=ranged?3:(moving?4:10);
  u.rfT=(u.rfT||0)-1/60; if(u.rfT<=0||u.rFoe&&!u.rFoe.alive){ u.rfT=.25+Math.random()*.1; u.rFoe=nearestFoe(u.pos.x,u.pos.z,u.team,Math.max(guard,u.T.range)+.5,u); }
  const foe=u.rFoe&&u.rFoe.alive&&u.rFoe.state!=='stunned'?u.rFoe:null, fd=foe?Math.hypot(foe.pos.x-u.pos.x,foe.pos.z-u.pos.z):1e9;
  const fromSlot=Math.hypot(u.pos.x-sl.x,u.pos.z-sl.z);
  if(foe&&!ranged&&fd<guard&&fromSlot<leash){ u.target=foe; const dx=foe.pos.x-u.pos.x,dz=foe.pos.z-u.pos.z; fightBrain(u,foe,dx,dz,fd||1e-3); return true; }
  if(foe&&ranged&&fromSlot<1.6&&fd<u.T.range){ u.target=foe; u.faceGoal=Math.atan2(foe.pos.x-u.pos.x,foe.pos.z-u.pos.z);
    if(fd<4.5){ u.desired.set(-(foe.pos.x-u.pos.x)/fd*u.T.speed*.7,0,-(foe.pos.z-u.pos.z)/fd*u.T.speed*.7); }
    if(!u.action&&u.cdT<=0&&Math.abs(wrapA(u.faceGoal-u.face))<.4) startAttack(u,foe); return true; }
  const dx=sl.x-u.pos.x,dz=sl.z-u.pos.z,d=Math.hypot(dx,dz);
  if(d>.35){ const sp=u.T.speed*clamp(d/1.6,.25,1)*(d>5?1:.85); u.desired.set(dx/d*sp,0,dz/d*sp); u.faceGoal=d>1.2?Math.atan2(dx,dz):o.a; }
  else u.faceGoal=o.a;
  return true;
}
// quiet: an order given on another screen (online) moves the soldiers without flashing a marker on this one
function orderMove(r,p,quiet){
  const c=regCenter(r); let a=Math.atan2(p.x-c.x,p.z-c.z); if(Math.hypot(p.x-c.x,p.z-c.z)<2.5) a=r.team?-Math.PI/2:Math.PI/2;
  r.order={kind:'move',x:clamp(p.x,-40,40),z:clamp(p.z,-14,14),a}; if(!quiet) marker.at(r.order.x,r.order.z,'#ffd36b');
}
function orderAttack(r,tr,unit,quiet){ r.order={kind:'attack',target:tr||null,unit:tr?null:unit}; const c=tr?regCenter(tr):unit.pos; if(!quiet) marker.at(c.x,c.z,'#ff5a4f'); }
function orderHold(r,quiet){ const c=regCenter(r); r.order={kind:'hold',x:c.x,z:c.z,a:r.team?-Math.PI/2:Math.PI/2}; if(!quiet) marker.at(c.x,c.z,'#ffd36b'); }
// selection visuals
const ringIM=new THREE.InstancedMesh((()=>{const g=new THREE.RingGeometry(.42,.54,28); g.rotateX(-Math.PI/2); return g;})(),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.85,depthWrite:false}),160);
for(let i=0;i<160;i++) ringIM.setColorAt(i,WHITE);   // before count=0: three sizes the colour buffer from .count
ringIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); ringIM.frustumCulled=false; ringIM.count=0; ringIM.renderOrder=3; scene.add(ringIM);
const RING_SEL=new THREE.Color('#ffd36b'), RING_TGT=new THREE.Color('#ff5a4f');
const marker=(()=>{ const m=new THREE.Mesh((()=>{const g=new THREE.RingGeometry(.7,.95,36); g.rotateX(-Math.PI/2); return g;})(),new THREE.MeshBasicMaterial({color:'#ffd36b',transparent:true,depthWrite:false}));
  m.visible=false; m.renderOrder=3; scene.add(m); return {m,t:0,at(x,z,c){ m.position.set(x,H(x,z)+.05,z); m.material.color.set(c); m.visible=true; this.t=0; }}; })();
function drawSelection(dt){
  let n=0;
  const ring=(u,col,k)=>{ if(n>=160) return; _p.set(u.pos.x,u.pos.y+.04,u.pos.z); _s.set(u.s*k,1,u.s*k); _m.compose(_p,_qi,_s); ringIM.setMatrixAt(n,_m); ringIM.setColorAt(n,col); n++; };
  if(selReg){ for(const u of regAlive(selReg)) ring(u,RING_SEL,1);
    const o=selReg.order; if(o.kind==='attack'){ for(const u of (o.target?regAlive(o.target):(o.unit&&o.unit.alive?[o.unit]:[]))) ring(u,RING_TGT,1.1); } }
  ringIM.count=n; ringIM.instanceMatrix.needsUpdate=true; if(ringIM.instanceColor) ringIM.instanceColor.needsUpdate=true;
  if(marker.m.visible){ marker.t+=dt; const k=1+.25*Math.sin(marker.t*6); marker.m.scale.set(k,1,k); marker.m.material.opacity=Math.max(0,1-marker.t/2.2); if(marker.t>2.2) marker.m.visible=false; }
}
function selectReg(r){
  selReg=r; const on=!!r&&game.mode==='battle';
  $('#regbar').hidden=!on; $('#orders').hidden=on||game.mode!=='battle'; $('#actBattle').hidden=on||game.mode!=='battle';
  if(on) updateRegbar();
  $('#hint').textContent=on?'Tap the ground to move · tap an enemy to attack':(game.mode==='battle'?'Drag to move the camera · tap your soldiers to command their regiment':'Pick a unit · drag to orbit · pinch to zoom');
  $('#hint').style.opacity=1;
}
function updateRegbar(){
  if(!selReg) return; const n=regAlive(selReg).length, o=selReg.order.kind;
  const ST={army:'following army orders',move:'marching',hold:'holding',attack:'attacking',charge:'charging'};
  $('#rgTitle').textContent='Regiment '+ROMAN(selReg.num); $('#rgSub').textContent=n+' '+TYPE_PL[selReg.type]+' · '+ST[o];
}

/* ---------- tactics: flanks, rear, charge, high ground, brace ---------- */
function tacticMods(att,tgt,melee){
  const dx=att.pos.x-tgt.pos.x, dz=att.pos.z-tgt.pos.z, d=Math.hypot(dx,dz)||1, f=(dx*tgt.fwdW.x+dz*tgt.fwdW.z)/d;
  const r={mul:1,kb:1,mor:0,txt:null,col:'#ffd36b'};
  if(f<-.45){ r.mul*=1.6; r.mor+=10; r.txt='Rear attack'; r.col='#ff7a5c'; }
  else if(f<.3){ r.mul*=1.25; r.mor+=4; r.txt='Flanked'; }
  const dh=att.pos.y-tgt.pos.y; if(dh>.45){ r.mul*=1.2; r.txt=r.txt||'High ground'; } else if(dh<-.45) r.mul*=.85;
  if(melee&&att.charging){
    if(tgt.type==='spear'&&tgt.spd<.5&&f>.3&&tgt.state!=='stunned'){ r.mul*=.55; r.kb*=.5; r.txt='Braced!'; r.col='#9fd8ff'; react(att,new V3(dx/d,0,dz/d),2.6); att.morale-=6; }
    else { r.mul*=1.35; r.kb*=1.6; r.mor+=6; r.txt='Charge!'; r.col='#ffb347'; }
    att.charging=false;
  }
  return r;
}
const callouts=[]; let calloutT=0;
function callout(u,text,col){
  if(calloutT>0||!text||game.mode!=='battle') return; calloutT=.22;
  let c=callouts.find(c=>c.age>=1);
  if(!c){ if(callouts.length>=10) return; const el=document.createElement('div'); el.className='callout'; ($('#callouts')||document.body).appendChild(el); c={el,age:1,p:new V3()}; callouts.push(c); }
  c.el.textContent=text; c.el.style.color=col; c.p.copy(u.j.head).addScaledVector(UP,.5*u.s); c.age=0;
}
function updateCallouts(dt){
  calloutT-=dt;
  for(const c of callouts){ if(c.age>=1){ if(c.el.style) c.el.style.opacity=0; continue; } c.age+=dt*1.1; c.p.y+=dt*.8;
    _proj.copy(c.p).project(camera); const vis=_proj.z<1;
    if(c.el.style){ c.el.style.opacity=vis?String(Math.min(1,(1-c.age)*2.2)):'0'; c.el.style.transform='translate('+((_proj.x*.5+.5)*innerWidth)+'px,'+((-_proj.y*.5+.5)*innerHeight)+'px) translate(-50%,-50%)'; } }
}

/* ---------- terrain presets (each campaign territory has its own ground) ---------- */
const TPRESET={
  skirmish:{wave:1,m:[[0,5,6.5,1.9],[-13,-5,5,1.3],[14,4.5,5,1.4],[-22,6,4,.9],[23,-6,4.5,1.0]]},
  sparta:{wave:1,m:[[-6,6,6,1.8],[8,-6,6,1.6],[-16,-6,5,1.2],[16,7,5,1.3]]},
  olive:{wave:.5,m:[[0,-9,7,1.0],[0,10,6,.8]]},
  bronze:{wave:.6,m:[[0,-11,7,2.6],[0,11,7,2.6],[-11,-12,6,2.0],[11,12,6,2.0]]},
  flats:{wave:.15,m:[]},
  ford:{wave:.7,m:[[-12,0,6,2.2],[12,0,6,2.2]]},
  dunes:{wave:1.2,m:[[-8,-6,4,1.3],[6,5,4,1.4],[-3,8,3.5,1.1],[10,-8,4,1.2],[-15,4,4,1],[17,-2,4,1.1]]},
  ash:{wave:.6,m:[[0,0,8.5,3.0]]},
  keep:{wave:.8,m:[[19,0,7,2.6],[8,-8,5,1.2]]},
};
let terrName='skirmish';
function setTerrain(name){ if(terrName===name) return; terrName=name; const p=TPRESET[name]; TERR.wave=p.wave; TERR.m=p.m; buildTerrain(); }

