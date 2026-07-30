"use client";

import { useState } from "react";
import { useAssets } from "./AssetsContext";
import AssetGallery from "./AssetGallery";

type ImagePickerProps = {
  /** Si se omite, no dibuja su propio <label> — para cuando ya vive dentro de un grupo con label propio (ej. una fila de CollageImagesEditor). */
  label?: string;
  value: string;
  onChange: (value: string) => void;
};

/**
 * Campo de imagen con tres formas de completarlo: escribir la ruta a
 * mano (se mantiene por flexibilidad), elegir una ya subida de la
 * galería, o subir una nueva ahí mismo. La grilla/subida en sí vive en
 * AssetGallery (compartida con la futura pestaña "Imágenes" del
 * panel) — acá solo queda lo específico de ser un campo de un
 * formulario: el modal abrir/cerrar y el aviso de "recién subida".
 */
export default function ImagePicker({ label, value, onChange }: ImagePickerProps) {
  const { assets } = useAssets();
  const [open, setOpen] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);

  const currentPreview = assets.find((a) => a.path === value)?.previewUrl;

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

            <AssetGallery
              selectedPath={value}
              onPick={(path) => {
                onChange(path);
                setOpen(false);
              }}
              onUploaded={(path) => {
                onChange(path);
                setJustUploaded(true);
                setOpen(false);
              }}
              onUploadStart={() => setJustUploaded(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
