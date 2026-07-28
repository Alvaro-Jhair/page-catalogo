import { CatalogEntrySchema } from "../schema";
import type { CatalogEntry } from "../schema";
import data from "./apple.json";

export const catalogEntry: CatalogEntry = CatalogEntrySchema.parse(data);
