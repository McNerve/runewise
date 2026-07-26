/**
 * Pass-5: ToA paths, dedupe, multi-raid visual check.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.RW_BASE || "http://localhost:5173";
const OUT = "audit-shots/wiki-boss-pass5";
fs.mkdirSync(OUT, { recursive: true });

const findings = [];
const f = (sev, area, msg, extra) => {
  findings.push({ sev, area, msg, extra });
  console.log(`[${sev}] ${area}: ${msg}`);
  if (extra) console.log("   ", JSON.stringify(extra).slice(0, 420));
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
  await page.waitForTimeout(5500);
}

async function cardTitles() {
  // Only direct section chrome titles — not nested body headings
  return page.evaluate(() =>
    [...document.querySelectorAll(".space-y-3 > section")]
      .map((s) => {
        const h = s.querySelector(":scope > h4, :scope > h5");
        return h?.textContent?.trim() ?? "";
      })
      .filter(Boolean)
  );
}

function hasDupes(titles) {
  const leaves = titles.map((t) => {
    const i = t.lastIndexOf(" > ");
    return (i >= 0 ? t.slice(i + 3) : t).toLowerCase();
  });
  const bare = titles
    .filter((t) => !t.includes(" > "))
    .map((t) => t.toLowerCase());
  const prefixedLeaves = new Set(
    titles.filter((t) => t.includes(" > ")).map((t) => {
      const i = t.lastIndexOf(" > ");
      return t.slice(i + 3).toLowerCase();
    })
  );
  const bareDupOfPrefixed = bare.filter((b) => prefixedLeaves.has(b));
  const exactDup = titles.filter((t, i) => titles.indexOf(t) !== i);
  return { bareDupOfPrefixed, exactDup, leaves };
}

// ── Tombs of Amascut ────────────────────────────────────────────────
await loadBoss("Tombs of Amascut");
await shot("p5-toa-top");
let titles = await cardTitles();
const toaNeed = ["Crondis", "Scabaras", "Het", "Apmeken", "Zebak", "Kephri", "Akkha", "Ba-Ba", "Warden"];
const toaHits = toaNeed.filter((n) => titles.some((t) => t.includes(n)));
const toaDup = hasDupes(titles);
f(
  toaHits.length >= 6 ? "ok" : "P1",
  "toa",
  `sections=${titles.length}, path hits=${toaHits.length}`,
  { titles: titles.slice(0, 35), toaHits, toaDup }
);

await page.evaluate(() => {
  const h = [...document.querySelectorAll("h4,h5")].find((x) =>
    /warden|zebak|akkha/i.test(x.textContent || "")
  );
  h?.closest("section")?.scrollIntoView({ block: "center" });
});
await page.waitForTimeout(400);
await shot("p5-toa-wardens");

// ── Phantom Muspah — Shield Skip once ───────────────────────────────
await loadBoss("Phantom Muspah");
titles = await cardTitles();
const shieldSkips = titles.filter((t) => /shield skip/i.test(t));
const muspahDup = hasDupes(titles);
f(
  shieldSkips.length <= 1 && muspahDup.bareDupOfPrefixed.length === 0
    ? "ok"
    : "P1",
  "muspah",
  `shieldSkip cards=${shieldSkips.length}, bareDupes=${muspahDup.bareDupOfPrefixed.length}`,
  { titles, shieldSkips }
);
await shot("p5-muspah");

// ── CoX still good ──────────────────────────────────────────────────
await loadBoss("Chambers of Xeric");
titles = await cardTitles();
const coxDup = hasDupes(titles);
const olmBits = titles.filter((t) => /olm|safespot|phases/i.test(t));
f(
  titles.some((t) => /tekton/i.test(t)) &&
    titles.some((t) => /great olm/i.test(t)) &&
    coxDup.bareDupOfPrefixed.length === 0
    ? "ok"
    : "P1",
  "cox",
  `sections=${titles.length}`,
  { olmBits, bareDupes: coxDup.bareDupOfPrefixed, titles: titles.slice(0, 30) }
);
await shot("p5-cox");

// ── Nightmare ───────────────────────────────────────────────────────
await loadBoss("Nightmare");
titles = await cardTitles();
f(
  titles.some((t) => /mechanics|special|phase/i.test(t)) ? "ok" : "P2",
  "nightmare",
  `sections=${titles.length}`,
  { titles }
);
await shot("p5-nightmare");

// ── ToB ─────────────────────────────────────────────────────────────
await loadBoss("Theatre of Blood");
titles = await cardTitles();
const tobDup = hasDupes(titles);
f(
  titles.some((t) => /maiden/i.test(t)) && tobDup.bareDupOfPrefixed.length === 0
    ? "ok"
    : "P2",
  "tob",
  `sections=${titles.length}, bareDupes=${tobDup.bareDupOfPrefixed.length}`,
  { titles: titles.slice(0, 25), bareDupes: tobDup.bareDupOfPrefixed }
);
await shot("p5-tob");

// ── Wiki ────────────────────────────────────────────────────────────
await page.goto(`${BASE}/#wiki?page=Abyssal%20whip`, {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(2500);
await shot("p5-wiki-whip");
const wiki = await page.evaluate(() => ({
  tables: document.querySelectorAll(".wiki-table-scroll").length,
  links: document.querySelectorAll("a[data-wiki-page]").length,
  toc: document.querySelectorAll('nav[aria-label="On this page"] button').length,
}));
f(wiki.tables >= 3 && wiki.links > 10 ? "ok" : "P2", "wiki", "whip", wiki);

// Mobile ToA
await page.setViewportSize({ width: 390, height: 844 });
await loadBoss("Tombs of Amascut");
await shot("p5-toa-mobile");
const mobile = await page.evaluate(() => ({
  chips: document.querySelectorAll("[data-guide-chips] button").length,
  back: /All bosses/i.test(document.body.innerText),
}));
f(mobile.chips >= 4 && mobile.back ? "ok" : "P1", "mobile", "toa chrome", mobile);

const md = [
  "# Wiki + Boss pass 5 audit",
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
fs.writeFileSync(path.join(OUT, "PASS5.md"), md);
console.log("\nWrote", path.join(OUT, "PASS5.md"));
await browser.close();
process.exit(findings.some((x) => x.sev === "P1") ? 1 : 0);
