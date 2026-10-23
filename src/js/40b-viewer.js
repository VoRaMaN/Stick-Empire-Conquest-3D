/* ================= Unit Viewer: every unit up close on a turntable, with its story, stats and abilities ================= */
const UNIT_INFO={
  miner:{role:'Gold miner',desc:'The backbone of the Order\'s treasury. Miners dig gold from the hills and haul it home in heavy sacks; without them no army marches. They carry a pickaxe and will swing it if cornered, but they belong at the mine, not the front.',
    abil:['Digs gold and carries it home','Fights only when cornered']},
  sword:{role:'Swift infantry',desc:'Cheap, quick and fearless, Swordsmen are the Order\'s first answer to everything. They close fast, slash hard and come in numbers, and a full regiment charging at once can break a line before it is ready.',
    abil:['Fast and cheap','Charge attacks at a sprint']},
  spear:{role:'Shield wall',desc:'Bronze shield, long spear and the discipline of a lifetime. Spartans lock shields into a wall that stops arrows from the front and holds the line against anything that walks into it.',
    abil:['Shield Wall: stops arrows from the front','Holds the line against charges','Heavily armoured']},
  archer:{role:'Ranged support',desc:'Archers rain arrows on anything in range from behind the line. Fragile up close, so keep a wall of Spartans in front of them. Research Fire Arrows to set their volleys alight.',
    abil:['Long-range volleys','Fire Arrows (research)','Mans the castle walls']},
  ninja:{role:'Assassin',desc:'The fastest fighter on the field. The Ninja hunts the enemy\'s casters and archers first, slipping into Shinobi invisibility to close the distance unseen.',
    abil:['Shinobi: invisible; first blows from hiding hit double and poison','Fixate: each blow on the same enemy hits harder','Hunts archers and casters first']},
  cleric:{role:'Healer',desc:'Clerics keep the army standing. They mend wounds, wash away poison and fire, and can blind a whole enemy rank with a flash of holy light.',
    abil:['Heal','Sanctuary: heals everyone nearby','Cure: removes poison and fire','Blinding Flash']},
  wizard:{role:'Spell caster',desc:'A battle mage whose staff hurls arcane blasts and calls meteors and lightning down on packed ranks. Weak in a brawl, devastating from range.',
    abil:['Arcane Blast','Meteor','Lightning Call','Electric Wall','Poison Spray','Force Push']},
  wing:{role:'Flying crossbow',desc:'Strapped into flapping mechanical wings, the Wing Archer shoots from the air, where only ranged units can reach him. Blazing Bolts set his targets on fire, and he dives and strafes along the enemy line.',
    abil:['Flies: only ranged units can hit him','Blazing Bolts','Dives and strafing shots']},
  giant:{role:'Siege brute',desc:'A walking mountain with a club the size of a tree. Giants smash whole groups at once and shrug off blows that would fell a dozen men, but they are slow and draw every eye on the field.',
    abil:['Smashes whole groups','Enormous health','Slow']},
  thrall:{role:'Soul miner',desc:'Hooded, chained and bound to the Dominion, Thralls dig red soul crystals from the earth to pay for the Chaos army. They fight only when cornered.',
    abil:['Digs soul crystals and carries them home','Soul Siphon (research): digs faster, carries more']},
  crawler:{role:'Pack hunter',desc:'A four-limbed demon of cracked black rock with magma in its veins. Hellcrawlers hunt in packs, pounce from several strides out and grow frenzied when their pack-mates share the kill.',
    abil:['Pounce: a leap that closes the gap in one bound','Pack Frenzy: faster claws for every pack-mate on the same victim','Knocks light troops flat','Magma Claws (research): sets prey on fire']},
  dread:{role:'Heavy axeman',desc:'Broad-shouldered and sealed in hellforged plate, the Dreadguard wades into the enemy line with a great axe. Every swing cuts through everything in its arc.',
    abil:['Cleaving swings hit every enemy in the arc','Hellforged Cleave (research): breaks lines and shield walls','Infernal Plate (research): 20% less damage']},
  harvester:{role:'Soul caster',desc:'A walking skeleton with a captured soul burning in its ribs. From range it hurls soul fragments and wails; up close it fights with the scythe. Its Soul Rend curse makes victims take more damage.',
    abil:['Soul Fragment, Volley and Lance','Wail of the Dead','Soul Rend: cursed enemies take 25% more damage','Scythe strikes when enemies get close']},
  boner:{role:'Skirmisher',desc:'A skeleton warrior with a curved bone blade in each hand. Bone Reavers are fast and vicious, cutting in flurries and whirling through crowds, and they come cheap enough to field in packs.',
    abil:['Dual bone blades: flurries, thrusts and leaps','Bone Whirl: cuts all the way round when surrounded']},
  bomber:{role:'Explosives',desc:'A goggled imp with a barrel of hellfire bombs strapped to its back. It lobs bombs over the enemy line that blast and burn whole groups, and it goes off one last time when it dies.',
    abil:['Lobbed, rolled and cluster bombs that blast and burn','Explodes when it dies','Bashes and kicks when cornered']},
  oracle:{role:'Healer and hexer',desc:'A blindfolded seer whose third eye never closes. The Fallen Oracle mends the wounds of the Chaos army from afar, hexes the enemy so they take more damage, and strikes with bolts of void light.',
    abil:['Dark Mending: heals the most wounded ally','Mass Mending: heals everyone nearby','Hex: cursed enemies take 25% more damage','Void Bolt and Eye of the Abyss']},
  reaper:{role:'Elite reaper',desc:'Death itself, hooded and robed, with a great scythe. The Grim Reaper reaps whole ranks in wide arcs, drinks a quarter of every cut as life, and steps through shadow to appear behind its prey.',
    abil:['Reaping arcs that hit everything in front','Life Drain: heals 25% of the damage it deals','Shadow Step: vanishes and reappears behind its target']},
  hound:{role:'Pack runner',desc:'A lean demon dog of cracked lava rock with a mane of flame and a burning tail. Hellhounds are the fastest thing in the Chaos army and run in packs, pouncing on stragglers and frenzying together on a kill.',
    abil:['Fastest unit in the army','Pounce and Pack Frenzy, like the Hellcrawler','Knocks light troops flat']},
  cerberus:{role:'Three-headed guardian',desc:'The great hound that guards the gates of the underworld. Three heads, three sets of jaws: its bites set flesh alight, and all three heads breathe fire together.',
    abil:['Triple Flame: all three heads breathe a cone of fire','Burning bites: every bite sets the target on fire','Big and tough: holds the line like a beast of war']},
  knight:{role:'Heavy cavalry',desc:'An armoured knight on a barded warhorse, lance couched and pennon flying. Knights are the fastest thing the Order fields: they sweep round the flanks and ride down archers and casters. Keep them away from Spartans: a braced spear stops a charge dead.',
    abil:['Lance thrusts from the saddle between the horse\'s blows','Runs down archers and casters: 60% more damage to them','Trample: leaps onto a target from a few strides out','Weak to spears: Spartans deal 80% more and halt the charge']},
  hades:{role:'Lord of the Underworld',desc:'The master of the Chaos Empire walks the field himself: a towering lord in bronze plate, crowned in fire, with a burning bident. Whoever stands near him burns, and his slams set the ground alight.',
    abil:['Burning aura: sets nearby enemies on fire','Hellfire Slam and Stomp: a ring of fire','Wave of Flame: burns everything in a cone','Every blow sets the target on fire']},
};
const VW={u:null,spin:true,idleI:-1,h:1.1};
const vwEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function viewerInfo(t){
  const T=TYPES[t], I=UNIT_INFO[t]||{role:'',desc:'',abil:[]}, chaos=!!T.chaos, box=$('#viewer'); if(!box) return;
  box.classList.toggle('chaos',chaos);
  $('#vwFac').textContent=chaos?'Chaos Empire':'Order Empire';
  $('#vwName').textContent=T.name; $('#vwRole').textContent=I.role; $('#vwDesc').textContent=I.desc;
  const mana=(typeof MANA_COST!=='undefined'&&MANA_COST[t])||0, cur=chaos?'souls':'gold';
  const rows=[['Health',T.hp,Math.min(1,T.hp/400),T.hp>400?T.hp+'':T.hp],['Damage',T.dmg,Math.min(1,T.dmg/60),T.dmg],['Speed',T.speed,Math.min(1,T.speed/6),T.speed.toFixed(1)],
    ['Range',T.range,Math.min(1,T.range/12),T.range>2?T.range.toFixed(0)+' m':'Melee']];
  if(T.armor) rows.push(['Armour',T.armor,Math.min(1,T.armor/.5),Math.round(T.armor*100)+'%']);
  $('#vwStats').innerHTML=rows.map(([l,,k,v])=>'<span>'+l+'</span><span class="bar"><i style="width:'+Math.round(Math.max(.04,k)*100)+'%"></i></span><b>'+vwEsc(v)+'</b>').join('')
    +'<span>Cost</span><span></span><b>'+T.cost+' '+cur+(mana?' · '+mana+' mana':'')+'</b>';
  const abil=(I.abil||[]).slice(); if(chaos) abil.push('Infernal Regeneration: heals itself after a few seconds unhurt');
  $('#vwAbil').innerHTML=abil.map(a=>'<li>'+vwEsc(a)+'</li>').join('');
  const n=x=>x?x.length:0, moves=new Set(T.attacks||[]).size;
  $('#vwCount').textContent=n(IDLES[t])+' idles · '+moves+' moves · '+n(FINS[t])+' finishers · '+n(CHG[t])+' charges';
}
function resetViewer(){
  clearAll(); ensureCastles(); syncTeamNames(); setupStatues(); resetCastles(); closePanel(); game.duel=null;
  const ty=game.duelSel||'sword', u=spawn(ty,0,DUEL_X,DUEL_Z); u.ai=false;
  u.face=u.faceGoal=.35; const f=new V3(Math.sin(u.face),0,Math.cos(u.face)), r=new V3(f.z,0,-f.x);
  u.feet.forEach((ft,i)=>{ const sd=i?1:-1; ft.pos.set(u.pos.x+r.x*sd*.13*u.s,0,u.pos.z+r.z*sd*.13*u.s); ft.pos.y=H(ft.pos.x,ft.pos.z); });
  if(u.fl) flyInstant(u); if(u.cr) crPlace(u);
  VW.u=u; VW.idleI=-1; VW.home=u.pos.clone(); VW.h=ty==='wing'?2.3:ty==='giant'?2.3:u.T.crawler?.75*u.s:1.05*u.s;
  const big=u.s>1.5&&ty!=='giant'&&!u.T.crawler;
  cam.follow=null; cam.goal.set(u.pos.x,H(u.pos.x,u.pos.z)+VW.h,u.pos.z);
  cam.dGoal=ty==='giant'?10:big?4.9*u.s:ty==='wing'?8:u.T.crawler?5.4*Math.max(1,u.s):ty==='dread'||ty==='reaper'?5.6:4.8; cam.pitch=.14;
  cam.target.copy(cam.goal); cam.dist=cam.dGoal;   // open straight on the unit, no long pan from wherever the camera was
  viewerInfo(ty); syncViewerButtons();
}
function viewerCamera(rdt){
  const u=VW.u; if(!u) return; const p=u.rag?u.j.pelvis:u.pos;
  cam.goal.set(p.x,H(p.x,p.z)+VW.h,p.z);
  // keep the unit clear of the info panel: left of centre on wide screens, lower on narrow ones
  if(window.innerWidth>700){ const k=cam.dist*.17; cam.goal.x+=Math.cos(cam.yaw)*k; cam.goal.z-=Math.sin(cam.yaw)*k; }
  else cam.goal.y+=cam.dist*.07;
  if(VW.spin) cam.yaw+=rdt*.22;
}
function viewerDo(kind){
  const u=VW.u; if(!u||!u.alive) return;
  if(kind==='idle'){ if(u.action&&!u.action.c.idle) return; const L=IDLES[u.type]; if(!L||!L.length) return; VW.idleI=(VW.idleI+1)%L.length;
    u.script=null; play(u,L[VW.idleI]); showBanner(IDLE_NAMES[L[VW.idleI].replace(/^idle_/,'')]||'Idle',u.T.name+' · idle '+(VW.idleI+1)+' of '+L.length,1.1); return; }
  if(kind==='walk'){ const h=VW.home, R=2.2*Math.sqrt(u.s), pts=[]; for(let i=1;i<=8;i++){ const a=i/8*Math.PI*2; pts.push(new V3(h.x+Math.sin(a)*R,0,h.z-R+Math.cos(a)*R)); }
    pts.push(h.clone()); u.action=null; u.script={pts,i:0,speed:u.T.speed*.45,then:uu=>{ uu.faceGoal=.35; }}; return; }
  if(kind==='spin'){ VW.spin=!VW.spin; syncViewerButtons(); return; }
}
function syncViewerButtons(){ const b=$('#vSpin'); if(b) b.textContent='Turntable: '+(VW.spin?'On':'Off'); }
$('#vIdle').onclick=()=>{ sfx('ui'); viewerDo('idle'); };
$('#vWalk').onclick=()=>{ sfx('ui'); viewerDo('walk'); };
$('#vSpin').onclick=()=>{ sfx('ui'); viewerDo('spin'); };
$('#vLab').onclick=()=>{ sfx('ui'); setMode('duel'); };
