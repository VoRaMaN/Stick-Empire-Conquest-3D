/* ---------------- dropped weapons, shields and helmets ---------------- */
const loose=[];
function dropGear(u){
  const G=u.G; if(!G) return; const hv=u.rag?u.rag.v[7]:u.av;
  const parts=['w','o']; if(G.h&&!u.decapped&&Math.random()<.35) parts.push('h');
  for(const k of parts){ const g=G[k]; if(!g||g.dropped) continue; g.dropped=true;
    if(loose.length>260){ const old=loose.shift(); dropRoot(old.g); }
    loose.push({g,u,v:hv.clone().multiplyScalar(.6).add(new V3(rand(-1.2,1.2),rand(1,3),rand(-1.2,1.2))),ax:new V3(rand(-1,1),rand(-1,1),rand(-1,1)).normalize(),w:rand(4,11),landed:false}); }
  if(G.str) G.str.vis=false; if(G.nock) G.nock.visible=false;
}
function updateLoose(dt){
  for(let i=loose.length-1;i>=0;i--){ const L=loose[i]; if(L.g.gone){ loose.splice(i,1); continue; } if(L.landed) continue;
    L.v.y-=16*dt; L.g.position.addScaledVector(L.v,dt); _qa.setFromAxisAngle(L.ax,L.w*dt); L.g.quaternion.premultiply(_qa);
    const gy=H(L.g.position.x,L.g.position.z)+.04*L.u.s;
    if(L.g.position.y<gy){ L.landed=true; const y=_tmp.set(0,1,0).applyQuaternion(L.g.quaternion); y.y=0; if(y.lengthSq()<1e-4) y.set(1,0,0); y.normalize();
      const pos=L.g.position.clone(); pos.y=gy; orient(L.g,pos,y.clone(),UP); puff(pos,2,.15,1); } }
}

/* ---------------- Spartan cape (cloth) ---------------- */
const capes=[];
// all capes of a team share one mesh: each cape owns a 24-vertex slot (unused slots collapse to a point)
const CAPE_MAX=200, capeSets=[];
function capeSet(team){
  if(capeSets[team]) return capeSets[team];
  const pos=new Float32Array(CAPE_MAX*24*3), nor=new Float32Array(CAPE_MAX*24*3), idx=[];
  for(let k=0;k<CAPE_MAX;k++){ const o=k*24; for(let iy=0;iy<5;iy++) for(let ix=0;ix<3;ix++){ const a=o+ix+4*iy, b=o+ix+4*(iy+1), c=o+ix+1+4*(iy+1), d=o+ix+1+4*iy; idx.push(a,b,d,b,c,d); } }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.BufferAttribute(nor,3)); g.setIndex(idx);
  g.attributes.position.setUsage(THREE.DynamicDrawUsage); g.attributes.normal.setUsage(THREE.DynamicDrawUsage);
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:TEAM[team].cape,side:THREE.DoubleSide})); m.castShadow=true; m.frustumCulled=false; scene.add(m);
  return capeSets[team]={g,m,free:Array.from({length:CAPE_MAX},(_,i)=>CAPE_MAX-1-i)}; }
function makeCape(u){
  const cs=capeSet(u.team); if(!cs.free.length) return;
  const P=[]; for(let i=0;i<24;i++) P.push(new V3());
  u.cape={u,cs,slot:cs.free.pop(),P,O:P.map(v=>v.clone()),init:false,t:0}; capes.push(u.cape);
}
function freeCape(cp){ const pa=cp.cs.g.attributes.position.array; pa.fill(0,cp.slot*72,cp.slot*72+72); cp.cs.g.attributes.position.needsUpdate=true; cp.cs.free.push(cp.slot); }
function capeAnchor(u,c,out){ const s=u.s; return out.copy(u.j.chest).addScaledVector(u.rightW,(c/3-.5)*.34*s).addScaledVector(u.fwdW,-.13*s).addScaledVector(u.spine,.04*s); }
function stepCape(cp,dt){
  const u=cp.u, s=u.s, dx=.34*s/3, dy=.8*s/5, P=cp.P, O=cp.O; cp.t+=dt;
  if(!cp.init){ for(let r=0;r<6;r++) for(let c=0;c<4;c++){ capeAnchor(u,c,P[r*4+c]).addScaledVector(u.spine,-dy*r).addScaledVector(u.fwdW,-.02*r*s); O[r*4+c].copy(P[r*4+c]); } cp.init=true; }
  const g=-12*dt*dt, wind=Math.sin(cp.t*2.3+u.id)*.004*s;
  for(let i=4;i<24;i++){ const p=P[i],o=O[i]; const vx=(p.x-o.x)*.96, vy=(p.y-o.y)*.96, vz=(p.z-o.z)*.96; o.copy(p); p.x+=vx+u.rightW.x*wind; p.y+=vy+g; p.z+=vz+u.rightW.z*wind; }
  for(let c=0;c<4;c++){ capeAnchor(u,c,P[c]); O[c].copy(P[c]); }
  for(let it=0;it<3;it++){
    for(let r=0;r<6;r++) for(let c=0;c<4;c++){ const i=r*4+c;
      if(c<3&&r>0) link(P,i,i+1,dx,false); if(r<5) link(P,i,i+4,dy,r===0); }
    if(u.alive) for(let i=4;i<24;i++){ const p=P[i], d=(p.x-u.j.chest.x)*u.fwdW.x+(p.z-u.j.chest.z)*u.fwdW.z, lim=-.1*s; if(d>lim){ p.x+=u.fwdW.x*(lim-d); p.z+=u.fwdW.z*(lim-d); } }
    for(let i=4;i<24;i++){ const gy=H(P[i].x,P[i].z)+.02; if(P[i].y<gy) P[i].y=gy; }
  }
  writeCape(cp);
}
// write the cloth into its mesh with cheap grid normals (central differences across the 4x6 lattice)
function writeCape(cp){
  const g=cp.cs.g, pa=g.attributes.position.array, na=g.attributes.normal.array, P=cp.P, o=cp.slot*72;
  for(let i=0;i<24;i++){ pa[o+i*3]=P[i].x; pa[o+i*3+1]=P[i].y; pa[o+i*3+2]=P[i].z; }
  for(let r=0;r<6;r++) for(let c=0;c<4;c++){ const i=r*4+c, l=P[r*4+Math.max(0,c-1)], rr=P[r*4+Math.min(3,c+1)], up=P[Math.max(0,r-1)*4+c], dn=P[Math.min(5,r+1)*4+c];
    const ax=rr.x-l.x, ay=rr.y-l.y, az=rr.z-l.z, bx=dn.x-up.x, by=dn.y-up.y, bz=dn.z-up.z;
    let nx=ay*bz-az*by, ny=az*bx-ax*bz, nz=ax*by-ay*bx; const L=Math.hypot(nx,ny,nz)||1; na[o+i*3]=nx/L; na[o+i*3+1]=ny/L; na[o+i*3+2]=nz/L; }
  g.attributes.position.needsUpdate=true; g.attributes.normal.needsUpdate=true; }
function link(P,a,b,rest,pinA){ const A=P[a],B=P[b]; _d.subVectors(B,A); const L=_d.length()||1e-6, k=(L-rest)/L; if(pinA){ B.addScaledVector(_d,-k); } else { A.addScaledVector(_d,k*.5); B.addScaledVector(_d,-k*.5); } }

function distSeg(p,a,b){_d.subVectors(b,a); const t=clamp(_tmp.subVectors(p,a).dot(_d)/Math.max(_d.lengthSq(),1e-6),0,1); return _tmp.copy(a).addScaledVector(_d,t).distanceTo(p);}

