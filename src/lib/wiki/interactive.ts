/**
 * Shared imperative helpers for wiki HTML content:
 * tabbers, image tooltips, and click-to-zoom lightbox.
 *
 * Used by both BossGuide and WikiLookup.
 */

export function initWikiTabbers(container: HTMLElement) {
  container.querySelectorAll(".tabber").forEach((tabber) => {
    if (tabber.querySelector(".tabber-nav")) return;

    const tabs = Array.from(tabber.querySelectorAll(":scope > .tabbertab"));
    if (tabs.length === 0) return;

    const nav = document.createElement("div");
    nav.className = "tabber-nav";
    nav.style.cssText =
      "display:flex;flex-wrap:wrap;gap:0.25rem;margin-bottom:0.5rem;";

    tabs.forEach((tab, i) => {
      const title =
        tab.getAttribute("data-title") ||
        tab.getAttribute("title") ||
        `Tab ${i + 1}`;
      const btn = document.createElement("button");
      btn.textContent = title;
      btn.style.cssText = `padding:0.35rem 0.75rem;border-radius:0.5rem;font-size:0.75rem;font-weight:500;border:1px solid #2e3345;background:${i === 0 ? "rgba(59,130,246,0.15)" : "rgba(26,29,39,0.6)"};color:${i === 0 ? "#3b82f6" : "#a1a1aa"};cursor:pointer;transition:all 0.15s;`;

      btn.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("tabbertab--active"));
        tab.classList.add("tabbertab--active");
        setTimeout(() => initTooltips(tab as HTMLElement), 50);
        nav.querySelectorAll("button").forEach((b, j) => {
          b.style.background =
            j === tabs.indexOf(tab)
              ? "rgba(59,130,246,0.15)"
              : "rgba(26,29,39,0.6)";
          b.style.color =
            j === tabs.indexOf(tab) ? "#3b82f6" : "#a1a1aa";
          b.style.borderColor =
            j === tabs.indexOf(tab)
              ? "rgba(59,130,246,0.4)"
              : "#2e3345";
        });
      });

      nav.appendChild(btn);
    });

    tabs[0].classList.add("tabbertab--active");
    tabber.prepend(nav);
  });
}

export function initTooltips(container: HTMLElement) {
  container.querySelectorAll("img").forEach((img) => {
    if (img.getAttribute("data-tooltip-init")) return;
    img.setAttribute("data-tooltip-init", "1");

    const label =
      img.getAttribute("alt") ||
      img.getAttribute("title") ||
      decodeURIComponent(
        img
          .getAttribute("src")
          ?.split("/")
          .pop()
          ?.replace(/\.png.*/, "")
          .replace(/_/g, " ") || ""
      );

    if (!label || label.length < 2) return;

    img.style.cursor = "help";
    const parent = img.parentElement;
    if (!parent) return;
    if (getComputedStyle(parent).position === "static")
      parent.style.position = "relative";

    img.addEventListener("mouseenter", () => {
      const tip = document.createElement("div");
      tip.className = "wiki-tooltip";
      tip.textContent = label;
      parent.appendChild(tip);
    });

    img.addEventListener("mouseleave", () => {
      parent
        .querySelectorAll(".wiki-tooltip")
        .forEach((t) => t.remove());
    });
  });
}

export function handleLightboxClick(e: React.MouseEvent | MouseEvent) {
  const target = e.target;
  if (!(target instanceof HTMLImageElement)) return;

  const src = target.src;
  if (!src) return;

  const label = target.alt || target.title || "";

  const overlay = document.createElement("div");
  overlay.className = "wiki-lightbox";

  const cleanup = () => {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
  };

  const onKey = (ev: KeyboardEvent) => {
    if (ev.key === "Escape") cleanup();
  };

  overlay.onclick = (ev) => {
    if (ev.target === overlay) cleanup();
  };

  const img = document.createElement("img");
  img.src = src;
  img.alt = label;
  let scale = 1;
  img.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    scale = Math.max(0.5, Math.min(5, scale + (ev.deltaY > 0 ? -0.2 : 0.2)));
    img.style.transform = `scale(${scale})`;
  });
  overlay.appendChild(img);

  if (label) {
    const labelEl = document.createElement("div");
    labelEl.className = "wiki-lightbox-label";
    labelEl.textContent = label;
    overlay.appendChild(labelEl);
  }

  document.addEventListener("keydown", onKey);
  document.body.appendChild(overlay);
}

/**
 * Wire up in-page anchor links so they smooth-scroll to the right heading.
 *
 * Wiki HTML uses `href="#Section_Name"` links (spaces encoded as underscores).
 * We scan all headings in the container, build a slug → element map, then
 * intercept anchor clicks that match.  A page-name prefix prevents collisions
 * when multiple pages are mounted simultaneously.
 */
export function initAnchorScroll(container: HTMLElement, pageSlug = "") {
  // Build slug → heading map
  const slugMap = new Map<string, HTMLElement>();
  const counter = new Map<string, number>();

  container
    .querySelectorAll("h1, h2, h3, h4, h5, h6, [id]")
    .forEach((el) => {
      const rawId = el.id || el.getAttribute("id") || "";
      if (!rawId) return;

      // Normalise: lowercase, replace underscores/spaces with hyphens
      const base = rawId.toLowerCase().replace(/[_ ]+/g, "-");
      const prefixed = pageSlug ? `${pageSlug}-${base}` : base;

      // Deduplicate collisions with a counter suffix
      const count = (counter.get(prefixed) ?? 0) + 1;
      counter.set(prefixed, count);
      const slug = count === 1 ? prefixed : `${prefixed}-${count}`;

      // Set the id on the element so native :target also works
      el.id = slug;
      slugMap.set(base, el as HTMLElement);
      // Also store without page prefix for direct fragment links
      slugMap.set(rawId.toLowerCase().replace(/[_ ]+/g, "-"), el as HTMLElement);
    });

  // Intercept anchor clicks
  container.querySelectorAll("a[href^='#']").forEach((link) => {
    const rawHref = link.getAttribute("href") ?? "";
    if (!rawHref.startsWith("#")) return;

    const fragment = rawHref.slice(1).toLowerCase().replace(/[_ ]+/g, "-");
    const target = slugMap.get(fragment);
    if (!target) return;

    link.addEventListener("click", (ev) => {
      ev.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

export function initWikiInteractive(container: HTMLElement, pageSlug = "") {
  initWikiTabbers(container);
  initTooltips(container);
  initAnchorScroll(container, pageSlug);
}
