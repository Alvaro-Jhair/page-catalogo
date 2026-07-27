import Image from "next/image";
import PageNumber from "../../PageNumber";
import RevealOnScroll from "../../RevealOnScroll";
import type { CoverData } from "@/data/schema";
import "./zaraEditorial.css";

type CoverPageProps = {
  data: CoverData;
};

/**
 * Asimétrica: foto empujada a un lado (60%), título serif grande en el
 * margen vacío del otro lado — no la foto a sangre completa del
 * layout original.
 */
export default function CoverPage({ data }: CoverPageProps) {
  return (
    <section className="page layout-zara-editorial za-cover" id="cover">
      <RevealOnScroll className="za-cover-text">
        <span className="za-cover-meta">{data.meta.join("  /  ")}</span>
        <h1>{data.title}</h1>
        <p>{data.subtitle}</p>
      </RevealOnScroll>

      <div className="za-cover-image">
        <Image src={data.bgImage} alt="" fill priority sizes="60vw" style={{ objectFit: "cover" }} />
      </div>

      <div className="za-cover-bottom">
        {data.bottomLine1} · {data.bottomLine2}
      </div>

      <PageNumber n={data.pageNumber} dark />
    </section>
  );
}
