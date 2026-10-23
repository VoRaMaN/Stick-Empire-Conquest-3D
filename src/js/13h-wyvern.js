/* ================= The Wyvern Knight (v0.24): the Order's knight rides a war wyvern =================
   The Knight's warhorse is replaced by a wyvern: an organic, low-poly beast on the same four-limbed rig
   (27-hellcrawler), walking on its hind legs and the knuckles of its folded wings, and flying (27f-wyvern).
   This file holds its moves (the clips are data, compiled with every other clip in 14-aim):
     ground attacks 10 · idles 10 · flight 5 (take-off, landing, the breath from the air, the strafing run,
     the dive) · abilities 8 · reactions 6 · finishers 6 · charges 3 — 48 clips, plus the flight cycles drawn
     procedurally (flap, glide, hover, climb, bank, dive), 54 in all.
   New pose channels (10-unit-types NF): wing (0 folded … 1 spread), wup (wings raised + / beaten down -),
   wsw (swept back + / forward -). */
Object.assign(TYPES.knight,{name:'Wyvern Knight',wyvern:true,hp:470,dmg:34,speed:6.3,airSpeed:10.5,cost:450,s:1.38,armor:.2,
  tailLow:-.55,tailL:.62,foreW:.66,hindW:.82,engage:2.4,reach:1.7,range:1.9,turn:5});
const WYK=(c,adds,extra)=>{ const o=hsClip(c,extra); o.keys.forEach((k,i)=>{ if(adds[i]) Object.assign(k,adds[i]); }); return o; };
const WY_FIRE=(t0,n,dt,o)=>Array.from({length:n},(_,i)=>Object.assign({t:+(t0+i*dt).toFixed(3),e:'wyFire'},o||{}));
Object.assign(RAW.knight,{
  // ---- ground attacks ----
  wyBite:{keys:[{t:0},{t:.2,lean:-.25,crouch:.15,draw:.6,fwd:-.1,wing:.15},{t:.34,e:'o',lean:.5,draw:0,fwd:.55,crouch:.05},{t:.5,lean:.25},R_(.85)],
    ev:[{t:.1,e:'hsSnort'},{t:.34,e:'hit',dmg:1,kb:2,bite:1}]},
  wyTailLash:WYK(CB.cbSerpentLash,{1:{wing:.3,wup:.2},2:{wing:.4}},[{t:.2,e:'wyRustle'}]),
  wyWingBuffet:{keys:[{t:0},{t:.3,wing:1,wup:.8,lean:-.3,twist:-.3},{t:.48,e:'o',wing:1,wup:-.4,lean:.2,twist:.35,fwd:.3},{t:.7,wing:.5,wup:0},R_(1.05)],
    ev:[{t:.44,e:'wyFlapSfx'},{t:.48,e:'hit',arc:1.4,dmg:.9,kb:4.5}]},
  wyTalonRake:{keys:[{t:0},{t:.3,lean:-.7,crouch:.05,wing:.7,wup:.5,draw:.5},{t:.5,e:'o',kick:1,lean:-.5,wing:.9,wup:.2},{t:.7,kick:0,lean:-.2,wing:.3},R_(1.1)],
    ev:[{t:.5,e:'hit',dmg:1.2,kb:3}]},
  wyRearStomp:{keys:[{t:0},{t:.4,lean:-1,crouch:.05,R:[.32,.5,.25],L:[-.32,.5,.25],draw:.8,wing:.9,wup:.6,alt:.3},
    {t:.62,e:'o',lean:.45,crouch:.35,R:[.3,-.55,.6],L:[-.3,-.55,.6],draw:0,wing:.6,wup:-.3,fwd:.35},{t:.85,lean:.2,crouch:.2,wing:.2},R_(1.3)],
    ev:[{t:.42,e:'wyRoar',mini:1},{t:.62,e:'hit',aoe:1,stomp:1,dmg:1.15,kb:4}]},
  wySnapShake:WYK(CB.cbRendShake,{2:{wing:.25},5:{wing:.4,wup:.3},8:{wing:.1}}),
  wySpinSweep:WYK(CB.cbCyclone,{1:{wing:.6,wup:.2,wsw:.5},2:{wing:.7,wsw:.6},3:{wing:.3}}),
  wyCrushLeap:WYK(CB.cbCrushLeap,{1:{wing:.6,wup:.6},2:{wing:1,wup:-.3},3:{wing:.8,wup:.5},4:{wing:.2}},[{t:.46,e:'wyFlapSfx'},{t:.5,e:'knLance'}]),
  // ---- idles ----
  idle_wyPreen:{idle:1,keys:[{t:0},{t:.5,look:.9,twist:.4,lean:-.1,draw:.2,wing:.35,wup:.2},{t:1.1,look:1,draw:.5},{t:1.5,look:.85,draw:.1},{t:1.9,look:1,draw:.45},R_(2.6)],ev:[{t:.6,e:'wyRustle'}]},
  idle_wyStretch:{idle:1,keys:[{t:0},{t:.6,wing:1,wup:.6,lean:-.35,draw:.6,crouch:.1},{t:1.4,wing:1,wup:.3,draw:.9},{t:2,wing:.2,wup:0,draw:.1},R_(2.5)],ev:[{t:.5,e:'wyFlapSfx'}]},
  idle_wyShake:{idle:1,keys:[{t:0},{t:.3,wing:.6,wup:.4,side:.3},{t:.45,side:-.3,wup:.1},{t:.6,side:.3,wup:.4},{t:.75,side:-.25},{t:.9,side:0,wing:.1},R_(1.3)],ev:[{t:.3,e:'wyRustle'}]},
  idle_wyLook:{idle:1,keys:[{t:0},{t:.6,look:-.8,lean:-.15},{t:1.4,look:-.8},{t:2,look:.8},{t:2.7,look:.8},R_(3.3)]},
  idle_wySniff:{idle:1,keys:[{t:0},{t:.5,lean:.45,crouch:.15,look:.2},{t:.8,draw:.15,look:-.1},{t:1.1,draw:0,look:.2},{t:1.4,draw:.15},R_(2)],ev:[{t:.8,e:'hsSnort'},{t:1.3,e:'hsSnort'}]},
  idle_wyTailFlick:{idle:1,keys:[{t:0},{t:.3,alt:.8,twist:.2},{t:.5,alt:1.2,twist:-.2},{t:.75,alt:.5,twist:.15},R_(1.2)]},
  idle_wyRoar:{idle:1,keys:[{t:0},{t:.5,lean:-.5,draw:.3,wing:.5,wup:.5},{t:.8,draw:1,lean:-.7,wing:.8,wup:.7},{t:1.6,draw:.9},{t:2,draw:.1,wing:.2,wup:0},R_(2.5)],ev:[{t:.8,e:'wyRoar',mini:1}]},
  idle_wyScratch:{idle:1,keys:[{t:0},{t:.3,kick:.6,lean:-.1,look:.6,side:.2},{t:.45,kick:.4},{t:.6,kick:.65},{t:.75,kick:.4},{t:.9,kick:.6},R_(1.4)]},
  idle_wyYawn:{idle:1,keys:[{t:0},{t:.7,draw:1,lean:-.3},{t:1.5,draw:1},{t:2,draw:0},R_(2.4)]},
  idle_wySettle:{idle:1,keys:[{t:0},{t:.6,crouch:.5,lean:.1,wing:.25},{t:2,crouch:.5},{t:2.6,crouch:0,wing:0},R_(3)]},
  // ---- flight ----
  wyTakeoff:{keys:[{t:0},{t:.25,crouch:.55,wing:.8,wup:.7,lean:.1},{t:.5,e:'o',crouch:0,jump:.6,wing:1,wup:-.3,lean:-.2},{t:.8,wing:1,wup:.6,jump:.9},R_(1)],ev:[{t:.48,e:'wyLaunch'}]},
  wyLand:{keys:[{t:0,wing:1,wup:.4},{t:.15,e:'o',crouch:.55,wing:1,wup:-.2,lean:.1},{t:.5,crouch:.3,wing:.5},R_(.9)],ev:[{t:.12,e:'wyTouch'}]},
  wyAirBreath:{keys:[{t:0,wing:1},{t:.25,lean:.5,draw:.5,wing:1},{t:.4,draw:1,wing:1},{t:1.1,draw:.9,wing:1},{t:1.3,draw:.2,wing:1},R_(1.5)],ev:WY_FIRE(.4,4,.2,{air:1})},
  wyAssaultLoop:{loop:1,keys:[{t:0,lean:.6,draw:.9,wing:1,wsw:.6,wup:.1},{t:.5,lean:.6,draw:1,wing:1,wsw:.6,wup:-.1},{t:1,lean:.6,draw:.9,wing:1,wsw:.6,wup:.1}]},
  wyDiveLand:{keys:[{t:0,lean:.7,wing:1,wsw:.9,wup:.5},{t:.18,e:'o',crouch:.6,lean:.3,wing:1,wup:-.4,kick:-.6,draw:.8},{t:.55,crouch:.3,wing:.4,draw:.2},R_(1)],ev:[{t:.18,e:'wyDiveHit'}]},
  // ---- abilities ----
  knRoyalRun:{loop:1,keys:[{t:0,lean:.3,crouch:.1,wing:.3,wsw:.8,draw:.4},{t:.5,lean:.35,crouch:.12,wing:.3,wsw:.8,draw:.5},{t:1,lean:.3,crouch:.1,wing:.3,wsw:.8,draw:.4}]},
  knExecute:{keys:[{t:0,lean:.6,wing:1,wup:.4},{t:.25,e:'o',crouch:.5,lean:.5,wing:1,wup:-.3,draw:.7},{t:.45,crouch:.4},{t:.8,crouch:.1,wing:.3},R_(1.2)],ev:[{t:.25,e:'knExec'}]},
  knShield:{keys:[{t:0},{t:.3,crouch:.25,lean:-.15,wing:.6,wup:.3,wsw:-.3},{t:1.2,crouch:.2,wing:.55},R_(1.6)],ev:[{t:.3,e:'knCrown'}]},
  knPursuit:{keys:[{t:0},{t:.3,lean:-.4,draw:.8,wing:.6,wup:.5},{t:.7,lean:.3,draw:.2,wing:.2},R_(1)],ev:[{t:.3,e:'wyRoar',mini:1}]},
  knJudgment:{keys:[{t:0},{t:.5,lean:-.95,crouch:.05,wing:.9,wup:.7,draw:.6,R:[.3,.5,.3],L:[-.3,.5,.3]},{t:.9,lean:-1,wing:1,wup:.8},
    {t:1.1,e:'o',lean:.5,crouch:.4,wing:.6,wup:-.4,R:[.3,-.55,.6],L:[-.3,-.55,.6],fwd:.5},{t:1.4,lean:.25,crouch:.25},R_(1.9)],ev:[{t:.5,e:'knRaise'},{t:1.1,e:'knJudge'}]},
  wyBreath:{keys:[{t:0},{t:.35,lean:-.35,crouch:.1,twist:-.5,draw:.6,look:-.2,wing:.4,wup:.3},{t:.5,draw:1,lean:.05},{t:1.5,twist:.5,look:.2,draw:1},{t:1.7,draw:.3},R_(2.1)],
    ev:[{t:.25,e:'hsSnort'}].concat(WY_FIRE(.5,7,.17))},
  wyStorm:{keys:[{t:0},{t:.3,wing:1,wup:.8,lean:-.4,crouch:.15},{t:.5,e:'o',wup:-.5,lean:-.2},{t:.75,wup:.8},{t:.95,e:'o',wup:-.5},{t:1.2,wup:.8},{t:1.4,e:'o',wup:-.5},{t:1.7,wing:.3,wup:0,lean:0},R_(2)],
    ev:[{t:.5,e:'wyGust'},{t:.95,e:'wyGust'},{t:1.4,e:'wyGust'}]},
  wyScreech:{keys:[{t:0},{t:.4,lean:-.6,draw:.5,wing:.8,wup:.7},{t:.6,draw:1,lean:-.8,wing:1,wup:.9},{t:1.6,draw:1},{t:1.9,draw:.1,wing:.2,wup:0,lean:0},R_(2.3)],ev:[{t:.6,e:'wyScreech'}]},
  // ---- reactions (the wing comes up as a shield) ----
  block:{keys:[{t:0},{t:.16,crouch:.3,lean:-.2,wing:.7,wup:.4,wsw:-.4,draw:.3},{t:.5},R_(.8)]},
  parry:{keys:[{t:0},{t:.12,wing:.8,wup:.6,twist:.3,lean:-.15},{t:.3,e:'o',wup:-.2,twist:-.2},R_(.6)],ev:[{t:.28,e:'wyFlapSfx'}]},
  dodge:WYK(CB.dodge,{1:{wing:.8,wup:.5}}),
  recoil:WYK(CB.recoil,{1:{wing:.6,wup:.4}}),
  flinch:WYK(CB.flinch,{1:{wing:.3,wup:.2}}),
  wyAirHit:{keys:[{t:0},{t:.1,e:'o',lean:-.4,wing:1,wup:.7,draw:.5},{t:.35,lean:-.1,wing:1,wup:0},R_(.6)],ev:[{t:.05,e:'wyRoar',mini:1}]},
});
TYPES.knight.attacks=['hsLance','hsCouched','wyBite','wyTailLash','wyWingBuffet','wyTalonRake','wyRearStomp','wySnapShake','wySpinSweep','wyCrushLeap'];
Object.assign(MOVE_NAMES,{hsLance:'Lance Thrust',hsCouched:'Couched Lance',wyBite:'Wyvern Bite',wyTailLash:'Tail Lash',wyWingBuffet:'Wing Buffet',wyTalonRake:'Talon Rake',
  wyRearStomp:'Rear and Stomp',wySnapShake:'Snap and Shake',wySpinSweep:'Tail Sweep',wyCrushLeap:'Crushing Leap',wyTakeoff:'Take Off',wyLand:'Land',wyAirBreath:'Breath from the Sky',
  wyAssaultLoop:'Strafing Run',wyDiveLand:'Talon Dive',knRoyalRun:'Royal Lance Charge',knExecute:'Aerial Execution',knShield:'Shield of the Crown',knPursuit:'Royal Pursuit',
  knJudgment:"King's Judgment",wyBreath:'Infernal Breath',wyStorm:'Wingstorm',wyScreech:"Predator's Screech",wyAirHit:'Struck in the Air'});
IDLES.knight=['idle_wyPreen','idle_wyStretch','idle_wyShake','idle_wyLook','idle_wySniff','idle_wyTailFlick','idle_wyRoar','idle_wyScratch','idle_wyYawn','idle_wySettle'];
Object.assign(IDLE_NAMES,{wyPreen:'Preen',wyStretch:'Stretch the Wings',wyShake:'Ruffle',wyLook:'Scan the Field',wySniff:'Scent the Air',wyTailFlick:'Tail Flick',wyRoar:'Roar',
  wyScratch:'Scratch',wyYawn:'Yawn',wySettle:'Settle'});
DEF_ODDS.knight={block:.22,parry:.1,dodge:.06};
// finishers: three of the old ones, three of the wyvern's own
{ const F={
    wyToss:{name:'Seized and Flung',src:'cbHoundToss'},
    wyImmolate:{name:'Immolation',contact:2.4,victim:'kneel',keys:RAW.cerberus.cbCremation.keys,ev:[{t:.25,e:'hsSnort'}].concat(WY_FIRE(.5,5,.2,{fin:1}),[{t:1.45,e:'kill',imp:[0,3,4],spin:3,fx:'boom',shake:.3}])},
    wyInferno:{name:'Inferno',contact:2.1,keys:RAW.cerberus.cbInferno.keys,ev:[{t:.3,e:'hsSnort'},{t:.65,e:'wyFire',fin:1,big:1},{t:.66,e:'kill',imp:[0,6,9],spin:5,fx:'boom',shake:.45}]},
  };
  for(const n in F){ const d=F[n], S=d.src?CB[d.src]:null, def=S?FIN[d.src]:null, c=S?hsClip(S):{keys:JSON.parse(JSON.stringify(d.keys)),ev:d.ev.slice()};
    c.keys.forEach(k=>{ if(k.lean<-.5) k.wing=.8; });
    RAW.knight[n]=c; FIN[n]={name:d.name,clip:n,contact:d.contact||(def&&def.contact)||2,victim:d.victim||(def?def.victim:'stagger')}; FINS.knight.push(n); } }
