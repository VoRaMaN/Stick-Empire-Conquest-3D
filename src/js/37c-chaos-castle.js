/* ================= The Chaos fortress =================
   Same walls, gatehouse and towers as the Order castle, in blackened stone with bone spikes on the battlements
   and a moat of magma along the front. Its yard holds the Hellforge (Dreadguards), the Soul Quarry (Thralls)
   and the Soul Spire (Soul Harvesters); the Hellpit lies outside the wall. The other plots are dark scenery
   for now: a fire brazier, a field of bones, an empty war-beast cage, a blood altar and a rune obelisk. */
const CTINT_C={stone:'#8a7670',slate:'#6a5458',terracotta:'#7a3a32',wood:'#7a6658',iron:'#8a8a94',sandstone:'#9a7666',cobble:'#7a6a64',marble:'#9a8886',basalt:'#5e5250'};
const CTEX_C={stone:'#4a3e3a',slate:'#322628',terracotta:'#4a1c18',wood:'#3e3028',iron:'#34343a',sandstone:'#5a3e34',cobble:'#3e3632',marble:'#5a4a48',basalt:'#241e1c'};
const CMC={};
for(const k in CTEX){ CMC[k]=CM[k].clone(); CMC[k].color.set(CTEX_C[k]); }
Object.assign(CMC,{dark:CM.dark,eyes:CM.eyes,rope:CM.rope,straw:new THREE.MeshLambertMaterial({color:'#4a3426'}),target:new THREE.MeshLambertMaterial({color:'#6a1a12'}),
  gold:new THREE.MeshPhongMaterial({color:'#8a5a2a',specular:'#ffb070',shininess:50}),paper:new THREE.MeshBasicMaterial({color:'#ff6a3a'}),
  orb:new THREE.MeshBasicMaterial({color:'#d070ff'}),emblem:new THREE.MeshPhongMaterial({color:'#ffffff',specular:'#ff9a6a',shininess:30}),
  cloth:['#5a2410','#5e0c14'].map(c=>new THREE.MeshLambertMaterial({color:c,side:THREE.DoubleSide})),trim:CH_ACC.map(c=>new THREE.MeshLambertMaterial({color:c})),
  bone:new THREE.MeshPhongMaterial({color:'#d8cab0',specular:'#ffffff',shininess:24}),lava:new THREE.MeshBasicMaterial({color:'#ff5a1e'}),
  crystal:new THREE.MeshPhongMaterial({color:'#ff6a4a',emissive:'#9a1408',specular:'#ffd0c0',shininess:70})});
// nine sigils for the Chaos buildings, burned red into dark iron (drawn once on a canvas)
let CHAOS_EMB_URL='';
(function chaosEmblems(){
  try{
    if(typeof document==='undefined'||!document.createElement) return; const N=384, cv=document.createElement('canvas'); if(!cv.getContext) return;
    cv.width=cv.height=N; const c=cv.getContext('2d'); if(!c) return; const S=N/3;
    c.fillStyle='#1a1214'; c.fillRect(0,0,N,N);
    const cell=(i,fn)=>{ const x=(i%3)*S+S/2, y=Math.floor(i/3)*S+S/2; c.save(); c.translate(x,y);
      const g=c.createRadialGradient(0,0,S*.1,0,0,S*.5); g.addColorStop(0,'#3a2a2a'); g.addColorStop(1,'#120c0c'); c.fillStyle=g; c.beginPath(); c.arc(0,0,S*.48,0,Math.PI*2); c.fill();
      c.strokeStyle='#ff5a2a'; c.lineWidth=S*.045; c.lineCap='round'; c.lineJoin='round'; c.shadowColor='#ff3a0a'; c.shadowBlur=S*.08; fn(S*.3); c.restore(); };
    const L=(pts,close)=>{ c.beginPath(); c.moveTo(pts[0][0],pts[0][1]); for(const p of pts.slice(1)) c.lineTo(p[0],p[1]); if(close) c.closePath(); c.stroke(); };
    cell(0,r=>{ L([[-r,r*.9],[r*.4,-r*.5]]); L([[-r*.1,-r*.9],[r*.9,r*.1]]); L([[r*.2,r*.2],[r*.5,r*.9],[r*.8,r*.2],[r*.5,-r*.1]],true); });   // mattock and crystal
    cell(1,r=>{ L([[0,-r],[0,r]]); c.beginPath(); c.moveTo(0,-r*.6); c.quadraticCurveTo(-r*1.1,-r*.3,-r*.1,r*.4); c.stroke(); L([[0,-r],[r*.3,-r*.7]]); });   // axe
    cell(2,r=>{ for(const dx of [-.5,0,.5]) L([[dx*r-r*.2,-r],[dx*r+r*.2,r]]); });   // claw marks
    cell(3,r=>{ for(const dy of [-.5,0,.5]){ c.beginPath(); c.moveTo(-r,dy*r); c.bezierCurveTo(-r*.3,dy*r-r*.4,r*.3,dy*r+r*.4,r,dy*r); c.stroke(); } });
    cell(4,r=>{ c.beginPath(); c.ellipse(0,0,r,r*.5,0,0,Math.PI*2); c.stroke(); c.beginPath(); c.arc(0,0,r*.25,0,Math.PI*2); c.stroke(); });   // eye
    cell(5,r=>{ c.beginPath(); c.arc(0,-r*.15,r*.75,Math.PI*.85,Math.PI*2.15); c.stroke(); L([[-r*.5,r*.45],[-r*.5,r*.9],[r*.5,r*.9],[r*.5,r*.45]]); c.beginPath(); c.arc(-r*.3,-r*.15,r*.17,0,Math.PI*2); c.stroke(); c.beginPath(); c.arc(r*.3,-r*.15,r*.17,0,Math.PI*2); c.stroke(); });   // skull
    cell(6,r=>{ c.beginPath(); c.moveTo(0,r); c.quadraticCurveTo(-r,r*.2,-r*.2,-r); c.quadraticCurveTo(0,-r*.2,r*.3,-r*.6); c.quadraticCurveTo(r,r*.2,0,r); c.stroke(); });   // flame
    cell(7,r=>{ for(const dx of [-.6,0,.6]){ c.beginPath(); c.moveTo(dx*r,-r); c.quadraticCurveTo(dx*r+r*.35,0,dx*r,r); c.stroke(); } });   // claws
    cell(8,r=>{ c.beginPath(); c.arc(0,0,r*.55,0,Math.PI*2); c.stroke(); for(let i=0;i<8;i++){ const a=i*Math.PI/4, q=i%2?.85:1.1; L([[Math.cos(a)*r*.55,Math.sin(a)*r*.55],[Math.cos(a)*r*q,Math.sin(a)*r*q]]); } c.beginPath(); c.arc(0,0,r*.18,0,Math.PI*2); c.stroke(); });   // chaos star
    CHAOS_EMB_URL=cv.toDataURL?cv.toDataURL('image/png'):'';
    const t=new THREE.CanvasTexture(cv); CMC.emblem.map=t; CMC.emblem.needsUpdate=true;
  }catch(e){}
})();

const KEEP_C={id:'castle',name:'Black Citadel',emb:8,desc:'Soul Harvesters on the walls, income and the statue'};
const BUILDINGS_CHAOS=[
  {id:'forge',name:'Hellforge',emb:1,x:-6.5,row:0,w:5.6,d:6,trains:['dread','boner','hades'],desc:'Dreadguards, Bone Reavers and Hades himself, forged at the anvil of the abyss'},
  {id:'brazier',deco:true,x:-13.5,row:0,w:5.6,d:6},
  {id:'bones',deco:true,x:-20.5,row:0,w:5.6,d:6},
  {id:'cage',deco:true,x:-28,row:0,w:7,d:6},
  {id:'quarry',name:'Soul Quarry',emb:0,x:-6.5,row:1,w:5.6,d:8,trains:['thrall','bomber'],desc:'Soulbound Thralls who dig soul crystals, and Infernal Bombers'},
  {id:'spire',name:'Soul Spire',emb:5,x:-13.5,row:1,w:5.6,d:8,trains:['harvester','oracle','reaper'],desc:'Soul Harvesters, Fallen Oracles and Grim Reapers'},
  {id:'altar',deco:true,x:-20.5,row:1,w:5.6,d:8},
  {id:'obelisk',deco:true,x:-28,row:1,w:7,d:8},
];
const BUILDINGS_OF={order:BUILDINGS,chaos:BUILDINGS_CHAOS};
for(const B of BUILDINGS_CHAOS) if(B.trains) for(const ty of B.trains) TRAINED_AT[ty]=B.id;
Object.assign(TRAIN_T,{hound:1.2,cerberus:6,thrall:2.0,dread:3.2,harvester:3.0,boner:2.6,bomber:3.0,oracle:3.8,reaper:4.6,hades:10});
const hornPut=(C,b,p,d,ax,ang,len,r,n)=>{ for(const [g,m] of crHorn(p,d,ax,ang,len,r,n)) (b?bPut(C,b,'bone',g,m):C.kit.put('bone',g,m)); };

// bone spikes along the battlements and on the towers, skulls over the gate, a moat of magma along the front
function chaosWalls(C){
  const K=C.kit;
  for(let z=-17.2;z<0;z+=1.8) hornPut(C,null,new V3(-.27,WALL_H+1.2,z),new V3(.55,1,0),new V3(0,0,1),.5,.8,.08,4);
  for(let z=11.8;z<13.4;z+=1.4) hornPut(C,null,new V3(-.27,WALL_H+1.2,z),new V3(.55,1,0),new V3(0,0,1),.5,.8,.08,4);
  for(const zc of [2,10]) for(const sz of [-1,1]) hornPut(C,null,new V3(.6,TOWER_H+1.1,zc+sz*1.3),new V3(.7,1,sz*.4),new V3(-sz*.4,0,1),.6,1.2,.11,5);
  for(const [x,z,h] of [[-1.5,14.7,10],[-1.5,-19.3,11],[-34.5,-19.3,9.5],[-34.5,14.7,6.5]]) for(let i=0;i<5;i++){ const a=i/5*Math.PI*2+.3;
    hornPut(C,null,new V3(x+Math.cos(a)*2.3,h+1.1,z+Math.sin(a)*2.3),new V3(Math.cos(a)*.7,1,Math.sin(a)*.7),new V3(-Math.sin(a),0,Math.cos(a)),-.7,1.3,.1,4); }
  for(const sd of [-1,1]) K.put('bone',new THREE.SphereGeometry(.32,10,8),TM(.45,6.9,GATE_Z+sd*1.4,0,0,0,[1,1.1,1.15]));
  K.put('lava',gBox(.9,.06,17.6,1),TM(1.7,.04,-8.9)); K.put('lava',gBox(.9,.06,1.9,1),TM(1.7,.04,12.45));
  K.put('basalt',gBox(.35,.3,18,CTILE.basalt),TM(1.1,.1,-8.9)); K.put('basalt',gBox(.35,.3,18,CTILE.basalt),TM(2.3,.1,-8.9));
}
Object.assign(BUILD_FN,{
  forge(C,b,G){ const {bx,w,d}=b, z0=3-d/2;
    bPut(C,b,'basalt',gBox(w+.5,.7,d+.5,CTILE.basalt),TM(bx,.35,z0)); bPut(C,b,'stone',gBox(w,4.4,d,CTILE.stone),TM(bx,.7+2.2,z0));
    bPut(C,b,'iron',gBox(w+.2,.3,d+.2,1),TM(bx,5.1,z0)); pyramidRoof(C,b,'slate',bx,5.25,z0,w+.6,d+.6,1.6);
    // a great chimney belching smoke over the furnace
    bPut(C,b,'basalt',gBox(1.4,5.2,1.4,CTILE.basalt),TM(bx+1.5,6.9,z0-1.1)); bPut(C,b,'iron',gBox(1.6,.3,1.6,1),TM(bx+1.5,9.6,z0-1.1)); b.chimney=new V3(bx+1.5,9.9,z0-1.1);
    // the furnace mouth glowing behind the iron grate
    G.push([gBox(2.5,2.6,.04,1),TM(bx,.7+1.3,3.21)]);
    bDoor(C,b,'portcullis',2.6,2.8,3,{y0:.7}); bPut(C,b,'iron',gBox(3.2,.45,.5,1),TM(bx,3.75,3.1));
    bEmblem(C,b,bx,4.45,3.06,.42);
    // anvil and a rack of axe hafts
    bPut(C,b,'iron',gBox(.35,.4,.25,1),TM(bx-2.2,.55,3.7)); bPut(C,b,'iron',gBox(.7,.25,.35,1),TM(bx-2.2,.88,3.7)); bPut(C,b,'iron',gBox(1.0,.12,.4,1),TM(bx-2.2,1.06,3.7));
    for(const sd of [-1,1]) bPut(C,b,'wood',gCyl(.035,.035,2.2,5,1),TM(bx+2.25+sd*.2,1.1,3.45,0,0,sd*.2));
    for(const sx of [-1,1]) for(const sz of [-1,1]) hornPut(C,b,new V3(bx+sx*(w/2+.1),5.25,z0+sz*(d/2+.1)),new V3(sx*.5,1,sz*.5),new V3(-sz,0,sx),-.6,1.1,.12,4);
    b.h=10; },
  quarry(C,b,G){ const {bx,w,d}=b, z0=-6-d/2;
    bPut(C,b,'basalt',gBox(w+.4,1.0,d+.4,CTILE.basalt),TM(bx,.5,z0)); bPut(C,b,'stone',gBox(w,3.4,d,CTILE.stone),TM(bx,1+1.7,z0));
    gableRoof(C,b,'slate',bx,4.4,z0,w,d,1.8,.4);
    // the headframe over the shaft: four timber legs, a beam and the winding wheel
    for(const sx of [-1,1]) for(const sz of [-1,1]) bPut(C,b,'wood',gBox(.25,4.2,.25,1),TM(bx+sx*1.1,6.1,z0+.6+sz*1.1,0,sz*.12,-sx*.12));
    bPut(C,b,'wood',gBox(2.8,.3,.3,1),TM(bx,8.1,z0+.6));
    const gw=new THREE.Group(), gk=new Kit(); gk.put('iron',new THREE.TorusGeometry(.75,.12,6,20),TM(0,0,0)); for(let i=0;i<4;i++) gk.put('iron',gBox(1.5,.08,.08,1),TM(0,0,0,0,0,i*Math.PI/4));
    gk.build(gw,C.team,true); gw.position.set(bx,8.4,z0+.6); gw.rotation.y=Math.PI/2; C.group.add(gw); b.gear=gw;
    // the shaft mouth glowing red with soul crystals, heaps of them by the door
    G.push([gBox(1.6,1.9,.04,1),TM(bx,1+.95,-5.8)]);
    bDoor(C,b,'double',2.0,2.4,-6,{y0:1});
    for(const [x,z,k] of [[-2.2,-5.3,1],[-2.55,-4.8,.7],[2.3,-5.2,.9]]) for(let i=0;i<3;i++) bPut(C,b,'crystal',new THREE.OctahedronGeometry(.25*k,0),TM(bx+x+i*.18,.3+i*.06,z+i*.1,i,0,.3*i,[1,1.8,1]));
    bEmblem(C,b,bx,3.7,-5.94,.5); bWindow(C,b,bx-1.8,3.1,-6,.5,.55,G); bWindow(C,b,bx+1.8,3.1,-6,.5,.55,G);
    b.h=9.5; },
  spire(C,b,G){ const bx=b.bx, cz=-9.2, r=2.3;
    bPut(C,b,'basalt',gCyl(r+.4,r+.6,1.2,10,CTILE.basalt),TM(bx,.6,cz));
    const rAt=[]; let y=1.2, rr=r;
    for(let i=0;i<5;i++){ const h=2.6-i*.25, r2=rr*.84; bPut(C,b,'stone',gCyl(r2,rr,h,10,CTILE.stone),TM(bx,y+h/2,cz,i*.35)); bPut(C,b,'iron',gCyl(r2+.08,r2+.08,.18,10,1),TM(bx,y+h,cz)); rAt.push([y,h,rr,r2]); y+=h; rr=r2; }
    const radius=yy=>{ for(const [y0,h,a,b2] of rAt) if(yy<=y0+h) return lerp(a,b2,clamp((yy-y0)/h,0,1)); return rr; };
    // a jagged crown of bone and a soul orb floating above it
    for(let i=0;i<6;i++){ const a=i/6*Math.PI*2; hornPut(C,b,new V3(bx+Math.cos(a)*rr,y,cz+Math.sin(a)*rr),new V3(Math.cos(a)*.35,1,Math.sin(a)*.35),new V3(-Math.sin(a),0,Math.cos(a)),.5,1.6,.12,5); }
    b.orb=new THREE.Mesh(new THREE.SphereGeometry(.5,14,10),CMC.orb); b.orb.position.set(bx,y+2.2,cz); C.group.add(b.orb);
    // bone ribs climbing the tower
    for(let i=0;i<4;i++){ const a=i/4*Math.PI*2+.4; hornPut(C,b,new V3(bx+Math.cos(a)*(r+.15),1.2,cz+Math.sin(a)*(r+.15)),new V3(0,1,0),new V3(-Math.sin(a),0,Math.cos(a)),.35,6,.14,8); }
    // glowing window slits up the front, the door at the foot
    for(let i=0;i<3;i++){ const yy=4.6+i*2.3; G.push([gBox(.32,.95,.04,1),TM(bx,yy,cz+radius(yy)*.97+.03)]); }
    bPut(C,b,'stone',gBox(2.6,3.2,1.2,CTILE.stone),TM(bx,1.6,cz+r-.1));
    bDoor(C,b,'double',1.7,2.5,cz+r+.52); bEmblem(C,b,bx,2.95,cz+r+.52,.32);
    b.h=y+3; },
  brazier(C,b,G){ const {bx}=b, z0=.2;
    bPut(C,b,'basalt',gCyl(2.0,2.3,.6,10,CTILE.basalt),TM(bx,.3,z0)); bPut(C,b,'stone',gCyl(1.0,1.35,1.6,8,CTILE.stone),TM(bx,1.4,z0));
    bPut(C,b,'iron',gCyl(1.5,.9,.7,12,1),TM(bx,2.55,z0)); G.push([gCyl(1.32,1.32,.06,12,1),TM(bx,2.86,z0)]);
    b.fires=[new V3(bx,3.0,z0)];
    for(let i=0;i<6;i++){ const a=i/6*Math.PI*2; hornPut(C,b,new V3(bx+Math.cos(a)*1.9,.6,z0+Math.sin(a)*1.9),new V3(Math.cos(a)*.6,1,Math.sin(a)*.6),new V3(-Math.sin(a),0,Math.cos(a)),-.5,1.2,.09,4); } },
  bones(C,b,G){ const {bx}=b, z0=.5; let sd=7; const R=()=>(sd=(sd*16807)%2147483647)/2147483647;
    bPut(C,b,'basalt',gBox(5,.3,5,CTILE.basalt),TM(bx,.15,z0));
    const bone=new THREE.CylinderGeometry(.06,.07,.7,5), skull=new THREE.SphereGeometry(.17,8,6);
    for(let i=0;i<40;i++){ const a=R()*6.28, r=R()*1.6, h=.35+R()*.9*(1-r/1.8); bPut(C,b,'bone',bone,TM(bx+Math.cos(a)*r,h,z0+Math.sin(a)*r,R()*3,R()*3,R()*3)); }
    for(let i=0;i<12;i++){ const a=R()*6.28, r=R()*1.4; bPut(C,b,'bone',skull,TM(bx+Math.cos(a)*r,.45+R()*.6,z0+Math.sin(a)*r,R()*3,0,0,[1,1.1,1.15])); }
    for(const [x,z] of [[-2,-1.8],[2,-1.8],[-2,2.2],[2,2.2]]){ bPut(C,b,'wood',gCyl(.06,.08,3.2,5,1),TM(bx+x,1.6,z0+z)); bPut(C,b,'bone',skull,TM(bx+x,3.3,z0+z,0,0,0,[1.2,1.3,1.35])); } },
  cage(C,b,G){ const {bx,w,d}=b, z0=3-d/2;
    bPut(C,b,'basalt',gBox(w,.6,d,CTILE.basalt),TM(bx,.3,z0));
    const bar=gBox(.1,4,.1,1);
    for(let i=0;i<=10;i++){ const x=-w/2+.3+i*(w-.6)/10; if(i<3||i>5) bPut(C,b,'iron',bar,TM(bx+x,2.6,z0+d/2-.3)); bPut(C,b,'iron',bar,TM(bx+x,2.6,z0-d/2+.3)); }
    for(let i=1;i<8;i++){ const z=-d/2+.3+i*(d-.6)/8; bPut(C,b,'iron',bar,TM(bx-w/2+.3,2.6,z0+z)); bPut(C,b,'iron',bar,TM(bx+w/2-.3,2.6,z0+z)); }
    for(const y of [.8,2.6,4.5]){ bPut(C,b,'iron',gBox(w-.5,.12,.12,1),TM(bx,y,z0+d/2-.3)); bPut(C,b,'iron',gBox(w-.5,.12,.12,1),TM(bx,y,z0-d/2+.3)); }
    bPut(C,b,'iron',gBox(w-.4,.2,d-.4,1),TM(bx,4.65,z0));
    // the gate hangs open and a broken chain trails out of it
    const gate=gBox(1.1,3.8,.08,1); bPut(C,b,'iron',gate,TM(bx+.6,2.5,z0+d/2+.25,.9));
    for(let i=0;i<6;i++) bPut(C,b,'iron',new THREE.TorusGeometry(.13,.035,5,10),TM(bx-.2+i*.2,.68,z0+d/2+.2+i*.25,i%2?Math.PI/2:0,Math.PI/2,0));
    for(const sx of [-1,1]) for(const sz of [-1,1]) hornPut(C,b,new V3(bx+sx*(w/2-.3),4.75,z0+sz*(d/2-.3)),new V3(sx*.4,1,sz*.4),new V3(-sz,0,sx),-.5,.9,.08,4); },
  altar(C,b,G){ const {bx,w,d}=b, z0=-6-d/2;
    for(let i=0;i<3;i++) bPut(C,b,'basalt',gBox(w-.2-i*.9,.35,d-1-i*.9,CTILE.basalt),TM(bx,.17+i*.35,z0));
    bPut(C,b,'marble',gBox(2.6,.9,1.2,CTILE.marble),TM(bx,1.5,z0)); G.push([gBox(2.2,.03,.9,1),TM(bx,1.96,z0)]);   // runes burning on the slab
    for(const sd of [-1,1]){ bPut(C,b,'iron',gCyl(.06,.06,1.8,5,1),TM(bx+sd*2,1.95,z0+1.2)); bPut(C,b,'iron',gCyl(.35,.2,.3,8,1),TM(bx+sd*2,2.9,z0+1.2)); }
    b.fires=[new V3(bx-2,3.1,z0+1.2),new V3(bx+2,3.1,z0+1.2)]; },
  obelisk(C,b,G){ const {bx,d}=b, z0=-6-d/2, y0=1.4, H0=11;
    bPut(C,b,'basalt',gBox(3.4,.8,3.4,CTILE.basalt),TM(bx,.4,z0)); bPut(C,b,'basalt',gBox(2.6,.6,2.6,CTILE.basalt),TM(bx,1.1,z0));
    const g=new THREE.CylinderGeometry(.55,1.0,H0,4,1); g.rotateY(Math.PI/4); uvMul(g,4/CTILE.basalt,H0/CTILE.basalt); bPut(C,b,'basalt',g,TM(bx,y0+H0/2,z0));
    const tip=new THREE.ConeGeometry(.78,1.4,4); tip.rotateY(Math.PI/4); bPut(C,b,'iron',tip,TM(bx,y0+H0+.7,z0));
    for(let i=0;i<6;i++){ const yy=y0+1.2+i*1.5, half=.7071*lerp(1.0,.55,(yy-y0)/H0); G.push([gBox(.3,.5,.03,1),TM(bx,yy,z0+half+.02)]); } },
});

/* ---------- the Wildlands hold: the Order's plan in mossy stone under green roofs, with its own halls ---------- */
const CTINT_W={stone:'#c8d4b4',slate:'#8ab878',terracotta:'#7ab05a',wood:'#d8c8a8',iron:'#c8ccc4',sandstone:'#e2e6c8',cobble:'#c8ccb4',marble:'#eef2e2',basalt:'#b8bcae'};
const CTEX_W={stone:'#7e866e',slate:'#3e5a34',terracotta:'#4e6a2e',wood:'#5e4630',iron:'#3f424a',sandstone:'#9aa07a',cobble:'#6e7460',marble:'#cfd6c0',basalt:'#34302e'};
let CMW=null;   // made on first use: a material made while the game loads would shift the seeded random stream
function wildMats(){ if(CMW) return CMW; CMW=Object.assign({},CM);
for(const k in CTEX){ CMW[k]=CM[k].clone(); CMW[k].color.set(CTEX_W[k]); const t=CASTLE_TEX[k]; if(t){ CMW[k].map=t; CMW[k].bumpMap=t; CMW[k].bumpScale=BUMP[k]||.2; CMW[k].color.set(CTINT_W[k]); } }
Object.assign(CMW,{straw:new THREE.MeshLambertMaterial({color:'#7a8a3a'}),gold:new THREE.MeshPhongMaterial({color:'#9ab04a',specular:'#e8ffb0',shininess:50}),
  target:new THREE.MeshLambertMaterial({color:'#5a7a2a'}),paper:new THREE.MeshBasicMaterial({color:'#d8ff9a'}),orb:new THREE.MeshBasicMaterial({color:'#9aff8a'}),
  cloth:['#2e5a1e','#4a5a12'].map(c=>new THREE.MeshLambertMaterial({color:c,side:THREE.DoubleSide})),trim:['#8ab84a','#b8a83a'].map(c=>new THREE.MeshLambertMaterial({color:c}))}); return CMW; }
const KEEP_W={id:'castle',name:'Elder Hall',emb:8,desc:'Rangers on the walls, income and the statue'};
const BUILDINGS_WILD=[
  {id:'barracks',name:'Warden Hall',emb:1,x:-6.5,row:0,w:5.6,d:6,trains:['sword'],desc:'Thorn Wardens, quick blades of the clans'},
  {id:'range',name:'Ranger Lodge',emb:3,x:-13.5,row:0,w:5.6,d:6,trains:['archer'],desc:'Sylvan Rangers: fast archers who shoot quicker'},
  {id:'dojo',name:'Shade Grove',emb:2,x:-20.5,row:0,w:5.6,d:6,trains:['ninja'],desc:'Shade Stalkers'},
  {id:'prison',name:'Heartwood Hollow',emb:7,x:-28,row:0,w:7,d:6,trains:['giant'],desc:'Ancient Treants, woken from the old wood'},
  {id:'mine',name:'Forager Lodge',emb:0,x:-6.5,row:1,w:5.6,d:8,trains:['miner'],desc:'Foragers who bring in gold'},
  {id:'mage',deco:true,x:-13.5,row:1,w:5.6,d:8},
  {id:'temple',name:'Sacred Grove',emb:6,x:-20.5,row:1,w:5.6,d:8,trains:['cleric'],desc:'Grove Druids who heal and, with Call of the Forest, summon Treants'},
  {id:'aerie',deco:true,x:-28,row:1,w:7,d:8},
];
BUILDINGS_OF.wild=BUILDINGS_WILD;

// raise both castles for the sides chosen on the title screen
buildCastle(0); buildCastle(1); castleReady=true;
