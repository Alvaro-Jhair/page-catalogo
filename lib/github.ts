import "server-only";

const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";

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

  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    throw new Error(`GITHUB_REPO tiene que tener el formato "owner/repo" (valor actual: "${repo}").`);
  }

  return { token, repo, owner, name, branch };
}

type GraphQLResponse<T> = { data?: T; errors?: { message: string }[] };

/**
 * Un solo punto de entrada a la API GraphQL de GitHub (v4), que
 * reemplaza la Git Data API (blob -> tree -> commit -> mover ref, 4
 * llamadas REST encadenadas) por una única mutación (`createCommitOnBranch`,
 * ver más abajo) y una única query para leer el estado que hace falta
 * antes de comitear. Perf (fase de optimización, 2026-07-28): la Git
 * Data API tomaba 6-7 round-trips secuenciales por operación; esto lo
 * baja a 1-2.
 */
async function githubGraphQL<T>(query: string, variables: Record<string, unknown>, token: string): Promise<T> {
  const res = await fetch(GITHUB_GRAPHQL_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub GraphQL API respondió ${res.status}: ${body}`);
  }

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new Error(`GitHub GraphQL API devolvió errores: ${json.errors.map((e) => e.message).join("; ")}`);
  }
  if (!json.data) {
    throw new Error("GitHub GraphQL API no devolvió datos.");
  }
  return json.data;
}

const HEAD_OID_QUERY = `
  query($owner: String!, $name: String!, $qualifiedRef: String!) {
    repository(owner: $owner, name: $name) {
      ref(qualifiedName: $qualifiedRef) {
        target { oid }
      }
    }
  }
`;

async function getHeadOid(owner: string, name: string, branch: string, token: string): Promise<string> {
  const data = await githubGraphQL<{
    repository: { ref: { target: { oid: string } } | null } | null;
  }>(HEAD_OID_QUERY, { owner, name, qualifiedRef: `refs/heads/${branch}` }, token);

  const oid = data.repository?.ref?.target.oid;
  if (!oid) {
    throw new Error(`No se encontró la rama "${branch}" en el repo.`);
  }
  return oid;
}

const CREATE_COMMIT_MUTATION = `
  mutation($input: CreateCommitOnBranchInput!) {
    createCommitOnBranch(input: $input) {
      commit { url oid }
    }
  }
`;

export type CommitFileResult = { commitUrl: string; headOid: string };
/** `base64Content: null` borra ese path del repo en vez de crearlo/reemplazarlo. */
export type CommitFileInput = { path: string; base64Content: string | null };

/**
 * Comitea uno o más archivos (texto o binario) al repo en un solo
 * commit, vía la mutación GraphQL `createCommitOnBranch` — hace en una
 * sola llamada lo que la Git Data API necesitaba 4 (blob, tree, commit,
 * mover el ref), y firma el commit automáticamente. `expectedHeadOid`
 * (opcional) evita una query extra cuando el llamador ya lo tiene a
 * mano (ver `listRepoJsonFileIds`, que lo trae junto con el listado que
 * ya necesita pedir); si no se pasa, se pide acá mismo. GitHub rechaza
 * la mutación si `expectedHeadOid` quedó desactualizado — la misma
 * protección contra condiciones de carrera que antes se hacía a mano
 * releyendo el ref, ahora la garantiza el servidor.
 *
 * Crear (o borrar) un catálogo toca 3 archivos a la vez (su JSON, su
 * loader .ts, y el registro actualizado) — de ahí que esto acepte una
 * lista en vez de un solo archivo: quedan en un único commit, así que
 * nunca queda el repo a medio camino si algo falla.
 */
export async function commitFiles(
  files: CommitFileInput[],
  message: string,
  opts?: { expectedHeadOid?: string }
): Promise<CommitFileResult> {
  const { token, repo, owner, name, branch } = getGitHubConfig();

  const expectedHeadOid = opts?.expectedHeadOid ?? (await getHeadOid(owner, name, branch, token));

  const additions = files
    .filter((f): f is { path: string; base64Content: string } => f.base64Content !== null)
    .map((f) => ({ path: f.path, contents: f.base64Content }));
  const deletions = files.filter((f) => f.base64Content === null).map((f) => ({ path: f.path }));

  const fileChanges: { additions?: typeof additions; deletions?: typeof deletions } = {};
  if (additions.length) fileChanges.additions = additions;
  if (deletions.length) fileChanges.deletions = deletions;

  const data = await githubGraphQL<{ createCommitOnBranch: { commit: { url: string; oid: string } } }>(
    CREATE_COMMIT_MUTATION,
    {
      input: {
        branch: { repositoryNameWithOwner: repo, branchName: branch },
        message: { headline: message },
        fileChanges,
        expectedHeadOid,
      },
    },
    token
  );

  return { commitUrl: data.createCommitOnBranch.commit.url, headOid: data.createCommitOnBranch.commit.oid };
}

/** Caso particular de {@link commitFiles} para un solo archivo. */
export async function commitFile(
  path: string,
  base64Content: string,
  message: string
): Promise<CommitFileResult> {
  return commitFiles([{ path, base64Content }], message);
}

export type RepoDirState = { ids: string[]; headOid: string };

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
 *
 * Devuelve también `headOid` (mismo `oid` que usaría una query aparte
 * para pedirlo) — así `createCatalog`/`deleteCatalog` pueden pasárselo
 * directo a `commitFiles({ expectedHeadOid })` en vez de que la
 * mutación tenga que volver a pedirlo: 1 query acá + 1 mutación allá,
 * no 2 queries + 1 mutación.
 */
export async function listRepoJsonFileIds(dirPath: string): Promise<RepoDirState> {
  const { token, owner, name, branch } = getGitHubConfig();

  const data = await githubGraphQL<{
    repository: {
      ref: { target: { oid: string } } | null;
      object: { entries: { name: string; type: string }[] } | null;
    } | null;
  }>(
    `query($owner: String!, $name: String!, $qualifiedRef: String!, $expr: String!) {
      repository(owner: $owner, name: $name) {
        ref(qualifiedName: $qualifiedRef) { target { oid } }
        object(expression: $expr) {
          ... on Tree { entries { name type } }
        }
      }
    }`,
    { owner, name, qualifiedRef: `refs/heads/${branch}`, expr: `${branch}:${dirPath}` },
    token
  );

  const oid = data.repository?.ref?.target.oid;
  if (!oid) {
    throw new Error(`No se encontró la rama "${branch}" en el repo.`);
  }

  const entries = data.repository?.object?.entries ?? [];
  const ids = entries
    .filter((item) => item.type === "blob" && item.name.endsWith(".json"))
    .map((item) => item.name.replace(/\.json$/, ""));

  return { ids, headOid: oid };
}
