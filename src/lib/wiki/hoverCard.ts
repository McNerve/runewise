import { fetchWikiSummary, type WikiPageSummary } from "./lookup";
import { fetchLatestPrices, fetchMapping } from "../api/ge";
import { formatGp } from "../format";

export interface HoverPayload {
  summary: WikiPageSummary | null;
  ge: { price: number | null; alch: number | null; limit: number | null } | null;
}

const payloadCache = new Map<string, HoverPayload>();
const inflight = new Map<string, Promise<HoverPayload>>();

async function loadPayload(page: string): Promise<HoverPayload> {
  const key = page.toLowerCase();
  const cached = payloadCache.get(key);
  if (cached) return cached;
  const pending = inflight.get(key);
  if (pending) return pending;

  const job = (async (): Promise<HoverPayload> => {
    const [summary, mapping, prices] = await Promise.all([
      fetchWikiSummary(page),
      fetchMapping().catch(() => []),
      fetchLatestPrices().catch(() => ({}) as Record<string, { high: number | null }>),
    ]);
    const item = mapping.find((m) => m.name.toLowerCase() === page.toLowerCase());
    const ge = item
      ? {
          price: prices[String(item.id)]?.high ?? null,
          alch: item.highalch ?? null,
          limit: item.limit ?? null,
        }
      : null;
    const payload = { summary, ge };
    payloadCache.set(key, payload);
    return payload;
  })();

  inflight.set(key, job);
  try {
    return await job;
  } finally {
    inflight.delete(key);
  }
}

export function buildHoverFacts(payload: HoverPayload): string[] {
  const facts: string[] = [];
  if (payload.ge?.price != null) facts.push(`GE ${formatGp(payload.ge.price)}`);
  if (payload.ge?.alch != null) facts.push(`Alch ${formatGp(payload.ge.alch)}`);
  if (payload.ge?.limit != null) facts.push(`Limit ${payload.ge.limit.toLocaleString()}`);
  for (const field of payload.summary?.fields ?? []) {
    if (facts.length >= 4) break;
    if (!field.value) continue;
    facts.push(`${field.label} ${field.value}`);
  }
  return facts;
}

function renderCard(el: HTMLElement, page: string, payload: HoverPayload) {
  const summary = payload.summary;
  const title = summary?.title ?? page;
  const extract = summary?.summary ?? "";
  const image = summary?.image;
  const facts = buildHoverFacts(payload);

  el.innerHTML = `
    <div class="wiki-hover-card-inner">
      ${
        image
          ? `<img class="wiki-hover-card-img" src="${image}" alt="" />`
          : ""
      }
      <div class="wiki-hover-card-body">
        <div class="wiki-hover-card-title">${escapeHtml(title)}</div>
        ${
          extract
            ? `<p class="wiki-hover-card-extract">${escapeHtml(extract)}</p>`
            : ""
        }
        ${
          facts.length
            ? `<div class="wiki-hover-card-facts">${facts
                .map((f) => `<span>${escapeHtml(f)}</span>`)
                .join("")}</div>`
            : ""
        }
      </div>
    </div>
  `;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function placeCard(el: HTMLElement, rect: DOMRect) {
  const width = Math.min(340, window.innerWidth - 24);
  el.style.width = `${width}px`;
  el.style.display = "block";
  const cardHeight = el.offsetHeight || 140;
  let left = rect.left;
  if (left + width > window.innerWidth - 12) {
    left = Math.max(12, window.innerWidth - width - 12);
  }
  let top = rect.bottom + 8;
  if (top + cardHeight > window.innerHeight - 12 && rect.top - cardHeight - 8 > 12) {
    top = rect.top - cardHeight - 8;
  }
  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(top)}px`;
}

/**
 * MediaWiki-style page previews on in-app wiki links (`a[data-wiki-page]`).
 * One shared card on document.body; summaries are cached.
 */
export function initWikiHoverCards(container: HTMLElement) {
  if (container.getAttribute("data-hover-init")) return;
  container.setAttribute("data-hover-init", "1");

  let card: HTMLDivElement | null = null;
  let showTimer: number | null = null;
  let hideTimer: number | null = null;
  let activePage: string | null = null;

  function ensureCard() {
    if (card && document.body.contains(card)) return card;
    card = document.createElement("div");
    card.className = "wiki-hover-card";
    card.setAttribute("role", "tooltip");
    card.style.display = "none";
    document.body.appendChild(card);
    return card;
  }

  function hide() {
    if (card) card.style.display = "none";
    activePage = null;
  }

  async function show(anchor: Element, page: string) {
    const el = ensureCard();
    // Snapshot the rect now — React may replace the <a> while we fetch.
    const rect = anchor.getBoundingClientRect();
    activePage = page;
    el.innerHTML = `<div class="wiki-hover-card-inner wiki-hover-card-inner--loading"><div class="wiki-hover-card-skel"></div><div class="wiki-hover-card-body"><div class="wiki-hover-card-skel-line"></div><div class="wiki-hover-card-skel-line short"></div></div></div>`;
    placeCard(el, rect);
    const payload = await loadPayload(page);
    if (activePage !== page) return;
    if (!payload.summary && !payload.ge) {
      hide();
      return;
    }
    renderCard(el, page, payload);
    placeCard(el, rect);
  }

  container.addEventListener("mouseover", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest("a[data-wiki-page]");
    if (!(link instanceof HTMLElement) || !container.contains(link)) return;
    const page = link.getAttribute("data-wiki-page")?.trim();
    if (!page) return;
    if (hideTimer != null) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
    if (showTimer != null) window.clearTimeout(showTimer);
    showTimer = window.setTimeout(() => {
      void show(link, page);
    }, 160);
  });

  container.addEventListener("mouseout", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest("a[data-wiki-page]");
    if (!link) return;
    const related = event.relatedTarget;
    if (related instanceof Node && link.contains(related)) return;
    if (showTimer != null) {
      window.clearTimeout(showTimer);
      showTimer = null;
    }
    hideTimer = window.setTimeout(hide, 80);
  });

  container.addEventListener("click", hide);
}

export function teardownWikiHoverCards() {
  document.querySelectorAll(".wiki-hover-card").forEach((el) => el.remove());
}

/** Exported for tests — cache isolation. */
export function _resetHoverCardCache() {
  payloadCache.clear();
  inflight.clear();
}
