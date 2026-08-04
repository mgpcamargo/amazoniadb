// Human-reviewed starting sets for specific research questions. A path
// recommends complementary sources; it never produces a finding, makes an
// automated spatial overlay, or infers effects on people or territories.
(() => {
  const copy = (en, ptBR, es) => Object.freeze({ en, "pt-BR": ptBR, es });

  window.AMAZONIA_RESEARCH_PATHS = Object.freeze([
    Object.freeze({
      id: "forest-change-territory-brazil",
      locales: Object.freeze({
        title: copy(
          "Explore forest change around a territory in Brazil",
          "Explore a transformação florestal no entorno de um território no Brasil",
          "Explora el cambio forestal alrededor de un territorio en Brasil"
        ),
        summary: copy(
          "A starting set of four public sources, chosen for complementary roles.",
          "Um conjunto inicial de quatro fontes públicas, escolhido por funções complementares.",
          "Un conjunto inicial de cuatro fuentes públicas, elegido por funciones complementarias."
        ),
        caution: copy(
          "This is a starting set, not a finding or an automatic analysis. Check methods, dates, terms and local knowledge before drawing conclusions. Public territory data is not blanket permission to make claims about people or places.",
          "Este é um ponto de partida, não um resultado ou uma análise automática. Verifique métodos, datas, termos e conhecimento local antes de tirar conclusões. Dados territoriais públicos não são autorização geral para fazer afirmações sobre pessoas ou territórios.",
          "Este es un punto de partida, no un resultado ni un análisis automático. Verifica métodos, fechas, términos y conocimiento local antes de sacar conclusiones. Los datos territoriales públicos no son una autorización general para hacer afirmaciones sobre personas o territorios."
        )
      }),
      records: Object.freeze([
        Object.freeze({
          id: "funai-terras-indigenas",
          role: copy("Published boundary", "Limite publicado", "Límite publicado"),
          reason: copy(
            "Locate a published Indigenous Territory boundary. It does not replace community-led territorial knowledge.",
            "Localize um limite publicado de Terra Indígena. Ele não substitui o conhecimento territorial produzido e conduzido pelas comunidades.",
            "Ubica un límite publicado de Tierra Indígena. No sustituye el conocimiento territorial producido y dirigido por las comunidades."
          )
        }),
        Object.freeze({
          id: "mapbiomas-brasil",
          role: copy("Land-cover context", "Contexto de cobertura da terra", "Contexto de cobertura del suelo"),
          reason: copy(
            "Add annual land-cover context from 1985 onward.",
            "Acrescente contexto anual de cobertura da terra desde 1985.",
            "Añade contexto anual de cobertura del suelo desde 1985."
          )
        }),
        Object.freeze({
          id: "inpe-terrabrasilis",
          role: copy("Forest loss and alerts", "Perda florestal e alertas", "Pérdida forestal y alertas"),
          reason: copy(
            "Compare official annual forest-loss mapping and alerts.",
            "Compare mapeamentos oficiais anuais de perda florestal e alertas.",
            "Compara mapas oficiales anuales de pérdida forestal y alertas."
          )
        }),
        Object.freeze({
          id: "inpe-bdqueimadas",
          role: copy("Fire context", "Contexto de fogo", "Contexto de fuego"),
          reason: copy(
            "Add reported fire activity as context for periods of burning.",
            "Acrescente atividade de fogo reportada para contextualizar períodos de queimada.",
            "Añade actividad de fuego reportada para contextualizar períodos de quema."
          )
        })
      ])
    }),
    Object.freeze({
      id: "water-basin-brazil",
      locales: Object.freeze({
        title: copy(
          "Explore river and rainfall conditions in a basin in Brazil",
          "Explore as condições de rios e chuva em uma bacia no Brasil",
          "Explora las condiciones de ríos y lluvia en una cuenca de Brasil"
        ),
        summary: copy(
          "A starting set of three public sources for station observations and land-cover context.",
          "Um conjunto inicial de três fontes públicas para observações em estações e contexto de cobertura da terra.",
          "Un conjunto inicial de tres fuentes públicas para observaciones de estaciones y contexto de cobertura del suelo."
        ),
        caution: copy(
          "Station records describe where and when instruments operated. Do not treat gaps as conditions across an entire basin; check methods, dates, terms and local knowledge before drawing conclusions.",
          "Registros de estações descrevem onde e quando os instrumentos operaram. Não trate lacunas como condições de toda uma bacia; verifique métodos, datas, termos e conhecimento local antes de tirar conclusões.",
          "Los registros de estaciones describen dónde y cuándo funcionaron los instrumentos. No trates las lagunas como condiciones de toda una cuenca; verifica métodos, fechas, términos y conocimiento local antes de sacar conclusiones."
        )
      }),
      records: Object.freeze([
        Object.freeze({
          id: "ana-hidroweb",
          role: copy("River gauges", "Estações hidrológicas", "Estaciones hidrológicas"),
          reason: copy(
            "Start with reported river level, discharge, rainfall and water-quality observations from station gauges.",
            "Comece por observações reportadas de nível, vazão, chuva e qualidade da água em estações.",
            "Empieza con observaciones reportadas de nivel, caudal, lluvia y calidad del agua en estaciones."
          )
        }),
        Object.freeze({
          id: "inmet-bdmep",
          role: copy("Weather stations", "Estações meteorológicas", "Estaciones meteorológicas"),
          reason: copy(
            "Add daily rainfall and weather observations from nearby stations.",
            "Acrescente observações diárias de chuva e tempo de estações próximas.",
            "Añade observaciones diarias de lluvia y tiempo de estaciones cercanas."
          )
        }),
        Object.freeze({
          id: "mapbiomas-brasil",
          role: copy("Land-cover context", "Contexto de cobertura da terra", "Contexto de cobertura del suelo"),
          reason: copy(
            "Add annual land-cover context without assuming it explains a hydrological change.",
            "Acrescente contexto anual de cobertura da terra sem supor que ele explica uma mudança hidrológica.",
            "Añade contexto anual de cobertura del suelo sin suponer que explica un cambio hidrológico."
          )
        })
      ])
    }),
    Object.freeze({
      id: "biodiversity-records-brazil",
      locales: Object.freeze({
        title: copy(
          "Explore biodiversity records available for a region in Brazil",
          "Explore registros de biodiversidade disponíveis para uma região no Brasil",
          "Explora los registros de biodiversidad disponibles para una región de Brasil"
        ),
        summary: copy(
          "A starting set of three public sources for records, research-network context and protected-area context.",
          "Um conjunto inicial de três fontes públicas para registros, contexto de redes de pesquisa e contexto de áreas protegidas.",
          "Un conjunto inicial de tres fuentes públicas para registros, contexto de redes de investigación y contexto de áreas protegidas."
        ),
        caution: copy(
          "Available records are not a complete account of life in a place. Respect location precision, licenses and collection context; never turn public records into directions to sensitive species or sites.",
          "Registros disponíveis não são uma descrição completa da vida em um lugar. Respeite a precisão da localização, as licenças e o contexto de coleta; nunca transforme registros públicos em instruções para encontrar espécies ou locais sensíveis.",
          "Los registros disponibles no son una descripción completa de la vida en un lugar. Respeta la precisión de ubicación, las licencias y el contexto de recolección; nunca conviertas registros públicos en indicaciones para encontrar especies o sitios sensibles."
        )
      }),
      records: Object.freeze([
        Object.freeze({
          id: "specieslink-network",
          role: copy("Occurrence records", "Registros de ocorrência", "Registros de ocurrencia"),
          reason: copy(
            "Locate Brazilian occurrence records and inspect the collection and record-level context.",
            "Localize registros brasileiros de ocorrência e examine o contexto da coleção e de cada registro.",
            "Ubica registros brasileños de ocurrencia y examina el contexto de la colección y de cada registro."
          )
        }),
        Object.freeze({
          id: "ppbio-brazil-biodiversity-research",
          role: copy("Research-network context", "Contexto de rede de pesquisa", "Contexto de red de investigación"),
          reason: copy(
            "Add the context of long-term, standardized biodiversity monitoring sites.",
            "Acrescente o contexto de sítios de monitoramento de biodiversidade de longo prazo e padronizados.",
            "Añade el contexto de sitios estandarizados de monitoreo de biodiversidad a largo plazo."
          )
        }),
        Object.freeze({
          id: "cnuc-unidades-conservacao",
          role: copy("Protected-area context", "Contexto de área protegida", "Contexto de área protegida"),
          reason: copy(
            "Use published conservation-unit boundaries as context, not as a claim about ecological conditions.",
            "Use limites publicados de unidades de conservação como contexto, não como uma afirmação sobre condições ecológicas.",
            "Usa límites publicados de unidades de conservación como contexto, no como una afirmación sobre condiciones ecológicas."
          )
        })
      ])
    }),
    Object.freeze({
      id: "environmental-pressure-municipality-brazil",
      locales: Object.freeze({
        title: copy(
          "Explore public environmental-pressure records for a municipality in Brazil",
          "Explore registros públicos de pressões ambientais em um município no Brasil",
          "Explora registros públicos de presiones ambientales en un municipio de Brasil"
        ),
        summary: copy(
          "A starting set of four public sources for reported monitoring, fire, enforcement and municipal context.",
          "Um conjunto inicial de quatro fontes públicas para monitoramento reportado, fogo, fiscalização e contexto municipal.",
          "Un conjunto inicial de cuatro fuentes públicas para monitoreo reportado, fuego, fiscalización y contexto municipal."
        ),
        caution: copy(
          "Public records can be incomplete and reflect reporting or enforcement practices. They are not proof of responsibility or a complete map of harm; check methods, dates, terms and local context before making claims.",
          "Registros públicos podem ser incompletos e refletir práticas de reporte ou fiscalização. Eles não são prova de responsabilidade nem um mapa completo de danos; verifique métodos, datas, termos e contexto local antes de fazer afirmações.",
          "Los registros públicos pueden ser incompletos y reflejar prácticas de reporte o fiscalización. No son prueba de responsabilidad ni un mapa completo de daños; verifica métodos, fechas, términos y contexto local antes de hacer afirmaciones."
        )
      }),
      records: Object.freeze([
        Object.freeze({
          id: "inpe-terrabrasilis",
          role: copy("Forest monitoring", "Monitoramento florestal", "Monitoreo forestal"),
          reason: copy(
            "Compare official annual forest-loss mapping and alerts.",
            "Compare mapeamentos oficiais anuais de perda florestal e alertas.",
            "Compara mapas oficiales anuales de pérdida forestal y alertas."
          )
        }),
        Object.freeze({
          id: "inpe-bdqueimadas",
          role: copy("Fire context", "Contexto de fogo", "Contexto de fuego"),
          reason: copy(
            "Add reported fire activity as context for periods of burning.",
            "Acrescente atividade de fogo reportada para contextualizar períodos de queimada.",
            "Añade actividad de fuego reportada para contextualizar períodos de quema."
          )
        }),
        Object.freeze({
          id: "ibama-fiscalizacao-dados-abertos",
          role: copy("Environmental enforcement", "Fiscalização ambiental", "Fiscalización ambiental"),
          reason: copy(
            "Review published federal enforcement records and their administrative limits.",
            "Examine registros publicados de fiscalização federal e seus limites administrativos.",
            "Revisa registros publicados de fiscalización federal y sus límites administrativos."
          )
        }),
        Object.freeze({
          id: "ibge-cidades",
          role: copy("Municipal context", "Contexto municipal", "Contexto municipal"),
          reason: copy(
            "Add official municipal indicators as context without inferring cause or responsibility.",
            "Acrescente indicadores municipais oficiais como contexto, sem inferir causa ou responsabilidade.",
            "Añade indicadores municipales oficiales como contexto, sin inferir causa o responsabilidad."
          )
        })
      ])
    })
  ]);
})();
