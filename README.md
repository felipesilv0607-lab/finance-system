# Sistema Financeiro

> Aplicação Full Stack para gerenciamento financeiro pessoal, desenvolvida com foco em arquitetura, segurança, organização de código, integridade dos dados e qualidade de software.

O **Sistema Financeiro** é um projeto de portfólio que demonstra, na prática, o desenvolvimento de uma aplicação web completa. A solução permite gerenciar contas, categorias, receitas e despesas, acompanhar saldos e visualizar informações financeiras por meio de um painel de controle.

Mais do que uma aplicação de registro financeiro, o projeto foi desenvolvido para explorar conceitos importantes de engenharia de software, incluindo autenticação, autorização, isolamento de dados por usuário, validação de regras de negócio, testes automatizados e proteção de APIs.

## Visão geral

- Gerenciamento de contas financeiras.
- Organização de categorias de receitas e despesas.
- Registro e acompanhamento de movimentações.
- Cálculo de saldos por conta.
- Dashboard com indicadores e gráficos.
- Autenticação e proteção de rotas.
- Isolamento de dados entre usuários.

## Tecnologias utilizadas

### Frontend
- React
- Vite
- JavaScript
- CSS
- SVG para visualizações gráficas
- React Router

### Backend
- Node.js
- Express
- Prisma ORM
- PostgreSQL
- JSON Web Token (JWT)
- bcrypt

### Infraestrutura e ferramentas
- Git e GitHub
- GitHub Actions
- GitHub Pages
- Render
- Supabase PostgreSQL
- ESLint
- Testes automatizados

## Funcionalidades

### Autenticação e gerenciamento de usuários

- Cadastro de usuários.
- Login com e-mail e senha.
- Autenticação baseada em JWT.
- Validação de assinatura, emissor (`issuer`) e audiência (`audience`) dos tokens.
- Hash de senhas com bcrypt.
- Proteção de rotas privadas por middleware.
- Verificação do usuário autenticado nas requisições.
- Isolamento de dados por usuário.
- Proteção contra acesso a recursos pertencentes a outros usuários.
- Limitação de tentativas de login e cadastro.
- Bloqueio temporário após tentativas consecutivas de autenticação inválidas.
- Política de senha entre 10 e 128 caracteres, com validações contra senhas comuns e padrões inseguros.

### Contas financeiras

- Cadastro de contas.
- Edição e exclusão de contas.
- Definição do tipo de conta.
- Configuração de saldo inicial.
- Associação das contas ao usuário autenticado.
- Cálculo do saldo atual considerando receitas e despesas.

### Categorias

- Cadastro de categorias.
- Edição e exclusão.
- Separação entre categorias de receita e despesa.
- Regras de unicidade por usuário, nome e tipo.
- Associação das categorias às movimentações.

### Movimentações financeiras

- Registro de receitas.
- Registro de despesas.
- Edição de movimentações.
- Exclusão de movimentações.
- Associação entre usuário, conta e categoria.
- Validação dos valores monetários.
- Filtros por conta, categoria e descrição.
- Paginação dos resultados.

### Dashboard e indicadores financeiros

- Saldo atual por conta.
- Saldo total consolidado.
- Resumo mensal de receitas e despesas.
- Evolução diária e mensal do saldo.
- Despesas agrupadas por categoria.
- Histórico de movimentações recentes.
- Filtros por período, conta e categoria.
- Gráficos desenvolvidos com SVG, sem dependência de bibliotecas externas de visualização.

## API e regras de negócio

A API disponibiliza endpoints para gerenciamento das funcionalidades do sistema.

### Dashboard

`GET /api/dashboard/summary`

Retorna o resumo financeiro mensal, preservando o contrato original da aplicação.

`GET /api/dashboard/overview`

Retorna informações consolidadas, incluindo:

- Saldo total.
- Receitas.
- Despesas.
- Evolução diária e mensal.
- Saldo acumulado.
- Despesas por categoria.
- Movimentações recentes.

Filtros disponíveis:

- `from`
- `to`
- `accountId`
- `categoryId`

### Transações

`GET /api/transactions`

Permite consultar movimentações com os seguintes filtros:

- `accountId`
- `categoryId`
- `q` — pesquisa por descrição.
- `limit`
- `offset`

### Integridade financeira

- Cálculos de saldo realizados no servidor.
- Valores monetários tratados como strings decimais exatas, evitando imprecisões de ponto flutuante.
- Validação de valores positivos.
- Verificação de propriedade dos recursos pelo usuário autenticado.
- Operações relacionadas protegidas por transações no banco de dados.

## Segurança

A aplicação possui mecanismos de proteção implementados no frontend e backend.

### Controles implementados

- Autenticação JWT com algoritmo e parâmetros de validação definidos.
- Hash de senhas com bcrypt.
- Proteção de rotas privadas.
- Verificação de propriedade dos registros.
- Validação de dados recebidos pela API.
- Proteção contra atribuição indevida de propriedades (`mass assignment`).
- Consultas parametrizadas.
- Limitação de tentativas de autenticação.
- Confirmação da senha atual para alteração de e-mail e exclusão da própria conta.
- Validação rigorosa de datas.
- Limitação do tamanho do corpo das requisições.
- Configurações de segurança HTTP e CORS.

### Pontos de atenção documentados

Algumas limitações permanecem registradas:

- JWT armazenado em `localStorage`, com exposição potencial em caso de XSS.
- Logout não invalida imediatamente o token no servidor.
- Ausência de verificação de e-mail.
- Ausência de recuperação de senha.
- Limites de tentativas armazenados em memória, sem compartilhamento entre múltiplas instâncias.
- Duas vulnerabilidades moderadas em uma dependência utilizada exclusivamente no desenvolvimento (`nodemon`).

Esses pontos foram identificados e documentados durante a revisão final de segurança.

## Testes e qualidade

O projeto possui testes automatizados para validar regras de negócio, autenticação, segurança e comportamento das funcionalidades.

### Executar os testes

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm run lint
npm test
npm run build
```

### Resultados da revisão final

| Verificação | Resultado |
|---|---:|
| Testes do frontend | 99/99 |
| Testes do backend | 32/32 |
| Testes de segurança caixa-preta | 20/20 |
| Testes de autenticação no navegador | 9/9 |
| Testes de regressão no navegador | 67/67 |
| ESLint | Aprovado |
| Build | Aprovado |

A revisão final também incluiu uma bateria de 80 execuções de diagnóstico de segurança, sem reprodução de uma falha intermitente anteriormente observada no ambiente Windows.

### Integração contínua

O workflow `.github/workflows/ci.yml` executa verificações automatizadas nas Pull Requests, incluindo testes e validações do projeto.

## Arquitetura

A aplicação utiliza uma arquitetura separada em frontend e backend.

```text
finance-system/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── config/
│   │   ├── pages/
│   │   └── styles/
│   └── package.json
│
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
│
└── .github/
    └── workflows/
```

*Estrutura ilustrativa das principais áreas do projeto.*

## Publicação

O projeto está publicado utilizando os seguintes serviços:

- **Frontend:** GitHub Pages.
- **Backend:** Render.
- **Banco de dados:** PostgreSQL hospedado no Supabase.

### Acessar a aplicação

- [Aplicação online](https://felipesilv0607-lab.github.io/finance-system/)
- [Repositório no GitHub](https://github.com/felipesilv0607-lab/finance-system)

## Deploy, migrações e rollback

### Ordem de publicação

A publicação do backend e do frontend exige atenção à ordem de implantação.

O workflow `deploy.yml` publica o GitHub Pages em todo push na branch `develop`, independentemente da conclusão do deploy do backend no Render.

Portanto, a integração de uma Pull Request na `develop` não garante, por si só, a ordem de publicação entre os serviços.

A publicação sequencial deve ser preparada antes do merge, garantindo que o backend esteja atualizado antes da disponibilização de alterações dependentes no frontend.

### Migrações do banco de dados

O Build Command do Render utiliza:

```bash
npm install && npx prisma generate
```

Esse comando não aplica migrações automaticamente.

As migrações são aplicadas manualmente no Supabase, seguindo o procedimento documentado em `backend/README.md`, incluindo:

- Backup com `pg_dump`.
- Verificação da migração.
- Aplicação controlada.
- Procedimento de reversão.

A migração `20261113180000_transaction_indexes_and_amount_check` adiciona o índice `(userId, date)`, remove o índice anterior de `date` e cria uma restrição `CHECK amount > 0` como `NOT VALID`, preservando a compatibilidade com registros antigos.

### Rollback

O último estado de produção anterior à V1 corresponde ao commit `0577785` da branch `develop`.

A tag `v0-producao` existe localmente, mas não foi enviada ao GitHub no encerramento do projeto. Até que seja publicada, o hash do commit deve ser utilizado como referência.

- **Frontend:** reexecutar o workflow correspondente ao commit anterior ou reverter o merge na `develop`.
- **Backend:** utilizar o rollback do deploy pelo painel do Render.
- **Banco de dados:** seguir o procedimento de reversão documentado em `backend/README.md`.

## Evolução do projeto

O desenvolvimento foi realizado de maneira incremental, com foco na preservação das funcionalidades existentes e na melhoria contínua da qualidade do código.

As etapas finais incluíram:

- Modernização das interfaces.
- Reorganização de componentes e regras de negócio.
- Correções de validação e integridade de dados.
- Revisão de autenticação e autorização.
- Testes automatizados e regressão de navegador.
- Auditoria de segurança.
- Correções publicadas por meio das PRs #9 e #10.

## Objetivo do projeto

O Sistema Financeiro foi desenvolvido como experiência prática de engenharia de software Full Stack, aplicando conceitos de desenvolvimento frontend, construção de APIs, persistência de dados, segurança, testes e implantação em produção.

O projeto representa a aplicação prática de conhecimentos de desenvolvimento web e organização de sistemas, desde a modelagem dos dados até a publicação de uma aplicação funcional.

---

**Desenvolvido por Felipe Luz Cunha**

[GitHub](https://github.com/felipesilv0607-lab) · [LinkedIn](https://www.linkedin.com/in/felipeluz-dev)
