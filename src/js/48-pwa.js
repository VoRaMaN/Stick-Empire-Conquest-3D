/* ---------------- installable app: offline cache + update notice ---------------- */
// Only the hosted web build registers the service worker (the single-file preview cannot use one).
if(BUILD.target==='web'&&window.navigator&&'serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
  const hadController=!!navigator.serviceWorker.controller;
  window.addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!hadController) return;     // first install: nothing to announce
    toast('A new version of the game is ready','Restart',()=>location.reload(),20);
  });
}
