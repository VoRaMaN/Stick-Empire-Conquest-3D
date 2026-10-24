// Boots the built game (dist/artifact.html) in node with a stub renderer and a seeded Math.random.
// const { S, THREE } = require('./animboot')(file)          the game without its embedded assets
// const { S, THREE } = require('./animboot')(file, {assets:true})   with them (sounds, textures, the creature models);
//   the models parse asynchronously: await S.cgReady() before testing them
module.exports = function (file, opt) {
  opt = opt || {};
  const fs = require('fs');
  const html = fs.readFileSync(file, 'utf8');
  const js = html.split('<script>')[1].split('</script>')[0];
  const THREE = require('three');
  class FakeRenderer { constructor() { this.shadowMap = {}; this.domElement = {}; } setPixelRatio() {} setSize() {} render() {} }
  THREE.WebGLRenderer = FakeRenderer;
  const els = {};
  function el(id) { if (!els[id]) els[id] = { id, hidden: false, style: {}, textContent: '', innerHTML: '', classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {}, addEventListener() {}, appendChild() {}, onclick: null, value: '1', offsetWidth: 0 }; return els[id]; }
  if (opt.assets) { const m = html.match(/<script type="application\/json" id="se3d-assets">([\s\S]*?)<\/script>/); el('#se3d-assets').textContent = m ? m[1] : ''; }
  global.document = { querySelector: s => el(s), querySelectorAll: () => [], getElementById: id => el('#' + id), createElement: () => el('x' + Math.random()), createElementNS: () => el('x' + Math.random()), addEventListener() {} };
  global.window = { devicePixelRatio: 2, innerWidth: 390, innerHeight: 844, addEventListener() {}, location: { search: '' } };
  global.innerWidth = 390; global.innerHeight = 844;
  global.performance = { now: () => Date.now() };
  global.requestAnimationFrame = () => {};
  global.setTimeout = () => {};
  global.THREE = THREE;
  // deterministic runs: the same numbers every time, so before/after comparisons are fair
  let seed = 1234567; Math.random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  new Function(js)();
  const S = window.__SE3D; S.closeMenu();
  // the creature models: start loading and wait (microtasks only: this harness has no timers)
  S.cgReady = async (n = 20000) => { S.cgStart(); for (let i = 0; i < n && !S.CG.ready; i++) await null; return S.CG.ready; };
  return { S, THREE, fs };
};
