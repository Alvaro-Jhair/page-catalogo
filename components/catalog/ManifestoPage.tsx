import PageNumber from "./PageNumber";
import RevealOnScroll from "./RevealOnScroll";
import type { manifesto as ManifestoData } from "@/data/catalog";

type ManifestoPageProps = {
  data: typeof ManifestoData;
};

export default function ManifestoPage({ data }: ManifestoPageProps) {
  return (
    <section
      className="page manifesto"
      id="intro"
      style={{
        background: `linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,.28)), url('${data.bgImage}') center 34%/cover no-repeat`,
      }}
    >
      <RevealOnScroll className="inner">
        <h2>{data.heading}</h2>
        <p>{data.paragraph}</p>
      </RevealOnScroll>
      <PageNumber n={data.pageNumber} />
    </section>
  );
}
