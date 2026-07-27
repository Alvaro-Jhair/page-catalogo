import Image from "next/image";
import PageNumber from "./PageNumber";
import RevealOnScroll from "./RevealOnScroll";
import type { ChapterHero as ChapterHeroData } from "@/data/schema";

type ChapterHeroProps = {
  data: ChapterHeroData;
};

/** Página de transición a pantalla completa entre colorways del mismo producto. */
export default function ChapterHero({ data }: ChapterHeroProps) {
  return (
    <section className="page chapter" id={data.id}>
      <Image
        src={data.bgImage}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="page-bg"
        style={{ objectFit: "cover", objectPosition: "center" }}
      />
      <div
        className="page-overlay"
        style={{ background: "linear-gradient(90deg, rgba(0, 0, 0, 0.38), rgba(0, 0, 0, 0.03) 60%)" }}
      />
      <div className="product-name">
        <RevealOnScroll>
          <h2>{data.name}</h2>
          <span>{data.label}</span>
        </RevealOnScroll>
      </div>
      <PageNumber n={data.pageNumber} />
    </section>
  );
}
