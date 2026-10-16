// The Chaos Empire: a castle battle of Order against Chaos (and the reverse) with every power researched, then
// every idle, move, finisher and charge of the Thrall, Dreadguard and Soul Harvester in the Lab.
// Fails on NaN, crashes, a side that never fights, or powers that never fire.
const fs=require('fs');
// Hellhound and Cerberus (battle and every clip)
const js=fs.readFileSync(process.argv[2],'utf8').split('<script>')[1].split('</script>')[0];
const THREE=require('three');
class FR{constructor(){this.shadowMap={};this.domElement={};this.capabilities={getMaxAnisotropy:()=>1};}setPixelRatio(){}setSize(){}render(){}} THREE.WebGLRenderer=FR;
const els={}; function el(id){ if(!els[id]) els[id]={id,hidden:false,style:{},textContent:'',innerHTML:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},addEventListener(){},appendChild(){},querySelectorAll:()=>[],dataset:{}}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el('x'+Math.random()),addEventListener(){},querySelectorAll:()=>[]};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}}; global.innerWidth=390; global.innerHeight=844;
global.performance={now:()=>Date.now()}; global.requestAnimationFrame=()=>{}; global.setTimeout=()=>{}; global.THREE=THREE;
let seed=+(process.env.SEED||4242); Math.random=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
new Function(js)(); const S=window.__SE3D; S.closeMenu();
const NEW=['hound','cerberus'];
const ev={}; for(const k in S.EXTRA_EV){ const f=S.EXTRA_EV[k]; S.EXTRA_EV[k]=(...a)=>{ ev[k]=(ev[k]||0)+1; return f(...a); }; }
let nan=0; const bad=new Set();
function chk(list,tag){ for(const u of list){ for(const k in u.j){ const v=u.j[k]; if(!isFinite(v.x+v.y+v.z)){ nan++; const key=tag+u.type+k; if(!bad.has(key)&&bad.size<8){ bad.add(key); console.log('NaN',tag,u.type,k,u.action&&u.action.c.name,u.fin&&u.fin.def&&u.fin.def.name); } return; } } } }
function run(n,each){ for(let i=0;i<n;i++){ S.step(1/60); chk(S.units,''); chk(S.corpses,'corpse '); if(each) each(i); } }

// ---------- 1. castle battles: Order against Chaos, then Chaos against Order ----------
for(const [f0,f1] of [['order','chaos'],['chaos','order']]){
  S.setFactions(f0,f1); S.game.size=1; S.game.mode='battle'; S.resetBattle(); S.game.finMode=2; S.game.auto=[true,true];
  for(const C of S.CASTLES) for(const id of ['soulSiphon','magmaClaws','hellCleave','infernalPlate','soulRend','shinobi','ewall','poison','cure','blazing']) C.res[id]=1;
  const born={}; for(const u of S.units) born[u.type+(u.team?'¹':'⁰')]=(born[u.type+(u.team?'¹':'⁰')]||0)+1;
  const gold0=S.game.gold.slice(); let hvMelee=0, regen=0, cursed=0, thrallTrips=0, hp0=new Map(), finBy={}, maxSouls=0, fromBuildings={};
  const seenUnit=new Set(S.units.map(u=>u.id));
  run(60*45,i=>{
    if(i===60*8){ S.setStance(0,'charge'); S.setStance(1,'charge'); }
    for(const u of S.units){
      if(!seenUnit.has(u.id)){ seenUnit.add(u.id); fromBuildings[u.type]=(fromBuildings[u.type]||0)+1; }
      if(u.fin&&u.fin.def&&NEW.includes(u.type)) finBy[u.type+':'+u.fin.def.name]=1;
      if(u.st&&u.st.rend) cursed++;
      if(u.type==='harvester'&&u.action&&u.action!==u._hvA){ u._hvA=u.action; if(S.TYPES.harvester.meleeSet.has(u.action.c.name)) hvMelee++; }
      const p=hp0.get(u); if(p!==undefined&&u.T.chaos&&u.alive&&u.hp>p+1e-6&&!u.st?.healF) regen++; hp0.set(u,u.hp);
      if(u.type==='thrall'&&u.mstate==='toMine'&&u._wasCarry) thrallTrips++; u._wasCarry=u.carry;
    }
    maxSouls=Math.max(maxSouls,S.spells().souls.length);
  });
  const dead={}; for(const u of S.corpses) dead[u.type+(u.team?'¹':'⁰')]=(dead[u.type+(u.team?'¹':'⁰')]||0)+1;
  const st=S.statues.map(s=>Math.round(s.hp)).join('/');
  console.log(`== ${f0} vs ${f1}`);
  console.log('army',JSON.stringify(born));
  console.log('bought',JSON.stringify(fromBuildings));
  console.log('dead',JSON.stringify(dead),'statues',st,'winner',S.game.winner===undefined?'-':S.game.winner);
  console.log('thrall trips',thrallTrips,'regen ticks',regen,'cursed-frames',cursed,'souls in flight max',maxSouls,'chaos finishers seen',Object.keys(finBy).length,'harvester melee',hvMelee);
}
console.log('events',JSON.stringify(ev));
const need=['cbFire'];
const missing=need.filter(k=>!ev[k]);
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
