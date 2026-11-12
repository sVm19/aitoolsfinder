#!/usr/bin/env bash
set -euo pipefail

DUMP_URL="${1:?usage: restore-db.sh s3://bucket/postgres/file.dump}"

ROOT="/opt/aitoolsfinder/repo/deploy"
set -a
. "$ROOT/.env.deploy"
set +a

: "${DATABASE_URL_SYNC:?DATABASE_URL_SYNC is required}"

TMP_FILE="$(mktemp /tmp/aitoolsfinder-restore-XXXXXX.dump)"
trap 'rm -f "$TMP_FILE"' EXIT

aws s3 cp "$DUMP_URL" "$TMP_FILE"
pg_restore --clean --if-exists --no-owner --no-privileges \
  -d "$DATABASE_URL_SYNC" "$TMP_FILE"

echo "Restore complete from $DUMP_URL"
