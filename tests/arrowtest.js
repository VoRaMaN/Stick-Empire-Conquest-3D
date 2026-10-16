const fs=require('fs');
let js=fs.readFileSync(process.argv[2],'utf8').split('<script>')[1].split('</script>')[0];
js=js.replace('if(i>=im.userData.cap) return;','if(i>=im.userData.cap){ (window.__ovf=window.__ovf||new Map()).set(im,(window.__ovf.get(im)||0)+1); return; }'); js=js.replace("window.__SE3D={","window.__SE3D={arrows,getAr:()=>arIM,CNT,resetBattle,draw,");
const THREE=require('three');
class FR{constructor(){this.shadowMap={};this.domElement={};this.info={render:{calls:0}};}setPixelRatio(){}setSize(){}render(){}}; THREE.WebGLRenderer=FR;
const els={};function el(id){ if(!els[id]) els[id]={hidden:false,style:{},textContent:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},appendChild(){},querySelectorAll:()=>[]}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el(Math.random()),addEventListener(){},body:el('body')};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}};global.innerWidth=390;global.innerHeight=844;
global.performance={now:()=>Date.now()};global.requestAnimationFrame=()=>{};global.setTimeout=()=>{};global.THREE=THREE;
new Function(js)(); const S=window.__SE3D; S.closeMenu();
S.game.size=+(process.env.SZ||2); S.resetBattle(); S.setStance=S.setStance||(()=>{}); S.setStance(0,'charge'); S.setStance(1,'charge');
const peak=new Map(); let frames=0, short=0, maxLen=0; const t0=Date.now();
for(let i=0;i<60*+(process.env.SEC||70);i++){ S.step(1/60); if(i%3) continue; S.draw();
  const A=S.arrows, cap=S.getAr()[0].count; for(const [im,c] of S.CNT){ peak.set(im,Math.max(peak.get(im)||0,c)); }
  maxLen=Math.max(maxLen,A.length);
  // every arrow should be drawn except ground arrows that have fully faded out
  const want=A.filter(a=>!(a.mode==='fixed'&&a.ttl&&Math.min(1,Math.max(0,(a.ttl-a.age)/2))*a.s<.01)).length;
  if(cap<want){ short++; } frames++;
  if(i%(60*10)===0) console.log('t',(i/60)|0,'arrows',A.length,'drawn',cap,'fly',A.filter(a=>a.mode==='fly').length,'body',A.filter(a=>a.mode==='body').length,'corpses',S.corpses.length,'alive',S.units.filter(u=>u.alive).length);
}
console.log('max arrows',maxLen,'frames missing arrows',short,'/',frames,'ms',Date.now()-t0);
for(const [im,c] of peak) console.log('IM peak',im.geometry.type,c,'cap',im.userData.cap);
if(window.__ovf) for(const [im,c] of window.__ovf) console.log('OVERFLOW',im.geometry.type,im.userData.cap,'dropped draws',c);
