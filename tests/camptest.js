// seeded, so a run is repeatable (SEED=n to try another campaign; it was unseeded before and could rarely lose)
{ let seed=+(process.env.SEED||2024); Math.random=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; }; }
require('./p3test.js');
const sh=()=>{const c=S.getCamp(); return 'turn '+c.turn+' owner '+JSON.stringify(c.owner)+' pending '+JSON.stringify(c.pending)+' over '+c.over+' msg '+c.msg;};
S.openCampaign(); console.log('paused',S.game.paused,'camp hidden',els['#camp'].hidden, 'svg len',els['#cMap'].innerHTML.length,'turn',els['#cTurn'].textContent);
console.log('can attack',['bronze','flats','ford','keep','olive'].map(id=>id+':'+S.campCanAttack(id)).join(' '));
const c=S.getCamp(); c.sel='bronze'; S.renderCampaign(); console.log('btn',els['#cGo'].textContent,els['#cGo'].disabled,'|',els['#cMsg'].innerHTML);
S.campGo();
console.log('fight',JSON.stringify(S.game.campFight),'paused',S.game.paused,'mode',S.game.mode,'statues',S.statues.map(s=>s.hp),'gold',S.game.gold,'units',S.units.length,'terrain wave',S.TERR.wave);
run(60*20);
console.log('after 20s units',S.units.filter(u=>u.alive).length,'nan',nanCount());
// force win: destroy enemy statue
S.statues[1].hp=1; 
// find hitStatue? simulate by direct
S.game.autoResults=true;
let steps=0; S.statues[1].hp=0; S.game.over=0.01; S.game.winner=0; run(5);
console.log(sh(), 'paused',S.game.paused,'campFight',S.game.campFight);
// close map after finished fight
S.closeCampaign(); run(30); console.log('after close: statues',S.statues.map(s=>s.hp),'over',S.game.over,'units',S.units.length);
// play a full simulated campaign with random outcomes
S.campNew(); let fights=0;
for(let i=0;i<80;i++){
  const C=S.getCamp(); if(C.over) break;
  if(!C.pending){ const opts=['olive','sparta','bronze','flats','ford','dunes','ash','keep'].filter(S.campCanAttack); C.sel=opts[0]; }
  S.campGo(); fights++; run(30);
  S.game.over=0.01; S.game.winner=fights%5===2?1:0; run(3);   // mostly wins, with a lost fight now and then (deterministic, so the test cannot flake)
}
console.log('fights',fights,sh());
console.log('nan',nanCount());
