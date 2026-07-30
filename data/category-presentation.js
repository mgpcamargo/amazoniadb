// The catalog's six canonical category keys stay stable in data/catalog.js.
// This file owns the public-facing labels, concise prompts, visual treatment,
// and original inline icons used by every localized explorer.
(() => {
  const icon = (content) => `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${content}</svg>`;

  window.AMAZONIA_CATEGORY_PRESENTATION = Object.freeze({
    "Forest & biodiversity": Object.freeze({
      id: "life",
      icon: icon('<path d="M7 25c10-1 16-7 18-18-11 1-17 7-18 18Z"/><path d="M8 24c4-5 8-9 14-14"/><path d="M14 19l-5-1M18 15l-1-5"/>'),
      locales: Object.freeze({
        en: { label: "Life & biodiversity", note: "Species, habitats, forest condition" },
        "pt-BR": { label: "Vida e biodiversidade", note: "Espécies, habitats e condição da floresta" },
        es: { label: "Vida y biodiversidad", note: "Especies, hábitats y estado del bosque" }
      })
    }),
    "Earth, water & climate": Object.freeze({
      id: "water",
      icon: icon('<path d="M7 14c1-3 4-5 7-5 2 0 4 1 5 3 3-1 6 1 6 4 0 2-2 4-5 4H9c-3 0-5-2-5-4 0-1 1-2 3-2Z"/><path d="M8 25c2 1 4 1 6 0s4-1 6 0 4 1 6 0"/>'),
      locales: Object.freeze({
        en: { label: "Water & climate", note: "Weather, rivers, rock, extremes" },
        "pt-BR": { label: "Água e clima", note: "Clima, rios, rochas e extremos" },
        es: { label: "Agua y clima", note: "Clima, ríos, rocas y extremos" }
      })
    }),
    "Land use & infrastructure": Object.freeze({
      id: "land",
      icon: icon('<path d="M4 24 12 11l5 8 3-5 8 10H4Z"/><path d="M18 24c0-4 1-7 5-10"/><path d="M23 14h4"/>'),
      locales: Object.freeze({
        en: { label: "Land & pressures", note: "Change, monitoring, access" },
        "pt-BR": { label: "Terra e pressões", note: "Mudanças, monitoramento e acesso" },
        es: { label: "Tierra y presiones", note: "Cambios, monitoreo y acceso" }
      })
    }),
    "Peoples, territories & culture": Object.freeze({
      id: "people",
      icon: icon('<circle cx="11" cy="12" r="3"/><circle cx="21" cy="12" r="3"/><path d="M5 24c1-4 4-6 6-6s5 2 6 6M15 24c1-4 4-6 6-6s5 2 6 6"/><path d="M16 5v3M16 27v-3"/>'),
      locales: Object.freeze({
        en: { label: "Peoples & territories", note: "Communities, lands, knowledge" },
        "pt-BR": { label: "Povos e territórios", note: "Comunidades, terras e saberes" },
        es: { label: "Pueblos y territorios", note: "Comunidades, tierras y saberes" }
      })
    }),
    "Society, health & livelihoods": Object.freeze({
      id: "wellbeing",
      icon: icon('<path d="M5 16 16 7l11 9v10H5V16Z"/><path d="M13 19c1-2 4-2 5 0 1-2 4-2 5 0 0 3-4 5-5 6-1-1-5-3-5-6Z"/>'),
      locales: Object.freeze({
        en: { label: "Wellbeing & livelihoods", note: "Health, wellbeing, local economies" },
        "pt-BR": { label: "Bem-estar e meios de vida", note: "Saúde, bem-estar e economias locais" },
        es: { label: "Bienestar y medios de vida", note: "Salud, bienestar y economías locales" }
      })
    }),
    "Governance, rights & safeguards": Object.freeze({
      id: "rights",
      icon: icon('<path d="M16 4 25 8v7c0 6-4 10-9 13-5-3-9-7-9-13V8l9-4Z"/><path d="M11 15h10M16 11v8M10 19l-3 4M22 19l3 4"/>'),
      locales: Object.freeze({
        en: { label: "Rights & governance", note: "Protection, policy, accountability" },
        "pt-BR": { label: "Direitos e governança", note: "Proteção, política e responsabilização" },
        es: { label: "Derechos y gobernanza", note: "Protección, política y rendición de cuentas" }
      })
    })
  });
})();
