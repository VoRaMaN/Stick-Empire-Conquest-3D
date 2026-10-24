/* ================= Riders move their arms (v0.33) =================
   A rider used to sit with his arms fixed in one couched pose whatever his mount was doing. Now every rider (the
   Wyvern Knight, Hades on Cerberus, the Hell Riders) has his own animation set, played on his arms with two-bone IK
   (shoulder, elbow, hand onto a target) and on his weapon's direction, blended smoothly from one to the next:
     Rest (lance or bident carried upright, breathing) · Couch (charging, lance level) · Thrust · Overhead Slam ·
     Forehand Sweep · Backhand Sweep · Raise (weapon held high) · Guard (shield arm up) · Command (the free arm points,
     the weapon goes up) · Whirl (the weapon circles overhead) · Execution (two hands, high then planted: Hades).
   What the mount does picks the rider's move: its charges couch the lance, its attacks bring a thrust, a sweep or a
   slam timed so the rider's blow lands on the mount's own hit, its roars and breaths have the rider command, spins
   whirl the weapon, guards raise the shield; Hades' bident events (hdRide) play his strikes directly. */
// keys: [t (0..1), right hand, left hand, weapon direction, lean, twist]; hands and directions in the rider's own
// axes (right, up the spine, forward) and his size, from his chest
const RA_REST_R=[.14,-.19,.12], RA_REST_L=[-.04,-.28,.29];
const RIDE_ANIMS={
  rest:{d:3.2,loop:1,k:[[0,RA_REST_R,RA_REST_L,[.1,.72,.68],0,0],[.5,[.15,-.17,.13],[-.05,-.26,.3],[.13,.78,.6],-.03,.04],[1,RA_REST_R,RA_REST_L,[.1,.72,.68],0,0]]},
  couch:{d:1,loop:1,k:[[0,[.13,-.15,.19],[-.04,-.24,.33],[.03,-.06,1],.16,0],[.5,[.13,-.14,.2],[-.04,-.23,.34],[.03,-.04,1],.18,0],[1,[.13,-.15,.19],[-.04,-.24,.33],[.03,-.06,1],.16,0]]},
  thrust:{d:.6,ap:.5,k:[[0,RA_REST_R,RA_REST_L,[.05,.1,1],0,0],[.3,[.17,-.12,-.06],[-.06,-.27,.3],[.06,.02,1],-.08,-.15],[.5,[.08,-.08,.55],[-.09,-.3,.18],[0,-.1,1],.28,.2],[.72,[.1,-.12,.4],[-.06,-.28,.24],[0,-.08,1],.15,.1],[1,RA_REST_R,RA_REST_L,[.08,.4,.9],0,0]]},
  slam:{d:.85,ap:.56,k:[[0,RA_REST_R,RA_REST_L,[.1,.6,.8],0,0],[.36,[.09,.44,-.03],[-.06,-.2,.24],[0,.55,-.84],-.18,-.1],[.56,[.17,-.04,.44],[-.08,-.28,.24],[0,-.72,.7],.32,.12],[.76,[.16,-.14,.36],[-.06,-.28,.27],[0,-.5,.86],.2,.05],[1,RA_REST_R,RA_REST_L,[.1,.6,.8],0,0]]},
  sweepR:{d:.62,ap:.6,k:[[0,RA_REST_R,RA_REST_L,[.2,.3,.9],0,0],[.3,[.42,-.02,-.08],[-.08,-.25,.26],[.92,.05,-.38],-.05,-.4],[.6,[-.16,-.06,.42],[-.1,-.3,.16],[-.85,-.05,.52],.12,.45],[.8,[-.08,-.12,.34],[-.08,-.28,.22],[-.6,-.05,.8],.06,.25],[1,RA_REST_R,RA_REST_L,[.1,.5,.85],0,0]]},
  sweepL:{d:.62,ap:.6,k:[[0,RA_REST_R,RA_REST_L,[.2,.3,.9],0,0],[.3,[-.12,.02,.3],[-.1,-.26,.2],[-.9,.05,.32],0,.38],[.6,[.46,-.06,.18],[-.06,-.27,.28],[.92,-.05,.36],.1,-.4],[.8,[.36,-.1,.16],[-.05,-.27,.29],[.75,-.05,.6],.05,-.2],[1,RA_REST_R,RA_REST_L,[.1,.5,.85],0,0]]},
  raise:{d:1.2,k:[[0,RA_REST_R,RA_REST_L,[.1,.7,.7],0,0],[.25,[.12,.47,.1],[-.05,-.26,.3],[.05,.98,.12],-.12,0],[.55,[.13,.5,.08],[-.04,-.25,.31],[.03,.99,.1],-.14,0],[.82,[.12,.46,.1],[-.05,-.26,.3],[.05,.98,.12],-.1,0],[1,RA_REST_R,RA_REST_L,[.1,.7,.7],0,0]]},
  guard:{d:.8,k:[[0,RA_REST_R,RA_REST_L,[.1,.6,.8],0,0],[.22,[.19,-.1,-.02],[.03,.12,.36],[.22,.55,.8],-.06,.1],[.75,[.19,-.1,-.01],[.03,.13,.36],[.22,.55,.8],-.06,.1],[1,RA_REST_R,RA_REST_L,[.1,.6,.8],0,0]]},
  command:{d:1.1,k:[[0,RA_REST_R,RA_REST_L,[.1,.7,.7],0,0],[.25,[.19,.16,.05],[-.1,.12,.58],[.2,.92,.32],.12,.15],[.8,[.2,.18,.04],[-.11,.13,.6],[.2,.93,.3],.14,.15],[1,RA_REST_R,RA_REST_L,[.1,.7,.7],0,0]]},
  whirl:{d:1,ap:.5,k:[[0,RA_REST_R,RA_REST_L,[.2,.5,.85],0,0],[.14,[.3,.42,.02],[-.05,-.24,.28],[1,.1,0],-.05,-.2],[.32,[.02,.45,.32],[-.05,-.24,.28],[0,.1,1],-.05,.15],[.5,[-.3,.42,.02],[-.05,-.24,.28],[-1,.1,0],-.05,.35],[.68,[.02,.45,-.26],[-.05,-.24,.28],[0,.1,-1],-.05,0],[.84,[.3,.42,.02],[-.05,-.24,.28],[1,.1,0],-.05,-.2],[1,RA_REST_R,RA_REST_L,[.1,.6,.8],0,0]]},
  execute:{d:1.3,ap:.62,two:1,k:[[0,RA_REST_R,RA_REST_L,[.1,.6,.8],0,0],[.4,[.04,.5,-.02],null,[0,.6,-.8],-.22,0],[.62,[.04,-.1,.5],null,[0,-.92,.38],.38,0],[.86,[.04,-.14,.46],null,[0,-.9,.42],.34,0],[1,RA_REST_R,RA_REST_L,[.1,.6,.8],0,0]]},
};
const RIDE_ANIM_NAMES={rest:'Rest',couch:'Couch',thrust:'Thrust',slam:'Overhead Slam',sweepR:'Forehand Sweep',sweepL:'Backhand Sweep',raise:'Raise',guard:'Guard',command:'Command',whirl:'Whirl',execute:'Execution'};
// what the mount's move asks of the rider
const RA_BY_CLIP={knRoyalRun:'couch',knPursuit:'couch',wyAssaultLoop:'couch',hsLance:'thrust',hsCouched:'thrust',knExecute:'slam',knShield:'guard',block:'guard',knJudgment:'raise',
  wyBreath:'command',wyStorm:'command',wyScreech:'command',wyAirBreath:'command',wySpinSweep:'whirl',wyRearStomp:'whirl',wyCrushLeap:'slam',wyDiveLand:'slam',wyTailLash:'sweepL',
  wyWingBuffet:'guard',wyBite:'thrust',wyTalonRake:'sweepR',wySnapShake:'sweepL',wyToss:'execute',wyImmolate:'command',wyInferno:'command',
  hxRage:'command',hxApocalypse:'raise',hxDrain:'raise',hxShadowStep:'guard',hxInfernalStrike:'execute',hxJudgment:'execute',hxImpale:'execute',hxHellfall:'raise',hxSoulRip:'raise',
  cbInfernalHowl:'command',cbHowl:'command',cbCyclone:'whirl',hxInfernalWhirl:'whirl',flinch:'guard',stagger:'guard',hurt:'guard'};
const RA_STRIKES=['thrust','sweepR','slam','sweepL'];
function raStart(u,n,d,delay){ const A=RIDE_ANIMS[n]; if(!A) return; u.rA={n,t:-(delay||0),d:d||A.d}; }
// the mount's action changed: choose the rider's move (Hades' own strikes come as hdRide events, 27g)
function raPick(u){
  const a=u.action; u.rAct=a;
  if(!a){ if(u.rA&&!RIDE_ANIMS[u.rA.n].loop&&u.rA.t<u.rA.d) return; u.rA=null; return; }
  const c=a.c, nm=c.name;
  if(u.T.hadesRider&&u.rEv>game.time-.05) return;   // a bident event already chose
  let n=RA_BY_CLIP[nm]||RA_BY_CLIP[nm.replace(/^idle_/,'')];
  if(!n&&c.idle) n=/salute|survey|roar|howl/i.test(nm)?'raise':null;
  const hit=(c.ev||[]).find(e=>e.e==='hit');
  if(!n&&hit){ u.rN=((u.rN||0)+1)%RA_STRIKES.length; n=RA_STRIKES[u.rN]; }
  if(!n){ if(/run|charge|gallop|pursuit|assault/i.test(nm)) n='couch'; else return; }
  const A=RIDE_ANIMS[n];
  if(A.loop||c.loop){ u.rA={n,t:0,d:A.d,hold:true}; return; }
  // time the rider's blow onto the mount's first hit
  let d=A.d, delay=0; if(hit&&A.ap){ const hitT=hit.t/(a.sp||1); delay=Math.max(0,hitT-A.ap*d); if(hitT<A.ap*d) d=Math.max(.3,hitT/A.ap); }
  raStart(u,n,d,delay);
}
// hdRide (27g): Hades' bident plays his own strikes
function raRideEvent(u,k,d){ u.rEv=game.time;
  if(k==='thrust') raStart(u,'thrust',Math.max(.45,(d||.3)*1.8));
  else if(k==='sweep'){ u.rSw=!u.rSw; raStart(u,u.rSw?'sweepR':'sweepL',Math.max(.5,(d||.35)*1.6)); }
  else if(k==='slam') raStart(u,(d||.55)>.5?'execute':'slam',Math.max(.7,(d||.55)*1.6));
  else if(k==='raise') raStart(u,'raise',Math.max(.8,(d||1)+.3)); }
// sample a move at phase p into o (hand R, hand L, direction, lean, twist)
const _raO={rh:[0,0,0],lh:[0,0,0],wd:[0,0,0],lean:0,tw:0,two:false};
function raSample(A,p,o){
  const K=A.k; let i=0; while(i<K.length-2&&p>K[i+1][0]) i++; const a=K[i], b=K[i+1], f=smooth(clamp((p-a[0])/Math.max(1e-4,b[0]-a[0]),0,1));
  for(let c=0;c<3;c++){ o.rh[c]=lerp(a[1][c],b[1][c],f); o.wd[c]=lerp(a[3][c],b[3][c],f); }
  const la=a[2]||RA_REST_L, lb=b[2]||RA_REST_L; for(let c=0;c<3;c++) o.lh[c]=lerp(la[c],lb[c],f);
  o.lean=lerp(a[4],b[4],f); o.tw=lerp(a[5],b[5],f); o.two=!!A.two&&(!a[2]||!b[2]); return o; }
// this frame's targets for the rider (smoothed toward the move, so one blends into the next)
function raTargets(u){
  const now=game.time, dt=clamp(now-(u.rT0===undefined?now:u.rT0),0,.1); u.rT0=now;
  if(u.action!==u.rAct) raPick(u);
  let A=RIDE_ANIMS.rest, p=(now*.31+(u.id||0)*.17)%1;
  const R=u.rA;
  if(R){ R.t+=dt; const AA=RIDE_ANIMS[R.n];
    if(R.t>=0){ if(AA.loop||R.hold&&u.action===u.rAct){ A=AA; p=(R.t/R.d)%1; } else if(R.t<R.d){ A=AA; p=R.t/R.d; } else u.rA=null; } }
  raSample(A,p,_raO);
  const S=u.rS||(u.rS={rh:_raO.rh.slice(),lh:_raO.lh.slice(),wd:_raO.wd.slice(),lean:0,tw:0}), k=1-Math.exp(-dt*(A===RIDE_ANIMS.rest?8:18));
  for(let c=0;c<3;c++){ S.rh[c]+=(_raO.rh[c]-S.rh[c])*k; S.lh[c]+=(_raO.lh[c]-S.lh[c])*k; S.wd[c]+=(_raO.wd[c]-S.wd[c])*k; }
  S.lean+=(_raO.lean-S.lean)*k; S.tw+=(_raO.tw-S.tw)*k; S.two=_raO.two; S.n=A===RIDE_ANIMS.rest?'rest':R?R.n:'rest';
  // how much this moment is the blow (its weapon aimed at the victim: 27e): around the move's strike, held while couched
  S.sw=A.ap&&!A.loop?smooth(clamp(1-Math.abs(p-A.ap)/.32,0,1)):A===RIDE_ANIMS.couch?.6:0;
  return S;
}
