/* ================= The Wildlands become an elven host (v0.27): two idles of their own per soldier =================
   (their looks, names and the wider roster are in 36c) */
const IDLES_WILD={};
for(const t of ['miner','sword','spear','archer','ninja','cleric','wizard']){
  RAW[t].idle_elfListen={idle:1,keys:[{t:0},{t:.6,lean:-.18,look:.35,crouch:.04},{t:1.8,look:-.25},{t:2.6,look:0,lean:0},R_(3.1)]};
  RAW[t].idle_elfSalute={idle:1,keys:[{t:0},{t:.5,L:[.02,.12,.18],wL:[0,1,0],lean:.32},{t:1.3,lean:.36},{t:1.8,lean:0},R_(2.3)]};
  IDLES_WILD[t]=IDLES[t].concat(['idle_elfListen','idle_elfSalute']); }
Object.assign(IDLE_NAMES,{elfListen:'Listen to the Wind',elfSalute:'Leaf Salute'});
