/* ================= The Frontier (v0.30): a three-faction battlefield 1,080 m square =================
   Riverlands' engine at three times the scale: the ground runs out to ±540 m (soldiers within ±476 m), about eleven
   times the area of Riverlands. The same systems run on it — the river and its crossings, capture zones, fog of
   war, day and night, supply, veterans, formations, neutral camps — with more of everything:
     · four lands: the Western Farmlands (golden fields), the Eastern Ashlands (scorched earth and ember cracks,
       few trees), the Elder Forests to north and south, and the snow-capped Highland peaks;
     · sixteen capture zones (markets, shrines, altars, watchtowers, militia villages), eight villages, seven bridges,
       four fords, mountains, forests five times as dense;
     · the third faction: whichever of the Order, the Chaos Empire and the Wildlands is not playing holds four
       fortified warband outposts and the old camps, hostile to both armies; clearing one pays its gold;
     · two mines a side by each castle as on Riverlands.
   Performance: the ground is built in 98 m tiles at 4 m resolution (the height grid soldiers walk on is 2 m),
   vegetation is instanced per tile with a low-detail model for the far ones, and anything beyond the haze is not
   drawn; the spatial hash, the obstacle grid and the fog of war grow with the map.
   The layout is built once from its own seeded random stream the first time the map is chosen, then kept: going
   back and forth between Riverlands and the Frontier swaps the two in place. */
const RL_SIZE={river:{K:1,CF:118,HALF:160,LIM:156,EDGE:200},frontier:{K:3,CF:354,HALF:480,LIM:476,EDGE:540}};
// a Riverlands point on the map in use: castle-side points move with the castle; field points scale
function rlPt(p){ const x=p[0], z=p[1], ax=Math.abs(x); return ax>=96?[Math.sign(x)*(RL_CF-118+ax),z]:[x*RLK,z*RLK]; }
const rlPtF=p=>p;
const rlSymF=L=>L.concat(L.map(q=>[-q[0],-q[1]].concat(q.slice(2))));
const RL_ZONES_F=[{id:'K',x:-230,z:-330},{id:'L',x:230,z:330},{id:'M',x:-270,z:300},{id:'N',x:270,z:-300},{id:'O',x:-190,z:-20},{id:'P',x:190,z:20}];
const RL_HILLS_F=rlSymF([[-300,-410,45,9],[-210,-260,40,7],[-330,220,40,6.5],[-120,-430,35,6],[-430,-380,55,10]]);
const RL_VIL_F=[{x:-200,z:-60,r:.3,big:true},{x:200,z:60,r:Math.PI+.3,big:true},{x:-150,z:330,r:1.1},{x:150,z:-330,r:Math.PI+1.1}];
const RL_FORESTS_F=rlSymF([[-60,-445,55],[150,-440,50],[-260,-440,40],[0,-330,38],[-410,-260,45],[400,-200,40],[-330,-140,30]]);
const RL_BRIDGES_F=[{z:150,len:16,wid:4.5,arch:.4,kind:'wood'},{z:-150,len:16,wid:4.5,arch:.4,kind:'wood'}];
const RL_NCAMPS_F=[{x:-160,z:-180,kind:'warband',gold:500},{x:160,z:180,kind:'warband',gold:500},{x:60,z:-440,kind:'warband',gold:600},{x:-60,z:440,kind:'warband',gold:600}];
const RL_ROADS_F=(()=>{ const L=[[[-330,6],[-262,-14],[-200,-60]],[[-200,-60],[-214,-200],[-230,-330]],[[-150,330],[-210,318],[-270,300]],[[-200,-60],[-190,-20]],[[-160,-180],[-200,-120]],[[-60,440],[-120,400],[-150,330]]];
  return L.concat(L.map(R=>R.map(p=>[-p[0],-p[1]]))); })();
const RL_KEEPK={on:1,WL:1,sway:1,low:1};
const RLV={};
function rlLayout(v){
  const S=RL_SIZE[v], F=v==='frontier'; RL_VAR=v; RLK=S.K; RL_CF=S.CF; RL_HALF=S.HALF; RL_LIM=S.LIM; RL_EDGE=S.EDGE; const K=RLK;
  RL_ZONES=RL_ZONES0.map(z=>Object.assign({},z,{x:z.x*K,z:z.z*K})).concat(F?RL_ZONES_F.map(z=>Object.assign({},z)):[]);
  RL_MINE=RL_MINE0.map(L=>L.map(m=>{ const a=rlPt([m.x,m.z]), b=rlPt([m.dx,m.dz]); return {x:a[0],z:a[1],dx:b[0],dz:b[1]}; }));
  RL_HILLS=RL_HILLS0.map(q=>[q[0]*K,q[1]*K,q[2]*(F?K*.8:1),q[3]*(F?1.6:1)]).concat(F?RL_HILLS_F:[]);
  RL_BRIDGES=RL_BRIDGES0.map(B=>({z:B.z*K,len:B.len,wid:B.wid,arch:B.arch,kind:B.kind})).concat(F?RL_BRIDGES_F.map(B=>Object.assign({},B)):[]);
  RL_VIL=RL_VIL0.map(V=>Object.assign({},V,{x:V.x*K,z:V.z*K})).concat(F?RL_VIL_F:[]);
  RL_CAMPS=RL_CAMPS0.map(C=>{ const a=rlPt([C.x0,C.z0]), b=rlPt([C.x1,C.z1]); return {t:C.t,x0:Math.min(a[0],b[0]),x1:Math.max(a[0],b[0]),z0:C.z0,z1:C.z1}; });
  RL_FORESTS=RL_FORESTS0.map(f=>[f[0]*K,f[1]*K,f[2]*(F?K*.75:1)]).concat(F?RL_FORESTS_F:[]);
  RL_TOWERS=RL_TOWERS0.map(([x,z])=>[rlRiverX(z*K)+(x-rlRiverX0(z)),z*K]);
  RL_RUINS=RL_RUINS0.map(([x,z])=>[x*K,z*K]);
  RL_FORDS=RL_FORDS0.map(f=>({z:f.z*K}));
  RL_NCAMPS=RL_NCAMPS0.map(C=>Object.assign({},C,{x:C.x*K,z:C.z*K})).concat(F?RL_NCAMPS_F.map(C=>Object.assign({},C)):[]);
  RL_CROSS=null;
  FOW.X0=-RL_EDGE; FOW.S=2*RL_EDGE/FOW.N; FOW.uK.value.set(RL_EDGE,2*RL_EDGE);
}
// build a map the first time, keep it, swap it in
function rlUseVariant(v){
  if(RL.built&&RL_VAR===v) return;
  if(RL.built){ if(RL.group) RL.group.visible=false; const o={}; for(const k in RL) if(!RL_KEEPK[k]) o[k]=RL[k]; RLV[RL_VAR]=o; }
  rlLayout(v);
  if(RLV[v]){ Object.assign(RL,RLV[v]); rlBridgeInit(); rlRoadsInit(); return; }
  Object.assign(RL,{built:false,zones:[],obst:[],og:null,flow:null,mills:[],fires:[],flags:[],tiles:[],mmBg:null,mmKey:'',group:null,ground:null,fowPatched:false,chimneys:[],mineVis:null,flagKey:null});
  rlBuild();
}
// the lands of the Frontier
function rlBiome(x,z){ if(RLK<=1) return 'vale'; if(x>200) return 'ash'; if(x<-200) return 'farm'; if(Math.abs(z)>330) return 'elder'; return 'vale'; }
const RL_BIO={gold:new THREE.Color('#a9a24c'),ash:new THREE.Color('#5c5048'),ember:new THREE.Color('#8a3a1c'),elder:new THREE.Color('#2e5428'),snow:new THREE.Color('#e6ebe8')};
function rlBiomeTint(C,x,z,y,n){
  const wf=smooth(clamp((-x-170)/60,0,1)), wa=smooth(clamp((x-170)/60,0,1)), we=smooth(clamp((Math.abs(z)-300)/60,0,1));
  if(wf>0) C.lerp(RL_BIO.gold,wf*.42*(.7+.3*n));
  if(wa>0){ C.lerp(RL_BIO.ash,wa*.72); const cr=Math.abs(Math.sin(x*.21+Math.sin(z*.13)*2)*Math.sin(z*.17-x*.05)); if(cr>.93) C.lerp(RL_BIO.ember,wa*.6); }
  if(we>0) C.lerp(RL_BIO.elder,we*.5);
  if(y>5.2) C.lerp(RL_BIO.snow,clamp((y-5.2)*.22,0,.85));
}
// the third faction holds the outposts: whichever one is not in the battle
const WARBAND={order:['sword','archer','spear','sword','knight'],chaos:['boner','dread','harvester','boner','crawler'],wild:['sword','archer','archer','ninja','cleric']};
function rlThirdFaction(){ if(RLK<=1){ return; } const f=['order','chaos','wild'].find(x=>x!==game.fac[0]&&x!==game.fac[1])||'wild'; game.fac[2]=f; NCAMP_UNITS.warband=WARBAND[f]; }
