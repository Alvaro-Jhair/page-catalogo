// Registro de catálogos disponibles. Renderizar un catálogo es pedirlo
// acá por id, nunca importar el contenido de una colección específica
// directamente en app/ o components/.
//
// Regenerado por lib/catalogStore.ts (createCatalog) cada vez que se
// agrega un catálogo desde el panel — no editar a mano el orden de
// imports, se reescribe completo a partir de la lista de ids.

import { catalogEntry as entry0 } from "./ariel";
import { catalogEntry as entry1 } from "./deme1";
import { catalogEntry as entry2 } from "./demo";
import { catalogEntry as entry3 } from "./demo3";
import type { CatalogEntry } from "../schema";

export const catalogs = {
  "ariel": entry0,
  "deme1": entry1,
  "demo": entry2,
  "demo3": entry3,
} satisfies Record<string, CatalogEntry>;

export type CatalogId = keyof typeof catalogs;
