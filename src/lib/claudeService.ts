const IS_DEV = import.meta.env.DEV;

export interface RtcCard {
  id: string;
  title: string;
  description: string;
  status: string;
  created: string;
  resolutionDate: string | null;
  versaoOrigem: string;
  causa: string;
  solucao: string;
  funcionalidade: string;
}

export interface DefectAnalysis {
  causaRaiz: string;
  testesUnitarios: string[];
  testesIntegracao: string[];
  exemploTeste: string;
  comoEvitar: string[];
  checklistReview: string[];
}

export interface ClusterAnalysis {
  causaRaizComum: string;
  tipoProblema: string;
  solucaoEstrutural: string;
  testesRegressao: string[];
  exemploTeste: string;
  acaoPrioritaria: string;
}

export async function fetchRtcCard(cardId: string): Promise<RtcCard | null> {
  if (!IS_DEV) return null;
  const res = await fetch(`/api/rtc/card/${cardId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `Erro ${res.status}`);
  }
  return res.json();
}

export async function analyzeDefect(card: RtcCard): Promise<DefectAnalysis> {
  if (!IS_DEV) throw new Error("Análise com IA disponível apenas em modo de desenvolvimento.");
  const res = await fetch("/api/claude/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "defect", defect: card }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `Erro ${res.status}`);
  }
  return res.json();
}

export interface TestValidation {
  teste: string;
  status: 'implementavel' | 'requer-refatoracao' | 'nao-testavel';
  motivo: string;
  comoImplementar?: string;
}

export interface ValidacaoResult {
  arquivosAnalisados: string[];
  testes: TestValidation[];
}

export async function validateTests(
  testes: string[],
  cluster: Record<string, unknown>,
  gitlabToken: string,
  analysis?: ClusterAnalysis
): Promise<ValidacaoResult> {
  if (!IS_DEV) throw new Error("Validação disponível apenas em modo de desenvolvimento.");
  const res = await fetch("/api/claude/validate-tests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ testes, cluster, gitlabToken, analysis }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `Erro ${res.status}`);
  }
  return res.json();
}

// ── Análise completa de defeito com contexto do código ───────────────────────

export interface DefectScenario {
  descricao: string;
  status: 'implementavel' | 'ja-existe' | 'requer-refatoracao' | 'requer-isolamento';
  motivo: string;
  arquivo: string | null;
  codigoExemplo: string | null;
}

export interface FullAnalysis {
  causaRaiz: string;
  cenarios: DefectScenario[];
  comoEvitar: string[];
  checklistReview: string[];
}

export async function analyzeDefectFull(
  card: RtcCard,
  mr: { iid: number; title: string; webUrl: string; mergedAt: string; changedFiles: string[]; diffsContext: string } | null,
  testFiles: { path: string; content: string }[],
): Promise<FullAnalysis> {
  if (!IS_DEV) throw new Error('Disponível apenas em modo de desenvolvimento.');
  const res = await fetch('/api/claude/analyze-defect-full', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ card, mr, testFiles }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((err as { error: string }).error ?? `Erro ${res.status}`);
  }
  return res.json();
}

export async function analyzeCluster(cluster: Record<string, unknown>): Promise<ClusterAnalysis> {
  if (!IS_DEV) throw new Error("Análise com IA disponível apenas em modo de desenvolvimento.");
  const res = await fetch("/api/claude/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "cluster", cluster }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `Erro ${res.status}`);
  }
  return res.json();
}
