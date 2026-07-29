/**
 * Compresión client-side antes de subir (fix, 2026-07-29) — feedback
 * real: el commit a GitHub tarda con fotos de Drive sin optimizar
 * (originales de cámara/celular, varios MB a mayor resolución de la
 * que este sitio necesita). Redimensiona/recomprime en el navegador
 * antes de mandar los bytes, así viaja menos y GitHub procesa menos —
 * en vez de "arreglar" la latencia de red/GitHub, se ataca la causa
 * real (el tamaño del archivo).
 *
 * No toca el formato: un PNG sigue siendo PNG (sin pérdida, solo se
 * redimensiona si hace falta — preserva transparencia), un JPEG/WebP
 * se recomprime con calidad reducida además de redimensionar. GIF se
 * salta por completo — dibujarlo en un canvas aplanaría la animación a
 * un solo cuadro.
 */

const MAX_DIMENSION = 2400;
const JPEG_QUALITY = 0.85;
const SKIP_COMPRESSION_TYPES = new Set(["image/gif"]);
const COMPRESSION_THRESHOLD_BYTES = 1.5 * 1024 * 1024; // fotos ya chicas no valen la pena tocar

function asFile(blob: Blob, filename: string): File {
  return blob instanceof File ? blob : new File([blob], filename, { type: blob.type });
}

export async function compressImage(input: Blob, filename: string): Promise<File> {
  if (SKIP_COMPRESSION_TYPES.has(input.type) || input.size < COMPRESSION_THRESHOLD_BYTES) {
    return asFile(input, filename);
  }

  try {
    const bitmap = await createImageBitmap(input);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return asFile(input, filename);

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const outputType = input.type || "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, JPEG_QUALITY));

    // Si por lo que sea no mejoró (raro, pero posible con un PNG que ya
    // estaba chico en dimensiones), quedarse con el original en vez de
    // subir algo más pesado que lo que había.
    if (!blob || blob.size >= input.size) return asFile(input, filename);

    return new File([blob], filename, { type: outputType });
  } catch {
    // Si algo falla al decodificar/comprimir, seguir con el original
    // en vez de bloquear la subida por esto.
    return asFile(input, filename);
  }
}
