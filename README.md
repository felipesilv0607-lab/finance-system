# 💰 Finance System

> Uma aplicação Full Stack para gerenciamento financeiro, construída com foco em arquitetura, segurança, organização de código e evolução incremental.

O **Finance System** é um projeto de portfólio desenvolvido do zero para explorar, na prática, como diferentes camadas de uma aplicação web se conectam: interface, API, autenticação, autorização, banco de dados e regras de negócio.

Mais do que criar uma interface para registrar receitas e despesas, o projeto foi evoluído para trabalhar com **isolamento de dados por usuário, autenticação segura, validações, testes e medidas básicas de proteção da API**.

---

## 🎯 Visão do projeto

A ideia é construir uma aplicação financeira na qual o usuário possa centralizar suas movimentações e organizar sua vida financeira através de:

- contas;
- categorias;
- receitas;
- despesas;
- transações;
- autenticação de usuários.

A aplicação foi construída com uma separação clara entre **frontend e backend**, permitindo que cada camada tenha responsabilidades próprias e possa evoluir de forma independente.

---

## ✨ O que já foi construído

### 👤 Autenticação e usuários

- Cadastro de usuários
- Login
- Autenticação baseada em JWT
- Expiração dos tokens
- Validação de `issuer` e `audience`
- Hash de senhas com bcrypt
- Middleware de autenticação
- Proteção das rotas privadas
- Isolamento dos dados pelo usuário autenticado
- O usuário do token é conferido a cada requisição (token de conta excluída recebe 401)
- Login com custo de bcrypt uniforme, mesmo para e-mail inexistente
- Limite de tentativas por IP (login e cadastro) e bloqueio por conta: 5 falhas em 15 min retornam 429 (em memória; zera ao reiniciar)
- Política de senha para novos cadastros: 10 a 128 caracteres, sem senhas comuns, repetição ou o nome do e-mail
- `JWT_EXPIRES_IN` aceito entre 1 minuto e 24 horas (padrão `1h`); o token fica em `localStorage` e não há revogação no servidor

### 💳 Contas

- Criação de contas
- Edição de contas
- Exclusão de contas
- Definição do tipo da conta
- Saldo inicial
- Associação da conta ao usuário autenticado

### 🏷️ Categorias

- Criação de categorias
- Edição
- Exclusão
- Separação entre categorias de receita e despesa
- Regra de unicidade por usuário, nome e tipo

### 💰 Movimentações

- Registro de receitas
- Registro de despesas
- Edição de transações
- Exclusão de transações
- Associação entre:
  - usuário;
  - conta;
  - categoria;
  - transação.
- Formatação de valores monetários na interface

### 📊 Dashboard e saldos

- Saldo atual por conta (saldo inicial + receitas − despesas), calculado no servidor
- `GET /api/dashboard/summary`: resumo do mês (contrato original, preservado)
- `GET /api/dashboard/overview`: saldo total, receitas, despesas, evolução diária/mensal com saldo acumulado, despesas por categoria e movimentações recentes, com filtros `from`/`to`, `accountId` e `categoryId`
- `GET /api/transactions`: filtros `accountId`, `categoryId` e `q` (descrição), com `limit`/`offset`
- Gráficos em SVG próprio (sem bibliotecas), com estados de carregamento, erro e vazio
- Valores monetários como string decimal exata, sem `float`

### 🧪 Testes

```bash
cd backend  && npm test
cd frontend && npm run lint && npm test && npm run build
```

O workflow `.github/workflows/ci.yml` executa essas verificações a cada Pull Request.

## 🚀 Publicação e rollback

- **Ordem:** backend (Render) primeiro, depois o frontend (GitHub Pages). O `deploy.yml` publica o Pages em todo push na `develop` e não espera o CI nem o Render.
- **Migrations:** o Build Command do Render roda `npx prisma migrate deploy`. A migration `20261113180000_transaction_indexes_and_amount_check` adiciona o índice `(userId, date)` e um `CHECK amount > 0` como `NOT VALID` (não reprova linhas antigas).
- **Rollback:** a tag `v0-producao` aponta para o último estado de produção anterior à V1 (`0577785`). Frontend: reverter o merge na `develop` ou reexecutar o workflow nesse commit. Backend: rollback do deploy no painel do Render.
