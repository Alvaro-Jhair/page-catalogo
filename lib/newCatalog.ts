import type { Block, CatalogEntry, CatalogTheme, ChapterHero, ProductVariant } from "@/data/schema";
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
  theme: CatalogTheme;
  /** Contenido de muestra para la miniatura del carrusel (no depende de lo que el admin todavía esté tipeando). */
  preview: { image: string; title: string; tag: string };
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
    preview: { image: "/imagenes/4.png", title: "Terracota Bold", tag: "LOOKBOOK" },
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
    id: "monocromo-editorial",
    label: "Monocromo Editorial",
    description: "Puro negro y blanco, Times + Arial, 2 colorways — sin color de donde agarrarse.",
    theme: {
      ink: "#000000",
      paper: "#ffffff",
      line: "#000000",
      muted: "#888888",
      accent: "#000000",
      displayFont: '"Times New Roman", Times, serif',
      bodyFont: "Arial, Helvetica, sans-serif",
    },
    preview: { image: "/imagenes/6.png", title: "Monocromo", tag: "EDITORIAL" },
    build: (title, id, year) => [
      {
        type: "cover",
        data: {
          title,
          meta: ["VOL. 01", year, "EDITORIAL"],
          subtitle: "BLACK AND WHITE, NOTHING ELSE",
          bottomLine1: `${title} · ${year}`,
          bottomLine2: "A study in contrast, nothing more.",
          bgImage: "/imagenes/1.png",
          pageNumber: 0,
        },
      },
      {
        type: "manifesto",
        data: {
          heading: "STRIPPED DOWN",
          paragraph: "No colour to hide behind. Just line, shadow, and the shape of the thing itself.",
          bgImage: "/imagenes/2.png",
          pageNumber: 0,
        },
      },
      {
        type: "productHero",
        data: { id, name: title, type: "EDITORIAL", bgImage: "/imagenes/3.png", pageNumber: 0 },
      },
      ...colorway({
        slug: "ink",
        label: "INK",
        productName: title,
        bgImage: "/imagenes/6.png",
        collageImages: ["/imagenes/6.png", "/imagenes/4.png", "/imagenes/8.png"],
        swatchColor: "#000000",
        description: ["MATTE BLACK | SHARP TAILORING", "PRIMARY COLOURWAY"],
        collageLayout: "three",
      }),
      ...colorway({
        slug: "chalk",
        label: "CHALK",
        productName: title,
        bgImage: "/imagenes/8.png",
        collageImages: ["/imagenes/8.png", "/imagenes/9.png", "/imagenes/5.png"],
        swatchColor: "#f2f2f2",
        description: ["RAW WHITE | UNLINED CUT", "CONTRAST COLOURWAY"],
        collageLayout: "three",
      }),
      {
        type: "closing",
        data: { title, line1: "THE EDITORIAL", line2: "Available now.", bgImage: "/imagenes/9.png", pageNumber: 0 },
      },
    ],
  },
  {
    id: "sunset-pop",
    label: "Sunset Pop",
    description: "Fucsia y coral sobre crema, Futura + Verdana, 3 colorways — color en voz alta.",
    theme: {
      ink: "#2a1330",
      paper: "#fff3ea",
      line: "#ff6b6b",
      muted: "#c98a9c",
      accent: "#ff3d7f",
      displayFont: 'Futura, "Century Gothic", sans-serif',
      bodyFont: "Verdana, Geneva, sans-serif",
    },
    preview: { image: "/imagenes/5.png", title: "Sunset Pop", tag: "DROP" },
    build: (title, id, year) => [
      {
        type: "cover",
        data: {
          title,
          meta: ["VOL. 01", year, "DROP"],
          subtitle: "COLOUR OUT LOUD",
          bottomLine1: `${title} · ${year}`,
          bottomLine2: "Made for golden hour and everything after.",
          bgImage: "/imagenes/1.png",
          pageNumber: 0,
        },
      },
      {
        type: "manifesto",
        data: {
          heading: "CHASE THE LIGHT",
          paragraph:
            "Warm tones, high energy, zero apologies. This collection is for showing up, not blending in.",
          bgImage: "/imagenes/2.png",
          pageNumber: 0,
        },
      },
      {
        type: "productHero",
        data: { id, name: title, type: "DROP", bgImage: "/imagenes/3.png", pageNumber: 0 },
      },
      ...colorway({
        slug: "coral",
        label: "CORAL",
        productName: title,
        bgImage: "/imagenes/5.png",
        collageImages: ["/imagenes/5.png", "/imagenes/6.png", "/imagenes/7.png", "/imagenes/8.png"],
        swatchColor: "#ff6b6b",
        description: ["SOFT KNIT | CROPPED FIT", "SUNRISE COLOURWAY"],
        collageLayout: "four",
      }),
      ...colorway({
        slug: "fuchsia",
        label: "FUCHSIA",
        productName: title,
        bgImage: "/imagenes/7.png",
        collageImages: ["/imagenes/7.png", "/imagenes/8.png", "/imagenes/9.png", "/imagenes/10.png"],
        swatchColor: "#ff3d7f",
        description: ["BOLD TRIM | RELAXED CUT", "GOLDEN HOUR COLOURWAY"],
        collageLayout: "four",
      }),
      ...colorway({
        slug: "tangerine",
        label: "TANGERINE",
        productName: title,
        bgImage: "/imagenes/10.png",
        collageImages: ["/imagenes/10.png", "/imagenes/4.png", "/imagenes/5.png", "/imagenes/6.png"],
        swatchColor: "#ff9142",
        description: ["LIGHTWEIGHT KNIT | EASY FIT", "SUNSET COLOURWAY"],
        collageLayout: "four",
      }),
      {
        type: "closing",
        data: { title, line1: "THE DROP", line2: "Available now.", bgImage: "/imagenes/4.png", pageNumber: 0 },
      },
    ],
  },
  {
    id: "costa-lino",
    label: "Costa Lino",
    description: "Beige arena y azul mar, Palatino + sistema, 2 colorways — sin apuro.",
    theme: {
      ink: "#33403c",
      paper: "#f4efe6",
      line: "#c9bfa8",
      muted: "#8f9a92",
      accent: "#5b7f8f",
      displayFont: 'Palatino, "Palatino Linotype", "Book Antiqua", serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    preview: { image: "/imagenes/7.png", title: "Costa Lino", tag: "RESORT" },
    build: (title, id, year) => [
      {
        type: "cover",
        data: {
          title,
          meta: ["VOL. 01", year, "RESORT"],
          subtitle: "LINEN, SALT AIR, SLOW MORNINGS",
          bottomLine1: `${title} · ${year}`,
          bottomLine2: "Dressing for the coast, wherever that is.",
          bgImage: "/imagenes/1.png",
          pageNumber: 0,
        },
      },
      {
        type: "manifesto",
        data: {
          heading: "UNHURRIED",
          paragraph:
            "Natural fibres, loose silhouettes, colours pulled straight from the shoreline. Nothing here is in a rush.",
          bgImage: "/imagenes/2.png",
          pageNumber: 0,
        },
      },
      {
        type: "productHero",
        data: { id, name: title, type: "RESORT", bgImage: "/imagenes/3.png", pageNumber: 0 },
      },
      ...colorway({
        slug: "sand",
        label: "SAND",
        productName: title,
        bgImage: "/imagenes/7.png",
        collageImages: ["/imagenes/7.png", "/imagenes/8.png"],
        swatchColor: "#d8c9a8",
        description: ["WASHED LINEN | RELAXED FIT", "SHORELINE COLOURWAY"],
        collageLayout: "two",
      }),
      ...colorway({
        slug: "tide",
        label: "TIDE",
        productName: title,
        bgImage: "/imagenes/8.png",
        collageImages: ["/imagenes/8.png", "/imagenes/9.png"],
        swatchColor: "#5b7f8f",
        description: ["LIGHTWEIGHT WEAVE | LOOSE DRAPE", "SEA COLOURWAY"],
        collageLayout: "two",
      }),
      {
        type: "closing",
        data: { title, line1: "THE RESORT EDIT", line2: "Available now.", bgImage: "/imagenes/10.png", pageNumber: 0 },
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
    preview: { image: "/imagenes/10.png", title: "Streetwear", tag: "DROP" },
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
        collageImages: ["/imagenes/5.png", "/imagenes/6.png", "/imagenes/7.png", "/imagenes/8.png"],
        swatchColor: "#d4ff3f",
        description: ["OVERSIZED FIT | RAW EDGE", "FLAGSHIP COLOURWAY"],
        collageLayout: "four",
      }),
      ...colorway({
        slug: "blackout",
        label: "BLACKOUT",
        productName: title,
        bgImage: "/imagenes/7.png",
        collageImages: ["/imagenes/7.png", "/imagenes/8.png", "/imagenes/9.png", "/imagenes/10.png"],
        swatchColor: "#0a0a0a",
        description: ["MATTE BLACK | HEAVY WEIGHT", "NIGHT COLOURWAY"],
        collageLayout: "four",
      }),
      ...colorway({
        slug: "concrete",
        label: "CONCRETE",
        productName: title,
        bgImage: "/imagenes/10.png",
        collageImages: ["/imagenes/10.png", "/imagenes/4.png", "/imagenes/5.png", "/imagenes/6.png"],
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
    id: "joyas-reales",
    label: "Joyas Reales",
    description: "Esmeralda y carbón con acento dorado, Didot + sistema, 2 colorways — opulencia contenida.",
    theme: {
      ink: "#0d1f1a",
      paper: "#f1ece0",
      line: "#1c3d33",
      muted: "#7c8f87",
      accent: "#c9a227",
      displayFont: 'Didot, "Bodoni MT", "Playfair Display", serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    preview: { image: "/imagenes/4.png", title: "Joyas Reales", tag: "HAUTE" },
    build: (title, id, year) => [
      {
        type: "cover",
        data: {
          title,
          meta: ["VOL. 01", year, "HAUTE"],
          subtitle: "OPULENCE, QUIETLY WORN",
          bottomLine1: `${title} · ${year}`,
          bottomLine2: "Jewel tones for rooms that remember you.",
          bgImage: "/imagenes/1.png",
          pageNumber: 0,
        },
      },
      {
        type: "manifesto",
        data: {
          heading: "WORTH THE LIGHT",
          paragraph:
            "Deep colour, rich texture, gold that catches when you move. This is the collection for the night that matters.",
          bgImage: "/imagenes/2.png",
          pageNumber: 0,
        },
      },
      {
        type: "productHero",
        data: { id, name: title, type: "HAUTE COLLECTION", bgImage: "/imagenes/3.png", pageNumber: 0 },
      },
      ...colorway({
        slug: "emerald",
        label: "EMERALD",
        productName: title,
        bgImage: "/imagenes/4.png",
        collageImages: ["/imagenes/4.png", "/imagenes/5.png", "/imagenes/6.png"],
        swatchColor: "#1c3d33",
        description: ["RICH DRAPE | STRUCTURED BODICE", "JEWEL COLOURWAY"],
        collageLayout: "three",
      }),
      ...colorway({
        slug: "sapphire",
        label: "SAPPHIRE",
        productName: title,
        bgImage: "/imagenes/6.png",
        collageImages: ["/imagenes/6.png", "/imagenes/7.png", "/imagenes/8.png"],
        swatchColor: "#1a2f5c",
        description: ["FLUID SATIN | BIAS CUT", "MIDNIGHT COLOURWAY"],
        collageLayout: "three",
      }),
      {
        type: "closing",
        data: { title, line1: "THE HAUTE EDIT", line2: "Available now.", bgImage: "/imagenes/9.png", pageNumber: 0 },
      },
    ],
  },
  {
    id: "blush-minimal",
    label: "Blush Minimal",
    description: "Rosa polvo y crema, Palatino, 1 colorway — más aire, menos ruido.",
    theme: {
      ink: "#3a3a3a",
      paper: "#f3ece6",
      line: "#d8cfc7",
      muted: "#a89b8e",
      accent: "#c9a7a0",
      displayFont: 'Palatino, "Palatino Linotype", "Book Antiqua", serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    preview: { image: "/imagenes/8.png", title: "Blush Minimal", tag: "CAPSULE" },
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
        collageImages: ["/imagenes/8.png", "/imagenes/9.png", "/imagenes/10.png"],
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
  {
    id: "industrial-concreto",
    label: "Industrial Concreto",
    description: "Gris concreto y azul acero, Times + Verdana, 3 colorways — función antes que forma.",
    theme: {
      ink: "#1c1c1c",
      paper: "#e8e6e1",
      line: "#4a4a4a",
      muted: "#8a8a85",
      accent: "#3f6b8f",
      displayFont: '"Times New Roman", Times, serif',
      bodyFont: "Verdana, Geneva, sans-serif",
    },
    preview: { image: "/imagenes/9.png", title: "Industrial", tag: "UTILITY" },
    build: (title, id, year) => [
      {
        type: "cover",
        data: {
          title,
          meta: ["VOL. 01", year, "UTILITY"],
          subtitle: "FUNCTION FIRST",
          bottomLine1: `${title} · ${year}`,
          bottomLine2: "Built for movement, not display cases.",
          bgImage: "/imagenes/1.png",
          pageNumber: 0,
        },
      },
      {
        type: "manifesto",
        data: {
          heading: "FORM FOLLOWS USE",
          paragraph:
            "No embellishment without a reason. Every seam, every pocket, every fold is there because it has to be.",
          bgImage: "/imagenes/2.png",
          pageNumber: 0,
        },
      },
      {
        type: "productHero",
        data: { id, name: title, type: "UTILITY", bgImage: "/imagenes/3.png", pageNumber: 0 },
      },
      ...colorway({
        slug: "concrete",
        label: "CONCRETE",
        productName: title,
        bgImage: "/imagenes/5.png",
        collageImages: ["/imagenes/5.png", "/imagenes/6.png", "/imagenes/7.png", "/imagenes/8.png"],
        swatchColor: "#8a8a85",
        description: ["WASHED CANVAS | UTILITY POCKET", "BASE COLOURWAY"],
        collageLayout: "four",
      }),
      ...colorway({
        slug: "steel",
        label: "STEEL",
        productName: title,
        bgImage: "/imagenes/7.png",
        collageImages: ["/imagenes/7.png", "/imagenes/8.png", "/imagenes/9.png", "/imagenes/10.png"],
        swatchColor: "#3f6b8f",
        description: ["COATED FINISH | REINFORCED SEAM", "WORK COLOURWAY"],
        collageLayout: "four",
      }),
      ...colorway({
        slug: "graphite",
        label: "GRAPHITE",
        productName: title,
        bgImage: "/imagenes/9.png",
        collageImages: ["/imagenes/9.png", "/imagenes/10.png", "/imagenes/4.png", "/imagenes/5.png"],
        swatchColor: "#2a2a2a",
        description: ["HEAVYWEIGHT TWILL | BOXY FIT", "NIGHT SHIFT COLOURWAY"],
        collageLayout: "four",
      }),
      {
        type: "closing",
        data: { title, line1: "THE UTILITY EDIT", line2: "Available now.", bgImage: "/imagenes/6.png", pageNumber: 0 },
      },
    ],
  },
  {
    id: "jardin-botanico",
    label: "Jardín Botánico",
    description: "Verde salvia y crema, Georgia + sistema, 2 colorways — al ritmo de una estación.",
    theme: {
      ink: "#2b3a2f",
      paper: "#f6f4ec",
      line: "#a9b79a",
      muted: "#8a9482",
      accent: "#5c7a52",
      displayFont: 'Georgia, "Times New Roman", serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    preview: { image: "/imagenes/4.png", title: "Jardín Botánico", tag: "BOTANICAL" },
    build: (title, id, year) => [
      {
        type: "cover",
        data: {
          title,
          meta: ["VOL. 01", year, "BOTANICAL"],
          subtitle: "GROWN, NOT MANUFACTURED",
          bottomLine1: `${title} · ${year}`,
          bottomLine2: "Colour borrowed from the garden, not the lab.",
          bgImage: "/imagenes/1.png",
          pageNumber: 0,
        },
      },
      {
        type: "manifesto",
        data: {
          heading: "SLOW BLOOM",
          paragraph:
            "Soft green, natural texture, a pace closer to a season than a trend. This collection takes its time.",
          bgImage: "/imagenes/2.png",
          pageNumber: 0,
        },
      },
      {
        type: "productHero",
        data: { id, name: title, type: "BOTANICAL", bgImage: "/imagenes/3.png", pageNumber: 0 },
      },
      ...colorway({
        slug: "sage",
        label: "SAGE",
        productName: title,
        bgImage: "/imagenes/4.png",
        collageImages: ["/imagenes/4.png", "/imagenes/5.png"],
        swatchColor: "#5c7a52",
        description: ["ORGANIC WEAVE | LOOSE SLEEVE", "GARDEN COLOURWAY"],
        collageLayout: "two",
      }),
      ...colorway({
        slug: "moss",
        label: "MOSS",
        productName: title,
        bgImage: "/imagenes/8.png",
        collageImages: ["/imagenes/8.png", "/imagenes/9.png"],
        swatchColor: "#3d5233",
        description: ["BRUSHED TEXTURE | RELAXED FIT", "FOREST COLOURWAY"],
        collageLayout: "two",
      }),
      {
        type: "closing",
        data: { title, line1: "THE BOTANICAL EDIT", line2: "Available now.", bgImage: "/imagenes/10.png", pageNumber: 0 },
      },
    ],
  },
  {
    id: "citrico-electrico",
    label: "Cítrico Eléctrico",
    description: "Amarillo y naranja sobre negro, Futura + Verdana, 3 colorways — a todo volumen.",
    theme: {
      ink: "#111111",
      paper: "#fff9e8",
      line: "#222222",
      muted: "#7a7a6a",
      accent: "#ffb800",
      displayFont: 'Futura, "Century Gothic", sans-serif',
      bodyFont: "Verdana, Geneva, sans-serif",
    },
    preview: { image: "/imagenes/10.png", title: "Cítrico Eléctrico", tag: "ENERGY" },
    build: (title, id, year) => [
      {
        type: "cover",
        data: {
          title,
          meta: ["VOL. 01", year, "ENERGY"],
          subtitle: "TURN IT UP",
          bottomLine1: `${title} · ${year}`,
          bottomLine2: "Not for standing in the back.",
          bgImage: "/imagenes/1.png",
          pageNumber: 0,
        },
      },
      {
        type: "manifesto",
        data: {
          heading: "FULL VOLUME",
          paragraph:
            "Citrus brights against deep black — this collection is loud on purpose. Wear it like you mean it.",
          bgImage: "/imagenes/2.png",
          pageNumber: 0,
        },
      },
      {
        type: "productHero",
        data: { id, name: title, type: "ENERGY", bgImage: "/imagenes/3.png", pageNumber: 0 },
      },
      ...colorway({
        slug: "citrus",
        label: "CITRUS",
        productName: title,
        bgImage: "/imagenes/6.png",
        collageImages: ["/imagenes/6.png", "/imagenes/7.png", "/imagenes/8.png", "/imagenes/9.png"],
        swatchColor: "#ffb800",
        description: ["GLOSSY FINISH | CROPPED CUT", "FLAGSHIP COLOURWAY"],
        collageLayout: "four",
      }),
      ...colorway({
        slug: "tangerine",
        label: "TANGERINE",
        productName: title,
        bgImage: "/imagenes/5.png",
        collageImages: ["/imagenes/5.png", "/imagenes/6.png", "/imagenes/7.png", "/imagenes/8.png"],
        swatchColor: "#ff7a00",
        description: ["BOLD TRIM | FITTED SILHOUETTE", "HIGH-ENERGY COLOURWAY"],
        collageLayout: "four",
      }),
      ...colorway({
        slug: "blackout",
        label: "BLACKOUT",
        productName: title,
        bgImage: "/imagenes/7.png",
        collageImages: ["/imagenes/7.png", "/imagenes/8.png", "/imagenes/9.png", "/imagenes/10.png"],
        swatchColor: "#111111",
        description: ["MATTE BLACK | SHARP LINE", "CONTRAST COLOURWAY"],
        collageLayout: "four",
      }),
      {
        type: "closing",
        data: { title, line1: "THE ENERGY DROP", line2: "Available now.", bgImage: "/imagenes/10.png", pageNumber: 0 },
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
