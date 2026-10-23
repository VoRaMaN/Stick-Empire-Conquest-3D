/* ================= Riverlands: a river valley 320 m square, about ten times the classic map =================
   The classic map is 168 × 64 m of ground with the castles 92 m apart; Riverlands is 320 × 320 m and pushes the
   castles out to the edges (curtain walls at |x| 118, statues at ±106; everything castle-local follows MAP.cf).
   A river winds down the middle under five bridges (three stone, two timber) and can be waded anywhere, slowly.
   Each army has two gold mines in the corners beside its castle, with a storehouse its miners carry the gold to.
   Four capture zones, A to D, sit as in the design sketch (point-symmetric, two nearer each army): soldiers standing
   in one, unopposed, lower the enemy's banner and raise their own, and a zone pays its holder gold every second.
   Around them: hills, forests, bushes and long grass, two villages with windmills and two hamlets, tent camps
   beside the castles, watchtowers by the bridges, ruins on two hilltops, a forested rim.
   The layout comes from its own seeded random stream and is built once, the first time the map is chosen, so it is
   the same every time and the classic battles' random numbers are never touched. Vegetation is instanced in 100 m
   tiles so whatever is off screen (or beyond the haze) is skipped. */
const RL={built:false,on:false,WL:-.45,zones:[],obst:[],og:null,ogN:85,ogS:4,og0:-170,sway:{value:0},flow:null,mills:[],fires:[],flags:[],tiles:[],mmBg:null,mmKey:'',low:null};
const RL_CF=118, RL_HALF=160, RL_LIM=156, RL_EDGE=200;   // castle walls at |x| 118; soldiers within ±156; ground out to ±200
const RL_ZONES=[{id:'A',x:32,z:-132},{id:'B',x:-32,z:-46},{id:'C',x:32,z:46},{id:'D',x:-32,z:132},
  {id:'E',x:-34,z:81},{id:'F',x:34,z:-81},{id:'G',x:-33,z:-74},{id:'H',x:33,z:74},{id:'I',x:-72,z:42},{id:'J',x:72,z:-42}];   // E–J: militia villages, watchtowers, resurrection shrines (37f)
const RL_ZR=8, RL_CAPT=11, RL_INCOME=5;   // zone radius (m), seconds to capture alone, gold a second for each zone held
// two mines a side, in the corners beside the castles, each with a storehouse nearer the field
const RL_MINE=[[{x:-122,z:-112,dx:-110,dz:-100},{x:-122,z:112,dx:-110,dz:100}],[{x:122,z:-112,dx:110,dz:-100},{x:122,z:112,dx:110,dz:100}]];
function rlRng(seed){ let a=seed>>>0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const rlSym=L=>L.concat(L.map(q=>[-q[0],-q[1]].concat(q.slice(2))));   // the map turns about its centre: each feature has its twin

/* ---------- the shape of the land ---------- */
const rlRiverX=z=>8*Math.sin(z*.026)+3.5*Math.sin(z*.063);        // odd in z, like the rest of the layout
const rlRiverDX=z=>8*.026*Math.cos(z*.026)+3.5*.063*Math.cos(z*.063);
const rlRiverW=z=>4.8+.6*Math.cos(z*.05);
const rlRiverD=(x,z)=>Math.abs(x-rlRiverX(z))/rlRiverW(z);        // 0 mid-stream, 1 at the water's edge
const RL_HILLS=rlSym([[-80,58,13,3.4],[-62,-118,9,2.4],[30,15,9,1.8],[-100,-62,12,2.2],[-40,100,10,2.6],[-22,-152,11,2.6],[-140,72,12,2.4],[-70,10,10,1.6],[-128,-150,14,3]]);
function rlWave(x,z){ return .3*Math.sin(x*.083+.4)*Math.cos(z*.071+.2)+.22*Math.sin(x*.031+1.3)*Math.sin(z*.047+.5)+.16*Math.sin(x*.017-.6)*Math.cos(z*.013+1.1)+.12*Math.sin(x*.21+z*.17)+.07*Math.sin(x*.47-z*.39); }
function rlLand(x,z){
  let h=.5+.45*(rlWave(x,z)+rlWave(-x,-z));
  for(const q of RL_HILLS){ const dx=x-q[0],dz=z-q[1]; h+=q[3]*Math.exp(-(dx*dx+dz*dz)/(q[2]*q[2])); }
  // the castles, statues and the yards in front of them sit on level ground
  const f=smooth(clamp((Math.abs(x)-(RL_CF-16))/8,0,1))*(1-smooth(clamp((Math.abs(z)-34)/12,0,1)));
  h=lerp(h,.45,f*.85);
  // the valley rim: hills rise past the edge of the field
  const rx=Math.max(0,Math.abs(x)-RL_HALF), rz=Math.max(0,Math.abs(z)-RL_HALF), rr=Math.hypot(rx,rz);
  if(rr>0) h+=12*smooth(clamp(rr/34,0,1))+1.6*Math.sin(x*.13)*Math.cos(z*.11)*smooth(clamp(rr/12,0,1))*(1-smooth(clamp((rr-30)/8,0,1)));
  return h;
}
function rlGroundH(x,z){
  let h=rlLand(x,z);
  // capture zones: a level circle
  for(const Z of RL.zones){ const d=Math.hypot(x-Z.x,z-Z.z); if(d<RL_ZR+4) h=lerp(Z.h,h,smooth(clamp((d-RL_ZR-.5)/3.5,0,1))); }
  // the river: a channel about 9 m wide; the banks widen where the land is high so it cuts a gorge, not a cliff
  const d=rlRiverD(x,z);
  if(d<3.4){ const bed=-.3-1.1*Math.max(0,1-d*d); if(d<1) h=bed; else { const wb=.9+Math.max(0,h-.6)*.16; h=lerp(-.3,h,smooth(clamp((d-1)/wb,0,1))); }
    const fk=rlFordK(z); if(fk>0&&h<RL.WL-.2) h=lerp(h,RL.WL-.2,fk); }   // fords: the bed rises to a wadeable shallow (37f)
  return h;
}
// bridges: a deck across the river, arched for the stone ones. Walking height is the higher of ground and deck.
const RL_BRIDGES=[{z:0,len:20,wid:6,arch:1.2,kind:'stone'},{z:70,len:16,wid:4.5,arch:.4,kind:'wood'},{z:-70,len:16,wid:4.5,arch:.4,kind:'wood'},{z:138,len:17,wid:4.6,arch:.8,kind:'stone'},{z:-138,len:17,wid:4.6,arch:.8,kind:'stone'}];
function rlBridgeInit(){ for(const B of RL_BRIDGES){ B.x=rlRiverX(B.z); const dxz=rlRiverDX(B.z), n=Math.hypot(1,dxz);
  B.ax=1/n; B.az=-dxz/n;   // across the stream
  B.w=[B.x-B.ax*B.len/2,B.z-B.az*B.len/2]; B.e=[B.x+B.ax*B.len/2,B.z+B.az*B.len/2];   // west and east ends
  B.h0=Math.max(rlGroundH(B.w[0],B.w[1]),rlGroundH(B.e[0],B.e[1]),.3)+.04; } }
function rlDeck(x,z){ let best=-1e9;
  for(const B of RL_BRIDGES){ const dx=x-B.x, dz=z-B.z; if(dx*dx+dz*dz>B.len*B.len) continue; const s=dx*B.ax+dz*B.az, q=-dx*B.az+dz*B.ax;
    if(Math.abs(s)<B.len/2&&Math.abs(q)<B.wid/2){ const k=2*s/B.len; best=Math.max(best,B.h0+B.arch*(1-k*k)); } }
  return best; }
function rlWalkH(x,z){ const g=rlGroundH(x,z), d=rlDeck(x,z); return d>g?d:g; }

/* ---------- roads (dirt, painted into the ground's colours); built once the bridges are placed ---------- */
let RL_ROADS=[], RL_SEG=[];
function rlRoadsInit(){
  const [B0,BN,BS,BN2,BS2]=RL_BRIDGES, G=RL_CF;
  const both=L=>[L,L.map(p=>[-p[0],-p[1]])];   // a road and its twin across the centre
  const xm=L=>[L,L.map(p=>[-p[0],p[1]])];      // castle roads mirror in x (the castles do)
  RL_ROADS=[].concat(
    // gate to gate over the stone bridge
    [[[-G,6],[-104,4.5],[-80,3],[-45,3.5],[-22,4.5],B0.w], [B0.e,[22,-4.5],[45,-3],[80,-1.5],[104,4.5],[G,6]]],
    // along the castle fronts to the mines and their storehouses
    xm([[-G+1.5,10],[-G+1.5,60],[-G+5,88],[-110,100],[-120,110]]), xm([[-G+1.5,0],[-G+1.5,-60],[-G+5,-88],[-110,-100],[-120,-110]]),
    // the zones near each army, and the timber bridges between them
    both([[-80,3],[-62,-14],[-40,-38]]), both([[-34,-55],[-24,-64],BS.w]), both([BS.e,[14,-90],[27,-123]]),
    // the long flank roads to the far zones
    both([[-104,4.5],[-92,40],[-64,92],[-38,126]]),
    // the far stone bridges, and the back roads they open to the enemy's mines
    both([[-24,133],BN2.w]), both([BN2.e,[40,139],[80,124],[110,100]]),
  );
  // village streets, and tracks out to the fields
  for(const V of RL_VIL){ const P=(lx,lz)=>rlVilP(V,lx,lz); RL_ROADS.push([P(-16,0),P(0,0),P(16,0)]); RL_ROADS.push([P(-2,0),P(-1,-11)]); }
  RL_SEG=[]; for(const L of RL_ROADS) for(let i=0;i+1<L.length;i++) RL_SEG.push([L[i][0],L[i][1],L[i+1][0],L[i+1][1]]);
}
function rlRoadD(x,z){ let b=1e9; for(const s of RL_SEG){ const ex=s[2]-s[0], ez=s[3]-s[1], L=ex*ex+ez*ez, t=clamp(((x-s[0])*ex+(z-s[1])*ez)/L,0,1), px=s[0]+ex*t-x, pz=s[1]+ez*t-z, d=px*px+pz*pz; if(d<b) b=d; } return Math.sqrt(b); }

/* ---------- things placed on the map ---------- */
// villages: a street along local x, houses either side, fields behind (local z -27..-12), a windmill on the big ones
const RL_VIL=[{x:-56,z:-100,r:0,big:true},{x:56,z:100,r:Math.PI,big:true},{x:-58,z:76,r:-.55},{x:58,z:-76,r:Math.PI-.55}];
function rlVilP(V,lx,lz){ const c=Math.cos(V.r), s=Math.sin(V.r); return [V.x+lx*c+lz*s,V.z-lx*s+lz*c]; }
function rlVilL(V,x,z){ const c=Math.cos(V.r), s=Math.sin(V.r), dx=x-V.x, dz=z-V.z; return [dx*c-dz*s,dx*s+dz*c]; }
const RL_CAMPS=[{t:0,x0:-148,x1:-124,z0:24,z1:40},{t:0,x0:-148,x1:-124,z0:-40,z1:-27},{t:1,x0:124,x1:148,z0:24,z1:40},{t:1,x0:124,x1:148,z0:-40,z1:-27}];
const RL_FORESTS=rlSym([[-145,140,16],[-145,-140,16],[-12,57,9],[-61,-65,10],[-87,-152,12],[-106,152,14],[57,-158,12],[-80,-32,8],[-100,80,10],[-40,-150,10],[-25,30,7],[-84,118,8]]);
const RL_TOWERS=rlSym([[-14,-8],[-20,-79],[-15,143]]);
const RL_RUINS=rlSym([[-80,58]]);
// footprints that must stay clear of trees and bushes: [x,z,r]
function rlKeepOut(){ const L=[];
  for(const Z of RL_ZONES) L.push([Z.x,Z.z,RL_ZR+2.5]);
  for(const t of [0,1]){ L.push([BASE_X[t],0,10]); for(const m of RL_MINE[t]){ L.push([m.x,m.z,9]); L.push([m.dx,m.dz,6]); } }
  for(const V of RL_VIL){ const [fx,fz]=rlVilP(V,8,-19); L.push([V.x,V.z,V.big?14:11]); L.push([fx,fz,10]); }
  for(const T of RL_TOWERS) L.push([T[0],T[1],3.5]);
  for(const R of RL_RUINS) L.push([R[0],R[1],7]);
  for(const B of RL_BRIDGES) L.push([B.x,B.z,B.len/2+2]);
  return L; }
function rlInCastle(x,z,m){ m=m||0; return Math.abs(x)>RL_CF-m&&Math.abs(x)<RL_CF+37+m&&z>-22-m&&z<17+m; }
function rlInCamp(x,z,m){ m=m||0; for(const C of RL_CAMPS) if(x>C.x0-m&&x<C.x1+m&&z>C.z0-m&&z<C.z1+m) return true; return false; }
function rlInField(x,z){ for(const V of RL_VIL){ const [fx,fz]=rlVilL(V,x,z); if(fx>1&&fx<16&&fz<-12&&fz>-27) return V; } return null; }

/* ---------- ground mesh ---------- */
function rlGround(){
  if(!RL.built) rlBuild();
  for(const m of RL.ground.children) rlGroundChunk(m.geometry);
}
function rlGroundChunk(g){
  const p=g.attributes.position, col=g.attributes.color, nor=g.attributes.normal, C=new THREE.Color(), D=new THREE.Color();
  const grassA=new THREE.Color('#5d7f38'), grassB=new THREE.Color('#7c9a45'), grassC=new THREE.Color('#9aa556'), dirt=new THREE.Color('#9a7c52'), mud=new THREE.Color('#7a6646'), sand=new THREE.Color('#b29a6c'),
    rock=new THREE.Color('#8b8470'), wheat=new THREE.Color('#c8ad55'), crop=new THREE.Color('#6f8f36'), soil=new THREE.Color('#7d5f3e'), yard=new THREE.Color('#8f7d5c'), worn=new THREE.Color('#8e9a5a');
  for(let i=0;i<p.count;i++){
    const x=p.getX(i), z=p.getZ(i), y=rlGroundH(x,z); p.setY(i,y);
    { const nx=rlGroundH(x-1,z)-rlGroundH(x+1,z), nz=rlGroundH(x,z-1)-rlGroundH(x,z+1), l=Math.hypot(nx,2,nz); nor.setXYZ(i,nx/l,2/l,nz/l); }
    const n=.5+.5*Math.sin(x*.71+z*.33)*Math.cos(z*.57-x*.21), n2=.5+.5*Math.sin(x*.13-z*.17+1.3), n3=.5+.5*Math.sin(x*.037+z*.029);
    C.copy(grassA).lerp(grassB,clamp(n2*.7+n*.3,0,1)).lerp(grassC,clamp((n3-.6)*1.2,0,.45));
    // higher ground dries out and shows rock
    if(y>2.2) C.lerp(rock,clamp((y-2.2)*.22,0,.7));
    // mud and sand along the river
    const rd=rlRiverD(x,z); if(rd<2.1) C.lerp(rd<1.25?mud:sand,clamp((2.1-rd)/.8,0,1)*.9);
    // dirt roads with soft verges
    const r=rlRoadD(x,z); if(r<3.8) C.lerp(dirt,clamp((3.8-r)/1.6,0,1)*(.75+.2*n));
    // worn grass in the capture zones, yards in front of the castles, the camps' trodden ground
    for(const Z of RL.zones){ const d=Math.hypot(x-Z.x,z-Z.z); if(d<RL_ZR+1) C.lerp(worn,clamp((RL_ZR+1-d)/2,0,1)*.6); }
    const ax=Math.abs(x); if(ax>RL_CF-10&&ax<RL_CF+1&&Math.abs(z)<22) C.lerp(yard,.45*smooth(clamp((ax-RL_CF+10)/4,0,1)));
    if(rlInCamp(x,z,1)) C.lerp(yard,.35);
    // fields beyond each village: strips of wheat, crops and tilled earth
    for(const V of RL_VIL){ const [fx,fz]=rlVilL(V,x,z);
      if(fx>1&&fx<16&&fz<-12&&fz>-27){ const k=Math.floor((fx-1)/2.6), w=(fx-1)/2.6-k; D.copy(k%3===0?wheat:k%3===1?crop:soil); if(w<.12||w>.88) D.lerp(soil,.5); C.lerp(D,.85); } }
    // mines: rocky, trampled
    for(const t of [0,1]) for(const m of RL_MINE[t]){ const d=Math.hypot(x-m.x,z-m.z); if(d<8) C.lerp(rock,clamp((8-d)/4,0,1)*.6); }
    // past the field's edge the grass darkens toward the forested rim
    const rr=Math.max(ax,Math.abs(z)); if(rr>RL_HALF-4) C.lerp(grassA,clamp((rr-RL_HALF+4)/10,0,1)*.5).multiplyScalar(1-clamp((rr-RL_HALF)/50,0,.25));
    col.setXYZ(i,C.r,C.g,C.b);
  }
  p.needsUpdate=true; col.needsUpdate=true; nor.needsUpdate=true; g.computeBoundingSphere();
}

/* ---------- materials ---------- */
function rlMats(){
  // a few materials the castle kit doesn't have (made here, not at load: three.js materials draw random ids, and the
  // seeded tests replay the classic battles from the very first random number)
  CM.tent=new THREE.MeshLambertMaterial({color:'#d8ccb0'});
  CM.thatch=new THREE.MeshLambertMaterial({color:'#a8874a'});
  CM.plaster=new THREE.MeshLambertMaterial({color:'#e2d6bd'});
  CM.sail=new THREE.MeshLambertMaterial({color:'#eadfc7',side:THREE.DoubleSide});
  rlThatch();
  const L=c=>new THREE.MeshLambertMaterial({color:c});
  const sway=(m,amt)=>{ m.onBeforeCompile=sh=>{ sh.uniforms.uSway=RL.sway;
    sh.vertexShader='uniform float uSway;\n'+sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n#ifdef USE_INSTANCING\n float ph=instanceMatrix[3].x*.31+instanceMatrix[3].z*.23;\n float k=max(position.y,0.)*'+amt.toFixed(3)+';\n transformed.x+=sin(uSway*1.6+ph)*k; transformed.z+=cos(uSway*1.3+ph*1.7)*k*.7;\n#endif'); }; m.customProgramCacheKey=()=>'rlsway'+amt; return m; };
  // trees: trunk and crown in one instanced shape; the per-tree tint colours only the crown (aCrown = 1)
  const tree=amt=>{ const m=L('#ffffff'); m.onBeforeCompile=sh=>{ sh.uniforms.uSway=RL.sway;
    sh.vertexShader='uniform float uSway;\nattribute float aCrown;\n'+sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n#ifdef USE_INSTANCING\n float ph=instanceMatrix[3].x*.31+instanceMatrix[3].z*.23;\n float k=max(position.y+1.2,0.)*'+amt.toFixed(3)+'*aCrown;\n transformed.x+=sin(uSway*1.6+ph)*k; transformed.z+=cos(uSway*1.3+ph*1.7)*k*.7;\n#endif')
      .replace('#include <color_vertex>','#include <color_vertex>\n#ifdef USE_INSTANCING_COLOR\n vColor.xyz=mix(vec3(.36,.26,.19),instanceColor.xyz,aCrown);\n#endif'); };
    m.customProgramCacheKey=()=>'rltree'+amt; return m; };
  return {
    pineT:tree(.03), oakT:tree(.025),
    bark:L('#5b4330'), pine:sway(L('#ffffff'),.035), leaf:sway(L('#ffffff'),.03), bush:sway(L('#ffffff'),.04), grass:sway(new THREE.MeshLambertMaterial({color:'#ffffff',side:THREE.DoubleSide}),.18),
    rock:L('#8a8070'), flower:new THREE.MeshLambertMaterial({color:'#ffffff'}), reed:sway(new THREE.MeshLambertMaterial({color:'#ffffff',side:THREE.DoubleSide}),.12),
  };
}


function rlThatch(){ try{ const c=document.createElement('canvas'); if(!c.getContext) return; c.width=c.height=64; const g=c.getContext('2d'); if(!g) return; const R=rlRng(11);
  g.fillStyle='#b08f52'; g.fillRect(0,0,64,64); for(let i=0;i<260;i++){ const v=R(); g.strokeStyle=v<.5?'rgba(90,64,30,.45)':'rgba(236,206,140,.45)'; g.lineWidth=1+R(); const x=R()*64, y=R()*64; g.beginPath(); g.moveTo(x,y); g.lineTo(x+(R()-.5)*3,y+6+R()*8); g.stroke(); }
  for(let y=0;y<64;y+=16){ g.fillStyle='rgba(60,40,18,.35)'; g.fillRect(0,y,64,2); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; CM.thatch.map=t; CM.thatch.color.set('#ffffff'); }catch(e){} }

/* ---------- geometry helpers ---------- */
// a gable roof: two slopes and two gable ends, w across (eave to eave), h high, d long; UVs in metres
function gRoof(w,h,d,t){ const hw=w/2, hd=d/2, P=[], N=[], U=[];
  const quad=(a,b,c,e,n,su,sv)=>{ for(const q of [a,c,b,a,e,c]) P.push(...q); for(let i=0;i<6;i++) N.push(...n); U.push(0,0,su,sv,su,0,0,0,0,sv,su,sv); };
  const sl=Math.hypot(hw,h), nl=[-h/sl,hw/sl,0], nr=[h/sl,hw/sl,0];
  quad([-hw,0,hd],[-hw,0,-hd],[0,h,-hd],[0,h,hd],nl,d/t,sl/t);
  quad([hw,0,-hd],[hw,0,hd],[0,h,hd],[0,h,-hd],nr,d/t,sl/t);
  for(const s of [1,-1]){ const z=hd*s; P.push(-hw*s,0,z, hw*s,0,z, 0,h,z); for(let i=0;i<3;i++) N.push(0,0,s); U.push(0,0,w/t,0,w/2/t,h/t); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2)); return g; }
// lumpy blob (bush, oak crown): an icosphere nudged by a fixed noise
function gBlob(r,det,seed){ const g=new THREE.IcosahedronGeometry(r,det), p=g.attributes.position, R=rlRng(seed);
  const map=new Map(); for(let i=0;i<p.count;i++){ const key=p.getX(i).toFixed(3)+','+p.getY(i).toFixed(3)+','+p.getZ(i).toFixed(3); let k=map.get(key); if(k===undefined){ k=.82+R()*.32; map.set(key,k); } p.setXYZ(i,p.getX(i)*k,p.getY(i)*k*.86,p.getZ(i)*k); }
  g.computeVertexNormals(); return g; }
function gMerge(list){ return mergeUV(list.map(([g,m])=>[g,m||new THREE.Matrix4()])); }
// merge, tagging each part's vertices with aCrown (1 crown, 0 trunk)
function gMergeTree(list){ const g=gMerge(list.map(([q,m])=>[q,m])), a=new Float32Array(g.attributes.position.count); let o=0;
  for(const [q,,crown] of list){ const n=q.index?q.index.count:q.attributes.position.count; a.fill(crown?1:0,o,o+n); o+=n; } g.setAttribute('aCrown',new THREE.BufferAttribute(a,1)); return g; }
function rlIM(geo,mat,list,cast,colFn){
  const im=new THREE.InstancedMesh(geo,mat,Math.max(1,list.length)), m=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(), c=new THREE.Color();
  list.forEach((it,i)=>{ e.set(it.rx||0,it.ry||0,it.rz||0); q.setFromEuler(e); m.compose(new V3(it.x,it.y,it.z),q,new V3(it.sx||it.s,it.sy||it.s,it.sz||it.s)); im.setMatrixAt(i,m); if(colFn) im.setColorAt(i,colFn(it,c)); });
  im.count=list.length; im.castShadow=!!cast; im.receiveShadow=true; im.instanceMatrix.needsUpdate=true; if(im.instanceColor) im.instanceColor.needsUpdate=true; return im; }
// the same, split into 100 m tiles, each with a bounding sphere round its own instances, so the renderer skips the
// tiles that are off screen (and, for the shadow pass, outside the sun's shadow box)
// o.T: tile size; o.far: how far from the camera a tile still draws (long grass and flowers only close by, trees out
// to the haze); o.lo/o.lod: a plainer shape used past lod metres; o.fine: dropped on the lowest quality
function rlTiled(geo,mat,list,o){
  if(!geo.boundingSphere) geo.computeBoundingSphere(); const gr=geo.boundingSphere.radius+geo.boundingSphere.center.length();
  const T=o.T||100, far=o.far||230, B=new Map();
  const share=(src,sph)=>{ const g=new THREE.BufferGeometry(); for(const a in src.attributes) g.setAttribute(a,src.attributes[a]); if(src.index) g.setIndex(src.index); g.boundingSphere=sph; return g; }; for(const it of list){ const k=Math.floor((it.x+RL_EDGE)/T)*16+Math.floor((it.z+RL_EDGE)/T); if(!B.has(k)) B.set(k,[]); B.get(k).push(it); }
  for(const L of B.values()){
    let cx=0,cy=0,cz=0; for(const it of L){ cx+=it.x; cy+=it.y; cz+=it.z; } cx/=L.length; cy/=L.length; cz/=L.length;
    let r=0; for(const it of L){ const s=Math.max(it.sx||it.s,it.sy||it.s,it.sz||it.s); r=Math.max(r,Math.hypot(it.x-cx,it.y-cy,it.z-cz)+gr*s); }
    const sph=new THREE.Sphere(new V3(cx,cy,cz),r), im=rlIM(share(geo,sph),mat,L,o.cast,o.col); RL.group.add(im);
    const lo=o.lo?rlIM(share(o.lo,sph),mat,L,o.cast,o.col):null; if(lo) RL.group.add(lo);
    RL.tiles.push({im,lo,x:cx,y:cy,z:cz,r,far,lod:o.lod||60,fine:!!o.fine,cast:!!o.cast}); } }
// each frame: tiles beyond their distance are skipped, far ones switch to their plainer shape, and the long grass and
// flowers go on the lowest quality
function rlCullTiles(){ const c=camera.position, low=RL.low, sh=typeof GFX!=='undefined'&&GFX&&GFX.shadows>0, vk=viewK();
  for(const T of RL.tiles){ const d=Math.hypot(T.x-c.x,T.y-c.y,T.z-c.z)-T.r, vis=d<T.far*vk&&!(T.fine&&low);
    if(T.lo){ T.im.visible=vis&&d<T.lod; T.lo.visible=vis&&d>=T.lod; T.lo.castShadow=false; } else T.im.visible=vis;
    T.im.castShadow=T.cast&&sh; } }

/* ---------- static obstacles: soldiers walk around trees, houses, tents and the castle walls ---------- */
function rlObst(o){ RL.obst.push(o); }
function rlObstGrid(){ const N=RL.ogN, S=RL.ogS, O=RL.og0, G=Array.from({length:N*N},()=>[]); RL.og=G;
  for(const o of RL.obst){ const R=(o.r||Math.hypot(o.hw,o.hd))+1; const i0=Math.max(0,Math.floor((o.x-R-O)/S)), i1=Math.min(N-1,Math.floor((o.x+R-O)/S)), j0=Math.max(0,Math.floor((o.z-R-O)/S)), j1=Math.min(N-1,Math.floor((o.z+R-O)/S));
    for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++) G[j*N+i].push(o); } }
function mapCollide(u){
  if(isAir(u)) return;
  rlRiverCollide(u);   // the river: only the bridges cross it (37e)
  const N=RL.ogN, i=Math.floor((u.pos.x-RL.og0)/RL.ogS), j=Math.floor((u.pos.z-RL.og0)/RL.ogS); if(i<0||j<0||i>=N||j>=N) return;
  const ur=.3*u.s;
  for(const o of RL.og[j*N+i]){ const dx=u.pos.x-o.x, dz=u.pos.z-o.z;
    if(o.r){ const R=o.r+ur, d2=dx*dx+dz*dz; if(d2<R*R){ const d=Math.sqrt(d2)||1e-3; u.pos.x=o.x+dx/d*R; u.pos.z=o.z+dz/d*R; rlTouch(u,dx/d,dz/d); } }
    else { const lx=dx*o.c+dz*o.s, lz=-dx*o.s+dz*o.c, px=o.hw+ur-Math.abs(lx), pz=o.hd+ur-Math.abs(lz);
      if(px>0&&pz>0){ let nx=lx, nz=lz, ax=0, az=0; if(px<pz){ nx=Math.sign(lx||1)*(o.hw+ur); ax=Math.sign(lx||1); } else { nz=Math.sign(lz||1)*(o.hd+ur); az=Math.sign(lz||1); }
        u.pos.x=o.x+nx*o.c-nz*o.s; u.pos.z=o.z+nx*o.s+nz*o.c; rlTouch(u,ax*o.c-az*o.s,ax*o.s+az*o.c); } } }
}
// remember which way the obstacle pushed: for a moment afterwards a soldier walking into it turns to slide along it
function rlTouch(u,nx,nz){ u.slN=u.slN||{x:0,z:0}; u.slN.x=nx; u.slN.z=nz; u.slT=.7; }
function mapSteer(u,dt){
  rlRoute(u,dt);   // a way that runs into the river goes round by a bridge (37e)
  const d=u.desired, sp=Math.hypot(d.x,d.z); if(sp<.15) return;
  // look ahead for a tree, rock or post in the way and bear off to one side before reaching it
  const fx=d.x/sp, fz=d.z/sp, ur=.3*u.s, N=RL.ogN, i=Math.floor((u.pos.x+fx*2-RL.og0)/RL.ogS), j=Math.floor((u.pos.z+fz*2-RL.og0)/RL.ogS);
  if(i>=0&&j>=0&&i<N&&j<N){ let best=null, bt=3.2, side=0;
    for(const o of RL.og[j*N+i]){ if(!o.r||o.r>3) continue; const cx=o.x-u.pos.x, cz=o.z-u.pos.z, t=cx*fx+cz*fz; if(t<=0||t>bt) continue; const lat=cx*fz-cz*fx, R=o.r+ur+.25; if(Math.abs(lat)<R){ best=o; bt=t; side=lat>0?-1:1; if(Math.abs(lat)<.05) side=u.id%2?1:-1; } }
    if(best){ const k=.85*(1-bt/3.4); let nx=fx+fz*side*k*1.6, nz=fz-fx*side*k*1.6; const n=Math.hypot(nx,nz); d.x=nx/n*sp; d.z=nz/n*sp; } }
  // pressed against a wall: walk along it, the way the goal lies (or a steady side if it is dead ahead)
  if(u.slT>0){ u.slT-=dt; const n=u.slN, into=d.x*n.x+d.z*n.z; if(into<0){ const tx=-n.z, tz=n.x, along=d.x*tx+d.z*tz;
      if(!u.slS||Math.abs(along)>sp*.3) u.slS=Math.abs(along)>.02?Math.sign(along):(u.id%2?1:-1);
      d.x=tx*u.slS*sp; d.z=tz*u.slS*sp; } }
}
// wading: the river slows everyone on foot, and splashes
function mapWade(u){ if(u.type==='ninja'&&dnNight()>.5){ u.desired.x*=1.15; u.desired.z*=1.15; }   // ninjas run freely in the dark
  if(u.fl||isAir(u)) return; const dep=RL.WL-H(u.pos.x,u.pos.z); if(dep<.05) return;
  u.wadeT=game.time+.3; const k=Math.min(.5,1-Math.min(.5,dep*.65)); u.desired.x*=k; u.desired.z*=k;   // wading a ford: half speed and exposed (37f)
  if(u.spd>.8&&Math.random()<.06) puff(new V3(u.pos.x,RL.WL+.05,u.pos.z),1,.18,.6,'#d6e6e8'); }

/* ---------- capture zones ---------- */
const RL_TEAMC=['#e4b23a','#d0465a'];
function rlFlagTex(t){
  const c=document.createElement('canvas'); if(!c.getContext) return null; c.width=256; c.height=160; const g=c.getContext('2d'); if(!g) return null;
  const chaos=facOf(t)==='chaos', field=t?'#9e1f33':'#d9a62e', dark=t?'#2a0d14':'#7a1016', light=t?'#ffb0a0':'#fff2cc';
  g.fillStyle=field; g.fillRect(0,0,256,160);
  g.fillStyle=dark; g.fillRect(0,0,256,14); g.fillRect(0,146,256,14);
  for(let i=0;i<8;i++){ g.beginPath(); g.moveTo(256,i*20); g.lineTo(240,i*20+10); g.lineTo(256,i*20+20); g.fill(); }
  g.translate(118,80); g.fillStyle=dark; g.strokeStyle=dark; g.lineWidth=6;
  g.beginPath(); g.arc(0,0,48,0,Math.PI*2); g.fillStyle=light; g.fill(); g.stroke();
  g.fillStyle=dark;
  if(chaos){ // horned skull
    g.beginPath(); g.ellipse(0,4,22,24,0,0,Math.PI*2); g.fill();
    g.beginPath(); g.moveTo(-18,-10); g.quadraticCurveTo(-44,-26,-34,-46); g.quadraticCurveTo(-30,-26,-10,-18); g.fill();
    g.beginPath(); g.moveTo(18,-10); g.quadraticCurveTo(44,-26,34,-46); g.quadraticCurveTo(30,-26,10,-18); g.fill();
    g.fillStyle=light; g.beginPath(); g.ellipse(-9,2,6,7,0,0,Math.PI*2); g.ellipse(9,2,6,7,0,0,Math.PI*2); g.fill();
    g.fillRect(-10,18,4,8); g.fillRect(-2,18,4,8); g.fillRect(6,18,4,8);
  } else { // crowned sword
    g.fillRect(-4,-30,8,58); g.fillRect(-20,14,40,7); g.beginPath(); g.moveTo(-4,-30); g.lineTo(0,-38); g.lineTo(4,-30); g.fill();
    g.beginPath(); g.moveTo(-24,-18); g.lineTo(-24,-40); g.lineTo(-13,-28); g.lineTo(0,-44); g.lineTo(13,-28); g.lineTo(24,-40); g.lineTo(24,-18); g.closePath(); g.globalAlpha=.85; g.fill(); g.globalAlpha=1;
    g.fillStyle=light; g.fillRect(-2,-24,4,40);
  }
  const tx=new THREE.CanvasTexture(c); tx.anisotropy=4; return tx; }
function rlLetterTex(L){ const c=document.createElement('canvas'); if(!c.getContext) return null; c.width=c.height=128; const g=c.getContext('2d'); if(!g) return null;
  g.fillStyle='#d8d0bf'; g.fillRect(0,0,128,128); g.strokeStyle='#6d6455'; g.lineWidth=8; g.strokeRect(6,6,116,116);
  g.fillStyle='#3a332a'; g.font='bold 92px Georgia, serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(L,64,70); return new THREE.CanvasTexture(c); }
function rlRingGeo(r0,r1,a0,len){ const g=new THREE.RingGeometry(r0,r1,Math.max(3,Math.ceil(72*len/(Math.PI*2))),1,a0,len); g.rotateX(-Math.PI/2); return g; }
function rlBuildZone(Z,K){
  const y=Z.h;
  // a stone kerb round the edge, a raised dais with the flagpole, four braziers
  for(let i=0;i<32;i++){ const a=i/32*Math.PI*2; K.put('stone',gBox(1.35,.32,.55,CTILE.stone),TM(Z.x+Math.cos(a)*RL_ZR,y+.08,Z.z+Math.sin(a)*RL_ZR,-a+Math.PI/2)); }
  K.put('cobble',gCyl(2.4,2.6,.4,20,CTILE.cobble),TM(Z.x,y+.12,Z.z)); K.put('stone',gCyl(1.5,1.7,.35,16,CTILE.stone),TM(Z.x,y+.45,Z.z));
  for(let i=0;i<4;i++){ const a=i*Math.PI/2+Math.PI/4, bx=Z.x+Math.cos(a)*(RL_ZR-1.4), bz=Z.z+Math.sin(a)*(RL_ZR-1.4);
    K.put('stone',gCyl(.32,.4,1.0,8,CTILE.stone),TM(bx,y+.5,bz)); K.put('iron',gCyl(.42,.24,.3,10,CTILE.iron),TM(bx,y+1.1,bz)); RL.fires.push({x:bx,y:y+1.3,z:bz}); rlObst({x:bx,z:bz,r:.45}); }
  // the pole: 8 m of timber with a gilded finial
  K.put('wood',gCyl(.1,.14,8.2,8,CTILE.wood),TM(Z.x,y+.6+4.1,Z.z)); K.put('gold',new THREE.SphereGeometry(.2,10,8),TM(Z.x,y+8.9,Z.z));
  // a letter stone on each side of the dais
  const lt=rlLetterTex(Z.id); if(lt){ const L=[]; for(let i=0;i<4;i++){ const a=i*Math.PI/2; L.push([new THREE.PlaneGeometry(.8,.42),TM(Z.x+Math.sin(a)*1.71,y+.45,Z.z+Math.cos(a)*1.71,a)]); }
    RL.group.add(new THREE.Mesh(gMerge(L),new THREE.MeshLambertMaterial({map:lt}))); }
  // the banner: one cloth per army, shown for whoever is winning the zone; it climbs the pole as they take it
  const fg=new THREE.PlaneGeometry(2.6,1.7,10,4); fg.translate(1.42,0,0);
  Z.base=fg.attributes.position.array.slice();
  Z.cloth=[0,1].map(t=>{ const m=new THREE.Mesh(fg.clone(),new THREE.MeshLambertMaterial({color:'#ffffff',side:THREE.DoubleSide})); m.castShadow=true; m.visible=false; m.position.set(Z.x,y+2,Z.z); RL.group.add(m); return m; });
  Z.bar=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,2.8,6),CM.wood); Z.bar.rotation.z=Math.PI/2; Z.bar.visible=false; RL.group.add(Z.bar);
  // ground rings: the edge, coloured by the holder, and the capture progress
  Z.ringMat=new THREE.MeshBasicMaterial({color:'#f2ead6',transparent:true,opacity:.45,depthWrite:false});
  Z.ring=new THREE.Mesh(rlRingGeo(RL_ZR-.45,RL_ZR-.1,0,Math.PI*2),Z.ringMat); Z.ring.position.set(Z.x,y+.07,Z.z); Z.ring.renderOrder=2; RL.group.add(Z.ring);
  Z.progMat=new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.85,depthWrite:false});
  Z.prog=new THREE.Mesh(rlRingGeo(RL_ZR+.05,RL_ZR+.55,Math.PI/2,.01),Z.progMat); Z.prog.position.set(Z.x,y+.08,Z.z); Z.prog.renderOrder=2; Z.prog.visible=false; RL.group.add(Z.prog); Z.progLen=-1;
  rlObst({x:Z.x,z:Z.z,r:.35});
}
function rlFlagTextures(){ const key=facOf(0)+facOf(1); if(RL.flagKey===key) return; RL.flagKey=key;
  const tx=[rlFlagTex(0),rlFlagTex(1)];
  for(const Z of RL.zones) for(let t=0;t<2;t++){ const m=Z.cloth[t].material; if(m.map) m.map.dispose(); m.map=tx[t]; m.color.set(tx[t]?'#ffffff':RL_TEAMC[t]); m.needsUpdate=true; } }
function rlResetZones(){ for(const Z of RL.zones){ Z.s=0; Z.owner=-1; Z.n=[0,0]; Z.contest=false; Z.cap=-1; Z.held=[0,0]; Z.tk=0; Z.mil=[]; } RL.zT=0; RL.dmg=[1,1]; RL.ai=[{},{}]; RL_DEAD[0].length=RL_DEAD[1].length=0; if(RL.on){ fowReset(); rlCampsReset(); } rlFlagTextures(); }
const rlZoneName=Z=>'zone '+Z.id;
function rlZonesStep(dt){
  if(game.mode!=='battle'||NET.guest) return;   // online, the host holds the zones and sends them round
  RL.zT-=dt; if(RL.zT<=0){ RL.zT=.25; rlZoneBonusTick(.25);
    for(const Z of RL.zones){ Z.n[0]=Z.n[1]=0;
      gridEach(Z.x,Z.z,RL_ZR,u=>{ if(!u.alive||!u.isUnit||u.team>1||u.T.worker||isAir(u)||u.routing) return; if((u.pos.x-Z.x)**2+(u.pos.z-Z.z)**2<RL_ZR*RL_ZR) Z.n[u.team]++; });
      Z.contest=Z.n[0]>0&&Z.n[1]>0; Z.cap=Z.contest?-1:Z.n[0]>0?0:Z.n[1]>0?1:-1; } }
  if(game.over>0) return;
  for(const Z of RL.zones){ const s0=Z.s;
    if(Z.cap>=0){ const dir=Z.cap?1:-1, n=Z.n[Z.cap], rate=(1+.18*Math.min(n-1,6))/RL_CAPT; Z.s=clamp(Z.s+dir*rate*dt,-1,1); }
    else if(!Z.contest){ const goal=Z.owner<0?0:(Z.owner?1:-1), k=dt/(RL_CAPT*2.5); Z.s=Z.s<goal?Math.min(goal,Z.s+k):Math.max(goal,Z.s-k); }   // an empty zone drifts back to its holder
    // the banner reaches the top: taken. It falls to the foot of the pole: the holder has lost it.
    if(Z.owner!==0&&Z.s<=-1){ rlZoneTaken(Z,0); } else if(Z.owner!==1&&Z.s>=1){ rlZoneTaken(Z,1); }
    else if(Z.owner>=0&&(Z.owner?Z.s<=0:Z.s>=0)&&(Z.owner?s0>0:s0<0)){ const lost=Z.owner; Z.owner=-1; rlZoneLost(Z,lost); }
    if(Z.owner>=0){ const t=Z.owner, K=rlKind(Z); game.gold[t]+=K.gold*econ(t)*dt; game.mana[t]+=K.mana*dt; Z.held[t]+=dt; } }
}
function rlZoneTaken(Z,t){ Z.owner=t; Z.s=t?1:-1; const me=myTeam();
  if(game.demo) return;
  alertPush(t===me?'Zone '+Z.id+' captured':teamName(t)+' took '+rlZoneName(Z),t===me?'good':'danger',Z.x,Z.z);
  if(t===me){ sfx('horn',new V3(Z.x,Z.h,Z.z),.8); const K=rlKind(Z); toast('Zone '+Z.id+' captured · '+K.name+': '+K.txt.replace('gold',money(me))+' · heals and reveals'); }
  else { sfx('hornEnemy',new V3(Z.x,Z.h,Z.z),.8); toast(teamName(t)+' took '+rlZoneName(Z)); }
}
function rlZoneLost(Z,t){ if(game.demo) return; if(t===myTeam()){ toast('Your banner fell at '+rlZoneName(Z)); alertPush('Your banner fell at '+rlZoneName(Z),'danger',Z.x,Z.z); } }
// banner height, waving cloth, ring colours: every frame
function rlZonesDraw(){
  const T=game.time;
  for(const Z of RL.zones){
    const t=Z.s<0?0:1, k=Math.abs(Z.s), show=k>.02;
    for(let i=0;i<2;i++) Z.cloth[i].visible=show&&i===t;
    Z.bar.visible=show;
    if(show){ const y=Z.h+1.6+k*6.2, fl=Z.cloth[t];
      fl.position.set(Z.x,y,Z.z); fl.rotation.y=.35+.15*Math.sin(T*.4+Z.x); Z.bar.position.set(Z.x+Math.cos(fl.rotation.y)*1.42,y+.85,Z.z-Math.sin(fl.rotation.y)*1.42); Z.bar.rotation.y=fl.rotation.y;
      const p=fl.geometry.attributes.position, b=Z.base; for(let i=0;i<p.count;i++){ const x=b[i*3], w=(x/2.84); p.setZ(i,Math.sin(T*4.2-x*2.2+Z.z)*.22*w+Math.sin(T*2.3-x*1.3)*.1*w); p.setY(i,b[i*3+1]-w*w*.12); } p.needsUpdate=true; }
    // the edge ring: the holder's colour; a pulse while it is being fought over
    const own=Z.owner; Z.ringMat.color.set(own<0?'#f2ead6':RL_TEAMC[own]); Z.ringMat.opacity=(Z.contest?.45+.35*Math.sin(T*8):own<0?.35:.6);
    const len=k*Math.PI*2, cap=Z.cap>=0&&k<.999;
    Z.prog.visible=cap||Z.contest; if(Z.prog.visible){ if(Math.abs(len-Z.progLen)>.05){ Z.progLen=len; Z.prog.geometry.dispose(); Z.prog.geometry=rlRingGeo(RL_ZR+.05,RL_ZR+.55,Math.PI/2,Math.max(.01,len)); }
      Z.progMat.color.set(RL_TEAMC[t]); Z.progMat.opacity=.6+.3*Math.sin(T*6); }
  }
}

/* ---------- mines: which one a miner works, where he carries the gold ---------- */
function rlMineOf(u){ if(u.rlMine===undefined){ let n0=0,n1=0; for(const o of units) if(o!==u&&o.alive&&o.team===u.team&&o.rlMine!==undefined){ if(o.rlMine) n1++; else n0++; } u.rlMine=n0<=n1?0:1; }
  const m=RL_MINE[u.team][u.rlMine]; m.r=2.4; return m; }
function rlDropOf(u,out){ const m=RL_MINE[u.team][u.rlMine||0]; out.set(m.dx+Math.cos(u.slot)*1.6,0,m.dz+Math.sin(u.slot)*1.6); }
function rlSyncMines(){ if(!RL.mineVis) return; for(const t of [0,1]){ const ch=facOf(t)==='chaos'; for(const M of RL.mineVis[t]){ M.gold.visible=!ch; M.crystal.visible=ch; } } }

/* ---------- the layout: everything placed once, from its own random stream ---------- */
function rlBuild(){
  RL.built=true; const R=rlRng(20261017);
  RL.zones=RL_ZONES.map(z=>Object.assign({},z,{h:Math.max(.5,rlLand(z.x,z.z))}));
  rlBridgeInit(); rlRoadsInit();
  RL.group=new THREE.Group(); RL.group.visible=false; scene.add(RL.group);
  // ground: 400 m square in 2 m cells, in sixteen 100 m chunks so the ones off screen are skipped (soldiers stand on
  // the finer height grid, H)
  { RL.ground=new THREE.Group(); RL.group.add(RL.ground); const gm=new THREE.MeshLambertMaterial({vertexColors:true});
    for(let i=0;i<4;i++) for(let j=0;j<4;j++){ const g=new THREE.PlaneGeometry(100,100,50,50); g.rotateX(-Math.PI/2); g.translate(-RL_EDGE+50+i*100,0,-RL_EDGE+50+j*100);
      g.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3),3));
      const m=new THREE.Mesh(g,gm); m.receiveShadow=true; RL.ground.add(m); }
    // beyond it, the wooded hills go on into the haze
    const E=RL_EDGE-1, sh=new THREE.Shape([new THREE.Vector2(-1200,-1200),new THREE.Vector2(1200,-1200),new THREE.Vector2(1200,1200),new THREE.Vector2(-1200,1200)]);
    sh.holes.push(new THREE.Path([new THREE.Vector2(-E,-E),new THREE.Vector2(-E,E),new THREE.Vector2(E,E),new THREE.Vector2(E,-E)]));
    const o=new THREE.ShapeGeometry(sh); o.rotateX(-Math.PI/2); const out=new THREE.Mesh(o,new THREE.MeshLambertMaterial({color:'#4a6431'})); out.position.y=12.3; RL.group.add(out); }
  const mats=rlMats(); RL.mats=mats;
  const keep=rlKeepOut(), roadOK=(x,z,m)=>rlRoadD(x,z)>m, keepOK=(x,z,m)=>{ for(const k of keep){ if((x-k[0])**2+(z-k[1])**2<(k[2]+m)**2) return false; } return true; };
  const K=new Kit(), keepMats=Kit.mats; Kit.mats=null;
  const gy=(x,z)=>rlGroundH(x,z);

  // --- the river: a ribbon of water following the channel, its texture flowing downstream ---
  { const P=[], U=[], I=[]; let n=0; for(let z=-RL_EDGE-6;z<=RL_EDGE+6;z+=2.5){ const cx=rlRiverX(z), w=rlRiverW(z)*1.15+.6; P.push(cx-w,RL.WL,z, cx+w,RL.WL,z); U.push(0,z/9,1,z/9); if(n){ const a=(n-1)*2; I.push(a,a+2,a+1,a+1,a+2,a+3); } n++; }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2)); g.setIndex(I); g.computeVertexNormals();
    let tex=null; const c=document.createElement('canvas'); if(c.getContext){ c.width=64; c.height=128; const x=c.getContext('2d'); if(x){ x.fillStyle='#46717c'; x.fillRect(0,0,64,128); const r2=rlRng(5);
      for(let i=0;i<70;i++){ x.fillStyle='rgba(205,232,236,'+(.08+r2()*.2)+')'; x.fillRect(r2()*64,r2()*128,2+r2()*14,1+r2()*2); } tex=new THREE.CanvasTexture(c); tex.wrapS=tex.wrapT=THREE.RepeatWrapping; } }
    const m=new THREE.MeshPhongMaterial({color:tex?'#ffffff':'#46717c',map:tex,transparent:true,opacity:.8,shininess:80,specular:'#bcd8dc',depthWrite:false}); RL.flow=tex;
    const w=new THREE.Mesh(g,m); w.renderOrder=1; RL.group.add(w); }

  // --- bridges ---
  for(const B of RL_BRIDGES){ const ry=Math.atan2(B.az,B.ax), stone=B.kind==='stone', n=stone?Math.round(B.len/1.2):Math.round(B.len/1.15);
    const at=(s,q)=>[B.x+B.ax*s-B.az*q,B.z+B.az*s+B.ax*q];
    for(let i=0;i<n;i++){ const s0=-B.len/2+i*B.len/n, s1=s0+B.len/n, sm=(s0+s1)/2, k=2*sm/B.len, y=B.h0+B.arch*(1-k*k), [x,z]=at(sm,0), slope=Math.atan(-B.arch*8*sm/(B.len*B.len));
      if(stone){ K.put('stone',gBox(B.len/n+.06,.5,B.wid,CTILE.stone),TM(x,y-.25,z,-ry,0,slope));
        for(const q of [-1,1]){ const [px,pz]=at(sm,q*(B.wid/2-.18)); K.put('stone',gBox(B.len/n+.04,.75,.36,CTILE.stone),TM(px,y+.3,pz,-ry,0,slope)); } }
      else { K.put('wood',gBox(B.len/n-.08,.18,B.wid,CTILE.wood),TM(x,y-.09,z,-ry,0,slope));
        for(const q of [-1,1]){ const [px,pz]=at(sm,q*(B.wid/2-.1)); K.put('wood',gBox(.14,1.0,.14,CTILE.wood),TM(px,y+.4,pz,-ry)); } } }
    if(stone){ // piers in the stream, lamps at the four corners
      for(const s of [-B.len*.22,B.len*.22]){ const [x,z]=at(s,0); const k=2*s/B.len, y=B.h0+B.arch*(1-k*k); K.put('stone',gBox(1.4,y+1.7,B.wid-.3,CTILE.stone),TM(x,(y-1.7)/2-.15,z,-ry)); }
      for(const s of [-1,1]) for(const q of [-1,1]){ const [x,z]=at(s*(B.len/2-.3),q*(B.wid/2-.15)); K.put('stone',gBox(.6,1.4,.6,CTILE.stone),TM(x,B.h0+.6,z,-ry)); K.put('iron',gCyl(.24,.16,.25,8,CTILE.iron),TM(x,B.h0+1.42,z)); RL.fires.push({x,y:B.h0+1.6,z,small:true}); } }
    else { for(const q of [-1,1]){ const [x0,z0]=at(-B.len/2,q*(B.wid/2-.1)), [x1,z1]=at(B.len/2,q*(B.wid/2-.1)); K.put('wood',gBox(B.len,.12,.12,CTILE.wood),TM((x0+x1)/2,B.h0+B.arch*.5+.85,(z0+z1)/2,-ry)); }
      for(const s of [-.3,0,.3]) for(const q of [-1,1]){ const [x,z]=at(s*B.len,q*(B.wid/2-.3)); K.put('wood',gCyl(.16,.18,2.4,7,CTILE.wood),TM(x,B.h0-.8,z)); } } }

  // --- capture zones ---
  for(const Z of RL.zones) rlBuildZone(Z,K);
  rlBuildFords(K);

  // --- trees: pines and broadleaf in the forests, the odd one in the open, a thick belt round the rim ---
  const pines=[], oaks=[], placed=new Map(), PC=6;
  const pkey=(i,j)=>i*4096+j;
  const near=(x,z,r)=>{ const i0=Math.floor((x-r+256)/PC), i1=Math.floor((x+r+256)/PC), j0=Math.floor((z-r+256)/PC), j1=Math.floor((z+r+256)/PC);
    for(let i=i0;i<=i1;i++) for(let j=j0;j<=j1;j++){ const L=placed.get(pkey(i,j)); if(L) for(const p of L){ if((p[0]-x)**2+(p[1]-z)**2<r*r) return true; } } return false; };
  const mark=(x,z)=>{ const k=pkey(Math.floor((x+256)/PC),Math.floor((z+256)/PC)); if(!placed.has(k)) placed.set(k,[]); placed.get(k).push([x,z]); };
  let nTrees=0;
  const plant=(x,z,kind,s,obst)=>{ const y=gy(x,z); if(y<RL.WL+.25) return false; mark(x,z); nTrees++;
    const ry=R()*6.28, tilt=(R()-.5)*.08;
    if(kind==='pine') pines.push({x,y:y+1.9*s,z,s,ry,rx:tilt,hue:R()});
    else { const k=1.05+R()*.25; oaks.push({x,y:y+3.1*s,z,s,sx:s*k,sy:s,sz:s*(1.05+R()*.25),ry,hue:R()}); }
    if(obst&&Math.abs(x)<RL_LIM+1&&Math.abs(z)<RL_LIM+1) rlObst({x,z,r:.42*s}); return true; };
  const clearAt=(x,z,m)=>Math.abs(x)<RL_EDGE-2&&Math.abs(z)<RL_EDGE-2&&rlRiverD(x,z)>1.5&&roadOK(x,z,3)&&keepOK(x,z,m)&&!rlInCastle(x,z,3)&&!rlInCamp(x,z,2)&&!rlInField(x,z);
  for(const F of RL_FORESTS){ const [fx,fz,fr]=F, n=Math.round(fr*fr*.55);
    for(let i=0;i<n*3&&n>0;i++){ const a=R()*6.28, r=fr*Math.sqrt(R()), x=fx+Math.cos(a)*r, z=fz+Math.sin(a)*r;
      if(!clearAt(x,z,1)||near(x,z,2.4)) continue; plant(x,z,R()<.62?'pine':'oak',.8+R()*.55,true); } }
  // the rim: a dense belt from the field's edge out into the hills
  const rim0=nTrees; for(let i=0;i<9000&&nTrees-rim0<1700;i++){ const x=(R()*2-1)*(RL_EDGE-2), z=(R()*2-1)*(RL_EDGE-2), e=Math.max(Math.abs(x),Math.abs(z)); if(e<RL_HALF+2) continue;
    if(!clearAt(x,z,0)||near(x,z,e>RL_HALF+18?4.6:3)) continue; plant(x,z,R()<.7?'pine':'oak',.95+R()*.75,false); }
  // lone trees and small copses in the open
  for(let i=0,k=0;i<2500&&k<170;i++){ const x=(R()*2-1)*(RL_HALF-6), z=(R()*2-1)*(RL_HALF-6); if(!clearAt(x,z,4)||near(x,z,10)||rlRiverD(x,z)<2.4) continue;
    if(plant(x,z,R()<.5?'oak':'pine',.75+R()*.5,true)){ k++; if(R()<.35) for(let c=0;c<3;c++){ const cx=x+(R()-.5)*8, cz=z+(R()-.5)*8; if(clearAt(cx,cz,4)&&!near(cx,cz,2.6)) plant(cx,cz,R()<.5?'oak':'pine',.7+R()*.4,true); } } }
  { // trunk and crown merged into one shape per kind (the trunk sits below the crown's origin), a plainer one far off
    const dark=new THREE.Color('#2f4a26'), mid=new THREE.Color('#41602e'), oa=new THREE.Color('#4c6b2c'), ob=new THREE.Color('#6d8a37');
    const pHi=gMergeTree([[new THREE.CylinderGeometry(.14,.24,1.9,5),TM(0,-1,0),0],[new THREE.ConeGeometry(1.55,2.3,8,1),TM(0,-.55,0),1],[new THREE.ConeGeometry(1.2,2.0,8,1),TM(0,.65,0),1],[new THREE.ConeGeometry(.82,1.7,8,1),TM(0,1.7,0),1]]);
    const pLo=gMergeTree([[new THREE.CylinderGeometry(.16,.24,1.9,4),TM(0,-1,0),0],[new THREE.ConeGeometry(1.5,2.9,6,1),TM(0,-.35,0),1],[new THREE.ConeGeometry(1.0,2.5,6,1),TM(0,1.3,0),1]]);
    rlTiled(pHi,mats.pineT,pines,{cast:true,col:(it,c)=>c.copy(dark).lerp(mid,it.hue),T:64,lo:pLo,lod:55});
    const oHi=gMergeTree([[new THREE.CylinderGeometry(.2,.32,2.3,6),TM(0,-1.95,0),0],[gBlob(1.9,1,3),null,1],[gBlob(1.2,0,4),TM(.85,.55,.3),1]]);
    const oLo=gMergeTree([[new THREE.CylinderGeometry(.22,.32,2.3,4),TM(0,-1.95,0),0],[gBlob(1.95,0,3),null,1]]);
    rlTiled(oHi,mats.oakT,oaks,{cast:true,col:(it,c)=>c.copy(oa).lerp(ob,it.hue),T:64,lo:oLo,lod:55}); }

  // --- bushes, along forest edges, the river and here and there ---
  const bushes=[];
  const bush=(x,z,s)=>{ const y=gy(x,z); if(y<RL.WL+.1) return; bushes.push({x,y:y+.25*s,z,s,sy:s*(.7+R()*.3),ry:R()*6.28,hue:R()}); };
  for(const F of RL_FORESTS){ for(let i=0;i<F[2]*3;i++){ const a=R()*6.28, r=F[2]*(.85+R()*.5), x=F[0]+Math.cos(a)*r, z=F[1]+Math.sin(a)*r; if(clearAt(x,z,0)) bush(x,z,.6+R()*.7); } }
  for(let i=0;i<6000&&bushes.length<1400;i++){ const x=(R()*2-1)*(RL_HALF+16), z=(R()*2-1)*(RL_HALF+16); const rd=rlRiverD(x,z);
    if(rd<1.25||!roadOK(x,z,2.6)||!keepOK(x,z,0)||rlInCastle(x,z,1)||rlInCamp(x,z,1)||rlInField(x,z)) continue; if(rd>2.6&&R()<.55) continue; bush(x,z,.5+R()*.75); }
  { const bc=new THREE.Color('#3f5a28'), bd=new THREE.Color('#6a8235');
    rlTiled(gBlob(1,0,9),mats.bush,bushes,{cast:true,col:(it,c)=>c.copy(bc).lerp(bd,it.hue),T:64,far:130}); }

  // --- long grass, flowers, reeds and rocks ---
  const grass=[], flowers=[], reeds=[], rocks=[];
  for(let i=0;i<40000&&grass.length<9500;i++){ const x=(R()*2-1)*(RL_HALF+14), z=(R()*2-1)*(RL_HALF+14), y=gy(x,z);
    if(y<RL.WL+.2||rlRiverD(x,z)<1.3||!roadOK(x,z,2.4)||rlInCastle(x,z,0)||rlInField(x,z)) continue;
    let inZone=false; for(const Z of RL.zones) if((x-Z.x)**2+(z-Z.z)**2<(RL_ZR+.4)**2) inZone=true; if(inZone) continue;
    grass.push({x,y,z,s:.7+R()*.7,sy:.6+R()*.9,ry:R()*6.28,hue:R()}); }
  for(let c=0;c<200;c++){ const cx=(R()*2-1)*(RL_HALF-8), cz=(R()*2-1)*(RL_HALF-8), col=Math.floor(R()*4);
    for(let i=0;i<14;i++){ const x=cx+(R()-.5)*8, z=cz+(R()-.5)*8, y=gy(x,z); if(y<RL.WL+.2||rlRiverD(x,z)<1.4||!roadOK(x,z,2.2)||!keepOK(x,z,-2)||rlInCastle(x,z,0)||rlInField(x,z)) continue; flowers.push({x,y:y+.25,z,s:.9+R()*.5,ry:R()*6.28,col}); } }
  for(let i=0;i<8000&&reeds.length<1500;i++){ const z=(R()*2-1)*(RL_EDGE-4), side=R()<.5?-1:1, d=.86+R()*.55, x=rlRiverX(z)+side*d*rlRiverW(z); if(rlDeck(x,z)>-1e8) continue; const y=gy(x,z); reeds.push({x,y,z,s:.8+R()*.6,sy:.8+R()*.7,ry:R()*6.28,hue:R()}); }
  for(let i=0;i<8000&&rocks.length<620;i++){ const x=(R()*2-1)*(RL_EDGE-4), z=(R()*2-1)*(RL_EDGE-4), y=gy(x,z); const e=Math.max(Math.abs(x),Math.abs(z));
    if(rlRiverD(x,z)<1.6||!roadOK(x,z,2.8)||!keepOK(x,z,0)||rlInCastle(x,z,1)||rlInCamp(x,z,1)||rlInField(x,z)) continue; if(e<RL_HALF&&y<1.8&&R()<.8) continue;
    const s=e>RL_HALF?.6+R()*1.8:.3+R()*.9; rocks.push({x,y:y+s*.15,z,s,sx:s*(1+R()*.6),sz:s*(.8+R()*.5),rx:R()*3,ry:R()*3,rz:R()*3}); if(s>.75&&e<RL_LIM) rlObst({x,z,r:s*.9}); }
  { // grass: three crossed blades
    const blades=[]; for(let k=0;k<3;k++){ const g=new THREE.PlaneGeometry(.5,.6,1,2); g.translate(0,.3,0); const p=g.attributes.position; for(let i=0;i<p.count;i++) if(p.getY(i)>.5) p.setX(i,p.getX(i)*.15); g.rotateY(k*Math.PI/3); blades.push([g,null]); }
    const ga=new THREE.Color('#5f7f33'), gb=new THREE.Color('#a3a64e');
    rlTiled(gMerge(blades),mats.grass,grass,{col:(it,c)=>c.copy(ga).lerp(gb,it.hue*it.hue),fine:true,T:40,far:55});
    const FC=['#f4efe2','#f2d04a','#b07ad8','#d8443e'].map(c=>new THREE.Color(c));
    const fg=gMerge([0,1,2].map(i=>[new THREE.OctahedronGeometry(.08,0),TM(Math.cos(i*2.1)*.15,.03*i,Math.sin(i*2.1)*.15)]));
    rlTiled(fg,mats.flower,flowers,{col:(it,c)=>c.copy(FC[it.col]),fine:true,T:40,far:50});
    const rb=[]; for(let k=0;k<4;k++){ const g=new THREE.PlaneGeometry(.18,1.1,1,2); g.translate(0,.55,0); const p=g.attributes.position; for(let i=0;i<p.count;i++) if(p.getY(i)>1) p.setX(i,0); g.rotateY(k*.8); g.translate(Math.cos(k*1.7)*.12,0,Math.sin(k*1.7)*.12); rb.push([g,null]); }
    const ra=new THREE.Color('#4d6a2c'), rc=new THREE.Color('#8f8a4a');
    rlTiled(gMerge(rb),mats.reed,reeds,{col:(it,c)=>c.copy(ra).lerp(rc,it.hue),fine:true,T:50,far:70});
    rlTiled(new THREE.DodecahedronGeometry(1,0),mats.rock,rocks,{cast:true,T:100,far:170}); }

  // --- villages: houses along a street, a well, a windmill on the hill, fences and haystacks round the fields ---
  RL.chimneys=[];
  for(const V of RL_VIL){ const P=(lx,lz)=>rlVilP(V,lx,lz);
    const PI=Math.PI, ALL=[[-12,6.6,PI,6,4.5,'terracotta'],[-4,7,PI+.05,5,4,'thatch'],[4.5,6.8,PI-.08,6.5,4.6,'slate'],[12,7,PI,5,4.2,'thatch'],[-12,-6.6,0,5.4,4,'thatch'],[-3.5,-7,.06,6,4.4,'terracotta'],[6,-6.8,-.05,5,4,'thatch']];
    const HOUSES=V.big?ALL:[ALL[0],ALL[2],ALL[4],ALL[6]];
    for(const [lx,lz,rot,w,d,roof] of HOUSES){ const [x,z]=P(lx,lz), y=gy(x,z)-.25, ry=rot+V.r, wh=2.6+(w>5.8?.6:0);
      K.put(roof==='slate'?'stone':'plaster',gBox(w,wh,d,2.4),TM(x,y+wh/2,z,ry));
      K.put('wood',gBox(w+.06,.2,d+.06,CTILE.wood),TM(x,y+wh-.1,z,ry)); for(const sx of [-1,1]) for(const sz of [-1,1]) K.put('wood',gBox(.2,wh,.2,CTILE.wood),TM(x+(sx*(w/2)*Math.cos(ry)+sz*(d/2)*Math.sin(ry)),y+wh/2,z+(-sx*(w/2)*Math.sin(ry)+sz*(d/2)*Math.cos(ry)),ry));
      K.put(roof==='thatch'?'thatch':roof,gRoof(d+.9,1.9,w+.7,CTILE[roof]||2.4),TM(x,y+wh,z,ry+Math.PI/2));
      const fx=Math.sin(ry), fz=Math.cos(ry); K.put('wood',gBox(.9,1.6,.08,CTILE.wood),TM(x+fx*(d/2+.02),y+.8,z+fz*(d/2+.02),ry));   // door
      for(const o of [-1.4,1.4]) K.put('dark',gBox(.6,.55,.06,1),TM(x+fx*(d/2+.02)+Math.cos(ry)*o,y+1.6,z+fz*(d/2+.02)-Math.sin(ry)*o,ry));   // windows
      K.put('stone',gBox(.6,1.4,.6,CTILE.stone),TM(x+Math.cos(ry)*(w/2-.8),y+wh+1.1,z-Math.sin(ry)*(w/2-.8),ry)); RL.chimneys.push({x:x+Math.cos(ry)*(w/2-.8),y:y+wh+1.9,z:z-Math.sin(ry)*(w/2-.8)});
      rlObst({x,z,hw:w/2+.15,hd:d/2+.15,c:Math.cos(ry),s:-Math.sin(ry)}); }
    { const [x,z]=P(0,0), y=gy(x,z); K.put('stone',gCyl(.9,.95,.8,14,CTILE.stone),TM(x,y+.4,z)); K.put('dark',gCyl(.7,.7,.82,14,1),TM(x,y+.42,z));
      for(const q of [-1,1]) K.put('wood',gBox(.14,1.8,.14,CTILE.wood),TM(x+q*.85,y+1.2,z)); K.put('wood',gBox(2.0,.12,.12,CTILE.wood),TM(x,y+2.1,z)); K.put('thatch',gRoof(1.5,.6,2.2,2.4),TM(x,y+2.15,z,Math.PI/2)); rlObst({x,z,r:1.05}); }
    if(V.big){ const [x,z]=P(-6,-17), y=gy(x,z)-.2, fx=Math.sin(V.r), fz=Math.cos(V.r);
      K.put('stone',gCyl(1.8,2.4,6.5,12,CTILE.stone),TM(x,y+3.25,z)); K.put('thatch',gCone(2.2,2.6,12,2.4),TM(x,y+6.5+1.3,z));
      K.put('wood',gBox(1.0,1.8,.1,CTILE.wood),TM(x+fx*2.38,y+.9,z+fz*2.38,V.r)); rlObst({x,z,r:2.45});
      const sails=new THREE.Group(), W=[[new THREE.CylinderGeometry(.3,.3,.6,8),TM(0,0,0,0,Math.PI/2)]], SL=[];
      for(let i=0;i<4;i++){ const a=i*Math.PI/2, ca=Math.cos(a), sa=Math.sin(a);   // arm i, turned a about the hub
        W.push([new THREE.BoxGeometry(.18,5.4,.12),TM(-sa*2.9,ca*2.9,0,0,0,a)]); SL.push([new THREE.PlaneGeometry(1.1,4.2),TM(ca*.62-sa*3.2,sa*.62+ca*3.2,.02,0,0,a)]); }
      const wm=new THREE.Mesh(gMerge(W),CM.wood), sm=new THREE.Mesh(gMerge(SL),CM.sail); wm.castShadow=sm.castShadow=true; sails.add(wm,sm);
      sails.position.set(x+fx*2.55,y+5.4,z+fz*2.55); sails.rotation.y=V.r; RL.group.add(sails); RL.mills.push(sails); }
    { const fence=(ax,az,bx,bz)=>{ const [x0,z0]=P(ax,az), [x1,z1]=P(bx,bz), L=Math.hypot(x1-x0,z1-z0), n=Math.max(1,Math.round(L/2.4)), ry=Math.atan2(-(z1-z0),x1-x0);
        for(let i=0;i<=n;i++){ const x=lerp(x0,x1,i/n), z=lerp(z0,z1,i/n); K.put('wood',gBox(.14,1.1,.14,CTILE.wood),TM(x,gy(x,z)+.5,z)); }
        for(let i=0;i<n;i++){ const xa=lerp(x0,x1,i/n), za=lerp(z0,z1,i/n), xb=lerp(x0,x1,(i+1)/n), zb=lerp(z0,z1,(i+1)/n), ya=gy(xa,za), yb=gy(xb,zb);
          for(const h of [.45,.85]) K.put('wood',gBox(L/n,.09,.07,CTILE.wood),TM((xa+xb)/2,(ya+yb)/2+h,(za+zb)/2,ry,0,Math.atan2(yb-ya,L/n))); } };
      fence(1,-12,16,-12); fence(1,-12,1,-27); fence(16,-12,16,-27); fence(1,-27,16,-27);
      for(const [lx,lz] of [[3.5,-20],[7.5,-24],[11,-18],[14,-23]]){ const [x,z]=P(lx,lz), y=gy(x,z); K.put('thatch',gCyl(.9,1.15,1.3,10,2),TM(x,y+.65,z)); K.put('thatch',gCone(.95,.9,10,2),TM(x,y+1.75,z)); rlObst({x,z,r:1.15}); } }
    { const [x,z]=P(9,2.8), y=gy(x,z), ry=V.r+.4; K.put('wood',gBox(2.2,.5,1.3,CTILE.wood),TM(x,y+.75,z,ry)); for(const q of [-1,1]) K.put('wood',gCyl(.48,.48,.12,12,CTILE.wood),TM(x+Math.sin(ry)*q*.72,y+.48,z+Math.cos(ry)*q*.72,ry,Math.PI/2));
      rlObst({x,z,r:1.2}); for(let i=0;i<3;i++){ const [bx,bz]=P(-6+i*.8,2.6+(i%2)*.6); K.put('wood',gCyl(.33,.33,.85,10,CTILE.wood),TM(bx,gy(bx,bz)+.42,bz)); } } }

  // --- army camps beside the castles: tents in rows, a fire, racks of spears, crates, a standard ---
  const campKits=[new Kit(),new Kit()];
  for(const C of RL_CAMPS){ const CK=campKits[C.t], face=C.t?-Math.PI/2:Math.PI/2;
    let i=0; for(let x=C.x0+3;x<C.x1-2;x+=5.2) for(let z=C.z0+3;z<C.z1-2;z+=5.5){ i++; const jx=x+(R()-.5)*1.2, jz=z+(R()-.5)*1.2, y=gy(jx,jz);
      if(i%4===0){ CK.put('cloth',gCone(2.0,3.0,10,2),TM(jx,y+1.5,jz)); CK.put('wood',gCyl(.07,.07,3.6,5,2),TM(jx,y+1.8,jz)); rlObst({x:jx,z:jz,r:2.0}); }
      else { const ry=face+(R()-.5)*.3; CK.put(i%3===0?'cloth':'tent',gRoof(2.8,2.0,3.6,2.4),TM(jx,y,jz,ry)); CK.put('wood',gCyl(.06,.06,2.3,5,2),TM(jx+Math.sin(ry)*1.75,y+1.1,jz+Math.cos(ry)*1.75)); rlObst({x:jx,z:jz,hw:1.5,hd:1.9,c:Math.cos(ry),s:-Math.sin(ry)}); } }
    const cx=(C.x0+C.x1)/2+(C.t?-2:2), cz=(C.z0+C.z1)/2, cy=gy(cx,cz);
    for(let k=0;k<8;k++){ const a=k/8*Math.PI*2; CK.put('stone',gBox(.4,.25,.3,CTILE.stone),TM(cx+Math.cos(a)*.7,cy+.1,cz+Math.sin(a)*.7,-a)); }
    for(let k=0;k<3;k++){ const a=k*2.1; CK.put('wood',gCyl(.08,.08,1.1,5,2),TM(cx+Math.cos(a)*.25,cy+.15,cz+Math.sin(a)*.25,a,Math.PI/2.4)); }
    RL.fires.push({x:cx,y:cy+.35,z:cz,camp:true}); rlObst({x:cx,z:cz,r:.9});
    for(let k=0;k<4;k++){ const a=k/4*Math.PI*2+.4, lx=cx+Math.cos(a)*2.1, lz=cz+Math.sin(a)*2.1; CK.put('wood',gCyl(.2,.2,1.6,7,2),TM(lx,gy(lx,lz)+.2,lz,-a,0,Math.PI/2)); }
    const rx=C.x1-1.5, rz=C.z0+1.2; for(let k=0;k<5;k++){ CK.put('wood',gCyl(.025,.025,2.4,4,2),TM(rx-k*.35,gy(rx,rz)+1.2,rz,0,0,.12)); CK.put('iron',new THREE.ConeGeometry(.05,.22,4),TM(rx-k*.35-.14,gy(rx,rz)+2.5,rz)); }
    CK.put('wood',gBox(2.0,.1,.1,CTILE.wood),TM(rx-.7,gy(rx,rz)+1.6,rz));
    for(let k=0;k<6;k++){ const bx=C.x0+1.5+R()*3, bz=C.z1-1.5-R()*3, by=gy(bx,bz), cr=R()<.5; CK.put('wood',cr?gBox(.8,.8,.8,CTILE.wood):gCyl(.33,.33,.85,10,CTILE.wood),TM(bx,by+.4,bz,R()*3)); }
    const sx=(C.t?C.x0+1.5:C.x1-1.5), sz=C.z1-1.5, sy=gy(sx,sz); CK.put('wood',gCyl(.08,.1,6,6,2),TM(sx,sy+3,sz)); CK.put('gold',new THREE.SphereGeometry(.15,8,6),TM(sx,sy+6.1,sz));
    const fl=new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.2,6,1),CM.cloth[C.t]); fl.geometry.translate(.9,0,0); fl.position.set(sx,sy+5.3,sz); fl.castShadow=true; RL.group.add(fl); RL.flags.push(fl); }
  for(let t=0;t<2;t++) campKits[t].build(RL.group,t);

  // --- watchtowers by the bridges ---
  for(const [x,z] of RL_TOWERS){ const y=gy(x,z)-.2;
    for(const sx of [-1,1]) for(const sz of [-1,1]) K.put('wood',gBox(.26,6.4,.26,CTILE.wood),TM(x+sx*1.1,y+3.2,z+sz*1.1,0,sz*.04,-sx*.04));
    for(const h of [1.6,3.6]) { K.put('wood',gBox(2.5,.12,.12,CTILE.wood),TM(x,y+h,z+1.1)); K.put('wood',gBox(2.5,.12,.12,CTILE.wood),TM(x,y+h,z-1.1)); K.put('wood',gBox(.12,.12,2.5,CTILE.wood),TM(x+1.1,y+h,z)); K.put('wood',gBox(.12,.12,2.5,CTILE.wood),TM(x-1.1,y+h,z)); }
    K.put('wood',gBox(3.0,.2,3.0,CTILE.wood),TM(x,y+6.4,z)); for(const q of [[0,1.45],[0,-1.45],[1.45,0],[-1.45,0]]) K.put('wood',gBox(q[0]?.1:3,.9,q[0]?3:.1,CTILE.wood),TM(x+q[0],y+6.9,z+q[1]));
    K.put('thatch',gCone(2.3,1.6,4,2.4),TM(x,y+8.6,z,Math.PI/4)); for(const sx of [-1,1]) for(const sz of [-1,1]) K.put('wood',gBox(.14,1.4,.14,CTILE.wood),TM(x+sx*1.35,y+7.4,z+sz*1.35));
    rlObst({x,z,r:1.6}); }

  // --- ruins on the two hills: a ring of broken columns, fallen drums, an arch fragment ---
  for(const [x0,z0] of RL_RUINS){ for(let i=0;i<9;i++){ const a=i/9*Math.PI*2, x=x0+Math.cos(a)*4.6, z=z0+Math.sin(a)*4.6, y=gy(x,z)-.1, h=i%3===0?.8+R()*.6:2+R()*2.6;
      K.put('marble',gCyl(.42,.48,h,12,CTILE.marble),TM(x,y+h/2,z,0,(R()-.5)*.08,(R()-.5)*.08)); K.put('marble',gBox(1.1,.25,1.1,CTILE.marble),TM(x,y+.12,z)); rlObst({x,z,r:.62}); }
    for(let i=0;i<3;i++){ const x=x0+(R()-.5)*5, z=z0+(R()-.5)*5, y=gy(x,z); K.put('marble',gCyl(.42,.42,1.3,12,CTILE.marble),TM(x,y+.38,z,R()*3,0,Math.PI/2)); }
    { const y=gy(x0,z0); K.put('marble',gBox(.7,3.6,.7,CTILE.marble),TM(x0-1.4,y+1.8,z0)); K.put('marble',gBox(.7,3.6,.7,CTILE.marble),TM(x0+1.4,y+1.8,z0)); K.put('marble',gBox(3.6,.6,.8,CTILE.marble),TM(x0,y+3.9,z0)); rlObst({x:x0-1.4,z:z0,r:.6}); rlObst({x:x0+1.4,z:z0,r:.6}); } }

  // --- signposts at the crossroads ---
  for(const [x,z,ry] of rlSym([[-80,8,.6],[-62,-9,1.2],[-104,10,0],[-30,-58,1.2],[-96,42,2.2]])){ const y=gy(x,z); K.put('wood',gBox(.14,2.2,.14,CTILE.wood),TM(x,y+1.1,z)); K.put('wood',gBox(1.1,.28,.06,CTILE.wood),TM(x+.3,y+1.9,z,ry)); K.put('wood',gBox(1.0,.25,.06,CTILE.wood),TM(x-.2,y+1.5,z,ry+2.2)); }
  // stumps and logs at the forest edges
  for(const F of RL_FORESTS) for(let i=0;i<4;i++){ const a=R()*6.28, x=F[0]+Math.cos(a)*(F[2]+1.5), z=F[1]+Math.sin(a)*(F[2]+1.5); if(!clearAt(x,z,0)) continue; const y=gy(x,z);
    if(i===0) K.put('wood',gCyl(.32,.32,2.6,8,CTILE.wood),TM(x,y+.25,z,R()*3,0,Math.PI/2)); else K.put('wood',gCyl(.32,.4,.5,8,CTILE.wood),TM(x,y+.2,z)); }

  // --- gold mines: a heap of ore, a timber headframe, a cart on rails; the storehouse with a lamp ---
  RL.mineVis=[[],[]];
  const crystalM=new THREE.MeshPhongMaterial({color:'#ff6a4a',emissive:'#9a1408',specular:'#ffd0c0',shininess:70}); emitReg(crystalM,'e');
  for(const t of [0,1]) for(const m of RL_MINE[t]){ const y=gy(m.x,m.z), GL=[], CL=[];   // each heap is one merged shape
    for(let i=0;i<16;i++){ const a=i/16*Math.PI*2+R(), r=i<3?R()*.5:.6+R()*1.5, s=i<3?.8+R()*.35:.3+R()*.45; GL.push([GEO.goldRock,TM(m.x+Math.cos(a)*r,y+s*.45,m.z+Math.sin(a)*r,0,R()*3,R()*3,[s,s,s])]); }
    for(let i=0;i<12;i++){ const a=i/12*Math.PI*2, r=i?.5+R()*1.3:0, h=i?.5+R()*.8:1.6; CL.push([new THREE.OctahedronGeometry(1,0),TM(m.x+Math.cos(a)*r,y+h*.45,m.z+Math.sin(a)*r,R()*3,(R()-.5)*.7,(R()-.5)*.7,[.2+R()*.12,h,.2+R()*.12])]); }
    const gold=new THREE.Mesh(gMerge(GL),M.gold), cr=new THREE.Mesh(gMerge(CL),crystalM); gold.castShadow=gold.receiveShadow=cr.castShadow=true;
    RL.group.add(gold,cr); RL.mineVis[t].push({gold,crystal:cr});
    const s=Math.sign(m.z), ox=m.x+(t?2.6:-2.6), oz=m.z+s*2.4;
    for(const q of [-1,1]) K.put('wood',gBox(.22,4.2,.22,CTILE.wood),TM(ox+q*1.2,y+2.0,oz,0,0,-q*.16)); K.put('wood',gBox(2.8,.2,.2,CTILE.wood),TM(ox,y+3.9,oz)); K.put('wood',gCyl(.35,.35,.2,12,CTILE.wood),TM(ox,y+3.9,oz+.2,0,Math.PI/2)); K.put('rope',gCyl(.02,.02,3.2,4,1),TM(ox,y+2.3,oz+.2));
    const rx=m.x+(t?-1:1)*2, rz0=m.z-s*2.7; for(let k=0;k<6;k++) K.put('wood',gBox(1.2,.08,.18,CTILE.wood),TM(rx,gy(rx,rz0-s*k*.7)+.04,rz0-s*k*.7)); for(const q of [-.4,.4]) K.put('iron',gBox(.06,.06,4.4,CTILE.iron),TM(rx+q,gy(rx,rz0-s*1.75)+.12,rz0-s*1.75));
    K.put('wood',gBox(.9,.6,1.2,CTILE.wood),TM(rx,gy(rx,rz0)+.55,rz0-s*.6)); for(let k=0;k<3;k++) K.put('gold',new THREE.DodecahedronGeometry(.18,0),TM(rx+(k-1)*.22,gy(rx,rz0)+.92,rz0-s*.6+(k%2-.5)*.3));
    rlObst({x:m.x,z:m.z,r:1.4}); rlObst({x:ox,z:oz,r:.5});
    // the storehouse, on the field side of the drop-off with its door facing it
    const dx=m.dx+(t?-4.2:4.2), dz=m.dz, dy=gy(dx,dz)-.15, ry=t?-Math.PI/2:Math.PI/2;
    K.put('wood',gBox(4.2,2.6,3.6,CTILE.wood),TM(dx,dy+1.3,dz,ry)); K.put('terracotta',gRoof(4.4,1.4,4.8,CTILE.terracotta),TM(dx,dy+2.6,dz,ry+Math.PI/2));
    K.put('dark',gBox(1.4,1.8,.06,1),TM(dx+(t?1.82:-1.82),dy+.9,dz,ry)); rlObst({x:dx,z:dz,hw:1.9,hd:2.2,c:1,s:0});
    for(let k=0;k<4;k++){ const bx=m.dx+(R()-.5)*2+(t?-4:4), bz=m.dz+(k<2?-3.4:3.4)+(R()-.5)*.6; K.put('wood',k%2?gBox(.8,.8,.8,CTILE.wood):gCyl(.33,.33,.85,10,CTILE.wood),TM(bx,gy(bx,bz)+.4,bz,R()*3)); }
    K.put('iron',gCyl(.06,.06,2.6,5,2),TM(m.dx+(t?-1:1)*.8,gy(m.dx,m.dz)+1.3,m.dz+1.8)); RL.fires.push({x:m.dx+(t?-1:1)*.8,y:gy(m.dx,m.dz)+2.7,z:m.dz+1.8,small:true});
  }

  // --- the castles stop soldiers outside them (their own way in and out is the gate) ---
  for(const t of [0,1]) rlObst({x:(t?1:-1)*(RL_CF+18.6),z:-2.5,hw:18.6,hd:19.4,c:1,s:0});

  K.build(RL.group,0); Kit.mats=keepMats;
  rlObstGrid();
}

/* ---------- switching maps ---------- */
const RL_CLASSIC={fx0:-42,fx1:42,fz0:-15,fz1:15,cx:72,cz:20,cf:46};
function setMapMode(river){
  if(river&&!RL.built) rlBuild();
  RL.on=river; MAP.id=river?'river':'classic';
  rlRangeMode(river);   // bows and spells reach four or five times as far on the big map (37e)
  if(river){ Object.assign(MAP,{fx0:-RL_LIM,fx1:RL_LIM,fz0:-RL_LIM,fz1:RL_LIM,cx:165,cz:165,cf:RL_CF,zmax:130,obst:true,ground:RL.ground});
    BASE_X[0]=-(RL_CF-12); BASE_X[1]=RL_CF-12;
    heightGrid(-RL_EDGE,-RL_EDGE,RL_EDGE*2+1,RL_EDGE*2+1,1); setGrid(-174,-174,58,58,6); Object.assign(MM,{x0:-163,x1:163,z0:-163,z1:163}); }
  else { Object.assign(MAP,RL_CLASSIC,{zmax:70,obst:false,ground:null}); BASE_X[0]=-34; BASE_X[1]=34;
    heightGrid(-60,-32,181,97,120/180); setGrid(-48,-21,32,14,3); Object.assign(MM,{x0:-62,x1:62,z0:-19,z1:17}); }
  for(const C of CASTLES) if(C&&C.group){ C.group.position.x=C.team?MAP.cf:-MAP.cf; C.group.updateMatrixWorld(true); }
  if(RL.group) RL.group.visible=river;
  if(river) fowPatchScene(); else { FOW.on=false; FOW.uOn.value=0; }
  dnLightsOn(river);
  if(groundMesh) groundMesh.visible=!river; if(rocksIM) rocksIM.visible=!river;
  // a greener, hazier light on the valley; the dusk plain keeps its own. The sky follows the camera on the big map.
  FOG0.near=river?70:38; FOG0.far=river?215:105; HORIZON.set(river?'#d6d3b4':'#e3c79a'); if(scene.fog) scene.fog.color.copy(HORIZON);
  MAP.far=river?240:400;   // the far plane itself follows the view distance (applyDistances)
  if(!river){ if(skyDome) skyDome.position.set(0,0,0); if(sunDisc){ sunDisc.position.set(-90,60,-170); } }
  if(typeof applyGfx==='function'&&typeof GFX!=='undefined'&&GFX) applyGfx(GFX);
  setBodyClass('map-river',river); RL.mmKey='';
  syncMines(); if(river) rlResetZones();
  if(typeof syncMinimap==='function') syncMinimap();
}

/* ---------- each step and each frame ---------- */
function rlStep(dt){
  RL.sway.value=game.time;
  if(RL.flow) RL.flow.offset.y-=dt*.12;
  for(const m of RL.mills) m.rotation.z+=dt*.6;
  for(let i=0;i<RL.flags.length;i++) RL.flags[i].rotation.y=.3*Math.sin(game.time*1.6+i*1.7)+.12*Math.sin(game.time*4+i);
  if(RL.zones.length) rlZonesStep(dt);
  fowStep(dt); rlSysStep(dt);   // day and night, stealth, supply, camps (37f)
  rlZonesDraw();
  // the sky dome and sun stay round the camera, so a far corner of the valley still has a sky
  if(skyDome) skyDome.position.set(camera.position.x,0,camera.position.z); if(sunDisc) sunDisc.position.set(camera.position.x-90,60,camera.position.z-170);
  // the long grass, flowers and reeds give way on the lowest quality
  RL.low=typeof GFX!=='undefined'&&!!GFX&&(GFX.shadows===0||GFX.res<.75);
  // chimney smoke and fires, only close to the camera
  const cx=cam.target.x, cz=cam.target.z, R2=Math.pow(Math.max(40,cam.dist*1.4),2);
  if(RL.chimneys) for(const c of RL.chimneys) if((c.x-cx)**2+(c.z-cz)**2<R2&&Math.random()<dt*.9) puff(new V3(c.x,c.y,c.z),1,.45,.5,'#8a8478');
  for(const f of RL.fires) if((f.x-cx)**2+(f.z-cz)**2<R2&&Math.random()<dt*(f.camp?14:f.small?3:5)) emitFire(new V3(f.x+(Math.random()-.5)*.3,f.y,f.z+(Math.random()-.5)*.3),1,f.camp?.42:f.small?.16:.26,0,f.camp?1.2:.8,0,.25,f.camp?.75:.5);
}
const _rlp=new V3();
function rlDrawFx(){ rlCullTiles(); const T=game.time, cx=cam.target.x, cz=cam.target.z, nk=dnNight(), big=1+nk*1.6;
  for(const f of RL.fires){ if((f.x-cx)**2+(f.z-cz)**2>160*160) continue; _rlp.set(f.x,f.y+(f.camp?.25:.05),f.z); glowAt(_rlp,(f.camp?.36:f.small?.14:.18)*big*(1+.12*Math.sin(T*11+f.x)),f.camp?'#ff7a22':'#ff8a2a'); }
  // at night every regiment's standard-bearer carries a torch
  if(nk>.2) for(const r of regs){ const b=regAlive(r)[0]; if(!b||b.fowH||b.fl) continue; _rlp.copy(b.j.hL).addScaledVector(UP,.35*b.s); glowAt(_rlp,(.16+.03*Math.sin(T*17+r.id))*nk,'#ffa040'); if(Math.random()<.15*nk) emitFire(_rlp,1,.1,0,.5,0,.1,.35); } }

/* ---------- the battlefield map (minimap) ---------- */
function rlMinimapBg(c,w,h,dpr){
  const key=w+'x'+h; if(RL.mmKey!==key||!RL.mmBg){ RL.mmKey=key; const b=document.createElement('canvas'); b.width=w; b.height=h; const g=b.getContext&&b.getContext('2d'); RL.mmBg=g?b:null;
    const M=(MM.x1-MM.x0)/w;
    if(g){ g.fillStyle='rgba(74,98,48,.6)'; g.fillRect(0,0,w,h);
      for(const F of RL_FORESTS){ g.fillStyle='rgba(30,52,26,.75)'; g.beginPath(); g.arc(mmX(F[0],w),mmZ(F[1],h),F[2]/M,0,TAU); g.fill(); }
      g.strokeStyle='rgba(198,168,118,.65)'; g.lineWidth=Math.max(1,dpr); for(const L of RL_ROADS){ g.beginPath(); L.forEach((p,i)=>i?g.lineTo(mmX(p[0],w),mmZ(p[1],h)):g.moveTo(mmX(p[0],w),mmZ(p[1],h))); g.stroke(); }
      g.strokeStyle='rgba(96,160,178,.95)'; g.lineWidth=Math.max(2,9/M); g.beginPath(); for(let z=MM.z0;z<=MM.z1;z+=3){ const x=mmX(rlRiverX(z),w), y=mmZ(z,h); z>MM.z0?g.lineTo(x,y):g.moveTo(x,y); } g.stroke();
      g.fillStyle='rgba(176,160,132,.95)'; for(const B of RL_BRIDGES){ g.save(); g.translate(mmX(B.x,w),mmZ(B.z,h)); g.rotate(Math.atan2(B.az,B.ax)); const L=B.len/M, W=Math.max(2*dpr,B.wid/M); g.fillRect(-L/2,-W/2,L,W); g.restore(); }
      for(const V of RL_VIL){ g.fillStyle='rgba(150,96,64,.85)'; const s=(V.big?5:3.5)*dpr; g.fillRect(mmX(V.x,w)-s,mmZ(V.z,h)-s*.8,s*2,s*1.6); }
      for(const C of RL_CAMPS){ g.fillStyle=C.t?'rgba(160,60,80,.45)':'rgba(200,160,70,.45)'; g.fillRect(mmX(C.x0,w),mmZ(C.z0,h),mmX(C.x1,w)-mmX(C.x0,w),mmZ(C.z1,h)-mmZ(C.z0,h)); }
      for(let t=0;t<2;t++){ const xa=mmX((t?1:-1)*RL_CF,w), xb=mmX((t?1:-1)*(RL_CF+36.5),w); g.fillStyle='rgba(130,122,108,.9)'; g.fillRect(Math.min(xa,xb),mmZ(-21,h),Math.abs(xb-xa),mmZ(16,h)-mmZ(-21,h)); g.fillStyle=t?'rgba(208,70,90,.9)':'rgba(228,178,58,.9)'; g.fillRect(xa+(t?0:-2*dpr),mmZ(-21,h),2*dpr,mmZ(16,h)-mmZ(-21,h)); }
      g.fillStyle='rgba(240,196,70,.95)'; for(const t of [0,1]) for(const m of RL_MINE[t]){ g.beginPath(); g.arc(mmX(m.x,w),mmZ(m.z,h),2.8*dpr,0,TAU); g.fill(); } } }
  if(RL.mmBg) c.drawImage(RL.mmBg,0,0);
  // fords: a dotted crossing
  c.fillStyle='rgba(214,200,160,.9)'; for(const F of RL_FORDS){ const x=rlRiverX(F.z); for(let i=-2;i<=2;i++){ c.beginPath(); c.arc(mmX(x+i*2.2,w),mmZ(F.z,h),Math.max(1,dpr),0,TAU); c.fill(); } }
  fowMinimap(c,w,h);
}
function rlMinimapZones(c,w,h,dpr){
  for(const Z of RL.zones){ const x=mmX(Z.x,w), y=mmZ(Z.z,h), r=Math.max(5*dpr,RL_ZR/(MM.x1-MM.x0)*w*1.25), own=Z.owner;
    c.fillStyle=own<0?'rgba(30,24,18,.75)':PAL.zone[own]; c.beginPath(); c.arc(x,y,r,0,TAU); c.fill();
    c.strokeStyle=Z.contest?'#ffffff':'rgba(245,236,217,.8)'; c.lineWidth=dpr*(Z.contest?1.6:1); c.stroke();
    if(Math.abs(Z.s)>.02&&Math.abs(Z.s)<.999){ c.strokeStyle=RL_TEAMC[Z.s<0?0:1]; c.lineWidth=2*dpr; c.beginPath(); c.arc(x,y,r+2*dpr,-Math.PI/2,-Math.PI/2+Math.abs(Z.s)*TAU); c.stroke(); }
    c.fillStyle='#fff6e0'; c.font='700 '+Math.round(r*1.2)+'px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(Z.id,x,y+.5*dpr); }
}
// how many zones an army holds (for the side cards)
function rlHeld(t){ let n=0; for(const Z of RL.zones) if(Z.owner===t) n++; return n; }

/* ---------- orders for the zones ---------- */
// the zone a regiment's Capture button sends it to: the nearest one its army doesn't hold, else the nearest under attack
function rlCaptureTarget(r){ if(!RL.zones.length||!regAlive(r).length) return null; const c=regCenter(r), t=r.team;
  let best=null, bd=1e9; for(const Z of RL.zones){ if(Z.owner===t&&!Z.contest) continue; const d=Math.hypot(Z.x-c.x,Z.z-c.z)-(Z.contest?40:0); if(d<bd){ bd=d; best=Z; } }
  return best; }
