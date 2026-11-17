// main.ts — hands the make.fun frontend entry in.
//
// Copies app/ and screenshots/ from beside this file into the output
// directory (process.env.MAKEFUN_OUTPUT_DIR, or /output by default) and
// writes /output/dossier.json with buildDossier from
// ./vendor/makefun-frontend.ts.
//
// Node 22, standard library only. Run it with:
//   MAKEFUN_OUTPUT_DIR=/tmp/fe-out node main.ts

import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");

const appDir = join(here, "app");
const shotsDir = join(here, "screenshots");

function listFiles(dir: string): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) found.push(...listFiles(full));
    else found.push(full);
  }
  return found.sort();
}

function copyTree(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
}

function main(): void {
  if (!existsSync(appDir)) {
    throw new Error(`app/ directory not found next to main.ts: ${appDir}`);
  }
  if (!existsSync(shotsDir)) {
    throw new Error(`screenshots/ directory not found next to main.ts: ${shotsDir}`);
  }

  mkdirSync(outDir, { recursive: true });

  // Copy the app and the screenshots into the output directory.
  copyTree(appDir, join(outDir, "app"));
  copyTree(shotsDir, join(outDir, "screenshots"));

  // Also copy the small root files the entry is made of, so the output
  // is a self-contained copy of the repository.
  for (const name of ["README.md", "LICENSE", "shots.json", "serve.ts", "main.ts"]) {
    const src = join(here, name);
    if (existsSync(src)) copyFileSync(src, join(outDir, name));
  }
  const ownerSrc = join(here, ".makefun", "owner.json");
  if (existsSync(ownerSrc)) {
    mkdirSync(join(outDir, ".makefun"), { recursive: true });
    copyFileSync(ownerSrc, join(outDir, ".makefun", "owner.json"));
  }

  const appFiles = listFiles(join(outDir, "app"));
  const shotFiles = listFiles(join(outDir, "screenshots"));

  // Guard found by testing: buildDossier refuses a screenshots/ with no
  // image, more than 3 images, or any image over 256 KiB — and the first
  // screenshot run in this session produced error pages, which are valid
  // JPEGs but useless. Fail loudly here, before writing a dossier, when
  // the shots are not exactly 3 JPEGs within the byte cap.
  const shots = shotFiles.filter((f) => /\.(jpe?g|png)$/i.test(f));
  if (shots.length !== 3 || shots.length !== shotFiles.length) {
    throw new Error(
      `screenshots/ must hold exactly 3 JPEG/PNG files, found ${shotFiles.length} (${shots.length} images)`
    );
  }
  for (const shot of shots) {
    const size = statSync(shot).size;
    if (size > 262144) {
      throw new Error(`screenshot over the 256 KiB cap: ${shot} (${size} bytes)`);
    }
  }

  // buildDossier(dir, caps) reads app/ and screenshots/ out of the
  // directory it is given and returns the dossier as canonical JSON
  // bytes — so it runs on the output directory, after the copy above,
  // and its bytes are written to dossier.json verbatim.
  const dossierBytes = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 3, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  });

  const dossierPath = join(outDir, "dossier.json");
  writeFileSync(dossierPath, dossierBytes);

  // Read-back: the dossier must parse as JSON before we report success.
  const parsed = JSON.parse(readFileSync(dossierPath, "utf8"));
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`dossier.json did not parse as a JSON object: ${dossierPath}`);
  }

  console.log(`Copied ${appFiles.length} app files and ${shotFiles.length} screenshots to ${outDir}`);
  console.log(`Wrote ${dossierPath} (${dossierBytes.length} bytes)`);
}

main();
