/**
 * Pass-2 visual verification: wider layout, TOC active, skills, multi-boss, mobile.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.RW_BASE || "http://localhost:5173";
const OUT = "audit-shots/wiki-boss-pass2";
fs.mkdirSync(OUT, { recursive: true });

const findings = [];
const f = (sev, area, msg, extra) => {
  findings.push({ sev, area, msg, extra });
  console.log(`[${sev}] ${area}: ${msg}`);
  if (extra) console.log("   ", JSON.stringify(extra).slice(0, 350));
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

// ── Vorkath desktop ──────────────────────────────────────────────────
await page.goto(`${BASE}/#bosses?boss=Vorkath`, {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(4500);
await shot("p2-vorkath-top");

// Measure content width (should be wider with max-w-7xl)
const widthInfo = await page.evaluate(() => {
  const main = document.querySelector("main .mx-auto, main > div");
  const r = main?.getBoundingClientRect();
  return { maxW: r?.width ?? 0, className: main?.className ?? "" };
});
f(
  widthInfo.maxW > 1100 ? "ok" : "info",
  "layout",
  `content max width ≈ ${Math.round(widthInfo.maxW)}px`,
  widthInfo
);

// Skills text
const skills = await page.evaluate(() => {
  const h = [...document.querySelectorAll("h4,h5")].find((x) =>
    /suggested skills/i.test(x.textContent || "")
  );
  return h?.parentElement?.innerText ?? "";
});
f(
  /Ranged 85\+|Attack 80\+|Prayer 70\+/.test(skills) ? "ok" : "P1",
  "skills",
  skills.includes("Level 85+") ? "still bare Level labels" : "named skills present",
  { preview: skills.slice(0, 280) }
);

// Scroll fight overview → check active TOC
await page.evaluate(() => {
  document
    .querySelectorAll("h4,h5")
    .forEach((h) => {
      if (/fight overview/i.test(h.textContent || "")) {
        h.closest("section")?.scrollIntoView({ block: "center" });
      }
    });
});
await page.waitForTimeout(800);
const activeToc = await page.evaluate(() => {
  const cur = document.querySelector(
    'aside button[aria-current="location"]'
  );
  return cur?.textContent?.trim() ?? null;
});
f(activeToc ? "ok" : "P2", "toc", `active section: ${activeToc}`);
await shot("p2-vorkath-toc-active");

// Links present
const linkCount = await page.evaluate(
  () => document.querySelectorAll(".article-content a[data-wiki-page]").length
);
f(linkCount > 10 ? "ok" : "P1", "links", `in-app wiki links: ${linkCount}`);

// Equipment tabber / pills
await page.evaluate(() => {
  document.querySelectorAll("h4,h5").forEach((h) => {
    if (/^equipment$/i.test((h.textContent || "").trim())) {
      h.closest("section")?.scrollIntoView({ block: "start" });
    }
  });
});
await page.waitForTimeout(600);
await shot("p2-vorkath-equipment");

// ── Multi-boss section filters ───────────────────────────────────────
for (const boss of ["Zulrah", "Corporeal Beast", "Theatre of Blood", "Olms"]) {
  // Olm might be under Chambers - try Olm / Great Olm
  const name =
    boss === "Olms" ? "Chambers of Xeric" : boss === "Theatre of Blood" ? "Theatre of Blood" : boss;
  await page.goto(`${BASE}/#bosses?boss=${encodeURIComponent(name)}`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(3500);
  const heads = await page.evaluate(() =>
    [...document.querySelectorAll(".space-y-3 > section h4, .space-y-3 > section h5")]
      .map((h) => h.textContent.trim())
      .slice(0, 25)
  );
  const dropLeak = heads.filter((h) =>
    /^(drops|100%|uniques|tertiary|rare drop table)$/i.test(h)
  );
  f(
    dropLeak.length === 0 ? "ok" : "P1",
    "filter",
    `${name}: ${heads.length} sections, dropLeak=${dropLeak.length}`,
    { heads: heads.slice(0, 12), dropLeak }
  );
  await shot(`p2-boss-${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`);
}

// ── Wiki whip wider + TOC ────────────────────────────────────────────
await page.goto(`${BASE}/#wiki?page=Abyssal%20whip`, {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(2500);
const wikiW = await page.evaluate(() => {
  const main = document.querySelector("main .mx-auto, main > div");
  return main?.getBoundingClientRect().width ?? 0;
});
f("info", "wiki", `wiki content width ≈ ${Math.round(wikiW)}px`);
const tocN = await page.evaluate(
  () => document.querySelectorAll('nav[aria-label="On this page"] button').length
);
f(tocN >= 4 ? "ok" : "P2", "wiki", `TOC entries: ${tocN}`);
await shot("p2-wiki-whip");

// ── Mobile boss ──────────────────────────────────────────────────────
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/#bosses?boss=Vorkath`, {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(4000);
const mobile = await page.evaluate(() => {
  const dir = [...document.querySelectorAll("aside")].find((a) =>
    /Boss Directory/i.test(a.innerText || "")
  );
  const dirDisplay = dir ? getComputedStyle(dir).display : "missing";
  const chips = document.querySelector("[data-guide-chips]");
  const metrics = document.body.innerText.includes("Sections");
  const back = /All bosses/i.test(document.body.innerText);
  const clamp = !!document.querySelector(".line-clamp-3");
  return { dirDisplay, hasChips: !!chips, metrics, back, clamp };
});
f(
  mobile.dirDisplay === "none" && mobile.back && mobile.hasChips ? "ok" : "P1",
  "mobile",
  "mobile chrome",
  mobile
);
await shot("p2-mobile-top");

// Scroll mid-guide for sticky chips
await page.evaluate(() => {
  document.querySelectorAll("h4,h5").forEach((h) => {
    if (/fight overview/i.test(h.textContent || "")) {
      h.closest("section")?.scrollIntoView({ block: "start" });
    }
  });
});
await page.waitForTimeout(700);
const chipActive = await page.evaluate(() => {
  const cur = document.querySelector(
    '[data-guide-chips] button[aria-current="location"]'
  );
  return cur?.textContent?.trim() ?? null;
});
f(chipActive ? "ok" : "info", "mobile", `sticky chip active: ${chipActive}`);
await shot("p2-mobile-fight");

// Real overflow excluding intentional scrollers
const over = await page.evaluate(() => {
  let n = 0;
  document.querySelectorAll("*").forEach((el) => {
    const s = getComputedStyle(el);
    if (["auto", "scroll", "clip"].includes(s.overflowX)) return;
    if (el.scrollWidth > el.clientWidth + 10 && el.clientWidth > 50) n++;
  });
  return n;
});
f(over < 20 ? "ok" : "P2", "mobile", `non-intentional overflow nodes: ${over}`);

const md = [
  "# Wiki + Boss pass 2 audit",
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
fs.writeFileSync(path.join(OUT, "PASS2.md"), md);
fs.writeFileSync(path.join(OUT, "pass2.json"), JSON.stringify(findings, null, 2));
console.log("\nWrote", path.join(OUT, "PASS2.md"));
await browser.close();
const p1 = findings.filter((x) => x.sev === "P1").length;
process.exit(p1 > 0 ? 1 : 0);
