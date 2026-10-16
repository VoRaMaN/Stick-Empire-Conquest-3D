// One game instance (host or guest) for tests/nettest.js, driven over IPC. Each player runs in its own process, so
// every client really has its own copy of the game, exactly as separate browsers would.
const fs=require('fs');
const js=fs.readFileSync(process.argv[2],'utf8').split('<script>')[1].split('</script>')[0];
const THREE=require('three');
class FR{constructor(){this.shadowMap={};this.domElement={};this.capabilities={getMaxAnisotropy:()=>1};}setPixelRatio(){}setSize(){}render(){}} THREE.WebGLRenderer=FR;
const els={}; function el(id){ if(!els[id]) els[id]={id,hidden:false,style:{},dataset:{},textContent:'',innerHTML:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},addEventListener(){},appendChild(){},querySelectorAll:()=>[],querySelector:()=>null}; return els[id]; }
global.document={querySelector:s=>el(s),getElementById:id=>el('#'+id),createElement:()=>el('x'+Math.random()),addEventListener(){},querySelectorAll:()=>[],hidden:false};
global.window={devicePixelRatio:2,innerWidth:390,innerHeight:844,addEventListener(){}}; global.innerWidth=390; global.innerHeight=844;
let clock=1000; global.performance={now:()=>clock}; global.requestAnimationFrame=()=>{}; global.setTimeout=()=>0; global.clearTimeout=()=>{}; global.setInterval=()=>0; global.clearInterval=()=>{}; global.THREE=THREE;
let seed=+(process.argv[3]||7); Math.random=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
new Function(js)(); const S=window.__SE3D; S.closeMenu(); const T=S.netTest();
let nan=0;
const U=u=>({id:u.id,type:u.type,team:u.team,x:+u.pos.x.toFixed(3),z:+u.pos.z.toFixed(3),hp:Math.round(u.hp),alive:u.alive,reg:u.reg?u.reg.id:0,act:u.action?u.action.c.name:null,net:!!u.net});
process.on('message',m=>{
  let out={ok:true};
  try{
    switch(m.op){
      case 'begin': T.begin(m.room,m.uid); T.presence(m.room.players.map(p=>p.user_id)); break;
      case 'host-step':{ const ticks=[]; T.collect=ticks;
        for(let i=0;i<m.frames;i++){ clock+=1000/60; S.step(1/60); netAfter(1/60); for(const u of S.units) if(!isFinite(u.pos.x+u.pos.z)) nan++; }
        T.collect=null; out.ticks=ticks; break; }
      case 'guest-step':{ for(const s of (m.ticks||[])) T.receive(s);
        for(let i=0;i<m.frames;i++){ clock+=1000/60; netBefore(1/60); S.step(1/60); netAfter(1/60); for(const u of S.units) if(!isFinite(u.pos.x+u.pos.z)) nan++; } break; }
      case 'issue': out.r=S.issue(m.type,m.p); out.cmd=T.lastCmd||null; break;
      case 'hostcmd': T.hostCommand(m.uid,m.m); break;
      case 'eval': out.v=new Function('S','T','U',m.code)(S,T,U); break;
      case 'state': out.v={units:S.units.filter(u=>u.alive).map(U),corpses:S.corpses.length,gold:S.game.gold.slice(),mana:S.game.mana.slice(),
        statues:S.statues.map(s=>[Math.ceil(s.hp),Math.round(s.max)]),over:S.game.over,winner:S.game.winner,regs:S.regs.map(r=>({id:r.id,team:r.team,kind:r.order.kind,n:r.units.filter(u=>u.alive).length})),
        stance:S.game.stance.slice(),nan,netOver:T.over(),pending:T.pending(),acks:T.acks||[],hostCmds:T.hostCmds||0,applied:T.applied||0,stats:T.stats()}; break;
      case 'quit': process.exit(0);
    }
  }catch(e){ out={ok:false,err:e.stack||String(e)}; }
  process.send(Object.assign({id:m.id},out));
});
// the same per-frame hooks the browser's main loop calls
function netBefore(dt){ if(S.NET.on) S.netBeforeStep(dt); }
function netAfter(dt){ if(S.NET.on) S.netAfterStep(dt); }
process.send({id:0,ready:true});
