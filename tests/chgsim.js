const fs=require('fs');
let js=fs.readFileSync(process.argv[2],'utf8').split('<script>')[1].split('</script>')[0];
js=js.replace("window.__SE3D={","window.__SE3D={resetBattle,CHG,");
const THREE=require('three');
class FR{constructor(){this.shadowMap={};this.domElement={};}setPixelRatio(){}setSize(){}render(){}}; THREE.WebGLRenderer=FR;
const els={};function el(id){ if(!els[id]) els[id]={hidden:false,style:{},textContent:'',classList:{add(){},remove(){}},setAttribute(){},addEventListener(){},appendChild(){},querySelectorAll:()=>[]}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el(Math.random()),addEventListener(){},body:el('body')};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}};global.innerWidth=390;global.innerHeight=844;
global.performance={now:()=>Date.now()};global.requestAnimationFrame=()=>{};global.setTimeout=()=>{};global.THREE=THREE;
new Function(js)(); const S=window.__SE3D; S.closeMenu();
S.game.size=1; S.resetBattle(); for(let i=0;i<60*3;i++) S.step(1/60); S.setStance(0,'charge'); S.setStance(1,'charge');
const seen=new WeakSet(), cnt={}, runFrames={}; let nan=0;
for(let i=0;i<60*40;i++){ S.step(1/60);
  for(const u of S.units){ if(!u.alive) continue; const a=u.action; if(a&&!seen.has(a)){ seen.add(a); if(a.c.name.startsWith('chg_')) cnt[u.type+':'+a.c.name]=(cnt[u.type+':'+a.c.name]||0)+1; }
    if(u.chg&&u.chgW>.5) runFrames[u.type]=(runFrames[u.type]||0)+1;
    for(const k in u.j){ const v=u.j[k]; if(!isFinite(v.x+v.y+v.z)) nan++; } } }
console.log('charge strikes',Object.entries(cnt).sort().map(([k,v])=>k+'='+v).join(' '));
console.log('distinct',Object.keys(cnt).length,'run frames',JSON.stringify(runFrames),'nan',nan);
