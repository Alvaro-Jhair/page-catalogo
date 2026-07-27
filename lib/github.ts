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

/**
 * Comitea un archivo (texto o binario) al repo vía la Git Data API
 * (blob -> tree -> commit -> mover la rama), no la API de "contenidos"
 * simple — esa tiene un límite de 1MB por archivo, y las fotos reales
 * de este catálogo pesan 1.5-2.6MB. La Git Data API no tiene ese techo,
 * y sirve igual de bien para el JSON (chico) de un catálogo, así que
 * todo el proyecto comitea por este único camino.
 *
 * Nota: cada llamada mueve la rama a un commit nuevo basado en el HEAD
 * *en ese momento* — dos llamadas concurrentes podrían pisarse. Alcance
 * suficiente para un solo administrador editando de a un cambio por vez;
 * si hiciera falta more concurrencia, acá es donde se agregaría un
 * reintento con el ref actualizado.
 */
export async function commitFile(
  path: string,
  base64Content: string,
  message: string
): Promise<CommitFileResult> {
  const { token, repo, branch } = getGitHubConfig();

  // 1. Blob con el contenido nuevo.
  const blob = await githubRequest(`/repos/${repo}/git/blobs`, token, {
    method: "POST",
    body: JSON.stringify({ content: base64Content, encoding: "base64" }),
  });

  // 2. HEAD actual de la rama -> su commit -> el tree base sobre el que construir.
  const ref = await githubRequest(`/repos/${repo}/git/ref/heads/${branch}`, token);
  const baseCommitSha = ref.object.sha;
  const baseCommit = await githubRequest(`/repos/${repo}/git/commits/${baseCommitSha}`, token);
  const baseTreeSha = baseCommit.tree.sha;

  // 3. Tree nuevo: el base más este archivo (agregado o reemplazado).
  const tree = await githubRequest(`/repos/${repo}/git/trees`, token, {
    method: "POST",
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: [{ path, mode: "100644", type: "blob", sha: blob.sha }],
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
