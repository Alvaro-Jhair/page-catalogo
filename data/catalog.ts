// Fuente única de verdad del contenido del catálogo.
// Cambiar un precio, una descripción o una colorway se hace aquí,
// no dentro de los componentes ni del markup.

export type SwatchItem = {
  label: string;
  image: string;
};

export type CollageLayout = "four" | "three" | "two";

export type CollageImage = {
  src: string;
  alt: string;
};

export type ProductVariant = {
  /** id único de la sección, usado como ancla */
  id: string;
  pageNumber: number;
  name: string;
  type: string;
  price: string;
  /** cada string es una línea de la descripción */
  description: string[];
  collageLayout: CollageLayout;
  collageImages: CollageImage[];
  swatches: SwatchItem[];
};

export type ChapterHero = {
  id: string;
  pageNumber: number;
  name: string;
  label: string;
  bgImage: string;
};

export const cover = {
  title: "ANGEL DE CANELA",
  meta: ["VOL.01", "2026", "LOOKBOOK"],
  subtitle: "ESSENCE OF THE SEA — ARIEL COLLECTION",
  bottomLine1: "ARIEL · SUMMER 2026",
  bottomLine2: "Inspired by the beauty, breeze, and freedom of the sea.",
  bgImage: "/imagenes/1.png",
  pageNumber: 1,
};

export const manifesto = {
  heading: "RESORT WEAR FOR SUNLIT MOMENTS",
  paragraph:
    "INSPIRED BY THE BEAUTY, BREEZE, AND FREEDOM OF THE SEA, THE ARIEL COLLECTION BLENDS FLUID PLEATS WITH A SOFT RESORT STATE OF MIND. LIGHTWEIGHT MOVEMENT, SCULPTED NECKLINES, AND OPEN-BACK DETAILS DESIGNED FOR WARM DAYS, COOL EVENINGS, AND ENDLESS ESCAPES.",
  bgImage: "/imagenes/2.png",
  pageNumber: 2,
};

export const productHero = {
  id: "ariel",
  name: "ARIEL",
  type: "DRESS",
  bgImage: "/imagenes/3.png",
  pageNumber: 3,
};

const swatchSet: Record<"ivory" | "emerald" | "noir" | "gold", SwatchItem> = {
  ivory: { label: "Ivory", image: "/imagenes/1.png" },
  emerald: { label: "Emerald", image: "/imagenes/4.png" },
  noir: { label: "Noir", image: "/imagenes/6.png" },
  gold: { label: "Gold", image: "/imagenes/8.png" },
};

export const productVariants: ProductVariant[] = [
  {
    id: "ivory",
    pageNumber: 4,
    name: "ARIEL",
    type: "DRESS",
    price: "S/ 229",
    description: [
      "PLEATED TEXTURE | HALTER NECKLINE",
      "OPEN-BACK TIE DETAIL",
      "COLOURWAYS: IVORY · EMERALD · NOIR · GOLD",
    ],
    collageLayout: "four",
    collageImages: [
      { src: "/imagenes/1.png", alt: "Ariel ivory side" },
      { src: "/imagenes/2.png", alt: "Ariel ivory seated" },
      { src: "/imagenes/3.png", alt: "Ariel ivory back" },
      { src: "/imagenes/4.png", alt: "Ariel ivory beach back" },
      { src: "/imagenes/5.png", alt: "Ariel ivory front" },
      { src: "/imagenes/6.png", alt: "Ariel ivory cover look" },
      { src: "/imagenes/7.png", alt: "Ariel ivory beach" },
      { src: "/imagenes/8.png", alt: "Ariel ivory detail" },
    ],
    swatches: [swatchSet.ivory, swatchSet.emerald, swatchSet.noir, swatchSet.gold],
  },
  {
    id: "emerald",
    pageNumber: 6,
    name: "ARIEL",
    type: "EMERALD DRESS",
    price: "S/ 229",
    description: ["PLEATED FABRIC | FLUID SILHOUETTE", "RESORT COLOURWAY"],
    collageLayout: "two",
    collageImages: [
      { src: "/imagenes/4.png", alt: "Ariel emerald portrait" },
      { src: "/imagenes/5.png", alt: "Ariel emerald front" },
    ],
    swatches: [swatchSet.emerald],
  },
  {
    id: "noir",
    pageNumber: 8,
    name: "ARIEL",
    type: "NOIR DRESS",
    price: "S/ 229",
    description: ["PLEATED TEXTURE | OPEN-BACK DESIGN", "EVENING COLOURWAY"],
    collageLayout: "four",
    collageImages: [
      { src: "/imagenes/6.png", alt: "Ariel noir studio front" },
      { src: "/imagenes/7.png", alt: "Ariel noir studio side" },
      { src: "/imagenes/8.png", alt: "Ariel noir studio back" },
      { src: "/imagenes/9.png", alt: "Ariel noir beach front" },
      { src: "/imagenes/10.png", alt: "Ariel noir detail" },
      { src: "/imagenes/1.png", alt: "Ariel noir back tie" },
      { src: "/imagenes/2.png", alt: "Ariel noir dress" },
      { src: "/imagenes/3.png", alt: "Ariel noir seaside" },
    ],
    swatches: [swatchSet.noir],
  },
  {
    id: "gold-dress",
    pageNumber: 10,
    name: "ARIEL",
    type: "GOLD DRESS",
    price: "S/ 229",
    description: ["METALLIC PLEATED TEXTURE", "OCCASION COLOURWAY"],
    collageLayout: "three",
    collageImages: [
      { src: "/imagenes/8.png", alt: "Ariel gold front" },
      { src: "/imagenes/9.png", alt: "Ariel gold back" },
      { src: "/imagenes/10.png", alt: "Ariel gold beach" },
    ],
    swatches: [swatchSet.gold],
  },
];

export const chapterHeroes: ChapterHero[] = [
  { id: "green", pageNumber: 5, name: "ARIEL", label: "EMERALD", bgImage: "/imagenes/4.png" },
  { id: "black", pageNumber: 7, name: "ARIEL", label: "NOIR", bgImage: "/imagenes/6.png" },
  { id: "gold", pageNumber: 9, name: "ARIEL", label: "GOLD", bgImage: "/imagenes/8.png" },
];

export const closing = {
  title: "ARIEL",
  line1: "ESSENCE OF THE SEA · SUMMER 2026",
  line2: "ANGEL DE CANELA",
  bgImage: "/imagenes/10.png",
  pageNumber: 11,
};
