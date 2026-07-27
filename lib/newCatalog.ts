import type { Block, CatalogEntry, CatalogTheme, ChapterHero, LayoutId, ProductVariant } from "@/data/schema";
import { slugify } from "./slug";

export type NewCatalogResult = { id: string; entry: CatalogEntry };

type ColorwayInput = {
  slug: string;
  label: string;
  productName: string;
  bgImage: string;
  /** Una foto por columna del collage — su longitud tiene que calzar con collageLayout (2/3/4) o quedan columnas de grilla vacías. */
  collageImages: string[];
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
    collageImages: input.collageImages.map((src) => ({ src, alt: `${input.productName} ${input.label}` })),
    swatches: [{ label: input.label, type: "color", color: input.swatchColor }],
  };

  return [
    { type: "chapterHero", data: chapterHero },
    { type: "productDetail", data: productDetail },
  ];
}

export type CatalogTemplate = {
  id: string;
  label: string;
  description: string;
  /** Qué set de componentes (portada/producto/etc.) dibuja este catálogo — ver components/catalog/layouts. */
  layoutId: LayoutId;
  theme: CatalogTheme;
  /** Capturas reales pre-generadas (portada + página de producto) para el carrusel — ver public/admin-previews/ y scripts/generate-template-previews.mjs. */
  preview: { coverImage: string; detailImage: string };
  build: (title: string, id: string, year: string) => Block[];
};

/**
 * Plantillas para "crear catálogo" (carrusel del admin, post-Fase-9):
 * cada una es una composición distinta de los mismos 6 tipos de bloque
 * de siempre (nunca un componente nuevo — Non Goal del proyecto), con
 * su propio tema, cantidad de colorways, densidad de collage y copy,
 * para que se sientan realmente distintas al crearse. Terracota Bold
 * (la primera) es el modelo original, sin tocar; las otras 9 son
 * paletas/estructuras deliberadamente alejadas entre sí, no variantes
 * del mismo tono tierra/pastel.
 */
export const CATALOG_TEMPLATES: CatalogTemplate[] = [
  {
    id: "terracota-bold",
    layoutId: "original",
    label: "Terracota Bold",
    description: "Terracota y carbón, Didot + Futura, 2 colorways — el modelo original.",
    theme: {
      ink: "#2b1810",
      paper: "#f5ede4",
      line: "#3d2418",
      muted: "#8a7361",
      accent: "#c1652f",
      displayFont: 'Didot, "Bodoni MT", "Playfair Display", serif',
      bodyFont: 'Futura, "Century Gothic", sans-serif',
    },
    preview: { coverImage: "/admin-previews/terracota-bold-cover.jpg", detailImage: "/admin-previews/terracota-bold-detail.jpg" },
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
        collageImages: ["/imagenes/4.png", "/imagenes/5.png"],
        swatchColor: "#c1652f",
        description: ["BOLD SILHOUETTE | STATEMENT DETAIL", "SIGNATURE COLOURWAY"],
        collageLayout: "two",
      }),
      ...colorway({
        slug: "midnight",
        label: "MIDNIGHT",
        productName: title,
        bgImage: "/imagenes/6.png",
        collageImages: ["/imagenes/6.png", "/imagenes/7.png"],
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
    id: "editorial-lux",
    layoutId: "editorial-lux",
    label: "Editorial Lux",
    description: "Masthead de revista, versalitas, filete rojo — Vogue / Harper's Bazaar.",
    theme: {
      ink: "#1a1414",
      paper: "#f8f4ef",
      line: "#1a1414",
      muted: "#9c8f86",
      accent: "#a3122f",
      displayFont: 'Didot, "Bodoni MT", "Playfair Display", serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    preview: { coverImage: "/admin-previews/editorial-lux-cover.jpg", detailImage: "/admin-previews/editorial-lux-detail.jpg" },
    build: (title, id, year) => [
      {
        type: "cover",
        data: {
          title,
          meta: ["VOL. 01", year, "EDITORIAL"],
          subtitle: "The art of restraint",
          bottomLine1: `${title} · ${year}`,
          bottomLine2: "Shot on location, styled for the season.",
          bgImage: "/imagenes/editorial-lux/1.jpg",
          pageNumber: 0,
        },
      },
      {
        type: "manifesto",
        data: {
          heading: "AN EDITED LIFE",
          paragraph: "Every piece earns its place. Nothing here is accidental — it is chosen, considered, worn with intention.",
          bgImage: "/imagenes/editorial-lux/2.jpg",
          pageNumber: 0,
        },
      },
      {
        type: "productHero",
        data: { id, name: title, type: "COLLECTION", bgImage: "/imagenes/editorial-lux/3.jpg", pageNumber: 0 },
      },
      ...colorway({
        slug: "rouge",
        label: "ROUGE",
        productName: title,
        bgImage: "/imagenes/editorial-lux/4.jpg",
        collageImages: ["/imagenes/editorial-lux/4.jpg", "/imagenes/editorial-lux/5.jpg"],
        swatchColor: "#a3122f",
        description: ["SILK CREPE | BIAS CUT", "EVENING COLOURWAY"],
        collageLayout: "two",
      }),
      ...colorway({
        slug: "noir",
        label: "NOIR",
        productName: title,
        bgImage: "/imagenes/editorial-lux/1.jpg",
        collageImages: ["/imagenes/editorial-lux/1.jpg", "/imagenes/editorial-lux/2.jpg"],
        swatchColor: "#1a1414",
        description: ["MATTE CREPE | CLEAN LINE", "NIGHT COLOURWAY"],
        collageLayout: "two",
      }),
      {
        type: "closing",
        data: { title, line1: "THE COLLECTION", line2: "Available now.", bgImage: "/imagenes/editorial-lux/4.jpg", pageNumber: 0 },
      },
    ],
  },
  {
    id: "apple-minimal",
    layoutId: "apple-minimal",
    label: "Apple Minimal",
    description: "Blanco, foto chica y centrada, sin filetes — brochure de producto minimalista.",
    theme: {
      ink: "#1d1d1f",
      paper: "#ffffff",
      line: "#d2d2d7",
      muted: "#6e6e73",
      accent: "#0071e3",
      displayFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    preview: { coverImage: "/admin-previews/apple-minimal-cover.jpg", detailImage: "/admin-previews/apple-minimal-detail.jpg" },
    build: (title, id, year) => [
      {
        type: "cover",
        data: {
          title,
          meta: ["VOL. 01", year],
          subtitle: "Designed to disappear into your day.",
          bottomLine1: title,
          bottomLine2: "Available now.",
          bgImage: "/imagenes/apple-minimal/1.jpg",
          pageNumber: 0,
        },
      },
      {
        type: "manifesto",
        data: {
          heading: "Simplicity, considered.",
          paragraph: "Nothing extra. Nothing missing.",
          bgImage: "/imagenes/apple-minimal/2.jpg",
          pageNumber: 0,
        },
      },
      {
        type: "productHero",
        data: { id, name: title, type: "The collection.", bgImage: "/imagenes/apple-minimal/3.jpg", pageNumber: 0 },
      },
      ...colorway({
        slug: "snow",
        label: "Snow",
        productName: title,
        bgImage: "/imagenes/apple-minimal/4.jpg",
        collageImages: ["/imagenes/apple-minimal/4.jpg"],
        swatchColor: "#f5f5f5",
        description: ["Silk blend"],
        collageLayout: "one",
      }),
      {
        type: "closing",
        data: { title, line1: "The Collection", line2: "Available now.", bgImage: "/imagenes/apple-minimal/4.jpg", pageNumber: 0 },
      },
    ],
  },
  {
    id: "ikea-grid",
    layoutId: "ikea-grid",
    label: "IKEA Grid",
    description: "Grilla de bloques de color, tags amarillos, specs numeradas — catálogo práctico.",
    theme: {
      ink: "#111111",
      paper: "#ffffff",
      line: "#0058a3",
      muted: "#767676",
      accent: "#ffda1a",
      displayFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      bodyFont: "Verdana, Geneva, sans-serif",
    },
    preview: { coverImage: "/admin-previews/ikea-grid-cover.jpg", detailImage: "/admin-previews/ikea-grid-detail.jpg" },
    build: (title, id, year) => [
      {
        type: "cover",
        data: {
          title,
          meta: ["CATALOG 07", year, "HOME"],
          subtitle: "Practical living, for everyone.",
          bottomLine1: "Prices valid",
          bottomLine2: "while stocks last.",
          bgImage: "/imagenes/ikea-grid/1.jpg",
          pageNumber: 0,
        },
      },
      {
        type: "manifesto",
        data: {
          heading: "DESIGNED FOR LIFE",
          paragraph: "Functional, affordable, made to last through everyday use.",
          bgImage: "/imagenes/ikea-grid/2.jpg",
          pageNumber: 0,
        },
      },
      {
        type: "productHero",
        data: { id, name: title, type: "THE RANGE", bgImage: "/imagenes/ikea-grid/3.jpg", pageNumber: 0 },
      },
      ...colorway({
        slug: "verde",
        label: "VERDE",
        productName: title,
        bgImage: "/imagenes/ikea-grid/4.jpg",
        collageImages: ["/imagenes/ikea-grid/4.jpg", "/imagenes/ikea-grid/5.jpg", "/imagenes/ikea-grid/1.jpg", "/imagenes/ikea-grid/2.jpg"],
        swatchColor: "#3a7d44",
        description: ["MACHINE WASHABLE", "DURABLE PLEATS", "ADJUSTABLE STRAPS"],
        collageLayout: "four",
      }),
      ...colorway({
        slug: "negro",
        label: "NEGRO",
        productName: title,
        bgImage: "/imagenes/ikea-grid/3.jpg",
        collageImages: ["/imagenes/ikea-grid/3.jpg", "/imagenes/ikea-grid/1.jpg", "/imagenes/ikea-grid/4.jpg", "/imagenes/ikea-grid/5.jpg"],
        swatchColor: "#1a1a1a",
        description: ["WATER RESISTANT", "REINFORCED SEAMS", "ADJUSTABLE STRAPS"],
        collageLayout: "four",
      }),
      {
        type: "closing",
        data: { title, line1: "THE RANGE", line2: "Available in-store.", bgImage: "/imagenes/ikea-grid/4.jpg", pageNumber: 0 },
      },
    ],
  },
  {
    id: "nike-bold",
    layoutId: "nike-bold",
    label: "Nike Bold",
    description: "Tipografía enorme con bloque de color, alto contraste — campaña deportiva.",
    theme: {
      ink: "#000000",
      paper: "#ffffff",
      line: "#111111",
      muted: "#4d4d4d",
      accent: "#ff4500",
      displayFont: 'Futura, "Century Gothic", sans-serif',
      bodyFont: "Verdana, Geneva, sans-serif",
    },
    preview: { coverImage: "/admin-previews/nike-bold-cover.jpg", detailImage: "/admin-previews/nike-bold-detail.jpg" },
    build: (title, id, year) => [
      {
        type: "cover",
        data: {
          title,
          meta: [year, "RUN", "DROP 01"],
          subtitle: "No rules. No quiet.",
          bottomLine1: `${title} COLLECTION`,
          bottomLine2: "Built for the run.",
          bgImage: "/imagenes/nike-bold/1.jpg",
          pageNumber: 0,
        },
      },
      {
        type: "manifesto",
        data: {
          heading: "LOUD BY DESIGN",
          paragraph: "Made for the street, built to be seen. This is the main event.",
          bgImage: "/imagenes/nike-bold/2.jpg",
          pageNumber: 0,
        },
      },
      {
        type: "productHero",
        data: { id, name: title, type: "DROP 01", bgImage: "/imagenes/nike-bold/3.jpg", pageNumber: 0 },
      },
      ...colorway({
        slug: "volt",
        label: "VOLT",
        productName: title,
        bgImage: "/imagenes/nike-bold/4.jpg",
        collageImages: ["/imagenes/nike-bold/4.jpg", "/imagenes/nike-bold/5.jpg"],
        swatchColor: "#ff4500",
        description: ["OVERSIZED FIT | RAW EDGE", "FLAGSHIP COLOURWAY"],
        collageLayout: "two",
      }),
      ...colorway({
        slug: "blackout",
        label: "BLACKOUT",
        productName: title,
        bgImage: "/imagenes/nike-bold/2.jpg",
        collageImages: ["/imagenes/nike-bold/2.jpg", "/imagenes/nike-bold/3.jpg"],
        swatchColor: "#0a0a0a",
        description: ["MATTE FINISH | BOLD CUT", "NIGHT COLOURWAY"],
        collageLayout: "two",
      }),
      {
        type: "closing",
        data: { title, line1: "THE DROP", line2: "Available now.", bgImage: "/imagenes/nike-bold/4.jpg", pageNumber: 0 },
      },
    ],
  },
  {
    id: "zara-editorial",
    layoutId: "zara-editorial",
    label: "Zara Editorial",
    description: "Asimétrica, serif grande, tracking amplio — editorial elegante.",
    theme: {
      ink: "#111111",
      paper: "#f4f2ee",
      line: "#c9c2b8",
      muted: "#8a8378",
      accent: "#111111",
      displayFont: 'Didot, "Bodoni MT", "Playfair Display", serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    preview: { coverImage: "/admin-previews/zara-editorial-cover.jpg", detailImage: "/admin-previews/zara-editorial-detail.jpg" },
    build: (title, id, year) => [
      {
        type: "cover",
        data: {
          title,
          meta: [year, "No. 04"],
          subtitle: "Quiet confidence.",
          bottomLine1: title,
          bottomLine2: "Available now.",
          bgImage: "/imagenes/zara-editorial/1.jpg",
          pageNumber: 0,
        },
      },
      {
        type: "manifesto",
        data: {
          heading: "LESS NOISE",
          paragraph: "Structured shapes, considered fabrics, room to breathe.",
          bgImage: "/imagenes/zara-editorial/2.jpg",
          pageNumber: 0,
        },
      },
      {
        type: "productHero",
        data: { id, name: title, type: "COLLECTION", bgImage: "/imagenes/zara-editorial/3.jpg", pageNumber: 0 },
      },
      ...colorway({
        slug: "ecru",
        label: "ECRU",
        productName: title,
        bgImage: "/imagenes/zara-editorial/4.jpg",
        collageImages: ["/imagenes/zara-editorial/4.jpg", "/imagenes/zara-editorial/5.jpg"],
        swatchColor: "#ded5c4",
        description: ["DRAPED FABRIC", "TAILORED WAIST"],
        collageLayout: "two",
      }),
      ...colorway({
        slug: "noir",
        label: "NOIR",
        productName: title,
        bgImage: "/imagenes/zara-editorial/1.jpg",
        collageImages: ["/imagenes/zara-editorial/1.jpg", "/imagenes/zara-editorial/2.jpg"],
        swatchColor: "#2b2b2b",
        description: ["FLUID SILHOUETTE", "BIAS CUT"],
        collageLayout: "two",
      }),
      {
        type: "closing",
        data: { title, line1: "THE COLLECTION", line2: "Available now.", bgImage: "/imagenes/zara-editorial/4.jpg", pageNumber: 0 },
      },
    ],
  },
  {
    id: "japanese-minimal",
    layoutId: "japanese-minimal",
    label: "Japanese Minimal",
    description: "Foto chica descentrada, un sello rojo, mucho silencio — minimalismo japonés.",
    theme: {
      ink: "#2b2b2b",
      paper: "#f7f5f0",
      line: "#dcd7cc",
      muted: "#a39c8e",
      accent: "#b23a2e",
      displayFont: 'Georgia, "Times New Roman", serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    preview: { coverImage: "/admin-previews/japanese-minimal-cover.jpg", detailImage: "/admin-previews/japanese-minimal-detail.jpg" },
    build: (title, id, year) => [
      {
        type: "cover",
        data: {
          title,
          meta: ["VOL. 01", year],
          subtitle: "The space between.",
          bottomLine1: title,
          bottomLine2: "Available now.",
          bgImage: "/imagenes/japanese-minimal/1.jpg",
          pageNumber: 0,
        },
      },
      {
        type: "manifesto",
        data: {
          heading: "QUIET FORM",
          paragraph: "Nothing extra, nothing missing.",
          bgImage: "/imagenes/japanese-minimal/2.jpg",
          pageNumber: 0,
        },
      },
      {
        type: "productHero",
        data: { id, name: title, type: "Collection", bgImage: "/imagenes/japanese-minimal/3.jpg", pageNumber: 0 },
      },
      ...colorway({
        slug: "ash",
        label: "Ash",
        productName: title,
        bgImage: "/imagenes/japanese-minimal/4.jpg",
        collageImages: ["/imagenes/japanese-minimal/4.jpg"],
        swatchColor: "#8a8378",
        description: ["Hand finished"],
        collageLayout: "one",
      }),
      {
        type: "closing",
        data: { title, line1: "The Collection", line2: "Available now.", bgImage: "/imagenes/japanese-minimal/4.jpg", pageNumber: 0 },
      },
    ],
  },
  {
    id: "streetwear-dark",
    layoutId: "streetwear-dark",
    label: "Streetwear Dark",
    description: "Fondo oscuro, tipografía en capas, stickers rotados — lookbook de calle.",
    theme: {
      ink: "#050505",
      paper: "#0a0a0a",
      line: "#333333",
      muted: "#888888",
      accent: "#39ff14",
      displayFont: 'Futura, "Century Gothic", sans-serif',
      bodyFont: '"Courier New", monospace',
    },
    preview: { coverImage: "/admin-previews/streetwear-dark-cover.jpg", detailImage: "/admin-previews/streetwear-dark-detail.jpg" },
    build: (title, id, year) => [
      {
        type: "cover",
        data: {
          title,
          meta: ["ZINE 01", year, "NO SLEEP"],
          subtitle: "Not for the algorithm.",
          bottomLine1: title,
          bottomLine2: "Available now.",
          bgImage: "/imagenes/streetwear-dark/1.jpg",
          pageNumber: 0,
        },
      },
      {
        type: "manifesto",
        data: {
          heading: "RAW ON PURPOSE",
          paragraph: "No filters, no polish. This is the collection unedited.",
          bgImage: "/imagenes/streetwear-dark/2.jpg",
          pageNumber: 0,
        },
      },
      {
        type: "productHero",
        data: { id, name: title, type: "DROP", bgImage: "/imagenes/streetwear-dark/3.jpg", pageNumber: 0 },
      },
      ...colorway({
        slug: "acid",
        label: "ACID",
        productName: title,
        bgImage: "/imagenes/streetwear-dark/4.jpg",
        collageImages: ["/imagenes/streetwear-dark/4.jpg", "/imagenes/streetwear-dark/5.jpg", "/imagenes/streetwear-dark/1.jpg"],
        swatchColor: "#39ff14",
        description: ["UNFINISHED HEM", "ONE OF ONE FEEL"],
        collageLayout: "three",
      }),
      ...colorway({
        slug: "blackout",
        label: "BLACKOUT",
        productName: title,
        bgImage: "/imagenes/streetwear-dark/2.jpg",
        collageImages: ["/imagenes/streetwear-dark/2.jpg", "/imagenes/streetwear-dark/3.jpg", "/imagenes/streetwear-dark/4.jpg"],
        swatchColor: "#111111",
        description: ["MATTE BLACK", "RAW FINISH"],
        collageLayout: "three",
      }),
      {
        type: "closing",
        data: { title, line1: "THE ZINE", line2: "Available now.", bgImage: "/imagenes/streetwear-dark/4.jpg", pageNumber: 0 },
      },
    ],
  },
  {
    id: "architecture-grid",
    layoutId: "architecture-grid",
    label: "Architecture Grid",
    description: "Líneas de grilla, coordenadas técnicas, captions FIG. — portfolio de arquitectura.",
    theme: {
      ink: "#1a1a1a",
      paper: "#ffffff",
      line: "#1a1a1a",
      muted: "#999999",
      accent: "#c9622a",
      displayFont: 'Futura, "Century Gothic", sans-serif',
      bodyFont: 'Futura, "Century Gothic", sans-serif',
    },
    preview: { coverImage: "/admin-previews/architecture-grid-cover.jpg", detailImage: "/admin-previews/architecture-grid-detail.jpg" },
    build: (title, id, year) => [
      {
        type: "cover",
        data: {
          title,
          meta: ["A—01", year, "No 07"],
          subtitle: "Form follows material.",
          bottomLine1: title,
          bottomLine2: "Available now.",
          bgImage: "/imagenes/architecture-grid/1.jpg",
          pageNumber: 0,
        },
      },
      {
        type: "manifesto",
        data: {
          heading: "BUILT ON PURPOSE",
          paragraph: "Every line has a reason to exist.",
          bgImage: "/imagenes/architecture-grid/2.jpg",
          pageNumber: 0,
        },
      },
      {
        type: "productHero",
        data: { id, name: title, type: "PORTFOLIO", bgImage: "/imagenes/architecture-grid/3.jpg", pageNumber: 0 },
      },
      ...colorway({
        slug: "concrete",
        label: "CONCRETE",
        productName: title,
        bgImage: "/imagenes/architecture-grid/4.jpg",
        collageImages: ["/imagenes/architecture-grid/4.jpg", "/imagenes/architecture-grid/5.jpg", "/imagenes/architecture-grid/1.jpg", "/imagenes/architecture-grid/2.jpg"],
        swatchColor: "#999999",
        description: ["RIGID PLEAT", "ARCHITECTURAL DRAPE"],
        collageLayout: "four",
      }),
      ...colorway({
        slug: "ivory",
        label: "IVORY",
        productName: title,
        bgImage: "/imagenes/architecture-grid/3.jpg",
        collageImages: ["/imagenes/architecture-grid/3.jpg", "/imagenes/architecture-grid/1.jpg", "/imagenes/architecture-grid/4.jpg", "/imagenes/architecture-grid/5.jpg"],
        swatchColor: "#e5e0d8",
        description: ["SOFT STRUCTURE", "CONSIDERED FORM"],
        collageLayout: "four",
      }),
      {
        type: "closing",
        data: { title, line1: "THE PORTFOLIO", line2: "Available now.", bgImage: "/imagenes/architecture-grid/4.jpg", pageNumber: 0 },
      },
    ],
  },
  {
    id: "modern-premium",
    layoutId: "modern-premium",
    label: "Modern Premium",
    description: "Split 50/50, marco con filete dorado — catálogo de lujo contemporáneo.",
    theme: {
      ink: "#141414",
      paper: "#efece6",
      line: "#d4cfc4",
      muted: "#8f877a",
      accent: "#8a6d3b",
      displayFont: 'Palatino, "Palatino Linotype", "Book Antiqua", serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    preview: { coverImage: "/admin-previews/modern-premium-cover.jpg", detailImage: "/admin-previews/modern-premium-detail.jpg" },
    build: (title, id, year) => [
      {
        type: "cover",
        data: {
          title,
          meta: [year, "EDIT 09"],
          subtitle: "Contemporary, considered.",
          bottomLine1: title,
          bottomLine2: "Available now.",
          bgImage: "/imagenes/modern-premium/1.jpg",
          pageNumber: 0,
        },
      },
      {
        type: "manifesto",
        data: {
          heading: "QUIET LUXURY",
          paragraph: "Refined materials, precise cuts, nothing shouted.",
          bgImage: "/imagenes/modern-premium/2.jpg",
          pageNumber: 0,
        },
      },
      {
        type: "productHero",
        data: { id, name: title, type: "THE EDIT", bgImage: "/imagenes/modern-premium/3.jpg", pageNumber: 0 },
      },
      ...colorway({
        slug: "champagne",
        label: "CHAMPAGNE",
        productName: title,
        bgImage: "/imagenes/modern-premium/4.jpg",
        collageImages: ["/imagenes/modern-premium/4.jpg", "/imagenes/modern-premium/5.jpg", "/imagenes/modern-premium/1.jpg"],
        swatchColor: "#c8b48a",
        description: ["SILK-BLEND DRAPE", "TAILORED WAIST"],
        collageLayout: "three",
      }),
      ...colorway({
        slug: "onyx",
        label: "ONYX",
        productName: title,
        bgImage: "/imagenes/modern-premium/2.jpg",
        collageImages: ["/imagenes/modern-premium/2.jpg", "/imagenes/modern-premium/3.jpg", "/imagenes/modern-premium/4.jpg"],
        swatchColor: "#1a1a1a",
        description: ["STRUCTURED BODICE", "FLUID SKIRT"],
        collageLayout: "three",
      }),
      {
        type: "closing",
        data: { title, line1: "THE EDIT", line2: "Available now.", bgImage: "/imagenes/modern-premium/4.jpg", pageNumber: 0 },
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
    layoutId: template.layoutId,
    theme: template.theme,
    blocks: template.build(title, id, year),
  };

  return { id, entry };
}
