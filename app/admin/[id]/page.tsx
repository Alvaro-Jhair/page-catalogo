import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { catalogs, type CatalogId } from "@/data/catalogs";
import { listAssets } from "@/lib/assets";
import AdminEditor from "@/components/admin/AdminEditor";
import LogoutButton from "@/components/admin/LogoutButton";
import { AssetsProvider } from "@/components/admin/AssetsContext";

type AdminCatalogPageProps = {
  params: Promise<{ id: string }>;
};

/** Editor de un catálogo puntual — la misma pieza que antes vivía fija en /admin, ahora parametrizada por id. */
export default async function AdminCatalogPage({ params }: AdminCatalogPageProps) {
  await requireSession();
  const { id } = await params;

  if (!(id in catalogs)) {
    notFound();
  }

  const entry = catalogs[id as CatalogId];
  const assets = await listAssets();

  return (
    <AssetsProvider initialAssets={assets}>
      <header className="admin-header">
        <h1>Panel de administración — {id}</h1>
        <div className="admin-header-actions">
          <Link href="/admin" className="admin-btn">
            ← Catálogos
          </Link>
          <LogoutButton />
        </div>
      </header>
      <main className="admin-main">
        <AdminEditor catalogId={id} initialBlocks={entry.blocks} initialTheme={entry.theme} />
      </main>
    </AssetsProvider>
  );
}
