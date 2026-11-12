import { mkdir, cp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
await mkdir(dist, { recursive: true });
await cp(path.join(root, "assets"), path.join(dist, "assets"), {
  recursive: true,
});
const html = await readFile(path.join(root, "index.html"), "utf8");
await writeFile(path.join(dist, "index.html"), html);
await cp(path.join(root, "LICENSE"), path.join(dist, "LICENSE"));
for (const lang of ["zh", "en"]) {
  await mkdir(path.join(dist, lang), { recursive: true });
  await mkdir(path.join(root, lang), { recursive: true });
  const translated = html
    .replace(
      '<html lang="zh-CN">',
      `<html lang="${lang === "en" ? "en" : "zh-CN"}">`,
    )
    .replaceAll('href="assets/', 'href="../assets/')
    .replaceAll('src="assets/', 'src="../assets/');
  await writeFile(path.join(root, lang, "index.html"), translated);
  await writeFile(path.join(dist, lang, "index.html"), translated);
}
const pdf = path.join(root, "node_modules", "pdfjs-dist");
for (const dest of [path.join(root, "vendor"), path.join(dist, "vendor")]) {
  await mkdir(dest, { recursive: true });
  for (const name of ["pdf.mjs", "pdf.worker.mjs"])
    await cp(path.join(pdf, "build", name), path.join(dest, name));
  for (const dir of ["cmaps", "standard_fonts", "wasm"])
    await cp(path.join(pdf, dir), path.join(dest, dir), { recursive: true });
  await cp(path.join(pdf, "LICENSE"), path.join(dest, "PDFJS-LICENSE"));
}
await writeFile(path.join(dist, ".nojekyll"), "");
console.log(
  "Built dist/ with Chinese and English entry points and offline PDF.js assets.",
);
