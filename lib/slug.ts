/**
 * Slug URL/filesystem-safe (minúsculas, sin acentos, guiones en vez de
 * separadores) — compartido entre lib/templates.ts (id de colorway) y
 * la creación de catálogos nuevos desde el panel (id de catálogo), en
 * vez de duplicar la misma regex en los dos lugares.
 */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos (á -> a, etc.)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
