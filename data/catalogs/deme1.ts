import { CatalogEntrySchema } from "../schema";
import type { CatalogEntry } from "../schema";
import data from "./deme1.json";

export const catalogEntry: CatalogEntry = CatalogEntrySchema.parse(data);
