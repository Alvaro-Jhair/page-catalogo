import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { uploadAsset, replaceAsset } from "@/lib/assets";

/**
 * Route Handler para subir imágenes — no un Server Action (fix,
 * 2026-07-28). El panel pasaba el contenido de la imagen en base64 como
 * argumento de un Server Action; a partir de ~3MB (fotos reales de
 * Drive sin optimizar, a diferencia de las ya comprimidas en
 * public/imagenes/) eso choca con un límite interno de seguridad de
 * React ("Maximum array nesting exceeded") mucho antes del límite de
 * 8mb ya configurado — un Route Handler lee el archivo directo del
 * multipart/form-data, sin pasar por la serialización de Server
 * Actions, así que ese límite no aplica acá.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Falta el archivo a subir." }, { status: 400 });
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  const mode = formData.get("mode");
  const targetPath = formData.get("path");

  const result =
    mode === "replace" && typeof targetPath === "string"
      ? await replaceAsset(targetPath, base64)
      : await uploadAsset(file.name, base64);

  return NextResponse.json(result);
}
