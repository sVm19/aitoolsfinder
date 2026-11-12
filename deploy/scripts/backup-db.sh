#!/usr/bin/env bash
set -euo pipefail

ROOT="/opt/aitoolsfinder/repo/deploy"
set -a
. "$ROOT/.env.deploy"
set +a

: "${DATABASE_URL_SYNC:?DATABASE_URL_SYNC is required}"
: "${BACKUP_BUCKET:?BACKUP_BUCKET is required}"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

pg_dump "$DATABASE_URL_SYNC" --format=custom --no-owner --no-privileges \
  | aws s3 cp - "s3://${BACKUP_BUCKET}/postgres/${STAMP}.dump"

echo "Backup uploaded: s3://${BACKUP_BUCKET}/postgres/${STAMP}.dump"
