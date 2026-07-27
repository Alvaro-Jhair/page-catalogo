import Image from "next/image";
import PageNumber from "../../PageNumber";
import RevealOnScroll from "../../RevealOnScroll";
import type { ReactNode } from "react";
import "./japaneseMinimal.css";

type StatementFrameProps = {
  id?: string;
  bgImage: string;
  title: string;
  body?: ReactNode;
  pageNumber: number;
  children?: ReactNode;
};

/** Misma quietud: imagen chica descentrada, texto mínimo, un sello rojo — nunca a pantalla completa. */
export default function StatementFrame({ id, bgImage, title, body, pageNumber, children }: StatementFrameProps) {
  return (
    <section className="page layout-japanese-minimal jp-statement" id={id}>
      <div className="jp-statement-image">
        <Image src={bgImage} alt="" aria-hidden="true" fill sizes="50vw" style={{ objectFit: "cover" }} />
      </div>
      <span className="jp-mark" aria-hidden="true" />
      <RevealOnScroll className="jp-statement-inner">
        <h2>{title}</h2>
        {body}
        {children}
      </RevealOnScroll>
      <PageNumber n={pageNumber} dark />
    </section>
  );
}
