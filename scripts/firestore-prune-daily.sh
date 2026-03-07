#!/usr/bin/env bash

set -euo pipefail

# Prune old Firestore backups by age (daily window).
# Required:
#   FIREBASE_BACKUP_BUCKET   e.g. gs://defend-constitution-plat-dba4c.firebasestorage.app
#
# Optional:
#   FIRESTORE_BACKUP_PREFIX  (default: firestore-backups)
#   KEEP_DAILY_DAYS          (default: 30)
#
# Notes:
# - Backup folders are expected to be named YYYY-MM-DD-HHMMSS.
# - This deletes folders older than KEEP_DAILY_DAYS.

BUCKET="${FIREBASE_BACKUP_BUCKET:-}"
PREFIX="${FIRESTORE_BACKUP_PREFIX:-firestore-backups}"
KEEP_DAYS="${KEEP_DAILY_DAYS:-30}"

if [[ -z "${BUCKET}" ]]; then
  echo "ERROR: FIREBASE_BACKUP_BUCKET is not set."
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "ERROR: gcloud CLI not found."
  exit 1
fi

BASE="${BUCKET%/}/${PREFIX}"
CUTOFF_EPOCH="$(date -v-"${KEEP_DAYS}"d +%s 2>/dev/null || date -d "${KEEP_DAYS} days ago" +%s)"

echo "Pruning daily backups older than ${KEEP_DAYS} days under ${BASE}"

while IFS= read -r entry; do
  # Expect path like: gs://bucket/firestore-backups/2026-03-06-202858/
  name="$(basename "${entry%/}")"
  date_part="${name:0:10}" # YYYY-MM-DD

  if [[ ! "${date_part}" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    continue
  fi

  folder_epoch="$(date -j -f "%Y-%m-%d" "${date_part}" +%s 2>/dev/null || date -d "${date_part}" +%s)"
  if (( folder_epoch < CUTOFF_EPOCH )); then
    echo "Deleting old backup: ${entry}"
    gcloud storage rm --recursive "${entry}"
  fi
done < <(gcloud storage ls "${BASE}/" 2>/dev/null || true)

echo "Daily prune complete."
