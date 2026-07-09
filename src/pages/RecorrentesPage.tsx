import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSquadConfig } from '@/hooks/useSquadConfig';
import { fetchRtcRecorrentes } from '@/lib/rtcService';
import { analisarRecorrencias, ClusterDefeitos, ClusterTipo, stripHtml } from '@/lib/recorrenciaAnalysis';
import { recorrentesCache } from '@/lib/dashboardCache';
import { analyzeCluster, ClusterAnalysis, validateTests, ValidacaoResult, TestValidation } from '@/lib/claudeService';
import { Brain, Loader2, CheckCircle2, Code2, Shield, Lightbulb, ChevronDown, FlaskConical, XCircle, AlertCircle, FileCode2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const MESES_OPTIONS = [3, 6, 9, 12, 18, 24];

// Threshold de similaridade: 0.15 = mais clusters (mais ruído), 0.30 = menos clusters (mais precisos)
const THRESHOLD_OPTIONS = [
  { value: 0.15, label: 'Amplo (0.15)' },
  { value: 0.20, label: 'Equilibrado (0.20)' },
  { value: 0.25, label: 'Restrito (0.25)' },
  { value: 0.30, label: 'Estrito (0.30)' },
];

const TIPO_CONFIG: Record<ClusterTipo, { label: string; color: string; bg: string; border: string }> = {
  regressao:   { label: 'Regressão',   color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
  recorrencia: { label: 'Recorrência', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  duplicata:   { label: 'Duplicata',   color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  similar:     { label: 'Similar',     color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
};

function TipoBadge({ tipo }: { tipo: ClusterTipo }) {
  const cfg = TIPO_CONFIG[tipo];
  return (
    <Badge variant="outline" className={`${cfg.color} border-current font-semibold text-xs`}>
      {cfg.label}
    </Badge>
  );
}

function SimBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.5 ? 'bg-red-400' : value >= 0.3 ? 'bg-orange-400' : 'bg-blue-400';
  return (
    <div className="flex items-center gap-1.5" title={`Similaridade máxima: ${pct}%`}>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden w-16">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums">{pct}%</span>
    </div>
  );
}

const STATUS_CONFIG = {
  implementavel:        { label: 'Implementável',      icon: CheckCircle2, color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  'requer-refatoracao': { label: 'Requer refatoração', icon: AlertCircle,  color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  'nao-testavel':       { label: 'Não testável',       icon: XCircle,      color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200'   },
} as const;

function TestValidationCard({ tv }: { tv: TestValidation }) {
  const cfg = STATUS_CONFIG[tv.status];
  const Icon = cfg.icon;
  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} p-3 space-y-1.5`}>
      <div className="flex items-start gap-2">
        <Icon className={`h-4 w-4 ${cfg.color} mt-0.5 shrink-0`} />
        <p className="text-sm leading-relaxed">{tv.teste}</p>
      </div>
      <p className={`text-xs ${cfg.color} font-semibold pl-6`}>{cfg.label}</p>
      <p className="text-xs text-muted-foreground pl-6 leading-relaxed">{tv.motivo}</p>
      {tv.comoImplementar && (
        <p className="text-xs text-foreground pl-6 leading-relaxed italic">{tv.comoImplementar}</p>
      )}
    </div>
  );
}

function CollapsibleSection({
  title, icon, defaultOpen = true, children,
}: {
  title: React.ReactNode; icon?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-2 text-left hover:opacity-80 transition-opacity"
      >
        <h3 className="text-sm font-semibold flex items-center gap-2">{icon}{title}</h3>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pb-1">{children}</div>}
    </div>
  );
}

function ClusterIADialog({ cluster, open, onClose }: { cluster: ClusterDefeitos; open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClusterAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [validando, setValidando] = useState(false);
  const [validacao, setValidacao] = useState<ValidacaoResult | null>(null);
  const [validacaoError, setValidacaoError] = useState<string | null>(null);
  const [gitlabToken, setGitlabToken] = useState(() => localStorage.getItem('radar_gitlab_token') ?? '');
  const [showTokenInput, setShowTokenInput] = useState(false);

  async function handleAnalyze() {
    setLoading(true); setError(null);
    try {
      const analysis = await analyzeCluster(cluster as unknown as Record<string, unknown>);
      setResult(analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro na análise.');
    } finally {
      setLoading(false);
    }
  }

  async function handleValidar() {
    if (!result) return;
    const token = gitlabToken.trim();
    if (!token) { setShowTokenInput(true); return; }
    localStorage.setItem('radar_gitlab_token', token);
    setShowTokenInput(false);
    setValidando(true); setValidacaoError(null); setValidacao(null);
    try {
      const val = await validateTests(
        result.testesRegressao,
        cluster as unknown as Record<string, unknown>,
        token,
        result
      );
      setValidacao(val);
    } catch (e) {
      setValidacaoError(e instanceof Error ? e.message : 'Erro na validação.');
    } finally {
      setValidando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[90vw] max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-primary shrink-0" />
            {stripHtml(cluster.funcionalidade)}
          </DialogTitle>
          <div className="flex items-center gap-2 pt-1">
            <TipoBadge tipo={cluster.tipo} />
            <span className="text-xs text-muted-foreground">{cluster.defeitos.length} ocorrências no cluster</span>
          </div>
        </DialogHeader>

        {!result && !loading && (
          <div className="space-y-4 py-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              A IA vai identificar a causa raiz comum entre as <strong>{cluster.defeitos.length}</strong> ocorrências
              e sugerir testes de regressão para evitar que o problema volte.
            </p>
            {cluster.causaRepresentativa && (
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs font-semibold text-foreground mb-1.5">Causa representativa do cluster</p>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                  {cluster.causaRepresentativa}
                </p>
              </div>
            )}
            <Button onClick={handleAnalyze} className="gap-2">
              <Brain className="h-4 w-4" /> Analisar com IA
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analisando com IA... pode levar 15–30 segundos</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 mt-3">
            {error}
          </div>
        )}

        {result && (
          <div className="pt-4 divide-y divide-border">

            {/* Categoria — sempre visível */}
            <div className="flex items-center gap-3 rounded-lg bg-purple-50 border border-purple-200 p-4 mb-4">
              <Shield className="h-5 w-5 text-purple-600 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider">Categoria do problema</p>
                <p className="text-sm font-semibold text-purple-900 mt-0.5">{result.tipoProblema}</p>
              </div>
            </div>

            <CollapsibleSection
              defaultOpen={true}
              icon={<span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">1</span>}
              title="Causa raiz comum"
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground pl-7 pb-3">
                {result.causaRaizComum}
              </p>
            </CollapsibleSection>

            <CollapsibleSection
              defaultOpen={false}
              icon={<span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">2</span>}
              title="Solução estrutural"
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground pl-7 pb-3">
                {result.solucaoEstrutural}
              </p>
            </CollapsibleSection>

            <CollapsibleSection
              defaultOpen={true}
              icon={<span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold shrink-0">3</span>}
              title="Testes de regressão recomendados"
            >
              <div className="pl-7 pb-3 space-y-3">
                {/* Lista original da IA */}
                <ul className="space-y-2.5">
                  {result.testesRegressao.map((t, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{t}</span>
                    </li>
                  ))}
                </ul>

                {/* Botão validar */}
                {!validacao && !validando && (
                  <div className="pt-1 space-y-2">
                    {showTokenInput && (
                      <div className="flex gap-2 items-center">
                        <Input
                          placeholder="Token GitLab (PRIVATE-TOKEN)"
                          value={gitlabToken}
                          onChange={(e) => setGitlabToken(e.target.value)}
                          type="password"
                          className="text-xs h-8"
                        />
                        <Button size="sm" onClick={handleValidar} disabled={!gitlabToken.trim()}>
                          OK
                        </Button>
                      </div>
                    )}
                    <button
                      onClick={handleValidar}
                      className="flex items-center gap-1.5 text-xs text-primary underline underline-offset-2 hover:opacity-80"
                    >
                      <FlaskConical className="h-3.5 w-3.5" />
                      Validar implementabilidade no código-fonte
                    </button>
                    {validacaoError && <p className="text-xs text-red-600">{validacaoError}</p>}
                  </div>
                )}

                {validando && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Buscando código no GitLab e validando com IA... pode levar 30–60 segundos
                  </div>
                )}

                {/* Resultado da validação — antes/depois */}
                {validacao && (
                  <div className="space-y-3 pt-2 border-t border-dashed border-border">
                    <div className="flex items-center gap-2">
                      <FileCode2 className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-semibold text-foreground">Após validação no código-fonte</p>
                    </div>
                    {validacao.arquivosAnalisados?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {validacao.arquivosAnalisados.map((f, i) => (
                          <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                            {f.split('/').pop()}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="space-y-2">
                      {validacao.testes.map((tv, i) => (
                        <TestValidationCard key={i} tv={tv} />
                      ))}
                    </div>
                    <button
                      onClick={() => { setValidacao(null); setValidacaoError(null); }}
                      className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      Limpar validação
                    </button>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {result.exemploTeste && (
              <CollapsibleSection
                defaultOpen={false}
                icon={<Code2 className="h-4 w-4 text-muted-foreground shrink-0" />}
                title="Exemplo de teste"
              >
                <pre className="text-xs bg-zinc-950 text-zinc-100 rounded-lg p-4 overflow-x-auto max-h-64 overflow-y-auto leading-relaxed ml-7 mb-3">
                  <code>{result.exemploTeste}</code>
                </pre>
              </CollapsibleSection>
            )}

            {/* Ação prioritária — sempre visível */}
            <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 p-4 mt-2">
              <Lightbulb className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-green-700 uppercase tracking-wider mb-1">Ação prioritária recomendada</p>
                <p className="text-sm text-green-900 leading-relaxed">{result.acaoPrioritaria}</p>
              </div>
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ClusterCard({ cluster, index }: { cluster: ClusterDefeitos; index: number }) {
  const [expandedCards, setExpandedCards] = useState(false);
  const [expandedCausa, setExpandedCausa] = useState(false);
  const [iaOpen, setIaOpen] = useState(false);
  const cfg = TIPO_CONFIG[cluster.tipo];
  const dateMin = cluster.defeitos[0].created.slice(0, 10);
  const dateMax = cluster.defeitos[cluster.defeitos.length - 1].created.slice(0, 10);
  const versoes = [...new Set(cluster.defeitos.map((d) => d.versaoOrigem).filter(Boolean))];

  const CAUSA_PREVIEW = 220;
  const causaLonga = cluster.causaRepresentativa.length > CAUSA_PREVIEW;

  return (
    <Card className={`border ${cfg.border} ${cfg.bg}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">#{index + 1}</span>
            <TipoBadge tipo={cluster.tipo} />
            <span className="text-sm font-medium">{stripHtml(cluster.funcionalidade)}</span>
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <span className="text-xs font-semibold text-muted-foreground">
              {cluster.defeitos.length} ocorrências
            </span>
            <SimBar value={cluster.maxSimilarity} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {dateMin === dateMax ? dateMin : `${dateMin} → ${dateMax}`}
          {versoes.length > 0 && (
            <span className="ml-2 font-mono">· {versoes.join(', ')}</span>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {cluster.causaRepresentativa && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-0.5">Causa representativa</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {expandedCausa || !causaLonga
                ? cluster.causaRepresentativa
                : cluster.causaRepresentativa.slice(0, CAUSA_PREVIEW) + '…'}
            </p>
            {causaLonga && (
              <button
                onClick={() => setExpandedCausa((v) => !v)}
                className="text-xs text-primary underline underline-offset-2 hover:opacity-80 mt-1"
              >
                {expandedCausa ? 'Ver menos' : 'Ver completo'}
              </button>
            )}
          </div>
        )}

        <div className="bg-white/60 rounded p-2 border border-current/10">
          <p className="text-xs font-semibold text-muted-foreground mb-0.5">Plano de ação</p>
          <p className="text-sm">{cluster.planoDeAcao}</p>
        </div>

        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setExpandedCards((v) => !v)}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {expandedCards ? 'Ocultar cards' : `Ver ${cluster.defeitos.length} cards do RTC`}
            </button>
            <button
              onClick={() => setIaOpen(true)}
              className="text-xs text-primary underline underline-offset-2 hover:opacity-80 flex items-center gap-1"
            >
              <Brain className="h-3 w-3" />Analisar com IA
            </button>
          </div>
          {expandedCards && (
            <div className="mt-2 space-y-2">
              {cluster.defeitos.map((d) => (
                <div key={d.id} className="rounded border border-current/10 bg-white/50 p-2 text-xs space-y-0.5">
                  <div className="flex items-start gap-1.5">
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0">
                      #{d.id}
                    </span>
                    <span className="font-medium text-foreground">{stripHtml(d.title)}</span>
                  </div>
                  {d.causa && (
                    <p className="text-muted-foreground pl-1 line-clamp-2">{stripHtml(d.causa)}</p>
                  )}
                  <p className="text-muted-foreground pl-1">
                    {d.created.slice(0, 10)}
                    {d.versaoOrigem && <span className="font-mono"> · {d.versaoOrigem}</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
          <ClusterIADialog cluster={cluster} open={iaOpen} onClose={() => setIaOpen(false)} />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryBar({ clusters, total }: { clusters: ClusterDefeitos[]; total: number }) {
  const counts: Record<ClusterTipo, number> = { regressao: 0, recorrencia: 0, duplicata: 0, similar: 0 };
  clusters.forEach((c) => counts[c.tipo]++);

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 items-center p-3 bg-muted/50 rounded-lg text-sm">
      <span className="text-muted-foreground">
        <span className="font-semibold text-foreground">{clusters.length}</span> grupos encontrados em{' '}
        <span className="font-semibold text-foreground">{total}</span> cards analisados
      </span>
      <span className="text-muted-foreground hidden sm:block">·</span>
      {(Object.keys(counts) as ClusterTipo[]).map((tipo) =>
        counts[tipo] > 0 ? (
          <div key={tipo} className="flex items-center gap-1.5">
            <TipoBadge tipo={tipo} />
            <span className="font-semibold">{counts[tipo]}</span>
          </div>
        ) : null
      )}
    </div>
  );
}

export default function RecorrentesPage() {
  const { config, loading: configLoading } = useSquadConfig();
  const [squadId, setSquadId] = useState('');
  const [months, setMonths] = useState(6);
  const [threshold, setThreshold] = useState(0.20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clusters, setClusters] = useState<ClusterDefeitos[] | null>(null);
  const [meta, setMeta] = useState<{ total: number; startDate: string; squadName: string } | null>(null);
  const [rawItems, setRawItems] = useState<Parameters<typeof analisarRecorrencias>[0] | null>(null);

  async function handleAnalyze() {
    if (!squadId) return;
    setLoading(true);
    setError(null);
    setClusters(null);
    setMeta(null);
    setRawItems(null);
    try {
      const res = await fetchRtcRecorrentes(squadId, months);
      if (!res) throw new Error('Endpoint indisponível em produção.');
      setRawItems(res.items);
      const clustersFound = analisarRecorrencias(res.items, threshold);
      setClusters(clustersFound);
      setMeta({ total: res.total, startDate: res.startDate, squadName: res.squadName });

      // Salva resumo no cache da Visão Geral
      const counts = { regressao: 0, recorrencia: 0, duplicata: 0, similar: 0 };
      const funcCount: Record<string, number> = {};
      const termCount: Record<string, number> = {};
      const stopwords = new Set(['de','da','do','das','dos','para','com','em','que','o','a','e',
        'não','ao','os','as','um','uma','se','por','no','na','nos','nas','foi','ser','ou','mas',
        'já','ao','ao','erro','sistema','ao','ao','ao','ao','ao','ao','ao','ao','ao','ao',
        'quando','como','ao','ao','ao','tela','campo','botão','salvar','gravar','fechar','abrir',
        'este','esta','isso','isto','seu','sua','seus','suas','mais','está','são','tem','ter',
        'após','entre','sobre','sem','também','onde','qual','quais','pelo','pela','pelos','pelas']);
      for (const c of clustersFound) {
        counts[c.tipo]++;
        funcCount[c.funcionalidade] = (funcCount[c.funcionalidade] ?? 0) + c.defeitos.length;
        const words = stripHtml(c.causaRepresentativa)
          .toLowerCase()
          .split(/[\s.,;:!?()[\]{}"'/\\-]+/)
          .filter(w => w.length > 4 && !stopwords.has(w) && !/^\d+$/.test(w));
        for (const w of words) termCount[w] = (termCount[w] ?? 0) + 1;
      }
      recorrentesCache.save({
        squadId,
        squadName: res.squadName,
        months,
        totalDefects: res.total,
        clusters: counts,
        topFuncionalidades: Object.entries(funcCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([nome, count]) => ({ nome, count })),
        topCausas: Object.entries(termCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([termo, count]) => ({ termo, count })),
        updatedAt: new Date().toISOString(),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }

  function handleThresholdChange(v: string) {
    const t = Number(v);
    setThreshold(t);
    // Re-analisa localmente sem nova busca de rede
    if (rawItems) setClusters(analisarRecorrencias(rawItems, t));
  }

  if (configLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando configuração...</div>;
  }

  if (!config) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Configuração de squads não encontrada. Acesse <strong>Configurações → Squads</strong> e exporte o{' '}
        <code>squad-config.json</code>.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Defeitos Recorrentes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Identifica grupos de defeitos similares via similaridade de causa, solução e funcionalidade (OSLC).
          Usa componentes conexos — similaridade é transitiva.
        </p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1 min-w-[200px]">
              <label className="text-sm font-medium">Squad</label>
              <Select value={squadId} onValueChange={setSquadId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o squad" />
                </SelectTrigger>
                <SelectContent>
                  {config.squads.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Histórico</label>
              <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES_OPTIONS.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m} meses
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Sensibilidade</label>
              <Select value={String(threshold)} onValueChange={handleThresholdChange}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THRESHOLD_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={String(t.value)}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleAnalyze} disabled={!squadId || loading}>
              {loading ? 'Analisando...' : 'Analisar'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <strong>Sensibilidade:</strong> Amplo encontra mais grupos mas pode gerar falsos positivos.
            Estrito é mais conservador. Recomendado: Equilibrado.
          </p>
        </CardContent>
      </Card>

      {loading && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full mb-3" />
          <p>Buscando defeitos dos últimos {months} meses e calculando similaridades...</p>
          <p className="text-xs mt-1">Pode levar alguns segundos dependendo da quantidade de cards.</p>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 text-red-700 text-sm">{error}</CardContent>
        </Card>
      )}

      {clusters !== null && meta && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              <strong>{meta.squadName}</strong> · {meta.total} defeitos buscados · a partir de{' '}
              {meta.startDate.slice(0, 10)}
            </p>
            {meta.total > 0 && (
              <p className="text-xs text-muted-foreground">
                Threshold: {Math.round(threshold * 100)}% similaridade mínima
              </p>
            )}
          </div>

          {clusters.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground space-y-2">
                <p>Nenhum grupo de defeitos similares encontrado.</p>
                <p className="text-xs">
                  Tente aumentar o período de histórico ou usar a sensibilidade <strong>Amplo</strong> para
                  detectar mais padrões.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <SummaryBar clusters={clusters} total={meta.total} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clusters.map((c, i) => (
                  <ClusterCard key={c.id} cluster={c} index={i} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
