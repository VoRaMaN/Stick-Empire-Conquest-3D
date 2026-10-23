/* ================= Anti-air and the Devil Bat: bodies, gear and behaviour (v0.33; sheets in 13l) ================= */
const _ak1=new V3(),_ak2=new V3(),_ak3=new V3(),_ak4=new V3(),_akX=new V3();

/* ---------- the Ballista: a wheeled bolt-thrower on a pivot, pushed and aimed by one crewman ---------- */
// G.b the carriage (wheels, rails, the post), G.o the bow on its pivot (stock, arms, springs, string, the bolt, the
// winch and the two rear grips the crewman holds); y along the shot, z up.
function buildSiegeGear(u,G){
  const wood=lamOf('#6a4a2c'), dark=lamOf('#3a2818'), iron=M.steel, rope=lamOf('#c8b48a'), acc=TEAM[u.team].acc, st=u.statue?M.stoneD:null;
  const W=x=>st||x;
  const o=grp(), R=(a,b,r,m)=>o.add(rodMesh(new V3(...a),new V3(...b),r,W(m)));
  R([0,-.48,0],[0,.88,0],.045,wood); R([-.05,-.48,-.03],[-.05,.88,-.03],.012,iron); R([.05,-.48,-.03],[.05,.88,-.03],.012,iron);
  for(const sd of [-1,1]){ R([sd*.06,.72,0],[sd*.32,.7,.02],.028,dark); R([sd*.32,.7,.02],[sd*.56,.52,0],.022,dark); R([sd*.07,.72,-.09],[sd*.07,.72,.09],.04,rope);
    R([sd*.56,.52,0],[sd*.02,.04,0],.006,lamOf('#efe6d2')); R([sd*.13,-.36,-.06],[sd*.13,-.44,-.12],.02,iron); }
  R([0,.04,.045],[0,1.02,.045],.016,wood); const tip=mesh(GEO.aTip,W(iron),0,1.07,.045); tip.scale.set(1.6,1.6,1.6); o.add(tip);
  R([-.16,-.36,0],[.16,-.36,0],.03,iron); R([0,-.05,-.04],[0,-.05,-.16],.05,iron);
  G.o=o;
  const b=grp(), B=(a,c,r,m)=>b.add(rodMesh(new V3(...a),new V3(...c),r,W(m)));
  for(const sd of [-1,1]){ const wh=mesh(new THREE.TorusGeometry(.28,.04,5,14),W(dark),sd*.42,.3,0); wh.rotation.y=Math.PI/2; b.add(wh);
    for(let k=0;k<4;k++){ const a=k/4*Math.PI; B([sd*.42,.3,0],[sd*.42,.3+Math.cos(a)*.27,Math.sin(a)*.27],.012,wood); }
    B([sd*.24,.32,-.62],[sd*.2,.36,.48],.035,wood); }
  B([-.46,.3,0],[.46,.3,0],.03,iron); B([0,.34,0],[0,1.0,0],.05,wood); B([-.2,.34,-.5],[0,.9,0],.025,wood); B([.2,.34,-.5],[0,.9,0],.025,wood);
  B([0,.95,0],[0,.95,.01],.06,iron);
  const pen=mesh(new THREE.BoxGeometry(.012,.16,.24),st||acc,0,.82,-.14); b.add(pen);
  G.b=b;
  const h=grp(); h.add(mesh(GEO.helm,W(iron),0,.02,0)); G.h=h;
}
// the crewman's hands go to the grips; computed while the skeleton is built (before the arms' IK)
function siegeHands(u,p,s){
  const B=u.bl||(u.bl={d:new V3().copy(u.fwdW),cp:new V3(),pv:new V3(),rec:0,crank:0}), j=u.j, f=_ak1.set(u.fwdW.x,0,u.fwdW.z).normalize();
  B.cp.set(j.pelvis.x,0,j.pelvis.z).addScaledVector(f,.8*s); B.cp.y=H(B.cp.x,B.cp.z);
  B.pv.copy(B.cp); B.pv.y+=1.0*s;
  // aim: at the target (up at a flyer), else level and a little up
  const t=u.alive?(u.atkTarget&&u.atkTarget.alive?u.atkTarget:u.target):null;
  _ak2.copy(f).addScaledVector(UP,.12);
  if(t&&t.isUnit&&t.alive){ const P=aimPoint(t,_ak3); if(P){ _ak2.subVectors(P,B.pv); const hd=Math.hypot(_ak2.x,_ak2.z)||1; _ak2.y=clamp(_ak2.y/hd,-.25,2.2)*hd; } }
  _ak2.normalize(); if(_ak2.dot(f)<.35){ _ak2.addScaledVector(f,.35-_ak2.dot(f)).normalize(); }
  B.d.lerp(_ak2,1-Math.exp(-(1/60)*5)).normalize();
  B.rec=Math.max(0,B.rec-.04); B.crank=Math.max(0,B.crank-.03);
  _akX.crossVectors(B.d,UP); if(_akX.lengthSq()<1e-4) _akX.copy(u.rightW); _akX.normalize();
  _ak4.copy(B.pv).addScaledVector(B.d,(-.42-B.rec*.12)*s).addScaledVector(UP,-.04*s);
  u.hand.R.copy(_ak4).addScaledVector(_akX,.15*s); u.hand.L.copy(_ak4).addScaledVector(_akX,-.15*s);
  if(B.crank>0){ const a=B.crank*12; u.hand.R.addScaledVector(UP,Math.sin(a)*.05*s).addScaledVector(B.d,Math.cos(a)*.04*s); }
  u.wRw.copy(B.d); u.wLw.copy(B.d);
}
function siegeUpdate(u){
  const G=u.G, B=u.bl; if(!G||!B) return;
  if(G.b){ orient(G.b,B.cp,UP,_ak1.set(u.fwdW.x,0,u.fwdW.z).normalize()); }
  if(G.o&&!G.o.dropped){ _ak2.copy(B.pv).addScaledVector(B.d,-B.rec*.15*u.s); orient(G.o,_ak2,B.d,UP); }
}
function ballistaFire(u,e){
  const t=u.atkTarget, B=u.bl; if(!t||!B) return; const P=aimPoint(t,new V3()); if(!P) return;
  const o=B.pv.clone().addScaledVector(B.d,1.05*u.s), dist=o.distanceTo(P);
  if(t.isUnit&&t.alive) P.addScaledVector(t.av,clamp(dist/60,0,.6));
  const G=3, T=clamp(dist/(e.power?62:54),.05,.8), v=new V3().subVectors(P,o).multiplyScalar(1/T); v.y+=.5*G*T;
  const air=t.isUnit&&isAir(t);
  arrows.push({mode:'fly',p:o,v,dir:v.clone().normalize(),s:u.s*1.7,col:BOLT_COL[u.team],team:u.team,dmg:u.T.dmg*(e.dmg||1)*(air?u.T.antiAir:1),src:u,age:0,G,power:true,bolt:true,fire:false}); onArrow(u);
  B.rec=1; puff(o,3,.12*u.s,1.4,'#d8cbb0'); sfx('ballistaShot',o,1); shakeAt(o,.06);
}
EXTRA_EV.blCrank=(u)=>{ if(u.bl) u.bl.crank=1; sfx('reload',u.j.hR,.55); };
TYPES.ballista.handHook=siegeHands; TYPES.ballista.gearHook=siegeUpdate;

/* ---------- the Acid Spitter: a Hellcrawler bloated with acid ---------- */
let SP_SKIN=null;
function spitterCoat(u,G){
  if(!SP_SKIN&&CRM.skin) withOwnRandom(()=>{ SP_SKIN=CRM.skin.clone(); SP_SKIN.color=new THREE.Color('#9ac48a'); SP_SKIN.emissive=new THREE.Color('#4adf1a'); SP_SKIN.emissiveIntensity=1.4; });
  if(!SP_SKIN) return; for(const k in G){ const g=G[k]; if(!g||!g.isObject3D) continue; for(const c of g.children) if(c.isMesh&&c.material===CRM.skin) c.material=SP_SKIN; } }
let SP_SACS=null;
function spitterFx(u){
  if(!u.alive||!u.cr) return;
  if(!SP_SACS) SP_SACS=[PT('mbk','sph','m','#5ab82a',[0,.3,.12],0,[.16,.13,.2]),PT('mbk','sph','m','#4a9a22',[.1,.26,-.12],0,[.12,.1,.15]),PT('mbk','sph','m','#4a9a22',[-.1,.26,-.12],0,[.12,.1,.15]),
    PT('mbk','sph','l','#2a3a1a',[0,.4,.12],0,[.05,.05,.07]),PT('mhd','sph','m','#6ad03a',[0,-.12,.12],0,[.11,.1,.13])];
  const C=armCtx(u,null,null,null,null,true); if(!C) return; armParts(C,SP_SACS,null,false);
  const pul=.5+.5*Math.sin(game.time*5+u.id); if(afPt(C,'mbk',0,.3,.12,_ak1)) glowAt(_ak1,(.1+.05*pul)*u.s,'#7aff3a');
  if(Math.random()<.04&&afPt(C,'mhd',0,-.18,.2,_ak1)){ _ak1.y-=.05; puff(_ak1,1,.04*u.s,.4,'#8aff4a'); }
}
function spitMouth(u,out){ const cr=u.cr; return out.copy(u.j.neck).addScaledVector(cr.hd,.32*CR_HEAD*u.s).addScaledVector(cr.hu,-.02*u.s); }
EXTRA_EV.spit=(u,e)=>{
  const t=u.atkTarget; if(!t||!u.cr) return; const P=aimPoint(t,new V3()); if(!P) return; const o=spitMouth(u,new V3());
  const air=t.isUnit&&isAir(t);
  orbs.push({p:o,v:new V3().subVectors(P,o).normalize().multiplyScalar(e.big?15:19),t,team:u.team,src:u,dmg:u.T.dmg*(e.dmg||1)*(air?u.T.antiAir:1),age:0,col:'#8aff3a',acid:1,acidR:e.big?2.6:1.5});
  puff(o,3,.08*u.s,1.2,'#8aff4a'); sfx('acidSpit',o,.8); };
EXTRA_EV.spGurgle=(u)=>{ if(u.cr&&Math.random()<.7) sfx('crHiss',u.j.neck,.35); };
function acidBurst(O){
  const R=O.acidR||1.5, src=O.src&&O.src.alive?O.src:O.src;
  for(const o of units){ if(!o.alive||o.team===O.team) continue; const d=o.j.chest.distanceTo(O.p); if(d>R+.3*o.s) continue;
    const dir=new V3(o.pos.x-O.p.x,0,o.pos.z-O.p.z); if(dir.lengthSq()<1e-6) dir.set(1,0,0); dir.normalize();
    damage(o,O.dmg*(o===O.t?1:.45),src,dir,.8,.3,false,o.j.chest.clone()); applyPoison(o,src,7,4); }
  const st=statues[1-O.team]; if(st&&st.hp>0&&Math.hypot(st.pos.x-O.p.x,st.pos.z-O.p.z)<2.6) hitStatue(st,O.dmg*.4);
  puffDir(O.p,UP,10,1.6,1.6,'#7ad83a',.25,.9); puff(O.p,5,.2,1,'#4a8a1a'); flashes.push({p:O.p.clone(),r0:.2,r1:1.1*R,t:0,life:.25,col:'#9aff4a'}); sfx('poison',O.p,.8);
}
function drawAcid(O){
  const t=game.time, T=pfTrail(O,7); const pul=.5+.5*Math.sin(t*25+O.age*7);
  glowAt(O.p,.1+.03*pul,'#e8ffc0'); glowAt(O.p,.22,'#7ad83a'); glowAt(O.p,.38,'#1e4a0a');
  for(let i=0;i<T.length-1;i++){ const k=(i+1)/T.length; glowAt(T[i],.03+.1*k,k>.5?'#8aff4a':'#2a5a10'); }
  if(Math.random()<.4) puffDir(O.p,UP,1,.15,.25,'#9aff5a',.05,.5);
}

/* ---------- the Elf Hawk Archer's hawk ---------- */
// perched on the left shoulder; when a flyer comes within 22 m it launches, strikes and comes back
function buildHawk(G,st){
  const fe=st||lamOf('#7a5434'), wh=st||lamOf('#efe6d4'), bk=st||lamOf('#e2ae35'), dk=st||lamOf('#2a1c10');
  const body=g=>{ const b=mesh(new THREE.SphereGeometry(.07,10,8),fe,0,0,0); b.scale.set(1,1.35,1); g.add(b); g.add(mesh(new THREE.SphereGeometry(.05,10,8),wh,0,.08,.03));
    const bek=mesh(GEO.aTip,bk,0,.085,.085); bek.rotation.x=Math.PI/2; bek.scale.set(.8,.6,.8); g.add(bek); g.add(mesh(new THREE.SphereGeometry(.012,6,4),dk,.025,.1,.065),mesh(new THREE.SphereGeometry(.012,6,4),dk,-.025,.1,.065));
    const tail=mesh(new THREE.BoxGeometry(.06,.02,.12),fe,0,-.08,-.07); tail.rotation.x=.5; g.add(tail); };
  const k=grp(); body(k); for(const sd of [-1,1]){ const w=mesh(new THREE.BoxGeometry(.03,.13,.07),fe,sd*.065,0,-.01); w.rotation.z=sd*.12; k.add(w); } G.k=k;
  for(const [key,up] of [['k2',1],['k3',-1]]){ const g=grp(); body(g);
    for(const sd of [-1,1]){ const w=mesh(new THREE.BoxGeometry(.24,.012,.09),fe,sd*.15,up*.05,0); w.rotation.z=sd*up*.5; g.add(w); const t2=mesh(new THREE.BoxGeometry(.1,.01,.06),wh,sd*.3,up*.13,-.01); t2.rotation.z=sd*up*.7; g.add(t2); }
    g.visible=false; G[key]=g; }
  for(const key of ['k','k2','k3']) for(const c of G[key].children){ c.position.multiplyScalar(1.7); c.scale.multiplyScalar(1.7); }   // a hawk worth the name
}
function hawkGear(u){
  const G=u.G; if(!G||!G.k) return; const s=u.s, j=u.j, now=game.time;
  const K=u.hk||(u.hk={st:'perch',p:new V3(),v:new V3(),cd:now+rand(2,5),t:0,tgt:null});
  _ak1.copy(j.sL).addScaledVector(u.spine,.15*s).addScaledVector(u.fwdW,-.03*s).addScaledVector(u.rightW,-.09*s);   // the perch, on the left shoulder
  if(K.st==='perch'){
    G.k.visible=u.alive; G.k2.visible=G.k3.visible=false; orient(G.k,_ak1,u.spine,u.fwdW); K.p.copy(_ak1);
    if(u.alive&&now>K.cd&&game.mode==='battle'&&!NET.guest){ let best=null,bd=22*22;
      for(const o of units){ if(!o.alive||o.team===u.team||!isAir(o)) continue; const d=(o.pos.x-u.pos.x)**2+(o.pos.z-u.pos.z)**2; if(d<bd){ bd=d; best=o; } }
      if(best){ K.st='out'; K.tgt=best; K.t=0; K.v.copy(u.fwdW).multiplyScalar(4).addScaledVector(UP,4); sfx('hawkCry',_ak1,.7); } else K.cd=now+1; }
    return; }
  G.k.visible=false; K.t+=1/60;
  const goal=K.st==='out'&&K.tgt&&K.tgt.alive?K.tgt.j.chest:_ak1;
  _ak2.subVectors(goal,K.p); const d=_ak2.length();
  _ak2.multiplyScalar(1/Math.max(d,1e-4)*16); K.v.lerp(_ak2,.12); K.p.addScaledVector(K.v,1/60);
  if(K.st==='out'&&(d<.7||K.t>4||!(K.tgt&&K.tgt.alive))){
    if(d<.7&&K.tgt&&K.tgt.alive&&!NET.guest){ const dir=_ak3.copy(K.v).setY(0).normalize(); damage(K.tgt,22,u,dir,.6,.2,false,K.p.clone()); puff(K.p,5,.06,1.5,'#efe6d4'); sfx('hawkCry',K.p,.5); if(K.tgt.wy&&K.tgt.wy.ab&&Math.random()<.35) K.tgt.wy.ab=null; }
    K.st='back'; K.t=0; }
  if(K.st==='back'&&(d<.25||K.t>5)){ K.st='perch'; K.cd=now+7; return; }
  const flap=Math.sin(now*28)>0; G.k2.visible=flap; G.k3.visible=!flap;
  _ak3.copy(K.v); if(_ak3.lengthSq()<1e-4) _ak3.copy(u.fwdW); _ak3.normalize();
  orient(G.k2,K.p,_ak3,UP); orient(G.k3,K.p,_ak3,UP);
}
TYPES.hawk.gearHook=hawkGear;

/* ---------- the Devil Bat: a demon's body, long arms, bat wings on its back ---------- */
let BAT_MEM=null;
function buildBatGear(u,G){
  wyInit(); if(!BAT_MEM) BAT_MEM=lamOf('#4a1c22',{side:THREE.DoubleSide});
  for(const sd of ['L','R']){ const m=grp(); for(let i=0;i<6;i++){ const t=mesh(WY_TRI,u.statue?M.stoneD:BAT_MEM); t.matrixAutoUpdate=false; m.add(t); } G['bw'+sd]=m; }
  u.bw={L:Array.from({length:7},()=>new V3()),R:Array.from({length:7},()=>new V3())};
}
// the wings follow the flight's beat (u.fl.wing: raise, fold, sweep), from roots high on the back
function batGearUpdate(u){
  const G=u.G, W=u.bw; if(!G||!W||!G.bwL) return; const j=u.j, s=u.s, F=u.fwdW, R=u.rightW, U=u.spine;
  const A=u.fl&&u.fl.wing||{thL:1.1,thR:1.1,del:-1.9,psi:1.2,tw:0}, dead=!u.alive;
  for(const sd of [-1,1]){ const P=sd<0?W.L:W.R, th=dead?-.4:(sd<0?A.thL:A.thR), fold=clamp(-(A.del||0)/1.95,0,1), psi=A.psi||0;
    P[0].copy(j.chest).addScaledVector(F,-.11*s).addScaledVector(U,.05*s).addScaledVector(R,sd*.08*s);   // root
    _ak1.copy(R).multiplyScalar(sd*Math.cos(th)).addScaledVector(U,Math.sin(th)).multiplyScalar(Math.cos(psi*.6)).addScaledVector(F,-Math.sin(psi*.6)).normalize();
    P[1].copy(P[0]).addScaledVector(_ak1,.48*s);   // elbow
    _ak2.copy(_ak1).multiplyScalar(1-fold*.75).addScaledVector(U,-.15-fold*.5).addScaledVector(F,-.25-fold*.4).normalize();
    P[2].copy(P[1]).addScaledVector(_ak2,.58*s*(1-fold*.4));   // wrist
    const sp=1-fold*.8;
    P[3].copy(P[2]).addScaledVector(_ak3.copy(_ak2).multiplyScalar(.9).addScaledVector(_ak1,.3).normalize(),.6*s*sp+.12*s);   // the long finger
    P[4].copy(P[2]).addScaledVector(_ak3.copy(_ak2).multiplyScalar(.35).addScaledVector(U,-.8).addScaledVector(F,-.35).normalize(),.62*s*sp+.1*s);
    P[5].copy(P[2]).addScaledVector(_ak3.copy(_ak2).multiplyScalar(-.1).addScaledVector(U,-.9).addScaledVector(F,-.5).normalize(),.5*s*sp+.1*s);
    P[6].copy(j.pelvis).addScaledVector(R,sd*.1*s).addScaledVector(F,-.1*s).addScaledVector(U,-.05*s);   // the trailing edge at the hip
    const m=(sd<0?G.bwL:G.bwR).children;
    wyTri(m[0],P[0],P[1],P[2]); wyTri(m[1],P[2],P[3],P[4]); wyTri(m[2],P[2],P[4],P[5]); wyTri(m[3],P[2],P[5],P[6]); wyTri(m[4],P[0],P[2],P[6]); wyTri(m[5],P[1],P[3],P[2]); }
}
let BAT_PARTS=null;
function drawBatFx(u){
  const C=armCtx(u); if(!C) return; const s=u.s, W=u.bw;
  if(!BAT_PARTS) BAT_PARTS=[].concat(horns('#1a0e0e').map(p=>Object.assign({},p,{sc:[.75,.85,.75]})),
    [PT('head','cone','l','#2a1416',[.62,.7,-.15],[0,0,-.5],[.22,.6,.1]),PT('head','cone','l','#2a1416',[-.62,.7,-.15],[0,0,.5],[.22,.6,.1])],   // ears
    SIDES('hd','cone','l','#e6dabd',[.03,.12,.03],[.25,0,0],[.016,.16,.016]),SIDES('hd','cone','l','#e6dabd',[0,.13,.045],[.3,0,0],[.016,.17,.016]),SIDES('hd','cone','l','#e6dabd',[-.03,.12,.03],[.25,0,0],[.016,.16,.016]),
    SIDES('pa','dome','l','#3a1a1c',[.03,.01,0],[0,0,-.35],[.1,.075,.11]),
    [0,1,2,3].map(i=>PT('back','cone','l','#1a0e0e',[0,.02-i*.13,-.11],[-Math.PI/2-.5,0,0],[.022,.12,.022])));
  armParts(C,BAT_PARTS,null,false);
  if(u.alive) for(const sd of [-1,1]) if(afPt(C,'head',sd*.33,.12,.92,_ak1)) glowAt(_ak1,.03*s,'#ff3a1a');
  // wing bones
  if(W) for(const P of [W.L,W.R]){ const bc=u.col;
    cyl(P[0],P[1],.032*s,bc,limbIM); cyl(P[1],P[2],.026*s,bc,limbIM); sph(P[1],.034*s,bc,jointIM); sph(P[2],.03*s,bc,jointIM);
    for(let i=3;i<=5;i++) cyl(P[2],P[i],.012*s,bc,limbIM); }
  // the tail, swinging
  let prev=_ak2.copy(u.j.pelvis).addScaledVector(u.fwdW,-.06*s); const t=game.time*3+u.id;
  for(let i=1;i<=6;i++){ _ak3.copy(prev).addScaledVector(u.fwdW,-.12*s).addScaledVector(UP,-.06*s+.03*s*i*.3).addScaledVector(u.rightW,Math.sin(t+i*.7)*.04*s*i*.4);
    cyl(prev,_ak3,(.035-.004*i)*s,u.col,limbIM); prev=_ak2.copy(_ak3); }
  _ak3.copy(prev).addScaledVector(u.fwdW,-.06*s); cyl(prev,_ak3,.03*s,u.col,limbIM);
}
EXTRA_EV.batRake=(u)=>{ const p=_ak1.copy(u.j.hR).lerp(u.j.hL,.5); puff(p,3,.08*u.s,1.4,'#c8b4a0'); sfx('crClaw',p,.8); };
EXTRA_EV.batScreech=(u,e)=>{ sfx('batScreech',u.j.head,e.mini?.45:.9); if(e.mini) return;
  ring(u.pos.clone().setY(H(u.pos.x,u.pos.z)),2.6,'#c86a8a'); for(const o of units) if(o.alive&&o.team!==u.team&&o.isUnit&&Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z)<6) o.morale=Math.max(0,(o.morale||100)-8); };
EXTRA_EV.batDrop=(u)=>{ const t=u.atkTarget; if(!t||!t.alive||!t.isUnit||isAir(t)||NET.guest) return; if(Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z)>3) return;
  const dir=new V3(t.pos.x-u.pos.x,0,t.pos.z-u.pos.z).normalize(); damage(t,u.T.dmg*1.4,u,dir,1.5,4,false,t.j.chest.clone()); puff(t.j.chest,4,.15,2,'#c8b4a0'); sfx('crBite',t.j.chest,.8); };
TYPES.bat.pick=(u,t)=>{ if(!t||!t.isUnit) return 'btDiveRake'; if(isAir(t)) return pickOf(['btTwinSlash','btSwoop']); let n,g=0; do{ n=pickOf(TYPES.bat.attacks); }while(n===u.lastAtk&&++g<4); return n; };
