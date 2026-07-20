(() => {
  const catalog = window.AMAZONIA_CATALOG || [];
  const categories = [
    { name: "Forest & biodiversity", note: "Species, habitats, forest condition" },
    { name: "Climate, water & air", note: "Weather, rivers, carbon, extremes" },
    { name: "Land use & infrastructure", note: "Change, monitoring, access" },
    { name: "Peoples, territories & culture", note: "Communities, lands, knowledge" },
    { name: "Society, health & livelihoods", note: "Wellbeing and local economies" },
    { name: "Governance, rights & safeguards", note: "Protection, policy, accountability" }
  ];

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
    const allButton = `<button class="domain-button" type="button" data-category="" aria-pressed="${state.category === ""}"><strong>All sources</strong><span>See every curated link</span></button>`;
    const buttons = categories.map((category) => `
      <button class="domain-button" type="button" data-category="${escapeHtml(category.name)}" aria-pressed="${state.category === category.name}">
        <strong>${escapeHtml(category.name)}</strong>
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
    resultCount.textContent = `${records.length} ${records.length === 1 ? "source" : "sources"} found`;
    emptyState.hidden = records.length !== 0;
    grid.innerHTML = records.map((record) => `
      <article class="dataset-card">
        <div class="card-topline">
          <span class="category-label">${escapeHtml(record.category)}</span>
          <span class="source-kind">${escapeHtml(record.kind)}</span>
        </div>
        <h3>${escapeHtml(record.title)}</h3>
        <p class="provider">${escapeHtml(record.provider)}</p>
        <p class="description">${escapeHtml(record.description)}</p>
        <ul class="metadata" aria-label="Dataset metadata">
          <li>${escapeHtml(record.coverage)}</li>
          <li>${escapeHtml(record.access)}</li>
          <li>Checked ${escapeHtml(record.checked)}</li>
        </ul>
        <a class="dataset-link" href="${escapeHtml(record.url)}" target="_blank" rel="noopener noreferrer">Open at source <span class="sr-only">(opens in a new tab)</span></a>
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
