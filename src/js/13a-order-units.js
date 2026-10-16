/* ---------- the rest of the Order army: Wizard, Cleric, Ninja, Wing Archer ----------
   Same animation system as the first five units: chest-local hand targets (x right, y up, z forward),
   weapon directions, body channels, and events that the combat code turns into blows, spells and shots.
   'alt' (Wing Archer only) is the flying height of the hips in metres while a clip plays. */
const CRUISE=3.4;                       // Wing Archer cruising height (hips above the ground)
Object.assign(TYPES,{
  wizard:{name:'Wizard',engage:7,reach:1.3,s:1,hp:95,dmg:30,range:10,speed:2.6,cd:2.3,cost:650,thick:.92,turn:8,
    ranged:true,finR:4.2,kite:4,chgStop:6,staff:1},
  cleric:{name:'Cleric',engage:1.8,reach:1.25,s:1,hp:105,dmg:12,range:1.25,speed:2.5,cd:1.3,cost:400,thick:.92,turn:8,
    support:true,heal:30,healR:7,staff:1,body:[new THREE.Color('#f1ede2'),new THREE.Color('#e6dcdf')],robe:1},
  ninja:{name:'Ninja',engage:1.75,reach:1.15,s:.98,hp:125,dmg:21,range:1.15,speed:5.4,cd:.55,cost:500,thick:.9,turn:13},
  wing:{name:'Wing Archer',engage:9,reach:1,s:.95,hp:170,dmg:24,range:12,speed:3.5,cd:1.5,cost:700,thick:.92,turn:4.5,armor:.2,
    ranged:true,flyer:true,bolt:true,noSwing:true,finR:6,acc:2.2,kite:3,chgStop:5}
});
for(const t of ['wizard','cleric','ninja','wing']){ TYPES[t].gearX=true; RAW[t]={}; }
ORDER.length=0; ORDER.push('miner','sword','spear','archer','ninja','cleric','wizard','wing','giant');

// ---- hand / weapon presets ----
const WZ={REST:{R:[.26,-.3,.2],wR:[0,1,.1]},RAISE:{R:[.16,.5,.12],wR:[.05,1,.15],pR:[.6,.2,.2]},POINT:{R:[.16,.1,.55],wR:[0,.35,.94]},
  PLANT:{R:[.2,-.2,.45],wR:[0,-.85,.5]},PALM:{L:[-.12,.12,.58],wL:[0,0,1]},TWO:{R:[.14,.05,.45],wR:[0,.5,.86],L:[-.06,.1,.4]},
  OVER2:{R:[.12,.55,0],wR:[0,1,.05],L:[-.08,.5,.02]},BONKUP:{R:[.18,.5,-.15],wR:[0,.4,-.92],pR:[.5,.5,.5]},BONK:{R:[.15,-.05,.5],wR:[0,-.5,.86],pR:null}};
const CL={REST:{R:[.24,-.28,.2],wR:[0,1,.08]},RAISE:{R:[.16,.45,.25],wR:[0,1,.35],pR:[.6,.2,.2]},TOWARD:{R:[.18,.25,.48],wR:[0,.7,.7]},
  PRAY:{R:[.04,.06,.3],wR:[0,1,.05],L:[-.03,.1,.28]},UP:{R:[.18,.5,-.12],wR:[0,.4,-.92],pR:[.5,.5,.5]},DOWN:{R:[.15,-.05,.5],wR:[0,-.5,.86],pR:null},
  SIDEW:{R:[.45,-.05,-.1],wR:[.7,.2,-.65]},SIDE:{R:[-.1,0,.52],wR:[-.85,0,.5]},JABW:{R:[.24,-.05,.05],wR:[0,.15,.99]},JAB:{R:[.12,0,.6],wR:[0,.1,1]}};
const NJ={READY:{R:[.22,-.22,.32],wR:[.1,.3,.95],L:[-.2,-.08,.34]},HIGH:{R:[.2,.52,-.18],wR:[.05,.45,-.89],pR:[.5,.5,.5]},CUT:{R:[.18,-.12,.56],wR:[.02,-.55,.83],pR:null},
  LOW:{R:[.2,-.38,.4],wR:[.02,-.9,.42]},SIDEW:{R:[.48,-.02,-.1],wR:[.62,.1,-.78]},SIDE:{R:[-.12,0,.55],wR:[-.86,0,.5]},
  STABW:{R:[.24,-.15,-.2],wR:[0,.05,1]},STAB:{R:[.1,0,.63],wR:[0,.04,1]},BACK:{R:[.26,-.25,-.3],wR:[.05,-.25,-.97]},SEAL:{R:[.04,.1,.32],wR:[0,1,0],L:[-.04,.1,.32]}};
const WG={GRIP:{L:[-.14,.5,-.12],wL:[0,1,0]},HOLD:{R:[.2,-.3,.3],wR:[0,-.4,.92]},AIM:{R:[.12,-.1,.5],wR:[0,-.2,.98]},
  RL1:{L:[.02,-.18,.42],wL:[0,0,1]},RL2:{L:[.02,-.08,.2],wL:[0,0,1]}};
const RA=(t,o)=>R_(t,Object.assign({alt:CRUISE},o||{}));      // rest key for flying clips (keeps cruising height)

// ---- locomotion poses ----
Object.assign(POSES,{
  wizard:{idle:{R:[.26,-.3,.2],wR:[0,1,.08],L:[-.22,-.42,.18],wL:[0,1,0],lean:.08,crouch:.03},move:{R:[.26,-.22,.32],wR:[0,.92,.38],L:[-.24,-.38,.25],lean:.16},swingL:.35,swingR:.05},
  cleric:{idle:{R:[.24,-.28,.2],wR:[0,1,.08],L:[-.1,-.04,.3],wL:[0,1,0],lean:.03},move:{R:[.24,-.22,.28],wR:[0,.95,.25],L:[-.14,-.12,.3],lean:.08},swingL:.15,swingR:.03},
  ninja:{idle:{R:[.24,-.32,.22],wR:[.12,-.2,-.97],L:[-.2,-.1,.34],wL:[0,1,0],lean:.18,crouch:.12,twist:-.2},move:{R:[.26,-.24,-.32],wR:[.05,-.25,-.97],L:[-.26,-.24,-.34],lean:.62,crouch:.06,twist:0},swingL:0,swingR:0},
  wing:{idle:{R:[.2,-.3,.3],wR:[0,-.4,.92],L:[-.14,.5,-.12],wL:[0,1,0],lean:.1},move:{R:[.18,-.32,.25],wR:[0,-.55,.84],L:[-.14,.5,-.12],wL:[0,1,0],lean:.15},swingL:0,swingR:0},
});
for(const t of ['wizard','cleric','ninja','wing']){ POSES[t].idle=fillPose(POSES[t].idle,null); POSES[t].move=fillPose(POSES[t].move,POSES[t].idle); }

// ---- idles: 10 each ----
const IDLE_X={
  wizard:{
    lookAround:IDLE_COMMON.lookAround(),
    strokeBeard:{keys:[{t:0},{t:.4,L:[-.03,.18,.22],lean:.05},{t:.8,L:[-.03,.03,.22]},{t:1.1,L:[-.03,.18,.22]},{t:1.5,L:[-.03,.03,.22]},{t:1.8,look:.3},R_(2.3)]},
    orbGaze:{keys:[{t:0},{t:.6,R:[.12,.18,.32],wR:[0,1,0],lean:.12,look:-.1},{t:1.8,R:[.13,.2,.33]},{t:2.3},R_(2.8)],ev:[{t:.6,e:'charge'}]},
    staffTap:{keys:[{t:0},{t:.3,R:[.26,-.24,.24]},{t:.45,e:'o',R:[.26,-.34,.24]},{t:.65,R:[.26,-.24,.24]},{t:.8,e:'o',R:[.26,-.34,.24]},{t:1.0,R:[.26,-.24,.24]},{t:1.15,e:'o',R:[.26,-.34,.24]},R_(1.5)]},
    mutter:{keys:[{t:0},{t:.4,L:[-.12,0,.4]},{t:.7,L:[-.04,.1,.42]},{t:1.0,L:[-.14,.14,.4]},{t:1.3,L:[-.06,.02,.42]},{t:1.6,L:[-.12,.1,.44]},R_(2.1)],ev:[{t:.7,e:'spark'},{t:1.3,e:'spark'}]},
    adjustHat:{keys:[{t:0},{t:.5,L:[-.16,.44,.14],look:.15},{t:.75,L:[-.12,.46,.18]},{t:1.0,L:[-.16,.44,.14]},R_(1.5)]},
    twirlStaff:IDLE_COMMON.twirl('R','wR',[.22,-.05,.32],[[0,1,0],[1,0,0],[0,-1,0],[-1,0,0],[0,1,0],[1,0,0],[0,-1,0],[0,1,.1]],.2),
    leanOnStaff:{keys:[{t:0},{t:.6,R:[.12,-.12,.32],wR:[0,1,.08],L:[-.02,-.06,.33],lean:.2,crouch:.04},{t:2.0,look:.35},{t:2.8,look:-.2},{t:3.3,look:0},R_(3.8)]},
    stretch:IDLE_COMMON.stretch({wR:[0,1,.1]}),
    yawn:IDLE_COMMON.yawn(),
  },
  cleric:{
    lookAround:IDLE_COMMON.lookAround(),
    pray:{keys:[{t:0},{t:.6,...CL.PRAY,lean:.18},{t:2.2,lean:.2},{t:2.7},R_(3.2)]},
    bless:{keys:[{t:0},{t:.5,...CL.RAISE,L:[-.22,.3,.35],wL:[0,1,0],lean:-.05},{t:1.6},{t:2.1},R_(2.5)],ev:[{t:.9,e:'spark'}]},
    meditate:{keys:[{t:0},{t:.7,R:[.06,-.18,.3],wR:[0,1,.05],L:[-.04,-.16,.3],crouch:.12,lean:.15},{t:2.6,look:.1},{t:3.0},R_(3.5)]},
    gemCheck:{keys:[{t:0},{t:.5,R:[.1,.05,.36],wR:[0,1,-.1],L:[-.02,.3,.3],look:-.08},{t:1.2,L:[0,.33,.32]},{t:1.7},R_(2.2)]},
    sway:{keys:[{t:0},{t:.8,side:.14,look:-.3},{t:1.8,side:-.14,look:.3},{t:2.6,side:0,look:0},R_(3.0)]},
    hoodAdjust:{keys:[{t:0},{t:.4,L:[-.18,.4,.04]},{t:.7,L:[-.14,.44,0]},{t:1.0,L:[-.18,.4,.04]},R_(1.4)]},
    staffLean:{keys:[{t:0},{t:.6,R:[.12,-.1,.3],wR:[0,1,.06],L:[-.02,-.04,.32],lean:.12},{t:2.0,look:-.35},{t:2.8,look:0},R_(3.3)]},
    stretch:IDLE_COMMON.stretch({wR:[0,1,.1]}),
    benediction:{keys:[{t:0},{t:.4,L:[-.16,.42,.3],wL:[0,1,0]},{t:.7,L:[-.04,.42,.3]},{t:.95,L:[-.1,.3,.3]},{t:1.2,L:[-.1,.5,.3]},{t:1.6},R_(2.0)]},
  },
  ninja:{
    lookAround:{keys:[{t:0},{t:.3,look:-.9},{t:.9,look:-.9},{t:1.2,look:.9},{t:1.8,look:.9},{t:2.0,look:0},R_(2.3)]},
    bladeTwirl:IDLE_COMMON.twirl('R','wR',[.3,-.2,.34],SPIN4,.15),
    crouchWatch:{keys:[{t:0},{t:.4,crouch:.3,lean:.32,look:-.4},{t:1.3,look:.4},{t:2.0,look:0},{t:2.3},R_(2.7)]},
    handSeals:{keys:[{t:0},{t:.3,...NJ.SEAL},{t:.5,L:[-.02,.16,.3]},{t:.7,L:[-.07,.06,.33]},{t:.9,L:[-.02,.2,.28]},{t:1.1,L:[-.06,.08,.32]},R_(1.5)]},
    wipeBlade:{keys:[{t:0},{t:.4,R:[.14,-.05,.42],wR:[-.95,.2,.2],pR:[.6,-.3,.2],L:[-.08,-.02,.44]},{t:.9,L:[.28,-.02,.42]},{t:1.2,L:[-.08,-.02,.44]},{t:1.6,L:[.28,-.02,.42]},R_(2.1)]},
    stretchLunge:{keys:[{t:0},{t:.6,side:.3,crouch:.25,lean:.1},{t:1.4,side:-.3},{t:2.1,side:0,crouch:.12},R_(2.5)]},
    sheathe:{keys:[{t:0},{t:.4,R:[.18,.35,-.22],wR:[.4,-.8,-.4],pR:[.5,.4,.3]},{t:1.4},{t:1.8,e:'o',R:[.24,-.22,.3],wR:[.1,.3,.95]},R_(2.2)]},
    neckCrack:{keys:[{t:0},{t:.3,look:-.6,side:-.18},{t:.45,look:-.75},{t:.8,look:.6,side:.18},{t:.95,look:.75},{t:1.3,look:0,side:0},R_(1.6)]},
    bounce:IDLE_COMMON.bounce(),
    meditate:{keys:[{t:0},{t:.6,...NJ.SEAL,crouch:.32,lean:.08},{t:2.4,look:.1},{t:2.9},R_(3.4)]},
  },
  wing:{
    scanBelow:{keys:[{t:0},{t:.6,lean:.35,look:-.7},{t:1.5,look:.7},{t:2.3,look:0},{t:2.6},R_(3.0)]},
    checkBolt:{keys:[{t:0},{t:.5,R:[.08,.12,.32],wR:[0,.6,.8],look:-.05},{t:1.4,R:[.09,.14,.3]},{t:1.8},R_(2.2)]},
    strapAdjust:{keys:[{t:0},{t:.4,L:[-.08,.05,.22]},{t:.7,L:[-.04,.12,.2]},{t:1.0,L:[-.08,.05,.22]},{t:1.3,...WG.GRIP},R_(1.6)]},
    legSwing:{keys:[{t:0},{t:.3,kick:.5},{t:.6,kick:0},{t:.9,kick:.5},{t:1.2,kick:0},{t:1.5,kick:.4},R_(1.9)]},
    boltSpin:IDLE_COMMON.twirl('R','wR',[.22,-.15,.34],[[0,0,1],[1,0,0],[0,0,-1],[-1,0,0],[0,0,1],[0,-.4,.92]],.18),
    lookAround:IDLE_COMMON.lookAround(),
    hangLoose:{keys:[{t:0},{t:.5,L:[-.2,-.45,.08],wL:[0,-1,0],lean:.05},{t:1.6},{t:2.0,...WG.GRIP},R_(2.4)]},
    shoulderRoll:IDLE_COMMON.shoulderRoll(),
    stretchBack:{keys:[{t:0},{t:.5,lean:-.35,R:[.25,.15,.1],wR:[0,.4,.9]},{t:1.5,lean:-.4},{t:2.0},R_(2.4)]},
    wave:{keys:[{t:0},{t:.3,L:[-.32,.45,.1]},{t:.5,L:[-.4,.4,.08]},{t:.7,L:[-.32,.45,.1]},{t:.9,L:[-.4,.4,.08]},{t:1.1,...WG.GRIP},R_(1.4)]},
  },
};
Object.assign(IDLE_NAMES,{strokeBeard:'Stroke Beard',orbGaze:'Gaze into Orb',staffTap:'Staff Tap',mutter:'Mutter Spells',adjustHat:'Fix Hat',twirlStaff:'Staff Twirl',leanOnStaff:'Lean on Staff',
  pray:'Pray',bless:'Bless',meditate:'Meditate',gemCheck:'Check Gem',hoodAdjust:'Fix Hood',staffLean:'Rest on Staff',benediction:'Benediction',
  bladeTwirl:'Blade Twirl',crouchWatch:'Crouch & Watch',handSeals:'Hand Seals',wipeBlade:'Wipe Blade',stretchLunge:'Side Lunge',sheathe:'Sheathe & Draw',
  scanBelow:'Scan Below',checkBolt:'Check Bolt',strapAdjust:'Adjust Harness',legSwing:'Swing Legs',boltSpin:'Crossbow Spin',hangLoose:'Hang Loose',stretchBack:'Stretch Back',wave:'Wave'});
for(const t in IDLE_X){ IDLES[t]=[]; for(const n in IDLE_X[t]){ const c=IDLE_X[t][n]; c.idle=1; if(t==='wing') c.keys=c.keys.map(k=>k.rest?Object.assign({},k,{alt:CRUISE}):k); RAW[t]['idle_'+n]=c; IDLES[t].push('idle_'+n); } }

// ---- moves and abilities ----
const SHOT=(tf,o)=>[{t:tf+.15,...WG.RL1},{t:tf+.4,...WG.RL2},{t:tf+.62,...WG.GRIP}];   // fire, then cock the crossbow with the free hand
const MOVES_X={
  wizard:{
    blast:{keys:[{t:0},{t:.32,...WZ.RAISE,lean:-.1,crouch:.04,twist:-.2},{t:.6,e:'o',...WZ.POINT,lean:.22,twist:.25,fwd:.08},{t:.8,R:[.17,.08,.5]},R_(1.2)],ev:[{t:.2,e:'charge'},{t:.6,e:'blast',dmg:1}]},
    quickBlast:{keys:[{t:0},{t:.14,R:[.22,.18,.22],wR:[0,.95,.3],twist:-.25},{t:.28,e:'o',...WZ.POINT,twist:.2,lean:.15},{t:.42},R_(.75)],ev:[{t:.28,e:'blast',dmg:.7,quick:1}]},
    twinBlast:{keys:[{t:0},{t:.25,...WZ.RAISE,twist:-.25},{t:.4,e:'o',R:[.2,.12,.55],wR:[.2,.3,.93],twist:.15,lean:.2},{t:.55,R:[.18,.3,.3],wR:[0,.9,.4],twist:-.15},{t:.72,e:'o',R:[.1,.1,.55],wR:[-.2,.3,.93],twist:.3,lean:.22},{t:.9},R_(1.3)],ev:[{t:.4,e:'blast',dmg:.6},{t:.72,e:'blast',dmg:.6}]},
    meteor:{keys:[{t:0},{t:.4,...WZ.OVER2,lean:-.25,crouch:.05},{t:.75,R:[.12,.6,.1],wR:[0,1,.2],L:[-.08,.56,.1],lean:-.3},{t:.95,e:'o',R:[.12,0,.52],wR:[0,-.4,.92],L:[-.06,.02,.48],lean:.4,crouch:.18,fwd:.12},{t:1.15},R_(1.65)],ev:[{t:.3,e:'charge'},{t:.95,e:'blast',dmg:1.5,meteor:1}]},
    palmBlast:{keys:[{t:0},{t:.25,L:[-.3,.05,0],wL:[0,0,1],twist:.35,crouch:.08},{t:.4,e:'o',...WZ.PALM,twist:-.35,lean:.2,fwd:.1},{t:.6},R_(.95)],ev:[{t:.4,e:'blast',dmg:.8,from:'hL'}]},
    lightning:{keys:[{t:0},{t:.4,...WZ.RAISE,lean:-.2},{t:.55,e:'o',R:[.16,.56,.1],wR:[0,1,.05],lean:-.25},{t:.8},R_(1.2)],ev:[{t:.25,e:'charge'},{t:.55,e:'lightning',dmg:1.1}]},
    ewall:{keys:[{t:0},{t:.3,R:[.18,.35,.35],wR:[0,.9,.3],crouch:.05,lean:.05},{t:.52,e:'o',...WZ.PLANT,crouch:.22,lean:.35,fwd:.1},{t:.9},R_(1.35)],ev:[{t:.2,e:'charge'},{t:.52,e:'ewall'}]},
    poisonSpray:{keys:[{t:0},{t:.25,...WZ.TWO,twist:-.45,crouch:.06},{t:.42,e:'o',R:[.18,.1,.55],wR:[-.2,.3,.93],L:[-.05,.12,.5],twist:-.1,lean:.25,fwd:.08},{t:.7,R:[.1,.1,.55],wR:[.35,.3,.88],L:[-.12,.12,.48],twist:.35},{t:.85},R_(1.25)],ev:[{t:.42,e:'poison'}]},
    staffBonk:{keys:[{t:0},{t:.18,...WZ.BONKUP,lean:-.15,twist:-.2},{t:.32,e:'o',...WZ.BONK,lean:.45,crouch:.15,twist:.15,fwd:.25},{t:.45},R_(.85)],ev:[{t:.32,e:'hit',dmg:.7}]},
    staffJab:{keys:[{t:0},{t:.14,R:[.24,-.05,.05],wR:[0,.15,.99],twist:-.4,crouch:.08},{t:.26,e:'o',R:[.12,0,.6],wR:[0,.1,1],twist:.3,lean:.35,fwd:.3},{t:.4},R_(.75)],ev:[{t:.26,e:'hit',dmg:.55,kb:1.8}]},
    forcePush:{keys:[{t:0},{t:.2,L:[-.25,0,.12],twist:.4,crouch:.1},{t:.32,e:'o',L:[-.08,.08,.6],wL:[0,0,1],twist:-.35,lean:.25,fwd:.15},{t:.5},R_(.9)],ev:[{t:.32,e:'hit',dmg:.35,kb:4.5,arc:1.4,fx:'push'}]},
  },
  cleric:{
    heal:{keys:[{t:0},{t:.3,...CL.TOWARD,lean:.1,twist:.15},{t:.45,R:[.18,.3,.5]},{t:.75},R_(1.05)],ev:[{t:.15,e:'charge'},{t:.45,e:'heal'}]},
    healBlessing:{keys:[{t:0},{t:.35,R:[.14,.4,.3],wR:[0,1,.3],L:[-.2,.35,.35],wL:[0,1,0],lean:-.08},{t:.6,R:[.16,.42,.4],L:[-.24,.38,.4]},{t:.9},R_(1.25)],ev:[{t:.25,e:'charge'},{t:.6,e:'heal',amt:1.3}]},
    healPrayer:{keys:[{t:0},{t:.3,...CL.PRAY,lean:.2,crouch:.08},{t:.9,lean:.22},{t:1.1},R_(1.4)],ev:[{t:.7,e:'heal',amt:1.1,aura:1}]},
    cure:{keys:[{t:0},{t:.2,R:[.18,.2,.4],wR:[0,1,.2]},{t:.35,wR:[.5,.85,.2]},{t:.5,wR:[0,.85,-.5]},{t:.65,wR:[-.5,.85,.2]},{t:.8,e:'o',...CL.TOWARD},{t:1.0},R_(1.3)],ev:[{t:.8,e:'cure'}]},
    massHeal:{keys:[{t:0},{t:.4,...CL.RAISE,L:[-.2,.4,.2],lean:-.15},{t:.8,R:[.16,.5,.2],wR:[0,1,.1],L:[-.25,.45,.15],lean:-.2},{t:1.05,e:'o',R:[.2,-.25,.42],wR:[0,-.9,.4],L:[-.2,-.2,.3],crouch:.18,lean:.3},{t:1.35},R_(1.8)],ev:[{t:.3,e:'charge'},{t:1.05,e:'massheal'}]},
    staffJab:{keys:[{t:0},{t:.14,...CL.JABW,twist:-.4,crouch:.08},{t:.26,e:'o',...CL.JAB,twist:.3,lean:.35,fwd:.3},{t:.4},R_(.75)],ev:[{t:.26,e:'hit',dmg:.8,kb:1.8}]},
    staffSwing:{keys:[{t:0},{t:.15,...CL.SIDEW,twist:-.5},{t:.3,e:'o',...CL.SIDE,twist:.45,lean:.3,fwd:.2},{t:.45},R_(.8)],ev:[{t:.3,e:'hit',dmg:.9}]},
    holyPush:{keys:[{t:0},{t:.18,L:[-.25,0,.12],twist:.4,crouch:.1},{t:.3,e:'o',L:[-.08,.06,.6],wL:[0,0,1],twist:-.35,lean:.25,fwd:.2},{t:.48},R_(.85)],ev:[{t:.3,e:'hit',dmg:.3,kb:3.6,fx:'holy'}]},
    lowSweep:{keys:[{t:0},{t:.12,R:[.42,-.25,-.05],wR:[.8,-.4,-.45],crouch:.3,lean:.3,twist:-.5},{t:.28,e:'o',R:[-.05,-.4,.45],wR:[-.7,-.4,.6],crouch:.35,lean:.45,twist:.4,fwd:.2},{t:.4},R_(.8)],ev:[{t:.28,e:'hit',dmg:.6,kb:.9}]},
    smite:{keys:[{t:0},{t:.2,...CL.UP,lean:-.15,twist:-.2},{t:.35,e:'o',...CL.DOWN,lean:.45,crouch:.15,twist:.15,fwd:.25},{t:.5},R_(.9)],ev:[{t:.35,e:'hit',dmg:1.1,fx:'holy'}]},
    flash:{keys:[{t:0},{t:.35,...CL.RAISE,lean:-.12},{t:.5,e:'o',R:[.16,.52,.2],wR:[0,1,.2]},{t:.8},R_(1.15)],ev:[{t:.2,e:'charge'},{t:.5,e:'flash'}]},
  },
  ninja:{
    quickCut:{keys:[{t:0},{t:.08,...NJ.HIGH,twist:-.3,lean:.1},{t:.18,e:'o',...NJ.CUT,twist:.3,lean:.45,crouch:.15,fwd:.35},{t:.28,...NJ.LOW},R_(.55)],ev:[{t:.18,e:'hit',dmg:1}]},
    riseCut:{keys:[{t:0},{t:.08,R:[.22,-.42,-.1],wR:[.03,-.6,-.8],crouch:.2,lean:.35,twist:-.3},{t:.2,e:'o',R:[.18,.35,.45],wR:[.02,.95,.3],pR:[.5,-.3,.2],crouch:0,lean:-.05,twist:.3,fwd:.35},{t:.3,R:[.18,.5,.2],wR:[0,.9,-.4]},R_(.6)],ev:[{t:.2,e:'hit',dmg:1,up:2}]},
    tripleCut:{keys:[{t:0},{t:.07,...NJ.SIDEW,twist:-.4},{t:.15,e:'o',...NJ.SIDE,twist:.4,lean:.3,fwd:.15},{t:.25,R:[-.15,.4,.3],wR:[-.4,.8,-.3],twist:.5},{t:.35,e:'o',R:[.4,-.25,.42],wR:[.65,-.55,.5],twist:-.35,lean:.35,fwd:.3},{t:.45,...NJ.STABW,twist:-.45},{t:.55,e:'o',...NJ.STAB,twist:.4,lean:.5,fwd:.5},{t:.65},R_(.95)],
      ev:[{t:.15,e:'hit',dmg:.45},{t:.35,e:'hit',dmg:.45},{t:.55,e:'hit',dmg:.6}]},
    dashSlash:{keys:[{t:0,crouch:.25,lean:.4,...NJ.SIDEW,twist:-.4},{t:.22,e:'o',...NJ.SIDE,twist:.5,lean:.55,crouch:.25,fwd:1.5},{t:.38,fwd:1.75,R:[-.3,-.1,.35],wR:[-.9,-.2,-.3]},R_(.8)],ev:[{t:.2,e:'hit',dmg:1.1}]},
    whirlCut:{keys:[{t:0,R:[.4,-.1,.2],wR:[.85,.1,.5],L:[-.3,-.2,.15],crouch:.15},{t:.12,yaw:-.5,R:[.3,0,-.35],wR:[.4,0,-.9],crouch:.2},{t:.45,e:'l',yaw:6.28,R:[.55,-.05,.1],wR:[1,0,.1],crouch:.2,fwd:.35},{t:.58,R:[.3,-.25,.35],wR:[.6,-.4,.6]},R_(.85,{yaw:6.28})],ev:[{t:.38,e:'hit',arc:1,dmg:.9,kb:1.6}]},
    flipKick:{keys:[{t:0,crouch:.15},{t:.2,e:'o',kick:1,lean:-.35,fwd:.15,L:[-.3,.1,.1]},{t:.32,kick:0},{t:.42,...NJ.HIGH},{t:.52,e:'o',...NJ.CUT,lean:.45,crouch:.15,fwd:.35},{t:.62},R_(.95)],ev:[{t:.2,e:'hit',dmg:.4,kb:2.4},{t:.52,e:'hit',dmg:.9}]},
    backflipCut:{keys:[{t:0},{t:.1,...NJ.SIDEW},{t:.2,e:'o',...NJ.SIDE,twist:.4,lean:.3,fwd:.2},{t:.32,crouch:.3},{t:.55,e:'o',jump:1.0,fwd:-1.1,lean:-.6,crouch:0,R:[.3,.3,.1],wR:[.3,.9,0]},{t:.72,e:'i',jump:0,fwd:-1.3,crouch:.3,lean:.2},R_(1.05)],ev:[{t:.2,e:'hit',dmg:.9},{t:.72,e:'land'}]},
    shadowLunge:{keys:[{t:0,...NJ.STABW,crouch:.3,lean:.3,twist:-.5},{t:.25,e:'o',...NJ.STAB,crouch:.3,lean:.6,twist:.45,fwd:1.0},{t:.4},R_(.75)],ev:[{t:.25,e:'hit',dmg:1.2}]},
    lowSweep:{keys:[{t:0},{t:.1,R:[.45,-.3,-.05],wR:[.8,-.45,-.4],crouch:.4,lean:.4,twist:-.5},{t:.24,e:'o',R:[-.05,-.4,.45],wR:[-.7,-.35,.6],crouch:.45,lean:.5,twist:.4,fwd:.2},{t:.36},R_(.7)],ev:[{t:.24,e:'hit',dmg:.7,kb:.8}]},
    aerialCut:{keys:[{t:0,crouch:.3},{t:.15,crouch:.35},{t:.35,e:'o',jump:1.1,fwd:.7,...NJ.HIGH,lean:-.15,crouch:0},{t:.5,e:'o',jump:.3,fwd:1.2,...NJ.CUT,lean:.6,crouch:.1},{t:.6,jump:0,fwd:1.3,crouch:.35,...NJ.LOW},R_(.95)],ev:[{t:.5,e:'hit',dmg:1.3},{t:.6,e:'land'}]},
    shinobi:{keys:[{t:0},{t:.2,...NJ.SEAL,crouch:.1},{t:.35,L:[-.02,.18,.3]},{t:.5,L:[-.06,.08,.32]},{t:.62,e:'o',crouch:.2,lean:.3},R_(.85)],ev:[{t:.6,e:'cloak'}]},
  },
  wing:{
    aimedBolt:{aim:1,keys:[{t:0,alt:CRUISE},{t:.35,...WG.AIM},{t:.5,e:'o',R:[.12,-.08,.46]},...SHOT(.45),RA(1.3)],ev:[{t:.45,e:'fire',dmg:1},{t:.85,e:'reload'}]},
    snapBolt:{aim:1,keys:[{t:0,alt:CRUISE},{t:.16,...WG.AIM},{t:.28,e:'o',R:[.12,-.08,.46]},...SHOT(.22),RA(1.0)],ev:[{t:.22,e:'fire',dmg:.8},{t:.62,e:'reload'}]},
    diveBolt:{aim:1,alt:1,keys:[{t:0,alt:CRUISE},{t:.45,alt:1.9,lean:.4,...WG.AIM,fwd:.6},{t:.6,e:'o',alt:1.8,fwd:.9},{t:.85,...WG.RL1,alt:2.6,lean:-.1,fwd:1.2},{t:1.05,...WG.RL2,alt:3.2},{t:1.3,...WG.GRIP},RA(1.6)],ev:[{t:.55,e:'fire',dmg:1.2},{t:1.05,e:'reload'}]},
    doubleBolt:{aim:1,keys:[{t:0,alt:CRUISE},{t:.3,...WG.AIM},{t:.4,e:'o'},{t:.52,...WG.RL1},{t:.66,...WG.RL2},{t:.78,...WG.AIM,L:[-.02,-.1,.4]},{t:.88,e:'o'},...SHOT(.86),RA(1.75)],ev:[{t:.38,e:'fire',dmg:.75},{t:.66,e:'reload'},{t:.86,e:'fire',dmg:.75},{t:1.26,e:'reload'}]},
    blazingBolt:{aim:1,keys:[{t:0,alt:CRUISE},{t:.45,...WG.AIM,lean:.05},{t:.62,e:'o',R:[.12,-.06,.45]},...SHOT(.58),RA(1.45)],ev:[{t:.2,e:'ignite'},{t:.58,e:'fire',dmg:1,burn:1},{t:.98,e:'reload'}]},
    strafeBolt:{aim:1,keys:[{t:0,alt:CRUISE},{t:.3,...WG.AIM,side:.45,twist:-.3},{t:.45,e:'o',side:.5},...SHOT(.42),RA(1.3)],ev:[{t:.42,e:'fire',dmg:.95},{t:.82,e:'reload'}]},
    highBolt:{aim:1,alt:1,keys:[{t:0,alt:CRUISE},{t:.5,alt:5.2,lean:-.15},{t:.75,...WG.AIM,alt:5.4,lean:.25},{t:.85,e:'o'},{t:1.0,...WG.RL1},{t:1.25,...WG.RL2,alt:4.6},{t:1.5,...WG.GRIP,alt:3.8},RA(1.8)],ev:[{t:.82,e:'fire',dmg:1.25},{t:1.25,e:'reload'}]},
    hoverVolley:{aim:1,keys:[{t:0,alt:CRUISE},{t:.25,...WG.AIM},{t:.3,e:'o'},{t:.38,...WG.RL2},{t:.48,...WG.AIM},{t:.52,e:'o'},{t:.6,...WG.RL2},{t:.7,...WG.AIM},{t:.74,e:'o'},...SHOT(.74),RA(1.6)],
      ev:[{t:.3,e:'fire',dmg:.55,spread:.05},{t:.52,e:'fire',dmg:.55,spread:.05},{t:.74,e:'fire',dmg:.55,spread:.05},{t:1.14,e:'reload'}]},
    pierceBolt:{aim:1,keys:[{t:0,alt:CRUISE},{t:.6,...WG.AIM,lean:0,crouch:.05},{t:.75,e:'o',R:[.12,-.04,.42],lean:-.1},...SHOT(.72),RA(1.6)],ev:[{t:.2,e:'charge'},{t:.72,e:'fire',dmg:1.8,power:1},{t:1.12,e:'reload'}]},
    swoopKick:{alt:1,keys:[{t:0,alt:CRUISE},{t:.35,alt:1.2,lean:.45,fwd:.8},{t:.48,e:'o',alt:.95,kick:1,lean:-.2,fwd:1.2},{t:.62,kick:0,alt:1.4,fwd:1.6},{t:1.0,alt:2.8,lean:.1,fwd:2.0},RA(1.4)],ev:[{t:.48,e:'hit',dmg:.7,kb:3.2}]},
  },
};
const ATTACKS_X={
  wizard:['blast','quickBlast','twinBlast','meteor','palmBlast','lightning','ewall','poisonSpray','staffBonk','staffJab','forcePush'],
  cleric:['heal','healBlessing','healPrayer','cure','massHeal','staffJab','staffSwing','holyPush','lowSweep','smite','flash'],
  ninja:['quickCut','riseCut','tripleCut','dashSlash','whirlCut','flipKick','backflipCut','shadowLunge','lowSweep','aerialCut','shinobi'],
  wing:['aimedBolt','snapBolt','diveBolt','doubleBolt','blazingBolt','strafeBolt','highBolt','hoverVolley','pierceBolt','swoopKick'],
};
Object.assign(MOVE_NAMES,{blast:'Arcane Blast',quickBlast:'Snap Blast',twinBlast:'Twin Blast',meteor:'Meteor',palmBlast:'Palm Blast',lightning:'Lightning Call',ewall:'Electric Wall',poisonSpray:'Poison Spray',
  staffBonk:'Staff Bonk',staffJab:'Staff Jab',forcePush:'Force Push',heal:'Healing Light',healBlessing:'Blessing',healPrayer:'Healing Prayer',cure:'Cure',massHeal:'Sanctuary',staffSwing:'Staff Swing',
  holyPush:'Holy Push',lowSweep:'Low Sweep',smite:'Smite',flash:'Blinding Flash',quickCut:'Quick Cut',riseCut:'Rising Cut',tripleCut:'Triple Cut',dashSlash:'Dash Slash',whirlCut:'Whirl Cut',
  flipKick:'Flip Kick',backflipCut:'Backflip Cut',shadowLunge:'Shadow Lunge',aerialCut:'Aerial Cut',shinobi:'Shinobi',aimedBolt:'Aimed Bolt',snapBolt:'Snap Bolt',diveBolt:'Dive Shot',
  doubleBolt:'Double Bolt',blazingBolt:'Blazing Bolt',strafeBolt:'Strafing Shot',highBolt:'High Shot',hoverVolley:'Hover Volley',pierceBolt:'Piercing Bolt',swoopKick:'Swoop Kick'});
for(const t in MOVES_X){ Object.assign(RAW[t],MOVES_X[t]); TYPES[t].attacks=ATTACKS_X[t]; }
// Wing Archer flying clips that don't set 'alt' keep cruising height on every key
for(const n in RAW.wing){ const c=RAW.wing[n]; if(!c.alt&&c.keys) c.keys=c.keys.map((k,i)=>i===0||k.rest?Object.assign({alt:CRUISE},k):k); }

// ---- defense ----
Object.assign(RAW.wizard,defenseSet({R:[.18,.15,.4],wR:[-.95,.25,.1],pR:[.6,-.3,.2],L:[-.15,.15,.4],crouch:.12},
  [{t:0,R:[.3,0,.3],wR:[.3,.9,.3]},{t:.1,e:'o',R:[-.02,.15,.45],wR:[-.7,.6,.3],twist:.3},R_(.45)]));
Object.assign(RAW.cleric,defenseSet({R:[.18,.15,.4],wR:[-.95,.25,.1],pR:[.6,-.3,.2],L:[-.15,.15,.4],crouch:.12},
  [{t:0,R:[.3,0,.3],wR:[.3,.9,.3]},{t:.1,e:'o',R:[-.02,.15,.45],wR:[-.7,.6,.3],twist:.3},R_(.45)]));
Object.assign(RAW.ninja,defenseSet({R:[.14,.2,.42],wR:[-.95,.25,.15],pR:[.6,-.3,.2],L:[-.12,.18,.42],crouch:.16,lean:-.05},
  [{t:0,R:[.3,.05,.35],wR:[.4,.8,.4]},{t:.08,e:'o',R:[-.02,.18,.48],wR:[-.6,.75,.3],twist:.3,lean:.05},{t:.18,R:[-.08,.12,.42],wR:[-.75,.55,.2],twist:.35},R_(.4)]));
{ const d=defenseSet({R:[.14,.18,.38],wR:[-.9,.3,.1],L:[-.14,.5,-.12],crouch:0},[{t:0},{t:.12,R:[.14,.18,.38],wR:[-.9,.3,.1]},R_(.4)]);
  d.dodge={alt:1,keys:[{t:0,alt:CRUISE},{t:.2,e:'o',side:.55,twist:.3,fwd:-.4,alt:CRUISE+.5},{t:.45,side:-.2,fwd:-.6},RA(.75)]};
  for(const k in d) d[k].keys=d[k].keys.map((x,i)=>i===0||x.rest?Object.assign({alt:CRUISE},x):x);
  Object.assign(RAW.wing,d); }
Object.assign(DEF_ODDS,{wizard:{block:.14,parry:.05,dodge:.22},cleric:{block:.25,parry:.05,dodge:.15},ninja:{block:.1,parry:.32,dodge:.45},wing:{block:.05,parry:0,dodge:.3}});
// regular attacks: where each blow is meant to land
const ATK_AIM_X={
  wizard:{staffBonk:[['tip','head']],staffJab:[['tip','chest']]},
  cleric:{staffJab:[['tip','chest']],staffSwing:[['blade','chest']],holyPush:[['hL','chest']],lowSweep:[['blade','shin']],smite:[['tip','head']]},
  ninja:{quickCut:[['blade','neck']],riseCut:[['blade','chest']],tripleCut:[['blade','chest'],['blade','chest'],['tip','chest']],dashSlash:[['blade','chest']],
    flipKick:[['foot','chest'],['blade','neck']],backflipCut:[['blade','chest']],shadowLunge:[['tip','chest']],lowSweep:[['blade','shin']],aerialCut:[['blade','neck']]},
  wing:{swoopKick:[['foot','chest']]},
};
