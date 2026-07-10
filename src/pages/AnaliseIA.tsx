import { useState } from 'react';
import { Brain, CheckCircle2, AlertTriangle, Code2, Shield, ClipboardList, GitBranch, FileCode2, TestTube2, Loader2, ChevronDown, ChevronUp, ExternalLink, Wrench, Ban, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { fetchRtcCard, analyzeDefectFull, type RtcCard, type FullAnalysis, type DefectScenario } from '@/lib/claudeService';
import { findMRForDefect, getMRChanges, findTestFiles, type MRInfo, type TestFileInfo } from '@/lib/gitlabDefectService';

const IS_DEV = import.meta.env.DEV;

// ── Step pipeline ────────────────────────────────────────────────────────────

type StepId = 'rtc' | 'mr' | 'diffs' | 'tests' | 'ai';
type StepStatus = 'pending' | 'loading' | 'done' | 'skipped' | 'error';

const STEP_LABELS: Record<StepId, string> = {
  rtc:   'Buscando defeito no RTC',
  mr:    'Procurando MR de correção no GitLab',
  diffs: 'Analisando arquivos alterados',
  tests: 'Buscando testes existentes no repositório',
  ai:    'Gerando análise com IA',
};

function StepRow({ id, status, detail }: { id: StepId; status: StepStatus; detail?: string }) {
  const icons: Record<StepStatus, React.ReactNode> = {
    pending: <span className="w-4 h-4 rounded-full border border-border shrink-0" />,
    loading: <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />,
    done:    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />,
    skipped: <span className="w-4 h-4 text-muted-foreground/40 shrink-0 flex items-center">—</span>,
    error:   <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />,
  };
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5">{icons[status]}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${status === 'pending' ? 'text-muted-foreground/50' : status === 'error' ? 'text-red-400' : 'text-foreground'}`}>
          {STEP_LABELS[id]}
        </p>
        {detail && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{detail}</p>
        )}
      </div>
    </div>
  );
}

// ── Scenario card ─────────────────────────────────────────────────────────────

const SCENARIO_CONFIG: Record<DefectScenario['status'], { label: string; color: string; bg: string; border: string; Icon: React.ElementType }> = {
  'implementavel':       { label: 'Implementável',       color: 'text-green-400',  bg: 'bg-green-500/8',   border: 'border-green-500/25',  Icon: CheckCircle2 },
  'ja-existe':           { label: 'Já existe',           color: 'text-blue-400',   bg: 'bg-blue-500/8',    border: 'border-blue-500/25',   Icon: Search },
  'requer-refatoracao':  { label: 'Requer refatoração',  color: 'text-amber-400',  bg: 'bg-amber-500/8',   border: 'border-amber-500/25',  Icon: Wrench },
  'requer-isolamento':   { label: 'Requer isolamento',   color: 'text-orange-400', bg: 'bg-orange-500/8',  border: 'border-orange-500/25', Icon: Ban },
};

function ScenarioCard({ scenario, index }: { scenario: DefectScenario; index: number }) {
  const [open, setOpen] = useState(false);
  const cfg = SCENARIO_CONFIG[scenario.status] ?? SCENARIO_CONFIG['requer-refatoracao'];
  const Icon = cfg.Icon;

  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/3 transition-colors rounded-lg"
      >
        <Icon className={`h-4 w-4 ${cfg.color} mt-0.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cfg.color} border-current`}>
              {cfg.label}
            </Badge>
            {scenario.arquivo && (
              <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[240px]">
                {scenario.arquivo.split('/').pop()}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground">{scenario.descricao}</p>
          <p className="text-xs text-muted-foreground mt-1">{scenario.motivo}</p>
        </div>
        <span className="text-xs text-muted-foreground/50 font-mono shrink-0">#{index + 1}</span>
        {scenario.codigoExemplo && (
          open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && scenario.codigoExemplo && (
        <div className="px-4 pb-4">
          <pre className="text-xs bg-zinc-950 text-zinc-100 rounded-lg p-4 overflow-x-auto leading-relaxed max-h-64 overflow-y-auto">
            <code>{scenario.codigoExemplo}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnaliseIA() {
  const [cardInput, setCardInput] = useState('');
  const [gitlabToken, setGitlabToken] = useState(() => localStorage.getItem('radar_gitlab_token') ?? '');

  const [steps, setSteps] = useState<Record<StepId, StepStatus>>({
    rtc: 'pending', mr: 'pending', diffs: 'pending', tests: 'pending', ai: 'pending',
  });
  const [stepDetails, setStepDetails] = useState<Partial<Record<StepId, string>>>({});

  const [card, setCard] = useState<RtcCard | null>(null);
  const [mr, setMr] = useState<MRInfo | null>(null);
  const [testFiles, setTestFiles] = useState<TestFileInfo[]>([]);
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  function setStep(id: StepId, status: StepStatus, detail?: string) {
    setSteps(s => ({ ...s, [id]: status }));
    if (detail !== undefined) setStepDetails(d => ({ ...d, [id]: detail }));
  }

  async function handleAnalyze() {
    const id = cardInput.trim().replace(/^#/, '');
    if (!id) return;
    if (gitlabToken) localStorage.setItem('radar_gitlab_token', gitlabToken);

    setRunning(true);
    setError(null);
    setCard(null); setMr(null); setTestFiles([]); setAnalysis(null);
    setSteps({ rtc: 'loading', mr: 'pending', diffs: 'pending', tests: 'pending', ai: 'pending' });
    setStepDetails({});

    try {
      // Step 1 — RTC
      const fetchedCard = await fetchRtcCard(id);
      if (!fetchedCard) throw new Error(`Card #${id} não encontrado`);
      setCard(fetchedCard);
      setStep('rtc', 'done', `#${fetchedCard.id} — ${fetchedCard.title}`);

      // Step 2 — MR
      let fetchedMr: MRInfo | null = null;
      if (gitlabToken) {
        setStep('mr', 'loading');
        fetchedMr = await findMRForDefect(id, gitlabToken);
        if (fetchedMr) {
          setStep('mr', 'done', `!${fetchedMr.iid} — ${fetchedMr.title}`);
        } else {
          setStep('mr', 'skipped', 'Nenhum MR com este ID encontrado');
        }
      } else {
        setStep('mr', 'skipped', 'Token GitLab não informado');
      }

      // Step 3 — Diffs
      let fetchedTestFiles: TestFileInfo[] = [];
      if (fetchedMr && gitlabToken) {
        setStep('diffs', 'loading');
        const { changedFiles, diffsContext } = await getMRChanges(fetchedMr.iid, gitlabToken);
        fetchedMr = { ...fetchedMr, changedFiles, diffsContext };
        setMr(fetchedMr);
        setStep('diffs', 'done', `${changedFiles.length} arquivo(s): ${changedFiles.slice(0, 2).map(f => f.split('/').pop()).join(', ')}${changedFiles.length > 2 ? '...' : ''}`);

        // Step 4 — Test files
        setStep('tests', 'loading');
        fetchedTestFiles = await findTestFiles(changedFiles, gitlabToken);
        setTestFiles(fetchedTestFiles);
        if (fetchedTestFiles.length > 0) {
          setStep('tests', 'done', `${fetchedTestFiles.length} arquivo(s): ${fetchedTestFiles.map(f => f.path.split('/').pop()).join(', ')}`);
        } else {
          setStep('tests', 'skipped', 'Nenhum arquivo de teste encontrado nos diretórios alterados');
        }
      } else {
        setStep('diffs', 'skipped', 'Requer MR encontrado');
        setStep('tests', 'skipped', 'Requer MR encontrado');
      }

      // Step 5 — Claude
      setStep('ai', 'loading', 'Pode levar 20–40 segundos...');
      const result = await analyzeDefectFull(
        fetchedCard,
        fetchedMr,
        fetchedTestFiles.map(tf => ({ path: tf.path, content: tf.content })),
      );
      setAnalysis(result);
      setStep('ai', 'done', `${result.cenarios?.length ?? 0} cenário(s) gerado(s)`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
      setSteps(s => {
        const next = { ...s };
        (Object.keys(next) as StepId[]).forEach(k => { if (next[k] === 'loading') next[k] = 'error'; });
        return next;
      });
    } finally {
      setRunning(false);
    }
  }

  const isStarted = steps.rtc !== 'pending' || running;

  const implementaveis = analysis?.cenarios.filter(c => c.status === 'implementavel' || c.status === 'ja-existe').length ?? 0;
  const pendentes = analysis?.cenarios.filter(c => c.status === 'requer-refatoracao' || c.status === 'requer-isolamento').length ?? 0;

  return (
    <div className="space-y-8 max-w-5xl">

      {/* Header */}
      <div>
        <p className="text-[11px] font-mono text-muted-foreground/60 tracking-[0.2em] uppercase mb-3">
          Inteligência Artificial · Vertical Procuradorias
        </p>
        <h1 className="text-4xl font-bold text-foreground">
          Análise de Defeito com <span style={{ color: '#ec4899' }}>IA</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-xl">
          Informe o ID do defeito RTC. A IA busca o MR de correção no GitLab, analisa os arquivos alterados,
          identifica testes existentes e sugere cenários implementáveis no código do projeto.
        </p>
      </div>

      {!IS_DEV && (
        <Card className="border-yellow-500/25 bg-yellow-500/8">
          <CardContent className="pt-4 text-sm text-yellow-300">
            <strong>Atenção:</strong> Esta funcionalidade requer o servidor de desenvolvimento local (<code>bun dev</code>) com <code>RTC_USER</code>, <code>RTC_PASS</code> e <code>ANTHROPIC_API_KEY</code> no arquivo <code>.env</code>.
          </CardContent>
        </Card>
      )}

      {/* Input */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5 min-w-[160px]">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Card RTC</Label>
              <Input
                placeholder="ex: 884047"
                value={cardInput}
                onChange={e => setCardInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !running && handleAnalyze()}
                className="w-40 font-mono"
                disabled={running}
              />
            </div>
            <div className="space-y-1.5 flex-1 min-w-[240px]">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Token GitLab <span className="normal-case text-muted-foreground/50">(para buscar MR e testes — recomendado)</span>
              </Label>
              <Input
                type="password"
                placeholder="glpat-..."
                value={gitlabToken}
                onChange={e => setGitlabToken(e.target.value)}
                disabled={running}
              />
            </div>
            <Button onClick={handleAnalyze} disabled={!cardInput.trim() || running || !IS_DEV} className="shrink-0">
              {running ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analisando...</> : <><Brain className="h-4 w-4 mr-2" />Analisar</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline */}
      {isStarted && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-muted-foreground/60 tracking-wider uppercase">
              // Pipeline de análise
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/50">
            {(Object.keys(steps) as StepId[]).map(id => (
              <StepRow key={id} id={id} status={steps[id]} detail={stepDetails[id]} />
            ))}
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/8 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {analysis && card && (
        <div className="space-y-6">

          {/* Summary bar */}
          <div className="flex flex-wrap gap-4 items-center p-4 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">#{card.id}</span>
              <span className="text-sm text-muted-foreground truncate max-w-sm">{card.title}</span>
            </div>
            {mr && (
              <>
                <span className="text-muted-foreground/40 hidden sm:block">·</span>
                <a href={mr.webUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#3b82f6] hover:underline">
                  <GitBranch className="h-3 w-3" />
                  !{mr.iid}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <span className="text-xs text-muted-foreground">{mr.changedFiles.length} arquivo(s) alterado(s)</span>
              </>
            )}
            {testFiles.length > 0 && (
              <>
                <span className="text-muted-foreground/40 hidden sm:block">·</span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TestTube2 className="h-3 w-3" />
                  {testFiles.reduce((a, f) => a + f.testsCount, 0)} testes em {testFiles.length} arquivo(s)
                </span>
              </>
            )}
            <div className="ml-auto flex gap-2">
              {implementaveis > 0 && (
                <Badge variant="outline" className="text-green-400 border-green-500/25 text-[10px]">
                  {implementaveis} implementáveis
                </Badge>
              )}
              {pendentes > 0 && (
                <Badge variant="outline" className="text-amber-400 border-amber-500/25 text-[10px]">
                  {pendentes} com bloqueio
                </Badge>
              )}
            </div>
          </div>

          {/* Scenarios — main value */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-mono text-muted-foreground/60 tracking-[0.18em] uppercase shrink-0">
                // Cenários de teste
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-2">
              {analysis.cenarios.map((c, i) => (
                <ScenarioCard key={i} scenario={c} index={i} />
              ))}
            </div>
          </div>

          {/* Causa raiz */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-mono text-muted-foreground/60 tracking-[0.18em] uppercase shrink-0">
                // Causa raiz
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <Card>
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <Brain className="h-4 w-4 text-[#ec4899] mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{analysis.causaRaiz}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Como evitar + Checklist */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-mono text-muted-foreground/60 tracking-[0.18em] uppercase shrink-0">
                  // Como evitar
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <Card>
                <CardContent className="pt-4">
                  <ul className="space-y-2">
                    {analysis.comoEvitar.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <Shield className="h-3.5 w-3.5 text-[#ec4899] mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-mono text-muted-foreground/60 tracking-[0.18em] uppercase shrink-0">
                  // Checklist de review
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <Card>
                <CardContent className="pt-4">
                  <ul className="space-y-2">
                    {analysis.checklistReview.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <ClipboardList className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Changed files + test files detail (collapsible) */}
          {(mr?.changedFiles.length || testFiles.length > 0) && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-mono text-muted-foreground/60 tracking-[0.18em] uppercase shrink-0">
                  // Contexto do código
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {mr && mr.changedFiles.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Code2 className="h-4 w-4 text-muted-foreground" />
                        Arquivos alterados no MR !{mr.iid}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {mr.changedFiles.map(f => (
                          <li key={f} className="text-xs font-mono text-muted-foreground truncate">
                            {f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {testFiles.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TestTube2 className="h-4 w-4 text-muted-foreground" />
                        Arquivos de teste encontrados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {testFiles.map(f => (
                          <li key={f.path} className="text-xs font-mono">
                            <span className="text-muted-foreground truncate block">{f.path}</span>
                            <span className="text-muted-foreground/50">{f.testsCount} procedure(s) de teste</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
