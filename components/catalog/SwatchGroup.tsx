import Image from "next/image";
import type { SwatchItem } from "@/data/catalog";

type SwatchGroupProps = {
  swatches: SwatchItem[];
};

export default function SwatchGroup({ swatches }: SwatchGroupProps) {
  return (
    <div className="swatches">
      {swatches.map((swatch) => (
        <div className="swatch" key={swatch.label}>
          <Image src={swatch.image} alt={swatch.label} fill sizes="64px" />
          <div className="swatch-label">{swatch.label}</div>
        </div>
      ))}
    </div>
  );
}
