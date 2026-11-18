-- Índice composto para a listagem/resumo por usuário e período.
CREATE INDEX "transactions_userId_date_idx" ON "transactions"("userId", "date");

-- O índice isolado em "date" não é usado nas consultas (sempre filtramos por userId).
DROP INDEX "transactions_date_idx";

-- Valor de transação deve ser positivo (o sentido vem do campo "type").
-- NOT VALID: aplica a novos registros sem falhar caso exista dado legado inválido.
-- Depois de conferir os dados existentes, rode:
--   ALTER TABLE "transactions" VALIDATE CONSTRAINT "transactions_amount_positive";
ALTER TABLE "transactions"
  ADD CONSTRAINT "transactions_amount_positive" CHECK ("amount" > 0) NOT VALID;
