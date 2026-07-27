import type { Block, ChapterHero, ProductVariant } from "@/data/schema";

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
  bgImage: string;
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos (á -> a, etc.)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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
    swatches: input.bgImage ? [{ label: input.colorwayName, type: "image", image: input.bgImage }] : [],
  };

  return [
    { type: "chapterHero", data: chapterHero },
    { type: "productDetail", data: productDetail },
  ];
}
