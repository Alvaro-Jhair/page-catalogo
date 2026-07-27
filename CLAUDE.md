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

**Admin auth (`lib/auth.ts` + `lib/session.ts` + `proxy.ts`, since Phase 5)**: single-admin credentials (`ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH`, a bcrypt hash — never a plaintext env var) via `bcryptjs`. Sessions are a `jose`-signed JWT (not `jsonwebtoken` — it doesn't run on the Edge runtime) in an httpOnly cookie. `lib/auth.ts` has no Next-specific imports so it's safe for `proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`; same API) to import it in the Edge runtime; `lib/session.ts` holds `requireSession()` (`next/headers` + `next/navigation`, Node-only) for Server Components/Actions. `proxy.ts` redirecting unauthenticated `/admin/*` requests is only the first line of defense — per Next's own guidance, Proxy is an "optimistic check," not a full auth solution — so `/admin/page.tsx` and `app/admin/actions.ts` both call `requireSession()` again before rendering or mutating anything.

**Admin UI (`app/admin/`, `components/admin/`, since Phase 5)**: `/admin` renders `AdminEditor` (client component) seeded with `catalogs.ariel` from the server. Each block gets a form via `BlockForm` (same exhaustive-switch shape as `BlockRenderer`, one per `Block` type) built from small reusable pieces in `components/admin/fields/` (`TextField`, `TextAreaField`, `SelectField`, `StringListEditor`, `CollageImagesEditor`, `SwatchesEditor`). Reordering is up/down buttons on `BlockList`, never drag-and-drop (Non Goal). `pageNumber` is never a form field — `app/admin/actions.ts` recomputes it from array position on save, so reordering/adding/removing blocks can't produce duplicate or out-of-order page numbers. "Guardar y publicar" calls `saveCatalogAction`, which re-checks the session, then calls `saveCatalog`.

**Templates (`lib/templates.ts`, since Phase 6)**: a "template" is a composition of existing blocks, not a new data type or component (Non Goal: "do not duplicate components to create new templates") — `data/schema.ts` has no concept of templates at all. `createColorwayBlocks(input)` returns the linked `[ChapterHero, ProductDetail]` pair (shared `id`/`name`, swatch + collage image pre-filled from one background image) that `components/admin/AddColorwayForm.tsx` inserts into `AdminEditor`'s state in one step, instead of the admin adding and hand-linking two independent blocks. Purely an admin-panel composition helper — it produces plain `Block[]` the same as any other addition, so it doesn't touch rendering, the schema, or the save pipeline.

**Catalog registry (`data/catalogs/index.ts`, since Phase 4)**: `catalogs` maps a catalog id (e.g. `"ariel"`) to its `catalogBlocks`. `app/page.tsx` doesn't import a specific collection's data file — it asks the registry for `catalogs.ariel` and hands it to `CatalogRenderer`. Adding a second catalog is a new `data/catalogs/<name>.ts` (Phase 3 pattern) plus one line in the registry — never a change to `app/page.tsx`.

**Rendering (block-based, since Phase 2)**: `CatalogRenderer` (`components/catalog/CatalogRenderer.tsx`) takes a `CatalogBlocks` array and renders `ScrollProgress` plus one `BlockRenderer` per block, in order. `BlockRenderer` (`components/catalog/BlockRenderer.tsx`) switches on `block.type` to pick the matching section component (the switch is exhaustive — a new `Block` variant without a matching `case` fails the build via a `never` check). Every section still renders as a full-viewport `<section class="page">` with CSS scroll-snap (see `.page` / `html { scroll-snap-type }` in `app/globals.css`). Adding, removing, or reordering a section is an edit to a catalog's `catalogBlocks` array (`data/catalogs/<name>.ts`) — never a JSX change and never a new page component. Adding a new colorway still means adding an entry to `productVariants` (and a matching `chapterHeroes` entry) plus referencing both from `catalogBlocks`.

**PDF export (`scripts/generate-pdf.mjs`, since Phase 7)**: runs as the last step of `npm run build` (`next build && node scripts/generate-pdf.mjs`). It never reconstructs the catalog in a separate PDF library (Non Goal: "never duplicate layouts") — it starts an ephemeral `next start`, drives it with Playwright/Chromium at a fixed 1080×1440 viewport, **scrolls through the entire page first**, then emulates `print` media and calls `page.pdf()`. The scroll step exists because `RevealOnScroll` (IntersectionObserver) and `next/image`'s native lazy loading only fire on a real viewport intersection — `page.pdf()` alone leaves everything below the first screen invisible or unloaded. Output is `public/catalog-ariel.pdf`, a static asset like any other — no runtime PDF generation, no serverless Chromium. `app/globals.css`'s `@media print` block (one `.page` per physical PDF page, forced `print-color-adjust: exact` so the gradient overlays and backgrounds actually print) is what actually shapes the output; the script only drives the browser. `ClosingPage` gets an optional `pdfHref` prop (threaded through `CatalogRenderer` → `BlockRenderer`, set in `app/page.tsx`) for the public "download PDF" link — hidden in `@media print` itself, since a download link has no meaning inside the PDF it links to.

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