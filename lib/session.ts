import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE_NAME } from "./auth";

/**
 * Separado de lib/auth.ts a propósito: este archivo usa next/headers y
 * next/navigation (solo Node/Server Components), mientras que
 * lib/auth.ts debe seguir siendo seguro de importar desde proxy.ts
 * (Edge runtime).
 *
 * proxy.ts ya redirige si no hay sesión — esto es la segunda línea de
 * defensa: cualquier Server Component o Server Action que lea o
 * modifique datos de administración vuelve a verificar por su cuenta,
 * en vez de confiar en que el proxy ya filtró todo.
 */
export async function requireSession(): Promise<{ username: string }> {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

/**
 * Igual que requireSession(), pero sin redirect() — pensado para Route
 * Handlers (app/api/admin/upload/route.ts) que responden con JSON a un
 * fetch(), no con una navegación de página: ahí un redirect() se vería
 * como una respuesta HTML confusa en vez de un 401 claro.
 */
export async function getSession(): Promise<{ username: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return token ? await verifySessionToken(token) : null;
}
