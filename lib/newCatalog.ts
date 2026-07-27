import type { Block, CatalogEntry, ChapterHero, ProductVariant } from "@/data/schema";
import { slugify } from "./slug";

export type NewCatalogResult = { id: string; entry: CatalogEntry };

/**
 * Arma el contenido inicial de un catálogo nuevo: no una plantilla
 * vacía, sino una estructura completa (portada, manifiesto, hero,
 * dos colorways, cierre) con copy editorial y un tema propio distinto
 * al de Ariel — algo que ya luzca como un catálogo real, para que el
 * admin edite fotos/texto encima en vez de armar cada bloque desde
 * cero. Usa las fotos que ya existen en public/imagenes/ como
 * placeholder (son las únicas disponibles hasta que el admin suba las
 * suyas vía el picker de assets).
 */
export function createStarterCatalog(name: string): NewCatalogResult {
  const id = slugify(name) || `catalogo-${Date.now()}`;
  const title = name.toUpperCase().trim();
  const year = new Date().getFullYear().toString();

  const blocks: Block[] = [
    {
      type: "cover",
      data: {
        title,
        meta: ["VOL. 01", year, "LOOKBOOK"],
        subtitle: "A NEW CHAPTER IN THE COLLECTION",
        bottomLine1: `${title} · ${year}`,
        bottomLine2: "Crafted for those who dare to stand out.",
        bgImage: "/imagenes/1.png",
        pageNumber: 0,
      },
    },
    {
      type: "manifesto",
      data: {
        heading: "DESIGNED TO BE SEEN",
        paragraph:
          "Every piece in this collection is built on contrast — bold silhouettes, rich textures, and details made to turn heads. This is fashion with intention, made for the moments that matter.",
        bgImage: "/imagenes/2.png",
        pageNumber: 0,
      },
    },
    {
      type: "productHero",
      data: {
        id,
        name: title,
        type: "COLLECTION",
        bgImage: "/imagenes/3.png",
        pageNumber: 0,
      },
    },
    ...colorway({
      slug: "ember",
      label: "EMBER",
      productName: title,
      bgImage: "/imagenes/4.png",
      swatchColor: "#c1652f",
      description: ["BOLD SILHOUETTE | STATEMENT DETAIL", "SIGNATURE COLOURWAY"],
    }),
    ...colorway({
      slug: "midnight",
      label: "MIDNIGHT",
      productName: title,
      bgImage: "/imagenes/6.png",
      swatchColor: "#2b1810",
      description: ["RICH TEXTURE | SCULPTED FIT", "AFTER-DARK COLOURWAY"],
    }),
    {
      type: "closing",
      data: {
        title,
        line1: "THE COLLECTION",
        line2: "Available now.",
        bgImage: "/imagenes/9.png",
        pageNumber: 0,
      },
    },
  ];

  const entry: CatalogEntry = {
    theme: {
      ink: "#2b1810",
      paper: "#f5ede4",
      line: "#3d2418",
      muted: "#8a7361",
      accent: "#c1652f",
      displayFont: 'Didot, "Bodoni MT", "Playfair Display", serif',
      bodyFont: 'Futura, "Century Gothic", sans-serif',
    },
    blocks,
  };

  return { id, entry };
}

function colorway(input: {
  slug: string;
  label: string;
  productName: string;
  bgImage: string;
  swatchColor: string;
  description: string[];
}): [Block, Block] {
  const chapterHero: ChapterHero = {
    id: input.slug,
    pageNumber: 0,
    name: input.productName,
    label: input.label,
    bgImage: input.bgImage,
  };

  const productDetail: ProductVariant = {
    id: input.slug,
    pageNumber: 0,
    name: input.productName,
    type: `${input.label} PIECE`,
    price: "S/ 000",
    description: input.description,
    collageLayout: "two",
    collageImages: [{ src: input.bgImage, alt: `${input.productName} ${input.label}` }],
    swatches: [{ label: input.label, type: "color", color: input.swatchColor }],
  };

  return [
    { type: "chapterHero", data: chapterHero },
    { type: "productDetail", data: productDetail },
  ];
}
