-- Ejecutar una sola vez en el SQL Editor de Supabase.
-- No ejecutar contra el PostgreSQL local.
-- El esquema auth de Supabase ya existe y contiene auth.users; VeriX no lo usa.

CREATE SCHEMA IF NOT EXISTS verix_auth;
CREATE SCHEMA IF NOT EXISTS game;

GRANT USAGE, CREATE ON SCHEMA verix_auth TO postgres;
GRANT USAGE, CREATE ON SCHEMA game TO postgres;
