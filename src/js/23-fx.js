/* ---------------- effects ---------------- */
const MAXPUFF=700;
// dust puffs: one instanced mesh; they fade by blending toward the haze colour as they grow
const puffIM=new THREE.InstancedMesh(GEO.puff,new THREE.MeshLambertMaterial({color:'#ffffff',transparent:true,opacity:.62,depthWrite:false}),MAXPUFF);
for(let i=0;i<MAXPUFF;i++) puffIM.setColorAt(i,WHITE);
puffIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); puffIM.frustumCulled=false; puffIM.count=0; puffIM.renderOrder=2; scene.add(puffIM);
const _pc=new THREE.Color();
function drawPuffs(){ let n=0;
  for(const q of puffs){ const t=q.age/q.life; if(t>=1) continue; _s.setScalar(q.size*(.4+t*.9)); _m.compose(q.p,_qi,_s); puffIM.setMatrixAt(n,_m);
    _pc.copy(q.c).lerp(HORIZON,t*.9); puffIM.setColorAt(n,_pc); n++; }
  puffIM.count=n; puffIM.instanceMatrix.needsUpdate=true; if(puffIM.instanceColor) puffIM.instanceColor.needsUpdate=true; }
function puff(pos,n,size,speed,color){
  if(isFireCol(color)){ emitFire(pos,n*2,size*1.5,0,speed*.6,0,speed*.55,.65); return; }
  if(partK!==1) n=Math.max(1,Math.round(n*partK));
  for(let k=0;k<n;k++){
    if(puffs.length>=MAXPUFF) puffs.shift();
    const p=new V3().copy(pos); p.y+=.05;
    puffs.push({p,c:new THREE.Color(color||'#e2cfa6'),v:new V3(rand(-1,1),rand(.3,1),rand(-1,1)).multiplyScalar(speed),age:0,life:rand(.5,.9),size:size*rand(.7,1.2)});
  }
}
function ring(pos,size,color){
  let m=new THREE.Mesh(GEO.ring,new THREE.MeshBasicMaterial({color:color||'#f3e1b8',transparent:true,depthWrite:false,side:THREE.DoubleSide})); scene.add(m);
  m.position.copy(pos); m.position.y=H(pos.x,pos.z)+.06; rings.push({m,age:0,life:.55,size});
}
const cam={yaw:0,pitch:.36,dist:31,target:new V3(0,1.2,0),goal:new V3(0,1.2,0),follow:null,shake:0,dGoal:31};
function shakeAt(pos,amt){const k=settings.shake===undefined?1:settings.shake; if(!(k>0)) return; const d=pos.distanceTo(cam.target); cam.shake=Math.max(cam.shake,amt*k*clamp(1.2-d/(cam.dist*1.2),0,1));}

/* ---------------- blood ---------------- */
const MAXDROP=700, MAXSPLAT=460;
const dropIM=new THREE.InstancedMesh(new THREE.SphereGeometry(1,6,4),new THREE.MeshLambertMaterial({color:'#8d0a12'}),MAXDROP);
const splatGeo=new THREE.CircleGeometry(1,14); splatGeo.rotateX(-Math.PI/2);
const splatIM=new THREE.InstancedMesh(splatGeo,new THREE.MeshLambertMaterial({color:'#5c060b',polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}),MAXSPLAT);
for(const im of [dropIM,splatIM]){ im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled=false; im.count=0; scene.add(im); }
splatIM.receiveShadow=true;
const drops=[], splats=[];
function bleed(pos,dir,n,speed,spread){
  if(!tune.blood) return; speed=speed||2.5; spread=spread===undefined?.5:spread;
  for(let k=0;k<n;k++){ if(drops.length>=MAXDROP) drops.shift();
    const v=new V3(rand(-1,1),rand(-1,1),rand(-1,1)).multiplyScalar(spread*speed);
    if(dir) v.addScaledVector(dir,speed*rand(.45,1.1)); v.y+=rand(.4,2);
    drops.push({p:pos.clone(),v,r:rand(.016,.04),age:0}); }
}
function terrainQ(x,z,q){ const n=_tmp.set(-(H(x+.1,z)-H(x-.1,z))/.2,1,-(H(x,z+.1)-H(x,z-.1))/.2).normalize(); return q.setFromUnitVectors(UP,n); }
function addSplat(x,z,r,grow){
  if(!tune.blood) return; if(splats.length>=MAXSPLAT) splats.shift();
  splats.push({x,z,y:H(x,z),r,grow:grow||.12,age:0,q:terrainQ(x,z,new THREE.Quaternion())});
}
function updateBlood(dt){
  for(let i=drops.length-1;i>=0;i--){ const d=drops[i]; d.age+=dt; d.v.y-=16*dt; d.p.addScaledVector(d.v,dt);
    const g=H(d.p.x,d.p.z); if(d.p.y<g){ if(Math.random()<.55) addSplat(d.p.x,d.p.z,d.r*rand(3,6)); drops.splice(i,1); } else if(d.age>3) drops.splice(i,1); }
  for(let i=splats.length-1;i>=0;i--){ const s=splats[i]; s.age+=dt; if(s.age>45) splats.splice(i,1); }
}
function drawBlood(){
  let n=0; for(const d of drops){ _s.set(d.r,d.r*1.3,d.r); _m.compose(d.p,_qi,_s); dropIM.setMatrixAt(n++,_m); }
  dropIM.count=n; dropIM.instanceMatrix.needsUpdate=true;
  n=0; for(const s of splats){ const k=Math.min(1,s.age/s.grow)*(s.age>41?Math.max(0,(45-s.age)/4):1), r=s.r*(.35+.65*k);
    _p.set(s.x,s.y+.012,s.z); _s.set(r,1,r); _m.compose(_p,s.q,_s); splatIM.setMatrixAt(n++,_m); }
  splatIM.count=n; splatIM.instanceMatrix.needsUpdate=true;
}

