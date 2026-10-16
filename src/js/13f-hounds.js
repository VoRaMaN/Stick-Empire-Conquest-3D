/* ================= Hellhound and Cerberus: the Hellcrawler's four-legged rig with a canine build =================
   The Hellhound shares the Hellcrawler's clips and finishers. Cerberus has its own: a heavy, three-headed beast
   animated the way the best monster games do it, with big anticipation, weight and follow-through. The heads
   act on their own (they bite in turn, snap at each other, howl in a round), it rears and stomps, sweeps fire
   across the field, lashes with its serpent tail.
   Cerberus channels on top of the Hellcrawler's: hbY / hcY turn the left / right head outward (+) or in toward
   the front (−), hbP / hcP pitch it down (+) or up (−), hbJ / hcJ open its jaw (0…1). */
Object.assign(TYPES,{
  hound:{name:'Hellhound',engage:1.9,reach:1.15,s:.82,hp:95,dmg:13,range:1.2,speed:6.4,cd:.5,cost:100,thick:1,turn:9,acc:8,
    crawler:true,hound:true,gearX:true,swarm:true,armReach:.95,chaos:true,tailLow:-.85,tailL:.62,foreW:.5,hindW:.85,body:[new THREE.Color('#2a1d19'),new THREE.Color('#2a1d19')]},
  cerberus:{name:'Cerberus',engage:2.7,reach:1.9,s:1.6,hp:480,dmg:38,range:1.95,speed:4.8,cd:.85,cost:220,thick:1,turn:6,acc:6,armor:.12,
    crawler:true,hound:true,heads:3,gearX:true,armReach:.95,chaos:true,tailLow:-.3,tailL:.85,foreW:.55,hindW:.9,body:[new THREE.Color('#241a16'),new THREE.Color('#241a16')]},
});
RAW.hound=Object.assign({},RAW.crawler); POSES.hound=POSES.crawler; IDLES.hound=IDLES.crawler.slice(); CHG.hound=CHG.crawler;
TYPES.hound.attacks=TYPES.crawler.attacks.slice(); if(ATK_AIM_X.crawler) ATK_AIM_X.hound=ATK_AIM_X.crawler; if(DEF_ODDS.crawler) DEF_ODDS.hound=DEF_ODDS.crawler;
FINS.hound=FINS.crawler.slice();

// ---------------- Cerberus ----------------
RAW.cerberus={};
POSES.cerberus={idle:fillPose({lean:0,crouch:.04,draw:.12},null),move:null,swingL:0,swingR:0};
POSES.cerberus.move=fillPose({lean:.12,crouch:.06,draw:.25},POSES.cerberus.idle);
const CBA={
  cbTripleBite:{keys:[{t:0},{t:.16,crouch:.18,lean:-.12,draw:.3,hbJ:.7,hcJ:.4,hbY:.15,hcY:.1},{t:.3,e:'o',hbY:-.42,hbP:.35,hbJ:0,fwd:.25,lean:.1},
    {t:.44,e:'o',hcY:-.42,hcP:.35,hcJ:0,hbY:0,hbP:0,fwd:.45,lean:.15},{t:.52,draw:.9,lean:-.1,hcY:0,hcP:0},{t:.62,e:'o',draw:0,lean:.45,crouch:.05,fwd:.75},{t:.8,lean:.2},R_(1.1)],
    ev:[{t:.3,e:'hit',dmg:.45,bite:1},{t:.44,e:'hit',dmg:.45,bite:1},{t:.62,e:'hit',dmg:.75,bite:1,kb:2.4}]},
  cbSkullRam:{keys:[{t:0},{t:.25,crouch:.35,lean:-.2,hbP:-.15,hcP:-.15,fwd:-.15},{t:.42,e:'o',crouch:.05,lean:.55,fwd:1.1,hbP:.3,hcP:.3},{t:.55,lean:.3},R_(.95)],
    ev:[{t:.07,e:'cbSnort'},{t:.42,e:'hit',arc:1,dmg:1.1,kb:4.5}]},
  cbPawMaul:{keys:[{t:0},{t:.22,R:[.45,.55,.05],lean:-.4,twist:-.35,crouch:.05,hcY:.2,hbJ:.5},{t:.38,e:'o',R:[-.15,-.35,.85],lean:.25,twist:.4,fwd:.35,hbJ:0},{t:.55,R:[-.1,-.55,.5],lean:.2},R_(.95)],
    ev:[{t:.38,e:'hit',arc:1.2,dmg:1,kb:3}]},
  cbRearStomp:{keys:[{t:0},{t:.4,lean:-1.0,crouch:.05,R:[.32,.5,.25],L:[-.32,.5,.25],draw:.8,hbJ:.8,hcJ:.8,hbP:-.3,hcP:-.3,alt:.3},
    {t:.62,e:'o',lean:.45,crouch:.35,R:[.3,-.55,.6],L:[-.3,-.55,.6],draw:0,hbJ:0,hcJ:0,hbP:.2,hcP:.2,fwd:.35},{t:.85,lean:.2,crouch:.2},R_(1.3)],
    ev:[{t:.42,e:'cbHowl',mini:1},{t:.62,e:'hit',aoe:1,stomp:1,dmg:1.1,kb:4},{t:.62,e:'hellfire',r:2.6,at:.8}]},
  cbFireSweep:{keys:[{t:0},{t:.35,lean:-.35,crouch:.1,twist:-.55,draw:.6,hbJ:.6,hcJ:.6,look:-.2},{t:.5,draw:1,hbJ:1,hcJ:1,lean:.05},{t:1.25,twist:.55,look:.2},
    {t:1.4,draw:.3,hbJ:.2,hcJ:.2},R_(1.75)],
    ev:[{t:.25,e:'cbSnort'},{t:.5,e:'cbFire'},{t:.68,e:'cbFire'},{t:.86,e:'cbFire'},{t:1.04,e:'cbFire'},{t:1.22,e:'cbFire'}]},
  cbSerpentLash:{keys:[{t:0},{t:.2,alt:.95,lean:.25,crouch:.12,twist:.3},{t:.42,e:'o',alt:1.35,lean:.45,fwd:.2,twist:-.2},{t:.6,alt:1.1},{t:.8,alt:.3},R_(1.1)],
    ev:[{t:.42,e:'hit',dmg:1.1,kb:2.6,tail:1},{t:.43,e:'cbVenom'}]},
  cbCyclone:{keys:[{t:0,crouch:.12},{t:.15,yaw:-.5,twist:.4,alt:-1,hbY:.3,hcY:.3},{t:.6,e:'l',yaw:6.28,crouch:.15,fwd:.3,twist:-.3},{t:.75,hbY:0,hcY:0},R_(1.1,{yaw:6.28})],
    ev:[{t:.4,e:'hit',arc:1.5,around:1,dmg:.9,kb:3.4}]},
  cbCrushLeap:{keys:[{t:0,crouch:.2},{t:.25,crouch:.5,lean:.2,draw:.3},{t:.48,e:'o',jump:.9,fwd:1.4,crouch:0,lean:-.4,R:[.32,.3,.5],L:[-.32,.3,.5],hbP:-.2,hcP:-.2},
    {t:.68,e:'i',jump:0,fwd:2.4,lean:.35,crouch:.3,R:[.28,-.5,.75],L:[-.28,-.5,.75],hbP:.25,hcP:.25},{t:.85,crouch:.25},R_(1.3)],
    ev:[{t:.68,e:'hit',aoe:.9,stomp:1,dmg:1.3,kb:3.5},{t:.68,e:'land'}]},
  cbRendShake:{keys:[{t:0},{t:.15,lean:-.2,crouch:.2,draw:.35},{t:.3,e:'o',lean:.35,draw:1,fwd:.45},{t:.36,draw:.1},{t:.5,look:.6,side:.25,hbY:.4,hcY:-.2},{t:.62,look:-.6,side:-.25,hbY:-.2,hcY:.4},
    {t:.74,look:.6,side:.25},{t:.9,e:'o',look:-.9,twist:-.5,side:-.3,draw:.9},{t:1.1,look:0,twist:0,side:0,hbY:0,hcY:0},R_(1.45)],
    ev:[{t:.34,e:'hit',dmg:.6,bite:1},{t:.9,e:'hit',dmg:.7,kb:3.8}]},
  cbInfernalHowl:{keys:[{t:0},{t:.35,lean:-.55,crouch:.15,draw:.4,hbP:-.2,hcP:-.2},{t:.6,lean:-.9,wL:[0,1,.35],draw:1,hbP:-.6,hcP:-.6,hbJ:1,hcJ:1,hbY:.25,hcY:.25,alt:.4},
    {t:1.4,draw:.9,hbJ:.9,hcJ:.9},{t:1.6,lean:-.3},R_(2.0)],
    ev:[{t:.62,e:'cbHowl'},{t:.66,e:'hit',aoe:1.3,stomp:1,dmg:.4,kb:5}]},
};
Object.assign(RAW.cerberus,CBA);
TYPES.cerberus.attacks=['cbTripleBite','cbSkullRam','cbPawMaul','cbRearStomp','cbFireSweep','cbSerpentLash','cbCyclone','cbCrushLeap','cbRendShake','cbInfernalHowl'];
Object.assign(MOVE_NAMES,{cbTripleBite:'Triple Bite',cbSkullRam:'Skull Ram',cbPawMaul:'Paw Maul',cbRearStomp:'Rearing Stomp',cbFireSweep:'Hellfire Sweep',cbSerpentLash:'Serpent Lash',
  cbCyclone:'Cyclone',cbCrushLeap:'Crushing Leap',cbRendShake:'Rending Shake',cbInfernalHowl:'Infernal Howl'});
const CBI={
  cbSniff:{keys:[{t:0},{t:.5,lean:.4,crouch:.1,hbP:.6,hbY:.2,draw:.1},{t:1.0,hbP:0,hbY:0,hcP:.6,hcY:.2},{t:1.5,hcP:0,hcY:0,look:-.4,lean:.5},{t:2.0,look:.3},{t:2.4},R_(2.8)]},
  cbBicker:{keys:[{t:0},{t:.3,hbY:-.55,hbJ:.7,hcY:-.2},{t:.45,hbJ:.1,hcY:-.55,hcJ:.8,look:-.3},{t:.6,hcJ:0,hbJ:.8,hbY:-.6},{t:.75,hbJ:0,draw:.6,look:.2},{t:.9,draw:0,hbY:.1,hcY:.1},{t:1.3,look:0},R_(1.7)],
    ev:[{t:.45,e:'hiss'},{t:.75,e:'hiss'}]},
  cbHowlRound:{keys:[{t:0},{t:.4,hbP:-.6,hbJ:1,hbY:.3},{t:1.0,hbP:0,hbJ:0,hbY:0,hcP:-.6,hcJ:1,hcY:.3},{t:1.6,hcP:0,hcJ:0,hcY:0,lean:-.8,draw:1,wL:[0,1,.35]},{t:2.3,lean:0,draw:0},R_(2.7)],
    ev:[{t:.45,e:'screech'},{t:1.05,e:'screech'},{t:1.65,e:'dreadRoar'}]},
  cbShakeOff:{keys:[{t:0},{t:.15,side:.4,hbY:.3,hcY:-.1},{t:.3,side:-.4,hbY:-.1,hcY:.3},{t:.45,side:.35},{t:.6,side:-.3},{t:.75,side:0,hbY:0,hcY:0},R_(1.0)],ev:[{t:.2,e:'cbMane'},{t:.5,e:'cbMane'}]},
  cbPant:{keys:[{t:0},{t:.5,crouch:.3,lean:-.1,alt:-.3,hbJ:.4,hcJ:.4,draw:.4},{t:.7,hbJ:.15,hcJ:.15,draw:.15},{t:.9,hbJ:.4,hcJ:.4,draw:.4},{t:1.1,hbJ:.15,hcJ:.15,draw:.15},{t:1.3,hbJ:.4,hcJ:.4,draw:.4},{t:1.6},R_(2.0)]},
  cbPawGround:{keys:[{t:0},{t:.3,R:[.22,-.4,.55],lean:.25,hbP:.2,hcP:.2},{t:.5,R:[.22,-.62,.25]},{t:.7,R:[.22,-.4,.55]},{t:.9,R:[.22,-.62,.25]},{t:1.1,lean:.1},R_(1.5)],ev:[{t:.5,e:'cbSnort'},{t:.9,e:'cbSnort'}]},
};
IDLES.cerberus=[]; for(const n in CBI){ const c=CBI[n]; c.idle=1; RAW.cerberus['idle_'+n]=c; IDLES.cerberus.push('idle_'+n); }
Object.assign(IDLE_NAMES,{cbSniff:'Sniff the Air',cbBicker:'Heads Bicker',cbHowlRound:'Howl in Turn',cbShakeOff:'Shake Off',cbPant:'Pant',cbPawGround:'Paw the Ground'});
Object.assign(RAW.cerberus,{
  block:{keys:[{t:0},{t:.16,crouch:.35,lean:.2,hbP:.2,hcP:.2,hbY:.15,hcY:.15,draw:.3,hbJ:.3,hcJ:.3},{t:.5},R_(.8)]},
  parry:{keys:[{t:0,R:[.4,.15,.2]},{t:.1,e:'o',R:[-.1,.05,.65],twist:.3},{t:.22},R_(.45)]},
  dodge:{keys:[{t:0,crouch:.2},{t:.2,e:'o',fwd:-.8,jump:.2,side:.35,twist:.35,crouch:.05},{t:.36,jump:0,fwd:-.95,crouch:.3,side:0,twist:0},R_(.7)]},
  recoil:{keys:[{t:0},{t:.15,e:'o',lean:-.45,fwd:-.3,crouch:.05,draw:.6,hbJ:.6,hcJ:.6,hbP:-.3,hcP:-.3},{t:.45,lean:-.2,fwd:-.4},R_(.85)]},
  flinch:{keys:[{t:0},{t:.08,e:'o',lean:-.25,crouch:.12,fwd:-.12,draw:.4,hbY:.2,hcY:.2},{t:.22,lean:-.1},R_(.45)]},
});
DEF_ODDS.cerberus={block:.15,parry:.08,dodge:.1};
const CBF={
  cbTugOfWar:{name:'Tug of War',contact:1.9,keys:[{t:0},{t:.18,lean:-.2,crouch:.2,draw:.35},{t:.34,e:'o',lean:.3,draw:1,fwd:.45},{t:.4,draw:.15},{t:.6,hbY:-.5,hbP:.3,hbJ:1,hcY:-.5,hcP:.3,hcJ:1},
    {t:.72,hbJ:0,hcJ:0},{t:1.0,hbY:.6,hcY:.6,lean:-.4,side:.1,look:.3},{t:1.25,e:'o',hbY:.8,hcY:.8,lean:-.55,twist:.4,look:-.5},{t:1.5,hbY:0,hcY:0,twist:0,look:0},R_(1.9)],
    ev:[{t:.38,e:'grab',at:'jaw'},{t:.72,e:'gore'},{t:1.25,e:'release',imp:[0,6,-2],shake:.3},{t:1.26,e:'gore'}]},
  cbThreeJaws:{name:'Three Jaws',contact:1.85,victim:'kneel',keys:[{t:0},{t:.25,hbY:-.45,hbP:.3,hbJ:1},{t:.4,e:'o',hbJ:0},{t:.6,hbY:0,hbP:0,hcY:-.45,hcP:.3,hcJ:1},{t:.75,e:'o',hcJ:0},
    {t:.95,hcY:0,hcP:0,lean:-.3,draw:1,crouch:.1},{t:1.15,e:'o',lean:.45,draw:0,fwd:.35},{t:1.4,lean:.15},R_(1.8)],
    ev:[{t:.4,e:'jolt',mag:.8},{t:.75,e:'jolt',mag:.8},{t:1.15,e:'kill',decap:true,imp:[0,.5,1],headImp:[0,4,-2.5],shake:.3}]},
  cbCremation:{name:'Cremation',contact:2.2,victim:'kneel',keys:[{t:0},{t:.35,lean:-.35,crouch:.1,draw:.5,hbJ:.5,hcJ:.5},{t:.5,draw:1,hbJ:1,hcJ:1,lean:.1,hbY:-.3,hcY:-.3},{t:1.5,lean:.15},
    {t:1.7,draw:.2,hbJ:.2,hcJ:.2,hbY:0,hcY:0},R_(2.1)],
    ev:[{t:.25,e:'cbSnort'},{t:.5,e:'cbFire',fin:1},{t:.7,e:'cbFire',fin:1},{t:.9,e:'cbFire',fin:1},{t:1.1,e:'cbFire',fin:1},{t:1.3,e:'cbFire',fin:1},{t:1.45,e:'kill',imp:[0,3,4],spin:3,fx:'boom',shake:.3}]},
  cbHellstomp:{name:'Hellstomp',contact:1.8,keys:[{t:0},{t:.2,R:[.45,.5,.05],lean:-.35,twist:-.3},{t:.36,e:'o',R:[-.1,-.35,.85],lean:.25,twist:.35,fwd:.25},
    {t:.7,lean:-1.0,R:[.3,.55,.3],L:[-.3,.55,.3],draw:.8,hbJ:.8,hcJ:.8,twist:0},{t:.95,e:'o',lean:.5,crouch:.35,R:[.25,-.55,.8],L:[-.25,-.55,.8],draw:0,hbJ:0,hcJ:0,fwd:.45},{t:1.2,lean:.2},R_(1.6)],
    ev:[{t:.36,e:'knock',imp:[-1,1.5,2.5]},{t:.95,e:'stabRag',imp:[0,-7,.5],part:'chest',ring:1,shake:.45},{t:.95,e:'hellfire',r:2.4,at:1}]},
  cbHoundToss:{name:"Hound's Toss",contact:1.9,keys:[{t:0},{t:.18,lean:-.2,crouch:.25,draw:.35},{t:.34,e:'o',lean:.35,draw:1,fwd:.45},{t:.4,draw:.15},{t:.75,lean:-.75,crouch:.05,look:.2},
    {t:.9,e:'o',lean:-.95,draw:.9,look:0},{t:1.2,hbP:-.5,hcP:-.5,hbJ:1,hcJ:1,lean:-.6},{t:1.32,e:'o',hbJ:0,hcJ:0,hbP:-.3,hcP:-.3},{t:1.6,hbP:0,hcP:0,lean:0},R_(2.0)],
    ev:[{t:.38,e:'grab',at:'jaw'},{t:.9,e:'release',imp:[0,12,1.5],shake:.2},{t:1.32,e:'gore'}]},
  cbSerpentKiss:{name:"Serpent's Kiss",contact:1.9,keys:[{t:0},{t:.3,alt:.6,lean:.3,crouch:.15},{t:.48,e:'o',alt:1,lean:.4,fwd:.2},{t:.9,alt:1.2,lean:.1},{t:1.25,alt:1.3,lean:-.1},
    {t:1.45,e:'o',alt:.2,lean:.5,crouch:.2,twist:.5},{t:1.7,alt:0,twist:0},R_(2.1)],
    ev:[{t:.48,e:'grab',at:'tail'},{t:.8,e:'cbVenomRag'},{t:1.45,e:'release',imp:[-3,-10,-2],slam:1,shake:.3}]},
  cbPinRend:{name:'Pin and Rend',contact:1.9,keys:[{t:0,crouch:.25},{t:.25,crouch:.45,lean:.15,draw:.3},{t:.45,e:'o',jump:.6,fwd:1.0,crouch:0,lean:-.3,R:[.32,.2,.6],L:[-.32,.2,.6],draw:1},
    {t:.62,e:'i',jump:.05,fwd:1.6,lean:.35,R:[.25,-.5,.85],L:[-.25,-.5,.85]},{t:.72,jump:0,crouch:.4,fwd:1.7},{t:.9,hbY:-.3,hbP:.6,hbJ:1},{t:1.0,e:'o',hbJ:0},
    {t:1.15,hbY:0,hbP:0,hcY:-.3,hcP:.6,hcJ:1},{t:1.25,e:'o',hcJ:0},{t:1.4,hcY:0,hcP:0,lean:.6,draw:1},{t:1.52,e:'o',lean:.8,draw:0},{t:1.8,lean:.2},R_(2.2)],
    ev:[{t:.62,e:'knock',imp:[0,1,3.5]},{t:.72,e:'land'},{t:1.0,e:'stabRag',imp:[0,-1,1],part:'chest'},{t:1.25,e:'stabRag',imp:[0,-1,1],part:'gut'},{t:1.52,e:'stabRag',imp:[0,1.5,.5],part:'neck',shake:.2}]},
  cbInferno:{name:'Inferno',contact:2.0,keys:[{t:0},{t:.4,lean:-.5,crouch:.2,draw:.4,hbJ:.4,hcJ:.4,hbP:-.15,hcP:-.15,hbY:-.2,hcY:-.2},
    {t:.65,e:'o',lean:.3,draw:1,hbJ:1,hcJ:1,hbP:.15,hcP:.15,hbY:-.4,hcY:-.4,fwd:.2},{t:.9,lean:.1},{t:1.1,draw:.2,hbJ:.2,hcJ:.2,hbY:0,hcY:0},R_(1.5)],
    ev:[{t:.3,e:'cbSnort'},{t:.65,e:'cbFire',fin:1,big:1},{t:.66,e:'kill',imp:[0,6,9],spin:5,fx:'boom',shake:.45}]},
};
FINS.cerberus=[];
for(const n in CBF){ const d=CBF[n]; RAW.cerberus[n]={keys:d.keys,ev:d.ev}; FIN[n]={name:d.name,clip:n,contact:d.contact,victim:d.victim}; FINS.cerberus.push(n); }
Object.assign(FIN_HIT_X,{cbThreeJaws:{.4:'chest',.75:'chest',1.15:'neck'},cbCremation:{1.45:'chest'},cbInferno:{.66:'chest'}});
CHG.cerberus=[];
chg('cerberus','ramRun','Battering Charge',{lean:.25,crouch:.08,hbP:.15,hcP:.15},[{t:.1,crouch:.25,lean:-.1},{t:.26,e:'o',crouch:0,lean:.55,fwd:.9},{t:.42},R_(.85)],[{t:.26,e:'hit',arc:1,dmg:1.3,kb:5}]);
chg('cerberus','leapRun','Crushing Leap',{crouch:.12,lean:.15},[{t:.08,crouch:.35},{t:.26,e:'o',jump:.75,fwd:.9,crouch:0,lean:-.35,R:[.3,.25,.5],L:[-.3,.25,.5]},
  {t:.44,e:'i',jump:0,fwd:1.6,lean:.35,crouch:.3,R:[.28,-.5,.75],L:[-.28,-.5,.75]},{t:.55},R_(1.0)],[{t:.44,e:'hit',aoe:.9,stomp:1,dmg:1.3,kb:3.6},{t:.44,e:'land'}]);
chg('cerberus','fireRun','Burning Charge',{draw:.6,hbJ:.6,hcJ:.6,lean:.15},[{t:.1,draw:1,hbJ:1,hcJ:1},{t:.3,e:'o',lean:.4,fwd:.6,draw:.2,hbJ:.2,hcJ:.2},{t:.48},R_(.9)],[{t:.1,e:'cbFire'},{t:.3,e:'hit',dmg:1,kb:3}]);
chg('cerberus','biteRun','Snapping Charge',{lean:.2},[{t:.06,hbY:-.4,hbP:.3,hbJ:1},{t:.16,e:'o',hbJ:0},{t:.22,hcY:-.4,hcP:.3,hcJ:1},{t:.32,e:'o',hcJ:0},{t:.4,draw:1,lean:-.1},
  {t:.48,e:'o',draw:0,lean:.45,fwd:.6},{t:.6,hbY:0,hcY:0,hbP:0,hcP:0},R_(.95)],[{t:.16,e:'hit',dmg:.45,bite:1},{t:.32,e:'hit',dmg:.45,bite:1},{t:.48,e:'hit',dmg:.8,kb:3,bite:1}]);
chg('cerberus','swipeRun','Mauling Charge',{lean:.2},[{t:.1,R:[.45,.5,.05],lean:-.3,twist:-.3},{t:.26,e:'o',R:[-.1,-.35,.85],lean:.3,twist:.35,fwd:.6},{t:.42},R_(.85)],[{t:.26,e:'hit',arc:1.2,dmg:1.1,kb:3.2}]);
chg('cerberus','tailRun','Serpent Spin',{lean:.15},[{t:.06,yaw:-.4,alt:-1},{t:.42,e:'l',yaw:6.28,fwd:.5},{t:.56},R_(.95,{yaw:6.28})],[{t:.3,e:'hit',arc:1.4,around:1,dmg:.9,kb:3.4}]);
for(const c of CHG.cerberus) RAW.cerberus['chg_'+c.id]={keys:c.keys,ev:c.ev,aim:c.aim,atk:1};
