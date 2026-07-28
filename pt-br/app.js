(() => {
  const catalog = window.AMAZONIA_CATALOG || [];
  const i18n = (window.AMAZONIA_CATALOG_I18N && window.AMAZONIA_CATALOG_I18N["pt-BR"]) || { descriptions: {}, spatialResolution: {} };
  const spatialResolutionLabels = i18n.spatialResolution || {};

  // Precomputed once per record, not per keystroke — see app.js for why.
  // Uses the same translated text shown on the card (description, spatial
  // resolution) so a search matches what's actually visible here, not just
  // the underlying English source values. methodologyUrl is left out on
  // purpose — it's a URL, not text anyone searches for.
  catalog.forEach((record) => {
    record._searchBlob = [
      record.title, record.provider, record.category, record.coverage,
      i18n.descriptions[record.id] || record.description,
      record.temporalCoverage,
      spatialResolutionLabels[record.spatialResolution] || record.spatialResolution,
      record.license, ...record.formats
    ].filter(Boolean).join(" ").toLocaleLowerCase();
  });

  // `key` matches record.category/coverage/access/kind exactly as stored in
  // ../data/catalog.js (the canonical English values required by
  // data/catalog.schema.json) — only `label`/`note` are shown to the user.
  const categories = [
    { key: "Forest & biodiversity", label: "Floresta e biodiversidade", note: "Espécies, habitats, condição da floresta" },
    { key: "Earth, water & climate", label: "Terra, água e clima", note: "Clima, rios, rochas, extremos" },
    { key: "Land use & infrastructure", label: "Uso da terra e infraestrutura", note: "Mudanças, monitoramento, acesso" },
    { key: "Peoples, territories & culture", label: "Povos, territórios e cultura", note: "Comunidades, terras, saberes" },
    { key: "Society, health & livelihoods", label: "Sociedade, saúde e meios de vida", note: "Bem-estar e economias locais" },
    { key: "Governance, rights & safeguards", label: "Governança, direitos e salvaguardas", note: "Proteção, política, responsabilização" }
  ];
  const categoryLabels = Object.fromEntries(categories.map((c) => [c.key, c.label]));
  const coverageLabels = { "Pan-Amazon": "Pan-Amazônia", "Brazil": "Brasil", "Peru": "Peru", "Colombia": "Colômbia", "Bolivia": "Bolívia", "Ecuador": "Equador", "Global — subsettable": "Global — recortável" };
  const accessLabels = {
    "Provider terms apply": "Sujeito aos termos do provedor",
    "Dataset-specific license": "Licença específica do conjunto de dados",
    "Publicly available": "Disponível publicamente"
  };
  const kindLabels = { "Dataset": "Conjunto de dados", "Data portal": "Portal de dados", "Download": "Download", "Explorer": "Explorador" };
  const detailLabels = { timeframe: "Cobre", resolution: "Resolução", license: "Licença", methodology: "Metodologia" };

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

  const buildBibtex = (record) => `@misc{${record.id},
  title        = {${escapeBibtex(record.title)}},
  author       = {${escapeBibtex(record.provider)}},
  howpublished = {\\url{${record.url}}},
  year         = {${record.checked.slice(0, 4)}},
  note         = {Acessado via AmazoniaDB em ${record.checked}}
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
    const allButton = `<button class="domain-button" type="button" data-category="" aria-pressed="${state.category === ""}"><strong>Todas as fontes</strong><span>Ver todos os links selecionados</span></button>`;
    const buttons = categories.map((category) => `
      <button class="domain-button" type="button" data-category="${escapeHtml(category.key)}" aria-pressed="${state.category === category.key}">
        <strong>${escapeHtml(category.label)}</strong>
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
      label: category.label,
      count: catalog.filter((record) => record.category === category.key).length
    }));
    const minCount = Math.min(...counts.map((entry) => entry.count));
    const thinnest = counts.filter((entry) => entry.count === minCount);
    gapEl.innerHTML = thinnest.length === counts.length
      ? `Todos os domínios têm ${minCount} ${minCount === 1 ? "fonte" : "fontes"} até agora — <a href="submit.html">ajude um deles a crescer →</a>`
      : `${escapeHtml(thinnest[0].label)} tem o menor número de fontes (${thinnest[0].count}) — conhece uma? <a href="submit.html">Propor uma fonte →</a>`;
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
    resultCount.textContent = `${records.length} ${records.length === 1 ? "fonte encontrada" : "fontes encontradas"}`;
    emptyState.hidden = records.length !== 0;
    if (records.length === 0) {
      // Colombia/Bolivia are real filter options with zero matching records
      // right now. Rather than a generic "no matches" for what's actually a
      // known catalog gap, name it and point at the same submit flow the
      // category gap-prompt above already uses.
      const coverageTotal = state.coverage ? catalog.filter((record) => record.coverage === state.coverage).length : null;
      emptyState.innerHTML = coverageTotal === 0
        ? `Ainda não há fontes para ${escapeHtml(coverageLabels[state.coverage] || state.coverage)} — conhece uma? <a href="submit.html">Propor uma fonte →</a>`
        : emptyStateDefaultHtml;
    }
    grid.innerHTML = records.map((record) => {
      const detailItems = [
        record.temporalCoverage ? `<li><strong>${detailLabels.timeframe}:</strong> ${escapeHtml(record.temporalCoverage)}</li>` : "",
        record.spatialResolution ? `<li><strong>${detailLabels.resolution}:</strong> ${escapeHtml(spatialResolutionLabels[record.spatialResolution] || record.spatialResolution)}</li>` : "",
        record.license ? `<li><strong>${detailLabels.license}:</strong> ${escapeHtml(record.license)}</li>` : ""
      ].filter(Boolean).join("");
      return `
      <article class="dataset-card">
        <div class="card-topline">
          <span class="category-label">${escapeHtml(categoryLabels[record.category] || record.category)}</span>
          <span class="source-kind">${escapeHtml(kindLabels[record.kind] || record.kind)}</span>
        </div>
        <h3>${escapeHtml(record.title)}</h3>
        <p class="provider">${escapeHtml(record.provider)}</p>
        <p class="description">${escapeHtml(i18n.descriptions[record.id] || record.description)}</p>
        ${detailItems ? `<ul class="dataset-details" aria-label="Detalhe adicional do conjunto de dados">${detailItems}</ul>` : ""}
        <ul class="metadata" aria-label="Metadados do conjunto de dados">
          <li>${escapeHtml(coverageLabels[record.coverage] || record.coverage)}</li>
          <li>${escapeHtml(accessLabels[record.access] || record.access)}</li>
          <li>Verificado em ${escapeHtml(record.checked)}</li>
          <li>${record.submittedBy
            ? `Enviado pela comunidade, validado pelo schema — <a href="https://github.com/${escapeHtml(record.submittedBy)}" target="_blank" rel="noopener noreferrer">@${escapeHtml(record.submittedBy)}</a>`
            : "Revisão editorial"}</li>
        </ul>
        <div class="card-actions">
          <div class="card-links">
            <a class="dataset-link" href="${escapeHtml(record.url)}" target="_blank" rel="noopener noreferrer">Abrir na fonte <span class="sr-only">(abre em nova aba)</span></a>
            ${record.methodologyUrl ? `<a class="methodology-link" href="${escapeHtml(record.methodologyUrl)}" target="_blank" rel="noopener noreferrer">${detailLabels.methodology} <span class="sr-only">(abre em nova aba)</span></a>` : ""}
          </div>
          <div class="citation-actions">
            <button class="cite-button" type="button" data-cite-id="${escapeHtml(record.id)}">Citar</button>
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
      "description": "Um diretório enxuto de conjuntos de dados socioambientais da Amazônia, indexados em suas fontes originais.",
      "url": `${window.location.origin}${window.location.pathname}`,
      "inLanguage": "pt-BR",
      "dataset": catalog.map((record) => ({
        "@type": "Dataset",
        "name": record.title,
        "description": i18n.descriptions[record.id] || record.description,
        "url": record.url,
        "keywords": [categoryLabels[record.category] || record.category, coverageLabels[record.coverage] || record.coverage],
        "provider": { "@type": "Organization", "name": record.provider },
        "license": record.license || accessLabels[record.access] || record.access,
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
    flashConfirmation(copyLinkButton, ok ? "Link copiado" : "Não foi possível copiar", original);
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
        flashConfirmation(bibtexButton, ok ? "Copiado" : "Não foi possível copiar", "BibTeX");
      }
      return;
    }
    const citeButton = event.target.closest("button[data-cite-id]");
    if (!citeButton) return;
    const record = catalog.find((entry) => entry.id === citeButton.dataset.citeId);
    if (!record) return;
    const citation = `"${record.title}." ${record.provider}. Acessado em ${record.checked}. ${record.url}`;
    const ok = await copyToClipboard(citation);
    flashConfirmation(citeButton, ok ? "Copiado" : "Não foi possível copiar", "Citar");
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
