import { fetchRtcRecorrentes } from './rtcService';

export interface DefeitoInsight {
  id: string;
  title: string;
  created: string;
  resolutionDate?: string;
  versaoOrigem?: string;
  funcionalidade: string;
  causa: string;
}

export interface FuncionalidadeHeat {
  funcionalidade: string;
  total: number;
  resolvidos: number;
  abertos: number;
  mttrDias: number | null;
}

export interface MttrBySeveridade {
  label: string;
  mediaDias: number;
  total: number;
}

export interface InsightsData {
  squadId: string;
  squadName: string;
  months: number;
  totalDefects: number;
  mapaCalor: FuncionalidadeHeat[];
  mttrGeral: number | null;
  mttrPorFuncionalidade: { funcionalidade: string; mediaDias: number; total: number }[];
  tendenciaMensal: { mes: string; total: number; resolvidos: number }[];
  startDate: string;
}

function parseDias(created: string, resolution: string | undefined): number | null {
  if (!resolution) return null;
  const diff = new Date(resolution).getTime() - new Date(created).getTime();
  if (isNaN(diff) || diff < 0) return null;
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export async function fetchInsightsData(squadId: string, months: number): Promise<InsightsData | null> {
  const res = await fetchRtcRecorrentes(squadId, months);
  if (!res) return null;

  const items = res.items as DefeitoInsight[];

  // Mapa de calor por funcionalidade
  const funcMap = new Map<string, { total: number; resolvidos: number; diasList: number[] }>();
  for (const d of items) {
    const key = d.funcionalidade || "(sem funcionalidade)";
    const entry = funcMap.get(key) ?? { total: 0, resolvidos: 0, diasList: [] };
    entry.total++;
    const dias = parseDias(d.created, d.resolutionDate);
    if (dias !== null) { entry.resolvidos++; entry.diasList.push(dias); }
    funcMap.set(key, entry);
  }
  const mapaCalor: FuncionalidadeHeat[] = Array.from(funcMap.entries())
    .map(([funcionalidade, e]) => ({
      funcionalidade,
      total: e.total,
      resolvidos: e.resolvidos,
      abertos: e.total - e.resolvidos,
      mttrDias: e.diasList.length ? Math.round(e.diasList.reduce((a, b) => a + b, 0) / e.diasList.length) : null,
    }))
    .sort((a, b) => b.total - a.total);

  // MTTR geral
  const todosDias = items
    .map(d => parseDias(d.created, d.resolutionDate))
    .filter((d): d is number => d !== null);
  const mttrGeral = todosDias.length
    ? Math.round(todosDias.reduce((a, b) => a + b, 0) / todosDias.length)
    : null;

  // MTTR por funcionalidade (top 8)
  const mttrPorFuncionalidade = mapaCalor
    .filter(f => f.mttrDias !== null && f.resolvidos >= 2)
    .slice(0, 8)
    .map(f => ({ funcionalidade: f.funcionalidade, mediaDias: f.mttrDias!, total: f.resolvidos }));

  // Tendência mensal
  const mesMap = new Map<string, { total: number; resolvidos: number }>();
  for (const d of items) {
    const key = d.created.slice(0, 7); // "YYYY-MM"
    const entry = mesMap.get(key) ?? { total: 0, resolvidos: 0 };
    entry.total++;
    if (d.resolutionDate) entry.resolvidos++;
    mesMap.set(key, entry);
  }
  const tendenciaMensal = Array.from(mesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, e]) => ({ mes, ...e }));

  return {
    squadId: res.squadId ?? squadId,
    squadName: res.squadName,
    months,
    totalDefects: res.total,
    mapaCalor,
    mttrGeral,
    mttrPorFuncionalidade,
    tendenciaMensal,
    startDate: res.startDate,
  };
}
