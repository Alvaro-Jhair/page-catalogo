import Image from "next/image";
import PageNumber from "../../PageNumber";
import RevealOnScroll from "../../RevealOnScroll";
import type { ReactNode } from "react";
import "./modernPremium.css";

type StatementFrameProps = {
  id?: string;
  bgImage: string;
  eyebrow: string;
  title: string;
  body?: ReactNode;
  pageNumber: number;
  children?: ReactNode;
};

/** Marco con filete dorado, igual que la portada/ficha, aplicado a las 4 páginas de transición. */
export default function StatementFrame({ id, bgImage, eyebrow, title, body, pageNumber, children }: StatementFrameProps) {
  return (
    <section className="page layout-modern-premium mp-statement" id={id}>
      <Image
        src={bgImage}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="page-bg"
        style={{ objectFit: "cover" }}
      />
      <div className="page-overlay" style={{ background: "linear-gradient(180deg,rgba(20,20,20,.25),rgba(20,20,20,.55))" }} />
      <RevealOnScroll className="mp-statement-inner">
        <span className="mp-eyebrow">{eyebrow}</span>
        <div className="mp-gold-rule" />
        <h2>{title}</h2>
        {body}
        {children}
      </RevealOnScroll>
      <PageNumber n={pageNumber} />
    </section>
  );
}
