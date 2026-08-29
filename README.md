# Diagonal 对角线计划 — Website & Archive

[English](README.md) · [中文](README.zh-CN.md)

**Live site:** <https://www.diagonal-art.com>

This repository is the source of the official website for **Diagonal (对角线计划)**, a long-running art project that stretches from north-east China (Hegang) to the south-west (Zigong, Chengdu). The site is a bilingual, static archive of the project's documents, image atlases, artist files and interactive 3D reconstructions of industrial salt-making equipment.

It is **not** a data pipeline or a headless CMS: the archive itself is plain HTML/JSON committed to this repo, and the site is a static export of it.

## What the site contains

| Route | Purpose |
|---|---|
| `/` | Index-style home page: latest documents, atlas collections, and the Lab entries |
| `/archive` | Faceted index of all documents (exhibition records, residency reports, curatorial texts) |
| `/archive/[id]` | A single document, rendered from its committed HTML |
| `/atlas` | Image-led collections with sub-collections |
| `/artists` | Artist files for project participants |
| `/projects/[project]` | Long-form project overviews |
| `/lab/salt-particle` | Real-time salt-crystal particle simulation |
| `/colophon` | Colophon: the making of the site, with the developer's own work index |
| `/admin` | Browser-only content console (see below) |

All copy exists in Chinese and English; the language is a client-side preference stored in `localStorage`.

## Content console (`/admin`)

Editors publish without a local toolchain: the console runs entirely in the browser and commits straight to this repository through the GitHub REST API, after which CI rebuilds the site (roughly 1–2 minutes).

- Authentication is a **GitHub Fine-grained Personal Access Token** that you paste once; it is stored only in that browser's `localStorage` and is never bundled or uploaded anywhere by this codebase.
- Configure it with the smallest possible grant: **Only select repositories → this repo**, **Contents: Read and write**, everything else *Not required*, and a short expiry.
- Document bodies are sanitised against a tag/attribute allow-list before rendering (`src/lib/sanitizeArchiveHtml.ts`), which keeps pasted-in scripts, event handlers and externalised styles out of the page.

Because publishing writes to `main` and CI deploys `main`, the meaningful security boundary is repository-level, not browser-level. If you fork this project, enable **branch protection** on `main` and **deployment protection** on the Pages environment before handing out tokens.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14, App Router, fully static export (`output: "export"`) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Motion | Framer Motion (plus CSS animations for anything looping) |
| Editor | TipTap 2.x |
| 3D | Vendored `three` r160, procedural models written in code |
| Hosting | GitHub Pages via GitHub Actions |

## Repository layout

```
src/app/            routes, layouts, globals.css (design primitives live here)
src/components/     page furniture, archive/atlas views, admin console
src/content/archive committed document bodies (.html, one per language) + _store/index.json
src/lib/            data loading, i18n, path helpers, sanitiser, admin plumbing
salt-plant-3d/      standalone 3D subsite: the timber derrick (well-head tower)
gatehouse-3d/       standalone 3D subsite: a fictional gatehouse in voxel form
vacuum-salt/        standalone 3D subsite: the vacuum salt-making line
scripts/            image variant generation, subsite sync, deploy helpers
.impeccable.md      the design context this repo's UI is held to
COORDINATION.md     multi-session build rules: shared files, subsite sync discipline
```

The three `*-3d/` directories are **independent static apps**. The repo root is the single source of truth; their copies under `public/` are generated at build time and are git-ignored.

Two rules matter when touching them:

1. `three` is pinned to r160 and vendored per subsite so each remains self-contained after export.
2. A new subsite entry point must also be registered in `isStandaloneSubproject()` in `src/components/PageTransition.tsx`. Without it, the client-side router intercepts the click, looks for an App Router route that does not exist, and lands on a 404.

## Local development

```bash
npm install
npm run dev            # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Syncs the 3D subsites into `public/`, then starts the dev server |
| `npm run build` | Generates responsive image variants and syncs subsites (`prebuild`), then statically exports to `out/` |
| `npm run images` | Regenerates `.w480/.w960/.w1600` WebP variants used by article `srcset` |
| `npm run sync:salt-plant` | Re-copies the 3D subsites by hand |

Note that fonts are fetched from Google Fonts at build time; offline or proxied networks fall back to system fonts, which is cosmetic, not an error.

## Deployment

`.github/workflows/deploy.yml` builds on push to `main` and publishes to GitHub Pages with scoped `GITHUB_TOKEN` permissions (`contents: read`, `pages: write`, `id-token: write`) — no long-lived secrets are stored in the workflow. The custom domain comes from `CNAME`.

## License

The **code** in this repository is released under the MIT License — see [`LICENSE`](LICENSE).

This grant covers code only. **Text, photographs and other archival material are not licensed under MIT** and remain © their respective authors; the site's own essays and documentation are offered under CC BY-NC 4.0 unless a specific entry states otherwise, and images carry per-entry credit and may be subject to third-party rights. See [`LICENSE`](LICENSE) and the colophon for the split.
