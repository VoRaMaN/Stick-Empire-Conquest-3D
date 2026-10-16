/* ================= Chaos Empire, second wave: gear, bombs, void bolts, dark healing, hellfire, shadow steps, brains =================
   Bone Reaver: a skeleton with two curved bone blades and a bone crest · Infernal Bomber: goggled imp with a barrel
   of bombs on its back; lobs them, and blows up when it dies · Fallen Oracle: blindfolded seer with a third eye and a
   staff topped with a floating eye; heals the Chaos army, hexes the enemy · Grim Reaper: a skeleton in a black hooded
   robe with a great scythe; every cut drinks life, and it steps through shadow behind its prey · Hades: the lord of
   the underworld, plated in bronze, crowned in fire, with a burning bident; a fire aura scorches whoever stands near. */
CHAOS.push(...CHAOS2);
const CGX2={};
const ORACLE_ROBE=['#2b1631','#3a0d1e'], REAPER_ROBE='#0d0b0e';
function cgx2Init(){
  if(CGX2.ok) return; CGX2.ok=true; cgxInit();
  const cmp=(p,e,sc)=>new THREE.Matrix4().compose(p,new THREE.Quaternion().setFromEuler(e||new THREE.Euler()),sc||new V3(1,1,1));
  // Bone Reaver: a curved bone blade, a wrapped grip, a crest of bone spikes
  CGX2.blade=(()=>{ const s=new THREE.Shape(); s.moveTo(-.022,.06); s.lineTo(-.03,.4); s.quadraticCurveTo(-.025,.6,.075,.68); s.quadraticCurveTo(.06,.5,.045,.3); s.lineTo(.03,.06); s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:.018,bevelEnabled:false}); g.translate(0,0,-.009); return g; })();
  CGX2.grip=new THREE.CylinderGeometry(.02,.022,.16,6); CGX2.knob=new THREE.SphereGeometry(.03,8,6); CGX2.gem=new THREE.OctahedronGeometry(.028,0);
  CGX2.crest=mergeGeo([0,1,2,3].map(i=>[new THREE.ConeGeometry(.026,.13-i*.015,5),cmp(new V3(0,.2-i*.015,.06-i*.075),new THREE.Euler(-.35-i*.2,0,0))]));
  CGX2.loin=new THREE.BoxGeometry(.13,.26,.012);
  // Infernal Bomber: bomb with a fuse, barrel of bombs, cap and goggles
  CGX2.bomb=new THREE.SphereGeometry(.105,12,9); CGX2.fuse=new THREE.CylinderGeometry(.012,.012,.07,5); CGX2.spark=new THREE.SphereGeometry(.022,6,5);
  CGX2.barrel=new THREE.CylinderGeometry(.13,.13,.3,12); CGX2.band=(()=>{ const g=new THREE.TorusGeometry(.133,.012,4,16); g.rotateX(Math.PI/2); return g; })();
  CGX2.miniBomb=new THREE.SphereGeometry(.07,10,8);
  CGX2.cap=new THREE.SphereGeometry(.215,14,10,0,Math.PI*2,0,Math.PI*.55);
  CGX2.lens=(()=>{ const g=new THREE.CylinderGeometry(.05,.05,.04,12); g.rotateX(Math.PI/2); return g; })();
  CGX2.strap=(()=>{ const g=new THREE.TorusGeometry(.2,.014,4,20); g.rotateX(Math.PI/2); return g; })();
  CGX2.impHorn=new THREE.ConeGeometry(.03,.13,6);
  // Fallen Oracle: staff with a floating eye in a ring, blindfold, third eye, shard crown
  CGX2.oStaff=new THREE.CylinderGeometry(.02,.026,1.6,7);
  CGX2.oRing=new THREE.TorusGeometry(.11,.012,5,18); CGX2.eye=new THREE.SphereGeometry(.07,14,10); CGX2.iris=new THREE.SphereGeometry(.032,10,8);
  CGX2.blind=(()=>{ const g=new THREE.TorusGeometry(.198,.026,4,22); g.rotateX(Math.PI/2); return g; })();
  CGX2.shard=new THREE.OctahedronGeometry(.04,0);
  // Grim Reaper and Hades
  CGX2.bHaft=new THREE.CylinderGeometry(.04,.045,2.5,8); CGX2.prong=new THREE.ConeGeometry(.04,.36,6); CGX2.fork=new THREE.BoxGeometry(.32,.05,.05);
  CGX2.crownRing=(()=>{ const g=new THREE.TorusGeometry(.2,.03,5,20); g.rotateX(Math.PI/2); return g; })();
  CGX2.flame=new THREE.ConeGeometry(.035,.16,5);
  CGX2.hHorn=[-1,1].map(sd=>mergeGeo(crHorn(new V3(sd*.17,.1,0),new V3(sd,.5,.15),new V3(0,0,sd),sd*1.4,.5,.055,7)));
}
function buildChaosGear2(u,G,L,LD,E,acc,black){
  cgx2Init(); const team=u.team, s=u.s;
  switch(u.type){
    case 'boner':{
      const bone=L('#e6dabd'), dark=LD('#2a1c14'), gem=E('#ff3a2a','#c0200a');
      const mk=()=>{ const w=grp(); w.add(mesh(CGX2.blade,bone),mesh(CGX2.grip,dark,0,-.02,0),mesh(CGX2.knob,bone,0,-.11,0),mesh(CGX2.gem,gem,0,.07,0)); return w; };
      G.w=mk(); const w2=mk(); w2.scale.setScalar(s); freezeGear(w2); G.w2=w2;
      const h=grp(); const cr=mesh(CGX.cranium,bone,0,.01,0); cr.scale.set(.92,1.02,1.04); h.add(cr,mesh(CGX.jaw,bone,0,-.16,.07),mesh(CGX.teeth,L('#efe6cc')),mesh(CGX2.crest,bone));
      for(const sd of [-1,1]){ const e=mesh(CGX.eyeHole,black,sd*.075,0,.168); e.scale.set(1.15,1,.6); h.add(e); }
      h.scale.setScalar(.86); G.h=h;
      const r=grp(); r.add(mesh(CGX.bones,bone),mesh(CGX2.loin,acc,0,-.1,.075),mesh(CGX2.loin,acc,0,-.1,-.075)); G.r=r;
      break; }
    case 'bomber':{
      const iron=L('#1c1a1e'), wood=LD('#5a3a20'), leather=LD('#3a2416');
      const w=grp(); w.add(mesh(CGX2.bomb,iron,0,.1,0),mesh(CGX2.fuse,LD('#8a7a5a'),0,.22,0),mesh(CGX2.spark,E('#ffb347','#ff7a1a'),0,.26,0)); G.w=w;
      const h=grp(); h.add(mesh(CGX2.cap,leather,0,.02,-.01),mesh(CGX2.strap,leather,0,.03,0));
      for(const sd of [-1,1]){ h.add(mesh(CGX2.lens,E('#ffb040','#c86010'),sd*.075,.04,.19)); const hn=mesh(CGX2.impHorn,LD('#2a1a14'),sd*.12,.2,-.02); hn.rotation.z=-sd*.5; h.add(hn); }
      G.h=h;
      const r=grp(); r.add(mesh(CGX2.barrel,wood,0,.42,-.26),mesh(CGX2.band,iron,0,.32,-.26),mesh(CGX2.band,iron,0,.52,-.26),mesh(CGX2.miniBomb,iron,-.05,.63,-.26),mesh(CGX2.miniBomb,iron,.06,.62,-.24),
        mesh(CGX.belt,leather,0,.06,0));
      for(const a of [-.6,0,.6]) r.add(mesh(CGX2.miniBomb,iron,Math.sin(a)*.17,.02,Math.cos(a)*.17));
      G.r=r; break; }
    case 'oracle':{
      const robe=st=>lamOf(ORACLE_ROBE[team],{side:THREE.DoubleSide}), trim=acc, wood=LD('#2a1e26');
      const w=grp(); w.add(mesh(CGX2.oStaff,wood,0,.1,0),mesh(CGX2.oRing,LD('#5a5060'),0,.95,0),mesh(CGX2.eye,L('#efe9dc'),0,.95,0),mesh(CGX2.iris,E('#5dffc8','#1aa880'),0,.95,.05));
      for(const sd of [-1,1]){ const p=mesh(GX.prong,LD('#5a5060'),sd*.08,.86,0); p.rotation.z=-sd*.5; w.add(p); } G.w=w;
      const h=grp(); h.add(mesh(GX.hood,robe(),0,.02,-.015),mesh(GX.hoodRim,trim,0,.02,-.015),mesh(CGX2.blind,L('#d8cfc0'),0,.0,0),mesh(CGX2.iris,E('#5dffc8','#1aa880'),0,.1,.19));
      for(let i=0;i<5;i++){ const a=(i-2)*.45, sh=mesh(CGX2.shard,E('#5dffc8','#0f6a50'),Math.sin(a)*.2,.3+Math.cos(a*1.3)*.04,Math.cos(a)*.06-.04); sh.scale.set(.7,1.6,.7); h.add(sh); }
      G.h=h;
      const r=grp(); r.add(mesh(GX.robeTop,robe(),0,.285,0),mesh(GX.collar,trim,0,.57,0)); G.r=r;
      const k=grp(); k.add(mesh(GX.skirt,robe()),mesh(GX.hem,trim,0,-.85,0)); k.scale.setScalar(s); freezeGear(k); G.k=k;
      break; }
    case 'reaper':{
      const robe=lamOf(REAPER_ROBE,{side:THREE.DoubleSide}), bone=L('#cdbf9f'), iron=L('#3a3a42');
      const w=grp(); const hf=mesh(CGX.sHaft,LD('#141012'),0,.36,0); hf.scale.set(1.2,1.2,1.2); const bl=mesh(CGX.sBlade,iron); bl.scale.set(1.25,1.22,1.4); bl.position.y=-.1;
      w.add(hf,bl,mesh(CGX.skull,bone,0,1.35,0)); G.w=w;
      const h=grp(); const hd=mesh(GX.hood,robe,0,.03,-.02); hd.scale.setScalar(1.18); const cr=mesh(CGX.cranium,bone,0,-.01,.02); cr.scale.set(.72,.8,.8); h.add(hd,cr); G.h=h;
      const r=grp(); const rt=mesh(GX.robeTop,robe,0,.285,0); rt.scale.set(1.15,1,1.15); r.add(rt,mesh(GX.collar,LD('#2a2226'),0,.57,0)); G.r=r;
      const k=grp(); const sk=mesh(GX.skirt,robe); sk.scale.set(1.08,1.05,1.08); k.add(sk); k.scale.setScalar(s); freezeGear(k); G.k=k;
      makeCape(u,'r'); break; }
    case 'hades':{
      const bronze=L('#4a2a1a'), dark=L('#1a1012'), fire=E('#ff8a2a','#ff4a0a'), bone=L('#d9cbb0');
      const w=grp(); w.add(mesh(CGX2.bHaft,dark,0,.3,0),mesh(CGX2.fork,bronze,0,1.55,0));
      for(const sd of [-1,1]) w.add(mesh(CGX2.prong,fire,sd*.13,1.75,0)); w.add(mesh(CGX2.prong,fire,0,1.7,0)); G.w=w;
      const h=grp(); h.add(mesh(CGX2.crownRing,bronze,0,.16,0),mesh(CGX2.hHorn[0],bone),mesh(CGX2.hHorn[1],bone));
      for(let i=0;i<7;i++){ const a=i/7*Math.PI*2, f=mesh(CGX2.flame,fire,Math.sin(a)*.2,.26,Math.cos(a)*.2); f.rotation.x=Math.cos(a)*.25; f.rotation.z=-Math.sin(a)*.25; h.add(f); }
      G.h=h;
      const r=grp(); r.add(mesh(CGX.plate,bronze,0,.3,0),mesh(CGX.backPlate,bronze,0,.3,0),mesh(CGX.belt,dark,0,.06,0),mesh(CGX.skull,bone,0,.07,.17),mesh(CGX.dSteel,lamOf('#2a1a14',{side:THREE.DoubleSide})),mesh(CGX.dMolten,fire)); G.r=r;
      for(const [k,sd] of [['pl',-1],['pr',1]]){ const g=grp(); const p=mesh(CGX.pauldron,bronze); p.scale.set(1.2,.85,1.25); g.add(p);
        for(let i=0;i<3;i++){ const sp=mesh(CGX.pSpike,fire,sd*.065,.095,-.08+i*.08); sp.rotation.z=-sd*.55; g.add(sp); } G[k]=g; }
      makeCape(u,'d'); break; }
  }
}
function updateChaosGear2(u){
  const G=u.G, j=u.j; if(!G) return;
  if(G.w2) orient(G.w2,j.hL,u.wLw,u.rightW);
  if(G.k){ const d=u.skD||(u.skD=new V3(0,1,0));
    if(u.alive){ _ch2.set(0,1,0).addScaledVector(u.spine,.45).addScaledVector(u.av,-.05).normalize(); d.lerp(_ch2,.15).normalize(); } else d.copy(u.spine);
    orient(G.k,j.pelvis,d,_gfl); }
  if(u.type==='bomber'&&G.w) G.w.visible=!(u.bombT>0);
}

/* ---------- bombs ---------- */
const bombs=[];
function throwBomb(u,e){
  const t=u.atkTarget, n=e.n||1; u.bombT=.45;
  const o=u.j.hR.clone().addScaledVector(u.wRw,.1*u.s);
  for(let i=0;i<n;i++){
    let P=t&&t.isUnit&&t.alive?t.pos.clone():t&&t.isStatue?new V3(t.pos.x,t.pos.y,t.pos.z):o.clone().addScaledVector(u.fwdW,6);
    if(n>1){ const off=(i-(n-1)/2)*(e.spread||.2)*Math.max(2,P.distanceTo(o)); P.addScaledVector(u.rightW,off); }
    if(t&&t.isUnit&&t.alive) P.addScaledVector(t.vel||UP,.35);
    P.y=H(P.x,P.z)+(e.roll?.1:.2);
    const dx=P.x-o.x, dz=P.z-o.z, d=Math.hypot(dx,dz)||.01, g=14;
    if(e.roll){ bombs.push({p:o.clone().setY(H(o.x,o.z)+.12),v:new V3(dx/d*8.5,0,dz/d*8.5),team:u.team,src:u,dmg:u.T.dmg*(e.dmg||1),r:1.7,age:0,roll:true,max:d/8.5+.4}); continue; }
    const T=clamp(d/(e.lob?7.5:10),.4,1.3), vy=(P.y-o.y+.5*g*T*T)/T;
    bombs.push({p:o.clone(),v:new V3(dx/T,vy,dz/T),team:u.team,src:u,dmg:u.T.dmg*(e.dmg||1),r:1.9,age:0,max:T+.3});
  }
  crSfx('bombThrow','swing',o,.6);
}
function boomFx(p,k){
  flashes.push({p:p.clone(),r0:.3*k,r1:1.6*k,t:0,life:.35,col:'#ffb347'});
  puffDir(p,UP,Math.round(10*k),2.6,1.6,'#ff8a2a',.35*k,.6); puffDir(p,UP,Math.round(8*k),1.6,1.2,'#3a2a22',.5*k,1.3);
  const c=p.clone(); c.y=H(c.x,c.z); ring(c,1.8*k); shakeAt(p,.3*k); crSfx('bombBlast','blast',p,.9);
}
function explode(p,r,dmg,team,src){
  boomFx(p,r/1.9);
  for(const o of units){ if(!o.alive||o.team===team||isAir(o)) continue; const d=Math.hypot(o.pos.x-p.x,o.pos.z-p.z); if(d>r+o.s*.3) continue;
    const dir=new V3(o.pos.x-p.x,0,o.pos.z-p.z); if(dir.lengthSq()<1e-6) dir.set(1,0,0); dir.normalize();
    damage(o,dmg*(1-.5*d/(r+.3)),src&&src.alive?src:null,dir,3.4,1.4); applyBurn(o,src,5,3); }
  const st=statues[1-team]; if(st&&Math.hypot(st.pos.x-p.x,st.pos.z-p.z)<r+2.2) hitStatue(st,dmg*.6);
}
function updateBombs(dt){
  for(let i=bombs.length-1;i>=0;i--){ const B=bombs[i]; B.age+=dt;
    if(B.roll){ B.p.addScaledVector(B.v,dt); B.p.y=H(B.p.x,B.p.z)+.12; B.v.multiplyScalar(Math.exp(-dt*.6)); }
    else { B.v.y-=14*dt; B.p.addScaledVector(B.v,dt); }
    if(Math.random()<dt*30) puff(B.p,1,.05,.3,'#ffb347');
    let hit=B.age>B.max||(!B.roll&&B.p.y<=H(B.p.x,B.p.z)+.1);
    if(!hit) for(const o of units){ if(!o.alive||o.team===B.team) continue; if(o.j.chest.distanceTo(B.p)<.5*o.s||(B.roll&&Math.hypot(o.pos.x-B.p.x,o.pos.z-B.p.z)<.6)){ hit=true; break; } }
    if(hit){ explode(B.p,B.r,B.dmg,B.team,B.src); bombs.splice(i,1); } }
}

/* ---------- the Oracle: void bolts, dark mending ---------- */
function oracleTip(u,out){ return out.copy(u.j.hR).addScaledVector(u.wRw,.95*u.s); }
function castVoid(u,e){
  const t=u.atkTarget; const P=aimPoint(t,new V3()); if(!P) return;
  const o=oracleTip(u,new V3()), rend=!!e.rend;
  souls.push({p:o,v:new V3().subVectors(P,o).normalize().multiplyScalar(e.big?13:17),t,team:u.team,src:u,dmg:u.T.dmg*(e.dmg||1),rend,big:!!e.big,age:0,col:'#7dffd6',col2:'#0d4a3c'});
  flashes.push({p:o.clone(),r0:.05,r1:.35,t:0,life:.25,col:'#5dffc8'}); crSfx('soulCast','orbWhoosh',o,.6); u.soulGlow=Math.max(u.soulGlow||0,.6);
}
function hurtAllies(u,r){ const L=[]; for(const o of units) if(o.alive&&o.team===u.team&&o.isUnit&&o.hp<o.maxHp*.8&&Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z)<r) L.push(o); return L; }
function darkMend(u){
  let best=null,bk=.95; for(const o of units) if(o.alive&&o.team===u.team&&o.isUnit&&Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z)<8){ const k=o.hp/o.maxHp; if(k<bk){ bk=k; best=o; } }
  const t=best||u; healUnit(u,t,u.T.heal); if(t!==u) beams.push({u,t,life:.55,age:0,col:'#5dffc8'});
  puffDir(t.j.chest,UP,8,1.2,.7,'#5dffc8',.12,1); crSfx('heal','heal',t.pos,.8);
}
function massMend(u){
  for(const o of units) if(o.alive&&o.team===u.team&&o.isUnit&&Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z)<5){ healUnit(o,o,u.T.heal*.7); puffDir(o.j.chest,UP,4,1,.5,'#5dffc8',.1,.8); }
  const c=u.pos.clone(); c.y=H(c.x,c.z); ring(c,5); flashes.push({p:u.j.chest.clone(),r0:.3,r1:2.4,t:0,life:.45,col:'#5dffc8'}); crSfx('massheal','heal',u.pos,1);
}

/* ---------- Hades: hellfire, flame wave, the burning aura ---------- */
function hellfire(u,e){
  const c=u.pos.clone().addScaledVector(u.fwdW,(e.at||1.1)*u.s); c.y=H(c.x,c.z); const r=e.r||3;
  ring(c,r); for(let i=0;i<14;i++){ const a=i/14*Math.PI*2, p=c.clone(); p.x+=Math.cos(a)*r*.7; p.z+=Math.sin(a)*r*.7; p.y+=.2; puffDir(p,UP,2,2.2,.5,i%2?'#ff7a1a':'#ffb347',.3,.7); }
  flashes.push({p:c.clone().setY(c.y+.5),r0:.4,r1:r,t:0,life:.4,col:'#ff8a2a'});
  for(const o of units){ if(!o.alive||o.team===u.team||isAir(o)) continue; if(Math.hypot(o.pos.x-c.x,o.pos.z-c.z)<r) applyBurn(o,u,7,3.5); }
}
function flameWave(u){
  const o=u.j.hR.clone().addScaledVector(u.wRw,1.7*u.s), f=u.fwdW, len=8;
  for(let i=1;i<=10;i++){ const p=o.clone().addScaledVector(f,i*len/10); p.y=H(p.x,p.z)+.5; puffDir(p,f,3,2,.5+i*.06,i%2?'#ff7a1a':'#ffb347',.3+i*.03,.6); }
  flashes.push({p:o.clone(),r0:.3,r1:1.2,t:0,life:.3,col:'#ff8a2a'}); shakeAt(o,.2); crSfx('flameWave','blast',o,.8);
  for(const t of units){ if(!t.alive||t.team===u.team||isAir(t)) continue; const dx=t.pos.x-u.pos.x, dz=t.pos.z-u.pos.z, d=Math.hypot(dx,dz)||1;
    if(d<len+1&&(dx*f.x+dz*f.z)/d>.82){ damage(t,u.T.dmg*.8,u,new V3(dx/d,0,dz/d),2.6,.8); applyBurn(t,u,8,4); } }
}
function hadesFire(u,e,fin){ const rg=fin&&(fin.rag||fin.rag2); const p=rg?rg.p[1]:u.j.hL; puffDir(p,UP,6,1.6,.6,'#ff7a1a',.22,.7); puffDir(p,UP,3,1,.4,'#ffd060',.15,.5); crSfx('ignite','ignite',p,.5); }

/* ---------- the Grim Reaper steps through shadow ---------- */
function shadowStep(u,x,z){
  puffDir(u.j.chest,UP,12,1,.9,'#140f18',.32,.9);
  const dx=x-u.pos.x, dz=z-u.pos.z; u.pos.x=x; u.pos.z=z; u.pos.y=H(x,z); if(u.vel) u.vel.set(0,0,0);
  for(const ft of u.feet){ ft.pos.x+=dx; ft.pos.z+=dz; ft.pos.y=H(ft.pos.x,ft.pos.z); if(ft.to){ ft.to.x+=dx; ft.to.z+=dz; } }
  for(const k in u.j){ const v=u.j[k]; v.x+=dx; v.z+=dz; }
  puffDir(u.pos.clone().setY(u.pos.y+1.2*u.s),UP,12,1,.9,'#140f18',.32,.9); crSfx('ghost','whoosh',u.pos,.7);
}
TYPES.reaper.brain=(u,dt)=>{
  if(u.routing||!u.target||!u.target.alive||!u.target.isUnit||u.action||u.cdT>0||u.state!=='ok'||game.mode!=='battle'||u.fin) return false;
  const t=u.target, dx=t.pos.x-u.pos.x, dz=t.pos.z-u.pos.z, d=Math.hypot(dx,dz);
  if(d>3.6&&d<10&&(u.cdStep||0)<game.time&&!isAir(t)&&canTarget(u,t)){
    u.cdStep=game.time+rand(8,12); const f=t.fwdW, x=t.pos.x-f.x*1.6, z=t.pos.z-f.z*1.6; shadowStep(u,x,z);
    u.face=u.faceGoal=Math.atan2(t.pos.x-x,t.pos.z-z); startAttack(u,t,'grShadowCut'); return true; }
  return false;
};

/* ---------- events and effects ---------- */
Object.assign(EXTRA_EV,{
  bomb:throwBomb, voidBolt:castVoid, darkMend:(u)=>darkMend(u), massMend:(u)=>massMend(u), hellfire:(u,e)=>hellfire(u,e), flameWave:(u)=>flameWave(u), hadesFire,
  fuse:(u)=>{ const p=u.j.hR.clone().addScaledVector(u.wRw,.26*u.s); puff(p,3,.05,1.2,'#ffb347'); crSfx('ignite','ignite',p,.4); },
  ragBoom:(u,e,fin,v)=>{ const rg=fin&&(fin.rag2||fin.rag)||(v&&v.rag); const p=rg?rg.p[1].clone():u.j.hR.clone().addScaledVector(u.fwdW,1);
    boomFx(p,1.1); if(rg){ for(const q of rg.v) q.add(new V3(rand(-3,3),rand(5,9),rand(-3,3))); wakeRag(rg); } for(const o of units){ if(!o.alive||o.team===u.team||o===v) continue; if(o.pos.distanceTo(p)<2) damage(o,u.T.dmg*.6,u,null,3); } },
});
Object.assign(FX_X,{boom:(u,e,v,P)=>boomFx(P,1.1)});

/* ---------- brains ---------- */
TYPES.boner.pick=(u,t)=>{
  if(t&&t.isUnit&&enemiesNear(u.team,u.pos.x,u.pos.z,2.2)>=3&&(u.cdSpin||0)<game.time){ u.cdSpin=game.time+4; return 'brSpin'; }
  let n,g=0; do{ n=pickOf(['brXSlash','brTwinThrust','brFlurry','brFlurry','brLeap','brRising','brBackhand','brKick']); }while(n===u.lastAtk&&++g<5); return n;
};
TYPES.bomber.pick=(u,t)=>{
  const d=t?Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z):99, now=game.time;
  if(t&&t.isUnit&&d<u.T.meleeR+(t.s-1)*.4&&!isAir(t)) return pickOf(['bmBash','bmKick','bmBackflip']);
  if(!t||!t.isUnit) return 'bmLob';
  if(enemiesNear(u.team,t.pos.x,t.pos.z,2.6)>=3&&(u.cdCluster||0)<now){ u.cdCluster=now+8; return 'bmCluster'; }
  if(d<5) return pickOf(['bmRoll','bmQuick','bmQuick']);
  return pickOf(['bmLob','bmLob','bmQuick','bmDouble']);
};
TYPES.oracle.pick=(u,t)=>{
  const d=t?Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z):99, now=game.time;
  if(t&&t.isUnit&&d<u.T.meleeR+(t.s-1)*.4&&!isAir(t)) return pickOf(['orStaffBonk','orPalmPush']);
  const hurt=hurtAllies(u,8);
  if(hurt.length>=3&&(u.cdMass||0)<now){ u.cdMass=now+12; return 'orMassMend'; }
  if(hurt.length&&(u.cdMend||0)<now){ u.cdMend=now+3.5; return 'orMend'; }
  if(!t||!t.isUnit) return 'orVoidBolt';
  if(!(t.st&&t.st.rend)&&(u.cdHex||0)<now){ u.cdHex=now+6; return 'orHex'; }
  return pickOf(['orVoidBolt','orVoidBolt','orTriBolt','orEyeBeam']);
};
TYPES.reaper.pick=(u,t)=>{
  if(t&&t.isUnit&&enemiesNear(u.team,u.pos.x,u.pos.z,2.6)>=3&&(u.cdSpin||0)<game.time){ u.cdSpin=game.time+4.5; return pickOf(['grWhirl','grWideReap']); }
  let n,g=0; do{ n=pickOf(['grWideReap','grDeathArc','grBackReap','grHookPull','grRising','grTwinReap','grTwinReap']); }while(n===u.lastAtk&&++g<5); return n;
};
TYPES.hades.pick=(u,t)=>{
  const d=t?Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z):9, now=game.time;
  if(t&&t.isUnit&&enemiesNear(u.team,u.pos.x,u.pos.z,3.4)>=3&&(u.cdSlam||0)<now){ u.cdSlam=now+5; return pickOf(['hdSlam','hdSpin','hdStomp']); }
  if(t&&t.isUnit&&d>3&&d<8&&(u.cdWave||0)<now){ u.cdWave=now+9; return 'hdFlameWave'; }
  let n,g=0; do{ n=pickOf(['hdSweep','hdThrust','hdUpthrust','hdDoubleSweep','hdSweep']); }while(n===u.lastAtk&&++g<5); return n;
};
Object.assign(LIGHT,{bomber:1,oracle:1});
Object.assign(PREY,{oracle:3,bomber:2.4});

/* ---------- per-frame: bombs, the burning aura, a Bomber that dies goes off ---------- */
function updateChaos2(dt){
  updateBombs(dt);
  for(const u of units){ if(u.bombT>0) u.bombT-=dt;
    if(u.type==='hades'&&u.alive&&game.mode==='battle'){ u.auraT=(u.auraT||0)-dt; if(u.auraT<=0){ u.auraT=.5;
      for(const o of units){ if(!o.alive||o.team===u.team||isAir(o)) continue; if(Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z)<2.8) applyBurn(o,u,3,1.2); } } } }
  for(const c of corpses) if(c.type==='bomber'&&!c._boom&&!c.statue){ c._boom=true; explode(c.j.chest.clone(),2.0,c.T.dmg*1.1,c.team,c); }
}
const _dc2=new V3();
function drawChaos2(){
  for(const B of bombs){ glowAt(B.p,.11,'#ff9a3a'); }
  const ct=cam.target, tt=game.time;
  for(const u of units){
    if(!u.alive||!CHAOS2.includes(u.type)) continue;
    if(Math.abs(u.pos.x-ct.x)>48||Math.abs(u.pos.z-ct.z)>34) continue;
    const s=u.s, j=u.j, fw=u.fwdW, rw=u.rightW, sp=_dc2.subVectors(j.head,j.neck).normalize();
    if(u.type==='boner'){ for(const sd of [-1,1]){ _ch1.copy(j.head).addScaledVector(fw,.13*s).addScaledVector(rw,sd*.065*s); glowAt(_ch1,.02*s,'#ff3a2a'); } }
    else if(u.type==='bomber'){ if(!(u.bombT>0)){ _ch1.copy(j.hR).addScaledVector(u.wRw,.26*s); glowAt(_ch1,(.03+.015*Math.sin(tt*30+u.id))*s,'#ffb347'); } }
    else if(u.type==='oracle'){ oracleTip(u,_ch1); const pul=.5+.5*Math.sin(tt*3+u.id); glowAt(_ch1,(.08+.03*pul+.1*(u.soulGlow||0))*s,'#5dffc8');
      _ch1.copy(j.head).addScaledVector(fw,.17*s).addScaledVector(sp,.08*s); glowAt(_ch1,.03*s,'#7dffd6'); }
    else if(u.type==='reaper'){ for(const sd of [-1,1]){ _ch1.copy(j.head).addScaledVector(fw,.14*s).addScaledVector(rw,sd*.06*s).addScaledVector(sp,-.01*s); glowAt(_ch1,.024*s,'#ff2a1a'); } }
    else if(u.type==='hades'){ for(const sd of [-1,1]){ _ch1.copy(j.head).addScaledVector(fw,.18*s).addScaledVector(rw,sd*.07*s); glowAt(_ch1,.026*s,'#ffcf4a'); }
      _ch1.copy(j.head).addScaledVector(sp,.25*s); glowAt(_ch1,(.16+.03*Math.sin(tt*9+u.id))*s,'#ff7a1a');
      if(u.G&&u.G.w&&!u.G.w.dropped){ _ch1.copy(j.hR).addScaledVector(u.wRw,1.75*s); glowAt(_ch1,(.12+.03*Math.sin(tt*14))*s,'#ff8a2a'); if(Math.random()<.25) puff(_ch1,1,.06*s,.8,'#ff9a3a'); }
      if(Math.random()<.2){ _ch1.copy(u.pos); _ch1.x+=rand(-1.4,1.4); _ch1.z+=rand(-1.4,1.4); _ch1.y=H(_ch1.x,_ch1.z)+.1; puff(_ch1,1,.12,.9,Math.random()<.5?'#ff7a1a':'#3a2a22'); } }
  }
}
