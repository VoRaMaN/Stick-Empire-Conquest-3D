/* ================= Advanced graphics: presets, post-processing and scene options =================
   Everything on the Advanced Graphics screen. With every post effect off the game renders straight to the screen
   exactly as before (the canvas's own MSAA). Turning any effect on routes the frame through a half-float (HDR)
   composer:
     scene (MSAA 4× target on WebGL 2) → lens pass [half-res depth+normal prepass → ambient occlusion, sun shafts;
     depth of field and camera motion blur gathered in one full-res pass] → bloom → tone mapping and colour grade
     (exposure, saturation, contrast, brightness, warmth, vignette, grain, chromatic aberration, sharpen) → FXAA/SMAA.
   Nothing here touches the simulation or its random numbers. */

const GFX_DEF={res:1,aa:'msaa',fpsCap:0,aniso:8,
  shadows:2,soft:true,sun:1,sky:1,fog:1,
  ao:false,aoStr:1,aoRad:.6,
  bloom:false,bloomStr:.6,bloomRad:.4,bloomThr:1.35,emissive:1,
  dof:false,dofStr:.4,mblur:false,mblurStr:.5,shafts:false,shaftStr:.5,
  tonemap:'none',exposure:1,sat:1,contrast:1,bright:0,warmth:0,
  vignette:0,grain:0,ca:0,sharpen:0,particles:1};
const GFX_PRESETS={
  low:{res:.75,aa:'msaa',aniso:1,shadows:0,soft:false,particles:.6},
  medium:{res:1,aa:'fxaa',aniso:4,shadows:1,soft:false,bloom:true,bloomStr:.45,emissive:1.15,vignette:.15},
  high:{res:1,aa:'msaa',aniso:8,shadows:2,soft:true,ao:true,aoStr:.85,bloom:true,bloomStr:.55,emissive:1.3,shafts:true,shaftStr:.4,
    sat:1.04,vignette:.2,sharpen:.15},
  ultra:{res:1,aa:'msaa',aniso:16,shadows:3,soft:true,ao:true,aoStr:1,aoRad:.75,bloom:true,bloomStr:.65,emissive:1.45,shafts:true,shaftStr:.55,
    dof:true,dofStr:.35,tonemap:'aces',exposure:1.04,sat:1.06,contrast:1.04,vignette:.25,grain:.04,ca:.1,sharpen:.2,particles:1.3},
};
const GFX_NAMES={auto:'Auto',low:'Low',medium:'Medium',high:'High',ultra:'Ultra',custom:'Custom'};
let GFX=Object.assign({},GFX_DEF);          // the configuration in force this frame

// what the current Quality choice means: a fixed preset, the player's custom set, or Auto (the frame-rate
// ladder picks resolution and shadows; effects follow its rung)
function gfxCfg(){
  const q=settings.quality;
  if(q==='custom') return Object.assign({},GFX_DEF,settings.gfx||GFX_PRESETS.high);
  if(GFX_PRESETS[q]) return Object.assign({},GFX_DEF,GFX_PRESETS[q]);
  const r=clamp(rungFor(),0,LADDER.length-1), L=LADDER[r], base=r<=2?'low':r<=5?'medium':'high';
  return Object.assign({},GFX_DEF,GFX_PRESETS[base],{res:Math.min(1,L.pr/Math.min(DPR,2)),shadows:L.sh?(L.map>=2048?2:1):0,soft:!!L.soft});
}

/* ---------- scene-side options ---------- */
const FOG0={near:38,far:105};
// View distance and shadow distance (Settings → Graphics and the Advanced screen) sit on top of whatever quality is
// chosen. View distance pushes the haze out (or in) and the far clipping plane with it, and Riverlands' scenery tiles
// draw that much further; shadow distance sizes the sun's shadow box round the camera.
const viewK=()=>clamp(+settings.viewDist||1,.5,2.5), shadowM=()=>clamp(+settings.shadowDist||46,20,160);
function applyDistances(){
  const vk=viewK(), f=GFX.fog;
  if(scene.fog){ scene.fog.near=f>.01?FOG0.near*vk/f:1e4; scene.fog.far=f>.01?FOG0.far*vk/f:2e4; }
  const far=MAP.id==='classic'?Math.max(400,FOG0.far*vk*2.2):Math.max(230,(MAP.far||240)*vk);   // the sky dome (r 220) must stay inside it
  if(camera.far!==far){ camera.far=far; camera.updateProjectionMatrix(); }
  if(skyDome) skyDome.scale.setScalar(MAP.id==='classic'?1:Math.max(1,vk));   // the sky follows the camera on Riverlands: grow it so a long view isn't cut off by it
  const sd=shadowM(), C=sun.shadow.camera;
  if(C.right!==sd){ C.left=-sd; C.right=sd; C.top=sd*24/46; C.bottom=-sd*24/46; C.far=95*Math.max(1,sd/46); C.updateProjectionMatrix(); }
}
function setDistance(k,v){ settings[k]=v; saveSettings(); applyDistances(); if(typeof syncSettingsUI==='function') syncSettingsUI(); gfxSync(); }
let anisoNow=-1;
function texList(){ const L=[];
  for(const k in CM){ const m=CM[k]; if(m&&m.map) L.push(m.map); }
  if(typeof CRM!=='undefined') for(const k in CRM){ const m=CRM[k]; if(m&&m.map) L.push(m.map); if(m&&m.emissiveMap) L.push(m.emissiveMap); }
  return L; }
function applyAniso(force){
  const mx=renderer.capabilities&&renderer.capabilities.getMaxAnisotropy?renderer.capabilities.getMaxAnisotropy():1, a=Math.max(1,Math.min(mx,GFX.aniso));
  if(a===anisoNow&&!force) return; anisoNow=a;
  for(const t of texList()) if(t.anisotropy!==a){ t.anisotropy=a; t.needsUpdate=true; } }
// emissive registry: every glowing material keeps its authored colour/intensity and is scaled by the Emissive slider
// (and a little more when HDR bloom is on, so glows rise above the bloom threshold while sunlit sand stays below it)
const EMIT=[];
function emitReg(m,kind){ if(!m||m.userData.emit) return; m.userData.emit=1; EMIT.push({m,kind,base:kind==='c'?m.color.clone():m.emissiveIntensity}); }
function collectEmissive(){
  emitReg(glowMat,'c'); emitReg(boltIM.material,'c'); emitReg(CM.paper,'c'); emitReg(CM.eyes,'c'); emitReg(CM.orb,'c');
  if(typeof CRM!=='undefined'&&CRM.skin){ emitReg(CRM.skin,'e'); emitReg(CRM.hot,'e'); emitReg(CRM.tooth,'e'); emitReg(CRM.eye,'c'); emitReg(CRM.maw,'c'); }
  for(const C of CASTLES) for(const b of C.list) if(b.lava) emitReg(b.lava.material,'c');
  for(const k in lamC){ const m=lamC[k]; if(m.emissive&&m.emissive.getHex()) emitReg(m,'e'); }
}
let emitBase=null;
function applyEmissive(){
  collectEmissive();
  emitK=GFX.emissive*(post.hdr&&GFX.bloom&&post.want?2.2:1);
  for(const E of EMIT){ if(E.kind==='c') E.m.color.copy(E.base).multiplyScalar(emitK); else E.m.emissiveIntensity=E.base*emitK; }
  if(sunDisc){ if(!emitBase) emitBase=sunDisc.material.color.clone(); sunDisc.material.color.copy(emitBase).multiplyScalar(post.hdr&&GFX.bloom&&post.want?2.4:1); }
}
function applyGfx(cfg){
  GFX=cfg;
  const pr=clamp(Math.min(DPR,2)*cfg.res,.5,3);
  if(Math.abs(curPR-pr)>.01){ curPR=pr; renderer.setPixelRatio(pr); if(vpW>0) renderer.setSize(vpW,vpH,false); }
  const maxT=renderer.capabilities&&renderer.capabilities.maxTextureSize||4096;
  setShadows(cfg.shadows>0,Math.min(maxT,[1024,1024,2048,4096][cfg.shadows]||2048),cfg.soft);
  sun.intensity=.92*cfg.sun; hemi.intensity=.78*cfg.sky;
  applyDistances();
  partK=cfg.particles;
  post.want=gfxCanPost()&&needPost(cfg);
  if(post.built) postConfigure();
  applyAniso(); applyEmissive();
  const q=settings.quality;
  qa.shown=(GFX_NAMES[q]||q)+(q==='auto'?' ('+(rungFor()<=2?'low':rungFor()<=5?'medium':'high')+')':'')+' · '+curPR.toFixed(2).replace(/\.?0+$/,'')+'×'+(post.want?' · effects':'');
}

/* ---------- post-processing ---------- */
const post={want:false,built:false,hdr:false,w:0,h:0,msaa:null,comp:null};
function gfxCanPost(){ return typeof renderer.getContext==='function'&&typeof renderer.getDrawingBufferSize==='function'&&!!THREE.EffectComposer&&!!THREE.UnrealBloomPass; }
function needPost(c){ return c.ao||c.bloom||c.dof||c.mblur||c.shafts||c.tonemap!=='none'||c.exposure!==1||c.sat!==1||c.contrast!==1||c.bright!==0||c.warmth!==0||
  c.vignette>0||c.grain>0||c.ca>0||c.sharpen>0||c.aa==='fxaa'||c.aa==='smaa'||c.aa==='off'; }
const FSV='varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }';
// deterministic numbers for kernels and noise (never Math.random: the game's random stream is left alone)
let _gseed=91; const grand=()=>(_gseed=(_gseed*16807)%2147483647)/2147483647;

// depth + view-space normals of the opaque scene, at half resolution
const PRE_MAT=new THREE.MeshNormalMaterial({side:THREE.DoubleSide});
function preSkip(o){ if(o===skyDome||o===sunDisc||o===puffIM||o.userData.noPre) return true;
  const m=o.material; if(!m||Array.isArray(m)) return false; return !!(m.transparent||m.depthWrite===false||m.blending===THREE.AdditiveBlending); }
const _cc=new THREE.Color(); const _hid=[];
function renderPrepass(r){
  for(const o of scene.children) if(o.visible&&preSkip(o)){ o.visible=false; _hid.push(o); }
  for(const C of CASTLES) for(const b of C.list) if(b.hull&&b.hull.visible){ b.hull.visible=false; _hid.push(b.hull); }   // hover outlines
  const au=r.shadowMap.autoUpdate, bg=scene.background, ca=r.getClearAlpha(); r.getClearColor(_cc);
  r.shadowMap.autoUpdate=false; scene.background=null; scene.overrideMaterial=PRE_MAT;
  r.setRenderTarget(post.pre); r.setClearColor(0x8080ff,1); r.clear(); r.render(scene,camera);
  scene.overrideMaterial=null; scene.background=bg; r.shadowMap.autoUpdate=au; r.setClearColor(_cc,ca);
  for(const o of _hid) o.visible=true; _hid.length=0;
}
const AO_N=16;
function aoKernel(){ const K=[]; for(let i=0;i<AO_N;i++){ const v=new V3(grand()*2-1,grand()*2-1,grand()); v.normalize().multiplyScalar(grand()); let s=i/AO_N; s=.1+.9*s*s; v.multiplyScalar(s); K.push(v); } return K; }
function noiseTex(){ const d=new Uint8Array(16*4); for(let i=0;i<16;i++){ const a=grand()*Math.PI*2; d[i*4]=(Math.cos(a)*.5+.5)*255; d[i*4+1]=(Math.sin(a)*.5+.5)*255; d[i*4+2]=128; d[i*4+3]=255; }
  const t=new THREE.DataTexture(d,4,4,THREE.RGBAFormat); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.minFilter=t.magFilter=THREE.NearestFilter; t.needsUpdate=true; return t; }
const AO_SH={uniforms:{tDepth:{value:null},tNormal:{value:null},tNoise:{value:null},uK:{value:[]},uProj:{value:new THREE.Matrix4()},uProjInv:{value:new THREE.Matrix4()},
    uRad:{value:.6},uNoise:{value:new THREE.Vector2()}},vertexShader:FSV,fragmentShader:`
  uniform sampler2D tDepth,tNormal,tNoise; uniform vec3 uK[${AO_N}]; uniform mat4 uProj,uProjInv; uniform float uRad; uniform vec2 uNoise; varying vec2 vUv;
  vec3 vpos(vec2 uv,float d){ vec4 v=uProjInv*vec4(uv*2.-1.,d*2.-1.,1.); return v.xyz/v.w; }
  void main(){
    float d=texture2D(tDepth,vUv).x; if(d>=.99999){ gl_FragColor=vec4(1.); return; }
    vec3 P=vpos(vUv,d), N=normalize(texture2D(tNormal,vUv).xyz*2.-1.), R=normalize(vec3(texture2D(tNoise,vUv*uNoise).xy*2.-1.,0.));
    vec3 T=normalize(R-N*dot(R,N)), B=cross(N,T); mat3 TBN=mat3(T,B,N);
    float occ=0.;
    for(int i=0;i<${AO_N};i++){
      vec3 S=P+TBN*uK[i]*uRad; vec4 o=uProj*vec4(S,1.); vec2 suv=o.xy/o.w*.5+.5;
      float sd=texture2D(tDepth,suv).x; float sz=vpos(suv,sd).z;
      float range=smoothstep(0.,1.,uRad/max(abs(P.z-sz),1e-4));
      occ+=(sz>=S.z+.025*uRad?1.:0.)*range; }
    gl_FragColor=vec4(vec3(1.-occ/${AO_N}.),1.); }`};
const BLUR_SH={uniforms:{tAO:{value:null},uTexel:{value:new THREE.Vector2()}},vertexShader:FSV,fragmentShader:`
  uniform sampler2D tAO; uniform vec2 uTexel; varying vec2 vUv;
  void main(){ float s=0.; for(int x=-2;x<2;x++) for(int y=-2;y<2;y++) s+=texture2D(tAO,vUv+(vec2(float(x),float(y))+.5)*uTexel).r; gl_FragColor=vec4(vec3(s/16.),1.); }`};
// light shafts: the visible sky (depth = far) is smeared outward from the sun's screen position
const SHAFT_SH={uniforms:{tDepth:{value:null},uSun:{value:new THREE.Vector2()},uAsp:{value:1}},vertexShader:FSV,fragmentShader:`
  uniform sampler2D tDepth; uniform vec2 uSun; uniform float uAsp; varying vec2 vUv;
  void main(){ vec2 dl=(vUv-uSun)*(.92/40.); vec2 p=vUv; float il=1., s=0.;
    for(int i=0;i<40;i++){ p-=dl; vec2 q=(p-uSun)*vec2(uAsp,1.); float f=max(0.,1.-length(q)*.85); f=f*f*f;
      s+=step(.99999,texture2D(tDepth,clamp(p,0.,1.)).x)*f*il; il*=.962; }
    float pf=1.-clamp(length((vUv-uSun)*vec2(uAsp,1.))*.62,0.,1.);   // rays thin out away from the sun
    gl_FragColor=vec4(vec3(s/26.*pf*pf),1.); }`};
// lens pass: depth of field and camera motion blur gathered together, then AO darkens and shafts brighten
const LENS_SH={uniforms:{tDiffuse:{value:null},tDepth:{value:null},tAO:{value:null},tShaft:{value:null},uTexel:{value:new THREE.Vector2()},
    uTaps:{value:1},uProjInv:{value:new THREE.Matrix4()},uVPInv:{value:new THREE.Matrix4()},uPrevVP:{value:new THREE.Matrix4()},
    uFocus:{value:30},uAp:{value:0},uMaxPx:{value:10},uMB:{value:0},uAO:{value:0},uShaft:{value:0},uShaftCol:{value:new THREE.Color('#ffd9a0')}},vertexShader:FSV,fragmentShader:`
  uniform sampler2D tDiffuse,tDepth,tAO,tShaft; uniform vec2 uTexel; uniform int uTaps; uniform mat4 uProjInv,uVPInv,uPrevVP;
  uniform float uFocus,uAp,uMaxPx,uMB,uAO,uShaft; uniform vec3 uShaftCol; varying vec2 vUv;
  void main(){
    float d=texture2D(tDepth,vUv).x; vec3 c;
    if(uTaps>1){
      vec2 vel=vec2(0.); float coc=0.;
      if(uMB>0.){ vec4 w=uVPInv*vec4(vUv*2.-1.,d*2.-1.,1.); w/=w.w; vec4 pv=uPrevVP*w; pv/=pv.w; vel=(vUv*2.-1.-pv.xy)*.5*uMB; float L=length(vel); if(L>.04) vel*=.04/L; }
      if(uAp>0.){ vec4 v=uProjInv*vec4(vUv*2.-1.,d*2.-1.,1.); float z=-v.z/v.w; coc=clamp((abs(z-uFocus)/max(z,.01)-.12)*uAp,0.,1.)*uMaxPx; }
      c=vec3(0.); float n=0.;
      for(int i=0;i<16;i++){ if(i>=uTaps) break; float fi=float(i), t=(fi+.5)/float(uTaps), a=fi*2.39996, r=sqrt(t);
        vec2 o=vec2(cos(a),sin(a))*r*coc*uTexel+vel*(t-.5); c+=texture2D(tDiffuse,vUv+o).rgb; n+=1.; }
      c/=n;
    } else c=texture2D(tDiffuse,vUv).rgb;
    if(uAO>0.) c*=mix(1.,texture2D(tAO,vUv).r,uAO);
    if(uShaft>0.) c+=texture2D(tShaft,vUv).r*uShaftCol*uShaft;
    gl_FragColor=vec4(c,1.); }`};
// final: exposure, tone mapping, colour grade and lens imperfections (scene colours are display-referred, so the
// filmic curves run on a linearised copy and the result goes back to display space)
const GRADE_SH={uniforms:{tDiffuse:{value:null},uTexel:{value:new THREE.Vector2()},uExp:{value:1},uTone:{value:0},uSat:{value:1},uCon:{value:1},uBri:{value:0},
    uWarm:{value:0},uVig:{value:0},uGrain:{value:0},uCA:{value:0},uSharp:{value:0},uTime:{value:0}},vertexShader:FSV,fragmentShader:`
  uniform sampler2D tDiffuse; uniform vec2 uTexel; uniform float uExp,uSat,uCon,uBri,uWarm,uVig,uGrain,uCA,uSharp,uTime; uniform int uTone; varying vec2 vUv;
  vec3 tx(vec2 uv){ return texture2D(tDiffuse,uv).rgb; }
  vec3 RRTAndODTFit(vec3 v){ vec3 a=v*(v+.0245786)-.000090537; vec3 b=v*(.983729*v+.4329510)+.238081; return a/b; }
  vec3 aces(vec3 c){ const mat3 I=mat3(vec3(.59719,.07600,.02840),vec3(.35458,.90834,.13383),vec3(.04823,.01566,.83777));
    const mat3 O=mat3(vec3(1.60475,-.10208,-.00327),vec3(-.53108,1.10813,-.07276),vec3(-.07367,-.00605,1.07602));
    c/=.6; c=I*c; c=RRTAndODTFit(c); c=O*c; return clamp(c,0.,1.); }
  vec3 cineon(vec3 c){ c=max(vec3(0.),c-.004); return pow((c*(6.2*c+.5))/(c*(6.2*c+1.7)+.06),vec3(2.2)); }
  float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
  void main(){
    vec2 uv=vUv; vec3 c;
    if(uCA>0.){ vec2 dd=(uv-.5)*uCA*.012; c=vec3(tx(uv+dd).r,tx(uv).g,tx(uv-dd).b); } else c=tx(uv);
    if(uSharp>0.){ vec3 n=tx(uv+vec2(uTexel.x,0.))+tx(uv-vec2(uTexel.x,0.))+tx(uv+vec2(0.,uTexel.y))+tx(uv-vec2(0.,uTexel.y)); c+=(c-n*.25)*uSharp*1.5; }
    c=max(c,0.)*uExp;
    if(uTone==1){ vec3 l=pow(c,vec3(2.2)); float L=dot(l,vec3(.2126,.7152,.0722)); float x=L*.8, Lt=(x*(2.51*x+.03))/(x*(2.43*x+.59)+.14);
      l*=Lt/max(L,1e-4); float m=max(l.r,max(l.g,l.b)); if(m>1.) l=mix(l/m,vec3(1.),clamp((m-1.)*.6,0.,1.)); c=pow(l,vec3(1./2.2)); }
    else if(uTone==4) c=pow(aces(pow(c,vec3(2.2))),vec3(1./2.2));
    else if(uTone==2){ vec3 l=pow(c,vec3(2.2))*1.6; c=pow(l/(1.+l),vec3(1./2.2)); }
    else if(uTone==3) c=pow(cineon(pow(c,vec3(2.2))),vec3(1./2.2));
    float lu=dot(c,vec3(.2126,.7152,.0722)); c=mix(vec3(lu),c,uSat);
    c=(c-.5)*uCon+.5+uBri;
    c*=vec3(1.+uWarm*.07,1.+uWarm*.012,1.-uWarm*.08);
    if(uVig>0.){ vec2 q=(uv-.5)*vec2(1.,.92); c*=mix(1.,1.-smoothstep(.32,.92,length(q)*1.25),uVig); }
    if(uGrain>0.) c+=(hash(uv*vec2(1973.,1531.)+fract(uTime*7.31))-.5)*uGrain*.12;
    gl_FragColor=vec4(clamp(c,0.,1.),1.); }`};

function shMat(S){ return new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.clone(S.uniforms),vertexShader:S.vertexShader,fragmentShader:S.fragmentShader,depthTest:false,depthWrite:false}); }
class ScenePass extends THREE.Pass{
  constructor(){ super(); this.needsSwap=false; this.cp=new THREE.FullScreenQuad(shMat({uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:THREE.CopyShader.vertexShader,fragmentShader:THREE.CopyShader.fragmentShader})); }
  render(r,w,read){ const ms=post.msaa;
    r.setRenderTarget(ms||read); r.clear(); r.render(scene,camera);
    if(ms){ this.cp.material.uniforms.tDiffuse.value=ms.texture; r.setRenderTarget(read); this.cp.render(r); } }
}
class LensPass extends THREE.Pass{
  constructor(){ super();
    this.ao=new THREE.FullScreenQuad(shMat(AO_SH)); this.blur=new THREE.FullScreenQuad(shMat(BLUR_SH)); this.shaft=new THREE.FullScreenQuad(shMat(SHAFT_SH)); this.lens=new THREE.FullScreenQuad(shMat(LENS_SH));
    this.ao.material.uniforms.uK.value=aoKernel(); this.ao.material.uniforms.tNoise.value=noiseTex(); }
  render(r,w,read){
    const L=this.lens.material.uniforms; renderPrepass(r);
    if(GFX.ao){ const A=this.ao.material.uniforms; A.tDepth.value=post.pre.depthTexture; A.tNormal.value=post.pre.texture; A.uRad.value=GFX.aoRad;
      A.uProj.value.copy(camera.projectionMatrix); A.uProjInv.value.copy(camera.projectionMatrixInverse); A.uNoise.value.set(post.pre.width/4,post.pre.height/4);
      r.setRenderTarget(post.aoA); this.ao.render(r);
      const B=this.blur.material.uniforms; B.tAO.value=post.aoA.texture; B.uTexel.value.set(1/post.aoA.width,1/post.aoA.height); r.setRenderTarget(post.aoB); this.blur.render(r); }
    let shaft=0;
    if(GFX.shafts){ const sv=sunScreen(); shaft=sv.vis*GFX.shaftStr*.9;
      if(shaft>.002){ const S=this.shaft.material.uniforms; S.tDepth.value=post.pre.depthTexture; S.uSun.value.copy(sv.uv); S.uAsp.value=post.w/post.h; r.setRenderTarget(post.shA); this.shaft.render(r); } }
    L.tDiffuse.value=read.texture; L.tDepth.value=post.pre.depthTexture; L.tAO.value=post.aoB.texture; L.tShaft.value=post.shA.texture;
    L.uAO.value=GFX.ao?GFX.aoStr:0; L.uShaft.value=shaft>.002?shaft:0; L.uTexel.value.set(1/post.w,1/post.h);
    L.uAp.value=GFX.dof?GFX.dofStr*1.8:0; L.uMaxPx.value=Math.min(10,6*post.w/1280+2)*(GFX.dof?1:0); L.uMB.value=GFX.mblur?GFX.mblurStr*1.6:0;
    L.uTaps.value=GFX.dof||GFX.mblur?16:1;
    L.uProjInv.value.copy(camera.projectionMatrixInverse); L.uVPInv.value.copy(post.vp).invert(); L.uPrevVP.value.copy(post.prevVP);
    _tp.copy(cam.target).applyMatrix4(camera.matrixWorldInverse); L.uFocus.value=Math.max(2,-_tp.z);
    r.setRenderTarget(this.renderToScreen?null:w); this.lens.render(r); }
}
// sun position on screen and how strongly its shafts show (fade as it leaves the frame; none behind the camera)
const _sv={uv:new THREE.Vector2(),vis:0}, _sp3=new V3();
function sunScreen(){
  _sp3.copy(sunDisc.position).sub(camera.position).normalize().multiplyScalar(300).add(camera.position);
  _tp.copy(_sp3).applyMatrix4(camera.matrixWorldInverse); if(_tp.z>-1){ _sv.vis=0; return _sv; }
  _sp3.project(camera); _sv.uv.set(_sp3.x*.5+.5,_sp3.y*.5+.5);
  const off=Math.max(Math.abs(_sp3.x),Math.abs(_sp3.y)); _sv.vis=1-smooth(clamp((off-1)/1.6,0,1)); return _sv; }

function postBuild(){
  const r=renderer, x=r.extensions;
  post.hdr=r.capabilities.isWebGL2?!!(x.has('EXT_color_buffer_float')||x.has('EXT_color_buffer_half_float')):!!(x.has('OES_texture_half_float')&&x.has('EXT_color_buffer_half_float'));
  const sz=r.getDrawingBufferSize(new THREE.Vector2()); post.w=sz.x; post.h=sz.y;
  post.pars={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,type:post.hdr?THREE.HalfFloatType:THREE.UnsignedByteType,stencilBuffer:false};
  const comp=new THREE.EffectComposer(r,new THREE.WebGLRenderTarget(post.w,post.h,post.pars));
  post.scene=new ScenePass(); post.lensP=new LensPass();
  post.bloomP=new THREE.UnrealBloomPass(new THREE.Vector2(post.w,post.h),.6,.4,.92);
  post.grade=new THREE.ShaderPass(shMat(GRADE_SH)); post.fxaa=new THREE.ShaderPass(THREE.FXAAShader); post.smaa=new THREE.SMAAPass(post.w,post.h);
  for(const p of [post.scene,post.lensP,post.bloomP,post.grade,post.fxaa,post.smaa]) comp.addPass(p);
  const half=(w,h,o)=>new THREE.WebGLRenderTarget(Math.max(1,w>>1),Math.max(1,h>>1),o||{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat});
  post.half=half;
  post.pre=half(post.w,post.h,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,format:THREE.RGBAFormat});
  post.pre.depthTexture=new THREE.DepthTexture(); post.pre.depthTexture.type=THREE.UnsignedIntType;
  post.aoA=half(post.w,post.h); post.aoB=half(post.w,post.h); post.shA=half(post.w,post.h);
  post.vp=new THREE.Matrix4(); post.prevVP=new THREE.Matrix4(); post.first=true;
  post.comp=comp; post.built=true; postConfigure(); applyEmissive();
}
function postResize(){
  const sz=renderer.getDrawingBufferSize(new THREE.Vector2()); if(sz.x===post.w&&sz.y===post.h) return;
  post.w=sz.x; post.h=sz.y; post.comp.setSize(post.w,post.h);
  for(const t of [post.pre,post.aoA,post.aoB,post.shA]) t.setSize(Math.max(1,post.w>>1),Math.max(1,post.h>>1));
  if(post.msaa) post.msaa.setSize(post.w,post.h);
  post.fxaa.material.uniforms.resolution.value.set(1/post.w,1/post.h);
}
function postConfigure(){
  const c=GFX, gl2=renderer.capabilities.isWebGL2;
  const wantMS=c.aa==='msaa'&&gl2&&!!THREE.WebGLMultisampleRenderTarget;
  if(wantMS&&!post.msaa){ post.msaa=new THREE.WebGLMultisampleRenderTarget(post.w,post.h,post.pars); post.msaa.samples=4; }
  else if(!wantMS&&post.msaa){ post.msaa.dispose(); post.msaa=null; }
  post.lensP.enabled=c.ao||c.dof||c.mblur||c.shafts;
  post.bloomP.enabled=c.bloom; post.bloomP.strength=c.bloomStr; post.bloomP.radius=c.bloomRad; post.bloomP.threshold=post.hdr?c.bloomThr:Math.min(.96,c.bloomThr*.7);
  const U=post.grade.material.uniforms; U.uExp.value=c.exposure; U.uTone.value={none:0,aces:1,reinhard:2,cineon:3,acesfull:4}[c.tonemap]||0;
  U.uSat.value=c.sat; U.uCon.value=c.contrast; U.uBri.value=c.bright; U.uWarm.value=c.warmth; U.uVig.value=c.vignette; U.uGrain.value=c.grain; U.uCA.value=c.ca; U.uSharp.value=c.sharpen;
  post.fxaa.enabled=c.aa==='fxaa'; post.smaa.enabled=c.aa==='smaa';
  post.fxaa.material.uniforms.resolution.value.set(1/post.w,1/post.h);
}
// one frame on screen: straight render, or through the effect chain
let emitT=0;
function renderFrame(){
  if((emitT-=1)<=0){ emitT=120; applyEmissive(); applyAniso(); }   // pick up materials made since (new units, textures that just loaded)
  if(!post.want){ renderer.render(scene,camera); return; }
  if(!post.built){ try{ postBuild(); }catch(e){ console.warn('post-processing unavailable',e); post.want=false; renderer.render(scene,camera); return; } }
  postResize();
  camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  post.vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse); if(post.first){ post.prevVP.copy(post.vp); post.first=false; }
  post.grade.material.uniforms.uTexel.value.set(1/post.w,1/post.h); post.grade.material.uniforms.uTime.value=game.time;
  post.comp.render(1/60);
  post.prevVP.copy(post.vp);
}

/* ---------- Advanced Graphics screen ---------- */
const pct=v=>Math.round(v*100)+'%', sgn=v=>(v>0?'+':'')+Math.round(v*100)+'%';
const GFX_UI=[
  ['Display',[
    {k:'res',t:'range',min:.5,max:1,step:.05,l:'Resolution',f:pct,n:'Share of your screen’s full sharpness the 3D view is drawn at'},
    {k:'aa',t:'pills',l:'Anti-aliasing',o:[['off','Off'],['fxaa','FXAA'],['smaa','SMAA'],['msaa','MSAA 4×']]},
    {k:'fpsCap',t:'pills',l:'Frame rate limit',o:[[30,'30'],[60,'60'],[0,'Unlimited']]},
    {k:'aniso',t:'pills',l:'Texture filtering',o:[[1,'Bilinear'],[4,'4×'],[8,'8×'],[16,'16×']]},
    {k:'viewDist',set:1,t:'range',min:.5,max:2.5,step:.05,l:'View distance',f:v=>Math.round(FOG0.far*v)+' m',n:'How far the world is drawn before the haze. Kept when you change preset'}]],
  ['Lighting and shadows',[
    {k:'shadows',t:'pills',l:'Shadows',o:[[0,'Off'],[1,'Low'],[2,'Medium'],[3,'High']]},
    {k:'soft',t:'tog',l:'Soft shadow edges'},
    {k:'shadowDist',set:1,t:'range',min:20,max:160,step:2,l:'Shadow distance',f:v=>Math.round(v)+' m',n:'How far from the camera shadows are cast; further is softer and slower. Kept when you change preset'},
    {k:'sun',t:'range',min:.4,max:1.6,step:.05,l:'Sunlight',f:pct},
    {k:'sky',t:'range',min:.4,max:1.6,step:.05,l:'Sky light',f:pct},
    {k:'fog',t:'range',min:0,max:2,step:.05,l:'Distance haze',f:pct}]],
  ['Ambient occlusion',[
    {k:'ao',t:'tog',l:'Ambient occlusion (SSAO)',n:'Soft contact shadows where bodies, walls and the ground meet'},
    {k:'aoStr',t:'range',min:0,max:2,step:.05,l:'Intensity',f:pct,dep:'ao'},
    {k:'aoRad',t:'range',min:.2,max:1.5,step:.05,l:'Radius',f:v=>v.toFixed(2)+' m',dep:'ao'}]],
  ['Bloom and glow',[
    {k:'bloom',t:'tog',l:'Bloom'},
    {k:'bloomStr',t:'range',min:0,max:2,step:.05,l:'Strength',f:pct,dep:'bloom'},
    {k:'bloomRad',t:'range',min:0,max:1,step:.05,l:'Spread',f:pct,dep:'bloom'},
    {k:'bloomThr',t:'range',min:.6,max:2.5,step:.05,l:'Threshold',f:v=>v.toFixed(2),dep:'bloom',n:'Lower lets sunlit ground glow too'},
    {k:'emissive',t:'range',min:0,max:3,step:.05,l:'Emissive glow',f:pct,n:'Magma cracks, the Hellpit, torches, windows, eyes and spells'}]],
  ['Camera',[
    {k:'dof',t:'tog',l:'Depth of field',n:'Sharp where the camera looks, softer in front and behind'},
    {k:'dofStr',t:'range',min:.05,max:1,step:.05,l:'Blur strength',f:pct,dep:'dof'},
    {k:'mblur',t:'tog',l:'Motion blur'},
    {k:'mblurStr',t:'range',min:.1,max:1,step:.05,l:'Amount',f:pct,dep:'mblur'},
    {k:'shafts',t:'tog',l:'Sun shafts'},
    {k:'shaftStr',t:'range',min:.1,max:1.5,step:.05,l:'Intensity',f:pct,dep:'shafts'},
    {k:'vignette',t:'range',min:0,max:1,step:.05,l:'Vignette',f:pct},
    {k:'ca',t:'range',min:0,max:1,step:.05,l:'Chromatic aberration',f:pct},
    {k:'grain',t:'range',min:0,max:1,step:.05,l:'Film grain',f:pct},
    {k:'sharpen',t:'range',min:0,max:1,step:.05,l:'Sharpen',f:pct}]],
  ['Colour',[
    {k:'tonemap',t:'pills',l:'Tone mapping',o:[['none','Off'],['aces','Filmic'],['acesfull','ACES'],['reinhard','Reinhard'],['cineon','Cineon']]},
    {k:'exposure',t:'range',min:.5,max:1.8,step:.02,l:'Exposure',f:v=>v.toFixed(2)+'×'},
    {k:'sat',t:'range',min:0,max:2,step:.02,l:'Saturation',f:pct},
    {k:'contrast',t:'range',min:.6,max:1.5,step:.02,l:'Contrast',f:pct},
    {k:'bright',t:'range',min:-.3,max:.3,step:.01,l:'Brightness',f:sgn},
    {k:'warmth',t:'range',min:-1,max:1,step:.05,l:'Warmth',f:sgn}]],
  ['Effects',[
    {k:'particles',t:'range',min:.25,max:1.5,step:.05,l:'Dust and debris',f:pct}]],
];
const gfxEl=$('#gfxBody');
function gfxSet(k,v){
  if(settings.quality!=='custom'){ settings.gfx=Object.assign({},GFX); settings.quality='custom'; }
  settings.gfx[k]=v; saveSettings(); applyQuality(); gfxSync(); syncSettingsUI();
}
function gfxBuildUI(){
  if(!gfxEl||!gfxEl.appendChild) return;
  gfxEl.innerHTML='';
  const head=document.createElement('section'); head.className='set-sec';
  head.innerHTML='<h3>Preset</h3><div class="pills" role="radiogroup" aria-label="Graphics preset" id="gfxPre">'+
    ['auto','low','medium','high','ultra','custom'].map(q=>'<button role="radio" data-gq="'+q+'">'+GFX_NAMES[q]+'</button>').join('')+'</div>'+
    '<small class="opt-note" id="gfxNote"></small><label class="tg" for="gfxFps">Show frame rate <input id="gfxFps" type="checkbox"></label>';
  gfxEl.appendChild(head);
  head.querySelector('#gfxPre').addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('button'); if(!b) return; sfx('ui');
    const q=b.dataset.gq; if(q==='custom'&&!settings.gfx) settings.gfx=Object.assign({},GFX); settings.quality=q; if(q==='auto') qa.rung=-1;
    saveSettings(); applyQuality(); gfxSync(); syncSettingsUI(); });
  head.querySelector('#gfxFps').addEventListener('change',e=>{ settings.fps=e.target.checked; saveSettings(); syncSettingsUI(); });
  for(const [title,items] of GFX_UI){
    const sec=document.createElement('section'); sec.className='set-sec'; sec.innerHTML='<h3>'+title+'</h3>'; gfxEl.appendChild(sec);
    for(const it of items){ const id='gx_'+it.k; let el;
      if(it.t==='range'){ el=document.createElement('div'); el.className='sl';
        el.innerHTML='<label for="'+id+'">'+it.l+'</label><output id="'+id+'o"></output><input id="'+id+'" type="range" min="'+it.min+'" max="'+it.max+'" step="'+it.step+'">'+(it.n?'<small>'+it.n+'</small>':'');
        el.querySelector('input').addEventListener('input',e=>{ const v=+e.target.value; el.querySelector('output').textContent=it.f(v); if(it.set) setDistance(it.k,v); else gfxSet(it.k,v); }); }
      else if(it.t==='tog'){ el=document.createElement('label'); el.className='tg'+(it.n?' tg-n':''); el.htmlFor=id;
        el.innerHTML='<span>'+it.l+(it.n?'<small>'+it.n+'</small>':'')+'</span><input id="'+id+'" type="checkbox">';
        el.querySelector('input').addEventListener('change',e=>{ sfx('ui'); gfxSet(it.k,e.target.checked); }); }
      else { el=document.createElement('div'); el.className='opt';
        el.innerHTML='<span>'+it.l+'</span><div class="pills" role="radiogroup" aria-label="'+it.l+'">'+it.o.map(([v,t])=>'<button role="radio" data-v="'+v+'">'+t+'</button>').join('')+'</div>';
        el.querySelector('.pills').addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('button'); if(!b) return; sfx('ui'); const v=b.dataset.v; gfxSet(it.k,typeof GFX_DEF[it.k]==='number'?+v:v); }); }
      el.dataset.k=it.k; if(it.dep) el.dataset.dep=it.dep; sec.appendChild(el); } }
  gfxSync();
}
function gfxSync(){ try{ gfxSyncUI(); }catch(e){} }
function gfxSyncUI(){
  if(!gfxEl||!gfxEl.querySelectorAll||!gfxEl.querySelector) return;
  setPills($('#gfxPre'),'gq',settings.quality); const fp=$('#gfxFps'); if(fp) fp.checked=!!settings.fps;
  const n=$('#gfxNote'); if(n) n.textContent=(settings.quality==='auto'?'Auto picks a preset from your frame rate and moves it up or down as you play. ':settings.quality==='custom'?'Your own settings. ':'Picking a preset sets everything below; changing anything switches to Custom. ')+
    (post.built?(post.hdr?'HDR effects on this device.':'This device draws effects without HDR.'):'')+(renderer.capabilities&&!renderer.capabilities.isWebGL2?' MSAA with effects needs WebGL 2.':'');
  for(const [,items] of GFX_UI) for(const it of items){ const id='gx_'+it.k, v=it.set?(it.k==='viewDist'?viewK():shadowM()):GFX[it.k], el=document.getElementById(id);
    if(it.t==='range'&&el){ el.value=v; const o=document.getElementById(id+'o'); if(o) o.textContent=it.f(v); }
    else if(it.t==='tog'&&el) el.checked=!!v;
    else if(it.t==='pills'){ const box=gfxEl.querySelector('[data-k="'+it.k+'"] .pills'); if(box) box.querySelectorAll('button').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.v===String(v)))); } }
  gfxEl.querySelectorAll('[data-dep]').forEach(el=>{ el.hidden=!GFX[el.dataset.dep]; });
}
if($('#setGfx')) $('#setGfx').onclick=()=>{ sfx('ui'); openSheet('gfx','settings'); gfxSync(); };
if($('#gfxClose')) $('#gfxClose').onclick=()=>{ sfx('ui'); closeSheet('gfx'); };
try{ gfxBuildUI(); }catch(e){}   // headless test pages have no real DOM
