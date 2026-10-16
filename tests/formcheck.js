const fs=require('fs');
let js=fs.readFileSync(process.argv[2],'utf8').split('<script>')[1].split('</script>')[0];
const THREE=require('three');
class FR{constructor(){this.shadowMap={};this.domElement={};}setPixelRatio(){}setSize(){}render(){}}; THREE.WebGLRenderer=FR;
const els={};function el(id){ if(!els[id]) els[id]={hidden:false,style:{},textContent:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},appendChild(){},querySelectorAll:()=>[]}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el(Math.random()),addEventListener(){},body:el('body')};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}};global.innerWidth=390;global.innerHeight=844;
global.performance={now:()=>Date.now()};global.requestAnimationFrame=()=>{};global.setTimeout=()=>{};global.THREE=THREE;
new Function(js)(); const S=window.__SE3D; S.closeMenu();
for(const sz of [0,1,2]){ S.game.size=sz; S.resetBattle(); 
 const rep=()=>{ const o=[]; for(const t of [0,1]){ const a=S.units.filter(u=>u.alive&&u.team===t&&u.isUnit); const ty={}; for(const u of a) ty[u.type]=(ty[u.type]||0)+1;
  const sx=a.filter(u=>u.slot&&u.type!=='miner').map(u=>u.slot.x); const px=a.filter(u=>u.type!=='miner').map(u=>u.pos.x);
  o.push(`t${t} n${a.length} ${JSON.stringify(ty)} slotX ${Math.min(...sx).toFixed(1)}..${Math.max(...sx).toFixed(1)} posX ${Math.min(...px).toFixed(1)}..${Math.max(...px).toFixed(1)}`);} return o.join(' | '); };
 console.log('size',sz,'t0',rep());
 for(let i=0;i<60*6;i++) S.step(1/60);
 console.log('   6s',rep(), 'dead', S.corpses.length);
}
