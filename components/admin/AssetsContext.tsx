"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Asset } from "@/lib/assets";
import type { DriveLink } from "@/lib/driveLinks";

/**
 * `previewUrl` (un blob: URL local) solo se completa para una imagen
 * recién subida en esta sesión: el commit a GitHub ya se hizo, pero el
 * archivo no va a existir de verdad en /imagenes/ hasta el próximo
 * redeploy de Vercel, así que sin esto el admin vería un ícono roto
 * justo después de subir su propia foto.
 *
 * `driveLink` (Fase F) está presente cuando la imagen vino de Google
 * Drive — habilita el badge + botón de re-sync en ImagePicker.
 */
export type ClientAsset = Asset & { previewUrl?: string; driveLink?: DriveLink };

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
  initialDriveLinks = [],
  children,
}: {
  initialAssets: Asset[];
  initialDriveLinks?: DriveLink[];
  children: ReactNode;
}) {
  const [assets, setAssets] = useState<ClientAsset[]>(() => {
    const linksByPath = new Map(initialDriveLinks.map((link) => [link.path, link]));
    return initialAssets.map((asset) => ({ ...asset, driveLink: linksByPath.get(asset.path) }));
  });

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
