import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Target,
  TrendingUp,
  Shield,
  Users,
  BookOpen,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Calculator,
  GitBranch,
  ExternalLink,
} from 'lucide-react';

export default function About() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Entenda a Ferramenta</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Compreenda a teoria, motivadores e objetivos por trás da criação desta ferramenta de
          análise do impacto financeiro de defeitos.
        </p>
      </div>

      {/* Team Info */}
      <Card className="bg-gradient-card border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-primary">Time de Qualidade</CardTitle>
              <CardDescription>Vertical de Procuradorias • Softplan</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta ferramenta foi desenvolvida pelo Time de Qualidade da Vertical de Procuradorias da
            Softplan, com o objetivo de fornecer uma solução executiva para análise e simulação do
            impacto financeiro de defeitos em projetos de software.
          </p>
        </CardContent>
      </Card>

      {/* Theory Section */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <CardTitle>Fundamentação Teórica</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Custo da Qualidade
              </h3>
              <p className="text-muted-foreground mb-3">
                O conceito de "Custo da Qualidade" foi desenvolvido por Philip Crosby e categoriza
                os custos relacionados à qualidade em quatro tipos principais:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Badge variant="secondary" className="mb-2">
                    Custos de Prevenção
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Investimentos em atividades que previnem defeitos, como treinamentos, revisões
                    de código e implementação de processos de qualidade.
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge variant="secondary" className="mb-2">
                    Custos de Avaliação
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Gastos com atividades de inspeção e teste para detectar defeitos antes da
                    entrega ao cliente.
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge variant="destructive" className="mb-2">
                    Custos de Falha Interna
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Custos de defeitos encontrados antes da entrega, incluindo retrabalho, correções
                    e tempo perdido.
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge variant="destructive" className="mb-2">
                    Custos de Falha Externa
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Custos de defeitos encontrados pelo cliente, incluindo suporte, garantias e
                    perda de reputação.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Multiplicadores de Custo por Fase
              </h3>
              <p className="text-muted-foreground mb-3">
                O custo de correção de um defeito aumenta exponencialmente conforme ele progride no
                ciclo de desenvolvimento. Esta ferramenta utiliza os seguintes multiplicadores
                baseados em estudos da indústria de software (fonte: IBM Systems Sciences
                Institute):
              </p>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-2xl font-bold text-green-600 mb-2">1x</div>
                  <div className="text-sm font-medium mb-1">Desenvolvimento</div>
                  <div className="text-xs text-muted-foreground">
                    Custo base para correção durante o desenvolvimento
                  </div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="text-2xl font-bold text-yellow-600 mb-2">5x</div>
                  <div className="text-sm font-medium mb-1">Teste</div>
                  <div className="text-xs text-muted-foreground">
                    5 vezes mais caro quando encontrado em testes
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-2xl font-bold text-orange-600 mb-2">10x</div>
                  <div className="text-sm font-medium mb-1">Homologação</div>
                  <div className="text-xs text-muted-foreground">
                    10 vezes mais caro quando encontrado em homologação
                  </div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="text-2xl font-bold text-red-600 mb-2">30x</div>
                  <div className="text-sm font-medium mb-1">Produção</div>
                  <div className="text-xs text-muted-foreground">
                    30 vezes mais caro quando encontrado pelo cliente
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Motivators Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lightbulb className="h-6 w-6 text-primary" />
              <CardTitle>Motivadores da Criação</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Desafios Identificados
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                    Dificuldade em quantificar o impacto financeiro real dos defeitos
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                    Falta de visibilidade executiva sobre custos de qualidade
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                    Necessidade de justificar investimentos em qualidade
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                    Ausência de ferramentas para simulação de cenários
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Objetivos da Solução
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    Fornecer métricas claras sobre o impacto financeiro de defeitos
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    Criar dashboards executivos para tomada de decisão
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    Permitir simulações de diferentes cenários de qualidade
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    Demonstrar o ROI de investimentos em qualidade
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle>Funcionalidades da Ferramenta</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <Calculator className="h-12 w-12 text-primary mx-auto" />
                <h3 className="font-semibold">Simulador de Custos</h3>
                <p className="text-sm text-muted-foreground">
                  Simule diferentes cenários e calcule o impacto financeiro de defeitos em projetos
                  específicos.
                </p>
              </div>

              <div className="text-center space-y-3">
                <BarChart3 className="h-12 w-12 text-primary mx-auto" />
                <h3 className="font-semibold">Dashboard Executivo</h3>
                <p className="text-sm text-muted-foreground">
                  Visualize métricas consolidadas e tendências através de gráficos e indicadores
                  executivos.
                </p>
              </div>

              <div className="text-center space-y-3">
                <Shield className="h-12 w-12 text-primary mx-auto" />
                <h3 className="font-semibold">Configurações</h3>
                <p className="text-sm text-muted-foreground">
                  Configure parâmetros personalizados para adequar os cálculos à realidade da sua
                  organização.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impact Section */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-center text-primary">Impacto Esperado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-lg text-muted-foreground">
                Com esta ferramenta, esperamos capacitar as equipes de gestão a:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-background rounded-lg border">
                  <h4 className="font-semibold mb-2">Tomar Decisões Baseadas em Dados</h4>
                  <p className="text-sm text-muted-foreground">
                    Utilizar métricas concretas para justificar investimentos em qualidade e
                    priorizar iniciativas de melhoria.
                  </p>
                </div>
                <div className="p-4 bg-background rounded-lg border">
                  <h4 className="font-semibold mb-2">Otimizar Recursos</h4>
                  <p className="text-sm text-muted-foreground">
                    Identificar onde investir em prevenção para maximizar o retorno e minimizar
                    custos de correção.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* InnerSource Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <GitBranch className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-blue-700 dark:text-blue-300">
                Projeto InnerSource
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Este é um projeto <strong>InnerSource</strong> da Softplan que aceita contribuições da
              comunidade interna. Sua participação é bem-vinda para tornar esta ferramenta ainda
              melhor!
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">
                  Como Contribuir
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Clone o repositório diretamente</li>
                  <li>• Crie uma branch para sua contribuição</li>
                  <li>• Implemente melhorias ou correções</li>
                  <li>• Abra um Merge Request</li>
                </ul>
              </div>

              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">
                  Trusted Committers
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Flávia Cristina da Costa</li>
                  <li>• Humberto Zilio</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-center pt-4">
              <a
                href="https://gitlab.com/softplan/justica/procuradorias/arquitetura-de-software/tools/portal-custo-defeito"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <GitBranch className="h-4 w-4" />
                Contribuir no GitLab
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
