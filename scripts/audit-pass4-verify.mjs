/**
 * Pass-4: raid room depth, nested H4s, multi-boss + wiki visuals.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.RW_BASE || "http://localhost:5173";
const OUT = "audit-shots/wiki-boss-pass4";
fs.mkdirSync(OUT, { recursive: true });

const findings = [];
const f = (sev, area, msg, extra) => {
  findings.push({ sev, area, msg, extra });
  console.log(`[${sev}] ${area}: ${msg}`);
  if (extra) console.log("   ", JSON.stringify(extra).slice(0, 400));
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => {
  localStorage.setItem("runewise_onboarding_completed", "1");
  localStorage.setItem("runewise_rsn", "Raxor");
});

async function shot(name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
}

async function loadBoss(name) {
  await page.goto(`${BASE}/#bosses?boss=${encodeURIComponent(name)}`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(5000);
}

async function sectionTitles() {
  return page.evaluate(() =>
    [...document.querySelectorAll(".space-y-3 > section h4, .space-y-3 > section h5")]
      .map((h) => h.textContent.trim())
      .filter(Boolean)
  );
}

// ── Chambers of Xeric — expect rooms + Olm techniques ───────────────
await loadBoss("Chambers of Xeric");
await shot("p4-cox-top");
let heads = await sectionTitles();
const coxRooms = ["Tekton", "Vespula", "Vasa", "Olm", "Guardians", "Muttadile", "Ice demon", "Tightrope"];
const coxHits = coxRooms.filter((r) => heads.some((h) => h.includes(r)));
f(
  coxHits.length >= 4 ? "ok" : "P1",
  "cox",
  `sections=${heads.length}, rooms hit=${coxHits.length}`,
  { heads: heads.slice(0, 30), coxHits }
);

// Scroll to Great Olm if present
await page.evaluate(() => {
  const h = [...document.querySelectorAll("h4,h5")].find((x) =>
    /great olm|olm/i.test(x.textContent || "")
  );
  h?.closest("section")?.scrollIntoView({ block: "start" });
});
await page.waitForTimeout(500);
await shot("p4-cox-olm");

// ── Theatre of Blood — Maiden > Strategy + Skipping as own card? ────
await loadBoss("Theatre of Blood");
heads = await sectionTitles();
const tobOk =
  heads.some((h) => /maiden/i.test(h)) &&
  heads.some((h) => /strategy/i.test(h));
const skippingCards = heads.filter((h) => /skipping/i.test(h));
f(
  tobOk ? "ok" : "P1",
  "tob",
  `sections=${heads.length}, skippingCards=${skippingCards.length}`,
  { heads: heads.slice(0, 28), skippingCards }
);
await shot("p4-tob");

// ── Vorkath still healthy ───────────────────────────────────────────
await loadBoss("Vorkath");
const vork = await page.evaluate(() => {
  const skills = [...document.querySelectorAll("h4,h5")]
    .find((h) => /suggested skills/i.test(h.textContent || ""))
    ?.parentElement?.innerText?.slice(0, 300);
  const links = document.querySelectorAll(".article-content a[data-wiki-page]").length;
  const heads = [...document.querySelectorAll(".space-y-3 > section h4")]
    .map((h) => h.textContent.trim())
    .slice(0, 15);
  return { skills, links, heads };
});
f(
  /Ranged 85\+|boost|Piety/i.test(vork.skills || "") && vork.links > 20 ? "ok" : "P1",
  "vorkath",
  `links=${vork.links}`,
  vork
);
await shot("p4-vorkath-skills");

// ── Zulrah + Verzik (via ToB already) + Corp ────────────────────────
for (const boss of ["Zulrah", "Corporeal Beast", "Phantom Muspah"]) {
  await loadBoss(boss);
  heads = await sectionTitles();
  const dropLeak = heads.filter((h) =>
    /^(drops|100%|uniques|tertiary|references)$/i.test(h)
  );
  f(
    dropLeak.length === 0 && heads.length >= 4 ? "ok" : "P2",
    "boss",
    `${boss}: ${heads.length} sections, leaks=${dropLeak.length}`,
    { heads: heads.slice(0, 12), dropLeak }
  );
  await shot(`p4-${boss.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`);
}

// ── Wiki Abyssal whip + DS2 ─────────────────────────────────────────
await page.goto(`${BASE}/#wiki?page=Abyssal%20whip`, {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(2500);
await shot("p4-wiki-whip");
const wiki = await page.evaluate(() => ({
  toc: document.querySelectorAll('nav[aria-label="On this page"] button').length,
  tables: document.querySelectorAll(".wiki-table-scroll").length,
  links: document.querySelectorAll(".article-content a[data-wiki-page]").length,
  width: document.querySelector("main .mx-auto")?.getBoundingClientRect().width,
}));
f(wiki.toc >= 4 && wiki.links > 5 ? "ok" : "P2", "wiki", "whip metrics", wiki);

// Mobile CoX
await page.setViewportSize({ width: 390, height: 844 });
await loadBoss("Chambers of Xeric");
await shot("p4-cox-mobile");
const m = await page.evaluate(() => ({
  chips: !!document.querySelector("[data-guide-chips]"),
  back: /All bosses/i.test(document.body.innerText),
  chipCount: document.querySelectorAll("[data-guide-chips] button").length,
}));
f(m.chips && m.back ? "ok" : "P1", "mobile", "cox mobile chrome", m);

const md = [
  "# Wiki + Boss pass 4 audit",
  "",
  `**When:** ${new Date().toISOString()}`,
  "",
  "## Findings",
  ...findings.map((x) => `- **${x.sev}** [${x.area}] ${x.msg}`),
  "",
  "## Screenshots",
  ...fs
    .readdirSync(OUT)
    .filter((n) => n.endsWith(".png"))
    .map((n) => `- \`${n}\``),
  "",
].join("\n");
fs.writeFileSync(path.join(OUT, "PASS4.md"), md);
fs.writeFileSync(path.join(OUT, "pass4.json"), JSON.stringify(findings, null, 2));
console.log("\nWrote", path.join(OUT, "PASS4.md"));
await browser.close();
process.exit(findings.some((x) => x.sev === "P1") ? 1 : 0);
