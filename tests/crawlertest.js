// Hellcrawler: every attack, finisher, idle and charge plays in the Lab without NaN and its blows land;
// the body stays on its four feet (no limb sinks into or floats off the ground while walking);
// in a castle battle the Crimson Horde's crawlers climb out of the Hellpit, fight and die like anyone else.
const fs=require('fs');
const js=fs.readFileSync(process.argv[2],'utf8').split('<script>')[1].split('</script>')[0];
const THREE=require('three');
class FR{constructor(){this.shadowMap={};this.domElement={};this.capabilities={getMaxAnisotropy:()=>1};}setPixelRatio(){}setSize(){}render(){}} THREE.WebGLRenderer=FR;
const els={}; function el(id){ if(!els[id]) els[id]={id,hidden:false,style:{},textContent:'',innerHTML:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},addEventListener(){},appendChild(){},querySelectorAll:()=>[],querySelector:()=>null,dataset:{},value:'1',offsetWidth:0}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el('x'+Math.random()),addEventListener(){},querySelectorAll:()=>[]};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}}; global.innerWidth=390; global.innerHeight=844;
global.performance={now:()=>Date.now()}; global.requestAnimationFrame=()=>{}; global.setTimeout=()=>{}; global.THREE=THREE;
let seed=777; Math.random=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
new Function(js)(); const S=window.__SE3D; S.closeMenu();
const bad=v=>!isFinite(v.x+v.y+v.z);
let nan=0; const chk=list=>{ for(const u of list){ for(const k in u.j) if(bad(u.j[k])) { nan++; return; } if(u.cr) for(const p of u.cr.tail) if(bad(p)){ nan++; return; } } };
const run=(n,each)=>{ for(let i=0;i<n;i++){ S.step(1/60); chk(S.units); if(each) each(i); } };

// ---------- 1. the Lab: every attack lands on the dummy ----------
S.setMode('duel'); S.game.duelSel='crawler'; S.game.duelDefend=false;
let hits=0, moves=0; const missed=[];
const L=S.TYPES.crawler.attacks;
for(let k=0;k<L.length;k++){
  S.setMode('duel'); const D=S.game.duel, dum=D.dum; dum.invuln=false; dum.hp=dum.maxHp=99999;
  S.startAttack(D.att,dum,L[k]); run(60*2); moves++; if(dum.hp<99999) hits++; else missed.push(L[k]);
}
console.log('attacks',moves,'landed',hits,'missed',missed.join(',')||'none');

// ---------- 2. every finisher kills ----------
let fk=0; const fmiss=[];
for(let k=0;k<S.FINS.crawler.length;k++){ S.duelDo('fin'); run(30); const q=S.game.duel.q; if(q){ S.startFinisher(S.game.duel.att,S.game.duel.dum,q.name); S.game.duel.q=null; }
  run(60*3.2); if(!S.game.duel.dum.alive) fk++; else fmiss.push(S.FINS.crawler[k]); }
console.log('finishers',S.FINS.crawler.length,'killed',fk,'failed',fmiss.join(',')||'none');

// ---------- 3. idles and charges play out ----------
for(let k=0;k<S.IDLES.crawler.length;k++){ S.duelDo('idle'); run(60*3); }
let ch=0; const cmiss=[]; for(let k=0;k<10;k++){ S.duelDo('charge'); const dum=S.game.duel.dum; dum.invuln=false; dum.hp=dum.maxHp=99999; run(60*4.5); if(dum.hp<99999) ch++; else cmiss.push(S.CHG.crawler[k].id); }
console.log('idles',S.IDLES.crawler.length,'charges landed',ch+'/10','missed',cmiss.join(',')||'none');

// ---------- 4. gait: walk the circle; feet stay on the ground, body stays together ----------
S.duelDo('walk'); let maxGap=0, maxStretch=0, minHip=9; const a=S.game.duel.att;
run(60*6,()=>{ for(const p of [a.j.fL,a.j.fR,a.j.hL,a.j.hR]){ const g=S.H(p.x,p.z); maxGap=Math.max(maxGap,Math.abs(p.y-g)); }
  maxStretch=Math.max(maxStretch,a.j.sR.distanceTo(a.j.hR)/a.s,a.j.sL.distanceTo(a.j.hL)/a.s); minHip=Math.min(minHip,a.j.pelvis.y-S.H(a.j.pelvis.x,a.j.pelvis.z)); });
console.log('walk: foot height above ground max',maxGap.toFixed(2),'arm reach used',maxStretch.toFixed(2),'lowest hips',minHip.toFixed(2));

// ---------- 5. a castle battle: crawlers rise from the Hellpit and fight ----------
S.game.size=1; S.setMode('battle'); S.game.auto=[true,true]; S.game.gold=[3000,6000]; S.setStance(0,'charge'); S.setStance(1,'charge');
const seen=new Set(); let fromPit=0, frenzy=0, kd=0, crDead=0, killedBy=0;
const pit=S.CASTLES[1].pit;
run(60*120,()=>{ for(const u of S.units){ if(u.type==='crawler'&&!seen.has(u)){ seen.add(u); if(u.emerge) fromPit++; } if(u.type==='crawler'&&u.frenzy>0) frenzy=Math.max(frenzy,u.frenzy);
  if(u.action&&u.action.c.name==='knockdown'&&!u.kdSeen){ u.kdSeen=1; kd++; } } });
for(const u of S.corpses) if(u.type==='crawler') crDead++;
console.log('battle: crawlers',seen.size,'climbed out of the pit',fromPit,'max pack frenzy',frenzy,'knockdowns',kd,'dead crawlers',crDead,'pit at',pit.grp.position.x.toFixed(1),pit.grp.position.z.toFixed(1));
console.log('nan',nan);
