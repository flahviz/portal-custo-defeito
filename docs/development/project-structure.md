# Estrutura do Projeto

## Visão Geral da Estrutura

O Portal Custo Defeito segue uma estrutura organizada e modular, facilitando a manutenção e escalabilidade.

```
portal-custo-defeito/
├── 📁 public/                    # Arquivos estáticos
│   ├── favicon.ico              # Ícone da aplicação
│   ├── placeholder.svg          # Imagens placeholder
│   └── robots.txt               # Configuração para crawlers
├── 📁 src/                      # Código fonte principal
│   ├── 📁 components/           # Componentes React reutilizáveis
│   ├── 📁 hooks/               # Hooks customizados
│   ├── 📁 lib/                 # Utilitários e configurações
│   ├── 📁 pages/               # Páginas da aplicação
│   ├── 📁 types/               # Definições TypeScript
│   ├── App.tsx                 # Componente raiz
│   ├── main.tsx                # Ponto de entrada
│   └── index.css               # Estilos globais
├── 📁 docs/                    # Documentação Backstage
├── 📁 .vscode/                 # Configurações VS Code
├── 📄 Configurações...         # Arquivos de configuração
└── 📄 README.md                # Documentação principal
```

## Diretório `src/`

### `components/` - Componentes Reutilizáveis

```
components/
├── cards/                      # Componentes de cartões
│   ├── MetricCard.tsx         # Cartão de métricas
│   ├── ResultCard.tsx         # Cartão de resultados
│   └── SummaryCard.tsx        # Cartão de resumo
├── charts/                     # Componentes de gráficos
│   ├── CostChart.tsx          # Gráfico de custos
│   ├── TrendChart.tsx         # Gráfico de tendências
│   └── ComparisonChart.tsx    # Gráfico comparativo
├── layout/                     # Componentes de layout
│   ├── Header.tsx             # Cabeçalho
│   ├── Footer.tsx             # Rodapé
│   ├── Navigation.tsx         # Navegação
│   └── Sidebar.tsx            # Barra lateral
└── ui/                        # Componentes base (shadcn/ui)
    ├── button.tsx             # Botão
    ├── card.tsx               # Cartão base
    ├── form.tsx               # Formulário
    ├── input.tsx              # Campo de entrada
    └── ...                    # Outros componentes UI
```

#### Padrão de Componentes
```typescript
// Exemplo: components/cards/MetricCard.tsx
interface MetricCardProps {
  title: string;
  value: number;
  format?: 'currency' | 'percentage' | 'number';
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  format = 'number',
  trend,
  className
}) => {
  // Implementação do componente
};
```

### `hooks/` - Hooks Customizados

```
hooks/
├── __tests__/                  # Testes dos hooks
│   ├── use-mobile.test.ts     # Testes do hook mobile
│   └── use-toast.test.ts      # Testes do hook toast
├── use-mobile.tsx             # Hook para detecção mobile
├── use-toast.ts               # Hook para notificações
├── use-defect-calculation.ts  # Hook para cálculos
├── use-local-storage.ts       # Hook para localStorage
└── use-form-validation.ts     # Hook para validação
```

#### Exemplo de Hook
```typescript
// hooks/use-defect-calculation.ts
export const useDefectCalculation = () => {
  const [multipliers, setMultipliers] = useLocalStorage('multipliers', DEFAULT_MULTIPLIERS);
  
  const calculateCost = useCallback((defect: DefectData): CostResult => {
    return calculateDefectCost(defect, multipliers);
  }, [multipliers]);
  
  return {
    calculateCost,
    multipliers,
    updateMultipliers: setMultipliers
  };
};
```

### `lib/` - Utilitários e Configurações

```
lib/
├── __tests__/                  # Testes dos utilitários
│   ├── defectCalculations.test.ts
│   └── utils.test.ts
├── defectCalculations.ts       # Lógica de cálculos
├── defaultData.ts             # Dados padrão
├── utils.ts                   # Utilitários gerais
└── validations.ts             # Schemas de validação
```

#### Utilitários Principais
```typescript
// lib/defectCalculations.ts
export const calculateDefectCost = (
  defect: DefectData, 
  multipliers: Multipliers
): CostResult => {
  // Lógica de cálculo
};

// lib/utils.ts
export const cn = (...classes: ClassValue[]) => {
  return twMerge(clsx(classes));
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
```

### `pages/` - Páginas da Aplicação

```
pages/
├── HomePage.tsx               # Página inicial (teoria)
├── SimulatorPage.tsx         # Página do simulador
├── DashboardPage.tsx         # Dashboard executivo
├── ConfigPage.tsx            # Página de configurações
└── NotFoundPage.tsx          # Página 404
```

#### Estrutura de Página
```typescript
// pages/SimulatorPage.tsx
export const SimulatorPage: React.FC = () => {
  const { calculateCost } = useDefectCalculation();
  const [result, setResult] = useState<CostResult | null>(null);
  
  return (
    <div className="container mx-auto p-6">
      <h1>Simulador de Custos</h1>
      <DefectForm onSubmit={handleSubmit} />
      {result && <ResultDisplay result={result} />}
    </div>
  );
};
```

### `types/` - Definições TypeScript

```
types/
├── index.ts                   # Exportações principais
├── defect.ts                 # Tipos relacionados a defeitos
├── calculation.ts            # Tipos de cálculos
└── ui.ts                     # Tipos de interface
```

#### Definições de Tipos
```typescript
// types/defect.ts
export interface DefectData {
  id?: string;
  phase: Phase;
  effort: number;
  hourlyRate: number;
  description?: string;
  createdAt?: Date;
}

export type Phase = 'development' | 'system-test' | 'acceptance-test' | 'production';

// types/calculation.ts
export interface CostResult {
  baseCost: number;
  multipliedCost: number;
  multiplier: number;
  savings: number;
}

export interface Multipliers {
  development: number;
  systemTest: number;
  acceptanceTest: number;
  production: number;
}
```

## Arquivos de Configuração

### Configurações de Build
- **`vite.config.ts`**: Configuração do Vite
- **`tsconfig.json`**: Configuração TypeScript
- **`tailwind.config.ts`**: Configuração Tailwind CSS
- **`postcss.config.js`**: Configuração PostCSS

### Qualidade de Código
- **`eslint.config.js`**: Configuração ESLint
- **`.prettierrc`**: Configuração Prettier
- **`.prettierignore`**: Arquivos ignorados pelo Prettier
- **`.editorconfig`**: Configuração universal de editor

### VS Code
- **`.vscode/settings.json`**: Configurações do workspace
- **`.vscode/extensions.json`**: Extensões recomendadas

### Containerização
- **`Dockerfile`**: Imagem Docker
- **`docker-compose.yml`**: Orquestração local
- **`nginx.conf`**: Configuração do servidor web

### CI/CD
- **`.gitlab-ci.yml`**: Pipeline GitLab CI
- **`catalog-info.yaml`**: Configuração Backstage

## Convenções de Nomenclatura

### Arquivos e Diretórios
- **Componentes**: PascalCase (`MetricCard.tsx`)
- **Hooks**: camelCase com prefixo `use` (`use-mobile.tsx`)
- **Utilitários**: camelCase (`defectCalculations.ts`)
- **Páginas**: PascalCase com sufixo `Page` (`HomePage.tsx`)
- **Tipos**: camelCase (`defect.ts`)

### Código
- **Componentes**: PascalCase (`MetricCard`)
- **Funções**: camelCase (`calculateCost`)
- **Constantes**: UPPER_SNAKE_CASE (`DEFAULT_MULTIPLIERS`)
- **Interfaces**: PascalCase (`DefectData`)
- **Types**: PascalCase (`Phase`)

## Padrões de Importação

### Ordem de Imports
```typescript
// 1. Bibliotecas externas
import React, { useState, useCallback } from 'react';
import { z } from 'zod';

// 2. Componentes internos
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 3. Hooks
import { useDefectCalculation } from '@/hooks/use-defect-calculation';

// 4. Utilitários
import { cn } from '@/lib/utils';
import { calculateDefectCost } from '@/lib/defectCalculations';

// 5. Tipos
import type { DefectData, CostResult } from '@/types';
```

### Alias de Importação
```typescript
// Configurado no vite.config.ts e tsconfig.json
import { Component } from '@/components/Component';
import { useHook } from '@/hooks/use-hook';
import { utility } from '@/lib/utility';
```

## Estrutura de Testes

```
src/
├── components/
│   └── __tests__/             # Testes de componentes
├── hooks/
│   └── __tests__/             # Testes de hooks
├── lib/
│   └── __tests__/             # Testes de utilitários
└── __tests__/                 # Testes gerais
    ├── App.test.tsx          # Teste do componente App
    └── setup.ts              # Configuração dos testes
```

## Documentação

```
docs/                          # Documentação Backstage
├── index.md                  # Página inicial
├── architecture/             # Documentação de arquitetura
├── development/              # Guias de desenvolvimento
├── deployment/               # Documentação de deploy
└── contributing.md           # Guia de contribuição
```

Esta estrutura garante:
- **Modularidade**: Componentes e funcionalidades bem separadas
- **Escalabilidade**: Fácil adição de novas funcionalidades
- **Manutenibilidade**: Código organizado e fácil de encontrar
- **Testabilidade**: Estrutura que facilita a criação de testes
- **Documentação**: Documentação próxima ao código relevante
