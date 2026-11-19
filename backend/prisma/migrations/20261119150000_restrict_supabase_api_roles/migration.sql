-- Fecha o acesso da API REST do Supabase (papéis anon/authenticated) ao schema
-- public. O backend conecta como o dono das tabelas (postgres) e não é afetado:
-- o dono ignora RLS (sem FORCE) e mantém todos os privilégios.
-- Só altera permissões; nenhum dado é modificado.

-- 1) RLS nas cinco tabelas, sem policies: papéis que não são donos nem têm
--    BYPASSRLS não enxergam nenhuma linha, mesmo que um GRANT volte a existir.
--    Sem FORCE ROW LEVEL SECURITY, de propósito: o dono (backend/Prisma) segue livre.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- 2) PUBLIC existe em qualquer PostgreSQL; hoje não tem grants nessas tabelas,
--    mas anon/authenticated herdariam qualquer um que aparecesse.
REVOKE ALL ON TABLE "users", "accounts", "categories", "transactions", "_prisma_migrations" FROM PUBLIC;

-- 3) anon/authenticated só existem no Supabase. No PostgreSQL do CI eles não
--    existem e um REVOKE direto falharia, por isso o bloco condicional.
DO $$
DECLARE
  api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      -- 3a) Privilégios atuais nas cinco tabelas (inclui _prisma_migrations,
      --     hoje com ALL para os dois papéis).
      EXECUTE format(
        'REVOKE ALL ON TABLE public.users, public.accounts, public.categories, public.transactions, public._prisma_migrations FROM %I',
        api_role
      );

      -- 3b) Objetos futuros criados pelo papel que roda as migrations
      --     (postgres no Supabase): tabelas e sequências nascem sem acesso.
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON TABLES FROM %I',
        current_user, api_role
      );
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I',
        current_user, api_role
      );

      -- 3c) Funções: remove o EXECUTE explícito concedido pelo Supabase.
      --     Atenção: o PostgreSQL concede EXECUTE a PUBLIC em toda função nova
      --     por um padrão GLOBAL, que não pode ser revogado por schema; anon e
      --     authenticated herdam de PUBLIC. Toda função criada no futuro em
      --     public precisa de "REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC" na
      --     própria migration. Hoje não há nenhuma função em public.
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %I',
        current_user, api_role
      );
    END IF;
  END LOOP;
END
$$;
