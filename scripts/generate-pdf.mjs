// Genera public/catalog-<id>.pdf "imprimiendo" el propio catálogo web
// con un navegador headless, en vez de reconstruir el diseño en una
// librería de PDF aparte — reutiliza el 100% de los componentes y
// estilos existentes (ver @media print en app/globals.css).
//
// Corre como último paso de `npm run build`: levanta un `next start`
// efímero contra el build recién generado, imprime, y lo apaga.
import { chromium } from "playwright";
import vercelChromium from "@sparticuz/chromium";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// Por ahora solo existe el catálogo "ariel" (ver data/catalogs/index.ts).
// El día que haya un segundo catálogo real, esto pasa a iterar sobre el
// registro en vez de tener un id hardcodeado acá.
const CATALOG_ID = "ariel";

const PORT = process.env.PDF_GEN_PORT || "4173";
const BASE_URL = `http://localhost:${PORT}`;
// "/" es el índice de catálogos, no un catálogo en sí — hay que imprimir
// la página del catálogo puntual.
const CATALOG_URL = `${BASE_URL}/catalog/${CATALOG_ID}`;
const OUTPUT_PATH = path.join(rootDir, "public", `catalog-${CATALOG_ID}.pdf`);

// Dimensiones fijas del "viewport" de impresión: proporción retrato
// 3:4, coherente con el diseño mobile-first del lookbook. Cada .page
// (100svh) se imprime como una página física de este tamaño.
const PAGE_WIDTH = "1080px";
const PAGE_HEIGHT = "1440px";

// El Chromium que baja `playwright install chromium` no arranca en el
// contenedor de build de Vercel: le faltan librerías del sistema
// (confirmado en un build real: "chrome-headless-shell: error while
// loading shared libraries: libnspr4.so"). @sparticuz/chromium empaqueta
// un binario compilado estáticamente justo para este tipo de entorno
// (Lambda/Vercel), así que en Vercel lanzamos ese binario en vez del que
// Playwright descargó; en cualquier otro lado (local, otro CI) seguimos
// usando el Chromium propio de Playwright, que sí corre normalmente.
async function launchBrowser() {
  if (!process.env.VERCEL) {
    return chromium.launch();
  }
  return chromium.launch({
    args: vercelChromium.args,
    executablePath: await vercelChromium.executablePath(),
    headless: true,
  });
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // todavía no está arriba
    }
    await sleep(500);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  console.log(`[generate-pdf] starting next start on port ${PORT}...`);
  const server = spawn("npx", ["next", "start", "-p", PORT], {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
  });

  let browser;
  try {
    await waitForServer(BASE_URL);
    console.log("[generate-pdf] server ready, launching headless browser...");

    browser = await launchBrowser();
    const viewportWidth = parseInt(PAGE_WIDTH, 10);
    const viewportHeight = parseInt(PAGE_HEIGHT, 10);
    const page = await browser.newPage({ viewport: { width: viewportWidth, height: viewportHeight } });
    await page.goto(CATALOG_URL, { waitUntil: "networkidle" });

    // El catálogo usa IntersectionObserver (RevealOnScroll) y lazy
    // loading nativo de next/image: ambos solo se disparan cuando el
    // contenido realmente entra en el viewport durante un scroll.
    // page.pdf() no hace scroll de verdad, así que sin este paso todo
    // lo que está debajo del primer tramo queda invisible o sin
    // cargar en el PDF (la portada se salva porque fuerza su propio
    // "visible" de entrada; el resto no).
    console.log("[generate-pdf] scrolling through the page to trigger lazy content...");
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < scrollHeight; y += viewportHeight) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForLoadState("networkidle");
      await sleep(200); // margen para que corra la transición de RevealOnScroll
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(200);

    await page.emulateMedia({ media: "print" });

    await page.pdf({
      path: OUTPUT_PATH,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    console.log(`[generate-pdf] wrote ${path.relative(rootDir, OUTPUT_PATH)}`);
  } finally {
    if (browser) await browser.close();
    server.kill("SIGTERM");
  }
}

main().catch((err) => {
  // Falla "suave" a propósito: generar el PDF depende de poder lanzar un
  // Chromium headless dentro del contenedor de build, algo menos
  // garantizado que el build de Next en sí (por ej. si al entorno de
  // build le faltara alguna librería del sistema que Chromium necesita).
  // Que ese paso falle no debería bloquear publicar un cambio de
  // contenido del catálogo — el PDF queda desactualizado hasta el
  // próximo build exitoso, pero el sitio sí se despliega.
  console.error("[generate-pdf] no se pudo generar el PDF, se continúa sin bloquear el deploy:", err);
  process.exit(0);
});
