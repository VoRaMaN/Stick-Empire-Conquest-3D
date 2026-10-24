/* ================= Cavalry: the Knight's warhorse, riders on their mounts, the lance =================
   The warhorse is built on the Hellcrawler's rig like the Hellhound (one gear group per bone): a barrel body
   under a caparison in the army's colours, a steel peytral and chamfron, a saddle, a long neck carrying a lean
   head, slender legs on dark hooves and a flowing tail. Coats vary from horse to horse.
   A rider is a stick soldier posed on the mount's back every frame (he leans with it when it rears, his legs
   wrap the barrel, his lance arm thrusts): the Order knight in bright plate with a plume, a kite shield and a
   pennoned lance; the Chaos Hell Rider (Cerberus research) in black spiked plate with a horned helm, red eyes
   and a black lance. When the mount dies the rider is thrown and falls as a ragdoll of his own. */
AIMW.knight=AIMW.crawler;
const CAV_PREY={archer:1,wizard:1,cleric:1,wing:1,harvester:1,bomber:1,oracle:1};
const RIDER={knight:{seatF:.5,seatH:.25,legW:.3,rs:1,kind:'order'},cerberus:{seatF:.46,seatH:.33,legW:.33,rs:1.06,kind:'chaos'}};
const LANCE_T=.42;

/* ---------- the warhorse ---------- */
let horseReady=false; const HS_COATS=[];
function horseInit(){
  if(horseReady) return; horseReady=true; houndInit();
  const ph=(c,sp,sh)=>new THREE.MeshPhongMaterial({color:c,specular:sp||'#3a2a20',shininess:sh||14});
  for(const [hide,hair] of [['#5e3a22','#1d1410'],['#7a4a2a','#2a1a10'],['#8d8780','#3a3430'],['#2c2523','#151110'],['#4a2e1c','#d8cdb8']]) HS_COATS.push({skin:ph(hide,'#4a382c',18),hair:ph(hair,'#2a2018',10)});
  CRM.hoof=ph('#1d1a18','#5a5048',30); CRM.heye=new THREE.MeshPhongMaterial({color:'#0b0807',specular:'#ffffff',shininess:90});
  CRM.saddle=ph('#4a2a16','#6a4a2a',20); CRM.hsteel=new THREE.MeshPhongMaterial({color:'#b9bec6',specular:'#ffffff',shininess:70});
  const P={}, add=(part,mat,list)=>{ const p=P[part]||(P[part]={}); (p[mat]||(p[mat]=[])).push(...list); };
  // an ellipsoid turned about x by `a`: its y axis then points (0,cos a,sin a) in the bone frame (y forward, z up)
  const hE=(cx,cy,cz,sx,sy,sz,a)=>[new THREE.SphereGeometry(1,16,11),new THREE.Matrix4().compose(new V3(cx,cy,cz),new THREE.Quaternion().setFromEuler(new THREE.Euler(a||0,0,0)),new V3(sx,sy,sz))];
  // rump, barrel and chest under the caparison; the saddle sits over the middle of the back
  add('hspel','skin',[crE(0,-.03,.03,.24,.24,.24),crE(.12,-.06,.0,.14,.17,.17),crE(-.12,-.06,.0,.14,.17,.17)]);
  add('hspel','bard',[crE(0,.0,-.04,.262,.25,.235)]);
  add('hsabd','skin',[crE(0,.24,0,.22,.3,.22)]);
  add('hsabd','bard',[crE(0,.24,-.05,.238,.32,.205)]);
  add('hsabd','saddle',[crE(0,.4,.19,.15,.19,.065),crE(0,.24,.23,.12,.035,.06),crE(0,.56,.23,.08,.035,.07)]);
  add('hsabd','bard2',[crE(0,.24,-.19,.24,.31,.03)]);
  add('hstor','skin',[crE(0,.18,.0,.26,.3,.26),crE(0,.26,.15,.13,.16,.1),crE(0,.33,-.05,.2,.14,.2)]);
  add('hstor','bard',[crE(0,.14,-.05,.275,.28,.24)]);
  add('hstor','steel',[crE(0,.38,-.05,.2,.07,.19)]);
  add('hsnek','skin',[crL([[-.06,0],[-.03,.14],[.1,.13],[.22,.11],[.27,0]])]);
  add('hsnek','hair',[crE(0,.12,.12,.03,.14,.05)]);
  // the head on its long neck, in the skull's frame (y along the head's heading, z up)
  add('hsskl','skin',[hE(0,.1,.2,.1,.12,.27,-.45),hE(0,.36,.33,.088,.25,.1,-.9),crE(0,.5,.15,.075,.09,.082),crE(0,.27,.41,.09,.12,.11)]);
  add('hsskl','hair',[hE(0,.0,.3,.035,.06,.26,-.45),crE(0,.2,.56,.035,.06,.045)]);
  add('hsskl','skin',[crTooth(.045,.21,.56,.02,.1,1),crTooth(-.045,.21,.56,.02,.1,1)]);
  add('hsskl','heye',[crE(.083,.31,.42,.022,.024,.022),crE(-.083,.31,.42,.022,.024,.022)]);
  add('hsskl','hoof',[crE(.035,.55,.12,.014,.02,.014),crE(-.035,.55,.12,.014,.02,.014)]);
  add('hsskl','steel',[hE(0,.42,.37,.062,.21,.025,-.9)]);
  add('hsskl','bard',[crE(0,.24,.64,.022,.022,.08)]);
  add('hsjaw','skin',[crE(0,.44,.15,.045,.07,.03)]);
  // legs: muscled at the top, slender cannons, dark hooves with a feathered fetlock
  add('hsua','skin',[crL([[-.04,0],[0,.1],[.12,.1],[.3,.068],[.5,.05],[.54,0]])]);
  add('hsfa','skin',[crL([[-.03,0],[0,.06],[.15,.054],[.4,.036],[.56,.033],[.6,0]])]);
  add('hsth','skin',[crL([[-.04,0],[0,.12],[.1,.13],[.24,.09],[.36,.06],[.39,0]])]);
  add('hssh','skin',[crL([[-.03,0],[0,.065],[.12,.06],[.38,.038],[.4,0]])]);
  add('hsmt','skin',[crL([[-.02,0],[0,.038],[.27,.032],[.29,0]])]);
  add('hshoof','hoof',[crE(0,.02,0,.055,.065,.05)]); add('hshoof','hair',[crE(0,-.035,.035,.048,.045,.05)]);
  // tail: long hair that flows with the rig's tail
  add('hstseg','hair',[crE(0,.05,0,.045,.075,.035)]);
  add('hsttip','hair',[crE(0,.08,0,.04,.12,.03)]);
  for(const part in P){ CRG[part]={}; for(const m in P[part]) CRG[part][m]=mergeUV(P[part][m]); }
}
function horsePart(name,s,k,u,coat){
  const g=grp(), P=CRG[name], tm=TEAM[u.team]||TEAM[0];
  for(const m in P){ const mat=m==='skin'?coat.skin:m==='hair'?coat.hair:m==='bard'?tm.acc:m==='bard2'?tm.acc2:m==='steel'?CRM.hsteel:CRM[m];
    const ms=mesh(P[m],mat); if(m==='heye') ms.castShadow=false; g.add(ms); }
  g.scale.setScalar(s*(k||1)); freezeGear(g); return g; }
function buildHorse(u,G){
  if(u.T.wyvern){ buildWyvern(u,G); return; }   // the Knight rides a wyvern now (27f)
  horseInit(); const s=u.s, coat=HS_COATS[(u.id*7+3)%HS_COATS.length], P=(n,k)=>horsePart(n,s,k,u,coat);
  G.c_pel=P('hspel'); G.c_abd=P('hsabd'); G.c_tor=P('hstor'); G.c_nek=P('hsnek'); G.c_skl=P('hsskl'); G.c_jaw=P('hsjaw');
  for(const sd of ['L','R']){ G['c_ua'+sd]=P('hsua'); G['c_fa'+sd]=P('hsfa'); G['c_hd'+sd]=P('hshoof'); G['c_th'+sd]=P('hsth'); G['c_sh'+sd]=P('hssh'); G['c_mt'+sd]=P('hsmt'); G['c_ft'+sd]=P('hshoof'); }
  for(let i=0;i<CR_TN;i++) G['c_t'+i]=P('hstseg',CR_TK[i]);
  G.c_tt=P('hsttip',CR_TK[CR_TN]);
  crInitRig(u);
}

/* ---------- the rider ---------- */
const RJ={}; for(const n of ['pelvis','chest','neck','head','sL','sR','eL','eR','hL','hR','hipL','hipR','kL','kR','fL','fR']) RJ[n]=new V3();
const _raR=new V3(),_raF=new V3(),_kvF=new V3(),_kvR=new V3(),_kvU=new V3(),_kvS=new V3(),_kvT=new V3(),_kvP=new V3(),_kvD=new V3(),_kvQ=new THREE.Quaternion(),_kvM=new THREE.Matrix4(),_kvA=new V3(),_kvB=new V3();
const RC={steel:new THREE.Color('#a9b0ba'),steelD:new THREE.Color('#6c737e'),wood:new THREE.Color('#c8ae7c'),dark:new THREE.Color('#141012'),visor:new THREE.Color('#0a0a0c'),
  cbody:new THREE.Color('#1a1012'),clance:new THREE.Color('#1b1716'),chead:new THREE.Color('#5a1a10'),gold:new THREE.Color('#e2ae35')};
const lanceK=u=>u.lanceT>0?Math.sin(Math.PI*clamp(1-u.lanceT/LANCE_T,0,1)):0;
function riderOf(u){ return u.T.horse?RIDER.knight:u.rider?RIDER[u.type]||RIDER.cerberus:null; }
// pose the rider on the mount's back (world space, into RJ); returns the lance direction in _kvD
function riderPose(u){
  const R=riderOf(u), cr=u.cr, j=u.j, s=u.s, rs=R.rs, k=lanceK(u), RM=u.T.wyvern?wyRiderMode(u):u.T.hadesRider?hxRiderMode(u):null, rw=RM?RM.w:0;
  _kvF.subVectors(j.chest,j.pelvis); if(_kvF.lengthSq()<1e-6) _kvF.copy(u.fwdW); _kvF.normalize();
  _kvR.crossVectors(_kvF,cr.n).normalize(); _kvU.crossVectors(_kvR,_kvF).normalize();
  const A=raTargets(u), tw=A.tw;   // the rider's own move (27i)
  const lean=.08+.22*k+(RM&&RM.m==='charge'?.32*rw:RM&&RM.m==='stand'?.5*rw:0)+A.lean;
  _kvS.copy(_kvU).multiplyScalar(Math.cos(lean)).addScaledVector(_kvF,Math.sin(lean)).lerp(UP,.5).normalize();
  if(u.cg&&u.cg.seatOK) RJ.pelvis.copy(u.cg.seat).addScaledVector(_kvU,.1*rs+(RM&&RM.m==='stand'?.16*rs*rw:0));   // on the skinned wyvern's back (27l)
  else RJ.pelvis.copy(j.pelvis).lerp(j.chest,R.seatF).addScaledVector(cr.n,R.seatH*s).addScaledVector(_kvU,.03*rs+(RM&&RM.m==='stand'?.16*rs*rw:0));
  RJ.hipL.copy(RJ.pelvis).addScaledVector(_kvR,-.05*rs); RJ.hipR.copy(RJ.pelvis).addScaledVector(_kvR,.05*rs);
  RJ.chest.copy(RJ.pelvis).addScaledVector(_kvS,.54*rs); RJ.neck.copy(RJ.pelvis).addScaledVector(_kvS,.62*rs);
  _kvT.copy(_kvS).addScaledVector(_kvF,.12).normalize(); RJ.head.copy(RJ.neck).addScaledVector(_kvT,.19*rs);
  // the shoulders turn with the blow (twist about the spine)
  const ct=Math.cos(tw), st=Math.sin(tw);
  _raR.copy(_kvR).multiplyScalar(ct).addScaledVector(_kvF,st); _raF.copy(_kvF).multiplyScalar(ct).addScaledVector(_kvR,-st);
  RJ.sR.copy(RJ.chest).addScaledVector(_raR,.075*rs); RJ.sL.copy(RJ.chest).addScaledVector(_raR,-.075*rs);
  const loc=(v,out,o)=>out.copy(o||RJ.chest).addScaledVector(_raR,v[0]*rs).addScaledVector(_kvS,v[1]*rs).addScaledVector(_raF,v[2]*rs);
  // the weapon's direction, then both arms onto their targets by two-bone IK
  _kvD.set(0,0,0).addScaledVector(_raR,A.wd[0]).addScaledVector(_kvS,A.wd[1]).addScaledVector(_raF,A.wd[2]); if(_kvD.lengthSq()<1e-6) _kvD.copy(_kvF); _kvD.normalize();
  const t=u.lanceTgt&&u.lanceTgt.alive&&k>0?u.lanceTgt:null;
  if(t){ _kvT.subVectors(t.j.chest,RJ.hR); const l=_kvT.length(); if(l>.3){ _kvT.multiplyScalar(1/l); if(_kvT.dot(_kvF)>.3) _kvD.lerp(_kvT,k).normalize(); } }
  loc(A.rh,_kvT); _kvP.copy(RJ.sR).addScaledVector(_kvS,-1*rs).addScaledVector(_raR,.5*rs).addScaledVector(_raF,-.4*rs);
  ik2(RJ.sR,_kvT,.32*rs,.32*rs,_kvP,RJ.eR,RJ.hR);
  if(A.two) _kvT.copy(RJ.hR).addScaledVector(_kvD,-.17*rs); else loc(A.lh,_kvT);
  _kvP.copy(RJ.sL).addScaledVector(_kvS,-1*rs).addScaledVector(_raR,-.5*rs).addScaledVector(_raF,-.2*rs);
  ik2(RJ.sL,_kvT,.32*rs,.32*rs,_kvP,RJ.eL,RJ.hL);
  // legs round the barrel
  for(const [hip,kn,ft,sd] of [[RJ.hipL,RJ.kL,RJ.fL,-1],[RJ.hipR,RJ.kR,RJ.fR,1]]){
    _kvT.copy(RJ.pelvis).addScaledVector(_kvR,sd*R.legW*s).addScaledVector(_kvU,-.56*rs).addScaledVector(_kvF,.05*rs);
    _kvP.copy(hip).addScaledVector(_kvF,1.2*rs).addScaledVector(_kvR,sd*.8*rs);
    ik2(hip,_kvT,.445*rs,.445*rs,_kvP,kn,ft); }
  return _kvD;
}
// helmet, plate and the trappings (also drawn on a thrown rider's corpse: directionless pieces only)
function drawRiderArmor(J,rs,kind,team,R,U,F){
  const chaos=kind==='chaos'||kind==='hades', A=chaos?PL_IRON:RC.steel, B=chaos?PL_DARK:RC.steelD, rt=.068*rs*1.45;
  cyl(_kvA.copy(J.pelvis).lerp(J.chest,.2),_kvB.copy(J.chest).lerp(J.neck,.3),rt*1.28,A,torsoIM);
  for(const sh of [J.sL,J.sR]){ sph(sh,.085*rs,B,jointIM); }
  for(const [el,ha] of [[J.eL,J.hL],[J.eR,J.hR]]) cyl(_kvA.copy(el).lerp(ha,.15),_kvB.copy(el).lerp(ha,.75),.075*rs,A,limbIM);
  for(const [kn,ft] of [[J.kL,J.fL],[J.kR,J.fR]]){ sph(kn,.085*rs,B,jointIM); cyl(_kvA.copy(kn).lerp(ft,.1),_kvB.copy(kn).lerp(ft,.8),.08*rs,A,limbIM); }
  sph(J.head,.205*rs,A,sphIM);
  _kvA.subVectors(J.head,J.neck).normalize();   // up the helmet
  if(chaos){
    for(const sd of [-1,1]){ const sx=R?R:_kvB.set(1,0,0);
      _kvP.copy(J.head).addScaledVector(sx,sd*.13*rs).addScaledVector(_kvA,.08*rs); _kvT.copy(_kvP).addScaledVector(sx,sd*.13*rs).addScaledVector(_kvA,.2*rs);
      cyl(_kvP,_kvT,.03*rs,B,limbIM); _kvP.copy(_kvT).addScaledVector(_kvA,.13*rs).addScaledVector(F||_kvA,-.05*rs); cyl(_kvT,_kvP,.017*rs,B,limbIM);
      // shoulder spikes
      const sh=sd<0?J.sL:J.sR; _kvP.copy(sh).addScaledVector(_kvA,.05*rs); _kvT.copy(_kvP).addScaledVector(_kvA,.17*rs).addScaledVector(sx,sd*.07*rs); cyl(_kvP,_kvT,.02*rs,B,limbIM); }
    if(F){ for(const sd of [-1,1]){ _kvP.copy(J.head).addScaledVector(F,.19*rs).addScaledVector(R,sd*.065*rs).addScaledVector(_kvA,.02*rs); glowAt(_kvP,.03*rs,'#ff3a1a'); } }
  } else {
    // a plume in the army's colours, a visor slit
    const pc=(TEAM[team]||TEAM[0]).acc.color;
    _kvP.copy(J.head).addScaledVector(_kvA,.18*rs); _kvT.copy(_kvP).addScaledVector(_kvA,.12*rs).addScaledVector(F||_kvA,-.12*rs); cyl(_kvP,_kvT,.05*rs,pc,limbIM);
    _kvP.copy(_kvT).addScaledVector(F||_kvA,-.14*rs).addScaledVector(_kvA,-.06*rs); cyl(_kvT,_kvP,.04*rs,pc,limbIM);
    if(F){ _kvP.copy(J.head).addScaledVector(F,.19*rs).addScaledVector(_kvA,.02*rs); _kvM.makeBasis(R,_kvA,F); _kvQ.setFromRotationMatrix(_kvM); blob(_kvP,_kvQ,.13*rs,.018*rs,.03*rs,RC.visor); }
  }
}
function drawRider(u){
  if(!u.alive||!u.cr||!riderOf(u)||(u.cloak&&u.alive)) return;
  const R=riderOf(u), rs=R.rs, d=riderPose(u), chaos=R.kind==='chaos', team=u.team, tm=TEAM[team]||TEAM[0]; (u.rdW||(u.rdW=new V3())).copy(d);
  if(R.kind==='hades'){ hxDrawRider(u,R,d); armDraw(u,RJ,rs,_kvF,_kvR,false); return; }   // the lord of the underworld (27g)
  const elf=!chaos&&facOf(team)==='wild';
  drawFigure(RJ,rs,chaos?RC.cbody:elf?WILD_BODY[0]:tm.body,1,_kvF,null,false,false);
  if(elf){ ELF_ARM.helm=armHas(u,'helm'); ELF_ARM.cape=armHas(u,'cape'); elfDress(RJ,rs,u.id||0,'rider',_kvF,_kvR); ELF_ARM.helm=ELF_ARM.cape=false; } else drawRiderArmor(RJ,rs,R.kind,team,_kvR,_kvU,_kvF);   // a Woodland Wyvern Rider is an elf (36c)
  // lance
  _kvA.copy(RJ.hR).addScaledVector(d,-.8*rs); _kvB.copy(RJ.hR).addScaledVector(d,2.25*rs);
  cyl(_kvA,_kvB,.026*rs,chaos?RC.clance:RC.wood,limbIM);
  _kvQ.setFromUnitVectors(UP,d);
  _kvP.copy(RJ.hR).addScaledVector(d,.1*rs); blob(_kvP,_kvQ,.075*rs,.05*rs,.075*rs,chaos?PL_DARK:RC.steel);   // the vamplate
  _kvP.copy(_kvB).addScaledVector(d,.13*rs); blob(_kvP,_kvQ,.034*rs,.16*rs,.034*rs,chaos?RC.chead:RC.steel);
  if(chaos){ glowAt(_kvP,.06*rs,'#ff5a1a'); for(const sd of [-1,1]){ _kvT.copy(_kvB).addScaledVector(d,.02*rs).addScaledVector(_kvR,sd*.09*rs).addScaledVector(d,-.08*rs); cyl(_kvB,_kvT,.014*rs,RC.chead,limbIM); } }
  else { // the pennon just behind the head
    _kvM.makeBasis(_kvR,d,_kvT.crossVectors(_kvR,d).normalize()); _kvQ.setFromRotationMatrix(_kvM);
    _kvP.copy(_kvB).addScaledVector(d,-.28*rs).addScaledVector(_kvU,.07*rs); blob(_kvP,_kvQ,.008*rs,.17*rs,.07*rs,tm.acc.color); }
  // the Order knight's kite shield on his left forearm
  if(!chaos&&!armHas(u,'offhand')){ _kvM.makeBasis(_kvR,_kvU,_kvF); _kvQ.setFromRotationMatrix(_kvM);
    _kvP.copy(RJ.eL).lerp(RJ.hL,.45).addScaledVector(_kvR,-.08*rs).addScaledVector(_kvU,-.02*rs);
    blob(_kvP,_kvQ,.022*rs,.2*rs,.15*rs,tm.acc.color); _kvT.copy(_kvP).addScaledVector(_kvU,-.16*rs); blob(_kvT,_kvQ,.02*rs,.12*rs,.075*rs,tm.acc.color);
    _kvT.copy(_kvP).addScaledVector(_kvR,-.022*rs); sph(_kvT,.035*rs,RC.steel,jointIM); }
  armDraw(u,RJ,rs,_kvF,_kvR,false);   // the rider's kit from the Armory (40d)
}
// the mount dies: the rider is thrown clear and falls as a body of his own
function throwRider(u,imp){
  if(!riderOf(u)||!u.cr) return; const R=riderOf(u);
  riderPose(u);
  const d=makeUnit('sword',u.team,u.pos.x,u.pos.z,{s:R.rs}); destroyGear(d); uid--;   // the thrown rider never takes a soldier's id
  d.id=-(u.id||0)-1e6; d.isUnit=false; d.col=R.kind==='chaos'?RC.cbody:(TEAM[u.team]||TEAM[0]).body; d.riderK=R.kind;
  for(const n in RJ) d.j[n].copy(RJ[n]);
  d.fwdW.copy(_kvF); d.rightW.copy(_kvR); d.av.copy(u.av||_kvT.set(0,0,0));
  d.alive=false;   // so the netcode never reports this death (every client throws its own rider)
  const v=new V3(rand(-1,1),3.2,rand(-1,1)); if(imp) v.addScaledVector(imp,.35);
  toRagdoll(d,v,{});
}

/* ---------- the lance in battle ---------- */
function riderTick(u,dt){
  if(u.lanceT>0) u.lanceT=Math.max(0,u.lanceT-dt);
  if(u.lanceHit>0){ u.lanceHit-=dt; if(u.lanceHit<=0) lanceStrike(u); }
  if(!u.alive||NET.guest||u.state!=='ok'||u.routing||game.mode!=='battle') return;
  if(u.T.horse&&u.action) return;   // the horse's own lance moves thrust it (knLance)
  u.lanceCd=(u.lanceCd===undefined?rand(.4,1.4):u.lanceCd)-dt; if(u.lanceCd>0) return;
  const t=u.target; if(!t||!t.alive||!t.isUnit||t.team===u.team||isAir(t)||t.invuln) return;
  const dx=t.pos.x-u.pos.x, dz=t.pos.z-u.pos.z, d=Math.hypot(dx,dz)||1; if(d>3.4*Math.max(1,u.s*.75)) return;
  if((dx*u.fwdW.x+dz*u.fwdW.z)/d<.55) return;
  u.lanceCd=rand(1.3,2.1); u.lanceT=LANCE_T; u.lanceHit=.17; u.lanceTgt=t;
}
function lanceStrike(u){
  const t=u.lanceTgt; if(!u.alive||!t||!t.alive||NET.guest) return;
  const dx=t.pos.x-u.pos.x, dz=t.pos.z-u.pos.z, d=Math.hypot(dx,dz)||1; if(d>3.9*Math.max(1,u.s*.75)) return;
  damage(t,u.T.dmg*(u.T.horse?.72:.55),u,new V3(dx/d,0,dz/d),1.6,.4);
  bleed(t.j.chest.clone(),new V3(dx/d,.25,dz/d),5,2,.4); sfx('stab',t.j.chest,.6);
}
Object.assign(EXTRA_EV,{
  knLance:(u)=>{ u.lanceT=LANCE_T; const t=u.atkTarget||u.target; if(t&&t.alive) u.lanceTgt=t; },
  hsSnort:(u)=>{ if(!u.cr) return; const p=u.j.head.clone().addScaledVector(u.cr.hd,.4*u.s).addScaledVector(u.cr.hu,.12*u.s); puff(p,3,.07*u.s,.6,'#e8e2d6'); },
  hsNeigh:(u)=>{ sfx('roar',u.j.head,.45,{rate:1.7}); },
});
// the Cerberus research: a Hell Rider mounts it
function mountRider(u){ if(u.rider||u.type!=='cerberus') return; u.rider=true; u.hp+=150; u.maxHp+=150; }

/* ---------- the knight's mind: lance first, rear in a crowd, trample from a few strides out, hunt the archers ---------- */
TYPES.knight.pick=(u,t)=>{
  if(!t||!t.isUnit) return pickOf(['hsHoof','hsLance','hsRear']);
  if(enemiesNear(u.team,u.pos.x,u.pos.z,3)>=3&&(u.cdCrowd||0)<game.time){ u.cdCrowd=game.time+6; return 'hsRear'; }
  let n,g=0; do{ n=pickOf(['hsLance','hsLance','hsCouched','hsCouched','hsHoof']); }while(n===u.lastAtk&&++g<4); return n;
};
TYPES.knight.brain=(u,dt)=>{
  if(u.routing||game.mode!=='battle') return false;
  const ro=u.reg?u.reg.order:null, hunting=ro&&ro.kind!=='army'?(ro.kind==='charge'||ro.kind==='attack'&&!ro.target&&!ro.unit):game.stance[u.team]==='charge';
  u.pyT=(u.pyT||0)-dt;
  if(hunting&&u.pyT<=0){ u.pyT=.8; let best=null,bs=0;
    gridEach(u.pos.x,u.pos.z,26,o=>{ if(!o.alive||o.team===u.team||!o.isUnit||o.state==='stunned'||!canTarget(u,o)||isAir(o)) return; const d=Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z); if(d>26) return;
      const sc=(CAV_PREY[o.type]?2.6:1)/(1+d*.08); if(sc>bs){bs=sc;best=o;} });
    if(best&&best!==u.target){ u.target=best; u.retarget=1; } }
  if(!u.target||!u.target.alive||!u.target.isUnit||u.action||u.cdT>0||u.state!=='ok') return false;
  const t=u.target, dx=t.pos.x-u.pos.x, dz=t.pos.z-u.pos.z, d=Math.hypot(dx,dz);
  if(d>4.4&&d<8.5&&(u.cdLeap||0)<game.time&&canTarget(u,t)&&Math.abs(wrapA(Math.atan2(dx,dz)-u.face))<.35&&!t.fl){
    u.cdLeap=game.time+rand(7,10); u.faceGoal=Math.atan2(dx,dz); startAttack(u,t,'hsTrample'); return true; }
  return false;
};

/* ---------- damage: cavalry runs down archers and casters; spears are its bane and stop a charge cold ---------- */
function cavMul(t,src){
  let k=1; if(!src||!src.T||!t.T) return k;
  if(t.rider) k*=.85;
  if(src.T.cav&&CAV_PREY[t.type]) k*=1.6;
  if(src.type==='spear'&&(t.T.cav||t.rider)){ k*=1.8;
    if(t.chg&&t.alive){ t.chg=null; t.chgCD=4; t.chgW=0; if((t.braceT||0)<game.time){ t.braceT=game.time+3; callout(t,'Braced!','#ffd36a'); if(!t.action&&t.state==='ok') play(t,'recoil'); } } }
  return k;
}
