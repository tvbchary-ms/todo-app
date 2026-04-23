#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# PostgreSQL Backup Script
# Runs pg_dump and uploads to AWS S3
# 
# Usage: ./backup.sh
# Cron:  0 2 * * * /path/to/backup.sh >> /var/log/todo-backup.log 2>&1
# ─────────────────────────────────────────────────────────────

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-/tmp/todo-backups}"
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-todo_db}"
DB_USER="${DB_USER:-todo_user}"
S3_BUCKET="${AWS_S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

# ── Functions ──────────────────────────────────────────────────

log() {
  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"
}

cleanup_local() {
  log "Cleaning local backups older than ${RETENTION_DAYS} days..."
  find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true
}

# ── Main ───────────────────────────────────────────────────────

log "Starting backup of ${DB_NAME}..."

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Run pg_dump with compression
log "Running pg_dump..."
PGPASSWORD="${PGPASSWORD:-todo_password}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=custom \
  --compress=9 \
  --verbose \
  --no-owner \
  --no-privileges \
  --file="${BACKUP_FILE}" \
  2>&1 | while read -r line; do log "  pg_dump: ${line}"; done

# Verify backup file exists and has content
if [[ ! -s "${BACKUP_FILE}" ]]; then
  log "ERROR: Backup file is empty or missing: ${BACKUP_FILE}"
  exit 1
fi

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
log "Backup created: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Upload to S3 if bucket is configured
if [[ -n "${S3_BUCKET}" ]]; then
  S3_PATH="s3://${S3_BUCKET}/${S3_PREFIX}/${DB_NAME}_${TIMESTAMP}.sql.gz"
  log "Uploading to ${S3_PATH}..."
  
  aws s3 cp "${BACKUP_FILE}" "${S3_PATH}" \
    --storage-class STANDARD_IA \
    --only-show-errors

  log "Upload complete"

  # Clean old S3 backups (keep last RETENTION_DAYS days)
  log "Cleaning S3 backups older than ${RETENTION_DAYS} days..."
  CUTOFF_DATE=$(date -u -d "-${RETENTION_DAYS} days" +%Y-%m-%dT%H:%M:%S 2>/dev/null || \
                date -u -v-"${RETENTION_DAYS}"d +%Y-%m-%dT%H:%M:%S)
  
  aws s3api list-objects-v2 \
    --bucket "${S3_BUCKET}" \
    --prefix "${S3_PREFIX}/" \
    --query "Contents[?LastModified<='${CUTOFF_DATE}'].Key" \
    --output text 2>/dev/null | \
  while read -r key; do
    if [[ -n "${key}" && "${key}" != "None" ]]; then
      log "  Deleting old backup: ${key}"
      aws s3 rm "s3://${S3_BUCKET}/${key}" --only-show-errors
    fi
  done
else
  log "S3_BUCKET not set — skipping upload (local backup only)"
fi

# Clean old local backups
cleanup_local

log "✅ Backup completed successfully"
