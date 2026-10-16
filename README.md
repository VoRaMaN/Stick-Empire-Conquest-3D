# Stick Empire 3D

A 3D, Total War–style battle game with stick-figure armies, built for the browser with three.js. Two empires take
the field. The Order: miners, swordsmen, Spartans, archers, ninjas, clerics, wizards, wing archers and giants. The
Chaos Empire: Soulbound Thralls, Hellcrawlers, Dreadguards and Soul Harvesters. Every unit is animated with
procedural IK (130 finishers, 130 charge attacks). It plays on phones and desktops and installs as an app from the
browser.

Pick your side on the title screen (Order Empire or Chaos Empire); Skirmish, the Campaign and the Lab use it, and
the enemy fields the other empire.

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

## The Chaos Empire

| Unit | Cost | Role | Abilities |
| --- | --- | --- | --- |
| Soulbound Thrall | 50 souls | Mines soul crystals | A hooded, chained slave with a mattock; fights only when cornered |
| Hellcrawler | 150 souls | Fast pack hunter | Pounce, Pack Frenzy (below) |
| Dreadguard | 150 souls | Heavy armoured axeman | Broad-shouldered and fully armoured: a horned great helm with a burning visor slit and a fanged grill, layered spiked pauldrons, a breastplate cracked with glowing magma, plate on every limb, hip plates and a crimson cape. Hellforged Cleave: a white-hot sweep that interrupts and breaks a shield wall |
| Soul Harvester | 120 souls | Ranged caster | A walking skeleton: a thin column of vertebrae, a rib cage with a captured soul glowing inside, a horned skull, a torn shroud and a lantern scythe. Throws soul fragments, a charged soul blast, and a wail that curses everyone around it |

Chaos pays in **souls** instead of gold. Souls come in at 0.42 of the gold rate (thralls dig red soul crystals, and
the passive trickle is scaled the same way), so the sheet prices weigh the same as the Order's gold prices. There is
no population cap.

Every Chaos unit heals itself (Infernal Regeneration: 1.2% of its health a second after 4 s without being hurt).
The Chaos castle is the Black Citadel: dark stone, bone spikes and skulls on the walls, a lava moat, a burning sigil,
a Dreadguard statue, and its own buildings: the Hellforge (Dreadguards), the Soul Quarry (Thralls), the Soul Spire
(Harvesters) and the Hellpit (Hellcrawlers). Wall Harvesters man its battlements. Its research:

| Building | Research | Effect |
| --- | --- | --- |
| Soul Quarry | Soul Siphon | Thralls dig faster and carry more a trip |
| Hellpit | Magma Claws | Hellcrawler claws set their prey on fire |
| Hellforge | Hellforged Cleave | The Dreadguard's cleave breaks lines and shield walls |
| Hellforge | Infernal Plate | Dreadguards take 20% less damage |
| Soul Spire | Soul Rend | Soul fragments curse what they hit: +25% damage taken for 5 s |

The Thrall, Dreadguard and Soul Harvester each have 10 idles, 11 moves, 5 defence clips, 10 finishers and 10
charges. Their own sound effects and voice lines are not recorded yet, so they use the stock sounds for now. The rest
of the Chaos roster (Hellhound, Bone Reaver, Infernal Bomber, Grim Reaper, Cerberus, Fallen Oracle, Hades) comes
later.

### The Hellcrawler

The Hellcrawler is not a stick soldier
but a four-limbed demon: cracked black rock with magma glowing in the cracks, long ape-like forelimbs with hooked
claws, digitigrade hind legs, a horned skull with a hinged, fanged jaw, bone spikes down its spine and a long
spiked tail, carried like a scorpion's: arched high over its back with the bone blade hanging over its skull.
It walks, trots and gallops on four planted feet (procedural gait and IK), and the tail sways and lags behind
its turns.

It fights with its claws (swipes, rakes, a frenzy of strikes, a rearing double slash), its jaws (lunge bite),
its legs (a reared raptor kick, a turn-and-buck double kick) and its tail (a spinning sweep with the tail dropped
low that hits everything around it, a scorpion strike over its head). Its signature move is the pounce: a leap from several strides out that
knocks archers, wizards, clerics and miners flat. Hellcrawlers hunt in packs and surround their prey four at a
time; every other crawler on the same enemy speeds their claws up (Pack Frenzy, to +54%) and their cracks burn
brighter. They are weak to Spartan shields and area attacks. 10 idles, 5 defence clips, 10 finishers and 10
charges, like the other units; pick it in the Finisher Lab to see them all.

The ones Chaos buys climb out of the Hellpit, a magma pool in a ring of cracked rock and bone outside the Chaos
castle, in packs of up to three.

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

Battle sounds (49 effects, two takes each, including the Hellcrawler's claws, bite, tail, screech, hiss and death and the Hellpit's rumble), the narrator (an old wizard's voice, 18 lines) and three voice lines
for each unit (played when you tap its card) were generated with ElevenLabs. The castle's stone, slate, clay
tile, timber, iron, sandstone, cobble, marble and basalt textures and the nine gold building emblems were
generated with Artlist (Nano Banana 2.1), then cut, made tileable and compressed. Unit portraits are rendered
from the game's own 3D soldiers. Everything lives in `assets/` and is embedded by the build; if a recording can't
be decoded, the synthesized sound plays instead.

## Graphics

Settings → Quality offers Auto, Low, Medium, High, Ultra and Custom, and **Advanced graphics** opens a panel (at
the side on wide screens, so the battle stays in view) where every option can be changed live:

| Group | Options |
| --- | --- |
| Display | Resolution, anti-aliasing (off, FXAA, SMAA, MSAA 4×), frame rate limit (30, 60, unlimited), texture filtering |
| Lighting and shadows | Shadow quality (off to 4096² maps), soft shadow edges, sunlight, sky light, distance haze |
| Ambient occlusion | SSAO on/off, intensity, radius |
| Bloom and glow | Bloom on/off, strength, spread, threshold; emissive glow (magma, Hellpit, torches, windows, eyes, spells) |
| Camera | Depth of field, motion blur, sun shafts (each with its strength), vignette, chromatic aberration, film grain, sharpen |
| Colour | Tone mapping (off, filmic ACES, Reinhard, Cineon), exposure, saturation, contrast, brightness, warmth |
| Effects | Dust and debris density |

With every effect off the game draws straight to the screen as before. Any effect routes the frame through a
half-float HDR chain: scene (MSAA 4× target on WebGL 2) → a half-resolution depth and normal pass feeding ambient
occlusion and sun shafts, with depth of field and camera motion blur gathered in one pass → bloom → tone mapping
and colour grade → FXAA or SMAA. Auto picks a preset from the frame rate and steps it down or up as you play.

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
| `43` | Graphics quality and the Auto frame-rate ladder, FPS counter, settings screen; `43b`: presets, post-processing chain (SSAO, bloom, sun shafts, depth of field, motion blur, tone mapping, grading, FXAA/SMAA/MSAA) and the Advanced Graphics panel |
| `13c`, `27` | The Hellcrawler: stats and every clip; its rig, gait, tail, procedural model and behaviour |
| `13d`, `27b` | The Thrall, Dreadguard and Soul Harvester: stats and every clip; their gear, souls, curses, cleave, regeneration and brains |
| `36b` | Factions: rosters, souls economy, team names, starting armies, the side picker's state |
| `37`–`39` | Castles (walls, gatehouse, buildings, doors, training queues, garrison), the Hellpit (`37b`), the Black Citadel and Chaos buildings (`37c`); research, mana, narrator and building panel; unit portraits |
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
(every unit walks out of its building and through the gate, research, garrison archers, enemy research), the
Hellcrawler (every attack, finisher and charge lands, the gait keeps its feet on the ground, crawlers climb out of
the Hellpit in a battle), the Chaos Empire (Order against Chaos castle battles both ways, every Thrall, Dreadguard
and Harvester clip, finisher aim), a seeded
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
