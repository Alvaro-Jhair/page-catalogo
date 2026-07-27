"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCatalogAction } from "@/app/admin/actions";

/**
 * Crea un catálogo nuevo desde cero (contenido inicial armado por
 * lib/newCatalog.ts) y, si el commit sale bien, navega directo a su
 * editor — el catálogo recién creado tarda lo que tarda el redeploy de
 * Vercel en aparecer en el sitio público, pero ya es editable en
 * /admin/<id> apenas el commit se hizo (esa ruta lee del registro
 * compilado, así que no estará disponible hasta el próximo build; el
 * mensaje de éxito lo aclara).
 */
export default function AddCatalogForm() {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = () => {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await createCatalogAction(name);
      if (res.ok) {
        setName("");
        router.push(`/admin/${res.id}`);
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
        queda visible en el sitio público hasta que Vercel termine de redesplegar.
      </p>
      {error && <p className="admin-save-message error">{error}</p>}
    </div>
  );
}
