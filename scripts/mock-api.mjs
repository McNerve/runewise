/**
 * Offline mock of every external API the app consumes, for visual QA in
 * sandboxes without network access. Start with `node scripts/mock-api.mjs`,
 * then run vite with RW_MOCK_API=1 so the dev proxy targets this server.
 * Test player: Raxor.
 */
import http from "node:http";
import { QA_PAGES } from "./mock-wiki-pages.mjs";

const PORT = 5198;

// ---------- GE price data ----------
const ITEMS = [
  { id: 4151, name: "Abyssal whip", examine: "A weapon from the abyss.", members: true, lowalch: 48000, highalch: 72000, limit: 70, value: 120001, icon: "Abyssal whip.png", high: 1_650_000, low: 1_602_000, volume: 4521 },
  { id: 26382, name: "Torva full helm", examine: "Ancient ceremonial armour.", members: true, lowalch: 200000, highalch: 300000, limit: 8, value: 500000, icon: "Torva full helm.png", high: 480_000_000, low: 472_000_000, volume: 38 },
  { id: 19553, name: "Amulet of torture", examine: "A deadly amulet.", members: true, lowalch: 80400, highalch: 120600, limit: 8, value: 201000, icon: "Amulet of torture.png", high: 21_400_000, low: 21_000_000, volume: 312 },
  { id: 20997, name: "Twisted bow", examine: "A bow of extraordinary power.", members: true, lowalch: 57600, highalch: 72000, limit: 8, value: 96000, icon: "Twisted bow.png", high: 1_420_000_000, low: 1_398_000_000, volume: 12 },
  { id: 12006, name: "Abyssal tentacle", examine: "A tentacled whip.", members: true, lowalch: 48000, highalch: 72000, limit: 70, value: 120001, icon: "Abyssal tentacle.png", high: 2_950_000, low: 2_870_000, volume: 822 },
  { id: 11802, name: "Bandos godsword", examine: "A brutally heavy sword.", members: true, lowalch: 500000, highalch: 750000, limit: 8, value: 1250000, icon: "Bandos godsword.png", high: 14_900_000, low: 14_500_000, volume: 211 },
  { id: 13652, name: "Dragon claws", examine: "A set of fighting claws.", members: true, lowalch: 81666, highalch: 122500, limit: 8, value: 205000, icon: "Dragon claws.png", high: 48_200_000, low: 47_100_000, volume: 96 },
  { id: 12924, name: "Toxic blowpipe", examine: "A deadly blowpipe.", members: true, lowalch: 36000, highalch: 54000, limit: 8, value: 90000, icon: "Toxic blowpipe.png", high: 6_400_000, low: 6_250_000, volume: 433 },
  // Untradeable league item: present in mapping with NO price data — this is
  // the Demonic quill regression case from the user's screenshot.
  { id: 31999, name: "Demonic quill", examine: "A quill from a demonic familiar.", members: true, lowalch: null, highalch: null, limit: null, value: 1, icon: "Demonic quill.png" },
];

const mapping = ITEMS.map(({ high, low, volume, ...m }) => m);
const latest = Object.fromEntries(
  ITEMS.filter((i) => i.high != null).map((i) => [i.id, { high: i.high, highTime: 1781100000, low: i.low, lowTime: 1781090000 }])
);
const volumes = Object.fromEntries(ITEMS.filter((i) => i.volume != null).map((i) => [i.id, i.volume]));

// ---------- Wiki pages ----------
const PARA = (t) => `<p>${t}</p>`;

function infoboxRow(label, value) {
  return `<tr><th>${label}</th><td>${value}</td></tr>`;
}

// Realistic MediaWiki infobox markup: switch buttons, advanced-data rows,
// line breaks and nested spans inside values — the messy real-world shapes
// the parser has to survive.
const DEMONIC_QUILL = `
<div class="mw-parser-output">
<table class="infobox infobox-item infobox-switch">
<caption>Demonic quill</caption>
<tr><td colspan="2" class="infobox-image"><a href="/w/File:Demonic_quill_detail.png"><img src="/images/thumb/Demonic_quill_detail.png/120px-Demonic_quill_detail.png" width="120" height="110"></a></td></tr>
${infoboxRow("Released", '<span><a href="/w/15_April">15 April</a> <a href="/w/2026">2026</a> <small>(<a href="/w/Update:Leagues">Update</a>)</small></span>')}
${infoboxRow("Members", "Yes")}
${infoboxRow("League Region", '<a href="/w/Kourend">Kourend</a><br><a href="/w/Tirannwn">Tirannwn</a>')}
${infoboxRow("Tradeable", "No")}
${infoboxRow("Equipable", "No")}
${infoboxRow("Stackable", "No")}
${infoboxRow("Options", "Use, Combine, Drop")}
${infoboxRow("Examine", "A quill from a demonic familiar.")}
<tr class="advanced-data"><th>Item ID</th><td>31999</td></tr>
</table>
${PARA('The <b>demonic quill</b> is an item purchased from the <a href="/w/Leagues_Reward_Shop">Leagues Reward Shop</a> for 3,000 League points. It can be combined with a <a href="/w/Slayer_helmet">slayer helmet</a> to create an <a href="/w/Oathplate_slayer_helmet">oathplate slayer helmet</a>.')}
<div class="mw-heading2"><h2>Shop locations</h2><span class="mw-editsection">[edit]</span></div>
<table class="wikitable">
<tr><th>Seller</th><th>Location</th><th>Number in stock</th><th>Restock time</th><th>Price sold at</th></tr>
<tr><td><a href="/w/Leagues_Reward_Shop">Leagues Reward Shop</a></td><td><a href="/w/Lumbridge_Castle">Lumbridge Castle</a></td><td>&#8734;</td><td>N/A</td><td>3,000</td></tr>
</table>
<div class="mw-heading2"><h2>Creation</h2><span class="mw-editsection">[edit]</span></div>
${PARA("Combining the quill with a slayer helmet requires level 55 Crafting and is irreversible.")}
<div class="mw-heading3"><h3>Requirements</h3></div>
${PARA("Level 55 Crafting. The combination cannot be undone, so consider carefully.")}
<div class="mw-heading2"><h2>Update history</h2></div>
${PARA("This section should be filtered out of the structured view entirely.")}
</div>`;

const ABYSSAL_WHIP = `
<div class="mw-parser-output">
<table class="infobox infobox-item">
<caption>Abyssal whip</caption>
${infoboxRow("Released", '26 January 2005 (Update)')}
${infoboxRow("Members", "Yes")}
${infoboxRow("Tradeable", "Yes")}
${infoboxRow("Equipable", "Yes")}
${infoboxRow("High alch", "72,000 coins")}
${infoboxRow("Weight", "0.453 kg")}
</table>
${PARA('The <b>abyssal whip</b> is a one-handed melee weapon requiring 70 <a href="/w/Attack">Attack</a> to wield. It is a common drop from <a href="/w/Abyssal_demon">abyssal demons</a>.')}
<table class="infobox infobox-bonuses">
<caption>Combat stats</caption>
<tr><th colspan="4">Attack bonuses</th></tr>
<tr><td><img src="/images/White_dagger.png" width="20" title="Stab"></td><td><img src="/images/White_scimitar.png" width="20" title="Slash"></td><td><img src="/images/White_warhammer.png" width="20" title="Crush"></td><td><img src="/images/Magic_icon.png" width="20" title="Magic"></td></tr>
<tr><td>+0</td><td>+82</td><td>+0</td><td>+0</td></tr>
<tr><th colspan="4">Other bonuses</th></tr>
<tr><td>Strength +82</td><td>Ranged +0</td><td>Magic dmg +0%</td><td>Prayer +0</td></tr>
<tr class="infobox-bonuses-image"><td colspan="4"><img src="/images/Equipment_model.png" width="100"></td></tr>
</table>
<div class="mw-heading2"><h2>Combat stats</h2></div>
<table class="wikitable"><tr><th>Slash</th><th>Strength</th></tr><tr><td>+82</td><td>+82</td></tr></table>
<div class="mw-heading2"><h2>Item sources</h2></div>
<table class="wikitable"><tr><th>Source</th><th>Level</th><th>Quantity</th><th>Rarity</th></tr>
<tr><td><a href="/w/Abyssal_demon">Abyssal demon</a></td><td>124</td><td>1</td><td>1/512</td></tr>
<tr><td><a href="/w/Greater_abyssal_demon">Greater abyssal demon</a></td><td>342</td><td>1</td><td>1/256</td></tr></table>
</div>`;

const VORKATH = `
<div class="mw-parser-output">
<table class="infobox infobox-monster">
<caption>Vorkath</caption>
${infoboxRow("Released", "4 January 2018 (Update)")}
${infoboxRow("Combat level", "732")}
${infoboxRow("Max hit", "32 (dragonfire 73+)")}
${infoboxRow("Attack style", "Melee, Magic, Ranged, Dragonfire")}
${infoboxRow("Slayer level", "None")}
</table>
${PARA('<b>Vorkath</b> is an undead blue dragon boss fought after <a href="/w/Dragon_Slayer_II">Dragon Slayer II</a>.')}
<div class="mw-heading2"><h2>Strategy</h2></div>
${PARA("Vorkath alternates between six standard attacks and two special attack phases.")}
<div class="mw-heading3"><h3>Acid phase</h3></div>
${PARA("Walk the acid pools while dodging rapid dragonfire. Woox-walking maximises damage.")}
<div class="mw-heading3"><h3>Spawn phase</h3></div>
${PARA("Kill the zombified spawn before it reaches you or take 60+ damage.")}
<div class="mw-heading2"><h2>Drops</h2></div>
<table class="wikitable"><tr><th>Item</th><th>Quantity</th><th>Rarity</th><th>Price</th></tr>
<tr><td><a href="/w/Superior_dragon_bones">Superior dragon bones</a></td><td>2</td><td>Always</td><td>18,234</td></tr>
<tr><td><a href="/w/Vorkath%27s_head">Vorkath's head</a></td><td>1</td><td>1/50</td><td>N/A</td></tr></table>
</div>`;

const TORVA_BODY = `
<div class="mw-parser-output">
<table class="infobox infobox-item">
<caption>Torva platebody</caption>
${infoboxRow("Released", "26 January 2022 (Update)")}
${infoboxRow("Members", "Yes")}
${infoboxRow("Equipable", "Yes")}
${infoboxRow("Strength bonus", "+6")}
</table>
${PARA('The <b>Torva platebody</b> is an ancient warrior’s chestplate obtained from <a href="/w/Nex">Nex</a>, requiring 80 Defence to equip. It is the best-in-slot strength-boosting body.')}
</div>`;

const PAGES = {
  "demonic quill": { title: "Demonic quill", html: DEMONIC_QUILL },
  "abyssal whip": { title: "Abyssal whip", html: ABYSSAL_WHIP },
  "torva platebody": { title: "Torva platebody", html: TORVA_BODY },
  vorkath: { title: "Vorkath", html: VORKATH },
  ...QA_PAGES,
};

// ---------- Bucket data (equipment + monsters) ----------
const eq = (name, slot, extra = {}) => ({
  page_name: name, equipment_slot: slot,
  stab_attack_bonus: "0", slash_attack_bonus: "0", crush_attack_bonus: "0",
  magic_attack_bonus: "0", range_attack_bonus: "0",
  stab_defence_bonus: "0", slash_defence_bonus: "0", crush_defence_bonus: "0",
  magic_defence_bonus: "0", range_defence_bonus: "0",
  strength_bonus: "0", ranged_strength_bonus: "0", magic_damage_bonus: "0",
  prayer_bonus: "0", combat_style: "", ...extra,
});
const EQUIPMENT = [
  eq("Abyssal whip", "weapon", { slash_attack_bonus: "82", strength_bonus: "82", combat_style: "Whip" }),
  eq("Abyssal tentacle", "weapon", { slash_attack_bonus: "90", strength_bonus: "86", combat_style: "Whip" }),
  eq("Bandos godsword", "2h", { slash_attack_bonus: "132", strength_bonus: "132", combat_style: "2h Sword" }),
  eq("Toxic blowpipe", "weapon", { range_attack_bonus: "30", ranged_strength_bonus: "20", combat_style: "Thrown" }),
  eq("Twisted bow", "2h", { range_attack_bonus: "70", ranged_strength_bonus: "20", combat_style: "Bow" }),
  eq("Torva full helm", "head", { stab_defence_bonus: "62", slash_defence_bonus: "65", crush_defence_bonus: "68", strength_bonus: "8", magic_defence_bonus: "-2", range_defence_bonus: "62" }),
  eq("Torva platebody", "body", { strength_bonus: "6", stab_defence_bonus: "117", slash_defence_bonus: "111", crush_defence_bonus: "117", range_defence_bonus: "142" }),
  eq("Torva platelegs", "legs", { strength_bonus: "4", stab_defence_bonus: "114", slash_defence_bonus: "106", crush_defence_bonus: "112", range_defence_bonus: "138" }),
  eq("Amulet of torture", "neck", { stab_attack_bonus: "15", slash_attack_bonus: "15", crush_attack_bonus: "15", strength_bonus: "10" }),
  eq("Dragon defender", "shield", { stab_attack_bonus: "25", slash_attack_bonus: "24", crush_attack_bonus: "23", strength_bonus: "6" }),
  eq("Ferocious gloves", "hands", { stab_attack_bonus: "16", slash_attack_bonus: "16", crush_attack_bonus: "16", strength_bonus: "14" }),
  eq("Primordial boots", "feet", { stab_attack_bonus: "2", slash_attack_bonus: "2", crush_attack_bonus: "2", strength_bonus: "5" }),
  eq("Infernal cape", "cape", { stab_attack_bonus: "4", slash_attack_bonus: "4", crush_attack_bonus: "4", strength_bonus: "8" }),
  eq("Berserker ring (i)", "ring", { strength_bonus: "8" }),
];
const mon = (name, sub, extra = {}) => ({
  page_name: name, page_name_sub: sub,
  combat_level: "100", hitpoints: "100", max_hit: "10", attack_speed: "4",
  attack_style: "Melee", attack_level: "100", strength_level: "100",
  defence_level: "100", magic_level: "100", ranged_level: "100",
  slayer_level: "0", slayer_experience: "0",
  stab_defence_bonus: "20", slash_defence_bonus: "20", crush_defence_bonus: "20",
  magic_defence_bonus: "0", range_defence_bonus: "30",
  attack_bonus: "50", strength_bonus: "20", magic_attack_bonus: "0",
  range_attack_bonus: "0", magic_damage_bonus: "0", ...extra,
});
const MONSTERS = [
  mon("Vorkath", "Post-quest", { combat_level: "732", hitpoints: "750", max_hit: "32", attack_speed: "5", attack_style: "Melee, Magic, Ranged", defence_level: "214", magic_level: "150", stab_defence_bonus: "26", slash_defence_bonus: "108", crush_defence_bonus: "108", magic_defence_bonus: "240", range_defence_bonus: "26", attack_bonus: "85" }),
  mon("Zulrah", "Serpentine", { combat_level: "725", hitpoints: "500", max_hit: "41", attack_speed: "4", attack_style: "Ranged, Magic", defence_level: "300", magic_level: "300" }),
  mon("Abyssal demon", null, { combat_level: "124", hitpoints: "150", max_hit: "8", attack_style: "Stab", defence_level: "135", magic_level: "1" }),
];

// ---------- Hiscores (Raxor) ----------
const SKILL_NAMES = ["Overall","Attack","Defence","Strength","Hitpoints","Ranged","Prayer","Magic","Cooking","Woodcutting","Fletching","Fishing","Firemaking","Crafting","Smithing","Mining","Herblore","Agility","Thieving","Slayer","Farming","Runecraft","Hunter","Construction","Sailing"];
const hiscores = {
  skills: SKILL_NAMES.map((name, i) => ({
    id: i, name,
    rank: 10000 + i,
    level: name === "Overall" ? 2154 : 85 + (i % 14),
    xp: name === "Overall" ? 250_000_000 : 3_500_000 + i * 100_000,
  })),
  activities: ["Vorkath", "Zulrah", "Chambers of Xeric", "Theatre of Blood", "Clue Scrolls (all)"].map((name, i) => ({
    id: i, name, rank: 5000 + i, score: [1043, 512, 87, 42, 230][i],
  })),
};

// ---------- Server ----------
function json(res, body) {
  res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(body));
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const p = url.pathname;

    if (p.startsWith("/api/wiki-prices/mapping")) return json(res, mapping);
    if (p.startsWith("/api/wiki-prices/latest")) return json(res, { data: latest });
    if (p.startsWith("/api/wiki-prices/volumes")) return json(res, { data: volumes });
    if (p.startsWith("/api/wiki-prices/timeseries")) {
      const now = Math.floor(Date.now() / 1000);
      return json(res, {
        data: Array.from({ length: 100 }, (_, i) => ({
          timestamp: now - (100 - i) * 3600,
          avgHighPrice: 1_600_000 + Math.round(Math.sin(i / 6) * 60_000),
          avgLowPrice: 1_560_000 + Math.round(Math.sin(i / 6) * 55_000),
          highPriceVolume: 200, lowPriceVolume: 180,
        })),
      });
    }

    // Ironman-variant lookups must miss or the app flags the player ironman.
    if (p.startsWith("/api/hiscores-")) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end("{}");
    }
    if (p.startsWith("/api/hiscores")) return json(res, hiscores);

    if (p.startsWith("/api/wiki-content")) {
      const action = url.searchParams.get("action");
      if (action === "bucket") {
        const q = url.searchParams.get("query") ?? "";
        if (q.includes("infobox_bonuses")) return json(res, { bucket: EQUIPMENT });
        if (q.includes("infobox_monster")) return json(res, { bucket: MONSTERS });
        if (q.includes('bucket("dropsline")')) {
          const dj = (rarity, qty, value) => JSON.stringify({ Rarity: rarity, Quantity: qty, "Drop Value": String(value) });
          return json(res, { bucket: [
            { page_name: "Vorkath", page_name_sub: "", item_name: "Superior dragon bones", drop_json: dj("Always", "2", "36468"), rare_drop_table: "false" },
            { page_name: "Vorkath", page_name_sub: "", item_name: "Blue dragonhide", drop_json: dj("Always", "2", "3500"), rare_drop_table: "false" },
            { page_name: "Vorkath", page_name_sub: "", item_name: "Dragon bolts", drop_json: dj("1/10", "20-50", "9800"), rare_drop_table: "false" },
            { page_name: "Vorkath", page_name_sub: "", item_name: "Dragonbone necklace", drop_json: dj("1/1,000", "1", "180000"), rare_drop_table: "false" },
            { page_name: "Vorkath", page_name_sub: "", item_name: "Vorki", drop_json: dj("1/3,000", "1", "0"), rare_drop_table: "false" },
            { page_name: "Vorkath", page_name_sub: "", item_name: "Draconic visage", drop_json: dj("1/5,000", "1", "4182220"), rare_drop_table: "false" },
          ]});
        }
        return json(res, { bucket: [] });
      }
      if (action === "opensearch") {
        const q = (url.searchParams.get("search") ?? "").toLowerCase();
        const titles = Object.values(PAGES).map((x) => x.title).filter((t) => t.toLowerCase().includes(q));
        return json(res, [q, titles, [], []]);
      }
      if (action === "query") {
        if (url.searchParams.get("list") === "search") {
          const q = (url.searchParams.get("srsearch") ?? "").toLowerCase();
          return json(res, {
            query: {
              search: Object.values(PAGES)
                .filter((x) => x.title.toLowerCase().includes(q))
                .map((x) => ({ title: x.title, snippet: `The <span class="searchmatch">${x.title}</span> is a thing in Gielinor.` })),
            },
          });
        }
        return json(res, { query: { pages: {} } });
      }
      if (action === "parse") {
        const page = (url.searchParams.get("page") ?? "").replace(/_/g, " ").toLowerCase();
        const hit = PAGES[page];
        if (!hit) return json(res, { error: { info: "missing page" } });
        const marks = [...hit.html.matchAll(/<div class="mw-heading([23])"><h[23]>(.*?)<\/h[23]>/g)]
          .map((m, i) => ({ number: String(i + 1), line: m[2], level: m[1], index: m.index }));
        if (url.searchParams.get("prop") === "sections") {
          return json(res, { parse: { sections: marks.map(({ number, line, level }) => ({ number, line, level, toclevel: level === "2" ? 1 : 2 })) } });
        }
        const sectionParam = url.searchParams.get("section");
        if (sectionParam !== null) {
          const n = Number(sectionParam);
          let slice;
          if (n === 0) {
            slice = marks.length ? hit.html.slice(0, marks[0].index) : hit.html;
          } else {
            const cur = marks[n - 1];
            if (!cur) return json(res, { parse: { title: hit.title, text: { "*": "" } } });
            const next = marks.slice(n).find((m) => m.level <= cur.level);
            slice = hit.html.slice(cur.index, next ? next.index : undefined);
          }
          if (!slice.includes("mw-parser-output")) slice = `<div class="mw-parser-output">${slice}</div>`;
          return json(res, { parse: { title: hit.title, text: { "*": slice } } });
        }
        return json(res, { parse: { title: hit.title, text: { "*": hit.html } } });
      }
      return json(res, {});
    }

    if (p.startsWith("/api/temple")) return json(res, { data: {} });
    if (p.startsWith("/api/wom")) return json(res, []);
    if (p.startsWith("/api/stars")) return json(res, []);
    if (p.startsWith("/api/news")) {
      res.writeHead(200, { "Content-Type": "application/xml" });
      return res.end('<?xml version="1.0"?><rss version="2.0"><channel><title>Old School RuneScape News</title></channel></rss>');
    }

    json(res, {});
  })
  .listen(PORT, () => console.log(`mock api on :${PORT}`));
