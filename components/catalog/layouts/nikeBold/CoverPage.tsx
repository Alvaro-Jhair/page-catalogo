import Image from "next/image";
import PageNumber from "../../PageNumber";
import RevealOnScroll from "../../RevealOnScroll";
import type { CoverData } from "@/data/schema";
import "./nikeBold.css";

type CoverPageProps = {
  data: CoverData;
};

/**
 * Foto a pantalla completa + tipografía enorme, en diagonal, con un
 * bloque de color detrás (como un marcador de resaltar) — composición
 * dinámica y de alto contraste, nada de título centrado abajo.
 */
export default function CoverPage({ data }: CoverPageProps) {
  return (
    <section className="page layout-nike-bold nk-cover" id="cover">
      <Image
        src={data.bgImage}
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="page-bg"
        style={{ objectFit: "cover" }}
      />
      <div className="page-overlay" style={{ background: "linear-gradient(0deg,rgba(0,0,0,.55),rgba(0,0,0,.05) 55%)" }} />

      <div className="nk-cover-meta">
        {data.meta.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>

      <RevealOnScroll className="nk-cover-title">
        <h1>
          <span>{data.title}</span>
        </h1>
      </RevealOnScroll>

      <RevealOnScroll className="nk-cover-bottom" delay={150}>
        <p className="nk-cover-tagline">{data.subtitle}</p>
        <p className="nk-cover-lines">
          {data.bottomLine1} — {data.bottomLine2}
        </p>
      </RevealOnScroll>

      <PageNumber n={data.pageNumber} />
    </section>
  );
}
