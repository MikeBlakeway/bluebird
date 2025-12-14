#!/usr/bin/env bash
set -euo pipefail

# Simple PostgreSQL backup helper.
# - Dumps the database defined in DATABASE_URL
# - Stores compressed dumps under ${BACKUP_DIR:-./backups}
# - Optionally uploads to S3-compatible storage when S3_BACKUP_BUCKET is set

: "${DATABASE_URL:?DATABASE_URL is required}"

BACKUP_DIR=${BACKUP_DIR:-"./backups"}
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
BACKUP_NAME="bluebird-pg-${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

mkdir -p "${BACKUP_DIR}"

echo "Creating backup at ${BACKUP_PATH}"
pg_dump "${DATABASE_URL}" | gzip > "${BACKUP_PATH}"

if [[ -n "${S3_BACKUP_BUCKET:-}" ]]; then
  if command -v aws >/dev/null 2>&1; then
    echo "Uploading backup to s3://${S3_BACKUP_BUCKET}/db/${BACKUP_NAME}"
    if [[ -n "${S3_ENDPOINT:-}" ]]; then
      aws s3 cp "${BACKUP_PATH}" "s3://${S3_BACKUP_BUCKET}/db/${BACKUP_NAME}" --endpoint-url "${S3_ENDPOINT}"
    else
      aws s3 cp "${BACKUP_PATH}" "s3://${S3_BACKUP_BUCKET}/db/${BACKUP_NAME}"
    fi
  else
    echo "aws CLI not found; skipping upload to s3://${S3_BACKUP_BUCKET}" >&2
  fi
fi

echo "Backup completed"
