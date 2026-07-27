import Image from "next/image";
import PageNumber from "../../PageNumber";
import RevealOnScroll from "../../RevealOnScroll";
import type { ReactNode } from "react";
import "./zaraEditorial.css";

type StatementFrameProps = {
  id?: string;
  bgImage: string;
  eyebrow: string;
  title: string;
  body?: ReactNode;
  pageNumber: number;
  children?: ReactNode;
};

/** Casi sin decoración: solo tracking amplio y una línea fina — restraint como lenguaje. */
export default function StatementFrame({ id, bgImage, eyebrow, title, body, pageNumber, children }: StatementFrameProps) {
  return (
    <section className="page layout-zara-editorial za-statement" id={id}>
      <Image
        src={bgImage}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="page-bg"
        style={{ objectFit: "cover" }}
      />
      <div className="page-overlay" style={{ background: "linear-gradient(90deg,rgba(0,0,0,.42),rgba(0,0,0,.04) 55%)" }} />
      <RevealOnScroll className="za-statement-inner">
        <span className="za-statement-eyebrow">{eyebrow}</span>
        <div className="za-statement-rule" />
        <h2>{title}</h2>
        {body}
        {children}
      </RevealOnScroll>
      <PageNumber n={pageNumber} />
    </section>
  );
}
