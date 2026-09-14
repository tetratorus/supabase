-- NOTE: change to your own passwords for production environments
\set pgpass `echo "$POSTGRES_PASSWORD"`
\set pgpass_read_only `echo "$POSTGRES_PASSWORD_READ_ONLY"`

ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER pgbouncer WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_functions_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin WITH PASSWORD :'pgpass';

-- supabase_read_only_user must not share the main password; it only gets one
-- when POSTGRES_PASSWORD_READ_ONLY is set (used by the local MCP server in
-- read-only mode).
SELECT :'pgpass_read_only' <> '' AS has_pgpass_read_only \gset
\if :has_pgpass_read_only
ALTER USER supabase_read_only_user WITH PASSWORD :'pgpass_read_only';
\endif
