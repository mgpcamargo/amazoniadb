(() => {
  const catalog = window.AMAZONIA_CATALOG || [];
  const presentation = window.AMAZONIA_CATEGORY_PRESENTATION || {};
  const categories = Object.entries(presentation).map(([key, item]) => ({
    key,
    ...item,
    ...(item.locales.en || {})
  }));
  const categoryLabels = Object.fromEntries(categories.map((category) => [category.key, category.label]));
  const detailIcons = Object.freeze({
    timeframe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>',
    resolution: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5h14v14H5zM12 5v14M5 12h14"/></svg>',
    license: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5M10 14l2 2 4-4"/></svg>'
  });

  const state = { category: "", search: "", coverage: "", access: "", source: "" };
  const domainNav = document.getElementById("domain-nav");
  const grid = document.getElementById("dataset-grid");
  const emptyState = document.getElementById("empty-state");
  const resultCount = document.getElementById("result-count");
  const count = document.getElementById("dataset-count");
  const search = document.getElementById("search");
  const coverage = document.getElementById("coverage");
  const access = document.getElementById("access");
  const filters = document.getElementById("filters");
  const discoverButton = document.getElementById("discover-source");
  const discoveryResult = document.getElementById("discovery-result");

  count.textContent = String(catalog.length);

  // Restore filter state from the URL (?category=&q=&coverage=&access=) so a
  // filtered view can be bookmarked or shared as a link.
  const initialParams = new URLSearchParams(window.location.search);
  // Filter values come from their controlled UI vocabulary, rather than only
  // values represented by the current catalog. That keeps a legitimate empty
  // view (for example, Colombia before it has an entry) shareable.
  const valuesFromSelect = (select) => new Set(Array.from(select.options, ({ value }) => value).filter(Boolean));
  const validCategories = new Set(categories.map((category) => category.key));
  const validCoverage = valuesFromSelect(coverage);
  const validAccess = valuesFromSelect(access);
  const validParam = (value, allowed) => allowed.has(value) ? value : "";
  state.category = validParam(initialParams.get("category") || "", validCategories);
  state.search = initialParams.get("q") || "";
  state.coverage = validParam(initialParams.get("coverage") || "", validCoverage);
  state.access = validParam(initialParams.get("access") || "", validAccess);
  state.source = initialParams.get("source") || "";
  if (state.source && !catalog.some((record) => record.id === state.source)) state.source = "";
  if (state.source) {
    state.category = "";
    state.search = "";
    state.coverage = "";
    state.access = "";
  }
  search.value = state.search;
  coverage.value = state.coverage;
  access.value = state.access;

  const syncUrl = () => {
    const params = new URLSearchParams();
    if (state.category) params.set("category", state.category);
    if (state.search) params.set("q", state.search);
    if (state.coverage) params.set("coverage", state.coverage);
    if (state.access) params.set("access", state.access);
    if (state.source) params.set("source", state.source);
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash);
    syncLanguageLinks();
  };

  const syncLanguageLinks = () => {
    document.querySelectorAll(".lang-switch a").forEach((link) => {
      const baseHref = link.dataset.baseHref || link.getAttribute("href").split(/[?#]/)[0];
      link.dataset.baseHref = baseHref;
      link.href = `${baseHref}${window.location.search}${window.location.hash}`;
    });
  };

  const getScrollBehavior = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  // Clipboard helper shared by the "copy link to this view" and "cite" buttons.
  // Falls back to a hidden textarea + execCommand for older browsers.
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const helper = document.createElement("textarea");
        helper.value = text;
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        document.body.removeChild(helper);
        return true;
      } catch {
        return false;
      }
    }
  };

  const flashConfirmation = (button, tempLabel, originalLabel) => {
    button.textContent = tempLabel;
    button.classList.add("copied");
    window.clearTimeout(button._flashTimeout);
    button._flashTimeout = window.setTimeout(() => {
      button.textContent = originalLabel;
      button.classList.remove("copied");
    }, 1600);
  };

  // Fires a GoatCounter custom event if analytics is loaded; a silent no-op
  // otherwise (ad-blocker, offline, or the site code hasn't been set up
  // yet). Never lets analytics failure affect the actual feature.
  const trackEvent = (path) => {
    try {
      window.goatcounter?.count?.({ path, event: true });
    } catch {
      // analytics is enhancement, not a dependency — never throw here
    }
  };

  const sourceCountLabel = (value) => `${value} ${value === 1 ? "source" : "sources"}`;

  const renderDomains = () => {
    if (!categories.length) {
      domainNav.innerHTML = '<p class="empty-state">Domain filters are temporarily unavailable. You can still browse the full catalog below.</p>';
      return;
    }
    domainNav.innerHTML = categories.map((category) => {
      const sourceCount = catalog.filter((record) => record.category === category.key).length;
      return `
        <button class="domain-button" type="button" data-category="${escapeHtml(category.key)}" data-domain="${escapeHtml(category.id)}" aria-pressed="${state.category === category.key}">
          <span class="domain-icon">${category.icon}</span>
          <span class="domain-copy"><strong>${escapeHtml(category.label)}</strong><span>${escapeHtml(category.note)}</span></span>
          <span class="domain-count">${sourceCountLabel(sourceCount)}</span>
        </button>`;
    }).join("");
  };

  const getVisibleRecords = () => {
    const query = state.search.trim().toLocaleLowerCase();
    return catalog.filter((record) => {
      const searchText = [record.title, record.provider, record.category, record.coverage, record.description, record.temporalCoverage, record.spatialResolution, record.license, ...record.formats]
        .join(" ")
        .toLocaleLowerCase();
      return (!state.source || record.id === state.source)
        && (!state.category || record.category === state.category)
        && (!state.coverage || record.coverage === state.coverage)
        && (!state.access || record.access === state.access)
        && (!query || searchText.includes(query));
    });
  };

  const renderCatalog = () => {
    const records = getVisibleRecords();
    resultCount.textContent = `${records.length} ${records.length === 1 ? "source" : "sources"} found`;
    emptyState.hidden = records.length !== 0;
    grid.innerHTML = records.map((record) => {
      const detailItem = (icon, label, value) => `<li aria-label="${escapeHtml(`${label}: ${value}`)}"><span class="detail-icon" aria-hidden="true">${detailIcons[icon]}</span><span>${escapeHtml(value)}</span></li>`;
      const detailItems = [
        record.temporalCoverage ? detailItem("timeframe", "Timeframe", record.temporalCoverage) : "",
        record.spatialResolution ? detailItem("resolution", "Resolution", record.spatialResolution) : "",
        record.license ? detailItem("license", "License", record.license) : ""
      ].filter(Boolean).join("");
      return `
      <article class="dataset-card${state.source === record.id ? " is-discovery" : ""}" data-record-id="${escapeHtml(record.id)}" aria-labelledby="source-${escapeHtml(record.id)}-title"${state.source === record.id ? " tabindex=\"-1\"" : ""}>
        <div class="card-topline">
          <span class="category-label">${escapeHtml(categoryLabels[record.category] || record.category)}</span>
          <span class="source-kind">${escapeHtml(record.kind)}</span>
        </div>
        <h3 id="source-${escapeHtml(record.id)}-title">${escapeHtml(record.title)}</h3>
        <p class="provider">${escapeHtml(record.provider)}</p>
        <p class="description">${escapeHtml(record.description)}</p>
        ${detailItems ? `<ul class="dataset-details" aria-label="Additional dataset detail">${detailItems}</ul>` : ""}
        <ul class="metadata" aria-label="Dataset metadata">
          <li>${escapeHtml(record.coverage)}</li>
          <li>${escapeHtml(record.access)}</li>
          <li>Checked ${escapeHtml(record.checked)}</li>
        </ul>
        <div class="card-actions">
          <div class="card-links">
            <a class="dataset-link" href="${escapeHtml(record.url)}" target="_blank" rel="noopener noreferrer">Open at source <span class="sr-only">(opens in a new tab)</span></a>
            <a class="methodology-link" href="${escapeHtml(record.methodologyUrl || record.url)}" target="_blank" rel="noopener noreferrer">Documentation <span class="sr-only">${record.methodologyUrl ? "methodology" : "source page"}; opens in a new tab</span></a>
          </div>
          <button class="cite-button" type="button" data-cite-id="${escapeHtml(record.id)}">Cite</button>
          <button class="cite-button" type="button" data-report-id="${escapeHtml(record.id)}">Report link</button>
        </div>
      </article>`;
    }).join("");
  };

  const renderDiscovery = () => {
    if (!discoveryResult) return;
    const record = catalog.find((entry) => entry.id === state.source);
    discoveryResult.hidden = !record;
    if (!record) {
      discoveryResult.textContent = "";
      return;
    }
    const category = categories.find((entry) => entry.key === record.category);
    discoveryResult.textContent = `Showing ${record.title} — a verified source in ${category?.label || record.category} · ${record.coverage}.`;
  };

  const updateDiscoverControl = () => {
    if (!discoverButton) return;
    const hasRecords = catalog.length > 0;
    discoverButton.disabled = !hasRecords;
    discoverButton.setAttribute("aria-disabled", String(!hasRecords));
  };

  // One-time structured-data injection so search engines (Google Dataset
  // Search in particular) can index each entry as a Dataset. Runs once
  // against the full catalog, not the filtered view.
  const injectStructuredData = () => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "DataCatalog",
      "name": "AmazoniaDB",
      "description": "A lightweight directory of Amazon socioenvironmental datasets, indexed at their original sources.",
      "url": `${window.location.origin}${window.location.pathname}`,
      "inLanguage": "en",
      "dataset": catalog.map((record) => ({
        "@type": "Dataset",
        "name": record.title,
        "description": record.description,
        "url": record.url,
        "keywords": [record.category, record.coverage],
        "provider": { "@type": "Organization", "name": record.provider },
        ...(record.temporalCoverage ? { "temporalCoverage": record.temporalCoverage } : {}),
        ...(record.license ? { "license": record.license } : {}),
        "isAccessibleForFree": record.access === "Publicly available",
        "dateModified": record.checked,
        "distribution": record.formats.map((format) => ({ "@type": "DataDownload", "encodingFormat": format }))
      }))
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  };

  domainNav.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    state.category = state.category === button.dataset.category ? "" : button.dataset.category;
    state.source = "";
    trackEvent(`/filter-domain/${state.category || "all"}`);
    renderDomains();
    renderCatalog();
    renderDiscovery();
    updateDiscoverControl();
    syncUrl();
    document.getElementById("catalog").scrollIntoView({ behavior: getScrollBehavior(), block: "start" });
  });

  search.addEventListener("input", () => {
    state.search = search.value;
    state.source = "";
    renderCatalog();
    renderDiscovery();
    updateDiscoverControl();
    syncUrl();
  });

  coverage.addEventListener("change", () => {
    state.coverage = coverage.value;
    state.source = "";
    renderCatalog();
    renderDiscovery();
    updateDiscoverControl();
    syncUrl();
  });

  access.addEventListener("change", () => {
    state.access = access.value;
    state.source = "";
    renderCatalog();
    renderDiscovery();
    updateDiscoverControl();
    syncUrl();
  });

  filters.addEventListener("reset", () => {
    window.setTimeout(() => {
      state.search = "";
      state.coverage = "";
      state.access = "";
      state.category = "";
      state.source = "";
      renderDomains();
      renderCatalog();
      renderDiscovery();
      updateDiscoverControl();
      syncUrl();
    }, 0);
  });

  discoverButton?.addEventListener("click", () => {
    const otherRecords = catalog.filter((record) => record.id !== state.source);
    const records = otherRecords.length ? otherRecords : catalog;
    if (!records.length) return;
    const record = records[Math.floor(Math.random() * records.length)];
    state.category = "";
    state.search = "";
    state.coverage = "";
    state.access = "";
    state.source = record.id;
    search.value = "";
    coverage.value = "";
    access.value = "";
    renderDomains();
    renderCatalog();
    renderDiscovery();
    updateDiscoverControl();
    syncUrl();
    const card = grid.querySelector(`[data-record-id="${record.id}"]`);
    card?.scrollIntoView({ behavior: getScrollBehavior(), block: "center" });
    card?.focus({ preventScroll: true });
  });

  const copyLinkButton = document.getElementById("copy-view-link");
  copyLinkButton?.addEventListener("click", async () => {
    const original = copyLinkButton.textContent;
    const ok = await copyToClipboard(window.location.href);
    flashConfirmation(copyLinkButton, ok ? "Link copied" : "Couldn't copy", original);
  });

  grid.addEventListener("click", async (event) => {
    const citeButton = event.target.closest("button[data-cite-id]");
    if (citeButton) {
      const record = catalog.find((entry) => entry.id === citeButton.dataset.citeId);
      if (!record) return;
      const citation = `"${record.title}." ${record.provider}. Accessed ${record.checked}. ${record.url}`;
      const ok = await copyToClipboard(citation);
      trackEvent(`/cite/${record.id}`);
      flashConfirmation(citeButton, ok ? "Copied" : "Couldn't copy", "Cite");
      return;
    }

    const reportButton = event.target.closest("button[data-report-id]");
    if (reportButton) {
      const record = catalog.find((entry) => entry.id === reportButton.dataset.reportId);
      if (!record) return;
      trackEvent(`/report-link/${record.id}`);
      const subject = encodeURIComponent(`Dead link report: ${record.title}`);
      const body = encodeURIComponent(`Entry: ${record.id}\nURL: ${record.url}\n\nWhat happened when you visited it? (error message, blank page, wrong content, etc.)\n\n`);
      window.location.href = `mailto:marcelogpcamargo@gmail.com?subject=${subject}&body=${body}`;
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
    const active = document.activeElement;
    const isTyping = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable);
    if (isTyping) return;
    event.preventDefault();
    search.focus();
  });

  renderDomains();
  renderCatalog();
  renderDiscovery();
  updateDiscoverControl();
  syncUrl();
  injectStructuredData();
})();
