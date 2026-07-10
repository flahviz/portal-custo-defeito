import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { defaultSystemConfig } from '@/lib/defaultData';
import { formatCurrency } from '@/lib/defectCalculations';
import { Defect, SystemConfig } from '@/types/defect';
import { issCache, recorrentesCache, ISSCache, RecorrentesCache } from '@/lib/dashboardCache';
import {
  Activity,
  RefreshCw,
  ArrowRight,
  DollarSign,
  AlertTriangle,
  Shield,
  TrendingDown,
  Clock,
  CheckCircle2,
  Flame,
  Target,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  SimpleTooltip,
  Tooltip,
} from '@/components/charts/SimpleChart';

// ── Helpers ──────────────────────────────────────────────────────────────────

function issStatusConfig(pct: number) {
  if (pct >= 85) return { color: '#22c55e', border: 'border-green-200', bg: 'bg-green-50', label: 'Saudável', Icon: CheckCircle2 };
  if (pct >= 60) return { color: '#f59e0b', border: 'border-yellow-200', bg: 'bg-yellow-50', label: 'Atenção', Icon: TrendingDown };
  return { color: '#ef4444', border: 'border-red-200', bg: 'bg-red-50', label: 'Crítico', Icon: AlertTriangle };
}

// ── Barra de status consolidado ───────────────────────────────────────────────

function StatusBar({
  issData,
  recorrentesData,
  criticalCount,
  totalCusto,
}: {
  issData: ISSCache | null;
  recorrentesData: RecorrentesCache | null;
  criticalCount: number;
  totalCusto: number;
}) {
  const issPct = issData ? Math.round(issData.iss * 100) : null;
  const cfg = issPct !== null ? issStatusConfig(issPct) : null;
  const regressoes = recorrentesData?.clusters.regressao ?? 0;
  const hasAlerts = criticalCount > 0 || regressoes > 0 || (issPct !== null && issPct < 60);

  if (!issData && !recorrentesData && totalCusto === 0) return null;

  return (
    <Card className={`border ${hasAlerts ? 'border-yellow-200 bg-yellow-50/50' : 'border-green-200 bg-green-50/50'}`}>
      <CardContent className="py-3 px-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {cfg && issPct !== null && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">ISS</span>
              <span className="font-bold" style={{ color: cfg.color }}>{issPct}%</span>
              <Badge variant="outline" className="text-xs px-1.5 py-0" style={{ borderColor: cfg.color, color: cfg.color }}>
                {cfg.label}
              </Badge>
            </div>
          )}

          {regressoes > 0 && (
            <>
              <span className="text-muted-foreground hidden sm:block">·</span>
              <div className="flex items-center gap-1 text-red-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="font-semibold">{regressoes}</span>
                <span>{regressoes === 1 ? 'regressão' : 'regressões'}</span>
              </div>
            </>
          )}

          {totalCusto > 0 && (
            <>
              <span className="text-muted-foreground hidden sm:block">·</span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                <span>{formatCurrency(totalCusto)} em custo</span>
              </div>
            </>
          )}

          {criticalCount > 0 && (
            <>
              <span className="text-muted-foreground hidden sm:block">·</span>
              <div className="flex items-center gap-1 font-semibold text-red-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{criticalCount} {criticalCount === 1 ? 'defeito crítico' : 'defeitos críticos'} em produção</span>
              </div>
            </>
          )}

          {!hasAlerts && (
            <div className="flex items-center gap-1.5 text-green-700 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Squad com indicadores saudáveis
            </div>
          )}

          {issData && (
            <span className="ml-auto text-[10px] text-muted-foreground hidden md:flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {issData.squadName} · {issData.period}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Painel ISS ──────────────────────────────────────────────────────────────

function ISSPanel({ data }: { data: ISSCache }) {
  const issPct = Math.round(data.iss * 100);
  const cfg = issStatusConfig(issPct);
  const dpdStatus = data.dpd === null ? null : data.dpd < 1 ? 'Elite' : data.dpd <= 3 ? 'Atenção' : 'Crítico';
  const dpdColor = data.dpd === null ? undefined : data.dpd < 1 ? '#22c55e' : data.dpd <= 3 ? '#f59e0b' : '#ef4444';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Índice de Saúde (ISS)
          </CardTitle>
          <Link to="/iss">
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
              Ver completo <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">{data.squadName} · {data.period}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Gauge */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div
              className="flex items-center justify-center rounded-full border-8 font-bold"
              style={{ width: 88, height: 88, borderColor: cfg.color, color: cfg.color, fontSize: 22 }}
            >
              {issPct}%
            </div>
            <Badge variant="outline" className="text-xs px-2 mt-1" style={{ borderColor: cfg.color, color: cfg.color }}>
              {cfg.label}
            </Badge>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm flex-1">
            <div>
              <p className="text-xs text-muted-foreground">Deploys no período</p>
              <p className="font-bold text-lg leading-tight">{data.deploys}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Defeitos resolvidos</p>
              <p className="font-bold text-lg leading-tight">{data.totalDefects}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Defeitos por deploy</p>
              <p className="font-bold text-lg leading-tight" style={{ color: dpdColor ?? undefined }}>
                {data.dpd !== null ? data.dpd.toFixed(1) : '—'}
                {dpdStatus && <span className="text-xs font-normal ml-1">({dpdStatus})</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Custo total</p>
              <p className="font-bold text-lg leading-tight">{formatCurrency(data.totalCusto)}</p>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-4 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Atualizado {new Date(data.updatedAt).toLocaleString('pt-BR')}
        </p>
      </CardContent>
    </Card>
  );
}

function ISSEmpty() {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
          <Activity className="h-4 w-4" />
          Índice de Saúde (ISS)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8 text-center gap-3">
        <p className="text-sm text-muted-foreground max-w-xs">
          Nenhum dado de ISS disponível. Acesse o módulo para calcular o índice do seu squad.
        </p>
        <Link to="/iss">
          <Button variant="outline" size="sm">Calcular ISS <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ── Painel Recorrentes ──────────────────────────────────────────────────────

const TIPO_RANK_CONFIG = [
  { key: 'regressao' as const,   label: 'Regressão',   color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
  { key: 'recorrencia' as const, label: 'Recorrência', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  { key: 'duplicata' as const,   label: 'Duplicata',   color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { key: 'similar' as const,     label: 'Similar',     color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
];

function RecorrentesPanel({ data }: { data: RecorrentesCache }) {
  const totalClusters = Object.values(data.clusters).reduce((a, b) => a + b, 0);
  const tiposAtivos = TIPO_RANK_CONFIG.filter(t => data.clusters[t.key] > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />
            Defeitos Recorrentes
          </CardTitle>
          <Link to="/recorrentes">
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
              Ver completo <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          {data.squadName} · últimos {data.months} meses · {data.totalDefects} cards
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo de tipos */}
        <div className="flex flex-wrap gap-2">
          {tiposAtivos.length === 0 ? (
            <p className="text-sm text-green-700 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Nenhum padrão identificado
            </p>
          ) : tiposAtivos.map(t => (
            <div
              key={t.key}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm font-medium ${t.color} ${t.bg} ${t.border}`}
            >
              <span>{t.label}</span>
              <span className="font-bold text-base leading-none">{data.clusters[t.key]}</span>
              <span className="text-xs opacity-70">{data.clusters[t.key] === 1 ? 'grupo' : 'grupos'}</span>
            </div>
          ))}
        </div>

        {/* Ranking de funcionalidades */}
        {data.topFuncionalidades.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Funcionalidades com mais ocorrências
            </p>
            <div className="space-y-2">
              {data.topFuncionalidades.slice(0, 4).map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                  <span className="flex-1 truncate" title={f.nome}>{f.nome || '(sem funcionalidade)'}</span>
                  <Badge variant="secondary" className="shrink-0 text-xs">{f.count} ocorrências</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Atualizado {new Date(data.updatedAt).toLocaleString('pt-BR')}
        </p>
      </CardContent>
    </Card>
  );
}

function RecorrentesEmpty() {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4" />
          Defeitos Recorrentes
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8 text-center gap-3">
        <p className="text-sm text-muted-foreground max-w-xs">
          Nenhuma análise de recorrências disponível. Execute uma análise para identificar padrões.
        </p>
        <Link to="/recorrentes">
          <Button variant="outline" size="sm">Analisar recorrências <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ── Top 3 defeitos por custo ──────────────────────────────────────────────────

function TopDefectos({ defects }: { defects: Defect[] }) {
  const top3 = useMemo(
    () => [...defects].sort((a, b) => b.custoComImpacto - a.custoComImpacto).slice(0, 3),
    [defects]
  );

  const severidadeColor: Record<string, string> = {
    critica: 'text-red-700 bg-red-50 border-red-200',
    alta:    'text-orange-700 bg-orange-50 border-orange-200',
    media:   'text-yellow-700 bg-yellow-50 border-yellow-200',
    baixa:   'text-blue-700 bg-blue-50 border-blue-200',
  };

  if (defects.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Top defeitos por custo
          </CardTitle>
          <Link to="/simulador">
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
              Ver todos ({defects.length}) <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {top3.map((d, i) => (
          <div key={d.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
            <span className="text-sm font-bold text-muted-foreground w-4 shrink-0">#{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{d.titulo}</p>
              <p className="text-xs text-muted-foreground capitalize">{d.ambienteEncontrado}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold">{formatCurrency(d.custoComImpacto)}</p>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 capitalize ${severidadeColor[d.severidade] ?? ''}`}
              >
                {d.severidade}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Radar de Risco ──────────────────────────────────────────────────────────

function RadarRisco({ data }: { data: RecorrentesCache }) {
  const areas = data.topFuncionalidades.filter(f => f.count >= 2);
  if (areas.length === 0) return null;

  function risco(count: number): { label: string; color: string; bg: string; border: string } {
    if (count >= 5) return { label: 'Crítico', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
    if (count >= 3) return { label: 'Alto', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { label: 'Médio', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' };
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Radar de Risco
          </CardTitle>
          <Link to="/recorrentes">
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
              Ver análise <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Áreas com padrão recorrente — maior probabilidade de novos defeitos
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {areas.slice(0, 5).map((f, i) => {
          const r = risco(f.count);
          return (
            <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${r.bg} ${r.border}`}>
              <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">#{i + 1}</span>
              <span className={`flex-1 text-sm font-medium truncate ${r.color}`} title={f.nome}>
                {f.nome || '(sem funcionalidade)'}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">{f.count} ocorrências</span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${r.color} ${r.border}`}>
                  {r.label}
                </Badge>
              </div>
            </div>
          );
        })}
        <p className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Baseado nos últimos {data.months} meses · {data.totalDefects} cards analisados
        </p>
      </CardContent>
    </Card>
  );
}

// ── Top causas raiz ──────────────────────────────────────────────────────────

function TopCausas({ data }: { data: RecorrentesCache }) {
  if (!data.topCausas || data.topCausas.length === 0) return null;
  const max = data.topCausas[0]?.count ?? 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Top causas raiz
        </CardTitle>
        <p className="text-xs text-muted-foreground">Termos mais frequentes nas causas dos clusters identificados</p>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {data.topCausas.map((c, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="capitalize font-medium">{c.termo}</span>
              <span className="text-xs text-muted-foreground">{c.count}×</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${Math.round((c.count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Dashboard principal ────────────────────────────────────────────────────

export default function Dashboard() {
  const [defects] = useLocalStorage<Defect[]>('defects', []);
  const [_config] = useLocalStorage<SystemConfig>('systemConfig', defaultSystemConfig);

  const issData = issCache.load();
  const recorrentesData = recorrentesCache.load();

  React.useEffect(() => {
    localStorage.removeItem('defectsInitialized');
  }, []);

  const totalCustoComImpacto = useMemo(
    () => defects.reduce((s, d) => s + d.custoComImpacto, 0),
    [defects]
  );
  const totalCustoPago = useMemo(
    () => defects.reduce((s, d) => s + d.custoPago, 0),
    [defects]
  );
  const totalEconomiaPotencial = useMemo(
    () => defects.reduce((s, d) => s + d.economiaPotencial, 0),
    [defects]
  );
  const criticalInProd = useMemo(
    () => defects.filter(d => d.severidade === 'critica' && d.ambienteEncontrado === 'producao').length,
    [defects]
  );

  const defectosContidos = useMemo(
    () => defects.filter(d => d.ambienteEncontrado !== 'producao'),
    [defects]
  );
  const custoEvitado = useMemo(
    () => defectosContidos.reduce((s, d) => s + d.economiaPotencial, 0),
    [defectosContidos]
  );

  const totalCustoPorFase = useMemo(
    () => defects.reduce(
      (acc, d) => ({
        desenvolvimento: acc.desenvolvimento + d.custoPorFase.desenvolvimento,
        teste: acc.teste + d.custoPorFase.teste,
        homologacao: acc.homologacao + d.custoPorFase.homologacao,
        producao: acc.producao + d.custoPorFase.producao,
      }),
      { desenvolvimento: 0, teste: 0, homologacao: 0, producao: 0 }
    ),
    [defects]
  );

  const phaseData = [
    { fase: 'Dev', custo: totalCustoPorFase.desenvolvimento },
    { fase: 'Teste', custo: totalCustoPorFase.teste },
    { fase: 'Homolog.', custo: totalCustoPorFase.homologacao },
    { fase: 'Produção', custo: totalCustoPorFase.producao },
  ];

  const monthlyTrend = useMemo(() => {
    const map: Record<string, number> = {};
    defects.forEach(d => {
      const raw = d.createdAt;
      const dt = typeof raw === 'string' ? new Date(raw) : raw instanceof Date ? raw : new Date();
      if (isNaN(dt.getTime())) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + d.custoComImpacto;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, custo]) => ({
        mes: new Date(`${month}-01T00:00:00Z`).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        custo,
      }));
  }, [defects]);

  const hasAnyCostData = defects.length > 0;

  function Divider({ label }: { label: string }) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-[11px] font-mono text-muted-foreground/60 tracking-[0.18em] uppercase shrink-0">
          // {label}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Cabeçalho ── */}
      <div>
        <p className="text-[11px] font-mono text-muted-foreground/60 tracking-[0.2em] uppercase mb-3">
          Vertical Procuradorias · Softplan
        </p>
        <h1 className="text-4xl font-bold text-foreground">
          Visão <span className="text-[#3b82f6]">Geral</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Panorama consolidado de qualidade do squad
        </p>
      </div>

      {/* Barra de status */}
      <StatusBar
        issData={issData}
        recorrentesData={recorrentesData}
        criticalCount={criticalInProd}
        totalCusto={totalCustoComImpacto}
      />

      {/* ── ISS + Recorrentes ── */}
      <div className="space-y-4">
        <Divider label="Saúde do Squad" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {issData ? <ISSPanel data={issData} /> : <ISSEmpty />}
          {recorrentesData ? <RecorrentesPanel data={recorrentesData} /> : <RecorrentesEmpty />}
        </div>
      </div>

      {/* ── Radar de Risco + Top Causas ── */}
      {recorrentesData && (recorrentesData.topFuncionalidades.some(f => f.count >= 2) || (recorrentesData.topCausas?.length ?? 0) > 0) && (
        <div className="space-y-4">
          <Divider label="Prevenção e Risco" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RadarRisco data={recorrentesData} />
            <TopCausas data={recorrentesData} />
          </div>
        </div>
      )}

      {/* ── Custo — KPIs + gráficos + top 3 ── */}
      {hasAnyCostData ? (
        <>
          <div className="space-y-4">
            <Divider label="Custo de Defeitos" />

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2"><DollarSign className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Custo base</p>
                    <p className="text-lg font-bold">{formatCurrency(totalCustoPago)}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-yellow-100 p-2"><AlertTriangle className="h-5 w-5 text-yellow-600" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Custo com impacto</p>
                    <p className="text-lg font-bold">{formatCurrency(totalCustoComImpacto)}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-2"><Shield className="h-5 w-5 text-green-600" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Economia potencial</p>
                    <p className="text-lg font-bold text-green-700">{formatCurrency(totalEconomiaPotencial)}</p>
                  </div>
                </div>
              </Card>
              {defectosContidos.length > 0 && (
                <Card className="p-4 border-blue-200 bg-blue-50/50">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-100 p-2"><ShieldCheck className="h-5 w-5 text-blue-600" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">Contidos pelo QA</p>
                      <p className="text-lg font-bold text-blue-700">{defectosContidos.length} defeitos</p>
                      <p className="text-[10px] text-blue-600">{formatCurrency(custoEvitado)} evitados</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Gráficos + top 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gráfico de fases */}
              <Card className="p-5">
                <h3 className="text-sm font-semibold mb-3">Custo por fase de detecção</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={phaseData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="fase" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => formatCurrency(v)} width={70} />
                      <Tooltip content={<SimpleTooltip formatter={(v: number) => formatCurrency(v)} />} />
                      <Bar dataKey="custo" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Detectar em produção custa até 30× mais do que em desenvolvimento
                </p>
              </Card>

              {/* Gráfico tendência */}
              <Card className="p-5">
                <h3 className="text-sm font-semibold mb-3">Tendência de custo (últimos 6 meses)</h3>
                {monthlyTrend.length > 1 ? (
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => formatCurrency(v)} width={70} />
                        <Tooltip content={<SimpleTooltip formatter={(v: number) => formatCurrency(v)} />} />
                        <Line type="monotone" dataKey="custo" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">
                    Dados insuficientes para tendência
                  </div>
                )}
              </Card>

              {/* Top 3 */}
              <TopDefectos defects={defects} />
            </div>
          </div>
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <DollarSign className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Nenhum defeito cadastrado no Simulador</p>
              <p className="text-xs text-muted-foreground mt-1">Registre defeitos para ver análise de custo</p>
            </div>
            <Link to="/simulador">
              <Button variant="outline" size="sm">Ir para o Simulador <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
