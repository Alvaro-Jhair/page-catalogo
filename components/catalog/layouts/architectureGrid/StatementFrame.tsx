import Image from "next/image";
import PageNumber from "../../PageNumber";
import RevealOnScroll from "../../RevealOnScroll";
import type { ReactNode } from "react";
import "./architectureGrid.css";

type StatementFrameProps = {
  id?: string;
  bgImage: string;
  coord: string;
  title: string;
  body?: ReactNode;
  pageNumber: number;
  children?: ReactNode;
};

/** Mismas líneas de grilla + coordenadas técnicas de la portada/ficha, aplicadas a las 4 páginas de transición. */
export default function StatementFrame({ id, bgImage, coord, title, body, pageNumber, children }: StatementFrameProps) {
  return (
    <section className="page layout-architecture-grid ag-statement" id={id}>
      <div className="ag-grid-lines" aria-hidden="true" />
      <Image
        src={bgImage}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="page-bg"
        style={{ objectFit: "cover" }}
      />
      <div className="page-overlay" style={{ background: "linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.02))" }} />
      <span className="ag-coord ag-coord-corner">{coord}</span>
      <RevealOnScroll className="ag-statement-inner">
        <div className="ag-rule" />
        <h2>{title}</h2>
        {body}
        {children}
      </RevealOnScroll>
      <PageNumber n={pageNumber} />
    </section>
  );
}
