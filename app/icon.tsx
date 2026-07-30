import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Ícono de pestaña genérico (monograma "CD" de "Catálogo Digital"),
 * generado por código en vez de depender de una imagen de marca
 * específica de un catálogo — el sitio ahora es una plataforma
 * multi-catálogo, no solo Ariel/Angel de Canela.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#151515",
          color: "#f8f6f2",
          fontFamily: "Georgia, serif",
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: "-0.5px",
        }}
      >
        CD
      </div>
    ),
    { ...size }
  );
}
