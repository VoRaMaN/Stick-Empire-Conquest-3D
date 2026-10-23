/* ================= Hades rides Cerberus (v0.25) =================
   The lord of the underworld no longer walks the field as a towering giant: a smaller, crowned Hades rides a
   three-headed Cerberus into battle, bident in hand. The mount is the Cerberus rig (27d); the rider is drawn and
   posed by the cavalry code (27e) with stances of his own (27g): the bident thrusts, sweeps, is raised and slams down.
   Moves: the Cerberus' attacks, four combos where hound and rider strike in turn, five abilities (Infernal Strike,
   Cerberus Rage, Soul Drain, Shadow Step, Apocalypse), five mounted finishers. Four colour variants: Infernal
   (default), Frost, Toxic and Shadow. */
TYPES.hades={name:'Hades',engage:2.6,reach:1.9,s:1.32,hp:1300,dmg:60,range:2,speed:5.2,cd:.85,cost:700,thick:1,turn:6,acc:6,armor:.28,
  crawler:true,hound:true,heads:3,gearX:true,armReach:.95,chaos:true,cav:true,hadesRider:true,tailLow:-.3,tailL:.85,foreW:.55,hindW:.9,
  body:[new THREE.Color('#241a16'),new THREE.Color('#241a16')]};
RAW.hades=Object.assign({},RAW.cerberus); POSES.hades=POSES.cerberus; IDLES.hades=IDLES.cerberus.slice(); CHG.hades=CHG.cerberus.slice();
DEF_ODDS.hades=Object.assign({},DEF_ODDS.cerberus,{block:.25}); ATK_AIM_X.hades=ATK_AIM_X.cerberus||{};
const HXK=(c,extra,drop)=>{ const keys=JSON.parse(JSON.stringify(c.keys)), ev=(c.ev||[]).filter(e=>!(drop&&drop[e.e])).map(e=>Object.assign({},e)).concat(extra||[]); ev.sort((a,b)=>a.t-b.t); return {keys,ev}; };
const CBR=RAW.cerberus;
Object.assign(RAW.hades,{
  // ---- combos: hound and rider strike in turn ----
  hxBidentFang:{keys:[{t:0},{t:.2,lean:-.15,crouch:.12},{t:.32,e:'o',lean:.25,fwd:.3},{t:.5,draw:.8,hbJ:.6,hcJ:.6},{t:.62,e:'o',draw:0,hbJ:0,hcJ:0,lean:.4,fwd:.55},
    {t:.8,R:[.45,.55,.05],lean:-.35,twist:-.3},{t:.95,e:'o',R:[-.15,-.35,.85],lean:.25,twist:.4,fwd:.75},{t:1.1,lean:.15},R_(1.45)],
    ev:[{t:.2,e:'hdRide',k:'thrust'},{t:.32,e:'hit',dmg:.8,kb:2},{t:.62,e:'hit',dmg:.7,bite:1},{t:.78,e:'hdRide',k:'sweep',d:.32},{t:.95,e:'hit',arc:1.3,dmg:1.1,kb:3.5}]},
  hxOnslaught:{keys:[{t:0},{t:.25,crouch:.35,lean:-.2,fwd:-.15},{t:.42,e:'o',crouch:.05,lean:.55,fwd:1.1},{t:.6,lean:.2},{t:.75,lean:-.3,crouch:.1},{t:.98,e:'o',lean:.45,crouch:.3,fwd:1.4},{t:1.15,lean:.2},R_(1.55)],
    ev:[{t:.07,e:'cbSnort'},{t:.42,e:'hit',arc:1,dmg:1,kb:4},{t:.55,e:'hdRide',k:'slam',d:.55},{t:.98,e:'hit',aoe:1,stomp:1,dmg:1.3,kb:4},{t:.99,e:'hellfire',r:2.4,at:.9}]},
  hxThreeHeads:HXK(CBR.cbTripleBite,[{t:.68,e:'hdRide',k:'thrust'},{t:.82,e:'hit',dmg:1,kb:2.5}]),
  hxInfernalWhirl:HXK(CBR.cbCyclone,[{t:.12,e:'hdRide',k:'sweep',d:.5},{t:.42,e:'hellfire',r:2.8,at:0}]),
  // ---- abilities ----
  hxInfernalStrike:HXK(CBR.cbCrushLeap,[{t:.35,e:'hdRide',k:'slam',d:.4},{t:.68,e:'hxStrike'}],{hit:1}),
  hxRage:HXK(CBR.cbInfernalHowl,[{t:.62,e:'hxRage'}],{hit:1}),
  hxDrain:{keys:[{t:0},{t:.4,lean:-.3,crouch:.15,draw:.5,hbJ:.5,hcJ:.5},{t:2.6,lean:-.3,draw:.6},{t:3},R_(3.4)],
    ev:[{t:.3,e:'hdRide',k:'raise',d:2.6},{t:.5,e:'hxDrain'},{t:1,e:'hxDrain'},{t:1.5,e:'hxDrain'},{t:2,e:'hxDrain'},{t:2.5,e:'hxDrain'}]},
  hxShadowStep:{keys:[{t:0},{t:.15,crouch:.4,lean:.2},{t:.25,e:'o',crouch:0,jump:.3},{t:.45,jump:0,crouch:.3},R_(.8)],ev:[{t:.2,e:'hxBlink'}]},
  hxApocalypse:{keys:[{t:0},{t:.5,lean:-.8,crouch:.05,draw:1,hbJ:1,hcJ:1,hbP:-.5,hcP:-.5,alt:.4},{t:1.8,lean:-.9},{t:2.2,lean:.2,crouch:.3},R_(2.8)],
    ev:[{t:.35,e:'hdRide',k:'raise',d:1.7},{t:.6,e:'cbHowl'},{t:1.2,e:'hxApo'}]},
  // ---- idles of his own ----
  idle_hxSurvey:{idle:1,keys:[{t:0},{t:.6,look:-.6,hbY:.3,hcY:-.2},{t:1.6,look:.6,hbY:-.2,hcY:.3},{t:2.4,look:0,hbY:0,hcY:0},R_(2.9)],ev:[{t:.5,e:'hdRide',k:'raise',d:1.6}]},
  idle_hxSalute:{idle:1,keys:[{t:0},{t:.5,lean:-.35,draw:.4,hbJ:.5,hcJ:.5},{t:1.4,lean:-.3},R_(2)],ev:[{t:.3,e:'hdRide',k:'raise',d:1.3},{t:.6,e:'cbHowl',mini:1}]},
});
IDLES.hades.push('idle_hxSurvey','idle_hxSalute');
TYPES.hades.attacks=TYPES.cerberus.attacks.slice().concat(['hxBidentFang','hxOnslaught','hxThreeHeads','hxInfernalWhirl']);
Object.assign(MOVE_NAMES,{hxBidentFang:'Bident and Fang',hxOnslaught:'Underworld Onslaught',hxThreeHeads:'Three Heads, One Lord',hxInfernalWhirl:'Infernal Whirl',
  hxInfernalStrike:'Infernal Strike',hxRage:'Cerberus Rage',hxDrain:'Soul Drain',hxShadowStep:'Shadow Step',hxApocalypse:'Apocalypse'});
Object.assign(IDLE_NAMES,{hxSurvey:'Survey the Field',hxSalute:'Raise the Bident'});
// mounted finishers: the hound pins, the lord ends it
FINS.hades=[];
{ const F={
    hxImpale:{name:'Bident Impalement',src:'cbPinRend',add:[{t:1.38,e:'hdRide',k:'slam',d:.3}]},
    hxTrample:{name:'Underworld Trample',src:'cbHellstomp',add:[{t:.8,e:'hdRide',k:'thrust'}]},
    hxJudgment:{name:'Judgment of Three',src:'cbThreeJaws',add:[{t:.95,e:'hdRide',k:'slam',d:.3}]},
    hxHellfall:{name:'Hellfall',src:'cbInferno',add:[{t:.25,e:'hdRide',k:'raise',d:.5}]},
    hxSoulRip:{name:'Soul Rip',src:'cbHoundToss',add:[{t:.6,e:'hdRide',k:'raise',d:.6},{t:.9,e:'hxSoul'}]},
  };
  for(const n in F){ const d=F[n], c=HXK(CBR[d.src],d.add); RAW.hades[n]=c; const def=FIN[d.src]||{}; FIN[n]={name:d.name,clip:n,contact:def.contact||1.9,victim:def.victim};
    if(FIN_HIT_X[d.src]) FIN_HIT_X[n]=FIN_HIT_X[d.src]; FINS.hades.push(n); }
  FINS.hades.push('cbCremation','cbSerpentKiss'); }
