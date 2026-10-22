/* ================= Order army systems: Wizard, Cleric, Ninja, Wing Archer =================
   appearance · flight · spells · status effects · targeting rules · unit brains */

/* ---------- targeting rules ---------- */
const isAir=o=>!!(o&&o.fl&&o.fl.air&&o.alive!==false);
// only arrows, bolts and spells reach a flyer; a cloaked ninja is invisible until he is close
function canTarget(u,o){
  if(o.inCastle||o.emerging) return false;     // still inside its castle walls (or climbing out of the Hellpit)
  if(isAir(o)&&!u.T.ranged&&!u.fl) return false;
  if(o.cloak&&Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z)>1.8) return false;
  if(FOW.on&&o.team!==u.team&&!fowSees(u.team,o)) return false;   // Riverlands: nobody shoots at what his army can't see (37e)
  return true;
}
// per-blow modifiers: the ninja's Fixate stacks and his Shinobi poison
function hitMods(u,t,dm,mul){
  if(u.T.chaos) dm=chaosHitMods(u,t,dm);
  if(u.type==='ninja'){
    if(u.fixT===t) u.fixN=Math.min(5,(u.fixN||1)+1); else { u.fixT=t; u.fixN=1; }
    dm*=1+.16*(u.fixN-1); if(u.fixN>=3&&mul===1) callout(t,'Fixate ×'+u.fixN,'#c9a6ff');
    if(u.cloak){ dm*=2; applyPoison(t,u,10,5); u.cloak.hits=(u.cloak.hits||0)+1; if(u.cloak.hits>=2) endCloak(u); }
  }
  return dm;
}

/* ---------- appearance ---------- */
const GX={};
const lamC={}; const lamOf=(c,o)=>{ const k=c+(o?JSON.stringify(o):''); return lamC[k]||(lamC[k]=new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}))); };
function rodMesh(a,b,r,mat){ const d=new V3().subVectors(b,a), L=d.length(); const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,L,5),mat); m.castShadow=true;
  m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(UP,d.normalize()); return m; }
function wingShape(pts){ const sh=new THREE.Shape(); sh.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) sh.lineTo(pts[i][0],pts[i][1]); sh.closePath();
  const g=new THREE.ShapeGeometry(sh); g.rotateY(-Math.PI/2); return g; }   // shape x → chord (local +z, toward the trailing edge), y → span
// bake several transformed geometries into one (one draw call instead of dozens)
function mergeGeo(list){
  const P=[],N=[]; let n=0;
  for(const [g,m] of list){ const c=g.index?g.toNonIndexed():g.clone(); c.applyMatrix4(m); P.push(c.attributes.position.array); N.push(c.attributes.normal.array); n+=c.attributes.position.array.length; }
  const pos=new Float32Array(n), nor=new Float32Array(n); let o=0; for(let i=0;i<P.length;i++){ pos.set(P[i],o); nor.set(N[i],o); o+=P[i].length; }
  const out=new THREE.BufferGeometry(); out.setAttribute('position',new THREE.BufferAttribute(pos,3)); out.setAttribute('normal',new THREE.BufferAttribute(nor,3)); return out;
}
function rodGeo(a,b,r){ const d=new V3().subVectors(b,a), L=d.length(); const q=new THREE.Quaternion().setFromUnitVectors(UP,d.normalize());
  return [new THREE.CylinderGeometry(r,r,L,5),new THREE.Matrix4().compose(a.clone().lerp(b,.5),q,new V3(1,1,1))]; }
function gxInit(){
  if(GX.ok) return; GX.ok=true;
  // Wizard: grey pointed hat, white beard, wooden staff with a violet orb
  GX.hatBrim=new THREE.CylinderGeometry(.33,.35,.022,26); GX.hatCone=new THREE.ConeGeometry(.17,.34,18,1,true); GX.hatTip=new THREE.ConeGeometry(.092,.26,14);
  GX.hatBand=(()=>{const g=new THREE.TorusGeometry(.17,.022,6,22); g.rotateX(Math.PI/2); return g;})();
  GX.beard=new THREE.SphereGeometry(.12,12,9); GX.beardTip=(()=>{const g=new THREE.ConeGeometry(.105,.32,10); g.rotateZ(Math.PI); return g;})();
  GX.staff=new THREE.CylinderGeometry(.024,.03,1.55,7); GX.orb=new THREE.SphereGeometry(.085,16,12); GX.prong=new THREE.ConeGeometry(.016,.13,5);
  // Cleric: silver staff with a gem in a hexagonal frame and a crescent, hooded robe with gold trim
  GX.cStaff=new THREE.CylinderGeometry(.019,.022,1.55,7); GX.hexRing=new THREE.TorusGeometry(.105,.016,4,6); GX.gem=new THREE.SphereGeometry(.068,14,10);
  GX.crescent=new THREE.TorusGeometry(.16,.015,5,18,2.4);
  GX.robeTop=new THREE.CylinderGeometry(.15,.19,.57,16,1,true); GX.collar=(()=>{const g=new THREE.TorusGeometry(.13,.024,6,20); g.rotateX(Math.PI/2); return g;})();
  GX.skirt=new THREE.LatheGeometry([[.185,.02],[.2,-.12],[.235,-.32],[.28,-.55],[.33,-.76],[.35,-.85]].map(p=>new THREE.Vector2(p[0],p[1])),26);
  GX.hem=(()=>{const g=new THREE.TorusGeometry(.35,.017,5,30); g.rotateX(Math.PI/2); return g;})();
  GX.trimTop=new THREE.BoxGeometry(.028,.56,.012); GX.trimSkirt=new THREE.BoxGeometry(.028,.86,.012);
  GX.hood=new THREE.SphereGeometry(.235,18,12,Math.PI*.78,Math.PI*1.44,0,Math.PI*.6);
  // gold trim along the two edges of the hood's face opening (meridians of the hood sphere, from the crown down)
  GX.hoodRim=mergeGeo([-.78,-.22].map(b=>{ const g=new THREE.TorusGeometry(.236,.015,4,16,Math.PI*.6); g.rotateZ(-Math.PI*.1); g.rotateY(Math.PI*b); return [g,new THREE.Matrix4()]; }));
  // Ninja: white eye slit, cloth tails, a wavy bone-white blade, scabbard on the back
  GX.eyes=(()=>{const g=new THREE.TorusGeometry(.197,.021,4,18,1.75); g.rotateX(Math.PI/2); g.rotateY(-(Math.PI/2-.875)); g.translate(0,.025,0); return g;})();
  GX.nTail=new THREE.BoxGeometry(.04,.26,.008);
  GX.nBlade=(()=>{ const sh=new THREE.Shape(); sh.moveTo(-.021,0); sh.lineTo(-.021,.86); sh.lineTo(.004,.98);
    for(let i=0;i<11;i++){ const y=.9-i*.082; sh.lineTo(i%2?.026:.04,y); } sh.lineTo(.026,0); sh.closePath();
    const g=new THREE.ExtrudeGeometry(sh,{depth:.011,bevelEnabled:false}); g.translate(0,.1,-.0055); return g; })();
  GX.nGrip=new THREE.CylinderGeometry(.019,.019,.24,6); GX.tsuba=new THREE.CylinderGeometry(.046,.046,.014,12); GX.scab=new THREE.CylinderGeometry(.027,.022,.95,6);
  // Wing Archer: mechanical wings (spar, riveted leading edge, two panels), harness pack, goggles, crossbow
  GX.wIn=wingShape([[0,0],[0,.86],[.2,.88],[.42,.84],[.47,.74],[.52,.62],[.56,.5],[.6,.36],[.62,.18],[.6,0]]);
  GX.wOut=wingShape([[0,0],[.02,1.02],[.1,.95],[.15,.86],[.22,.8],[.26,.7],[.31,.63],[.34,.52],[.39,.44],[.41,.32],[.45,.22],[.46,.1],[.46,0]]);
  // each panel's frame (leading-edge spar, three ribs fanning to the trailing edge like a bat's fingers, rivets) is one merged mesh
  const rivet=new THREE.SphereGeometry(.017,6,4), M4=()=>new THREE.Matrix4();
  const frameGeo=(len,r0,r1,ribs)=>{ const L=[]; const sp=new THREE.CylinderGeometry(r1,r0,len,6); sp.translate(0,len/2,0); L.push([sp,M4()]);
    for(const [y0,z1,y1] of ribs) L.push(rodGeo(new V3(0,y0,.02),new V3(0,y1,z1),.009));
    for(let y=.1;y<len-.04;y+=.13) for(const sx of [-.012,.012]) L.push([rivet,M4().makeTranslation(sx,y,.03)]);
    return mergeGeo(L); };
  GX.frameIn=frameGeo(.86,.024,.018,[[.04,.6,.2],[.3,.55,.52],[.58,.42,.84]]);
  GX.frameOut=frameGeo(1.02,.018,.01,[[.04,.45,.22],[.34,.34,.52],[.64,.22,.8]]);
  GX.pack=new THREE.BoxGeometry(.27,.32,.13); GX.packHub=new THREE.CylinderGeometry(.05,.05,.3,10);
  GX.goggle=(()=>{const g=new THREE.CylinderGeometry(.046,.046,.035,12); g.rotateX(Math.PI/2); return g;})();
  GX.stock=new THREE.BoxGeometry(.05,.58,.066); GX.prod=(()=>{const g=new THREE.TorusGeometry(.24,.017,5,16,2.0); g.rotateZ(Math.PI/2-1.0); g.translate(0,.16,0); return g;})();
  GX.cbBolt=new THREE.CylinderGeometry(.011,.011,.36,5); GX.cbTip=new THREE.ConeGeometry(.022,.07,5);
}
function buildGearX(u,G,acc,acc2,steel){
  if(u.T.crawler){ buildCrawler(u,G); return; }
  if(u.T.chaos){ buildChaosGear(u,G); return; }
  gxInit(); const team=u.team;
  switch(u.type){
    case 'wizard':{
      const w=grp(); const st=mesh(GX.staff,lamOf('#8a5426'),0,-.15,0); w.add(st);
      w.add(mesh(GX.orb,lamOf('#e2bdff',{emissive:'#7a33c2'}),0,.7,0));
      for(let k=0;k<3;k++){ const a=k*2.094, p=mesh(GX.prong,lamOf('#6b4320'),Math.cos(a)*.06,.62,Math.sin(a)*.06); p.rotation.z=-Math.cos(a)*.5; p.rotation.x=Math.sin(a)*.5; w.add(p); }
      G.w=w;
      const h=grp(), hc=lamOf(team?'#4b3f58':'#7c7f88');
      h.add(mesh(GX.hatBrim,hc,0,.1,-.01),mesh(GX.hatCone,hc,0,.28,-.02),mesh(GX.hatBand,acc,0,.13,-.01));
      const tip=mesh(GX.hatTip,hc,0,.5,-.08); tip.rotation.x=-.55; h.add(tip);
      const bd=mesh(GX.beard,lamOf('#f3f0e8'),0,-.09,.12); bd.scale.set(1,1.45,.72); h.add(bd,mesh(GX.beardTip,lamOf('#f3f0e8'),0,-.32,.11));
      G.h=h; break; }
    case 'cleric':{
      const robe=lamOf(team?'#3b1552':'#1d2f8c',{side:THREE.DoubleSide}), trim=team?lamOf('#c0405a'):lamOf('#e9b93a');
      const w=grp(); w.add(mesh(GX.cStaff,M.steel,0,-.15,0)); const ring=mesh(GX.hexRing,M.steel,0,.74,0); w.add(ring);
      w.add(mesh(GX.gem,lamOf('#9c63e6',{emissive:'#4a1a8a'}),0,.74,0));
      const cr=mesh(GX.crescent,M.steel,.05,.58,0); cr.rotation.z=-.15; w.add(cr); G.w=w;
      const h=grp(); h.add(mesh(GX.hood,robe,0,.02,-.015),mesh(GX.hoodRim,trim,0,.02,-.015)); G.h=h;
      const r=grp(); r.add(mesh(GX.robeTop,robe,0,.285,0),mesh(GX.collar,trim,0,.57,0));
      for(const sd of [-1,1]){ const tr=mesh(GX.trimTop,trim,sd*.045,.29,.17); tr.rotation.x=-.07; r.add(tr); } G.r=r;
      const k=grp(); k.add(mesh(GX.skirt,robe),mesh(GX.hem,trim,0,-.85,0));
      for(const sd of [-1,1]){ const tr=mesh(GX.trimSkirt,trim,sd*.05,-.42,.255); tr.rotation.x=.19; k.add(tr); } G.k=k;
      break; }
    case 'ninja':{
      const w=grp(); w.add(mesh(GX.nBlade,lamOf('#ece5cf')),mesh(GX.nGrip,lamOf('#231914'),0,-.03,0),mesh(GX.tsuba,acc,0,.09,0)); G.w=w;
      const h=grp(); h.add(new THREE.Mesh(GX.eyes,new THREE.MeshBasicMaterial({color:'#f6f3ea'})));
      for(const sd of [-1,1]){ const t1=mesh(GX.nTail,acc2,sd*.035,-.03,-.2); t1.rotation.x=1.0; t1.rotation.z=sd*.25; h.add(t1); }
      G.h=h;
      const b=grp(); const sc=mesh(GX.scab,lamOf('#1c1612'),0,0,-.02); sc.rotation.z=.75; b.add(sc); G.b=b; break; }
    case 'wing':{
      const mem=lamOf(team?'#7a4650':'#ad9560',{side:THREE.DoubleSide}), frame=lamOf('#3b2b1c');
      for(const [key,geo,fr] of [['wl1',GX.wIn,GX.frameIn],['wl2',GX.wOut,GX.frameOut],['wr1',GX.wIn,GX.frameIn],['wr2',GX.wOut,GX.frameOut]]){
        const g=grp(); g.add(mesh(geo,mem),mesh(fr,frame)); G[key]=g; }
      const b=grp(); b.add(mesh(GX.pack,lamOf('#5b452e'),0,.05,-.03),mesh(GX.packHub,lamOf('#8a6a3a'),0,.18,-.02));
      b.children[1].rotation.z=Math.PI/2;
      b.add(rodMesh(new V3(-.1,.18,0),new V3(-.14,.6,.07),.014,frame),rodMesh(new V3(-.2,.6,.07),new V3(-.08,.6,.07),.02,lamOf('#2a1f15'))); G.b=b;
      const h=grp(); h.add(mesh(GEO.band,acc,0,.07,0)); for(const sd of [-1,1]) h.add(mesh(GX.goggle,lamOf('#2f3a40'),sd*.075,.08,.17)); G.h=h;
      const w=grp(); w.add(mesh(GX.stock,lamOf('#6a4a2c'),0,.1,0),mesh(GX.prod,M.steel));
      const tipL=new V3(-.2,.29,0),tipR=new V3(.2,.29,0),nut=new V3(0,.12,0), sm=lamOf('#efe6d2');
      const c1=rodMesh(tipL,nut,.006,sm), c2=rodMesh(tipR,nut,.006,sm), rl=rodMesh(tipL,tipR,.006,sm);
      const bolt=mesh(GX.cbBolt,lamOf('#5c3d22'),0,.25,.045), bt=mesh(GX.cbTip,M.steel,0,.45,.045);
      w.add(c1,c2,rl,bolt,bt); w.userData={c1,c2,rl,bolt,bt}; G.w=w; u.cbLoaded=true;
      break; }
  }
  for(const k of ['r','k','wl1','wl2','wr1','wr2']) if(G[k]){ G[k].scale.setScalar(u.s); freezeGear(G[k]); }
}
const _gq=new V3(),_gs=new V3(),_gso=new V3(),_gm=new V3(),_ge=new V3(),_gch=new V3(),_gfl=new V3(),_gd=new V3();
function updateGearX(u){
  if(u.T.crawler) return;   // a Hellcrawler's model is posed when it's drawn (drawCrawler), and only if it's on screen
  if(u.T.chaos){ updateChaosGear(u); return; }
  const G=u.G, j=u.j, s=u.s; if(!G) return;
  _gfl.copy(u.fwdW).addScaledVector(u.spine,-u.fwdW.dot(u.spine)); if(_gfl.lengthSq()<1e-6) _gfl.copy(u.fwdW); _gfl.normalize();
  if(u.type==='cleric'){
    if(G.r) orient(G.r,j.pelvis,u.spine,_gfl);
    if(G.k){ const d=u.skD||(u.skD=new V3(0,1,0));
      if(u.alive){ _gd.set(0,1,0).addScaledVector(u.spine,.45).addScaledVector(u.av,-.05).normalize(); d.lerp(_gd,.15).normalize(); } else d.copy(u.spine);
      orient(G.k,j.pelvis,d,_gfl); }
  }
  if(u.type==='wing'){
    const W=G.w&&G.w.userData; if(W&&W.c1){ const L=!!u.cbLoaded; W.c1.visible=W.c2.visible=W.bolt.visible=W.bt.visible=L; W.rl.visible=!L; }
    const F=u.fl, A=F&&F.wing;
    let thL,thR,del,psi,tw;
    if(!u.alive||!A){ const fl2=Math.sin(game.time*17+u.id)*.15*(u.rag&&!u.rag.sleep?1:0); thL=-.45+fl2; thR=-.45-fl2; del=-.85; psi=.7; tw=0; }
    else { thL=A.thL; thR=A.thR; del=A.del; psi=A.psi; tw=A.tw; }
    _gm.copy(j.chest).addScaledVector(_gfl,-.17*s).addScaledVector(u.spine,.03*s);
    _gch.copy(_gfl).multiplyScalar(-Math.cos(tw)).addScaledVector(u.spine,Math.sin(tw));
    for(const sd of [-1,1]){
      const th=sd<0?thL:thR;
      _gs.copy(u.rightW).multiplyScalar(sd*Math.cos(th)).addScaledVector(u.spine,Math.sin(th));
      _gs.multiplyScalar(Math.cos(psi)).addScaledVector(_gfl,-Math.sin(psi)).normalize();
      _gq.copy(_gm).addScaledVector(u.rightW,sd*.1*s);
      orient(G[sd<0?'wl1':'wr1'],_gq,_gs,_gch);
      _ge.copy(_gq).addScaledVector(_gs,.84*s);
      const tho=th+del, pso=psi*1.35;
      _gso.copy(u.rightW).multiplyScalar(sd*Math.cos(tho)).addScaledVector(u.spine,Math.sin(tho));
      _gso.multiplyScalar(Math.cos(pso)).addScaledVector(_gfl,-Math.sin(pso)).normalize();
      orient(G[sd<0?'wl2':'wr2'],_ge,_gso,_gch);
    }
  }
}

/* ---------- flight (Wing Archer) ----------
   The archer hangs under two mechanical wings. Each wing beat pushes him up on the downstroke and lets him
   sink a little on the upstroke, so he bobs with every flap; the outer panel folds back on the way up.
   Forward speed adds lift, so at speed he beats slower and glides between flaps; hovering to shoot takes
   fast, deep beats. He banks into turns, pitches nose-down to speed up, and his legs swing under him. */
function initFly(u){ u.fl={air:false,mode:'ground',h:.885*u.s,vy:0,ph:Math.random()*TAU,fq:3,amp:.6,glide:0,pitch:0,bank:0,takeT:.45,fold:1,wing:null}; }
function flyInstant(u){ const F=u.fl; if(!F) return; F.air=true; F.mode='air'; F.h=CRUISE; F.vy=0; F.fold=0; F.takeT=0; }
function flyAltAt(u,c,k){ return (c&&c.alt&&k&&k.alt?k.alt:u.fl.h)-.885*u.s; }
function updateFly(u,dt){
  const F=u.fl, s=u.s, g=9.8, a=u.action;
  if(F.mode==='ground'){
    F.takeT-=dt; F.fold=Math.max(0,F.fold-dt*2.2);
    if(F.takeT<=0){ F.mode='air'; F.air=true; F.vy=4.6; F.h=.885*s; F.fq=3.6; F.amp=1.05; sfx('flap',u.pos,.9); }
  }
  if(F.air){
    F.fold=Math.max(0,F.fold-dt*2.2);   // finish spreading the wings (a launch from the aerie hatch takes off before they're open)
    const gy=H(u.pos.x,u.pos.z), ah=H(u.pos.x+u.av.x*.9,u.pos.z+u.av.z*.9);
    let hT=CRUISE+Math.max(0,ah-gy)*.8;
    let clipH=null, cw=0;
    if(a&&a.c.alt){ const k=evalClip(a.c,Math.min(a.t,a.c.dur)); cw=smooth(clamp(a.t/.15,0,1))*smooth(clamp((a.c.dur-a.t)/.3,0,1)); clipH=k.alt; hT=lerp(hT,k.alt,cw); }
    if(u.state==='stunned') hT=Math.max(1.6,hT-1);
    const acc=clamp(6.5*(hT-F.h)-3.4*F.vy,-10,13);
    const spd=u.spd, Ls=clamp(spd/4,0,1)*.7*g;            // lift from forward speed
    const need=Math.max(0,g+acc-Ls), dem=need/g, aiming=!!(a&&a.c.aim);
    // flap-glide: at speed he locks the wings out and glides, sinks a little, then beats back up (hysteresis, like a big bird)
    F.glT=(F.glT||0)+dt;
    if(!F.gl&&F.glT>2.2/F.fq&&dem<.45&&spd>2.2&&!aiming&&Math.abs(Math.cos(F.ph))<.25&&Math.sin(F.ph)>0){ F.gl=true; F.glT=0; }   // after a few beats, from mid-downstroke, wings level
    else if(F.gl&&((F.glT>.55&&dem>.7)||dem>1.2||spd<1.6||aiming)){ F.gl=false; F.glT=0; }
    F.glide+=((F.gl?1:0)-F.glide)*(1-Math.exp(-dt*(F.gl?4:6)));
    F.fq+=((1.7+1.35*Math.min(dem,1.8))-F.fq)*(1-Math.exp(-dt*3));
    F.amp+=((.3+.44*Math.min(dem,1.45))*(1-F.glide*.88)-F.amp)*(1-Math.exp(-dt*4));
    const prev=Math.sin(F.ph); F.ph+=TAU*F.fq*dt*(1-F.glide*.94); const st=Math.sin(F.ph);
    // flapping: the downstroke lifts and the upstroke lets him sink, so he bobs every beat. Gliding: only the
    // spread wings' lift from airspeed, so he slowly sinks (the wings act as a brake on the way down)
    const lift=lerp(Ls+need*(1+1.45*st),Ls*1.3+need*.08,F.glide);
    F.vy+=(lift-g)*dt; F.vy*=Math.exp(-dt*(.7+2.2*F.glide)); F.h+=F.vy*dt;
    // a dive, swoop or finisher is flown on purpose: steer firmly onto the clip's height (the beat still bobs him)
    if(clipH!==null&&cw>0){ const k2=(1-Math.exp(-dt*(u.fin?14:8)))*cw, dh=(clipH-F.h)*k2; F.h+=dh; F.vy=lerp(F.vy,dh/dt,.5*cw); }
    const floor=.885*s*.92; if(F.h<floor){ F.h=floor; if(F.vy<0) F.vy=0; }
    if(prev<=0&&st>0&&F.glide<.5) sfx('flap',u.j.chest,.25+.45*F.amp);
    // attitude: nose down to fly fast, upright to hover and shoot, banked into turns
    const pT=clamp(.04+spd*.1+(u.accF||0)*.035,-.25,.75)*(a&&a.c.aim?.35:1), bT=clamp(-(u.turnV||0)*Math.max(spd,1)*.08,-.75,.75);
    F.pitch+=(pT-F.pitch)*(1-Math.exp(-dt*2.5)); F.bank+=(bT-F.bank)*(1-Math.exp(-dt*2.5));
    // hovering drift: never perfectly still in the air
    if(!a&&spd<.5){ const t=game.time*.6+u.id; u.pos.x+=Math.cos(t)*.25*dt; u.pos.z+=Math.sin(t*1.3)*.25*dt; }
    // a finisher bolt fired into the body once it falls
    if(u.boltNext&&u.fin&&(u.fin.rag2||u.fin.rag)){ const rg=u.fin.rag2||u.fin.rag; u.boltNext=false; fireArrow(u,rg.p[3].clone(),0,{rag:rg},{from:crossbowTip(u,new V3())}); sfx('crossbow',u.j.hR,.9); }
  }
  // wing angles for this frame
  const c=Math.cos(F.ph), sn=Math.sin(F.ph), op=1-F.glide;
  let th=.2+F.amp*c*op+F.glide*.12, del=(-.6*Math.max(0,-sn)*Math.min(1.3,F.amp*1.4)+.22*F.amp*Math.cos(F.ph-.6))*op+F.glide*.06;
  let psi=.1+.22*Math.max(0,-sn)*op+F.glide*.05+F.pitch*.1, tw=.25*sn*op;
  if(!F.air||F.fold>0){ const f=F.air?F.fold:Math.max(F.fold,.0); th=lerp(th,1.15,f); del=lerp(del,-1.95,f); psi=lerp(psi,1.25,f); tw*=1-f; }
  F.wing={thL:th+F.bank*.3,thR:th-F.bank*.3,del,psi,tw};
}
function flyPose(u,p){
  const F=u.fl, s=u.s;
  if(F.mode==='ground'){ p.crouch=Math.max(p.crouch,.3*clamp(1-F.takeT/.45,0,1)); return; }
  p.jump=(F.h-.885*s)/s+(p.jump||0);
  p.lean+=F.pitch+.045*Math.sin(F.ph+.4)*(1-F.glide)*Math.min(1,F.amp*1.5); p.side+=F.bank*.55;   // each beat rocks the body a little
}
const _fa1=new V3(),_fa2=new V3();
function flyArms(u,p,dt){
  const a=u.action; if(!a||!a.c.aim) return;
  const t=u.fin?u.fin.victim:u.atkTarget; if(!t) return;
  const j=u.j, s=u.s, w=smooth(clamp(a.t/.2,0,1))*smooth(clamp((a.c.dur-a.t)/.35,0,1));
  if(t.isUnit) _fa1.copy(t.alive?t.j.chest:(t.rag?t.rag.p[1]:t.pos)); else _fa1.set(t.pos.x,t.pos.y+3.5,t.pos.z);
  _fa2.subVectors(_fa1,j.sR).normalize();
  _fa1.copy(j.sR).addScaledVector(_fa2,.5*s).addScaledVector(u.rightW,-.04*s);
  u.hand.R.lerp(_fa1,w); u.wRw.lerp(_fa2,w).normalize();
}
function flyFeet(u,dt){
  const s=u.s, P=u.j.pelvis, f=u.fwdW, r=u.rightW;
  for(let i=0;i<2;i++){ const ft=u.feet[i], sd=i?1:-1; if(!ft.v) ft.v=new V3();
    _tmp.copy(P).addScaledVector(r,sd*.1*s).addScaledVector(f,.05*s).addScaledVector(u.av,-.09); _tmp.y=P.y-.9*s+Math.sin(game.time*2.1+i*1.7+u.id)*.03*s;
    ft.v.addScaledVector(_tmp2.subVectors(_tmp,ft.pos),55*dt).multiplyScalar(Math.exp(-dt*7.5));
    ft.pos.addScaledVector(ft.v,dt); ft.t=-1; ft.air=true; }
}
function crossbowTip(u,out){ return out.copy(u.j.hR).addScaledVector(u.wRw,.42*u.s); }

/* ---------- status effects: poison, burning, Shinobi cloak ---------- */
function applyPoison(t,src,dps,dur){ if(!t||!t.alive||t.statue||!t.isUnit) return; const S=t.st||(t.st={}); const o=S.poison;
  S.poison={t:Math.max(dur,o?o.t:0),dps:Math.max(dps,o?o.dps:0),src,acc:o?o.acc:0}; }
function applyBurn(t,src,dps,dur){ if(!t||!t.alive||t.statue||!t.isUnit) return; const S=t.st||(t.st={}); const o=S.burn;
  S.burn={t:Math.max(dur,o?o.t:0),dps:Math.max(dps,o?o.dps:0),src,acc:o?o.acc:0}; }
function updateStatus(u,dt){
  const S=u.st;
  for(const k of ['poison','burn']){ const e=S[k]; if(!e) continue; e.t-=dt; if(e.t<=0){ S[k]=null; continue; }
    e.acc+=e.dps*dt; if(e.acc>=2){ const a=e.acc; e.acc=0; damage(u,a,e.src&&e.src.alive?e.src:u,UP,.01,0,true); if(!u.alive) return; }
    if(Math.random()<dt*(k==='poison'?4:16)){ const J=[u.j.chest,u.j.head,u.j.pelvis,u.j.hR,u.j.hL][Math.floor(Math.random()*5)];
      if(k==='poison') puff(J,1,.1*u.s,.7,'#6fd25a'); else emitFire(J,2,.11*u.s,0,.9,0,.35,.55); } }
  if(S.healF>0) S.healF-=dt;
  if(S.rend){ S.rend.t-=dt; if(S.rend.t<=0) S.rend=null; }   // Soul Rend wears off
  if(u.cloak){ u.cloak.t-=dt; if(Math.random()<dt*3) puff(u.j.chest,1,.12*u.s,.3,'#3a3550'); if(u.cloak.t<=0) endCloak(u); }
}
function setGearVis(u,on){ const G=u.G; if(!G) return; for(const k in G) if(G[k]&&G[k].isObject3D&&!G[k].dropped) G[k].visible=on; }
function startCloak(u){ u.cloak={t:8,hits:0}; (u.st||(u.st={})); setGearVis(u,false); puff(u.j.chest,6,.25*u.s,1.6,'#2a2638'); sfx('cloak',u.pos,1);
  for(const o of units) if(o.alive&&o.team!==u.team&&o.target===u&&Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z)>1.8) o.target=null; }
function endCloak(u){ if(!u.cloak) return; u.cloak=null; setGearVis(u,true); puff(u.j.chest,4,.2*u.s,1.2,'#2a2638'); }

/* ---------- spells ---------- */
const orbs=[], flashes=[], walls=[], clouds=[], zaps=[], beams=[];
const glowMat=new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false});
const glowIM=new THREE.InstancedMesh(new THREE.SphereGeometry(1,12,8),glowMat,900);
const boltIM=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,5,1,true),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}),2400);
const ghostMat=new THREE.MeshPhongMaterial({color:'#ffffff',specular:'#4a4540',shininess:38,transparent:true,opacity:.2,depthWrite:false});
const GHOST={limb:new THREE.InstancedMesh(limbIM.geometry,ghostMat,600),torso:new THREE.InstancedMesh(torsoIM.geometry,ghostMat,150),sph:new THREE.InstancedMesh(sphIM.geometry,ghostMat,150),joint:new THREE.InstancedMesh(jointIM.geometry,ghostMat,900)};
for(const im of [glowIM,boltIM,GHOST.limb,GHOST.torso,GHOST.sph,GHOST.joint]){ im.userData.cap=im.count; for(let i=0;i<im.count;i++) im.setColorAt(i,WHITE);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled=false; scene.add(im); CNT.set(im,0); }
glowIM.renderOrder=4; boltIM.renderOrder=4;
const SC={}; const scol=c=>SC[c]||(SC[c]=new THREE.Color(c));
function glowAt(p,r,c){ _s.set(r,r,r); _m.compose(p,_qi,_s); put(glowIM,scol(c)); }
function staffTip(u,out){ return out.copy(u.j.hR).addScaledVector(u.wRw,.7*u.s); }
function puffDir(p,dir,n,speed,spread,col,size,life){
  if(isFireCol(col)){ for(let k=0;k<n;k++){ const s=speed*rand(.6,1.1); emitFire(p,2,size*1.4,dir.x*s,dir.y*s,dir.z*s,spread*.8,(life||1)*.75); } return; }
  for(let k=0;k<n;k++){ if(puffs.length>=MAXPUFF) puffs.shift();
  const v=dir.clone().multiplyScalar(speed*rand(.6,1.1)).add(new V3(rand(-1,1),rand(-.3,1),rand(-1,1)).multiplyScalar(spread));
  puffs.push({p:p.clone(),c:scol(col).clone(),v,age:0,life:(life||1)*rand(.8,1.3),size:size*rand(.7,1.2)}); } }
function aimPoint(t,out){ if(!t) return null; if(t.isStatue) return out.set(t.pos.x,t.pos.y+3,t.pos.z); if(t.alive) return out.copy(t.j.chest); return t.rag?out.copy(t.rag.p[1]):out.copy(t.pos); }
// Arcane Blast: an orb flies from the staff and bursts at the target
function castBlast(u,e){
  const t=u.atkTarget; const P=aimPoint(t,new V3()); if(!P) return;
  const o=e.from==='hL'?u.j.hL.clone().addScaledVector(u.fwdW,.1*u.s):staffTip(u,new V3());
  const dmg=u.T.dmg*(e.dmg||1);
  if(e.meteor){ const m=new V3(P.x-u.fwdW.x*3,P.y+9,P.z-u.fwdW.z*3); orbs.push({p:m,v:new V3().subVectors(P,m).normalize().multiplyScalar(19),t,team:u.team,src:u,dmg,big:1,age:0,col:'#ff9d4a'}); sfx('orbWhoosh',P,.9); }
  else orbs.push({p:o,v:new V3().subVectors(P,o).normalize().multiplyScalar(e.quick?26:20),t,team:u.team,src:u,dmg,age:0,col:'#d79bff'});
  sfx('orbWhoosh',o,.7);
}
function explode(p,team,dmg,src,big){
  const R=1.9*(big?1.3:1);
  for(const o of units){ if(!o.alive||o.team===team) continue; const d=o.j.chest.distanceTo(p); if(d>R+.25*o.s) continue;
    const f=clamp(1-d/(R+.3),0,1), dir=new V3(o.pos.x-p.x,0,o.pos.z-p.z); if(dir.lengthSq()<1e-6) dir.set(rand(-1,1),0,rand(-1,1)); dir.normalize();
    damage(o,dmg*(.45+.55*f),src,dir,1+2.4*f,1.5*f,false,o.j.chest.clone()); applyBurn(o,src,6,3); }
  const st=statues[1-team]; if(st&&st.hp>0&&Math.hypot(st.pos.x-p.x,st.pos.z-p.z)<3.2) hitStatue(st,dmg*.5);
  blastFx(p,big?1.3:1,'#ffb35c');
}
function blastFx(p,k,col){
  puffDir(p,UP,10*k,2.2,2.2,'#ffb347',.32*k,.8); puffDir(p,UP,6*k,1.6,1.8,'#ff6a2a',.28*k,.7); puffDir(p,UP,5*k,1,1.4,'#b07ad8',.3*k,.9); puff(p,4,.35*k,1.2,'#3d3128');
  flashes.push({p:p.clone(),r0:.3,r1:2.2*k,t:0,life:.32,col:col||'#ffb35c'}); ring(p,1.6*k,'#ffd59a'); shakeAt(p,.25*k); sfx('blast',p,.9+.2*k);
}
function zapFx(a,b,col,life){ zaps.push({a:a.clone(),b:b.clone(),t:0,life:life||.25,col:col||'#bfe8ff',w:.03}); }
function skyStrike(p,col,dmgFn){ const top=new V3(p.x+rand(-1.5,1.5),p.y+15,p.z+rand(-1.5,1.5)); zaps.push({a:top,b:p.clone(),t:0,life:.4,col:col||'#cfeeff',w:.07,seg:16});
  flashes.push({p:p.clone(),r0:.4,r1:1.8,t:0,life:.3,col:col||'#cfeeff'}); puffDir(p,UP,8,2,1.6,'#e9f6ff',.25,.6); ring(p,1.2,col||'#dff4ff'); shakeAt(p,.3); sfx('thunder',p,1); }
function castLightning(u,e){ const t=u.atkTarget; if(!t||(t.isUnit&&!t.alive)) return; const P=aimPoint(t,new V3());
  skyStrike(P);
  if(t.isStatue){ hitStatue(t,u.T.dmg*(e.dmg||1)*.6); return; }
  damage(t,u.T.dmg*(e.dmg||1),u,new V3(t.pos.x-u.pos.x,0,t.pos.z-u.pos.z).normalize(),1.4,1,false,P);
  if(t.alive&&!t.action){ play(t,'flinch'); t.fwdScale=1; }
  for(const o of units) if(o.alive&&o!==t&&o.team!==u.team&&o.j.chest.distanceTo(P)<1.1) damage(o,u.T.dmg*.35,u,null,.8);
}
// Electric Wall: a fence of lightning across the enemy's path
function castWall(u,e){
  const t=u.atkTarget; let dir=new V3(u.fwdW.x,0,u.fwdW.z).normalize(), dist=3.5;
  if(t&&t.pos){ dir.set(t.pos.x-u.pos.x,0,t.pos.z-u.pos.z); const d=dir.length(); if(d>.1) dir.multiplyScalar(1/d); dist=clamp(d*.55,2.2,5); }
  const c=new V3(u.pos.x+dir.x*dist,0,u.pos.z+dir.z*dist), side=new V3(dir.z,0,-dir.x);
  const a=c.clone().addScaledVector(side,-2.6), b=c.clone().addScaledVector(side,2.6); a.y=H(a.x,a.z); b.y=H(b.x,b.z);
  walls.push({a,b,t:6,team:u.team,src:u,dps:u.T.dmg*.9,zt:0,arcs:[],hitT:0}); puffDir(c,UP,8,1.5,1.5,'#cfeeff',.2,.6); sfx('zap',c,1); zapFx(staffTip(u,new V3()),c.clone().setY(c.y+1),'#bfe8ff',.25);
}
function wallArcs(W){ W.arcs.length=0; for(const h of [.35,1.25,2.2]){ const pts=[], n=10;
  for(let i=0;i<=n;i++){ const f=i/n, p=W.a.clone().lerp(W.b,f); p.y=lerp(W.a.y,W.b.y,f)+h+(i>0&&i<n?rand(-.22,.22):0); if(i>0&&i<n){ p.x+=rand(-.12,.12); p.z+=rand(-.12,.12); } pts.push(p); } W.arcs.push(pts); } }
// Poison Spray: a cone of green mist, and a cloud that lingers where it settles
function castPoison(u,e){
  const t=u.atkTarget, o=staffTip(u,new V3()); let dir=new V3(u.fwdW.x,0,u.fwdW.z).normalize();
  if(t&&t.pos){ dir.set(t.pos.x-u.pos.x,0,t.pos.z-u.pos.z).normalize(); }
  const fin=!!u.fin;
  for(const v of units){ if(!v.alive||v.team===u.team) continue; const dx=v.pos.x-u.pos.x,dz=v.pos.z-u.pos.z,d=Math.hypot(dx,dz); if(d>7||d<.01) continue;
    if((dx*dir.x+dz*dir.z)/d<.78) continue; applyPoison(v,u,u.T.dmg*.32,6); if(!fin) damage(v,u.T.dmg*.15,u,null,.3); }
  puffDir(o,dir.clone().setY(-.05),26,6,1.2,'#7ddf5c',.28,1.2); puffDir(o,dir,10,4.5,1,'#3d9e3a',.35,1.4);
  const c=new V3(u.pos.x+dir.x*4,0,u.pos.z+dir.z*4); c.y=H(c.x,c.z)+.8;
  clouds.push({p:c,r:2.2,t:4.5,team:u.team,src:u,dps:u.T.dmg*.32,tk:0}); sfx('poison',o,1);
}
function poisonFx(p){ puffDir(p,UP,10,.8,1.2,'#7ddf5c',.3,1.4); puffDir(p,UP,5,.6,1,'#3d9e3a',.35,1.6); sfx('poison',p,.8); }
// Cleric
function healUnit(u,t,amt){ if(!t||!t.alive) return; t.hp=Math.min(t.maxHp,t.hp+amt); const S=t.st||(t.st={}); S.healF=.35; t.morale=Math.min(100,(t.morale||100)+6);
  puffDir(t.j.chest,UP,7,1,.6,'#f6e98a',.12,.9); puffDir(t.j.chest,UP,4,1.2,.5,'#b8f29a',.1,.8); flashes.push({p:t.j.chest.clone(),r0:.2,r1:.7,t:0,life:.4,col:'#fff1a0'}); }
function castHeal(u,e){ const t=u.healT&&u.healT.alive?u.healT:(u.atkTarget&&u.atkTarget.alive?u.atkTarget:u);
  healUnit(t,t,u.T.heal*(e.amt||1)); if(t!==u) beams.push({u,t,life:.55,age:0,col:'#fff1a0'}); sfx('heal',t.pos,1);
  if(e.aura) for(const o of units) if(o.alive&&o.team===u.team&&o!==t&&o.isUnit&&o.pos.distanceTo(u.pos)<3) healUnit(o,o,u.T.heal*.45); }
function castMassHeal(u){ ring(u.pos,4.5,'#ffe58a'); flashes.push({p:u.j.chest.clone(),r0:.4,r1:2.3,t:0,life:.5,col:'#fff1a0'}); sfx('heal',u.pos,1.2);
  for(const o of units) if(o.alive&&o.team===u.team&&o.isUnit&&Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z)<4.5){ healUnit(o,o,u.T.heal*.75); if(o.st){ o.st.poison=null; o.st.burn=null; } } }
function castCure(u){ const t=u.healT&&u.healT.alive?u.healT:(u.atkTarget&&u.atkTarget.alive?u.atkTarget:u); const S=t.st||(t.st={}); S.poison=null; S.burn=null;
  puffDir(t.j.chest,UP,10,1.2,.7,'#d6b4ff',.12,1); flashes.push({p:t.j.chest.clone(),r0:.2,r1:.8,t:0,life:.45,col:'#d9b6ff'}); if(t!==u) beams.push({u,t,life:.5,age:0,col:'#d9b6ff'}); sfx('cure',t.pos,1); }
function castFlash(u){ const P=staffTip(u,new V3()); flashes.push({p:P,r0:.3,r1:2.5,t:0,life:.3,col:'#ffffff'}); sfx('flash',P,1);
  for(const o of units){ if(!o.alive||o.team===u.team||isAir(o)) continue; if(Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z)>3) continue;
    damage(o,u.T.dmg*.25,u,null,.6); if(o.alive&&!o.fin&&o.state!=='stunned'){ play(o,'flinch'); o.fwdScale=1; o.cdT=Math.max(o.cdT,.9); } } }
function holyFx(p){ flashes.push({p:p.clone(),r0:.25,r1:1.2,t:0,life:.4,col:'#fff0a0'}); puffDir(p,UP,8,1.4,.8,'#ffe98a',.13,.9); sfx('smite',p,.9); }
function pillarFx(p,col){ const gold=col==='gold'; for(let i=0;i<5;i++){ const q=p.clone(); q.y=H(p.x,p.z)+i*.6; puffDir(q,UP,4,3.5,.5,gold?'#ffe98a':(i%2?'#ffb347':'#ff6a2a'),.32,.9); }
  flashes.push({p:p.clone(),r0:.4,r1:1.6,t:0,life:.5,col:gold?'#fff1a0':'#ffb35c'}); shakeAt(p,.25); sfx(gold?'smite':'blast',p,1); }

/* ---------- crossbow bolts ---------- */
const BOLT_COL=[new THREE.Color('#5a3a1e'),new THREE.Color('#3a1d26')];
function fireBolts(u,e){
  const t=u.atkTarget; if(!t) return; const P=aimPoint(t,new V3()); if(!P) return;
  if(t.isUnit&&t.alive) P.addScaledVector(t.av,clamp(u.pos.distanceTo(t.pos)/36,0,.5));
  if(e.spread) P.add(new V3(rand(-1,1),rand(-.3,.3),rand(-1,1)).multiplyScalar(e.spread*u.pos.distanceTo(t.pos)));
  const o=crossbowTip(u,new V3()), G=6, dist=o.distanceTo(P), T=clamp(dist/(e.power?44:36),.05,.6);
  const v=new V3().subVectors(P,o).multiplyScalar(1/T); v.y+=.5*G*T;
  arrows.push({mode:'fly',p:o,v,dir:v.clone().normalize(),s:u.s*.72,col:BOLT_COL[u.team],team:u.team,dmg:u.T.dmg*(e.dmg||1),src:u,age:0,G,power:!!e.power,bolt:true,fire:!!(e.burn||u.boltFire)}); onArrow(u);
  u.cbLoaded=false; u.boltFire=false;
  u.vel.addScaledVector(u.fwdW,-.7); if(u.fl) u.fl.vy+=.35;
  sfx('crossbow',o,.9);
}

/* ---------- event hooks ---------- */
const _sfp=new V3();
function spellFx(u,e,v){
  if(e.bolt){ u.boltNext=true; sfx('crossbow',u.j.hR,.9); }
  if(!e.fx) return;
  const P=v&&v.alive?hitPoint(u,v,e):(u.fin&&(u.fin.rag2||u.fin.rag)?(u.fin.rag2||u.fin.rag).p[1].clone():staffTip(u,new V3()).addScaledVector(u.fwdW,.6));
  switch(e.fx){
    case 'zap': zapFx(u.T.staff?staffTip(u,_sfp):u.j.hL,P); flashes.push({p:P.clone(),r0:.15,r1:.6,t:0,life:.2,col:'#cfeeff'}); sfx('zap',P,.9); break;
    case 'blast': blastFx(P,.8); break;
    case 'sky': skyStrike(P,e.col==='gold'?'#ffe98a':null); break;
    case 'push': { const c=u.pos.clone().addScaledVector(u.fwdW,1.1*u.s); c.y=H(c.x,c.z); ring(c,2.2,'#e6dcff'); puffDir(c,u.fwdW,10,4,1.2,'#e8e2d4',.3,.6); sfx('heavy',c,.9); shakeAt(c,.2); break; }
    case 'poison': poisonFx(P); break;
    case 'pillar': pillarFx(P,e.col); break;
    case 'holy': holyFx(P); break;
    case 'flash': flashes.push({p:u.j.hR.clone(),r0:.2,r1:1.4,t:0,life:.18,col:'#ffffff'}); sfx('flash',u.pos,.8); break;
    default: if(FX_X[e.fx]) FX_X[e.fx](u,e,v,P);
  }
}
const EXTRA_EV={
  charge:(u)=>{ u.orbGlow=1; sfx('cast',u.j.hR,.6); },
  spark:(u)=>{ flashes.push({p:u.j.hL.clone(),r0:.05,r1:.25,t:0,life:.3,col:'#d9b3ff'}); puff(u.j.hL,1,.06,.6,'#d9b3ff'); },
  blast:castBlast, lightning:castLightning, ewall:castWall, poison:castPoison,
  heal:castHeal, massheal:castMassHeal, cure:castCure, flash:castFlash,
  cloak:(u)=>startCloak(u),
  reload:(u)=>{ u.cbLoaded=true; sfx('reload',u.j.hR,.7); },
  ignite:(u)=>{ u.boltFire=true; puff(crossbowTip(u,new V3()),2,.08,.8,'#ffb347'); },
  zapRag:(u,e,fin)=>{ const rg=fin&&(fin.rag||fin.rag2); if(!rg) return; zapFx(u.T.staff?staffTip(u,_sfp):u.j.hL,rg.p[1]); for(const v of rg.v) v.add(new V3(rand(-1,1),rand(0,1.5),rand(-1,1))); wakeRag(rg); sfx('zap',rg.p[1],1); },
  fx:()=>{},
};

/* ---------- per-frame spell simulation ---------- */
function updateSpells(dt){
  for(let i=orbs.length-1;i>=0;i--){ const O=orbs[i]; O.age+=dt;
    if(O.t&&!O.big){ const P=aimPoint(O.t,_tmp); if(P&&(O.t.alive||O.t.isStatue)){ const sp=O.v.length(); _tmp2.subVectors(P,O.p).normalize().multiplyScalar(sp); O.v.lerp(_tmp2,Math.min(1,dt*6)); } }
    O.p.addScaledVector(O.v,dt); if(Math.random()<dt*30) puff(O.p,1,.08,.3,O.col);
    let hit=O.age>(RL.on?4.2:2.2)||O.p.y<H(O.p.x,O.p.z)+.1;
    if(!hit) for(const o of units){ if(!o.alive||o.team===O.team) continue; if(o.j.chest.distanceTo(O.p)<.45*o.s){ hit=true; break; } }
    if(!hit&&O.t&&O.t.isStatue&&Math.hypot(O.t.pos.x-O.p.x,O.t.pos.z-O.p.z)<1.4) hit=true;
    if(hit){ explode(O.p,O.team,O.dmg,O.src,O.big); orbs.splice(i,1); } }
  for(let i=flashes.length-1;i>=0;i--){ const f=flashes[i]; f.t+=dt; if(f.t>=f.life) flashes.splice(i,1); }
  for(let i=zaps.length-1;i>=0;i--){ const z=zaps[i]; z.t+=dt; if(z.t>=z.life) zaps.splice(i,1); }
  for(let i=beams.length-1;i>=0;i--){ const b=beams[i]; b.age+=dt; if(b.age>=b.life||!b.u.alive) beams.splice(i,1); }
  for(let i=walls.length-1;i>=0;i--){ const W=walls[i]; W.t-=dt; W.zt-=dt; if(W.zt<=0){ W.zt=.06; wallArcs(W); }
    W.hitT-=dt; const tick=W.hitT<=0; if(tick) W.hitT=.25;
    for(const o of units){ if(!o.alive||o.team===W.team) continue; if(isAir(o)&&o.fl.h>2.8) continue;
      const d=distSeg(_tmp3.set(o.pos.x,W.a.y,o.pos.z),W.a,W.b); if(d>.55*o.s+.2) continue;
      o.vel.multiplyScalar(.25);
      if(tick){ damage(o,W.dps*.25,W.src,null,.5); if(o.alive&&!o.action&&Math.random()<.4){ play(o,'flinch'); o.fwdScale=1; }
        zapFx(o.j.chest,o.j.pelvis.clone().add(new V3(rand(-.3,.3),rand(0,.5),rand(-.3,.3))),'#bfe8ff',.12); if(Math.random()<.5) sfx('zap',o.pos,.6); } }
    if(W.t<=0) walls.splice(i,1); }
  for(let i=clouds.length-1;i>=0;i--){ const C=clouds[i]; C.t-=dt; C.tk-=dt;
    if(Math.random()<dt*9){ const q=C.p.clone().add(new V3(rand(-1,1)*C.r,rand(-.5,.6),rand(-1,1)*C.r)); puffDir(q,UP,1,.3,.3,Math.random()<.5?'#7ddf5c':'#4fae45',.35,1.4); }
    if(C.tk<=0){ C.tk=.4; for(const o of units) if(o.alive&&o.team!==C.team&&(!isAir(o)||o.fl.h<2.6)&&Math.hypot(o.pos.x-C.p.x,o.pos.z-C.p.z)<C.r) applyPoison(o,C.src,C.dps,4); }
    if(C.t<=0) clouds.splice(i,1); }
}
/* ---------- drawing ---------- */
const _dp=new V3(),_dq=new V3();
function drawSpells(){
  for(const O of orbs){ glowAt(O.p,O.big?.32:.2,O.col); glowAt(O.p,O.big?.55:.34,'#5a2a7a'); }
  for(const f of flashes){ const k=f.t/f.life, r=lerp(f.r0,f.r1,EASE.o(k)); _s.setScalar(r); _m.compose(f.p,_qi,_s); _pc.copy(scol(f.col)).multiplyScalar(.55*Math.pow(1-k,1.6)); put(glowIM,_pc); }   // additive: keep it soft so it reads as light, not a ball
  for(const z of zaps){ const n=z.seg||8, k=1-z.t/z.life; _pc.copy(scol(z.col)).multiplyScalar(.4+.6*k); let prev=z.a;
    for(let i=1;i<=n;i++){ const f=i/n, q=_dq.copy(z.a).lerp(z.b,f); if(i<n){ const j=z.a.distanceTo(z.b)*.06; q.x+=rand(-j,j); q.y+=rand(-j,j); q.z+=rand(-j,j); }
      cyl(prev,q,z.w*(.6+.4*k),_pc,boltIM); prev=q.clone(); }
    glowAt(z.b,.25*k+.1,z.col); }
  for(const b of beams){ const k=1-b.age/b.life, a=b.u.T.staff?staffTip(b.u,_dp):b.u.j.hL; _pc.copy(scol(b.col)).multiplyScalar(k); cyl(a,b.t.j.chest,.035*k+.01,_pc,boltIM); glowAt(b.t.j.chest,.3*k,b.col); }
  for(const W of walls){ const fade=Math.min(1,W.t/.5); _pc.copy(scol('#bfe8ff')).multiplyScalar(fade);
    for(const end of [W.a,W.b]) for(const h of [.35,1.25,2.2]){ _dp.copy(end); _dp.y+=h; glowAt(_dp,.13,'#cfeeff'); }
    for(const pts of W.arcs) for(let i=1;i<pts.length;i++) cyl(pts[i-1],pts[i],.028,_pc,boltIM);
    _dp.copy(W.a); cyl(_dp,_dq.copy(W.a).setY(W.a.y+2.4),.04,_pc,boltIM); cyl(W.b,_dq.copy(W.b).setY(W.b.y+2.4),.04,_pc,boltIM); }
  for(const a of arrows) if(a.fire&&a.mode==='fly'){ glowAt(a.p,.14,'#ffb347'); if(Math.random()<.3) puff(a.p,1,.06,.3,'#ff8a2a'); }
  for(const u of units){ if(!u.alive||!u.T.staff||u.cloak) continue; staffTip(u,_dp); u.orbGlow=Math.max(0,(u.orbGlow||0)-.02);
    const pul=.5+.5*Math.sin(game.time*4+u.id); glowAt(_dp,(.11+.03*pul+.12*u.orbGlow)*u.s,u.type==='wizard'?'#9a55d8':'#7a4fd0'); }
  for(const u of units) if(u.alive&&u.boltFire&&u.G&&u.G.w) glowAt(crossbowTip(u,_dp),.12+.04*Math.random(),'#ffb347');
}
function drawUnit(u){
  if(u.T.crawler){ if(crForce) crPrep(u); if(u.crVis) drawCrawlerFx(u); return; }   // a Hellcrawler is all model (posed in crPrep before the gear is batched)
  let col=u.col; const S=u.st;
  if(S&&u.alive){ const tc=u.tc||(u.tc=new THREE.Color());
    if(S.poison){ tc.copy(u.col).lerp(scol('#57c447'),.35+.15*Math.sin(game.time*7+u.id)); col=tc; }
    else if(S.burn){ tc.copy(u.col).lerp(scol('#ff6a1a'),.3+.2*Math.sin(game.time*19+u.id)); col=tc; }
    else if(S.rend){ tc.copy(u.col).lerp(scol('#8a4ad8'),.3+.15*Math.sin(game.time*5+u.id)); col=tc; }
    if(S.healF>0){ tc.copy(col).lerp(scol('#fff3a8'),Math.min(1,S.healF*2)); col=tc; } }
  drawFigure(u.j,u.s,col,u.thick,u.fwdW,u.cloak&&u.alive?GHOST:null,!!u.T.robe,!!u.T.skel);
  if(u.T.plateLimbs) drawPlateLimbs(u);
}

/* ---------- brains ---------- */
const pickOf=L=>L[Math.floor(Math.random()*L.length)];
function enemiesNear(team,x,z,r){ let n=0; gridEach(x,z,r,o=>{ if(o.alive&&o.team!==team&&Math.hypot(o.pos.x-x,o.pos.z-z)<r) n++; }); return n; }
TYPES.wizard.pick=(u,t)=>{
  const d=t?Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z):99, now=game.time;
  if(t&&t.isUnit&&d<2.1&&!isAir(t)) return pickOf(['staffBonk','staffJab','forcePush']);
  if(!t||!t.isUnit) return pickOf(['blast','meteor','twinBlast']);
  if(game.mode==='battle'){
    if(hasRes(u.team,'ewall')&&(u.cdWall||0)<now&&d>3&&d<8.5&&!isAir(t)&&enemiesNear(u.team,t.pos.x,t.pos.z,3.5)>=3){ u.cdWall=now+14; return 'ewall'; }
    if(hasRes(u.team,'poison')&&(u.cdPoison||0)<now&&d<6.5&&enemiesNear(u.team,t.pos.x,t.pos.z,2.6)>=3){ u.cdPoison=now+12; return 'poisonSpray'; }
    if((u.cdBolt||0)<now&&Math.random()<.25){ u.cdBolt=now+7; return 'lightning'; }
  }
  return pickOf(['blast','blast','quickBlast','twinBlast','meteor','palmBlast']);
};
TYPES.cleric.pick=()=>pickOf(['staffJab','staffSwing','holyPush','lowSweep','smite','flash']);
TYPES.ninja.pick=(u)=>{ let n,g=0; const L=ATTACKS_X.ninja.filter(x=>x!=='shinobi'); do{ n=pickOf(L); }while(n===u.lastAtk&&++g<5); return n; };
TYPES.wing.pick=(u,t)=>{ if(t&&t.isUnit&&!isAir(t)&&Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z)<2.6&&Math.random()<.55) return 'swoopKick';
  const L=['aimedBolt','aimedBolt','snapBolt','diveBolt','doubleBolt','blazingBolt','strafeBolt','highBolt','hoverVolley','pierceBolt'];
  return pickOf(hasRes(u.team,'blazing')?L:L.filter(n=>n!=='blazingBolt')); };
// Cleric: heals the most hurt ally in reach (cures poison first), keeps out of the fight, follows a charging army
function findPatient(u,R){ let best=null,bs=0;
  gridEach(u.pos.x,u.pos.z,R,o=>{ if(!o.alive||o.team!==u.team||!o.isUnit) return; const d=Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z); if(d>R) return;
    const sick=o.st&&(o.st.poison||o.st.burn)?1:0, hurt=1-o.hp/o.maxHp; if(!sick&&hurt<.08) return; const sc=sick*.6+hurt-d*.012; if(sc>bs){bs=sc;best=o;} });
  return best; }
TYPES.cleric.brain=(u,dt)=>{
  if(u.routing||game.mode!=='battle') return false;
  u.healCd=(u.healCd||0)-dt; u.thT=(u.thT||0)-dt; u.hlT=(u.hlT||0)-dt;
  if(u.thT<=0){ u.thT=.3; u.threat=nearestFoe(u.pos.x,u.pos.z,u.team,2.4,u); }
  if(u.hlT<=0){ u.hlT=.35; u.patient=findPatient(u,14); }
  const th=u.threat&&u.threat.alive?u.threat:null, pt=u.patient&&u.patient.alive?u.patient:null, T=u.T;
  if(th&&(!pt||u.hp<u.maxHp*.6)){
    if(u.hp<u.maxHp*.35){ const gx=BASE_X[u.team]+DIRX[u.team]*4, dx=gx-u.pos.x, dz=-u.pos.z*.3, d=Math.hypot(dx,dz)||1; u.desired.set(dx/d*T.speed,0,dz/d*T.speed); u.faceGoal=Math.atan2(dx,dz); return true; }
    u.target=th; const dx=th.pos.x-u.pos.x,dz=th.pos.z-u.pos.z; fightBrain(u,th,dx,dz,Math.hypot(dx,dz)||1e-3); return true; }
  if(pt){ const dx=pt.pos.x-u.pos.x,dz=pt.pos.z-u.pos.z,d=Math.hypot(dx,dz)||1e-3; u.faceGoal=Math.atan2(dx,dz);
    if(d>T.healR*.85&&pt!==u){ const sp=T.speed*clamp((d-T.healR*.7)/1.5,.4,1); u.desired.set(dx/d*sp,0,dz/d*sp); return true; }
    if(!u.action&&u.healCd<=0&&(pt===u||Math.abs(wrapA(u.faceGoal-u.face))<.6)){
      const sick=pt.st&&(pt.st.poison||pt.st.burn); let hurtN=0; gridEach(u.pos.x,u.pos.z,4.5,o=>{ if(o.alive&&o.team===u.team&&o.isUnit&&o.hp<o.maxHp*.8) hurtN++; });
      const mass=hurtN>=3&&(u.massCd||0)<game.time; if(mass) u.massCd=game.time+15;
      u.healT=pt; play(u,sick&&hasRes(u.team,'cure')?'cure':mass?'massHeal':pickOf(['heal','heal','healBlessing','healPrayer'])); u.fwdScale=0; u.healCd=1.1; }
    return true; }
  // nobody needs healing: keep behind the fighting
  const ro=u.reg?u.reg.order:null, charging=ro&&ro.kind!=='army'?(ro.kind==='charge'||ro.kind==='attack'):game.stance[u.team]==='charge';
  let gx,gz;
  if(charging){ let best=null,bd=1e9; for(const o of units){ if(!o.alive||o.team!==u.team||!o.isUnit||o.T.support||o.T.worker) continue; const d=Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z); if(d<bd){bd=d;best=o;} }
    if(best){ gx=best.pos.x-DIRX[u.team]*4; gz=best.pos.z; } }
  else if(ro&&(ro.kind==='move'||ro.kind==='hold')){ const sl=regSlot(u.reg,u); gx=sl.x; gz=sl.z; }
  else if(u.slot){ gx=u.slot.x; gz=u.slot.z; }
  if(gx===undefined) return false;
  const dx=gx-u.pos.x,dz=gz-u.pos.z,d=Math.hypot(dx,dz);
  if(d>.4){ const sp=T.speed*clamp(d/1.6,.25,1); u.desired.set(dx/d*sp,0,dz/d*sp); u.faceGoal=d>1.2?Math.atan2(dx,dz):(u.team===0?Math.PI/2:-Math.PI/2); }
  else u.faceGoal=u.team===0?Math.PI/2:-Math.PI/2;
  return true;
};
// Ninja: hunts archers, wizards and clerics first, cloaks itself (Shinobi) to close in unseen
const PREY={wizard:3,cleric:3,archer:2.6,wing:0,giant:.6};
TYPES.ninja.brain=(u,dt)=>{
  if(u.routing||game.mode!=='battle') return false;
  u.cdShin=(u.cdShin===undefined?rand(3,8):u.cdShin)-dt; u.pyT=(u.pyT||0)-dt;
  const ro=u.reg?u.reg.order:null, hunting=ro&&ro.kind!=='army'?(ro.kind==='charge'||ro.kind==='attack'):game.stance[u.team]==='charge';
  if(!hunting) return false;
  if(u.pyT<=0){ u.pyT=.6; let best=null,bs=0;
    gridEach(u.pos.x,u.pos.z,24,o=>{ if(!o.alive||o.team===u.team||o.state==='stunned'||!canTarget(u,o)) return; const d=Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z); if(d>24) return;
      const sc=(PREY[o.type]!==undefined?PREY[o.type]:1)/(1+d*.08); if(sc>bs){bs=sc;best=o;} });
    if(best){ u.target=best; u.retarget=.8; } }
  const t=u.target; if(t&&t.alive&&!u.cloak&&u.cdShin<=0&&!u.action&&hasRes(u.team,'shinobi')){ const d=Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z); if(d>5&&d<20){ play(u,'shinobi'); u.fwdScale=0; u.cdShin=24; return true; } }
  return false;
};
