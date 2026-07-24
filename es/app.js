(() => {
  const catalog = window.AMAZONIA_CATALOG || [];
  const i18n = (window.AMAZONIA_CATALOG_I18N && window.AMAZONIA_CATALOG_I18N["es"]) || { descriptions: {} };

  // `key` matches record.category/coverage/access/kind exactly as stored in
  // ../data/catalog.js (the canonical English values required by
  // data/catalog.schema.json) — only `label`/`note` are shown to the user.
  const categories = [
    { key: "Forest & biodiversity", label: "Bosque y biodiversidad", note: "Especies, hábitats, estado del bosque" },
    { key: "Earth, water & climate", label: "Tierra, agua y clima", note: "Clima, ríos, rocas, extremos" },
    { key: "Land use & infrastructure", label: "Uso del suelo e infraestructura", note: "Cambios, monitoreo, acceso" },
    { key: "Peoples, territories & culture", label: "Pueblos, territorios y cultura", note: "Comunidades, tierras, saberes" },
    { key: "Society, health & livelihoods", label: "Sociedad, salud y medios de vida", note: "Bienestar y economías locales" },
    { key: "Governance, rights & safeguards", label: "Gobernanza, derechos y salvaguardas", note: "Protección, política, rendición de cuentas" }
  ];
  const categoryLabels = Object.fromEntries(categories.map((c) => [c.key, c.label]));
  const coverageLabels = { "Pan-Amazon": "Panamazonía", "Brazil": "Brasil", "Peru": "Perú", "Colombia": "Colombia", "Bolivia": "Bolivia", "Ecuador": "Ecuador", "Global — subsettable": "Global — recortable" };
  const accessLabels = {
    "Provider terms apply": "Sujeto a los términos del proveedor",
    "Dataset-specific license": "Licencia específica del conjunto de datos",
    "Publicly available": "Disponible públicamente"
  };
  const kindLabels = { "Dataset": "Conjunto de datos", "Data portal": "Portal de datos", "Download": "Descarga", "Explorer": "Explorador" };

  const state = { category: "", search: "", coverage: "", access: "" };
  const domainNav = document.getElementById("domain-nav");
  const grid = document.getElementById("dataset-grid");
  const emptyState = document.getElementById("empty-state");
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

  // Freshness helpers. STALE_DAYS mirrors scripts/check-links.mjs so the
  // on-card signal always agrees with what the weekly automation flags.
  const STALE_DAYS = 180;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const describeFreshness = (checkedDate) => {
    const days = Math.floor((Date.now() - new Date(`${checkedDate}T00:00:00Z`).getTime()) / MS_PER_DAY);
    let relative;
    if (days <= 0) relative = "hoy";
    else if (days === 1) relative = "ayer";
    else if (days < 14) relative = `hace ${days} días`;
    else if (days < 60) relative = `hace ${Math.round(days / 7)} semanas`;
    else if (days < 730) relative = `hace ${Math.round(days / 30)} meses`;
    else relative = `hace ${Math.round(days / 365)} años`;
    return { stale: days > STALE_DAYS, relative };
  };

  // Citation helpers. BibTeX uses "s.f." (sin fecha) for year rather than
  // guessing a publication year from the verification date.
  const buildApaCitation = (record) => `"${record.title}." ${record.provider}. Consultado el ${record.checked}. ${record.url}`;
  const buildBibtex = (record) => [
    `@misc{${record.id},`,
    `  title        = {${record.title}},`,
    `  author       = {{${record.provider}}},`,
    `  year         = {s.f.},`,
    `  howpublished = {\\url{${record.url}}},`,
    `  note         = {Consultado el ${record.checked}},`,
    `  urldate      = {${record.checked}}`,
    `}`
  ].join("\n");

  // Bulk export helpers — always export the full catalog, not the filtered view.
  const downloadFile = (filename, content, mime) => {
    const blob = new Blob([content], { type: mime });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
  };
  const csvCell = (value) => {
    const str = String(value ?? "");
    return /[",\n]/.test(str) ? `"${str.replaceAll('"', '""')}"` : str;
  };
  const CSV_FIELDS = ["id", "title", "provider", "category", "coverage", "formats", "access", "kind", "description", "url", "checked", "submittedBy", "temporalCoverage", "spatialResolution", "license", "methodologyUrl"];
  const toCsv = (records) => [
    CSV_FIELDS.join(","),
    ...records.map((record) => CSV_FIELDS.map((field) => csvCell(field === "formats" ? (record.formats || []).join("; ") : record[field])).join(","))
  ].join("\n");

  const renderDomains = () => {
    const allButton = `<button class="domain-button" type="button" data-category="" aria-pressed="${state.category === ""}"><strong>Todas las fuentes</strong><span>Ver todos los enlaces seleccionados</span></button>`;
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
      ? `Todos los dominios tienen ${minCount} ${minCount === 1 ? "fuente" : "fuentes"} hasta ahora — <a href="submit.html">ayuda a que uno crezca →</a>`
      : `${escapeHtml(thinnest[0].label)} tiene el menor número de fuentes (${thinnest[0].count}) — ¿conoces una? <a href="submit.html">Proponer una fuente →</a>`;
  };

  const getVisibleRecords = () => {
    const query = state.search.trim().toLocaleLowerCase();
    return catalog.filter((record) => {
      const searchText = [record.title, record.provider, record.category, record.coverage, record.description, i18n.descriptions[record.id], ...record.formats]
        .join(" ")
        .toLocaleLowerCase();
      return (!state.category || record.category === state.category)
        && (!state.coverage || record.coverage === state.coverage)
        && (!state.access || record.access === state.access)
        && (!query || searchText.includes(query));
    });
  };

  const renderCatalog = () => {
    const records = getVisibleRecords();
    resultCount.textContent = `${records.length} ${records.length === 1 ? "fuente encontrada" : "fuentes encontradas"}`;
    emptyState.hidden = records.length !== 0;
    grid.innerHTML = records.map((record) => {
      const fresh = describeFreshness(record.checked);
      return `
      <article class="dataset-card">
        <div class="card-topline">
          <span class="category-label">${escapeHtml(categoryLabels[record.category] || record.category)}</span>
          <span class="source-kind">${escapeHtml(kindLabels[record.kind] || record.kind)}</span>
        </div>
        <h3>${escapeHtml(record.title)}</h3>
        <p class="provider">${escapeHtml(record.provider)}</p>
        <p class="description">${escapeHtml(i18n.descriptions[record.id] || record.description)}</p>
        <ul class="metadata" aria-label="Metadatos del conjunto de datos">
          <li>${escapeHtml(coverageLabels[record.coverage] || record.coverage)}</li>
          ${record.spatialResolution ? `<li>${escapeHtml(record.spatialResolution)}</li>` : ""}
          ${record.temporalCoverage ? `<li>${escapeHtml(record.temporalCoverage)}</li>` : ""}
          <li>${escapeHtml(accessLabels[record.access] || record.access)}</li>
          ${record.license ? `<li class="license-pill">${escapeHtml(record.license)}</li>` : ""}
          <li class="freshness-pill${fresh.stale ? " is-stale" : ""}"><time datetime="${escapeHtml(record.checked)}" title="Verificado el ${escapeHtml(record.checked)}">${fresh.stale ? "Revisión pendiente — verificado" : "Verificado"} ${fresh.relative}</time></li>
        </ul>
        <p class="credit-line">${record.submittedBy
          ? `<span class="tier-badge tier-community">Enviado por la comunidad, validado</span> · Enviado por <a href="https://github.com/${encodeURIComponent(record.submittedBy)}" target="_blank" rel="noopener noreferrer">@${escapeHtml(record.submittedBy)}</a>`
          : `<span class="tier-badge tier-editorial">Revisado editorialmente</span>`}</p>
        ${record.methodologyUrl ? `<p class="methodology-line"><a href="${escapeHtml(record.methodologyUrl)}" target="_blank" rel="noopener noreferrer">Documentación de metodología <span class="sr-only">(se abre en una pestaña nueva)</span></a></p>` : ""}
        <div class="card-actions">
          <a class="dataset-link" href="${escapeHtml(record.url)}" target="_blank" rel="noopener noreferrer">Abrir en la fuente <span class="sr-only">(se abre en una pestaña nueva)</span></a>
          <div class="cite-group" role="group" aria-label="Citar este conjunto de datos">
            <button class="cite-button" type="button" data-cite-id="${escapeHtml(record.id)}" data-cite-format="apa">Citar</button>
            <button class="cite-button" type="button" data-cite-id="${escapeHtml(record.id)}" data-cite-format="bibtex">BibTeX</button>
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
      "description": "Un directorio ligero de conjuntos de datos socioambientales de la Amazonía, indexados en sus fuentes originales.",
      "url": `${window.location.origin}${window.location.pathname}`,
      "inLanguage": "es",
      "dataset": catalog.map((record) => ({
        "@type": "Dataset",
        "name": record.title,
        "description": i18n.descriptions[record.id] || record.description,
        "url": record.url,
        "keywords": [categoryLabels[record.category] || record.category, coverageLabels[record.coverage] || record.coverage],
        "provider": { "@type": "Organization", "name": record.provider },
        "license": accessLabels[record.access] || record.access,
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

  search.addEventListener("input", () => {
    state.search = search.value;
    renderCatalog();
    syncUrl();
  });

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
    flashConfirmation(copyLinkButton, ok ? "Enlace copiado" : "No se pudo copiar", original);
  });

  grid.addEventListener("click", async (event) => {
    const citeButton = event.target.closest("button[data-cite-id]");
    if (!citeButton) return;
    const record = catalog.find((entry) => entry.id === citeButton.dataset.citeId);
    if (!record) return;
    const format = citeButton.dataset.citeFormat === "bibtex" ? "bibtex" : "apa";
    const citation = format === "bibtex" ? buildBibtex(record) : buildApaCitation(record);
    const ok = await copyToClipboard(citation);
    flashConfirmation(citeButton, ok ? "Copiado" : "No se pudo copiar", format === "bibtex" ? "BibTeX" : "Citar");
  });

  document.getElementById("export-json")?.addEventListener("click", () => {
    downloadFile("amazoniadb-catalog.json", JSON.stringify(catalog, null, 2), "application/json");
  });

  document.getElementById("export-csv")?.addEventListener("click", () => {
    downloadFile("amazoniadb-catalog.csv", toCsv(catalog), "text/csv");
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
