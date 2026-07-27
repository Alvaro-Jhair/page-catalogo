import Image from "next/image";
import PageNumber from "../../PageNumber";
import RevealOnScroll from "../../RevealOnScroll";
import type { CoverData } from "@/data/schema";
import "./appleMinimal.css";

type CoverPageProps = {
  data: CoverData;
};

/**
 * Portada centrada y mínima: fondo blanco, foto chica contenida (no a
 * sangre), muchísimo espacio en blanco alrededor — composición opuesta
 * a la portada full-bleed del layout original.
 */
export default function CoverPage({ data }: CoverPageProps) {
  return (
    <section className="page layout-apple-minimal am-cover" id="cover">
      <span className="am-cover-meta">{data.meta.join(" — ")}</span>

      <RevealOnScroll className="am-cover-image">
        <Image
          src={data.bgImage}
          alt=""
          fill
          priority
          sizes="(max-width: 850px) 86vw, 46vw"
          style={{ objectFit: "cover" }}
        />
      </RevealOnScroll>

      <RevealOnScroll className="am-cover-text" delay={150}>
        <h1>{data.title}</h1>
        <p>{data.subtitle}</p>
      </RevealOnScroll>

      <PageNumber n={data.pageNumber} dark />
    </section>
  );
}
