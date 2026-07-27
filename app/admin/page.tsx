import Link from "next/link";
import { requireSession } from "@/lib/session";
import { catalogs } from "@/data/catalogs";
import type { Block, CatalogBlocks } from "@/data/schema";
import LogoutButton from "@/components/admin/LogoutButton";
import AddCatalogForm from "@/components/admin/AddCatalogForm";

function getCoverBlock(blocks: CatalogBlocks) {
  return blocks.find((b): b is Extract<Block, { type: "cover" }> => b.type === "cover");
}

/**
 * Índice de catálogos del panel: uno por entrada del registro
 * (data/catalogs/index.ts), cada uno linkeando a su propio editor en
 * /admin/[id] — antes /admin era directamente el editor de Ariel, el
 * único catálogo que existía; ahora que el panel puede crear más, hace
 * falta un punto de entrada que liste todos.
 */
export default async function AdminPage() {
  await requireSession();
  const entries = Object.entries(catalogs);

  return (
    <>
      <header className="admin-header">
        <h1>Panel de administración</h1>
        <div className="admin-header-actions">
          <LogoutButton />
        </div>
      </header>
      <main className="admin-main">
        <div className="admin-catalog-list">
          {entries.map(([id, entry]) => {
            const cover = getCoverBlock(entry.blocks);
            return (
              <Link key={id} href={`/admin/${id}`} className="admin-catalog-card">
                <span className="admin-catalog-card-title">{cover?.data.title || id}</span>
                <span className="admin-catalog-card-meta">
                  {id} · {entry.blocks.length} bloques
                </span>
              </Link>
            );
          })}
        </div>

        <AddCatalogForm />
      </main>
    </>
  );
}
