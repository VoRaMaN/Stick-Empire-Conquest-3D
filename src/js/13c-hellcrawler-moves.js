/* ---------- Hellcrawler (Chaos): unit stats, poses and every clip ----------
   The Hellcrawler is a four-limbed demon, not a stick soldier, so its clip channels mean different things
   (the body and gait live in 27-hellcrawler.js):
     R / L     a forelimb's claw lifted off the ground, in the shoulders' frame: x right, y up (off the back),
               z forward along the spine. Unkeyed (null) = the paw stays planted and walks with the gait.
     lean      + pitches the nose down, − rears the body up on its hind legs
     crouch    lowers the whole body (coiling), jump lifts it (leaps)
     twist     turns the front half of the body; side rolls it
     draw      opens the jaw (0 shut … 1 gaping)
     kick      + the right hind leg kicks forward (reared, raptor-style), − both hind legs buck backward
     alt       the tail: 0 = carried scorpion-style, arched over the back; 0→1 cocks it, 1→1.4 strikes forward over
               the head; below 0 lowers it flat behind (−1, for the spinning sweeps)
     look      turns the head; wL (if set) aims the head in the shoulders' frame
     pR / pL   elbow direction override */
Object.assign(TYPES,{
  crawler:{name:'Hellcrawler',engage:2.0,reach:1.3,s:1,hp:180,dmg:15,range:1.3,speed:5.2,cd:.55,cost:150,thick:1,turn:8,acc:7,
    crawler:true,gearX:true,swarm:true,armReach:.95,chaos:true,body:[new THREE.Color('#2a1d19'),new THREE.Color('#2a1d19')]},
});
RAW.crawler={};
const TRAINED_CHAOS={crawler:'pit'};

// ---- locomotion poses: head low, jaw panting a little; at a run the nose drops and the body stretches out
POSES.crawler={idle:fillPose({lean:0,crouch:0,draw:.08},null),move:null,swingL:0,swingR:0};
POSES.crawler.move=fillPose({lean:.14,crouch:.04,draw:.18},POSES.crawler.idle);

// ---- attacks: claws, bite, leg kicks, tail ----
const CRA={
  crClawR:{keys:[{t:0},{t:.12,R:[.42,.28,0],lean:-.3,twist:-.3,draw:.35,crouch:.05},{t:.24,e:'o',R:[-.08,-.15,.78],lean:.12,twist:.35,fwd:.35,draw:.6},{t:.36,R:[-.16,-.5,.55],lean:.18},R_(.62)],
    ev:[{t:.24,e:'hit'}]},
  crClawL:{keys:[{t:0},{t:.12,L:[-.42,.28,0],lean:-.3,twist:.3,draw:.35,crouch:.05},{t:.24,e:'o',L:[.08,-.15,.78],lean:.12,twist:-.35,fwd:.35,draw:.6},{t:.36,L:[.16,-.5,.55],lean:.18},R_(.62)],
    ev:[{t:.24,e:'hit'}]},
  crRake:{keys:[{t:0},{t:.1,R:[.42,.25,0],lean:-.25,twist:-.3,draw:.3},{t:.2,e:'o',R:[-.05,-.15,.75],twist:.3,fwd:.25,lean:.1},{t:.3,L:[-.42,.25,0],R:[.3,-.5,.4],twist:.35,lean:-.2},
    {t:.42,e:'o',L:[.05,-.15,.75],twist:-.35,fwd:.5,lean:.15,draw:.6},{t:.54,L:[-.25,-.5,.45]},R_(.85)],ev:[{t:.2,e:'hit',dmg:.6},{t:.42,e:'hit',dmg:.7}]},
  crBite:{keys:[{t:0},{t:.14,lean:-.2,crouch:.2,draw:.25,fwd:-.1},{t:.3,e:'o',lean:.4,crouch:.05,draw:1,fwd:.55},{t:.37,draw:0,lean:.42},{t:.5,lean:.2},R_(.78)],
    ev:[{t:.35,e:'hit',dmg:1.2,bite:1}]},
  crPounce:{keys:[{t:0,crouch:.2,lean:.1},{t:.22,crouch:.45,lean:.2,draw:.3},{t:.42,e:'o',jump:.7,fwd:1.2,crouch:0,lean:-.3,R:[.32,.15,.55],L:[-.32,.15,.55],draw:.9},
    {t:.6,e:'i',jump:.05,fwd:2.2,lean:.3,R:[.24,-.45,.8],L:[-.24,-.45,.8],draw:.5},{t:.68,jump:0,crouch:.35,fwd:2.3},R_(1.1)],
    ev:[{t:.08,e:'screech'},{t:.6,e:'hit',dmg:1.4,kd:1,kb:2.5},{t:.66,e:'land'}]},
  crRearSlash:{keys:[{t:0},{t:.25,lean:-.95,crouch:.05,R:[.3,.55,.1],L:[-.3,.55,.1],draw:.6},{t:.45,e:'o',lean:.2,fwd:.45,R:[.15,-.3,.75],L:[-.15,-.3,.75],draw:.9},{t:.58,lean:.3},R_(1.0)],
    ev:[{t:.45,e:'hit',dmg:1.3,kb:2.2}]},
  crRaptorKick:{keys:[{t:0},{t:.2,lean:-.75,crouch:.05,R:[.32,.1,.4],L:[-.32,.1,.4],alt:.2},{t:.36,e:'o',kick:1,lean:-.85,fwd:.35},{t:.5,kick:0,lean:-.45},R_(.9)],
    ev:[{t:.36,e:'hit',dmg:1.1,kb:3}]},
  crBuck:{keys:[{t:0},{t:.28,yaw:3.14,crouch:.15,lean:.2},{t:.42,e:'o',kick:-1,lean:.6,crouch:.1},{t:.56,kick:-.2,lean:.3},{t:.82,yaw:6.28,kick:0,lean:0},R_(1.05,{yaw:6.28})],
    ev:[{t:.42,e:'hit',dmg:1.2,kb:4.5}]},
  crTailSweep:{keys:[{t:0,crouch:.1},{t:.15,yaw:-.5,twist:.4,alt:-1},{t:.6,e:'l',yaw:6.28,crouch:.15,fwd:.3,twist:-.3},{t:.75},R_(1.05,{yaw:6.28})],
    ev:[{t:.39,e:'hit',arc:1.3,dmg:.9,kb:3,tail:1}]},
  crTailStrike:{keys:[{t:0},{t:.2,alt:.95,lean:.3,crouch:.1},{t:.42,e:'o',alt:1.3,lean:.45,fwd:.25},{t:.6,alt:1.1},{t:.75,alt:.4},R_(1.05)],
    ev:[{t:.42,e:'hit',dmg:1.3,kb:2.4}]},
  crFlurry:{keys:[{t:0},{t:.08,R:[.4,.25,.05],lean:-.2,twist:-.25,draw:.5},{t:.16,e:'o',R:[-.05,-.2,.75],twist:.25,fwd:.15},{t:.24,L:[-.4,.25,.05],R:[.3,-.45,.4],twist:.25},
    {t:.32,e:'o',L:[.05,-.2,.75],twist:-.25,fwd:.3},{t:.4,R:[.4,.2,.1],L:[-.3,-.45,.4],twist:-.25},{t:.48,e:'o',R:[-.05,-.3,.75],twist:.25,fwd:.45},{t:.56,L:[-.4,.2,.1],twist:.2},
    {t:.64,e:'o',L:[.05,-.25,.75],twist:-.25,fwd:.55,draw:.8},{t:.74},R_(.98)],
    ev:[{t:.16,e:'hit',dmg:.35},{t:.32,e:'hit',dmg:.35},{t:.48,e:'hit',dmg:.35},{t:.64,e:'hit',dmg:.4}]},
  crGore:{keys:[{t:0},{t:.2,lean:.2,crouch:.25},{t:.36,e:'o',lean:.65,crouch:.15,fwd:.8},{t:.5,lean:.3},R_(.85)],
    ev:[{t:.36,e:'hit',dmg:1,kb:3.6}]},
};
Object.assign(RAW.crawler,CRA);
TYPES.crawler.attacks=['crClawR','crClawL','crRake','crBite','crPounce','crRearSlash','crRaptorKick','crBuck','crTailSweep','crTailStrike','crFlurry','crGore'];
Object.assign(MOVE_NAMES,{crClawR:'Claw Swipe',crClawL:'Left Claw',crRake:'Double Rake',crBite:'Lunge Bite',crPounce:'Pounce',crRearSlash:'Rearing Slash',crRaptorKick:'Raptor Kick',
  crBuck:'Buck Kick',crTailSweep:'Tail Sweep',crTailStrike:'Tail Strike',crFlurry:'Frenzy',crGore:'Horn Gore'});
Object.assign(ATK_AIM_X,{crawler:{crClawR:[['tip','chest']],crClawL:[['hL','chest']],crRake:[['tip','chest'],['hL','chest']],crBite:[['head','neck']],crPounce:[['tip','chest']],
  crRearSlash:[['tip','head']],crRaptorKick:[['foot','gut']],crBuck:[['foot','chest']],crTailStrike:[['tail','head']],crFlurry:[['tip','chest'],['hL','chest'],['tip','gut'],['hL','chest']],crGore:[['head','gut']]}});

// ---- idles: 10 ----
const CRI={
  sniff:{keys:[{t:0},{t:.5,lean:.45,crouch:.1,look:-.4,draw:.15},{t:1.2,look:.3},{t:1.8,look:-.1,lean:.5},{t:2.3},R_(2.7)]},
  hiss:{keys:[{t:0},{t:.35,lean:-.35,crouch:.15,draw:1,side:.1},{t:1.2,draw:.85,look:.2},{t:1.5},R_(1.9)],ev:[{t:.35,e:'hiss'}]},
  shake:{keys:[{t:0},{t:.15,side:.35},{t:.3,side:-.35},{t:.45,side:.3},{t:.6,side:-.25},{t:.75,side:0},R_(1.0)]},
  tailFlick:{keys:[{t:0},{t:.4,alt:.35},{t:.7,alt:.1},{t:1.0,alt:.4},{t:1.3,alt:.05},R_(1.7)]},
  dig:{keys:[{t:0},{t:.3,lean:.3,R:[.25,-.55,.5]},{t:.5,R:[.22,-.75,.3]},{t:.7,R:[.25,-.55,.5]},{t:.9,R:[.22,-.75,.3]},{t:1.1,L:[-.25,-.55,.5]},{t:1.3,L:[-.22,-.75,.3]},R_(1.7)]},
  coil:{keys:[{t:0},{t:.4,crouch:.4,lean:.1,look:-.5},{t:1.2,look:.5},{t:1.6,look:0,crouch:.35},{t:1.8},R_(2.2)]},
  lickClaw:{keys:[{t:0},{t:.4,R:[.08,-.1,.5],lean:.1,draw:.6,look:.1},{t:.6,R:[.06,-.05,.48]},{t:.8,R:[.08,-.1,.5]},{t:1.0,R:[.06,-.05,.48]},R_(1.4)]},
  howl:{keys:[{t:0},{t:.6,lean:-.9,R:[.3,0,.3],L:[-.3,0,.3],draw:1,wL:[0,1,.35]},{t:1.8,draw:.9},{t:2.1},R_(2.6)],ev:[{t:.7,e:'screech'}]},
  stretch:{keys:[{t:0},{t:.6,lean:.55,crouch:.05,R:[.32,-.55,.65],L:[-.32,-.55,.65],draw:.5},{t:1.6},R_(2.1)]},
  scratch:{keys:[{t:0},{t:.3,kick:.35,side:.2,look:.5},{t:.45,kick:.1},{t:.6,kick:.35},{t:.75,kick:.1},{t:.9,kick:.35},R_(1.3)]},
};
IDLES.crawler=[];
for(const n in CRI){ const c=CRI[n]; c.idle=1; RAW.crawler['idle_cr'+n]=c; IDLES.crawler.push('idle_cr'+n); }
Object.assign(IDLE_NAMES,{crsniff:'Sniff the Ground',crhiss:'Hiss',crshake:'Shake Off',crtailFlick:'Tail Flick',crdig:'Claw the Dirt',crcoil:'Coil',crlickClaw:'Lick Claw',
  crhowl:'Howl',crstretch:'Stretch',crscratch:'Scratch'});

// ---- defence ----
Object.assign(RAW.crawler,{
  block:{keys:[{t:0},{t:.16,crouch:.3,lean:.15,R:[.15,0,.42],L:[-.15,0,.42],draw:.2},{t:.5},R_(.78)]},
  parry:{keys:[{t:0,R:[.4,.1,.2]},{t:.1,e:'o',R:[-.1,.05,.6],twist:.3},{t:.22},R_(.45)]},
  dodge:{keys:[{t:0,crouch:.15},{t:.18,e:'o',fwd:-.9,jump:.25,side:.4,twist:.4,crouch:.05},{t:.32,jump:0,fwd:-1.05,crouch:.3,side:0,twist:0},R_(.6)]},
  recoil:{keys:[{t:0},{t:.15,e:'o',lean:-.5,fwd:-.4,crouch:.05,draw:.6},{t:.45,lean:-.2,fwd:-.5},R_(.85)]},
  flinch:{keys:[{t:0},{t:.08,e:'o',lean:-.3,crouch:.12,fwd:-.18,draw:.4},{t:.22,lean:-.1},R_(.42)]},
});
DEF_ODDS.crawler={block:.08,parry:.1,dodge:.3};
// knocked flat on your back by a pouncing beast (any soldier), then back on your feet
RAW.common.knockdown={keys:[{t:0},{t:.12,e:'o',lean:-.7,crouch:.25,fwd:-.35,R:[.3,.35,.1],L:[-.3,.35,.1]},{t:.32,lean:-1.35,crouch:.62,fwd:-.7,R:[.32,.1,-.1],L:[-.32,.1,-.1]},
  {t:1.15,lean:-1.3,crouch:.6},{t:1.55,lean:.35,crouch:.35,fwd:-.7,R:[.2,-.4,.3],L:[-.2,-.4,.3]},R_(1.95)]};

// ---- finishers: 10 ----
const CRF={
  crMaul:{name:'Pounce & Maul',contact:1.15,keys:[{t:0,crouch:.25},{t:.25,crouch:.45,lean:.15,draw:.3},{t:.45,e:'o',jump:.75,fwd:1.1,crouch:0,lean:-.35,R:[.32,.2,.6],L:[-.32,.2,.6],draw:1},
    {t:.62,e:'i',jump:.1,fwd:1.9,lean:.35,R:[.22,-.5,.8],L:[-.22,-.5,.8]},{t:.72,jump:0,crouch:.4,fwd:2.0},{t:.9,e:'o',R:[.25,.1,.35],lean:-.1,crouch:.35},{t:1.02,e:'o',R:[.1,-.65,.7],lean:.45},
    {t:1.14,L:[-.25,.1,.35],lean:-.1},{t:1.26,e:'o',L:[-.1,-.65,.7],lean:.45},{t:1.4,lean:.2,draw:.4},{t:1.6,e:'o',lean:.7,draw:1,crouch:.5},{t:1.68,draw:0},{t:2.0,lean:.2},R_(2.4)],
    ev:[{t:.08,e:'screech'},{t:.62,e:'knock',imp:[0,1,3.5]},{t:.72,e:'land'},{t:1.02,e:'stabRag',imp:[0,-1,1],part:'chest'},{t:1.26,e:'stabRag',imp:[0,-1,1],part:'gut'},
      {t:1.66,e:'stabRag',imp:[0,1.5,.5],part:'neck',shake:.12,aim:['head','neck']}]},
  crThroatRip:{name:'Throat Rip',contact:1.15,keys:[{t:0},{t:.18,lean:-.2,crouch:.2,draw:.3},{t:.34,e:'o',lean:.25,crouch:.05,draw:1,fwd:.45},{t:.4,draw:.1},{t:.55,look:.7,side:.25},
    {t:.68,look:-.7,side:-.25},{t:.81,look:.7,side:.25},{t:.94,look:-.6,side:-.2},{t:1.1,e:'o',look:.9,twist:.6,lean:-.1,side:.3,draw:.8},{t:1.3,look:0,twist:0,side:0},R_(1.7)],
    ev:[{t:.38,e:'grab',at:'jaw'},{t:.55,e:'gore'},{t:.81,e:'gore'},{t:1.1,e:'release',imp:[4,2.5,1],shake:.15}]},
  crDisembowel:{name:'Disembowel',contact:1.2,keys:[{t:0},{t:.2,lean:-.55,crouch:.1,R:[.3,-.35,.2],L:[-.3,-.35,.2],draw:.4},{t:.36,e:'o',R:[.12,.3,.65],lean:-.7,fwd:.3,draw:.8},
    {t:.52,e:'o',L:[-.12,.3,.65],R:[.3,-.3,.3],lean:-.75},{t:.75,R:[.3,-.4,.25],L:[-.3,-.4,.25],lean:-.5,draw:.5},{t:.95,e:'o',R:[.18,.45,.6],L:[-.18,.45,.6],lean:-.9,fwd:.45,draw:1},{t:1.2,lean:-.3},R_(1.65)],
    ev:[{t:.36,e:'jolt',victim:'kneel'},{t:.52,e:'jolt'},{t:.95,e:'kill',imp:[0,3,2.5],spin:3,shake:.2}]},
  crSkullCrush:{name:'Skull Crusher',contact:1.05,victim:'kneel',keys:[{t:0},{t:.3,lean:-.6,crouch:.05,R:[.3,.25,.5],L:[-.3,.25,.5],draw:.5},{t:.6,lean:-.75,R:[.25,.35,.62],L:[-.25,.35,.62],draw:1,fwd:.25},
    {t:.8,e:'o',lean:-.3,draw:0,fwd:.35},{t:1.0,lean:-.55,twist:.4,look:.5},{t:1.25,e:'o',lean:-.2,twist:-.5,look:-.8,draw:.5},{t:1.5},R_(1.9)],
    ev:[{t:.6,e:'jolt',mag:1.2},{t:.8,e:'kill',decap:true,imp:[0,.5,1.2],headImp:[2.5,4,1],shake:.25}]},
  crTailImpale:{name:'Tail Impale',contact:1.6,keys:[{t:0},{t:.3,alt:.6,lean:.3,crouch:.15},{t:.48,e:'o',alt:1,lean:.4,fwd:.2},{t:.9,alt:1.15,lean:.1,crouch:.05},{t:1.25,alt:1.25,lean:-.1},
    {t:1.45,e:'o',alt:.2,lean:.5,crouch:.2,twist:.5},{t:1.7,alt:0,twist:0},R_(2.1)],
    ev:[{t:.48,e:'grab',at:'tail'},{t:1.45,e:'release',imp:[-3,4,-2],shake:.2}]},
  crShred:{name:'Frenzy Shred',contact:1.15,keys:[{t:0},{t:.1,R:[.4,.25,.05],lean:-.3,draw:.6},{t:.2,e:'o',R:[-.05,-.15,.75],fwd:.15},{t:.27,L:[-.4,.25,.05]},{t:.35,e:'o',L:[.05,-.15,.75],fwd:.25},
    {t:.42,R:[.4,.2,.1]},{t:.5,e:'o',R:[-.05,-.35,.75],fwd:.3},{t:.57,L:[-.4,.3,.05]},{t:.65,e:'o',L:[.05,0,.75]},{t:.72,R:[.4,.3,.05],L:[-.4,.3,.05],lean:-.5},
    {t:.8,e:'o',R:[-.05,-.2,.8],fwd:.4},{t:.9,L:[-.3,.4,.2],R:[.3,.4,.2],lean:-.6,draw:1},{t:1.0,e:'o',L:[-.1,-.3,.8],R:[.1,-.3,.8],lean:.2,fwd:.55},{t:1.15},R_(1.55)],
    ev:[{t:.2,e:'jolt'},{t:.35,e:'jolt'},{t:.5,e:'jolt'},{t:.65,e:'jolt',victim:'kneel'},{t:.8,e:'jolt'},{t:1.0,e:'kill',imp:[0,2,4],spin:5,shake:.2}]},
  crDragDown:{name:'Drag Down',contact:1.1,keys:[{t:0},{t:.3,e:'o',L:[-.1,.3,.7],lean:-.4,fwd:.25,draw:.4},{t:.72,e:'o',L:[-.25,-.75,.45],lean:.55,crouch:.35,fwd:-.1},{t:.9,draw:1,lean:.5},
    {t:1.08,e:'o',lean:.85,crouch:.45,draw:0},{t:1.35,lean:.3},R_(1.75)],
    ev:[{t:.3,e:'grab',at:'hL'},{t:.7,e:'release',imp:[0,-14,-1],slam:1,shake:.25},{t:1.06,e:'stabRag',imp:[0,1.5,.5],part:'neck',aim:['head','neck']}]},
  crSpinRend:{name:'Spin Rend',contact:1.2,keys:[{t:0,R:[.45,-.1,.2],L:[-.45,-.1,.2],crouch:.1},{t:.15,yaw:-.5,alt:.2},{t:.55,e:'l',yaw:6.28,R:[.55,-.05,.25],L:[-.55,-.05,.25],fwd:.3},{t:.7},R_(1.1,{yaw:6.28})],
    ev:[{t:.5,e:'kill',imp:[3,2.5,3],spin:6,shake:.2}]},
  crHamstring:{name:'Hamstring',contact:1.1,keys:[{t:0},{t:.2,lean:.35,crouch:.3,draw:.6},{t:.32,e:'o',lean:.55,crouch:.35,draw:0,fwd:.2},{t:.6,lean:-.5,crouch:.05,R:[.3,.1,.4],L:[-.3,.1,.4]},
    {t:.82,e:'o',kick:1,lean:-.75,fwd:.3},{t:1.0,kick:0,lean:-.3},R_(1.4)],
    ev:[{t:.32,e:'jolt',victim:'kneel'},{t:.82,e:'kill',imp:[0,3,6],spin:3,shake:.2}]},
  crBuckKill:{name:'Buck Kick',contact:1.35,keys:[{t:0},{t:.28,yaw:3.14,crouch:.15,lean:.2},{t:.42,e:'o',kick:-1,lean:.6,crouch:.1},{t:.56,kick:-.2,lean:.3},{t:.85,yaw:6.28,kick:0,lean:0},R_(1.1,{yaw:6.28})],
    ev:[{t:.42,e:'kill',imp:[0,3.5,-9],spin:4,shake:.25}]},
};
FINS.crawler=[];
for(const n in CRF){ const d=CRF[n]; RAW.crawler[n]={keys:d.keys,ev:d.ev}; FIN[n]={name:d.name,clip:n,contact:d.contact,victim:d.victim}; FINS.crawler.push(n); }
Object.assign(FIN_AIM_X,{crMaul:[[.62,'tip','chest']],crThroatRip:[[.38,'head','neck']],crDisembowel:[[.36,'tip','gut'],[.52,'hL','gut'],[.95,'tip','chest']],
  crSkullCrush:[[.8,'head','head']],crTailImpale:[[.48,'tail','chest']],crShred:[[.2,'tip','chest'],[.35,'hL','chest'],[.5,'tip','gut'],[.65,'hL','neck'],[.8,'tip','chest'],[1.0,'tip','chest']],
  crDragDown:[[.3,'hL','neck']],crHamstring:[[.32,'head','shin'],[.82,'foot','chest']],crBuckKill:[[.42,'foot','chest']]});
Object.assign(FIN_HIT_X,{crSpinRend:{.5:'chest'}});

// ---- charges: 10. The run is how it carries itself at a full gallop; the keys are the blow it crashes in with
CHG.crawler=[];
chg('crawler','leapClaw','Pouncing Charge',{crouch:.12,lean:.15},
  [{t:.08,crouch:.35},{t:.25,e:'o',jump:.6,fwd:.9,crouch:0,lean:-.3,R:[.3,.15,.55],L:[-.3,.15,.55],draw:.9},{t:.4,e:'i',jump:.05,fwd:1.6,lean:.3,R:[.22,-.45,.8],L:[-.22,-.45,.8]},{t:.48,jump:0,crouch:.35,fwd:1.7},R_(.9)],
  [HIT(.4,['tip','chest'],{dmg:1.5,kb:2.6,kd:1}),{t:.46,e:'land'}]);
chg('crawler','snapBite','Snapping Charge',{draw:.6,lean:.25},
  [{t:.1,lean:-.1,draw:.3},{t:.22,e:'o',lean:.45,draw:1,fwd:.6},{t:.28,draw:0},R_(.7)],[HIT(.26,['head','neck'],{dmg:1.4,kb:2,bite:1})]);
chg('crawler','rakeRush','Raking Charge',{lean:.1,draw:.3},
  [{t:.1,R:[.42,.25,0],twist:-.3},{t:.2,e:'o',R:[-.05,-.15,.75],twist:.3,fwd:.4},{t:.3,L:[-.42,.25,0],twist:.35},{t:.42,e:'o',L:[.05,-.15,.75],twist:-.35,fwd:.7},{t:.54},R_(.9)],
  [HIT(.2,['tip','chest'],{dmg:.8,kb:1.6}),HIT(.42,['hL','chest'],{dmg:.9,kb:2.4})]);
chg('crawler','hornRam','Horn Ram',{lean:.4,crouch:.1},
  [{t:.1,lean:.55,crouch:.2},{t:.22,e:'o',lean:.75,fwd:.9,crouch:.15},{t:.35,lean:.3},R_(.75)],[HIT(.22,['head','gut'],{dmg:1.1,kb:4.2})]);
chg('crawler','skyLeap','Sky Leap',{crouch:.08},
  [{t:.1,crouch:.45},{t:.32,e:'o',jump:1.25,fwd:.9,crouch:0,lean:-.45,R:[.3,.5,.3],L:[-.3,.5,.3],draw:1},{t:.55,e:'i',jump:.05,fwd:1.7,lean:.45,R:[.2,-.5,.8],L:[-.2,-.5,.8]},{t:.62,jump:0,crouch:.45,fwd:1.8},R_(1.1)],
  [{t:.55,e:'hit',arc:1,dmg:1.2,kb:3},{t:.6,e:'land'}]);
chg('crawler','tailLash','Tail Lash',{alt:.45,lean:.2},
  [{t:.12,alt:.8,lean:.35},{t:.26,e:'o',alt:1,lean:.45,fwd:.4},{t:.4,alt:.3},R_(.8)],[HIT(.26,['tail','head'],{dmg:1.3,kb:2.4})]);
chg('crawler','kickLeap','Leaping Kick',{crouch:.1},
  [{t:.08,crouch:.35},{t:.26,e:'o',jump:.7,fwd:.8,lean:-.6,kick:.2,crouch:0},{t:.38,e:'o',kick:1,jump:.5,fwd:1.2},{t:.5,e:'i',kick:0,jump:0,lean:0,fwd:1.4,crouch:.35},R_(.95)],
  [HIT(.38,['foot','chest'],{dmg:1.2,kb:3.8}),{t:.5,e:'land'}]);
chg('crawler','spinTail','Spinning Tail',{alt:-1},
  [{t:.06,yaw:-.4},{t:.4,e:'l',yaw:6.28,fwd:.5,twist:-.3},{t:.52},R_(.85,{yaw:6.28})],[{t:.24,e:'hit',arc:1.3,dmg:1,kb:3,tail:1}]);
chg('crawler','slideClaw','Slide Claw',{crouch:.3,lean:.2},
  [{t:.1,crouch:.45,fwd:.4,R:[.4,-.5,.2]},{t:.24,e:'o',R:[-.1,-.6,.7],twist:.4,crouch:.45,fwd:.9},{t:.4},R_(.8)],[HIT(.24,['tip','shin'],{dmg:1,kb:1.2,up:2})]);
chg('crawler','frenzyRush','Frenzied Rush',{draw:.5},
  [{t:.08,R:[.4,.25,.05],draw:.6},{t:.16,e:'o',R:[-.05,-.2,.75],fwd:.3},{t:.24,L:[-.4,.25,.05]},{t:.32,e:'o',L:[.05,-.2,.75],fwd:.5},{t:.4,R:[.4,.2,.1]},{t:.48,e:'o',R:[-.05,-.3,.75],fwd:.7},{t:.58},R_(.85)],
  [HIT(.16,['tip','chest'],{dmg:.5,kb:1.2}),HIT(.32,['hL','chest'],{dmg:.5,kb:1.2}),HIT(.48,['tip','gut'],{dmg:.6,kb:2})],{anim:(w,r)=>({side:.25*Math.sin(w*9)})});
for(const c of CHG.crawler) RAW.crawler['chg_'+c.id]={keys:c.keys,ev:c.ev,aim:c.aim,atk:1};
