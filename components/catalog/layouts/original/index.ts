// El layout "original": los mismos 6 componentes que existían antes de que
// hubiera más de un layout, sin ningún cambio. No agregar lógica acá —
// cualquier ajuste a Ariel/Terracota Bold se hace en los componentes
// reales bajo components/catalog/*.tsx, este archivo solo re-exporta.
export { default as CoverPage } from "../../CoverPage";
export { default as ManifestoPage } from "../../ManifestoPage";
export { default as ProductHero } from "../../ProductHero";
export { default as ChapterHero } from "../../ChapterHero";
export { default as ProductDetailPage } from "../../ProductDetailPage";
export { default as ClosingPage } from "../../ClosingPage";
