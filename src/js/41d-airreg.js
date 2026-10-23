/* ================= The new soldiers join their armies (v0.33): rosters, buildings, AI roles, viewer =================
   Ballista (Order, Archery Range) · Acid Spitter (Chaos, the Hellpit) and Devil Bat (Chaos, the Soul Spire) · Elf Hawk Archer (Wildlands,
   Eagle Eyrie). Sheets in 13l, bodies and behaviour in 27k. */
{ const ins=(L,after,t)=>{ if(L.includes(t)) return; const i=L.indexOf(after); L.splice(i<0?L.length:i+1,0,t); };
  ins(ORDER,'archer','ballista'); ins(CHAOS,'harvester','spitter'); ins(CHAOS,'spitter','bat'); ins(WILD,'archer','hawk');
  FACTIONS.order.mix.push('ballista'); FACTIONS.chaos.mix.push('spitter','bat','spitter'); FACTIONS.wild.mix.push('hawk','hawk');
  // the Wildlands soldier: an elf with the clan's colours
  TYPES.hawk.wild=true; TYPES.hawk.body=WILD_BODY; ELF_ROLE.hawk='hood';
  Object.assign(AI_ROLE,{ballista:'rng',spitter:'rng',hawk:'rng',bat:'air'});
  Object.assign(AI_BEATS.rng,{}); AI_BEATS.air=Object.assign({},AI_BEATS.air,{rng:.45});
  Object.assign(REG_SIZE,{ballista:2,spitter:6,hawk:6,bat:4});
  Object.assign(FORM,{ballista:{cols:2,gap:2.8,depth:3},spitter:{cols:4,gap:1.6,depth:1.9},hawk:{cols:5,gap:1.35,depth:1.4},bat:{cols:3,gap:2.8,depth:2.6}});
  ins(FORM_ORDER,'archer','hawk'); ins(FORM_ORDER,'hawk','ballista'); ins(FORM_ORDER,'harvester','spitter'); ins(FORM_ORDER,'wing','bat');
  Object.assign(TYPE_PL,{ballista:'Ballistas',spitter:'Acid Spitters',hawk:'Elf Hawk Archers',bat:'Devil Bats'});
  Object.assign(TRAIN_T,{ballista:5,spitter:2.4,hawk:3.4,bat:4});
  const B=(list,id,t)=>{ const b=list.find(x=>x.id===id); if(b&&!b.trains.includes(t)){ b.trains.push(t); b.desc+=''; } };
  B(BUILDINGS,'range','ballista'); B(BUILDINGS_WILD,'aerie','hawk'); B(BUILDINGS_CHAOS,'spire','bat');
  { const r=BUILDINGS.find(x=>x.id==='range'); if(r) r.desc='Archers and Ballistas'; const a=BUILDINGS_WILD.find(x=>x.id==='aerie'); if(a) a.desc='Eagle Scouts, launched from the roof, and Elf Hawk Archers'; }
  TRAINED_AT.ballista='range'; TRAINED_AT.hawk='aerie'; TRAINED_AT.spitter='pit'; TRAINED_AT.bat='spire';
  Object.assign(MANA_COST,{bat:30,hawk:20});
  Object.assign(RL_RANGE,{ballista:4,hawk:5,spitter:3});
  Object.assign(CAV_PREY,{ballista:1,hawk:1,spitter:1});
  Object.assign(AIMW,{ballista:AIMW.archer,hawk:AIMW.archer,spitter:AIMW.crawler||AIMW.hound||AIMW.archer,bat:AIMW.wing});
  Object.assign(UNIT_INFO,{
    ballista:{role:'Anti-air artillery',desc:'One crewman pushes a wheeled bolt-thrower and sights it on its pivot. Slow and long-ranged, it hurls bolts that knock wyverns, Wing Archers and Devil Bats out of the sky: three times the damage to anything that flies.',
      abil:['Bolts strike flyers three times as hard','Outranges the archers','Slow; keep it behind a line']},
    spitter:{role:'Anti-air beast',desc:'A Hellcrawler swollen with acid. It rears up and spits homing gobs that splash and eat at whatever they hit, two and a half times as hard against flyers.',
      abil:['Homing acid: flyers take 2.5× damage','Splash and poison','Fast for a ranged soldier']},
    hawk:{role:'Anti-air archer',desc:'An elven ranger with a hawk on the shoulder. Her long arrows hit flyers two and a half times as hard, and when one comes near the hawk launches to strike it.',
      abil:['Arrows strike flyers 2.5× as hard','The hawk hunts flyers within 22 m','Light and quick']},
    bat:{role:'Flying demon',desc:'A demon the size of a Spartan on great bat wings, with long, wide arms ending in claws. It dives on its prey, rakes and climbs away; on the ground only arrows, bolts, spells and other flyers can touch it.',
      abil:['Flies: only ranged soldiers and flyers can reach it','Diving rakes, twin claws, snatch and drop','Its screech shakes the nerve of those below']}});
  Object.assign(COUNTER,{ballista:['Wyverns, Wing Archers, Devil Bats','Ninjas, Hounds, Knights on the ground'],spitter:['Flyers, archers','Spartans, Knights'],
    hawk:['Flyers','Swordsmen, Hounds'],bat:['Archers, casters, workers','Ballistas, Hawk Archers, Spitters']});
  Object.assign(ICON_POSE,{ballista:{lean:.22,crouch:.1},spitter:{lean:-.3,draw:.8,crouch:.04,look:-.25},bat:{R:[.46,-.7,.16],L:[-.46,-.7,.16],lean:.28}});
}
// the recruit: anti-air when the enemy flies, now and then otherwise
{ const fp=factionPick;
  factionPick=function(t){ const F=FAC(t), C=AIE.comp[t], air=C&&C.air||0, r=Math.random();
    if(F.id==='order'&&r<.04+air*.6) return 'ballista';
    if(F.id==='wild'&&r<.06+air*.6) return 'hawk';
    if(F.id==='chaos'){ if(r<.05+air*.6) return 'spitter'; if(r>.94) return 'bat'; }
    return fp(t); }; }
