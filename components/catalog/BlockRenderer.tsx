import { LAYOUTS } from "./layouts";
import type { Block, LayoutId } from "@/data/schema";

type BlockRendererProps = {
  block: Block;
  /** Qué identidad visual usar — ver components/catalog/layouts. */
  layoutId: LayoutId;
  /** Solo lo usa el bloque "closing" — ver ClosingPage. */
  pdfHref?: string;
};

/**
 * Dispatcher genérico: traduce un bloque de datos al componente que le
 * corresponde, dentro del set de componentes del layout activo. El switch
 * exhaustivo (con el chequeo `never`) hace que agregar un tipo de bloque
 * nuevo sin manejarlo acá sea un error de compilación, no un bug
 * silencioso en producción.
 */
export default function BlockRenderer({ block, layoutId, pdfHref }: BlockRendererProps) {
  const L = LAYOUTS[layoutId];
  switch (block.type) {
    case "cover":
      return <L.CoverPage data={block.data} />;
    case "manifesto":
      return <L.ManifestoPage data={block.data} />;
    case "productHero":
      return <L.ProductHero data={block.data} />;
    case "chapterHero":
      return <L.ChapterHero data={block.data} />;
    case "productDetail":
      return <L.ProductDetailPage variant={block.data} />;
    case "closing":
      return <L.ClosingPage data={block.data} pdfHref={pdfHref} />;
    default: {
      const exhaustiveCheck: never = block;
      return exhaustiveCheck;
    }
  }
}
