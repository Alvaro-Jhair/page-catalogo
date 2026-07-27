import Image from "next/image";
import type { CatalogTemplate } from "@/lib/newCatalog";

type TemplateThumbProps = {
  template: CatalogTemplate;
};

/**
 * Miniatura decorativa para el carrusel de "crear catálogo" — no
 * reusa CoverPage escalado (pelearía contra .page{min-height:100svh},
 * PageNumber absoluto y RevealOnScroll dentro de un cuadro minúsculo,
 * todo para algo puramente decorativo). Es un selector, como un swatch
 * de color, no una segunda implementación del renderizado real del
 * catálogo — CatalogRenderer sigue siendo el único que dibuja páginas
 * de verdad (ver PreviewOverlay).
 */
export default function TemplateThumb({ template }: TemplateThumbProps) {
  const { theme, preview } = template;
  return (
    <div className="admin-template-thumb-photo">
      <Image src={preview.image} alt="" fill sizes="170px" style={{ objectFit: "cover" }} />
      <div
        className="admin-template-thumb-overlay"
        style={{ background: `linear-gradient(180deg, transparent 35%, ${theme.ink}e6 100%)` }}
      />
      <div className="admin-template-thumb-title" style={{ fontFamily: theme.displayFont }}>
        {preview.title}
      </div>
      <div className="admin-template-thumb-tag" style={{ fontFamily: theme.bodyFont, color: theme.accent }}>
        {preview.tag}
      </div>
    </div>
  );
}
