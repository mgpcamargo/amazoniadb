// Verifies the allowlisted Pages artifact after build-site.mjs has run.
// Internal contributor and reviewer material must remain in the repository,
// never in the public deployment.
import { access } from "node:fs/promises";

const output = new URL("../dist/", import.meta.url);
const required = [
  "index.html",
  "donate.html",
  "submit.html",
  "app.js",
  "submit.js",
  "theme.js",
  "styles.css",
  "favicon.svg",
  "og-image.png",
  "robots.txt",
  "sitemap.xml",
  "data/catalog.js",
  "data/catalog.schema.json",
  "api/v1/catalog.json",
  "en/index.html",
  "es/index.html",
  "pt-br/index.html"
];
const privatePaths = [
  "README.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "SOURCES-TO-VERIFY.md",
  ".github"
];
const exists = async (path) => {
  try {
    await access(new URL(path, output));
    return true;
  } catch {
    return false;
  }
};

const missing = [];
for (const path of required) {
  if (!(await exists(path))) missing.push(path);
}
const exposed = [];
for (const path of privatePaths) {
  if (await exists(path)) exposed.push(path);
}

if (missing.length || exposed.length) {
  if (missing.length) console.error(`Public artifact is missing: ${missing.join(", ")}`);
  if (exposed.length) console.error(`Public artifact exposes private paths: ${exposed.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`Public artifact check passed: ${required.length} required paths present; reviewer material excluded.`);
}
