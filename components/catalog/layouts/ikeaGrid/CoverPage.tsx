import Image from "next/image";
import PageNumber from "../../PageNumber";
import RevealOnScroll from "../../RevealOnScroll";
import type { CoverData } from "@/data/schema";
import "./ikeaGrid.css";

type CoverPageProps = {
  data: CoverData;
};

/**
 * Portada en grilla de bloques: una foto grande + bloques de color
 * sólido (amarillo/azul/oscuro) con el título/meta, como la tapa de un
 * catálogo de mueblería — no una foto a sangre con título abajo.
 */
export default function CoverPage({ data }: CoverPageProps) {
  return (
    <section className="page layout-ikea-grid ik-cover" id="cover">
      <div className="ik-cover-grid">
        <div className="ik-cell ik-cell-photo">
          <Image src={data.bgImage} alt="" fill priority sizes="60vw" style={{ objectFit: "cover" }} />
        </div>
        <RevealOnScroll className="ik-cell ik-cell-yellow">
          <span className="ik-issue">{data.meta[0]}</span>
          <h1>{data.title}</h1>
        </RevealOnScroll>
        <div className="ik-cell ik-cell-blue">
          <span>{data.subtitle}</span>
        </div>
        <div className="ik-cell ik-cell-dark">
          <span>{data.meta[1]}</span>
          <span>{data.meta[2]}</span>
        </div>
      </div>
      <div className="ik-cover-bottom">
        {data.bottomLine1} — {data.bottomLine2}
      </div>
      <PageNumber n={data.pageNumber} dark />
    </section>
  );
}
