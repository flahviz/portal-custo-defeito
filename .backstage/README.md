# Configuração Backstage

Este diretório contém configurações específicas para integração com o Backstage da Softplan.

## Arquivos de Configuração

### catalog-info.yaml
Arquivo principal de configuração do Backstage localizado na raiz do projeto. Define:
- Metadados do componente
- Links e anotações
- Dependências e relacionamentos
- Configuração do TechDocs

### mkdocs.yml
Configuração do MkDocs para geração da documentação técnica. Inclui:
- Estrutura de navegação
- Tema e plugins
- Configurações de build
- Extensões Markdown

## Estrutura da Documentação

```
docs/
├── index.md                    # Página inicial
├── architecture/               # Documentação de arquitetura
│   ├── overview.md            # Visão geral da arquitetura
│   ├── components.md          # Componentes e estrutura
│   └── data-flow.md           # Fluxo de dados
├── development/               # Guias de desenvolvimento
│   ├── getting-started.md     # Guia de início rápido
│   ├── project-structure.md   # Estrutura do projeto
│   ├── coding-standards.md    # Padrões de código
│   └── testing.md             # Estratégia de testes
├── deployment/                # Documentação de deployment
│   ├── cicd.md               # Pipeline CI/CD
│   └── environments.md       # Ambientes de deployment
├── adrs/                     # Architecture Decision Records
│   ├── README.md             # Visão geral dos ADRs
│   ├── 0001-react-typescript-stack.md
│   ├── 0002-innersource-model.md
│   └── 0003-cost-multipliers.md
├── contributing.md           # Guia de contribuição
└── innersource.md           # Documentação InnerSource
```

## Recursos do Backstage

### TechDocs
- Documentação gerada automaticamente a partir dos arquivos Markdown
- Navegação integrada ao catálogo de serviços
- Busca unificada na documentação
- Versionamento automático

### Software Catalog
- Visibilidade do componente no catálogo
- Relacionamentos com outros serviços
- Métricas e status de saúde
- Links para recursos externos

### Plugins Utilizados
- **TechDocs**: Documentação técnica
- **GitLab**: Integração com repositório
- **Search**: Busca na documentação
- **Mermaid**: Diagramas e fluxogramas

## Manutenção

### Atualização da Documentação
1. Edite os arquivos Markdown em `docs/`
2. Teste localmente com `mkdocs serve`
3. Commit e push para o repositório
4. Backstage atualiza automaticamente

### Novos ADRs
1. Crie arquivo em `docs/adrs/XXXX-titulo.md`
2. Siga o template padrão
3. Adicione à navegação em `mkdocs.yml`
4. Submeta via Merge Request

### Configuração do Backstage
- Alterações em `catalog-info.yaml` requerem aprovação dos Trusted Committers
- Mudanças na estrutura de navegação devem ser testadas localmente
- Novos plugins ou extensões devem ser discutidos com a equipe

## Troubleshooting

### Documentação não aparece no Backstage
1. Verifique se `backstage.io/techdocs-ref: dir:.` está configurado
2. Confirme que `mkdocs.yml` está na raiz do projeto
3. Verifique logs do TechDocs no Backstage

### Diagramas Mermaid não renderizam
1. Confirme que o plugin `mermaid2` está configurado
2. Verifique sintaxe dos diagramas
3. Teste localmente com `mkdocs serve`

### Links quebrados
1. Use caminhos relativos para arquivos internos
2. Teste todos os links localmente
3. Verifique se arquivos referenciados existem

## Contato

Para questões sobre configuração do Backstage:
- **Trusted Committers**: Flávia Cristina da Costa, Humberto Zilio
- **Issues**: [GitLab Issues](https://gitlab.com/softplan/justica/procuradorias/arquitetura-de-software/tools/portal-custo-defeito/-/issues)
- **Documentação Backstage**: [Backstage.io](https://backstage.io/docs/)
