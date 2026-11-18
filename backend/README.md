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

## Deploy no Render
- **Root Directory:** `backend` · **Node:** `.node-version`/`engines` exigem ≥ 22.12 (requisito do Prisma 7); se necessário defina também `NODE_VERSION=22.12.0` no serviço.
- **Build Command:** `npm ci && npx prisma migrate deploy` (o `postinstall` roda `prisma generate`, que **exige `DATABASE_URL` já disponível no build**). O Pre-Deploy Command do Render não existe em todos os planos; por isso a migration roda no build.
- **Start Command:** `npm start`
- **Variáveis:** `DATABASE_URL`, `JWT_SECRET` (aleatório, ≥ 32 caracteres; gere com `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`), `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_EXPIRES_IN`, `FRONTEND_URL` (apenas a origem, ex.: `https://usuario.github.io`), `NODE_ENV=production`, `TRUST_PROXY=1`. O `PORT` é definido pelo Render.
- **Banco externo:** use a URL interna do Render; se usar a externa, acrescente `?sslmode=require`.
- **Health check:** `/api/health` (não consulta o banco).
