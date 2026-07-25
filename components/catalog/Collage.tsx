import Image from "next/image";
import type { CollageImage, CollageLayout } from "@/data/catalog";

type CollageProps = {
  images: CollageImage[];
  layout: CollageLayout;
};

/** Grilla de imágenes de producto. El número de columnas depende de `layout`. */
export default function Collage({ images, layout }: CollageProps) {
  return (
    <div className={`collage ${layout}`}>
      {images.map((img, i) => (
        <figure key={`${img.src}-${i}`}>
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="(max-width: 850px) 50vw, 25vw"
            style={{ objectFit: "cover", objectPosition: "top center" }}
          />
        </figure>
      ))}
    </div>
  );
}
