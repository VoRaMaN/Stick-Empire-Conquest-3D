// Audit: at every finisher contact event, where is each striker relative to the victim's body?
const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
let js=html.split('<script>')[1].split('</script>')[0];
js=js.replace("function handleEvent(u,e){","function handleEvent(u,e){ if(window.__evHook) window.__evHook(u,e);");
js=js.replace("window.__SE3D={","window.__SE3D={FINS,FIN,CLIPS,spawn,startFinisher,clearAll,setupStatues,TYPES,H,partPoint,strikePoint,PART_R,AIMW,");
const THREE=require('three');
class FakeRenderer{constructor(){this.shadowMap={};this.domElement={};}setPixelRatio(){}setSize(){}render(){}}
THREE.WebGLRenderer=FakeRenderer;
const els={};function el(id){ if(!els[id]) els[id]={hidden:false,style:{},textContent:'',classList:{add(){},remove(){}},setAttribute(){},addEventListener(){},appendChild(){},querySelectorAll:()=>[]}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el(Math.random()),addEventListener(){},body:el('body')};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}};global.innerWidth=390;global.innerHeight=844;
global.performance={now:()=>Date.now()};global.requestAnimationFrame=()=>{};global.setTimeout=()=>{};global.THREE=THREE;
new Function(js)();
const S=window.__SE3D, V3=THREE.Vector3; S.closeMenu();
// segment-segment closest distance
function segSeg(p1,q1,p2,q2){ const d1=q1.clone().sub(p1), d2=q2.clone().sub(p2), r=p1.clone().sub(p2); const a=d1.dot(d1), e=d2.dot(d2), f=d2.dot(r);
  let s,t; if(a<=1e-9&&e<=1e-9) return [p1.distanceTo(p2),p1,p2]; if(a<=1e-9){s=0;t=Math.min(1,Math.max(0,f/e));} else { const c=d1.dot(r); if(e<=1e-9){t=0;s=Math.min(1,Math.max(0,-c/a));} else { const b=d1.dot(d2), den=a*e-b*b; s=den!==0?Math.min(1,Math.max(0,(b*f-c*e)/den)):0; t=(b*s+f)/e; if(t<0){t=0;s=Math.min(1,Math.max(0,-c/a));} else if(t>1){t=1;s=Math.min(1,Math.max(0,(b-c)/a));} } }
  const c1=p1.clone().addScaledVector(d1,s), c2=p2.clone().addScaledVector(d2,t); return [c1.distanceTo(c2),c1,c2,s]; }
function bones(v){ const j=v.j,s=v.s,th=v.thick||1, rl=.068*s*th, rt=rl*1.45;
  return [['head',j.head,j.head,.19*s],['neck',j.chest,j.neck,rt],['chest',j.lerp?null:j.chest,j.chest,rt],['torso',j.pelvis,j.chest,rt],
    ['armL',j.sL,j.hL,rl*.86],['armR',j.sR,j.hR,rl*.86],['legL',j.hipL,j.kL,rl],['shinL',j.kL,j.fL,rl*.86],['legR',j.hipR,j.kR,rl],['shinR',j.kR,j.fR,rl*.86]].filter(b=>b[1]); }
const WSEG={sword:[.1,.92],spear:[-.6,1.72],giant:[0,1.22],miner:[0,.72],archer:null};
const WTIPL={sword:.9,spear:1.7,giant:1.15,miner:.7};
function strikers(u){ const j=u.j,s=u.s,out=[]; const W=WSEG[u.type];
  if(W){ out.push(['weapon',j.hR.clone().addScaledVector(u.wRw,W[0]*s),j.hR.clone().addScaledVector(u.wRw,W[1]*s)]);
    if(u.type==='miner'){ const px=new V3().crossVectors(u.wRw,u.rightW).normalize(); const c=j.hR.clone().addScaledVector(u.wRw,.7*s); out.push(['pickhead',c.clone().addScaledVector(px,-.36*s),c.clone().addScaledVector(px,.36*s)]); }
    else out.push(['tip',j.hR.clone().addScaledVector(u.wRw,WTIPL[u.type]*s),j.hR.clone().addScaledVector(u.wRw,WTIPL[u.type]*s)]); }
  if(u.type==='spear'){ const c=j.eL.clone().lerp(j.hL,.6); out.push(['shield',c,c]); }
  if(u.type==='archer'){ out.push(['bow',j.hL.clone().addScaledVector(u.spine,-.4*s),j.hL.clone().addScaledVector(u.spine,.4*s)]); }
  out.push(['footR',j.kR,j.fR],['footL',j.kL,j.fL],['handL',j.eL,j.hL],['handR',j.eR,j.hR],['head',j.head,j.head]);
  return out; }
function measure(u,v){ const res={}; const B=bones(v);
  for(const [nm,a,b] of strikers(u)){ let best=null; for(const [bn,p,q,r] of B){ const [d]=segSeg(a,b,p,q); const sd=d-r-(nm==='head'?.19*u.s:0); if(!best||sd<best[1]) best=[bn,sd]; } res[nm]=best; }
  return res; }
const fmt=m=>m?m[0]+' '+(m[1]<0?'IN':'')+m[1].toFixed(2):'-';
const victims=(process.argv[3]||'sword').split(',');
const only=process.argv[4];
const rows=[];
S.setMode('duel');
let cur=null;
window.__evHook=(u,e)=>{ if(!cur||u!==cur.att) return; if(['jolt','kill','knock','stabRag','grab','release','execute'].indexOf(e.e)<0) return;
  const v=cur.vic; const m=measure(u,v); let aimErr=null;
  if(e.aim&&e.aim[0]!=='bow'){ const T=S.partPoint(v,e.aim[1],new V3()); const P=S.strikePoint(u,e.aim[0],new V3(),T);
    const blunt=['hL','foot','pommel'].includes(e.aim[0])||(e.aim[0]==='blade'&&u.type!=='sword'&&u.type!=='ninja'); const exp=blunt?(S.PART_R[e.aim[1]]||.1)*v.s*.85+(e.aim[0]==='blade'?S.AIMW[u.type].r*u.s:e.aim[0]==='hL'&&u.type==='spear'?.14*u.s:.04*u.s):0;
    aimErr=Math.max(0,P.distanceTo(T)-exp); if(process.env.DBG&&aimErr>.12){ const fw=new V3(Math.sin(u.face),0,Math.cos(u.face)); const rel=T.clone().sub(u.j.sR); console.log('    DBG',e.aim.join('>'),'ikShort',u.hand.R.distanceTo(u.j.hR).toFixed(2),'handL short',u.hand.L.distanceTo(u.j.hL).toFixed(2),'T-sR fwd',rel.dot(fw).toFixed(2),'up',rel.y.toFixed(2),'|T-sR|',rel.length().toFixed(2),'aim w',u.aim&&u.aim.w.toFixed(2),'P-T',P.clone().sub(T).toArray().map(x=>x.toFixed(2)).join(','),'wRw',u.wRw.toArray().map(x=>x.toFixed(2)).join(','),'dist att-vic',Math.hypot(u.pos.x-v.pos.x,u.pos.z-v.pos.z).toFixed(2),'aimDy',(u.aimDy||0).toFixed(2),'aimT-T',u.aim?u.aim.T.clone().sub(T).toArray().map(x=>x.toFixed(2)).join(','):'-','aimBy',u.aim&&u.aim.by,u.aim&&u.aim.e.t); } }
  if(process.env.SEP){ const hd=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z).toFixed(2); console.log('    SEP',e.t,'root',hd(u.pos,v.pos),'chest',hd(u.j.chest,v.j.chest),'head',hd(u.j.head,v.j.head),'headChest',hd(u.j.head,v.j.chest),'zoff',(u.j.head.z-v.j.chest.z).toFixed(2)); }
  cur.ev.push({e:e.e,t:e.t,at:e.at,m,aim:e.aim,aimErr,vy:(v.j.head.y-S.H(v.j.head.x,v.j.head.z)).toFixed(2),down:!!v.rag}); };
for(const at of (process.env.FA_TYPES||'sword,spear,giant,miner,archer').split(',')){
  for(const vt of victims){
    for(const name of S.FINS[at]){ if(only&&name!==only) continue;
      S.clearAll(); S.setupStatues();
      const def=S.FIN[name], T=S.TYPES[at];
      const att=S.spawn(at,0,-1.5,-1.3), vic=S.spawn(vt,1,-1.5+def.contact+.25,-1.3); att.ai=false; vic.ai=false;
      att.face=att.faceGoal=Math.PI/2; vic.face=vic.faceGoal=-Math.PI/2;
      for(let i=0;i<30;i++) S.step(1/60);
      vic.hp=1; cur={att,vic,ev:[]}; S.startFinisher(att,vic,name);
      for(let i=0;i<60*4;i++){ S.step(1/60); if(att.alive){ const h=att.j.pelvis.y-S.H(att.pos.x,att.pos.z); if(h<(globalThis.minPel||9)) globalThis.minPel=h, globalThis.minPelAt=at+' '+name; } }
      rows.push({at,vt,name,ev:cur.ev,vicDead:!vic.alive});
    } } }
for(const r of rows){ console.log(`${r.at.padEnd(6)} ${r.name.padEnd(17)} vs ${r.vt.padEnd(6)} dead:${r.vicDead?'y':'N'}`);
  for(const e of r.ev){ const ms=Object.entries(e.m).sort((a,b)=>a[1][1]-b[1][1]); 
    const flag=e.aimErr===null?'      ':(e.aimErr>.12?' MISS ':'  ok  ');
    console.log(`   t${e.t.toFixed(2)} ${e.e.padEnd(8)} ${e.down?'[down]':'      '} ${flag} ${e.aim?(e.aim.join('>')+(e.aimErr===null?'':' err '+e.aimErr.toFixed(2))).padEnd(22):''.padEnd(22)}| `+ms.slice(0,3).map(([k,m])=>k+'→'+fmt(m)).join('  ')); } }
const all=rows.flatMap(r=>r.ev.filter(e=>e.aim&&e.aimErr!==null)); console.log('aimed events',all.length,'misses >0.12:',all.filter(e=>e.aimErr>.12).length,'mean err',(all.reduce((a,e)=>a+e.aimErr,0)/all.length).toFixed(3));

console.log('lowest pelvis/ground (scaled)',globalThis.minPel&&globalThis.minPel.toFixed(2),globalThis.minPelAt);
