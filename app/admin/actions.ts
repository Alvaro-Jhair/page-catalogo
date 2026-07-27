"use server";

import { requireSession } from "@/lib/session";
import { saveCatalog, createCatalog, type SaveCatalogResult, type CreateCatalogResult } from "@/lib/catalogStore";
import { uploadAsset, type UploadAssetResult } from "@/lib/assets";
import type { Block, CatalogTheme } from "@/data/schema";

/**
 * Segunda verificación de sesión acá adentro (además del proxy) —
 * ninguna mutación real debe depender únicamente del redirect del
 * proxy para estar protegida.
 */
export async function saveCatalogAction(
  catalogId: string,
  theme: CatalogTheme,
  blocks: Block[]
): Promise<SaveCatalogResult> {
  await requireSession();

  // pageNumber se deriva de la posición en el arreglo, nunca se edita a
  // mano: evita huecos o duplicados si el admin reordenó o agregó
  // bloques antes de guardar.
  const withPageNumbers = blocks.map((block, i) => ({
    ...block,
    data: { ...block.data, pageNumber: i + 1 },
  })) as Block[];

  return saveCatalog(catalogId, { theme, blocks: withPageNumbers });
}

export async function createCatalogAction(name: string): Promise<CreateCatalogResult> {
  await requireSession();
  return createCatalog(name);
}

export async function uploadAssetAction(
  filename: string,
  base64Content: string
): Promise<UploadAssetResult> {
  await requireSession();
  return uploadAsset(filename, base64Content);
}
