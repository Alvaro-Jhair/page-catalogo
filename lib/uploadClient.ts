import type { UploadAssetResult } from "./assets";
import { compressImage } from "./imageCompression";

/**
 * Sube un archivo real (File o Blob) vía el Route Handler de subida
 * (app/api/admin/upload/route.ts) — no un Server Action (fix,
 * 2026-07-28: ver la nota en ese archivo). Un solo punto de llamada
 * compartido entre ImagePicker y StepImages, en vez de repetir el
 * armado de FormData en cada uno. Comprime antes de subir (fix,
 * 2026-07-29) — el commit a GitHub tarda menos si viajan menos bytes,
 * en vez de esperar a que la red/GitHub procesen el archivo original
 * completo.
 */
export async function uploadFile(file: File): Promise<UploadAssetResult> {
  const compressed = await compressImage(file, file.name);
  const formData = new FormData();
  formData.append("file", compressed);
  const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
  return res.json();
}

/** Igual, pero reemplaza el contenido de un asset ya existente en `path` (re-sync de Drive, Fase F). */
export async function replaceFile(path: string, blob: Blob, filename: string): Promise<UploadAssetResult> {
  const compressed = await compressImage(blob, filename);
  const formData = new FormData();
  formData.append("file", compressed);
  formData.append("mode", "replace");
  formData.append("path", path);
  const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
  return res.json();
}
