-- PostgreSQL initialization script
-- Extensions only. Table and enum DDL is owned by drizzle migrations
-- (see packages/backend/src/db/migrations) — do not duplicate it here.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
