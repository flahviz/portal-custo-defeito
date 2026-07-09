import { useState, useEffect, useMemo, useRef } from 'react';
import { issCache } from '@/lib/dashboardCache';
import {
  Activity, GitBranch, RefreshCw, AlertCircle, ChevronDown, ChevronUp,
  Database, Users, Info, HelpCircle, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/defectCalculations';
import {
  fetchGitLabTags,
  groupTagsByBase,
  filterByDateRange,
  ReleaseInfo,
} from '@/lib/issCalculations';
import RelatorioDialog from '@/components/RelatorioDialog';
import {
  loadSquadConfig,
  fetchRtcDefects,
  findCustoHora,
  SquadsConfig,
  DefectsResponse,
} from '@/lib/rtcService';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const GITLAB_PROJECT = 'softplan/justica/procuradorias/saj-procuradorias/pge-net';

// ─── DPD Display ─────────────────────────────────────────────────────────────

function getDPDStatus(ratio: number): 'elite' | 'atencao' | 'critico' {
  if (ratio < 1) return 'elite';
  if (ratio <= 3) return 'atencao';
  return 'critico';
}

function DPDDisplay({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center justify-center rounded-full border-8 border-muted" style={{ width: 120, height: 120 }}>
          <p className="text-2xl font-bold text-muted-foreground">—</p>
        </div>
        <p className="text-xs text-muted-foreground">Sem dados de deploy</p>
      </div>
    );
  }
  const status = getDPDStatus(value);
  const color = status === 'elite' ? '#22c55e' : status === 'atencao' ? '#f59e0b' : '#ef4444';
  const label = status === 'elite' ? 'Elite' : status === 'atencao' ? 'Atenção' : 'Crítico';
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative flex items-center justify-center rounded-full border-8"
        style={{ width: 120, height: 120, borderColor: color }}
      >
        <div className="text-center">
          <p className="text-3xl font-bold" style={{ color }}>{value.toFixed(1)}</p>
          <p className="text-[10px] text-muted-foreground">def/deploy</p>
        </div>
      </div>
      <Badge variant="outline" className="text-xs px-2 py-0.5 font-semibold" style={{ borderColor: color, color }}>
        {label}
      </Badge>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateRange(startYear: number, startMonth: number, endYear: number, endMonth: number) {
  const startDate = new Date(startYear, startMonth, 1);
  const endDate = new Date(endYear, endMonth + 1, 1); // first day of month after end
  return { startDate, endDate };
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IssSquad() {
  const now = new Date();

  // Squad config (loaded from /api/rtc/squads — only in dev mode)
  const [squadConfig, setSquadConfig] = useState<SquadsConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // Selected squad
  const [selectedSquadId, setSelectedSquadId] = useState('');

  // Period
  const [startMonth, setStartMonth] = useState(0);          // Janeiro
  const [startYear, setStartYear] = useState(now.getFullYear());
  const [endMonth, setEndMonth] = useState(now.getMonth());
  const [endYear, setEndYear] = useState(now.getFullYear());

  // RTC defect counts per developer (editable)
  const [defectCounts, setDefectCounts] = useState<Record<string, number>>({});
  const [rtcFetching, setRtcFetching] = useState(false);
  const [rtcError, setRtcError] = useState<string | null>(null);
  const [rtcResult, setRtcResult] = useState<DefectsResponse | null>(null);
  const [expandedDev, setExpandedDev] = useState<string | null>(null);

  // GitLab
  const [gitlabToken, setGitlabToken] = useState('');
  const [showGitlabConfig, setShowGitlabConfig] = useState(false);
  const [allReleases, setAllReleases] = useState<ReleaseInfo[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [manualDeploys, setManualDeploys] = useState('');

  // Load squad config on mount
  useEffect(() => {
    loadSquadConfig().then((cfg) => {
      setSquadConfig(cfg);
      if (cfg?.squads?.length) {
        setSelectedSquadId(cfg.squads[0].id);
      }
    }).finally(() => setConfigLoading(false));
  }, []);

  // When squad changes, reset defect counts and expanded row
  useEffect(() => {
    setDefectCounts({});
    setRtcResult(null);
    setRtcError(null);
    setExpandedDev(null);
  }, [selectedSquadId]);

  const selectedSquad = useMemo(
    () => squadConfig?.squads.find((s) => s.id === selectedSquadId) ?? null,
    [squadConfig, selectedSquadId]
  );

  const { startDate, endDate } = useMemo(
    () => getDateRange(startYear, startMonth, endYear, endMonth),
    [startYear, startMonth, endYear, endMonth]
  );

  const periodReleases = useMemo(
    () => filterByDateRange(allReleases, startDate, endDate),
    [allReleases, startDate, endDate]
  );

  const deploys = manualDeploys !== '' ? parseInt(manualDeploys) || 0 : periodReleases.length;

  // Compute cost per developer from counts
  const devRows = useMemo(() => {
    if (!selectedSquad || !squadConfig) return [];
    return selectedSquad.developers.map((dev) => {
      const custoHora = findCustoHora(dev, squadConfig.jobRoles);
      const count = defectCounts[dev.email] ?? 0;
      const custo = count * (selectedSquad.horasMediaPorDefeito ?? 8) * custoHora;
      return { email: dev.email, userId: dev.email.split('@')[0], level: dev.level, custoHora, count, custo };
    });
  }, [selectedSquad, squadConfig, defectCounts]);

  const totalCount = devRows.reduce((s, r) => s + r.count, 0);
  const totalCusto = devRows.reduce((s, r) => s + r.custo, 0);
  const custoMedio = totalCount > 0 ? totalCusto / totalCount : 0;

  const defeitosPorDeploy = deploys > 0 ? totalCount / deploys : null;

  // periodLabel precisa ser definido ANTES do useEffect que o usa
  const periodLabel = `${MONTHS[startMonth]}/${startYear} → ${MONTHS[endMonth]}/${endYear}`;

  // Salva resultado no cache da Visão Geral sempre que os dados mudam
  const prevCacheKey = useRef('');
  useEffect(() => {
    if (!selectedSquad || totalCount === 0) return;
    const key = `${selectedSquad.id}-${periodLabel}-${deploys}-${totalCount}`;
    if (key === prevCacheKey.current) return;
    prevCacheKey.current = key;
    issCache.save({
      squadId: selectedSquad.id,
      squadName: selectedSquad.name,
      period: periodLabel,
      iss: deploys > 0 ? deploys / (deploys + (totalCusto / (custoMedio || 1))) : 0,
      dpd: defeitosPorDeploy,
      deploys,
      totalDefects: totalCount,
      totalCusto,
      releases: allReleases.slice(0, 20).map((r) => ({ base: r.base, maxRc: r.maxRc })),
      updatedAt: new Date().toISOString(),
    });
  }, [selectedSquad, totalCount, totalCusto, custoMedio, deploys, defeitosPorDeploy, periodLabel, allReleases]);

  const [showExplanation, setShowExplanation] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const allItems = rtcResult?.developers.flatMap((d) => d.items) ?? [];

  const years = [now.getFullYear() - 1, now.getFullYear()];
  const isDevMode = import.meta.env.DEV;

  async function handleFetchRtc() {
    if (!selectedSquadId) return;
    setRtcFetching(true);
    setRtcError(null);
    setRtcResult(null);
    try {
      const result = await fetchRtcDefects(selectedSquadId, startDate, endDate);
      if (!result) throw new Error('Servidor proxy RTC não disponível. Execute em modo de desenvolvimento.');
      setRtcResult(result);
      // Populate editable counts
      const counts: Record<string, number> = {};
      for (const dev of result.developers) {
        counts[dev.email] = dev.count;
      }
      setDefectCounts(counts);
    } catch (e: unknown) {
      setRtcError(e instanceof Error ? e.message : 'Erro ao buscar defeitos do RTC.');
    } finally {
      setRtcFetching(false);
    }
  }

  async function handleFetchTags() {
    if (!gitlabToken) { setTagsError('Informe o token do GitLab.'); return; }
    setTagsLoading(true);
    setTagsError(null);
    try {
      const tags = await fetchGitLabTags(GITLAB_PROJECT, gitlabToken);
      setAllReleases(groupTagsByBase(tags));
    } catch (e: unknown) {
      setTagsError(e instanceof Error ? e.message : 'Erro ao buscar tags do GitLab.');
    } finally {
      setTagsLoading(false);
    }
  }

  function updateCount(email: string, value: string) {
    const n = parseInt(value);
    setDefectCounts((prev) => ({ ...prev, [email]: isNaN(n) || n < 0 ? 0 : n }));
  }

  const endDateDisplay = `${String(lastDayOfMonth(endYear, endMonth)).padStart(2, '0')}/${String(endMonth + 1).padStart(2, '0')}/${endYear}`;
  const startDateDisplay = `01/${String(startMonth + 1).padStart(2, '0')}/${startYear}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Activity className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Índice de Saúde por Squad (ISS)</h1>
          <p className="text-sm text-muted-foreground">
            Cruza velocidade de entrega (releases) com custo de defeitos para medir a saúde do squad
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">

          {/* Squad & Period */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Squad e Período
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Squad selector */}
              <div className="space-y-1">
                <Label>Squad</Label>
                {configLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando configuração...</p>
                ) : squadConfig ? (
                  <Select value={selectedSquadId} onValueChange={setSelectedSquadId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o squad..." />
                    </SelectTrigger>
                    <SelectContent>
                      {squadConfig.squads.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      Nenhum squad configurado. Acesse <strong>Configurações → Squads e Desenvolvedores</strong>, adicione seu squad e clique em <strong>Salvar configurações</strong>.
                    </span>
                  </div>
                )}
              </div>

              {/* Period */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Início do período</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={String(startMonth)} onValueChange={(v) => setStartMonth(parseInt(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={String(startYear)} onValueChange={(v) => setStartYear(parseInt(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fim do período</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={String(endMonth)} onValueChange={(v) => setEndMonth(parseInt(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={String(endYear)} onValueChange={(v) => setEndYear(parseInt(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Período: <span className="font-medium">{startDateDisplay}</span> a <span className="font-medium">{endDateDisplay}</span>
              </p>
            </CardContent>
          </Card>

          {/* Defeitos do RTC */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base flex items-center gap-2 min-w-0 flex-1">
                  <Database className="h-4 w-4 shrink-0" />
                  <span className="truncate">Defeitos Atendidos por Desenvolvedor — {selectedSquad?.name ?? 'Squad'}</span>
                </CardTitle>
                {isDevMode && (
                  <Button size="sm" className="shrink-0" onClick={handleFetchRtc} disabled={rtcFetching || !selectedSquadId}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${rtcFetching ? 'animate-spin' : ''}`} />
                    {rtcFetching ? 'Buscando...' : 'Buscar do RTC'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isDevMode && (
                <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Busca automática disponível apenas em modo de desenvolvimento. Preencha as contagens manualmente abaixo.</span>
                </div>
              )}

              {rtcError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{rtcError}</span>
                </div>
              )}

              {rtcResult && !rtcError && (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Dados carregados do RTC · {MONTHS[startMonth]}/{startYear} a {MONTHS[endMonth]}/{endYear}
                </div>
              )}

              {/* Developer table */}
              {selectedSquad && squadConfig ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-[20px_1fr_auto_auto_auto] gap-2 text-xs font-medium text-muted-foreground px-2 pb-1 border-b">
                    <span />
                    <span>Desenvolvedor</span>
                    <span className="text-right w-20">Nível</span>
                    <span className="text-right w-24">Qtd. Defeitos</span>
                    <span className="text-right w-28">Custo</span>
                  </div>
                  {devRows.map((row) => {
                    const devItems = rtcResult?.developers.find((d) => d.email === row.email)?.items ?? [];
                    const isExpanded = expandedDev === row.email;
                    return (
                      <div key={row.email}>
                        <div
                          className="grid grid-cols-[20px_1fr_auto_auto_auto] items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted/30 cursor-pointer select-none"
                          onClick={() => setExpandedDev(isExpanded ? null : row.email)}
                        >
                          <button className="flex items-center justify-center text-muted-foreground hover:text-foreground">
                            {isExpanded
                              ? <ChevronUp className="h-3 w-3" />
                              : <ChevronDown className="h-3 w-3" />}
                          </button>
                          <div>
                            <p className="text-sm font-medium">{row.userId}</p>
                          </div>
                          <span className="text-xs text-muted-foreground w-20 text-right capitalize">{row.level}</span>
                          <div className="w-24" onClick={(e) => e.stopPropagation()}>
                            <Input
                              type="number"
                              min={0}
                              value={String(row.count)}
                              onChange={(e) => updateCount(row.email, e.target.value)}
                              className="h-7 text-sm text-right"
                            />
                          </div>
                          <span className="text-sm font-semibold text-right w-28 text-destructive">
                            {formatCurrency(row.custo)}
                          </span>
                        </div>

                        {isExpanded && (
                          <div className="mx-6 mb-2 rounded-lg border overflow-hidden text-xs">
                            {devItems.length === 0 ? (
                              <p className="text-center text-muted-foreground py-3">
                                {rtcResult ? 'Nenhum card encontrado para este dev.' : 'Clique em "Buscar do RTC" para carregar os cards.'}
                              </p>
                            ) : (
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-muted/50 text-muted-foreground">
                                    <th className="text-left px-3 py-2 font-medium">ID</th>
                                    <th className="text-left px-3 py-2 font-medium">Tipo</th>
                                    <th className="text-left px-3 py-2 font-medium">Versão origem</th>
                                    <th className="text-left px-3 py-2 font-medium">Criado em</th>
                                    <th className="text-left px-3 py-2 font-medium">Resolvido em</th>
                                    <th className="text-right px-3 py-2 font-medium">Dias úteis abertos</th>
                                    <th className="text-right px-3 py-2 font-medium">Custo</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {devItems.map((item, i) => {
                                    const created = new Date(item.created);
                                    const resolved = item.resolutionDate ? new Date(item.resolutionDate) : null;
                                    const days = resolved
                                      ? (() => {
                                          let count = 0;
                                          const cur = new Date(created);
                                          cur.setHours(0, 0, 0, 0);
                                          const end = new Date(resolved);
                                          end.setHours(0, 0, 0, 0);
                                          while (cur < end) {
                                            const dow = cur.getDay();
                                            if (dow !== 0 && dow !== 6) count++;
                                            cur.setDate(cur.getDate() + 1);
                                          }
                                          return count;
                                        })()
                                      : null;
                                    return (
                                      <tr key={item.id} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                                        <td className="px-3 py-1.5 font-mono font-semibold text-primary">#{item.id}</td>
                                        <td className="px-3 py-1.5">
                                          <Badge
                                            variant={item.type === 'Defeito Cliente' ? 'destructive' : 'secondary'}
                                            className="text-[10px] px-1.5 py-0"
                                          >
                                            {item.type}
                                          </Badge>
                                        </td>
                                        <td className="px-3 py-1.5 text-muted-foreground font-mono text-[11px]">
                                          {item.versaoOrigem ?? '—'}
                                        </td>
                                        <td className="px-3 py-1.5 text-muted-foreground">
                                          {created.toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-3 py-1.5 text-muted-foreground">
                                          {resolved ? resolved.toLocaleDateString('pt-BR') : '—'}
                                        </td>
                                        <td className="px-3 py-1.5 text-right font-semibold">
                                          {days !== null ? (
                                            <span className={
                                              days > 90 ? 'text-destructive' :
                                              days > 30 ? 'text-amber-600 dark:text-amber-400' :
                                              'text-green-600 dark:text-green-400'
                                            }>
                                              {days}d
                                            </span>
                                          ) : '—'}
                                        </td>
                                        <td className="px-3 py-1.5 text-right text-muted-foreground">
                                          {days !== null
                                            ? formatCurrency(Math.max(days, 1) * squadConfig.workSettings.horasPorDia * row.custoHora)
                                            : '—'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Separator />
                  <div className="grid grid-cols-[20px_1fr_auto_auto_auto] items-center gap-2 px-2 py-1 font-semibold text-sm">
                    <span />
                    <span>Total</span>
                    <span className="w-20" />
                    <span className="text-right w-24">{totalCount} defeito(s)</span>
                    <span className="text-right w-28 text-destructive">{formatCurrency(totalCusto)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {configLoading ? 'Carregando...' : 'Selecione um squad para ver os desenvolvedores.'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Releases GitLab */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Releases para o Cliente — {periodLabel}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowGitlabConfig((v) => !v)}>
                  {showGitlabConfig ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  GitLab
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {showGitlabConfig && (
                <div className="space-y-3 p-3 rounded-lg bg-muted/40 border">
                  <p className="text-xs text-muted-foreground">
                    Projeto: <span className="font-mono">{GITLAB_PROJECT}</span>
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Personal Access Token do GitLab"
                      value={gitlabToken}
                      onChange={(e) => setGitlabToken(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleFetchTags} disabled={tagsLoading}>
                      <RefreshCw className={`h-4 w-4 mr-1 ${tagsLoading ? 'animate-spin' : ''}`} />
                      Buscar
                    </Button>
                  </div>
                  {tagsError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {tagsError}
                    </p>
                  )}
                </div>
              )}

              {periodReleases.length > 0 ? (
                <div className="space-y-3">
                  {/* Score de qualidade de releases */}
                  {(() => {
                    const clean = periodReleases.filter(r => r.maxRc === 1).length;
                    const pctClean = Math.round((clean / periodReleases.length) * 100);
                    const avgRc = Math.round(periodReleases.reduce((s, r) => s + r.maxRc, 0) / periodReleases.length * 10) / 10;
                    const pior = periodReleases.reduce((a, b) => b.maxRc > a.maxRc ? b : a);
                    const qualColor = pctClean >= 80 ? '#22c55e' : pctClean >= 50 ? '#f59e0b' : '#3b82f6';
                    const qualLabel = pctClean >= 80 ? 'Maioria direta' : pctClean >= 50 ? 'Ciclos moderados' : 'Alta validação';
                    return (
                      <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/30 border">
                        <div className="text-center">
                          <p className="text-2xl font-bold" style={{ color: qualColor }}>{pctClean}%</p>
                          <p className="text-[10px] text-muted-foreground">deploys diretos (RC1)</p>
                          <p className="text-[10px] font-medium mt-0.5" style={{ color: qualColor }}>{qualLabel}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{avgRc}</p>
                          <p className="text-[10px] text-muted-foreground">RC médio por release</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">ciclos de validação</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold font-mono text-blue-600">{pior.base}</p>
                          <p className="text-[10px] text-muted-foreground">release com mais ciclos</p>
                          <p className="text-[10px] font-medium text-blue-600 mt-0.5">RC{pior.maxRc}</p>
                        </div>
                      </div>
                    );
                  })()}

                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{periodReleases.length}</span> release(s) entregue(s) ao cliente no período
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {periodReleases.map((r) => (
                      <div key={r.base} className="flex items-center justify-between text-sm px-2 py-1 rounded bg-muted/30">
                        <span className="font-mono">{r.shippedTag}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${r.maxRc === 1 ? 'border-green-500 text-green-700' : r.maxRc <= 3 ? 'border-yellow-500 text-yellow-700' : 'border-blue-500 text-blue-700'}`}
                        >
                          {r.maxRc === 1 ? 'Deploy limpo' : r.maxRc <= 3 ? `${r.maxRc} ciclos — normal` : `${r.maxRc} ciclos — validação intensa`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {allReleases.length === 0
                      ? 'Busque as tags do GitLab ou informe o número de releases manualmente.'
                      : `Nenhuma release encontrada em ${periodLabel}.`}
                  </p>
                  <div className="flex items-center gap-2">
                    <Label className="whitespace-nowrap text-sm">Releases manuais:</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={manualDeploys}
                      onChange={(e) => setManualDeploys(e.target.value)}
                      className="w-24"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <p className="text-sm text-muted-foreground">Total de releases no período:</p>
                <Badge variant="secondary" className="text-sm font-bold">{deploys} deploy(s)</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column — Squad Health */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-center">Saúde do Squad</CardTitle>
              {selectedSquad && <p className="text-center text-sm text-muted-foreground">{selectedSquad.name}</p>}
              <p className="text-center text-xs text-muted-foreground">{startDateDisplay} a {endDateDisplay}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <DPDDisplay value={defeitosPorDeploy} />
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-xs text-center space-y-1">
                <p className="font-mono text-muted-foreground">{totalCount} def ÷ {deploys} deploys</p>
                <p className="text-[10px] text-muted-foreground">Elite &lt;1,0 · Atenção 1–3 · Crítico &gt;3</p>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Detalhamento</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deploys no período</span>
                  <span className="font-semibold">{deploys}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de defeitos</span>
                  <span className="font-semibold">{totalCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custo de retrabalho</span>
                  <span className="font-semibold text-destructive">{formatCurrency(totalCusto)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custo médio/defeito</span>
                  <span className="font-semibold">{formatCurrency(custoMedio)}</span>
                </div>
              </div>

              {periodReleases.some((r) => r.maxRc > 1) && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Regressões</p>
                    {periodReleases.filter((r) => r.maxRc > 1).map((r) => (
                      <div key={r.base} className="flex justify-between text-xs">
                        <span className="font-mono">{r.base}</span>
                        <Badge variant="destructive" className="text-xs">{r.maxRc} RCs</Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Como interpretar */}
          <Card>
            <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowExplanation((v) => !v)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  Como interpretar
                </CardTitle>
                {showExplanation ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </CardHeader>
            {showExplanation && (
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-1">
                  <p className="font-semibold">Defeitos por Deploy</p>
                  <p className="text-muted-foreground text-xs">
                    Quantos defeitos foram registrados em média por entrega ao cliente. Referência DORA (Google): times de elite mantêm abaixo de 1,0. Acima de 3 indica necessidade de mais atenção à qualidade antes das entregas.
                  </p>
                  <div className="flex gap-2 flex-wrap pt-1">
                    <Badge variant="outline" className="text-[10px] border-green-500 text-green-600">&lt;1,0 Elite</Badge>
                    <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600">1–3 Atenção</Badge>
                    <Badge variant="outline" className="text-[10px] border-red-500 text-red-600">&gt;3 Crítico</Badge>
                  </div>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="font-semibold">Ciclos de Regressão</p>
                  <p className="text-muted-foreground text-xs">
                    Ciclos de validação antes da entrega ao cliente. RC1 = deploy direto. RC2–3 = ciclos normais. RC4+ = validação intensa — defeitos contidos antes de chegarem ao cliente, o que é positivo do ponto de vista da qualidade.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Gerar Relatório */}
          <Button className="w-full" variant="outline" onClick={() => setShowReport(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Gerar Relatório
          </Button>
        </div>
      </div>

      <RelatorioDialog
        open={showReport}
        onClose={() => setShowReport(false)}
        squadName={selectedSquad?.name ?? 'Squad'}
        startDateDisplay={startDateDisplay}
        endDateDisplay={endDateDisplay}
        deploys={deploys}
        totalCount={totalCount}
        totalCusto={totalCusto}
        custoMedio={custoMedio}
        defeitosPorDeploy={defeitosPorDeploy}
        periodReleases={periodReleases}
        allReleases={allReleases}
        allItems={allItems}
        horasPorDia={squadConfig?.workSettings?.horasPorDia ?? 8}
      />
    </div>
  );
}
