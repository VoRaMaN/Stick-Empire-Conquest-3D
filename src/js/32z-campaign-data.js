/* ================= Campaign world data: factions, territories, biomes, regions =================
   Pure data, no rendering. The 3D war table (33b) and the campaign rules (33) both read it.
   Map units: the continent spans x -100…100 (west → east) and z -65…65 (north → south). Positions never change, and
   neighbours are worked out once from the region shapes, so every reload gives the same world.
   The eight original campaign territories keep their ids (sparta … keep), so old saves and the tests carry on. */
const CW_FACTIONS={
  order:{id:'order',name:'Order Empire',col:'#e4b23a',banner:'#c9971f',territory:'order_empire',capital:'sparta'},
  chaos:{id:'chaos',name:'Chaos Dominion',col:'#d0465a',banner:'#9a1c2c',territory:'chaos_empire',capital:'keep'},
  wild:{id:'wild',name:'Wildlands Confederacy',col:'#4fae6a',banner:'#2f7a46',territory:'wildlands',capital:'wild_heartwood'},
  rebel:{id:'rebel',name:'Free Holds',col:'#8f8270',banner:'#6f6456',territory:'frontier',capital:null},
};
// the large faction territories (each holds many regions)
const CW_TERR={
  order_empire:{name:'Order Empire',faction:'order'},
  chaos_empire:{name:'Chaos Dominion',faction:'chaos'},
  wildlands:{name:'Wildlands Confederacy',faction:'wild'},
  frontier:{name:'Northern Frontier and Badlands',faction:'rebel'},
};
// biomes: ground colour, base height, height variation, tree density and kind, and the battlefield used for a fight there
const CW_BIOME={
  grass:   {name:'Grassland',  col:'#7a9a48',h:1.4,v:.7,trees:.07,tree:'oak',   preset:'olive'},
  farm:    {name:'Farmland',   col:'#9aa24e',h:1.2,v:.4,trees:.03,tree:'oak',   preset:'olive'},
  forest:  {name:'Forest',     col:'#4f7a36',h:1.8,v:1.1,trees:.85,tree:'oak',  preset:'sparta'},
  hills:   {name:'Hills',      col:'#82904e',h:3.4,v:2.2,trees:.14,tree:'pine', preset:'bronze'},
  mountain:{name:'Mountains',  col:'#8a8478',h:8.5,v:4.5,trees:.05,tree:'pine', preset:'bronze'},
  snow:    {name:'Snowfield',  col:'#e6ecef',h:3.2,v:2.2,trees:.06,tree:'snow', preset:'bronze'},
  snowforest:{name:'Snowy forest',col:'#d7e2e4',h:2.6,v:1.6,trees:.7,tree:'snow',preset:'sparta'},
  lake:    {name:'Lakeland',   col:'#86a656',h:1.1,v:.5,trees:.18,tree:'oak',   preset:'olive'},
  river:   {name:'River valley',col:'#7c9c4a',h:1.1,v:.5,trees:.12,tree:'oak',  preset:'ford'},
  desert:  {name:'Desert',     col:'#d8bc80',h:1.7,v:1.1,trees:0,  tree:'dead',  preset:'dunes'},
  badlands:{name:'Rocky badlands',col:'#9a7652',h:3.2,v:2.6,trees:.02,tree:'dead',preset:'flats'},
  swamp:   {name:'Swamp',      col:'#5a6a3c',h:.85,v:.3,trees:.35,tree:'swamp',  preset:'ford'},
  volcanic:{name:'Volcanic land',col:'#3a2a26',h:3.0,v:2.4,trees:.02,tree:'dead',preset:'ash'},
  ash:     {name:'Ash plains', col:'#58524e',h:1.6,v:.8,trees:.03,tree:'dead',   preset:'ash'},
  corrupt: {name:'Corrupted forest',col:'#3c3a2c',h:1.8,v:1.1,trees:.6,tree:'corrupt',preset:'ash'},
  dark:    {name:'Dark rock',  col:'#2c2426',h:3.6,v:2.8,trees:.01,tree:'dead',  preset:'keep'},
  wild:    {name:'Wild forest',col:'#3e6a32',h:2.0,v:1.3,trees:.95,tree:'wild',  preset:'sparta'},
  highland:{name:'Highlands',  col:'#7a8452',h:4.4,v:2.8,trees:.25,tree:'pine',  preset:'bronze'},
};
// settlement kinds: what stands at the heart of a region (drawn by 33b)
// capital · castle · fort · village · tower · camp · chaosfort · timber · none
// s: garrison strength 1–4 (how hard the fight there is) · strat: a strategic place (pass, crossing, fortress)
const CW_REGIONS=[
  // ---- Order Empire: the green west
  {id:'sparta',name:'Sparta Hills',terr:'order_empire',fac:'order',biome:'grass',x:-74,z:6,set:'capital',capital:true,s:4,note:'The seat of the Order Empire, ringed by farms and roads.'},
  {id:'olive',name:'Olive Coast',terr:'order_empire',fac:'order',biome:'farm',x:-52,z:-10,set:'village',s:1,note:'Gentle slopes, olive groves and the king’s road east.'},
  {id:'order_silverwood',name:'Silverwood',terr:'order_empire',fac:'order',biome:'forest',x:-84,z:-20,set:'village',s:1,note:'Old woods of silver-barked oaks.'},
  {id:'order_greenvale',name:'Greenvale',terr:'order_empire',fac:'order',biome:'farm',x:-62,z:-32,set:'village',s:1,note:'The breadbasket of the west.'},
  {id:'order_highmeadow',name:'Highmeadow',terr:'order_empire',fac:'order',biome:'hills',x:-38,z:-28,set:'fort',s:2,note:'Rolling pasture under the western ridge.'},
  {id:'order_lakeshire',name:'Lakeshire',terr:'order_empire',fac:'order',biome:'lake',x:-88,z:24,set:'village',s:1,note:'Fishing villages round a cold blue lake.'},
  {id:'order_brightwater',name:'Brightwater',terr:'order_empire',fac:'order',biome:'river',x:-60,z:28,set:'castle',strat:'River crossing',s:2,note:'A castle guards the bridge over the Silver River.'},
  {id:'order_oakhollow',name:'Oakhollow',terr:'order_empire',fac:'order',biome:'forest',x:-36,z:16,set:'village',s:1,note:'Woodcutters and charcoal burners.'},
  {id:'order_gullhaven',name:'Gullhaven',terr:'order_empire',fac:'order',biome:'grass',x:-95,z:2,set:'village',s:1,note:'A harbour town on the western sea.'},
  {id:'order_amberfield',name:'Amberfields',terr:'order_empire',fac:'order',biome:'farm',x:-78,z:46,set:'village',s:1,note:'Golden wheat as far as you can see.'},
  {id:'order_stonebridge',name:'Stonebridge',terr:'order_empire',fac:'order',biome:'river',x:-42,z:44,set:'castle',strat:'River crossing',s:2,note:'The southern bridge into the Wildlands.'},
  {id:'order_frostfall',name:'Frostfall',terr:'order_empire',fac:'order',biome:'snowforest',x:-76,z:-48,set:'fort',s:2,note:'The empire’s northern march, deep in snow.'},
  {id:'order_frostgate',name:'Frostgate',terr:'order_empire',fac:'order',biome:'snow',x:-95,z:-36,set:'tower',s:1,note:'A lonely watchtower over the frozen coast.'},
  // ---- the Northern Frontier: snow, ice and mountain passes
  {id:'north_ironpass',name:'Iron Pass',terr:'frontier',fac:'rebel',biome:'mountain',x:-52,z:-52,set:'fort',strat:'Mountain pass',s:2,note:'The only road over the northern range.'},
  {id:'north_whitepeak',name:'Whitepeak',terr:'frontier',fac:'rebel',biome:'mountain',x:-28,z:-53,set:'tower',s:2,note:'The highest summit in the world.'},
  {id:'north_wolfden',name:'Wolfden',terr:'frontier',fac:'rebel',biome:'snowforest',x:-6,z:-50,set:'camp',s:1,note:'Wolves and outlaws in the snowy pines.'},
  {id:'north_glacierfort',name:'Glacier Fort',terr:'frontier',fac:'rebel',biome:'snow',x:16,z:-50,set:'fort',strat:'Fortress',s:3,note:'An ancient fort cut into the ice.'},
  {id:'north_ravenhold',name:'Ravenhold',terr:'chaos_empire',fac:'chaos',biome:'snow',x:40,z:-50,set:'chaosfort',s:2,note:'A black tower on the frozen hills.'},
  {id:'north_icemere',name:'Icemere',terr:'chaos_empire',fac:'chaos',biome:'lake',x:62,z:-50,set:'village',s:1,note:'A frozen lake and its huddled huts.',frozen:true},
  {id:'north_stormwatch',name:'Stormwatch',terr:'chaos_empire',fac:'chaos',biome:'snow',x:86,z:-44,set:'tower',s:2,note:'Lightning-struck cliffs over the north sea.'},
  // ---- the centre: the western ridge, its pass, and the badlands
  {id:'bronze',name:'Bronze Pass',terr:'frontier',fac:'rebel',biome:'mountain',x:-16,z:0,set:'fort',strat:'Mountain pass',s:1,note:'A narrow pass between two ridges.',pass:true},
  {id:'center_greycrag',name:'Greycrag',terr:'frontier',fac:'rebel',biome:'mountain',x:-16,z:-28,set:'tower',s:2,note:'Grey cliffs and goat paths.'},
  {id:'center_dustwatch',name:'Dustwatch',terr:'frontier',fac:'rebel',biome:'badlands',x:-2,z:-34,set:'camp',s:1,note:'Bandits watch the desert road from here.'},
  {id:'flats',name:'Salt Flats',terr:'frontier',fac:'rebel',biome:'desert',x:6,z:-16,set:'village',s:1,note:'Dead flat. Nowhere to hide.'},
  {id:'center_brokenhigh',name:'Broken Highlands',terr:'frontier',fac:'rebel',biome:'badlands',x:10,z:12,set:'camp',s:2,note:'Canyons and mesas, a maze of red rock.'},
  {id:'center_sunscar',name:'Sunscar Desert',terr:'frontier',fac:'rebel',biome:'desert',x:18,z:-32,set:'camp',s:1,note:'Wind-carved dunes and sun-bleached bones.'},
  // ---- the Chaos Dominion: the burning east
  {id:'ford',name:'Stone Ford',terr:'chaos_empire',fac:'chaos',biome:'river',x:30,z:4,set:'fort',strat:'River crossing',s:2,note:'Twin hills overlook the crossing of the Ember River.'},
  {id:'dunes',name:'Red Dunes',terr:'chaos_empire',fac:'chaos',biome:'badlands',x:36,z:-20,set:'village',s:2,note:'Broken ground of small dunes.'},
  {id:'ash',name:'Ash Valley',terr:'chaos_empire',fac:'chaos',biome:'volcanic',x:56,z:8,set:'castle',s:3,note:'One great hill. Whoever holds it rules.'},
  {id:'keep',name:'Infernal Gate',terr:'chaos_empire',fac:'chaos',biome:'dark',x:80,z:-6,set:'capital',capital:true,s:4,note:'The capital of the Chaos Dominion, on high black rock.'},
  {id:'chaos_cinderfall',name:'Cinderfall',terr:'chaos_empire',fac:'chaos',biome:'volcanic',x:60,z:-28,set:'chaosfort',s:3,note:'Ash rains from a smoking cone.'},
  {id:'chaos_blackspire',name:'Black Spire',terr:'chaos_empire',fac:'chaos',biome:'dark',x:88,z:-26,set:'chaosfort',strat:'Fortress',s:3,note:'A needle of black stone, its towers jagged.'},
  {id:'chaos_emberdeep',name:'Ember Valley',terr:'chaos_empire',fac:'chaos',biome:'volcanic',x:82,z:20,set:'village',s:2,note:'Lava streams light the valley at night.'},
  {id:'chaos_gloomwood',name:'Gloomwood',terr:'chaos_empire',fac:'chaos',biome:'corrupt',x:60,z:32,set:'camp',s:2,note:'A forest twisted by the Dominion’s magic.'},
  {id:'chaos_blightmarsh',name:'Blightmarsh',terr:'chaos_empire',fac:'chaos',biome:'swamp',x:40,z:30,set:'village',s:2,note:'A poisoned marsh at the Wildlands border.'},
  {id:'chaos_skullrock',name:'Skullrock',terr:'chaos_empire',fac:'chaos',biome:'dark',x:96,z:4,set:'tower',s:2,note:'A skull-shaped crag over the eastern sea.'},
  {id:'chaos_ashenreach',name:'Ashen Reach',terr:'chaos_empire',fac:'chaos',biome:'ash',x:76,z:44,set:'village',s:2,note:'Grey plains of ash and cinders.'},
  {id:'chaos_dreadhollow',name:'Dread Hollow',terr:'chaos_empire',fac:'chaos',biome:'dark',x:70,z:58,set:'chaosfort',s:2,note:'A pit where the Dominion breeds its beasts.'},
  // ---- the Wildlands Confederacy: the deep green south
  {id:'wild_heartwood',name:'Heartwood',terr:'wildlands',fac:'wild',biome:'wild',x:-6,z:48,set:'timber',capital:true,s:4,note:'The great timber hall of the Confederacy.'},
  {id:'wild_mossmere',name:'Mossmere',terr:'wildlands',fac:'wild',biome:'swamp',x:-26,z:40,set:'village',s:1,note:'A misty mere among the mosses.'},
  {id:'wild_thornridge',name:'Thornridge',terr:'wildlands',fac:'wild',biome:'highland',x:16,z:38,set:'fort',s:2,note:'Palisades along a thorny ridge.'},
  {id:'wild_fernhollow',name:'Fernhollow',terr:'wildlands',fac:'wild',biome:'wild',x:-58,z:58,set:'village',s:1,note:'Ferns taller than a man.'},
  {id:'wild_bogfen',name:'Bogfen',terr:'wildlands',fac:'wild',biome:'swamp',x:10,z:58,set:'village',s:1,note:'Stilt houses over black water.'},
  {id:'wild_elderglade',name:'Elderglade',terr:'wildlands',fac:'wild',biome:'wild',x:32,z:52,set:'timber',s:2,note:'The oldest trees in the world.'},
  {id:'wild_stonefang',name:'Stonefang',terr:'wildlands',fac:'wild',biome:'highland',x:26,z:24,set:'fort',strat:'Border fort',s:2,note:'A rock fort watching the Ember River.'},
  {id:'wild_greenmantle',name:'Greenmantle',terr:'wildlands',fac:'wild',biome:'forest',x:-20,z:24,set:'village',s:1,note:'Hunters’ lodges under the western ridge.'},
  {id:'wild_misthaven',name:'Misthaven',terr:'wildlands',fac:'wild',biome:'river',x:52,z:56,set:'village',s:1,note:'The Ember River’s delta, lost in mist.'},
  {id:'wild_deeproot',name:'Deeproot',terr:'wildlands',fac:'wild',biome:'wild',x:-4,z:30,set:'timber',s:2,note:'Roots older than the empires.'},
  {id:'wild_wildwatch',name:'Wildwatch',terr:'wildlands',fac:'wild',biome:'highland',x:-32,z:60,set:'tower',s:1,note:'A lookout over the southern sea.'},
];
// rivers (polylines, source → sea) and lakes; mountain ridges (x, z, height, width) shape the land between regions
const CW_RIVERS=[
  {name:'Silver River',pts:[[-48,-58],[-46,-40],[-56,-22],[-64,-6],[-63,12],[-60,28],[-52,38],[-42,46],[-38,58],[-36,72]],w:1.5},
  {name:'Ember River',pts:[[30,-60],[32,-42],[27,-26],[27,-10],[30,4],[34,16],[40,28],[46,42],[52,56],[56,72]],w:1.7},
  {name:'Greenwater',pts:[[-6,-6],[-2,10],[-6,22],[-10,36],[-14,52],[-18,72]],w:.9},
];
const CW_LAKES=[[-90,24,7],[62,-50,6.5],[-26,40,5],[-72,-34,4.5]];
const CW_RIDGES=[
  [[-34,-64],[-24,-46],[-16,-28],[-15,-12]],    // the western ridge running south…
  [[-16,12],[-18,24],[-24,34]],                 // …broken by Bronze Pass, then on into the Wildlands
  [[-70,-62],[-40,-62],[0,-62],[40,-62],[78,-62]],   // the northern range along the coast
  [[70,-38],[92,-36],[98,-18]],                 // the Dominion's black cliffs
];
const CW_VOLCANOES=[[64,-30,9],[58,12,6],[86,26,7],[80,-10,5]];
// the third major faction is only a campaign territory for now; it fights with the rival main faction's army
