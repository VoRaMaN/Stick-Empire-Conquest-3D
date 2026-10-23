/* ================= The Hellpit: where the Crimson Horde's Hellcrawlers claw their way up =================
   A pool of magma in a ring of jagged, cracked black rock and bone spikes, outside the Crimson castle wall
   (behind the statue, toward the north side). Every Hellcrawler the Horde buys rises out of the glow, hooks
   its claws over the rim and hauls itself onto the field. Hover over it (or tap it) to see what it is. */
const PIT_L=[7.5,-9.5];   // castle-local position: 7.5 m in front of the wall face, 9.5 m north
function pitTexture(){
  try{
    if(typeof document==='undefined'||!document.createElement) return null;
    const N=256, cv=document.createElement('canvas'); if(!cv.getContext) return null; cv.width=cv.height=N; const c=cv.getContext('2d'); if(!c) return null;
    let sd=31; const R=()=>(sd=(sd*16807)%2147483647)/2147483647;
    const gr=c.createRadialGradient(N/2,N/2,0,N/2,N/2,N/2); gr.addColorStop(0,'#fff0a0'); gr.addColorStop(.3,'#ffa030'); gr.addColorStop(.62,'#f0501a'); gr.addColorStop(.86,'#8a1c08'); gr.addColorStop(1,'#2a0a04');
    c.fillStyle=gr; c.fillRect(0,0,N,N);
    // drifting crust: dark cooled plates with bright seams between them
    for(let i=0;i<70;i++){ const a=R()*Math.PI*2, r=R()*N*.46, x=N/2+Math.cos(a)*r, y=N/2+Math.sin(a)*r, w=6+R()*20*(.4+r/N);
      c.fillStyle='rgba(40,12,6,'+(.35+.5*r/(N/2))+')'; c.beginPath(); c.ellipse(x,y,w,w*(.5+R()*.5),R()*3,0,Math.PI*2); c.fill(); }
    c.strokeStyle='rgba(255,220,120,.55)'; c.lineWidth=1.2;
    for(let i=0;i<30;i++){ let x=N/2+(R()-.5)*N*.7, y=N/2+(R()-.5)*N*.7, a=R()*6.3; c.beginPath(); c.moveTo(x,y); for(let k=0;k<8;k++){ x+=Math.cos(a)*6; y+=Math.sin(a)*6; a+=(R()-.5); c.lineTo(x,y); } c.stroke(); }
    return new THREE.CanvasTexture(cv);
  }catch(e){ return null; }
}
function buildPit(C){
  crInit();
  const t=C.team, x=cwx(t,PIT_L[0]), z=PIT_L[1], g=new THREE.Group(); g.position.set(x,H(x,z),z);
  const tex=pitTexture(), lavaMat=new THREE.MeshBasicMaterial({color:'#ffffff',map:tex||null}); if(!tex) lavaMat.color.set('#ff6a1e');
  const pool=new THREE.Mesh(new THREE.CircleGeometry(1.95,40),lavaMat); pool.rotation.x=-Math.PI/2; pool.position.y=.07; g.add(pool);
  const crust=new THREE.Mesh(new THREE.RingGeometry(1.85,2.9,40),new THREE.MeshLambertMaterial({color:'#1c1410'})); crust.rotation.x=-Math.PI/2; crust.position.y=.05; crust.receiveShadow=true; g.add(crust);
  // a ring of jagged rock (the same cracked, glowing stone the crawlers are made of) and bone spikes leaning out
  let sd=5; const R=()=>(sd=(sd*16807)%2147483647)/2147483647;
  const rocks=[], spikes=[];
  for(let i=0;i<18;i++){ const a=i/18*Math.PI*2+R()*.2, r=2.3+R()*.3, h=.22+R()*.55, gx=Math.cos(a)*r, gz=Math.sin(a)*r, gy=H(x+gx,z+gz)-g.position.y;
    const geo=new THREE.DodecahedronGeometry(1,0); rocks.push([geo,new THREE.Matrix4().compose(new V3(gx,gy+h*.35,gz),new THREE.Quaternion().setFromEuler(new THREE.Euler(R()*.6-.3,R()*6,R()*.6-.3)),new V3(.26+R()*.2,h,.24+R()*.2))]); }
  for(let i=0;i<7;i++){ const a=i/7*Math.PI*2+.3+R()*.3, r=2.45, gx=Math.cos(a)*r, gz=Math.sin(a)*r, gy=H(x+gx,z+gz)-g.position.y;
    spikes.push(...crHorn(new V3(gx,gy,gz),new V3(Math.cos(a)*.45,1,Math.sin(a)*.45),new V3(-Math.sin(a),0,Math.cos(a)),-.7,.9+R()*.6,.09,6)); }
  const rk=new THREE.Mesh(mergeUV(rocks),CRM.skin); rk.castShadow=rk.receiveShadow=true; g.add(rk);
  const sp=new THREE.Mesh(mergeUV(spikes),CRM.bone); sp.castShadow=true; g.add(sp);
  const hull=new THREE.Mesh(new THREE.TorusGeometry(2.45,.14,8,48),HULL_MAT); hull.rotation.x=-Math.PI/2; hull.position.y=.4; hull.visible=false; hull.renderOrder=-1; g.add(hull);
  scene.add(g); g.updateMatrixWorld(true);
  const b={id:'pit',name:'Hellpit',emb:7,desc:'Hellcrawlers claw their way up out of the abyss',team:t,bx:PIT_L[0],row:0,trains:['crawler','hound','cerberus','spitter'],q:[],train:null,exitQ:[],res:null,
    pit:true,grp:g,lava:pool,hull,box:new THREE.Box3(new V3(-2.5,-.2,-2.5),new V3(2.5,1.6,2.5)),wbox:new THREE.Box3()};
  b.wbox.copy(b.box).applyMatrix4(g.matrixWorld);
  C.B.pit=b; C.list.push(b); C.pit=b;
}
function placePit(C){ const b=C&&C.pit; if(!b) return; const g=b.grp; g.position.x=cwx(C.team,PIT_L[0]); g.position.y=H(g.position.x,g.position.z); g.updateMatrixWorld(true); }
TRAINED_AT.crawler='pit'; TRAINED_AT.hound='pit'; TRAINED_AT.cerberus='pit';   // a Chaos castle digs its pit when it is built (buildCastle)
// a Hellcrawler rises out of the magma, claws hooked over the rim, and drags itself out toward the field
function pitEmerge(b,type){
  const t=b.team, g=b.grp, s=TYPES[type].s, a=rand(-.75,.75), fx=DIRX[t]*Math.cos(a), fz=Math.sin(a);
  const x=g.position.x+rand(-.4,.4), z=g.position.z+rand(-.4,.4), gy=H(x,z);
  const u=makeUnit(type,t,x,z,{gy:gy-1.25*s}); u.isUnit=true; units.push(u); assignRegiment(u); researchApplyUnit(u);
  u.face=u.faceGoal=Math.atan2(fx,fz); u.emerging=true; u.emerge={t:0,dur:1.15,y0:gy-1.25*s,yg:gy}; crPlace(u);
  for(let i=0;i<2;i++){ const sd=i?1:-1, px=x+fx*1.35+fz*sd*.42, pz=z+fz*1.35-fx*sd*.42; u.paws[i].pos.set(px,H(px,pz),pz); }
  const ox=-fz, oz=fx, sw=rand(-2.5,2.5);
  u.script={pts:[new V3(x+fx*1.9,0,z+fz*1.9),new V3(x+fx*6+ox*sw,0,z+fz*6+oz*sw)],i:0,speed:1.3,then:null};
  if(game.stance) assignSlots(t);
  _tp.set(x,gy+.2,z); puff(_tp,6,.35,2.4,'#ff7a2a'); puff(_tp,4,.5,1.4,'#2a201c'); crSfx('pitRise','stone',_tp,.8);
  if(Math.random()<.35) crSfx('crScreech',null,_tp,.6);
  if(NET.host||NET.rec) netCapNew(u,2,b);
  return u;
}
// the pool churns: bright seams drift, embers and smoke rise (cosmetic stream; only in a castle battle)
function updatePits(dt){
  for(const C of CASTLES){ const b=C.pit; if(!b) continue;
    const m=b.lava.material; if(m.map){ m.map.offset.x=Math.sin(game.time*.13)*.02; m.map.offset.y=Math.cos(game.time*.11)*.02; m.map.rotation=game.time*.02; m.map.center.set(.5,.5); }
    const k=.85+.15*Math.sin(game.time*3.1)+.06*Math.sin(game.time*11.3); m.color.setRGB(k,k*.92,k*.86);
    if(castleOn()&&crand()<dt*5){ const g=b.grp; _tp.set(g.position.x+(crand()-.5)*2.4,g.position.y+.2,g.position.z+(crand()-.5)*2.4);
      puff(_tp,1,crand()<.6?.12:.45,crand()<.6?1.2:.5,crand()<.6?'#ff8a2a':'#2e2420'); } }
}
function drawPits(){
  for(const C of CASTLES){ const b=C.pit; if(!b) continue; const g=b.grp;
    for(let i=0;i<4;i++){ const a=i*1.57+game.time*.3; _tp.set(g.position.x+Math.cos(a)*.9,g.position.y+.12,g.position.z+Math.sin(a)*.9); glowAt(_tp,.3+.06*Math.sin(game.time*4+i),'#ff5a14'); } }
}
