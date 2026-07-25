import PageNumber from "./PageNumber";
import RevealOnScroll from "./RevealOnScroll";
import type { ChapterHero as ChapterHeroData } from "@/data/catalog";

type ChapterHeroProps = {
  data: ChapterHeroData;
};

/** Página de transición a pantalla completa entre colorways del mismo producto. */
export default function ChapterHero({ data }: ChapterHeroProps) {
  return (
    <section
      className="page chapter"
      id={data.id}
      style={{
        background: `url('${data.bgImage}') center/cover no-repeat`,
      }}
    >
      <div className="shade" />
      <RevealOnScroll className="product-name">
        <h2>{data.name}</h2>
        <span>{data.label}</span>
      </RevealOnScroll>
      <PageNumber n={data.pageNumber} />
    </section>
  );
}
