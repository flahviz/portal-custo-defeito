import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Brain, Search, CheckCircle2, AlertTriangle, Code2, Shield,
  ClipboardList, Loader2, ChevronDown, ChevronUp, Lightbulb,
} from 'lucide-react';
import {
  fetchRtcCard, analyzeDefect,
  RtcCard, DefectAnalysis,
} from '@/lib/claudeService';
import { stripHtml } from '@/lib/recorrenciaAnalysis';

const IS_DEV = import.meta.env.DEV;

function CardDetails({ card }: { card: RtcCard }) {
  const [showDesc, setShowDesc] = useState(false);
  const causa = stripHtml(card.causa);
  const solucao = stripHtml(card.solucao);
  const desc = stripHtml(card.description);

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">#{card.id} — {card.title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {card.funcionalidade && <span className="mr-3">{card.funcionalidade}</span>}
              {card.versaoOrigem && <span className="font-mono mr-3">{card.versaoOrigem}</span>}
              <Badge variant="secondary" className="text-xs">{card.status}</Badge>
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {causa && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Causa</p>
            <p className="whitespace-pre-wrap">{causa}</p>
          </div>
        )}
        {solucao && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Solução aplicada</p>
            <p className="whitespace-pre-wrap">{solucao}</p>
          </div>
        )}
        {desc && (
          <div>
            <button
              className="text-xs text-primary underline underline-offset-2"
              onClick={() => setShowDesc(v => !v)}
            >
              {showDesc ? 'Ocultar descrição' : 'Ver descrição completa'}
              {showDesc ? <ChevronUp className="inline h-3 w-3 ml-1" /> : <ChevronDown className="inline h-3 w-3 ml-1" />}
            </button>
            {showDesc && <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{desc}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalysisResult({ analysis }: { analysis: DefectAnalysis }) {
  const [codeExpanded, setCodeExpanded] = useState(false);

  return (
    <div className="space-y-4">
      {/* Causa raiz */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600" />
            Análise da Causa Raiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{analysis.causaRaiz}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Testes unitários */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Testes Unitários que teriam detectado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.testesUnitarios.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-xs font-bold text-muted-foreground mt-0.5 shrink-0">#{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Testes de integração */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Testes de Integração recomendados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.testesIntegracao.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-xs font-bold text-muted-foreground mt-0.5 shrink-0">#{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Exemplo de código */}
      {analysis.exemploTeste && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="h-4 w-4 text-blue-600" />
              Exemplo de Teste (JUnit/Mockito)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className={`text-xs bg-muted rounded p-3 overflow-x-auto ${!codeExpanded ? 'max-h-48' : ''} overflow-hidden`}>
                <code>{analysis.exemploTeste}</code>
              </pre>
              <button
                onClick={() => setCodeExpanded(v => !v)}
                className="absolute bottom-2 right-2 text-xs bg-background border border-border rounded px-2 py-1 text-muted-foreground hover:text-foreground"
              >
                {codeExpanded ? 'Recolher' : 'Expandir'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Como evitar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-700" />
              Como evitar recorrência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.comoEvitar.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Checklist de code review */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-blue-600" />
              Checklist de Code Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.checklistReview.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="h-4 w-4 rounded border border-border flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AnaliseIA() {
  const [cardInput, setCardInput] = useState('');
  const [card, setCard] = useState<RtcCard | null>(null);
  const [analysis, setAnalysis] = useState<DefectAnalysis | null>(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFetchCard() {
    const id = cardInput.trim().replace(/^#/, '');
    if (!id) return;
    setLoadingCard(true);
    setError(null);
    setCard(null);
    setAnalysis(null);
    try {
      const result = await fetchRtcCard(id);
      if (!result) throw new Error('Busca de cards disponível apenas em modo de desenvolvimento.');
      setCard(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar card.');
    } finally {
      setLoadingCard(false);
    }
  }

  async function handleAnalyze() {
    if (!card) return;
    setLoadingAnalysis(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await analyzeDefect(card);
      setAnalysis(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro na análise com IA.');
    } finally {
      setLoadingAnalysis(false);
    }
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <p className="text-[11px] font-mono text-muted-foreground/60 tracking-[0.2em] uppercase mb-3">
          Inteligência Artificial · Vertical Procuradorias
        </p>
        <h1 className="text-4xl font-bold text-foreground">
          Análise de Defeito com <span style={{ color: '#ec4899' }}>IA</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-xl">
          Informe o número de um card RTC para obter análise de causa raiz, sugestão de testes e checklist de code review gerados pela IA.
        </p>
      </div>

      {!IS_DEV && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4 text-sm text-yellow-800">
            <strong>Atenção:</strong> Esta funcionalidade requer o servidor de desenvolvimento local (<code>npm run dev</code>) com <code>RTC_USER</code>, <code>RTC_PASS</code> e <code>ANTHROPIC_API_KEY</code> configurados no arquivo <code>.env</code>.
          </CardContent>
        </Card>
      )}

      {/* Busca do card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Buscar Card RTC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Número do card (ex: 878476)"
              value={cardInput}
              onChange={e => setCardInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFetchCard()}
              className="max-w-xs"
            />
            <Button onClick={handleFetchCard} disabled={!cardInput.trim() || loadingCard}>
              {loadingCard ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Buscando...</> : 'Buscar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* Detalhes do card encontrado */}
      {card && (
        <>
          <CardDetails card={card} />

          <div className="flex items-center gap-4">
            <Button
              onClick={handleAnalyze}
              disabled={loadingAnalysis}
              className="gap-2"
              size="lg"
            >
              {loadingAnalysis
                ? <><Loader2 className="h-4 w-4 animate-spin" />Analisando com IA...</>
                : <><Brain className="h-4 w-4" />Analisar com IA</>
              }
            </Button>
            {loadingAnalysis && (
              <p className="text-sm text-muted-foreground">
                Isso pode levar 15–30 segundos...
              </p>
            )}
          </div>

          {analysis && (
            <>
              <Separator />
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <h2 className="text-lg font-semibold">Análise gerada pela IA</h2>
                <Badge variant="secondary" className="text-xs">Claude Sonnet</Badge>
              </div>
              <AnalysisResult analysis={analysis} />
            </>
          )}
        </>
      )}
    </div>
  );
}
