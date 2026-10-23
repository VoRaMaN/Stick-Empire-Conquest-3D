/* ================= The Wildlands Confederacy: the third faction =================
   The free clans of the old forests. They fight with the Order's bodies under their own names and colours (moss-green
   sticks, leaf crowns) and their own strengths, kept in a per-unit copy of the unit sheet (u.T inherits TYPES[type]):
     Forager (worker) · Thorn Warden (fast blades) · Sylvan Ranger (fast archers that shoot quicker) ·
     Shade Stalker (ninja) · Grove Druid (healer; with Call of the Forest she summons Treants) · Ancient Treant.
   Wildlands soldiers regrow wounds out of the fight (faster in a forest), and their general, the Elven Captain, calls
   Bloom (a wave of healing) and Grasping Roots (an enemy crowd is held fast). Their castle is the Order's plan in
   mossy stone with green roofs (37c). The economy runs on gold, like the Order's. */
const WILD=['miner','sword','spear','archer','ninja','cleric','wizard','wing','knight','giant'];
const WILD_BODY=[new THREE.Color('#1c3a1c'),new THREE.Color('#2e3814')];
const BARK=new THREE.Color('#4a3622');
const WILD_DEF={
  miner:{name:'Elf Forager',pl:'Elf Foragers'},
  sword:{name:'Veteran Sentinel',pl:'Veteran Sentinels',hp:125,speed:4.8,cost:130},
  spear:{name:'Spear Hunter',pl:'Spear Hunters',hp:220,speed:3,armor:.25,cost:340},
  archer:{name:'Elf Archer',pl:'Elf Archers',speed:4.3,cd:1.4,hp:80,cost:260},
  ninja:{name:'Twin-Blade Assassin',pl:'Twin-Blade Assassins',dmg:24},
  cleric:{name:'Druid',pl:'Druids',hp:115,cost:380},
  wizard:{name:'Nature Mage',pl:'Nature Mages'},
  wing:{name:'Eagle Scout',pl:'Eagle Scouts',speed:4},
  knight:{name:'Woodland Wyvern Rider',pl:'Woodland Wyvern Riders'},
  giant:{name:'Ancient Guardian',pl:'Ancient Guardians',hp:1250,speed:1.35,cost:1150,bark:1},
};
const WILD_T={};
for(const t in WILD_DEF){ const D=WILD_DEF[t], T=Object.create(TYPES[t]); for(const k in D) if(k!=='pl'&&k!=='bark') T[k]=D[k];
  T.wild=true; T.body=D.bark?[BARK,BARK]:WILD_BODY; WILD_T[t]=T; }
// a Treant called up by a Druid: smaller, short-lived
WILD_T.sapling=Object.assign(Object.create(TYPES.giant),{name:'Treant',hp:460,dmg:46,speed:1.7,cost:0,wild:true,summoned:true,body:[BARK,BARK]});
FACTIONS.wild={id:'wild',name:'Wildlands Confederacy',roster:WILD,worker:'miner',garrison:'archer',garrisonAtk:'shoot',statue:'sword',money:'gold',
  team:['Verdant Host','Thornwood Clans'],cap:['Elderwood','Thornwood'],
  start:['miner','miner','sword','sword','archer','archer','archer','cleric'],
  mix:['sword','archer','sword','archer','ninja','cleric','spear','archer','archer','sword','wizard','cleric','ninja','giant','archer','sword','wing','archer','cleric','sword','ninja','archer','spear','knight']};
ECON.wild=1;
// the unit sheet a soldier of this army fights with, and the names the HUD shows
function unitT(type,team){ return team!==undefined&&team<2&&WILD_DEF[type]&&facOf(team)==='wild'?WILD_T[type]:TYPES[type]; }
const tName=(t,team)=>unitT(t,team===undefined?myTeam():team).name;
const tPl=(t,team)=>facOf(team===undefined?myTeam():team)==='wild'&&WILD_DEF[t]?WILD_DEF[t].pl:(TYPE_PL[t]||TYPES[t].name+'s');
// the general's shopping list
function wildPick(){ const r=Math.random(); return r<.22?'sword':r<.48?'archer':r<.57?'ninja':r<.68?'cleric':r<.76?'spear':r<.83?'wizard':r<.88?'wing':r<.94?'knight':'giant'; }

/* ---------- regrowth: out of the fight a Wildlands soldier heals (twice as fast in a forest) ---------- */
function wildTick(dt){
  game.wildT=(game.wildT||0)-dt; if(game.wildT>0) return; game.wildT=.5;
  for(const u of units){ if(!u.alive||!u.T.wild||!u.isUnit||u.hp>=u.maxHp) continue; if(game.time-(u.hurtAt||-99)<5) continue;
    const forest=RL.on&&typeof inForest==='function'&&inForest(u.pos.x,u.pos.z);
    u.hp=Math.min(u.maxHp,u.hp+u.maxHp*(forest?.02:.01)); }
  // the clans' general sends his Druids' Treants into a fight (and yours on Auto-spawn)
  if(!NET.guest) for(const r of regs){ const t=r.team; if(r.type!=='cleric'||facOf(t)!=='wild'||!(t!==myTeam()&&!NET.on||game.auto[t]&&t===myTeam()&&!NET.on)) continue;
    if(!regAbilities(r).includes('summon')||!regAbReady(r,'summon')) continue; const c=regCenter(r); if(enemiesNear(t,c.x,c.z,16)>=3) regAbility(t,r,'summon'); }
  // summoned Treants wither when their time is up
  for(const u of units) if(u.alive&&u.summonT&&game.time>u.summonT&&!NET.guest){ puff(u.j.chest,10,.4,1.5,'#6a8a3a'); u.invuln=false; kill(u,new V3(0,1,0),{}); }
}
// a Druid regiment calls Treants up out of the ground (two in a forest)
function summonTreants(team,x,z,n){
  const out=[];
  for(let i=0;i<n;i++){ const a=rand(0,TAU), px=x+Math.cos(a)*2.2, pz=z+Math.sin(a)*2.2;
    const u=makeUnit('giant',team,px,pz,{T:WILD_T.sapling,s:TYPES.giant.s*.72}); u.isUnit=true; u.summonT=game.time+40; units.push(u); assignRegiment(u);
    puff(u.pos,12,.5,2.2,'#5a7a2a'); puff(u.pos,8,.4,1.4,'#6a4a2a'); out.push(u); }
  if(game.stance) assignSlots(team);
  sfx('stone',new V3(x,H(x,z),z),.8);
  return out;
}

/* ---------- the look: elves. Natural skin, long hair, pointed ears, green hoods and cloaks; the Guardian grows branches and moss ---------- */
const LEAF=[new THREE.Color('#4f8a2a'),new THREE.Color('#6aa83a'),new THREE.Color('#3a6a22')], MOSS=new THREE.Color('#5a7a2a');
const ELF_SKIN=['#efcfab','#ddb08a','#bf8e66','#93633f'].map(c=>new THREE.Color(c)), ELF_HAIR=['#e8dfc4','#c9a25a','#6a4022','#2a1a10','#b8c4c8'].map(c=>new THREE.Color(c));
const ELF_HOOD=[new THREE.Color('#2f5a2a'),new THREE.Color('#3e4a1e'),new THREE.Color('#24402e')], ELF_CLOAK=new THREE.Color('#2a4422'), ELF_STEEL=new THREE.Color('#c8ced6'), ELF_GOLD=new THREE.Color('#d8b04a');
const ELF_ROLE={miner:'plain',sword:'sentinel',spear:'hunter',archer:'hood',ninja:'assassin',cleric:'druid',wizard:'mage',wing:'hood',rider:'rider'};
const _wl1=new V3(),_wl2=new V3(),_wl3=new V3(),_wl4=new V3(),_wlq=new THREE.Quaternion(),_wlm=new THREE.Matrix4();
// drawn over a stick figure's head and hands: j = its joints, F/R its forward and right
function elfDress(j,s,id,role,F,R){
  id=Math.abs(id|0); const U=_wl2.subVectors(j.head,j.neck).normalize(), skin=ELF_SKIN[(id*7)%4], hair=ELF_HAIR[(id*3+1)%5];
  sph(j.head,.2*s,skin,sphIM);
  sph(_wl1.copy(j.head).addScaledVector(F,-.055*s).addScaledVector(U,.035*s),.2*s,hair,sphIM);   // hair over the crown and back
  if(role!=='assassin'&&role!=='rider'){ _wl3.copy(j.neck).addScaledVector(F,-.13*s).addScaledVector(U,-.12*s); cyl(_wl1.copy(j.head).addScaledVector(F,-.12*s),_wl3,.085*s,hair,limbIM); }
  for(const sd of [-1,1]){ _wl1.copy(j.head).addScaledVector(R,sd*.175*s).addScaledVector(F,-.01*s); _wl3.copy(_wl1).addScaledVector(R,sd*.12*s).addScaledVector(U,.14*s).addScaledVector(F,-.07*s);
    cyl(_wl1,_wl3,.026*s,skin,limbIM); sph(_wl1,.034*s,skin,jointIM); }
  sph(j.hL,.068*s,skin,jointIM); sph(j.hR,.068*s,skin,jointIM);
  const hood=ELF_HOOD[id%3];
  if(role==='hood'||role==='assassin'||role==='hunter'){ sph(_wl1.copy(j.head).addScaledVector(F,-.07*s).addScaledVector(U,.03*s),.218*s,hood,sphIM); }
  if(role==='sentinel'||role==='hunter'||role==='rider'){ for(const sh of [j.sL,j.sR]){ sph(_wl1.copy(sh).addScaledVector(U,.03*s),.1*s,LEAF[2],jointIM); } }
  if(role==='sentinel'||role==='rider'||role==='mage'||role==='druid'){ _wl1.copy(j.head).addScaledVector(F,.17*s).addScaledVector(U,.09*s); glowAt(_wl1,.025*s,role==='mage'?'#9aff9a':'#ffe08a');
    for(const sd of [-1,1]){ _wl3.copy(j.head).addScaledVector(R,sd*.15*s).addScaledVector(U,.1*s); cyl(_wl1,_wl3,.012*s,ELF_GOLD,limbIM); } }
  if(role==='hood'||role==='druid'||role==='mage'||role==='sentinel'||role==='assassin'){   // the cloak
    _wl1.copy(j.neck).lerp(j.pelvis,.55).addScaledVector(F,-.15*s); _wl3.subVectors(j.neck,j.pelvis).normalize(); _wl4.crossVectors(_wl3,R).normalize();
    _wlm.makeBasis(R,_wl3,_wl4); _wlq.setFromRotationMatrix(_wlm); blob(_wl1,_wlq,.19*s,.4*s,.025*s,role==='druid'||role==='mage'?LEAF[0]:ELF_CLOAK); }
}
function drawWildFx(u){
  const j=u.j, s=u.s; _wl2.subVectors(j.head,j.neck).normalize();
  if(u.type==='giant'){
    for(const [sh,sd] of [[j.sL,-1],[j.sR,1]]){ _wl1.copy(sh).addScaledVector(_wl2,.32*s).addScaledVector(u.rightW,sd*.16*s); cyl(sh,_wl1,.05*s,BARK,limbIM);
      _wl3.copy(_wl1).addScaledVector(_wl2,.22*s).addScaledVector(u.rightW,sd*.12*s).addScaledVector(u.fwdW,-.06*s); cyl(_wl1,_wl3,.03*s,BARK,limbIM);
      for(let k=0;k<3;k++){ _wl1.copy(_wl3).addScaledVector(u.fwdW,(k-1)*.08*s).addScaledVector(_wl2,(k%2)*.06*s); sph(_wl1,.1*s,LEAF[k],jointIM); }
      sph(_wl3.copy(sh).addScaledVector(_wl2,.06*s),.1*s,MOSS,jointIM); }
    for(let k=0;k<5;k++){ const a=k/5*TAU; _wl1.copy(j.head).addScaledVector(_wl2,.14*s); _wl1.x+=Math.cos(a)*.11*s; _wl1.z+=Math.sin(a)*.11*s; sph(_wl1,.06*s,LEAF[k%3],jointIM); }
    return; }
  if(!u.elfDone){ u.elfDone=1; if(u.G&&u.G.h){ dropRoot(u.G.h); u.G.h=null; } }   // no helmets, hats or beards on an elf
  const role=ELF_ROLE[u.type]||'plain';
  elfDress(j,s,u.id||0,role,u.fwdW,u.rightW);
  if(role==='assassin'&&u.alive){ _wl1.copy(j.hL).addScaledVector(u.wLw,.58*s); cyl(j.hL,_wl1,.014*s,ELF_STEEL,limbIM); }   // the second blade
}
