# Stick Empire 3D

A 3D, Total War–style battle game with stick-figure armies, built for the browser with three.js. Two empires take
the field. The Order: miners, swordsmen, Spartans, archers, ninjas, clerics, wizards, wing archers and giants. The
Chaos Empire: Soulbound Thralls, Hellcrawlers, Dreadguards and Soul Harvesters. Every unit is animated with
procedural IK (140 finishers, 130 charge attacks). It plays on phones and desktops and installs as an app from the
browser.

Pick your side on the title screen (Order Empire or Chaos Empire); Skirmish, the Campaign and the Lab use it, and
the enemy fields the other empire.

The Unit Viewer (on the title screen, or Unit info in the Lab) shows any unit up close on a turntable, with its
description, stats, abilities and how many idles, moves, finishers and charges it has.

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
| Dreadguard | 150 souls | Heavy armoured axeman | Broad-shouldered and fully armoured: a horned great helm with a burning visor slit and a fanged grill, layered spiked pauldrons, a breastplate cracked with glowing magma, plate on every limb, hip plates and a crimson cape. Every swing of his axe cuts through all the enemies in its arc, and his spins cut all the way round. Hellforged Cleave: a white-hot sweep that interrupts and breaks a shield wall |
| Soul Harvester | 120 souls | Ranged caster | A walking skeleton: a thin column of vertebrae, a rib cage with a captured soul glowing inside, a horned skull, a torn shroud and a lantern scythe. Enemies that get within arm's reach meet the scythe: 16 close-range strikes (reaps, an overhead Death Arc, a spin, ankle and hook trips, a cursed claw, a Soul Slash that curses) Throws soul fragments, a charged soul blast, and a wail that curses everyone around it |
| Hellhound | 100 souls | Pack runner | A lean lava-rock demon dog with a flame mane and a burning tail; the fastest unit in the army, with the Hellcrawler's pounce, Pack Frenzy and moves |
| Cerberus | 220 souls | Three-headed guardian | The great hound of the underworld: shaggy dark fur, three horned wolf heads in spiked bronze collars, a burning mane and a serpent for a tail. Breathes streams of fire from all three mouths |
| Bone Reaver | 140 souls | Fast skirmisher | A skeleton with a curved bone blade in each hand: flurries, thrusts, leaps, and a whirl that cuts all the way round |
| Infernal Bomber | 160 souls | Explosives | A goggled imp with a barrel of hellfire bombs: lobbed, rolled and cluster bombs that blast and burn; explodes when it dies |
| Fallen Oracle | 200 souls + 40 mana | Healer and hexer | Blindfolded seer with a third eye: Dark Mending, Mass Mending, Hex (+25% damage taken), Void Bolt |
| Grim Reaper | 250 souls | Elite reaper | Hooded skeleton with a great scythe: reaping arcs, drinks 25% of every cut as life, steps through shadow behind its prey |
| Hades | 400 souls + 100 mana | Hero | Lord of the underworld in bronze plate, crowned in fire, with a burning bident: a burning aura, Hellfire Slam, Wave of Flame |

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

The Thrall, Dreadguard and Soul Harvester each have 10 idles, 5 defence clips and 10 charges; the Thrall and Dreadguard
have 10 finishers and 11 moves, the Soul Harvester 20 finishers and 23 moves (11 spells and casts, 12 more scythe strikes). Their own sound effects and voice lines are not recorded yet, so they use the stock sounds for now. The Hellhound uses the Hellcrawler's full move set (10 idles, 12–13 moves,
10 finishers, 10 charges). Cerberus has his own: 10 moves (Triple Bite, Skull Ram, Paw Maul, Rear Stomp,
Fire Sweep, Serpent Lash, Cyclone, Crushing Leap, Rend and Shake, Infernal Howl), 6 idles in which the three heads
sniff, bicker and howl independently, 8 finishers (among them a three-headed tug of war and a cremation) and 6
charges, with the side heads animated on their own channels so each head moves for itself; the Bone Reaver, Bomber, Oracle, Grim Reaper and Hades have 5 idles, 8 moves, 5 or 6
finishers and 4 charges each so far.

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
time, and they go for the enemy's front line first, piling four onto a victim before spreading out; every other crawler on the same enemy speeds their claws up (Pack Frenzy, to +54%) and their cracks burn
brighter. They are weak to Spartan shields and area attacks. 10 idles, 5 defence clips, 10 finishers and 10
charges, like the other units; pick it in the Finisher Lab to see them all.

The ones Chaos buys climb out of the Hellpit, a magma pool in a ring of cracked rock and bone outside the Chaos
castle, in packs of up to three.

## Riverlands map

**Riverlands rules (v0.18):**
- Ranged units reach much further: archers, wing archers and soul harvesters 5× (+400%), wizards, oracles and
  bombers 4× (+300%). Soldiers dodge, block or parry incoming shots.
- Sight is tripled (+200%): soldiers notice enemies walking past and go for them, but only ones their army can see.
- **Fog of war:** ground never seen is dark, ground seen before is dim, and enemies outside your view are hidden on
  the field and the minimap and can't be targeted. Vision comes from soldiers, castles, statues and held zones.
- The river can only be crossed by the bridges; soldiers find their way to the best one.
- Zone bonuses: markets B and C pay +6 gold a second; shrines A and D give +2 mana a second and +10% damage. Every
  held zone heals your soldiers standing in it and reveals the ground around it.
- The computer trains more miners as the battle goes on, sends detachments sized to the enemy at each zone, leaves
  guards, falls back when outnumbered, raids your miners with fast troops, comes home when its castle is attacked
  and pushes once it holds most of the valley.
- Online: the host picks Classic or Riverlands and finishers Off / Sometimes / Always in the room lobby.
- Riverlands PvP: the online screen has a **Classic / Riverlands** choice for quick match and new rooms; quick match
  pairs players who picked the same map. The online screens show **who is online right now** (browsing, in a
  lobby, in battle) and how many open quick-match rooms each map has.
- Spell shots look like their caster: the Wizard's arcane orb (white core, circling motes, comet tail), his
  meteor (fire and smoke), the Soul Harvester's wailing soul (a pale skull-face with burning red eyes and a gaping mouth, a cage of
  lights and a twisting violet-to-crimson ghost tail), the Oracle's twin teal spirit lights in a
  helix, and the Bomber's fizzing bomb with sparks and smoke.
- Fog of war also hides glows, sparks, smoke, fire, blood, arrows and spells where you can't see.
- Long arrow shots arc high like a real volley: past ~18 m the archer aims up and the arrow climbs (about 20–25 m
  at 70 m) and drops onto where the target will be.

**Day and night, terrain and objectives (v0.20):**
- **Day and night:** a six-minute day runs morning, day, dusk, night and dawn, and the battle card shows the time of
  day. At night everyone sees 40% less, fires light the ground round them for both armies, and every regiment's
  standard-bearer carries a torch. Ninjas strike 35% harder, run faster and can't be seen unless an enemy is within
  9 m.
- **Ambush:** soldiers inside a forest can't be seen by the enemy unless one comes within 9 m or they attack. Their
  first blows from hiding do 40% more damage.
- **Fords:** four shallow crossings lie between the bridges. Wading halves speed, adds 25% to damage taken, and
  nobody can dodge or parry in the water. Route-finding uses a ford only when it is much shorter than a bridge.
- **Supply lines:** a soldier more than 75 m from his castle and 40 m from any zone his army holds is out of supply,
  and his morale slowly drains.
- **New objectives:**
  - E and F, militia villages: a free swordsman every 30 s.
  - G and H, watchtowers: see 70 m around.
  - I and J, resurrection shrines: raise one of your fallen every 25 s.
- **Neutral camps:** two bandit camps and two ogre dens guard 300 and 450 gold. They attack anyone who comes close;
  the army that kills the last guard takes the gold, and the camp refills after three minutes.

**Veteran regiments and formations (every battle except the classic regression mix):**
- **Veterans:** a regiment earns a star at 4, 10 and 20 kills. Each star gives +8% damage dealt and 6% less damage
  taken, and the stars show above its banner.
- **Formations:** set with the regiment's Formation button or the V key.
  - Wedge: +25% charge damage.
  - Shield wall: ranged damage −45%, slower.
  - Loose order: splash damage −40%, wider spacing.
  - Square: braced against charges, no flanks or rear, slowest.

**RTS controls** (Settings → Interface, on by default):
- PC: drag a box to select regiments (Shift adds), click one to select it, double-click to select every regiment of
  that kind on screen, right-click the ground to march (several regiments line up side by side), right-click an
  enemy to attack, right-click the map to march there.
- PC camera: WASD, the arrow keys, middle-drag or the screen edges scroll; right-drag turns.
- PC keys: Ctrl+A selects all; Shift or Ctrl + 1–9 makes a group and 1–9 picks it (press twice to look at it);
  H hold, C charge, X rejoin the army, Z capture, Space looks at the selection, Esc lets go.
- Phones: **Box** turns the next drag into a selection box and **All** selects everything.

Skirmish → **Choose the map** offers the **Classic field** or **Riverlands**, a river valley 320 × 320 m, about ten
times the classic map's 168 × 64 m. The castles move out to the edges of the valley (walls at ±118 m, statues at
±106 m), so armies march three times as far to meet.

- **Capture zones A–D**, laid out as in the design sketch (point-symmetric: B and D nearer your castle, A and C
  nearer the enemy's). Soldiers standing in a zone with no enemy in it lower the other army's banner and raise their
  own up the 8 m pole (about 11 s for one soldier, quicker with more); with both armies inside, the zone is contested
  and nothing moves. A held zone pays its army 5 gold a second (souls for Chaos). The ring on the ground shows the
  holder and the capture progress; the battlefield map and the side cards show who holds what. Select a regiment and
  tap **Capture** to send it to the nearest zone you don't hold; the enemy general sends detachments of his own.
- **Two gold mines a side** in the corners beside each castle, each with a storehouse the miners carry to.
- **A river** winds down the middle under five bridges (three stone, two timber); soldiers can wade it anywhere, slowly.
- Hills, forests, bushes and long grass, two villages with windmills and fields, two hamlets, tent camps beside the
  castles, watchtowers by the bridges, ruins on two hilltops, signposts and a forested rim. Soldiers walk round trees,
  houses, tents and castle walls.
- The scenery is built once from its own random seed. Trees, bushes and grass are instanced in tiles that are skipped
  off screen or beyond the haze, far trees switch to simpler shapes, and the long grass is left out on Low quality.
  The battlefield map becomes a square in the corner.

Online matches are played on the classic field for now.

## Campaign: the war table

The campaign map is a miniature 3D continent on a walnut war table in a dark, candle-lit chamber. Five candles stand at
the table's edge, each with its own flickering light, and one warm key light casts the shadows.

**The world:**
- 49 regions in three empires: the Order Empire (green west), the Chaos Dominion (burning east) and the Wildlands
  Confederacy (deep forests and swamps in the south). The free holds of the snowy north and the central badlands
  belong to none of them.
- 18 biomes: grassland, farmland, forest, hills, mountains, snowfields, snowy forest, lakes, river valleys, desert,
  rocky badlands, swamp, volcanic land, ash plains, corrupted forest, dark rock, wild forest and highlands.
- Three rivers, four lakes (one frozen), a northern range, the western ridge with Bronze Pass, smoking volcanoes,
  roads between neighbouring regions, and several thousand trees.
- Every region has a village, fort, castle, watchtower, war camp, dark fortress or timber hold, with a banner in its
  owner's colour. The three capitals are larger.

**How it is built:**
- Everything is deterministic. The terrain, region shapes, trees and settlement positions are the same on every
  load, and they never use the battle's random numbers.
- Regions are data (`32z-campaign-data.js`). Shapes, heights and neighbours are generated from that data
  (`33a-cwgen.js`), and the table is built once (`33b-cwmap.js`).
- Selecting a region or capturing one only updates a small colour texture, the labels and the banners.

**Playing it:**
- Drag to pan, right-drag or Q/E to turn, mouse wheel or pinch to zoom, WASD to scroll.
- Click a region's ground, its castle or its name label to select it; double-click to fly there.
- The card shows the region's owner, territory, biome, settlement, strategic role, garrison, tribute and
  neighbours.
- Regions you can attack (next to land you hold) pulse; a region under threat has a flashing red border.
- **March** fights the real campaign battle. River crossings are fought on Riverlands; other regions use the ground
  of their biome.
- Winning hands the region over and the table reopens in your colours. After each battle the rival empire and the
  Wildlands may swallow a free hold or strike at your border.
- You win by taking the rival empire's capital.
- The flat map is still there as a fallback where WebGL isn't available. Old saves carry on: the eight original
  territories keep their ids and the new regions are added.

## Generals, cavalry and the Hell Riders

**Generals.** Every army takes the field with a hero in a regiment of his own (★ banner): the Order **General** (a swordsman) or the Chaos **Warlord** (a Dreadguard), 28% bigger and about 3.5× as tough, hitting 1.5× as hard. Kills level him up to level 5 (more health and damage, a wider aura). Allies within his aura (11–15 m) hit 10–18% harder and keep their nerve. Two abilities on a cooldown: **Rally Cry / War Howl** (heal 20%, rally the routing, +25% damage and speed for 8 s), **Shield Wall** (allies take 40% less damage for 8 s) and the Warlord's **Meteor** (up to 95 damage and fire on the thickest enemy crowd within 30 m). Nothing can be cast in the first 20 s of a battle. A fallen general returns at the castle 90 s later at his level. The enemy general uses his abilities himself; yours wait for you (or for Auto-spawn). Settings → Battle → Generals turns them off.

**Bone Reaver and Ninja revamp** (v0.26). The Bone Reaver has swept bone horns, spine spikes, a bone pauldron and a soul-fire core burning in its ribs; 7 new attacks (Shear Cut, Death Spiral, Gut and Lift, Low Reap, Bone Vault, Chattering Frenzy, Soul Rend — 15 in all), 4 new idles (9) and a new finisher, Bone Harvest. The Ninja wears a steel brow band in the army's colour, a sash, a short blade and a shuriken pouch; 6 new attacks (Iaido Draw, Shadow Flurry, Shuriken Volley, Heel Drop, Crescent Moon, Smoke Strike — 17 in all), 4 new idles (14) and two new finishers, Death Blossom and Silent End.

**Hades rides Cerberus** (v0.25). The lord of the underworld is no longer a towering giant on foot: a smaller, crowned Hades in dark plate and a cloak rides a three-headed Cerberus, with a two-pronged bident whose tips burn. Hound and rider strike in turn: four combos (Bident and Fang, Underworld Onslaught, Three Heads One Lord, Infernal Whirl) on top of the Cerberus' own moves, five mounted finishers (Bident Impalement, Underworld Trample, Judgment of Three, Hellfall, Soul Rip), rider stances (thrust, sweep, raise, slam). Abilities **J K N M B**: Infernal Strike, Cerberus Rage, Soul Drain, Shadow Step, Apocalypse. Colour variants: Infernal, Frost, Toxic, Shadow.

**Wyvern Knights** (v0.24, replacing the horse Knight). Order's royal knight rides a war wyvern from the Barracks (450 gold, regiments of 4): an organic low-poly beast with faceted scales, a cream keel, swept horns, glowing eyes, a long S-neck, a spiked tail with a spade, and wings built as bone chains (arm, forearm, wrist, three fingers) with a ten-panel membrane. On the ground it walks on its hind legs and the knuckles of its folded wings and fights with lance, jaws, talons, tail and wings; in the air its legs tuck, the wings beat to the demand (climb, cruise, glide, hover, bank, dive), only arrows, bolts and spells reach it, and it crosses rivers and walls. It takes off for distant targets and lands to fight; **G** keeps it aloft (it burns the field with its breath) or keeps it down for 25 s.
Knight abilities **J K N M B**: Royal Lance Charge, Aerial Execution, Shield of the Crown, Royal Pursuit, King's Judgment. Wyvern abilities **Shift + J K N M B**: Infernal Breath, Talon Dive, Wingstorm, Predator's Screech, Aerial Assault. The rider has stances of his own (lance levelled, shield up, lance high, standing to strike). The computer general uses all ten when they pay off.
Animations: 48 clips (10 ground attacks, 10 idles, 5 flight, 8 abilities, 6 reactions, 6 finishers, 3 charges) plus 6 procedural flight cycles.

**Hell Riders** (Hellpit research, 240 souls + 180 mana): an armoured Chaos rider in black spiked plate with a horned helm, burning eyes and a black lance mounts every Cerberus: +150 health, 15% less damage taken and lance thrusts of his own between the beast's bites.

**Unit abilities.** A selected regiment can use its special now from the ability bar: Swordsmen **Rage** (with the research), Ninjas **Vanish** (with Shinobi), Clerics **Mass Heal**, mounts and beasts **Spur** (+40% speed for 5 s).

## The Wildlands Confederacy (third faction)

The free clans of the old forests, playable in Skirmish (pick **Wildlands** on the title screen; **Choose the enemy** sets who you fight) and present on the campaign's war table as the third power. They fight with the Order's bodies under their own names and colours, moss-green with leaf crowns:

| Unit | Based on | What's different |
| --- | --- | --- |
| Forager | Miner | Digs gold |
| Thorn Warden | Swordsman | Tougher and faster (125 health, speed 4.8) |
| Sylvan Ranger | Archer | Fast archers who shoot quicker (speed 4.3, 1.4 s between shots) |
| Shade Stalker | Ninja | |
| Grove Druid | Cleric | Heals; with **Call of the Forest** (Sacred Grove research) summons Treants from the ability bar (I): one, or two in a forest, for 40 s |
| Ancient Treant | Giant | Bark and branches, 1250 health |

Wildlands soldiers regrow wounds out of the fight (1% a second, 2% in a forest). Their general, the **Warden-Chief**, calls **Bloom** (allies within 14 m regrow 40% over 8 s and shake off poison and fire) and **Grasping Roots** (the thickest enemy crowd within 30 m is held fast for 4 s). Their castle is the Order's plan in mossy stone under green roofs: Warden Hall, Ranger Lodge, Shade Grove, Heartwood Hollow, Forager Lodge and the Sacred Grove under the Elder Hall. Online, the Wildlands need the server update below.

## Story: The River War

Five missions on Riverlands (main menu → **Story**), unlocked one after another, played as your chosen side:

1. **Hold the Stone Bridge**: hold the west bridgehead for five minutes against seven waves; it falls if the enemy holds it with none of yours there for 20 s.
2. **Escort the Miners**: six miners walk the north road to Ashford (they set off after 20 s; your escort keeps beside them until you order it elsewhere). Four raider ambushes wait in the woods. Bring three home.
3. **The Three Shrines**: hold shrine A, shrine D and market B together for a full minute within twelve minutes.
4. **The Ogre Dens**: clear both ogre dens within eight minutes; the enemy army stays behind its walls.
5. **Elderwood**: destroy the statue of the Wildlands (the Chaos Empire if you are the Wildlands).

An objective panel under the HUD shows the goal and its progress, and the objective glows on the field. Pause → Restart, and Retry or Next mission on the results, restart the mission.

## Replays

Every offline battle (skirmish, campaign, story) is recorded in memory with the online host's own snapshots and events, five a second for up to 20 minutes. **Watch replay** on the results plays it back through the online guest's side of the netcode: every soldier, blow, finisher and death, without fog, at 1×, 2× or 4×, from any camera, with Pause, Restart and Exit.

## Ranked, the leaderboard and watching live (needs the server update)

`supabase/migrations/20261024000000_se3d_ranked_spectate_wildlands.sql` adds (and includes the presence and map-matching parts of `20261023010000_se3d_presence_quick_map.sql`):

- **Ranked quick match**: pairs players who searched ranked on the same map; a decisive result moves every seated player's rating by an Elo step (K 32, team strength the average of its players). Seasons are quarters (Season 1 is October to December 2026).
- **Leaderboard**: the season's top 50 and your place.
- **Banner colours** unlocked by your best rating this season (Bronze for a ranked game, Silver 1100, Gold 1250, Diamond 1400), shown on your own regiments' flags.
- **Watching live**: public matches being played, or any match by its code. Spectators receive the match channel but cannot send on it; they see the whole field without fog.
- The **Wildlands** allowed in online rooms.

The online screen asks the server whether it has the update; until it does, these stay hidden and online play works as before. As with every online result, the simulation host reports the outcome; the server cannot replay the battle to check it.

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
| Display | Resolution, anti-aliasing (off, FXAA, SMAA, MSAA 4×), frame rate limit (30, 60, unlimited), texture filtering, view distance |
| Lighting and shadows | Shadow quality (off to 4096² maps), soft shadow edges, shadow distance, sunlight, sky light, distance haze |
| Ambient occlusion | SSAO on/off, intensity, radius |
| Bloom and glow | Bloom on/off, strength, spread, threshold; emissive glow (magma, Hellpit, torches, windows, eyes, spells) |
| Camera | Depth of field, motion blur, sun shafts (each with its strength), vignette, chromatic aberration, film grain, sharpen |
| Colour | Tone mapping (off, filmic ACES, Reinhard, Cineon), exposure, saturation, contrast, brightness, warmth |
| Effects | Dust and debris density |

**View distance** and **Shadow distance** are also in Settings → Graphics, and both stay as you set them when you
change the quality preset. View distance (0.5× to 2.5×, shown in metres) pushes the haze and the far edge of the
drawn world out or in; on Riverlands the trees, villages and other scenery are drawn that much further too, so a
longer view shows more of the big map and a shorter one is faster. Shadow distance (20 to 160 m, 46 by default)
sizes the box round the camera inside which things cast shadows: further covers more of the field, but the same
shadow map is spread wider, so edges get softer, and more objects have to be drawn into it.

With every effect off the game draws straight to the screen as before. Any effect routes the frame through a
half-float HDR chain: scene (MSAA 4× target on WebGL 2) → a half-resolution depth and normal pass feeding ambient
occlusion and sun shafts, with depth of field and camera motion blur gathered in one pass → bloom → tone mapping
and colour grade → FXAA or SMAA. Auto picks a preset from the frame rate and steps it down or up as you play.

Fire is drawn as glowing billboard flames: a soft alpha-blended body under an additive core and halo that shift
from white-hot to orange to dark red as each flame rises, sways and burns out, trailing a little smoke. Burning
units, bombs, Hades' hellfire and Cerberus' breath and mane all use it, and bloom makes it glow further.

## Online multiplayer

**Online Multiplayer** on the title screen plays real people: **1v1**, or **2v2** where teammates share one army and
one treasury. Pick 1v1 or 2v2, then:

- **Quick match** takes a seat in the oldest open public room of that mode, or opens one and waits for players.
- **Create private room** gives a 6-character code (no 0/O, 1/I/L) with a copy button. Friends use **Join room**.
- In the **lobby** every player sees the seats of both teams, names, Ready marks and who is connected. Each team picks
  its faction. Players can change their name, switch to a free seat on the other team, ready up, or leave. The host
  can **Start** once every seat is filled and everyone is ready. If the host leaves the lobby, the next player becomes
  host; if everyone leaves, the room closes.
- A player whose page reloads during a battle gets **Rejoin battle** on the online menu.

### How it works

| Piece | Used for |
| --- | --- |
| Supabase Auth, anonymous sign-in | A player identity per browser tab (no account; a reload keeps it) |
| Supabase PostgreSQL (`se3d_*` tables) | Rooms, seats, ready states, match status and results. Changed only through `se3d_*` RPC functions |
| Supabase Realtime, private channel `se3d:match:<match uuid>` | The battle itself: commands, snapshots, events, presence |
| GitHub Pages | The static game (`dist/web`), built and deployed by GitHub Actions |

**Host-authoritative.** The player who created the room is the simulation host: their browser runs the real battle
with the AI general switched off. Every player, the host included, changes the battle only with **commands**: buy,
research, army stance, regiment move / attack / hold / charge / rejoin, auto-spawn, surrender. The host validates each
one before applying it: the sender holds a seat, the seat's team owns the regiment or castle, the sequence number is
newer, the command id is unseen, the payload is well-formed, the unit is in that faction's roster, and gold or souls,
mana and population allow it. Then the host applies it or refuses it with a reason the sender sees. Teammates' commands
are applied in the order the host receives them, so two purchases can never spend the same gold.

About 10 times a second (8 in 2v2) the host broadcasts a **snapshot** of each soldier: id, type, team, position,
facing, health, status flags, regiment and charge style. It also carries regiments and their orders, both treasuries
and mana, stances, castle queues, research and garrisons, and statue health, plus the **events** since the last
snapshot: an animation started (with its target), a finisher, a death with its impulse, a unit walking out of a door
or climbing out of the Hellpit, research finished, and the end of the battle. A Normal battle's snapshot is about
1–3 KB.

Guests run the same engine for looks only. Soldiers are puppets built from the real models. They follow the
host's snapshots about 0.2 s behind, interpolated (never extrapolated far), so legs, IK and lean animate as offline.
They play the host's attack and finisher animations, and become the guest's own cosmetic ragdolls when the host
reports a death. A guest never deals damage, kills, spends, spawns or decides the winner. Its arrows and spells are
visual only.

**Every Realtime message is signed.** Each player's browser makes an ECDSA P-256 key pair and registers the public half
on its seat (`se3d_set_key`); the private half never leaves the page. A message counts only if it verifies against the
seat of the member it claims to be from, so guests accept snapshots only from the host's key and the host accepts
commands only from seated players. Realtime Authorization adds that only current members can join a match's channel.

**Disconnections.**
- Connection bar: every battle screen shows the link to the host, who is connected, and notices such as "Bravo lost
  connection".
- Guest side: a guest whose snapshots stop sees a warning after 2.5 s and a "connection lost" screen after 8 s.
- Host gone: if the host is still gone after 30 s, the guest asks the server to end the match. The server checks the
  host's last heartbeat itself and refuses while the host is alive. The match then ends with **no winner**.
- Host side: when a team has nobody connected for 60 s, the host ends the match with no winner. A dropped connection
  never hands out a victory.
- Deliberate leaving: a 1v1 guest who leaves surrenders. A 2v2 guest who leaves leaves their ally to fight on.
- Server cleanup: a `pg_cron` job closes abandoned lobbies, stuck starts and battles whose host vanished, even when no
  client is left to notice.

### Database

The migrations are in `supabase/migrations/`, one file per step, matching the project's migration history:

- **Tables:** `se3d_matches` (code, mode, host, status, seed, configuration, expiry), `se3d_match_players` (one row per
  seat taken: team, slot, ready, public key, heartbeat; a player who leaves keeps the row with `left_at` set) and
  `se3d_match_results`.
- **Uniqueness:** the active-room code, one seat per player and one player per slot are enforced by unique indexes.
  Two players joining at the same moment can never share a seat.
- **Status:** changes are checked by a trigger: WAITING ↔ READY → STARTING → PLAYING → FINISHED, and any open state →
  CANCELLED. Nothing else is allowed.
- **Access:** RLS lets members read only their own rooms. No client can write any table directly. Every change is a
  `SECURITY DEFINER` RPC that checks `auth.uid()`, membership, host role and room state inside one transaction.

`se3d_match_players_draft_unused` is an empty first draft of the seat table, kept only because removing a table needs
a destructive statement. It is safe to drop.

### Configuration

The game needs the project URL and the **publishable** key, both browser-visible by design. `build.mjs` reads
`SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` from the environment (GitHub Actions repository variables), and falls
back to `online.config.json`. It refuses a secret or `service_role` key. Without a configuration the game builds with
online play switched off and says so on the online menu; everything else still works.

In the Supabase project:

- **Authentication → Sign In / Providers → Allow anonymous sign-ins** must be on. The game explains this if it isn't.
- Recommended: **Realtime → Settings → turn off "Allow public access"**, so only private channels exist.

### Limits

- **Trust.** A browser host is not a dedicated server. The host's own player could modify their copy of the game, and
  if the host closes the page the battle can't continue. There is no host migration: the match ends with no winner.
  Signed messages and server-side checks stop guests from impersonating others or reporting results; they can't make
  the host's browser itself cheat-proof. A competitive release would need an authoritative server, such as a Node or
  Deno game server on a host that keeps processes running; GitHub Pages can't.
- **Capacity.** Supabase's free plan allows about 100 Realtime messages a second across the whole project, counting
  each delivery. A 1v1 at 10 snapshots a second uses about 20; a 2v2 at 8 a second uses about 32. That is roughly five
  simultaneous 1v1 matches or three 2v2 matches on the free plan.
- **Battle size.** Online battles are Normal-sized, and the Large setting is accepted. Epic armies would make
  snapshots larger than is sensible for this transport.
- **Host in the background.** A host's background tab keeps simulating through a worker timer, but browsers may
  throttle it after several minutes.

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
| `20`–`26` | Skeleton and IK, ragdolls, blood, arrows, dropped gear, capes; `23b`: glowing fire particles; `26`: the new units' gear, wing-flight model, spells, status effects and brains |
| `30`–`36` | Combat, armies and formations, regiments and tactics, campaign, AI, per-unit update and drawing; `36`: the new units' regiments and formation places |
| `40`–`42` | Game modes, battle UI, camera and touch input; `40b`: the Unit Viewer (descriptions, stats card, turntable) |
| `43` | Graphics quality and the Auto frame-rate ladder, FPS counter, settings screen; `43b`: presets, post-processing chain (SSAO, bloom, sun shafts, depth of field, motion blur, tone mapping, grading, FXAA/SMAA/MSAA) and the Advanced Graphics panel |
| `13c`, `27` | The Hellcrawler: stats and every clip; its rig, gait, tail, procedural model and behaviour |
| `13d`, `27b` | The Thrall, Dreadguard and Soul Harvester: stats and every clip; their gear, souls, curses, cleave, regeneration and brains |
| `36b` | Factions: rosters, souls economy, team names, starting armies, the side picker's state |
| `37`–`39` | Castles (walls, gatehouse, buildings, doors, training queues, garrison), the Hellpit (`37b`), the Black Citadel and Chaos buildings (`37c`), the Riverlands map (`37d`: terrain, river, bridges, scenery, capture zones, obstacles, its minimap); research, mana, narrator and building panel; unit portraits |
| `44` | Sound: recorded effects with synthesized fallbacks, voices, procedural music (Web Audio) |
| `45` | Title screen, pause, battle results; `45b`: the PC or Mobile layout (first-launch question, Settings switch, hints) |
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
fingerprint proving the original five units still behave exactly as before, the online protocol (`nettest`: a host
and guests in separate processes exchanging the real snapshots and commands: replication, command validation, remote
recruitment, deaths, victory, 2v2 shared armies, disconnection), Riverlands (`rivertest`: a five-minute battle on the big map in
which zones change hands and pay out, banners rise and fall, miners work both corner mines, nobody leaves the field
or stands inside a tree, house, tent or wall; a zone taken, contested and lost step by step; the classic field
restored afterwards), cavalry and generals (`cavtest`: castle battles with Knights, Hell Riders and both generals: lance thrusts land, riders are thrown, generals level up and use their abilities, the Warlord's meteor falls; every Knight finisher, move, idle and charge in the Lab), the Wildlands (`wildtest`: castle battles against the Chaos Empire both ways with Treant summons and regrowth, then each story mission started, run and won) and a simulation cost report.

Two more test sets need network access to the Supabase project and are run by hand:

```bash
NODE_USE_ENV_PROXY=1 node tests/online/rooms.test.mjs              # rooms, codes, seats, RLS, start/result rules, private channels
npm run serve &  python3 tests/online/browser_match.py http://localhost:8080/ 1v1   # (or 2v2) real browsers, real identities
```

The layouts are checked in a real browser (no network needed): the first-launch question, the Settings switch, and on
phones in landscape and portrait that the top row and the dock leave the battlefield in view without overlapping.

```bash
npm run serve &  python3 tests/ui_layout.py http://localhost:8080/
```

View distance and shadow distance have their own browser check: both sliders in Settings and on the Advanced screen,
saved and kept across presets and reloads, and moving the haze, far plane, Riverlands scenery and shadow box.

```bash
npm run serve &  python3 tests/distance_check.py http://localhost:8080/
```

## PC or Mobile layout

The first time the game opens it asks **How do you play?** and offers two layouts, suggesting the one that fits the
device (Mobile on a touch screen, PC with a mouse). The choice is remembered and can be changed any time in
**Settings → Interface**. Both layouts accept touch and mouse alike; only the arrangement changes.

- **PC** keeps the full-size panels: title and mode tabs at the top, both armies' cards and the map under them,
  and the dock with its own rows for units, orders and actions.
- **Mobile** keeps the battlefield clear. In landscape, where a phone is only 320–430 px tall, both armies' cards and
  the map share one row beside the pause button, and the dock is two rows (unit cards, then orders and actions side by
  side); the building panel and the settings open as columns on the right; the title screen puts the logo beside the
  menu. On an 844 × 390 phone the top row and the dock take about 37 % of the height. In portrait, the mode tabs
  share the top row with the pause button. The mode tabs are left out in landscape: the title screen has every mode.

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

Settings → Controls has a **Screen shake** slider (0–200 %); 0 turns camera shake off.

### Commands in battle

| Action | Touch | Mouse / keyboard |
| --- | --- | --- |
| Queue a waypoint | | Shift + right-click (dotted path on the ground and the map) |
| General's abilities | Ability bar | T, Y |
| Selected regiments' specials | Ability bar | U, I |
| Make / pick a control group | Group bar (+) | Ctrl + 1–9 / 1–9 (twice: look) |
| Look at the latest alert | Tap the alert | Click it, or L |
| Ping the map for a teammate | Ping button, then tap | P, then click |
| Radial menu of orders | Hold a finger on the field | |

Hover over a soldier (PC) for his health, armour, morale, status and what he is strong and weak against; hover over a unit card for its cost and stats.

### Accessibility

Settings → Interface: **Interface size** (80–150 %), **Larger text**, **Colour-blind colours** (blue against orange on the map, the health bars, the zones and the battle report) and **Calm mode** (no screen shake, flashes or freeze-frames).
