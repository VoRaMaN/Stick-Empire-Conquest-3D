// Castles: units bought in battle train in their own building and walk out of its door and the gate onto the
// field (giant from the prison, wing archer out of the aerie's roof hatch); research completes and takes effect;
// the garrison archers shoot; the enemy general researches on his own. Fails on NaN or anything stuck.
const fs=require('fs');
const js=fs.readFileSync(process.argv[2],'utf8').split('<script>')[1].split('</script>')[0];
const THREE=require('three');
class FR{constructor(){this.shadowMap={};this.domElement={};this.capabilities={getMaxAnisotropy:()=>1};}setPixelRatio(){}setSize(){}render(){}} THREE.WebGLRenderer=FR;
const els={}; function el(id){ if(!els[id]) els[id]={id,hidden:false,style:{},textContent:'',innerHTML:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},addEventListener(){},appendChild(){},querySelectorAll:()=>[],querySelector:()=>null,dataset:{},value:'1',offsetWidth:0}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el('x'+Math.random()),addEventListener(){},querySelectorAll:()=>[]};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}}; global.innerWidth=390; global.innerHeight=844;
global.performance={now:()=>Date.now()}; global.requestAnimationFrame=()=>{}; global.setTimeout=()=>{}; global.THREE=THREE;
let seed=4242; Math.random=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
new Function(js)(); const S=window.__SE3D; S.closeMenu();
let nan=0; const chk=()=>{ for(const u of S.units) if(!isFinite(u.pos.x+u.pos.y+u.pos.z)) nan++; };
const run=(n,each)=>{ for(let i=0;i<n;i++){ S.step(1/60); chk(); if(each) each(i); } };

// ---------- 1. every unit type walks out of its building and reaches the field ----------
S.game.size=0; S.resetBattle({gold:[60000,60000]}); S.game.auto=[false,false];
S.game.mana=[5000,5000];
const types=['miner','sword','spear','archer','ninja','cleric','wizard','wing','giant'];
const before=new Set(S.units.map(u=>u.id));
for(const t of types) S.buyUnit(t);
const seen={}, out={}, left={}, gateOpen={v:0}, hatch={v:0}, prison={v:0};
run(60*42,()=>{
  for(const u of S.units){ if(before.has(u.id)||u.team!==0) continue;
    if(!seen[u.type]) seen[u.type]={x:u.pos.x,y:u.pos.y,z:u.pos.z,inCastle:u.inCastle};
    if(!u.inCastle&&!left[u.type]) left[u.type]=1;
    if(u.pos.x>-42.5&&!u.inCastle) out[u.type]=1; }
  const C=S.CASTLES[0]; gateOpen.v=Math.max(gateOpen.v,C.portOpen||0);
  hatch.v=Math.max(hatch.v,C.B.aerie.door.open); prison.v=Math.max(prison.v,C.B.prison.door.open);
});
const born=types.filter(t=>seen[t]), reached=types.filter(t=>out[t]);
console.log('appeared inside the castle',born.length+'/'+types.length,JSON.stringify(Object.fromEntries(Object.entries(seen).map(([k,v])=>[k,v.x.toFixed(1)+','+v.z.toFixed(1)]))));
console.log('reached the field',reached.length+'/'+types.length,'missing',types.filter(t=>!out[t]).join(',')||'none');
console.log('gate raised',gateOpen.v.toFixed(2),'aerie hatch',hatch.v.toFixed(2),'prison gate',prison.v.toFixed(2));
const wing=S.units.find(u=>u.type==='wing'&&u.team===0&&!before.has(u.id));
console.log('wing archer airborne',!!(wing&&wing.fl&&wing.fl.air),'height',wing&&wing.fl?wing.fl.h.toFixed(1):'-');

// ---------- 2. research: castle archers, rage, giant growth ----------
const C0=S.CASTLES[0], g0=C0.garrison.length;
const okA=S.startResearch(0,'castleArchers'), okR=S.startResearch(0,'rage'), okG=S.startResearch(0,'growth'), busy=S.startResearch(0,'shieldWall');
run(60*30);
console.log('research started',okA,okR,okG,'second in same building refused',!busy,'levels',S.resLvl(0,'castleArchers'),S.resLvl(0,'rage'),S.resLvl(0,'growth'),'garrison',g0,'->',C0.garrison.length);
S.buyUnit('giant'); run(60*14);
const gi=S.units.filter(u=>u.type==='giant'&&u.team===0&&!before.has(u.id)).sort((a,b)=>b.id-a.id)[0];
console.log('grown giant scale',gi?gi.s.toFixed(2):'-','hp',gi?Math.round(gi.maxHp):'-');

// ---------- 3. garrison archers shoot enemies that come close ----------
let gArrows=0; const ga=new Set(C0.garrison);
const en=[]; for(let i=0;i<6;i++){ const u=S.spawn('sword',1,-36+i*.6,-4+i); u.ai=false; en.push(u); }
run(60*8,()=>{ for(const a of S.arrows) if(ga.has(a.src)&&!a.counted){ a.counted=1; gArrows++; } });
console.log('garrison arrows',gArrows,'enemies hurt',en.filter(u=>!u.alive||u.hp<u.maxHp).length+'/6');

// ---------- 4. a whole battle: the enemy general researches and both sides keep training ----------
S.game.size=1; S.resetBattle(); S.game.auto=[true,true]; S.setStance(0,'charge'); S.setStance(1,'charge');
let emerged=0; const known=new Set(S.units.map(u=>u.id));
run(60*150,()=>{ for(const u of S.units) if(!known.has(u.id)){ known.add(u.id); if(u.inCastle) emerged++; } });
const r1=Object.entries(S.CASTLES[1].res).filter(([k,v])=>v>0).map(([k,v])=>k+v);
console.log('battle: units out of buildings',emerged,'enemy research',r1.join(',')||'none','stuck in castle',S.units.filter(u=>u.inCastle&&u.alive&&S.game.time-u.bornT>45).length,'over',S.game.over>0||!!S.game.winner);
console.log('nan',nan);
