// Registro de catálogos disponibles. Renderizar un catálogo es pedirlo
// acá por id, nunca importar el contenido de una colección específica
// directamente en app/ o components/.

import { catalogEntry as arielEntry } from "./ariel";
import type { CatalogEntry } from "../schema";

export const catalogs = {
  ariel: arielEntry,
} satisfies Record<string, CatalogEntry>;

export type CatalogId = keyof typeof catalogs;
