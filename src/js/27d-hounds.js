/* ================= Hellhound and Cerberus: models, the extra heads, fire breath and the burning mane =================
   Hellhound: the Hellcrawler's lava-rock body with a canine skull, pointed ears, a flame mane, paws and a short
   burning tail. Cerberus is its own beast: a dark hide of coarse fur instead of glowing rock, a broad maned chest,
   three heavy horned wolf heads on thick necks, each in a spiked bronze collar, a serpent for a tail, and a mane
   of real fire running down its back. Each head lives its own life: it glances about, pants and snaps. */
{ const ci=CHAOS.indexOf('crawler'); CHAOS.splice(ci+1,0,'hound'); const hi=CHAOS.indexOf('hades'); CHAOS.splice(hi<0?CHAOS.length:hi,0,'cerberus'); }
TYPES.hound.pick=TYPES.crawler.pick; TYPES.hound.brain=TYPES.crawler.brain;
AIMW.hound=AIMW.crawler; AIMW.cerberus=AIMW.crawler;
let houndReady=false;
function furTexture(){
  try{ if(typeof document==='undefined'||!document.createElement) return null; const N=256, c=document.createElement('canvas'); if(!c||!c.getContext) return null;
    c.width=c.height=N; const g=c.getContext('2d'); if(!g) return null;
    let sd=211; const R=()=>(sd=(sd*16807)%2147483647)/2147483647;
    g.fillStyle='#1e1612'; g.fillRect(0,0,N,N);
    for(let i=0;i<5200;i++){ const x=R()*N, y=R()*N, l=3+R()*7, a=Math.PI/2+(R()-.5)*.9, v=R();
      g.strokeStyle=v<.45?'rgba(58,42,34,.55)':v<.85?'rgba(10,6,5,.55)':'rgba(96,64,44,.45)'; g.lineWidth=.7+R()*1.1;
      for(const ox of [-N,0,N]) for(const oy of [-N,0,N]){ g.beginPath(); g.moveTo(x+ox,y+oy); g.lineTo(x+ox+Math.cos(a)*l,y+oy+Math.sin(a)*l); g.stroke(); } }
    for(let i=0;i<60;i++){ g.fillStyle='rgba(255,90,20,'+(.25+R()*.35)+')'; g.fillRect(R()*N,R()*N,1.5,1.5); }   // embers caught in the fur
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(2,2); return t; }catch(e){ return null; }
}
function houndInit(){
  if(houndReady) return; houndReady=true; crInit();
  const ft=furTexture();
  CRM.fur=new THREE.MeshPhongMaterial({color:ft?'#d9cdc4':'#2a201b',specular:'#2a1e18',shininess:8,map:ft||null,bumpMap:ft||null,bumpScale:.04});
  CRM.snake=new THREE.MeshPhongMaterial({color:'#2f3a24',specular:'#9ab07a',shininess:46,map:ft||null});
  CRM.bronze=new THREE.MeshPhongMaterial({color:'#9a6a34',specular:'#ffd8a0',shininess:55});
  const P={}, add=(part,mat,list)=>{ const p=P[part]||(P[part]={}); (p[mat]||(p[mat]=[])).push(...list); }, h=(...a)=>crHorn(...a);
  // ---- Hellhound: skull (y forward along the snout, z up), jaw, paw, tail, flame mane ----
  add('hskl','skin',[crE(0,.05,.04,.11,.12,.1),crL([[.06,0],[.08,.075],[.2,.06],[.32,.042],[.36,0]],12,.9,.75,new V3(0,0,-.01)),crE(.06,.12,.08,.04,.05,.03),crE(-.06,.12,.08,.04,.05,.03)]);
  for(const sd of [-1,1]) add('hskl','skin',h(new V3(sd*.065,.0,.1),new V3(sd*.25,-.35,1),CRX,.25,.15,.04,4));
  add('hskl','bone',[crE(0,.355,.0,.026,.02,.022)]);
  add('hskl','maw',[...h(new V3(0,-.03,.09),new V3(0,-1,.7),CRX,.3,.17,.034,4),...h(new V3(.05,-.06,.06),new V3(.4,-1,.5),CRX,.3,.14,.028,4),...h(new V3(-.05,-.06,.06),new V3(-.4,-1,.5),CRX,.3,.14,.028,4)]);
  for(const sd of [-1,1]){ add('hskl','tooth',[crTooth(sd*.035,.3,-.035,.012,.07,-1),crTooth(sd*.042,.24,-.035,.009,.045,-1)]); }
  add('hskl','eye',[crE(.065,.15,.06,.02,.017,.018),crE(-.065,.15,.06,.02,.017,.018)]);
  add('hjaw','skin',[crL([[0,0],[.02,.055],[.12,.05],[.26,.028],[.3,0]],12,.9,.45,new V3(0,0,-.02))]);
  for(const sd of [-1,1]) add('hjaw','tooth',[crTooth(sd*.032,.24,0,.011,.06,1)]);
  add('hpaw','skin',[crE(0,.06,0,.07,.09,.05)]);
  for(const x of [-.045,-.015,.015,.045]){ add('hpaw','skin',[crE(x,.13,.0,.022,.03,.024)]); add('hpaw','bone',h(new V3(x,.15,0),new V3(0,1,-.2),CRX,-.4,.05,.01,2)); }
  add('htseg','skin',[crL([[-.02,0],[0,.05],[.1,.045],[.17,.04],[.18,0]])]);
  add('httip','maw',[...h(new V3(0,0,0),new V3(0,1,.1),CRX,.3,.22,.05,4),...h(new V3(.02,.05,0),new V3(.6,1,0),CRX,.2,.14,.03,3),...h(new V3(-.02,.05,0),new V3(-.6,1,0),CRX,.2,.14,.03,3)]);
  add('hmane','maw',[...h(new V3(0,.05,.1),new V3(0,-.6,1),CRX,.4,.18,.035,4),...h(new V3(0,.13,.11),new V3(0,-.6,1),CRX,.4,.2,.04,4),...h(new V3(0,.21,.1),new V3(0,-.6,1),CRX,.4,.17,.035,4)]);
  // ---- Cerberus: a broad maned chest, heavy haunches, thick necks, horned wolf heads in spiked collars, a serpent tail ----
  add('cbpel','skin',[crE(0,-.02,0,.26,.22,.22),crE(.14,-.07,-.03,.15,.18,.17),crE(-.14,-.07,-.03,.15,.18,.17)]);
  add('cbabd','skin',[crE(0,.22,.02,.21,.27,.19)]);
  add('cbtor','skin',[crE(0,.2,.04,.34,.34,.3),crE(.2,.33,-.02,.19,.19,.18),crE(-.2,.33,-.02,.19,.19,.18),crE(0,.36,.08,.3,.15,.27),crE(0,.3,-.13,.22,.17,.15)]);
  add('cbtor','bronze',h(new V3(0,.42,.22),new V3(0,-.2,1),CRX,.1,.05,.012,2));
  add('cbnek','skin',[crL([[-.06,0],[-.03,.16],[.09,.15],[.2,.13],[.26,0]])]);
  add('cbstalk','skin',[crL([[-.04,0],[0,.12],[.14,.11],[.3,.1],[.34,0]])]);
  add('cbskl','skin',[crE(0,.03,.045,.14,.135,.12),crL([[.05,0],[.07,.09],[.18,.075],[.3,.05],[.34,0]],12,1,.8,new V3(0,0,-.005)),crE(.07,.11,.09,.05,.06,.035),crE(-.07,.11,.09,.05,.06,.035)]);
  for(const sd of [-1,1]){ add('cbskl','skin',h(new V3(sd*.075,-.03,.1),new V3(sd*.35,-.5,1),CRX,.2,.13,.035,4));
    add('cbskl','bone',h(new V3(sd*.08,.04,.12),new V3(sd*.35,-.9,.6),CRX,-.9,.22,.03,6)); }
  add('cbskl','bone',[crE(0,.34,.005,.03,.022,.025)]);
  for(const sd of [-1,1]) add('cbskl','tooth',[crTooth(sd*.04,.29,-.04,.016,.09,-1),crTooth(sd*.05,.22,-.04,.011,.055,-1),crTooth(sd*.055,.16,-.035,.009,.04,-1)]);
  add('cbskl','eye',[crE(.07,.14,.07,.022,.018,.02),crE(-.07,.14,.07,.022,.018,.02)]);
  add('cbskl','maw',[crE(0,.2,-.04,.05,.11,.022)]);
  { const ring=new THREE.TorusGeometry(.15,.03,6,18); ring.rotateX(Math.PI/2); add('cbskl','bronze',[[ring,new THREE.Matrix4().makeTranslation(0,-.1,-.01)]]);
    for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; add('cbskl','bronze',h(new V3(Math.cos(a)*.17,-.1,Math.sin(a)*.17-.01),new V3(Math.cos(a),0,Math.sin(a)),CRX,0,.08,.024,2)); } }
  add('cbjaw','skin',[crL([[0,0],[.02,.065],[.13,.06],[.26,.034],[.3,0]],12,1,.5,new V3(0,0,-.02))]);
  for(const sd of [-1,1]) add('cbjaw','tooth',[crTooth(sd*.04,.24,0,.014,.075,1),crTooth(sd*.048,.15,0,.01,.05,1)]);
  add('cbjaw','maw',[crE(0,.15,.015,.045,.09,.01)]);
  add('cbtseg','snake',[crL([[-.02,0],[0,.06],[.06,.064],[.12,.058],[.17,.054],[.185,0]])]);
  add('cbttip','snake',[crE(0,.08,0,.06,.1,.045),crL([[.1,0],[.12,.045],[.2,.02],[.22,0]],10,1,.7)]);
  add('cbttip','eye',[crE(.035,.13,.03,.012,.012,.012),crE(-.035,.13,.03,.012,.012,.012)]);
  add('cbttip','tooth',[crTooth(.018,.19,-.012,.006,.035,-1),crTooth(-.018,.19,-.012,.006,.035,-1)]);
  add('cbttip','maw',h(new V3(0,.21,-.005),new V3(0,1,-.1),CRX,0,.08,.006,2));
  for(const part in P){ CRG[part]={}; for(const m in P[part]) CRG[part][m]=mergeUV(P[part][m]); }
}
// the canine parts swap in for the Hellcrawler's; Cerberus gets its own body, two more heads on necks of their own
function buildHound(u,G){
  houndInit(); const s=u.s;
  if(u.T.heads===3){ const F=CRM.fur;
    G.c_pel=crPart('cbpel',s,1,F); G.c_abd=crPart('cbabd',s,1,F); G.c_tor=crPart('cbtor',s,1,F); G.c_nek=crPart('cbnek',s,1,F);
    G.c_skl=crPart('cbskl',s,CR_HEAD,F); G.c_jaw=crPart('cbjaw',s,CR_HEAD,F);
    for(const k of ['2','3']){ G['c_skl'+k]=crPart('cbskl',s,CR_HEAD*.92,F); G['c_jaw'+k]=crPart('cbjaw',s,CR_HEAD*.92,F); G['c_nk'+k]=crPart('cbstalk',s,1,F); }
    for(const sd of ['L','R']){ for(const n of ['ua','fa','th','sh','mt','ft']) G['c_'+n+sd]=crPart(n,s,1,F); G['c_hd'+sd]=crPart('hpaw',s,1.2,F); }
    for(let i=0;i<CR_TN;i++) G['c_t'+i]=crPart('cbtseg',s,CR_TK[i]);
    G.c_tt=crPart('cbttip',s,CR_TK[CR_TN]*1.6);
    u.cbH=[{p:new V3(),d:new V3(0,0,1),u:new V3(0,1,0)},{p:new V3(),d:new V3(0,0,1),u:new V3(0,1,0)}];
    crInitRig(u); return; }
  for(const n of ['pel','abd','tor','nek']) G['c_'+n]=crPart(n,s);
  G.c_skl=crPart('hskl',s,CR_HEAD); G.c_jaw=crPart('hjaw',s,CR_HEAD); G.c_mane=crPart('hmane',s);
  for(const sd of ['L','R']){ for(const n of ['ua','fa','th','sh','mt','ft']) G['c_'+n+sd]=crPart(n,s); G['c_hd'+sd]=crPart('hpaw',s); }
  for(let i=0;i<CR_TN;i++) G['c_t'+i]=crPart('htseg',s,CR_TK[i]);
  G.c_tt=crPart('httip',s,CR_TK[CR_TN]);
  crInitRig(u);
}
const _hd1=new V3(),_hd2=new V3(),_hd3=new V3(),_hd4=new V3(),_hd5=new V3();
function houndModel(u){
  const G=u.G, cr=u.cr, j=u.j, s=u.s; if(!G||!cr) return;
  if(G.c_mane) orient(G.c_mane,j.chest,_hd1.subVectors(j.neck,j.chest),cr.n);
  if(!G.c_skl2) return;
  // two more heads beside the first, each with a will of its own: it looks about, nods and pants when the body rests
  const hr=_hd2.crossVectors(cr.hd,cr.hu).normalize(), t=game.time, ph=(u.id||0)*1.3, alive=u.alive?1:0, rest=alive*(1-clamp(u.spd/u.T.speed,0,1));
  const k9=CR_HEAD*.92*s;
  [['2',-1,cr.hbY,cr.hbP,cr.hbJ,0],['3',1,cr.hcY,cr.hcP,cr.hcJ,2.1]].forEach(([k,sd,Y,P,J,o],hi)=>{
    const yaw=sd<0?(.42+(Y||0)+rest*.16*Math.sin(t*.7+ph+o)):(.42+(Y||0)+rest*.16*Math.sin(t*.7+ph+o));
    const pitch=(P||0)+rest*.09*Math.sin(t*1.1+ph*2+o)+(alive?0:.6);
    const jaw=alive?Math.max(J||0,.06+.07*Math.max(0,Math.sin(t*6.5+o+ph))):.55;
    const H=u.cbH[hi];
    H.p.copy(j.neck).addScaledVector(hr,sd*.27*s).addScaledVector(cr.hd,-.05*s).addScaledVector(cr.hu,-.02*s);
    H.d.copy(cr.hd).applyAxisAngle(cr.hu,-sd*yaw); _hd4.crossVectors(H.d,cr.hu).normalize(); H.d.applyAxisAngle(_hd4,-pitch); H.u.copy(cr.hu).applyAxisAngle(_hd4,-pitch);
    orient(G['c_skl'+k],H.p,H.d,H.u);
    _hd4.crossVectors(H.d,H.u).normalize(); const ja=.06+jaw*.8; _hd1.copy(H.d).applyAxisAngle(_hd4,-ja); _hd5.copy(H.u).applyAxisAngle(_hd4,-ja);
    _hd3.copy(H.p).addScaledVector(H.d,.05*k9).addScaledVector(H.u,-.045*k9); orient(G['c_jaw'+k],_hd3,_hd1,_hd5);
    // its own thick neck, from the shoulders up to the head
    _hd3.copy(j.chest).addScaledVector(cr.rc,sd*.17*s).addScaledVector(cr.n,.06*s); orient(G['c_nk'+k],_hd3,_hd1.subVectors(H.p,_hd3),cr.n);
  });
}
function houndFx(u){
  const cr=u.cr, s=u.s; if(!cr||!u.G) return;
  if(u.T.heads!==3){ if(Math.random()<.18) emitFire(cr.tailTip,1,.07*s,0,.6,0,.15,.45); return; }
  const t=game.time, j=u.j;
  // a mane of fire down the back
  if(u.alive) for(let m=0;m<2;m++){ const k=Math.random(); _hd1.copy(cr.M).lerp(j.neck,k).addScaledVector(cr.n,(.26+.06*Math.sin(k*9))*s).addScaledVector(cr.rc,(Math.random()-.5)*.18*s);
    emitFire(_hd1,1,(.13+.07*(1-Math.abs(k-.6)))*s,0,1.2,0,.25,.5); }
  // embers dripping from the open jaws; the eyes of the side heads
  const hr=_hd2.crossVectors(cr.hd,cr.hu).normalize(), k=CR_HEAD*.92*s;
  for(let i=0;i<2;i++){ const H=u.cbH&&u.cbH[i]; if(!H) continue; const r=_hd4.crossVectors(H.d,H.u).normalize();
    for(const e of [-1,1]){ _hd3.copy(H.p).addScaledVector(H.d,.14*k).addScaledVector(H.u,.07*k).addScaledVector(r,e*.07*k); glowAt(_hd3,.03*k,'#ffb02a'); }
    if(u.alive&&Math.random()<.12){ _hd3.copy(H.p).addScaledVector(H.d,.22*k).addScaledVector(H.u,-.06*k); emitFire(_hd3,1,.05*s,0,-.2,0,.15,.4); } }
  if(u.alive&&Math.random()<.1){ _hd3.copy(j.head).addScaledVector(cr.hd,.22*CR_HEAD*s).addScaledVector(cr.hu,-.06*s); emitFire(_hd3,1,.05*s,0,-.2,0,.15,.4); }
  void hr; void t;
}

/* ---------- Cerberus' fire, howl and venom ---------- */
function cbMouths(u){ const cr=u.cr, s=u.s, L=[[u.j.head.clone().addScaledVector(cr.hd,.3*CR_HEAD*s).addScaledVector(cr.hu,-.04*s),cr.hd.clone()]];
  if(u.cbH) for(const H of u.cbH) L.push([H.p.clone().addScaledVector(H.d,.3*CR_HEAD*.92*s).addScaledVector(H.u,-.04*s),H.d.clone()]); return L; }
function cbFire(u,e,fin,v){
  const s=u.s, big=e.big?1.6:1;
  u.cbBreath={t:e.big?.3:.2,big};   // the flames pour out continuously (cbBreathTick) until the next gout
  if(Math.random()<.4) crSfx('flameWave','ignite',u.j.head,.45);
  if(e.fin){ const rg=fin&&(fin.rag||fin.rag2), P=v&&v.alive?v.j.chest:(rg?rg.p[1]:null); if(P) fireBurst(P,6,.16*s,1.2,.6); return; }
  const hd=u.cr.hd, hx=hd.x, hz=hd.z, hl=Math.hypot(hx,hz)||1;
  for(const t of units){ if(!t.alive||t.team===u.team||isAir(t)) continue; const dx=t.pos.x-u.pos.x, dz=t.pos.z-u.pos.z, d=Math.hypot(dx,dz)||1;
    if(d<6.5&&(dx*hx+dz*hz)/(d*hl)>.8){ damage(t,u.T.dmg*.3,u,new V3(dx/d,0,dz/d),1.2,.2); applyBurn(t,u,7,3.5); } }
}
function cbHowl(u,e){
  shakeAt(u.pos,e.mini?.25:.6); crSfx('dreadRoar','warcry',u.j.head,e.mini?.6:1);
  for(const [p,d] of cbMouths(u)) for(let i=0;i<5;i++) emitFire(p,1,.14*u.s,d.x*2,2.5+Math.random()*1.5,d.z*2,.5,.55);
  if(!e.mini){ const c=u.pos.clone(); c.y=H(c.x,c.z); ring(c,4.5); }
}
Object.assign(EXTRA_EV,{
  cbFire, cbHowl:(u,e)=>cbHowl(u,e), cerbFlame:(u)=>cbFire(u,{}),
  cbSnort:(u)=>{ const p=u.j.head.clone().addScaledVector(u.cr.hd,.33*CR_HEAD*u.s); for(let i=0;i<4;i++) emitFire(p,1,.06*u.s,u.cr.hd.x*1.5,.3,u.cr.hd.z*1.5,.3,.35); crSfx('crHiss','hiss',p,.3); },
  cbMane:(u)=>{ for(let i=0;i<10;i++){ const k=Math.random(); _hd1.copy(u.cr.M).lerp(u.j.neck,k).addScaledVector(u.cr.n,.3*u.s); emitFire(_hd1,1,.16*u.s,rand(-1.5,1.5),1.8,rand(-1.5,1.5),.4,.55); } },
  cbVenom:(u)=>{ const t=u.atkTarget; puff(u.cr.tailTip,4,.12*u.s,1,'#7ad04a'); if(t&&t.alive&&t.isUnit&&t.pos.distanceTo(u.pos)<4.5*u.s) applyPoison(t,u,5,4); },
  cbVenomRag:(u,e,fin)=>{ const rg=fin&&(fin.rag||fin.rag2); if(rg){ puff(rg.p[1],6,.15,1.2,'#7ad04a'); puff(rg.p[2],4,.12,1,'#5ab83a'); } },
});
EXTRA_EV.cerbFlame=(u)=>cbFire(u,{});

// a breath of fire: a steady stream of flame from every mouth while it lasts
function cbBreathTick(u,dt){
  const B=u.cbBreath; if(!B) return; B.t-=dt; if(B.t<=0||!u.alive){ u.cbBreath=null; return; }
  const s=u.s;
  for(const [p,d] of cbMouths(u)){ d.y=Math.min(d.y,.12); d.normalize();
    for(let i=0;i<2;i++){ const sp=rand(6,9)*B.big; emitFire(p,1,rand(.13,.22)*s*B.big,d.x*sp,d.y*sp+.3,d.z*sp,.8,rand(.38,.6)); } }
}
/* ---------- Cerberus' brain: leaps on prey from a few strides out, burns crowds, bites and mauls ---------- */
TYPES.cerberus.brain=(u,dt)=>{
  if(u.routing||!u.target||!u.target.alive||!u.target.isUnit||u.action||u.cdT>0||u.state!=='ok') return false;
  const t=u.target, dx=t.pos.x-u.pos.x, dz=t.pos.z-u.pos.z, d=Math.hypot(dx,dz);
  if(d>4.2&&d<8&&(u.cdLeap||0)<game.time&&canTarget(u,t)&&Math.abs(wrapA(Math.atan2(dx,dz)-u.face))<.35&&!t.fl){
    u.cdLeap=game.time+rand(6,9); u.faceGoal=Math.atan2(dx,dz); startAttack(u,t,'cbCrushLeap'); return true; }
  return false;
};
TYPES.cerberus.pick=(u,t)=>{
  const d=t?Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z):9, now=game.time;
  if(!t||!t.isUnit) return pickOf(['cbTripleBite','cbPawMaul','cbSkullRam']);
  const crowd=enemiesNear(u.team,u.pos.x,u.pos.z,3.2);
  if(crowd>=3&&(u.cdCrowd||0)<now){ u.cdCrowd=now+5.5; return pickOf(['cbCyclone','cbRearStomp','cbInfernalHowl']); }
  if(d<6&&(u.cdBreath||0)<now&&Math.random()<.45){ u.cdBreath=now+7; return 'cbFireSweep'; }
  let n,g=0; do{ n=pickOf(['cbTripleBite','cbTripleBite','cbSkullRam','cbPawMaul','cbSerpentLash','cbRendShake','cbPawMaul']); }while(n===u.lastAtk&&++g<5); return n;
};
