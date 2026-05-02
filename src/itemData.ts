// ─── Item Acquisition Data ────────────────────────────────────────────────────
// Structured item location data by game.
// Add new generations by appending to this file.
// Keys match PokéAPI item raw names (lowercase, hyphens).
//
// Methods: "buy" | "find" | "gift" | "tm" | "hm" | "reward" | "craft"
// games: exact game names as strings

export type AcquisitionEntry = {
  method: "buy" | "find" | "gift" | "tm" | "hm" | "reward" | "craft";
  location: string;
  price?: number;
  games: string[];
  notes?: string;
};

export const ITEM_ACQUISITION: { [itemName: string]: AcquisitionEntry[] } = {

  // ═══════════════════════════════════════════════════════════════════════════
  // GEN 1 — Red, Blue, Yellow
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Poké Balls ─────────────────────────────────────────────────────────────
  "poke-ball": [
    { method: "buy", location: "Viridian City Mart",              price: 200,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Pewter City Mart",                price: 200,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Cerulean City Mart",              price: 200,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Lavender Town Mart",              price: 200,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Vermilion City Mart",             price: 200,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Celadon Dept. Store 2F",          price: 200,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Fuchsia City Mart",               price: 200,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Saffron City Mart",               price: 200,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Cinnabar Island Mart",            price: 200,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Indigo Plateau Mart",             price: 200,  games: ["Red", "Blue", "Yellow"] },
  ],
  "great-ball": [
    { method: "buy", location: "Lavender Town Mart",              price: 600,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Vermilion City Mart",             price: 600,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Celadon Dept. Store 2F",          price: 600,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Fuchsia City Mart",               price: 600,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Saffron City Mart",               price: 600,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Cinnabar Island Mart",            price: 600,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Indigo Plateau Mart",             price: 600,  games: ["Red", "Blue", "Yellow"] },
  ],
  "ultra-ball": [
    { method: "buy", location: "Celadon Dept. Store 2F",          price: 1200, games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Fuchsia City Mart",               price: 1200, games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Saffron City Mart",               price: 1200, games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Cinnabar Island Mart",            price: 1200, games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Indigo Plateau Mart",             price: 1200, games: ["Red", "Blue", "Yellow"] },
  ],
  "master-ball": [
    { method: "gift", location: "Silph Co. 5F — President",       games: ["Red", "Blue", "Yellow"], notes: "Reward for rescuing the Silph Co. president from Team Rocket" },
  ],
  "safari-ball": [
    { method: "gift", location: "Safari Zone entrance",           games: ["Red", "Blue", "Yellow"], notes: "30 balls given at the start of each Safari Zone visit" },
  ],

  // ── Medicine ───────────────────────────────────────────────────────────────
  "potion": [
    { method: "buy", location: "Viridian City Mart",              price: 300,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Pewter City Mart",                price: 300,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Cerulean City Mart",              price: 300,  games: ["Red", "Blue", "Yellow"] },
  ],
  "super-potion": [
    { method: "buy", location: "Cerulean City Mart",              price: 700,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Lavender Town Mart",              price: 700,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Vermilion City Mart",             price: 700,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Celadon Dept. Store 2F",          price: 700,  games: ["Red", "Blue", "Yellow"] },
  ],
  "hyper-potion": [
    { method: "buy", location: "Celadon Dept. Store 2F",          price: 1500, games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Fuchsia City Mart",               price: 1500, games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Saffron City Mart",               price: 1500, games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Cinnabar Island Mart",            price: 1500, games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Indigo Plateau Mart",             price: 1500, games: ["Red", "Blue", "Yellow"] },
  ],
  "max-potion": [
    { method: "buy", location: "Indigo Plateau Mart",             price: 2500, games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Safari Zone (Area 3)",           games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Victory Road",                   games: ["Red", "Blue", "Yellow"] },
  ],
  "full-restore": [
    { method: "buy", location: "Indigo Plateau Mart",             price: 3000, games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Silph Co. 3F",                   games: ["Red", "Blue", "Yellow"] },
  ],
  "revive": [
    { method: "buy", location: "Lavender Town Mart",              price: 1500, games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Vermilion City Mart",             price: 1500, games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Celadon Dept. Store 2F",          price: 1500, games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Fuchsia City Mart",               price: 1500, games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Saffron City Mart",               price: 1500, games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Cinnabar Island Mart",            price: 1500, games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Indigo Plateau Mart",             price: 1500, games: ["Red", "Blue", "Yellow"] },
  ],
  "max-revive": [
    { method: "find", location: "Route 12",                       games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Silph Co. 5F",                   games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Victory Road",                   games: ["Red", "Blue", "Yellow"] },
  ],
  "full-heal": [
    { method: "buy", location: "Celadon Dept. Store 2F",          price: 600,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Fuchsia City Mart",               price: 600,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Saffron City Mart",               price: 600,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Cinnabar Island Mart",            price: 600,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Indigo Plateau Mart",             price: 600,  games: ["Red", "Blue", "Yellow"] },
  ],
  "antidote": [
    { method: "buy", location: "Viridian City Mart",              price: 100,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Pewter City Mart",                price: 100,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Cerulean City Mart",              price: 100,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Lavender Town Mart",              price: 100,  games: ["Red", "Blue", "Yellow"] },
  ],
  "parlyz-heal": [
    { method: "buy", location: "Viridian City Mart",              price: 200,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Pewter City Mart",                price: 200,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Cerulean City Mart",              price: 200,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Lavender Town Mart",              price: 200,  games: ["Red", "Blue", "Yellow"] },
  ],
  "awakening": [
    { method: "buy", location: "Viridian City Mart",              price: 250,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Pewter City Mart",                price: 250,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Cerulean City Mart",              price: 250,  games: ["Red", "Blue", "Yellow"] },
  ],
  "burn-heal": [
    { method: "buy", location: "Viridian City Mart",              price: 250,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Pewter City Mart",                price: 250,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Cerulean City Mart",              price: 250,  games: ["Red", "Blue", "Yellow"] },
  ],
  "ice-heal": [
    { method: "buy", location: "Cerulean City Mart",              price: 250,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Lavender Town Mart",              price: 250,  games: ["Red", "Blue", "Yellow"] },
  ],
  "ether": [
    { method: "find", location: "Mt. Moon",                       games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Route 24",                       games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Celadon City",                   games: ["Red", "Blue", "Yellow"] },
  ],
  "max-ether": [
    { method: "find", location: "Route 17",                       games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Silph Co.",                      games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Victory Road",                   games: ["Red", "Blue", "Yellow"] },
  ],
  "elixir": [
    { method: "find", location: "Route 11",                       games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Celadon Dept. Store roof",       games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Safari Zone",                    games: ["Red", "Blue", "Yellow"] },
  ],
  "max-elixir": [
    { method: "find", location: "Victory Road",                   games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Cerulean Cave",                  games: ["Red", "Blue", "Yellow"] },
  ],

  // ── Vitamins ───────────────────────────────────────────────────────────────
  "hp-up": [
    { method: "buy", location: "Celadon Dept. Store 3F",          price: 9800, games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Silph Co.",                      games: ["Red", "Blue", "Yellow"] },
  ],
  "protein": [
    { method: "buy", location: "Celadon Dept. Store 3F",          price: 9800, games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Route 16",                       games: ["Red", "Blue", "Yellow"] },
  ],
  "iron": [
    { method: "buy", location: "Celadon Dept. Store 3F",          price: 9800, games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Safari Zone",                    games: ["Red", "Blue", "Yellow"] },
  ],
  "calcium": [
    { method: "buy", location: "Celadon Dept. Store 3F",          price: 9800, games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Pokémon Mansion",                games: ["Red", "Blue", "Yellow"] },
  ],
  "carbos": [
    { method: "buy", location: "Celadon Dept. Store 3F",          price: 9800, games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Route 9",                        games: ["Red", "Blue", "Yellow"] },
  ],
  "rare-candy": [
    { method: "find", location: "Mt. Moon",                       games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Rocket Hideout",                 games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Safari Zone",                    games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Pokémon Mansion",                games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Cerulean Cave",                  games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Victory Road",                   games: ["Red", "Blue", "Yellow"] },
  ],
  "pp-up": [
    { method: "find", location: "Celadon Dept. Store roof",       games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Silph Co.",                      games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Victory Road",                   games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Cerulean Cave",                  games: ["Red", "Blue", "Yellow"] },
  ],

  // ── Battle Items ───────────────────────────────────────────────────────────
  "x-attack": [
    { method: "buy", location: "Celadon Dept. Store 2F",          price: 500,  games: ["Red", "Blue", "Yellow"] },
  ],
  "x-defend": [
    { method: "buy", location: "Celadon Dept. Store 2F",          price: 550,  games: ["Red", "Blue", "Yellow"] },
  ],
  "x-speed": [
    { method: "buy", location: "Celadon Dept. Store 2F",          price: 350,  games: ["Red", "Blue", "Yellow"] },
  ],
  "x-accuracy": [
    { method: "buy", location: "Celadon Dept. Store 2F",          price: 950,  games: ["Red", "Blue", "Yellow"] },
  ],
  "x-special": [
    { method: "buy", location: "Celadon Dept. Store 2F",          price: 350,  games: ["Red", "Blue", "Yellow"] },
  ],
  "guard-spec": [
    { method: "buy", location: "Celadon Dept. Store 2F",          price: 700,  games: ["Red", "Blue", "Yellow"] },
  ],
  "dire-hit": [
    { method: "buy", location: "Celadon Dept. Store 2F",          price: 650,  games: ["Red", "Blue", "Yellow"] },
  ],

  // ── Evolution Stones ───────────────────────────────────────────────────────
  "fire-stone": [
    { method: "buy", location: "Celadon Dept. Store 4F",          price: 2100, games: ["Red", "Blue", "Yellow"] },
  ],
  "water-stone": [
    { method: "buy", location: "Celadon Dept. Store 4F",          price: 2100, games: ["Red", "Blue", "Yellow"] },
  ],
  "thunder-stone": [
    { method: "buy", location: "Celadon Dept. Store 4F",          price: 2100, games: ["Red", "Blue", "Yellow"] },
  ],
  "leaf-stone": [
    { method: "buy", location: "Celadon Dept. Store 4F",          price: 2100, games: ["Red", "Blue", "Yellow"] },
  ],
  "moon-stone": [
    { method: "find", location: "Mt. Moon — top-left area",       games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Mt. Moon — hidden, near exit",   games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Route 2 — south of Diglett's Cave", games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Rocket Hideout B4F",             games: ["Red", "Blue", "Yellow"] },
    { method: "find", location: "Pokémon Mansion — hidden",       games: ["Red", "Blue", "Yellow"] },
  ],

  // ── Repels & Consumables ───────────────────────────────────────────────────
  "repel": [
    { method: "buy", location: "Viridian City Mart",              price: 350,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Pewter City Mart",                price: 350,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Cerulean City Mart",              price: 350,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Lavender Town Mart",              price: 350,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Vermilion City Mart",             price: 350,  games: ["Red", "Blue", "Yellow"] },
  ],
  "super-repel": [
    { method: "buy", location: "Celadon Dept. Store 2F",          price: 500,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Fuchsia City Mart",               price: 500,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Saffron City Mart",               price: 500,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Cinnabar Island Mart",            price: 500,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Indigo Plateau Mart",             price: 500,  games: ["Red", "Blue", "Yellow"] },
  ],
  "max-repel": [
    { method: "buy", location: "Celadon Dept. Store 2F",          price: 700,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Fuchsia City Mart",               price: 700,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Saffron City Mart",               price: 700,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Cinnabar Island Mart",            price: 700,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Indigo Plateau Mart",             price: 700,  games: ["Red", "Blue", "Yellow"] },
  ],
  "escape-rope": [
    { method: "buy", location: "Cerulean City Mart",              price: 550,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Lavender Town Mart",              price: 550,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Vermilion City Mart",             price: 550,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Celadon Dept. Store 2F",          price: 550,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Fuchsia City Mart",               price: 550,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Saffron City Mart",               price: 550,  games: ["Red", "Blue", "Yellow"] },
    { method: "buy", location: "Cinnabar Island Mart",            price: 550,  games: ["Red", "Blue", "Yellow"] },
  ],
  "fresh-water": [
    { method: "buy", location: "Celadon Dept. Store roof — vending machine", price: 200, games: ["Red", "Blue", "Yellow"] },
  ],
  "soda-pop": [
    { method: "buy", location: "Celadon Dept. Store roof — vending machine", price: 300, games: ["Red", "Blue", "Yellow"] },
  ],
  "lemonade": [
    { method: "buy", location: "Celadon Dept. Store roof — vending machine", price: 350, games: ["Red", "Blue", "Yellow"] },
  ],

  // ── Fossils & Loot ─────────────────────────────────────────────────────────
  "dome-fossil": [
    { method: "find", location: "Mt. Moon — choose one of two fossils", games: ["Red", "Blue"], notes: "Revive into Kabuto at Cinnabar Island Lab. Exclusive to Red/Blue; Yellow gives Old Amber instead." },
  ],
  "helix-fossil": [
    { method: "find", location: "Mt. Moon — choose one of two fossils", games: ["Red", "Blue"], notes: "Revive into Omanyte at Cinnabar Island Lab. Exclusive to Red/Blue." },
  ],
  "old-amber": [
    { method: "find", location: "Pewter City Museum — back room",  games: ["Red", "Blue", "Yellow"], notes: "Revive into Aerodactyl at Cinnabar Island Lab" },
  ],
  "nugget": [
    { method: "reward", location: "Nugget Bridge — Route 25",      games: ["Red", "Blue", "Yellow"], notes: "Complete the trainer gauntlet" },
    { method: "find", location: "Rocket Hideout B4F",              games: ["Red", "Blue"] },
  ],
  "gold-teeth": [
    { method: "find", location: "Safari Zone (Area 3)",            games: ["Red", "Blue", "Yellow"], notes: "Give to the Safari Zone warden to receive HM Strength" },
  ],

  // ── Key Items ──────────────────────────────────────────────────────────────
  "bicycle": [
    { method: "gift", location: "Cerulean City Bicycle Shop",     games: ["Red", "Blue", "Yellow"], notes: "Requires Bike Voucher from Pokémon Fan Club Chairman in Vermilion City" },
  ],
  "bike-voucher": [
    { method: "gift", location: "Pokémon Fan Club — Vermilion City", games: ["Red", "Blue", "Yellow"], notes: "Talk to the chairman after listening to his story" },
  ],
  "old-rod": [
    { method: "gift", location: "Vermilion City — fisherman near gym", games: ["Red", "Blue", "Yellow"] },
  ],
  "good-rod": [
    { method: "gift", location: "Fuchsia City — house near Safari Zone entrance", games: ["Red", "Blue", "Yellow"] },
  ],
  "super-rod": [
    { method: "gift", location: "Route 12 — house south of Lavender Town", games: ["Red", "Blue", "Yellow"] },
  ],
  "ss-ticket": [
    { method: "gift", location: "Vermilion City — from Bill",     games: ["Red", "Blue", "Yellow"], notes: "Received after visiting Bill at his cottage on Route 25" },
  ],
  "card-key": [
    { method: "find", location: "Silph Co. 5F",                   games: ["Red", "Blue", "Yellow"], notes: "Required to open locked doors throughout Silph Co." },
  ],
  "coin-case": [
    { method: "gift", location: "Celadon City — diner",           games: ["Red", "Blue", "Yellow"], notes: "Trade a Lemonade to the man at the counter" },
  ],
  "silph-scope": [
    { method: "find", location: "Rocket Hideout B4F",             games: ["Red", "Blue", "Yellow"], notes: "Required to identify ghost Pokémon in Pokémon Tower" },
  ],
  "poke-flute": [
    { method: "gift", location: "Lavender Town — Mr. Fuji",       games: ["Red", "Blue", "Yellow"], notes: "Rescue Mr. Fuji from the top floor of Pokémon Tower" },
  ],
  "lift-key": [
    { method: "find", location: "Rocket Hideout B4F",             games: ["Red", "Blue", "Yellow"], notes: "Required to operate the elevator in the Rocket Hideout" },
  ],
  "secret-key": [
    { method: "find", location: "Pokémon Mansion B1F",            games: ["Red", "Blue", "Yellow"], notes: "Unlocks the Cinnabar Island Gym" },
  ],
  "town-map": [
    { method: "gift", location: "Pallet Town — Daisy (Gary's sister)", games: ["Red", "Blue", "Yellow"] },
  ],
  "itemfinder": [
    { method: "gift", location: "Route 11 — Oak's aide (east gate)", games: ["Red", "Blue", "Yellow"], notes: "Requires 30+ Pokémon in your Pokédex" },
  ],
  "exp-share": [
    { method: "gift", location: "Route 15 — Oak's aide (south gate)", games: ["Red", "Blue", "Yellow"], notes: "Requires 50+ Pokémon in your Pokédex" },
  ],
  "poke-doll": [
    { method: "buy", location: "Celadon Dept. Store 4F",          price: 1000, games: ["Red", "Blue", "Yellow"] },
    { method: "gift", location: "Lavender Town — Volunteer Pokémon House", games: ["Red", "Blue", "Yellow"], notes: "Used to escape the ghost encounter in Pokémon Tower (Yellow)" },
  ],

  // ── TMs ────────────────────────────────────────────────────────────────────
  "tm01": [{ method: "tm", location: "Brock — Pewter City Gym",              games: ["Red", "Blue", "Yellow"], notes: "Mega Punch" }],
  "tm02": [{ method: "tm", location: "Route 4 — item ball",                  games: ["Red", "Blue", "Yellow"], notes: "Razor Wind" }],
  "tm03": [{ method: "tm", location: "Saffron City — Fighting Dojo",         games: ["Red", "Blue", "Yellow"], notes: "Swords Dance" }],
  "tm04": [{ method: "tm", location: "Safari Zone (Area 1) — item ball",     games: ["Red", "Blue", "Yellow"], notes: "Whirlwind" }],
  "tm05": [{ method: "tm", location: "Cerulean City — house",                games: ["Red", "Blue", "Yellow"], notes: "Mega Kick" }],
  "tm06": [{ method: "tm", location: "Koga — Fuchsia City Gym",              games: ["Red", "Blue", "Yellow"], notes: "Toxic" }],
  "tm07": [{ method: "buy", location: "Celadon Dept. Store 4F",              price: 2000, games: ["Red", "Blue", "Yellow"], notes: "Horn Drill" }],
  "tm08": [{ method: "reward", location: "Celadon Game Corner",              games: ["Red", "Blue", "Yellow"], notes: "Body Slam — 9800 coins (RB) / 6000 coins (Yellow)" }],
  "tm09": [{ method: "tm", location: "Silph Co. 6F — item ball",             games: ["Red", "Blue", "Yellow"], notes: "Take Down" }],
  "tm10": [{ method: "tm", location: "Silph Co. 7F — item ball",             games: ["Red", "Blue", "Yellow"], notes: "Double-Edge" }],
  "tm11": [{ method: "buy", location: "Celadon Dept. Store 4F",              price: 2000, games: ["Red", "Blue", "Yellow"], notes: "BubbleBeam" }],
  "tm12": [{ method: "buy", location: "Celadon Dept. Store 4F",              price: 2000, games: ["Red", "Blue", "Yellow"], notes: "Water Gun" }],
  "tm13": [{ method: "buy", location: "Celadon Dept. Store 4F",              price: 2000, games: ["Red", "Blue", "Yellow"], notes: "Ice Beam" }],
  "tm14": [{ method: "buy", location: "Celadon Dept. Store 4F",              price: 5500, games: ["Red", "Blue", "Yellow"], notes: "Blizzard" }],
  "tm15": [{ method: "reward", location: "Celadon Game Corner",              games: ["Red", "Blue", "Yellow"], notes: "Hyper Beam — 7500 coins (RB) / 5500 coins (Yellow)" }],
  "tm16": [{ method: "tm", location: "Route 12 — item ball",                 games: ["Red", "Blue", "Yellow"], notes: "Pay Day" }],
  "tm17": [{ method: "buy", location: "Celadon Dept. Store 4F",              price: 3000, games: ["Red", "Blue", "Yellow"], notes: "Submission" }],
  "tm18": [{ method: "reward", location: "Celadon Game Corner",              games: ["Red", "Blue", "Yellow"], notes: "Counter — 4150 coins (RB) / 3300 coins (Yellow)" }],
  "tm19": [{ method: "tm", location: "Route 25 — item ball",                 games: ["Red", "Blue", "Yellow"], notes: "Seismic Toss" }],
  "tm20": [{ method: "tm", location: "Silph Co. 3F — item ball",             games: ["Red", "Blue", "Yellow"], notes: "Rage" }],
  "tm21": [{ method: "tm", location: "Rocket Hideout B4F — item ball",       games: ["Red", "Blue", "Yellow"], notes: "Mega Drain" }],
  "tm22": [{ method: "tm", location: "Pokémon Mansion 3F — item ball",       games: ["Red", "Blue", "Yellow"], notes: "SolarBeam" }],
  "tm23": [{ method: "reward", location: "Celadon Game Corner",              games: ["Red", "Blue", "Yellow"], notes: "Dragon Rage — 3300 coins (RB) / 3500 coins (Yellow)" }],
  "tm24": [{ method: "buy", location: "Celadon Dept. Store 4F",              price: 5500, games: ["Red", "Blue", "Yellow"], notes: "Thunderbolt" }],
  "tm25": [{ method: "buy", location: "Celadon Dept. Store 4F",              price: 5500, games: ["Red", "Blue", "Yellow"], notes: "Thunder" }],
  "tm26": [{ method: "tm", location: "Silph Co. 4F — item ball",             games: ["Red", "Blue", "Yellow"], notes: "Earthquake" }],
  "tm27": [{ method: "tm", location: "Giovanni — Viridian City Gym",         games: ["Red", "Blue", "Yellow"], notes: "Fissure" }],
  "tm28": [{ method: "tm", location: "Cerulean Cape — from Bill's neighbor", games: ["Red", "Blue", "Yellow"], notes: "Dig" }],
  "tm29": [{ method: "tm", location: "Sabrina — Saffron City Gym",           games: ["Red", "Blue", "Yellow"], notes: "Psychic" }],
  "tm30": [{ method: "reward", location: "Celadon Game Corner",              games: ["Yellow"], notes: "Teleport — 1000 coins (Yellow only)" }],
  "tm31": [{ method: "tm", location: "Silph Co. 2F — item ball",             games: ["Red", "Blue", "Yellow"], notes: "Mimic" }],
  "tm32": [{ method: "tm", location: "Route 15 — item ball",                 games: ["Red", "Blue", "Yellow"], notes: "Double Team" }],
  "tm33": [{ method: "buy", location: "Celadon Dept. Store 4F",              price: 3000, games: ["Red", "Blue", "Yellow"], notes: "Reflect" }],
  "tm34": [{ method: "buy", location: "Celadon Dept. Store 4F",              price: 1000, games: ["Red", "Blue", "Yellow"], notes: "Bide" }],
  "tm35": [{ method: "tm", location: "Pokémon Mansion 1F — item ball",       games: ["Red", "Blue", "Yellow"], notes: "Metronome" }],
  "tm36": [{ method: "buy", location: "Celadon Dept. Store 4F",              price: 1000, games: ["Red", "Blue", "Yellow"], notes: "Self-Destruct" }],
  "tm37": [{ method: "tm", location: "Pokémon Mansion 1F — item ball",       games: ["Red", "Blue", "Yellow"], notes: "Egg Bomb" }],
  "tm38": [{ method: "tm", location: "Blaine — Cinnabar Island Gym",         games: ["Red", "Blue", "Yellow"], notes: "Fire Blast" }],
  "tm39": [{ method: "tm", location: "Route 12 — item ball",                 games: ["Red", "Blue", "Yellow"], notes: "Swift" }],
  "tm40": [{ method: "tm", location: "Pewter City Museum — back room",       games: ["Red", "Blue", "Yellow"], notes: "Skull Bash" }],
  "tm41": [{ method: "buy", location: "Celadon Dept. Store 4F",              price: 6500, games: ["Red", "Blue", "Yellow"], notes: "Softboiled" }],
  "tm42": [{ method: "tm", location: "Lt. Surge — Vermilion City Gym",       games: ["Red", "Blue", "Yellow"], notes: "Dream Eater" }],
  "tm43": [{ method: "tm", location: "Pokémon Tower 5F — item ball",         games: ["Red", "Blue", "Yellow"], notes: "Sky Attack" }],
  "tm44": [{ method: "tm", location: "Seafoam Islands — item ball",          games: ["Red", "Blue", "Yellow"], notes: "Rest" }],
  "tm45": [{ method: "tm", location: "Misty — Cerulean City Gym",            games: ["Red", "Blue", "Yellow"], notes: "Thunder Wave" }],
  "tm46": [{ method: "tm", location: "Route 9 — item ball",                  games: ["Red", "Blue", "Yellow"], notes: "Psywave" }],
  "tm47": [{ method: "tm", location: "Seafoam Islands — item ball",          games: ["Red", "Blue", "Yellow"], notes: "Explosion" }],
  "tm48": [{ method: "tm", location: "Pokémon Mansion B1F — item ball",      games: ["Red", "Blue", "Yellow"], notes: "Rock Slide" }],
  "tm49": [{ method: "tm", location: "Safari Zone — item ball",              games: ["Red", "Blue", "Yellow"], notes: "Tri Attack" }],
  "tm50": [{ method: "tm", location: "Silph Co. 9F — item ball",             games: ["Red", "Blue", "Yellow"], notes: "Substitute" }],

  // ── HMs ────────────────────────────────────────────────────────────────────
  "hm01": [{ method: "hm", location: "Diglett's Cave — south exit NPC",      games: ["Red", "Blue", "Yellow"], notes: "Cut — Requires Boulder Badge" }],
  "hm02": [{ method: "hm", location: "Safari Zone warden — Fuchsia City",    games: ["Red", "Blue", "Yellow"], notes: "Fly — Return Gold Teeth to the warden. Requires Thunder Badge" }],
  "hm03": [{ method: "hm", location: "Route 19 — house",                     games: ["Red", "Blue", "Yellow"], notes: "Surf — Requires Soul Badge" }],
  "hm04": [{ method: "hm", location: "Safari Zone warden — after Gold Teeth", games: ["Red", "Blue", "Yellow"], notes: "Strength — Requires Rainbow Badge. Same NPC as Fly" }],
  "hm05": [{ method: "hm", location: "Route 2 — Oak's aide (east gate)",     games: ["Red", "Blue", "Yellow"], notes: "Flash — Requires Boulder Badge and 10+ Pokémon in Pokédex" }],

  // ═══════════════════════════════════════════════════════════════════════════
  // GEN 2 — Coming soon (Gold, Silver, Crystal)
  // ═══════════════════════════════════════════════════════════════════════════

};
