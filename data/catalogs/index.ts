// Registro de catálogos disponibles. Renderizar un catálogo es pedirlo
// acá por id, nunca importar el contenido de una colección específica
// directamente en app/ o components/.
//
// Regenerado por lib/catalogStore.ts (createCatalog/deleteCatalog) cada
// vez que se agrega o elimina un catálogo desde el panel — no editar a
// mano el orden de imports, se reescribe completo a partir de la lista
// de ids.

import { catalogEntry as entry0 } from "./ariel";
import { catalogEntry as entry1 } from "./example1";
import type { CatalogEntry } from "../schema";

export const catalogs = {
  ariel: entry0,
  example1: entry1,
} satisfies Record<string, CatalogEntry>;

export type CatalogId = keyof typeof catalogs;
