"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCredentials, createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth";
import { checkRateLimit, recordFailedAttempt, clearAttempts } from "@/lib/rateLimiter";

export type LoginState = {
  error?: string;
};

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!username || !password) {
    return { error: "Ingresá usuario y contraseña." };
  }

  // Clave por IP + usuario: frena un script de fuerza bruta sin
  // bloquear a otros usuarios (irrelevante hoy con un solo admin, pero
  // evita que alguien bloquee al admin real probando su usuario desde
  // otra IP).
  const rateLimitKey = `${await clientIp()}:${username}`;
  const rateLimit = checkRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    const minutes = Math.ceil(rateLimit.retryAfterSeconds / 60);
    return { error: `Demasiados intentos fallidos. Probá de nuevo en ${minutes} minuto${minutes === 1 ? "" : "s"}.` };
  }

  let valid: boolean;
  try {
    valid = await verifyCredentials(username, password);
  } catch {
    return { error: "El panel no está configurado (faltan variables de entorno)." };
  }

  if (!valid) {
    recordFailedAttempt(rateLimitKey);
    return { error: "Usuario o contraseña incorrectos." };
  }

  clearAttempts(rateLimitKey);

  const token = await createSessionToken(username);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login");
}
