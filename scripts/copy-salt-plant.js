#!/usr/bin/env node
/**
 * Syncs each standalone static sub-site (its editable source lives at repo root)
 * into `public/<site>/` so Next.js (dev + `next build` export) serves it at
 * `/<site>/index.html`. Runs automatically:
 *   - before `next dev`   (npm run dev hook)
 *   - before `next build` (prebuild hook — keeps CI deploys in sync with committed source)
 *   - manually via        (npm run sync:salt-plant — syncs all sub-sites)
 *
 * `public/<site>/` is a generated artifact — never committed (see .gitignore).
 * Per-site excluded top-level entries = local working material, not deploy content.
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

// Each entry: { site, exclude } — exclude = top-level dirs never copied into the artifact.
const SITES = [
  { site: "salt-plant-3d", exclude: ["images", ".img2threejs", "tools"] },
  { site: "gatehouse-3d", exclude: ["docs", "images", ".img2threejs", "tools"] },
];

let didAny = false;
for (const { site, exclude } of SITES) {
  const src = path.join(root, site);
  const dest = path.join(root, "public", site);
  if (!fs.existsSync(src)) {
    console.warn(`⚠ source not found, skipping: ${site}/`);
    continue;
  }
  const EXCLUDED = new Set(exclude);
  // Best-effort cleanup (some sandboxes intercept rmSync; cpSync overwrites regardless).
  try {
    fs.rmSync(dest, { recursive: true, force: true });
  } catch (e) {
    console.warn(`⚠ could not remove old public/${site} (${e.message}); overwriting instead`);
  }
  fs.cpSync(src, dest, {
    recursive: true,
    filter: (entryPath) => {
      const rel = path.relative(src, entryPath);
      if (rel === "") return true;
      const top = rel.split(path.sep)[0];
      return !EXCLUDED.has(top);
    },
  });
  console.log(`✓ synced ${site} → public/${site} (excluded: ${[...EXCLUDED].join(", ")})`);
  didAny = true;
}

if (!didAny) {
  console.error("✗ no sub-site sources found to sync");
  process.exit(1);
}
