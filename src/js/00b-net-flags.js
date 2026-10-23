/* ---------------- online play: shared flags ----------------
   The simulation reads these; the netcode itself lives in 49a–49c. Offline everything stays false and the game
   behaves exactly as before.
     NET.host   this browser runs the authoritative battle and broadcasts it
     NET.guest  this browser shows the host's battle: no AI, no damage, no deaths, no spending of its own
   allowPlay / allowKill / noCap are counters the netcode raises around the few places where a guest may start an
   animation or a death locally (replicated events, a finisher's own choreography), or where the host must not
   record an animation because every client reproduces it anyway. */
const NET={on:false,host:false,guest:false,rec:false,team:0,allowPlay:0,allowKill:0,noCap:0};   // rec: an offline battle being recorded for a replay (49d)
const myTeam=()=>NET.on?NET.team:0;   // the army this screen commands (always 0 offline)
