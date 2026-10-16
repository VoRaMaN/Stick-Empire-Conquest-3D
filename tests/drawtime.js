const fs=require('fs');
let js=fs.readFileSync(process.argv[2],'utf8').split('<script>')[1].split('</script>')[0];
js=js.replace("window.__SE3D={","window.__SE3D={arrows,resetBattle,draw,drawArrows,");
const THREE=require('three');
class FR{constructor(){this.shadowMap={};this.domElement={};this.info={render:{calls:0}};}setPixelRatio(){}setSize(){}render(){}}; THREE.WebGLRenderer=FR;
const els={};function el(id){ if(!els[id]) els[id]={hidden:false,style:{},textContent:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},appendChild(){},querySelectorAll:()=>[]}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el(Math.random()),addEventListener(){},body:el('body')};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}};global.innerWidth=390;global.innerHeight=844;
global.performance={now:()=>Date.now()};global.requestAnimationFrame=()=>{};global.setTimeout=()=>{};global.THREE=THREE;
Math.random=(()=>{let s=12345;return ()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;};})();
new Function(js)(); const S=window.__SE3D; S.closeMenu();
S.game.size=2; S.resetBattle(); S.setStance(0,'charge'); S.setStance(1,'charge');
for(let i=0;i<60*28;i++) S.step(1/60);
const {performance:P}=require('perf_hooks');
let t=P.now(); for(let i=0;i<200;i++) S.drawArrows(); const da=(P.now()-t)/200;
t=P.now(); for(let i=0;i<60;i++) S.draw(); const dd=(P.now()-t)/60;
t=P.now(); for(let i=0;i<60;i++) S.step(1/60); const ds=(P.now()-t)/60;
console.log('arrows',S.arrows.length,'drawArrows ms',da.toFixed(3),'draw ms',dd.toFixed(2),'step ms',ds.toFixed(2));
