// Audit: at every finisher contact event, where is each striker relative to the victim's body?
const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
let js=html.split('<script>')[1].split('</script>')[0];
js=js.replace("function handleEvent(u,e){","function handleEvent(u,e){ if(window.__evHook) window.__evHook(u,e);");
js=js.replace("function planDefense(t,u,c){","function planDefense(t,u,c){ if(window.__noDef) return;");
js=js.replace("window.__SE3D={","window.__SE3D={startAttack,ATTACKS,partPoint,strikePoint,PART_R,AIMW,");
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

window.__noDef=true;
const vt=process.argv[3]||'sword'; const rows=[]; let cur=null;
window.__evHook=(u,e)=>{ if(!cur||u!==cur.att||e.e!=='hit') return; const v=cur.vic; const m=measure(u,v);
  // which striker is the attack using: weapon unless the pose kicks / bashes
  let aimErr=null; if(e.aim){ const T=S.partPoint(v,e.aim[1],new V3()); const P=S.strikePoint(u,e.aim[0],new V3(),T);
    const blunt=['hL','foot','pommel','head','shoulder'].includes(e.aim[0])||(e.aim[0]==='blade'&&u.type!=='sword'); const exp=blunt?(S.PART_R[e.aim[1]]||.1)*v.s*.85+(e.aim[0]==='blade'?S.AIMW[u.type].r*u.s:e.aim[0]==='hL'&&u.type==='spear'?.14*u.s:e.aim[0]==='head'?.19*u.s:e.aim[0]==='shoulder'?.06*u.s:.04*u.s):0;
    aimErr=Math.max(0,P.distanceTo(T)-exp); const lim=(e.aim[0]==='tip'||e.aim[0]==='pick')?Math.max(.12,(S.PART_R[e.aim[1]]||.1)*v.s*.9):.12; aimErr={v:aimErr,bad:aimErr>lim}; }
  cur.ev.push({t:e.t,m,aim:e.aim,aimErr}); };
S.setMode('duel');
for(const at of ['sword','spear','giant','miner','archer']){
  const names=[...new Set(S.TYPES[at].attacks.concat(Object.keys(S.CLIPS[at]).filter(n=>S.CLIPS[at][n].ev.some(e=>e.e==='hit')&&!S.CLIPS[at][n].idle)))];
  for(const name of names){
    S.clearAll(); S.setupStatues();
    const T=S.TYPES[at]; const att=S.spawn(at,0,-1.5,-1.3), vic=S.spawn(vt,1,-1.5+(at==='archer'?1.3:T.engage)+(S.TYPES[vt].s-1)*.3,-1.3); att.ai=false; vic.ai=false;
    att.face=att.faceGoal=Math.PI/2; vic.face=vic.faceGoal=-Math.PI/2;
    for(let i=0;i<30;i++) S.step(1/60);
    vic.invuln=true; cur={att,vic,ev:[]}; S.startAttack(att,vic,name);
    for(let i=0;i<60*2.5;i++){ S.step(1/60); if(att.alive){ const h=(att.j.pelvis.y-S.H(att.pos.x,att.pos.z))/att.s; if(h<(globalThis.minPel||9)) globalThis.minPel=h, globalThis.minPelAt=at+' '+name; } }
    rows.push({at,name,ev:cur.ev,d:(Math.hypot(att.pos.x-vic.pos.x,att.pos.z-vic.pos.z)).toFixed(2)});
  } }
let miss=0,n=0;
for(const r of rows){ for(const e of r.ev){ n++; const ms=Object.entries(e.m).filter(([k])=>!['head','handL','handR'].includes(k)||k==='handL').sort((a,b)=>a[1][1]-b[1][1]); const best=ms[0];
  const bad=e.aimErr?e.aimErr.bad:best[1][1]>.12; if(bad) miss++;
  console.log(`${r.at.padEnd(6)} ${r.name.padEnd(16)} t${e.t.toFixed(2)} ${bad?'MISS':'    '} ${e.aim?(e.aim.join('>')+' err '+e.aimErr.v.toFixed(2)).padEnd(20):''.padEnd(20)} `+ms.slice(0,3).map(([k,m])=>k+'→'+fmt(m)).join('  ')); } }
console.log('hits',n,'visual misses',miss);

console.log('lowest pelvis/ground (scaled)',globalThis.minPel&&globalThis.minPel.toFixed(2),globalThis.minPelAt);
