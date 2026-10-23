// Riverlands: the big map builds, both armies fight across it, capture zones change hands and pay their holders,
// banners climb and fall with the capture, miners work both of their army's corner mines, nobody leaves the field
// or ends up inside a tree, house, tent or castle wall, and the classic field comes back unchanged afterwards.
const fs=require('fs');
const js=fs.readFileSync(process.argv[2],'utf8').split('<script>')[1].split('</script>')[0];
const THREE=require('three');
class FR{constructor(){this.shadowMap={};this.domElement={};this.capabilities={getMaxAnisotropy:()=>1};}setPixelRatio(){}setSize(){}render(){}} THREE.WebGLRenderer=FR;
const els={}; function el(id){ if(!els[id]) els[id]={id,hidden:false,style:{},textContent:'',innerHTML:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},addEventListener(){},appendChild(){},querySelectorAll:()=>[],querySelector:()=>null,dataset:{},onclick:null,value:'1',offsetWidth:0}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el('x'+Math.random()),addEventListener(){},querySelectorAll:()=>[]};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}}; global.innerWidth=390; global.innerHeight=844;
global.performance={now:()=>Date.now()}; global.requestAnimationFrame=()=>{}; global.setTimeout=()=>{}; global.THREE=THREE;
let seed=777; Math.random=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
new Function(js)(); const S=window.__SE3D; S.closeMenu();
let fails=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c) fails++; };
let nan=0, out=0, inside=0, maxIn=0;
const chk=()=>{ for(const u of S.units){ if(!u.alive) continue; if(!isFinite(u.pos.x+u.pos.y+u.pos.z)) nan++;
  if(!u.inCastle&&!u.garrison&&(Math.abs(u.pos.x)>156.01||Math.abs(u.pos.z)>156.01)) out++;
  if(!u.inCastle&&!u.garrison&&!(u.fl&&u.fl.air)){ for(const o of S.RL.obst){ const dx=u.pos.x-o.x, dz=u.pos.z-o.z; let pen=0;
    if(o.r){ pen=o.r-Math.hypot(dx,dz); } else { const lx=dx*o.c+dz*o.s, lz=-dx*o.s+dz*o.c; pen=Math.min(o.hw-Math.abs(lx),o.hd-Math.abs(lz)); }
    if(pen>.25){ inside++; maxIn=Math.max(maxIn,pen); } } } } };
const run=(n,each)=>{ for(let i=0;i<n;i++){ S.step(1/60); if(i%6===0) chk(); if(each) each(i); } };

// ---------- the map ----------
const t0=Date.now();
S.settings.map='river'; S.settings.side='order'; S.startSkirmish(0);
console.log('built in',Date.now()-t0,'ms · obstacles',S.RL.obst.length,'· zones',S.RL.zones.map(z=>z.id).join(''),'· castles at',S.CASTLES.map(C=>C.group.position.x).join(', '));
ok(S.MAP.id==='river'&&S.RL.zones.map(z=>z.id).join('')==='ABCDEFGHIJ','Riverlands is the map in play, with zones A–D and the objectives E–J (militia villages, watchtowers, resurrection shrines)');
const hs=[]; for(let x=-84;x<=84;x+=12) for(let z=-84;z<=84;z+=12) hs.push(S.H(x,z));
ok(hs.every(isFinite),'the ground has a height everywhere ('+Math.min(...hs).toFixed(2)+' to '+Math.max(...hs).toFixed(2)+' m)');
ok(S.H(0,0)>.6,'the stone bridge carries soldiers over the river at the centre (deck '+S.H(0,0).toFixed(2)+' m)');
ok(S.H(7.3,20)< -.8,'the river runs deeper than the water line between the bridges (bed '+S.H(7.3,20).toFixed(2)+' m)');
ok(S.BASE_X[0]===-106&&S.BASE_X[1]===106&&S.MAP.cf===118,'the castles stand at the edges of the valley (walls at ±118 m, statues at ±106 m)');

// ---------- a Normal battle, played by both generals (the enemy's AI, and auto-spawn for us) ----------
S.game.auto=[true,true];
const gold0=S.game.gold.slice(); let zoneOwn=new Set(), banner={up:0,down:0}, lastS=S.RL.zones.map(z=>z.s);
const minesUsed=[new Set(),new Set()];
// our general: send each regiment to the zone its Capture button picks
const cmd=()=>{ for(const r of S.regs){ if(r.team!==0||!S.regAlive(r).length) continue; const Z=S.rlCaptureTarget(r); if(Z&&(r.order.kind==='army'||r.order.kind==='hold')) S.issue('reg',{r:r.id,k:'move',x:Z.x,z:Z.z}); } };
run(60*300,i=>{
  if(i%(60*6)===0) cmd();
  S.RL.zones.forEach((z,k)=>{ if(Math.abs(z.s)>Math.abs(lastS[k])+1e-6) banner.up++; else if(Math.abs(z.s)<Math.abs(lastS[k])-1e-6) banner.down++; lastS[k]=z.s; if(z.owner>=0) zoneOwn.add(z.id+z.owner); });
  for(const u of S.units) if(u.alive&&u.T.worker&&u.rlMine!==undefined&&u.mstate==='mining') minesUsed[u.team].add(u.rlMine);
  if(S.game.over>0) return;
});
const held=S.RL.zones.map(z=>z.id+':'+(z.owner<0?'-':z.owner)+'('+z.s.toFixed(2)+')').join(' ');
console.log('after 5 minutes:',held,'· taken at some point',[...zoneOwn].join(','),'· units',S.units.length,'· gold',S.game.gold.map(Math.round).join('/'),'· over',S.game.over>0,'winner',S.game.winner);
ok(zoneOwn.size>=2,'zones were captured ('+[...zoneOwn].join(', ')+')');
ok([...zoneOwn].some(k=>k.endsWith('0'))&&[...zoneOwn].some(k=>k.endsWith('1')),'both armies took zones');
ok(banner.up>100&&banner.down>=0,'banners climbed the poles as zones were taken ('+banner.up+' frames rising, '+banner.down+' falling)');
const held0=S.RL.zones.reduce((a,z)=>a+z.held[0],0), held1=S.RL.zones.reduce((a,z)=>a+z.held[1],0);
ok(held0+held1>30,'held zones paid out ('+held0.toFixed(0)+' s held by us, '+held1.toFixed(0)+' s by the enemy)');
ok(minesUsed[0].size===2&&minesUsed[1].size===2,'miners worked both corner mines on each side ('+[...minesUsed[0]]+' / '+[...minesUsed[1]]+')');
ok(nan===0,'no NaN positions');
ok(out===0,'nobody left the field ('+out+' samples outside)');
ok(inside===0,'nobody stood inside a tree, house, tent or wall ('+inside+' samples, deepest '+maxIn.toFixed(2)+' m)');

// ---------- a zone changes hands, step by step ----------
S.resetBattle(); S.game.auto=[false,false]; S.clearAll(); const poor=()=>{ S.game.gold[1]=0; };   // nobody else on the field, and the enemy can't buy
const Z=S.RL.zones.find(z=>z.id==='C');
const sw=S.spawn('sword',0,Z.x-1,Z.z); sw.ai=false;
let tTake=0; run(60*20,i=>{ poor(); sw.pos.x=Z.x-1; sw.pos.z=Z.z; if(Z.owner===0&&!tTake) tTake=i/60; });
ok(Z.owner===0&&Math.abs(tTake-11)<1.5,'one soldier alone takes a neutral zone in about 11 s (took '+tTake.toFixed(1)+' s)');
const e1=S.spawn('sword',1,Z.x+1,Z.z); e1.ai=false; const sB=Z.s;
run(60*3,()=>{ poor(); sw.pos.set(Z.x-1,sw.pos.y,Z.z); e1.pos.set(Z.x+1,e1.pos.y,Z.z); });
ok(Z.contest&&Math.abs(Z.s-sB)<1e-6,'with both armies inside, the zone is contested and nothing moves');
sw.alive=false; sw.hp=0; let tLost=0, tTaken=0;
run(60*30,i=>{ poor(); e1.pos.set(Z.x+1,e1.pos.y,Z.z); if(Z.owner<0&&!tLost) tLost=i/60; if(Z.owner===1&&!tTaken) tTaken=i/60; });
ok(tLost>0&&tTaken>tLost,'alone, the enemy first pulls our banner down ('+tLost.toFixed(1)+' s) then raises his ('+tTaken.toFixed(1)+' s)');

// ---------- back to the classic field ----------
S.settings.map='classic'; S.startSkirmish(0);
ok(S.MAP.id==='classic'&&S.MAP.fx1===42&&S.MAP.fz1===15&&S.MAP.cf===46&&S.BASE_X[1]===34&&!S.RL.group.visible,'the classic field is back with its own bounds, castles and statues');
run(60*10); ok(nan===0,'and plays without NaN');
console.log('\nrivertest: '+(fails?fails+' failed':'all passed'));
process.exit(fails?1:0);
