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

const TYPE_COLORS = {
  normal:"#A8A878",fire:"#F08030",water:"#6890F0",electric:"#F8D030",
  grass:"#78C850",ice:"#98D8D8",fighting:"#C03028",poison:"#A040A0",
  ground:"#E0C068",flying:"#A890F0",psychic:"#F85888",bug:"#A8B820",
  rock:"#B8A038",ghost:"#705898",dragon:"#7038F8",dark:"#705848",
  steel:"#B8B8D0",fairy:"#EE99AC"
};

const METHOD_COLORS = {
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

function spriteUrl(id){return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;}

function TypeBadge({type}){
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
      {caught&&<circle cx={r} cy={r} r={r*0.14} fill="#CC0000"/>}
    </svg>
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

function DexSelect({value,onChange,children,style={}}){
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

function GridCard({mon,caught,selected,selectMode,onToggle,onDetail,onCardClick,onCheckbox}){
  const types=CATCH_DATA[mon.id]?.types||[];
  return (
    <div onClick={e=>onCardClick(mon,e,()=>onDetail(mon))} style={{border:`1px solid ${selected?"#5588ff":caught?"#3a5a2a":dex.screenDim}`,borderRadius:8,background:selected?"#0d1a30":caught?"#0d1f0d":dex.screenBg,padding:"8px 4px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",opacity:caught||selected?1:0.55,transition:"all 0.15s",outline:selected?"2px solid #5588ff":"none",position:"relative"}}>
      {selectMode&&<input type="checkbox" checked={selected} onChange={e=>onCheckbox(mon.id,e)} onClick={e=>e.stopPropagation()} style={{position:"absolute",top:5,right:5,width:14,height:14,cursor:"pointer",accentColor:"#5588ff"}}/>}
      <span style={{fontSize:10,color:selected?"#8899ff":dex.screenHeading,alignSelf:"flex-start",paddingLeft:4,fontFamily:"monospace"}}>#{String(mon.id).padStart(3,"0")}</span>
      <img src={spriteUrl(mon.id)} alt={mon.name} width={48} height={48} style={{imageRendering:"pixelated",filter:caught?"none":"grayscale(100%)"}}         onError={e=>{(e.target as HTMLImageElement).style.opacity="0.1";}}/>
      <span style={{fontSize:11,color:dex.screenText,textAlign:"center",lineHeight:1.2,width:"100%",padding:"0 3px",wordBreak:"break-word",fontFamily:"monospace"}}>{mon.name}</span>
      <div style={{display:"flex",gap:2,flexWrap:"wrap",justifyContent:"center"}}>{types.map(t=><TypeBadge key={t} type={t}/>)}</div>
      <div onClick={e=>{e.stopPropagation();onToggle(mon.id);}} style={{marginTop:4}}><Pokeball caught={caught} size={26}/></div>
    </div>
  );
}

function ListRow({mon,caught,selected,selectMode,onToggle,onDetail,onCardClick,onCheckbox}){
  const types=CATCH_DATA[mon.id]?.types||[];
  return (
    <div onClick={e=>onCardClick(mon,e,()=>onDetail(mon))} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 12px",borderBottom:`1px solid ${dex.screenDim}`,cursor:"pointer",background:selected?"#0d1a30":caught?"#0d1f0d":"transparent",outline:selected?"2px solid #5588ff":"none"}}>
      {selectMode&&<input type="checkbox" checked={selected} onChange={e=>onCheckbox(mon.id,e)} onClick={e=>e.stopPropagation()} style={{width:14,height:14,cursor:"pointer",accentColor:"#5588ff",flexShrink:0}}/>}
      <span style={{fontSize:11,color:selected?"#8899ff":dex.screenHeading,minWidth:32,fontFamily:"monospace"}}>#{String(mon.id).padStart(3,"0")}</span>
      <img src={spriteUrl(mon.id)} alt={mon.name} width={36} height={36} style={{imageRendering:"pixelated",filter:caught?"none":"grayscale(100%)",opacity:caught?1:0.45}} onError={e=>{(e.target as HTMLImageElement).style.opacity="0.1";}}/>
      <span style={{flex:1,fontSize:13,color:dex.screenText,fontFamily:"monospace",fontWeight:caught?500:400}}>{mon.name}</span>
      <div style={{display:"flex",gap:3}}>{types.map(t=><TypeBadge key={t} type={t}/>)}</div>
      <div onClick={e=>{e.stopPropagation();onToggle(mon.id);}}><Pokeball caught={caught} size={28}/></div>
    </div>
  );
}

function DetailPanel({mon,onClose}){
  if(!mon)return null;
  const data=CATCH_DATA[mon.id];
  const typeColor=TYPE_COLORS[data?.types?.[0]]||"#888";
  return (
    <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,background:"rgba(0,0,0,0.75)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:"min(480px,92vw)",maxHeight:"85vh",borderRadius:16,border:`3px solid ${dex.red}`,background:dex.red,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{background:dex.red,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <DexLights/>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#fff",fontSize:18,cursor:"pointer",fontWeight:500,lineHeight:1}}>✕</button>
        </div>
        <div style={{background:dex.screen,margin:"0 12px",borderRadius:8,border:`4px solid ${dex.screenBorder}`,padding:16,overflowY:"auto",flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <div style={{background:typeColor+"22",borderRadius:8,padding:4,border:`1px solid ${typeColor}44`,flexShrink:0}}>
              <img src={spriteUrl(mon.id)} alt={mon.name} width={72} height={72} style={{imageRendering:"pixelated",display:"block"}}         onError={e=>{(e.target as HTMLImageElement).style.opacity="0.2";}}/>
            </div>
            <div>
              <p style={{margin:0,fontSize:11,color:dex.screenHeading,fontFamily:"monospace"}}>No. {String(mon.id).padStart(3,"0")}</p>
              <h2 style={{margin:"2px 0 6px",fontSize:20,fontWeight:500,color:"#e8e8ff",fontFamily:"monospace"}}>{mon.name}</h2>
              <div style={{display:"flex",gap:4}}>{data?.types?.map(t=><TypeBadge key={t} type={t}/>)}</div>
            </div>
          </div>
          <div style={{height:1,background:dex.screenDim,marginBottom:12}}/>
          {!data&&<p style={{color:dex.screenMuted,fontSize:13,fontFamily:"monospace"}}>No data available.</p>}
          {data?.games.map((g,i)=>(
            <div key={i} style={{marginBottom:14}}>
              <p style={{margin:"0 0 6px",fontSize:12,color:typeColor,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"monospace"}}>{g.game}</p>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {g.locations.map((loc,j)=>{
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
  const [caught,setCaught]=useState({});
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [genVisible,setGenVisible]=useState(true);
  const [detail,setDetail]=useState(null);
  const [saving,setSaving]=useState(false);
const [friends,setFriends]=useState<{name:string,count:number}[]>([]);
  const [tab,setTab]=useState("tracker");
  const [quickEntry,setQuickEntry]=useState("");
  const [quickFeedback,setQuickFeedback]=useState("");
  const [viewMode,setViewMode]=useState("grid");
  const [selected,setSelected]=useState(new Set());
  const [selectMode,setSelectMode]=useState(false);
  const [lastClicked,setLastClicked]=useState(null);
const [savedProfiles,setSavedProfiles]=useState<{name:string,count:number}[]>([]);

  const loadUser=useCallback(async(name)=>{
    try{const v=await getItem(`dex:${name.toLowerCase()}`);setCaught(v?JSON.parse(v):{});}
    catch{setCaught({});}
  },[]);

  const saveUser=useCallback(async(name,data)=>{
    try{setSaving(true);await setItem(`dex:${name.toLowerCase()}`,JSON.stringify(data));}
    catch(e){console.error(e);}finally{setSaving(false);}
  },[]);

  const loadProfiles=useCallback(async()=>{
    try{
      const keys=await listKeys("dex:");
      if(!keys.length){setSavedProfiles([]);return;}
      const entries=await Promise.all(keys.map(async k=>{
        try{const v=await getItem(k);const d=v?JSON.parse(v):{};return{name:k.replace("dex:",""),count:Object.values(d).filter(Boolean).length};}
        catch{return null;}
      }));
      setSavedProfiles((entries.filter(Boolean) as {name:string,count:number}[]).sort((a,b)=>b.count-a.count));
    }catch(e){console.error(e);}
  },[]);

  const loadFriends=useCallback(async()=>{
    try{
      const keys=await listKeys("dex:");
      const entries=await Promise.all(keys.map(async k=>{
        try{const v=await getItem(k);const d=v?JSON.parse(v):{};return{name:k.replace("dex:",""),count:Object.values(d).filter(Boolean).length};}
        catch{return null;}
      }));
      setFriends((entries.filter(Boolean) as {name:string,count:number}[]).sort((a,b)=>b.count-a.count));
    }catch(e){console.error(e);}
  },[]);

  useEffect(()=>{loadProfiles();},[loadProfiles]);
  useEffect(()=>{if(tab==="friends")loadFriends();},[tab,loadFriends]);

  useEffect(()=>{
    const handler=(e)=>{
      if(e.target.tagName==="INPUT"||e.target.tagName==="SELECT")return;
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

  const toggleCaught=(id)=>{
    const next={...caught,[id]:!caught[id]};
    setCaught(next);
    if(username)saveUser(username,next);
  };

  const handleCardClick=(mon,e,openDetail)=>{
    if(selectMode){
      e.preventDefault();
      const visibleIds=filtered.map(p=>p.id);
      const clickedIdx=visibleIds.indexOf(mon.id);
      if(e.shiftKey&&lastClicked!==null&&visibleIds.includes(lastClicked)){
        const anchorIdx=visibleIds.indexOf(lastClicked);
        const [lo,hi]=[Math.min(anchorIdx,clickedIdx),Math.max(anchorIdx,clickedIdx)];
        setSelected(prev=>{const next=new Set(prev);visibleIds.slice(lo,hi+1).forEach(id=>next.add(id));return next;});
      } else {
        setSelected(prev=>{const next=new Set(prev);next.has(mon.id)?next.delete(mon.id):next.add(mon.id);return next;});
      }
      setLastClicked(mon.id);
    } else {
      openDetail();
    }
  };

  const toggleCheckbox=(id,e)=>{
    e.stopPropagation();
    setSelected(prev=>{const next=new Set(prev);next.has(id)?next.delete(id):next.add(id);return next;});
    setLastClicked(id);
  };

  const exitSelectMode=()=>{setSelectMode(false);setSelected(new Set());setLastClicked(null);};

  const applyBulk=(markAs:boolean)=>{
    const next:{[key:string]:boolean}={...caught};
    selected.forEach((id:any)=>{next[id]=markAs;});
    setCaught(next);
    if(username)saveUser(username,next);
    exitSelectMode();
  };

  const handleQuick=(e)=>{
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
                    onMouseEnter={e=>e.currentTarget.style.borderColor="#5588ff"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=dex.screenDim}
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
            <DexInput value={inputName} onChange={e=>setInputName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Trainer name..." style={{flex:1}}/>
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
        <button onClick={handleLogout} style={{marginLeft:"auto",background:"none",border:"1px solid rgba(255,255,255,0.3)",borderRadius:6,color:"rgba(255,255,255,0.7)",fontSize:11,padding:"3px 10px",cursor:"pointer",fontFamily:"monospace"}}>LOGOUT</button>
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
                  <DexInput value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or #..." style={{flex:1,minWidth:110}}/>
                  <DexSelect value={filter} onChange={e=>setFilter(e.target.value)}>
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
                  <DexInput value={quickEntry} onChange={e=>setQuickEntry(e.target.value)} onKeyDown={handleQuick} placeholder="Quick toggle: name or # + Enter" style={{flex:1}}/>
                  {quickFeedback&&<span style={{fontSize:11,color:"#88cc88",fontFamily:"monospace",whiteSpace:"nowrap"}}>{quickFeedback}</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                  <DexButton onClick={()=>{setSelectMode(v=>!v);if(selectMode)exitSelectMode();}} active={selectMode} style={{fontSize:11,padding:"3px 10px"}}>
                    {selectMode?"Exit select (S)":"Select (S)"}
                  </DexButton>
                  {selectMode&&!selected.size&&<span style={{fontSize:11,color:dex.screenMuted,fontFamily:"monospace"}}>click to pick · shift+click for range</span>}
                  {selected.size>0&&<>
                    <span style={{fontSize:11,color:dex.screenMuted,fontFamily:"monospace"}}>{selected.size} selected</span>
                    <DexButton onClick={()=>applyBulk(true)} style={{fontSize:11,padding:"3px 10px",background:"#1a3a1a",borderColor:"#3a6a2a",color:"#88cc88"}}>Mark caught</DexButton>
                    <DexButton onClick={()=>applyBulk(false)} style={{fontSize:11,padding:"3px 10px"}}>Mark missing</DexButton>
                    <DexButton onClick={()=>{setSelected(new Set());setLastClicked(null);}} style={{fontSize:11,padding:"3px 10px"}}>Clear</DexButton>
                  </>}
                </div>
                {viewMode==="grid"?(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(96px,1fr))",gap:6}}>
                    {filtered.map(mon=><GridCard key={mon.id} mon={mon} caught={!!caught[mon.id]} selected={selected.has(mon.id)} selectMode={selectMode} onToggle={toggleCaught} onDetail={setDetail} onCardClick={handleCardClick} onCheckbox={toggleCheckbox}/>)}
                  </div>
                ):(
                  <div style={{border:`1px solid ${dex.screenDim}`,borderRadius:8,overflow:"hidden"}}>
                    {filtered.map(mon=><ListRow key={mon.id} mon={mon} caught={!!caught[mon.id]} selected={selected.has(mon.id)} selectMode={selectMode} onToggle={toggleCaught} onDetail={setDetail} onCardClick={handleCardClick} onCheckbox={toggleCheckbox}/>)}
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

      <DetailPanel mon={detail} onClose={()=>setDetail(null)}/>
    </div>
  );
}