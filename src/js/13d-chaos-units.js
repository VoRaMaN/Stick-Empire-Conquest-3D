/* ================= Chaos Empire: Soulbound Thrall, Dreadguard, Soul Harvester =================
   Same animation system as every humanoid (chest-local hand targets x right / y up / z forward, weapon
   directions, body channels, events). Their gear, powers and brains live in 27b-chaos.js.
     Thrall      the Chaos worker: a hooded, shackled soul that digs soul crystals with a mattock and fights
                 like a cornered animal when it has to
     Dreadguard  heavy infantry: horned helm, spiked plate, a long executioner's axe swung with both hands
     Harvester   the ranged caster: a skull-headed reaper whose scythe looses fragments of stolen souls */
Object.assign(TYPES,{
  thrall:{name:'Soulbound Thrall',engage:1.5,reach:.95,s:.93,hp:55,dmg:8,range:1.0,speed:3.0,cd:1.0,cost:50,thick:.88,turn:9,
    worker:true,chaos:true,gearX:true,body:[new THREE.Color('#2e2824'),new THREE.Color('#2e2824')]},
  dread:{name:'Dreadguard',engage:2.15,reach:1.35,s:1.18,hp:190,dmg:30,range:1.4,speed:2.5,cd:1.4,cost:150,thick:1.28,turn:6.5,armor:.2,plateLimbs:true,shW:.105,
    chaos:true,gearX:true,body:[new THREE.Color('#141112'),new THREE.Color('#1c0e10')]},
  harvester:{name:'Soul Harvester',engage:7,reach:1.4,s:1,hp:60,dmg:11,range:11,speed:2.7,cd:1.8,cost:120,thick:.86,turn:8,
    ranged:true,kite:4.2,finR:4,chgStop:6,chaos:true,gearX:true,skel:true,body:[new THREE.Color('#d6c9ab'),new THREE.Color('#d6c9ab')]},
});
TYPES.miner.worker=true;   // workers (Miner, Thrall) dig, carry and stay out of the battle line
for(const t of ['thrall','dread','harvester']) RAW[t]={};
const nz3=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; };
// two-handed grip: the left hand sits further down the haft (k metres below the right along the weapon)
const TW=(R,wR,k,o)=>{ const w=nz3(wR), kk=k===undefined?.36:k; return Object.assign({R,wR:w,L:[R[0]-w[0]*kk-.02,R[1]-w[1]*kk,R[2]-w[2]*kk]},o||{}); };

// ---- hand / weapon presets ----
const TH={UP:{R:[.12,.56,-.22],wR:[0,.45,-.9]},CHOP:{R:[.08,-.22,.48],wR:[0,-.65,.75]},SIDEW:{R:[.45,.05,-.12],wR:[.75,.25,-.6]},SIDE:{R:[-.12,-.05,.5],wR:[-.8,-.1,.55]},
  LOWW:{R:[.4,-.42,-.05],wR:[.7,-.5,-.45]},LOW:{R:[-.08,-.45,.42],wR:[-.6,-.55,.55]},RISE:{R:[.12,.5,.35],wR:[0,.95,.3]},DOWN:{R:[.08,-.35,.45],wR:[0,-.9,.4]}};
const DG={READY:TW([.12,-.12,.36],[.08,.75,.65]),SHLD:{R:[.22,.12,.1],wR:[.08,.35,-.93],L:[-.24,-.4,.2]},UP:TW([.1,.52,-.12],[.02,.35,-.94]),UPB:TW([.12,.48,-.3],[.05,-.1,-.99]),
  CHOP:TW([.1,-.08,.58],[0,-.5,.87]),LOW:TW([.1,-.4,.45],[0,-.92,.38]),SIDEW:TW([.46,.02,-.12],[.75,.12,-.65]),SIDE:TW([-.24,0,.46],[-.85,0,.52]),
  SIDEF:TW([-.38,0,.2],[-.8,0,-.4]),LOWW:TW([.32,-.45,-.12],[.3,-.75,-.6]),RISE:TW([.1,.42,.42],[0,.9,.42]),GUARD:TW([.2,.15,.4],[.95,.25,.1],.3)};
const HV={REST:{R:[.22,-.28,.2],wR:[.05,1,.12]},RAISE:{R:[.16,.42,.25],wR:[0,1,.35],pR:[.6,.2,.2]},POINT:{R:[.16,.1,.5],wR:[0,.55,.84]},
  REAPW:TW([.45,.1,-.05],[.5,.6,-.62],.4),REAP:TW([-.15,-.15,.5],[-.75,.1,.65],.4),CHOPU:{R:[.15,.5,-.1],wR:[0,.6,-.8]},CHOP:{R:[.12,-.05,.55],wR:[0,-.2,.98]}};
const KICKP={lean:-.1,L:[-.3,-.2,.2]};
// two-handed scythe grips for the Harvester's close fighting
Object.assign(HV,{HIGHW:TW([.1,.5,-.15],[0,.3,-.95],.4),HIGHC:TW([.08,0,.5],[0,-.35,.94],.4),LOWW:TW([.42,-.35,-.1],[.6,-.4,-.7],.4),LOWS:TW([-.2,-.4,.45],[-.75,-.35,.55],.4),
  RISE:TW([.1,.45,.4],[0,.95,.3],.4),BACKW:TW([-.35,.1,.15],[-.7,.4,-.55],.4),BACK:TW([.4,0,.4],[.85,.1,.5],.4),
  DIAG:TW([-.15,-.2,.5],[-.7,-.35,.62],.4),HOOK:TW([.1,-.3,.55],[0,-.6,.8],.4),YANK:TW([.12,-.25,.2],[0,-.3,.95],.4),FOLLOW:TW([.08,-.3,.45],[0,-.85,.5],.4)});

// ---- locomotion poses ----
Object.assign(POSES,{
  thrall:{idle:{R:[.18,-.14,.28],wR:[.05,.75,-.65],L:[-.2,-.46,.16],wL:[0,1,0],lean:.32,crouch:.08},move:{R:[.18,-.1,.28],wR:[.05,.75,-.65],L:[-.22,-.38,.28],lean:.42,crouch:.07},swingL:.36,swingR:0},
  dread:{idle:{...DG.READY,wL:[0,1,0],lean:.12,crouch:.06},move:{...DG.SHLD,lean:.22,crouch:.04},swingL:.3,swingR:.04},
  harvester:{idle:{...HV.REST,L:[-.2,-.4,.18],wL:[0,1,0],lean:.06,crouch:.02},move:{R:[.22,-.22,.3],wR:[.05,.95,.3],L:[-.24,-.36,.22],lean:.18},swingL:.3,swingR:.04},
});
for(const t of ['thrall','dread','harvester']){ POSES[t].idle=fillPose(POSES[t].idle,null); POSES[t].move=fillPose(POSES[t].move,POSES[t].idle); }

// ---- idles: 10 each ----
const IDLE_C={
  thrall:{
    twitch:{keys:[{t:0},{t:.4,look:-.8,side:-.05},{t:.6,look:-.6},{t:1.1,look:.8,side:.05},{t:1.3,look:.6},{t:1.7,look:0,side:0},R_(2.0)]},
    shiver:{keys:[{t:0},{t:.2,side:.06,crouch:.14},{t:.3,side:-.06},{t:.4,side:.06},{t:.5,side:-.06},{t:.6,side:.05},{t:.7,side:-.05},{t:.8,side:0},R_(1.1)]},
    chainRattle:{keys:[{t:0},{t:.3,L:[-.25,.05,.35],look:-.3},{t:.45,L:[-.2,.12,.38]},{t:.6,L:[-.25,.05,.35]},{t:.75,L:[-.2,.12,.38]},{t:.9,L:[-.25,.05,.35]},R_(1.3)],ev:[{t:.45,e:'chain'},{t:.75,e:'chain'}]},
    kneelPray:{keys:[{t:0},{t:.6,crouch:.42,lean:.5,L:[-.15,-.45,.35]},{t:2.0,lean:.56},{t:2.5},R_(3.0)]},
    crystalGaze:{keys:[{t:0},{t:.5,L:[-.06,.02,.36],look:-.15,lean:.24},{t:1.6,L:[-.05,.05,.34],look:.1},{t:2.1},R_(2.5)],ev:[{t:.5,e:'crystal'}]},
    leanOnPick:{keys:[{t:0},{t:.6,R:[.12,-.36,.4],wR:[0,-.9,.35],L:[-.05,-.33,.4],lean:.3,crouch:.06},{t:2.0,look:-.35},{t:2.8,look:0},R_(3.3)]},
    pickTwirl:IDLE_COMMON.twirl('R','wR',[.28,-.18,.36],SPIN4),
    hoodTug:{keys:[{t:0},{t:.4,L:[-.15,.38,.12],look:.15},{t:.7,L:[-.1,.42,.14]},{t:1.0,L:[-.15,.38,.12]},R_(1.4)]},
    groan:{keys:[{t:0},{t:.8,side:.18,lean:.45,look:-.3},{t:1.7,side:-.18,look:.3},{t:2.4,side:0,look:0},R_(2.8)],ev:[{t:.8,e:'groan'}]},
    scratch:{keys:[{t:0},{t:.4,L:[.1,0,.3],look:.3,side:.1},{t:.55,L:[.12,.06,.28]},{t:.7,L:[.1,0,.3]},{t:.85,L:[.12,.06,.28]},{t:1.0,L:[.1,0,.3]},R_(1.4)]},
  },
  dread:{
    lookAround:IDLE_COMMON.lookAround(),
    axeRest:{keys:[{t:0},{t:.6,...DG.SHLD,look:.3},{t:2.0,look:-.3},{t:2.8,look:0},R_(3.3)]},
    sharpen:{keys:[{t:0},{t:.5,R:[.12,-.05,.42],wR:[-.9,.4,.1],pR:[.6,-.3,.2],L:[.05,0,.45],look:-.1,lean:.15},{t:.75,L:[-.15,.05,.45]},{t:1.0,L:[.05,0,.45]},{t:1.25,L:[-.15,.05,.45]},{t:1.5,L:[.05,0,.45]},{t:1.9},R_(2.3)],ev:[{t:.75,e:'whet'},{t:1.25,e:'whet'}]},
    roar:{keys:[{t:0},{t:.4,...DG.READY,L:[-.45,.15,.15],lean:-.2,crouch:.15},{t:1.4,L:[-.47,.2,.12]},{t:1.8},R_(2.3)],ev:[{t:.45,e:'dreadRoar'}]},
    groundRest:{keys:[{t:0},{t:.6,R:[.1,-.25,.42],wR:[0,-1,.08],L:[-.04,-.22,.42],lean:.05,crouch:.03},{t:2.2,look:.3},{t:2.9,look:0},R_(3.4)]},
    chainRattle:{keys:[{t:0},{t:.3,side:.12},{t:.45,side:-.12},{t:.6,side:.12},{t:.75,side:-.1},{t:.9,side:0},R_(1.3)],ev:[{t:.45,e:'chain'},{t:.75,e:'chain'}]},
    neckCrack:{keys:[{t:0},{t:.3,look:-.6,side:-.18},{t:.45,look:-.75},{t:.8,look:.6,side:.18},{t:.95,look:.75},{t:1.3,look:0,side:0},R_(1.6)]},
    heave:{keys:[{t:0},{t:.5,crouch:.12,lean:.25},{t:1.0,crouch:.02,lean:.15},{t:1.5,crouch:.12,lean:.25},{t:2.0,crouch:.02,lean:.15},R_(2.4)]},
    practice:{keys:[{t:0},{t:.4,...DG.SIDEW,twist:-.4},{t:.8,...DG.SIDE,twist:.3},{t:1.2,...DG.SIDEW,twist:-.4},{t:1.6,...DG.SIDE,twist:.3},R_(2.1)]},
    helmTap:{keys:[{t:0},{t:.4,L:[-.12,.42,.2],look:.1},{t:.55,L:[-.1,.47,.24]},{t:.7,L:[-.12,.42,.2]},{t:.85,L:[-.1,.47,.24]},R_(1.3)],ev:[{t:.55,e:'clank'},{t:.85,e:'clank'}]},
  },
  harvester:{
    lookAround:IDLE_COMMON.lookAround(),
    skullTilt:{keys:[{t:0},{t:.5,side:.2,look:.4},{t:1.4,side:.22},{t:1.8,side:-.15,look:-.3},{t:2.6,side:0,look:0},R_(3.0)]},
    soulGaze:{keys:[{t:0},{t:.5,L:[-.06,.1,.38],wL:[0,1,0],look:-.1,lean:.12},{t:1.8,L:[-.04,.14,.36]},{t:2.2},R_(2.6)],ev:[{t:.5,e:'wisp'}]},
    scytheTwirl:IDLE_COMMON.twirl('R','wR',[.22,-.05,.32],[[0,1,0],[1,0,0],[0,-1,0],[-1,0,0],[0,1,0],[1,0,0],[0,-1,0],[0,1,.1]],.22),
    whisper:{keys:[{t:0},{t:.4,L:[-.04,.28,.25],look:.35,lean:.05},{t:1.4,look:.4},{t:1.8},R_(2.2)]},
    kneelHarvest:{keys:[{t:0},{t:.6,crouch:.45,lean:.4,L:[-.12,-.5,.4],wL:[0,-1,0]},{t:2.0,crouch:.46},{t:2.5},R_(3.0)],ev:[{t:.8,e:'wisp'},{t:1.4,e:'wisp'}]},
    beckon:{keys:[{t:0},{t:.4,L:[-.2,.1,.45],wL:[0,1,0]},{t:.6,L:[-.12,.15,.32]},{t:.8,L:[-.2,.1,.45]},{t:1.0,L:[-.12,.15,.32]},R_(1.4)]},
    leanOnScythe:{keys:[{t:0},{t:.6,R:[.12,-.1,.3],wR:[0,1,.06],L:[-.02,-.04,.32],lean:.12},{t:2.0,look:-.35},{t:2.8,look:0},R_(3.3)]},
    capeSwirl:{keys:[{t:0},{t:.3,yaw:-.3},{t:.9,e:'l',yaw:6.28,L:[-.4,.1,0]},{t:1.1},R_(1.4,{yaw:6.28})]},
    sway:{keys:[{t:0},{t:.8,side:.14,look:-.3},{t:1.8,side:-.14,look:.3},{t:2.6,side:0,look:0},R_(3.0)]},
  },
};
Object.assign(IDLE_NAMES,{twitch:'Twitch',shiver:'Shiver',chainRattle:'Rattle Chains',kneelPray:'Bow to the Abyss',crystalGaze:'Gaze at a Crystal',leanOnPick:'Lean on Mattock',
  pickTwirl:'Mattock Twirl',hoodTug:'Tug Hood',groan:'Groan',scratch:'Scratch Shackle',axeRest:'Axe on Shoulder',sharpen:'Whet the Axe',groundRest:'Rest on the Axe',
  heave:'Heavy Breathing',practice:'Practice Swings',helmTap:'Knock Helm',skullTilt:'Skull Tilt',soulGaze:'Hold a Soul',scytheTwirl:'Scythe Twirl',whisper:'Whisper',
  kneelHarvest:'Harvest the Dead',beckon:'Beckon',leanOnScythe:'Lean on Scythe',capeSwirl:'Cape Swirl'});
for(const t in IDLE_C){ IDLES[t]=[]; for(const n in IDLE_C[t]){ const c=IDLE_C[t][n]; c.idle=1; RAW[t]['idle_'+n]=c; IDLES[t].push('idle_'+n); } }

// ---- moves: 11 each ----
const MOVES_C={
  thrall:{
    mine:{keys:[{t:0,R:[.15,.4,-.1],wR:[0,.9,-.4],lean:.15},{t:.25,R:[.1,.55,-.2],wR:[0,.6,-.8],lean:-.1},{t:.38,e:'o',R:[.05,-.25,.45],wR:[0,-.6,.8],lean:.55,crouch:.22,fwd:.3},{t:.5},R_(.75)],ev:[{t:.38,e:'hit'}]},
    thHook:{keys:[{t:0},{t:.16,...TH.SIDEW,twist:-.45,crouch:.1},{t:.32,e:'o',...TH.SIDE,twist:.4,lean:.35,fwd:.25},{t:.46},R_(.8)],ev:[{t:.32,e:'hit'}]},
    thChop2:{keys:[{t:0},{t:.14,...TH.UP,lean:-.1},{t:.26,e:'o',...TH.CHOP,lean:.45,crouch:.15,fwd:.15},{t:.4,...TH.UP,lean:-.05},{t:.52,e:'o',...TH.CHOP,lean:.5,crouch:.18,fwd:.3},{t:.64},R_(.95)],ev:[{t:.26,e:'hit',dmg:.55},{t:.52,e:'hit',dmg:.6}]},
    thButt:{keys:[{t:0},{t:.14,R:[.22,0,.05],wR:[0,.3,-.95],twist:-.35,crouch:.08},{t:.26,e:'o',R:[.1,.02,.5],wR:[0,.25,-.97],twist:.3,lean:.35,fwd:.3},{t:.4},R_(.7)],ev:[{t:.26,e:'hit',dmg:.6,kb:1.6}]},
    thChainLash:{keys:[{t:0},{t:.15,L:[-.45,.25,-.1],twist:.4,crouch:.05},{t:.3,e:'o',L:[.1,.05,.6],twist:-.45,lean:.3,fwd:.2},{t:.45},R_(.8)],ev:[{t:.3,e:'hit',dmg:.55,kb:1.4}]},
    thHeadbutt:{keys:[{t:0},{t:.18,lean:-.3,crouch:.1},{t:.3,e:'o',lean:.55,fwd:.35,crouch:.05},{t:.45},R_(.75)],ev:[{t:.3,e:'hit',dmg:.5,kb:2}]},
    thKick:{keys:[{t:0},{t:.2,...KICKP},{t:.32,e:'o',kick:1,lean:-.3,fwd:.1},{t:.46,kick:0},R_(.75)],ev:[{t:.32,e:'hit',dmg:.45,kb:2.6}]},
    thFlail:{keys:[{t:0},{t:.1,...TH.UP,lean:-.05},{t:.2,e:'o',...TH.CHOP,lean:.4,fwd:.1},{t:.3,...TH.SIDEW,twist:-.4},{t:.4,e:'o',...TH.SIDE,twist:.4,lean:.3,fwd:.2},{t:.5,...TH.UP},{t:.6,e:'o',...TH.CHOP,lean:.5,crouch:.15,fwd:.3},{t:.72},R_(1.0)],
      ev:[{t:.2,e:'hit',dmg:.4},{t:.4,e:'hit',dmg:.4},{t:.6,e:'hit',dmg:.5}]},
    thLeapChop:{keys:[{t:0,crouch:.3},{t:.15,crouch:.36},{t:.35,e:'o',jump:.8,fwd:.6,...TH.UP,lean:-.15,crouch:0},{t:.5,e:'o',jump:.2,fwd:1.1,...TH.CHOP,lean:.6,crouch:.1},{t:.6,jump:0,fwd:1.2,crouch:.36},R_(.95)],ev:[{t:.5,e:'hit',dmg:1.2},{t:.6,e:'land'}]},
    thUppercut:{keys:[{t:0},{t:.14,...TH.LOWW,crouch:.3,lean:.35,twist:-.3},{t:.28,e:'o',...TH.RISE,crouch:0,lean:-.1,twist:.3,fwd:.3},{t:.4},R_(.75)],ev:[{t:.28,e:'hit',dmg:.8,up:2.2}]},
    thSweep:{keys:[{t:0},{t:.12,...TH.LOWW,crouch:.35,lean:.35,twist:-.45},{t:.28,e:'o',...TH.LOW,crouch:.4,lean:.45,twist:.4,fwd:.2},{t:.4},R_(.8)],ev:[{t:.28,e:'hit',dmg:.6,kb:.8}]},
  },
  dread:{
    dgOverhead:{keys:[{t:0},{t:.35,...DG.UP,lean:-.2,crouch:.05,twist:-.1},{t:.58,e:'o',...DG.CHOP,lean:.55,crouch:.25,fwd:.35,twist:.1},{t:.72,...DG.LOW,lean:.6,crouch:.3},R_(1.15)],ev:[{t:.58,e:'hit',dmg:1.1,kb:2.4}]},
    dgSweep:{keys:[{t:0},{t:.3,...DG.SIDEW,twist:-.55,crouch:.12,lean:.05},{t:.52,e:'o',...DG.SIDE,twist:.45,lean:.3,crouch:.15,fwd:.25},{t:.68,...DG.SIDEF,twist:.6},R_(1.1)],ev:[{t:.52,e:'hit',arc:1,dmg:.85,kb:2.6}]},
    dgUpswing:{keys:[{t:0},{t:.25,...DG.LOWW,crouch:.25,lean:.3,twist:-.35},{t:.45,e:'o',...DG.RISE,crouch:0,lean:-.15,twist:.25,fwd:.3},{t:.6},R_(1.0)],ev:[{t:.45,e:'hit',dmg:1,up:2.5,kb:2}]},
    dgDoubleChop:{keys:[{t:0},{t:.28,...DG.UP,lean:-.15},{t:.48,e:'o',...DG.CHOP,lean:.5,crouch:.2,fwd:.2},{t:.72,...DG.UP,lean:-.1,crouch:.05},{t:.92,e:'o',...DG.CHOP,lean:.55,crouch:.25,fwd:.35},{t:1.08,...DG.LOW},R_(1.45)],
      ev:[{t:.48,e:'hit',dmg:.7},{t:.92,e:'hit',dmg:.8}]},
    dgShoulder:{keys:[{t:0},{t:.2,...DG.SHLD,twist:.5,crouch:.15,lean:.1},{t:.36,e:'o',twist:.6,lean:.45,crouch:.1,fwd:.7},{t:.52,twist:.2},R_(.9)],ev:[{t:.36,e:'hit',dmg:.6,kb:3.6}]},
    dgHaftJab:{keys:[{t:0},{t:.18,...TW([.2,.05,.1],[.1,.35,-.93]),twist:-.3,crouch:.08},{t:.32,e:'o',...TW([.08,.05,.55],[.05,.3,-.95]),twist:.3,lean:.35,fwd:.35},{t:.46},R_(.85)],ev:[{t:.32,e:'hit',dmg:.5,kb:2.2}]},
    dgStomp:{keys:[{t:0},{t:.25,kick:.6,lean:-.2},{t:.42,e:'o',kick:1,lean:-.35,fwd:.15},{t:.56,kick:0,lean:.1},R_(.9)],ev:[{t:.42,e:'hit',dmg:.5,kb:3.2}]},
    dgSpin:{keys:[{t:0,...DG.SIDEW,crouch:.15},{t:.15,yaw:-.5,crouch:.2},{t:.6,e:'l',yaw:6.28,...DG.SIDE,crouch:.2,fwd:.3},{t:.75,...DG.SIDEF},R_(1.1,{yaw:6.28})],ev:[{t:.5,e:'hit',arc:1.2,dmg:.8,kb:2.8}]},
    dgSlam:{keys:[{t:0},{t:.4,...DG.UPB,lean:-.25,crouch:.05},{t:.65,e:'o',...DG.LOW,lean:.7,crouch:.4,fwd:.3},{t:.95,lean:.6,crouch:.35},R_(1.35)],ev:[{t:.65,e:'hit',aoe:.85,dmg:.9,kb:3.4}]},
    dgBackhand:{keys:[{t:0},{t:.25,...DG.SIDEF,twist:.5,crouch:.1},{t:.45,e:'o',...TW([.3,0,.4],[.85,0,.5]),twist:-.45,lean:.25,fwd:.25},{t:.6,...DG.SIDEW,twist:-.5},R_(1.0)],ev:[{t:.45,e:'hit',dmg:.9,kb:2.6}]},
    dgCleave:{keys:[{t:0},{t:.45,...DG.SIDEW,twist:-.7,crouch:.2,lean:-.05},{t:.7,e:'o',...DG.SIDE,twist:.6,lean:.4,crouch:.25,fwd:.45},{t:.9,...DG.SIDEF,twist:.75,lean:.3},R_(1.45)],
      ev:[{t:.25,e:'forge'},{t:.7,e:'hit',arc:1.6,dmg:1.35,kb:4.4,cleave:1}]},
  },
  harvester:{
    soulBolt:{keys:[{t:0},{t:.35,...HV.RAISE,lean:-.08,twist:-.15},{t:.62,e:'o',...HV.POINT,lean:.2,twist:.2,fwd:.05},{t:.8,R:[.17,.12,.48]},R_(1.2)],ev:[{t:.25,e:'soulCharge'},{t:.62,e:'soul',dmg:1}]},
    soulVolley:{keys:[{t:0},{t:.25,...HV.RAISE},{t:.4,e:'o',...HV.POINT,twist:-.15},{t:.55,R:[.16,.25,.4],wR:[0,.8,.6]},{t:.7,e:'o',...HV.POINT,twist:.1},{t:.85,R:[.16,.25,.4],wR:[0,.8,.6]},{t:1.0,e:'o',...HV.POINT,twist:.2},{t:1.15},R_(1.55)],
      ev:[{t:.4,e:'soul',dmg:.45},{t:.7,e:'soul',dmg:.45},{t:1.0,e:'soul',dmg:.45}]},
    soulLance:{keys:[{t:0},{t:.5,...HV.RAISE,L:[-.2,.35,.3],lean:-.15},{t:.85,e:'o',...HV.POINT,L:[-.1,.15,.5],lean:.3,fwd:.1},{t:1.05},R_(1.5)],ev:[{t:.3,e:'soulCharge'},{t:.85,e:'soul',dmg:1.6,big:1}]},
    soulWail:{keys:[{t:0},{t:.3,lean:-.25,R:[.3,-.2,.1],L:[-.3,.1,.2],crouch:.05},{t:.5,e:'o',lean:.35,L:[-.35,.25,.3],R:[.35,0,.2],fwd:.1},{t:1.1,lean:.3},{t:1.3},R_(1.6)],ev:[{t:.5,e:'wail'}]},
    palmSouls:{keys:[{t:0},{t:.25,L:[-.3,.05,0],wL:[0,0,1],twist:.35,crouch:.08},{t:.42,e:'o',L:[-.12,.12,.58],wL:[0,0,1],twist:-.35,lean:.2,fwd:.1},{t:.6},R_(.95)],ev:[{t:.42,e:'soul',dmg:.75,from:'hL'}]},
    reap:{keys:[{t:0},{t:.2,...HV.REAPW,twist:-.5,crouch:.1},{t:.4,e:'o',...HV.REAP,twist:.45,lean:.3,fwd:.2},{t:.55},R_(.9)],ev:[{t:.4,e:'hit',arc:1,dmg:.9,kb:2}]},
    hookPull:{keys:[{t:0},{t:.2,...HV.CHOPU,lean:-.1},{t:.36,e:'o',...HV.CHOP,lean:.4,fwd:.2},{t:.55,R:[.16,-.1,.2],wR:[0,.2,.98],lean:-.1,fwd:-.1},R_(.95)],ev:[{t:.36,e:'hit',dmg:.8,kb:-1.5}]},
    scytheChop:{keys:[{t:0},{t:.25,...HV.CHOPU,lean:-.15},{t:.42,e:'o',...HV.CHOP,lean:.5,crouch:.15,fwd:.25},{t:.58},R_(.95)],ev:[{t:.42,e:'hit',dmg:1}]},
    haftJab:{keys:[{t:0},{t:.14,R:[.24,0,.05],wR:[0,.35,-.94],twist:-.4,crouch:.08},{t:.26,e:'o',R:[.12,0,.55],wR:[0,.3,-.95],twist:.3,lean:.35,fwd:.3},{t:.4},R_(.75)],ev:[{t:.26,e:'hit',dmg:.55,kb:1.8}]},
    soulRend:{keys:[{t:0},{t:.4,...HV.RAISE,L:[-.18,.4,.35],wL:[0,1,0],lean:-.1},{t:.7,e:'o',...HV.POINT,L:[-.12,.2,.5],lean:.25},{t:.9},R_(1.3)],ev:[{t:.3,e:'soulCharge'},{t:.7,e:'soul',dmg:.8,rend:1}]},
    backstepBolt:{keys:[{t:0},{t:.2,...HV.RAISE,fwd:-.4,lean:-.1},{t:.42,e:'o',...HV.POINT,fwd:-.8,lean:.15},{t:.6,fwd:-.9},R_(1.0)],ev:[{t:.42,e:'soul',dmg:.85}]},
    // ---- close fighting: twelve scythe, haft, bone and soul strikes for when an enemy gets near ----
    hvWideHarvest:{keys:[{t:0},{t:.28,...HV.REAPW,twist:-.6,crouch:.12,lean:.05},{t:.5,e:'o',...HV.REAP,twist:.55,lean:.3,crouch:.12,fwd:.3},{t:.66,...HV.BACKW,twist:.7},R_(1.05)],ev:[{t:.5,e:'hit',arc:1.4,dmg:.85,kb:2.4}]},
    hvDeathArc:{keys:[{t:0},{t:.32,...HV.HIGHW,lean:-.2,crouch:.04},{t:.52,e:'o',...HV.HIGHC,lean:.5,crouch:.22,fwd:.3},{t:.68,...HV.FOLLOW,lean:.55,crouch:.25},R_(1.1)],ev:[{t:.52,e:'hit',dmg:1.25,kb:2}]},
    hvBackReap:{keys:[{t:0},{t:.22,...HV.BACKW,twist:.5,crouch:.08},{t:.42,e:'o',...HV.BACK,twist:-.45,lean:.25,fwd:.25},{t:.56,...HV.REAPW,twist:-.55},R_(.95)],ev:[{t:.42,e:'hit',dmg:.95,kb:2.2}]},
    hvAnkleReaper:{keys:[{t:0},{t:.22,...HV.LOWW,crouch:.35,lean:.35,twist:-.45},{t:.42,e:'o',...HV.LOWS,crouch:.42,lean:.45,twist:.4,fwd:.25},{t:.58},R_(.95)],ev:[{t:.42,e:'hit',dmg:.7,kb:.6,kd:1}]},
    hvWhirl:{keys:[{t:0,...HV.REAPW,crouch:.12},{t:.15,yaw:-.5,crouch:.18},{t:.62,e:'l',yaw:6.28,...HV.REAP,crouch:.18,fwd:.3},{t:.78},R_(1.15,{yaw:6.28})],ev:[{t:.5,e:'hit',arc:1.3,dmg:.8,kb:2.6}]},
    hvHookTrip:{keys:[{t:0},{t:.22,...HV.HIGHW,lean:-.1},{t:.4,e:'o',...HV.HOOK,lean:.45,crouch:.25,fwd:.3},{t:.62,e:'o',...HV.YANK,lean:-.15,crouch:.15,fwd:-.15},R_(1.05)],ev:[{t:.62,e:'hit',dmg:.6,kb:-1.6,kd:1}]},
    hvTwinReap:{keys:[{t:0},{t:.2,...HV.REAPW,twist:-.5,crouch:.1},{t:.36,e:'o',...HV.REAP,twist:.45,lean:.3,fwd:.2},{t:.5,...HV.BACKW,twist:.5},{t:.66,e:'o',...HV.BACK,twist:-.45,lean:.3,fwd:.35},{t:.8},R_(1.15)],
      ev:[{t:.36,e:'hit',dmg:.6},{t:.66,e:'hit',dmg:.7,kb:2}]},
    hvPommelSmash:{keys:[{t:0},{t:.16,R:[.22,.15,.05],wR:[0,.5,-.87],twist:-.35,crouch:.05},{t:.3,e:'o',R:[.1,.32,.5],wR:[0,.45,-.89],twist:.3,lean:.35,fwd:.3},{t:.44},R_(.8)],ev:[{t:.3,e:'hit',dmg:.65,kb:2.4}]},
    hvBoneKick:{keys:[{t:0},{t:.2,...KICKP,...HV.RAISE},{t:.32,e:'o',kick:1,lean:-.3,fwd:.15},{t:.46,kick:0},R_(.8)],ev:[{t:.32,e:'hit',dmg:.5,kb:3}]},
    hvBoneClaw:{keys:[{t:0},{t:.16,L:[-.4,.3,-.05],wL:[0,1,0],twist:.45,crouch:.06},{t:.3,e:'o',L:[.08,-.05,.6],wL:[.3,-.6,.7],twist:-.45,lean:.35,fwd:.25},{t:.44},R_(.8)],ev:[{t:.3,e:'hit',dmg:.6,kb:1.2,rend:1}]},
    hvRisingReap:{keys:[{t:0},{t:.2,...HV.LOWW,crouch:.32,lean:.35,twist:-.35},{t:.4,e:'o',...HV.RISE,crouch:0,lean:-.15,twist:.3,fwd:.3},{t:.54},R_(.95)],ev:[{t:.4,e:'hit',dmg:.9,up:2.4,kb:1.6}]},
    hvSoulSlash:{keys:[{t:0},{t:.3,...HV.HIGHW,twist:-.3,lean:-.15},{t:.5,e:'o',...HV.DIAG,twist:.4,lean:.4,crouch:.18,fwd:.3},{t:.66},R_(1.05)],
      ev:[{t:.15,e:'soulCharge'},{t:.44,e:'soulTrail'},{t:.5,e:'hit',dmg:1.1,kb:2.2,rend:1}]},
  },
};
const ATTACKS_C={
  thrall:['mine','thHook','thChop2','thButt','thChainLash','thHeadbutt','thKick','thFlail','thLeapChop','thUppercut','thSweep'],
  dread:['dgOverhead','dgSweep','dgUpswing','dgDoubleChop','dgShoulder','dgHaftJab','dgStomp','dgSpin','dgSlam','dgBackhand','dgCleave'],
  harvester:['soulBolt','soulVolley','soulLance','soulWail','palmSouls','reap','hookPull','scytheChop','haftJab','soulRend','backstepBolt',
    'hvWideHarvest','hvDeathArc','hvBackReap','hvAnkleReaper','hvWhirl','hvHookTrip','hvTwinReap','hvPommelSmash','hvBoneKick','hvBoneClaw','hvRisingReap','hvSoulSlash'],
};
// the Harvester casts from range, but an enemy that gets within meleeR meets the scythe (27b: brain; 34: footwork)
const HV_MELEE=['reap','hookPull','scytheChop','haftJab','hvWideHarvest','hvDeathArc','hvBackReap','hvAnkleReaper','hvWhirl','hvHookTrip','hvTwinReap','hvPommelSmash','hvBoneKick','hvBoneClaw','hvRisingReap','hvSoulSlash'];
Object.assign(TYPES.harvester,{meleeR:2.4,meleeCd:.75,meleeSet:new Set(HV_MELEE)});
Object.assign(MOVE_NAMES,{thHook:'Mattock Hook',thChop2:'Double Chop',thButt:'Haft Jab',thChainLash:'Chain Lash',thHeadbutt:'Headbutt',thKick:'Kick',thFlail:'Flailing Frenzy',
  thLeapChop:'Leap Chop',thUppercut:'Rising Pick',thSweep:'Low Sweep',dgOverhead:'Overhead Chop',dgSweep:'Side Cleave',dgUpswing:'Upswing',dgDoubleChop:'Double Chop',
  dgShoulder:'Shoulder Bash',dgHaftJab:'Haft Jab',dgStomp:'Stomp Kick',dgSpin:'Whirling Axe',dgSlam:'Ground Slam',dgBackhand:'Backhand Cleave',dgCleave:'Hellforged Cleave',
  soulBolt:'Soul Fragment',soulVolley:'Soul Volley',soulLance:'Soul Lance',soulWail:'Wail of the Dead',palmSouls:'Palm of Souls',reap:'Reap',hookPull:'Hook & Pull',
  scytheChop:'Scythe Chop',haftJab:'Haft Jab',soulRend:'Soul Rend',backstepBolt:'Backstep Bolt',
  hvWideHarvest:'Wide Harvest',hvDeathArc:'Death Arc',hvBackReap:'Backhand Reap',hvAnkleReaper:'Ankle Reaper',hvWhirl:'Whirling Scythe',hvHookTrip:'Hook & Trip',
  hvTwinReap:'Twin Reap',hvPommelSmash:'Pommel Smash',hvBoneKick:'Bone Kick',hvBoneClaw:'Cursed Claw',hvRisingReap:'Rising Reap',hvSoulSlash:'Soul Slash'});
for(const t in MOVES_C){ Object.assign(RAW[t],MOVES_C[t]); TYPES[t].attacks=ATTACKS_C[t]; }
Object.assign(ATK_AIM_X,{
  thrall:{mine:[['pick','head']],thHook:[['pick','chest']],thChop2:[['pick','head'],['pick','chest']],thButt:[['pommel','head']],thChainLash:[['hL','chest']],thHeadbutt:[['head','chest']],
    thKick:[['foot','gut']],thFlail:[['pick','head'],['pick','chest'],['pick','head']],thLeapChop:[['pick','head']],thUppercut:[['pick','head']],thSweep:[['pick','shin']]},
  dread:{dgOverhead:[['blade','head']],dgUpswing:[['blade','chest']],dgDoubleChop:[['blade','head'],['blade','chest']],dgShoulder:[['shoulder','chest']],dgHaftJab:[['pommel','head']],
    dgStomp:[['foot','gut']],dgBackhand:[['blade','chest']]},
  harvester:{hookPull:[['blade','neck']],scytheChop:[['blade','neck']],haftJab:[['pommel','chest']],
    hvWideHarvest:[['blade','chest']],hvDeathArc:[['blade','head']],hvBackReap:[['blade','chest']],hvAnkleReaper:[['blade','shin']],hvHookTrip:[['blade','shin']],
    hvTwinReap:[['blade','chest'],['blade','chest']],hvPommelSmash:[['pommel','head']],hvBoneKick:[['foot','gut']],hvBoneClaw:[['hL','chest']],hvRisingReap:[['blade','chest']],hvSoulSlash:[['blade','neck']]},
});

// ---- defence ----
Object.assign(RAW.thrall,defenseSet({R:[.2,.12,.42],wR:[-.95,.25,.1],L:[-.2,.1,.42],crouch:.18,lean:.1},[{t:0,R:[.3,0,.3],wR:[.3,.9,.3]},{t:.1,e:'o',R:[-.02,.15,.45],wR:[-.7,.6,.3],twist:.3},R_(.45)]));
Object.assign(RAW.dread,defenseSet({...DG.GUARD,crouch:.15,lean:-.05},[{t:0,...DG.READY},{t:.12,e:'o',...TW([-.05,.2,.45],[-.6,.75,.3]),twist:.3},{t:.26},R_(.55)]));
Object.assign(RAW.harvester,defenseSet({R:[.18,.15,.4],wR:[-.95,.25,.1],pR:[.6,-.3,.2],L:[-.15,.15,.4],crouch:.12},[{t:0,R:[.3,0,.3],wR:[.3,.9,.3]},{t:.1,e:'o',R:[-.02,.15,.45],wR:[-.7,.6,.3],twist:.3},R_(.45)]));
Object.assign(DEF_ODDS,{thrall:{block:.15,parry:.05,dodge:.3},dread:{block:.45,parry:.1,dodge:.05},harvester:{block:.12,parry:.06,dodge:.3}});

// ---- finishers: 10 each ----
const FIN_C={
  thrall:{
    thSkullPick:{name:'Skull Pick',contact:1.0,victim:'kneel',keys:[{t:0},{t:.5,...TH.UP,lean:-.2,crouch:.05},{t:.75,e:'o',...TH.CHOP,lean:.55,crouch:.25,fwd:.2},{t:1.0},R_(1.5)],
      ev:[{t:.75,e:'kill',imp:[0,-2,1.2],shake:.2}]},
    thChainChoke:{name:'Chain Choke',contact:.85,keys:[{t:0},{t:.3,e:'o',L:[-.05,.2,.55],lean:.25,fwd:.3},{t:.6,L:[-.02,.1,.32],R:[.05,.12,.3],wR:[-.9,.3,.2],lean:-.15,crouch:.1},{t:1.2,lean:-.25,crouch:.15},{t:1.5,e:'o',lean:.3,twist:.5},{t:1.8},R_(2.2)],
      ev:[{t:.3,e:'grab',at:'hL'},{t:.8,e:'shakeRag'},{t:1.1,e:'shakeRag'},{t:1.5,e:'release',imp:[1,-2,1],slam:1,shake:.12}]},
    thMineBody:{name:'Mine the Body',contact:.9,keys:[{t:0},{t:.2,...KICKP},{t:.32,e:'o',kick:1,lean:-.3,fwd:.15},{t:.48,kick:0},{t:.7,...TH.UP,lean:-.1,fwd:.15},{t:.85,e:'o',...TH.DOWN,lean:.65,crouch:.42,fwd:.15},
      {t:1.05,...TH.UP,lean:-.05},{t:1.2,e:'o',...TH.DOWN,lean:.65,crouch:.42,fwd:.2},{t:1.4,...TH.UP},{t:1.55,e:'o',...TH.DOWN,lean:.68,crouch:.42,fwd:.3},{t:1.8},R_(2.2)],
      ev:[{t:.32,e:'knock',imp:[0,1.2,3]},{t:.85,e:'stabRag',imp:[0,-2,.5]},{t:1.2,e:'stabRag',imp:[0,-2,.5]},{t:1.55,e:'stabRag',imp:[0,-2.5,.5],part:'head',shake:.15}]},
    thHookFling:{name:'Hook & Fling',contact:1.0,keys:[{t:0},{t:.25,...TH.SIDEW,twist:-.5,crouch:.1},{t:.42,e:'o',...TH.SIDE,twist:.45,lean:.35,fwd:.25},{t:.75,R:[.3,.3,.2],wR:[.6,.7,-.3],twist:-.4,lean:-.15},
      {t:.95,e:'o',R:[-.2,-.1,.5],wR:[-.8,-.3,.5],twist:.6,lean:.3},{t:1.2},R_(1.6)],
      ev:[{t:.42,e:'grab',at:'tip'},{t:.95,e:'release',imp:[-5,3,3],shake:.15}]},
    thSoulBind:{name:'Soul Bind',contact:.85,keys:[{t:0},{t:.35,e:'o',L:[-.08,.3,.55],lean:.2,fwd:.25},{t:1.3,L:[-.08,.34,.52],lean:.15,look:.1},{t:1.6,e:'o',L:[-.25,.45,.2],lean:-.25},{t:2.0},R_(2.4)],
      ev:[{t:.35,e:'jolt',victim:'kneel',mag:.6},{t:.6,e:'soulDrain'},{t:.95,e:'soulDrain'},{t:1.6,e:'kill',imp:[0,.3,.8],fx:'soul'}]},
    thLaunch:{name:'Pick Launcher',contact:.95,keys:[{t:0},{t:.2,...TH.LOWW,crouch:.35,lean:.4,twist:-.35},{t:.38,e:'o',...TH.RISE,crouch:0,lean:-.15,twist:.3,fwd:.35},{t:.6},R_(1.0)],
      ev:[{t:.38,e:'kill',imp:[0,9,1.5],spin:9,shake:.2}]},
    thKneeBreak:{name:'Knee Breaker',contact:1.0,keys:[{t:0},{t:.2,...TH.LOWW,crouch:.3,lean:.35,twist:-.4},{t:.34,e:'o',...TH.LOW,crouch:.35,lean:.45,twist:.35,fwd:.2},{t:.7,...TH.UP,crouch:.05,lean:-.15},
      {t:1.0,e:'o',...TH.CHOP,lean:.6,crouch:.25,fwd:.15},{t:1.25},R_(1.7)],
      ev:[{t:.34,e:'jolt',victim:'kneel'},{t:1.0,e:'kill',decap:true,imp:[0,.5,1],headImp:[1.5,3.5,2],shake:.2}]},
    thTripleChop:{name:'Triple Chop',contact:.95,keys:[{t:0},{t:.15,...TH.UP},{t:.28,e:'o',...TH.CHOP,lean:.45,fwd:.15},{t:.42,...TH.UP},{t:.55,e:'o',...TH.CHOP,lean:.5,fwd:.25},{t:.75,...TH.UP,lean:-.15},
      {t:.95,e:'o',...TH.CHOP,lean:.65,crouch:.25,fwd:.3},{t:1.2},R_(1.6)],
      ev:[{t:.28,e:'jolt'},{t:.55,e:'jolt',victim:'kneel'},{t:.95,e:'kill',imp:[0,-1.5,1.5],shake:.2}]},
    thButtCombo:{name:'Skull & Pick',contact:.7,keys:[{t:0},{t:.15,lean:-.3},{t:.27,e:'o',lean:.6,fwd:.3},{t:.4,lean:0},{t:.55,...TH.SIDEW,twist:-.45},{t:.72,e:'o',...TH.SIDE,twist:.45,lean:.35,fwd:.3},{t:1.0},R_(1.4)],
      ev:[{t:.27,e:'jolt',mag:1.4},{t:.72,e:'kill',imp:[-3,1.5,2],spin:4,shake:.15}]},
    thGraveDig:{name:'Grave Digger',contact:.85,keys:[{t:0},{t:.3,e:'o',L:[-.08,.18,.55],lean:.25,fwd:.25},{t:.7,L:[-.12,.45,.35],lean:-.2},{t:.9,e:'o',L:[-.1,-.5,.45],lean:.6,crouch:.35},
      {t:1.15,...TH.UP,crouch:.2,lean:.1},{t:1.35,e:'o',...TH.DOWN,lean:.65,crouch:.42,fwd:-.25},{t:1.6},R_(2.0)],
      ev:[{t:.3,e:'grab',at:'hL'},{t:.88,e:'release',imp:[0,-12,1],slam:1,shake:.2},{t:1.35,e:'stabRag',imp:[0,-2,.4],part:'chest'}]},
  },
  dread:{
    dgBehead:{name:"Headsman's Sweep",contact:1.35,keys:[{t:0},{t:.35,...DG.SIDEW,twist:-.6,crouch:.1},{t:.58,e:'o',...DG.SIDE,twist:.5,lean:.25,crouch:.08,fwd:.25},{t:.8,...DG.SIDEF,twist:.65},{t:1.2},R_(1.6)],
      ev:[{t:.58,e:'kill',imp:[-1.5,1,1.2],decap:true,headImp:[-4,5,1.5],shake:.25}]},
    dgSplit:{name:'Skull Splitter',contact:1.35,victim:'kneel',keys:[{t:0},{t:.5,...DG.UPB,lean:-.25,crouch:.05},{t:.8,e:'o',...DG.CHOP,lean:.6,crouch:.3,fwd:.2},{t:1.0,...DG.LOW,lean:.65,crouch:.35},{t:1.4},R_(1.9)],
      ev:[{t:.8,e:'kill',imp:[0,-3,1],ring:1,shake:.35}]},
    dgSpikeLift:{name:'Impale & Lift',contact:1.45,keys:[{t:0},{t:.25,...TW([.15,0,.1],[0,.1,1]),crouch:.15,twist:-.3},{t:.42,e:'o',...TW([.08,0,.6],[0,.08,1]),lean:.4,fwd:.4,twist:.25},
      {t:.9,...TW([.08,.45,.35],[0,.85,.5]),lean:-.15,crouch:.05},{t:1.25,...TW([.08,.55,.1],[0,.95,-.2]),lean:-.3},{t:1.5,e:'o',...DG.CHOP,lean:.6,crouch:.3,fwd:.2},{t:1.8},R_(2.3)],
      ev:[{t:.42,e:'grab',at:'tip'},{t:1.48,e:'release',imp:[0,-14,3],slam:1,shake:.35}]},
    dgExecution:{name:'Executioner',contact:1.2,keys:[{t:0},{t:.2,kick:.5},{t:.34,e:'o',kick:1,lean:-.3,fwd:.15},{t:.48,kick:0},{t:.9,...DG.UPB,lean:-.25},{t:1.25,e:'o',...DG.CHOP,lean:.6,crouch:.3,fwd:.1},{t:1.5},R_(2.0)],
      ev:[{t:.34,e:'jolt',victim:'kneel',mag:1.4},{t:1.25,e:'kill',imp:[0,.5,1],decap:true,headImp:[0,3.5,3],shake:.3}]},
    dgThroatSlam:{name:'Throat Slam',contact:1.0,keys:[{t:0},{t:.3,e:'o',...DG.SHLD,L:[-.08,.2,.58],lean:.3,fwd:.35},{t:.75,L:[-.12,.5,.35],lean:-.25},{t:.95,e:'o',L:[-.1,-.5,.5],lean:.65,crouch:.4},
      {t:1.25,...DG.UP,crouch:.2,lean:.05},{t:1.5,e:'o',...DG.LOW,lean:.75,crouch:.4,fwd:.1},{t:1.8},R_(2.3)],
      ev:[{t:.3,e:'grab',at:'hL'},{t:.93,e:'release',imp:[0,-14,1],slam:1,shake:.25},{t:1.5,e:'stabRag',imp:[0,-2.5,.3],aim:['blade','chest'],part:'chest',shake:.2}]},
    dgSpinBehead:{name:'Whirling Headsman',contact:1.35,keys:[{t:0,...DG.SIDEW,crouch:.15},{t:.2,yaw:-.6,crouch:.22,twist:-.4},{t:.68,e:'l',yaw:6.28,...DG.SIDE,crouch:.15,fwd:.35,twist:0},{t:.85,...DG.SIDEF},{t:1.25},R_(1.6,{yaw:6.28})],
      ev:[{t:.62,e:'kill',imp:[2,1,1.5],decap:true,headImp:[5,5,1],shake:.25}]},
    dgHaftChoke:{name:'Haft Choke',contact:.95,keys:[{t:0},{t:.3,e:'o',...TW([.22,.25,.5],[.95,.2,.1]),lean:.25,fwd:.35},{t:.9,...TW([.22,-.05,.55],[.95,.1,.1]),lean:.5,crouch:.35},{t:1.15,...DG.READY,lean:.1,crouch:.1},
      {t:1.32,e:'o',kick:1,lean:-.2},{t:1.45,kick:0},R_(1.9)],
      ev:[{t:.3,e:'grab',at:'haft'},{t:.85,e:'release',imp:[0,-10,1.5],slam:1,shake:.2},{t:1.32,e:'stabRag',at:'foot',imp:[0,-4,.5],part:'chest',shake:.2}]},
    dgLaunch:{name:"Heaven's Toss",contact:1.3,keys:[{t:0},{t:.3,...DG.LOWW,crouch:.35,lean:.4,twist:-.4},{t:.52,e:'o',...DG.RISE,crouch:0,lean:-.25,twist:.3,fwd:.35},{t:.8},R_(1.3)],
      ev:[{t:.52,e:'kill',imp:[0,11,2],spin:8,shake:.25}]},
    dgXCleave:{name:'X-Cleave',contact:1.3,keys:[{t:0},{t:.3,...TW([.42,.42,-.1],[.55,.6,-.55]),twist:-.45,crouch:.1},{t:.5,e:'o',...TW([-.15,-.3,.45],[-.6,-.6,.5]),twist:.45,lean:.4,crouch:.2,fwd:.25},
      {t:.75,...TW([-.25,.42,.3],[-.5,.7,-.3]),twist:.55,lean:.1},{t:.98,e:'o',...TW([.4,-.3,.42],[.65,-.6,.45]),twist:-.45,lean:.45,crouch:.22,fwd:.4},{t:1.2},R_(1.7)],
      ev:[{t:.5,e:'jolt'},{t:.98,e:'kill',imp:[0,1.5,3.5],spin:3,shake:.2}]},
    dgHeadCrush:{name:'Head Crusher',contact:.9,keys:[{t:0},{t:.3,e:'o',...DG.SHLD,L:[-.05,.35,.55],lean:.25,fwd:.35},{t:.8,L:[-.05,.55,.45],lean:-.15},{t:1.1,e:'o',L:[-.05,.52,.42]},{t:1.4,e:'o',L:[-.45,.2,.1],twist:.6,lean:.1},{t:1.7},R_(2.1)],
      ev:[{t:.3,e:'grab',at:'hL'},{t:1.1,e:'shakeRag'},{t:1.4,e:'release',imp:[-6,3,1],shake:.2}]},
  },
  harvester:{
    hvReapHead:{name:'Reap',contact:1.5,keys:[{t:0},{t:.3,...HV.REAPW,twist:-.6,crouch:.1},{t:.52,e:'o',...HV.REAP,twist:.5,lean:.3,fwd:.25},{t:.75},R_(1.2)],
      ev:[{t:.52,e:'kill',imp:[-1.5,1,1],decap:true,headImp:[-4,4.5,1.5],shake:.2,fx:'soul'}]},
    hvSoulRip:{name:'Soul Rip',contact:.9,keys:[{t:0},{t:.35,e:'o',L:[-.06,.08,.58],wL:[0,0,1],lean:.3,fwd:.3},{t:.9,L:[-.06,.1,.6],lean:.25},{t:1.25,e:'o',L:[-.3,.35,.1],lean:-.3},{t:1.6},R_(2.0)],
      ev:[{t:.35,e:'jolt',victim:'kneel',mag:.8},{t:.6,e:'soulDrain'},{t:.9,e:'soulDrain'},{t:1.25,e:'kill',imp:[0,1,1.5],fx:'soul'}]},
    hvImpale:{name:'Scythe Lift',contact:1.4,keys:[{t:0},{t:.3,...HV.CHOPU,lean:-.15},{t:.48,e:'o',...HV.CHOP,lean:.45,fwd:.2},{t:.95,R:[.12,.4,.35],wR:[0,.9,.4],lean:-.2},{t:1.3,e:'o',R:[-.1,-.1,.55],wR:[-.6,-.4,.7],lean:.35,twist:.4},{t:1.6},R_(2.0)],
      ev:[{t:.48,e:'grab',at:'tip'},{t:1.3,e:'release',imp:[-4,-6,3],slam:1,shake:.2}]},
    hvHookDown:{name:'Hook & Pin',contact:1.4,keys:[{t:0},{t:.3,...HV.CHOPU,lean:-.1},{t:.46,e:'o',...HV.CHOP,lean:.4,fwd:.2},{t:.75,R:[.16,-.3,.25],wR:[0,-.5,.86],lean:.5,crouch:.3,fwd:-.2},
      {t:1.05,R:[.2,.1,.1],wR:[0,.3,-.95],lean:.2},{t:1.25,e:'o',R:[.1,-.25,.45],wR:[0,.6,-.8],lean:.6,crouch:.35},{t:1.5},R_(1.9)],
      ev:[{t:.46,e:'jolt',mag:-1.5,victim:'kneel'},{t:.75,e:'knock',imp:[0,-2,-2.5]},{t:1.25,e:'stabRag',imp:[0,-2,0],aim:['pommel','chest'],part:'chest'}]},
    hvSoulBurst:{name:'Soul Burst',contact:2.4,keys:[{t:0},{t:.3,...HV.RAISE},{t:.45,e:'o',...HV.POINT},{t:.6,...HV.RAISE},{t:.75,e:'o',...HV.POINT},{t:.9,...HV.RAISE,L:[-.2,.35,.3]},{t:1.2,e:'o',...HV.POINT,L:[-.1,.15,.55],lean:.3},{t:1.45},R_(1.9)],
      ev:[{t:.45,e:'jolt',fx:'soul'},{t:.75,e:'jolt',fx:'soul',victim:'kneel'},{t:1.2,e:'kill',fx:'soulBlast',imp:[0,4,6],spin:5,shake:.3}]},
    hvWither:{name:'Wither',contact:2.2,keys:[{t:0},{t:.4,...HV.RAISE,L:[-.2,.3,.4],wL:[0,1,0],lean:-.1},{t:1.35,L:[-.22,.34,.42]},{t:1.6,e:'o',...HV.POINT,lean:.2},{t:1.85},R_(2.2)],
      ev:[{t:.4,e:'jolt',fx:'soul',victim:'kneel',mag:.5},{t:.7,e:'soulDrain'},{t:1.0,e:'soulDrain'},{t:1.3,e:'soulDrain'},{t:1.6,e:'kill',imp:[0,.2,.4],fx:'soul'}]},
    hvDoubleReap:{name:'Double Reap',contact:1.45,keys:[{t:0},{t:.25,...HV.REAPW,twist:-.5},{t:.42,e:'o',...HV.REAP,twist:.45,lean:.3,fwd:.15},{t:.62,...TW([-.25,.3,.25],[-.6,.6,-.4],.4),twist:.55},
      {t:.82,e:'o',...TW([.35,-.1,.45],[.7,-.2,.65],.4),twist:-.45,lean:.3,fwd:.3},{t:1.05},R_(1.5)],
      ev:[{t:.42,e:'jolt'},{t:.82,e:'kill',imp:[2,1,2.5],decap:true,headImp:[4,4,1],shake:.2}]},
    hvScream:{name:'Death Scream',contact:1.6,keys:[{t:0},{t:.4,lean:-.3,R:[.3,-.2,.1],L:[-.3,.1,.2]},{t:.62,e:'o',lean:.4,L:[-.38,.25,.3],R:[.38,0,.2],fwd:.1},{t:1.3,lean:.35},{t:1.5},R_(1.9)],
      ev:[{t:.62,e:'kill',imp:[0,3,9],spin:4,fx:'wail',shake:.3}]},
    hvPinDrain:{name:'Pin & Drain',contact:1.35,keys:[{t:0},{t:.25,R:[.2,.05,.05],wR:[0,.1,1],crouch:.12,twist:-.3},{t:.4,e:'o',R:[.1,.02,.55],wR:[0,.08,1],lean:.4,fwd:.35,twist:.25},{t:1.3,lean:.35},
      {t:1.55,e:'o',R:[.16,.2,.3],wR:[0,.6,.8],lean:-.1,fwd:.2},{t:1.8},R_(2.2)],
      ev:[{t:.4,e:'grab',at:'tip'},{t:.8,e:'soulDrainRag'},{t:1.2,e:'soulDrainRag'},{t:1.55,e:'release',imp:[0,1,3],shake:.12}]},
    hvSpinReap:{name:'Spinning Reap',contact:1.45,keys:[{t:0,...HV.REAPW,crouch:.12},{t:.18,yaw:-.6,twist:-.4,crouch:.2},{t:.62,e:'l',yaw:6.28,...HV.REAP,crouch:.15,fwd:.35,twist:0},{t:.85},R_(1.25,{yaw:6.28})],
      ev:[{t:.56,e:'kill',imp:[2,1.5,1.5],decap:true,headImp:[5,4,1],shake:.2}]},
  },
};
for(const t in FIN_C){ FINS[t]=[]; for(const n in FIN_C[t]){ const d=FIN_C[t][n];
  RAW[t][n]={keys:d.keys,ev:d.ev}; FIN[n]={name:d.name,clip:n,contact:d.contact,victim:d.victim}; FINS[t].push(n); } }
Object.assign(FIN_AIM_X,{
  thSkullPick:[[.75,'pick','head']],thChainChoke:[[.3,'hL','neck']],thMineBody:[[.32,'foot','gut']],thHookFling:[[.42,'pick','chest']],thSoulBind:[[.35,'hL','head']],
  thLaunch:[[.38,'pick','chest']],thKneeBreak:[[.34,'pick','shin'],[1.0,'pick','neck']],thTripleChop:[[.28,'pick','chest'],[.55,'pick','chest'],[.95,'pick','head']],
  thButtCombo:[[.72,'pick','chest']],thGraveDig:[[.3,'hL','neck']],
  dgBehead:[[.58,'blade','neck']],dgSplit:[[.8,'blade','head']],dgSpikeLift:[[.42,'tip','chest']],dgExecution:[[.34,'foot','gut'],[1.25,'blade','neck']],dgThroatSlam:[[.3,'hL','neck']],
  dgSpinBehead:[[.62,'blade','neck']],dgHaftChoke:[[.3,'hL','neck']],dgLaunch:[[.52,'blade','gut']],dgXCleave:[[.5,'blade','chest'],[.98,'blade','chest']],dgHeadCrush:[[.3,'hL','head']],
  hvReapHead:[[.52,'blade','neck']],hvSoulRip:[[.35,'hL','chest']],hvImpale:[[.48,'tip','chest']],hvHookDown:[[.46,'blade','neck']],hvDoubleReap:[[.42,'blade','chest'],[.82,'blade','neck']],
  hvPinDrain:[[.4,'tip','chest']],hvSpinReap:[[.56,'blade','neck']],
});
Object.assign(FIN_HIT_X,{thSoulBind:{1.6:'chest'},thButtCombo:{.27:'chest'},hvSoulRip:{1.25:'chest'},hvSoulBurst:{.45:'chest',.75:'chest',1.2:'chest'},hvWither:{.4:'chest',1.6:'chest'},hvScream:{.62:'head'}});

// ---- charges: 10 each. The run is how it carries itself at a sprint; the keys are the blow it crashes in with
for(const t of ['thrall','dread','harvester']) CHG[t]=[];
chg('thrall','pickRush','Pick Rush',{...TH.UP,lean:.3},[{t:.1,lean:-.05},{t:.24,e:'o',...TH.CHOP,lean:.55,crouch:.2,fwd:.6},{t:.38},R_(.8)],[HIT(.24,['pick','head'],{dmg:1.2,kb:2})]);
chg('thrall','leapChop','Leaping Chop',{...TH.UP},[{t:.08,crouch:.3},{t:.25,jump:.75,...TH.UP,crouch:0,fwd:.4},{t:.42,e:'o',jump:.2,...TH.CHOP,lean:.55,fwd:.85},{t:.52,jump:0,crouch:.3,fwd:.95},R_(.95)],
  [HIT(.42,['pick','head'],{dmg:1.3,kb:2.2}),{t:.52,e:'land'}]);
chg('thrall','chainWhip','Chain Whip',{L:[-.45,.2,-.1]},[{t:.12,twist:.4},{t:.26,e:'o',L:[.1,.05,.62],twist:-.45,lean:.35,fwd:.5},{t:.4},R_(.8)],[HIT(.26,['hL','chest'],{dmg:.9,kb:2})]);
chg('thrall','headRam','Head Ram',{lean:.5},[{t:.1,lean:.6,crouch:.12},{t:.22,e:'o',lean:.75,fwd:.8},{t:.36,lean:.3},R_(.75)],[HIT(.22,['head','chest'],{dmg:.8,kb:3.2})]);
chg('thrall','hookRun','Hooking Run',{...TH.SIDEW},[{t:.1,twist:-.4},{t:.24,e:'o',...TH.SIDE,twist:.45,lean:.4,fwd:.6},{t:.38},R_(.8)],[HIT(.24,['pick','chest'],{dmg:1,kb:2.2})]);
chg('thrall','frenzyRun','Frenzied Run',{...TH.UP},[{t:.08,...TH.CHOP,lean:.4,fwd:.2},{t:.16,e:'o'},{t:.24,...TH.UP},{t:.32,e:'o',...TH.CHOP,lean:.45,fwd:.45},{t:.4,...TH.UP},{t:.48,e:'o',...TH.CHOP,lean:.5,fwd:.65},{t:.6},R_(.9)],
  [HIT(.16,['pick','chest'],{dmg:.45,kb:1}),HIT(.32,['pick','chest'],{dmg:.45,kb:1}),HIT(.48,['pick','head'],{dmg:.55,kb:2})]);
chg('thrall','slideSweep','Slide Sweep',{...TH.LOWW,crouch:.2},[{t:.1,crouch:.45,lean:-.1,fwd:.5},{t:.24,e:'o',...TH.LOW,crouch:.45,fwd:.9,twist:.4},{t:.4},R_(.8)],[HIT(.24,['pick','shin'],{dmg:.9,kb:1,up:1.5})]);
chg('thrall','risingRush','Rising Rush',{...TH.LOWW,lean:.35},[{t:.1,crouch:.3},{t:.24,e:'o',...TH.RISE,crouch:0,lean:-.1,fwd:.6},{t:.38},R_(.8)],[HIT(.24,['pick','head'],{dmg:1.1,kb:1.5,up:2})]);
chg('thrall','dropKick','Drop Kick',{lean:.2},[{t:.08,crouch:.3},{t:.24,e:'o',jump:.6,kick:1,lean:-.5,crouch:0,fwd:.6},{t:.38,jump:0,kick:0,lean:0,crouch:.35,fwd:.8},R_(.9)],
  [HIT(.24,['foot','chest'],{dmg:.8,kb:3.4}),{t:.38,e:'land'}]);
chg('thrall','haftRam','Haft Ram',{R:[.22,0,.05],wR:[0,.3,-.95]},[{t:.1,twist:-.35},{t:.22,e:'o',R:[.1,.02,.55],wR:[0,.25,-.97],twist:.3,lean:.45,fwd:.6},{t:.36},R_(.75)],[HIT(.22,['pommel','head'],{dmg:.9,kb:2.6})]);

chg('dread','ramCharge','Iron Ram',{...DG.SHLD,lean:.35,twist:.4},[{t:.1,twist:.6,lean:.5,crouch:.12},{t:.24,e:'o',twist:.65,lean:.55,fwd:.9},{t:.4,twist:.2},R_(.85)],[HIT(.24,['shoulder','chest'],{dmg:1,kb:4.2,kd:1})]);
chg('dread','leapCleave','Leaping Cleave',{...DG.UP},[{t:.08,crouch:.35},{t:.3,jump:.7,...DG.UPB,crouch:0,fwd:.4,lean:-.2},{t:.5,e:'o',jump:.15,...DG.CHOP,lean:.6,fwd:.9},{t:.6,jump:0,...DG.LOW,crouch:.4,fwd:1.0},R_(1.1)],
  [HIT(.5,['blade','head'],{dmg:1.5,kb:3}),{t:.6,e:'land'}]);
chg('dread','sweepRun','Reaping Run',{...DG.SIDEW},[{t:.1,twist:-.5},{t:.28,e:'o',...DG.SIDE,twist:.5,lean:.35,fwd:.6},{t:.44,...DG.SIDEF},R_(.95)],[{t:.28,e:'hit',arc:1,dmg:1,kb:3}]);
chg('dread','spinRun','Whirling Charge',{...DG.SIDEW},[{t:.06,yaw:-.4},{t:.42,e:'l',yaw:6.28,...DG.SIDE,fwd:.5},{t:.56},R_(.95,{yaw:6.28})],[{t:.3,e:'hit',arc:1.2,dmg:.9,kb:3}]);
chg('dread','haftRam','Haft Ram',{...DG.GUARD},[{t:.1,lean:.3},{t:.24,e:'o',...TW([.2,.2,.6],[.95,.2,.1],.3),lean:.5,fwd:.8},{t:.4},R_(.8)],[HIT(.24,['hL','chest'],{dmg:.8,kb:4})]);
chg('dread','overRun','Overhead Charge',{...DG.UP},[{t:.12,...DG.UPB,lean:-.1},{t:.3,e:'o',...DG.CHOP,lean:.6,crouch:.25,fwd:.7},{t:.46,...DG.LOW},R_(.95)],[HIT(.3,['blade','head'],{dmg:1.4,kb:2.6})]);
chg('dread','riseRush','Rising Ruin',{...DG.LOWW,lean:.3},[{t:.1,crouch:.3},{t:.26,e:'o',...DG.RISE,crouch:0,lean:-.15,fwd:.6},{t:.42},R_(.85)],[HIT(.26,['blade','chest'],{dmg:1.1,kb:2,up:2.6})]);
chg('dread','quakeLeap','Quake Leap',{...DG.UP},[{t:.1,crouch:.4},{t:.34,jump:.9,...DG.UPB,crouch:0,fwd:.5,lean:-.25},{t:.56,e:'o',jump:0,...DG.LOW,lean:.7,crouch:.45,fwd:.9},R_(1.2)],
  [{t:.56,e:'hit',aoe:.85,dmg:1.1,kb:3.6},{t:.56,e:'land'}]);
chg('dread','backhandRush','Backhand Rush',{...DG.SIDEF},[{t:.1,twist:.5},{t:.26,e:'o',...TW([.3,0,.4],[.85,0,.5]),twist:-.45,lean:.3,fwd:.6},{t:.42},R_(.85)],[HIT(.26,['blade','chest'],{dmg:1.1,kb:2.8})]);
chg('dread','stompRush','Trampling Kick',{...DG.SHLD,lean:.25},[{t:.1,kick:.4},{t:.24,e:'o',kick:1,lean:-.3,fwd:.6},{t:.38,kick:0,lean:.1},R_(.8)],[HIT(.24,['foot','chest'],{dmg:.8,kb:4})]);

chg('harvester','runBolt','Running Bolt',{...HV.POINT,lean:.15},[{t:.1,...HV.RAISE,lean:.1},{t:.3,e:'o',...HV.POINT,lean:.3,fwd:.5},{t:.5},R_(.9)],[{t:.3,e:'soul',dmg:1.2}]);
chg('harvester','ghostDash','Ghost Dash',{...HV.REST,lean:.4},[{t:.12,lean:.5,fwd:.8},{t:.3,e:'o',...HV.POINT,lean:.2,fwd:1.4},{t:.5},R_(.9)],[{t:.12,e:'ghost'},{t:.3,e:'soul',dmg:1}]);
chg('harvester','volleyRun','Volley Run',{...HV.POINT},[{t:.1,e:'o',...HV.POINT,fwd:.3},{t:.25,...HV.RAISE},{t:.35,e:'o',...HV.POINT,fwd:.55},{t:.5,...HV.RAISE},{t:.6,e:'o',...HV.POINT,fwd:.8},{t:.75},R_(1.1)],
  [{t:.1,e:'soul',dmg:.5},{t:.35,e:'soul',dmg:.5},{t:.6,e:'soul',dmg:.5}]);
chg('harvester','leapBolt','Leaping Bolt',{...HV.RAISE},[{t:.08,crouch:.3},{t:.25,jump:.8,...HV.RAISE,crouch:0,fwd:.4},{t:.42,e:'o',jump:.4,...HV.POINT,lean:.3,fwd:.7},{t:.55,jump:0,crouch:.3,fwd:.8},R_(1.0)],
  [{t:.42,e:'soul',dmg:1.3},{t:.55,e:'land'}]);
chg('harvester','slideCast','Slide Cast',{...HV.POINT,lean:.2},[{t:.12,crouch:.4,lean:-.15,fwd:.5},{t:.3,e:'o',crouch:.42,fwd:.9},{t:.5},R_(.9)],[{t:.3,e:'soul',dmg:1.2}]);
chg('harvester','wailRush','Wailing Rush',{lean:.3},[{t:.15,lean:-.25,crouch:.05},{t:.32,e:'o',lean:.4,L:[-.38,.25,.3],fwd:.5},{t:.6},R_(1.0)],[{t:.32,e:'wail',far:1}]);
chg('harvester','lanceRun','Soul Lance Run',{...HV.RAISE,L:[-.2,.35,.3]},[{t:.25,L:[-.22,.38,.3],lean:-.1},{t:.45,e:'o',...HV.POINT,L:[-.1,.15,.5],lean:.35,fwd:.5},{t:.65},R_(1.05)],[{t:.45,e:'soul',dmg:1.6,big:1}]);
chg('harvester','spinCast','Spin Cast',{...HV.REAPW},[{t:.06,yaw:-.4},{t:.36,e:'l',yaw:6.28,...HV.REAP,fwd:.4},{t:.5,e:'o',...HV.POINT,fwd:.6},{t:.65},R_(1.0,{yaw:6.28})],[{t:.5,e:'soul',dmg:1.2}]);
chg('harvester','palmRun','Soul Palm Run',{L:[-.3,.05,0]},[{t:.12,twist:.4,crouch:.1},{t:.28,e:'o',L:[-.12,.12,.6],wL:[0,0,1],twist:-.35,lean:.3,fwd:.5},{t:.45},R_(.85)],[{t:.28,e:'soul',dmg:1,from:'hL'}]);
chg('harvester','rendRun','Cursed Bolt',{...HV.RAISE},[{t:.2,L:[-.18,.4,.35],wL:[0,1,0]},{t:.4,e:'o',...HV.POINT,L:[-.12,.2,.5],lean:.3,fwd:.5},{t:.6},R_(1.0)],[{t:.4,e:'soul',dmg:1,rend:1}]);
for(const t of ['thrall','dread','harvester']) for(const c of CHG[t]) RAW[t]['chg_'+c.id]={keys:c.keys,ev:c.ev,aim:c.aim,atk:1};
