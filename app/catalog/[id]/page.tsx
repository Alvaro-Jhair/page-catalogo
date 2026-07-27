import { notFound } from "next/navigation";
import CatalogRenderer from "@/components/catalog/CatalogRenderer";
import { catalogs, type CatalogId } from "@/data/catalogs";

type CatalogPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Un catálogo específico, con link directo compartible (ej.
 * /catalog/ariel) — separado del índice en `/` para que mandar el link
 * de un catálogo puntual no dependa de que exista uno solo.
 */
export default async function CatalogPage({ params }: CatalogPageProps) {
  const { id } = await params;

  if (!(id in catalogs)) {
    notFound();
  }

  const entry = catalogs[id as CatalogId];

  return (
    <CatalogRenderer
      blocks={entry.blocks}
      theme={entry.theme}
      layoutId={entry.layoutId}
      pdfHref={`/catalog-${id}.pdf`}
    />
  );
}

export function generateStaticParams() {
  return Object.keys(catalogs).map((id) => ({ id }));
}
