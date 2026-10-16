/* ---------- finishers (10 each) and charges (10 each) for Wizard, Cleric, Ninja, Wing Archer ----------
   fx on an event adds the spell picture at the blow: zap · blast · sky · push · poison · pillar · holy · flash */
const FIN_X={
  wizard:{
    disintegrate:{name:'Disintegrate',contact:2.2,keys:[{t:0},{t:.4,...WZ.RAISE,lean:-.1},{t:.6,e:'o',...WZ.POINT,lean:.2},{t:1.2,R:[.16,.12,.56]},{t:1.4},R_(1.9)],
      ev:[{t:.25,e:'charge'},{t:.6,e:'jolt',fx:'zap',mag:1.5,victim:'kneel'},{t:.85,e:'jolt',fx:'zap'},{t:1.15,e:'kill',fx:'blast',imp:[0,3,7],spin:4,shake:.3}]},
    levitateSlam:{name:'Levitate & Slam',contact:1.9,keys:[{t:0},{t:.3,L:[-.12,.05,.55],wL:[0,.3,.95],lean:.1},{t:.9,L:[-.12,.55,.45],lean:-.15},{t:1.2,L:[-.12,.62,.42]},{t:1.4,e:'o',L:[-.12,-.25,.5],lean:.45,crouch:.2},{t:1.7},R_(2.2)],
      ev:[{t:.3,e:'grab',at:'tk',fx:'zap'},{t:.9,e:'zapRag'},{t:1.38,e:'release',imp:[0,-16,1],slam:1,shake:.4}]},
    thunderJudgment:{name:'Thunder Judgment',contact:3.2,victim:'kneel',keys:[{t:0},{t:.5,...WZ.RAISE,lean:-.2},{t:.9,e:'o',R:[.16,.6,.08],wR:[0,1,0],lean:-.25},{t:1.4},R_(1.9)],
      ev:[{t:.4,e:'charge'},{t:.9,e:'kill',fx:'sky',imp:[0,1.5,0],shake:.4}]},
    fireball:{name:'Fireball',contact:2.4,keys:[{t:0},{t:.3,...WZ.TWO,twist:-.5,crouch:.1},{t:.55,e:'o',R:[.12,.08,.6],wR:[0,.2,.98],L:[-.04,.1,.55],twist:.3,lean:.35,fwd:.15},{t:.8},R_(1.3)],
      ev:[{t:.2,e:'charge'},{t:.55,e:'kill',fx:'blast',imp:[0,4,9],spin:6,shake:.25}]},
    staffImpale:{name:'Staff Impale',contact:1.25,keys:[{t:0,R:[.24,-.05,0],wR:[0,.1,1],crouch:.15,twist:-.4},{t:.3,e:'o',R:[.12,0,.6],wR:[0,.1,1],lean:.45,twist:.3,fwd:.35},{t:.9,R:[.12,.25,.5],wR:[0,.5,.86],lean:.1},{t:1.15,e:'o',R:[.14,.35,.45],wR:[0,.7,.7],lean:-.1},{t:1.5},R_(2.0)],
      ev:[{t:.3,e:'grab',at:'wtip'},{t:.9,e:'zapRag'},{t:1.15,e:'release',imp:[0,4,5],shake:.15,fx:'blast'}]},
    chokingCloud:{name:'Choking Cloud',contact:2.0,keys:[{t:0},{t:.3,...WZ.TWO,twist:-.3},{t:.45,e:'o',R:[.15,.1,.55],wR:[0,.3,.95],L:[-.05,.12,.5],lean:.25},{t:1.5},R_(2.0)],
      ev:[{t:.45,e:'jolt',fx:'poison',victim:'kneel'},{t:.9,e:'fx',fx:'poison'},{t:1.35,e:'kill',fx:'poison',imp:[0,.4,.6]}]},
    shockwave:{name:'Shockwave',contact:1.4,keys:[{t:0},{t:.35,R:[.18,.4,.3],wR:[0,1,.2],crouch:.05,lean:-.1},{t:.6,e:'o',...WZ.PLANT,crouch:.3,lean:.4,fwd:.1},{t:1.0},R_(1.5)],
      ev:[{t:.6,e:'kill',fx:'push',imp:[0,7,8],spin:7,ring:1,shake:.35}]},
    orbCrush:{name:'Orb Crush',contact:1.15,keys:[{t:0},{t:.2,...WZ.BONKUP,lean:-.15},{t:.35,e:'o',...WZ.BONK,lean:.45,crouch:.15,fwd:.2},{t:.6,...WZ.BONKUP,lean:-.2,fwd:.25},{t:.8,e:'o',...WZ.BONK,lean:.5,crouch:.2,fwd:.3},{t:1.1},R_(1.6)],
      ev:[{t:.35,e:'jolt',victim:'kneel'},{t:.8,e:'kill',fx:'zap',imp:[0,-2,1.5],shake:.2}]},
    chainLightning:{name:'Chain Lightning',contact:2.6,keys:[{t:0},{t:.25,...WZ.POINT,lean:.15},{t:.5,R:[.17,.14,.55]},{t:.75,R:[.15,.1,.56]},{t:1.0,R:[.17,.13,.55]},{t:1.15,e:'o',R:[.18,.3,.45],wR:[0,.8,.6],lean:-.1},{t:1.5},R_(2.0)],
      ev:[{t:.3,e:'jolt',fx:'zap'},{t:.55,e:'jolt',fx:'zap'},{t:.8,e:'jolt',fx:'zap',victim:'kneel'},{t:1.1,e:'kill',fx:'zap',imp:[0,3,4],spin:5,shake:.25}]},
    infernoPillar:{name:'Inferno Pillar',contact:2.8,victim:'kneel',keys:[{t:0},{t:.5,...WZ.OVER2,lean:-.2},{t:.85,e:'o',R:[.12,.62,.15],wR:[0,1,.3],L:[-.08,.58,.15],lean:-.3},{t:1.4},R_(1.9)],
      ev:[{t:.4,e:'charge'},{t:.85,e:'kill',fx:'pillar',imp:[0,12,0],spin:5,shake:.3}]},
  },
  cleric:{
    holySmite:{name:'Holy Smite',contact:1.15,keys:[{t:0},{t:.25,...CL.UP,lean:-.2,twist:-.2},{t:.42,e:'o',...CL.DOWN,lean:.5,crouch:.2,twist:.15,fwd:.2},{t:.7},R_(1.2)],
      ev:[{t:.42,e:'kill',fx:'holy',imp:[0,-2.5,1.2],shake:.2}]},
    judgement:{name:'Judgement',contact:2.8,victim:'kneel',keys:[{t:0},{t:.5,...CL.RAISE,L:[-.2,.4,.3],lean:-.2},{t:.9,e:'o',R:[.16,.55,.2],wR:[0,1,.1],lean:-.25},{t:1.4},R_(1.9)],
      ev:[{t:.4,e:'charge'},{t:.9,e:'kill',fx:'sky',col:'gold',imp:[0,1,0],shake:.35}]},
    staffWhirl:{name:'Staff Whirl',contact:1.15,keys:[{t:0,R:[.4,-.1,.2],wR:[.85,.1,.5],crouch:.15},{t:.15,yaw:-.5,R:[.3,0,-.35],wR:[.4,0,-.9],crouch:.2},{t:.55,e:'l',yaw:6.28,R:[.55,0,.12],wR:[1,0,.1],crouch:.2,fwd:.3},{t:.75,R:[.3,-.2,.3],wR:[.6,-.4,.6]},R_(1.1,{yaw:6.28})],
      ev:[{t:.5,e:'kill',imp:[3,2,2],spin:6,shake:.2}]},
    purify:{name:'Purify',contact:1.6,victim:'kneel',keys:[{t:0},{t:.45,L:[-.12,.35,.45],wL:[0,1,0],...CL.RAISE,lean:-.05},{t:1.1,L:[-.1,.42,.48]},{t:1.3,e:'o',L:[-.1,.2,.55],lean:.15},{t:1.7},R_(2.2)],
      ev:[{t:.5,e:'jolt',fx:'holy'},{t:1.3,e:'kill',fx:'pillar',col:'gold',imp:[0,2.5,.3],shake:.2}]},
    radiantPalm:{name:'Radiant Palm',contact:.8,keys:[{t:0},{t:.25,L:[-.3,0,.05],twist:.45,crouch:.12},{t:.4,e:'o',L:[-.05,.1,.6],wL:[0,0,1],twist:-.4,lean:.3,fwd:.2},{t:.7},R_(1.1)],
      ev:[{t:.4,e:'kill',fx:'holy',imp:[0,2.5,9],spin:4,shake:.25}]},
    crescentCut:{name:'Crescent Cut',contact:1.25,keys:[{t:0},{t:.2,R:[.45,.25,-.1],wR:[.7,.5,-.5],twist:-.5},{t:.4,e:'o',R:[-.12,.15,.5],wR:[-.85,.2,.45],twist:.5,lean:.35,fwd:.25},{t:.6},R_(1.1)],
      ev:[{t:.4,e:'kill',imp:[-1,1,1.5],decap:true,headImp:[-3,4,1],shake:.2}]},
    bashAndBless:{name:'Bash & Bless',contact:1.0,keys:[{t:0},{t:.2,...CL.JABW,twist:-.4},{t:.32,e:'o',...CL.JAB,twist:.3,lean:.35,fwd:.25},{t:.6,L:[-.25,.05,.1],twist:.4},{t:.78,e:'o',L:[-.05,.12,.58],wL:[0,0,1],twist:-.4,lean:.3,fwd:.35},{t:1.1},R_(1.6)],
      ev:[{t:.32,e:'jolt',mag:2},{t:.78,e:'kill',fx:'holy',imp:[0,2,6],shake:.2}]},
    pinAndPray:{name:'Pin & Pray',contact:1.2,keys:[{t:0},{t:.12,R:[.42,-.25,-.05],wR:[.8,-.4,-.45],crouch:.3,lean:.3,twist:-.5},{t:.3,e:'o',R:[-.05,-.4,.45],wR:[-.7,-.4,.6],crouch:.35,lean:.45,twist:.4,fwd:.2},{t:.7,R:[.15,.45,.3],wR:[0,-.95,.25],crouch:.05,lean:.1,fwd:.55},{t:.9,e:'o',R:[.15,-.2,.5],wR:[0,-1,.1],crouch:.35,lean:.55,fwd:.65},{t:1.3,...CL.PRAY,crouch:.2,lean:.25},{t:1.9},R_(2.4)],
      ev:[{t:.3,e:'knock',imp:[0,2.2,.5],spin:4},{t:.9,e:'stabRag',imp:[0,-5,0],shake:.15,fx:'holy'}]},
    ascension:{name:'Ascension',contact:1.6,keys:[{t:0},{t:.3,L:[-.12,.05,.55],wL:[0,.3,.95]},{t:1.3,L:[-.12,.62,.35],lean:-.25},{t:1.5,e:'o',L:[-.12,.66,.3]},{t:1.9},R_(2.4)],
      ev:[{t:.3,e:'grab',at:'tk',fx:'holy'},{t:1.5,e:'release',imp:[0,9,0],shake:.1,fx:'holy'}]},
    lastRites:{name:'Last Rites',contact:.85,victim:'kneel',keys:[{t:0},{t:.5,L:[-.06,.15,.48],wL:[0,-.3,.95],lean:.15},{t:1.3,L:[-.06,.12,.5]},{t:1.5,e:'o',L:[-.06,.05,.52],lean:.2},{t:1.9},R_(2.3)],
      ev:[{t:.5,e:'jolt',fx:'holy'},{t:1.5,e:'kill',fx:'holy',imp:[0,.2,1]}]},
  },
  ninja:{
    throatSlit:{name:'Throat Slit',contact:.75,keys:[{t:0,...NJ.SIDEW,twist:-.5,crouch:.15},{t:.2,e:'o',...NJ.SIDE,twist:.5,lean:.3,fwd:.15},{t:.4,R:[-.25,-.1,.35],wR:[-.9,-.2,-.3]},{t:.9},R_(1.3)],
      ev:[{t:.2,e:'kill',imp:[0,.5,1.2],shake:.12,bleedNeck:1}]},
    dashBehead:{name:'Dash Behead',contact:1.0,keys:[{t:0,crouch:.3,lean:.4,...NJ.SIDEW,twist:-.5},{t:.2,crouch:.32},{t:.42,e:'o',...NJ.SIDE,twist:.5,lean:.55,crouch:.25,fwd:2.0},{t:.6,fwd:2.3,R:[-.3,-.1,.35],wR:[-.9,-.2,-.3]},{t:1.0},R_(1.4)],
      ev:[{t:.38,e:'kill',imp:[0,.5,1],decap:true,headImp:[0,4,-2],shake:.2}]},
    thousandShadows:{name:'Thousand Shadows',contact:1.0,keys:[{t:0,...NJ.SIDEW},{t:.1,e:'o',...NJ.SIDE,twist:.4,fwd:.1},{t:.2,...NJ.HIGH},{t:.3,e:'o',...NJ.CUT,lean:.4},{t:.4,R:[-.15,.4,.3],wR:[-.4,.8,-.3]},{t:.5,e:'o',R:[.4,-.25,.42],wR:[.65,-.55,.5],fwd:.2},{t:.6,...NJ.STABW},{t:.7,e:'o',...NJ.STAB,lean:.4,fwd:.3},{t:.8,...NJ.SIDEW},{t:.9,e:'o',...NJ.SIDE,fwd:.35},{t:1.05,R:[.4,-.1,.2],wR:[.85,.1,.5]},{t:1.35,e:'l',yaw:6.28,R:[.55,.05,.12],wR:[1,.05,.1],fwd:.5},{t:1.55},R_(1.9,{yaw:6.28})],
      ev:[{t:.1,e:'jolt'},{t:.3,e:'jolt'},{t:.5,e:'jolt'},{t:.7,e:'jolt'},{t:.9,e:'jolt',victim:'kneel'},{t:1.3,e:'kill',imp:[2,2,3],spin:6,shake:.2}]},
    aerialImpale:{name:'Aerial Impale',contact:.95,keys:[{t:0,crouch:.15},{t:.2,e:'o',kick:1,lean:-.35,fwd:.1},{t:.35,kick:0,crouch:.35},{t:.6,jump:1.1,fwd:.6,R:[.16,.5,.2],wR:[0,-.95,.2],crouch:0,lean:-.1},{t:.78,e:'o',jump:.3,fwd:.95,R:[.15,-.25,.5],wR:[0,-1,.1],crouch:.3,lean:.55},{t:.9,jump:0,crouch:.4},R_(1.5)],
      ev:[{t:.2,e:'knock',imp:[0,1.5,3]},{t:.78,e:'stabRag',imp:[0,-6,0],shake:.2},{t:.9,e:'land'}]},
    crossSlash:{name:'Cross Slash',contact:.95,keys:[{t:0,R:[.42,.42,-.1],wR:[.55,.6,-.55],pR:[.5,.4,.5],twist:-.4,crouch:.1},{t:.18,e:'o',R:[-.12,-.3,.5],wR:[-.6,-.6,.5],pR:null,twist:.4,lean:.4,crouch:.2,fwd:.3},{t:.35,R:[-.2,.4,.32],wR:[-.5,.7,-.3],twist:.55,lean:.1,fwd:.35},{t:.5,e:'o',R:[.42,-.3,.42],wR:[.65,-.6,.45],twist:-.35,lean:.45,crouch:.22,fwd:.5},{t:.9},R_(1.3)],
      ev:[{t:.18,e:'jolt'},{t:.5,e:'kill',imp:[0,1.2,3.2],shake:.15}]},
    backstab:{name:'Backstab',contact:.95,keys:[{t:0,R:[.2,-.1,.3],wR:[.1,-.95,.25],crouch:.15},{t:.25,yaw:3.14,fwd:.9,crouch:.25,lean:.2},{t:.45,e:'o',R:[.2,-.2,-.35],wR:[0,-.1,-1],yaw:3.14,lean:-.25,fwd:.95},{t:.95,yaw:3.14},{t:1.15,e:'o',R:[.25,-.1,-.1],wR:[.4,-.6,-.7],yaw:3.14},{t:1.6,yaw:6.28},R_(2.0,{yaw:6.28})],
      ev:[{t:.45,e:'grab',at:'wtip'},{t:1.15,e:'release',imp:[0,1,3],shake:.12}]},
    flipDecap:{name:'Flip Decap',contact:1.0,keys:[{t:0,crouch:.35,...NJ.HIGH},{t:.2,crouch:.4},{t:.5,e:'o',jump:1.4,fwd:.9,lean:-.6,crouch:0},{t:.62,...NJ.SIDE,jump:1.2,fwd:1.3},{t:.85,e:'i',jump:0,fwd:1.9,crouch:.35,lean:.3},{t:1.2,yaw:3.14},R_(1.6,{yaw:3.14})],
      ev:[{t:.6,e:'kill',imp:[0,1,-1],decap:true,headImp:[0,6,-1],shake:.2},{t:.85,e:'land'}]},
    kickAndCut:{name:'Kick & Cut',contact:.9,keys:[{t:0,lean:-.1,L:[-.3,-.2,.2]},{t:.2,e:'o',kick:1,lean:-.3,fwd:.1},{t:.4,kick:0,fwd:.2},{t:.7,R:[.16,.45,.25],wR:[0,-.95,.25],lean:.1,fwd:.85},{t:.88,e:'o',R:[.15,-.3,.5],wR:[0,-1,.1],crouch:.45,lean:.6,fwd:.95},{t:1.2},R_(1.7)],
      ev:[{t:.2,e:'knock',imp:[0,1.2,3.2]},{t:.88,e:'stabRag',imp:[0,-5,0],shake:.15}]},
    hiltAndEdge:{name:'Hilt & Edge',contact:.9,keys:[{t:0,R:[.24,-.1,.22],wR:[0,.45,-.89],crouch:.1,twist:-.4},{t:.16,e:'o',R:[.12,.2,.6],wR:[0,.5,-.86],lean:.4,twist:.35,fwd:.3},{t:.4,R:[-.18,.18,.36],wR:[-.6,.5,.6],twist:.6,lean:.1},{t:.55,e:'o',R:[.45,.1,.38],wR:[.9,0,.4],twist:-.4,lean:.35,fwd:.45},{t:.75,R:[.5,-.1,.1],wR:[.9,-.3,-.3]},R_(1.2)],
      ev:[{t:.16,e:'jolt',mag:2},{t:.55,e:'kill',imp:[1.5,1,1.5],decap:true,headImp:[3,5,2],shake:.2}]},
    iaiStrike:{name:'Iai Strike',contact:1.05,keys:[{t:0,R:[.18,-.3,-.05],wR:[.4,-.8,-.4],crouch:.25,lean:.3},{t:.6,crouch:.3},{t:.72,e:'o',...NJ.SIDE,twist:.6,lean:.55,crouch:.2,fwd:1.6},{t:1.4,R:[-.3,-.1,.3],wR:[-.9,-.2,-.3],fwd:1.65},{t:1.6,e:'o',R:[.18,-.3,-.05],wR:[.4,-.8,-.4]},R_(2.0)],
      ev:[{t:.7,e:'jolt',fx:'flash'},{t:1.6,e:'kill',imp:[0,.3,.5],decap:true,headImp:[0,2.5,0],shake:.15}]},
  },
  wing:{
    liftAndDrop:{name:'Lift & Drop',contact:.95,alt:1,keys:[{t:0,alt:CRUISE},{t:.45,alt:1.25,lean:.35,L:[-.1,-.1,.5],wL:[0,0,1]},{t:.55,e:'o',alt:1.2,L:[-.05,-.2,.45]},{t:1.7,alt:6.5,lean:-.1,L:[-.08,-.28,.3]},{t:1.9,e:'o',L:[-.2,-.1,.4]},{t:2.2,...WG.GRIP},RA(2.6)],
      ev:[{t:.55,e:'grab',at:'hL'},{t:1.9,e:'release',imp:[0,0,1.5],shake:.1}]},
    boltBlank:{name:'Point-Blank Bolt',contact:1.6,aim:1,alt:1,keys:[{t:0,alt:CRUISE},{t:.5,alt:1.55,...WG.AIM,lean:.05},{t:.7,e:'o',alt:1.55,R:[.12,-.05,.45]},{t:.9,...WG.RL1},{t:1.2,...WG.RL2,alt:2.6},{t:1.45,...WG.GRIP},RA(1.8)],
      ev:[{t:.7,e:'kill',imp:[0,1,5],shake:.15,bolt:1},{t:1.2,e:'reload'}]},
    pinningBolt:{name:'Pinning Bolt',contact:1.0,alt:1,keys:[{t:0,alt:CRUISE},{t:.3,alt:1.3,lean:.3},{t:.42,e:'o',alt:1.0,kick:1,lean:-.2},{t:.6,kick:0,alt:2.0},{t:.85,...WG.AIM,alt:2.3,lean:.3},{t:.95,e:'o'},{t:1.15,...WG.RL1},{t:1.35,...WG.RL2},{t:1.5,...WG.AIM},{t:1.58,e:'o'},{t:1.8,...WG.GRIP},RA(2.2)],
      ev:[{t:.42,e:'knock',imp:[0,1.5,3.5]},{t:.93,e:'execute'},{t:1.35,e:'reload'},{t:1.56,e:'execute'}]},
    diveStomp:{name:'Dive Stomp',contact:.75,alt:1,keys:[{t:0,alt:CRUISE},{t:.3,alt:1.4,lean:.3},{t:.4,e:'o',alt:1.05,kick:1,lean:-.25},{t:.55,kick:0,alt:1.9},{t:.85,alt:1.6,lean:-.15},{t:1.0,e:'o',alt:.9,kick:.9,lean:-.3},{t:1.2,kick:0,alt:1.8},RA(1.8)],
      ev:[{t:.4,e:'knock',imp:[0,1.5,3.2]},{t:1.0,e:'stabRag',at:'foot',imp:[0,-8,0],ring:1,shake:.3}]},
    stockSmash:{name:'Stock Smash',contact:.95,alt:1,keys:[{t:0,alt:CRUISE},{t:.4,alt:1.5,R:[.25,.35,-.1],wR:[0,.6,-.8],pR:[.5,.4,.4],lean:.2},{t:.6,e:'o',alt:1.4,R:[.12,-.05,.5],wR:[0,-.6,.8],pR:null,lean:.45},{t:.9,alt:2.4},{t:1.2,...WG.HOLD},RA(1.6)],
      ev:[{t:.6,e:'kill',imp:[0,-3,2],spin:5,shake:.2}]},
    strafingRun:{name:'Strafing Run',contact:2.6,aim:1,alt:1,keys:[{t:0,alt:CRUISE},{t:.4,alt:2.1,...WG.AIM,lean:.3,fwd:.6},{t:.5,e:'o',fwd:.9},{t:.62,...WG.RL2,fwd:1.3},{t:.74,...WG.AIM,fwd:1.7},{t:.8,e:'o',fwd:1.9},{t:.92,...WG.RL2,fwd:2.3},{t:1.04,...WG.AIM,fwd:2.7},{t:1.1,e:'o',fwd:2.9},...SHOT(1.1),RA(2.1)],
      ev:[{t:.48,e:'kill',imp:[0,1,4],shake:.12,bolt:1},{t:.78,e:'execute'},{t:1.08,e:'execute'},{t:1.5,e:'reload'}]},
    skyThrow:{name:'Sky Throw',contact:.95,alt:1,keys:[{t:0,alt:CRUISE},{t:.45,alt:1.25,lean:.35,L:[-.1,-.1,.5]},{t:.55,e:'o',alt:1.2,L:[-.05,-.2,.45]},{t:1.2,alt:4.2,L:[-.08,-.28,.3]},{t:1.7,e:'l',yaw:6.28,alt:4.4,L:[-.5,-.1,.2]},{t:1.8,L:[-.2,-.05,.5]},{t:2.1,...WG.GRIP},RA(2.5,{yaw:6.28})],
      ev:[{t:.55,e:'grab',at:'hL'},{t:1.72,e:'release',imp:[0,3,11],shake:.15}]},
    heavensFall:{name:"Heaven's Fall",contact:.95,alt:1,keys:[{t:0,alt:CRUISE},{t:.45,alt:1.25,lean:.35,L:[-.1,-.1,.5]},{t:.55,e:'o',alt:1.2,L:[-.05,-.2,.45]},{t:2.0,alt:8.5,lean:-.15,L:[-.08,-.3,.28]},{t:2.2,e:'o',L:[-.25,-.05,.35]},{t:2.6,...WG.GRIP,alt:7.5},RA(3.4)],
      ev:[{t:.55,e:'grab',at:'hL'},{t:2.2,e:'release',imp:[0,1,1],shake:.1}]},
    wingSlash:{name:'Wing Slash',contact:1.3,alt:1,keys:[{t:0,alt:CRUISE},{t:.4,alt:1.7,side:-.7,lean:.35,fwd:.6},{t:.55,e:'o',alt:1.55,side:-.8,fwd:1.1},{t:.9,alt:2.6,side:0,lean:0,fwd:1.6},RA(1.4)],
      ev:[{t:.52,e:'kill',imp:[-6,3,4],spin:6,shake:.2,bleedNeck:1}]},
    hoverExecution:{name:'Hover Execution',contact:1.4,victim:'kneel',aim:1,alt:1,keys:[{t:0,alt:CRUISE},{t:.6,alt:2.6,...WG.AIM,lean:.35},{t:1.1,e:'o',R:[.12,-.05,.45]},{t:1.3,...WG.RL1},{t:1.55,...WG.RL2},{t:1.8,...WG.GRIP},RA(2.2)],
      ev:[{t:1.1,e:'kill',imp:[0,-1,2],shake:.15,bolt:1},{t:1.55,e:'reload'}]},
  },
};
for(const t in FIN_X){ FINS[t]=[]; for(const n in FIN_X[t]){ const d=FIN_X[t][n];
  RAW[t][n]={keys:d.keys,ev:d.ev,alt:d.alt,aim:d.aim}; FIN[n]={name:d.name,clip:n,contact:d.contact,victim:d.victim}; FINS[t].push(n); } }
for(const n in FIN_X.wing){ const c=RAW.wing[n]; c.keys=c.keys.map((k,i)=>i===0||k.rest?Object.assign({alt:CRUISE},k):k); }
const FIN_AIM_X={
  staffImpale:[[.3,'tip','chest']], orbCrush:[[.35,'tip','head'],[.8,'tip','head']],
  holySmite:[[.42,'tip','head']], staffWhirl:[[.5,'blade','chest']], radiantPalm:[[.4,'hL','chest']], crescentCut:[[.4,'blade','neck']],
  bashAndBless:[[.32,'tip','head'],[.78,'hL','chest']], pinAndPray:[[.3,'blade','shin'],[.9,'tip','chest']], lastRites:[[.5,'hL','head']],
  throatSlit:[[.2,'blade','neck']], dashBehead:[[.38,'blade','neck']], thousandShadows:[[.1,'blade','chest'],[.3,'blade','chest'],[.5,'blade','chest'],[.7,'tip','gut'],[.9,'blade','chest'],[1.3,'blade','chest']],
  aerialImpale:[[.2,'foot','gut'],[.78,'tip','chest']], crossSlash:[[.18,'blade','chest'],[.5,'blade','chest']], backstab:[[.45,'tip','chest']],
  flipDecap:[[.6,'blade','neck']], kickAndCut:[[.2,'foot','gut'],[.88,'tip','chest']], hiltAndEdge:[[.16,'pommel','head'],[.55,'blade','neck']], iaiStrike:[[.7,'blade','neck']],
  liftAndDrop:[[.55,'hL','neck']], pinningBolt:[[.42,'foot','gut']], diveStomp:[[.4,'foot','chest']], stockSmash:[[.6,'pommel','head']],
  skyThrow:[[.55,'hL','neck']], heavensFall:[[.55,'hL','neck']],
};
// where spell kills land (for the picture of the spell; no limb has to touch)
const FIN_HIT_X={disintegrate:{.6:'chest',.85:'chest',1.15:'chest'},thunderJudgment:{.9:'head'},fireball:{.55:'chest'},chokingCloud:{.45:'head',1.35:'head'},
  shockwave:{.6:'chest'},chainLightning:{.3:'chest',.55:'chest',.8:'chest',1.1:'chest'},infernoPillar:{.85:'chest'},judgement:{.9:'head'},purify:{.5:'head',1.3:'chest'},
  ascension:{.3:'chest'},levitateSlam:{.3:'chest'},boltBlank:{.7:'head'},strafingRun:{.48:'chest'},wingSlash:{.52:'neck'},hoverExecution:{1.1:'head'}};

// ---- charges: 10 each ----
for(const t of ['wizard','cleric','ninja','wing']) CHG[t]=[];
// Wizard: spells cast on the run
chg('wizard','runBlast','Running Blast',{R:[.2,.05,.4],wR:[0,.55,.83],L:[-.26,-.3,-.1]},[{t:.1,...WZ.RAISE,lean:.1},{t:.3,e:'o',...WZ.POINT,lean:.3,fwd:.5},{t:.5,fwd:.7},R_(.85)],[{t:.3,e:'blast',dmg:1.1}]);
chg('wizard','leapBlast','Leaping Blast',{R:[.22,.3,.25],wR:[0,.9,.4]},[{t:.08,crouch:.3},{t:.25,jump:.8,...WZ.RAISE,crouch:0,fwd:.4},{t:.42,e:'o',jump:.5,R:[.16,-.05,.55],wR:[0,-.45,.89],lean:.35,fwd:.8},{t:.58,e:'i',jump:0,crouch:.3,fwd:1},R_(1.0)],[{t:.42,e:'blast',dmg:1.2},{t:.58,e:'land'}]);
chg('wizard','slideCast','Slide Cast',{R:[.24,-.1,.3],wR:[0,.7,.7],lean:.2},[{t:.12,crouch:.4,lean:-.15,fwd:.5,...WZ.POINT},{t:.3,e:'o',crouch:.42,fwd:.9},{t:.5,fwd:1.0},R_(.95)],[{t:.3,e:'blast',dmg:1}]);
chg('wizard','twinRun','Twin Blast Run',{R:[.18,.1,.42],wR:[0,.5,.86],L:[-.2,.05,.35]},[{t:.15,e:'o',...WZ.POINT,twist:.2,fwd:.3},{t:.28,...WZ.PALM,twist:-.3,fwd:.5},{t:.4,e:'o',L:[-.1,.1,.6],fwd:.65},{t:.55},R_(.95)],[{t:.15,e:'blast',dmg:.6},{t:.4,e:'blast',dmg:.6,from:'hL'}]);
chg('wizard','lightningDash','Lightning Dash',{R:[.16,.45,.15],wR:[0,1,.2]},[{t:.15,R:[.16,.56,.1],wR:[0,1,.05],lean:-.1},{t:.3,e:'o',lean:.1,fwd:.4},R_(.8)],[{t:.3,e:'lightning',dmg:1.1}]);
chg('wizard','wallSprint','Wall Sprint',{R:[.22,-.25,.38],wR:[0,-.5,.86]},[{t:.15,R:[.2,.2,.4],wR:[0,.8,.5]},{t:.3,e:'o',...WZ.PLANT,crouch:.25,lean:.35,fwd:.4},{t:.6},R_(1.0)],[{t:.3,e:'ewall'}]);
chg('wizard','poisonTrail','Poison Trail',{...WZ.TWO},[{t:.12,twist:-.4},{t:.3,e:'o',R:[.18,.1,.55],wR:[-.2,.3,.93],L:[-.05,.12,.5],twist:.2,lean:.25,fwd:.4},{t:.5,twist:.4},R_(.9)],[{t:.3,e:'poison'}]);
chg('wizard','staffCharge','Staff Charge',{R:[.14,-.02,.55],wR:[0,.1,1],L:[-.05,0,.45]},[{t:.1,R:[.2,-.05,.2],twist:-.3},{t:.22,e:'o',R:[.12,0,.64],wR:[0,.05,1],twist:.3,lean:.5,crouch:.2,fwd:.8},{t:.4},R_(.85)],[HIT(.22,['tip','chest'],{dmg:1,kb:3})]);
chg('wizard','spinCast','Spin Cast',{R:[.4,0,.1],wR:[.9,.2,.3]},[{t:.06,yaw:-.4},{t:.36,e:'l',yaw:6.28,R:[.45,.05,.1],wR:[1,.1,.1]},{t:.5,e:'o',...WZ.POINT,fwd:.5},{t:.65},R_(1.05,{yaw:6.28})],[{t:.5,e:'blast',dmg:1}]);
chg('wizard','meteorRun','Meteor Run',{...WZ.OVER2},[{t:.2,R:[.12,.6,.1],wR:[0,1,.2],L:[-.08,.56,.1],lean:-.25},{t:.42,e:'o',R:[.12,0,.52],wR:[0,-.4,.92],L:[-.06,.02,.48],lean:.4,crouch:.2,fwd:.5},{t:.6},R_(1.05)],[{t:.42,e:'blast',dmg:1.4,meteor:1}]);
// Cleric: holy strikes at a run
chg('cleric','staffRush','Staff Rush',{R:[.14,-.02,.55],wR:[0,.1,1],L:[-.05,0,.45]},[{t:.1,...CL.JABW,twist:-.3},{t:.22,e:'o',...CL.JAB,twist:.3,lean:.5,crouch:.2,fwd:.8},{t:.4},R_(.85)],[HIT(.22,['tip','chest'],{dmg:1.2,kb:2.6})]);
chg('cleric','crescentRush','Crescent Rush',{R:[.42,.2,-.1],wR:[.7,.5,-.5]},[{t:.1,twist:-.4},{t:.24,e:'o',R:[-.12,.15,.5],wR:[-.85,.2,.45],twist:.5,lean:.4,fwd:.6},{t:.42},R_(.85)],[HIT(.24,['blade','chest'],{dmg:1.2,kb:2.2})]);
chg('cleric','holyRam','Holy Ram',{R:[.24,-.2,.15],wR:[0,1,.1],lean:.3},[{t:.12,lean:.55,twist:.4,crouch:.15},{t:.26,e:'o',lean:.6,twist:.5,fwd:.8,crouch:.2},{t:.45,lean:.1,twist:0},R_(.9)],[HIT(.26,['shoulder','chest'],{dmg:.8,kb:4,fx:'holy'})]);
chg('cleric','leapSmite','Leaping Smite',{...CL.RAISE},[{t:.08,crouch:.3},{t:.25,jump:.8,...CL.UP,crouch:0,fwd:.4},{t:.42,e:'o',jump:.3,...CL.DOWN,lean:.55,fwd:.8},{t:.55,e:'i',jump:0,crouch:.3,fwd:1},R_(1.0)],[HIT(.42,['tip','head'],{dmg:1.4,kb:2.4,fx:'holy'}),{t:.55,e:'land'}]);
chg('cleric','sweepRun','Sweeping Run',{R:[.4,-.25,0],wR:[.8,-.4,-.4]},[{t:.12,crouch:.3,lean:.3,twist:-.5},{t:.26,e:'o',R:[-.05,-.4,.45],wR:[-.7,-.4,.6],crouch:.35,lean:.45,twist:.4,fwd:.6},{t:.42},R_(.85)],[HIT(.26,['blade','shin'],{dmg:.9,kb:1.2,up:2})]);
chg('cleric','palmRush','Radiant Palm Rush',{L:[-.3,0,.05]},[{t:.12,twist:.45,crouch:.12},{t:.26,e:'o',L:[-.05,.1,.6],wL:[0,0,1],twist:-.4,lean:.4,fwd:.6},{t:.45},R_(.85)],[HIT(.26,['hL','chest'],{dmg:.7,kb:3.8,fx:'holy'})]);
chg('cleric','spinRush','Whirling Staff',{R:[.4,-.05,.15],wR:[.9,.1,.3]},[{t:.06,yaw:-.4},{t:.4,e:'l',yaw:6.28,R:[.55,0,.12],wR:[1,0,.1],fwd:.5},{t:.55},R_(.95,{yaw:6.28})],[{t:.36,e:'hit',arc:1,dmg:.9,kb:2.2}]);
chg('cleric','flashRush','Flash Rush',{...CL.RAISE},[{t:.15,R:[.16,.55,.2],wR:[0,1,.15],lean:-.1},{t:.3,e:'o',lean:.15,fwd:.5},{t:.5},R_(.9)],[{t:.3,e:'flash'}]);
chg('cleric','vaultKick','Staff Vault',{R:[.2,-.25,.35],wR:[0,-.6,.8]},[{t:.12,crouch:.35},{t:.32,e:'o',jump:1.1,kick:1,R:[.15,-.35,.15],wR:[0,-.95,.2],lean:-.35,fwd:.7,crouch:0},{t:.48,jump:.4,kick:.4},{t:.65,e:'i',jump:0,kick:0,crouch:.35,fwd:.9},R_(1.1)],[HIT(.32,['foot','chest'],{dmg:.8,kb:3.6}),{t:.65,e:'land'}]);
chg('cleric','gemLance','Gem Lance',{R:[.16,.1,.5],wR:[0,.3,.95]},[{t:.1,R:[.2,.05,.2],twist:-.3},{t:.24,e:'o',R:[.12,.05,.64],wR:[0,.15,1],twist:.3,lean:.5,crouch:.15,fwd:.8},{t:.42},R_(.85)],[HIT(.24,['tip','chest'],{dmg:1.3,kb:2.4,fx:'holy'})]);
// Ninja: the fastest strikes in the army
chg('ninja','shadowDash','Shadow Dash',{...NJ.BACK},[{t:.08,...NJ.SIDEW,twist:-.4},{t:.2,e:'o',...NJ.SIDE,twist:.5,lean:.55,crouch:.25,fwd:1.2},{t:.36,fwd:1.5,R:[-.3,-.1,.35],wR:[-.9,-.2,-.3]},R_(.75)],[HIT(.2,['blade','chest'],{dmg:1.4,kb:2.2})]);
chg('ninja','leapCut','Leap Cut',{...NJ.BACK},[{t:.06,crouch:.3},{t:.2,jump:.8,...NJ.HIGH,crouch:0,fwd:.4},{t:.32,e:'o',jump:.3,...NJ.CUT,lean:.55,fwd:.8},{t:.42,e:'i',jump:0,crouch:.3,fwd:1},R_(.8)],[HIT(.32,['blade','neck'],{dmg:1.5,kb:2.4}),{t:.42,e:'land'}]);
chg('ninja','slideCut','Slide Cut',{R:[.4,-.3,-.05],wR:[.8,-.45,-.4],lean:.4},[{t:.1,crouch:.45,lean:-.1,fwd:.5},{t:.24,e:'o',R:[-.05,-.4,.45],wR:[-.7,-.35,.6],crouch:.45,lean:.4,twist:.4,fwd:.9},{t:.42},R_(.8)],[HIT(.24,['blade','shin'],{dmg:1,kb:1.2,up:2.5})]);
chg('ninja','spinDash','Spinning Dash',{R:[.4,-.1,.2],wR:[.85,.1,.5]},[{t:.05,yaw:-.4},{t:.32,e:'l',yaw:6.28,R:[.55,-.05,.1],wR:[1,0,.1],fwd:.6},{t:.45},R_(.8,{yaw:6.28})],[{t:.28,e:'hit',arc:1,dmg:1.1,kb:2}]);
chg('ninja','stabRush','Stab Rush',{...NJ.STABW,L:[-.25,-.3,-.3]},[{t:.1,crouch:.25,twist:-.4},{t:.2,e:'o',...NJ.STAB,lean:.6,crouch:.25,twist:.4,fwd:.9},{t:.36},R_(.7)],[HIT(.2,['tip','chest'],{dmg:1.5,kb:2.4})]);
chg('ninja','flipStrike','Flip Strike',{...NJ.BACK},[{t:.08,crouch:.35},{t:.3,e:'o',jump:1.2,lean:-.7,fwd:.6,...NJ.HIGH,crouch:0},{t:.42,e:'o',jump:.4,...NJ.CUT,lean:.5,fwd:1.0},{t:.52,e:'i',jump:0,crouch:.35,fwd:1.1},R_(.9)],[HIT(.42,['blade','head'],{dmg:1.6,kb:2.5}),{t:.52,e:'land'}]);
chg('ninja','lowRush','Low Rush',{R:[.22,-.42,-.1],wR:[.03,-.6,-.8],crouch:.15},[{t:.08,crouch:.25,lean:.45},{t:.2,e:'o',R:[.18,.35,.45],wR:[.02,.95,.3],pR:[.5,-.3,.2],crouch:0,lean:-.05,twist:.3,fwd:.7},{t:.32},R_(.7)],[HIT(.2,['blade','chest'],{dmg:1.3,kb:1.8,up:3})]);
chg('ninja','kickRush','Flying Kick',{...NJ.BACK},[{t:.08,crouch:.25},{t:.22,e:'o',jump:.8,kick:1,lean:-.4,crouch:0,fwd:.7},{t:.35,jump:.3,kick:.4},{t:.45,e:'i',jump:0,kick:0,crouch:.3,fwd:.9},R_(.85)],[HIT(.22,['foot','chest'],{dmg:.8,kb:3.6}),{t:.45,e:'land'}]);
chg('ninja','aerialDive','Aerial Dive',{...NJ.BACK},[{t:.08,crouch:.4},{t:.3,e:'o',jump:1.4,fwd:.7,R:[.16,.5,.2],wR:[0,-.95,.2],crouch:0,lean:-.2},{t:.45,e:'o',jump:.4,fwd:1.1,...NJ.STAB,lean:.65},{t:.55,e:'i',jump:0,crouch:.4,fwd:1.2},R_(.95)],[HIT(.45,['tip','chest'],{dmg:1.6,kb:2.6}),{t:.55,e:'land'}]);
chg('ninja','crossRush','Cross Rush',{R:[.42,.42,-.1],wR:[.55,.6,-.55],pR:[.5,.4,.5]},[{t:.15,e:'o',R:[-.12,-.3,.5],wR:[-.6,-.6,.5],pR:null,twist:.4,lean:.45,fwd:.5},{t:.28,R:[-.2,.4,.32],wR:[-.5,.7,-.3],twist:.55},{t:.4,e:'o',R:[.42,-.3,.42],wR:[.65,-.6,.45],twist:-.35,lean:.5,fwd:.8},{t:.55},R_(.85)],[HIT(.15,['blade','chest'],{dmg:.8,kb:1.4}),HIT(.4,['blade','chest'],{dmg:.9,kb:2.2})]);
// Wing Archer: diving passes over the enemy
const WCH=(o)=>Object.assign({aim:1,alt:1},o);
chg('wing','diveShot','Dive Shot',{R:[.15,-.2,.4],wR:[0,-.5,.86],L:[-.14,.5,-.12],lean:.2},[{t:0,alt:CRUISE},{t:.3,alt:2.0,lean:.45,...WG.AIM,fwd:.8},{t:.42,e:'o',alt:1.9,fwd:1.1},{t:.6,...WG.RL1,alt:2.6,fwd:1.5},{t:.85,...WG.RL2,alt:3.1},{t:1.05,...WG.GRIP},RA(1.3)],[{t:.4,e:'fire',dmg:1.25},{t:.85,e:'reload'}],WCH());
chg('wing','strafePass','Strafing Pass',{R:[.15,-.2,.4],wR:[0,-.5,.86],L:[-.14,.5,-.12],side:.3},[{t:0,alt:CRUISE},{t:.25,alt:2.4,side:.6,...WG.AIM,fwd:.6},{t:.32,e:'o'},{t:.42,...WG.RL2},{t:.55,...WG.AIM,fwd:1.2},{t:.6,e:'o'},{t:.8,...WG.GRIP,side:0,alt:3},RA(1.2)],[{t:.3,e:'fire',dmg:.7},{t:.42,e:'reload'},{t:.58,e:'fire',dmg:.7}],WCH());
chg('wing','swoopStrike','Swoop Kick',{lean:.4},[{t:0,alt:CRUISE},{t:.3,alt:1.2,lean:.5,fwd:.8},{t:.42,e:'o',alt:.95,kick:1,lean:-.2,fwd:1.1},{t:.55,kick:0,alt:1.5,fwd:1.5},{t:.9,alt:2.8,fwd:2},RA(1.25)],[HIT(.42,['foot','chest'],{dmg:.8,kb:3.6})],WCH({aim:0}));
chg('wing','climbShot','Climb & Shoot',{lean:-.1},[{t:0,alt:CRUISE},{t:.4,alt:5.4,lean:-.2},{t:.6,...WG.AIM,alt:5.6,lean:.3},{t:.68,e:'o'},{t:.85,...WG.RL1},{t:1.05,...WG.RL2,alt:4.6},{t:1.3,...WG.GRIP,alt:3.8},RA(1.6)],[{t:.65,e:'fire',dmg:1.3},{t:1.05,e:'reload'}],WCH());
chg('wing','rollShot','Barrel Roll Shot',{side:-.3},[{t:0,alt:CRUISE},{t:.2,side:.9,twist:.4,alt:3},{t:.4,side:-.9,twist:-.4,alt:2.7},{t:.55,...WG.AIM,side:0,twist:0},{t:.62,e:'o'},...SHOT(.6),RA(1.5)],[{t:.6,e:'fire',dmg:1.1},{t:1.0,e:'reload'}],WCH());
chg('wing','blazingDive','Blazing Dive',{R:[.15,-.2,.4],wR:[0,-.5,.86],lean:.25},[{t:0,alt:CRUISE},{t:.35,alt:1.9,lean:.45,...WG.AIM,fwd:.8},{t:.46,e:'o',fwd:1.1},{t:.65,...WG.RL1,alt:2.6,fwd:1.5},{t:.9,...WG.RL2,alt:3.1},{t:1.1,...WG.GRIP},RA(1.35)],[{t:.1,e:'ignite'},{t:.44,e:'fire',dmg:1.1,burn:1},{t:.9,e:'reload'}],WCH());
chg('wing','doubleDive','Double Dive',{R:[.15,-.2,.4],wR:[0,-.5,.86]},[{t:0,alt:CRUISE},{t:.3,alt:2.1,...WG.AIM,lean:.4,fwd:.7},{t:.36,e:'o'},{t:.46,...WG.RL2},{t:.58,...WG.AIM},{t:.64,e:'o',fwd:1.2},...SHOT(.62),RA(1.55)],[{t:.34,e:'fire',dmg:.75},{t:.46,e:'reload'},{t:.62,e:'fire',dmg:.75},{t:1.02,e:'reload'}],WCH());
chg('wing','lowSkim','Low Skim',{lean:.3},[{t:0,alt:CRUISE},{t:.35,alt:1.3,lean:.55,fwd:1},{t:.5,...WG.AIM,lean:.3,fwd:1.4},{t:.56,e:'o',fwd:1.6},{t:.8,...WG.RL1,alt:2.2,fwd:2},{t:1.0,...WG.RL2,alt:3},{t:1.2,...WG.GRIP},RA(1.45)],[{t:.54,e:'fire',dmg:1.15},{t:1.0,e:'reload'}],WCH());
chg('wing','talonSwipe','Talon Swipe',{lean:.35},[{t:0,alt:CRUISE},{t:.3,alt:1.35,lean:.45,fwd:.8},{t:.42,e:'o',alt:1.15,kick:1,lean:-.3,fwd:1.2},{t:.55,kick:0,alt:1.8,fwd:1.6},{t:.9,alt:3,fwd:2},RA(1.2)],[HIT(.42,['foot','head'],{dmg:.9,kb:3})],WCH({aim:0}));
chg('wing','stoopVolley','Stoop Volley',{R:[.15,-.2,.4],wR:[0,-.6,.8],lean:.3},[{t:0,alt:CRUISE},{t:.35,alt:1.8,lean:.6,...WG.AIM,fwd:.9},{t:.4,e:'o'},{t:.48,...WG.RL2},{t:.55,...WG.AIM},{t:.6,e:'o',fwd:1.2},{t:.68,...WG.RL2},{t:.75,...WG.AIM},{t:.8,e:'o',fwd:1.5},...SHOT(.8),RA(1.7)],[{t:.38,e:'fire',dmg:.6},{t:.58,e:'fire',dmg:.6},{t:.78,e:'fire',dmg:.6},{t:1.2,e:'reload'}],WCH());
for(const t of ['wizard','cleric','ninja','wing']) for(const c of CHG[t]){ RAW[t]['chg_'+c.id]={keys:c.keys,ev:c.ev,aim:c.aim,atk:1,alt:c.alt};
  if(t==='wing'){ RAW[t]['chg_'+c.id].keys=c.keys.map((k,i)=>i===0||k.rest?Object.assign({alt:CRUISE},k):k); } }
