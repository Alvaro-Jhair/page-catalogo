import PageNumber from "./PageNumber";
import RevealOnScroll from "./RevealOnScroll";
import type { productHero as ProductHeroData } from "@/data/catalog";

type ProductHeroProps = {
  data: typeof ProductHeroData;
};

export default function ProductHero({ data }: ProductHeroProps) {
  return (
    <section
      className="page product-hero"
      id={data.id}
      style={{
        background: `linear-gradient(90deg,rgba(0,0,0,.35),rgba(0,0,0,.05) 55%), url('${data.bgImage}') center/cover no-repeat`,
      }}
    >
      <RevealOnScroll className="product-name">
        <h2>{data.name}</h2>
        <span>{data.type}</span>
      </RevealOnScroll>
      <PageNumber n={data.pageNumber} />
    </section>
  );
}
