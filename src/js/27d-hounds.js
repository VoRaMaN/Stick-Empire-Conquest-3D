/* ================= Hellhound and Cerberus: heads, paws, tails, the extra heads, fire breath ================= */
{ const ci=CHAOS.indexOf('crawler'); CHAOS.splice(ci+1,0,'hound'); const hi=CHAOS.indexOf('hades'); CHAOS.splice(hi<0?CHAOS.length:hi,0,'cerberus'); }
TYPES.hound.pick=TYPES.crawler.pick; TYPES.hound.brain=TYPES.crawler.brain; TYPES.cerberus.brain=TYPES.crawler.brain;
TYPES.cerberus.pick=(u,t)=>{ const d=t?Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z):9;
  if(t&&t.isUnit&&d<5.5&&(u.cdBreath||0)<game.time&&Math.random()<.5){ u.cdBreath=game.time+7; return 'cbBreath'; }
  return TYPES.crawler.pick(u,t); };
AIMW.hound=AIMW.crawler; AIMW.cerberus=AIMW.crawler;
let houndReady=false;
function houndInit(){
  if(houndReady) return; houndReady=true; crInit();
  const P={}, add=(part,mat,list)=>{ const p=P[part]||(P[part]={}); (p[mat]||(p[mat]=[])).push(...list); }, h=(...a)=>crHorn(...a);
  // skull (y forward along the snout, z up): cranium, long muzzle, brows, tall pointed ears, a mane of flame, fangs
  add('hskl','skin',[crE(0,.05,.04,.11,.12,.1),crL([[.06,0],[.08,.075],[.2,.06],[.32,.042],[.36,0]],12,.9,.75,new V3(0,0,-.01)),crE(.06,.12,.08,.04,.05,.03),crE(-.06,.12,.08,.04,.05,.03)]);
  for(const sd of [-1,1]) add('hskl','skin',h(new V3(sd*.065,.0,.1),new V3(sd*.25,-.35,1),CRX,.25,.15,.04,4));
  add('hskl','bone',[crE(0,.355,.0,.026,.02,.022)]);
  add('hskl','maw',[...h(new V3(0,-.03,.09),new V3(0,-1,.7),CRX,.3,.17,.034,4),...h(new V3(.05,-.06,.06),new V3(.4,-1,.5),CRX,.3,.14,.028,4),...h(new V3(-.05,-.06,.06),new V3(-.4,-1,.5),CRX,.3,.14,.028,4)]);
  for(const sd of [-1,1]){ add('hskl','tooth',[crTooth(sd*.035,.3,-.035,.012,.07,-1),crTooth(sd*.042,.24,-.035,.009,.045,-1)]); }
  add('hskl','eye',[crE(.065,.15,.06,.02,.017,.018),crE(-.065,.15,.06,.02,.017,.018)]);
  add('hjaw','skin',[crL([[0,0],[.02,.055],[.12,.05],[.26,.028],[.3,0]],12,.9,.45,new V3(0,0,-.02))]);
  for(const sd of [-1,1]) add('hjaw','tooth',[crTooth(sd*.032,.24,0,.011,.06,1)]);
  // paw: pad, four toes, short claws
  add('hpaw','skin',[crE(0,.06,0,.07,.09,.05)]);
  for(const x of [-.045,-.015,.015,.045]){ add('hpaw','skin',[crE(x,.13,.0,.022,.03,.024)]); add('hpaw','bone',h(new V3(x,.15,0),new V3(0,1,-.2),CRX,-.4,.05,.01,2)); }
  // tail: slim segments, a burning tip; a mane of flame down the neck
  add('htseg','skin',[crL([[-.02,0],[0,.05],[.1,.045],[.17,.04],[.18,0]])]);
  add('httip','maw',[...h(new V3(0,0,0),new V3(0,1,.1),CRX,.3,.22,.05,4),...h(new V3(.02,.05,0),new V3(.6,1,0),CRX,.2,.14,.03,3),...h(new V3(-.02,.05,0),new V3(-.6,1,0),CRX,.2,.14,.03,3)]);
  add('hmane','maw',[...h(new V3(0,.05,.1),new V3(0,-.6,1),CRX,.4,.18,.035,4),...h(new V3(0,.13,.11),new V3(0,-.6,1),CRX,.4,.2,.04,4),...h(new V3(0,.21,.1),new V3(0,-.6,1),CRX,.4,.17,.035,4)]);
  for(const part in P){ CRG[part]={}; for(const m in P[part]) CRG[part][m]=mergeUV(P[part][m]); }
}
// the canine parts swap in for the Hellcrawler's skull, jaw, hands and tail; Cerberus gets two more heads
function buildHound(u,G){
  houndInit(); const s=u.s;
  for(const n of ['pel','abd','tor','nek']) G['c_'+n]=crPart(n,s);
  G.c_skl=crPart('hskl',s,CR_HEAD); G.c_jaw=crPart('hjaw',s,CR_HEAD); G.c_mane=crPart('hmane',s);
  if(u.T.heads===3) for(const k of ['2','3']){ G['c_skl'+k]=crPart('hskl',s,CR_HEAD*.9); G['c_jaw'+k]=crPart('hjaw',s,CR_HEAD*.9); }
  for(const sd of ['L','R']){ for(const n of ['ua','fa','th','sh','mt','ft']) G['c_'+n+sd]=crPart(n,s); G['c_hd'+sd]=crPart('hpaw',s); }
  for(let i=0;i<CR_TN;i++) G['c_t'+i]=crPart('htseg',s,CR_TK[i]);
  G.c_tt=crPart('httip',s,CR_TK[CR_TN]);
  crInitRig(u);
}
const _hd1=new V3(),_hd2=new V3(),_hd3=new V3(),_hd4=new V3();
function houndModel(u){
  const G=u.G, cr=u.cr, j=u.j, s=u.s; if(!G||!cr) return;
  if(G.c_mane) orient(G.c_mane,j.chest,_hd1.subVectors(j.neck,j.chest),cr.n);
  if(!G.c_skl2) return;
  // two more heads beside the first, splayed a little outward, jaws snapping with it
  const hr=_hd2.crossVectors(cr.hd,cr.hu).normalize(), ja=.06+cr.jaw*.8;
  for(const [k,sd] of [['2',-1],['3',1]]){
    _hd3.copy(j.neck).addScaledVector(hr,sd*.24*s).addScaledVector(cr.hd,-.06*s).addScaledVector(cr.hu,-.03*s);
    _hd1.copy(cr.hd).applyAxisAngle(cr.hu,-sd*.38);
    orient(G['c_skl'+k],_hd3,_hd1,cr.hu);
    _hd4.crossVectors(_hd1,cr.hu).normalize(); const jd=_hd1.clone().applyAxisAngle(_hd4,-ja), ju=cr.hu.clone().applyAxisAngle(_hd4,-ja);
    orient(G['c_jaw'+k],_hd3.addScaledVector(_hd1,.045*CR_HEAD*s).addScaledVector(cr.hu,-.04*CR_HEAD*s),jd,ju); }
}
function houndFx(u){
  const cr=u.cr, s=u.s; if(!cr||!u.G) return;
  if(Math.random()<.18){ _hd1.copy(cr.tailTip); puff(_hd1,1,.06*s,.7,Math.random()<.5?'#ff7a1a':'#ffb347'); }
  if(u.T.heads!==3) return;
  const hr=_hd2.crossVectors(cr.hd,cr.hu).normalize(), k=CR_HEAD*.9*s;
  for(const sd of [-1,1]){ _hd1.copy(cr.hd).applyAxisAngle(cr.hu,-sd*.38);
    for(const e of [-1,1]){ _hd3.copy(u.j.neck).addScaledVector(hr,sd*.24*s).addScaledVector(cr.hd,-.06*s).addScaledVector(_hd1,.15*k).addScaledVector(cr.hu,.055*k)
      .addScaledVector(_hd4.crossVectors(_hd1,cr.hu).normalize(),e*.065*k); glowAt(_hd3,.03*k,'#ff8a2a'); } }
}
// Cerberus breathes fire from all three heads: a burning cone ahead of it
function cerbFlame(u){
  const s=u.s, o=u.j.head.clone().addScaledVector(u.fwdW,.25*s), f=u.fwdW, len=5.5;
  for(const off of [-.35,0,.35]){ const d=f.clone().applyAxisAngle(UP,off);
    for(let i=1;i<=7;i++){ const p=o.clone().addScaledVector(d,i*len/7); p.y=Math.max(p.y-i*.06,H(p.x,p.z)+.4); puffDir(p,d,2,1.8,.35+i*.05,i%2?'#ff7a1a':'#ffb347',.22+i*.03,.55); } }
  flashes.push({p:o.clone(),r0:.2,r1:.9,t:0,life:.25,col:'#ff8a2a'}); crSfx('flameWave','blast',o,.7);
  for(const t of units){ if(!t.alive||t.team===u.team||isAir(t)) continue; const dx=t.pos.x-u.pos.x, dz=t.pos.z-u.pos.z, d=Math.hypot(dx,dz)||1;
    if(d<len+1.2&&(dx*f.x+dz*f.z)/d>.7){ damage(t,u.T.dmg*.7,u,new V3(dx/d,0,dz/d),2.2,.6); applyBurn(t,u,7,3.5); } }
}
EXTRA_EV.cerbFlame=(u)=>cerbFlame(u);
