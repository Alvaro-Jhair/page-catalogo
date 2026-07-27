"use client";

import { useState, useTransition } from "react";
import type { Block, CatalogTheme } from "@/data/schema";
import BlockList, { type EditableBlock } from "./BlockList";
import AddColorwayForm from "./AddColorwayForm";
import PreviewOverlay from "./PreviewOverlay";
import ThemeEditor from "./fields/ThemeEditor";
import { saveCatalogAction } from "@/app/admin/actions";

const BLOCK_TYPES: Block["type"][] = [
  "cover",
  "manifesto",
  "productHero",
  "chapterHero",
  "productDetail",
  "closing",
];

const TYPE_LABELS: Record<Block["type"], string> = {
  cover: "Portada",
  manifesto: "Manifiesto",
  productHero: "Hero de producto",
  chapterHero: "Capítulo (transición de colorway)",
  productDetail: "Detalle de producto (colorway)",
  closing: "Cierre",
};

function defaultBlockFor(type: Block["type"]): Block {
  switch (type) {
    case "cover":
      return {
        type,
        data: {
          title: "",
          meta: [],
          subtitle: "",
          bottomLine1: "",
          bottomLine2: "",
          bgImage: "/imagenes/1.png",
          pageNumber: 0,
        },
      };
    case "manifesto":
      return { type, data: { heading: "", paragraph: "", bgImage: "/imagenes/1.png", pageNumber: 0 } };
    case "productHero":
      return { type, data: { id: "", name: "", type: "", bgImage: "/imagenes/1.png", pageNumber: 0 } };
    case "chapterHero":
      return { type, data: { id: "", pageNumber: 0, name: "", label: "", bgImage: "/imagenes/1.png" } };
    case "productDetail":
      return {
        type,
        data: {
          id: "",
          pageNumber: 0,
          name: "",
          type: "",
          price: "",
          description: [],
          collageLayout: "two",
          collageImages: [],
          swatches: [],
        },
      };
    case "closing":
      return { type, data: { title: "", line1: "", line2: "", bgImage: "/imagenes/1.png", pageNumber: 0 } };
  }
}

function makeKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

type AdminEditorProps = {
  catalogId: string;
  initialBlocks: Block[];
  initialTheme: CatalogTheme;
};

type SaveResult = Awaited<ReturnType<typeof saveCatalogAction>>;

export default function AdminEditor({ catalogId, initialBlocks, initialTheme }: AdminEditorProps) {
  const [items, setItems] = useState<EditableBlock[]>(() =>
    initialBlocks.map((block) => ({ key: makeKey(), block }))
  );
  const [theme, setTheme] = useState<CatalogTheme>(initialTheme);
  const [newType, setNewType] = useState<Block["type"]>("productDetail");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SaveResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const addBlock = () => {
    setItems([...items, { key: makeKey(), block: defaultBlockFor(newType) }]);
  };

  const addColorway = (blocks: [Block, Block]) => {
    setItems([...items, ...blocks.map((block) => ({ key: makeKey(), block }))]);
  };

  // Precompletar el template de colorway con el nombre/tipo del producto
  // ya existente en el catálogo, en vez de arrancar en blanco.
  const heroBlock = items.find((item) => item.block.type === "productHero")?.block;
  const defaultProductName = heroBlock?.type === "productHero" ? heroBlock.data.name : "";
  const defaultProductType = heroBlock?.type === "productHero" ? heroBlock.data.type : "";

  const handleSave = () => {
    setResult(null);
    startTransition(async () => {
      const res = await saveCatalogAction(
        catalogId,
        theme,
        items.map((item) => item.block)
      );
      setResult(res);
    });
  };

  return (
    <>
      <ThemeEditor theme={theme} onChange={setTheme} />

      <BlockList items={items} onChange={setItems} />

      <AddColorwayForm
        defaultProductName={defaultProductName}
        defaultProductType={defaultProductType}
        onAdd={addColorway}
      />

      <div className="admin-add-block">
        <select value={newType} onChange={(e) => setNewType(e.target.value as Block["type"])}>
          {BLOCK_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <button type="button" className="admin-btn" onClick={addBlock}>
          + Agregar bloque
        </button>
      </div>

      <div className="admin-save-bar">
        <button type="button" className="admin-btn" onClick={() => setPreviewOpen(true)}>
          Vista previa
        </button>

        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={handleSave}
          disabled={isPending}
        >
          {isPending ? "Guardando…" : "Guardar y publicar"}
        </button>

        {result &&
          (result.ok ? (
            <p className="admin-save-message ok">
              Guardado.{" "}
              <a href={result.commitUrl} target="_blank" rel="noreferrer">
                Ver commit
              </a>
            </p>
          ) : (
            <div>
              <p className="admin-save-message error">{result.error}</p>
              {result.issues && (
                <ul className="admin-save-issues">
                  {result.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
      </div>

      {previewOpen && (
        <PreviewOverlay
          blocks={items.map((item) => item.block)}
          theme={theme}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
