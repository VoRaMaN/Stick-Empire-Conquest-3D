# Stick Empire 3D

A 3D, Total War–style battle game with stick-figure armies, built for the browser with three.js. The whole Order
army takes the field: miners, swordsmen, Spartans, archers, ninjas, clerics, wizards, wing archers and giants, all
animated with procedural IK (90 finishers, 90 charge attacks). It plays on phones and desktops and installs as an
app from the browser.

## Units

| Unit | Role | Abilities |
| --- | --- | --- |
| Miner | Digs gold | |
| Swordsman | Fast, cheap infantry | |
| Spartan | Shield line; stops arrows from the front | |
| Archer | Ranged | |
| Ninja | Fastest fighter | Shinobi (invisible; first blows from hiding hit double and poison), Fixate (each blow on the same enemy hits harder) |
| Cleric | Healer | Heal, Sanctuary (area heal), Cure (removes poison and fire), Blinding Flash |
| Wizard | Spell caster | Arcane Blast, Meteor, Lightning Call, Electric Wall, Poison Spray, Force Push |
| Wing Archer | Flyer with a crossbow | Flies on flapping mechanical wings; only ranged units can hit him in the air. Blazing Bolts, dive and strafing shots |
| Giant | Smashes groups | |

Every fighting unit has 10 idles, 10 to 11 moves, 5 defence clips (block, parry, dodge, flinch, recoil), 10
finishers and 10 charge attacks.

## Castles and research

Behind each statue stands a castle: a crenellated curtain wall with a gatehouse and iron portcullis, corner
towers, and eight production buildings around a paved yard. A soldier you buy is trained in his own building,
walks out of its door and marches through the gate. The giant is let out of his prison (red eyes glow behind the
bars while one waits), and the wing archer launches from the aerie's roof hatch. Archers on the battlements shoot
anything that comes within range.

| Building | Trains | Research |
| --- | --- | --- |
| Castle (gatehouse) | | Castle Archers I–III (two more garrison archers each), Passive Income I–III, Resilience (statue +40%) |
| Miners' Hall | Miner | Miner Hustle |
| Barracks | Swordsman, Spartan | Rage, Shield Wall |
| Archery Range | Archer | Fire Arrows, Volley Drill |
| Shadow Dojo | Ninja | Shinobi |
| Mage Tower | Wizard | Electric Wall, Poison Spray |
| Temple of Light | Cleric | Cure |
| Aerie | Wing Archer | Blazing Bolts |
| Giant's Prison | Giant | Giant Growth I–II |

Research costs gold and mana and runs one at a time per building, as in Stick Empires; mana trickles in on its
own. Tap a building (or hover over it with a mouse for an outline and summary) to train and research there. The
Crimson general researches too. Upgrades only add to the original five units; the newer units' special powers
are unlocked by research. The Finisher Lab has everything unlocked.

## Sound, voices and textures

Battle sounds (42 effects, two takes each), the narrator (an old wizard's voice, 18 lines) and three voice lines
for each unit (played when you tap its card) were generated with ElevenLabs. The castle's stone, slate, clay
tile, timber, iron, sandstone, cobble, marble and basalt textures and the nine gold building emblems were
generated with Artlist (Nano Banana 2.1), then cut, made tileable and compressed. Unit portraits are rendered
from the game's own 3D soldiers. Everything lives in `assets/` and is embedded by the build; if a recording can't
be decoded, the synthesized sound plays instead.

## Play locally

```bash
npm install
npm run build        # writes dist/web (the game) and dist/artifact.html (single-file preview)
npm run serve        # http://localhost:8080
```

## Install on a phone

Host `dist/web` on any static host (GitHub Pages, Netlify, itch.io). Then:

- **iPhone / iPad:** open the site in Safari, tap **Share → Add to Home Screen**.
- **Android / desktop Chrome:** use **Install** in the game's main menu or the browser's install button.

The installed game opens full screen and works offline. A new version is picked up on the next launch, and the
game offers a restart when one is ready.

## Project layout

| Path | What it is |
| --- | --- |
| `src/body.html`, `src/styles.css` | Page markup and styles (menus, HUD, sheets) |
| `src/js/NN-*.js` | Game source, one file per system. Files share one scope and are joined in name order inside a single function, so their order matters. |
| `src/sw.js` | Offline service worker template (the build fills in the file list and version) |
| `public/` | Icons copied into the web build |
| `tools/` | Icon source and renderer, a local static server |
| `assets/` | ElevenLabs sound effects (`sfx/`) and voice lines (`vox/`), Artlist textures and emblem atlas (`tex/`) |
| `tests/` | Simulation regression tests run headless in Node |
| `build.mjs` | The build |

Main source files:

| File | System |
| --- | --- |
| `00-settings` | Saved settings (quality, sound, controls, battle options) |
| `01`–`03` | Terrain, renderer and scene, instanced stick bodies |
| `10`–`14` | Unit types, attacks, finishers, charges, blow aiming (`13a`/`13b`: the Ninja, Cleric, Wizard and Wing Archer) |
| `20`–`26` | Skeleton and IK, ragdolls, blood, arrows, dropped gear, capes; `26`: the new units' gear, wing-flight model, spells, status effects and brains |
| `30`–`36` | Combat, armies and formations, regiments and tactics, campaign, AI, per-unit update and drawing; `36`: the new units' regiments and formation places |
| `40`–`42` | Game modes, battle UI, camera and touch input |
| `43` | Graphics quality (Auto/Low/Medium/High), FPS counter, settings screen |
| `37`–`39` | Castles (walls, gatehouse, buildings, doors, training queues, garrison); research, mana, narrator and building panel; unit portraits |
| `44` | Sound: recorded effects with synthesized fallbacks, voices, procedural music (Web Audio) |
| `45` | Title screen, pause, battle results |
| `46` | Battlefield map |
| `47` | Training battle |
| `48` | Offline cache and update notice |
| `50-main` | Main loop and start-up |

## Tests

```bash
npm test
```

Builds the game and runs the Node regression suite: a full battle with every unit's finishers, regiments and
orders, the campaign from start to victory, effects, finisher aim accuracy, charges, arrow rendering in a
400-soldier battle, big-army formations, every idle, move, finisher and charge of the four newer units, castles
(every unit walks out of its building and through the gate, research, garrison archers, enemy research), a seeded
fingerprint proving the original five units still behave exactly as before, and a simulation cost report.

## Controls

| Action | Touch | Mouse / keyboard |
| --- | --- | --- |
| Move the camera | Drag one finger | Left-drag, WASD or arrow keys |
| Zoom | Pinch | Scroll, + / − |
| Turn | Twist two fingers | Right-drag, Q / E |
| Tilt | Drag two fingers up or down | Right-drag, R / F |
| Zoom to a spot | Double-tap the ground | |
| Jump across the field | Tap the map at the top | |
| Pause | Pause button | Esc |
