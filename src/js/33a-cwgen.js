/* ================= Campaign world generation (pure maths, deterministic) =================
   Height, ground colour, which region every spot belongs to, and region neighbours, all from the data in 32z.
   No three.js objects and no Math.random: the same numbers come out on every load, and the battle simulation's
   random sequence is never touched. The 3D table (33b) and the campaign rules (33) both use it. */
const CW={X0:-100,X1:100,Z0:-65,Z1:65,WL:.55,GW:400,GH:260,grid:null,ids:null,byId:null,adj:null,built:false};
// value noise and fbm from an integer hash
function cwHash(i,j){ let h=(i*374761393+j*668265263)|0; h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967295; }
function cwNoise(x,z){ const i=Math.floor(x), j=Math.floor(z), fx=x-i, fz=z-j, u=fx*fx*(3-2*fx), v=fz*fz*(3-2*fz);
  const a=cwHash(i,j), b=cwHash(i+1,j), c=cwHash(i,j+1), d=cwHash(i+1,j+1); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
function cwFbm(x,z){ return .5*cwNoise(x,z)+.25*cwNoise(x*2.03+17,z*2.03-9)+.125*cwNoise(x*4.1-31,z*4.1+5)+.0625*cwNoise(x*8.3+3,z*8.3+41); }
const cwSmooth=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
function cwSegD(px,pz,ax,az,bx,bz){ const ex=bx-ax, ez=bz-az, L=ex*ex+ez*ez||1, t=Math.max(0,Math.min(1,((px-ax)*ex+(pz-az)*ez)/L)); return Math.hypot(px-ax-ex*t,pz-az-ez*t); }
function cwLineD(px,pz,pts){ let d=1e9; for(let i=1;i<pts.length;i++) d=Math.min(d,cwSegD(px,pz,pts[i-1][0],pts[i-1][1],pts[i][0],pts[i][1])); return d; }
// how far inside the coast a point is (>0 land, <0 sea)
function cwCoast(x,z){ const s=Math.pow(Math.abs(x)/101,4)+Math.pow(Math.abs(z)/66,4); return 1-s-(cwFbm(x*.045+3,z*.045-7)-.5)*.32; }
function cwRiverD(x,z){ let d=1e9, w=1; for(const R of CW_RIVERS){ const q=cwLineD(x,z,R.pts)/R.w; if(q<d){ d=q; w=R.w; } } return d; }   // in river widths
function cwLakeD(x,z){ let d=1e9; for(const L of CW_LAKES){ d=Math.min(d,Math.hypot(x-L[0],z-L[1])/L[2]); } return d; }   // in lake radii
// the regions near a point with their blend weights (cached per call site by the caller)
function cwBlend(x,z,out){ let n=0, sum=0; const s2=2*11*11;
  for(const R of CW_REGIONS){ const dx=x-R.x, dz=z-R.z, d2=dx*dx+dz*dz; if(d2>1600) continue; const w=Math.exp(-d2/s2); out[n*2]=R._i; out[n*2+1]=w; sum+=w; n++; }
  if(!n){ let best=0,bd=1e18; for(const R of CW_REGIONS){ const d2=(x-R.x)**2+(z-R.z)**2; if(d2<bd){ bd=d2; best=R._i; } } out[0]=best; out[1]=1; return 1; }
  for(let i=0;i<n;i++) out[i*2+1]/=sum; return n; }
const _cwB=new Float64Array(200);
// terrain height above the board (sea level CW.WL)
function cwHeight(x,z){
  const n=cwBlend(x,z,_cwB), f=cwFbm(x*.09,z*.09), r=cwFbm(x*.21+50,z*.21-20);
  let h=0, mtn=0;
  for(let i=0;i<n;i++){ const R=CW_REGIONS[_cwB[i*2]], B=CW_BIOME[R.biome], w=_cwB[i*2+1];
    let bh=B.h+B.v*(f-.45)*2;
    if(R.biome==='mountain'){ const rid=1-Math.abs(r*2-1); bh+=rid*5; mtn+=w; }
    if(R.biome==='badlands'){ bh=Math.round(bh*1.6)/1.6; }       // terraced mesas
    if(R.biome==='desert') bh+=.35*Math.sin(x*.9+z*.3+f*6);       // dune ripples
    if(R.pass) bh-=Math.max(0,4-Math.hypot(x-R.x,z-R.z)*.35);     // the pass is a notch through the ridge
    h+=bh*w; }
  // ridges
  for(const L of CW_RIDGES){ const d=cwLineD(x,z,L); if(d<8){ const k=1-d/8; h+=k*k*(6.5+4*r); } }
  // volcanoes: a cone with a crater
  for(const V of CW_VOLCANOES){ const d=Math.hypot(x-V[0],z-V[1]); if(d<V[2]){ const k=1-d/V[2]; h+=Math.pow(k,1.4)*V[2]*.9; if(d<V[2]*.22) h-=(V[2]*.22-d)*1.6; } }
  // rivers and lakes cut down below the water
  const rd=cwRiverD(x,z); if(rd<3){ const k=cwSmooth((rd-1)/2); h=Math.min(h,(CW.WL-.4)*(1-k)+h*k); }
  const ld=cwLakeD(x,z); if(ld<1.7){ const k=cwSmooth((ld-1)/.7); h=Math.min(h,(CW.WL-.6)*(1-k)+h*k); }
  // the coast drops into the sea
  const c=cwCoast(x,z); const ck=cwSmooth(c*7); h=h*ck+(-1.4)*(1-ck);
  return h;
}
// ground colour (r,g,b 0–1) at a point with height h
const _cwC={}; function cwHex(s){ return _cwC[s]||(_cwC[s]=[parseInt(s.slice(1,3),16)/255,parseInt(s.slice(3,5),16)/255,parseInt(s.slice(5,7),16)/255]); }
function cwColor(x,z,h,out){
  const n=cwBlend(x,z,_cwB); let r=0,g=0,b=0;
  for(let i=0;i<n;i++){ const R=CW_REGIONS[_cwB[i*2]], c=cwHex(CW_BIOME[R.biome].col), w=_cwB[i*2+1]; r+=c[0]*w; g+=c[1]*w; b+=c[2]*w; }
  const v=.88+.24*cwFbm(x*.35,z*.35); r*=v; g*=v; b*=v;
  const mix=(c,k)=>{ const q=cwHex(c); r+=(q[0]-r)*k; g+=(q[1]-g)*k; b+=(q[2]-b)*k; };
  if(h>6.5) mix('#8c8780',cwSmooth((h-6.5)/2.5));                 // bare rock high up
  if(h>10.5||(z<-38&&h>5.5)) mix('#f2f5f6',cwSmooth((h-(z<-38?5.5:10.5))/2));   // snow caps
  for(const V of CW_VOLCANOES){ const d=Math.hypot(x-V[0],z-V[1]); if(d<V[2]*.28) mix('#ff6a1a',cwSmooth(1-d/(V[2]*.28))*.9); else if(d<V[2]) mix('#2a2422',(1-d/V[2])*.6); }
  if(h<CW.WL+.35&&h>CW.WL-.8) mix('#c8b48a',.55);                   // sandy shores and banks
  if(h<CW.WL-.8) mix('#3a5a66',.6);                                  // sea floor
  out[0]=r; out[1]=g; out[2]=b; return out;
}
// the region grid: every 0.5 m cell knows its region (255 = sea). Borders wander a little so they look natural.
function cwBuildGrid(){
  if(CW.grid) return;
  CW_REGIONS.forEach((R,i)=>{ R._i=i; });
  CW.byId={}; for(const R of CW_REGIONS) CW.byId[R.id]=R;
  const W=CW.GW, Hh=CW.GH, G=new Uint8Array(W*Hh), sx=(CW.X1-CW.X0)/W, sz=(CW.Z1-CW.Z0)/Hh;
  for(let j=0;j<Hh;j++) for(let i=0;i<W;i++){ const x=CW.X0+(i+.5)*sx, z=CW.Z0+(j+.5)*sz;
    if(cwCoast(x,z)<.015){ G[j*W+i]=255; continue; }
    const wx=x+(cwNoise(x*.12+9,z*.12)-.5)*7, wz=z+(cwNoise(x*.12,z*.12-13)-.5)*7;
    let best=0, bd=1e18; for(let k=0;k<CW_REGIONS.length;k++){ const R=CW_REGIONS[k], d=(wx-R.x)**2+(wz-R.z)**2; if(d<bd){ bd=d; best=k; } }
    G[j*W+i]=best; }
  CW.grid=G;
  // neighbours: regions whose cells touch
  const A=CW_REGIONS.map(()=>new Set());
  for(let j=0;j<Hh;j++) for(let i=0;i<W;i++){ const a=G[j*W+i]; if(a===255) continue;
    if(i+1<W){ const b=G[j*W+i+1]; if(b!==255&&b!==a){ A[a].add(b); A[b].add(a); } }
    if(j+1<Hh){ const b=G[(j+1)*W+i]; if(b!==255&&b!==a){ A[a].add(b); A[b].add(a); } } }
  CW.adj={}; CW_REGIONS.forEach((R,i)=>{ CW.adj[R.id]=[...A[i]].map(k=>CW_REGIONS[k].id).sort(); });
}
// which region a map point is in (null at sea)
function cwRegionAt(x,z){ cwBuildGrid(); const i=Math.floor((x-CW.X0)/(CW.X1-CW.X0)*CW.GW), j=Math.floor((z-CW.Z0)/(CW.Z1-CW.Z0)*CW.GH);
  if(i<0||j<0||i>=CW.GW||j>=CW.GH) return null; const k=CW.grid[j*CW.GW+i]; return k===255?null:CW_REGIONS[k]; }
