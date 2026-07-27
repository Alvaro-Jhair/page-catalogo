"use client";

import { useState, type ReactNode } from "react";
import type { Block } from "@/data/schema";
import BlockForm from "./BlockForm";

/**
 * `key` es un identificador sintético, solo para React/la UI del panel
 * — nunca viaja a data/schema.ts ni al commit. Hace falta porque
 * `block.data.id` puede estar vacío o duplicado mientras se edita, y
 * porque el orden cambia (subir/bajar), así que un índice de array no
 * alcanza para no perder el estado de "qué bloque está expandido".
 */
export type EditableBlock = {
  key: string;
  block: Block;
};

const TYPE_LABELS: Record<Block["type"], string> = {
  cover: "Portada",
  manifesto: "Manifiesto",
  productHero: "Hero",
  chapterHero: "Capítulo",
  productDetail: "Detalle",
  closing: "Cierre",
};

function blockTitle(block: Block): string {
  switch (block.type) {
    case "cover":
      return block.data.title || "(sin título)";
    case "manifesto":
      return block.data.heading || "(sin título)";
    case "productHero":
      return block.data.name || "(sin nombre)";
    case "chapterHero":
      return block.data.name || block.data.label ? `${block.data.name} — ${block.data.label}` : "(sin nombre)";
    case "productDetail":
      return block.data.name || block.data.type ? `${block.data.name} — ${block.data.type}` : "(sin nombre)";
    case "closing":
      return block.data.title || "(sin título)";
  }
}

type BlockListProps = {
  items: EditableBlock[];
  onChange: (items: EditableBlock[]) => void;
};

export default function BlockList({ items, onChange }: BlockListProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...items];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  };

  const moveDown = (i: number) => {
    if (i === items.length - 1) return;
    const next = [...items];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onChange(next);
  };

  const remove = (i: number) => {
    if (!confirm("¿Quitar este bloque del catálogo?")) return;
    onChange(items.filter((_, idx) => idx !== i));
  };

  const updateBlock = (i: number, block: Block) => {
    onChange(items.map((item, idx) => (idx === i ? { ...item, block } : item)));
  };

  // Mueve el par [capítulo, detalle] que arranca en `startIndex` una
  // posición entera hacia arriba/abajo, en vez de mover cada bloque por
  // separado — así reordenar un colorway completo es 1 clic en vez de 2.
  const moveGroupUp = (startIndex: number) => {
    if (startIndex === 0) return;
    const next = [...items];
    const pair = next.splice(startIndex, 2);
    next.splice(startIndex - 1, 0, ...pair);
    onChange(next);
  };

  const moveGroupDown = (startIndex: number) => {
    if (startIndex + 2 >= items.length) return;
    const next = [...items];
    const pair = next.splice(startIndex, 2);
    next.splice(startIndex + 1, 0, ...pair);
    onChange(next);
  };

  if (items.length === 0) {
    return <p>Este catálogo no tiene bloques todavía. Agregá uno abajo.</p>;
  }

  function renderCard(item: EditableBlock, i: number) {
    const isOpen = expandedKey === item.key;
    return (
      <div className="admin-block" key={item.key}>
        <div className="admin-block-summary">
          <span className="admin-block-tag">{TYPE_LABELS[item.block.type]}</span>
          <button
            type="button"
            className="admin-block-title"
            onClick={() => setExpandedKey(isOpen ? null : item.key)}
          >
            {blockTitle(item.block)}
          </button>
          <div className="admin-block-controls">
            <button
              type="button"
              className="admin-btn admin-btn-icon"
              onClick={() => moveUp(i)}
              disabled={i === 0}
              aria-label="Subir bloque"
            >
              ↑
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-icon"
              onClick={() => moveDown(i)}
              disabled={i === items.length - 1}
              aria-label="Bajar bloque"
            >
              ↓
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-icon"
              onClick={() => setExpandedKey(isOpen ? null : item.key)}
            >
              {isOpen ? "Cerrar" : "Editar"}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-icon admin-btn-danger"
              onClick={() => remove(i)}
              aria-label="Quitar bloque"
            >
              ✕
            </button>
          </div>
        </div>
        {isOpen && (
          <div className="admin-block-form">
            <BlockForm block={item.block} onChange={(b) => updateBlock(i, b)} />
          </div>
        )}
      </div>
    );
  }

  const cards: ReactNode[] = [];
  for (let i = 0; i < items.length; i++) {
    const current = items[i].block;
    const nextItem = items[i + 1]?.block;
    const isColorwayPair =
      current.type === "chapterHero" &&
      nextItem?.type === "productDetail" &&
      current.data.id !== "" &&
      current.data.id === nextItem.data.id;

    if (isColorwayPair) {
      cards.push(
        <div className="admin-colorway-group" key={`group-${items[i].key}`}>
          <div className="admin-colorway-group-header">
            <span>Colorway: {current.data.label || current.data.name || "(sin nombre)"}</span>
            <div className="admin-block-controls">
              <button
                type="button"
                className="admin-btn admin-btn-icon"
                onClick={() => moveGroupUp(i)}
                disabled={i === 0}
                aria-label="Subir colorway completo"
              >
                ↑↑
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-icon"
                onClick={() => moveGroupDown(i)}
                disabled={i + 2 >= items.length}
                aria-label="Bajar colorway completo"
              >
                ↓↓
              </button>
            </div>
          </div>
          {renderCard(items[i], i)}
          {renderCard(items[i + 1], i + 1)}
        </div>
      );
      i++; // ya se renderizó el par completo, saltar el segundo bloque
      continue;
    }

    cards.push(renderCard(items[i], i));
  }

  return <div className="admin-block-list">{cards}</div>;
}
