/**
 * Deep visual/DOM audit for Wiki Lookup + Boss Guides.
 * Usage: node scripts/audit-wiki-boss-deep.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.RW_BASE || "http://localhost:5173";
const OUT = "audit-shots/wiki-boss-deep";
fs.mkdirSync(OUT, { recursive: true });

const findings = [];
function f(sev, area, msg, extra = {}) {
  findings.push({ sev, area, msg, ...extra });
  console.log(`[${sev}] ${area}: ${msg}`);
  if (Object.keys(extra).length) {
    console.log("   ", JSON.stringify(extra).slice(0, 400));
  }
}

async function shot(page, name) {
  await page.screenshot({
    path: path.join(OUT, `${name}.png`),
    fullPage: false,
  });
}

async function forceImages(page) {
  await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll("img")];
    await Promise.all(
      imgs.map((img) => {
        try {
          if (img.loading === "lazy") img.loading = "eager";
        } catch {
          /* ignore */
        }
        img.scrollIntoView({ block: "nearest" });
        if (img.complete) return Promise.resolve();
        return new Promise((r) => {
          img.onload = img.onerror = () => r();
          setTimeout(r, 3500);
        });
      })
    );
  });
  await page.waitForTimeout(600);
}

async function imgStats(page, root = "body") {
  return page.evaluate((sel) => {
    const scope = document.querySelector(sel) || document.body;
    const imgs = [...scope.querySelectorAll("img")];
    return {
      total: imgs.length,
      complete: imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
      broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).length,
      loading: imgs.filter((i) => !i.complete).length,
      samples: imgs.slice(0, 10).map((i) => ({
        src: (i.currentSrc || i.src || "").slice(0, 140),
        complete: i.complete,
        w: i.naturalWidth,
        display: getComputedStyle(i).display,
        unresolved: i.getAttribute("data-unresolved"),
      })),
    };
  }, root);
}

async function overflowNodes(page) {
  return page.evaluate(() => {
    const bad = [];
    document.querySelectorAll("*").forEach((el) => {
      if (el.scrollWidth > el.clientWidth + 4 && el.clientWidth > 40) {
        bad.push({
          tag: el.tagName,
          cls: String(el.className || "").slice(0, 80),
          sw: el.scrollWidth,
          cw: el.clientWidth,
        });
      }
    });
    return bad.slice(0, 25);
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Skip onboarding so screenshots show the actual workspace.
await page.addInitScript(() => {
  localStorage.setItem("runewise_onboarding_completed", "1");
  localStorage.setItem("runewise_rsn", "Raxor");
});

// ── Wiki: Abyssal whip ──────────────────────────────────────────────
await page.goto(`${BASE}/#wiki?page=Abyssal%20whip&query=Abyssal%20whip`, {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(2000);
await forceImages(page);
await shot(page, "d-wiki-whip-top");

const whipImgs = await imgStats(page, "body");
f(
  whipImgs.broken > 10 ? "P1" : "info",
  "wiki",
  `whip images complete=${whipImgs.complete} broken=${whipImgs.broken} loading=${whipImgs.loading} total=${whipImgs.total}`,
  { samples: whipImgs.samples }
);

const links = await page.evaluate(() =>
  [...document.querySelectorAll(".article-content a")].slice(0, 20).map((a) => ({
    text: (a.textContent || "").trim().slice(0, 40),
    href: a.getAttribute("href"),
    dataPage: a.getAttribute("data-wiki-page"),
    target: a.getAttribute("target"),
  }))
);
f("info", "wiki", `article links sample (${links.length})`, { links });

const toc = await page.evaluate(() => {
  const nav = document.querySelector('nav[aria-label="On this page"]');
  if (!nav) return { present: false, count: 0 };
  return {
    present: true,
    count: nav.querySelectorAll("button").length,
    texts: [...nav.querySelectorAll("button")].map((b) => b.textContent.trim()),
  };
});
f(toc.present && toc.count >= 2 ? "ok" : "P2", "wiki", "TOC state", toc);

const heads = await page.evaluate(() =>
  [...document.querySelectorAll("h3, h4, details summary")]
    .map((h) => h.textContent.trim())
    .filter(Boolean)
    .slice(0, 35)
);
f("info", "wiki", "headings", { heads });

// Snapshot GE + fields
const snap = await page.evaluate(() => {
  const aside = document.querySelector("aside");
  return aside ? aside.innerText.slice(0, 900) : "no aside";
});
f("info", "wiki", "snapshot", { snap: snap.slice(0, 500) });

// Scroll for tables / combat bonuses
await page.evaluate(() => window.scrollBy(0, 1000));
await page.waitForTimeout(700);
await forceImages(page);
await shot(page, "d-wiki-whip-mid");
await page.evaluate(() => window.scrollBy(0, 1400));
await page.waitForTimeout(700);
await shot(page, "d-wiki-whip-lower");

// Internal navigation
const clicked = await page.evaluate(() => {
  const a = document.querySelector(".article-content a[data-wiki-page]");
  if (!a) return null;
  const p = a.getAttribute("data-wiki-page");
  a.click();
  return p;
});
f(
  clicked ? "ok" : "P1",
  "wiki",
  clicked ? `clicked internal: ${clicked}` : "NO data-wiki-page links in article"
);
await page.waitForTimeout(2500);
await shot(page, "d-wiki-after-internal");
f("info", "wiki", "hash after internal click", { hash: page.url() });

// Mobile wiki
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/#wiki?page=Abyssal%20whip&query=Abyssal%20whip`, {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(2000);
const mOver = await overflowNodes(page);
f(
  mOver.length > 6 ? "P1" : "info",
  "wiki",
  `mobile overflow nodes=${mOver.length}`,
  { sample: mOver.slice(0, 10) }
);
await shot(page, "d-wiki-mobile-top");
await page.evaluate(() => window.scrollBy(0, 700));
await shot(page, "d-wiki-mobile-mid");

// ── Boss: Vorkath ───────────────────────────────────────────────────
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/#bosses?boss=Vorkath`, {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(4500);
await shot(page, "d-boss-vorkath-top");

const bossStruct = await page.evaluate(() => {
  const asideBtns = [
    ...document.querySelectorAll("aside button"),
  ]
    .map((b) => b.textContent.trim())
    .filter((t) => t.length > 1 && t.length < 90);
  const sections = [...document.querySelectorAll(".space-y-3 > section")].map(
    (s) => ({
      id: s.id,
      h: (s.querySelector("h4,h5")?.textContent || "").trim(),
      textLen: (s.innerText || "").length,
      imgs: s.querySelectorAll("img").length,
      links: s.querySelectorAll("a").length,
      tables: s.querySelectorAll("table").length,
    })
  );
  return { asideBtns: asideBtns.slice(0, 30), sections: sections.slice(0, 18) };
});
f("info", "boss", "vorkath structure", bossStruct);

// Jump to fight overview
const jumped = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("aside button")];
  const target =
    btns.find((b) => /Fight overview/i.test(b.textContent || "")) ||
    btns.find((b) => /Woox/i.test(b.textContent || "")) ||
    btns[2];
  if (!target) return null;
  target.click();
  return target.textContent.trim();
});
f("info", "boss", `jumped: ${jumped}`);
await page.waitForTimeout(1000);
await forceImages(page);
await shot(page, "d-boss-vorkath-strategy");

const sectionSamples = await page.evaluate(() =>
  [...document.querySelectorAll(".space-y-3 > section")].slice(0, 8).map((s) => {
    const title = s.querySelector("h4,h5")?.textContent?.trim();
    return {
      title,
      textLen: (s.innerText || "").length,
      preview: (s.innerText || "").slice(0, 350),
      tables: s.querySelectorAll("table").length,
      links: s.querySelectorAll("a").length,
      imgsBroken: [...s.querySelectorAll("img")].filter(
        (i) => i.complete && i.naturalWidth === 0
      ).length,
      imgsOk: [...s.querySelectorAll("img")].filter(
        (i) => i.complete && i.naturalWidth > 0
      ).length,
    };
  })
);
f("info", "boss", "section content samples", sectionSamples);

// Check if equipment is structured (tiles) vs raw HTML
const equipUx = await page.evaluate(() => {
  const sections = [...document.querySelectorAll(".space-y-3 > section")];
  const equip = sections.find((s) =>
    /equipment|inventory|suggested skills|requirements/i.test(
      s.querySelector("h4,h5")?.textContent || ""
    )
  );
  if (!equip) return { found: false };
  return {
    found: true,
    title: equip.querySelector("h4,h5")?.textContent?.trim(),
    hasTiles: equip.querySelectorAll("[class*='rounded-lg border']").length,
    hasRawTable: equip.querySelectorAll("table").length,
    text: equip.innerText.slice(0, 400),
  };
});
f("info", "boss", "structured equip/skills UX", equipUx);

// Zulrah
await page.goto(`${BASE}/#bosses?boss=Zulrah`, {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(3500);
await shot(page, "d-boss-zulrah");
const zulrah = await page.evaluate(() => ({
  heads: [...document.querySelectorAll("h4,h5")]
    .map((h) => h.textContent.trim())
    .slice(0, 20),
  linksInGuide: document.querySelectorAll(".space-y-3 a").length,
  textLen: document.body.innerText.length,
}));
f("info", "boss", "zulrah", zulrah);

// Mobile boss
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/#bosses?boss=Vorkath`, {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(3500);
const bossMOver = await overflowNodes(page);
f(
  bossMOver.length > 10 ? "P1" : "info",
  "boss",
  `mobile overflow=${bossMOver.length}`,
  { sample: bossMOver.slice(0, 8) }
);
await shot(page, "d-boss-mobile-top");
await page.evaluate(() => window.scrollBy(0, 900));
await shot(page, "d-boss-mobile-mid");
await page.evaluate(() => {
  const btns = [...document.querySelectorAll("button")];
  const t = btns.find((b) => /Fight overview|Woox Walk/i.test(b.textContent || ""));
  t?.click();
});
await page.waitForTimeout(800);
await shot(page, "d-boss-mobile-strategy");

// Compare wiki Vorkath/Strategies vs boss guide
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(
  `${BASE}/#wiki?page=Vorkath%2FStrategies&query=Vorkath%2FStrategies`,
  { waitUntil: "networkidle", timeout: 60000 }
);
await page.waitForTimeout(3000);
await forceImages(page);
await shot(page, "d-wiki-vorkath-strategies");
const wikiV = await page.evaluate(() => ({
  title: document.querySelector("h3")?.textContent,
  heads: [...document.querySelectorAll("h4, details summary")]
    .map((h) => h.textContent.trim())
    .slice(0, 25),
  textLen: document.body.innerText.length,
  tocCount:
    document.querySelectorAll('nav[aria-label="On this page"] button').length,
  articleLinks: document.querySelectorAll(".article-content a[data-wiki-page]")
    .length,
  articleExt: document.querySelectorAll('.article-content a[target="_blank"]')
    .length,
}));
f("info", "compare", "wiki Vorkath/Strategies", wikiV);

// Dragon Slayer II quest page density
await page.goto(
  `${BASE}/#wiki?page=Dragon%20Slayer%20II&query=Dragon%20Slayer%20II`,
  { waitUntil: "networkidle", timeout: 60000 }
);
await page.waitForTimeout(3000);
await shot(page, "d-wiki-ds2-top");
const ds2 = await page.evaluate(() => ({
  heads: [...document.querySelectorAll("h4, details summary")]
    .map((h) => h.textContent.trim())
    .slice(0, 20),
  toc: document.querySelectorAll('nav[aria-label="On this page"] button').length,
  collapsed: document.querySelectorAll("details.article-content-collapse")
    .length,
}));
f("info", "wiki", "DS2 structure", ds2);

// Write report
const md = [
  "# Wiki + Boss Guides — deep audit",
  "",
  `**When:** ${new Date().toISOString()}`,
  "",
  "## Findings",
  ...findings.map(
    (x) =>
      `- **${x.sev}** [${x.area}] ${x.msg}` +
      (x.links || x.samples || x.sections || x.heads
        ? ` \`${JSON.stringify(
            x.links || x.samples || x.sections || x.heads || ""
          ).slice(0, 200)}\``
        : "")
  ),
  "",
  "## Screenshots",
  ...fs
    .readdirSync(OUT)
    .filter((n) => n.endsWith(".png"))
    .map((n) => `- \`${n}\``),
  "",
].join("\n");

fs.writeFileSync(path.join(OUT, "DEEP.md"), md);
fs.writeFileSync(path.join(OUT, "deep-report.json"), JSON.stringify(findings, null, 2));
console.log("\nWrote", path.join(OUT, "DEEP.md"));
await browser.close();
process.exit(findings.some((x) => x.sev === "P0" || x.sev === "P1") ? 1 : 0);
