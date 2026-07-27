import Image from "next/image";
import PageNumber from "./PageNumber";
import RevealOnScroll from "./RevealOnScroll";
import type { ProductHeroData } from "@/data/schema";

type ProductHeroProps = {
  data: ProductHeroData;
};

export default function ProductHero({ data }: ProductHeroProps) {
  return (
    <section className="page product-hero" id={data.id}>
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
        style={{ background: "linear-gradient(90deg,rgba(0,0,0,.35),rgba(0,0,0,.05) 55%)" }}
      />
      <div className="product-name">
        <RevealOnScroll>
          <h2>{data.name}</h2>
          <span>{data.type}</span>
        </RevealOnScroll>
      </div>
      <PageNumber n={data.pageNumber} />
    </section>
  );
}
