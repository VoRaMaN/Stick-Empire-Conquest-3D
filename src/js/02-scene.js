/* ---------------- renderer / scene ---------------- */
const canvas=$('#c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const HORIZON=new THREE.Color('#e3c79a');
scene.background=HORIZON; scene.fog=new THREE.Fog(HORIZON,38,105);
const camera=new THREE.PerspectiveCamera(45,1,0.1,400);
scene.add(new THREE.HemisphereLight('#fff4dd','#6e5437',0.78));
const sun=new THREE.DirectionalLight('#ffe0ad',0.92); sun.position.set(-16,30,16); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-46,right:46,top:24,bottom:-24,near:1,far:95});
sun.shadow.bias=-0.0006; scene.add(sun);

// sky dome
{
  const g=new THREE.SphereGeometry(220,24,12); const c=[]; const p=g.attributes.position;
  const top=new THREE.Color('#9fb9c6'), mid=new THREE.Color('#e8cfa2'), tmp=new THREE.Color();
  for(let i=0;i<p.count;i++){const y=p.getY(i)/220; tmp.copy(mid).lerp(top,clamp(y*1.6,0,1)); c.push(tmp.r,tmp.g,tmp.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));
  scene.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false})));
  const sunDisc=new THREE.Mesh(new THREE.CircleGeometry(9,32),new THREE.MeshBasicMaterial({color:'#fff1cf',fog:false}));
  sunDisc.position.set(-90,60,-170); sunDisc.lookAt(0,0,0); scene.add(sunDisc);
}
// ground (rebuilt whenever the battlefield changes)
let groundMesh=null, rocksIM=null; const rockData=[], mineMeshes=[];
function buildTerrain(){
  bakeH(); for(let t=0;t<2;t++){ let m=-1e9; for(let x=46;x<=82;x+=2) for(let z=-21;z<=16;z+=1) m=Math.max(m,H(t?x:-x,z)); CGY[t]=m+.05; }
  if(!groundMesh){
    const g=new THREE.PlaneGeometry(168,64,252,96); g.rotateX(-Math.PI/2);
    g.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3),3));
    groundMesh=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true})); groundMesh.receiveShadow=true; scene.add(groundMesh);
    rocksIM=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),new THREE.MeshLambertMaterial({color:'#7d6a52'}),70);
    const e=new THREE.Euler();
    for(let i=0;i<70;i++){ let x=rand(-43,43), z=rand(-30,30); if(Math.abs(z)<15&&Math.abs(x)<42) z=(z<0?-1:1)*rand(15.5,30);
      e.set(rand(0,3),rand(0,3),rand(0,3)); rockData.push({x,z,s:rand(.2,1.1),q:new THREE.Quaternion().setFromEuler(e),k:rand(1,1.6)}); }
    rocksIM.castShadow=true; rocksIM.receiveShadow=true; scene.add(rocksIM);
  }
  const g=groundMesh.geometry, p=g.attributes.position, col=g.attributes.color, a=new THREE.Color('#bf9a68'), b=new THREE.Color('#957548'), d=new THREE.Color('#d8bb8a'), t=new THREE.Color();
  for(let i=0;i<p.count;i++){
    const x=p.getX(i), z=p.getZ(i), y=H(x,z); p.setY(i,y);
    const n=0.5+0.5*Math.sin(x*1.7+z*0.9)*Math.cos(z*1.3-x*0.4);
    t.copy(b).lerp(a,clamp(0.45+y*0.25+n*0.25,0,1)).lerp(d,clamp((y-1.2)*0.4,0,0.5)); col.setXYZ(i,t.r,t.g,t.b);
  }
  p.needsUpdate=true; col.needsUpdate=true; g.computeVertexNormals(); g.computeBoundingSphere();
  const m=new THREE.Matrix4();
  rockData.forEach((r,i)=>{ m.compose(new V3(r.x,H(r.x,r.z)+r.s*.2,r.z),r.q,new V3(r.s*r.k,r.s,r.s)); rocksIM.setMatrixAt(i,m); }); rocksIM.instanceMatrix.needsUpdate=true;
  for(const mm of mineMeshes) mm.m.position.y=H(mm.m.position.x,mm.m.position.z)+mm.dy;
  if(typeof castleGround==='function') castleGround();
}
buildTerrain();

