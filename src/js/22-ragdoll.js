/* ---------------- ragdolls (position-based) ---------------- */
const RIDX=['pelvis','chest','neck','head','eL','hL','eR','hR','kL','fL','kR','fR'];
const RCON=[[0,1,1],[1,2,1],[2,3,1],[1,4,1],[4,5,1],[1,6,1],[6,7,1],[0,8,1],[8,9,1],[0,10,1],[10,11,1],[0,2,.5],[1,3,.6],[0,3,.25],[8,10,.08],[9,11,.03]];
function impW(u,imp,out){return out.set(0,0,0).addScaledVector(u.rightW,imp[0]).addScaledVector(UP,imp[1]).addScaledVector(u.fwdW,imp[2]);}
// heavier torso, lighter limbs; minimum distances stop the body folding through itself
const IMASS=[.45,.5,.8,.7,1,1.25,1,1.25,.9,1.1,.9,1.1];
const RMIN=[[0,3,.62],[0,9,.42],[0,11,.42],[1,5,.24],[1,7,.24],[8,10,.12],[9,11,.1],[4,6,.12],[3,9,.6],[3,11,.6]];
function wakeRag(rg){ if(rg){ rg.sleep=false; rg.still=0; } }
function toRagdoll(u,impWorld,opt){
  opt=opt||{};
  if((NET.host||NET.rec)&&u.alive) netCapDeath(u,impWorld,opt);   // every death goes out to the guests with its impulse
  const P=RIDX.map(n=>u.j[n].clone());
  const rg={u,s:u.s,p:P,q:P.map(v=>v.clone()),v:P.map(()=>u.av.clone().multiplyScalar(.8).add(impWorld||new V3())),w:P.map(()=>1),c:[],pin:null,age:0,still:0,rad:P.map((_,i)=>i===3?.15*u.s:.05*u.s)};
  for(const c of RCON){ if(opt.decap&&(c[0]===3||c[1]===3)) continue; rg.c.push([c[0],c[1],P[c[0]].distanceTo(P[c[1]]),c[2],false]); }
  for(const c of RMIN){ if(opt.decap&&(c[0]===3||c[1]===3)) continue; rg.c.push([c[0],c[1],c[2]*u.s,.8,true]); }
  if(opt.decap){ u.decapped=true; rg.spray=1.7; bleed(P[2],_tmp.subVectors(P[2],P[1]).normalize().clone(),18,4,.35); }
  u.dropT=rand(.05,.35);
  for(const v of rg.v) v.x+=rand(-.4,.4),v.z+=rand(-.4,.4);
  if(opt.headImp) rg.v[3].add(opt.headImp);
  if(opt.spin){ const ax=u.rightW, w=opt.spin; for(let i=0;i<P.length;i++){ _tmp.subVectors(P[i],P[1]); _tmp2.crossVectors(ax,_tmp).multiplyScalar(w); rg.v[i].add(_tmp2);} }
  u.rag=rg; u.alive=false; u.state='dead'; u.action=null; u.draw=0;
  corpses.push(u);
  return rg;
}
function stepRag(rg,dt){
  if(!(dt>1e-7)) return;   // velocities are (new−old)/dt
  const P=rg.p,Q=rg.q,V=rg.v,W=rg.w,n=P.length, sink=rg.age>16&&!rg.keep;
  rg.age+=dt;
  if(tune.blood){
    if(rg.spray>0){ rg.spray-=dt; const k=clamp(rg.spray/1.7,0,1); rg.sprayAcc=(rg.sprayAcc||0)+dt*60*k;
      const dir=_tmp.subVectors(P[2],P[1]).normalize().clone();
      while(rg.sprayAcc>1){ rg.sprayAcc--; bleed(P[2],dir,1,2.5+4*k,.28); }
      if(Math.random()<dt*25*k) bleed(P[3],null,1,.6,.5); }
    if(rg.pin&&Math.random()<dt*12) bleed(P[1],null,1,.4,.4);
    if(!rg.pooled&&rg.age>.9&&P[1].y-H(P[1].x,P[1].z)<.3*rg.s){ rg.pooled=true; addSplat(P[1].x,P[1].z,rand(.28,.42)*rg.s,2.5); if(rg.u.decapped) addSplat(P[2].x,P[2].z,rand(.2,.3)*rg.s,2); }
  }
  if(rg.sleep&&!sink&&!rg.pin){ mapRagJoints(rg); return; }
  for(let i=0;i<n;i++){ V[i].y-=20*dt; V[i].multiplyScalar(.998); Q[i].copy(P[i]).addScaledVector(V[i],dt); W[i]=IMASS[i]; }
  if(rg.pin){ rg.pin.get(_tmp); Q[rg.pin.i].copy(_tmp); W[rg.pin.i]=0; }
  for(let it=0;it<8;it++){
    for(const c of rg.c){ const a=Q[c[0]],b=Q[c[1]],wa=W[c[0]],wb=W[c[1]],ws=wa+wb; if(!ws)continue;
      _d.subVectors(b,a); const len=_d.length(); if(len<1e-6)continue; if(c[4]&&len>=c[2]) continue;
      const k=(len-c[2])/len*c[3]; a.addScaledVector(_d,k*wa/ws); b.addScaledVector(_d,-k*wb/ws); }
    if(!sink) for(let i=0;i<n;i++){ const g=H(Q[i].x,Q[i].z)+rg.rad[i]; if(Q[i].y<g) Q[i].y=g; }
  }
  let maxV=0;
  for(let i=0;i<n;i++){
    const vy0=V[i].y;
    V[i].subVectors(Q[i],P[i]).multiplyScalar(1/dt);
    if(!sink&&Q[i].y<=H(Q[i].x,Q[i].z)+rg.rad[i]+.01){ // ground: grip when slow, slide and tumble when fast
      const hv=Math.hypot(V[i].x,V[i].z); if(hv<.7){ V[i].x=0; V[i].z=0; } else { V[i].x*=.78; V[i].z*=.78; }
      if(vy0<-6&&rg.age>.15){ puff(Q[i],1,.22*rg.s,.7); if(i===1||i===3) shakeAt(Q[i],.03); } }
    if(sink){ Q[i].y-=dt*.45*rg.s; V[i].set(0,0,0); }
    maxV=Math.max(maxV,V[i].lengthSq());
    P[i].copy(Q[i]);
  }
  if(!rg.pin&&rg.age>1&&maxV<.04){ rg.still+=dt; if(rg.still>.5) rg.sleep=true; } else rg.still=0;
  mapRagJoints(rg);
}
function mapRagJoints(rg){
  const P=rg.p, u=rg.u, j=u.j;
  RIDX.forEach((nm,i)=>j[nm].copy(P[i]));
  j.sL.copy(j.chest); j.sR.copy(j.chest); j.hipL.copy(j.pelvis); j.hipR.copy(j.pelvis);
  u.wRw.subVectors(j.hR,j.eR).normalize(); u.spine.subVectors(j.neck,j.pelvis).normalize();
  u.wLw.copy(u.fwdW); u.fwdW.addScaledVector(u.spine,-u.fwdW.dot(u.spine)); if(u.fwdW.lengthSq()<1e-4)u.fwdW.set(1,0,0); u.fwdW.normalize();
  u.rightW.crossVectors(u.spine,u.fwdW).normalize();
}
function pinRag(rg,i,getter){rg.pin={i,get:getter}; wakeRag(rg);}
function releaseRag(rg,impWorld){ if(!rg||!rg.pin) return; wakeRag(rg); const i=rg.pin.i; rg.pin=null; for(const v of rg.v){ v.multiplyScalar(.3).add(impWorld); v.x+=rand(-.6,.6); v.z+=rand(-.6,.6);} rg.v[i].add(impWorld.clone().multiplyScalar(.2)); }

