(() => {
  const candidates = window.AMAZONIA_CANDIDATES || [];
  const list = document.getElementById("candidates-list");
  const empty = document.getElementById("candidates-empty");
  const countEl = document.getElementById("candidates-count");
  const pageLanguage = (document.documentElement.lang || "en").toLocaleLowerCase();
  const language = pageLanguage.startsWith("pt") ? "pt-BR" : pageLanguage.startsWith("es") ? "es" : "en";
  const copy = {
    en: { inReview: "In review", needsFixing: "Needs fixing", opened: "Opened", submittedBy: "Submitted by", opensNewTab: "(opens in a new tab)", waiting: (count) => `${count} ${count === 1 ? "source" : "sources"} waiting on review` },
    "pt-BR": { inReview: "Em revisão", needsFixing: "Precisa de ajuste", opened: "Aberta em", submittedBy: "Enviado por", opensNewTab: "(abre em nova aba)", waiting: (count) => `${count} ${count === 1 ? "fonte aguardando" : "fontes aguardando"} revisão` },
    es: { inReview: "En revisión", needsFixing: "Necesita ajustes", opened: "Abierto el", submittedBy: "Enviado por", opensNewTab: "(se abre en una pestaña nueva)", waiting: (count) => `${count} ${count === 1 ? "fuente esperando" : "fuentes esperando"} revisión` }
  }[language];

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const statusLabels = { "in-review": copy.inReview, "needs-fixing": copy.needsFixing };

  countEl.textContent = candidates.length ? copy.waiting(candidates.length) : "";
  empty.hidden = candidates.length !== 0;

  list.innerHTML = candidates.map((c) => `
    <article class="candidate-card">
      <div class="candidate-topline">
        <span class="candidate-status status-${escapeHtml(c.status)}">${escapeHtml(statusLabels[c.status] || c.status)}</span>
        <span class="candidate-date">${copy.opened} ${escapeHtml(c.createdAt)}</span>
      </div>
      <h3><a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.title)}<span class="sr-only"> ${copy.opensNewTab}</span></a></h3>
      <p class="candidate-submitter">${c.avatarUrl ? `<img class="candidate-avatar" src="${escapeHtml(c.avatarUrl)}" alt="" width="20" height="20" loading="lazy">` : ""}${copy.submittedBy} <a href="https://github.com/${encodeURIComponent(c.submittedBy)}" target="_blank" rel="noopener noreferrer">@${escapeHtml(c.submittedBy)}</a></p>
    </article>`).join("");
})();
