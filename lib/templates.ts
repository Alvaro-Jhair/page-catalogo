import type { Block, ChapterHero, ProductVariant, SwatchItem } from "@/data/schema";
import { slugify } from "./slug";

/**
 * "Template" en el sentido del roadmap (Fase 6): una composición de
 * bloques reutilizables, no un tipo de dato nuevo ni un componente
 * nuevo (Non Goal: "do not duplicate components to create new
 * templates"). data/schema.ts no sabe que esto existe — es pura
 * utilidad del panel de administración para armar de una sola vez el
 * par [ChapterHero, ProductDetail] que representa una colorway
 * completa, con id/nombre/swatch ya coherentes entre sí.
 */
export type ColorwayTemplateInput = {
  colorwayName: string;
  productName: string;
  productType: string;
  /** Fondo del capítulo + primera imagen del collage — siempre una foto, como el resto del sitio. */
  bgImage: string;
  /** El chip del swatch puede ser esa misma foto o un color plano; a diferencia del fondo, no compromete el diseño de las páginas a pantalla completa. */
  swatch: { type: "image" } | { type: "color"; color: string };
};

export function createColorwayBlocks(input: ColorwayTemplateInput): [Block, Block] {
  const id = slugify(input.colorwayName) || `colorway-${Date.now()}`;
  const label = input.colorwayName.toUpperCase().trim();

  const chapterHero: ChapterHero = {
    id,
    pageNumber: 0,
    name: input.productName,
    label,
    bgImage: input.bgImage,
  };

  const swatchItem: SwatchItem =
    input.swatch.type === "color"
      ? { label: input.colorwayName, type: "color", color: input.swatch.color }
      : { label: input.colorwayName, type: "image", image: input.bgImage };

  const productDetail: ProductVariant = {
    id,
    pageNumber: 0,
    name: input.productName,
    type: [label, input.productType].filter(Boolean).join(" "),
    price: "",
    description: [],
    collageLayout: "two",
    collageImages: input.bgImage
      ? [{ src: input.bgImage, alt: `${input.productName} ${input.colorwayName}` }]
      : [],
    swatches: [swatchItem],
  };

  return [
    { type: "chapterHero", data: chapterHero },
    { type: "productDetail", data: productDetail },
  ];
}
