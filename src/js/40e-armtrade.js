/* ================= Armory sets: profiles, trading and share codes (v0.33) =================
   Several players can share one device, each with a profile of their own (their kit for every soldier of every
   faction, and their formations). From the Armory you can switch profile, make a new one, and trade sets between
   your profiles: send this soldier's set (or the whole army's kit) to another profile, or take theirs. A set also
   travels as a share code you can copy and paste into another device or browser.
   The kit is cosmetic, so trading changes nothing in a fight. Only known pieces are accepted from a code. */
const ARP={open:false};
function profStore(){ const P=settings.profiles||(settings.profiles={cur:0,list:[{name:'Player 1'}]}); if(!P.list.length) P.list.push({name:'Player 1'}); if(!(P.cur>=0&&P.cur<P.list.length)) P.cur=0; return P; }
const jclone=o=>o?JSON.parse(JSON.stringify(o)):o;
// the live kit is settings.armory/formations; a profile not in use keeps its own copy
function profSaveLive(){ const P=profStore(), me=P.list[P.cur]; me.armory=jclone(settings.armory||{}); me.formations=jclone(settings.formations||{}); }
function profSwitch(i){ const P=profStore(); if(i===P.cur||!P.list[i]) return; profSaveLive(); P.cur=i; const L=P.list[i]; settings.armory=jclone(L.armory||{}); settings.formations=jclone(L.formations||{}); ARM.ver++; saveSettings(); }
function profNew(name){ const P=profStore(); profSaveLive(); P.list.push({name:name||('Player '+(P.list.length+1)),armory:{},formations:{}}); saveSettings(); return P.list.length-1; }
function profKit(i){ const P=profStore(); return i===P.cur?(settings.armory||(settings.armory={})):(P.list[i].armory||(P.list[i].armory={})); }
// trade: one soldier's set, or a faction's whole kit
function armSend(toI,fac,type){ const src=profKit(profStore().cur), dst=profKit(toI); if(!src[fac]) return 0; const F=dst[fac]||(dst[fac]={}); let n=0;
  for(const t in src[fac]){ if(type&&t!==type) continue; F[t]=jclone(src[fac][t]); n++; } ARM.ver++; saveSettings(); return n; }
function armTake(fromI,fac,type){ const src=profKit(fromI), dst=profKit(profStore().cur); if(!src[fac]) return 0; const F=dst[fac]||(dst[fac]={}); let n=0;
  for(const t in src[fac]){ if(type&&t!==type) continue; F[t]=jclone(src[fac][t]); n++; } ARM.ver++; saveSettings(); return n; }
// share codes: 'SE3D-ARM:' + base64 of {f:faction,k:{type:{cat:id}}}
function armCode(fac,type){ const A=(settings.armory||{})[fac]||{}, k={}; for(const t in A){ if(type&&t!==type) continue; k[t]=A[t]; }
  try{ return 'SE3D-ARM:'+btoa(unescape(encodeURIComponent(JSON.stringify({f:fac,k})))); }catch(e){ return ''; } }
function armFromCode(code){
  const m=String(code||'').trim().match(/^SE3D-ARM:([A-Za-z0-9+/=]+)$/); if(!m) return {err:'That is not an Armory code'};
  let D; try{ D=JSON.parse(decodeURIComponent(escape(atob(m[1])))); }catch(e){ return {err:'The code is damaged'}; }
  if(!D||!FACTIONS[D.f]||typeof D.k!=='object') return {err:'The code is damaged'};
  const A=settings.armory||(settings.armory={}), F=A[D.f]||(A[D.f]={}); let n=0;
  for(const t in D.k){ if(!TYPES[t]||typeof D.k[t]!=='object') continue; const L={};
    for(const c in D.k[t]){ const I=ARM_BY[D.k[t][c]]; if(I&&I.cat===c&&I.fac===D.f) L[c]=I.id; }
    if(Object.keys(L).length){ F[t]=L; n++; } }
  ARM.ver++; saveSettings(); return {n,fac:D.f};
}
// the Armory's "Sets and profiles" section
function armTradeHTML(fac,type){
  const P=profStore(), others=P.list.map((p,i)=>({p,i})).filter(o=>o.i!==P.cur);
  const opt=others.map(o=>'<option value="'+o.i+'">'+vwEsc(o.p.name)+'</option>').join('');
  return '<div class="arm-trade"><div class="arm-row"><span>Profile</span><select id="armProf">'+P.list.map((p,i)=>'<option value="'+i+'"'+(i===P.cur?' selected':'')+'>'+vwEsc(p.name)+'</option>').join('')+'</select><button id="armProfNew">New</button><button id="armProfRen">Rename</button></div>'+
    (others.length?'<div class="arm-row"><span>Trade with</span><select id="armOther">'+opt+'</select></div>'+
      '<div class="arm-row"><button id="armSendOne">Send this set</button><button id="armSendAll">Send the army\'s kit</button><button id="armTakeOne">Take their set</button><button id="armTakeAll">Take their kit</button></div>'
      :'<p class="vw-count">Make a second profile to trade sets between them.</p>')+
    '<div class="arm-row"><button id="armCopy">Copy share code</button><button id="armPaste">Paste a code</button></div><p class="vw-count" id="armTradeMsg" role="status" aria-live="polite"></p></div>';
}
function armTradeWire(P,fac,type){
  const q=id=>P.querySelector&&P.querySelector(id), msg=t=>{ const m=q('#armTradeMsg'); if(m) m.textContent=t; };
  const tn=vwEsc(tPl(type,0)), other=()=>{ const s=q('#armOther'); return s?+s.value:-1; }, oname=()=>{ const i=other(); return i>=0?profStore().list[i].name:''; };
  const ps=q('#armProf'); if(ps) ps.onchange=()=>{ sfx('ui'); profSwitch(+ps.value); armPanel(true); };
  const pn=q('#armProfNew'); if(pn) pn.onclick=()=>{ sfx('ui'); const nm=typeof prompt==='function'?prompt('Name the new profile','Player '+(profStore().list.length+1)):null; if(nm===null) return; const i=profNew(String(nm).replace(/[<>]/g,'').trim().slice(0,24)||undefined); profSwitch(i); armPanel(true); };
  const pr=q('#armProfRen'); if(pr) pr.onclick=()=>{ const P0=profStore(), me=P0.list[P0.cur]; const nm=typeof prompt==='function'?prompt('Rename this profile',me.name):null; if(!nm) return; me.name=String(nm).replace(/[<>]/g,'').trim().slice(0,24)||me.name; saveSettings(); armPanel(true); };
  const b=(id,fn)=>{ const e=q(id); if(e) e.onclick=()=>{ sfx('armoryEquip'); fn(); }; };
  b('#armSendOne',()=>{ const n=armSend(other(),fac,type); armPanel(true); msg(n?'Sent your '+tn+'\'s set to '+oname():'Nothing to send: this soldier has no kit yet'); });
  b('#armSendAll',()=>{ const n=armSend(other(),fac,null); armPanel(true); msg(n?'Sent '+n+' sets to '+oname():'Nothing to send yet'); });
  b('#armTakeOne',()=>{ const nm=oname(), n=armTake(other(),fac,type); armPanel(true); msg(n?'Took '+nm+'\'s '+tn+' set':nm+' has no set for this soldier'); });
  b('#armTakeAll',()=>{ const nm=oname(), n=armTake(other(),fac,null); armPanel(true); msg(n?'Took '+n+' sets from '+nm:nm+' has no kit for this army'); });
  const cp=q('#armCopy'); if(cp) cp.onclick=()=>{ sfx('ui'); const code=armCode(fac,null); if(!code){ msg('Nothing to share'); return; }
    const done=()=>msg('Code copied: paste it into the Armory on another device'); try{ if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done,()=>prompt&&prompt('Copy this code',code)); else if(typeof prompt==='function') prompt('Copy this code',code); }catch(e){ if(typeof prompt==='function') prompt('Copy this code',code); } };
  const pa=q('#armPaste'); if(pa) pa.onclick=()=>{ sfx('ui'); const code=typeof prompt==='function'?prompt('Paste an Armory code'):null; if(!code) return; const r=armFromCode(code);
    if(r.err){ msg(r.err); sfx('deny'); return; } if(r.fac!==ARM.fac) armOpen(r.fac); else armPanel(true); const m=document.getElementById('armTradeMsg'); if(m) m.textContent='Added '+r.n+' sets for the '+FACTIONS[r.fac].name; };
}
