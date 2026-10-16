const fs=require('fs');
let html=fs.readFileSync(process.argv[2],'utf8');
let js=html.split('<script>')[1].split('</script>')[0];
js=js.replace('window.__SE3D={','window.__SE3D={selectReg,orderMove,orderAttack,orderHold,tacticMods,getCamp:()=>camp,campNew,startCampFight,finishCampFight,openCampaign,closeCampaign,campGo,setTerrain,resetBattle,H,regSlot,regAlive,callouts,pick,getSel:()=>selReg,TERR,campCanAttack,renderCampaign,updateCamera,getCam:()=>cam,');
const THREE=require('three');
class FakeRenderer{constructor(){this.shadowMap={};this.domElement={};}setPixelRatio(){}setSize(){}render(){}}
THREE.WebGLRenderer=FakeRenderer;
const els={};
function el(id){ if(!els[id]) els[id]={id,hidden:false,style:{},textContent:'',innerHTML:'',disabled:false,classList:{add(){},remove(){},toggle(){}},setAttribute(){},getAttribute(){},addEventListener(){},appendChild(){},querySelectorAll:()=>[],onclick:null,value:'1',offsetWidth:0}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el('x'+Math.random()),addEventListener(){},body:el('body')};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}};
global.innerWidth=390; global.innerHeight=844;
global.performance={now:()=>Date.now()};
global.requestAnimationFrame=()=>{};
global.setTimeout=()=>{};
const store={}; global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}};
global.THREE=THREE;
new Function(js)();
const S=window.__SE3D; S.closeMenu(); global.S=S; global.els=els;
let nan=0;
function run(frames,cb){ for(let i=0;i<frames;i++){ S.step(1/60); if(cb) cb(i);
  for(const u of S.units){ for(const k in u.j){ const v=u.j[k]; if(!isFinite(v.x+v.y+v.z)){ nan++; if(nan<4) console.log('NaN',u.type,k,u.state); } } } } }
global.run=run; global.nanCount=()=>nan;
if(require.main===module){
// 1. regiments formed
run(60);
console.log('regs',S.regs.map(r=>r.team+':'+r.type+'#'+r.num+'('+S.regAlive(r).length+')').join(' '));
// 2. order a player sword regiment to move forward and hold
const r=S.regs.find(r=>r.team===0&&r.type==='sword');
S.selectReg(r); console.log('regbar hidden',els['#regbar'].hidden,'title',els['#rgTitle'].textContent,'|',els['#rgSub'].textContent);
S.orderMove(r,{x:-12,z:6}); run(60*8);
const sl=S.regAlive(r).map(u=>{const s=S.regSlot(r,u); return Math.hypot(s.x-u.pos.x,s.z-u.pos.z).toFixed(2);});
console.log('after move: order',r.order.kind,'slot dists',sl.join(','),'faces',S.regAlive(r).map(u=>u.face.toFixed(2)).join(','));
// 3. attack an enemy regiment
const er=S.regs.find(r=>r.team===1&&r.type==='sword');
S.orderAttack(r,er,null); let calls=new Set();
const tm0=S.tacticMods; 
run(60*15,()=>{ for(const c of S.callouts) if(c.age<1) calls.add(c.el.textContent); });
console.log('after attack: order',r.order.kind,'alive own',S.regAlive(r).length,'enemy',er?S.regAlive(er).length:0,'callouts',[...calls].join('|'),'nan',nan);
// 4. tactic mods sanity
const a=S.units.find(u=>u.alive&&u.team===0&&u.type==='sword'), t=S.units.find(u=>u.alive&&u.team===1&&u.isUnit);
if(a&&t){ const sv=a.pos.clone(); 
  const f=t.fwdW; a.pos.set(t.pos.x-f.x*1.5,t.pos.y,t.pos.z-f.z*1.5); console.log('rear',JSON.stringify(S.tacticMods(a,t,true)));
  a.pos.set(t.pos.x+f.z*1.5,t.pos.y,t.pos.z-f.x*1.5); console.log('side',JSON.stringify(S.tacticMods(a,t,true)));
  a.pos.set(t.pos.x+f.x*1.5,t.pos.y+.6,t.pos.z+f.z*1.5); a.charging=true; console.log('front+high+charge',JSON.stringify(S.tacticMods(a,t,true)));
  a.pos.copy(sv); }
// 5. pick: select regiment via projected tap
S.selectReg(null);
const sp=S.regs.find(r=>r.team===0&&r.type==='spear'); const u0=S.regAlive(sp)[0];
for(let i=0;i<120;i++) S.updateCamera(1/60); S.camera.updateMatrixWorld(); const P=u0.j.chest.clone().project(S.camera); const sx=(P.x*.5+.5)*390, sy=(-P.y*.5+.5)*844;
S.pick(sx,sy); console.log('picked',S.getSel()&&S.getSel().type, 'screen',sx.toFixed(0),sy.toFixed(0));
S.pick(195,600); console.log('after ground tap order',sp.order.kind, sp.order.x&&sp.order.x.toFixed(1), sp.order.z&&sp.order.z.toFixed(1));
run(60*5);
console.log('nan',nan);
}
