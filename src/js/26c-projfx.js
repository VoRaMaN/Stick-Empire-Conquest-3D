/* ---------- spell projectiles: each caster's shot has a look of its own ----------
   Only the drawing changes (where a shot flies and what it hits is the same as before):
   · Wizard — an arcane orb: a white-hot core in a violet halo, three motes circling it, a comet tail of fading light
   · Wizard's meteor — a burning rock trailing fire and smoke
   · Soul Harvester — a stolen soul: a flickering crimson-and-violet core that weaves as it flies, shedding wisps
   · Fallen Oracle — a spirit orb: two teal lights twisting round each other in a helix, a long misty tail
   · Infernal Bomber — a black bomb with a spitting fuse, sparks and a ribbon of smoke */
const _pf1=new V3(), _pf2=new V3(), _pf3=new V3(), _pfa=new V3(), _pfb=new V3();
// a short history of where a shot has been, for its tail (kept on the shot itself)
function pfTrail(o,n){ const T=o.trail||(o.trail=[]); const last=T[T.length-1]; if(!last||last.distanceToSquared(o.p)>.04){ T.push(o.p.clone()); if(T.length>n) T.shift(); } return T; }
// two axes across the direction of flight
function pfAxes(v){ _pfa.copy(v); if(_pfa.lengthSq()<1e-6) _pfa.set(0,0,1); _pfa.normalize(); _pfb.set(0,1,0); if(Math.abs(_pfa.y)>.95) _pfb.set(1,0,0); _pf1.crossVectors(_pfa,_pfb).normalize(); _pf2.crossVectors(_pf1,_pfa).normalize(); }
function drawOrb(O){
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
  const t=game.time, oracle=!!S.col, T=pfTrail(S,oracle?12:9); pfAxes(S.v);
  if(oracle){   // spirit orb: a teal helix
    glowAt(S.p,S.big?.2:.13,'#e6fff6'); glowAt(S.p,S.big?.42:.3,'#0e5a48');
    for(let i=0;i<2;i++){ const a=t*14+i*Math.PI+S.age*6, r=S.big?.24:.18;
      _pf3.copy(S.p).addScaledVector(_pf1,Math.cos(a)*r).addScaledVector(_pf2,Math.sin(a)*r); glowAt(_pf3,S.big?.09:.07,'#5dffc8'); }
    for(let i=0;i<T.length-1;i++){ const k=(i+1)/T.length, a=t*14+i*.9; _pf3.copy(T[i]).addScaledVector(_pf1,Math.cos(a)*.12*k).addScaledVector(_pf2,Math.sin(a)*.12*k); glowAt(_pf3,.03+.1*k,k>.5?'#7dffd6':'#13493c'); }
    if(Math.random()<.4) puffDir(S.p,UP,1,.15,.2,'#9affdd',.06,.7);
    return; }
  // a stolen soul: crimson and violet, flickering, weaving as it goes
  const fl=.7+.3*Math.sin(t*37+S.age*13)*Math.sin(t*23);
  _pf3.copy(S.p).addScaledVector(_pf1,Math.sin(S.age*9)*.08).addScaledVector(_pf2,Math.cos(S.age*7)*.06);
  glowAt(_pf3,(S.big?.2:.13)*fl,'#ffd0e8'); glowAt(_pf3,(S.big?.32:.22),'#c0306a'); glowAt(_pf3,(S.big?.5:.36),'#2a0a3a');
  for(let i=0;i<T.length-1;i++){ const k=(i+1)/T.length, w=Math.sin(t*9+i*1.3)*.15*(1-k);
    _pf3.copy(T[i]).addScaledVector(_pf1,w); glowAt(_pf3,.03+.11*k,i%2?'#9a5cff':'#ff3a6a'); }
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
