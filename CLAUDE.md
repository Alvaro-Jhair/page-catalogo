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

**Content/markup separation is the core design principle.** All catalog copy, prices, image paths, and per-colorway data live in `data/catalog.ts` as typed exports (`cover`, `manifesto`, `productHero`, `productVariants`, `chapterHeroes`, `closing`). Components are pure rendering shells that take this data as props — never hardcode catalog text/prices/images inside a component; add or edit them in `data/catalog.ts` instead.

**Page structure**: `app/page.tsx` composes the whole catalog as one linear sequence of full-viewport `<section class="page">` blocks with CSS scroll-snap (see `.page` / `html { scroll-snap-type }` in `app/globals.css`): cover → manifesto → product hero → repeating `[ChapterHero, ProductDetailPage]` pairs per colorway → closing. Adding a new colorway means adding an entry to `productVariants` (and a matching `chapterHeroes` entry) in `data/catalog.ts`, not writing a new page component — `ProductDetailPage` already generically renders any variant.

**Components** (`components/catalog/`): each maps to one section type (`CoverPage`, `ManifestoPage`, `ProductHero`, `ChapterHero`, `ProductDetailPage`, `ClosingPage`) plus small shared pieces (`PageNumber`, `Collage` — layout driven by `variant.collageLayout: "four"|"three"|"two"`, `SwatchGroup`). `RevealOnScroll` is the only client component (`"use client"`); it wraps content that should fade in via `IntersectionObserver`, replacing the global observer script from the old vanilla-JS version.

**Styling**: one global stylesheet, `app/globals.css`, using CSS custom properties (`--ink`, `--paper`, `--line`, `--muted`, `--accent`) — no CSS modules or utility framework. Background images per section are inlined via `style={{ background: ... }}` using paths from `data/catalog.ts`.

**Images**: served from `public/imagenes/` (numbered `1.png`–`10.png`, reused across colorways/sections) and rendered via `next/image` (`Collage.tsx` uses `fill` + `sizes`). `next.config.ts` enables AVIF/WebP output formats.

**Path alias**: `@/*` maps to the repo root (`tsconfig.json`), e.g. `@/data/catalog`, `@/components/catalog/...`.
