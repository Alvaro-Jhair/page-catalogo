// Registro de catálogos disponibles. Renderizar un catálogo es pedirlo
// acá por id, nunca importar el contenido de una colección específica
// directamente en app/ o components/.

import { catalogBlocks as arielBlocks } from "./ariel";
import type { CatalogBlocks } from "../schema";

export const catalogs = {
  ariel: arielBlocks,
} satisfies Record<string, CatalogBlocks>;

export type CatalogId = keyof typeof catalogs;
