import { z } from "zod";

/**
 * The catalog's data model: what shape any catalog's content must have.
 * This file is catalog-agnostic — it knows nothing about Ariel, dresses,
 * or prices in soles. TypeScript types below are derived from the Zod
 * schemas (`z.infer`) so the runtime contract and the compile-time type
 * can never drift apart. Actual catalog content (data/catalogs/*.ts) is
 * validated against these schemas before it's ever rendered.
 */

// ---- Shared leaf shapes ----

export const SwatchItemSchema = z.discriminatedUnion("type", [
  z.object({ label: z.string(), type: z.literal("image"), image: z.string() }),
  z.object({ label: z.string(), type: z.literal("color"), color: z.string() }),
]);
export type SwatchItem = z.infer<typeof SwatchItemSchema>;

export const CollageLayoutSchema = z.enum(["four", "three", "two"]);
export type CollageLayout = z.infer<typeof CollageLayoutSchema>;

export const CollageImageSchema = z.object({
  src: z.string(),
  alt: z.string(),
});
export type CollageImage = z.infer<typeof CollageImageSchema>;

// ---- Section data shapes ----

export const CoverDataSchema = z.object({
  title: z.string(),
  meta: z.array(z.string()),
  subtitle: z.string(),
  bottomLine1: z.string(),
  bottomLine2: z.string(),
  bgImage: z.string(),
  pageNumber: z.number(),
});
export type CoverData = z.infer<typeof CoverDataSchema>;

export const ManifestoDataSchema = z.object({
  heading: z.string(),
  paragraph: z.string(),
  bgImage: z.string(),
  pageNumber: z.number(),
});
export type ManifestoData = z.infer<typeof ManifestoDataSchema>;

export const ProductHeroDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  bgImage: z.string(),
  pageNumber: z.number(),
});
export type ProductHeroData = z.infer<typeof ProductHeroDataSchema>;

export const ChapterHeroSchema = z.object({
  id: z.string(),
  pageNumber: z.number(),
  name: z.string(),
  label: z.string(),
  bgImage: z.string(),
});
export type ChapterHero = z.infer<typeof ChapterHeroSchema>;

export const ProductVariantSchema = z.object({
  id: z.string(),
  pageNumber: z.number(),
  name: z.string(),
  type: z.string(),
  price: z.string(),
  description: z.array(z.string()),
  collageLayout: CollageLayoutSchema,
  collageImages: z.array(CollageImageSchema),
  swatches: z.array(SwatchItemSchema),
});
export type ProductVariant = z.infer<typeof ProductVariantSchema>;

export const ClosingDataSchema = z.object({
  title: z.string(),
  line1: z.string(),
  line2: z.string(),
  bgImage: z.string(),
  pageNumber: z.number(),
});
export type ClosingData = z.infer<typeof ClosingDataSchema>;

// ---- Block: the catalog's unit of composition ----

export const BlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("cover"), data: CoverDataSchema }),
  z.object({ type: z.literal("manifesto"), data: ManifestoDataSchema }),
  z.object({ type: z.literal("productHero"), data: ProductHeroDataSchema }),
  z.object({ type: z.literal("chapterHero"), data: ChapterHeroSchema }),
  z.object({ type: z.literal("productDetail"), data: ProductVariantSchema }),
  z.object({ type: z.literal("closing"), data: ClosingDataSchema }),
]);
export type Block = z.infer<typeof BlockSchema>;

export const CatalogBlocksSchema = z.array(BlockSchema);
export type CatalogBlocks = z.infer<typeof CatalogBlocksSchema>;

// ---- Theme: per-catalog visual identity ----
//
// Maps 1:1 onto the CSS custom properties already used sitewide
// (app/globals.css `:root`) plus the two font stacks used for the
// serif "hero moment" titles vs. everything else — free colors/fonts,
// not a fixed set of presets, applied by CatalogRenderer as inline
// CSS variables scoped to that catalog's render root.

export const CatalogThemeSchema = z.object({
  ink: z.string().min(1),
  paper: z.string().min(1),
  line: z.string().min(1),
  muted: z.string().min(1),
  accent: z.string().min(1),
  displayFont: z.string().min(1),
  bodyFont: z.string().min(1),
});
export type CatalogTheme = z.infer<typeof CatalogThemeSchema>;

export const CatalogEntrySchema = z.object({
  theme: CatalogThemeSchema,
  blocks: CatalogBlocksSchema,
});
export type CatalogEntry = z.infer<typeof CatalogEntrySchema>;
