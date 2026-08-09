#!/usr/bin/env node
/**
 * Copies the standalone static site `salt-plant-3d/` into `public/salt-plant-3d/`
 * so that Next.js (dev + `next build` export) serves it at `/salt-plant-3d/index.html`.
 *
 * `salt-plant-3d/` is the editable source (kept at repo root); `public/salt-plant-3d/`
 * is the generated artifact that gets deployed. Run this whenever you edit the source.
 *
 * Used by:
 *   - `npm run sync:salt-plant`   (manual / before dev & build)
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const src = path.join(root, "salt-plant-3d");
const dest = path.join(root, "public", "salt-plant-3d");

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

fs.cpSync(src, dest, { recursive: true });

console.log(`✓ synced salt-plant-3d → public/salt-plant-3d (served at /salt-plant-3d/index.html)`);
