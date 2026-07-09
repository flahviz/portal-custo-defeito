export interface DefeitoEnriquecido {
  id: string;
  title: string;
  created: string;
  resolutionDate?: string;
  type: string;
  versaoOrigem?: string;
  causa: string;
  solucao: string;
  funcionalidade: string;
}

export type ClusterTipo = 'regressao' | 'recorrencia' | 'duplicata' | 'similar';

export interface ClusterDefeitos {
  id: string;
  tipo: ClusterTipo;
  funcionalidade: string;
  defeitos: DefeitoEnriquecido[];
  causaRepresentativa: string;
  planoDeAcao: string;
  maxSimilarity: number;
}

const STOPWORDS = new Set([
  'de','da','do','das','dos','para','com','em','que','o','a','e','não','ao',
  'os','as','um','uma','se','por','no','na','nos','nas','foi','ser','ou','mas',
  'já','este','esta','isso','isto','seu','sua','seus','suas','quando','mais',
  'como','até','ele','ela','eles','elas','esse','essa','esses','essas','num',
  'numa','pelo','pela','pelos','pelas','aqui','ali','lá','então','após','está',
  'são','foi','tem','ter','há','ser','após','entre','sobre','sem','também',
  'ao','aos','às','pela','pelo','pelos','pelas','onde','qual','quais',
]);

export function stripHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;?/gi, ' ')    // cobre &nbsp; e &nbsp (sem ponto-e-vírgula)
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#\d+;?/g, ' ')
    .replace(/&[a-z]{1,8};?/gi, ' ')  // qualquer entidade HTML, com ou sem ;
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function tokenize(text: string): Set<string> {
  if (!text) return new Set();
  return new Set(
    stripHtml(text)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // remove acentos para matching mais flexível
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)) // >2 em vez de >3
  );
}

function cleanTitle(title: string): string {
  return title
    .replace(/^\d+\.\d+\.\d+-\d+\s*[-–]\s*/g, '')
    .replace(/^\[?[A-Z]{2,}_\w+\]?\s*[-–:]\s*/g, '')
    .replace(/^\d+\s*[-–:]\s*/g, '')
    .replace(/^\s*\[.*?\]\s*/g, '')
    .trim();
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

// Retorna similaridade entre 0..1
// Adapta pesos conforme campos disponíveis
export function computeSimilarity(a: DefeitoEnriquecido, b: DefeitoEnriquecido): number {
  // funcionalidade: bônus/penalidade suave — não bloqueia completamente
  const funcA = a.funcionalidade?.trim() ?? '';
  const funcB = b.funcionalidade?.trim() ?? '';
  let funcFactor = 1.0;
  if (funcA && funcB) {
    if (funcA === funcB) {
      funcFactor = 1.2; // bônus: mesma funcionalidade
    } else {
      // tokenize funcionalidade para comparação parcial
      const fTokA = tokenize(funcA);
      const fTokB = tokenize(funcB);
      const fSim = jaccard(fTokA, fTokB);
      if (fSim < 0.15) funcFactor = 0.65; // penalidade suave para funcionalidades bem diferentes
    }
  }

  const titA = tokenize(cleanTitle(a.title));
  const titB = tokenize(cleanTitle(b.title));
  const titSim = jaccard(titA, titB);

  const causaA = tokenize(a.causa);
  const causaB = tokenize(b.causa);
  const hasCausa = causaA.size > 2 && causaB.size > 2;
  const causaSim = hasCausa ? jaccard(causaA, causaB) : 0;

  const solA = tokenize(a.solucao);
  const solB = tokenize(b.solucao);
  const hasSol = solA.size > 2 && solB.size > 2;
  const solSim = hasSol ? jaccard(solA, solB) : 0;

  let score: number;
  if (hasCausa && hasSol) {
    score = causaSim * 0.5 + titSim * 0.3 + solSim * 0.2;
  } else if (hasCausa) {
    score = causaSim * 0.6 + titSim * 0.4;
  } else if (hasSol) {
    score = solSim * 0.6 + titSim * 0.4;
  } else {
    // Só título disponível — usa jaccard puro do título
    score = titSim;
  }

  return Math.min(1, score * funcFactor);
}

function parseVersion(v?: string): number[] {
  const m = v?.match(/(\d+)\.(\d+)\.(\d+)-(\d+)/);
  return m ? [+m[1], +m[2], +m[3], +m[4]] : [0, 0, 0, 0];
}

function cmpVersion(a: number[], b: number[]): number {
  for (let i = 0; i < 4; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

function classifyCluster(items: DefeitoEnriquecido[], maxSim: number): ClusterTipo {
  const sorted = [...items].sort(
    (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
  );
  const spanDays =
    (new Date(sorted[sorted.length - 1].created).getTime() - new Date(sorted[0].created).getTime()) /
    86400000;

  if (maxSim >= 0.65 && spanDays <= 30) return 'duplicata';

  const versioned = sorted
    .filter((d) => d.versaoOrigem)
    .map((d) => ({ d, v: parseVersion(d.versaoOrigem) }));

  if (versioned.length >= 2) {
    const hasProgression = versioned.some(
      (cur, i) => i > 0 && cmpVersion(cur.v, versioned[i - 1].v) > 0
    );
    const hasGap = sorted.some(
      (d, i) =>
        i < sorted.length - 1 &&
        d.resolutionDate &&
        new Date(d.resolutionDate) < new Date(sorted[i + 1].created)
    );
    if (hasProgression && hasGap) return 'regressao';
  }

  if (spanDays > 60) return 'recorrencia';
  return 'similar';
}

function getActionPlan(tipo: ClusterTipo, func: string, n: number): string {
  switch (tipo) {
    case 'regressao':
      return `O problema em "${func}" foi corrigido mas voltou em versões posteriores (${n} ocorrências). Revise se a correção original foi completa e adicione testes automatizados de regressão cobrindo esse cenário.`;
    case 'recorrencia':
      return `O mesmo tipo de problema em "${func}" ocorreu ${n} vezes em períodos distintos — a causa raiz não foi tratada. Investigue se há problema estrutural no módulo ou fluxo de validação incompleto.`;
    case 'duplicata':
      return `${n} registros descrevem o mesmo problema em "${func}" dentro de um curto período. Consolide esses cards em um único registro e oriente a equipe sobre verificação de duplicatas antes de abrir novos defeitos.`;
    case 'similar':
      return `${n} defeitos relacionados em "${func}" sugerem fragilidade no módulo. Avalie se uma refatoração preventiva eliminaria a raiz comum desses problemas.`;
  }
}

// Clustering por componentes conexos (grafo de similaridade)
// Garante transitividade: se A~B e B~C, todos ficam no mesmo cluster
export function analisarRecorrencias(
  defeitos: DefeitoEnriquecido[],
  threshold = 0.20
): ClusterDefeitos[] {
  if (defeitos.length === 0) return [];
  const n = defeitos.length;

  // Construir arestas (somente acima do threshold)
  const adj: Set<number>[] = Array.from({ length: n }, () => new Set());
  const pairSim: Map<string, number> = new Map();

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = computeSimilarity(defeitos[i], defeitos[j]);
      if (sim >= threshold) {
        adj[i].add(j);
        adj[j].add(i);
        pairSim.set(`${i}-${j}`, sim);
      }
    }
  }

  // BFS para encontrar componentes conexos
  const visited = new Uint8Array(n);
  const components: number[][] = [];

  for (let start = 0; start < n; start++) {
    if (visited[start]) continue;
    const component: number[] = [];
    const queue: number[] = [start];
    visited[start] = 1;
    while (queue.length > 0) {
      const cur = queue.shift()!;
      component.push(cur);
      for (const nb of adj[cur]) {
        if (!visited[nb]) {
          visited[nb] = 1;
          queue.push(nb);
        }
      }
    }
    components.push(component);
  }

  return components
    .filter((c) => c.length >= 2)
    .map((idxs, ci) => {
      // Calcular similaridade máxima dentro do cluster
      let maxSim = 0;
      for (let i = 0; i < idxs.length; i++) {
        for (let j = i + 1; j < idxs.length; j++) {
          const key = `${Math.min(idxs[i], idxs[j])}-${Math.max(idxs[i], idxs[j])}`;
          const s = pairSim.get(key) ?? 0;
          if (s > maxSim) maxSim = s;
        }
      }

      const items = idxs
        .map((i) => defeitos[i])
        .sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());

      // Funcionalidade mais comum no cluster
      const funcCount: Record<string, number> = {};
      for (const d of items) {
        if (d.funcionalidade) funcCount[d.funcionalidade] = (funcCount[d.funcionalidade] ?? 0) + 1;
      }
      const funcionalidade =
        Object.entries(funcCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Não identificado';

      const tipo = classifyCluster(items, maxSim);

      // Causa representativa: o texto mais longo e informativo
      const causaRepresentativa = stripHtml(
        [...items]
          .filter((d) => d.causa && d.causa.trim().length > 20)
          .sort((a, b) => b.causa.length - a.causa.length)[0]?.causa ?? items[0].title
      );

      return {
        id: `cluster-${ci}`,
        tipo,
        funcionalidade,
        defeitos: items,
        causaRepresentativa,
        planoDeAcao: getActionPlan(tipo, funcionalidade, items.length),
        maxSimilarity: maxSim,
      } as ClusterDefeitos;
    })
    .sort((a, b) => b.defeitos.length - a.defeitos.length || b.maxSimilarity - a.maxSimilarity);
}
