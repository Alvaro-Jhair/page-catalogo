import type { CSSProperties } from "react";
import ScrollProgress from "./ScrollProgress";
import BlockRenderer from "./BlockRenderer";
import type { CatalogBlocks, CatalogTheme } from "@/data/schema";

type CatalogRendererProps = {
  blocks: CatalogBlocks;
  /** Identidad visual del catálogo (colores + tipografías). Se aplica
   * como CSS custom properties inline, así que solo pisa el `:root` de
   * app/globals.css para este árbol — nunca a otros catálogos ni al
   * resto del sitio. */
  theme?: CatalogTheme;
  /** Link de descarga del PDF del catálogo (Fase 7), si existe. */
  pdfHref?: string;
};

function themeStyle(theme?: CatalogTheme): CSSProperties | undefined {
  if (!theme) return undefined;
  return {
    "--ink": theme.ink,
    "--paper": theme.paper,
    "--line": theme.line,
    "--muted": theme.muted,
    "--accent": theme.accent,
    "--display-font": theme.displayFont,
    "--body-font": theme.bodyFont,
  } as CSSProperties;
}

/**
 * Dibuja un catálogo completo a partir de su lista de bloques: la barra
 * de progreso más cada bloque en el orden en que aparece en los datos.
 * No sabe ni le importa de qué catálogo se trata — quien llama decide
 * qué `blocks`/`theme` pasarle (ver data/catalogs/index.ts).
 */
export default function CatalogRenderer({ blocks, theme, pdfHref }: CatalogRendererProps) {
  return (
    <main className="catalog-root" style={themeStyle(theme)}>
      <ScrollProgress />
      {blocks.map((block) => (
        <BlockRenderer key={`${block.type}-${block.data.pageNumber}`} block={block} pdfHref={pdfHref} />
      ))}
    </main>
  );
}
