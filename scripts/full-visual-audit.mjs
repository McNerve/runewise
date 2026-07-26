/**
 * Full visual + interactive audit of every RuneWise view.
 * Captures screenshots, console errors, empty/broken states, and key UX flows.
 *
 * Usage: AUDIT_BASE=http://localhost:5173 node scripts/full-visual-audit.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.AUDIT_BASE || "http://localhost:5173";
const OUT = path.resolve("audit-shots/full-visual");
const REPORT = path.join(OUT, "report.json");
fs.mkdirSync(OUT, { recursive: true });

const VIEWS = [
  "home",
  "overview",
  "lookup",
  "collection-log",
  "tracker",
  "skill-calc",
  "dps-calc",
  "loadout-finder",
  "dry-calc",
  "training-plan",
  "gear-compare",
  "pet-calc",
  "bosses",
  "raids",
  "loot",
  "combat-tasks",
  "market",
  "flip-journal",
  "progress",
  "slayer",
  "clue-helper",
  "money-making",
  "production-calc",
  "shop-helper",
  "kingdom",
  "spells",
  "world-map",
  "stars",
  "news",
  "wiki",
  "timers",
  "xp-table",
  "settings",
  "about",
];

const log = [];
function note(step, ok, detail = "", severity = ok ? "info" : "fail") {
  const row = { step, ok, detail: String(detail).slice(0, 600), severity };
  log.push(row);
  const icon = ok ? "✓" : severity === "warn" ? "⚠" : "✗";
  console.log(icon, step, detail ? `— ${String(detail).slice(0, 140)}` : "");
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return path.basename(file);
}

async function waitMain(page, min = 40) {
  await page
    .waitForFunction(
      (n) => {
        const m = document.querySelector("main");
        return m && (m.innerText || "").trim().length > n;
      },
      min,
      { timeout: 18000 }
    )
    .catch(() => {});
  await page.waitForTimeout(400);
}

async function mainText(page) {
  return (await page.locator("main").innerText().catch(() => "")).replace(/\s+/g, " ").trim();
}

async function go(page, view) {
  await page.goto(`${BASE}/#${view}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitMain(page);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
page.setDefaultTimeout(12000);

const consoleErrors = [];
const pageErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") {
    consoleErrors.push({ text: msg.text().slice(0, 300), url: page.url(), t: Date.now() });
  }
});
page.on("pageerror", (err) => {
  pageErrors.push({ text: String(err.message).slice(0, 300), url: page.url(), t: Date.now() });
});

await page.addInitScript(() => {
  localStorage.setItem("runewise_onboarding_completed", "true");
  localStorage.setItem("runewise_rsn", "Zezima");
});

// ── Warm ─────────────────────────────────────────────────────
await go(page, "home");
await page.waitForTimeout(3500);

// ── Pass 1: every view smoke ─────────────────────────────────
console.log("\n=== Pass 1: all views ===\n");
const viewResults = [];
for (const view of VIEWS) {
  const beforeErr = pageErrors.length;
  try {
    await go(page, view);
    await page.waitForTimeout(700);
    // Extra wait for data-heavy views
    if (["loadout-finder", "market", "loot", "bosses", "wiki", "stars"].includes(view)) {
      await page.waitForTimeout(2500);
    }
    const file = await shot(page, `view-${view.replace(/[^a-z0-9-]/gi, "_")}`);
    const text = await mainText(page);
    const skeleton = (await page.locator(".animate-pulse").count()) > 3;
    const emptyish = text.length < 50;
    const hasError =
      /could not load|something went wrong|failed to|error loading|try again later/i.test(text) &&
      !/no error/i.test(text);
    const threw = pageErrors.length > beforeErr;

    const ok = !emptyish && !threw && !hasError;
    note(
      `view:${view}`,
      ok,
      emptyish
        ? "empty/sparse"
        : hasError
          ? `error UI: ${text.slice(0, 100)}`
          : threw
            ? "pageerror"
            : `ok (${text.length} chars) ${file}`,
      emptyish || hasError ? "fail" : skeleton ? "warn" : "info"
    );
    if (skeleton && ok) note(`view:${view}:skeleton`, false, "still has pulse skeletons", "warn");

    viewResults.push({
      view,
      ok,
      textLen: text.length,
      skeleton,
      hasError,
      threw,
      snippet: text.slice(0, 200),
      file,
    });
  } catch (e) {
    note(`view:${view}`, false, e.message);
    viewResults.push({ view, ok: false, error: e.message });
  }
}

// ── Pass 2: interactive deep dives ───────────────────────────
console.log("\n=== Pass 2: interactive flows ===\n");

// Home hubs
await go(page, "home");
await page.waitForTimeout(1500);
await shot(page, "flow-01-home");
let t = await mainText(page);
note("home:welcome", /Welcome|Zezima|What next/i.test(t), t.slice(0, 120));
note("home:combat hub", /Budget Setup|DPS|Boss/i.test(t));
note("home:market hub", /Money|Flip|Items/i.test(t));

// Click Budget Setup
const budgetHub = page.locator("main").getByText("Budget Setup").first();
if (await budgetHub.count()) {
  await budgetHub.click();
  await waitMain(page);
  await page.waitForTimeout(3000);
  await shot(page, "flow-02-budget-setup");
  note("home→loadout-finder", page.url().includes("loadout-finder"), page.url());
}

// Loadout finder deep
await go(page, "loadout-finder");
await page.waitForTimeout(4500);
await shot(page, "flow-03-loadout-default");
t = await mainText(page);
note("loadout:ranked", /Ranked|Optimized|DPS|Budget/i.test(t), t.slice(0, 160));
note("loadout:combinatorial toggle", /Combinatorial BiS|Beam BiS|under budget/i.test(t));
note("loadout:owned chips", /I already own|Fire cape|Fighter torso/i.test(t));
note("loadout:on-task", /On-task|slayer helm/i.test(t));
note("loadout:bank paste", /bank|inventory dump|Paste/i.test(t));
note("loadout:wiki search", /Search wiki|Search monsters|wiki NPC/i.test(t));

// Budget 1M
const b1m = page.getByRole("button", { name: "1M", exact: true });
if (await b1m.count()) {
  await b1m.click();
  await page.waitForTimeout(1200);
  await shot(page, "flow-04-loadout-1m");
  note("loadout:budget 1M", true, (await mainText(page)).slice(0, 100));
}

// Style melee only
const melee = page.getByRole("button", { name: "Melee", exact: true });
if (await melee.count()) {
  await melee.click();
  await page.waitForTimeout(1000);
  await shot(page, "flow-05-loadout-melee");
  note("loadout:melee filter", true);
}

// Open in DPS
const openDps = page.getByRole("button", { name: /Open in DPS/i }).first();
if (await openDps.count()) {
  await openDps.click();
  await waitMain(page);
  await page.waitForTimeout(2500);
  await shot(page, "flow-06-open-dps");
  note("loadout→dps", page.url().includes("dps-calc"), page.url());
}

// DPS calc
await go(page, "dps-calc");
await page.waitForTimeout(2000);
await shot(page, "flow-07-dps");
t = await mainText(page);
note("dps:panel", /DPS|Max hit|Accuracy|Equipment|Monster/i.test(t), t.slice(0, 120));

// Bosses + meta pack
await go(page, "bosses");
await page.waitForTimeout(2500);
await shot(page, "flow-08-bosses");
t = await mainText(page);
note("bosses:list", /Vorkath|Zulrah|Boss|Guide/i.test(t), t.slice(0, 120));
const bossCard = page.locator("main").getByText(/Vorkath/i).first();
if (await bossCard.count()) {
  await bossCard.click();
  await waitMain(page);
  await page.waitForTimeout(2000);
  await shot(page, "flow-09-boss-detail");
  t = await mainText(page);
  note("boss:detail", /Strategy|Drops|Weakness|Overview|Vorkath/i.test(t), t.slice(0, 140));
  // Meta pack button if any
  const meta = page.getByRole("button", { name: /meta|DHCB|DHL|BiS|preset/i }).first();
  if (await meta.count()) {
    await meta.click();
    await page.waitForTimeout(800);
    await shot(page, "flow-10-boss-meta");
    note("boss:meta pack click", true, page.url());
  } else {
    note("boss:meta pack", false, "no meta button visible", "warn");
  }
}

// Market + flip finder
await go(page, "market");
await page.waitForTimeout(3000);
await shot(page, "flow-11-market");
t = await mainText(page);
note("market:loads", /Flip|Watchlist|Item|GE|Popular/i.test(t), t.slice(0, 140));
const flipTab = page.getByRole("button", { name: /Flip/i }).first();
if (await flipTab.count()) {
  await flipTab.click();
  await page.waitForTimeout(2000);
  await shot(page, "flow-12-flip-finder");
  t = await mainText(page);
  note("market:flip finder", /ROI|margin|buy|sell|Flip/i.test(t), t.slice(0, 140));
}

// Progress / What can I do
await go(page, "progress");
await page.waitForTimeout(2000);
await shot(page, "flow-13-progress");
t = await mainText(page);
note("progress:loads", /Quest|Diary|What can|Progress|Milestone/i.test(t), t.slice(0, 140));

// Slayer
await go(page, "slayer");
await page.waitForTimeout(1500);
await shot(page, "flow-14-slayer");
t = await mainText(page);
note("slayer:loads", /Slayer|Master|Task|Block/i.test(t), t.slice(0, 120));

// Wiki
await go(page, "wiki");
await page.waitForTimeout(1500);
const wikiInput = page.locator('main input[type="search"], main input[placeholder*="Search"], main input').first();
if (await wikiInput.count()) {
  await wikiInput.fill("Abyssal whip");
  await wikiInput.press("Enter");
  await page.waitForTimeout(3000);
  await shot(page, "flow-15-wiki-whip");
  t = await mainText(page);
  note("wiki:search", /whip|Attack|Equipment|Abyssal/i.test(t), t.slice(0, 140));
} else {
  note("wiki:search input", false, "no input found", "warn");
  await shot(page, "flow-15-wiki");
}

// Stars
await go(page, "stars");
await page.waitForTimeout(2500);
await shot(page, "flow-16-stars");
t = await mainText(page);
note("stars:loads", /Star|World|Tier|Mining/i.test(t), t.slice(0, 120));

// Timers
await go(page, "timers");
await page.waitForTimeout(1500);
await shot(page, "flow-17-timers");
t = await mainText(page);
note("timers:loads", /Farm|Tree|Herb|Birdhouse|Timer/i.test(t), t.slice(0, 120));

// Money making
await go(page, "money-making");
await page.waitForTimeout(2000);
await shot(page, "flow-18-money");
t = await mainText(page);
note("money:loads", /gp|hour|Method|Money|Members/i.test(t), t.slice(0, 120));

// Collection log
await go(page, "collection-log");
await page.waitForTimeout(2000);
await shot(page, "flow-19-clog");
t = await mainText(page);
note("clog:loads", /Collection|Export|Import|Boss|Clue|Manual/i.test(t), t.slice(0, 120));

// Settings
await go(page, "settings");
await page.waitForTimeout(800);
await shot(page, "flow-20-settings");
t = await mainText(page);
note("settings:loads", /Theme|Settings|Close|Tray|RSN/i.test(t), t.slice(0, 120));

// Search dialog (Ctrl+K / button)
await go(page, "home");
await page.waitForTimeout(500);
await page.keyboard.press("Control+k");
await page.waitForTimeout(600);
const searchOpen = (await page.locator('[role="dialog"], [data-state="open"]').count()) > 0
  || (await page.getByPlaceholder(/search/i).count()) > 0;
await shot(page, "flow-21-search-dialog");
note("search:dialog", searchOpen, searchOpen ? "opened" : "may use different trigger", searchOpen ? "info" : "warn");
if (searchOpen) {
  const si = page.locator('input').first();
  await si.fill("loadout");
  await page.waitForTimeout(500);
  await shot(page, "flow-22-search-loadout");
  await page.keyboard.press("Escape");
}

// Light theme smoke
await go(page, "settings");
const light = page.getByRole("button", { name: /Light/i }).or(page.getByText(/^Light$/i)).first();
if (await light.count()) {
  await light.click();
  await page.waitForTimeout(400);
  await go(page, "home");
  await shot(page, "flow-23-home-light");
  note("theme:light", true);
  // restore dark if available
  await go(page, "settings");
  const dark = page.getByRole("button", { name: /Dark/i }).or(page.getByText(/^Dark$/i)).first();
  if (await dark.count()) await dark.click();
} else {
  note("theme:light toggle", false, "not found", "warn");
}

// Mobile viewport sample
await page.setViewportSize({ width: 390, height: 844 });
await go(page, "home");
await page.waitForTimeout(1000);
await shot(page, "flow-24-home-mobile");
await go(page, "loadout-finder");
await page.waitForTimeout(3000);
await shot(page, "flow-25-loadout-mobile");
await go(page, "dps-calc");
await page.waitForTimeout(1500);
await shot(page, "flow-26-dps-mobile");
note("mobile:viewports", true, "home + loadout + dps captured");

// ── Summary ──────────────────────────────────────────────────
const fails = log.filter((r) => !r.ok && r.severity === "fail");
const warns = log.filter((r) => !r.ok && r.severity === "warn");
const uniqueConsole = [...new Map(consoleErrors.map((e) => [e.text, e])).values()];
const uniquePage = [...new Map(pageErrors.map((e) => [e.text, e])).values()];

const summary = {
  base: BASE,
  at: new Date().toISOString(),
  views: viewResults,
  checks: log,
  consoleErrors: uniqueConsole.slice(0, 40),
  pageErrors: uniquePage.slice(0, 20),
  counts: {
    viewsOk: viewResults.filter((v) => v.ok).length,
    viewsTotal: viewResults.length,
    checksOk: log.filter((r) => r.ok).length,
    checksTotal: log.length,
    fails: fails.length,
    warns: warns.length,
    consoleErrors: uniqueConsole.length,
    pageErrors: uniquePage.length,
  },
};

fs.writeFileSync(REPORT, JSON.stringify(summary, null, 2));
console.log("\n=== SUMMARY ===");
console.log(JSON.stringify(summary.counts, null, 2));
console.log("Report:", REPORT);
console.log("Shots:", OUT);

await browser.close();
process.exit(fails.length > 0 ? 1 : 0);
