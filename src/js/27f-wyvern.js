/* ================= The war wyvern: model, flight, the rider's stances, ten abilities =================
   Model: an organic low-poly beast (faceted scales, a cream keel, horns, glowing eyes, a long S-neck, a spiked tail
   ending in a spade) on the four-limbed rig; the fore limbs are the wings. Each wing is a bone chain — upper arm,
   forearm, wrist and three long fingers — with a membrane of ten triangles stretched between the fingers and the
   flank. On the ground the wings fold and the wyvern walks on its knuckles; aloft they spread and beat.
   Flight: the body is lifted by the altitude (groundAt adds u.wyA), the legs tuck, the wings flap with a demand that
   follows climbing, cruising and gliding, and the body banks into turns. Only arrows, bolts and spells reach it
   in the air; it crosses rivers, walls and woods. It takes off for distant targets and lands to fight; the player
   can keep it aloft (G), where it attacks with its breath.
   Abilities (knight: J K N M B; wyvern: Shift + J K N M B):
     Royal Lance Charge · Aerial Execution · Shield of the Crown · Royal Pursuit · King's Judgment
     Infernal Breath · Talon Dive · Wingstorm · Predator's Screech · Aerial Assault */
const WY_CRUISE=7;
let wyReady=false; const WY_COATS=[]; let WY_TRI=null;
function wyInit(){
  if(wyReady) return; wyReady=true; horseInit();
  const ph=(c,sp,sh,o)=>new THREE.MeshPhongMaterial(Object.assign({color:c,specular:sp||'#3a3a2a',shininess:sh||18,flatShading:true},o||{}));
  for(const [sk,mem] of [['#2e5b3c','#6a2c24'],['#6b4f2a','#8a3a1e'],['#3d4654','#6a2a2a'],['#5a2420','#2e1414'],['#2f4a2a','#704a26'],['#9a8e74','#6a4a32']])
    WY_COATS.push({skin:ph(sk,'#5a5a40',22),mem:ph(mem,'#2a1a14',6,{side:THREE.DoubleSide})});
  CRM.wybel=ph('#cdb98c','#4a4030',14); CRM.wyhorn=ph('#e6dcc2','#ffffff',40); CRM.wyclaw=ph('#1c1916','#6a6050',50);
  CRM.wyeye=new THREE.MeshBasicMaterial({color:'#ffb43a'}); CRM.wygold=new THREE.MeshPhongMaterial({color:'#e2ae35',specular:'#fff2c0',shininess:80});
  const P={}, add=(part,mat,list)=>{ const p=P[part]||(P[part]={}); (p[mat]||(p[mat]=[])).push(...list); };
  const X=new V3(1,0,0), Y=new V3(0,1,0);
  const spine=(part,y0,y1,n,h,r)=>{ for(let i=0;i<n;i++){ const y=y0+(y1-y0)*i/Math.max(1,n-1); add(part,'wyhorn',[crTooth(0,y,h,r,r*3.2,1)]); } };
  // haunches, belly and back
  add('wypel','skin',[crE(0,-.02,.02,.24,.26,.23),crE(.13,-.06,0,.15,.18,.18),crE(-.13,-.06,0,.15,.18,.18)]);
  add('wypel','wybel',[crE(0,.02,-.11,.19,.21,.12)]); spine('wypel',-.15,.1,3,.22,.022);
  add('wyabd','skin',[crE(0,.26,0,.225,.33,.215)]); add('wyabd','wybel',[crE(0,.26,-.115,.18,.3,.12)]);
  add('wyabd','bard',[crE(0,.4,.13,.215,.24,.085)]); add('wyabd','saddle',[crE(0,.42,.2,.14,.17,.06),crE(0,.27,.23,.11,.035,.06),crE(0,.57,.23,.08,.035,.07)]);
  add('wyabd','wygold',[crE(0,.4,.08,.222,.012,.07)]);
  // chest: a deep keel for the wing muscles, a breastplate
  add('wytor','skin',[crE(0,.18,.01,.27,.31,.25),crE(0,.3,.14,.15,.15,.1)]); add('wytor','wybel',[crE(0,.2,-.13,.2,.27,.14)]);
  add('wytor','steel',[crE(0,.33,-.04,.21,.1,.19)]); add('wytor','wygold',[crE(0,.38,-.04,.08,.04,.2)]); spine('wytor',.05,.3,3,.24,.022);
  add('wynek','skin',[]);   // the rig's own short neck stays empty: the S-neck below is drawn from segments
  add('wyneck','skin',[crL([[-.02,.11],[.3,.1],[.7,.085],[1.02,.075]],9)]); add('wyneck','wybel',[crE(0,.5,-.06,.06,.48,.05)]);
  add('wyneck','wyhorn',[crTooth(0,.25,.1,.016,.05,1),crTooth(0,.7,.085,.014,.045,1)]);
  add('wyneck','steel',[crE(0,.5,.06,.075,.42,.04)]);
  // the head: long snout, brow ridges, swept horns, glowing eyes, teeth; a steel chanfron with a gold crest
  add('wyskl','skin',[crE(0,.06,.05,.12,.14,.11),crE(0,.24,.03,.092,.17,.08),crE(0,.41,.005,.064,.13,.058),crE(.07,.15,.1,.042,.11,.03),crE(-.07,.15,.1,.042,.11,.03)]);
  for(const sd of [-1,1]){
    add('wyskl','wyhorn',crHorn(new V3(sd*.06,.02,.12),new V3(sd*.25,-1,.55),X.clone().multiplyScalar(1),-.5,.34,.032,5));
    add('wyskl','wyhorn',crHorn(new V3(sd*.09,-.02,.04),new V3(sd*.6,-1,.1),new V3(0,0,1).multiplyScalar(sd),.3,.16,.02,3));
    add('wyskl','wyeye',[crE(sd*.074,.17,.085,.024,.03,.02)]);
    for(let i=0;i<5;i++) add('wyskl','wyhorn',[crTooth(sd*(.05-i*.004),.26+i*.045,-.04,.011,.05,-1)]); }
  add('wyskl','steel',[crE(0,.3,.075,.07,.19,.03)]); add('wyskl','wygold',[crE(0,.12,.15,.016,.09,.05)]);
  add('wyjaw','skin',[crE(0,.24,-.04,.068,.22,.034)]); add('wyjaw','wybel',[crE(0,.22,-.06,.05,.18,.02)]);
  for(const sd of [-1,1]) for(let i=0;i<4;i++) add('wyjaw','wyhorn',[crTooth(sd*(.045-i*.004),.28+i*.045,-.02,.01,.045,1)]);
  // wing arms: bony upper arm and forearm, the wrist with its hooked thumb; a finger bone (unit length, stretched)
  add('wyua','skin',[crL([[-.05,0],[0,.095],[.1,.088],[.4,.05],[.5,.045],[.54,0]],9)]);
  add('wyfa','skin',[crL([[-.03,0],[0,.056],[.3,.042],[.56,.036],[.6,0]],8)]);
  add('wyhd','skin',[crE(0,0,0,.065,.06,.055)]); add('wyhd','wyclaw',crHorn(new V3(0,.03,.02),new V3(0,1,-.6),X,1.2,.12,.018,4));
  add('wyfg','skin',[crL([[0,.032],[.5,.02],[1,.006]],6)]);
  // hind legs: thick thighs, digitigrade shins, three hooked talons forward and one back
  add('wyth','skin',[crL([[-.05,0],[0,.13],[.1,.14],[.25,.095],[.36,.06],[.39,0]],10)]);
  add('wysh','skin',[crL([[-.03,0],[0,.072],[.15,.06],[.36,.04],[.4,0]],8)]);
  add('wymt','skin',[crL([[-.02,0],[0,.046],[.25,.036],[.29,0]],7)]);
  add('wyft','skin',[crE(0,.03,0,.065,.07,.04)]);
  for(const a of [-.45,0,.45]) add('wyft','wyclaw',crHorn(new V3(Math.sin(a)*.04,.06,0),new V3(Math.sin(a)*.5,1,-.15),X,1.1,.12,.018,4));
  add('wyft','wyclaw',crHorn(new V3(0,-.03,0),new V3(0,-1,-.3),X,-.9,.08,.015,3));
  // tail: segments with a dorsal spike, a spade at the tip
  add('wytseg','skin',[crE(0,.05,0,.052,.08,.046)]); add('wytseg','wyhorn',[crTooth(0,.05,.045,.012,.04,1)]);
  add('wyttip','skin',[crE(0,.1,0,.11,.15,.016),crE(0,.0,0,.045,.07,.04)]); add('wyttip','wyhorn',crHorn(new V3(0,.2,0),Y,X,0,.08,.02,2));
  for(const part in P){ CRG[part]={}; for(const m in P[part]) CRG[part][m]=mergeUV(P[part][m]); }
  // one shared triangle for the membranes: (0,0,0) (1,0,0) (0,1,0); each wing panel maps it onto three points
  WY_TRI=new THREE.BufferGeometry(); WY_TRI.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));
  WY_TRI.setAttribute('normal',new THREE.Float32BufferAttribute([0,0,1,0,0,1,0,0,1],3)); WY_TRI.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,1],2));
}
function wyPart(name,s,k,u,coat){
  const g=grp(), P=CRG[name], tm=TEAM[u.team]||TEAM[0];
  for(const m in P){ const mat=m==='skin'?coat.skin:m==='bard'?tm.acc:m==='bard2'?tm.acc2:m==='steel'?CRM.hsteel:CRM[m]; if(!mat) continue;
    const ms=mesh(P[m],mat); if(m==='wyeye') ms.castShadow=false; g.add(ms); }
  g.scale.setScalar(s*(k||1)); freezeGear(g); return g; }
const WY_NTRI=10;
function buildWyvern(u,G){
  wyInit(); const s=u.s, coat=facOf(u.team)==='wild'?WY_COATS[4]:WY_COATS[Math.abs(u.id*5+2)%WY_COATS.length], P=(n,k)=>wyPart(n,s,k,u,coat);
  G.c_pel=P('wypel'); G.c_abd=P('wyabd'); G.c_tor=P('wytor'); G.c_nek=P('wynek'); G.c_skl=P('wyskl',1.15); G.c_jaw=P('wyjaw',1.15);
  for(let i=0;i<3;i++) G['c_wn'+i]=P('wyneck');
  for(const sd of ['L','R']){ G['c_ua'+sd]=P('wyua'); G['c_fa'+sd]=P('wyfa'); G['c_hd'+sd]=P('wyhd'); G['c_th'+sd]=P('wyth'); G['c_sh'+sd]=P('wysh'); G['c_mt'+sd]=P('wymt'); G['c_ft'+sd]=P('wyft');
    for(let i=0;i<3;i++) G['c_wf'+sd+i]=P('wyfg');
    const m=grp(); for(let i=0;i<WY_NTRI;i++){ const t=mesh(WY_TRI,coat.mem); t.matrixAutoUpdate=false; m.add(t); } G['c_wm'+sd]=m; }
  for(let i=0;i<CR_TN;i++) G['c_t'+i]=P('wytseg',CR_TK[i]);
  G.c_tt=P('wyttip',CR_TK[CR_TN]);
  crInitRig(u); wyU(u);
}

/* ---------- state ---------- */
function wyU(u){ return u.wy||(u.wy={air:false,mode:'ground',alt:0,sp:0,ph:Math.random()*TAU,fq:1.5,amp:.3,gl:0,bank:0,hold:null,ab:null,brT:2,modeT:0,netAir:false,altT:0,fastDown:false,
  W:{L:wyWing(),R:wyWing()},head:new V3(),hd:new V3(0,0,1),mouth:new V3(),br:0,glow:0}); }
function wyWing(){ const v=()=>new V3(); return {sh:v(),el:v(),wr:v(),t:[v(),v(),v()],fb:v(),fm:v()}; }
const wyAirNow=u=>!!(u.wy&&u.wy.air);
function wyWet(x,z){ if(!RL.on) return false; const rx=rlRiverX(z), W=rlRiverW(z)*1.04+.9; return Math.abs(x-rx)<W&&rlDeck(x,z)<-1e8&&rlFordK(z)<.45; }
function wyMode(u,m,force){
  const F=wyU(u), now=game.time; if(F.mode===m) return; if(!force&&F.modeT>now&&!NET.guest) return;
  F.mode=m; F.modeT=now+2.2;
  if(m==='up'){ F.fastDown=false; if(!u.action&&u.state==='ok') { play(u,'wyTakeoff'); u.fwdScale=0; } if(F.alt<.2) sfx('flap',u.pos,.9,{rate:.55}); }
}
function wyTouch(u){ const F=u.wy; F.mode='ground'; F.air=false; F.fastDown=false;
  if(!u.action&&u.state==='ok') { play(u,'wyLand'); u.fwdScale=0; }
  puff(u.pos,6,.4*u.s,2,'#8a7a66'); shakeAt(u.pos,.12); sfx('giantStep',u.pos,.6); }
function wyAIOwned(u){ return game.mode==='battle'&&!NET.on&&!game.tutorial&&(u.team===1||game.demo||game.auto[u.team]); }

/* ---------- every frame (host and guest): altitude, wings, speed in the air, the abilities ---------- */
function wyTick(u,dt){
  const F=wyU(u), now=game.time; if(!u.alive) return;
  const host=!NET.guest&&game.mode==='battle';
  if(NET.guest){ if(F.netAir&&(F.mode==='ground'||F.mode==='down')) wyMode(u,'up',true); else if(!F.netAir&&(F.mode==='air'||F.mode==='up')) wyMode(u,'down',true); }
  // altitude
  const tgt=F.mode==='ground'||F.mode==='down'?0:(F.altT||WY_CRUISE);
  if(F.mode==='down'){ F.alt=Math.max(0,F.alt-dt*(F.fastDown?11:3.4)*(.45+F.alt/WY_CRUISE)); if(F.alt<=.06){ F.alt=0; if(wyWet(u.pos.x,u.pos.z)&&!NET.guest){ F.mode='air'; } else wyTouch(u); } }
  else if(F.mode!=='ground'){ F.alt+=(tgt-F.alt)*(1-Math.exp(-dt*(F.mode==='up'?1.8:1.5))); if(F.mode==='up'&&F.alt>tgt-.7) F.mode='air'; }
  F.air=F.alt>1.2;
  // wings: spread aloft, beat to the demand
  const flying=F.mode!=='ground'; F.sp+=((flying?1:0)-F.sp)*(1-Math.exp(-dt*(flying?5:3)));
  if(flying){ const climb=F.mode==='up'||tgt-F.alt>1, desc=F.mode==='down', gl=!climb&&!desc&&u.spd>5.5?1:0;
    F.gl+=(gl-F.gl)*(1-Math.exp(-dt*1.6));
    const amp=climb?1:desc?.75:.55-.42*F.gl; F.amp+=(amp-F.amp)*(1-Math.exp(-dt*4));
    F.fq+=((climb?2.2:desc?1.9:1.45)-F.fq)*(1-Math.exp(-dt*3));
    const pp=F.ph; F.ph+=TAU*F.fq*dt*(1-F.gl*.85);
    if(Math.floor(pp/TAU)!==Math.floor(F.ph/TAU)&&F.amp>.4&&u.crVis!==false) sfx('flap',u.pos,.3+F.amp*.35,{rate:.55+Math.random()*.1}); }
  else F.amp*=Math.exp(-dt*5);
  F.bank+=((flying?clamp(-(u.turnV||0)*.32,-.8,.8):0)-F.bank)*(1-Math.exp(-dt*5));
  u.wyA=F.alt+(flying?Math.sin(F.ph)*F.amp*.16*u.s:0);
  if(F.br>0) F.br-=dt; if(F.glow>0) F.glow-=dt;
  if(!host) return;
  if(F.ab) wyAbTick(u,F,dt); else wyAuto(u,F,dt);
  if(wyAIOwned(u)) wyAI(u,F,dt);
}
// when to fly: far targets and long marches; land to fight (never in a river); the breath from the air
function wyAuto(u,F,dt){
  const now=game.time, t=u.target&&u.target.alive&&u.target.isUnit?u.target:null, dT=t?Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z):1e9;
  const ro=u.reg&&u.reg.order; let dG=0; if(ro&&ro.kind==='move') dG=Math.hypot(ro.x-u.pos.x,ro.z-u.pos.z); else if(u.slot) dG=Math.hypot(u.slot.x-u.pos.x,u.slot.z-u.pos.z);
  const prey=F.prey&&F.preyT>now&&F.prey.alive?F.prey:null;
  if(prey){ u.target=prey; const dx=prey.pos.x-u.pos.x, dz=prey.pos.z-u.pos.z, d=Math.hypot(dx,dz)||1; if(d>3&&!u.action){ const v=(F.air?u.T.airSpeed:u.T.speed)*1.45; u.desired.set(dx/d*v,0,dz/d*v); u.faceGoal=Math.atan2(dx,dz); } }
  if(F.hold==='ground'&&F.holdT<now) F.hold=null;
  if(F.hold==='air'){ if(F.mode==='ground'||F.mode==='down') wyMode(u,'up'); }
  else if(F.hold==='ground'){ if(F.mode==='up'||F.mode==='air') wyMode(u,'down'); }
  else if(!u.routing){
    const far=(t&&dT>20)||(!t&&dG>26)||(prey&&dT>12), near=(t&&dT<8.5)||(!t&&dG<6);
    if(F.mode==='ground'&&far&&!u.action&&u.state==='ok') wyMode(u,'up');
    else if((F.mode==='air'||F.mode==='up')&&near&&!far&&!wyWet(u.pos.x,u.pos.z)) wyMode(u,'down'); }
  F.brT-=dt;
  if(F.air&&t&&!isAir(t)&&dT<11&&F.brT<=0&&!u.action&&u.state==='ok'){ F.brT=rand(4,5.5); u.faceGoal=Math.atan2(t.pos.x-u.pos.x,t.pos.z-u.pos.z); u.atkTarget=t; play(u,'wyAirBreath'); u.fwdScale=0; }
  if(F.air){ if(!prey) u.desired.multiplyScalar(u.T.airSpeed/u.T.speed); u.cdT=Math.max(u.cdT,.25); }
}

/* ---------- the abilities ---------- */
const WY_AB={royal:1,exec:1,shield:1,pursuit:1,judge:1,breath:1,dive:1,storm:1,screech:1,assault:1,fly:1};
function wyFoes(u,r,fn){ const out=[]; gridEach(u.pos.x,u.pos.z,r,o=>{ if(!o.alive||!o.isUnit||o.team===u.team||o.invuln||o.inCastle) return; const d=Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z); if(d<=r&&(!fn||fn(o,d))) out.push(o); }); return out; }
// the enemy at the heart of the thickest crowd within r
function wyCluster(u,r){ const L=wyFoes(u,r,o=>!isAir(o)); let best=null, bn=0;
  for(const o of L){ let n=0; for(const p of L) if(Math.hypot(p.pos.x-o.pos.x,p.pos.z-o.pos.z)<4.5) n++; if(n>bn){ bn=n; best=o; } } return best?{o:best,n:bn}:null; }
function wyBestPrey(u,r){ let best=null, bs=0; for(const o of wyFoes(u,r,o=>!isAir(o))){ const d=Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z);
    const sc=(CAV_PREY[o.type]?2.2:1)*(o.T.ranged?1.5:1)*(1.6-o.hp/o.maxHp)*(1+o.T.cost/600)/(1+d*.05); if(sc>bs){ bs=sc; best=o; } } return best; }
function wyCast(u,ab){
  const F=wyU(u), now=game.time; if(!u.alive||u.state!=='ok'||u.routing||u.fin) return false;
  if(ab==='fly'){ if(F.mode==='air'||F.mode==='up'){ F.hold='ground'; F.holdT=now+25; wyMode(u,'down',true); } else { F.hold='air'; wyMode(u,'up',true); } return true; }
  if(F.ab) return false;
  const face=o=>{ u.faceGoal=Math.atan2(o.pos.x-u.pos.x,o.pos.z-u.pos.z); };
  switch(ab){
    case 'royal':{ const c=wyCluster(u,24); if(!c) return false; F.ab={id:ab,t:0,ph:0,tgt:c.o,hit:new Set()}; return true; }
    case 'exec':{ const t=wyBestPrey(u,24); if(!t) return false; F.ab={id:ab,t:0,ph:0,tgt:t}; if(F.mode==='ground') wyMode(u,'up',true); F.altT=5.5; return true; }
    case 'dive':{ const c=wyCluster(u,26); if(!c) return false; F.ab={id:ab,t:0,ph:0,tgt:c.o}; if(F.mode==='ground') wyMode(u,'up',true); F.altT=6.5; return true; }
    case 'assault':{ const c=wyCluster(u,30); if(!c) return false; F.ab={id:ab,t:0,ph:0,tgt:c.o,hitT:new Map()}; if(F.mode==='ground') wyMode(u,'up',true); F.altT=5.5; return true; }
    case 'judge':{ const L=wyFoes(u,12,o=>!isAir(o)); if(!L.length) return false; L.sort((a,b)=>Math.hypot(a.pos.x-u.pos.x,a.pos.z-u.pos.z)-Math.hypot(b.pos.x-u.pos.x,b.pos.z-u.pos.z));
      F.ab={id:ab,t:0,ph:0,tgt:L[0]}; return true; }
    case 'pursuit':{ const t=wyBestPrey(u,32); if(!t) return false; F.prey=t; F.preyT=now+8; u.target=t; face(t); if(!u.action){ play(u,'knPursuit'); u.fwdScale=0; } return true; }
    case 'breath':{ const c=wyCluster(u,10); if(c) face(c.o); u.action=null; play(u,'wyBreath'); u.fwdScale=0; return true; }
    case 'storm':{ u.action=null; play(u,'wyStorm'); u.fwdScale=0; return true; }
    case 'screech':{ u.action=null; play(u,'wyScreech'); u.fwdScale=0; return true; }
    case 'shield':{ u.action=null; play(u,'knShield'); u.fwdScale=0; return true; }
  }
  return false;
}
function wyEnd(u,F){ F.ab=null; F.altT=0; F.fastDown=false; if(u.action&&u.action.c.loop) u.action=null; }
function wyAbTick(u,F,dt){
  const A=F.ab, now=game.time, t=A.tgt; A.t+=dt;
  const toward=(x,z,v)=>{ const dx=x-u.pos.x, dz=z-u.pos.z, d=Math.hypot(dx,dz)||1; u.desired.set(dx/d*v,0,dz/d*v); u.faceGoal=Math.atan2(dx,dz); return d; };
  u.cdT=Math.max(u.cdT,.2);
  switch(A.id){
    case 'royal':{
      if(A.ph===0){ if(F.mode!=='ground'){ if(F.mode!=='down'){ wyMode(u,'down',true); } F.fastDown=true; if(t&&t.alive) toward(t.pos.x,t.pos.z,u.T.speed); if(A.t>5) wyEnd(u,F); return; }
        const c=t&&t.alive?t:(wyCluster(u,24)||{}).o; if(!c){ wyEnd(u,F); return; }
        const dx=c.pos.x-u.pos.x, dz=c.pos.z-u.pos.z, d=Math.hypot(dx,dz)||1; A.dx=dx/d; A.dz=dz/d; A.ph=1; A.t=0; u.action=null; play(u,'knRoyalRun'); u.fwdScale=0;
        sfx('hornEnemy',u.pos,.5); callout(u,'For the Crown!','#ffd36a'); }
      if(A.ph===1){ const v=u.T.speed*2.3; u.desired.set(A.dx*v,0,A.dz*v); u.faceGoal=Math.atan2(A.dx,A.dz);
        for(const o of wyFoes(u,3,o=>!isAir(o))){ if(A.hit.has(o)) continue; const ox=o.pos.x-u.pos.x, oz=o.pos.z-u.pos.z, fw=ox*A.dx+oz*A.dz, lat=Math.abs(-ox*A.dz+oz*A.dx);
          if(fw>-.3&&lat<1.9){ A.hit.add(o); damage(o,u.T.dmg*1.5,u,new V3(A.dx,0,A.dz),5,.5); knockDown(o,u); bleed(o.j.chest.clone(),new V3(A.dx,.3,A.dz),5,2,.4); sfx('stab',o.j.chest,.6); } }
        if(A.t>2.3||(MAP.obst&&u.spd<1&&A.t>.6)){ wyEnd(u,F); play(u,'hsLance'); u.fwdScale=.6; } }
      return; }
    case 'exec': case 'dive':{
      if(!t||!t.alive){ const n=A.id==='dive'?(wyCluster(u,20)||{}).o:wyBestPrey(u,20); if(!n){ wyEnd(u,F); return; } A.tgt=n; return; }
      if(A.t>9){ wyEnd(u,F); return; }
      if(A.ph===0){ if(F.mode==='ground'||F.mode==='down') wyMode(u,'up',true);
        const d=toward(t.pos.x,t.pos.z,u.T.airSpeed*1.15); if(d<3&&F.alt>2.4){ A.ph=1; F.mode='down'; F.fastDown=true; sfx('roar',u.j.head,.8,{rate:.7}); }
        else if(F.air) u.desired.multiplyScalar(1); else u.desired.multiplyScalar(u.T.speed/u.T.airSpeed); return; }
      if(A.ph===1){ toward(t.pos.x,t.pos.z,u.T.speed*1.2);
        if(F.alt<.7){ A.ph=2; u.action=null; play(u,A.id==='dive'?'wyDiveLand':'knExecute'); u.fwdScale=0; u.atkTarget=t; } return; }
      if(A.ph===2){ u.desired.set(0,0,0); if(A.t>12||!u.action||(u.action.c.name!=='wyDiveLand'&&u.action.c.name!=='knExecute')) wyEnd(u,F); }
      return; }
    case 'assault':{
      if(A.t>10){ wyEnd(u,F); return; }
      if(A.ph===0){ if(F.mode==='ground'||F.mode==='down') wyMode(u,'up',true);
        if(F.alt<3){ u.desired.set(0,0,0); return; }
        const c=t&&t.alive?t:(wyCluster(u,30)||{}).o; if(!c){ wyEnd(u,F); return; }
        const dx=c.pos.x-u.pos.x, dz=c.pos.z-u.pos.z, d=Math.hypot(dx,dz)||1; A.dx=dx/d; A.dz=dz/d; A.len=d+12; A.x0=u.pos.x; A.z0=u.pos.z; A.ph=1; F.altT=3.2;
        u.action=null; play(u,'wyAssaultLoop'); u.fwdScale=0; sfx('roar',u.j.head,1,{rate:.65}); }
      if(A.ph===1){ const v=u.T.airSpeed*1.25; u.desired.set(A.dx*v,0,A.dz*v); u.faceGoal=Math.atan2(A.dx,A.dz); F.br=.15;
        for(const o of wyFoes(u,4.5,o=>!isAir(o))){ const ox=o.pos.x-u.pos.x, oz=o.pos.z-u.pos.z, fw=ox*A.dx+oz*A.dz, lat=Math.abs(-ox*A.dz+oz*A.dx);
          if(fw>-1&&fw<4&&lat<2.8&&(A.hitT.get(o)||0)<now){ A.hitT.set(o,now+.6); damage(o,u.T.dmg*.45,u,new V3(A.dx,0,A.dz),1.5,.3); applyBurn(o,u,7,3); } }
        const run=(u.pos.x-A.x0)*A.dx+(u.pos.z-A.z0)*A.dz; if(run>A.len||A.t>7){ wyEnd(u,F); } }
      return; }
    case 'judge':{
      if(!t||!t.alive||A.t>4){ wyEnd(u,F); return; }
      if(A.ph===0){ if(F.mode!=='ground'){ if(F.mode!=='down') wyMode(u,'down',true); F.fastDown=true; }
        const d=toward(t.pos.x,t.pos.z,u.T.speed*1.5); if(d<4.2&&F.mode==='ground'){ A.ph=1; u.action=null; play(u,'knJudgment'); u.fwdScale=.3; u.atkTarget=t; } return; }
      if(!u.action||u.action.c.name!=='knJudgment') wyEnd(u,F); else u.desired.set(0,0,0);
      return; }
  }
  wyEnd(u,F);
}
// the computer general's wyvern knights use their abilities when they pay off
function wyAI(u,F,dt){
  F.aiT=(F.aiT||rand(.5,1.5))-dt; if(F.aiT>0) return; F.aiT=rand(.8,1.4);
  const r=u.reg; if(!r||F.ab||u.action&&!u.action.c.idle) return;
  const ready=ab=>regAbReady(r,ab), cast=ab=>{ if(ready(ab)) regAbility(u.team,r,ab); };
  const near=n=>wyFoes(u,n,o=>!isAir(o)).length, now=game.time;
  if(u.hp<u.maxHp*.5&&near(4)>=2&&ready('shield')) return cast('shield');
  if(near(3.6)&&ready('judge')) return cast('judge');
  if(near(5)>=4&&ready('storm')) return cast('storm');
  if(near(8)>=3&&ready('breath')) return cast('breath');
  if(near(9)>=5&&ready('screech')) return cast('screech');
  const c=wyCluster(u,26);
  if(c&&c.n>=6&&ready('assault')) return cast('assault');
  if(c&&c.n>=3&&Math.hypot(c.o.pos.x-u.pos.x,c.o.pos.z-u.pos.z)>8&&ready('dive')) return cast('dive');
  if(c&&c.n>=3&&Math.hypot(c.o.pos.x-u.pos.x,c.o.pos.z-u.pos.z)>7&&ready('royal')) return cast('royal');
  const p=wyBestPrey(u,22); if(p&&(p.T.ranged||CAV_PREY[p.type])&&p.hp<p.maxHp*.6&&ready('exec')) return cast('exec');
  if(p&&p.T.ranged&&ready('pursuit')) return cast('pursuit');
}

/* ---------- clip events (damage only on the host; the sights on every screen) ---------- */
const _wy1=new V3(), _wy2=new V3(), _wy3=new V3();
function wyHit(u,o,k,kb,up){ const dx=o.pos.x-u.pos.x, dz=o.pos.z-u.pos.z, d=Math.hypot(dx,dz)||1; damage(o,u.T.dmg*k,u,new V3(dx/d,0,dz/d),kb||1,up||.2); }
Object.assign(EXTRA_EV,{
  wyFire:(u,e,fin,v)=>{ const F=wyU(u); F.br=e.big?.35:.24; if(Math.random()<.45) crSfx('flameWave','ignite',F.mouth,.5);
    if(e.fin){ const rg=fin&&(fin.rag||fin.rag2), P=v&&v.alive?v.j.chest:(rg?rg.p[1]:null); if(P) fireBurst(P,7,.17*u.s,1.3,.6); return; }
    if(NET.guest) return;
    const hx=Math.sin(u.face), hz=Math.cos(u.face), R=e.air?Math.max(9,F.alt*1.4+4):8.5;
    for(const o of wyFoes(u,R+1,o=>!isAir(o))){ const dx=o.pos.x-u.pos.x, dz=o.pos.z-u.pos.z, d=Math.hypot(dx,dz)||1;
      if(d<R&&((dx*hx+dz*hz)/d>(e.air?.55:.76)||d<1.6)){ damage(o,u.T.dmg*.32,u,new V3(dx/d,0,dz/d),1.1,.2); applyBurn(o,u,7,3.5); } } },
  wyGust:(u)=>{ const F=wyU(u); shakeAt(u.pos,.2); sfx('flap',u.pos,1,{rate:.45}); _wy1.copy(u.pos); _wy1.y=H(u.pos.x,u.pos.z)+.1; ring(_wy1,6.5,'#d8d0c0'); puff(_wy1,10,.5*u.s,4,'#b8ac98');
    if(NET.guest) return;
    for(const o of wyFoes(u,6.8)){ if(isAir(o)) continue; wyHit(u,o,.25,6,.7); knockDown(o,u); if(o.action&&!o.action.c.idle&&!o.fin&&o.state==='ok'){ o.action=null; play(o,'flinch'); } } },
  wyScreech:(u)=>{ const F=wyU(u); shakeAt(u.pos,.5); sfx('roar',u.j.head,1.1,{rate:.62}); crSfx('dreadRoar','warcry',u.j.head,.7); _wy1.copy(u.pos); _wy1.y=H(u.pos.x,u.pos.z)+.2; ring(_wy1,10,'#ffd36a');
    if(NET.guest) return; const now=game.time;
    for(const o of wyFoes(u,10)){ o.morale=Math.max(0,(o.morale===undefined?60:o.morale)-28); o.slowT=now+4; if(!o.action&&o.state==='ok'&&o.isUnit) play(o,'flinch'); }
    gridEach(u.pos.x,u.pos.z,10,o=>{ if(o.alive&&o.team===u.team&&o.isUnit) o.rallyT=now+5; }); },
  wyRoar:(u,e)=>{ sfx('roar',u.j.head,e.mini?.55:1,{rate:.72+Math.random()*.08}); if(!e.mini) shakeAt(u.pos,.25); },
  wyRustle:(u)=>{ sfx('flap',u.pos,.35,{rate:.9}); },
  wyFlapSfx:(u)=>{ sfx('flap',u.pos,.6,{rate:.6}); },
  wyLaunch:(u)=>{ _wy1.copy(u.pos); _wy1.y=H(u.pos.x,u.pos.z)+.1; puff(_wy1,10,.45*u.s,3,'#9a8a74'); ring(_wy1,3.5,'#b8ac98'); sfx('flap',u.pos,1,{rate:.5}); },
  wyTouch:(u)=>{ puff(u.pos,6,.4*u.s,2,'#8a7a66'); },
  wyDiveHit:(u)=>{ const t=u.atkTarget; shakeAt(u.pos,.45); _wy1.copy(u.pos); _wy1.y=H(u.pos.x,u.pos.z)+.1; ring(_wy1,3.4,'#e8d8b0'); puff(_wy1,12,.5*u.s,3.5,'#8a7a66'); sfx('giantStep',u.pos,1);
    if(NET.guest) return;
    for(const o of wyFoes(u,3.4,o=>!isAir(o))){ wyHit(u,o,o===t?2.6:2,5,.6); knockDown(o,u); } },
  knCrown:(u)=>{ const now=game.time; u.crownT=now+7; u.crownK=.55; wyU(u).glow=1.2; sfx('research',u.pos,.5); _wy1.copy(u.pos); _wy1.y=H(u.pos.x,u.pos.z)+.15; ring(_wy1,5.5,'#ffd36a');
    if(NET.guest) return; gridEach(u.pos.x,u.pos.z,5.5,o=>{ if(o!==u&&o.alive&&o.team===u.team&&o.isUnit){ o.crownT=now+7; o.crownK=Math.max(o.crownT>now&&o.crownK||0,.3); } }); },
  knRaise:(u)=>{ wyU(u).glow=.9; sfx('swordDraw',u.pos,.6); },
  knJudge:(u)=>{ const F=wyU(u); F.glow=.6; shakeAt(u.pos,.4);
    const t=u.atkTarget&&u.atkTarget.alive?u.atkTarget:(wyFoes(u,4.8,o=>!isAir(o))[0]); if(t){ _wy1.copy(t.pos); _wy1.y=H(t.pos.x,t.pos.z)+.1; ring(_wy1,3,'#ffd36a'); for(let i=0;i<8;i++){ _wy2.copy(_wy1).addScaledVector(UP,i*.45); glowAt(_wy2,.35-i*.03,'#ffe08a'); } }
    if(NET.guest||!t) return; sfx('stab',t.j.chest,1);
    if(t.hp<t.maxHp*.35&&t.type!=='giant') wyHit(u,t,99,4,1); else wyHit(u,t,4.5,4,.6);
    if(!t.alive){ const now=game.time; for(const o of wyFoes(u,7)){ o.morale=Math.max(0,(o.morale===undefined?60:o.morale)-20); if(!o.action&&o.state==='ok') play(o,'flinch'); } } },
  knExec:(u)=>{ const F=wyU(u), t=u.atkTarget&&u.atkTarget.alive?u.atkTarget:(F.ab&&F.ab.tgt); shakeAt(u.pos,.35); puff(u.pos,8,.45*u.s,3,'#8a7a66');
    if(t&&t.alive){ _wy1.copy(t.j.chest); for(let i=0;i<6;i++){ _wy2.copy(_wy1).addScaledVector(UP,i*.4); glowAt(_wy2,.28,'#ffe08a'); } }
    if(NET.guest) return;
    if(t&&t.alive&&Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z)<4.5){ if(t.hp<t.maxHp*.4&&t.type!=='giant') wyHit(u,t,99,5,1.2); else wyHit(u,t,5,5,.8); sfx('stab',t.j.chest,1); }
    for(const o of wyFoes(u,2.8,o=>!isAir(o))) if(o!==t){ wyHit(u,o,1.1,4,.4); knockDown(o,u); } },
});
// the old horse noises become a wyvern's
{ const sn=EXTRA_EV.hsSnort, ne=EXTRA_EV.hsNeigh;
  EXTRA_EV.hsSnort=(u,e)=>{ if(!u.T.wyvern) return sn(u,e); const F=wyU(u); puff(F.mouth,3,.08*u.s,.7,'#9a948a'); if(Math.random()<.3) emitFire(F.mouth,2,.08*u.s,F.hd.x,.3,F.hd.z,.3,.35); };
  EXTRA_EV.hsNeigh=(u,e)=>{ if(!u.T.wyvern) return ne(u,e); sfx('roar',u.j.head,.6,{rate:.78}); }; }

/* ---------- damage: the Crown's shield, the pursued prey ---------- */
function wyMul(t,src){
  let k=1; const now=game.time;
  if(t.crownT>now) k*=1-(t.crownK||.3);
  if(src&&src.wy&&src.wy.prey===t&&src.wy.preyT>now) k*=1.5;
  if(src&&src.wy&&isAir(t)&&!src.wy.air) k*=.5;
  return k; }
function wyDie(u){ if(!u.wy) return; u.wy.mode='ground'; u.wy.air=false; u.wy.ab=null; u.wyA=0; }

/* ---------- pose: the body in the air, the wings' bones ---------- */
function wyPose(u,p){
  const F=wyU(u), fl=F.sp;
  p.wing=Math.max(p.wing||0,fl);
  if(fl>.02){ const a=smooth(clamp(F.alt/2,0,1)); p.lean+=(.22+clamp(u.spd/12,0,.25))*a; p.crouch=lerp(p.crouch,.08,a); p.side+=F.bank*a; p.alt=(p.alt||0)+.55*a; if(F.alt>.4) p.jump=Math.max(p.jump,.05); }
  if(F.mode==='down'&&F.fastDown) p.lean+=.35;
}
const _wq1=new V3(),_wq2=new V3(),_wq3=new V3(),_wq4=new V3(),_wq5=new V3();
function wySkel(u,p){
  const F=wyU(u), cr=u.cr, j=u.j, s=u.s, S=clamp(p.wing||0,0,1), flap=F.sp>.02?Math.sin(F.ph)*F.amp*F.sp:0;
  const elev=(p.wup||0)*.7+flap*.95+F.gl*.08, sw=(p.wsw||0);
  for(const sd of [-1,1]){ const X=sd<0?'L':'R', W=F.W[X], R=cr.rc, U=cr.n, Fw=cr.d2;
    // folded (the rig's knuckle-walking arm) and spread (out to the side, raised by `elev`)
    const sh0=j['s'+X], el0=j['e'+X], wr0=j['h'+X];
    W.sh.copy(cr.C).addScaledVector(R,sd*.16*s).addScaledVector(U,.06*s).addScaledVector(Fw,.03*s).lerp(sh0,1-S);
    const ce=Math.cos(elev), se=Math.sin(elev);
    _wq1.copy(R).multiplyScalar(sd*ce).addScaledVector(U,se);   // out, raised
    _wq2.copy(_wq1).multiplyScalar(Math.cos(.62+sw*.3)).addScaledVector(Fw,-Math.sin(.62+sw*.3)).normalize();   // humerus: out and back
    _wq3.copy(_wq1).multiplyScalar(Math.cos(.35-sw*.35)).addScaledVector(Fw,Math.sin(.35-sw*.35)).normalize();   // forearm: out and forward
    _wq4.copy(W.sh).addScaledVector(_wq2,CRB.ua*s); W.el.copy(el0).lerp(_wq4,S);
    _wq5.subVectors(W.el,W.sh); W.el.copy(W.sh).addScaledVector(_wq5.normalize(),CRB.ua*s);
    _wq4.copy(W.el).addScaledVector(_wq3,CRB.fa*s); W.wr.copy(wr0).lerp(_wq4,S);
    _wq5.subVectors(W.wr,W.el); W.wr.copy(W.el).addScaledVector(_wq5.normalize(),CRB.fa*s);
    // the fingers fan back from the wrist; folded they lie back along the arm
    const fold=_wq5.subVectors(W.el,W.wr).normalize().multiplyScalar(.75).addScaledVector(U,.5).addScaledVector(R,sd*.12).normalize();
    for(let i=0;i<3;i++){ const a=[-.05,.6,1.15][i]+sw*[.35,.45,.35][i], L=[1.5,1.32,1.02][i]*s*(.48+.52*S);
      _wq4.copy(_wq1).multiplyScalar(Math.cos(a)).addScaledVector(Fw,-Math.sin(a)).addScaledVector(U,-flap*.22*(i+1)/3).normalize();
      _wq4.lerp(fold,1-S).normalize(); W.t[i].copy(W.wr).addScaledVector(_wq4,L); }
    W.fb.copy(j['hip'+X]).addScaledVector(U,.06*s).addScaledVector(R,sd*.05*s);
    W.fm.copy(cr.M).addScaledVector(R,sd*.17*s).addScaledVector(U,.08*s);
    // hand the arm to the rig's model
    j['s'+X].copy(W.sh); j['e'+X].copy(W.el); j['h'+X].copy(W.wr);
    (sd<0?u.wLw:u.wRw).subVectors(W.t[0],W.wr).normalize(); }
}

/* ---------- model: the S-neck, the head on it, finger bones and the membranes ---------- */
const _wm=new THREE.Matrix4(), _wn=new V3(), _wa=new V3(), _wb=new V3(), _wc=new V3(), _wp=[new V3(),new V3(),new V3(),new V3()];
function wyTri(m,A,B,C){ _wa.subVectors(B,A); _wb.subVectors(C,A); _wn.crossVectors(_wa,_wb); const l=_wn.length(); if(l<1e-6){ m.visible=false; return; } m.visible=true; _wn.multiplyScalar(1/l);
  m.matrix.set(_wa.x,_wb.x,_wn.x,A.x, _wa.y,_wb.y,_wn.y,A.y, _wa.z,_wb.z,_wn.z,A.z, 0,0,0,1); }
const _wm01=new V3(),_wm12=new V3(),_wm2b=new V3();
function wyModel(u){
  const G=u.G, F=wyU(u), cr=u.cr, j=u.j, s=u.s; if(!G||!G.c_wn0) return;
  // the neck: a curve from the withers up and over to the head
  const A=_wp[0].copy(j.chest).addScaledVector(cr.n,.12*s).addScaledVector(cr.d2,.08*s);
  const raise=u.alive?.32:.05;
  const Hb=F.head.copy(j.neck).addScaledVector(cr.d2,.26*s).addScaledVector(cr.n,raise*s).addScaledVector(cr.hd,.12*s);
  _wp[1].copy(A).addScaledVector(cr.d2,.2*s).addScaledVector(cr.n,.28*s); _wp[2].copy(Hb).addScaledVector(cr.hd,-.26*s).addScaledVector(UP,-.04*s);
  let prev=_wa.copy(A);
  for(let i=1;i<=3;i++){ const t=i/3, it=1-t; _wb.set(0,0,0).addScaledVector(A,it*it*it).addScaledVector(_wp[1],3*it*it*t).addScaledVector(_wp[2],3*it*t*t).addScaledVector(Hb,t*t*t);
    const g=G['c_wn'+(i-1)]; _wc.subVectors(_wb,prev); const L=_wc.length()||1e-3; orient(g,prev,_wc,cr.n); g.scale.set(s,L,s); prev.copy(_wb); }
  // the head and jaw at the end of it
  orient(G.c_skl,Hb,cr.hd,cr.hu);
  _wc.crossVectors(cr.hd,cr.hu).normalize(); const ja=.05+cr.jaw*.75;
  _wa.copy(cr.hd).applyAxisAngle(_wc,-ja); _wb.copy(cr.hu).applyAxisAngle(_wc,-ja);
  orient(G.c_jaw,_wn.copy(Hb).addScaledVector(cr.hd,.04*s).addScaledVector(cr.hu,-.04*s),_wa,_wb);
  F.hd.copy(cr.hd); F.mouth.copy(Hb).addScaledVector(cr.hd,.58*s*1.15).addScaledVector(cr.hu,-.02*s);
  // fingers and membranes
  for(const X of ['L','R']){ const W=F.W[X], T=W.t;
    for(let i=0;i<3;i++){ const g=G['c_wf'+X+i]; _wc.subVectors(T[i],W.wr); const L=_wc.length()||1e-3; orient(g,W.wr,_wc,cr.n); g.scale.set(s,L,s); }
    _wm01.copy(T[0]).lerp(T[1],.5).lerp(W.wr,.16); _wm12.copy(T[1]).lerp(T[2],.5).lerp(W.wr,.15); _wm2b.copy(T[2]).lerp(W.fb,.5).lerp(W.el,.14);
    const M=G['c_wm'+X].children;
    wyTri(M[0],W.wr,T[0],_wm01); wyTri(M[1],W.wr,_wm01,T[1]); wyTri(M[2],W.wr,T[1],_wm12); wyTri(M[3],W.wr,_wm12,T[2]); wyTri(M[4],W.wr,T[2],_wm2b);
    wyTri(M[5],W.el,W.wr,_wm2b); wyTri(M[6],W.el,_wm2b,W.fb); wyTri(M[7],W.el,W.fb,W.fm); wyTri(M[8],W.sh,W.el,W.fm); wyTri(M[9],W.sh,W.wr,W.el); }
}
// eyes, the breath, the Crown's glow, the pursued prey's mark
const _wf1=new V3();
function wyFx(u){
  const F=wyU(u), cr=u.cr, s=u.s; if(!cr) return;
  _wc.crossVectors(cr.hd,cr.hu).normalize();
  for(const sd of [-1,1]){ _wf1.copy(F.head).addScaledVector(cr.hd,.2*s*1.15).addScaledVector(cr.hu,.1*s).addScaledVector(_wc,sd*.085*s*1.15); glowAt(_wf1,.03*s,'#ffb43a'); }
  if(F.br>0&&u.alive){ const n=settings.calm?1:3, sp=8.5; for(let i=0;i<n;i++){ const dx=F.hd.x+rand(-.12,.12), dy=F.hd.y+rand(-.1,.1), dz=F.hd.z+rand(-.12,.12);
      emitFire(F.mouth,1,.16*s,dx*sp,dy*sp+(F.air?-1:.6),dz*sp,.6,.55); } }
  if(u.crownT>game.time){ const k=.5+.5*Math.sin(game.time*6+u.id); _wf1.copy(u.j.chest).addScaledVector(UP,.25*s); glowAt(_wf1,(.14+.04*k)*s,'#ffd36a'); }
  if(F.glow>0){ _wf1.copy(u.j.chest).addScaledVector(UP,1.1*s); glowAt(_wf1,.25*s*Math.min(1,F.glow*2),'#ffe9a8'); }
  if(F.prey&&F.preyT>game.time&&F.prey.alive&&u.team===myTeam()){ const t=F.prey; _wf1.copy(t.j.head).addScaledVector(UP,.55*t.s); glowAt(_wf1,.12+.04*Math.sin(game.time*8),'#ff5a4f'); }
}

/* ---------- the rider's stances: lance levelled for a charge, shield raised, lance high for judgment, standing to strike ---------- */
const WY_RIDER={knRoyalRun:'charge',knPursuit:'charge',hsLance:'charge',knExecute:'stand',knShield:'shield',block:'shield',knJudgment:'raise',wyAssaultLoop:'charge'};
function wyRiderMode(u){ const a=u.action; if(!a) return null; let m=WY_RIDER[a.c.name]; if(m==='raise'&&a.t>1.1) m='charge'; if(!m) return null;
  const w=a.c.loop?1:smooth(clamp(a.t/.15,0,1))*smooth(clamp((a.c.dur-a.t)/.3,0,1)); return w>.01?{m,w}:null; }

/* ---------- the knight's mind on the ground: lance first, the crowd gets the tail, leaps from a few strides out ---------- */
TYPES.knight.pick=(u,t)=>{
  if(!t||!t.isUnit) return pickOf(['hsLance','wyBite','wyWingBuffet']);
  if(enemiesNear(u.team,u.pos.x,u.pos.z,3)>=3&&(u.cdCrowd||0)<game.time){ u.cdCrowd=game.time+6; return pickOf(['wyRearStomp','wySpinSweep','wyWingBuffet']); }
  let n,g=0; do{ n=pickOf(['hsLance','hsLance','hsCouched','wyBite','wyBite','wyTailLash','wyTalonRake','wySnapShake','wyWingBuffet']); }while(n===u.lastAtk&&++g<4); return n;
};
{ const brain0=TYPES.knight.brain;
  TYPES.knight.brain=(u,dt)=>{
    if(u.wy&&u.wy.ab) return true;   // an ability is steering him (27f)
    if(brain0(u,dt)) return true;
    return false; }; }
