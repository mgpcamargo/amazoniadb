// Exercises the issue-form builder against disposable copies of both data
// files. This proves that an automated submission can produce the catalog,
// localized content, and API-ready file state required by the quality gate
// without touching the working tree.

import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import vm from "node:vm";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const temp = await mkdtemp(join(tmpdir(), "amazoniadb-source-submission-"));
const catalogPath = join(temp, "catalog.js");
const i18nPath = join(temp, "catalog.i18n.js");

const form = {
  url: "https://example.org/quality-fixture",
  title: "Quality Fixture Source",
  provider: "Quality Fixture Institute",
  category: "Earth, water & climate",
  coverage: "Brazil",
  kind: "Dataset",
  access: "Publicly available",
  formats: "CSV, API",
  description: "A deterministic fixture used only to validate the source-submission record builder.",
  description_pt_br: "Um registro de teste determinístico usado apenas para validar o gerador de registros de submissão.",
  description_es: "Un registro de prueba determinista utilizado solo para validar el generador de registros de envío.",
  spatial_resolution: "1 km (quality fixture)",
  spatial_resolution_pt_br: "1 km (registro de teste)",
  spatial_resolution_es: "1 km (registro de prueba)"
};

try {
  await Promise.all([
    copyFile(join(root, "data/catalog.js"), catalogPath),
    copyFile(join(root, "data/catalog.i18n.js"), i18nPath)
  ]);
  await execFileAsync(process.execPath, ["scripts/issue-to-entry.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      CATALOG_PATH: catalogPath,
      I18N_PATH: i18nPath,
      ISSUEFORM_JSON: JSON.stringify(form),
      SUBMITTED_BY: "quality-fixture"
    }
  });

  const catalogContext = { window: {} };
  const i18nContext = { window: {} };
  vm.runInNewContext(await readFile(catalogPath, "utf8"), catalogContext);
  vm.runInNewContext(await readFile(i18nPath, "utf8"), i18nContext);
  const record = catalogContext.window.AMAZONIA_CATALOG.find((entry) => entry.id === "quality-fixture-source");
  if (!record) throw new Error("The generated catalog record is missing.");
  if (record.spatialResolution !== form.spatial_resolution) throw new Error("The generated spatial resolution is missing.");
  for (const [locale, description, resolution] of [
    ["pt-BR", form.description_pt_br, form.spatial_resolution_pt_br],
    ["es", form.description_es, form.spatial_resolution_es]
  ]) {
    const localized = i18nContext.window.AMAZONIA_CATALOG_I18N?.[locale];
    if (localized?.descriptions?.[record.id] !== description) throw new Error(`Missing ${locale} description.`);
    if (localized?.spatialResolution?.[form.spatial_resolution] !== resolution) throw new Error(`Missing ${locale} spatial-resolution translation.`);
  }
  console.log("Source-submission builder test passed.");
} finally {
  await rm(temp, { recursive: true, force: true });
}
