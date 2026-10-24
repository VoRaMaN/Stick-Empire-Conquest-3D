/* ================= Creature animation library (v0.35): the Wyvern and the Devil Bat, 100 variations =================
   Ten variations in each of five categories (idle, attack, finisher, ability, charge) for each creature, registered
   as creature.category.variant (wyvern.attack.quick_strike, devilbat.finisher.predators_pounce…) in CREATURE_ANIMS.
   Every variation is a clip of this game's own kind (data: keys over the pose channels, timed events), compiled with
   all the others in 14-aim and played through play()/updateAction, so its hits, breath and kills are the game's own
   events on the simulation's clock and nothing new deals damage. None is an authored glTF clip (the Blender models
   carry none); all are procedural: the clip moves the rig the game already had (the four-limbed rig and its flight
   for the wyvern, the stick skeleton and the Wing Archer's flight for the bat) and 27l carries that onto the model's
   bones with IK, a spring tail and articulated wings.
   Some variations are the wyvern's existing moves (54 clips since v0.24), placed where they fit (src:'existing');
   the rest are new here (src:'new'). New attacks name their phases (ph: anticipation, wind-up, execution, impact,
   recovery, in seconds); the hit lands inside execution → impact, and the test (tests/creaturetest.js) checks it.
   Gameplay: new attacks join the units' moves (damage on the usual scale, ×0.4–1.5 of the unit's damage); finishers
   go through the finisher system (canFinish decides when one is allowed); charges through updateCharge; abilities
   that exist in play (the wyvern's ten, 27f) keep their cooldowns and logic and are mapped here; the Devil Bat has no
   abilities in play, so its ten are animations with an integration point (CA_ABILITY_HOOK) and no effect. */
// ---------- the Wyvern Knight's mount (type knight, the four-limbed rig) ----------
const CA_WY={
  // new attacks: vertical strike, multi-hit combination, aerial strike, counterattack
  wyHammerNeck:{ph:[.2,.48,.62,.7,1.2],keys:[{t:0},{t:.2,neck:.3,lean:-.1,draw:.2,wing:.15},{t:.48,neck:1,lean:-.45,crouch:.08,draw:.5,wing:.35,wup:.4,tup:.6},
      {t:.62,e:'o',neck:-.9,lean:.6,draw:1,crouch:.18,fwd:.35,wup:-.2,tup:-.3},{t:.7,draw:.2,lean:.45},R_(1.2)],
    ev:[{t:.3,e:'wyRoar',mini:1},{t:.62,e:'hit',dmg:1.25,kb:2.6,bite:1}]},
  wyFuryCombo:{ph:[.08,.14,.76,.82,1.35],keys:[{t:0},{t:.14,R:[.35,.35,.35],twist:-.25,lean:-.2,wing:.3,wup:.3},{t:.26,e:'o',R:[-.05,-.3,.8],twist:.3,lean:.25,fwd:.15},
      {t:.38,L:[-.35,.35,.35],twist:.25,lean:-.15},{t:.5,e:'o',L:[.05,-.3,.8],twist:-.3,lean:.25,fwd:.3},{t:.62,lean:-.3,draw:.6,neck:.4,twist:0},
      {t:.76,e:'o',lean:.55,draw:1,neck:-.6,fwd:.45},{t:.85,draw:.2},R_(1.35)],
    ev:[{t:.26,e:'hit',dmg:.5,kb:1},{t:.5,e:'hit',dmg:.5,kb:1},{t:.76,e:'hit',dmg:.7,kb:2.2,bite:1}]},
  wyHopRake:{ph:[.18,.34,.5,.58,1.15],keys:[{t:0},{t:.18,crouch:.35,lean:-.1,wing:.5,wup:.6},{t:.34,e:'o',jump:.55,crouch:0,lean:-.35,wing:1,wup:-.5,fwd:.3,kick:.4},
      {t:.5,e:'i',jump:.35,lean:-.15,kick:1,wing:1,wup:.4,fwd:.6},{t:.58,jump:0,crouch:.3,kick:0,wing:.6,wup:-.2},R_(1.15)],
    ev:[{t:.3,e:'wyFlapSfx'},{t:.5,e:'hit',dmg:1.15,kb:3,kd:1},{t:.58,e:'land'}]},
  wyRiposte:{ph:[.14,.34,.46,.52,1.0],keys:[{t:0},{t:.14,wing:.8,wup:.5,wsw:-.4,crouch:.25,lean:-.2,twist:.2},{t:.34,wing:.7,wup:.3,lean:-.35,draw:.4,neck:.3},
      {t:.46,e:'o',wing:.2,wup:-.2,wsw:0,lean:.5,draw:1,neck:-.5,fwd:.4,twist:-.15},{t:.52,draw:.1},R_(1.0)],
    ev:[{t:.1,e:'wyRustle'},{t:.46,e:'hit',dmg:1.15,kb:2.6,bite:1}]},
  // new idles: combat ready, heavy breathing, weight shift, predatory stare, the rare ember snort
  idle_wyReady:{idle:1,keys:[{t:0},{t:.4,crouch:.2,lean:.15,neck:-.3,wing:.3,wup:.15,tup:.5,draw:.1},{t:1.0,crouch:.24,lean:.18,look:.15,twist:.08},
      {t:1.6,crouch:.2,lean:.14,look:-.12,twist:-.06},{t:2.0,crouch:.22,look:0,twist:0},R_(2.5)]},
  idle_wyBreathe:{idle:1,keys:[{t:0},{t:.5,lean:-.15,draw:.35,wup:.15,wing:.2,crouch:.05},{t:.9,lean:.05,draw:.1,wup:0},{t:1.4,lean:-.17,draw:.4,wup:.18},
      {t:1.8,lean:.05,draw:.1,wup:0},{t:2.3,lean:-.12,draw:.3,wup:.12},R_(2.8)],ev:[{t:.5,e:'hsSnort'},{t:1.4,e:'hsSnort'}]},
  idle_wyShift:{idle:1,keys:[{t:0},{t:.6,side:.28,twist:-.12,crouch:.08,tsw:-.6},{t:1.3,side:-.28,twist:.12,crouch:.08,tsw:.6},{t:1.9,side:0,twist:0,crouch:0,tsw:0},R_(2.4)]},
  idle_wyStare:{idle:1,keys:[{t:0},{t:.5,neck:-.5,lean:.25,crouch:.12,draw:.08,tup:.3},{t:1.2,tsw:.4},{t:1.5,tsw:-.3},{t:1.8,tsw:.4},{t:2.5,tsw:0},R_(3.1)]},
  idle_wyEmber:{idle:1,keys:[{t:0},{t:.5,neck:.6,lean:-.3,wing:.4,wup:.4},{t:.8,draw:.4},{t:1.0,draw:.05},{t:1.3,draw:.5},{t:1.5,draw:.05},
      {t:2.0,draw:.9,lean:-.4,wing:.8,wup:.7,tup:.8},{t:2.6,draw:.1,wing:.2,wup:0,neck:0,tup:0},R_(3.2)],
    ev:[{t:.8,e:'hsSnort'},{t:1.3,e:'hsSnort'},{t:2.0,e:'wyRoar',mini:1},{t:2.1,e:'hsSnort'}]},
  // a new ability animation: the power-up (no ability of its own in play: CA_ABILITY_HOOK)
  wyPowerUp:{keys:[{t:0},{t:.4,crouch:.3,lean:.1,wing:.3,draw:.3},{t:1.0,crouch:.1,lean:-.5,wing:1,wup:.8,neck:.8,draw:.6,tup:1},{t:1.6,wing:1,wup:.9,draw:.8},
      {t:2.0,wing:.3,wup:0,lean:0,neck:0,tup:0,draw:.1},R_(2.4)],ev:[{t:.4,e:'hsSnort'},{t:1.0,e:'wyRoar',mini:1},{t:1.0,e:'knRaise'}]},
};
// new finishers: talon, tail, wing, aerial execution, predator's pounce (contact: metres between the two at the blow)
const CA_WYF={
  wyClawExec:{name:'Talon Execution',contact:2.3,victim:'stagger',keys:[{t:0},{t:.3,lean:-.85,crouch:.05,R:[.3,.55,.25],L:[-.3,.55,.25],wing:.8,wup:.7,draw:.6,neck:.4},
      {t:.5,e:'o',lean:.45,crouch:.35,R:[.25,-.55,.75],L:[-.25,-.55,.75],wing:.5,wup:-.3,fwd:.3,draw:.2},{t:.75,lean:-.2,R:[.3,.2,.4]},{t:.95,e:'o',lean:.5,R:[.2,-.6,.8],crouch:.4,fwd:.4},{t:1.2,lean:.25},R_(1.7)],
    ev:[{t:.3,e:'wyRoar',mini:1},{t:.5,e:'knock',imp:[0,-2,2.5],part:'chest'},{t:.5,e:'land'},{t:.95,e:'stabRag',aim:['hL'],imp:[0,-6,.5],part:'chest',shake:.3}]},
  wyTailExec:{name:'Tail Impaler',contact:2.0,keys:[{t:0},{t:.35,yaw:2.6,lean:.2,crouch:.15,alt:.6,tup:.6,tsw:.4,wing:.4},{t:.55,e:'o',yaw:3.14,alt:1.3,tup:1.4,lean:.35,crouch:.2},
      {t:1.1,alt:1.4,tup:1.5,lean:.25},{t:1.35,e:'o',yaw:5.2,alt:.4,tup:.2,tsw:-1,lean:.1},{t:1.6,yaw:6.28,alt:0,tup:0,tsw:0},R_(2.1,{yaw:6.28})],
    ev:[{t:.3,e:'wyRustle'},{t:.55,e:'grab',at:'tail',part:'chest'},{t:1.35,e:'release',imp:[-6,4,-2],shake:.3}]},
  wyWingExec:{name:'Wing Guillotine',contact:2.2,keys:[{t:0},{t:.3,wing:1,wup:.9,lean:-.35,twist:-.35,R:[.5,.5,.1]},{t:.45,e:'o',wing:1,wup:-.4,twist:.3,lean:.25,fwd:.25},
      {t:.8,wing:.9,wup:.9,R:[.35,.65,.35],lean:-.4},{t:1.0,e:'o',R:[.2,-.6,.85],wup:-.6,lean:.5,crouch:.25},{t:1.3,wing:.4,wup:0},R_(1.8)],
    ev:[{t:.43,e:'wyFlapSfx'},{t:.45,e:'knock',imp:[0,1.5,5],part:'chest'},{t:.98,e:'wyFlapSfx'},{t:1.0,e:'stabRag',aim:['hR'],imp:[0,-7,.5],part:'neck',ring:1,shake:.35}]},
  wyAerialExec:{name:'Sky Rend',contact:1.9,keys:[{t:0},{t:.2,lean:-.2,crouch:.25,draw:.4},{t:.36,e:'o',lean:.4,draw:1,fwd:.4},{t:.42,draw:.3},{t:.7,crouch:.4,lean:-.3,wing:1,wup:.8},
      {t:.95,e:'o',jump:1.2,crouch:0,lean:-.5,wing:1,wup:-.6,neck:.5},{t:1.2,jump:1.5,wup:.7},{t:1.4,e:'o',jump:1.3,wup:-.6,lean:.4,neck:-.4,draw:1},{t:1.6,e:'i',jump:0,crouch:.35,wing:.5,wup:0},R_(2.2)],
    ev:[{t:.38,e:'grab',at:'jaw',part:'neck'},{t:.95,e:'wyFlapSfx'},{t:1.4,e:'wyFlapSfx'},{t:1.42,e:'release',imp:[0,-14,3],slam:1,shake:.4},{t:1.6,e:'land'}]},
  wyPounce:{name:"Predator's Pounce",contact:2.1,keys:[{t:0,crouch:.2},{t:.3,crouch:.5,lean:.25,neck:-.6,tup:.6},{t:.5,e:'o',jump:.7,fwd:1.2,crouch:0,lean:-.25,R:[.3,.2,.6],L:[-.3,.2,.6],wing:.8,wup:.4},
      {t:.68,e:'i',jump:0,fwd:1.8,crouch:.45,lean:.45,R:[.25,-.55,.8],L:[-.25,-.55,.8],wing:.6,wup:-.2},{t:.95,draw:1,lean:.3,neck:.3},{t:1.12,e:'o',lean:.75,draw:0,neck:-.8},
      {t:1.3,draw:.6},{t:1.42,e:'o',draw:0,lean:.8},{t:1.7,lean:.2,neck:0},R_(2.2)],
    ev:[{t:.68,e:'knock',imp:[0,1,3],part:'chest'},{t:.68,e:'land'},{t:1.12,e:'stabRag',aim:['head'],imp:[0,-1.5,.5],part:'chest'},{t:1.42,e:'stabRag',aim:['head'],imp:[0,2,.5],part:'neck',shake:.2}]},
};
// new charges (run = the pose carried at a sprint, then the strike): aggressive rush, wing-assisted, low profile,
// roaring, aerial, interrupted (a pull-up: no strike), signature (a flame snap)
const CA_WYC=[
  ['wyRush','Aggressive Rush',{lean:.4,crouch:.12,neck:-.5,draw:.3,tup:.4},[{t:.1,lean:-.1,draw:.8,neck:0},{t:.24,e:'o',lean:.6,draw:1,neck:-.7,fwd:.8},{t:.32,draw:.2},R_(.85)],
    [{t:.24,e:'hit',dmg:1.35,kb:4,bite:1}]],
  ['wyWingChg','Wing-Assisted Charge',{lean:.3,wing:.7,wup:.2,wsw:.5,crouch:.05},[{t:.12,wing:1,wup:.9,jump:.25,lean:-.2},{t:.28,e:'o',wing:1,wup:-.6,jump:0,lean:.4,fwd:.7},{t:.4,wing:.5},R_(.9)],
    [{t:.26,e:'wyFlapSfx'},{t:.28,e:'hit',arc:1.3,dmg:1.2,kb:4.5}],{anim:(w,r)=>({wup:.2+.6*Math.sin(w*9)})}],
  ['wyLowChg','Low-Profile Charge',{crouch:.35,lean:.35,neck:-.8,wing:.1,tup:-.3},[{t:.1,crouch:.4,neck:-.9},{t:.22,e:'o',crouch:0,lean:-.3,neck:.5,jump:.3,draw:1,fwd:.6},{t:.36,jump:0,draw:.2,lean:.1},R_(.9)],
    [{t:.22,e:'hit',dmg:1.3,kb:3,up:4,bite:1}]],
  ['wyRoarChg','Roaring Charge',{lean:.2,neck:.5,draw:.9,wing:.4,wup:.4},[{t:.15,lean:-.5,draw:1,neck:.8,wing:.8,wup:.7},{t:.32,e:'o',lean:.55,neck:-.6,fwd:.6,wing:.3,wup:-.2},{t:.45,draw:.3},R_(1.0)],
    [{t:.1,e:'wyRoar'},{t:.32,e:'hit',dmg:1.3,kb:3.5,bite:1}],{anim:(w,r)=>({draw:.6+.4*Math.abs(Math.sin(w*4))})}],
  ['wyAerialChg','Aerial Charge',{lean:.25,wing:.8,wsw:.6,crouch:.05},[{t:.1,jump:.6,wing:1,wup:.8,lean:-.2,kick:.5},{t:.26,e:'i',jump:.2,wup:-.5,kick:1,lean:.2,fwd:.6},{t:.36,jump:0,kick:0,crouch:.3},R_(.95)],
    [{t:.08,e:'wyFlapSfx'},{t:.26,e:'hit',dmg:1.3,kb:3.6,kd:1},{t:.36,e:'land'}],{anim:(w,r)=>({jump:Math.max(0,Math.sin(w*5))*.3,wup:Math.cos(w*5)*.6})}],
  ['wyHalt','Interrupted Charge',{lean:.3,crouch:.1},[{t:.12,lean:-.45,crouch:.25,wing:.9,wup:.6,wsw:-.5,fwd:.25},{t:.4,lean:-.25,crouch:.15,wing:.5,wup:.2,fwd:.35},{t:.7,lean:0,crouch:0,wing:.1,wup:0,wsw:0,fwd:.35},R_(1.0)],
    [{t:.12,e:'wyFlapSfx'},{t:.3,e:'land'}],{halt:1}],
  ['wySigChg','Flame-Snap Charge',{lean:.3,draw:.7,neck:-.2,wing:.3},[{t:.1,draw:1,lean:-.2,neck:.2},{t:.3,e:'o',lean:.45,neck:-.4,fwd:.6,draw:1},{t:.5,draw:.3},R_(1.0)],
    [{t:.05,e:'hsSnort'},{t:.14,e:'wyFire'},{t:.3,e:'hit',dmg:1.1,kb:3,bite:1}]],
];
Object.assign(RAW.knight,CA_WY);
for(const n in CA_WYF){ const d=CA_WYF[n]; RAW.knight[n]={keys:d.keys,ev:d.ev}; FIN[n]={name:d.name,clip:n,contact:d.contact,victim:d.victim}; FINS.knight.push(n); }
for(const [id,name,run,keys,ev,o] of CA_WYC){ CHG.knight.push(Object.assign({id,name,run,keys:[Object.assign({t:0},run)].concat(keys),ev},o||{})); const c=CHG.knight[CHG.knight.length-1];
  RAW.knight['chg_'+id]={keys:c.keys,ev:c.ev,atk:1}; }
TYPES.knight.attacks.push('wyHammerNeck','wyFuryCombo','wyHopRake','wyRiposte');
IDLES.knight.push('idle_wyReady','idle_wyBreathe','idle_wyShift','idle_wyStare','idle_wyEmber');
Object.assign(MOVE_NAMES,{wyHammerNeck:'Hammer Neck',wyFuryCombo:'Fury Combination',wyHopRake:'Hop and Rake',wyRiposte:'Wing Riposte',wyPowerUp:'Ember Rise'});
Object.assign(IDLE_NAMES,{wyReady:'Combat Ready',wyBreathe:'Heavy Breathing',wyShift:'Weight Shift',wyStare:"Predator's Stare",wyEmber:'Ember Snort'});

// ---------- the Devil Bat (type bat, the stick skeleton in flight; alt = height of the hips while the clip plays) ----------
const CA_BT={
  // new attacks: quick, heavy, forward lunge, multi-hit frenzy, aerial talon drop, counterattack, the signature screech rake
  btQuickSwipe:{alt:1,ph:[.06,.12,.24,.28,.75],keys:[RA(0),{t:.12,alt:1.6,lean:.3,...BT.SLASHRW},{t:.24,e:'o',alt:1.3,lean:.5,fwd:.5,...BT.SLASHR},{t:.4,alt:1.9},RA(.75)],
    ev:[{t:.24,e:'hit',dmg:.8,kb:1.4},{t:.25,e:'batRake'}]},
  btHammer:{alt:1,ph:[.3,.55,.72,.82,1.5],keys:[RA(0),{t:.3,alt:2.6,lean:-.3,...BT.HIGH,wing:.6,wup:.6},{t:.55,alt:2.9,lean:-.45,R:[.3,.95,-.1],L:[-.3,.95,-.1],wR:[0,1,-.3],wL:[0,1,-.3],draw:.6},
      {t:.72,e:'o',alt:1.05,lean:.8,fwd:.6,R:[.2,-.6,.8],L:[-.2,-.6,.8],wR:[0,-.9,.4],wL:[0,-.9,.4],draw:1},{t:.82,alt:1.1,draw:.2},{t:1.1,alt:2.2,...BT.REST,wing:0},RA(1.5)],
    ev:[{t:.5,e:'batScreech',mini:1},{t:.72,e:'hit',dmg:1.45,kb:3.2,kd:1},{t:.73,e:'batRake'}]},
  btLunge:{alt:1,ph:[.1,.2,.38,.5,1.15],keys:[RA(0),{t:.2,alt:CRUISE+.3,lean:-.2,wup:.8,...BT.WIDE},{t:.38,e:'o',alt:1.35,lean:.7,fwd:1.5,wup:-.6,...BT.RAKE},{t:.5,alt:1.4,fwd:1.7},
      {t:.8,alt:2.4,lean:.15,wup:0,...BT.REST},RA(1.15)],ev:[{t:.36,e:'wyFlapSfx'},{t:.38,e:'hit',dmg:1.15,kb:2.8},{t:.39,e:'batRake'}]},
  btFrenzy:{alt:1,ph:[.06,.12,.78,.84,1.35],keys:[RA(0),{t:.12,alt:1.6,lean:.35,fwd:.3,...BT.SLASHRW},{t:.22,e:'o',...BT.SLASHR,alt:1.4,fwd:.45},{t:.3,...BT.SLASHLW},{t:.4,e:'o',...BT.SLASHL,fwd:.55},
      {t:.48,...BT.SLASHRW},{t:.58,e:'o',...BT.SLASHR,lean:.5,fwd:.62},{t:.66,...BT.SLASHLW},{t:.78,e:'o',...BT.SLASHL,lean:.55,fwd:.75},{t:1.0,alt:2.2,...BT.REST},RA(1.35)],
    ev:[{t:.22,e:'hit',dmg:.4,kb:.6},{t:.23,e:'batRake'},{t:.4,e:'hit',dmg:.4,kb:.6},{t:.41,e:'batRake'},{t:.58,e:'hit',dmg:.4,kb:.6},{t:.59,e:'batRake'},{t:.78,e:'hit',dmg:.6,kb:2},{t:.79,e:'batRake'}]},
  btTalonDrop:{alt:1,ph:[.3,.5,.66,.74,1.35],keys:[RA(0),{t:.3,alt:CRUISE+1.4,lean:-.3,wup:.6},{t:.5,alt:CRUISE+1.5,lean:-.5,kick:.3},{t:.66,e:'i',alt:1.1,lean:-.35,kick:1,fwd:.4,wup:.9},
      {t:.74,alt:1.15,kick:.6},{t:1.0,alt:2.4,kick:0,lean:.1,wup:0},RA(1.35)],ev:[{t:.3,e:'batScreech',mini:1},{t:.66,e:'hit',dmg:1.3,kb:3.4,kd:1}]},
  btRiposte:{alt:1,ph:[.15,.4,.52,.62,1.2],keys:[RA(0),{t:.15,alt:CRUISE,lean:-.25,R:[.2,.2,.45],L:[-.2,.2,.45],wR:[0,1,.2],wL:[0,1,.2],wing:.6,crouch:.1},{t:.4,lean:-.35,side:.2,twist:-.3},
      {t:.52,e:'o',alt:1.4,lean:.55,fwd:.6,twist:.35,...BT.SLASHR,L:[-.4,.1,.3],wing:0},{t:.62,alt:1.5},{t:.9,alt:2.4,...BT.REST,twist:0,side:0},RA(1.2)],
    ev:[{t:.52,e:'hit',dmg:1.1,kb:2.4},{t:.53,e:'batRake'}]},
  btScreechRake:{alt:1,ph:[.25,.9,1.05,1.15,1.75],keys:[RA(0),{t:.25,alt:CRUISE+.4,lean:-.45,draw:1,...BT.WIDE,wup:.7},{t:.75,draw:1,lean:-.4},{t:.9,draw:.2,alt:2.4},
      {t:1.05,e:'o',alt:1.25,lean:.7,fwd:.9,...BT.RAKE,draw:.8,wup:0},{t:1.15,alt:1.3},{t:1.4,alt:2.4,...BT.REST,draw:0},RA(1.75)],
    ev:[{t:.25,e:'batScreech',mini:1},{t:1.05,e:'hit',dmg:1.3,kb:2.8},{t:1.06,e:'batRake'}]},
  // new idles (the bat idles hovering): ready, panting, scan, wing adjustment, weight shift, stare, rest, the rare barrel roll
  idle_btReady:{idle:1,keys:[RA(0),{t:.4,lean:.4,R:[.4,.1,.35],L:[-.4,.1,.35],wR:[0,.4,1],wL:[0,.4,1],draw:.15,tup:.4},{t:1.2,R:[.42,.14,.38],L:[-.38,.08,.33],twist:.1},
      {t:1.9,R:[.38,.08,.33],L:[-.42,.14,.38],twist:-.1},RA(2.5)]},
  idle_btPant:{idle:1,keys:[RA(0),{t:.4,lean:.1,draw:.5,wup:.25},{t:.8,lean:.32,draw:.1,wup:-.1},{t:1.2,lean:.08,draw:.55,wup:.28},{t:1.6,lean:.32,draw:.1,wup:-.1},{t:2.0,lean:.1,draw:.5,wup:.2},RA(2.5)]},
  idle_btScan:{idle:1,keys:[RA(0),{t:.6,look:-.9,twist:-.2},{t:1.3,look:-.9},{t:2.0,look:.9,twist:.2},{t:2.7,look:.9},{t:3.1,look:0,twist:0},RA(3.4)]},
  idle_btWingFix:{idle:1,keys:[RA(0),{t:.5,wup:.9,wsw:-.5,side:.25},{t:1.0,wup:-.3,wsw:.8,side:-.15},{t:1.5,wup:.5,wsw:0,side:0},{t:2.0,wup:0},RA(2.3)],ev:[{t:.5,e:'wyRustle'},{t:1.0,e:'wyRustle'}]},
  idle_btShift:{idle:1,keys:[RA(0),{t:.6,side:.4,twist:-.25,tsw:-.6,lean:.2},{t:1.4,side:-.4,twist:.25,tsw:.6},{t:2.0,side:0,twist:0,tsw:0},RA(2.5)]},
  idle_btStare:{idle:1,keys:[RA(0),{t:.5,lean:.55,look:0,draw:.05,R:[.3,-.3,.5],L:[-.3,-.3,.5],wR:[0,-.4,1],wL:[0,-.4,1]},{t:2.2,lean:.58,R:[.32,-.28,.55]},RA(2.9)]},
  idle_btRest:{idle:1,keys:[RA(0),{t:.7,lean:-.1,crouch:.2,...BT.REST,draw:.2,tup:-.5,wup:-.3},{t:2.0,lean:-.05,crouch:.18},{t:2.6,lean:.35,crouch:0,tup:.3,wup:.2},RA(3.1)]},
  idle_btRoll:{idle:1,keys:[RA(0),{t:.3,lean:-.2,wup:.8},{t:.9,e:'l',yaw:6.28,side:.6,wsw:.8},{t:1.2,side:0,wsw:0},{t:1.5,draw:1,lean:-.3},{t:1.9,draw:0},RA(2.3,{yaw:6.28})],ev:[{t:1.5,e:'batScreech',mini:1}]},
  // ability animations (the Devil Bat has no abilities in play: these have no effect but sight and sound)
  btPowerUp:{keys:[RA(0),{t:.4,crouch:.2,lean:.3,R:[.2,0,.3],L:[-.2,0,.3],wR:[0,1,0],wL:[0,1,0]},{t:1.0,lean:-.5,...BT.WIDE,wup:.9,draw:1},{t:1.5,draw:.6},RA(2.0)],ev:[{t:1.0,e:'batScreech',mini:1}]},
  btSoulLance:{keys:[RA(0),{t:.4,lean:-.3,R:[.15,.3,.1],L:[-.15,.3,.1],wR:[0,.3,1],wL:[0,.3,1],wup:.6},{t:.8,R:[.08,.2,.05],L:[-.08,.2,.05]},{t:.95,e:'o',lean:.6,R:[.06,0,.95],L:[-.06,0,.95],wR:[0,0,1],wL:[0,0,1],wup:-.3},{t:1.15},RA(1.6)]},
  btWhirl:{keys:[RA(0),{t:.3,lean:-.1,...BT.WIDE,crouch:.1},{t:.9,e:'l',yaw:6.28,...BT.WIDE,lean:.2,wup:.5},{t:1.1,yaw:6.28},RA(1.5,{yaw:6.28})],ev:[{t:.5,e:'wyRustle'}]},
  btWingShield:{keys:[RA(0),{t:.2,lean:-.3,crouch:.15,R:[.12,.35,.3],L:[-.12,.35,.3],wR:[0,1,.2],wL:[0,1,.2],wing:1,side:.2},{t:1.1,side:-.1},RA(1.5)]},
  btSkyDive:{alt:1,keys:[RA(0),{t:.6,alt:CRUISE+3,lean:-.4,wup:.6},{t:1.2,alt:CRUISE+3.2,lean:.6},{t:1.6,e:'i',alt:CRUISE+.5,lean:.7,wup:.9},{t:2.0,alt:CRUISE,lean:.2,wup:0},RA(2.4)],ev:[{t:1.2,e:'batScreech',mini:1}]},
  btHowl:{keys:[RA(0),{t:.35,lean:-.45,...BT.WIDE,wup:.7,draw:1},{t:1.3,draw:1,lean:-.5},{t:1.6,draw:.1},RA(2.0)],ev:[{t:.35,e:'batScreech',mini:1}]},
  btWingBurst:{keys:[RA(0),{t:.35,wup:1,lean:-.2,crouch:.1},{t:.5,e:'o',wup:-.9,lean:.2},{t:.7,wup:.8},{t:.85,e:'o',wup:-.9},{t:1.1,wup:0},RA(1.4)],ev:[{t:.5,e:'wyFlapSfx'},{t:.85,e:'wyFlapSfx'}]},
  btDart:{keys:[RA(0),{t:.15,side:-.4,crouch:.1},{t:.35,e:'o',side:.7,twist:.3,lean:.4},{t:.6,side:0,twist:0},RA(.9)]},
  btSoulDrain:{keys:[RA(0),{t:.4,lean:.5,R:[.6,-.2,.5],L:[-.6,-.2,.5],wR:[0,-.5,1],wL:[0,-.5,1],draw:.7},{t:1.6,draw:.9,lean:.55},{t:2.0,draw:0},RA(2.4)]},
  btApocalypse:{alt:1,keys:[RA(0),{t:.5,alt:CRUISE+2.5,lean:-.4,...BT.WIDE,wup:.8},{t:1.0,draw:1,lean:-.6},{t:1.6,e:'l',yaw:6.28,draw:.4},{t:2.0,e:'i',alt:1.4,lean:.8,...BT.RAKE,wup:0},{t:2.3,alt:2.0},RA(2.8,{yaw:6.28})],
    ev:[{t:1.0,e:'batScreech',mini:1},{t:2.0,e:'batRake'}]},
};
const CA_BTF={
  btCrushExec:{name:'Crushing Talons',contact:1.0,victim:'kneel',keys:[RA(0),{t:.35,alt:2.4,lean:-.3,...BT.HIGH},{t:.55,e:'o',alt:1.1,lean:.75,R:[.2,-.65,.75],L:[-.2,-.65,.75],wR:[0,-1,.3],wL:[0,-1,.3],fwd:.3},
      {t:.8,alt:1.0,lean:.8},{t:1.0,e:'o',alt:.95,R:[.18,-.75,.7],L:[-.18,-.75,.7]},{t:1.3,alt:2.2,...BT.REST,lean:.2},RA(1.7)],
    ev:[{t:.55,e:'knock',imp:[0,-3,1],part:'chest'},{t:.56,e:'batRake'},{t:1.0,e:'stabRag',aim:['hL'],imp:[0,-8,0],part:'chest',ring:1,shake:.3}]},
  btBiteExec:{name:'Throat Bite',contact:.95,keys:[RA(0),{t:.4,alt:1.4,lean:.5,...BT.RAKE},{t:.5,e:'o',alt:1.3,L:[-.05,-.25,.45],R:[.25,-.2,.45]},{t:.75,draw:1,lean:.7},{t:.9,e:'o',draw:0,lean:.85},
      {t:1.05,draw:1},{t:1.2,e:'o',draw:0},{t:1.5,alt:2.2,L:[-.3,-.1,.4]},RA(1.9)],
    ev:[{t:.5,e:'grab',at:'hL',part:'chest'},{t:.9,e:'stabRag',aim:['head'],imp:[0,-1,.5],part:'neck'},{t:1.2,e:'stabRag',aim:['head'],imp:[0,1,.5],part:'neck'},{t:1.5,e:'release',imp:[0,-2,2]}]},
  btClawExec:{name:'Crossed Claws',contact:1.1,victim:'kneel',keys:[RA(0),{t:.4,alt:1.5,...BT.SLASHRW,...BT.SLASHLW,lean:-.1},{t:.58,e:'o',alt:1.35,...BT.SLASHR,...BT.SLASHL,lean:.6,fwd:.3},{t:.8,alt:1.8},RA(1.3)],
    ev:[{t:.58,e:'kill',imp:[0,1.5,2],decap:true,headImp:[0,4,-1],part:'neck',shake:.25},{t:.59,e:'batRake'}]},
  btTailExec:{name:'Tail Trip',contact:1.0,keys:[RA(0),{t:.3,alt:1.6,yaw:2.8,tsw:-1,tup:.5,lean:.2},{t:.45,e:'o',yaw:3.6,tsw:1.2,lean:.3},{t:.7,yaw:6.28,tsw:0,alt:1.3,...BT.HIGH},
      {t:.95,e:'o',alt:1.0,lean:.8,...BT.RAKE,R:[.22,-.7,.7],L:[-.22,-.7,.7]},{t:1.3,alt:2.2,...BT.REST},RA(1.7,{yaw:6.28})],
    ev:[{t:.45,e:'knock',imp:[2,1,-.5],part:'thigh'},{t:.95,e:'stabRag',aim:['hL'],imp:[0,-6,0],part:'chest',shake:.25}]},
  btWingExec:{name:'Wing Edge',contact:1.3,keys:[RA(0),{t:.35,alt:1.7,wup:1,lean:-.2,side:-.5,...BT.WIDE},{t:.5,e:'o',alt:1.45,wup:-.9,side:.6,fwd:.5,lean:.4},{t:.8,alt:2.3,side:0,wup:0},RA(1.2)],
    ev:[{t:.48,e:'wyFlapSfx'},{t:.5,e:'kill',imp:[5,2,3],spin:5,part:'chest',shake:.2}]},
  btAerialExec:{name:'Carried Off',contact:.95,keys:[RA(0),{t:.45,alt:1.25,lean:.35,L:[-.1,-.1,.5],wL:[0,0,1],R:[.1,-.1,.5],wR:[0,0,1]},{t:.55,e:'o',alt:1.2,L:[-.05,-.25,.45]},
      {t:1.8,alt:7,lean:-.1,L:[-.08,-.3,.3]},{t:2.0,e:'o',L:[-.25,-.1,.4]},{t:2.4,...BT.REST},RA(2.8)],
    ev:[{t:.55,e:'grab',at:'hL',part:'chest'},{t:1.2,e:'batScreech',mini:1},{t:2.0,e:'release',imp:[0,-4,1],shake:.1}]},
  btSlam:{name:'Grave Slam',contact:.95,keys:[RA(0),{t:.4,alt:1.25,...BT.RAKE},{t:.5,e:'o',alt:1.2,L:[-.05,-.25,.45]},{t:1.0,alt:3.5,lean:-.2,L:[-.1,.3,.2]},{t:1.2,e:'o',alt:1.4,lean:.8,L:[-.1,-.6,.6]},
      {t:1.5,alt:2.2,...BT.REST},RA(1.9)],ev:[{t:.5,e:'grab',at:'hL',part:'chest'},{t:1.2,e:'release',imp:[0,-16,2],slam:1,shake:.4}]},
  btPounce:{name:"Predator's Pounce",contact:.8,keys:[RA(0),{t:.3,alt:CRUISE+.8,lean:-.4,kick:.3},{t:.5,e:'i',alt:1.0,lean:-.2,kick:1,fwd:.5},{t:.75,alt:.95,lean:.75,kick:.2,...BT.RAKE,draw:1},
      {t:.95,e:'o',draw:0,lean:.85},{t:1.15,draw:1},{t:1.3,e:'o',draw:0},{t:1.6,alt:2.3,...BT.REST,kick:0},RA(2.0)],
    ev:[{t:.5,e:'knock',imp:[0,1,3],part:'chest'},{t:.95,e:'stabRag',aim:['head'],imp:[0,-1,.5],part:'neck'},{t:1.3,e:'stabRag',aim:['head'],imp:[0,1.5,.3],part:'neck',shake:.2}]},
  btSigExec:{name:'Screech and Rip',contact:1.0,victim:'kneel',keys:[RA(0),{t:.4,alt:1.7,lean:-.4,draw:1,...BT.WIDE},{t:1.0,draw:1},{t:1.2,draw:.2,lean:.3},{t:1.4,e:'o',alt:1.35,lean:.6,R:[.1,-.3,.7],wR:[0,-.3,1],fwd:.3},
      {t:1.6,R:[.3,0,.2],lean:.1},{t:2.0,alt:2.3,...BT.REST},RA(2.4)],
    ev:[{t:.4,e:'batScreech',mini:1},{t:.45,e:'jolt',mag:1.5,part:'head'},{t:1.4,e:'kill',imp:[0,1,-1.5],part:'chest',shake:.3}]},
  btEmbrace:{name:"Demon's Embrace",contact:.95,victim:'kneel',keys:[RA(0),{t:.4,alt:1.4,lean:.4,R:[.25,0,.4],L:[-.25,0,.4],wing:1},{t:.55,e:'o',alt:1.3,R:[.1,-.1,.3],L:[-.1,-.1,.3]},{t:1.4,alt:4.5,e:'l',yaw:6.28,lean:-.1},
      {t:1.6,draw:1},{t:1.75,e:'o',draw:0},{t:2.0,R:[.4,.2,.5],L:[-.4,.2,.5],wing:0},{t:2.4,...BT.REST},RA(2.9,{yaw:6.28})],
    ev:[{t:.55,e:'grab',at:'hL',part:'chest'},{t:1.75,e:'stabRag',aim:['head'],imp:[0,1,0],part:'neck'},{t:2.0,e:'release',imp:[0,-6,4],shake:.2}]},
};
const CA_BTC=[
  ['btShortChg','Short Charge',{lean:.5,R:[.5,-.3,-.3],L:[-.5,-.3,-.3]},[{t:.1,alt:1.6,lean:.4},{t:.2,e:'o',alt:1.3,...BT.SLASHR,fwd:.5},{t:.4,alt:2},RA(.75)],[{t:.2,e:'hit',dmg:1.1,kb:2},{t:.21,e:'batRake'}]],
  ['btHeavyChg','Heavy Charge',{lean:.35,R:[.3,.9,-.1],L:[-.3,.9,-.1],wR:[0,1,-.2],wL:[0,1,-.2]},[{t:.15,alt:2.4,lean:-.3},{t:.32,e:'o',alt:1.05,lean:.8,R:[.2,-.6,.8],L:[-.2,-.6,.8],wR:[0,-.9,.4],wL:[0,-.9,.4],fwd:.6},
      {t:.45,alt:1.2},{t:.7,alt:2.2,...BT.REST},RA(1.0)],[{t:.32,e:'hit',dmg:1.5,kb:3.4,kd:1},{t:.33,e:'batRake'}]],
  ['btRushChg','Aggressive Rush',{lean:.75,R:[.35,-.5,.4],L:[-.35,-.5,.4],wR:[0,-.6,.8],wL:[0,-.6,.8],draw:.5},[{t:.12,alt:1.4,lean:.8},{t:.24,e:'o',alt:1.25,...BT.RAKE,fwd:.8},{t:.4,alt:2.2},RA(.8)],
    [{t:.24,e:'hit',dmg:1.35,kb:3},{t:.25,e:'batRake'}]],
  ['btWingChg','Wing-Assisted Charge',{lean:.5,wup:.4},[{t:.1,alt:CRUISE+.6,wup:1,lean:-.2},{t:.28,e:'o',alt:1.3,wup:-.9,lean:.7,fwd:.9,...BT.RAKE},{t:.42,alt:1.5,wup:0},RA(.9)],
    [{t:.27,e:'wyFlapSfx'},{t:.28,e:'hit',arc:1.2,dmg:1.2,kb:3.5}],{anim:(w,r)=>({wup:.6*Math.sin(w*10)})}],
  ['btLowChg','Low-Profile Charge',{lean:.6,crouch:.2,R:[.3,-.6,-.2],L:[-.3,-.6,-.2]},[{t:.1,alt:1.0,lean:.4},{t:.26,e:'o',alt:1.6,lean:-.3,R:[.25,.5,.6],L:[-.25,.5,.6],wR:[0,.8,.6],wL:[0,.8,.6],fwd:.5},{t:.45,alt:2.4},RA(.85)],
    [{t:.26,e:'hit',dmg:1.25,kb:2.6,up:3}]],
  ['btRoarChg','Roaring Charge',{lean:.3,draw:1,...BT.WIDE},[{t:.15,draw:1,lean:-.3,alt:2.6},{t:.32,e:'o',alt:1.25,lean:.7,fwd:.6,...BT.RAKE,draw:.6},{t:.5,alt:2,draw:0},RA(.95)],
    [{t:.05,e:'batScreech',mini:1},{t:.32,e:'hit',dmg:1.3,kb:2.8},{t:.33,e:'batRake'}]],
  ['btAerialChg','Aerial Charge',{lean:.2,wsw:.8,R:[.4,-.5,-.3],L:[-.4,-.5,-.3]},[{t:.15,alt:CRUISE+1.2,lean:-.2},{t:.38,e:'i',alt:1.1,lean:-.3,kick:1,fwd:.6},{t:.5,alt:1.3,kick:.4},{t:.75,alt:2.4,kick:0},RA(1.05)],
    [{t:.38,e:'hit',dmg:1.35,kb:3.4,kd:1}]],
  ['btLockChg','Target-Locked Charge',{lean:.45,R:[.25,0,.55],L:[-.25,0,.55],wR:[0,0,1],wL:[0,0,1]},[{t:.1,alt:1.5},{t:.22,e:'o',alt:1.3,...BT.RAKE,fwd:.7},{t:.36,alt:1.8},RA(.8)],
    [{t:.22,e:'hit',dmg:1.3,kb:2.6},{t:.23,e:'batRake'}]],
  ['btHalt','Interrupted Charge',{lean:.4},[{t:.15,alt:CRUISE+.4,lean:-.5,...BT.WIDE,wup:.9,fwd:.3},{t:.45,lean:-.2,wup:.2,fwd:.4},{t:.7,lean:0,...BT.REST,wup:0},RA(1.0)],[{t:.15,e:'wyFlapSfx'}],{halt:1}],
  ['btSigChg','Corkscrew Dive',{lean:.4,...BT.WIDE},[{t:.12,alt:2.8,lean:.2},{t:.4,e:'l',yaw:6.28,alt:1.3,lean:.7,fwd:.8,...BT.RAKE},{t:.5,alt:1.4},{t:.75,alt:2.3},RA(1.05,{yaw:6.28})],
    [{t:.4,e:'hit',arc:1,dmg:1.4,kb:3},{t:.41,e:'batRake'}]],
];
// the bat's own attacks fly down to their prey: the clips always carried target heights, but without the flag that
// tells the flight to follow them the bat raked from cruising height (v0.33); now they dive as written
for(const n of ['btDiveRake','btSwoop','btTwinSlash','btGrab']) RAW.bat[n].alt=1;
Object.assign(RAW.bat,CA_BT);
FINS.bat=[]; for(const n in CA_BTF){ const d=CA_BTF[n]; RAW.bat[n]={keys:d.keys,ev:d.ev,alt:1}; FIN[n]={name:d.name,clip:n,contact:d.contact,victim:d.victim}; FINS.bat.push(n); }
CHG.bat=[]; for(const [id,name,run,keys,ev,o] of CA_BTC){ const c=Object.assign({id,name,run,keys:[Object.assign({t:0,alt:CRUISE},run)].concat(keys),ev},o||{}); CHG.bat.push(c);
  RAW.bat['chg_'+id]={keys:c.keys,ev:c.ev,atk:1,alt:1}; }
TYPES.bat.attacks=['btDiveRake','btSwoop','btTwinSlash','btGrab','btQuickSwipe','btHammer','btLunge','btFrenzy','btTalonDrop','btRiposte','btScreechRake'];
IDLES.bat=['idle_btScreech','idle_btClaws','idle_btReady','idle_btPant','idle_btScan','idle_btWingFix','idle_btShift','idle_btStare','idle_btRest','idle_btRoll'];
Object.assign(MOVE_NAMES,{btQuickSwipe:'Quick Swipe',btHammer:'Hammer Claws',btLunge:'Wing Lunge',btFrenzy:'Frenzy',btTalonDrop:'Talon Drop',btRiposte:'Wing Riposte',btScreechRake:'Screech and Rake',
  btPowerUp:'Dark Surge',btSoulLance:'Soul Lance',btWhirl:'Whirlwind',btWingShield:'Wing Shroud',btSkyDive:'Sky Dive',btHowl:'Howl',btWingBurst:'Wing Burst',btDart:'Dart',btSoulDrain:'Soul Drain',btApocalypse:'Night Apocalypse'});
Object.assign(IDLE_NAMES,{btReady:'Combat Ready',btPant:'Heavy Breathing',btScan:'Scan the Field',btWingFix:'Wing Adjustment',btShift:'Weight Shift',btStare:"Predator's Stare",btRest:'Resting',btRoll:'Barrel Roll'});
TYPES.knight.cAnim='wyvern'; TYPES.bat.cAnim='devilbat';
// the channels a creature's charge carries at a sprint (beyond lean, crouch, twist): wings, neck, tail, jaw
const CA_RUN_CR=['lean','crouch','draw','alt','side','look','twist','wing','wup','wsw','neck','tup','tsw','jump'], CA_RUN_ST=['draw','look','side','wing','wup','wsw','tup','tsw'];

/* ---------- the registry: creature.category.variant ---------- */
// prio: what may cut what (a clip may replace the one playing only at the same or a higher priority; an idle
// replaces only an idle; a finisher runs to its end; death cancels everything). root: 'clip' (the clip's fwd keys move
// the unit through updateAction, the movement system's own channel), 'none' (in place), 'flight' (the clip sets the
// flight's height, alt keys). ik: 'ground' (feet planted by IK), 'air' (no ground IK), 'mixed'.
const CA_PRIO={idle:0,flight:2,reaction:2,charge:3,attack:3,ability:4,finisher:5};
const CREATURE_ANIMS={}, CA_BY_CLIP={knight:{},bat:{}};
const CA_ABILITY_HOOK={};   // id → function(u): the gameplay a bat ability (or the wyvern's power-up) would trigger when it exists
function caReg(creature,cat,variant,clip,o){ o=o||{}; const type=creature==='wyvern'?'knight':'bat', id=creature+'.'+cat+'.'+variant;
  const d=CREATURE_ANIMS[id]={id,creature,type,cat,variant,clip,src:o.src||'new',kind:'procedural',ability:o.ability||null,weight:o.weight||1,cooldown:o.cd||(cat==='idle'?10:0),
    prio:CA_PRIO[cat],interrupt:cat==='finisher'?'death only':cat==='ability'?'death, finisher':cat==='idle'?'anything':'death, finisher, ability, hard reactions',
    root:o.root||(type==='bat'?'flight':'clip'),ik:o.ik||(type==='bat'?'air':'ground'),blendIn:.12,blendOut:.26,ph:o.ph||null,desc:o.desc||''};
  CA_BY_CLIP[type][clip]=d; return d; }
// the Wyvern
for(const [v,c,s,w] of [['combat_ready','idle_wyReady'],['heavy_breathing','idle_wyBreathe'],['head_scan','idle_wyLook',1],['wing_adjustment','idle_wyStretch',1],['aggressive_display','idle_wyRoar',1],
  ['tail_limb_motion','idle_wyTailFlick',1],['weight_shift','idle_wyShift'],['predatory_stare','idle_wyStare'],['resting_recovery','idle_wySettle',1],['rare_signature','idle_wyEmber',0,.2]])
  caReg('wyvern','idle',v,c,{src:s?'existing':'new',weight:w||1,cd:w?45:12});
for(const [v,c,s] of [['quick_strike','wyBite',1],['heavy_strike','wyRearStomp',1],['forward_lunge','wyCrushLeap',1],['sweeping_strike','wySpinSweep',1],['vertical_strike','wyHammerNeck'],
  ['multi_hit_combo','wyFuryCombo'],['aerial_strike','wyHopRake'],['counterattack','wyRiposte'],['close_range_execution','wySnapShake',1],['signature_attack','wyWingBuffet',1]])
  caReg('wyvern','attack',v,c,{src:s?'existing':'new',ph:CA_WY[c]&&CA_WY[c].ph,ik:c==='wyHopRake'||c==='wyCrushLeap'?'mixed':'ground'});
for(const [v,c,s,w] of [['crushing_execution','knRideDown',1],['bite_execution','wyToss',1],['claw_execution','wyClawExec'],['tail_execution','wyTailExec'],['wing_execution','wyWingExec'],
  ['aerial_execution','wyAerialExec'],['heavy_slam','knTrample',1],['predators_pounce','wyPounce'],['signature_execution','wyImmolate',1],['rare_finisher','wyInferno',1,.3]])
  caReg('wyvern','finisher',v,c,{src:s?'existing':'new',weight:w||1,ik:c==='wyAerialExec'||c==='wyPounce'?'mixed':'ground'});
for(const [v,c,ab] of [['power_up','wyPowerUp',null],['special_attack','wyBreath','breath'],['area_attack','knJudgment','judge'],['defensive_response','knShield','shield'],['airborne_ability','wyAssaultLoop','assault'],
  ['roar_intimidation','wyScreech','screech'],['wing_burst','wyStorm','storm'],['mobility_ability','knPursuit','pursuit'],['signature_ability','wyDiveLand','dive'],['ultimate_ability','knExecute','exec']])
  caReg('wyvern','ability',v,c,{src:ab?'existing':'new',ability:ab,ik:ab==='assault'?'air':ab==='dive'||ab==='exec'?'mixed':'ground'});
for(const [v,id,s] of [['short_charge','rideBy',1],['heavy_charge','trampleRun',1],['aggressive_rush','wyRush'],['wing_assisted_charge','wyWingChg'],['low_profile_charge','wyLowChg'],['roaring_charge','wyRoarChg'],
  ['aerial_charge','wyAerialChg'],['target_locked_charge','lanceRun',1],['interrupted_charge','wyHalt'],['signature_charge','wySigChg']])
  caReg('wyvern','charge',v,'chg_'+id,{src:s?'existing':'new',chg:id,ik:id==='wyAerialChg'?'mixed':'ground'});
// the Devil Bat
for(const [v,c,s,w] of [['combat_ready','idle_btReady'],['heavy_breathing','idle_btPant'],['head_scan','idle_btScan'],['wing_adjustment','idle_btWingFix'],['aggressive_display','idle_btScreech',1],
  ['tail_limb_motion','idle_btClaws',1],['weight_shift','idle_btShift'],['predatory_stare','idle_btStare'],['resting_recovery','idle_btRest'],['rare_signature','idle_btRoll',0,.2]])
  caReg('devilbat','idle',v,c,{src:s?'existing':'new',weight:w||1,cd:w?45:12});
for(const [v,c,s] of [['quick_strike','btQuickSwipe'],['heavy_strike','btHammer'],['forward_lunge','btLunge'],['sweeping_strike','btSwoop',1],['vertical_strike','btDiveRake',1],['multi_hit_combo','btFrenzy'],
  ['aerial_strike','btTalonDrop'],['counterattack','btRiposte'],['close_range_execution','btGrab',1],['signature_attack','btScreechRake']])
  caReg('devilbat','attack',v,c,{src:s?'existing':'new',ph:CA_BT[c]&&CA_BT[c].ph});
for(const [v,c,w] of [['crushing_execution','btCrushExec'],['bite_execution','btBiteExec'],['claw_execution','btClawExec'],['tail_execution','btTailExec'],['wing_execution','btWingExec'],
  ['aerial_execution','btAerialExec'],['heavy_slam','btSlam'],['predators_pounce','btPounce'],['signature_execution','btSigExec'],['rare_finisher','btEmbrace',.3]])
  caReg('devilbat','finisher',v,c,{weight:w||1});
for(const [v,c] of [['power_up','btPowerUp'],['special_attack','btSoulLance'],['area_attack','btWhirl'],['defensive_response','btWingShield'],['airborne_ability','btSkyDive'],
  ['roar_intimidation','btHowl'],['wing_burst','btWingBurst'],['mobility_ability','btDart'],['signature_ability','btSoulDrain'],['ultimate_ability','btApocalypse']])
  caReg('devilbat','ability',v,c);
for(const [v,id] of [['short_charge','btShortChg'],['heavy_charge','btHeavyChg'],['aggressive_rush','btRushChg'],['wing_assisted_charge','btWingChg'],['low_profile_charge','btLowChg'],['roaring_charge','btRoarChg'],
  ['aerial_charge','btAerialChg'],['target_locked_charge','btLockChg'],['interrupted_charge','btHalt'],['signature_charge','btSigChg']])
  caReg('devilbat','charge',v,'chg_'+id,{chg:id});

/* ---------- state, priorities and transitions ---------- */
// the state a creature is in, for the transition rules, the debug view and the tests
function caState(u){
  if(!u.alive) return 'death'; const a=u.action;
  if(u.fin&&a&&a.c.name===u.fin.def.clip) return 'finisher';
  if(u.state==='stunned') return 'hit';
  if(a){ const d=CA_BY_CLIP[u.type]&&CA_BY_CLIP[u.type][a.c.name], r=d?d.cat:animRole(u.type,a.c.name);
    if(r==='reaction') return 'hit'; if(r==='flight') return /Land|Touch/.test(a.c.name)?'landing':'flight'; if(r==='other'||r==='charge') return 'attack'; return r; }   // a charge's strike is an attack
  if(u.chg&&u.chgW>.3) return 'charge';
  return u.spd>.3?'movement':'idle'; }
function caPrio(u,c){ const d=CA_BY_CLIP[u.type]&&CA_BY_CLIP[u.type][c.name]; if(d) return d.prio; const r=animRole(u.type,c.name);
  return r==='reaction'?(c.name==='flinch'?1:3):CA_PRIO[r]!==undefined?CA_PRIO[r]:3; }
// may clip c start now? (play() asks, for the creatures only)
function caCanPlay(u,c){
  const a=u.action; if(!a||a.c===c||!u.alive) return true;
  if(u.state==='stunned') return true;   // a finisher's victim is posed by its killer
  if(u.fin&&a.c.name===u.fin.def.clip) return false;   // a finisher runs to its end (only death stops it)
  if(c.idle) return !!a.c.idle;   // an idle never cuts anything but another idle
  return caPrio(u,c)>=caPrio(u,a.c);
}
// idles: weighted, each with a cooldown, never the same twice running; the rare one comes seldom
function caPickIdle(u,L){
  const now=game.time, cd=u.idleCd||(u.idleCd={}), M=CA_BY_CLIP[u.type]||{}; let tot=0; const pool=[];
  for(const n of L){ if(n===u.lastIdle&&L.length>1) continue; if((cd[n]||0)>now) continue; const w=M[n]?M[n].weight:1; pool.push(n,w); tot+=w; }
  if(!tot) return null;
  let r=Math.random()*tot, n=pool[0]; for(let i=0;i<pool.length;i+=2){ r-=pool[i+1]; if(r<=0){ n=pool[i]; break; } }
  cd[n]=now+(M[n]?M[n].cooldown:10); u.lastIdle=n; return n; }
// finishers: weighted (the rare one seldom), not the same twice running
function caPickFin(u,list){
  const M=CA_BY_CLIP[u.type]||{}; let tot=0; for(const n of list) if(n!==u.lastFin||list.length<2) tot+=M[n]?M[n].weight:1;
  let r=Math.random()*tot; for(const n of list){ if(n===u.lastFin&&list.length>1) continue; r-=M[n]?M[n].weight:1; if(r<=0) return n; } return list[0]; }
// a charge in battle: any but the pull-up (that one plays when a charge is called off)
function caPickCharge(u){ const L=CHG[u.type]; let i,g=0; do{ i=Math.floor(Math.random()*L.length); }while(L[i].halt&&++g<20); return i; }
function caChargeHalt(u){ const L=CHG[u.type]||[], h=L.find(c=>c.halt); if(!h||u.action||!u.alive||u.state!=='ok') return; play(u,'chg_'+h.id); u.fwdScale=1; }

/* ---------- playing a variation by its id (the Lab, the tests, development) ---------- */
function caList(creature,cat){ return Object.keys(CREATURE_ANIMS).filter(id=>CREATURE_ANIMS[id].creature===creature&&(!cat||CREATURE_ANIMS[id].cat===cat)); }
// u: the creature; t: the enemy to use (attacks, finishers, charges). Returns what it started.
function caPlay(u,id,t){
  const d=CREATURE_ANIMS[id]; if(!d||u.type!==d.type||!u.alive) return null;
  if(d.cat==='attack'){ u.action=null; startAttack(u,t||u.atkTarget,d.clip); return 'attack'; }
  if(d.cat==='finisher'){ if(!t||!t.alive) return null; u.action=null; startFinisher(u,t,d.clip); return 'finisher'; }
  if(d.cat==='charge'){ // as the Lab runs one: from twelve metres out, a sprint at the enemy, the charge's strike on arrival
    const i=CHG[u.type].findIndex(c=>'chg_'+c.id===d.clip); if(i<0||!t||!t.alive) return null;
    let dx=u.pos.x-t.pos.x, dz=u.pos.z-t.pos.z, L=Math.hypot(dx,dz); if(L<1e-3){ dx=-Math.sin(t.face||0); dz=-Math.cos(t.face||0); L=1; } dx/=L; dz/=L;
    u.action=null; placeUnit(u,t.pos.x+dx*12,t.pos.z+dz*12,Math.atan2(-dx,-dz)); u.chg={i}; u.chgLab=true; u.target=t;
    const stop=Math.max(u.T.engage+(u.s-1)*.3,1.4);
    u.script={pts:[new V3(t.pos.x+dx*stop,0,t.pos.z+dz*stop)],i:0,speed:u.T.speed*1.15,face:t,then:uu=>{ if(uu.alive&&t.alive) startAttack(uu,t); }};
    return 'charge'; }
  if(d.cat==='ability'){ u.action=null; play(u,d.clip); if(u.action&&u.action.c.loop) u.action.until=game.time+2.4; if(CA_ABILITY_HOOK[id]) CA_ABILITY_HOOK[id](u); return 'ability'; }
  if(d.cat==='idle'){ if(u.action&&!u.action.c.idle) return null; play(u,d.clip); u.fwdScale=0; return 'idle'; }
  return null; }
// called once the clips are compiled (14b): durations, loops and events into the registry
function caFinalize(){
  for(const id in CREATURE_ANIMS){ const d=CREATURE_ANIMS[id], c=CLIPS[d.type][d.clip]; if(!c){ d.missing=true; continue; }
    d.dur=c.dur; d.loop=c.loop; d.events=c.ev.map(e=>e.e+'@'+e.t); d.hits=c.ev.filter(e=>['hit','fire','kill','knock','grab','stabRag','jolt','release','wyFire','wyGust','wyDiveHit','knJudge','knExec'].includes(e.e)).map(e=>e.t);
    if(d.cat==='charge'){ const C=CHG[d.type].find(x=>'chg_'+x.id===d.clip); if(C){ d.name=C.name; d.halt=!!C.halt; } }
    else if(d.cat==='finisher') d.name=FIN[d.clip]&&FIN[d.clip].name;
    else if(d.cat==='idle') d.name=IDLE_NAMES[d.clip.replace(/^idle_/,'')]||d.clip;
    else d.name=MOVE_NAMES[d.clip]||d.clip; }
}
