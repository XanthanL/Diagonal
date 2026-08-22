#!/usr/bin/env node
/**
 * Copies the standalone static site `salt-plant-3d/` into `public/salt-plant-3d/`
 * so that Next.js (dev + `next build` export) serves it at `/salt-plant-3d/index.html`.
 *
 * `salt-plant-3d/` is the editable source (kept at repo root); `public/salt-plant-3d/`
 * is the generated artifact that gets deployed. This script runs automatically:
 *   - before `next dev`   (npm run dev hook)
 *   - before `next build` (prebuild hook — keeps CI deploys in sync with the committed source)
 *   - manually via        (npm run sync:salt-plant)
 *
 * Excluded from sync (local working material, never deployed):
 *   - images/        reference photos (not committed; deleted after use)
 *   - .img2threejs/  img2threejs skill working directory
 *   - tools/         developer CDP utilities (tracked at repo level, not deploy content)
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const src = path.join(root, "salt-plant-3d");
const dest = path.join(root, "public", "salt-plant-3d");

// Top-level entries never copied into the deployable artifact.
const EXCLUDED_TOP_LEVEL = new Set(["images", ".img2threejs", "tools"]);

if (!fs.existsSync(src)) {
  console.error(`✗ source not found: ${src}`);
  process.exit(1);
}

// Best-effort cleanup: in some sandboxed environments rmSync is intercepted,
// so we don't fail hard — cpSync below overwrites existing files anyway.
try {
  fs.rmSync(dest, { recursive: true, force: true });
} catch (e) {
  console.warn(`⚠ could not remove old ${path.relative(root, dest)} (${e.message}); overwriting instead`);
}

fs.cpSync(src, dest, {
  recursive: true,
  filter: (entryPath) => {
    const rel = path.relative(src, entryPath);
    if (rel === "") return true; // the source root itself always passes
    const top = rel.split(path.sep)[0];
    return !EXCLUDED_TOP_LEVEL.has(top);
  },
});

console.log(
  `✓ synced salt-plant-3d → public/salt-plant-3d (excluded: ${[...EXCLUDED_TOP_LEVEL].join(", ")})`
);
