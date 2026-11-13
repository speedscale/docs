const iconPaths = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  x: '<path d="m6 6 12 12M6 18 18 6"/>',
  "arrow-up-right": '<path d="M7 17 17 7M7 7h10v10"/>',
  "arrow-right": '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  "arrow-down": '<path d="M12 5v14m-6-6 6 6 6-6"/>',
  "book-open":
    '<path d="M12 6v15M3 3h5a4 4 0 0 1 4 3 4 4 0 0 1 4-3h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3z"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
  users:
    '<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2m3-6a5 5 0 0 1 3 4v2M16 5a3 3 0 0 1 0 6"/>',
  "sliders-horizontal":
    '<path d="M3 6h3m4 0h11M3 12h11m4 0h3M3 18h3m4 0h11M6 3v6m8 0v6M6 15v6"/>',
};
function icon(name, className = "") {
  return `<svg class="${className}" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name]}</svg>`;
}
function renderSearch() {
  return `<div class="search-topline"><span class="search-brand">${icon("search")} Search Speedscale</span><button class="search-close" data-close-search aria-label="Close search"><span>esc</span>${icon("x")}</button><kbd class="search-shortcut">&#8984; K</kbd></div>
<div class="search-input-wrap">${icon("search", "input-icon")}<input type="search" aria-label="Search Speedscale" placeholder="Search docs, articles, and resources&#8230;" autocomplete="off" spellcheck="false"><button class="clear-search" aria-label="Clear search" hidden>${icon("x")}</button></div>
<div class="search-filters" role="group" aria-label="Filter search results">${["All results", "Docs", "Articles", "Resources", "Website"].map((label, i) => `<button data-filter="${i ? label : ""}" aria-pressed="${i ? "false" : "true"}">${label}</button>`).join("")}</div>
<div class="search-scroll"><div class="search-status" role="status" aria-live="polite"></div><div class="search-notice" role="status" hidden></div><div class="search-start"><p class="section-label">POPULAR SEARCHES</p><div class="search-suggestions">${["traffic replay", "API testing", "kubernetes", "mocking"].map((term) => `<button data-query="${term}">${icon("search")}${term}${icon("arrow-up-right")}</button>`).join("")}</div><p class="section-label quick-label">QUICK LINKS</p><div class="search-quicklinks">
<a data-destination="docs"><span class="quick-icon">${icon("book-open")}</span><span><strong>Documentation</strong><small>Install, configure, and get started</small></span>${icon("arrow-up-right", "quick-arrow")}</a>
<a data-destination="resources"><span class="quick-icon">${icon("layers")}</span><span><strong>Resource library</strong><small>Technical guides and practical examples</small></span>${icon("arrow-right", "quick-arrow")}</a>
<a data-destination="customers"><span class="quick-icon">${icon("users")}</span><span><strong>Customer stories</strong><small>How teams use Speedscale</small></span>${icon("arrow-right", "quick-arrow")}</a>
<a data-destination="pricing"><span class="quick-icon">${icon("sliders-horizontal")}</span><span><strong>Plans and pricing</strong><small>Find the right fit for your team</small></span>${icon("arrow-right", "quick-arrow")}</a>
</div></div><ol class="search-results" aria-label="Search results" hidden></ol><div class="search-empty" hidden>${icon("search")}<h2>No matches yet</h2><p>Try a shorter phrase or choose another filter.</p><button data-reset-filter hidden>Search all content</button></div><button class="search-more" hidden>Show more results${icon("arrow-down")}</button></div>
<div class="search-footer"><span><kbd>&#8593;</kbd><kbd>&#8595;</kbd> to explore <span class="enter-hint"><kbd>&#8629;</kbd> to open</span></span><a data-destination="docs">Open documentation ${icon("arrow-up-right")}</a></div>
`;
}
let enginePromise;
function timeout(promise, milliseconds) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error("Search index timed out")),
        milliseconds,
      );
    }),
  ]).finally(() => clearTimeout(timer));
}
async function getEngine(element) {
  enginePromise ??= (async () => {
    const module = await import(
      /* @vite-ignore */ /* webpackIgnore: true */ element.dataset.bundle
    );
    const create = () =>
      module.createInstance({
        basePath: new URL("./", new URL(element.dataset.bundle, location.href))
          .href,
        baseUrl: new URL(element.dataset.primaryBase || "./", location.href)
          .href,
        indexWeight: Number(element.dataset.indexWeight || 1),
      });
    const state = {
      engine: create(),
      secondaryAvailable: false,
      localReset: null,
      async useLocal() {
        this.localReset ??= (async () => {
          await this.engine.destroy();
          this.engine = create();
          await this.engine.init();
          this.secondaryAvailable = false;
        })();
        await this.localReset;
      },
    };
    await state.engine.init();
    if (element.dataset.secondaryBundle) {
      try {
        const metadata = await fetch(
          element.dataset.secondaryBundle.replace(/\/$/, "") +
            "/pagefind-entry.json",
          {
            signal: AbortSignal.timeout(3000),
            cache: "no-cache",
            credentials: "omit",
          },
        );
        if (!metadata.ok || (await metadata.json()).version !== element.dataset.engineVersion)
          throw new Error("Secondary index unavailable or incompatible");
        await timeout(
          state.engine.mergeIndex(element.dataset.secondaryBundle, {
            baseUrl: element.dataset.secondaryBase,
            indexWeight: Number(element.dataset.secondaryWeight || 1),
          }),
          6000,
        );
        state.secondaryAvailable = true;
      } catch {
        await state.useLocal();
      }
    }
    return state;
  })();
  try {
    return await enginePromise;
  } catch (error) {
    enginePromise = undefined;
    throw error;
  }
}

class SiteSearch extends HTMLElement {
  input;
  list;
  status;
  start;
  empty;
  more;
  clear;
  filter = "";
  hits = [];
  shown = 0;
  sequence = 0;
  timer;
  connectedCallback() {
    if (this.input) return;
    this.innerHTML = renderSearch();
    this.querySelector(".search-close").hidden = !this.closest("dialog");
    this.querySelector(".search-shortcut").hidden = Boolean(
      this.closest("dialog"),
    );
    for (const link of this.querySelectorAll("[data-destination]")) {
      const dest = link.getAttribute("data-destination");
      link.setAttribute(
        "href",
        dest === "docs"
          ? "https://docs.speedscale.com/"
          : new URL(
              dest + "/",
              new URL(
                this.dataset.websiteBase || "https://speedscale.com/",
                location.href,
              ),
            ).href,
      );
    }
    this.input = this.querySelector("input");
    this.list = this.querySelector(".search-results");
    this.status = this.querySelector(".search-status");
    this.start = this.querySelector(".search-start");
    this.empty = this.querySelector(".search-empty");
    this.more = this.querySelector(".search-more");
    this.clear = this.querySelector(".clear-search");
    this.input.addEventListener("input", () => {
      this.sequence++;
      this.hits = [];
      this.list.hidden = true;
      this.more.hidden = true;
      this.clear.hidden = !this.input.value;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.search(), 160);
    });
    this.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const query2 = event.target.closest("[data-query]");
      const filter = event.target.closest("[data-filter]");
      if (query2) {
        this.input.value = query2.dataset.query;
        this.input.focus();
        void this.search();
      }
      if (filter) {
        this.setFilter(filter.dataset.filter);
        void this.search();
      }
      if (event.target.closest("[data-reset-filter]")) {
        this.setFilter("");
        void this.search();
      }
    });
    this.clear.addEventListener("click", () => {
      this.input.value = "";
      this.input.focus();
      void this.search();
    });
    this.more.addEventListener(
      "click",
      () => void this.showMore(this.sequence),
    );
    this.addEventListener("keydown", (event) => {
      const links = Array.from(this.list.querySelectorAll("a"));
      const index = links.indexOf(document.activeElement);
      if (event.key === "ArrowDown" && links.length) {
        event.preventDefault();
        links[Math.min(index + 1, links.length - 1)].focus();
      } else if (event.key === "ArrowUp" && index >= 0) {
        event.preventDefault();
        (index === 0 ? this.input : links[index - 1]).focus();
      } else if (
        event.key === "Enter" &&
        event.target === this.input &&
        links.length &&
        !this.list.hidden
      ) {
        event.preventDefault();
        links[0].click();
      }
    });
    const query = new URLSearchParams(location.search).get("q");
    if (query && !this.closest("dialog")) {
      this.input.value = query;
      void this.search();
    }
  }
  setFilter(filter) {
    this.filter = filter;
    this.querySelectorAll("[data-filter]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filter === filter),
      );
    });
  }
  async search() {
    clearTimeout(this.timer);
    const sequence = ++this.sequence;
    const query = this.input.value.trim();
    this.clear.hidden = !this.input.value;
    this.start.hidden = Boolean(query);
    this.list.hidden = true;
    this.empty.hidden = true;
    this.more.hidden = true;
    this.list.replaceChildren();
    this.hits = [];
    this.shown = 0;
    this.status.textContent = query ? "Searching\u2026" : "";
    if (!query) {
      this.removeAttribute("aria-busy");
      return;
    }
    this.setAttribute("aria-busy", "true");
    try {
      const state = await getEngine(this);
      const options = this.filter ? { filters: { section: this.filter } } : {};
      let response;
      try {
        response = await timeout(state.engine.search(query, options), 8000);
      } catch (error) {
        if (!state.secondaryAvailable) throw error;
        await state.useLocal();
        response = await state.engine.search(query, options);
      }
      const notice = this.querySelector(".search-notice");
      notice.hidden = state.secondaryAvailable || !this.dataset.secondaryBundle;
      notice.textContent =
        this.dataset.localSection === "Docs"
          ? "Website search is unavailable. Showing documentation results."
          : "Docs search is unavailable. Showing website results. You can open the documentation below.";
      if (sequence !== this.sequence) return;
      this.hits = response?.results ?? [];
      this.status.textContent = `${this.hits.length} ${this.hits.length === 1 ? "result" : "results"} for \u201C${query}\u201D`;
      this.empty.hidden = this.hits.length > 0;
      this.querySelector("[data-reset-filter]").hidden = !this.filter;
      this.list.hidden = !this.hits.length;
      await this.showMore(sequence);
    } catch {
      if (sequence !== this.sequence) return;

      this.status.textContent =
        "Search is temporarily unavailable. Please try again, or open the documentation below.";
    } finally {
      if (sequence === this.sequence) this.removeAttribute("aria-busy");
    }
  }
  async showMore(sequence) {
    this.more.disabled = true;
    const offset = this.shown;
    try {
      const records = await Promise.all(
        this.hits.slice(offset, offset + 8).map((hit) => hit.data()),
      );
      if (sequence !== this.sequence) return;
      for (const record of records) {
        const url = new URL(record.url, location.origin);
        if (
          ![
            location.origin,
            "https://speedscale.com",
            "https://www.speedscale.com",
            "https://docs.speedscale.com",
            new URL(this.dataset.secondaryBase || location.origin).origin,
          ].includes(url.origin) ||
          !["http:", "https:"].includes(url.protocol)
        )
          continue;
        const row = document.createElement("li");
        const link = document.createElement("a");
        link.className = "search-result";
        link.href = url.href;
        const section = document.createElement("span");
        section.className = "result-type";
        section.textContent = record.filters?.section?.[0] ?? "Website";
        const title = document.createElement("h2");
        title.className = "result-title";
        title.textContent = (record.meta.title ?? url.pathname).replace(
          /\s*\|\s*Speedscale(?: Docs)?\s*$/,
          "",
        );
        const excerpt = document.createElement("p");
        excerpt.className = "result-excerpt";
        const parsed = new DOMParser().parseFromString(
          record.excerpt,
          "text/html",
        );
        for (const node of parsed.body.childNodes) {
          if (node instanceof Element && node.tagName === "MARK") {
            const mark = document.createElement("mark");
            mark.textContent = node.textContent;
            excerpt.append(mark);
          } else {
            excerpt.append(document.createTextNode(node.textContent ?? ""));
          }
        }
        link.append(section, title, excerpt);
        row.append(link);
        const sections = document.createElement("div");
        sections.className = "result-sections";
        for (const match of (record.sub_results || [])
          .filter((match) => match.url?.includes("#"))
          .slice(0, 2)) {
          const target = new URL(match.url, url);
          if (target.origin !== url.origin || target.pathname !== url.pathname)
            continue;
          const anchor = document.createElement("a");
          anchor.href = target.href;
          anchor.textContent = match.title;
          sections.append(anchor);
        }
        if (sections.childElementCount) row.append(sections);
        this.list.append(row);
      }
      this.shown += records.length;
      this.more.hidden = this.shown >= this.hits.length;
    } catch (error) {
      console.warn("Search result loading failed", error);
      if (sequence === this.sequence)
        this.status.textContent =
          "Could not load results. Please try your search again.";
    } finally {
      this.more.disabled = false;
    }
  }
}
if (!customElements.get("site-search"))
  customElements.define("site-search", SiteSearch);
