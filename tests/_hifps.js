// Lab at a high frame rate: tiny steps (1/203 s) with slow-mo; report the first NaN anywhere (units, corpses, ragdolls)
const fs=require('fs');
const js=fs.readFileSync(process.argv[2],'utf8').split('<script>')[1].split('</script>')[0];
const THREE=require('three');
class FR{constructor(){this.shadowMap={};this.domElement={};this.capabilities={getMaxAnisotropy:()=>1};}setPixelRatio(){}setSize(){}render(){}} THREE.WebGLRenderer=FR;
const els={}; function el(id){ if(!els[id]) els[id]={id,hidden:false,style:{},textContent:'',innerHTML:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},addEventListener(){},appendChild(){},querySelectorAll:()=>[]}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el('x'+Math.random()),addEventListener(){},querySelectorAll:()=>[]};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}}; global.innerWidth=390; global.innerHeight=844;
global.performance={now:()=>Date.now()}; global.requestAnimationFrame=()=>{}; global.setTimeout=()=>{}; global.THREE=THREE;
let seed=+(process.env.SEED||777); Math.random=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
new Function(js)(); const S=window.__SE3D; S.closeMenu();
const DT=1/(+(process.env.FPS||203));
const bad=v=>v&&v.isVector3&&!isFinite(v.x+v.y+v.z);
let first=null, ctx='';
function chk(){ if(first) return;
  for(const L of [S.units,S.corpses]) for(const u of L){
    if(bad(u.pos)){ first=ctx+' pos '+u.type+(u.alive?' alive':' dead'); return; }
    for(const k in u.j) if(bad(u.j[k])){ first=ctx+' joint '+k+' '+u.type+(u.alive?' alive':' dead')+(u.rag?' rag':''); return; }
    if(u.rag) for(const p of u.rag.p) if(bad(p)){ first=ctx+' ragdoll '+u.type; return; }
    if(u.cr) for(const p of u.cr.tail) if(bad(p)){ first=ctx+' tail '+u.type; return; } } }
const run=sec=>{ for(let i=0;i<sec/DT&&!first;i++){ S.step(DT); chk(); } };
const types=(process.env.TYPES||'sword,spear,archer,giant,miner,ninja,cleric,wizard,wing,crawler').split(',');
for(const ty of types){
  S.game.duelSel=ty; S.setMode('duel'); S.game.slow=true;
  const fins=S.FINS[ty]||[]; for(let k=0;k<fins.length&&!first;k++){ ctx=ty+' fin '+fins[k]; S.setMode('duel'); S.game.slow=true; const D=S.game.duel; S.startFinisher(D.att,D.dum,fins[k]); run(4.5); }
  const atks=S.TYPES[ty].attacks||[]; for(let k=0;k<atks.length&&!first;k++){ ctx=ty+' atk '+atks[k]; S.setMode('duel'); S.game.slow=true; const D=S.game.duel; D.dum.hp=D.dum.maxHp=99999; S.startAttack(D.att,D.dum,atks[k]); run(2.5); }
  for(let k=0;k<10&&!first;k++){ ctx=ty+' charge '+k; S.duelDo('charge'); run(4.5); }
  for(let k=0;k<(S.IDLES[ty]||[]).length&&!first;k++){ ctx=ty+' idle '+k; S.duelDo('idle'); run(3); }
  console.log(ty,'done',first?'NaN: '+first:'ok');
  if(first) break;
}
