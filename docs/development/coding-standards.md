# Padrões de Código

## Visão Geral

O Portal Custo Defeito segue padrões rigorosos de qualidade de código para garantir manutenibilidade, legibilidade e consistência.

## TypeScript

### Configuração Strict Mode
```typescript
// tsconfig.json - Configuração rigorosa
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Definição de Tipos

#### ✅ Boas Práticas
```typescript
// Interfaces para objetos
interface DefectData {
  readonly id: string;
  phase: Phase;
  effort: number;
  hourlyRate: number;
  description?: string;
}

// Union types para valores específicos
type Phase = 'development' | 'system-test' | 'acceptance-test' | 'production';

// Generics para reutilização
interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}
```

#### ❌ Evitar
```typescript
// Uso de 'any'
const data: any = fetchData();

// Tipos implícitos
function calculate(a, b) {
  return a + b;
}

// Mutação de props
interface Props {
  items: string[];
}
const Component = ({ items }: Props) => {
  items.push('new item'); // ❌ Mutação
};
```

## React Components

### Functional Components
```typescript
// ✅ Componente funcional com TypeScript
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children
}) => {
  return (
    <button
      className={cn(
        'rounded-md font-medium transition-colors',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### Hooks Pattern
```typescript
// ✅ Hook customizado bem estruturado
export const useDefectCalculation = () => {
  const [multipliers, setMultipliers] = useLocalStorage('multipliers', DEFAULT_MULTIPLIERS);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateCost = useCallback(async (defect: DefectData): Promise<CostResult> => {
    setIsCalculating(true);
    try {
      const result = await calculateDefectCost(defect, multipliers);
      return result;
    } finally {
      setIsCalculating(false);
    }
  }, [multipliers]);

  const updateMultipliers = useCallback((newMultipliers: Partial<Multipliers>) => {
    setMultipliers(prev => ({ ...prev, ...newMultipliers }));
  }, [setMultipliers]);

  return {
    calculateCost,
    multipliers,
    updateMultipliers,
    isCalculating
  };
};
```

### Props Destructuring
```typescript
// ✅ Destructuring com valores padrão
const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  format = 'number',
  trend,
  className = ''
}) => {
  // Implementação
};

// ❌ Evitar props object
const MetricCard: React.FC<{ props: MetricCardProps }> = ({ props }) => {
  const { title, value } = props; // Desnecessário
};
```

## Naming Conventions

### Variáveis e Funções
```typescript
// ✅ camelCase para variáveis e funções
const defectData = getDefectData();
const calculateTotalCost = (defects: DefectData[]) => { };

// ✅ Nomes descritivos
const isCalculationInProgress = true;
const hasValidationErrors = false;

// ❌ Evitar abreviações
const calc = () => { }; // ❌
const d = getData(); // ❌
```

### Componentes e Classes
```typescript
// ✅ PascalCase para componentes
const DefectCalculator = () => { };
const CostResultDisplay = () => { };

// ✅ Interfaces com 'I' ou sufixo descritivo
interface DefectData { }
interface CalculationResult { }
```

### Constantes
```typescript
// ✅ UPPER_SNAKE_CASE para constantes
const DEFAULT_MULTIPLIERS = {
  development: 1,
  systemTest: 5,
  acceptanceTest: 10,
  production: 30
} as const;

const API_ENDPOINTS = {
  DEFECTS: '/api/defects',
  CALCULATIONS: '/api/calculations'
} as const;
```

## ESLint Rules

### Configuração Principal
```javascript
// eslint.config.js
export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // React
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': 'warn',
      
      // TypeScript
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/prefer-const': 'error',
      
      // Gerais
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error'
    }
  }
];
```

### Regras Específicas

#### Imports
```typescript
// ✅ Imports organizados
import React, { useState, useCallback } from 'react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { useDefectCalculation } from '@/hooks/use-defect-calculation';
import { cn } from '@/lib/utils';

import type { DefectData } from '@/types';

// ❌ Imports desordenados
import { cn } from '@/lib/utils';
import React from 'react';
import type { DefectData } from '@/types';
```

#### Async/Await
```typescript
// ✅ Async/await com tratamento de erro
const fetchDefectData = async (id: string): Promise<DefectData> => {
  try {
    const response = await api.get(`/defects/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch defect data:', error);
    throw new Error('Unable to load defect data');
  }
};

// ❌ Promise chains
const fetchDefectData = (id: string) => {
  return api.get(`/defects/${id}`)
    .then(response => response.data)
    .catch(error => {
      console.error(error);
      throw error;
    });
};
```

## Prettier Configuration

### Configuração
```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### Exemplos de Formatação
```typescript
// ✅ Formatação consistente
const config = {
  multipliers: {
    development: 1,
    systemTest: 5,
    acceptanceTest: 10,
    production: 30,
  },
  defaultHourlyRate: 100,
};

// ✅ Quebras de linha em arrays longos
const phases = [
  'development',
  'system-test',
  'acceptance-test',
  'production',
];

// ✅ Funções com múltiplos parâmetros
const calculateDefectCost = (
  defect: DefectData,
  multipliers: Multipliers,
  options?: CalculationOptions
): CostResult => {
  // Implementação
};
```

## Comentários e Documentação

### JSDoc para Funções Públicas
```typescript
/**
 * Calcula o custo de um defeito baseado na fase e multiplicadores
 * @param defect - Dados do defeito
 * @param multipliers - Multiplicadores por fase
 * @returns Resultado do cálculo com custo base, multiplicado e economia
 */
export const calculateDefectCost = (
  defect: DefectData,
  multipliers: Multipliers
): CostResult => {
  // Implementação
};
```

### Comentários Inline
```typescript
// ✅ Comentários explicativos
// Aplicar multiplicador baseado na fase onde o defeito foi encontrado
const multiplier = PHASE_MULTIPLIERS[defect.phase];

// Calcular economia se o defeito fosse corrigido no desenvolvimento
const savings = multipliedCost - (baseCost * PHASE_MULTIPLIERS.development);

// ❌ Comentários óbvios
const total = a + b; // Soma a e b
```

### TODO Comments
```typescript
// TODO: Implementar cache para cálculos repetidos
// FIXME: Corrigir validação de entrada para valores negativos
// NOTE: Este cálculo segue a metodologia do IBM Systems Sciences Institute
```

## Error Handling

### Tratamento de Erros
```typescript
// ✅ Error boundaries para componentes
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}

// ✅ Validação com Zod
const DefectSchema = z.object({
  phase: z.enum(['development', 'system-test', 'acceptance-test', 'production']),
  effort: z.number().min(0.1).max(1000),
  hourlyRate: z.number().min(1).max(10000)
});

const validateDefect = (data: unknown): DefectData => {
  try {
    return DefectSchema.parse(data);
  } catch (error) {
    throw new Error('Invalid defect data');
  }
};
```

## Performance

### Otimizações React
```typescript
// ✅ Memoização apropriada
const ExpensiveComponent = React.memo(({ data }: Props) => {
  const processedData = useMemo(() => 
    processLargeDataset(data), [data]
  );
  
  return <Chart data={processedData} />;
});

// ✅ useCallback para funções estáveis
const handleSubmit = useCallback((data: FormData) => {
  onSubmit(data);
}, [onSubmit]);

// ❌ Memoização desnecessária
const SimpleComponent = React.memo(({ text }: { text: string }) => (
  <span>{text}</span> // Componente muito simples para memoizar
));
```

## Testing Standards

### Nomenclatura de Testes
```typescript
// ✅ Descrições claras
describe('DefectCalculator', () => {
  it('should calculate cost correctly for development phase', () => {
    // Teste
  });

  it('should throw error for invalid input', () => {
    // Teste
  });

  it('should update multipliers when configuration changes', () => {
    // Teste
  });
});

// ❌ Descrições vagas
describe('Calculator', () => {
  it('works', () => { }); // ❌ Muito vago
  it('test1', () => { }); // ❌ Não descritivo
});
```

## Validação Contínua

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### Scripts de Qualidade
```json
{
  "scripts": {
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "type-check": "tsc --noEmit"
  }
}
```

Estes padrões garantem:
- **Consistência**: Código uniforme em toda a base
- **Qualidade**: Detecção precoce de problemas
- **Manutenibilidade**: Código fácil de entender e modificar
- **Performance**: Otimizações adequadas sem over-engineering
