const fs=require('fs');
let js=fs.readFileSync(process.argv[2],'utf8').split('<script>')[1].split('</script>')[0];
js=js.replace("window.__SE3D={","window.__SE3D={spawn,clearAll,setupStatues,regs,draw,");
const THREE=require('three');
class FR{constructor(){this.shadowMap={};this.domElement={};this.info={render:{calls:0}};}setPixelRatio(){}setSize(){}render(){}}; THREE.WebGLRenderer=FR;
const els={};function el(id){ if(!els[id]) els[id]={hidden:false,style:{},textContent:'',classList:{add(){},remove(){}},setAttribute(){},addEventListener(){},appendChild(){},querySelectorAll:()=>[]}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el(Math.random()),addEventListener(){},body:el('body')};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}};global.innerWidth=390;global.innerHeight=844;
global.performance={now:()=>Date.now()};global.requestAnimationFrame=()=>{};global.setTimeout=()=>{};global.THREE=THREE;
new Function(js)(); const S=window.__SE3D; S.closeMenu();
const N=+(process.argv[3]||200);
const mix=['sword','sword','sword','spear','spear','archer','archer','giant','sword','spear'];
for(let t=0;t<2;t++) for(let i=0;i<N-8;i++) S.spawn(mix[i%mix.length],t);
let scene=null; 
const t0=Date.now(); for(let i=0;i<60*5;i++) S.step(1/60); const t1=Date.now();
console.log('units',S.units.length,'regs',S.regs.length,'sim ms/frame',((t1-t0)/300).toFixed(2));
const t2=Date.now(); for(let i=0;i<60;i++){ S.step(1/60); S.draw(); } const t3=Date.now(); console.log('sim+draw ms/frame',((t3-t2)/60).toFixed(2));
for(let i=0;i<60*20;i++) S.step(1/60); const t4=Date.now(); for(let i=0;i<120;i++) S.step(1/60); console.log('mid-battle sim ms/frame',((Date.now()-t4)/120).toFixed(2),'alive',S.units.filter(u=>u.alive).length,'corpses',S.corpses.length);
