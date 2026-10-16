/* ================= Castles: curtain wall, gatehouse, garrison, eight production buildings =================
   Each army's castle stands behind its statue (|x| 46 → 81). Units bought in battle are trained inside their
   building, walk out of its door (the giant from his prison, the wing archer from the aerie's roof hatch) and
   march through the gate. Castle-local frame: the wall's outer face is x=0, the castle runs toward -x, and the
   building fronts face +z (toward the default camera). World x = DIRX[team]*(lx-46). */
var castleReady=false;
const CF=46;                                   // |x| of the curtain wall's outer face
const cwx=(t,lx)=>(t?-1:1)*(lx-CF);            // castle-local x → world x (DIRX is declared later in 31-army)

/* ---------- assets embedded by the build (ElevenLabs audio, Artlist textures) ---------- */
let _assetsP=null;
function loadAssets(){
  if(_assetsP) return _assetsP;
  _assetsP=new Promise(res=>{ try{
    const src=typeof BUILD!=='undefined'&&BUILD.assets;
    if(src&&src[0]==='#'){ const el=document.getElementById(src.slice(1)); res(el&&el.textContent?JSON.parse(el.textContent):null); }
    else if(src&&typeof fetch==='function') fetch(src).then(r=>r.json()).then(res,()=>res(null));
    else res(null);
  }catch(e){ res(null); } });
  return _assetsP;
}
function b64buf(s){ const bin=atob(s), n=bin.length, a=new Uint8Array(n); for(let i=0;i<n;i++) a[i]=bin.charCodeAt(i); return a.buffer; }

/* ---------- materials: plain colours until the Artlist textures arrive ---------- */
const CTEX={stone:'#9d968a',slate:'#4f5a6a',terracotta:'#9a5440',wood:'#6e5640',iron:'#3f424a',sandstone:'#cdb18a',cobble:'#857c70',marble:'#e6e4df',basalt:'#34302e'};
const CTINT={stone:'#ebe6de',slate:'#e2e6ee',terracotta:'#f2e4dc',wood:'#eadfd0',iron:'#d6d6dc',sandstone:'#fff4e2',cobble:'#ddd6cb',marble:'#ffffff',basalt:'#cfc9c4'};
const BUMP={stone:.22,slate:.16,terracotta:.18,wood:.14,iron:.06,sandstone:.16,cobble:.2,marble:.05,basalt:.22};
const CTILE={stone:3.2,slate:2.4,terracotta:2.6,wood:2.6,iron:2.2,sandstone:2.8,cobble:3.4,marble:3.2,basalt:2.8};
const CM={};
for(const k in CTEX) CM[k]=new THREE.MeshPhongMaterial({color:CTEX[k],shininess:k==='iron'||k==='marble'?28:5,specular:k==='iron'?'#5a5a5a':'#141414'});
CM.dark=new THREE.MeshLambertMaterial({color:'#140f0b'});
CM.gold=new THREE.MeshPhongMaterial({color:'#d4a032',specular:'#ffe2a0',shininess:60});
CM.straw=new THREE.MeshLambertMaterial({color:'#c7a55a'});
CM.rope=new THREE.MeshLambertMaterial({color:'#8a6f48'});
CM.target=new THREE.MeshLambertMaterial({color:'#b8322a'});
CM.paper=new THREE.MeshBasicMaterial({color:'#ffcf8a'});
CM.eyes=new THREE.MeshBasicMaterial({color:'#ff2810',transparent:true,opacity:1});
CM.orb=new THREE.MeshBasicMaterial({color:'#c08cff'});
CM.emblem=new THREE.MeshPhongMaterial({color:'#9a7a3a',specular:'#ffe2a0',shininess:40});
CM.cloth=[0,1].map(t=>new THREE.MeshLambertMaterial({color:TEAM[t].cape,side:THREE.DoubleSide}));
CM.trim=[0,1].map(t=>new THREE.MeshLambertMaterial({color:t?'#7d2a8a':'#e2ae35'}));
const HULL_MAT=new THREE.MeshBasicMaterial({color:'#ffd56a',side:THREE.BackSide,transparent:true,opacity:.85,depthWrite:false});
function applyCastleTextures(A){
  if(!A||!A.tex||!THREE.TextureLoader) return;
  const L=new THREE.TextureLoader(), an=Math.min(8,renderer.capabilities&&renderer.capabilities.getMaxAnisotropy?renderer.capabilities.getMaxAnisotropy():1);
  for(const k in CTEX){ const b=A.tex[k]; if(!b) continue;
    const t=L.load('data:image/jpeg;base64,'+b); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=an;
    const m=CM[k]; m.map=t; m.bumpMap=t; m.bumpScale=BUMP[k]||.2; m.color.set(CTINT[k]); m.needsUpdate=true; }
  if(A.tex.emblems){ const t=L.load('data:image/jpeg;base64,'+A.tex.emblems); t.anisotropy=an; CM.emblem.map=t; CM.emblem.color.set('#ffffff'); CM.emblem.needsUpdate=true;
    EMBLEM_URL='data:image/jpeg;base64,'+A.tex.emblems; if(typeof refreshEmblemCss==='function') refreshEmblemCss(); }
}
let EMBLEM_URL='';

/* ---------- geometry helpers: UVs in world metres so every texture keeps its real scale ---------- */
function uvMul(g,su,sv){ const uv=g.attributes.uv; if(uv) for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*su,uv.getY(i)*sv); return g; }
function gBox(w,h,d,t){ const g=new THREE.BoxGeometry(w,h,d), uv=g.attributes.uv, F=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for(let f=0;f<6;f++) for(let k=0;k<4;k++){ const i=f*4+k; uv.setXY(i,uv.getX(i)*F[f][0]/t,uv.getY(i)*F[f][1]/t); } return g; }
function gCyl(rt,rb,h,seg,t,open){ return uvMul(new THREE.CylinderGeometry(rt,rb,h,seg,1,!!open),2*Math.PI*Math.max(rt,rb)/t,h/t); }
function gCone(r,h,seg,t){ return uvMul(new THREE.ConeGeometry(r,h,seg,1,true),2*Math.PI*r/t,Math.hypot(r,h)/t); }
const _e=new THREE.Euler(), _qq=new THREE.Quaternion();
function TM(x,y,z,ry,rx,rz,s){ _e.set(rx||0,ry||0,rz||0,'YXZ'); return new THREE.Matrix4().compose(new V3(x,y,z),_qq.setFromEuler(_e).clone(),s?new V3(s[0],s[1],s[2]):new V3(1,1,1)); }
// bake many transformed geometries into one (position, normal, uv): one draw call per material per castle
function mergeUV(list){
  let n=0; const parts=[];
  for(const [g,m] of list){ const c=g.index?g.toNonIndexed():g.clone(); c.applyMatrix4(m); parts.push(c); n+=c.attributes.position.count; }
  const pos=new Float32Array(n*3), nor=new Float32Array(n*3), uv=new Float32Array(n*2); let o=0;
  for(const c of parts){ const k=c.attributes.position.count; pos.set(c.attributes.position.array,o*3); nor.set(c.attributes.normal.array,o*3);
    if(c.attributes.uv) uv.set(c.attributes.uv.array,o*2); o+=k; c.dispose(); }
  const out=new THREE.BufferGeometry(); out.setAttribute('position',new THREE.BufferAttribute(pos,3)); out.setAttribute('normal',new THREE.BufferAttribute(nor,3)); out.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  out.computeBoundingSphere(); out.computeBoundingBox(); return out;
}
// Kit: collects static parts per material; a building also keeps its own list for the hover outline
function Kit(){ this.L={}; }
Kit.prototype.put=function(mat,g,m){ (this.L[mat]||(this.L[mat]=[])).push([g,m]); };
Kit.prototype.build=function(parent,team,small){
  for(const k in this.L){ const mat=k==='cloth'?CM.cloth[team]:k==='trim'?CM.trim[team]:CM[k]; const ms=new THREE.Mesh(mergeUV(this.L[k]),mat);
    ms.castShadow=!small&&k!=='paper'&&k!=='eyes'; ms.receiveShadow=!small; ms.matrixAutoUpdate=false; ms.updateMatrix(); parent.add(ms); }
  this.L={};
};

/* ---------- castle layout (castle-local) ---------- */
const WALL_H=8, TOWER_H=12;
// buildings: front row faces the road (front at z=+3), back row stands behind it (front at z=-6)
const BUILDINGS=[
  {id:'barracks',name:'Barracks',emb:1,x:-6.5,row:0,w:5.6,d:6,trains:['sword','spear'],desc:'Swordsmen and Spartans'},
  {id:'range',name:'Archery Range',emb:3,x:-13.5,row:0,w:5.6,d:6,trains:['archer'],desc:'Archers'},
  {id:'dojo',name:'Shadow Dojo',emb:2,x:-20.5,row:0,w:5.6,d:6,trains:['ninja'],desc:'Ninjas'},
  {id:'prison',name:"Giant's Prison",emb:7,x:-28,row:0,w:7,d:6,trains:['giant'],desc:'Giants, chained until the gate rises'},
  {id:'mine',name:"Miners' Hall",emb:0,x:-6.5,row:1,w:5.6,d:8,trains:['miner'],desc:'Miners who bring in gold'},
  {id:'mage',name:'Mage Tower',emb:5,x:-13.5,row:1,w:5.6,d:8,trains:['wizard'],desc:'Wizards'},
  {id:'temple',name:'Temple of Light',emb:6,x:-20.5,row:1,w:5.6,d:8,trains:['cleric'],desc:'Clerics who heal and cure'},
  {id:'aerie',name:'Aerie',emb:4,x:-28,row:1,w:7,d:8,trains:['wing'],desc:'Wing Archers, launched from the roof hatch'},
];
const KEEP={id:'castle',name:'Castle',emb:8,desc:'Garrison archers, income and the statue'};
const TRAINED_AT={}; for(const B of BUILDINGS) for(const ty of B.trains) TRAINED_AT[ty]=B.id;
const ALLEYS=[-10,-17,-23.9];   // gaps between the front-row buildings
const GATE_Z=6;
// garrison posts on the wall-walk and the gate-tower tops (filled in this order)
const POSTS=[[-1.4,WALL_H,-1.6],[-1.6,TOWER_H,2],[-1.6,TOWER_H,10],[-1.4,WALL_H,-5.2],[-1.4,WALL_H,-8.8],[-1.4,WALL_H,-12.4],[-1.4,WALL_H,-16],[-1.5,10.2,14.5]];

function emblemGeo(i,r){ const g=new THREE.CircleGeometry(r,28), uv=g.attributes.uv, cx=i%3, cy=2-Math.floor(i/3);
  for(let k=0;k<uv.count;k++) uv.setXY(k,(cx+uv.getX(k))/3,(cy+uv.getY(k))/3); return g; }

/* ---------- static structures ---------- */
function crenels(K,mat,x0,x1,z0,z1,y,step,mw,mh,along){ // merlons along a wall top (along 'z' or 'x')
  const L=along==='x'?x1-x0:z1-z0, n=Math.max(1,Math.floor(L/step));
  for(let i=0;i<n;i++){ const c=(i+.5)*L/n;
    if(along==='x') K.put(mat,gBox(mw,mh,z1-z0,CTILE.stone),TM(x0+c,y+mh/2,(z0+z1)/2));
    else K.put(mat,gBox(x1-x0,mh,mw,CTILE.stone),TM((x0+x1)/2,y+mh/2,z0+c)); }
}
function wallSeg(K,x0,x1,z0,z1,h,front){ // a stone wall block with a basalt footing and a crenellated top
  const w=x1-x0,d=z1-z0,cx=(x0+x1)/2,cz=(z0+z1)/2;
  K.put('stone',gBox(w,h,d,CTILE.stone),TM(cx,h/2,cz));
  K.put('basalt',gBox(w+.5,2.0,d+.5,CTILE.basalt),TM(cx,.1,cz));
  K.put('stone',gBox(w+.24,.28,d+.24,CTILE.stone),TM(cx,h-.14,cz));              // string course
  if(front==='x'){ crenels(K,'stone',x1-.55,x1,z0,z1,h,1.8,.95,1.25,'z'); K.put('stone',gBox(.55,.5,d,CTILE.stone),TM(x1-.27,h+.25,cz)); crenels(K,'stone',x0,x0+.4,z0,z1,h,3.6,1.1,.7,'z'); }
  else if(front==='z-'){ crenels(K,'stone',x0,x1,z0,z0+.55,h,1.8,.95,1.25,'x'); K.put('stone',gBox(w,.5,.55,CTILE.stone),TM(cx,h+.25,z0+.27)); }
  else if(front==='z+'){ crenels(K,'stone',x0,x1,z1-.55,z1,h,1.8,.95,1.25,'x'); K.put('stone',gBox(w,.5,.55,CTILE.stone),TM(cx,h+.25,z1-.27)); }
  else if(front==='x-'){ crenels(K,'stone',x0,x0+.55,z0,z1,h,1.8,.95,1.25,'z'); K.put('stone',gBox(.55,.5,d,CTILE.stone),TM(x0+.27,h+.25,cz)); }
}
function roundTower(K,x,z,r,h,roofH){
  K.put('stone',gCyl(r,r*1.06,h,18,CTILE.stone),TM(x,h/2,z));
  K.put('basalt',gCyl(r*1.12,r*1.2,2.1,18,CTILE.basalt),TM(x,.15,z));
  K.put('stone',gCyl(r*1.12,r*1.12,.35,18,CTILE.stone),TM(x,h-.1,z));
  for(let i=0;i<10;i++){ const a=i/10*Math.PI*2; K.put('stone',gBox(.8,1.1,.5,CTILE.stone),TM(x+Math.cos(a)*(r*1.08-.25),h+.55,z+Math.sin(a)*(r*1.08-.25),-a+Math.PI/2)); }
  if(roofH){ K.put('slate',gCone(r*1.05,roofH,18,CTILE.slate),TM(x,h+1.1+roofH/2,z)); K.put('stone',gCyl(r*1.05,r*1.05,1.1,18,CTILE.stone,true),TM(x,h+.55,z)); }
  for(let i=0;i<3;i++){ const a=Math.PI*.15+i*.55; K.put('dark',gBox(.16,1.0,.12,1),TM(x+Math.cos(a)*r*1.02,h*.35+i*1.9,z+Math.sin(a)*r*1.02,-a+Math.PI/2)); }   // arrow slits
}
function flagPole(K,dyn,team,x,y,z,len){
  K.put('wood',gCyl(.06,.07,len,6,2),TM(x,y+len/2,z)); K.put('gold',new THREE.SphereGeometry(.13,8,6),TM(x,y+len+.08,z));
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1.05,6,1),CM.cloth[team]); fl.geometry.translate(.85,0,0); fl.position.set(x,y+len-.62,z); dyn.push(fl); return fl;
}

function buildWalls(C){
  const K=C.kit, flags=C.flags, t=C.team;
  // courtyard paving
  K.put('cobble',gBox(34,1.0,33.5,CTILE.cobble),TM(-18.5,-.42,-3.2));                              // the paved yard (a raised platform over the terrain)
  K.put('cobble',gBox(5.6,.9,5.4,CTILE.cobble),TM(2.2,-.4,GATE_Z));                                   // ramp of paving out of the gate
  // front curtain wall (the battlefield face is +x), broken by the gatehouse
  wallSeg(K,-3,0,-18,.5,WALL_H,'x'); wallSeg(K,-3,0,11.5,13.4,WALL_H,'x');
  // machicolation corbels under the parapet and arrow slits along the front face
  for(let z=-17.4;z<0;z+=1.2) K.put('stone',gBox(.4,.35,.4,CTILE.stone),TM(.18,WALL_H-.55,z));
  for(let z=-15;z<0;z+=3.6) K.put('dark',gBox(.1,1.1,.16,1),TM(.02,4.6,z));
  // gatehouse: two square towers, the passage and the lintel above it, an iron portcullis that rises
  for(const zc of [2,10]){ K.put('stone',gBox(5,TOWER_H,3,CTILE.stone),TM(-1.5,TOWER_H/2,zc)); K.put('basalt',gBox(5.5,2.1,3.5,CTILE.basalt),TM(-1.5,.15,zc));
    K.put('stone',gBox(5.3,.3,3.3,CTILE.stone),TM(-1.5,TOWER_H-.15,zc)); crenels(K,'stone',-4,1,zc-1.5,zc+1.5,TOWER_H,1.6,.8,1.1,'z'); crenels(K,'stone',-4.05,.95,zc-1.55,zc-1.05,TOWER_H,1.6,.8,1.1,'x'); crenels(K,'stone',-4.05,.95,zc+1.05,zc+1.55,TOWER_H,1.6,.8,1.1,'x');
    K.put('dark',gBox(.12,1.3,.2,1),TM(1.02,6.5,zc)); K.put('dark',gBox(.12,1.3,.2,1),TM(1.02,9.6,zc)); }
  K.put('stone',gBox(3,WALL_H+1-5.6,5,CTILE.stone),TM(-1.5,5.6+(WALL_H+1-5.6)/2,GATE_Z));      // above the passage
  const arch=new THREE.TorusGeometry(2.5,.32,6,16,Math.PI); uvMul(arch,4,.4); K.put('stone',arch,TM(.12,3.1,GATE_Z,Math.PI/2));
  K.put('stone',gBox(.6,2.4,.5,CTILE.stone),TM(.1,1.2,GATE_Z-2.55)); K.put('stone',gBox(.6,2.4,.5,CTILE.stone),TM(.1,1.2,GATE_Z+2.55));
  K.put('dark',gBox(2.6,5.4,4.9,1),TM(-1.6,2.7,GATE_Z));                                         // the gate passage's shadowed vault (seen through bars)
  for(let i=0;i<5;i++){ const y=3.1+i*.5+.25, half=Math.sqrt(Math.max(0,2.5*2.5-(y-3.1)*(y-3.1))), wz=2.5-half;   // stone spandrels above the arch
    if(wz>.02) for(const sd of [-1,1]) K.put('stone',gBox(.45,.5,wz,CTILE.stone),TM(.05,y,GATE_Z+sd*(2.5-wz/2))); }
  K.put('emblem',emblemGeo(8,1.1),TM(.42,7.55,GATE_Z,Math.PI/2));                                 // crown over the gate
  K.put('trim',gBox(.12,2.6,1.3,1),TM(.4,4.1,GATE_Z-3.3)); K.put('trim',gBox(.12,2.6,1.3,1),TM(.4,4.1,GATE_Z+3.3));   // team hangings
  const pc=new Kit(); for(let i=-4;i<=4;i++) pc.put('iron',gBox(.12,5.3,.12,1),TM(0,2.65,i*.56)); for(let j=0;j<6;j++) pc.put('iron',gBox(.1,.12,5,1),TM(0,.5+j*.95,0));
  for(let i=-4;i<=4;i++) pc.put('iron',new THREE.ConeGeometry(.09,.3,5),TM(0,-.1,i*.56,0,Math.PI));
  const port=new THREE.Group(); port.position.set(-.35,0,GATE_Z); pc.build(port,t,true); C.group.add(port); C.portcullis=port;
  // corner towers and the other walls
  roundTower(K,-1.5,14.7,2.4,10,4.6); roundTower(K,-1.5,-19.3,2.9,11,5.6); roundTower(K,-34.5,-19.3,2.7,9.5,5); roundTower(K,-34.5,14.7,2.2,6.5,3.6);
  wallSeg(K,-36,-33,-19,14.2,7,'x-'); wallSeg(K,-34,-1.5,-20.4,-18,7.5,'z-');
  K.put('stone',gBox(30.5,1.3,.8,CTILE.stone),TM(-18,.65,13.9)); K.put('stone',gBox(30.9,.22,1,CTILE.stone),TM(-18,1.38,13.9));   // low parapet on the camera side
  for(let x=-31;x<=-5;x+=6.5){ K.put('stone',gBox(.9,1.9,1,CTILE.stone),TM(x,.95,13.9)); K.put('gold',new THREE.SphereGeometry(.22,8,6),TM(x,2.0,13.9)); }
  // flags on the towers
  flags.push(flagPole(K,C.dyn,t,-1.5,12+.3,2,3.2), flagPole(K,C.dyn,t,-1.5,12+.3,10,3.2), flagPole(K,C.dyn,t,-1.5,11+1.1+5.6-.4,-19.3,2.6), flagPole(K,C.dyn,t,-1.5,10+1.1+4.6-.4,14.7,2.4));
  // torches either side of the gate
  C.torches=[new V3(.5,4.4,GATE_Z-3.3),new V3(.5,4.4,GATE_Z+3.3)];
  for(const p of C.torches){ K.put('iron',gBox(.16,.5,.16,1),TM(p.x,p.y-.35,p.z)); }
}

/* ---------- the eight buildings ---------- */
// b: building record; bx/bz: front-centre (castle-local). Parts go both to the castle kit and the building's hull list.
function bPut(C,b,mat,g,m){ C.kit.put(mat,g,m); b.hullL.push([g,m]); }
function bDoor(C,b,kind,w,h,z,opt){ // door leaves (dynamic) in a dark doorway
  opt=opt||{}; const bx=b.bx, y0=opt.y0||0;
  bPut(C,b,'dark',gBox(w,h,kind==='portcullis'?.4:.3,1),TM(bx,y0+h/2,z-(kind==='portcullis'?0:.12)));
  const D={kind,w,h,z,y0,open:0,goal:0,parts:[],hold:0};
  const leaf=(lw,lh,mat)=>{ const k=new Kit(), g=new THREE.Group(); k.put(mat||'wood',gBox(lw,lh,.12,CTILE.wood),TM(0,lh/2,0));
    for(const yy of [.25,.72]) k.put(mat||'wood',gBox(lw*.96,.11,.05,CTILE.wood),TM(0,lh*yy,.08)); k.build(g,C.team,true); return g; };
  if(kind==='double'){ for(const sd of [-1,1]){ const p=new THREE.Group(); p.position.set(bx+sd*w/2,y0,z+.02); const l=leaf(w/2-.02,h); l.position.x=-sd*(w/4); p.add(l); p.userData.sd=sd; C.group.add(p); D.parts.push(p); } }
  else if(kind==='slide'){ const p=leaf(w,h); p.position.set(bx,y0,z+.05); C.group.add(p); D.parts.push(p); }
  else if(kind==='portcullis'){ const k=new Kit(), p=new THREE.Group(); z+=.12;
    for(let i=0;i<=Math.round(w/.5);i++) k.put('iron',gBox(.13,h,.13,1),TM(-w/2+i*w/Math.round(w/.5),h/2,0));
    for(let j=1;j<5;j++) k.put('iron',gBox(w,.13,.1,1),TM(0,j*h/5,0)); k.build(p,C.team,true); p.position.set(bx,y0,z+.1); C.group.add(p); D.parts.push(p); }
  b.door=D; return D;
}
function bWindow(C,b,x,y,z,w,h,glowList){ bPut(C,b,'dark',gBox(w+.16,h+.16,.12,1),TM(x,y,z)); glowList.push([gBox(w,h,.06,1),TM(x,y,z+.05)]); bPut(C,b,'wood',gBox(w+.3,.12,.22,1),TM(x,y-h/2-.08,z+.06)); }
function gableRoof(C,b,mat,cx,y,cz,w,d,rise,over,alongZ,endMat){ // ridge along x (or along z: gable end faces the front)
  const R=alongZ?TM(cx,y,cz,Math.PI/2):TM(cx,y,cz), W=alongZ?d:w, D=alongZ?w:d;
  const half=D/2+over, L=Math.hypot(half,rise), a=Math.atan2(rise,half);
  for(const sd of [-1,1]) bPut(C,b,mat,gBox(W+over*2,.22,L,CTILE[mat]),R.clone().multiply(TM(0,rise/2,sd*half/2,0,sd*a)));
  const tri=new THREE.Shape(); tri.moveTo(-D/2,0); tri.lineTo(D/2,0); tri.lineTo(0,rise); tri.closePath();
  const em=endMat||'stone';
  for(const sd of [-1,1]){ const g=uvMul(new THREE.ShapeGeometry(tri),1/CTILE[em],1/CTILE[em]); bPut(C,b,em,g,R.clone().multiply(TM(sd*(W/2-.01),0,0,sd*Math.PI/2))); }
  bPut(C,b,'wood',gBox(W+over*2+.1,.26,.26,1),R.clone().multiply(TM(0,rise+.05,0)));
}
function pyramidRoof(C,b,mat,cx,y,cz,w,d,h){ const g=new THREE.ConeGeometry(Math.SQRT1_2,1,4,1,true); g.rotateY(Math.PI/4); g.scale(w,h,d);
  uvMul(g,2*(w+d)/CTILE[mat],Math.hypot(h,Math.max(w,d)/2)/CTILE[mat]); bPut(C,b,mat,g,TM(cx,y+h/2,cz)); }
function bEmblem(C,b,x,y,z,r){ const g=emblemGeo(b.emb,r); bPut(C,b,'emblem',g,TM(x,y,z)); bPut(C,b,'gold',new THREE.TorusGeometry(r,.07,6,28),TM(x,y,z-.02)); }
function bBanner(C,b,x,y,z){ bPut(C,b,'cloth',new THREE.PlaneGeometry(.75,1.9),TM(x,y,z+.04)); bPut(C,b,'gold',gBox(.95,.08,.08,1),TM(x,y+.98,z+.06)); }

const BUILD_FN={
  barracks(C,b,G){ const {bx,w,d}=b, z0=3-d/2;
    bPut(C,b,'basalt',gBox(w+.4,.6,d+.4,CTILE.basalt),TM(bx,.3,z0)); bPut(C,b,'stone',gBox(w,4.6,d,CTILE.stone),TM(bx,2.3+.3,z0));
    bPut(C,b,'wood',gBox(w+.1,.22,d+.1,1),TM(bx,4.95,z0)); gableRoof(C,b,'terracotta',bx,5.0,z0,w,d,2.3,.45);
    bDoor(C,b,'double',2.2,2.9,3); bPut(C,b,'stone',gBox(2.9,.4,.4,CTILE.stone),TM(bx,3.45,3.1));
    bEmblem(C,b,bx,4.25-.05+.12,3.06,.6); bBanner(C,b,bx-2.05,2.6,3); bBanner(C,b,bx+2.05,2.6,3);
    bWindow(C,b,bx-1.85,1.7,3,.55,.75,G); bWindow(C,b,bx+1.85,1.7,3,.55,.75,G);
    // weapon rack: crossed spears by the door
    for(const sd of [-1,1]){ bPut(C,b,'wood',gCyl(.035,.035,2.6,5,1),TM(bx+sd*1.3,1.3,3.35,0,0,sd*.35)); bPut(C,b,'iron',new THREE.ConeGeometry(.07,.25,5),TM(bx+sd*1.3-sd*.47,2.55,3.35,0,0,sd*.35)); }
    b.h=7.6; },
  range(C,b,G){ const {bx,w,d}=b, z0=3-d/2;
    bPut(C,b,'stone',gBox(w+.3,1.1,d+.3,CTILE.stone),TM(bx,.55,z0)); bPut(C,b,'wood',gBox(w,3.4,d,CTILE.wood),TM(bx,1.1+1.7,z0));
    for(const sx of [-1,1]) for(const sz of [-1,1]) bPut(C,b,'wood',gBox(.3,3.5,.3,1),TM(bx+sx*(w/2),2.85,z0+sz*(d/2)));
    gableRoof(C,b,'slate',bx,4.5,z0,w,d,2.1,.5);
    bDoor(C,b,'double',2.0,2.6,3,{y0:0}); bEmblem(C,b,bx,3.75,3.06,.55);
    bWindow(C,b,bx-1.8,2.4,3,.6,.6,G); bWindow(C,b,bx+1.8,2.4,3,.6,.6,G);
    // straw target on a stand beside the door
    bPut(C,b,'wood',gBox(.1,1.3,.1,1),TM(bx+2.15,.65,3.75)); const tg=new THREE.CylinderGeometry(.55,.55,.25,16); tg.rotateX(Math.PI/2);
    bPut(C,b,'straw',tg,TM(bx+2.15,1.3,3.85)); for(const [r,m] of [[.38,'target'],[.22,'straw'],[.1,'target']]){ const c=new THREE.CircleGeometry(r,16); bPut(C,b,m,c,TM(bx+2.15,1.3,3.99+r*.01)); }
    for(let i=0;i<3;i++) bPut(C,b,'wood',gCyl(.015,.015,.8,4,1),TM(bx+2.1+i*.08,1.35+i*.05,4.2,0,1.3));
    b.h=6.6; },
  dojo(C,b,G){ const {bx,w,d}=b, z0=3-d/2;
    bPut(C,b,'basalt',gBox(w+.4,.35,d+.4,CTILE.basalt),TM(bx,.17,z0)); bPut(C,b,'wood',gBox(w-.3,3.3,d-.3,CTILE.wood),TM(bx,.35+1.65,z0));
    for(const sx of [-1,0,1]) bPut(C,b,'dark',gBox(.22,3.3,.22,1),TM(bx+sx*(w/2-.15),2.0,3-.15));
    pyramidRoof(C,b,'slate',bx,3.65,z0,w+1.6,d+1.6,1.4); bPut(C,b,'wood',gBox(w-.6,1.3,d-.6,CTILE.wood),TM(bx,5.6,z0)); pyramidRoof(C,b,'slate',bx,6.2,z0,w+.4,d+.4,1.9);
    bPut(C,b,'gold',new THREE.ConeGeometry(.15,1,6),TM(bx,8.6,z0));
    bDoor(C,b,'slide',1.9,2.4,2.85,{y0:.35}); bEmblem(C,b,bx,3.25,2.92,.42);
    for(const sd of [-1,1]){ G.push([new THREE.CylinderGeometry(.22,.22,.5,10),TM(bx+sd*1.9,2.9,3.35)]); bPut(C,b,'dark',gCyl(.02,.02,.35,4,1),TM(bx+sd*1.9,3.3,3.35)); }   // paper lanterns
    b.h=9; },
  prison(C,b,G){ const {bx,w,d}=b, z0=3-d/2;
    bPut(C,b,'basalt',gBox(w,6.4,d,CTILE.basalt),TM(bx,3.2,z0)); bPut(C,b,'basalt',gBox(w+.5,1.2,d+.5,CTILE.basalt),TM(bx,.6,z0));
    bPut(C,b,'iron',gBox(w+.1,.35,d+.1,CTILE.iron),TM(bx,5.6,z0)); bPut(C,b,'basalt',gBox(w+.3,.3,d+.3,CTILE.basalt),TM(bx,6.5,z0));
    crenels(C.kit,'basalt',bx-w/2,bx+w/2,3-.5,3,6.6,1.5,.85,.9,'x'); b.hullL.push([gBox(w,.9,.5,1),TM(bx,7.05,2.75)]);
    bDoor(C,b,'portcullis',4.4,5.0,3); bPut(C,b,'iron',gBox(5.2,.5,.5,CTILE.iron),TM(bx,5.2,3.1));
    // the cell behind the bars and the giant's eyes glowing in the dark
    { const L=[]; for(const [ex,ey] of [[-.8,3.4],[1.0,2.6]]) for(const sd of [-1,1]) L.push([new THREE.SphereGeometry(.09,8,6),TM(bx+ex+sd*.2,ey,3.07,0,0,0,[1.4,.6,1])]);
      const e=new THREE.Mesh(mergeUV(L),CM.eyes); C.group.add(e); b.eyes=[e]; }
    bEmblem(C,b,bx+2.85,3.9,3.06,.52);
    for(let i=0;i<8;i++) bPut(C,b,'iron',new THREE.TorusGeometry(.12,.035,5,10),TM(bx-2.85,4.7-i*.27,3.08,0,0,i%2?Math.PI/2:0)); bPut(C,b,'iron',gBox(.35,.35,.2,1),TM(bx-2.85,4.85,3.05));
    for(let i=0;i<4;i++) bPut(C,b,'iron',new THREE.TorusGeometry(.12,.035,5,10),TM(bx-2.85+.18+i*.2,2.5-i*.05,3.1,0,Math.PI/2,0)); bPut(C,b,'iron',gBox(.5,.3,.25,1),TM(bx-2.85,2.6,3.05));
    b.h=7.5; },
  mine(C,b,G){ const {bx,w,d}=b, z0=-6-d/2;
    bPut(C,b,'stone',gBox(w+.3,1.4,d+.3,CTILE.stone),TM(bx,.7,z0)); bPut(C,b,'wood',gBox(w,4.4,d,CTILE.wood),TM(bx,1.4+2.2,z0));
    gableRoof(C,b,'terracotta',bx,5.8,z0,w,d,2.5,.45);
    bPut(C,b,'stone',gBox(.9,3.2,.9,CTILE.stone),TM(bx+1.6,7.4,z0-1.6)); b.chimney=new V3(bx+1.6,9.2,z0-1.6);
    bDoor(C,b,'double',2.0,2.6,-6); bEmblem(C,b,bx,3.3,-5.94,.55);
    bWindow(C,b,bx-1.8,4.2,-6,.6,.7,G); bWindow(C,b,bx+1.8,4.2,-6,.6,.7,G);
    // the big gear wheel on the facade
    const gw=new THREE.Group(); const gk=new Kit(); gk.put('iron',new THREE.TorusGeometry(.7,.13,6,20),TM(0,0,0)); for(let i=0;i<10;i++){ const a=i/10*Math.PI*2; gk.put('iron',gBox(.22,.3,.16,1),TM(Math.cos(a)*.86,Math.sin(a)*.86,0,0,0,a)); }
    for(let i=0;i<3;i++) gk.put('iron',gBox(1.4,.1,.08,1),TM(0,0,0,0,0,i*Math.PI/3)); gk.build(gw,C.team,true); gw.position.set(bx,5.1,-5.9); C.group.add(gw); b.gear=gw;
    for(let i=0;i<3;i++) bPut(C,b,'wood',gCyl(.3,.3,.7,8,1),TM(bx-2.3+i*.05,.35,-5.2+i*.2));   // barrels
    b.h=9; },
  mage(C,b,G){ const bx=b.bx, cz=-9.2, r=2.6;
    bPut(C,b,'basalt',gCyl(r+.3,r+.4,1,18,CTILE.basalt),TM(bx,.5,cz)); bPut(C,b,'marble',gCyl(r,r*1.04,12,18,CTILE.marble),TM(bx,6.5,cz));
    for(const y of [4.4,8.6]) bPut(C,b,'gold',gCyl(r+.08,r+.08,.2,18,1),TM(bx,y,cz));
    bPut(C,b,'marble',gCyl(r+.45,r+.2,.7,18,CTILE.marble),TM(bx,12.8,cz)); bPut(C,b,'slate',gCone(r+.6,6,18,CTILE.slate),TM(bx,16.15,cz));
    bPut(C,b,'gold',gCyl(.05,.05,1.2,5,1),TM(bx,19.6,cz)); b.orb=new THREE.Mesh(new THREE.SphereGeometry(.38,14,10),CM.orb); b.orb.position.set(bx,20.4,cz); C.group.add(b.orb);
    // round window near the top, door at the base
    const rw=new THREE.CircleGeometry(.85,20); G.push([rw,TM(bx,10.6,cz+r+.06)]); bPut(C,b,'gold',new THREE.TorusGeometry(.9,.1,6,20),TM(bx,10.6,cz+r+.08));
    for(let i=0;i<4;i++) bPut(C,b,'gold',gBox(1.7,.06,.04,1),TM(bx,10.6,cz+r+.1,0,0,i*Math.PI/4));
    bPut(C,b,'marble',gBox(2.7,3.3,1.2,CTILE.marble),TM(bx,1.65,cz+r-.15));
    bDoor(C,b,'double',1.8,2.6,cz+r+.48); bEmblem(C,b,bx,6.8,cz+r+.07,.62);
    b.h=21; },
  temple(C,b,G){ const {bx,w,d}=b, z0=-6-d/2;
    for(let i=0;i<3;i++) bPut(C,b,'marble',gBox(w+1.2-i*.4,.3,d+1.4-i*.5,CTILE.marble),TM(bx,.15+i*.3,z0+.4-i*.1));
    bPut(C,b,'sandstone',gBox(w-.4,5.2,d-2.2,CTILE.sandstone),TM(bx,.9+2.6,z0-1.1));
    for(let i=0;i<4;i++){ const x=bx-w/2+.45+i*(w-.9)/3; bPut(C,b,'sandstone',gCyl(.28,.32,4.6,12,CTILE.sandstone),TM(x,.9+2.3,-6.3)); bPut(C,b,'sandstone',gBox(.8,.25,.8,1),TM(x,5.6,-6.3)); bPut(C,b,'sandstone',gBox(.75,.2,.75,1),TM(x,1.0,-6.3)); }
    bPut(C,b,'sandstone',gBox(w+.3,.6,d+.2,CTILE.sandstone),TM(bx,6.0,z0+.05));
    gableRoof(C,b,'terracotta',bx,6.3,z0,w+.2,d+.1,2.0,.35,true,'sandstone');
    bPut(C,b,'gold',gCyl(.04,.04,1.3,5,1),TM(bx,9.0,z0)); bPut(C,b,'gold',new THREE.TorusGeometry(.35,.06,6,18),TM(bx,9.9,z0));
    bDoor(C,b,'double',1.9,3.1,-8.2,{y0:.9}); bEmblem(C,b,bx,7.0,-5.92,.55);
    for(const sd of [-1,1]) G.push([new THREE.SphereGeometry(.16,8,6),TM(bx+sd*1.5,3.3,-7.9)]);
    b.h=10.5; },
  aerie(C,b,G){ const {bx,w,d}=b, z0=-6-d/2;
    bPut(C,b,'basalt',gBox(w+.5,1.2,d+.5,CTILE.basalt),TM(bx,.6,z0)); bPut(C,b,'stone',gBox(w,6.5,d,CTILE.stone),TM(bx,1.2+3.25,z0));
    bPut(C,b,'wood',gBox(w+.6,3.4,d+.6,CTILE.wood),TM(bx,7.7+1.7,z0)); for(const sx of [-1,1]) for(const sz of [-1,1]) bPut(C,b,'wood',gBox(.35,3.6,.35,1),TM(bx+sx*(w/2+.3),9.4,z0+sz*(d/2+.3)));
    bPut(C,b,'wood',gBox(w+1.4,.3,d+1.4,CTILE.wood),TM(bx,11.25,z0));                                   // flat roof deck
    crenels(C.kit,'wood',bx-w/2-.7,bx+w/2+.7,z0+d/2+.4,z0+d/2+.7,11.4,1.3,.25,.8,'x'); crenels(C.kit,'wood',bx-w/2-.7,bx+w/2+.7,z0-d/2-.7,z0-d/2-.4,11.4,1.3,.25,.8,'x');
    // perches (beams sticking out) and the hatch frame
    for(const sd of [-1,1]) bPut(C,b,'wood',gBox(2.2,.25,.25,1),TM(bx+sd*(w/2+1.1),10.6,z0+1));
    bPut(C,b,'dark',gBox(2.6,.1,2.6,1),TM(bx,11.42,z0)); bPut(C,b,'iron',gBox(3.0,.18,.18,1),TM(bx,11.48,z0-1.4)); bPut(C,b,'iron',gBox(3.0,.18,.18,1),TM(bx,11.48,z0+1.4));
    const hatch=[]; for(const sd of [-1,1]){ const p=new THREE.Group(), k=new Kit(); k.put('wood',gBox(1.28,.14,2.6,CTILE.wood),TM(-sd*.64,0,0)); k.put('wood',gBox(.08,.06,2.5,1),TM(-sd*.3,.09,0)); k.build(p,C.team,true); p.position.set(bx+sd*1.3,11.5,z0); C.group.add(p); hatch.push(p); }
    b.door={kind:'hatch',open:0,goal:0,parts:hatch,hold:0};
    bPut(C,b,'dark',gBox(1.9,2.5,.3,1),TM(bx,1.2+1.25,-6.05)); bEmblem(C,b,bx,7.0,-5.95-.32,.65);
    bWindow(C,b,bx-2.2,4.5,-5.98,.5,.9,G); bWindow(C,b,bx+2.2,4.5,-5.98,.5,.9,G); bWindow(C,b,bx,9.4,-5.65,1.2,.8,G);
    b.roofY=11.5; b.h=12.8; },
};

/* ---------- build one castle ---------- */
const CASTLES=[];
function buildCastle(t){
  const C={team:t,group:new THREE.Group(),kit:new Kit(),flags:[],dyn:[],B:{},list:[],torches:[],garrison:[],q:[],res:{},resBusy:{},research:null};
  C.group.position.set(t?CF:-CF,CGY[t],0); if(t) C.group.scale.x=-1;
  buildWalls(C);
  for(const D of BUILDINGS){ const b=Object.assign({},D,{team:t,bx:D.x,hullL:[],q:[],train:null,exitQ:[],glowL:[]}); const glow=[];
    BUILD_FN[D.id](C,b,glow);
    if(glow.length){ b.glowMat=new THREE.MeshBasicMaterial({color:'#ffb35a'}); const gm=new THREE.Mesh(mergeUV(glow),b.glowMat); C.group.add(gm); b.glowMesh=gm; }
    // hover outline: the building's own silhouette, scaled out ~0.2 m around its centre
    const hg=mergeGeo(b.hullL.map(([g,m])=>[g,m])); hg.computeBoundingBox(); const bb=hg.boundingBox.clone(), c=bb.getCenter(new V3()), sz=bb.getSize(new V3());
    const hull=new THREE.Mesh(hg,HULL_MAT); hull.position.copy(c); hull.geometry.translate(-c.x,-c.y,-c.z); hull.scale.set(1+.4/sz.x,1+.4/sz.y,1+.4/sz.z); hull.visible=false; hull.renderOrder=-1; C.group.add(hull);
    b.hull=hull; b.box=bb.clone(); b.hullL=null; b.wbox=new THREE.Box3();
    C.B[D.id]=b; C.list.push(b); }
  // the keep's pick box covers the gatehouse
  C.keep=Object.assign({},KEEP,{team:t,box:new THREE.Box3(new V3(-4,0,.5),new V3(1,TOWER_H+1,11.5)),wbox:new THREE.Box3(),bx:-1.5});
  C.kit.build(C.group,t);
  for(const m of C.dyn) C.group.add(m);
  scene.add(C.group); C.group.updateMatrixWorld(true);
  for(const b of [...C.list,C.keep]) b.wbox.copy(b.box).applyMatrix4(C.group.matrixWorld);
  CASTLES[t]=C;
}
function castleGround(){ if(!castleReady) return; for(const C of CASTLES){ C.group.position.y=CGY[C.team]; C.group.updateMatrixWorld(true); for(const b of [...C.list,C.keep]) b.wbox.copy(b.box).applyMatrix4(C.group.matrixWorld); } }
buildCastle(0); buildCastle(1); castleReady=true;
loadAssets().then(A=>{ if(A) applyCastleTextures(A); });

/* ---------- castle state: training queues, doors, garrison ---------- */
const TRAIN_T={miner:2.2,sword:2.4,spear:3.4,archer:2.8,ninja:3.2,cleric:3.6,wizard:4.4,wing:4.4,giant:7};
// castles only run in a real skirmish/campaign battle; the classic regression mix and the Lab keep the old spawn
const castleOn=()=>game.mode==='battle'&&!game.classicMix;
function resetCastles(){
  for(const C of CASTLES){
    for(const g of C.garrison) destroyGear(g); C.garrison.length=0;
    for(const b of C.list){ b.q.length=0; b.train=null; b.exitQ.length=0; if(b.door){ b.door.open=b.door.goal=0; b.door.hold=0; poseDoor(b); } b.res=null; }
    C.research=null; C.res={}; C.resBusy={}; C.keep.res=null;
    C.portOpen=0; C.portHold=0; C.portcullis.position.y=0;
  }
  if(castleOn()) for(const C of CASTLES) syncGarrison(C);
  resetAiResearch();
}
function queued(team){ let n=0; for(const b of CASTLES[team].list) n+=b.q.length+(b.train?1:0)+b.exitQ.length; return n; }
function queuedType(team,ty){ const b=CASTLES[team].B[TRAINED_AT[ty]]; let n=b.q.filter(x=>x===ty).length; if(b.train&&b.train.type===ty) n++; return n; }
// buy a unit: in a castle battle it is trained in its building and walks out; otherwise it appears by the statue
function recruit(type,team){
  if(!castleOn()){ spawn(type,team); return true; }
  const b=CASTLES[team].B[TRAINED_AT[type]]; if(!b){ spawn(type,team); return true; }
  b.q.push(type); return true;
}
function poseDoor(b){ const D=b.door; if(!D) return; const o=EASE.io(clamp(D.open,0,1));
  if(D.kind==='double') for(const p of D.parts) p.rotation.y=-p.userData.sd*o*1.45;
  else if(D.kind==='slide') D.parts[0].position.x=b.bx-o*(D.w*.95);
  else if(D.kind==='portcullis') D.parts[0].position.y=D.y0+o*(D.h*.92);
  else if(D.kind==='hatch') D.parts.forEach((p,i)=>{ p.rotation.z=(i?-1:1)*o*1.9; });
}
function openDoor(b,hold){ const D=b.door; if(!D) return; if(D.goal<1){ D.goal=1; const C=CASTLES[b.team], wp=new V3(cwx(b.team,b.bx),CGY[b.team]+2,b.row?-6:3);
    sfx(D.kind==='portcullis'?'gate':D.kind==='hatch'?'hatch':'door',wp,D.kind==='portcullis'?1.1:.8); } D.hold=Math.max(D.hold,hold||1.6); }
// the path a fresh unit walks from its door, out through the gate, onto the field
function exitPath(b,team,u){
  const P=[], add=(lx,z,y)=>P.push(new V3(cwx(team,lx),y||0,z));
  const fz=clamp(GATE_Z+rand(-1.6,1.6),3.6,8.4);
  if(b.id==='aerie'){ add(b.bx+1.5,-8.5,1); add(-8,-2,1); add(2,fz-4,1); add(6,rand(-6,6),1); return P; }
  if(b.row===0){ add(b.bx,4.7); add(-3.6,GATE_Z+rand(-1,1)); }
  else { const al=b.bx>-12?ALLEYS[0]:b.bx>-19?ALLEYS[1]:ALLEYS[2]; add(b.bx,-4.6); add(al,-4.6); add(al,4.8); add(-3.6,GATE_Z+rand(-1,1)); }
  add(1.4,fz); add(4.6,clamp(fz+rand(-3,3),-12,12));
  return P;
}
function emerge(b,type){
  const team=b.team, C=CASTLES[team];
  let lx=b.bx, z=(b.door&&b.door.z!==undefined?b.door.z:(b.row?-6:3))-(type==='giant'?1.5:.45), gy;
  if(b.id==='aerie'){ z=-10; gy=CGY[team]+b.roofY-1.1; }
  const opt={}; if(gy!==undefined) opt.gy=gy;
  const s=researchScale(team,type); if(s!==1) opt.s=TYPES[type].s*s;
  const u=makeUnit(type,team,cwx(team,lx),z,opt); u.isUnit=true; u.inCastle=true; units.push(u); assignRegiment(u);
  researchApplyUnit(u);
  u.face=u.faceGoal=b.id==='aerie'?(team?-Math.PI/2:Math.PI/2):0;
  const pts=exitPath(b,team,u), sp=u.T.speed*(type==='giant'?1.15:.92); u.bornT=game.time;
  u.script={pts,i:0,speed:sp,then:leaveCastle};
  if(b.id==='aerie'){ u.fl.takeT=.15; u.fl.mode='ground'; }
  if(game.stance) assignSlots(team);
  if(team===0){ if(type==='giant') narrate('giantUnleashed',25); }
  return u;
}
function leaveCastle(u){
  u.inCastle=false;
  if(u.gy!==undefined){ const old=u.gy; delete u.gy; if(u.fl) u.fl.h+=old-H(u.pos.x,u.pos.z); }
}
// called each step from the main loop. Cosmetics use their own random stream so they never shift a battle.
const _tp=new V3(); let _cs=7; const crand=()=>(_cs=(_cs*16807)%2147483647)/2147483647;
function updateCastles(dt){
  for(const C of CASTLES){
    const t=C.team, on=castleOn();
    // flags ripple, torches flicker, the giant's eyes blink, the mage's orb pulses
    for(let i=0;i<C.flags.length;i++){ const f=C.flags[i]; f.rotation.y=.25*Math.sin(game.time*1.7+i*1.3)+.12*Math.sin(game.time*4.1+i); }
    for(const b of C.list){
      if(b.eyes){ const e=b.eyes[0], ph=(game.time*.37)%1; e.visible=!(ph>.93)&&!!(b.q.length||b.train||Math.sin(game.time*.21)>-.6); }
      if(b.orb){ const p=.5+.5*Math.sin(game.time*2.2+t); b.orb.scale.setScalar(.9+.25*p); }
      if(b.gear) b.gear.rotation.z+=dt*(b.train?1.6:.25);
      if(b.chimney&&on&&crand()<dt*1.2){ _tp.set(cwx(t,b.chimney.x),CGY[t]+b.chimney.y,b.chimney.z); puff(_tp,1,.35,.35,'#8a8478'); }
      // doors swing toward their goal; they shut again once nobody is coming through
      const D=b.door; if(D){ D.hold-=dt; if(D.hold<=0) D.goal=0; const sp=D.kind==='portcullis'?.8:2.2; const o0=D.open; D.open=clamp(D.open+(D.goal>D.open?1:-1)*dt*sp,0,1); if(D.open!==o0) poseDoor(b); }
      if(!on) continue;
      // training: one unit at a time per building, then it waits at the door until the door is open
      if(!b.train&&b.q.length){ const ty=b.q.shift(); b.train={type:ty,t:TRAIN_T[ty]||3,tot:TRAIN_T[ty]||3}; }
      if(b.train){ b.train.t-=dt*researchTrainMul(t); if(b.train.t<=0){ b.exitQ.push(b.train.type); b.train=null; } }
      if(b.exitQ.length){ openDoor(b,2.2); if(D&&D.open>.62){ const ty=b.exitQ.shift(); emerge(b,ty); if(D) D.hold=Math.max(D.hold,1.4); } }
    }
    // the gate's portcullis lifts while soldiers pass beneath it
    let near=false; if(on) for(const u of units){ if(u.team===t&&u.inCastle&&!u.fl&&Math.abs(u.pos.x-cwx(t,-1))<6&&Math.abs(u.pos.z-GATE_Z)<5){ near=true; break; } }
    const po=C.portOpen||0; C.portOpen=clamp(po+(near?1:-.6)*dt*.9,0,1); if(po===0&&C.portOpen>0) sfx('gate',_tp.set(cwx(t,0),CGY[t]+3,GATE_Z),.9);
    C.portcullis.position.y=EASE.io(C.portOpen)*5.2;
    if(on) updateGarrison(C,dt);
    if(on) updateResearch(C,dt);
  }
}

/* ---------- garrison: archers on the battlements (Castle Archer research adds more) ---------- */
function garrisonSize(team){ return 2+2*(CASTLES[team].res.castleArchers||0); }
function syncGarrison(C){
  const want=Math.min(POSTS.length,garrisonSize(C.team));
  while(C.garrison.length<want){ const P=POSTS[C.garrison.length], t=C.team;
    const keep=uid, u=makeUnit('archer',t,cwx(t,P[0]),P[2],{gy:CGY[t]+P[1],ai:false}); uid=keep; u.id=-(++garrisonId);   // own ids: never shift the army's
    u.garrison=true; u.post=P; u.face=u.faceGoal=t?-Math.PI/2:Math.PI/2; u.gT=rand(0,.5);
    for(let i=0;i<20;i++){ u.spd=0; buildSkel(u,computePose(u),.016); } updateGear(u); C.garrison.push(u); }
}
let garrisonId=0;
const GARRISON_R=24;
function updateGarrison(C,dt){
  for(const g of C.garrison){
    g.gT-=dt; if(g.gT<=0){ g.gT=.35+Math.random()*.2; g.target=nearestFoe(g.pos.x,g.pos.z,g.team,GARRISON_R,g); if(g.target&&g.target.inCastle) g.target=null; }
    const t=g.target&&g.target.alive?g.target:null;
    if(t){ g.faceGoal=Math.atan2(t.pos.x-g.pos.x,t.pos.z-g.pos.z); if(!g.action&&g.cdT<=0&&Math.abs(wrapA(g.faceGoal-g.face))<.35) startAttack(g,t,'shoot'); }
    else if(!g.action) g.faceGoal=g.team?-Math.PI/2:Math.PI/2;
    updateUnit(g,dt);
  }
}
