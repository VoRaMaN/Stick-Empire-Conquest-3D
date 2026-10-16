/* ================= Hellcrawler (Chaos): a four-limbed demon of the abyss =================
   Not a stick soldier: a hunched beast of cracked black rock with magma glowing in the cracks, long ape-like
   forelimbs ending in hooked claws, digitigrade hind legs, a horned skull with a hinged, fanged jaw, bone
   spikes down its spine and a long spiked tail.
   Rig (metres at scale 1): hips → mid-spine → shoulders → neck → skull + jaw. Forelimbs shoulder-elbow-wrist
   reach (2-bone IK) for paws planted by the gait; hind legs run hip-knee-ankle-toe, the ankle sitting on a
   fixed-angle metatarsus above the planted toe, then 2-bone IK hip→ankle. The tail is 16 segments carried
   scorpion-style, arched up over the back with the blade over the skull, and follows the body with lag. The usual joint names (pelvis, chest, neck, head, sL/eL/hL, hipL/kL/fL …) are filled in, so
   ragdolls, aiming, arrows, blood and finishers treat it like any other body.
   The model is built from shaped parts (one gear group per bone), so every Hellcrawler on the field is drawn
   in a handful of instanced batches. */
const CHAOS=['thrall','crawler','dread','harvester'];   // the Chaos Empire's roster, in dock order
const CRB={pm:.4,mc:.36,ua:.5,fa:.58,th:.36,sh:.38,mt:.27,hipH:.66,metaA:1.0}, CR_HEAD=1.22;   // CR_HEAD: skull and jaw scale
// tail: CR_TN segments (about 2 m at scale 1) tapering base → tip, plus the bone blade; CR_TK has one more entry for the tip
const CR_TN=16, CR_TK=Array.from({length:CR_TN+1},(_,i)=>1-.56*i/CR_TN), CR_TL=.17;
const crTi=i=>i*8/CR_TN;   // segment index on the original 8-segment curl profile
// elevation of tail segment fi (0…8) above the backward horizontal for the 'alt' channel:
//   0 = scorpion stance (rises off the hips, arches about 1.8 m high, blade over the skull pointing down at the prey),
//   0→1 cocks it back and up, 1→1.4 the strike (the original strike path, so tail hits keep their reach),
//   below 0 lowers it flat behind (−1 = trailing low, for the spinning sweeps)
function crTh(fi,al){ const u=fi/8, low=.32-.88*u, K=.7+3.04*u;
  if(al<0) return lerp(.9+3.7*u-.6*u*u,low,Math.min(-al,1));
  return al<=1?lerp(.9+3.7*u-.6*u*u,K,al):lerp(low,K,al); }
const CR_HOME=[[-.4,-.21],[-.4,.21],[.5,-.5],[.5,.5]];       // planted limb homes [forward, right]: hindL, hindR, foreL, foreR
const CRM={}, CRG={};
let crReady=false;

/* ---------- material: black rock with molten cracks (procedural, seamless) ---------- */
function crTextures(){
  try{
    if(typeof document==='undefined'||!document.createElement) return null;
    const N=256, a=document.createElement('canvas'), b=document.createElement('canvas'); if(!a.getContext) return null;
    a.width=a.height=b.width=b.height=N; const c=a.getContext('2d'), g=b.getContext('2d'); if(!c||!g) return null;
    let sd=97; const R=()=>(sd=(sd*16807)%2147483647)/2147483647;
    const W9=[]; for(let ox=-1;ox<=1;ox++) for(let oy=-1;oy<=1;oy++) W9.push([ox*N,oy*N]);
    c.fillStyle='#1d1715'; c.fillRect(0,0,N,N);
    for(let i=0;i<420;i++){ const x=R()*N,y=R()*N,r=2+R()*18; c.fillStyle=R()<.5?'rgba(92,78,70,.18)':'rgba(0,0,0,.32)';
      for(const [ox,oy] of W9){ c.beginPath(); c.arc(x+ox,y+oy,r,0,Math.PI*2); c.fill(); } }
    g.fillStyle='#000'; g.fillRect(0,0,N,N);
    const line=(ctx,x0,y0,x1,y1)=>{ for(const [ox,oy] of W9){ ctx.beginPath(); ctx.moveTo(x0+ox,y0+oy); ctx.lineTo(x1+ox,y1+oy); ctx.stroke(); } };
    const crack=(x,y,a,len,w)=>{
      for(let k=0;k<len;k++){ const st=4+R()*4, nx=x+Math.cos(a)*st, ny=y+Math.sin(a)*st;
        c.lineWidth=w+1.4; c.strokeStyle='#0c0605'; line(c,x,y,nx,ny); c.lineWidth=w*.4; c.strokeStyle='#4a160a'; line(c,x,y,nx,ny);
        g.lineWidth=w*.85; g.strokeStyle='#e8400e'; line(g,x,y,nx,ny); g.lineWidth=w*.3; g.strokeStyle='#ffb04a'; line(g,x,y,nx,ny);
        x=((nx%N)+N)%N; y=((ny%N)+N)%N; a+=(R()-.5)*.95;
        if(R()<.07&&w>1.1) crack(x,y,a+(R()<.5?1:-1)*(.7+R()*.6),len*.5|0,w*.6); } };
    c.lineCap=g.lineCap='round'; g.shadowColor='#ff2a00'; g.shadowBlur=3;
    for(let i=0;i<15;i++) crack(R()*N,R()*N,R()*Math.PI*2,12+R()*18|0,1.1+R()*1.2);
    const ta=new THREE.CanvasTexture(a), tb=new THREE.CanvasTexture(b);
    for(const t of [ta,tb]){ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(1,1); }
    return {map:ta,glow:tb};
  }catch(e){ return null; }
}
function crInit(){
  if(crReady) return; crReady=true;
  const T=crTextures();
  CRM.skin=new THREE.MeshPhongMaterial({color:'#d8ccc4',specular:'#5c463a',shininess:26,emissive:'#ff4410',emissiveIntensity:1.25});
  if(T){ CRM.skin.map=T.map; CRM.skin.emissiveMap=T.glow; CRM.skin.bumpMap=T.map; CRM.skin.bumpScale=.03; }
  else { CRM.skin.color.set('#2e2420'); CRM.skin.emissive.set('#2a0700'); CRM.skin.emissiveIntensity=1; }
  CRM.hot=CRM.skin.clone(); CRM.hot.emissive=new THREE.Color('#ff6a1e'); CRM.hot.emissiveIntensity=T?2.2:2.5;
  CRM.bone=new THREE.MeshPhongMaterial({color:'#2c221e',specular:'#8a7262',shininess:44});
  CRM.tooth=new THREE.MeshPhongMaterial({color:'#e9d4b0',specular:'#ffffff',shininess:30,emissive:'#4a160a'});
  CRM.eye=new THREE.MeshBasicMaterial({color:'#ffc43a'});
  CRM.maw=new THREE.MeshBasicMaterial({color:'#ff4a12'});
  crGeometry();
}

/* ---------- geometry: every part in its bone's frame (y along the bone, z toward the back/up) ---------- */
const CRX=new V3(1,0,0);
function crE(cx,cy,cz,sx,sy,sz){ return [new THREE.SphereGeometry(1,16,11),new THREE.Matrix4().compose(new V3(cx,cy,cz),new THREE.Quaternion(),new V3(sx,sy,sz))]; }
function crL(prof,seg,sx,sz,off){ return [new THREE.LatheGeometry(prof.map(q=>new THREE.Vector2(Math.max(q[1],1e-4),q[0])),seg||12),
  new THREE.Matrix4().compose(off||new V3(),new THREE.Quaternion(),new V3(sx||1,1,sz||1))]; }
// a curved, tapering spike: starts at p0 heading d0, bending about `ax` by `ang` over its length
function crHorn(p0,d0,ax,ang,len,r0,n){
  n=n||5; const L=[], d=d0.clone().normalize(), step=len/n; let p=p0.clone();
  for(let i=0;i<n;i++){ const q=p.clone().addScaledVector(d,step), ra=r0*(1-i/n)+.002, rb=r0*(1-(i+1)/n)+.002;
    L.push([new THREE.CylinderGeometry(rb,ra,step*1.06,6,1),new THREE.Matrix4().compose(p.clone().lerp(q,.5),new THREE.Quaternion().setFromUnitVectors(UP,d),new V3(1,1,1))]);
    p=q; d.applyAxisAngle(ax,ang/n); }
  return L; }
// a tooth: a cone whose tip points down (-z, dn=-1) or up (+z, dn=1)
function crTooth(x,y,z,r,h,dn){ const g=new THREE.ConeGeometry(r,h,5); return [g,new THREE.Matrix4().compose(new V3(x,y,z+dn*h*.5),new THREE.Quaternion().setFromEuler(new THREE.Euler(dn*Math.PI/2,0,0)),new V3(1,1,1))]; }
function crGeometry(){
  const P={}, add=(part,mat,list)=>{ const p=P[part]||(P[part]={}); (p[mat]||(p[mat]=[])).push(...list); };
  const e=(...a)=>[crE(...a)], h=(...a)=>crHorn(...a);
  // hips, belly, ribcage: a hump over the shoulders, spikes down the spine
  add('pel','skin',[crE(0,-.02,0,.23,.2,.2),crE(.12,-.06,-.03,.13,.16,.15),crE(-.12,-.06,-.03,.13,.16,.15)]);
  add('pel','bone',h(new V3(0,-.03,.18),new V3(0,-.5,1),CRX,.5,.18,.035));
  add('abd','skin',e(0,.22,.02,.19,.25,.17));
  add('abd','bone',[...h(new V3(0,.1,.16),new V3(0,-.4,1),CRX,.55,.21,.036),...h(new V3(0,.28,.16),new V3(0,-.4,1),CRX,.55,.26,.042)]);
  add('tor','skin',[crE(0,.2,.05,.3,.32,.27),crE(.18,.33,-.02,.16,.17,.16),crE(-.18,.33,-.02,.16,.17,.16),crE(0,.28,-.12,.19,.17,.14)]);
  add('tor','bone',[...h(new V3(0,.04,.25),new V3(0,-.35,1),CRX,.6,.3,.05),...h(new V3(0,.16,.28),new V3(0,-.35,1),CRX,.6,.38,.056),...h(new V3(0,.29,.26),new V3(0,-.35,1),CRX,.6,.33,.05),
    ...h(new V3(.2,.36,.06),new V3(.5,-.3,1),CRX,.5,.27,.042),...h(new V3(-.2,.36,.06),new V3(-.5,-.3,1),CRX,.5,.27,.042)]);
  add('nek','skin',[crL([[-.05,0],[-.03,.12],[.08,.115],[.2,.09],[.25,0]])]);
  add('nek','bone',h(new V3(0,.06,.1),new V3(0,-.4,1),CRX,.5,.16,.032));
  // skull: cranium, long snout, brows, swept-back horns, glowing eyes, fangs; the jaw is its own part
  add('skl','skin',[crE(0,.06,.03,.12,.14,.11),crL([[.08,0],[.1,.085],[.2,.07],[.3,.045],[.335,0]],12,1,.7),crE(.09,.1,0,.05,.08,.05),crE(-.09,.1,0,.05,.08,.05),
    crE(.065,.135,.085,.055,.07,.035),crE(-.065,.135,.085,.055,.07,.035)]);
  for(const sd of [-1,1]) add('skl','bone',[...h(new V3(sd*.07,.04,.1),new V3(sd*.2,-1,.22),CRX,-.35,.48,.045,6),...h(new V3(sd*.11,.07,0),new V3(sd*.8,-.55,.15),CRX,.2,.17,.026)]);
  add('skl','bone',h(new V3(0,.25,.05),new V3(0,.3,1),CRX,.4,.075,.018));
  for(const sd of [-1,1]) for(let k=0;k<6;k++) add('skl','tooth',[crTooth(sd*(.058-.0055*k),.12+.035*k,-.04,k?.011:.017,k?.055:.1,-1)]);
  add('skl','eye',[crE(.072,.155,.055,.02,.018,.02),crE(-.072,.155,.055,.02,.018,.02)]);
  add('skl','maw',e(0,.2,-.035,.045,.1,.02));
  add('jaw','skin',[crL([[0,0],[.02,.065],[.12,.06],[.24,.032],[.27,0]],12,1,.5,new V3(0,0,-.02))]);
  for(const sd of [-1,1]) for(let k=0;k<5;k++) add('jaw','tooth',[crTooth(sd*(.05-.005*k),.06+.04*k,0,k?.01:.015,k?.05:.085,1)]);
  add('jaw','bone',h(new V3(0,.19,-.045),new V3(0,.3,-1),CRX,.3,.06,.015));
  // forelimbs: thick upper arm, long forearm with an elbow spur, a big hand with three hooked claws
  add('ua','skin',[crL([[-.04,0],[0,.11],[.09,.135],[.24,.12],[.44,.088],[.5,.08],[.54,0]])]);
  add('fa','skin',[crL([[-.05,0],[0,.095],[.1,.112],[.33,.082],[.58,.066],[.61,0]])]);
  add('fa','bone',[...h(new V3(0,.01,.07),new V3(0,-1,.7),CRX,.35,.21,.036),...h(new V3(0,.16,.08),new V3(0,-.5,1),CRX,.4,.1,.022),...h(new V3(0,.31,.07),new V3(0,-.5,1),CRX,.4,.08,.018)]);
  add('hd','skin',[crE(0,.08,0,.09,.12,.052),crE(0,.155,0,.1,.042,.05)]);
  for(const x of [-.058,0,.058]) add('hd','bone',h(new V3(x,.17,0),new V3(x*1.6,1,.1),CRX,-1.3,.33,.028,6));
  add('hd','bone',h(new V3(0,.03,-.03),new V3(0,-.3,-1),CRX,.3,.08,.015));
  // hind legs: muscular thigh, shin with a knee spike, metatarsus with a heel spur, clawed toes
  add('th','skin',[crL([[-.04,0],[0,.115],[.1,.135],[.24,.1],[.36,.07],[.39,0]])]);
  add('sh','skin',[crL([[-.03,0],[0,.075],[.12,.08],[.38,.045],[.4,0]])]);
  add('sh','bone',h(new V3(0,.02,.06),new V3(0,-.3,1),CRX,.3,.1,.022));
  add('mt','skin',[crL([[-.02,0],[0,.052],[.27,.036],[.29,0]])]);
  add('mt','bone',h(new V3(0,.01,-.04),new V3(0,-.5,-1),CRX,-.3,.1,.02));
  add('ft','skin',e(0,.03,.015,.06,.07,.032));
  for(const x of [-.035,0,.035]) add('ft','bone',h(new V3(x,.08,.01),new V3(x*1.5,1,.05),CRX,-1,.13,.017,4));
  // tail: segments with a spike each, and a bone blade at the tip
  add('tseg','skin',[crL([[-.03,0],[0,.085],[.08,.08],[.16,.07],[.185,0]])]);
  add('tseg','bone',h(new V3(0,.06,.07),new V3(0,-.6,1),CRX,.4,.09,.025));
  add('ttip','bone',[...h(new V3(0,0,0),new V3(0,1,.05),CRX,.25,.34,.055,6),...h(new V3(.02,.12,0),new V3(1,-.3,0),CRX,0,.1,.018,2),...h(new V3(-.02,.12,0),new V3(-1,-.3,0),CRX,0,.1,.018,2)]);
  for(const part in P){ CRG[part]={}; for(const m in P[part]) CRG[part][m]=mergeUV(P[part][m]); }
}

/* ---------- a Hellcrawler's model: one gear group per bone (batched with all the others) ---------- */
function crPart(name,s,k){
  const g=grp(), P=CRG[name];
  for(const m in P){ const ms=mesh(P[m],m==='skin'?CRM.skin:CRM[m]); if(m==='skin') ms.userData.skin=1; if(m==='eye'||m==='maw') ms.castShadow=false; g.add(ms); }
  g.scale.setScalar(s*(k||1)); freezeGear(g); return g; }
function buildCrawler(u,G){
  if(u.T.hound){ buildHound(u,G); return; }
  crInit(); const s=u.s;
  for(const n of ['pel','abd','tor','nek']) G['c_'+n]=crPart(n,s);
  G.c_skl=crPart('skl',s,CR_HEAD); G.c_jaw=crPart('jaw',s,CR_HEAD);
  for(const sd of ['L','R']) for(const n of ['ua','fa','hd','th','sh','mt','ft']) G['c_'+n+sd]=crPart(n,s);
  for(let i=0;i<CR_TN;i++) G['c_t'+i]=crPart('tseg',s,CR_TK[i]);
  G.c_tt=crPart('ttip',s,CR_TK[CR_TN]);
  crInitRig(u);
}
function crInitRig(u){
  const v=()=>new V3();
  const cr=u.cr={P:v(),M:v(),C:v(),N:v(),H:v(),f:v(),r:v(),rc:v(),n:new V3(0,1,0),d1:v(),d2:v(),hd:new V3(0,0,1),hu:new V3(0,1,0),aL:v(),aR:v(),
    tail:[],tailTip:v(),ph:Math.random(),hw:{R:0,L:0},lc:{R:null,L:null},jaw:0,wasAir:false};
  for(let i=0;i<=CR_TN;i++) cr.tail.push(v());
  u.paws=[0,1].map(()=>({pos:v(),from:v(),to:v(),t:-1,dur:.2,lift:.1,air:false}));
  crPlace(u);
}
function crLimbs(u){ return [u.feet[0],u.feet[1],u.paws[0],u.paws[1]]; }
function crHome(u,i,ahead,out){
  const s=u.s, sf=Math.sin(u.face), cf=Math.cos(u.face), h=CR_HOME[i], w=h[1]*(i>1?(u.T.foreW||.8):(u.T.hindW||1));   // fore paws: a hound plants them under its shoulders
  out.set(u.pos.x+(sf*h[0]+cf*w)*s+u.av.x*ahead,0,u.pos.z+(cf*h[0]-sf*w)*s+u.av.z*ahead); out.y=groundAt(u,out.x,out.z); return out; }
// put all four feet down where they belong and lay the tail out straight behind (spawning, teleports)
function crPlace(u){
  if(!u.cr) return; const L=crLimbs(u);
  for(let i=0;i<4;i++){ crHome(u,i,0,L[i].pos); L[i].t=-1; L[i].air=false; }
  const sf=Math.sin(u.face), cf=Math.cos(u.face), y=groundAt(u,u.pos.x,u.pos.z)+.66*u.s;
  u.cr.tail.forEach((p,i)=>p.set(u.pos.x-sf*(.6+i*.15)*u.s,y-i*.05*u.s,u.pos.z-cf*(.6+i*.15)*u.s));
  u.cr.wasAir=false; u.cr.hw.R=u.cr.hw.L=0;
}

/* ---------- pose ---------- */
function computeCrawlPose(u){
  const P=POSES.crawler, sp=clamp(u.spd/u.T.speed,0,1);
  let p=lerpPose(P.idle,P.move,smooth(sp));
  if(u.chg&&u.chgW>.002&&!u.action){ const C=CHG.crawler[u.chg.i], k=u.chgW, run=C.anim?Object.assign({},C.run,C.anim(game.time+u.id*.37,C.run)):C.run;
    for(const f of ['lean','crouch','draw','alt','side','look','twist']) if(run[f]!==undefined) p[f]+=(run[f]-p[f])*k; }
  if(u.routing&&!u.action){ p.lean+=.1; p.look=Math.sin(game.time*3+u.id)*.6; }
  const a=u.action; let w=0, cp=null;
  if(a){ cp=evalClip(a.c,a.t); w=a.c.loop?smooth(clamp(a.age/.12,0,1)):smooth(clamp(a.t/.12,0,1))*smooth(clamp((a.c.dur-a.t)/.26,0,1));
    p=lerpPose(p,cp,w); p.jump=cp.jump; p.yaw=wrapA(cp.yaw); p.kick=cp.kick*w; }
  u.crAW=w; u.crR=cp?cp.R:null; u.crL=cp?cp.L:null;
  if(!a||a.c.idle) p.draw=Math.max(p.draw,.06+.05*Math.sin(game.time*2.6+u.id));   // panting
  if(u.emerge){ const k=smooth(clamp(u.emerge.t/u.emerge.dur,0,1)); p.lean=lerp(-1.05,p.lean,k); p.draw=Math.max(p.draw,.9*(1-k)); p.crouch=0; }
  return p;
}

/* ---------- body frame from the pose channels (shared by the skeleton and the strike predictor) ---------- */
function crRot(out,f,pitch,yawOff){ const cy=Math.cos(yawOff), sy=Math.sin(yawOff), x=f.x*cy+f.z*sy, z=f.z*cy-f.x*sy, cp=Math.cos(pitch); return out.set(x*cp,Math.sin(pitch),z*cp); }
// a point in the shoulders' frame (x right, y up off the back, z along the spine), metres at scale 1
function crC(out,o,v,s){ return out.copy(o.C).addScaledVector(o.rc,v[0]*s).addScaledVector(o.n,v[1]*s).addScaledVector(o.d2,v[2]*s); }
const _cq4=new V3();
function crFrame(u,k,root,lean,side,o,hlag){
  const s=u.s, yaw=u.face+(k.yaw||0), tw=k.twist||0;
  o.f.set(Math.sin(yaw),0,Math.cos(yaw)); o.r.set(o.f.z,0,-o.f.x);
  const pitch=clamp(.32-lean,-.5,1.42), h=(CRB.hipH-k.crouch*.55+k.jump)*s;
  o.P.copy(root).addScaledVector(o.f,-.42*s); o.P.y=root.y+h;
  crRot(o.d1,o.f,pitch+.1,tw*.35); crRot(o.d2,o.f,pitch-.12,tw*.9);
  o.M.copy(o.P).addScaledVector(o.d1,CRB.pm*s);
  o.C.copy(o.M).addScaledVector(o.d2,CRB.mc*s);
  o.n.copy(UP).addScaledVector(o.d2,-o.d2.y).normalize();
  if(side) o.n.applyAxisAngle(o.d2,clamp(side,-1.2,1.2)*.55);
  o.rc.crossVectors(o.n,o.d2).normalize();
  if(side) o.C.addScaledVector(o.rc,clamp(side,-1,1)*.06*s);
  o.N.copy(o.C).addScaledVector(o.d2,.2*s).addScaledVector(o.n,.02*s);
  // the head hangs low and forward; rearing brings it level; the spring lag nods it on landings
  const hp=-.38+(lean<0?-lean*.6:-lean*.25)+(hlag||0)*.8;
  crRot(o.hd,o.f,hp,tw*1.1+(k.look||0));
  if(k.wL){ const v=k.wL; _cq4.set(0,0,0).addScaledVector(o.rc,v[0]).addScaledVector(o.n,v[1]).addScaledVector(o.d2,v[2]).normalize(); o.hd.lerp(_cq4,.85).normalize(); }
  o.hu.copy(UP).addScaledVector(o.hd,-o.hd.y); if(o.hu.lengthSq()<1e-6) o.hu.copy(o.n); o.hu.normalize();
  o.H.copy(o.N).addScaledVector(o.hd,.21*CR_HEAD*s).addScaledVector(o.hu,-.02*s);
}

/* ---------- skeleton ---------- */
const _cq1=new V3(),_cq2=new V3(),_cq3=new V3(),_cqp=new V3(),_cqh=new V3();
function buildCrawlSkel(u,p,dt){
  const s=u.s, j=u.j, cr=u.cr, k=150*tune.spring*tune.spring, c=2*Math.sqrt(k)*.62;
  const sp=clamp(u.spd/u.T.speed,0,1);
  spring(u.leanS,p.lean+clamp((u.accF||0)*.02,-.15,.2),k,c,dt);
  spring(u.headS,u.leanS.x,k*.5,c*.5,dt);
  spring(u.rsz,0,k*.9,c*.6,dt); spring(u.rsx,0,k*.9,c*.6,dt);
  spring(u.sideS,p.side+clamp((u.turnV||0)*-.08,-.3,.3),k,c,dt);
  const air=p.jump>.04;
  // at a gallop the spine flexes and the body bounds with every stride
  const gal=clamp((u.spd-3.2)/1.8,0,1), ph=cr.ph*Math.PI*2;
  const flex=gal*.13*Math.sin(ph), bob=air?0:(gal*.05*Math.sin(ph*2-.6)+(1-gal)*.012*Math.abs(Math.sin(ph*2)))*s;
  const breathe=Math.sin(game.time*2.6+u.id)*.008*s*(1-sp);
  const lean=u.leanS.x+u.rsz.x*.7+flex, side=u.sideS.x+u.rsx.x*.8;
  _cqp.set(u.pos.x,groundAt(u,u.pos.x,u.pos.z)+bob+breathe+(u.aimDy||0)*.5,u.pos.z);
  crFrame(u,p,_cqp,lean,side,cr,u.headS.x-u.leanS.x);
  j.pelvis.copy(cr.P); j.chest.copy(cr.C); j.neck.copy(cr.N); j.head.copy(cr.H);
  u.fwdW.copy(cr.f); u.rightW.copy(cr.r); u.spine.copy(cr.n);
  j.sR.copy(cr.C).addScaledVector(cr.rc,.19*s).addScaledVector(cr.n,-.1*s);
  j.sL.copy(cr.C).addScaledVector(cr.rc,-.19*s).addScaledVector(cr.n,-.1*s);
  _cq1.crossVectors(cr.d1,UP); if(_cq1.lengthSq()<1e-6) _cq1.copy(cr.r); _cq1.normalize().negate();
  j.hipR.copy(cr.P).addScaledVector(_cq1,.16*s).addScaledVector(UP,-.05*s);
  j.hipL.copy(cr.P).addScaledVector(_cq1,-.16*s).addScaledVector(UP,-.05*s);
  crGait(u,p,dt,air);
  // forelimbs: planted paws, unless a clip lifts the claw (blend weight per hand), tucked in a leap, lifted when reared
  const reach=(CRB.ua+CRB.fa)*s*.985;
  for(let i=0;i<2;i++){ const R=i===1, key=R?'R':'L', sd=R?1:-1, paw=u.paws[i], hand=R?u.hand.R:u.hand.L, clip=R?u.crR:u.crL;
    if(clip&&u.action) cr.lc[key]=clip;
    const tw=clip&&u.action?u.crAW:0; cr.hw[key]+=(tw-cr.hw[key])*(1-Math.exp(-dt*18)); const w=cr.hw[key];
    hand.copy(paw.pos); hand.y+=.03*s;
    if(air) hand.lerp(_cq2.copy(cr.C).addScaledVector(cr.d2,.44*s).addScaledVector(cr.n,-.34*s).addScaledVector(cr.rc,sd*.27*s),.85);
    const sh0=R?j.sR:j.sL, lift=u.emerge?0:clamp((sh0.distanceTo(paw.pos)-reach*.97)/(.3*s),0,1);   // reared out of reach: the paw comes up
    if(lift>0) hand.lerp(crC(_cq2,cr,[sd*.28,-.25,.42],s),lift*(1-w));
    if(w>.001&&cr.lc[key]){ crC(_cq2,cr,cr.lc[key],s); hand.lerp(_cq2,w); hand.addScaledVector(cr.n,Math.sin(Math.PI*w)*.1*s*(1-lift)); } }
  u.wRw.subVectors(u.hand.R,j.sR).normalize(); u.wLw.subVectors(u.hand.L,j.sL).normalize();
  if(u.aim) applyAim(u,dt,p);
  for(let i=0;i<2;i++){ const R=i===1, sd=R?1:-1, sh=R?j.sR:j.sL, hand=R?u.hand.R:u.hand.L, el=R?j.eR:j.eL, wr=R?j.hR:j.hL, pp=R?p.pR:p.pL;
    if(pp) crC(_cq2,cr,pp,s).sub(cr.C).add(sh); else _cq2.copy(sh).addScaledVector(cr.d2,-.95*s).addScaledVector(cr.rc,sd*(u.T.hound?.12:.3)*s).addScaledVector(cr.n,.2*s);   // elbows back along the body, only a little out (hounds tuck them in)
    ik2(sh,hand,CRB.ua*s,CRB.fa*s,_cq2,el,wr);
    const w=cr.hw[R?'R':'L'], cw=R?u.wRw:u.wLw;
    _cq3.subVectors(wr,el).normalize();
    // planted, the claws spread forward along the ground; striking, they carry on from the forearm
    cw.copy(_cq3).multiplyScalar(.45+.55*w).addScaledVector(cr.f,.55*(1-w)).addScaledVector(UP,-.2*(1-w)).normalize(); }
  // hind legs: digitigrade; + kick = right leg kicks forward, - kick = both buck backward
  const kk=p.kick||0;
  for(let i=0;i<2;i++){ const R=i===1, sd=R?1:-1, hip=R?j.hipR:j.hipL, ft=u.feet[i], kn=R?j.kR:j.kL, toe=R?j.fR:j.fL, ank=R?cr.aR:cr.aL;
    toe.copy(ft.pos); toe.y+=.02*s;
    if(air) toe.lerp(_cq2.copy(hip).addScaledVector(cr.f,-.32*s).addScaledVector(UP,-.42*s).addScaledVector(cr.r,sd*.06*s),.8);
    const kw=kk>0?(R?kk:0):-kk;
    if(kw>0){ if(kk>0) _cq2.copy(hip).addScaledVector(cr.f,.72*s).addScaledVector(UP,.05*s); else _cq2.copy(hip).addScaledVector(cr.f,-.8*s).addScaledVector(UP,.14*s).addScaledVector(cr.r,sd*.08*s);
      toe.lerp(_cq2,clamp(kw,0,1)); if(u.aim&&u.aim.by==='foot') toe.lerp(u.aim.T,u.aim.w*clamp(kw,0,1)); }
    _cq3.copy(cr.f).multiplyScalar(-Math.cos(CRB.metaA)).addScaledVector(UP,Math.sin(CRB.metaA));
    if(kw>0){ _cq1.subVectors(hip,toe).normalize(); _cq3.lerp(_cq1,clamp(kw,0,1)).normalize(); }
    _cq2.copy(toe).addScaledVector(_cq3,CRB.mt*s);
    _cqh.copy(hip).addScaledVector(cr.f,(kk<0?-.2:.7)*s).addScaledVector(UP,-.25*s).addScaledVector(cr.r,sd*.15*s);
    ik2(hip,_cq2,CRB.th*s,CRB.sh*s,_cqh,kn,ank);
    _cq1.subVectors(toe,ank); const L=_cq1.length(); if(L>1e-5) toe.copy(ank).addScaledVector(_cq1,CRB.mt*s/L); }
  cr.jaw+=(clamp(p.draw,0,1)-cr.jaw)*(1-Math.exp(-dt*25));
  crTailStep(u,p,dt,true);
}

/* ---------- gait: walk (lateral sequence) → trot (diagonal pairs) → gallop (bounding), feet stay planted ---------- */
const CR_OFF={walk:[0,.5,.25,.75],trot:[0,.5,.53,.03],gal:[.48,.58,0,.1]};   // phase offsets: hindL, hindR, foreL, foreR
const _cg1=new V3();
function crGait(u,p,dt,air){
  const s=u.s, cr=u.cr, v=u.spd, L=crLimbs(u), src=[u.j.fL,u.j.fR,u.j.hL,u.j.hR];
  if(air){ for(const l of L){ l.air=true; l.t=-1; } cr.wasAir=true; return; }
  if(cr.wasAir){ cr.wasAir=false; for(let i=0;i<4;i++){ const l=L[i]; l.air=false; l.t=-1; l.pos.set(src[i].x,0,src[i].z); l.pos.y=groundAt(u,l.pos.x,l.pos.z); }
    puff(u.pos,3,.25*s,1.4,'#7d6d5c'); }
  if(u.emerge) return;   // claws hooked over the rim while it hauls itself out
  const wW=clamp(1-(v-.8)/1.4,0,1), wG=clamp((v-3.4)/1.4,0,1), wT=Math.max(0,1-wW-wG);
  const duty=.7*wW+.5*wT+.36*wG, SL=clamp(.5+v*.17,.5,1.4)*s, freq=v>.3?v/SL:0;
  const prev=cr.ph; cr.ph+=freq*dt; if(cr.ph>1e4) cr.ph-=1e4;
  let swinging=0; for(const l of L) if(l.t>=0) swinging++;
  for(let i=0;i<4;i++){ const l=L[i], fore=i>1;
    if(l.t>=0){
      l.t+=dt/l.dur;
      crHome(u,i,Math.max(0,l.dur*(1-l.t))+(freq?duty/freq*.5:0),_cg1); clampOffset(_cg1,u.pos,.85*s);
      l.to.lerp(_cg1,1-Math.exp(-dt*20));
      const tt=Math.min(l.t,1), e=EASE.io(tt);
      l.pos.x=lerp(l.from.x,l.to.x,e); l.pos.z=lerp(l.from.z,l.to.z,e);
      l.pos.y=groundAt(u,l.pos.x,l.pos.z)+l.lift*Math.sin(Math.PI*Math.pow(tt,.85));
      if(l.t>=1){ l.t=-1; l.pos.y=groundAt(u,l.pos.x,l.pos.z); if(v>3.6&&fore&&Math.random()<.3) puff(l.pos,1,.14*s,.8,'#8a7a66'); }
      continue; }
    if(fore?cr.hw[i===2?'L':'R']>.3:((p.kick>.05&&i===1)||p.kick<-.05)) continue;   // this limb is busy striking
    let cx=0,cz=0; for(const [w,O] of [[wW,CR_OFF.walk],[wT,CR_OFF.trot],[wG,CR_OFF.gal]]){ if(w<=0) continue; const a=O[i]*Math.PI*2; cx+=Math.cos(a)*w; cz+=Math.sin(a)*w; }
    const off=Math.atan2(cz,cx)/(Math.PI*2), phi=((cr.ph+off)%1+1)%1, pphi=((prev+off)%1+1)%1;
    const crossed=freq>0&&(pphi<=phi?(pphi<duty&&phi>=duty):(phi>=duty||pphi<duty));
    crHome(u,i,freq?duty/freq*.5:0,_cg1);
    const err=Math.hypot(l.pos.x-_cg1.x,l.pos.z-_cg1.z), lazy=err>(v<.3?.17:.62)*s&&swinging<2;
    if((crossed&&err>.04*s)||lazy){
      l.from.copy(l.pos); l.t=0; l.dur=(freq&&!lazy?clamp((1-duty)/freq,.07,.3):.16)*Math.sqrt(s);
      l.lift=Math.min(.32,(fore?.13:.1)+.025*v)*s; crHome(u,i,l.dur+(freq?duty/freq*.5:0),l.to); clampOffset(l.to,u.pos,.85*s); swinging++; }
  }
}

/* ---------- tail: trails behind with lag; alt swings it over the back, twist and the gait sway it ---------- */
const _ct1=new V3(),_ct2=new V3(),_ct3=new V3();
function crTailStep(u,p,dt,alive){
  const cr=u.cr, s=u.s, T=cr.tail, n=T.length-1;
  if(alive){ _ct1.set(-cr.f.x,0,-cr.f.z); _ct3.copy(T[0]); T[0].copy(u.j.pelvis).addScaledVector(cr.d1,-.13*s).addScaledVector(UP,.06*s);
    // the tail rides along with most of the body's movement, so running only sweeps the curl back a little
    _ct3.subVectors(T[0],_ct3); if(_ct3.lengthSq()<.25) for(let i=1;i<=n;i++) T[i].addScaledVector(_ct3,.85); }
  else { _ct1.subVectors(u.j.pelvis,u.j.chest); _ct1.y=0; if(_ct1.lengthSq()<1e-6) _ct1.set(-u.fwdW.x,0,-u.fwdW.z); _ct1.normalize(); T[0].copy(u.j.pelvis).addScaledVector(_ct1,.12*s); }
  const al=alive?clamp((p.alt||0)+(u.T.tailLow||0),-1,1.4):0, tw=alive?(p.twist||0):0, alw=clamp(al,0,1);
  const sw=alive?Math.sin(game.time*2.3+u.id)*(.1+.16*(1-clamp(u.spd/u.T.speed,0,1))):0;
  for(let i=1;i<=n;i++){
    const fi=crTi(i), L=CR_TL*CR_TK[i-1]*s*(u.T.tailL||1), th=alive?crTh(fi,al):-.25, ps=alive?(-tw*1.1*(1-alw)+sw*i/n):0;
    crRot(_ct2,_ct1,th,ps); _ct3.copy(T[i-1]).addScaledVector(_ct2,L);
    const rate=alive?(al>.05?42:16-fi*.9):3;
    T[i].lerp(_ct3,1-Math.exp(-dt*rate));
    _ct2.subVectors(T[i],T[i-1]); const d=_ct2.length(); if(d>1e-6) T[i].copy(T[i-1]).addScaledVector(_ct2,L/d); else T[i].copy(_ct3);
    const g=groundAt(u,T[i].x,T[i].z)+.06*s*CR_TK[Math.min(i,CR_TN)]; if(T[i].y<g) T[i].y=g; }
  _ct2.subVectors(T[n],T[n-1]).normalize(); cr.tailTip.copy(T[n]).addScaledVector(_ct2,.3*s*CR_TK[CR_TN]);
}

/* ---------- dead: the ragdoll moves the main joints; the rest follows from them ---------- */
const _cd1=new V3();
function crDeadRig(u){
  const cr=u.cr, j=u.j, s=u.s;
  _cd1.subVectors(j.chest,j.pelvis); const L=_cd1.length()||1; _cd1.multiplyScalar(1/L);
  cr.n.copy(UP).addScaledVector(_cd1,-_cd1.y); if(cr.n.lengthSq()<1e-4) cr.n.copy(u.fwdW); cr.n.normalize();
  cr.M.copy(j.pelvis).addScaledVector(_cd1,L*.52).addScaledVector(cr.n,.04*s);
  cr.f.set(_cd1.x,0,_cd1.z); if(cr.f.lengthSq()<1e-4) cr.f.copy(u.fwdW); cr.f.y=0; cr.f.normalize(); cr.r.set(cr.f.z,0,-cr.f.x);
  cr.d1.copy(_cd1); cr.d2.copy(_cd1); cr.rc.crossVectors(cr.n,_cd1); if(cr.rc.lengthSq()<1e-6) cr.rc.copy(cr.r); cr.rc.normalize();
  j.sR.copy(j.chest).addScaledVector(cr.rc,.19*s); j.sL.copy(j.chest).addScaledVector(cr.rc,-.19*s);
  j.hipR.copy(j.pelvis).addScaledVector(cr.rc,.16*s); j.hipL.copy(j.pelvis).addScaledVector(cr.rc,-.16*s);
  if(!u.decapped){ cr.hd.subVectors(j.head,j.neck); if(cr.hd.lengthSq()<1e-6) cr.hd.copy(cr.f); cr.hd.normalize();
    cr.hu.copy(UP).addScaledVector(cr.hd,-cr.hd.y); if(cr.hu.lengthSq()<1e-6) cr.hu.copy(cr.n); cr.hu.normalize(); }
  cr.jaw+=(.55-cr.jaw)*.08;
  cr.aL.copy(j.kL).lerp(j.fL,.6).addScaledVector(UP,.1*s); cr.aR.copy(j.kR).lerp(j.fR,.6).addScaledVector(UP,.1*s);
  u.wRw.subVectors(j.hR,j.eR).normalize(); u.wLw.subVectors(j.hL,j.eL).normalize();
  crTailStep(u,null,1/60,false);
}

/* ---------- place every part on its bone ---------- */
const _cm1=new V3(),_cm2=new V3(),_cm3=new V3(),_cm4=new V3();
function updateCrawlerModel(u){
  const G=u.G, cr=u.cr, j=u.j, s=u.s; if(!G||!cr||!G.c_pel) return;
  if(!u.alive) crDeadRig(u);
  orient(G.c_pel,j.pelvis,_cm1.subVectors(cr.M,j.pelvis),cr.n);
  orient(G.c_abd,j.pelvis,_cm1,cr.n);
  orient(G.c_tor,cr.M,_cm1.subVectors(j.chest,cr.M),cr.n);
  orient(G.c_nek,j.chest,_cm1.subVectors(j.neck,j.chest),cr.n);
  // skull at the neck (or riding the severed head), jaw hinged under it and dropping open
  if(u.decapped&&!u.alive) _cm4.copy(j.head).addScaledVector(cr.hd,-.21*CR_HEAD*s); else _cm4.copy(j.neck);
  orient(G.c_skl,_cm4,cr.hd,cr.hu);
  _cm2.crossVectors(cr.hd,cr.hu).normalize(); const ja=.06+cr.jaw*.8;
  _cm1.copy(cr.hd).applyAxisAngle(_cm2,-ja); _cm3.copy(cr.hu).applyAxisAngle(_cm2,-ja);
  orient(G.c_jaw,_cm4.addScaledVector(cr.hd,.05*CR_HEAD*s).addScaledVector(cr.hu,-.045*CR_HEAD*s),_cm1,_cm3);
  for(const X of ['L','R']){ const sh=j['s'+X], el=j['e'+X], wr=j['h'+X];
    orient(G['c_ua'+X],sh,_cm1.subVectors(el,sh),cr.n);
    orient(G['c_fa'+X],el,_cm1.subVectors(wr,el),UP);
    orient(G['c_hd'+X],wr,X==='R'?u.wRw:u.wLw,UP);
    const hip=j['hip'+X], kn=j['k'+X], an=cr['a'+X], toe=j['f'+X];
    orient(G['c_th'+X],hip,_cm1.subVectors(kn,hip),cr.f);
    orient(G['c_sh'+X],kn,_cm1.subVectors(an,kn),cr.f);
    orient(G['c_mt'+X],an,_cm1.subVectors(toe,an),cr.f);
    _cm2.subVectors(toe,an); _cm2.y=Math.min(0,_cm2.y)*.3; _cm2.addScaledVector(cr.f,.15*s); if(_cm2.lengthSq()<1e-8) _cm2.copy(cr.f);
    orient(G['c_ft'+X],toe,_cm2,UP); }
  const T=cr.tail;
  for(let i=0;i<CR_TN;i++) orient(G['c_t'+i],T[i],_cm1.subVectors(T[i+1],T[i]),UP);
  orient(G.c_tt,T[CR_TN],_cm1.subVectors(T[CR_TN],T[CR_TN-1]),UP);
  if(u.T.hound) houndModel(u);
}
function crSetHot(u,hot){ if(!!u.crHot===hot) return; u.crHot=hot; const G=u.G; if(!G) return;
  for(const k in G){ const g=G[k]; if(g&&g.isObject3D) for(const c of g.children) if(c.userData.skin) c.material=hot?CRM.hot:CRM.skin; } }

/* ---------- the strike predictor used by motion warping (same frame as the skeleton, no gait) ---------- */
const _cpo={P:new V3(),M:new V3(),C:new V3(),N:new V3(),H:new V3(),f:new V3(),r:new V3(),rc:new V3(),n:new V3(),d1:new V3(),d2:new V3(),hd:new V3(),hu:new V3()};
const _cpr=new V3(),_cps=new V3();
function crPredict(u,c,te,by,root,out){
  const k=evalClip(c,te), s=u.s;
  const ln=u.leanS?k.lean+(u.leanS.x-k.lean)*Math.exp(-Math.max(0,te-(u.action?u.action.t:0))/.13):k.lean;
  crFrame(u,k,root,ln,k.side,_cpo,0);
  if(by==='head'){ _pS.copy(_cpo.N); _pReach=.01; out.copy(_cpo.H); _pH.copy(out); return out; }
  if(by==='tail'){ const al=clamp(k.alt||0,-1,1.4); _cpr.set(-_cpo.f.x,0,-_cpo.f.z); out.copy(_cpo.P).addScaledVector(_cpo.d1,-.13*s).addScaledVector(UP,.06*s);
    for(let i=1;i<=CR_TN;i++){ const fi=crTi(i); crRot(_cps,_cpr,crTh(fi,al),-(k.twist||0)*1.1*(1-clamp(al,0,1))); out.addScaledVector(_cps,CR_TL*CR_TK[i-1]*s); }
    out.addScaledVector(_cps,.3*s*CR_TK[CR_TN]); _pS.copy(_cpo.P); _pReach=.01; _pH.copy(out); return out; }
  if(by==='foot'){ _cps.copy(_cpo.P).addScaledVector(_cpo.r,.16*s);
    if(k.kick<0) out.copy(_cps).addScaledVector(_cpo.f,-.8*s).addScaledVector(UP,.14*s); else out.copy(_cps).addScaledVector(_cpo.f,.72*s).addScaledVector(UP,.05*s);
    _pS.copy(_cps); _pReach=(CRB.th+CRB.sh+CRB.mt)*s; _pH.copy(out); return out; }
  const R=by!=='hL', v=(R?k.R:k.L)||[R?.45:-.45,-.85,.35], reach=(CRB.ua+CRB.fa)*s*.985;
  _cps.copy(_cpo.C).addScaledVector(_cpo.rc,(R?.19:-.19)*s).addScaledVector(_cpo.n,-.1*s);
  crC(out,_cpo,v,s); _cpr.subVectors(out,_cps); const dl=_cpr.length(); if(dl>reach) out.copy(_cps).addScaledVector(_cpr,reach/dl);
  _pS.copy(_cps); _pH.copy(out); _pReach=reach;
  if(by==='hL') return out;
  const W=AIMW.crawler; _cpr.subVectors(out,_cps).normalize();
  return out.addScaledVector(_cpr,(by==='tip'?(u.fin?W.tip:W.hit):W.blade[1]*.88)*s);
}
AIMW.crawler={tip:.28,hit:.26,blade:[.05,.3],pommel:0,r:.02};

/* ---------- behaviour: pounces, Pack Frenzy, knocking the light troops flat ---------- */
// Pack Frenzy: every other Hellcrawler already on the same enemy speeds this one's claws up (to +54%)
function packFrenzy(u,t){
  let n=0; gridEach(t.pos.x,t.pos.z,3.2,o=>{ if(o!==u&&o.alive&&o.T.swarm&&o.team===u.team&&o.target===t) n++; });
  const lvl=Math.min(3,n); u.frenzy=lvl; if(!lvl) return;
  if(u.action) u.action.sp=1+.18*lvl; u.cdT/=1+.25*lvl; u.frenzyT=1.6;
  if(lvl>=2&&(u.frCall||0)<game.time&&Math.random()<.2){ u.frCall=game.time+8; callout(u,'Pack Frenzy','#ff7a2a'); }
}
const LIGHT={archer:1,wizard:1,cleric:1,miner:1};
function knockDown(t,u){
  if(!t.alive||!t.isUnit||t.fin||t.state==='stunned'||t.fl||!LIGHT[t.type]||t.invuln) return;
  play(t,'knockdown'); t.fwdScale=1; t.defQ=null; t.cdT=Math.max(t.cdT,1.4); t.atkTarget=null;
  const dx=t.pos.x-u.pos.x, dz=t.pos.z-u.pos.z; t.faceGoal=t.face=Math.atan2(-dx,-dz);
  puff(t.pos,4,.3,1.6,'#9a8a74'); shakeAt(t.pos,.08);
}
TYPES.crawler.pick=(u,t)=>{
  const d=t?Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z):9, L=['crClawR','crClawL','crClawR','crClawL','crRake','crBite','crBite','crRearSlash','crRaptorKick','crBuck','crTailStrike','crFlurry','crGore'];
  if(!t||!t.isUnit) return pickOf(['crClawR','crClawL','crRake','crBite','crGore']);
  // crowded: the tail sweeps everyone around it
  if(enemiesNear(u.team,u.pos.x,u.pos.z,2.4)>=3&&(u.cdSweep||0)<game.time&&Math.random()<.5){ u.cdSweep=game.time+5; return 'crTailSweep'; }
  let n,g=0; do{ n=pickOf(L); }while(n===u.lastAtk&&++g<5); return n;
};
TYPES.crawler.brain=(u,dt)=>{
  if(u.routing||!u.target||!u.target.alive||!u.target.isUnit||u.action||u.cdT>0||u.state!=='ok') return false;
  const t=u.target, dx=t.pos.x-u.pos.x, dz=t.pos.z-u.pos.z, d=Math.hypot(dx,dz);
  // the signature move: a leap from a few strides out that closes the gap in one bound
  if(d>2.9&&d<5.6&&(u.cdPounce||0)<game.time&&canTarget(u,t)&&Math.abs(wrapA(Math.atan2(dx,dz)-u.face))<.3&&!t.fl){
    u.cdPounce=game.time+rand(3.5,6); u.faceGoal=Math.atan2(dx,dz); startAttack(u,t,'crPounce'); return true; }
  return false;
};
// sounds: claws rake, jaws snap, kicks thud, the tail cracks; falls back to the stock sounds until the recordings load
function crSfx(name,fb,pos,vol){ const S=audio.bank&&audio.bank[name]; if(S&&S.v&&S.v.length) sfx(name,pos,vol); else if(fb) sfx(fb,pos,vol); }
function crHitSfx(u,e,at,vol){
  const by=e&&e.aim?e.aim[0]:null;
  if(by==='head'||e&&e.bite) crSfx('crBite','stab',at,vol); else if(by==='foot') sfx('punch',at,vol); else if(by==='tail'||e&&e.tail) crSfx('crTail','blunt',at,vol); else crSfx('crClaw','slash',at,vol);
}
Object.assign(EXTRA_EV,{
  hiss:(u)=>crSfx('crHiss',null,u.j.head,.7),
  screech:(u)=>crSfx('crScreech',null,u.j.head,.8),
  gore:(u,e,fin)=>{ const rg=fin&&(fin.rag||fin.rag2); const p=u.j.head; bleed(p.clone(),u.cr.hd.clone().setY(.3).normalize(),7,2.2,.5); crSfx('crBite','stab',p,.8); if(rg){ for(const v of rg.v) v.add(_cd1.set(rand(-1,1),rand(0,1),rand(-1,1))); wakeRag(rg); } },
});
// per-frame upkeep: frenzy glow, climbing out of the Hellpit, now and then a hiss
function crawlerTick(u,dt){
  if(u.frenzyT>0) u.frenzyT-=dt;
  crSetHot(u,u.frenzyT>0||!!u.emerge);
  const E=u.emerge;
  if(E){ E.t+=dt; const k=clamp(E.t/E.dur,0,1); u.gy=lerp(E.y0,E.yg,EASE.o(k));
    if(Math.random()<dt*14) puff(_cd1.set(u.pos.x+rand(-.8,.8),E.yg+.1,u.pos.z+rand(-.8,.8)),1,.25,1.6,Math.random()<.5?'#ff7a2a':'#3a302a');
    if(k>=1){ delete u.gy; u.emerge=null; u.emerging=false; for(const l of crLimbs(u)){ l.pos.y=groundAt(u,l.pos.x,l.pos.z); l.t=-1; }
      if(u.script) u.script.speed=u.T.speed*.85; } }
  u.hissT=(u.hissT===undefined?rand(4,14):u.hissT)-dt;
  if(u.hissT<=0){ u.hissT=rand(6,16); if(u.target&&Math.random()<.6) crSfx(Math.random()<.5?'crHiss':'crScreech',null,u.j.head,.45); }
}
// drawn only when on screen: pose the model (one gear group per bone) and light the eyes; off screen its groups are hidden
const crFrustum=new THREE.Frustum(), _cpm=new THREE.Matrix4(), _csph=new THREE.Sphere();
let crFrustumF=-1, crForce=false;
function crInView(u){
  if(crForce) return true;
  if(crFrustumF!==draw.frame){ crFrustumF=draw.frame; camera.updateMatrixWorld(); _cpm.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse); crFrustum.setFromProjectionMatrix(_cpm); }
  _csph.center.copy(u.alive?u.pos:u.j.pelvis); _csph.radius=2.6*u.s; return crFrustum.intersectsSphere(_csph);
}
function crPrep(u){
  if(!u.cr||!u.G) return; const vis=crInView(u);
  if(vis!==u.crVis){ u.crVis=vis; for(const k in u.G){ const g=u.G[k]; if(g&&g.isObject3D) g.visible=vis; } }
  if(vis) updateCrawlerModel(u);
}
// the eyes burn through the dark
const _ce=new V3();
function drawCrawlerFx(u){
  if(!u.alive||!u.cr) return;
  const cr=u.cr, s=u.s, hr=_cm2.crossVectors(cr.hd,cr.hu).normalize();
  const k=CR_HEAD*s; for(const sd of [-1,1]){ _ce.copy(u.j.neck).addScaledVector(cr.hd,.16*k).addScaledVector(cr.hu,.058*k).addScaledVector(hr,sd*.075*k); glowAt(_ce,.032*k,u.crHot?'#ffb040':'#ff8a2a'); }
  if(u.T.hound) houndFx(u);
}
