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

  const toCatalogObject = (record) => `{
  id: "${record.id}",
  title: ${JSON.stringify(record.title)},
  provider: ${JSON.stringify(record.provider)},
  category: ${JSON.stringify(record.category)},
  coverage: ${JSON.stringify(record.coverage)},
  formats: ${JSON.stringify(record.formats)},
  access: ${JSON.stringify(record.access)},
  kind: ${JSON.stringify(record.kind)},
  description: ${JSON.stringify(record.description)},
  url: ${JSON.stringify(record.url)},
  checked: ${JSON.stringify(record.checked)}
}`;

  const generateRecord = () => {
    const values = new FormData(form);
    const id = slugify(values.get("title"));
    return {
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
  };

  const showRecord = (record) => {
    currentRecord = record;
    output.textContent = toCatalogObject(record);
    outputContainer.hidden = false;
    recordActions.hidden = false;
    previewTitle.textContent = "Registro candidato generado.";
    previewCopy.textContent = "Cópialo en el catálogo o descárgalo para un revisor. Confirma nuevamente los términos de la fuente antes de publicar.";
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const url = form.elements.url;
    url.setCustomValidity(url.value && !url.value.startsWith("https://") ? "Usa una URL https://." : "");
    if (!form.checkValidity()) {
      form.reportValidity();
      message.textContent = "Completa los campos obligatorios de la fuente y de la revisión antes de generar un registro.";
      return;
    }
    const record = generateRecord();
    if (!record.id) {
      message.textContent = "Usa un título de fuente que contenga letras o números.";
      return;
    }
    showRecord(record);
    message.textContent = "Candidato generado localmente. Revísalo antes de agregarlo al catálogo público.";
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      currentRecord = null;
      output.textContent = "";
      outputContainer.hidden = true;
      recordActions.hidden = true;
      previewTitle.textContent = "Aquí aparecerá un registro listo para revisión.";
      previewCopy.textContent = "Completa los detalles y genera un candidato. Nada sale de este navegador.";
      message.textContent = "";
    }, 0);
  });

  copyButton.addEventListener("click", async () => {
    if (!currentRecord) return;
    try {
      await navigator.clipboard.writeText(toCatalogObject(currentRecord));
      message.textContent = "Candidato copiado al portapapeles.";
    } catch {
      message.textContent = "La copia no está disponible en este navegador. Selecciona el texto del registro y cópialo manualmente.";
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
    message.textContent = "JSON del candidato descargado.";
  });
})();
