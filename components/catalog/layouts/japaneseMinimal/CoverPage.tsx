import Image from "next/image";
import PageNumber from "../../PageNumber";
import RevealOnScroll from "../../RevealOnScroll";
import type { CoverData } from "@/data/schema";
import "./japaneseMinimal.css";

type CoverPageProps = {
  data: CoverData;
};

/**
 * Silenciosa: foto chica y descentrada (no a sangre, no centrada),
 * título mínimo, un sello rojo como único acento de color — opuesta a
 * cualquier portada "grande y llamativa" del resto de las plantillas.
 */
export default function CoverPage({ data }: CoverPageProps) {
  return (
    <section className="page layout-japanese-minimal jp-cover" id="cover">
      <span className="jp-mark" aria-hidden="true" />

      <div className="jp-cover-image">
        <Image src={data.bgImage} alt="" fill priority sizes="42vw" style={{ objectFit: "cover" }} />
      </div>

      <RevealOnScroll className="jp-cover-text">
        <h1>{data.title}</h1>
        <p>{data.subtitle}</p>
      </RevealOnScroll>

      <span className="jp-cover-meta">{data.meta.join(" · ")}</span>

      <PageNumber n={data.pageNumber} dark />
    </section>
  );
}
