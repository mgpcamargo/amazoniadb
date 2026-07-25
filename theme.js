// Shared across en/es/pt-br — one file, no per-locale duplication. The only
// locale-specific bit (the button's aria-label) is picked at runtime from
// <html lang>, set directly in each page's markup.
//
// The theme itself is applied before this file even runs: each page has a
// tiny inline script in <head>, right after <meta charset>, that reads
// localStorage (falling back to prefers-color-scheme) and sets
// data-theme on <html> synchronously, before first paint. This file only
// wires up the toggle button once the DOM exists — it never has to
// guess or reapply the initial theme.
(function () {
  "use strict";

  const STORAGE_KEY = "amazoniadb-theme";

  const LABELS = {
    en: "Dark mode",
    es: "Modo oscuro",
    pt: "Modo escuro",
  };

  // Matches on the primary subtag (the part before any "-") rather than the
  // exact tag, since this codebase isn't fully consistent about "es" vs
  // "es-419" across pages — this way it works regardless.
  const getLabel = () => {
    const primary = (document.documentElement.lang || "en").split("-")[0].toLowerCase();
    return LABELS[primary] || LABELS.en;
  };

  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    const button = document.getElementById("theme-toggle");
    if (button) {
      button.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      button.setAttribute("aria-label", getLabel());
    }
  };

  const currentTheme = () => document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";

  const button = document.getElementById("theme-toggle");
  if (button) {
    applyTheme(currentTheme());
    button.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {
        // localStorage unavailable (private mode, disabled storage, etc.) —
        // the toggle still works for the current page view, it just won't
        // persist across visits.
      }
      applyTheme(next);
    });
  }

  // If the user has never explicitly chosen a theme on this device, keep
  // following the OS-level preference live (e.g. system switches to dark
  // at sunset) rather than freezing whatever it was on first visit.
  try {
    if (!localStorage.getItem(STORAGE_KEY)) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
        if (!localStorage.getItem(STORAGE_KEY)) applyTheme(event.matches ? "dark" : "light");
      });
    }
  } catch (e) {
    // localStorage unavailable — skip the live-follow behavior, the
    // static initial theme from the inline script still applies.
  }
})();
