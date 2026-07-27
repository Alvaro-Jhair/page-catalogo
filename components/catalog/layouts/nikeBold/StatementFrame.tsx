import Image from "next/image";
import PageNumber from "../../PageNumber";
import RevealOnScroll from "../../RevealOnScroll";
import type { ReactNode } from "react";
import "./nikeBold.css";

type StatementFrameProps = {
  id?: string;
  bgImage: string;
  kicker: string;
  title: string;
  body?: ReactNode;
  pageNumber: number;
  children?: ReactNode;
};

/** Numeral gigante + bloque de color + título bold — mismo lenguaje de alto contraste de la portada/ficha aplicado a las 4 páginas de transición. */
export default function StatementFrame({ id, bgImage, kicker, title, body, pageNumber, children }: StatementFrameProps) {
  return (
    <section className="page layout-nike-bold nk-statement" id={id}>
      <Image
        src={bgImage}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="page-bg"
        style={{ objectFit: "cover" }}
      />
      <div className="page-overlay" style={{ background: "linear-gradient(0deg,rgba(0,0,0,.6),rgba(0,0,0,.05) 60%)" }} />
      <span className="nk-statement-number">{String(pageNumber).padStart(2, "0")}</span>
      <RevealOnScroll className="nk-statement-inner">
        <span className="nk-statement-kicker">{kicker}</span>
        <h2>{title}</h2>
        {body}
        {children}
      </RevealOnScroll>
      <PageNumber n={pageNumber} />
    </section>
  );
}
