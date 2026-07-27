import ScrollProgress from "./ScrollProgress";
import BlockRenderer from "./BlockRenderer";
import type { CatalogBlocks } from "@/data/schema";

type CatalogRendererProps = {
  blocks: CatalogBlocks;
  /** Link de descarga del PDF del catálogo (Fase 7), si existe. */
  pdfHref?: string;
};

/**
 * Dibuja un catálogo completo a partir de su lista de bloques: la barra
 * de progreso más cada bloque en el orden en que aparece en los datos.
 * No sabe ni le importa de qué catálogo se trata — quien llama decide
 * qué `blocks` pasarle (ver data/catalogs/index.ts).
 */
export default function CatalogRenderer({ blocks, pdfHref }: CatalogRendererProps) {
  return (
    <main>
      <ScrollProgress />
      {blocks.map((block) => (
        <BlockRenderer key={`${block.type}-${block.data.pageNumber}`} block={block} pdfHref={pdfHref} />
      ))}
    </main>
  );
}
