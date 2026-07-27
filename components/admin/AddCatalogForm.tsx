"use client";

import { useState, useTransition } from "react";
import { createCatalogAction } from "@/app/admin/actions";

/**
 * Crea un catálogo nuevo desde cero (contenido inicial armado por
 * lib/newCatalog.ts). A propósito NO navega a /admin/<id> apenas
 * termina: ese id todavía no existe en el registro que está corriendo
 * este mismo servidor — recién va a estar ahí cuando Vercel termine de
 * redesplegar a partir del commit que se acaba de crear (~1 minuto), y
 * un push inmediato caía en un 404/página equivocada por esa carrera.
 * En cambio queda un mensaje de éxito con el link directo para cuando
 * ya esté listo.
 */
export default function AddCatalogForm() {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; commitUrl: string } | null>(null);

  const handleCreate = () => {
    if (!name.trim()) return;
    setError(null);
    setCreated(null);
    startTransition(async () => {
      const res = await createCatalogAction(name);
      if (res.ok) {
        setName("");
        setCreated({ id: res.id, commitUrl: res.commitUrl });
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="admin-add-catalog">
      <p className="admin-add-colorway-title">Agregar catálogo</p>
      <div className="admin-add-catalog-fields">
        <input
          type="text"
          placeholder="Nombre del catálogo (ej. Solstice)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="button" className="admin-btn admin-btn-primary" onClick={handleCreate} disabled={isPending}>
          {isPending ? "Creando…" : "+ Crear catálogo"}
        </button>
      </div>
      <p className="admin-image-picker-note">
        Arranca con una estructura completa (portada, manifiesto, dos colorways, cierre) para editar encima — no
        queda disponible para editar ni visible en el sitio hasta que Vercel termine de redesplegar.
      </p>
      {error && <p className="admin-save-message error">{error}</p>}
      {created && (
        <p className="admin-save-message ok">
          Catálogo &ldquo;{created.id}&rdquo; creado (
          <a href={created.commitUrl} target="_blank" rel="noreferrer">
            ver commit
          </a>
          ). En cuanto termine el redeploy vas a poder editarlo en <code>/admin/{created.id}</code>.
        </p>
      )}
    </div>
  );
}
