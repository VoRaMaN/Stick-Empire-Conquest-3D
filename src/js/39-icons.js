/* ================= Unit icons, rendered from the game's own 3D soldiers =================
   Each unit is posed alone in a photo booth far off the map, rendered against a key colour into a small
   render target, keyed out to transparency and kept as a PNG data URL for the dock chips and building panel. */
const ICONS={};
const ICON_POSE={sword:{R:[.22,-.05,.32],wR:[.1,.9,.3],L:[-.24,-.3,.18],wL:[0,1,0],lean:.06,crouch:.04},
  spear:null,archer:null,miner:null,giant:null,wizard:null,cleric:null,ninja:null,wing:null,crawler:{lean:-.3,draw:.8,crouch:.04,look:-.25},hound:{lean:-.3,draw:.8,crouch:.04,look:-.25},cerberus:{lean:-.3,draw:.8,crouch:.04,look:-.25},
  thrall:{R:[.18,-.1,.3],wR:[.05,.8,-.6],L:[-.12,-.05,.36],lean:.25,crouch:.05},dread:{R:[.22,.12,.1],wR:[.08,.35,-.93],L:[-.24,-.4,.2],lean:.08},
  harvester:{R:[.24,-.2,.22],wR:[.05,1,.15],L:[-.2,-.3,.25],lean:.04},
  boner:{R:[.24,-.05,.32],wR:[.15,.75,.6],L:[-.24,-.05,.32],wL:[-.15,.75,.6],lean:.08,crouch:.06},bomber:{R:[.22,.05,.3],wR:[0,1,0],L:[-.2,-.3,.2],lean:.15},
  oracle:{R:[.22,-.2,.24],wR:[.04,1,.1],L:[-.18,-.1,.3],lean:.02},reaper:{R:[.24,-.2,.2],wR:[.05,1,.12],L:[-.18,-.3,.22],lean:.06},hades:{R:[.2,-.15,.3],wR:[.08,.85,.5],L:[-.04,-.3,.42],lean:.05}};
function makeUnitIcons(){
  if(!renderer.readRenderTargetPixels||!THREE.WebGLRenderTarget||typeof document.createElement!=='function') return;
  const S=192, rt=new THREE.WebGLRenderTarget(S,S), cam2=new THREE.PerspectiveCamera(26,1,.1,60), px=new Uint8Array(S*S*4);
  const hidden=[]; for(const o of scene.children){ if(o.visible&&!o.isInstancedMesh&&!o.isLight){ o.visible=false; hidden.push(o); } }
  const keepRoots=[...gearRoots], fog=scene.fog, bg=scene.background; scene.fog=null; scene.background=new THREE.Color(0,1,0);
  const keepCnt=new Map(CNT); crForce=true;
  try{
    for(const ty of ORDER.concat(CHAOS)){
      gearRoots.clear();
      const keep=uid, u=makeUnit(ty,0,0,-150,{gy:0,ai:false}); uid=keep; u.face=u.faceGoal=TYPES[ty].crawler?1.05:.55; if(u.fl){ u.fl=null; } if(u.cr) crPlace(u);
      const pose=ICON_POSE[ty]?fillPose(ICON_POSE[ty],POSES[ty]?POSES[ty].idle:computePose(u)):computePose(u);
      for(let i=0;i<40;i++){ u.spd=0; if(u.T.crawler) buildCrawlSkel(u,pose,.016); else buildSkel(u,pose,.016); }
      updateGear(u);
      for(const im of CNT.keys()) CNT.set(im,0);
      drawUnit(u); drawGear();
      const st=u.G&&u.G.str; if(st&&st.vis){ cyl(st.a,st.m,.006*u.s,WHITE,strIM); cyl(st.m,st.b,.006*u.s,WHITE,strIM); }
      for(const [im,n] of CNT){ im.count=n; im.instanceMatrix.needsUpdate=true; if(im.instanceColor) im.instanceColor.needsUpdate=true; }
      // frame the whole figure: head to feet, a little wider for the giant and the wing archer
      const top=u.j.head.y+(TYPES[ty].crawler?.55:ty==='dread'?.45:.3)*u.s, bot=Math.min(u.j.fL.y,u.j.fR.y)-.05, mid=(top+bot)/2, h=(top-bot)*(ty==='wing'?1.25:TYPES[ty].crawler?1.55:ty==='dread'?1.22:1.12);
      const dist=h/2/Math.tan(13*Math.PI/180);
      cam2.position.set(u.pos.x+Math.sin(.15)*dist,mid+h*.08,u.pos.z+Math.cos(.15)*dist); cam2.lookAt(u.pos.x,mid,u.pos.z);
      renderer.setRenderTarget(rt); renderer.setClearColor(0x00ff00,1); renderer.clear(); renderer.render(scene,cam2); renderer.setRenderTarget(null);
      renderer.readRenderTargetPixels(rt,0,0,S,S,px);
      const cv=document.createElement('canvas'); cv.width=cv.height=S; const cx=cv.getContext('2d'), img=cx.createImageData(S,S), d=img.data;
      for(let y=0;y<S;y++) for(let x=0;x<S;x++){ const i=((S-1-y)*S+x)*4, o=(y*S+x)*4, r=px[i],g=px[i+1],b=px[i+2];
        const key=Math.max(0,g-Math.max(r,b))/255;              // how green-screen this pixel is
        const a=clamp(1-key*2.2,0,1); d[o]=r; d[o+1]=a<1?Math.min(g,Math.max(r,b)):g; d[o+2]=b; d[o+3]=Math.round(a*255); }
      cx.putImageData(img,0,0);
      ICONS[ty]=cv.toDataURL('image/png');
      destroyGear(u);
    }
  }catch(e){ console.warn('icons',e); }
  crForce=false; gearRoots.clear(); for(const g of keepRoots) gearRoots.add(g);
  for(const [im,n] of keepCnt) CNT.set(im,n);
  for(const o of hidden) o.visible=true; scene.fog=fog; scene.background=bg; renderer.setClearColor(0x000000,0);
  rt.dispose();
  applyIcons();
}
function applyIcons(){
  for(const t of ORDER.concat(CHAOS)){ const el=document.getElementById('chip-'+t); if(!el||!ICONS[t]||!el.querySelector) continue;
    let im=el.querySelector('img'); if(!im){ im=document.createElement('img'); im.alt=''; el.insertBefore(im,el.firstChild); } im.src=ICONS[t]; el.classList.add('pic'); }
  if(panelB) openPanel(panelB);
}
