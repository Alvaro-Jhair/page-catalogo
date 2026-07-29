/**
 * Contrato desacoplado para "traer imágenes desde un servicio en la
 * nube" (Fase E, 2026-07-28) — Google Drive es la primera y única
 * implementación por ahora; Dropbox/OneDrive podrían sumarse después
 * agregando otro módulo que cumpla esta misma interfaz, sin tocar
 * StepImages ni el resto del wizard.
 */
export type CloudPickedFile = {
  name: string;
  /**
   * El contenido crudo, no base64 — se sube vía el Route Handler
   * (app/api/admin/upload/route.ts) como multipart/form-data, no como
   * argumento de un Server Action (fix, 2026-07-28: un string base64 de
   * varios MB — típico en una foto real de Drive sin optimizar — choca
   * con un límite interno de React mucho antes de llegar al límite de
   * tamaño ya configurado).
   */
  blob: Blob;
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
  resyncFile?: (fileId: string) => Promise<{ blob: Blob; previewUrl: string }>;
};
