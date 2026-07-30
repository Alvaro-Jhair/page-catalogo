"use client";

import { useState } from "react";
import type { Block } from "@/data/schema";
import AddColorwayForm from "./AddColorwayForm";

type SingleType = "manifesto" | "productHero" | "closing";

const SINGLE_TYPES: { type: SingleType; label: string; icon: string }[] = [
  { type: "manifesto", label: "Manifiesto", icon: "📝" },
  { type: "productHero", label: "Hero de producto", icon: "🖼️" },
  { type: "closing", label: "Cierre", icon: "🏁" },
];

type AddPageChooserProps = {
  defaultProductName: string;
  defaultProductType: string;
  onAddColorway: (blocks: [Block, Block]) => void;
  onAddSingle: (type: SingleType) => void;
};

/**
 * Reemplaza el <select> con los 6 tipos de bloque como texto plano por
 * una elección visual: "+ Colorway" como acción grande y primaria (el
 * caso común — un catálogo típico agrega colorways mucho más seguido
 * que cualquier otro tipo de página), y el resto como botones chicos
 * secundarios. El formulario de colorway en sí (AddColorwayForm) no
 * cambia — esto solo decide cuándo mostrarlo.
 */
export default function AddPageChooser({
  defaultProductName,
  defaultProductType,
  onAddColorway,
  onAddSingle,
}: AddPageChooserProps) {
  const [showColorwayForm, setShowColorwayForm] = useState(false);

  return (
    <div className="admin-add-page-chooser">
      <p className="admin-page-group-label">Agregar página</p>

      {showColorwayForm ? (
        <div className="admin-add-colorway-wrap">
          <button
            type="button"
            className="admin-btn admin-btn-icon"
            onClick={() => setShowColorwayForm(false)}
            aria-label="Cancelar"
          >
            ✕
          </button>
          <AddColorwayForm
            defaultProductName={defaultProductName}
            defaultProductType={defaultProductType}
            onAdd={(blocks) => {
              onAddColorway(blocks);
              setShowColorwayForm(false);
            }}
          />
        </div>
      ) : (
        <button type="button" className="admin-add-page-primary" onClick={() => setShowColorwayForm(true)}>
          <span className="admin-add-page-primary-icon">+</span>
          <span className="admin-add-page-primary-text">
            <strong>Colorway</strong>
            <small>Capítulo + detalle vinculados — lo más común</small>
          </span>
        </button>
      )}

      <div className="admin-add-page-secondary">
        {SINGLE_TYPES.map((t) => (
          <button
            key={t.type}
            type="button"
            className="admin-add-page-secondary-btn"
            onClick={() => onAddSingle(t.type)}
          >
            <span aria-hidden="true">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
