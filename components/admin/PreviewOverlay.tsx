"use client";

import { createPortal } from "react-dom";
import { useEffect } from "react";
import CatalogRenderer from "@/components/catalog/CatalogRenderer";
import type { Block, CatalogTheme, LayoutId } from "@/data/schema";

type PreviewOverlayProps = {
  blocks: Block[];
  theme: CatalogTheme;
  layoutId: LayoutId;
  onClose: () => void;
};

/**
 * Renderiza el estado sin guardar del panel con el mismo CatalogRenderer
 * que usa el sitio público — no un componente de vista previa aparte,
 * para que lo que se ve acá sea exactamente lo que se publicaría.
 * Portal a document.body para escapar del <main> del panel (evita un
 * <main> anidado y que el scroll-snap del catálogo compita con el
 * layout del admin). Sin guard de "mounted": este componente solo se
 * monta client-side, después de un clic en "Vista previa" (nunca
 * durante el SSR), así que document.body ya existe en el primer render.
 */
export default function PreviewOverlay({ blocks, theme, layoutId, onClose }: PreviewOverlayProps) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Mismo cálculo que app/admin/actions.ts al guardar: la vista previa
  // tiene que mostrar los números de página reales (según el orden
  // actual), no los que hayan quedado de antes de reordenar/agregar.
  const withPageNumbers = blocks.map((block, i) => ({
    ...block,
    data: { ...block.data, pageNumber: i + 1 },
  })) as Block[];

  return createPortal(
    <div className="admin-preview-overlay">
      <button type="button" className="admin-preview-close" onClick={onClose}>
        ✕ Cerrar vista previa
      </button>
      <CatalogRenderer blocks={withPageNumbers} theme={theme} layoutId={layoutId} />
    </div>,
    document.body
  );
}
