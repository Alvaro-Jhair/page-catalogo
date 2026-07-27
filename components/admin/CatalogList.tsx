"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCatalogAction } from "@/app/admin/actions";

export type CatalogListItem = {
  id: string;
  title: string;
  blockCount: number;
};

type CatalogListProps = {
  catalogs: CatalogListItem[];
};

/**
 * Cada tarjeta linkea a su editor (/admin/[id]) y tiene un botón de
 * borrar aparte — es su propio componente cliente (no un <Link> puro
 * como antes) porque borrar necesita confirmar, llamar a la Server
 * Action y refrescar la lista sin navegar.
 */
export default function CatalogList({ catalogs }: CatalogListProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!confirm(`¿Eliminar el catálogo "${id}"? No se puede deshacer.`)) return;
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const res = await deleteCatalogAction(id);
      setPendingId(null);
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="admin-catalog-list-wrap">
      <div className="admin-catalog-list">
        {catalogs.map((c) => (
          <div className="admin-catalog-card" key={c.id}>
            <Link href={`/admin/${c.id}`} className="admin-catalog-card-link">
              <span className="admin-catalog-card-title">{c.title}</span>
              <span className="admin-catalog-card-meta">
                {c.id} · {c.blockCount} bloques
              </span>
            </Link>
            <button
              type="button"
              className="admin-btn admin-btn-icon admin-btn-danger"
              onClick={() => handleDelete(c.id)}
              disabled={pendingId === c.id || catalogs.length <= 1}
              aria-label={`Eliminar ${c.id}`}
              title={catalogs.length <= 1 ? "No se puede eliminar el único catálogo" : "Eliminar catálogo"}
            >
              {pendingId === c.id ? "…" : "✕"}
            </button>
          </div>
        ))}
      </div>
      {error && <p className="admin-save-message error">{error}</p>}
    </div>
  );
}
