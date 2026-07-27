import { logoutAction } from "@/app/admin/login/actions";

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="admin-btn">
        Salir
      </button>
    </form>
  );
}
