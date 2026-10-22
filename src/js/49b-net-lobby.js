/* ================= Online multiplayer, part 2: the menu and the room lobby =================
   Home: your name, 1v1 or 2v2, Quick match (joins the oldest open public room of that mode, or opens one and waits),
   Create private room (a 6-character code to share), Join room (by code), and Rejoin when a match of yours is still
   under way. Lobby: the code with a copy button, both teams' seats with names, ready marks and live connection dots,
   each team's faction, Ready / Switch team / Leave, and Start for the host once every seat is filled and ready.
   Every change is a database call; every other player sees it through the room's private channel. */
const ON={mode:(settings.netMode==='2v2'?'2v2':'1v1'),busy:false,active:null,nameT:null};
const onBody=()=>$('#onBody');
function onMsg(t,err){ const m=$('#onMsg'); if(!m) return; m.textContent=t||''; m.classList.toggle('err',!!err); }
function onlineConnUI(){
  const el=$('#onConn'); if(!el) return; let s='off', t='Offline';
  if(onlineProblem()){ s='err'; t='Unavailable'; }
  else if(ON.busy){ s='busy'; t='Working…'; }
  else if(NETC.user&&NETC.room){ s=NETC.chState==='ok'?'ok':'busy'; t=NETC.chState==='ok'?'Connected':'Connecting…'; }
  else if(NETC.user){ s='ok'; t='Signed in'; }
  el.dataset.s=s; el.textContent=t;
}
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cleanName=s=>(String(s||'').replace(/[^A-Za-z0-9 _.\-À-ɏ]/g,'').trim().slice(0,20))||'Player';
function myName(){ return cleanName(settings.netName||'Player'); }
async function onTry(fn,okMsg){
  if(ON.busy) return; ON.busy=true; onlineConnUI(); onMsg('');
  try{ const r=await fn(); if(okMsg) onMsg(okMsg); return r; }
  catch(e){ const er=netMapError(e); onMsg(er.message,true); netLog(er.code+': '+er.message); }
  finally{ ON.busy=false; onlineConnUI(); }
}

/* ---------- home ---------- */
function openOnline(msg,isErr){
  closeOverlays(); showPanel('menuOnline'); $('#onTitle').textContent='Online Multiplayer';
  if(NETC.room&&NETC.phase==='lobby'){ renderLobby(); return; }
  renderOnlineHome(); onMsg(msg||'',isErr);
  const p=onlineProblem(); if(p){ onMsg(p,true); onlineConnUI(); return; }
  onTry(async()=>{ await netSignIn(); ON.active=await netRpc('se3d_my_active_match'); renderOnlineHome(); }).then(()=>{ if(msg) onMsg(msg,isErr); });
}
function renderOnlineHome(){
  const off=!!onlineProblem(), A=ON.active;
  let rejoin='';
  if(A&&A.status&&['waiting','ready','starting','playing'].includes(A.status)){
    const me=NETC.user&&A.players.find(p=>p.user_id===NETC.user.id), host=me&&A.host===NETC.user.id;
    rejoin=A.status==='playing'||A.status==='starting'
      ?(host?'<p class="on-status">Your battle in room '+esc(A.code)+' can’t be resumed after the host page closed. <button class="mm small" id="onAbandon">End it</button></p>'
            :'<button class="mm primary" id="onRejoin"><span>Rejoin battle</span><small>Room '+esc(A.code)+' · '+esc(A.mode)+' · in progress</small></button>')
      :'<button class="mm primary" id="onRejoin"><span>Back to your room</span><small>Room '+esc(A.code)+' · '+esc(A.mode)+'</small></button>';
  }
  onBody().innerHTML=rejoin+
    '<label class="on-field">Your name<input id="onName" maxlength="20" autocomplete="nickname" value="'+esc(myName())+'"></label>'+
    '<div class="on-seg" role="radiogroup" aria-label="Mode"><button data-m="1v1" aria-pressed="'+(ON.mode==='1v1')+'">1v1</button><button data-m="2v2" aria-pressed="'+(ON.mode==='2v2')+'">2v2</button></div>'+
    '<button class="mm primary" id="onQuick"'+(off?' disabled':'')+'><span>Quick match</span><small>Play the next '+(ON.mode==='2v2'?'three players':'player')+' who search'+(ON.mode==='2v2'?'':'es')+' · '+ON.mode+'</small></button>'+
    '<button class="mm" id="onCreate"'+(off?' disabled':'')+'><span>Create private room</span><small>Get a code to share with '+(ON.mode==='2v2'?'three friends':'a friend')+'</small></button>'+
    '<div class="mm-row"><label class="on-field" style="flex:1 1 auto">Room code<input id="onCode" class="code" maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC234"></label></div>'+
    '<button class="mm" id="onJoin"'+(off?' disabled':'')+'><span>Join room</span><small>Enter the code your friend shared</small></button>'+
    '<button class="mm small" id="onBack">Back</button>';
  const B=onBody();
  B.querySelector('#onName').addEventListener('change',e=>{ settings.netName=cleanName(e.target.value); e.target.value=settings.netName; saveSettings(); });
  B.querySelectorAll('.on-seg button').forEach(b=>b.addEventListener('click',()=>{ sfx('ui'); ON.mode=b.dataset.m; settings.netMode=ON.mode; saveSettings(); renderOnlineHome(); }));
  const code=B.querySelector('#onCode');
  code.addEventListener('input',()=>{ const v=code.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6); if(v!==code.value) code.value=v; });
  code.addEventListener('keydown',e=>{ if(e.key==='Enter') onJoinPressed(); });
  B.querySelector('#onQuick').onclick=()=>{ sfx('ui'); onTry(async()=>{ await netSignIn(); const r=await netRpc('se3d_quick_match',{p_mode:ON.mode,p_name:myName(),p_config:{factions:[settings.side==='chaos'?'chaos':'order',settings.side==='chaos'?'order':'chaos']}}); await enterRoom(r); }); };
  B.querySelector('#onCreate').onclick=()=>{ sfx('ui'); onTry(async()=>{ await netSignIn(); const r=await netRpc('se3d_create_room',{p_mode:ON.mode,p_name:myName(),p_private:true,p_config:{factions:[settings.side==='chaos'?'chaos':'order',settings.side==='chaos'?'order':'chaos'],size:0}}); await enterRoom(r); }); };
  B.querySelector('#onJoin').onclick=()=>{ sfx('ui'); onJoinPressed(); };
  B.querySelector('#onBack').onclick=()=>{ sfx('ui'); showPanel('menuMain'); };
  const rj=B.querySelector('#onRejoin'); if(rj) rj.onclick=()=>{ sfx('ui'); onTry(async()=>{ const r=await netRpc('se3d_room_state',{p_match:A.id}); await enterRoom(r); }); };
  const ab=B.querySelector('#onAbandon'); if(ab) ab.onclick=()=>{ onTry(async()=>{ await netRpc('se3d_leave_room',{p_match:A.id}); ON.active=null; renderOnlineHome(); },'The old battle was ended with no result.'); };
  onlineConnUI();
}
function onJoinPressed(){
  const raw=($('#onCode')||{}).value||'', code=raw.toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(!/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/.test(code)){ onMsg(NET_MSG.invalid_code,true); return; }
  onTry(async()=>{ await netSignIn(); const r=await netRpc('se3d_join_room',{p_code:code,p_name:myName()}); await enterRoom(r); });
}

/* ---------- lobby ---------- */
// enter a room: register this browser's signing key on the seat, join the room's private channel, start heartbeats
async function enterRoom(r){
  if(!r||!r.id) throw netError('room_not_found');
  await netKeys();
  NETC.onRoom=onRoomChanged; NETC.onSubscribed=null; netSetRoom(r);
  const me=NETC.me; if(!me) throw netError('not_a_member');
  if(!me.key||me.key.x!==NETC.keys.jwk.x){
    if(r.status==='playing'&&r.host===NETC.user.id){ throw netError('host_key_fixed'); }
    netSetRoom(await netRpc('se3d_set_key',{p_match:r.id,p_jwk:NETC.keys.jwk})); }
  NETC.phase=NETC.room.status==='playing'||NETC.room.status==='starting'?'joining':'lobby';
  netJoinChannel(r.id);
  netHeartbeat(true,8000);
  ON.active=null;
  if(NETC.phase==='joining'){ NETC.onSubscribed=()=>{ NETC.onSubscribed=null; if(NETC.phase==='joining') netBeginBattle(); }; onMsg('Rejoining the battle…'); }
  else renderLobby();
}
function onRoomChanged(r,prev){
  if(!r) return;
  if(NETC.phase==='lobby'){
    if(r.status==='starting'||r.status==='playing'){ if(NETC.chState==='ok') netBeginBattle(); else NETC.onSubscribed=()=>{ NETC.onSubscribed=null; netBeginBattle(); }; return; }
    if(r.status==='cancelled'||r.status==='finished'||!NETC.me){ const why=!NETC.me?'You are no longer in that room.':'The room was closed.'; leaveLobbyLocal(); openOnline(why,true); return; }
    renderLobby();
    if(prev&&prev.host!==r.host&&r.host===NETC.user.id) onMsg('The host left. You are the host now.');
  } else if(NETC.phase==='battle'){
    if((r.status==='cancelled'||r.status==='finished')&&!NETG.over&&NET.guest&&r.result){
      netGuestOver({w:r.result.winner_team===null||r.result.winner_team===undefined?null:r.result.winner_team,r:r.result.result,stats:null}); }
  }
}
function leaveLobbyLocal(){ netHeartbeat(false); netLeaveChannel(); NETC.room=null; NETC.me=null; NETC.phase='off'; }
const facLabel=f=>f==='chaos'?'Chaos':'Order';
// the room's battle settings: the host picks the map and the finishers, everyone sees them
function cfgUI(r,host){ const c=r.config||{}, map=c.map==='river'?'river':'classic', fin=c.finishers===0||c.finishers===2?c.finishers:1, dis=host?'':' disabled';
  return '<div class="on-cfg"><div class="opt"><span>Map</span><div class="pills" role="radiogroup" aria-label="Map">'+
    [['classic','Classic field'],['river','Riverlands']].map(([v,t])=>'<button role="radio" data-map="'+v+'" aria-checked="'+(map===v)+'" aria-pressed="'+(map===v)+'"'+dis+'>'+t+'</button>').join('')+'</div></div>'+
    '<div class="opt"><span>Finishers</span><div class="pills" role="radiogroup" aria-label="Finishers">'+
    [[0,'Off'],[1,'Sometimes'],[2,'Always']].map(([v,t])=>'<button role="radio" data-fin="'+v+'" aria-checked="'+(fin===v)+'" aria-pressed="'+(fin===v)+'"'+dis+'>'+t+'</button>').join('')+'</div></div>'+
    '<small class="opt-note">'+(host?'You are the host: changing these asks everyone to ready up again.':'The host picks the map and the finishers.')+(map==='river'?' Riverlands: a 320 m valley with four capture zones, bridges and fog of war.':'')+'</small></div>'; }
function renderLobby(){
  const r=NETC.room; if(!r||NETC.phase!=='lobby') return;
  const fe=typeof document!=='undefined'&&document.activeElement; if(fe&&fe.id==='onLName'){ clearTimeout(ON.rt); ON.rt=setTimeout(renderLobby,1500); return; }   // don't redraw under someone typing
  $('#onTitle').textContent=r.mode+' room';
  const me=NETC.me, host=r.host===NETC.user.id, seats=r.max_players, ps=r.players.filter(p=>!p.left);
  const fac=(r.config&&r.config.factions)||['order','chaos'];
  const n=ps.length, readyN=ps.filter(p=>p.ready).length, need=seats-n;
  let status;
  if(r.status==='ready') status=host?'Everyone is ready. Start the match when you are.':'Everyone is ready. Waiting for the host to start…';
  else if(need>0) status=(r.is_private?'Waiting for ':'Searching for ')+need+' more player'+(need>1?'s':'')+'…'+(r.is_private?' Share the code.':' (quick match)');
  else status=readyN+' of '+seats+' ready.';
  const team=t=>{ const mine=me&&me.team===t, F=fac[t];
    let h='<div class="on-team t'+t+(mine?' mine':'')+'"><h3>'+esc(FACTIONS[F].team[t])+'</h3><div class="on-fac" role="radiogroup" aria-label="Team '+(t+1)+' faction">';
    for(const f of ['order','chaos']) h+='<button data-f="'+f+'" data-t="'+t+'" aria-pressed="'+(F===f)+'"'+(mine?'':' disabled')+'>'+facLabel(f)+'</button>';
    h+='</div>';
    for(let s=t;s<seats;s+=2){ const p=ps.find(x=>x.slot===s);
      if(!p){ h+='<div class="on-p empty"><i class="dot"></i><span class="nm">Open seat</span><span class="st"></span></div>'; continue; }
      const on=p.user_id===NETC.user.id||netOnline(p.user_id);
      h+='<div class="on-p"><i class="dot'+(on?' on':'')+'" title="'+(on?'connected':'not connected')+'"></i><span class="nm">'+esc(p.name)+(p.user_id===r.host?' ♛':'')+(p.user_id===NETC.user.id?' (you)':'')+'</span><span class="st'+(p.ready?' ready':'')+'">'+(p.ready?'Ready':'Not ready')+'</span></div>'; }
    return h+'</div>'; };
  onBody().innerHTML=
    '<div class="on-code"><div><small>Room code · '+esc(r.mode)+' · '+(r.is_private?'private':'quick match')+'</small><b id="onRoomCode">'+esc(r.code)+'</b></div><button id="onCopy">Copy code</button></div>'+
    '<p class="on-status" id="onStatus">'+esc(status)+'</p>'+
    '<div class="on-teams">'+team(0)+team(1)+'</div>'+cfgUI(r,host)+
    '<label class="on-field">Your name<input id="onLName" maxlength="20" value="'+esc(me?me.name:myName())+'"></label>'+
    '<div class="mm-row"><button class="mm small" id="onReady">'+(me&&me.ready?'Not ready':'Ready')+'</button><button class="mm small" id="onSwitch">Switch team</button></div>'+
    (host?'<button class="mm primary" id="onStart"'+(r.status==='ready'?'':' disabled')+'><span>Start match</span><small>'+(r.status==='ready'?'Everyone is ready':'Every seat must be filled and ready')+'</small></button>':'')+
    '<button class="mm small" id="onLeave">Leave room</button>';
  const B=onBody(), id=r.id;
  B.querySelector('#onCopy').onclick=()=>copyCode(r.code);
  B.querySelector('#onReady').onclick=()=>{ sfx('ui'); onTry(async()=>netSetRoom(await netRpc('se3d_set_ready',{p_match:id,p_ready:!(NETC.me&&NETC.me.ready)}))); };
  B.querySelector('#onSwitch').onclick=()=>{ sfx('ui'); onTry(async()=>netSetRoom(await netRpc('se3d_switch_team',{p_match:id}))); };
  B.querySelector('#onLeave').onclick=()=>{ sfx('ui'); onTry(async()=>{ await netRpc('se3d_leave_room',{p_match:id}); leaveLobbyLocal(); renderOnlineHome(); $('#onTitle').textContent='Online Multiplayer'; },'You left the room.'); };
  B.querySelectorAll('.on-fac button').forEach(b=>b.onclick=()=>{ if(b.disabled) return; sfx('ui'); onTry(async()=>netSetRoom(await netRpc('se3d_set_faction',{p_match:id,p_faction:b.dataset.f}))); });
  const ln=B.querySelector('#onLName'); ln.addEventListener('change',()=>{ const v=cleanName(ln.value); settings.netName=v; saveSettings(); onTry(async()=>netSetRoom(await netRpc('se3d_set_name',{p_match:id,p_name:v}))); });
  B.querySelectorAll('.on-cfg button').forEach(b=>b.onclick=()=>{ if(b.disabled) return; sfx('ui'); const c=r.config||{}, map=b.dataset.map||c.map||'classic', fin=b.dataset.fin!==undefined?+b.dataset.fin:(c.finishers===undefined?1:c.finishers);
    onTry(async()=>netSetRoom(await netRpc('se3d_set_config',{p_match:id,p_map:map,p_finishers:fin}))); });
  const st=B.querySelector('#onStart'); if(st) st.onclick=()=>{ if(st.disabled) return; st.disabled=true; sfx('horn'); onTry(async()=>netSetRoom(await netRpc('se3d_start_match',{p_match:id}))); };
  onlineConnUI();
}
function copyCode(code){
  const done=()=>{ const b=$('#onCopy'); if(b){ b.textContent='Copied'; setTimeout(()=>{ if($('#onCopy')) $('#onCopy').textContent='Copy code'; },1600); } };
  const fallback=()=>{ try{ const t=document.createElement('textarea'); t.value=code; t.setAttribute('readonly',''); t.style.position='fixed'; t.style.opacity='0'; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); done(); }catch(e){ onMsg('Copy failed: the code is '+code,true); } };
  if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done,fallback); else fallback();
}
$('#netWaitLeave').onclick=()=>{ sfx('ui'); netLeaveMatch(true); };
