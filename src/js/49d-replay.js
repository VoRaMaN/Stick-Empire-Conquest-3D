/* ================= Replays: record a battle, watch it again =================
   Recording uses the online host's own machinery: while an offline battle runs, the game captures the same
   snapshots and events a host broadcasts (positions, health, flags, regiments, castles, every animation, finisher,
   death and research), five a second. Watching plays them back through the guest's side of the netcode, so the
   battle unfolds exactly as the guests of an online match see it: every soldier, blow and death, with no fog, at
   1×, 2× or 4×, from any camera. The last battle's recording is kept in memory (up to 20 minutes). */
const RPL={rec:null,last:null,play:null};
const replayRecOK=()=>game.mode==='battle'&&!NET.on&&!game.demo&&!game.tutorial&&!game.classicMix&&!RPL.play;
function replayStart(){
  RPL.rec=null; NET.rec=false; NETG.cap=false; if(!replayRecOK()) return;
  NETG.t0=performance.now(); NETG.ev.length=0; NETG.tickN=0; NETG.over=null; NETG.cap=true; NET.rec=true;
  RPL.rec={cfg:{factions:game.fac.slice(),map:MAP.id==='classic'?'classic':'river',size:game.size,finishers:game.finMode},snaps:[],acc:0,me:myTeam(),
    title:(game.mission?game.mission.D.name:game.campFight?campName(game.campFight.id):teamName(0)+' against '+teamName(1)),at:Date.now()};
}
function replayFrame(rdt){
  const R=RPL.rec; if(!R||NET.on||RPL.play) return;
  if(game.paused||game.mode!=='battle'){ NETG.t0+=rdt*1000; return; }   // a paused battle doesn't leave a gap in the recording
  R.acc+=rdt; if(R.acc<.2) return; R.acc=0;
  if(R.snaps.length>=6000){ replayStop(); return; }   // 20 minutes
  R.snaps.push(netSnapshot());
}
// the battle ended: one last snapshot carries the result, and the recording is kept for "Watch replay"
function replayStop(){
  const R=RPL.rec; if(!R) return; RPL.rec=null;
  if(game.over>0||game.winner!==undefined){ const s=netSnapshot(); s.ov={w:game.winner===undefined?null:game.winner,r:'statue_destroyed',stats:netStatsSummary()}; R.snaps.push(s); }
  NET.rec=false; NETG.cap=false; NETG.ev.length=0;
  if(R.snaps.length>=5) RPL.last=R;
}
const replayHave=()=>!!(RPL.last&&RPL.last.snaps.length>=5);

/* ---------- watching ---------- */
function replayPlay(){
  const R=RPL.last; if(!replayHave()) return;
  replayStop(); netResetState();
  NET.on=false; NET.host=false; NET.guest=true; NET.rec=false; NETG.cap=false; game.replay=true;
  netBattleScene(R.cfg,false);
  HEROS.u=[null,null]; HEROS.cd=[{},{}];
  const now=performance.now();
  RPL.play={R,i:0,t0:R.snaps[0].t,base:now+300,speed:1,paused:false,save:tune.speed,end:R.snaps[R.snaps.length-1].t,done:false};
  NETG.lastN=-1; setBodyClass('replaying',true); replayUI(); sfx('ui');
  showBanner('Replay',R.title,2);
}
const rplNow=P=>P.paused?P.pauseAt:performance.now();
function replayTick(rdt){
  const P=RPL.play; if(!P) return;
  const R=P.R, now=rplNow(P);
  if(!P.paused){
    // feed every snapshot whose (rebased) time comes up in the next 0.25 s
    while(P.i<R.snaps.length){ const s=R.snaps[P.i], t=P.base+(s.t-P.t0)/P.speed; if(t>now+250) break;
      netGuestReceive(Object.assign({},s,{t:Math.round(t),n:P.i+1,e:(s.e||[]).map(x=>[x[0],x[1]/P.speed].concat(x.slice(2))),a:[]}),0); P.i++; }
    netGuestFrame();
    if(!P.done&&P.i>=R.snaps.length&&now>P.base+(P.end-P.t0)/P.speed+1500){ P.done=true; replayUI(); } }
  P.uiT=(P.uiT||0)-rdt; if(P.uiT<=0){ P.uiT=.25; replayUI(); }
}
function replaySpeed(k){ const P=RPL.play; if(!P) return; const now=rplNow(P), cur=P.t0+(now-P.base)*P.speed; P.speed=k; P.base=now-(cur-P.t0)/k; tune.speed=P.save*k; replayUI(); }
function replayPause(on){ const P=RPL.play; if(!P||P.paused===on) return; const now=performance.now();
  if(on){ P.pauseAt=now; game.paused=true; } else { P.base+=now-P.pauseAt; P.paused=false; game.paused=false; } P.paused=on; replayUI(); }
function replayRestart(){ if(!RPL.play) return; const R=RPL.play.R, sp=RPL.play.speed; replayExit(true); RPL.last=R; replayPlay(); if(sp!==1) replaySpeed(sp); }
function replayExit(quiet){
  const P=RPL.play; if(!P) return; RPL.play=null;
  tune.speed=P.save; game.paused=false; NET.guest=false; game.replay=false; netResetState(); setBodyClass('replaying',false);
  const bar=$('#rplBar'); if(bar) bar.hidden=true;
  if(!quiet) openMenu();
}
function replayUI(){
  const bar=$('#rplBar'); if(!bar) return; const P=RPL.play; bar.hidden=!P; if(!P) return;
  const R=P.R, now=rplNow(P), cur=clamp((P.t0+(now-P.base)*P.speed-P.t0)/1000,0,(P.end-P.t0)/1000), tot=(P.end-P.t0)/1000;
  if(!bar._built){ bar._built=1;
    bar.innerHTML='<b>Replay</b><span id="rplT"></span><i class="rplbar"><i id="rplP"></i></i><button id="rplPause">Pause</button>'+[1,2,4].map(k=>'<button class="rpls" data-k="'+k+'">'+k+'×</button>').join('')+'<button id="rplRe">Restart</button><button id="rplX">Exit</button>';
    $('#rplPause').onclick=()=>{ sfx('ui'); replayPause(!RPL.play.paused); };
    for(const b of qsa(bar,'.rpls')) b.onclick=()=>{ sfx('ui'); replaySpeed(+b.dataset.k); };
    $('#rplRe').onclick=()=>{ sfx('ui'); replayRestart(); }; $('#rplX').onclick=()=>{ sfx('ui'); replayExit(); }; }
  $('#rplT').textContent=(P.done?'Finished · ':'')+R.title+' · '+fmtTime(cur)+' / '+fmtTime(tot);
  $('#rplP').style.width=(100*clamp(cur/Math.max(1,tot),0,1)).toFixed(1)+'%';
  $('#rplPause').textContent=P.paused?'Play':'Pause';
  for(const b of qsa(bar,'.rpls')) b.setAttribute('aria-pressed',String(+b.dataset.k===P.speed));
}
