/* ---------------- instanced stick bodies ---------------- */
const MAXC=6000, MAXS=2400, MAXD=500, MAXB=480;
// Glossy black "ink" bodies: Phong gives the soft sheen the 2D game paints on its sticks.
const bodyMat=new THREE.MeshPhongMaterial({color:'#ffffff',specular:'#4a4540',shininess:38});
const limbIM=new THREE.InstancedMesh(new THREE.CylinderGeometry(.84,1,1,9,1,true),bodyMat,MAXC*2);   // tapers toward hand/foot
const torsoIM=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,.8,1,14,1,true),bodyMat,MAXC/2);    // broad at shoulders
const sphIM=new THREE.InstancedMesh(new THREE.SphereGeometry(1,14,10),bodyMat,MAXS);          // heads
const jointIM=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,5),bodyMat,MAXS*5);        // joints and feet: far fewer triangles
const strIM=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,3,1,true),new THREE.MeshBasicMaterial({color:'#efe6d2'}),MAXB*3);
const dbgIM=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),new THREE.MeshBasicMaterial({color:'#ffffff',depthTest:false,transparent:true,opacity:.9}),MAXD);
const barIM=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:'#ffffff',depthWrite:false,fog:false}),MAXB*4);   // up to 3 bars per soldier (back, health, morale)
dbgIM.renderOrder=10; barIM.renderOrder=9;
const WHITE=new THREE.Color(1,1,1);
for(const im of [limbIM,torsoIM,sphIM,jointIM,strIM,dbgIM,barIM]){
  im.userData.cap=im.count;   // fixed capacity; .count is only how many we draw this frame
  for(let i=0;i<im.count;i++) im.setColorAt(i,WHITE);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled=false; scene.add(im);
}
limbIM.castShadow=torsoIM.castShadow=sphIM.castShadow=jointIM.castShadow=true;
const CNT=new Map([[limbIM,0],[torsoIM,0],[sphIM,0],[jointIM,0],[strIM,0],[dbgIM,0],[barIM,0]]);
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_s=new V3(),_p=new V3(),_d=new V3();
function put(im,col){ const i=CNT.get(im); if(i>=im.userData.cap) return; im.setMatrixAt(i,_m); im.setColorAt(i,col); CNT.set(im,i+1); }
function cyl(a,b,r,col,im){ _d.subVectors(b,a); const len=_d.length(); if(len<1e-4)return;
  _p.addVectors(a,b).multiplyScalar(.5); _q.setFromUnitVectors(UP,_d.multiplyScalar(1/len)); _s.set(r,len,r);
  _m.compose(_p,_q,_s); put(im||limbIM,col); }
const _qi=new THREE.Quaternion();
function sph(p,r,col,im){ _s.set(r,r,r); _m.compose(p,_qi,_s); put(im||sphIM,col); }
function blob(p,q,sx,sy,sz,col){ _s.set(sx,sy,sz); _m.compose(p,q,_s); put(jointIM,col); }

/* ---------------- materials / colors ---------------- */
const lam=c=>new THREE.MeshLambertMaterial({color:c});
const M={steel:lam('#c9ccd1'),wood:lam('#6a4a2c'),dark:lam('#2b2520'),stone:lam('#a39784'),stoneD:lam('#7f7464'),gold:lam('#e3b03a'),cloth:lam('#c5a259'),leather:lam('#5b3b22')};
const TEAM=[
  {cape:'#a3131b',bronze:new THREE.MeshPhongMaterial({color:'#c08a30',specular:'#ffe2a0',shininess:55,side:THREE.DoubleSide}),crest:lam('#b3121a'),lambda:lam('#8f1016'),body:new THREE.Color('#0b0b0c'),bar:new THREE.Color('#3bdc3b'),acc:lam('#e2ae35'),acc2:lam('#f2d27a'),name:'Gold Legion'},
  {cape:'#3d1748',bronze:new THREE.MeshPhongMaterial({color:'#6e5a44',specular:'#c9b08a',shininess:40,side:THREE.DoubleSide}),crest:lam('#4a2470'),lambda:lam('#c0405a'),body:new THREE.Color('#23101a'),bar:new THREE.Color('#e8473f'),acc:lam('#7d2a8a'),acc2:lam('#c0405a'),name:'Crimson Horde'},
];
const STONE_C=new THREE.Color('#a89b86');
const DBG={plant:new THREE.Color('#38d36b'),step:new THREE.Color('#ffb020'),hand:new THREE.Color('#34c6ff'),pole:new THREE.Color('#ff4d6d')};

/* ---------------- shared geometries ---------------- */
const GEO={
  blade:new THREE.BoxGeometry(.065,.82,.014), guard:new THREE.BoxGeometry(.22,.035,.04), pommel:new THREE.SphereGeometry(.035,8,6),
  band:(()=>{const g=new THREE.TorusGeometry(.205,.03,8,22); g.rotateX(Math.PI/2); return g;})(),
  tail:new THREE.BoxGeometry(.03,.16,.012),
  shaft:new THREE.CylinderGeometry(.022,.022,2.1,6), tip:new THREE.ConeGeometry(.05,.24,6),
  // Spartan hoplite kit: Corinthian helmet, aspis with lambda, dory with sauroter
  helmDome:new THREE.SphereGeometry(.218,18,12,0,Math.PI*2,0,Math.PI*.56),
  helmSide:new THREE.CylinderGeometry(.212,.198,.17,22,1,true,.62,Math.PI*2-1.24),
  helmCheek:new THREE.BoxGeometry(.085,.13,.03), helmNose:new THREE.BoxGeometry(.03,.1,.03),
  crestFan:(()=>{const g=new THREE.CylinderGeometry(.26,.26,.05,22,1,false,0,Math.PI); g.rotateZ(Math.PI/2); return g;})(),
  crestBase:new THREE.BoxGeometry(.045,.05,.4),
  aspis:(()=>{const pts=[[0,.1],[.12,.096],[.24,.082],[.34,.058],[.42,.03],[.46,.008],[.475,-.004]].map(q=>new THREE.Vector2(q[0],q[1])); const g=new THREE.LatheGeometry(pts,32); g.rotateX(Math.PI/2); return g;})(),
  aspisRim:new THREE.TorusGeometry(.468,.024,6,40), lambdaBar:new THREE.BoxGeometry(.05,.46,.03),
  sauroter:(()=>{const g=new THREE.ConeGeometry(.032,.2,6); g.rotateZ(Math.PI); return g;})(), collar:new THREE.CylinderGeometry(.034,.034,.05,8),
  shield:(()=>{const g=new THREE.CylinderGeometry(.36,.36,.05,22); g.rotateX(Math.PI/2); return g;})(),
  boss:new THREE.SphereGeometry(.07,10,6),
  helm:new THREE.SphereGeometry(.215,16,8,0,Math.PI*2,0,Math.PI*.52), crest:new THREE.BoxGeometry(.04,.16,.36),
  club:new THREE.CylinderGeometry(.13,.055,1.25,9), spike:new THREE.ConeGeometry(.04,.12,5),
  handle:new THREE.CylinderGeometry(.02,.02,.8,6), pick:new THREE.BoxGeometry(.5,.045,.045), pickTip:new THREE.ConeGeometry(.028,.12,5),
  quiver:new THREE.CylinderGeometry(.07,.06,.46,8), bag:new THREE.SphereGeometry(.2,10,8), hat:new THREE.SphereGeometry(.21,14,6,0,Math.PI*2,0,Math.PI*.45),
  aShaft:new THREE.CylinderGeometry(.012,.012,.8,5), aTip:new THREE.ConeGeometry(.03,.1,5), aFl:new THREE.BoxGeometry(.06,.12,.004),
  puff:new THREE.SphereGeometry(1,8,6), ring:(()=>{const g=new THREE.RingGeometry(.86,1,40); g.rotateX(-Math.PI/2); return g;})(),
  goldRock:new THREE.DodecahedronGeometry(1,0)
};
const BOW_R=.55, BOW_A=1.9;
GEO.bow=(()=>{const g=new THREE.TorusGeometry(BOW_R,.026,6,18,BOW_A); g.rotateZ(-BOW_A/2); g.rotateY(-Math.PI/2); g.translate(0,0,-BOW_R); return g;})();
const BOW_TOP=new V3(0,BOW_R*Math.sin(BOW_A/2),BOW_R*Math.cos(BOW_A/2)-BOW_R), BOW_BOT=BOW_TOP.clone().setY(-BOW_TOP.y);
function mesh(geo,mat,x,y,z){const m=new THREE.Mesh(geo,mat); m.castShadow=true; if(x!==undefined)m.position.set(x,y,z); return m;}
// Gear (weapons, shields, helmets, quivers, banners) is drawn in batches: every group is a transform holder
// outside the scene, and each frame its meshes are copied into one InstancedMesh per geometry+material.
// Hundreds of soldiers then cost a few dozen draw calls instead of thousands.
const gearRoots=new Set(), gearBatches=new Map();
function grp(){const g=new THREE.Group(); gearRoots.add(g); return g;}
function dropRoot(g){ if(!g) return; gearRoots.delete(g); g.gone=true; }
function freezeGear(g){ for(const c of g.children){ c.updateMatrix(); c.matrixAutoUpdate=false; } }
function gearBatch(c){
  const key=c.geometry.id+'|'+c.material.id; let b=gearBatches.get(key);
  if(!b){ b={geo:c.geometry,mat:c.material,cast:c.castShadow,cap:0,n:0,im:null}; gearBatches.set(key,b); }
  return b; }
function growBatch(b,need){
  let cap=Math.max(16,b.cap*2); while(cap<need) cap*=2;
  if(b.im){ scene.remove(b.im); b.im.dispose(); }
  const im=new THREE.InstancedMesh(b.geo,b.mat,cap); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled=false; im.castShadow=b.cast; im.count=0; scene.add(im);
  b.im=im; b.cap=cap; }
function drawGear(){
  for(const b of gearBatches.values()) b.n=0;
  for(const g of gearRoots){ if(!g.visible) continue; g.updateMatrixWorld(true);
    for(const c of g.children){ if(!c.isMesh||!c.visible) continue; const b=gearBatch(c); if(b.n>=b.cap) growBatch(b,b.n+1); b.im.setMatrixAt(b.n++,c.matrixWorld); } }
  for(const b of gearBatches.values()) if(b.im){ b.im.count=b.n; b.im.instanceMatrix.needsUpdate=true; }
}
function arrowMesh(acc){const g=new THREE.Group(); gearRoots.add(g); g.add(mesh(GEO.aShaft,M.wood)); g.add(mesh(GEO.aTip,M.steel,0,.44,0)); const f=mesh(GEO.aFl,acc||M.cloth,0,-.36,0); g.add(f); return g;}

