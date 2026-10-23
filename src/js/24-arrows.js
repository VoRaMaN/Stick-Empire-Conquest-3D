/* ---------------- arrows: instanced, they stick where they land ---------------- */
// Arrow buffers grow with the battle (512 → 1024 → 2048 …) so every arrow in flight, in a body, a shield or the
// ground is drawn; MAXAR is only a safety ceiling that a real battle never reaches.
const MAXAR=6000, AR_GEO=[GEO.aShaft,GEO.aTip,GEO.aFl], AR_MAT=[M.wood,M.steel,new THREE.MeshLambertMaterial({color:'#ffffff'})];
let arIM=[], arCap=0;
function growArrows(cap){
  for(const im of arIM){ scene.remove(im); if(im.dispose) im.dispose(); }
  arIM=AR_GEO.map((g,k)=>{ const im=new THREE.InstancedMesh(g,AR_MAT[k],cap);
    if(k===2) for(let i=0;i<cap;i++) im.setColorAt(i,WHITE);   // before count=0 (colour buffer is sized from .count)
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled=false; im.castShadow=true; im.count=0; scene.add(im); return im; });
  arCap=cap;
}
growArrows(512);
// body parts an arrow can lodge in: [from, to, radius at scale 1]
const SEGS=[['pelvis','chest',.11],['chest','neck',.1],['neck','head',.19],['sR','eR',.06],['eR','hR',.055],['sL','eL',.06],['eL','hL',.055],['hipR','kR',.07],['kR','fR',.06],['hipL','kL',.07],['kL','fL',.06]];
const _fa=new V3(),_fr=new V3(),_fs=new V3(),_ap=new V3(),_ad=new V3(),_ao=new V3(),_mi=new THREE.Matrix4(),_qa=new THREE.Quaternion();
function segFrame(u,sg){ const a=u.j[sg[0]], b=u.j[sg[1]]; _fa.subVectors(b,a); if(_fa.lengthSq()<1e-8) _fa.copy(u.spine); _fa.normalize();
  _fr.copy(u.fwdW).addScaledVector(_fa,-u.fwdW.dot(_fa)); if(_fr.lengthSq()<1e-6){ _fr.copy(u.rightW).addScaledVector(_fa,-u.rightW.dot(_fa)); } _fr.normalize(); _fs.crossVectors(_fa,_fr); }
const fromFrame=(out,c)=>out.set(0,0,0).addScaledVector(_fa,c[0]).addScaledVector(_fr,c[1]).addScaledVector(_fs,c[2]);
const toFrame=v=>[v.dot(_fa),v.dot(_fr),v.dot(_fs)];
function stickInBody(a,u,dir){
  const tip=_ap.copy(a.p).addScaledVector(dir,.44*a.s);
  let best=SEGS[0],bd=1e9,bt=0;
  for(const sg of SEGS){ const A=u.j[sg[0]],B=u.j[sg[1]]; _d.subVectors(B,A); const L2=_d.lengthSq(), t=L2<1e-8?0:clamp(_tmp.subVectors(tip,A).dot(_d)/L2,0,1);
    const d=_tmp.copy(A).addScaledVector(_d,t).distanceTo(tip)-sg[2]*u.s; if(d<bd){bd=d;best=sg;bt=sg[0]==='neck'?1:t;} }
  segFrame(u,best);
  const off=_ao.copy(dir).multiplyScalar(-best[2]*u.s*.8);
  a.mode='body'; a.u=u; a.seg=best; a.t=bt; a.off=toFrame(off); a.dc=toFrame(dir); a.age=0; a.ck=null; sfx('arrowHit',a.p,.9);
  (u.arrows=u.arrows||[]).push(a); if(u.arrows.length>10) u.arrows.shift().remove=true;
  placeArrow(a); return a.p;
}
function placeArrow(a){
  if(a.mode==='body'){ const u=a.u, A=u.j[a.seg[0]], B=u.j[a.seg[1]], k=a.ck;
    if(k&&k[0]===A.x&&k[1]===A.y&&k[2]===A.z&&k[3]===B.x&&k[4]===B.y&&k[5]===B.z) return;   // body hasn't moved (a corpse at rest)
    segFrame(u,a.seg); const C=_ap.copy(A).lerp(B,a.t);
    fromFrame(_ad,a.dc); C.add(fromFrame(_ao,a.off)); a.dir.copy(_ad); a.p.copy(C).addScaledVector(_ad,-(.44-.13)*a.s);
    const c=a.ck||(a.ck=[0,0,0,0,0,0]); c[0]=A.x; c[1]=A.y; c[2]=A.z; c[3]=B.x; c[4]=B.y; c[5]=B.z; }
  else if(a.mode==='shield'){ a.p.copy(a.lp).applyMatrix4(a.g.matrixWorld); a.dir.copy(a.ld).transformDirection(a.g.matrixWorld); }
}
// Spartan aspis: an arrow crossing the shield face from the front lodges in it
const _sn=new V3(),_sc=new V3(),_t0=new V3(),_t1=new V3();
function hitShield(a,t,prev){
  const g=t.G.o; _sn.set(0,0,1).applyQuaternion(g.quaternion); _sc.copy(g.position);
  _t0.copy(prev).addScaledVector(a.dir,.44*a.s); _t1.copy(a.p).addScaledVector(a.dir,.44*a.s);
  const d0=_t0.sub(_sc).dot(_sn), d1=_t1.sub(_sc).dot(_sn);
  if(!(d0>0&&d1<=0)) return false;
  const k=d0/(d0-d1); const X=_t0.copy(prev).lerp(a.p,k).addScaledVector(a.dir,.44*a.s);
  if(X.distanceTo(_sc)>.5*t.s) return false;
  g.updateMatrixWorld(); _mi.copy(g.matrixWorld).invert();
  const center=X.clone().addScaledVector(a.dir,-(.44-.07)*a.s);
  a.mode='shield'; a.g=g; a.lp=center.applyMatrix4(_mi); a.ld=a.dir.clone().transformDirection(_mi); a.age=0; sfx('arrowShield',a.p,.9);
  puff(X,4,.05,2.6,'#ffe9a8'); react(t,a.dir,.5); return true;
}
// Flight time of an arrow loosed at a target dist metres away. Close in it flies flat and fast, as before; past
// ~18 m the archer looses it high, like a real volley, so it climbs and drops onto the target (75 m: about 3.4 s
// in the air and 20 m up at the top of the arc). Lobbed shots go at least that high; power shots stay flatter.
function arrowT(dist,opt){ opt=opt||{};
  const far=RL.on&&dist>18?Math.min(3.8,.75+(dist-18)*.047):0;   // Riverlands' long bows; the classic field keeps its flat shots exactly
  if(opt.lob) return Math.max(clamp(dist/11,.5,1.7),far);
  if(opt.power) return far?Math.max(clamp(dist/40,.1,.6),far*.6):clamp(dist/40,.1,.6);
  return far||clamp(dist/24,.16,1.05); }
function fireArrow(u,aim,dmg,special,opt){
  opt=opt||{};
  const o=opt.from?opt.from.clone():u.j.hL.clone().addScaledVector(u.fwdW,.1*u.s);
  const G=14, dist=o.distanceTo(aim), T=special?.06:arrowT(dist,opt);
  const v=aim.clone().sub(o).multiplyScalar(1/T); v.y+=.5*G*T;
  arrows.push({mode:'fly',p:o,v,dir:v.clone().normalize(),s:u.s,col:TEAM[u.team].acc2.color,team:u.team,dmg,src:u,age:0,special,G,power:!!opt.power,fire:!!opt.fire}); onArrow(u);
  if(arrows.length>MAXAR){ const i=arrows.findIndex(x=>x.mode==='fixed'&&!x.remove); if(i>=0) arrows[i].remove=true; }   // safety ceiling only
}
const _prev=new V3(),_tmp3=new V3();
const _near=[];
function updateArrows(dt){
  for(let i=arrows.length-1;i>=0;i--){
    const a=arrows[i]; a.age+=dt;
    if(a.remove||(a.mode==='shield'&&a.g.gone)||(a.mode==='fixed'&&a.ttl&&a.age>a.ttl)){ arrows.splice(i,1); continue; }
    if(a.mode!=='fly') continue;
    _prev.copy(a.p); a.v.y-=a.G*dt; a.p.addScaledVector(a.v,dt); a.dir.copy(a.v).normalize();
    if(a.special){ const rg=a.special.rag, P=rg.p[1];
      if(a.p.distanceTo(P)<.45*rg.s||a.age>.4){ for(const v of rg.v) v.addScaledVector(a.dir,2.5); rg.v[1].addScaledVector(a.dir,5); wakeRag(rg);
        a.p.copy(P).addScaledVector(a.dir,-.35*a.s); stickInBody(a,rg.u,a.dir.clone()); bleed(P,a.dir,9,2.6); puff(P,3,.15,2,'#f1e6cf'); shakeAt(P,.12); a.special=null; }
      continue; }
    if(castleBlocks(a.p)){ a.mode='fixed'; a.ttl=24; a.age=0; a.p.addScaledVector(a.dir,-.25*a.s); sfx('arrowShield',a.p,.5); puff(a.p,2,.06,1.2,'#bdb3a2'); continue; }   // into a castle wall
    let done=false;
    if(!a.dead){ _near.length=0; gridEach(a.p.x,a.p.z,5,o=>{ _near.push(o); }); }
    if(!a.dead) for(const t of _near){ if(!t.alive||t.team===a.team||t.invuln&&t.state==='stunned') continue;
      if(Math.abs(t.pos.x-a.p.x)>2*t.s||Math.abs(t.pos.z-a.p.z)>2*t.s) continue;
      if(t.type==='spear'&&t.G&&t.G.o&&!t.G.o.dropped&&hitShield(a,t,_prev)){ done=true; break; }
      const tip=_tmp2.copy(a.p).addScaledVector(a.dir,.4*a.s);
      const d=Math.min(distSeg(tip,t.j.pelvis,t.j.head),distSeg(tip,t.j.pelvis,_tmp3.copy(t.j.fL).lerp(t.j.fR,.5))+.04*t.s);
      if(d<.24*t.s){
        const nm=t.action&&t.action.c.name; if(nm==='dodge') continue;
        const sp=Math.hypot(a.v.x,a.v.z)||1, head=(a.v.x*t.fwdW.x+a.v.z*t.fwdW.z)/sp;
        if(head<-.3&&(nm==='block'||RL.on&&nm==='parry')){ a.v.set(-a.v.x*.2,2.5,-a.v.z*.2); a.dead=true; puff(a.p,4,.05,2.6,'#ffe9a8'); sfx('clang',a.p,.4,{rate:1.4}); done=true; break; }
        const tm=game.mode==='battle'&&a.src?tacticMods(a.src,t,false):null; if(tm&&tm.txt==='Rear attack') callout(t,'Shot in the back','#ff7a5c');
        damage(t,a.dmg*(tm?Math.min(tm.mul,1.4):1),a.src,a.dir.clone(),a.power?3:1.2);
        if(a.fire) applyBurn(t,a.src,6,3);
        const at=stickInBody(a,t,a.dir.clone()); bleed(at.clone().addScaledVector(a.dir,.4*a.s),a.dir.clone().negate(),5,1.6,.6); done=true; break; } }
    if(done) continue;
    if(!a.dead){ const st=statues[1-a.team]; if(st&&st.hp>0&&Math.hypot(a.p.x-st.pos.x,a.p.z-st.pos.z)<1.7&&a.p.y<st.pos.y+9){ hitStatue(st,a.dmg*.6); a.mode='fixed'; a.ttl=0; a.age=0; puff(a.p,2,.1,1.5,'#d9cdb6'); continue; } }
    const g=H(a.p.x,a.p.z);
    if(a.p.y+a.dir.y*.4*a.s<g){ a.mode='fixed'; a.ttl=28; a.age=0; sfx('arrowGround',a.p,.8); const k=(g-(a.p.y+a.dir.y*.4*a.s))/Math.max(.05,-a.dir.y); a.p.addScaledVector(a.dir,-Math.min(k,.3)+.12*a.s); }
    else if(a.age>6) arrows.splice(i,1);
  }
}
function drawArrows(){
  if(arrows.length>arCap&&arCap<MAXAR) growArrows(Math.min(MAXAR,Math.max(arCap*2,1<<Math.ceil(Math.log2(arrows.length)))));
  let n=0; const shields=new Set();
  // two passes: arrows in the air first, so they always get a slot, then the ones stuck in bodies, shields and ground
  for(let pass=0;pass<2;pass++) for(const a of arrows){ if((a.mode==='fly')!==(pass===0)) continue; if(n>=arCap) break; if(FOW.on&&!fowVisP(a.p)) continue;
    if(a.mode==='shield'){ if(!shields.has(a.g)){ a.g.updateMatrixWorld(); shields.add(a.g); } placeArrow(a); }
    else if(a.mode==='body') placeArrow(a);
    const k=a.mode==='fixed'&&a.ttl?clamp((a.ttl-a.age)/2,0,1):1, sc=a.s*k; if(sc<.01) continue;
    _qa.setFromUnitVectors(UP,a.dir); _s.set(sc,sc,sc);
    _m.compose(a.p,_qa,_s); arIM[0].setMatrixAt(n,_m);
    _p.copy(a.p).addScaledVector(a.dir,.44*sc); _m.compose(_p,_qa,_s); arIM[1].setMatrixAt(n,_m);
    _p.copy(a.p).addScaledVector(a.dir,-.36*sc); _m.compose(_p,_qa,_s); arIM[2].setMatrixAt(n,_m); arIM[2].setColorAt(n,a.col);
    n++; }
  for(const im of arIM){ im.count=n; im.instanceMatrix.needsUpdate=true; } if(arIM[2].instanceColor) arIM[2].instanceColor.needsUpdate=true;
}

