"use client";

import type { CatalogTemplate } from "@/lib/newCatalog";
import TemplateThumb from "../TemplateThumb";

type StepInfoProps = {
  name: string;
  onNameChange: (value: string) => void;
  slug: string;
  onSlugChange: (value: string) => void;
  templates: CatalogTemplate[];
  templateId: string;
  onTemplateChange: (id: string) => void;
  colorwayCount: number;
  onColorwayCountChange: (count: number) => void;
  minColorways: number;
  maxColorways: number;
};

/** Paso 1 del wizard: qué catálogo es (nombre/slug), con qué plantilla arranca, y cuántas colorways ("páginas de producto") trae de entrada. */
export default function StepInfo({
  name,
  onNameChange,
  slug,
  onSlugChange,
  templates,
  templateId,
  onTemplateChange,
  colorwayCount,
  onColorwayCountChange,
  minColorways,
  maxColorways,
}: StepInfoProps) {
  return (
    <div className="admin-wizard-step">
      <div className="admin-field">
        <label htmlFor="wizard-name">Nombre del catálogo</label>
        <input
          id="wizard-name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="ej. Solstice"
        />
      </div>

      <div className="admin-field">
        <label htmlFor="wizard-slug">Slug (dirección web)</label>
        <input id="wizard-slug" type="text" value={slug} onChange={(e) => onSlugChange(e.target.value)} />
        <p className="admin-image-picker-note">Se va a poder ver en /catalog/{slug || "…"}</p>
      </div>

      <p className="admin-add-colorway-title">Elegí una plantilla</p>
      <div className="admin-template-carousel">
        {templates.map((template) => (
          <button
            type="button"
            key={template.id}
            className={`admin-template-card${template.id === templateId ? " selected" : ""}`}
            onClick={() => onTemplateChange(template.id)}
          >
            <TemplateThumb template={template} />
            <p className="admin-template-card-title">{template.label}</p>
            <p className="admin-template-card-description">{template.description}</p>
          </button>
        ))}
      </div>

      <div className="admin-field">
        <label htmlFor="wizard-colorways">Cantidad de colorways (páginas de producto)</label>
        <div className="admin-wizard-stepper" id="wizard-colorways">
          <button
            type="button"
            className="admin-btn admin-btn-icon"
            onClick={() => onColorwayCountChange(Math.max(minColorways, colorwayCount - 1))}
            disabled={colorwayCount <= minColorways}
            aria-label="Menos colorways"
          >
            −
          </button>
          <span className="admin-wizard-stepper-value">{colorwayCount}</span>
          <button
            type="button"
            className="admin-btn admin-btn-icon"
            onClick={() => onColorwayCountChange(Math.min(maxColorways, colorwayCount + 1))}
            disabled={colorwayCount >= maxColorways}
            aria-label="Más colorways"
          >
            +
          </button>
        </div>
        <p className="admin-image-picker-note">
          Cada colorway agrega 2 páginas (capítulo + detalle). Después de crear el catálogo se pueden seguir
          agregando o quitando desde el editor.
        </p>
      </div>
    </div>
  );
}
