import type { Block, CatalogEntry, CatalogTheme, ChapterHero, ProductVariant } from "@/data/schema";
import { slugify } from "./slug";

export type NewCatalogResult = { id: string; entry: CatalogEntry };

type ColorwayInput = {
  slug: string;
  label: string;
  productName: string;
  bgImage: string;
  swatchColor: string;
  description: string[];
  collageLayout: ProductVariant["collageLayout"];
};

function colorway(input: ColorwayInput): [Block, Block] {
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
    collageLayout: input.collageLayout,
    collageImages: [{ src: input.bgImage, alt: `${input.productName} ${input.label}` }],
    swatches: [{ label: input.label, type: "color", color: input.swatchColor }],
  };

  return [
    { type: "chapterHero", data: chapterHero },
    { type: "productDetail", data: productDetail },
  ];
}

type CatalogTemplate = {
  id: string;
  label: string;
  description: string;
  theme: CatalogTheme;
  build: (title: string, id: string, year: string) => Block[];
};

/**
 * Plantillas para "crear catálogo" (carrusel del admin, post-Fase-9):
 * cada una es una composición distinta de los mismos 6 tipos de bloque
 * de siempre (nunca un componente nuevo — Non Goal del proyecto), con
 * su propio tema, cantidad de colorways, densidad de collage y copy,
 * para que se sientan realmente distintas al crearse y no solo con
 * otro color de acento.
 */
export const CATALOG_TEMPLATES: CatalogTemplate[] = [
  {
    id: "editorial-clasico",
    label: "Editorial Clásico",
    description: "Vino y hueso, serif refinada, 2 colorways — elegancia contenida.",
    theme: {
      ink: "#1a1a1a",
      paper: "#f7f5f1",
      line: "#2a2a2a",
      muted: "#7a7367",
      accent: "#7c2d3a",
      displayFont: 'Georgia, "Times New Roman", serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    build: (title, id, year) => [
      {
        type: "cover",
        data: {
          title,
          meta: ["VOL. 01", year, "EDITORIAL"],
          subtitle: "TIMELESS SILHOUETTES, MODERN RESTRAINT",
          bottomLine1: `${title} · ${year}`,
          bottomLine2: "Quiet luxury for those who let the work speak.",
          bgImage: "/imagenes/1.png",
          pageNumber: 0,
        },
      },
      {
        type: "manifesto",
        data: {
          heading: "LESS, BUT BETTER",
          paragraph:
            "Every line is considered, every fabric chosen with intent. This collection favors clarity over noise — the kind of design that rewards a second look.",
          bgImage: "/imagenes/2.png",
          pageNumber: 0,
        },
      },
      {
        type: "productHero",
        data: { id, name: title, type: "COLLECTION", bgImage: "/imagenes/3.png", pageNumber: 0 },
      },
      ...colorway({
        slug: "ivory",
        label: "IVORY",
        productName: title,
        bgImage: "/imagenes/4.png",
        swatchColor: "#e8e2d6",
        description: ["CLEAN LINE | REFINED FINISH", "SIGNATURE COLOURWAY"],
        collageLayout: "two",
      }),
      ...colorway({
        slug: "graphite",
        label: "GRAPHITE",
        productName: title,
        bgImage: "/imagenes/8.png",
        swatchColor: "#3a3a3a",
        description: ["MATTE TEXTURE | STRUCTURED CUT", "EVENING COLOURWAY"],
        collageLayout: "two",
      }),
      {
        type: "closing",
        data: { title, line1: "THE COLLECTION", line2: "Available now.", bgImage: "/imagenes/9.png", pageNumber: 0 },
      },
    ],
  },
  {
    id: "terracota-bold",
    label: "Terracota Bold",
    description: "Terracota y carbón, Didot + Futura, 2 colorways — el look original.",
    theme: {
      ink: "#2b1810",
      paper: "#f5ede4",
      line: "#3d2418",
      muted: "#8a7361",
      accent: "#c1652f",
      displayFont: 'Didot, "Bodoni MT", "Playfair Display", serif',
      bodyFont: 'Futura, "Century Gothic", sans-serif',
    },
    build: (title, id, year) => [
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
        data: { id, name: title, type: "COLLECTION", bgImage: "/imagenes/3.png", pageNumber: 0 },
      },
      ...colorway({
        slug: "ember",
        label: "EMBER",
        productName: title,
        bgImage: "/imagenes/4.png",
        swatchColor: "#c1652f",
        description: ["BOLD SILHOUETTE | STATEMENT DETAIL", "SIGNATURE COLOURWAY"],
        collageLayout: "two",
      }),
      ...colorway({
        slug: "midnight",
        label: "MIDNIGHT",
        productName: title,
        bgImage: "/imagenes/6.png",
        swatchColor: "#2b1810",
        description: ["RICH TEXTURE | SCULPTED FIT", "AFTER-DARK COLOURWAY"],
        collageLayout: "two",
      }),
      {
        type: "closing",
        data: { title, line1: "THE COLLECTION", line2: "Available now.", bgImage: "/imagenes/9.png", pageNumber: 0 },
      },
    ],
  },
  {
    id: "streetwear-contraste",
    label: "Streetwear Alto Contraste",
    description: "Negro, blanco y lima, sans geométrica, 3 colorways — denso y directo.",
    theme: {
      ink: "#050505",
      paper: "#ffffff",
      line: "#111111",
      muted: "#6b6b6b",
      accent: "#d4ff3f",
      displayFont: 'Futura, "Century Gothic", sans-serif',
      bodyFont: "Verdana, Geneva, sans-serif",
    },
    build: (title, id, year) => [
      {
        type: "cover",
        data: {
          title,
          meta: ["VOL. 01", year, "DROP"],
          subtitle: "NO RULES. NO QUIET.",
          bottomLine1: `${title} · ${year}`,
          bottomLine2: "Made for the street, built to be seen.",
          bgImage: "/imagenes/1.png",
          pageNumber: 0,
        },
      },
      {
        type: "manifesto",
        data: {
          heading: "LOUD BY DESIGN",
          paragraph:
            "Oversized fits, raw edges, colours that don't apologize. This is not background noise — it's the main event.",
          bgImage: "/imagenes/2.png",
          pageNumber: 0,
        },
      },
      {
        type: "productHero",
        data: { id, name: title, type: "DROP", bgImage: "/imagenes/3.png", pageNumber: 0 },
      },
      ...colorway({
        slug: "volt",
        label: "VOLT",
        productName: title,
        bgImage: "/imagenes/5.png",
        swatchColor: "#d4ff3f",
        description: ["OVERSIZED FIT | RAW EDGE", "FLAGSHIP COLOURWAY"],
        collageLayout: "four",
      }),
      ...colorway({
        slug: "blackout",
        label: "BLACKOUT",
        productName: title,
        bgImage: "/imagenes/7.png",
        swatchColor: "#0a0a0a",
        description: ["MATTE BLACK | HEAVY WEIGHT", "NIGHT COLOURWAY"],
        collageLayout: "four",
      }),
      ...colorway({
        slug: "concrete",
        label: "CONCRETE",
        productName: title,
        bgImage: "/imagenes/10.png",
        swatchColor: "#8a8a8a",
        description: ["WASHED FINISH | UTILITY CUT", "STREET COLOURWAY"],
        collageLayout: "four",
      }),
      {
        type: "closing",
        data: { title, line1: "THE DROP", line2: "Available now.", bgImage: "/imagenes/6.png", pageNumber: 0 },
      },
    ],
  },
  {
    id: "minimalista-pastel",
    label: "Minimalista Pastel",
    description: "Tonos suaves, serif delicada, 1 colorway — más aire, menos ruido.",
    theme: {
      ink: "#3a3a3a",
      paper: "#f3ece6",
      line: "#d8cfc7",
      muted: "#a89b8e",
      accent: "#c9a7a0",
      displayFont: 'Palatino, "Palatino Linotype", "Book Antiqua", serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    build: (title, id, year) => [
      {
        type: "cover",
        data: {
          title,
          meta: ["VOL. 01", year, "CAPSULE"],
          subtitle: "SOFT SHAPES, QUIET COLOUR",
          bottomLine1: `${title} · ${year}`,
          bottomLine2: "A small collection, made to be worn often.",
          bgImage: "/imagenes/1.png",
          pageNumber: 0,
        },
      },
      {
        type: "manifesto",
        data: {
          heading: "ROOM TO BREATHE",
          paragraph:
            "One fabric, one silhouette, done well. This capsule is about ease — pieces that fit into a life, not compete with it.",
          bgImage: "/imagenes/2.png",
          pageNumber: 0,
        },
      },
      {
        type: "productHero",
        data: { id, name: title, type: "CAPSULE", bgImage: "/imagenes/3.png", pageNumber: 0 },
      },
      ...colorway({
        slug: "blush",
        label: "BLUSH",
        productName: title,
        bgImage: "/imagenes/8.png",
        swatchColor: "#c9a7a0",
        description: ["SOFT DRAPE | EASY FIT", "CAPSULE COLOURWAY"],
        collageLayout: "three",
      }),
      {
        type: "closing",
        data: { title, line1: "THE CAPSULE", line2: "Available now.", bgImage: "/imagenes/10.png", pageNumber: 0 },
      },
    ],
  },
];

/**
 * Arma el contenido inicial de un catálogo nuevo a partir de una
 * plantilla elegida en el carrusel del admin (`templateId`; si no
 * matchea ninguna, usa la primera) — no una plantilla vacía, sino una
 * estructura completa con copy editorial y tema propio, para que el
 * admin edite fotos/texto encima en vez de armar cada bloque desde
 * cero. Usa las fotos que ya existen en public/imagenes/ como
 * placeholder (son las únicas disponibles hasta que el admin suba las
 * suyas vía el picker de assets).
 */
export function createStarterCatalog(name: string, templateId?: string): NewCatalogResult {
  const id = slugify(name) || `catalogo-${Date.now()}`;
  const title = name.toUpperCase().trim();
  const year = new Date().getFullYear().toString();

  const template = CATALOG_TEMPLATES.find((t) => t.id === templateId) ?? CATALOG_TEMPLATES[0];

  const entry: CatalogEntry = {
    theme: template.theme,
    blocks: template.build(title, id, year),
  };

  return { id, entry };
}
