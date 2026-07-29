import Image from "next/image";
import { COLLAGE_LAYOUT_IMAGE_COUNT, type CollageImage, type CollageLayout } from "@/data/schema";

type CollageProps = {
  images: CollageImage[];
  layout: CollageLayout;
};

/**
 * Grilla de imágenes de producto. El número de columnas depende de
 * `layout` — recorta a la cantidad de fotos que ese layout espera
 * (fix, 2026-07-29): cargar más de la cuenta no se ve mal en desktop
 * (la grilla de 4 columnas solo agrega una fila), pero en mobile
 * `.collage.four` colapsa a 2 columnas, así que el doble de fotos
 * significa el doble de filas — reventaba la altura de la sección en
 * un caso real (Ariel, colorways con 8 fotos en un layout de 4).
 */
export default function Collage({ images, layout }: CollageProps) {
  const expectedCount = COLLAGE_LAYOUT_IMAGE_COUNT[layout];
  const shown = images.slice(0, expectedCount);
  return (
    <div className={`collage ${layout}`}>
      {shown.map((img, i) => (
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
