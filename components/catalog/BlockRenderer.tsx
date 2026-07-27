import CoverPage from "./CoverPage";
import ManifestoPage from "./ManifestoPage";
import ProductHero from "./ProductHero";
import ChapterHero from "./ChapterHero";
import ProductDetailPage from "./ProductDetailPage";
import ClosingPage from "./ClosingPage";
import type { Block } from "@/data/schema";

type BlockRendererProps = {
  block: Block;
  /** Solo lo usa el bloque "closing" — ver ClosingPage. */
  pdfHref?: string;
};

/**
 * Dispatcher genérico: traduce un bloque de datos al componente que le
 * corresponde. El switch exhaustivo (con el chequeo `never`) hace que
 * agregar un tipo de bloque nuevo sin manejarlo acá sea un error de
 * compilación, no un bug silencioso en producción.
 */
export default function BlockRenderer({ block, pdfHref }: BlockRendererProps) {
  switch (block.type) {
    case "cover":
      return <CoverPage data={block.data} />;
    case "manifesto":
      return <ManifestoPage data={block.data} />;
    case "productHero":
      return <ProductHero data={block.data} />;
    case "chapterHero":
      return <ChapterHero data={block.data} />;
    case "productDetail":
      return <ProductDetailPage variant={block.data} />;
    case "closing":
      return <ClosingPage data={block.data} pdfHref={pdfHref} />;
    default: {
      const exhaustiveCheck: never = block;
      return exhaustiveCheck;
    }
  }
}
