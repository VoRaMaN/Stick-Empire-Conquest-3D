const fs=require('fs');
let js=fs.readFileSync(process.argv[2],'utf8').split('<script>')[1].split('</script>')[0];
js=js.replace("function handleEvent(u,e){","function handleEvent(u,e){ if(window.__evHook) window.__evHook(u,e);");
js=js.replace("window.__SE3D={","window.__SE3D={partPoint,strikePoint,PART_R,AIMW,guardPoint,defKind,H,");
const THREE=require('three');
class FR{constructor(){this.shadowMap={};this.domElement={};}setPixelRatio(){}setSize(){}render(){}}; THREE.WebGLRenderer=FR;
const els={};function el(id){ if(!els[id]) els[id]={hidden:false,style:{},textContent:'',classList:{add(){},remove(){}},setAttribute(){},addEventListener(){},appendChild(){},querySelectorAll:()=>[]}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el(Math.random()),addEventListener(){},body:el('body')};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}};global.innerWidth=390;global.innerHeight=844;
global.performance={now:()=>Date.now()};global.requestAnimationFrame=()=>{};global.setTimeout=()=>{};global.THREE=THREE;
new Function(js)(); const S=window.__SE3D, V3=THREE.Vector3; S.closeMenu();
const st={hit:[],guard:[],dodge:0,noaim:0,far:0};
window.__evHook=(u,e)=>{ if(e.e!=='hit'||!e.aim||u.fin) return; const t=u.atkTarget; if(!t||!t.isUnit||!t.alive) return;
  const dk=S.defKind(t); if(dk==='dodge'){ st.dodge++; return; }
  const d=Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z); if(d>u.T.reach+1.6+(t.s-1)) { st.far++; return; }
  const T=dk==='block'||dk==='parry'?S.guardPoint(t,new V3()):S.partPoint(t,e.aim[1],new V3()); const P=S.strikePoint(u,e.aim[0],new V3(),T);
  const blunt=['hL','foot','pommel','head','shoulder'].includes(e.aim[0])||(e.aim[0]==='blade'&&u.type!=='sword'); const off=(dk==='block'||dk==='parry')?(blunt?.08:0):(blunt?(S.PART_R[e.aim[1]]||.1)*t.s*.85+(e.aim[0]==='head'?.19*u.s:e.aim[0]==='shoulder'?.06*u.s:e.aim[0]==='blade'?S.AIMW[u.type].r*u.s:e.aim[0]==='hL'&&u.type==='spear'?.14*u.s:.04*u.s):0); const err=Math.max(0,P.distanceTo(T)-off); (dk==='block'||dk==='parry'?st.guard:st.hit).push([err,u.type,u.action&&u.action.c.name,e.aim.join('>')]); };
S.game.finMode=1;
let minPel=9;
for(let i=0;i<60*150;i++){ S.step(1/60); if(i%10==0) for(const u of S.units){ if(!u.alive||!u.isUnit) continue; const h=(u.j.pelvis.y-S.H(u.pos.x,u.pos.z))/u.s; if(h<minPel){ minPel=h; globalThis.minCtx=[u.type,u.action&&u.action.c.name,u.action&&u.action.t.toFixed(2),'aimDy',(u.aimDy||0).toFixed(2),'fin',!!u.fin,'state',u.state].join(' '); } } }
const q=(a,p)=>{ const s=a.map(x=>x[0]).sort((x,y)=>x-y); return s.length?s[Math.floor(p*(s.length-1))].toFixed(2):'-'; };
console.log('clean hits',st.hit.length,'median err',q(st.hit,.5),'p90',q(st.hit,.9),'| guarded',st.guard.length,'median',q(st.guard,.5),'p90',q(st.guard,.9),'| dodged',st.dodge,'out of reach',st.far,'| min pelvis/s',minPel.toFixed(2));
const worst=st.hit.concat(st.guard).sort((a,b)=>b[0]-a[0]).slice(0,8); console.log('min pelvis ctx',globalThis.minCtx); console.log('worst',JSON.stringify(worst));
