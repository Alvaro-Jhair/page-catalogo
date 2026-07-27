import Image from "next/image";
import type { CatalogTemplate } from "@/lib/newCatalog";

type TemplateThumbProps = {
  template: CatalogTemplate;
};

/**
 * Miniatura del carrusel de "crear catálogo": capturas reales de la
 * portada y la página de producto de la plantilla (pre-generadas, ver
 * public/admin-previews/ y scripts/generate-template-previews.mjs),
 * no una simulación decorativa — mismo espíritu que la hoja
 * comparativa que se le mostró al admin para elegir entre las 10.
 */
export default function TemplateThumb({ template }: TemplateThumbProps) {
  const { preview } = template;
  return (
    <div className="admin-template-thumb-shots">
      <div className="admin-template-thumb-shot">
        <Image src={preview.coverImage} alt="" fill sizes="160px" style={{ objectFit: "cover" }} />
        <span>Portada</span>
      </div>
      <div className="admin-template-thumb-shot">
        <Image src={preview.detailImage} alt="" fill sizes="160px" style={{ objectFit: "cover" }} />
        <span>Producto</span>
      </div>
    </div>
  );
}
