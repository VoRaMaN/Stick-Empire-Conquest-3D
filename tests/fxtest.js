const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
const js=html.split('<script>')[1].split('</script>')[0].replace("window.__SE3D={","window.__SE3D={arrows,drops,splats,loose,capes,corpses,");
const THREE=require('three');
class FakeRenderer{constructor(){this.shadowMap={};}setPixelRatio(){}setSize(){}render(){}}
THREE.WebGLRenderer=FakeRenderer;
const els={};function el(id){ if(!els[id]) els[id]={hidden:false,style:{},classList:{add(){},remove(){}},setAttribute(){},addEventListener(){},appendChild(){}}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el(Math.random()),addEventListener(){}};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}};global.innerWidth=390;global.innerHeight=844;
global.performance={now:()=>Date.now()};global.requestAnimationFrame=()=>{};global.setTimeout=()=>{};global.THREE=THREE;
new Function(js)();
const S=window.__SE3D; S.closeMenu(); S.setStance(0,'charge'); let maxMode={}, sleepFrac=[], nan=0, t0=Date.now();
for(let i=0;i<60*180;i++){ S.step(1/60);
  if(i%600===0){ const m={}; for(const a of S.arrows) m[a.mode]=(m[a.mode]||0)+1; for(const k in m) maxMode[k]=Math.max(maxMode[k]||0,m[k]);
    const r=S.corpses.filter(u=>u.rag); if(r.length) sleepFrac.push(r.filter(u=>u.rag.sleep).length/r.length); }
  for(const a of S.arrows){ if(!isFinite(a.p.x+a.p.y+a.p.z)) nan++; } }
const ms=(Date.now()-t0)/(60*180);
console.log('peak arrows by mode',JSON.stringify(maxMode),'| splats now',S.splats.length,'drops',S.drops.length,'| loose weapons',S.loose.length,'landed',S.loose.filter(l=>l.landed).length,'| capes',S.capes.length);
console.log('share of corpses asleep (sampled)',sleepFrac.length?(sleepFrac.reduce((a,b)=>a+b,0)/sleepFrac.length).toFixed(2):'n/a','| arrow NaN',nan,'| sim ms/frame (node)',ms.toFixed(2));
