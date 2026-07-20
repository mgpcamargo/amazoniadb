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
    previewTitle.textContent = "Candidate record generated.";
    previewCopy.textContent = "Copy it into the catalog or download it for a reviewer. Confirm the source terms again before publishing.";
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const url = form.elements.url;
    url.setCustomValidity(url.value && !url.value.startsWith("https://") ? "Use an https:// URL." : "");
    if (!form.checkValidity()) {
      form.reportValidity();
      message.textContent = "Complete the required source and review fields before generating a record.";
      return;
    }
    const record = generateRecord();
    if (!record.id) {
      message.textContent = "Use a source title that contains letters or numbers.";
      return;
    }
    showRecord(record);
    message.textContent = "Candidate generated locally. Review it before adding it to the public catalog.";
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      currentRecord = null;
      output.textContent = "";
      outputContainer.hidden = true;
      recordActions.hidden = true;
      previewTitle.textContent = "A review-ready record will appear here.";
      previewCopy.textContent = "Fill in the details, then generate a candidate. Nothing leaves this browser.";
      message.textContent = "";
    }, 0);
  });

  copyButton.addEventListener("click", async () => {
    if (!currentRecord) return;
    try {
      await navigator.clipboard.writeText(toCatalogObject(currentRecord));
      message.textContent = "Candidate copied to your clipboard.";
    } catch {
      message.textContent = "Copy is unavailable in this browser. Select the record text and copy it manually.";
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
    message.textContent = "Candidate JSON downloaded.";
  });
})();
