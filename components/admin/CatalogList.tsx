"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteCatalogAction } from "@/app/admin/actions";
import { useConfirm } from "./ConfirmDialogContext";
import { useToast } from "./ToastContext";

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
 * borrar aparte. El commit de borrado se confirma al toque, pero el
 * catálogo sigue compilado en el registro que corre este servidor
 * hasta el próximo redeploy — así que en vez de un router.refresh()
 * (que no cambiaría nada visible todavía y daría la falsa impresión de
 * que no pasó nada), la tarjeta se oculta localmente apenas el commit
 * confirma, con una nota de que la desaparición real tarda ~1 minuto.
 */
export default function CatalogList({ catalogs }: CatalogListProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  const confirm = useConfirm();
  const { showToast } = useToast();

  const visible = catalogs.filter((c) => !deletedIds.includes(c.id));

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Eliminar catálogo",
      message: `¿Eliminar el catálogo "${id}"? No se puede deshacer.`,
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (!ok) return;
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const res = await deleteCatalogAction(id);
      setPendingId(null);
      if (res.ok) {
        setDeletedIds((prev) => [...prev, id]);
        showToast(`Catálogo "${id}" eliminado`);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="admin-catalog-list-wrap">
      <div className="admin-catalog-list">
        {visible.map((c) => (
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
              disabled={pendingId === c.id || visible.length <= 1}
              aria-label={`Eliminar ${c.id}`}
              title={visible.length <= 1 ? "No se puede eliminar el único catálogo" : "Eliminar catálogo"}
            >
              {pendingId === c.id ? "…" : "✕"}
            </button>
          </div>
        ))}
      </div>
      {error && <p className="admin-save-message error">{error}</p>}
      {deletedIds.length > 0 && (
        <p className="admin-image-picker-note">
          {deletedIds.length === 1
            ? `Catálogo "${deletedIds[0]}" eliminado del repo.`
            : `${deletedIds.length} catálogos eliminados del repo.`}{" "}
          Van a desaparecer del sitio público en cuanto Vercel termine de redesplegar.
        </p>
      )}
    </div>
  );
}
