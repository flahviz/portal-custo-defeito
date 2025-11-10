# Como Contribuir

## Bem-vindo ao Portal Custo Defeito! 🎉

O Portal Custo Defeito é um projeto **InnerSource** da Softplan, desenvolvido pelo Time de Qualidade da Vertical de Procuradorias. Agradecemos seu interesse em contribuir!

## Modelo InnerSource

Este projeto segue os princípios do **InnerSource**, aplicando práticas de código aberto dentro da organização:

- **Transparência**: Código e processos abertos para toda a organização
- **Colaboração**: Contribuições de diferentes equipes são bem-vindas
- **Meritocracia**: Decisões baseadas na qualidade das contribuições
- **Mentoria**: Trusted Committers orientam novos contribuidores

## Trusted Committers

Os **Trusted Committers** são responsáveis pela manutenção do projeto e orientação dos contribuidores:

- **Flávia Cristina da Costa** - Líder Técnica do Time de Qualidade
- **Humberto Zilio** - Arquiteto de Software

## Como Começar

### 1. Configuração do Ambiente

```bash
# Clone o repositório
git clone https://gitlab.com/softplan/justica/procuradorias/arquitetura-de-software/tools/portal-custo-defeito.git
cd portal-custo-defeito

# Instale as dependências
npm install

# Execute o projeto localmente
npm run dev
```

### 2. Entenda o Projeto

- 📖 Leia a [documentação completa](index.md)
- 🏗️ Explore a [arquitetura](architecture/overview.md)
- 🧪 Execute os [testes](development/testing.md)
- 🎨 Siga os [padrões de código](development/coding-standards.md)

## Tipos de Contribuição

### 🐛 Correção de Bugs
1. Verifique se o bug já foi reportado nas [Issues](https://gitlab.com/softplan/justica/procuradorias/arquitetura-de-software/tools/portal-custo-defeito/-/issues)
2. Crie uma nova issue se necessário
3. Implemente a correção seguindo os padrões
4. Adicione testes para prevenir regressões

### ✨ Novas Funcionalidades
1. Discuta a proposta com os Trusted Committers
2. Crie uma issue detalhada com a especificação
3. Aguarde aprovação antes de iniciar o desenvolvimento
4. Implemente seguindo a arquitetura existente

### 📚 Documentação
1. Identifique lacunas na documentação
2. Proponha melhorias ou correções
3. Mantenha consistência com o estilo existente
4. Inclua exemplos práticos quando relevante

### 🧪 Testes
1. Aumente a cobertura de testes
2. Melhore testes existentes
3. Adicione testes de integração
4. Documente cenários de teste

## Processo de Contribuição

### 1. Preparação

```bash
# Crie uma branch para sua contribuição
git checkout -b feature/nome-da-funcionalidade

# Ou para correções
git checkout -b fix/descricao-do-bug
```

### 2. Desenvolvimento

#### Padrões de Commit
Utilizamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Funcionalidades
git commit -m "feat: adicionar calculadora de ROI"

# Correções
git commit -m "fix: corrigir cálculo de multiplicadores"

# Documentação
git commit -m "docs: atualizar guia de instalação"

# Testes
git commit -m "test: adicionar testes para componente MetricCard"

# Refatoração
git commit -m "refactor: simplificar lógica de validação"
```

#### Qualidade do Código
```bash
# Verificar linting
npm run lint

# Corrigir problemas automaticamente
npm run lint:fix

# Verificar formatação
npm run format:check

# Formatar código
npm run format

# Executar testes
npm test

# Verificar cobertura
npm run test:coverage
```

### 3. Testes

Antes de submeter sua contribuição:

```bash
# Execute todos os testes
npm test

# Verifique se não há warnings de linting
npm run lint

# Confirme que o build funciona
npm run build

# Teste a aplicação localmente
npm run preview
```

### 4. Submissão

#### Merge Request Template
```markdown
## Descrição
Breve descrição das mudanças implementadas.

## Tipo de Mudança
- [ ] Correção de bug
- [ ] Nova funcionalidade
- [ ] Mudança que quebra compatibilidade
- [ ] Atualização de documentação

## Como Testar
1. Passos para reproduzir/testar
2. Dados de teste necessários
3. Comportamento esperado

## Checklist
- [ ] Código segue os padrões estabelecidos
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Pipeline CI/CD passa sem erros
- [ ] Mudanças foram testadas localmente

## Screenshots (se aplicável)
Adicione screenshots para mudanças visuais.

## Issues Relacionadas
Closes #123
```

## Padrões e Diretrizes

### Estrutura de Código

```typescript
// ✅ Estrutura recomendada para componentes
interface ComponentProps {
  // Props tipadas
}

export const Component: React.FC<ComponentProps> = ({
  // Destructuring com defaults
}) => {
  // Hooks no topo
  // Funções auxiliares
  // JSX return
};
```

### Nomenclatura

- **Componentes**: PascalCase (`MetricCard`)
- **Arquivos**: kebab-case (`metric-card.tsx`)
- **Funções**: camelCase (`calculateCost`)
- **Constantes**: UPPER_SNAKE_CASE (`DEFAULT_MULTIPLIERS`)

### Testes

```typescript
// ✅ Estrutura de teste recomendada
describe('ComponentName', () => {
  describe('when condition', () => {
    it('should do something specific', () => {
      // Arrange
      // Act  
      // Assert
    });
  });
});
```

## Revisão de Código

### Processo de Review

1. **Automated Checks**: Pipeline CI/CD deve passar
2. **Peer Review**: Pelo menos 1 aprovação necessária
3. **Trusted Committer Review**: Aprovação final para mudanças significativas

### Critérios de Aprovação

- ✅ Código segue os padrões estabelecidos
- ✅ Testes adequados foram incluídos
- ✅ Documentação foi atualizada
- ✅ Performance não foi degradada
- ✅ Segurança foi considerada

### Feedback Construtivo

```markdown
# ✅ Feedback construtivo
Sugestão: Considere usar useMemo aqui para otimizar performance.

# ❌ Feedback não construtivo  
Este código está ruim.
```

## Comunicação

### Canais de Comunicação

- **Issues**: Para bugs e propostas de funcionalidades
- **Merge Requests**: Para discussões sobre código
- **Email**: Para questões mais complexas com Trusted Committers

### Etiqueta

- 🤝 Seja respeitoso e construtivo
- 💬 Comunique-se claramente
- ⏰ Seja paciente com o processo de review
- 🎯 Mantenha discussões focadas no tópico

## Reconhecimento

### Contribuidores

Todos os contribuidores são reconhecidos:

- **README.md**: Lista de contribuidores
- **CHANGELOG.md**: Créditos por versão
- **Backstage**: Perfil de contribuidor

### Níveis de Contribuição

1. **Contributor**: Primeira contribuição aceita
2. **Regular Contributor**: 5+ contribuições aceitas
3. **Core Contributor**: 20+ contribuições + conhecimento profundo
4. **Trusted Committer**: Nomeado pela equipe

## Recursos Úteis

### Documentação Técnica
- [Guia de Início](development/getting-started.md)
- [Estrutura do Projeto](development/project-structure.md)
- [Padrões de Código](development/coding-standards.md)
- [Estratégia de Testes](development/testing.md)

### Ferramentas
- [GitLab Issues](https://gitlab.com/softplan/justica/procuradorias/arquitetura-de-software/tools/portal-custo-defeito/-/issues)
- [Pipeline CI/CD](https://gitlab.com/softplan/justica/procuradorias/arquitetura-de-software/tools/portal-custo-defeito/-/pipelines)
- [Merge Requests](https://gitlab.com/softplan/justica/procuradorias/arquitetura-de-software/tools/portal-custo-defeito/-/merge_requests)

### Referências Externas
- [Conventional Commits](https://www.conventionalcommits.org/)
- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Testing Library](https://testing-library.com/docs/)

## FAQ

### Como reportar um bug?
1. Verifique se já existe uma issue similar
2. Crie uma nova issue com template de bug
3. Inclua passos para reproduzir
4. Adicione screenshots se relevante

### Como propor uma nova funcionalidade?
1. Discuta a ideia com os Trusted Committers
2. Crie uma issue detalhada
3. Aguarde feedback antes de implementar
4. Siga o processo de contribuição

### Como me tornar um Trusted Committer?
1. Contribua regularmente com qualidade
2. Demonstre conhecimento profundo do projeto
3. Ajude outros contribuidores
4. Seja nomeado pela equipe atual

### Posso contribuir mesmo sendo de outra vertical?
Sim! O modelo InnerSource incentiva contribuições de toda a organização. Os Trusted Committers estão disponíveis para orientação.

---

## Agradecimentos

Obrigado por contribuir com o Portal Custo Defeito! Sua colaboração ajuda a melhorar a qualidade de software em toda a Softplan. 🚀

**Time de Qualidade - Vertical de Procuradorias**
