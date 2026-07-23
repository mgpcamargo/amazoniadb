(() => {
  const candidates = window.AMAZONIA_CANDIDATES || [];
  const list = document.getElementById("candidates-list");
  const empty = document.getElementById("candidates-empty");
  const countEl = document.getElementById("candidates-count");

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const statusLabels = { "in-review": "In review", "needs-fixing": "Needs fixing" };

  countEl.textContent = candidates.length
    ? `${candidates.length} ${candidates.length === 1 ? "source" : "sources"} waiting on review`
    : "";
  empty.hidden = candidates.length !== 0;

  list.innerHTML = candidates.map((c) => `
    <article class="candidate-card">
      <div class="candidate-topline">
        <span class="candidate-status status-${escapeHtml(c.status)}">${escapeHtml(statusLabels[c.status] || c.status)}</span>
        <span class="candidate-date">Opened ${escapeHtml(c.createdAt)}</span>
      </div>
      <h3><a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.title)}<span class="sr-only"> (opens in a new tab)</span></a></h3>
      <p class="candidate-submitter">${c.avatarUrl ? `<img class="candidate-avatar" src="${escapeHtml(c.avatarUrl)}" alt="" width="20" height="20" loading="lazy">` : ""}Submitted by <a href="https://github.com/${encodeURIComponent(c.submittedBy)}" target="_blank" rel="noopener noreferrer">@${escapeHtml(c.submittedBy)}</a></p>
    </article>`).join("");
})();
