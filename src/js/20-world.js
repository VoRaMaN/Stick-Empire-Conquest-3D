/* ---------------- world state ---------------- */
const units=[], corpses=[], arrows=[], puffs=[], rings=[];
let uid=0;
const POP_CAP=200;   // soldiers per army
const BATTLE_SIZES=[{name:'Normal',start:8,gold:1500},{name:'Large',start:60,gold:2500},{name:'Epic',start:200,gold:4000}];
const game={size:0,stance:['defend','defend'],holdX:[-20,20],duelDefend:true,mode:'battle',gold:[1500,1500],mana:[150,150],auto:[true,true],finMode:1,over:0,spawnT:[0,0],duelSel:'sword',duel:null,slow:true,ts:1,time:0};
const BASE_X=[-34,34], MINE=[new V3(-27.5,0,-8.5),new V3(27.5,0,8.5)];
const statues=[];

function groundAt(u,x,z){return u&&u.gy!==undefined?u.gy:u&&u.inCastle?castleFloor(u,x,z):H(x,z);}
// inside the walls a soldier walks on the courtyard paving; past the gate the road blends back into the field
function castleFloor(u,x,z){ const t=u.team, lx=t?MAP.cf-x:x+MAP.cf, f=CGY[t]+.08; if(lx<-.5) return f; return lerp(f,H(x,z),smooth(clamp((lx+.5)/5,0,1))); }

function makeUnit(type,team,x,z,opt){
  opt=opt||{}; if(team===2) rlNeutralTeam();   // a neutral camp's colours, made on first use (37f)
  const T=TYPES[type], s=opt.s||T.s;
  const u={id:++uid,type,team,T,s,pos:new V3(x,0,z),vel:new V3(),av:new V3(),last:new V3(x,0,z),spd:0,
    face:team===0?Math.PI/2:-Math.PI/2,faceGoal:0,hp:T.hp,maxHp:T.hp,alive:true,state:'ok',ai:opt.ai!==false,
    target:null,retarget:0,cdT:rand(0,.6),action:null,fin:null,fwdScale:1,
    leanS:{x:0,v:0},headS:{x:0,v:0},rsx:{x:0,v:0},rsz:{x:0,v:0},sideS:{x:0,v:0},
    feet:[{pos:new V3(),from:new V3(),to:new V3(),t:-1,dur:.3,lift:.1,air:false},{pos:new V3(),from:new V3(),to:new V3(),t:-1,dur:.3,lift:.1,air:false}],
    settle:0,j:{},wRw:new V3(0,1,0),wLw:new V3(0,0,1),spine:new V3(0,1,0),fwdW:new V3(0,0,1),rightW:new V3(1,0,0),
    draw:0,aimPitch:0,zoff:rand(-4,4),statue:!!opt.statue,col:opt.col||(T.body?T.body[team]:TEAM[team].body),thick:(opt.thick||1)*T.thick,mstate:'toMine',slot:rand(0,Math.PI*2),carry:false,mineT:0,
    invuln:false,morale:100,routing:false,hand:{R:new V3(),L:new V3()},swing:0,turnV:0,accF:0,desired:new V3()};
  if(opt.gy!==undefined) u.gy=opt.gy;
  for(const n of ['pelvis','chest','neck','head','sL','sR','eL','eR','hL','hR','hipL','hipR','kL','kR','fL','fR']) u.j[n]=new V3();
  u.faceGoal=u.face;
  const f=new V3(Math.sin(u.face),0,Math.cos(u.face)), r=new V3(f.z,0,-f.x);
  u.feet.forEach((ft,i)=>{const sd=i?1:-1; ft.pos.set(x+r.x*sd*.13*s,0,z+r.z*sd*.13*s); ft.pos.y=groundAt(u,ft.pos.x,ft.pos.z);});
  u.pos.y=groundAt(u,x,z);
  buildGear(u);
  if(T.flyer&&!opt.statue) initFly(u);
  return u;
}

function buildGear(u){
  const tm=TEAM[u.team], acc=u.statue?M.stoneD:tm.acc, acc2=u.statue?M.stoneD:tm.acc2, steel=u.statue?M.stone:M.steel, G={};
  switch(u.type){
    case 'sword':{const w=grp(); w.add(mesh(GEO.blade,steel,0,.5,0),mesh(GEO.guard,acc,0,.08,0),mesh(GEO.pommel,acc,0,-.07,0)); G.w=w;
      if(!u.statue){const h=grp(); h.add(mesh(GEO.band,acc2,0,.03,0)); const t1=mesh(GEO.tail,acc2,0,-.02,-.22); t1.rotation.x=.9; h.add(t1); G.h=h;} break;}
    case 'spear':{ // Spartan hoplite
      const tb=TEAM[u.team], br=tb.bronze;
      const w=grp(); w.add(mesh(GEO.shaft,M.wood,0,.45,0),mesh(GEO.tip,steel,0,1.6,0),mesh(GEO.collar,br,0,1.47,0),mesh(GEO.sauroter,br,0,-.68,0)); G.w=w;
      const o=grp(); o.add(mesh(GEO.aspis,br),mesh(GEO.aspisRim,br));
      const l1=mesh(GEO.lambdaBar,tb.lambda,-.085,.01,.09); l1.rotation.z=-.388; const l2=mesh(GEO.lambdaBar,tb.lambda,.085,.01,.09); l2.rotation.z=.388; o.add(l1,l2); G.o=o;
      const h=grp(); h.add(mesh(GEO.helmDome,br),mesh(GEO.helmSide,br,0,-.126,0),mesh(GEO.helmNose,br,0,-.08,.212));
      for(const sd of [-1,1]){ const c=mesh(GEO.helmCheek,br,sd*.084,-.15,.187); c.rotation.y=sd*.42; h.add(c); }
      const cf=mesh(GEO.crestFan,tb.crest,0,.12,-.03); cf.scale.set(1,1.05,1); h.add(cf,mesh(GEO.crestBase,tb.crest,0,.2,-.03)); G.h=h;
      makeCape(u);
      break;}
    case 'archer':{const o=grp(); o.add(mesh(GEO.bow,M.wood)); G.o=o;
      const b=grp(); const q=mesh(GEO.quiver,M.leather); q.rotation.z=.25; b.add(q); for(let i=0;i<3;i++){const a=mesh(GEO.aFl,acc2,-.05+.03*i+.05,.3,0); a.rotation.z=.25; b.add(a);} G.b=b;
      G.str={a:new V3(),m:new V3(),b:new V3(),vis:false};   // bow string, drawn as two instanced segments
      G.nock=arrowMesh(acc2); G.nock.visible=false;
      const h=grp(); const f=mesh(GEO.tail,acc2,0,.12,-.16); f.rotation.x=-.5; h.add(mesh(GEO.band,acc,0,.03,0),f); G.h=h; break;}
    case 'giant':{const w=grp(); w.add(mesh(GEO.club,M.wood,0,.6,0)); for(let i=0;i<4;i++){const a=i*Math.PI/2, sp=mesh(GEO.spike,steel,Math.cos(a)*.12,1.0+(i%2)*.12,Math.sin(a)*.12); sp.rotation.z=-Math.cos(a)*1.4; sp.rotation.x=Math.sin(a)*1.4; w.add(sp);} G.w=w;
      const h=grp(); h.add(mesh(GEO.band,acc,0,.0,0)); G.h=h; break;}
    case 'miner':{const w=grp(); const pk=mesh(GEO.pick,steel,0,.7,0); const t1=mesh(GEO.pickTip,steel,.3,.7,0); t1.rotation.z=-Math.PI/2; const t2=mesh(GEO.pickTip,steel,-.3,.7,0); t2.rotation.z=Math.PI/2;
      w.add(mesh(GEO.handle,M.wood,0,.32,0),pk,t1,t2); G.w=w;
      const b=grp(); b.add(mesh(GEO.bag,M.cloth)); b.children[0].scale.set(1,1.15,.85); G.b=b; b.visible=false;
      const h=grp(); h.add(mesh(GEO.hat,acc)); G.h=h; break;}
    default: buildGearX(u,G,acc,acc2,steel);
  }
  for(const k of ['w','o','h','b']) if(G[k]){ G[k].scale.setScalar(u.s); freezeGear(G[k]); }
  if(G.nock){ G.nock.scale.setScalar(u.s); freezeGear(G.nock); }
  u.G=G;
}
function destroyGear(u){const G=u.G; if(u.arrows) for(const a of u.arrows) a.remove=true;
  if(u.cape){ freeCape(u.cape); const i=capes.indexOf(u.cape); if(i>=0) capes.splice(i,1); u.cape=null; }
  if(!G)return; for(const k in G){ if(G[k]&&G[k].isObject3D) dropRoot(G[k]); } u.G=null;}

