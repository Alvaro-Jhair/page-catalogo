import Image from "next/image";
import PageNumber from "./PageNumber";
import RevealOnScroll from "./RevealOnScroll";
import type { ClosingData } from "@/data/schema";

type ClosingPageProps = {
  data: ClosingData;
  /** Ruta al PDF generado en build (Fase 7). No es contenido del catálogo — es un artefacto de deploy, por eso no vive en data/schema.ts. */
  pdfHref?: string;
};

export default function ClosingPage({ data, pdfHref }: ClosingPageProps) {
  return (
    <section className="page closing">
      <Image
        src={data.bgImage}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="page-bg"
        style={{ objectFit: "cover", objectPosition: "center" }}
      />
      <div
        className="page-overlay"
        style={{ background: "linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,.35))" }}
      />
      <RevealOnScroll>
        <h2>{data.title}</h2>
        <p>
          {data.line1}
          <br />
          {data.line2}
        </p>
        {pdfHref && (
          <a href={pdfHref} download className="pdf-download-link">
            Descargar catálogo en PDF
          </a>
        )}
      </RevealOnScroll>
      <PageNumber n={data.pageNumber} />
    </section>
  );
}
