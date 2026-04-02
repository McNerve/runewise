import type { RaidRoom, RaidUnique } from "./cox";

export const TOB_ROOMS: RaidRoom[] = [
  { name: "The Maiden of Sugadinti", type: "combat", mechanics: "Spawns blood spawns that heal her. Nylocas crawl along blood trails. Freeze blood spawns and kill them. Avoid standing in blood.", tips: "Freeze spawns with ice barrage. DPS race — kill her before too many spawns. Stack on one side to manage spawns." },
  { name: "Pestilent Bloat", type: "combat", mechanics: "Walks around the room. When stopped, DPS the boss. Avoid being in line of sight during walking phase (instant KO). Flies drop from ceiling.", tips: "Watch his walking pattern. Sprint to him when he stops. Run under him during walk phase to avoid flies." },
  { name: "Nylocas Vasilias", type: "combat", mechanics: "Three phases: wave clear (gray/green/blue nylos), boss fight with style switching. Boss changes colors — match your attack style or deal 0 damage.", tips: "Assign roles per color. Boss: watch color changes closely. Melee=gray, ranged=green, mage=blue." },
  { name: "Sotetseg", type: "combat", mechanics: "Alternates between normal attacks and maze phase. One player enters shadow realm maze — team follows their path. Ball attack splits damage.", tips: "Spread for ball attack. Maze runner calls path. Stay on correct tiles or take massive damage." },
  { name: "Xarpus", type: "combat", mechanics: "Three phases: healing (stands on exhumes), poison (shoots poison), scream (turns and screams, don't attack during scream). Stand on exhumes to prevent healing.", tips: "Phase 1: stand on yellow exhumes. Phase 2: dodge poison. Phase 3: DON'T ATTACK when screaming." },
  { name: "Verzik Vitur", type: "boss", mechanics: "Three phases. P1: use Dawnbringer to attack through shield. P2: dodge bombs, lightning, and nylocas crabs. P3: prayer switching, webs, green ball bounce.", tips: "P1: click Dawnbringer spec. P2: avoid purple tornadoes. P3: bounce green ball between players, prayer flick." },
];

export const TOB_UNIQUES: RaidUnique[] = [
  { name: "Scythe of vitur", pointsRequired: "MVP-based", rateDescription: "1/86 per completion (MVP weighted)" },
  { name: "Ghrazi rapier", pointsRequired: "MVP-based", rateDescription: "1/86 per completion" },
  { name: "Sanguinesti staff", pointsRequired: "MVP-based", rateDescription: "1/86 per completion" },
  { name: "Justiciar faceguard", pointsRequired: "MVP-based", rateDescription: "1/86 per completion" },
  { name: "Justiciar chestguard", pointsRequired: "MVP-based", rateDescription: "1/86 per completion" },
  { name: "Justiciar legguards", pointsRequired: "MVP-based", rateDescription: "1/86 per completion" },
  { name: "Avernic defender hilt", pointsRequired: "MVP-based", rateDescription: "1/86 per completion" },
  { name: "Lil' zik", pointsRequired: "N/A", rateDescription: "1/650 per completion (pet)" },
];
