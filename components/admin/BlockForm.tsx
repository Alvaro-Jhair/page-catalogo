"use client";

import type { Block } from "@/data/schema";
import TextField from "./fields/TextField";
import TextAreaField from "./fields/TextAreaField";
import SelectField from "./fields/SelectField";
import StringListEditor from "./fields/StringListEditor";
import CollageImagesEditor from "./fields/CollageImagesEditor";
import SwatchesEditor from "./fields/SwatchesEditor";
import ImagePicker from "./ImagePicker";

type BlockFormProps = {
  block: Block;
  onChange: (block: Block) => void;
};

const COLLAGE_LAYOUTS = ["four", "three", "two"] as const;

/**
 * Un formulario por tipo de bloque, con los campos que ese tipo
 * necesita (mismo espíritu que BlockRenderer, pero para editar en vez
 * de dibujar). pageNumber no se edita acá: se recalcula a partir de la
 * posición del bloque al guardar (ver app/admin/actions.ts).
 */
export default function BlockForm({ block, onChange }: BlockFormProps) {
  switch (block.type) {
    case "cover": {
      const { data } = block;
      const set = (patch: Partial<typeof data>) => onChange({ ...block, data: { ...data, ...patch } });
      return (
        <>
          <TextField label="Título" value={data.title} onChange={(v) => set({ title: v })} />
          <StringListEditor
            label="Meta (vol, año, etc.)"
            items={data.meta}
            onChange={(v) => set({ meta: v })}
            placeholder="ej. VOL.01"
          />
          <TextField label="Subtítulo" value={data.subtitle} onChange={(v) => set({ subtitle: v })} />
          <TextField label="Línea inferior 1" value={data.bottomLine1} onChange={(v) => set({ bottomLine1: v })} />
          <TextField label="Línea inferior 2" value={data.bottomLine2} onChange={(v) => set({ bottomLine2: v })} />
          <ImagePicker label="Imagen de fondo" value={data.bgImage} onChange={(v) => set({ bgImage: v })} />
        </>
      );
    }

    case "manifesto": {
      const { data } = block;
      const set = (patch: Partial<typeof data>) => onChange({ ...block, data: { ...data, ...patch } });
      return (
        <>
          <TextField label="Título" value={data.heading} onChange={(v) => set({ heading: v })} />
          <TextAreaField label="Párrafo" value={data.paragraph} onChange={(v) => set({ paragraph: v })} />
          <ImagePicker label="Imagen de fondo" value={data.bgImage} onChange={(v) => set({ bgImage: v })} />
        </>
      );
    }

    case "productHero": {
      const { data } = block;
      const set = (patch: Partial<typeof data>) => onChange({ ...block, data: { ...data, ...patch } });
      return (
        <>
          <TextField label="Id (ancla)" value={data.id} onChange={(v) => set({ id: v })} />
          <TextField label="Nombre" value={data.name} onChange={(v) => set({ name: v })} />
          <TextField label="Tipo" value={data.type} onChange={(v) => set({ type: v })} />
          <ImagePicker label="Imagen de fondo" value={data.bgImage} onChange={(v) => set({ bgImage: v })} />
        </>
      );
    }

    case "chapterHero": {
      const { data } = block;
      const set = (patch: Partial<typeof data>) => onChange({ ...block, data: { ...data, ...patch } });
      return (
        <>
          <TextField label="Id (ancla)" value={data.id} onChange={(v) => set({ id: v })} />
          <TextField label="Nombre" value={data.name} onChange={(v) => set({ name: v })} />
          <TextField label="Etiqueta (colorway)" value={data.label} onChange={(v) => set({ label: v })} />
          <ImagePicker label="Imagen de fondo" value={data.bgImage} onChange={(v) => set({ bgImage: v })} />
        </>
      );
    }

    case "productDetail": {
      const { data } = block;
      const set = (patch: Partial<typeof data>) => onChange({ ...block, data: { ...data, ...patch } });
      return (
        <>
          <TextField label="Id (ancla)" value={data.id} onChange={(v) => set({ id: v })} />
          <TextField label="Nombre" value={data.name} onChange={(v) => set({ name: v })} />
          <TextField label="Tipo" value={data.type} onChange={(v) => set({ type: v })} />
          <TextField label="Precio" value={data.price} onChange={(v) => set({ price: v })} />
          <StringListEditor
            label="Descripción"
            items={data.description}
            onChange={(v) => set({ description: v })}
          />
          <SelectField
            label="Layout del collage"
            value={data.collageLayout}
            options={COLLAGE_LAYOUTS}
            onChange={(v) => set({ collageLayout: v as (typeof COLLAGE_LAYOUTS)[number] })}
          />
          <CollageImagesEditor images={data.collageImages} onChange={(v) => set({ collageImages: v })} />
          <SwatchesEditor swatches={data.swatches} onChange={(v) => set({ swatches: v })} />
        </>
      );
    }

    case "closing": {
      const { data } = block;
      const set = (patch: Partial<typeof data>) => onChange({ ...block, data: { ...data, ...patch } });
      return (
        <>
          <TextField label="Título" value={data.title} onChange={(v) => set({ title: v })} />
          <TextField label="Línea 1" value={data.line1} onChange={(v) => set({ line1: v })} />
          <TextField label="Línea 2" value={data.line2} onChange={(v) => set({ line2: v })} />
          <ImagePicker label="Imagen de fondo" value={data.bgImage} onChange={(v) => set({ bgImage: v })} />
        </>
      );
    }

    default: {
      const exhaustiveCheck: never = block;
      return exhaustiveCheck;
    }
  }
}
