"use client";

import { useState } from "react";
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

  if (items.length === 0) {
    return <p>Este catálogo no tiene bloques todavía. Agregá uno abajo.</p>;
  }

  return (
    <div className="admin-block-list">
      {items.map((item, i) => {
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
      })}
    </div>
  );
}
