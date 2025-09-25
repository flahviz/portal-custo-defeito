# Guia de Contribuição - Portal Custo Defeito

Bem-vindo ao projeto **Portal Custo Defeito**! Este é um projeto **InnerSource** da Softplan que aceita contribuições da comunidade interna.

## 🎯 **Sobre o Projeto**

O Portal Custo Defeito é uma ferramenta executiva desenvolvida pelo **Time de Qualidade da Vertical de Procuradorias** para análise e simulação do impacto financeiro de defeitos em projetos de software.

## 👥 **Trusted Committers**

Os **Trusted Committers** são responsáveis por revisar e aprovar contribuições, além de manter a qualidade e direção técnica do projeto:

### **Lista de Trusted Committers**

- **Flávia Cristina da Costa** - Time de Qualidade, Vertical de Procuradorias
- **Humberto Zilio** - Time Arquitetura, Vertical de Procuradorias

## 🤝 **Como Contribuir**

### **1. Preparação do Ambiente**

```bash
# Clone o repositório principal diretamente
git clone https://gitlab.com/softplan/justica/procuradorias/arquitetura-de-software/tools/portal-custo-defeito.git

# Navegue até o diretório
cd portal-custo-defeito

# Instale as dependências
npm install
```

> 💡 **Nota**: Como este é um projeto InnerSource interno da Softplan, colaboradores da empresa têm acesso direto ao repositório e podem criar branches diretamente, sem necessidade de fork.

### **2. Fluxo de Desenvolvimento**

```bash
# Sincronize com a branch principal
git fetch origin
git checkout main
git pull origin main

# Crie uma branch para sua contribuição
git checkout -b feature/nome-da-funcionalidade
# ou
git checkout -b fix/nome-do-bug
# ou
git checkout -b docs/nome-da-documentacao

# Faça suas alterações
# Execute os testes
npm run test

# Execute o linting
npm run lint

# Commit suas mudanças
git add .
git commit -m "feat: adiciona nova funcionalidade X"

# Push da sua branch para o repositório
git push origin feature/nome-da-funcionalidade
```

### **3. Criando um Merge Request**

1. Acesse o projeto no GitLab
2. Vá para a sua branch recém-criada
3. Clique em "Create merge request"
4. Preencha o template de MR (veja seção abaixo)
5. Aguarde a revisão dos Trusted Committers

## 📝 **Padrões de Código**

### **Commits Convencionais**

Utilizamos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Alterações na documentação
- `style:` - Formatação, sem mudança de lógica
- `refactor:` - Refatoração de código
- `test:` - Adição ou correção de testes
- `chore:` - Tarefas de manutenção

**Exemplos:**
```
feat: adiciona simulação de custos por severidade
fix: corrige cálculo de multiplicadores na fase de teste
docs: atualiza README com instruções de deploy
```

### **Estrutura de Código**

- **Componentes**: Use PascalCase (`ComponenteExemplo.tsx`)
- **Hooks**: Use camelCase com prefixo `use` (`useCustomHook.ts`)
- **Utilitários**: Use camelCase (`formatCurrency.ts`)
- **Tipos**: Use PascalCase (`DefectType.ts`)

### **Estilo de Código**

- Use **TypeScript** para tipagem estática
- Siga as configurações do **ESLint** e **Prettier**
- Mantenha componentes pequenos e focados
- Use **custom hooks** para lógica reutilizável
- Documente funções complexas com JSDoc

## 🧪 **Testes**

```bash
# Execute todos os testes
npm run test

# Execute testes em modo watch
npm run test:watch

# Execute testes com coverage
npm run test:coverage

# Execute testes com interface gráfica
npm run test:ui
```

### **Estrutura de Testes**

```
src/
├── __tests__/              # Testes da aplicação principal
├── components/
│   └── **/__tests__/       # Testes de componentes
├── pages/
│   └── __tests__/          # Testes de páginas
├── hooks/
│   └── __tests__/          # Testes de hooks customizados
├── lib/
│   └── __tests__/          # Testes de funções utilitárias
└── test/
    ├── setup.ts            # Configuração global dos testes
    ├── utils.tsx           # Utilitários de teste
    └── README.md           # Documentação dos testes
```

### **Tecnologias de Teste**

- **Vitest**: Framework de testes rápido e moderno
- **React Testing Library**: Testes de componentes React
- **jsdom**: Ambiente DOM simulado
- **@testing-library/jest-dom**: Matchers customizados
- **@testing-library/user-event**: Simulação de eventos

### **Diretrizes de Teste**

- **Escreva testes para novas funcionalidades de negócio**
- **Mantenha cobertura de testes acima de 60% para código crítico**
- **Priorize testes de**: páginas principais, hooks customizados, funções utilitárias
- **Use `render` de `@/test/utils`** para incluir providers automaticamente
- **Teste comportamentos, não implementação**
- **Use `screen.getByRole()` quando possível** para melhor acessibilidade
- **Teste casos de erro e edge cases**
- **Mantenha testes simples e focados**

### **Estratégia de Cobertura**

O projeto adota uma abordagem pragmática para cobertura de testes:

- **Código de Negócio**: Meta de 60%+ (páginas, hooks, utilitários)
- **Componentes UI**: Excluídos da cobertura (gerados automaticamente)
- **Foco**: Funcionalidades críticas e lógica de negócio
- **Qualidade > Quantidade**: Testes significativos em vez de cobertura artificial

### **Exemplos de Testes**

**Teste de Componente:**
```typescript
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@/test/utils'
import MeuComponente from '../MeuComponente'

describe('MeuComponente', () => {
  it('deve renderizar o título correto', () => {
    render(<MeuComponente titulo="Teste" />)
    expect(screen.getByText('Teste')).toBeInTheDocument()
  })
})
```

**Teste de Hook:**
```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMeuHook } from '../useMeuHook'

describe('useMeuHook', () => {
  it('deve retornar valor inicial', () => {
    const { result } = renderHook(() => useMeuHook('inicial'))
    expect(result.current[0]).toBe('inicial')
  })
})
```

**Teste de Função Utilitária:**
```typescript
import { describe, it, expect } from 'vitest'
import { formatCurrency } from '../utils'

describe('formatCurrency', () => {
  it('deve formatar moeda corretamente', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56')
  })
})
```

## 📋 **Template de Merge Request**

```markdown
## Descrição

Breve descrição das mudanças implementadas.

## Tipo de Mudança

- [ ] 🐛 Bug fix (correção que resolve um problema)
- [ ] ✨ Nova funcionalidade (mudança que adiciona funcionalidade)
- [ ] 💥 Breaking change (correção ou funcionalidade que quebra compatibilidade)
- [ ] 📚 Documentação (mudanças apenas na documentação)

## Como Testar

1. Passos para reproduzir/testar as mudanças
2. Comandos específicos se necessário
3. Cenários de teste importantes

## Checklist

- [ ] Meu código segue os padrões do projeto
- [ ] Realizei uma auto-revisão do código
- [ ] Comentei partes complexas do código
- [ ] Minhas mudanças não geram novos warnings
- [ ] Adicionei testes que provam que minha correção/funcionalidade funciona
- [ ] Testes novos e existentes passam localmente
- [ ] Atualizei a documentação se necessário

## Screenshots (se aplicável)

Adicione screenshots para mudanças na UI.

## Observações Adicionais

Qualquer informação adicional relevante para os revisores.
```

## 🔍 **Processo de Revisão**

### **Critérios de Aprovação**

- **Qualidade do código**: Segue padrões estabelecidos
- **Funcionalidade**: Atende aos requisitos especificados
- **Testes**: Possui cobertura adequada
- **Documentação**: Está atualizada quando necessário
- **Performance**: Não degrada a performance existente

### **Tempo de Resposta**

- **Primeira revisão**: Até 2 dias úteis
- **Revisões subsequentes**: Até 1 dia útil
- **Aprovação final**: Até 1 dia útil após última revisão

## 🚀 **Tipos de Contribuição**

### **🐛 Correção de Bugs**

- Identifique o problema claramente
- Reproduza o bug localmente
- Implemente a correção mínima necessária
- Adicione testes para evitar regressão

### **✨ Novas Funcionalidades**

- Discuta a funcionalidade em uma issue primeiro
- Mantenha o escopo focado e bem definido
- Implemente testes abrangentes
- Atualize a documentação

### **📚 Documentação**

- Mantenha linguagem clara e objetiva
- Use exemplos práticos quando possível
- Atualize screenshots se necessário
- Revise links e referências

### **🎨 Melhorias de UI/UX**

- Mantenha consistência com o design system
- Considere acessibilidade (a11y)
- Teste em diferentes tamanhos de tela
- Valide com stakeholders quando necessário

## 📞 **Contato e Suporte**

### **Canais de Comunicação**

- **Issues**: Para bugs e solicitações de funcionalidades
- **Merge Requests**: Para discussões sobre código
- **Email**: Para questões mais complexas, contate os Trusted Committers

### **Trusted Committers**

- **Flávia Cristina da Costa**: flavia.cristina@softplan.com.br
- **Humberto Zilio**: zilio@softplan.com.br

## 🏆 **Reconhecimento**

Valorizamos todas as contribuições! Contributors ativos serão:

- Reconhecidos no README do projeto
- Mencionados em releases quando aplicável
- Convidados para discussões técnicas estratégicas

---

**Obrigado por contribuir com o Portal Custo Defeito!** 🚀

Sua participação ajuda a construir uma ferramenta melhor para toda a comunidade Softplan.
