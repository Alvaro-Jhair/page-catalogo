import CoverPage from "@/components/catalog/CoverPage";
import ManifestoPage from "@/components/catalog/ManifestoPage";
import ProductHero from "@/components/catalog/ProductHero";
import ChapterHero from "@/components/catalog/ChapterHero";
import ProductDetailPage from "@/components/catalog/ProductDetailPage";
import ClosingPage from "@/components/catalog/ClosingPage";
import {
  cover,
  manifesto,
  productHero,
  productVariants,
  chapterHeroes,
  closing,
} from "@/data/catalog";

/**
 * Página del catálogo Ariel. El orden de las secciones es:
 * portada -> manifiesto -> hero de producto -> [detalle + capítulo] x colorway -> cierre.
 * Todo el contenido (textos, precios, imágenes) viene de data/catalog.ts.
 */
export default function CatalogPage() {
  const [ivory, emerald, noir, gold] = productVariants;
  const [greenChapter, blackChapter, goldChapter] = chapterHeroes;

  return (
    <main>
      <CoverPage data={cover} />
      <ManifestoPage data={manifesto} />
      <ProductHero data={productHero} />

      <ProductDetailPage variant={ivory} />

      <ChapterHero data={greenChapter} />
      <ProductDetailPage variant={emerald} />

      <ChapterHero data={blackChapter} />
      <ProductDetailPage variant={noir} />

      <ChapterHero data={goldChapter} />
      <ProductDetailPage variant={gold} />

      <ClosingPage data={closing} />
    </main>
  );
}
