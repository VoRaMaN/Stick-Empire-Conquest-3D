/* ================= Bone Reaver and Ninja revamp (v0.26): new looks and the new moves' effects (moves in 13j) =================
   Bone Reaver: swept bone horns, a jagged crest, a soul-fire core burning in the ribs, spine spikes and a bone
   pauldron. Ninja: a steel brow band (hachigane) in the army's colour, a short blade at the hip, a shuriken pouch,
   a sash at the waist. */
let RVX=null;
function rvInit(){ if(RVX) return RVX; RVX={
  horn:(()=>{ const g=new THREE.ConeGeometry(.032,.26,6); g.translate(0,.13,0); return g; })(),
  spike:(()=>{ const g=new THREE.ConeGeometry(.022,.1,5); g.translate(0,.05,0); return g; })(),
  core:new THREE.SphereGeometry(.06,8,6), plate:new THREE.SphereGeometry(.1,8,6,0,Math.PI*2,0,Math.PI*.5),
  band:new THREE.TorusGeometry(.205,.018,5,18), browPlate:new THREE.BoxGeometry(.13,.05,.02),
  short:new THREE.BoxGeometry(.03,.42,.012), shortGrip:new THREE.CylinderGeometry(.018,.018,.12,6),
  pouch:new THREE.BoxGeometry(.1,.08,.06), star:new THREE.CylinderGeometry(.045,.045,.008,4),
  sash:new THREE.TorusGeometry(.16,.03,5,16), knot:new THREE.BoxGeometry(.04,.16,.02) }; return RVX; }
const rvMat={}; const rvM=(c,o)=>rvMat[c+(o?'e':'')]||(rvMat[c+(o?'e':'')]=new THREE.MeshLambertMaterial(Object.assign({color:c},o||{})));
function brDress(u,G){ const X=rvInit(), bone=rvM('#e6dabd'), dark=rvM('#2a1c14');
  if(G.h) for(const sd of [-1,1]){ const h=mesh(X.horn,bone,sd*.11,.12,-.02); h.rotation.set(-.7,0,-sd*.55); G.h.add(h); const h2=mesh(X.spike,bone,sd*.05,.2,-.05); h2.rotation.x=-.5; G.h.add(h2); }
  const b=G.b||(G.b=grp()); for(let i=0;i<4;i++){ const sp=mesh(X.spike,bone,0,-.1+i*.11,-.02); sp.rotation.x=-1.2; sp.scale.setScalar(1.1-i*.12); b.add(sp); }
  const pl=mesh(X.plate,bone,-.16,.05,0); pl.rotation.z=.4; pl.scale.set(1,.7,1.1); b.add(pl);
  if(G.r){ const c=mesh(X.core,rvM('#ff3a1a',{emissive:'#c0200a'}),0,.42,.02); c.castShadow=false; G.r.add(c); }
  b.scale.setScalar(u.s); }
function njDress(u,G,acc,acc2){ const X=rvInit();
  if(G.h){ const band=mesh(X.band,acc2||acc,0,.06,0); band.rotation.x=Math.PI/2; band.scale.set(1,1.05,.8); G.h.add(band);
    G.h.add(mesh(X.browPlate,rvM('#b8bec8'),0,.07,.2)); }
  if(G.b){ const sb=mesh(X.short,rvM('#1c1612'),.12,-.32,.02); sb.rotation.z=-1.1; G.b.add(sb); const gr=mesh(X.shortGrip,rvM('#2a1a12'),.3,-.22,.02); gr.rotation.z=-1.1; G.b.add(gr);
    G.b.add(mesh(X.pouch,rvM('#2a2018'),-.12,-.36,.06)); for(let i=0;i<2;i++){ const st=mesh(X.star,rvM('#9aa2ac'),-.12+i*.03,-.3,.1); st.rotation.x=Math.PI/2; G.b.add(st); } }
  const r=grp(); const sa=mesh(X.sash,acc,0,.02,0); sa.rotation.x=Math.PI/2; sa.scale.set(1,.85,1); r.add(sa); const k1=mesh(X.knot,acc,.1,-.06,.12); k1.rotation.z=.3; r.add(k1); G.r=r; }
const _rv1=new V3();
Object.assign(EXTRA_EV,{
  brSoul:(u,e)=>{ _rv1.copy(u.j.chest); puff(_rv1,e.big?10:5,e.big?.25:.16,e.big?2.4:1.4,'#ff3a1a'); if(e.big){ ring(_rv1.setY(H(u.pos.x,u.pos.z)+.1),2.2,'#ff5a2a'); } crSfx('soul','clank',u.j.chest,.4); },
  njDash:(u)=>{ for(let i=0;i<4;i++){ _rv1.copy(u.j.chest).addScaledVector(u.fwdW,-i*.35*u.s); puff(_rv1,1,.18,.4,'#2a2a34'); } sfx('swish',u.pos,.7); },
  njSmoke:(u,e)=>{ puff(u.j.chest,e.mini?4:10,e.mini?.2:.32,e.mini?.8:1.8,'#3a3a44'); if(!e.mini) sfx('swish',u.pos,.5,{rate:.7}); },
  njStar:(u,e)=>{ const t=u.atkTarget||u.target; sfx('swish',u.j.hR,.7,{rate:1.4});
    for(let i=0;i<(e.n||3);i++){ _rv1.copy(u.j.hR).addScaledVector(u.fwdW,.5+i*.6); glowAt(_rv1,.05,'#d8e0ea'); }
    if(NET.guest||!t||!t.alive||!t.isUnit||t.team===u.team||!canTarget(u,t)) return;
    const dx=t.pos.x-u.pos.x, dz=t.pos.z-u.pos.z, d=Math.hypot(dx,dz)||1; if(d>9) return;
    damage(t,u.T.dmg*.35*(e.n||3),u,new V3(dx/d,0,dz/d),.6,.1); bleed(t.j.chest.clone(),new V3(dx/d,.2,dz/d),3,1.5,.3); },
});
