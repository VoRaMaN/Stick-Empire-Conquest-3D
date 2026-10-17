/* ---------------- settings (saved in this browser) ---------------- */
// Everything the player can change in Settings, plus a few remembered choices. Storage can be missing or
// blocked (private windows, previews), so every read and write is guarded and the defaults always work.
const SETTINGS_KEY='se3d-settings';
const SETTINGS_DEFAULTS={
  quality:'auto',   // auto | low | medium | high
  fps:false,        // FPS counter
  blood:true,
  finMode:1,        // finishers: 0 off, 1 sometimes, 2 always
  size:0,           // battle size index (Normal / Large / Epic)
  auto:true,        // auto-spawn for your army
  master:.8, music:.5, sfx:.9,
  voice:true,       // narrator and unit voices
  drag:'pan',       // one-finger drag on the battlefield: pan | orbit
  minimap:true,
  shake:1,          // screen shake strength (0 off … 2 double)
  uiMode:null,      // layout: 'pc' | 'mobile'; null until the player picks one at first launch
  tutorialDone:false,
  played:0          // battles finished, for the menu's subtitle
};
function loadSettings(){ try{ const s=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'null'); return s&&typeof s==='object'?s:{}; }catch(e){ return {}; } }
const settings=Object.assign({},SETTINGS_DEFAULTS,loadSettings());
function saveSettings(){ try{ localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings)); }catch(e){} }
