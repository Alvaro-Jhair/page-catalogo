import Image from "next/image";
import PageNumber from "../../PageNumber";
import RevealOnScroll from "../../RevealOnScroll";
import type { ReactNode } from "react";
import "./ikeaGrid.css";

type StatementFrameProps = {
  id?: string;
  bgImage: string;
  tag: string;
  title: string;
  body?: ReactNode;
  pageNumber: number;
  children?: ReactNode;
};

/**
 * Foto + tag amarillo de sección (esquina, como una etiqueta de
 * catálogo) + filete azul — mismo lenguaje de la portada/ficha de
 * producto aplicado a manifiesto/hero/capítulo/cierre.
 */
export default function StatementFrame({ id, bgImage, tag, title, body, pageNumber, children }: StatementFrameProps) {
  return (
    <section className="page layout-ikea-grid ik-statement" id={id}>
      <Image
        src={bgImage}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="page-bg"
        style={{ objectFit: "cover" }}
      />
      <div className="page-overlay" style={{ background: "linear-gradient(180deg,rgba(0,0,0,.3),rgba(0,0,0,.15))" }} />
      <span className="ik-statement-tag">{tag}</span>
      <RevealOnScroll className="ik-statement-inner">
        <div className="ik-statement-rule" />
        <h2>{title}</h2>
        {body}
        {children}
      </RevealOnScroll>
      <PageNumber n={pageNumber} />
    </section>
  );
}
