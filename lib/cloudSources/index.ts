import { googleDriveSource } from "./googleDrive";
import type { CloudSource } from "./types";

export const CLOUD_SOURCES: CloudSource[] = [googleDriveSource];
export type { CloudSource, CloudPickedFile } from "./types";
