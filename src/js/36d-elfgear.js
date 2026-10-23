/* ================= The Elven Host: their own arms and armour (v0.33) =================
   The Wildlands soldiers used to borrow the Order's swords, hoplite spears, shields, hats and beards with an elf's
   head on top. Now every clan fighter is made in the elves' own style (the Elven Host sheet): green leaf armour with
   gold trim, hoods and antler crowns, and elven arms:
     Forager: a harvest sickle and a wicker basket · Veteran Sentinel: a leaf-bladed elven sword, silverleaf plate,
     gold-trimmed leaf pauldrons · Spear Hunter: a glaive (a curved blade on a long shaft), bark vest, leaf mantle, no
     hoplite shield or cape · Elf Archer: a tall recurve longbow with gold grip and leaf ornaments, an elven quiver ·
     Twin-Blade Assassin: two crescent blades, a dark hood · Druid: a twisted branch staff holding a glowing seed,
     an antler crown, a green robe · Nature Mage: a staff with a crystal held in roots, gold circlet · Eagle Scout:
     hawk-feather wings · Ancient Guardian: a branch club, bark plates, glowing eyes.
   The weapons are gear (batched meshes, posed by the same code as the Order's); the armour is drawn on the bones
   with the Armory's pieces (40d), and an Armory kit you choose replaces the matching piece of the clan dress. */
const EG={}; let EG_OK=false;
function egInit(){ if(EG_OK) return; EG_OK=true; withOwnRandom(()=>{
  const flat=(draw,d,b)=>agFlat(draw,d,b);
  EG.blade=flat(s=>{ s.moveTo(-.03,0); s.lineTo(.03,0); s.quadraticCurveTo(.085,.45,.018,.94); s.lineTo(0,1); s.quadraticCurveTo(-.045,.55,-.03,0); },.014,.006);
  EG.guard=(()=>{ const g=new THREE.TorusGeometry(.075,.013,5,12,Math.PI); g.rotateZ(Math.PI); return g; })();
  EG.grip=new THREE.CylinderGeometry(.019,.019,.15,8); EG.gem=new THREE.OctahedronGeometry(.03,0);
  EG.shaft=new THREE.CylinderGeometry(.02,.022,1.95,7);
  EG.glaive=flat(s=>{ s.moveTo(-.028,0); s.lineTo(.03,0); s.quadraticCurveTo(.14,.24,.06,.56); s.quadraticCurveTo(.03,.3,-.028,0); },.014,.006);
  EG.collar=(()=>{ const g=new THREE.TorusGeometry(.03,.012,5,12); g.rotateX(Math.PI/2); return g; })();
  EG.recurve=agMerge([agTube([BOW_TOP.clone(),new V3(0,BOW_TOP.y+.07,BOW_TOP.z-.01),new V3(0,BOW_TOP.y+.13,BOW_TOP.z+.03),new V3(0,BOW_TOP.y+.15,BOW_TOP.z+.09)],.022,.008,10,6),
    agTube([BOW_BOT.clone(),new V3(0,BOW_BOT.y-.07,BOW_BOT.z-.01),new V3(0,BOW_BOT.y-.13,BOW_BOT.z+.03),new V3(0,BOW_BOT.y-.15,BOW_BOT.z+.09)],.022,.008,10,6)]);
  EG.bgrip=new THREE.CylinderGeometry(.034,.034,.14,8);
  EG.leaf=agLeaf();
  EG.sickle=flat(s=>{ s.moveTo(-.02,.06); s.quadraticCurveTo(.34,.26,.1,.66); s.quadraticCurveTo(.2,.32,-.02,.14); s.lineTo(-.02,.06); },.012,.005);
  EG.sickleL=(()=>{ const g=EG.sickle.clone(); g.scale(-1,1,1); return g; })();
  EG.sgrip=new THREE.CylinderGeometry(.018,.018,.16,7);
  EG.twist=agTube([new V3(0,-.8,0),new V3(.03,-.3,.02),new V3(-.02,.2,-.02),new V3(.02,.6,.01),new V3(0,.76,0)],.03,.02,24,7);
  EG.fork=agMerge([agTube([new V3(0,.74,0),new V3(.07,.82,0),new V3(.08,.95,.02),new V3(.02,1.03,0)],.016,.008,10,5),agTube([new V3(0,.74,0),new V3(-.07,.83,.01),new V3(-.07,.96,-.02),new V3(-.01,1.03,0)],.016,.008,10,5)]);
  EG.seed=new THREE.SphereGeometry(.05,12,9);
  EG.mstaff=new THREE.CylinderGeometry(.022,.028,1.6,7);
  EG.crystal=(()=>{ const g=new THREE.OctahedronGeometry(.07,0); g.scale(.75,1.6,.75); return g; })();
  EG.roots=agMerge([0,1,2].map(i=>{ const a=i/3*Math.PI*2; return agTube([new V3(0,.62,0),new V3(Math.cos(a)*.06,.7,Math.sin(a)*.06),new V3(Math.cos(a)*.05,.84,Math.sin(a)*.05),new V3(Math.cos(a)*.015,.92,Math.sin(a)*.015)],.014,.006,8,5); }));
  EG.basket=new THREE.CylinderGeometry(.14,.11,.24,10,1,true); EG.brim=(()=>{ const g=new THREE.TorusGeometry(.14,.018,5,14); g.rotateX(Math.PI/2); return g; })();
  EG.quiver=new THREE.CylinderGeometry(.065,.05,.48,10); EG.qfl=new THREE.BoxGeometry(.012,.11,.04);
  EG.club=agTube([new V3(0,-.1,0),new V3(.03,.35,0),new V3(-.04,.7,.03),new V3(.02,1.05,0),new V3(0,1.25,0)],.07,.15,16,8);
  EG.knot=new THREE.SphereGeometry(.09,9,7);
}); }
const egM=(c,o)=>lamOf(c,o);
// build an elf's weapons into G (instead of the Order's); true if this type has elven gear
function buildElfGear(u,G){
  egInit(); const st=u.statue, S=st?M.stoneD:null, wood=S||egM('#6a4a2a'), dark=S||egM('#2a3a22'), gold=S||egM('#d8b048'), silver=S||egM('#d6dde4'), leaf=S||egM('#4f8a2a',{side:THREE.DoubleSide}), leaf2=S||egM('#6aa83a',{side:THREE.DoubleSide});
  const glow=c=>S||egM(c,{emissive:c});
  switch(u.type){
    case 'miner':{ const w=grp(); w.add(mesh(EG.sgrip,wood,0,.02,0),mesh(EG.sickle,silver,0,.06,0)); G.w=w;
      const b=grp(); b.add(mesh(EG.basket,S||egM('#a07a42',{side:THREE.DoubleSide}),0,.05,0),mesh(EG.brim,wood,0,.17,0)); G.b=b; b.visible=false; return true; }
    case 'sword':{ const w=grp(); w.add(mesh(EG.grip,dark,0,.02,0),mesh(EG.guard,gold,0,.13,0),mesh(EG.gem,glow('#9aff9a'),0,-.07,0),mesh(EG.blade,silver,0,.12,0)); G.w=w; return true; }
    case 'spear':{ const w=grp(); w.add(mesh(EG.shaft,wood,0,.3,0),mesh(EG.collar,gold,0,1.27,0),mesh(EG.collar,gold,0,.05,0),mesh(EG.glaive,silver,0,1.26,0));
      const tip=mesh(EG.leaf,leaf,0,-.7,0); tip.scale.set(.06,.1,.06); tip.rotation.z=Math.PI; w.add(tip); G.w=w; return true; }
    case 'hawk': case 'archer':{ const o=grp(); o.add(mesh(GEO.bow,S||egM('#5a3a1e')),mesh(EG.recurve,gold),mesh(EG.bgrip,dark));
      for(const sd of [-1,1]){ const l=mesh(EG.leaf,leaf2,0,sd*.25,-.06); l.scale.set(.07,.1,.07); l.rotation.z=sd>0?0:Math.PI; o.add(l); } G.o=o;
      const b=grp(); const q=mesh(EG.quiver,S||egM('#4a3622')); q.rotation.z=.25; b.add(q,mesh(EG.brim,gold,.055,.22,0)); b.children[1].scale.setScalar(.45);
      for(let i=0;i<3;i++){ const f=mesh(EG.qfl,S||egM('#9ad86a'),-.01+.03*i+.05,.29,0); f.rotation.z=.25; b.add(f); } G.b=b;
      G.str={a:new V3(),m:new V3(),b:new V3(),vis:false}; G.nock=arrowMesh(egM('#9ad86a')); G.nock.visible=false;
      if(u.type==='hawk') buildHawk(G,S);   // the hawk on her shoulder (27k)
      return true; }
    case 'ninja':{ const w=grp(); w.add(mesh(EG.sgrip,dark,0,0,0),mesh(EG.sickle,silver,0,.05,0)); G.w=w;
      const w2=grp(); w2.add(mesh(EG.sgrip,dark,0,0,0),mesh(EG.sickleL,silver,0,.05,0)); G.w2=w2; return true; }
    case 'cleric':{ const w=grp(); w.add(mesh(EG.twist,wood,0,0,0),mesh(EG.fork,wood,0,0,0),mesh(EG.seed,glow('#b8ff7a'),0,.92,0));
      for(const [x,y,r] of [[.05,.7,-.6],[-.05,.66,.7],[.03,.55,-.9]]){ const l=mesh(EG.leaf,leaf,x,y,0); l.scale.set(.07,.1,.07); l.rotation.z=r; w.add(l); } G.w=w;
      // the robe, in forest green with leaf-gold trim (the Cleric's cut)
      gxInit(); const robe=S||egM('#2f5a2a',{side:THREE.DoubleSide}), trim=gold;
      const r=grp(); r.add(mesh(GX.robeTop,robe,0,.285,0),mesh(GX.collar,trim,0,.57,0)); G.r=r;
      const k=grp(); k.add(mesh(GX.skirt,robe),mesh(GX.hem,trim,0,-.85,0)); for(let i=0;i<6;i++){ const a=i/6*Math.PI*2, l=mesh(EG.leaf,leaf2,Math.sin(a)*.34,-.86,Math.cos(a)*.34); l.scale.set(.08,.12,.08); l.rotation.y=a; l.rotation.x=Math.PI*.9; k.add(l); } G.k=k;
      return true; }
    case 'wizard':{ const w=grp(); w.add(mesh(EG.mstaff,wood,0,-.1,0),mesh(EG.roots,wood,0,0,0),mesh(EG.crystal,glow('#7ae0d0'),0,.8,0));
      for(const [y,r] of [[.66,-.7],[.62,.8]]){ const l=mesh(EG.leaf,leaf,0,y,0); l.scale.set(.07,.1,.07); l.rotation.z=r; w.add(l); } G.w=w; return true; }
    case 'giant':{ const w=grp(); w.add(mesh(EG.club,S||egM('#4a3622'),0,0,0)); for(const [x,y,z] of [[.1,.6,0],[-.12,.95,.05],[.08,1.15,-.06]]) w.add(mesh(EG.knot,S||egM('#3e2c1a'),x,y,z));
      for(const [x,y,r] of [[.14,.8,-.8],[-.14,1.05,.9],[.1,1.25,-.4]]){ const l=mesh(EG.leaf,leaf,x,y,0); l.scale.set(.14,.2,.14); l.rotation.z=r; w.add(l); } G.w=w; return true; }
  }
  return false;
}
// the second blade of a Twin-Blade Assassin
function updateElfGear(u){ const G=u.G; if(G&&G.w2&&!G.w2.dropped) orient(G.w2,u.j.hL,u.wLw,u.rightW); }

// ---- the clan dress, per role: Armory pieces worn by every elf (made on first use) ----
let ELF_DRESS=null;
function elfDressParts(){
  if(ELF_DRESS) return ELF_DRESS;
  const G='#d8b048', SV='#d6dde4', BK='#5a3e24', LF='#4f8a2a', LF2='#6aa83a', DK='#2a3a22', HD='#2f5a2a';
  const leafPauld=(c,c2)=>SIDES('pa','leafFan','c',c,[.02,.03,0],[-Math.PI/2,0,-Math.PI/2-.25],[.09,.12,.09]).concat(SIDES('pa','leafFan','c',c2,[.04,0,0],[-Math.PI/2,0,-Math.PI/2-.6],[.08,.11,.08]));
  const bracers=(c,b)=>SIDES('fa','bracer','l',c,[0,.66,0],0,[.058,.5,.058]).concat(SIDES('fa','ring','m',b,[0,.9,0],0,[.064,.16,.064]));
  const tag=(L,cat)=>L.map(p=>Object.assign(p,{cat}));
  ELF_DRESS={
    plain:[].concat(tag(plates(BK,'l'),'chest'),tag(trims(LF,'c'),'chest'),tag(bootsOf(BK,LF),'boots')),
    sentinel:[].concat(tag(plates(SV),'chest'),tag(trims(G),'chest'),tag(tassets(SV,G),'chest'),tag([PT('torso','leaf','m',G,[0,.4,.136],[-.08,0,0],[.06,.1,.05])],'chest'),
      tag(pauldron(SV,LF,G),'shoulders'),tag(SIDES('pa','leaf','c',LF2,[.03,.08,0],[-.5,0,-.6],[.07,.09,.08]),'shoulders'),tag(bracers(BK,G),'gloves'),tag(bootsOf(BK,LF),'boots')),
    hunter:[].concat(tag(plates(BK,'l'),'chest'),tag(trims(G),'chest'),tag(leafPauld(LF,LF2),'shoulders'),tag(bracers(BK,G),'gloves'),tag(bootsOf(BK,LF),'boots'),tag(beltOf('#3a6a22',G,'c'),'belt')),
    hood:[].concat(tag(plates(HD,'c',1.02),'chest'),tag(trims(G),'chest'),tag(SIDES('fa','bracer','l',BK,[0,.66,0],0,[.058,.5,.058]).filter(p=>p.f==='faL'),'gloves'),tag(bootsOf(BK,LF),'boots'),tag(beltOf(BK,G),'belt')),
    assassin:[].concat(tag(plates('#1e2a1e','c',1.02),'chest'),tag(trims('#5a6a4a','c'),'chest'),tag(bracers('#1e2a1e','#5a6a4a'),'gloves'),tag(bootsOf('#1e2a1e','#2a3a22'),'boots')),
    druid:[].concat(tag([PT('head','antR','l','#d8c8a0',[0,0,0],0,.85),PT('head','antL','l','#d8c8a0',[0,0,0],0,.85),PT('head','ringT','m',G,[0,.36,0],[-.1,0,0],[1.0,1.4,1.04])],'helm'),tag(leafPauld(LF,LF2),'shoulders')),
    mage:[].concat(tag(plates(HD,'c',1.02),'chest'),tag(trims(G),'chest'),tag(tassets(HD,G,'c'),'chest'),tag(circlet(G,'#7ae0d0',3),'helm'),tag(SIDES('pa','dome','c',HD,[.034,.014,0],[0,0,-.38],[.1,.07,.11]),'shoulders'),tag(bootsOf(BK,G),'boots')),
    wing:[].concat(tag(plates(BK,'l'),'chest'),tag(trims(G),'chest'),tag(SIDES('pa','feather','c','#8a6034',[.04,.04,0],[-1.2,0,-1.3],[.09,.16,.1]),'shoulders'),tag(bootsOf(BK,LF),'boots')),
    giant:[].concat(tag(plates('#4a3622','l',1.05),'chest'),tag(SIDES('pa','dome','l','#3e2c1a',[.04,.02,0],[0,0,-.4],[.11,.08,.12]),'shoulders')),
  };
  return ELF_DRESS;
}
// draw the dress on an elf (the Armory kit, if any, takes the slots it fills)
function drawElfDress(u,role){
  const D=elfDressParts(), L=D[u.type==='giant'?'giant':u.type==='wing'?'wing':role]; if(!L) return;
  const C=armCtx(u); if(!C) return;
  const kit=(u.team===myTeam()||ARM.on)&&settings.armory?armKit(u,facOf(u.team)):null, has={};
  if(kit) for(const I of kit) has[I.cat]=1;
  armParts(C,has.chest||has.shoulders||has.gloves||has.boots||has.helm||has.belt?L.filter(p=>!has[p.cat]):L,null,!!u.T.robe);
  if(u.type==='giant'&&u.alive) for(const sd of [-1,1]) if(afPt(C,'head',sd*.3,.1,.9,_ar1)) glowAt(_ar1,.035*u.s,'#b8ff7a');
}
