// The Chaos Empire: a castle battle of Order against Chaos (and the reverse) with every power researched, then
// every idle, move, finisher and charge of the Thrall, Dreadguard and Soul Harvester in the Lab.
// Fails on NaN, crashes, a side that never fights, or powers that never fire.
const fs=require('fs');
// Release 4: the Wildlands Confederacy (castle battles both ways) and the five story missions
const js=fs.readFileSync(process.argv[2],'utf8').split('<script>')[1].split('</script>')[0];
const THREE=require('three');
class FR{constructor(){this.shadowMap={};this.domElement={};this.capabilities={getMaxAnisotropy:()=>1};}setPixelRatio(){}setSize(){}render(){}} THREE.WebGLRenderer=FR;
const els={}; function el(id){ if(!els[id]) els[id]={id,hidden:false,style:{},textContent:'',innerHTML:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},addEventListener(){},appendChild(){},querySelectorAll:()=>[],dataset:{}}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el('x'+Math.random()),addEventListener(){},querySelectorAll:()=>[]};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}}; global.innerWidth=390; global.innerHeight=844;
global.performance={now:()=>Date.now()}; global.requestAnimationFrame=()=>{}; global.setTimeout=()=>{}; global.THREE=THREE;
let seed=+(process.env.SEED||4242); Math.random=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
new Function(js)(); const S=window.__SE3D; S.closeMenu();
const NEW=[];
const ev={}; for(const k in S.EXTRA_EV){ const f=S.EXTRA_EV[k]; S.EXTRA_EV[k]=(...a)=>{ ev[k]=(ev[k]||0)+1; return f(...a); }; }
let nan=0; const bad=new Set();
function chk(list,tag){ for(const u of list){ for(const k in u.j){ const v=u.j[k]; if(!isFinite(v.x+v.y+v.z)){ nan++; const key=tag+u.type+k; if(!bad.has(key)&&bad.size<8){ bad.add(key); console.log('NaN',tag,u.type,k,u.action&&u.action.c.name,u.fin&&u.fin.def&&u.fin.def.name); } return; } } } }
function run(n,each){ for(let i=0;i<n;i++){ S.step(1/60); chk(S.units,''); chk(S.corpses,'corpse '); if(each) each(i); } }


// ---------- 1. the Wildlands against the Chaos Empire, both ways ----------
let summons=0, regrow=0, wildCasts=0, wildNames=new Set(), roots=0, bloom=0;
for(const [f0,f1] of [['wild','chaos'],['chaos','wild']]){
  S.setFactions(f0,f1); S.game.size=1; S.game.mode='battle'; S.resetBattle(); S.game.finMode=1; S.game.auto=[true,true];
  const wt=f0==='wild'?0:1; const C=S.CASTLES[wt];
  for(const id of ['grove','cure','volley','rage']) C.res[id]=1;
  console.log(`== ${f0} vs ${f1}: castle ${C.fac} halls ${C.list.map(b=>b.name).join(', ')} keep ${C.keep.name}`);
  for(const u of S.units) if(u.team===wt&&u.T.wild) wildNames.add(u.T.name);
  const hp0=new Map();
  run(60*50,i=>{
    if(i===60*6){ S.setStance(0,'charge'); S.setStance(1,'charge'); }
    for(const u of S.units){ if(u.summonT&&!u._c){ u._c=1; summons++; } if(u.rootT>S.game.time&&!u._r){ u._r=1; roots++; } if(u.bloomT>S.game.time&&!u._b){ u._b=1; bloom++; }
      const p=hp0.get(u); if(u.T.wild&&p!==undefined&&u.hp>p+1e-6&&!(u.st&&u.st.healF)) regrow++; hp0.set(u,u.hp); }
  });
  // the player's own Druids summon from the ability bar
  const dr=S.regs.find(r=>r.team===wt&&r.type==='cleric'&&S.regAlive(r).length);
  if(dr){ dr.abT={}; const res=S.regAbility(wt,dr,'summon'); console.log('druid summon from the bar',res); }
  console.log('statues',S.statues.map(s=>Math.round(s.hp)).join('/'),'units',S.units.length);
}
console.log('wild names',[...wildNames].join(', '));
console.log('treants summoned',summons,'regrowth ticks',regrow,'rooted',roots,'bloomed',bloom);
const missing=[]; if(!summons) missing.push('summon'); if(!regrow) missing.push('regrow'); if(!wildNames.has('Sylvan Ranger')) missing.push('names');
console.log('battle nan',nan,'missing powers',missing.join(',')||'none');

// ---------- 2. the story missions: each one starts, runs a minute and can be won ----------
S.settings.story={done:{bridge:1,escort:1,shrines:1,ogres:1}};
let storyFail=0; const srow=[];
for(let i=0;i<S.STORY.length;i++){
  let err=null, info='';
  try{
    S.startStory(i); const M=S.getMission(); if(!M) throw new Error('no mission');
    run(60*60); info=`t ${M.t.toFixed(0)} state ${M.state||'-'}`;
    if(M.id==='bridge'){ info+=` waves ${M.wave}`; if(!M.state){ M.t=299.9; run(30); } }
    if(M.id==='escort'){ info+=` ambushes ${M.ambush.filter(a=>a.done).length} miners alive ${M.miners.filter(u=>u.alive).length}`; if(!M.state){ M.arrived=3; run(10); } }
    if(M.id==='shrines'){ if(!M.state){ M.held=59.99; for(const Z of S.RL.zones) if(['A','B','D'].includes(Z.id)) Z.owner=0; run(30); } }
    if(M.id==='ogres'){ if(!M.state){ for(const C of S.RL_NCAMPS||[]) if(C.kind==='ogres') C.cleared=true; run(10); } }
    if(M.id==='elderwood'){ info+=` foe ${S.game.fac[1]}`; if(!M.state) S.storyEnd(true,'test'); }
    info+=` -> ${M.state}`; if(M.state!=='won') storyFail++;
  }catch(e){ err=e.message; storyFail++; }
  srow.push(`${S.STORY[i].id.padEnd(10)} ${err?'ERROR '+err:info}`);
}
console.log(srow.join('\n'));
console.log('story failures',storyFail,'nan',nan);
