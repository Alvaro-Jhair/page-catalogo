import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

/**
 * Protege /admin/*: sin una cookie de sesión válida, redirige a
 * /admin/login. /admin/login queda afuera para no generar un loop de
 * redirects.
 *
 * Esto es solo la primera línea de defensa (chequeo "optimista", como
 * lo llama la propia doc de Next para Proxy) — las rutas y acciones
 * server-side que de verdad mutan datos (ver app/admin/actions.ts)
 * vuelven a verificar la sesión por su cuenta, no confían en que Proxy
 * ya filtró todo.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
