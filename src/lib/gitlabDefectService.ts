const GITLAB_PROJECT = 'softplan%2Fjustica%2Fprocuradorias%2Fsaj-procuradorias%2Fpge-net';
const IGNORE_EXTS = ['.dproj', '.dof', '.cfg', '.res', '.dcpil', '.dcu', '.exe', '.bpl', '.dcp', '.map', '.lockb', '.lock', '.json', '.xml', '.md', '.txt', '.png', '.jpg', '.svg', '.gif'];

export interface MRInfo {
  iid: number;
  title: string;
  webUrl: string;
  mergedAt: string;
  changedFiles: string[];
  diffsContext: string;
}

export interface TestFileInfo {
  path: string;
  content: string;
  testsCount: number;
}

async function glFetch(path: string, token: string): Promise<Response> {
  return fetch(`https://gitlab.com${path}`, {
    headers: { 'PRIVATE-TOKEN': token, 'Accept': 'application/json' },
  });
}

type GLMr = { iid: number; title: string; web_url: string; merged_at: string; source_branch: string };

function toMRInfo(m: GLMr): MRInfo {
  return { iid: m.iid, title: m.title, webUrl: m.web_url, mergedAt: m.merged_at, changedFiles: [], diffsContext: '' };
}

export async function findMRForDefect(cardId: string, token: string): Promise<MRInfo | null> {
  // Estratégia 1 — busca por título (D839568 no título do MR)
  const byTitle = await glFetch(
    `/api/v4/projects/${GITLAB_PROJECT}/merge_requests?search=D${cardId}&state=merged&per_page=20&order_by=updated_at`,
    token,
  );
  if (byTitle.ok) {
    const mrs = (await byTitle.json()) as GLMr[];
    const RE = new RegExp(`D0*${cardId}[\\s\\-–:./]`, 'i');
    const matched = mrs.find(m => RE.test(m.title) || RE.test(m.source_branch))
      ?? mrs.find(m => m.title.includes(`D${cardId}`) || m.source_branch.includes(`D${cardId}`));
    if (matched) return toMRInfo(matched);
  }

  // Estratégia 2 — busca por nome de branch (hotfix/D839568, fix/D839568, bugfix/D839568, etc.)
  const branchPrefixes = ['hotfix', 'fix', 'bugfix', 'feature', 'feat'];
  for (const prefix of branchPrefixes) {
    const byBranch = await glFetch(
      `/api/v4/projects/${GITLAB_PROJECT}/merge_requests?source_branch=${encodeURIComponent(`${prefix}/D${cardId}`)}&state=merged&per_page=5`,
      token,
    );
    if (byBranch.ok) {
      const mrs = (await byBranch.json()) as GLMr[];
      if (mrs.length > 0) return toMRInfo(mrs[0]);
    }
  }

  // Estratégia 3 — branch sem prefixo (D839568 direto)
  const byBranchDirect = await glFetch(
    `/api/v4/projects/${GITLAB_PROJECT}/merge_requests?source_branch=${encodeURIComponent(`D${cardId}`)}&state=merged&per_page=5`,
    token,
  );
  if (byBranchDirect.ok) {
    const mrs = (await byBranchDirect.json()) as GLMr[];
    if (mrs.length > 0) return toMRInfo(mrs[0]);
  }

  return null;
}

export async function getMRChanges(mrIid: number, token: string): Promise<{ changedFiles: string[]; diffsContext: string }> {
  const resp = await glFetch(
    `/api/v4/projects/${GITLAB_PROJECT}/merge_requests/${mrIid}/diffs?per_page=30`,
    token,
  );
  if (!resp.ok) return { changedFiles: [], diffsContext: '' };

  const diffs = (await resp.json()) as Array<{ new_path: string; diff: string; deleted_file: boolean }>;
  const relevant = diffs.filter(d => !d.deleted_file && !IGNORE_EXTS.some(ext => d.new_path.endsWith(ext)));

  const changedFiles = relevant.map(d => d.new_path);
  const diffsContext = relevant
    .slice(0, 6)
    .map(d => `--- ${d.new_path} ---\n${d.diff.slice(0, 1500)}`)
    .join('\n\n');

  return { changedFiles, diffsContext };
}

export async function findTestFiles(changedFiles: string[], token: string): Promise<TestFileInfo[]> {
  const found: TestFileInfo[] = [];

  const readFile = async (path: string, ref = 'master') => {
    if (found.some(x => x.path === path) || found.length >= 4) return;
    const r = await glFetch(
      `/api/v4/projects/${GITLAB_PROJECT}/repository/files/${encodeURIComponent(path)}/raw?ref=${ref}`,
      token,
    );
    if (!r.ok) return;
    const content = await r.text();
    found.push({
      path,
      content: content.slice(0, 4000),
      testsCount: (content.match(/\bprocedure\s+Test/gi) ?? []).length,
    });
  };

  // Estratégia 1: listar a mesma pasta dos arquivos alterados
  const dirs = [...new Set(changedFiles.map(f => f.includes('/') ? f.split('/').slice(0, -1).join('/') : ''))];
  for (const dir of dirs.slice(0, 4)) {
    if (found.length >= 4) break;
    const r = await glFetch(
      `/api/v4/projects/${GITLAB_PROJECT}/repository/tree?path=${encodeURIComponent(dir)}&per_page=100`,
      token,
    );
    if (!r.ok) continue;
    const files = (await r.json()) as Array<{ name: string; path: string; type: string }>;
    const candidates = files.filter(f =>
      f.type === 'blob' &&
      f.name.endsWith('.pas') &&
      (f.name.toLowerCase().includes('test') || f.name.toLowerCase().includes('spec')),
    );
    for (const tf of candidates.slice(0, 2)) await readFile(tf.path);
  }

  // Estratégia 2: buscar pelo nome base do arquivo alterado
  if (found.length === 0) {
    for (const file of changedFiles.slice(0, 3)) {
      if (found.length >= 3) break;
      const base = file.split('/').pop()?.replace('.pas', '') ?? '';
      if (base.length < 4) continue;
      const r = await glFetch(
        `/api/v4/projects/${GITLAB_PROJECT}/search?scope=blobs&search=${encodeURIComponent(base + 'Test')}&per_page=5`,
        token,
      );
      if (!r.ok) continue;
      const results = (await r.json()) as Array<{ filename: string; path: string; ref: string }>;
      for (const rf of results.filter(x => x.filename.endsWith('.pas')).slice(0, 2)) {
        await readFile(rf.path, rf.ref);
      }
    }
  }

  return found;
}
