import Image from "next/image";
import PageNumber from "../../PageNumber";
import RevealOnScroll from "../../RevealOnScroll";
import type { CoverData } from "@/data/schema";
import "./architectureGrid.css";

type CoverPageProps = {
  data: CoverData;
};

/**
 * Grilla estructural visible (líneas finas de fondo, como un plano),
 * foto y título en celdas propias, coordenadas tipo dibujo técnico en
 * la esquina — nada de foto a sangre con overlay de texto encima.
 */
export default function CoverPage({ data }: CoverPageProps) {
  return (
    <section className="page layout-architecture-grid ag-cover" id="cover">
      <div className="ag-grid-lines" aria-hidden="true" />

      <div className="ag-cover-photo">
        <Image src={data.bgImage} alt="" fill priority sizes="70vw" style={{ objectFit: "cover" }} />
      </div>

      <RevealOnScroll className="ag-cover-title">
        <span className="ag-coord">{data.meta[0]}</span>
        <h1>{data.title}</h1>
        <p>{data.subtitle}</p>
      </RevealOnScroll>

      <span className="ag-coord ag-coord-corner">
        {data.meta[1]} — {data.meta[2]}
      </span>

      <PageNumber n={data.pageNumber} dark />
    </section>
  );
}
