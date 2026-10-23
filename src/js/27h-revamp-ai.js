/* ---------- Bone Reaver and Ninja (v0.26): their minds pick from the new moves too (13j) ---------- */
TYPES.boner.pick=(u,t)=>{
  const now=game.time;
  if(t&&t.isUnit&&enemiesNear(u.team,u.pos.x,u.pos.z,2.2)>=3&&(u.cdSpin||0)<now){ u.cdSpin=now+4; return pickOf(['brSpin','brDeathSpiral','brSoulRend']); }
  if(t&&t.isUnit&&t.T.ranged&&(u.cdVault||0)<now&&Math.random()<.4){ u.cdVault=now+6; return 'brVault'; }
  let n,g=0; do{ n=pickOf(['brXSlash','brTwinThrust','brFlurry','brLeap','brRising','brBackhand','brKick','brShearCut','brGutLift','brLowReap','brChatter','brChatter']); }while(n===u.lastAtk&&++g<5); return n;
};
TYPES.ninja.pick=(u,t)=>{
  const d=t?Math.hypot(t.pos.x-u.pos.x,t.pos.z-u.pos.z):9, now=game.time;
  if(t&&t.isUnit&&d>2.2&&d<8&&(u.cdStar||0)<now&&Math.random()<.35){ u.cdStar=now+5; return 'njStar'; }
  if(t&&t.isUnit&&enemiesNear(u.team,u.pos.x,u.pos.z,2.2)>=3&&(u.cdCres||0)<now){ u.cdCres=now+4; return 'njCrescent'; }
  const L=ATTACKS_X.ninja.filter(x=>x!=='shinobi').concat(['njIaido','njShadowFlurry','njHeelDrop','njSmokeStrike','njIaido']);
  let n,g=0; do{ n=pickOf(L); }while(n===u.lastAtk&&++g<5); return n;
};
