#!/usr/bin/env node
/**
 * Builds the vacuum-salt subproject with basePath=/vacuum-salt and merges its
 * static export into diagonal's ./out/vacuum-salt, so that /vacuum-salt/
 * resolves on the deployed site.
 *
 * Used by:
 *   - .github/workflows/deploy.yml  (CI deploy)
 *   - `npm run build:with-vacuum`    (local full build)
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const vsDir = path.join(root, "vacuum-salt");
const vsOut = path.join(vsDir, "out");
const dest = path.join(root, "out", "vacuum-salt");
const basePath = "/vacuum-salt";

function run(cmd, cwd, extraEnv) {
  execSync(cmd, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
}

console.log("→ [vacuum-salt] installing dependencies");
run("npm install", vsDir);

console.log(`→ [vacuum-salt] building (NEXT_PUBLIC_BASE_PATH=${basePath})`);
run("npm run build", vsDir, { NEXT_PUBLIC_BASE_PATH: basePath });

if (!fs.existsSync(vsOut)) {
  console.error(`✗ vacuum-salt export not found at ${vsOut}`);
  process.exit(1);
}

console.log(`→ merging export into ${path.relative(root, dest)}`);
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(vsOut, dest, { recursive: true });

console.log("✓ vacuum-salt is now served at /vacuum-salt/");
