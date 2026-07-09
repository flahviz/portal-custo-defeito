export interface SquadDeveloper {
  email: string;
  level: string;
  category: string;
}

export interface SquadDef {
  id: string;
  name: string;
  teamArea: string;
  horasMediaPorDefeito: number;
  developers: SquadDeveloper[];
}

export interface JobRole {
  id: string;
  name: string;
  level: string;
  category: string;
  custoHora: number;
}

export interface SquadsConfig {
  squads: SquadDef[];
  jobRoles: JobRole[];
  workSettings: { horasPorDia: number; diasPorMes: number };
}

export interface DevDefectResult {
  email: string;
  userId: string;
  count: number;
  items: Array<{ id: string; created: string; resolutionDate?: string; type: string; versaoOrigem?: string }>;
}

export interface DefectsResponse {
  squad: string;
  squadName: string;
  startDate: string;
  endDate: string;
  developers: DevDefectResult[];
}

const IS_DEV = import.meta.env.DEV;

const SQUAD_CONFIG_STORAGE_KEY = 'radar_squad_config';

export function saveSquadConfigToStorage(config: SquadsConfig): void {
  try {
    localStorage.setItem(SQUAD_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // localStorage indisponível
  }
}

export function loadSquadConfigFromStorage(): SquadsConfig | null {
  try {
    const raw = localStorage.getItem(SQUAD_CONFIG_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SquadsConfig) : null;
  } catch {
    return null;
  }
}

export function clearSquadConfigFromStorage(): void {
  try {
    localStorage.removeItem(SQUAD_CONFIG_STORAGE_KEY);
  } catch {
    // noop
  }
}

export async function loadSquadConfig(): Promise<SquadsConfig | null> {
  // Em dev: tenta o arquivo primeiro, depois localStorage como fallback
  // Em prod: usa apenas localStorage
  if (IS_DEV) {
    try {
      const res = await fetch('/api/rtc/squads');
      if (res.ok) {
        const config: SquadsConfig = await res.json();
        // Sincroniza localStorage com o arquivo (fonte de verdade em dev)
        saveSquadConfigToStorage(config);
        return config;
      }
    } catch {
      // falhou, cai no localStorage
    }
  }
  return loadSquadConfigFromStorage();
}

export async function fetchRtcDefects(
  squadId: string,
  startDate: Date,
  endDate: Date,
): Promise<DefectsResponse | null> {
  if (!IS_DEV) return null;
  try {
    const params = new URLSearchParams({
      squadId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    const res = await fetch(`/api/rtc/defects?${params}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error ?? res.statusText);
    }
    return res.json();
  } catch (e) {
    throw e;
  }
}

export function findCustoHora(dev: { level: string; category: string }, jobRoles: JobRole[]): number {
  const role = jobRoles.find((r) => r.level === dev.level && r.category === dev.category);
  return role?.custoHora ?? 48.30;
}

export interface RecorrentesResponse {
  squad: string;
  squadName: string;
  months: number;
  startDate: string;
  total: number;
  items: Array<{
    id: string;
    title: string;
    created: string;
    resolutionDate?: string;
    type: string;
    versaoOrigem?: string;
    causa: string;
    solucao: string;
    funcionalidade: string;
  }>;
}

export async function fetchRtcRecorrentes(
  squadId: string,
  months: number,
): Promise<RecorrentesResponse | null> {
  if (!IS_DEV) return null;
  try {
    const params = new URLSearchParams({ squadId, months: String(months) });
    const res = await fetch(`/api/rtc/recorrentes?${params}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error ?? res.statusText);
    }
    return res.json();
  } catch (e) {
    throw e;
  }
}
