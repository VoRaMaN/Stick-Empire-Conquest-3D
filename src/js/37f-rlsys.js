/* ================= Riverlands systems: day and night, ambush, fords, supply, objectives, neutral camps =================
   plus veteran regiments and formations (any battle except the classic regression mix).
   Everything on Riverlands is gated by RL.on; veterans and formations by !game.classicMix and the player's own
   choice, so the classic field replays exactly as before. */

/* ---------- day and night ---------- */
// a six-minute day: morning → noon → dusk → night → dawn. At night everyone sees less (fog of war), fires and
// torches light the ground round them and show whoever stands there, and ninjas strike harder and unseen.
const DN={len:360,start:.08,lights:[],on:false};
function dnPhase(){ return ((game.time/DN.len)+DN.start)%1; }
// 1 in full day, ~0.18 at the darkest of night
function dnLight(p){ if(p<.5) return 1; if(p<.6) return 1-(p-.5)/.1*.82; if(p<.86) return .18; if(p<.96) return .18+(p-.86)/.1*.82; return 1; }
const dnNight=()=>RL.on&&game.mode==='battle'?clamp((1-dnLight(dnPhase()))/.82,0,1):0;
const _dnA=new THREE.Color(), _dnB=new THREE.Color(), DN_SUN=new THREE.Color('#ffe0ad'), DN_DUSK=new THREE.Color('#ff9a5a'), DN_MOON=new THREE.Color('#8aa0d8'),
  DN_SKY=new THREE.Color('#fff4dd'), DN_SKYN=new THREE.Color('#5a6a9a'), DN_HOR=new THREE.Color('#d6d3b4'), DN_HORN=new THREE.Color('#1a2234');
function dnStep(){
  if(!RL.on) return;
  const p=dnPhase(), L=dnLight(p), n=1-L, dusk=p>.45&&p<.66?1-Math.abs(p-.555)/.105:p>.84&&p<.98?(1-Math.abs(p-.91)/.07)*.6:0, g=typeof GFX!=='undefined'&&GFX?GFX:{sun:1,sky:1};
  sun.intensity=.92*g.sun*(.14+.86*L); hemi.intensity=.78*g.sky*(.4+.6*L);
  _dnA.copy(DN_SUN).lerp(DN_DUSK,clamp(dusk,0,1)).lerp(DN_MOON,clamp((n-.3)/.5,0,1)); sun.color.copy(_dnA);
  hemi.color.copy(DN_SKY).lerp(DN_SKYN,clamp(n/.82,0,1));
  HORIZON.copy(DN_HOR).lerp(DN_HORN,clamp(n/.82,0,1)); if(scene.fog) scene.fog.color.copy(HORIZON);
  if(skyDome) skyDome.material.color.setScalar(.22+.78*L); if(sunDisc) sunDisc.visible=L>.45;
  // the fires nearest the camera light the ground at night (four lights, moved to whichever fires are close)
  const nk=dnNight(); if(!DN.lights.length) return;
  const cx=cam.target.x, cz=cam.target.z, F=RL.fires.filter(f=>!f.small).map(f=>[f,(f.x-cx)**2+(f.z-cz)**2]).sort((a,b)=>a[1]-b[1]);
  DN.lights.forEach((l,i)=>{ const f=F[i]&&F[i][0]; if(!f||nk<.05){ l.intensity=0; return; } l.position.set(f.x,f.y+1.2,f.z); l.intensity=nk*(f.camp?2.2:1.5)*(.9+.1*Math.sin(game.time*13+i)); });
}
function dnLightsOn(on){
  if(on&&!DN.lights.length) for(let i=0;i<4;i++){ const l=new THREE.PointLight('#ff9a4a',0,26,2); DN.lights.push(l); }
  for(const l of DN.lights){ if(on) scene.add(l); else scene.remove(l); }
  if(!on){ sun.color.copy(DN_SUN); hemi.color.copy(DN_SKY); if(skyDome) skyDome.material.color.setScalar(1); if(sunDisc) sunDisc.visible=true;
    if(typeof applyGfx==='function'&&typeof GFX!=='undefined'&&GFX) applyGfx(GFX); }
}
const dnLabel=()=>{ const p=dnPhase(); return p<.12?'Morning':p<.4?'Day':p<.5?'Afternoon':p<.62?'Dusk':p<.86?'Night':'Dawn'; };

/* ---------- ambush and stealth ---------- */
// a soldier standing in a forest — or a ninja anywhere at night — can't be seen by the enemy unless one of them is
// within 9 m, or he has just attacked. The first blows from hiding are an ambush: +40% damage.
const inForest=(x,z)=>{ for(const f of RL_FORESTS) if((x-f[0])**2+(z-f[1])**2<(f[2]*.92)**2) return true; return false; };
function stealthTick(nk){
  for(const u of units){ if(!u.alive||!u.isUnit||u.team>1) continue;
    u.stealth=inForest(u.pos.x,u.pos.z)||(u.type==='ninja'&&nk>.5);
    if(!u.stealth){ u.spot0=u.spot1=true; continue; }
    u.spot0=u.team===0; u.spot1=u.team===1;
    gridEach(u.pos.x,u.pos.z,9,o=>{ if(!o.alive||o.team===u.team||o.team>1||!o.isUnit) return; if((o.pos.x-u.pos.x)**2+(o.pos.z-u.pos.z)**2<81){ if(o.team===0) u.spot0=true; else u.spot1=true; } }); }
}
const stealthHides=(team,o)=>o.stealth&&!(o.revealT>game.time)&&!(team===0?o.spot0:o.spot1);
function ambushStart(u){ if(!RL.on) return; if(u.stealth&&!(u.revealT>game.time)){ u.ambushT=game.time+1.5; callout(u,'Ambush!','#9fe07a'); } u.revealT=game.time+4; }

/* ---------- fords ---------- */
// shallow crossings between the bridges: slow (half speed in the water), and anyone wading can't dodge or parry
// and takes 25% more damage
const RL_FORDS=[{z:35},{z:-35},{z:105},{z:-105}];
function rlFordK(z){ let k=0; for(const F of RL_FORDS){ const d=Math.abs(z-F.z); if(d<5) k=Math.max(k,smooth(clamp((5-d)/2.2,0,1))); } return k; }
let RL_CROSS=null;   // bridges and fords, the ways over the river, for route-finding
function rlCrossings(){ if(RL_CROSS) return RL_CROSS; RL_CROSS=RL_BRIDGES.slice();
  for(const F of RL_FORDS){ const x=rlRiverX(F.z), W=rlRiverW(F.z)+2.5; RL_CROSS.push({x,z:F.z,w:[x-W,F.z],e:[x+W,F.z],ax:1,az:0,ford:true}); } return RL_CROSS; }
function rlBuildFords(K){ for(const F of RL_FORDS){ const x0=rlRiverX(F.z), W=rlRiverW(F.z); for(let i=-5;i<=5;i++){ const x=x0+i*W/5, z=F.z+((i*7)%3-1)*.8;
  K.put('stone',gBox(.9,.3,.7,CTILE.stone),TM(x,RL.WL-.12,z,i*.7)); } } }

/* ---------- supply lines ---------- */
// a soldier more than 75 m from his castle and 40 m from any zone his army holds is out of supply: his morale
// slowly drains until he's back in reach (moraleTick reads u.noSupply)
function supplyTick(){
  for(const u of units){ if(!u.alive||!u.isUnit||u.team>1||u.T.worker||u.inCastle) { u.noSupply=false; continue; }
    const cx=(u.team?1:-1)*RL_CF; let ok=Math.hypot(u.pos.x-cx,u.pos.z)<75;
    if(!ok) for(const Z of RL.zones) if(Z.owner===u.team&&Math.hypot(u.pos.x-Z.x,u.pos.z-Z.z)<40){ ok=true; break; }
    const was=u.noSupply; u.noSupply=!ok;
    if(u.noSupply&&!was&&u.reg&&!(u.reg.supT>game.time)){ u.reg.supT=game.time+20; if(u.team===myTeam()) callout(u,'Out of supply','#ffb35c'); } }
}

/* ---------- the new objectives (zones of other kinds) ---------- */
// militia villages train a free swordsman every 30 s (up to five at a time); watchtowers see 70 m round;
// resurrection shrines raise one of their holder's fallen soldiers every 25 s
const RL_DEAD=[[],[]];
function rlObjTick(Z,dt){
  const t=Z.owner; if(t<0||t>1) return; const K=RL_ZKIND[Z.id]; Z.tk=(Z.tk||0)+dt;
  if(K==='militia'&&Z.tk>=30){ Z.tk=0; Z.mil=(Z.mil||[]).filter(u=>u.alive); if(Z.mil.length>=5||count(t)>=POP_CAP) return;
    const type=facOf(t)==='chaos'?'boner':'sword', u=spawn(type,t,Z.x+rand(-2,2),Z.z+rand(-2,2)); Z.mil.push(u); puff(u.pos,6,.2,1.2,'#e8dcc0'); if(t===myTeam()) callout(u,'Militia joins','#ffd36b'); }
  if(K==='altar'&&Z.tk>=25){ Z.tk=0; const L=RL_DEAD[t]; if(!L.length||count(t)>=POP_CAP) return; const type=L.pop();
    const u=spawn(type,t,Z.x+rand(-1.5,1.5),Z.z+rand(-1.5,1.5)); flashes.push({p:u.pos.clone().setY(u.pos.y+1),r0:.3,r1:2.4,t:0,life:.6,col:'#fff1a0'}); puffDir(u.pos,UP,12,2,.6,'#fff1a0',.12,1.2); sfx('heal',u.pos,1);
    if(t===myTeam()) callout(u,'Risen again','#fff1a0'); }
}
function rlOnDeath(t){ if(!RL.on||t.team>1||!t.isUnit||t.T.worker||t.type==='giant'||t.type==='hades') return; const L=RL_DEAD[t.team]; L.push(t.type); if(L.length>30) L.shift(); }

/* ---------- neutral camps: bandits and ogres guard gold ---------- */
// They belong to neither army (team 2), stay near their camp and attack anyone who comes close. The army that
// strikes the last blow on the last of them takes the camp's gold; the camp is filled again after three minutes.
const RL_NCAMPS=[{x:-24,z:-107,kind:'bandits',gold:300},{x:24,z:107,kind:'bandits',gold:300},{x:-87,z:136,kind:'ogres',gold:450},{x:87,z:-136,kind:'ogres',gold:450}];
const NCAMP_UNITS={bandits:['sword','sword','sword','sword','spear'],ogres:['giant','sword','sword']};
function rlNeutralTeam(){ if(TEAM[2]) return; const b=TEAM[1];
  TEAM[2]=Object.assign({},b,{cape:'#5a4a2a',bronze:new THREE.MeshPhongMaterial({color:'#8a7a5a',specular:'#c9b08a',shininess:30,side:THREE.DoubleSide}),crest:lam('#6a5a3a'),lambda:lam('#5a4a2a'),
    body:new THREE.Color('#2e2418'),bar:new THREE.Color('#d8c08a'),acc:lam('#7a6a4a'),acc2:lam('#9a8a6a')}); }
function rlCampsReset(){
  for(const C of RL_NCAMPS){ C.units=[]; C.respawn=0; C.cleared=false; }
  if(!RL.on||NET.guest) return;
  for(const C of RL_NCAMPS) rlCampFill(C);
}
function rlCampFill(C){
  rlNeutralTeam(); C.units=[]; C.cleared=false;
  NCAMP_UNITS[C.kind].forEach((type,i)=>{ const a=i/NCAMP_UNITS[C.kind].length*6.28, x=C.x+Math.cos(a)*2.5, z=C.z+Math.sin(a)*2.5;
    const u=makeUnit(type,2,x,z,{col:TEAM[2].body}); u.isUnit=true; u.camp=C; u.post={x,z}; if(type==='giant'){ u.maxHp=u.hp=1500; } units.push(u); C.units.push(u); });
}
function rlCampBrain(u,dt){
  const C=u.camp; u.retarget-=dt;
  if(u.retarget<=0||(u.target&&(!u.target.alive||u.target.state==='stunned'))){ u.retarget=.4+Math.random()*.2; let best=null,bd=13*13;
    gridEach(C.x,C.z,15,o=>{ if(!o.alive||o.team>1||!o.isUnit||!canTarget(u,o)) return; const d=(o.pos.x-C.x)**2+(o.pos.z-C.z)**2; if(d<bd){ bd=d; best=o; } }); u.target=best; }
  const t=u.target;
  if(t&&Math.hypot(t.pos.x-C.x,t.pos.z-C.z)<18){ const dx=t.pos.x-u.pos.x, dz=t.pos.z-u.pos.z; fightBrain(u,t,dx,dz,Math.hypot(dx,dz)||1e-3); return true; }
  u.target=null; const dx=u.post.x-u.pos.x, dz=u.post.z-u.pos.z, d=Math.hypot(dx,dz);
  if(d>.6){ const sp=u.T.speed*.7; u.desired.set(dx/d*sp,0,dz/d*sp); u.faceGoal=Math.atan2(dx,dz); } else { u.desired.set(0,0,0); if(u.hp<u.maxHp) u.hp=Math.min(u.maxHp,u.hp+u.maxHp*.02*dt); }
  return true;
}
function rlCampDeath(t){
  const C=t.camp; if(!C||C.cleared) return; if(C.units.some(u=>u.alive&&u!==t)) return;
  C.cleared=true; C.respawn=game.time+180; const w=t.lastHitTeam;
  if(w===0||w===1){ game.gold[w]+=C.gold; if(game.mode==='battle'&&!game.demo){ if(w===myTeam()){ sfx('coin',t.pos,1); toast('Camp cleared · +'+C.gold+' '+money(w)); alertPush('Camp cleared · +'+C.gold+' '+money(w),'good',t.pos.x,t.pos.z); } else toast(teamName(w)+' cleared a '+(C.kind==='ogres'?'ogre den':'bandit camp')); } }
}
function rlCampsStep(){ if(NET.guest) return; for(const C of RL_NCAMPS) if(C.cleared&&C.respawn&&game.time>C.respawn) rlCampFill(C); }

/* ---------- veteran regiments ---------- */
// a regiment's kills give it rank: ★ at 4, ★★ at 10, ★★★ at 20. Each star: +8% damage dealt, 6% less taken.
const VET_AT=[4,10,20];
function vetKill(src){
  if(game.classicMix||!src||!src.reg||game.mode!=='battle') return; const r=src.reg; r.kills=(r.kills||0)+1;
  const rank=r.kills>=VET_AT[2]?3:r.kills>=VET_AT[1]?2:r.kills>=VET_AT[0]?1:0;
  if(rank>(r.rank||0)){ r.rank=rank; if(r.team===myTeam()){ callout(src,'Veterans '+'★'.repeat(rank),'#ffd36b'); sfx('upgrade',src.pos,.6); } if(selRegs.includes(r)) updateRegbar(); }
}
const vetDealt=src=>src&&src.reg&&src.reg.rank?1+.08*src.reg.rank:1, vetTaken=t=>t.reg&&t.reg.rank?1-.06*t.reg.rank:1;
let STAR_GEO=null, STAR_MAT=null;
function vetStars(r){ if(!r.banner) return; const n=r.rank||0; if(!n&&!r.stars) return;
  if(!r.stars){ if(!STAR_GEO){ STAR_GEO=new THREE.OctahedronGeometry(.075,0); STAR_MAT=new THREE.MeshBasicMaterial({color:'#ffd36b'}); } r.stars=[0,1,2].map(i=>{ const m=new THREE.Mesh(STAR_GEO,STAR_MAT); m.position.set(-.45+i*.18,1.6,0); r.banner.add(m); return m; }); }
  r.stars.forEach((m,i)=>{ m.visible=i<n; m.rotation.y=game.time*2+i; }); }

/* ---------- formations ---------- */
// line (as before) · wedge: +25% charge damage · shield wall: ranged damage −45%, slower · loose: splash damage
// −40%, wider spacing · square: braced against charges and flanks, slowest
const FORMS=['line','wedge','shield','loose','square'], FORM_NAME={line:'Line',wedge:'Wedge',shield:'Shield wall',loose:'Loose order',square:'Square'};
const FORM_SPEED={wedge:1,shield:.7,loose:1,square:.55};
function formSlot(r,u,a,i,n,F,o){
  const fx=Math.sin(o.a), fz=Math.cos(o.a), rx=fz, rz=-fx, f=r.form;
  if(f==='wedge'){ const row=Math.floor((Math.sqrt(1+8*i)-1)/2), k=i-row*(row+1)/2; const lat=(k-row/2)*F.gap*1.1;
    return {x:o.x+rx*lat-fx*row*F.depth, z:o.z+rz*lat-fz*row*F.depth}; }
  if(f==='square'){ const side=Math.max(2,Math.ceil(n/4)+1), L=(side-1)*F.gap, per=4*(side-1), s=i%per, edge=Math.floor(s/(side-1)), k=s%(side-1), ring=Math.floor(i/per);
    const h=L/2-ring*F.gap; let lx,lz; if(edge===0){ lx=-h+k*(2*h/(side-1)); lz=h; } else if(edge===1){ lx=h; lz=h-k*(2*h/(side-1)); } else if(edge===2){ lx=h-k*(2*h/(side-1)); lz=-h; } else { lx=-h; lz=-h+k*(2*h/(side-1)); }
    return {x:o.x+rx*lx+fx*lz, z:o.z+rz*lx+fz*lz}; }
  const gk=f==='loose'?1.8:f==='shield'?.82:1, cols=f==='shield'?Math.min(n,F.cols+2):Math.min(n,F.cols), gap=F.gap*gk, dep=F.depth*(f==='loose'?1.8:f==='shield'?.85:1);
  const row=Math.floor(i/cols), col=i%cols, inRow=Math.min(cols,n-row*cols);
  return {x:o.x+rx*(col-(inRow-1)/2)*gap-fx*row*dep, z:o.z+rz*(col-(inRow-1)/2)*gap-fz*row*dep};
}
const SPLASH={giant:1,bomber:1,wizard:1,hades:1,cerberus:1};
function formTaken(t,src){ const f=t.reg&&t.reg.form; if(!f||f==='line'||!src||!src.T) return 1;
  if(f==='shield'&&src.T.ranged&&t.spd<2.2) return .55; if(f==='loose'&&SPLASH[src.type]) return .6; if(f==='loose'&&!src.T.ranged) return 1.1; return 1; }

/* ---------- each step on Riverlands ---------- */
function rlSysStep(dt){
  dnStep();
  RL.sysT=(RL.sysT||0)-dt; if(RL.sysT<=0){ RL.sysT=.5; if(game.mode==='battle'){ stealthTick(dnNight()); if(!NET.guest) supplyTick(); rlCampsStep(); } }
  if(game.mode==='battle') for(const r of regs) if(r.rank||r.stars) vetStars(r);
}
// Riverlands damage modifiers: wading (+25% taken), an ambush's first blows (+40%), ninjas at night (+35%)
function rlSysMul(t,src){ let k=1; if(t.wadeT>game.time) k*=1.25;
  if(src&&src.ambushT>game.time) k*=1.4; if(src&&src.type==='ninja'&&dnNight()>.5) k*=1.35; return k; }
