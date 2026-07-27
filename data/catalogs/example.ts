import { CatalogEntrySchema } from "../schema";
import type { CatalogEntry } from "../schema";
import data from "./example.json";

export const catalogEntry: CatalogEntry = CatalogEntrySchema.parse(data);
