// The four later Order units (Wizard, Cleric, Ninja, Wing Archer): a battle with the full army, then every
// idle, move, finisher and charge of each new unit in the Lab. Fails on NaN, crashes, or abilities that never fire.
const fs=require('fs');
const js=fs.readFileSync(process.argv[2],'utf8').split('<script>')[1].split('</script>')[0];
const THREE=require('three');
class FR{constructor(){this.shadowMap={};this.domElement={};}setPixelRatio(){}setSize(){}render(){}} THREE.WebGLRenderer=FR;
const els={}; function el(id){ if(!els[id]) els[id]={id,hidden:false,style:{},textContent:'',innerHTML:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},addEventListener(){},appendChild(){},querySelectorAll:()=>[],dataset:{},value:'1',offsetWidth:0}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el('x'+Math.random()),addEventListener(){},querySelectorAll:()=>[]};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}}; global.innerWidth=390; global.innerHeight=844;
global.performance={now:()=>Date.now()}; global.requestAnimationFrame=()=>{}; global.setTimeout=()=>{}; global.THREE=THREE;
let seed=777; Math.random=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
new Function(js)(); const S=window.__SE3D; S.closeMenu();
const NEW=['wizard','cleric','ninja','wing'];
const ev={}; for(const k in S.EXTRA_EV){ const f=S.EXTRA_EV[k]; S.EXTRA_EV[k]=(...a)=>{ ev[k]=(ev[k]||0)+1; return f(...a); }; }
let nan=0; const bad=new Set();
function chk(list,tag){ for(const u of list){ for(const k in u.j){ const v=u.j[k]; if(!isFinite(v.x+v.y+v.z)){ nan++; const key=tag+u.type+k; if(!bad.has(key)&&bad.size<8){ bad.add(key); console.log('NaN',tag,u.type,k,u.action&&u.action.c.name,u.fin&&u.fin.def&&u.fin.def.name); } } } } }
function run(n,each){ for(let i=0;i<n;i++){ S.step(1/60); chk(S.units,''); chk(S.corpses,'corpse '); if(each) each(i); } }

// ---------- 1. battle with the full Order army ----------
S.game.size=1; S.resetBattle(); S.setStance(0,'charge'); S.setStance(1,'charge'); S.game.finMode=2;
// both sides have researched every special power (Shinobi, Electric Wall, Poison Spray, Cure, Blazing Bolts)
for(const C of S.CASTLES) for(const id of ['shinobi','ewall','poison','cure','blazing']) C.res[id]=1;
const born={}; for(const u of S.units) born[u.type]=(born[u.type]||0)+1;
console.log('army',JSON.stringify(born));
const fly={air:0,frames:0,hMin:9,hMax:0,legsBelow:0,airborneHits:0}, finBy={}, healed={n:0,hp:0}, cloakSeen=new Set();
const hp0=new Map();
run(60*50,i=>{
  for(const u of S.units){
    if(u.fin&&u.fin.def&&NEW.includes(u.type)) finBy[u.type+':'+u.fin.def.name]=1;
    if(u.cloak) cloakSeen.add(u.id);
    if(u.type==='wing'&&u.alive&&u.fl){ fly.frames++; if(u.fl.air){ fly.air++; const h=u.fl.h; fly.hMin=Math.min(fly.hMin,h); if(h>fly.hMax){ fly.hMax=h; fly.hClip=(u.action?u.action.c.name:'-')+'/'+(u.fin?'fin':'')+'/'+u.state; }
      if(u.j.fL.y<u.j.pelvis.y&&u.j.fR.y<u.j.pelvis.y) fly.legsBelow++; } }
    const p=hp0.get(u); if(p!==undefined&&u.hp>p+.5&&u.alive){ healed.n++; healed.hp+=u.hp-p; } hp0.set(u,u.hp);
  }
});
const bolts=S.arrows.filter(a=>a.bolt).length;
const deadBy={}; for(const u of S.corpses) deadBy[u.type]=(deadBy[u.type]||0)+1;
const fallen=S.corpses.filter(u=>u.type==='wing'); const wingOnGround=fallen.filter(u=>u.rag&&u.rag.p.every(p=>p.y<S.units[0].pos.y+3)).length;
console.log('events',JSON.stringify(ev));
console.log('bolts in world',bolts,'heals',healed.n,'hp healed',Math.round(healed.hp),'cloaked ninjas',cloakSeen.size);
console.log('wing airborne',(fly.air/Math.max(1,fly.frames)*100).toFixed(1)+'%','hips',fly.hMin.toFixed(2)+'..'+fly.hMax.toFixed(2),'legs hanging',(fly.legsBelow/Math.max(1,fly.air)*100).toFixed(0)+'%','highest during',fly.hClip);
console.log('dead',JSON.stringify(deadBy),'wing corpses',fallen.length,'new-unit finishers seen',Object.keys(finBy).length);
const need=['blast','heal','cloak','reload'];
const missing=need.filter(k=>!ev[k]);
console.log('battle nan',nan,'missing abilities',missing.join(',')||'none');

// ---------- 2. the Lab: every idle, move, finisher and charge ----------
S.setMode('duel'); let labFail=0; const rows=[];
for(const t of NEW){
  S.game.duelSel=t; S.game.finI=-1; S.game.idleI=-1; S.game.chgI=-1;
  // finishers
  const fins=S.FINS[t]; let finOk=0; const finBad=[];
  for(let k=0;k<fins.length;k++){
    S.duelDo('fin'); let started=false, dead=false, err=null;
    try{ run(60*6,()=>{ const D=S.game.duel; if(D.att.fin) started=true; if(!D.dum.alive) dead=true; }); }catch(e){ err=e.message; }
    if(started&&dead&&!err) finOk++; else finBad.push(fins[k]+(err?'('+err+')':started?'(alive)':'(no start)'));
  }
  // moves
  S.game.duel=null; S.duelDo('idle'); run(30);
  const moves=S.TYPES[t].attacks; let movOk=0; const movBad=[];
  for(let k=0;k<moves.length;k++){
    const D=S.game.duel; if(D) D.att.atkI=k-1; S.duelDo('atk'); let seen=false, err=null;
    try{ run(60*3.2,()=>{ const a=S.game.duel.att; if(a.action&&a.action.c.name===moves[k]) seen=true; }); }catch(e){ err=e.message; }
    if(!seen&&!err){ S.duelDo('atk'); try{ run(60*3.2,()=>{ const a=S.game.duel.att; if(a.action&&a.action.c.name===moves[k]) seen=true; }); }catch(e){ err=e.message; } }
    if(seen&&!err) movOk++; else movBad.push(moves[k]+(err?'('+err+')':''));
  }
  // idles
  const idles=S.IDLES[t]; let idOk=0; S.game.idleI=-1;
  for(let k=0;k<idles.length;k++){ S.duelDo('idle'); let seen=false; run(60*2,()=>{ const a=S.game.duel.att; if(a.action&&a.action.c.name===idles[k]) seen=true; }); if(seen) idOk++; }
  // charges
  const chg=S.CHG[t]; let chOk=0; const chBad=[];
  for(let k=0;k<chg.length;k++){ S.duelDo('charge'); let hit=false, err=null;
    try{ run(60*6,()=>{ const a=S.game.duel.att; if(a.action&&/^chg_/.test(a.action.c.name)) hit=true; }); }catch(e){ err=e.message; }
    if(hit&&!err) chOk++; else chBad.push(chg[k].name+(err?'('+err+')':'')); }
  const ok=finOk===fins.length&&movOk===moves.length&&idOk===idles.length&&chOk===chg.length;
  if(!ok) labFail++;
  rows.push(`${t.padEnd(7)} finishers ${finOk}/${fins.length}  moves ${movOk}/${moves.length}  idles ${idOk}/${idles.length}  charges ${chOk}/${chg.length}`+(finBad.length?'  fin✗ '+finBad.join(' '):'')+(movBad.length?'  move✗ '+movBad.join(' '):'')+(chBad.length?'  chg✗ '+chBad.join(' '):''));
}
console.log(rows.join('\n'));
console.log('lab failures',labFail,'nan',nan);
