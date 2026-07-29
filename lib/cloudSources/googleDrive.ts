import type { CloudSource, CloudPickedFile } from "./types";

// Google no ofrece paquetes npm para esto — el propio Picker/Identity
// Services solo se cargan como <script> globales, así que estos tipos
// quedan como `any` a propósito (no hay @types oficiales tampoco).
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- sin @types oficiales para el script global de gapi
    gapi: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- sin @types oficiales para el script global de Google Identity Services/Picker
    google: any;
  }
}

const PICKER_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

function clientId(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
}
function apiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
}
function appId(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_APP_ID;
}

function isGoogleDriveConfigured(): boolean {
  return Boolean(clientId() && apiKey() && appId());
}

function unconfiguredReason(): string {
  const missing = [
    !clientId() && "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
    !apiKey() && "NEXT_PUBLIC_GOOGLE_API_KEY",
    !appId() && "NEXT_PUBLIC_GOOGLE_APP_ID",
  ].filter((v): v is string => Boolean(v));
  return `Falta configurar ${missing.join(", ")} para habilitar la importación desde Google Drive.`;
}

let scriptsLoadingPromise: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}.`));
    document.head.appendChild(script);
  });
}

/** Carga api.js (Picker) + el cliente de Google Identity Services — una sola vez, reusada entre importaciones. */
function loadGoogleScripts(): Promise<void> {
  if (!scriptsLoadingPromise) {
    scriptsLoadingPromise = Promise.all([
      loadScript("https://apis.google.com/js/api.js"),
      loadScript("https://accounts.google.com/gsi/client"),
    ]).then(() => undefined);
  }
  return scriptsLoadingPromise;
}

function loadPickerLibrary(): Promise<void> {
  return new Promise((resolve) => {
    window.gapi.load("picker", () => resolve());
  });
}

/**
 * Pide un access token de corta duración vía el token client de GIS —
 * a propósito no se persiste ningún refresh token (ver decisión del
 * plan de Fase E): cada importación vuelve a pedir consentimiento. Sin
 * `error_callback`, cerrar el popup de consentimiento deja la promesa
 * colgada para siempre (comportamiento documentado de GIS) — el mismo
 * tipo de bug de "botón pegado en Cargando…" que este proyecto ya tuvo
 * que arreglar una vez en el login, así que se maneja explícito acá.
 */
function getAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId(),
      scope: PICKER_SCOPE,
      callback: (response: { error?: string; access_token: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.access_token);
        }
      },
      error_callback: (err: { type: string }) => {
        if (err.type === "popup_closed") {
          reject(new Error("Se cerró la ventana de Google sin elegir una cuenta."));
        } else {
          reject(new Error("No se pudo abrir la ventana de autorización de Google."));
        }
      },
    });
    tokenClient.requestAccessToken();
  });
}

async function downloadFile(fileId: string, accessToken: string): Promise<{ blob: Blob; previewUrl: string }> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`No se pudo descargar el archivo de Drive (${res.status}).`);
  }
  const blob = await res.blob();
  const previewUrl = URL.createObjectURL(blob);
  return { blob, previewUrl };
}

async function pickImages(): Promise<CloudPickedFile[]> {
  if (!isGoogleDriveConfigured()) {
    throw new Error(unconfiguredReason());
  }

  await loadGoogleScripts();
  await loadPickerLibrary();
  const accessToken = await getAccessToken();

  type PickedDoc = Record<string, unknown>;
  const selectedDocs = await new Promise<PickedDoc[]>((resolve, reject) => {
    try {
      const view = new window.google.picker.View(window.google.picker.ViewId.DOCS_IMAGES);
      const picker = new window.google.picker.PickerBuilder()
        .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
        .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
        .setDeveloperKey(apiKey())
        .setAppId(appId())
        .setOAuthToken(accessToken)
        .addView(view)
        .setCallback((data: { action: string; [key: string]: unknown }) => {
          if (data.action === window.google.picker.Action.PICKED) {
            resolve((data[window.google.picker.Response.DOCUMENTS] as PickedDoc[]) ?? []);
          } else if (data.action === window.google.picker.Action.CANCEL) {
            resolve([]);
          }
        })
        .build();
      picker.setVisible(true);
    } catch (err) {
      reject(err instanceof Error ? err : new Error("No se pudo abrir el selector de Google Drive."));
    }
  });

  const files: CloudPickedFile[] = [];
  for (const doc of selectedDocs) {
    const fileId = doc[window.google.picker.Document.ID] as string;
    const name = (doc[window.google.picker.Document.NAME] as string) || `drive-${fileId}.jpg`;
    const { blob, previewUrl } = await downloadFile(fileId, accessToken);
    files.push({ name, blob, previewUrl, sourceFileId: fileId });
  }
  return files;
}

/**
 * Re-sync manual (Fase F): re-pide consentimiento y vuelve a descargar
 * un archivo ya conocido por id, sin reabrir el picker — el fileId ya
 * está guardado en el vínculo (lib/driveLinks.ts) desde la importación
 * original.
 */
async function resyncFile(fileId: string): Promise<{ blob: Blob; previewUrl: string }> {
  await loadGoogleScripts();
  const accessToken = await getAccessToken();
  return downloadFile(fileId, accessToken);
}

export const googleDriveSource: CloudSource = {
  id: "google-drive",
  label: "Google Drive",
  isConfigured: isGoogleDriveConfigured,
  unconfiguredReason,
  pickImages,
  resyncFile,
};
