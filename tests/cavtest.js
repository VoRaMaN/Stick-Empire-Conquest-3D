// The Chaos Empire: a castle battle of Order against Chaos (and the reverse) with every power researched, then
// every idle, move, finisher and charge of the Thrall, Dreadguard and Soul Harvester in the Lab.
// Fails on NaN, crashes, a side that never fights, or powers that never fire.
const fs=require('fs');
// Release 3: Knights, Hell Riders and the generals (battle), then every Knight clip in the Lab
const js=fs.readFileSync(process.argv[2],'utf8').split('<script>')[1].split('</script>')[0];
const THREE=require('three');
class FR{constructor(){this.shadowMap={};this.domElement={};this.capabilities={getMaxAnisotropy:()=>1};}setPixelRatio(){}setSize(){}render(){}} THREE.WebGLRenderer=FR;
const els={}; function el(id){ if(!els[id]) els[id]={id,hidden:false,style:{},textContent:'',innerHTML:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},addEventListener(){},appendChild(){},querySelectorAll:()=>[],dataset:{}}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el('x'+Math.random()),addEventListener(){},querySelectorAll:()=>[]};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}}; global.innerWidth=390; global.innerHeight=844;
global.performance={now:()=>Date.now()}; global.requestAnimationFrame=()=>{}; global.setTimeout=()=>{}; global.THREE=THREE;
let seed=+(process.env.SEED||4242); Math.random=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
new Function(js)(); const S=window.__SE3D; S.closeMenu();
const NEW=['knight'];
const ev={}; for(const k in S.EXTRA_EV){ const f=S.EXTRA_EV[k]; S.EXTRA_EV[k]=(...a)=>{ ev[k]=(ev[k]||0)+1; return f(...a); }; }
let nan=0; const bad=new Set();
function chk(list,tag){ for(const u of list){ for(const k in u.j){ const v=u.j[k]; if(!isFinite(v.x+v.y+v.z)){ nan++; const key=tag+u.type+k; if(!bad.has(key)&&bad.size<8){ bad.add(key); console.log('NaN',tag,u.type,k,u.action&&u.action.c.name,u.fin&&u.fin.def&&u.fin.def.name); } return; } } } }
function run(n,each){ for(let i=0;i<n;i++){ S.step(1/60); chk(S.units,''); chk(S.corpses,'corpse '); if(each) each(i); } }


// ---------- 1. castle battles with knights, Hell Riders and both generals ----------
let lances=0, thrown=0, braced=0, heroCasts=0, heroLv=0, meteors=0, ridden=0;
{ const ls=S.EXTRA_EV.knLance; }
for(const [f0,f1] of [['order','chaos'],['chaos','order']]){
  S.setFactions(f0,f1); S.game.size=1; S.game.mode='battle'; S.resetBattle(); S.game.finMode=1; S.game.auto=[true,true];
  for(const C of S.CASTLES) C.res.cerbRider=1;
  const ot=f0==='order'?0:1, ct=1-ot;
  for(let i=0;i<6;i++) S.spawn('knight',ot); for(let i=0;i<2;i++) S.spawn('cerberus',ct); for(let i=0;i<6;i++) S.spawn('spear',ct);
  for(const u of S.units) if(u.type==='cerberus'&&u.team===ct) S.mountRider(u);
  const heroes=S.HEROS.u.filter(u=>u&&u.alive).length;
  const c0=S.corpses.length;
  run(60*50,i=>{
    if(i===60*5){ S.setStance(0,'charge'); S.setStance(1,'charge'); S.game.auto=[false,true]; }
    for(let t=0;t<2;t++) for(const k in S.HEROS.cd[t]) if(S.HEROS.cd[t][k]>S.game.time+30&&!S['_hc'+t+k+Math.floor(S.HEROS.cd[t][k])]){ S['_hc'+t+k+Math.floor(S.HEROS.cd[t][k])]=1; heroCasts++; }
    meteors=Math.max(meteors,S.METEORS.length);
    for(const u of S.units) if(u.rider&&u.alive) ridden=Math.max(ridden,1);
    for(const u of S.corpses) if(u.riderK&&!u._counted){ u._counted=1; thrown++; }
  });
  heroLv=Math.max(heroLv,S.HEROS.lv[0],S.HEROS.lv[1]);
  console.log(`== ${f0} vs ${f1}: generals at the start ${heroes}, statues ${S.statues.map(s=>Math.round(s.hp)).join('/')}`);
}
lances=ev.knLance||0;
console.log('knight lance thrusts',lances,'riders thrown',thrown,'general ability casts',heroCasts,'highest general level',heroLv,'meteor seen',meteors>0?1:0,'hell riders',ridden);
const missing=[]; if(!lances) missing.push('lance'); if(!thrown) missing.push('thrown'); if(!heroCasts) missing.push('general'); if(!ridden) missing.push('rider');
console.log('battle nan',nan,'missing powers',missing.join(',')||'none');

// ---------- 2. the Lab: every idle, move, finisher and charge ----------
S.setMode('duel'); let labFail=0; const rows=[];
for(const t of NEW){
  S.game.duelSel=t; S.game.finI=-1; S.game.idleI=-1; S.game.chgI=-1;
  const fins=S.FINS[t]; let finOk=0; const finBad=[];
  for(let k=0;k<fins.length;k++){
    S.duelDo('fin'); let started=false, dead=false, err=null;
    try{ run(60*6,()=>{ const D=S.game.duel; if(D.att.fin) started=true; if(!D.dum.alive) dead=true; }); }catch(e){ err=e.message; }
    if(started&&dead&&!err) finOk++; else finBad.push(fins[k]+(err?'('+err+')':started?'(alive)':'(no start)'));
  }
  S.game.duel=null; S.duelDo('idle'); run(30);
  const moves=S.TYPES[t].attacks; let movOk=0; const movBad=[]; let landed=0;
  for(let k=0;k<moves.length;k++){
    const D=S.game.duel; if(D) D.att.atkI=k-1; S.duelDo('atk'); let seen=false, err=null; const dm=S.game.duel.dum; const h0=dm.hp;
    try{ run(60*3.2,()=>{ const a=S.game.duel.att; if(a.action&&a.action.c.name===moves[k]) seen=true; }); }catch(e){ err=e.message; }
    if(!seen&&!err){ S.duelDo('atk'); try{ run(60*3.2,()=>{ const a=S.game.duel.att; if(a.action&&a.action.c.name===moves[k]) seen=true; }); }catch(e){ err=e.message; } }
    if(seen&&!err) movOk++; else movBad.push(moves[k]+(err?'('+err+')':''));
  }
  const idles=S.IDLES[t]; let idOk=0; S.game.idleI=-1;
  for(let k=0;k<idles.length;k++){ S.duelDo('idle'); let seen=false; run(60*2,()=>{ const a=S.game.duel.att; if(a.action&&a.action.c.name===idles[k]) seen=true; }); if(seen) idOk++; }
  const chg=S.CHG[t]; let chOk=0; const chBad=[];
  for(let k=0;k<chg.length;k++){ S.duelDo('charge'); let hit=false, err=null;
    try{ run(60*6,()=>{ const a=S.game.duel.att; if(a.action&&/^chg_/.test(a.action.c.name)) hit=true; }); }catch(e){ err=e.message; }
    if(hit&&!err) chOk++; else chBad.push(chg[k].name+(err?'('+err+')':'')); }
  const ok=finOk===fins.length&&movOk===moves.length&&idOk===idles.length&&chOk===chg.length;
  if(!ok) labFail++;
  rows.push(`${t.padEnd(9)} finishers ${finOk}/${fins.length}  moves ${movOk}/${moves.length}  idles ${idOk}/${idles.length}  charges ${chOk}/${chg.length}`+(finBad.length?'  fin✗ '+finBad.join(' '):'')+(movBad.length?'  move✗ '+movBad.join(' '):'')+(chBad.length?'  chg✗ '+chBad.join(' '):''));
}
console.log(rows.join('\n'));
console.log('lab failures',labFail,'nan',nan);
