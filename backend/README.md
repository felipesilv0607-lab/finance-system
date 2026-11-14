# Backend — Finance System

API REST em Node.js + Express + Prisma (PostgreSQL).

## Scripts
- `npm install` — instala dependências (executa `prisma generate`)
- `npm run dev` — desenvolvimento (nodemon)
- `npm start` — produção
- `npm test` — testes unitários e de integração (**exigem PostgreSQL** em `DATABASE_URL`, com as migrations aplicadas: `npx prisma migrate deploy`)

## Variáveis de ambiente
Veja `.env.example`. `DATABASE_URL` e `JWT_SECRET` (mín. 32 caracteres) são validados na inicialização; em produção `FRONTEND_URL` também é obrigatório. Atrás de proxy reverso (ex.: Render) defina `TRUST_PROXY=1`.

## Valores monetários
Trafegam como string decimal exata (`"1234.50"`, até 2 casas). Notação científica, vírgula e mais de 2 casas são rejeitadas com 400. Saldos e totais são calculados no servidor com aritmética exata (BigInt em centavos).

## Endpoints (todos sob `/api`, exceto health e cadastro/login exigem `Authorization: Bearer <token>`)
- `GET /health`
- `POST /users`, `POST /users/login`, `GET|PUT|DELETE /users/:id`
- `GET|POST /accounts`, `GET|PUT|DELETE /accounts/:id` — resposta inclui `balance` (saldo atual)
- `GET|POST /categories`, `GET|PUT|DELETE /categories/:id`
- `GET|POST /transactions`, `GET|PUT|DELETE /transactions/:id` — `GET` aceita `type`, `from`, `to`, `limit` (1–500), `offset`
- `GET /dashboard/summary?from=&to=` — saldo total, receitas/despesas do período e 5 últimas movimentações (padrão: mês corrente)

## Migrations
`20261113180000_transaction_indexes_and_amount_check` adiciona a constraint `transactions_amount_positive` como `NOT VALID` (não falha com dado legado). Após conferir os dados: `ALTER TABLE "transactions" VALIDATE CONSTRAINT "transactions_amount_positive";`
