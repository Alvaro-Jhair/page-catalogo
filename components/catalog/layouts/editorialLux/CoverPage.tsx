import Image from "next/image";
import PageNumber from "../../PageNumber";
import RevealOnScroll from "../../RevealOnScroll";
import type { CoverData } from "@/data/schema";
import "./editorialLux.css";

type CoverPageProps = {
  data: CoverData;
};

/**
 * Portada tipo tapa de revista: masthead centrado arriba, coverlines a
 * los costados, línea de cierre abajo — composición de "portada de
 * revista", no la portada full-bleed con título abajo del layout
 * original.
 */
export default function CoverPage({ data }: CoverPageProps) {
  return (
    <section className="page layout-editorial-lux ed-cover" id="cover">
      <Image
        src={data.bgImage}
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="page-bg"
        style={{ objectFit: "cover", objectPosition: "center 30%" }}
      />
      <div
        className="page-overlay"
        style={{ background: "linear-gradient(180deg,rgba(10,8,8,.42),rgba(10,8,8,.08) 30%,rgba(10,8,8,.1) 60%,rgba(10,8,8,.5))" }}
      />

      <div className="ed-cover-top">
        <span>{data.meta[0]}</span>
        <span>{data.meta[1]}</span>
      </div>

      <RevealOnScroll className="ed-masthead">
        <h1>{data.title}</h1>
        <div className="ed-masthead-rule" />
        {data.meta[2] && <div className="ed-coverline">{data.meta[2]}</div>}
      </RevealOnScroll>

      <RevealOnScroll className="ed-cover-bottom" delay={150}>
        <p className="ed-cover-subtitle">{data.subtitle}</p>
        <p className="ed-cover-lines">
          {data.bottomLine1}
          <br />
          {data.bottomLine2}
        </p>
      </RevealOnScroll>

      <PageNumber n={data.pageNumber} />
    </section>
  );
}
