import Image from "next/image";
import PageNumber from "../../PageNumber";
import RevealOnScroll from "../../RevealOnScroll";
import type { ReactNode } from "react";
import "./streetwearDark.css";

type StatementFrameProps = {
  id?: string;
  bgImage: string;
  tag: string;
  title: string;
  body?: ReactNode;
  pageNumber: number;
  children?: ReactNode;
};

/** Mismo lenguaje de sticker rotado + mono que la portada/ficha, aplicado a las 4 páginas de transición. */
export default function StatementFrame({ id, bgImage, tag, title, body, pageNumber, children }: StatementFrameProps) {
  return (
    <section className="page layout-streetwear-dark sw-statement" id={id}>
      <Image
        src={bgImage}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="page-bg"
        style={{ objectFit: "cover", filter: "grayscale(0.3) contrast(1.1)" }}
      />
      <div className="page-overlay" style={{ background: "rgba(5,5,5,.62)" }} />
      <span className="sw-sticker">{tag}</span>
      <RevealOnScroll className="sw-statement-inner">
        <h2>{title}</h2>
        {body}
        {children}
      </RevealOnScroll>
      <PageNumber n={pageNumber} />
    </section>
  );
}
