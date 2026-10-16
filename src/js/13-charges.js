/* ---------- charges: 10 per unit ----------
   Each charge is how the soldier carries his weapon at a full sprint (run) and the blow he lands when he
   crashes into the enemy (keys/ev). The strike starts from the run pose, so the run flows straight into it. */
const CHG={sword:[],spear:[],giant:[],miner:[],archer:[]};
function chg(type,id,name,run,keys,ev,o){ CHG[type].push(Object.assign({id,name,run,keys:[Object.assign({t:0},run)].concat(keys),ev},o||{})); }
const HIT=(t,aim,o)=>Object.assign({t,e:'hit',aim},o);
// --- Swordsman
chg('sword','overhead','Overhead Charge',{R:[.18,.5,-.12],wR:[.02,.55,-.83],pR:[.5,.6,.5],L:[-.28,-.1,.2]},
  [{t:.1,R:[.18,.56,-.2],wR:[.02,.3,-.95],jump:.35,lean:-.15,fwd:.2},{t:.22,e:'o',R:[.2,-.08,.56],wR:[.03,-.55,.83],pR:null,lean:.55,crouch:.25,jump:0,fwd:.6},{t:.4,R:[.22,-.32,.42],wR:[.02,-.9,.4]},R_(.85)],
  [HIT(.22,['blade','neck'],{dmg:1.5,kb:2.6}),{t:.22,e:'land'}]);
chg('sword','lance','Lance Point',{R:[.14,-.02,.52],wR:[0,.06,1],L:[-.3,-.05,.1],twist:.1},
  [{t:.1,R:[.2,-.05,.2],wR:[0,.05,1],twist:-.3,lean:.2},{t:.2,e:'o',R:[.12,-.02,.64],wR:[0,.04,1],twist:.4,lean:.55,crouch:.25,fwd:.8},{t:.42,R:[.16,0,.5]},R_(.85)],
  [HIT(.2,['tip','chest'],{dmg:1.4,kb:2.4})]);
chg('sword','trail','Blade Trail',{R:[.36,-.34,-.22],wR:[.25,-.55,-.8],L:[-.26,0,.25],lean:.1},
  [{t:.12,R:[.3,-.42,.1],wR:[.1,-.8,.55],crouch:.25,lean:.35,fwd:.25},{t:.24,e:'o',R:[.12,.42,.42],wR:[-.1,.92,.35],pR:[.5,-.3,.2],crouch:0,lean:-.1,jump:.15,fwd:.6},{t:.4,R:[.15,.5,.15],wR:[0,.95,-.3],jump:0},R_(.85)],
  [HIT(.24,['blade','chest'],{dmg:1.3,kb:2,up:3})]);
chg('sword','shoulder','Shoulder Carry',{R:[.2,.28,-.04],wR:[.05,.55,-.83],L:[-.26,-.08,.22]},
  [{t:.1,R:[.25,.48,-.15],wR:[.3,.5,-.8],twist:-.3},{t:.21,e:'o',R:[-.08,-.12,.5],wR:[-.6,-.55,.58],twist:.45,lean:.5,crouch:.2,fwd:.55},{t:.4,R:[-.12,-.3,.35],wR:[-.6,-.75,.2]},R_(.85)],
  [HIT(.21,['blade','neck'],{dmg:1.4,kb:2.2})]);
chg('sword','flank','Side Sweep',{R:[.46,-.04,.06],wR:[.95,.08,.25],L:[-.26,-.05,.2],twist:-.2},
  [{t:.1,R:[.48,0,-.12],wR:[.6,.1,-.8],twist:-.5},{t:.22,e:'o',R:[-.1,0,.55],wR:[-.85,0,.5],twist:.5,lean:.35,fwd:.55},{t:.4,R:[-.25,.05,.35],wR:[-.8,.1,-.5],twist:.6},R_(.9)],
  [HIT(.22,['blade','chest'],{dmg:1.35,kb:2.4})]);
chg('sword','brandish','Brandish',{R:[.15,.5,.05],wR:[0,.3,1],L:[-.27,-.1,.2]},
  [{t:.06,R:[.4,-.1,.2],wR:[.85,.1,.5],crouch:.15},{t:.12,yaw:-.5},{t:.44,e:'l',yaw:6.28,R:[.56,.08,.12],wR:[1,.1,.1],fwd:.5},{t:.6,R:[.4,-.2,.3],wR:[.7,-.4,.55]},R_(1.0,{yaw:6.28})],
  [HIT(.4,['blade','chest'],{arc:1,dmg:1.2,kb:2.4})],{anim:(w,r)=>({R:r.R,wR:[Math.cos(w*9),.3,Math.sin(w*9)]})});
chg('sword','lowguard','Low Guard',{R:[.18,-.28,.36],wR:[0,.25,.97],L:[-.24,-.2,.3],lean:.18,crouch:.12},
  [{t:.1,crouch:.35,lean:.35},{t:.24,e:'o',R:[.14,.25,.55],wR:[0,.55,.83],crouch:0,jump:.5,lean:-.05,fwd:.7},{t:.36,jump:.3},{t:.5,e:'i',jump:0,crouch:.25},R_(.95)],
  [HIT(.24,['tip','chest'],{dmg:1.4,kb:2.6,up:3}),{t:.5,e:'land'}]);
chg('sword','twohand','Two-Hand Rush',{R:[.08,-.06,.3],wR:[0,.9,.4],L:[-.02,-.1,.3],lean:.08},
  [{t:.1,R:[.08,.52,-.1],wR:[0,.5,-.86],L:[-.02,.48,-.1],pR:[.5,.5,.5],lean:-.2},{t:.22,e:'o',R:[.08,-.12,.5],wR:[0,-.6,.8],L:[-.02,-.15,.48],pR:null,lean:.6,crouch:.3,fwd:.55},{t:.42,R:[.08,-.3,.4],wR:[0,-.9,.4],L:[-.02,-.32,.38]},R_(.9)],
  [HIT(.22,['blade','head'],{dmg:1.6,kb:2.8})]);
chg('sword','armwide','Wide Arms',{R:[.4,.12,-.28],wR:[.45,.35,-.82],L:[-.42,.05,.12],twist:-.25},
  [{t:.1,R:[.45,.2,-.3],wR:[.6,.3,-.75],twist:-.45},{t:.21,e:'o',R:[-.15,.08,.5],wR:[-.8,-.25,.55],twist:.5,lean:.4,fwd:.5},{t:.4,R:[-.25,-.1,.3],wR:[-.75,-.5,-.3]},R_(.9)],
  [HIT(.21,['blade','neck'],{dmg:1.35,kb:2.3})]);
chg('sword','flykick','Flying Kick',{R:[.25,-.32,.05],wR:[.1,-.2,1],L:[-.28,-.1,.2]},
  [{t:.1,crouch:.3,lean:.2},{t:.25,e:'o',jump:.9,kick:1,lean:-.4,crouch:0,fwd:.8,L:[-.35,.15,-.05]},{t:.4,jump:.4,kick:.4},{t:.55,e:'i',jump:0,kick:0,crouch:.3,fwd:.9},R_(1.0)],
  [HIT(.25,['foot','chest'],{dmg:.9,kb:3.6}),{t:.55,e:'land'}]);
// --- Spartan
chg('spear','levelled','Levelled Spear',{R:[.2,.24,-.1],wR:[0,.05,1],L:[-.17,-.05,.34]},
  [{t:.1,...SP.HW,twist:-.3},{t:.22,e:'o',...SP.HH,lean:.45,twist:.3,fwd:.6},{t:.42,R:[.14,.24,.4]},R_(.85)],
  [HIT(.22,['tip','chest'],{dmg:1.4,kb:2.4})]);
chg('spear','lowspear','Low Spear',{R:[.22,-.32,-.05],wR:[0,.28,.96],L:[-.17,-.08,.34],lean:.1},
  [{t:.1,...SP.LW,crouch:.25},{t:.22,e:'o',R:[.14,-.18,.5],wR:[0,.3,.95],crouch:.18,lean:.4,fwd:.6},{t:.42,R:[.16,-.1,.4]},R_(.85)],
  [HIT(.22,['tip','chest'],{dmg:1.3,kb:2.2,up:2})]);
chg('spear','shieldrush','Shield Rush',{L:[-.06,.02,.48],wL:[0,0,1],R:[.24,.3,-.32],wR:[0,.12,1],lean:.2},
  [{t:.1,...SP.WIND,lean:.15,twist:.3},{t:.2,e:'o',L:[-.06,.08,.62],twist:-.4,lean:.5,fwd:.7},{t:.4,...SP.REST,twist:0},R_(.85)],
  [HIT(.2,['hL','chest'],{dmg:.9,kb:4.2})]);
chg('spear','javelin','Javelin Arm',{R:[.22,.46,-.3],wR:[0,.32,.95],L:[-.17,-.05,.34]},
  [{t:.1,R:[.22,.55,-.4],wR:[0,.4,.92],lean:-.1},{t:.22,e:'o',R:[.15,.05,.5],wR:[0,-.55,.83],lean:.55,crouch:.25,fwd:.55},{t:.42,R:[.16,-.05,.4]},R_(.9)],
  [HIT(.22,['tip','neck'],{dmg:1.5,kb:2.2})]);
chg('spear','hoplite','Hoplite Crouch',{L:[-.15,-.04,.36],R:[.2,.2,-.15],wR:[0,.08,1],crouch:.18,lean:.12},
  [{t:.18,e:'o',...SP.BASH,lean:.4,fwd:.35},{t:.34,...SP.REST,...SP.HW,lean:.1},{t:.48,e:'o',...SP.HH,lean:.45,fwd:.55},{t:.66},R_(1.05)],
  [HIT(.18,['hL','chest'],{dmg:.5,kb:2.2}),HIT(.48,['tip','chest'],{dmg:1.2,kb:2})]);
chg('spear','spin','Spinning Spear',{R:[.16,.56,.1],wR:[1,0,0],L:[-.17,-.05,.34]},
  [{t:.06,R:[.4,-.05,.1],wR:[.9,0,.4],crouch:.18},{t:.12,yaw:-.5},{t:.46,e:'l',yaw:6.28,R:[.5,-.05,.15],wR:[1,0,.15],fwd:.4},{t:.62},R_(1.05,{yaw:6.28})],
  [HIT(.42,['blade','chest'],{arc:1,dmg:1.1,kb:2.4})],{anim:(w,r)=>({R:r.R,wR:[Math.cos(w*8),0,Math.sin(w*8)]})});
chg('spear','vault','Vaulting Kick',{R:[.24,-.2,.3],wR:[0,-.4,.9],L:[-.17,-.06,.34]},
  [{t:.12,crouch:.35},{t:.32,e:'o',jump:1.1,kick:1,R:[.15,-.35,.15],wR:[0,-.95,.2],lean:-.35,fwd:.7,crouch:0},{t:.48,jump:.4,kick:.4},{t:.65,e:'i',jump:0,kick:0,crouch:.35,fwd:.85},R_(1.1)],
  [HIT(.32,['foot','chest'],{dmg:.9,kb:4}),{t:.65,e:'land'}]);
chg('spear','slam','Spear Slam',{R:[.18,.5,.1],wR:[0,1,.12],L:[-.17,-.05,.34]},
  [{t:.12,R:[.15,.56,-.15],wR:[0,.5,-.85],pR:[.5,.5,.6],lean:-.25},{t:.26,e:'o',R:[.15,-.05,.5],wR:[0,-.6,.8],pR:null,lean:.55,crouch:.28,fwd:.5},{t:.45},R_(.95)],
  [HIT(.26,['blade','neck'],{dmg:1.3,kb:2.2})]);
chg('spear','warcry','War Cry',{R:[.24,.52,-.05],wR:[0,.95,.3],L:[-.2,.3,.25],wL:[0,.3,1]},
  [{t:.1,...SP.HW,...SP.REST},{t:.2,e:'o',...SP.HH,lean:.35,fwd:.4},{t:.32,...SP.HW},{t:.44,e:'o',...SP.HH,lean:.45,fwd:.6},{t:.6},R_(1.0)],
  [HIT(.2,['tip','chest'],{dmg:.8,kb:1.4}),HIT(.44,['tip','chest'],{dmg:1,kb:2.4})]);
chg('spear','skewer','Skewer Run',{R:[.14,-.05,.45],wR:[0,0,1],L:[-.17,-.08,.34],lean:.25},
  [{t:.1,R:[.2,-.05,.15],twist:-.3},{t:.24,e:'o',R:[.12,0,.62],wR:[0,0,1],lean:.55,twist:.3,crouch:.2,fwd:1.0},{t:.45,R:[.14,.05,.5]},R_(.95)],
  [HIT(.24,['tip','gut'],{dmg:1.6,kb:3})]);
// --- Giant
chg('giant','drag','Club Drag',{R:[.42,-.45,.15],wR:[.25,-.9,.35],lean:.2},
  [{t:.2,R:[.45,-.4,-.1],wR:[.4,-.6,-.7],twist:-.4,crouch:.15},{t:.45,e:'o',R:[-.15,.1,.5],wR:[-.85,.2,.45],twist:.5,lean:.3,fwd:.4},{t:.7,R:[-.3,.2,.3],wR:[-.9,.3,-.2]},R_(1.3)],
  [HIT(.45,['blade','chest'],{arc:1,dmg:1.2,kb:3.6})]);
chg('giant','overhead','Overhead Club',{...GI.UP,lean:-.05},
  [{t:.25,...GI.UP,lean:-.3,crouch:.05},{t:.5,e:'o',...GI.SMASH,lean:.65,crouch:.35,fwd:.4},{t:.8},R_(1.4)],
  [HIT(.5,['blade','head'],{aoe:1,dmg:1.3,kb:3.8})]);
chg('giant','barge','Shoulder Barge',{R:[.3,-.35,.15],wR:[.15,-.55,.8],L:[-.3,-.3,.15],lean:.4,twist:.25},
  [{t:.15,lean:.55,twist:.4,crouch:.15},{t:.32,e:'o',lean:.6,twist:.5,fwd:.8,crouch:.2},{t:.55,lean:.1,twist:0},R_(1.1)],
  [HIT(.32,['shoulder','head'],{arc:1,dmg:.8,kb:5})]);
chg('giant','ram','Battering Ram',{R:[.2,0,.45],wR:[0,.12,1],L:[-.05,-.05,.42],lean:.2},
  [{t:.18,R:[.22,0,.15],L:[-.05,-.05,.15],lean:.05},{t:.36,e:'o',R:[.2,0,.6],wR:[0,.08,1],L:[-.05,-.02,.55],lean:.45,fwd:.6},{t:.6},R_(1.2)],
  [HIT(.36,['tip','chest'],{single:1,dmg:1.1,kb:4.5})]);
chg('giant','wide','Wide Swing',{R:[.55,-.05,.1],wR:[.95,.05,.3],L:[-.3,-.3,.15],twist:-.25},
  [{t:.2,R:[.55,0,-.2],wR:[.6,.1,-.8],twist:-.6},{t:.45,e:'o',R:[-.1,-.05,.5],wR:[-.9,0,.4],twist:.6,lean:.35,crouch:.2,fwd:.35},{t:.7,R:[-.3,0,.3],wR:[-.9,0,-.3],twist:.8},R_(1.35)],
  [HIT(.45,['blade','chest'],{arc:1.3,dmg:1.1,kb:3.8})]);
chg('giant','stampede','Stampede',{R:[.35,-.35,.2],wR:[.2,-.6,.75],L:[-.35,-.3,.2],lean:.15},
  [{t:.2,kick:.85,lean:-.2,L:[-.4,0,.1],fwd:.3},{t:.4,e:'o',kick:0,crouch:.3,lean:.25,fwd:.45},{t:.6},R_(1.1)],
  [{t:.4,e:'hit',aoe:.9,stomp:1,dmg:.8,kb:4.2}]);
chg('giant','hammer','Double Hammer',{R:[.12,.4,.2],wR:[0,.9,.4],L:[-.1,.4,.2],lean:.05},
  [{t:.22,R:[.12,.6,-.15],wR:[0,.6,-.8],L:[-.1,.6,-.15],lean:-.3},{t:.46,e:'o',R:[.1,-.25,.55],wR:[0,-.5,.86],L:[-.08,-.25,.52],lean:.7,crouch:.35,fwd:.4},{t:.75},R_(1.35)],
  [HIT(.46,['blade','head'],{aoe:1,dmg:1.4,kb:4})]);
chg('giant','roar','Roaring Charge',{R:[.5,.15,.1],wR:[.6,.7,.3],L:[-.5,.15,.12],lean:-.05},
  [{t:.2,R:[.25,-.45,-.25],wR:[.1,-.6,-.8],crouch:.35,lean:.3},{t:.42,e:'o',R:[.15,.45,.4],wR:[0,.95,.3],crouch:.05,lean:-.15,fwd:.35},{t:.65,R:[.15,.5,.15],wR:[0,.9,-.4],lean:-.3},R_(1.3)],
  [HIT(.42,['blade','gut'],{single:1,dmg:1.1,kb:2,up:6})]);
chg('giant','leap','Leaping Crush',{R:[.3,.2,0],wR:[.3,.9,-.2],crouch:.15,lean:.2},
  [{t:.15,crouch:.4},{t:.35,jump:1.1,...GI.UP,crouch:0,lean:-.2,fwd:.5},{t:.55,e:'o',jump:0,...GI.SMASH,lean:.65,crouch:.4,fwd:.8},{t:.8},R_(1.4)],
  [HIT(.55,['blade','head'],{aoe:1.3,dmg:1.4,kb:4}),{t:.55,e:'land'}]);
chg('giant','grab','Grabbing Charge',{L:[-.1,0,.55],R:[.4,-.3,.1],wR:[.4,-.7,.55],lean:.25},
  [{t:.2,e:'o',L:[-.1,-.1,.62],lean:.4,fwd:.35},{t:.35,L:[-.4,0,.2]},{t:.55,e:'o',R:[-.1,-.05,.5],wR:[-.9,0,.4],twist:.6,lean:.35,fwd:.25},{t:.8},R_(1.35)],
  [HIT(.2,['hL','chest'],{single:1,dmg:.4,kb:1.5}),HIT(.55,['blade','chest'],{arc:1,dmg:1,kb:4})]);
// --- Miner
chg('miner','raised','Pick Raised',{...MI.UP,L:[-.26,-.08,.22]},
  [{t:.1,crouch:.3},{t:.22,e:'o',jump:.5,...MI.UP,crouch:0,lean:-.2,fwd:.4},{t:.36,e:'o',jump:0,...MI.CHOP,lean:.6,crouch:.2,fwd:.7},{t:.5},R_(.95)],
  [HIT(.36,['pick','head'],{dmg:1.4,kb:2.2}),{t:.36,e:'land'}]);
chg('miner','forward','Pick Forward',{R:[.14,0,.5],wR:[0,-.1,1],L:[-.26,-.08,.22]},
  [{t:.1,R:[.18,0,.2],twist:-.3},{t:.2,e:'o',R:[.14,.02,.6],wR:[0,-.15,1],twist:.3,lean:.45,fwd:.55},{t:.4},R_(.8)],
  [HIT(.2,['pick','chest'],{dmg:1.1,kb:2})]);
chg('miner','drag','Pick Drag',{R:[.22,-.38,-.15],wR:[.1,-.85,-.45],lean:.15},
  [{t:.12,R:[.2,-.35,.25],wR:[0,-.4,.9],crouch:.25,lean:.35},{t:.24,e:'o',R:[.15,.35,.45],wR:[0,.8,.6],crouch:.05,lean:-.05,fwd:.5},{t:.42},R_(.85)],
  [HIT(.24,['pick','head'],{dmg:1.2,kb:1.8,up:3.5})]);
chg('miner','shoulder','Pick on Shoulder',{R:[.18,.3,-.04],wR:[.05,.55,-.83],L:[-.26,-.08,.22]},
  [{t:.1,R:[.4,0,-.1],wR:[.7,.3,-.6],twist:-.5},{t:.22,e:'o',R:[0,-.05,.5],wR:[-.85,0,.5],twist:.45,lean:.3,fwd:.5},{t:.4},R_(.85)],
  [HIT(.22,['pick','chest'],{dmg:1.2,kb:2.2})]);
chg('miner','headdown','Head Down',{R:[.25,-.3,.05],wR:[.1,-.5,.85],L:[-.25,-.3,.1],lean:.45},
  [{t:.1,lean:-.3,crouch:.1},{t:.22,e:'o',lean:.85,crouch:.2,fwd:.45},{t:.4,lean:.2},R_(.85)],
  [HIT(.22,['head','chest'],{dmg:.7,kb:2.8})]);
chg('miner','flail','Flailing Charge',{R:[.3,.3,.2],wR:[.3,.8,.5],L:[-.3,.3,.2]},
  [{t:.06,...MI.UP},{t:.16,e:'o',...MI.CHOP,lean:.5,crouch:.2,fwd:.3},{t:.3,...MI.UP,lean:-.2},{t:.42,e:'o',...MI.CHOP,lean:.55,crouch:.24,fwd:.5},{t:.58},R_(1.0)],
  [HIT(.16,['pick','head'],{dmg:.7,kb:1.2}),HIT(.42,['pick','chest'],{dmg:.9,kb:2.2})],
  {anim:(w,r)=>({R:[.3,.3+.14*Math.sin(w*11),.2],L:[-.3,.3+.14*Math.cos(w*11),.2],wR:[.3,.8*Math.cos(w*6),.5+.4*Math.sin(w*6)]})});
chg('miner','tackle','Tackle',{R:[.22,-.1,.35],wR:[.1,-.4,.9],L:[-.2,-.05,.38],lean:.35},
  [{t:.1,crouch:.2,lean:.4},{t:.24,e:'o',lean:.65,crouch:.15,fwd:.7,L:[-.15,0,.5]},{t:.42,lean:.15},R_(.9)],
  [HIT(.24,['shoulder','chest'],{dmg:.6,kb:3.4})]);
chg('miner','twirl','Pick Twirl',{R:[.28,-.18,.36],wR:[0,1,0]},
  [{t:.06,R:[.4,-.05,.1],wR:[.9,.05,.3],crouch:.15},{t:.12,yaw:-.5},{t:.44,e:'l',yaw:6.28,R:[.5,.05,.12],wR:[1,.1,.1],fwd:.3},{t:.58,R:[.3,-.1,.3]},R_(1.0,{yaw:6.28})],
  [HIT(.4,['pick','chest'],{arc:1,dmg:1,kb:2})],{anim:(w,r)=>({R:r.R,wR:[0,Math.cos(w*10),Math.sin(w*10)]})});
chg('miner','kick','Running Kick',{R:[.25,-.3,.1],wR:[.1,-.6,.8],L:[-.28,-.1,.2]},
  [{t:.1,crouch:.25},{t:.24,e:'o',jump:.7,kick:1,lean:-.4,crouch:0,fwd:.6,L:[-.35,.15,-.05]},{t:.38,jump:.3,kick:.4},{t:.5,e:'i',jump:0,kick:0,crouch:.3,fwd:.7},R_(.95)],
  [HIT(.24,['foot','chest'],{dmg:.7,kb:3.2}),{t:.5,e:'land'}]);
chg('miner','fist','Fist Up',{L:[-.12,.3,.3],R:[.25,-.3,.05],wR:[.1,-.6,.8],lean:.1},
  [{t:.1,L:[-.3,-.35,-.05],crouch:.25,twist:.5},{t:.2,e:'o',L:[-.06,.32,.5],twist:-.45,crouch:.05,lean:.1,fwd:.3},{t:.36,...MI.UP,twist:-.2},{t:.48,e:'o',...MI.CHOP,lean:.55,crouch:.25,fwd:.45},{t:.65},R_(1.1)],
  [HIT(.2,['hL','head'],{dmg:.5,kb:1.6,up:2}),HIT(.48,['pick','head'],{dmg:1,kb:2.2})]);
// --- Archer: a charge ends in a shot taken on the move
const ARC=(o)=>Object.assign({aim:1},o);
chg('archer','runshot','Running Shot',{L:[-.15,-.15,.45],wL:[0,-.2,1],R:[0,-.12,.38],twist:-.4},
  [{t:.06,...AR.NOCK},{t:.3,...AR.DRAW,fwd:.6},{t:.36,e:'o',...AR.REL,fwd:.75},{t:.55,fwd:.9},R_(.9)],[{t:.36,e:'fire',dmg:1.2}],ARC());
chg('archer','leap','Leaping Shot',{L:[-.25,.42,.15],wL:[0,.9,.3]},
  [{t:.06,crouch:.3},{t:.15,...AR.NOCK,jump:.8,crouch:0},{t:.38,...AR.DRAW,jump:1.0},{t:.44,e:'o',...AR.REL,jump:.8},{t:.62,e:'i',jump:0,crouch:.3},R_(1.0)],[{t:.44,e:'fire',dmg:1.3},{t:.62,e:'land'}],ARC());
chg('archer','slide','Slide Shot',{L:[-.2,-.02,.32],wL:[.9,.1,.4],R:[.15,-.05,.3],lean:.1},
  [{t:.06,...AR.NOCK,crouch:.4,lean:-.1,fwd:.5},{t:.32,...AR.DRAW,crouch:.45,fwd:.9},{t:.38,e:'o',...AR.REL,crouch:.42,fwd:1.0},{t:.6},R_(1.0)],[{t:.38,e:'fire',dmg:1.2}],ARC());
chg('archer','twin','Twin Arrows',{L:[-.18,.1,.42],wL:[0,.3,1],R:[.05,.1,.25],twist:-.5},
  [{t:.06,...AR.NOCK},{t:.32,...AR.DRAW},{t:.38,e:'o',...AR.REL},{t:.6},R_(.95)],[{t:.38,e:'fire',n:2,spread:.07,dmg:.85}],ARC());
chg('archer','fan','Fan Volley',{L:[-.15,.45,.15],wL:[0,.2,1],R:[.15,.45,.15]},
  [{t:.06,...AR.NOCK},{t:.38,...AR.DRAW},{t:.44,e:'o',...AR.REL},{t:.65},R_(1.0)],[{t:.44,e:'fire',n:3,spread:.12,dmg:.7}],ARC());
chg('archer','power','Power Shot',{L:[-.32,-.35,.05],wL:[0,-.9,.3]},
  [{t:.06,...AR.NOCK,crouch:.15},{t:.55,...AR.DRAW,lean:-.05},{t:.62,e:'o',...AR.REL},{t:.85},R_(1.2)],[{t:.62,e:'fire',power:1,dmg:1.8}],ARC());
chg('archer','kneel','Kneel & Loose',{L:[-.22,.3,-.05],wL:[0,.5,-.8]},
  [{t:.08,crouch:.42,...AR.NOCK},{t:.32,...AR.DRAW,crouch:.42},{t:.38,e:'o',...AR.REL,crouch:.42},{t:.55},R_(.95)],[{t:.38,e:'fire',dmg:1.3}],ARC());
chg('archer','arc','Arc Shot',{L:[-.2,.25,.35],wL:[0,.75,.65],R:[0,.15,.25],twist:-.4},
  [{t:.06,...AR.NOCK,L:[-.03,.35,.55],wL:[0,.7,.7],lean:-.25},{t:.36,...AR.DRAW,lean:-.25},{t:.42,e:'o',...AR.REL},{t:.6},R_(1.0)],[{t:.42,e:'fire',lob:1,dmg:1.2}],ARC());
chg('archer','quick','Quick Draw',{L:[-.03,.03,.6],wL:[0,.04,1],R:[.05,.1,.25],twist:-.8,lean:.05},
  [{t:.06,...AR.NOCK},{t:.2,...AR.DRAW},{t:.24,e:'o',...AR.REL},{t:.36,...AR.NOCK},{t:.5,...AR.DRAW},{t:.54,e:'o',...AR.REL},{t:.7},R_(1.05)],[{t:.24,e:'fire',dmg:.75},{t:.54,e:'fire',dmg:.75}],ARC());
chg('archer','spin','Spin Shot',{L:[-.5,0,.1],wL:[-.3,.2,.9]},
  [{t:.06,crouch:.15},{t:.1,yaw:-.4},{t:.42,e:'l',yaw:6.28,...AR.NOCK},{t:.6,...AR.DRAW},{t:.66,e:'o',...AR.REL},{t:.85},R_(1.25,{yaw:6.28})],[{t:.66,e:'fire',dmg:1.2}],ARC());
for(const t in CHG) for(const c of CHG[t]) RAW[t]['chg_'+c.id]={keys:c.keys,ev:c.ev,aim:c.aim,atk:1};
const WTIP={sword:.78,spear:1.25,giant:1.1,miner:.62,archer:.3};

