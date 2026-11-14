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
- Resumo do mês: saldo total, receitas, despesas e últimas movimentações
- Valores monetários como string decimal exata, sem `float`

### 🧪 Testes

```bash
cd backend  && npm test        # unitários + integração (requer PostgreSQL)
cd frontend && npm run lint && npm test && npm run build
```

O workflow `.github/workflows/ci.yml` executa tudo isso a cada PR.
