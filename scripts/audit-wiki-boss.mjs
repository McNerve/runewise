/**
 * Extensive visual + content audit of Wiki Lookup and Boss Guides.
 * Navigates like a user, captures shots, extracts structure/text for comparison.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.AUDIT_BASE || "http://localhost:5173";
const OUT = path.resolve("audit-shots/wiki-boss");
fs.mkdirSync(OUT, { recursive: true });

const findings = [];
function find(severity, area, title, detail) {
  findings.push({ severity, area, title, detail: String(detail).slice(0, 800) });
  const icon = severity === "P0" ? "🔴" : severity === "P1" ? "🟠" : severity === "P2" ? "🟡" : "ℹ️";
  console.log(icon, `[${area}]`, title, "—", String(detail).slice(0, 120));
}
function note(ok, area, title, detail = "") {
  find(ok ? "ok" : "P1", area, title, detail);
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return path.basename(file);
}

async function waitMain(page, ms = 800) {
  await page.waitForTimeout(ms);
  await page
    .waitForFunction(
      () => {
        const m = document.querySelector("main");
        return m && (m.innerText || "").trim().length > 20;
      },
      { timeout: 20000 }
    )
    .catch(() => {});
}

async function mainText(page) {
  return (await page.locator("main").innerText().catch(() => "")).replace(/\s+/g, " ").trim();
}

async function extractStructure(page) {
  return page.evaluate(() => {
    const main = document.querySelector("main");
    if (!main) return null;
    const headings = [...main.querySelectorAll("h1,h2,h3,h4")].map((h) => ({
      tag: h.tagName,
      text: (h.textContent || "").trim().slice(0, 120),
    }));
    const tables = main.querySelectorAll("table").length;
    const images = main.querySelectorAll("img").length;
    const brokenImgs = [...main.querySelectorAll("img")].filter((i) => !i.complete || i.naturalWidth === 0).length;
    const links = [...main.querySelectorAll("a")].slice(0, 40).map((a) => ({
      text: (a.textContent || "").trim().slice(0, 60),
      href: a.getAttribute("href") || "",
    }));
    const buttons = [...main.querySelectorAll("button")].slice(0, 30).map((b) =>
      (b.textContent || b.getAttribute("aria-label") || "").trim().slice(0, 50)
    );
    const textLen = (main.innerText || "").trim().length;
    const overflow = [...main.querySelectorAll("*")].filter((el) => {
      const s = getComputedStyle(el);
      return el.scrollWidth > el.clientWidth + 4 && s.overflowX !== "hidden";
    }).length;
    return { headings, tables, images, brokenImgs, links, buttons, textLen, overflow };
  });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
page.setDefaultTimeout(20000);

const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push({ text: msg.text().slice(0, 200), url: page.url() });
});

await page.addInitScript(() => {
  localStorage.setItem("runewise_onboarding_completed", "true");
  localStorage.setItem("runewise_rsn", "Raxor");
});

// ═══════════════════════════════════════════════════════════
// WIKI LOOKUP
// ═══════════════════════════════════════════════════════════
console.log("\n=== WIKI LOOKUP ===\n");

await page.goto(`${BASE}/#wiki`, { waitUntil: "domcontentloaded" });
await waitMain(page, 1500);
await shot(page, "wiki-01-empty");
let t = await mainText(page);
let s = await extractStructure(page);
note(/OSRS Wiki|Search/i.test(t), "wiki", "empty state loads", t.slice(0, 150));
find("info", "wiki", "empty structure", JSON.stringify(s?.headings));

// Search Abyssal whip
const searchInput = page.locator("main input").first();
await searchInput.click();
await searchInput.fill("Abyssal whip");
await page.waitForTimeout(800);
await shot(page, "wiki-02-search-dropdown");
const dropdown = page.locator("[role='listbox'], .absolute, [class*='dropdown']").first();
const hasDropdown = (await page.locator("main").getByText(/Abyssal whip/i).count()) > 1 ||
  (await page.getByRole("option").count()) > 0 ||
  (await page.locator("main button, main a, main li").filter({ hasText: /Abyssal whip/i }).count()) > 0;
note(hasDropdown, "wiki", "search dropdown shows results", await mainText(page).then(x => x.slice(0, 200)));

// Click result or press Enter / navigate directly
await page.goto(`${BASE}/#wiki?page=Abyssal%20whip&query=Abyssal%20whip`, { waitUntil: "domcontentloaded" });
await waitMain(page, 4000);
await shot(page, "wiki-03-abyssal-whip");
t = await mainText(page);
s = await extractStructure(page);
find("info", "wiki", "whip headings", s?.headings?.map((h) => h.text).join(" | "));
find("info", "wiki", "whip stats", `textLen=${s?.textLen} tables=${s?.tables} imgs=${s?.images} broken=${s?.brokenImgs} overflow=${s?.overflow}`);
note(/Abyssal whip|slash|attack|members/i.test(t), "wiki", "whip page has item content", t.slice(0, 250));
// Check for clunky raw wiki artifacts
if (/\[edit\]|mw-parser|Module:|__NOTOC__|Template:/i.test(t)) {
  find("P1", "wiki", "raw wiki artifacts in text", t.match(/\[edit\]|mw-parser|Module:|Template:[^\s]+/gi)?.join(", "));
}
if (s?.brokenImgs > 0) find("P1", "wiki", "broken images on whip", `${s.brokenImgs} broken`);
if (s?.overflow > 5) find("P2", "wiki", "horizontal overflow elements", String(s.overflow));

// Scroll through sections if TOC exists
const tocLinks = page.locator("main nav a, main [class*='toc'] button, main [class*='Toc'] button, main aside a");
const tocCount = await tocLinks.count();
find("info", "wiki", "TOC link count", String(tocCount));
if (tocCount > 0) {
  await tocLinks.nth(Math.min(2, tocCount - 1)).click().catch(() => {});
  await page.waitForTimeout(600);
  await shot(page, "wiki-04-toc-nav");
}

// Combat achievements page (often messy tables)
await page.goto(`${BASE}/#wiki?page=Combat%20Achievements`, { waitUntil: "domcontentloaded" });
await waitMain(page, 4000);
await shot(page, "wiki-05-combat-achievements");
t = await mainText(page);
s = await extractStructure(page);
find("info", "wiki", "CA structure", `textLen=${s?.textLen} tables=${s?.tables} headings=${s?.headings?.length}`);
if (s?.tables === 0 && s?.textLen > 500) find("P2", "wiki", "CA has text but no tables (may be stripped)", "");

// Quest page
await page.goto(`${BASE}/#wiki?page=Dragon%20Slayer%20II`, { waitUntil: "domcontentloaded" });
await waitMain(page, 4000);
await shot(page, "wiki-06-ds2");
t = await mainText(page);
s = await extractStructure(page);
note(/Dragon Slayer|requirement|quest/i.test(t), "wiki", "DS2 loads", t.slice(0, 200));
find("info", "wiki", "DS2 structure", `textLen=${s?.textLen} tables=${s?.tables} headings=${s?.headings?.slice(0, 12).map(h=>h.text).join(" | ")}`);

// Location / multi-section
await page.goto(`${BASE}/#wiki?page=Prifddinas`, { waitUntil: "domcontentloaded" });
await waitMain(page, 3500);
await shot(page, "wiki-07-prif");
t = await mainText(page);
note(/Prifddinas|elf|crystal/i.test(t), "wiki", "Prifddinas loads", t.slice(0, 150));

// Internal link click
await page.goto(`${BASE}/#wiki?page=Abyssal%20demon`, { waitUntil: "domcontentloaded" });
await waitMain(page, 3500);
await shot(page, "wiki-08-abyssal-demon");
const internalLink = page.locator("main .article-content a, main a[href*='wiki'], main a[data-wiki-page]").first();
if (await internalLink.count()) {
  const href = await internalLink.getAttribute("href");
  const linkText = await internalLink.textContent();
  await internalLink.click().catch(() => {});
  await waitMain(page, 2500);
  await shot(page, "wiki-09-internal-link");
  note(true, "wiki", "internal link click", `${linkText} → ${page.url()} href=${href}`);
}

// Mobile wiki
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/#wiki?page=Abyssal%20whip`, { waitUntil: "domcontentloaded" });
await waitMain(page, 3000);
await shot(page, "wiki-10-mobile-whip");
t = await mainText(page);
s = await extractStructure(page);
if (s?.overflow > 8) find("P1", "wiki", "mobile overflow on item page", String(s.overflow));
await page.setViewportSize({ width: 1440, height: 900 });

// ═══════════════════════════════════════════════════════════
// BOSS GUIDES
// ═══════════════════════════════════════════════════════════
console.log("\n=== BOSS GUIDES ===\n");

await page.goto(`${BASE}/#bosses`, { waitUntil: "domcontentloaded" });
await waitMain(page, 2000);
await shot(page, "boss-01-list");
t = await mainText(page);
s = await extractStructure(page);
note(/Boss Guides|Vorkath|Zulrah/i.test(t), "boss", "list loads", t.slice(0, 180));
find("info", "boss", "list structure", `textLen=${s?.textLen} buttons=${s?.buttons?.slice(0, 15).join(",")}`);

// Category filters
const catBtns = ["GWD", "Wilderness", "Slayer", "Raids", "World Bosses", "All"];
for (const cat of catBtns) {
  const btn = page.getByRole("button", { name: new RegExp(`^${cat}$`, "i") }).first();
  if (await btn.count()) {
    await btn.click();
    await page.waitForTimeout(400);
  }
}
await shot(page, "boss-02-category-filter");
await page.getByRole("button", { name: /^All$/i }).first().click().catch(() => {});
await page.waitForTimeout(300);

// ── Vorkath deep dive ──
const vork = page.locator("main").getByText(/^Vorkath$/i).first();
if (await vork.count()) {
  await vork.click();
} else {
  await page.goto(`${BASE}/#bosses?boss=Vorkath`, { waitUntil: "domcontentloaded" });
}
await waitMain(page, 4500);
await shot(page, "boss-03-vorkath-guide");
t = await mainText(page);
s = await extractStructure(page);
note(/Vorkath/i.test(t), "boss", "Vorkath selected", t.slice(0, 200));
find("info", "boss", "Vorkath headings", s?.headings?.map((h) => h.text).join(" | "));
find("info", "boss", "Vorkath metrics", `textLen=${s?.textLen} tables=${s?.tables} imgs=${s?.images} broken=${s?.brokenImgs}`);

// Tabs
const tabs = ["Guide", "Loot", "Tasks", "Overview", "Drops", "Strategy", "Gear", "Inventory"];
for (const tab of tabs) {
  const tabBtn = page.getByRole("button", { name: new RegExp(`^${tab}$`, "i") }).or(
    page.locator("main button, main [role='tab']").filter({ hasText: new RegExp(`^${tab}$`, "i") })
  ).first();
  if (await tabBtn.count()) {
    await tabBtn.click().catch(() => {});
    await page.waitForTimeout(800);
    await shot(page, `boss-04-vorkath-tab-${tab.toLowerCase()}`);
    const tt = await mainText(page);
    find("info", "boss", `Vorkath tab ${tab}`, tt.slice(0, 180));
    if (tt.length < 80) find("P1", "boss", `Vorkath tab ${tab} sparse`, tt);
  }
}

// Check guide section collapse / expand
const expanders = page.locator("main button").filter({ hasText: /Show more|Expand|section|Strategy|Fighting/i });
const expCount = await expanders.count();
find("info", "boss", "expandable controls", String(expCount));
if (expCount > 0) {
  await expanders.first().click().catch(() => {});
  await page.waitForTimeout(500);
  await shot(page, "boss-05-vorkath-expand");
}

// Meta pack / DPS link
const metaOrDps = page.getByRole("button", { name: /meta|DHCB|DHL|Open in DPS|DPS|preset/i }).first();
if (await metaOrDps.count()) {
  const label = await metaOrDps.textContent();
  find("info", "boss", "meta/dps CTA present", label?.trim() ?? "");
}

// ── Zulrah ──
await page.goto(`${BASE}/#bosses?boss=Zulrah`, { waitUntil: "domcontentloaded" });
await waitMain(page, 4500);
await shot(page, "boss-06-zulrah");
t = await mainText(page);
s = await extractStructure(page);
note(/Zulrah/i.test(t), "boss", "Zulrah loads", `textLen=${s?.textLen} headings=${s?.headings?.length}`);
if (/\[edit\]|mw-parser|Module:/i.test(t)) find("P1", "boss", "Zulrah raw wiki artifacts", "");

// ── Tob Verzik ──
await page.goto(`${BASE}/#bosses?boss=Verzik%20Vitur`, { waitUntil: "domcontentloaded" });
await waitMain(page, 4000);
await shot(page, "boss-07-verzik");
t = await mainText(page);
note(/Verzik|Theatre|ToB/i.test(t) || t.length > 100, "boss", "Verzik loads", t.slice(0, 150));

// ── Corp ──
await page.goto(`${BASE}/#bosses?boss=Corporeal%20Beast`, { waitUntil: "domcontentloaded" });
await waitMain(page, 4000);
await shot(page, "boss-08-corp");
t = await mainText(page);
s = await extractStructure(page);
find("info", "boss", "Corp content", `textLen=${s?.textLen} tables=${s?.tables}`);

// ── Olm / CoX ──
await page.goto(`${BASE}/#bosses?boss=Great%20Olm`, { waitUntil: "domcontentloaded" });
await waitMain(page, 4000);
await shot(page, "boss-09-olm");
t = await mainText(page);
note(/Olm|Chambers|CoX/i.test(t) || t.length > 80, "boss", "Olm loads", t.slice(0, 150));

// Loot tab deep for Vorkath
await page.goto(`${BASE}/#bosses?boss=Vorkath`, { waitUntil: "domcontentloaded" });
await waitMain(page, 3500);
const lootTab = page.getByRole("button", { name: /^Loot$/i }).or(page.locator("main button").filter({ hasText: /^Loot$/i })).first();
if (await lootTab.count()) {
  await lootTab.click();
  await page.waitForTimeout(2000);
  await shot(page, "boss-10-vorkath-loot");
  t = await mainText(page);
  note(/drop|gp|kill|unique|Vorkath|rarity|quantity/i.test(t), "boss", "Vorkath loot has drop data", t.slice(0, 220));
  if (!/\d/.test(t)) find("P1", "boss", "Vorkath loot lacks numbers", t.slice(0, 150));
}

// Mobile boss
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/#bosses?boss=Vorkath`, { waitUntil: "domcontentloaded" });
await waitMain(page, 3500);
await shot(page, "boss-11-vorkath-mobile");
s = await extractStructure(page);
if (s?.overflow > 10) find("P1", "boss", "mobile overflow Vorkath", String(s.overflow));
await page.setViewportSize({ width: 1440, height: 900 });

// ── Compare list UX: boss picker density ──
await page.goto(`${BASE}/#bosses`, { waitUntil: "domcontentloaded" });
await waitMain(page, 1500);
const bossCards = await page.locator("main button, main [role='button'], main li, main a").count();
find("info", "boss", "list interactive nodes", String(bossCards));

// Console errors unique
const uniqueErr = [...new Map(consoleErrors.map((e) => [e.text, e])).values()];
for (const e of uniqueErr.slice(0, 15)) {
  find("P2", "console", "console error", `${e.url}: ${e.text}`);
}

// Write report
const report = {
  at: new Date().toISOString(),
  base: BASE,
  findings,
  counts: {
    P0: findings.filter((f) => f.severity === "P0").length,
    P1: findings.filter((f) => f.severity === "P1").length,
    P2: findings.filter((f) => f.severity === "P2").length,
    ok: findings.filter((f) => f.severity === "ok").length,
    info: findings.filter((f) => f.severity === "info").length,
  },
  consoleErrors: uniqueErr,
};
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));

const md = [
  "# Wiki + Boss Guides visual audit",
  "",
  `**When:** ${report.at}`,
  `**Counts:** P0=${report.counts.P0} P1=${report.counts.P1} P2=${report.counts.P2} ok=${report.counts.ok}`,
  "",
  "## Findings",
  "",
  ...findings.map((f) => `- **${f.severity}** [${f.area}] ${f.title}: ${f.detail}`),
  "",
  "## Screenshots",
  "",
  ...fs.readdirSync(OUT).filter((f) => f.endsWith(".png")).map((f) => `- \`${f}\``),
].join("\n");
fs.writeFileSync(path.join(OUT, "AUDIT.md"), md);

console.log("\n=== SUMMARY ===");
console.log(report.counts);
console.log("Report:", path.join(OUT, "AUDIT.md"));

await browser.close();
process.exit(report.counts.P0 + report.counts.P1 > 0 ? 1 : 0);
