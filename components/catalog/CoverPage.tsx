import PageNumber from "./PageNumber";
import RevealOnScroll from "./RevealOnScroll";
import type { cover as CoverData } from "@/data/catalog";

type CoverPageProps = {
  data: typeof CoverData;
};

export default function CoverPage({ data }: CoverPageProps) {
  return (
    <section
      className="page cover"
      id="cover"
      style={{
        background: `linear-gradient(180deg,rgba(8,8,8,.15),rgba(8,8,8,.22)), url('${data.bgImage}') center 40%/cover no-repeat`,
      }}
    >
      <RevealOnScroll className="visible cover-title">
        <h1>{data.title}</h1>
        <div className="cover-meta">
          {data.meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="cover-sub">{data.subtitle}</div>
      </RevealOnScroll>
      <RevealOnScroll className="visible cover-bottom">
        {data.bottomLine1}
        <br />
        {data.bottomLine2}
      </RevealOnScroll>
      <PageNumber n={data.pageNumber} />
    </section>
  );
}
