(() => {
  const catalog = window.AMAZONIA_CATALOG || [];
  const locale = "es";
  const i18n = (window.AMAZONIA_CATALOG_I18N && window.AMAZONIA_CATALOG_I18N["es"]) || { descriptions: {}, spatialResolution: {}, temporalCoverage: {}, licenses: {} };
  const spatialResolutionLabels = i18n.spatialResolution || {};
  const temporalCoverageLabels = i18n.temporalCoverage || {};
  const licenseLabels = i18n.licenses || {};

  // `key` matches record.category/coverage/access/kind exactly as stored in
  // ../data/catalog.js (the canonical English values required by
  // data/catalog.schema.json) — only `label`/`note` are shown to the user.
  const presentation = window.AMAZONIA_CATEGORY_PRESENTATION || {};
  const categories = Object.entries(presentation).map(([key, item]) => ({
    key,
    ...item,
    ...(item.locales.es || item.locales.en || {})
  }));
  const categoryLabels = Object.fromEntries(categories.map((c) => [c.key, c.label]));
  const coverageLabels = { "Pan-Amazon": "Panamazonía", "Brazil": "Brasil", "Peru": "Perú", "Colombia": "Colombia", "Bolivia": "Bolivia", "Ecuador": "Ecuador", "Global — subsettable": "Global — recortable" };
  const accessLabels = {
    "Provider terms apply": "Sujeto a los términos del proveedor",
    "Dataset-specific license": "Licencia específica del conjunto de datos",
    "Publicly available": "Disponible públicamente"
  };
  const kindLabels = { "Dataset": "Conjunto de datos", "Data portal": "Portal de datos", "Download": "Descarga", "Explorer": "Explorador" };
  const detailLabels = { timeframe: "Período", resolution: "Resolución", license: "Licencia", methodology: "Documentación" };
  const tagPresentation = window.AMAZONIA_TAG_PRESENTATION || { facets: {}, vocabulary: {} };
  const tagVocabulary = tagPresentation.vocabulary || {};
  const topicVocabulary = tagVocabulary.topics || {};
  const topicLabels = Object.fromEntries(Object.entries(topicVocabulary).map(([key, copy]) => [key, copy[locale] || copy.en || key]));
  const researchPaths = window.AMAZONIA_RESEARCH_PATHS || [];
  const localized = (copy) => typeof copy === "string" ? copy : copy?.[locale] || copy?.en || "";
  const researchLabels = {
    heading: "Ruta de investigación",
    topics: "Temas",
    filterTopic: "Filtrar por tema: ",
    clearPath: "Volver al directorio completo"
  };
  const detailIcons = Object.freeze({
    timeframe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>',
    resolution: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5h14v14H5zM12 5v14M5 12h14"/></svg>',
    license: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5M10 14l2 2 4-4"/></svg>'
  });

  const state = { category: "", search: "", coverage: "", topic: "", access: "", source: "", path: "" };
  const domainNav = document.getElementById("domain-nav");
  const grid = document.getElementById("dataset-grid");
  const emptyState = document.getElementById("empty-state");
  const resultCount = document.getElementById("result-count");
  const count = document.getElementById("dataset-count");
  const search = document.getElementById("search");
  const coverage = document.getElementById("coverage");
  const topic = document.getElementById("topic");
  const access = document.getElementById("access");
  const filters = document.getElementById("filters");
  const discoverButton = document.getElementById("discover-source");
  const discoveryResult = document.getElementById("discovery-result");
  const researchPathPanel = document.getElementById("research-path-panel");
  const researchPathButton = document.getElementById("open-research-path");

  count.textContent = String(catalog.length);

  // Restore filter state from the URL (?category=&q=&coverage=&access=) so a
  // filtered view can be bookmarked or shared as a link.
  const initialParams = new URLSearchParams(window.location.search);
  // Los valores de filtro provienen del vocabulario controlado de la
  // interfaz, no solo del catálogo actual. Así una vista vacía válida (por
  // ejemplo, Colombia antes de tener una entrada) sigue siendo compartible.
  const valuesFromSelect = (select) => new Set(Array.from(select.options, ({ value }) => value).filter(Boolean));
  const topicValues = Object.keys(topicVocabulary);
  if (topic) {
    const defaultOption = topic.dataset.defaultOption || "Todos los temas";
    topic.innerHTML = [`<option value="">${defaultOption}</option>`, ...topicValues.map((value) => `<option value="${value}">${topicLabels[value]}</option>`)].join("");
    if (Array.isArray(topic.options)) topic.options = ["", ...topicValues].map((value) => ({ value }));
  }
  const validCategories = new Set(categories.map((category) => category.key));
  const validCoverage = valuesFromSelect(coverage);
  const validTopics = new Set(topicValues);
  const validAccess = valuesFromSelect(access);
  const pathsById = new Map(researchPaths.map((path) => [path.id, path]));
  const validParam = (value, allowed) => allowed.has(value) ? value : "";
  state.category = validParam(initialParams.get("category") || "", validCategories);
  state.search = initialParams.get("q") || "";
  state.coverage = validParam(initialParams.get("coverage") || "", validCoverage);
  state.topic = validParam(initialParams.get("topic") || "", validTopics);
  state.access = validParam(initialParams.get("access") || "", validAccess);
  state.source = initialParams.get("source") || "";
  state.path = pathsById.has(initialParams.get("path")) ? initialParams.get("path") : "";
  if (state.source && !catalog.some((record) => record.id === state.source)) state.source = "";
  if (state.source) {
    state.category = "";
    state.search = "";
    state.coverage = "";
    state.topic = "";
    state.access = "";
    state.path = "";
  } else if (state.path) {
    state.category = "";
    state.search = "";
    state.coverage = "";
    state.topic = "";
    state.access = "";
  }
  search.value = state.search;
  coverage.value = state.coverage;
  if (topic) topic.value = state.topic;
  access.value = state.access;

  const syncUrl = () => {
    const params = new URLSearchParams();
    if (state.category) params.set("category", state.category);
    if (state.search) params.set("q", state.search);
    if (state.coverage) params.set("coverage", state.coverage);
    if (state.topic) params.set("topic", state.topic);
    if (state.access) params.set("access", state.access);
    if (state.source) params.set("source", state.source);
    if (state.path) params.set("path", state.path);
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

  const sourceCountLabel = (value) => `${value} ${value === 1 ? "fuente" : "fuentes"}`;

  const getActivePath = () => pathsById.get(state.path) || null;
  const tagLabel = (facet, value) => tagVocabulary[facet]?.[value]?.[locale] || tagVocabulary[facet]?.[value]?.en || value;

  const renderDomains = () => {
    if (!categories.length) {
      domainNav.innerHTML = '<p class="empty-state">Los filtros por dominio no están disponibles temporalmente. Aun así puedes explorar el catálogo completo abajo.</p>';
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
    const activePath = getActivePath();
    const records = catalog.filter((record) => {
      const tagTerms = Object.entries(record.tags || {}).flatMap(([facet, values]) => Array.isArray(values) ? values.flatMap((value) => [value, tagLabel(facet, value)]) : []);
      const searchText = [record.title, record.provider, record.category, record.coverage, record.description, i18n.descriptions[record.id], record.temporalCoverage, temporalCoverageLabels[record.id], record.spatialResolution, spatialResolutionLabels[record.spatialResolution], record.license, licenseLabels[record.id], ...record.formats, ...tagTerms]
        .join(" ")
        .toLocaleLowerCase();
      return (!state.source || record.id === state.source)
        && (!activePath || activePath.records.some((entry) => entry.id === record.id))
        && (!state.category || record.category === state.category)
        && (!state.coverage || record.coverage === state.coverage)
        && (!state.topic || record.tags?.topics?.includes(state.topic))
        && (!state.access || record.access === state.access)
        && (!query || searchText.includes(query));
    });
    if (!activePath) return records;
    const order = new Map(activePath.records.map((entry, index) => [entry.id, index]));
    return records.sort((a, b) => order.get(a.id) - order.get(b.id));
  };

  const renderCatalog = () => {
    const records = getVisibleRecords();
    resultCount.textContent = `${records.length} ${records.length === 1 ? "fuente encontrada" : "fuentes encontradas"}`;
    emptyState.hidden = records.length !== 0;
    const activePath = getActivePath();
    grid.innerHTML = records.map((record) => {
      const detailItem = (icon, label, value) => `<li aria-label="${escapeHtml(`${label}: ${value}`)}"><span class="detail-icon" aria-hidden="true">${detailIcons[icon]}</span><span>${escapeHtml(value)}</span></li>`;
      const detailItems = [
        record.temporalCoverage ? detailItem("timeframe", detailLabels.timeframe, temporalCoverageLabels[record.id] || record.temporalCoverage) : "",
        record.spatialResolution ? detailItem("resolution", detailLabels.resolution, spatialResolutionLabels[record.spatialResolution] || record.spatialResolution) : "",
        record.license ? detailItem("license", detailLabels.license, licenseLabels[record.id] || record.license) : ""
      ].filter(Boolean).join("");
      const pathEntry = activePath?.records.find((entry) => entry.id === record.id);
      const pathReason = pathEntry ? `<div class="path-role"><strong>${escapeHtml(localized(pathEntry.role))}</strong><span>${escapeHtml(localized(pathEntry.reason))}</span></div>` : "";
      const topics = (record.tags?.topics || []).slice(0, 2);
      const topicTags = topics.length ? `<div class="topic-tags" aria-label="${escapeHtml(researchLabels.topics)}">${topics.map((value) => `<button class="topic-tag" type="button" data-topic="${escapeHtml(value)}" aria-label="${escapeHtml(`${researchLabels.filterTopic}${topicLabels[value] || value}`)}">${escapeHtml(topicLabels[value] || value)}</button>`).join("")}</div>` : "";
      return `
      <article class="dataset-card${state.source === record.id ? " is-discovery" : ""}" data-record-id="${escapeHtml(record.id)}" aria-labelledby="source-${escapeHtml(record.id)}-title"${state.source === record.id ? " tabindex=\"-1\"" : ""}>
        <div class="card-topline">
          <span class="category-label">${escapeHtml(categoryLabels[record.category] || record.category)}</span>
          <span class="source-kind">${escapeHtml(kindLabels[record.kind] || record.kind)}</span>
        </div>
        <h3 id="source-${escapeHtml(record.id)}-title">${escapeHtml(record.title)}</h3>
        <p class="provider">${escapeHtml(record.provider)}</p>
        <p class="description">${escapeHtml(i18n.descriptions[record.id] || record.description)}</p>
        ${pathReason}
        ${topicTags}
        ${detailItems ? `<ul class="dataset-details" aria-label="Detalle adicional del conjunto de datos">${detailItems}</ul>` : ""}
        <ul class="metadata" aria-label="Metadatos del conjunto de datos">
          <li>${escapeHtml(coverageLabels[record.coverage] || record.coverage)}</li>
          <li>${escapeHtml(accessLabels[record.access] || record.access)}</li>
          <li>Verificado el ${escapeHtml(record.checked)}</li>
        </ul>
        <div class="card-actions">
          <div class="card-links">
            <a class="dataset-link" href="${escapeHtml(record.url)}" target="_blank" rel="noopener noreferrer">Abrir en la fuente <span class="sr-only">(se abre en una pestaña nueva)</span></a>
            <a class="methodology-link" href="${escapeHtml(record.methodologyUrl || record.url)}" target="_blank" rel="noopener noreferrer">${detailLabels.methodology} <span class="sr-only">${record.methodologyUrl ? "metodología" : "página de la fuente"}; se abre en una pestaña nueva</span></a>
          </div>
          <button class="cite-button" type="button" data-cite-id="${escapeHtml(record.id)}">Citar</button>
          <button class="cite-button" type="button" data-report-id="${escapeHtml(record.id)}">Reportar enlace</button>
        </div>
      </article>`;
    }).join("");
  };

  const renderResearchPath = () => {
    if (!researchPathPanel) return;
    const activePath = getActivePath();
    researchPathPanel.hidden = !activePath;
    if (!activePath) {
      researchPathPanel.innerHTML = "";
      return;
    }
    const copy = activePath.locales || {};
    researchPathPanel.setAttribute("aria-label", researchLabels.heading);
    researchPathPanel.innerHTML = `
      <div>
        <p class="eyebrow">${escapeHtml(researchLabels.heading)}</p>
        <h3>${escapeHtml(localized(copy.title))}</h3>
        <p>${escapeHtml(localized(copy.summary))}</p>
        <p class="research-caution">${escapeHtml(localized(copy.caution))}</p>
      </div>
      <button class="text-button" type="button" data-clear-path>${escapeHtml(researchLabels.clearPath)}</button>`;
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
    discoveryResult.textContent = `Mostrando ${record.title} — una fuente verificada en ${category?.label || record.category} · ${coverageLabels[record.coverage] || record.coverage}.`;
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
      "description": "Un directorio ligero de conjuntos de datos socioambientales de la Amazonía, indexados en sus fuentes originales.",
      "url": `${window.location.origin}${window.location.pathname}`,
      "inLanguage": "es",
      "dataset": catalog.map((record) => ({
        "@type": "Dataset",
        "name": record.title,
        "description": i18n.descriptions[record.id] || record.description,
        "url": record.url,
        "keywords": [categoryLabels[record.category] || record.category, coverageLabels[record.coverage] || record.coverage, ...(record.tags?.topics || []).map((value) => topicLabels[value] || value)],
        "provider": { "@type": "Organization", "name": record.provider },
        ...(record.temporalCoverage ? { "temporalCoverage": temporalCoverageLabels[record.id] || record.temporalCoverage } : {}),
        ...(record.license ? { "license": licenseLabels[record.id] || record.license } : {}),
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
    state.path = "";
    trackEvent(`/filter-domain/${state.category || "all"}`);
    renderDomains();
    renderCatalog();
    renderResearchPath();
    renderDiscovery();
    updateDiscoverControl();
    syncUrl();
    document.getElementById("catalog").scrollIntoView({ behavior: getScrollBehavior(), block: "start" });
  });

  search.addEventListener("input", () => {
    state.search = search.value;
    state.source = "";
    state.path = "";
    renderCatalog();
    renderResearchPath();
    renderDiscovery();
    updateDiscoverControl();
    syncUrl();
  });

  coverage.addEventListener("change", () => {
    state.coverage = coverage.value;
    state.source = "";
    state.path = "";
    renderCatalog();
    renderResearchPath();
    renderDiscovery();
    updateDiscoverControl();
    syncUrl();
  });

  topic?.addEventListener("change", () => {
    state.topic = topic.value;
    state.source = "";
    state.path = "";
    renderCatalog();
    renderResearchPath();
    renderDiscovery();
    updateDiscoverControl();
    syncUrl();
  });

  access.addEventListener("change", () => {
    state.access = access.value;
    state.source = "";
    state.path = "";
    renderCatalog();
    renderResearchPath();
    renderDiscovery();
    updateDiscoverControl();
    syncUrl();
  });

  filters.addEventListener("reset", () => {
    window.setTimeout(() => {
      state.search = "";
      state.coverage = "";
      state.topic = "";
      state.access = "";
      state.category = "";
      state.source = "";
      state.path = "";
      if (topic) topic.value = "";
      renderDomains();
      renderCatalog();
      renderResearchPath();
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
    state.topic = "";
    state.access = "";
    state.source = record.id;
    state.path = "";
    search.value = "";
    coverage.value = "";
    if (topic) topic.value = "";
    access.value = "";
    renderDomains();
    renderCatalog();
    renderResearchPath();
    renderDiscovery();
    updateDiscoverControl();
    syncUrl();
    const card = grid.querySelector(`[data-record-id="${record.id}"]`);
    card?.scrollIntoView({ behavior: getScrollBehavior(), block: "center" });
    card?.focus({ preventScroll: true });
  });

  const openResearchPath = (pathId) => {
    if (!pathsById.has(pathId)) return;
    state.category = "";
    state.search = "";
    state.coverage = "";
    state.topic = "";
    state.access = "";
    state.source = "";
    state.path = pathId;
    search.value = "";
    coverage.value = "";
    if (topic) topic.value = "";
    access.value = "";
    renderDomains();
    renderCatalog();
    renderResearchPath();
    renderDiscovery();
    updateDiscoverControl();
    syncUrl();
    document.getElementById("catalog").scrollIntoView({ behavior: getScrollBehavior(), block: "start" });
  };

  researchPathButton?.addEventListener("click", () => openResearchPath(researchPathButton.dataset.path));
  researchPathPanel?.addEventListener("click", (event) => {
    if (!event.target.closest("button[data-clear-path]")) return;
    state.path = "";
    renderCatalog();
    renderResearchPath();
    syncUrl();
  });

  const copyLinkButton = document.getElementById("copy-view-link");
  copyLinkButton?.addEventListener("click", async () => {
    const original = copyLinkButton.textContent;
    const ok = await copyToClipboard(window.location.href);
    flashConfirmation(copyLinkButton, ok ? "Enlace copiado" : "No se pudo copiar", original);
  });

  grid.addEventListener("click", async (event) => {
    const topicButton = event.target.closest("button[data-topic]");
    if (topicButton) {
      state.topic = state.topic === topicButton.dataset.topic ? "" : topicButton.dataset.topic;
      state.source = "";
      state.path = "";
      if (topic) topic.value = state.topic;
      renderCatalog();
      renderResearchPath();
      renderDiscovery();
      updateDiscoverControl();
      syncUrl();
      return;
    }

    const citeButton = event.target.closest("button[data-cite-id]");
    if (citeButton) {
      const record = catalog.find((entry) => entry.id === citeButton.dataset.citeId);
      if (!record) return;
      const citation = `"${record.title}." ${record.provider}. Consultado el ${record.checked}. ${record.url}`;
      const ok = await copyToClipboard(citation);
      trackEvent(`/cite/${record.id}`);
      flashConfirmation(citeButton, ok ? "Copiado" : "No se pudo copiar", "Citar");
      return;
    }

    const reportButton = event.target.closest("button[data-report-id]");
    if (reportButton) {
      const record = catalog.find((entry) => entry.id === reportButton.dataset.reportId);
      if (!record) return;
      trackEvent(`/report-link/${record.id}`);
      const subject = encodeURIComponent(`Enlace roto: ${record.title}`);
      const body = encodeURIComponent(`Entrada: ${record.id}\nURL: ${record.url}\n\n¿Qué ocurrió al visitar el enlace? (mensaje de error, página en blanco, contenido incorrecto, etc.)\n\n`);
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
  renderResearchPath();
  renderDiscovery();
  updateDiscoverControl();
  syncUrl();
  injectStructuredData();
})();
