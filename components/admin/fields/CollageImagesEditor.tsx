"use client";

import type { CollageImage } from "@/data/schema";
import ImagePicker from "../ImagePicker";

type CollageImagesEditorProps = {
  images: CollageImage[];
  onChange: (images: CollageImage[]) => void;
};

export default function CollageImagesEditor({ images, onChange }: CollageImagesEditorProps) {
  const update = (i: number, patch: Partial<CollageImage>) => {
    onChange(images.map((img, idx) => (idx === i ? { ...img, ...patch } : img)));
  };
  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));
  const add = () => onChange([...images, { src: "/imagenes/1.png", alt: "" }]);

  return (
    <div className="admin-field">
      <label>Imágenes del collage</label>
      <div className="admin-list-editor">
        {images.map((img, i) => (
          <div className="admin-collage-row" key={i}>
            <ImagePicker value={img.src} onChange={(v) => update(i, { src: v })} />
            <input
              type="text"
              placeholder="texto alternativo"
              value={img.alt}
              onChange={(e) => update(i, { alt: e.target.value })}
            />
            <button
              type="button"
              className="admin-btn admin-btn-icon admin-btn-danger"
              onClick={() => remove(i)}
              aria-label="Quitar imagen"
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="admin-btn" onClick={add}>
          + Agregar imagen
        </button>
      </div>
    </div>
  );
}
