/**
 * Contrato desacoplado para "traer imágenes desde un servicio en la
 * nube" (Fase E, 2026-07-28) — Google Drive es la primera y única
 * implementación por ahora; Dropbox/OneDrive podrían sumarse después
 * agregando otro módulo que cumpla esta misma interfaz, sin tocar
 * StepImages ni el resto del wizard.
 */
export type CloudPickedFile = {
  name: string;
  /** Contenido en base64 (sin el prefijo "data:...;base64,"), listo para uploadAssetAction — mismo formato que un archivo local. */
  base64: string;
  /** blob: URL local para mostrar la miniatura antes de que la próxima build sirva el archivo real. */
  previewUrl: string;
  /** Id del archivo en el proveedor de origen — se guarda como vínculo (lib/driveLinks.ts) para poder re-sincronizar más tarde (Fase F). */
  sourceFileId: string;
};

export type CloudSource = {
  id: string;
  label: string;
  /** false si falta configuración (credenciales, etc.) — el botón de este source no debería intentar abrir nada en ese caso. */
  isConfigured: () => boolean;
  /** Motivo human-legible de por qué no está configurado, para mostrar en vez de fallar en silencio. */
  unconfiguredReason?: () => string;
  /** Abre el picker nativo del proveedor; una lista vacía significa "canceló sin elegir nada", no un error. */
  pickImages: () => Promise<CloudPickedFile[]>;
  /**
   * Re-descarga un archivo ya conocido por id, sin reabrir el picker
   * completo (Fase F) — opcional porque un proveedor futuro podría no
   * soportar re-sync.
   */
  resyncFile?: (fileId: string) => Promise<{ base64: string; previewUrl: string }>;
};
