import type { RaidRoom, RaidUnique } from "./cox";

export const TOA_ROOMS: RaidRoom[] = [
  { name: "Akkha", type: "combat", mechanics: "Four elemental phases cycling through shadow, detonate, memory, and final. Attacks cycle between melee and ranged. Memory orbs must be matched to correct corner.", tips: "Pray melee, switch to ranged on animation. Memory phase: stand on matching orb. Use spec weapons early." },
  { name: "Ba-Ba", type: "combat", mechanics: "Boulder-throwing baboon. Dodge falling boulders. Spawns baboon minions that throw bananas. Standing in shadow reduces damage taken.", tips: "Dodge boulders first, then DPS. Kill shamans quickly. Stand in shadow during special attack." },
  { name: "Kephri", type: "combat", mechanics: "Scarab boss with dung beetle mechanics. Destroy dung piles to prevent healing. Spawns swarms of scarabs. Puzzle involves pushing dung to holes.", tips: "Prioritize dung piles over DPSing boss. Kill swarms before they overwhelm. Puzzle is simple push mechanic." },
  { name: "Zebak", type: "combat", mechanics: "Crocodile boss with water mechanics. Avoid waves of water. Blood attacks heal him — dodge blood. Enrage increases damage over time.", tips: "Dodge waves and blood. Use ranged to maintain distance. Bring restore potions for energy drain." },
  { name: "Het's Obelisk", type: "puzzle", mechanics: "Mining puzzle. Mine the obelisk core while dodging lightning. Restore HP at mirrorback crystals. Core has multiple HP bars.", tips: "Mine until low HP, then heal at crystal. Avoid lightning strikes. Group coordination for faster clear." },
  { name: "Apmeken's Puzzle", type: "puzzle", mechanics: "Light puzzle. Redirect light beams by rotating mirrors. Kill shadow creatures that spawn. Baboon volatiles explode if not killed.", tips: "Focus volatiles first (they explode). Then rotate mirrors. One player can solve while others defend." },
  { name: "Scabaras' Puzzle", type: "puzzle", mechanics: "Matching puzzle. Flip tiles to reveal and match pairs. Incorrect matches spawn scarabs. Timer-based.", tips: "Memorize tile positions. Work systematically from one corner. Kill spawned scarabs between attempts." },
  { name: "Crondis' Puzzle", type: "puzzle", mechanics: "Watering puzzle. Carry water jugs to palm trees without spilling. Crocodiles and obstacles block the path.", tips: "Shortest path to trees. Protect water carriers. Multiple trips needed — coordinate in teams." },
  { name: "The Wardens", type: "boss", mechanics: "Three-phase final boss. P1: attack Elidinis/Tumeken wardens, dodge slam. P2: destroy core, avoid falling rocks and lightning. P3: prayer switching with powerful attacks, enrage at low HP.", tips: "P1: DPS one warden at a time. P2: focus core, dodge mechanics. P3: prayer flick accurately — mistakes are punishing at high invocations." },
];

export const TOA_UNIQUES: RaidUnique[] = [
  { name: "Osmumten's fang", pointsRequired: "Invocation-based", rateDescription: "1/48 at 150 invocation (scales with invocation level)" },
  { name: "Tumeken's shadow", pointsRequired: "Invocation-based", rateDescription: "1/24 at 300+ invocation (rarest drop)" },
  { name: "Lightbearer", pointsRequired: "Invocation-based", rateDescription: "1/48 at 150 invocation" },
  { name: "Masori mask", pointsRequired: "Invocation-based", rateDescription: "1/48 at 150 invocation" },
  { name: "Masori body", pointsRequired: "Invocation-based", rateDescription: "1/48 at 150 invocation" },
  { name: "Masori chaps", pointsRequired: "Invocation-based", rateDescription: "1/48 at 150 invocation" },
  { name: "Elidinis' ward", pointsRequired: "Invocation-based", rateDescription: "1/48 at 150 invocation" },
  { name: "Tumeken's guardian", pointsRequired: "N/A", rateDescription: "1/350+ per completion (pet)" },
];
