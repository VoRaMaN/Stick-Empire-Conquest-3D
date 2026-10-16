// Seeded battle fingerprint: proves engine changes leave the original five units behaving identically.
// Usage: node tests/determinism.js dist/artifact.html   (prints a hash; compare before/after a refactor)
const fs=require('fs'), crypto=require('crypto');
let js=fs.readFileSync(process.argv[2],'utf8').split('<script>')[1].split('</script>')[0];
const THREE=require('three');
class FR{constructor(){this.shadowMap={};this.domElement={};}setPixelRatio(){}setSize(){}render(){}}; THREE.WebGLRenderer=FR;
const els={};function el(id){ if(!els[id]) els[id]={hidden:false,style:{},textContent:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},addEventListener(){},appendChild(){},querySelectorAll:()=>[],dataset:{}}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el(Math.random()),addEventListener(){}};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}};global.innerWidth=390;global.innerHeight=844;
global.performance={now:()=>0};global.requestAnimationFrame=()=>{};global.setTimeout=()=>{};global.THREE=THREE;
let seed=12345; Math.random=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
new Function(js)(); const S=window.__SE3D; S.closeMenu();
seed=12345;   // re-seed after loading, so start-up code that draws random numbers can't shift the battle
const mix=process.env.MIX?process.env.MIX.split(','):null;
S.game.classicMix=process.env.NEW!=='1';   // the original four fighting types (plus miners) unless NEW=1
S.game.size=1; S.resetBattle(); S.setStance(0,'charge'); S.setStance(1,'charge'); S.game.finMode=2;
const h=crypto.createHash('sha1'); let deaths=0;
for(let i=0;i<60*35;i++){ S.step(1/60); if(i%30===0){ for(const u of S.units) h.update(u.type+u.id+':'+u.pos.x.toFixed(4)+','+u.pos.z.toFixed(4)+','+u.hp.toFixed(3)+'|'); } }
console.log('units',S.units.length,'corpses',S.corpses.length,'hash',h.digest('hex').slice(0,16));
