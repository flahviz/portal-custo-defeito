export interface TagInfo {
  name: string;
  base: string;
  rc: number;
  createdAt: Date;
}

export interface ReleaseInfo {
  base: string;
  maxRc: number;
  shippedTag: string;
  createdAt: Date;
}

export interface IssDefect {
  id: string;
  descricao: string;
  horasPorCargo: { roleId: string; roleName: string; roleLevel: string; hours: number; custoHora: number }[];
  custoTecnico: number;
}

export function parseTag(tagName: string): { base: string; rc: number } | null {
  const match = tagName.match(/^(\d+\.\d+\.\d+-\d+)-RC(\d+)$/);
  if (!match) return null;
  return { base: match[1], rc: parseInt(match[2]) };
}

export function groupTagsByBase(tags: { name: string; createdAt: Date }[]): ReleaseInfo[] {
  const map = new Map<string, ReleaseInfo>();
  for (const tag of tags) {
    const parsed = parseTag(tag.name);
    if (!parsed) continue;
    const existing = map.get(parsed.base);
    if (!existing || parsed.rc > existing.maxRc) {
      map.set(parsed.base, {
        base: parsed.base,
        maxRc: parsed.rc,
        shippedTag: tag.name,
        createdAt: tag.createdAt,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function filterByPeriod(releases: ReleaseInfo[], year: number, month: number): ReleaseInfo[] {
  return releases.filter(r => {
    return r.createdAt.getFullYear() === year && r.createdAt.getMonth() === month;
  });
}

export function filterByDateRange(releases: ReleaseInfo[], startDate: Date, endDate: Date): ReleaseInfo[] {
  return releases.filter(r => r.createdAt >= startDate && r.createdAt < endDate);
}

export function calculateISS(deploys: number, custoSquad: number, custoMedioEmpresa: number): number {
  if (deploys === 0 && custoSquad === 0) return 0;
  if (custoMedioEmpresa === 0 || custoSquad === 0) return 1;
  return deploys / (deploys + custoSquad / custoMedioEmpresa);
}

export function getISSStatus(iss: number): 'saudavel' | 'atencao' | 'critico' {
  if (iss >= 0.85) return 'saudavel';
  if (iss >= 0.6) return 'atencao';
  return 'critico';
}

export async function fetchGitLabTags(
  projectPath: string,
  token: string
): Promise<{ name: string; createdAt: Date }[]> {
  const encoded = encodeURIComponent(projectPath);
  const headers = { 'PRIVATE-TOKEN': token };
  const allTags: { name: string; createdAt: Date }[] = [];
  let page = 1;

  while (true) {
    const url = `https://gitlab.com/api/v4/projects/${encoded}/repository/tags?per_page=100&order_by=version&sort=desc&page=${page}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`GitLab API: ${res.status} ${res.statusText}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;

    for (const t of data as { name: string; commit: { created_at: string } }[]) {
      allTags.push({ name: t.name, createdAt: new Date(t.commit.created_at) });
    }

    const nextPage = res.headers.get('X-Next-Page');
    if (!nextPage) break;
    page = parseInt(nextPage);
  }

  return allTags;
}
