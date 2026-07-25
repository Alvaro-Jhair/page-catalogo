import PageNumber from "./PageNumber";
import RevealOnScroll from "./RevealOnScroll";
import type { closing as ClosingData } from "@/data/catalog";

type ClosingPageProps = {
  data: typeof ClosingData;
};

export default function ClosingPage({ data }: ClosingPageProps) {
  return (
    <section
      className="page closing"
      style={{
        background: `linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,.35)), url('${data.bgImage}') center/cover no-repeat`,
      }}
    >
      <RevealOnScroll>
        <h2>{data.title}</h2>
        <p>
          {data.line1}
          <br />
          {data.line2}
        </p>
      </RevealOnScroll>
      <PageNumber n={data.pageNumber} />
    </section>
  );
}
