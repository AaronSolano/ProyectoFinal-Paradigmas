-- ProfeLink: esquemas aislados para auth-service y game-service (PostgreSQL 16)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS game;

COMMENT ON SCHEMA auth IS 'Bounded context: identidad y autenticación (auth-service)';
COMMENT ON SCHEMA game IS 'Bounded context: cuestionarios, sesiones y resultados (game-service)';
