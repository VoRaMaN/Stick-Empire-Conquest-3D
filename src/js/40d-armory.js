/* ================= The Armory (v0.28): kit your army, faction by faction =================
   Each faction has its own armory, a 3D room the turntable stands in: the Order's castle armoury (stone, pillars,
   banners, weapon racks, torches), the Chaos infernal forge (basalt, lava channels, anvils, chains, braziers) and the
   Wildlands' elven armoury inside a hollow tree (roots, glowing mushrooms, lanterns, moss).
   Thirteen equipment categories: helm, crest, shoulders, chest, cape, gloves, belt, boots, weapon enchantment,
   off-hand, back, trinket, mount barding. Every piece is drawn on the soldier's own joints every frame, so it moves
   with him in the armoury and in battle. A loadout is kept per faction and unit type (settings.armory) and worn by
   your army in every battle. Compatibility: pieces belong to a faction; an off-hand needs a free left hand (not
   archers, Spartans, casters, Wing Archers, or the elven Twin-Blade Assassin); barding only fits a mount; Hades
   wears his own crown of fire; a hood leaves no room for a crest; a bulky back piece (banner, quiver) does not go
   over a long cape. The kit is for looks: it changes nothing in a fight, so online battles stay fair. */
const ARM={on:false,fac:null,type:null,cat:'helm',env:null,fx:[],light:null};
const ARM_CATS=[['helm','Helm'],['crest','Crest'],['shoulders','Shoulders'],['chest','Chest'],['cape','Cape'],['gloves','Gloves'],['belt','Belt'],['boots','Boots'],
  ['weapon','Weapon'],['offhand','Off-hand'],['back','Back'],['trinket','Trinket'],['mount','Mount']];
const ARM_C={}; const armC=c=>ARM_C[c]||(ARM_C[c]=new THREE.Color(c));
const ARM_ENV={order:'The Castle Armoury',chaos:'The Infernal Forge',wild:'The Elven Armoury'};
const ARM_NOOFF={archer:1,spear:1,wizard:1,cleric:1,wing:1,oracle:1,harvester:1,bomber:1};
const _ar1=new V3(),_ar2=new V3(),_ar3=new V3(),_arq=new THREE.Quaternion(),_arm=new THREE.Matrix4();
// drawing kit: C = {j, s, F (forward), R (right), U (up the head), u}
const AD={
  orb:(C,p,r,c)=>sph(p,r*C.s,armC(c),jointIM),
  rod:(C,a,b,r,c)=>cyl(a,b,r*C.s,armC(c),limbIM),
  slab:(C,p,sx,sy,sz,c,up,fw)=>{ const Y=up||C.U, Z=fw||C.F; _ar3.crossVectors(Y,Z).normalize(); _arm.makeBasis(_ar3,Y,_ar1.crossVectors(_ar3,Y).normalize()); _arq.setFromRotationMatrix(_arm); blob(p,_arq,sx*C.s,sy*C.s,sz*C.s,armC(c)); },
  head:(C,f,u,r)=>_ar1.copy(C.j.head).addScaledVector(C.F,(f||0)*C.s).addScaledVector(C.U,(u||0)*C.s).addScaledVector(C.R,(r||0)*C.s),
  spine:()=>_ar2,
};
const spineOf=C=>_ar2.subVectors(C.j.neck,C.j.pelvis).normalize();
const helmet=(c,vis)=>C=>{ AD.orb(C,AD.head(C,-.01,.03),.215,c); if(vis){ AD.slab(C,AD.head(C,.19,.0),.12,.016,.02,'#141414'); } };
const horns=(c)=>C=>{ for(const sd of [-1,1]){ const a=AD.head(C,0,.12,sd*.14).clone(), b=_ar3.copy(a).addScaledVector(C.R,sd*.16*C.s).addScaledVector(C.U,.18*C.s).addScaledVector(C.F,-.05*C.s); AD.rod(C,a,b,.03,c); AD.orb(C,b,.025,c); } };
const glowRing=(c,n,y,r)=>C=>{ const t=game.time; for(let i=0;i<n;i++){ const a=i/n*TAU+t; _ar1.copy(C.j.head).addScaledVector(C.U,(y||.32)*C.s).addScaledVector(C.R,Math.cos(a)*(r||.15)*C.s).addScaledVector(C.F,Math.sin(a)*(r||.15)*C.s); glowAt(_ar1,.035*C.s,c); } };
const pauld=(c,spike)=>C=>{ const Sp=spineOf(C); for(const sh of [C.j.sL,C.j.sR]){ _ar1.copy(sh).addScaledVector(Sp,.04*C.s); AD.orb(C,_ar1,.11,c); if(spike){ _ar3.copy(_ar1).addScaledVector(Sp,.2*C.s); AD.rod(C,_ar1,_ar3,.025,spike); } } };
const chestPlate=(c,trim)=>C=>{ const Sp=spineOf(C); _ar1.copy(C.j.pelvis).lerp(C.j.chest,.75).addScaledVector(C.F,.06*C.s); AD.slab(C,_ar1,.15,.2,.11,c,Sp); if(trim){ _ar1.addScaledVector(C.F,.1*C.s); AD.slab(C,_ar1,.03,.17,.02,trim,Sp); } };
const cape=(c,len,w)=>C=>{ const Sp=spineOf(C); _ar1.copy(C.j.neck).lerp(C.j.pelvis,.5*len).addScaledVector(C.F,-.14*C.s).addScaledVector(Sp,-(len-1)*.25*C.s); AD.slab(C,_ar1,.2*(w||1),.38*len,.022,c,Sp); };
const gloves=(c,claw)=>C=>{ for(const [h,e] of [[C.j.hL,C.j.eL],[C.j.hR,C.j.eR]]){ AD.orb(C,h,.075,c); _ar1.copy(e).lerp(h,.55); AD.orb(C,_ar1,.062,c); if(claw){ _ar3.copy(h).addScaledVector(_ar1.subVectors(h,e).normalize(),.12*C.s); AD.rod(C,h,_ar3,.012,claw); } } };
const belt=(c,buckle)=>C=>{ const Sp=spineOf(C); _ar1.copy(C.j.pelvis).addScaledVector(Sp,.05*C.s); AD.slab(C,_ar1,.17,.04,.13,c,Sp); if(buckle){ _ar1.addScaledVector(C.F,.13*C.s); AD.orb(C,_ar1,.035,buckle); } };
const boots=(c,cuff)=>C=>{ for(const [k,f] of [[C.j.kL,C.j.fL],[C.j.kR,C.j.fR]]){ _ar1.copy(k).lerp(f,.35); AD.rod(C,_ar1,f,.075,c); if(cuff) AD.orb(C,_ar1,.07,cuff); } };
const enchant=(c,fire)=>C=>{ const u=C.u; if(!u||!u.wRw) return; for(let i=1;i<=4;i++){ _ar1.copy(C.j.hR).addScaledVector(u.wRw,i*.22*C.s); glowAt(_ar1,(.05+.015*Math.sin(game.time*9+i))*C.s,c); }
  if(fire&&Math.random()<.15){ _ar1.copy(C.j.hR).addScaledVector(u.wRw,.7*C.s); puff(_ar1,1,.06,.6,c); } };
const offhand=(c,r,em)=>C=>{ _ar1.copy(C.j.hL).addScaledVector(C.F,.05*C.s); AD.slab(C,_ar1,r,r*1.15,.025,c,spineOf(C)); if(em){ _ar1.addScaledVector(C.F,.03*C.s); AD.orb(C,_ar1,r*.32,em); } };
const lantern=(c)=>C=>{ _ar1.copy(C.j.hL).addScaledVector(spineOf(C),-.15*C.s); AD.orb(C,_ar1,.06,'#3a2a1a'); glowAt(_ar1,(.1+.02*Math.sin(game.time*7))*C.s,c); };
const banner=(pole,flag)=>C=>{ const Sp=spineOf(C); _ar1.copy(C.j.chest).addScaledVector(C.F,-.2*C.s); _ar3.copy(_ar1).addScaledVector(Sp,1.1*C.s); AD.rod(C,_ar1,_ar3,.018,pole);
  _ar1.copy(_ar3).addScaledVector(Sp,-.22*C.s).addScaledVector(C.F,-.18*C.s); AD.slab(C,_ar1,.012,.2,.18,flag,Sp,C.R); };
const quiver=(c)=>C=>{ const Sp=spineOf(C); _ar1.copy(C.j.chest).addScaledVector(C.F,-.18*C.s).addScaledVector(C.R,.08*C.s); _ar3.copy(_ar1).addScaledVector(Sp,.45*C.s).addScaledVector(C.R,.1*C.s); AD.rod(C,_ar1,_ar3,.06,c); };
const spines=(c)=>C=>{ const Sp=spineOf(C); for(let i=0;i<4;i++){ _ar1.copy(C.j.pelvis).lerp(C.j.neck,.2+i*.22).addScaledVector(C.F,-.12*C.s); _ar3.copy(_ar1).addScaledVector(C.F,-.18*C.s).addScaledVector(Sp,.08*C.s); AD.rod(C,_ar1,_ar3,.02,c); } };
const motes=(c,n,r)=>C=>{ const t=game.time; for(let i=0;i<n;i++){ const a=t*(1.2+i*.13)+i*2.1; _ar1.copy(C.j.chest).addScaledVector(C.R,Math.cos(a)*r*C.s).addScaledVector(C.F,Math.sin(a)*r*C.s).addScaledVector(spineOf(C),Math.sin(t*2+i)*.3*C.s); glowAt(_ar1,.03*C.s,c); } };
const embers=(c)=>C=>{ if(Math.random()<.25){ _ar1.copy(C.u?C.u.pos:C.j.pelvis); _ar1.x+=rand(-.4,.4); _ar1.z+=rand(-.4,.4); _ar1.y=(C.u?C.u.pos.y:C.j.pelvis.y)+.05; puff(_ar1,1,.06,.9,c); } };
// mount barding: drawn on the beast's body (C.cr = its rig)
const bard=(c,c2)=>C=>{ const u=C.u, cr=u.cr, s=u.s; _ar1.copy(cr.C).addScaledVector(cr.n,.05*s); blob(_ar1,_arq.setFromUnitVectors(UP,cr.n),.28*s,.06*s,.3*s,armC(c));
  _ar1.copy(u.j.pelvis).lerp(cr.C,.5).addScaledVector(cr.n,.2*s); blob(_ar1,_arq,.24*s,.04*s,.34*s,armC(c2||c)); };
const chains=(c)=>C=>{ const u=C.u, cr=u.cr, s=u.s; for(let i=0;i<5;i++){ _ar1.copy(u.j.pelvis).lerp(cr.C,i/4).addScaledVector(cr.n,.18*s).addScaledVector(cr.rc,(i%2?.18:-.18)*s); sph(_ar1,.05*s,armC(c),jointIM); } };
const vines=(c)=>C=>{ const u=C.u, cr=u.cr, s=u.s; for(let i=0;i<6;i++){ _ar1.copy(u.j.pelvis).lerp(cr.C,i/5).addScaledVector(cr.n,.16*s).addScaledVector(cr.rc,Math.sin(i*1.7)*.2*s); sph(_ar1,.06*s,LEAF[i%3],jointIM); } };
const ARM_ITEMS=[
  // ---- Order ----
  {id:'o_greathelm',cat:'helm',fac:'order',name:'Great Helm',hideH:1,d:helmet('#c8ced6',1)},
  {id:'o_winghelm',cat:'helm',fac:'order',name:'Winged Helm',hideH:1,d:C=>{ helmet('#d6dbe2')(C); for(const sd of [-1,1]) AD.slab(C,AD.head(C,-.05,.14,sd*.2),.02,.1,.14,'#f0ece0',C.U,C.F); }},
  {id:'o_circlet',cat:'helm',fac:'order',name:'Royal Circlet',d:glowRing('#ffd36a',6,.18,.17)},
  {id:'o_plume',cat:'crest',fac:'order',name:'Crimson Plume',d:C=>{ const a=AD.head(C,0,.22).clone(); _ar3.copy(a).addScaledVector(C.U,.12*C.s).addScaledVector(C.F,-.16*C.s); AD.rod(C,a,_ar3,.05,'#b02a2a'); }},
  {id:'o_feather',cat:'crest',fac:'order',name:'White Feathers',d:C=>{ for(const sd of [-1,1]){ const a=AD.head(C,-.04,.2,sd*.06).clone(); _ar3.copy(a).addScaledVector(C.U,.2*C.s).addScaledVector(C.F,-.1*C.s); AD.rod(C,a,_ar3,.03,'#f4f0e6'); } }},
  {id:'o_pauld',cat:'shoulders',fac:'order',name:'Plate Pauldrons',d:pauld('#c8ced6')},
  {id:'o_gpauld',cat:'shoulders',fac:'order',name:'Gilded Pauldrons',d:pauld('#e2ae35')},
  {id:'o_breast',cat:'chest',fac:'order',name:'Breastplate',d:chestPlate('#c8ced6','#e2ae35')},
  {id:'o_tabard',cat:'chest',fac:'order',name:'Royal Tabard',d:chestPlate('#2a4aa8','#e2ae35')},
  {id:'o_cape',cat:'cape',fac:'order',name:'Royal Cape',long:1,d:cape('#2a4aa8',1.25)},
  {id:'o_halfcape',cat:'cape',fac:'order',name:'Half Cloak',d:cape('#7a1a1a',.7)},
  {id:'o_gaunt',cat:'gloves',fac:'order',name:'Gauntlets',d:gloves('#c8ced6')},
  {id:'o_belt',cat:'belt',fac:'order',name:'Sword Belt',d:belt('#4a2e1a','#e2ae35')},
  {id:'o_greaves',cat:'boots',fac:'order',name:'Greaves',d:boots('#c8ced6','#e2ae35')},
  {id:'o_holy',cat:'weapon',fac:'order',name:'Holy Light',d:enchant('#ffe08a')},
  {id:'o_frost',cat:'weapon',fac:'order',name:'Frostbrand',d:enchant('#9ae0ff')},
  {id:'o_buckler',cat:'offhand',fac:'order',name:'Buckler',d:offhand('#c8ced6',.11,'#e2ae35')},
  {id:'o_kite',cat:'offhand',fac:'order',name:'Kite Shield',d:offhand('#2a4aa8',.17,'#e2ae35')},
  {id:'o_banner',cat:'back',fac:'order',name:'Standard',bulky:1,d:banner('#6a4a2a','#2a4aa8')},
  {id:'o_quiver',cat:'back',fac:'order',name:'Quiver',bulky:1,d:quiver('#6a4a2a')},
  {id:'o_halo',cat:'trinket',fac:'order',name:'Halo',d:glowRing('#fff2b0',8,.38,.13)},
  {id:'o_bard',cat:'mount',fac:'order',name:'Royal Barding',d:bard('#2a4aa8','#e2ae35')},
  // ---- Chaos ----
  {id:'c_horned',cat:'helm',fac:'chaos',name:'Horned Helm',hideH:1,d:C=>{ helmet('#3a3236')(C); horns('#e6dabd')(C); }},
  {id:'c_skull',cat:'helm',fac:'chaos',name:'Skull Mask',d:C=>{ AD.orb(C,AD.head(C,.1,.0),.16,'#e6dabd'); for(const sd of [-1,1]) glowAt(AD.head(C,.24,.03,sd*.06),.03*C.s,'#ff3a1a'); }},
  {id:'c_ember',cat:'helm',fac:'chaos',name:'Ember Crown',d:glowRing('#ff5a1a',7,.2,.16)},
  {id:'c_spikes',cat:'crest',fac:'chaos',name:'Iron Spikes',d:C=>{ for(let i=0;i<3;i++){ const a=AD.head(C,.05-i*.1,.2).clone(); _ar3.copy(a).addScaledVector(C.U,.16*C.s); AD.rod(C,a,_ar3,.022,'#2a2226'); } }},
  {id:'c_flame',cat:'crest',fac:'chaos',name:'Flame Mane',d:C=>{ for(let i=0;i<4;i++){ glowAt(AD.head(C,.08-i*.08,.24+.03*Math.sin(game.time*10+i)),.05*C.s,i%2?'#ff7a1a':'#ffcf4a'); } }},
  {id:'c_spauld',cat:'shoulders',fac:'chaos',name:'Spiked Pauldrons',d:pauld('#3a3236','#e6dabd')},
  {id:'c_bpauld',cat:'shoulders',fac:'chaos',name:'Bone Pauldrons',d:pauld('#e6dabd')},
  {id:'c_cuirass',cat:'chest',fac:'chaos',name:'Spiked Cuirass',d:chestPlate('#3a3236','#8a1a14')},
  {id:'c_rib',cat:'chest',fac:'chaos',name:'Rib Plate',d:chestPlate('#e6dabd','#3a3236')},
  {id:'c_shroud',cat:'cape',fac:'chaos',name:'Tattered Shroud',long:1,d:cape('#1a1012',1.2,.9)},
  {id:'c_blood',cat:'cape',fac:'chaos',name:'Blood Cloak',d:cape('#6a1210',.8)},
  {id:'c_claws',cat:'gloves',fac:'chaos',name:'Clawed Gauntlets',d:gloves('#3a3236','#e6dabd')},
  {id:'c_chainbelt',cat:'belt',fac:'chaos',name:'Chain Belt',d:belt('#3a3236','#ff5a1a')},
  {id:'c_sabaton',cat:'boots',fac:'chaos',name:'Iron Sabatons',d:boots('#2a2226','#8a1a14')},
  {id:'c_hellfire',cat:'weapon',fac:'chaos',name:'Hellfire',d:enchant('#ff6a1a',1)},
  {id:'c_venom',cat:'weapon',fac:'chaos',name:'Venom',d:enchant('#8aff3a',1)},
  {id:'c_totem',cat:'offhand',fac:'chaos',name:'Skull Totem',d:C=>{ _ar1.copy(C.j.hL); AD.orb(C,_ar1,.09,'#e6dabd'); glowAt(_ar1.addScaledVector(C.F,.06*C.s),.04*C.s,'#ff3a1a'); }},
  {id:'c_targe',cat:'offhand',fac:'chaos',name:'Iron Targe',d:offhand('#2a2226',.13,'#8a1a14')},
  {id:'c_spine',cat:'back',fac:'chaos',name:'Spine Ridge',d:spines('#e6dabd')},
  {id:'c_banner',cat:'back',fac:'chaos',name:'War Standard',bulky:1,d:banner('#2a2226','#8a1a14')},
  {id:'c_embers',cat:'trinket',fac:'chaos',name:'Ember Aura',d:embers('#ff6a1a')},
  {id:'c_chains',cat:'mount',fac:'chaos',name:'Infernal Chains',d:chains('#3a3236')},
  {id:'c_bard',cat:'mount',fac:'chaos',name:'Blood Barding',d:bard('#6a1210','#3a3236')},
  // ---- Wildlands ----
  {id:'w_leaf',cat:'helm',fac:'wild',name:'Leaf Crown',d:C=>{ for(let k=0;k<7;k++){ const a=k/7*TAU; _ar1.copy(C.j.head).addScaledVector(C.U,.13*C.s).addScaledVector(C.R,Math.cos(a)*.17*C.s).addScaledVector(C.F,Math.sin(a)*.17*C.s); sph(_ar1,.05*C.s,LEAF[k%3],jointIM); } }},
  {id:'w_antler',cat:'helm',fac:'wild',name:'Antler Circlet',d:horns('#d8c8a0')},
  {id:'w_cowl',cat:'helm',fac:'wild',name:'Hooded Cowl',hood:1,d:C=>AD.orb(C,AD.head(C,-.07,.03),.222,'#2f5a2a')},
  {id:'w_feather',cat:'crest',fac:'wild',name:'Hawk Feathers',d:C=>{ for(const sd of [-1,1]){ const a=AD.head(C,-.06,.12,sd*.15).clone(); _ar3.copy(a).addScaledVector(C.U,.12*C.s).addScaledVector(C.F,-.18*C.s); AD.rod(C,a,_ar3,.025,'#8a6a3a'); } }},
  {id:'w_bloom',cat:'crest',fac:'wild',name:'Moonbloom',d:C=>{ glowAt(AD.head(C,.05,.2,.12),.05*C.s,'#d8b8ff'); AD.orb(C,_ar1,.04,'#e8d8ff'); }},
  {id:'w_bark',cat:'shoulders',fac:'wild',name:'Bark Pauldrons',d:pauld('#5a3e24')},
  {id:'w_leafp',cat:'shoulders',fac:'wild',name:'Leaf Mantle',d:C=>{ for(const sh of [C.j.sL,C.j.sR]) for(let k=0;k<3;k++){ _ar1.copy(sh).addScaledVector(spineOf(C),.03*C.s).addScaledVector(C.F,(k-1)*.06*C.s); sph(_ar1,.07*C.s,LEAF[k],jointIM); } }},
  {id:'w_vest',cat:'chest',fac:'wild',name:'Bark Vest',d:chestPlate('#5a3e24','#6a8a3a')},
  {id:'w_silver',cat:'chest',fac:'wild',name:'Silverleaf Mail',d:chestPlate('#d0d8e0','#4f8a2a')},
  {id:'w_cloak',cat:'cape',fac:'wild',name:'Forest Cloak',long:1,d:cape('#2a4422',1.25)},
  {id:'w_leafcl',cat:'cape',fac:'wild',name:'Leaf Cape',d:cape('#4f8a2a',.75)},
  {id:'w_wraps',cat:'gloves',fac:'wild',name:'Archer Wraps',d:gloves('#c8b088')},
  {id:'w_vine',cat:'belt',fac:'wild',name:'Vine Belt',d:belt('#3a6a22','#ffd06a')},
  {id:'w_boots',cat:'boots',fac:'wild',name:'Ranger Boots',d:boots('#5a3e24','#3a6a22')},
  {id:'w_moon',cat:'weapon',fac:'wild',name:'Moonlight',d:enchant('#d8e8ff')},
  {id:'w_thorn',cat:'weapon',fac:'wild',name:'Thornvenom',d:enchant('#8aff6a',1)},
  {id:'w_lantern',cat:'offhand',fac:'wild',name:'Spirit Lantern',d:lantern('#aaff8a')},
  {id:'w_buckler',cat:'offhand',fac:'wild',name:'Woven Buckler',d:offhand('#6a4a2a',.12,'#4f8a2a')},
  {id:'w_quiver',cat:'back',fac:'wild',name:'Elven Quiver',bulky:1,d:quiver('#4a3622')},
  {id:'w_banner',cat:'back',fac:'wild',name:'Clan Banner',bulky:1,d:banner('#5a3e24','#3a6a22')},
  {id:'w_flies',cat:'trinket',fac:'wild',name:'Fireflies',d:motes('#ffe88a',5,.45)},
  {id:'w_vines',cat:'mount',fac:'wild',name:'Vine Wraps',d:vines()},
  {id:'w_bard',cat:'mount',fac:'wild',name:'Leaf Barding',d:bard('#3a6a22','#5a3e24')},
];
const ARM_BY={}; for(const I of ARM_ITEMS) ARM_BY[I.id]=I;
const armMounted=t=>!!(TYPES[t]&&(TYPES[t].wyvern||TYPES[t].hadesRider));
// why a piece can't go on (null if it can)
function armWhy(fac,type,I,L){
  if(I.fac!=='any'&&I.fac!==fac) return 'Belongs to another faction';
  const T=TYPES[type]; if(!T) return 'No such soldier';
  if(I.cat==='mount') return armMounted(type)?null:'Only for a mounted soldier';
  if(T.crawler&&!armMounted(type)) return 'Beasts wear no kit';
  if(type==='hades'&&(I.cat==='helm'||I.cat==='crest')) return 'Hades wears his own crown of fire';
  if(I.cat==='offhand'&&(ARM_NOOFF[type]||fac==='wild'&&type==='ninja')) return 'Both hands are busy';
  if(I.cat==='crest'&&L.helm&&ARM_BY[L.helm]&&ARM_BY[L.helm].hood) return 'No room for a crest under a hood';
  if(I.hood&&L.crest) return 'Take the crest off first';
  if(I.cat==='back'&&I.bulky&&L.cape&&ARM_BY[L.cape]&&ARM_BY[L.cape].long) return 'Too bulky over a long cape';
  if(I.cat==='cape'&&I.long&&L.back&&ARM_BY[L.back]&&ARM_BY[L.back].bulky) return 'Your back piece is in the way';
  return null;
}
function armLoad(fac,type){ const A=settings.armory||{}; return (A[fac]&&A[fac][type])||{}; }
function armSet(fac,type,cat,id){ const A=settings.armory||(settings.armory={}); const F=A[fac]||(A[fac]={}); const L=F[type]||(F[type]={}); if(id) L[cat]=id; else delete L[cat]; saveSettings(); }
function armAny(){ const A=settings.armory; if(!A) return false; for(const f in A) for(const t in A[f]) for(const c in A[f][t]) return true; return false; }
// draw a soldier's kit (your own army; any soldier in the armoury)
const _arC={j:null,s:1,F:null,R:null,U:new V3(),u:null};
function armDraw(u,J,s,F,R,mountOnly){
  if(!settings.armory) return;
  if(!(game.mode==='viewer'&&ARM.on)&&u.team!==myTeam()) return;
  const fac=facOf(u.team), L=armLoad(fac,u.type); let any=false; for(const k in L){ any=true; break; } if(!any) return;
  const C=_arC; C.j=J||u.j; C.s=s||u.s; C.F=F||u.fwdW; C.R=R||u.rightW; C.U.subVectors(C.j.head,C.j.neck).normalize(); C.u=u;
  for(const cat in L){ const I=ARM_BY[L[cat]]; if(!I) continue; if(!!mountOnly!==(cat==='mount')||J&&cat==='weapon') continue; if(armWhy(fac,u.type,I,L)) continue;
    if(I.hideH&&u.G&&u.G.h&&!J) u.G.h.visible=false; I.d(C); }
}

/* ---------- the rooms ---------- */
function armRoom(fac,cx,cy,cz){
  const G=new THREE.Group(), L=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{})), M=(g,m,x,y,z)=>{ const o=new THREE.Mesh(g,m); o.position.set(x,y,z); o.receiveShadow=true; G.add(o); return o; };
  const R=14, Hh=10, P={order:{floor:'#8a8478',wall:'#6e6a62',ceil:'#4a4640',light:'#ffd8a0'},chaos:{floor:'#1e1a1c',wall:'#2a2224',ceil:'#140f10',light:'#ff6a3a'},wild:{floor:'#3e5a2a',wall:'#5a3e24',ceil:'#2a3a1e',light:'#c8ffb0'}}[fac];
  M(new THREE.CylinderGeometry(R,R,Hh,40,1,true),L(P.wall,{side:THREE.BackSide}),cx,cy+Hh/2,cz);
  const fl=M(new THREE.CircleGeometry(R,40),L(P.floor),cx,cy+.02,cz); fl.rotation.x=-Math.PI/2;
  const ce=M(new THREE.CircleGeometry(R,40),L(P.ceil,{side:THREE.BackSide}),cx,cy+Hh,cz); ce.rotation.x=-Math.PI/2;
  const ped=M(new THREE.CylinderGeometry(1.6,1.8,.12,32),L(fac==='order'?'#b8b2a4':fac==='chaos'?'#3a2a2a':'#6a4a2a'),cx,cy+.06,cz); ped.castShadow=false;
  const ring=(n,f)=>{ for(let i=0;i<n;i++){ const a=i/n*TAU+.3; f(cx+Math.cos(a)*(R-1.2),cz+Math.sin(a)*(R-1.2),a,i); } };
  ARM.fx=[];
  if(fac==='order'){
    const carpet=M(new THREE.PlaneGeometry(2.6,R*1.6),L('#7a1a1a'),cx,cy+.03,cz); carpet.rotation.x=-Math.PI/2;
    ring(8,(x,z,a,i)=>{ M(new THREE.CylinderGeometry(.5,.6,Hh,12),L('#9a9488'),x,cy+Hh/2,z);
      if(i%2){ const b=M(new THREE.PlaneGeometry(1.4,3.2),L(i%4===1?'#2a4aa8':'#e2ae35',{side:THREE.DoubleSide}),cx+Math.cos(a)*(R-.3),cy+5,cz+Math.sin(a)*(R-.3)); b.rotation.y=-a+Math.PI/2; }
      else { const rk=M(new THREE.BoxGeometry(1.8,.12,.3),L('#5a3a22'),cx+Math.cos(a+.35)*(R-1.4),cy+1.6,cz+Math.sin(a+.35)*(R-1.4)); rk.rotation.y=-a-.35+Math.PI/2;
        for(let k=-1;k<=1;k++){ const sw=M(new THREE.BoxGeometry(.06,1.3,.02),L('#c8ced6'),rk.position.x+Math.cos(-a-.35+Math.PI/2)*k*.5,cy+1.1,rk.position.z-Math.sin(-a-.35+Math.PI/2)*k*.5); sw.rotation.y=rk.rotation.y; } }
      ARM.fx.push({k:'torch',p:new V3(x-Math.cos(a)*.7,cy+3.2,z-Math.sin(a)*.7)}); });
    for(let i=0;i<6;i++){ const a=i/6*TAU; const sh=M(new THREE.CircleGeometry(.6,16),L(i%2?'#2a4aa8':'#c8ced6',{side:THREE.DoubleSide}),cx+Math.cos(a)*(R-.15),cy+3.6,cz+Math.sin(a)*(R-.15)); sh.rotation.y=-a-Math.PI/2; }
  } else if(fac==='chaos'){
    for(let i=0;i<10;i++){ const a=i/10*TAU, l=M(new THREE.BoxGeometry(.35,.04,R-2.5),L('#ff5a1a',{emissive:'#c03a0a'}),cx+Math.cos(a)*(R/2+.6),cy+.04,cz+Math.sin(a)*(R/2+.6)); l.rotation.y=-a+Math.PI/2; l.receiveShadow=false; }
    ring(6,(x,z,a,i)=>{ if(i%2===0){ M(new THREE.BoxGeometry(1.2,.7,.6),L('#2a2426'),x,cy+.85,z); M(new THREE.BoxGeometry(.6,.5,.5),L('#3a3236'),x,cy+.25,z); }
      else { M(new THREE.CylinderGeometry(.5,.3,1,10),L('#3a3236'),x,cy+.5,z); ARM.fx.push({k:'brazier',p:new V3(x,cy+1.05,z)}); }
      for(let k=0;k<6;k++){ const t=M(new THREE.TorusGeometry(.12,.03,5,10),L('#4a4246'),cx+Math.cos(a+.3)*(R-.5),cy+Hh-.4-k*.2,cz+Math.sin(a+.3)*(R-.5)); t.rotation.y=k%2?Math.PI/2:0; } });
    const forge=M(new THREE.BoxGeometry(3.4,3,1.8),L('#1a1416'),cx,cy+1.5,cz-(R-1.6)); M(new THREE.BoxGeometry(1.8,1,.1),L('#ff7a1a',{emissive:'#ff5a1a'}),cx,cy+1.1,cz-(R-2.55));
    ARM.fx.push({k:'forge',p:new V3(cx,cy+1.3,cz-(R-2.7))});
  } else {
    for(let i=0;i<12;i++){ const a=i/12*TAU+.1, x0=cx+Math.cos(a)*(R-.3), z0=cz+Math.sin(a)*(R-.3), x1=cx+Math.cos(a)*(R-3), z1=cz+Math.sin(a)*(R-3);
      const r=M(new THREE.CylinderGeometry(.18,.45,Math.hypot(x1-x0,z1-z0)+1.5,8),L('#4a3220'),(x0+x1)/2,cy+1.2,(z0+z1)/2); r.lookAt(x1,cy,z1); r.rotateX(Math.PI/2.4); }
    ring(9,(x,z,a,i)=>{ const st=M(new THREE.CylinderGeometry(.08,.12,.6,6),L('#e8dcc0'),x,cy+.3,z); const cap=M(new THREE.SphereGeometry(.4,10,6,0,TAU,0,Math.PI/2),L(i%2?'#7a3aaa':'#3a8aaa',{emissive:i%2?'#3a1a5a':'#1a4a5a'}),x,cy+.6,z);
      ARM.fx.push({k:'shroom',p:new V3(x,cy+.8,z),c:i%2?'#c08aff':'#7ae0ff'}); ARM.fx.push({k:'lantern',p:new V3(cx+Math.cos(a+.35)*(R-2.5),cy+4+Math.sin(i)*.8,cz+Math.sin(a+.35)*(R-2.5))}); });
    for(let i=0;i<10;i++){ const a=rand(0,TAU), d=rand(2.5,R-2), m=M(new THREE.CircleGeometry(rand(.6,1.4),10),L('#4f7a2a'),cx+Math.cos(a)*d,cy+.04,cz+Math.sin(a)*d); m.rotation.x=-Math.PI/2; }
    for(let i=0;i<3;i++){ const a=i/3*TAU+.9, sx=cx+Math.cos(a)*(R-2.2), sz=cz+Math.sin(a)*(R-2.2); M(new THREE.BoxGeometry(.15,2.2,.15),L('#6a4a2a'),sx,cy+1.1,sz);
      const b=M(new THREE.PlaneGeometry(.9,1.6),L('#3a6a22',{side:THREE.DoubleSide}),sx,cy+1.6,sz+.1); b.rotation.y=-a; }
  }
  const pl=new THREE.PointLight(P.light,1.2,R*2.2,1.6); pl.position.set(cx,cy+Hh-2,cz); G.add(pl);
  G.traverse(o=>{ if(o.isMesh) o.castShadow=false; });
  scene.add(G); return G;
}
function armFrame(){
  if(!ARM.on||game.mode!=='viewer') return; const t=game.time;
  for(const f of ARM.fx){
    if(f.k==='torch'){ glowAt(f.p,.3+.05*Math.sin(t*13+f.p.x),'#ffb04a'); if(Math.random()<.3) emitFire(f.p,1,.18,0,1.4,0,.15,.4); }
    else if(f.k==='brazier'){ if(Math.random()<.7) emitFire(f.p,1,.3,rand(-.2,.2),2,rand(-.2,.2),.3,.6); glowAt(f.p,.5,'#ff6a1a'); }
    else if(f.k==='forge'){ glowAt(f.p,.9+.15*Math.sin(t*4),'#ff7a1a'); if(Math.random()<.5) puff(f.p,1,.12,1.2,'#ff9a3a'); }
    else if(f.k==='shroom'){ glowAt(f.p,.22+.05*Math.sin(t*2+f.p.z),f.c); }
    else if(f.k==='lantern'){ glowAt(f.p,.26+.04*Math.sin(t*3+f.p.x),'#c8ffb0'); }
  }
}

/* ---------- opening and closing; the panel ---------- */
function armOpen(fac){
  closeMenu(); game.campFight=null; setTerrain('skirmish');
  ARM.on=true; ARM.fac=fac||settings.side||'order'; setFactions(ARM.fac);
  const R=FACTIONS[ARM.fac].roster.filter(t=>TYPES[t]&&!TYPES[t].worker); ARM.type=R.includes(ARM.type)?ARM.type:R[0]; game.duelSel=ARM.type;
  setMode('viewer');
}
// called by resetViewer: the room around the turntable, the soldier on its floor
function armAfterReset(u){
  if(!ARM.on) return;
  const cy=H(u.pos.x,u.pos.z)+.12;
  if(!ARM.env||ARM.envFac!==ARM.fac){ armDropRoom(); ARM.env=armRoom(ARM.fac,u.pos.x,cy-.12,u.pos.z); ARM.envFac=ARM.fac; }
  u.gy=cy; u.pos.y=cy; if(u.cr) crPlace(u); for(const ft of u.feet||[]) ft.pos.y=cy;
  const vw=$('#viewer'); if(vw) vw.hidden=true; const av=$('#vLab'); if(av) av.hidden=true;
  armPanel(true);
}
function armDropRoom(){ if(ARM.env){ scene.remove(ARM.env); ARM.env.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); ARM.env=null; ARM.envFac=null; ARM.fx=[]; } }
function armClose(){ if(!ARM.on) return; ARM.on=false; armDropRoom(); armPanel(false); const av=$('#vLab'); if(av) av.hidden=false; }
function armPanel(show){
  let P=document.getElementById('armory');
  if(!show){ if(P) P.hidden=true; return; }
  if(!P&&!(document.body&&document.body.appendChild)) return;
  if(!P){ P=document.createElement('aside'); P.id='armory'; P.className='viewer armory'; P.setAttribute('aria-label','Armory'); document.body.appendChild(P); }
  P.hidden=false; P.classList.toggle('chaos',ARM.fac==='chaos'); P.classList.toggle('wild',ARM.fac==='wild');
  const fac=ARM.fac, type=ARM.type, L=armLoad(fac,type), roster=FACTIONS[fac].roster.filter(t=>TYPES[t]&&!TYPES[t].worker);
  const cats=ARM_CATS.filter(([c])=>ARM_ITEMS.some(I=>I.cat===c&&!armWhy(fac,type,I,{})));
  if(!cats.some(([c])=>c===ARM.cat)) ARM.cat=cats.length?cats[0][0]:'helm';
  const items=ARM_ITEMS.filter(I=>I.cat===ARM.cat&&I.fac===fac);
  P.innerHTML='<div class="vw-fac">'+vwEsc(FACTIONS[fac].name)+' · '+ARM_ENV[fac]+'</div><h2>Armory</h2>'+
    '<div class="arm-row arm-facs">'+['order','chaos','wild'].map(f=>'<button data-f="'+f+'" aria-pressed="'+(f===fac)+'">'+({order:'Order',chaos:'Chaos',wild:'Wildlands'})[f]+'</button>').join('')+'</div>'+
    '<div class="arm-row arm-units">'+roster.map(t=>'<button data-t="'+t+'" aria-pressed="'+(t===type)+'">'+vwEsc(tName(t,0))+'</button>').join('')+'</div>'+
    '<div class="arm-row arm-cats">'+cats.map(([c,n])=>'<button data-c="'+c+'" aria-pressed="'+(c===ARM.cat)+'">'+n+(L[c]?' ●':'')+'</button>').join('')+'</div>'+
    '<div class="arm-items"><button data-i="" aria-pressed="'+(!L[ARM.cat])+'"><b>None</b></button>'+items.map(I=>{ const why=armWhy(fac,type,I,Object.assign({},L,{[I.cat]:undefined}));
      return '<button data-i="'+I.id+'" aria-pressed="'+(L[I.cat]===I.id)+'"'+(why?' disabled title="'+vwEsc(why)+'"':'')+'><b>'+vwEsc(I.name)+'</b>'+(why?'<small>'+vwEsc(why)+'</small>':'')+'</button>'; }).join('')+'</div>'+
    '<p class="vw-count">'+Object.keys(L).length+' of '+ARM_CATS.length+' slots filled · worn by your '+vwEsc(tPl(type,0))+' in every battle · for looks only</p>'+
    '<div class="arm-row"><button id="armClear">Strip the kit</button><button id="armBack">Back to the menu</button></div>';
  for(const b of qsa(P,'button[data-f]')) b.onclick=()=>{ sfx('ui'); armOpen(b.dataset.f); };
  for(const b of qsa(P,'button[data-t]')) b.onclick=()=>{ sfx('ui'); ARM.type=b.dataset.t; game.duelSel=ARM.type; resetViewer(); };
  for(const b of qsa(P,'button[data-c]')) b.onclick=()=>{ sfx('ui'); ARM.cat=b.dataset.c; armPanel(true); };
  for(const b of qsa(P,'button[data-i]')) b.onclick=()=>{ if(b.disabled) return; sfx(b.dataset.i?'armoryEquip':'ui'); armSet(fac,type,ARM.cat,b.dataset.i); if(VW.u&&VW.u.G&&VW.u.G.h) VW.u.G.h.visible=true; armPanel(true); };
  const cl=P.querySelector&&P.querySelector('#armClear'); if(cl) cl.onclick=()=>{ sfx('ui'); const A=settings.armory; if(A&&A[fac]) delete A[fac][type]; saveSettings(); if(VW.u&&VW.u.G&&VW.u.G.h) VW.u.G.h.visible=true; armPanel(true); };
  const bk=P.querySelector&&P.querySelector('#armBack'); if(bk) bk.onclick=()=>{ sfx('ui'); armClose(); openMenu(); };
}
