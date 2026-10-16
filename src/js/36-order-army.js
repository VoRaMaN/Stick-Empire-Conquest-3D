/* ---------- the four new Order units join the army: regiments, formation blocks, names ---------- */
Object.assign(REG_SIZE,{ninja:8,cleric:6,wizard:6,wing:6});
Object.assign(FORM,{ninja:{cols:4,gap:1.3,depth:1.35},cleric:{cols:3,gap:1.5,depth:1.5},wizard:{cols:3,gap:1.6,depth:1.6},wing:{cols:3,gap:3.6,depth:3.2}});
// front to back: Spartans, swordsmen, ninjas, giants, archers, wizards, clerics; wing archers fly over the rear
FORM_ORDER.length=0; FORM_ORDER.push('spear','sword','ninja','giant','archer','wizard','cleric','wing');
Object.assign(TYPE_PL,{ninja:'Ninjas',cleric:'Clerics',wizard:'Wizards',wing:'Wing Archers'});
Object.assign(AIMW,{wizard:{tip:.7,hit:.7,blade:[-.9,.65],pommel:-.9,r:.04},cleric:{tip:.72,hit:.72,blade:[-.9,.65],pommel:-.9,r:.04},
  ninja:{tip:1.05,hit:1.0,blade:[.3,1.02],pommel:-.15,r:0},wing:{tip:.42,hit:.42,blade:[-.15,.42],pommel:-.18,r:.04}});
