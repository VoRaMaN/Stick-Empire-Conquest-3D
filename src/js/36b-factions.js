/* ================= Factions: the Order Empire and the Chaos Empire =================
   Each army belongs to a faction: its roster (the dock and the general buy from it), its worker, its castle,
   its wall garrison, its statue, its currency and its name. You pick your side on the title screen and the
   enemy fields the other. The training is Order against Order, and so is the classic regression battle.
   Chaos prices are low (the unit sheet) and its economy is scaled to match: souls come in at ECON of the
   rate gold does, so a Chaos army of equal worth fields about as many soldiers as an Order one. */
const FACTIONS={
  order:{id:'order',name:'Order Empire',roster:ORDER,worker:'miner',garrison:'archer',garrisonAtk:'shoot',statue:'sword',money:'gold',
    team:['Gold Legion','Crimson Horde'],cap:['Sparta Hills','Crimson Keep'],
    start:['miner','miner','sword','sword','sword','archer','archer','spear'],
    mix:['sword','spear','sword','archer','ninja','spear','sword','archer','wizard','sword','spear','archer','cleric','sword','ninja','giant','wing','spear','archer','sword']},
  chaos:{id:'chaos',name:'Chaos Empire',roster:CHAOS,worker:'thrall',garrison:'harvester',garrisonAtk:'soulBolt',statue:'dread',money:'souls',
    team:['Infernal Dominion','Chaos Empire'],cap:['Hellmouth Caldera','Infernal Gate'],
    start:['thrall','thrall','crawler','crawler','crawler','harvester','harvester','dread'],
    mix:['crawler','dread','crawler','harvester','boner','crawler','dread','bomber','crawler','harvester','boner','dread','oracle','crawler','reaper','boner','harvester','bomber','dread','crawler','hades','harvester','boner','reaper','hound','hound','cerberus','hound']},
};
const ECON={order:1,chaos:.42};
const facOf=t=>game.classicMix?'order':(game.fac[t]||'order');
const FAC=t=>FACTIONS[facOf(t)];
const econ=t=>ECON[facOf(t)];
const teamName=t=>FAC(t).team[t];
const money=t=>FAC(t).money;
const otherSide=f=>f==='chaos'?'order':'chaos';
// your side from the title screen; the enemy is the other faction
function setFactions(f0,f1){ game.fac=[f0||'order',f1||otherSide(f0||'order')]; }
setFactions(settings.side==='chaos'?'chaos':'order');
// a starting army: the faction's opening eight (Normal) or its pattern, with a few more Chaos soldiers in the
// big battles (they are cheaper; the extra numbers make up for an army with no giants yet)
function factionStart(t,n){
  const F=FAC(t); if(n<=8) return F.start.slice();
  const out=[F.worker,F.worker,F.worker,F.worker], m=F.id==='chaos'?Math.min(POP_CAP,Math.round(n*1.25)):n;
  for(let i=0;out.length<m;i++) out.push(F.mix[i%F.mix.length]); return out; }
// the general's shopping list: a few workers, then the faction's fighting mix
function factionPick(t){
  const F=FAC(t);
  if(F.id==='chaos'){ const r=Math.random(); return r<.22?'crawler':r<.33?'hound':r<.47?'dread':r<.57?'harvester':r<.67?'boner':r<.75?'bomber':r<.82?'oracle':r<.89?'reaper':r<.96?'cerberus':'hades'; }
  const r=Math.random(); return r<.3?'sword':r<.48?'archer':r<.62?'spear':r<.72?'ninja':r<.8?'wizard':r<.87?'cleric':r<.94?'wing':'giant';
}
function syncTeamNames(){
  for(const [id,t] of [['#nA',0],['#nB',1]]){ const el=$(id); if(el) el.textContent=teamName(t); }
  for(const [id,t] of [['#cuA',0],['#cuB',1]]){ const el=$(id); if(el) el.textContent=money(t); }
  const tl=$('#tagline'); if(tl) tl.textContent=facOf(0)==='chaos'?'Lead the Infernal Dominion. Burn the Order.':'Command the Gold Legion. Break the Chaos Empire.';
}

/* ---------- Chaos regiments, formations and weapon contact points ---------- */
Object.assign(REG_SIZE,{dread:10,harvester:8,boner:12,bomber:8,oracle:6,reaper:6,hades:1,hound:12,cerberus:2});
Object.assign(FORM,{dread:{cols:5,gap:1.5,depth:1.6},harvester:{cols:4,gap:1.45,depth:1.5},boner:{cols:6,gap:1.3,depth:1.4},bomber:{cols:4,gap:1.45,depth:1.5},oracle:{cols:3,gap:1.5,depth:1.5},reaper:{cols:3,gap:1.7,depth:1.7},hades:{cols:1,gap:3.5,depth:3},hound:{cols:6,gap:1.3,depth:1.8},cerberus:{cols:2,gap:3,depth:3}});
FORM_ORDER.unshift('hound','cerberus','hades','dread','reaper','boner'); { const i=FORM_ORDER.indexOf('archer'); FORM_ORDER.splice(i+1,0,'harvester','bomber','oracle'); }
Object.assign(TYPE_PL,{thrall:'Thralls',dread:'Dreadguards',harvester:'Soul Harvesters',boner:'Bone Reavers',bomber:'Infernal Bombers',oracle:'Fallen Oracles',reaper:'Grim Reapers',hades:'Hades',hound:'Hellhounds',cerberus:'Cerberus'});
Object.assign(AIMW,{thrall:{tip:.62,hit:.62,blade:[.2,.7],pommel:-.12,r:.03},dread:{tip:1.18,hit:1.18,blade:[.62,1.08],pommel:-.55,r:.1},
  harvester:{tip:1.18,hit:1.18,blade:[.85,1.18],pommel:-.55,r:.04},
  boner:{tip:.64,hit:.62,blade:[.3,.64],pommel:-.1,r:.03},bomber:{tip:.1,hit:.1,blade:[0,.12],pommel:-.05,r:.11},oracle:{tip:.95,hit:.95,blade:[.7,.95],pommel:-.7,r:.07},
  reaper:{tip:1.5,hit:1.45,blade:[1.1,1.5],pommel:-.7,r:.05},hades:{tip:1.85,hit:1.8,blade:[1.4,1.85],pommel:-.95,r:.06}});
