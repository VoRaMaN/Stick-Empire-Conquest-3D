/* ================= Animation registry (v0.31): every unit's clips sorted by what they are for =================
   The animation architecture, in one place:
     1. Clips are data (RAW[type][name]: keys of pose channels + timed events), written per unit in 11–13*.js.
     2. normClip (14-aim) fills every key against the unit's idle pose and compiles them into CLIPS[type].
     3. A clip plays through play(u,name): updateAction advances it, fires its events (hits, sounds, effects in
        EXTRA_EV), applies root motion, and computePose/computeCrawlPose blends it over locomotion with a weight
        that eases in and out; filterPose springs every channel so nothing snaps.
     4. Procedural layers ride on top: the flight cycle (flap, glide, climb, bank, dive) of flyers and wyverns, the
        rider's stances on a mount, the Cerberus' side heads, tails, gaits, IK for feet and paws.
     5. Online and in replays only the clip's name travels; every screen plays the same data.
   ANIM groups every compiled clip by role so the Unit Viewer, the Armory and the Lab can count and list them,
   and checks them once at start (NaN keys, unsorted events, zero length) so a broken clip is caught early. */
const ANIM_REACT={block:1,parry:1,dodge:1,recoil:1,flinch:1,knockdown:1,stagger:1,wyAirHit:1};
const ANIM_ABIL={knRoyalRun:1,knExecute:1,knShield:1,knPursuit:1,knJudgment:1,wyBreath:1,wyStorm:1,wyScreech:1,hxInfernalStrike:1,hxRage:1,hxDrain:1,hxShadowStep:1,hxApocalypse:1,shinobi:1,massHeal:1};
const ANIM_FLY={wyTakeoff:1,wyLand:1,wyAirBreath:1,wyAssaultLoop:1,wyDiveLand:1};
const ANIM={};
function animRole(t,n){ const T=TYPES[t];
  if(n.startsWith('idle_')) return 'idle'; if(n.startsWith('chg_')) return 'charge'; if(FINS[t]&&FINS[t].includes(n)) return 'finisher';
  if(ANIM_ABIL[n]) return 'ability'; if(ANIM_FLY[n]) return 'flight'; if(ANIM_REACT[n]) return 'reaction'; if(T.attacks&&T.attacks.includes(n)) return 'attack'; return 'other'; }
function animBuild(){
  for(const t in CLIPS){ const R=ANIM[t]={attack:[],idle:[],finisher:[],charge:[],ability:[],flight:[],reaction:[],other:[],bad:[]};
    for(const n in CLIPS[t]){ const c=CLIPS[t][n]; let ok=c.dur>0;
      for(const k of c.keys){ for(const f of NF) if(k[f]!==null&&k[f]!==undefined&&!isFinite(k[f])) ok=false; }
      for(let i=1;i<c.ev.length;i++) if(c.ev[i].t<c.ev[i-1].t) ok=false;
      if(!ok) R.bad.push(n); R[animRole(t,n)].push(n); } }
}
for(const id in CREATURE_ANIMS){ const d=CREATURE_ANIMS[id]; if(d.cat==='ability') ANIM_ABIL[d.clip]=1; }   // the creatures' ability animations (13m)
animBuild(); caFinalize();
// a line for the Unit Viewer: how many of each a soldier has (common clips every unit shares are not counted)
function animSummary(t){ const R=ANIM[t]; if(!R) return ''; const own=k=>R[k].filter(n=>!(RAW.common&&RAW.common[n])).length;
  return own('attack')+' attacks · '+own('idle')+' idles · '+own('finisher')+' finishers · '+own('charge')+' charges'+(own('ability')?' · '+own('ability')+' abilities':'')+(own('flight')?' · '+own('flight')+' flight':'')+' · '+own('reaction')+' reactions'; }
