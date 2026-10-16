// Build script: stitches the game's source parts together and writes two builds.
//
//   dist/web/       the installable web game (PWA): index.html, minified game.<hash>.js, three.js, fonts,
//                   icons, manifest and an offline service worker. This is what gets hosted.
//   dist/artifact.html   the same game as a single readable HTML file (three.js + fonts from CDNs), used for
//                   the claude.ai preview and by the test harness.
//
// The source parts in src/js are plain scripts that share one scope: they are concatenated in file-name
// order inside a single IIFE, exactly as the original single-file game was written.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { transform } from 'esbuild';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const SRC = path.join(ROOT, 'src'), DIST = path.join(ROOT, 'dist'), WEB = path.join(DIST, 'web');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');
const hash = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);
const args = process.argv.slice(2);
const artifactOut = (args.find(a => a.startsWith('--artifact-out=')) || '').split('=')[1];

// ---------- assemble the game script ----------
const partFiles = fs.readdirSync(path.join(SRC, 'js')).filter(f => f.endsWith('.js')).sort();
const parts = partFiles.map(f => read('js/' + f)).join('');
// ---------- embedded assets: ElevenLabs sounds and voices, Artlist textures (assets/) ----------
const ASSETS = path.join(ROOT, 'assets');
const assetData = { sfx: {}, vox: {}, tex: {} };
for (const [kind, ext] of [['sfx', '.mp3'], ['vox', '.mp3'], ['tex', '.jpg']]) {
  const dir = path.join(ASSETS, kind); if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith(ext)).sort()) {
    const b64 = fs.readFileSync(path.join(dir, f)).toString('base64'), base = f.slice(0, -ext.length);
    if (kind === 'sfx') { const n = base.replace(/_\d+$/, ''); (assetData.sfx[n] = assetData.sfx[n] || []).push(b64); }
    else assetData[kind][base] = b64;
  }
}
const assetJson = JSON.stringify(assetData);
const assetName = `assets.${hash(assetJson)}.json`;
const gameJs = (target, assets) => "(function(){\n'use strict';\n" +
  `const BUILD={target:'${target}',version:'${pkg.version}',assets:'${assets}'};\n` + parts + '})();\n';

const css = read('styles.css'), body = read('body.html');

// ---------- single-file build ----------
const FONTS_CDN = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Teko:wght@500;600&family=Barlow+Semi+Condensed:wght@500;600&display=swap">\n';
const artifact = '<title>Stick Empire 3D</title>\n' + FONTS_CDN + '<style>\n' + css + '</style>\n\n' + body + '\n' +
  '<script type="application/json" id="se3d-assets">' + assetJson + '</script>\n' +
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script>\n' + gameJs('artifact', '#se3d-assets') + '</script>\n';
fs.mkdirSync(DIST, { recursive: true });
fs.writeFileSync(path.join(DIST, 'artifact.html'), artifact);
if (artifactOut) fs.writeFileSync(artifactOut, artifact);

// ---------- web build ----------
fs.rmSync(WEB, { recursive: true, force: true });
fs.mkdirSync(WEB, { recursive: true });
const copyDir = (from, to) => { if (!fs.existsSync(from)) return; fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) { const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b); } };
copyDir(path.join(ROOT, 'public'), WEB);
// three.js r128 (the version the game is written against) and the two typefaces, served from our own origin
fs.mkdirSync(path.join(WEB, 'vendor'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'node_modules/three/build/three.min.js'), path.join(WEB, 'vendor/three.min.js'));
fs.mkdirSync(path.join(WEB, 'fonts'), { recursive: true });
const FONT_FILES = [['Teko', 'teko', 500], ['Teko', 'teko', 600], ['Barlow Semi Condensed', 'barlow-semi-condensed', 500], ['Barlow Semi Condensed', 'barlow-semi-condensed', 600]];
let fontCss = '';
for (const [fam, id, w] of FONT_FILES) { const f = `${id}-latin-${w}-normal.woff2`;
  fs.copyFileSync(path.join(ROOT, `node_modules/@fontsource/${id}/files/${f}`), path.join(WEB, 'fonts', f));
  fontCss += `@font-face{font-family:"${fam}";font-style:normal;font-weight:${w};font-display:swap;src:url(${f}) format("woff2")}\n`; }
fs.writeFileSync(path.join(WEB, 'fonts/fonts.css'), fontCss);

fs.writeFileSync(path.join(WEB, assetName), assetJson);
const min = await transform(gameJs('web', assetName), { minify: true, target: 'safari14', legalComments: 'none' });
const gameName = `game.${hash(min.code)}.js`;
fs.writeFileSync(path.join(WEB, gameName), min.code);

const manifest = {
  name: 'Stick Empire 3D', short_name: 'Stick Empire', id: './', start_url: './', scope: './',
  description: 'Command armies of stick soldiers in 3D battles: regiments, charges and finishers.',
  display: 'fullscreen', display_override: ['fullscreen', 'standalone'], orientation: 'any',
  background_color: '#1c140c', theme_color: '#1c140c', categories: ['games'],
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
};
fs.writeFileSync(path.join(WEB, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<title>Stick Empire 3D</title>
<meta name="description" content="${manifest.description}">
<meta name="theme-color" content="#1c140c">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Stick Empire">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="48x48" href="icons/favicon-48.png">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="stylesheet" href="fonts/fonts.css">
<style>
${css}</style>
</head>
<body>
${body}
<script src="vendor/three.min.js"></script>
<script src="${gameName}"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(WEB, 'index.html'), html);

// offline service worker: precaches every file of this build; a new build = a new cache name
const files = [];
const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name);
  if (e.isDirectory()) walk(p); else files.push(path.relative(WEB, p).split(path.sep).join('/')); } };
walk(WEB);
const version = hash(files.sort().map(f => f + fs.readFileSync(path.join(WEB, f)).length + hash(fs.readFileSync(path.join(WEB, f)))).join('|'));
const sw = read('sw.js').replace('__VERSION__', version).replace('__FILES__', JSON.stringify(['./', ...files.filter(f => f !== 'index.html')]));
fs.writeFileSync(path.join(WEB, 'sw.js'), sw);
fs.writeFileSync(path.join(WEB, 'version.json'), JSON.stringify({ version: pkg.version, build: version }));

const kb = f => (fs.statSync(path.join(WEB, f)).size / 1024).toFixed(0) + ' KB';
console.log(`built v${pkg.version} (${version}) from ${partFiles.length} parts: ${gameName} ${kb(gameName)}, ` +
  `artifact.html ${(artifact.length / 1024).toFixed(0)} KB (assets ${(assetJson.length / 1024).toFixed(0)} KB), ${files.length + 1} web files`);
