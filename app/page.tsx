import CatalogRenderer from "@/components/catalog/CatalogRenderer";
import { catalogs } from "@/data/catalogs";

/**
 * Punto de entrada de la web: pide el catálogo "ariel" al registro
 * (data/catalogs/index.ts) y lo renderiza con CatalogRenderer. No sabe
 * nada de secciones, bloques ni contenido — esa lógica vive en
 * data/catalogs/, data/schema.ts y components/catalog/.
 */
export default function CatalogPage() {
  return <CatalogRenderer blocks={catalogs.ariel} pdfHref="/catalog-ariel.pdf" />;
}
