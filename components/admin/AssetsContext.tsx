"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Asset } from "@/lib/assets";

/**
 * `previewUrl` (un blob: URL local) solo se completa para una imagen
 * recién subida en esta sesión: el commit a GitHub ya se hizo, pero el
 * archivo no va a existir de verdad en /imagenes/ hasta el próximo
 * redeploy de Vercel, así que sin esto el admin vería un ícono roto
 * justo después de subir su propia foto.
 */
export type ClientAsset = Asset & { previewUrl?: string };

type AssetsContextValue = {
  assets: ClientAsset[];
  addAsset: (asset: ClientAsset) => void;
};

const AssetsContext = createContext<AssetsContextValue | null>(null);

/**
 * Le da a cualquier campo de imagen (por más anidado que esté dentro de
 * un bloque) acceso a la misma lista de imágenes disponibles, sin
 * pasarla a mano por cada nivel intermedio (BlockList, BlockForm,
 * CollageImagesEditor, SwatchesEditor no necesitan saber que esto
 * existe). Ver ImagePicker.
 */
export function AssetsProvider({
  initialAssets,
  children,
}: {
  initialAssets: Asset[];
  children: ReactNode;
}) {
  const [assets, setAssets] = useState<ClientAsset[]>(initialAssets);

  const addAsset = (asset: ClientAsset) => {
    setAssets((prev) => [asset, ...prev.filter((a) => a.path !== asset.path)]);
  };

  return <AssetsContext.Provider value={{ assets, addAsset }}>{children}</AssetsContext.Provider>;
}

export function useAssets(): AssetsContextValue {
  const ctx = useContext(AssetsContext);
  if (!ctx) {
    throw new Error("useAssets debe usarse dentro de <AssetsProvider>");
  }
  return ctx;
}
