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

**Rendering (block-based, since Phase 2; multi-layout since post-Phase-9)**: `CatalogRenderer` (`components/catalog/CatalogRenderer.tsx`) takes a `CatalogBlocks` array, a `theme`, and a `layoutId`, and renders `ScrollProgress` plus one `BlockRenderer` per block, in order. `BlockRenderer` (`components/catalog/BlockRenderer.tsx`) looks up `LAYOUTS[layoutId]` (`components/catalog/layouts/index.ts`) and switches on `block.type` to pick that layout's matching section component (the switch is exhaustive — a new `Block` variant without a matching `case` fails the build via a `never` check). `layoutId` is part of `CatalogEntrySchema` (`data/schema.ts`), defaults to `"original"`, and is fixed at catalog creation — not editable afterward from the admin, since swapping it on existing content could mismatch a layout's visual assumptions (e.g. one photo per colorway vs. four). `components/catalog/layouts/original/` re-exports the pre-existing `components/catalog/*.tsx` files verbatim — Ariel's exact rendering path, byte-for-byte unchanged. Every other layout (`editorial-lux`, `apple-minimal`, `ikea-grid`, `nike-bold`, `zara-editorial`, `japanese-minimal`, `streetwear-dark`, `architecture-grid`, `modern-premium`) supplies its own `CoverPage` and `ProductDetailPage` (the two block types with genuinely distinct data/visual needs) plus one shared `StatementFrame` component covering `manifesto`/`productHero`/`chapterHero`/`closing` (these four already share the same real shape — background photo + short editorial statement — so one bespoke component per layout serves all four, consistently, instead of three of six page types staying "the original design with new colors"). Every section still renders as a full-viewport `<section class="page">` with CSS scroll-snap (`.page` / `html { scroll-snap-type }` in `app/globals.css` — shared infrastructure every layout keeps using, which is also what gives every layout PDF page-breaks and the `text-shadow`/`box-shadow` print-safety fix for free). Each non-original layout owns a co-located `<id>.css` file, all rules prefixed under a `.layout-<id>` wrapper class so layouts can never leak into each other or into `original`. Adding, removing, or reordering a section is still an edit to a catalog's block array — never a JSX change; adding a new colorway is still `chapterHero` + `productDetail` referencing the same id. `CollageLayoutSchema` gained a fourth value, `"one"`, for layouts built around a single hero photo per colorway (Apple Minimal, Japanese Minimal).

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

*(Amended 2026-07-27 — see decision log: this now means never duplicate layouts **within** a design system, not across catalogs. The multi-layout system deliberately maintains up to 10 independent visual systems, each with its own Cover/ProductDetail/Statement components — a conscious, documented reversal for the reasons in that entry, not an accidental one.)*

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

*(Amended 2026-07-27 — see decision log: superseded specifically for visual layout systems. A "template" used to mean theme + content composition over one fixed component set; it now can also mean a genuinely distinct component set, selected via `layoutId`. This Non-Goal still holds everywhere else — no per-catalog forks of `CatalogRenderer`, `BlockRenderer`, the schema, the save pipeline, or any admin component.)*

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

2026-07-27 (fix — empty gap below the price section on detail pages, incl. PDF)

Real feedback after using the live site: detail/colorway pages (the ones with a price) showed a block of blank white space below the info section, most visible in the exported PDF where each `.page` prints at a fixed physical size. Root cause: `.detail` (`app/globals.css`) is a `display:flex; flex-direction:column` with `.info` set to `flex:1` — `.page` only has `min-height:100svh`, not a fixed `height`, so whenever `.info`'s own content (name, swatches, description, price) is shorter than the available space, the flex item still stretches to fill it, and the content — never centered — stays pinned to the top with a dead gap below it. Invisible on most pages because their content already fills the viewport; detail pages typically have less text, so it showed. Fixed with 3 lines on `.info`: `display:flex; flex-direction:column; justify-content:center` — centers the content block vertically within whatever space is actually available, with no effect when content already fills or exceeds it (still clipped by the pre-existing `overflow:hidden` in that case).

2026-07-27 (feature — simpler admin panel; no drag-and-drop, no new tools)

Real feedback after using the live admin: "muy complicado" — confirmed as four concrete things, not a vague complaint: raw technical values shown as labels (`collageLayout: four/three/two`), too many fields open at once with no grouping, a flat block list that doesn't show that a chapter+detail pair is really "one colorway," and too many clicks for simple actions like reordering a whole colorway. Fixed all four without adding drag-and-drop (Non Goal) or any new dependency — all changes are inside files that already existed.

`SelectField` (`components/admin/fields/SelectField.tsx`) now accepts `{value, label}` pairs in addition to plain strings (same pattern `ThemeEditor`'s font pickers already used) — `collageLayout`'s raw `"four"/"three"/"two"` became "4 fotos"/"3 fotos"/"2 fotos" in `BlockForm.tsx`. The internal `id` field (links a `chapterHero` to its `productDetail` — set once by `AddColorwayForm`, never meant to be hand-edited after) stayed visible rather than removed outright — editing only one side of the pair would silently break the link — but became read-only with a label that explains what it's for, instead of a confusing free-text field. `TextField` gained an optional `disabled` prop for this. `productDetail`'s form (the one with the most fields) got grouped into "Contenido"/"Fotos"/"Colores" subsections (`.admin-field-group`) instead of one long unbroken list.

`BlockList.tsx` now detects adjacent `chapterHero`+`productDetail` pairs sharing the same `id` and wraps them in a `.admin-colorway-group` with its own header ("Colorway: X") and a pair-level move up/down control that relocates both blocks together (`Array.splice` out then back in, shifted by one position) — reordering a whole colorway went from 2 clicks per position (one block at a time) to 1. Blocks that aren't part of a matched pair (cover, manifesto, productHero, closing, or an orphaned chapter/detail after manual reordering) render exactly as before, no wrapper — the grouping is purely additive to the existing rendering, not a replacement of it. `AddColorwayForm`'s background-image field — previously the only image field in the whole admin that was a raw text path instead of the shared `ImagePicker` gallery+upload widget — now uses `ImagePicker` like every other image field, removing the one real inconsistency found.

No browser available in this environment to click through the running admin, so verified by full `tsc --noEmit` + `npm run build` (both clean) plus a careful line-by-line re-read of every changed file, including confirming TypeScript's control-flow narrowing correctly holds `current` as `ChapterHero` inside the `isColorwayPair` branch of `BlockList.tsx` (a `const`-aliased condition, narrows via TS's "control flow analysis of aliased conditions"). Live click-through in the running admin is still something to confirm directly.

2026-07-27 (feature — template carousel when creating a catalog)

Real request: offer several starter "models" to choose from when creating a catalog, distinct in visual design, structure, and typography, "innovative and eye-catching but still recognizably a catalog" — while staying inside the Non Goal that already governs `lib/templates.ts`: a template is a composition of the existing six block types, never a new component.

`lib/newCatalog.ts`'s `colorway()` helper gained a `collageLayout` parameter (previously hardcoded to `"two"`), and `createStarterCatalog(name, templateId?)` now looks up a preset from a new `CATALOG_TEMPLATES` array (defaulting to the first if `templateId` doesn't match) instead of always building the one fixed starter. Four presets, each with its own `theme` and `build()`, reusing only the fonts already curated in `ThemeEditor.tsx` and photos already in `public/imagenes/` (no new dependencies, no photography that doesn't exist): **Editorial Clásico** (wine/bone, Georgia serif, 2 colorways), **Terracota Bold** (the original default starter, theme untouched, kept as one option among several instead of the only one), **Streetwear Alto Contraste** (black/white/lime, Futura sans, 3 colorways, "four"-photo collages for a denser feel), **Minimalista Pastel** (soft muted palette, Palatino serif, a single colorway, more restrained copy). `templateId` threads through the existing chain unchanged in shape — `createCatalogAction` → `createCatalog` → `createStarterCatalog` — each just gained one optional parameter passed straight through.

`AddCatalogForm.tsx` gets a horizontally-scrolling row of template cards above the name field (`overflow-x:auto; scroll-snap-type:x proximity` — the same scroll-snap idiom already used everywhere else on the site, no carousel library), each showing the template's name, a one-line description, and a 5-dot preview of its theme colors; clicking one selects it (highlighted border) and its id is sent along on submit. Defaults to the first template so submitting without touching the carousel still works exactly as before.

Verified all 4 presets directly with `tsx` against `CatalogEntrySchema.safeParse` (all pass, correct block counts: 2/2/3/1 colorways respectively) — the same no-GITHUB_TOKEN-locally limitation as every previous `createCatalog` check, so verified everything short of the real commit. Went further than the schema check alone: wrote the exact `.json`/`.ts` output for the `streetwear-contraste` preset into the real project (temporarily added to `data/catalogs/index.ts`), ran `tsc --noEmit` + a full `npm run build` (including its own PDF) against real content, and inspected the rendered HTML directly — confirmed the theme's CSS custom properties, the "four"-photo collage layout, and the color swatch all came through correctly — before removing the test files and restoring the registry to just Ariel.

2026-07-27 (fix — detail-page gap and small photos in the PDF; box-shadow rasterizing as a box)

Real feedback that the PDF "still" had an empty gap after the earlier centering-only fix, plus "the photos look too small." Both traced to the same root cause: `.collage` was sized purely by each photo's `aspect-ratio` (about 50% of the page), leaving `.info`'s `flex:1` to absorb whatever was left regardless of how short its actual content was. Fixed properly this time — `.collage` now `flex:7` and `.info` `flex:3` (both `flex-basis:0`, so the split is a fixed proportion of the page, not content-driven), with `.collage` switching from per-photo `aspect-ratio` to `grid-auto-rows:1fr` so photos fill whatever height that gives them via the `object-fit:cover` already in place. Directly fixes both complaints from the same change, verified by rendering the built PDF to PNG (`pdftoppm`) and by real Playwright screenshots at mobile (390×844) and desktop (1440×900) viewports against the live dev server — confirmed photos aren't distorted at either end.

Separately, `.swatch`'s `box-shadow` was hitting the exact same PDF export bug already fixed for `text-shadow` (Chromium rasterizes it as its own layer; some viewers show a visible box/halo instead of a soft shadow) — confirmed by cropping and zooming the re-rendered PDF page. Fixed the same way, same `@media print` rule: `box-shadow: none !important` alongside the existing `text-shadow` override.

2026-07-27 (feature — real visual thumbnails + 10 distinct catalog templates)

Real feedback on the just-shipped template carousel: the 4 presets "look too similar to the original" (all earth-tone/pastel palettes), the carousel only showed color dots and text ("I'd like it to look like an actual small preview"), and asked for a minimum of ~10 templates that don't look alike, with the original (Terracota Bold) kept first since "that's the one we started with."

New `components/admin/TemplateThumb.tsx` renders each template's real sample photo with a dark gradient overlay (using the template's own `ink` colour, so it stays legible regardless of palette) plus a title in the template's `displayFont` and a tag in its `accent`/`bodyFont` — a genuine visual preview instead of 5 flat dots. Deliberately does *not* reuse `CoverPage` scaled down with `transform` — that would mean fighting `.page{min-height:100svh}`, absolute `PageNumber`, and `RevealOnScroll` inside a tiny decorative box for something that isn't the real catalog output. The Non Goal against duplicating layouts protects the *real* rendering path (why `PreviewOverlay` does reuse `CatalogRenderer` verbatim) — a picker thumbnail is closer to a colour swatch than a second page-rendering implementation. Each template now carries its own `preview: {image, title, tag}` sample data, independent of whatever the admin has (or hasn't) typed in the name field yet.

`CATALOG_TEMPLATES` grew from 4 to 10: kept **Terracota Bold** first and untouched (still the original) and **Streetwear Alto Contraste** as-is, replaced the other two with 8 new presets deliberately spread across genuinely different colour families instead of variations on the same earth-tone/pastel idea — **Monocromo Editorial** (pure black/white), **Sunset Pop** (fuchsia/coral), **Costa Lino** (sand/sea blue), **Joyas Reales** (emerald/gold), **Blush Minimal** (dusty rose), **Industrial Concreto** (concrete/steel blue), **Jardín Botánico** (sage green), **Cítrico Eléctrico** (yellow/orange on black) — each with its own short editorial copy, colorway count (1–3), and collage density (two/three/four), not just a re-skinned copy of the original.

Found and fixed a real bug while building these: `colorway()` always built exactly one `collageImages` entry regardless of `collageLayout`, so any colorway using `"three"`/`"four"` (most of the new templates) rendered with 1 real photo and 2–3 blank grid columns — invisible before today because every existing colorway used `"two"`, and the old aspect-ratio-driven collage height kept the empty column small; once `.collage` started claiming 70% of the page (the fix above), an empty column became a huge, obvious blank rectangle. Caught by actually rendering a built PDF, not just schema validation. Fixed by giving `colorway()` a `collageImages: string[]` array matched to each colorway's layout instead of one path reused everywhere.

Verified all 10 against `CatalogEntrySchema.safeParse` plus a script confirming every colorway's `collageImages.length` matches what its `collageLayout` expects (all 23 colorways across the 10 templates, all matching). Wrote the densest preset (`industrial-concreto`, 3 colorways, "four" layout) into the real project, ran `tsc --noEmit` + a full `npm run build` including its PDF, and re-rendered that PDF page to confirm all 4 grid columns now fill correctly. Logged into a real running admin (temporary throwaway local credentials, restored immediately after) with Playwright and screenshotted the carousel scrolled to its start, middle, and end — confirmed all 10 thumbnails render distinct real photos, colours, and fonts, not just at the type level.

2026-07-27 (architecture — multi-layout template system: 9 genuinely distinct designs, not theme variations)

Direct, unambiguous feedback on the batch above: the 10 "templates" were still one layout wearing 10 palettes — "if two templates could be mistaken for each other, redesign them." The ask was for each template to have its own cover composition, product-page layout, grid system, and decorative language, to the point of passing a "black and white test" (recognizable with the colour removed).

This is a direct reversal of two rules this file has stated since early phases: the Development Principle "Never duplicate layouts" and the Non-Goal "Do not duplicate components to create new templates" — both written specifically to prevent per-catalog forks of the rendering code. Flagged this conflict to the user explicitly before writing anything (see the two amended entries above, which point back to this one) and got explicit confirmation to proceed anyway — a deliberate architecture change, not an oversight, and not a blanket repeal: both principles still apply to everything *within* a layout (the schema, the save pipeline, `CatalogRenderer`, admin components) — only the "one Cover/ProductDetail component for every catalog" assumption was lifted.

**Architecture**: `data/schema.ts` gained `LayoutIdSchema` (10 fixed ids, `.default("original")`) and `CatalogEntry.layoutId`. New `components/catalog/layouts/` registry (`LAYOUTS: Record<LayoutId, LayoutComponents>`) — `BlockRenderer` now looks up the active layout's component set instead of importing one fixed set. `layouts/original/` re-exports the pre-existing `components/catalog/*.tsx` files with zero modifications — the guarantee that Ariel/Terracota Bold stay byte-for-byte identical lives in code (a thin re-export), not in discipline. `layoutId` threads through everywhere a `CatalogEntry` is built or consumed: `ariel.json`, `lib/newCatalog.ts`'s `CatalogTemplate`, `saveCatalogAction`/`saveCatalog`, `AdminEditor`/`PreviewOverlay`. It is deliberately **not** an editable field in the admin — fixed once at creation via the template carousel, since changing it on existing content could mismatch a layout's visual assumptions against real data (e.g. a layout built around one photo per colorway vs. a catalog with four).

**Scoping the "genuinely distinct" bar**: building 6 fully bespoke components × 9 layouts (54 components) wasn't necessary or realistic. `manifesto`/`productHero`/`chapterHero`/`closing` already share the same real shape in the data model — background photo + a short editorial statement — so per layout, one shared `StatementFrame` component (with small content differences: manifesto has a paragraph, chapterHero has a colourway label, closing has the PDF link) covers all four consistently, while `CoverPage` and `ProductDetailPage` — the two block types the request specifically detailed with distinct composition examples — get fully bespoke implementations. 3 new components × 9 layouts = 27, not 54, and every one of the 6 block types still gets that layout's real typography/decoration/spacing, not a recolored original — the exact complaint that started this.

**The 9 new identities** (`editorial-lux`, `apple-minimal`, `ikea-grid`, `nike-bold`, `zara-editorial`, `japanese-minimal`, `streetwear-dark`, `architecture-grid`, `modern-premium`) each pair a distinct cover composition (magazine masthead, centered-minimal, colour-block grid, layered diagonal type, asymmetrical margin-split, quiet off-center, dark layered/zine, structural grid-with-coordinates, hard 50/50 split — no two alike) with an equally distinct product-page layout (hero+caption sidebar, single huge photo, modular price-tag card, bold colour callout, 65/35 split, text-first with modest image, scattered polaroid-style photos, FIG.-captioned grid cells, gold-framed content panel). Each owns its own theme (5 colours + font pair, reusing only fonts already available — no new webfont loading) and a co-located `<id>.css` with every rule scoped under `.layout-<id>`, so nothing leaks across layouts or into `original`.

**`CollageLayoutSchema` gained a fourth value, `"one"`** — several new layouts (Apple Minimal, Japanese Minimal) are built around a single large hero photo per colourway rather than a multi-photo grid, which the enum didn't allow before.

**Two real bugs found by actually rendering, not just type-checking**: (1) Architecture Grid's product-detail grid used `height: 100%` inside a parent whose height came only from `.page`'s `min-height` — percentage heights don't reliably resolve against a min-height-only ancestor, so the grid collapsed to its content height instead of filling the page, leaving a large blank gap below a cramped image grid. Fixed with the same flex-grow (`flex: 1 1 auto` + `min-height: 0`) pattern already proven earlier this session for the collage/info split, rather than trusting `height: 100%` again. (2) Japanese Minimal's accent "seal" mark was nested inside the text column instead of the outer `<section>`, so `position: absolute` resolved against that column's own box (which is vertically centered and doesn't span the full page) instead of the page corner — worked correctly on the cover (mark was a direct section child there) but drifted to mid-page on the product-detail page. Fixed by moving the mark to be a sibling of the text column, matching the cover's structure.

**Verified per batch of 3 layouts, not all 9 at once**: for each of the 3 batches, built the layout components + CSS, then real Playwright screenshots (desktop 1440×900 and mobile 390×844, zero console/page errors on any of the 9) against a running dev server for fast iteration, then a full `npm run build` + PDF generation + `pdftoppm` re-render of the built PDF to catch print-specific regressions before moving to the next batch — this is how both bugs above were actually caught (neither was visible from source review or `tsc`). Final pass: all 10 templates' starter content validated against `CatalogEntrySchema`, a full `tsc --noEmit` + `npm run build` with the real 3-catalog production registry (Ariel unchanged), and a logged-in Playwright session confirming the admin's template carousel renders all 10 with genuinely distinct thumbnails (a separate bug found and fixed here too: most `preview.image` values pointed at the same photo, undermining the thumbnail's whole purpose — reassigned so no two adjacent cards repeat). `eslint`/`npm run lint` could not be run — this project has no `eslint.config.js` and no `eslint-config-next` installed, a pre-existing gap (not introduced by this change) noted here since it means `tsc --noEmit` is currently the only static check available.

Produced a side-by-side comparison artifact (cover + product page + mobile screenshot for all 10, real captures, no mockups) for visual review before treating this as done.

2026-07-27 (fix — ESLint was never actually configured; source distinct photos per template; carousel shows real screenshots)

Three follow-ups from live feedback after the multi-layout batch shipped.

**ESLint**: `npm run lint` had been wired to `next lint` since early phases, but Next 16 removed that subcommand entirely, and no `eslint.config.js` or `eslint-config-next` existed either — lint had silently never run in this project. Installed `eslint` + `eslint-config-next`, added the standard flat config (`core-web-vitals` + `typescript` presets, `archive/` excluded since that legacy prototype is reference-only), pointed the script at `eslint .` directly. First real run found two things: a genuine `react-hooks/set-state-in-effect` violation in `PreviewOverlay` (`setMounted(true)` called synchronously in a `useEffect`) — the mounted guard turned out to be unnecessary entirely, since this component only ever mounts client-side after a user clicks "Vista previa," never during SSR, so `document.body` already exists on the first render; removed the guard, kept only the legitimate body-scroll-lock side effect, verified end-to-end that preview still opens/closes cleanly. And 5 of the 9 new templates had hardcoded `"SS26"` in their cover meta instead of using the `year` parameter like the other 5 already did — an unused-parameter warning that was really just an inconsistency; fixed to match the established convention. `npm audit` separately flagged transitive vulnerabilities in `eslint`'s own dependency tree and in `next`'s `postcss`/`sharp` deps — pre-existing in `next@16.2.11`'s own tree, not introduced here; `npm audit fix --force`'s suggested "fix" is downgrading to `next@9.3.3`, which would be far worse than the vulnerabilities themselves, so left alone.

**Distinct photos per template**: direct feedback that the 9 new templates, despite having genuinely different layouts, still all pulled from Ariel's same 10-photo pool — the same underlying complaint as the layout redesign, applied to imagery. No image generation capability exists here, and downloading arbitrary web images without a clear license is a real risk — asked explicitly before acting, got confirmation to search for royalty-free stock photos. Sourced 5 photos per template from Unsplash (free for commercial use, no attribution required) via `WebSearch` + `WebFetch` to get verifiable direct CDN URLs (never guessed), matched to each template's actual mood — B&W editorial portraits for Editorial Lux, dynamic athletic action for Nike Bold, night urban/neon for Streetwear Dark, concrete/structural backdrops for Architecture Grid, and so on — genuinely better fits than dress photos reused out of context. Terracota Bold (Template 1) untouched — still Ariel's real photos, since it's the actual original catalog. Photos still reuse within a template across its own colorways/sections (same accepted pattern Ariel's own 10 photos already use) — the fix targets cross-template reuse specifically, not all reuse. Caught and fixed two leftover duplicate-within-one-collage-grid photos that the mechanical old-path-to-new-path remapping introduced.

**Admin carousel shows real screenshots**: feedback pointed at the comparison artifact directly — "me gusta el concepto de como se ve los detalles de la plantilla, quizas se podria hacer un carrusel asi." `TemplateThumb` no longer draws a decorative photo+gradient+title approximation; it shows the same two real screenshots (portada, producto) from that artifact, pre-generated once against a real build and stored as static assets (`public/admin-previews/`, ~550KB total for all 10) rather than rendered live — recreating a scaled-down `CoverPage`/`ProductDetailPage` inside a picker card has the same fragility problems already reasoned through and rejected when `TemplateThumb` was first built (fighting `.page{min-height:100svh}`, absolute `PageNumber`, `RevealOnScroll`, for something that isn't the real catalog output). `CatalogTemplate.preview` changed shape from `{image, title, tag}` to `{coverImage, detailImage}`; cards grew from 190px to 320px to fit two screenshots legibly.

Verified: `tsc --noEmit`, `npm run lint` (now actually functional, zero problems), full `npm run build` including PDF generation for all 5 real production catalogs, all 52 new image paths confirmed to exist on disk before build, all 10 templates re-validated against `CatalogEntrySchema` with matching `collageImages` counts, and a logged-in Playwright session (temporary local credentials, restored after) confirming the redesigned carousel renders all 10 templates' real screenshots with zero console errors.

2026-07-27 (fix — the real Vercel PDF renders serif titles in a generic fallback font, not the intended one)

Real feedback comparing catalogs live: "el de terracota se ve bien en pdf... pero como pagina web se ve mal, las imagenes no se ven iguales que en el pdf" and, for Editorial Lux, the opposite — good on web, "en pdf no me gusta el diseño." Every PDF check done all session (including in this very log, multiple times) was run against a *local* build using regular Playwright Chromium, which has real system fonts on macOS — never against the actual PDF Vercel produces for real visitors. That gap is exactly where this bug was hiding.

Downloaded the real production PDF from `page-catalogo.vercel.app/catalog-ariel.pdf` and compared it directly to a local render of the identical page: Ariel's cover title "ANGEL DE CANELA" — same theme (`Georgia, "Times New Roman", serif`), same code, same CSS — printed in a plain generic font in the real Vercel PDF, while every local render showed the intended Georgia serif. Root cause: `@sparticuz/chromium` (used for PDF generation only when `process.env.VERCEL` is set, since regular Playwright Chromium can't launch in that build container — see the earlier fix for that) ships with exactly one font, Open Sans, per its own README — none of Georgia, Times New Roman, Palatino, Didot, or Bodoni MT exist in that environment at all, so every serif `displayFont` stack in this project was silently falling all the way through to a generic sans substitute specifically in the one place real visitors actually see it.

Fixed by embedding Playfair Display (Google Fonts, SIL Open Font License, free for commercial use, downloaded once as two WOFF2 files rather than depending on a live Google Fonts request at build or view time) via `@font-face` in `app/globals.css` — this makes the font exist inside *any* Chromium, regardless of what the underlying OS/container has installed, which is the only way to guarantee web and PDF actually render identically. Added `"Playfair Display"` as the fallback immediately before the generic `serif` keyword everywhere a serif stack didn't already have it: `data/catalogs/ariel.json` itself, two already-shipped catalogs (`deme1`, `demo3` — `demo`/`demo4` already had it since they used the Didot preset), the two new templates that were missing it (`japanese-minimal`, `modern-premium`), and the admin's `ThemeEditor` curated font dropdown, so any catalog edited by hand gets the same reliability going forward. Terracota Bold's actual font *choice* is untouched — Didot still renders first wherever it's actually available; this only makes the *fallback* real instead of silently breaking.

Verified everything checkable without a Linux/sparticuz environment: `tsc --noEmit`, full `npm run build`, all 5 real catalogs re-validated against `CatalogEntrySchema`, the embedded WOFF2 files confirmed to actually load via `document.fonts.load()` (both regular and italic, both report `"loaded"`, not `"error"`), and a direct visual render forcing `font-family: "Playfair Display"` alone (bypassing every other font in the stack) to confirm the embedded file itself renders a real, correctly-shaped elegant serif rather than tofu or a corrupted file. Could not reproduce Vercel's exact container locally — `@sparticuz/chromium`'s binary is Linux-only and won't run on macOS — so the next production build's actual PDF is the real confirmation this is fixed, not a local one.

Verified the redirect fix and the disabled-delete-button state end-to-end with Playwright against a real running build (same GITHUB_TOKEN-missing limitation as catalog creation for the actual delete commit — the UI reaches the same config-error path `saveCatalog`/`createCatalog` already use, confirmed to fail gracefully rather than hang).