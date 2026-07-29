import type { UploadAssetResult } from "./assets";

/**
 * Sube un archivo real (File o Blob) vía el Route Handler de subida
 * (app/api/admin/upload/route.ts) — no un Server Action (fix,
 * 2026-07-28: ver la nota en ese archivo). Un solo punto de llamada
 * compartido entre ImagePicker y StepImages, en vez de repetir el
 * armado de FormData en cada uno.
 */
export async function uploadFile(file: File): Promise<UploadAssetResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
  return res.json();
}

/** Igual, pero reemplaza el contenido de un asset ya existente en `path` (re-sync de Drive, Fase F). */
export async function replaceFile(path: string, blob: Blob, filename: string): Promise<UploadAssetResult> {
  const formData = new FormData();
  formData.append("file", blob instanceof File ? blob : new File([blob], filename));
  formData.append("mode", "replace");
  formData.append("path", path);
  const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
  return res.json();
}
