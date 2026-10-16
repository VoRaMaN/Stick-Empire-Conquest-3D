/* ================= Chaos Empire, second wave: Bone Reaver, Infernal Bomber, Fallen Oracle, Grim Reaper, Hades =================
   Same animation system as every humanoid (chest-local hand targets x right / y up / z forward). Gear, projectiles,
   powers and brains live in 27c-chaos2.js.
     boner    Bone Reaver: a skeleton with two curved bone blades, fast and vicious
     bomber   Infernal Bomber: an imp with a sack of hellfire bombs; lobs them, and goes off when it dies
     oracle   Fallen Oracle: a blindfolded seer with an eye-topped staff; heals the Chaos army and hexes its foes
     reaper   Grim Reaper: the elite reaper, hooded and huge-scythed; drinks life from every cut and steps through shadow
     hades    Hades: the lord of the underworld, a towering hero with a burning bident and a crown of fire */
const CHAOS2=['boner','bomber','oracle','reaper','hades'];
Object.assign(TYPES,{
  boner:{name:'Bone Reaver',engage:1.75,reach:1.0,s:1.02,hp:120,dmg:17,range:1.05,speed:4.5,cd:.7,cost:140,thick:.9,turn:11,
    chaos:true,gearX:true,skel:true,body:[new THREE.Color('#d3c6a6'),new THREE.Color('#c9b896')]},
  bomber:{name:'Infernal Bomber',engage:6.5,reach:.9,s:.9,hp:80,dmg:26,range:9,speed:3.4,cd:2.3,cost:160,thick:1.05,turn:9,
    ranged:true,kite:3.6,finR:3,chgStop:6,meleeR:2.0,meleeCd:.8,chaos:true,gearX:true,body:[new THREE.Color('#5a1c12'),new THREE.Color('#4a1410')]},
  oracle:{name:'Fallen Oracle',engage:7,reach:1.2,s:1,hp:85,dmg:14,range:10,speed:2.6,cd:1.9,cost:200,thick:.85,turn:8,heal:30,
    ranged:true,kite:4.5,finR:3.5,chgStop:6,meleeR:2.0,meleeCd:.9,robe:true,chaos:true,gearX:true,body:[new THREE.Color('#8f8496'),new THREE.Color('#8f8496')]},
  reaper:{name:'Grim Reaper',engage:2.35,reach:1.6,s:1.22,hp:230,dmg:40,range:1.65,speed:3.1,cd:1.25,cost:250,thick:.9,turn:8,armor:.1,
    robe:true,skel:true,chaos:true,gearX:true,body:[new THREE.Color('#b9ad94'),new THREE.Color('#a89a80')]},
  hades:{name:'Hades',engage:3.2,reach:2.4,s:2.1,hp:950,dmg:68,range:2.5,speed:2.5,cd:1.9,cost:400,thick:1.35,turn:4.5,armor:.25,plateLimbs:true,shW:.11,
    chaos:true,gearX:true,body:[new THREE.Color('#3a1210'),new THREE.Color('#2a0c0a')]},
});
for(const t of CHAOS2) RAW[t]={};

// ---- hand / weapon presets ----
const BR={READY:{R:[.24,-.05,.32],wR:[.15,.75,.6],L:[-.24,-.05,.32],wL:[-.15,.75,.6]},
  XW:{R:[.35,.4,-.05],wR:[.4,.7,-.55],L:[-.35,.4,-.05],wL:[-.4,.7,-.55]},X:{R:[-.15,-.2,.5],wR:[-.6,-.4,.7],L:[.15,-.2,.5],wL:[.6,-.4,.7]},
  THW:{R:[.2,.05,0],wR:[0,.2,1],L:[-.2,.05,0],wL:[0,.2,1]},TH:{R:[.12,.05,.58],wR:[0,.1,1],L:[-.12,.05,.58],wL:[0,.1,1]},
  SIDEW:{R:[.42,.15,-.1],wR:[.7,.3,-.6]},SIDE:{R:[-.15,0,.5],wR:[-.8,0,.55]},LSIDEW:{L:[-.42,.15,-.1],wL:[-.7,.3,-.6]},LSIDE:{L:[.15,0,.5],wL:[.8,0,.55]},
  UPW:{R:[.15,.55,-.15],wR:[0,.5,-.85]},CHOP:{R:[.12,-.1,.5],wR:[0,-.5,.85]},LUPW:{L:[-.15,.55,-.15],wL:[0,.5,-.85]},LCHOP:{L:[-.12,-.1,.5],wL:[0,-.5,.85]},
  OUT:{R:[.45,.05,.1],wR:[.95,.1,.2],L:[-.45,.05,.1],wL:[-.95,.1,.2]},RISE:{R:[.12,.5,.4],wR:[0,.95,.3],L:[-.12,.5,.4],wL:[0,.95,.3]},
  DOWNW:{R:[.12,.45,.2],wR:[0,.6,-.8],L:[-.12,.45,.2],wL:[0,.6,-.8]},DOWN:{R:[.1,-.35,.4],wR:[0,-.95,.25],L:[-.1,-.35,.4],wL:[0,-.95,.25]}};
const BM={HOLD:{R:[.22,-.05,.28],wR:[0,1,0]},WIND:{R:[.3,.38,-.32],wR:[0,1,0],L:[-.25,.1,.35],lean:-.2,twist:-.35},REL:{R:[.12,.38,.55],wR:[0,1,0],L:[-.3,-.2,.1],lean:.3,twist:.3},
  LOWW:{R:[.32,-.35,-.25],wR:[0,1,0],crouch:.2,lean:.2},LOWR:{R:[.1,-.25,.55],wR:[0,1,0],crouch:.25,lean:.4}};
const OR={REST:{R:[.22,-.2,.24],wR:[.04,1,.1]},RAISE:{R:[.16,.42,.28],wR:[0,1,.3],pR:[.6,.2,.2]},POINT:{R:[.16,.12,.5],wR:[0,.55,.84]},
  PALM:{L:[-.1,.15,.55],wL:[0,0,1]},PALMUP:{L:[-.15,.5,.3],wL:[0,1,.1]}};
const GR={REST:{R:[.24,-.2,.2],wR:[.05,1,.12],L:[-.18,-.3,.22]},REAPW:TW([.45,.12,-.05],[.5,.6,-.62],.42),REAP:TW([-.15,-.15,.52],[-.75,.1,.65],.42),
  HIGHW:TW([.1,.52,-.15],[0,.3,-.95],.42),HIGHC:TW([.08,0,.52],[0,-.35,.94],.42),BACKW:TW([-.35,.1,.15],[-.7,.4,-.55],.42),BACK:TW([.4,0,.4],[.85,.1,.5],.42),
  LOWW:TW([.42,-.35,-.1],[.6,-.4,-.7],.42),RISE:TW([.1,.45,.4],[0,.95,.3],.42),FOLLOW:TW([.08,-.3,.45],[0,-.85,.5],.42),HOOK:TW([.1,-.3,.55],[0,-.6,.8],.42)};
const HD={READY:TW([.16,-.1,.3],[.1,.8,.6],.4),UP:TW([.12,.5,-.1],[0,.4,-.92],.4),SLAM:TW([.1,-.15,.55],[0,-.55,.84],.4),THW:TW([.24,.05,-.05],[0,.15,1],.4),
  TH:TW([.1,.05,.6],[0,.08,1],.4),SIDEW:TW([.46,.05,-.12],[.75,.15,-.65],.4),SIDE:TW([-.25,0,.46],[-.85,0,.52],.4),LOWW:TW([.32,-.42,-.12],[.3,-.75,-.6],.4),
  RISE:TW([.1,.42,.42],[0,.92,.4],.4),HIGH:TW([.1,.6,.1],[0,.95,-.3],.4)};

// ---- locomotion poses ----
Object.assign(POSES,{
  boner:{idle:{...BR.READY,lean:.12,crouch:.1},move:{...BR.READY,lean:.3,crouch:.06},swingL:.15,swingR:.15},
  bomber:{idle:{...BM.HOLD,L:[-.2,-.3,.2],wL:[0,1,0],lean:.22,crouch:.1},move:{...BM.HOLD,L:[-.22,-.25,.2],lean:.35,crouch:.08},swingL:.34,swingR:.1},
  oracle:{idle:{...OR.REST,L:[-.18,-.1,.3],wL:[0,1,0],lean:.02},move:{R:[.22,-.18,.3],wR:[.05,.95,.3],L:[-.2,-.2,.3],lean:.12},swingL:.2,swingR:.04},
  reaper:{idle:{...GR.REST,wL:[0,1,0],lean:.08,crouch:.02},move:{R:[.22,-.2,.3],wR:[.05,.95,.3],L:[-.22,-.3,.25],lean:.2},swingL:.25,swingR:.04},
  hades:{idle:{...HD.READY,wL:[0,1,0],lean:.06,crouch:.04},move:{...HD.READY,lean:.16,crouch:.03},swingL:.2,swingR:.04},
});
for(const t of CHAOS2){ POSES[t].idle=fillPose(POSES[t].idle,null); POSES[t].move=fillPose(POSES[t].move,POSES[t].idle); }

// ---- idles: 5 each ----
const IDLE_C2={
  boner:{lookAround:IDLE_COMMON.lookAround(),
    bladeScrape:{keys:[{t:0},{t:.4,R:[.1,.05,.4],wR:[-.7,.6,.3],L:[-.1,.05,.4],wL:[.7,.6,.3],look:-.1},{t:.7,R:[-.05,.1,.42]},{t:1.0,R:[.1,.05,.4]},{t:1.3,R:[-.05,.1,.42]},{t:1.6},R_(2.0)],ev:[{t:.7,e:'whet'},{t:1.3,e:'whet'}]},
    twirl:IDLE_COMMON.twirl('R','wR',[.3,-.1,.32],SPIN4),
    jawClack:{keys:[{t:0},{t:.2,look:.25,side:.05},{t:.3,look:.15},{t:.4,look:.25},{t:.5,look:.15},{t:.6,look:.25},{t:1.0,look:0,side:0},R_(1.3)],ev:[{t:.3,e:'clank'}]},
    rattle:{keys:[{t:0},{t:.15,side:.08,crouch:.14},{t:.25,side:-.08},{t:.35,side:.08},{t:.45,side:-.08},{t:.55,side:0},R_(.9)]}},
  bomber:{lookAround:IDLE_COMMON.lookAround(),
    juggle:{keys:[{t:0},{t:.3,R:[.18,.1,.35]},{t:.45,R:[.18,.35,.35]},{t:.6,R:[.18,.1,.35]},{t:.75,R:[.18,.35,.35]},{t:.9,R:[.18,.1,.35]},R_(1.3)]},
    fuseLight:{keys:[{t:0},{t:.4,R:[.12,.12,.38],L:[-.05,.15,.4],look:-.2,lean:.25},{t:1.4,L:[-.02,.17,.38]},{t:1.8},R_(2.2)],ev:[{t:.5,e:'fuse'},{t:1.0,e:'fuse'}]},
    giggle:{keys:[{t:0},{t:.2,lean:.35,side:.08},{t:.3,side:-.08},{t:.4,side:.08},{t:.5,side:-.08},{t:.6,side:.06},{t:.8,side:0,lean:.22},R_(1.1)]},
    polish:{keys:[{t:0},{t:.4,R:[.1,0,.4],L:[-.02,.02,.42],look:-.15,lean:.3},{t:.6,L:[.06,.06,.4]},{t:.8,L:[-.02,.02,.42]},{t:1.0,L:[.06,.06,.4]},{t:1.4},R_(1.8)]}},
  oracle:{lookAround:IDLE_COMMON.lookAround(),
    eyeGaze:{keys:[{t:0},{t:.6,...OR.RAISE,look:-.1,lean:-.1},{t:1.8,look:.15},{t:2.2},R_(2.7)],ev:[{t:.7,e:'wisp'}]},
    pray:{keys:[{t:0},{t:.6,L:[-.04,.18,.3],wL:[0,1,0],crouch:.12,lean:.25,look:-.2},{t:2.0,lean:.28},{t:2.4},R_(2.9)]},
    whisper:{keys:[{t:0},{t:.4,L:[-.04,.28,.25],look:.35,lean:.05},{t:1.4,look:.4},{t:1.8},R_(2.2)]},
    sway:{keys:[{t:0},{t:.8,side:.14,look:-.3},{t:1.8,side:-.14,look:.3},{t:2.6,side:0,look:0},R_(3.0)]}},
  reaper:{lookAround:IDLE_COMMON.lookAround(),
    leanOnScythe:{keys:[{t:0},{t:.6,R:[.12,-.1,.3],wR:[0,1,.06],L:[-.02,-.04,.32],lean:.12},{t:2.0,look:-.35},{t:2.8,look:0},R_(3.3)]},
    scytheTwirl:IDLE_COMMON.twirl('R','wR',[.22,-.05,.32],[[0,1,0],[1,0,0],[0,-1,0],[-1,0,0],[0,1,0],[1,0,0],[0,-1,0],[0,1,.1]],.22),
    beckon:{keys:[{t:0},{t:.4,L:[-.2,.1,.45],wL:[0,1,0]},{t:.6,L:[-.12,.15,.32]},{t:.8,L:[-.2,.1,.45]},{t:1.0,L:[-.12,.15,.32]},R_(1.4)]},
    loom:{keys:[{t:0},{t:.8,lean:-.15,crouch:-.02,look:.2},{t:2.0,lean:-.18},{t:2.6},R_(3.0)],ev:[{t:.8,e:'ghost'}]}},
  hades:{lookAround:IDLE_COMMON.lookAround(),
    flameFist:{keys:[{t:0},{t:.5,L:[-.12,.2,.42],wL:[0,1,0],look:-.1,lean:.05},{t:1.6,L:[-.1,.24,.4]},{t:2.0},R_(2.4)],ev:[{t:.5,e:'hadesFire'},{t:1.1,e:'hadesFire'}]},
    roar:{keys:[{t:0},{t:.4,L:[-.45,.15,.15],lean:-.2,crouch:.15},{t:1.4,L:[-.47,.2,.12]},{t:1.8},R_(2.3)],ev:[{t:.45,e:'dreadRoar'}]},
    plant:{keys:[{t:0},{t:.6,R:[.1,-.25,.42],wR:[0,-1,.08],L:[-.04,-.22,.42],lean:.05,crouch:.03},{t:2.2,look:.3},{t:2.9,look:0},R_(3.4)]},
    heave:{keys:[{t:0},{t:.5,crouch:.12,lean:.25},{t:1.0,crouch:.02,lean:.15},{t:1.5,crouch:.12,lean:.25},{t:2.0,crouch:.02,lean:.15},R_(2.4)]}},
};
Object.assign(IDLE_NAMES,{bladeScrape:'Scrape Blades',twirl:'Blade Twirl',jawClack:'Jaw Clack',rattle:'Rattle',juggle:'Juggle a Bomb',fuseLight:'Light a Fuse',giggle:'Giggle',
  polish:'Polish a Bomb',eyeGaze:'The Eye Opens',pray:'Pray to the Abyss',loom:'Loom',flameFist:'Burning Fist',plant:'Plant the Bident'});
for(const t in IDLE_C2){ IDLES[t]=[]; for(const n in IDLE_C2[t]){ const c=IDLE_C2[t][n]; c.idle=1; RAW[t]['idle_'+n]=c; IDLES[t].push('idle_'+n); } }

// ---- moves ----
const MOVES_C2={
  boner:{
    brXSlash:{keys:[{t:0},{t:.18,...BR.XW,lean:-.12},{t:.32,e:'o',...BR.X,lean:.4,fwd:.25},{t:.46},R_(.75)],ev:[{t:.32,e:'hit',dmg:1.1}]},
    brTwinThrust:{keys:[{t:0},{t:.16,...BR.THW,crouch:.1},{t:.28,e:'o',...BR.TH,lean:.35,fwd:.35},{t:.42},R_(.7)],ev:[{t:.28,e:'hit',dmg:1.1,kb:2}]},
    brFlurry:{keys:[{t:0},{t:.1,...BR.UPW},{t:.2,e:'o',...BR.CHOP,lean:.3,fwd:.1},{t:.3,...BR.LUPW},{t:.4,e:'o',...BR.LCHOP,lean:.3,fwd:.2},{t:.5,...BR.SIDEW,twist:-.4},{t:.62,e:'o',...BR.SIDE,twist:.4,lean:.3,fwd:.3},{t:.75},R_(1.0)],
      ev:[{t:.2,e:'hit',dmg:.45},{t:.4,e:'hit',dmg:.45},{t:.62,e:'hit',dmg:.6,kb:1.6}]},
    brSpin:{keys:[{t:0,...BR.OUT,crouch:.12},{t:.12,yaw:-.4,crouch:.16},{t:.5,e:'l',yaw:6.28,...BR.OUT,crouch:.16,fwd:.3},{t:.62},R_(.95,{yaw:6.28})],ev:[{t:.4,e:'hit',arc:1.1,around:1,dmg:.75,kb:2}]},
    brLeap:{keys:[{t:0,crouch:.3},{t:.14,crouch:.36},{t:.32,e:'o',jump:.8,fwd:.6,...BR.DOWNW,lean:-.15,crouch:0},{t:.46,e:'o',jump:.2,fwd:1.1,...BR.DOWN,lean:.55,crouch:.15},{t:.56,jump:0,fwd:1.2,crouch:.36},R_(.9)],ev:[{t:.46,e:'hit',dmg:1.3,kb:1.5},{t:.56,e:'land'}]},
    brRising:{keys:[{t:0},{t:.14,...BR.DOWN,crouch:.3,lean:.3},{t:.28,e:'o',...BR.RISE,crouch:0,lean:-.1,fwd:.3},{t:.4},R_(.72)],ev:[{t:.28,e:'hit',dmg:.9,up:2.4}]},
    brBackhand:{keys:[{t:0},{t:.15,...BR.LSIDEW,twist:.4},{t:.3,e:'o',...BR.LSIDE,twist:-.4,lean:.3,fwd:.25},{t:.44},R_(.72)],ev:[{t:.3,e:'hit',dmg:.85,kb:2}]},
    brKick:{keys:[{t:0},{t:.18,kick:.5,lean:-.1},{t:.3,e:'o',kick:1,lean:-.3,fwd:.15},{t:.44,kick:0},R_(.7)],ev:[{t:.3,e:'hit',dmg:.5,kb:3}]},
  },
  bomber:{
    bmLob:{keys:[{t:0},{t:.35,...BM.WIND},{t:.55,e:'o',...BM.REL},{t:.7},R_(1.05)],ev:[{t:.55,e:'bomb',lob:1}]},
    bmQuick:{keys:[{t:0},{t:.2,...BM.LOWW},{t:.34,e:'o',...BM.LOWR},{t:.48},R_(.8)],ev:[{t:.34,e:'bomb',dmg:.75}]},
    bmDouble:{keys:[{t:0},{t:.3,...BM.WIND},{t:.46,e:'o',...BM.REL},{t:.62,...BM.WIND,twist:-.2},{t:.78,e:'o',...BM.REL},{t:.92},R_(1.25)],ev:[{t:.46,e:'bomb',dmg:.6},{t:.78,e:'bomb',dmg:.6,lob:1}]},
    bmCluster:{keys:[{t:0},{t:.4,...BM.WIND,lean:-.3},{t:.6,e:'o',...BM.REL,lean:.35},{t:.78},R_(1.2)],ev:[{t:.6,e:'bomb',n:3,dmg:.45,lob:1,spread:.22}]},
    bmRoll:{keys:[{t:0},{t:.25,...BM.LOWW,crouch:.35,lean:.35},{t:.42,e:'o',R:[.1,-.45,.55],wR:[0,1,0],crouch:.4,lean:.45},{t:.6},R_(.95)],ev:[{t:.42,e:'bomb',roll:1,dmg:.9}]},
    bmBackflip:{keys:[{t:0},{t:.15,crouch:.3},{t:.38,jump:.7,fwd:-.8,lean:-.4,...BM.WIND},{t:.52,e:'o',jump:.3,fwd:-1.2,...BM.REL},{t:.66,jump:0,fwd:-1.3,crouch:.3},R_(1.0)],ev:[{t:.52,e:'bomb',dmg:.8},{t:.66,e:'land'}]},
    bmBash:{keys:[{t:0},{t:.16,R:[.3,.3,-.1],wR:[0,1,0],twist:-.4},{t:.3,e:'o',R:[-.05,.15,.5],wR:[0,1,0],twist:.4,lean:.35,fwd:.25},{t:.44},R_(.75)],ev:[{t:.3,e:'hit',dmg:.5,kb:2.2}]},
    bmKick:{keys:[{t:0},{t:.18,kick:.5,lean:-.1},{t:.3,e:'o',kick:1,lean:-.3,fwd:.15},{t:.44,kick:0},R_(.7)],ev:[{t:.3,e:'hit',dmg:.4,kb:3.2}]},
  },
  oracle:{
    orVoidBolt:{keys:[{t:0},{t:.35,...OR.RAISE,lean:-.08},{t:.6,e:'o',...OR.POINT,lean:.2,fwd:.05},{t:.78},R_(1.15)],ev:[{t:.25,e:'soulCharge'},{t:.6,e:'voidBolt'}]},
    orTriBolt:{keys:[{t:0},{t:.25,...OR.RAISE},{t:.4,e:'o',...OR.POINT,twist:-.15},{t:.55,...OR.RAISE},{t:.7,e:'o',...OR.POINT},{t:.85,...OR.RAISE},{t:1.0,e:'o',...OR.POINT,twist:.15},{t:1.15},R_(1.5)],
      ev:[{t:.4,e:'voidBolt',dmg:.5},{t:.7,e:'voidBolt',dmg:.5},{t:1.0,e:'voidBolt',dmg:.5}]},
    orHex:{keys:[{t:0},{t:.4,...OR.RAISE,...OR.PALMUP,lean:-.1},{t:.7,e:'o',...OR.POINT,...OR.PALM,lean:.25},{t:.9},R_(1.3)],ev:[{t:.3,e:'soulCharge'},{t:.7,e:'voidBolt',dmg:.7,rend:1}]},
    orMend:{keys:[{t:0},{t:.4,...OR.RAISE,...OR.PALMUP,lean:-.1},{t:.9,lean:-.12},{t:1.1},R_(1.45)],ev:[{t:.5,e:'darkMend'}]},
    orMassMend:{keys:[{t:0},{t:.5,...OR.RAISE,L:[-.4,.4,.15],wL:[0,1,0],lean:-.2},{t:1.2,lean:-.22},{t:1.4},R_(1.8)],ev:[{t:.6,e:'massMend'}]},
    orEyeBeam:{keys:[{t:0},{t:.5,...OR.RAISE,lean:-.15},{t:.8,e:'o',...OR.POINT,lean:.3,fwd:.1},{t:1.1},R_(1.5)],ev:[{t:.35,e:'soulCharge'},{t:.8,e:'voidBolt',dmg:1.6,big:1}]},
    orStaffBonk:{keys:[{t:0},{t:.2,R:[.16,.45,-.05],wR:[0,.6,-.8],lean:-.1},{t:.36,e:'o',R:[.12,-.05,.55],wR:[0,-.2,.98],lean:.45,fwd:.2},{t:.52},R_(.85)],ev:[{t:.36,e:'hit',dmg:.7,kb:2}]},
    orPalmPush:{keys:[{t:0},{t:.2,L:[-.3,.05,0],wL:[0,0,1],twist:.35,crouch:.08},{t:.36,e:'o',...OR.PALM,twist:-.35,lean:.2,fwd:.15},{t:.52},R_(.85)],ev:[{t:.36,e:'hit',dmg:.5,kb:4,fx:'soul'}]},
  },
  reaper:{
    grWideReap:{keys:[{t:0},{t:.3,...GR.REAPW,twist:-.6,crouch:.12},{t:.52,e:'o',...GR.REAP,twist:.55,lean:.3,crouch:.12,fwd:.3},{t:.68,...GR.BACKW,twist:.7},R_(1.05)],ev:[{t:.52,e:'hit',arc:1.5,dmg:.9,kb:2.6}]},
    grDeathArc:{keys:[{t:0},{t:.34,...GR.HIGHW,lean:-.2},{t:.55,e:'o',...GR.HIGHC,lean:.5,crouch:.22,fwd:.3},{t:.7,...GR.FOLLOW,lean:.55,crouch:.25},R_(1.1)],ev:[{t:.55,e:'hit',arc:1,dmg:1.3,kb:2}]},
    grBackReap:{keys:[{t:0},{t:.24,...GR.BACKW,twist:.5,crouch:.08},{t:.44,e:'o',...GR.BACK,twist:-.45,lean:.25,fwd:.25},{t:.58,...GR.REAPW,twist:-.55},R_(.95)],ev:[{t:.44,e:'hit',arc:1.2,dmg:1,kb:2.4}]},
    grWhirl:{keys:[{t:0,...GR.REAPW,crouch:.12},{t:.15,yaw:-.5,crouch:.18},{t:.62,e:'l',yaw:6.28,...GR.REAP,crouch:.18,fwd:.3},{t:.78},R_(1.15,{yaw:6.28})],ev:[{t:.5,e:'hit',arc:1.4,around:1,dmg:.85,kb:2.8}]},
    grHookPull:{keys:[{t:0},{t:.22,...GR.HIGHW,lean:-.1},{t:.4,e:'o',...GR.HOOK,lean:.45,crouch:.25,fwd:.3},{t:.6,...TW([.12,-.25,.2],[0,-.3,.95],.42),lean:-.15,crouch:.15,fwd:-.15},R_(1.0)],ev:[{t:.42,e:'hit',dmg:.8,kb:-2,kd:1}]},
    grRising:{keys:[{t:0},{t:.2,...GR.LOWW,crouch:.32,lean:.35,twist:-.35},{t:.4,e:'o',...GR.RISE,crouch:0,lean:-.15,twist:.3,fwd:.3},{t:.54},R_(.95)],ev:[{t:.4,e:'hit',arc:1,dmg:1,up:2.6,kb:1.8}]},
    grTwinReap:{keys:[{t:0},{t:.2,...GR.REAPW,twist:-.5,crouch:.1},{t:.36,e:'o',...GR.REAP,twist:.45,lean:.3,fwd:.2},{t:.5,...GR.BACKW,twist:.5},{t:.66,e:'o',...GR.BACK,twist:-.45,lean:.3,fwd:.35},{t:.8},R_(1.15)],
      ev:[{t:.36,e:'hit',arc:1.2,dmg:.65},{t:.66,e:'hit',arc:1.2,dmg:.75,kb:2.2}]},
    grShadowCut:{keys:[{t:0},{t:.18,...GR.REAPW,twist:-.4,lean:.2},{t:.32,e:'o',...GR.REAP,twist:.5,lean:.45,fwd:.9},{t:.5},R_(.9)],ev:[{t:.15,e:'ghost'},{t:.32,e:'hit',arc:1,dmg:1.1,kb:2}]},
  },
  hades:{
    hdSweep:{keys:[{t:0},{t:.35,...HD.SIDEW,twist:-.6,crouch:.12},{t:.58,e:'o',...HD.SIDE,twist:.5,lean:.3,crouch:.15,fwd:.25},{t:.75},R_(1.2)],ev:[{t:.58,e:'hit',arc:1.5,dmg:.9,kb:3.4}]},
    hdThrust:{keys:[{t:0},{t:.3,...HD.THW,crouch:.12,twist:-.3},{t:.48,e:'o',...HD.TH,lean:.4,fwd:.4,twist:.25},{t:.64},R_(1.0)],ev:[{t:.48,e:'hit',dmg:1.3,kb:4.5}]},
    hdSlam:{keys:[{t:0},{t:.45,...HD.UP,lean:-.25,crouch:.05},{t:.72,e:'o',...HD.SLAM,lean:.6,crouch:.35,fwd:.25},{t:1.0,lean:.5,crouch:.3},R_(1.45)],ev:[{t:.72,e:'hit',aoe:1.2,dmg:1.2,kb:4},{t:.72,e:'hellfire',r:3.4}]},
    hdSpin:{keys:[{t:0,...HD.SIDEW,crouch:.15},{t:.2,yaw:-.5,crouch:.2},{t:.7,e:'l',yaw:6.28,...HD.SIDE,crouch:.2,fwd:.3},{t:.85},R_(1.3,{yaw:6.28})],ev:[{t:.55,e:'hit',arc:1.5,around:1,dmg:.85,kb:3.6}]},
    hdUpthrust:{keys:[{t:0},{t:.3,...HD.LOWW,crouch:.3,lean:.3,twist:-.35},{t:.5,e:'o',...HD.RISE,crouch:0,lean:-.15,twist:.25,fwd:.3},{t:.68},R_(1.1)],ev:[{t:.5,e:'hit',arc:1,dmg:1.1,up:3.2,kb:2.4}]},
    hdStomp:{keys:[{t:0},{t:.3,kick:.6,lean:-.2},{t:.48,e:'o',kick:0,lean:.2,crouch:.25},{t:.7},R_(1.05)],ev:[{t:.48,e:'hit',aoe:.9,stomp:1,dmg:.7,kb:3.4},{t:.48,e:'hellfire',r:2.4}]},
    hdFlameWave:{keys:[{t:0},{t:.4,...HD.HIGH,lean:-.2},{t:.7,e:'o',...HD.TH,lean:.35,fwd:.2},{t:.95},R_(1.35)],ev:[{t:.7,e:'flameWave'}]},
    hdDoubleSweep:{keys:[{t:0},{t:.3,...HD.SIDEW,twist:-.6},{t:.5,e:'o',...HD.SIDE,twist:.5,lean:.3,fwd:.2},{t:.72,...TW([-.4,.15,.2],[-.8,.3,-.4],.4),twist:.6},{t:.95,e:'o',...TW([.4,0,.42],[.85,0,.5],.4),twist:-.5,lean:.3,fwd:.35},{t:1.15},R_(1.55)],
      ev:[{t:.5,e:'hit',arc:1.4,dmg:.7,kb:2.6},{t:.95,e:'hit',arc:1.4,dmg:.8,kb:3.2}]},
  },
};
const ATTACKS_C2={
  boner:['brXSlash','brTwinThrust','brFlurry','brSpin','brLeap','brRising','brBackhand','brKick'],
  bomber:['bmLob','bmQuick','bmDouble','bmCluster','bmRoll','bmBackflip','bmBash','bmKick'],
  oracle:['orVoidBolt','orTriBolt','orHex','orMend','orMassMend','orEyeBeam','orStaffBonk','orPalmPush'],
  reaper:['grWideReap','grDeathArc','grBackReap','grWhirl','grHookPull','grRising','grTwinReap','grShadowCut'],
  hades:['hdSweep','hdThrust','hdSlam','hdSpin','hdUpthrust','hdStomp','hdFlameWave','hdDoubleSweep'],
};
Object.assign(MOVE_NAMES,{brXSlash:'X-Slash',brTwinThrust:'Twin Thrust',brFlurry:'Bone Flurry',brSpin:'Bone Whirl',brLeap:'Leaping Cut',brRising:'Rising Blades',brBackhand:'Backhand',brKick:'Kick',
  bmLob:'Lobbed Bomb',bmQuick:'Quick Toss',bmDouble:'Double Toss',bmCluster:'Cluster Bombs',bmRoll:'Rolling Bomb',bmBackflip:'Backflip Toss',bmBash:'Bomb Bash',bmKick:'Kick',
  orVoidBolt:'Void Bolt',orTriBolt:'Three Bolts',orHex:'Hex',orMend:'Dark Mending',orMassMend:'Mass Mending',orEyeBeam:'Eye of the Abyss',orStaffBonk:'Staff Strike',orPalmPush:'Void Palm',
  grWideReap:'Wide Reap',grDeathArc:'Death Arc',grBackReap:'Backhand Reap',grWhirl:'Whirling Death',grHookPull:'Hook & Pull',grRising:'Rising Reap',grTwinReap:'Twin Reap',grShadowCut:'Shadow Cut',
  hdSweep:'Bident Sweep',hdThrust:'Bident Thrust',hdSlam:'Hellfire Slam',hdSpin:'Burning Whirl',hdUpthrust:'Rising Bident',hdStomp:'Stomp of the Underworld',hdFlameWave:'Wave of Flame',hdDoubleSweep:'Double Sweep'});
for(const t in MOVES_C2){ Object.assign(RAW[t],MOVES_C2[t]); TYPES[t].attacks=ATTACKS_C2[t]; }
Object.assign(ATK_AIM_X,{
  boner:{brXSlash:[['blade','chest']],brTwinThrust:[['tip','chest']],brFlurry:[['blade','chest']],brLeap:[['blade','head']],brRising:[['blade','chest']],brKick:[['foot','gut']]},
  bomber:{bmBash:[['tip','head']],bmKick:[['foot','gut']]},
  oracle:{orStaffBonk:[['tip','head']]},
  reaper:{grDeathArc:[['blade','head']],grHookPull:[['blade','shin']],grRising:[['blade','chest']]},
  hades:{hdThrust:[['tip','chest']]},
});

// ---- defence ----
Object.assign(RAW.boner,defenseSet({R:[.2,.2,.4],wR:[-.6,.75,.2],L:[-.2,.2,.4],wL:[.6,.75,.2],crouch:.12},[{t:0,...BR.READY},{t:.1,e:'o',R:[-.02,.18,.45],wR:[-.7,.6,.3],twist:.3},R_(.42)]));
Object.assign(RAW.bomber,defenseSet({L:[-.15,.25,.35],wL:[0,1,0],R:[.25,-.1,.15],crouch:.2,lean:-.1},[{t:0,...BM.HOLD},{t:.1,e:'o',L:[.05,.2,.45],twist:.3},R_(.45)]));
Object.assign(RAW.oracle,defenseSet({R:[.18,.15,.4],wR:[-.95,.25,.1],pR:[.6,-.3,.2],L:[-.15,.15,.4],crouch:.12},[{t:0,...OR.REST},{t:.1,e:'o',R:[-.02,.15,.45],wR:[-.7,.6,.3],twist:.3},R_(.45)]));
Object.assign(RAW.reaper,defenseSet({...TW([.2,.15,.4],[.95,.25,.1],.4),crouch:.12},[{t:0,...GR.REST},{t:.12,e:'o',...TW([-.05,.2,.45],[-.6,.75,.3],.4),twist:.3},{t:.26},R_(.55)]));
Object.assign(RAW.hades,defenseSet({...TW([.2,.15,.4],[.95,.25,.1],.32),crouch:.12},[{t:0,...HD.READY},{t:.12,e:'o',...TW([-.05,.2,.45],[-.6,.75,.3],.4),twist:.3},{t:.26},R_(.6)]));
Object.assign(DEF_ODDS,{boner:{block:.2,parry:.2,dodge:.25},bomber:{block:.05,parry:0,dodge:.35},oracle:{block:.1,parry:.05,dodge:.3},reaper:{block:.25,parry:.25,dodge:.15},hades:{block:.35,parry:.15,dodge:0}});

// ---- finishers ----
const FIN_C2={
  boner:{
    brScissor:{name:'Scissor Cut',contact:1.0,keys:[{t:0},{t:.3,...BR.XW,lean:-.15},{t:.5,e:'o',R:[-.05,.25,.5],wR:[-.85,.1,.5],L:[.05,.25,.5],wL:[.85,.1,.5],lean:.3,fwd:.2},{t:.75},R_(1.15)],
      ev:[{t:.5,e:'kill',decap:true,imp:[0,.5,1],headImp:[0,4,1],shake:.2}]},
    brImpaleLift:{name:'Twin Impale',contact:1.0,keys:[{t:0},{t:.2,...BR.THW,crouch:.1},{t:.35,e:'o',...BR.TH,lean:.35,fwd:.3},{t:.8,...BR.RISE,lean:-.2},{t:1.15,e:'o',...BR.DOWN,lean:.5,crouch:.3},{t:1.45},R_(1.85)],
      ev:[{t:.35,e:'grab',at:'tip'},{t:1.13,e:'release',imp:[0,-12,1.5],slam:1,shake:.25}]},
    brFrenzy:{name:'Bone Frenzy',contact:.95,keys:[{t:0},{t:.12,...BR.UPW},{t:.22,e:'o',...BR.CHOP,lean:.3},{t:.32,...BR.LUPW},{t:.42,e:'o',...BR.LCHOP,lean:.3},{t:.52,...BR.UPW},{t:.62,e:'o',...BR.CHOP,lean:.35},{t:.75,...BR.XW},{t:.95,e:'o',...BR.X,lean:.45,fwd:.2},{t:1.15},R_(1.5)],
      ev:[{t:.22,e:'jolt'},{t:.42,e:'jolt'},{t:.62,e:'jolt',victim:'kneel'},{t:.95,e:'kill',imp:[0,1,2.5],spin:3,shake:.2}]},
    brDeathWhirl:{name:'Death Whirl',contact:1.05,keys:[{t:0,...BR.OUT,crouch:.12},{t:.15,yaw:-.5,crouch:.18},{t:.55,e:'l',yaw:6.28,...BR.OUT,crouch:.15,fwd:.3},{t:.75},R_(1.1,{yaw:6.28})],
      ev:[{t:.45,e:'kill',decap:true,imp:[2,1.5,1.5],headImp:[5,4,1],shake:.2}]},
    brGraveLeap:{name:'Grave Leap',contact:1.5,keys:[{t:0,crouch:.3},{t:.2,crouch:.36},{t:.4,e:'o',jump:.8,fwd:.6,...BR.DOWNW,lean:-.2,crouch:0},{t:.6,e:'o',jump:0,fwd:1.1,...BR.DOWN,lean:.6,crouch:.45},{t:.95},R_(1.4)],
      ev:[{t:.4,e:'knock',imp:[0,-1,2]},{t:.62,e:'stabRag',imp:[0,-3,.4],part:'chest',shake:.25},{t:.62,e:'land'}]},
    brRibBreaker:{name:'Rib Breaker',contact:1.0,keys:[{t:0},{t:.18,kick:.5},{t:.3,e:'o',kick:1,lean:-.3,fwd:.15},{t:.44,kick:0},{t:.75,...BR.DOWNW,lean:-.15},{t:.95,e:'o',...BR.DOWN,lean:.55,crouch:.3},{t:1.3,e:'o',...BR.OUT,lean:-.1,crouch:.1},{t:1.55},R_(1.9)],
      ev:[{t:.3,e:'jolt',victim:'kneel',mag:1.2},{t:.95,e:'jolt',mag:.4},{t:1.3,e:'kill',imp:[0,.5,2],spin:2,shake:.2}]},
  },
  bomber:{
    bmMouthful:{name:'Mouthful',contact:.9,keys:[{t:0},{t:.3,e:'o',L:[-.06,.22,.56],wL:[0,1,0],lean:.3,fwd:.3},{t:.65,R:[.05,.3,.5],wR:[0,1,0],lean:.25},{t:.95,e:'o',L:[-.05,.1,.75],lean:.4,fwd:.2},{t:1.15,fwd:-.5,lean:-.2},{t:1.5},R_(1.9)],
      ev:[{t:.3,e:'grab',at:'hL'},{t:.65,e:'fuse'},{t:.93,e:'release',imp:[0,2,6]},{t:1.4,e:'ragBoom'}]},
    bmPointBlank:{name:'Point Blank',contact:.85,keys:[{t:0},{t:.3,...BM.WIND},{t:.5,e:'o',R:[.05,.1,.6],wR:[0,1,0],lean:.4,fwd:.25},{t:.7,fwd:-.6,lean:-.3},R_(1.2)],
      ev:[{t:.5,e:'kill',imp:[0,6,7],spin:5,fx:'boom',shake:.4}]},
    bmKickBoom:{name:'Kick & Boom',contact:.9,keys:[{t:0},{t:.18,kick:.5},{t:.3,e:'o',kick:1,lean:-.3,fwd:.15},{t:.44,kick:0},{t:.7,...BM.WIND},{t:.88,e:'o',...BM.REL},{t:1.1},R_(1.6)],
      ev:[{t:.3,e:'knock',imp:[0,1.5,3]},{t:.88,e:'fuse'},{t:1.35,e:'ragBoom'}]},
    bmSkyFuse:{name:'Sky Fuse',contact:.9,keys:[{t:0},{t:.2,...BM.LOWW,crouch:.35},{t:.36,e:'o',R:[.1,.45,.4],wR:[0,1,0],crouch:0,lean:-.15,fwd:.3},{t:.7,...BM.WIND},{t:.85,e:'o',R:[.12,.5,.35],wR:[0,1,0],lean:-.2},{t:1.1},R_(1.5)],
      ev:[{t:.36,e:'kill',imp:[0,9,1.5],spin:6,shake:.2},{t:1.05,e:'ragBoom'}]},
    bmHotFoot:{name:'Hot Foot',contact:.9,keys:[{t:0},{t:.3,...BM.LOWW,crouch:.35,lean:.4},{t:.45,e:'o',R:[.1,-.45,.5],wR:[0,1,0],crouch:.4,lean:.45},{t:.75,fwd:-1.2,lean:-.3,crouch:.1},{t:1.0,fwd:-1.4},R_(1.5)],
      ev:[{t:.45,e:'fuse'},{t:.95,e:'kill',imp:[0,10,1],spin:7,fx:'boom',shake:.4}]},
  },
  oracle:{
    orSoulSight:{name:'Soul Sight',contact:1.6,keys:[{t:0},{t:.35,e:'o',...OR.RAISE,...OR.PALM,lean:.2},{t:1.1,...OR.PALMUP,lean:-.2},{t:1.6,L:[-.15,.55,.3],lean:-.22},{t:1.95,e:'o',L:[-.1,-.4,.45],wL:[0,-1,.2],lean:.5,crouch:.3},{t:2.25},R_(2.6)],
      ev:[{t:.3,e:'soulCharge'},{t:.35,e:'grab',at:'tk',fx:'soul'},{t:.9,e:'soulDrainRag'},{t:1.3,e:'soulDrainRag'},{t:1.93,e:'release',imp:[0,-15,1],slam:1,shake:.3}]},
    orImplode:{name:'Void Implosion',contact:2.2,keys:[{t:0},{t:.4,...OR.RAISE,lean:-.1},{t:.75,e:'o',...OR.POINT,lean:.25},{t:1.2},R_(1.6)],
      ev:[{t:.4,e:'jolt',fx:'soul',victim:'kneel',mag:.5},{t:.75,e:'kill',fx:'soulBlast',imp:[0,-3,0],ring:1,shake:.3}]},
    orHexStrangle:{name:'Strangling Hex',contact:2.0,keys:[{t:0},{t:.4,...OR.PALMUP,lean:-.1},{t:1.3,L:[-.12,.5,.35],lean:-.15},{t:1.5,e:'o',...OR.PALM,lean:.3},{t:1.8},R_(2.2)],
      ev:[{t:.4,e:'jolt',fx:'soul',victim:'kneel',mag:.5},{t:.7,e:'soulDrain'},{t:1.0,e:'soulDrain'},{t:1.5,e:'kill',imp:[0,.5,.6],fx:'soul'}]},
    orStaffImpale:{name:'Staff of Sight',contact:1.3,keys:[{t:0},{t:.25,R:[.2,.05,.05],wR:[0,.1,1],crouch:.12,twist:-.3},{t:.42,e:'o',R:[.1,.02,.55],wR:[0,.08,1],lean:.4,fwd:.35,twist:.25},{t:1.2,lean:.35},
      {t:1.5,e:'o',R:[.16,.2,.3],wR:[0,.6,.8],lean:-.1,fwd:.2},{t:1.8},R_(2.2)],
      ev:[{t:.42,e:'grab',at:'tip'},{t:.8,e:'soulDrainRag'},{t:1.15,e:'soulDrainRag'},{t:1.5,e:'release',imp:[0,1,3],shake:.12}]},
    orProphecy:{name:'Last Prophecy',contact:.85,victim:'kneel',keys:[{t:0},{t:.4,L:[-.04,.15,.5],wL:[0,1,.2],lean:.25,fwd:.2},{t:1.3,L:[-.04,.17,.5],lean:.28},{t:1.6,e:'o',L:[-.3,.4,.15],lean:-.25},{t:1.9},R_(2.3)],
      ev:[{t:.4,e:'soulCharge'},{t:.8,e:'wisp'},{t:1.1,e:'wisp'},{t:1.6,e:'kill',imp:[0,.3,1.2],fx:'soul'}]},
  },
  reaper:{
    grHarvest:{name:'The Harvest',contact:1.55,keys:[{t:0},{t:.3,...GR.REAPW,twist:-.6,crouch:.1},{t:.52,e:'o',...GR.REAP,twist:.5,lean:.3,fwd:.25},{t:.75},R_(1.2)],
      ev:[{t:.52,e:'kill',imp:[-1.5,1,1],decap:true,headImp:[-4,4.5,1.5],fx:'soul',shake:.2},{t:.7,e:'wisp'}]},
    grGallows:{name:'Gallows',contact:1.5,keys:[{t:0},{t:.25,...GR.HIGHW,lean:-.12},{t:.42,e:'o',...GR.HIGHC,lean:.4,fwd:.2},{t:.8,R:[.12,.35,.3],wR:[0,.95,.3],lean:-.15},
      {t:1.1,R:[.1,.5,.05],wR:[0,.9,-.4],lean:-.3},{t:1.35,e:'o',R:[.12,.35,-.25],wR:[0,.2,-.98],lean:-.4,twist:-.2},{t:1.65},R_(2.1)],
      ev:[{t:.42,e:'grab',at:'tip'},{t:1.33,e:'release',imp:[0,-9,-4],slam:1,shake:.3}]},
    grSpinBehead:{name:'Whirling Death',contact:1.55,keys:[{t:0,...GR.REAPW,crouch:.12},{t:.18,yaw:-.6,twist:-.4,crouch:.2},{t:.62,e:'l',yaw:6.28,...GR.REAP,crouch:.15,fwd:.35},{t:.85},R_(1.25,{yaw:6.28})],
      ev:[{t:.56,e:'kill',imp:[2,1.5,1.5],decap:true,headImp:[5,4,1],shake:.2}]},
    grShadowExec:{name:'Shadow Execution',contact:1.5,keys:[{t:0},{t:.2,...GR.REAPW,twist:-.4,lean:.15},{t:.36,e:'o',...GR.REAP,twist:.5,lean:.45,fwd:.6},{t:.6},R_(1.0)],
      ev:[{t:.1,e:'ghost'},{t:.36,e:'kill',decap:true,imp:[0,.5,1.5],headImp:[-2,4,3],fx:'soul',shake:.2}]},
    grKneelExec:{name:'Kneel Before Death',contact:1.45,keys:[{t:0},{t:.22,R:[.22,.05,.05],wR:[0,.35,-.94],twist:-.3},{t:.34,e:'o',R:[.1,-.05,.5],wR:[0,.3,-.95],twist:.25,lean:.35,fwd:.25},
      {t:.7,...GR.HIGHW,lean:-.2},{t:1.1,...TW([.1,.58,-.1],[0,.2,-.98],.42),lean:-.28},{t:1.35,e:'o',...GR.HIGHC,lean:.55,crouch:.25,fwd:.2},{t:1.55,...GR.FOLLOW,lean:.6,crouch:.3},{t:1.9},R_(2.3)],
      ev:[{t:.34,e:'jolt',victim:'kneel',mag:1},{t:1.35,e:'kill',decap:true,imp:[0,-1,.8],headImp:[0,4.5,2.5],fx:'soul',shake:.25}]},
    grSoulRip:{name:'Soul Rip',contact:.9,keys:[{t:0},{t:.35,e:'o',L:[-.06,.08,.6],wL:[0,0,1],lean:.3,fwd:.3},{t:.9,L:[-.06,.1,.62],lean:.25},{t:1.25,e:'o',L:[-.3,.35,.1],lean:-.3},{t:1.6},R_(2.0)],
      ev:[{t:.35,e:'jolt',victim:'kneel',mag:.8},{t:.6,e:'soulDrain'},{t:.9,e:'soulDrain'},{t:1.25,e:'kill',imp:[0,1,1.5],fx:'soul'}]},
  },
  hades:{
    hdSkewer:{name:'Skewer of the Damned',contact:2.3,keys:[{t:0},{t:.3,...HD.THW,crouch:.15,twist:-.3},{t:.48,e:'o',...HD.TH,lean:.4,fwd:.35,twist:.25},{t:.95,...HD.HIGH,lean:-.15},{t:1.3,lean:-.2},{t:1.6,e:'o',...HD.SLAM,lean:.6,crouch:.3,fwd:.2},{t:1.9},R_(2.4)],
      ev:[{t:.48,e:'grab',at:'tip'},{t:1.0,e:'hadesFire'},{t:1.58,e:'release',imp:[0,-16,3],slam:1,shake:.4},{t:1.6,e:'hellfire',r:2.6}]},
    hdCrush:{name:'Underfoot',contact:1.9,keys:[{t:0},{t:.3,...HD.SIDEW,twist:-.5},{t:.5,e:'o',...HD.SIDE,twist:.45,lean:.3,fwd:.2},{t:.9,kick:.7,lean:-.2},{t:1.15,e:'o',kick:0,lean:.25,crouch:.3,fwd:.3},{t:1.5},R_(1.9)],
      ev:[{t:.5,e:'knock',imp:[-2,1.5,1.5]},{t:1.15,e:'stabRag',at:'foot',imp:[0,-6,.5],part:'chest',ring:1,shake:.4}]},
    hdBurn:{name:'Burning Grip',contact:1.6,keys:[{t:0},{t:.35,e:'o',L:[-.06,.3,.58],wL:[0,1,0],lean:.3,fwd:.3},{t:.8,L:[-.08,.55,.45],lean:-.15},{t:1.5,L:[-.08,.58,.44],lean:-.18},{t:1.8,e:'o',L:[-.4,.3,.3],lean:.2,twist:.5},{t:2.1},R_(2.5)],
      ev:[{t:.35,e:'grab',at:'hL'},{t:.7,e:'hadesFire'},{t:1.1,e:'hadesFire'},{t:1.45,e:'hadesFire'},{t:1.78,e:'release',imp:[-8,3,2],shake:.25}]},
    hdSplit:{name:'Sunder',contact:2.2,victim:'kneel',keys:[{t:0},{t:.5,...HD.UP,lean:-.25},{t:.8,e:'o',...HD.SLAM,lean:.6,crouch:.35,fwd:.2},{t:1.05,lean:.55,crouch:.35},{t:1.4},R_(1.9)],
      ev:[{t:.8,e:'kill',imp:[0,-3,1],ring:1,shake:.45},{t:.8,e:'hellfire',r:3}]},
    hdToss:{name:"Hades' Toss",contact:2.2,keys:[{t:0},{t:.3,...HD.LOWW,crouch:.35,lean:.4,twist:-.4},{t:.52,e:'o',...HD.RISE,crouch:0,lean:-.25,twist:.3,fwd:.35},{t:.8},R_(1.3)],
      ev:[{t:.52,e:'kill',imp:[0,13,2],spin:8,shake:.3},{t:.55,e:'hadesFire'}]},
  },
};
for(const t in FIN_C2){ FINS[t]=[]; for(const n in FIN_C2[t]){ const d=FIN_C2[t][n];
  RAW[t][n]={keys:d.keys,ev:d.ev}; FIN[n]={name:d.name,clip:n,contact:d.contact,victim:d.victim}; FINS[t].push(n); } }
Object.assign(FIN_AIM_X,{
  brScissor:[[.5,'blade','neck']],brImpaleLift:[[.35,'tip','chest']],brFrenzy:[[.22,'blade','chest'],[.62,'blade','chest']],
  bmPointBlank:[[.5,'tip','chest']],
  orStaffImpale:[[.42,'tip','chest']],
  grHarvest:[[.52,'blade','neck']],grGallows:[[.42,'tip','chest']],grKneelExec:[[1.35,'blade','neck']],grSoulRip:[[.35,'hL','chest']],
  hdSkewer:[[.48,'tip','chest']],hdBurn:[[.35,'hL','neck']],hdSplit:[[.8,'tip','head']],
});
Object.assign(FIN_HIT_X,{brDeathWhirl:{.45:'neck'},brRibBreaker:{.3:'gut',.95:'chest',1.3:'chest'},bmSkyFuse:{.36:'chest'},bmHotFoot:{.95:'chest'},
  orImplode:{.4:'chest',.75:'chest'},orHexStrangle:{.4:'chest',1.5:'chest'},orProphecy:{1.6:'head'},orSoulSight:{.35:'chest'},
  grSpinBehead:{.56:'neck'},grShadowExec:{.36:'neck'},grSoulRip:{1.25:'chest'},hdToss:{.52:'chest'}});

// ---- charges: the run is how it carries itself at a sprint; the keys are the blow it crashes in with ----
for(const t of CHAOS2) CHG[t]=[];
chg('boner','crossRun','Crossing Charge',{...BR.XW,lean:.3},[{t:.1,lean:.35},{t:.24,e:'o',...BR.X,lean:.45,fwd:.6},{t:.38},R_(.75)],[HIT(.24,['blade','chest'],{dmg:1.2,kb:2.4})]);
chg('boner','thrustRun','Impaling Rush',{...BR.THW,lean:.35},[{t:.1,crouch:.1},{t:.24,e:'o',...BR.TH,lean:.45,fwd:.7},{t:.38},R_(.75)],[HIT(.24,['tip','chest'],{dmg:1.3,kb:3})]);
chg('boner','spinRun','Whirling Charge',{...BR.OUT},[{t:.06,yaw:-.4},{t:.4,e:'l',yaw:6.28,...BR.OUT,fwd:.5},{t:.52},R_(.9,{yaw:6.28})],[{t:.3,e:'hit',arc:1.1,around:1,dmg:.9,kb:2.4}]);
chg('boner','leapRun','Grave Pounce',{...BR.DOWNW},[{t:.08,crouch:.3},{t:.26,jump:.75,...BR.DOWNW,crouch:0,fwd:.4},{t:.42,e:'o',jump:.2,...BR.DOWN,lean:.55,fwd:.85},{t:.52,jump:0,crouch:.3,fwd:.95},R_(.9)],[HIT(.42,['blade','head'],{dmg:1.4,kb:2}),{t:.52,e:'land'}]);
chg('bomber','bombRun','Running Bomb',{...BM.HOLD,lean:.3},[{t:.1,...BM.WIND},{t:.3,e:'o',...BM.REL,fwd:.4},{t:.5},R_(.9)],[{t:.3,e:'bomb',dmg:1}]);
chg('bomber','leapBomb','Leaping Bomb',{...BM.HOLD},[{t:.08,crouch:.3},{t:.25,jump:.8,...BM.WIND,crouch:0,fwd:.4},{t:.42,e:'o',jump:.4,...BM.REL,fwd:.8},{t:.55,jump:0,crouch:.3},R_(.95)],[{t:.42,e:'bomb',dmg:1,lob:1},{t:.55,e:'land'}]);
chg('bomber','slideBomb','Slide Toss',{...BM.HOLD,lean:.3},[{t:.12,crouch:.4,lean:-.15,fwd:.5},{t:.3,e:'o',...BM.LOWR,crouch:.42,fwd:.9},{t:.5},R_(.9)],[{t:.3,e:'bomb',roll:1,dmg:1.1}]);
chg('bomber','clusterRun','Cluster Run',{...BM.HOLD},[{t:.12,...BM.WIND},{t:.32,e:'o',...BM.REL,fwd:.5},{t:.5},R_(.9)],[{t:.32,e:'bomb',n:3,dmg:.5,lob:1,spread:.22}]);
chg('oracle','boltRun','Running Bolt',{...OR.POINT,lean:.15},[{t:.1,...OR.RAISE,lean:.1},{t:.3,e:'o',...OR.POINT,lean:.3,fwd:.5},{t:.5},R_(.9)],[{t:.3,e:'voidBolt',dmg:1}]);
chg('oracle','hexRun','Running Hex',{...OR.RAISE},[{t:.2,...OR.PALMUP},{t:.4,e:'o',...OR.POINT,...OR.PALM,lean:.3,fwd:.5},{t:.6},R_(1.0)],[{t:.4,e:'voidBolt',dmg:.8,rend:1}]);
chg('oracle','ghostDash','Ghost Dash',{...OR.REST,lean:.4},[{t:.12,lean:.5,fwd:.8},{t:.3,e:'o',...OR.POINT,lean:.2,fwd:1.4},{t:.5},R_(.9)],[{t:.12,e:'ghost'},{t:.3,e:'voidBolt',dmg:1.1}]);
chg('oracle','beamRun','Eye Beam Run',{...OR.RAISE},[{t:.25,lean:-.1},{t:.45,e:'o',...OR.POINT,lean:.35,fwd:.6},{t:.65},R_(1.0)],[{t:.45,e:'voidBolt',dmg:1.5,big:1}]);
chg('reaper','reapRun','Reaping Charge',{...GR.REAPW},[{t:.1,twist:-.5},{t:.28,e:'o',...GR.REAP,twist:.5,lean:.35,fwd:.6},{t:.44,...GR.BACKW},R_(.95)],[{t:.28,e:'hit',arc:1.3,dmg:1.1,kb:3}]);
chg('reaper','shadowRun','Shadow Rush',{...GR.REST,lean:.45},[{t:.1,lean:.5,fwd:.8},{t:.28,e:'o',...GR.REAP,twist:.5,lean:.4,fwd:1.3},{t:.5},R_(.9)],[{t:.1,e:'ghost'},{t:.28,e:'hit',arc:1.2,dmg:1.2,kb:2.6}]);
chg('reaper','spinRun','Whirling Charge',{...GR.REAPW},[{t:.06,yaw:-.4},{t:.42,e:'l',yaw:6.28,...GR.REAP,fwd:.5},{t:.56},R_(.95,{yaw:6.28})],[{t:.3,e:'hit',arc:1.3,around:1,dmg:1,kb:3}]);
chg('reaper','overRun','Falling Scythe',{...GR.HIGHW},[{t:.12,...GR.HIGHW,lean:-.1},{t:.3,e:'o',...GR.HIGHC,lean:.6,crouch:.25,fwd:.7},{t:.46,...GR.FOLLOW},R_(.95)],[HIT(.3,['blade','head'],{arc:1,dmg:1.5,kb:2.6})]);
chg('hades','ramRun','Underworld Ram',{...HD.THW,lean:.3},[{t:.1,crouch:.12},{t:.28,e:'o',...HD.TH,lean:.5,fwd:.8},{t:.44},R_(.95)],[HIT(.28,['tip','chest'],{arc:1,dmg:1.3,kb:5})]);
chg('hades','sweepRun','Burning Sweep',{...HD.SIDEW},[{t:.1,twist:-.5},{t:.3,e:'o',...HD.SIDE,twist:.5,lean:.35,fwd:.6},{t:.48},R_(1.0)],[{t:.3,e:'hit',arc:1.5,dmg:1,kb:3.6},{t:.3,e:'hellfire',r:2.4}]);
chg('hades','slamRun','Falling Hellfire',{...HD.UP},[{t:.12,...HD.UP,lean:-.15},{t:.34,e:'o',...HD.SLAM,lean:.6,crouch:.3,fwd:.7},{t:.55},R_(1.1)],[{t:.34,e:'hit',aoe:1.1,dmg:1.2,kb:4},{t:.34,e:'hellfire',r:3}]);
chg('hades','spinRun','Burning Whirl',{...HD.SIDEW},[{t:.06,yaw:-.4},{t:.45,e:'l',yaw:6.28,...HD.SIDE,fwd:.5},{t:.6},R_(1.05,{yaw:6.28})],[{t:.32,e:'hit',arc:1.5,around:1,dmg:.9,kb:3.6}]);
for(const t of CHAOS2) for(const c of CHG[t]) RAW[t]['chg_'+c.id]={keys:c.keys,ev:c.ev,aim:c.aim,atk:1};
