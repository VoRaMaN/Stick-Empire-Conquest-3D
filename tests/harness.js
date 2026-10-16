const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
const js=html.split('<script>')[1].split('</script>')[0];
const THREE=require('three');
class FakeRenderer{constructor(){this.shadowMap={};this.domElement={};}setPixelRatio(){}setSize(){}render(){}}
THREE.WebGLRenderer=FakeRenderer;
const els={};
function el(id){ if(!els[id]) els[id]={id,hidden:false,style:{},textContent:'',innerHTML:'',classList:{add(){},remove(){}},setAttribute(){},addEventListener(){},appendChild(){},onclick:null,value:'1',offsetWidth:0}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el('x'+Math.random()),addEventListener(){}};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}};
global.innerWidth=390; global.innerHeight=844;
global.performance={now:()=>Date.now()};
let rafs=0; global.requestAnimationFrame=()=>{rafs++};
global.setTimeout=()=>{};
global.THREE=THREE;
new Function(js)();
const S=window.__SE3D; S.closeMenu();
let nan=0, fins=0;
function run(frames){ for(let i=0;i<frames;i++){ S.step(1/60);
  for(const u of S.units){ for(const k in u.j){ const v=u.j[k]; if(!isFinite(v.x+v.y+v.z)){ nan++; if(nan<4) console.log('NaN',u.type,k,u.state,u.action&&u.action.c.name); } } if(u.fin) fins++; }
  for(const u of S.corpses){ for(const k in u.j){ const v=u.j[k]; if(!isFinite(v.x+v.y+v.z)){ nan++; if(nan<6) console.log('NaN corpse',u.type,k); } } }
}}
S.game.finMode=2;
run(60*90);
console.log('battle: units',S.units.length,'corpses',S.corpses.length,'statues',S.statues.map(s=>Math.round(s.hp)),'gold',S.game.gold.map(Math.round),'finFrames',fins,'nan',nan);
const types={}; for(const u of S.units) types[u.type+u.team]=(types[u.type+u.team]||0)+1; console.log(types);
// duel finishers
S.setMode('duel');
for(const t of ['miner','sword','spear','archer','giant']){
  S.game.duelSel=t; S.duelDo('fin'); 
  let started=false, victimDead=false;
  for(let i=0;i<60*5;i++){ S.step(1/60); const D=S.game.duel; if(D.att.fin) started=true; if(!D.dum.alive) victimDead=true; }
  const D=S.game.duel; const vp=D.dum.j.pelvis, ap=D.att.pos;
  console.log(t,'finisher started',started,'victim dead',victimDead,'victim pelvis',vp.x.toFixed(2),vp.y.toFixed(2),vp.z.toFixed(2),'att',ap.x.toFixed(2),'nan',nan);
  S.duelDo('atk'); for(let i=0;i<60*3;i++) S.step(1/60); S.duelDo('walk'); for(let i=0;i<60*12;i++) S.step(1/60);
  const a=S.game.duel.att; console.log('  after walk att pos',a.pos.x.toFixed(2),a.pos.z.toFixed(2),'pelvisY-ground',(a.j.pelvis.y-a.pos.y).toFixed(2),'feet', a.feet.map(f=>(f.pos.y).toFixed(2)).join(','),'nan',nan);
}
