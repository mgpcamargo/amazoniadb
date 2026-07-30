(() => {
  const form = document.getElementById("source-form");
  const output = document.querySelector("#record-output code");
  const outputContainer = document.getElementById("record-output");
  const recordActions = document.getElementById("record-actions");
  const previewTitle = document.getElementById("preview-title");
  const previewCopy = document.getElementById("preview-copy");
  const message = document.getElementById("form-message");
  const copyButton = document.getElementById("copy-record");
  const downloadButton = document.getElementById("download-record");
  let currentRecord = null;

  const slugify = (value) => value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);

  const OPTIONAL_RECORD_KEYS = ["temporalCoverage", "spatialResolution", "license", "methodologyUrl"];
  const pageLanguage = (document.documentElement.lang || "en").toLocaleLowerCase();
  const language = pageLanguage.startsWith("pt") ? "pt-BR" : pageLanguage.startsWith("es") ? "es" : "en";
  const copy = {
    en: {
      generatedTitle: "Candidate record generated.",
      generatedCopy: "Copy it into the catalog or download it for a reviewer. Confirm the source terms again before publishing.",
      httpsOnly: "Use an https:// URL.",
      httpOrHttpsOnly: "Use an http:// or https:// URL.",
      incomplete: "Complete the required source and review fields before generating a record.",
      invalidTitle: "Use a source title that contains letters or numbers.",
      generated: "Candidate generated locally. Review it before adding it to the public catalog.",
      initialTitle: "A review-ready record will appear here.",
      initialCopy: "Fill in the details, then generate a candidate. Nothing leaves this browser.",
      copied: "Candidate copied to your clipboard.",
      copyUnavailable: "Copy is unavailable in this browser. Select the record text and copy it manually.",
      downloaded: "Candidate JSON downloaded."
    },
    "pt-BR": {
      generatedTitle: "Registro candidato gerado.",
      generatedCopy: "Copie-o para o catálogo ou baixe-o para uma pessoa revisora. Confirme novamente os termos da fonte antes de publicar.",
      httpsOnly: "Use uma URL com https://.",
      httpOrHttpsOnly: "Use uma URL com http:// ou https://.",
      incomplete: "Preencha os campos obrigatórios da fonte e da revisão antes de gerar um registro.",
      invalidTitle: "Use um título de fonte com letras ou números.",
      generated: "Candidato gerado localmente. Revise-o antes de adicioná-lo ao catálogo público.",
      initialTitle: "Um registro pronto para revisão aparecerá aqui.",
      initialCopy: "Preencha os detalhes e gere um candidato. Nada sai deste navegador.",
      copied: "Candidato copiado para a área de transferência.",
      copyUnavailable: "A cópia não está disponível neste navegador. Selecione o texto do registro e copie-o manualmente.",
      downloaded: "JSON do candidato baixado."
    },
    es: {
      generatedTitle: "Registro candidato generado.",
      generatedCopy: "Cópialo al catálogo o descárgalo para una persona revisora. Confirma de nuevo las condiciones de la fuente antes de publicarlo.",
      httpsOnly: "Usa una URL con https://.",
      httpOrHttpsOnly: "Usa una URL con http:// o https://.",
      incomplete: "Completa los campos obligatorios de la fuente y la revisión antes de generar un registro.",
      invalidTitle: "Usa un título de fuente que contenga letras o números.",
      generated: "Candidato generado localmente. Revísalo antes de añadirlo al catálogo público.",
      initialTitle: "Aquí aparecerá un registro listo para revisión.",
      initialCopy: "Completa los detalles y genera un candidato. Nada sale de este navegador.",
      copied: "Candidato copiado al portapapeles.",
      copyUnavailable: "La copia no está disponible en este navegador. Selecciona el texto del registro y cópialo manualmente.",
      downloaded: "JSON del candidato descargado."
    }
  }[language];

  const toCatalogObject = (record) => {
    const requiredLines = [
      `  id: "${record.id}"`,
      `  title: ${JSON.stringify(record.title)}`,
      `  provider: ${JSON.stringify(record.provider)}`,
      `  category: ${JSON.stringify(record.category)}`,
      `  coverage: ${JSON.stringify(record.coverage)}`,
      `  formats: ${JSON.stringify(record.formats)}`,
      `  access: ${JSON.stringify(record.access)}`,
      `  kind: ${JSON.stringify(record.kind)}`,
      `  description: ${JSON.stringify(record.description)}`,
      `  url: ${JSON.stringify(record.url)}`,
      `  checked: ${JSON.stringify(record.checked)}`
    ];
    const optionalLines = OPTIONAL_RECORD_KEYS
      .filter((key) => record[key])
      .map((key) => `  ${key}: ${JSON.stringify(record[key])}`);
    return `{\n${[...requiredLines, ...optionalLines].join(",\n")}\n}`;
  };

  const generateRecord = () => {
    const values = new FormData(form);
    const id = slugify(values.get("title"));
    const record = {
      id,
      title: values.get("title").trim(),
      provider: values.get("provider").trim(),
      category: values.get("category"),
      coverage: values.get("coverage"),
      formats: values.get("formats").split(",").map((item) => item.trim()).filter(Boolean),
      access: values.get("access"),
      kind: values.get("kind"),
      description: values.get("description").trim(),
      url: values.get("url").trim(),
      checked: new Date().toISOString().slice(0, 10)
    };
    // Optional enrichment — attached only when filled in, and only after the
    // record above is complete, so leaving one blank never reads as a
    // missing required field.
    for (const key of OPTIONAL_RECORD_KEYS) {
      const value = (values.get(key) || "").trim();
      if (value) record[key] = value;
    }
    return record;
  };

  const showRecord = (record) => {
    currentRecord = record;
    output.textContent = toCatalogObject(record);
    outputContainer.hidden = false;
    recordActions.hidden = false;
    previewTitle.textContent = copy.generatedTitle;
    previewCopy.textContent = copy.generatedCopy;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const url = form.elements.url;
    const methodologyUrl = form.elements.methodologyUrl;
    url.setCustomValidity(url.value && !url.value.startsWith("https://") ? copy.httpsOnly : "");
    methodologyUrl.setCustomValidity(methodologyUrl.value && !/^https?:\/\//i.test(methodologyUrl.value) ? copy.httpOrHttpsOnly : "");
    if (!form.checkValidity()) {
      form.reportValidity();
      message.textContent = copy.incomplete;
      return;
    }
    const record = generateRecord();
    if (!record.id) {
      message.textContent = copy.invalidTitle;
      return;
    }
    showRecord(record);
    message.textContent = copy.generated;
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      currentRecord = null;
      output.textContent = "";
      outputContainer.hidden = true;
      recordActions.hidden = true;
      previewTitle.textContent = copy.initialTitle;
      previewCopy.textContent = copy.initialCopy;
      message.textContent = "";
    }, 0);
  });

  copyButton.addEventListener("click", async () => {
    if (!currentRecord) return;
    try {
      await navigator.clipboard.writeText(toCatalogObject(currentRecord));
      message.textContent = copy.copied;
    } catch {
      message.textContent = copy.copyUnavailable;
    }
  });

  downloadButton.addEventListener("click", () => {
    if (!currentRecord) return;
    const blob = new Blob([`${JSON.stringify(currentRecord, null, 2)}\n`], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${currentRecord.id || "amazoniadb-source"}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    message.textContent = copy.downloaded;
  });
})();
