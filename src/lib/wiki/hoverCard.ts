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
          price: prices[String(item.id)]?.high ?? prices[String(item.id)]?.low ?? null,
          alch: item.highalch ?? null,
          limit: item.limit ?? null,
        }
      : null;
    const payload = { summary, ge };
    if (payload.summary || payload.ge) payloadCache.set(key, payload);
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

function isWikiImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url, "https://oldschool.runescape.wiki");
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "oldschool.runescape.wiki" ||
        parsed.hostname === "maps.runescape.wiki" ||
        parsed.hostname.endsWith(".runescape.com"))
    );
  } catch {
    return false;
  }
}

function renderCard(el: HTMLElement, page: string, payload: HoverPayload) {
  const summary = payload.summary;
  const title = summary?.title ?? page;
  const extract = summary?.summary ?? "";
  const image = summary?.image;
  const facts = buildHoverFacts(payload);

  const inner = document.createElement("div");
  inner.className = "wiki-hover-card-inner";

  if (image && isWikiImageUrl(image)) {
    const img = document.createElement("img");
    img.className = "wiki-hover-card-img";
    img.src = image;
    img.alt = "";
    inner.appendChild(img);
  }

  const body = document.createElement("div");
  body.className = "wiki-hover-card-body";
  const titleEl = document.createElement("div");
  titleEl.className = "wiki-hover-card-title";
  titleEl.textContent = title;
  body.appendChild(titleEl);
  if (extract) {
    const p = document.createElement("p");
    p.className = "wiki-hover-card-extract";
    p.textContent = extract;
    body.appendChild(p);
  }
  if (facts.length) {
    const wrap = document.createElement("div");
    wrap.className = "wiki-hover-card-facts";
    for (const fact of facts) {
      const span = document.createElement("span");
      span.textContent = fact;
      wrap.appendChild(span);
    }
    body.appendChild(wrap);
  }
  inner.appendChild(body);
  el.replaceChildren(inner);
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
export function initWikiHoverCards(container: HTMLElement): () => void {
  if (container.getAttribute("data-hover-init")) {
    return () => teardownWikiHoverCards();
  }
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

  function clearTimers() {
    if (showTimer != null) window.clearTimeout(showTimer);
    if (hideTimer != null) window.clearTimeout(hideTimer);
    showTimer = null;
    hideTimer = null;
  }

  async function show(anchor: Element, page: string) {
    const el = ensureCard();
    // Snapshot the rect now — React may replace the <a> while we fetch.
    const rect = anchor.getBoundingClientRect();
    activePage = page;
    el.replaceChildren();
    const loading = document.createElement("div");
    loading.className = "wiki-hover-card-inner wiki-hover-card-inner--loading";
    loading.innerHTML =
      `<div class="wiki-hover-card-skel"></div><div class="wiki-hover-card-body"><div class="wiki-hover-card-skel-line"></div><div class="wiki-hover-card-skel-line short"></div></div>`;
    el.appendChild(loading);
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

  function onOver(event: Event) {
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
  }

  function onOut(event: Event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest("a[data-wiki-page]");
    if (!link) return;
    const related = (event as MouseEvent).relatedTarget;
    if (related instanceof Node && link.contains(related)) return;
    if (showTimer != null) {
      window.clearTimeout(showTimer);
      showTimer = null;
    }
    hideTimer = window.setTimeout(hide, 80);
  }

  container.addEventListener("mouseover", onOver);
  container.addEventListener("mouseout", onOut);
  container.addEventListener("click", hide);

  return () => {
    container.removeAttribute("data-hover-init");
    container.removeEventListener("mouseover", onOver);
    container.removeEventListener("mouseout", onOut);
    container.removeEventListener("click", hide);
    clearTimers();
    card?.remove();
    card = null;
  };
}

export function teardownWikiHoverCards() {
  document.querySelectorAll(".wiki-hover-card").forEach((el) => el.remove());
}

/** Exported for tests — cache isolation. */
export function _resetHoverCardCache() {
  payloadCache.clear();
  inflight.clear();
}
