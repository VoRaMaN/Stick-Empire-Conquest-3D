/* ---------------- tuning ---------------- */
const tune={step:1,bob:1,lean:1,spring:1,speed:1,dbg:false,blood:true};

/* ---------------- terrain ---------------- */
function mound(x,z,cx,cz,r,h){const dx=x-cx,dz=z-cz;return h*Math.exp(-(dx*dx+dz*dz)/(r*r));}
const TERR={wave:1,m:[[0,5,6.5,1.9],[-13,-5,5,1.3],[14,4.5,5,1.4],[-22,6,4,.9],[23,-6,4.5,1.0]]};
// The battlefield in play. The classic field keeps these numbers; a bigger map (Riverlands, 37d) swaps in its own
// bounds, height grid and ground. fx/fz: where soldiers outside a castle may stand; cx/cz: how far the camera roams.
// cf: |x| of each castle's curtain wall (the castles, statues at BASE_X and everything castle-local move with it)
const MAP={id:'classic',fx0:-42,fx1:42,fz0:-15,fz1:15,cx:72,cz:20,cf:46};
function Hx(x,z){
  if(MAP.id!=='classic') return rlWalkH(x,z);
  let h=TERR.wave*(0.42*Math.sin(x*0.19+0.4)*Math.cos(z*0.23)+0.3*Math.sin(x*0.071+1.3)*Math.sin(z*0.11+0.5));
  for(const q of TERR.m) h+=mound(x,z,q[0],q[1],q[2],q[3]);
  const flat=smooth(clamp((Math.abs(x)-27)/6,0,1));
  return h*(1-flat*0.85);
}
// gameplay height: bilinear lookup on the same 2/3 m grid the ground mesh uses (cheap, and units stand exactly on the drawn surface)
let HG_X0=-60, HG_Z0=-32, HG_NX=181, HG_NZ=97, HG_S=120/180, HG=new Float32Array(HG_NX*HG_NZ);
function heightGrid(x0,z0,nx,nz,s){ HG_X0=x0; HG_Z0=z0; HG_NX=nx; HG_NZ=nz; HG_S=s; if(HG.length!==nx*nz) HG=new Float32Array(nx*nz); }
function bakeH(){ for(let j=0;j<HG_NZ;j++) for(let i=0;i<HG_NX;i++) HG[j*HG_NX+i]=Hx(HG_X0+i*HG_S,HG_Z0+j*HG_S); }
// Each army's castle stands on a paved yard at CGY[team] (the highest ground under it, so the paving covers the
// terrain). Only soldiers walking inside a castle use that floor; H itself is unchanged everywhere.
const CGY=[0,0];
function H(x,z){
  let fx=(x-HG_X0)/HG_S, fz=(z-HG_Z0)/HG_S; fx=fx<0?0:fx>HG_NX-1.001?HG_NX-1.001:fx; fz=fz<0?0:fz>HG_NZ-1.001?HG_NZ-1.001:fz;
  const i=fx|0, j=fz|0, tx=fx-i, tz=fz-j, k=j*HG_NX+i;
  return (HG[k]*(1-tx)+HG[k+1]*tx)*(1-tz)+(HG[k+HG_NX]*(1-tx)+HG[k+HG_NX+1]*tx)*tz;
}

