# Testes - Portal Custo Defeito

Este diretório contém a configuração e utilitários para testes do projeto.

## 🧪 **Estrutura de Testes**

```
src/
├── test/
│   ├── setup.ts          # Configuração global dos testes
│   ├── utils.tsx         # Utilitários para renderização com providers
│   └── README.md         # Este arquivo
├── components/
│   └── **/__tests__/     # Testes de componentes
├── pages/
│   └── __tests__/        # Testes de páginas
└── lib/
    └── __tests__/        # Testes de funções utilitárias
```

## 🚀 **Como Executar os Testes**

### **Pré-requisitos**

Instale as dependências primeiro:

```bash
npm install
```

### **Comandos Disponíveis**

```bash
# Executar todos os testes
npm run test

# Executar testes em modo watch (reexecuta quando arquivos mudam)
npm run test:watch

# Executar testes com relatório de cobertura
npm run test:coverage

# Executar testes com interface gráfica
npm run test:ui
```

## 🛠️ **Tecnologias de Teste**

- **Vitest**: Framework de testes rápido e moderno
- **React Testing Library**: Biblioteca para testes de componentes React
- **jsdom**: Ambiente DOM simulado para testes
- **@testing-library/jest-dom**: Matchers customizados para DOM
- **@testing-library/user-event**: Simulação de eventos do usuário

## 📝 **Padrões de Teste**

### **Nomenclatura de Arquivos**

- Testes devem estar em diretórios `__tests__/`
- Arquivos de teste devem terminar com `.test.ts` ou `.test.tsx`
- Nome do arquivo deve corresponder ao componente/função testada

### **Estrutura de Teste**

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import ComponenteParaTestar from '../ComponenteParaTestar'

describe('ComponenteParaTestar', () => {
  it('deve renderizar corretamente', () => {
    render(<ComponenteParaTestar />)

    expect(screen.getByText('Texto esperado')).toBeInTheDocument()
  })
})
```

### **Boas Práticas**

1. **Use `render` de `@/test/utils`** em vez de `@testing-library/react` para incluir providers automaticamente
2. **Teste comportamentos, não implementação**
3. **Use `screen.getByRole()` quando possível** para melhor acessibilidade
4. **Mantenha testes simples e focados**
5. **Use `describe` para agrupar testes relacionados**

## 🎯 **Cobertura de Testes**

O projeto visa manter cobertura de testes acima de 80%. Para verificar:

```bash
npm run test:coverage
```

### **Arquivos Excluídos da Cobertura**

- `node_modules/`
- `src/test/`
- `**/*.d.ts`
- `**/*.config.*`
- `**/dist/**`
- `**/build/**`

## 🔧 **Configuração**

A configuração dos testes está em:

- `vitest.config.ts` - Configuração principal do Vitest
- `src/test/setup.ts` - Setup global dos testes
- `src/test/utils.tsx` - Utilitários de renderização

## 📚 **Exemplos de Testes**

### **Teste de Componente**

```typescript
it('deve exibir o título correto', () => {
  render(<MeuComponente titulo="Teste" />)
  expect(screen.getByText('Teste')).toBeInTheDocument()
})
```

### **Teste de Interação**

```typescript
it('deve chamar função ao clicar no botão', async () => {
  const user = userEvent.setup()
  const mockFn = vi.fn()

  render(<BotaoTeste onClick={mockFn} />)

  await user.click(screen.getByRole('button'))
  expect(mockFn).toHaveBeenCalledOnce()
})
```

### **Teste de Função Utilitária**

```typescript
it('deve formatar moeda corretamente', () => {
  expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
});
```

## 🚨 **Troubleshooting**

### **Erro: Cannot find module**

Certifique-se de que todas as dependências estão instaladas:

```bash
npm install
```

### **Testes não encontram componentes**

Verifique se está usando o `render` de `@/test/utils` que inclui os providers necessários.

### **Problemas com tipos TypeScript**

Certifique-se de que os tipos estão corretos e que as dependências de desenvolvimento estão instaladas.
