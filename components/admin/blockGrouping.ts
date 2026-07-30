import type { Block } from "@/data/schema";
import type { EditableBlock } from "./BlockList";

/**
 * Detecta pares [chapterHero, productDetail] adyacentes que comparten
 * `id` (no vacío) — la misma condición que ya usaba BlockList.tsx
 * inline, extraída acá para poder reusarla desde otras vistas (la
 * grilla de tarjetas del rediseño del panel) sin duplicar la lógica.
 */
export type DisplayGroup =
  | { kind: "single"; item: EditableBlock; index: number }
  | { kind: "colorway"; chapter: EditableBlock; detail: EditableBlock; chapterIndex: number; detailIndex: number };

function isColorwayPair(current: Block, next: Block | undefined): boolean {
  return (
    current.type === "chapterHero" &&
    next?.type === "productDetail" &&
    current.data.id !== "" &&
    current.data.id === next.data.id
  );
}

export function groupItemsForDisplay(items: EditableBlock[]): DisplayGroup[] {
  const groups: DisplayGroup[] = [];
  for (let i = 0; i < items.length; i++) {
    const current = items[i].block;
    const nextItem = items[i + 1]?.block;

    if (isColorwayPair(current, nextItem)) {
      groups.push({
        kind: "colorway",
        chapter: items[i],
        detail: items[i + 1],
        chapterIndex: i,
        detailIndex: i + 1,
      });
      i++; // ya se agrupó el par completo, saltar el segundo bloque
      continue;
    }

    groups.push({ kind: "single", item: items[i], index: i });
  }
  return groups;
}
