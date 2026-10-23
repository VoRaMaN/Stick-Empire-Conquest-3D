// Boots the built game (dist/artifact.html) in node with a stub renderer and a seeded Math.random.
// const { S, THREE } = require('./animboot')(file)
module.exports = function (file) {
  const fs = require('fs');
  const html = fs.readFileSync(file, 'utf8');
  const js = html.split('<script>')[1].split('</script>')[0];
  const THREE = require('three');
  class FakeRenderer { constructor() { this.shadowMap = {}; this.domElement = {}; } setPixelRatio() {} setSize() {} render() {} }
  THREE.WebGLRenderer = FakeRenderer;
  const els = {};
  function el(id) { if (!els[id]) els[id] = { id, hidden: false, style: {}, textContent: '', innerHTML: '', classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {}, addEventListener() {}, appendChild() {}, onclick: null, value: '1', offsetWidth: 0 }; return els[id]; }
  global.document = { querySelector: s => el(s), querySelectorAll: () => [], getElementById: id => el('#' + id), createElement: () => el('x' + Math.random()), addEventListener() {} };
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
  return { S, THREE, fs };
};
