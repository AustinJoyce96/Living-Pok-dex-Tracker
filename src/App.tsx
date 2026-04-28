import { useState, useEffect, useCallback } from "react";

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

const pokeCache: {[key:string]:any} = {};
const fetchPoke = async (url:string) => {
  if (pokeCache[url]) return pokeCache[url];
  const r = await fetch(url);
  const d = await r.json();
  pokeCache[url] = d;
  return d;
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

const CATCH_DATA = {
  1:{types:["grass","poison"],games:[{game:"Red/Blue",locations:[{name:"Pallet Town (Starter)",method:"starter"}]},{game:"FireRed/LeafGreen",locations:[{name:"Pallet Town (Starter)",method:"starter"}]}]},
  2:{types:["grass","poison"],games:[{game:"Red/Blue",locations:[{name:"Evolve Bulbasaur",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Bulbasaur",method:"evolve"}]}]},
  3:{types:["grass","poison"],games:[{game:"Red/Blue",locations:[{name:"Evolve Ivysaur",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Ivysaur",method:"evolve"}]}]},
  4:{types:["fire"],games:[{game:"Red/Blue",locations:[{name:"Pallet Town (Starter)",method:"starter"}]},{game:"FireRed/LeafGreen",locations:[{name:"Pallet Town (Starter)",method:"starter"}]}]},
  5:{types:["fire"],games:[{game:"Red/Blue",locations:[{name:"Evolve Charmander",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Charmander",method:"evolve"}]}]},
  6:{types:["fire","flying"],games:[{game:"Red/Blue",locations:[{name:"Evolve Charmeleon",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Charmeleon",method:"evolve"}]}]},
  7:{types:["water"],games:[{game:"Red/Blue",locations:[{name:"Pallet Town (Starter)",method:"starter"}]},{game:"FireRed/LeafGreen",locations:[{name:"Pallet Town (Starter)",method:"starter"}]}]},
  8:{types:["water"],games:[{game:"Red/Blue",locations:[{name:"Evolve Squirtle",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Squirtle",method:"evolve"}]}]},
  9:{types:["water"],games:[{game:"Red/Blue",locations:[{name:"Evolve Wartortle",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Wartortle",method:"evolve"}]}]},
  10:{types:["bug"],games:[{game:"Red/Blue",locations:[{name:"Viridian Forest",method:"wild",rate:"20%"},{name:"Route 2",method:"wild",rate:"5%"}]},{game:"Yellow",locations:[{name:"Viridian Forest",method:"wild",rate:"25%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Viridian Forest",method:"wild",rate:"20%"},{name:"Pattern Bush",method:"wild",rate:"30%"}]}]},
  11:{types:["bug"],games:[{game:"Red/Blue",locations:[{name:"Viridian Forest",method:"wild",rate:"15%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Viridian Forest",method:"wild",rate:"15%"}]}]},
  12:{types:["bug","flying"],games:[{game:"Red/Blue",locations:[{name:"Evolve Metapod",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Metapod",method:"evolve"}]}]},
  13:{types:["bug","poison"],games:[{game:"Red/Blue",locations:[{name:"Viridian Forest",method:"wild",rate:"15%"}]},{game:"Yellow",locations:[{name:"Viridian Forest",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Viridian Forest",method:"wild",rate:"15%"}]}]},
  14:{types:["bug","poison"],games:[{game:"Red/Blue",locations:[{name:"Viridian Forest",method:"wild",rate:"10%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Viridian Forest",method:"wild",rate:"10%"}]}]},
  15:{types:["bug","poison"],games:[{game:"Red/Blue",locations:[{name:"Evolve Kakuna",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Kakuna",method:"evolve"}]}]},
  16:{types:["normal","flying"],games:[{game:"Red/Blue",locations:[{name:"Routes 1, 2, 3",method:"wild",rate:"50%"}]},{game:"Yellow",locations:[{name:"Routes 1, 2",method:"wild",rate:"50%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 1, 2, 3",method:"wild",rate:"45%"}]}]},
  17:{types:["normal","flying"],games:[{game:"Red/Blue",locations:[{name:"Routes 13-15, 21",method:"wild",rate:"25%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 13-15, 21",method:"wild",rate:"20%"}]}]},
  18:{types:["normal","flying"],games:[{game:"Red/Blue",locations:[{name:"Evolve Pidgeotto",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Route 1 (FireRed only)",method:"wild",rate:"5%"}]}]},
  19:{types:["normal"],games:[{game:"Red/Blue",locations:[{name:"Routes 1, 2, 22",method:"wild",rate:"50%"}]},{game:"Yellow",locations:[{name:"Routes 1, 2",method:"wild",rate:"50%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 1, 2, 22",method:"wild",rate:"50%"}]}]},
  20:{types:["normal"],games:[{game:"Red/Blue",locations:[{name:"Routes 16-18, 21",method:"wild",rate:"35%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 16-18, 21",method:"wild",rate:"30%"}]}]},
  21:{types:["normal","flying"],games:[{game:"Red/Blue",locations:[{name:"Routes 3, 4, 22",method:"wild",rate:"30%"}]},{game:"Yellow",locations:[{name:"Routes 3, 9-10",method:"wild",rate:"35%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 3, 4, 9, 10",method:"wild",rate:"30%"}]}]},
  22:{types:["normal","flying"],games:[{game:"Red/Blue",locations:[{name:"Routes 9, 10, 23",method:"wild",rate:"30%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 23, 27, 28",method:"wild",rate:"25%"}]}]},
  23:{types:["poison"],games:[{game:"Red",locations:[{name:"Routes 4, 6, 8, 10",method:"wild",rate:"25%"}]},{game:"FireRed",locations:[{name:"Routes 4, 6, 8, 10, 11",method:"wild",rate:"20%"}]}]},
  24:{types:["poison"],games:[{game:"Red",locations:[{name:"Safari Zone",method:"wild",rate:"15%"}]},{game:"FireRed",locations:[{name:"Safari Zone",method:"wild",rate:"10%"}]}]},
  25:{types:["electric"],games:[{game:"Yellow",locations:[{name:"Pallet Town (Starter)",method:"starter"}]},{game:"Red/Blue",locations:[{name:"Viridian Forest",method:"wild",rate:"5%"},{name:"Power Plant",method:"wild",rate:"25%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Viridian Forest",method:"wild",rate:"5%"},{name:"Power Plant",method:"wild",rate:"25%"}]}]},
  26:{types:["electric"],games:[{game:"Red/Blue",locations:[{name:"Evolve Pikachu",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Pikachu",method:"evolve"}]}]},
  27:{types:["ground"],games:[{game:"Red/Blue",locations:[{name:"Routes 4, 11",method:"wild",rate:"40%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 4, 11",method:"wild",rate:"35%"}]}]},
  28:{types:["ground"],games:[{game:"Red/Blue",locations:[{name:"Routes 17, 23",method:"wild",rate:"25%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 17, 23",method:"wild",rate:"20%"}]}]},
  29:{types:["poison"],games:[{game:"Red/Blue",locations:[{name:"Routes 2, 22",method:"wild",rate:"45%"}]},{game:"Yellow",locations:[{name:"Routes 2, 22",method:"wild",rate:"50%"}]},{game:"FireRed",locations:[{name:"Routes 2, 22",method:"wild",rate:"45%"}]}]},
  30:{types:["poison"],games:[{game:"Red/Blue",locations:[{name:"Safari Zone",method:"wild",rate:"25%"}]},{game:"FireRed",locations:[{name:"Safari Zone",method:"wild",rate:"20%"}]}]},
  31:{types:["poison","ground"],games:[{game:"Red/Blue",locations:[{name:"Evolve Nidorina (Moon Stone)",method:"evolve"}]},{game:"FireRed",locations:[{name:"Evolve Nidorina (Moon Stone)",method:"evolve"}]}]},
  32:{types:["poison"],games:[{game:"Red/Blue",locations:[{name:"Route 22",method:"wild",rate:"45%"}]},{game:"Yellow",locations:[{name:"Routes 2, 22",method:"wild",rate:"50%"}]},{game:"LeafGreen",locations:[{name:"Routes 2, 22",method:"wild",rate:"45%"}]}]},
  33:{types:["poison"],games:[{game:"Red/Blue",locations:[{name:"Safari Zone",method:"wild",rate:"25%"}]},{game:"LeafGreen",locations:[{name:"Safari Zone",method:"wild",rate:"20%"}]}]},
  34:{types:["poison","ground"],games:[{game:"Red/Blue",locations:[{name:"Evolve Nidorino (Moon Stone)",method:"evolve"}]},{game:"LeafGreen",locations:[{name:"Evolve Nidorino (Moon Stone)",method:"evolve"}]}]},
  35:{types:["normal","fairy"],games:[{game:"Red/Blue",locations:[{name:"Mt. Moon",method:"wild",rate:"10%"}]},{game:"Yellow",locations:[{name:"Mt. Moon",method:"wild",rate:"10%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Mt. Moon",method:"wild",rate:"10%"}]}]},
  36:{types:["normal","fairy"],games:[{game:"Red/Blue",locations:[{name:"Evolve Clefairy (Moon Stone)",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Clefairy (Moon Stone)",method:"evolve"}]}]},
  37:{types:["fire"],games:[{game:"Red",locations:[{name:"Routes 5-8",method:"wild",rate:"25%"}]},{game:"FireRed",locations:[{name:"Routes 5-8",method:"wild",rate:"20%"}]}]},
  38:{types:["fire"],games:[{game:"Red",locations:[{name:"Evolve Vulpix (Fire Stone)",method:"evolve"}]},{game:"FireRed",locations:[{name:"Evolve Vulpix (Fire Stone)",method:"evolve"}]}]},
  39:{types:["normal","fairy"],games:[{game:"Red/Blue",locations:[{name:"Routes 3, 4",method:"wild",rate:"25%"}]},{game:"Yellow",locations:[{name:"Routes 3, 4",method:"wild",rate:"25%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 3, 4",method:"wild",rate:"20%"}]}]},
  40:{types:["normal","fairy"],games:[{game:"Red/Blue",locations:[{name:"Evolve Jigglypuff (Moon Stone)",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Jigglypuff (Moon Stone)",method:"evolve"}]}]},
  41:{types:["poison","flying"],games:[{game:"Red/Blue",locations:[{name:"Mt. Moon, Caves",method:"wild",rate:"50%"}]},{game:"Yellow",locations:[{name:"Mt. Moon",method:"wild",rate:"40%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Mt. Moon, Seafoam Islands",method:"wild",rate:"45%"}]}]},
  42:{types:["poison","flying"],games:[{game:"Red/Blue",locations:[{name:"Pokemon Mansion, Victory Road",method:"wild",rate:"30%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Victory Road, Cerulean Cave",method:"wild",rate:"25%"}]}]},
  43:{types:["grass","poison"],games:[{game:"Red/Blue",locations:[{name:"Routes 5-8, 12-15",method:"wild",rate:"25%"}]},{game:"Yellow",locations:[{name:"Routes 5-8",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 5-8, 12-15",method:"wild",rate:"20%"}]}]},
  44:{types:["grass","poison"],games:[{game:"Red/Blue",locations:[{name:"Safari Zone",method:"wild",rate:"25%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Safari Zone",method:"wild",rate:"20%"}]}]},
  45:{types:["grass","poison"],games:[{game:"Red/Blue",locations:[{name:"Evolve Gloom (Leaf Stone)",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Gloom (Leaf Stone)",method:"evolve"}]}]},
  46:{types:["bug","grass"],games:[{game:"Red/Blue",locations:[{name:"Mt. Moon, Cerulean Cave",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Mt. Moon",method:"wild",rate:"15%"}]}]},
  47:{types:["bug","grass"],games:[{game:"Red/Blue",locations:[{name:"Safari Zone, Cerulean Cave",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Safari Zone",method:"wild",rate:"15%"}]}]},
  48:{types:["bug","poison"],games:[{game:"Red/Blue",locations:[{name:"Routes 12-15, 24-25",method:"wild",rate:"25%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 12-15, 24-25",method:"wild",rate:"20%"}]}]},
  49:{types:["bug","poison"],games:[{game:"Red/Blue",locations:[{name:"Routes 14, 15, 24, 25",method:"wild",rate:"15%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 14, 15",method:"wild",rate:"10%"}]}]},
  50:{types:["ground"],games:[{game:"Red/Blue",locations:[{name:"Routes 6, 7, 11",method:"wild",rate:"25%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 6, 7, 11",method:"wild",rate:"20%"}]}]},
  51:{types:["ground"],games:[{game:"Red/Blue",locations:[{name:"Routes 6, 7, 11",method:"wild",rate:"15%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 6, 7, 11",method:"wild",rate:"10%"}]}]},
  52:{types:["normal"],games:[{game:"Blue",locations:[{name:"Routes 5-8",method:"wild",rate:"25%"}]},{game:"Yellow",locations:[{name:"Routes 5-8",method:"wild",rate:"20%"}]},{game:"LeafGreen",locations:[{name:"Routes 5-8",method:"wild",rate:"20%"}]}]},
  53:{types:["normal"],games:[{game:"Blue",locations:[{name:"Routes 17, 18",method:"wild",rate:"20%"}]},{game:"LeafGreen",locations:[{name:"Routes 17, 18",method:"wild",rate:"15%"}]}]},
  54:{types:["water"],games:[{game:"Red/Blue",locations:[{name:"Routes 6, 24, 25",method:"wild",rate:"20%"}]},{game:"Yellow",locations:[{name:"Routes 6, 24, 25",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 6, 24, 25",method:"wild",rate:"15%"}]}]},
  55:{types:["water"],games:[{game:"Red/Blue",locations:[{name:"Safari Zone",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Safari Zone",method:"wild",rate:"15%"}]}]},
  56:{types:["fighting"],games:[{game:"Red/Blue",locations:[{name:"Routes 5-8",method:"wild",rate:"20%"}]},{game:"FireRed",locations:[{name:"Routes 5-8",method:"wild",rate:"20%"}]}]},
  57:{types:["fighting"],games:[{game:"Red/Blue",locations:[{name:"Routes 23, Victory Road",method:"wild",rate:"20%"}]},{game:"FireRed",locations:[{name:"Routes 23, Victory Road",method:"wild",rate:"15%"}]}]},
  58:{types:["fire"],games:[{game:"Red/Blue",locations:[{name:"Routes 7, 8",method:"wild",rate:"20%"}]},{game:"FireRed",locations:[{name:"Routes 7, 8",method:"wild",rate:"20%"}]}]},
  59:{types:["fire"],games:[{game:"Red/Blue",locations:[{name:"Evolve Growlithe (Fire Stone)",method:"evolve"}]},{game:"FireRed",locations:[{name:"Evolve Growlithe (Fire Stone)",method:"evolve"}]}]},
  60:{types:["water"],games:[{game:"Red/Blue",locations:[{name:"Routes 22, 28 (surf)",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Route 22 (surf)",method:"wild",rate:"20%"}]}]},
  61:{types:["water"],games:[{game:"Red/Blue",locations:[{name:"Routes 22, Seafoam",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Celadon City (surf)",method:"wild",rate:"15%"}]}]},
  62:{types:["water","fighting"],games:[{game:"Red/Blue",locations:[{name:"Evolve Poliwhirl (Water Stone)",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Poliwhirl (Water Stone)",method:"evolve"}]}]},
  63:{types:["psychic"],games:[{game:"Red/Blue",locations:[{name:"Routes 24, 25",method:"wild",rate:"15%"}]},{game:"Yellow",locations:[{name:"Routes 24, 25",method:"wild",rate:"10%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 24, 25",method:"wild",rate:"10%"}]}]},
  64:{types:["psychic"],games:[{game:"Red/Blue",locations:[{name:"Evolve Abra",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Abra",method:"evolve"}]}]},
  65:{types:["psychic"],games:[{game:"Red/Blue",locations:[{name:"Evolve Kadabra (trade)",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Kadabra (trade)",method:"evolve"}]}]},
  66:{types:["fighting"],games:[{game:"Red/Blue",locations:[{name:"Routes 22, Victory Road",method:"wild",rate:"25%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 22, Victory Road",method:"wild",rate:"20%"}]}]},
  67:{types:["fighting"],games:[{game:"Red/Blue",locations:[{name:"Victory Road",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Victory Road",method:"wild",rate:"15%"}]}]},
  68:{types:["fighting"],games:[{game:"Red/Blue",locations:[{name:"Evolve Machoke (trade)",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Machoke (trade)",method:"evolve"}]}]},
  69:{types:["grass","poison"],games:[{game:"Red/Blue",locations:[{name:"Routes 12, 13, 24, 25",method:"wild",rate:"20%"}]},{game:"FireRed",locations:[{name:"Routes 12, 13, 24, 25",method:"wild",rate:"20%"}]}]},
  70:{types:["grass","poison"],games:[{game:"Red/Blue",locations:[{name:"Routes 12, 13",method:"wild",rate:"10%"}]},{game:"FireRed",locations:[{name:"Routes 12, 13",method:"wild",rate:"10%"}]}]},
  71:{types:["grass","poison"],games:[{game:"Red/Blue",locations:[{name:"Evolve Weepinbell (Leaf Stone)",method:"evolve"}]},{game:"FireRed",locations:[{name:"Evolve Weepinbell (Leaf Stone)",method:"evolve"}]}]},
  72:{types:["water","poison"],games:[{game:"Red/Blue",locations:[{name:"Routes 18-20 (surf)",method:"wild",rate:"40%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 18-21 (surf)",method:"wild",rate:"35%"}]}]},
  73:{types:["water","poison"],games:[{game:"Red/Blue",locations:[{name:"Routes 19, 20 (surf)",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 19, 20 (surf)",method:"wild",rate:"15%"}]}]},
  74:{types:["rock","ground"],games:[{game:"Red/Blue",locations:[{name:"Mt. Moon, Rock Tunnel",method:"wild",rate:"40%"}]},{game:"Yellow",locations:[{name:"Mt. Moon, Rock Tunnel",method:"wild",rate:"35%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Mt. Moon, Rock Tunnel",method:"wild",rate:"35%"}]}]},
  75:{types:["rock","ground"],games:[{game:"Red/Blue",locations:[{name:"Victory Road",method:"wild",rate:"25%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Victory Road",method:"wild",rate:"20%"}]}]},
  76:{types:["rock","ground"],games:[{game:"Red/Blue",locations:[{name:"Evolve Graveler (trade)",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Graveler (trade)",method:"evolve"}]}]},
  77:{types:["fire"],games:[{game:"Red/Blue",locations:[{name:"Routes 17, 28",method:"wild",rate:"25%"}]},{game:"FireRed",locations:[{name:"Routes 17, 28",method:"wild",rate:"20%"}]}]},
  78:{types:["fire"],games:[{game:"Red/Blue",locations:[{name:"Routes 17, 28",method:"wild",rate:"15%"}]},{game:"FireRed",locations:[{name:"Routes 17, 28",method:"wild",rate:"10%"}]}]},
  79:{types:["water","psychic"],games:[{game:"Red/Blue",locations:[{name:"Routes 10, 12, 13 (surf)",method:"wild",rate:"30%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 10, 12, 13 (surf)",method:"wild",rate:"25%"}]}]},
  80:{types:["water","psychic"],games:[{game:"Red/Blue",locations:[{name:"Evolve Slowpoke (Water Stone)",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Slowpoke (Water Stone)",method:"evolve"}]}]},
  81:{types:["electric","steel"],games:[{game:"Red/Blue",locations:[{name:"Routes 6, 11, Power Plant",method:"wild",rate:"25%"}]},{game:"Yellow",locations:[{name:"Power Plant",method:"wild",rate:"30%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 6, 11, Power Plant",method:"wild",rate:"20%"}]}]},
  82:{types:["electric","steel"],games:[{game:"Red/Blue",locations:[{name:"Power Plant",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Power Plant",method:"wild",rate:"15%"}]}]},
  83:{types:["normal","flying"],games:[{game:"Red/Blue",locations:[{name:"Routes 12, 13",method:"wild",rate:"20%"}]},{game:"Yellow",locations:[{name:"Vermilion City (trade)",method:"gift"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 12, 13",method:"wild",rate:"15%"}]}]},
  84:{types:["normal","flying"],games:[{game:"Red/Blue",locations:[{name:"Routes 16-18, 21",method:"wild",rate:"30%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 16-18, 21",method:"wild",rate:"25%"}]}]},
  85:{types:["normal","flying"],games:[{game:"Red/Blue",locations:[{name:"Routes 16-18",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 16-18",method:"wild",rate:"15%"}]}]},
  86:{types:["water"],games:[{game:"Red/Blue",locations:[{name:"Seafoam Islands",method:"wild",rate:"35%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Seafoam Islands",method:"wild",rate:"30%"}]}]},
  87:{types:["water","ice"],games:[{game:"Red/Blue",locations:[{name:"Seafoam Islands",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Seafoam Islands",method:"wild",rate:"15%"}]}]},
  88:{types:["poison"],games:[{game:"Red/Blue",locations:[{name:"Pokemon Mansion",method:"wild",rate:"30%"}]},{game:"FireRed",locations:[{name:"Pokemon Mansion",method:"wild",rate:"25%"}]}]},
  89:{types:["poison"],games:[{game:"Red/Blue",locations:[{name:"Pokemon Mansion",method:"wild",rate:"15%"}]},{game:"FireRed",locations:[{name:"Pokemon Mansion",method:"wild",rate:"10%"}]}]},
  90:{types:["water"],games:[{game:"Red/Blue",locations:[{name:"Routes 17-20 (surf)",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 17-20 (surf)",method:"wild",rate:"15%"}]}]},
  91:{types:["water","ice"],games:[{game:"Red/Blue",locations:[{name:"Evolve Shellder (Water Stone)",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Shellder (Water Stone)",method:"evolve"}]}]},
  92:{types:["ghost","poison"],games:[{game:"Red/Blue",locations:[{name:"Pokemon Tower",method:"wild",rate:"50%"}]},{game:"Yellow",locations:[{name:"Pokemon Tower",method:"wild",rate:"45%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Pokemon Tower",method:"wild",rate:"45%"}]}]},
  93:{types:["ghost","poison"],games:[{game:"Red/Blue",locations:[{name:"Pokemon Tower",method:"wild",rate:"25%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Pokemon Tower",method:"wild",rate:"20%"}]}]},
  94:{types:["ghost","poison"],games:[{game:"Red/Blue",locations:[{name:"Evolve Haunter (trade)",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Haunter (trade)",method:"evolve"}]}]},
  95:{types:["rock","ground"],games:[{game:"Red/Blue",locations:[{name:"Rock Tunnel, Victory Road",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Rock Tunnel, Victory Road",method:"wild",rate:"15%"}]}]},
  96:{types:["psychic"],games:[{game:"Red/Blue",locations:[{name:"Routes 11, 12, 24, 25",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 11, 12",method:"wild",rate:"20%"}]}]},
  97:{types:["psychic"],games:[{game:"Red/Blue",locations:[{name:"Routes 13, 14, 15",method:"wild",rate:"15%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 13-15",method:"wild",rate:"10%"}]}]},
  98:{types:["water"],games:[{game:"Red/Blue",locations:[{name:"Routes 6, 11 (fish)",method:"fishing",rate:"25%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 6, 11 (fish)",method:"fishing",rate:"20%"}]}]},
  99:{types:["water"],games:[{game:"Red/Blue",locations:[{name:"Routes 11, 12 (fish)",method:"fishing",rate:"15%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 11, 12 (fish)",method:"fishing",rate:"10%"}]}]},
  100:{types:["electric"],games:[{game:"Red/Blue",locations:[{name:"Routes 10, Power Plant",method:"wild",rate:"25%"}]},{game:"Yellow",locations:[{name:"Power Plant",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 10, Power Plant",method:"wild",rate:"20%"}]}]},
  101:{types:["electric"],games:[{game:"Red/Blue",locations:[{name:"Power Plant",method:"wild",rate:"15%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Power Plant",method:"wild",rate:"10%"}]}]},
  102:{types:["grass","psychic"],games:[{game:"Red/Blue",locations:[{name:"Routes 24, 25",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 24, 25",method:"wild",rate:"15%"}]}]},
  103:{types:["grass","psychic"],games:[{game:"Red/Blue",locations:[{name:"Evolve Exeggcute (Leaf Stone)",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Exeggcute (Leaf Stone)",method:"evolve"}]}]},
  104:{types:["ground"],games:[{game:"Red/Blue",locations:[{name:"Routes 3, 4, 10",method:"wild",rate:"25%"}]},{game:"Yellow",locations:[{name:"Routes 3, 4",method:"wild",rate:"25%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 3, 4, 10",method:"wild",rate:"20%"}]}]},
  105:{types:["ground"],games:[{game:"Red/Blue",locations:[{name:"Victory Road",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Victory Road",method:"wild",rate:"15%"}]}]},
  106:{types:["fighting"],games:[{game:"Red/Blue",locations:[{name:"Saffron City (gift)",method:"gift"}]},{game:"FireRed/LeafGreen",locations:[{name:"Saffron City (gift)",method:"gift"}]}]},
  107:{types:["fighting"],games:[{game:"Red/Blue",locations:[{name:"Saffron City (gift)",method:"gift"}]},{game:"FireRed/LeafGreen",locations:[{name:"Saffron City (gift)",method:"gift"}]}]},
  108:{types:["normal"],games:[{game:"Red/Blue",locations:[{name:"Safari Zone",method:"wild",rate:"15%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Safari Zone",method:"wild",rate:"10%"}]}]},
  109:{types:["poison"],games:[{game:"Red/Blue",locations:[{name:"Routes 16-18, Pokemon Tower",method:"wild",rate:"25%"}]},{game:"FireRed",locations:[{name:"Routes 16-18",method:"wild",rate:"20%"}]}]},
  110:{types:["poison"],games:[{game:"Red/Blue",locations:[{name:"Routes 17, 18",method:"wild",rate:"15%"}]},{game:"FireRed",locations:[{name:"Routes 17, 18",method:"wild",rate:"10%"}]}]},
  111:{types:["ground","rock"],games:[{game:"Red/Blue",locations:[{name:"Safari Zone",method:"wild",rate:"25%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Safari Zone",method:"wild",rate:"20%"}]}]},
  112:{types:["ground","rock"],games:[{game:"Red/Blue",locations:[{name:"Routes 14, 15, Safari Zone",method:"wild",rate:"15%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 14, 15",method:"wild",rate:"10%"}]}]},
  113:{types:["normal"],games:[{game:"Red/Blue",locations:[{name:"Safari Zone",method:"wild",rate:"10%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Safari Zone",method:"wild",rate:"10%"}]}]},
  114:{types:["grass"],games:[{game:"Blue",locations:[{name:"Safari Zone",method:"wild",rate:"20%"}]},{game:"LeafGreen",locations:[{name:"Safari Zone",method:"wild",rate:"15%"}]}]},
  115:{types:["normal"],games:[{game:"Red/Blue",locations:[{name:"Safari Zone",method:"wild",rate:"15%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Safari Zone",method:"wild",rate:"10%"}]}]},
  116:{types:["water"],games:[{game:"Red/Blue",locations:[{name:"Routes 19-21 (fish)",method:"fishing",rate:"25%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 19-21 (fish)",method:"fishing",rate:"20%"}]}]},
  117:{types:["water"],games:[{game:"Red/Blue",locations:[{name:"Routes 19-21 (fish)",method:"fishing",rate:"10%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 19-21 (fish)",method:"fishing",rate:"8%"}]}]},
  118:{types:["water"],games:[{game:"Red/Blue",locations:[{name:"Routes 6, 22, 23 (fish)",method:"fishing",rate:"30%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 6, 22, 23 (fish)",method:"fishing",rate:"25%"}]}]},
  119:{types:["water"],games:[{game:"Red/Blue",locations:[{name:"Routes 12, 13 (fish)",method:"fishing",rate:"15%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Routes 12, 13 (fish)",method:"fishing",rate:"10%"}]}]},
  120:{types:["water","psychic"],games:[{game:"Red/Blue",locations:[{name:"Seafoam Islands (surf)",method:"wild",rate:"20%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Seafoam Islands (surf)",method:"wild",rate:"15%"}]}]},
  121:{types:["water","psychic"],games:[{game:"Red/Blue",locations:[{name:"Evolve Staryu (Water Stone)",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Staryu (Water Stone)",method:"evolve"}]}]},
  122:{types:["psychic","fairy"],games:[{game:"Blue",locations:[{name:"Route 21",method:"wild",rate:"20%"}]},{game:"LeafGreen",locations:[{name:"Route 21",method:"wild",rate:"15%"}]}]},
  123:{types:["bug","flying"],games:[{game:"Red/Blue",locations:[{name:"Safari Zone",method:"wild",rate:"15%"}]},{game:"FireRed",locations:[{name:"Safari Zone",method:"wild",rate:"10%"}]}]},
  124:{types:["ice","psychic"],games:[{game:"Red/Blue",locations:[{name:"Seafoam Islands",method:"wild",rate:"15%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Seafoam Islands",method:"wild",rate:"10%"}]}]},
  125:{types:["electric"],games:[{game:"Red/Blue",locations:[{name:"Power Plant",method:"wild",rate:"20%"}]},{game:"FireRed",locations:[{name:"Power Plant",method:"wild",rate:"15%"}]}]},
  126:{types:["fire"],games:[{game:"Red/Blue",locations:[{name:"Pokemon Mansion",method:"wild",rate:"20%"}]},{game:"LeafGreen",locations:[{name:"Pokemon Mansion",method:"wild",rate:"15%"}]}]},
  127:{types:["bug"],games:[{game:"Red/Blue",locations:[{name:"Safari Zone",method:"wild",rate:"15%"}]},{game:"FireRed",locations:[{name:"Safari Zone",method:"wild",rate:"10%"}]}]},
  128:{types:["normal"],games:[{game:"Red/Blue",locations:[{name:"Safari Zone",method:"wild",rate:"25%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Safari Zone",method:"wild",rate:"20%"}]}]},
  129:{types:["water"],games:[{game:"Red/Blue",locations:[{name:"All water routes (fish)",method:"fishing",rate:"70%"}]},{game:"Yellow",locations:[{name:"All water routes (fish)",method:"fishing",rate:"70%"}]},{game:"FireRed/LeafGreen",locations:[{name:"All water routes (fish)",method:"fishing",rate:"70%"}]}]},
  130:{types:["water","flying"],games:[{game:"Red/Blue",locations:[{name:"Evolve Magikarp",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Magikarp",method:"evolve"}]}]},
  131:{types:["water","ice"],games:[{game:"Red/Blue",locations:[{name:"Silph Co. (gift)",method:"gift"}]},{game:"Yellow",locations:[{name:"Silph Co. (gift)",method:"gift"}]},{game:"FireRed/LeafGreen",locations:[{name:"Silph Co. (gift)",method:"gift"}]}]},
  132:{types:["normal"],games:[{game:"Red/Blue",locations:[{name:"Cerulean Cave",method:"wild",rate:"25%"}]},{game:"Yellow",locations:[{name:"Cerulean Cave",method:"wild",rate:"25%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Cerulean Cave",method:"wild",rate:"20%"}]}]},
  133:{types:["normal"],games:[{game:"Red/Blue",locations:[{name:"Celadon City (prize)",method:"gift"}]},{game:"Yellow",locations:[{name:"Celadon City (prize)",method:"gift"}]},{game:"FireRed/LeafGreen",locations:[{name:"Celadon City (prize)",method:"gift"}]}]},
  134:{types:["water"],games:[{game:"Red/Blue",locations:[{name:"Evolve Eevee (Water Stone)",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Eevee (Water Stone)",method:"evolve"}]}]},
  135:{types:["electric"],games:[{game:"Red/Blue",locations:[{name:"Evolve Eevee (Thunder Stone)",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Eevee (Thunder Stone)",method:"evolve"}]}]},
  136:{types:["fire"],games:[{game:"Red/Blue",locations:[{name:"Evolve Eevee (Fire Stone)",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Eevee (Fire Stone)",method:"evolve"}]}]},
  137:{types:["normal"],games:[{game:"Red/Blue",locations:[{name:"Celadon City (prize)",method:"gift"}]},{game:"Yellow",locations:[{name:"Celadon City (prize)",method:"gift"}]},{game:"FireRed/LeafGreen",locations:[{name:"Celadon City (prize)",method:"gift"}]}]},
  138:{types:["rock","water"],games:[{game:"Red/Blue",locations:[{name:"Cinnabar Lab (fossil)",method:"gift"}]},{game:"Yellow",locations:[{name:"Cinnabar Lab (fossil)",method:"gift"}]},{game:"FireRed/LeafGreen",locations:[{name:"Cinnabar Lab (fossil)",method:"gift"}]}]},
  139:{types:["rock","water"],games:[{game:"Red/Blue",locations:[{name:"Evolve Omanyte",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Omanyte",method:"evolve"}]}]},
  140:{types:["rock","water"],games:[{game:"Red/Blue",locations:[{name:"Cinnabar Lab (fossil)",method:"gift"}]},{game:"Yellow",locations:[{name:"Cinnabar Lab (fossil)",method:"gift"}]},{game:"FireRed/LeafGreen",locations:[{name:"Cinnabar Lab (fossil)",method:"gift"}]}]},
  141:{types:["rock","water"],games:[{game:"Red/Blue",locations:[{name:"Evolve Kabuto",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Kabuto",method:"evolve"}]}]},
  142:{types:["rock","flying"],games:[{game:"Red/Blue",locations:[{name:"Cinnabar Lab (fossil)",method:"gift"}]},{game:"Yellow",locations:[{name:"Cinnabar Lab (fossil)",method:"gift"}]},{game:"FireRed/LeafGreen",locations:[{name:"Cinnabar Lab (fossil)",method:"gift"}]}]},
  143:{types:["normal"],games:[{game:"Red/Blue",locations:[{name:"Route 12 (static)",method:"static"},{name:"Cerulean Cave",method:"wild",rate:"5%"}]},{game:"Yellow",locations:[{name:"Route 12 (static)",method:"static"}]},{game:"FireRed/LeafGreen",locations:[{name:"Route 12 (static)",method:"static"},{name:"Cerulean Cave",method:"wild",rate:"5%"}]}]},
  144:{types:["ice","flying"],games:[{game:"Red/Blue",locations:[{name:"Seafoam Islands (static)",method:"static"}]},{game:"Yellow",locations:[{name:"Seafoam Islands (static)",method:"static"}]},{game:"FireRed/LeafGreen",locations:[{name:"Seafoam Islands (static)",method:"static"}]}]},
  145:{types:["electric","flying"],games:[{game:"Red/Blue",locations:[{name:"Power Plant (static)",method:"static"}]},{game:"Yellow",locations:[{name:"Power Plant (static)",method:"static"}]},{game:"FireRed/LeafGreen",locations:[{name:"Power Plant (static)",method:"static"}]}]},
  146:{types:["fire","flying"],games:[{game:"Red/Blue",locations:[{name:"Victory Road (static)",method:"static"}]},{game:"Yellow",locations:[{name:"Victory Road (static)",method:"static"}]},{game:"FireRed/LeafGreen",locations:[{name:"Victory Road (static)",method:"static"}]}]},
  147:{types:["dragon"],games:[{game:"Red/Blue",locations:[{name:"Safari Zone",method:"wild",rate:"15%"}]},{game:"FireRed/LeafGreen",locations:[{name:"Safari Zone",method:"wild",rate:"10%"}]}]},
  148:{types:["dragon"],games:[{game:"Red/Blue",locations:[{name:"Evolve Dratini",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Dratini",method:"evolve"}]}]},
  149:{types:["dragon","flying"],games:[{game:"Red/Blue",locations:[{name:"Evolve Dragonair",method:"evolve"}]},{game:"FireRed/LeafGreen",locations:[{name:"Evolve Dragonair",method:"evolve"}]}]},
  150:{types:["psychic"],games:[{game:"Red/Blue",locations:[{name:"Cerulean Cave (static)",method:"static"}]},{game:"Yellow",locations:[{name:"Cerulean Cave (static)",method:"static"}]},{game:"FireRed/LeafGreen",locations:[{name:"Cerulean Cave (static)",method:"static"}]}]},
  151:{types:["psychic"],games:[{game:"Red/Blue",locations:[{name:"Event/Glitch only",method:"event"}]},{game:"FireRed/LeafGreen",locations:[{name:"Faraway Island (event)",method:"event"}]}]},
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

const POKEMON_NAMES = ["Bulbasaur","Ivysaur","Venusaur","Charmander","Charmeleon","Charizard","Squirtle","Wartortle","Blastoise","Caterpie","Metapod","Butterfree","Weedle","Kakuna","Beedrill","Pidgey","Pidgeotto","Pidgeot","Rattata","Raticate","Spearow","Fearow","Ekans","Arbok","Pikachu","Raichu","Sandshrew","Sandslash","Nidoran♀","Nidorina","Nidoqueen","Nidoran♂","Nidorino","Nidoking","Clefairy","Clefable","Vulpix","Ninetales","Jigglypuff","Wigglytuff","Zubat","Golbat","Oddish","Gloom","Vileplume","Paras","Parasect","Venonat","Venomoth","Diglett","Dugtrio","Meowth","Persian","Psyduck","Golduck","Mankey","Primeape","Growlithe","Arcanine","Poliwag","Poliwhirl","Poliwrath","Abra","Kadabra","Alakazam","Machop","Machoke","Machamp","Bellsprout","Weepinbell","Victreebel","Tentacool","Tentacruel","Geodude","Graveler","Golem","Ponyta","Rapidash","Slowpoke","Slowbro","Magnemite","Magneton","Farfetch'd","Doduo","Dodrio","Seel","Dewgong","Grimer","Muk","Shellder","Cloyster","Gastly","Haunter","Gengar","Onix","Drowzee","Hypno","Krabby","Kingler","Voltorb","Electrode","Exeggcute","Exeggutor","Cubone","Marowak","Hitmonlee","Hitmonchan","Lickitung","Koffing","Weezing","Rhyhorn","Rhydon","Chansey","Tangela","Kangaskhan","Horsea","Seadra","Goldeen","Seaking","Staryu","Starmie","Mr. Mime","Scyther","Jynx","Electabuzz","Magmar","Pinsir","Tauros","Magikarp","Gyarados","Lapras","Ditto","Eevee","Vaporeon","Jolteon","Flareon","Porygon","Omanyte","Omastar","Kabuto","Kabutops","Aerodactyl","Snorlax","Articuno","Zapdos","Moltres","Dratini","Dragonair","Dragonite","Mewtwo","Mew"];
const allPokemon = POKEMON_NAMES.map((name,i)=>({id:i+1,name}));

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
  const r=20;
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
            {/* Row 1: level/tm, name, type, category icon */}
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
              {m.level!=null&&<span style={{fontSize:11,color:"#ffcc44",fontFamily:"monospace",minWidth:36}}>Lv.{m.level}</span>}
              {m.tm&&<span style={{fontSize:11,color:"#88aaff",fontFamily:"monospace",minWidth:36}}>{m.tm}</span>}
              <span style={{fontSize:13,color:dex.screenText,fontFamily:"monospace",fontWeight:500,flex:1}}>{m.name}</span>
              <span style={{fontSize:10,padding:"2px 7px",borderRadius:8,background:tc+"33",color:tc,fontWeight:500,textTransform:"capitalize"}}>{m.type}</span>
              <CategoryIcon category={m.category}/>
            </div>
            {/* Row 2: power bar, accuracy bar */}
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
            {/* Row 3: description */}
            <p style={{margin:0,fontSize:11,color:dex.screenMuted,fontFamily:"monospace",lineHeight:1.5}}>{m.description}</p>
          </div>
        );
      })}
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
  const types=(CATCH_DATA as any)[mon.id]?.types||[];
  const longPressTimer=useState<any>(null);
  const startLongPress=(e:React.TouchEvent)=>{
    e.preventDefault();
    longPressTimer[1](setTimeout(()=>onLongPress(mon),500));
  };
  const cancelLongPress=()=>{
    if(longPressTimer[0])clearTimeout(longPressTimer[0]);
  };
  const borderColor=isAnchor?"#ffcc44":selected?"#5588ff":caught?"#3a5a2a":dex.screenDim;
  const bg=isAnchor?"#1a1500":selected?"#0d1a30":caught?"#0d1f0d":dex.screenBg;
  return (
    <div onClick={e=>onCardClick(mon,e,()=>onDetail(mon))}
      onTouchStart={startLongPress} onTouchEnd={cancelLongPress} onTouchMove={cancelLongPress}
      style={{border:`1px solid ${borderColor}`,borderRadius:8,background:bg,padding:"8px 4px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",opacity:caught||selected||isAnchor?1:0.55,transition:"all 0.15s",outline:isAnchor?`2px solid #ffcc44`:selected?"2px solid #5588ff":"none",position:"relative"}}>
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
  const types=(CATCH_DATA as any)[mon.id]?.types||[];
  const longPressTimer=useState<any>(null);
  const startLongPress=()=>{longPressTimer[1](setTimeout(()=>onLongPress(mon),500));};
  const cancelLongPress=()=>{if(longPressTimer[0])clearTimeout(longPressTimer[0]);};
  const borderColor=isAnchor?"2px solid #ffcc44":selected?"2px solid #5588ff":"none";
  return (
    <div onClick={e=>onCardClick(mon,e,()=>onDetail(mon))}
      onTouchStart={startLongPress} onTouchEnd={cancelLongPress} onTouchMove={cancelLongPress}
      style={{display:"flex",alignItems:"center",gap:10,padding:"6px 12px",borderBottom:`1px solid ${dex.screenDim}`,cursor:"pointer",background:isAnchor?"#1a1500":selected?"#0d1a30":caught?"#0d1f0d":"transparent",outline:borderColor}}>
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

function DetailPanel({mon,onClose}:{mon:any,onClose:()=>void}){
  if(!mon)return null;
  const data=(CATCH_DATA as any)[mon.id];
  const typeColor=TYPE_COLORS[data?.types?.[0]]||"#888";
  const [activeTab,setActiveTab]=useState("catch");
  const [versionGroup,setVersionGroup]=useState("");
  const [availableVersions,setAvailableVersions]=useState<string[]>([]);
  const [levelMoves,setLevelMoves]=useState<any[]>([]);
  const [tmMoves,setTmMoves]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);

  const canFetch = mon.id === 1;

  useEffect(()=>{
    if(!canFetch)return;
    const load=async()=>{
      setLoading(true);
      try{
        const poke=await fetchPoke(`https://pokeapi.co/api/v2/pokemon/${mon.id}`);
        const vgs=[...new Set(poke.moves.flatMap((m:any)=>
          m.version_group_details.map((v:any)=>v.version_group.name)
        ))].filter((v:any)=>VERSION_GROUPS[v]) as string[];
        vgs.sort((a,b)=>VERSION_GROUPS[a].gen-VERSION_GROUPS[b].gen);
        setAvailableVersions(vgs);
        setVersionGroup(vgs[vgs.length-1]);
      }catch(e){console.error(e);}
      finally{setLoading(false);}
    };
    load();
  },[mon.id]);

  useEffect(()=>{
    if(!canFetch||!versionGroup)return;
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
  },[mon.id,versionGroup]);

  const tabs=["catch",...(canFetch?["levelup","tm"]:[])];
  const tabLabels:any={catch:"Catch Info",levelup:"Level-Up Moves",tm:"TM Moves"};

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
                <div style={{display:"flex",gap:4}}>{data?.types?.map((t:string)=><TypeBadge key={t} type={t}/>)}</div>
              </div>
              {canFetch&&availableVersions.length>0&&(
                <DexSelect value={versionGroup} onChange={(e:any)=>setVersionGroup(e.target.value)} style={{fontSize:11,maxWidth:160}}>
                  <option value="">Select Generation</option>
                  {availableVersions.map(v=>(
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
              <>
                {!data&&<p style={{color:dex.screenMuted,fontSize:13,fontFamily:"monospace"}}>No data available.</p>}
                {data?.games.map((g:any,i:number)=>(
                  <div key={i} style={{marginBottom:14}}>
                    <p style={{margin:"0 0 6px",fontSize:12,color:typeColor,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"monospace"}}>{g.game}</p>
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      {g.locations.map((loc:any,j:number)=>{
                        const mc=METHOD_COLORS[loc.method]||METHOD_COLORS.event;
                        return (
                          <div key={j} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:dex.screenBg,borderRadius:6,padding:"6px 10px",gap:8,border:`0.5px solid ${dex.screenDim}`}}>
                            <span style={{fontSize:12,color:dex.screenText,fontFamily:"monospace"}}>{loc.name}</span>
                            <span style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                              <span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:mc.bg,color:mc.text,fontWeight:500}}>{loc.method}</span>
                              {loc.rate&&<span style={{fontSize:11,color:dex.screenMuted}}>{loc.rate}</span>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}
            {activeTab==="levelup"&&(loading?<PokeballSpinner/>:<MoveTable moves={levelMoves}/>)}
            {activeTab==="tm"&&(loading?<PokeballSpinner/>:<MoveTable moves={tmMoves}/>)}
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

export default function App(){
  const [username,setUsername]=useState("");
  const [inputName,setInputName]=useState("");
  const [caught,setCaught]=useState<{[key:string]:boolean}>({});
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [genVisible,setGenVisible]=useState(true);
  const [detail,setDetail]=useState<any>(null);
  const [saving,setSaving]=useState(false);
  const [friends,setFriends]=useState<{name:string,count:number}[]>([]);
  const [tab,setTab]=useState("tracker");
  const [quickEntry,setQuickEntry]=useState("");
  const [quickFeedback,setQuickFeedback]=useState("");
  const [viewMode,setViewMode]=useState("grid");
  const [selected,setSelected]=useState(new Set<number>());
  const [selectMode,setSelectMode]=useState(false);
  const [lastClicked,setLastClicked]=useState<number|null>(null);
  const [rangeAnchor,setRangeAnchor]=useState<number|null>(null);
  const [savedProfiles,setSavedProfiles]=useState<{name:string,count:number}[]>([]);

  const loadUser=useCallback(async(name:string)=>{
    try{const v=await getItem(`dex:${name.toLowerCase()}`);setCaught(v?JSON.parse(v):{});}
    catch{setCaught({});}
  },[]);

  const saveUser=useCallback(async(name:string,data:any)=>{
    try{setSaving(true);await setItem(`dex:${name.toLowerCase()}`,JSON.stringify(data));}
    catch(e){console.error(e);}finally{setSaving(false);}
  },[]);

  const loadProfiles=useCallback(async()=>{
    try{
      const keys=await listKeys("dex:");
      if(!keys.length){setSavedProfiles([]);return;}
      const entries=await Promise.all(keys.map(async(k:string)=>{
        try{const v=await getItem(k);const d=v?JSON.parse(v):{};return{name:k.replace("dex:",""),count:Object.values(d).filter(Boolean).length};}
        catch{return null;}
      }));
      setSavedProfiles((entries.filter(Boolean) as {name:string,count:number}[]).sort((a,b)=>b.count-a.count));
    }catch(e){console.error(e);}
  },[]);

  const loadFriends=useCallback(async()=>{
    try{
      const keys=await listKeys("dex:");
      const entries=await Promise.all(keys.map(async(k:string)=>{
        try{const v=await getItem(k);const d=v?JSON.parse(v):{};return{name:k.replace("dex:",""),count:Object.values(d).filter(Boolean).length};}
        catch{return null;}
      }));
      setFriends((entries.filter(Boolean) as {name:string,count:number}[]).sort((a,b)=>b.count-a.count));
    }catch(e){console.error(e);}
  },[]);

  useEffect(()=>{loadProfiles();},[loadProfiles]);
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
    const n=(name||inputName).trim();
    if(!n)return;
    setUsername(n);
    loadUser(n);
  };

  const handleLogout=()=>{setUsername("");setInputName("");setCaught({});loadProfiles();};

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
        // mobile: tap to complete range from anchor
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
    // make sure it's selected too
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

  const total=151;
  const caughtCount=Object.values(caught).filter(Boolean).length;
  const filtered=allPokemon.filter(p=>{
    const ms=!search||p.name.toLowerCase().includes(search.toLowerCase())||String(p.id).includes(search);
    const mf=filter==="all"||(filter==="caught"&&caught[p.id])||(filter==="missing"&&!caught[p.id]);
    return ms&&mf;
  });

  const screenStyle={background:dex.screen,borderRadius:8,border:`3px solid ${dex.screenBorder}`,padding:14};

  if(!username) return (
    <div style={{background:dex.red,borderRadius:16,overflow:"hidden",border:`3px solid ${dex.darkRed}`}}>
      <div style={{background:dex.red,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
        <DexLights/>
        <span style={{color:"#fff",fontWeight:500,fontSize:14,fontFamily:"monospace",marginLeft:8}}>POKÉDEX — Living Dex Tracker</span>
      </div>
      <div style={{...screenStyle,margin:"0 12px 12px",display:"flex",flexDirection:"column",gap:16}}>
        {savedProfiles.length>0&&(
          <div>
            <p style={{color:dex.screenHeading,fontSize:11,fontFamily:"monospace",margin:"0 0 8px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Saved trainers</p>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {savedProfiles.map((p,i)=>{
                const pct=Math.round((p.count/151)*100);
                return (
                  <div key={i} onClick={()=>handleLogin(p.name)}
                    style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:dex.screenBg,borderRadius:8,border:`1px solid ${dex.screenDim}`,cursor:"pointer"}}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor="#5588ff"}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor=dex.screenDim}
                  >
                    <div style={{width:40,height:40,borderRadius:"50%",background:"#1a2a3a",border:`2px solid ${dex.screenDim}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontFamily:"monospace",color:dex.screenText,fontWeight:500,flexShrink:0}}>
                      {p.name[0].toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{margin:"0 0 4px",fontSize:13,fontFamily:"monospace",color:dex.screenText,fontWeight:500}}>{p.name}</p>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{flex:1,height:5,background:dex.screenDim,borderRadius:3,overflow:"hidden"}}>
                          <div style={{height:"100%",borderRadius:3,width:`${pct}%`,background:p.count===151?"#55cc55":"#378ADD"}}/>
                        </div>
                        <span style={{fontSize:11,color:dex.screenMuted,fontFamily:"monospace",whiteSpace:"nowrap"}}>{p.count}/151 · {pct}%</span>
                      </div>
                    </div>
                    <span style={{fontSize:11,color:"#5588ff",fontFamily:"monospace",flexShrink:0}}>▶ Play</span>
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
      <div style={{background:dex.red,padding:"10px 16px",display:"flex",justifyContent:"flex-end",gap:8}}>
        <div style={{width:40,height:8,borderRadius:4,background:dex.darkRed}}/>
        <div style={{width:24,height:8,borderRadius:4,background:dex.darkRed}}/>
      </div>
    </div>
  );

  return (
    <div style={{background:dex.red,borderRadius:16,overflow:"hidden",border:`3px solid ${dex.darkRed}`}}>
      <div style={{background:dex.red,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <DexLights/>
        <span style={{color:"#fff",fontWeight:500,fontSize:13,fontFamily:"monospace",marginLeft:4}}>POKÉDEX</span>
        <span style={{color:"rgba(255,255,255,0.6)",fontSize:12,fontFamily:"monospace"}}>— {username}</span>
        {saving&&<span style={{fontSize:11,color:"rgba(255,255,255,0.5)",fontFamily:"monospace"}}>saving...</span>}
        <span style={{marginLeft:"auto",fontSize:10,color:"rgba(255,255,255,0.35)",fontFamily:"monospace"}}>v0.1.0</span>
        <button onClick={handleLogout} style={{background:"none",border:"1px solid rgba(255,255,255,0.3)",borderRadius:6,color:"rgba(255,255,255,0.7)",fontSize:11,padding:"3px 10px",cursor:"pointer",fontFamily:"monospace"}}>LOGOUT</button>
      </div>
      <div style={{background:dex.darkRed,display:"flex",padding:"0 14px",gap:2}}>
        {["tracker","friends"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{fontSize:12,fontFamily:"monospace",padding:"7px 14px",cursor:"pointer",border:"none",background:tab===t?dex.screen:"transparent",color:tab===t?dex.screenText:"rgba(255,255,255,0.55)",borderRadius:"6px 6px 0 0"}}>{t.toUpperCase()}</button>
        ))}
      </div>
      <div style={{...screenStyle,margin:"0 12px 0",borderRadius:"0 8px 8px 8px",minHeight:200}}>
        {tab==="tracker"&&(
          <>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
              <div>
                <span style={{fontSize:11,color:dex.screenHeading,fontFamily:"monospace"}}>GEN I &nbsp;</span>
                <span style={{fontSize:13,color:dex.screenText,fontFamily:"monospace",fontWeight:500}}>{caughtCount}/{total}</span>
              </div>
              <div style={{flex:1,minWidth:80,height:6,background:dex.screenDim,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:3,width:`${Math.round((caughtCount/total)*100)}%`,background:caughtCount===total?"#55cc55":"#378ADD",transition:"width 0.3s"}}/>
              </div>
              <span style={{fontSize:11,color:dex.screenMuted,fontFamily:"monospace"}}>{Math.round((caughtCount/total)*100)}%</span>
              <DexButton onClick={()=>setGenVisible(v=>!v)} style={{fontSize:11,padding:"3px 10px"}}>
                {genVisible?"HIDE":"SHOW"}{caughtCount===total?" ✓":""}
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
                {viewMode==="grid"?(
                  <div
                    onMouseDown={e=>{if(e.shiftKey)e.preventDefault();}}
                    style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(96px,1fr))",gap:6,userSelect:"none",WebkitUserSelect:"none"}}>
                    {filtered.map((mon:any)=><GridCard key={mon.id} mon={mon} caught={!!caught[mon.id]} selected={selected.has(mon.id)} selectMode={selectMode} isAnchor={rangeAnchor===mon.id} onToggle={toggleCaught} onDetail={setDetail} onCardClick={handleCardClick} onCheckbox={toggleCheckbox} onLongPress={handleLongPress}/>)}
                  </div>
                ):(
                  <div
                    onMouseDown={e=>{if(e.shiftKey)e.preventDefault();}}
                    style={{border:`1px solid ${dex.screenDim}`,borderRadius:8,overflow:"hidden",userSelect:"none",WebkitUserSelect:"none"}}>
                    {filtered.map((mon:any)=><ListRow key={mon.id} mon={mon} caught={!!caught[mon.id]} selected={selected.has(mon.id)} selectMode={selectMode} isAnchor={rangeAnchor===mon.id} onToggle={toggleCaught} onDetail={setDetail} onCardClick={handleCardClick} onCheckbox={toggleCheckbox} onLongPress={handleLongPress}/>)}
                  </div>
                )}
                {filtered.length===0&&<p style={{color:dex.screenMuted,fontSize:13,textAlign:"center",padding:"2rem 0",fontFamily:"monospace"}}>No Pokémon found.</p>}
              </>
            )}
          </>
        )}
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
      <div style={{background:dex.red,padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:4}}>
          <div style={{width:14,height:14,borderRadius:"50%",background:dex.darkRed,border:"1px solid rgba(0,0,0,0.2)"}}/>
          <div style={{width:14,height:14,borderRadius:"50%",background:dex.darkRed,border:"1px solid rgba(0,0,0,0.2)"}}/>
        </div>
        <div style={{display:"flex",gap:6}}>
          <div style={{width:36,height:7,borderRadius:4,background:dex.darkRed}}/>
          <div style={{width:22,height:7,borderRadius:4,background:dex.darkRed}}/>
        </div>
      </div>
      {detail&&<DetailPanel key={detail.id} mon={detail} onClose={()=>setDetail(null)}/>}
    </div>
  );
}
