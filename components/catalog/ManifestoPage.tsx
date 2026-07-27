import Image from "next/image";
import PageNumber from "./PageNumber";
import RevealOnScroll from "./RevealOnScroll";
import type { ManifestoData } from "@/data/schema";

type ManifestoPageProps = {
  data: ManifestoData;
};

export default function ManifestoPage({ data }: ManifestoPageProps) {
  return (
    <section className="page manifesto" id="intro">
      <Image
        src={data.bgImage}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="page-bg"
        style={{ objectFit: "cover", objectPosition: "center 34%" }}
      />
      <div
        className="page-overlay"
        style={{ background: "linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,.28))" }}
      />
      <div className="inner">
        <RevealOnScroll>
          <h2>{data.heading}</h2>
        </RevealOnScroll>
        <RevealOnScroll delay={150}>
          <p>{data.paragraph}</p>
        </RevealOnScroll>
      </div>
      <PageNumber n={data.pageNumber} />
    </section>
  );
}
