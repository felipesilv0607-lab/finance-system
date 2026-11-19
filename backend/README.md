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
As migrations ficam em `prisma/migrations` e **não são aplicadas pelo deploy do Render**: o Build Command de produção não executa `migrate deploy`. Em produção elas são aplicadas manualmente, depois de um `pg_dump` e da conferência do estado do banco.

`20261113180000_transaction_indexes_and_amount_check` é aditiva (o código anterior continua funcionando com ela):
- cria o índice `transactions_userId_date_idx` (`userId`, `date`);
- remove `transactions_date_idx`, que não é usado (as consultas sempre filtram por `userId`);
- adiciona a constraint `transactions_amount_positive` (`CHECK amount > 0`) como `NOT VALID`, que não falha com dado legado. Depois de conferir os dados: `ALTER TABLE "transactions" VALIDATE CONSTRAINT "transactions_amount_positive";`

### Conexão para aplicar migrations (Supabase)
Use a `DATABASE_URL` da **conexão direta** ou do **session pooler, porta 5432**. **Nunca** use o pooler de transação (porta 6543) para migrations.

A conexão direta do Supabase pode exigir IPv6. Se a sua rede não oferecer IPv6 e a conexão direta falhar, use o **session pooler na porta 5432** (compatível com IPv4).

### Conferência prévia (somente leitura)
```sql
SELECT to_regclass('public._prisma_migrations');
SELECT indexname FROM pg_indexes WHERE tablename = 'transactions' ORDER BY 1;
SELECT count(*) FROM transactions WHERE amount <= 0;
```

### Checklist obrigatório antes do `migrate deploy`
> ⚠️ **`npx prisma migrate deploy` ALTERA o banco de dados** apontado pela `DATABASE_URL`. O `prisma.config.ts` carrega o `backend/.env` automaticamente: se esse arquivo apontar para produção, o comando roda em produção. Só execute depois de marcar todos os itens:

- [ ] Backup `pg_dump` concluído e verificado (arquivo gerado, tamanho coerente).
- [ ] Host da `DATABASE_URL` conferido, **sem imprimir a senha** (a partir de `backend/`, ex.: `node -e "require('dotenv/config'); console.log(new URL(process.env.DATABASE_URL).host)"`, que lê o mesmo `.env` que o Prisma usa) e porta 5432.
- [ ] Consultas de pré-checagem (acima) executadas e analisadas.
- [ ] Ambiente de destino confirmado (produção ou cópia de teste) e coerente com o que se pretende alterar.

### Aplicação manual
A partir de `backend/`:
```
npx prisma migrate status    # somente leitura
npx prisma migrate deploy    # ALTERA o banco: só após o checklist
```

### Baseline (erro P3005)
Se o banco não tiver a tabela `_prisma_migrations` (erro **P3005**), confirme que o schema equivale ao das migrations anteriores e marque como aplicadas **somente as três migrations antigas**, antes do `migrate deploy`:
```
npx prisma migrate resolve --applied 20260825123553_init
npx prisma migrate resolve --applied 20260916120000_add_category_user_name_type_unique
npx prisma migrate resolve --applied 20260918100000_improve_account_type_and_transaction_delete
```
**Não** marque `20261113180000_transaction_indexes_and_amount_check` com `migrate resolve`: ela ainda não foi aplicada e precisa ser executada pelo `migrate deploy`. Marcá-la como aplicada faria o Prisma ignorá-la, e o índice e a constraint nunca seriam criados.

### Reversão manual (não é rollback automático)
Procedimento manual e excepcional. **Só use se a migration `20261113180000_transaction_indexes_and_amount_check` já tiver sido aplicada** no banco; caso contrário, não execute. Não altera dados das tabelas. Faça backup antes e confirme o banco de destino. O bloco roda em uma transação (o DDL do PostgreSQL é transacional); se um comando falhar, nada é aplicado. O histórico do Prisma só é apagado se `_prisma_migrations` existir.
```sql
BEGIN;
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_amount_positive";
DROP INDEX IF EXISTS "transactions_userId_date_idx";
CREATE INDEX IF NOT EXISTS "transactions_date_idx" ON "transactions"("date");
DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    DELETE FROM "_prisma_migrations"
    WHERE migration_name = '20261113180000_transaction_indexes_and_amount_check';
  END IF;
END $$;
COMMIT;
```
Depois da reversão, o código atual continua funcionando (índice e constraint são apenas otimização e validação). Para reaplicar a migration, rode `npx prisma migrate deploy` seguindo o checklist.

## Deploy no Render
- **Root Directory:** `backend` · **Node:** `.node-version`/`engines` exigem ≥ 22.12 (requisito do Prisma 7); se necessário defina também `NODE_VERSION=22.12.0` no serviço.
- **Build Command:** `npm install && npx prisma generate` (o `postinstall` também roda `prisma generate`, que **exige `DATABASE_URL` já disponível no build**). Esse comando **não aplica migrations**; veja a seção Migrations.
- **Start Command:** `npm start`
- **Variáveis:** `DATABASE_URL`, `JWT_SECRET` (aleatório, ≥ 32 caracteres; gere com `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`), `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_EXPIRES_IN`, `FRONTEND_URL` (apenas a origem, ex.: `https://usuario.github.io`), `NODE_ENV=production`, `TRUST_PROXY=1`. O `PORT` é definido pelo Render.
- **Banco:** Supabase (PostgreSQL). A aplicação usa a `DATABASE_URL` do serviço; se o provedor exigir SSL, acrescente `?sslmode=require`. Para aplicar migrations use a conexão direta ou o session pooler na porta 5432, nunca a porta 6543 (veja "Conexão para aplicar migrations").
- **Health check:** `/api/health` (não consulta o banco).
