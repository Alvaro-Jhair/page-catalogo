"use client";

import { useRef, useState } from "react";
import { useAssets, type ClientAsset } from "./AssetsContext";
import { uploadAssetAction, replaceAssetAction, recordDriveLinkAction } from "@/app/admin/actions";
import { CLOUD_SOURCES } from "@/lib/cloudSources";
import { useToast } from "./ToastContext";

type ImagePickerProps = {
  /** Si se omite, no dibuja su propio <label> — para cuando ya vive dentro de un grupo con label propio (ej. una fila de CollageImagesEditor). */
  label?: string;
  value: string;
  onChange: (value: string) => void;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1)); // saca el prefijo "data:...;base64,"
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Campo de imagen con tres formas de completarlo: escribir la ruta a
 * mano (se mantiene por flexibilidad), elegir una ya subida de la
 * galería, o subir una nueva ahí mismo. La lista de imágenes es
 * compartida entre todos los ImagePicker del formulario vía
 * AssetsContext — subir una foto en un campo la deja disponible en
 * todos los demás sin recargar nada.
 */
export default function ImagePicker({ label, value, onChange }: ImagePickerProps) {
  const { assets, addAsset } = useAssets();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [justUploaded, setJustUploaded] = useState(false);
  const [syncingPath, setSyncingPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPreview = assets.find((a) => a.path === value)?.previewUrl;

  const handleFileSelected = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    setJustUploaded(false);
    try {
      const base64 = await fileToBase64(file);
      const result = await uploadAssetAction(file.name, base64);
      if (result.ok) {
        addAsset({ path: result.path, filename: result.path.split("/").pop() ?? file.name, previewUrl: URL.createObjectURL(file) });
        onChange(result.path);
        setJustUploaded(true);
        setOpen(false);
      } else {
        setUploadError(result.error);
      }
    } catch {
      setUploadError("No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /**
   * Re-sync manual (Fase F): re-descarga el archivo por el fileId
   * guardado en el vínculo, comitea el reemplazo a la misma ruta, y
   * actualiza el vínculo (lastSyncedAt). El consentimiento OAuth se
   * vuelve a pedir cada vez (mismo diseño que la importación original,
   * ver lib/cloudSources/googleDrive.ts) — no se persiste ningún
   * refresh token.
   */
  const handleResync = async (asset: ClientAsset) => {
    const link = asset.driveLink;
    if (!link) return;
    const source = CLOUD_SOURCES.find((s) => s.id === link.provider);
    if (!source?.resyncFile) return;

    setSyncingPath(asset.path);
    try {
      const { base64, previewUrl } = await source.resyncFile(link.fileId);
      const uploadResult = await replaceAssetAction(asset.path, base64);
      if (!uploadResult.ok) {
        showToast(uploadResult.error, "error");
        return;
      }
      const linkResult = await recordDriveLinkAction(asset.path, link.provider, link.fileId, link.fileName);
      if (!linkResult.ok) {
        showToast(linkResult.error, "error");
        return;
      }
      addAsset({ ...asset, previewUrl, driveLink: { ...link, lastSyncedAt: new Date().toISOString() } });
      showToast(`"${asset.filename}" actualizada desde ${source.label}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo actualizar la imagen desde Drive.", "error");
    } finally {
      setSyncingPath(null);
    }
  };

  return (
    <div className="admin-field admin-image-picker">
      {label && <label>{label}</label>}
      <div className="admin-image-picker-row">
        {value && (
          <div className="admin-image-picker-preview">
            {/* eslint-disable-next-line @next/next/no-img-element -- puede ser un blob: URL local, next/image no lo acepta */}
            <img src={currentPreview ?? value} alt="" />
          </div>
        )}
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="admin-btn" onClick={() => setOpen(true)}>
          Elegir
        </button>
      </div>
      {justUploaded && (
        <p className="admin-image-picker-note">
          Subida y comiteada. Va a verse en el sitio recién después del próximo deploy — hasta entonces la vista previa acá usa una copia local.
        </p>
      )}

      {open && (
        <div className="admin-gallery-overlay" onClick={() => setOpen(false)}>
          <div className="admin-gallery" onClick={(e) => e.stopPropagation()}>
            <div className="admin-gallery-header">
              <p>Elegir imagen</p>
              <button type="button" className="admin-btn admin-btn-icon" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <div className="admin-gallery-grid">
              {assets.map((asset) => (
                <div className="admin-gallery-item-wrap" key={asset.path}>
                  <button
                    type="button"
                    className={`admin-gallery-item${asset.path === value ? " selected" : ""}`}
                    onClick={() => {
                      onChange(asset.path);
                      setOpen(false);
                    }}
                    title={asset.filename}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- puede ser un blob: URL local */}
                    <img src={asset.previewUrl ?? asset.path} alt={asset.filename} />
                  </button>
                  {asset.driveLink && (
                    <>
                      <span className="admin-gallery-item-badge" title={`Importada desde ${asset.driveLink.fileName}`}>
                        Drive
                      </span>
                      <button
                        type="button"
                        className="admin-gallery-item-sync"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResync(asset);
                        }}
                        disabled={syncingPath === asset.path}
                        title="Revisar actualización en Drive"
                        aria-label="Revisar actualización en Drive"
                      >
                        {syncingPath === asset.path ? "…" : "↻"}
                      </button>
                    </>
                  )}
                </div>
              ))}
              {assets.length === 0 && <p>Todavía no hay imágenes.</p>}
            </div>

            <div className="admin-gallery-upload">
              <label className="admin-btn admin-btn-primary">
                {uploading ? "Subiendo…" : "+ Subir imagen nueva"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelected(file);
                  }}
                  disabled={uploading}
                  hidden
                />
              </label>
              {uploadError && <p className="admin-save-message error">{uploadError}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
