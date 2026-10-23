/* ================= Theme music: the game's own recorded score =================
   Seven recorded tracks (public/music, re-encoded at 64 kbps) replace the procedural score whenever they can play:
     menu ............ "Normal" (the title screen and the menus)
     order ........... "March of the Noble Order" I and II (battles fought as the Order Empire)
     chaos ........... "Martyr of War" I and II (battles fought as the Chaos Empire)
     march ........... "March Toward the Horizon" I and II (the war table, Riverlands, the story, the Wildlands)
   Two media elements crossfade through the Web Audio music bus (so the Music slider and ducking still apply); a set
   plays its tracks in turn. If a file can't load (offline before it was cached, a host without the files) the
   procedural score of 44-audio takes over again. The files stream on demand; the offline cache doesn't precache them. */
const THEME_SETS={menu:['menu'],order:['noble-order-1','noble-order-2'],chaos:['martyr-of-war-1','martyr-of-war-2'],march:['horizon-1','horizon-2']};
const THEME={on:false,set:null,cur:-1,el:[null,null],g:[null,null],idx:{},fail:{},t:0,wantT:0};
function themeWant(){
  if(audio.inMenu) return 'menu';
  if(typeof CW3!=='undefined'&&CW3.on) return 'march';
  if(game.mode!=='battle') return 'menu';
  if(game.mission||MAP.id!=='classic'||game.campFight) return 'march';
  const f=facOf(myTeam()); return f==='chaos'?'chaos':f==='wild'?'march':'order';
}
function themeInit(){
  if(THEME.el[0]||!audio.ctx||typeof Audio==='undefined') return !!THEME.el[0];
  try{ for(let i=0;i<2;i++){ const el=new Audio(); el.preload='auto'; el.loop=false;
      const src=audio.ctx.createMediaElementSource(el), g=audio.ctx.createGain(); g.gain.value=0; src.connect(g); g.connect(audio.musicBus);
      el.addEventListener('ended',()=>{ if(THEME.cur===i) themeNext(true); });
      el.addEventListener('error',()=>{ const n=el.dataset&&el.dataset.n; if(n) THEME.fail[n]=true; if(THEME.cur===i) themeNext(true); });
      THEME.el[i]=el; THEME.g[i]=g; }
    return true; }catch(e){ THEME.el=[null,null]; return false; }
}
// start the next track of the wanted set on the free element and fade it in over the old one
function themeNext(sameSet){
  const set=THEME.set, L=(THEME_SETS[set]||[]).filter(n=>!THEME.fail[n]);
  if(!L.length){ THEME.on=false; return; }
  const k=((THEME.idx[set]===undefined?Math.floor(Math.random()*L.length)-1:THEME.idx[set])+1)%L.length; THEME.idx[set]=k;
  const n=L[k], i=THEME.cur===0?1:0, el=THEME.el[i], g=THEME.g[i], t=audio.ctx.currentTime;
  el.dataset.n=n; el.src='music/'+n+'.mp3'; el.currentTime=0;
  const p=el.play(); if(p&&p.catch) p.catch(()=>{ THEME.retry=true; });
  g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value,t); g.gain.linearRampToValueAtTime(.95,t+(sameSet?1.2:2.5));
  const o=THEME.cur>=0?THEME.cur:-1;
  if(o>=0&&o!==i){ const og=THEME.g[o], oe=THEME.el[o]; og.gain.cancelScheduledValues(t); og.gain.setValueAtTime(og.gain.value,t); og.gain.linearRampToValueAtTime(0,t+2.5); setTimeout(()=>{ if(THEME.cur!==o) try{ oe.pause(); }catch(e){} },2700); }
  THEME.cur=i; THEME.on=true;
}
// a few times a second: follow the screen the player is on
function themeTick(){
  if(!audio.ready||!audio.ctx||settings.themeMusic===false){ if(THEME.on&&settings.themeMusic===false) themeStop(); return; }
  const now=performance.now(); if(now<THEME.t) return; THEME.t=now+400;
  if(!themeInit()) return;
  if(audio.ctx.state!=='running') return;
  const w=themeWant();
  if(w!==THEME.set){ THEME.set=w; themeNext(false); return; }
  if(THEME.retry){ THEME.retry=false; const el=THEME.el[THEME.cur]; if(el){ const p=el.play(); if(p&&p.catch) p.catch(()=>{ THEME.retry=true; }); } }
}
function themeStop(){ for(let i=0;i<2;i++){ const el=THEME.el[i]; if(el) try{ el.pause(); }catch(e){} if(THEME.g[i]) THEME.g[i].gain.value=0; } THEME.on=false; THEME.set=null; THEME.cur=-1; }
