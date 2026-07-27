import Image from "next/image";
import PageNumber from "../../PageNumber";
import RevealOnScroll from "../../RevealOnScroll";
import type { ReactNode } from "react";
import "./appleMinimal.css";

type StatementFrameProps = {
  id?: string;
  bgImage: string;
  title: string;
  body?: ReactNode;
  pageNumber: number;
  children?: ReactNode;
};

/**
 * Foto a pantalla completa + una línea de texto chica y precisa cerca
 * del tercio inferior — sin kickers, sin filetes, sin marcos. El
 * lenguaje decorativo de esta plantilla es la ausencia de decoración.
 */
export default function StatementFrame({ id, bgImage, title, body, pageNumber, children }: StatementFrameProps) {
  return (
    <section className="page layout-apple-minimal am-statement" id={id}>
      <Image
        src={bgImage}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="page-bg"
        style={{ objectFit: "cover" }}
      />
      <div className="page-overlay am-statement-overlay" />
      <RevealOnScroll className="am-statement-inner">
        <h2>{title}</h2>
        {body}
        {children}
      </RevealOnScroll>
      <PageNumber n={pageNumber} />
    </section>
  );
}
