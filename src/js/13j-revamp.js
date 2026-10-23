/* ================= Bone Reaver and Ninja revamp (v0.26): new moves =================
   Bone Reaver: 7 new attacks (15 in all), 4 new idles (9), a new finisher (4).
   Ninja: 6 new attacks (17 in all), 4 new idles (14), 2 new finishers.
   Their new looks (horns, soul-fire ribs, spine; a steel brow band, short blade, shuriken pouch, sash) are in 26e. */
Object.assign(RAW.boner,{
  brShearCut:{keys:[{t:0},{t:.16,...BR.OUT,crouch:.1,lean:-.05},{t:.3,e:'o',...BR.X,lean:.35,fwd:.3},{t:.44},R_(.75)],ev:[{t:.3,e:'hit',dmg:1.25,kb:2}]},
  brDeathSpiral:{keys:[{t:0,...BR.OUT,crouch:.15},{t:.1,yaw:-.5},{t:.45,e:'l',yaw:6.28,...BR.OUT,fwd:.35},{t:.8,e:'l',yaw:12.56,...BR.OUT,fwd:.7},{t:.92},R_(1.25,{yaw:12.56})],
    ev:[{t:.35,e:'hit',arc:1.2,around:1,dmg:.6,kb:1.2},{t:.7,e:'hit',arc:1.2,around:1,dmg:.6,kb:2.4},{t:.72,e:'brSoul'}]},
  brGutLift:{keys:[{t:0},{t:.16,...BR.THW,crouch:.15},{t:.28,e:'o',...BR.TH,lean:.35,fwd:.35},{t:.5,...BR.RISE,lean:-.2,crouch:0},{t:.62},R_(.95)],
    ev:[{t:.28,e:'hit',dmg:.8},{t:.5,e:'hit',dmg:.6,up:3}]},
  brLowReap:{keys:[{t:0},{t:.15,...BR.SIDEW,crouch:.45,twist:-.5},{t:.3,e:'o',...BR.SIDE,crouch:.5,twist:.5,lean:.4,fwd:.25},{t:.45,crouch:.3},R_(.8)],ev:[{t:.3,e:'hit',dmg:.9,kb:1}]},
  brVault:{keys:[{t:0,crouch:.3},{t:.15,crouch:.4},{t:.3,e:'o',jump:1,fwd:.8,...BR.UPW,...BR.LUPW,lean:-.3,crouch:0},{t:.5,e:'o',jump:.2,fwd:1.4,...BR.CHOP,...BR.LCHOP,lean:.6},{t:.6,jump:0,crouch:.4,fwd:1.5},R_(1)],
    ev:[{t:.5,e:'hit',dmg:1.4,kb:1.5},{t:.6,e:'land'}]},
  brChatter:{keys:[{t:0},{t:.08,...BR.UPW},{t:.15,e:'o',...BR.CHOP,lean:.25},{t:.22,...BR.LUPW},{t:.29,e:'o',...BR.LCHOP,lean:.25},{t:.36,...BR.UPW},{t:.43,e:'o',...BR.CHOP,lean:.3},{t:.5,...BR.LUPW},{t:.57,e:'o',...BR.LCHOP,lean:.3,fwd:.2},{t:.7},R_(.95)],
    ev:[{t:.15,e:'hit',dmg:.35},{t:.29,e:'hit',dmg:.35},{t:.43,e:'hit',dmg:.35},{t:.57,e:'hit',dmg:.45,kb:1.4},{t:.1,e:'clank'}]},
  brSoulRend:{keys:[{t:0},{t:.3,...BR.RISE,lean:-.3,crouch:.05},{t:.5,e:'o',...BR.DOWN,lean:.5,crouch:.3,fwd:.3},{t:.7},R_(1.05)],
    ev:[{t:.3,e:'brSoul'},{t:.5,e:'hit',aoe:.9,dmg:1,kb:2.2},{t:.52,e:'brSoul',big:1}]},
  brHarvest:{keys:[{t:0},{t:.25,...BR.XW,lean:-.1},{t:.45,e:'o',...BR.X,lean:.45,fwd:.4},{t:.6,...BR.RISE,lean:-.2},{t:.8},R_(1.2)],
    ev:[{t:.45,e:'kill',decap:true,imp:[0,.5,1],headImp:[0,4,-1],shake:.25},{t:.6,e:'brSoul',big:1}]},
  idle_brCrack:{idle:1,keys:[{t:0},{t:.25,look:-.7,side:-.15},{t:.32,look:-.85},{t:.7,look:.7,side:.15},{t:.77,look:.85},{t:1.1,look:0,side:0},R_(1.4)],ev:[{t:.32,e:'clank'},{t:.77,e:'clank'}]},
  idle_brStalk:{idle:1,keys:[{t:0},{t:.5,crouch:.45,lean:.4,...BR.OUT},{t:1.6,look:-.4},{t:2.2,look:.4},{t:2.6,crouch:.2},R_(3)]},
  idle_brBladeTap:{idle:1,keys:[{t:0},{t:.3,R:[.05,.1,.4],wR:[-.5,.8,.2],L:[-.05,.1,.4],wL:[.5,.8,.2]},{t:.4,R:[.12,.1,.4]},{t:.5,R:[.05,.1,.4]},{t:.6,R:[.12,.1,.4]},{t:.7,R:[.05,.1,.4]},R_(1.2)],
    ev:[{t:.4,e:'clank'},{t:.6,e:'clank'}]},
  idle_brShiver:{idle:1,keys:[{t:0},{t:.1,side:.06,crouch:.18,lean:.2},{t:.18,side:-.06},{t:.26,side:.06},{t:.34,side:-.06},{t:.42,side:.06},{t:.5,side:-.06},{t:.6,side:0},R_(1)]},
});
TYPES.boner.attacks=TYPES.boner.attacks.concat(['brShearCut','brDeathSpiral','brGutLift','brLowReap','brVault','brChatter','brSoulRend']);
IDLES.boner.push('idle_brCrack','idle_brStalk','idle_brBladeTap','idle_brShiver');
FIN.brHarvest={name:'Bone Harvest',clip:'brHarvest',contact:1.05,victim:'kneel'}; FINS.boner.push('brHarvest');
Object.assign(ATK_AIM_X.boner,{brShearCut:[['blade','chest']],brGutLift:[['tip','gut']],brLowReap:[['blade','shin']],brVault:[['blade','head']],brSoulRend:[['blade','head']]});

Object.assign(RAW.ninja,{
  njIaido:{keys:[{t:0},{t:.25,...NJ.BACK,crouch:.3,lean:.2},{t:.36,e:'o',...NJ.SIDE,crouch:.1,lean:.5,fwd:1.2,twist:.5},{t:.5,twist:.2},R_(.9)],ev:[{t:.33,e:'njDash'},{t:.36,e:'hit',dmg:1.5,kb:1.5}]},
  njShadowFlurry:{keys:[{t:0},{t:.08,...NJ.HIGH},{t:.15,e:'o',...NJ.CUT,lean:.3,fwd:.15},{t:.23,...NJ.SIDEW},{t:.3,e:'o',...NJ.SIDE,twist:.4,fwd:.3},{t:.38,...NJ.HIGH,twist:0},{t:.45,e:'o',...NJ.CUT,fwd:.45},
    {t:.53,...NJ.STABW},{t:.6,e:'o',...NJ.STAB,lean:.4,fwd:.6},{t:.68,...NJ.SIDEW},{t:.76,e:'o',...NJ.SIDE,twist:.5,fwd:.75},{t:.9},R_(1.15)],
    ev:[{t:.15,e:'hit',dmg:.3},{t:.3,e:'hit',dmg:.3},{t:.45,e:'hit',dmg:.3},{t:.6,e:'hit',dmg:.35},{t:.76,e:'hit',dmg:.45,kb:1.6}]},
  njStar:{keys:[{t:0},{t:.15,R:[.3,.2,-.1],wR:[0,1,0],L:[-.25,.25,.1]},{t:.28,e:'o',R:[-.05,.15,.5],L:[0,.2,.45],lean:.2},{t:.4},R_(.7)],ev:[{t:.28,e:'njStar',n:3}]},
  njHeelDrop:{keys:[{t:0},{t:.2,crouch:.3},{t:.38,jump:.8,kick:.8,lean:-.4,crouch:0},{t:.52,e:'o',jump:.1,kick:.2,lean:.4,fwd:.4},{t:.62,jump:0,crouch:.3},R_(.95)],ev:[{t:.52,e:'hit',dmg:1,kb:2.4},{t:.62,e:'land'}]},
  njCrescent:{keys:[{t:0},{t:.1,yaw:-.4,...NJ.SIDEW},{t:.42,e:'l',yaw:6.28,...NJ.SIDE,fwd:.4,crouch:.2},{t:.55},R_(.85,{yaw:6.28})],ev:[{t:.35,e:'hit',arc:1.3,around:1,dmg:.8,kb:2}]},
  njSmokeStrike:{keys:[{t:0},{t:.12,...NJ.SEAL,crouch:.2},{t:.25,e:'o',...NJ.STABW,crouch:.25},{t:.4,e:'o',...NJ.STAB,lean:.5,fwd:1.5},{t:.55},R_(.9)],ev:[{t:.2,e:'njSmoke'},{t:.4,e:'hit',dmg:1.3,kb:1.5}]},
  njBlossom:{keys:[{t:0},{t:.15,...NJ.HIGH},{t:.25,e:'o',...NJ.CUT,lean:.3},{t:.35,...NJ.SIDEW},{t:.45,e:'o',...NJ.SIDE,twist:.5},{t:.55,...NJ.STABW},{t:.7,e:'o',...NJ.STAB,lean:.45,fwd:.3},{t:1},R_(1.4)],
    ev:[{t:.25,e:'jolt',mag:.5},{t:.45,e:'jolt',mag:.5},{t:.7,e:'kill',imp:[0,1,3],shake:.15},{t:.72,e:'njSmoke'}]},
  njSilentEnd:{keys:[{t:0},{t:.2,...NJ.SEAL},{t:.3,e:'njSmoke'},{t:.5,...NJ.BACK,crouch:.2,fwd:.6},{t:.65,e:'o',...NJ.STAB,lean:.3,fwd:.8},{t:1.1},R_(1.5)],
    ev:[{t:.3,e:'njSmoke'},{t:.65,e:'kill',imp:[0,.5,2],shake:.1}]},
  idle_njScan:{idle:1,keys:[{t:0},{t:.4,crouch:.35,lean:.3,look:-.8},{t:1.3,look:-.8},{t:1.9,look:.8},{t:2.6,look:.8},{t:3,look:0,crouch:.12},R_(3.3)]},
  idle_njKunaiSpin:IDLE_COMMON.twirl('R','wR',[.28,-.15,.3],SPIN4,.2),
  idle_njBow:{idle:1,keys:[{t:0},{t:.5,lean:.55,crouch:.05,...NJ.SEAL},{t:1.3,lean:.55},{t:1.7,lean:.1},R_(2.1)]},
  idle_njSmokeIdle:{idle:1,keys:[{t:0},{t:.3,...NJ.SEAL,crouch:.2},{t:.6,crouch:.4},{t:1.3,crouch:.12},R_(1.6)],ev:[{t:.55,e:'njSmoke',mini:1}]},
});
RAW.ninja.idle_njKunaiSpin.idle=1;
TYPES.ninja.attacks=TYPES.ninja.attacks.concat(['njIaido','njShadowFlurry','njStar','njHeelDrop','njCrescent','njSmokeStrike']);
IDLES.ninja.push('idle_njScan','idle_njKunaiSpin','idle_njBow','idle_njSmokeIdle');
FIN.njBlossom={name:'Death Blossom',clip:'njBlossom',contact:.95,victim:'kneel'}; FIN.njSilentEnd={name:'Silent End',clip:'njSilentEnd',contact:1.0}; FINS.ninja.push('njBlossom','njSilentEnd');
Object.assign(ATK_AIM_X.ninja,{njIaido:[['blade','chest']],njSmokeStrike:[['tip','chest']],njCrescent:[['blade','chest']],njHeelDrop:[['foot','head']]});
Object.assign(MOVE_NAMES,{brShearCut:'Shear Cut',brDeathSpiral:'Death Spiral',brGutLift:'Gut and Lift',brLowReap:'Low Reap',brVault:'Bone Vault',brChatter:'Chattering Frenzy',brSoulRend:'Soul Rend',
  njIaido:'Iaido Draw',njShadowFlurry:'Shadow Flurry',njStar:'Shuriken Volley',njHeelDrop:'Heel Drop',njCrescent:'Crescent Moon',njSmokeStrike:'Smoke Strike'});
Object.assign(IDLE_NAMES,{brCrack:'Crack the Neck',brStalk:'Stalk',brBladeTap:'Blade Tap',brShiver:'Rattle the Bones',njScan:'Scan Low',njKunaiSpin:'Kunai Spin',njBow:'Bow',njSmokeIdle:'Smoke Seal'});
