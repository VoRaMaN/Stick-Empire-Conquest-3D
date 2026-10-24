/* ---------------- animation / IK debug view (development only, v0.34) ----------------
   Off in normal play. It exists only in development mode — the page opened with ?dev or ?animdebug (or #animdebug), or
   localStorage 'se3d.dev' = '1' — where F9 (or the "Animation debug" switch in Settings) turns it on and off.
   For each soldier near the camera (and the one being followed) it draws, over the bodies:
     · the skeleton: bones as white lines, joints as small dots
     · IK targets: hand targets (cyan) — a red line joins hand and target when the arm cannot reach
     · foot contacts: planted feet (green ring + a line to the ground), stepping feet (amber: where the step lands and
       its path), a planted foot the leg cannot reach (red)
     · the weapon: grip point (yellow) and weapon axis; a two-handed hold joins the hands in magenta
     · bend directions: elbows and knees show which way they bend — green, amber while the bend is turning toward a new
       pole (rate-limited), red when the knee's hinge limit holds it, or the limb is stretched past its reach
     · aim: the blow's target (red) and the line from the striking point to it
     · the hip cap: a short bar at the highest the hips may ride over the planted feet
     · ragdolls of the last 3 seconds: particles and constraints (violet)
     · the skinned creatures (the Wyvern, the Devil Bat — 27l): the model's own bones (white), its IK targets — toe
       targets with the planted ones ringed green, a toe off its target red, a step the model takes on its own amber,
       the claws' targets cyan (red when unreached) — the knees' and elbows' bend sides, and how far the hips sank
       (blue); the label adds the state machine's state and the variation playing (creature.category.variant)
   and a label above each soldier: type, clip and time (or locomotion speed), aim, grip, transition carry, state.
   The overlay costs nothing when off: nothing is allocated in the DOM and no lines are filled. */
const DEV_MODE=(()=>{ try{ const q=(location.search||'')+(location.hash||''); if(/[?&#](dev|animdebug)\b/i.test(q)) return true; return localStorage.getItem('se3d.dev')==='1'; }catch(e){ return false; } })();
const ADBG={max:12000,n:0,labels:[],labelPool:[],root:null,maxUnits:60,radius:42};
const ADC={bone:new THREE.Color('#f2f2f2'),joint:new THREE.Color('#d8d8d8'),hand:new THREE.Color('#34c6ff'),miss:new THREE.Color('#ff3b3b'),plant:new THREE.Color('#38d36b'),
  step:new THREE.Color('#ffb020'),grip:new THREE.Color('#ffd84d'),two:new THREE.Color('#ff4dd2'),bendOk:new THREE.Color('#5dff8a'),bendTurn:new THREE.Color('#ffb020'),bendLim:new THREE.Color('#ff3b3b'),
  aim:new THREE.Color('#ff5050'),cap:new THREE.Color('#9be7ff'),rag:new THREE.Color('#b48cff'),ground:new THREE.Color('#2a8f4a')};
const adbgGeo=new THREE.BufferGeometry();
adbgGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(ADBG.max*6),3).setUsage(THREE.DynamicDrawUsage));
adbgGeo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(ADBG.max*6),3).setUsage(THREE.DynamicDrawUsage));
adbgGeo.setDrawRange(0,0);
const adbgLines=new THREE.LineSegments(adbgGeo,new THREE.LineBasicMaterial({vertexColors:true,depthTest:false,transparent:true,opacity:.95}));
adbgLines.frustumCulled=false; adbgLines.renderOrder=11; adbgLines.visible=false; scene.add(adbgLines);
function adLine(a,b,col){ if(ADBG.n>=ADBG.max) return; const P=adbgGeo.attributes.position.array, C=adbgGeo.attributes.color.array, i=ADBG.n*6;
  P[i]=a.x; P[i+1]=a.y; P[i+2]=a.z; P[i+3]=b.x; P[i+4]=b.y; P[i+5]=b.z; C[i]=C[i+3]=col.r; C[i+1]=C[i+4]=col.g; C[i+2]=C[i+5]=col.b; ADBG.n++; }
const _ad1=new V3(),_ad2=new V3(),_ad3=new V3();
function adRing(c,r,col,seg){ seg=seg||10; for(let k=0;k<seg;k++){ const a0=k/seg*Math.PI*2, a1=(k+1)/seg*Math.PI*2;
  _ad1.set(c.x+Math.cos(a0)*r,c.y,c.z+Math.sin(a0)*r); _ad2.set(c.x+Math.cos(a1)*r,c.y,c.z+Math.sin(a1)*r); adLine(_ad1,_ad2,col); } }
function setAnimDebug(on){ tune.dbg=!!on; const el=document.getElementById('sDbg'); if(el) el.checked=tune.dbg; if(!tune.dbg) animDbgClear(); }
function animDbgClear(){ adbgGeo.setDrawRange(0,0); adbgLines.visible=false; if(ADBG.root) ADBG.root.hidden=true; }
// which soldiers get the overlay: the followed one, then the nearest to the camera's target
function animDbgPick(){
  const T=cam.target, out=[]; for(const u of units){ if(!u.alive||u.fowH||!u.j) continue; const d=Math.hypot(u.pos.x-T.x,u.pos.z-T.z); if(u===cam.follow||d<ADBG.radius) out.push([u===cam.follow?-1:d,u]); }
  out.sort((a,b)=>a[0]-b[0]); return out.slice(0,ADBG.maxUnits).map(e=>e[1]); }
function animDbgBegin(){ ADBG.n=0; ADBG.labels.length=0; ADBG.pick=new Set(animDbgPick()); }
const BONES=[['pelvis','chest'],['chest','neck'],['neck','head'],['sL','sR'],['sL','eL'],['eL','hL'],['sR','eR'],['eR','hR'],['hipL','hipR'],['hipL','kL'],['kL','fL'],['hipR','kR'],['kR','fR']];
function drawDebug(u){
  if(!ADBG.pick||!ADBG.pick.has(u)) return;
  const j=u.j, s=u.s;
  if(u.cg&&u.cg.root.visible){ cgDebug(u); return; }
  if(u.cr){ sph(u.pos,.08*s,DBG.pole,dbgIM); ADBG.labels.push([u,`${u.type} · beast rig`]); return; }   // Hellcrawlers, hounds, wyverns have their own rigs
  // skeleton
  for(const [a,b] of BONES) if(j[a]&&j[b]) adLine(j[a],j[b],ADC.bone);
  for(const k of ['pelvis','chest','neck','eL','eR','hL','hR','kL','kR','fL','fR']) sph(j[k],.025*s,ADC.joint,dbgIM);
  // IK targets (hands)
  for(const sd of ['R','L']){ const T=u.hand[sd], H=j['h'+sd], miss=T.distanceTo(H)>.02*s; sph(T,.04*s,miss?ADC.miss:ADC.hand,dbgIM); if(miss) adLine(H,T,ADC.miss); }
  // feet: contact points, steps, reach
  for(let i=0;i<2;i++){ const ft=u.feet[i], F=i?j.fR:j.fL;
    if(ft.t>=0){ sph(ft.to,.05*s,ADC.step,dbgIM); adLine(ft.pos,ft.to,ADC.step); }
    else { const short=Math.hypot(F.x-ft.pos.x,F.z-ft.pos.z)>.02*s||F.y-.045*s-ft.pos.y>.03*s, col=short?ADC.miss:ADC.plant;
      _ad3.copy(ft.pos); _ad3.y+=.01; adRing(_ad3,.07*s,col); _ad1.copy(F); _ad2.copy(ft.pos); adLine(_ad1,_ad2,col); } }
  // the weapon: grip point, axis, two-handed hold
  if(u.G&&u.G.w&&!u.G.w.dropped){ sph(j.hR,.035*s,ADC.grip,dbgIM); const L=((AIMW[u.type]&&AIMW[u.type].tip)||.8)*s; _ad1.copy(j.hR).addScaledVector(u.wRw,L); adLine(j.hR,_ad1,ADC.grip);
    if(u.grip>.05){ adLine(j.hR,j.hL,ADC.two); sph(j.hL,.035*s,ADC.two,dbgIM); } }
  if(u.G&&u.G.o&&!u.G.o.dropped){ _ad1.copy(j.hL).addScaledVector(u.wLw,.25*s); adLine(j.hL,_ad1,ADC.grip); }
  // bend directions and limits (elbows, knees)
  const S=u.ikS;
  if(S) for(const [k,mid,a,b] of [['R','eR','sR','hR'],['L','eL','sL','hL'],['kL','kL','hipL','fL'],['kR','kR','hipR','fR']]){ const st=S[k]; if(!st||!st.ok) continue;
    const col=st.limited||st.reach>1.001?ADC.bendLim:st.turned?ADC.bendTurn:ADC.bendOk; _ad1.copy(j[mid]).addScaledVector(st.b,.12*s); adLine(j[mid],_ad1,col); }
  // aim
  if(u.aim&&u.aim.T){ sph(u.aim.T,.045*s,ADC.aim,dbgIM); if(u.aim.by!=='bow'&&u.aim.by!=='foot'&&u.aim.by!=='hL'){ strikePoint(u,u.aim.by,_ad2,u.aim.T); adLine(_ad2,u.aim.T,ADC.aim); } }
  // the hip cap over the planted feet
  const D=u.ikD; if(D&&D.capP<1e5){ _ad1.copy(j.pelvis); _ad1.y=D.capP; _ad2.copy(_ad1).addScaledVector(u.rightW,.15*s); _ad1.addScaledVector(u.rightW,-.15*s); adLine(_ad1,_ad2,ADC.cap); }
  ADBG.labels.push([u,animDbgText(u)]);
}
// a skinned creature: the model's bones and its solvers' targets (see the top)
function cgDebug(u){
  const I=u.cg, P=I.P, k=I.k;
  for(let i=0;i<P.B.length;i++){ const pa=P.B[i].parent; if(pa<0||pa===P.root) continue; adLine(I.pw[pa],I.pw[i],ADC.bone); }
  const stCol=st=>st.limited||st.reach>1.001?ADC.bendLim:st.turned?ADC.bendTurn:ADC.bendOk;
  P.legs.forEach((L,s)=>{ const T=I.toeT[s], toe=I.pw[L.to], fs=I.fs&&I.fs[s], gi=L.gs==='R'?1:0, ft=u.feet&&u.feet[gi];
    const off=toe.distanceTo(T)>.03*k, planted=ft&&ft.t<0&&!(fs&&(fs.t>=0||fs.swOn));
    if(planted){ _ad3.copy(T); _ad3.y=H(T.x,T.z)+.01; adRing(_ad3,.09*k,off?ADC.miss:ADC.plant); } else sph(T,.05*k,off?ADC.miss:ADC.step,dbgIM);
    if(off) adLine(toe,T,ADC.miss);
    if(fs&&fs.t>=0){ adLine(fs.from,fs.to,ADC.step); sph(fs.to,.05*k,ADC.step,dbgIM); }
    sph(I.hock[s],.03*k,ADC.joint,dbgIM);
    const st=I.ik.l[s]; if(st&&st.ok){ _ad1.copy(I.pw[L.sh]).addScaledVector(st.b,.2*k); adLine(I.pw[L.sh],_ad1,stCol(st)); } });
  (P.wings||P.arms).forEach((W,s)=>{ const st=I.ik.w[s]; if(st&&st.ok){ _ad1.copy(I.pw[W.fo]).addScaledVector(st.b,.2*k); adLine(I.pw[W.fo],_ad1,stCol(st)); }
    if(P.arms&&I.armW>.05){ const T=I.handT[s], miss=T.distanceTo(I.pw[W.hd])>.03*k; sph(T,.045*k,miss?ADC.miss:ADC.hand,dbgIM); if(miss) adLine(I.pw[W.hd],T,ADC.miss); } });
  if(I.dyA>.005){ _ad1.copy(u.j.pelvis); _ad2.copy(I.pw[P.I.pelvis]); adLine(_ad1,_ad2,ADC.cap); }
  const a=u.action, d=a&&CA_BY_CLIP[u.type]&&CA_BY_CLIP[u.type][a.c.name];
  ADBG.labels.push([u,`${P.kind} · ${caState(u)}${d?' · '+d.id:a?' · '+a.c.name:''}${a?' '+a.t.toFixed(2)+'/'+a.c.dur.toFixed(2):''}${I.dyA>.005?' · hips -'+(I.dyA*100).toFixed(0)+'cm':''}`]);
}
function animDbgText(u){
  const a=u.action, bits=[TYPES[u.type]?TYPES[u.type].name:u.type];
  bits.push(a?`${a.c.name} ${a.t.toFixed(2)}/${a.c.dur.toFixed(2)}${a.c.loop?' loop':''}`:(u.spd>.15?`moving ${u.spd.toFixed(1)} m/s${u.chgW>.3?' · charge':''}`:'idle'));
  if(u.aim) bits.push(`aim ${u.aim.by} ${u.aim.w.toFixed(2)}${u.aim.fade?' (fade)':''}`);
  if(u.grip>.05) bits.push(`2-hand ${u.grip.toFixed(2)}`);
  if(u.pcT!==undefined&&u.pcT<CARRY_T) bits.push(`blend ${(1-u.pcT/CARRY_T).toFixed(2)}`);
  if(u.fin) bits.push('finisher'); if(u.state&&u.state!=='ok') bits.push(u.state); if(u.routing) bits.push('routing');
  return bits.join(' · ');
}
function drawRagDebug(u){ const rg=u.rag; if(!rg||rg.age>3||!ADBG.pick) return;
  const T=cam.target; if(Math.hypot(u.pos.x-T.x,u.pos.z-T.z)>ADBG.radius) return;
  for(const c of rg.c) if(!c[4]) adLine(rg.p[c[0]],rg.p[c[1]],ADC.rag);
  for(const p of rg.p) sph(p,.03*rg.s,ADC.rag,dbgIM); }
function animDbgEnd(){
  adbgGeo.attributes.position.needsUpdate=true; adbgGeo.attributes.color.needsUpdate=true; adbgGeo.setDrawRange(0,ADBG.n*2); adbgLines.visible=ADBG.n>0;
  if(typeof document==='undefined'||!document.body||!document.body.appendChild) return;
  if(!ADBG.root){ const r=ADBG.root=document.createElement('div'); r.id='animDbg'; document.body.appendChild(r);
    const k=document.createElement('div'); k.className='adbg-key'; k.textContent='Animation debug (F9) — bones white · hand targets cyan · planted feet green, steps amber, unreached red · grip yellow, two-hand magenta · bend green / turning amber / limited red · aim red · hip cap blue · ragdolls violet · creature models: own steps amber, hips sunk blue'; r.appendChild(k); }
  const R=ADBG.root; R.hidden=false;
  const W=renderer.domElement.clientWidth||window.innerWidth, Hh=renderer.domElement.clientHeight||window.innerHeight;
  let i=0;
  for(const [u,txt] of ADBG.labels){ _ad1.copy(u.j.head||u.pos).addScaledVector(UP,.55*u.s).project(camera); if(_ad1.z>1||_ad1.z<-1) continue;
    let el=ADBG.labelPool[i]; if(!el){ el=ADBG.labelPool[i]=document.createElement('div'); el.className='adbg-l'; R.appendChild(el); }
    el.hidden=false; if(el.textContent!==txt) el.textContent=txt; el.style.transform=`translate(${((_ad1.x+1)/2*W).toFixed(0)}px,${((1-_ad1.y)/2*Hh).toFixed(0)}px) translate(-50%,-100%)`; i++; }
  for(;i<ADBG.labelPool.length;i++) ADBG.labelPool[i].hidden=true;
}
