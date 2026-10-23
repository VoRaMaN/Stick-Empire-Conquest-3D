/* ================= Anti-air and the Devil Bat (v0.33): the unit sheets and their moves =================
   Each faction gets a soldier whose job is to bring flyers down (wyverns, wing archers, eagle scouts, bats):
     Ballista (Order)        a crew of one pushing a wheeled bolt-thrower on a pivot; slow, long-ranged, its bolts
                             strike flyers three times as hard
     Acid Spitter (Chaos)    a bloated Hellcrawler that rears up and spits homing gobs of acid: flyers take
                             two and a half times the damage, and the acid eats at whatever it splashes
     Elf Hawk Archer (Wild)  a ranger with a hawk on the shoulder: long arrows that hit flyers two and a half times
                             as hard, and the hawk flies off to strike a flyer itself
   and the Chaos Empire gets a flyer of its own:
     Devil Bat               a winged demon the size of a Spartan with long, wide arms ending in claws; it dives on
                             its prey, rakes and climbs away, and only arrows, bolts, spells and other flyers reach it
   The sheets borrow the reactions and defences of a close cousin (the Archer, the Hellcrawler, the Wing Archer) and
   add moves of their own; the bodies and gear are in 27k. */
// ---- Ballista ----
TYPES.ballista={name:'Ballista',engage:15,reach:.9,s:1,hp:240,dmg:46,range:16.5,speed:1.9,cd:3.4,cost:600,thick:1.05,turn:3.2,armor:.15,acc:2.5,
  ranged:true,siege:true,antiAir:3,finR:1.4,kite:0,chgStop:8,noSwing:true,fin:'pointblank',attacks:['blShoot','blShoot','blHeavy','blTwin']};
RAW.ballista=Object.assign({},RAW.archer);
Object.assign(RAW.ballista,{
  blShoot:{keys:[{t:0},{t:.22,crouch:.2,lean:.3,twist:-.05},{t:.55,crouch:.14,lean:.26},{t:.62,e:'o',lean:.1,crouch:.24,fwd:-.12},{t:.82,lean:.22},R_(1.25)],ev:[{t:.18,e:'blCrank'},{t:.62,e:'fire'}]},
  blHeavy:{keys:[{t:0},{t:.35,crouch:.24,lean:.32},{t:.92,lean:.28,crouch:.2,look:.1},{t:1.0,e:'o',lean:.04,crouch:.28,fwd:-.22},{t:1.25,lean:.22},R_(1.7)],ev:[{t:.2,e:'blCrank'},{t:.6,e:'blCrank'},{t:1.0,e:'fire',dmg:1.6,power:1}]},
  blTwin:{keys:[{t:0},{t:.2,crouch:.18,lean:.28},{t:.42,e:'o',lean:.12,crouch:.22,fwd:-.08},{t:.66,crouch:.2,lean:.3},{t:.9,e:'o',lean:.12,crouch:.22,fwd:-.08},{t:1.1,lean:.22},R_(1.5)],ev:[{t:.15,e:'blCrank'},{t:.42,e:'fire',dmg:.7},{t:.6,e:'blCrank'},{t:.9,e:'fire',dmg:.7}]},
  idle_blCheck:{idle:1,keys:[{t:0},{t:.5,lean:.32,crouch:.16,look:.15},{t:1.4,lean:.3,look:-.12},{t:2,look:0},R_(2.4)],ev:[{t:.6,e:'blCrank'}]},
  idle_blOil:{idle:1,keys:[{t:0},{t:.4,crouch:.3,lean:.4},{t:1.3,crouch:.28,lean:.36,side:.06},{t:1.8,side:0},R_(2.3)]},
});
POSES.ballista={idle:Object.assign({},POSES.archer.idle,{lean:.22,crouch:.1,twist:0}),move:Object.assign({},POSES.archer.move,{lean:.36,crouch:.06,twist:0}),swingL:0,swingR:0};
IDLES.ballista=['idle_blCheck','idle_blOil']; FINS.ballista=(FINS.archer||[]).slice(); CHG.ballista=[];
DEF_ODDS.ballista={block:0,parry:0,dodge:.06}; ATK_AIM_X.ballista=ATK_AIM_X.archer||{};
// ---- Acid Spitter (a Hellcrawler's build) ----
TYPES.spitter=Object.assign({},TYPES.crawler,{name:'Acid Spitter',engage:13,reach:1.2,s:1.05,hp:200,dmg:30,range:15,speed:4.2,cd:2.2,cost:110,acc:6,
  ranged:true,antiAir:2.5,kite:5,finR:1.6,chgStop:7,spitter:true,pick:null,brain:null,attacks:['spSpit','spSpit','spTriple','spArc']});
RAW.spitter=Object.assign({},RAW.crawler);
Object.assign(RAW.spitter,{
  spSpit:{keys:[{t:0},{t:.22,lean:-.35,crouch:.25,draw:.35},{t:.44,e:'o',lean:.3,crouch:.08,draw:1,fwd:.15},{t:.56,draw:.2,lean:.15},R_(.95)],ev:[{t:.1,e:'spGurgle'},{t:.44,e:'spit'}]},
  spTriple:{keys:[{t:0},{t:.2,lean:-.3,crouch:.25,draw:.3},{t:.36,e:'o',lean:.2,draw:1},{t:.5,lean:-.1,draw:.3},{t:.64,e:'o',lean:.25,draw:1},{t:.78,lean:-.1,draw:.3},{t:.92,e:'o',lean:.3,draw:1},{t:1.05,draw:.1},R_(1.4)],
    ev:[{t:.08,e:'spGurgle'},{t:.36,e:'spit',dmg:.55},{t:.64,e:'spit',dmg:.55},{t:.92,e:'spit',dmg:.55}]},
  spArc:{keys:[{t:0},{t:.3,lean:-.6,crouch:.3,draw:.5},{t:.55,e:'o',lean:-.45,crouch:.05,draw:1,jump:.2},{t:.7,jump:0,crouch:.2,lean:0},R_(1.15)],ev:[{t:.12,e:'spGurgle'},{t:.55,e:'spit',dmg:1.3,big:1}]},
  idle_spGurgle:{idle:1,keys:[{t:0},{t:.4,lean:-.2,draw:.4,crouch:.15},{t:.9,draw:.1,lean:0},R_(1.6)],ev:[{t:.3,e:'spGurgle'}]},
});
POSES.spitter=POSES.crawler; IDLES.spitter=(IDLES.crawler||[]).concat(['idle_spGurgle']); FINS.spitter=(FINS.crawler||[]).slice(); CHG.spitter=[];
DEF_ODDS.spitter=Object.assign({},DEF_ODDS.crawler||{block:.1,parry:0,dodge:.3}); ATK_AIM_X.spitter=ATK_AIM_X.crawler||{};
// ---- Elf Hawk Archer (an Elf Archer's sheet; the look and the Wildlands' colours are set in 36d) ----
TYPES.hawk=Object.assign({},TYPES.archer,{name:'Elf Hawk Archer',hp:100,dmg:24,range:16,speed:4,cd:1.6,cost:380,antiAir:2.5,hawkPet:true,attacks:TYPES.archer.attacks.slice()});
RAW.hawk=Object.assign({},RAW.archer); POSES.hawk=POSES.archer; IDLES.hawk=(IDLES.archer||[]).slice(); FINS.hawk=(FINS.archer||[]).slice(); CHG.hawk=(CHG.archer||[]).slice();
DEF_ODDS.hawk=Object.assign({},DEF_ODDS.archer); ATK_AIM_X.hawk=ATK_AIM_X.archer||{};
// ---- Devil Bat (a Wing Archer's flight, a demon's body) ----
const BT={REST:{R:[.46,-.7,.16],wR:[0,-1,0],L:[-.46,-.7,.16],wL:[0,-1,0]},WIDE:{R:[.85,.25,-.1],wR:[.9,.3,-.2],L:[-.85,.25,-.1],wL:[-.9,.3,-.2]},
  RAKE:{R:[.24,-.6,.85],wR:[0,-.6,.8],L:[-.24,-.6,.85],wL:[0,-.6,.8]},HIGH:{R:[.42,.85,.1],wR:[.2,1,.1],L:[-.42,.85,.1],wL:[-.2,1,.1]},
  SLASHR:{R:[-.4,-.25,.75],wR:[-.8,-.3,.5]},SLASHRW:{R:[.8,.3,-.2],wR:[.8,.4,-.4]},SLASHL:{L:[.4,-.25,.75],wL:[.8,-.3,.5]},SLASHLW:{L:[-.8,.3,-.2],wL:[-.8,.4,-.4]}};   // long arms: the hands reach far (TYPES.bat.armK)
TYPES.bat={name:'Devil Bat',engage:2.6,reach:1.5,s:1.08,hp:230,dmg:30,range:1.6,speed:5.2,cd:1.1,cost:330,thick:1.12,turn:7,armor:.12,acc:3,
  flyer:true,bat:true,chaos:true,gearX:true,armK:1.45,shW:.12,noSwing:true,finR:0,chgStop:4,body:[new THREE.Color('#2a1416'),new THREE.Color('#1e0e10')],
  attacks:['btDiveRake','btDiveRake','btSwoop','btTwinSlash','btGrab']};
RAW.bat=Object.assign({},RAW.wing);
Object.assign(RAW.bat,{
  btDiveRake:{keys:[RA(0),{t:.25,alt:CRUISE+.7,lean:-.35,...BT.WIDE},{t:.5,e:'o',alt:1.05,lean:.7,fwd:.9,...BT.RAKE},{t:.62,alt:1.15,lean:.5},{t:.85,alt:2.4,lean:.1,...BT.REST},RA(1.3)],
    ev:[{t:.3,e:'batScreech',mini:1},{t:.5,e:'hit',arc:1.2,dmg:1.3,kb:2.6},{t:.51,e:'batRake'}]},
  btSwoop:{keys:[RA(0),{t:.2,alt:CRUISE+.3,...BT.SLASHRW,...BT.SLASHLW},{t:.45,e:'o',alt:1.2,fwd:1.3,lean:.5,...BT.SLASHR,...BT.SLASHL},{t:.7,alt:2.2,fwd:1.6,lean:.2},RA(1.1)],
    ev:[{t:.45,e:'hit',arc:1.4,dmg:1.0,kb:2},{t:.46,e:'batRake'}]},
  btTwinSlash:{keys:[RA(0),{t:.18,alt:1.6,lean:.3,...BT.SLASHRW},{t:.3,e:'o',alt:1.3,...BT.SLASHR,lean:.45},{t:.45,...BT.SLASHLW},{t:.58,e:'o',alt:1.25,...BT.SLASHL,lean:.5},{t:.8,alt:2,...BT.REST},RA(1.15)],
    ev:[{t:.3,e:'hit',dmg:.75,kb:1.2},{t:.31,e:'batRake'},{t:.58,e:'hit',dmg:.85,kb:2},{t:.59,e:'batRake'}]},
  btGrab:{keys:[RA(0),{t:.3,alt:1.3,lean:.6,fwd:.6,...BT.RAKE},{t:.42,e:'o',alt:1.15,...BT.RAKE},{t:.7,alt:3.8,lean:-.2,...BT.HIGH},{t:.82,e:'o',alt:3.6,lean:.3,...BT.WIDE},RA(1.25)],
    ev:[{t:.42,e:'hit',dmg:.6,kb:.5},{t:.82,e:'batDrop'}]},
  idle_btScreech:{idle:1,keys:[RA(0),{t:.4,lean:-.4,look:.2,...BT.WIDE},{t:1.1,lean:-.3,...BT.WIDE},RA(1.6)],ev:[{t:.45,e:'batScreech'}]},
  idle_btClaws:{idle:1,keys:[RA(0),{t:.3,...BT.HIGH,lean:-.1},{t:.6,...BT.RAKE,lean:.2},{t:.9,...BT.HIGH},RA(1.3)]},
});
POSES.bat={idle:fillPose({...BT.REST,lean:.28,crouch:.05},null),move:fillPose({...BT.REST,R:[.5,-.6,-.1],L:[-.5,-.6,-.1],lean:.5},null),swingL:0,swingR:0};
POSES.bat.move=fillPose(POSES.bat.move,POSES.bat.idle);
IDLES.bat=['idle_btScreech','idle_btClaws']; FINS.bat=[]; CHG.bat=[];
DEF_ODDS.bat={block:.04,parry:.04,dodge:.35}; ATK_AIM_X.bat={};
Object.assign(MOVE_NAMES,{blShoot:'Bolt',blHeavy:'Heavy Bolt',blTwin:'Twin Bolts',spSpit:'Acid Spit',spTriple:'Three Gobs',spArc:'Acid Mortar',
  btDiveRake:'Diving Rake',btSwoop:'Swoop',btTwinSlash:'Twin Claws',btGrab:'Snatch and Drop'});
Object.assign(IDLE_NAMES,{blCheck:'Sight the Bolt',blOil:'Grease the Winch',spGurgle:'Gurgle',btScreech:'Screech',btClaws:'Flex the Claws'});
