"use server";

import { requireSession } from "@/lib/session";
import {
  saveCatalog,
  createCatalog,
  deleteCatalog,
  type SaveCatalogResult,
  type CreateCatalogResult,
  type DeleteCatalogResult,
} from "@/lib/catalogStore";
import { uploadAsset, type UploadAssetResult } from "@/lib/assets";
import type { Block, CatalogTheme, LayoutId } from "@/data/schema";

/**
 * Segunda verificación de sesión acá adentro (además del proxy) —
 * ninguna mutación real debe depender únicamente del redirect del
 * proxy para estar protegida.
 */
export async function saveCatalogAction(
  catalogId: string,
  theme: CatalogTheme,
  blocks: Block[],
  layoutId: LayoutId
): Promise<SaveCatalogResult> {
  await requireSession();

  // pageNumber se deriva de la posición en el arreglo, nunca se edita a
  // mano: evita huecos o duplicados si el admin reordenó o agregó
  // bloques antes de guardar.
  const withPageNumbers = blocks.map((block, i) => ({
    ...block,
    data: { ...block.data, pageNumber: i + 1 },
  })) as Block[];

  // layoutId no se edita desde el admin (se fija al crear el catálogo,
  // ver lib/newCatalog.ts) — acá solo se re-persiste tal cual llegó.
  return saveCatalog(catalogId, { layoutId, theme, blocks: withPageNumbers });
}

export async function createCatalogAction(name: string, templateId?: string): Promise<CreateCatalogResult> {
  await requireSession();
  return createCatalog(name, templateId);
}

export async function deleteCatalogAction(id: string): Promise<DeleteCatalogResult> {
  await requireSession();
  return deleteCatalog(id);
}

export async function uploadAssetAction(
  filename: string,
  base64Content: string
): Promise<UploadAssetResult> {
  await requireSession();
  return uploadAsset(filename, base64Content);
}
