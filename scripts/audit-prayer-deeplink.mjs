/**
 * Verify Loadout → DPS applies prayer + gear for RSN Raxor.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.AUDIT_BASE || "http://localhost:5173";
const OUT = path.resolve("audit-shots/prayer-deeplink");
fs.mkdirSync(OUT, { recursive: true });

const log = [];
const note = (step, ok, detail = "") => {
  log.push({ step, ok, detail });
  console.log(ok ? "✓" : "✗", step, detail ? `— ${String(detail).slice(0, 160)}` : "");
};

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
page.setDefaultTimeout(20000);

await page.addInitScript(() => {
  localStorage.setItem("runewise_onboarding_completed", "true");
  localStorage.setItem("runewise_rsn", "Raxor");
});

await page.goto(`${BASE}/#loadout-finder`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(6000);
await page.screenshot({ path: path.join(OUT, "01-loadout.png"), fullPage: true });

const t = await page.locator("main").innerText();
note("raxor levels 99", /Atk 99|Str 99|Ranged 99|Magic 99/i.test(t), t.match(/Using your levels[^.]+/)?.[0] ?? "");

// Prefer ranged filter so Rigour is likely
const ranged = page.getByRole("button", { name: "Ranged", exact: true });
if (await ranged.count()) {
  await ranged.click();
  await page.waitForTimeout(2500);
}

const open = page.getByRole("button", { name: /Open in DPS/i }).first();
note("open in dps exists", (await open.count()) > 0);
if (await open.count()) {
  await open.click();
  await page.waitForTimeout(4500);
  await page.screenshot({ path: path.join(OUT, "02-dps.png"), fullPage: true });
  const url = page.url();
  note("url has gear", url.includes("gear="), url.slice(0, 200));
  note("url has prayer", url.includes("prayer="), decodeURIComponent(url).match(/prayer=[^&]+/)?.[0] ?? "missing");

  const body = await page.locator("main").innerText();
  note("not empty gear", !/No gear equipped/i.test(body), body.slice(0, 120));
  // Rigour / Eagle Eye / Piety should appear if prayer applied
  note(
    "prayer applied (not None-only)",
    /Rigour|Eagle Eye|Hawk Eye|Piety|Chivalry|Augury|Mystic Might/i.test(body),
    body.match(/Rigour|Eagle Eye|Hawk Eye|Piety|Chivalry|Augury|Mystic Might|None|Sharp Eye|Burst of Strength/i)?.[0] ?? "no prayer label"
  );
}

fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(log, null, 2));
const fails = log.filter((l) => !l.ok);
console.log("Fails:", fails.length);
await browser.close();
process.exit(fails.length ? 1 : 0);
