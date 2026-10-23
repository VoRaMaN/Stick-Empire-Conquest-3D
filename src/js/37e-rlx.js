/* ================= Riverlands rules: long range, sight, the river, fog of war, zone bonuses, the general =================
   Everything here is switched on only on the Riverlands map (RL.on); the classic field keeps its own rules exactly. */

/* ---------- long range: the bows and spells reach across a map ten times the size ---------- */
// archers, wing archers and soul harvesters shoot five times as far (+400%), the casters and bombers four times (+300%)
const RL_RANGE={archer:5,wing:5,harvester:5,wizard:4,oracle:4,bomber:4};
function rlRangeMode(on){
  for(const k in RL_RANGE){ const T=TYPES[k]; if(!T) continue; if(T.range0===undefined) T.range0=T.range;
    T.range=on?T.range0*RL_RANGE[k]:T.range0; } }
// how far a soldier sees: three times the old engagement distance (+200%), and at least as far as he shoots
function rlSight(u){ const T=u.T; let r=T.worker?26:42; if(T.ranged) r=Math.max(r,T.range+3); if(u.fl) r+=8; return r*(1-.4*dnNight()); }   // night: 40% less
// the old look-out distances, tripled on Riverlands
const sightK=()=>RL.on?3:1;

/* ---------- the river: only the bridges cross it ---------- */
// a soldier on foot whose way runs into the water walks to the best bridge, over it, and on to where he was going
function rlRoute(u,dt){
  if(u.fl&&u.fl.air){ u.rlX=null; return; }
  const d=u.desired, sp=Math.hypot(d.x,d.z), px=u.pos.x, pz=u.pos.z, rx=rlRiverX(pz), side=px<rx?-1:1;
  let X=u.rlX;
  if(sp<.15) return;
  const G=rlGoal(u); if(!G){ u.rlX=null; return; }
  const gside=G.x<rlRiverX(G.z)?-1:1;                               // which bank he is really going to
  if(!X){
    if(rlDeck(px,pz)>-1e8||gside===side) return;                     // on a bridge already, or no need to cross
    const gx=G.x, gz=G.z;
    let best=0, bc=1e9;
    rlCrossings().forEach((B,i)=>{ const A=side<0?B.w:B.e, E=side<0?B.e:B.w, c=(Math.hypot(A[0]-px,A[1]-pz)+Math.hypot(gx-E[0],gz-E[1]))*(B.ford?1.5:1); if(c<bc){ bc=c; best=i; } });   // a ford is slow: only worth it when much shorter
    X=u.rlX={b:best,side,ph:0,t:0};
  }
  X.t+=dt; if(X.t>45){ u.rlX=null; return; }
  const B=rlCrossings()[X.b], s=X.side, A0x=(s<0?B.w[0]:B.e[0])+B.ax*s*2.5, A0z=(s<0?B.w[1]:B.e[1])+B.az*s*2.5,
    A1x=(s<0?B.e[0]:B.w[0])-B.ax*s*2.5, A1z=(s<0?B.e[1]:B.w[1])-B.az*s*2.5;
  if(X.ph===0){
    if(gside===s){ u.rlX=null; return; }                             // changed his mind: his goal is on this bank now
    if(Math.hypot(A0x-px,A0z-pz)<1.8) X.ph=1;
  }
  const wx=X.ph?A1x:A0x, wz=X.ph?A1z:A0z, dx=wx-px, dz=wz-pz, dd=Math.hypot(dx,dz)||1;
  if(X.ph&&(dd<1.8||(side!==s&&rlDeck(px,pz)<-1e8&&Math.abs(px-rx)>rlRiverW(pz)+1.5))){ u.rlX=null; return; }
  const v=Math.max(sp,u.T.speed*.75); d.x=dx/dd*v; d.z=dz/dd*v; if(!u.action) u.faceGoal=Math.atan2(dx,dz);
}
// where a soldier is really going: his regiment's place, the enemy he is after, his place in the army, or the enemy statue
function rlGoal(u){
  const ro=u.reg&&game.mode==='battle'?u.reg.order:null;
  if(ro&&(ro.kind==='move'||ro.kind==='hold')) return regSlot(u.reg,u);
  if(u.target&&u.target.alive&&u.target.pos) return u.target.pos;
  if(ro&&ro.kind==='attack'){ const t=ro.unit&&ro.unit.alive?ro.unit:(ro.target?regAlive(ro.target)[0]:null); if(t) return t.pos; }
  if(u.T.worker) return null;
  if(u.slot&&typeof u.slot==='object'&&game.stance[u.team]!=='charge') return u.slot;
  const st=statues[1-u.team]; return st&&st.pos?st.pos:null;
}
// no wading: a soldier who steps into the river is put back on the bank (or the bridge) he came from
function rlRiverCollide(u){
  if(u.fl&&u.fl.air) return;
  const rx=rlRiverX(u.pos.z), W=rlRiverW(u.pos.z)*1.04, dx=u.pos.x-rx;
  if(Math.abs(dx)>=W||rlDeck(u.pos.x,u.pos.z)>-1e8||rlFordK(u.pos.z)>.45) return;   // bridges and fords
  if(u.last&&rlDeck(u.last.x,u.last.z)>-1e8){ u.pos.x=u.last.x; u.pos.z=u.last.z; return; }
  const s=u.last?(Math.sign(u.last.x-rlRiverX(u.last.z))||Math.sign(dx)||1):(Math.sign(dx)||1);
  u.pos.x=rx+s*W; rlTouch(u,s,0);
}

/* ---------- dodging and parrying arrows, bolts and spells ---------- */
// a soldier who sees a shot coming may step out of its way, or take it on his blade or shield
function rlProjDefense(t,u,c){
  if(!t||!t.alive||!t.isUnit||t.state==='stunned'||t.fin||(t.action&&!t.action.c.idle)||t.defQ||t.routing||t.inCastle||t.wadeT>game.time) return;   // nobody dodges knee-deep in a ford
  const o=DEF_ODDS[t.type], CL=CLIPS[t.type]; if(!o||!CL) return;
  const d=Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z); if(d<5) return;
  const K=.55, r=Math.random(), pd=o.dodge*K, pg=(o.block+o.parry)*K;
  let kind=r<pd?'dodge':r<pd+pg?(Math.random()*(o.block+o.parry)<o.parry?'parry':'block'):null;
  if(!kind||!CL[kind]) kind=kind&&CL.block?'block':null; if(!kind) return;
  const ev=(c.ev||[]).find(e=>e.e==='fire'||e.e==='cast'||e.e==='throw'||e.e==='bolt'||e.e==='shoot'||e.e==='release'), tf=ev?ev.t:(c.dur||1)*.6;
  const fl=u.T.bolt?clamp(d/45,.1,.8):(u.type==='archer'?arrowT(d):clamp(d/16,.3,2.4));
  const lead={block:.22,parry:.14,dodge:.2}[kind];
  t.defQ={kind,from:u,t:Math.max(0,tf+fl-lead)+rand(-.03,.03)};
}
// a spell or bomb that reaches someone mid-dodge, or meets his guard face on, does him no harm
function rlAvoid(t,src){
  const nm=t.action&&t.action.c.name; if(!nm) return false;
  const dx=src.pos.x-t.pos.x, dz=src.pos.z-t.pos.z, d=Math.hypot(dx,dz)||1; if(d<4) return false;
  if(nm==='dodge'){ puff(t.pos,2,.18,1); return true; }
  if((nm==='block'||nm==='parry')&&(dx*t.fwdW.x+dz*t.fwdW.z)/d>.2){ const g=guardPoint(t,new V3()); puff(g,5,.06,3,'#ffe9a8'); sfx('clang',g,.5,{rate:1.3}); return true; }
  return false;
}

/* ---------- capture zones: what holding each one gives ---------- */
// the two markets (B, C) pay gold; the two shrines (A, D) give mana and sharpen the whole army. Every zone held
// is also a watchtower (it reveals the ground round it) and a field hospital (soldiers standing in it heal).
const RL_KIND={market:{name:'Market',gold:6,mana:0,dmg:0,txt:'+6 gold a second'},shrine:{name:'Shrine',gold:2,mana:2,dmg:.1,txt:'+2 mana a second · +10% damage'},
  militia:{name:'Militia village',gold:1,mana:0,dmg:0,txt:'a militia swordsman every 30 s'},tower:{name:'Watchtower',gold:1,mana:0,dmg:0,txt:'sees 70 m around'},
  altar:{name:'Resurrection shrine',gold:0,mana:1,dmg:0,txt:'raises one of your fallen every 25 s'}};
const RL_ZKIND={A:'shrine',B:'market',C:'market',D:'shrine',E:'militia',F:'militia',G:'tower',H:'tower',I:'altar',J:'altar'};
const RL_HEAL=3, RL_ZSIGHT=30;
function rlKind(Z){ return RL_KIND[RL_ZKIND[Z.id]||'market']; }
function rlZoneBonusTick(dt){   // every quarter second, on the host
  RL.dmg=RL.dmg||[1,1]; RL.dmg[0]=RL.dmg[1]=1;
  for(const Z of RL.zones){ if(Z.owner<0) continue; const K=rlKind(Z); RL.dmg[Z.owner]+=K.dmg; rlObjTick(Z,dt);
    gridEach(Z.x,Z.z,RL_ZR,u=>{ if(u.alive&&u.isUnit&&u.team===Z.owner&&u.hp<u.maxHp&&(u.pos.x-Z.x)**2+(u.pos.z-Z.z)**2<RL_ZR*RL_ZR){ u.hp=Math.min(u.maxHp,u.hp+RL_HEAL*dt); if(u.st) u.st.healF=Math.max(u.st.healF||0,.25); } }); }
}
const rlDmgMul=src=>RL.dmg&&src&&src.team!==undefined&&RL.dmg[src.team]||1;

/* ---------- fog of war ---------- */
// The valley is cut into 128 × 128 cells (3 m). Each army sees round every soldier, its castle and statue, and the
// zones it holds; it remembers the ground it has seen. An enemy outside what you can see is hidden and can't be
// targeted; ground you have never seen is dark, ground you saw before is dim.
const FOW={N:128,X0:-200,S:400/128,vis:[null,null],exp:[null,null],disp:null,tex:null,uTex:{value:null},uOn:{value:0},t:0,on:false,discs:new Map(),reveal:false};
function fowInit(){ if(FOW.tex) return; const N=FOW.N;
  for(const t of [0,1]){ FOW.vis[t]=new Uint8Array(N*N); FOW.exp[t]=new Uint8Array(N*N); }
  FOW.disp=new Uint8Array(N*N*4); for(let i=0;i<N*N;i++){ FOW.disp[i*4]=FOW.disp[i*4+1]=FOW.disp[i*4+2]=70; FOW.disp[i*4+3]=255; }
  FOW.tex=new THREE.DataTexture(FOW.disp,N,N,THREE.RGBAFormat,THREE.UnsignedByteType); FOW.tex.magFilter=FOW.tex.minFilter=THREE.LinearFilter;
  FOW.tex.wrapS=FOW.tex.wrapT=THREE.ClampToEdgeWrapping; FOW.tex.generateMipmaps=false; FOW.tex.needsUpdate=true; FOW.uTex.value=FOW.tex; }
function fowReset(){ fowInit(); for(const t of [0,1]){ FOW.vis[t].fill(0); FOW.exp[t].fill(0); } const D=FOW.disp; for(let i=0;i<D.length;i+=4){ D[i]=D[i+1]=D[i+2]=70; } FOW.tex.needsUpdate=true; FOW.t=0; }
function fowDisc(rc){ let L=FOW.discs.get(rc); if(L) return L; const a=[]; for(let j=-rc;j<=rc;j++) for(let i=-rc;i<=rc;i++) if(i*i+j*j<=rc*rc) a.push(i,j); L=new Int16Array(a); FOW.discs.set(rc,L); return L; }
function fowStamp(t,x,z,r,seen){ const N=FOW.N, ci=Math.floor((x-FOW.X0)/FOW.S), cj=Math.floor((z-FOW.X0)/FOW.S), rc=Math.round(r/FOW.S);
  const key=(ci*1024+cj)*256+rc; if(seen.has(key)) return; seen.add(key);
  const V=FOW.vis[t], L=fowDisc(rc); for(let k=0;k<L.length;k+=2){ const i=ci+L[k], j=cj+L[k+1]; if(i>=0&&j>=0&&i<N&&j<N) V[j*N+i]=1; } }
function fowUpdate(){
  const N=FOW.N, seen=[new Set(),new Set()];
  for(const t of [0,1]) FOW.vis[t].fill(0);
  for(const u of units){ if(!u.alive||!u.isUnit||u.team>1) continue; fowStamp(u.team,u.pos.x,u.pos.z,rlSight(u),seen[u.team]); }
  for(const t of [0,1]){ const sx=(t?1:-1)*(RL_CF+18); fowStamp(t,sx,-2.5,62,seen[t]); fowStamp(t,BASE_X[t],0,48,seen[t]); }
  for(const Z of RL.zones) if(Z.owner>=0) fowStamp(Z.owner,Z.x,Z.z,RL_ZKIND[Z.id]==='tower'?70:RL_ZSIGHT,seen[Z.owner]);
  const nk=dnNight(); if(nk>.3) for(const f of RL.fires) if(!f.small) for(const t of [0,1]) fowStamp(t,f.x,f.z,11,seen[t]);   // at night a fire lights the ground round it for everyone
  for(const t of [0,1]){ const V=FOW.vis[t], E=FOW.exp[t]; for(let k=0;k<N*N;k++) if(V[k]) E[k]=1; }
  // what this screen shows: its own army's view, eased so the edges don't jump
  const me=myTeam(), V=FOW.vis[me], E=FOW.exp[me], D=FOW.disp;
  for(let k=0;k<N*N;k++){ const tg=V[k]?255:E[k]?150:62, o=k*4, v=D[o]+(tg-D[o])*.55; D[o]=D[o+1]=D[o+2]=v; }
  FOW.tex.needsUpdate=true;
}
function fowStep(dt){
  FOW.on=RL.on&&game.mode==='battle'&&!game.demo;
  FOW.reveal=!FOW.on||game.over>0;
  FOW.uOn.value=FOW.on&&!FOW.reveal?1:0;
  if(!FOW.on) return; fowInit();
  FOW.t-=dt; if(FOW.t<=0){ FOW.t=.2; fowUpdate(); }
}
// can team see this soldier?
function fowSees(team,o){
  if(!FOW.on||o.team===team||team===undefined||team>1) return true;
  const N=FOW.N, i=Math.floor((o.pos.x-FOW.X0)/FOW.S), j=Math.floor((o.pos.z-FOW.X0)/FOW.S);
  if(i<0||j<0||i>=N||j>=N) return true; if(o.stealth&&stealthHides(team,o)) return false; return FOW.vis[team][j*N+i]===1; }
// can this screen see that spot? (glows, sparks, smoke, fire, blood, arrows and spells in the fog aren't drawn)
function fowVisXZ(x,z){ if(!FOW.on||FOW.reveal||!FOW.vis[0]) return true; const N=FOW.N, i=Math.floor((x-FOW.X0)/FOW.S), j=Math.floor((z-FOW.X0)/FOW.S);
  if(i<0||j<0||i>=N||j>=N) return true; return FOW.vis[myTeam()][j*N+i]===1; }
const fowVisP=p=>!FOW.on||fowVisXZ(p.x,p.z);
// hidden on this screen
const fowHidden=u=>FOW.on&&!FOW.reveal&&u.team!==myTeam()&&!fowSees(myTeam(),u);
// darken the valley's ground, trees, houses and walls by the fog texture (a few lines added to their own shaders)
function fowPatchMat(m){
  if(!m||!m.isMaterial||m.userData.fow||m.isShaderMaterial||m.isRawShaderMaterial) return; m.userData.fow=1;
  const prev=m.onBeforeCompile, own=m.customProgramCacheKey!==THREE.Material.prototype.customProgramCacheKey?m.customProgramCacheKey:null, base=prev?String(prev):'';
  m.onBeforeCompile=function(sh,r){ if(prev) prev.call(this,sh,r); fowInject(sh); };
  m.customProgramCacheKey=function(){ return (own?own.call(this):base)+'|fow'; };
  m.needsUpdate=true; }
function fowInject(sh){
  sh.uniforms.uFow=FOW.uTex; sh.uniforms.uFowOn=FOW.uOn;
  if(!sh.vertexShader.includes('#include <project_vertex>')||!sh.fragmentShader.includes('#include <fog_fragment>')) return;
  sh.vertexShader='varying vec2 vFowXZ;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n{ vec4 fw=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\n fw=instanceMatrix*fw;\n#endif\n fw=modelMatrix*fw; vFowXZ=fw.xz; }');
  sh.fragmentShader='uniform sampler2D uFow;\nuniform float uFowOn;\nvarying vec2 vFowXZ;\n'+sh.fragmentShader.replace('#include <fog_fragment>','if(uFowOn>0.5){ gl_FragColor.rgb*=texture2D(uFow,(vFowXZ+200.0)/400.0).r; }\n#include <fog_fragment>');
}
function fowPatchScene(){ fowInit(); if(RL.fowPatched||!RL.group) return; RL.fowPatched=true;
  RL.group.traverse(o=>{ if(!o.material) return; for(const m of Array.isArray(o.material)?o.material:[o.material]) fowPatchMat(m); });
  for(const C of CASTLES) if(C&&C.group) C.group.traverse(o=>{ if(!o.material) return; for(const m of Array.isArray(o.material)?o.material:[o.material]) fowPatchMat(m); }); }
// hide the enemy soldiers this screen can't see: their figure, health bar, weapons, cloak and banner
function fowHideGear(u,hide){
  if(!!u.fowH===hide) { if(hide) fowHideNow(u); return; }
  u.fowH=hide;
  if(hide) fowHideNow(u);
  else { if(u.G) for(const k in u.G){ const g=u.G[k]; if(g&&g.isObject3D&&u.fowV&&u.fowV[k]!==undefined) g.visible=u.fowV[k]; } u.fowV=null; if(u.cr) u.crVis=undefined; }
}
function fowHideNow(u){
  if(u.G){ u.fowV=u.fowV||{}; for(const k in u.G){ const g=u.G[k]; if(g&&g.isObject3D){ if(u.fowV[k]===undefined) u.fowV[k]=g.visible; g.visible=false; } } if(u.cr) u.crVis=false; }
  if(u.cape&&u.cape.cs){ const cp=u.cape, pa=cp.cs.g.attributes.position.array; pa.fill(0,cp.slot*72,cp.slot*72+72); cp.cs.g.attributes.position.needsUpdate=true; }
}
function fowDrawPrep(){ if(!RL.on) return; for(const u of units) if(u.alive) fowHideGear(u,fowHidden(u));
  for(const u of corpses) fowHideGear(u,FOW.on&&!FOW.reveal&&!fowVisXZ(u.pos.x,u.pos.z));   // the fallen, too: bodies, bows and strings
  for(const C of CASTLES) if(C) for(const g of C.garrison) fowHideGear(g,u_fowOut(g)); }
// an enemy soldier in a place this screen can't see (castle garrisons and corpses use this)
const u_fowOut=u=>FOW.on&&!FOW.reveal&&u.team!==myTeam()&&!fowVisXZ(u.pos.x,u.pos.z);
// the battlefield map: dark where never seen, dimmed where not seen now
function fowMinimap(c,w,h){
  if(!FOW.on||FOW.reveal||!FOW.vis[0]) return; const N=FOW.N;
  if(!FOW.mm){ const b=document.createElement('canvas'); b.width=b.height=N; FOW.mm=b; FOW.mmx=b.getContext&&b.getContext('2d'); FOW.mmImg=FOW.mmx?FOW.mmx.createImageData(N,N):null; }
  if(!FOW.mmImg) return; const me=myTeam(), V=FOW.vis[me], E=FOW.exp[me], P=FOW.mmImg.data;
  for(let k=0;k<N*N;k++){ const o=k*4; P[o]=8; P[o+1]=10; P[o+2]=14; P[o+3]=V[k]?0:E[k]?110:215; }
  FOW.mmx.putImageData(FOW.mmImg,0,0);
  const x0=mmX(FOW.X0,w), z0=mmZ(FOW.X0,h), x1=mmX(-FOW.X0,w), z1=mmZ(-FOW.X0,h);
  c.save(); c.imageSmoothingEnabled=true; c.drawImage(FOW.mm,x0,z0,x1-x0,z1-z0); c.restore();
}

/* ---------- online: the host's zones on every screen ---------- */
const rlNetZones=()=>RL.on&&RL.zones.length?RL.zones.map(Z=>[Math.round(Z.s*1000),Z.owner,Z.contest?1:0,Z.cap]):null;
function rlApplyNetZones(L){
  if(!RL.on||!L) return;
  L.forEach((q,i)=>{ const Z=RL.zones[i]; if(!Z) return; const was=Z.owner;
    if(q[1]!==was){ if(q[1]>=0) rlZoneTaken(Z,q[1]); else if(was>=0) rlZoneLost(Z,was); }
    Z.s=q[0]/1000; Z.owner=q[1]; Z.contest=!!q[2]; Z.cap=q[3]; });
}

/* ---------- the computer's general on Riverlands ---------- */
// More miners as the battle goes on (both mines worked), detachments sized to the enemy they will meet at a zone,
// a guard left on zones it holds, a fall-back when a detachment is outnumbered, raids on the enemy's miners with
// fast troops, everyone home when the castle is threatened, and a general push once it holds most of the valley.
function rlWorkerTarget(t){ return RL.on?clamp(5+Math.floor((game.bt||0)/35),5,12):3; }
function rlPow(x,z,R,team){ let p=0; gridEach(x,z,R,o=>{ if(o.alive&&o.isUnit&&o.team===team&&!o.T.worker&&(o.pos.x-x)**2+(o.pos.z-z)**2<R*R) p+=o.T.cost*o.hp/o.maxHp; }); return p; }
const regPow=r=>regAlive(r).reduce((a,u)=>a+u.T.cost*u.hp/u.maxHp,0);
const RL_FAST={ninja:1,hound:1,crawler:1,cerberus:1,wing:1,boner:1};
function rlAI(t){
  const foe=1-t, A=(RL.ai=RL.ai||[{},{}])[t], now=game.time;
  const mine=regs.filter(r=>r.team===t&&regAlive(r).length>=2&&!regAlive(r).some(u=>u.routing));
  if(!mine.length) return;
  // tasks end when the general calls the regiment back, or the order is done with
  for(const r of mine){ const T=r.rlTask; if(!T) continue;
    if(r.order.kind==='army'||r.order.kind==='charge'||(T.until&&now>T.until)){ r.rlTask=null; r.rlZone=null; } }
  const total=mine.reduce((a,r)=>a+regPow(r),0), sx=BASE_X[t], hx=sx+(t?-30:30);
  // 1. the castle is threatened: everyone home
  const home=rlPow(hx,-2,50,foe);
  if(home>Math.max(300,total*.35)){ for(const r of mine) if(r.rlTask){ r.rlTask=null; r.rlZone=null; r.order={kind:'army'}; } if(game.stance[t]==='charge') setStance(t,'defend'); return; }
  // 2. outnumbered detachments fall back to the nearest zone their army holds, or toward the castle
  for(const r of mine){ const T=r.rlTask; if(!T||T.k==='fall') continue; const c=regCenter(r), my=rlPow(c.x,c.z,22,t), en=rlPow(c.x,c.z,24,foe);
    if(en>Math.max(250,my*1.7)){ let best=null,bd=1e9; for(const Z of RL.zones) if(Z.owner===t&&!Z.contest){ const d=Math.hypot(Z.x-c.x,Z.z-c.z); if(d<bd&&d>15){ bd=d; best=Z; } }
      const p=best?{x:best.x,z:best.z}:{x:hx,z:-2}; orderMove(r,p,true); r.rlTask={k:'fall',until:now+18}; r.rlZone=null; } }
  // 3. zones: take the ones it doesn't hold and relieve the ones under attack, with enough strength to win
  const tasked=()=>mine.filter(r=>r.rlTask&&r.rlTask.k!=='guard').length, maxT=Math.min(4,Math.max(1,Math.floor(mine.length*.6)));
  const free=()=>mine.filter(r=>!r.rlTask&&r.order.kind!=='attack'&&r.order.kind!=='charge');
  const want=RL.zones.filter(Z=>Z.owner!==t||Z.n[foe]>0).sort((a,b)=>((b.owner===t)-(a.owner===t))||Math.hypot(a.x-sx,a.z)-Math.hypot(b.x-sx,b.z));
  for(const Z of want){ if(tasked()>=maxT) break;
    const sent=mine.filter(r=>r.rlZone===Z.id); let have=sent.reduce((a,r)=>a+regPow(r),0); const need=Math.max(350,rlPow(Z.x,Z.z,32,foe)*1.3);
    if(have>=need) continue;
    const F=free().sort((a,b)=>{ const ca=regCenter(a), cb=regCenter(b); return Math.hypot(ca.x-Z.x,ca.z-Z.z)-Math.hypot(cb.x-Z.x,cb.z-Z.z); });
    let k=sent.length;
    for(const r of F){ if(have>=need||k>=3) break; const off=(k-(k>0?1:0))*7*(k%2?1:-1);
      orderMove(r,{x:Z.x+(t?2:-2),z:Z.z+off*.6},true); r.rlZone=Z.id; r.rlTask={k:'zone',z:Z.id,until:now+90}; have+=regPow(r); k++; } }
  // 4. a taken zone keeps one regiment as its guard (when the army is big enough); the rest go back to the general
  for(const r of mine){ const T=r.rlTask; if(!T||T.k!=='zone') continue; const Z=RL.zones.find(z=>z.id===T.z); if(!Z||Z.owner!==t||Z.contest) continue;
    const others=mine.filter(o=>o!==r&&o.rlTask&&o.rlTask.k==='guard'&&o.rlTask.z===Z.id);
    if(!others.length&&mine.length>4){ r.rlTask={k:'guard',z:Z.id,until:now+120}; } else { r.rlTask=null; r.rlZone=null; r.order={kind:'army'}; } }
  // 5. raids: fast troops go for the enemy's miners now and then
  if(now>(A.raidT||40)){ A.raidT=now+rand(35,55);
    const raider=free().find(r=>RL_FAST[r.type]), miners=units.filter(u=>u.alive&&u.team===foe&&u.T.worker&&!u.inCastle);
    if(raider&&miners.length){ const c=regCenter(raider); miners.sort((a,b)=>Math.hypot(a.pos.x-c.x,a.pos.z-c.z)-Math.hypot(b.pos.x-c.x,b.pos.z-c.z));
      orderAttack(raider,null,miners[0],true); raider.rlTask={k:'raid',until:now+40}; } }
  // 6. holding most of the valley and stronger: push on the enemy castle
  const theirs=units.filter(u=>u.alive&&u.team===foe&&u.isUnit&&!u.T.worker).reduce((a,u)=>a+u.T.cost,0), ours=units.filter(u=>u.alive&&u.team===t&&u.isUnit&&!u.T.worker).reduce((a,u)=>a+u.T.cost,0);
  if(game.stance[t]!=='charge'&&rlHeld(t)>=3&&ours>theirs*1.15&&ours>2500){ setStance(t,'charge'); if(t===1&&game.mode==='battle'&&!game.demo){ showBanner(teamName(1).split(' ').pop()+' marches on your castle!','',1.6); sfx('hornEnemy'); } }
}
