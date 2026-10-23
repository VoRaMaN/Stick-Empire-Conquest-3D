/* ================= Hades on Cerberus: the rider, his bident, the colour variants, five abilities =================
   (data in 13i). The rider is posed by riderPose (27e) with the stances below and drawn here: a crowned, armoured
   lord in a dark cloak with a two-pronged bident whose tips burn in the variant's colour.
   Abilities (J K N M B with Hades selected): Infernal Strike · Cerberus Rage · Soul Drain · Shadow Step · Apocalypse. */
RIDER.hades={seatF:.46,seatH:.33,legW:.33,rs:1.16,kind:'hades'};
const HX_VAR=[
  {id:'infernal',name:'Infernal',fire:'#ff3a1a',hot:'#ffb04a',fur:'#221618',body:'#2a1410'},
  {id:'frost',name:'Frost',fire:'#7ad8ff',hot:'#e8fbff',fur:'#4a5a6c',body:'#1c2634'},
  {id:'toxic',name:'Toxic',fire:'#8aff3a',hot:'#eaff9a',fur:'#28361c',body:'#1a2412'},
  {id:'shadow',name:'Shadow',fire:'#b06aff',hot:'#ead8ff',fur:'#141018',body:'#120c18'}];
const HX_FUR={}, HX_COL={};
function hxVar(u){ if(u.hxV!==undefined) return HX_VAR[u.hxV]; const pref=settings.hadesVar; u.hxV=pref!==undefined&&pref>=0&&pref<4?pref:Math.abs((u.id||0)*3+u.team)%4; return HX_VAR[u.hxV]; }
// the mount in the variant's coat: the Cerberus parts with their fur swapped
function hxCoat(u){ const V=hxVar(u); if(!V.fur||!u.G||u.hxCoated) return; u.hxCoated=true;
  const M=HX_FUR[V.id]||(HX_FUR[V.id]=new THREE.MeshPhongMaterial({color:V.fur,specular:'#2a2a2a',shininess:10}));
  for(const k in u.G){ const g=u.G[k]; if(!g||!g.isObject3D) continue; for(const c of g.children) if(c.isMesh&&c.material===CRM.fur) c.material=M; } }
const hxC=c=>HX_COL[c]||(HX_COL[c]=new THREE.Color(c));

/* ---------- the rider's stances ---------- */
function hxRiderMode(u){ const R=u.hxR; if(!R||R.t>R.d) return null; const ph=R.t/R.d, w=smooth(clamp(ph/.15,0,1))*smooth(clamp((1-ph)/.2,0,1));
  const m=R.k==='thrust'?'charge':R.k==='sweep'?'sweep':R.k==='raise'?'raise':(ph<.55?'raise':'charge'); return {m,w,ph}; }
function hadesTick(u,dt){
  if(!u.rider) u.rider=true; if(!u.hxCoated&&u.G) hxCoat(u);
  const now=game.time, R=u.hxR;
  if(R){ const was=R.t/R.d; R.t+=dt; if(R.k==='slam'&&was<.55&&R.t/R.d>=.55){ u.lanceT=LANCE_T; u.lanceTgt=u.atkTarget||u.target; } if(R.t>R.d) u.hxR=null; }
  if(!u.alive) return;
  if(u.hxRageT>now){ u.desired.multiplyScalar(1.3); if(u.action&&!u.action.c.idle&&!u.action.sp) u.action.sp=1.35;
    u.hxBrT=(u.hxBrT||0)-dt; const t=u.target; if(u.hxBrT<=0&&t&&t.alive&&Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z)<6){ u.hxBrT=1.3; EXTRA_EV.cbFire(u,{}); } }
  if(u.hxApo&&!NET.guest){ const A=u.hxApo; A.t-=dt; if(A.t<=0){ A.t=.34; A.n--; hxPillar(u,A.cx+rand(-8,8),A.cz+rand(-8,8)); if(A.n<=0) u.hxApo=null; } }
  if(!NET.guest&&wyAIOwned(u)) hxAI(u,dt);
}
const HX_AB={infernal:1,rage:1,drain:1,shadow:1,apocalypse:1};
function hxCast(u,ab){
  if(!u.alive||u.state!=='ok'||u.routing||u.fin) return false;
  const face=o=>{ u.faceGoal=u.face=Math.atan2(o.pos.x-u.pos.x,o.pos.z-u.pos.z); };
  const foes=r=>wyFoes(u,r,o=>!isAir(o)), go=c=>{ u.action=null; play(u,c); u.fwdScale=0; return true; };
  switch(ab){
    case 'infernal':{ const c=wyCluster(u,11)||(u.target&&u.target.alive?{o:u.target}:null); if(!c) return false; face(c.o); u.atkTarget=c.o; go('hxInfernalStrike');
      const d=Math.hypot(c.o.pos.x-u.pos.x,c.o.pos.z-u.pos.z); u.fwdScale=clamp((d-1.4)/(2.4*u.s),.2,2.6); return true; }
    case 'rage': return go('hxRage');
    case 'drain': if(!foes(7.5).length) return false; return go('hxDrain');
    case 'shadow':{ const t=wyBestPrey(u,16)||(u.target&&u.target.alive?u.target:null); if(!t) return false; u.atkTarget=t; u.hxStepTo=t; return go('hxShadowStep'); }
    case 'apocalypse':{ const c=wyCluster(u,22); if(!c) return false; face(c.o); u.hxApoAt={x:c.o.pos.x,z:c.o.pos.z}; return go('hxApocalypse'); }
  }
  return false;
}
function hxAI(u,dt){
  u.hxAiT=(u.hxAiT===undefined?rand(1,2):u.hxAiT)-dt; if(u.hxAiT>0) return; u.hxAiT=rand(.9,1.5);
  const r=u.reg; if(!r||u.action&&!u.action.c.idle) return;
  const ready=ab=>regAbReady(r,ab), cast=ab=>regAbility(u.team,r,ab), near=n=>wyFoes(u,n,o=>!isAir(o)).length;
  if(u.hp<u.maxHp*.6&&near(7)>=3&&ready('drain')) return cast('drain');
  const c=wyCluster(u,22);
  if(c&&c.n>=6&&ready('apocalypse')) return cast('apocalypse');
  if(near(5)>=3&&ready('rage')) return cast('rage');
  if(c&&c.n>=3&&Math.hypot(c.o.pos.x-u.pos.x,c.o.pos.z-u.pos.z)>3.5&&Math.hypot(c.o.pos.x-u.pos.x,c.o.pos.z-u.pos.z)<11&&ready('infernal')) return cast('infernal');
  const p=wyBestPrey(u,16); if(p&&p.T.ranged&&Math.hypot(p.pos.x-u.pos.x,p.pos.z-u.pos.z)>6&&ready('shadow')) return cast('shadow');
}
// an Apocalypse strike: a pillar of the variant's fire
function hxPillar(u,x,z){ const V=hxVar(u), y=H(x,z); _hz1.set(x,y+.1,z); ring(_hz1,2.6,V.fire); shakeAt(_hz1,.25);
  for(let i=0;i<10;i++) emitFire(_hz1,1,.3,rand(-1,1),rand(6,10),rand(-1,1),.5,.8); fireBurst(_hz1,10,.25,3,.6);
  flashes.push({p:_hz1.clone().setY(y+1),r0:.4,r1:1.6,t:0,life:.35,col:V.fire}); sfx('hellPillar',_hz1,.8);
  if(NET.guest) return;
  gridEach(x,z,2.8,o=>{ if(!o.alive||o.team===u.team||!o.isUnit||isAir(o)) return; const dx=o.pos.x-x, dz=o.pos.z-z, d=Math.hypot(dx,dz)||1; if(d>2.6) return;
    damage(o,u.T.dmg*1.5,u,new V3(dx/d,0,dz/d),3,.6); applyBurn(o,u,8,4); }); }
const _hz1=new V3(), _hz2=new V3(), _hz3=new V3();
Object.assign(EXTRA_EV,{
  hdRide:(u,e)=>{ u.hxR={k:e.k,t:0,d:e.d||(e.k==='sweep'?.35:e.k==='slam'?.55:e.k==='raise'?1:.3)}; raRideEvent(u,e.k,e.d); if(e.k==='thrust'){ u.lanceT=LANCE_T; u.lanceTgt=u.atkTarget||u.target; } },
  hxStrike:(u)=>{ const V=hxVar(u); _hz1.copy(u.pos).addScaledVector(u.fwdW,1.1*u.s); _hz1.y=H(_hz1.x,_hz1.z)+.1; ring(_hz1,3.6,V.fire); shakeAt(_hz1,.45); fireBurst(_hz1,16,.3,4,.7);
    flashes.push({p:_hz1.clone().setY(_hz1.y+.6),r0:.4,r1:2,t:0,life:.3,col:V.fire}); sfx('infernalStrike',_hz1,.8);
    if(NET.guest) return;
    gridEach(_hz1.x,_hz1.z,3.8,o=>{ if(!o.alive||o.team===u.team||!o.isUnit||isAir(o)) return; const dx=o.pos.x-_hz1.x, dz=o.pos.z-_hz1.z, d=Math.hypot(dx,dz)||1; if(d>3.6) return;
      damage(o,u.T.dmg*2.2,u,new V3(dx/d,0,dz/d),5,.8); applyBurn(o,u,8,4); knockDown(o,u); }); },
  hxRage:(u)=>{ sfx('cerberusRage',u.j.head,.9); u.hxRageT=game.time+8; callout(u,'Cerberus Rage!','#ff7a1a'); },
  hxDrain:(u)=>{ const V=hxVar(u); let got=0, n=0;
    for(const o of wyFoes(u,7.5,o=>!isAir(o))){ if(n++>=6) break;
      for(let i=0;i<3;i++){ _hz1.copy(o.j.chest).lerp(u.j.chest,i/3+Math.random()*.15); glowAt(_hz1,.09,V.hot); }
      if(!NET.guest){ const before=o.hp; const dx=o.pos.x-u.pos.x, dz=o.pos.z-u.pos.z, dd=Math.hypot(dx,dz)||1; damage(o,u.T.dmg*.22,u,new V3(dx/dd,0,dz/dd),.2,0); got+=Math.max(0,before-o.hp); o.morale=Math.max(0,(o.morale===undefined?60:o.morale)-4); } }
    if(!NET.guest&&got>0) u.hp=Math.min(u.maxHp,u.hp+got*.5);
    if(Math.random()<.5) sfx('soulDrain',u.j.head,.5); },
  hxBlink:(u)=>{ const t=u.hxStepTo&&u.hxStepTo.alive?u.hxStepTo:null; u.hxStepTo=null;
    _hz1.copy(u.pos); puff(_hz1,14,.5,2.4,'#1a1020'); sfx('shadowStep',_hz1,.8); puff(_hz1,6,.35,1.6,hxVar(u).fire);
    if(!t||NET.guest) return;
    const dx=t.pos.x-u.pos.x, dz=t.pos.z-u.pos.z, d=Math.hypot(dx,dz)||1, nx=dx/d, nz=dz/d;
    let x=t.pos.x+nx*2.2*u.s, z=t.pos.z+nz*2.2*u.s; x=clamp(x,MAP.fx0+1,MAP.fx1-1); z=clamp(z,MAP.fz0+1,MAP.fz1-1); if(wyWet(x,z)){ x=t.pos.x-nx*2; z=t.pos.z-nz*2; }
    u.pos.x=x; u.pos.z=z; u.pos.y=groundAt(u,x,z); u.last.copy(u.pos); u.vel.set(0,0,0); u.face=u.faceGoal=Math.atan2(-nx,-nz); crPlace(u);
    u.hxShadow=game.time+3; u.target=t; u.atkTarget=t; puff(u.pos,14,.5,2.4,'#1a1020'); shakeAt(u.pos,.2); },
  hxApo:(u)=>{ const a=u.hxApoAt||{x:u.pos.x+u.fwdW.x*6,z:u.pos.z+u.fwdW.z*6}; u.hxApo={n:9,t:0,cx:a.x,cz:a.z}; shakeAt(u.pos,.6); sfx('apocalypse',u.j.head,1); callout(u,'Apocalypse!','#ff5a2a'); },
  hxSoul:(u,e,fin,v)=>{ const V=hxVar(u); const P=v&&v.j?v.j.chest:u.j.head; for(let i=0;i<8;i++){ _hz1.copy(P).addScaledVector(UP,i*.18); glowAt(_hz1,.12-.01*i,V.hot); }
    if(!NET.guest) u.hp=Math.min(u.maxHp,u.hp+u.maxHp*.12); },
});
function hxMul(t,src){ let k=1; const now=game.time; if(src&&src.hxRageT>now) k*=1.25; if(src&&src.hxShadow>now){ k*=2; src.hxShadow=0; } return k; }

/* ---------- drawing the lord: dark plate, a cloak, a crown of fire, the bident ---------- */
// v0.33: Hades as the reference sheet draws him: dark spiked plate traced with glowing lines in his variant's fire,
// a crowned and spiked great helm with a burning visor, a cape, and a hell scythe instead of the bident; Cerberus
// in a dark coat, bound in chains. The pieces are the Armory's forged shapes (40d), fitted to his bones each frame.
const HX_CAPE={infernal:'#7a1010',frost:'#1c3a6a',toxic:'#2a4a14',shadow:'#3a1a5a'};
const HX_METAL={infernal:['#1c1416','#8a5a2a'],frost:['#1a2230','#9ac8e8'],toxic:['#1a2014','#8ab040'],shadow:['#18121e','#8a6ab8']};
const HX_KIT={};
function hxKit(V,cape){ const key=V.id+(cape?'':'|nc'); if(HX_KIT[key]) return HX_KIT[key];
  const [D,T]=HX_METAL[V.id]||HX_METAL.infernal, G=V.fire, BN='#e6dabd';
  const big=L=>L.map(p=>Object.assign({},p,{p:p.p.map(v=>v*1.12),sc:p.sc.map(v=>v*1.22)}));
  const kit=[].concat(greatHelm(D,T,G,1),crownOf(T,7,.5),[PT('head','cone','m',T,[0,1.62,.55],[.35,0,0],[.13,.8,.13]),PT('head','arcF','g',G,[0,-.3,0],0,[1.105,.03,1.105])],horns('#2a2024').map(p=>Object.assign({},p,{sc:[.8,.8,.8]})),
    big(pauldron(D,D,T)),SIDES('pa','cone','m',D,[.08,.11,0],[0,0,-.35],[.028,.2,.028]),SIDES('pa','cone','m',D,[.09,.08,.06],[.45,0,-.6],[.022,.15,.022]),SIDES('pa','cone','m',D,[.09,.08,-.06],[-.45,0,-.6],[.022,.15,.022]),
    SIDES('pa','box','g',G,[.1,-.02,0],[0,0,-.8],[.005,.07,.1]),
    plates(D),trims(T),tassets(D,T),[PT('torso','box','g',G,[0,.4,.134],0,[.006,.22,.004]),PT('torso','box','g',G,[.032,.52,.131],[0,0,.75],[.005,.08,.004]),PT('torso','box','g',G,[-.032,.52,.131],[0,0,-.75],[.005,.08,.004]),
      PT('torso','arcF','g',G,[0,.25,0],0,[.123,.009,.132]),PT('torso','sph','l',BN,[0,.47,.138],0,[.03,.032,.016]),PT('torso','gem','g',G,[.011,.475,.152],0,.006),PT('torso','gem','g',G,[-.011,.475,.152],0,.006)],
    gauntlets(D,T),SIDES('fa','ring','g',G,[0,.5,0],0,[.066,.08,.066]),SIDES('hd','cone','l',BN,[.025,.09,.02],[.2,0,0],[.012,.1,.012]),SIDES('hd','cone','l',BN,[-.025,.09,.02],[.2,0,0],[.012,.1,.012]),
    greaves(D,T),SIDES('sn','box','g',G,[0,.5,.069],0,[.006,.5,.004],{leg:1}),SIDES('sn','cone','m',D,[0,.04,.08],[Math.PI/2+.3,0,0],[.022,.12,.022],{leg:1}),
    ARM_BY.c_chainbelt.P,
    cape?[PT('back','capeR','c',HX_CAPE[V.id]||HX_CAPE.infernal,[0,-.33,-.01],0,[.15,.9,.155]),PT('back','sph','l',BN,[.085,.06,.065],0,.026),PT('back','sph','l',BN,[-.085,.06,.065],0,.026)]:[]);
  return HX_KIT[key]=kit; }
const HX_SCYTHE={};
function hxScytheParts(V){ if(HX_SCYTHE[V.id]) return HX_SCYTHE[V.id]; const [D,T]=HX_METAL[V.id]||HX_METAL.infernal, G=V.fire;
  return HX_SCYTHE[V.id]=[PT('wpn','cylC','l','#1a1214',[0,.3,0],0,[.026,2.4,.026]),PT('wpn','ring','m',T,[0,1.42,0],0,[.04,.08,.04]),PT('wpn','ring','m',T,[0,-.2,0],0,[.034,.06,.034]),
    PT('wpn','sph','l','#e6dabd',[0,1.5,0],0,[.06,.065,.065]),PT('wpn','scythe','m','#2a2226',[0,1.46,0],0,[1,1,1]),PT('wpn','scytheEdge','g',G,[0,1.46,0],0,1),
    PT('wpn','cone','m',D,[0,-.98,0],[Math.PI,0,0],[.035,.16,.035]),PT('wpn','box','g',G,[0,.75,.024],0,[.012,.05,.004]),PT('wpn','box','g',G,[0,.95,.024],0,[.012,.05,.004]),PT('wpn','box','g',G,[0,1.15,.024],0,[.012,.05,.004])]; }
let HX_CHAINS=null;   // (made on first use: the Armory's shapes load later)
function hxDrawRider(u,R,d){
  const V=hxVar(u), rs=R.rs, tt=game.time;
  drawFigure(RJ,rs,hxC('#120c0e'),1,_kvF,null,false,false);
  let C=armCtx(u,RJ,rs,_kvF,_kvR,false); if(!C) return; C.wd=d;
  armParts(C,hxKit(V,!armHas(u,'cape')),null,false);
  armParts(C,hxScytheParts(V),null,false);
  // the crown of fire above the spikes; embers off the blade
  for(let i=0;i<5;i++){ const a=i/5*TAU+tt*1.5; if(afPt(C,'head',Math.cos(a)*.55,1.6+.08*Math.sin(tt*7+i),Math.sin(a)*.55,_hz1)){ glowAt(_hz1,(.026+.01*Math.sin(tt*11+i))*rs,V.fire); if(Math.random()<.05) emitFire(_hz1,1,.05*rs,0,.8,0,.04,.35); } }
  if(afPt(C,'wpn',0,1.42,.75,_hz1)){ glowAt(_hz1,(.03+.01*Math.sin(tt*13))*rs,V.fire); if(Math.random()<.1) emitFire(_hz1,1,.05*rs,0,.6,0,.05,.3); }
  // the hound in chains
  if(!HX_CHAINS) HX_CHAINS=Array.from({length:24},(_,i)=>PT('mbk','link','m','#2a2226',[0,0,0],0,1,{bd:'chain',i}));
  C=armCtx(u,null,null,null,null,true); if(C) armParts(C,HX_CHAINS,BARD.hades,false);
}

// glows at the mount and the burning ground
function hxFx(u){ const V=hxVar(u), tt=game.time;
  if(u.hxRageT>tt){ _hz1.copy(u.j.chest).addScaledVector(UP,.2*u.s); glowAt(_hz1,(.3+.06*Math.sin(tt*12))*u.s,V.fire); }
  if(u.hxShadow>tt&&Math.random()<.3) puff(u.j.chest,1,.2,.8,'#1a1020');
  if(Math.random()<.18){ _hz1.copy(u.pos); _hz1.x+=rand(-1.4,1.4); _hz1.z+=rand(-1.4,1.4); _hz1.y=H(_hz1.x,_hz1.z)+.1; puff(_hz1,1,.12,.9,Math.random()<.5?V.fire:'#2a2028'); } }

/* ---------- his mind: combos first, the crowd gets the whirl and the slam ---------- */
TYPES.hades.pick=(u,t)=>{
  const d=t?Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z):9, now=game.time;
  if(!t||!t.isUnit) return pickOf(['hxBidentFang','cbSkullRam','hxThreeHeads']);
  const crowd=enemiesNear(u.team,u.pos.x,u.pos.z,3.2);
  if(crowd>=3&&(u.cdCrowd||0)<now){ u.cdCrowd=now+5; return pickOf(['hxInfernalWhirl','hxOnslaught','cbRearStomp']); }
  if(d<6&&(u.cdBreath||0)<now&&Math.random()<.35){ u.cdBreath=now+8; return 'cbFireSweep'; }
  let n,g=0; do{ n=pickOf(['hxSlashCombo','hxSlashCombo','hxBidentFang','hxThreeHeads','hxClawSwipe','hxTailSweep','hxOnslaught','cbTripleBite','cbSkullRam','cbRendShake']); }while(n===u.lastAtk&&++g<5); return n;
};
TYPES.hades.brain=(u,dt)=>TYPES.cerberus.brain(u,dt);
