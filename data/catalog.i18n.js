// Translated plain-language descriptions for each data/catalog.js entry,
// keyed by record id. Used by pt-br/app.js and es/app.js.
//
// This file only carries `description`, since `title` and `provider` are
// treated as proper names and left unchanged across locales (several are
// already in Portuguese, e.g. "IBGE Cidades", "Terras Indígenas no Brasil").
// `category`, `coverage`, `access`, and `kind` are NOT translated here —
// those stay as the canonical English enum values in data/catalog.js
// (required by data/catalog.schema.json and scripts/validate-catalog.mjs)
// and are mapped to display labels locally inside each locale's app.js.
//
// If a new entry is added to data/catalog.js and doesn't have a matching
// id here yet, the locale app.js falls back to the English description
// rather than showing nothing.
window.AMAZONIA_CATALOG_I18N = {
  "pt-BR": {
    descriptions: {
      "gbif-species-occurrences": "Um agregador global de registros de ocorrência de espécies — espécimes de museu, observações de ciência cidadã e dados de levantamentos —, pesquisável e filtrável para a bacia amazônica.",
      "specieslink-network": "Uma rede brasileira de dados de biodiversidade que agrega registros de ocorrência de plantas, animais, fungos e microrganismos, enriquecidos com imagens e contexto de uso da terra para cada local de coleta.",
      "ana-hidroweb": "Registros por estação de nível dos rios, vazão, chuva e qualidade da água da Rede Hidrometeorológica Nacional do Brasil, mantida pela agência federal de águas.",
      "inmet-bdmep": "Registros diários históricos de estações meteorológicas do Brasil desde 2000 — temperatura, chuva, umidade e vento —, pesquisáveis por estação ou mapa.",
      "mapbiomas-brasil": "Mapas anuais de cobertura e uso da terra do Brasil desde 1985, construídos a partir da classificação de imagens de satélite, acompanhando desmatamento, fogo e mudança da vegetação por ano e bioma.",
      "inpe-terrabrasilis": "O sistema oficial brasileiro de monitoramento de desmatamento por satélite, que publica o mapeamento anual de corte raso (PRODES) e alertas quase em tempo real (DETER) para a Amazônia Legal e outros biomas.",
      "funai-terras-indigenas": "Limites geoespaciais atualizados mensalmente das terras indígenas, aldeias e áreas de coordenação regional do Brasil, produzidos pela unidade de geoprocessamento do órgão federal de assuntos indígenas.",
      "isa-terras-indigenas": "Uma base de dados independente e de longa data que perfila as terras indígenas em todo o Brasil — situação jurídica, localização, população e notícias —, mantida por uma organização da sociedade civil desde os anos 1980.",
      "ibge-cidades": "Estatísticas oficiais em nível municipal e estadual do Brasil — população, economia, indicadores de educação e saúde —, pesquisáveis por localidade, produzidas pelo instituto nacional de estatística.",
      "datasus-tabnet": "Uma ferramenta interativa de tabulação para os dados do sistema público de saúde do Brasil — mortalidade, nascimentos, morbidade e registros de estabelecimentos de saúde —, desenvolvida pelo Ministério da Saúde.",
      "icmbio-dados-geoespaciais": "Dados oficiais de limites das áreas protegidas federais do Brasil, incluindo parques nacionais e reservas biológicas, publicados sob licença de dados abertos pelo órgão que as administra.",
      "raisg-maps": "Dados geoespaciais pan-amazônicos sobre terras indígenas, áreas naturais protegidas, projetos de infraestrutura e concessões de exploração de recursos, compilados por uma rede da sociedade civil de nove países.",
      "geobosques-national-forest-monitoring-platform": "A plataforma nacional peruana de monitoramento de perda florestal e alertas antecipados, cobrindo a floresta amazônica úmida do país com mapas anuais de perda, alertas mensais e camadas de degradação."
    }
  },
  "es": {
    descriptions: {
      "gbif-species-occurrences": "Un agregador global de registros de ocurrencia de especies —especímenes de museo, observaciones de ciencia ciudadana y datos de relevamientos—, con búsqueda y filtros para la cuenca amazónica.",
      "specieslink-network": "Una red brasileña de datos de biodiversidad que agrega registros de ocurrencia de plantas, animales, hongos y microorganismos, enriquecidos con imágenes y contexto de uso del suelo para cada sitio de recolección.",
      "ana-hidroweb": "Registros por estación de nivel de los ríos, caudal, lluvia y calidad del agua de la Red Hidrometeorológica Nacional de Brasil, administrada por la agencia federal de aguas.",
      "inmet-bdmep": "Registros diarios históricos de estaciones meteorológicas de Brasil desde 2000 —temperatura, lluvia, humedad y viento—, con búsqueda por estación o mapa.",
      "mapbiomas-brasil": "Mapas anuales de cobertura y uso del suelo de Brasil desde 1985, elaborados a partir de la clasificación de imágenes satelitales, que dan seguimiento a la deforestación, el fuego y el cambio de la vegetación por año y bioma.",
      "inpe-terrabrasilis": "El sistema oficial brasileño de monitoreo de la deforestación por satélite, que publica el mapeo anual de tala rasa (PRODES) y alertas casi en tiempo real (DETER) para la Amazonía Legal y otros biomas.",
      "funai-terras-indigenas": "Límites geoespaciales actualizados mensualmente de los territorios indígenas, aldeas y áreas de coordinación regional de Brasil, producidos por la unidad de geoprocesamiento del organismo federal de asuntos indígenas.",
      "isa-terras-indigenas": "Una base de datos independiente y de larga trayectoria que perfila los territorios indígenas en todo Brasil —situación jurídica, ubicación, población y noticias—, mantenida por una organización de la sociedad civil desde la década de 1980.",
      "ibge-cidades": "Estadísticas oficiales a nivel municipal y estatal de Brasil —población, economía, indicadores de educación y salud—, con búsqueda por localidad, del instituto nacional de estadística.",
      "datasus-tabnet": "Una herramienta interactiva de tabulación para los datos del sistema público de salud de Brasil —mortalidad, nacimientos, morbilidad y registros de establecimientos de salud—, desarrollada por el Ministerio de Salud.",
      "icmbio-dados-geoespaciais": "Datos oficiales de límites de las áreas protegidas federales de Brasil, incluidos parques nacionales y reservas biológicas, publicados bajo una licencia de datos abiertos por el organismo que las administra.",
      "raisg-maps": "Datos geoespaciales panamazónicos sobre territorios indígenas, áreas naturales protegidas, proyectos de infraestructura y concesiones de extracción de recursos, compilados por una red de la sociedad civil de nueve países.",
      "geobosques-national-forest-monitoring-platform": "La plataforma nacional peruana de monitoreo de pérdida de bosque y alertas tempranas, que cubre el bosque húmedo amazónico del país con mapas anuales de pérdida, alertas mensuales y capas de degradación."
    }
  }
};
