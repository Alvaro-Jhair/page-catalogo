import Image from "next/image";
import PageNumber from "../../PageNumber";
import RevealOnScroll from "../../RevealOnScroll";
import type { CoverData } from "@/data/schema";
import "./streetwearDark.css";

type CoverPageProps = {
  data: CoverData;
};

/**
 * Fondo oscuro, título duplicado en capas (una copia "fantasma" detrás,
 * rotada, y una sólida adelante) + un sticker rotado con el meta —
 * composición de flyer/zine, no un título centrado prolijo.
 */
export default function CoverPage({ data }: CoverPageProps) {
  return (
    <section className="page layout-streetwear-dark sw-cover" id="cover">
      <Image
        src={data.bgImage}
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="page-bg"
        style={{ objectFit: "cover", filter: "grayscale(0.3) contrast(1.1)" }}
      />
      <div className="page-overlay" style={{ background: "rgba(5,5,5,.6)" }} />

      <span className="sw-sticker">{data.meta[0]}</span>

      <div className="sw-cover-layers">
        <span className="sw-cover-title-back" aria-hidden="true">
          {data.title}
        </span>
        <RevealOnScroll className="sw-cover-title-front">
          <h1>{data.title}</h1>
        </RevealOnScroll>
      </div>

      <RevealOnScroll className="sw-cover-bottom" delay={150}>
        <p className="sw-cover-tagline">{data.subtitle}</p>
        <p className="sw-cover-meta">
          {data.meta[1]} / {data.meta[2]}
        </p>
      </RevealOnScroll>

      <PageNumber n={data.pageNumber} />
    </section>
  );
}
