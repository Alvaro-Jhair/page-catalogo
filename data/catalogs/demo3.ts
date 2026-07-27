import { CatalogEntrySchema } from "../schema";
import type { CatalogEntry } from "../schema";
import data from "./demo3.json";

export const catalogEntry: CatalogEntry = CatalogEntrySchema.parse(data);
