import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { commitFile } from "./github";

const DRIVE_LINKS_PATH = "data/driveLinks.json";

/**
 * Vínculo imagen↔archivo-de-Drive (Fase F, 2026-07-28) — se guarda acá,
 * no en data/schema.ts, porque no es contenido de catálogo, es metadata
 * operativa del asset (mismo espíritu que lib/assets.ts). `provider` es
 * un literal en vez de un string libre a propósito: si algún día se suma
 * un segundo CloudSource (Dropbox, etc.), este schema tiene que crecer a
 * mano, no aceptar cualquier id silenciosamente.
 */
export const DriveLinkSchema = z.object({
  path: z.string(),
  provider: z.literal("google-drive"),
  fileId: z.string(),
  fileName: z.string(),
  lastSyncedAt: z.string(),
});
export type DriveLink = z.infer<typeof DriveLinkSchema>;

const DriveLinksSchema = z.array(DriveLinkSchema);

/**
 * Lee data/driveLinks.json del filesystem tal como quedó en el último
 * deploy — mismo patrón que listAssets() en lib/assets.ts. El archivo
 * todavía no existe en el repo (esta es su primera escritura), así que
 * ENOENT es el caso normal hoy, no un error: devuelve lista vacía.
 */
export async function listDriveLinks(): Promise<DriveLink[]> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), DRIVE_LINKS_PATH), "utf-8");
    return DriveLinksSchema.parse(JSON.parse(raw));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export type UpsertDriveLinkResult = { ok: true } | { ok: false; error: string };

/**
 * Reemplaza (por `path`) o agrega un vínculo y comitea la lista
 * completa — mismo validar-antes-de-comitear que saveCatalog
 * (lib/catalogStore.ts): nunca escribe nada si el resultado no calza
 * con el schema.
 */
export async function upsertDriveLink(link: DriveLink): Promise<UpsertDriveLinkResult> {
  try {
    const current = await listDriveLinks();
    const next = [...current.filter((l) => l.path !== link.path), link];
    const parsed = DriveLinksSchema.safeParse(next);
    if (!parsed.success) {
      return { ok: false, error: "Datos de vínculo con Drive inválidos." };
    }

    const content = Buffer.from(JSON.stringify(parsed.data, null, 2) + "\n", "utf-8").toString("base64");
    await commitFile(DRIVE_LINKS_PATH, content, `assets: vincular ${link.path} con Google Drive`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido al guardar el vínculo con Drive." };
  }
}
