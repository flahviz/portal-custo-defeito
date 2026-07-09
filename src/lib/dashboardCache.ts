// Cache para dados das páginas de análise, persistidos no localStorage
// para exibição consolidada na Visão Geral.

export interface ISSCache {
  squadId: string;
  squadName: string;
  period: string;
  iss: number;
  dpd: number | null;
  deploys: number;
  totalDefects: number;
  totalCusto: number;
  releases: Array<{ base: string; maxRc: number }>;
  updatedAt: string;
}

export interface RecorrentesCache {
  squadId: string;
  squadName: string;
  months: number;
  totalDefects: number;
  clusters: { regressao: number; recorrencia: number; duplicata: number; similar: number };
  topFuncionalidades: Array<{ nome: string; count: number }>;
  topCausas?: Array<{ termo: string; count: number }>;
  updatedAt: string;
}

const KEY_ISS = 'radar_iss_cache';
const KEY_RECORRENTES = 'radar_recorrentes_cache';

function save<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}

export const issCache = {
  save: (data: ISSCache) => save(KEY_ISS, data),
  load: () => load<ISSCache>(KEY_ISS),
};

export const recorrentesCache = {
  save: (data: RecorrentesCache) => save(KEY_RECORRENTES, data),
  load: () => load<RecorrentesCache>(KEY_RECORRENTES),
};
