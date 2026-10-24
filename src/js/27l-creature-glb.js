/* ================= Skinned creatures (v0.35): the Wyvern and the Devil Bat from Blender =================
   The two models made in Blender (assets/glb: the Wyvern, 47 bones; the Devil Bat, 42 bones; flat colours, no
   clips) take over from the procedural bodies of the Wyvern Knight's mount and of the Devil Bat whenever the build
   carries them. They are layered onto the animation system the game already has, not built beside it:
     1. Gameplay and timing stay where they were. Clips are data (11–13*, the creature library in 13m); play() and
        updateAction fire their events (hits, breath, kills) on the simulation's clock; the rigs the game already
        had keep moving the body for the simulation: the four-limbed rig with its foot planner and flight for the
        wyvern (27-hellcrawler, 27f), the stick skeleton and the Wing Archer's flight for the bat (21, 26).
     2. This file poses the model's real bones from those rigs on every drawn frame (drawing only, never the
        simulation, so a slow screen can't change a fight):
          torso, neck, head  the rig's body frames carried onto the model's rest pose as rotations, so the model
                             keeps its own silhouette; the neck spreads the head's turn over its segments and, during
                             a strike, reaches toward the rig's head so a bite lands where the game says it does
          legs               two-bone IK on the model's own bone lengths (thigh and shin) to a hock set above the
                             planted toe; the bend is kept in front, turned at a limited rate and blended from the last
                             frame (ik2, 21-skeleton); aloft the targets are the flight's tucked or dangling feet
          wings              the wyvern's wing arm by IK to the rig's wrist while folded (it walks on its knuckles)
                             and along the rig's wing while spread, four fingers fanned between the rig's leading and
                             trailing fingers. The bat's arms are its wings: IK to the claws' targets in a strike,
                             spread and beating with the flight otherwise, the fingers fanned by how open the wing is
          tail               a damped spring chain: each segment lags behind where its parent carries it, so turns,
                             lunges and stops whip through it; lift and sweep from the clip's tup/tsw channels
          jaw                opens with the clip's draw channel (and the wyvern rig's jaw)
     3. One skinned mesh per material (the model's meshes merged once per kind and shared by every instance), a
        skeleton of its own per unit; posing allocates nothing.
   No model in the build, or a model that fails to load: the procedural bodies stay. */
const CG={P:{},ready:false,started:false,failed:null};
const CG_KIND={knight:'wyvern',bat:'devilbat'};
const CG_K={wyvern:1.03,devilbat:1.04};   // model metres → game metres at the unit's own size: the rig's resting hip height over the model's
const CG_ID=new THREE.Matrix4(), CG_Y=new V3(0,1,0);
function cgStart(){
  if(CG.started) return; CG.started=true;
  if(typeof THREE.GLTFLoader!=='function'){ CG.failed='GLTFLoader missing'; CG.ready=true; return; }
  loadAssets().then(A=>{
    const M=A&&A.glb, kinds=M?Object.keys(M).filter(k=>CG_K[k]):[];
    if(!kinds.length){ CG.failed='no creature models in this build'; CG.ready=true; return; }
    let left=kinds.length; const done=()=>{ if(--left===0) CG.ready=true; };
    const fail=(kind,e)=>{ CG.failed=kind+': '+(e&&e.message||e); console.warn('Stick Empire 3D: the '+kind+' model did not load, the procedural body stays',e); };
    for(const kind of kinds){
      try{ new THREE.GLTFLoader().parse(b64buf(M[kind]),'',g=>{ try{ CG.P[kind]=cgProto(kind,g); }catch(e){ fail(kind,e); } done(); },e=>{ fail(kind,e); done(); }); }
      catch(e){ fail(kind,e); done(); } }
  },e=>{ CG.failed='assets: '+(e&&e.message||e); CG.ready=true; });
}

/* ---------- the prototype: one per kind, shared by every instance ---------- */
function cgMerge(L){
  let nv=0, ni=0; for(const g of L){ const c=g.attributes.position.count; nv+=c; ni+=g.index?g.index.count:c; }
  const pos=new Float32Array(nv*3), nor=new Float32Array(nv*3), si=new Uint16Array(nv*4), sw=new Float32Array(nv*4), idx=nv>65535?new Uint32Array(ni):new Uint16Array(ni);
  let ov=0, oi=0;
  for(const g of L){ const A=g.attributes, c=A.position.count, N=A.normal, J=A.skinIndex, W=A.skinWeight;
    const wn=W.normalized?(W.array instanceof Uint8Array?255:W.array instanceof Uint16Array?65535:1):1;
    for(let i=0;i<c;i++){ const o=ov+i;
      pos[o*3]=A.position.getX(i); pos[o*3+1]=A.position.getY(i); pos[o*3+2]=A.position.getZ(i);
      if(N){ nor[o*3]=N.getX(i); nor[o*3+1]=N.getY(i); nor[o*3+2]=N.getZ(i); }
      si[o*4]=J.getX(i); si[o*4+1]=J.getY(i); si[o*4+2]=J.getZ(i); si[o*4+3]=J.getW(i);
      let a=W.getX(i)/wn, b=W.getY(i)/wn, cc=W.getZ(i)/wn, d=W.getW(i)/wn; const t=a+b+cc+d||1;   // weights summing to one
      sw[o*4]=a/t; sw[o*4+1]=b/t; sw[o*4+2]=cc/t; sw[o*4+3]=d/t; }
    if(g.index){ for(let i=0;i<g.index.count;i++) idx[oi+i]=g.index.getX(i)+ov; oi+=g.index.count; } else { for(let i=0;i<c;i++) idx[oi+i]=ov+i; oi+=c; }
    ov+=c; }
  const G=new THREE.BufferGeometry();
  G.setAttribute('position',new THREE.BufferAttribute(pos,3)); G.setAttribute('normal',new THREE.BufferAttribute(nor,3));
  G.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4)); G.setAttribute('skinWeight',new THREE.BufferAttribute(sw,4));
  G.setIndex(new THREE.BufferAttribute(idx,1)); G.computeBoundingSphere(); return G;
}
// glTF's metal/rough colours (linear) as the game's flat-shaded Phong (this renderer draws in display space)
function cgMat(m,json){
  const j=(json.materials||[]).find(x=>x.name===m.name)||{}, pb=j.pbrMetallicRoughness||{}, bc=pb.baseColorFactor||[1,1,1,1], ef=j.emissiveFactor||[0,0,0];
  const es=(j.extensions&&j.extensions.KHR_materials_emissive_strength&&j.extensions.KHR_materials_emissive_strength.emissiveStrength)||1;
  const metal=pb.metallicFactor!==undefined?pb.metallicFactor:1, rough=pb.roughnessFactor!==undefined?pb.roughnessFactor:1, sp=.06+.3*metal*(1-rough);
  const mat=new THREE.MeshPhongMaterial({color:new THREE.Color(bc[0],bc[1],bc[2]).convertLinearToSRGB(),emissive:new THREE.Color(ef[0],ef[1],ef[2]).convertLinearToSRGB(),
    emissiveIntensity:clamp(es*.4,1,1.6),specular:new THREE.Color(sp,sp,sp),shininess:Math.round(6+70*(1-rough)),flatShading:true,skinning:true,side:j.doubleSided?THREE.DoubleSide:THREE.FrontSide});
  mat.name='cg:'+m.name; return mat;
}
const _cgq1=new THREE.Quaternion(),_cgq2=new THREE.Quaternion(),_cgq3=new THREE.Quaternion(),_cgq4=new THREE.Quaternion(),_cgq5=new THREE.Quaternion(),_cgm=new THREE.Matrix4();
const _cgv1=new V3(),_cgv2=new V3(),_cgv3=new V3(),_cgfx=new V3(),_cgfy=new V3(),_cgfz=new V3();
// a rotation from a frame: forward (z) and an up hint (y); x = y × z is the unit's right (the game's rightW)
function cgFrameZ(out,fwd,up){ _cgfz.copy(fwd).normalize(); _cgfy.copy(up).addScaledVector(_cgfz,-_cgfz.dot(up));
  if(_cgfy.lengthSq()<1e-8){ _cgfy.set(0,1,0).addScaledVector(_cgfz,-_cgfz.y); if(_cgfy.lengthSq()<1e-8) _cgfy.set(1,0,0); }
  _cgfy.normalize(); _cgfx.crossVectors(_cgfy,_cgfz); _cgm.makeBasis(_cgfx,_cgfy,_cgfz); return out.setFromRotationMatrix(_cgm); }
// the same from up (y) and a right hint (x)
function cgFrameY(out,up,right){ _cgfy.copy(up).normalize(); _cgfx.copy(right).addScaledVector(_cgfy,-_cgfy.dot(right));
  if(_cgfx.lengthSq()<1e-8){ _cgfx.set(1,0,0).addScaledVector(_cgfy,-_cgfy.x); if(_cgfx.lengthSq()<1e-8) _cgfx.set(0,0,1); }
  _cgfx.normalize(); _cgfz.crossVectors(_cgfx,_cgfy); _cgm.makeBasis(_cgfx,_cgfy,_cgfz); return out.setFromRotationMatrix(_cgm); }
function cgProto(kind,g){
  const meshes=[]; g.scene.updateMatrixWorld(true); g.scene.traverse(o=>{ if(o.isSkinnedMesh) meshes.push(o); });
  if(!meshes.length) throw new Error('no skinned meshes');
  const sk=meshes[0].skeleton, bones=sk.bones, n=bones.length;
  for(const m of meshes) if(m.skeleton.bones.length!==n||m.skeleton.bones.some((b,i)=>b!==bones[i])) throw new Error('the meshes do not share one skeleton');
  const B=bones.map(b=>({name:b.name,parent:bones.indexOf(b.parent),p:b.position.clone(),q:b.quaternion.clone()}));
  const RP=[], RQ=[]; for(const b of bones){ const p=new V3(), q=new THREE.Quaternion(); b.matrixWorld.decompose(p,q,_cgv1); RP.push(p); RQ.push(q); }
  // bones by their Blender names (the loader strips the dots: "thigh.L" becomes "thighL"; the skin's joints keep them)
  const I={}, json=g.parser.json, jn=(json.skins&&json.skins[0]&&json.skins[0].joints)||[];
  B.forEach((b,i)=>{ I[b.name]=i; const nd=json.nodes[jn[i]]; if(nd&&nd.name) I[nd.name]=i; });
  const len=B.map((b,i)=>{ const c=B.findIndex(x=>x.parent===i); return c>=0?RP[c].distanceTo(RP[i]):0; });
  const byMat=new Map(); for(const m of meshes){ const L=byMat.get(m.material)||[]; L.push(m.geometry); byMat.set(m.material,L); }
  const geo=[]; for(const [mat,L] of byMat) geo.push({geo:cgMerge(L),mat:cgMat(mat,json)});
  let tris=0; for(const x of geo) tris+=x.geo.index.count/3;
  const P={kind,B,RP,RQ,I,len,inv:sk.boneInverses.map(m=>m.clone()),geo,tris,root:B.findIndex(b=>b.parent<0),k:CG_K[kind],need:[]};
  const need=(...names)=>{ for(const nm of names) if(I[nm]===undefined) throw new Error('missing bone '+nm); };
  // the model faces +z with its ".L" side at +x, which is the game's right (rightW): bone side L ↔ game R
  P.side=[{X:'L',gs:'R',sd:1},{X:'R',gs:'L',sd:-1}];
  if(kind==='wyvern'){
    need('root','pelvis','spine','chest','neck_01','neck_02','neck_03','head','jaw','tail_01','tail_06');
    for(const X of ['L','R']) need('thigh.'+X,'shin.'+X,'foot.'+X,'toe.'+X,'wing_shoulder.'+X,'wing_upper.'+X,'wing_fore.'+X,'wing_thumb.'+X,'finger_1_a.'+X,'finger_4_b.'+X);
    P.tail=['tail_01','tail_02','tail_03','tail_04','tail_05','tail_06'].map(nm=>I[nm]); P.neck=['neck_01','neck_02','neck_03'].map(nm=>I[nm]);
    // the rig's resting frames (an idle wyvern facing +z): the model's rest pose is what they map onto
    const o={P:new V3(),M:new V3(),C:new V3(),N:new V3(),H:new V3(),f:new V3(),r:new V3(),rc:new V3(),n:new V3(),d1:new V3(),d2:new V3(),hd:new V3(),hu:new V3()};
    const id=POSES.knight.idle; crFrame({s:1,face:0},{yaw:0,twist:0,crouch:id.crouch||0,jump:0,look:0},new V3(),id.lean||0,0,o,0);
    P.N={pel:cgFrameZ(new THREE.Quaternion(),o.d1,o.n).invert(),chest:cgFrameZ(new THREE.Quaternion(),o.d2,o.n).invert(),head:cgFrameZ(new THREE.Quaternion(),o.hd,o.hu).invert()};
    // a seat on the back between the wing roots (the model leaves it smooth for the rider): the highest point of the
    // back above the spine bone, kept relative to that bone
    const sp=RP[I.spine], ch=RP[I.chest], z0=lerp(sp.z,ch.z,.25), z1=lerp(sp.z,ch.z,.65); let top=-1e9;
    for(const x of geo){ if(!/Main|Armor/.test(x.mat.name)) continue;   // the hide and its plates, not the crystal spikes
      const a=x.geo.attributes.position; for(let i=0;i<a.count;i++){ const px=a.getX(i), py=a.getY(i), pz=a.getZ(i); if(Math.abs(px)<.22&&pz>z0&&pz<z1&&py>top) top=py; } }
    const seat=new V3(0,top>-1e8?top:sp.y+.4,lerp(sp.z,ch.z,.45));
    P.seat=seat.sub(sp).applyQuaternion(RQ[I.spine].clone().invert());
    // the snout: how far the head reaches along the head bone (for the breath's origin)
    P.snout=1.15;
  } else {
    need('root','pelvis','spine','chest','neck','head','jaw','tail_01','tail_03');
    for(const X of ['L','R']) need('thigh.'+X,'shin.'+X,'foot.'+X,'toe.'+X,'shoulder.'+X,'upper_arm.'+X,'forearm.'+X,'hand.'+X,'wing_finger_1_a.'+X,'wing_finger_4_b.'+X);
    P.tail=['tail_01','tail_02','tail_03'].map(nm=>I[nm]);
    const id=POSES.bat.idle, l0=id.lean||0, up0=new V3(0,Math.cos(l0),Math.sin(l0)), X=new V3(1,0,0);
    P.N={pel:cgFrameY(new THREE.Quaternion(),up0,X).invert(),chest:cgFrameY(new THREE.Quaternion(),up0,X).invert(),head:cgFrameY(new THREE.Quaternion(),up0,X).invert()};
  }
  // limbs: the hinge of each two-bone chain as the bones carry it at rest (the local axis that is the bend's normal)
  const hinge=(a,b,c)=>{ const d1=RP[b].clone().sub(RP[a]).normalize(), d2=RP[c].clone().sub(RP[b]).normalize(), nrm=new V3().crossVectors(d1,d2).normalize();
    return {a:nrm.clone().applyQuaternion(RQ[a].clone().invert()),b:nrm.clone().applyQuaternion(RQ[b].clone().invert())}; };
  P.legs=P.side.map(S=>{ const X=S.X, th=I['thigh.'+X], sh=I['shin.'+X], ft=I['foot.'+X], to=I['toe.'+X];
    return Object.assign({},S,{th,sh,ft,to,hg:hinge(th,sh,ft),l1:len[th],l2:len[sh],l3:len[ft],toeH:RP[to].y,
      dm:RP[to].clone().sub(RP[ft]).normalize()}); });   // the metatarsal's rest direction, hock → toe
  if(kind==='wyvern') P.wings=P.side.map(S=>{ const X=S.X, sh=I['wing_shoulder.'+X], up=I['wing_upper.'+X], fo=I['wing_fore.'+X];
      return Object.assign({},S,{sh,up,fo,th:I['wing_thumb.'+X],hg:hinge(up,fo,I['finger_1_a.'+X]),l1:len[up],l2:len[fo],
        fa:[1,2,3,4].map(i=>I['finger_'+i+'_a.'+X]),fb:[1,2,3,4].map(i=>I['finger_'+i+'_b.'+X])}); });
  else P.arms=P.side.map(S=>{ const X=S.X, sh=I['shoulder.'+X], up=I['upper_arm.'+X], fo=I['forearm.'+X], hd=I['hand.'+X];
      return Object.assign({},S,{sh,up,fo,hd,hg:hinge(up,fo,hd),l1:len[up],l2:len[fo],
        fa:[1,2,3,4].map(i=>I['wing_finger_'+i+'_a.'+X]),fb:[1,2,3,4].map(i=>I['wing_finger_'+i+'_b.'+X])}); });
  // the wing's fingers turn about the wing's hinge (the elbow's axis, the wing's normal), held in each finger's parent:
  // fax, that axis in the parent's frame; frest, the finger's rest angle about it from the forearm (negative: toward
  // the trailing edge). Turning about a fixed hinge, a finger unfolds from its fold without the flip a 180° aim has.
  for(const W of P.wings||P.arms){ const e=W.hd!==undefined?W.hd:W.fa[0], u=RP[W.fo].clone().sub(RP[W.up]).normalize(), f=RP[e].clone().sub(RP[W.fo]).normalize(), n=new V3().crossVectors(u,f).normalize();
    W.fax=W.fa.map(a=>n.clone().applyQuaternion(RQ[B[a].parent].clone().invert()));
    W.frest=W.fa.map(a=>{ const c=B.findIndex(x=>x.parent===a), d=RP[c].clone().sub(RP[a]).normalize(); return Math.atan2(n.dot(new V3().crossVectors(f,d)),f.dot(d)); });
    // the bat's spread: its fingers fanned from along the forearm back to the legs (angles from the forearm), reached
    // from the fold by turning the way the wing opens (through the trailing side)
    if(P.arms) W.fun=[-.1,-.55,-1.08,-1.65].map((t,q)=>{ const d=t-W.frest[q]; return ((d%(2*Math.PI))+2*Math.PI)%(2*Math.PI); }); }
  return P;
}

/* ---------- an instance: its own bones and skeleton, the shared geometry and materials ---------- */
function cgMake(u){
  const P=CG.P[CG_KIND[u.type]]; if(!P) return null;
  const bones=P.B.map(b=>{ const o=new THREE.Bone(); o.name=b.name; o.position.copy(b.p); o.quaternion.copy(b.q); return o; });
  P.B.forEach((b,i)=>{ if(b.parent>=0) bones[b.parent].add(bones[i]); });
  const root=new THREE.Group(); root.name='creature '+P.kind+' #'+u.id; root.add(bones[P.root]);
  const skel=new THREE.Skeleton(bones,P.inv);
  for(const x of P.geo){ const m=new THREE.SkinnedMesh(x.geo,x.mat); m.bind(skel,CG_ID); m.frustumCulled=false; m.castShadow=true; root.add(m); }
  scene.add(root);
  const st=()=>({b:new V3(),ok:false});
  return {P,root,bones,skel,k:P.k*u.s/(u.T.s||u.s),q:P.B.map(b=>b.q.clone()),qw:P.B.map(()=>new THREE.Quaternion()),pw:P.B.map(()=>new V3()),
    ik:{l:[st(),st()],w:[st(),st()]},kw:[0,0],curl:[.05,.05],rw:[0,0],armW:0,nr:0,nq:[0,1,2,3].map(()=>new THREE.Quaternion()),nqOK:false,jaw:0,jv:0,wrT:[new V3(),new V3()],wrOK:false,cw:[new V3(0,0,1),new V3(0,0,1)],cwOK:false,dy:0,need:-1e9,fs:[0,1].map(()=>({p:new V3(),from:new V3(),to:new V3(),sw:new V3(),t:-1,own:false,swOn:false,init:false})),lp:null,tail:{d:P.tail.map(()=>new V3()),v:P.tail.map(()=>new V3()),init:false},t:-1,
    seat:new V3(),seatOK:false,head:new V3(),hd:new V3(0,0,1),mouth:new V3(),toeT:[new V3(),new V3()],hock:[new V3(),new V3()],handT:[new V3(),new V3()],posed:0,decap:false};
}
// a creature model replaces the procedural body: the gear groups of the old body go, the model joins the scene
function cgAttach(u){
  if(u.cg||u.statue||!CG_KIND[u.type]) return !!u.cg;
  if(!CG.started) cgStart();
  if(!CG.ready||!CG.P[CG_KIND[u.type]]) return false;
  const I=cgMake(u); if(!I) return false; u.cg=I; CG.live.add(I);
  const G=u.G; if(G) for(const k in G){ if(/^c_|^bw[LR]$/.test(k)&&G[k]&&G[k].isObject3D){ dropRoot(G[k]); delete G[k]; } }
  return true;
}
function cgReset(I){ for(const st of I.ik.l.concat(I.ik.w)){ st.ok=false; st.n=null; } I.kw[0]=I.kw[1]=0; I.curl[0]=I.curl[1]=.05; I.rw[0]=I.rw[1]=0; I.armW=-1; I.cwOK=false; I.nr=0; I.nqOK=false; I.wrOK=false; I.dy=0; I.need=-1e9; I.tail.init=false; for(const f of I.fs) f.init=false; }
function cgDrop(u){ const I=u.cg; if(!I) return; CG.live.delete(I); scene.remove(I.root); I.skel.dispose(); u.cg=null; }

/* ---------- bone helpers: world rotation (qw) and head position (pw) kept per bone as it is posed, parents first ---------- */
function cgPos(I,i){ const b=I.P.B[i]; I.pw[i].copy(b.p).multiplyScalar(I.k).applyQuaternion(I.qw[b.parent]).add(I.pw[b.parent]); }
function cgSetW(I,i,q){ const pi=I.P.B[i].parent; I.qw[i].copy(q); I.q[i].copy(I.qw[pi]).invert().multiply(q); cgPos(I,i); }
function cgRest(I,i){ const b=I.P.B[i]; I.q[i].copy(b.q); I.qw[i].multiplyQuaternions(I.qw[b.parent],b.q); cgPos(I,i); }
function cgFK(I,i){ const b=I.P.B[i]; I.qw[i].multiplyQuaternions(I.qw[b.parent],I.q[i]); cgPos(I,i); }   // keep its local turn, follow its parent
function cgDelta(I,i,D){ _cgq1.multiplyQuaternions(D,I.P.RQ[i]); cgSetW(I,i,_cgq1); }   // the rig's turn D applied to the model's rest pose
// point the bone (+y) along dir with the smallest swing from where its parent carries it; then, given a hint, turn it
// about dir so that its local axis ax points as near the hint as it can (a hinge kept in its plane)
function cgAim(I,i,dir,ax,hint){
  const b=I.P.B[i]; _cgq1.multiplyQuaternions(I.qw[b.parent],b.q);
  _cgv1.copy(CG_Y).applyQuaternion(_cgq1); _cgv2.copy(dir); const L=_cgv2.length(); if(L<1e-9){ cgSetW(I,i,_cgq1); return; } _cgv2.multiplyScalar(1/L);
  _cgq2.setFromUnitVectors(_cgv1,_cgv2); _cgq1.premultiply(_cgq2);
  if(hint&&ax){ _cgv3.copy(ax).applyQuaternion(_cgq1); _cgv3.addScaledVector(_cgv2,-_cgv3.dot(_cgv2)); _cgv1.copy(hint).addScaledVector(_cgv2,-_cgv2.dot(hint));
    if(_cgv3.lengthSq()>1e-8&&_cgv1.lengthSq()>1e-8){ const a=Math.atan2(_cgv2.dot(_cgfx.crossVectors(_cgv3,_cgv1)),_cgv3.dot(_cgv1)); _cgq2.setFromAxisAngle(_cgv2,a); _cgq1.premultiply(_cgq2); } }
  cgSetW(I,i,_cgq1); }
function cgDir(I,i,out){ return out.copy(CG_Y).applyQuaternion(I.qw[i]); }   // the bone's +y in the world now
function cgCarried(I,i,out){ const b=I.P.B[i]; _cgq3.multiplyQuaternions(I.qw[b.parent],b.q); return out.copy(CG_Y).applyQuaternion(_cgq3); }   // its rest direction as the parent carries it
// write the pose into the bones (the root bone holds the model's place in the world and its scale)
function cgCommit(I){ const r=I.P.root, B=I.bones;
  for(let i=0;i<B.length;i++) if(i!==r) B[i].quaternion.copy(I.q[i]);
  B[r].position.copy(I.pw[r]); B[r].quaternion.copy(I.qw[r]); B[r].scale.setScalar(I.k);
  if(I.decap){ const h=I.P.I.head; B[h].scale.setScalar(1e-4); }
  I.posed++; }
// place the root so that the pelvis bone's head lands on a point, facing yaw
function cgRoot(I,pel,yawQ){ const P=I.P, r=P.root, pi=P.I.pelvis;
  I.qw[r].multiplyQuaternions(yawQ,P.RQ[r]); I.q[r].copy(I.qw[r]);
  _cgv1.copy(P.B[pi].p).multiplyScalar(I.k).applyQuaternion(I.qw[r]); I.pw[r].copy(pel).sub(_cgv1); }
function cgDt(I){ const t=game.time, dt=I.t<0?1/60:clamp(t-I.t,0,1/20); I.t=t; return dt; }
const _cgc1=new V3(),_cgc2=new V3(),_cgc3=new V3(),_cgc4=new V3(),_cgc5=new V3(),_cgc6=new V3(),_cgc7=new V3(),_cgc8=new V3();   // the pose functions' own
const _cgy=new THREE.Quaternion(), _cgD1=new THREE.Quaternion(), _cgD2=new THREE.Quaternion(), _cgD3=new THREE.Quaternion(), _cgD4=new THREE.Quaternion();
// a direction turned from a toward b by the fraction t of the angle between them (a rotation, not a mix: a mix of two
// directions far apart passes near zero and flips; out may be a or b)
const _cgSD=new V3(),_cgSA=new V3(),_cgSK=new V3();
const cgSlerpDir=(out,a,b,t)=>{ _cgSA.copy(a).normalize(); _cgSD.copy(b).normalize(); const d=clamp(_cgSA.dot(_cgSD),-1,1);
  if(d>.9999) return out.copy(_cgSA).lerp(_cgSD,t).normalize();
  _cgSK.crossVectors(_cgSA,_cgSD); if(_cgSK.lengthSq()<1e-10){ _cgSK.set(0,1,0).cross(_cgSA); if(_cgSK.lengthSq()<1e-8) _cgSK.set(1,0,0).cross(_cgSA); }
  _cgSK.normalize(); const th=Math.acos(d)*t; _cgSD.crossVectors(_cgSK,_cgSA);
  return out.copy(_cgSA).multiplyScalar(Math.cos(th)).addScaledVector(_cgSD,Math.sin(th)); };

/* ---------- legs: two-bone IK on the model's bones (thigh, shin) to a hock above the toe; the metatarsal and toes follow ---------- */
// toe: where the toe bone's head goes; dm: the metatarsal's direction (hock → toe); fwd: the body's forward (the knee
// stays in front of it); curl: toes bent down (a lifted foot). Returns the hock it reached.
const _cgL1=new V3(),_cgL2=new V3(),_cgL3=new V3(),_cgL4=new V3(),_cgL5=new V3(),_cgL6=new V3(),_cgL7=new V3(),_cgL8=new V3();
const _cgLT=new V3();
function cgLeg(I,L,st,toe0,dm,fwd,curl,mt,planted,aw){
  const k=I.k; cgRest(I,L.th);
  const hip=I.pw[L.th], toe=_cgLT.copy(toe0);
  // a lifted foot is kept half a leg from the hip (the rig's longer legs swing their feet up under its hips; the
  // model's, folded that tight, would have no room to bend)
  if(!planted){ _cgL5.subVectors(toe,hip); const td=_cgL5.length(), tmin=.5*(L.l1+L.l2+L.l3)*k; if(td<tmin&&td>1e-4){ toe.copy(hip).addScaledVector(_cgL5,tmin/td); toe.y=Math.max(toe.y,H(toe.x,toe.z)+L.toeH*k); } }
  const hock=_cgL1.copy(toe).addScaledVector(dm,-L.l3*k);
  // a foot drawn up close under the hip (a deep crouch, a high step): the hock swings back, still a metatarsal from
  // the toe, until the thigh and shin have room to bend (a hock at the hip leaves their bend undefined: it flips)
  const rmin=.42*(L.l1+L.l2)*k;
  for(let it=0;it<2;it++){ _cgL5.subVectors(hock,hip); const d=_cgL5.length(); if(d>=rmin) break;
    if(d<1e-4) _cgL5.copy(fwd).negate(); else _cgL5.multiplyScalar(1/d); _cgL5.addScaledVector(fwd,-.5).normalize();   // out, and behind
    _cgL5.multiplyScalar(rmin).add(hip).sub(toe); const t=_cgL5.length(); if(t<1e-4) break; hock.copy(toe).addScaledVector(_cgL5,L.l3*k/t); }
  // body height: how far this planted leg needs the hips lowered (+) or could let them rise (-) to reach its hock
  if(planted){ const d=hip.distanceTo(hock), reach=(L.l1+L.l2)*k*.96, dy=Math.max(.3*d,hip.y-hock.y); const need=(d-reach)*d/dy; if(need>I.need) I.need=need; }
  _cgL2.copy(hip).addScaledVector(fwd,1.2*k).addScaledVector(UP,-.35*k);   // the knee bends forward
  _cgL5.copy(UP).addScaledVector(fwd,.3);
  ik2(hip,hock,L.l1*k,L.l2*k,_cgL2,_cgL3,_cgL4,st,_cgL5,mt,fwd);
  _cgL6.subVectors(_cgL3,hip); _cgL7.subVectors(_cgL4,_cgL3);
  // the knee's hinge: the side the solver bends it to (kept by ik2 from frame to frame, so a leg run straight still
  // knows its plane: no twist popping in and out)
  cgHingeN(_cgL8,st,hip,hock); const bent=true;
  cgAim(I,L.th,_cgL6,bent?L.hg.a:null,bent?_cgL8:null);
  cgAim(I,L.sh,_cgL7,bent?L.hg.b:null,bent?_cgL8:null);
  cgFK(I,L.ft); _cgL6.subVectors(toe,I.pw[L.ft]); cgAim(I,L.ft,_cgL6.lengthSq()>1e-10?_cgL6:dm);   // (from where the shin now puts the hock)
  // toes: forward along the ground, bent down when the foot is off it; aloft (aw) as the foot carries them
  _cgL6.copy(fwd).multiplyScalar(Math.cos(curl)).addScaledVector(UP,-Math.sin(curl));
  if(aw>.001){ cgCarried(I,L.to,_cgL5); cgSlerpDir(_cgL6,_cgL6,_cgL5,aw); }
  cgAim(I,L.to,_cgL6);
  return _cgL4;
}
// where the model's foot is: the game's foot (u.feet: planted, or stepping), unless that planted foot is out of the
// model's reach (its legs are shorter than the rig's; a spin turns the hips away from it): then the model takes a
// step of its own to the nearest ground it can reach, and steps back onto the game's foot once that is in reach again.
// A game step that starts meanwhile starts from where the model's foot is. (p: the toe on the ground; t: own step)
const _cgS1=new V3();
function cgFoot(I,L,fs,ft,dt,free){
  const k=I.k, G=ft.pos; cgRest(I,L.th); const hip=I.pw[L.th], R=(L.l1+L.l2+L.l3)*k*.95;
  if(!fs.init){ fs.p.copy(G); fs.t=-1; fs.own=fs.swOn=false; fs.init=true; return; }
  if(ft.t>=0){   // the game's step
    if(fs.own||fs.t>=0){ fs.sw.copy(fs.p); fs.swOn=true; fs.own=false; fs.t=-1; }
    if(fs.swOn){ const e=smooth(clamp(ft.t,0,1)); fs.p.lerpVectors(fs.sw,G,e); fs.p.y=G.y+(1-e)*(fs.sw.y-H(fs.sw.x,fs.sw.z)); } else fs.p.copy(G);
    return; }
  fs.swOn=false;
  if(fs.t>=0){ fs.t+=dt/fs.dur;
    if(!fs.home) cgReachable(fs.to,hip,G,R); else fs.to.copy(G);
    const e=smooth(Math.min(fs.t,1)); fs.p.lerpVectors(fs.from,fs.to,e); fs.p.y=H(fs.p.x,fs.p.z)+.12*k*Math.sin(Math.PI*Math.min(fs.t,1));
    if(fs.t>=1){ fs.t=-1; fs.p.y=H(fs.p.x,fs.p.z); fs.own=!fs.home; }
    return; }
  if(!fs.own) fs.p.copy(G);
  if(!free) return;   // kicking: no steps
  const far=fs.p.distanceTo(hip)>R;
  if(far||(fs.own&&G.distanceTo(hip)<R*.9&&fs.p.distanceTo(G)>.08*k)){
    fs.home=!far&&fs.own; fs.from.copy(fs.p); fs.t=0; fs.dur=.17*Math.sqrt(k); if(fs.home) fs.to.copy(G); else cgReachable(fs.to,hip,G,R); }
}
// the ground point toward G that the leg reaches comfortably (well inside its full reach, under the hip)
function cgReachable(out,hip,G,R){
  const gy=H(G.x,G.z), dv=Math.max(0,hip.y-gy), rh=Math.sqrt(Math.max(0,R*R*.7-dv*dv));
  _cgS1.set(G.x-hip.x,0,G.z-hip.z); const d=_cgS1.length(); if(d>rh*.75) _cgS1.multiplyScalar(rh*.75/d);
  out.set(hip.x+_cgS1.x,0,hip.z+_cgS1.z); out.y=H(out.x,out.z); return out; }
// the hinge's normal for a two-bone chain ik2 solved from root toward end: the bend side ik2 keeps (st.b) across the
// line root → end; d1 × d2 has the same sign for the chain it solved (upper × lower = -(a × b))
const _cgH1=new V3(),_cgH2=new V3();
function cgHingeN(out,st,root,end){ _cgH1.subVectors(end,root); if(_cgH1.lengthSq()<1e-10) _cgH1.set(0,-1,0); _cgH1.normalize();
  out.crossVectors(st.b,_cgH1); if(out.lengthSq()<1e-10) out.set(1,0,0); return out.normalize(); }
// for a chain whose solved directions are then turned toward a pose (a wing spread): that pose's own bend where it is
// bent, the solver's as it straightens
function cgHinge(out,d1,d2,st,root,end){ _cgH2.crossVectors(d1,d2); const s=_cgH2.length(); cgHingeN(out,st,root,end);
  if(s>1e-6){ _cgH2.multiplyScalar(1/s); cgSlerpDir(out,out,_cgH2,clamp(s/.35,0,1)); } return out; }
// the hips sink when a planted leg can't reach its foot (the model's legs are shorter than the rig's), and rise back
function cgHips(I,dt){ const D=clamp(I.dy+(I.need>-1e8?I.need:-I.dy),0,.9*I.k); I.dy+=(D-I.dy)*(1-Math.exp(-dt*(D>I.dy?16:5))); I.need=-1e9; }

/* ---------- tail: a damped spring chain (follow-through), lifted and swept by the clip ---------- */
const _cgT1=new V3(),_cgT2=new V3(),_cgT3=new V3();
function cgTail(I,right,lift,sweep,sway,alive,dt,clear){
  const P=I.P, T=I.tail, n=P.tail.length, k=I.k;
  for(let m=0;m<n;m++){ const i=P.tail[m], w=(m+1)/n;
    if(m===0) cgRest(I,i); else cgFK(I,i);   // its head follows the segment before
    cgCarried(I,i,_cgT1);
    if(alive){ _cgT1.applyAxisAngle(right,lift*(.12+.16*w)).applyAxisAngle(UP,(sweep+sway*w)*(.1+.14*w)); }
    else { _cgT1.y-=.55*w; _cgT1.normalize(); }   // dead: it droops to the ground
    const d=T.d[m], v=T.v[m];
    if(!T.init){ d.copy(_cgT1); v.set(0,0,0); }
    else if(dt>0){ const K=(alive?120:40)/(1+m*.55), C=2*Math.sqrt(K)*.8;
      _cgT2.subVectors(_cgT1,d).multiplyScalar(K).addScaledVector(v,-C); v.addScaledVector(_cgT2,dt); d.addScaledVector(v,dt).normalize();
      const c=d.dot(_cgT1); if(c<.6){ d.lerp(_cgT1,(.6-c)/1.6).normalize(); v.multiplyScalar(.5); } }   // never far off its target: no wild swings
    // keep the segment's end off the ground
    _cgT3.copy(I.pw[i]).addScaledVector(d,(P.len[i]||P.len[P.tail[Math.max(0,m-1)]])*k); const g=H(_cgT3.x,_cgT3.z)+clear*k*(1-.6*w);
    if(_cgT3.y<g){ _cgT3.y=g; d.subVectors(_cgT3,I.pw[i]).normalize(); }
    cgAim(I,i,d); }
  T.init=true;
}
const _cgJ=new V3(),_cgWT=new V3();
function cgJaw(I,a){ const P=I.P, j=P.I.jaw, h=P.I.head; cgRest(I,j); _cgJ.set(1,0,0).applyQuaternion(I.qw[h]); _cgq4.setFromAxisAngle(_cgJ,a); _cgq4.multiply(I.qw[j]); cgSetW(I,j,_cgq4); }
const _cgW1=new V3(),_cgW2=new V3(),_cgW3=new V3(),_cgW4=new V3(),_cgW5=new V3(),_cgW6=new V3(),_cgW7=new V3(),_cgW8=new V3(),_cgWP=new V3(),_cgWK=new V3(),_cgWE=new V3(),_cgWA=new V3();

/* ---------- the Wyvern: posed from the four-limbed rig (27-hellcrawler) and its wings (27f) ---------- */
const CG_NECKW=[.3,.58,.84];
// how far each neck joint and the head may turn from the model's rest pose (rad): a long neck bends over many joints,
// each a little — the curve comes from all of them, never one hinge
const CG_NECKLIM=[.8,.62,.62,.72];
const _cgN1=new V3(),_cgN2=new V3(),_cgN3=new V3(),_cgN4=new V3(),_cgN5=new V3(),_cgN6=new V3(),_cgNq1=new THREE.Quaternion(),_cgNq2=new THREE.Quaternion();
// keep bone i's local turn within max of its rest (a cone-and-twist limit, as a quaternion angle)
function cgLimitJ(I,i,max){ const b=I.P.B[i]; _cgNq1.copy(b.q).invert().multiply(I.q[i]); const w=Math.min(1,Math.abs(_cgNq1.w)), ang=2*Math.acos(w);
  if(ang<=max) return; _cgNq2.identity().slerp(_cgNq1,max/ang); _cgNq1.copy(b.q).multiply(_cgNq2);
  _cgNq2.multiplyQuaternions(I.qw[b.parent],_cgNq1); cgSetW(I,i,_cgNq2); }
function cgNeckLimits(I){ const P=I.P; for(let m=0;m<4;m++){ const ji=m<3?P.neck[m]:P.I.head; if(m) cgFK(I,ji); cgLimitJ(I,ji,CG_NECKLIM[m]); } }
// the bite: cyclic coordinate descent over head and neck (the method of three.js's CCDIKSolver, examples/jsm/animation
// in r128: from the effector's parent outward, each step's turn capped, each joint then held in its limits) bringing the
// model's jaws — not its skull's root — to where the game's bite lands (the rig's mouth), so the head pitches with the
// neck instead of hinging down at its root
function cgNeckReach(u,I,w){ const P=I.P, Ix=P.I, k=I.k, L=[Ix.head,P.neck[2],P.neck[1],P.neck[0]], lim=[CG_NECKLIM[3],CG_NECKLIM[2],CG_NECKLIM[1],CG_NECKLIM[0]];
  _cgN1.copy(u.j.head).addScaledVector(u.cr.hd,.55*u.s);
  for(let it=0;it<3;it++) for(let l=0;l<4;l++){ const ji=L[l];
    cgDir(I,Ix.head,_cgN2); _cgN3.copy(I.pw[Ix.head]).addScaledVector(_cgN2,P.snout*.7*k);
    _cgN4.subVectors(_cgN3,I.pw[ji]); _cgN5.subVectors(_cgN1,I.pw[ji]); if(_cgN4.lengthSq()<1e-6||_cgN5.lengthSq()<1e-6) continue;
    _cgN4.normalize(); _cgN5.normalize(); const ang=Math.acos(clamp(_cgN4.dot(_cgN5),-1,1)); if(ang<1e-4) continue;
    _cgN6.crossVectors(_cgN4,_cgN5); if(_cgN6.lengthSq()<1e-10) continue; _cgN6.normalize();
    _cgNq1.setFromAxisAngle(_cgN6,Math.min(ang,.22)*w); _cgNq2.multiplyQuaternions(_cgNq1,I.qw[ji]); cgSetW(I,ji,_cgNq2); cgLimitJ(I,ji,lim[l]);
    for(let q=4-l;q<3;q++) cgFK(I,P.neck[q]); if(l) cgFK(I,Ix.head); } }
const CG_NECKS=[-.2,.03,.19];   // the S: the base pitched up, the top down (about the chest's right; - raises)
const CG_NECKR=[26,19,15,12];   // how quickly each neck segment and the head follow (per second)
function cgPoseWyvern(u){
  const I=u.cg, P=I.P, cr=u.cr, j=u.j, F=u.wy, p=u.ps||{}, k=I.k, alive=u.alive, dt=cgDt(I), Ix=P.I;
  // body frames from the rig, carried onto the model's rest pose
  _cgc1.set(cr.f.x,0,cr.f.z); if(_cgc1.lengthSq()<1e-6) _cgc1.copy(u.fwdW); _cgc1.y=0; _cgc1.normalize();
  _cgc6.set(_cgc1.z,0,-_cgc1.x);   // the body's right
  _cgy.setFromUnitVectors(_cgc2.set(0,0,1),_cgc1);
  _cgc8.copy(j.pelvis); I.dyA=I.dy; _cgc8.y-=I.dy; cgRoot(I,_cgc8,_cgy);
  cgFrameZ(_cgD1,cr.d1,cr.n).multiply(P.N.pel);   // the pelvis turns with the rig's hips…
  cgFrameZ(_cgD2,cr.d2,cr.n).multiply(P.N.chest);   // …the chest with its shoulders…
  cgFrameZ(_cgD3,cr.hd,cr.hu).multiply(P.N.head);   // …the head with its head
  cgDelta(I,Ix.pelvis,_cgD1); _cgD4.slerpQuaternions(_cgD1,_cgD2,.5); cgDelta(I,Ix.spine,_cgD4); cgDelta(I,Ix.chest,_cgD2);
  // the neck spreads the head's turn over its three segments; the neck channel raises it (+) or thrusts it low (-)
  // a living neck is an S: its base rises from the chest, its top curves forward and down to a level head (the curve
  // straightens when it thrusts low or stretches out in flight); in flight the neck takes up the body's heave so the
  // head stays steadier than the body (as birds' do)
  const raise=alive?clamp(p.neck||0,-1,1):0; _cgc3.set(1,0,0).applyQuaternion(I.qw[Ix.chest]);
  const fly=F?clamp(F.sp||0,0,1):0, Sc=alive?(1-.6*fly)*(1-.5*Math.max(0,-raise))*(1-.7*I.nr):0, hv=alive&&fly>.02?wyBeat(F.ph/TAU-.14,F.dn||.58)*(F.amp||0)*fly*.1:0;
  for(let m=0;m<3;m++){ _cgD4.slerpQuaternions(_cgD2,_cgD3,CG_NECKW[m]);
    const a=-raise*.22+Sc*CG_NECKS[m]+hv*(m===0?1:m===2?-1:0); if(a){ _cgq4.setFromAxisAngle(_cgc3,a); _cgD4.premultiply(_cgq4); } cgDelta(I,P.neck[m],_cgD4); }
  // the head lifts a little as the jaws open wide (a roar, a bite's gape)
  const jo=alive?clamp(I.jaw,0,1):0; if(jo>.25){ _cgq4.setFromAxisAngle(_cgc3,-(jo-.25)*.2); _cgD3.premultiply(_cgq4); }
  cgDelta(I,Ix.head,_cgD3);
  // during a strike (and a finisher) the neck reaches toward the rig's head, so a bite lands where the game aims it
  // (eased: a looping clip ends without a blend out)
  I.nr+=((alive?clamp((u.crAW||0)*(u.action&&!u.action.c.idle?1:0),0,1)*.75:0)-I.nr)*(1-Math.exp(-dt*12)); const reach=I.nr;
  if(reach>.01) cgNeckReach(u,I,reach);
  // every neck joint and the head within its range of motion (no joint folded at a right angle: the neck curves)
  cgNeckLimits(I);
  // overlapping action: the neck's base turns first, each segment after it a little later, the head last (a heavy neck
  // has inertia); a strike tightens it so the bite still lands where the game aims it
  if(alive&&I.nqOK){ const tk=1+3*reach; for(let m=0;m<4;m++){ const ji=m<3?P.neck[m]:Ix.head;
      _cgq4.copy(I.nq[m]).slerp(I.qw[ji],1-Math.exp(-dt*CG_NECKR[m]*tk)); cgSetW(I,ji,_cgq4); } }
  for(let m=0;m<4;m++) I.nq[m].copy(I.qw[m<3?P.neck[m]:Ix.head]); I.nqOK=true;
  if(u.decapped&&!alive) I.decap=true;
  // the jaw: a muscle, not a switch — it opens with a little ease, snaps shut fast and the teeth clack (a small bounce),
  // and a wide-open roar trembles
  { const tgt=clamp(cr.jaw,0,1), opening=tgt>I.jaw, w=opening?16:34, z=opening?1:.55;
    I.jv+=(w*w*(tgt-I.jaw)-2*z*w*I.jv)*dt; I.jaw+=I.jv*dt; if(I.jaw<-.06){ I.jaw=-.06; I.jv=-I.jv*.35; }
    if(!alive){ I.jaw=tgt; I.jv=0; }
    const tr=I.jaw>.55&&alive?Math.sin(game.time*41+u.id)*.03*(I.jaw-.55)/.45:0;
    cgJaw(I,.04+clamp(I.jaw+tr,-.04,1.05)*.62); }
  const sp=clamp(u.spd/u.T.speed,0,1), sway=alive?Math.sin(game.time*2.1+u.id)*(.35+.25*(1-sp)):0;
  const tfl=alive&&fly>.02?fly*(-.25+.2*wyBeat(F.ph/TAU-.3,F.dn||.58)*(F.amp||0)):0;
  cgTail(I,_cgc6,alive?clamp((p.tup||0)+(p.alt||0)*.45+tfl,-1.2,1.6):0,alive?clamp((p.tsw||0)-(p.twist||0)*.8,-1.5,1.5):0,sway,alive,dt,.22);
  // legs: the rig's planted (or tucked) toes; the metatarsal at the model's own angle unless a kick or the air tilts it
  const mt=clamp(dt*13,.12,.45)*3, air=alive&&!!(F&&F.air);
  const kk=alive?p.kick||0:0;
  for(let s=0;s<2;s++){ const L=P.legs[s], gi=L.gs==='R'?1:0, ft=u.feet[gi], toeJ=gi?j.fR:j.fL, ank=gi?cr.aR:cr.aL;
    const kwk=clamp(kk>0?(gi?kk:0):-kk,0,1), T=I.toeT[s];   // this leg's share of a kick (the rig's rule: + the right leg, - both)
    if(alive&&!air&&ft){ cgFoot(I,L,I.fs[s],ft,dt,kwk<.05); T.copy(I.fs[s].p); if(kwk>0) T.lerp(toeJ,kwk); } else { T.copy(toeJ); I.fs[s].init=false; }
    T.y+=L.toeH*k;
    _cgc7.copy(L.dm).applyQuaternion(_cgy);   // the rest metatarsal, turned to the heading
    const sm=1-Math.exp(-dt*10);
    I.kw[s]+=((alive?clamp(Math.max(Math.abs(p.kick||0),air?1:0,ft&&ft.t>=0?.35:0),0,1):1)-I.kw[s])*sm; const kw=I.kw[s];
    if(kw>.001){ _cgc8.subVectors(toeJ,ank); if(_cgc8.lengthSq()>1e-8){ _cgc8.normalize(); cgSlerpDir(_cgc7,_cgc7,_cgc8,kw); } }
    I.curl[s]+=((alive?(air?.7:ft&&ft.t>=0?.15+.45*Math.sin(Math.PI*clamp(ft.t,0,1)):.04):.5)-I.curl[s])*sm;
    const planted=alive&&!air&&!!ft&&ft.t<0&&I.fs[s].t<0&&kwk<.05;
    I.rw[s]+=((air||!alive?1:0)-I.rw[s])*sm;
    I.hock[s].copy(cgLeg(I,L,I.ik.l[s],T,_cgc7,_cgc1,I.curl[s],mt,planted,I.rw[s])); }
  cgHips(I,dt);
  cgWyWings(u,I,p,alive,dt);
  // the head as the model shows it: the breath leaves its mouth, the rider sits on its back
  I.head.copy(I.pw[Ix.head]); cgDir(I,Ix.head,I.hd); I.mouth.copy(I.head).addScaledVector(I.hd,P.snout*k);
  if(F){ F.head.copy(I.head); F.hd.copy(I.hd); F.mouth.copy(I.mouth); }
  I.seat.copy(P.seat).multiplyScalar(k).applyQuaternion(I.qw[Ix.spine]).add(I.pw[Ix.spine]); I.seatOK=alive;
  cgCommit(I);
}
const CG_FINGER=[0,.36,.7,1];
// a finger: its a bone turned by phi about the wing's hinge (ax, in its parent's frame) from its rest, the b bone carried
// on from it; both tips kept off the ground by the smallest turn that lifts them
const _cgF1=new V3(),_cgF2=new V3(),_cgFq=new THREE.Quaternion(),_cgFr=new THREE.Quaternion();
// (the finger swings up about its root, keeping its heading, until its tip is on the ground; on a slope the tip
// then sits over other ground: again)
function cgFingerTip(I,i,len){ for(let it=0;it<3;it++){
  cgDir(I,i,_cgF2); const p=I.pw[i]; _cgF1.copy(p).addScaledVector(_cgF2,len); const g=H(_cgF1.x,_cgF1.z)+(.06+.02*it)*I.k; if(_cgF1.y>=g-1e-4) return;
  // its heading: its own (the tip stays in the same upright plane: on and off the ground, no sideways jump); only a
  // finger pointing almost straight down, with little heading of its own, borrows its parent's
  const hy=clamp((g-p.y)/len,-1,1), hr=Math.sqrt(1-hy*hy); let hx=_cgF2.x, hz=_cgF2.z, hl=Math.hypot(hx,hz);
  if(hl<.15){ cgDir(I,I.P.B[i].parent,_cgF1); const w=1-hl/.15; hx+=_cgF1.x*w; hz+=_cgF1.z*w; hl=Math.hypot(hx,hz); if(hl<1e-6){ hx=1; hz=0; hl=1; } }
  _cgF1.set(hx/hl*hr,hy,hz/hl*hr); _cgFq.setFromUnitVectors(_cgF2,_cgF1).multiply(I.qw[i]); cgSetW(I,i,_cgFq); } }
function cgFinger(I,a,b,ax,phi){ const B=I.P.B[a], la=I.P.len[a]*I.k;
  _cgFr.setFromAxisAngle(ax,phi).multiply(B.q); _cgFq.multiplyQuaternions(I.qw[B.parent],_cgFr); cgSetW(I,a,_cgFq);
  cgFingerTip(I,a,la); cgRest(I,b); cgFingerTip(I,b,la*.8); }
// the signed angle about n from a to b (both across n)
const _cgA1=new V3();
function cgAngle(a,b,n){ return Math.atan2(n.dot(_cgA1.crossVectors(a,b)),a.dot(b)); }
function cgWyWings(u,I,p,alive,dt){
  const P=I.P, F=u.wy, j=u.j, k=I.k, S=alive?clamp(p.wing||0,0,1):0;
  for(let s=0;s<2;s++){ const Wg=P.wings[s], X=Wg.gs, W=F&&alive?F.W[X]:null, st=I.ik.w[s];
    cgRest(I,Wg.sh); cgRest(I,Wg.up);
    const sh=I.pw[Wg.up];
    // folded: the wing arm reaches the rig's wrist (the knuckle it walks on); spread: it lies along the rig's wing
    const el=W?W.el:j['e'+X], wr=_cgWT.copy(W?W.wr:j['h'+X]);
    // the rig's knuckle can jump (a paw re-planted on landing, a strike's claw target taking over): the model's wrist
    // follows at no more than 16 m/s (at the creature's size), so a jump becomes a quick reach, not a pop
    const wt=I.wrT[s]; if(!I.wrOK) wt.copy(wr); else { _cgW6.subVectors(wr,wt); const d=_cgW6.length(), mx=16*k*dt; if(d>mx) wt.addScaledVector(_cgW6,mx/d); else wt.copy(wr); }
    wr.copy(wt); wr.y=Math.max(wr.y,H(wr.x,wr.z)+.04*k);   // (never under the ground)
    // a knuckle drawn in close under the shoulder (a crouch) is kept out at half the arm, off the ground: an arm folded
    // tighter has no room left to bend
    _cgW6.subVectors(wr,sh); const wd=_cgW6.length(), wmin=.45*(Wg.l1+Wg.l2)*k;
    if(wd<wmin&&wd>1e-4){ wr.copy(sh).addScaledVector(_cgW6,wmin/wd); wr.y=Math.max(wr.y,H(wr.x,wr.z)+.05*k); }
    _cgWP.copy(el).addScaledVector(u.rightW,Wg.sd*.3*k);
    ik2(sh,wr,Wg.l1*k,Wg.l2*k,_cgWP,_cgWK,_cgWE,st);
    _cgW1.subVectors(_cgWK,sh).normalize(); _cgW2.subVectors(_cgWE,_cgWK).normalize();
    if(W&&S>.001){ _cgW3.subVectors(W.el,W.sh).normalize(); _cgW4.subVectors(W.wr,W.el).normalize(); cgSlerpDir(_cgW1,_cgW1,_cgW3,S); cgSlerpDir(_cgW2,_cgW2,_cgW4,S); }
    cgHinge(_cgW5,_cgW1,_cgW2,st,sh,wr); const bent=true;
    cgAim(I,Wg.up,_cgW1,bent?Wg.hg.a:null,bent?_cgW5:null); cgFK(I,Wg.fo); cgAim(I,Wg.fo,_cgW2,bent?Wg.hg.b:null,bent?_cgW5:null);
    cgRest(I,Wg.th); if(S<.98&&alive){ cgCarried(I,Wg.th,_cgW7); _cgW8.copy(u.fwdW).multiplyScalar(.5).addScaledVector(UP,-.85).normalize(); cgSlerpDir(_cgW7,_cgW7,_cgW8,(1-S)*.75); cgAim(I,Wg.th,_cgW7); }
    // fingers: fanned from the rig's leading finger to its trailing one, swept a little toward the membrane's root
    // (each as an angle behind the rig's own forearm, about the rig's wing normal, so the model's arm lagging or
    // differing from the rig's never swings a finger across: then the same angle behind the model's forearm)
    if(W){ _cgW3.subVectors(W.t[0],W.wr).normalize(); _cgW4.subVectors(W.t[2],W.wr).normalize(); _cgW6.subVectors(W.fb,W.wr).normalize(); _cgW4.lerp(_cgW6,.25*S).normalize();
      _cgW2.subVectors(W.wr,W.el).normalize(); _cgWK.subVectors(W.el,W.sh).normalize(); _cgWE.crossVectors(_cgWK,_cgW2); }
    for(let f=0;f<4;f++){ const a=Wg.fa[f], b=Wg.fb[f]; let phi=0;
      if(W){ cgSlerpDir(_cgW7,_cgW3,_cgW4,CG_FINGER[f]); _cgW8.copy(Wg.fax[f]).applyQuaternion(I.qw[I.P.B[a].parent]);
        const sn=_cgWE.length(); if(sn>1e-6){ _cgWA.copy(_cgWE).multiplyScalar(1/sn); if(_cgWA.dot(_cgW8)>0) cgSlerpDir(_cgW8,_cgW8,_cgWA,clamp(sn/.35,0,1)); }
        // behind the forearm: (-π, 0]; one ahead of it held along it, one past the fold at the fold
        let al=cgAngle(_cgW2,_cgW7,_cgW8); if(al>Math.PI/2) al=-Math.PI+.05; else if(al>0) al=0;
        phi=al-Wg.frest[f]; }
      cgFinger(I,a,b,Wg.fax[f],phi); } }
  I.wrOK=true;
}

/* ---------- the Devil Bat: posed from the stick skeleton (21) and the Wing Archer's flight (26) ---------- */
function cgPoseBat(u){
  const I=u.cg, P=I.P, j=u.j, p=u.ps||{}, k=I.k, alive=u.alive, dt=cgDt(I), Ix=P.I, fl=u.fl;
  _cgc1.set(u.fwdW.x,0,u.fwdW.z); if(_cgc1.lengthSq()<1e-6) _cgc1.set(0,0,1); _cgc1.normalize();
  _cgc6.set(_cgc1.z,0,-_cgc1.x);   // right
  _cgy.setFromUnitVectors(_cgc2.set(0,0,1),_cgc1);
  _cgc8.copy(j.pelvis); I.dyA=I.dy; _cgc8.y-=I.dy; cgRoot(I,_cgc8,_cgy);
  _cgc2.subVectors(j.chest,j.pelvis); if(_cgc2.lengthSq()<1e-8) _cgc2.copy(UP);
  _cgc3.subVectors(j.sR,j.sL); if(_cgc3.lengthSq()<1e-8) _cgc3.copy(_cgc6);
  cgFrameY(_cgD1,_cgc2,_cgc6).multiply(P.N.pel); cgFrameY(_cgD2,_cgc2,_cgc3).multiply(P.N.chest);
  _cgc4.subVectors(j.head,j.neck); if(_cgc4.lengthSq()<1e-8) _cgc4.copy(_cgc2);
  const lk=alive?(u.look||0):0; _cgc5.copy(_cgc6).multiplyScalar(Math.cos(lk)).addScaledVector(_cgc1,-Math.sin(lk));
  cgFrameY(_cgD3,_cgc4,_cgc5).multiply(P.N.head);
  cgDelta(I,Ix.pelvis,_cgD1); _cgD4.slerpQuaternions(_cgD1,_cgD2,.5); cgDelta(I,Ix.spine,_cgD4); cgDelta(I,Ix.chest,_cgD2);
  _cgD4.slerpQuaternions(_cgD2,_cgD3,.5); cgDelta(I,Ix.neck,_cgD4); cgDelta(I,Ix.head,_cgD3);
  if(u.decapped&&!alive) I.decap=true;
  cgJaw(I,.03+(alive?clamp(p.draw||0,0,1)*.7:.45));
  const sp=clamp(u.spd/u.T.speed,0,1), sway=alive?Math.sin(game.time*2.6+u.id)*(.4+.3*(1-sp)):0;
  cgTail(I,_cgc6,alive?clamp(p.tup||0,-1.2,1.6):0,alive?clamp((p.tsw||0)-(p.twist||0)*.8,-1.5,1.5):0,sway,alive,dt,.06);
  // legs: on the ground the planted feet; aloft the dangling ones, toes down; a talon kick swings the toes forward
  const air=alive&&!!(fl&&fl.air), mt=clamp(dt*13,.12,.45)*3;
  for(let s=0;s<2;s++){ const L=P.legs[s], gi=L.gs==='R'?1:0, toeJ=gi?j.fR:j.fL, T=I.toeT[s];
    const sm=1-Math.exp(-dt*10), kick=alive&&gi===1?clamp(p.kick||0,0,1):0, ft=u.feet[gi];
    // planted: the stick's foot itself (the ground contact); aloft or kicking: the stick's foot as its leg holds it,
    // carried over from the stick's hip to the model's and scaled to the model's leg (their hips sit apart: an
    // absolute foot tucked up near the model's hip would fold the leg through itself)
    I.rw[s]+=((air||!alive||kick>0?1:0)-I.rw[s])*sm;
    T.copy(toeJ);
    if(I.rw[s]>.001){ const hp=gi?j.hipR:j.hipL, kn=gi?j.kR:j.kL; cgRest(I,L.th);
      const sc=.9*(L.l1+L.l2+L.l3)*k/Math.max(1e-3,hp.distanceTo(kn)+kn.distanceTo(toeJ));   // (a stick leg held straight leaves the model's a little bent: no flipping bend)
      _cgc8.copy(toeJ).sub(hp).multiplyScalar(sc).add(I.pw[L.th]); T.lerp(_cgc8,I.rw[s]); }
    T.y=Math.max(T.y,H(T.x,T.z)); T.y+=L.toeH*k;
    // the metatarsal: at the model's own angle when planted; aloft, kicking or dead along the stick's shin (hanging,
    // tucked, raking forward), so the model's leg lies along the stick's
    _cgc7.copy(L.dm).applyQuaternion(_cgy);
    if(I.rw[s]>.001){ const kn=gi?j.kR:j.kL; _cgc8.subVectors(toeJ,kn); if(_cgc8.lengthSq()>1e-8){ _cgc8.normalize(); cgSlerpDir(_cgc7,_cgc7,_cgc8,I.rw[s]*.85); } }
    I.curl[s]+=((alive?(air?.9-kick*.7:ft&&ft.t>=0?.2+.4*Math.sin(Math.PI*clamp(ft.t,0,1)):.05):.6)-I.curl[s])*sm;
    I.hock[s].copy(cgLeg(I,L,I.ik.l[s],T,_cgc7,_cgc1,I.curl[s],mt,alive&&!air&&!!ft&&ft.t<0&&!kick,I.rw[s])); }
  cgHips(I,dt);
  cgBatArms(u,I,p,alive,air,_cgc1,_cgc6,dt);
  I.head.copy(I.pw[Ix.head]); cgDir(I,Ix.head,I.hd);
  cgCommit(I);
}
// how much a clip holds the claws: clips that author hand targets, with the clip's own blend in and out
function cgHands(u,c){ if(c.hands===undefined){ const r=(RAW[u.type]&&RAW[u.type][c.name])||(RAW.common&&RAW.common[c.name]); c.hands=!!(r&&r.keys&&r.keys.some(x=>x.R||x.L)); } return c.hands; }
function cgArmW(u){ const a=u.action; if(!u.alive) return 1; if(!a) return 0; const c=a.c; if(!cgHands(u,c)) return 0;
  if(u.fin) return 1; return c.loop?1:smooth(clamp(a.t/.12,0,1))*smooth(clamp((c.dur-a.t)/.26,0,1)); }
function cgBatArms(u,I,p,alive,air,f,r,dt){
  const P=I.P, j=u.j, k=I.k, A=u.fl&&u.fl.wing, U=u.spine, aw=cgArmW(u);
  I.armW=I.armW<0?aw:I.armW+(aw-I.armW)*(1-Math.exp(-dt*14));
  const armW=I.armW, airW=air?clamp(1-(u.fl.fold||0),0,1):0, open=alive?Math.max(airW,clamp(p.wing||0,0,1)):0, wingW=open*(1-armW);
  for(let s=0;s<2;s++){ const Ar=P.arms[s], X=Ar.gs, sd=Ar.sd, st=I.ik.w[s];
    cgRest(I,Ar.sh); cgRest(I,Ar.up);
    const shp=I.pw[Ar.up], sh=X==='R'?j.sR:j.sL, el=X==='R'?j.eR:j.eL, hd=X==='R'?j.hR:j.hL;
    // the claws: two-bone IK to the stick's hand, carried over from the stick's shoulder to the model's and scaled to
    // the model's arm (the shoulders sit apart: the stick's hand passing near the model's shoulder would flip the arm)
    const sc=(Ar.l1+Ar.l2)*k/Math.max(1e-3,sh.distanceTo(el)+el.distanceTo(hd)), hand=I.handT[s];
    hand.copy(hd).sub(sh).multiplyScalar(sc).add(shp); hand.y=Math.max(hand.y,H(hand.x,hand.z)+.05*k);   // (never under the ground)
    _cgWP.copy(el).sub(sh).multiplyScalar(sc).add(shp).addScaledVector(r,sd*.25*k).addScaledVector(f,-.15*k);
    _cgWA.copy(f).multiplyScalar(-.6).addScaledVector(r,sd*.6).addScaledVector(UP,-.25);
    ik2(shp,hand,Ar.l1*k,Ar.l2*k,_cgWP,_cgWK,_cgWE,st,_cgWA,.45);
    _cgW1.subVectors(_cgWK,shp).normalize(); _cgW2.subVectors(_cgWE,_cgWK).normalize();
    // the wing: out and raised by the beat (or by the clip's wup on the ground), swept and folded at the wrist
    let th, del, psi;
    if(air&&A){ th=(X==='R'?A.thR:A.thL)+(p.wup||0)*.5; del=A.del; psi=A.psi+(p.wsw||0)*.5; }
    else { th=.35+(p.wup||0)*.8; del=-1.95*(1-clamp(p.wing||0,0,1)); psi=.25+(p.wsw||0)*.6; }
    const fold=clamp(-del/1.95,0,1);
    _cgW3.copy(r).multiplyScalar(sd*Math.cos(th)).addScaledVector(U,Math.sin(th)).multiplyScalar(Math.cos(psi*.6)).addScaledVector(f,-Math.sin(psi*.6)).normalize();
    _cgW4.copy(_cgW3).multiplyScalar(1-fold*.75).addScaledVector(U,-.15-fold*.5).addScaledVector(f,-.25-fold*.4).normalize();
    if(wingW>.001){ cgSlerpDir(_cgW1,_cgW1,_cgW3,wingW); cgSlerpDir(_cgW2,_cgW2,_cgW4,wingW); }
    // the elbow's hinge: the wing's own bend, or as the arm straightens the side the solver bends it to
    cgHinge(_cgW5,_cgW1,_cgW2,st,shp,hand); const bent=true;
    cgAim(I,Ar.up,_cgW1,bent?Ar.hg.a:null,bent?_cgW5:null); cgFK(I,Ar.fo); cgAim(I,Ar.fo,_cgW2,bent?Ar.hg.b:null,bent?_cgW5:null);
    // the hand: claws along the stick's claw direction while striking, as the arm carries them otherwise
    // (the stick's claw direction is a pose vector lerped between keys: a slash from one side to the other passes it
    // through zero and it flips; the wrist turns toward it at most 14 rad/s, about the arm when it reverses)
    const cwT=X==='R'?u.wRw:u.wLw, cw=I.cw[s];
    if(!I.cwOK) cw.copy(cwT); else { const a=Math.acos(clamp(cw.dot(cwT),-1,1)), mx=14*dt; if(a<=mx) cw.copy(cwT); else {
      _cgW7.crossVectors(cw,cwT); if(_cgW7.lengthSq()<1e-8) _cgW7.copy(_cgW2); _cgW7.normalize(); cw.applyAxisAngle(_cgW7,mx).normalize(); } }
    cgFK(I,Ar.hd); cgCarried(I,Ar.hd,_cgW6); if(armW>.01) cgSlerpDir(_cgW6,_cgW6,cw,armW*.8); cgAim(I,Ar.hd,_cgW6);
    // fingers: folded along the forearm (their rest), fanned about the wing's hinge as the wing opens
    const fan=alive?Math.max(wingW,clamp(p.wing||0,0,1)*.9)*(1-fold*.8):0;
    for(let q=0;q<4;q++) cgFinger(I,Ar.fa[q],Ar.fb[q],Ar.fax[q],fan*Ar.fun[q]); }
  I.cwOK=true;
}

/* ---------- per frame (drawing): attach once the model is ready, pose while on screen ---------- */
CG.live=new Set();
function cgFrameStart(){ for(const I of CG.live) I.root.visible=false; }   // each frame only the creatures drawn show
function cgPose(u){
  if(!u.cg&&!cgAttach(u)) return false;
  const I=u.cg; if(!crInView(u)||u.fowH||(u.cloak&&u.alive)){ I.root.visible=false; return true; }
  I.root.visible=true;
  const at=u.alive?u.pos:u.j.pelvis; if(!I.lp||I.lp.distanceToSquared(at)>9||game.time-I.t>.5) cgReset(I); (I.lp||(I.lp=new V3())).copy(at);
  if(u.T.bat) cgPoseBat(u); else cgPoseWyvern(u);
  return true;
}

/* ---------- the creatures' minds reach for the new moves (13m); set here, after 27f and 27k made their pickers ---------- */
// the knight keeps its lance-first habits and now and then uses the new moves; a blow it has just turned (blocked,
// parried, dodged) it answers with the riposte. The bat dives on ground prey with any of its moves.
{ const pick0=TYPES.knight.pick;
  TYPES.knight.pick=(u,t)=>{ if(t&&t.isUnit&&u.defT>game.time-1.2&&(u.cdRip||0)<game.time){ u.cdRip=game.time+4; return 'wyRiposte'; }
    if(t&&t.isUnit&&Math.random()<.3){ let n,g=0; do{ n=pickOf(['wyHammerNeck','wyFuryCombo','wyHopRake']); }while(n===u.lastAtk&&++g<4); return n; }
    return pick0(u,t); }; }
{ const pick0=TYPES.bat.pick, L=TYPES.bat.attacks.filter(x=>x!=='btRiposte');
  TYPES.bat.pick=(u,t)=>{ if(t&&t.isUnit&&!isAir(t)&&u.defT>game.time-1.2&&(u.cdRip||0)<game.time){ u.cdRip=game.time+4; return 'btRiposte'; }
    if(!t||!t.isUnit||isAir(t)) return pick0(u,t);
    let n,g=0; do{ n=pickOf(L); }while(n===u.lastAtk&&++g<4); return n; }; }
