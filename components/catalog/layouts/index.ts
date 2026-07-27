import type { ComponentType } from "react";
import type {
  ChapterHero as ChapterHeroData,
  ClosingData,
  CoverData,
  LayoutId,
  ManifestoData,
  ProductHeroData,
  ProductVariant,
} from "@/data/schema";
import * as original from "./original";
import * as editorialLux from "./editorialLux";
import * as appleMinimal from "./appleMinimal";
import * as ikeaGrid from "./ikeaGrid";
import * as nikeBold from "./nikeBold";
import * as zaraEditorial from "./zaraEditorial";
import * as japaneseMinimal from "./japaneseMinimal";
import * as streetwearDark from "./streetwearDark";
import * as architectureGrid from "./architectureGrid";
import * as modernPremium from "./modernPremium";

export type LayoutComponents = {
  CoverPage: ComponentType<{ data: CoverData }>;
  ManifestoPage: ComponentType<{ data: ManifestoData }>;
  ProductHero: ComponentType<{ data: ProductHeroData }>;
  ChapterHero: ComponentType<{ data: ChapterHeroData }>;
  ProductDetailPage: ComponentType<{ variant: ProductVariant }>;
  ClosingPage: ComponentType<{ data: ClosingData; pdfHref?: string }>;
};

/**
 * Un set de componentes completo por layout — no una plantilla de datos,
 * una identidad visual distinta. "original" es Ariel/Terracota Bold tal
 * cual existían antes de que hubiera más de un layout (ver
 * layouts/original/index.ts). Los demás se van reemplazando acá a medida
 * que se construyen; hasta entonces apuntan a "original" como placeholder
 * — nunca un layoutId sin entrada, BlockRenderer no tiene que manejar el
 * caso "no existe".
 */
export const LAYOUTS: Record<LayoutId, LayoutComponents> = {
  original,
  "editorial-lux": editorialLux,
  "apple-minimal": appleMinimal,
  "ikea-grid": ikeaGrid,
  "nike-bold": nikeBold,
  "zara-editorial": zaraEditorial,
  "japanese-minimal": japaneseMinimal,
  "streetwear-dark": streetwearDark,
  "architecture-grid": architectureGrid,
  "modern-premium": modernPremium,
};
