/* ---------- spell projectiles: each caster's shot has a look of its own ----------
   Only the drawing changes (where a shot flies and what it hits is the same as before):
   · Wizard — an arcane orb: a white-hot core in a violet halo, three motes circling it, a comet tail of fading light
   · Wizard's meteor — a burning rock trailing fire and smoke
   · Soul Harvester — a wailing soul: red eyes and a gaping mouth, a cage of motes, a tattered three-stranded tail
   · Fallen Oracle — a spirit orb: two teal lights twisting round each other in a helix, a long misty tail
   · Infernal Bomber — a black bomb with a spitting fuse, sparks and a ribbon of smoke */
const _pf1=new V3(), _pf2=new V3(), _pf3=new V3(), _pfa=new V3(), _pfb=new V3();
// a short history of where a shot has been, for its tail (kept on the shot itself)
function pfTrail(o,n){ const T=o.trail||(o.trail=[]); const last=T[T.length-1]; if(!last||last.distanceToSquared(o.p)>.04){ T.push(o.p.clone()); if(T.length>n) T.shift(); } return T; }
// two axes across the direction of flight
function pfAxes(v){ _pfa.copy(v); if(_pfa.lengthSq()<1e-6) _pfa.set(0,0,1); _pfa.normalize(); _pfb.set(0,1,0); if(Math.abs(_pfa.y)>.95) _pfb.set(1,0,0); _pf1.crossVectors(_pfa,_pfb).normalize(); _pf2.crossVectors(_pf1,_pfa).normalize(); }
function drawOrb(O){
  if(O.acid){ drawAcid(O); return; }   // an Acid Spitter's gob (27k)
  const t=game.time, T=pfTrail(O,O.big?10:8);
  if(O.big){   // meteor
    glowAt(O.p,.36+.05*Math.sin(t*40),'#ffd27a'); glowAt(O.p,.7,'#7a2a08');
    for(let i=0;i<T.length;i++){ const k=i/T.length; glowAt(T[i],.12+.3*k,k>.6?'#ff9a3a':'#7a3010'); }
    if(Math.random()<.7) emitFire(O.p,2,.35,-O.v.x*.05,.6,-O.v.z*.05,.3,.5);
    if(Math.random()<.35) puff(O.p,1,.25,.4,'#3a3028');
    return; }
  pfAxes(O.v);
  const pul=.5+.5*Math.sin(t*22+O.age*9);
  glowAt(O.p,.12+.03*pul,'#ffffff'); glowAt(O.p,.24,'#c48dff'); glowAt(O.p,.46+.06*pul,'#3c1660');
  for(let i=0;i<3;i++){ const a=t*11+i*2.094+O.age*4, r=.26;
    _pf3.copy(O.p).addScaledVector(_pf1,Math.cos(a)*r).addScaledVector(_pf2,Math.sin(a)*r); glowAt(_pf3,.05,'#e8d0ff'); }
  for(let i=0;i<T.length-1;i++){ const k=(i+1)/T.length; glowAt(T[i],.04+.13*k,k>.5?'#a46cf0':'#4a2280'); }
  if(Math.random()<.5) puffDir(O.p,UP,1,.2,.25,'#d9b6ff',.05,.5);
}
function drawSoul(S){
  if(!S.col){ drawWailingSoul(S); return; }   // the Soul Harvester's own shot (below)
  const t=game.time, oracle=true, T=pfTrail(S,12); pfAxes(S.v);
  if(oracle){   // spirit orb: a teal helix
    glowAt(S.p,S.big?.2:.13,'#e6fff6'); glowAt(S.p,S.big?.42:.3,'#0e5a48');
    for(let i=0;i<2;i++){ const a=t*14+i*Math.PI+S.age*6, r=S.big?.24:.18;
      _pf3.copy(S.p).addScaledVector(_pf1,Math.cos(a)*r).addScaledVector(_pf2,Math.sin(a)*r); glowAt(_pf3,S.big?.09:.07,'#5dffc8'); }
    for(let i=0;i<T.length-1;i++){ const k=(i+1)/T.length, a=t*14+i*.9; _pf3.copy(T[i]).addScaledVector(_pf1,Math.cos(a)*.12*k).addScaledVector(_pf2,Math.sin(a)*.12*k); glowAt(_pf3,.03+.1*k,k>.5?'#7dffd6':'#13493c'); }
    if(Math.random()<.4) puffDir(S.p,UP,1,.15,.2,'#9affdd',.06,.7);
    return; }
}
// The Soul Harvester's shot: a wailing soul torn from the dead. A pale, half-see-through skull-face with black eye
// sockets burning red and a gaping mouth, turned the way it flies; a cage of tiny lights turning round it; and a
// tattered three-stranded ghost tail of violet-to-crimson smoke that twists and frays behind it. It shudders and
// flickers as it goes and sheds smoke and embers. The face and tail are drawn translucent (not as glow), so they
// read against bright sand as well as dark grass.
let ghostIM=null;
const _ws1=new V3(), _ws2=new V3(), _wq=new THREE.Quaternion(), _wz=new V3(0,0,1);
function ghostLayer(){ if(ghostIM) return ghostIM;
  ghostIM=new THREE.InstancedMesh(new THREE.SphereGeometry(1,12,9),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.62,depthWrite:false}),1600);
  for(let i=0;i<1600;i++) ghostIM.setColorAt(i,WHITE);
  ghostIM.userData.cap=1600; ghostIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); ghostIM.frustumCulled=false; ghostIM.count=0; ghostIM.renderOrder=3; scene.add(ghostIM); CNT.set(ghostIM,0);
  return ghostIM; }
function ghostAt(p,sx,sy,sz,c){ _s.set(sx,sy,sz); _m.compose(p,_wq,_s); put(ghostIM,scol(c)); }
function drawWailingSoul(S){
  ghostLayer();
  const t=game.time, k=S.big?1.45:1, T=pfTrail(S,16); pfAxes(S.v); _wq.setFromUnitVectors(_wz,_pfa);
  const fl=.8+.2*Math.sin(t*41+S.age*17)*Math.sin(t*19);           // the flicker of a thing half there
  const sh=.04*k*Math.sin(S.age*31);                                  // a shudder
  const H=_ws1.copy(S.p).addScaledVector(_pf1,Math.sin(S.age*8)*.06*k+sh).addScaledVector(_pf2,Math.cos(S.age*6)*.04*k);
  // the face: a pale skull, a little long, black sockets with red fire in them, a mouth that gapes and shuts
  ghostAt(H,.12*k*fl,.13*k*fl,.15*k,'#d9cdea');
  for(const sd of [-1,1]){ _ws2.copy(H).addScaledVector(_pfa,.1*k).addScaledVector(_pf1,sd*.05*k).addScaledVector(_pf2,.03*k);
    ghostAt(_ws2,.034*k,.04*k,.03*k,'#140816'); glowAt(_ws2,(.018+.008*Math.sin(t*13+sd))*k,'#ff2030'); }
  const mo=.5+.5*Math.sin(t*9+S.age*5); _ws2.copy(H).addScaledVector(_pfa,.095*k).addScaledVector(_pf2,-.055*k);
  ghostAt(_ws2,.035*k,(.015+.03*mo)*k,.03*k,'#1a0a1c');
  glowAt(H,.07*k*fl,'#5a3a72');                                       // a faint inner light
  // the soul cage: five lights turning round the head
  for(let i=0;i<5;i++){ const a=t*7+i*1.2566+S.age*3, r=(.26+.03*Math.sin(t*5+i))*k;
    _ws2.copy(H).addScaledVector(_pf1,Math.cos(a)*r).addScaledVector(_pf2,Math.sin(a)*r).addScaledVector(_pfa,-.04*k); glowAt(_ws2,.018*k,i%2?'#b07ae8':'#e04a7a'); }
  // the ghost tail: three strands twisting round the path, fraying wider, darker and thinner toward the end
  const n=T.length;
  for(let s=0;s<3;s++) for(let i=0;i<n-1;i++){ const q=(i+1)/n, back=1-q, a=t*6+s*2.094+i*.55, r=(.03+.22*back)*k;
    _ws2.copy(T[i]).addScaledVector(_pf1,Math.cos(a)*r).addScaledVector(_pf2,Math.sin(a)*r*.8+back*back*.12);
    const c=q>.75?'#a67ad8':q>.5?'#8a3a8a':q>.25?'#6a1838':'#2a0c2c', w=(.02+.06*q)*k*(s?.85:1);
    ghostAt(_ws2,w,w,w*2.8,c); }   // stretched along the flight so the strands run on unbroken
  // it sheds smoke and embers
  if(Math.random()<.3) puffDir(T[0]||S.p,UP,1,.35,.2,Math.random()<.6?'#3a1a48':'#5a2040',.11*k,.9);
  if(Math.random()<.2) puffDir(H,UP,1,.6,.5,'#ff5a8a',.03,.5);
}
function drawBomb(B){
  const t=game.time, T=pfTrail(B,7);
  glowAt(B.p,.13,'#2a1a14');   // the bomb's dark bulk, faintly lit
  _pf3.copy(B.p); _pf3.y+=.14; const sp=.06+.05*Math.abs(Math.sin(t*47+B.age*30));
  glowAt(_pf3,sp,'#fff0b0'); glowAt(_pf3,sp*2.2,'#ff7a1a');
  for(let i=0;i<T.length-1;i++){ const k=(i+1)/T.length; glowAt(T[i],.03+.05*k,'#ff9a3a'); }
  if(Math.random()<.6) puff(T[0]||B.p,1,.09,.25,Math.random()<.7?'#4a403a':'#6a5a50');
  if(Math.random()<.35) emitFire(_pf3,1,.08,rand(-.6,.6),.8,rand(-.6,.6),.3,.3);
}
