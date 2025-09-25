# Portal Custo Defeito

> **Transformando dados de qualidade em decisões estratégicas inteligentes**

Uma ferramenta executiva desenvolvida pelo **Time de Qualidade da Vertical de Procuradorias** da Softplan para análise e simulação do impacto financeiro de defeitos em projetos de software.

## 🎯 **Sobre o Projeto**

O Portal Custo Defeito é uma ferramenta que permite:

- **Simular custos** de defeitos em diferentes fases do desenvolvimento
- **Visualizar métricas** executivas através de dashboards interativos
- **Configurar parâmetros** personalizados para adequar os cálculos à realidade organizacional
- **Compreender a teoria** por trás dos custos de qualidade baseada em estudos da indústria

### 📊 **Multiplicadores de Custo**

A ferramenta utiliza multiplicadores baseados em estudos da IBM Systems Sciences Institute:

- **Desenvolvimento**: 1x (custo base)
- **Teste**: 5x
- **Homologação**: 10x
- **Produção**: 30x

## 🚀 **Como executar o projeto**

### **Pré-requisitos**

- Node.js 22.20.0+
- npm ou yarn

### **Instalação**

```bash
# Clone o repositório
git clone https://gitlab.com/softplan/justica/procuradorias/arquitetura-de-software/tools/portal-custo-defeito.git

# Navegue até o diretório
cd portal-custo-defeito

# Instale as dependências
npm install

# Execute o projeto em modo de desenvolvimento
npm run dev
```

### **Build para produção**

```bash
# Gerar build de produção
npm run build

# Visualizar build localmente
npm run preview
```

## 🧪 **Testes e Qualidade**

### **Executar Testes**

```bash
# Executar todos os testes
npm run test

# Executar testes em modo watch
npm run test:watch

# Executar testes com cobertura
npm run test:coverage

# Executar testes com interface gráfica
npm run test:ui
```

### **Lint e Formatação**

```bash
# Verificar problemas de lint
npm run lint

# Corrigir problemas de lint automaticamente
npm run lint:fix

# Formatar código com Prettier
npm run format

# Verificar formatação sem alterar arquivos
npm run format:check
```

> **⚠️ Importante**: O projeto possui um limite máximo de **16 warnings** configurado no ESLint. O comando `npm run lint` falhará se este limite for ultrapassado, garantindo que a qualidade do código não regrida.

### **Configuração do Editor**

O projeto inclui configurações padronizadas para editores:

- **`.vscode/settings.json`**: Configurações específicas do VS Code
- **`.editorconfig`**: Configurações universais para qualquer editor
- **`.prettierrc`**: Configurações de formatação de código

**Encoding padrão**: UTF-8 para todos os arquivos, garantindo compatibilidade com caracteres especiais e acentos.

### **Estrutura de Testes**

- **Framework**: Vitest com jsdom
- **Biblioteca de Testes**: React Testing Library
- **Cobertura**: Meta de 60%+ para código de negócio (excluindo componentes UI não utilizados)
- **Localização**: Testes em diretórios `__tests__/` ao lado dos arquivos fonte
- **Estratégia**: Foco em funcionalidades críticas e código de negócio

## 🛠️ **Tecnologias Utilizadas**

Este projeto foi construído com:

- **Vite** - Build tool e dev server
- **TypeScript** - Tipagem estática
- **React 18** - Biblioteca de interface
- **shadcn/ui** - Componentes de UI
- **Tailwind CSS** - Framework de CSS utilitário
- **React Router** - Roteamento
- **Recharts** - Gráficos e visualizações
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas

## 🏗️ **Arquitetura do Projeto**

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── layout/         # Layout e navegação
│   ├── charts/         # Componentes de gráficos
│   └── cards/          # Cards específicos
├── pages/              # Páginas da aplicação
├── hooks/              # Custom hooks
├── lib/                # Utilitários e configurações
├── types/              # Definições de tipos TypeScript
└── main.tsx           # Ponto de entrada
```

## 🤝 **Contribuições (InnerSource)**

Este é um projeto **InnerSource** da Softplan que aceita contribuições da comunidade interna.

### **Como Contribuir**

1. **Clone** o repositório diretamente
2. **Crie** uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. **Push** para a branch (`git push origin feature/nova-funcionalidade`)
5. **Abra** um Merge Request no GitLab

### **Repositório**

🔗 **GitLab**: https://gitlab.com/softplan/justica/procuradorias/arquitetura-de-software/tools/portal-custo-defeito

### **Guidelines de Contribuição**

- Siga os padrões de código existentes
- Adicione testes para novas funcionalidades
- Documente mudanças significativas
- Mantenha commits atômicos e com mensagens descritivas

Consulte o arquivo [CONTRIBUTING.md](./CONTRIBUTING.md) para mais detalhes.

## 📄 **Licença**

Este projeto é propriedade da **Softplan** e está disponível para uso interno conforme políticas da empresa.

## 👥 **Time de Desenvolvimento**

**Time de Qualidade - Vertical de Procuradorias**
- Desenvolvido com foco em excelência e inovação
- Mantido pela comunidade InnerSource da Softplan

---

💡 **Dúvidas ou sugestões?** Abra uma issue no GitLab ou entre em contato com o Time de Qualidade.
