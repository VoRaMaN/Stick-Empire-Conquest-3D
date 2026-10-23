/* ================= The sound registry (v0.29): every sound by name, its category, its stand-in =================
   SFX_MANIFEST (embedded by the build from assets/sfx-manifest.json) lists every sound the game plays with its
   category (combat, creature, magic, ui, world). A sound whose recording is not in the build yet plays a stand-in
   (another sound at another pitch) until tools/sfx-generate.mjs has made it with ElevenLabs. Nothing is generated
   while you play: the files are made ahead of time and embedded. Each category has its own level in Settings. */
const SFX_CATS=[['combat','Combat'],['creature','Creatures'],['magic','Magic'],['world','World'],['ui','Interface']];
function sfxResolve(name,vol,opt){
  let n=name, v=vol, o=opt;
  for(let hop=0;hop<3;hop++){ const S=audio.bank[n]; if(S&&S.v&&S.v.length) break; const M=SFX_MANIFEST[n]; if(!M||!M.a) break;
    n=M.a.to; if(M.a.rate) o=Object.assign({rate:M.a.rate},o||{}); if(M.a.vol) v=(v===undefined?1:v)*M.a.vol; }
  const M0=SFX_MANIFEST[name]||SFX_MANIFEST[n], cat=M0&&M0.c, k=cat&&settings.sfxCat&&settings.sfxCat[cat]!==undefined?settings.sfxCat[cat]:1;
  if(k<=0) return null; if(k!==1) v=(v===undefined?1:v)*k;
  return [n,v,o];
}
// which sounds are recorded, which stand in (window.SE3D_SFX() in the console)
function sfxReport(){ const out={recorded:[],synthesized:[],standIn:[],missing:[]};
  for(const n in SFX_MANIFEST){ const S=audio.bank&&audio.bank[n]; if(S&&S.rec) out.recorded.push(n); else if(S&&S.v&&S.v.length) out.synthesized.push(n); else if(SFX_MANIFEST[n].a) out.standIn.push(n+'→'+SFX_MANIFEST[n].a.to); else out.missing.push(n); }
  return out; }
window.SE3D_SFX=sfxReport;
// Settings: a level per category
function sfxCatUI(){
  const host=document.getElementById('sfxCats'); if(!host||host._built||!host.appendChild) return; host._built=1;
  const C=settings.sfxCat||(settings.sfxCat={});
  host.innerHTML='<h4>Sound by kind</h4>'+SFX_CATS.map(([c,n])=>'<label class="row"><span>'+n+'</span><input type="range" min="0" max="1.5" step="0.05" data-sc="'+c+'" value="'+(C[c]===undefined?1:C[c])+'"></label>').join('');
  for(const r of qsa(host,'input[data-sc]')) r.oninput=()=>{ (settings.sfxCat||(settings.sfxCat={}))[r.dataset.sc]=+r.value; saveSettings(); };
}
