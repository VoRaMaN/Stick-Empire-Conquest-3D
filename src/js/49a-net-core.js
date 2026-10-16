/* ================= Online multiplayer, part 1: Supabase client, identity, room API, signed Realtime channel =================
   Supabase Auth gives every player an identity (anonymous sign-in, one per browser tab), PostgreSQL holds the rooms
   (se3d_* tables, changed only through se3d_* RPC functions that check the caller), and one private Realtime channel per
   match (se3d:match:<match uuid>) carries the battle. Only current members of a match may join its channel (Realtime
   Authorization policies). On top of that every message on the channel is signed with the sender's own ECDSA P-256 key,
   whose public half is registered on the sender's seat in the database: a message counts only when its signature
   checks out against the seat of the member it claims to come from, so nobody can speak for another player. */
const NETC={cfg:(typeof window!=='undefined'&&window.SE3D_ONLINE)||null,sb:null,user:null,keys:null,room:null,ch:null,chState:'off',chTry:0,chTimer:null,
  presence:{},seq:0,sendQ:Promise.resolve(),recvQ:Promise.resolve(),refreshAt:0,refreshing:null,hbTimer:null,phase:'off',onRoom:null,badSig:0,lastErr:''};
const NET_HZ=10;                // authoritative snapshots per second (8 in 2v2, where every message fans out to three guests)

function onlineProblem(){
  if(!NETC.cfg||!NETC.cfg.url||!NETC.cfg.key) return 'This copy of the game was built without an online configuration (SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY), so online play is off. Everything else works.';
  if(typeof window==='undefined'||!window.SE3DSupabase) return 'The online library did not load, so online play is unavailable right now.';
  if(!(window.crypto&&crypto.subtle)) return 'Online play needs a secure (https) page.';
  return null;
}
// one identity per browser tab (sessionStorage): two tabs are two players, and a reload keeps the same player
function tabStorage(){
  const mem={};
  const ok=(()=>{ try{ const k='__se3d'; sessionStorage.setItem(k,'1'); sessionStorage.removeItem(k); return true; }catch(e){ return false; } })();
  return { getItem:k=>{ try{ return ok?sessionStorage.getItem(k):(mem[k]===undefined?null:mem[k]); }catch(e){ return mem[k]===undefined?null:mem[k]; } },
    setItem:(k,v)=>{ try{ if(ok) sessionStorage.setItem(k,v); else mem[k]=v; }catch(e){ mem[k]=v; } },
    removeItem:k=>{ try{ if(ok) sessionStorage.removeItem(k); }catch(e){} delete mem[k]; } };
}
function netClient(){
  if(NETC.sb) return NETC.sb;
  const p=onlineProblem(); if(p) throw netError('unavailable',p);
  NETC.sb=window.SE3DSupabase.createClient(NETC.cfg.url,NETC.cfg.key,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storage:tabStorage(),storageKey:'se3d-online-auth'},
    realtime:{params:{eventsPerSecond:40}}});
  NETC.sb.auth.onAuthStateChange((ev,session)=>{
    if(session&&session.access_token) NETC.sb.realtime.setAuth(session.access_token);   // a refreshed token keeps the channel authorised
    if(ev==='SIGNED_OUT'){ NETC.user=null; }
  });
  return NETC.sb;
}

/* ---------- errors players can act on ---------- */
const NET_MSG={
  unavailable:'Online play is unavailable.',
  network:'Can’t reach the online service. Check your connection and try again.',
  anon_disabled:'This game’s Supabase project has anonymous sign-ins turned off. The owner can enable them in the Supabase dashboard: Authentication → Sign In / Providers → “Allow anonymous sign-ins”.',
  auth:'Signing in to the online service failed. Try again in a moment.',
  not_signed_in:'Your online session ended. Try again to sign in afresh.',
  invalid_code:'Room codes are 6 letters and digits (no 0, O, 1, I or L).',
  room_not_found:'There is no room with that code.',
  room_full:'That room is full.',
  match_started:'That match has already started.',
  room_expired:'That room has closed or expired.',
  already_in_match:'You are already playing in a match that has started.',
  not_a_member:'You are not in that room any more.',
  not_host:'Only the host can do that.',
  not_ready:'Every seat must be filled and every player ready first.',
  team_full:'The other team is full.',
  key_missing:'Still setting up a secure connection. Try again.',
  bad_key:'Couldn’t register this browser’s signing key.',
  host_alive:'The host is still connected.',
  host_key_fixed:'The host can’t rejoin a battle in progress.',
  bad_config:'That isn’t a valid faction.',
  rate_limit:'Too many sign-ins from this network right now. Wait a minute and try again.',
};
function netError(code,msg){ const e=new Error(msg||NET_MSG[code]||code); e.code=code; return e; }
function netMapError(e){
  if(!e) return netError('network');
  if(e.code&&NET_MSG[e.code]&&!e.details) return e;
  const m=String(e.message||e.error_description||e), k=(m.match(/se3d:([a-z_]+)/)||[])[1];
  if(k==='wrong_state') return netError('wrong_state','The room changed meanwhile (it is now '+(m.split(':')[2]||'').trim()+').');
  if(k) return netError(k);
  if(e.code==='anonymous_provider_disabled'||/anonymous sign-?ins are disabled/i.test(m)) return netError('anon_disabled');
  if(e.status===429||/rate limit/i.test(m)) return netError('rate_limit');
  if(/failed to fetch|network|load failed|fetch failed|timeout|ECONN|offline/i.test(m)) return netError('network');
  if(e.code==='42501'||/permission denied/i.test(m)) return netError('not_signed_in');
  if(/jwt|token|401/i.test(m)) return netError('not_signed_in');
  return netError('server','The online service answered: '+m);
}

/* ---------- identity: anonymous sign-in, refreshed as needed ---------- */
async function netSignIn(){
  const sb=netClient();
  let session=null;
  try{ session=(await sb.auth.getSession()).data.session; }catch(e){ session=null; }
  if(session&&session.expires_at&&session.expires_at*1000<Date.now()+60000){
    const r=await sb.auth.refreshSession(); session=r.error?null:r.data.session; }
  if(!session){
    const r=await sb.auth.signInAnonymously();
    if(r.error) throw netMapError(r.error);
    session=r.data.session;
  }
  if(!session) throw netError('auth');
  NETC.user=session.user; sb.realtime.setAuth(session.access_token);
  return session.user;
}
async function netRpc(fn,args){
  const sb=netClient(); if(!NETC.user) await netSignIn();
  let r;
  try{ r=await sb.rpc(fn,args||{}); }catch(e){ throw netMapError(e); }
  if(r.error&&/jwt|token|expired/i.test(r.error.message||'')){   // an expired session: refresh once and retry
    await sb.auth.refreshSession(); try{ r=await sb.rpc(fn,args||{}); }catch(e){ throw netMapError(e); } }
  if(r.error) throw netMapError(r.error);
  return r.data;
}

/* ---------- message signing (ECDSA P-256; the private key never leaves this page) ---------- */
const _te=typeof TextEncoder!=='undefined'?new TextEncoder():null;
const b64=buf=>{ const a=new Uint8Array(buf); let s=''; for(let i=0;i<a.length;i++) s+=String.fromCharCode(a[i]); return btoa(s); };
const unb64=s=>{ const bin=atob(s), a=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) a[i]=bin.charCodeAt(i); return a; };
async function netKeys(){
  if(NETC.keys) return NETC.keys;
  const k=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},false,['sign','verify']);
  const j=await crypto.subtle.exportKey('jwk',k.publicKey);
  return NETC.keys={priv:k.privateKey,jwk:{kty:'EC',crv:'P-256',x:j.x,y:j.y}};
}
const NETK=new Map();   // user id -> imported public key of their seat
async function netPubKey(uid){
  const p=NETC.room&&NETC.room.players.find(x=>x.user_id===uid&&!x.left); if(!p||!p.key) return null;
  const id=p.key.x+'.'+p.key.y; let e=NETK.get(uid);
  if(!e||e.id!==id){ e={id,key:await crypto.subtle.importKey('jwk',{kty:'EC',crv:'P-256',x:p.key.x,y:p.key.y,ext:true},{name:'ECDSA',namedCurve:'P-256'},false,['verify'])}; NETK.set(uid,e); }
  return e.key;
}
async function netVerify(uid,str,sig){
  const k=await netPubKey(uid); if(!k||typeof sig!=='string') return false;
  try{ return await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},k,unb64(sig),_te.encode(str)); }catch(e){ return false; }
}

/* ---------- the room ---------- */
function netSetRoom(r){
  const prev=NETC.room; NETC.room=r||null;
  if(r&&NETC.user){ const me=r.players.find(p=>p.user_id===NETC.user.id&&!p.left); NETC.me=me||null; }
  if(NETC.onRoom) NETC.onRoom(r,prev);
}
// re-read the room (after a database ping, a heartbeat that saw a change, or an unknown signature); at most every 0.7 s
function netRefreshRoom(){
  if(!NETC.room) return Promise.resolve(null);
  if(NETC.refreshing) return NETC.refreshing;
  const wait=Math.max(0,NETC.refreshAt+700-Date.now());
  NETC.refreshing=new Promise(res=>setTimeout(res,wait)).then(()=>netRpc('se3d_room_state',{p_match:NETC.room.id}))
    .then(r=>{ NETC.refreshAt=Date.now(); NETC.refreshing=null; if(NETC.room&&r&&r.id===NETC.room.id) netSetRoom(r); return r; })
    .catch(e=>{ NETC.refreshAt=Date.now(); NETC.refreshing=null; netLog('room refresh failed: '+e.message); return null; });
  return NETC.refreshing;
}
function netHeartbeat(on,period){
  clearInterval(NETC.hbTimer); NETC.hbTimer=null; if(!on) return;
  const beat=()=>{ const r=NETC.room; if(!r) return;
    netRpc('se3d_heartbeat',{p_match:r.id}).then(h=>{ NETC.hbOk=Date.now(); if(NETC.room&&(h.status!==NETC.room.status||h.host!==NETC.room.host)) netRefreshRoom(); })
      .catch(e=>{ NETC.hbFail=Date.now(); netLog('heartbeat: '+e.message); if(e.code==='not_a_member'&&NETC.room) netRefreshRoom(); }); };
  beat(); NETC.hbTimer=setInterval(beat,period||8000);
}

/* ---------- the match channel ---------- */
function netJoinChannel(matchId){
  netLeaveChannel(true);
  const sb=netClient(), topic='se3d:match:'+matchId;
  const ch=sb.channel(topic,{config:{private:true,broadcast:{self:false,ack:false},presence:{key:NETC.user.id}}});
  ch.on('broadcast',{event:'room'},()=>netRefreshRoom());
  ch.on('broadcast',{event:'m'},msg=>netReceive(msg.payload));
  ch.on('presence',{event:'sync'},()=>{ NETC.presence=ch.presenceState(); netPresenceChanged(); });
  NETC.ch=ch; NETC.chTopic=topic; NETC.chState='joining'; netConnUI();
  ch.subscribe((st,err)=>{
    if(NETC.ch!==ch) return;
    NETC.chState=st==='SUBSCRIBED'?'ok':st==='CLOSED'?'closed':'error'; if(err) netLog('channel: '+(err.message||err));
    if(st==='SUBSCRIBED'){ NETC.chTry=0; ch.track({uid:NETC.user.id,at:Date.now()}).catch(()=>{}); netRefreshRoom(); if(NETC.onSubscribed) NETC.onSubscribed(); }
    else if((st==='CHANNEL_ERROR'||st==='TIMED_OUT')&&NETC.room&&NETC.room.id===matchId){
      // refused or lost: refresh the session token and join again with growing gaps (the first join of a fresh project can fail once)
      clearTimeout(NETC.chTimer); const wait=Math.min(10000,800*Math.pow(1.7,NETC.chTry++));
      NETC.chTimer=setTimeout(async()=>{ if(NETC.ch!==ch||!NETC.room) return; try{ await netSignIn(); }catch(e){} netJoinChannel(matchId); },wait); }
    netConnUI();
  });
}
function netLeaveChannel(keepTimer){
  if(!keepTimer){ clearTimeout(NETC.chTimer); NETC.chTimer=null; }
  const ch=NETC.ch; NETC.ch=null; NETC.chState='off'; NETC.presence={};
  if(ch){ try{ ch.untrack().catch(()=>{}); }catch(e){} try{ NETC.sb.removeChannel(ch); }catch(e){} }
}
const netOnline=uid=>!!(NETC.presence&&NETC.presence[uid]&&NETC.presence[uid].length);
// send a signed message on the channel, in order
function netSend(kind,body){
  if(!NETC.ch||!NETC.room||!NETC.keys) return Promise.resolve(false);
  const room=NETC.room, ch=NETC.ch;
  NETC.sendQ=NETC.sendQ.then(async()=>{
    const msg=Object.assign({k:kind,mid:room.id,sq:++NETC.seq,ts:Date.now()},body), d=JSON.stringify(msg);
    const sig=b64(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},NETC.keys.priv,_te.encode(d)));
    if(NETC.ch!==ch) return false;
    NETC.sent=(NETC.sent||0)+1; NETC.sentBytes=(NETC.sentBytes||0)+d.length;
    const r=await ch.send({type:'broadcast',event:'m',payload:{u:NETC.user.id,d,s:sig}});
    return r==='ok';
  }).catch(e=>{ netLog('send failed: '+e.message); return false; });
  return NETC.sendQ;
}
// verify, in arrival order, then hand the message on. A sender must be a current member whose registered key signed it.
function netReceive(p){
  NETC.recvQ=NETC.recvQ.then(async()=>{
    if(!p||typeof p.d!=='string'||typeof p.u!=='string'||typeof p.s!=='string'||p.d.length>240000||!NETC.room) return;
    let ok=await netVerify(p.u,p.d,p.s);
    if(!ok&&Date.now()-(NETC.keyRefresh||0)>3000){ NETC.keyRefresh=Date.now(); await netRefreshRoom(); ok=await netVerify(p.u,p.d,p.s); }   // a player who rejoined has a new key
    if(!ok){ NETC.badSig++; return; }
    let m; try{ m=JSON.parse(p.d); }catch(e){ return; }
    if(!m||m.mid!==NETC.room.id||typeof m.k!=='string') return;
    NETC.recv=(NETC.recv||0)+1; NETC.recvBytes=(NETC.recvBytes||0)+p.d.length;
    netDispatch(p.u,m,p.d.length);
  }).catch(e=>netLog('receive: '+e.message));
}
function netLog(s){ NETC.lastErr=s; if(typeof console!=='undefined'&&console.warn) console.warn('[se3d online] '+s); }
