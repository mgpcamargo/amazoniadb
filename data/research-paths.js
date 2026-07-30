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
    })
  ]);
})();
