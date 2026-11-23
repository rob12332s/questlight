#!/usr/bin/env bash
# Runs every migration and every tests/db/*.test.sql file against a throwaway local
# PostgreSQL cluster. Needs PostgreSQL 15+ server binaries (initdb, pg_ctl, psql).
#   npm run test:db
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PG_BIN="${PG_BIN:-$(dirname "$(command -v pg_ctl 2>/dev/null || ls /usr/lib/postgresql/*/bin/pg_ctl 2>/dev/null | sort -V | tail -1)")}"
WORK="$(mktemp -d)"
PORT="${PG_TEST_PORT:-54329}"
RUN_AS=()

# initdb refuses to run as root; use the postgres OS user when available.
if [ "$(id -u)" = "0" ]; then
  chown postgres "$WORK"
  RUN_AS=(runuser -u postgres --)
fi

cleanup() {
  "${RUN_AS[@]}" "$PG_BIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

"${RUN_AS[@]}" "$PG_BIN/initdb" -D "$WORK/data" -U postgres --auth=trust >/dev/null
"${RUN_AS[@]}" "$PG_BIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -l "$WORK/pg.log" -w start >/dev/null

PSQL_BASE=("$PG_BIN/psql" -h "$WORK" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -X -q)
"${PSQL_BASE[@]}" -d postgres -c "create database questlight_base"
PSQL=("${PSQL_BASE[@]}" -d questlight_base)

echo "→ Supabase stub"
"${PSQL[@]}" -f "$ROOT/tests/db/supabase_stub.sql"

for migration in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ migration $(basename "$migration")"
  "${PSQL[@]}" -f "$migration"
done

echo "→ test helpers"
"${PSQL[@]}" -f "$ROOT/tests/db/helpers.sql"

# Each test file gets a fresh copy of the migrated database, so files can't affect each other.
status=0
n=0
for test in "$ROOT"/tests/db/*.test.sql; do
  n=$((n + 1))
  echo "→ $(basename "$test")"
  "${PSQL_BASE[@]}" -d postgres -c "create database test_$n template questlight_base"
  if ! "${PSQL_BASE[@]}" -d "test_$n" -f "$test"; then status=1; fi
done

if [ "$status" = "0" ]; then echo "✓ database tests passed"; else echo "✗ database tests FAILED"; fi
exit "$status"
