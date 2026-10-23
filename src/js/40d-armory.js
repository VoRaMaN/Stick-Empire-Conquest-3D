/* ================= The Armory (v0.28, rebuilt v0.33): kit your army, faction by faction =================
   Each faction has its own armory, a 3D room the turntable stands in: the Order's castle armoury (stone, pillars,
   banners, weapon racks, torches), the Chaos infernal forge (basalt, lava channels, anvils, chains, braziers) and the
   Wildlands' elven armoury inside a hollow tree (roots, glowing mushrooms, lanterns, moss).
   Thirteen equipment categories: helm, crest, shoulders, chest, cape, gloves, belt, boots, weapon enchantment,
   off-hand, back, trinket, mount barding.
   v0.33: every piece is a real model (lathed helms with visors and eye slits, layered pauldrons, front and back
   plates, flared bracers, greaves with knee cops, curved kite shields, cloth capes that hang and swing) fitted to the
   soldier's own bones every frame: a helmet sits on the head and turns with it, a pauldron follows the arm, a greave
   stretches with the shin, tassets ride the thighs, a shield is strapped across the forearm. Pieces are drawn in
   batches (one instanced mesh per shape and finish), so a kitted army costs a few draw calls. Beasts (Hellcrawler,
   Hound, Cerberus) and the mounts of the Wyvern Knight and Hades take barding and trinkets.
   A loadout is kept per faction and unit type (settings.armory) and worn by your army in every battle.
   Compatibility: pieces belong to a faction; an off-hand needs a free left hand; barding only fits a beast or a
   mount; Hades wears his own infernal armour (cape, back piece, trinket and barding only); Wing Archers' wings leave
   no room for a cape or a back piece; a hood leaves no room for a crest; a bulky back piece (banner, quiver) does not
   go over a long cape. The kit is for looks: it changes nothing in a fight, so online battles stay fair. */
const ATAU=Math.PI*2;   // (TAU is declared later, in 44-audio)
const ARM={on:false,fac:null,type:null,cat:'helm',env:null,fx:[],light:null,ver:1};
const ARM_CATS=[['helm','Helm'],['crest','Crest'],['shoulders','Shoulders'],['chest','Chest'],['cape','Cape'],['gloves','Gloves'],['belt','Belt'],['boots','Boots'],
  ['weapon','Weapon'],['offhand','Off-hand'],['back','Back'],['trinket','Trinket'],['mount','Barding']];
const ARM_C={}; const armC=c=>ARM_C[c]||(ARM_C[c]=new THREE.Color(c));
const ARM_ENV={order:'The Castle Armoury',chaos:'The Infernal Forge',wild:'The Elven Armoury'};
const ARM_NOOFF={archer:1,spear:1,wizard:1,cleric:1,wing:1,oracle:1,harvester:1,bomber:1,boner:1};
const ARM_HADES={cape:1,back:1,trinket:1,mount:1};
const _ar1=new V3(),_ar2=new V3(),_ar3=new V3(),_ar4=new V3();

/* ---------- the forge: piece shapes, made on first use ---------- */
// Shapes are unit-sized; a part places one on a bone frame (frames below). Made inside withOwnRandom so creating
// them mid-battle never draws from the battle's random numbers.
function agMerge(list){
  let n=0; const L=list.map(g=>{ const q=g.index?g.toNonIndexed():g; if(!q.attributes.normal) q.computeVertexNormals(); n+=q.attributes.position.count; return q; });
  const P=new Float32Array(n*3), N=new Float32Array(n*3); let o=0;
  for(const q of L){ P.set(q.attributes.position.array,o*3); N.set(q.attributes.normal.array,o*3); o+=q.attributes.position.count; }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('normal',new THREE.BufferAttribute(N,3)); return g; }
// a tube along a smooth curve, tapering from r0 to r1 (horns, antlers, tines, straps)
function agTube(ctrl,r0,r1,n,seg,closed){
  const C=new THREE.CatmullRomCurve3(ctrl,!!closed), pts=C.getPoints(n||16), m=pts.length; seg=seg||8;
  const P=[], N=[], I=[], t=new V3(), a=new V3(), b=new V3();
  for(let i=0;i<m;i++){ t.subVectors(pts[Math.min(m-1,i+1)],pts[Math.max(0,i-1)]).normalize();
    if(i===0){ a.set(0,0,1); if(Math.abs(t.dot(a))>.9) a.set(1,0,0); a.addScaledVector(t,-a.dot(t)).normalize(); }
    else { a.addScaledVector(t,-a.dot(t)); if(a.lengthSq()<1e-8) a.set(1,0,0).addScaledVector(t,-t.x); a.normalize(); }
    b.crossVectors(t,a); const r=closed?r0:r0+(r1-r0)*Math.pow(i/(m-1),.85);
    for(let k=0;k<=seg;k++){ const th=k/seg*ATAU, c=Math.cos(th), s=Math.sin(th), nx=a.x*c+b.x*s, ny=a.y*c+b.y*s, nz=a.z*c+b.z*s;
      P.push(pts[i].x+nx*r,pts[i].y+ny*r,pts[i].z+nz*r); N.push(nx,ny,nz); } }
  for(let i=0;i<m-1;i++) for(let k=0;k<seg;k++){ const A=i*(seg+1)+k, B=A+seg+1; I.push(A,B,A+1,B,B+1,A+1); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3)); g.setIndex(I); return g; }
// a flat shape with a little depth, centred on z=0
function agFlat(draw,depth,bevel){ const sh=new THREE.Shape(); draw(sh);
  const g=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:!!bevel,bevelThickness:bevel||0,bevelSize:bevel||0,bevelSegments:2,curveSegments:10}); g.translate(0,0,-depth/2); g.computeVertexNormals(); return g; }
const agLeaf=()=>agFlat(s=>{ s.moveTo(0,0); s.quadraticCurveTo(.46,.42,0,1); s.quadraticCurveTo(-.46,.42,0,0); },.03,.015);
const agFeather=()=>agFlat(s=>{ s.moveTo(0,0); s.quadraticCurveTo(.26,.45,.04,1); s.quadraticCurveTo(-.2,.5,0,0); },.02,.008);
const agV2=a=>a.map(p=>new THREE.Vector2(p[0],p[1]));
const agBend=(g,k)=>{ const p=g.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i); p.setZ(i,p.getZ(i)-x*x*k); } g.computeVertexNormals(); return g; };
const AGM={
  sph:()=>new THREE.SphereGeometry(1,16,12),
  dome:()=>new THREE.SphereGeometry(1,18,9,0,ATAU,0,Math.PI/2),
  domeD:()=>new THREE.SphereGeometry(1,22,12,0,ATAU,0,Math.PI*.58),            // a helmet cap, a little past the brow
  cyl:()=>new THREE.CylinderGeometry(1,1,1,20,1,true),
  cylC:()=>new THREE.CylinderGeometry(1,1,1,12,1,false),
  bracer:()=>new THREE.CylinderGeometry(1.12,.92,1,16,1,true),                 // flares toward +y
  cone:()=>new THREE.ConeGeometry(1,1,10),                                      // tip at +y .5
  box:()=>new THREE.BoxGeometry(1,1,1),
  gem:()=>new THREE.OctahedronGeometry(1,0),
  ring:()=>{ const g=new THREE.TorusGeometry(1,.2,8,32); g.rotateX(Math.PI/2); return g; },    // horizontal, round the y axis
  ringT:()=>{ const g=new THREE.TorusGeometry(1,.06,6,40); g.rotateX(Math.PI/2); return g; },
  ringZ:()=>new THREE.TorusGeometry(1,.07,6,32),                               // facing +z (shield rims)
  link:()=>new THREE.TorusGeometry(1,.3,6,10),
  ridge:()=>{ const g=new THREE.TorusGeometry(1,.06,6,22,Math.PI); g.rotateY(Math.PI/2); return g; },   // over the top, front to back
  arcF:()=>new THREE.CylinderGeometry(1,1,1,14,1,true,-1.05,2.1),               // a front arc round y (around +z)
  arcB:()=>new THREE.CylinderGeometry(1,1,1,14,1,true,Math.PI-1.05,2.1),
  arcS:()=>new THREE.CylinderGeometry(1,1,1,8,1,true,Math.PI/2-.55,1.1),         // a side arc round +x
  greatHelm:()=>new THREE.LatheGeometry(agV2([[1.02,-1.02],[1.07,-.6],[1.1,-.2],[1.11,.2],[1.07,.5],[.92,.8],[.62,1.03],[.3,1.13],[0,1.15]]),26),
  plume:()=>new THREE.LatheGeometry(agV2([[0,0],[.18,.1],[.32,.35],[.36,.65],[.3,.95],[.18,1.2],[0,1.36]]),12),
  // torso plates (torso units: radius in s*thick, height in s, from the pelvis)
  plateF:()=>new THREE.LatheGeometry(agV2([[.096,.14],[.111,.2],[.121,.31],[.126,.43],[.124,.53],[.112,.6],[.09,.645]]),12,-1.1,2.2),
  plateB:()=>new THREE.LatheGeometry(agV2([[.096,.14],[.11,.2],[.118,.31],[.122,.43],[.121,.53],[.11,.6],[.09,.645]]),12,Math.PI-1.0,2.0),
  mantle:()=>new THREE.CylinderGeometry(.6,1,1,18,1,true,Math.PI-2.5,5.0),      // a hood's shoulder cape, open at the throat
  hood:()=>new THREE.SphereGeometry(1,22,14,Math.PI/2+.85,ATAU-1.7,0,Math.PI*.72),
  skull:()=>new THREE.SphereGeometry(1,18,12,0,Math.PI,0,Math.PI*.8),           // the front half of a skull
  hornR:()=>agTube([new V3(.8,.42,.05),new V3(1.3,.62,0),new V3(1.68,1.0,-.12),new V3(1.62,1.55,0),new V3(1.42,1.9,.12)],.24,.015,18,9),
  hornL:()=>agTube([new V3(-.8,.42,.05),new V3(-1.3,.62,0),new V3(-1.68,1.0,-.12),new V3(-1.62,1.55,0),new V3(-1.42,1.9,.12)],.24,.015,18,9),
  antR:()=>agMerge([agTube([new V3(.5,.72,-.05),new V3(.85,1.25,-.15),new V3(1.02,1.8,-.05),new V3(.96,2.3,.12)],.1,.025,14,7),
    agTube([new V3(.86,1.3,-.14),new V3(1.2,1.55,0),new V3(1.42,1.72,.12)],.06,.02,8,6), agTube([new V3(1.0,1.75,-.06),new V3(.82,2.0,-.25),new V3(.7,2.2,-.35)],.05,.018,8,6),
    agTube([new V3(1.02,1.95,0),new V3(1.3,2.15,.05),new V3(1.42,2.35,.1)],.045,.015,8,6)]),
  antL:()=>{ const g=AGM.antR(); g.scale(-1,1,1); return g; },
  wing:()=>agMerge([0,1,2,3,4].map(i=>{ const g=agFeather(); g.scale(.36,[.95,1.08,1.14,1.02,.84][i],1); g.rotateY(Math.PI/2); g.rotateX(-(.12+i*.28)); return g; })),
  feather:agFeather, leaf:agLeaf,
  bloom:()=>agMerge([0,1,2,3,4].map(i=>{ const g=agLeaf(); g.scale(.55,.8,1); g.rotateX(.45); g.rotateZ(i/5*ATAU); return g; })),
  leafFan:()=>agMerge([-1,0,1].map(i=>{ const g=agLeaf(); g.scale(.8,1,1); g.rotateZ(i*.5); return g; })),
  kite:()=>agBend(agFlat(s=>{ s.moveTo(-.5,.3); s.quadraticCurveTo(0,.44,.5,.3); s.quadraticCurveTo(.5,-.28,0,-.82); s.quadraticCurveTo(-.5,-.28,-.5,.3); },.06,.025),.35),
  disc:()=>{ const g=new THREE.CylinderGeometry(1,1,.07,30,2); g.rotateX(Math.PI/2); const p=g.attributes.position;
    for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i); p.setZ(i,p.getZ(i)+(1-Math.min(1,x*x+y*y))*.2); } g.computeVertexNormals(); return g; },
  flag:()=>{ const g=new THREE.PlaneGeometry(1,1,10,4); g.translate(0,-.5,0); const p=g.attributes.position;
    for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i); p.setZ(i,Math.sin(x*6+y*2)*.05*(1-y*.3)); } g.computeVertexNormals(); return g; },
  flagT:()=>{ const g=agFlat(s=>{ s.moveTo(-.5,0); s.lineTo(.5,0); s.lineTo(.5,-.9); s.lineTo(.3,-.72); s.lineTo(.12,-1); s.lineTo(-.06,-.74); s.lineTo(-.26,-.98); s.lineTo(-.5,-.78); s.lineTo(-.5,0); },.01,0);
    const p=g.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i); p.setZ(i,p.getZ(i)+Math.sin(x*6+y*2)*.05); } g.computeVertexNormals(); return g; },
  quiver:()=>new THREE.CylinderGeometry(1,.8,1,12,1,false),
  // Hades' hell scythe: a long hooked blade off the top of the shaft (lying in the y-z plane), and its burning edge
  scythe:()=>{ const g=agFlat(s=>{ s.moveTo(0,.07); s.quadraticCurveTo(.5,.26,1.1,-.34); s.quadraticCurveTo(.92,-.12,.62,-.02); s.quadraticCurveTo(.3,.02,0,-.07); s.lineTo(0,.07); },.03,.012); g.rotateY(-Math.PI/2); return g; },
  scytheEdge:()=>agTube([new V3(0,-.07,0),new V3(0,-.01,.32),new V3(0,-.03,.62),new V3(0,-.13,.9),new V3(0,-.34,1.1)],.012,.006,16,5),
  strap:()=>{ const a=.27,b=.112,al=1.19, pts=[]; for(let i=0;i<24;i++){ const t=i/24*ATAU, x=a*Math.cos(t), z=b*Math.sin(t); pts.push(new V3(x*Math.cos(al),x*Math.sin(al),z)); } return agTube(pts,.013,.013,48,6,true); },
  ribArc:()=>{ const pts=[]; for(let i=0;i<=8;i++){ const f=-1.15+i/8*2.3; pts.push(new V3(Math.sin(f),0,Math.cos(f))); } return agTube(pts,.1,.1,16,6); },
  capeR:()=>new THREE.CylinderGeometry(1,1.35,1,14,3,true,Math.PI-1.25,2.5),
  drape:()=>{ const g=new THREE.CylinderGeometry(1,1.08,1,18,1,true,Math.PI-1.95,3.9); g.rotateX(Math.PI/2); return g; },   // a half pipe over a back, along z
  lantern:()=>agMerge([new THREE.CylinderGeometry(.55,.55,1,6,1,true),(()=>{ const g=new THREE.ConeGeometry(.75,.45,6); g.translate(0,.72,0); return g; })(),(()=>{ const g=new THREE.TorusGeometry(.25,.06,5,10); g.translate(0,1.05,0); return g; })(),
    (()=>{ const g=new THREE.CylinderGeometry(.62,.62,.12,6); g.translate(0,-.5,0); return g; })()]),
};
const ARG={}; function argGeo(k){ if(!ARG[k]){ const f=AGM[k]; if(!f) throw new Error('armory shape '+k); withOwnRandom(()=>{ ARG[k]=f(); }); } return ARG[k]; }
let ARMM=null;
function armMats(){ if(!ARMM) withOwnRandom(()=>{ ARMM={
  m:new THREE.MeshPhongMaterial({color:'#ffffff',specular:'#9a9a9a',shininess:70,side:THREE.DoubleSide}),     // polished metal
  l:new THREE.MeshPhongMaterial({color:'#ffffff',specular:'#2c2a28',shininess:18,side:THREE.DoubleSide}),     // leather, bone, wood, bark
  c:new THREE.MeshLambertMaterial({color:'#ffffff',side:THREE.DoubleSide}),                                   // cloth, leaves
  g:new THREE.MeshBasicMaterial({color:'#ffffff',side:THREE.DoubleSide}) }; });                               // glowing: gems, eyes, haloes
  return ARMM; }
// one instanced mesh per shape and finish, filled while the soldiers are drawn and counted with the bodies (CNT)
const ARB=new Map();
function arBatch(g,mk){ const key=g+'|'+mk; let b=ARB.get(key); if(!b){ b={geo:argGeo(g),mat:armMats()[mk],im:null,cap:0}; ARB.set(key,b); } return b; }
function arGrow(b){
  const n=b.im?(CNT.get(b.im)||0):0, cap=Math.max(32,b.cap*2); let im;
  withOwnRandom(()=>{ im=new THREE.InstancedMesh(b.geo,b.mat,cap); });
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled=false; im.castShadow=true; im.receiveShadow=true; im.userData.cap=cap; im.setColorAt(0,WHITE); im.count=0;   // (the colour buffer is sized by count: colour first)
  if(b.im){ im.instanceMatrix.array.set(b.im.instanceMatrix.array.subarray(0,n*16)); im.instanceColor.array.set(b.im.instanceColor.array.subarray(0,n*3)); scene.remove(b.im); CNT.delete(b.im); b.im.dispose(); }
  scene.add(im); CNT.set(im,n); b.im=im; b.cap=cap; }
const _arM=new THREE.Matrix4();
function arPut(b,m,col){ if(!b.im||(CNT.get(b.im)||0)>=b.cap) arGrow(b); const i=CNT.get(b.im); b.im.setMatrixAt(i,m); b.im.setColorAt(i,col); CNT.set(b.im,i+1); }

/* ---------- bone frames ---------- */
// A frame is a matrix on one bone: x = the soldier's right (or outward, for a side piece), y along the bone, z forward.
// Torso pieces scale radially with the soldier's build (s*thick) and along the spine with his size; limb pieces are
// stretched over the bone (y from 0 at the joint to 1 at the next), so a greave always reaches knee to ankle.
const AF={}, _afX=new V3(), _afY=new V3(), _afZ=new V3(), _afT=new V3(), _afU=new V3();
let afN=0;
function afBuild(Fr,o,y,zh,sx,sy,sz){
  _afY.copy(y); const L=_afY.length(); if(!(L>1e-6)){ Fr.ok=false; return Fr; } _afY.multiplyScalar(1/L);
  _afZ.copy(zh).addScaledVector(_afY,-zh.dot(_afY)); if(_afZ.lengthSq()<1e-6){ _afZ.set(0,0,1).addScaledVector(_afY,-_afY.z); if(_afZ.lengthSq()<1e-6) _afZ.set(1,0,0).addScaledVector(_afY,-_afY.x); } _afZ.normalize();
  _afX.crossVectors(_afY,_afZ); Fr.X.copy(_afX);
  Fr.m.makeBasis(_afX.multiplyScalar(sx),_afY.multiplyScalar(sy),_afZ.multiplyScalar(sz)); Fr.m.setPosition(o); Fr.ok=true; return Fr; }
function afGet(C,name){
  const Fr=AF[name]||(AF[name]={m:new THREE.Matrix4(),X:new V3(),n:-1,sd:1,ok:false}); if(Fr.n===afN) return Fr; Fr.n=afN; Fr.sd=1;
  const j=C.j, s=C.s, sk=C.s*C.k, sideR=name[name.length-1]==='R';
  const side=()=>{ Fr.sd=(Fr.X.dot(C.R)>=0?1:-1)*(sideR?1:-1); return Fr; };
  switch(name){
    case 'head': return afBuild(Fr,j.head,_afT.subVectors(j.head,j.neck),C.FL,C.hr,C.hr,C.hr);
    case 'torso': return afBuild(Fr,j.pelvis,C.SP,C.F,sk,s,sk);
    case 'back': return afBuild(Fr,j.chest,C.SP,C.F,s,s,s);
    case 'paL': case 'paR': { const X=sideR?'R':'L', sh=j['s'+X]; _afT.subVectors(sh,j['e'+X]); const L=_afT.length(); if(L>1e-6) _afT.multiplyScalar(.55/L); _afT.add(C.SP);
      afBuild(Fr,sh,_afT,C.F,sk,sk,sk); return side(); }
    case 'uaL': case 'uaR': { const X=sideR?'R':'L'; _afT.subVectors(j['e'+X],j['s'+X]); afBuild(Fr,j['s'+X],_afT,C.F,sk,_afT.length(),sk); return side(); }
    case 'faL': case 'faR': { const X=sideR?'R':'L'; _afT.subVectors(j['h'+X],j['e'+X]); afBuild(Fr,j['e'+X],_afT,C.F,sk,_afT.length(),sk); return side(); }
    case 'hdL': case 'hdR': { const X=sideR?'R':'L'; _afT.subVectors(j['h'+X],j['e'+X]); afBuild(Fr,j['h'+X],_afT,C.F,sk,sk,sk); return side(); }
    case 'thL': case 'thR': { const X=sideR?'R':'L'; _afT.subVectors(j['k'+X],j['hip'+X]); afBuild(Fr,j['hip'+X],_afT,C.F,sk,_afT.length(),sk); return side(); }
    case 'snL': case 'snR': { const X=sideR?'R':'L'; _afT.subVectors(j['f'+X],j['k'+X]); afBuild(Fr,j['k'+X],_afT,C.F,sk,_afT.length(),sk); return side(); }
    case 'ftL': case 'ftR': { const X=sideR?'R':'L'; afBuild(Fr,j['f'+X],UP,C.F,sk,sk,sk); return side(); }
    case 'shield': { // strapped across the left forearm: the face looks away from the body, its top up the spine
      _afT.subVectors(j.hL,j.eL); const L=_afT.length(); if(!(L>1e-6)){ Fr.ok=false; return Fr; } _afT.multiplyScalar(1/L);
      _afU.copy(C.SP).addScaledVector(_afT,-C.SP.dot(_afT)); if(_afU.lengthSq()<1e-6) _afU.copy(C.F).addScaledVector(_afT,-C.F.dot(_afT)); _afU.normalize();
      _ar4.crossVectors(_afU,_afT); _ar3.copy(j.eL).lerp(j.hL,.5).sub(j.chest); if(_ar4.dot(_ar3)<0) _ar4.negate();
      _ar3.copy(j.eL).lerp(j.hL,.55).addScaledVector(_ar4,.05*s); return afBuild(Fr,_ar3,_afU,_ar4,s,s,s); }
    case 'hang': return afBuild(Fr,j.hL,UP,C.F,s,s,s);
    case 'wpn': { const u=C.u; return afBuild(Fr,j.hR,C.wd||u.wRw||C.SP,C.R,s,s,s); }
    // a beast's frames: the middle of its back, its chest, its head
    case 'mbk': { const cr=C.u.cr; _ar3.copy(j.pelvis).lerp(j.chest,.5); return afBuild(Fr,_ar3,cr.n,_afT.subVectors(j.chest,j.pelvis),s,s,s); }
    case 'mch': { const cr=C.u.cr; return afBuild(Fr,j.chest,cr.n,_afT.subVectors(j.chest,j.pelvis),s,s,s); }
    case 'mhd': { const cr=C.u.cr; return afBuild(Fr,j.neck,cr.hu,cr.hd,s,s,s); }
  }
  Fr.ok=false; return Fr;
}
const afPt=(C,name,x,y,z,out)=>{ const Fr=afGet(C,name); return Fr.ok?out.set(Fr.sd*x,y,z).applyMatrix4(Fr.m):null; };

/* ---------- pieces ---------- */
// A part: [frame, shape, finish (m metal, l leather/bone/wood, c cloth, g glow), colour, position, rotation (YXZ), scale, flags]
// Side frames (pauldrons, arms, legs) are listed for the right side and mirrored for the left.
const PT=(f,g,m,c,p,r,sc,o)=>Object.assign({f,g,m,c,p,r:r||null,sc:typeof sc==='number'?[sc,sc,sc]:sc},o||{});
const SIDES=(f,...a)=>[PT(f+'R',...a),PT(f+'L',...a)];
const _apq=new THREE.Quaternion(), _ape=new THREE.Euler(0,0,0,'YXZ'), _apv=new V3(), _aps=new V3();
function partCompile(P){
  const mk=(sd)=>{ const m=new THREE.Matrix4(), r=P.r||[0,0,0]; _ape.set(r[0],sd*r[1],sd*r[2],'YXZ'); _apq.setFromEuler(_ape);
    _apv.set(sd*P.p[0],P.p[1],P.p[2]); _aps.set(P.sc[0],P.sc[1],P.sc[2]); m.compose(_apv,_apq,_aps); return m; };
  P.M1=mk(1); P.M2=mk(-1); P.col=armC(P.c); P.b=null; }
// helms (head units: the head's radius)
const SLIT='#0a0a0c';
const greatHelm=(st,tr,slit,glow)=>[PT('head','greatHelm','m',st,[0,0,0],0,1), PT('head','arcF',glow?'g':'m',slit||SLIT,[0,.12,0],0,[1.118,.09,1.118]),
  PT('head','arcF','m',tr,[0,.33,0],0,[1.105,.065,1.105]), PT('head','box','m',tr,[0,-.38,1.105],[-.06,0,0],[.12,.8,.05]), PT('head','cyl','m',tr,[0,-.975,0],0,[1.035,.07,1.035]),
  PT('head','ridge','m',tr,[0,0,0],0,[1.12,1.13,1.13])];
const openHelm=(st,tr)=>[PT('head','domeD','m',st,[0,.03,-.02],0,[1.1,1.1,1.12]), PT('head','cyl','m',tr,[0,-.21,-.02],0,[1.115,.08,1.13]),
  PT('head','ridge','m',tr,[0,.03,-.02],0,[1.13,1.12,1.14]), PT('head','box','m',st,[0,-.36,1.08],[-.18,0,0],[.13,.42,.06]),
  PT('head','arcS','m',st,[0,-.52,0],[0,-.55,0],[1.06,.6,1.06]), PT('head','arcS','m',st,[0,-.52,0],[0,.55-Math.PI,0],[1.06,.6,1.06])];
const horns=(c)=>[PT('head','hornR','l',c,[0,0,0],0,1), PT('head','hornL','l',c,[0,0,0],0,1)];
const circlet=(c,gem,n)=>{ const L=[PT('head','ringT','m',c,[0,.38,0],[-.12,0,0],[1.0,1.4,1.04]), PT('head','gem','g',gem,[0,.37,1.04],0,[.1,.12,.06])];
  for(let i=0;i<(n||5);i++){ const a=(i/((n||5)-1)-.5)*1.5; L.push(PT('head','cone','m',c,[Math.sin(a)*1.0,.5-Math.abs(a)*.05,Math.cos(a)*1.0],[.12*Math.cos(a),0,0],[.06,.2,.06])); } return L; };
const crownOf=(c,n,h)=>{ const L=[PT('head','ringT','m',c,[0,.42,0],0,[1.0,2,1.0])]; for(let i=0;i<n;i++){ const a=i/n*ATAU; L.push(PT('head','cone','m',c,[Math.sin(a)*.97,.42+h*.5,Math.cos(a)*.97],[.25*Math.cos(a),0,-.25*Math.sin(a)],[.08,h,.08])); } return L; };
const plumeOf=(c,tr)=>[PT('head','plume','c',c,[0,1.02,-.12],[-1.15,0,0],[.72,1.25,.72]), PT('head','cylC','m',tr,[0,1.03,-.02],0,[.1,.14,.1])];
const feathersOf=(c,c2)=>[PT('head','feather','c',c,[0,1.0,-.35],[-.6,0,0],[.62,1.35,1]), PT('head','feather','c',c2||c,[.3,.93,-.42],[-.55,.35,-.2],[.55,1.15,1]), PT('head','feather','c',c2||c,[-.3,.93,-.42],[-.55,-.35,.2],[.55,1.15,1])];
const spikeRow=(c,n)=>{ const L=[]; for(let i=0;i<n;i++){ const a=-.45+i*.36, h=.62-i*.08; L.push(PT('head','cone','m',c,[0,Math.cos(a)*(1.04+h*.45),-Math.sin(a)*(1.04+h*.45)],[-a,0,0],[.11,h,.11])); } return L; };
// shoulders (pauldron frame: on the shoulder, tipping with the arm; x outward)
const pauldron=(c,c2,c3)=>SIDES('pa','dome','m',c,[.034,.014,0],[0,0,-.38],[.096,.07,.106]).concat(SIDES('pa','dome','m',c2||c,[.05,-.016,0],[0,0,-.72],[.094,.055,.104]),SIDES('pa','dome','m',c3||c2||c,[.062,-.044,0],[0,0,-1.02],[.089,.046,.099]));
// chest (torso units)
const plates=(c,m,sc)=>[PT('torso','plateF',m||'m',c,[0,0,0],0,[sc||1,1,(sc||1)*1.08]), PT('torso','plateB',m||'m',c,[0,0,0],0,[sc||1,1,sc||1])];
const trims=(c,m)=>[PT('torso','arcF',m||'m',c,[0,.15,0],0,[.104,.024,.112]), PT('torso','arcB',m||'m',c,[0,.15,0],0,[.104,.024,.104]), PT('torso','arcF',m||'m',c,[0,.628,0],0,[.1,.022,.106])];
const tassets=(c,tr,m)=>SIDES('th','arcF',m||'m',c,[0,.2,0],0,[.088,.38,.088],{leg:1}).concat(tr?SIDES('th','arcF','m',tr,[0,.39,0],0,[.09,.04,.09],{leg:1}):[]);
// gloves (forearm: y elbow 0 to wrist 1; hand frame in s*thick)
const gauntlets=(c,tr,m)=>SIDES('fa','bracer',m||'m',c,[0,.62,0],0,[.062,.58,.062]).concat(SIDES('fa','ring','m',tr||c,[0,.93,0],0,[.072,.2,.072]),SIDES('hd','sph',m||'m',c,[0,.006,0],0,[.066,.073,.066]));
// boots (shin: knee 0 to ankle 1; foot frame flat)
const greaves=(c,tr)=>SIDES('sn','bracer','m',c,[0,.52,0],[Math.PI,0,0],[.066,.7,.066],{leg:1}).concat(SIDES('sn','dome','m',tr||c,[0,0,.034],[Math.PI/2,0,0],[.062,.05,.062],{leg:1}),
  SIDES('ft','sph','m',c,[0,-.004,.05],0,[.08,.057,.13]), SIDES('sn','ring','m',tr||c,[0,.9,0],0,[.07,.18,.07],{leg:1}));
const bootsOf=(c,cuff)=>SIDES('sn','bracer','l',c,[0,.75,0],[Math.PI,0,0],[.068,.5,.068],{leg:1}).concat(SIDES('sn','bracer','c',cuff||c,[0,.5,0],0,[.074,.12,.074],{leg:1}),SIDES('ft','sph','l',c,[0,-.004,.05],0,[.079,.056,.128]));
// belts (torso)
const beltOf=(c,buckle,m)=>[PT('torso','ring',m||'l',c,[0,.1,0],0,[.091,.12,.095]), PT('torso','box','m',buckle,[0,.1,.1],0,[.032,.03,.012]), PT('torso','sph','l',c,[.074,.065,.058],0,[.026,.03,.02])];
// off-hand (shield frame: across the forearm; z = the face)
const buckler=(c,tr)=>[PT('shield','disc','m',c,[0,0,0],0,[.15,.15,.15]), PT('shield','dome','m',tr,[0,0,.012],[Math.PI/2,0,0],[.045,.03,.045]), PT('shield','ringZ','m',tr,[0,0,.004],0,[.15,.15,.15])];
const kiteOf=(c,tr)=>[PT('shield','kite','m',c,[0,-.07,0],0,[.3,.3,.3]), PT('shield','kite','m',tr,[0,-.07,-.01],0,[.325,.322,.3]),
  PT('shield','box','m',tr,[0,-.05,.022],0,[.026,.25,.008]), PT('shield','box','m',tr,[0,.02,.022],0,[.17,.026,.008])];
// back (back frame: the chest, uniform)
const bannerOf=(pole,flag,tr,tat)=>[PT('back','cylC','l',pole,[0,.3,-.135],0,[.012,1.46,.012]), PT('back','cone','m',tr,[0,1.1,-.135],0,[.03,.12,.03]),
  PT('back','cylC','l',pole,[0,.99,-.135],[0,0,Math.PI/2],[.009,.34,.009]), PT('back',tat?'flagT':'flag','c',flag,[0,.98,-.15],0,[.32,.46,.32]),
  PT('back','gem','m',tr,[0,.8,-.13],0,[.04,.05,.012])];
const quiverOf=(c,tr,fl)=>[PT('back','quiver','l',c,[.06,.1,-.135],[0,0,-.4],[.045,.34,.045]), PT('back','ring','m',tr,[.127,.255,-.135],[0,0,-.4],[.05,.18,.05]),
  PT('back','box','c',fl||'#ece4d2',[.13,.3,-.12],[0,0,-.4],[.008,.07,.022]), PT('back','box','c',fl||'#ece4d2',[.155,.29,-.15],[0,0,-.4],[.008,.07,.022]), PT('back','box','c',fl||'#ece4d2',[.11,.31,-.15],[0,0,-.4],[.008,.07,.022]),
  PT('back','strap','l',c,[0,-.2,0],0,1)];
// a long cape is cloth (25-loose-capes); a rider's is a stiff mantle over the saddle
const capeRider=(c,tr)=>[PT('back','capeR','c',c,[0,-.22,-.005],0,[.125,.6,.13]), PT('back','sph','m',tr||c,[.075,.06,.06],0,.02), PT('back','sph','m',tr||c,[-.075,.06,.06],0,.02)];
// barding (beast frames; the sizes are per beast, see BARD)
const bardOf=(c,c2,plate)=>[PT('mbk','drape','c',c,[0,0,0],0,1,{bd:'back'}), PT('mbk','drape','c',c2,[0,0,0],0,1,{bd:'hem'}),
  PT('mch','arcF','m',plate,[0,0,0],0,1,{bd:'chest'}), PT('mhd','domeD','m',plate,[0,0,0],0,1,{bd:'head'}), PT('mbk','gem','m',c2,[0,0,0],0,1,{bd:'badgeR'}), PT('mbk','gem','m',c2,[0,0,0],0,1,{bd:'badgeL'})];

/* ---------- moving bits (light, fire, sparks), drawn every frame ---------- */
const fxGlowRing=(c,n,y,r)=>C=>{ const t=game.time; for(let i=0;i<n;i++){ const a=i/n*ATAU+t; if(afPt(C,'head',Math.cos(a)*r,y,Math.sin(a)*r,_ar1)) glowAt(_ar1,.035*C.s,c); } };
const fxCrownFire=(c,n,y)=>C=>{ const t=game.time; for(let i=0;i<n;i++){ const a=i/n*ATAU; if(afPt(C,'head',Math.sin(a)*.97,y,Math.cos(a)*.97,_ar1)){ glowAt(_ar1,(.045+.015*Math.sin(t*13+i*2))*C.s,c); if(Math.random()<.04) emitFire(_ar1,1,.06*C.s,0,.8,0,.05,.35); } } };
const fxMane=C=>{ const t=game.time; for(let i=0;i<5;i++){ const a=-.5+i*.3; if(afPt(C,'head',0,Math.cos(a)*1.25+.08*Math.sin(t*11+i),-Math.sin(a)*1.25,_ar1)){ glowAt(_ar1,(.07+.02*Math.sin(t*9+i))*C.s,i%2?'#ff7a1a':'#ffcf4a'); if(Math.random()<.08) emitFire(_ar1,1,.08*C.s,0,1,0,.05,.4); } } };
const fxHalo=C=>{ if(Math.random()<.08&&afPt(C,'head',rand(-.7,.7),1.45,rand(-.7,.7),_ar1)) puff(_ar1,1,.03*C.s,.4,'#fff2b0'); };
const fxMotes=(c,n,r)=>C=>{ const t=game.time; for(let i=0;i<n;i++){ const a=t*(1.2+i*.13)+i*2.1; if(afPt(C,'back',Math.cos(a)*r,Math.sin(t*2+i)*.3,Math.sin(a)*r,_ar1)) glowAt(_ar1,.03*C.s,c); } };
const fxEmbers=c=>C=>{ if(Math.random()<.3){ const u=C.u; _ar1.copy(u.pos); _ar1.x+=rand(-.4,.4)*C.s; _ar1.z+=rand(-.4,.4)*C.s; _ar1.y=(C.rider?C.j.pelvis.y-.4*C.s:u.pos.y)+.05; puff(_ar1,1,.06,.9,c); } };
const fxEyes=(c,y,z,x)=>C=>{ for(const sd of [-1,1]) if(afPt(C,'head',sd*x,y,z,_ar1)) glowAt(_ar1,.032*C.s,c); };
const fxLantern=c=>C=>{ if(afPt(C,'hang',0,-.14,0,_ar1)) glowAt(_ar1,(.1+.02*Math.sin(game.time*7))*C.s,c); };
const fxBloom=C=>{ if(afPt(C,'head',.72,.62,.42,_ar1)) glowAt(_ar1,.045*C.s,'#e8d0ff'); };
// a weapon enchantment runs the length of the blade, the shaft or the bow
const fxEnchant=(c,fire)=>C=>{ const u=C.u, G=!C.rider&&u.G; let g=null;
  if(G){ g=G.w&&!G.w.dropped&&G.w.visible!==false?G.w:(G.o&&!G.o.dropped&&u.type==='archer'?G.o:null); }
  if(g){ g.updateMatrixWorld(); const bow=g===G.o;
    for(let i=0;i<7;i++){ if(bow){ const t=(i/6-.5)*BOW_A; _ar1.set(0,BOW_R*Math.sin(t),BOW_R*Math.cos(t)-BOW_R); } else _ar1.set(0,.22+i*.13,0); _ar1.applyMatrix4(g.matrixWorld);
      glowAt(_ar1,(.022+.008*Math.sin(game.time*9+i*1.7))*C.s,c); if(fire&&Math.random()<.03) emitFire(_ar1,1,.045*C.s,0,.7,0,.04,.3); else if(Math.random()<.015) puff(_ar1,1,.02*C.s,.3,c); } return; }
  if(C.wd) for(let i=0;i<7;i++){ _ar1.copy(C.j.hR).addScaledVector(C.wd,(.3+i*.28)*C.s); glowAt(_ar1,(.026+.008*Math.sin(game.time*9+i*1.7))*C.s,c); if(fire&&Math.random()<.03) emitFire(_ar1,1,.045*C.s,0,.7,0,.04,.3); } };

/* ---------- the catalogue ---------- */
// cloth: a cape that hangs and swings ({c colour, len, w}); fx: moving light; hideH: covers the soldier's own headgear
const O_ST='#9aa3ad', O_GD='#e2ae35', O_BL='#2a4aa8', O_RD='#8a1c1c', C_IR='#3a3236', C_BN='#e6dabd', C_BL='#8a1a14', W_BK='#5a3e24', W_LF='#3f7a2a', W_SV='#d0d8e0', W_GD='#d8b048';
const ARM_ITEMS=[
  // ---- Order ----
  {id:'o_greathelm',cat:'helm',fac:'order',name:'Great Helm',hideH:1,P:greatHelm(O_ST,O_GD)},
  {id:'o_winghelm',cat:'helm',fac:'order',name:'Winged Helm',hideH:1,P:openHelm(O_ST,O_GD).concat([PT('head','wing','m','#f2eee4',[1.04,.28,-.12],[0,0,-.22],[1,.95,.95]),PT('head','wing','m','#f2eee4',[-1.04,.28,-.12],[0,0,.22],[1,.95,.95])])},
  {id:'o_circlet',cat:'helm',fac:'order',name:'Royal Circlet',hideH:1,P:circlet(O_GD,'#7ab8ff',5)},
  {id:'o_plume',cat:'crest',fac:'order',name:'Crimson Plume',P:plumeOf('#b02a2a',O_GD)},
  {id:'o_feather',cat:'crest',fac:'order',name:'White Feathers',P:feathersOf('#f4f0e6')},
  {id:'o_pauld',cat:'shoulders',fac:'order',name:'Plate Pauldrons',P:pauldron(O_ST,O_ST,O_GD)},
  {id:'o_gpauld',cat:'shoulders',fac:'order',name:'Gilded Pauldrons',P:pauldron(O_GD,O_GD,O_ST).concat(SIDES('pa','sph','m',O_ST,[.105,-.01,0],0,.016))},
  {id:'o_breast',cat:'chest',fac:'order',name:'Breastplate',P:plates(O_ST).concat(trims(O_GD),tassets(O_ST,O_GD),[PT('torso','box','m',O_ST,[0,.4,.131],0,[.012,.24,.012]),PT('torso','gem','m',O_GD,[0,.48,.137],0,[.024,.024,.008])])},
  {id:'o_tabard',cat:'chest',fac:'order',name:'Royal Tabard',P:plates(O_BL,'c',1.03).concat(trims(O_GD,'m'),tassets(O_BL,O_GD,'c'),[PT('torso','box','m',O_GD,[0,.41,.138],0,[.016,.17,.006]),PT('torso','box','m',O_GD,[0,.46,.137],0,[.085,.016,.006])])},
  {id:'o_cape',cat:'cape',fac:'order',name:'Royal Cape',long:1,cloth:{c:O_BL,len:1.05,w:.36},P:[PT('torso','sph','m',O_GD,[.072,.6,.07],0,.02),PT('torso','sph','m',O_GD,[-.072,.6,.07],0,.02)],RP:capeRider(O_BL,O_GD)},
  {id:'o_halfcape',cat:'cape',fac:'order',name:'Half Cloak',cloth:{c:O_RD,len:.62,w:.34},P:[PT('torso','sph','m',O_GD,[.072,.6,.07],0,.018)],RP:capeRider(O_RD,O_GD)},
  {id:'o_gaunt',cat:'gloves',fac:'order',name:'Gauntlets',P:gauntlets(O_ST,O_GD)},
  {id:'o_belt',cat:'belt',fac:'order',name:'Sword Belt',P:beltOf('#4a2e1a',O_GD)},
  {id:'o_greaves',cat:'boots',fac:'order',name:'Greaves',P:greaves(O_ST,O_GD)},
  {id:'o_holy',cat:'weapon',fac:'order',name:'Holy Light',fx:fxEnchant('#ffe08a')},
  {id:'o_frost',cat:'weapon',fac:'order',name:'Frostbrand',fx:fxEnchant('#9ae0ff')},
  {id:'o_buckler',cat:'offhand',fac:'order',name:'Buckler',off:1,P:buckler(O_ST,O_GD)},
  {id:'o_kite',cat:'offhand',fac:'order',name:'Kite Shield',off:1,P:kiteOf(O_BL,O_GD)},
  {id:'o_banner',cat:'back',fac:'order',name:'Standard',bulky:1,P:bannerOf('#6a4a2a',O_BL,O_GD)},
  {id:'o_quiver',cat:'back',fac:'order',name:'Quiver',bulky:1,P:quiverOf('#6a4428',O_GD)},
  {id:'o_halo',cat:'trinket',fac:'order',name:'Halo',P:[PT('head','ringT','g','#fff2b0',[0,1.45,0],[.15,0,0],[.72,1.5,.72])],fx:fxHalo},
  {id:'o_bard',cat:'mount',fac:'order',name:'Royal Barding',P:bardOf(O_BL,O_GD,O_ST)},
  // ---- Chaos ----
  {id:'c_horned',cat:'helm',fac:'chaos',name:'Horned Helm',hideH:1,P:greatHelm(C_IR,'#5a4a4e','#ff3a1a',1).concat(horns(C_BN))},
  {id:'c_skull',cat:'helm',fac:'chaos',name:'Skull Mask',hideH:1,P:[PT('head','skull','l',C_BN,[0,.02,.02],0,[1.1,1.08,1.12]),PT('head','sph','m','#120c0c',[.36,.12,.93],0,[.22,.2,.12]),PT('head','sph','m','#120c0c',[-.36,.12,.93],0,[.22,.2,.12]),
    PT('head','cone','m','#120c0c',[0,-.16,1.06],[Math.PI,0,0],[.09,.16,.05])].concat([-2,-1,0,1,2].map(i=>PT('head','box','l','#f4ecd8',[i*.13,-.5,1.0-Math.abs(i)*.04],[0,i*.12,0],[.09,.16,.06]))),fx:fxEyes('#ff3a1a',.12,1.0,.36)},
  {id:'c_ember',cat:'helm',fac:'chaos',name:'Ember Crown',hideH:1,P:crownOf(C_IR,7,.42),fx:fxCrownFire('#ff5a1a',7,.86)},
  {id:'c_spikes',cat:'crest',fac:'chaos',name:'Iron Spikes',P:spikeRow('#2a2226',5)},
  {id:'c_flame',cat:'crest',fac:'chaos',name:'Flame Mane',P:spikeRow('#4a2a1a',4).map(p=>Object.assign(p,{sc:[p.sc[0]*.7,p.sc[1]*.45,p.sc[2]*.7]})),fx:fxMane},
  {id:'c_spauld',cat:'shoulders',fac:'chaos',name:'Spiked Pauldrons',P:pauldron(C_IR,C_IR,C_BL).concat(SIDES('pa','cone','l',C_BN,[.06,.08,0],[0,0,-.5],[.022,.14,.022]),SIDES('pa','cone','l',C_BN,[.07,.06,.05],[.5,0,-.7],[.018,.11,.018]),SIDES('pa','cone','l',C_BN,[.07,.06,-.05],[-.5,0,-.7],[.018,.11,.018]))},
  {id:'c_bpauld',cat:'shoulders',fac:'chaos',name:'Bone Pauldrons',P:SIDES('pa','sph','l',C_BN,[.05,.02,0],[0,0,-.3],[.085,.07,.09]).concat(SIDES('pa','sph','m','#120c0c',[.1,.035,.045],0,[.018,.02,.012]),SIDES('pa','sph','m','#120c0c',[.1,.035,-.045],0,[.018,.02,.012]),SIDES('pa','cone','l',C_BN,[.07,.08,0],[0,0,-.9],[.02,.12,.02]))},
  {id:'c_cuirass',cat:'chest',fac:'chaos',name:'Spiked Cuirass',P:plates(C_IR).concat(trims(C_BL),tassets(C_IR,C_BL),[PT('torso','cone','l',C_BN,[.045,.47,.13],[Math.PI/2,0,0],[.018,.07,.018]),PT('torso','cone','l',C_BN,[-.045,.47,.13],[Math.PI/2,0,0],[.018,.07,.018]),PT('torso','cone','l',C_BN,[0,.33,.13],[Math.PI/2,0,0],[.016,.06,.016])])},
  {id:'c_rib',cat:'chest',fac:'chaos',name:'Rib Plate',P:plates(C_IR).concat([.24,.31,.38,.45,.52].map((y,i)=>PT('torso','ribArc','l',C_BN,[0,y,0],0,[.124-Math.abs(i-2.5)*.003,.16,.134])),[PT('torso','box','l',C_BN,[0,.38,.137],0,[.022,.3,.012])])},
  {id:'c_shroud',cat:'cape',fac:'chaos',name:'Tattered Shroud',long:1,cloth:{c:'#1a1012',len:1.15,w:.34},P:[PT('torso','sph','l',C_BN,[.072,.6,.07],0,.022)],RP:capeRider('#1a1012',C_BN)},
  {id:'c_blood',cat:'cape',fac:'chaos',name:'Blood Cloak',cloth:{c:'#6a1210',len:.78,w:.36},P:[PT('torso','sph','m',C_IR,[.072,.6,.07],0,.02)],RP:capeRider('#6a1210',C_IR)},
  {id:'c_claws',cat:'gloves',fac:'chaos',name:'Clawed Gauntlets',P:gauntlets(C_IR,C_BL).concat(SIDES('hd','cone','l',C_BN,[.025,.09,.02],[.2,0,0],[.012,.1,.012]),SIDES('hd','cone','l',C_BN,[0,.1,.028],[.25,0,0],[.012,.11,.012]),SIDES('hd','cone','l',C_BN,[-.025,.09,.02],[.2,0,0],[.012,.1,.012]),
    SIDES('fa','cone','l',C_BN,[.066,.55,0],[0,0,-Math.PI/2],[.014,.07,.014]),SIDES('fa','cone','l',C_BN,[.066,.75,0],[0,0,-Math.PI/2],[.014,.07,.014]))},
  {id:'c_chainbelt',cat:'belt',fac:'chaos',name:'Chain Belt',P:Array.from({length:12},(_,i)=>{ const a=i/12*ATAU; return PT('torso','link','m',C_IR,[Math.sin(a)*.092,.1,Math.cos(a)*.096],[i%2?Math.PI/2:0,a,0],[.026,.016,.016]); }).concat([PT('torso','sph','l',C_BN,[0,.1,.105],0,[.026,.03,.02])]),
    fx:C=>{ for(const sd of [-1,1]) if(afPt(C,'torso',sd*.009,.105,.124,_ar1)) glowAt(_ar1,.008*C.s,'#ff5a1a'); }},
  {id:'c_sabaton',cat:'boots',fac:'chaos',name:'Iron Sabatons',P:greaves('#2a2226',C_BL).concat(SIDES('sn','cone','l',C_BN,[0,.04,.08],[Math.PI/2+.3,0,0],[.02,.1,.02],{leg:1}))},
  {id:'c_hellfire',cat:'weapon',fac:'chaos',name:'Hellfire',fx:fxEnchant('#ff6a1a',1)},
  {id:'c_venom',cat:'weapon',fac:'chaos',name:'Venom',fx:fxEnchant('#8aff3a',1)},
  {id:'c_totem',cat:'offhand',fac:'chaos',name:'Skull Totem',off:1,P:[PT('hang','cylC','l','#3a2a1a',[0,.06,0],0,[.012,.4,.012]),PT('hang','sph','l',C_BN,[0,.3,0],0,[.07,.075,.075]),
    PT('hang','sph','m','#120c0c',[.026,.31,.055],0,.016),PT('hang','sph','m','#120c0c',[-.026,.31,.055],0,.016),PT('hang','ring','m',C_IR,[0,.22,0],0,[.02,.04,.02])],
    fx:C=>{ for(const sd of [-1,1]) if(afPt(C,'hang',sd*.026,.31,.07,_ar1)) glowAt(_ar1,.016*C.s,'#ff3a1a'); }},
  {id:'c_targe',cat:'offhand',fac:'chaos',name:'Iron Targe',off:1,P:buckler('#2a2226',C_BL).map(p=>Object.assign({},p,{sc:p.sc.map(v=>v*1.15)})).concat([PT('shield','cone','m',C_BN,[0,0,.07],[Math.PI/2,0,0],[.025,.1,.025])])},
  {id:'c_spine',cat:'back',fac:'chaos',name:'Spine Ridge',P:[0,1,2,3,4].map(i=>PT('back','sph','l',C_BN,[0,.04-i*.12,-.115],0,[.026,.022,.022])).concat([0,1,2,3,4].map(i=>PT('back','cone','l',C_BN,[0,.06-i*.12,-.15],[-Math.PI/2-.4,0,0],[.02,.13-i*.012,.02])))},
  {id:'c_banner',cat:'back',fac:'chaos',name:'War Standard',bulky:1,P:bannerOf('#2a2226',C_BL,C_BN,1).concat([PT('back','sph','l',C_BN,[0,1.16,-.135],0,[.04,.045,.045])])},
  {id:'c_embers',cat:'trinket',fac:'chaos',name:'Ember Aura',fx:fxEmbers('#ff6a1a')},
  {id:'c_chains',cat:'mount',fac:'chaos',name:'Infernal Chains',P:Array.from({length:24},(_,i)=>PT('mbk','link','m',C_IR,[0,0,0],0,1,{bd:'chain',i}))},
  {id:'c_bard',cat:'mount',fac:'chaos',name:'Blood Barding',P:bardOf('#6a1210',C_IR,C_IR)},
  // ---- Wildlands ----
  {id:'w_leaf',cat:'helm',fac:'wild',name:'Leaf Crown',hideH:1,P:[PT('head','ringT','l','#6a4a2a',[0,.4,0],0,[1.0,2,1.0])].concat(Array.from({length:9},(_,i)=>{ const a=i/9*ATAU; return PT('head','leaf','c',['#4f8a2a','#6aa83a','#3a6a22'][i%3],[Math.sin(a)*1.0,.38,Math.cos(a)*1.0],[.42,a,0],[.34,.46,.4]); }))},
  {id:'w_antler',cat:'helm',fac:'wild',name:'Antler Circlet',hideH:1,P:[PT('head','ringT','m',W_GD,[0,.36,0],[-.1,0,0],[1.0,1.4,1.04]),PT('head','gem','g','#9aff9a',[0,.36,1.04],0,[.08,.1,.05]),PT('head','antR','l','#d8c8a0',[0,0,0],0,1),PT('head','antL','l','#d8c8a0',[0,0,0],0,1)]},
  {id:'w_cowl',cat:'helm',fac:'wild',name:'Hooded Cowl',hood:1,hideH:1,P:[PT('head','hood','c','#2f5a2a',[0,.06,-.06],0,[1.2,1.22,1.2]),PT('head','cone','c','#2f5a2a',[0,.75,-.85],[-1.9,0,0],[.35,.6,.25]),PT('torso','mantle','c','#2f5a2a',[0,.57,0],0,[.15,.13,.15])]},
  {id:'w_feather',cat:'crest',fac:'wild',name:'Hawk Feathers',P:[PT('head','feather','c','#8a6a3a',[-.62,.75,-.62],[-.7,-.75,.25],[.55,1.2,1]),PT('head','feather','c','#f0e8d8',[-.72,.62,-.5],[-.6,-.95,.35],[.5,1.0,1]),PT('head','feather','c','#5a4024',[-.5,.85,-.7],[-.8,-.55,.15],[.5,1.1,1])]},
  {id:'w_bloom',cat:'crest',fac:'wild',name:'Moonbloom',P:[PT('head','bloom','c','#d8b8ff',[.72,.62,.42],[-.6,1.05,0],[.5,.5,.5]),PT('head','leaf','c','#3a6a22',[.62,.5,.3],[.4,1.6,-.6],[.35,.5,.4])],fx:fxBloom},
  {id:'w_bark',cat:'shoulders',fac:'wild',name:'Bark Pauldrons',P:pauldron(W_BK,'#4a3220',W_LF).concat(SIDES('pa','leaf','c','#6aa83a',[.03,.08,0],[-.5,0,-.6],[.07,.09,.08]))},
  {id:'w_leafp',cat:'shoulders',fac:'wild',name:'Leaf Mantle',P:SIDES('pa','leafFan','c','#4f8a2a',[.02,.03,0],[-Math.PI/2,0,-Math.PI/2-.25],[.1,.13,.1]).concat(SIDES('pa','leafFan','c','#6aa83a',[.04,0,0],[-Math.PI/2,0,-Math.PI/2-.6],[.09,.12,.09]))},
  {id:'w_vest',cat:'chest',fac:'wild',name:'Bark Vest',P:plates(W_BK,'l').concat(trims('#6a8a3a','c'),[PT('torso','leaf','c','#6aa83a',[0,.4,.134],[-.08,0,0],[.06,.09,.05])])},
  {id:'w_silver',cat:'chest',fac:'wild',name:'Silverleaf Mail',P:plates(W_SV).concat(trims(W_LF,'c'),tassets(W_SV,W_GD),[PT('torso','leaf','m',W_GD,[0,.4,.136],[-.08,0,0],[.06,.1,.05])])},
  {id:'w_cloak',cat:'cape',fac:'wild',name:'Forest Cloak',long:1,cloth:{c:'#2a4422',len:1.1,w:.36},P:[PT('torso','leaf','m',W_GD,[.07,.6,.075],[0,0,-.6],[.03,.04,.03])],RP:capeRider('#2a4422',W_GD)},
  {id:'w_leafcl',cat:'cape',fac:'wild',name:'Leaf Cape',cloth:{c:'#4f8a2a',len:.72,w:.34},P:[PT('torso','leaf','c','#6aa83a',[.07,.6,.075],[0,0,-.6],[.03,.04,.03])],RP:capeRider('#4f8a2a','#6aa83a')},
  {id:'w_wraps',cat:'gloves',fac:'wild',name:'Archer Wraps',P:SIDES('fa','bracer','c','#d8c4a0',[0,.64,0],0,[.058,.56,.058]).concat(SIDES('fa','ring','l','#6a4a2a',[0,.42,0],0,[.064,.16,.064]),SIDES('fa','ring','l','#6a4a2a',[0,.88,0],0,[.066,.16,.066]))},
  {id:'w_vine',cat:'belt',fac:'wild',name:'Vine Belt',P:[PT('torso','ring','c','#3a6a22',[0,.1,0],0,[.09,.1,.094]),PT('torso','gem','g','#ffd06a',[0,.1,.1],0,[.014,.018,.01])].concat([.8,2.2,3.9,5.3].map((a,i)=>PT('torso','leaf','c',i%2?'#6aa83a':'#4f8a2a',[Math.sin(a)*.098,.085,Math.cos(a)*.1],[2.6,a,0],[.032,.05,.04])))},
  {id:'w_boots',cat:'boots',fac:'wild',name:'Ranger Boots',P:bootsOf(W_BK,'#3a6a22')},
  {id:'w_moon',cat:'weapon',fac:'wild',name:'Moonlight',fx:fxEnchant('#d8e8ff')},
  {id:'w_thorn',cat:'weapon',fac:'wild',name:'Thornvenom',fx:fxEnchant('#8aff6a',1)},
  {id:'w_lantern',cat:'offhand',fac:'wild',name:'Spirit Lantern',off:1,P:[PT('hang','lantern','m','#3a2a1a',[0,-.14,0],0,[.06,.09,.06]),PT('hang','sph','g','#c8ffb0',[0,-.14,0],0,.03)],fx:fxLantern('#aaff8a')},
  {id:'w_buckler',cat:'offhand',fac:'wild',name:'Woven Buckler',off:1,P:[PT('shield','disc','l','#6a4a2a',[0,0,0],0,[.16,.16,.16]),PT('shield','ringZ','c','#3a6a22',[0,0,.004],0,[.16,.16,.16]),PT('shield','leaf','c','#4f8a2a',[0,-.05,.022],0,[.07,.11,.06])]},
  {id:'w_quiver',cat:'back',fac:'wild',name:'Elven Quiver',bulky:1,P:quiverOf('#4a3622',W_GD,'#9ad86a')},
  {id:'w_banner',cat:'back',fac:'wild',name:'Clan Banner',bulky:1,P:bannerOf(W_BK,'#3a6a22',W_GD).concat([PT('back','leaf','c','#9ad86a',[0,.8,-.165],[0,Math.PI,0],[.07,.12,.06])])},
  {id:'w_flies',cat:'trinket',fac:'wild',name:'Fireflies',fx:fxMotes('#ffe88a',5,.45)},
  {id:'w_vines',cat:'mount',fac:'wild',name:'Vine Wraps',P:Array.from({length:12},(_,i)=>PT('mbk','leaf','c',['#4f8a2a','#6aa83a','#3a6a22'][i%3],[0,0,0],0,1,{bd:'vine',i}))},
  {id:'w_bard',cat:'mount',fac:'wild',name:'Leaf Barding',P:bardOf('#3a6a22',W_BK,W_BK)},
];
const ARM_BY={}; for(const I of ARM_ITEMS) ARM_BY[I.id]=I;
const armMounted=t=>!!(TYPES[t]&&(TYPES[t].wyvern||TYPES[t].hadesRider));
// barding sizes, per beast: the back's half width and height above the spine, its length, the chest plate, the head plate
const BARD={knight:{w:.26,t:.29,len:.95,cz:-.05,cw:.25,hy:.3,hz:.3,hw:.16},hades:{w:.31,t:.3,len:1,cz:-.06,cw:.29,hy:.1,hz:.16,hw:.12},
  cerberus:{w:.31,t:.3,len:1,cz:-.06,cw:.29,hy:.1,hz:.16,hw:.12},hound:{w:.27,t:.3,len:.95,cz:-.06,cw:.25,hy:.12,hz:.16,hw:.12},crawler:{w:.27,t:.3,len:.95,cz:-.06,cw:.25,hy:.12,hz:.16,hw:.12}};
function bardMat(P,BK,out){ // a barding part's place, from the beast's size (measured off its body: half width w, top t above the spine)
  const bd=P.bd; let px=0,py=0,pz=0,sx=1,sy=1,sz=1,rx=0,ry=0,rz=P.r?P.r[2]:0;
  if(bd==='back'){ sx=BK.w*1.1; sy=BK.t*1.08; sz=BK.len; }
  else if(bd==='hem'){ py=-.012; sx=BK.w*1.15; sy=BK.t*1.13; sz=BK.len*.28; pz=-BK.len*.38; }
  else if(bd==='chest'){ pz=BK.cz; sx=BK.cw; sy=BK.cw*.85; sz=BK.cw; }
  else if(bd==='head'){ py=BK.hy; pz=BK.hz; sx=BK.hw; sy=BK.hw*.6; sz=BK.hw*1.5; rx=-.15; }
  else if(bd==='badgeR'||bd==='badgeL'){ const sd=bd==='badgeR'?1:-1; px=sd*BK.w*1.12; py=BK.t*.15; sx=.05; sy=.065; sz=.025; ry=sd*Math.PI/2; }
  else if(bd==='chain'){ const i=P.i, a=(i%12)/11, sd=i<12?1:-1, th=.95+.38*Math.sin(a*Math.PI); px=sd*BK.w*1.1*Math.sin(th); py=BK.t*1.06*Math.cos(th); pz=(a-.5)*BK.len*.9; sx=sy=sz=.042; rx=i%2?Math.PI/2:0; ry=Math.PI/2; rz=0; }   // a chain hanging along each flank
  else if(bd==='vine'){ const i=P.i, a=i/11, th=Math.sin(i*2.1)*1.2; px=BK.w*1.12*Math.sin(th); py=BK.t*1.1*Math.cos(th); pz=(a-.5)*BK.len*1.0; sx=.1; sy=.14; sz=.11; rx=-.4; ry=th+i; }
  _apq.setFromEuler(_ape.set(rx,ry,rz,'YXZ')); _apv.set(px,py,pz); _aps.set(sx,sy,sz); return out.compose(_apv,_apq,_aps); }

// why a piece can't go on (null if it can)
function armWhy(fac,type,I,L){
  if(I.fac!=='any'&&I.fac!==fac) return 'Belongs to another faction';
  const T=TYPES[type]; if(!T) return 'No such soldier';
  const mounted=armMounted(type), beast=T.crawler&&!mounted;
  if(I.cat==='mount') return T.crawler?null:'Only for a beast or a mount';
  if(beast) return I.cat==='trinket'?null:'A beast wears only barding and trinkets';
  if(type==='hades'&&!ARM_HADES[I.cat]) return 'Hades wears his own infernal armour';
  if(I.cat==='offhand'&&(ARM_NOOFF[type]||fac==='wild'&&type==='ninja')) return 'Both hands are busy';
  if((I.cat==='cape'||I.cat==='back')&&type==='wing') return 'The wings are in the way';
  if(I.cat==='crest'&&L.helm&&ARM_BY[L.helm]&&ARM_BY[L.helm].hood) return 'No room for a crest under a hood';
  if(I.hood&&L.crest) return 'Take the crest off first';
  if(I.cat==='back'&&I.bulky&&L.cape&&ARM_BY[L.cape]&&ARM_BY[L.cape].long) return 'Too bulky over a long cape';
  if(I.cat==='cape'&&I.long&&L.back&&ARM_BY[L.back]&&ARM_BY[L.back].bulky) return 'Your back piece is in the way';
  return null;
}
function armLoad(fac,type){ const A=settings.armory||{}; return (A[fac]&&A[fac][type])||{}; }
function armSet(fac,type,cat,id){ const A=settings.armory||(settings.armory={}); const F=A[fac]||(A[fac]={}); const L=F[type]||(F[type]={}); if(id) L[cat]=id; else delete L[cat]; ARM.ver++; saveSettings(); }
function armAny(){ const A=settings.armory; if(!A) return false; for(const f in A) for(const t in A[f]) for(const c in A[f][t]) return true; return false; }
// the kit a soldier wears (cached until a loadout changes)
function armKit(u,fac){
  if(u.armV===ARM.ver&&u.armF===fac) return u.armL;
  const L=armLoad(fac,u.type), out=[]; let cape=null, hideH=false, off=false, back=false;
  for(const [cat] of ARM_CATS){ const I=ARM_BY[L[cat]]; if(!I||armWhy(fac,u.type,I,L)) continue; out.push(I); if(I.cloth) cape=I; if(I.hideH) hideH=true; if(I.off) off=true; if(cat==='back') back=true; }
  u.armV=ARM.ver; u.armF=fac; u.armL=out; u.armHide={h:hideH,o:off,b:back,cape:!!cape};
  if(u.G&&!u.cr){ const vis=!(u.cloak&&u.alive); if(u.G.h&&!u.G.h.dropped) u.G.h.visible=vis; if(u.G.o&&!u.G.o.dropped&&u.type!=='archer') u.G.o.visible=vis; if(u.G.b&&!u.T.worker) u.G.b.visible=vis; }
  if(cape&&!u.cr&&!u.statue) armCapeFor(u,cape); else armCapeDrop(u);
  return out; }
function armHas(u,cat){ const L=u.armL; if(!L) return false; for(const I of L) if(I.cat===cat) return true; return false; }
// cloth capes: their own cloth meshes, one per cape in the catalogue, sharing the Spartan cape's simulation
function armCapeCol(kind){ const I=ARM_BY[kind.slice(1,-1)]||ARM_BY[kind.slice(1)]; return I&&I.cloth?I.cloth.c:'#444444'; }
function armCapeFor(u,I){
  if(u.armCape&&u.armCape.id===I.id) return; armCapeDrop(u);
  let cs=null; withOwnRandom(()=>{ cs=capeSet(u.team,'a'+I.id+'|'); }); if(!cs||!cs.free.length) return;
  const P=[]; for(let i=0;i<24;i++) P.push(new V3());
  u.armCape={u,cs,slot:cs.free.pop(),P,O:P.map(v=>v.clone()),init:false,t:0,w:I.cloth.w,len:I.cloth.len,back:u.type==='dread'?.22:.14,id:I.id}; capes.push(u.armCape);
  if(u.cape) u.cape.hide=true; }
function armCapeDrop(u){ const cp=u.armCape; if(!cp) return; freeCape(cp); const i=capes.indexOf(cp); if(i>=0) capes.splice(i,1); u.armCape=null; if(u.cape){ u.cape.hide=false; } }

// draw a soldier's kit (your own army; any soldier in the armoury). J/s/F/R: a rider's own skeleton on his mount.
const _arC={j:null,s:1,k:1,F:null,R:null,SP:new V3(),FL:new V3(),hr:.19,u:null,rider:false,wd:null};
function armDraw(u,J,s,F,R,mountOnly){
  if(!settings.armory||u.statue) return;
  if(!(game.mode==='viewer'&&ARM.on)&&u.team!==myTeam()) return;
  const fac=facOf(u.team), kit=armKit(u,fac); if(!kit.length) return;
  if(mountOnly&&!u.cr) return;
  const C=armCtx(u,J,s,F,R,mountOnly), rider=!!J;
  const BK=mountOnly?BARD[u.type]||BARD.crawler:null, robe=!!u.T.robe&&!rider;
  if(!mountOnly&&!rider&&u.G&&!u.cr){ const H=u.armHide; if(H.h&&u.G.h) u.G.h.visible=false; if(H.o&&u.G.o&&u.type!=='archer') u.G.o.visible=false; if(H.b&&u.G.b&&!u.T.worker) u.G.b.visible=false; }
  const beastPass=mountOnly&&!armMounted(u.type);
  for(const I of kit){
    if(mountOnly?!(I.cat==='mount'||beastPass&&I.cat==='trinket'):I.cat==='mount') continue;
    if(rider&&I.cat==='cape'&&I.RP){ armParts(C,I.RP,null,false); continue; }
    if(I.P) armParts(C,I.P,BK,robe);
    if(I.fx) I.fx(C);
  }
}
// the frames' context for one soldier (or a rider J/s/F/R on his mount, or the mount itself)
function armCtx(u,J,s,F,R,mountOnly){
  const C=_arC, rider=!!J; C.u=u; C.rider=rider;
  if(mountOnly){ C.j=u.j; C.s=u.s; C.k=1; C.F=u.fwdW; C.R=u.rightW; }
  else { C.j=J||u.j; C.s=s||u.s; C.k=rider?1:(u.thick||1); C.F=F||u.fwdW; C.R=R||u.rightW; }
  const j=C.j; if(!j||!j.neck) return null; C.SP.subVectors(j.neck,j.pelvis); if(C.SP.lengthSq()<1e-8) C.SP.copy(UP); C.SP.normalize();
  C.FL.copy(C.F); const lk=!rider&&u.alive?(u.look||0):0; if(lk) C.FL.multiplyScalar(Math.cos(lk)).addScaledVector(C.R,Math.sin(lk));
  C.hr=u.T.skel&&!rider?.14*C.s:(u.T.wild?.2:.19)*C.s*(rider?1:Math.min(1.08,.92+C.k*.08)); C.wd=rider?u.rdW||null:null;
  afN++; return C; }
function armParts(C,L,BK,robe){
  for(const P of L){ if(robe&&P.leg) continue; if(!P.M1) partCompile(P);
    const Fr=afGet(C,P.f); if(!Fr.ok) continue;
    if(!P.b) P.b=arBatch(P.g,P.m);
    if(P.bd){ bardMat(P,BK,_ar4m); _arM.multiplyMatrices(Fr.m,_ar4m); }
    else _arM.multiplyMatrices(Fr.m,Fr.sd>0?P.M1:P.M2);
    arPut(P.b,_arM,P.col); }
}
const _ar4m=new THREE.Matrix4();

/* ---------- the rooms ---------- */
function armRoom(fac,cx,cy,cz){
  const G=new THREE.Group(), L=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{})), M=(g,m,x,y,z)=>{ const o=new THREE.Mesh(g,m); o.position.set(x,y,z); o.receiveShadow=true; G.add(o); return o; };
  const R=22, Hh=14, P={order:{floor:'#8a8478',wall:'#6e6a62',ceil:'#4a4640',light:'#ffd8a0'},chaos:{floor:'#1e1a1c',wall:'#2a2224',ceil:'#140f10',light:'#ff6a3a'},wild:{floor:'#3e5a2a',wall:'#5a3e24',ceil:'#2a3a1e',light:'#c8ffb0'}}[fac];
  M(new THREE.CylinderGeometry(R,R,Hh,40,1,true),L(P.wall,{side:THREE.BackSide}),cx,cy+Hh/2,cz);
  const fl=M(new THREE.CircleGeometry(R,40),L(P.floor),cx,cy+.02,cz); fl.rotation.x=-Math.PI/2;
  const ce=M(new THREE.CircleGeometry(R,40),L(P.ceil,{side:THREE.BackSide}),cx,cy+Hh,cz); ce.rotation.x=-Math.PI/2;
  const ped=M(new THREE.CylinderGeometry(1.6,1.8,.12,32),L(fac==='order'?'#b8b2a4':fac==='chaos'?'#3a2a2a':'#6a4a2a'),cx,cy+.06,cz); ped.castShadow=false;
  const ring=(n,f)=>{ for(let i=0;i<n;i++){ const a=i/n*ATAU+.3; f(cx+Math.cos(a)*(R-1.2),cz+Math.sin(a)*(R-1.2),a,i); } };
  ARM.fx=[];
  if(fac==='order'){
    const carpet=M(new THREE.PlaneGeometry(2.6,R*1.6),L('#7a1a1a'),cx,cy+.03,cz); carpet.rotation.x=-Math.PI/2;
    ring(8,(x,z,a,i)=>{ M(new THREE.CylinderGeometry(.5,.6,Hh,12),L('#9a9488'),x,cy+Hh/2,z);
      if(i%2){ const b=M(new THREE.PlaneGeometry(1.4,3.2),L(i%4===1?'#2a4aa8':'#e2ae35',{side:THREE.DoubleSide}),cx+Math.cos(a)*(R-.3),cy+5,cz+Math.sin(a)*(R-.3)); b.rotation.y=-a+Math.PI/2; }
      else { const rk=M(new THREE.BoxGeometry(1.8,.12,.3),L('#5a3a22'),cx+Math.cos(a+.35)*(R-1.4),cy+1.6,cz+Math.sin(a+.35)*(R-1.4)); rk.rotation.y=-a-.35+Math.PI/2;
        for(let k=-1;k<=1;k++){ const sw=M(new THREE.BoxGeometry(.06,1.3,.02),L('#c8ced6'),rk.position.x+Math.cos(-a-.35+Math.PI/2)*k*.5,cy+1.1,rk.position.z-Math.sin(-a-.35+Math.PI/2)*k*.5); sw.rotation.y=rk.rotation.y; } }
      ARM.fx.push({k:'torch',p:new V3(x-Math.cos(a)*.7,cy+3.2,z-Math.sin(a)*.7)}); });
    for(let i=0;i<6;i++){ const a=i/6*ATAU; const sh=M(new THREE.CircleGeometry(.6,16),L(i%2?'#2a4aa8':'#c8ced6',{side:THREE.DoubleSide}),cx+Math.cos(a)*(R-.15),cy+3.6,cz+Math.sin(a)*(R-.15)); sh.rotation.y=-a-Math.PI/2; }
  } else if(fac==='chaos'){
    for(let i=0;i<10;i++){ const a=i/10*ATAU, l=M(new THREE.BoxGeometry(.35,.04,R-2.5),L('#c84a18',{emissive:'#7a2006'}),cx+Math.cos(a)*(R/2+.6),cy+.04,cz+Math.sin(a)*(R/2+.6)); l.rotation.y=-a+Math.PI/2; l.receiveShadow=false; }
    ring(6,(x,z,a,i)=>{ if(i%2===0){ M(new THREE.BoxGeometry(1.2,.7,.6),L('#2a2426'),x,cy+.85,z); M(new THREE.BoxGeometry(.6,.5,.5),L('#3a3236'),x,cy+.25,z); }
      else { M(new THREE.CylinderGeometry(.5,.3,1,10),L('#3a3236'),x,cy+.5,z); ARM.fx.push({k:'brazier',p:new V3(x,cy+1.05,z)}); }
      for(let k=0;k<6;k++){ const t=M(new THREE.TorusGeometry(.12,.03,5,10),L('#4a4246'),cx+Math.cos(a+.3)*(R-.5),cy+Hh-.4-k*.2,cz+Math.sin(a+.3)*(R-.5)); t.rotation.y=k%2?Math.PI/2:0; } });
    const forge=M(new THREE.BoxGeometry(3.4,3,1.8),L('#1a1416'),cx,cy+1.5,cz-(R-1.6)); M(new THREE.BoxGeometry(1.8,1,.1),L('#ff7a1a',{emissive:'#ff5a1a'}),cx,cy+1.1,cz-(R-2.55));
    ARM.fx.push({k:'forge',p:new V3(cx,cy+1.3,cz-(R-2.7))});
  } else {
    for(let i=0;i<12;i++){ const a=i/12*ATAU+.1, x0=cx+Math.cos(a)*(R-.3), z0=cz+Math.sin(a)*(R-.3), x1=cx+Math.cos(a)*(R-3), z1=cz+Math.sin(a)*(R-3);
      const r=M(new THREE.CylinderGeometry(.18,.45,Math.hypot(x1-x0,z1-z0)+1.5,8),L('#4a3220'),(x0+x1)/2,cy+1.2,(z0+z1)/2); r.lookAt(x1,cy,z1); r.rotateX(Math.PI/2.4); }
    ring(9,(x,z,a,i)=>{ const st=M(new THREE.CylinderGeometry(.08,.12,.6,6),L('#e8dcc0'),x,cy+.3,z); const cap=M(new THREE.SphereGeometry(.4,10,6,0,ATAU,0,Math.PI/2),L(i%2?'#7a3aaa':'#3a8aaa',{emissive:i%2?'#3a1a5a':'#1a4a5a'}),x,cy+.6,z);
      ARM.fx.push({k:'shroom',p:new V3(x,cy+.8,z),c:i%2?'#c08aff':'#7ae0ff'}); ARM.fx.push({k:'lantern',p:new V3(cx+Math.cos(a+.35)*(R-2.5),cy+4+Math.sin(i)*.8,cz+Math.sin(a+.35)*(R-2.5))}); });
    for(let i=0;i<10;i++){ const a=rand(0,ATAU), d=rand(2.5,R-2), m=M(new THREE.CircleGeometry(rand(.6,1.4),10),L('#4f7a2a'),cx+Math.cos(a)*d,cy+.04,cz+Math.sin(a)*d); m.rotation.x=-Math.PI/2; }
    for(let i=0;i<3;i++){ const a=i/3*ATAU+.9, sx=cx+Math.cos(a)*(R-2.2), sz=cz+Math.sin(a)*(R-2.2); M(new THREE.BoxGeometry(.15,2.2,.15),L('#6a4a2a'),sx,cy+1.1,sz);
      const b=M(new THREE.PlaneGeometry(.9,1.6),L('#3a6a22',{side:THREE.DoubleSide}),sx,cy+1.6,sz+.1); b.rotation.y=-a; }
  }
  const pl=new THREE.PointLight(P.light,.55,R*2.2,1.6); pl.position.set(cx,cy+Hh-2,cz); G.add(pl);
  G.traverse(o=>{ if(o.isMesh) o.castShadow=false; });
  scene.add(G); return G;
}
function armFrame(){
  if(!ARM.on||game.mode!=='viewer') return; const t=game.time;
  for(const f of ARM.fx){
    if(f.k==='torch'){ glowAt(f.p,.3+.05*Math.sin(t*13+f.p.x),'#ffb04a'); if(Math.random()<.3) emitFire(f.p,1,.18,0,1.4,0,.15,.4); }
    else if(f.k==='brazier'){ if(Math.random()<.7) emitFire(f.p,1,.3,rand(-.2,.2),2,rand(-.2,.2),.3,.6); glowAt(f.p,.5,'#ff6a1a'); }
    else if(f.k==='forge'){ glowAt(f.p,.9+.15*Math.sin(t*4),'#ff7a1a'); if(Math.random()<.5) puff(f.p,1,.12,1.2,'#ff9a3a'); }
    else if(f.k==='shroom'){ glowAt(f.p,.22+.05*Math.sin(t*2+f.p.z),f.c); }
    else if(f.k==='lantern'){ glowAt(f.p,.26+.04*Math.sin(t*3+f.p.x),'#c8ffb0'); }
  }
}

/* ---------- opening and closing; the panel ---------- */
function armOpen(fac){
  closeMenu(); game.campFight=null; setTerrain('skirmish');
  ARM.on=true; ARM.fac=fac||settings.side||'order'; setFactions(ARM.fac);
  const R=FACTIONS[ARM.fac].roster.filter(t=>TYPES[t]&&!TYPES[t].worker); ARM.type=R.includes(ARM.type)?ARM.type:R[0]; game.duelSel=ARM.type;
  setMode('viewer');
}
// called by resetViewer: the room around the turntable, the soldier on its floor
function armAfterReset(u){
  if(!ARM.on) return;
  const cy=H(u.pos.x,u.pos.z)+.12;
  if(!ARM.env||ARM.envFac!==ARM.fac){ armDropRoom(); ARM.env=armRoom(ARM.fac,u.pos.x,cy-.12,u.pos.z); ARM.envFac=ARM.fac; }
  u.gy=cy; u.pos.y=cy; if(u.cr) crPlace(u); for(const ft of u.feet||[]) ft.pos.y=cy;
  const vw=$('#viewer'); if(vw) vw.hidden=true; const av=$('#vLab'); if(av) av.hidden=true;
  armPanel(true);
}
function armDropRoom(){ if(ARM.env){ scene.remove(ARM.env); ARM.env.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); ARM.env=null; ARM.envFac=null; ARM.fx=[]; } }
function armClose(){ if(!ARM.on) return; ARM.on=false; armDropRoom(); armPanel(false); const av=$('#vLab'); if(av) av.hidden=false; }
// a full kit: one piece in every slot that takes one (random, or the first of each)
function armFullSet(fac,type,rnd){
  const A=settings.armory||(settings.armory={}); const F=A[fac]||(A[fac]={}); const L=F[type]={};
  for(const [c] of ARM_CATS){ const ok=ARM_ITEMS.filter(I=>I.cat===c&&I.fac===fac&&!armWhy(fac,type,I,L)); if(ok.length) L[c]=(rnd?ok[Math.floor(Math.random()*ok.length)]:ok[0]).id; }
  ARM.ver++; saveSettings(); return L; }
function armPanel(show){
  let P=document.getElementById('armory');
  if(!show){ if(P) P.hidden=true; return; }
  if(!P&&!(document.body&&document.body.appendChild)) return;
  if(!P){ P=document.createElement('aside'); P.id='armory'; P.className='viewer armory'; P.setAttribute('aria-label','Armory'); document.body.appendChild(P); }
  P.hidden=false; P.classList.toggle('chaos',ARM.fac==='chaos'); P.classList.toggle('wild',ARM.fac==='wild');
  const fac=ARM.fac, type=ARM.type, L=armLoad(fac,type), roster=FACTIONS[fac].roster.filter(t=>TYPES[t]&&!TYPES[t].worker);
  const cats=ARM_CATS.filter(([c])=>ARM_ITEMS.some(I=>I.cat===c&&!armWhy(fac,type,I,{}))).map(([c,n])=>[c,c==='mount'&&!armMounted(type)?'Barding':c==='mount'?'Mount':n]);
  if(!cats.some(([c])=>c===ARM.cat)) ARM.cat=cats.length?cats[0][0]:'helm';
  const items=ARM_ITEMS.filter(I=>I.cat===ARM.cat&&I.fac===fac);
  P.innerHTML='<div class="vw-fac">'+vwEsc(FACTIONS[fac].name)+' · '+ARM_ENV[fac]+'</div><h2>Armory</h2>'+
    '<div class="arm-row arm-facs">'+['order','chaos','wild'].map(f=>'<button data-f="'+f+'" aria-pressed="'+(f===fac)+'">'+({order:'Order',chaos:'Chaos',wild:'Wildlands'})[f]+'</button>').join('')+'</div>'+
    '<div class="arm-row arm-units">'+roster.map(t=>'<button data-t="'+t+'" aria-pressed="'+(t===type)+'">'+vwEsc(tName(t,0))+'</button>').join('')+'</div>'+
    '<div class="arm-row arm-cats">'+cats.map(([c,n])=>'<button data-c="'+c+'" aria-pressed="'+(c===ARM.cat)+'">'+n+(L[c]?' ●':'')+'</button>').join('')+'</div>'+
    '<div class="arm-items"><button data-i="" aria-pressed="'+(!L[ARM.cat])+'"><b>None</b></button>'+items.map(I=>{ const why=armWhy(fac,type,I,Object.assign({},L,{[I.cat]:undefined}));
      return '<button data-i="'+I.id+'" aria-pressed="'+(L[I.cat]===I.id)+'"'+(why?' disabled title="'+vwEsc(why)+'"':'')+'><b>'+vwEsc(I.name)+'</b>'+(why?'<small>'+vwEsc(why)+'</small>':'')+'</button>'; }).join('')+'</div>'+
    '<p class="vw-count">'+Object.keys(L).length+' of '+ARM_CATS.length+' slots filled · worn by your '+vwEsc(tPl(type,0))+' in every battle · for looks only</p>'+
    (ARP.open?armTradeHTML(fac,type):'')+
    '<div class="arm-row"><button id="armFull">Full set</button><button id="armClear">Strip the kit</button><button id="armTrade" aria-pressed="'+ARP.open+'">Sets and profiles</button><button id="armBack">Back to the menu</button></div>';
  for(const b of qsa(P,'button[data-f]')) b.onclick=()=>{ sfx('ui'); armOpen(b.dataset.f); };
  for(const b of qsa(P,'button[data-t]')) b.onclick=()=>{ sfx('ui'); ARM.type=b.dataset.t; game.duelSel=ARM.type; resetViewer(); };
  for(const b of qsa(P,'button[data-c]')) b.onclick=()=>{ sfx('ui'); ARM.cat=b.dataset.c; armPanel(true); };
  for(const b of qsa(P,'button[data-i]')) b.onclick=()=>{ if(b.disabled) return; sfx(b.dataset.i?'armoryEquip':'ui'); armSet(fac,type,ARM.cat,b.dataset.i); armPanel(true); };
  const cl=P.querySelector&&P.querySelector('#armClear'); if(cl) cl.onclick=()=>{ sfx('ui'); const A=settings.armory; if(A&&A[fac]) delete A[fac][type]; ARM.ver++; saveSettings(); armPanel(true); };
  const fu=P.querySelector&&P.querySelector('#armFull'); if(fu) fu.onclick=()=>{ sfx('armoryForge'); armFullSet(fac,type,true); armPanel(true); };
  const tr=P.querySelector&&P.querySelector('#armTrade'); if(tr) tr.onclick=()=>{ sfx('ui'); ARP.open=!ARP.open; armPanel(true); };
  if(ARP.open) armTradeWire(P,fac,type);   // profiles, trading and share codes (40e)
  const bk=P.querySelector&&P.querySelector('#armBack'); if(bk) bk.onclick=()=>{ sfx('ui'); armClose(); openMenu(); };
}
