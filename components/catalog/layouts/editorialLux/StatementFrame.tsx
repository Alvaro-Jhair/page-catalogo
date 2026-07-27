import Image from "next/image";
import PageNumber from "../../PageNumber";
import RevealOnScroll from "../../RevealOnScroll";
import type { ReactNode } from "react";
import "./editorialLux.css";

type StatementFrameProps = {
  id?: string;
  bgImage: string;
  kicker: string;
  title: string;
  body?: ReactNode;
  pageNumber: number;
  children?: ReactNode;
};

/**
 * La "página de declaración" compartida por manifiesto/hero/capítulo/
 * cierre de este layout: mismo lenguaje (kicker en versalitas, título
 * serif grande, filete rojo) para los 4 — así ninguno de los cuatro
 * queda "igual al layout original con otro color", que fue el problema
 * que motivó este rediseño.
 */
export default function StatementFrame({ id, bgImage, kicker, title, body, pageNumber, children }: StatementFrameProps) {
  return (
    <section className="page layout-editorial-lux ed-statement" id={id}>
      <Image
        src={bgImage}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="page-bg"
        style={{ objectFit: "cover", objectPosition: "center 35%" }}
      />
      <div
        className="page-overlay"
        style={{ background: "linear-gradient(180deg,rgba(10,8,8,.2),rgba(10,8,8,.5))" }}
      />
      <RevealOnScroll className="ed-statement-inner">
        <span className="ed-statement-kicker">{kicker}</span>
        <div className="ed-statement-rule" />
        <h2>{title}</h2>
        {body && <div className="ed-statement-body">{body}</div>}
        {children}
      </RevealOnScroll>
      <PageNumber n={pageNumber} />
    </section>
  );
}
