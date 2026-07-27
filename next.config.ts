import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      // El default (1MB) queda corto para subir fotos por el panel de
      // administración (Fase 8): el contenido viaja en base64, que
      // infla ~33% el tamaño del archivo original.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
