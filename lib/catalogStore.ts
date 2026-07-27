import "server-only";
import { CatalogEntrySchema } from "@/data/schema";
import { commitFile } from "./github";

export type SaveCatalogResult =
  | { ok: true; commitUrl: string }
  | { ok: false; error: string; issues?: string[] };

/** Ruta del archivo de datos de un catálogo dentro del repo. */
export function catalogFilePath(catalogId: string): string {
  return `data/catalogs/${catalogId}.json`;
}

/**
 * Valida `candidateEntry` (tema + bloques) contra el modelo de datos
 * (data/schema.ts) y, solo si es válido, comitea el JSON resultante al
 * repo. Nunca escribe nada si la validación falla — el catálogo
 * publicado nunca puede quedar en un estado que no calce con el schema.
 */
export async function saveCatalog(
  catalogId: string,
  candidateEntry: unknown
): Promise<SaveCatalogResult> {
  const parsed = CatalogEntrySchema.safeParse(candidateEntry);
  if (!parsed.success) {
    return {
      ok: false,
      error: "El contenido no calza con el modelo de datos del catálogo.",
      issues: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    };
  }

  // A partir de acá todo puede fallar por config faltante o por la red:
  // nunca debe propagar como excepción sin capturar hacia la Server
  // Action que llama a esto — el botón "Guardar" del panel espera
  // SIEMPRE un SaveCatalogResult, nunca un throw.
  try {
    const content = Buffer.from(JSON.stringify(parsed.data, null, 2) + "\n", "utf-8").toString(
      "base64"
    );
    const { commitUrl } = await commitFile(
      catalogFilePath(catalogId),
      content,
      `catalog(${catalogId}): actualizar contenido desde el panel de administración`
    );
    return { ok: true, commitUrl };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido al guardar." };
  }
}
