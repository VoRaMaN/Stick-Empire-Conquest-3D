/* ---------------- unit definitions ---------------- */
const TYPES={
  miner:{name:'Miner',  engage:1.5, reach:.95, s:.95, hp:70,  dmg:9,  range:1.0, speed:2.9, cd:1.0, cost:100, attacks:['mine'], fin:'bonk', thick:.95, turn:9},
  sword:{name:'Swordsman',engage:1.85,reach:1.0, s:1, hp:110, dmg:24, range:1.05,speed:4.3, cd:.8, cost:125, attacks:['slash1','slash2','slash1','jumpslash'], fin:'cleave', thick:1, turn:11},
  spear:{name:'Spartan',engage:2.4,reach:1.75,s:1.08,hp:260, dmg:32, range:1.75,speed:2.3, cd:1.35,cost:400, attacks:['thrust','thrust'], fin:'skewer', thick:1.1, armor:.35, turn:7},
  archer:{name:'Archer',engage:6,reach:.9, s:.97, hp:75,  dmg:20, range:15,  speed:3.3, cd:1.7, cost:250, attacks:['shoot'], fin:'pointblank', thick:.95, turn:9},
  giant:{name:'Giant',  engage:3.6,reach:2.7, s:2.35,hp:1100,dmg:85, range:2.9, speed:1.45,cd:2.4, cost:1200,attacks:['smash'], fin:'hurl', thick:1.22, aoe:2.5, turn:3.5},
};
TYPES.archer.ranged=true;   // shoots from range (shared by every ranged unit's AI)
const ORDER=['miner','sword','spear','archer','giant'];
const PF=['R','L','wR','wL','pR','pL'], NF=['lean','crouch','twist','side','jump','fwd','draw','yaw','kick','look','alt'];
function fillPose(p,base){const o={}; for(const k of PF) o[k]=p[k]!==undefined?p[k]:(base&&base[k]!==undefined?base[k]:null); for(const k of NF) o[k]=p[k]!==undefined?p[k]:(base&&base[k]!==undefined?base[k]:0); return o;}
function lv(a,b,u){return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u];}
function lerpPose(a,b,u){const o={}; for(const k of PF){const x=a[k],y=b[k]; o[k]=(x&&y)?lv(x,y,u):(u<.5?x:y)||null;} for(const k of NF) o[k]=a[k]+(b[k]-a[k])*u; return o;}

// Locomotion poses. Hand positions are chest-local (x right, y up, z forward), in metres at scale 1.
const POSES={
  sword:{idle:{R:[.2,-.38,.38],wR:[.05,.55,.83],L:[-.25,-.5,.14],wL:[0,1,0],lean:.12,crouch:.02,twist:-.12},
         move:{R:[.24,-.3,.5],wR:[.05,.62,.78],L:[-.25,-.4,.3],wL:[0,1,0],lean:.28,crouch:0,twist:.08},swingL:.42,swingR:.12},
  spear:{idle:{R:[.22,-.3,.2],wR:[0,1,.15],L:[-.17,-.1,.32],wL:[0,0,1],lean:.05,crouch:.04},
         move:{R:[.22,-.28,.24],wR:[0,.72,.7],L:[-.16,-.08,.34],wL:[0,0,1],lean:.12,crouch:.01},swingL:0,swingR:.05},
  archer:{idle:{R:[.18,-.5,.06],wR:[0,-1,.2],L:[-.2,-.46,.18],wL:[0,.08,1],lean:.04,crouch:.03,twist:-.15},
         move:{R:[.2,-.46,-.16],wR:[0,-1,.2],L:[-.2,-.4,.28],wL:[0,.05,1],lean:.24,crouch:0},swingL:.12,swingR:.3},
  giant:{idle:{R:[.32,-.38,.2],wR:[.15,-.55,.8],L:[-.34,-.4,.12],wL:[0,1,0],lean:.28,crouch:.03},
         move:{R:[.34,-.36,.12],wR:[.2,-.6,.75],L:[-.32,-.36,.22],wL:[0,1,0],lean:.32,crouch:.05},swingL:.4,swingR:.1},
  miner:{idle:{R:[.18,-.12,.28],wR:[.05,.75,-.65],L:[-.2,-.48,.16],wL:[0,1,0],lean:.26,crouch:.05},
         move:{R:[.18,-.1,.28],wR:[.05,.75,-.65],L:[-.2,-.4,.28],wL:[0,1,0],lean:.32,crouch:.05},swingL:.38,swingR:0},
};
for(const t in POSES){POSES[t].idle=fillPose(POSES[t].idle,null); POSES[t].move=fillPose(POSES[t].move,POSES[t].idle);}

// Action clips: keyed hand targets + body values; IK + springs do the rest.
const R_=(t,o)=>Object.assign({t,rest:true},o||{});
const RAW={
  common:{
    stagger:{loop:true,keys:[{t:0,R:[.14,.16,.3],L:[-.14,.22,.28],lean:-.26,crouch:.15},{t:.3,R:[.17,.24,.25],L:[-.11,.16,.31],lean:-.15,crouch:.1},{t:.6,R:[.14,.16,.3],L:[-.14,.22,.28],lean:-.26,crouch:.15}]},
  },
  sword:{
    // Swordsman moves are cut in the vertical plane on the sword side, like the 2D game:
    // big overhead chop, rising back-cut, leaping chop. The sword arm never crosses the body.
    slash1:{keys:[
      {t:0,R:[.22,.5,-.22],wR:[.05,.6,-.8],pR:[.5,.4,.6],L:[-.25,-.36,.3],twist:-.35,lean:.05,crouch:.1},
      {t:.14,R:[.2,.52,-.3],wR:[.02,.15,-1],pR:[.5,.6,.5],L:[-.25,-.22,.4],twist:-.45,lean:-.12,crouch:.12,fwd:.08},
      {t:.26,e:'o',R:[.2,-.06,.56],wR:[.03,-.5,.86],L:[-.25,-.42,-.22],twist:.3,lean:.5,crouch:.22,fwd:.42},
      {t:.36,R:[.21,-.34,.44],wR:[.02,-.86,.5],twist:.28,lean:.52,crouch:.22,fwd:.46},
      R_(.62)],ev:[{t:.26,e:'hit'}]},
    slash2:{keys:[
      {t:0,R:[.21,-.36,.4],wR:[.02,-.8,.6],L:[-.25,-.42,-.18],twist:.2,lean:.42,crouch:.18},
      {t:.1,R:[.23,-.46,-.12],wR:[.03,-.55,-.83],L:[-.25,-.34,.32],twist:-.3,lean:.3,crouch:.2,fwd:.1},
      {t:.22,e:'o',R:[.2,.3,.48],wR:[.02,.95,.3],pR:[.5,-.3,.2],L:[-.25,-.44,-.2],twist:.35,lean:.05,crouch:.1,fwd:.4},
      {t:.32,R:[.2,.5,.24],wR:[.02,.9,-.4],pR:[.5,.3,.5],twist:.3,lean:-.06,fwd:.44},
      R_(.58)],ev:[{t:.22,e:'hit'}]},
    jumpslash:{keys:[
      {t:0,R:[.24,-.3,-.38],wR:[.05,.2,-1],L:[-.25,-.36,.32],lean:.32,twist:-.25,crouch:.3},
      {t:.18,crouch:.36},
      {t:.38,e:'o',jump:.9,fwd:.9,R:[.19,.54,-.12],wR:[.03,.55,-.83],pR:[.5,.6,.5],L:[-.27,.3,.3],lean:-.12,twist:-.3,crouch:0},
      {t:.52,e:'o',jump:.25,fwd:1.4,R:[.2,-.08,.56],wR:[.02,-.78,.62],L:[-.25,-.42,-.22],lean:.6,twist:.3,crouch:.1},
      {t:.62,jump:0,fwd:1.5,crouch:.36,R:[.21,-.34,.42],wR:[.02,-.95,.3],lean:.55},
      R_(.92)],ev:[{t:.52,e:'hit'},{t:.62,e:'land'}]},
    cleave:{keys:[
      {t:0,crouch:.35,lean:.35,R:[.24,-.3,-.38],wR:[.05,.15,-1],L:[-.25,-.36,.32],twist:-.3},
      {t:.3,crouch:.44},
      {t:.55,e:'o',jump:1.5,fwd:.8,R:[.18,.58,-.02],wR:[.02,1,-.1],pR:[.5,.5,.6],L:[-.27,.36,.32],lean:-.25,crouch:0,twist:-.2},
      {t:.72,jump:1.6,fwd:1.1,R:[.18,.56,-.2],wR:[.02,.4,-.9],pR:[.5,.6,.5],lean:-.35,twist:-.4},
      {t:.86,e:'o',jump:.5,fwd:1.4,R:[.2,-.12,.58],wR:[.02,-.82,.56],L:[-.25,-.42,-.22],lean:.7,crouch:.1,twist:.3},
      {t:.98,jump:0,fwd:1.5,crouch:.46,R:[.22,-.42,.4],wR:[.02,-1,.1],lean:.75},
      {t:1.32,crouch:.28,lean:.3,R:[.44,-.34,.1],wR:[.55,-.35,-.75],twist:-.25,L:[-.25,-.48,.16]},
      R_(1.7)],ev:[{t:.55,e:'whoosh'},{t:.86,e:'kill',imp:[0,2.4,3.4],decap:true,headImp:[.6,6.5,4.5],shake:.28},{t:.98,e:'land'}]},
  },
  spear:{
    thrust:{keys:[
      {t:0,R:[.22,.3,-.2],wR:[0,.15,1],L:[-.15,-.1,.36],lean:.1,crouch:.1},
      {t:.22,R:[.22,.35,-.42],wR:[0,.12,1],lean:0,crouch:.12,twist:-.3},
      {t:.38,e:'o',R:[.12,.25,.45],wR:[0,.05,1],lean:.35,twist:.25,fwd:.3,crouch:.18},
      {t:.55,R:[.14,.25,.35]},
      R_(.85)],ev:[{t:.38,e:'hit'}]},
    skewer:{keys:[
      {t:0,R:[.22,.32,-.42],wR:[0,.1,1],crouch:.15,twist:-.3,L:[-.15,-.1,.36]},
      {t:.35,e:'o',R:[.12,.22,.5],wR:[0,.05,1],lean:.35,crouch:.2,fwd:.35,twist:.2},
      {t:.75,R:[.12,.2,.45],wR:[0,.25,1],lean:.2},
      {t:1.35,R:[.1,.58,.2],wR:[0,.85,.5],lean:-.15,crouch:.1,L:[-.2,-.3,.1]},
      {t:1.75,R:[.1,.65,0],wR:[0,.95,.1],lean:-.3,twist:.1},
      {t:2.0,e:'o',R:[.12,.45,-.3],wR:[0,.5,-.85],lean:-.4,twist:.3},
      R_(2.5)],ev:[{t:.35,e:'grab',at:'tip'},{t:2.0,e:'release',imp:[0,5.5,-6.5],shake:.12}]},
  },
  archer:{
    shoot:{aim:1,keys:[
      {t:0,L:[-.03,.03,.67],wL:[0,.04,1],R:[-.01,.03,.54],pR:[.3,-.6,-.5],twist:-1.15,lean:-.04},
      {t:.22},
      {t:.82,R:[.12,.2,.05],pR:[.15,.3,-1],draw:1},
      {t:.95,e:'o',R:[.22,.18,-.3],draw:0},
      {t:1.05},
      R_(1.3)],ev:[{t:.95,e:'fire'}]},
    pointblank:{keys:[
      {t:0,L:[-.36,.1,.04],wL:[-.6,.2,.8],twist:.35,lean:.1},
      {t:.3,e:'o',L:[.12,.02,.58],wL:[.7,0,.7],twist:-.5,lean:.35,fwd:.25},
      {t:.7,fwd:.9,lean:.25,twist:-1.15,L:[-.03,-.36,.55],wL:[0,-.6,.8],R:[-.01,-.3,.48],pR:[.3,-.6,-.5]},
      {t:1.25,R:[.12,.06,.12],pR:[.1,.4,-.9],draw:1,lean:.3},
      {t:1.35,e:'o',R:[.2,.1,-.22],draw:0},
      {t:1.6},
      R_(2.2)],ev:[{t:.3,e:'knock',imp:[0,2,3.4]},{t:1.35,e:'execute'}]},
  },
  giant:{
    smash:{keys:[
      {t:0,R:[.3,.2,0],wR:[.3,.9,-.2],lean:.1,crouch:.1},
      {t:.75,R:[.14,.57,-.24],wR:[.05,.75,-.65],L:[-.05,.55,-.18],lean:-.25,crouch:.05,twist:-.2},
      {t:1.05,e:'o',R:[.1,-.3,.55],wR:[0,-.45,.89],L:[-.05,-.25,.48],lean:.6,crouch:.3,twist:0,fwd:.35},
      {t:1.3},
      R_(1.75)],ev:[{t:1.05,e:'hit'}]},
    hurl:{keys:[
      {t:0,L:[-.3,-.2,.1],lean:.2},
      {t:.45,e:'o',L:[-.1,-.24,.58],lean:.55,crouch:.3,fwd:.3},
      {t:.9,L:[-.15,.25,.4],lean:.2,crouch:.15},
      {t:1.5,L:[-.18,.62,0],lean:-.25,crouch:.05},
      {t:1.7,L:[-.18,.6,-.25],lean:-.35,twist:.3},
      {t:1.95,e:'o',L:[-.1,.3,.6],lean:.45,twist:-.3,crouch:.2},
      R_(2.6)],ev:[{t:.45,e:'grab',at:'hL'},{t:1.95,e:'release',imp:[0,7,13],shake:.3}]},
  },
  miner:{
    mine:{keys:[
      {t:0,R:[.15,.4,-.1],wR:[0,.9,-.4],lean:.1},
      {t:.25,R:[.1,.55,-.2],wR:[0,.6,-.8],lean:-.15},
      {t:.38,e:'o',R:[.05,-.25,.45],wR:[0,-.6,.8],lean:.5,crouch:.2,fwd:.3},
      {t:.5},
      R_(.75)],ev:[{t:.38,e:'hit'}]},
    bonk:{keys:[
      {t:0,R:[.12,.5,-.1],wR:[0,.8,-.6],crouch:.1},
      {t:.55,R:[.05,.58,-.33],wR:[0,.4,-.92],lean:-.4,crouch:.05,twist:-.2},
      {t:.75,e:'o',R:[.05,-.15,.5],wR:[0,-.7,.7],lean:.6,crouch:.3,fwd:.3,twist:0},
      {t:1.0},
      R_(1.6)],ev:[{t:.75,e:'kill',imp:[0,9.5,1.5],spin:13,shake:.15}]},
  },
};
