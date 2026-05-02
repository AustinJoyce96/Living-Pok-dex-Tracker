import { useState, useEffect, useCallback, useRef, Component } from "react";
import { ITEM_ACQUISITION, type AcquisitionEntry } from "./itemData";

class ErrorBoundary extends Component<{children:any},{error:any}>{
  constructor(props:any){super(props);this.state={error:null};}
  static getDerivedStateFromError(error:any){return{error};}
  render(){
    if(this.state.error) return (
      <div style={{background:"#1a0000",color:"#ff6666",padding:"2rem",fontFamily:"monospace",fontSize:12,whiteSpace:"pre-wrap"}}>
        <b>App Error — please report this:</b>{"\n\n"}
        {String(this.state.error?.message||this.state.error)}{"\n\n"}
        {String(this.state.error?.stack||"")}
      </div>
    );
    return this.props.children;
  }
}

// Global reset + responsive layout
const globalStyle = document.createElement("style");
globalStyle.textContent = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root { height: 100%; margin: 0; padding: 0; background: #0a0a0a; overflow: hidden; }
  .dex-viewport { width: 100%; height: 100dvh; }
  .dex-shell {
    background: #CC0000; display: flex; flex-direction: column;
    width: 100%; height: 100dvh; overflow: hidden;
  }
  .dex-screen { flex: 1; overflow-y: auto; min-height: 0; }
  @media (min-width: 600px) {
    html, body, #root { overflow: auto; }
    .dex-viewport { height: auto; padding: 16px; }
    .dex-shell {
      width: 100%; max-width: 960px; margin: 0 auto;
      height: calc(100dvh - 32px);
      border-radius: 16px; border: 3px solid #aa0000;
    }
    .dex-screen { flex: 1; overflow-y: auto; min-height: 0; }
  }
`;
document.head.appendChild(globalStyle);

const win = window as any;
const getItem = async (key: string): Promise<string | null> => {
  if (win.storage) {
    try { const r = await win.storage.get(key, true); return r ? r.value : null; } catch { return null; }
  }
  return localStorage.getItem(key);
};
const setItem = async (key: string, value: string): Promise<void> => {
  if (win.storage) {
    try { await win.storage.set(key, value, true); } catch {}
  } else {
    localStorage.setItem(key, value);
  }
};
const listKeys = async (prefix: string): Promise<string[]> => {
  if (win.storage) {
    try { const r = await win.storage.list(prefix, true); return r ? r.keys : []; } catch { return []; }
  }
  return Object.keys(localStorage).filter((k: string) => k.startsWith(prefix));
};

// ─── PokéAPI Cache ────────────────────────────────────────────────────────────
// Two-layer cache: in-memory (instant) → localStorage (persists across sessions).
// localStorage keys are namespaced "poke_cache:<url>" with a 7-day TTL.
// Falls back gracefully if localStorage is full or unavailable.
const CACHE_PREFIX = "poke_cache:";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const pokeCache = new Map<string,any>();

const fetchPoke = async (url:string): Promise<any> => {
  // 1. In-memory hit (fastest — same session)
  if(pokeCache.has(url)) return pokeCache.get(url);

  // 2. localStorage hit (persists across sessions)
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + url);
    if(raw) {
      const {data, ts} = JSON.parse(raw);
      if(Date.now() - ts < CACHE_TTL_MS) {
        pokeCache.set(url, data); // promote to in-memory
        return data;
      } else {
        localStorage.removeItem(CACHE_PREFIX + url); // expired — evict
      }
    }
  } catch { /* localStorage unavailable or parse error — continue to fetch */ }

  // 3. Network fetch
  const r = await fetch(url);
  const data = await r.json();

  // Store in both layers
  pokeCache.set(url, data);
  try {
    localStorage.setItem(CACHE_PREFIX + url, JSON.stringify({data, ts: Date.now()}));
  } catch { /* localStorage full — in-memory only, no crash */ }

  return data;
};

// Clears all PokéAPI cache entries from both localStorage and in-memory
const clearPokeCache = () => {
  pokeCache.clear();
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  } catch {}
};

const VERSION_GROUPS: {[key:string]:{label:string,gen:number}} = {
  "red-blue":                {label:"Gen 1 — Red/Blue",      gen:1},
  "yellow":                  {label:"Gen 1 — Yellow",         gen:1},
  "gold-silver":             {label:"Gen 2 — Gold/Silver",    gen:2},
  "crystal":                 {label:"Gen 2 — Crystal",        gen:2},
  "ruby-sapphire":           {label:"Gen 3 — Ruby/Sapphire",  gen:3},
  "emerald":                 {label:"Gen 3 — Emerald",        gen:3},
  "firered-leafgreen":       {label:"Gen 3 — FR/LG",          gen:3},
  "diamond-pearl":           {label:"Gen 4 — Diamond/Pearl",  gen:4},
  "platinum":                {label:"Gen 4 — Platinum",       gen:4},
  "heartgold-soulsilver":    {label:"Gen 4 — HG/SS",          gen:4},
  "black-white":             {label:"Gen 5 — Black/White",    gen:5},
  "black-2-white-2":         {label:"Gen 5 — B2/W2",          gen:5},
  "x-y":                     {label:"Gen 6 — X/Y",            gen:6},
  "omega-ruby-alpha-sapphire":{label:"Gen 6 — OR/AS",         gen:6},
  "sun-moon":                {label:"Gen 7 — Sun/Moon",       gen:7},
  "ultra-sun-ultra-moon":    {label:"Gen 7 — US/UM",          gen:7},
  "sword-shield":            {label:"Gen 8 — Sword/Shield",   gen:8},
  "scarlet-violet":          {label:"Gen 9 — Scarlet/Violet", gen:9},
};

// Maps individual game version names → version group keys (for encounter filtering)
const VERSION_TO_GROUP: {[v:string]:string} = {
  "red":"red-blue","blue":"red-blue","yellow":"yellow",
  "gold":"gold-silver","silver":"gold-silver","crystal":"crystal",
  "ruby":"ruby-sapphire","sapphire":"ruby-sapphire","emerald":"emerald",
  "firered":"firered-leafgreen","leafgreen":"firered-leafgreen",
  "diamond":"diamond-pearl","pearl":"diamond-pearl","platinum":"platinum",
  "heartgold":"heartgold-soulsilver","soulsilver":"heartgold-soulsilver",
  "black":"black-white","white":"black-white",
  "black-2":"black-2-white-2","white-2":"black-2-white-2",
  "x":"x-y","y":"x-y",
  "omega-ruby":"omega-ruby-alpha-sapphire","alpha-sapphire":"omega-ruby-alpha-sapphire",
  "sun":"sun-moon","moon":"sun-moon",
  "ultra-sun":"ultra-sun-ultra-moon","ultra-moon":"ultra-sun-ultra-moon",
  "sword":"sword-shield","shield":"sword-shield",
  "scarlet":"scarlet-violet","violet":"scarlet-violet",
};


const TYPE_COLORS: {[key:string]:string} = {
  normal:"#A8A878",fire:"#F08030",water:"#6890F0",electric:"#F8D030",
  grass:"#78C850",ice:"#98D8D8",fighting:"#C03028",poison:"#A040A0",
  ground:"#E0C068",flying:"#A890F0",psychic:"#F85888",bug:"#A8B820",
  rock:"#B8A038",ghost:"#705898",dragon:"#7038F8",dark:"#705848",
  steel:"#B8B8D0",fairy:"#EE99AC"
};

const METHOD_COLORS: {[key:string]:{bg:string,text:string}} = {
  wild:    {bg:"#E6F1FB",text:"#185FA5"},
  fishing: {bg:"#E1F5EE",text:"#0F6E56"},
  static:  {bg:"#FAEEDA",text:"#854F0B"},
  evolve:  {bg:"#EEEDFE",text:"#534AB7"},
  gift:    {bg:"#FBEAF0",text:"#993556"},
  starter: {bg:"#EAF3DE",text:"#3B6D11"},
  event:   {bg:"#F1EFE8",text:"#5F5E5A"},
};

const POKEMON_NAMES = [
  // Gen 1 (#001–151)
  "Bulbasaur","Ivysaur","Venusaur","Charmander","Charmeleon","Charizard","Squirtle","Wartortle","Blastoise","Caterpie","Metapod","Butterfree","Weedle","Kakuna","Beedrill","Pidgey","Pidgeotto","Pidgeot","Rattata","Raticate","Spearow","Fearow","Ekans","Arbok","Pikachu","Raichu","Sandshrew","Sandslash","Nidoran♀","Nidorina","Nidoqueen","Nidoran♂","Nidorino","Nidoking","Clefairy","Clefable","Vulpix","Ninetales","Jigglypuff","Wigglytuff","Zubat","Golbat","Oddish","Gloom","Vileplume","Paras","Parasect","Venonat","Venomoth","Diglett","Dugtrio","Meowth","Persian","Psyduck","Golduck","Mankey","Primeape","Growlithe","Arcanine","Poliwag","Poliwhirl","Poliwrath","Abra","Kadabra","Alakazam","Machop","Machoke","Machamp","Bellsprout","Weepinbell","Victreebel","Tentacool","Tentacruel","Geodude","Graveler","Golem","Ponyta","Rapidash","Slowpoke","Slowbro","Magnemite","Magneton","Farfetch'd","Doduo","Dodrio","Seel","Dewgong","Grimer","Muk","Shellder","Cloyster","Gastly","Haunter","Gengar","Onix","Drowzee","Hypno","Krabby","Kingler","Voltorb","Electrode","Exeggcute","Exeggutor","Cubone","Marowak","Hitmonlee","Hitmonchan","Lickitung","Koffing","Weezing","Rhyhorn","Rhydon","Chansey","Tangela","Kangaskhan","Horsea","Seadra","Goldeen","Seaking","Staryu","Starmie","Mr. Mime","Scyther","Jynx","Electabuzz","Magmar","Pinsir","Tauros","Magikarp","Gyarados","Lapras","Ditto","Eevee","Vaporeon","Jolteon","Flareon","Porygon","Omanyte","Omastar","Kabuto","Kabutops","Aerodactyl","Snorlax","Articuno","Zapdos","Moltres","Dratini","Dragonair","Dragonite","Mewtwo","Mew",
  // Gen 2 (#152–251)
  "Chikorita","Bayleef","Meganium","Cyndaquil","Quilava","Typhlosion","Totodile","Croconaw","Feraligatr","Sentret","Furret","Hoothoot","Noctowl","Ledyba","Ledian","Spinarak","Ariados","Crobat","Chinchou","Lanturn","Pichu","Cleffa","Igglybuff","Togepi","Togetic","Natu","Xatu","Mareep","Flaaffy","Ampharos","Bellossom","Marill","Azumarill","Sudowoodo","Politoed","Hoppip","Skiploom","Jumpluff","Aipom","Sunkern","Sunflora","Yanma","Wooper","Quagsire","Espeon","Umbreon","Murkrow","Slowking","Misdreavus","Unown","Wobbuffet","Girafarig","Pineco","Forretress","Dunsparce","Gligar","Steelix","Snubbull","Granbull","Qwilfish","Scizor","Shuckle","Heracross","Sneasel","Teddiursa","Ursaring","Slugma","Magcargo","Swinub","Piloswine","Corsola","Remoraid","Octillery","Delibird","Mantine","Skarmory","Houndour","Houndoom","Kingdra","Phanpy","Donphan","Porygon2","Stantler","Smeargle","Tyrogue","Hitmontop","Smoochum","Elekid","Magby","Miltank","Blissey","Raikou","Entei","Suicune","Larvitar","Pupitar","Tyranitar","Lugia","Ho-oh","Celebi",
  // Gen 3 (#252–386)
  "Treecko","Grovyle","Sceptile","Torchic","Combusken","Blaziken","Mudkip","Marshtomp","Swampert","Poochyena","Mightyena","Zigzagoon","Linoone","Wurmple","Silcoon","Beautifly","Cascoon","Dustox","Lotad","Lombre","Ludicolo","Seedot","Nuzleaf","Shiftry","Taillow","Swellow","Wingull","Pelipper","Ralts","Kirlia","Gardevoir","Surskit","Masquerain","Shroomish","Breloom","Slakoth","Vigoroth","Slaking","Nincada","Ninjask","Shedinja","Whismur","Loudred","Exploud","Makuhita","Hariyama","Azurill","Nosepass","Skitty","Delcatty","Sableye","Mawile","Aron","Lairon","Aggron","Meditite","Medicham","Electrike","Manectric","Plusle","Minun","Volbeat","Illumise","Roselia","Gulpin","Swalot","Carvanha","Sharpedo","Wailmer","Wailord","Numel","Camerupt","Torkoal","Spoink","Grumpig","Spinda","Trapinch","Vibrava","Flygon","Cacnea","Cacturne","Swablu","Altaria","Zangoose","Seviper","Lunatone","Solrock","Barboach","Whiscash","Corphish","Crawdaunt","Baltoy","Claydol","Lileep","Cradily","Anorith","Armaldo","Feebas","Milotic","Castform","Kecleon","Shuppet","Banette","Duskull","Dusclops","Tropius","Chimecho","Absol","Wynaut","Snorunt","Glalie","Spheal","Sealeo","Walrein","Clamperl","Huntail","Gorebyss","Relicanth","Luvdisc","Bagon","Shelgon","Salamence","Beldum","Metang","Metagross","Regirock","Regice","Registeel","Latias","Latios","Kyogre","Groudon","Rayquaza","Jirachi","Deoxys",
  // Gen 4 (#387–493)
  "Turtwig","Grotle","Torterra","Chimchar","Monferno","Infernape","Piplup","Prinplup","Empoleon","Starly","Staravia","Staraptor","Bidoof","Bibarel","Kricketot","Kricketune","Shinx","Luxio","Luxray","Budew","Roserade","Cranidos","Rampardos","Shieldon","Bastiodon","Burmy","Wormadam","Mothim","Combee","Vespiquen","Pachirisu","Buizel","Floatzel","Cherubi","Cherrim","Shellos","Gastrodon","Ambipom","Drifloon","Drifblim","Buneary","Lopunny","Mismagius","Honchkrow","Glameow","Purugly","Chingling","Stunky","Skuntank","Bronzor","Bronzong","Bonsly","Mime Jr.","Happiny","Chatot","Spiritomb","Gible","Gabite","Garchomp","Munchlax","Riolu","Lucario","Hippopotas","Hippowdon","Skorupi","Drapion","Croagunk","Toxicroak","Carnivine","Finneon","Lumineon","Mantyke","Snover","Abomasnow","Weavile","Magnezone","Lickilicky","Rhyperior","Tangrowth","Electivire","Magmortar","Togekiss","Yanmega","Leafeon","Glaceon","Gliscor","Mamoswine","Porygon-Z","Gallade","Probopass","Dusknoir","Froslass","Rotom","Uxie","Mesprit","Azelf","Dialga","Palkia","Heatran","Regigigas","Giratina","Cresselia","Phione","Manaphy","Darkrai","Shaymin","Arceus",
  // Gen 5 (#494–649)
  "Victini","Snivy","Servine","Serperior","Tepig","Pignite","Emboar","Oshawott","Dewott","Samurott","Patrat","Watchog","Lillipup","Herdier","Stoutland","Purrloin","Liepard","Pansage","Simisage","Pansear","Simisear","Panpour","Simipour","Munna","Musharna","Pidove","Tranquill","Unfezant","Blitzle","Zebstrika","Roggenrola","Boldore","Gigalith","Woobat","Swoobat","Drilbur","Excadrill","Audino","Timburr","Gurdurr","Conkeldurr","Tympole","Palpitoad","Seismitoad","Throh","Sawk","Sewaddle","Swadloon","Leavanny","Venipede","Whirlipede","Scolipede","Cottonee","Whimsicott","Petilil","Lilligant","Basculin","Sandile","Krokorok","Krookodile","Darumaka","Darmanitan","Maractus","Dwebble","Crustle","Scraggy","Scrafty","Sigilyph","Yamask","Cofagrigus","Tirtouga","Carracosta","Archen","Archeops","Trubbish","Garbodor","Zorua","Zoroark","Minccino","Cinccino","Gothita","Gothorita","Gothitelle","Solosis","Duosion","Reuniclus","Ducklett","Swanna","Vanillite","Vanillish","Vanilluxe","Deerling","Sawsbuck","Emolga","Karrablast","Escavalier","Foongus","Amoonguss","Frillish","Jellicent","Alomomola","Joltik","Galvantula","Ferroseed","Ferrothorn","Klink","Klang","Klinklang","Tynamo","Eelektrik","Eelektross","Elgyem","Beheeyem","Litwick","Lampent","Chandelure","Axew","Fraxure","Haxorus","Cubchoo","Beartic","Cryogonal","Shelmet","Accelgor","Stunfisk","Mienfoo","Mienshao","Druddigon","Golett","Golurk","Pawniard","Bisharp","Bouffalant","Rufflet","Braviary","Vullaby","Mandibuzz","Heatmor","Durant","Deino","Zweilous","Hydreigon","Larvesta","Volcarona","Cobalion","Terrakion","Virizion","Tornadus","Thundurus","Reshiram","Zekrom","Landorus","Kyurem","Keldeo","Meloetta","Genesect",
  // Gen 6 (#650–721)
  "Chespin","Quilladin","Chesnaught","Fennekin","Braixen","Delphox","Froakie","Frogadier","Greninja","Bunnelby","Diggersby","Fletchling","Fletchinder","Talonflame","Scatterbug","Spewpa","Vivillon","Litleo","Pyroar","Flabébé","Floette","Florges","Skiddo","Gogoat","Pancham","Pangoro","Furfrou","Espurr","Meowstic","Honedge","Doublade","Aegislash","Spritzee","Aromatisse","Swirlix","Slurpuff","Inkay","Malamar","Binacle","Barbaracle","Skrelp","Dragalge","Clauncher","Clawitzer","Helioptile","Heliolisk","Tyrunt","Tyrantrum","Amaura","Aurorus","Sylveon","Hawlucha","Dedenne","Carbink","Goomy","Sliggoo","Goodra","Klefki","Phantump","Trevenant","Pumpkaboo","Gourgeist","Bergmite","Avalugg","Noibat","Noivern","Xerneas","Yveltal","Zygarde","Diancie","Hoopa","Volcanion",
  // Gen 7 (#722–809) — includes Meltan & Melmetal from Let's Go
  "Rowlet","Dartrix","Decidueye","Litten","Torracat","Incineroar","Popplio","Brionne","Primarina","Pikipek","Trumbeak","Toucannon","Yungoos","Gumshoos","Grubbin","Charjabug","Vikavolt","Crabrawler","Crabominable","Oricorio","Cutiefly","Ribombee","Rockruff","Lycanroc","Wishiwashi","Mareanie","Toxapex","Mudbray","Mudsdale","Dewpider","Araquanid","Fomantis","Lurantis","Morelull","Shiinotic","Salandit","Salazzle","Stufful","Bewear","Bounsweet","Steenee","Tsareena","Comfey","Oranguru","Passimian","Wimpod","Golisopod","Sandygast","Palossand","Pyukumuku","Type: Null","Silvally","Minior","Komala","Turtonator","Togedemaru","Mimikyu","Bruxish","Drampa","Dhelmise","Jangmo-o","Hakamo-o","Kommo-o","Tapu Koko","Tapu Lele","Tapu Bulu","Tapu Fini","Cosmog","Cosmoem","Solgaleo","Lunala","Nihilego","Buzzwole","Pheromosa","Xurkitree","Celesteela","Kartana","Guzzlord","Necrozma","Magearna","Marshadow","Poipole","Naganadel","Stakataka","Blacephalon","Zeraora","Meltan","Melmetal",
  // Gen 8 (#810–905) — Sword/Shield, Isle of Armor, Crown Tundra, Legends: Arceus
  "Grookey","Thwackey","Rillaboom","Scorbunny","Raboot","Cinderace","Sobble","Drizzile","Inteleon","Skwovet","Greedent","Rookidee","Corvisquire","Corviknight","Blipbug","Dottler","Orbeetle","Nickit","Thievul","Gossifleur","Eldegoss","Wooloo","Dubwool","Chewtle","Drednaw","Yamper","Boltund","Rolycoly","Carkol","Coalossal","Applin","Flapple","Appletun","Silicobra","Sandaconda","Cramorant","Arrokuda","Barraskewda","Toxel","Toxtricity","Sizzlipede","Centiskorch","Clobbopus","Grapploct","Sinistea","Polteageist","Hatenna","Hattrem","Hatterene","Impidimp","Morgrem","Grimmsnarl","Obstagoon","Perrserker","Cursola","Sirfetch'd","Mr. Rime","Runerigus","Milcery","Alcremie","Falinks","Pincurchin","Snom","Frosmoth","Stonjourner","Eiscue","Indeedee","Morpeko","Cufant","Copperajah","Dracozolt","Arctozolt","Dracovish","Arctovish","Duraludon","Dreepy","Drakloak","Dragapult","Zacian","Zamazenta","Eternatus","Kubfu","Urshifu","Zarude","Regieleki","Regidrago","Glastrier","Spectrier","Calyrex","Wyrdeer","Kleavor","Ursaluna","Basculegion","Sneasler","Overqwil","Enamorus",
  // Gen 9 (#906–1025) — Scarlet/Violet, The Teal Mask, The Indigo Disk
  "Sprigatito","Floragato","Meowscarada","Fuecoco","Crocalor","Skeledirge","Quaxly","Quaxwell","Quaquaval","Lechonk","Oinkologne","Tarountula","Spidops","Nymble","Lokix","Pawmi","Pawmo","Pawmot","Tandemaus","Maushold","Fidough","Dachsbun","Smoliv","Dolliv","Arboliva","Squawkabilly","Nacli","Naclstack","Garganacl","Charcadet","Armarouge","Ceruledge","Tadbulb","Bellibolt","Wattrel","Kilowattrel","Maschiff","Mabosstiff","Shroodle","Grafaiai","Bramblin","Brambleghast","Toedscool","Toedscruel","Klawf","Capsakid","Scovillain","Rellor","Rabsca","Flittle","Espathra","Tinkatink","Tinkatuff","Tinkaton","Wiglett","Wugtrio","Bombirdier","Finizen","Palafin","Varoom","Revavroom","Cyclizar","Orthworm","Glimmet","Glimmora","Greavard","Houndstone","Flamigo","Cetoddle","Cetitan","Veluza","Dondozo","Tatsugiri","Annihilape","Clodsire","Farigiraf","Dudunsparce","Kingambit","Great Tusk","Scream Tail","Brute Bonnet","Flutter Mane","Slither Wing","Sandy Shocks","Iron Treads","Iron Bundle","Iron Hands","Iron Jugulis","Iron Moth","Iron Thorns","Frigibax","Arctibax","Baxcalibur","Gimmighoul","Gholdengo","Wo-Chien","Chien-Pao","Ting-Lu","Chi-Yu","Roaring Moon","Iron Valiant","Koraidon","Miraidon","Walking Wake","Iron Leaves","Dipplin","Poltchageist","Sinistcha","Okidogi","Munkidori","Fezandipiti","Ogerpon","Archaludon","Hydrapple","Gouging Fire","Raging Bolt","Iron Boulder","Iron Crown","Terapagos","Pecharunt",
];

// Generation boundaries — used for filtering and progress display
const GENERATIONS: {num:number, label:string, start:number, end:number, games:{name:string,bg:string,color:string,border:string}[]}[] = [
  {num:1, label:"Gen I",   start:1,   end:151, games:[
    {name:"Red",     bg:"#3a0808", color:"#ff7070", border:"#cc2222"},
    {name:"Blue",    bg:"#08163a", color:"#70a0ff", border:"#2244cc"},
    {name:"Yellow",  bg:"#3a320a", color:"#ffe060", border:"#ccaa10"},
  ]},
  {num:2, label:"Gen II",  start:152, end:251, games:[
    {name:"Gold",    bg:"#2a2a08", color:"#d4c840", border:"#a09820"},
    {name:"Silver",  bg:"#1a1a1a", color:"#c0c0c0", border:"#888888"},
    {name:"Crystal", bg:"#0a1a2a", color:"#60c8ff", border:"#1888cc"},
  ]},
  {num:3, label:"Gen III", start:252, end:386, games:[
    {name:"Ruby",      bg:"#3a0808", color:"#ff6060", border:"#cc1111"},
    {name:"Sapphire",  bg:"#08163a", color:"#6090ff", border:"#1133cc"},
    {name:"Emerald",   bg:"#0a2a14", color:"#50d878", border:"#18882a"},
    {name:"FireRed",   bg:"#3a1008", color:"#ff8060", border:"#cc3311"},
    {name:"LeafGreen", bg:"#0a2010", color:"#60d860", border:"#118811"},
  ]},
  {num:4, label:"Gen IV", start:387, end:493, games:[
    {name:"Diamond",    bg:"#0d1a3a", color:"#88bbff", border:"#2255cc"},
    {name:"Pearl",      bg:"#2a1a2a", color:"#ffaaff", border:"#aa44aa"},
    {name:"Platinum",   bg:"#1a1a1a", color:"#dddddd", border:"#888888"},
    {name:"HeartGold",  bg:"#2a1a08", color:"#ffcc44", border:"#cc8800"},
    {name:"SoulSilver", bg:"#0a1a1a", color:"#88ddee", border:"#2299aa"},
  ]},
  {num:5, label:"Gen V", start:494, end:649, games:[
    {name:"Black",   bg:"#111111", color:"#cccccc", border:"#555555"},
    {name:"White",   bg:"#2a2a2a", color:"#ffffff", border:"#aaaaaa"},
    {name:"Black 2", bg:"#0a0a1a", color:"#aaaaff", border:"#4444cc"},
    {name:"White 2", bg:"#1a2a2a", color:"#aaffff", border:"#44aaaa"},
  ]},
  {num:6, label:"Gen VI", start:650, end:721, games:[
    {name:"X",             bg:"#0a0a2a", color:"#8888ff", border:"#3333cc"},
    {name:"Y",             bg:"#1a0a1a", color:"#ff88ff", border:"#cc33cc"},
    {name:"OmegaRuby",    bg:"#2a0808", color:"#ff6060", border:"#aa1111"},
    {name:"AlphaSapphire", bg:"#081628", color:"#60a0ff", border:"#1155cc"},
  ]},
  {num:7, label:"Gen VII", start:722, end:809, games:[
    {name:"Sun",       bg:"#2a1a00", color:"#ffcc44", border:"#cc8800"},
    {name:"Moon",      bg:"#0a0a1a", color:"#aaaaff", border:"#4444cc"},
    {name:"Ultra Sun", bg:"#3a1a00", color:"#ffaa22", border:"#dd6600"},
    {name:"Ultra Moon",bg:"#08081a", color:"#cc99ff", border:"#7722cc"},
    {name:"Let's Go",  bg:"#1a2a1a", color:"#88ee88", border:"#228822"},
  ]},
  {num:8, label:"Gen VIII", start:810, end:905, games:[
    {name:"Sword",         bg:"#08141a", color:"#44ccff", border:"#1188cc"},
    {name:"Shield",        bg:"#140814", color:"#ee44ee", border:"#aa11aa"},
    {name:"Legends Arceus",bg:"#1a1008", color:"#ffaa44", border:"#cc6600"},
  ]},
  {num:9, label:"Gen IX", start:906, end:1025, games:[
    {name:"Scarlet",     bg:"#2a0808", color:"#ff7744", border:"#cc3300"},
    {name:"Violet",      bg:"#140a28", color:"#cc88ff", border:"#7722cc"},
    {name:"Teal Mask",   bg:"#0a1a10", color:"#44ddaa", border:"#118855"},
    {name:"Indigo Disk", bg:"#0a0a1a", color:"#8888ff", border:"#3333cc"},
    {name:"Legends Z-A", bg:"#1a1410", color:"#ffdd88", border:"#cc9922"},
  ]},
];

const allPokemon = POKEMON_NAMES.map((name,i)=>({id:i+1,name,types:[] as string[],gen:GENERATIONS.find(g=>i+1>=g.start&&i+1<=g.end)?.num??1}));

const dex = {
  red:"#CC0000",darkRed:"#aa0000",screen:"#1a1a2e",screenBorder:"#333",
  screenText:"#c8d8f0",screenMuted:"#7799bb",screenDim:"#334",
  screenBg:"#0d0d1a",screenHeading:"#88aacc",
};

function spriteUrl(id:number){return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;}

function TypeBadge({type}:{type:string}){
  const c=TYPE_COLORS[type]||"#888";
  return <span style={{fontSize:10,padding:"1px 6px",borderRadius:8,background:c+"33",color:c,fontWeight:500,textTransform:"capitalize",whiteSpace:"nowrap"}}>{type}</span>;
}

function Pokeball({caught,size=28,onClick}:{caught:boolean,size?:number,onClick?:()=>void}){
  const r=size/2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} onClick={onClick} style={{cursor:"pointer",display:"block",flexShrink:0}}>
      <path d={`M1,${r} A${r-1},${r-1} 0 0,1 ${size-1},${r}`} fill={caught?"#CC0000":"transparent"} stroke={caught?"#991100":"#445"} strokeWidth={1}/>
      <path d={`M1,${r} A${r-1},${r-1} 0 0,0 ${size-1},${r}`} fill={caught?"#eeeeee":"transparent"} stroke={caught?"#cccccc":"#445"} strokeWidth={1}/>
      <circle cx={r} cy={r} r={r-1} fill="none" stroke={caught?"#333":"#445"} strokeWidth={1.5}/>
      <line x1={1} y1={r} x2={size-1} y2={r} stroke={caught?"#333":"#445"} strokeWidth={1.5}/>
      <circle cx={r} cy={r} r={r*0.3} fill={caught?"#fff":"transparent"} stroke={caught?"#333":"#445"} strokeWidth={1.5}/>
      {caught&&<circle cx={r} cy={r} r={r*0.14} fill="#aaaaaa"/>}
    </svg>
  );
}

function PokeballSpinner(){
  const [angle,setAngle]=useState(0);
  useEffect(()=>{
    const id=setInterval(()=>setAngle(a=>(a+8)%360),16);
    return()=>clearInterval(id);
  },[]);
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:"2rem 0"}}>
      <svg width={44} height={44} viewBox="0 0 44 44" style={{transform:`rotate(${angle}deg)`}}>
        <path d={`M2,22 A20,20 0 0,1 42,22`} fill="#CC0000" stroke="#991100" strokeWidth={1}/>
        <path d={`M2,22 A20,20 0 0,0 42,22`} fill="#eeeeee" stroke="#cccccc" strokeWidth={1}/>
        <circle cx={22} cy={22} r={20} fill="none" stroke="#333" strokeWidth={2}/>
        <line x1={2} y1={22} x2={42} y2={22} stroke="#333" strokeWidth={2}/>
        <circle cx={22} cy={22} r={6} fill="#fff" stroke="#333" strokeWidth={2}/>
        <circle cx={22} cy={22} r={3} fill="#aaa"/>
      </svg>
      <span style={{fontSize:12,color:dex.screenMuted,fontFamily:"monospace"}}>Loading...</span>
    </div>
  );
}

function CategoryIcon({category}:{category:string}){
  if(category==="physical") return (
    <svg width={32} height={14} viewBox="0 0 32 14">
      <rect width={32} height={14} rx={3} fill="#C03028"/>
      <text x={16} y={10} textAnchor="middle" fontSize={8} fontFamily="monospace" fill="#fff" fontWeight="bold">PHY</text>
    </svg>
  );
  if(category==="special") return (
    <svg width={32} height={14} viewBox="0 0 32 14">
      <rect width={32} height={14} rx={3} fill="#6890F0"/>
      <text x={16} y={10} textAnchor="middle" fontSize={8} fontFamily="monospace" fill="#fff" fontWeight="bold">SPC</text>
    </svg>
  );
  return (
    <svg width={32} height={14} viewBox="0 0 32 14">
      <rect width={32} height={14} rx={3} fill="#A8A878"/>
      <text x={16} y={10} textAnchor="middle" fontSize={8} fontFamily="monospace" fill="#fff" fontWeight="bold">STS</text>
    </svg>
  );
}

function StatBar({value,max,color}:{value:number|null,max:number,color:string}){
  if(value===null||value===undefined) return <span style={{fontSize:11,color:dex.screenMuted,fontFamily:"monospace"}}>—</span>;
  const pct=Math.min(100,Math.round((value/max)*100));
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,minWidth:80}}>
      <div style={{flex:1,height:5,background:dex.screenDim,borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:3,width:`${pct}%`,background:color}}/>
      </div>
      <span style={{fontSize:11,color:dex.screenText,fontFamily:"monospace",minWidth:24,textAlign:"right"}}>{value}</span>
    </div>
  );
}

function MoveTable({moves}:{moves:any[]}){
  if(!moves.length) return <p style={{color:dex.screenMuted,fontSize:12,fontFamily:"monospace"}}>No moves found for this version.</p>;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {moves.map((m,i)=>{
        const tc=TYPE_COLORS[m.type]||"#888";
        return (
          <div key={i} style={{background:dex.screenBg,border:`1px solid ${dex.screenDim}`,borderRadius:8,padding:"8px 12px"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
              {m.level!=null&&<span style={{fontSize:11,color:"#ffcc44",fontFamily:"monospace",minWidth:36}}>Lv.{m.level}</span>}
              {m.tm&&<span style={{fontSize:11,color:"#88aaff",fontFamily:"monospace",minWidth:36}}>{m.tm}</span>}
              <span style={{fontSize:13,color:dex.screenText,fontFamily:"monospace",fontWeight:500,flex:1}}>{m.name}</span>
              <span style={{fontSize:10,padding:"2px 7px",borderRadius:8,background:tc+"33",color:tc,fontWeight:500,textTransform:"capitalize"}}>{m.type}</span>
              <CategoryIcon category={m.category}/>
            </div>
            <div style={{display:"flex",gap:12,marginBottom:6,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:10,color:dex.screenMuted,fontFamily:"monospace",minWidth:28}}>PWR</span>
                <StatBar value={m.power} max={250} color="#F08030"/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:10,color:dex.screenMuted,fontFamily:"monospace",minWidth:28}}>ACC</span>
                <StatBar value={m.accuracy} max={100} color="#78C850"/>
              </div>
            </div>
            <p style={{margin:0,fontSize:11,color:dex.screenMuted,fontFamily:"monospace",lineHeight:1.5}}>{m.description}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Type Effectiveness Data ────────────────────────────────────────────────
// Values: 2=super effective, 0.5=not very effective, 0=immune, 1=normal (omitted)
// Gen 1 note: Steel/Dark/Fairy didn't exist; Ghost→Psychic was 0 (bug); Poison→Bug was 2; Ice→Fire was 0.5
const TYPES_GEN2 = ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"] as const;
const TYPES_GEN1 = ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon"] as const;
type TypeName = typeof TYPES_GEN2[number];

// Chart[attacker][defender] = multiplier (only non-1 entries listed)
const CHART_GEN2: Partial<Record<TypeName, Partial<Record<TypeName,number>>>> = {
  normal:   {rock:0.5,ghost:0,steel:0.5},
  fire:     {fire:0.5,water:0.5,grass:2,ice:2,bug:2,rock:0.5,dragon:0.5,steel:2},
  water:    {fire:2,water:0.5,grass:0.5,ground:2,rock:2,dragon:0.5},
  electric: {water:2,electric:0.5,grass:0.5,ground:0,flying:2,dragon:0.5},
  grass:    {fire:0.5,water:2,grass:0.5,poison:0.5,ground:2,flying:0.5,bug:0.5,rock:2,dragon:0.5,steel:0.5},
  ice:      {water:0.5,grass:2,ice:0.5,ground:2,flying:2,dragon:2,steel:0.5},
  fighting: {normal:2,ice:2,poison:0.5,flying:0.5,psychic:0.5,bug:0.5,rock:2,ghost:0,dark:2,steel:2,fairy:0.5},
  poison:   {grass:2,poison:0.5,ground:0.5,rock:0.5,ghost:0.5,steel:0,fairy:2},
  ground:   {fire:2,electric:2,grass:0.5,poison:2,flying:0,bug:0.5,rock:2,steel:2},
  flying:   {electric:0.5,grass:2,fighting:2,bug:2,rock:0.5,steel:0.5},
  psychic:  {fighting:2,poison:2,psychic:0.5,dark:0,steel:0.5},
  bug:      {fire:0.5,grass:2,fighting:0.5,poison:0.5,flying:0.5,psychic:2,ghost:0.5,dark:2,steel:0.5,fairy:0.5},
  rock:     {fire:2,ice:2,fighting:0.5,ground:0.5,flying:2,bug:2,steel:0.5},
  ghost:    {normal:0,psychic:2,ghost:2,dark:0.5},
  dragon:   {dragon:2,steel:0.5,fairy:0},
  dark:     {fighting:0.5,psychic:2,ghost:2,dark:0.5,fairy:0.5},
  steel:    {fire:0.5,water:0.5,electric:0.5,ice:2,rock:2,steel:0.5,fairy:2},
  fairy:    {fire:0.5,fighting:2,poison:0.5,dragon:2,dark:2,steel:0.5},
};

const CHART_GEN1: Partial<Record<TypeName, Partial<Record<TypeName,number>>>> = {
  normal:   {rock:0.5,ghost:0},
  fire:     {fire:0.5,water:0.5,grass:2,ice:2,bug:2,rock:0.5,dragon:0.5},
  water:    {fire:2,water:0.5,grass:0.5,ground:2,rock:2,dragon:0.5},
  electric: {water:2,electric:0.5,grass:0.5,ground:0,flying:2,dragon:0.5},
  grass:    {fire:0.5,water:2,grass:0.5,poison:0.5,ground:2,flying:0.5,bug:0.5,rock:2,dragon:0.5},
  ice:      {water:0.5,grass:2,ice:0.5,ground:2,flying:2,dragon:2,fire:0.5},
  fighting: {normal:2,ice:2,poison:0.5,flying:0.5,psychic:0.5,bug:0.5,rock:2,ghost:0},
  poison:   {grass:2,poison:0.5,ground:0.5,rock:0.5,ghost:0.5,bug:2},
  ground:   {fire:2,electric:2,grass:0.5,poison:2,flying:0,bug:0.5,rock:2},
  flying:   {electric:0.5,grass:2,fighting:2,bug:2,rock:0.5},
  psychic:  {fighting:2,poison:2,psychic:0.5,ghost:0},
  bug:      {fire:0.5,grass:2,fighting:0.5,poison:2,flying:0.5,psychic:2,ghost:0.5},
  rock:     {fire:2,ice:2,fighting:0.5,ground:0.5,flying:2,bug:2},
  ghost:    {normal:0,psychic:0,ghost:2},
  dragon:   {dragon:2},
};

function getMultiplier(chart: Partial<Record<TypeName,Partial<Record<TypeName,number>>>>, atk: TypeName, def: TypeName): number {
  return chart[atk]?.[def] ?? 1;
}

function cellColor(val: number): string {
  if (val === 2)   return "#2a5c1a";
  if (val === 0.5) return "#5c1a1a";
  if (val === 0)   return "#111";
  return "transparent";
}
function cellTextColor(val: number): string {
  if (val === 2)   return "#88ee66";
  if (val === 0.5) return "#ee6666";
  if (val === 0)   return "#555";
  return dex.screenDim;
}
function cellLabel(val: number): string {
  if (val === 2)   return "2×";
  if (val === 0.5) return "½";
  if (val === 0)   return "0";
  return "·";
}

// Generation rule sets for type chart:
// Gen 1:   15 types, several interactions bugged (Ghost→Psychic=0, Poison→Bug=2, Ice→Fire=0.5)
// Gen 2–5: 17 types (adds Dark & Steel), Steel resists Ghost and Dark
// Gen 6+:  18 types (adds Fairy), Steel no longer resists Ghost or Dark
// Gen 7+/8+/9+: no chart changes — same as Gen 6+
const GEN_CHART_OPTIONS = [
  {value:"gen1",   label:"Gen 1  (RBY)",          ruleSet:1},
  {value:"gen2",   label:"Gen 2–5  (GSC → B2W2)", ruleSet:2},
  {value:"gen6",   label:"Gen 6+  (XY onwards)",  ruleSet:6},
] as const;
type GenOption = typeof GEN_CHART_OPTIONS[number]["value"];

// Gen 2-5 chart: same as gen2 data above but Steel resists Ghost+Dark
const CHART_GEN2_5: Partial<Record<TypeName, Partial<Record<TypeName,number>>>> = {
  ...CHART_GEN2,
  steel: {...CHART_GEN2.steel, ghost:0.5, dark:0.5},
};

function getChart(genOpt: GenOption) {
  if (genOpt === "gen1") return {chart: CHART_GEN1, types: TYPES_GEN1 as readonly TypeName[]};
  if (genOpt === "gen2") return {chart: CHART_GEN2_5, types: TYPES_GEN2 as readonly TypeName[]};
  return {chart: CHART_GEN2, types: TYPES_GEN2 as readonly TypeName[]};
}

function TypeChart() {
  const [genOpt, setGenOpt] = useState<GenOption>("gen1");
  const [selected, setSelected] = useState<TypeName|null>(null);
  const {chart, types} = getChart(genOpt);

  return (
    <div>
      {/* Header row */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div>
          <p style={{margin:"0 0 2px",fontSize:11,color:dex.screenHeading,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.05em"}}>Type Effectiveness</p>
          <p style={{margin:0,fontSize:11,color:dex.screenMuted,fontFamily:"monospace"}}>Rows = attacking type · Columns = defending type · Click a type to highlight</p>
        </div>
        <DexSelect value={genOpt} onChange={(e:any)=>{setGenOpt(e.target.value);setSelected(null);}} style={{fontSize:11}}>
            {GEN_CHART_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </DexSelect>
      </div>

      {/* Legend */}
      <div style={{display:"flex",gap:10,marginBottom:10,flexWrap:"wrap"}}>
        {[{label:"2× super effective",bg:"#2a5c1a",color:"#88ee66"},{label:"½× not very effective",bg:"#5c1a1a",color:"#ee6666"},{label:"0× immune",bg:"#111",color:"#555"}].map(l=>(
          <div key={l.label} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:14,height:14,borderRadius:3,background:l.bg,border:`1px solid ${l.color}44`}}/>
            <span style={{fontSize:10,color:dex.screenMuted,fontFamily:"monospace"}}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Grid — scrollable horizontally, first column sticky */}
      <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch" as any,display:"flex",justifyContent:"center"}}>
        <table style={{borderCollapse:"separate",borderSpacing:0,fontSize:11,fontFamily:"monospace",minWidth:"max-content"}}>
          <thead>
            <tr>
              {/* top-left corner — sticky */}
              <td style={{
                position:"sticky",left:0,zIndex:3,
                padding:"2px 6px",color:dex.screenMuted,fontSize:10,
                textAlign:"right",verticalAlign:"bottom",minWidth:72,
                background:dex.screen,
                borderRight:`1px solid ${dex.screenDim}`,
                borderBottom:`1px solid ${dex.screenDim}`,
              }}>
                <span style={{opacity:0.5}}>ATK ↓ DEF →</span>
              </td>
              {types.map(def=>{
                const tc = TYPE_COLORS[def]||"#888";
                const isHighlighted = selected===def;
                return (
                  <td key={def} onClick={()=>setSelected(selected===def?null:def)}
                    style={{padding:"2px 3px",textAlign:"center",cursor:"pointer",
                      background:isHighlighted?tc+"22":dex.screen,
                      borderBottom:isHighlighted?`2px solid ${tc}`:`1px solid ${dex.screenDim}`}}>
                    <div style={{
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"center",
                      padding:"4px 2px",
                    }}>
                      <span style={{
                        display:"inline-block",
                        writingMode:"vertical-rl",
                        textOrientation:"mixed",
                        transform:"rotate(180deg)",
                        padding:"4px 5px",
                        borderRadius:8,
                        background:isHighlighted?tc+"44":tc+"22",
                        color:isHighlighted?tc:tc+"cc",
                        textTransform:"capitalize",
                        fontWeight:isHighlighted?700:400,
                        fontSize:11,
                        border:isHighlighted?`1px solid ${tc}`:"1px solid transparent",
                        whiteSpace:"nowrap",
                      }}>{def}</span>
                    </div>
                  </td>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {types.map(atk=>{
              const tc = TYPE_COLORS[atk]||"#888";
              const isHighlighted = selected===atk;
              return (
                <tr key={atk}>
                  {/* Row label — sticky */}
                  <td onClick={()=>setSelected(selected===atk?null:atk)}
                    style={{
                      position:"sticky",left:0,zIndex:2,
                      padding:"3px 8px 3px 2px",whiteSpace:"nowrap",cursor:"pointer",
                      background:isHighlighted?`color-mix(in srgb, ${tc} 12%, ${dex.screen})`:dex.screen,
                      borderRight:`1px solid ${dex.screenDim}`,
                    }}>
                    <span style={{
                      display:"inline-block",
                      padding:"2px 8px",
                      borderRadius:8,
                      background:isHighlighted?tc+"44":tc+"22",
                      color:isHighlighted?tc:tc+"cc",
                      textTransform:"capitalize",
                      fontWeight:isHighlighted?700:400,
                      fontSize:11,
                      border:isHighlighted?`1px solid ${tc}`:"1px solid transparent",
                    }}>{atk}</span>
                  </td>
                  {/* Cells */}
                  {types.map(def=>{
                    const val = getMultiplier(chart, atk, def);
                    const dimRow = selected && selected!==atk;
                    const dimCol = selected && selected!==def;
                    const dim = dimRow && dimCol;
                    const highlight = selected && (selected===atk||selected===def);
                    return (
                      <td key={def} style={{
                        padding:"2px",
                        textAlign:"center",
                        opacity: dim ? 0.2 : 1,
                        transition:"opacity 0.1s",
                        background: highlight ? (TYPE_COLORS[def]||"#888")+"11" : "transparent",
                      }}>
                        <div style={{
                          width:36,height:30,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          borderRadius:4,
                          background:cellColor(val),
                          border: highlight && val!==1 ? `1px solid ${cellTextColor(val)}88` : "1px solid transparent",
                          fontSize:12,
                          color:cellTextColor(val),
                          fontWeight: val!==1?700:400,
                        }}>
                          {cellLabel(val)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected type detail panel */}
      {selected && (
        <div style={{marginTop:16,background:dex.screenBg,borderRadius:8,border:`1px solid ${TYPE_COLORS[selected]||"#888"}44`,padding:"10px 14px"}}>
          <p style={{margin:"0 0 8px",fontSize:12,color:TYPE_COLORS[selected],fontFamily:"monospace",fontWeight:600,textTransform:"capitalize"}}>
            {selected} — Summary
          </p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {/* Attacking */}
            <div>
              <p style={{margin:"0 0 5px",fontSize:10,color:dex.screenHeading,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.05em"}}>Attacking</p>
              {[2,0.5,0].map(mult=>{
                const hits = types.filter(def=>getMultiplier(chart,selected,def)===mult);
                if(!hits.length) return null;
                return (
                  <div key={mult} style={{marginBottom:5}}>
                    <span style={{fontSize:9,color:cellTextColor(mult),fontFamily:"monospace"}}>
                      {mult===2?"2× (super effective)":mult===0.5?"½× (not very effective)":"0× (no effect)"}
                    </span>
                    <div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:3}}>
                      {hits.map(t=><span key={t} style={{fontSize:10,padding:"1px 5px",borderRadius:6,background:(TYPE_COLORS[t]||"#888")+"33",color:TYPE_COLORS[t]||"#888",textTransform:"capitalize"}}>{t}</span>)}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Defending */}
            <div>
              <p style={{margin:"0 0 5px",fontSize:10,color:dex.screenHeading,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.05em"}}>Defending</p>
              {[2,0.5,0].map(mult=>{
                const weak = types.filter(atk=>getMultiplier(chart,atk,selected)===mult);
                if(!weak.length) return null;
                return (
                  <div key={mult} style={{marginBottom:5}}>
                    <span style={{fontSize:9,color:cellTextColor(mult),fontFamily:"monospace"}}>
                      {mult===2?"Weak to (2×)":mult===0.5?"Resists (½×)":"Immune to (0×)"}
                    </span>
                    <div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:3}}>
                      {weak.map(t=><span key={t} style={{fontSize:10,padding:"1px 5px",borderRadius:6,background:(TYPE_COLORS[t]||"#888")+"33",color:TYPE_COLORS[t]||"#888",textTransform:"capitalize"}}>{t}</span>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Tracker grid/list with CSS-native render skipping ───────────────────────
// content-visibility: auto tells the browser to skip off-screen items entirely.
// No JS scroll tracking = no glitch, no re-renders.

// ─── Team Builder ─────────────────────────────────────────────────────────────

const EMPTY_SLOT = {pokemon:null as any, moves:["","","",""], moveTypes:["","","",""] as string[], item:"", learnableMoves:[] as string[], abilities:[] as {name:string,hidden:boolean}[], selectedAbility:""};
type TeamSlot = {pokemon:any, moves:string[], moveTypes:string[], item:string, learnableMoves:string[], abilities:{name:string,hidden:boolean}[], selectedAbility:string};
type Team = {name:string, slots:TeamSlot[]};

function newTeam(name:string):Team{
  return {name, slots:Array(6).fill(null).map(()=>({...EMPTY_SLOT,moves:["","","",""],moveTypes:["","","",""],learnableMoves:[],abilities:[],selectedAbility:""}))};
}

// Type effectiveness using Gen 6+ chart
function getTeamWeaknesses(slots:TeamSlot[], chart:any, types:readonly any[]){
  const coverage:{[t:string]:number}={};
  const weaknesses:{[t:string]:number}={};
  types.forEach(t=>{coverage[t]=0;weaknesses[t]=0;});

  slots.forEach(slot=>{
    if(!slot.pokemon?.types?.length)return;
    const defTypes:string[]=slot.pokemon.types;

    // What this Pokémon is weak/resistant to
    types.forEach(atkType=>{
      const mult=defTypes.reduce((acc,defType)=>{
        return acc*(chart[atkType]?.[defType]??1);
      },1);
      if(mult>=2) weaknesses[atkType]=(weaknesses[atkType]||0)+1;
    });
  });

  // Coverage — what types the team's Pokémon types hit super-effectively
  slots.forEach(slot=>{
    if(!slot.pokemon?.types?.length)return;
    slot.pokemon.types.forEach((atkType:string)=>{
      types.forEach(defType=>{
        const mult=chart[atkType]?.[defType]??1;
        if(mult>=2) coverage[defType]=(coverage[defType]||0)+1;
      });
    });
  });

  return{coverage,weaknesses};
}

function ItemSearch({value,onChange}:{value:string,onChange:(v:string)=>void}){
  const [query,setQuery]=useState(value);
  const [results,setResults]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  const [open,setOpen]=useState(false);
  const debounceRef=useRef<any>(null);

  const search=async(q:string)=>{
    if(q.length<2){setResults([]);return;}
    setLoading(true);
    try{
      const data=await fetchPoke(`https://pokeapi.co/api/v2/item?limit=2000`);
      const matches=data.results
        .filter((i:any)=>i.name.includes(q.toLowerCase().replace(/\s/g,"-")))
        .slice(0,10);
      const detailed=await Promise.all(matches.map(async(i:any)=>{
        try{
          const d=await fetchPoke(i.url);
          const shortDesc=d.flavor_text_entries?.find((f:any)=>f.language.name==="en")?.text?.replace(/\n|\f/g," ")||"";
          return{
            name:i.name.replace(/-/g," ").replace(/\b\w/g,(c:string)=>c.toUpperCase()),
            sprite:d.sprites?.default||null,
            desc:shortDesc,
          };
        }catch{return{name:i.name.replace(/-/g," ").replace(/\b\w/g,(c:string)=>c.toUpperCase()),sprite:null,desc:""};}
      }));
      setResults(detailed);
    }catch{}
    setLoading(false);
  };

  useEffect(()=>{
    clearTimeout(debounceRef.current);
    debounceRef.current=setTimeout(()=>search(query),400);
  },[query]);

  useEffect(()=>{setQuery(value);},[value]);

  return (
    <div style={{position:"relative"}}>
      <DexInput value={query}
        onChange={(e:any)=>{setQuery(e.target.value);setOpen(true);if(!e.target.value)onChange("");}}
        onKeyDown={(e:any)=>{if(e.key==="Escape"){setOpen(false);setQuery(value||"");}}}
        placeholder="Held item..." style={{fontSize:11}}/>
      {open&&query.length>=2&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:200,background:dex.screen,border:`1px solid ${dex.screenDim}`,borderRadius:6,maxHeight:220,overflowY:"auto",boxShadow:"0 4px 12px rgba(0,0,0,0.5)"}}>
          {loading&&<p style={{margin:0,padding:"8px 10px",fontSize:11,color:dex.screenMuted,fontFamily:"monospace"}}>Searching...</p>}
          {!loading&&results.length===0&&<p style={{margin:0,padding:"8px 10px",fontSize:11,color:dex.screenMuted,fontFamily:"monospace"}}>No items found</p>}
          {results.map((r,i)=>(
            <div key={i} onClick={()=>{onChange(r.name);setQuery(r.name);setOpen(false);}}
              style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",cursor:"pointer",borderBottom:`1px solid ${dex.screenDim}`}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=dex.screenBg}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
              {r.sprite
                ?<img src={r.sprite} alt={r.name} width={24} height={24} style={{imageRendering:"pixelated",flexShrink:0}}/>
                :<div style={{width:24,height:24,background:dex.screenDim,borderRadius:4,flexShrink:0}}/>
              }
              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:0,fontSize:11,color:dex.screenText,fontFamily:"monospace"}}>{r.name}</p>
                {r.desc&&<p style={{margin:0,fontSize:9,color:dex.screenMuted,fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.desc}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PokemonSearch({value,onChange}:{value:any,onChange:(v:any)=>void}){
  const [query,setQuery]=useState(value?.name||"");
  const [open,setOpen]=useState(false);

  // Sync query whenever value changes (slot switch, team switch, or clear)
  useEffect(()=>{
    setQuery(value?.name||"");
  },[value?.id]);

  const results=query.length>=1
    ?allPokemon.filter(p=>
        p.name.toLowerCase().startsWith(query.toLowerCase())||
        String(p.id).startsWith(query)
      ).slice(0,10)
    :[];

  return (
    <div style={{position:"relative"}}>
      <DexInput value={query}
        onChange={(e:any)=>{setQuery(e.target.value);setOpen(true);if(!e.target.value){onChange(null);}}}
        onKeyDown={(e:any)=>{if(e.key==="Escape"){setOpen(false);setQuery(value?.name||"");}}}
        placeholder="Search Pokémon..." style={{fontSize:11,fontWeight:500}}/>
      {open&&results.length>0&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:100,background:dex.screen,border:`1px solid ${dex.screenDim}`,borderRadius:6,maxHeight:200,overflowY:"auto",boxShadow:"0 4px 12px rgba(0,0,0,0.5)"}}>
          {results.map((p,i)=>(
            <div key={i} onClick={()=>{onChange(p);setQuery(p.name);setOpen(false);}}
              style={{display:"flex",alignItems:"center",gap:8,padding:"4px 10px",fontSize:11,color:dex.screenText,fontFamily:"monospace",cursor:"pointer",borderBottom:`1px solid ${dex.screenDim}`}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=dex.screenBg}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
              <img src={spriteUrl(p.id)} alt={p.name} width={28} height={28} style={{imageRendering:"pixelated"}}/>
              <span style={{color:dex.screenMuted,fontSize:10}}>#{String(p.id).padStart(3,"0")}</span>
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MoveSearch({value,onChange,placeholder,learnableMoves}:{value:string,onChange:(name:string,type:string)=>void,placeholder:string,learnableMoves?:string[]}){
  const [query,setQuery]=useState(value);
  const [results,setResults]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  const [open,setOpen]=useState(false);
  const debounceRef=useRef<any>(null);

  const search=async(q:string)=>{
    if(q.length<2){setResults([]);return;}
    setLoading(true);
    try{
      // If we have a learnable moves list, filter to those only
      let candidates:string[];
      if(learnableMoves&&learnableMoves.length>0){
        candidates=learnableMoves.filter(m=>m.toLowerCase().includes(q.toLowerCase()));
      } else {
        const data=await fetchPoke(`https://pokeapi.co/api/v2/move?limit=2000`);
        candidates=data.results
          .filter((m:any)=>m.name.includes(q.toLowerCase().replace(/\s/g,"-")))
          .map((m:any)=>m.name.replace(/-/g," ").replace(/\b\w/g,(c:string)=>c.toUpperCase()));
      }
      const top=candidates.slice(0,8);
      // Fetch type+category for each
      const detailed=await Promise.all(top.map(async(name:string)=>{
        const rawName=name.toLowerCase().replace(/\s/g,"-");
        try{
          const d=await fetchPoke(`https://pokeapi.co/api/v2/move/${rawName}`);
          return{name,type:d.type?.name||"normal",category:d.damage_class?.name||"status"};
        }catch{return{name,type:"normal",category:"status"};}
      }));
      setResults(detailed);
    }catch{}
    setLoading(false);
  };

  useEffect(()=>{
    clearTimeout(debounceRef.current);
    debounceRef.current=setTimeout(()=>search(query),350);
  },[query,learnableMoves]);

  useEffect(()=>{setQuery(value);},[value]);

  return (
    <div style={{position:"relative"}}>
      <DexInput value={query}
        onChange={(e:any)=>{setQuery(e.target.value);setOpen(true);if(!e.target.value)onChange("","");}}
        onKeyDown={(e:any)=>{if(e.key==="Escape"){setOpen(false);setQuery(value);}}}
        placeholder={placeholder} style={{fontSize:10}}/>
      {open&&query.length>=2&&(
        <div style={{position:"absolute",top:"calc(100% + 2px)",left:0,right:0,zIndex:200,background:dex.screen,border:`1px solid ${dex.screenDim}`,borderRadius:6,maxHeight:220,overflowY:"auto",boxShadow:"0 4px 16px rgba(0,0,0,0.6)"}}>
          {learnableMoves&&learnableMoves.length>0&&(
            <div style={{padding:"4px 10px",borderBottom:`1px solid ${dex.screenDim}`,background:dex.screenBg}}>
              <span style={{fontSize:9,color:dex.screenMuted,fontFamily:"monospace"}}>Learnable moves only</span>
            </div>
          )}
          {loading&&<p style={{margin:0,padding:"8px 10px",fontSize:10,color:dex.screenMuted,fontFamily:"monospace"}}>Searching...</p>}
          {!loading&&results.length===0&&<p style={{margin:0,padding:"8px 10px",fontSize:10,color:dex.screenMuted,fontFamily:"monospace"}}>No moves found</p>}
          {results.map((r,i)=>{
            const tc=TYPE_COLORS[r.type]||"#888";
            const catLabel=r.category==="physical"?"PHY":r.category==="special"?"SPC":"STS";
            const catColor=r.category==="physical"?"#C03028":r.category==="special"?"#6890F0":"#A8A878";
            return (
              <div key={i} onClick={()=>{onChange(r.name,r.type);setQuery(r.name);setOpen(false);}}
                style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",cursor:"pointer",borderBottom:i<results.length-1?`1px solid ${dex.screenDim}22`:"none"}}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=dex.screenBg}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
                <span style={{flex:1,fontSize:11,color:dex.screenText,fontFamily:"monospace"}}>{r.name}</span>
                <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:tc+"33",color:tc,textTransform:"capitalize",whiteSpace:"nowrap"}}>{r.type}</span>
                <span style={{fontSize:9,padding:"2px 5px",borderRadius:4,background:catColor+"22",color:catColor,fontWeight:700,whiteSpace:"nowrap"}}>{catLabel}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TeamSlotCard({slot,index,onUpdate,evalMode,versionGroup}:{slot:TeamSlot,index:number,onUpdate:(s:TeamSlot)=>void,evalMode:boolean,versionGroup:string}){
  const tc=TYPE_COLORS[slot.pokemon?.types?.[0]]||"#555";
  const [fetchingTypes,setFetchingTypes]=useState(false);

  const handlePokemonSelect=async(p:any)=>{
    if(!p){onUpdate({...slot,pokemon:null,moves:["","","",""],moveTypes:["","","",""],item:"",learnableMoves:[],abilities:[],selectedAbility:""});return;}
    onUpdate({...slot,pokemon:{...p,types:[]},moves:["","","",""],moveTypes:["","","",""],learnableMoves:[],abilities:[],selectedAbility:"",item:""});
    setFetchingTypes(true);
    try{
      const data=await fetchPoke(`https://pokeapi.co/api/v2/pokemon/${p.id}`);
      const types=data.types.map((t:any)=>t.type.name);

      // Filter moves by version group if one is selected
      const filteredMoves=versionGroup==="__none__"
        ?data.moves
        :data.moves.filter((m:any)=>m.version_group_details.some((v:any)=>v.version_group.name===versionGroup));

      const learnableMoves:string[]=filteredMoves.map((m:any)=>
        m.move.name.replace(/-/g," ").replace(/\b\w/g,(c:string)=>c.toUpperCase())
      ).sort();

      const abilities:{name:string,hidden:boolean}[]=data.abilities.map((a:any)=>({
        name:a.ability.name.replace(/-/g," ").replace(/\b\w/g,(c:string)=>c.toUpperCase()),
        hidden:a.is_hidden,
      }));
      const selectedAbility=abilities.find(a=>!a.hidden)?.name||abilities[0]?.name||"";
      onUpdate({...slot,pokemon:{...p,types},moves:["","","",""],moveTypes:["","","",""],learnableMoves,abilities,selectedAbility,item:""});
    }catch(e){console.error(e);}
    setFetchingTypes(false);
  };

  return (
    <div style={{background:dex.screenBg,border:`1px solid ${slot.pokemon?tc+"44":dex.screenDim}`,borderRadius:8,padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>
      {/* Slot header */}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:52,height:52,background:slot.pokemon?tc+"22":dex.screenDim+"44",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:`1px solid ${slot.pokemon?tc+"44":dex.screenDim}`}}>
          {slot.pokemon
            ?<img src={spriteUrl(slot.pokemon.id)} alt={slot.pokemon.name} width={48} height={48} style={{imageRendering:"pixelated"}}/>
            :<span style={{fontSize:20,color:dex.screenDim}}>?</span>
          }
        </div>
        <div style={{flex:1,minWidth:0}}>
          <p style={{margin:"0 0 4px",fontSize:10,color:dex.screenMuted,fontFamily:"monospace"}}>SLOT {index+1}</p>
          <PokemonSearch value={slot.pokemon} onChange={handlePokemonSelect}/>
          {fetchingTypes&&<span style={{fontSize:9,color:dex.screenMuted,fontFamily:"monospace"}}>Loading...</span>}
          {slot.pokemon?.types?.length>0&&!fetchingTypes&&(
            <div style={{display:"flex",gap:3,marginTop:4,flexWrap:"wrap"}}>
              {slot.pokemon.types.map((t:string)=><TypeBadge key={t} type={t}/>)}
            </div>
          )}
        </div>
        {slot.pokemon&&(
          <button onClick={()=>onUpdate({...slot,pokemon:null,moves:["","","",""],item:"",learnableMoves:[],abilities:[],selectedAbility:""})}
            style={{background:"none",border:"none",color:dex.screenMuted,fontSize:16,cursor:"pointer",padding:0,lineHeight:1,flexShrink:0}}>✕</button>
        )}
      </div>
      {/* Ability selector */}
      {slot.abilities?.length>0&&(
        <DexSelect value={slot.selectedAbility} onChange={(e:any)=>onUpdate({...slot,selectedAbility:e.target.value})} style={{fontSize:11}}>
          {slot.abilities.map((a,i)=>(
            <option key={i} value={a.name}>{a.name}{a.hidden?" (Hidden)":""}</option>
          ))}
        </DexSelect>
      )}
      {/* Moves + item — hidden in basic mode */}
      {!evalMode&&(
        <>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {slot.moves.map((m,i)=>(
              <MoveSearch key={i} value={m}
                learnableMoves={slot.learnableMoves}
                onChange={(name,type)=>{
                  const moves=[...slot.moves];
                  const moveTypes=[...(slot.moveTypes||["","","",""])];
                  moves[i]=name;
                  moveTypes[i]=type;
                  onUpdate({...slot,moves,moveTypes});
                }}
                placeholder={`Move ${i+1}`}/>
            ))}
          </div>
          <ItemSearch value={slot.item} onChange={v=>onUpdate({...slot,item:v})}/>
        </>
      )}
    </div>
  );
}

function TeamAnalysis({slots,basicMode}:{slots:TeamSlot[],basicMode:boolean}){
  const {chart,types}=getChart("gen6");
  const [perspective,setPerspective]=useState<"defending"|"attacking">("defending");
  const filledSlots=slots.filter(s=>s.pokemon);
  if(!filledSlots.length) return (
    <p style={{color:dex.screenMuted,fontSize:12,fontFamily:"monospace",textAlign:"center",padding:"1rem 0"}}>Add Pokémon to see type analysis.</p>
  );

  // DEFENDING: how much does [rowType] deal TO each slot's pokemon
  const getDefMult=(slot:TeamSlot, atkType:string):number=>{
    if(!slot.pokemon?.types?.length)return 1;
    return slot.pokemon.types.reduce((acc:number,defType:string)=>acc*(chart[atkType]?.[defType]??1),1);
  };

  // ATTACKING: best multiplier this slot can deal to [defType]
  // In advanced mode: use actual move types if available, fall back to pokemon types
  // In basic mode: use pokemon types only
  const getAtkMult=(slot:TeamSlot, defType:string):number=>{
    if(!slot.pokemon?.types?.length)return 1;
    const pokemonTypeMults=slot.pokemon.types.map((atkType:string)=>chart[atkType]?.[defType]??1);
    if(!basicMode&&slot.moveTypes?.some((t:string)=>t)){
      // Use move types for any filled move slots
      const moveMults=slot.moveTypes
        .filter((t:string)=>t)
        .map((t:string)=>chart[t]?.[defType]??1);
      return Math.max(...pokemonTypeMults,...moveMults);
    }
    return Math.max(...pokemonTypeMults);
  };

  const slotHitsSE=(slot:TeamSlot, defType:string):boolean=>getAtkMult(slot,defType)>=2;

  const multColor=(mult:number)=>{
    if(mult===0)   return{bg:"#111111",text:"#444444",label:"0"};
    if(mult===0.25)return{bg:"#1a0a0a",text:"#aa4444",label:"¼"};
    if(mult===0.5) return{bg:"#2a1010",text:"#cc6666",label:"½"};
    if(mult===2)   return{bg:"#0a2a0a",text:"#66cc66",label:"2×"};
    if(mult===4)   return{bg:"#0a3a0a",text:"#88ee88",label:"4×"};
    return{bg:"transparent",text:dex.screenDim,label:"·"};
  };

  const isDefending=perspective==="defending";

  return (
    <div style={{background:dex.screenBg,border:`1px solid ${dex.screenDim}`,borderRadius:8,overflow:"hidden"}}>
      {/* Header with toggle */}
      <div style={{padding:"8px 12px",borderBottom:`1px solid ${dex.screenDim}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
        <div>
          <span style={{fontSize:10,color:dex.screenHeading,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.05em"}}>Type Matchups</span>
          <span style={{fontSize:10,color:dex.screenMuted,fontFamily:"monospace",marginLeft:8}}>
            {isDefending?"— how each type hits your team":"— how your team hits each type"}
          </span>
        </div>
        <div style={{display:"flex",border:`1px solid ${dex.screenDim}`,borderRadius:6,overflow:"hidden",flexShrink:0}}>
          {(["defending","attacking"] as const).map(p=>(
            <button key={p} onClick={()=>setPerspective(p)}
              style={{padding:"3px 10px",fontSize:10,fontFamily:"monospace",border:"none",cursor:"pointer",background:perspective===p?dex.red+"33":"transparent",color:perspective===p?"#ff8888":dex.screenMuted,borderRight:p==="defending"?`1px solid ${dex.screenDim}`:"none",textTransform:"capitalize"}}>
              {p==="defending"?"Defending":"Attacking"}
            </button>
          ))}
        </div>
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{borderCollapse:"separate",borderSpacing:0,width:"100%",minWidth:"max-content"}}>
          <thead>
            <tr>
              <th style={{position:"sticky",left:0,zIndex:3,padding:"6px 10px",fontSize:10,color:dex.screenMuted,fontFamily:"monospace",textAlign:"left",borderBottom:`1px solid ${dex.screenDim}`,whiteSpace:"nowrap",background:dex.screenBg}}>
                {isDefending?"Attacking type":"Defending type"}
              </th>
              {slots.map((slot,i)=>(
                <th key={i} style={{padding:"4px 8px",borderBottom:`1px solid ${dex.screenDim}`,textAlign:"center",minWidth:52}}>
                  {slot.pokemon?(
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                      <img src={spriteUrl(slot.pokemon.id)} alt={slot.pokemon.name} width={32} height={32} style={{imageRendering:"pixelated"}}/>
                      <span style={{fontSize:9,color:dex.screenMuted,fontFamily:"monospace",whiteSpace:"nowrap",maxWidth:52,overflow:"hidden",textOverflow:"ellipsis"}}>{slot.pokemon.name}</span>
                    </div>
                  ):(
                    <span style={{fontSize:10,color:dex.screenDim,fontFamily:"monospace"}}>—</span>
                  )}
                </th>
              ))}
              <th style={{padding:"6px 8px",borderBottom:`1px solid ${dex.screenDim}`,fontSize:10,color:dex.screenMuted,fontFamily:"monospace",textAlign:"center",borderLeft:`1px solid ${dex.screenDim}`}}>
                {isDefending?"Weak":"Covers"}
              </th>
            </tr>
          </thead>
          <tbody>
            {types.map((rowType,ri)=>{
              const rowBg=ri%2===0?"transparent":"rgba(255,255,255,0.02)";
              const tc=TYPE_COLORS[rowType]||"#888";

              // Summary count for last column
              const summaryCount=isDefending
                ?slots.filter(s=>s.pokemon&&getDefMult(s,rowType)>=2).length
                :slots.filter(s=>getAtkMult(s,rowType)>=2).length;
              const summaryColor=isDefending
                ?(summaryCount>=3?"#ff4444":summaryCount>=2?"#ffaa44":"#ffcc44")
                :"#66cc66";

              return (
                <tr key={rowType} style={{background:rowBg}}>
                  <td style={{position:"sticky",left:0,zIndex:2,padding:"4px 10px",borderBottom:`1px solid ${dex.screenDim}22`,background:ri%2===0?dex.screenBg:"#0f0f1f"}}>
                    <span style={{fontSize:10,padding:"1px 7px",borderRadius:6,background:tc+"22",color:tc,fontWeight:500,textTransform:"capitalize",whiteSpace:"nowrap"}}>{rowType}</span>
                  </td>
                  {slots.map((slot,si)=>{
                    const mult=slot.pokemon
                      ?(isDefending?getDefMult(slot,rowType):getAtkMult(slot,rowType))
                      :null;
                    const mc=mult!==null?multColor(mult):{bg:"transparent",text:dex.screenDim,label:""};
                    return (
                      <td key={si} style={{padding:"3px 4px",textAlign:"center",borderBottom:`1px solid ${dex.screenDim}22`}}>
                        {mult!==null?(
                          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:36,height:22,borderRadius:4,background:mc.bg,fontSize:10,fontWeight:600,color:mc.text,fontFamily:"monospace"}}>
                            {mc.label}
                          </div>
                        ):(
                          <div style={{width:36,height:22,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
                            <span style={{color:dex.screenDim,fontSize:10}}>—</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td style={{padding:"3px 8px",textAlign:"center",borderBottom:`1px solid ${dex.screenDim}22`,borderLeft:`1px solid ${dex.screenDim}`}}>
                    {summaryCount>0?(
                      <span style={{fontSize:11,fontFamily:"monospace",fontWeight:700,color:summaryColor}}>{summaryCount}</span>
                    ):(
                      <span style={{fontSize:10,color:dex.screenDim}}>·</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <div style={{padding:"8px 12px",borderTop:`1px solid ${dex.screenDim}`,display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
        {[{label:"4×",bg:"#0a3a0a",text:"#88ee88",desc:"quad"},{label:"2×",bg:"#0a2a0a",text:"#66cc66",desc:"super"},{label:"½",bg:"#2a1010",text:"#cc6666",desc:"resists"},{label:"0",bg:"#111",text:"#444",desc:"immune"}].map(l=>(
          <div key={l.label} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:24,height:16,borderRadius:3,background:l.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontFamily:"monospace",color:l.text,fontWeight:700}}>{l.label}</div>
            <span style={{fontSize:9,color:dex.screenMuted,fontFamily:"monospace"}}>{l.desc}</span>
          </div>
        ))}
        <span style={{fontSize:9,color:dex.screenMuted,fontFamily:"monospace",marginLeft:"auto"}}>
          {isDefending?"Last col = # of your team weak to that type":"Last col = # of your team that hit that type super-effectively"}
        </span>
      </div>
    </div>
  );
}

function TeamBuilder({username}:{username:string}){
  const [teams,setTeams]=useState<Team[]>([]);
  const [activeTeamIdx,setActiveTeamIdx]=useState(0);
  const [newTeamName,setNewTeamName]=useState("");
  const [showNewTeam,setShowNewTeam]=useState(false);
  const [evalMode,setEvalMode]=useState(false);
  const [versionGroup,setVersionGroup]=useState("__none__");
  const basicMode=evalMode;
  const storageKey=`teams:${username.toLowerCase()}`;

  // Load teams from localStorage directly (never shared win.storage — teams are device-local)
  useEffect(()=>{
    try{
      const v=localStorage.getItem(storageKey);
      if(v){const t=JSON.parse(v);setTeams(t);setActiveTeamIdx(0);}
      else{setTeams([newTeam("My Team")]);}
    }catch{setTeams([newTeam("My Team")]);}
  },[storageKey]);

  const saveTeams=(updated:Team[])=>{
    try{localStorage.setItem(storageKey,JSON.stringify(updated));}catch{}
  };

  const updateSlot=(teamIdx:number,slotIdx:number,slot:TeamSlot)=>{
    const updated=teams.map((t,i)=>i!==teamIdx?t:{...t,slots:t.slots.map((s,j)=>j!==slotIdx?s:slot)});
    setTeams(updated);
    saveTeams(updated);
  };

  const addTeam=()=>{
    const name=newTeamName.trim()||`Team ${teams.length+1}`;
    const updated=[...teams,newTeam(name)];
    setTeams(updated);
    setActiveTeamIdx(updated.length-1);
    setNewTeamName("");
    setShowNewTeam(false);
    saveTeams(updated);
  };

  const deleteTeam=(idx:number)=>{
    if(teams.length===1)return;
    const updated=teams.filter((_,i)=>i!==idx);
    setTeams(updated);
    setActiveTeamIdx(Math.min(activeTeamIdx,updated.length-1));
    saveTeams(updated);
  };

  const activeTeam=teams[activeTeamIdx];
  if(!activeTeam)return null;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {/* Team selector row */}
      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
        <DexSelect value={activeTeamIdx} onChange={(e:any)=>setActiveTeamIdx(Number(e.target.value))} style={{flex:1,minWidth:120,fontSize:12}}>
          {teams.map((t,i)=>(
            <option key={i} value={i}>{t.name}</option>
          ))}
        </DexSelect>
        {showNewTeam?(
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            <DexInput value={newTeamName} onChange={(e:any)=>setNewTeamName(e.target.value)}
              onKeyDown={(e:any)=>{if(e.key==="Enter")addTeam();if(e.key==="Escape")setShowNewTeam(false);}}
              placeholder="Team name..." style={{fontSize:11,width:120}}/>
            <DexButton onClick={addTeam} style={{fontSize:10,padding:"3px 8px"}}>Add</DexButton>
            <DexButton onClick={()=>setShowNewTeam(false)} style={{fontSize:10,padding:"3px 8px"}}>✕</DexButton>
          </div>
        ):(
          <DexButton onClick={()=>setShowNewTeam(true)} style={{fontSize:11,padding:"4px 10px"}}>+ New</DexButton>
        )}
        {teams.length>1&&(
          <DexButton onClick={()=>deleteTeam(activeTeamIdx)} style={{fontSize:11,padding:"4px 10px",borderColor:"#553333",color:"#ee6666"}}>Delete</DexButton>
        )}
        {/* Basic / Advanced toggle */}
        <button onClick={()=>setEvalMode(v=>!v)}
          style={{background:basicMode?"transparent":dex.red+"33",border:`1px solid ${basicMode?dex.screenDim:dex.red}`,borderRadius:6,color:basicMode?dex.screenMuted:"#ff8888",fontSize:11,padding:"4px 10px",cursor:"pointer",fontFamily:"monospace",whiteSpace:"nowrap"}}>
          {basicMode?"Basic":"Advanced"}
        </button>
      </div>

      {/* Generation filter */}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:10,color:dex.screenMuted,fontFamily:"monospace",whiteSpace:"nowrap"}}>Game version:</span>
        <DexSelect value={versionGroup} onChange={(e:any)=>setVersionGroup(e.target.value)} style={{flex:1,fontSize:11}}>
          <option value="__none__">All generations (no filter)</option>
          {Object.entries(VERSION_GROUPS).map(([key,vg])=>(
            <option key={key} value={key}>{vg.label}</option>
          ))}
        </DexSelect>
      </div>

      {versionGroup!=="__none__"&&(
        <p style={{margin:0,fontSize:10,color:dex.screenMuted,fontFamily:"monospace"}}>
          Move search filtered to {VERSION_GROUPS[versionGroup]?.label} learnsets. Re-select a Pokémon to refresh its moves.
        </p>
      )}

      {basicMode&&(
        <p style={{margin:0,fontSize:10,color:dex.screenMuted,fontFamily:"monospace",lineHeight:1.5}}>
          Basic mode — Pokémon slots only. Switch to Advanced to add moves and held items.
        </p>
      )}

      {/* Slots grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:8}}>
        {activeTeam.slots.map((slot,i)=>(
          <TeamSlotCard key={i} slot={slot} index={i} evalMode={basicMode} versionGroup={versionGroup} onUpdate={s=>updateSlot(activeTeamIdx,i,s)}/>
        ))}
      </div>

      {/* Analysis */}
      <TeamAnalysis slots={activeTeam.slots} basicMode={basicMode}/>
    </div>
  );
}

// ─── Item Finder ─────────────────────────────────────────────────────────────

const METHOD_STYLE:{[k:string]:{label:string,color:string,bg:string}}={
  buy:    {label:"Buy",    color:"#ffcc44", bg:"#2a2200"},
  find:   {label:"Find",   color:"#66cc88", bg:"#0a2a14"},
  gift:   {label:"Gift",   color:"#88aaff", bg:"#0a1430"},
  tm:     {label:"TM",     color:"#ff88cc", bg:"#2a0820"},
  hm:     {label:"HM",     color:"#cc88ff", bg:"#1a0830"},
  reward: {label:"Reward", color:"#ffaa44", bg:"#2a1400"},
  craft:  {label:"Craft",  color:"#aabb88", bg:"#182008"},
};

function ItemSprite({rawName,name,size=24}:{rawName:string,name:string,size?:number}){
  const [src,setSrc]=useState(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${rawName}.png`);
  const [failed,setFailed]=useState(false);
  const attempt=useRef(0);
  const tryNext=()=>{
    attempt.current+=1;
    if(attempt.current===1&&(rawName.startsWith("tm")||rawName.startsWith("hm"))){
      setSrc(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/tm-normal.png`);
      return;
    }
    setFailed(true);
  };
  if(failed) return <div style={{width:size,height:size,background:dex.screenDim,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,color:dex.screenMuted}}>?</span></div>;
  return <img src={src} alt={name} width={size} height={size} style={{imageRendering:"pixelated",flexShrink:0}} onError={tryNext}/>;
}

function ItemDetailPanel({item,onClose}:{item:{name:string,rawName:string,moveName?:string},onClose:()=>void}){
  const [detail,setDetail]=useState<any>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    setLoading(true);
    setDetail(null);
    fetchPoke(item.rawName?`https://pokeapi.co/api/v2/item/${item.rawName}`:`https://pokeapi.co/api/v2/item/${item.name.toLowerCase().replace(/\s/g,"-")}`)
      .then(d=>setDetail(d)).catch(console.error)
      .finally(()=>setLoading(false));
  },[item.rawName]);

  const desc=detail?.flavor_text_entries?.find((f:any)=>f.language.name==="en")?.text?.replace(/\n|\f/g," ")||"";
  const effect=detail?.effect_entries?.find((e:any)=>e.language.name==="en")?.short_effect||"";
  const sprite=detail?.sprites?.default||null;
  const heldBy=detail?.held_by_pokemon||[];
  const acquisition=ITEM_ACQUISITION[item.rawName]||[];

  return (
    <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,background:"rgba(0,0,0,0.75)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:"min(580px,95vw)",maxHeight:"90vh",borderRadius:16,border:`3px solid ${dex.red}`,background:dex.red,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{background:dex.red,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <DexLights/>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#fff",fontSize:18,cursor:"pointer",lineHeight:1}}>✕</button>
        </div>
        <div style={{background:dex.screen,margin:"0 12px",borderRadius:8,border:`4px solid ${dex.screenBorder}`,display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
          {/* Header */}
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${dex.screenDim}`,flexShrink:0,display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:56,height:56,background:"#1a1a2a",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${dex.screenDim}`,flexShrink:0}}>
              {sprite?<img src={sprite} alt={item.name} width={40} height={40} style={{imageRendering:"pixelated"}}/>:<ItemSprite rawName={item.rawName} name={item.name} size={40}/>}
            </div>
            <div style={{flex:1}}>
              <h2 style={{margin:"0 0 2px",fontSize:17,fontWeight:500,color:"#e8e8ff",fontFamily:"monospace"}}>{item.name}</h2>
              {item.moveName&&<p style={{margin:"0 0 4px",fontSize:12,color:"#88aaff",fontFamily:"monospace"}}>{item.moveName}</p>}
              {desc&&<p style={{margin:0,fontSize:11,color:dex.screenMuted,fontFamily:"monospace",lineHeight:1.5}}>{desc}</p>}
            </div>
          </div>
          {/* Content */}
          <div style={{overflowY:"auto",flex:1,padding:"12px 14px",display:"flex",flexDirection:"column",gap:12}}>
            {/* How to Obtain */}
            <div style={{background:dex.screenBg,borderRadius:8,padding:"10px 12px",border:`1px solid ${dex.screenDim}`}}>
              <p style={{margin:"0 0 10px",fontSize:10,color:dex.screenHeading,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.05em"}}>How to Obtain</p>
              {acquisition.length>0?(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {acquisition.map((a:AcquisitionEntry,i:number)=>{
                    const ms=METHOD_STYLE[a.method]||{label:a.method,color:"#aaa",bg:"#222"};
                    return (
                      <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                        <span style={{fontSize:10,padding:"2px 7px",borderRadius:5,background:ms.bg,color:ms.color,fontFamily:"monospace",fontWeight:700,whiteSpace:"nowrap",flexShrink:0,marginTop:1}}>{ms.label}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{margin:0,fontSize:12,color:dex.screenText,fontFamily:"monospace"}}>{a.location}</p>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:3,alignItems:"center"}}>
                            {a.price&&<span style={{fontSize:10,color:"#ffcc44",fontFamily:"monospace"}}>₽{a.price.toLocaleString()}</span>}
                            {a.games.map((g,j)=><span key={j} style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:dex.screenDim,color:dex.screenMuted,fontFamily:"monospace"}}>{g}</span>)}
                          </div>
                          {a.notes&&<p style={{margin:"3px 0 0",fontSize:10,color:dex.screenMuted,fontFamily:"monospace",lineHeight:1.4,fontStyle:"italic"}}>{a.notes}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ):(
                <p style={{margin:0,fontSize:12,color:dex.screenMuted,fontFamily:"monospace",lineHeight:1.5}}>
                  Acquisition data not yet added for this item.
                </p>
              )}
            </div>
            {/* Effect */}
            {!loading&&effect&&(
              <div style={{background:dex.screenBg,borderRadius:8,padding:"10px 12px",border:`1px solid ${dex.screenDim}`}}>
                <p style={{margin:"0 0 6px",fontSize:10,color:dex.screenHeading,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.05em"}}>Effect</p>
                <p style={{margin:0,fontSize:12,color:dex.screenText,fontFamily:"monospace",lineHeight:1.5}}>{effect}</p>
              </div>
            )}
            {/* Held by wild Pokémon */}
            {!loading&&heldBy.length>0&&(
              <div style={{background:dex.screenBg,borderRadius:8,padding:"10px 12px",border:`1px solid ${dex.screenDim}`}}>
                <p style={{margin:"0 0 8px",fontSize:10,color:dex.screenHeading,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.05em"}}>Held by wild Pokémon</p>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {heldBy.map((h:any,i:number)=>{
                    const rates=h.version_details.map((v:any)=>`${v.version.name.replace(/-/g," ")} ${v.rarity}%`).join(" · ");
                    const pokeId=h.pokemon.url.split("/").filter(Boolean).pop();
                    return (
                      <div key={i} style={{display:"flex",alignItems:"center",gap:8,borderRadius:6,padding:"6px 10px",border:`0.5px solid ${dex.screenDim}`}}>
                        <img src={spriteUrl(Number(pokeId))} alt={h.pokemon.name} width={32} height={32} style={{imageRendering:"pixelated",flexShrink:0}}/>
                        <span style={{flex:1,fontSize:12,color:dex.screenText,fontFamily:"monospace",textTransform:"capitalize"}}>{h.pokemon.name.replace(/-/g," ")}</span>
                        <span style={{fontSize:10,color:dex.screenMuted,fontFamily:"monospace",textAlign:"right"}}>{rates}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {loading&&<PokeballSpinner/>}
          </div>
        </div>
        <div style={{background:dex.red,padding:"10px 16px",display:"flex",justifyContent:"flex-end",gap:8,flexShrink:0}}>
          <div style={{width:40,height:8,borderRadius:4,background:dex.darkRed}}/>
          <div style={{width:24,height:8,borderRadius:4,background:dex.darkRed}}/>
        </div>
      </div>
    </div>
  );
}

function ItemFinder(){
  const [query,setQuery]=useState("");
  const [results,setResults]=useState<{name:string,rawName:string,moveName?:string}[]>([]);
  const [loading,setLoading]=useState(false);
  const [open,setOpen]=useState(false);
  const [selectedItem,setSelectedItem]=useState<any>(null);
  const debounceRef=useRef<any>(null);
  const allItems=useRef<any[]>([]);

  // Pre-load full item list once
  useEffect(()=>{
    fetchPoke(`https://pokeapi.co/api/v2/item?limit=2000`)
      .then(d=>{allItems.current=d.results;}).catch(console.error);
  },[]);

  const search=async(q:string)=>{
    if(q.length<2){setResults([]);return;}
    setLoading(true);
    try{
      const q2=q.toLowerCase().replace(/\s/g,"-");
      const matches=allItems.current
        .filter((i:any)=>i.name.includes(q2)||i.name.replace(/-/g," ").includes(q.toLowerCase()))
        .slice(0,15);

      // Fetch move names for TMs/HMs
      const formatted=await Promise.all(matches.map(async(i:any)=>{
        let moveName="";
        if(i.name.startsWith("tm")||i.name.startsWith("hm")){
          try{
            const d=await fetchPoke(i.url);
            const m=d.machines?.[0];
            if(m?.move?.name) moveName=m.move.name.replace(/-/g," ").replace(/\b\w/g,(c:string)=>c.toUpperCase());
          }catch{}
        }
        return{
          name:i.name.replace(/-/g," ").replace(/\b\w/g,(c:string)=>c.toUpperCase()),
          rawName:i.name,
          moveName,
        };
      }));
      setResults(formatted);
    }catch(e){console.error(e);}
    setLoading(false);
  };

  useEffect(()=>{
    clearTimeout(debounceRef.current);
    debounceRef.current=setTimeout(()=>search(query),300);
  },[query]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {/* Search with dropdown */}
      <div style={{position:"relative"}}>
        <DexInput value={query}
          onChange={(e:any)=>{setQuery(e.target.value);setOpen(true);}}
          onKeyDown={(e:any)=>{if(e.key==="Escape"){setOpen(false);setQuery("");}}}
          placeholder="Search items (e.g. Potion, TM26, Leftovers)..."/>
        {open&&query.length>=2&&(
          <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:200,background:dex.screen,border:`1px solid ${dex.screenDim}`,borderRadius:8,maxHeight:320,overflowY:"auto",boxShadow:"0 6px 20px rgba(0,0,0,0.6)"}}>
            {loading&&<p style={{margin:0,padding:"10px 12px",fontSize:11,color:dex.screenMuted,fontFamily:"monospace"}}>Searching...</p>}
            {!loading&&results.length===0&&<p style={{margin:0,padding:"10px 12px",fontSize:11,color:dex.screenMuted,fontFamily:"monospace"}}>No items found.</p>}
            {results.map((item,i)=>(
              <div key={i} onClick={()=>{setSelectedItem(item);setOpen(false);}}
                style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",cursor:"pointer",borderBottom:`1px solid ${dex.screenDim}22`}}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=dex.screenBg}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
                <ItemSprite rawName={item.rawName} name={item.name} size={24}/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{margin:0,fontSize:12,color:dex.screenText,fontFamily:"monospace"}}>{item.name}</p>
                  {item.moveName&&<p style={{margin:0,fontSize:10,color:"#88aaff",fontFamily:"monospace"}}>{item.moveName}</p>}
                </div>
                {ITEM_ACQUISITION[item.rawName]&&(
                  <span style={{fontSize:9,color:"#66cc88",fontFamily:"monospace"}}>✓ data</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <p style={{margin:0,fontSize:10,color:dex.screenMuted,fontFamily:"monospace"}}>
        Type at least 2 characters to search. Items with <span style={{color:"#66cc88"}}>✓ data</span> have full acquisition info.
      </p>
      {selectedItem&&<ItemDetailPanel item={selectedItem} onClose={()=>setSelectedItem(null)}/>}
    </div>
  );
}

function DexLights(){
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <div style={{width:22,height:22,borderRadius:"50%",background:"#88CCFF",border:"2px solid #fff"}}/>
      <div style={{width:11,height:11,borderRadius:"50%",background:"#FF5555",border:"2px solid rgba(255,255,255,0.5)"}}/>
      <div style={{width:11,height:11,borderRadius:"50%",background:"#FFFF55",border:"2px solid rgba(255,255,255,0.5)"}}/>
      <div style={{width:11,height:11,borderRadius:"50%",background:"#55FF55",border:"2px solid rgba(255,255,255,0.5)"}}/>
    </div>
  );
}

function DexInput({value,onChange,onKeyDown=()=>{},placeholder,style={}}:{value:any,onChange:any,onKeyDown?:any,placeholder:any,style?:any}){
  return (
    <input value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder}
      style={{background:dex.screenBg,border:`1px solid ${dex.screenDim}`,borderRadius:6,color:dex.screenText,padding:"6px 10px",fontSize:12,fontFamily:"monospace",outline:"none",width:"100%",boxSizing:"border-box",...style}}
    />
  );
}

function DexSelect({value,onChange,children,style={}}:{value:any,onChange:any,children:any,style?:any}){
  return (
    <select value={value} onChange={onChange}
      style={{background:dex.screenBg,border:`1px solid ${dex.screenDim}`,borderRadius:6,color:dex.screenText,padding:"5px 8px",fontSize:12,fontFamily:"monospace",outline:"none",...style}}>
      {children}
    </select>
  );
}

function DexButton({onClick,active=false,children,style={}}:{onClick:()=>void,active?:boolean,children:any,style?:any}){
  return (
    <button onClick={onClick} style={{background:active?dex.red:"transparent",border:`1px solid ${active?dex.red:dex.screenDim}`,borderRadius:6,color:active?"#fff":dex.screenMuted,padding:"5px 12px",fontSize:12,fontFamily:"monospace",cursor:"pointer",...style}}>
      {children}
    </button>
  );
}

function GridCard({mon,caught,selected,selectMode,isAnchor,onToggle,onDetail,onCardClick,onCheckbox,onLongPress}:{mon:any,caught:boolean,selected:boolean,selectMode:boolean,isAnchor:boolean,onToggle:any,onDetail:any,onCardClick:any,onCheckbox:any,onLongPress:any}){
  const types:string[]=mon.types||[];
  const longPressTimer=useRef<any>(null);
  const startLongPress=(e:React.TouchEvent)=>{
    longPressTimer.current=setTimeout(()=>onLongPress(mon),500);
  };
  const cancelLongPress=()=>{
    if(longPressTimer.current)clearTimeout(longPressTimer.current);
  };
  const borderColor=isAnchor?"#ffcc44":selected?"#5588ff":caught?"#3a5a2a":dex.screenDim;
  const bg=isAnchor?"#1a1500":selected?"#0d1a30":caught?"#0d1f0d":dex.screenBg;
  return (
    <div onClick={e=>onCardClick(mon,e,()=>onDetail(mon))}
      onTouchStart={startLongPress} onTouchEnd={cancelLongPress} onTouchMove={cancelLongPress}
      style={{border:`1px solid ${borderColor}`,borderRadius:8,background:bg,padding:"8px 4px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",opacity:caught||selected||isAnchor?1:0.55,transition:"all 0.15s",outline:isAnchor?`2px solid #ffcc44`:selected?"2px solid #5588ff":"none",position:"relative",contentVisibility:"auto",containIntrinsicSize:"0 130px"}}>
      {selectMode&&<input type="checkbox" checked={selected} onChange={e=>onCheckbox(mon.id,e)} onClick={e=>e.stopPropagation()} style={{position:"absolute",top:5,right:5,width:14,height:14,cursor:"pointer",accentColor:"#5588ff"}}/>}
      {isAnchor&&<span style={{position:"absolute",top:4,left:4,fontSize:10}}>⚓</span>}
      <span style={{fontSize:10,color:isAnchor?"#ffcc44":selected?"#8899ff":dex.screenHeading,alignSelf:"flex-start",paddingLeft:isAnchor?16:4,fontFamily:"monospace"}}>#{String(mon.id).padStart(3,"0")}</span>
      <img src={spriteUrl(mon.id)} alt={mon.name} width={48} height={48} style={{imageRendering:"pixelated",filter:caught?"none":"grayscale(100%)",pointerEvents:"none"}} onError={e=>{(e.target as HTMLImageElement).style.opacity="0.1";}}/>
      <span style={{fontSize:11,color:dex.screenText,textAlign:"center",lineHeight:1.2,width:"100%",padding:"0 3px",wordBreak:"break-word",fontFamily:"monospace",pointerEvents:"none"}}>{mon.name}</span>
      <div style={{display:"flex",gap:2,flexWrap:"wrap",justifyContent:"center"}}>{types.map((t:string)=><TypeBadge key={t} type={t}/>)}</div>
      <div onClick={e=>{e.stopPropagation();onToggle(mon.id);}} style={{marginTop:4}}><Pokeball caught={caught} size={26}/></div>
    </div>
  );
}

function ListRow({mon,caught,selected,selectMode,isAnchor,onToggle,onDetail,onCardClick,onCheckbox,onLongPress}:{mon:any,caught:boolean,selected:boolean,selectMode:boolean,isAnchor:boolean,onToggle:any,onDetail:any,onCardClick:any,onCheckbox:any,onLongPress:any}){
  const types:string[]=mon.types||[];
  const longPressTimer=useRef<any>(null);
  const startLongPress=()=>{longPressTimer.current=setTimeout(()=>onLongPress(mon),500);};
  const cancelLongPress=()=>{if(longPressTimer.current)clearTimeout(longPressTimer.current);};
  const borderColor=isAnchor?"2px solid #ffcc44":selected?"2px solid #5588ff":"none";
  return (
    <div onClick={e=>onCardClick(mon,e,()=>onDetail(mon))}
      onTouchStart={startLongPress} onTouchEnd={cancelLongPress} onTouchMove={cancelLongPress}
      style={{display:"flex",alignItems:"center",gap:10,padding:"6px 12px",borderBottom:`1px solid ${dex.screenDim}`,cursor:"pointer",background:isAnchor?"#1a1500":selected?"#0d1a30":caught?"#0d1f0d":"transparent",outline:borderColor,contentVisibility:"auto",containIntrinsicSize:"0 52px"}}>
      {selectMode&&<input type="checkbox" checked={selected} onChange={e=>onCheckbox(mon.id,e)} onClick={e=>e.stopPropagation()} style={{width:14,height:14,cursor:"pointer",accentColor:"#5588ff",flexShrink:0}}/>}
      {isAnchor&&<span style={{fontSize:12}}>⚓</span>}
      <span style={{fontSize:11,color:isAnchor?"#ffcc44":selected?"#8899ff":dex.screenHeading,minWidth:32,fontFamily:"monospace"}}>#{String(mon.id).padStart(3,"0")}</span>
      <img src={spriteUrl(mon.id)} alt={mon.name} width={36} height={36} style={{imageRendering:"pixelated",filter:caught?"none":"grayscale(100%)",opacity:caught?1:0.45}} onError={e=>{(e.target as HTMLImageElement).style.opacity="0.1";}}/>
      <span style={{flex:1,fontSize:13,color:dex.screenText,fontFamily:"monospace",fontWeight:caught?500:400}}>{mon.name}</span>
      <div style={{display:"flex",gap:3}}>{types.map((t:string)=><TypeBadge key={t} type={t}/>)}</div>
      <div onClick={e=>{e.stopPropagation();onToggle(mon.id);}}><Pokeball caught={caught} size={28}/></div>
    </div>
  );
}

function DetailPanel({mon,onClose,onTypesLoaded}:{mon:any,onClose:()=>void,onTypesLoaded:(id:number,types:string[])=>void}){
  // All hooks must run unconditionally before any early return (Rules of Hooks)
  const [activeTab,setActiveTab]=useState("catch");
  const [versionGroup,setVersionGroup]=useState("__none__");
  const [availableVersions,setAvailableVersions]=useState<string[]>([]);
  const [levelMoves,setLevelMoves]=useState<any[]>([]);
  const [tmMoves,setTmMoves]=useState<any[]>([]);
  const [encounters,setEncounters]=useState<{[vg:string]:{[loc:string]:{[vName:string]:{methods:string[],minLevel:number,maxLevel:number,chance:number}}}}>({}); 
  const [liveTypes,setLiveTypes]=useState<string[]>([]);
  const [loading,setLoading]=useState(false);
  const [encLoading,setEncLoading]=useState(false);

  const typeColor=TYPE_COLORS[liveTypes[0]||mon?.types?.[0]]||"#888";

  // Fetch base Pokémon data (types + available version groups) and encounters in parallel
  useEffect(()=>{
    if(!mon)return;
    const load=async()=>{
      setLoading(true);
      setEncLoading(true);
      setLiveTypes([]);
      setEncounters({});
      setAvailableVersions([]);
      setVersionGroup("__none__");
      try{
        const [poke,encData]=await Promise.all([
          fetchPoke(`https://pokeapi.co/api/v2/pokemon/${mon.id}`),
          fetchPoke(`https://pokeapi.co/api/v2/pokemon/${mon.id}/encounters`),
        ]);

        // Types
        const types=poke.types.map((t:any)=>t.type.name);
        setLiveTypes(types);
        onTypesLoaded(mon.id,types);

        // Available version groups for moves
        const vgs=[...new Set(poke.moves.flatMap((m:any)=>
          m.version_group_details.map((v:any)=>v.version_group.name)
        ))].filter((v:any)=>VERSION_GROUPS[v]) as string[];
        vgs.sort((a,b)=>VERSION_GROUPS[a].gen-VERSION_GROUPS[b].gen);
        setAvailableVersions(vgs);

        // Encounters — group by VERSION GROUP (matching the dropdown), with full detail per location+version
        // Structure: { [versionGroup]: { [locationName]: { versions: { [vName]: {methods, minLevel, maxLevel, chance} } } } }
        type EncLoc = {methods:string[], minLevel:number, maxLevel:number, chance:number};
        type EncByGroup = {[vg:string]:{[loc:string]:{[vName:string]:EncLoc}}};
        const byGroup:EncByGroup={};
        for(const loc of encData){
          const areaName=(loc.location_area?.name||"unknown")
            .replace(/-area$/,"")
            .replace(/-/g," ")
            .replace(/\b\w/g,(c:string)=>c.toUpperCase());
          for(const vd of loc.version_details){
            const vName:string=vd.version?.name;
            if(!vName)continue;
            const vg=VERSION_TO_GROUP[vName];
            if(!vg)continue;
            if(!byGroup[vg])byGroup[vg]={};
            if(!byGroup[vg][areaName])byGroup[vg][areaName]={};
            const methods=[...new Set(vd.encounter_details.map((e:any)=>e.method?.name||"unknown"))] as string[];
            const levels=vd.encounter_details.flatMap((e:any)=>[e.min_level,e.max_level]).filter((n:any)=>n!=null);
            byGroup[vg][areaName][vName]={
              methods,
              minLevel:Math.min(...levels),
              maxLevel:Math.max(...levels),
              chance:vd.max_chance??0,
            };
          }
        }
        setEncounters(byGroup);
      }catch(e){console.error(e);}
      finally{setLoading(false);setEncLoading(false);}
    };
    load();
  },[mon?.id]);

  useEffect(()=>{
    if(!versionGroup||versionGroup==="__none__")return;
    const load=async()=>{
      setLoading(true);
      try{
        const poke=await fetchPoke(`https://pokeapi.co/api/v2/pokemon/${mon.id}`);
        const movesInVersion=poke.moves.filter((m:any)=>
          m.version_group_details.some((v:any)=>v.version_group.name===versionGroup)
        );
        const moveDetails=await Promise.all(movesInVersion.map(async(m:any)=>{
          const detail=await fetchPoke(m.move.url);
          const vgd=m.version_group_details.find((v:any)=>v.version_group.name===versionGroup);
          const desc=detail.flavor_text_entries.find((f:any)=>f.language.name==="en")?.flavor_text?.replace(/\n|\f/g," ")||"No description.";
          const tmEntry=detail.machines?.find((mc:any)=>mc.version_group?.name===versionGroup);
          let tmLabel="TM";
          if(tmEntry){
            try{const mcData=await fetchPoke(tmEntry.machine.url);tmLabel=`TM${String(mcData.item?.name?.match(/\d+/)?.[0]||"").padStart(2,"0")}`;}catch{}
          }
          return {
            name:detail.name.replace(/-/g," ").replace(/\b\w/g,(c:string)=>c.toUpperCase()),
            type:detail.type.name,
            category:detail.damage_class.name,
            power:detail.power,
            accuracy:detail.accuracy,
            description:desc,
            method:vgd.move_learn_method.name,
            level:vgd.move_learn_method.name==="level-up"?vgd.level_learned_at:null,
            tm:vgd.move_learn_method.name==="machine"?tmLabel:null,
          };
        }));
        setLevelMoves(moveDetails.filter(m=>m.method==="level-up").sort((a,b)=>a.level-b.level));
        setTmMoves(moveDetails.filter(m=>m.method==="machine").sort((a,b)=>a.name.localeCompare(b.name)));
      }catch(e){console.error(e);}
      finally{setLoading(false);}
    };
    load();
  },[mon?.id,versionGroup]);

  const tabs=["catch","levelup","tm"] as const;
  const tabLabels:any={catch:"Catch Info",levelup:"Level-Up Moves",tm:"TM Moves"};
  const safeVersions=availableVersions||[];

  if(!mon)return null;

  // Map encounter method names to METHOD_COLORS keys
  const methodKey=(m:string)=>{
    if(m.includes("walk")||m.includes("tall-grass")||m.includes("land"))return "wild";
    if(m.includes("fish")||m.includes("surfing")||m.includes("water"))return "fishing";
    if(m.includes("gift"))return "gift";
    if(m.includes("event"))return "event";
    return "wild";
  };

  return (
    <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,background:"rgba(0,0,0,0.75)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:"min(580px,95vw)",maxHeight:"90vh",borderRadius:16,border:`3px solid ${dex.red}`,background:dex.red,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{background:dex.red,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <DexLights/>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#fff",fontSize:18,cursor:"pointer",fontWeight:500,lineHeight:1}}>✕</button>
        </div>
        <div style={{background:dex.screen,margin:"0 12px",borderRadius:8,border:`4px solid ${dex.screenBorder}`,display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${dex.screenDim}`,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{background:typeColor+"22",borderRadius:8,padding:4,border:`1px solid ${typeColor}44`,flexShrink:0}}>
                <img src={spriteUrl(mon.id)} alt={mon.name} width={64} height={64} style={{imageRendering:"pixelated",display:"block"}} onError={e=>{(e.target as HTMLImageElement).style.opacity="0.2";}}/>
              </div>
              <div style={{flex:1}}>
                <p style={{margin:0,fontSize:11,color:dex.screenHeading,fontFamily:"monospace"}}>No. {String(mon.id).padStart(3,"0")}</p>
                <h2 style={{margin:"2px 0 6px",fontSize:18,fontWeight:500,color:"#e8e8ff",fontFamily:"monospace"}}>{mon.name}</h2>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {liveTypes.length>0
                    ?liveTypes.map((t:string)=><TypeBadge key={t} type={t}/>)
                    :(mon.types||[]).map((t:string)=><TypeBadge key={t} type={t}/>)
                  }
                </div>
              </div>
              {safeVersions.length>0&&(
                <DexSelect value={versionGroup} onChange={(e:any)=>setVersionGroup(e.target.value)} style={{fontSize:11,maxWidth:160}}>
                  <option value="__none__">Select Generation</option>
                  {safeVersions.map(v=>(
                    <option key={v} value={v}>{VERSION_GROUPS[v]?.label||v}</option>
                  ))}
                </DexSelect>
              )}
            </div>
          </div>
          <div style={{display:"flex",background:dex.screenBg,borderBottom:`1px solid ${dex.screenDim}`,flexShrink:0}}>
            {tabs.map(t=>(
              <button key={t} onClick={()=>setActiveTab(t)} style={{flex:1,padding:"8px 4px",fontSize:11,fontFamily:"monospace",border:"none",cursor:"pointer",background:activeTab===t?dex.screen:"transparent",color:activeTab===t?dex.screenText:dex.screenMuted,borderBottom:activeTab===t?`2px solid ${dex.red}`:"2px solid transparent"}}>
                {tabLabels[t]}
              </button>
            ))}
          </div>
          <div style={{overflowY:"auto",flex:1,padding:"12px 14px"}}>
            {activeTab==="catch"&&(
              encLoading ? <PokeballSpinner/> : (() => {
                const hasAny = Object.keys(encounters).length > 0;
                if(!hasAny) return (
                  <p style={{color:dex.screenMuted,fontSize:12,fontFamily:"monospace",lineHeight:1.8}}>
                    No wild encounter data found.<br/>
                    This Pokémon may only be obtained via evolution, trading, or events.
                  </p>
                );

                // If no version selected, show prompt
                if(versionGroup==="__none__") return (
                  <p style={{color:dex.screenMuted,fontSize:12,fontFamily:"monospace"}}>
                    Select a generation above to view encounter locations.
                  </p>
                );

                const locsForGroup = encounters[versionGroup]||{};
                const locEntries = Object.entries(locsForGroup);

                if(!locEntries.length) return (
                  <p style={{color:dex.screenMuted,fontSize:12,fontFamily:"monospace",lineHeight:1.8}}>
                    Not found in the wild in {VERSION_GROUPS[versionGroup]?.label||versionGroup}.<br/>
                    Try a different generation.
                  </p>
                );

                // Version name display within the group (e.g. "Red", "Blue")
                const fmtV=(v:string)=>v.replace(/-/g," ").replace(/\b\w/g,(c:string)=>c.toUpperCase());

                return (
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {locEntries.map(([locName, versionMap],i)=>{
                      const versions=Object.entries(versionMap);
                      return (
                        <div key={i} style={{background:dex.screenBg,border:`1px solid ${dex.screenDim}`,borderRadius:8,overflow:"hidden"}}>
                          {/* Location header */}
                          <div style={{padding:"8px 12px",borderBottom:`1px solid ${dex.screenDim}`,background:"rgba(255,255,255,0.03)"}}>
                            <span style={{fontSize:13,color:dex.screenText,fontFamily:"monospace",fontWeight:500}}>{locName}</span>
                          </div>
                          {/* Per-version rows */}
                          <div style={{display:"flex",flexDirection:"column",gap:0}}>
                            {versions.map(([vName,enc],j)=>{
                              const mk=methodKey(enc.methods[0]||"");
                              const mc=METHOD_COLORS[mk]||METHOD_COLORS.wild;
                              const chanceColor=enc.chance>=20?"#88ee66":enc.chance>=10?"#ffcc44":"#ee8866";
                              return (
                                <div key={j} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",borderBottom:j<versions.length-1?`1px solid ${dex.screenDim}`:"none",flexWrap:"wrap"}}>
                                  {/* Version pill */}
                                  <span style={{fontSize:11,fontFamily:"monospace",color:"#aabbcc",minWidth:80,fontWeight:500}}>{fmtV(vName)}</span>
                                  {/* Method badges */}
                                  <div style={{display:"flex",gap:4,flexWrap:"wrap",flex:1}}>
                                    {enc.methods.map((m:string,k:number)=>{
                                      const mc2=METHOD_COLORS[methodKey(m)]||METHOD_COLORS.wild;
                                      return (
                                        <span key={k} style={{fontSize:10,padding:"2px 7px",borderRadius:4,background:mc2.bg,color:mc2.text,fontWeight:600,textTransform:"capitalize"}}>
                                          {m.replace(/-/g," ")}
                                        </span>
                                      );
                                    })}
                                  </div>
                                  {/* Level range */}
                                  <span style={{fontSize:11,color:dex.screenMuted,fontFamily:"monospace",whiteSpace:"nowrap"}}>
                                    Lv.{enc.minLevel}{enc.minLevel!==enc.maxLevel?`–${enc.maxLevel}`:""}
                                  </span>
                                  {/* Encounter rate */}
                                  {enc.chance>0&&(
                                    <span style={{fontSize:11,fontFamily:"monospace",color:chanceColor,fontWeight:600,whiteSpace:"nowrap",minWidth:36,textAlign:"right"}}>
                                      {enc.chance}%
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
            {activeTab==="levelup"&&(
              versionGroup==="__none__"
                ?<p style={{color:dex.screenMuted,fontSize:12,fontFamily:"monospace"}}>Select a generation above to load moves.</p>
                :loading?<PokeballSpinner/>:<MoveTable moves={levelMoves}/>
            )}
            {activeTab==="tm"&&(
              versionGroup==="__none__"
                ?<p style={{color:dex.screenMuted,fontSize:12,fontFamily:"monospace"}}>Select a generation above to load moves.</p>
                :loading?<PokeballSpinner/>:<MoveTable moves={tmMoves}/>
            )}
          </div>
        </div>
        <div style={{background:dex.red,padding:"10px 16px",display:"flex",justifyContent:"flex-end",gap:8,flexShrink:0}}>
          <div style={{width:40,height:8,borderRadius:4,background:dex.darkRed}}/>
          <div style={{width:24,height:8,borderRadius:4,background:dex.darkRed}}/>
        </div>
      </div>
    </div>
  );
}

function AppInner(){
  const [username,setUsername]=useState("");
  const [inputName,setInputName]=useState("");
  const [caught,setCaught]=useState<{[key:string]:boolean}>({});
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [genVisible,setGenVisible]=useState(true);
  const [detail,setDetail]=useState<any>(null);
  const [saving,setSaving]=useState(false);
  const [friends,setFriends]=useState<{name:string,count:number}[]>([]);
  const [tab,setTab]=useState("home");
  const [quickEntry,setQuickEntry]=useState("");
  const [quickFeedback,setQuickFeedback]=useState("");
  const [viewMode,setViewMode]=useState("grid");
  const [selected,setSelected]=useState(new Set<number>());
  const [selectMode,setSelectMode]=useState(false);
  const [lastClicked,setLastClicked]=useState<number|null>(null);
  const [rangeAnchor,setRangeAnchor]=useState<number|null>(null);
  const [savedProfiles,setSavedProfiles]=useState<{name:string,count:number}[]>([]);
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [confirmDelete,setConfirmDelete]=useState<string|null>(null);
  // Generation filter — set of gen numbers currently visible. Defaults to all available gens.
  const [genFilter,setGenFilter]=useState<Set<number>>(()=>new Set(GENERATIONS.map(g=>g.num)));
  const [waffleOpen,setWaffleOpen]=useState(false);
  // Types loaded on-demand from PokéAPI when a detail panel is opened; keyed by Pokémon ID
  const [pokemonTypes,setPokemonTypes]=useState<{[id:number]:string[]}>({});
  const [cacheSize,setCacheSize]=useState(0);

  // Count cached PokéAPI entries in localStorage — must be defined before handleTypesLoaded
  const refreshCacheSize=useCallback(()=>{
    try{
      const count=Object.keys(localStorage).filter(k=>k.startsWith(CACHE_PREFIX)).length;
      setCacheSize(count);
    }catch{setCacheSize(0);}
  },[]);

  const handleTypesLoaded=useCallback((id:number,types:string[])=>{
    setPokemonTypes(prev=>prev[id]?prev:{...prev,[id]:types});
    refreshCacheSize();
  },[refreshCacheSize]);

  useEffect(()=>{refreshCacheSize();},[refreshCacheSize]);

  const handleClearCache=()=>{
    clearPokeCache();
    setPokemonTypes({});
    refreshCacheSize();
  };

  const loadUser=useCallback(async(name:string)=>{
    try{const v=await getItem(`dex:${name.toLowerCase()}`);setCaught(v?JSON.parse(v):{});}
    catch{setCaught({});}
  },[]);

  const saveUser=useCallback(async(name:string,data:any)=>{
    try{setSaving(true);await setItem(`dex:${name.toLowerCase()}`,JSON.stringify(data));}
    catch(e){console.error(e);}finally{setSaving(false);}
  },[]);

  // Display name helpers — store original casing in localStorage separate from caught data
  const getDisplayName=(lower:string):string=>{
    try{return localStorage.getItem(`dex:display:${lower}`)||lower;}catch{return lower;}
  };
  const saveDisplayName=(lower:string,display:string)=>{
    try{localStorage.setItem(`dex:display:${lower}`,display);}catch{}
  };
  const removeDisplayName=(lower:string)=>{
    try{localStorage.removeItem(`dex:display:${lower}`);}catch{}
  };

  const loadProfiles=useCallback(async()=>{
    try{
      const reserved=new Set(["dex:last-user"]);
      const keys=(await listKeys("dex:")).filter(k=>!reserved.has(k)&&!k.startsWith("dex:display:"));
      if(!keys.length){setSavedProfiles([]);return;}
      const entries=await Promise.all(keys.map(async(k:string)=>{
        try{
          const lower=k.replace("dex:","");
          if(!lower)return null;
          const v=await getItem(k);
          const d=v?JSON.parse(v):{};
          const display=getDisplayName(lower)||lower;
          if(!display)return null;
          return{name:display,lower,count:Object.values(d).filter(Boolean).length};
        }catch{return null;}
      }));
      setSavedProfiles((entries.filter((e):e is {name:string,lower:string,count:number}=>!!e&&!!e.name)).sort((a,b)=>b.count-a.count));
    }catch(e){console.error(e);}
  },[]);

  const loadFriends=useCallback(async()=>{
    try{
      const reserved=new Set(["dex:last-user"]);
      const keys=(await listKeys("dex:")).filter(k=>!reserved.has(k)&&!k.startsWith("dex:display:"));
      const entries=await Promise.all(keys.map(async(k:string)=>{
        try{
          const lower=k.replace("dex:","");
          const v=await getItem(k);
          const d=v?JSON.parse(v):{};
          const display=getDisplayName(lower);
          return{name:display,lower,count:Object.values(d).filter(Boolean).length};
        }catch{return null;}
      }));
      setFriends((entries.filter(Boolean) as {name:string,lower:string,count:number}[]).sort((a,b)=>b.count-a.count));
    }catch(e){console.error(e);}
  },[]);

  useEffect(()=>{
    if(!settingsOpen)return;
    let skipFirst=true;
    const handler=()=>{if(skipFirst){skipFirst=false;return;}setSettingsOpen(false);};
    window.addEventListener("click",handler);
    return()=>window.removeEventListener("click",handler);
  },[settingsOpen]);

  useEffect(()=>{
    if(!waffleOpen)return;
    let skipFirst=true;
    const handler=()=>{if(skipFirst){skipFirst=false;return;}setWaffleOpen(false);};
    window.addEventListener("click",handler);
    return()=>window.removeEventListener("click",handler);
  },[waffleOpen]);

  useEffect(()=>{
    loadProfiles();
    try{
      const lower=localStorage.getItem("dex:last-user");
      if(lower){
        const display=getDisplayName(lower);
        setUsername(display);
        loadUser(lower);
      }
    }catch{}
  },[loadProfiles]);
  useEffect(()=>{if(tab==="friends")loadFriends();},[tab,loadFriends]);

  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{
      if((e.target as HTMLElement).tagName==="INPUT"||(e.target as HTMLElement).tagName==="SELECT")return;
      if(e.key==="s"||e.key==="S"){setSelectMode(v=>!v);setSelected(new Set());setLastClicked(null);}
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[]);

  const handleLogin=(name?:string)=>{
    const raw=(name||inputName).trim();
    if(!raw)return;
    const lower=raw.toLowerCase();
    saveDisplayName(lower,raw);
    setUsername(raw);
    loadUser(lower);
    try{localStorage.setItem("dex:last-user",lower);}catch{}
  };

  const handleLogout=()=>{
    setUsername("");
    setInputName("");
    setCaught({});
    setTab("home");
    setSelectMode(false);
    setSelected(new Set());
    setDetail(null);
    setSearch("");
    setFilter("all");
    setConfirmDelete(null);
    loadProfiles();
    try{localStorage.removeItem("dex:last-user");}catch{}
  };

  const handleDeleteProfile=async(name:string,lower:string)=>{
    try{
      try{localStorage.removeItem(`dex:${lower}`);}catch{}
      if((window as any).storage){
        try{await (window as any).storage.delete(`dex:${lower}`,true);}catch{}
      }
      removeDisplayName(lower);
      const lastUser=localStorage.getItem("dex:last-user");
      if(lastUser===lower) try{localStorage.removeItem("dex:last-user");}catch{}
    }catch(e){console.error(e);}
    setConfirmDelete(null);
    loadProfiles();
  };

  const toggleCaught=(id:number)=>{
    const next={...caught,[id]:!caught[id]};
    setCaught(next);
    if(username)saveUser(username,next);
  };

  const handleCardClick=(mon:any,e:React.MouseEvent,openDetail:()=>void)=>{
    if(selectMode){
      e.preventDefault();
      const visibleIds=filtered.map((p:any)=>p.id);
      const clickedIdx=visibleIds.indexOf(mon.id);
      if(e.shiftKey&&lastClicked!==null&&visibleIds.includes(lastClicked)){
        const anchorIdx=visibleIds.indexOf(lastClicked);
        const [lo,hi]=[Math.min(anchorIdx,clickedIdx),Math.max(anchorIdx,clickedIdx)];
        setSelected(prev=>{const next=new Set(prev);visibleIds.slice(lo,hi+1).forEach((id:number)=>next.add(id));return next;});
      } else if(rangeAnchor!==null&&rangeAnchor!==mon.id&&visibleIds.includes(rangeAnchor)){
        const anchorIdx=visibleIds.indexOf(rangeAnchor);
        const [lo,hi]=[Math.min(anchorIdx,clickedIdx),Math.max(anchorIdx,clickedIdx)];
        setSelected(prev=>{const next=new Set(prev);visibleIds.slice(lo,hi+1).forEach((id:number)=>next.add(id));return next;});
        setRangeAnchor(null);
      } else {
        setSelected(prev=>{const next=new Set(prev);next.has(mon.id)?next.delete(mon.id):next.add(mon.id);return next;});
      }
      setLastClicked(mon.id);
    }else{
      openDetail();
    }
  };

  const handleLongPress=(mon:any)=>{
    if(!selectMode)return;
    setRangeAnchor(mon.id);
    setSelected(prev=>{const next=new Set(prev);next.add(mon.id);return next;});
    setLastClicked(mon.id);
  };

  const toggleCheckbox=(id:number,e:React.ChangeEvent)=>{
    e.stopPropagation();
    setSelected(prev=>{const next=new Set(prev);next.has(id)?next.delete(id):next.add(id);return next;});
    setLastClicked(id);
  };

  const exitSelectMode=()=>{setSelectMode(false);setSelected(new Set());setLastClicked(null);setRangeAnchor(null);};

  const applyBulk=(markAs:boolean)=>{
    const next:{[key:string]:boolean}={...caught};
    selected.forEach((id:any)=>{next[id]=markAs;});
    setCaught(next);
    if(username)saveUser(username,next);
    exitSelectMode();
  };

  const handleQuick=(e:React.KeyboardEvent)=>{
    if(e.key!=="Enter")return;
    const val=quickEntry.trim().toLowerCase();
    const mon=allPokemon.find(p=>p.name.toLowerCase()===val||String(p.id)===val);
    if(mon){const nowC=!caught[mon.id];toggleCaught(mon.id);setQuickFeedback(`${mon.name} → ${nowC?"caught!":"unmarked"}`);setQuickEntry("");}
    else setQuickFeedback("Not found.");
    setTimeout(()=>setQuickFeedback(""),2000);
  };

  // Defer rendering full list — show first 50 instantly, rest after paint
  const [renderLimit,setRenderLimit]=useState(50);
  useEffect(()=>{
    if(tab!=="tracker"){setRenderLimit(50);return;}
    const id=setTimeout(()=>setRenderLimit(Infinity),50);
    return()=>clearTimeout(id);
  },[tab,genFilter,search,filter]);
  const visiblePokemon=allPokemon.filter(p=>genFilter.has(p.gen));
  const total=visiblePokemon.length;
  const caughtCount=visiblePokemon.filter(p=>caught[p.id]).length;
  const filtered=visiblePokemon.filter(p=>{
    const ms=!search||p.name.toLowerCase().includes(search.toLowerCase())||String(p.id).includes(search);
    const mf=filter==="all"||(filter==="caught"&&caught[p.id])||(filter==="missing"&&!caught[p.id]);
    return ms&&mf;
  }).map(p=>({...p,types:pokemonTypes[p.id]||p.types}));
  const renderedList=filtered.slice(0,renderLimit);

  const screenStyle={background:dex.screen,borderRadius:8,border:`3px solid ${dex.screenBorder}`,padding:14};

  if(!username) return (
    <div className="dex-viewport">
    <div className="dex-shell">
      <div style={{background:dex.red,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <DexLights/>
        <span style={{color:"#fff",fontWeight:500,fontSize:14,fontFamily:"monospace",marginLeft:8}}>POKÉDEX — Living Dex Tracker</span>
      </div>
      <div className="dex-screen" style={{...screenStyle,margin:"0 12px",display:"flex",flexDirection:"column",gap:16}}>
        {savedProfiles.length>0&&(
          <div>
            <p style={{color:dex.screenHeading,fontSize:11,fontFamily:"monospace",margin:"0 0 8px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Saved trainers</p>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {savedProfiles.map((p,i)=>{
                const pct=Math.round((p.count/allPokemon.length)*100);
                const lower=(p as any).lower||p.name.toLowerCase();
                const isConfirmingDelete=confirmDelete===lower;
                return (
                  <div key={i} style={{background:dex.screenBg,borderRadius:8,border:`1px solid ${dex.screenDim}`,overflow:"hidden"}}>
                    {!isConfirmingDelete&&(
                      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px"}}>
                        <div onClick={()=>handleLogin(p.name)} style={{width:38,height:38,borderRadius:"50%",background:"#1a2a3a",border:`2px solid ${dex.screenDim}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontFamily:"monospace",color:dex.screenText,fontWeight:500,flexShrink:0,cursor:"pointer"}}>
                          {p.name[0].toUpperCase()}
                        </div>
                        <div onClick={()=>handleLogin(p.name)} style={{flex:1,minWidth:0,cursor:"pointer"}}>
                          <p style={{margin:"0 0 4px",fontSize:13,fontFamily:"monospace",color:dex.screenText,fontWeight:500}}>{p.name}</p>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{flex:1,height:4,background:dex.screenDim,borderRadius:2,overflow:"hidden"}}>
                              <div style={{height:"100%",borderRadius:2,width:`${pct}%`,background:p.count===allPokemon.length?"#55cc55":"#378ADD"}}/>
                            </div>
                            <span style={{fontSize:10,color:dex.screenMuted,fontFamily:"monospace",whiteSpace:"nowrap"}}>{p.count}/{allPokemon.length} · {pct}%</span>
                          </div>
                        </div>
                        <span onClick={()=>handleLogin(p.name)} style={{fontSize:11,color:"#5588ff",fontFamily:"monospace",flexShrink:0,cursor:"pointer"}}>▶ Play</span>
                        <button onClick={e=>{e.stopPropagation();setConfirmDelete(lower);}}
                          style={{background:"none",border:"1px solid #553333",borderRadius:5,color:"#ee6666",fontSize:11,padding:"3px 8px",cursor:"pointer",fontFamily:"monospace",flexShrink:0}}>
                          ✕
                        </button>
                      </div>
                    )}
                    {isConfirmingDelete&&(
                      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px"}}>
                        <span style={{flex:1,fontSize:11,color:"#ee6666",fontFamily:"monospace"}}>Delete {p.name}? This cannot be undone.</span>
                        <button onClick={()=>handleDeleteProfile(p.name,lower)}
                          style={{background:"#3a0808",border:"1px solid #cc2222",borderRadius:5,color:"#ff6666",fontSize:10,padding:"4px 10px",cursor:"pointer",fontFamily:"monospace"}}>
                          Delete
                        </button>
                        <button onClick={()=>setConfirmDelete(null)}
                          style={{background:"none",border:`1px solid ${dex.screenDim}`,borderRadius:5,color:dex.screenMuted,fontSize:10,padding:"4px 8px",cursor:"pointer",fontFamily:"monospace"}}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div>
          <p style={{color:dex.screenHeading,fontSize:11,fontFamily:"monospace",margin:"0 0 8px",textTransform:"uppercase",letterSpacing:"0.05em"}}>
            {savedProfiles.length>0?"New trainer":"Enter your trainer name to begin"}
          </p>
          <div style={{display:"flex",gap:8}}>
            <DexInput value={inputName} onChange={(e:any)=>setInputName(e.target.value)} onKeyDown={(e:any)=>e.key==="Enter"&&handleLogin()} placeholder="Trainer name..." style={{flex:1}}/>
            <DexButton onClick={()=>handleLogin()}>START</DexButton>
          </div>
        </div>
      </div>
      <div style={{background:dex.red,padding:"10px 16px",display:"flex",justifyContent:"flex-end",gap:8,flexShrink:0}}>
        <div style={{width:40,height:8,borderRadius:4,background:dex.darkRed}}/>
        <div style={{width:24,height:8,borderRadius:4,background:dex.darkRed}}/>
      </div>
    </div>
    </div>
  );

  return (
    <div className="dex-viewport">
    <div className="dex-shell">
      <div style={{background:dex.red,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",flexShrink:0}}>
        <DexLights/>
        <span style={{color:"#fff",fontWeight:500,fontSize:13,fontFamily:"monospace",marginLeft:4}}>POKÉDEX</span>
        <span style={{color:"rgba(255,255,255,0.6)",fontSize:12,fontFamily:"monospace"}}>— {username}</span>
        {saving&&<span style={{fontSize:11,color:"rgba(255,255,255,0.5)",fontFamily:"monospace"}}>saving...</span>}
        <span style={{marginLeft:"auto",fontSize:10,color:"rgba(255,255,255,0.35)",fontFamily:"monospace"}}>v0.1.0</span>
        {/* Gear / Settings */}
        <div style={{position:"relative"}}>
          <button onClick={()=>setSettingsOpen(v=>!v)}
            style={{background:settingsOpen?"rgba(255,255,255,0.15)":"none",border:"1px solid rgba(255,255,255,0.3)",borderRadius:6,color:"rgba(255,255,255,0.7)",fontSize:15,width:30,height:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>
            ⚙
          </button>
          {settingsOpen&&(
            <div onClick={e=>e.stopPropagation()}
              style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:200,background:dex.screen,border:`1px solid ${dex.screenDim}`,borderRadius:8,minWidth:200,boxShadow:"0 4px 16px rgba(0,0,0,0.5)",overflow:"hidden"}}>
              {/* Header */}
              <div style={{padding:"8px 12px",borderBottom:`1px solid ${dex.screenDim}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:11,color:dex.screenHeading,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.05em"}}>Settings</span>
                <button onClick={()=>setSettingsOpen(false)} style={{background:"none",border:"none",color:dex.screenMuted,fontSize:14,cursor:"pointer",lineHeight:1,padding:0}}>✕</button>
              </div>
              {/* Cache section */}
              <div style={{padding:"10px 12px",borderBottom:`1px solid ${dex.screenDim}`}}>
                <p style={{margin:"0 0 6px",fontSize:10,color:dex.screenMuted,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.05em"}}>Data Cache</p>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                  <span style={{fontSize:11,color:dex.screenText,fontFamily:"monospace"}}>
                    {cacheSize>0?`${cacheSize} entries cached`:"No cache"}
                  </span>
                  <button onClick={()=>{handleClearCache();setSettingsOpen(false);}}
                    disabled={cacheSize===0}
                    style={{background:"transparent",border:`1px solid ${cacheSize>0?"#ee6666":dex.screenDim}`,borderRadius:5,color:cacheSize>0?"#ee6666":dex.screenMuted,fontSize:10,padding:"3px 10px",cursor:cacheSize>0?"pointer":"default",fontFamily:"monospace",opacity:cacheSize===0?0.4:1}}>
                    Clear
                  </button>
                </div>
                <p style={{margin:"4px 0 0",fontSize:10,color:dex.screenMuted,fontFamily:"monospace",lineHeight:1.5}}>
                  Cached data expires after 7 days.<br/>Clearing forces a fresh fetch from PokéAPI.
                </p>
              </div>
              {/* Logout section */}
              <div style={{padding:"10px 12px"}}>
                <button onClick={()=>{handleLogout();setSettingsOpen(false);}}
                  style={{width:"100%",background:"transparent",border:`1px solid ${dex.screenDim}`,borderRadius:6,color:dex.screenMuted,fontSize:11,padding:"6px 12px",cursor:"pointer",fontFamily:"monospace",textAlign:"left"}}>
                  ⏻ &nbsp;Log out ({username})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{background:dex.darkRed,display:"flex",padding:"0 14px",gap:2,flexShrink:0}}>
        {[{id:"home",label:"HOME"},{id:"tracker",label:"TRACKER"},{id:"team",label:"TEAMS"},{id:"items",label:"ITEMS"},{id:"types",label:"TYPE CHART"},{id:"friends",label:"FRIENDS"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{fontSize:12,fontFamily:"monospace",padding:"7px 14px",cursor:"pointer",border:"none",background:tab===t.id?dex.screen:"transparent",color:tab===t.id?dex.screenText:"rgba(255,255,255,0.55)",borderRadius:"6px 6px 0 0"}}>{t.label}</button>
        ))}
      </div>
      <div className="dex-screen" style={{...screenStyle,margin:"0 12px 0",borderRadius:"0 8px 8px 8px"}}>
        {tab==="home"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {/* Overall living dex progress */}
            <div style={{background:dex.screenBg,borderRadius:8,border:`1px solid ${dex.screenDim}`,padding:"12px 14px"}}>
              <p style={{margin:"0 0 8px",fontSize:10,color:dex.screenHeading,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.05em"}}>Overall Progress</p>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:22,fontWeight:600,color:dex.screenText,fontFamily:"monospace"}}>{Object.values(caught).filter(Boolean).length}</span>
                <span style={{fontSize:13,color:dex.screenMuted,fontFamily:"monospace"}}>/ {allPokemon.length} Pokémon</span>
                <div style={{flex:1,height:8,background:dex.screenDim,borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:4,width:`${Math.round((Object.values(caught).filter(Boolean).length/allPokemon.length)*100)}%`,background:Object.values(caught).filter(Boolean).length===allPokemon.length?"#55cc55":"#378ADD",transition:"width 0.3s"}}/>
                </div>
                <span style={{fontSize:13,color:dex.screenMuted,fontFamily:"monospace",whiteSpace:"nowrap"}}>{Math.round((Object.values(caught).filter(Boolean).length/allPokemon.length)*100)}%</span>
              </div>
            </div>
            {/* Per-generation cards */}
            <p style={{margin:"0 0 2px",fontSize:10,color:dex.screenHeading,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.05em"}}>By Generation</p>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {GENERATIONS.map(g=>{
                const gTotal=g.end-g.start+1;
                const gCaught=allPokemon.filter(p=>p.gen===g.num&&caught[p.id]).length;
                const gPct=Math.round((gCaught/gTotal)*100);
                const complete=gCaught===gTotal;
                return (
                  <div key={g.num} style={{background:dex.screenBg,borderRadius:8,border:`1px solid ${complete?"#55cc5544":dex.screenDim}`,padding:"12px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <span style={{fontSize:13,fontWeight:600,color:complete?"#55cc55":dex.screenText,fontFamily:"monospace"}}>{g.label}</span>
                      {complete&&<span style={{fontSize:10,color:"#55cc55",fontFamily:"monospace"}}>✓ COMPLETE</span>}
                      <span style={{marginLeft:"auto",fontSize:12,color:dex.screenMuted,fontFamily:"monospace"}}>{gCaught}/{gTotal}</span>
                      <span style={{fontSize:12,color:complete?"#55cc55":dex.screenMuted,fontFamily:"monospace",minWidth:36,textAlign:"right"}}>{gPct}%</span>
                    </div>
                    <div style={{height:6,background:dex.screenDim,borderRadius:3,overflow:"hidden",marginBottom:8}}>
                      <div style={{height:"100%",borderRadius:3,width:`${gPct}%`,background:complete?"#55cc55":"#378ADD",transition:"width 0.3s"}}/>
                    </div>
                    {/* Game logo badges */}
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                      {g.games.map(game=>(
                        <span key={game.name} style={{fontSize:11,fontWeight:500,padding:"2px 8px",borderRadius:4,background:game.bg,color:game.color,border:`1.5px solid ${game.border}`,fontFamily:"monospace",whiteSpace:"nowrap",letterSpacing:"0.3px"}}>
                          {game.name}
                        </span>
                      ))}
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontSize:10,color:dex.screenMuted,fontFamily:"monospace"}}>#{String(g.start).padStart(3,"0")} — #{String(g.end).padStart(3,"0")}</span>
                      <span style={{fontSize:10,color:dex.screenMuted,fontFamily:"monospace"}}>{gTotal-gCaught} remaining</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {tab==="tracker"&&(
          <>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              {/* Waffle button */}
              <div style={{position:"relative"}}>
                <button onClick={()=>setWaffleOpen(v=>!v)}
                  title="Filter generations"
                  style={{background:waffleOpen?"rgba(255,255,255,0.08)":"transparent",border:`1px solid ${waffleOpen?dex.screenText:dex.screenDim}`,borderRadius:6,color:waffleOpen?dex.screenText:dex.screenMuted,width:30,height:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>
                  ⊞
                </button>
                {waffleOpen&&(
                  <div onClick={e=>e.stopPropagation()}
                    style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:200,background:dex.screen,border:`1px solid ${dex.screenDim}`,borderRadius:8,minWidth:180,boxShadow:"0 4px 16px rgba(0,0,0,0.5)",overflow:"hidden"}}>
                    <div style={{padding:"8px 12px",borderBottom:`1px solid ${dex.screenDim}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={{fontSize:10,color:dex.screenHeading,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.05em"}}>Generations</span>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>setGenFilter(new Set(GENERATIONS.map(g=>g.num)))}
                          style={{fontSize:9,fontFamily:"monospace",color:dex.screenMuted,background:"none",border:`1px solid ${dex.screenDim}`,borderRadius:4,padding:"1px 6px",cursor:"pointer"}}>All</button>
                        <button onClick={()=>setGenFilter(new Set([GENERATIONS[0].num]))}
                          style={{fontSize:9,fontFamily:"monospace",color:dex.screenMuted,background:"none",border:`1px solid ${dex.screenDim}`,borderRadius:4,padding:"1px 6px",cursor:"pointer"}}>None</button>
                        <button onClick={()=>setWaffleOpen(false)}
                          style={{background:"none",border:"none",color:dex.screenMuted,fontSize:13,cursor:"pointer",lineHeight:1,padding:0}}>✕</button>
                      </div>
                    </div>
                    <div style={{padding:"8px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                      {GENERATIONS.map(g=>{
                        const on=genFilter.has(g.num);
                        const gCaught=allPokemon.filter(p=>p.gen===g.num&&caught[p.id]).length;
                        const gTotal=g.end-g.start+1;
                        return (
                          <button key={g.num} onClick={()=>setGenFilter(prev=>{
                            const next=new Set(prev);
                            if(on&&next.size===1)return next;
                            on?next.delete(g.num):next.add(g.num);
                            return next;
                          })}
                            style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:3,padding:"7px 10px",borderRadius:6,border:`1px solid ${on?dex.red:dex.screenDim}`,background:on?dex.red+"22":"transparent",cursor:"pointer",textAlign:"left"}}>
                            <span style={{fontSize:11,fontFamily:"monospace",color:on?"#ff8888":dex.screenMuted,fontWeight:on?600:400}}>{g.label}</span>
                            <div style={{width:"100%",height:3,background:dex.screenDim,borderRadius:2,overflow:"hidden"}}>
                              <div style={{height:"100%",borderRadius:2,width:`${Math.round((gCaught/gTotal)*100)}%`,background:gCaught===gTotal?"#55cc55":"#378ADD"}}/>
                            </div>
                            <span style={{fontSize:9,fontFamily:"monospace",color:dex.screenMuted}}>{gCaught}/{gTotal}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {/* Total progress */}
              <span style={{fontSize:12,color:dex.screenText,fontFamily:"monospace",fontWeight:500,whiteSpace:"nowrap"}}>{caughtCount}/{total}</span>
              <div style={{flex:1,height:6,background:dex.screenDim,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:3,width:`${total>0?Math.round((caughtCount/total)*100):0}%`,background:caughtCount===total?"#55cc55":"#378ADD",transition:"width 0.3s"}}/>
              </div>
              <span style={{fontSize:11,color:dex.screenMuted,fontFamily:"monospace",whiteSpace:"nowrap"}}>{total>0?Math.round((caughtCount/total)*100):0}%</span>
              <DexButton onClick={()=>setGenVisible(v=>!v)} style={{fontSize:11,padding:"3px 10px",flexShrink:0}}>
                {genVisible?"HIDE":"SHOW"}
              </DexButton>
            </div>
            {genVisible&&(
              <>
                <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
                  <DexInput value={search} onChange={(e:any)=>setSearch(e.target.value)} placeholder="Search name or #..." style={{flex:1,minWidth:110}}/>
                  <DexSelect value={filter} onChange={(e:any)=>setFilter(e.target.value)}>
                    <option value="all">All</option>
                    <option value="caught">Caught</option>
                    <option value="missing">Missing</option>
                  </DexSelect>
                  <div style={{display:"flex",border:`1px solid ${dex.screenDim}`,borderRadius:6,overflow:"hidden"}}>
                    {[["grid","⊞"],["list","☰"]].map(([mode,icon])=>(
                      <button key={mode} onClick={()=>setViewMode(mode)} style={{padding:"4px 10px",fontSize:14,border:"none",cursor:"pointer",fontFamily:"monospace",background:viewMode===mode?dex.red:"transparent",color:viewMode===mode?"#fff":dex.screenMuted}}>{icon}</button>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <DexInput value={quickEntry} onChange={(e:any)=>setQuickEntry(e.target.value)} onKeyDown={handleQuick} placeholder="Quick toggle: name or # + Enter" style={{flex:1}}/>
                  {quickFeedback&&<span style={{fontSize:11,color:"#88cc88",fontFamily:"monospace",whiteSpace:"nowrap"}}>{quickFeedback}</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                  <DexButton onClick={()=>{setSelectMode(v=>!v);if(selectMode)exitSelectMode();}} active={selectMode} style={{fontSize:11,padding:"3px 10px"}}>
                    {selectMode?"Exit select (S)":"Select (S)"}
                  </DexButton>
                  {selectMode&&!selected.size&&<span style={{fontSize:11,color:dex.screenMuted,fontFamily:"monospace"}}>tap to pick · long press to anchor range · shift+click on desktop</span>}
                  {selectMode&&selected.size>0&&!rangeAnchor&&<span style={{fontSize:11,color:dex.screenMuted,fontFamily:"monospace"}}>long press to set range anchor</span>}
                  {rangeAnchor&&<span style={{fontSize:11,color:"#ffcc44",fontFamily:"monospace"}}>⚓ anchor set — tap another to complete range</span>}
                  {selected.size>0&&<>
                    <span style={{fontSize:11,color:dex.screenMuted,fontFamily:"monospace"}}>{selected.size} selected</span>
                    <DexButton onClick={()=>applyBulk(true)} style={{fontSize:11,padding:"3px 10px",background:"#1a3a1a",borderColor:"#3a6a2a",color:"#88cc88"}}>Mark caught</DexButton>
                    <DexButton onClick={()=>applyBulk(false)} style={{fontSize:11,padding:"3px 10px"}}>Mark missing</DexButton>
                    <DexButton onClick={()=>{setSelected(new Set());setLastClicked(null);}} style={{fontSize:11,padding:"3px 10px"}}>Clear</DexButton>
                  </>}
                </div>
                {viewMode==="grid"
                  ?<div onMouseDown={e=>{if(e.shiftKey)e.preventDefault();}} style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(96px,1fr))",gap:6,userSelect:"none",WebkitUserSelect:"none" as any}}>
                    {renderedList.map((mon:any)=><GridCard key={mon.id} mon={mon} caught={!!caught[mon.id]} selected={selected.has(mon.id)} selectMode={selectMode} isAnchor={rangeAnchor===mon.id} onToggle={toggleCaught} onDetail={setDetail} onCardClick={handleCardClick} onCheckbox={toggleCheckbox} onLongPress={handleLongPress}/>)}
                  </div>
                  :<div onMouseDown={e=>{if(e.shiftKey)e.preventDefault();}} style={{border:`1px solid ${dex.screenDim}`,borderRadius:8,overflow:"hidden",userSelect:"none",WebkitUserSelect:"none" as any}}>
                    {renderedList.map((mon:any)=><ListRow key={mon.id} mon={mon} caught={!!caught[mon.id]} selected={selected.has(mon.id)} selectMode={selectMode} isAnchor={rangeAnchor===mon.id} onToggle={toggleCaught} onDetail={setDetail} onCardClick={handleCardClick} onCheckbox={toggleCheckbox} onLongPress={handleLongPress}/>)}
                  </div>
                }
                {renderLimit < filtered.length && (
                  <p style={{color:dex.screenMuted,fontSize:11,textAlign:"center",padding:"8px 0",fontFamily:"monospace"}}>Loading...</p>
                )}
                {filtered.length===0&&<p style={{color:dex.screenMuted,fontSize:13,textAlign:"center",padding:"2rem 0",fontFamily:"monospace"}}>No Pokémon found.</p>}
              </>
            )}
          </>
        )}
        {tab==="items"&&<ItemFinder/>}
        {tab==="team"&&<TeamBuilder username={username}/>}
        {tab==="types"&&<TypeChart/>}
        {tab==="friends"&&(
          <>
            <p style={{color:dex.screenHeading,fontSize:12,marginBottom:14,fontFamily:"monospace"}}>Share your trainer name so friends can find you here.</p>
            {friends.length===0
              ?<p style={{color:dex.screenMuted,fontSize:13,fontFamily:"monospace"}}>No trainers found yet.</p>
              :<div style={{display:"flex",flexDirection:"column",gap:6}}>
                {friends.map((f,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:f.name.toLowerCase()===username.toLowerCase()?"#0d1a2a":dex.screenBg,borderRadius:8,border:`1px solid ${f.name.toLowerCase()===username.toLowerCase()?"#334488":dex.screenDim}`}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:dex.screenDim,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:500,fontSize:12,color:dex.screenText,fontFamily:"monospace",border:`1px solid ${dex.screenBorder}`}}>{f.name[0].toUpperCase()}</div>
                    <span style={{fontFamily:"monospace",fontSize:13,color:dex.screenText,fontWeight:500}}>{f.name}</span>
                    {f.name.toLowerCase()===username.toLowerCase()&&<span style={{fontSize:10,color:"#8888ff",fontFamily:"monospace"}}>(you)</span>}
                    <span style={{marginLeft:"auto",fontSize:12,color:dex.screenMuted,fontFamily:"monospace"}}>{f.count}/{total} · {Math.round((f.count/total)*100)}%</span>
                    <div style={{width:70,height:5,background:dex.screenDim,borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:3,width:`${Math.round((f.count/total)*100)}%`,background:f.count===total?"#55cc55":"#378ADD"}}/>
                    </div>
                  </div>
                ))}
              </div>
            }
          </>
        )}
      </div>
      <div style={{background:dex.red,padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <div style={{display:"flex",gap:4}}>
          <div style={{width:14,height:14,borderRadius:"50%",background:dex.darkRed,border:"1px solid rgba(0,0,0,0.2)"}}/>
          <div style={{width:14,height:14,borderRadius:"50%",background:dex.darkRed,border:"1px solid rgba(0,0,0,0.2)"}}/>
        </div>
        <div style={{display:"flex",gap:6}}>
          <div style={{width:36,height:7,borderRadius:4,background:dex.darkRed}}/>
          <div style={{width:22,height:7,borderRadius:4,background:dex.darkRed}}/>
        </div>
      </div>
      {detail&&<DetailPanel key={`${detail.id}`} mon={{...detail,types:pokemonTypes[detail.id]||detail.types||[]}} onClose={()=>setDetail(null)} onTypesLoaded={handleTypesLoaded}/>}
    </div>
    </div>
  );
}

export default function App(){
  return <ErrorBoundary><AppInner/></ErrorBoundary>;
}
