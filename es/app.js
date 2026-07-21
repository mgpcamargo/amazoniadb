(() => {
  const catalog = window.AMAZONIA_CATALOG || [];
  const i18n = (window.AMAZONIA_CATALOG_I18N && window.AMAZONIA_CATALOG_I18N["es"]) || { descriptions: {} };

  // `key` matches record.category/coverage/access/kind exactly as stored in
  // ../data/catalog.js (the canonical English values required by
  // data/catalog.schema.json) — only `label`/`note` are shown to the user.
  const categories = [
    { key: "Forest & biodiversity", label: "Bosque y biodiversidad", note: "Especies, hábitats, estado del bosque" },
    { key: "Climate, water & air", label: "Clima, agua y aire", note: "Clima, ríos, carbono, extremos" },
    { key: "Land use & infrastructure", label: "Uso del suelo e infraestructura", note: "Cambios, monitoreo, acceso" },
    { key: "Peoples, territories & culture", label: "Pueblos, territorios y cultura", note: "Comunidades, tierras, saberes" },
    { key: "Society, health & livelihoods", label: "Sociedad, salud y medios de vida", note: "Bienestar y economías locales" },
    { key: "Governance, rights & safeguards", label: "Gobernanza, derechos y salvaguardas", note: "Protección, política, rendición de cuentas" }
  ];
  const categoryLabels = Object.fromEntries(categories.map((c) => [c.key, c.label]));
  const coverageLabels = { "Pan-Amazon": "Panamazonía", "Brazil": "Brasil", "Global — subsettable": "Global — recortable" };
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

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const renderDomains = () => {
    const allButton = `<button class="domain-button" type="button" data-category="" aria-pressed="${state.category === ""}"><strong>Todas las fuentes</strong><span>Ver todos los enlaces seleccionados</span></button>`;
    const buttons = categories.map((category) => `
      <button class="domain-button" type="button" data-category="${escapeHtml(category.key)}" aria-pressed="${state.category === category.key}">
        <strong>${escapeHtml(category.label)}</strong>
        <span>${escapeHtml(category.note)}</span>
      </button>`).join("");
    domainNav.innerHTML = allButton + buttons;
  };

  const getVisibleRecords = () => {
    const query = state.search.trim().toLocaleLowerCase();
    return catalog.filter((record) => {
      const searchText = [record.title, record.provider, record.category, record.coverage, record.description, ...record.formats]
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
    grid.innerHTML = records.map((record) => `
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
          <li>${escapeHtml(accessLabels[record.access] || record.access)}</li>
          <li>Verificado el ${escapeHtml(record.checked)}</li>
        </ul>
        <a class="dataset-link" href="${escapeHtml(record.url)}" target="_blank" rel="noopener noreferrer">Abrir en la fuente <span class="sr-only">(se abre en una pestaña nueva)</span></a>
      </article>`).join("");
  };

  domainNav.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    state.category = button.dataset.category;
    renderDomains();
    renderCatalog();
    document.getElementById("catalog").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  search.addEventListener("input", () => {
    state.search = search.value;
    renderCatalog();
  });

  coverage.addEventListener("change", () => {
    state.coverage = coverage.value;
    renderCatalog();
  });

  access.addEventListener("change", () => {
    state.access = access.value;
    renderCatalog();
  });

  filters.addEventListener("reset", () => {
    window.setTimeout(() => {
      state.search = "";
      state.coverage = "";
      state.access = "";
      renderCatalog();
    }, 0);
  });

  renderDomains();
  renderCatalog();
})();
