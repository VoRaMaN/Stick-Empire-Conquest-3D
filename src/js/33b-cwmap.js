/* ================= The 3D campaign map: a miniature continent on a war table =================
   A dark stone chamber, a walnut table, candles, and on the table a model of the whole world: 49 regions in three
   empires and the free frontier, with mountains, rivers, lakes, forests, castles and banners. It has its own scene
   and camera and is drawn only while the campaign is open, so the battle scene and camera are left untouched.
   Pan with a drag (or WASD), tilt with a right-drag (or Q/E), zoom with the wheel or a pinch; click a region (its
   ground, its castle or its label) to select it. Everything is built once, from the deterministic data (32z/33a);
   selecting or conquering only updates a small palette texture, the labels and the banners. */
const CW3={on:false,built:false,failed:false,scene:null,cam:null,t:{x:-60,z:4},tg:{x:-60,z:4},dist:150,dGoal:150,pitch:.98,pGoal:.98,yaw:0,yGoal:0,
  hov:-1,ptrs:new Map(),pinch:null,candles:[],flags:[],labels:[],pick:[],moved:false,time:0,lastHov:0,keys:{}};
const CW_BY=.2;                       // the model's sea floor sits just above the tabletop (y 0)
const cwSupported=()=>typeof renderer!=='undefined'&&renderer&&typeof renderer.getContext==='function';
const cwY=(x,z)=>CW_BY+Math.max(cwHeight(x,z),CW.WL+.05);

/* ---------- small geometry helpers ---------- */
const _cwm=new THREE.Matrix4(), _cwq=new THREE.Quaternion(), _cwe=new THREE.Euler(), _cwv=new V3(), _cws=new V3();
function cwM(x,y,z,ry,sx,sy,sz,rx,rz){ _cwe.set(rx||0,ry||0,rz||0); _cwq.setFromEuler(_cwe); return new THREE.Matrix4().compose(_cwv.set(x,y,z),_cwq,_cws.set(sx===undefined?1:sx,sy===undefined?(sx===undefined?1:sx):sy,sz===undefined?(sx===undefined?1:sx):sz)); }
// merge [geometry, matrix, colour] parts into one vertex-coloured geometry
function cwMerge(parts){
  let n=0; const gs=parts.map(([g,m,c])=>{ const q=g.index?g.toNonIndexed():g.clone(); q.applyMatrix4(m); n+=q.attributes.position.count; return [q,c]; });
  const P=new Float32Array(n*3), N=new Float32Array(n*3), C=new Float32Array(n*3), col=new THREE.Color(); let o=0;
  for(const [q,c] of gs){ const k=q.attributes.position.count; P.set(q.attributes.position.array,o*3); N.set(q.attributes.normal.array,o*3); col.set(c);
    for(let i=0;i<k;i++){ C[(o+i)*3]=col.r; C[(o+i)*3+1]=col.g; C[(o+i)*3+2]=col.b; } o+=k; q.dispose(); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('normal',new THREE.BufferAttribute(N,3)); g.setAttribute('color',new THREE.BufferAttribute(C,3));
  g.computeBoundingSphere(); return g; }
let CWG=null;   // shared primitive geometries (made once, on the first open)
function cwGeos(){ if(CWG) return CWG;
  CWG={box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(.5,.5,1,10),cyl6:new THREE.CylinderGeometry(.5,.5,1,6),cone4:new THREE.ConeGeometry(.71,1,4),cone:new THREE.ConeGeometry(.5,1,7),
    blob:new THREE.IcosahedronGeometry(.5,1),blob0:new THREE.IcosahedronGeometry(.5,0),sph:new THREE.SphereGeometry(.5,10,8),plane:new THREE.PlaneGeometry(1,1,6,1)};
  CWG.cone4.rotateY(Math.PI/4); return CWG; }
function cwRng(seed){ let a=seed>>>0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

/* ---------- procedural textures (canvas, made once) ---------- */
function cwCanvasTex(w,h,draw){ const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext&&c.getContext('2d'); if(!g) return null; draw(g,w,h); const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; }
function cwWoodTex(){ return cwCanvasTex(512,512,(g,w,h)=>{ const R=cwRng(77);
  g.fillStyle='#4a2e1a'; g.fillRect(0,0,w,h);
  for(let y=0;y<h;y+=2){ const k=.5+.5*Math.sin(y*.05+Math.sin(y*.013)*4)+R()*.25; g.fillStyle='rgba('+Math.round(60+40*k)+','+Math.round(36+24*k)+','+Math.round(20+12*k)+',.55)'; g.fillRect(0,y,w,2); }
  for(let i=0;i<14;i++){ const x=R()*w, y=R()*h, r=6+R()*16; g.strokeStyle='rgba(30,16,8,.35)'; g.lineWidth=1.5; for(let k=0;k<5;k++){ g.beginPath(); g.ellipse(x,y,r*3.2+k*5,r*.8+k*2,0,0,Math.PI*2); g.stroke(); } }
  g.fillStyle='rgba(0,0,0,.18)'; for(let x=0;x<w;x+=128) g.fillRect(x,0,2,h); }); }
function cwStoneTex(){ return cwCanvasTex(256,256,(g,w,h)=>{ const R=cwRng(91); g.fillStyle='#24201d'; g.fillRect(0,0,w,h);
  for(let y=0;y<h;y+=32){ const off=(y/32)%2?32:0; for(let x=-off;x<w;x+=64){ const v=28+R()*14; g.fillStyle='rgb('+Math.round(v+6)+','+Math.round(v+2)+','+Math.round(v)+')'; g.fillRect(x+2,y+2,60,28); } } }); }

/* ---------- the region overlay: owner tint, borders, hover and selection, in the terrain's own shader ---------- */
function cwOverlayMat(){
  const W=CW.GW, Hh=CW.GH, D=new Uint8Array(W*Hh*4);
  for(let i=0;i<W*Hh;i++){ D[i*4]=CW.grid[i]; D[i*4+3]=255; }
  const reg=new THREE.DataTexture(D,W,Hh,THREE.RGBAFormat,THREE.UnsignedByteType); reg.magFilter=reg.minFilter=THREE.NearestFilter; reg.generateMipmaps=false; reg.needsUpdate=true;
  const P=new Uint8Array(64*4), pal=new THREE.DataTexture(P,64,1,THREE.RGBAFormat,THREE.UnsignedByteType); pal.magFilter=pal.minFilter=THREE.NearestFilter; pal.generateMipmaps=false;
  CW3.pal=pal; CW3.uni={uReg:{value:reg},uPal:{value:pal},uSel:{value:-1},uHov:{value:-1},uTime:{value:0}};
  const m=new THREE.MeshLambertMaterial({vertexColors:true});
  m.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,CW3.uni);
    sh.vertexShader='varying vec2 vW;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvW=(modelMatrix*vec4(transformed,1.0)).xz;');
    sh.fragmentShader='uniform sampler2D uReg; uniform sampler2D uPal; uniform float uSel; uniform float uHov; uniform float uTime; varying vec2 vW;\n'+
      'float cwId(vec2 uv){ return floor(texture2D(uReg,uv).r*255.0+0.5); }\n'+
      sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  vec2 ruv=vec2((vW.x+100.0)/200.0,(vW.y+65.0)/130.0); float rid=cwId(ruv); float rb=0.0, rs=0.0, rflag=0.0;
  if(rid<254.5){ vec4 pc=texture2D(uPal,vec2((rid+0.5)/64.0,0.5)); rflag=floor(pc.a*255.0+0.5);
    float tint=0.09; if(abs(rid-uHov)<0.5) tint=0.22; if(abs(rid-uSel)<0.5) tint=0.28;
    if(mod(rflag,2.0)>0.5) tint+=0.05+0.05*sin(uTime*3.0);
    diffuseColor.rgb=mix(diffuseColor.rgb,pc.rgb,tint);
    vec2 px=vec2(0.55/400.0,0.55/260.0);
    for(int k=0;k<4;k++){ vec2 d=k==0?vec2(1.0,0.0):k==1?vec2(-1.0,0.0):k==2?vec2(0.0,1.0):vec2(0.0,-1.0);
      float o=cwId(ruv+d*px); if(o<254.5&&abs(o-rid)>0.5){ rb=1.0; if(abs(o-uSel)<0.5||abs(rid-uSel)<0.5) rs=1.0; }
      float o2=cwId(ruv+d*px*2.4); if(abs(rid-uSel)<0.5&&abs(o2-rid)>0.5) rs=1.0; }
    diffuseColor.rgb=mix(diffuseColor.rgb,pc.rgb*0.45,rb*0.42);
    if(mod(floor(rflag/2.0),2.0)>0.5&&rb>0.5) diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.0,0.25,0.2),0.6+0.3*sin(uTime*6.0)); }`)
      .replace('#include <tonemapping_fragment>','if(rs>0.5) gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(1.0,0.86,0.42),0.85);\n#include <tonemapping_fragment>'); };
  m.customProgramCacheKey=()=>'cwTerrain';
  return m; }

/* ---------- trees ---------- */
function cwTreeGeo(kind){ const G=cwGeos(), P=[];
  const T=(h,r,c)=>P.push([G.cyl6,cwM(0,h/2,0,0,r,h,r),c||'#5a3c22']);
  if(kind==='oak'||kind==='wild'){ const tall=kind==='wild'?1.35:1; T(.9*tall,.16); const c1=kind==='wild'?'#2e5a26':'#4a7a32', c2=kind==='wild'?'#3a6a2c':'#5a8a3a';
    P.push([G.blob0,cwM(0,1.25*tall,0,0,1.15,1,1.15),c1],[G.blob0,cwM(.3,1.45*tall,.15,.5,.8,.75,.8),c2],[G.blob0,cwM(-.25,1.5*tall,-.2,1,.75,.7,.75),c1]); }
  else if(kind==='pine'){ T(.5,.12); P.push([G.cone,cwM(0,1.0,0,0,1.0,1.2,1.0),'#2e5232'],[G.cone,cwM(0,1.55,0,.4,.72,.95,.72),'#355e38']); }
  else if(kind==='snow'){ T(.5,.12); P.push([G.cone,cwM(0,1.0,0,0,1.0,1.2,1.0),'#3a5a48'],[G.cone,cwM(0,1.1,0,0,.96,.6,.96),'#e8eef0'],[G.cone,cwM(0,1.6,0,.4,.72,.95,.72),'#dfe8ea']); }
  else if(kind==='corrupt'){ T(1.1,.13,'#2a1e1e'); P.push([G.cyl6,cwM(.25,1.0,0,0,.07,.7,.07,0,-.9),'#2a1e1e'],[G.cyl6,cwM(-.22,1.15,.1,0,.06,.6,.06,.3,.9),'#2a1e1e'],
    [G.blob0,cwM(.4,1.3,0,0,.45,.35,.45),'#4a2a3a'],[G.blob0,cwM(-.35,1.45,.1,1,.4,.3,.4),'#3a2030'],[G.blob0,cwM(0,1.6,0,2,.55,.4,.55),'#4a2438']); }
  else if(kind==='dead'){ T(1.0,.1,'#6a5a4a'); P.push([G.cyl6,cwM(.2,.85,0,0,.05,.55,.05,0,-.8),'#6a5a4a'],[G.cyl6,cwM(-.18,1.0,.05,0,.05,.45,.05,.2,.9),'#6a5a4a']); }
  else if(kind==='swamp'){ T(.6,.14,'#3a3020'); P.push([G.blob0,cwM(0,.95,0,0,1.5,.55,1.5),'#4a5a2a'],[G.blob0,cwM(.3,.8,.2,.5,.9,.4,.9),'#3a4a22']); }
  return cwMerge(P); }
function cwTrees(root){
  const KINDS=['oak','wild','pine','snow','corrupt','dead','swamp'], lists={}; for(const k of KINDS) lists[k]=[];
  const R=cwRng(4242), lowQ=typeof GFX!=='undefined'&&GFX&&GFX.shadows===0, step=lowQ?1.3:.95, sets=CW_REGIONS.filter(r=>r.set&&r.set!=='none');
  for(let z=CW.Z0+1;z<CW.Z1-1;z+=step) for(let x=CW.X0+1;x<CW.X1-1;x+=step){
    const px=x+(R()-.5)*step*.9, pz=z+(R()-.5)*step*.9, reg=cwRegionAt(px,pz); if(!reg) continue;
    const B=CW_BIOME[reg.biome]; let dens=B.trees;
    const clump=cwFbm(px*.07+11,pz*.07-3); if(dens<.3) dens*=clump>.55?3.5:.4; else dens*=.55+clump*.9;
    let near=1e9; for(const s of sets){ const d=Math.hypot(px-s.x,pz-s.z); if(d<near) near=d; }
    if(near<4.2) continue; if(near<9) dens*=.35;                       // a clearing round every settlement
    if(R()>dens) continue;
    const h=cwHeight(px,pz); if(h<CW.WL+.3||h>11.5) continue;
    if(cwRiverD(px,pz)<1.8||cwLakeD(px,pz)<1.25) continue;
    let kind=B.tree; if(kind==='pine'&&h>7.5&&pz<-30) kind='snow'; if((kind==='oak'||kind==='pine')&&pz<-42) kind='snow';
    const s=.85+R()*.7; lists[kind].push([px,CW_BY+h-.05,pz,R()*6.28,s*(.8+R()*.4),s*(.85+R()*.5),R()]); }
  const mat=new THREE.MeshLambertMaterial({vertexColors:true}), col=new THREE.Color(), m=new THREE.Matrix4(); let total=0;
  for(const k of KINDS){ const L=lists[k]; if(!L.length) continue; const im=new THREE.InstancedMesh(cwTreeGeo(k),mat,L.length);
    L.forEach((t,i)=>{ _cwe.set(0,t[3],0); _cwq.setFromEuler(_cwe); m.compose(_cwv.set(t[0],t[1],t[2]),_cwq,_cws.set(t[4],t[5],t[4])); im.setMatrixAt(i,m); col.setRGB(.85+t[6]*.3,.85+t[6]*.3,.85+t[6]*.3); im.setColorAt(i,col); });
    im.castShadow=true; im.receiveShadow=true; root.add(im); total+=L.length; }
  CW3.treeCount=total; }

/* ---------- settlements, castles and capitals ---------- */
const CW_PAL={order:{wall:'#b7ad98',roof:'#3e5a8a',dark:'#5a5048',wood:'#6a4a2e'},chaos:{wall:'#3a3034',roof:'#5a1a1e',dark:'#1e1618',wood:'#2a1e1a'},
  wild:{wall:'#7a6040',roof:'#4a6a2a',dark:'#4a3a28',wood:'#5a3e22'},rebel:{wall:'#9a8a70',roof:'#8a5a3a',dark:'#5a4a3a',wood:'#6a4a2e'}};
function cwSettlement(R){
  const G=cwGeos(), P=[], glow=[], C=CW_PAL[R.fac]||CW_PAL.rebel, rnd=cwRng(R._i*977+13);
  const house=(x,z,ry,s,roof)=>{ P.push([G.box,cwM(x,.35*s,z,ry,.9*s,.7*s,1.1*s),C.wall],[G.cone4,cwM(x,.95*s,z,ry,.95*s,.55*s,1.15*s),roof||C.roof]); };
  const tower=(x,z,r,h,roof,dark)=>{ P.push([G.cyl,cwM(x,h/2,z,0,r*2,h,r*2),dark?C.dark:C.wall]); if(roof) P.push([G.cone,cwM(x,h+r*.9,z,0,r*2.6,r*1.8,r*2.6),C.roof]); else P.push([G.cyl,cwM(x,h+.12,z,0,r*2.3,.25,r*2.3),C.dark]); };
  const wallRing=(hw,hd,h,th,gate)=>{ P.push([G.box,cwM(0,h/2,-hd,0,hw*2,h,th),C.wall],[G.box,cwM(-hw,h/2,0,0,th,h,hd*2),C.wall],[G.box,cwM(hw,h/2,0,0,th,h,hd*2),C.wall]);
    if(gate){ const g=hw*.35; P.push([G.box,cwM(-(hw+g)/2,h/2,hd,0,hw-g,h,th),C.wall],[G.box,cwM((hw+g)/2,h/2,hd,0,hw-g,h,th),C.wall]); } else P.push([G.box,cwM(0,h/2,hd,0,hw*2,h,th),C.wall]);
    for(const sx of [-1,1]) for(const sz of [-1,1]) tower(sx*hw,sz*hd,th*1.2,h*1.45,true); };
  const k=R.set;
  if(k==='capital'&&R.fac==='chaos'){ wallRing(3.4,3,1.5,.5,true); P.push([G.box,cwM(0,1.8,-.4,0,2.4,3.6,2.4),C.dark]);
    for(const [x,z,h] of [[0,-.4,6.4],[-1.4,.8,4.2],[1.5,.6,4.8],[-.9,-1.6,3.8]]) P.push([G.cone,cwM(x,h/2+1,z,0,.9,h,.9),C.dark]);
    glow.push([G.box,cwM(0,2.4,.85,0,.5,.6,.05),'#ff5a1a'],[G.sph,cwM(0,7.6,-.4,0,.35,.35,.35),'#ff3a1a']);
    for(let i=0;i<6;i++){ const a=i/6*6.28+.3; house(Math.cos(a)*5.2,Math.sin(a)*4.6,a,1.1); } }
  else if(k==='capital'){ wallRing(3.4,3,1.5,.5,true); P.push([G.box,cwM(0,1.6,-.5,0,2.2,3.2,2.2),C.wall],[G.cone4,cwM(0,3.8,-.5,0,2.4,1.3,2.4),C.roof]);
    tower(-1.6,.9,.45,4.2,true); tower(1.6,.9,.45,4.6,true); tower(0,-2,.5,5.2,true);
    for(let i=0;i<8;i++){ const a=i/8*6.28+.2, r=5+rnd()*1.5; house(Math.cos(a)*r,Math.sin(a)*r*.85,a,1+rnd()*.3); } }
  else if(k==='timber'){ for(let i=0;i<26;i++){ const a=i/26*6.28; if(Math.abs(a-1.57)<.25) continue; P.push([G.cyl6,cwM(Math.cos(a)*3.2,.7,Math.sin(a)*3.2,0,.28,1.4+rnd()*.3,.28),C.wood]); }
    P.push([G.box,cwM(0,.6,0,.3,1.6,1.2,3.4),C.wood],[G.cone4,cwM(0,1.55,0,.3,1.9,1.1,3.6),C.roof]); house(-1.7,1.2,.8,.9); house(1.8,-1,2.2,.9);
    if(R.capital){ tower(0,-2.2,.45,3.6,true); for(let i=0;i<5;i++){ const a=i/5*6.28; house(Math.cos(a)*5,Math.sin(a)*4.5,a,1); } } }
  else if(k==='chaosfort'){ wallRing(2.3,2,1.2,.4,true); for(const [x,z,h] of [[0,0,5],[-1,.6,3.2],[1.1,-.5,3.6]]) P.push([G.cone,cwM(x,h/2+.6,z,0,.75,h,.75),C.dark]); glow.push([G.sph,cwM(0,5.8,0,0,.3,.3,.3),'#ff3a1a']); }
  else if(k==='castle'){ wallRing(2.6,2.3,1.3,.45,true); P.push([G.box,cwM(0,1.3,-.3,0,1.6,2.6,1.6),C.wall],[G.cone4,cwM(0,3,-.3,0,1.8,1,1.8),C.roof]); }
  else if(k==='fort'){ wallRing(1.9,1.7,1,.35,true); tower(0,-.4,.5,2.6,true); }
  else if(k==='tower'){ tower(0,0,.7,4.2,true); P.push([G.box,cwM(1.2,.3,.6,.4,1,.6,1),C.wall]); }
  else if(k==='camp'){ for(let i=0;i<5;i++){ const a=i/5*6.28+rnd(); P.push([G.cone,cwM(Math.cos(a)*1.8,.5,Math.sin(a)*1.8,a,1.1,1,1.1),i%2?'#8a7a5a':'#6a5a40']); } glow.push([G.sph,cwM(0,.25,0,0,.5,.4,.5),'#ff8a2a']); }
  else { const n=4+Math.floor(rnd()*3); for(let i=0;i<n;i++){ const a=i/n*6.28+rnd()*.6, r=1.4+rnd()*1.3; house(Math.cos(a)*r,Math.sin(a)*r,a+1.57,.9+rnd()*.35, R.fac==='rebel'||R.biome==='farm'?'#8a6a3a':C.roof); }
    if(R.frozen) P.push([G.cyl,cwM(0,.02,0,0,4,.04,4),'#d8e8f0']); }
  const g=new THREE.Group(); const mesh=new THREE.Mesh(cwMerge(P),CW3.setMat); mesh.castShadow=mesh.receiveShadow=true; mesh.userData.region=R.id; g.add(mesh);
  if(glow.length){ const gm=new THREE.Mesh(cwMerge(glow),CW3.glowMat); gm.userData.region=R.id; g.add(gm); }
  // the banner: its colour is the owner's, set by cwRefresh
  const top=k==='capital'?7.6:k==='timber'?3.8:k==='castle'?4:k==='chaosfort'?5.6:k==='tower'?5.6:k==='fort'?3.4:2.6;
  const pole=new THREE.Mesh(G.cyl6,CW3.poleMat); pole.scale.set(.07,1.8,.07); pole.position.set(.6,top+.9,.3); g.add(pole);
  const flag=new THREE.Mesh(G.plane,new THREE.MeshLambertMaterial({color:'#ffffff',side:THREE.DoubleSide})); flag.scale.set(1.1,.7,1); flag.position.set(1.15,top+1.45,.3); g.add(flag);
  CW3.flags.push({mesh:flag,id:R.id,ph:R._i*1.7});
  const y=Math.max(cwY(R.x,R.z),cwY(R.x+1.5,R.z),cwY(R.x-1.5,R.z),cwY(R.x,R.z+1.5),cwY(R.x,R.z-1.5))-.15;
  g.position.set(R.x,y,R.z); g.rotation.y=(R._i*2.39)%6.28*.25; g.userData.region=R.id; R._top=y+top+2.4;
  return g; }

/* ---------- roads between neighbouring settlements ---------- */
function cwRoads(root){
  const P=[], C=[], col=new THREE.Color('#8a6c4a'), done=new Set(), w=.32;
  for(const A of CW_REGIONS) for(const id of CW.adj[A.id]){ const B=CW.byId[id], key=[A.id,id].sort().join(); if(done.has(key)) continue; done.add(key);
    const L=Math.hypot(B.x-A.x,B.z-A.z); if(L>48) continue; const n=Math.ceil(L/.8), dx=(B.x-A.x)/L, dz=(B.z-A.z)/L, nx=-dz*w, nz=dx*w;
    let prev=null, sea=false;
    for(let i=0;i<=n;i++){ const t=i/n, bend=Math.sin(t*Math.PI)*(((A._i+B._i)%5)-2)*1.2, x=A.x+(B.x-A.x)*t+(-dz)*bend, z=A.z+(B.z-A.z)*t+dx*bend;
      const h=cwHeight(x,z); if(cwCoast(x,z)<.02){ sea=true; break; } const y=CW_BY+Math.max(h,CW.WL+.22)+.07; const cur=[x+nx,y,z+nz,x-nx,y,z-nz];
      if(prev){ P.push(prev[0],prev[1],prev[2],prev[3],prev[4],prev[5],cur[0],cur[1],cur[2], cur[0],cur[1],cur[2],prev[3],prev[4],prev[5],cur[3],cur[4],cur[5]); for(let k=0;k<6;k++) C.push(col.r,col.g,col.b); }
      prev=cur; }
    if(sea) continue; }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(C,3)); g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2})); m.receiveShadow=true; root.add(m); }

/* ---------- building it all, once ---------- */
function cwBuild(){
  cwBuildGrid(); const G=cwGeos();
  const S=new THREE.Scene(); S.background=new THREE.Color('#0b0907'); S.fog=new THREE.Fog('#0b0907',380,760); CW3.scene=S;
  CW3.cam=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,1,1400);
  // light: a dim chamber, one warm key light that casts the shadows, and the candles' flickering glow
  S.add(new THREE.HemisphereLight('#9a8a74','#1a120c',.62));
  const key=new THREE.DirectionalLight('#ffd6a0',.78); key.position.set(-150,190,140); key.target.position.set(0,0,0); key.castShadow=true;
  Object.assign(key.shadow.camera,{left:-135,right:135,top:100,bottom:-100,near:10,far:500}); key.shadow.mapSize.set(2048,2048); key.shadow.bias=-.0008; S.add(key,key.target); CW3.key=key;
  const fill=new THREE.DirectionalLight('#6a7a9a',.16); fill.position.set(160,90,-120); S.add(fill);
  // the chamber
  const stone=cwStoneTex(); if(stone) stone.repeat.set(10,3);
  const room=new THREE.Mesh(new THREE.BoxGeometry(900,420,760),new THREE.MeshLambertMaterial({color:'#5a5048',map:stone,side:THREE.BackSide})); room.position.y=130; S.add(room);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(900,760),new THREE.MeshLambertMaterial({color:'#2a1e16'})); floor.rotation.x=-Math.PI/2; floor.position.y=-78; floor.receiveShadow=true; S.add(floor);
  for(const x of [-300,300]) for(const z of [-260,260]){ const p=new THREE.Mesh(G.box,new THREE.MeshLambertMaterial({color:'#2e2824'})); p.scale.set(26,420,26); p.position.set(x,130,z); S.add(p); }
  for(const [x,c] of [[-160,'#7a1a1e'],[0,'#1e2a5a'],[160,'#2a5a2e']]){ const b=new THREE.Mesh(G.plane,new THREE.MeshLambertMaterial({color:c,side:THREE.DoubleSide})); b.scale.set(44,110,1); b.position.set(x,90,-372); S.add(b); }
  // the war table
  const wood=cwWoodTex(); if(wood) wood.repeat.set(2,1.4);
  const woodMat=new THREE.MeshLambertMaterial({color:'#8a6448',map:wood}), darkWood=new THREE.MeshLambertMaterial({color:'#3a2618',map:wood});
  const top=new THREE.Mesh(G.box,woodMat); top.scale.set(262,6,192); top.position.y=-3; top.receiveShadow=true; top.castShadow=true; S.add(top);
  for(const sx of [-1,1]) for(const sz of [-1,1]){ const l=new THREE.Mesh(G.box,darkWood); l.scale.set(12,72,12); l.position.set(sx*115,-42,sz*80); l.castShadow=true; S.add(l); }
  for(const [sx,sz,w,d] of [[0,1,240,4],[0,-1,240,4],[1,0,4,170],[-1,0,4,170]]){ const a=new THREE.Mesh(G.box,darkWood); a.scale.set(w,10,d); a.position.set(sx*118,-11,sz*84); S.add(a); }
  // the model: a tray with a carved rim, holding the continent and its sea
  const rimMat=new THREE.MeshLambertMaterial({color:'#5a3a22',map:wood});
  for(const [x,z,w,d] of [[0,-67,208,4],[0,67,208,4],[-102,0,4,138],[102,0,4,138]]){ const r=new THREE.Mesh(G.box,rimMat); r.scale.set(w,3.4,d); r.position.set(x,1.7,z); r.castShadow=r.receiveShadow=true; S.add(r); }
  const tray=new THREE.Mesh(G.box,darkWood); tray.scale.set(204,.3,134); tray.position.y=.05; S.add(tray);
  // the land
  const NX=250, NZ=164, tg=new THREE.PlaneGeometry(200,130,NX,NZ); tg.rotateX(-Math.PI/2);
  const pos=tg.attributes.position, colA=new Float32Array(pos.count*3), cc=[0,0,0];
  for(let i=0;i<pos.count;i++){ const x=pos.getX(i), z=pos.getZ(i), h=cwHeight(x,z); pos.setY(i,CW_BY+h); cwColor(x,z,h,cc); colA[i*3]=cc[0]; colA[i*3+1]=cc[1]; colA[i*3+2]=cc[2]; }
  tg.setAttribute('color',new THREE.BufferAttribute(colA,3)); tg.computeVertexNormals();
  const land=new THREE.Mesh(tg,cwOverlayMat()); land.receiveShadow=true; land.castShadow=true; S.add(land); CW3.land=land;
  // water: one sheet at sea level shows the sea, the rivers and the lakes; frozen lakes get a sheet of ice
  const water=new THREE.Mesh(new THREE.PlaneGeometry(200,130),new THREE.MeshPhongMaterial({color:'#2e5a72',specular:'#9ab8c8',shininess:70,transparent:true,opacity:.84}));
  water.rotation.x=-Math.PI/2; water.position.y=CW_BY+CW.WL; water.receiveShadow=true; S.add(water); CW3.water=water;
  for(const R of CW_REGIONS) if(R.frozen){ const L=CW_LAKES.find(l=>Math.hypot(l[0]-R.x,l[1]-R.z)<10); if(!L) continue; const ice=new THREE.Mesh(G.cyl,new THREE.MeshLambertMaterial({color:'#dbe9f0'})); ice.scale.set(L[2]*2,.06,L[2]*2); ice.position.set(L[0],CW_BY+CW.WL+.04,L[1]); S.add(ice); }
  // lava in the volcano craters
  CW3.glowMat=new THREE.MeshBasicMaterial({color:'#ffffff',vertexColors:true}); CW3.setMat=new THREE.MeshLambertMaterial({vertexColors:true}); CW3.poleMat=new THREE.MeshLambertMaterial({color:'#4a3420'});
  for(const V of CW_VOLCANOES){ const l=new THREE.Mesh(G.cyl,new THREE.MeshBasicMaterial({color:'#ff5a14'})); const r=V[2]*.2; l.scale.set(r*2,.1,r*2); l.position.set(V[0],CW_BY+cwHeight(V[0],V[1])+.08,V[1]); S.add(l); }
  cwRoads(S); cwTrees(S);
  // settlements
  for(const R of CW_REGIONS){ if(!R.set||R.set==='none') continue; const g=cwSettlement(R); S.add(g); CW3.pick.push(g); }
  // candles at the table's edge, each with its own flickering light (no shadows: the key light casts those)
  const wax=new THREE.MeshLambertMaterial({color:'#efe4c8'}), brass=new THREE.MeshPhongMaterial({color:'#b08a3a',specular:'#ffe0a0',shininess:60});
  const flameM=new THREE.MeshBasicMaterial({color:'#ffcf6a',transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}), haloM=new THREE.MeshBasicMaterial({color:'#ff9a3a',transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false});
  for(const [x,z,h] of [[-114,80,14],[-106,86,9],[114,80,11],[116,-78,16],[-116,-80,12]]){ const g=new THREE.Group(); g.position.set(x,0,z);
    const dish=new THREE.Mesh(G.cyl,brass); dish.scale.set(9,.8,9); dish.position.y=.4; dish.castShadow=true; g.add(dish);
    const c=new THREE.Mesh(G.cyl,wax); c.scale.set(4,h,4); c.position.y=h/2+.8; c.castShadow=true; g.add(c);
    const drip=new THREE.Mesh(G.sph,wax); drip.scale.set(4.4,1.4,4.4); drip.position.y=h+.8; g.add(drip);
    const fl=new THREE.Mesh(G.cone,flameM); fl.scale.set(1.3,3.4,1.3); fl.position.y=h+3; g.add(fl);
    const ha=new THREE.Mesh(G.sph,haloM); ha.scale.setScalar(4.5); ha.position.y=h+2.8; g.add(ha);
    const L=new THREE.PointLight('#ffae55',1.15,170,1.5); L.position.y=h+4; g.add(L);
    S.add(g); CW3.candles.push({fl,ha,L,base:1.15,ph:x*.13+z*.07}); }
  // labels (HTML, positioned each frame)
  const box=document.createElement('div'); box.id='cwLabels'; box.className='cw-labels'; const cp=$('#camp'); cp.insertBefore(box,cp.firstChild); CW3.lbox=box;   // inside the campaign layer, under its card
  for(const R of CW_REGIONS){ const el=document.createElement('div'); el.className='cwl'+(R.capital?' cap':'')+(R.strat?' strat':'');
    el.innerHTML='<b>'+R.name+'</b>'+(R.capital?'<i>★</i>':R.strat?'<i>◆</i>':'');
    el.addEventListener('click',e=>{ e.stopPropagation(); cwSelect(R.id); }); box.appendChild(el);
    CW3.labels.push({el,R,y:R._top||cwY(R.x,R.z)+2.5,show:true}); }
  const tip=document.createElement('div'); tip.id='cwTip'; tip.className='cw-tip'; tip.hidden=true; document.body.appendChild(tip); CW3.tip=tip;
  CW3.ray=new THREE.Raycaster(); CW3.ndc=new THREE.Vector2();
  CW3.built=true;
}
/* ---------- state → picture: owners, selection, attackable and threatened regions ---------- */
const CW_OWNC={0:'#e8b43a',1:'#d0465a',2:'#4fae6a','-1':'#9a8c76'};
function cwOwnerHex(o){ if(o===0) return CW_FACTIONS[campSide()].col; if(o===1) return CW_FACTIONS[otherSide(campSide())].col; return CW_OWNC[o]; }
function cwRefresh(){
  if(!CW3.built||!camp) return;
  const P=CW3.pal.image.data, col=new THREE.Color();
  CW_REGIONS.forEach((R,i)=>{ const o=camp.owner[R.id]; col.set(cwOwnerHex(o)); P[i*4]=col.r*255; P[i*4+1]=col.g*255; P[i*4+2]=col.b*255;
    P[i*4+3]=(campCanAttack(R.id)?1:0)|(camp.pending&&camp.pending.id===R.id?2:0); });
  CW3.pal.needsUpdate=true;
  const sel=camp.sel?CW.byId[camp.sel]:null; CW3.uni.uSel.value=sel?sel._i:-1;
  for(const f of CW3.flags) f.mesh.material.color.set(cwOwnerHex(camp.owner[f.id]));
  for(const L of CW3.labels){ const o=camp.owner[L.R.id]; L.el.style.borderColor=cwOwnerHex(o); L.el.classList.toggle('sel',camp.sel===L.R.id); L.el.classList.toggle('can',campCanAttack(L.R.id)); L.el.classList.toggle('mine',o===0); }
}
function cwSelect(id){ campSelect(id); cwRefresh(); }
/* ---------- opening and closing ---------- */
function cwOpen(){
  if(!cwSupported()||CW3.failed) return;
  try{ if(!CW3.built){ cwBuild(); const R=CW.byId[campMyCap()]; CW3.t.x=CW3.tg.x=R.x*.55; CW3.t.z=CW3.tg.z=R.z*.5+4; } }
  catch(e){ console.warn('war table unavailable',e); CW3.failed=true; return; }
  CW3.on=true; setBodyClass('cw-on',true); $('#camp').classList.add('c3d'); CW3.lbox.hidden=false;
  CW3.shAU=renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate=false; renderer.shadowMap.needsUpdate=true; CW3.shOn=renderer.shadowMap.enabled; renderer.shadowMap.enabled=true;
  cwRefresh();
}
function cwClose(){
  if(!CW3.on) return; CW3.on=false; setBodyClass('cw-on',false); $('#camp').classList.remove('c3d'); if(CW3.lbox) CW3.lbox.hidden=true; if(CW3.tip) CW3.tip.hidden=true;
  renderer.shadowMap.autoUpdate=CW3.shAU!==false; renderer.shadowMap.enabled=CW3.shOn!==false; CW3.ptrs.clear();
}
/* ---------- each frame while open ---------- */
function cwFrame(rdt){
  const C=CW3; C.time+=rdt; C.uni.uTime.value=C.time;
  // keyboard
  const K=C.keys, ps=C.dist*rdt*.9; if(K.w||K.arrowup) cwPan(0,ps,true); if(K.s||K.arrowdown) cwPan(0,-ps,true); if(K.a||K.arrowleft) cwPan(-ps,0,true); if(K.d||K.arrowright) cwPan(ps,0,true);
  if(K.q) C.yGoal=clamp(C.yGoal-rdt*1.2,-.75,.75); if(K.e) C.yGoal=clamp(C.yGoal+rdt*1.2,-.75,.75);
  // camera: eased toward its goal
  const k=1-Math.exp(-rdt*7); C.t.x+=(C.tg.x-C.t.x)*k; C.t.z+=(C.tg.z-C.t.z)*k; C.dist+=(C.dGoal-C.dist)*k; C.pitch+=(C.pGoal-C.pitch)*k; C.yaw+=(C.yGoal-C.yaw)*k;
  const cam=C.cam, cp=Math.cos(C.pitch), ty=CW_BY+3;
  cam.position.set(C.t.x+Math.sin(C.yaw)*cp*C.dist,ty+Math.sin(C.pitch)*C.dist,C.t.z+Math.cos(C.yaw)*cp*C.dist);
  const ground=CW_BY+Math.max(0,cwHeight(clamp(cam.position.x,-99,99),clamp(cam.position.z,-64,64)))+4; if(cam.position.y<ground) cam.position.y=ground;
  cam.lookAt(C.t.x,ty,C.t.z);
  if(cam.aspect!==innerWidth/innerHeight){ cam.aspect=innerWidth/innerHeight; cam.updateProjectionMatrix(); }
  // candles flicker; banners wave
  for(const c of C.candles){ const f=.82+.1*Math.sin(C.time*11+c.ph)+.08*Math.sin(C.time*23.7+c.ph*2)+.05*Math.sin(C.time*5.3); c.L.intensity=c.base*f; c.fl.scale.set(1.3*(.9+.1*f),3.4*f,1.3*(.9+.1*f)); c.ha.scale.setScalar(4.5*f); }
  for(const fl of C.flags) fl.mesh.rotation.y=.25*Math.sin(C.time*2.2+fl.ph);
  cwLabels();
  renderer.render(C.scene,cam);
}
const _cwp=new V3();
function cwLabels(){
  const C=CW3, d=C.dist, W=innerWidth, H=innerHeight, sel=camp&&camp.sel;
  for(const L of C.labels){ const R=L.R;
    const imp=R.capital?3:R.strat?2:(R.s||1)>=2?1:0, show=sel===R.id||(d<75?true:d<120?imp>=1:imp>=2);
    _cwp.set(R.x,L.y,R.z).project(C.cam); const vis=show&&_cwp.z<1&&Math.abs(_cwp.x)<1.05&&Math.abs(_cwp.y)<1.05;
    if(vis!==L.show){ L.el.style.display=vis?'':'none'; L.show=vis; } if(!vis) continue;
    const dist=C.cam.position.distanceTo(_cwv.set(R.x,L.y,R.z)), sc=clamp(95/dist,.62,1.25)*(R.capital?1.15:1);
    L.el.style.transform='translate('+((_cwp.x*.5+.5)*W).toFixed(1)+'px,'+((-_cwp.y*.5+.5)*H).toFixed(1)+'px) translate(-50%,-100%) scale('+sc.toFixed(3)+')'; }
}
/* ---------- input ---------- */
function cwPan(dx,dz,world){ const C=CW3, s=world?1:C.dist*.0019, cy=Math.cos(C.yaw), sy=Math.sin(C.yaw);
  // dx: screen right, dz: screen up (away from the camera)
  const rx=cy, rz=-sy, fx=-sy, fz=-cy; C.tg.x=clamp(C.tg.x+(rx*dx+fx*dz)*s,CW.X0,CW.X1); C.tg.z=clamp(C.tg.z+(rz*dx+fz*dz)*s,CW.Z0,CW.Z1); }
function cwZoom(f){ CW3.dGoal=clamp(CW3.dGoal*f,22,215); }
function cwPickAt(x,y){
  const C=CW3; C.ndc.set(x/innerWidth*2-1,-(y/innerHeight)*2+1); C.ray.setFromCamera(C.ndc,C.cam);
  const hits=C.ray.intersectObjects(C.pick.concat([C.land]),true);
  for(const h of hits){ let o=h.object; while(o&&!(o.userData&&o.userData.region)) o=o.parent; if(o&&o.userData.region) return CW.byId[o.userData.region];
    if(h.object===C.land){ const R=cwRegionAt(h.point.x,h.point.z); return R; } }
  return null; }
function cwHover(x,y){
  const R=cwPickAt(x,y), C=CW3, i=R?R._i:-1; C.uni.uHov.value=i;
  if(R&&C.tip){ const o=camp?camp.owner[R.id]:-1; C.tip.hidden=false; C.tip.innerHTML='<b>'+R.name+'</b><span style="color:'+cwOwnerHex(o)+'">'+OWNER_NAME(o)+'</span>'+(camp&&campCanAttack(R.id)?'<em>can be attacked</em>':'');
    C.tip.style.transform='translate('+(x+14)+'px,'+(y+12)+'px)'; } else if(C.tip) C.tip.hidden=true; }
function cwTwo(){ const [a,b]=[...CW3.ptrs.values()]; return {d:Math.hypot(a.x-b.x,a.y-b.y),mx:(a.x+b.x)/2,my:(a.y+b.y)/2}; }
canvas.addEventListener('pointerdown',e=>{ if(!CW3.on) return; canvas.setPointerCapture&&canvas.setPointerCapture(e.pointerId);
  CW3.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,btn:e.button,t:performance.now(),moved:false}); if(CW3.ptrs.size===2) CW3.pinch=cwTwo(); });
canvas.addEventListener('pointermove',e=>{ if(!CW3.on) return; const p=CW3.ptrs.get(e.pointerId);
  if(!p){ if(e.pointerType==='mouse'){ const now=performance.now(); if(now-CW3.lastHov>50){ CW3.lastHov=now; cwHover(e.clientX,e.clientY); } } return; }
  const dx=e.clientX-p.x, dy=e.clientY-p.y; p.x=e.clientX; p.y=e.clientY; if(Math.hypot(p.x-p.sx,p.y-p.sy)>6) p.moved=true;
  if(CW3.ptrs.size===1){ if(p.btn===2||e.shiftKey){ CW3.yGoal=clamp(CW3.yGoal+dx*.005,-.75,.75); CW3.pGoal=clamp(CW3.pGoal-dy*.004,.42,1.38); } else cwPan(-dx,dy); }
  else if(CW3.ptrs.size===2&&CW3.pinch){ const q=cwTwo(); if(q.d>10&&CW3.pinch.d>10) cwZoom(CW3.pinch.d/q.d); cwPan(-(q.mx-CW3.pinch.mx),q.my-CW3.pinch.my); CW3.pinch=q; } });
function cwEnd(e){ if(!CW3.on) return; const p=CW3.ptrs.get(e.pointerId); CW3.ptrs.delete(e.pointerId); if(CW3.ptrs.size<2) CW3.pinch=null;
  if(!p||p.moved||e.type!=='pointerup'||CW3.ptrs.size) return;
  if(p.btn===0){ const R=cwPickAt(e.clientX,e.clientY); if(R){ sfx('ui'); const now=performance.now();
      if(CW3.lastClick&&CW3.lastClick.id===R.id&&now-CW3.lastClick.t<380){ CW3.tg.x=R.x; CW3.tg.z=R.z; CW3.dGoal=Math.min(CW3.dGoal,60); }   // double-click: fly there
      CW3.lastClick={id:R.id,t:now}; cwSelect(R.id); } } }
canvas.addEventListener('pointerup',cwEnd); canvas.addEventListener('pointercancel',cwEnd);
canvas.addEventListener('pointerleave',()=>{ if(CW3.on&&CW3.tip) CW3.tip.hidden=true; });
canvas.addEventListener('wheel',e=>{ if(!CW3.on) return; e.preventDefault(); cwZoom(Math.exp(e.deltaY*.0011)); },{passive:false});
window.addEventListener('keydown',e=>{ if(!CW3.on||(e.target&&e.target.tagName==='INPUT')) return; const k=e.key.toLowerCase(); CW3.keys[k]=true;
  if(k==='+'||k==='=') cwZoom(.85); if(k==='-') cwZoom(1.18); if(k==='escape'&&camp&&camp.sel) cwSelect(null); });
window.addEventListener('keyup',e=>{ CW3.keys[(e.key||'').toLowerCase()]=false; });
window.addEventListener('blur',()=>{ CW3.keys={}; });
