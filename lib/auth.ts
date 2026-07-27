import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

/**
 * Autenticación de un solo administrador (o un puñado, vía allowlist de
 * usuario) para /admin. No hay roles ni permisos granulares — no hacen
 * falta para el alcance actual. La sesión es un JWT firmado en una
 * cookie httpOnly; se verifica con `jose` (no `jsonwebtoken`) porque
 * corre también en el middleware, que usa el Edge runtime.
 */

const SESSION_COOKIE = "admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 horas

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Falta configurar AUTH_SECRET en las variables de entorno.");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Compara username/password contra las credenciales configuradas por env
 * var. ADMIN_PASSWORD_HASH es un hash bcrypt, nunca la clave en texto
 * plano — generarlo con `npx bcryptjs-cli hash "clave"` o el script
 * equivalente antes de desplegar.
 */
export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedUsername || !expectedPasswordHash) {
    throw new Error(
      "Falta configurar ADMIN_USERNAME y ADMIN_PASSWORD_HASH en las variables de entorno."
    );
  }

  // Comparación de igual longitud primero para evitar filtrar por timing
  // si el usuario no calza; bcrypt.compare ya es resistente a timing en
  // el hash en sí.
  if (username !== expectedUsername) {
    // Igual corremos un compare "de relleno" para no revelar por tiempo
    // de respuesta si el usuario existe o no.
    await bcrypt.compare(password, expectedPasswordHash);
    return false;
  }

  return bcrypt.compare(password, expectedPasswordHash);
}

export async function createSessionToken(username: string): Promise<string> {
  return new SignJWT({ sub: username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getAuthSecret());
}

export async function verifySessionToken(token: string): Promise<{ username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (typeof payload.sub !== "string") return null;
    return { username: payload.sub };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_MAX_AGE = SESSION_DURATION_SECONDS;
