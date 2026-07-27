import { requireSession } from "@/lib/session";
import { catalogs } from "@/data/catalogs";
import { listAssets } from "@/lib/assets";
import AdminEditor from "@/components/admin/AdminEditor";
import LogoutButton from "@/components/admin/LogoutButton";
import { AssetsProvider } from "@/components/admin/AssetsContext";

export default async function AdminPage() {
  await requireSession();
  const assets = await listAssets();

  return (
    <AssetsProvider initialAssets={assets}>
      <header className="admin-header">
        <h1>Panel de administración — Ariel</h1>
        <div className="admin-header-actions">
          <LogoutButton />
        </div>
      </header>
      <main className="admin-main">
        <AdminEditor initialBlocks={catalogs.ariel.blocks} initialTheme={catalogs.ariel.theme} />
      </main>
    </AssetsProvider>
  );
}
