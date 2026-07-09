import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSquadConfig } from '@/hooks/useSquadConfig';
import { fetchInsightsData, InsightsData } from '@/lib/insightsService';
import { fetchGitLabTags, groupTagsByBase, filterByDateRange, ReleaseInfo } from '@/lib/issCalculations';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, Tooltip, SimpleTooltip,
} from '@/components/charts/SimpleChart';
import {
  Flame, Clock, GitBranch, Users, Loader2, AlertTriangle,
  CheckCircle2, TrendingUp, Calendar, FileCode2, CircleDot,
} from 'lucide-react';

const MESES_OPTIONS = [3, 6, 9, 12, 18, 24];

// ── Mapa de Calor ─────────────────────────────────────────────────────────────

function MapaCalor({ data }: { data: InsightsData }) {
  const top = data.mapaCalor.slice(0, 12);
  const max = top[0]?.total ?? 1;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Top funcionalidades por volume de defeitos — {data.totalDefects} defeitos em {data.months} meses
      </p>

      <div className="space-y-2">
        {top.map((f, i) => {
          const pct = Math.round((f.total / max) * 100);
          const heat = pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-orange-400' : pct >= 30 ? 'bg-yellow-400' : 'bg-blue-400';
          return (
            <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
              <div>
                <p className="text-sm font-medium truncate" title={f.funcionalidade}>{f.funcionalidade}</p>
                <div className="h-2 bg-muted rounded-full mt-1 overflow-hidden">
                  <div className={`h-full rounded-full ${heat}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="text-right w-12">
                <p className="text-sm font-bold">{f.total}</p>
                <p className="text-[10px] text-muted-foreground">total</p>
              </div>
              <div className="text-right w-16">
                <p className="text-sm text-orange-600 font-medium">{f.abertos}</p>
                <p className="text-[10px] text-muted-foreground">abertos</p>
              </div>
              <div className="text-right w-16">
                {f.mttrDias !== null ? (
                  <>
                    <p className="text-sm font-medium">{f.mttrDias}d</p>
                    <p className="text-[10px] text-muted-foreground">MTTR</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {data.mapaCalor.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível.</p>
      )}
    </div>
  );
}

// ── MTTR ──────────────────────────────────────────────────────────────────────

function MttrPanel({ data }: { data: InsightsData }) {
  const mttrData = data.mttrPorFuncionalidade.map(f => ({
    label: f.funcionalidade.length > 20 ? f.funcionalidade.slice(0, 18) + '…' : f.funcionalidade,
    dias: f.mediaDias,
    total: f.total,
    full: f.funcionalidade,
  }));

  const mttrStatus = data.mttrGeral === null ? null
    : data.mttrGeral <= 3 ? { label: 'Excelente', color: '#22c55e' }
    : data.mttrGeral <= 7 ? { label: 'Bom', color: '#86efac' }
    : data.mttrGeral <= 15 ? { label: 'Atenção', color: '#f59e0b' }
    : { label: 'Crítico', color: '#ef4444' };

  return (
    <div className="space-y-6">
      {/* Geral */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">MTTR Geral</p>
          <div
            className="text-4xl font-bold"
            style={{ color: mttrStatus?.color ?? 'hsl(var(--foreground))' }}
          >
            {data.mttrGeral !== null ? `${data.mttrGeral}d` : '—'}
          </div>
          {mttrStatus && (
            <Badge variant="outline" className="mt-1 text-xs" style={{ borderColor: mttrStatus.color, color: mttrStatus.color }}>
              {mttrStatus.label}
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>≤ 3 dias → Excelente (hotfix ágil)</p>
          <p>4–7 dias → Bom</p>
          <p>8–15 dias → Atenção</p>
          <p>&gt; 15 dias → Crítico (acumula débito)</p>
        </div>
      </div>

      {/* Por funcionalidade */}
      {mttrData.length > 0 && (
        <>
          <p className="text-sm font-medium">MTTR por funcionalidade (mínimo 2 defeitos resolvidos)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mttrData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" unit="d" />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={110} stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<SimpleTooltip formatter={(v: number) => `${v} dias`} />} />
                <Bar dataKey="dias" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

// ── Tendência Mensal ──────────────────────────────────────────────────────────

function TendenciaPanel({ data }: { data: InsightsData }) {
  const chartData = data.tendenciaMensal.slice(-12).map(m => ({
    mes: new Date(`${m.mes}-01T00:00:00Z`).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    abertos: m.total - m.resolvidos,
    resolvidos: m.resolvidos,
    total: m.total,
  }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Volume de defeitos por mês — abertos vs resolvidos</p>
      {chartData.length > 1 ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip content={<SimpleTooltip />} />
              <Bar dataKey="resolvidos" fill="#22c55e" radius={[4, 4, 0, 0]} name="Resolvidos" />
              <Bar dataKey="abertos" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Abertos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">Dados insuficientes para tendência mensal.</p>
      )}
    </div>
  );
}

// ── Correlação Deploy → Defeito ───────────────────────────────────────────────

function CorrelacaoPanel({ insights }: { insights: InsightsData }) {
  const [token, setToken] = useState('');
  const [releases, setReleases] = useState<ReleaseInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const GITLAB_PROJECT = 'softplan/justica/procuradorias/saj-procuradorias/pge-net';

  async function fetchReleases() {
    setLoading(true); setError(null);
    try {
      const tags = await fetchGitLabTags(GITLAB_PROJECT, token);
      setReleases(groupTagsByBase(tags));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar releases.');
    } finally {
      setLoading(false);
    }
  }

  // Para cada release, conta quantos defeitos foram criados nos 14 dias seguintes
  const correlacao = releases.slice(0, 16).map(r => {
    const releaseDate = r.createdAt;
    const windowEnd = new Date(releaseDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const defeitosApos = (insights as { tendenciaMensal: { mes: string; total: number }[] }).tendenciaMensal.reduce((sum, m) => {
      // approximation por mês — só temos granularidade mensal nos dados locais
      const mesDate = new Date(`${m.mes}-15T00:00:00Z`);
      if (mesDate >= releaseDate && mesDate < windowEnd) return sum + m.total;
      return sum;
    }, 0);
    return {
      release: r.base,
      rc: r.maxRc,
      date: r.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      defeitosApos,
      quality: r.maxRc === 1 ? 'clean' : r.maxRc <= 3 ? 'ok' : 'ruim',
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1 max-w-sm">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Token GitLab (para buscar releases)</label>
          <Input type="password" placeholder="glpat-..." value={token} onChange={e => setToken(e.target.value)} />
        </div>
        <Button onClick={fetchReleases} disabled={!token || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <GitBranch className="h-4 w-4 mr-2" />}
          Buscar Releases
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {releases.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">{releases.length} releases encontradas · qualidade baseada no RC máximo</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 font-medium">Release</th>
                  <th className="text-left p-2 font-medium">Data</th>
                  <th className="text-center p-2 font-medium">RC máx.</th>
                  <th className="text-center p-2 font-medium">Qualidade</th>
                </tr>
              </thead>
              <tbody>
                {correlacao.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-2 font-mono text-xs">{r.release}</td>
                    <td className="p-2 text-muted-foreground">{r.date}</td>
                    <td className="p-2 text-center">
                      <Badge variant="secondary" className="text-xs font-mono">RC{r.rc}</Badge>
                    </td>
                    <td className="p-2 text-center">
                      {r.quality === 'clean' && <span className="flex items-center justify-center gap-1 text-green-700 text-xs"><CheckCircle2 className="h-3.5 w-3.5" />Deploy limpo</span>}
                      {r.quality === 'ok' && <span className="flex items-center justify-center gap-1 text-yellow-700 text-xs"><CheckCircle2 className="h-3.5 w-3.5" />Validação normal</span>}
                      {r.quality === 'ruim' && <span className="flex items-center justify-center gap-1 text-blue-700 text-xs"><CheckCircle2 className="h-3.5 w-3.5" />Validação intensa</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-6 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" />RC1 = deploy direto</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-yellow-500" />RC2–3 = ciclos normais de validação</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />RC4+ = validação intensa, defeitos contidos antes do cliente</span>
          </div>
        </>
      )}

      {releases.length === 0 && !loading && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Informe o token GitLab para carregar o histórico de releases e calcular a correlação com defeitos.
        </div>
      )}
    </div>
  );
}

// ── Comparativo entre Squads ──────────────────────────────────────────────────

function ComparativoPanel({ squads, months }: { squads: Array<{ id: string; name: string }>; months: number }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<InsightsData[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function fetchAll() {
    setLoading(true); setError(null); setResults([]);
    try {
      const all = await Promise.all(squads.map(s => fetchInsightsData(s.id, months)));
      setResults(all.filter((r): r is InsightsData => r !== null));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar dados.');
    } finally {
      setLoading(false);
    }
  }

  if (!import.meta.env.DEV) {
    return <p className="text-sm text-muted-foreground py-4">Comparativo disponível apenas em modo de desenvolvimento (requer proxy RTC).</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground">{squads.length} squads configurados</p>
        <Button onClick={fetchAll} disabled={loading} variant="outline" size="sm">
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
          {loading ? 'Buscando...' : 'Buscar todos os squads'}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map(r => (
            <Card key={r.squadId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{r.squadName}</CardTitle>
                <p className="text-xs text-muted-foreground">últimos {r.months} meses</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total defeitos</span>
                  <span className="font-bold">{r.totalDefects}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MTTR geral</span>
                  <span className="font-bold">{r.mttrGeral !== null ? `${r.mttrGeral}d` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Funcionalidades afetadas</span>
                  <span className="font-bold">{r.mapaCalor.length}</span>
                </div>
                {r.mapaCalor[0] && (
                  <div className="text-xs text-muted-foreground pt-1 border-t border-border">
                    Hotspot: <span className="font-medium text-foreground">{r.mapaCalor[0].funcionalidade}</span> ({r.mapaCalor[0].total})
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {results.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-8">Clique em "Buscar todos os squads" para comparar.</p>
      )}
    </div>
  );
}

// ── Arquivos × Defeitos (análise real via MRs) ────────────────────────────────

const GITLAB_ENCODED = encodeURIComponent('softplan/justica/procuradorias/saj-procuradorias/pge-net');
const IGNORE_EXTS = new Set([
  '.dproj', '.dof', '.cfg', '.res', '.dcpil', '.dcu', '.exe', '.bpl',
  '.dcp', '.map', '.lockb', '.lock', '.json', '.xml', '.md', '.txt',
]);

function extColor(ext: string) {
  if (ext === '.pas') return 'bg-blue-500';
  if (ext === '.dfm') return 'bg-purple-400';
  if (ext === '.sql') return 'bg-orange-400';
  return 'bg-slate-400';
}

interface DefectFile { path: string; defectCount: number; ext: string; samples: string[] }

function DefectFilesPanel() {
  const [token, setToken] = useState(() => localStorage.getItem('radar_gitlab_token') ?? '');
  const [results, setResults] = useState<DefectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ mrs: number; defeitos: number } | null>(null);

  async function analyze() {
    setLoading(true); setError(null); setResults([]); setProgress('Buscando MRs de defeito...');
    localStorage.setItem('radar_gitlab_token', token);
    try {
      const headers = { 'PRIVATE-TOKEN': token };
      // padrão: título começa com D seguido de 5-7 dígitos
      const DEFECT_RE = /^D(\d{5,7})[\s\-–:]/;

      // Buscar MRs merged — até 200 (4 páginas × 50)
      const allMRs: Array<{ iid: number; title: string; target_branch: string }> = [];
      for (let page = 1; page <= 4; page++) {
        const res = await fetch(
          `https://gitlab.com/api/v4/projects/${GITLAB_ENCODED}/merge_requests?state=merged&per_page=50&page=${page}&order_by=updated_at&sort=desc`,
          { headers }
        );
        if (!res.ok) throw new Error(`GitLab ${res.status}: ${res.statusText}`);
        const data: Array<{ iid: number; title: string; target_branch: string }> = await res.json();
        if (!Array.isArray(data) || data.length === 0) break;
        allMRs.push(...data);
      }

      // Deduplica por ID de defeito: prefere MR que vai para master
      const defectMap = new Map<string, number>(); // defectId → iid do MR escolhido
      for (const mr of allMRs) {
        const m = mr.title.match(DEFECT_RE);
        if (!m) continue;
        const id = m[1];
        const isMaster = mr.target_branch === 'master';
        if (!defectMap.has(id) || isMaster) defectMap.set(id, mr.iid);
      }
      setStats({ mrs: allMRs.length, defeitos: defectMap.size });
      setProgress(`${defectMap.size} defeitos únicos — buscando arquivos modificados...`);

      // Para cada defeito único, busca diffs do MR
      const entries = [...defectMap.entries()]; // [defectId, mrIid]
      const fileSets: Record<string, Set<string>> = {}; // path → Set<defectId>

      const BATCH = 5;
      for (let i = 0; i < entries.length; i += BATCH) {
        const batch = entries.slice(i, i + BATCH);
        setProgress(`Analisando ${i + 1}–${Math.min(i + BATCH, entries.length)} de ${entries.length} defeitos...`);
        await Promise.all(batch.map(async ([defectId, mrIid]) => {
          try {
            const res = await fetch(
              `https://gitlab.com/api/v4/projects/${GITLAB_ENCODED}/merge_requests/${mrIid}/diffs?per_page=100`,
              { headers }
            );
            if (!res.ok) return;
            const diffs: Array<{ new_path?: string; old_path?: string }> = await res.json();
            if (!Array.isArray(diffs)) return;
            for (const d of diffs) {
              const fp = d.new_path ?? d.old_path ?? '';
              if (!fp) continue;
              const ext = fp.includes('.') ? '.' + fp.split('.').pop() : '';
              if (IGNORE_EXTS.has(ext)) continue;
              if (!fileSets[fp]) fileSets[fp] = new Set();
              fileSets[fp].add(defectId);
            }
          } catch { /* ignorar falhas individuais */ }
        }));
      }

      setResults(
        Object.entries(fileSets)
          .map(([path, ids]) => ({
            path,
            defectCount: ids.size,
            ext: path.includes('.') ? '.' + path.split('.').pop()! : '',
            samples: [...ids].slice(0, 4).map(id => `D${id}`),
          }))
          .sort((a, b) => b.defectCount - a.defectCount)
          .slice(0, 20)
      );
      setProgress('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro na análise.');
    } finally {
      setLoading(false);
    }
  }

  const max = results[0]?.defectCount ?? 1;

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-primary/8 border border-primary/20 text-xs text-muted-foreground">
        Analisa <strong className="text-foreground">MRs de correção de defeito</strong> (título <code className="font-mono">D884xxx - ...</code>) e conta quantos defeitos distintos modificaram cada arquivo. Arquivos no topo = maior impacto real em qualidade.
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 max-w-sm">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Token GitLab</label>
          <Input type="password" placeholder="glpat-..." value={token} onChange={e => setToken(e.target.value)} />
        </div>
        <Button onClick={analyze} disabled={!token || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileCode2 className="h-4 w-4 mr-2" />}
          Analisar
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading && (
        <div className="text-center py-8 text-sm text-muted-foreground space-y-2">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          <p>{progress}</p>
          <p className="text-xs">Analisando MRs reais — pode levar 30–60s</p>
        </div>
      )}

      {!loading && results.length > 0 && stats && (
        <>
          <p className="text-sm text-muted-foreground">
            Top {results.length} arquivos mais impactados por defeitos ·{' '}
            <span className="font-medium text-foreground">{stats.defeitos} defeitos únicos</span> analisados
            {' '}(de {stats.mrs} MRs no histórico)
          </p>
          <div className="space-y-2.5">
            {results.map((f, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5 text-right shrink-0">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-xs font-mono font-medium truncate" title={f.path}>
                    {f.path.split('/').pop()}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{f.path}</p>
                  <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                    <div className={`h-full rounded-full ${extColor(f.ext)}`} style={{ width: `${Math.round((f.defectCount / max) * 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    ex: {f.samples.join(', ')}{f.samples.length < f.defectCount ? '…' : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="secondary" className="text-xs font-bold">{f.defectCount}</Badge>
                  <p className="text-[10px] text-muted-foreground mt-0.5">defeitos</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1 border-t border-border">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />.pas — código Delphi</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-purple-400 inline-block" />.dfm — formulários</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-orange-400 inline-block" />.sql — banco de dados</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block" />outros</span>
          </div>
        </>
      )}

      {!loading && results.length === 0 && !error && (
        <div className="text-center py-10 text-sm text-muted-foreground">
          <FileCode2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>Informe o token GitLab e clique em Analisar.</p>
          <p className="text-xs mt-1">A análise cruza MRs de defeito reais com os arquivos que eles modificaram.</p>
        </div>
      )}
    </div>
  );
}

// ── Issues do GitLab ──────────────────────────────────────────────────────────

interface GitLabIssue {
  id: number;
  iid: number;
  title: string;
  state: 'opened' | 'closed';
  labels: string[];
  created_at: string;
  assignees: { name: string }[];
}

function IssuesPanel() {
  const [token, setToken] = useState(() => localStorage.getItem('radar_gitlab_token') ?? '');
  const [issues, setIssues] = useState<GitLabIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroState, setFiltroState] = useState<'all' | 'opened' | 'closed'>('all');

  async function fetchIssues() {
    setLoading(true); setError(null);
    localStorage.setItem('radar_gitlab_token', token);
    try {
      const headers = { 'PRIVATE-TOKEN': token };
      const all: GitLabIssue[] = [];
      for (let page = 1; page <= 3; page++) {
        const res = await fetch(
          `https://gitlab.com/api/v4/projects/${GITLAB_ENCODED}/issues?state=${filtroState}&per_page=50&page=${page}`,
          { headers }
        );
        if (!res.ok) throw new Error(`GitLab ${res.status}: ${res.statusText}`);
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) break;
        all.push(...data);
      }
      setIssues(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar issues.');
    } finally {
      setLoading(false);
    }
  }

  const opened = issues.filter(i => i.state === 'opened');
  const closed = issues.filter(i => i.state === 'closed');
  const byLabel: Record<string, number> = {};
  for (const issue of opened) {
    const labels = issue.labels.length > 0 ? issue.labels : ['(sem label)'];
    for (const l of labels) byLabel[l] = (byLabel[l] ?? 0) + 1;
  }
  const topLabels = Object.entries(byLabel).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 max-w-sm">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Token GitLab</label>
          <Input type="password" placeholder="glpat-..." value={token} onChange={e => setToken(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Estado</label>
          <Select value={filtroState} onValueChange={(v: 'all' | 'opened' | 'closed') => setFiltroState(v)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="opened">Abertas</SelectItem>
              <SelectItem value="closed">Fechadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={fetchIssues} disabled={!token || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CircleDot className="h-4 w-4 mr-2" />}
          Buscar Issues
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {issues.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center">
              <p className="text-2xl font-bold text-orange-600">{opened.length}</p>
              <p className="text-xs text-muted-foreground">abertas</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{closed.length}</p>
              <p className="text-xs text-muted-foreground">fechadas</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-2xl font-bold">{issues.length}</p>
              <p className="text-xs text-muted-foreground">total</p>
            </Card>
          </div>

          {topLabels.length > 0 && opened.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Issues abertas por label</p>
              <div className="flex flex-wrap gap-2">
                {topLabels.map(([label, count]) => (
                  <Badge key={label} variant="secondary" className="text-xs gap-1.5">
                    {label} <span className="font-bold">{count}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1 max-h-96 overflow-y-auto">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pb-1">Lista</p>
            {issues.slice(0, 40).map(issue => (
              <div key={issue.id} className="flex items-start gap-2 py-2 border-b border-border/40 last:border-0">
                <Badge
                  variant={issue.state === 'opened' ? 'destructive' : 'outline'}
                  className="text-[10px] shrink-0 mt-0.5"
                >
                  #{issue.iid}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate font-medium" title={issue.title}>{issue.title}</p>
                  <div className="flex gap-1.5 mt-0.5 flex-wrap">
                    {issue.labels.map(l => (
                      <span key={l} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{l}</span>
                    ))}
                    {issue.assignees[0] && (
                      <span className="text-[10px] text-muted-foreground">{issue.assignees[0].name}</span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(issue.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && issues.length === 0 && (
        <div className="text-center py-10 text-sm text-muted-foreground">
          <CircleDot className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>Informe o token GitLab e clique em "Buscar Issues".</p>
          <p className="text-xs mt-1">Se o resultado for vazio, o time provavelmente usa RTC como ferramenta principal.</p>
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function InsightsPage() {
  const { config, loading: configLoading } = useSquadConfig();
  const [squadId, setSquadId] = useState('');
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InsightsData | null>(null);

  async function handleFetch() {
    if (!squadId) return;
    setLoading(true); setError(null);
    try {
      const result = await fetchInsightsData(squadId, months);
      if (!result) throw new Error('Endpoint disponível apenas em modo de desenvolvimento.');
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar dados.');
    } finally {
      setLoading(false);
    }
  }

  if (configLoading) return <div className="p-8 text-center text-muted-foreground">Carregando configuração...</div>;
  if (!config) return (
    <div className="p-8 text-center text-muted-foreground">
      Configuração de squads não encontrada. Acesse <strong>Configurações → Squads</strong>.
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Insights de Qualidade
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Mapa de calor, MTTR, qualidade de releases e comparativo entre squads
        </p>
      </div>

      {/* Seleção */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1 min-w-[200px]">
              <label className="text-sm font-medium">Squad</label>
              <Select value={squadId} onValueChange={setSquadId}>
                <SelectTrigger><SelectValue placeholder="Selecione o squad" /></SelectTrigger>
                <SelectContent>
                  {config.squads.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Histórico</label>
              <Select value={String(months)} onValueChange={v => setMonths(Number(v))}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MESES_OPTIONS.map(m => <SelectItem key={m} value={String(m)}>{m} meses</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleFetch} disabled={!squadId || loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Buscando...</> : 'Carregar dados'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {data && (
        <Tabs defaultValue="calor">
          <TabsList className="flex flex-wrap h-auto gap-1 justify-start">
            <TabsTrigger value="calor" className="gap-1.5"><Flame className="h-3.5 w-3.5" />Mapa de Calor</TabsTrigger>
            <TabsTrigger value="mttr" className="gap-1.5"><Clock className="h-3.5 w-3.5" />MTTR</TabsTrigger>
            <TabsTrigger value="releases" className="gap-1.5"><GitBranch className="h-3.5 w-3.5" />Releases</TabsTrigger>
            <TabsTrigger value="comparativo" className="gap-1.5"><Users className="h-3.5 w-3.5" />Comparativo</TabsTrigger>
            <TabsTrigger value="churn" className="gap-1.5"><FileCode2 className="h-3.5 w-3.5" />Arquivos × Defeitos</TabsTrigger>
            <TabsTrigger value="issues" className="gap-1.5"><CircleDot className="h-3.5 w-3.5" />Issues</TabsTrigger>
          </TabsList>

          <TabsContent value="calor" className="mt-4">
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Flame className="h-4 w-4 text-orange-500" />Mapa de Calor — Funcionalidades</CardTitle></CardHeader>
              <CardContent><MapaCalor data={data} /></CardContent></Card>
          </TabsContent>

          <TabsContent value="mttr" className="mt-4">
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500" />Tempo Médio de Resolução (MTTR)</CardTitle></CardHeader>
              <CardContent className="space-y-6"><MttrPanel data={data} /><TendenciaPanel data={data} /></CardContent></Card>
          </TabsContent>

          <TabsContent value="releases" className="mt-4">
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><GitBranch className="h-4 w-4 text-purple-500" />Qualidade por Release (pge-net)</CardTitle></CardHeader>
              <CardContent><CorrelacaoPanel insights={data} /></CardContent></Card>
          </TabsContent>

          <TabsContent value="comparativo" className="mt-4">
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-green-600" />Comparativo entre Squads</CardTitle></CardHeader>
              <CardContent><ComparativoPanel squads={config.squads} months={months} /></CardContent></Card>
          </TabsContent>

          <TabsContent value="churn" className="mt-4">
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><FileCode2 className="h-4 w-4 text-blue-600" />Arquivos × Defeitos — pge-net</CardTitle>
              <p className="text-xs text-muted-foreground">Quais arquivos foram modificados em mais correções de defeito? Cruzamento real entre MRs GitLab e defeitos RTC.</p>
            </CardHeader>
              <CardContent><DefectFilesPanel /></CardContent></Card>
          </TabsContent>

          <TabsContent value="issues" className="mt-4">
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><CircleDot className="h-4 w-4 text-violet-600" />Issues GitLab — pge-net</CardTitle>
              <p className="text-xs text-muted-foreground">Issues registradas no GitLab. Se o time usa RTC como ferramenta principal, este painel pode estar vazio.</p>
            </CardHeader>
              <CardContent><IssuesPanel /></CardContent></Card>
          </TabsContent>
        </Tabs>
      )}

      {!data && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Selecione um squad e clique em "Carregar dados" para ver os insights.</p>
        </div>
      )}
    </div>
  );
}
