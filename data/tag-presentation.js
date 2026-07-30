// Controlled, localized vocabulary for the editorial tags attached to catalog
// records. Tags are deliberately compact discovery aids: the six visible
// knowledge areas remain the primary way into the catalogue.
(() => {
  const label = (en, ptBR, es) => Object.freeze({ en, "pt-BR": ptBR, es });

  const vocabulary = Object.freeze({
    topics: Object.freeze({
      biodiversity: label("Biodiversity", "Biodiversidade", "Biodiversidad"),
      forests: label("Forests", "Florestas", "Bosques"),
      "forest-change": label("Forest change", "Transformação florestal", "Cambio forestal"),
      "land-use": label("Land use", "Uso da terra", "Uso del suelo"),
      fire: label("Fire", "Fogo", "Fuego"),
      "extractive-pressures": label("Extractive pressures", "Pressões extrativas", "Presiones extractivas"),
      infrastructure: label("Infrastructure", "Infraestrutura", "Infraestructura"),
      water: label("Water", "Água", "Agua"),
      climate: label("Climate", "Clima", "Clima"),
      terrain: label("Terrain", "Relevo", "Relieve"),
      territories: label("Territories", "Territórios", "Territorios"),
      "indigenous-peoples": label("Indigenous peoples", "Povos indígenas", "Pueblos indígenas"),
      "community-lands": label("Community lands", "Terras comunitárias", "Tierras comunitarias"),
      languages: label("Languages", "Línguas", "Lenguas"),
      population: label("Population", "População", "Población"),
      health: label("Health", "Saúde", "Salud"),
      livelihoods: label("Livelihoods", "Meios de vida", "Medios de vida"),
      "food-security": label("Food security", "Segurança alimentar", "Seguridad alimentaria"),
      "protected-areas": label("Protected areas", "Áreas protegidas", "Áreas protegidas"),
      "tenure-and-rights": label("Tenure and rights", "Posse e direitos territoriais", "Tenencia y derechos"),
      "environmental-accountability": label("Environmental accountability", "Responsabilização ambiental", "Rendición de cuentas ambiental")
    }),
    modes: Object.freeze({
      geospatial: label("Geospatial data", "Dados geoespaciais", "Datos geoespaciales"),
      "remote-sensing": label("Remote sensing", "Sensoriamento remoto", "Teledetección"),
      "field-observation": label("Field observations", "Observações de campo", "Observaciones de campo"),
      "station-observation": label("Station observations", "Observações de estações", "Observaciones de estaciones"),
      "administrative-record": label("Administrative records", "Registros administrativos", "Registros administrativos"),
      "survey-or-census": label("Survey or census", "Pesquisa ou censo", "Encuesta o censo"),
      "legal-boundary": label("Legal boundaries", "Limites legais", "Límites legales"),
      "indicators-and-profiles": label("Indicators and profiles", "Indicadores e perfis", "Indicadores y perfiles"),
      "reference-layer": label("Reference layers", "Camadas de referência", "Capas de referencia")
    }),
    time: Object.freeze({
      "historical-series": label("Historical series", "Séries históricas", "Series históricas"),
      ongoing: label("Ongoing updates", "Atualização contínua", "Actualización continua"),
      "near-real-time": label("Near real time", "Quase em tempo real", "Casi en tiempo real"),
      "static-reference": label("Static reference", "Referência estática", "Referencia estática"),
      "future-scenarios": label("Future scenarios", "Cenários futuros", "Escenarios futuros")
    }),
    roles: Object.freeze({
      baseline: label("Baseline", "Linha de base", "Línea de base"),
      monitoring: label("Monitoring", "Monitoramento", "Monitoreo"),
      alert: label("Alert", "Alerta", "Alerta"),
      boundary: label("Boundary", "Limite", "Límite"),
      context: label("Context", "Contexto", "Contexto"),
      accountability: label("Accountability", "Responsabilização", "Rendición de cuentas")
    })
  });

  window.AMAZONIA_TAG_PRESENTATION = Object.freeze({
    facets: Object.freeze({
      topics: label("Topics", "Temas", "Temas"),
      modes: label("Data mode", "Modo de dado", "Modo de dato"),
      time: label("Time profile", "Perfil temporal", "Perfil temporal"),
      roles: label("Research role", "Papel na pesquisa", "Papel en la investigación")
    }),
    vocabulary
  });
})();
