import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT = "audit-shots/wiki-boss-pass1";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => {
  localStorage.setItem("runewise_onboarding_completed", "1");
  localStorage.setItem("runewise_rsn", "Raxor");
});

await page.goto("http://localhost:5173/#bosses?boss=Vorkath", {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(4500);
await page.evaluate(() => {
  const el = [...document.querySelectorAll("h4,h5")].find((h) =>
    /fight overview/i.test(h.textContent || "")
  );
  el?.scrollIntoView({ block: "center" });
});
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(OUT, "boss-vorkath-sticky.png") });

const dirVisible = await page.evaluate(() => {
  const dir = [...document.querySelectorAll("aside")].find((a) =>
    /Boss Directory/i.test(a.innerText || "")
  );
  if (!dir) return false;
  const r = dir.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom > 0 && r.width > 0;
});
console.log("directory sticky visible:", dirVisible);

const skills = await page.evaluate(() => {
  const h = [...document.querySelectorAll("h4,h5")].find((x) =>
    /suggested skills/i.test(x.textContent || "")
  );
  return h?.parentElement?.innerText?.slice(0, 350);
});
console.log("skills sample:\n", skills);

// Equipment section
await page.evaluate(() => {
  const el = [...document.querySelectorAll("h4,h5")].find((h) =>
    /^equipment$/i.test((h.textContent || "").trim())
  );
  el?.scrollIntoView({ block: "start" });
});
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(OUT, "boss-vorkath-equipment.png") });

// Wiki DS2
await page.goto("http://localhost:5173/#wiki?page=Dragon%20Slayer%20II", {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(OUT, "wiki-ds2.png") });
const toc = await page.evaluate(
  () => document.querySelectorAll('nav[aria-label="On this page"] button').length
);
console.log("ds2 toc count:", toc);

// Link from boss guide
await page.goto("http://localhost:5173/#bosses?boss=Vorkath", {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(4000);
const link = await page.evaluate(() => {
  const a = document.querySelector(".article-content a[data-wiki-page]");
  if (!a) return null;
  const p = a.getAttribute("data-wiki-page");
  a.click();
  return p;
});
await page.waitForTimeout(2000);
console.log("guide→wiki link:", link, "hash:", page.url());
await page.screenshot({ path: path.join(OUT, "boss-to-wiki-nav.png") });

await browser.close();
console.log("verify done");
