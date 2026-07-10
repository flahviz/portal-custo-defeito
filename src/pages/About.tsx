import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Target, TrendingUp, Shield, BookOpen, Lightbulb,
  CheckCircle, AlertTriangle, BarChart3, Calculator,
  GitBranch, ExternalLink, RefreshCw, Activity, Brain,
} from 'lucide-react';

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <span className="text-[11px] font-mono text-muted-foreground/60 tracking-[0.18em] uppercase shrink-0">
        // {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function Tag({ label, color = 'border-border text-muted-foreground' }: { label: string; color?: string }) {
  return (
    <span className={`inline-flex items-center text-[10px] font-mono tracking-wider uppercase border rounded px-2 py-0.5 ${color}`}>
      {label}
    </span>
  );
}

export default function About() {
  return (
    <div className="space-y-16 max-w-5xl">

      {/* ── Hero ── */}
      <div>
        <p className="text-[11px] font-mono text-muted-foreground/60 tracking-[0.2em] uppercase mb-4">
          Vertical Procuradorias · Softplan
        </p>
        <h1 className="text-5xl font-bold text-foreground leading-tight mb-4">
          Radar de <span className="text-primary">Qualidade</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Ferramenta executiva para análise e simulação do impacto financeiro de defeitos em projetos de software.
          Desenvolvida pelo Time de Qualidade da Vertical de Procuradorias.
        </p>
        <div className="flex flex-wrap gap-2 mt-6">
          <Tag label="Time de Qualidade" color="border-primary/30 text-primary" />
          <Tag label="InnerSource" color="border-border text-muted-foreground" />
          <Tag label="Vertical Procuradorias" color="border-border text-muted-foreground" />
        </div>
      </div>

      {/* ── Funcionalidades ── */}
      <div>
        <SectionDivider label="Funcionalidades" />
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: BarChart3,
              color: '#3b82f6',
              title: 'Visão Geral',
              desc: 'Dashboard executivo com KPIs consolidados, Radar de Risco e Custo Evitado pelo QA.',
            },
            {
              icon: RefreshCw,
              color: '#f59e0b',
              title: 'Defeitos Recorrentes',
              desc: 'Clusterização automática de defeitos por regressão, recorrência e duplicatas.',
            },
            {
              icon: Calculator,
              color: '#10b981',
              title: 'Simulador de Custo',
              desc: 'Simule diferentes cenários e calcule o impacto financeiro por fase e cargo.',
            },
            {
              icon: Activity,
              color: '#8b5cf6',
              title: 'ISS por Squad',
              desc: 'Índice de Saúde do Squad cruzando deploys GitLab com custo de defeitos RTC.',
            },
            {
              icon: TrendingUp,
              color: '#06b6d4',
              title: 'Insights',
              desc: 'Mapa de calor, MTTR, análise de releases e arquivos mais impactados por defeitos.',
            },
            {
              icon: Brain,
              color: '#ec4899',
              title: 'Análise IA',
              desc: 'Identificação de clusters com Claude AI e validação de cobertura de testes.',
            },
          ].map((f) => (
            <Card
              key={f.title}
              className="border-t-2 bg-card hover:bg-secondary/20 transition-colors"
              style={{ borderTopColor: f.color }}
            >
              <CardContent className="pt-5 space-y-2">
                <f.icon className="h-5 w-5 mb-3" style={{ color: f.color }} />
                <p className="font-semibold text-foreground">{f.title}</p>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Fundamentação ── */}
      <div>
        <SectionDivider label="Fundamentação Teórica" />
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-t-2" style={{ borderTopColor: '#8b5cf6' }}>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <p className="font-semibold text-sm">Custo da Qualidade — Philip Crosby</p>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                {[
                  { tag: 'PREVENÇÃO', desc: 'Treinamentos, revisões de código, processos de qualidade.' },
                  { tag: 'AVALIAÇÃO', desc: 'Inspeção e teste para detectar defeitos antes da entrega.' },
                  { tag: 'FALHA INTERNA', desc: 'Retrabalho e correções antes da entrega ao cliente.' },
                  { tag: 'FALHA EXTERNA', desc: 'Suporte, garantias e perda de reputação pós-entrega.' },
                ].map((item) => (
                  <div key={item.tag} className="flex gap-3">
                    <Tag label={item.tag} color="border-primary/30 text-primary" />
                    <span className="flex-1">{item.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-2" style={{ borderTopColor: '#3b82f6' }}>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#3b82f6]" />
                <p className="font-semibold text-sm">Multiplicadores por Fase — IBM SSI</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { mult: '1×', fase: 'Desenvolvimento', color: '#10b981' },
                  { mult: '5×', fase: 'Teste', color: '#f59e0b' },
                  { mult: '10×', fase: 'Homologação', color: '#f97316' },
                  { mult: '30×', fase: 'Produção', color: '#ef4444' },
                ].map((m) => (
                  <div key={m.fase} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                    <p className="text-2xl font-bold mb-1" style={{ color: m.color }}>{m.mult}</p>
                    <p className="text-xs text-muted-foreground">{m.fase}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                O custo de correção aumenta exponencialmente conforme o defeito avança no ciclo de desenvolvimento.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Motivadores ── */}
      <div>
        <SectionDivider label="Motivadores" />
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-t-2" style={{ borderTopColor: '#f59e0b' }}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
                <p className="font-semibold text-sm">Desafios Identificados</p>
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {[
                  'Dificuldade em quantificar o impacto financeiro real dos defeitos',
                  'Falta de visibilidade executiva sobre custos de qualidade',
                  'Necessidade de justificar investimentos em qualidade',
                  'Ausência de ferramentas para simulação de cenários',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] mt-1.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-t-2" style={{ borderTopColor: '#10b981' }}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-4 w-4 text-[#10b981]" />
                <p className="font-semibold text-sm">Objetivos da Solução</p>
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {[
                  'Fornecer métricas claras sobre o impacto financeiro de defeitos',
                  'Criar dashboards executivos para tomada de decisão',
                  'Permitir simulações de diferentes cenários de qualidade',
                  'Demonstrar o ROI de investimentos em qualidade',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] mt-1.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── InnerSource ── */}
      <div>
        <SectionDivider label="Projeto InnerSource" />
        <Card className="border-t-2" style={{ borderTopColor: '#3b82f6' }}>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-[#3b82f6]" />
                  <p className="font-semibold">Contribuições abertas</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Este é um projeto <strong className="text-foreground">InnerSource</strong> da Softplan.
                  Contribuições da comunidade interna são bem-vindas para tornar esta ferramenta ainda mais completa.
                </p>
                <div className="text-sm text-muted-foreground space-y-1.5">
                  {['Clone o repositório', 'Crie uma branch para sua contribuição', 'Implemente melhorias ou correções', 'Abra um Merge Request'].map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground/50 w-4">{i + 1}.</span>
                      {s}
                    </div>
                  ))}
                </div>
                <a
                  href="https://gitlab.com/softplan/justica/procuradorias/arquitetura-de-software/tools/portal-custo-defeito"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-mono text-[#3b82f6] hover:text-[#3b82f6]/80 transition-colors border border-[#3b82f6]/30 rounded px-3 py-1.5"
                >
                  <GitBranch className="h-3 w-3" />
                  ABRIR NO GITLAB
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase">Trusted Committers</p>
                {['Flávia Cristina da Costa', 'Humberto Zilio'].map((name) => (
                  <div key={name} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                    <span className="text-foreground">{name}</span>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Time de Qualidade</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Vertical de Procuradorias · Softplan</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
