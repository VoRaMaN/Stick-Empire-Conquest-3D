/* ================= Chaos Empire systems: gear, soul fragments, Soul Rend, Infernal Regeneration, brains =================
   Thrall: hood, mattock, shackle and chain, a sack of soul crystals when it carries · Dreadguard: horned helm,
   plate with molten cracks, layered spiked pauldrons, limb plate, tassets, a crimson cape, executioner's axe · Soul Harvester: a skeleton (rib cage around a trapped soul, pelvis), horned skull, torn shroud, scythe with a soul lantern, cape.
   Every Chaos soldier slowly knits back together once it has gone a few seconds without being hurt. */
const CGX={};
const CH_ACC=['#e0782a','#b3141f'];          // team accents: ember and blood red
const CH_GLOW=['#ffb040','#ff3a2a'];
const REAPER_CAPE=['#2c1a12','#3d0b14'], DREAD_CAPE=['#3a1a10','#4c0d12'];
function cgxInit(){
  if(CGX.ok) return; CGX.ok=true; gxInit();
  const tube=(pts,r)=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),16,r,4,false);
  // Soulbound Thrall: ragged hood with a pointed tail, mattock, wrist shackle and chain, soul-crystal sack
  CGX.hood=new THREE.SphereGeometry(.245,16,12,Math.PI*.72,Math.PI*1.56,0,Math.PI*.62);
  CGX.hoodTip=(()=>{ const g=new THREE.ConeGeometry(.11,.32,10,1,true); g.rotateX(-1.95); g.translate(0,.05,-.25); return g; })();
  CGX.rope=(()=>{ const g=new THREE.TorusGeometry(.215,.018,5,18); g.rotateX(Math.PI/2); return g; })();
  CGX.handle=new THREE.CylinderGeometry(.022,.027,.88,6);
  CGX.spike=(()=>{ const g=new THREE.ConeGeometry(.034,.34,5); g.rotateZ(-Math.PI/2); g.translate(.2,0,0); return g; })();
  CGX.adze=(()=>{ const g=new THREE.BoxGeometry(.2,.11,.022); g.translate(-.13,-.02,0); g.rotateZ(.25); return g; })();
  CGX.socket=new THREE.BoxGeometry(.1,.12,.07);
  CGX.chip=new THREE.OctahedronGeometry(.045,0);
  CGX.shackle=(()=>{ const g=new THREE.TorusGeometry(.05,.015,5,10); g.rotateX(Math.PI/2); return g; })();
  CGX.link=new THREE.TorusGeometry(.028,.008,4,8);
  CGX.sack=new THREE.SphereGeometry(.15,10,8);
  CGX.crystal=new THREE.OctahedronGeometry(.07,0);
  // Dreadguard: horned helm (one great horn, one broken), visor, crest; long axe with a crescent blade and spikes; plate and pauldrons
  CGX.helm=new THREE.SphereGeometry(.245,16,10,0,Math.PI*2,0,Math.PI*.56);
  CGX.visor=new THREE.BoxGeometry(.3,.17,.06);
  CGX.slit=new THREE.BoxGeometry(.22,.026,.012);
  CGX.crest=new THREE.BoxGeometry(.035,.1,.42);
  CGX.hornL=mergeGeo(crHorn(new V3(-.18,.08,.02),new V3(-1,.45,.2),new V3(0,0,-1),2.3,.66,.06,8));
  CGX.hornR=mergeGeo(crHorn(new V3(.18,.08,.02),new V3(1,.45,.2),new V3(0,0,1),.5,.17,.058,3));
  CGX.haft=new THREE.CylinderGeometry(.03,.035,1.72,7);
  CGX.topSpike=new THREE.ConeGeometry(.045,.26,5);
  CGX.axeBlade=(()=>{ const sh=new THREE.Shape(); sh.moveTo(0,.74); sh.lineTo(-.16,.68); sh.quadraticCurveTo(-.58,.92,-.2,1.21); sh.lineTo(0,1.1); sh.closePath();
    const g=new THREE.ExtrudeGeometry(sh,{depth:.03,bevelEnabled:false}); g.translate(0,0,-.015); return g; })();
  CGX.axeEdge=(()=>{ const P=[]; for(let i=0;i<=12;i++){ const t=i/12, a=(1-t)*(1-t), b=2*t*(1-t), c=t*t; P.push(new V3(-.16*a-.58*b-.2*c-.014,.68*a+.92*b+1.21*c,0)); } return tube(P,.012); })();
  CGX.backSpike=(()=>{ const g=new THREE.ConeGeometry(.035,.24,4); g.rotateZ(-Math.PI/2); g.translate(.14,.95,0); return g; })();
  CGX.wrap=(()=>{ const g=new THREE.TorusGeometry(.042,.012,4,10); g.rotateX(Math.PI/2); return g; })();
  CGX.pauldron=new THREE.SphereGeometry(.15,10,8,0,Math.PI*2,0,Math.PI*.55);
  CGX.pSpike=new THREE.ConeGeometry(.028,.18,5);
  CGX.plate=new THREE.CylinderGeometry(.19,.152,.46,14,1,true,-Math.PI*.58,Math.PI*1.16);
  CGX.backPlate=new THREE.CylinderGeometry(.186,.15,.42,12,1,true,Math.PI*.42,Math.PI*1.16);
  CGX.belt=(()=>{ const g=new THREE.TorusGeometry(.152,.026,5,18); g.rotateX(Math.PI/2); return g; })();
  CGX.skull=new THREE.SphereGeometry(.05,8,6);
  CGX.tabard=new THREE.BoxGeometry(.16,.36,.02);
  // Dreadguard armour, pelvis-local like the plate: gorget, centre ridge, two stomach bands and five hip plates (tassets),
  // molten cracks glowing through the breastplate; on the helm: cheek guards, a fanged grill, a spiked crest
  { const cmp=(p,e,sc)=>new THREE.Matrix4().compose(p,new THREE.Quaternion().setFromEuler(e||new THREE.Euler()),sc||new V3(1,1,1)), Z=new V3(), S=[];
    S.push([new THREE.CylinderGeometry(.1,.165,.085,12,1,true),cmp(new V3(0,.56,0))]);
    S.push([new THREE.BoxGeometry(.03,.4,.03),cmp(new V3(0,.31,.172),new THREE.Euler(.083,0,0))]);
    for(const [y,r] of [[.155,.166],[.105,.162]]) S.push([new THREE.CylinderGeometry(r,r-.002,.05,14,1,true,-Math.PI*.55,Math.PI*1.1),cmp(new V3(0,y,0))]);
    for(let i=1;i<6;i++){ const c=i/6*Math.PI*2; S.push([new THREE.CylinderGeometry(.168,.218,i===3?.24:.2,3,1,true,c-.43,.86),cmp(new V3(0,-.045-(i===3?.02:0),0))]); }
    CGX.dSteel=mergeGeo(S);
    const rr=y=>.152+(y-.07)/.46*.038+.006, on=(x,y)=>new V3(x,y,Math.sqrt(Math.max(0,rr(y)*rr(y)-x*x)));
    const crack=(pts,w)=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([x,y])=>on(x,y)),false,'catmullrom',0),pts.length*4,w,4,false);
    CGX.dMolten=mergeGeo([[crack([[-.11,.48],[-.065,.42],[-.085,.35],[-.03,.29],[-.045,.22],[.02,.16],[.01,.11]],.0075),new THREE.Matrix4()],
      [crack([[-.065,.42],[-.02,.44],[.03,.4]],.006),new THREE.Matrix4()],[crack([[-.03,.29],[.04,.31],[.09,.26],[.12,.28]],.006),new THREE.Matrix4()]]);
    const H=[]; for(const sd of [-1,1]) H.push([new THREE.BoxGeometry(.035,.17,.13),cmp(new V3(sd*.155,-.08,.12),new THREE.Euler(0,sd*.42,sd*.08))]);
    for(let i=0;i<4;i++) H.push([new THREE.ConeGeometry(.024,.11,4),cmp(new V3(0,.27-i*.012,.12-i*.1),new THREE.Euler(-.25-i*.18,0,0))]);
    CGX.dHelmX=mergeGeo(H);
    CGX.dFangs=mergeGeo([-2,-1,0,1,2].map(i=>[new THREE.ConeGeometry(.014,i?.055:.07,4),cmp(new V3(i*.034,-.175,.215),new THREE.Euler(Math.PI,0,0))])); }
  // Soul Harvester: horned skull, scythe with a caged soul lantern
  CGX.cranium=new THREE.SphereGeometry(.205,16,12);
  CGX.jaw=new THREE.BoxGeometry(.19,.065,.15);
  CGX.eyeHole=new THREE.SphereGeometry(.052,8,6);
  CGX.nose=new THREE.ConeGeometry(.024,.06,3);
  CGX.sHorn=[-1,1].map(sd=>mergeGeo(crHorn(new V3(sd*.12,.13,-.04),new V3(sd*.3,.6,-.7),new V3(1,0,0),-1.8,.46,.042,7)));
  CGX.sHaft=new THREE.CylinderGeometry(.02,.025,1.8,6);
  CGX.sBlade=(()=>{ const sh=new THREE.Shape(); sh.moveTo(.02,1.05); sh.lineTo(.02,1.17); sh.quadraticCurveTo(-.42,1.25,-.82,.97); sh.quadraticCurveTo(-.44,1.1,.02,1.05); sh.closePath();
    const g=new THREE.ExtrudeGeometry(sh,{depth:.016,bevelEnabled:false}); g.translate(0,0,-.008); return g; })();
  CGX.lantern=new THREE.OctahedronGeometry(.065,0);
  // the Harvester's bones (pelvis-local: y up the spine, z forward): six pairs of ribs (the last two floating), a
  // sternum, a pelvis ring with its two wings and a sacrum; a torn shroud on the shoulders; a row of teeth
  { const I=new THREE.Matrix4(), parts=[], cmp=(p,e,sc)=>new THREE.Matrix4().compose(p,new THREE.Quaternion().setFromEuler(e),sc||new V3(1,1,1));
    for(const [y,w,fl] of [[.5,.058,0],[.455,.074,0],[.41,.086,0],[.365,.092,0],[.32,.09,1],[.28,.08,1]]) for(const sd of [-1,1]){
      const pts=[new V3(sd*.012,y,-.045),new V3(sd*w*.8,y+.004,-.058),new V3(sd*w,y-.016,.004),new V3(sd*w*.78,y-.04,.068)];
      if(!fl) pts.push(new V3(sd*.026,y-.056,.094));
      parts.push([tube(pts,.0085),I]); }
    parts.push([new THREE.BoxGeometry(.03,.19,.014),cmp(new V3(0,.375,.1),new THREE.Euler(-.12,0,0))]);
    parts.push([new THREE.TorusGeometry(.068,.014,5,14),cmp(new V3(0,.005,.012),new THREE.Euler(Math.PI/2-.45,0,0),new V3(1,.8,1))]);
    for(const sd of [-1,1]) parts.push([new THREE.SphereGeometry(.06,8,6,0,Math.PI*2,0,Math.PI*.55),cmp(new V3(sd*.075,.03,-.012),new THREE.Euler(0,0,-sd*.95),new V3(.4,.85,1))]);
    parts.push([new THREE.ConeGeometry(.03,.09,5),cmp(new V3(0,-.015,-.045),new THREE.Euler(Math.PI+.3,0,0),new V3(1,1,.6))]);
    CGX.bones=mergeGeo(parts);
    CGX.teeth=mergeGeo([0,1,2,3,4,5].map(i=>[new THREE.BoxGeometry(.016,.03,.014),new THREE.Matrix4().makeTranslation(-.05+i*.02,-.135,.163)])); }
  CGX.shroud=(()=>{ const g=new THREE.CylinderGeometry(.07,.15,.16,14,2,true), p=g.attributes.position;
    for(let i=0;i<p.count;i++){ const y=p.getY(i); if(y<-.07){ const a=Math.atan2(p.getZ(i),p.getX(i)); p.setY(i,y-.05*(.5+.5*Math.sin(a*7+1.3))*(.6+.4*Math.sin(a*3))); } }
    g.computeVertexNormals(); g.translate(0,.555,-.01); return g; })();
  CGX.cage=new THREE.TorusGeometry(.075,.008,4,12);
}
function buildChaosGear(u,G){
  cgxInit();
  const team=u.team, st=u.statue, L=c=>st?M.stone:lamOf(c), LD=c=>st?M.stoneD:lamOf(c), E=(c,e)=>st?M.stone:lamOf(c,{emissive:e});
  const acc=st?M.stoneD:lamOf(CH_ACC[team]), black=st?M.stoneD:lamOf('#0a0708');
  switch(u.type){
    case 'thrall':{
      const iron=L('#46434b');
      const w=grp(); w.add(mesh(CGX.handle,LD('#3b2a1c'),0,.31,0),mesh(CGX.socket,iron,0,.7,0),mesh(CGX.spike,iron,0,.7,0),mesh(CGX.adze,iron,0,.7,0),mesh(CGX.chip,E('#ff5a3a','#c01e08'),0,.7,.045)); G.w=w;
      const hood=LD('#2a221d'), h=grp(); h.add(mesh(CGX.hood,hood,0,.02,-.01),mesh(CGX.hoodTip,hood),mesh(CGX.rope,acc,0,-.05,0)); G.h=h;
      const o=grp(); o.add(mesh(CGX.shackle,iron)); for(let i=0;i<4;i++){ const l=mesh(CGX.link,iron,0,-.055-i*.045,0); l.rotation.y=i%2?Math.PI/2:0; o.add(l); } G.o=o;
      const b=grp(); const sk=mesh(CGX.sack,LD('#3a2c22'),0,.02,-.04); sk.scale.set(1,1.1,.85); b.add(sk);
      for(const [x,z,r] of [[-.05,-.03,.3],[.05,-.05,-.4],[0,-.08,.1]]){ const c=mesh(CGX.crystal,E('#ff5a3a','#a8180a'),x,.15,z); c.rotation.z=r; c.scale.set(.7,1.4,.7); b.add(c); }
      G.b=b; b.visible=false; break; }
    case 'dread':{
      const iron=L('#2d2b31'), steel=L('#62636b'), bone=L('#d9cbb0');
      const w=grp(); w.add(mesh(CGX.haft,LD('#2a1d16'),0,.3,0),mesh(CGX.topSpike,iron,0,1.28,0),mesh(CGX.axeBlade,steel),mesh(CGX.axeEdge,E('#ff6a2a','#ff3a0a')),mesh(CGX.backSpike,iron),
        mesh(CGX.wrap,iron,0,.68,0),mesh(CGX.wrap,iron,0,.2,0));
      for(let i=0;i<3;i++){ const l=mesh(CGX.link,iron,-.1,.64-i*.045,0); l.rotation.y=i%2?Math.PI/2:0; w.add(l); } G.w=w;
      const h=grp(); h.add(mesh(CGX.helm,iron,0,.0,0),mesh(CGX.visor,iron,0,-.07,.19),mesh(CGX.slit,E('#ff4a1a','#d0200a'),0,-.04,.222),mesh(CGX.crest,iron,0,.2,-.02),mesh(CGX.hornL,bone),mesh(CGX.hornR,bone),
        mesh(CGX.dHelmX,iron),mesh(CGX.dFangs,bone)); G.h=h;
      const r=grp(); r.add(mesh(CGX.plate,iron,0,.3,0),mesh(CGX.backPlate,iron,0,.3,0),mesh(CGX.belt,iron,0,.06,0),mesh(CGX.skull,bone,0,.07,.16),mesh(CGX.tabard,acc,0,-.13,.165),
        mesh(CGX.dSteel,st?M.stone:lamOf('#3c3b43',{side:THREE.DoubleSide})),mesh(CGX.dMolten,E('#ff6a2a','#ff3a0a')));
      for(let i=0;i<5;i++){ const l=mesh(CGX.link,iron,-.12+i*.06,.42-i*.06,.165); l.rotation.y=i%2?Math.PI/2:0; r.add(l); } G.r=r;
      for(const [k,sd] of [['pl',-1],['pr',1]]){ const g=grp(); const p=mesh(CGX.pauldron,iron); p.scale.set(1.22,.85,1.28); g.add(p);
        const p2=mesh(CGX.pauldron,L('#3c3b43'),sd*.05,-.065,0); p2.scale.set(1.1,.7,1.2); p2.rotation.z=-sd*.4; g.add(p2);
        for(let i=0;i<3;i++){ const sp=mesh(CGX.pSpike,bone,sd*.065,.095,-.08+i*.08); sp.rotation.z=-sd*.55; g.add(sp); } G[k]=g; }
      if(!st) makeCape(u,'d');
      break; }
    case 'harvester':{
      const bone=L('#e3d6b8');
      const h=grp(); const cr=mesh(CGX.cranium,bone,0,.01,0); cr.scale.set(.95,1.05,1.06); h.add(cr,mesh(CGX.jaw,bone,0,-.16,.07),mesh(CGX.teeth,L('#efe6cc')));
      for(const sd of [-1,1]){ const e=mesh(CGX.eyeHole,black,sd*.075,0,.168); e.scale.set(1.18,1,.62); h.add(e); }
      const n=mesh(CGX.nose,black,0,-.065,.19); n.rotation.x=Math.PI; h.add(n,mesh(CGX.sHorn[0],LD('#3a2a24')),mesh(CGX.sHorn[1],LD('#3a2a24'))); h.scale.setScalar(.84); G.h=h;   // a smaller skull suits the thin frame
      const w=grp(); w.add(mesh(CGX.sHaft,LD('#1e1714'),0,.3,0),mesh(CGX.sBlade,L('#8a8c94')),mesh(CGX.lantern,E('#c58cff','#7a2ad8'),0,1.28,0));
      for(const ry of [0,Math.PI/2]){ const c=mesh(CGX.cage,LD('#2a2226'),0,1.28,0); c.rotation.y=ry; w.add(c); } G.w=w;
      const r=grp(); r.add(mesh(CGX.bones,bone),mesh(CGX.shroud,st?M.stoneD:lamOf(REAPER_CAPE[team],{side:THREE.DoubleSide}))); G.r=r;
      if(!st) makeCape(u,'r');
      break; }
    default: buildChaosGear2(u,G,L,LD,E,acc,black);   // the second wave (27c)
  }
  for(const k of ['r','pl','pr']) if(G[k]){ G[k].scale.setScalar(u.s); freezeGear(G[k]); }
}
const _ch1=new V3(),_ch2=new V3(),_ch3=new V3();
// the Dreadguard's limb plate: vambraces, couters and gauntlets; cuisses, poleyns, greaves and sabatons
const PL_IRON=new THREE.Color('#3c3b43'), PL_DARK=new THREE.Color('#26242b'), _pa=new V3(), _pb=new V3();
function drawPlateLimbs(u,c1,c2){
  if(u.cloak&&u.alive) return;
  const j=u.j, s=u.s, rl=.068*s*u.thick, ra=rl*.86, A=c1||PL_IRON, B=c2||PL_DARK;
  for(const [el,ha] of [[j.eL,j.hL],[j.eR,j.hR]]){
    cyl(_pa.copy(el).lerp(ha,.12),_pb.copy(el).lerp(ha,.8),ra*1.2,A,limbIM); sph(el,ra*1.16,B,jointIM); sph(ha,ra*1.2,A,jointIM); }
  _ff.set(u.fwdW.x,0,u.fwdW.z); if(_ff.lengthSq()<1e-4) _ff.set(0,0,1); _ff.normalize(); _fq.setFromUnitVectors(_fz,_ff);
  for(const [hp,kn,ft] of [[j.hipL,j.kL,j.fL],[j.hipR,j.kR,j.fR]]){
    cyl(_pa.copy(hp).lerp(kn,.3),_pb.copy(hp).lerp(kn,.86),rl*1.13,B,limbIM); sph(kn,rl*1.18,A,jointIM);
    cyl(_pa.copy(kn).lerp(ft,.1),_pb.copy(kn).lerp(ft,.86),rl*1.15,A,limbIM);
    _fp.copy(ft).addScaledVector(_ff,.06*s); _fp.y-=.004*s; _s.set(rl*1.18,rl*.82,rl*1.95); _m.compose(_fp,_fq,_s); put(jointIM,A); }
}
function updateChaosGear(u){
  const G=u.G, j=u.j, s=u.s; if(!G) return;
  _gfl.copy(u.fwdW).addScaledVector(u.spine,-u.fwdW.dot(u.spine)); if(_gfl.lengthSq()<1e-6) _gfl.copy(u.fwdW); _gfl.normalize();
  if(G.r) orient(G.r,j.pelvis,u.spine,_gfl);
  for(const [k,sh,sd] of [['pl',j.sL,-1],['pr',j.sR,1]]){ const g=G[k]; if(!g) continue;
    if(u.alive&&!u.rag) _ch1.copy(sh); else _ch1.copy(j.chest).addScaledVector(u.rightW,sd*((u.T.shW||.07)+.1)*s);
    _ch1.addScaledVector(u.rightW,sd*.05*s).addScaledVector(u.spine,.02*s); orient(g,_ch1,u.spine,_gfl); }
  updateChaosGear2(u);
}

/* ---------- soul fragments, wails, drains ---------- */
const souls=[], wisps=[];
function harvTip(u,out){ return out.copy(u.j.hR).addScaledVector(u.wRw,1.28*u.s); }
function castSoul(u,e){
  const t=u.atkTarget; const P=aimPoint(t,new V3()); if(!P) return;
  const o=e.from==='hL'?u.j.hL.clone().addScaledVector(u.fwdW,.1*u.s):harvTip(u,new V3());
  const rend=!!(e.rend||hasRes(u.team,'soulRend'));
  souls.push({p:o,v:new V3().subVectors(P,o).normalize().multiplyScalar(e.big?13:16),t,team:u.team,src:u,dmg:u.T.dmg*(e.dmg||1),rend,big:!!e.big,age:0});
  flashes.push({p:o.clone(),r0:.05,r1:.35,t:0,life:.25,col:'#c58cff'}); crSfx('soulCast','orbWhoosh',o,.7); u.soulGlow=Math.max(u.soulGlow||0,.6);
}
function soulBurst(p,k){ puffDir(p,UP,Math.round(8*k),1.6,1.2,'#b87aff',.22*k,.8); puffDir(p,UP,Math.round(4*k),1.2,1,'#ff3a6a',.2*k,.7); flashes.push({p:p.clone(),r0:.15,r1:.9*k,t:0,life:.3,col:'#c58cff'}); }
function curse(o,src){ if(!o.alive||!o.isUnit) return; const st=o.st||(o.st={}); const was=!!st.rend; st.rend={t:5,src}; if(!was) callout(o,'Soul Rend','#c58cff'); }
function soulHit(S,o){
  const dir=new V3(o.pos.x-S.p.x,0,o.pos.z-S.p.z); if(dir.lengthSq()<1e-6) dir.set(S.v.x,0,S.v.z); dir.normalize();
  damage(o,S.dmg,S.src,dir,S.big?2.4:.9,S.big?1:.3,false,o.j.chest.clone());
  if(S.rend) curse(o,S.src);
  soulBurst(S.p,S.big?1.3:.7); crSfx('soulHit','zap',S.p,.75);
  if(!S.col){ // the Harvester's soul shatters: a crimson flash and its ghost streams up out of the victim
    flashes.push({p:S.p.clone(),r0:.1,r1:S.big?.8:.5,t:0,life:.25,col:'#a0204a'}); ring(o.pos,S.big?1:.6,'#8a4ac0');
    puffDir(o.j.chest,UP,S.big?7:4,1.6,.35,'#b88ae0',.05,1); puffDir(o.j.chest,UP,2,1,.5,'#3a1048',.12,1.1); }
  if(S.big) for(const q of units){ if(q===o||!q.alive||q.team===S.team) continue; if(q.j.chest.distanceTo(S.p)<1.4) damage(q,S.dmg*.4,S.src,null,1.2); }
}
function castWail(u,e){
  const R=e.far?6.5:4.8, fx=u.fwdW;
  for(const o of units){ if(!o.alive||o.team===u.team||isAir(o)) continue; const dx=o.pos.x-u.pos.x,dz=o.pos.z-u.pos.z,d=Math.hypot(dx,dz); if(d>R||d<.01) continue;
    if((dx*fx.x+dz*fx.z)/d<.45) continue;
    damage(o,u.T.dmg*.35,u,null,1.2); if(!o.alive) continue; o.morale=Math.max(0,o.morale-22);
    if(!o.fin&&o.state==='ok'&&(!o.action||o.action.c.idle)){ play(o,'flinch'); o.fwdScale=1; o.cdT=Math.max(o.cdT,.8); } }
  wailFx(u);
}
function wailFx(u){ const fx=u.fwdW, p=u.j.head.clone().addScaledVector(fx,.2*u.s); puffDir(p,fx,16,5,1.3,'#9c6bd6',.3,.9); puffDir(p,fx,8,3.5,1,'#3a2450',.4,1.1);
  const c=u.pos.clone().addScaledVector(fx,2); c.y=H(c.x,c.z); ring(c,2.4,'#c9a6ff'); crSfx('wail','roar',p,.9); }
function soulDrain(from,toU){ for(let i=0;i<3;i++) wisps.push({a:from.clone().add(new V3(rand(-.15,.15),rand(-.1,.2),rand(-.15,.15))),u:toU,t:-i*.08,life:.55,col:i%2?'#ff4a6a':'#c58cff',p:from.clone()});
  crSfx('soulDrain','cast',from,.6); }
// Hellforged Cleave: the axe glows white-hot, the sweep throws a line of men out of their stance
function cleaveHit(u,o){
  if(!o.alive) return;
  if(o.action&&!o.action.c.idle&&!o.fin&&o.state==='ok'){ o.action=null; play(o,'flinch'); o.fwdScale=1; }
  o.cdT=Math.max(o.cdT,1.1); o.brokeT=game.time+3;
  const dir=new V3(o.pos.x-u.pos.x,0,o.pos.z-u.pos.z); if(dir.lengthSq()<1e-6) dir.copy(u.fwdW); dir.normalize(); o.vel.addScaledVector(dir,2.2/o.s);
  puffDir(o.j.chest,dir,5,2.4,.8,'#ff8a2a',.16,.6);
}
function cleaveFx(u){ for(let i=-4;i<=4;i++){ const a=i*.22, c=Math.cos(a), sn=Math.sin(a), f=u.fwdW, dx=f.x*c+f.z*sn, dz=f.z*c-f.x*sn;
    _ch1.set(u.pos.x+dx*1.9*u.s,u.pos.y+.9*u.s,u.pos.z+dz*1.9*u.s); puffDir(_ch1,_ch2.set(dx,.2,dz),3,2,.5,i%2?'#ff8a2a':'#ffd070',.2,.5); }
  shakeAt(u.pos,.25); crSfx('forge','ignite',u.j.hR,1); }
const FX_X={
  soul:(u,e,v,P)=>soulBurst(P,1),
  soulBlast:(u,e,v,P)=>{ soulBurst(P,1.8); shakeAt(P,.3); crSfx('soulHit','blast',P,1); },
  wail:(u)=>wailFx(u),
};
Object.assign(EXTRA_EV,{
  soul:castSoul, wail:castWail,
  soulTrail:(u)=>{ for(let k=0;k<4;k++){ _ch1.copy(u.j.hR).addScaledVector(u.wRw,(.55+k*.2)*u.s); puff(_ch1,1,.08,.4,k%2?'#9a5cff':'#c58cff'); } u.soulGlow=1; },
  soulCharge:(u)=>{ u.soulGlow=1; crSfx('soulCharge','cast',u.j.hR,.5); },
  soulDrain:(u,e,fin,v)=>{ const rg=fin&&(fin.rag||fin.rag2), src=v&&v.alive?v.j.chest:(rg?rg.p[1]:null); if(src) soulDrain(src,u); },
  soulDrainRag:(u,e,fin)=>{ const rg=fin&&(fin.rag||fin.rag2); if(!rg) return; soulDrain(rg.p[1],u); for(const vv of rg.v) vv.add(_ch1.set(rand(-.5,.5),rand(0,.8),rand(-.5,.5))); wakeRag(rg); },
  shakeRag:(u,e,fin)=>{ const rg=fin&&(fin.rag||fin.rag2); if(!rg) return; for(const vv of rg.v) vv.add(_ch1.set(rand(-1.2,1.2),rand(0,1.2),rand(-1.2,1.2))); wakeRag(rg); bleed(rg.p[2],UP,4,1.6,.4); sfx('punch',rg.p[2],.6); },
  forge:(u)=>{ u.forgeT=1.1; crSfx('forge','ignite',u.j.hR,.8); },
  ghost:(u)=>{ puffDir(u.j.chest,u.fwdW.clone().negate(),10,2,1,'#3a2450',.35,.8); puffDir(u.j.chest,UP,5,1,.6,'#c58cff',.2,.6); },
  chain:(u)=>crSfx('chain','clang',u.j.hL,.35),
  whet:(u)=>crSfx('whet','clang',u.j.hR,.35),
  clank:(u)=>sfx('clang',u.j.head,.25),
  dreadRoar:(u)=>{ shakeAt(u.pos,.1); puff(u.j.head,4,.22,2.2,'#2a1a14'); crSfx('dreadRoar','roar',u.j.head,.8); },
  groan:(u)=>crSfx('thrallGroan',null,u.j.head,.5),
  crystal:(u)=>{ u.crystalT=1.6; },
  wisp:(u)=>{ u.wispT=1.6; },
});

/* ---------- workers, upgrades and the Chaos trait ---------- */
function workerDig(u){ return u.type==='thrall'?(hasRes(u.team,'soulSiphon')?2.8:4):(hasRes(u.team,'hustle')?2.6:4); }
function workerYield(u){ return u.type==='thrall'?(hasRes(u.team,'soulSiphon')?34:25):(hasRes(u.team,'hustle')?80:60); }
// Hellcrawlers with Magma Claws set what they rake on fire
function chaosHitMods(u,t,dm){ if(u.T.crawler&&hasRes(u.team,'magmaClaws')&&t.isUnit) applyBurn(t,u,4,2.5);
  if(u.type==='reaper'&&u.alive) u.hp=Math.min(u.maxHp,u.hp+dm*.25);   // the Grim Reaper drinks a quarter of every cut
  if((u.type==='hades'||u.T.heads)&&t.isUnit) applyBurn(t,u,6,2.5); return dm; }
// Infernal Regeneration: four seconds without a wound and the flesh starts knitting back (1.2% a second)
function chaosTick(u,dt){
  if(u.forgeT>0) u.forgeT-=dt; if(u.soulGlow>0) u.soulGlow=Math.max(0,u.soulGlow-dt*1.6); if(u.crystalT>0) u.crystalT-=dt; if(u.wispT>0) u.wispT-=dt;
  if(game.mode!=='battle'||!u.alive||u.hp>=u.maxHp||u.fin||u.state!=='ok') return;
  if(game.time-(u.hurtAt===undefined?-99:u.hurtAt)<4) return;
  u.hp=Math.min(u.maxHp,u.hp+u.maxHp*.012*dt);
  if(Math.random()<dt*1.2) puff(u.j.chest,1,.05*u.s,.5,'#ff7a2a');
}

/* ---------- brains ---------- */
TYPES.dread.pick=(u,t)=>{
  const now=game.time, crowd=enemiesNear(u.team,u.pos.x,u.pos.z,2.8);
  if(t&&t.isUnit&&hasRes(u.team,'hellCleave')&&crowd>=2&&(u.cdCleave||0)<now){ u.cdCleave=now+9; return 'dgCleave'; }
  if(crowd>=3&&Math.random()<.45) return pickOf(['dgSweep','dgSpin','dgSlam']);
  const L=ATTACKS_C.dread.filter(x=>x!=='dgCleave'); let n,g=0; do{ n=pickOf(L); }while(n===u.lastAtk&&++g<5); return n;
};
TYPES.harvester.pick=(u,t)=>{
  const d=t?Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z):99, now=game.time;
  if(t&&t.isUnit&&d<TYPES.harvester.meleeR+(t.s-1)*.4&&!isAir(t)) return pickOf(HV_MELEE);
  if(!t||!t.isUnit) return pickOf(['soulBolt','soulLance','soulVolley']);
  if(d<5&&(u.cdWail||0)<now&&enemiesNear(u.team,u.pos.x,u.pos.z,4.5)>=3){ u.cdWail=now+12; return 'soulWail'; }
  if(hasRes(u.team,'soulRend')&&!(t.st&&t.st.rend)&&(u.cdRend||0)<now){ u.cdRend=now+6; return 'soulRend'; }
  if(d<5.5&&Math.random()<.3) return 'backstepBolt';
  return pickOf(['soulBolt','soulBolt','soulBolt','soulVolley','soulLance','palmSouls']);
};
Object.assign(LIGHT,{thrall:1,harvester:1});
Object.assign(PREY,{harvester:3,thrall:1.4});

/* ---------- per-frame simulation and drawing ---------- */
function updateChaos(dt){
  for(let i=souls.length-1;i>=0;i--){ const S=souls[i]; S.age+=dt;
    if(S.t&&(S.t.alive||S.t.isStatue)){ const P=aimPoint(S.t,_ch3); if(P){ const sp=S.v.length(); _ch2.subVectors(P,S.p).normalize().multiplyScalar(sp); S.v.lerp(_ch2,Math.min(1,dt*5)); } }
    S.p.addScaledVector(S.v,dt); if(S.col&&Math.random()<dt*28) puff(S.p,1,.07,.25,'#5dffc8');   // the Harvester's soul sheds its own smoke (26c)
    let hit=null, gone=S.age>(RL.on?5:2.4)||S.p.y<H(S.p.x,S.p.z)+.08||castleBlocks(S.p);
    if(!gone) for(const o of units){ if(!o.alive||o.team===S.team) continue; if(o.j.chest.distanceTo(S.p)<.45*o.s){ hit=o; break; } }
    if(hit){ soulHit(S,hit); souls.splice(i,1); continue; }
    if(!gone&&S.t&&S.t.isStatue&&Math.hypot(S.t.pos.x-S.p.x,S.t.pos.z-S.p.z)<1.4){ hitStatue(S.t,S.dmg); soulBurst(S.p,1); souls.splice(i,1); continue; }
    if(gone){ soulBurst(S.p,.5); souls.splice(i,1); } }
  for(let i=wisps.length-1;i>=0;i--){ const W=wisps[i]; W.t+=dt; if(W.t<0) continue; const k=Math.min(1,W.t/W.life), dst=W.u&&W.u.j?W.u.j.hL:W.a;
    W.p.copy(W.a).lerp(dst,EASE.io(k)); W.p.y+=Math.sin(k*Math.PI)*.35; if(k>=1){ flashes.push({p:dst.clone(),r0:.05,r1:.3,t:0,life:.2,col:W.col}); wisps.splice(i,1); } }
  updateChaos2(dt);
}
const _cd2=new V3();
function drawChaos(){
  for(const S of souls) if(fowVisP(S.p)) drawSoul(S);   // harvester souls and oracle spirit orbs (26c)
  for(const W of wisps) if(W.t>=0) glowAt(W.p,.09,W.col);
  const ct=cam.target, tt=game.time;
  for(const L of [units,CASTLES[0]?CASTLES[0].garrison:[],CASTLES[1]?CASTLES[1].garrison:[]]) for(const u of L){
    if(!u.alive||!u.T.chaos||u.T.crawler) continue;
    if(Math.abs(u.pos.x-ct.x)>48||Math.abs(u.pos.z-ct.z)>34) continue;
    const s=u.s, j=u.j, f=_cd2.subVectors(j.head,j.neck).normalize(), sp=f, fw=u.fwdW, rw=u.rightW, gc=CH_GLOW[u.team];
    if(u.type==='thrall'){ for(const sd of [-1,1]){ _ch1.copy(j.head).addScaledVector(fw,.16*s).addScaledVector(rw,sd*.06*s).addScaledVector(sp,-.01*s); glowAt(_ch1,.022*s,gc); }
      if(u.carry&&u.G&&u.G.b){ _ch1.copy(j.chest).addScaledVector(fw,-.22*s).addScaledVector(sp,.02*s); glowAt(_ch1,.08*s,'#ff4a2a'); }
      if(u.crystalT>0){ glowAt(j.hL,.07*s+.02*Math.sin(tt*9),'#ff5a3a'); } }
    else if(u.type==='dread'){ for(const sd of [-1,1]){ _ch1.copy(j.head).addScaledVector(fw,.21*s).addScaledVector(rw,sd*.055*s).addScaledVector(sp,-.04*s); glowAt(_ch1,.026*s,'#ff4a1a'); }
      if(u.forgeT>0){ _ch1.copy(j.hR).addScaledVector(u.wRw,.95*s); glowAt(_ch1,(.18+.05*Math.sin(tt*30))*s,'#ff9a3a'); if(Math.random()<.4) puff(_ch1,1,.05,.6,'#ffb050'); } }
    else if(u.type==='harvester'){ for(const sd of [-1,1]){ _ch1.copy(j.head).addScaledVector(fw,.15*s).addScaledVector(rw,sd*.075*s); glowAt(_ch1,.024*s,'#d070ff'); }
      { _ch1.copy(j.pelvis).addScaledVector(u.spine,.39*s).addScaledVector(fw,.015*s); const pc=.5+.5*Math.sin(tt*3.1+u.id*1.7), sg=u.soulGlow||0;
        glowAt(_ch1,(.045+.012*pc+.03*sg)*s,'#c27bff'); glowAt(_ch1,(.085+.02*pc+.03*sg)*s,'#3a1460'); }
      if(u.G&&u.G.w&&!u.G.w.dropped){ harvTip(u,_ch1); const pul=.5+.5*Math.sin(tt*4+u.id); glowAt(_ch1,(.09+.03*pul+.12*(u.soulGlow||0))*s,'#a64dff'); }
      if(u.wispT>0){ _ch1.copy(j.hL).addScaledVector(UP,.08*s+.03*Math.sin(tt*5)); glowAt(_ch1,.07*s,'#c58cff'); } }
  }
  // the cursed: a ring of soul light circling the chest
  for(const u of units){ const S=u.st; if(!u.alive||!S||!S.rend) continue;
    for(let i=0;i<3;i++){ const a=tt*3+i*2.094; _ch1.copy(u.j.chest).addScaledVector(u.rightW,Math.cos(a)*.22*u.s).addScaledVector(u.fwdW,Math.sin(a)*.22*u.s); glowAt(_ch1,.05,'#b070ff'); } }
  drawChaos2();
}
