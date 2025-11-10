# Portal Custo Defeito

## Visão Geral

O **Portal Custo Defeito** é uma ferramenta executiva desenvolvida pelo Time de Qualidade da Vertical de Procuradorias da Softplan. A ferramenta permite analisar o impacto financeiro de defeitos de software, fornecendo insights valiosos para tomada de decisões estratégicas relacionadas à qualidade.

## Características Principais

### 🎯 **Funcionalidades Core**
- **Simulador de Custos**: Calcula o impacto financeiro de defeitos usando multiplicadores baseados em pesquisas da indústria
- **Dashboard Executivo**: Visualizações interativas para análise de tendências e métricas
- **Configurações Personalizáveis**: Permite ajustar parâmetros conforme o contexto organizacional
- **Teoria Fundamentada**: Base teórica sólida sobre custos de qualidade de software

### 🏗️ **Arquitetura Técnica**
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui
- **Roteamento**: React Router DOM
- **Gráficos**: Recharts
- **Testes**: Vitest + Testing Library
- **Qualidade**: ESLint + Prettier

### 📊 **Multiplicadores de Custo**
A ferramenta utiliza multiplicadores baseados em pesquisas da indústria:
- **Desenvolvimento**: 1x (custo base)
- **Teste de Sistema**: 5x
- **Teste de Aceitação**: 10x
- **Produção**: 30x

## Navegação da Ferramenta

### 1. **Entenda a Ferramenta** (Página Inicial)
Apresenta a teoria completa sobre custos de qualidade, incluindo:
- Conceitos fundamentais
- Metodologia de cálculo
- Benefícios da análise de custos
- Seção InnerSource com informações sobre contribuição

### 2. **Simulador**
Interface interativa para:
- Inserir dados de defeitos
- Configurar parâmetros de cálculo
- Visualizar impacto financeiro
- Comparar cenários

### 3. **Visão Geral (Dashboard)**
Painel executivo com:
- Métricas consolidadas
- Gráficos de tendências
- Análises comparativas
- Indicadores de performance

### 4. **Configurações**
Área para personalização:
- Multiplicadores de custo
- Parâmetros organizacionais
- Preferências de visualização

## InnerSource

Este projeto segue o modelo **InnerSource**, promovendo colaboração aberta dentro da organização.

### Trusted Committers
- **Flávia Cristina da Costa**
- **Humberto Zilio**

### Como Contribuir
1. Consulte o [Guia de Contribuição](contributing.md)
2. Leia a documentação de [InnerSource](innersource.md)
3. Abra issues ou merge requests no [repositório GitLab](https://gitlab.com/softplan/justica/procuradorias/arquitetura-de-software/tools/portal-custo-defeito)

## Links Úteis

- 🌐 [Portal em Produção](https://custo-defeito.softplan.com.br/)
- 📋 [Repositório GitLab](https://gitlab.com/softplan/justica/procuradorias/arquitetura-de-software/tools/portal-custo-defeito)
- 📖 [Guia de Contribuição](https://gitlab.com/softplan/justica/procuradorias/arquitetura-de-software/tools/portal-custo-defeito/-/blob/main/CONTRIBUTING.md)
- 🏢 **Equipe**: Time de Qualidade - Vertical de Procuradorias
- 📧 **Contato**: Através de issues no GitLab

---

!!! info "Sobre esta Documentação"
    Esta documentação é gerada automaticamente pelo Backstage e mantida pela equipe de desenvolvimento. Para sugestões ou correções, abra uma issue no repositório do projeto.
