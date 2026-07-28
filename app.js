(() => {
  const catalog = window.AMAZONIA_CATALOG || [];

  // Precomputed once per record, not per keystroke, so filtering stays cheap
  // as the catalog grows toward the "thousands of sources" this is designed
  // for. Includes the optional enrichment fields (temporal coverage, spatial
  // resolution, license) so a search for something like "Landsat" or "CC-BY"
  // matches text that's now actually visible on the card, not just the
  // always-present required fields. methodologyUrl is left out on purpose —
  // it's a URL, not text anyone searches for, and including it risked noisy
  // matches on unrelated URL fragments.
  catalog.forEach((record) => {
    record._searchBlob = [
      record.title, record.provider, record.category, record.coverage,
      record.description, record.temporalCoverage, record.spatialResolution,
      record.license, ...record.formats
    ].filter(Boolean).join(" ").toLocaleLowerCase();
  });

  const categories = [
    { name: "Forest & biodiversity", note: "Species, habitats, forest condition" },
    { name: "Earth, water & climate", note: "Weather, rivers, bedrock, extremes" },
    { name: "Land use & infrastructure", note: "Change, monitoring, access" },
    { name: "Peoples, territories & culture", note: "Communities, lands, knowledge" },
    { name: "Society, health & livelihoods", note: "Wellbeing and local economies" },
    { name: "Governance, rights & safeguards", note: "Protection, policy, accountability" }
  ];

  const state = { category: "", search: "", coverage: "", access: "" };
  const domainNav = document.getElementById("domain-nav");
  const grid = document.getElementById("dataset-grid");
  const emptyState = document.getElementById("empty-state");
  const emptyStateDefaultHtml = emptyState.innerHTML;
  const resultCount = document.getElementById("result-count");
  const count = document.getElementById("dataset-count");
  const search = document.getElementById("search");
  const coverage = document.getElementById("coverage");
  const access = document.getElementById("access");
  const filters = document.getElementById("filters");

  count.textContent = String(catalog.length);

  // Restore filter state from the URL (?category=&q=&coverage=&access=) so a
  // filtered view can be bookmarked or shared as a link.
  const initialParams = new URLSearchParams(window.location.search);
  state.category = initialParams.get("category") || "";
  state.search = initialParams.get("q") || "";
  state.coverage = initialParams.get("coverage") || "";
  state.access = initialParams.get("access") || "";
  search.value = state.search;
  coverage.value = state.coverage;
  access.value = state.access;

  const syncUrl = () => {
    const params = new URLSearchParams();
    if (state.category) params.set("category", state.category);
    if (state.search) params.set("q", state.search);
    if (state.coverage) params.set("coverage", state.coverage);
    if (state.access) params.set("access", state.access);
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash);
  };

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  // Coalesces rapid keystrokes into a single re-render instead of one per
  // character typed.
  const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => fn(...args), delay);
    };
  };

  const escapeBibtex = (value) => String(value)
    .replaceAll("\\", "\\textbackslash{}")
    .replaceAll("{", "\\{")
    .replaceAll("}", "\\}")
    .replaceAll("&", "\\&")
    .replaceAll("%", "\\%")
    .replaceAll("$", "\\$")
    .replaceAll("#", "\\#")
    .replaceAll("_", "\\_")
    .replaceAll("~", "\\textasciitilde{}")
    .replaceAll("^", "\\textasciicircum{}");

  // record.url goes inside \url{...} unescaped on purpose — that command
  // (from the url/hyperref packages almost everyone's BibTeX setup already
  // has) reads its argument close to verbatim, so escaping it would corrupt
  // the link instead of protecting it.
  const buildBibtex = (record) => `@misc{${record.id},
  title        = {${escapeBibtex(record.title)}},
  author       = {${escapeBibtex(record.provider)}},
  howpublished = {\\url{${record.url}}},
  year         = {${record.checked.slice(0, 4)}},
  note         = {Accessed via AmazoniaDB, ${record.checked}}
}`;

  const downloadFile = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const toCsvValue = (value) => {
    const str = Array.isArray(value) ? value.join("; ") : String(value ?? "");
    const escaped = str.replaceAll('"', '""');
    return /[",\n]/.test(str) ? `"${escaped}"` : escaped;
  };

  const CSV_COLUMNS = ["id", "title", "provider", "category", "coverage", "formats", "access", "kind", "description", "url", "checked", "temporalCoverage", "spatialResolution", "license", "methodologyUrl", "submittedBy"];

  const catalogToCsv = () => {
    const rows = catalog.map((record) => CSV_COLUMNS.map((column) => toCsvValue(record[column])).join(","));
    return [CSV_COLUMNS.join(","), ...rows].join("\n");
  };

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

  const renderDomains = () => {
    const allButton = `<button class="domain-button" type="button" data-category="" aria-pressed="${state.category === ""}"><strong>All sources</strong><span>See every curated link</span></button>`;
    const buttons = categories.map((category) => `
      <button class="domain-button" type="button" data-category="${escapeHtml(category.name)}" aria-pressed="${state.category === category.name}">
        <strong>${escapeHtml(category.name)}</strong>
        <span>${escapeHtml(category.note)}</span>
      </button>`).join("");
    domainNav.innerHTML = allButton + buttons;
  };

  // Highlights whichever domain has the fewest catalog entries, as a nudge
  // toward community submissions. Reflects the whole catalog, not the current
  // filter, so it does not need to re-render on filter change.
  const renderGapPrompt = () => {
    const gapEl = document.getElementById("domain-gap");
    if (!gapEl) return;
    const counts = categories.map((category) => ({
      name: category.name,
      count: catalog.filter((record) => record.category === category.name).length
    }));
    const minCount = Math.min(...counts.map((entry) => entry.count));
    const thinnest = counts.filter((entry) => entry.count === minCount);
    gapEl.innerHTML = thinnest.length === counts.length
      ? `Every domain has ${minCount} ${minCount === 1 ? "source" : "sources"} so far — <a href="submit.html">help one grow →</a>`
      : `${escapeHtml(thinnest[0].name)} has the fewest sources (${thinnest[0].count}) — know one? <a href="submit.html">Propose a source →</a>`;
  };

  const getVisibleRecords = () => {
    const query = state.search.trim().toLocaleLowerCase();
    return catalog.filter((record) => (!state.category || record.category === state.category)
      && (!state.coverage || record.coverage === state.coverage)
      && (!state.access || record.access === state.access)
      && (!query || record._searchBlob.includes(query)));
  };

  const renderCatalog = () => {
    const records = getVisibleRecords();
    resultCount.textContent = `${records.length} ${records.length === 1 ? "source" : "sources"} found`;
    emptyState.hidden = records.length !== 0;
    if (records.length === 0) {
      // Colombia/Bolivia are real filter options with zero matching records
      // right now. Rather than a generic "no matches" for what's actually a
      // known catalog gap, name it and point at the same submit flow the
      // category gap-prompt above already uses.
      const coverageTotal = state.coverage ? catalog.filter((record) => record.coverage === state.coverage).length : null;
      emptyState.innerHTML = coverageTotal === 0
        ? `${escapeHtml(state.coverage)} isn't covered yet — know a source? <a href="submit.html">Propose one →</a>`
        : emptyStateDefaultHtml;
    }
    grid.innerHTML = records.map((record) => {
      const detailItems = [
        record.temporalCoverage ? `<li><strong>Timeframe:</strong> ${escapeHtml(record.temporalCoverage)}</li>` : "",
        record.spatialResolution ? `<li><strong>Resolution:</strong> ${escapeHtml(record.spatialResolution)}</li>` : "",
        record.license ? `<li><strong>License:</strong> ${escapeHtml(record.license)}</li>` : ""
      ].filter(Boolean).join("");
      return `
      <article class="dataset-card">
        <div class="card-topline">
          <span class="category-label">${escapeHtml(record.category)}</span>
          <span class="source-kind">${escapeHtml(record.kind)}</span>
        </div>
        <h3>${escapeHtml(record.title)}</h3>
        <p class="provider">${escapeHtml(record.provider)}</p>
        <p class="description">${escapeHtml(record.description)}</p>
        ${detailItems ? `<ul class="dataset-details" aria-label="Additional dataset detail">${detailItems}</ul>` : ""}
        <ul class="metadata" aria-label="Dataset metadata">
          <li>${escapeHtml(record.coverage)}</li>
          <li>${escapeHtml(record.access)}</li>
          <li>Checked ${escapeHtml(record.checked)}</li>
          <li>${record.submittedBy
            ? `Community-submitted, schema-valid — <a href="https://github.com/${escapeHtml(record.submittedBy)}" target="_blank" rel="noopener noreferrer">@${escapeHtml(record.submittedBy)}</a>`
            : "Editorially reviewed"}</li>
        </ul>
        <div class="card-actions">
          <div class="card-links">
            <a class="dataset-link" href="${escapeHtml(record.url)}" target="_blank" rel="noopener noreferrer">Open at source <span class="sr-only">(opens in a new tab)</span></a>
            ${record.methodologyUrl ? `<a class="methodology-link" href="${escapeHtml(record.methodologyUrl)}" target="_blank" rel="noopener noreferrer">Methodology <span class="sr-only">(opens in a new tab)</span></a>` : ""}
          </div>
          <div class="citation-actions">
            <button class="cite-button" type="button" data-cite-id="${escapeHtml(record.id)}">Cite</button>
            <button class="bibtex-button" type="button" data-bibtex-id="${escapeHtml(record.id)}">BibTeX</button>
          </div>
        </div>
      </article>`;
    }).join("");
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
        "license": record.license || record.access,
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
    state.category = button.dataset.category;
    renderDomains();
    renderCatalog();
    syncUrl();
    document.getElementById("catalog").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const applySearch = debounce(() => {
    state.search = search.value;
    renderCatalog();
    syncUrl();
  }, 150);
  search.addEventListener("input", applySearch);

  coverage.addEventListener("change", () => {
    state.coverage = coverage.value;
    renderCatalog();
    syncUrl();
  });

  access.addEventListener("change", () => {
    state.access = access.value;
    renderCatalog();
    syncUrl();
  });

  filters.addEventListener("reset", () => {
    window.setTimeout(() => {
      state.search = "";
      state.coverage = "";
      state.access = "";
      renderCatalog();
      syncUrl();
    }, 0);
  });

  const copyLinkButton = document.getElementById("copy-view-link");
  copyLinkButton?.addEventListener("click", async () => {
    const original = copyLinkButton.textContent;
    const ok = await copyToClipboard(window.location.href);
    flashConfirmation(copyLinkButton, ok ? "Link copied" : "Couldn't copy", original);
  });

  document.getElementById("export-json")?.addEventListener("click", () => {
    downloadFile("amazoniadb-catalog.json", JSON.stringify(catalog, null, 2), "application/json");
  });

  document.getElementById("export-csv")?.addEventListener("click", () => {
    downloadFile("amazoniadb-catalog.csv", catalogToCsv(), "text/csv;charset=utf-8");
  });

  grid.addEventListener("click", async (event) => {
    const bibtexButton = event.target.closest("button[data-bibtex-id]");
    if (bibtexButton) {
      const record = catalog.find((entry) => entry.id === bibtexButton.dataset.bibtexId);
      if (record) {
        const ok = await copyToClipboard(buildBibtex(record));
        flashConfirmation(bibtexButton, ok ? "Copied" : "Couldn't copy", "BibTeX");
      }
      return;
    }
    const citeButton = event.target.closest("button[data-cite-id]");
    if (!citeButton) return;
    const record = catalog.find((entry) => entry.id === citeButton.dataset.citeId);
    if (!record) return;
    const citation = `"${record.title}." ${record.provider}. Accessed ${record.checked}. ${record.url}`;
    const ok = await copyToClipboard(citation);
    flashConfirmation(citeButton, ok ? "Copied" : "Couldn't copy", "Cite");
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
  renderGapPrompt();
  injectStructuredData();
})();
