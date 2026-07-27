import "server-only";

/**
 * Limitador de intentos en memoria, sin infraestructura nueva (sin KV/
 * Redis) — apropiado para la escala actual (un solo administrador). Es
 * por instancia del proceso: en serverless, una instancia fría nueva
 * arranca sin memoria de intentos previos. No es a prueba de un
 * atacante distribuido y persistente, pero sí frena por completo un
 * script simple de fuerza bruta contra un endpoint público, que es el
 * riesgo real dado que /admin/login no tiene ninguna otra protección.
 */

type Entry = { count: number; lockedUntil: number };

const attempts = new Map<string, Entry>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutos bloqueado tras agotar los intentos

export type RateLimitCheck = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export function checkRateLimit(key: string): RateLimitCheck {
  const entry = attempts.get(key);
  if (!entry) return { allowed: true };

  const now = Date.now();
  if (entry.lockedUntil > now) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000) };
  }

  return { allowed: true };
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key) ?? { count: 0, lockedUntil: 0 };

  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
    entry.count = 0;
  }

  attempts.set(key, entry);
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}
