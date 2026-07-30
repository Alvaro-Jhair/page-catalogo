"use client";

import type { CatalogTheme } from "@/data/schema";

type ThemeEditorProps = {
  theme: CatalogTheme;
  onChange: (theme: CatalogTheme) => void;
};

// Stacks curados de fuentes ya disponibles en el sistema — control
// granular sobre qué combinación usar, no un color/fuente libre por
// texto que podría no existir en el dispositivo del visitante. Las 4
// opciones serif terminan en "Playfair Display" antes de "serif": es
// la única fuente que este proyecto sí embebe como archivo propio (ver
// @font-face en app/globals.css) — el Chromium que genera el PDF en
// Vercel no tiene Georgia/Times/Palatino/Didot instaladas (son fuentes
// de sistema operativo, no del navegador), así que sin ese fallback el
// título salía en una sans-serif genérica en el PDF aunque se viera
// bien en la web de cualquier visitante con esas fuentes instaladas.
const DISPLAY_FONTS: Record<string, string> = {
  'Georgia, "Times New Roman", "Playfair Display", serif': "Serif clásica (Georgia)",
  '"Times New Roman", Times, "Playfair Display", serif': "Serif editorial (Times)",
  'Palatino, "Palatino Linotype", "Book Antiqua", "Playfair Display", serif': "Serif refinada (Palatino)",
  'Didot, "Bodoni MT", "Playfair Display", serif': "Serif de moda (Didot)",
  'Futura, "Century Gothic", sans-serif': "Sans geométrica (Futura)",
};

const BODY_FONTS: Record<string, string> = {
  "Arial, Helvetica, sans-serif": "Arial / Helvetica (actual)",
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif': "Sistema (San Francisco / Segoe)",
  'Futura, "Century Gothic", sans-serif': "Sans geométrica (Futura)",
  "Verdana, Geneva, sans-serif": "Verdana clara",
};

const COLOR_FIELDS: Array<{ key: keyof CatalogTheme; label: string }> = [
  { key: "ink", label: "Texto / tinta" },
  { key: "paper", label: "Papel / fondo claro" },
  { key: "line", label: "Líneas" },
  { key: "muted", label: "Texto secundario" },
  { key: "accent", label: "Acento" },
];

export default function ThemeEditor({ theme, onChange }: ThemeEditorProps) {
  const set = <K extends keyof CatalogTheme>(key: K, value: CatalogTheme[K]) =>
    onChange({ ...theme, [key]: value });

  return (
    <div className="admin-theme-editor">
      <p className="admin-add-colorway-title">Tema del catálogo</p>

      <div className="admin-theme-colors">
        {COLOR_FIELDS.map(({ key, label }) => (
          <div className="admin-theme-color" key={key}>
            <input
              type="color"
              value={theme[key] as string}
              onChange={(e) => set(key, e.target.value)}
              aria-label={label}
            />
            <div className="admin-theme-color-text">
              <span className="admin-theme-color-label">{label}</span>
              <span className="admin-theme-color-hex">{(theme[key] as string).toUpperCase()}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-theme-fonts">
        <div className="admin-field">
          <label>Fuente de título</label>
          <select value={theme.displayFont} onChange={(e) => set("displayFont", e.target.value)}>
            {Object.entries(DISPLAY_FONTS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-field">
          <label>Fuente de texto</label>
          <select value={theme.bodyFont} onChange={(e) => set("bodyFont", e.target.value)}>
            {Object.entries(BODY_FONTS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
