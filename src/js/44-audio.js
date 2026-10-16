/* ---------------- sound: recorded effects, synthesized fallbacks + procedural music (Web Audio) ----------------
   Every effect is first synthesized into an AudioBuffer when audio starts (on the first tap, as browsers
   require). The ElevenLabs recordings embedded by the build are then decoded in the background and replace
   the synthesized takes name by name, so the game is never silent while they load (or if they can't).
   Each play gets a small pitch change so repeats don't sound identical.
   World sounds are panned and faded by where they happen relative to the camera, and a voice budget keeps
   a 400-soldier battle from turning into noise. */
const AC_=window.AudioContext||window.webkitAudioContext;
const audio={ctx:null,ready:false,master:null,sfxBus:null,musicBus:null,verbSend:null,bank:{},voices:0,last:{},frameN:0,
  amb:null,mus:null,duck:1,inMenu:false,voiceBus:null,talk:0};
// recorded take levels (the files are normalised to the same loudness) and the synthesized names they replace
const SAMPLE_VOL={clang:.42,parry:.55,shield:.55,slash:.42,stab:.48,blunt:.55,heavy:.78,swing:.3,swingHeavy:.38,bow:.4,arrowHit:.42,arrowShield:.45,arrowGround:.22,
  death:.42,roar:.66,warcry:.5,horn:.55,land:.38,giantStep:.55,mine:.3,coin:.32,stone:.55,crumble:.95,cast:.4,orbWhoosh:.34,blast:.68,zap:.42,thunder:.85,poison:.42,
  heal:.42,flash:.5,smite:.6,cloak:.42,crossbow:.45,flap:.34,door:.62,gate:.7,hatch:.6,research:.5,rage:.6,shieldWall:.6,ignite:.5};
const MAX_VOICES=30, MAX_PER_FRAME=7;

// ---- tiny DSP toolkit (sample domain) ----
const TAU=Math.PI*2;
function biq(type,f,q,sr){ // RBJ biquad; .set(f) retunes it for sweeps
  let b0,b1,b2,a1,a2,x1=0,x2=0,y1=0,y2=0;
  const set=(fr,qq)=>{ const w=TAU*clamp(fr,10,sr*.45)/sr, cs=Math.cos(w), al=Math.sin(w)/(2*(qq||q)), a0=1+al;
    if(type==='lp'){ b0=(1-cs)/2; b1=1-cs; b2=b0; } else if(type==='hp'){ b0=(1+cs)/2; b1=-(1+cs); b2=b0; } else { b0=al; b1=0; b2=-al; }
    b0/=a0; b1/=a0; b2/=a0; a1=-2*cs/a0; a2=(1-al)/a0; };
  set(f,q);
  const fn=x=>{ const y=b0*x+b1*x1+b2*x2-a1*y1-a2*y2; x2=x1; x1=x; y2=y1; y1=y; return y; }; fn.set=set; return fn;
}
const env=(t,a,d)=>t<a?t/a:Math.exp(-(t-a)/d);             // attack, then exponential decay
let _seed=1; const rnd=()=>{ _seed=(_seed*16807)%2147483647; return _seed/2147483647; };
const noise=()=>rnd()*2-1;
function buf(dur,fn,gain){
  const c=audio.ctx, sr=c.sampleRate, n=Math.max(1,Math.floor(dur*sr)), b=c.createBuffer(1,n,sr), d=b.getChannelData(0);
  fn(d,sr,n); let pk=0; for(let i=0;i<n;i++) pk=Math.max(pk,Math.abs(d[i]));
  const k=pk>0?(gain||.9)/pk:0; for(let i=0;i<n;i++) d[i]*=k;
  const fade=Math.min(n,Math.floor(sr*.004)); for(let i=0;i<fade;i++) d[n-1-i]*=i/fade;
  return b;
}
// struck metal: inharmonic partials with their own decays plus a bright click
function metal(d,sr,n,f0,ratios,amps,decs,clickHP){
  const hp=biq('hp',clickHP||2500,.7,sr);
  for(let i=0;i<n;i++){ const t=i/sr; let v=0;
    for(let k=0;k<ratios.length;k++) v+=amps[k]*Math.sin(TAU*f0*ratios[k]*t+k)*Math.exp(-t/decs[k]);
    v+=hp(noise())*Math.exp(-t/.012)*.9; d[i]+=v; }
}
function thump(d,sr,n,f1,f2,dec,amp){ let ph=0; for(let i=0;i<n;i++){ const t=i/sr, f=f2+(f1-f2)*Math.exp(-t/.04); ph+=TAU*f/sr; d[i]+=(amp||1)*Math.sin(ph)*env(t,.002,dec); } }
function noiseBurst(d,sr,n,type,f,q,dec,amp,start){ const fl=biq(type,f,q,sr), s0=Math.floor((start||0)*sr);
  for(let i=s0;i<n;i++){ const t=(i-s0)/sr; d[i]+=(amp||1)*fl(noise())*env(t,.001,dec); } }
function sweep(d,sr,n,f1,f2,q,amp,shape){ const fl=biq('bp',f1,q,sr); // filtered-noise whoosh
  for(let i=0;i<n;i++){ const p=i/n; if(i%32===0) fl.set(f1*Math.pow(f2/f1,p)); const e=shape?shape(p):Math.sin(Math.PI*p)**2; d[i]+=(amp||1)*fl(noise())*e; } }
// a voice: glottal pulse train through three vowel formants
const VOWEL={a:[730,1090,2440],o:[570,840,2410],u:[440,1020,2240],e:[530,1840,2480]};
function voice(d,sr,n,f0,f0end,vowel,dur,breath,amp,start,vib){
  const F=VOWEL[vowel], fs=F.map((f,k)=>biq('bp',f,[5,7,9][k],sr)), s0=Math.floor((start||0)*sr), m=Math.min(n,s0+Math.floor(dur*sr));
  let ph=0;
  for(let i=s0;i<m;i++){ const t=(i-s0)/sr, p=t/dur, f=(f0+(f0end-f0)*p)*(1+(vib||0)*Math.sin(TAU*5.5*t));
    ph+=f/sr; if(ph>1) ph-=1; const src=(ph<.4?Math.sin(Math.PI*ph/.4):0)-.25+noise()*(breath||.15);
    const e=Math.min(1,t/.03)*Math.pow(1-p,.7);
    d[i]+=(amp||1)*e*(fs[0](src)*1+fs[1](src)*.6+fs[2](src)*.25); }
}
function pluck(d,sr,n,f,decay,bright){ // Karplus-Strong string
  const N=Math.max(2,Math.round(sr/f)), ring=new Float32Array(N); for(let i=0;i<N;i++) ring[i]=noise();
  let idx=0; const k=decay||.996, b=bright||.5;
  for(let i=0;i<n;i++){ const cur=ring[idx], nxt=ring[(idx+1)%N]; ring[idx]=k*(b*cur+(1-b)*.5*(cur+nxt)); d[i]+=cur; idx=(idx+1)%N; }
}
function brass(d,sr,n,freqs,t0,dur,amp,cut){ // saw ensemble through an opening low-pass
  const fl=biq('lp',300,.9,sr), s0=Math.floor(t0*sr), m=Math.min(n,s0+Math.floor(dur*sr)); const ph=freqs.map(()=>rnd());
  for(let i=s0;i<m;i++){ const t=(i-s0)/sr, p=t/dur; if(i%32===0) fl.set((cut||1800)*(.25+.75*Math.min(1,t/.18))*(1-.4*p));
    let v=0; for(let k=0;k<freqs.length;k++){ ph[k]+=freqs[k]*(1+.003*Math.sin(TAU*4.8*t+k))/sr; ph[k]-=Math.floor(ph[k]); v+=ph[k]*2-1; }
    d[i]+=(amp||1)*fl(v/freqs.length)*Math.min(1,t/.06)*Math.min(1,(dur-t)/.25); }
}

// ---- the sound bank: name -> {v:[buffers], vol, gap(s), vary(pitch ±), verb(send)} ----
function buildSounds(){
  const B=audio.bank, add=(name,o,mk)=>{ B[name]=Object.assign({v:[],vol:1,gap:.03,vary:.06,verb:.25},o); for(let i=0;i<(o.n||1);i++){ _seed=7+i*131+name.length*17; B[name].v.push(mk(i)); } };
  add('clang',{n:4,vol:.55,gap:.035,verb:.4},i=>buf(1.1,(d,sr,n)=>metal(d,sr,n,560+i*95,[1,2.76,5.4,8.93,13.3],[1,.7,.5,.32,.18],[.55,.4,.26,.16,.09])));
  add('parry',{n:2,vol:.7,gap:.05,verb:.45},i=>buf(1.2,(d,sr,n)=>{ metal(d,sr,n,720+i*140,[1,2.76,5.4,8.93],[1,.8,.55,.3],[.7,.45,.3,.18]); sweep(d,sr,Math.floor(n*.12),3600,1500,3,.6,p=>1-p); }));
  add('shield',{n:3,vol:.7,gap:.04,verb:.35},i=>buf(.8,(d,sr,n)=>{ thump(d,sr,n,140,70,.09,1.2); metal(d,sr,n,205+i*30,[1,1.59,2.32,3.12,4.6],[.5,.4,.3,.2,.1],[.35,.28,.2,.12,.08],900); noiseBurst(d,sr,n,'bp',650,1.5,.035,.8); }));
  add('slash',{n:4,vol:.55,gap:.03,verb:.15},i=>buf(.32,(d,sr,n)=>{ sweep(d,sr,Math.floor(n*.45),2200,700,2.2,.7,p=>Math.sin(Math.PI*p)); noiseBurst(d,sr,n,'lp',500+i*90,.8,.06,.9,.1); thump(d,sr,n,150,70,.07,.5); }));
  add('stab',{n:3,vol:.55,gap:.03,verb:.12},i=>buf(.25,(d,sr,n)=>{ thump(d,sr,n,130,55,.08,1); noiseBurst(d,sr,n,'bp',850+i*120,3,.06,.8,.012); }));
  add('blunt',{n:3,vol:.65,gap:.035,verb:.2},i=>buf(.35,(d,sr,n)=>{ thump(d,sr,n,95,42,.13,1.2); noiseBurst(d,sr,n,'lp',1300,.7,.03,.7); }));
  add('punch',{n:3,vol:.5,gap:.03,verb:.12},i=>buf(.2,(d,sr,n)=>{ thump(d,sr,n,115+i*12,60,.06,1); noiseBurst(d,sr,n,'lp',2200,.7,.018,.5); }));
  add('heavy',{n:2,vol:.95,gap:.08,verb:.4,vary:.04},i=>buf(1.1,(d,sr,n)=>{ thump(d,sr,n,70,30,.35,1.3); noiseBurst(d,sr,n,'lp',380,.7,.3,.8); noiseBurst(d,sr,n,'lp',1800,.7,.025,.6); }));
  add('swing',{n:3,vol:.28,gap:.04,verb:.05,vary:.12},i=>buf(.26,(d,sr,n)=>sweep(d,sr,n,450+i*80,1500+i*200,1.6,1)));
  add('swingHeavy',{n:2,vol:.45,gap:.08,verb:.08,vary:.08},i=>buf(.5,(d,sr,n)=>sweep(d,sr,n,220,700,1.4,1)));
  add('bow',{n:3,vol:.32,gap:.03,verb:.1,vary:.08},i=>buf(.32,(d,sr,n)=>{ pluck(d,sr,n,92+i*9,.985,.55); noiseBurst(d,sr,n,'hp',3000,.7,.008,.9); }));
  add('arrowHit',{n:3,vol:.4,gap:.025,verb:.08},i=>buf(.12,(d,sr,n)=>{ thump(d,sr,n,190,90,.035,1); noiseBurst(d,sr,n,'lp',1600,.7,.02,.8); }));
  add('arrowShield',{n:2,vol:.45,gap:.03,verb:.2},i=>buf(.25,(d,sr,n)=>{ metal(d,sr,n,410+i*60,[1,2.7,4.4],[1,.4,.2],[.09,.05,.03],1800); thump(d,sr,n,160,90,.04,.6); }));
  add('arrowGround',{n:3,vol:.18,gap:.03,verb:.05,vary:.15},i=>buf(.09,(d,sr,n)=>{ noiseBurst(d,sr,n,'bp',2400,1.2,.012,1); thump(d,sr,n,120,70,.025,.5); }));
  add('death',{n:6,vol:.42,gap:.06,verb:.2,vary:.05},i=>buf(.75,(d,sr,n)=>{ const f=[118,132,104,146,126,96][i]; voice(d,sr,n,f*1.12,f*.78,['u','a','o','a','u','o'][i],.42+.05*(i%3),.18,1,0,.01); }));
  add('roar',{n:2,vol:.75,gap:.4,verb:.4,vary:.04},i=>buf(1.3,(d,sr,n)=>{ voice(d,sr,n,74+i*8,58,'o',1.15,.35,1,0,.03); for(let k=0;k<n;k++) d[k]*=1+.45*Math.sin(TAU*27*k/sr); }));
  add('warcry',{n:2,vol:.6,gap:.8,verb:.5,vary:.03},i=>buf(1.9,(d,sr,n)=>{ for(let k=0;k<26;k++){ const f=108+rnd()*95; voice(d,sr,n,f*.96,f*1.04,rnd()<.6?'a':'o',1.35+rnd()*.35,.25,.5+rnd()*.5,rnd()*.22,.012); } }));
  add('horn',{n:1,vol:.5,gap:.8,verb:.55,vary:0},()=>buf(1.9,(d,sr,n)=>{ brass(d,sr,n,[110,110.6,165],0,1.75,1,1600); }));
  add('hornEnemy',{n:1,vol:.4,gap:1.2,verb:.6,vary:0},()=>buf(2.1,(d,sr,n)=>{ brass(d,sr,n,[87.3,87.8,130.8],0,1.95,1,1100); }));
  add('drum',{n:2,vol:.55,gap:.08,verb:.35,vary:.04},i=>buf(.6,(d,sr,n)=>{ thump(d,sr,n,82-i*8,46,.22,1.2); noiseBurst(d,sr,n,'lp',320,.7,.05,.5); noiseBurst(d,sr,n,'hp',2500,.7,.006,.25); }));
  add('order',{n:1,vol:.45,gap:.15,verb:.35},()=>buf(.7,(d,sr,n)=>{ thump(d,sr,n,82,46,.2,1.2); thump(d,sr,n,82,46,.2,.9); for(let k=Math.floor(.16*sr);k<n;k++){ const t=k/sr-.16; d[k]+=Math.sin(TAU*60*t)*env(t,.002,.2); } }));
  add('finisher',{n:2,vol:.8,gap:.25,verb:.5,vary:.03},i=>buf(1.4,(d,sr,n)=>{ thump(d,sr,n,60,32,.55,1.4); metal(d,sr,n,300+i*60,[1,2.76,5.4],[.5,.35,.2],[.6,.4,.25],1500); noiseBurst(d,sr,n,'lp',900,.7,.12,.8); }));
  add('land',{n:2,vol:.4,gap:.05,verb:.1},i=>buf(.25,(d,sr,n)=>{ thump(d,sr,n,90,50,.08,1); noiseBurst(d,sr,n,'lp',700,.7,.05,.6); }));
  add('giantStep',{n:3,vol:.5,gap:.06,verb:.25,vary:.06},i=>buf(.5,(d,sr,n)=>{ thump(d,sr,n,58,30,.2,1.2); noiseBurst(d,sr,n,'lp',220,.7,.15,.6); }));
  add('mine',{n:3,vol:.25,gap:.05,verb:.15,vary:.1},i=>buf(.2,(d,sr,n)=>{ metal(d,sr,n,1350+i*170,[1,2.2,3.7],[1,.5,.3],[.06,.04,.025],3200); noiseBurst(d,sr,n,'bp',3500,1,.02,.6); }));
  add('coin',{n:2,vol:.22,gap:.08,verb:.25,vary:.02},i=>buf(.45,(d,sr,n)=>{ for(const [f,t0] of [[1975.5,0],[2637,.07]]) for(let k=Math.floor(t0*sr);k<n;k++){ const t=k/sr-t0; d[k]+=Math.sin(TAU*f*(1+i*.06)*t)*env(t,.002,.12); } }));
  add('stone',{n:3,vol:.55,gap:.12,verb:.3},i=>buf(.5,(d,sr,n)=>{ thump(d,sr,n,95,55,.1,1); noiseBurst(d,sr,n,'lp',900,.7,.14,.9); for(let k=0;k<14;k++){ const s=Math.floor((.01+rnd()*.25)*sr); if(s<n) d[s]+=noise()*.8; } }));
  add('crumble',{n:1,vol:.9,gap:2,verb:.5,vary:0},()=>buf(2.8,(d,sr,n)=>{ noiseBurst(d,sr,n,'lp',260,.7,1.1,1.2); thump(d,sr,n,55,28,.8,1); for(let k=0;k<260;k++){ const s=Math.floor(rnd()*2.4*sr); if(s<n) d[s]+=noise()*.9*(1-s/n); } }));
  add('ui',{n:1,vol:.25,gap:.04,verb:0,vary:.03},()=>buf(.06,(d,sr,n)=>{ for(let k=0;k<n;k++){ const t=k/sr; d[k]=Math.sin(TAU*(1250-4000*t)*t)*env(t,.001,.012); } }));
  add('buy',{n:1,vol:.4,gap:.05,verb:.2,vary:.02},()=>buf(.5,(d,sr,n)=>{ thump(d,sr,n,120,70,.08,1); for(const [f,t0] of [[1568,.02],[2093,.09]]) for(let k=Math.floor(t0*sr);k<n;k++){ const t=k/sr-t0; d[k]+=.6*Math.sin(TAU*f*t)*env(t,.002,.1); } }));
  add('deny',{n:1,vol:.3,gap:.1,verb:0,vary:0},()=>buf(.18,(d,sr,n)=>{ for(let k=0;k<n;k++){ const t=k/sr; d[k]=(Math.sin(TAU*140*t)>0?.6:-.6)*env(t,.005,.06)*(1-t/.18); } }));
  add('victory',{n:1,vol:.75,gap:2,verb:.5,vary:0},()=>buf(3.6,(d,sr,n)=>{ const ch=[[146.8,185,220],[196,246.9,293.7],[220,277.2,329.6],[293.7,370,440]];
    ch.forEach((c,k)=>brass(d,sr,n,c.flatMap(f=>[f,f*1.004]),k*.55,k===3?1.9:.6,.9,2400)); for(const t0 of [0,.55,1.1,1.65,1.75]){ const s=Math.floor(t0*sr); for(let k=s;k<n;k++){ const t=(k-s)/sr; d[k]+=.7*Math.sin(TAU*(70+30*Math.exp(-t/.03))*t)*env(t,.002,.25); } } }));
  add('defeat',{n:1,vol:.7,gap:2,verb:.6,vary:0},()=>buf(3.8,(d,sr,n)=>{ [[146.8,174.6],[130.8,155.6],[116.5,138.6],[110,130.8]].forEach((c,k)=>brass(d,sr,n,c.flatMap(f=>[f,f*1.003]),k*.8,k===3?1.8:.9,.9,1000)); }));
  // the four Order units added later: spells, crossbow, wing flaps
  add('cast',{n:2,vol:.35,gap:.08,verb:.45,vary:.05},i=>buf(.7,(d,sr,n)=>{ sweep(d,sr,n,300+i*60,2400,4,.8,p=>Math.sin(Math.PI*Math.min(1,p*1.4))**2); for(let k=0;k<n;k++){ const t=k/sr; d[k]+=.35*Math.sin(TAU*(420+i*40+600*t)*t)*env(t,.15,.25); } }));
  add('orbWhoosh',{n:2,vol:.32,gap:.06,verb:.2,vary:.1},i=>buf(.45,(d,sr,n)=>{ sweep(d,sr,n,900+i*120,380,2.5,1); for(let k=0;k<n;k++){ const t=k/sr; d[k]+=.25*Math.sin(TAU*(880-500*t)*t)*Math.sin(Math.PI*t/.45); } }));
  add('blast',{n:3,vol:.75,gap:.05,verb:.45,vary:.06},i=>buf(1.0,(d,sr,n)=>{ thump(d,sr,n,120+i*14,40,.22,1.2); noiseBurst(d,sr,n,'lp',1100+i*200,.7,.18,1); noiseBurst(d,sr,n,'hp',3000,.7,.03,.5); for(let k=0;k<30;k++){ const s=Math.floor((.02+rnd()*.4)*sr); if(s<n) d[s]+=noise()*.5*(1-s/n); } }));
  add('zap',{n:3,vol:.4,gap:.04,verb:.2,vary:.1},i=>buf(.35,(d,sr,n)=>{ for(let k=0;k<n;k++){ const t=k/sr; const sq=Math.sin(TAU*(60+i*7)*t)>0?1:-1; d[k]+=(sq*.4+noise()*.6)*(Math.random()<.85?1:.2)*env(t,.002,.12); } noiseBurst(d,sr,n,'hp',4000,.7,.05,.6); }));
  add('thunder',{n:2,vol:.95,gap:.25,verb:.6,vary:.05},i=>buf(2.2,(d,sr,n)=>{ noiseBurst(d,sr,n,'hp',2500,.7,.04,1.2); noiseBurst(d,sr,n,'lp',200+i*40,.7,.9,1.4,.03); thump(d,sr,n,70,28,.6,1); for(let k=0;k<40;k++){ const s=Math.floor((.05+rnd()*1.4)*sr); if(s<n) noiseBurst(d,sr,Math.min(n,s+Math.floor(.2*sr)),'lp',300,.7,.08,.4*(1-s/n),s/sr); } }));
  add('poison',{n:2,vol:.45,gap:.1,verb:.25,vary:.06},i=>buf(1.1,(d,sr,n)=>{ sweep(d,sr,n,1800,600+i*100,1.2,1,p=>Math.min(1,p*6)*(1-p)); for(let k=0;k<12;k++){ const s=Math.floor((.1+rnd()*.8)*sr); thump(d.subarray(s),sr,n-s,500+rnd()*400,300,.03,.3); } }));
  add('heal',{n:2,vol:.4,gap:.12,verb:.6,vary:.02},i=>buf(1.4,(d,sr,n)=>{ for(const [f,t0] of [[523.3,0],[659.3,.1],[784,.2],[1046.5,.3]]) for(let k=Math.floor(t0*sr);k<n;k++){ const t=k/sr-t0; d[k]+=.4*(Math.sin(TAU*f*(1+i*.12)*t)+.3*Math.sin(TAU*f*2.01*t))*env(t,.04,.45); } sweep(d,sr,n,3000,6000,2,.15); }));
  add('cure',{n:1,vol:.4,gap:.15,verb:.6,vary:.02},()=>buf(1.2,(d,sr,n)=>{ for(const [f,t0] of [[987.8,0],[1318.5,.08],[1975.5,.16]]) for(let k=Math.floor(t0*sr);k<n;k++){ const t=k/sr-t0; d[k]+=.4*Math.sin(TAU*f*t)*env(t,.01,.35); } sweep(d,sr,n,1200,5000,1.5,.3); }));
  add('flash',{n:1,vol:.55,gap:.2,verb:.6,vary:.02},()=>buf(1.2,(d,sr,n)=>{ noiseBurst(d,sr,n,'hp',5000,.7,.08,1); for(let k=0;k<n;k++){ const t=k/sr; d[k]+=.5*Math.sin(TAU*(1500+800*Math.sin(TAU*7*t))*t)*env(t,.005,.3); } }));
  add('smite',{n:2,vol:.65,gap:.08,verb:.5,vary:.05},i=>buf(.9,(d,sr,n)=>{ thump(d,sr,n,110,50,.15,1.2); metal(d,sr,n,880+i*110,[1,2.01,3.02],[.6,.35,.2],[.4,.3,.2],3000); }));
  add('cloak',{n:1,vol:.4,gap:.2,verb:.3,vary:.03},()=>buf(.9,(d,sr,n)=>{ sweep(d,sr,n,3000,250,3,1,p=>(1-p)**1.5); noiseBurst(d,sr,n,'lp',600,.7,.25,.5,.05); }));
  add('crossbow',{n:3,vol:.45,gap:.03,verb:.12,vary:.06},i=>buf(.35,(d,sr,n)=>{ thump(d,sr,n,240+i*20,120,.03,1); pluck(d,sr,n,180+i*15,.97,.75); noiseBurst(d,sr,n,'hp',2500,.7,.015,.8); }));
  add('reload',{n:2,vol:.25,gap:.1,verb:.05,vary:.06},i=>buf(.3,(d,sr,n)=>{ metal(d,sr,n,1500+i*200,[1,2.3],[.4,.2],[.02,.015],3000); noiseBurst(d,sr,n,'bp',1800,2,.03,.6,.12); }));
  add('flap',{n:3,vol:.32,gap:.12,verb:.08,vary:.1},i=>buf(.32,(d,sr,n)=>{ sweep(d,sr,n,260+i*40,140,1.1,1,p=>Math.sin(Math.PI*Math.min(1,p*1.6))**2); thump(d,sr,n,90,55,.05,.35); noiseBurst(d,sr,n,'bp',900,1.5,.012,.3,.1); }));
  // music voices
  add('mDrum',{n:2,vol:1,gap:0,verb:.35,vary:.02},i=>buf(.9,(d,sr,n)=>{ thump(d,sr,n,70-i*16,38-i*6,.32,1.3); noiseBurst(d,sr,n,'lp',260,.7,.08,.45); noiseBurst(d,sr,n,'hp',2000,.7,.008,.15); }));
  add('mRim',{n:1,vol:1,gap:0,verb:.2,vary:.03},()=>buf(.15,(d,sr,n)=>{ noiseBurst(d,sr,n,'bp',1800,2,.03,1); thump(d,sr,n,320,240,.03,.4); }));
  add('mPluck',{n:1,vol:1,gap:0,verb:.3,vary:0},()=>buf(1.2,(d,sr,n)=>{ pluck(d,sr,n,146.83,.993,.45); }));
  add('mHorn',{n:1,vol:1,gap:0,verb:.6,vary:0},()=>buf(2.4,(d,sr,n)=>{ brass(d,sr,n,[146.83,147.4,220.5],0,2.3,1,1300); }));
}

// ---- playback ----
const _ap2=new V3();
function spatial(p){ // gain and stereo position of a world sound for the current camera
  const dx=p.x-cam.target.x, dz=p.z-cam.target.z, df=Math.hypot(dx,dz), R=7+cam.dist*.45;
  let g=1/(1+(df/R)*(df/R))*Math.pow(clamp(16/cam.dist,.3,1.25),.6);
  _ap2.copy(p).sub(camera.position); const dist=_ap2.length()||1;
  const x=(_ap2.x*Math.cos(cam.yaw)-_ap2.z*Math.sin(cam.yaw))/dist;
  return {g,pan:clamp(x*1.3,-.85,.85)};
}
function sfx(name,pos,vol,opt){
  if(!audio.ready||audio.ctx.state!=='running') return;
  if(name==='hornEnemy'&&audio.bank.horn&&audio.bank.horn.rec){ opt=Object.assign({rate:.8},opt); name='horn'; vol=(vol===undefined?1:vol)*.85; }
  const S=audio.bank[name]; if(!S||!S.v.length) return;
  const c=audio.ctx, now=c.currentTime, delay=(opt&&opt.delay)||0;
  if(now-(audio.last[name]||-9)<S.gap) return;
  let g=(vol===undefined?1:vol)*S.vol, pan=0;
  if(pos){ const a=spatial(pos); g*=a.g; pan=a.pan; }
  if(audio.inMenu&&pos) g*=.55;
  if(g<.025) return;
  if((audio.voices>=MAX_VOICES||audio.frameN>=MAX_PER_FRAME)&&g<.6) return;
  audio.last[name]=now; audio.voices++; audio.frameN++;
  const src=c.createBufferSource(); src.buffer=S.v[Math.floor(Math.random()*S.v.length)];
  src.playbackRate.value=((opt&&opt.rate)||1)*(1+(Math.random()*2-1)*S.vary);
  const gn=c.createGain(); gn.gain.value=Math.min(1.6,g);
  src.connect(gn);
  let out=gn; if(pan&&c.createStereoPanner){ const pn=c.createStereoPanner(); pn.pan.value=pan; gn.connect(pn); out=pn; }
  out.connect(audio.sfxBus); if(S.verb>0){ const vs=c.createGain(); vs.gain.value=S.verb; out.connect(vs); vs.connect(audio.verbSend); }
  src.onended=()=>{ audio.voices--; try{ src.disconnect(); gn.disconnect(); }catch(e){} };
  src.start(now+delay);
}
// which sound a landed blow makes, from the weapon part that struck
function hitSfx(u,e,at,vol){
  const by=e&&e.aim?e.aim[0]:null;
  const n=by==='hL'||by==='foot'||by==='head'||by==='shoulder'||by==='pommel'?'punch':u.type==='giant'?'heavy':u.type==='miner'?'blunt':(u.type==='spear'||by==='tip')?'stab':'slash';
  sfx(n,at,vol);
}

// ---- volumes, unlock, ambience ----
function applyVolumes(){
  if(!audio.ctx) return; const t=audio.ctx.currentTime;
  audio.master.gain.setTargetAtTime(settings.master,t,.05);
  audio.sfxBus.gain.setTargetAtTime(settings.sfx,t,.05);
  const talk=audio.talk>0?.45:1;
  audio.musicBus.gain.setTargetAtTime(settings.music*.55*audio.duck*talk,t,.15);
  if(audio.voiceBus) audio.voiceBus.gain.setTargetAtTime(settings.voice===false?0:Math.max(.35,settings.sfx)*1.1,t,.05);
}
function impulse(c,dur,decay){ const sr=c.sampleRate, n=Math.floor(dur*sr), b=c.createBuffer(2,n,sr);
  for(let ch=0;ch<2;ch++){ const d=b.getChannelData(ch); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay); } return b; }
function audioInit(){
  if(audio.ctx||!AC_) return;
  try{ audio.ctx=new AC_({latencyHint:'interactive'}); }catch(e){ try{ audio.ctx=new AC_(); }catch(e2){ return; } }
  const c=audio.ctx;
  audio.master=c.createGain();
  const comp=c.createDynamicsCompressor(); comp.threshold.value=-12; comp.knee.value=10; comp.ratio.value=4; comp.attack.value=.003; comp.release.value=.25;
  audio.master.connect(comp); comp.connect(c.destination);
  audio.sfxBus=c.createGain(); audio.sfxBus.connect(audio.master);
  audio.musicBus=c.createGain(); audio.musicBus.connect(audio.master);
  const verb=c.createConvolver(); verb.buffer=impulse(c,1.8,3); audio.verbSend=c.createGain(); audio.verbSend.gain.value=.3; audio.verbSend.connect(verb); verb.connect(audio.master);
  audio.voiceBus=c.createGain(); audio.voiceBus.connect(audio.master);
  buildSounds(); applyVolumes(); startAmbience(); startMusic();
  audio.ready=true;
  loadRecordings();
}
// decode the embedded recordings: effects replace their synthesized counterparts, voices fill the narrator bank
function decodeB64(b64){ const c=audio.ctx; return new Promise(res=>{ try{ const p=c.decodeAudioData(b64buf(b64),res,()=>res(null)); if(p&&p.catch) p.catch(()=>res(null)); }catch(e){ res(null); } }); }
function loadRecordings(){
  loadAssets().then(async A=>{ if(!A) return;
    for(const name in (A.sfx||{})){ const L=[]; for(const b of A.sfx[name]){ const buf=await decodeB64(b); if(buf) L.push(buf); }
      if(!L.length) continue; const S=audio.bank[name]||(audio.bank[name]={v:[],vol:1,gap:.05,vary:.06,verb:.2});
      S.v=L; S.rec=true; S.vol=SAMPLE_VOL[name]||.5; S.vary=Math.max(.04,Math.min(S.vary,.08)); }
    for(const name in (A.vox||{})){ const buf=await decodeB64(A.vox[name]); if(buf) VOX.buf[name]=buf; }
    if(audio.inMenu&&!VOX.said.awaits&&settings.voice){ VOX.said.awaits=1; playVoice('n_awaits',1,'n'); }
  });
}
function audioUnlock(){
  if(!audio.ctx) audioInit();
  if(audio.ctx&&audio.ctx.state==='suspended'&&!document.hidden) audio.ctx.resume().catch(()=>{});
}
for(const ev of ['pointerdown','touchend','keydown','click']) window.addEventListener(ev,audioUnlock,{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{ if(!audio.ctx) return; if(document.hidden) audio.ctx.suspend().catch(()=>{}); else audio.ctx.resume().catch(()=>{}); });

// battle bed: a looping crowd/clatter layer whose level follows how much fighting is near the camera
function startAmbience(){
  const c=audio.ctx, sr=c.sampleRate, n=Math.floor(sr*4);
  _seed=99;
  const b=c.createBuffer(2,n,sr);
  for(let ch=0;ch<2;ch++){ const d=b.getChannelData(ch), lp=biq('lp',420,.6,sr), bp=biq('bp',900,2,sr);
    let mod=0; for(let i=0;i<n;i++){ if(i%2000===0) mod=.5+rnd()*.5; d[i]=lp(noise())*.7*mod+bp(noise())*.12; }
    for(let k=0;k<70;k++){ const s=Math.floor(rnd()*(n-sr*.3)), f=500+rnd()*900; for(let i=0;i<sr*.25;i++){ const t=i/sr; d[s+i]+=.05*Math.sin(TAU*f*t)*Math.exp(-t/.06); } }
    for(let i=0;i<sr*.05;i++){ const k=i/(sr*.05); d[i]*=k; d[n-1-i]*=k; } }
  const src=c.createBufferSource(); src.buffer=b; src.loop=true;
  const g=c.createGain(); g.gain.value=0; src.connect(g); g.connect(audio.sfxBus); src.start();
  // calm wind under everything
  const wb=c.createBuffer(1,Math.floor(sr*5),sr), wd=wb.getChannelData(0), wl=biq('lp',500,.5,sr);
  for(let i=0;i<wd.length;i++){ wd[i]=wl(noise())*(.6+.4*Math.sin(TAU*i/wd.length)); }
  const ws=c.createBufferSource(); ws.buffer=wb; ws.loop=true; const wg=c.createGain(); wg.gain.value=.05; ws.connect(wg); wg.connect(audio.sfxBus); ws.start();
  audio.amb={g,level:0};
}

// ---- procedural music: drone, war drums, plucked ostinato and a horn call, layered by battle intensity ----
const MUS={bpm:84, step:0, next:0, intensity:.25, target:.25, timer:null};
const SCALE=[0,2,3,5,7,8,10];      // D minor (aeolian) with the flat 6th for weight
const OST=[[0,0,7,0,3,0,5,3],[0,0,7,0,8,7,5,3],[0,0,10,7,8,7,5,7],[-2,0,3,0,5,3,2,0]];
const HORN=[[0,3.2],[5,1.6],[3,1.6],[7,3.2],[5,1.6],[3,1.6],[2,2.4],[0,4]];
function startMusic(){
  const c=audio.ctx;
  // drone: two detuned saws on D and A through a low-pass whose cutoff rises with intensity
  const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=260; lp.Q.value=.7;
  const dg=c.createGain(); dg.gain.value=0; lp.connect(dg); dg.connect(audio.musicBus);
  for(const [f,det] of [[73.42,-6],[73.42,5],[110,3],[146.83,-4]]){ const o=c.createOscillator(); o.type='sawtooth'; o.frequency.value=f; o.detune.value=det; const g=c.createGain(); g.gain.value=f>140?.08:.16; o.connect(g); g.connect(lp); o.start(); }
  dg.gain.setTargetAtTime(.32,c.currentTime,2);
  audio.mus={lp,dg};
  MUS.next=c.currentTime+.2; MUS.step=0;
  MUS.timer=setInterval(scheduleMusic,90);
}
function mNote(name,t,rate,vol){ const c=audio.ctx, S=audio.bank[name]; if(!S) return;
  const src=c.createBufferSource(); src.buffer=S.v[Math.floor(Math.random()*S.v.length)]; src.playbackRate.value=rate;
  const g=c.createGain(); g.gain.value=vol; src.connect(g); g.connect(audio.musicBus);
  if(S.verb){ const v=c.createGain(); v.gain.value=S.verb; g.connect(v); v.connect(audio.verbSend); }
  src.onended=()=>{ try{ src.disconnect(); g.disconnect(); }catch(e){} }; src.start(t); }
const semi=s=>Math.pow(2,s/12);
function deg(dg){ const o=Math.floor(dg/7), i=((dg%7)+7)%7; return SCALE[i]+12*o; }
function scheduleMusic(){
  const c=audio.ctx; if(!c||c.state!=='running') { if(c) MUS.next=c.currentTime+.1; return; }
  MUS.intensity+=(MUS.target-MUS.intensity)*.04;
  const I=MUS.intensity, s8=60/MUS.bpm/2;            // eighth notes
  const now=c.currentTime; if(MUS.next<now-.5) MUS.next=now+.05;
  while(MUS.next<now+.35){
    const st=MUS.step, t=MUS.next, inBar=st%16, bar=Math.floor(st/16);
    // drums: sparse heartbeat when calm, a driving pattern in battle
    const calm=[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], mid=[1,0,0,1,0,0,1,0,1,0,0,0,1,0,0,0], hot=[1,0,1,1,0,1,1,0,1,0,1,1,0,1,1,1];
    const pat=I>.66?hot:I>.38?mid:calm;
    if(pat[inBar]) mNote('mDrum',t,inBar%8===0?.85:1,(inBar%8===0?.9:.55)*(.5+I*.6));
    if(I>.5&&inBar%4===2) mNote('mRim',t,1,.25*I);
    // plucked ostinato from moderate intensity
    if(I>.32){ const ph=OST[bar%OST.length], dg=ph[inBar%8]; mNote('mPluck',t,semi(deg(dg)),.32*clamp((I-.3)*2.2,0,1)); }
    // horn call every other phrase when the fighting is fierce, or slowly in the menu
    if((I>.6||audio.inMenu)&&bar%4===0&&inBar===0){ let tt=t; for(const [dg,len] of HORN){ mNote('mHorn',tt,semi(deg(dg)),audio.inMenu?.22:.3); tt+=len*s8*2; } }
    MUS.step++; MUS.next+=s8;
  }
  if(audio.mus){ audio.mus.lp.frequency.setTargetAtTime(220+I*900,now,.8); }
}
function musicStinger(win){ if(!audio.ready) return; audio.duck=.25; applyVolumes(); sfx(win?'victory':'defeat'); setTimeout(()=>{ audio.duck=1; applyVolumes(); },4200); }

// per-frame: ambience level and music intensity from the state of the battle
function updateAudio(){
  if(!audio.ready) return;
  audio.frameN=0;
  let near=0, fighting=0;
  if(game.mode==='battle') for(const u of units){ if(!u.alive||!u.isUnit) continue; if(u.action&&!u.action.c.idle){ fighting++; if(Math.hypot(u.pos.x-cam.target.x,u.pos.z-cam.target.z)<10+cam.dist*.5) near++; } }
  const amb=audio.amb; if(amb){ const target=clamp(near/14,0,1)*.38*Math.pow(clamp(16/cam.dist,.3,1.2),.5)*(audio.inMenu?.5:1); amb.level+=(target-amb.level)*.05; amb.g.gain.setTargetAtTime(amb.level,audio.ctx.currentTime,.1); }
  let I=.22;
  if(audio.inMenu) I=.3;
  else if(game.mode==='battle'){ I=.28+clamp(fighting/26,0,1)*.5; if(game.stance[0]==='charge'||game.stance[1]==='charge') I+=.12;
    if(statues[0]&&statues[1]&&Math.min(statues[0].hp/statues[0].max,statues[1].hp/statues[1].max)<.35) I+=.15; if(game.over>0) I=.3; }
  else if(game.mode==='duel') I=.2;
  if(game.paused) I=.15;
  MUS.target=clamp(I,0,1);
}
