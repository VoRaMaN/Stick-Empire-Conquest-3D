/* ================= The Knight: Order cavalry, an armoured rider on a barded warhorse =================
   The horse runs on the Hellcrawler's four-legged rig with a horse's build (27e builds the model). Its moves are
   the Cerberus' heavy-beast clips re-used without the fire: it barges with its shoulder, strikes with a fore hoof,
   rears and stomps, and tramples whatever it leaps on. The rider's lance does most of the killing (27e): every
   lance clip carries a `knLance` event that thrusts it, and the rider thrusts on his own between the horse's blows.
   Cavalry runs down archers and casters (×1.6) and spears are its bane: Spartans deal ×1.8 to it and a spear
   that hits a charging knight stops the charge dead (30-combat, cavMods). */
Object.assign(TYPES,{
  knight:{name:'Knight',engage:2.3,reach:1.6,s:1.3,hp:330,dmg:30,range:1.8,speed:7.6,cd:.8,cost:320,thick:1,turn:5.5,acc:5,armor:.18,
    crawler:true,hound:true,horse:true,cav:true,gearX:true,armReach:.95,tailLow:-1,tailL:.32,foreW:.5,hindW:.78,
    body:[new THREE.Color('#5b3b24'),new THREE.Color('#5b3b24')]},
});
{ const gi=ORDER.indexOf('giant'); ORDER.splice(gi<0?ORDER.length:gi,0,'knight'); }
RAW.knight={};
POSES.knight={idle:fillPose({lean:-.04,crouch:0,draw:0},null),move:null,swingL:0,swingR:0};
POSES.knight.move=fillPose({lean:.06,crouch:.02,draw:0},POSES.knight.idle);
// a Cerberus clip made over for a horse: no fire, no venom, snorts and neighs instead of howls
const HS_EV={cbSnort:'hsSnort',cbHowl:'hsNeigh',hiss:'hsSnort',screech:'hsNeigh',dreadRoar:'hsNeigh'}, HS_DROP={hellfire:1,cbFire:1,cbMane:1,cbVenom:1,cbVenomRag:1,cerbFlame:1};
function hsClip(c,extra,mod){
  const keys=JSON.parse(JSON.stringify(c.keys)), ev=(c.ev||[]).filter(e=>!HS_DROP[e.e]).map(e=>Object.assign({},e,HS_EV[e.e]?{e:HS_EV[e.e]}:{},mod&&e.e==='hit'?mod:{}));
  if(extra) ev.push(...extra); ev.sort((a,b)=>a.t-b.t);
  const o={keys,ev}; for(const k in c) if(k!=='keys'&&k!=='ev') o[k]=c[k]; return o; }
const CB=RAW.cerberus;
Object.assign(RAW.knight,{
  hsLance:hsClip(CB.cbSkullRam,[{t:.3,e:'knLance'}],{dmg:1.25,kb:4,lance:1}),
  hsCouched:hsClip(CB.cbPawMaul,[{t:.24,e:'knLance'}],{dmg:1.05,lance:1}),
  hsHoof:hsClip(CB.cbPawMaul),
  hsRear:hsClip(CB.cbRearStomp),
  hsTrample:hsClip(CB.cbCrushLeap,[{t:.5,e:'knLance'}]),
  block:hsClip(CB.block), parry:hsClip(CB.parry), dodge:hsClip(CB.dodge), recoil:hsClip(CB.recoil), flinch:hsClip(CB.flinch),
});
TYPES.knight.attacks=['hsLance','hsCouched','hsHoof','hsRear','hsTrample'];
Object.assign(MOVE_NAMES,{hsLance:'Lance Strike',hsCouched:'Couched Lance',hsHoof:'Hoof Strike',hsRear:'Rear and Stomp',hsTrample:'Trample'});
IDLES.knight=[];
for(const [n,src] of [['hsGraze','cbSniff'],['hsShake','cbShakeOff'],['hsPaw','cbPawGround'],['hsBlow','cbPant']]){
  const c=hsClip(CB['idle_'+src]); c.idle=1; RAW.knight['idle_'+n]=c; IDLES.knight.push('idle_'+n); }
Object.assign(IDLE_NAMES,{hsGraze:'Crop the Grass',hsShake:'Shake the Mane',hsPaw:'Paw the Ground',hsBlow:'Blow'});
DEF_ODDS.knight={block:.2,parry:.1,dodge:.05};
// finishers: ridden down, trampled, skewered on the lance
FINS.knight=[];
{ const F={
    knTrample:{name:'Trampled',src:'cbHellstomp'},
    knRideDown:{name:'Ridden Down',src:'cbPinRend'},
    knSkewer:{name:'Skewered',contact:2.3,keys:CB.cbSkullRam.keys,ev:[{t:.07,e:'hsSnort'},{t:.3,e:'knLance'},{t:.42,e:'kill',imp:[0,2.5,7],shake:.3}]},
  };
  for(const n in F){ const d=F[n], S=d.src?CB[d.src]:null, def=S?FIN[d.src]:null, c=hsClip(S||d);
    RAW.knight[n]=c; FIN[n]={name:d.name,clip:n,contact:d.contact||(def&&def.contact)||2,victim:def?def.victim:'stagger'}; FINS.knight.push(n); }
  RAW.knight.knTrample.ev.push({t:.36,e:'knLance'}); }
// charges: the lance levelled at a gallop
CHG.knight=[];
for(const [id,src,name,lance] of [['lanceRun','ramRun','Lance Charge',1],['trampleRun','leapRun','Trample',0],['rideBy','swipeRun','Ride-by Strike',1]]){
  const c=CHG.cerberus.find(x=>x.id===src); if(!c) continue; const k=hsClip(c,lance?[{t:Math.max(.05,(c.ev.find(e=>e.e==='hit')||{t:.26}).t-.1),e:'knLance'}]:null,lance?{lance:1}:null);
  CHG.knight.push(Object.assign({},c,{id,name,keys:k.keys,ev:k.ev})); RAW.knight['chg_'+id]={keys:k.keys,ev:k.ev,aim:c.aim,atk:1}; }
