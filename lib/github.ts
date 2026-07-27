import "server-only";

const GITHUB_API = "https://api.github.com";

/**
 * El sitio se genera estático (Next build + Vercel): no hay filesystem
 * editable en producción, así que "guardar" cualquier cosa — el JSON de
 * un catálogo o una imagen subida — significa comitear al repo vía la
 * API de GitHub. Eso llega a la rama configurada y dispara el redeploy
 * normal de Vercel; no hay un paso extra de "publicar".
 */
function getGitHubConfig() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // formato "owner/repo"
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token || !repo) {
    throw new Error(
      "Falta configurar GITHUB_TOKEN y GITHUB_REPO en las variables de entorno para poder guardar cambios."
    );
  }

  return { token, repo, branch };
}

async function githubRequest(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API respondió ${res.status}: ${body}`);
  }

  return res.json();
}

export type CommitFileResult = { commitUrl: string };
/** `base64Content: null` borra ese path del repo en vez de crearlo/reemplazarlo. */
export type CommitFileInput = { path: string; base64Content: string | null };

/**
 * Comitea uno o más archivos (texto o binario) al repo en un solo
 * commit, vía la Git Data API (blobs -> un tree -> commit -> mover la
 * rama), no la API de "contenidos" simple — esa tiene un límite de 1MB
 * por archivo, y las fotos reales de este catálogo pesan 1.5-2.6MB. La
 * Git Data API no tiene ese techo, y sirve igual de bien para el JSON
 * (chico) de un catálogo, así que todo el proyecto comitea por este
 * único camino. Crear (o borrar) un catálogo toca 3 archivos a la vez
 * (su JSON, su loader .ts, y el registro actualizado) — de ahí que esto
 * acepte una lista en vez de un solo archivo: son varios blobs pero un
 * único tree/commit, así que nunca queda el repo a medio camino si algo
 * falla. `base64Content: null` en un archivo lo borra del repo en vez
 * de crearlo/reemplazarlo (así es como borrar un catálogo saca su JSON
 * y su loader del árbol en el mismo commit que regenera el registro).
 *
 * Nota: cada llamada mueve la rama a un commit nuevo basado en el HEAD
 * *en ese momento* — dos llamadas concurrentes podrían pisarse. Alcance
 * suficiente para un solo administrador editando de a un cambio por vez;
 * si hiciera falta more concurrencia, acá es donde se agregaría un
 * reintento con el ref actualizado.
 */
export async function commitFiles(
  files: CommitFileInput[],
  message: string
): Promise<CommitFileResult> {
  const { token, repo, branch } = getGitHubConfig();

  // 1. Un blob por archivo con contenido nuevo — los que se borran
  // (base64Content: null) no necesitan blob, van directo al tree con
  // sha: null, que es como la Git Data API marca "sacar este path".
  const toCreate = files.filter((f) => f.base64Content !== null);
  const blobs = await Promise.all(
    toCreate.map((file) =>
      githubRequest(`/repos/${repo}/git/blobs`, token, {
        method: "POST",
        body: JSON.stringify({ content: file.base64Content, encoding: "base64" }),
      })
    )
  );
  const blobShaByPath = new Map(toCreate.map((file, i) => [file.path, blobs[i].sha]));

  // 2. HEAD actual de la rama -> su commit -> el tree base sobre el que construir.
  const ref = await githubRequest(`/repos/${repo}/git/ref/heads/${branch}`, token);
  const baseCommitSha = ref.object.sha;
  const baseCommit = await githubRequest(`/repos/${repo}/git/commits/${baseCommitSha}`, token);
  const baseTreeSha = baseCommit.tree.sha;

  // 3. Tree nuevo: el base más estos archivos (agregados, reemplazados o borrados).
  const tree = await githubRequest(`/repos/${repo}/git/trees`, token, {
    method: "POST",
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: files.map((file) => ({
        path: file.path,
        mode: "100644",
        type: "blob",
        sha: file.base64Content === null ? null : blobShaByPath.get(file.path),
      })),
    }),
  });

  // 4. Commit apuntando al tree nuevo, con el HEAD anterior como padre.
  const commit = await githubRequest(`/repos/${repo}/git/commits`, token, {
    method: "POST",
    body: JSON.stringify({ message, tree: tree.sha, parents: [baseCommitSha] }),
  });

  // 5. Mover la rama al commit nuevo — esto es lo que dispara el deploy.
  await githubRequest(`/repos/${repo}/git/refs/heads/${branch}`, token, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha }),
  });

  return { commitUrl: commit.html_url };
}

/** Caso particular de {@link commitFiles} para un solo archivo. */
export async function commitFile(
  path: string,
  base64Content: string,
  message: string
): Promise<CommitFileResult> {
  return commitFiles([{ path, base64Content }], message);
}

/**
 * Lista los archivos `.json` directamente dentro de `dirPath` en el
 * HEAD *real* de la rama en GitHub — a propósito no la lista de ids que
 * ya tiene cargado el proceso corriendo (`Object.keys(catalogs)`), que
 * solo está tan fresca como el último deploy que terminó. Un crear y un
 * borrar casi simultáneos (dos commits reales, un solo proceso viejo
 * corriendo entre medio) hicieron exactamente eso una vez: el segundo
 * commit regeneró el registro a partir de datos ya obsoletos y terminó
 * apuntando a un catálogo que el primer commit ya había borrado,
 * rompiendo el build. Consultar GitHub antes de regenerar el registro
 * es lo que evita que se repita.
 */
export async function listRepoJsonFileIds(dirPath: string): Promise<string[]> {
  const { token, repo, branch } = getGitHubConfig();
  const items = await githubRequest(
    `/repos/${repo}/contents/${dirPath}?ref=${encodeURIComponent(branch)}`,
    token
  );
  return items
    .filter((item: { type: string; name: string }) => item.type === "file" && item.name.endsWith(".json"))
    .map((item: { name: string }) => item.name.replace(/\.json$/, ""));
}
