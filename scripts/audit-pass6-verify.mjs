import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT = "audit-shots/wiki-boss-pass6";
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => {
  localStorage.setItem("runewise_onboarding_completed", "1");
  localStorage.setItem("runewise_rsn", "Raxor");
});

async function shot(n) {
  await page.screenshot({ path: path.join(OUT, `${n}.png`) });
}

// Directory search
await page.goto("http://localhost:5173/#bosses", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2500);
const search = page.locator('input[aria-label="Search bosses"]');
const hasSearch = (await search.count()) > 0;
console.log("[search]", hasSearch ? "ok" : "MISSING");
if (hasSearch) {
  await search.fill("vork");
  await page.waitForTimeout(300);
  const names = await page.evaluate(() =>
    [...document.querySelectorAll("aside button")]
      .map((b) => b.textContent?.trim())
      .filter((t) => t && /vork|zulrah|combat/i.test(t || ""))
  );
  console.log("[search results]", names.slice(0, 5));
  await shot("p6-dir-search");
  await search.fill("");
}

// CoX hierarchical TOC
await page.goto("http://localhost:5173/#bosses?boss=Chambers%20of%20Xeric", {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(5500);
const toc = await page.evaluate(() => {
  const aside = [...document.querySelectorAll("aside")].find((a) =>
    /Guide Sections/i.test(a.innerText || "")
  );
  const expanders = aside?.querySelectorAll("button[aria-label]")?.length ?? 0;
  const items = aside?.querySelectorAll("button")?.length ?? 0;
  return { expanders, items, text: aside?.innerText?.slice(0, 400) };
});
console.log("[toc]", JSON.stringify(toc).slice(0, 300));
await shot("p6-cox-toc");

// Expand Combat if collapsed
await page.evaluate(() => {
  const aside = [...document.querySelectorAll("aside")].find((a) =>
    /Guide Sections/i.test(a.innerText || "")
  );
  const combat = [...(aside?.querySelectorAll("button") ?? [])].find((b) =>
    /Combat/i.test(b.textContent || "")
  );
  combat?.click();
});
await page.waitForTimeout(400);
await shot("p6-cox-toc-expanded");

// Mobile chrome height
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://localhost:5173/#bosses?boss=Tombs%20of%20Amascut", {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(5000);
const y = await page.evaluate(() => {
  const first = document.querySelector(".space-y-3 > section");
  return Math.round(first?.getBoundingClientRect().top ?? 0);
});
console.log("[mobile firstSectionY]", y, y < 520 ? "ok" : "still heavy");
await shot("p6-toa-mobile-lean");

// Wiki related chips fewer
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto("http://localhost:5173/#wiki?page=Abyssal%20whip", {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(2500);
await shot("p6-wiki-whip");

await browser.close();
console.log("pass6 verify done");
