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
          <li class="verified-pill">✓ Verificado</li>
          <li>${escapeHtml(coverageLabels[record.coverage] || record.coverage)}</li>
          <li>${escapeHtml(accessLabels[record.access] || record.access)}</li>
          <li>Verificado el ${escapeHtml(record.checked)}</li>
        </ul>
        ${record.submittedBy ? `<p class="submitted-by">Enviado por <a href="https://github.com/${escapeHtml(record.submittedBy)}" target="_blank" rel="noopener noreferrer">@${escapeHtml(record.submittedBy)}</a></p>` : ""}
        <div class="card-actions">
          <a class="dataset-link" href="${escapeHtml(record.url)}" target="_blank" rel="noopener noreferrer">Abrir en la fuente <span class="sr-only">(se abre en una pestaña nueva)</span></a>
          <button class="cite-button" type="button" data-cite-id="${escapeHtml(record.id)}">Citar</button>
        </div>
      </article>`).join("");
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

  // --- Panel de candidatos -----------------------------------------------
  // Lee pull requests abiertas con la etiqueta "new-source" en la API
  // pública de GitHub (sin autenticación — CORS habilitado, límite de 60
  // solicitudes/hora por IP del visitante). Cada PR de estas solo se abre
  // mediante source-submission.yml después de que scripts/validate-catalog.mjs
  // pasa, así que todo lo que aparece aquí ya es válido según el esquema —
  // solo falta la revisión editorial. Leemos el texto de la *issue de
  // origen*, no el diff de archivo de la PR, para que nada aquí ejecute
  // jamás contenido descargado; siempre se muestra únicamente como texto.
  const CANDIDATES_REPO = "mgpcamargo/amazoniadb";

  const parseIssueForm = (body) => {
    const fields = {};
    const chunks = ("\n" + (body || "")).split(/\n### /).slice(1);
    for (const chunk of chunks) {
      const breakIndex = chunk.indexOf("\n");
      if (breakIndex === -1) continue;
      fields[chunk.slice(0, breakIndex).trim()] = chunk.slice(breakIndex).trim();
    }
    return fields;
  };

  const candidateFromIssueBody = (body, prUrl, submittedBy) => {
    const fields = parseIssueForm(body);
    const title = fields["Source title"];
    const url = fields["Original publisher URL"];
    if (!title || !url) return null; // issue malformada o no relacionada — se omite en vez de suponer
    return {
      title,
      url,
      provider: fields["Original provider"] || "",
      category: fields.Domain || "",
      coverage: fields.Coverage || "",
      kind: fields["Source type"] || "",
      access: fields["Access note"] || "",
      formats: (fields["Data forms"] || "").split(",").map((format) => format.trim()).filter(Boolean),
      description: fields["Plain-language description"] || "",
      prUrl,
      submittedBy
    };
  };

  const renderCandidateCard = (candidate) => `
    <article class="dataset-card candidate-card">
      <div class="card-topline">
        <span class="category-label">${escapeHtml(categoryLabels[candidate.category] || candidate.category)}</span>
        <span class="source-kind">${escapeHtml(kindLabels[candidate.kind] || candidate.kind)}</span>
      </div>
      <span class="pending-badge">Pendiente de revisión</span>
      <h3>${escapeHtml(candidate.title)}</h3>
      <p class="provider">${escapeHtml(candidate.provider)}</p>
      <p class="description">${escapeHtml(candidate.description)}</p>
      <ul class="metadata" aria-label="Metadatos del candidato">
        <li>${escapeHtml(coverageLabels[candidate.coverage] || candidate.coverage)}</li>
        <li>${escapeHtml(accessLabels[candidate.access] || candidate.access)}</li>
        ${candidate.formats.map((format) => `<li>${escapeHtml(format)}</li>`).join("")}
      </ul>
      ${candidate.submittedBy ? `<p class="submitted-by">Enviado por <a href="https://github.com/${escapeHtml(candidate.submittedBy)}" target="_blank" rel="noopener noreferrer">@${escapeHtml(candidate.submittedBy)}</a></p>` : ""}
      <div class="card-actions">
        <a class="dataset-link" href="${escapeHtml(candidate.prUrl)}" target="_blank" rel="noopener noreferrer">Ver pull request <span class="sr-only">(se abre en una pestaña nueva)</span></a>
      </div>
    </article>`;

  const loadCandidates = async () => {
    const statusEl = document.getElementById("candidates-status");
    const gridEl = document.getElementById("candidates-grid");
    const countEl = document.getElementById("candidates-count");
    if (!statusEl || !gridEl) return;

    try {
      const listResponse = await fetch(`https://api.github.com/repos/${CANDIDATES_REPO}/issues?state=open&labels=new-source&per_page=50`, { headers: { Accept: "application/vnd.github+json" } });
      if (!listResponse.ok) throw new Error(`GitHub API returned ${listResponse.status}`);
      const issues = await listResponse.json();
      const prStubs = issues.filter((issue) => issue.pull_request);

      const candidates = [];
      for (const prStub of prStubs) {
        const issueMatch = (prStub.body || "").match(/#(\d+)/);
        if (!issueMatch) continue;
        const issueResponse = await fetch(`https://api.github.com/repos/${CANDIDATES_REPO}/issues/${issueMatch[1]}`, { headers: { Accept: "application/vnd.github+json" } });
        if (!issueResponse.ok) continue;
        const issue = await issueResponse.json();
        const candidate = candidateFromIssueBody(issue.body, prStub.html_url, issue.user?.login);
        if (candidate) candidates.push(candidate);
      }

      if (candidates.length === 0) {
        statusEl.textContent = "No hay envíos pendientes por ahora — sé el primero en proponer una fuente.";
        return;
      }

      gridEl.innerHTML = candidates.map(renderCandidateCard).join("");
      countEl.textContent = `${candidates.length} ${candidates.length === 1 ? "envío pendiente" : "envíos pendientes"}`;
      statusEl.hidden = true;
    } catch {
      statusEl.textContent = "No se pudieron cargar los envíos pendientes en este momento.";
    }
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
    const citation = `"${record.title}." ${record.provider}. Consultado el ${record.checked}. ${record.url}`;
    const ok = await copyToClipboard(citation);
    flashConfirmation(citeButton, ok ? "Copiado" : "No se pudo copiar", "Citar");
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
  loadCandidates();
})();
