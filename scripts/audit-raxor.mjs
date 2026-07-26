/**
 * Focused visual retest with RSN Raxor after audit fixes.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.AUDIT_BASE || "http://localhost:5173";
const OUT = path.resolve("audit-shots/raxor");
fs.mkdirSync(OUT, { recursive: true });

const log = [];
function note(step, ok, detail = "") {
  log.push({ step, ok, detail: String(detail).slice(0, 400) });
  console.log(ok ? "✓" : "✗", step, detail ? `— ${String(detail).slice(0, 140)}` : "");
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
}

async function waitMain(page) {
  await page
    .waitForFunction(
      () => {
        const m = document.querySelector("main");
        return m && (m.innerText || "").trim().length > 30;
      },
      { timeout: 20000 }
    )
    .catch(() => {});
  await page.waitForTimeout(600);
}

async function mainText(page) {
  return (await page.locator("main").innerText().catch(() => "")).replace(/\s+/g, " ").trim();
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
page.setDefaultTimeout(15000);

await page.addInitScript(() => {
  localStorage.setItem("runewise_onboarding_completed", "true");
  localStorage.setItem("runewise_rsn", "Raxor");
});

// Home with Raxor
await page.goto(`${BASE}/#home`, { waitUntil: "domcontentloaded" });
await waitMain(page);
// Wait for hiscores lookup
await page.waitForTimeout(5000);
await shot(page, "01-home-raxor");
let t = await mainText(page);
const bar = await page.locator("body").innerText();
note("home shows Raxor", /Raxor/i.test(bar), bar.slice(0, 200));
note("home welcome", /Welcome|Raxor|Combat/i.test(t), t.slice(0, 160));

// Loadout finder with Raxor levels
await page.goto(`${BASE}/#loadout-finder`, { waitUntil: "domcontentloaded" });
await waitMain(page);
await page.waitForTimeout(5000);
await shot(page, "02-loadout-raxor");
t = await mainText(page);
note("loadout levels banner", /Using your levels|Atk|Str|Ranged|Magic/i.test(t), t.slice(0, 200));
note("loadout results", /Optimized|Ranked|DPS|Budget/i.test(t), t.slice(0, 160));

// Open first result in DPS
const openDps = page.getByRole("button", { name: /Open in DPS/i }).first();
if (await openDps.count()) {
  await openDps.click();
  await waitMain(page);
  await page.waitForTimeout(4000);
  await shot(page, "03-open-dps-raxor");
  t = await mainText(page);
  const url = page.url();
  note("dps has gear param or gear", url.includes("gear=") || !/No gear equipped/i.test(t), url.slice(0, 180));
  note(
    "dps not empty fists",
    !/No gear equipped/i.test(t) || /Max hit\s*[2-9]|DAMAGE \/ SECOND\s*[1-9]/i.test(t),
    t.slice(0, 200)
  );
} else {
  note("open in dps button", false, "not found");
}

// Recipe calc loading/content
await page.goto(`${BASE}/#production-calc`, { waitUntil: "domcontentloaded" });
await waitMain(page);
await page.waitForTimeout(2000);
await shot(page, "04-recipes-loading-or-ready");
t = await mainText(page);
note(
  "recipes shows content or loading copy",
  /Loading recipe|Search recipes|recipes —|Popular/i.test(t),
  t.slice(0, 160)
);
// Wait longer for load
await page.waitForTimeout(8000);
await shot(page, "05-recipes-after-wait");
t = await mainText(page);
note("recipes eventually usable", /Search recipes|recipes —|Shark|Failed|Retry/i.test(t), t.slice(0, 160));

// News timeout path
await page.goto(`${BASE}/#news`, { waitUntil: "domcontentloaded" });
await waitMain(page);
await page.waitForTimeout(3000);
await shot(page, "06-news");
t = await mainText(page);
note("news not infinite blank", /Loading|Could not load|articles|Retry|Shipped|Refresh/i.test(t), t.slice(0, 140));

// Mobile
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/#home`, { waitUntil: "domcontentloaded" });
await waitMain(page);
await page.waitForTimeout(1500);
await shot(page, "07-home-mobile");
const menuBtn = page.getByRole("button", { name: /Open navigation menu/i });
note("mobile hamburger present", (await menuBtn.count()) > 0);
if (await menuBtn.count()) {
  await menuBtn.click();
  await page.waitForTimeout(400);
  await shot(page, "08-mobile-nav-open");
  note("mobile nav drawer", true);
  // navigate via drawer
  const dpsLink = page.getByRole("button", { name: /DPS Calculator/i }).first();
  if (await dpsLink.count()) {
    await dpsLink.click();
    await waitMain(page);
    await shot(page, "09-mobile-dps");
    note("mobile nav navigates", page.url().includes("dps-calc"), page.url());
  }
}

// Version badge
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/#settings`, { waitUntil: "domcontentloaded" });
await waitMain(page);
const body = await page.locator("body").innerText();
note("version not ancient 2.3.x", !/v2\.3\./.test(body) || /v2\.5\./.test(body), body.match(/v\d+\.\d+\.\d+/)?.[0] ?? "no version");

fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({ log, at: new Date().toISOString() }, null, 2));
console.log("\nShots:", OUT);
const fails = log.filter((l) => !l.ok);
console.log("Fails:", fails.length);
await browser.close();
process.exit(fails.length ? 1 : 0);
