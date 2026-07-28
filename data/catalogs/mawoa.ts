import { CatalogEntrySchema } from "../schema";
import type { CatalogEntry } from "../schema";
import data from "./mawoa.json";

export const catalogEntry: CatalogEntry = CatalogEntrySchema.parse(data);
