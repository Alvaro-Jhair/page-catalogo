import "./admin.css";
import { ToastProvider } from "@/components/admin/ToastContext";
import { ConfirmProvider } from "@/components/admin/ConfirmDialogContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-root">
      <ToastProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </ToastProvider>
    </div>
  );
}
