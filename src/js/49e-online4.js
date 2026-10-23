/* ================= Online, release 4: ranked play, the seasonal leaderboard, banner rewards, watching live =================
   These need the server update in supabase/migrations/20261024000000_se3d_ranked_spectate_wildlands.sql. The online
   screen asks the server once whether it has it (se3d_leaderboard); until then the buttons stay hidden and a note
   says so, and online play works as before.
   Ranked: "Ranked quick match" pairs you with someone who also searched ranked on the same map; a decisive result
   moves both ratings (Elo). Seasons are quarters. Your best rating this season unlocks banner colours for your
   regiments (shown on your screen): Bronze for a ranked game, Silver at 1100, Gold at 1250, Diamond at 1400.
   Watching: the list of public matches being played; Watch joins the host's channel read-only and shows the whole
   field without fog. */
const R4={ok:null,lb:null,live:null,checking:false};
const BANNERS=[{id:'',name:'Army colours',need:-1},{id:'bronze',name:'Bronze',need:0,col:'#b07a3a',ink:'#3a2410'},{id:'silver',name:'Silver',need:1100,col:'#c8ccd4',ink:'#2a2e36'},
  {id:'gold',name:'Gold',need:1250,col:'#f2c94a',ink:'#5a3a08'},{id:'diamond',name:'Diamond',need:1400,col:'#8ad8ff',ink:'#0a3a5a'}];
const bannerOK=(B,me)=>B.need<0||!!me&&(me.wins+me.losses>0)&&me.peak>=B.need;
function r4Check(){
  if(R4.checking||R4.ok!==null||!NETC.user) return Promise.resolve(R4.ok);
  R4.checking=true;
  return netRpc('se3d_leaderboard',{p_limit:20}).then(lb=>{ R4.ok=true; R4.lb=lb; },()=>{ R4.ok=false; }).then(()=>{ R4.checking=false; if(typeof renderOnlineHome==='function'&&NETC.phase!=='lobby'&&NETC.phase!=='battle') renderOnlineHome(); return R4.ok; });
}
function r4LoadLive(){ if(!R4.ok) return Promise.resolve(); return netRpc('se3d_live_matches',{}).then(L=>{ R4.live=L||[]; r4Render(); },()=>{}); }
// the online home's ranked / leaderboard / live section
function r4HomeHTML(off){
  if(R4.ok===false) return '<small class="opt-note r4-note">Ranked play, the leaderboard, the Wildlands online and watching live matches open as soon as the server update is installed.</small>';
  if(!R4.ok) return '';
  const me=R4.lb&&R4.lb.me;
  return '<div class="r4" id="r4Box"><button class="mm" id="onRanked"'+(off?' disabled':'')+'><span>Ranked quick match · '+(ON.map==='river'?'Riverlands':'Classic')+'</span><small>'+(me?'Your rating '+me.rating+' · '+me.wins+'–'+me.losses+' this season':'Season '+(R4.lb?R4.lb.current:1)+' · everyone starts at 1000')+'</small></button>'+
    '<div class="mm-row"><button class="mm small" id="onBoard">Leaderboard</button><button class="mm small" id="onWatch">Watch live'+(ON.live&&ON.live.live?' ('+ON.live.live+')':'')+'</button></div><div id="r4Panel"></div></div>';
}
function r4Bind(B){
  const rk=B.querySelector('#onRanked'); if(rk) rk.onclick=()=>{ sfx('ui'); onTry(async()=>{ await netSignIn(); const r=await netRpc('se3d_quick_match',{p_mode:ON.mode,p_name:myName(),p_config:Object.assign(netCfg(),{ranked:true})}); await enterRoom(r); livePing(); }); };
  const bd=B.querySelector('#onBoard'); if(bd) bd.onclick=()=>{ sfx('ui'); R4.view='board'; onTry(async()=>{ R4.lb=await netRpc('se3d_leaderboard',{p_limit:50}); r4Render(); }); };
  const wt=B.querySelector('#onWatch'); if(wt) wt.onclick=()=>{ sfx('ui'); R4.view='live'; onTry(r4LoadLive); };
  r4Render();
}
function r4Render(){
  const P=$('#r4Panel'); if(!P) return; let h='';
  if(R4.view==='board'&&R4.lb){ const L=R4.lb, me=L.me;
    h='<div class="r4-board"><h4>Season '+L.season+' · '+L.players+' ranked player'+(L.players===1?'':'s')+'</h4>'+
      (L.top.length?'<ol>'+L.top.map(p=>'<li class="'+(p.me?'me':'')+'"><b>'+p.rank+'</b><span>'+esc(p.name)+'</span><em>'+p.rating+'</em><small>'+p.wins+'–'+p.losses+'</small></li>').join('')+'</ol>':'<p class="opt-note">No ranked games yet this season. Be the first.</p>')+
      (me?'<p class="r4-me">You: #'+me.rank+' · '+me.rating+' (best '+me.peak+')</p>':'')+
      '<div class="r4-ban"><span>Banner colour</span><div class="pills">'+BANNERS.map(B=>{ const ok=bannerOK(B,me); return '<button data-b="'+B.id+'" aria-pressed="'+((settings.banner||'')===B.id)+'"'+(ok?'':' disabled title="Reach '+B.need+' this season"')+'>'+(B.col?'<i style="background:'+B.col+'"></i>':'')+B.name+(ok?'':' · '+B.need)+'</button>'; }).join('')+'</div></div></div>'; }
  else if(R4.view==='live'){ const L=R4.live||[];
    h='<div class="r4-live"><h4>Live matches</h4>'+(L.length?L.map(m=>'<div class="r4-m"><span><b>'+esc(m.mode)+' · '+(m.map==='river'?'Riverlands':'Classic')+(m.ranked?' · ranked':'')+'</b><small>'+(m.players||[]).map(p=>esc(p.name)).join(' vs ')+' · '+(m.watching||0)+' watching</small></span><button data-w="'+esc(m.id)+'">Watch</button></div>').join(''):'<p class="opt-note">No public matches are being played right now.</p>')+
      '<div class="mm-row"><label class="on-field" style="flex:1 1 auto">Or watch by room code<input id="r4Code" class="code" maxlength="8" autocomplete="off" placeholder="ABC234"></label><button class="mm small" id="r4CodeGo">Watch</button></div></div>'; }
  P.innerHTML=h;
  for(const b of qsa(P,'.r4-ban button')) b.onclick=()=>{ if(b.disabled) return; sfx('ui'); settings.banner=b.dataset.b; saveSettings(); r4Render(); };
  for(const b of qsa(P,'button[data-w]')) b.onclick=()=>{ sfx('ui'); onTry(()=>netSpectate(b.dataset.w,null)); };
  const cg=P.querySelector&&P.querySelector('#r4CodeGo'); if(cg) cg.onclick=()=>{ const v=(($('#r4Code')||{}).value||'').toUpperCase().replace(/[^A-Z0-9]/g,''); if(v.length!==6){ onMsg(NET_MSG.invalid_code,true); return; } sfx('ui'); onTry(()=>netSpectate(null,v)); };
}
// your banner colour (a seasonal reward) on your own regiments' flags
function bannerColours(r){ if(!r||r.team!==myTeam()||!settings.banner) return null; const B=BANNERS.find(b=>b.id===settings.banner); return B&&B.col?B:null; }

/* ---------- watching a live match ---------- */
async function netSpectate(id,code){
  await netSignIn();
  const r=await netRpc('se3d_spectate',id?{p_match:id}:{p_code:code});
  NETC.onRoom=(rr)=>{ if(rr&&(rr.status==='finished'||rr.status==='cancelled')&&NETC.phase==='battle'&&!NETG.over&&rr.result) netGuestOver({w:rr.result.winner_team==null?null:rr.result.winner_team,r:rr.result.result,stats:null}); };
  netSetRoom(r); NET.spectator=true; NETC.phase='joining';
  NETC.onSubscribed=()=>{ NETC.onSubscribed=null; spectBegin(); };
  netJoinChannel(r.id);
  onMsg('Joining the match as a spectator…');
}
function spectBegin(){
  const room=NETC.room; if(!room) return; const cfg=room.config||{factions:['order','chaos'],size:0};
  netResetState(); NET.on=true; NET.host=false; NET.guest=true; NET.team=0; NET.after=false; NET.spectator=true;
  NETC.phase='battle'; NETG.t0=performance.now(); game.replay=true;
  netBattleScene(cfg,false); NETG.started=true;
  $('#netbar').hidden=false; setBodyClass('replaying',true);
  netWaitUI(true,'Joining the battle…','The battle appears with the host’s next update.');
  showBanner('Watching',(room.players||[]).filter(p=>!p.left).map(p=>p.name).join(' vs '),2.4);
}
async function spectLeave(toMenu){
  const room=NETC.room; NET.spectator=false; game.replay=false; setBodyClass('replaying',false);
  if(room) netRpc('se3d_stop_spectating',{p_match:room.id}).catch(()=>{});
  netShutdown(); if(toMenu!==false) openMenu();
}
