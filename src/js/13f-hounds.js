/* ================= Hellhound and Cerberus: the Hellcrawler's four-legged rig with a canine build =================
   They share the Hellcrawler's skeleton, gait, clips and finishers; 27d gives them their own heads (long snouts,
   pointed ears, flaming manes), paws, low tails with a burning tip, and Cerberus its three heads. Hellhounds run in
   packs; Cerberus is a great three-headed guardian whose bites burn and who breathes fire. */
Object.assign(TYPES,{
  hound:{name:'Hellhound',engage:1.9,reach:1.15,s:.82,hp:95,dmg:13,range:1.2,speed:6.4,cd:.5,cost:100,thick:1,turn:9,acc:8,
    crawler:true,hound:true,gearX:true,swarm:true,armReach:.95,chaos:true,tailLow:-.85,tailL:.62,foreW:.5,hindW:.85,body:[new THREE.Color('#2a1d19'),new THREE.Color('#2a1d19')]},
  cerberus:{name:'Cerberus',engage:2.7,reach:1.9,s:1.6,hp:480,dmg:38,range:1.95,speed:4.8,cd:.85,cost:220,thick:1,turn:6,acc:6,armor:.12,
    crawler:true,hound:true,heads:3,gearX:true,armReach:.95,chaos:true,tailLow:-.85,tailL:.7,foreW:.5,hindW:.85,body:[new THREE.Color('#2a1d19'),new THREE.Color('#2a1d19')]},
});
for(const t of ['hound','cerberus']){ RAW[t]=Object.assign({},RAW.crawler); POSES[t]=POSES.crawler; IDLES[t]=IDLES.crawler.slice(); CHG[t]=CHG.crawler;
  TYPES[t].attacks=TYPES.crawler.attacks.slice(); if(ATK_AIM_X.crawler) ATK_AIM_X[t]=ATK_AIM_X.crawler; if(DEF_ODDS.crawler) DEF_ODDS[t]=DEF_ODDS.crawler; }
FINS.hound=FINS.crawler.slice();
// Cerberus is half again as big: its finishers start from further out
FINS.cerberus=FINS.crawler.map(n=>{ const d=FIN[n], k='cb_'+n; FIN[k]=Object.assign({},d,{contact:d.contact*1.5}); return k; });
RAW.cerberus.cbBreath={keys:RAW.crawler.crBite.keys,ev:[{t:.28,e:'cerbFlame'}]}; TYPES.cerberus.attacks.push('cbBreath');
MOVE_NAMES.cbBreath='Triple Flame';
