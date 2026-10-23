/* ---------------- statues + mines ---------------- */
function setupStatues(hpArr){
  for(const st of statues){ if(st.fig){ destroyGear(st.fig); if(st.fig.rag){ const i=corpses.indexOf(st.fig); if(i>=0) corpses.splice(i,1);} } scene.remove(st.ped); }
  statues.length=0;
  for(let t=0;t<2;t++){
    const x=BASE_X[t], gy=H(x,0);
    const ped=new THREE.Group(); const b1=mesh(new THREE.BoxGeometry(3.2,1.3,3.2),M.stoneD,0,.65,0), b2=mesh(new THREE.BoxGeometry(2.6,.5,2.6),M.stone,0,1.55,0);
    b1.receiveShadow=b2.receiveShadow=true; ped.add(b1,b2);
    const band=mesh(new THREE.BoxGeometry(3.24,.18,3.24),TEAM[t].acc,0,1.15,0); ped.add(band);
    ped.position.set(x,gy,0); scene.add(ped);
    const sty=FAC(t).statue, fig=makeUnit(sty,t,x,0,{s:sty==='dread'?2.55:3,statue:true,ai:false,gy:gy+1.8,col:STONE_C,thick:1});
    fig.face=fig.faceGoal=t===0?Math.PI/2:-Math.PI/2;
    // the Order raises a swordsman; Chaos a Dreadguard leaning on his planted axe
    fig.statuePose=sty==='dread'?fillPose({R:[.1,-.25,.42],wR:[0,-1,.08],L:[-.04,-.22,.42],lean:.05,crouch:.03},POSES.dread.idle)
      :fillPose({R:[.12,.62,.14],wR:[0,1,.12],L:[-.24,-.32,.14],lean:-.04,crouch:0},POSES.sword.idle);
    for(let i=0;i<40;i++){ fig.spd=0; buildSkel(fig,fig.statuePose,.016); }
    updateGear(fig);
    const shp=(hpArr&&hpArr[t])||2600; statues.push({team:t,pos:new V3(x,gy,0),hp:shp,max:shp,ped,fig,isStatue:true});
  }
  // gold mines
  if(!setupStatues.mines){ setupStatues.mines=true;
    for(let t=0;t<2;t++){ const c=MINE[t]; c.y=H(c.x,c.z);
      for(let i=0;i<7;i++){ const a=i/7*Math.PI*2, r=i?rand(.5,1.1):0, s=i?rand(.35,.6):.85; const m=mesh(GEO.goldRock,M.gold,c.x+Math.cos(a)*r,c.y+s*.5,c.z+Math.sin(a)*r); m.scale.setScalar(s); m.rotation.set(rand(0,3),rand(0,3),0); m.receiveShadow=true; scene.add(m); mineMeshes.push({m,dy:s*.5,t}); } } }
  syncMines();
}
// a Chaos army's mine is a cluster of soul crystals glowing red out of the ground (its own seeded shapes)
let crystalMat=null;
function syncMines(){
  for(let t=0;t<2;t++){ const chaos=facOf(t)==='chaos';
    if(chaos&&!MINE_X[t]){ const c=MINE[t], g=new THREE.Group(); let sd=11+t; const R=()=>(sd=(sd*16807)%2147483647)/2147483647;
      crystalMat=crystalMat||new THREE.MeshPhongMaterial({color:'#ff6a4a',emissive:'#9a1408',specular:'#ffd0c0',shininess:70});
      const geo=new THREE.OctahedronGeometry(1,0);
      for(let i=0;i<9;i++){ const a=i/9*Math.PI*2, r=i?.45+R()*.7:0, h=i?.5+R()*.6:1.25, m=new THREE.Mesh(geo,crystalMat);
        m.position.set(Math.cos(a)*r,h*.45,Math.sin(a)*r); m.scale.set(.18+R()*.1,h,.18+R()*.1); m.rotation.set((R()-.5)*.7,R()*3,(R()-.5)*.7); m.castShadow=true; g.add(m); }
      const base=new THREE.Mesh(new THREE.CircleGeometry(1.5,20),new THREE.MeshLambertMaterial({color:'#2a1612'})); base.rotation.x=-Math.PI/2; base.position.y=.03; g.add(base);
      g.position.set(c.x,H(c.x,c.z),c.z); scene.add(g); MINE_X[t]=g; emitReg(crystalMat,'e'); }
    const cl=MAP.id==='classic';   // the classic field's two mines; a bigger map shows its own (37d)
    if(MINE_X[t]){ MINE_X[t].visible=chaos&&cl; MINE_X[t].position.y=H(MINE[t].x,MINE[t].z); }
    for(const mm of mineMeshes) if(mm.t===t) mm.m.visible=!chaos&&cl; }
  if(MAP.id!=='classic') rlSyncMines();
}
function hitStatue(st,dmg){
  if(game.mode!=='battle'||st.hp<=0||game.over>0) return;
  if(NET.guest){ puff(new V3(st.pos.x,st.pos.y+2.5,st.pos.z),2,.35,2,'#d9cdb6'); sfx('stone',st.pos,.6); return; }   // the host's snapshot carries the statue's health
  st.hp-=dmg; puff(new V3(st.pos.x,st.pos.y+2.5,st.pos.z),2,.35,2,'#d9cdb6'); sfx('stone',st.pos,.8);
  if(st.team===myTeam()) narrate('underAttack',30); else if(st.hp<st.max*.3&&!st.crumbleSaid){ st.crumbleSaid=true; narrate('enemyCrumbling'); }
  if(st.hp<=0){ st.hp=0;
    if(NET.host) netCapOver(1-st.team,'statue_destroyed');
    const fig=st.fig; fig.av.set(0,0,0); toRagdoll(fig,new V3(st.team===0?-3:3,4,rand(-1,1)),{}); fig.rag.keep=true;
    puff(st.pos,14,.9,4,'#cbbd9f'); shakeAt(st.pos,.5);
    game.over=game.demo?4:2.6; game.winner=1-st.team; sfx('crumble',st.pos,1.4); narrate(st.team===myTeam()?'defeat':'victory'); showBanner(teamName(1-st.team)+' wins','statue destroyed',2.4); }
}

/* ---------------- spawning / AI ---------------- */
function spawn(type,team,x,z){
  if(x===undefined){ x=BASE_X[team]+(team?-3.2:3.2)+rand(-.8,.8); z=rand(-5.5,5.5); }
  const u=makeUnit(type,team,x,z); u.isUnit=true; units.push(u); assignRegiment(u); if(game.mode==='battle'&&game.stance) assignSlots(team); return u;
}
function count(team,type){let n=0; for(const u of units) if(u.alive&&u.team===team&&(!type||u.type===type)) n++; return n;}
function autoSpend(team){
  if(count(team)>=POP_CAP) return;
  let pick;
  const cq=castleOn(), wk=FAC(team).worker;
  if(count(team,wk)+(cq?queuedType(team,wk):0)<aiWorkerTarget(team)) pick=wk;   // workers to a target that moves with the battle (34b)
  else if(game.classicMix){ const r=Math.random(); pick=r<.38?'sword':r<.62?'archer':r<.82?'spear':'giant'; }   // the original four-type army (regression tests)
  else pick=aiPick(team);   // the faction's mix, weighted against what the enemy fields (34b); Hellcrawlers come up out of their pit in packs (below)
  const cost=TYPES[pick].cost;
  if(cq&&pick!==wk&&aiSaving(team)) return;   // saving up for research
  if(cq&&pick==='crawler'){ const n=Math.min(3,Math.floor(game.gold[team]/cost),POP_CAP-count(team)-queued(team)); if(n>0&&queuedType(team,pick)<4){ game.gold[team]-=cost*n; for(let i=0;i<n;i++) recruit(pick,team); } }
  else if(cq){ const m=unitMana(pick); if(game.gold[team]>=cost&&game.mana[team]>=m&&count(team)+queued(team)<POP_CAP&&queuedType(team,pick)<3){ game.gold[team]-=cost; game.mana[team]-=m; recruit(pick,team); } }
  else if(game.gold[team]>=cost){ game.gold[team]-=cost; spawn(pick,team); }
}
/* ---------- spatial hash: neighbour queries stay cheap with hundreds of units ---------- */
let GC=3, GX0=-48, GZ0=-21, GNX=32, GNZ=14, gridCells=Array.from({length:GNX*GNZ},()=>[]);
// a bigger map needs a bigger grid (the classic one keeps its exact cells, so its battles replay identically)
function setGrid(x0,z0,nx,nz,c){ c=c||3; if(GX0===x0&&GZ0===z0&&GNX===nx&&GNZ===nz&&GC===c) return; GC=c; GX0=x0; GZ0=z0; GNX=nx; GNZ=nz; gridCells=Array.from({length:GNX*GNZ},()=>[]); }
const gI=x=>{ const i=Math.floor((x-GX0)/GC); return i>0?(i>=GNX?GNX-1:i):0; }, gJ=z=>{ const j=Math.floor((z-GZ0)/GC); return j>0?(j>=GNZ?GNZ-1:j):0; };   /* a bad position lands in a corner cell instead of stopping the game */
function gridBuild(){ for(const c of gridCells) c.length=0; for(const u of units) if(u.alive) gridCells[gJ(u.pos.z)*GNX+gI(u.pos.x)].push(u); }
// calls fn(o) for every unit in the cells overlapping the square of radius r (fn returns false to stop)
function gridEach(x,z,r,fn){ const i0=gI(x-r),i1=gI(x+r),j0=gJ(z-r),j1=gJ(z+r);
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const c=gridCells[j*GNX+i]; for(let k=0;k<c.length;k++) if(fn(c[k])===false) return; } }
function nearestFoe(x,z,team,r,who){ let best=null,bd=r*r;
  gridEach(x,z,r,o=>{ if(!o.alive||o.team===team||o.state==='stunned'||(who&&!canTarget(who,o))) return; const dx=o.pos.x-x,dz=o.pos.z-z,d=dx*dx+dz*dz; if(d<bd){bd=d;best=o;} });
  return best; }
function nearestEnemy(u,maxD){
  let best=null,bd=maxD?maxD*maxD:1e18;
  const test=o=>{ if(!o.alive||o.team===u.team||o.state==='stunned'||!canTarget(u,o)) return;
    const dx=o.pos.x-u.pos.x,dz=o.pos.z-u.pos.z, crowd=(o.engaged||0)-(u.target===o?1:0), pen=Math.max(0,crowd-(u.T.swarm?3:1))*2.6;   // a Hellcrawler pack piles onto the front line, four to a victim
    const d=dx*dx+dz*dz+pen*pen; if(d<bd){bd=d;best=o;} };
  if(maxD){ gridEach(u.pos.x,u.pos.z,maxD,test); return best; }
  for(let r=9;;r*=3){ gridEach(u.pos.x,u.pos.z,r,test); if(best&&Math.sqrt(bd)<=r||r>=(RL.on?243:81)) break; }
  return best;
}
const _goal=new V3();
/* ---------------- army orders, formations, morale ---------------- */
const DIRX=[1,-1];
// rank offsets behind the line: spears in front, swords next, giants, archers at the back
const RANK={spear:0,sword:-1.8,giant:-3.9,archer:-6.2};
function setStance(team,st){
  if(st==='hold'){ const xs=units.filter(u=>u.alive&&u.team===team&&u.isUnit&&!u.T.worker).map(u=>u.pos.x);
    game.holdX[team]=xs.length?clamp(xs.reduce((a,b)=>a+b,0)/xs.length+DIRX[team]*2.5,BASE_X[0]+6,BASE_X[1]-6):BASE_X[team]+DIRX[team]*10; }
  game.stance[team]=st;
  if(team===myTeam()) for(const [id,v] of [['oDefend','defend'],['oHold','hold'],['oCharge','charge']]) $('#'+id).setAttribute('aria-pressed',st===v);
  assignSlots(team);
}
function lineX(team){ return game.stance[team]==='hold'?game.holdX[team]:BASE_X[team]+DIRX[team]*9; }
// Army formation: each regiment stands as its own block (ranks of FORM.cols), regiments sit side by side,
// and when a type's regiments no longer fit across the field they form another line behind.
// Spartans in front, then swordsmen, giants, archers at the back.
const FORM_ORDER=['spear','sword','giant','archer'], FIELD_W=27, BLOCK_GAP=1.6, LINE_GAP=1.3;
// A huge army packs its ranks tighter (down to ~72% spacing) so it fits between a point 6 m behind its statue
// and 26 m in front of it, leaving a no-man's-land in the middle instead of the two fronts deploying into each other.
const ARMY_ROOM=32, ARMY_BACK=6;
function formLines(team,k){
  const lines=[], bg=BLOCK_GAP*k;
  for(const type of FORM_ORDER){
    const F0=FORM[type], F={cols:F0.cols,gap:F0.gap*k,depth:F0.depth*k}, blocks=[];
    for(const r of regs) if(r.team===team&&r.type===type){ const a=r.units.filter(u=>u.alive&&u.isUnit); if(a.length) blocks.push(a); }
    const free=units.filter(u=>u.alive&&u.team===team&&u.type===type&&u.isUnit&&!u.reg); if(free.length) blocks.push(free);
    let line=null;
    for(const b of blocks){ const cols=Math.min(F.cols,b.length), bw=(cols-1)*F.gap, rows=Math.ceil(b.length/cols);
      if(!line||line.w+bg+bw>FIELD_W){ line={F,blocks:[],w:-bg,rows:0}; lines.push(line); }
      line.blocks.push({b,cols,bw}); line.w+=bg+bw; line.rows=Math.max(line.rows,rows); }
  }
  let depth=0; for(const L of lines) depth+=L.rows*L.F.depth+LINE_GAP*k;
  return {lines,depth,k,bg};
}
function assignSlots(team){
  const dir=DIRX[team];
  let P=formLines(team,1);
  while(P.depth>ARMY_ROOM&&P.k>.73) P=formLines(team,P.k-.06);
  const back=BASE_X[team]-dir*ARMY_BACK, d=P.depth-LINE_GAP*P.k;
  let x=game.stance[team]==='hold'?game.holdX[team]:BASE_X[team]+dir*clamp(P.depth+3,9,ARMY_ROOM-ARMY_BACK);
  x=dir>0?Math.max(x,back+d):Math.min(x,back-d); // never push the rear ranks off the field
  for(const L of P.lines){ let z=-L.w/2;
    for(const B of L.blocks){ const n=B.b.length; B.b.sort((a,b)=>a.id-b.id);
      B.b.forEach((u,i)=>{ const row=Math.floor(i/B.cols), col=i%B.cols, inRow=Math.min(B.cols,n-row*B.cols), off=(B.cols-inRow)*L.F.gap/2;
        u.slot={x:x-dir*row*L.F.depth,z:clamp(z+off+col*L.F.gap,-14,14)}; });
      z+=B.bw+P.bg; }
    x-=dir*(L.rows*L.F.depth+LINE_GAP*P.k); }
}
function moraleTick(u,dt){
  if(game.mode!=='battle'||!u.isUnit||u.team>1) return;
  u.mT=(u.mT||0)-dt; if(u.mT>0) return; u.mT=.25; const step=.25;
  let foes=0,friends=0,giantNear=false;
  gridEach(u.pos.x,u.pos.z,6,o=>{ if(!o.alive||o===u) return; const d=Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z); if(d>6) return;
    if(o.team===u.team) friends++; else { foes++; if(o.type==='giant'&&d<4) giantNear=true; } });
  const resist=u.type==='giant'?.3:u.type==='spear'?.75:1;
  let dm=0;
  if(foes>2*(friends+1)) dm-=7; if(giantNear&&u.type!=='giant') dm-=5;
  if(!foes) dm+=5; if(u.noSupply) dm-=6.5; if(Math.abs(u.pos.x-BASE_X[u.team])<9) dm+=10; if(game.stance[u.team]==='charge'&&friends>=3) dm+=1.5; if(u.auraT>game.time) dm+=4; if(u.hero) dm=Math.max(dm,0);
  u.morale=clamp(u.morale+(dm<0?dm*resist:dm)*step,0,100);
  if(!u.routing&&u.morale<22&&u.type!=='giant'){ u.routing=true; u.target=null; if(cam.follow===u) showBanner('Routing!','morale broke',1.2); }
  else if(u.routing&&(u.morale>55||Math.abs(u.pos.x-BASE_X[u.team])<7)){ u.routing=false; u.morale=Math.max(u.morale,60); }
}
function shakeMorale(dead){
  if(game.mode!=='battle') return;
  for(const o of units){ if(!o.alive||o.team!==dead.team||o===dead) continue; const d=Math.hypot(o.pos.x-dead.pos.x,o.pos.z-dead.pos.z);
    if(d<(dead.hero?14:7)) o.morale=Math.max(0,o.morale-(dead.hero?30:dead.type==='giant'?24:9)*(o.type==='giant'?.3:1)); }
}
