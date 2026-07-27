// Contenido de la colección Ariel — una instancia del modelo de datos
// definido en data/schema.ts. El contenido real vive en ariel.json (no
// acá) para que el panel de administración (Fase 5) pueda leerlo y
// reescribirlo como datos estructurados, sin tener que parsear/generar
// TypeScript. Este archivo solo carga y valida ese JSON.
//
// data/schema.ts no tiene idea de que existe "Ariel", "Angel de Canela"
// o precios en soles, y podría convivir con data/catalogs/otra-coleccion.json
// el día que haya más de un catálogo.

import { CatalogBlocksSchema } from "../schema";
import type { Block } from "../schema";
import arielData from "./ariel.json";

/**
 * Se valida contra CatalogBlocksSchema al cargar el módulo: si el
 * contenido no calza con el modelo de datos (data/schema.ts), esto
 * revienta ruidosamente en build/dev en vez de romper el catálogo en
 * silencio en producción.
 */
export const catalogBlocks: Block[] = CatalogBlocksSchema.parse(arielData);
