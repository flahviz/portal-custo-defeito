import {
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip,
} from 'recharts';
import { formatCurrency } from '@/lib/defectCalculations';
import { ReleaseInfo } from '@/lib/issCalculations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Printer, X, Activity, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

interface RelatorioProps {
  open: boolean;
  onClose: () => void;
  squadName: string;
  startDateDisplay: string;
  endDateDisplay: string;
  deploys: number;
  totalCount: number;
  totalCusto: number;
  custoMedio: number;
  defeitosPorDeploy: number | null;
  periodReleases: ReleaseInfo[];
  allReleases: ReleaseInfo[];
  allItems: Array<{ id: string; created: string; resolutionDate?: string; type: string; versaoOrigem?: string }>;
  horasPorDia: number;
}

function calcAvgBusinessDays(items: Array<{ created: string; resolutionDate?: string }>): number | null {
  const resolved = items.filter((i) => i.resolutionDate);
  if (resolved.length === 0) return null;
  const total = resolved.reduce((sum, item) => {
    const created = new Date(item.created);
    const end = new Date(item.resolutionDate!);
    let count = 0;
    const cur = new Date(created);
    cur.setHours(0, 0, 0, 0);
    const endD = new Date(end);
    endD.setHours(0, 0, 0, 0);
    while (cur < endD) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return sum + Math.max(count, 1);
  }, 0);
  return total / resolved.length;
}

function normalizeVersion(v: string): string {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)-(\d+)/);
  if (!m) return v;
  return `${parseInt(m[1])}.${parseInt(m[2])}.${parseInt(m[3])}-${parseInt(m[4])}`;
}

function getDPDStatus(ratio: number): 'elite' | 'atencao' | 'critico' {
  if (ratio < 1) return 'elite';
  if (ratio <= 3) return 'atencao';
  return 'critico';
}

function generateActionPlans(
  dpd: number | null,
  avgDays: number | null,
  releases: ReleaseInfo[],
  defeito: number,
  defeitoCliente: number,
): { icon: 'ok' | 'warn' | 'critical'; text: string }[] {
  const plans: { icon: 'ok' | 'warn' | 'critical'; text: string }[] = [];
  const total = defeito + defeitoCliente;

  if (dpd === null) {
    plans.push({ icon: 'warn', text: 'Adicione dados de deploys para calcular o ratio Defeitos por Deploy e obter sugestões mais precisas.' });
    return plans;
  }

  if (dpd > 3) {
    plans.push({ icon: 'critical', text: `Ratio de ${dpd.toFixed(1)} defeitos por deploy está acima do limite crítico (>3). Reforce critérios de aceite, code review obrigatório e cobertura de testes antes de cada entrega.` });
  } else if (dpd > 1) {
    plans.push({ icon: 'warn', text: `Ratio de ${dpd.toFixed(1)} defeitos por deploy está acima da referência elite (<1,0). Avalie incluir checklist de qualidade no processo de deploy e aumentar a cobertura de testes automatizados.` });
  } else {
    plans.push({ icon: 'ok', text: `Ratio de ${dpd.toFixed(1)} defeitos por deploy dentro da referência elite (<1,0). Continue monitorando período a período para manter esse nível de qualidade.` });
  }

  const highRcReleases = releases.filter((r) => r.maxRc > 2);
  if (highRcReleases.length > 0) {
    plans.push({ icon: 'warn', text: `${highRcReleases.length} release(s) com mais de 2 ciclos de regressão detectadas. Invista em testes automatizados de regressão para reduzir o número de RCs por entrega e o custo associado a cada ciclo.` });
  } else if (releases.length > 0) {
    plans.push({ icon: 'ok', text: 'Releases com baixo número de ciclos de regressão. Boa qualidade no processo de entrega.' });
  }
  // Correlation insight: releases with high RC AND high client defect count
  if (highRcReleases.length > 0 && defeitoCliente > 0) {
    plans.push({ icon: 'warn', text: 'Releases com múltiplos ciclos de regressão coincidem com defeitos reportados por clientes. Verifique no gráfico se os defeitos de cliente se concentram nas versões com RC alto — isso pode indicar que o processo de regressão não está capturando os cenários reais de uso do cliente.' });
  }

  if (avgDays !== null && avgDays > 10) {
    plans.push({ icon: 'warn', text: `Tempo médio de resolução de ${avgDays.toFixed(0)} dias úteis está elevado. Avalie WIP limits, pair programming ou refinamento mais detalhado para acelerar a resolução de defeitos.` });
  } else if (avgDays !== null) {
    plans.push({ icon: 'ok', text: `Tempo médio de resolução de ${avgDays.toFixed(0)} dias úteis dentro do esperado.` });
  }

  if (total > 0 && defeitoCliente / total > 0.6) {
    plans.push({ icon: 'warn', text: `${Math.round((defeitoCliente / total) * 100)}% dos defeitos são reportados por clientes. Considere revisar o processo de homologação e aumentar a cobertura de testes antes das entregas para detectar problemas mais cedo.` });
  }

  return plans;
}

export default function RelatorioDialog({
  open, onClose, squadName, startDateDisplay, endDateDisplay,
  deploys, totalCount, totalCusto, custoMedio, defeitosPorDeploy,
  periodReleases, allReleases, allItems, horasPorDia: _horasPorDia,
}: RelatorioProps) {
  if (!open) return null;

  const today = new Date().toLocaleDateString('pt-BR');
  const defeito = allItems.filter((i) => i.type === 'Defeito').length;
  const defeitoCliente = allItems.filter((i) => i.type === 'Defeito Cliente').length;
  const avgDays = calcAvgBusinessDays(allItems);

  const dpd = defeitosPorDeploy;
  const dpdStatus = dpd !== null ? getDPDStatus(dpd) : null;
  const dpdColor = dpdStatus === 'elite' ? '#22c55e' : dpdStatus === 'atencao' ? '#f59e0b' : '#ef4444';
  const dpdLabel = dpdStatus === 'elite' ? 'Elite' : dpdStatus === 'atencao' ? 'Atenção' : 'Crítico';

  const typeData = [
    { name: 'Defeito', value: defeito, color: '#6366f1' },
    { name: 'Defeito Cliente', value: defeitoCliente, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  // Agrupar defeitos por versaoOrigem normalizada
  const defeitosByVersion = new Map<string, { total: number; cliente: number; ids: string[] }>();
  for (const item of allItems) {
    if (!item.versaoOrigem) continue;
    const norm = normalizeVersion(item.versaoOrigem);
    const entry = defeitosByVersion.get(norm) ?? { total: 0, cliente: 0, ids: [] };
    entry.total++;
    entry.ids.push(item.id);
    if (item.type === 'Defeito Cliente') entry.cliente++;
    defeitosByVersion.set(norm, entry);
  }

  // Mapa de release para busca rápida de RC (usa allReleases — todas as tags, sem filtro de data)
  const releaseByBase = new Map(allReleases.map((r) => [r.base, r]));

  type RiskLevel = 'alto' | 'medio' | 'ok' | 'sem-info';

  const versionRows = [...defeitosByVersion.entries()]
    .map(([version, counts]) => {
      const release = releaseByBase.get(version);
      const hasRelease = !!release;
      const rcs = release?.maxRc ?? 0;
      const interno = counts.total - counts.cliente;
      const ids = counts.ids;
      const risk: RiskLevel =
        !hasRelease ? 'sem-info'
        : counts.cliente > 0 && rcs > 2 ? 'alto'
        : counts.cliente > 0 || rcs > 1 ? 'medio'
        : 'ok';

      let interpretacao: string | null = null;
      if (risk === 'alto') {
        interpretacao = `Versão ${version} precisou de ${rcs} ciclos de regressão e ainda assim gerou ${counts.cliente} defeito(s) reportado(s) pelo cliente — a regressão não cobriu os cenários reais de uso. Recomenda-se revisar os critérios de aceite e ampliar a cobertura de testes de cliente.`;
      } else if (counts.cliente > 0 && rcs === 1) {
        interpretacao = `Versão ${version} passou em RC1 mas gerou ${counts.cliente} defeito(s) de cliente — provável falha de cobertura na homologação. Avalie incluir mais cenários de uso real nos testes.`;
      } else if (counts.cliente > 0) {
        interpretacao = `Versão ${version} teve ${rcs} ciclo(s) de regressão e ${counts.cliente} defeito(s) de cliente — avalie a cobertura dos critérios de aceite para entregas futuras.`;
      }

      return { version, interno, cliente: counts.cliente, total: counts.total, rcs, hasRelease, risk, interpretacao, ids };
    })
    .sort((a, b) => {
      const order: Record<RiskLevel, number> = { alto: 0, medio: 1, ok: 2, 'sem-info': 3 };
      return order[a.risk] - order[b.risk] || b.total - a.total;
    })
    .slice(0, 15);

  const highRiskVersions = versionRows.filter((r) => r.risk === 'alto' || r.risk === 'medio');

  const summaryText = (() => {
    const altoCount = versionRows.filter((r) => r.risk === 'alto').length;
    const medioCount = versionRows.filter((r) => r.risk === 'medio').length;
    if (versionRows.length === 0) return null;
    if (altoCount === 0 && medioCount === 0) return 'Nenhuma versão de origem apresentou combinação crítica de defeitos e ciclos de regressão no período.';
    const parts: string[] = [];
    if (altoCount > 0) parts.push(`${altoCount} versão(ões) com risco alto`);
    if (medioCount > 0) parts.push(`${medioCount} versão(ões) com risco médio`);
    return `${parts.join(' e ')} identificada(s) — veja a análise detalhada abaixo.`;
  })();

  const actionPlans = generateActionPlans(dpd, avgDays, periodReleases, defeito, defeitoCliente);


  return (
    <>
      <style>{`
        @media print {
          body > *:not(#relatorio-root) { display: none !important; }
          #relatorio-root { position: static !important; overflow: visible !important; }
          .relatorio-toolbar { display: none !important; }
          .relatorio-page { box-shadow: none !important; }
        }
      `}</style>
      <div id="relatorio-root" className="fixed inset-0 z-50 bg-white overflow-y-auto">
        {/* Toolbar */}
        <div className="relatorio-toolbar sticky top-0 z-10 bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="h-4 w-4 text-primary" />
            Relatório de Saúde do Squad — {squadName}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" />
              Imprimir / Salvar PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Report page */}
        <div className="relatorio-page max-w-4xl mx-auto px-8 py-10 space-y-8">

          {/* Header */}
          <div className="text-center space-y-1 border-b pb-6">
            <h1 className="text-2xl font-bold">Relatório de Saúde do Squad</h1>
            <p className="text-lg font-medium text-muted-foreground">{squadName}</p>
            <p className="text-sm text-muted-foreground">Período: {startDateDisplay} a {endDateDisplay}</p>
            <p className="text-xs text-muted-foreground">Gerado em {today}</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 text-center space-y-1">
              <p className="text-3xl font-bold" style={{ color: dpdColor }}>
                {dpd !== null ? dpd.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Defeitos por Deploy</p>
              {dpdStatus && (
                <Badge variant="outline" className="text-[10px]" style={{ borderColor: dpdColor, color: dpdColor }}>
                  {dpdLabel}
                </Badge>
              )}
            </div>
            <div className="border rounded-lg p-4 text-center space-y-1">
              <p className="text-3xl font-bold">{totalCount}</p>
              <p className="text-xs text-muted-foreground">Defeitos Atendidos</p>
            </div>
            <div className="border rounded-lg p-4 text-center space-y-1">
              <p className="text-3xl font-bold text-destructive">{formatCurrency(totalCusto)}</p>
              <p className="text-xs text-muted-foreground">Custo de Retrabalho</p>
              <p className="text-[10px] text-muted-foreground">média {formatCurrency(custoMedio)}/defeito</p>
            </div>
            <div className="border rounded-lg p-4 text-center space-y-1">
              <p className="text-3xl font-bold">{deploys}</p>
              <p className="text-xs text-muted-foreground">Releases Entregues</p>
              {avgDays !== null && (
                <p className="text-[10px] text-muted-foreground">resolução média: {avgDays.toFixed(0)}d úteis</p>
              )}
            </div>
          </div>

          {/* Distribuição + Destaques */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie chart */}
            <div className="border rounded-lg p-5 space-y-3">
              <h3 className="font-semibold text-sm">Distribuição por Tipo de Defeito</h3>
              {typeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ value }) => `${value}`}>
                      {typeData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} defeitos`]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">Sem dados de defeitos</div>
              )}
            </div>

            {/* Versões em destaque */}
            <div className="border rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Versões em Atenção</h3>
              </div>
              {highRiskVersions.length > 0 ? (
                <div className="space-y-2">
                  {highRiskVersions.slice(0, 4).map((row) => (
                    <div
                      key={row.version}
                      className={`rounded-lg border p-3 space-y-1 ${
                        row.risk === 'alto'
                          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                          : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-semibold">{row.version}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            row.risk === 'alto'
                              ? 'border-red-500 text-red-600'
                              : 'border-amber-500 text-amber-600'
                          }`}
                        >
                          {row.risk === 'alto' ? 'Alto risco' : 'Médio risco'}
                        </Badge>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>
                          RC: <span className={`font-semibold ${row.rcs > 2 ? 'text-red-600' : row.rcs > 1 ? 'text-amber-600' : 'text-green-600'}`}>
                            {row.hasRelease ? row.rcs : '—'}
                          </span>
                        </span>
                        <span>Internos: <span className="font-semibold">{row.interno}</span></span>
                        <span>Cliente: <span className={`font-semibold ${row.cliente > 0 ? 'text-red-600' : ''}`}>{row.cliente}</span></span>
                      </div>
                    </div>
                  ))}
                  {highRiskVersions.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center">+{highRiskVersions.length - 4} versão(ões) — veja tabela completa abaixo</p>
                  )}
                </div>
              ) : versionRows.length > 0 ? (
                <div className="flex flex-col items-center justify-center h-[160px] gap-2">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium text-center">Nenhuma versão com risco detectado</p>
                  <p className="text-xs text-muted-foreground text-center">Todas as versões de origem têm baixo índice de defeitos e ciclos de regressão</p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[160px] text-muted-foreground text-sm">
                  Busque os dados do RTC para ver a análise
                </div>
              )}
            </div>
          </div>

          {/* Análise por Versão de Origem — tabela completa */}
          {versionRows.length > 0 && (
            <div className="border rounded-lg p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">Análise por Versão de Origem</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Defeitos resolvidos no período agrupados pela versão em que foram introduzidos
                  </p>
                </div>
              </div>

              {summaryText && (
                <div className={`rounded-lg px-4 py-3 text-sm ${
                  highRiskVersions.length > 0
                    ? 'bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200'
                    : 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200'
                }`}>
                  {summaryText}
                </div>
              )}

              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground text-xs">
                      <th className="text-left px-4 py-2 font-medium">Versão de Origem</th>
                      <th className="text-center px-3 py-2 font-medium">Ciclos RC</th>
                      <th className="text-center px-3 py-2 font-medium">Def. Internos</th>
                      <th className="text-center px-3 py-2 font-medium">Def. Cliente</th>
                      <th className="text-center px-3 py-2 font-medium">Total</th>
                      <th className="text-center px-3 py-2 font-medium">Risco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versionRows.map((row, i) => (
                      <>
                        <tr key={row.version} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                          <td className="px-4 py-2 font-mono font-semibold text-xs">{row.version}</td>
                          <td className="px-3 py-2 text-center">
                            {!row.hasRelease ? (
                              <span className="text-muted-foreground text-xs">—</span>
                            ) : (
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  row.rcs > 2 ? 'border-red-500 text-red-600'
                                  : row.rcs > 1 ? 'border-amber-500 text-amber-600'
                                  : 'border-green-500 text-green-600'
                                }`}
                              >
                                RC{row.rcs}
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center font-semibold">{row.interno}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`font-semibold ${row.cliente > 0 ? 'text-destructive' : ''}`}>
                              {row.cliente}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center font-semibold">{row.total}</td>
                          <td className="px-3 py-2 text-center">
                            {row.risk === 'alto' && <Badge variant="destructive" className="text-[10px]">Alto</Badge>}
                            {row.risk === 'medio' && <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600">Médio</Badge>}
                            {row.risk === 'ok' && <Badge variant="outline" className="text-[10px] border-green-500 text-green-600">OK</Badge>}
                            {row.risk === 'sem-info' && <Badge variant="outline" className="text-[10px] text-muted-foreground">Sem info</Badge>}
                          </td>
                        </tr>
                        {(row.interpretacao || row.ids.length > 0) && (
                          <tr key={`${row.version}-interp`} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                            <td colSpan={6} className="px-4 pb-3 pt-0 space-y-1">
                              {row.interpretacao && (
                                <p className={`text-[11px] italic leading-relaxed ${
                                  row.risk === 'alto' ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'
                                }`}>
                                  ↳ {row.interpretacao}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {row.ids.map((id) => (
                                  <span key={id} className="inline-block font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                    #{id}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
              {versionRows.some((r) => !r.hasRelease) && (
                <p className="text-[11px] text-muted-foreground">
                  * "Sem info" indica que a versão de origem não foi encontrada nas tags do GitLab — pode ser de outro produto ou anterior às 100 tags buscadas.
                </p>
              )}
            </div>
          )}

          {/* Action Plans */}
          <div className="border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">Planos de Ação Sugeridos</h3>
            <div className="space-y-3">
              {actionPlans.map((plan, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {plan.icon === 'ok' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {plan.icon === 'warn' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    {plan.icon === 'critical' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{plan.text}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>Radar de Qualidade · {squadName} · {startDateDisplay} a {endDateDisplay}</p>
            <p>Referência de mercado: Google DORA Research 2025 · Elite teams: &lt;1,0 defeito por deploy</p>
          </div>
        </div>
      </div>
    </>
  );
}
