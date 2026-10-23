/* ================= Heroes, unit abilities, alerts, pings and the battle record =================
   HEROES: each army takes the field with one general: a bigger, much tougher soldier of its own faction (the Order
   General is a swordsman, the Chaos Warlord a Dreadguard) in a regiment of his own. Kills level him up (5 levels:
   more health and harder blows, a wider aura). His aura (11 m + 1 m a level) steadies the troops around him: they
   hit harder and keep their nerve. He has two abilities on a cooldown: the General's Rally Cry and Shield Wall,
   the Warlord's War Howl and Meteor. If he falls he is back at the castle 90 s later, still at his level.
   The general you face uses his abilities on his own; yours wait for you (ability bar, T and Y), or for Auto-spawn.
   UNIT ABILITIES: a selected regiment can be told to use its special now: Swordsmen Rage, Ninjas Vanish, Clerics
   Mass Heal, mounts and beasts Spur (a sprint). Each regiment has its own cooldown.
   ALERTS and PINGS feed the HUD (41b): what happened and where, one click to look; a ping marks a spot for your
   2v2 teammate. The BATTLE RECORD samples both armies every 5 s for the end-of-battle report.
   Nothing here runs in the classic regression battle. */
const HERO_DEF={order:{type:'sword',name:'General',ab:['rally','wall'],col:'#ffd36a'},chaos:{type:'dread',name:'Warlord',ab:['howl','meteor'],col:'#ff6a2a'},wild:{type:'sword',name:'Elven Captain',ab:['bloom','roots'],col:'#9aff6a'}};
const HERO_AB={
  rally:{name:'Rally Cry',cd:45,key:'T',ico:'⚑',desc:'Allies within 14 m heal 20%, rally if they were running and fight 25% harder and faster for 8 s'},
  wall:{name:'Shield Wall',cd:50,key:'Y',ico:'⛨',desc:'Allies within 12 m take 40% less damage for 8 s'},
  howl:{name:'War Howl',cd:45,key:'T',ico:'⚑',desc:'Allies within 14 m heal 20%, rally if they were running and fight 25% harder and faster for 8 s'},
  bloom:{name:'Bloom',cd:45,key:'T',ico:'❀',desc:'Allies within 14 m regrow 40% of their health over 8 s and shake off poison and fire'},
  roots:{name:'Grasping Roots',cd:40,key:'Y',ico:'⌘',desc:'Roots burst up under the thickest enemy crowd within 30 m: held fast for 4 s, 30 damage'},
  meteor:{name:'Meteor',cd:45,key:'Y',ico:'☄',desc:'A meteor falls on the thickest enemy crowd within 30 m of the Warlord: up to 95 damage and fire'},
};
const HERO_XP=[0,5,12,22,36];   // kills to reach levels 2…5
const HEROS={u:[null,null],cd:[{},{}],respawn:[0,0],lv:[1,1],xp:[0,0]};
const METEORS=[];
const heroOn=()=>game.mode==='battle'&&!game.classicMix&&!game.demo&&!game.tutorial&&castleOn()&&settings.heroes!==false;
const heroDef=t=>HERO_DEF[facOf(t)]||HERO_DEF.order;
function heroReset(){
  const lock=()=>{ const o={}; for(const k in HERO_AB) o[k]=game.time+20; return o; };
  HEROS.u=[null,null]; HEROS.cd=[lock(),lock()];   // nothing in the first 20 s HEROS.respawn=[0,0]; HEROS.lv=[1,1]; HEROS.xp=[0,0]; METEORS.length=0;
  if(!heroOn()||NET.guest) return;
  for(let t=0;t<2;t++) spawnHero(t,true);
}
function spawnHero(t,start){
  const D=heroDef(t), T=TYPES[D.type], x=BASE_X[t]+DIRX[t]*(start?9:5), z=rand(-2,2);
  const u=makeUnit(D.type,t,x,z,{s:T.s*1.28}); u.isUnit=true; u.hero=true; units.push(u);
  heroLevel(u,HEROS.lv[t],true); HEROS.u[t]=u; assignRegiment(u); if(game.stance) assignSlots(t);
  if(!start){ puff(u.pos,10,.4,2,D.col); if(t===myTeam()) alertPush('Your '+D.name+' is back on the field','hero',x,z); }
  return u;
}
function heroLevel(u,lv,fresh){
  const mx=Math.round(u.T.hp*3.5*(1+.12*(lv-1)));
  if(fresh){ u.hp=u.maxHp=mx; } else { u.hp=Math.min(mx,u.hp+mx-u.maxHp+mx*.25); u.maxHp=mx; }
  u.heroLv=lv; u.morale=100;
}
// a guest sees the host's general: the same look, the level the host sends
function heroPuppet(u,lv){ if(!u.hero){ u.hero=true; } u.heroLv=lv||1; HEROS.u[u.team]=u; HEROS.lv[u.team]=u.heroLv; }
function heroKill(src){
  if(!src||!src.hero||!src.alive||NET.guest) return; const t=src.team; HEROS.xp[t]++;
  const lv=HEROS.lv[t]; if(lv<5&&HEROS.xp[t]>=HERO_XP[lv]){ HEROS.lv[t]=lv+1; heroLevel(src,lv+1); callout(src,heroDef(t).name+' · level '+(lv+1),'#ffd36a'); puff(src.j.chest,12,.2,2.2,heroDef(t).col);
    if(t===myTeam()){ sfx('research',src.j.head,.7); alertPush('Your '+heroDef(t).name+' reached level '+(lv+1),'hero',src.pos.x,src.pos.z); } }
}
function heroMul(t,src){
  let k=1;
  if(src&&src.T){ if(src.hero) k*=1.5*(1+.08*((src.heroLv||1)-1)); if(src.auraT>game.time) k*=1.08+.02*(src.auraLv||1); if(src.rallyT>game.time) k*=1.25; }
  if(t.wallT>game.time) k*=.6; if(t.hero) k*=.8;
  return k;
}
const heroAuraR=lv=>10+(lv||1);
function heroReady(t,ab){ return (HEROS.cd[t][ab]||0)<=game.time; }
// cast: offline and on the host this is the real thing; a guest asks the host (issue 'hero')
function heroCast(t,ab){
  const u=HEROS.u[t], A=HERO_AB[ab]; if(!A||!u||!u.alive||!heroDef(t).ab.includes(ab)) return 'bad_payload';
  if(!heroReady(t,ab)) return 'cooldown';
  HEROS.cd[t][ab]=game.time+A.cd;
  let x=u.pos.x, z=u.pos.z;
  if(ab==='rally'||ab==='howl'){
    gridEach(u.pos.x,u.pos.z,14,o=>{ if(!o.alive||o.team!==t||!o.isUnit||Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z)>14) return;
      o.hp=Math.min(o.maxHp,o.hp+o.maxHp*.2); o.morale=Math.min(100,o.morale+40); if(o.routing){ o.routing=false; o.morale=Math.max(o.morale,70); } o.rallyT=game.time+8; });
    callout(u,A.name+'!','#ffd36a'); }
  else if(ab==='wall'){
    gridEach(u.pos.x,u.pos.z,12,o=>{ if(o.alive&&o.team===t&&o.isUnit&&Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z)<=12) o.wallT=game.time+8; });
    callout(u,'Shield Wall!','#9fd8ff'); }
  else if(ab==='bloom'){
    gridEach(u.pos.x,u.pos.z,14,o=>{ if(!o.alive||o.team!==t||!o.isUnit||Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z)>14) return; o.bloomT=game.time+8; if(o.st){ o.st.poison=null; o.st.burn=null; } o.morale=Math.min(100,o.morale+20); });
    callout(u,'Bloom!','#9aff6a'); }
  else if(ab==='meteor'||ab==='roots'){
    let best=null,bs=0;
    for(const e of units){ if(!e.alive||e.team===t||e.team>1||!e.isUnit||isAir(e)) continue; const d=Math.hypot(e.pos.x-u.pos.x,e.pos.z-u.pos.z); if(d>30) continue;
      let n=0; gridEach(e.pos.x,e.pos.z,4,o=>{ if(o.alive&&o.team!==t&&o.isUnit&&Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<4) n++; }); const sc=n-d*.02; if(sc>bs){ bs=sc; best=e; } }
    if(!best){ HEROS.cd[t][ab]=game.time+2; return 'no_target'; }
    x=best.pos.x; z=best.pos.z; callout(u,ab==='roots'?'Grasping Roots!':'Meteor!',ab==='roots'?'#9aff6a':'#ff8a3a');
    if(ab==='roots') for(const o of units){ if(!o.alive||o.team===t||o.team>1||!o.isUnit||isAir(o)) continue; const d=Math.hypot(o.pos.x-x,o.pos.z-z); if(d>5) continue;
      o.rootT=game.time+4; damage(o,30,u,new V3(o.pos.x-x||1,0,o.pos.z-z).normalize(),.3,0); } }
  if(NET.host||NET.rec) netCapEvent(['hc',t,ab,Math.round(x*100),Math.round(z*100)]);
  heroCastFx(t,ab,x,z,u);
  return true;
}
// what everyone sees (a guest gets it as an event): the shout, the ring, the falling rock
function heroCastFx(t,ab,x,z,u){
  const A=HERO_AB[ab]; if(!A) return; if(NET.guest) HEROS.cd[t][ab]=game.time+A.cd;
  u=u||HEROS.u[t]; const c=new V3(x,H(x,z),z);
  if(ab==='rally'||ab==='howl'){ ring(c,14,heroDef(t).col); ring(c,8,'#fff3c8'); sfx('warcry',u?u.j.head:c,1); if(u) puff(u.j.chest,10,.25,2.4,heroDef(t).col); }
  else if(ab==='wall'){ ring(c,12,'#9fd8ff'); sfx('horn',c,.8); }
  else if(ab==='bloom'){ ring(c,14,'#9aff6a'); sfx('research',c,.7); if(u) puff(u.j.chest,12,.25,2,'#9aff6a'); }
  else if(ab==='roots'){ ring(c,5,'#7a5a2a'); ring(c,3,'#9aff6a'); puff(c,14,.5,2.4,'#6a4a2a'); sfx('stone',c,1); shakeAt(c,.25); }
  else if(ab==='meteor'){ METEORS.push({x,z,t:0,dur:1.25,team:t,src:u||null,from:new V3(x-DIRX[t]*14,H(x,z)+34,z+rand(-4,4))}); sfx('warcry',u?u.j.head:c,.8); }
  if(t!==myTeam()&&ab!=='meteor') return;
  if(t!==myTeam()) alertPush(ab==='roots'?'Roots hold your soldiers!':'Meteor incoming!','danger',x,z);
}
function meteorStep(dt){
  for(let i=METEORS.length-1;i>=0;i--){ const M=METEORS[i]; M.t+=dt; const k=clamp(M.t/M.dur,0,1), g=H(M.x,M.z);
    const p=_mt1.copy(M.from).lerp(_mt2.set(M.x,g,M.z),k*k);
    emitFire(p,2,.8,0,2,0,.6,.5); if(Math.random()<.5) puff(p,1,.6,.5,'#3a2a22');
    if(k>=1){ METEORS.splice(i,1); const c=new V3(M.x,g,M.z);
      fireBurst(c.clone().setY(g+.4),26,.9,7,.9); flashes.push({p:c.clone().setY(g+1),r0:.6,r1:6,t:0,life:.45,col:'#ff8a2a'}); ring(c,6,'#ffb347'); ring(c,3.5,'#ff6a1a');
      shakeAt(c,.9); sfx('blast',c,1.2); puff(c,16,.9,4,'#4a3a30');
      if(!NET.guest) for(const o of units){ if(!o.alive||o.team===M.team||!o.isUnit||isAir(o)) continue; const d=Math.hypot(o.pos.x-M.x,o.pos.z-M.z); if(d>5) continue;
        const dir=new V3(o.pos.x-M.x,0,o.pos.z-M.z); if(dir.lengthSq()<1e-4) dir.set(1,0,0); dir.normalize();
        damage(o,Math.max(30,95*(1-d/6.5)),M.src&&M.src.alive?M.src:null,dir,4.5,2.2); applyBurn(o,M.src,9,4); } } }
}
const _mt1=new V3(), _mt2=new V3();
// the general in a crowd uses what's ready (the enemy's always; yours on Auto-spawn)
function heroAI(t){
  const u=HEROS.u[t]; if(!u||!u.alive||u.state!=='ok') return;
  const D=heroDef(t), foes=enemiesNear(t,u.pos.x,u.pos.z,9);
  let hurt=0, near=0; gridEach(u.pos.x,u.pos.z,12,o=>{ if(o.alive&&o.team===t&&o.isUnit){ near++; if(o.hp<o.maxHp*.6||o.routing) hurt++; } });
  if(heroReady(t,D.ab[0])&&(hurt>=4||foes>=6&&near>=4)) { heroCast(t,D.ab[0]); return; }
  if(D.ab[1]==='wall'&&heroReady(t,'wall')&&foes>=6&&near>=5){ heroCast(t,'wall'); return; }
  if((D.ab[1]==='meteor'||D.ab[1]==='roots')&&heroReady(t,D.ab[1])&&foes>=2){ let n=0; gridEach(u.pos.x,u.pos.z,26,o=>{ if(o.alive&&o.team!==t&&o.team<2&&o.isUnit) n++; }); if(n>=5) heroCast(t,D.ab[1]); }
}
function heroStep(dt){
  for(let t=0;t<2;t++){ const u=HEROS.u[t];
    if(u&&!u.alive){ HEROS.u[t]=null; if(!NET.guest) HEROS.respawn[t]=game.time+90;
      const D=heroDef(t); if(t===myTeam()) alertPush('Your '+D.name+' has fallen · back in 90 s','danger',u.pos.x,u.pos.z); else alertPush('The enemy '+D.name+' has fallen','good',u.pos.x,u.pos.z); }
    if(!NET.guest&&!HEROS.u[t]&&HEROS.respawn[t]&&game.time>=HEROS.respawn[t]&&game.over<=0){ HEROS.respawn[t]=0; spawnHero(t,false); } }
  game.heroT=(game.heroT||0)-dt; if(game.heroT>0) return; game.heroT=.5;
  if(!NET.guest) for(const o of units) if(o.alive&&o.bloomT>game.time&&o.hp<o.maxHp) o.hp=Math.min(o.maxHp,o.hp+o.maxHp*.025);
  for(let t=0;t<2;t++){ const u=HEROS.u[t]; if(!u||!u.alive) continue; const R=heroAuraR(u.heroLv);
    gridEach(u.pos.x,u.pos.z,R,o=>{ if(o.alive&&o.team===t&&o.isUnit&&Math.hypot(o.pos.x-u.pos.x,o.pos.z-u.pos.z)<=R){ o.auraT=game.time+.8; o.auraLv=u.heroLv; } });
    if(!NET.guest&&(t!==myTeam()&&!NET.on||game.auto[t]&&t===myTeam()&&!NET.on)) heroAI(t); }
}
// the general's look: a ring of light at his feet, a crest (the General) or a crown of fire (the Warlord)
const _hx1=new V3(),_hx2=new V3();
function drawHeroFx(u){
  const D=heroDef(u.team), s=u.s, t=game.time, chaos=facOf(u.team)==='chaos', lv=u.heroLv||1;
  for(let i=0;i<8;i++){ const a=t*1.2+i/8*TAU; _hx1.set(u.pos.x+Math.cos(a)*.9*s,u.pos.y+.06,u.pos.z+Math.sin(a)*.9*s); glowAt(_hx1,.07*s,D.col); }
  _hx2.subVectors(u.j.head,u.j.neck).normalize();
  if(chaos){ for(let i=0;i<5;i++){ const a=t*.8+i/5*TAU; _hx1.copy(u.j.head).addScaledVector(_hx2,.2*s); _hx1.x+=Math.cos(a)*.14*s; _hx1.z+=Math.sin(a)*.14*s; glowAt(_hx1,(.07+.02*Math.sin(t*9+i))*s,'#ff7a2a'); } }
  else { _hx1.copy(u.j.head).addScaledVector(_hx2,.17*s); cyl(_hx1,_hx2.copy(_hx1).addScaledVector(UP,.2*s).addScaledVector(u.fwdW,-.18*s),.05*s,RC.gold,limbIM); }
  for(let i=1;i<lv;i++){ _hx1.copy(u.j.head).addScaledVector(UP,(.55+.0*i)*s); _hx1.addScaledVector(camRight(),(i-lv/2)*.16*s); glowAt(_hx1,.05*s,'#ffe08a'); }
  // the aura's edge while you have him selected
  if(u.reg&&selRegs.includes(u.reg)){ const R=heroAuraR(lv); for(let i=0;i<40;i++){ const a=i/40*TAU+t*.1; _hx1.set(u.pos.x+Math.cos(a)*R,0,u.pos.z+Math.sin(a)*R); _hx1.y=H(_hx1.x,_hx1.z)+.08; glowAt(_hx1,.09,D.col); } }
}
// buffs on everyone: a glint at the chest while a Rally or Shield Wall lasts
function drawBuffFx(u){ const tt=game.time;
  if(u.rootT>tt){ for(let i=0;i<4;i++){ const a=i/4*TAU+u.id; _hx1.set(u.pos.x+Math.cos(a)*.25*u.s,u.pos.y+.15+.25*((tt*2+i*.3)%1)*u.s,u.pos.z+Math.sin(a)*.25*u.s); glowAt(_hx1,.06*u.s,'#7aaa3a'); } }
  if(u.bloomT>tt&&((tt*3+u.id)%1)<.5){ _hx1.copy(u.j.chest).addScaledVector(UP,.1*u.s); glowAt(_hx1,.07*u.s,'#9aff6a'); }
  if(u.wallT>tt){ _hx1.copy(u.j.chest).addScaledVector(u.fwdW,.22*u.s); glowAt(_hx1,(.09+.02*Math.sin(tt*6+u.id))*u.s,'#9fd8ff'); }
  else if(u.rallyT>tt&&((tt*4+u.id)%1)<.5){ _hx1.copy(u.j.head).addScaledVector(UP,.3*u.s); glowAt(_hx1,.06*u.s,'#ffd36a'); } }

/* ---------- unit abilities for the selected regiments ---------- */
const UNIT_AB={
  rage:{name:'Rage',key:'U',ico:'✊',types:{sword:1},res:'rage',cd:20,desc:'Swordsmen fly into a Rage at once: faster, 30% more damage'},
  vanish:{name:'Vanish',key:'U',ico:'◐',types:{ninja:1},res:'shinobi',cd:24,desc:'Ninjas vanish into the shadows'},
  heal:{name:'Mass Heal',key:'U',ico:'✚',types:{cleric:1},cd:16,desc:'Clerics heal everyone around them at once'},
  summon:{name:'Summon Treants',key:'I',ico:'♣',types:{cleric:1},res:'grove',fac:'wild',cd:50,desc:'The Druids call a Treant up out of the ground (two in a forest); it fights for 40 s'},
  spur:{name:'Spur',key:'I',ico:'»',types:{knight:1,hound:1,cerberus:1,crawler:1},cd:25,desc:'Mounts and beasts sprint 40% faster for 5 s'},
  // the Wyvern Knight (27f): five for the knight, five for the wyvern, and flight
  fly:{name:'Take Off / Land',key:'G',ico:'⇅',types:{knight:1},cd:2,desc:'Keep the wyvern aloft (it attacks with its breath from the sky), or bring it down and keep it on the ground for 25 s'},
  royal:{name:'Royal Lance Charge',key:'J',ico:'⚔',types:{knight:1},res:'wyArts',cd:20,desc:'The knight levels his lance: the wyvern lands and charges through the thickest crowd, throwing down everyone in its path'},
  exec:{name:'Aerial Execution',key:'K',ico:'⇓',types:{knight:1},res:'wyArts',cd:30,desc:'Soars, swoops on the most valuable wounded enemy and drives the lance home (executes below 40% health)'},
  shield:{name:'Shield of the Crown',key:'N',ico:'⛨',types:{knight:1},res:'wyArts',cd:24,desc:'The royal shield goes up: 55% less damage for 7 s, 30% for allies close by'},
  pursuit:{name:'Royal Pursuit',key:'M',ico:'➹',types:{knight:1},res:'wyArts',cd:22,desc:'Marks an archer or caster and hunts it for 8 s: 45% faster, 50% more damage to it'},
  judge:{name:"King's Judgment",key:'B',ico:'♛',types:{knight:1},res:'wyArts',cd:40,desc:'The lance comes down from on high: 4.5× damage, executes below 35% health; a kill shakes the nerve of everyone near'},
  breath:{name:'Infernal Breath',key:'⇧J',ico:'♨',types:{knight:1},res:'wyMastery',cd:16,desc:'A sweeping cone of fire that burns everyone in front, from the ground or the air'},
  dive:{name:'Talon Dive',key:'⇧K',ico:'⤓',types:{knight:1},res:'wyMastery',cd:20,desc:'Climbs, then drops talons-first onto the thickest crowd: heavy damage, knocks them flat'},
  storm:{name:'Wingstorm',key:'⇧N',ico:'≋',types:{knight:1},res:'wyMastery',cd:18,desc:'Three great wingbeats hurl everyone near away and break their attacks'},
  screech:{name:"Predator's Screech",key:'⇧M',ico:'!',types:{knight:1},res:'wyMastery',cd:26,desc:'Shakes the nerve of enemies near (morale, 35% slower for 4 s) and spurs allies on'},
  // Hades on Cerberus (27g)
  infernal:{name:'Infernal Strike',key:'J',ico:'☄',types:{hades:1},cd:16,desc:'Cerberus leaps into the crowd and Hades drives the bident down: a blast of fire, 2.2× damage, knocked flat'},
  rage:{name:'Cerberus Rage',key:'K',ico:'✹',types:{hades:1},cd:28,desc:'For 8 s: 30% faster, attacks 35% quicker and 25% harder, the heads spit fire'},
  drain:{name:'Soul Drain',key:'N',ico:'❂',types:{hades:1},cd:24,desc:'Hades draws the souls out of everyone within 7 m for 2.5 s and heals by half of it'},
  shadow:{name:'Shadow Step',key:'M',ico:'◑',types:{hades:1},cd:18,desc:'Steps through the shadows behind the most valuable enemy within 16 m; the next blow strikes double'},
  apocalypse:{name:'Apocalypse',key:'B',ico:'☠',types:{hades:1},cd:60,desc:'The bident raised to the sky: nine pillars of fire fall on the thickest crowd'},
  assault:{name:'Aerial Assault',key:'⇧B',ico:'✈',types:{knight:1},res:'wyMastery',cd:35,desc:'A strafing run low over the enemy line, burning and raking everything beneath'},
};
function regAbilities(r){ const out=[]; if(!r) return out; for(const id in UNIT_AB){ const A=UNIT_AB[id]; if(!A.types[r.type]) continue; if(A.res&&!hasRes(r.team,A.res)) continue; if(A.fac&&facOf(r.team)!==A.fac) continue; out.push(id); } return out; }
function regAbReady(r,ab){ return !r.abT||!(r.abT[ab]>game.time); }
function regAbility(team,r,ab){
  const A=UNIT_AB[ab]; if(!A||!r||r.team!==team||!regAbilities(r).includes(ab)) return 'bad_payload';
  if(!regAbReady(r,ab)) return 'cooldown';
  (r.abT||(r.abT={}))[ab]=game.time+A.cd;
  let n=0;
  for(const u of regAlive(r)){ if(u.state!=='ok'||u.routing) continue;
    if(ab==='rage'){ u.rage=6; u.rageCd=18; n++; }
    else if(ab==='vanish'){ if(!u.cloak&&!u.action){ play(u,'shinobi'); u.fwdScale=0; u.cdShin=24; n++; } }
    else if(ab==='heal'){ if(!u.action){ u.healT=u; u.massCd=game.time+15; play(u,'massHeal'); u.fwdScale=0; u.healCd=1.1; n++; } }
    else if(ab==='spur'){ u.spurT=game.time+5; n++; }
    else if(WY_AB[ab]){ if(u.T.wyvern&&wyCast(u,ab)) n++; }
    else if(HX_AB[ab]){ if(u.T.hadesRider&&hxCast(u,ab)) n++; } }
  if(ab==='summon'){ const c=regCenter(r), forest=RL.on&&typeof inForest==='function'&&inForest(c.x,c.z); summonTreants(r.team,c.x+DIRX[r.team]*2,c.z,forest?2:1); n++; }
  const b=regAlive(r)[0]; if(b) callout(b,A.name+'!','#ffd36a');
  if(NET.host||NET.rec) netCapEvent(['ab',r.id,ab]);
  return true;
}

/* ---------- alerts ---------- */
const ALERTS=[]; const ALERT_KEY={};
function alertPush(text,kind,x,z,key){
  if(game.demo||game.mode!=='battle') return;
  const k=key||text, now=performance.now(); if(ALERT_KEY[k]&&now-ALERT_KEY[k]<9000) return; ALERT_KEY[k]=now;
  ALERTS.unshift({text,kind:kind||'info',x,z,at:now,id:Math.random()}); if(ALERTS.length>5) ALERTS.length=5;
  if(typeof alertsRender==='function') alertsRender();
}
// your soldiers hit somewhere you aren't looking: an alert for that patch of field (one per 30 m every 15 s)
const ATK_CELL={};
function alertHit(t,src){
  if(t.team!==myTeam()||!src||src.team===t.team||game.classicMix) return;
  const now=performance.now();
  if(t.isStatue){ if(!ATK_CELL.st||now-ATK_CELL.st>15000){ ATK_CELL.st=now; alertPush('Your statue is under attack!','danger',t.pos.x,t.pos.z,'statue'); } return; }
  if(!t.isUnit) return;
  const cx=Math.floor(t.pos.x/30), cz=Math.floor(t.pos.z/30), key=cx+','+cz;
  if(ATK_CELL[key]&&now-ATK_CELL[key]<15000) return; ATK_CELL[key]=now;
  _proj.copy(t.pos).project(camera); if(_proj.z<1&&Math.abs(_proj.x)<.8&&Math.abs(_proj.y)<.8) return;   // you can see it already
  alertPush('Your '+tPl(t.type,t.team)+' are under attack','danger',t.pos.x,t.pos.z,'atk'+key);
}

/* ---------- fight pings on the map, and pings for a teammate ---------- */
const FIGHT={};   // cell → last hit time
function fightMark(t){ if(!t||!t.pos||game.classicMix) return; const k=Math.floor(t.pos.x/8)+','+Math.floor(t.pos.z/8); const f=FIGHT[k]||(FIGHT[k]={x:0,z:0,t:0,n:0}); f.x=t.pos.x; f.z=t.pos.z; f.t=game.time; f.n++; }
const PINGS=[];
function pingAt(x,z,team,who){
  PINGS.push({x,z,t:game.time,team}); if(PINGS.length>8) PINGS.shift();
  const c=new V3(x,H(x,z),z); ring(c,3,'#7fe0ff'); ring(c,1.6,'#ffffff'); sfx('ui',c,.9);
  if(team===myTeam()) alertPush((who||'Teammate')+' pinged the map','ping',x,z,'ping'+Math.round(x)+','+Math.round(z));
}
function pingSend(x,z){
  if(!isFinite(x)||!isFinite(z)) return;
  if(NET.on) issue('ping',{x:+x.toFixed(1),z:+z.toFixed(1)}); else pingAt(x,z,myTeam(),'You');
}

/* ---------- the battle record ---------- */
function recordTick(dt){
  const S=game.stats; if(!S||game.demo) return;
  S.recT=(S.recT||0)-dt; if(S.recT>0) return; S.recT=5;
  const a=[0,0], pw=[0,0]; for(const u of units){ if(!u.alive||!u.isUnit||u.team>1) continue; a[u.team]++; pw[u.team]+=u.T.cost||0; }
  (S.series||(S.series=[])).push({t:Math.round(game.time-S.t0),a,p:pw,k:S.kills.slice(),g:S.gold.map(Math.round),z:RL.on?[rlHeld(0),rlHeld(1)]:[0,0]});
  if(S.series.length>400) S.series.splice(0,S.series.length-400);
}
function recordKill(t){ const S=game.stats, b=t.lastHitBy; if(!S||!b||!b.reg||b.team===t.team) return;
  const R=S.regK||(S.regK={}), r=b.reg, e=R[r.id]||(R[r.id]={team:r.team,type:r.type,num:r.num,hero:!!r.hero,k:0}); e.k++; }

/* ---------- once a frame in battle ---------- */
function battleExtras(dt){
  if(game.classicMix||game.mode!=='battle') return;
  if(game.fac&&(game.fac[0]==='wild'||game.fac[1]==='wild')) wildTick(dt);
  heroStep(dt); meteorStep(dt); recordTick(dt); if(game.mission) storyTick(dt);
}
