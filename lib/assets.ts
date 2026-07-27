import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { commitFile } from "./github";

const ASSETS_SUBDIR = "imagenes"; // relativo a public/
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

export type Asset = {
  path: string; // ej. "/imagenes/foto.jpg" — listo para usar en un campo del catálogo
  filename: string;
};

/**
 * Lista lo que hay en public/imagenes/ tal como quedó en el último
 * deploy. Una imagen recién subida en esta misma sesión de admin no va
 * a aparecer acá hasta el próximo redeploy — por eso el picker del
 * panel la agrega a mano a su estado en cuanto uploadAsset() confirma
 * el commit, en vez de depender de releer esta lista.
 */
export async function listAssets(): Promise<Asset[]> {
  const dir = path.join(process.cwd(), "public", ASSETS_SUBDIR);
  const files = await fs.readdir(dir);
  return files
    .filter((filename) => ALLOWED_EXTENSIONS.has(extensionOf(filename)))
    .sort()
    .map((filename) => ({ filename, path: `/${ASSETS_SUBDIR}/${filename}` }));
}

function extensionOf(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function sanitizeFilename(originalFilename: string): string {
  const ext = extensionOf(originalFilename);
  const base = originalFilename
    .slice(0, originalFilename.length - ext.length - 1)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base || "imagen"}.${ext}`;
}

export type UploadAssetResult =
  | { ok: true; path: string; commitUrl: string }
  | { ok: false; error: string };

/**
 * Sube una imagen nueva a public/imagenes/ vía commit a GitHub. Nunca
 * pisa un archivo existente: si el nombre saneado ya está en uso, le
 * agrega un sufijo corto en vez de sobreescribir la foto de otra
 * colorway por coincidencia de nombre.
 */
export async function uploadAsset(
  originalFilename: string,
  base64Content: string
): Promise<UploadAssetResult> {
  const ext = extensionOf(originalFilename);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      error: `Formato no soportado: .${ext || "?"}. Usá jpg, png, webp o gif.`,
    };
  }

  let filename = sanitizeFilename(originalFilename);
  try {
    const existing = new Set((await listAssets()).map((a) => a.filename));
    if (existing.has(filename)) {
      const base = filename.slice(0, filename.length - ext.length - 1);
      filename = `${base}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
    }

    const { commitUrl } = await commitFile(
      `public/${ASSETS_SUBDIR}/${filename}`,
      base64Content,
      `assets: agregar ${filename} desde el panel de administración`
    );

    return { ok: true, path: `/${ASSETS_SUBDIR}/${filename}`, commitUrl };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido al subir la imagen." };
  }
}
