#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# PostgreSQL Restore Script
# Restores from a pg_dump backup (local or S3)
#
# Usage:
#   ./restore.sh /path/to/backup.sql.gz          (local file)
#   ./restore.sh s3://bucket/path/backup.sql.gz   (S3 file)
# ─────────────────────────────────────────────────────────────

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-todo_db}"
DB_USER="${DB_USER:-todo_user}"

# ── Functions ──────────────────────────────────────────────────

log() {
  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"
}

usage() {
  echo "Usage: $0 <backup-file-or-s3-path>"
  echo ""
  echo "Examples:"
  echo "  $0 /tmp/todo-backups/todo_db_20240101_020000.sql.gz"
  echo "  $0 s3://my-bucket/backups/postgres/todo_db_20240101_020000.sql.gz"
  exit 1
}

# ── Validation ─────────────────────────────────────────────────

if [[ $# -lt 1 ]]; then
  usage
fi

BACKUP_SOURCE="$1"
RESTORE_FILE=""

# ── Main ───────────────────────────────────────────────────────

log "=== PostgreSQL Restore ==="
log "Source: ${BACKUP_SOURCE}"
log "Target: ${DB_NAME}@${DB_HOST}:${DB_PORT}"

# Download from S3 if needed
if [[ "${BACKUP_SOURCE}" == s3://* ]]; then
  RESTORE_FILE="/tmp/restore_$(date +%s).sql.gz"
  log "Downloading from S3..."
  aws s3 cp "${BACKUP_SOURCE}" "${RESTORE_FILE}" --only-show-errors
  log "Downloaded to ${RESTORE_FILE}"
else
  RESTORE_FILE="${BACKUP_SOURCE}"
fi

# Verify file exists
if [[ ! -f "${RESTORE_FILE}" ]]; then
  log "ERROR: Backup file not found: ${RESTORE_FILE}"
  exit 1
fi

log ""
log "⚠️  WARNING: This will DROP and RECREATE the database '${DB_NAME}'"
log "Press Ctrl+C within 10 seconds to abort..."
sleep 10

# Terminate existing connections
log "Terminating existing connections to ${DB_NAME}..."
PGPASSWORD="${PGPASSWORD:-todo_password}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" \
  2>/dev/null || true

# Drop and recreate database
log "Dropping database ${DB_NAME}..."
PGPASSWORD="${PGPASSWORD:-todo_password}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d postgres \
  -c "DROP DATABASE IF EXISTS ${DB_NAME};"

log "Creating database ${DB_NAME}..."
PGPASSWORD="${PGPASSWORD:-todo_password}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d postgres \
  -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

# Restore from backup
log "Restoring from backup..."
PGPASSWORD="${PGPASSWORD:-todo_password}" pg_restore \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --no-owner \
  --no-privileges \
  --verbose \
  "${RESTORE_FILE}" \
  2>&1 | while read -r line; do log "  pg_restore: ${line}"; done

# Cleanup downloaded file
if [[ "${BACKUP_SOURCE}" == s3://* ]]; then
  rm -f "${RESTORE_FILE}"
  log "Cleaned up temporary download"
fi

log ""
log "✅ Restore completed successfully"
log "Database '${DB_NAME}' has been restored from: ${BACKUP_SOURCE}"
