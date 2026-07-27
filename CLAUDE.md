# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A single-page, scroll-driven digital lookbook/catalog ("Angel de Canela — Ariel Collection") built with Next.js App Router, React 19, and TypeScript. It was migrated (Fase 1.1) from a static `page-catalogo.html/.css/.js` prototype into componentized Next.js — that legacy prototype and the original backup are kept under `archive/` for reference only; do not edit them or treat them as the source of truth.

## Commands

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — Next.js ESLint

There is no test suite configured in this repo.

## Architecture

**Content/markup separation is the core design principle.** All catalog copy, prices, image paths, and per-colorway data live in `data/catalogs/ariel.json` — plain structured data, not code. Components are pure rendering shells that take this data as props — never hardcode catalog text/prices/images inside a component; add or edit them in the catalog's `.json` file instead.

**Data model (`data/schema.ts`, since Phase 3)**: the *shape* any catalog can have — Zod schemas for every section's data (`CoverDataSchema`, `ProductVariantSchema`, etc.) and the `Block` discriminated union (`{ type, data }`, one variant per section kind: `cover`, `manifesto`, `productHero`, `chapterHero`, `productDetail`, `closing`) — lives here, and is completely agnostic of Ariel/dresses/soles. All exported TypeScript types (`CoverData`, `ProductVariant`, `Block`, ...) are derived from these schemas via `z.infer`, so the compile-time type and the runtime contract can't drift apart. `data/catalogs/ariel.ts` (since Phase 5: a thin loader, not the content itself) imports `ariel.json` and validates it against `CatalogBlocksSchema.parse(...)` when the module loads — malformed content fails loudly in build/dev, not silently in production. A second catalog is a new `data/catalogs/<name>.json` + a matching one-line `<name>.ts` loader, not a schema change.

**GitHub commits (`lib/github.ts`, since Phase 5, rebuilt Phase 8)**: the site is statically generated (Vercel) — there's no writable filesystem in production, so "saving" anything (catalog JSON or an uploaded image) means committing straight to the repo (`GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH` env vars), which lands on the deploy branch and triggers Vercel's normal redeploy — there is no separate "publish" step. `commitFile(path, base64Content, message)` goes through the Git Data API (blob → tree → commit → move the branch ref), not the simpler "contents" API — that one caps out at 1MB per file, and this catalog's real photos run 1.5–2.6MB, so it would silently fail on exactly the files that matter. Every commit re-reads the branch HEAD first, so it only really supports one admin editing at a time (acceptable for the current single-admin scope; documented here so it isn't a silent surprise later). This module is `import "server-only"` — it must never be reachable from client-side code (it holds the GitHub token).

**Catalog persistence (`lib/catalogStore.ts`, since Phase 5)**: `saveCatalog(catalogId, candidateBlocks)` always validates with `CatalogBlocksSchema.safeParse` *before* calling `commitFile`; on failure (validation, missing config, or a GitHub API error) it returns `{ ok: false, error, issues? }` — it never throws, so a caller (a Server Action awaited from a client `useTransition`) can't be left hanging on an uncaught rejection.

**Asset library (`lib/assets.ts` + `components/admin/ImagePicker.tsx`, since Phase 8)**: `listAssets()` reads `public/imagenes/` directly (server-side `fs.readdir`); `uploadAsset()` validates the extension, sanitizes/deduplicates the filename, and commits via `commitFile`. Every image field in the admin (`bgImage`, collage `src`, swatch `image`) is an `ImagePicker` instead of a bare text field — text entry still works, but it also opens a gallery of everything in `listAssets()` plus an upload button. All `ImagePicker`s share one list through `AssetsContext` (`components/admin/AssetsContext.tsx`) so an image uploaded from one field is immediately pickable from every other field, without prop-drilling the list through `BlockList`/`BlockForm`/the nested field editors, none of which otherwise need to know assets exist. A freshly uploaded image is only committed to GitHub, not yet present in the running deployment's `public/` — the picker shows it via a local `blob:` URL (`ClientAsset.previewUrl`) until the next deploy actually serves it. `next.config.ts` raises `experimental.serverActions.bodySizeLimit` to `8mb` — the default (1MB) is smaller than this catalog's real photos even before the ~33% base64 inflation the upload Server Action pays for.

**Admin auth (`lib/auth.ts` + `lib/session.ts` + `proxy.ts`, since Phase 5)**: single-admin credentials (`ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH`, a bcrypt hash — never a plaintext env var) via `bcryptjs`. Sessions are a `jose`-signed JWT (not `jsonwebtoken` — it doesn't run on the Edge runtime) in an httpOnly cookie. `lib/auth.ts` has no Next-specific imports so it's safe for `proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`; same API) to import it in the Edge runtime; `lib/session.ts` holds `requireSession()` (`next/headers` + `next/navigation`, Node-only) for Server Components/Actions. `proxy.ts` redirecting unauthenticated `/admin/*` requests is only the first line of defense — per Next's own guidance, Proxy is an "optimistic check," not a full auth solution — so `/admin/page.tsx` and `app/admin/actions.ts` both call `requireSession()` again before rendering or mutating anything. `lib/rateLimiter.ts` locks out `loginAction` after 5 failed attempts (5 minutes, keyed by IP+username) — in-memory, per process instance, no new infra (KV/Redis). Not bulletproof against a distributed attacker across many cold serverless starts, but it's a real, working stop against the actual threat this login form faces: a simple scripted brute force with no other protections in front of it.

**Admin UI (`app/admin/`, `components/admin/`, since Phase 5, multi-catalog post-Phase-9)**: `/admin` lists every entry in the registry as a card (same `Object.entries(catalogs)` pattern as the public index) plus `AddCatalogForm`; `/admin/[id]` is the actual editor, `notFound()` off the registry, rendering `AdminEditor` (client component) seeded with that one catalog's `blocks`/`theme`. Each block gets a form via `BlockForm` (same exhaustive-switch shape as `BlockRenderer`, one per `Block` type) built from small reusable pieces in `components/admin/fields/` (`TextField`, `TextAreaField`, `SelectField`, `StringListEditor`, `CollageImagesEditor`, `SwatchesEditor`, `ThemeEditor`). Reordering is up/down buttons on `BlockList`, never drag-and-drop (Non Goal). `pageNumber` is never a form field — `app/admin/actions.ts` recomputes it from array position on save, so reordering/adding/removing blocks can't produce duplicate or out-of-order page numbers. "Guardar y publicar" calls `saveCatalogAction(catalogId, theme, blocks)`, which re-checks the session, then calls `saveCatalog`.

**Creating a catalog (`lib/newCatalog.ts` + `lib/catalogStore.ts`'s `createCatalog`, post-Phase-9)**: `AddCatalogForm` takes just a name; `createStarterCatalog(name)` composes a full starter — cover, manifesto, product hero, two colorway pairs, closing — with real editorial-style placeholder copy and its own bold theme (not Ariel's palette), using the photos already in `public/imagenes/` as placeholders, rather than an empty scaffold the admin has to build up block by block. `createCatalog` then validates it against `CatalogEntrySchema` and commits 3 files in one atomic commit via `commitFiles` (`lib/github.ts`, extended from the single-file `commitFile` for exactly this): the new catalog's `.json`, its one-line `.ts` loader, and `data/catalogs/index.ts` **fully regenerated** (not patched) from the current registry's ids plus the new one — regenerating from scratch is deliberate, since the file is short and completely derivable from the id list, which is more robust than text-patching an import list that only gets more fragile as catalogs accumulate. Verified by writing the exact generated `.json`/`.ts`/`index.ts` output into the real project and running `tsc --noEmit` + `npm run build` against it (not a mocked unit test) — both a second `/catalog/<id>` route and a second `catalog-<id>.pdf` came out correctly with zero code changes elsewhere, confirming the registry-driven design from Phase 4 actually delivers on "adding a catalog needs zero routing changes" now that it's exercised for real. `scripts/generate-pdf.mjs` no longer hardcodes `CATALOG_ID = "ariel"` — it lists `data/catalogs/*.json` and prints one PDF per catalog it finds, so a catalog created from the panel gets a working download link on its very next build without any script change.

"Vista previa" opens `components/admin/PreviewOverlay.tsx`, which renders the editor's live, unsaved `items` state through the exact same `CatalogRenderer` the public site uses (via `createPortal` to `document.body`, so it isn't nested inside the admin's own `<main>`) — so what the admin sees before saving is guaranteed to match what publishing would actually produce, not a separate preview renderer that could drift from the real one. It recomputes `pageNumber` from array position the same way `app/admin/actions.ts` does on save, for the same reason. Its scroll container is the overlay `<div>` itself (`overflow-y: auto`, body scroll locked while open), not `window` — so `scroll-snap-type` has to be repeated on `.admin-preview-overlay` in `admin.css`; the public site's copy on `html` doesn't reach into a nested scroll container.

**Templates (`lib/templates.ts`, since Phase 6)**: a "template" is a composition of existing blocks, not a new data type or component (Non Goal: "do not duplicate components to create new templates") — `data/schema.ts` has no concept of templates at all. `createColorwayBlocks(input)` returns the linked `[ChapterHero, ProductDetail]` pair (shared `id`/`name`, swatch + collage image pre-filled from one background image) that `components/admin/AddColorwayForm.tsx` inserts into `AdminEditor`'s state in one step, instead of the admin adding and hand-linking two independent blocks. Purely an admin-panel composition helper — it produces plain `Block[]` the same as any other addition, so it doesn't touch rendering, the schema, or the save pipeline. `input.swatch` is `{ type: "image" }` or `{ type: "color", color }` — the swatch *chip* can be a flat color instead of a cropped photo (some colorways don't have a clean close-up to crop from); this only affects `SwatchItem`, which was already a discriminated union in `data/schema.ts` since Phase 3, so no schema change was needed, just a second constructor path.

**Catalog theme (`data/schema.ts`'s `CatalogThemeSchema`, post-Phase-9)**: each catalog entry is `{ theme, blocks }`, not a bare `Block[]` — `CatalogTheme` is 5 colors (`ink`/`paper`/`line`/`muted`/`accent`, the same names as the CSS custom properties in `app/globals.css`'s `:root`) plus 2 font stacks (`displayFont` for the two serif "hero moment" titles — cover, closing — `bodyFont` for everything else). `CatalogRenderer` applies it as inline CSS custom properties on its own `<main className="catalog-root">`, so it only overrides `:root`'s defaults for that catalog's render tree — Ariel keeps the exact values `:root` already had, so a second catalog with its own theme is zero regression for Ariel. Free colors, not a fixed preset list — the admin's `ThemeEditor` uses `<input type="color">` for each. Fonts are a curated `<select>` of system-available stacks (no `@font-face`/webfont-loading infrastructure exists in this project, so free-text font names would risk silently falling back to nothing on a visitor's device). One real CSS subtlety this ran into: a custom property override only takes effect where a `font-family` declaration actually re-resolves it — `body`'s own `font-family: var(--body-font)` doesn't re-resolve just because a descendant `<main>` redefines `--body-font`, since inheritance passes body's already-computed value down. Fixed by giving `.catalog-root` its own explicit `font-family: var(--body-font)` declaration.

**Catalog registry (`data/catalogs/index.ts`, since Phase 4)**: `catalogs` maps a catalog id (e.g. `"ariel"`) to its `CatalogEntry` (`{ theme, blocks }`). Two routes read it, each for a different purpose: `app/page.tsx` (`/`) lists every entry as an index/carousel card (using each catalog's own `cover` block for the image/title — no second place to keep that in sync), and `app/catalog/[id]/page.tsx` renders one specific catalog full-screen via `CatalogRenderer`, `notFound()` if the id isn't in the registry, `generateStaticParams()` over `Object.keys(catalogs)`. This split exists because the two needs are genuinely different: a catalog needs a stable, directly shareable link (`/catalog/ariel`) independent of how many other catalogs exist, while `/` needs to reflect the full set. Adding a second catalog is still just a new `data/catalogs/<name>.ts` plus one line in the registry — both routes pick it up automatically, no JSX change in either.

**Rendering (block-based, since Phase 2)**: `CatalogRenderer` (`components/catalog/CatalogRenderer.tsx`) takes a `CatalogBlocks` array and renders `ScrollProgress` plus one `BlockRenderer` per block, in order. `BlockRenderer` (`components/catalog/BlockRenderer.tsx`) switches on `block.type` to pick the matching section component (the switch is exhaustive — a new `Block` variant without a matching `case` fails the build via a `never` check). Every section still renders as a full-viewport `<section class="page">` with CSS scroll-snap (see `.page` / `html { scroll-snap-type }` in `app/globals.css`). Adding, removing, or reordering a section is an edit to a catalog's `catalogBlocks` array (`data/catalogs/<name>.ts`) — never a JSX change and never a new page component. Adding a new colorway still means adding an entry to `productVariants` (and a matching `chapterHeroes` entry) plus referencing both from `catalogBlocks`.

**PDF export (`scripts/generate-pdf.mjs`, since Phase 7)**: runs as the last step of `npm run build` (`next build && node scripts/generate-pdf.mjs`). It never reconstructs the catalog in a separate PDF library (Non Goal: "never duplicate layouts") — it starts an ephemeral `next start`, drives it with Playwright/Chromium at a fixed 1080×1440 viewport, **scrolls through the entire page first**, then emulates `print` media and calls `page.pdf()`. The scroll step exists because `RevealOnScroll` (IntersectionObserver) and `next/image`'s native lazy loading only fire on a real viewport intersection — `page.pdf()` alone leaves everything below the first screen invisible or unloaded. It navigates to `/catalog/<id>`, not `/` — `/` is the multi-catalog index, not a catalog itself, since `app/page.tsx` changed. `CATALOG_ID` is currently hardcoded to `"ariel"` (the only real catalog); the script notes inline that this should iterate the registry once a second one exists, rather than pretending that's already handled. Output is `public/catalog-ariel.pdf`, a static asset like any other — no runtime PDF generation, no serverless Chromium. `app/globals.css`'s `@media print` block (one `.page` per physical PDF page, forced `print-color-adjust: exact` so the gradient overlays and backgrounds actually print) is what actually shapes the output; the script only drives the browser. `ClosingPage` gets an optional `pdfHref` prop (threaded through `CatalogRenderer` → `BlockRenderer`, set in `app/page.tsx`) for the public "download PDF" link — hidden in `@media print` itself, since a download link has no meaning inside the PDF it links to.

`postinstall: "playwright install chromium"` in `package.json` fetches the browser binary on every `npm install` (so a fresh build environment — Vercel's, or a new contributor's machine — actually has it; nothing before Phase 9 guaranteed this). If PDF generation still fails for any reason (a missing OS-level library Chromium needs, a build-container quirk that can't be fully verified outside real Vercel infra), the script fails *soft*: it logs the error and exits `0`, deliberately not failing the whole `npm run build`. Publishing a catalog content change must never be blocked by the PDF export step — worst case the PDF is stale until the next successful build, not that an editor's save can't go out.

**Components** (`components/catalog/`): each section kind maps to one component (`CoverPage`, `ManifestoPage`, `ProductHero`, `ChapterHero`, `ProductDetailPage`, `ClosingPage`), dispatched by `BlockRenderer` — components themselves are unaware of the block system, they just take their usual typed props. Plus small shared pieces (`PageNumber`, `Collage` — layout driven by `variant.collageLayout: "four"|"three"|"two"`, `SwatchGroup`, `ScrollProgress`). `RevealOnScroll` is a client component (`"use client"`) that wraps content that should fade in via `IntersectionObserver`; it accepts an optional `delay` (ms) for staggering. Keep any element that needs its own positioning `transform` (e.g. absolutely-centered text) on a wrapper *outside* `RevealOnScroll`, not on the same node — `.reveal.visible` sets `transform: none` and will clobber a positioning transform placed on that same element.

**Styling**: one global stylesheet, `app/globals.css`, using CSS custom properties (`--ink`, `--paper`, `--line`, `--muted`, `--accent`) — no CSS modules or utility framework. Section backgrounds are NOT inline CSS `url()` — each background section renders a `next/image` (`fill`, class `page-bg`, `z-index:-1`) plus a `.page-overlay` gradient div, layered inside a `.page` that sets `isolation: isolate`. This exists so backgrounds get real image optimization (AVIF/WebP, lazy-loaded except the cover's `priority` image) instead of downloading every full-size PNG upfront regardless of scroll position.

**Images**: served from `public/imagenes/` (numbered `1.png`–`10.png`, reused across colorways/sections) and rendered via `next/image` (`Collage.tsx` uses `fill` + `sizes`). `next.config.ts` enables AVIF/WebP output formats.

**Path alias**: `@/*` maps to the repo root (`tsconfig.json`), e.g. `@/data/schema`, `@/data/catalogs/ariel`, `@/components/catalog/...`.

# Product Vision

The current catalog is only the first implementation.

The long-term goal is to transform this project into a catalog generation platform.

This is NOT a Canva-like editor.

The administrator does not design pages manually.

Instead, the administrator provides structured content and the system generates the catalog automatically.

The same source of data must eventually generate:

- Interactive Web Catalog
- Print-ready PDF

Every architectural decision should move the project toward this vision.

# Development Principles

Always prefer reusable components.

Never duplicate layouts.

Never hardcode content inside components.

Prefer configuration over duplication.

Prefer composition over inheritance.

Prefer typed data models.

Every new feature should improve scalability.

Maintain backward compatibility whenever possible.

Visual regressions are not acceptable.

# Roadmap

Current Phase

Phase 9

Goal:

Performance Review — audit everything built across Phases 1–8, not add anything new.

Status:
Completed. Public catalog JS: ~149 KB gzipped total, of which the app's own code is a rounding error (~0.3 KB) on top of the shared React/Next runtime — confirmed empirically (network capture, not just reasoning about imports) that none of `bcryptjs`/`jose`/zod's validation runtime leak into the client bundle, public or admin; `/admin`'s own editor + gallery code adds only ~4.3 KB gzipped beyond the shared baseline. Image weight (729 KB across 21 requests after a full scroll-through, zero eager-loaded on initial paint) and scroll performance (60fps, zero frames over 33ms even at 4× CPU throttling) both match the Phase 2 baseline exactly — no regression across 6 more phases of admin/PDF/asset work landing on top of the public site.

Found and fixed a real production-readiness gap: nothing installed Playwright's Chromium binary automatically, so a *fresh* build environment (Vercel's, or a new machine) would have failed `npm run build` entirely on the PDF step — it only ever worked here because Chromium had already been installed manually back in Phase 7. Added `postinstall: "playwright install chromium"`. Separately, made PDF generation failures non-fatal to the overall build (log and exit 0, not 1) — publishing a catalog content edit must never be blocked by the PDF export step failing for an unrelated reason.

Measured `npm run build`'s two halves separately: `next build` ~3.9s, PDF generation ~13.4s — the PDF step is the dominant build-time cost by a wide margin, an accepted tradeoff already reasoned through in Phase 7 (a build-time cost, paid once per deploy, versus a slower and riskier on-demand serverless-Chromium alternative that would cost real time on every visitor request instead).

Next Phase

Phase 10

AI Integration (optional, post-MVP)

# Non Goals

Do not build a Canva clone.

Do not introduce drag-and-drop editing.

Do not redesign the current catalog.

Do not implement AI features during the MVP.

Do not duplicate components to create new templates.

Do not sacrifice maintainability for quick fixes.

# Working Rules

Before starting any implementation:

1. Read this document.
2. Identify the current phase.
3. Explain the implementation plan.
4. Implement only the current phase.
5. Run npm run build.
6. Verify there are no console errors.
7. Verify no visual regressions.
8. Stop and wait for approval.

Never continue automatically to the next phase.


# Definition of Done

A phase is complete only if:

✓ npm run build passes

✓ No TypeScript errors

✓ No runtime errors

✓ No visual regressions

✓ Responsive behavior preserved

✓ No duplicated code introduced

✓ Documentation updated

# Decision Log

2026-07-25

The project will become an administration platform instead of a static catalog.

The administrator provides data.

The system generates the layout.

AI is intentionally excluded from the MVP.

Templates will be compositions of reusable blocks.

The same content will eventually support both PDF and Web outputs.

2026-07-25 (Phase 2 complete)

`app/page.tsx` no longer hardcodes the section sequence in JSX.

Composition now lives in `data/catalog.ts` (`catalogBlocks: Block[]`), typed via `data/blocks.ts`.

`components/catalog/BlockRenderer.tsx` dispatches each block to its section component via an exhaustive switch.

No visual or behavioral changes: build, types, and full mobile/tablet/desktop screenshot comparison confirmed zero regressions.

2026-07-25 (Phase 3 complete)

Data model is now schema-first: `data/schema.ts` defines every section's shape as a Zod schema (source of truth), and every exported TypeScript type is derived from it via `z.infer` — no hand-duplicated types.

`catalogBlocks` is validated with `CatalogBlocksSchema.parse(...)` when `data/catalogs/ariel.ts` loads; malformed content now fails the build instead of breaking silently at runtime.

Ariel's content moved out of a generic `data/catalog.ts` into `data/catalogs/ariel.ts` — `data/schema.ts` has zero knowledge of Ariel, dresses, or soles, so a second catalog is a new file under `data/catalogs/`, not a schema change.

No visual or behavioral changes: build, types, and full mobile/tablet/desktop screenshot comparison confirmed zero regressions at each of the two sub-steps (schema+validation, then schema/instance split).

2026-07-25 (Phase 4 complete)

`data/catalogs/index.ts` registers available catalogs by id (`{ ariel: catalogBlocks }`); nothing outside that file imports a specific collection's data module directly anymore.

`components/catalog/CatalogRenderer.tsx` renders any `CatalogBlocks` array (ScrollProgress + one `BlockRenderer` per block) — `app/page.tsx` is now just `<CatalogRenderer blocks={catalogs.ariel} />`, with zero knowledge of sections, blocks, or content.

No visual or behavioral changes: build, types, and full mobile/tablet/desktop screenshot comparison confirmed zero regressions.

2026-07-25 (Phase 5, Part 1 of 3 complete — data layer + save pipeline)

Admin panel requirements clarified: remote administrator, login/password auth, edits persist to the repo's `.ts`/`.json` files, and reordering/adding blocks must be possible — all without drag-and-drop (Non Goal).

Resolved a real conflict between two of those requirements: a remote admin implies production writes, but this site is statically generated on Vercel, which has no writable filesystem in production. Resolution (the standard pattern used by git-backed CMSs like Decap/Tina): the admin panel never writes to a live filesystem — it commits to GitHub via the Contents API, and the existing Vercel-on-push pipeline does the rest. No new "publish" step, no database.

`data/catalogs/ariel.ts` split into `ariel.json` (the actual content) + a ~15-line loader that validates it against `CatalogBlocksSchema` — this is what makes the content safely machine-editable (structured data in, structured data out) instead of requiring the admin panel to parse/rewrite hand-authored TypeScript source.

`lib/catalogStore.ts` (`import "server-only"`) exposes `saveCatalog(id, blocks)`: validates first, commits second, never the reverse. Verified with a mocked `fetch` (no real GitHub repo/token exist yet) that it fetches the file's current SHA, PUTs the right path/branch/commit message, and base64-encodes the content correctly.

Still pending before this is usable end-to-end: `GITHUB_TOKEN` / `GITHUB_REPO` / `GITHUB_BRANCH` env vars (user-provided secret, not something that can be generated here), Part 2 (auth), Part 3 (the actual `/admin` UI).

No visual or behavioral changes to the public catalog: build, types, and full mobile/tablet/desktop screenshot comparison confirmed zero regressions.

2026-07-26 (Phase 5, Parts 2 and 3 complete — auth + admin UI)

Auth: single-admin bcrypt credentials + a `jose`-signed JWT session cookie. Split into `lib/auth.ts` (Edge-safe, no Next-specific imports — importable from `proxy.ts`) and `lib/session.ts` (`requireSession()`, Node-only, for Server Components/Actions) on purpose, so the Edge bundle for the proxy never risks pulling in `next/headers`/`next/navigation`.

Next 16 deprecated `middleware.ts` in favor of `proxy.ts` (same API, `middleware` export renamed to `proxy`) — migrated during this phase rather than shipping a new file under a convention already marked for removal.

Defense in depth, not just the proxy redirect: `/admin/page.tsx` and `app/admin/actions.ts` both call `requireSession()` independently, since Next's own docs describe Proxy as an "optimistic check," not a full auth solution.

Built the admin UI: `BlockForm` (per-`Block`-type fields, same exhaustive-switch shape as `BlockRenderer`) on top of small reusable field editors (`TextField`, `StringListEditor`, `CollageImagesEditor`, `SwatchesEditor`, ...). `BlockList` reorders via up/down buttons only — no drag-and-drop, per Non Goals. `pageNumber` was removed from every form; it's now derived from array position at save time, so reordering/adding/removing blocks can never desync the displayed page numbers.

Found and fixed a real bug during end-to-end Playwright testing: `saveCatalog` threw an uncaught error when `GITHUB_TOKEN`/`GITHUB_REPO` were missing, which left the "Guardar y publicar" button stuck in "Guardando…" forever instead of showing the error — the client `useTransition` had nothing to catch. Fixed by wrapping the GitHub-facing part of `saveCatalog` in try/catch so it always resolves to a `SaveCatalogResult`, never throws.

Verified with Playwright against a real running build (test credentials, no real GitHub repo/token): unauthenticated `/admin` redirects to login; wrong password is rejected with a clear message and does not log in; correct login sets an httpOnly/SameSite=Lax session cookie and reaches `/admin`; the block list renders and matches Ariel's 11 blocks; editing a field updates both the form and the collapsed summary live; reordering swaps the correct two blocks; adding a block increments the count; the swatch photo/color toggle switches the input; saving without GitHub config now shows the config error instead of hanging; logout clears the session and redirects to login. Zero console/page errors throughout.

No visual or behavioral changes to the public catalog: build, types, and full mobile/tablet/desktop screenshot comparison confirmed zero regressions.

2026-07-26 (Phase 6 complete — colorway template)

Scoped "Template System" to the one thing the Decision Log already promised ("templates will be compositions of reusable blocks"): a colorway template, not a new data type. `data/schema.ts` has zero awareness of templates — `lib/templates.ts` is a pure function (`createColorwayBlocks`) that returns plain `Block[]`, same shape as any block the admin could add by hand.

`AddColorwayForm` pre-fills product name/type by reading the existing `productHero` block out of the admin's in-memory state, rather than starting blank — one less thing to retype per colorway.

Fixed a source-readability issue while writing the slug helper: an accent-stripping regex ended up with raw Unicode combining-mark characters typed directly into the character class instead of `\u0300`-`\u036f` escapes. Functionally identical either way, but replaced it with the escaped form — invisible/similar-looking characters in source is its own maintenance hazard.

Verified end-to-end with Playwright against the running admin panel: product name/type pre-fill correctly from existing data; adding a colorway inserts exactly 2 blocks with matching id/name/type/swatch/collage image; block count and tags (Capítulo, Detalle) are correct; zero console errors. Public catalog: zero regressions across the same 36-screenshot check used for every phase — expected, since this feature never touches rendering, schema, or the save pipeline.

2026-07-26 (Phase 7 complete — PDF export)

Chose to generate the PDF by printing the live web catalog with headless Chromium instead of rebuilding the design in `@react-pdf/renderer`/`pdfkit`/similar — the latter would mean maintaining every catalog component twice, in two different rendering engines, which is exactly the duplication the Development Principles rule out ("never duplicate layouts").

Chose build-time generation over an on-demand API route: content only ever changes via the admin panel → GitHub commit → Vercel redeploy, so a route generating the PDF per-request would just re-produce the same bytes on every hit, at the cost of a slow, memory-heavy serverless Chromium cold start with real risk of hitting Vercel's function timeout. Build-time means `public/catalog-ariel.pdf` is a plain static file.

Found a real bug during the first PDF attempt: 9 of 11 pages came out with missing text and blank/grey images. Root cause — `RevealOnScroll` (IntersectionObserver-driven) and `next/image`'s native lazy loading both depend on the element actually crossing the viewport during a real scroll; `page.pdf()` renders the full page without ever generating that scroll, so nothing below the first screen ever got triggered. Only the cover survived, because it's the one section that forces its "visible" state immediately rather than waiting on the observer. Fixed by having the script scroll the full page height (in viewport-sized steps, waiting for `networkidle` at each) before switching to print media — confirmed by re-inspecting all 11 pages directly, all correct.

Added `app/globals.css`'s `@media print` block: one `.page` per physical PDF page (`break-after: page`), and `print-color-adjust: exact` (+ `-webkit-` prefix) so the `.page-overlay` gradients and backgrounds — essential to the design, not decorative — actually make it into the PDF; browsers strip backgrounds from print output by default to save ink unless told otherwise.

Added an optional `pdfHref` prop threaded through `CatalogRenderer` → `BlockRenderer` → `ClosingPage` for the public download link, rather than adding it to `data/schema.ts` — it's a build/deploy artifact reference, not catalog content, so it doesn't belong in the data model. Hidden in `@media print` since a "download this PDF" link has no meaning printed inside the PDF itself.

Verified: full `npm run build` (including the new PDF step) runs end-to-end and produces an 11-page PDF; all pages visually inspected directly (not just screenshotted) — cover, manifesto, hero, all 4 colorway details with complete collages and swatches, all 3 chapter transitions with backgrounds and text, and closing, all correct. Public catalog: 33 of 36 regression screenshots byte-identical to the Phase 2 baseline; the 3 that differ are the closing page across viewports, showing exactly the new download link and nothing else.

2026-07-26 (Phase 8 complete — asset library)

Discovered mid-phase that GitHub's simple "contents" API (already in use since Phase 5 for the catalog JSON) has a hard 1MB-per-file limit — a real problem, since this catalog's actual photos are 1.5–2.6MB. Rebuilt commits on the Git Data API instead (`lib/github.ts`: blob → tree → commit → move branch ref, 4 API calls instead of 1), which has no comparable size ceiling, and migrated `lib/catalogStore.ts` onto it too rather than keeping two different commit mechanisms for JSON vs. images.

Documented a real, accepted limitation rather than solving it: `commitFile` reads the branch HEAD and builds on top of it with no retry/merge logic, so two saves racing each other could clobber one another. Fine for one admin (current scope); flagged in the architecture notes so it isn't rediscovered as a mystery bug later if multi-admin use ever happens.

`next.config.ts` needed `experimental.serverActions.bodySizeLimit` raised to `8mb` — Next's 1MB default is smaller than several of this catalog's own photos even before base64 inflates them further, so uploads would have failed silently otherwise.

Chose React Context (`AssetsContext`) over prop-drilling the asset list through `BlockList` → `BlockForm` → `CollageImagesEditor`/`SwatchesEditor`, none of which have any other reason to know assets exist — Context is the right tool exactly for cross-cutting data needed by deeply nested leaves, not a workaround.

A freshly uploaded image is committed to GitHub immediately but won't actually exist in the running deployment's `public/` until the next Vercel redeploy completes — solved with a session-local `blob:` object URL (`ClientAsset.previewUrl`) so the admin sees their own photo right away instead of a broken-image icon, without pretending the file is live before it actually is.

Verified: `commitFile`'s full 6-request sequence checked against a mocked `fetch` (blob content/encoding, tree referencing the right blob and path, commit referencing the right tree and parent, ref move to the right commit); `listAssets`/`uploadAsset` checked against the real `public/imagenes/` directory (unsupported extensions rejected without any network call, filenames sanitized, collisions get a random suffix instead of overwriting). End-to-end in the running admin panel: gallery shows all 10 real images, selecting one fills the field, upload without `GITHUB_TOKEN` fails with the expected message instead of hanging. Public catalog: zero regressions — this phase never touches anything outside `/admin`.

2026-07-26 (Phase 9 complete — performance review)

Measured rather than guessed, for every claim: actual gzip transfer sizes via `curl -H "Accept-Encoding: gzip"` (not just the raw/uncompressed byte counts Playwright's `response.body()` reports by default — the two differ by ~3×, so reporting the wrong one would have overstated real-world cost by roughly that factor), real network capture to confirm zero client-side leakage of server-only dependencies, and a synthetic 3-second scroll with `requestAnimationFrame` timing (both unthrottled and at 4× CPU throttle) to confirm animation smoothness, exactly the same methodology as the Phase 2 audit — reused deliberately so the two results are actually comparable, not just similar-looking.

Found the review's one real bug: no `postinstall` step ever fetched Playwright's Chromium binary. Every PDF generation in this project's history up to now succeeded only because Chromium had already been installed by hand during Phase 7's setup — a fresh environment (Vercel's first build, or a new contributor's machine) would have hit a hard failure on the PDF step with no automatic recovery. Fixed with `postinstall: "playwright install chromium"`.

Beyond that specific fix, hardened the failure mode generally: `scripts/generate-pdf.mjs` now catches any error at the top level and exits `0` (not `1`) instead of letting it fail the whole build. Reasoned explicitly about the tradeoff: the PDF is a secondary export of the catalog, not the catalog itself, and a broken or missing system dependency for headless Chromium (impossible to fully rule out on infrastructure this project can't directly test) should degrade to "PDF stays stale until the next successful build," never to "an editor's content save can't ship."

Tried to reproduce the fixed failure mode by disabling the local Chromium executable; the attempt was inconclusive (Playwright resolved a different path than the one directly inspected, so the rename didn't actually block the launch) and was not worth pursuing further by more invasive means against a real local cache. Relied on direct code review instead for that specific fix — the change itself is a minimal, low-risk 2-line diff (log message + exit code) inside a `catch` block whose triggering was already exercised by multiple earlier, unrelated test failures in this project (missing `GITHUB_TOKEN`, missing `AUTH_SECRET`, etc.), so the surrounding mechanism is well-proven even where this one specific trigger wasn't.

2026-07-26 (post-Phase-9 refinement — multi-catalog routing, admin preview, solid-color swatch)

Phase 10 (AI Integration) explicitly declined by the product owner — the roadmap's numbered phases end at 9. This batch is real-world feedback after deploying to Vercel and testing the live site, not a new numbered phase: the deploy surfaced three concrete gaps between what the admin panel could do and what publishing to the live catalog actually required.

`/` used to render `catalogs.ariel` directly — the only catalog that existed. Split it into `app/catalog/[id]/page.tsx` (one catalog, direct shareable link, `notFound()` off the registry, `generateStaticParams()`) and rewrote `app/page.tsx` into an index/carousel over every entry in `data/catalogs/index.ts`. The registry pattern from Phase 4 was built specifically to make this possible without a rewrite — it paid off exactly as intended: both routes are `Object.keys(catalogs)`-driven, so a real second catalog needs zero routing changes. `scripts/generate-pdf.mjs` had to be updated in lockstep (`page.goto` was hardcoded to `BASE_URL`, which now serves the index, not a catalog).

Added a "Vista previa" button to `AdminEditor` rather than building a separate preview renderer: `PreviewOverlay` feeds the editor's own live `items` state through the same `CatalogRenderer` component the public site uses, portaled over the whole viewport. The alternative (a bespoke preview component) would have been exactly the kind of duplicated rendering path the Development Principles rule out, and would drift from the real thing the first time someone changed a section component without remembering to update two places.

Added a solid-color option to the colorway template (`lib/templates.ts`'s `ColorwayTemplateInput.swatch`): some colorways don't have a photo crop clean enough to use as a swatch chip. `SwatchItem` was already a `{ type: "image" }` / `{ type: "color" }` discriminated union in `data/schema.ts` since Phase 3 — this only needed a second branch in the template constructor and a Foto/Color toggle in `AddColorwayForm`, no schema change.

Verified: `npm run build` (including the PDF step, now against `/catalog/ariel`) and `tsc --noEmit` both clean. End-to-end with Playwright against a real running build: `/` shows the index card and links into `/catalog/ariel`; the catalog itself renders unchanged; admin login, the preview overlay (opens over the live unsaved state, closes cleanly), and the color-swatch toggle (color input appears, selected color renders correctly as the swatch chip on the actual detail page) all confirmed working end-to-end, including one added test colorway inspected directly in the preview to confirm the solid-color chip renders rather than a broken image reference. Test login used temporary throwaway credentials patched into `.env.local` for the run and restored immediately after — the real admin credentials were never touched or exposed.

2026-07-27 (fix — broken PDF download on Vercel)

Diagnosed from a real Vercel build log (`vercel inspect --logs`), not guessed: Playwright's own downloaded Chromium can't launch in Vercel's build container — `error while loading shared libraries: libnspr4.so`. No `apt-get`/sudo access there, so installing the missing system library by hand isn't an option.

Fixed with `@sparticuz/chromium` (a Chromium build statically linked for Lambda/Vercel-style containers), used only when `process.env.VERCEL` is set — locally (or any other CI) `scripts/generate-pdf.mjs` keeps using Playwright's own Chromium unchanged, since `@sparticuz/chromium`'s binary is Linux-specific and won't run on macOS.

Verified against a real deploy: the Vercel build log shows `[generate-pdf] wrote public/catalog-ariel.pdf` with no errors, and `curl -I https://page-catalogo.vercel.app/catalog-ariel.pdf` now returns `200` with the real file size (~8.5MB), not the previous `404`.

2026-07-27 (fix — PDF download link unclickable on the closing page)

Found while testing the closing page directly (not just visually): `.page-overlay` is `position: absolute`, which per CSS's painting order puts it in a later paint step than normal in-flow content regardless of DOM order — visually translucent (so the text underneath still reads fine), but it was physically intercepting clicks on top of the download link. Confirmed with `document.elementFromPoint` returning the overlay `<div>`, not the `<a>`, at the link's own coordinates. The same underlying issue already had a fix in place for `.chapter .product-name` — the closing page's link just never got the same treatment because it's the only actually-clickable element anywhere in the public catalog's section components (checked: nothing else in `components/catalog/` has an `onClick`/`<a>`/`<button>`), so nothing else could have surfaced this. Fixed with `.closing .reveal { position: relative; z-index: 2; }`.

2026-07-27 (feature — per-catalog visual theme, granular)

Real-world follow-up request after using the live site: more "planillas" (catalog templates) with their own visual style. Scoped to what's buildable without new infrastructure: free per-catalog colors (the same 5 CSS custom properties already driving `app/globals.css` — `ink`/`paper`/`line`/`muted`/`accent`) plus 2 font stacks (`displayFont` for the cover/closing serif titles, `bodyFont` for everything else), picked from a curated list of system-available font stacks rather than free text — this project has no webfont-loading pipeline, so an arbitrary typed font name would silently fall back to nothing on a visitor's device.

Restructured each catalog entry from a bare `Block[]` to `{ theme, blocks }` (`data/schema.ts`'s new `CatalogThemeSchema` + `CatalogEntrySchema`) — touched every layer that reads or writes a catalog: the JSON file itself, `data/catalogs/ariel.ts`'s loader, the registry, both public routes, `CatalogRenderer` (now applies `theme` as inline CSS custom properties on its own `<main className="catalog-root">`, scoped to that catalog's render tree only), `lib/catalogStore.ts`/`app/admin/actions.ts` (validate and save `{theme, blocks}` together), and the admin UI (`ThemeEditor` + `AdminEditor` state + `PreviewOverlay`). Ariel's theme values were set to exactly match `:root`'s previous hardcoded defaults, so this is zero visual regression for the existing catalog, confirmed by comparing computed CSS values before/after, not just eyeballing screenshots.

Hit a real CSS inheritance subtlety while wiring `bodyFont`: setting `--body-font` on `<main>` alone did nothing, because `body`'s own `font-family: var(--body-font)` declaration resolves once, at `body`, using whatever was in scope there (`:root`'s default) — descendants of `<main>` were inheriting that already-computed value, not re-resolving the custom property themselves. Fixed by giving `.catalog-root` (the `<main>` itself) its own explicit `font-family: var(--body-font)` declaration, which does force re-resolution in that scope. `displayFont` didn't have this problem because `.cover-title h1`/`.closing h2` already had their own explicit `font-family` declarations to begin with.

Verified end-to-end with Playwright against a real running build: changed all 5 colors and both fonts in the admin's `ThemeEditor`, opened "Vista previa," and confirmed via computed styles (not just a screenshot) that `--ink` and the cover title's actual `font-family` reflected the change live, with zero console errors — no save/publish involved in that check, so nothing test-only ever touched the real catalog data. Separately confirmed Ariel's own rendering is byte-for-byte the same computed CSS values (`--ink: #151515`, `--display-font: Georgia, "Times New Roman", serif`, etc.) as before the migration.

2026-07-27 (feature — multi-catalog admin panel)

Real-world feedback again: `/admin` only ever edited Ariel — no way to pick a catalog or create a new one, even though the registry (Phase 4) and now the theme system were both already built to support more than one. Split `/admin` (list of catalogs + `AddCatalogForm`) from `/admin/[id]` (the actual editor, `notFound()` off the registry) — the same split already used for the public `/` vs `/catalog/[id]`, applied to the admin side for the same reason.

Extended `lib/github.ts`'s single-file `commitFile` into a multi-file `commitFiles` (one commit, one tree, several blobs) specifically so creating a catalog — which touches 3 files (its JSON, its `.ts` loader, and the regenerated registry) — can't leave the repo with 2 of 3 files committed if something fails partway. `commitFile` is now a one-file call to `commitFiles` underneath, not a separate code path.

Scoped "be creative, make it look like a real catalog" (the actual ask) into `lib/newCatalog.ts`: a full starter — cover, manifesto, hero, two colorways, closing — with real editorial copy and its own bold theme (deep terracotta/charcoal, Didot + Futura) distinct from Ariel's palette, built from the same photos already in `public/imagenes/` since there's no real photography for a catalog that doesn't exist yet. Not a new component or template type (Non Goal still holds) — it's `lib/templates.ts`'s existing colorway-composition pattern, just producing a whole catalog's worth of blocks instead of one pair.

`slugify` (previously private to `lib/templates.ts`) moved to `lib/slug.ts` so both colorway ids and catalog ids share one implementation — avoided re-typing the accent-stripping regex a third time (this project has hit the exact same Unicode-combining-mark authoring bug on this regex twice before; a second copy was a second chance to reintroduce it).

`scripts/generate-pdf.mjs`'s `CATALOG_ID = "ariel"` was always meant to be temporary (flagged inline since Phase 7/9) — now that the admin panel can genuinely add a second catalog, actually did the deferred work: it lists `data/catalogs/*.json` and generates one PDF per catalog found, instead of silently leaving any new catalog without a working download link.

Couldn't test the real GitHub commit end-to-end (no GitHub token configured in the local environment on purpose — those credentials only exist in Vercel's). Verified everything short of the actual network call instead: `createCatalog`'s validation and starter content directly via `tsx` (schema-valid, correct block sequence, correct theme); the exact `.json`/`.ts`/`index.ts` text `commitFiles` would have pushed, written into the real project and checked against the real compiler (`tsc --noEmit` + `npm run build`) rather than eyeballing the generated strings — a second `/catalog/<id>` route and a second PDF both came out correctly; the config-missing error path in the running admin UI (same pattern `saveCatalog` already used, now shared by `createCatalog`) confirmed to fail gracefully with a clear message instead of hanging. Test catalog and its temporary files were removed afterward; the registry was restored to just Ariel.

2026-07-27 (fix — broken redirect after creating a catalog; add delete)

Real bug from actually using the feature just shipped: `AddCatalogForm` used to `router.push('/admin/<id>')` right after the commit succeeded. That id genuinely doesn't exist yet in the registry the *currently running* deployment compiled — it only shows up once Vercel finishes redeploying from the commit that was just made (~1 minute) — so the push was racing a redeploy it could never win, landing on a 404/wrong page every time. Fixed by not navigating at all: the form now shows a success message with the commit link and the `/admin/<id>` path to visit once the redeploy is done, which is the honest timeline this git-backed-CMS architecture actually has.

Added catalog deletion, extending the same atomic-commit machinery `createCatalog` already used rather than a separate path: `commitFiles` (`lib/github.ts`) now accepts `base64Content: null` on an entry to mean "delete this path" (the Git Data API's own convention — a tree entry with `sha: null`), so `deleteCatalog` removes a catalog's `.json` + `.ts` and regenerates the registry without its id, all in one commit, symmetric with how creating one adds them. Guards against deleting the last remaining catalog (an empty registry isn't a state anything downstream was designed to handle) and against an unknown id. The list UI (`CatalogList.tsx`, split out of the server-rendered `/admin` page into its own client component since delete needs `confirm()` + a Server Action + `router.refresh()`) disables the delete button when only one catalog is left, so the guard is visible before it's ever hit, not just a server-side rejection.

2026-07-27 (fix — broken registry from a create/delete race; query GitHub live)

Testing the create/delete flow for real against the live GitHub repo (with `GITHUB_TOKEN` actually configured this time, unlike the simulated check in the previous entry): deleting "example" and creating "example1" happened close enough together that the create action read the registry from a still-warm process that hadn't picked up the delete's redeploy yet — it regenerated `data/catalogs/index.ts` from a stale id list that still included the just-deleted "example", producing a registry that imports a file that no longer exists (confirmed: real broken build on Vercel, real `tsc` error locally).

Fixed the immediate broken state, and fixed the root cause: `createCatalog` and `deleteCatalog` now list `data/catalogs/*.json` straight from GitHub's real HEAD (`lib/github.ts`'s new `listRepoJsonFileIds`) before regenerating the registry, instead of trusting `Object.keys(catalogs)` — which is only ever as fresh as the last deploy that finished.

2026-07-27 (fix — PDF generation crashing on the second+ catalog on Vercel)

With two real catalogs live in production (Ariel + the "example1" test catalog from the race above), Vercel's build wrote Ariel's PDF fine but crashed immediately on the second with "Target page, context or browser has been closed". Cause: `@sparticuz/chromium` runs with `--single-process`, which doesn't tolerate opening a new page after closing another — `scripts/generate-pdf.mjs` was opening and closing one `page` per catalog. Fixed by reusing a single `page` (navigated catalog to catalog) instead of one `newPage()`/`close()` per catalog.

2026-07-27 (fix — text-shadow rendering as a solid rectangle in the PDF; example1 cleanup)

Ariel's PDF looked right on desktop, but some mobile PDF viewers showed a solid rectangle behind text over photos instead of the expected soft shadow. Chromium rasterizes `text-shadow` as a separate layer when exporting to PDF, and those viewers don't composite that layer correctly. Text stays legible without the shadow (it already sits on a dark `.page-overlay`), so it's switched off only in `@media print` with `text-shadow: none !important` — the web version is untouched.

Also removed `example1` — the `createStarterCatalog` placeholder that was left live on the real site from the create/delete testing described above — restoring `data/catalogs/index.ts` to just Ariel, the only real catalog that exists. Generalized `.gitignore` from `public/catalog-ariel.pdf` to `public/catalog-*.pdf`, since a second catalog generating its own PDF per build is now a real, exercised case rather than a hypothetical.

Verified with a full `tsc --noEmit` + `npm run build` (including the PDF step) after all three fixes and the cleanup, plus a route-level smoke test (`/`, `/catalog/ariel`, `/admin`, `/catalog-ariel.pdf`) against a local `next start`, all returning the expected status codes.

Verified the redirect fix and the disabled-delete-button state end-to-end with Playwright against a real running build (same GITHUB_TOKEN-missing limitation as catalog creation for the actual delete commit — the UI reaches the same config-error path `saveCatalog`/`createCatalog` already use, confirmed to fail gracefully rather than hang).