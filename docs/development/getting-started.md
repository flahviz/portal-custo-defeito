# Guia de Início Rápido

## Pré-requisitos

### Ferramentas Necessárias
- **Node.js**: versão 18 ou superior
- **npm**: versão 9 ou superior (ou **bun** como alternativa)
- **Git**: para controle de versão
- **VS Code**: editor recomendado (com extensões sugeridas)

### Verificação do Ambiente
```bash
node --version  # v18.0.0+
npm --version   # v9.0.0+
git --version   # v2.0.0+
```

## Configuração Inicial

### 1. Clone do Repositório
```bash
git clone https://gitlab.com/softplan/justica/procuradorias/arquitetura-de-software/tools/portal-custo-defeito.git
cd portal-custo-defeito
```

### 2. Instalação de Dependências
```bash
# Com npm
npm install

# Ou com bun (mais rápido)
bun install
```

### 3. Configuração do Editor (VS Code)
O projeto inclui configurações pré-definidas para VS Code:

- **Extensões recomendadas**: Instaladas automaticamente via `.vscode/extensions.json`
- **Configurações**: UTF-8, formatação automática, ESLint
- **EditorConfig**: Padronização entre diferentes editores

### 4. Verificação da Instalação
```bash
# Executar testes
npm test

# Verificar linting
npm run lint

# Verificar formatação
npm run format:check
```

## Executando o Projeto

### Desenvolvimento Local
```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Ou com bun
bun dev
```

A aplicação estará disponível em: `http://localhost:5173`

### Build de Produção
```bash
# Build otimizado
npm run build

# Preview do build
npm run preview
```

### Testes
```bash
# Executar todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Testes com cobertura
npm run test:coverage

# Interface visual dos testes
npm run test:ui
```

## Estrutura do Projeto

```
portal-custo-defeito/
├── public/                 # Arquivos estáticos
├── src/                   # Código fonte
│   ├── components/        # Componentes React
│   ├── hooks/            # Hooks customizados
│   ├── lib/              # Utilitários e configurações
│   ├── pages/            # Páginas da aplicação
│   └── types/            # Definições TypeScript
├── docs/                 # Documentação (Backstage)
├── .vscode/              # Configurações VS Code
├── package.json          # Dependências e scripts
├── vite.config.ts        # Configuração Vite
├── tailwind.config.ts    # Configuração Tailwind
└── tsconfig.json         # Configuração TypeScript
```

## Scripts Disponíveis

### Desenvolvimento
```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
```

### Qualidade de Código
```bash
npm run lint         # Verificar problemas ESLint
npm run lint:fix     # Corrigir problemas ESLint
npm run format       # Formatar código com Prettier
npm run format:check # Verificar formatação
```

### Testes
```bash
npm test             # Executar testes
npm run test:watch   # Testes em modo watch
npm run test:coverage # Cobertura de testes
npm run test:ui      # Interface visual dos testes
```

## Configurações Importantes

### TypeScript
O projeto usa TypeScript em modo estrito:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true
  }
}
```

### ESLint
Configuração rigorosa para qualidade de código:
```javascript
export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'react-refresh/only-export-components': 'warn',
      '@typescript-eslint/no-unused-vars': 'error'
    }
  }
];
```

### Prettier
Formatação consistente:
```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

## Fluxo de Desenvolvimento

### 1. Criar Branch
```bash
git checkout -b feature/nova-funcionalidade
```

### 2. Desenvolvimento
- Escrever código seguindo os padrões estabelecidos
- Executar testes regularmente: `npm test`
- Verificar linting: `npm run lint`

### 3. Commit
```bash
# Formatação automática
npm run format

# Commit seguindo Conventional Commits
git commit -m "feat: adicionar nova funcionalidade"
```

### 4. Push e Merge Request
```bash
git push origin feature/nova-funcionalidade
```

Criar Merge Request no GitLab seguindo o template estabelecido.

## Troubleshooting

### Problemas Comuns

#### Erro de Dependências
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

#### Problemas de Formatação
```bash
# Corrigir formatação automaticamente
npm run format
npm run lint:fix
```

#### Testes Falhando
```bash
# Executar testes em modo verbose
npm test -- --verbose

# Atualizar snapshots se necessário
npm test -- --updateSnapshot
```

### Logs de Debug
```bash
# Executar com logs detalhados
DEBUG=* npm run dev

# Ou apenas logs do Vite
DEBUG=vite:* npm run dev
```

## Próximos Passos

1. 📖 Leia a [Estrutura do Projeto](project-structure.md)
2. 🎨 Consulte os [Padrões de Código](coding-standards.md)
3. 🧪 Entenda a [Estratégia de Testes](testing.md)
4. 🤝 Veja como [Contribuir](../contributing.md)

## Suporte

- 📋 **Issues**: [GitLab Issues](https://gitlab.com/softplan/justica/procuradorias/arquitetura-de-software/tools/portal-custo-defeito/-/issues)
- 📖 **Documentação**: Esta documentação no Backstage
- 👥 **Trusted Committers**: Flávia Cristina da Costa, Humberto Zilio
