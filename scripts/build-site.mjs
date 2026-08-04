// Builds the intentionally public Pages artifact. The repository contains
// reviewer notes and contributor material that belong on GitHub, not on the
// public website, so deployment must never upload the whole checkout.
import { cp, mkdir, rm } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const output = new URL("../dist/", import.meta.url);
const publicFiles = [
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
  "sitemap.xml"
];
const publicDirectories = ["api", "data", "en", "es", "pt-br"];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of publicFiles) {
  await cp(new URL(file, root), new URL(file, output));
}
for (const directory of publicDirectories) {
  await cp(new URL(`${directory}/`, root), new URL(`${directory}/`, output), { recursive: true });
}

console.log(`Built public Pages artifact with ${publicFiles.length} files and ${publicDirectories.length} directories.`);
