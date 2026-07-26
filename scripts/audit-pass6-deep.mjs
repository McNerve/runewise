/**
 * Pass-6 deep audit: content quality, empty sections, TOC density, wiki chrome.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:5173";
const OUT = "audit-shots/wiki-boss-pass6";
fs.mkdirSync(OUT, { recursive: true });
const findings = [];
const f = (sev, area, msg, extra) => {
  findings.push({ sev, area, msg, extra });
  console.log(`[${sev}] ${area}: ${msg}`);
  if (extra) console.log("   ", JSON.stringify(extra).slice(0, 450));
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => {
  localStorage.setItem("runewise_onboarding_completed", "1");
  localStorage.setItem("runewise_rsn", "Raxor");
});

async function shot(n) {
  await page.screenshot({ path: path.join(OUT, `${n}.png`) });
}

async function loadBoss(name) {
  await page.goto(`${BASE}/#bosses?boss=${encodeURIComponent(name)}`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(5000);
}

async function sectionCards() {
  return page.evaluate(() =>
    [...document.querySelectorAll(".space-y-3 > section")].map((s) => {
      const title =
        s.querySelector(":scope > h4, :scope > h5")?.textContent?.trim() ?? "";
      const body = s.querySelector(".article-content, [class*='grid']");
      const text = (s.innerText || "").replace(title, "").trim();
      const imgs = s.querySelectorAll("img").length;
      const links = s.querySelectorAll("a").length;
      const tables = s.querySelectorAll("table").length;
      return {
        title,
        textLen: text.length,
        imgs,
        links,
        tables,
        emptyish: text.length < 40 && imgs < 2,
      };
    })
  );
}

// ── Multi-boss empty-section scan ───────────────────────────────────
for (const boss of [
  "Vorkath",
  "Zulrah",
  "Chambers of Xeric",
  "Tombs of Amascut",
  "Theatre of Blood",
  "Corporeal Beast",
  "Phantom Muspah",
  "Nightmare",
  "General Graardor",
  "Alchemical Hydra",
]) {
  await loadBoss(boss);
  const cards = await sectionCards();
  const empty = cards.filter((c) => c.emptyish);
  const tiny = cards.filter((c) => c.textLen < 80 && !c.emptyish);
  f(
    empty.length > 2 ? "P1" : empty.length > 0 ? "P2" : "ok",
    "content",
    `${boss}: ${cards.length} cards, emptyish=${empty.length}`,
    { empty: empty.map((e) => e.title), tiny: tiny.map((t) => t.title).slice(0, 6) }
  );
  if (boss === "Tombs of Amascut" || boss === "Chambers of Xeric") {
    await shot(`p6-${boss.replace(/\s+/g, "-").toLowerCase()}-top`);
    // Scroll mid
    await page.evaluate(() => window.scrollBy(0, 900));
    await page.waitForTimeout(400);
    await shot(`p6-${boss.replace(/\s+/g, "-").toLowerCase()}-mid`);
  }
}

// ── Directory UX: no search ─────────────────────────────────────────
await loadBoss("Vorkath");
const dirUx = await page.evaluate(() => {
  const dir = [...document.querySelectorAll("aside")].find((a) =>
    /Boss Directory/i.test(a.innerText || "")
  );
  const inputs = dir?.querySelectorAll("input")?.length ?? 0;
  const buttons = dir?.querySelectorAll("button")?.length ?? 0;
  return { inputs, buttons, hasSearch: inputs > 0 };
});
f(dirUx.hasSearch ? "ok" : "P2", "ux", "boss directory search", dirUx);

// ── Guide TOC density on CoX ────────────────────────────────────────
await loadBoss("Chambers of Xeric");
const toc = await page.evaluate(() => {
  const aside = [...document.querySelectorAll("aside")].find((a) =>
    /Guide Sections/i.test(a.innerText || "")
  );
  if (!aside) return { missing: true };
  const btns = [...aside.querySelectorAll("button")].map((b) =>
    b.textContent.trim()
  );
  const r = aside.getBoundingClientRect();
  return {
    count: btns.length,
    height: Math.round(r.height),
    sample: btns.slice(0, 12),
  };
});
f(
  toc.count > 20 ? "P2" : "ok",
  "ux",
  `guide TOC items=${toc.count}, h=${toc.height}`,
  toc
);

// ── Wiki long page + quest ──────────────────────────────────────────
await page.goto(`${BASE}/#wiki?page=Dragon%20Slayer%20II`, {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(3000);
const ds2 = await page.evaluate(() => {
  const tocN = document.querySelectorAll(
    'nav[aria-label="On this page"] button'
  ).length;
  const sections = document.querySelectorAll("section.scroll-mt-4, details.article-content-collapse").length;
  const related = document.querySelectorAll("button") 
  // overflow real
  let over = 0;
  document.querySelectorAll("*").forEach((el) => {
    const s = getComputedStyle(el);
    if (["auto", "scroll", "clip"].includes(s.overflowX)) return;
    if (el.scrollWidth > el.clientWidth + 12 && el.clientWidth > 60) over++;
  });
  return {
    tocN,
    sections,
    over,
    title: document.querySelector("h3")?.textContent,
    hasSnapshot: /Snapshot|Grand Exchange|infobox/i.test(document.body.innerText),
  };
});
f(ds2.tocN >= 10 ? "ok" : "P2", "wiki", "DS2 structure", ds2);
await shot("p6-wiki-ds2");

// Combat achievements page density
await page.goto(`${BASE}/#wiki?page=Combat%20Achievements`, {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(3000);
const ca = await page.evaluate(() => ({
  tables: document.querySelectorAll("table").length,
  scrollTables: document.querySelectorAll(".wiki-table-scroll").length,
  textLen: document.body.innerText.length,
}));
f(ca.scrollTables > 0 || ca.tables > 0 ? "ok" : "P2", "wiki", "CA tables", ca);
await shot("p6-wiki-ca");

// ── Mobile full chrome ──────────────────────────────────────────────
await page.setViewportSize({ width: 390, height: 844 });
await loadBoss("Tombs of Amascut");
const mob = await page.evaluate(() => {
  const chips = document.querySelectorAll("[data-guide-chips] button").length;
  // How much vertical space above first strategy section
  const first = document.querySelector(".space-y-3 > section");
  const y = first?.getBoundingClientRect().top ?? 0;
  return {
    chips,
    firstSectionY: Math.round(y),
    headerHeavy: y > 500,
  };
});
f(mob.headerHeavy ? "P2" : "ok", "mobile", "chrome before strategy", mob);
await shot("p6-toa-mobile");

// Vorkath equipment structured
await page.setViewportSize({ width: 1440, height: 900 });
await loadBoss("Vorkath");
await page.evaluate(() => {
  const h = [...document.querySelectorAll("h4")].find((x) =>
    /^equipment$/i.test(x.textContent || "")
  );
  h?.closest("section")?.scrollIntoView({ block: "start" });
});
await page.waitForTimeout(500);
const equip = await page.evaluate(() => {
  const sec = [...document.querySelectorAll(".space-y-3 > section")].find((s) =>
    /^equipment$/i.test(s.querySelector("h4")?.textContent || "")
  );
  if (!sec) return { missing: true };
  return {
    pills: sec.querySelectorAll("[class*='rounded-lg border']").length,
    checkboxes: sec.querySelectorAll("input[type=checkbox]").length,
    text: sec.innerText.slice(0, 200),
  };
});
f(equip.checkboxes > 3 ? "ok" : "P2", "equip", "vorkath equipment UX", equip);
await shot("p6-vorkath-equip");

fs.writeFileSync(
  path.join(OUT, "PASS6.md"),
  [
    "# Pass 6 deep audit",
    "",
    new Date().toISOString(),
    "",
    ...findings.map((x) => `- **${x.sev}** [${x.area}] ${x.msg}`),
    "",
  ].join("\n")
);
console.log("\nDone findings=", findings.length);
await browser.close();
const p1 = findings.filter((x) => x.sev === "P1").length;
process.exit(p1 > 0 ? 1 : 0);
