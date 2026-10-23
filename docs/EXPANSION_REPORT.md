# Stick Empire 3D — Major Expansion and Revamp: deliverables report

Versions v0.22.1 → v0.31.0, each built, committed to `main`, deployed to `gh-pages` (checked with `git ls-remote` and the deployed `version.json`) and republished to the preview artifact. At your request the full test suite was **not** run; after each phase one short headless run (simulation + drawing) checked for crashes and NaN positions, and caught four bugs that were fixed before delivery.

| Phase | Version | What shipped |
|---|---|---|
| 1 Audit | — | Read the source; root causes found for the Riverlands bugs |
| — Theme music | 0.22.1 | Your seven tracks as the game's score (menu, Order, Chaos, marches), crossfading; a Settings switch |
| 2 Riverlands bugs | 0.22.1 | Bridges: wider bridgehead entry, keep to the deck's middle, edge clamp, no-progress watchdog that steps on or re-routes. Miners walk to their own mine. Orders and formation places in the river move to the bank. Fords slow again. Battles never start paused; an invisible pause is lifted |
| 3 AI economy | 0.23.0 | Worker targets that move with the battle (more for Chaos thralls/souls), mine saturation, frozen when pressed, losses replaced; raided workers flee (switch mines on Riverlands) and the nearest regiment defends; recruits counter the enemy's make-up |
| 4 Wyvern Knight | 0.24.0 | Organic low-poly wyvern (bone-chain wings with membranes, S-neck, horns, spade tail), ground + flight, rider stances, 48 clips + 6 procedural flight cycles, 10 abilities with keys and AI |
| 5 Hades on Cerberus | 0.25.0 | Smaller crowned Hades with a burning bident on a Cerberus; 4 combos, 5 mounted finishers, 5 abilities, 4 colour variants |
| 6 Bone Reaver + Ninja | 0.26.0 | New looks; Reaver 15 attacks/9 idles, Ninja 16 attacks/16 idles, new finishers |
| 7 Wildland elves | 0.27.0 | Elven looks (skin, hair, ears, hoods, cloaks, circlets); roster of 10 incl. Spear Hunter, Nature Mage, Eagle Scout, Woodland Wyvern Rider; Elven Captain; elven idles |
| 8 Armory | 0.28.0 | Three 3D armouries (castle, infernal forge, hollow tree); 13 categories, 70 pieces on the soldier's joints, saved per faction and unit, compatibility rules, cosmetic |
| 9 Sound | 0.29.0 | `assets/sfx-manifest.json` (87 sounds), one resolver (recording → synthesized → stand-in), per-category levels, `tools/sfx-generate.mjs` for ElevenLabs |
| 10 The Frontier | 0.30.0 | 1,080 m three-faction battlefield (4 lands, 16 zones, 7 bridges, third-faction warbands); skirmish, story mission, replays, online after the migration |
| 11 Animation + balance | 0.31.0 | Animation registry (roles, counts in the Unit Viewer, load-time validation: 0 broken clips); Wyvern Knight 550 gold + 40 mana, Hades 700, longer training |
| 12 Testing | — | Skipped at your request (short smoke runs only) |

## Still open (needs you)
- **ElevenLabs sounds**: no key was available, so nothing was generated. 38 sounds play synthesized or stand-in audio. Run `ELEVENLABS_API_KEY=… node tools/sfx-generate.mjs` then `node build.mjs`. Never commit the key.
- **Server update**: `supabase/migrations/20261024000000_se3d_ranked_spectate_wildlands.sql` is still **not applied**. It enables ranked play, the leaderboard, spectating, the Wildlands online and (new) the Frontier online. Say "apply the migration" and I will apply it.
- **Full test suite**: `npm test` has not been run on these releases.

## Where things live
`13h-wyvern.js` / `27f-wyvern.js` (Wyvern Knight) · `13i-hades.js` / `27g-hades.js` (Hades) · `13j-revamp.js` / `26e-revamp.js` / `27h-revamp-ai.js` (Reaver, Ninja) · `13k-elves.js` + `36c-wild.js` (elves) · `40d-armory.js` (Armory) · `44b-music.js` (theme music) · `44c-sfx.js` + `assets/sfx-manifest.json` + `tools/sfx-generate.mjs` (sound) · `37h-frontier.js` + parametric `37d/37e/37f` (Frontier) · `34b-aieco.js` (AI economy) · `14b-animreg.js` (animation registry).
