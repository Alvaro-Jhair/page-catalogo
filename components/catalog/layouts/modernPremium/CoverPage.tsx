import Image from "next/image";
import PageNumber from "../../PageNumber";
import RevealOnScroll from "../../RevealOnScroll";
import type { CoverData } from "@/data/schema";
import "./modernPremium.css";

type CoverPageProps = {
  data: CoverData;
};

/**
 * Split 50/50 duro: panel de color sólido con el título de un lado,
 * foto del otro, borde recto entre los dos — ni asimétrica (Zara) ni a
 * sangre completa (original).
 */
export default function CoverPage({ data }: CoverPageProps) {
  return (
    <section className="page layout-modern-premium mp-cover" id="cover">
      <RevealOnScroll className="mp-cover-panel">
        <span className="mp-cover-meta">{data.meta.join(" · ")}</span>
        <h1>{data.title}</h1>
        <div className="mp-gold-rule" />
        <p>{data.subtitle}</p>
      </RevealOnScroll>

      <div className="mp-cover-photo">
        <Image src={data.bgImage} alt="" fill priority sizes="50vw" style={{ objectFit: "cover" }} />
      </div>

      <div className="mp-cover-bottom">
        {data.bottomLine1} — {data.bottomLine2}
      </div>

      <PageNumber n={data.pageNumber} dark />
    </section>
  );
}
