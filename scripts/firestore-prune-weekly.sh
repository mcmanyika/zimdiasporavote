#!/usr/bin/env bash

set -euo pipefail

# Prune weekly and monthly Firestore backups by retention policy.
# Required:
#   FIREBASE_BACKUP_BUCKET   e.g. gs://defend-constitution-plat-dba4c.firebasestorage.app
#
# Optional:
#   FIRESTORE_BACKUP_PREFIX  (default: firestore-backups)
#   KEEP_WEEKLY_WEEKS        (default: 12)
#   KEEP_MONTHLY_MONTHS      (default: 12)
#
# Strategy:
# - Keep all backups newer than 30 days (daily handled elsewhere).
# - For older backups:
#   - Keep one per ISO week for KEEP_WEEKLY_WEEKS.
#   - Keep one per month for KEEP_MONTHLY_MONTHS.
#   - Delete the rest.

BUCKET="${FIREBASE_BACKUP_BUCKET:-}"
PREFIX="${FIRESTORE_BACKUP_PREFIX:-firestore-backups}"
KEEP_WEEKLY_WEEKS="${KEEP_WEEKLY_WEEKS:-12}"
KEEP_MONTHLY_MONTHS="${KEEP_MONTHLY_MONTHS:-12}"

if [[ -z "${BUCKET}" ]]; then
  echo "ERROR: FIREBASE_BACKUP_BUCKET is not set."
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "ERROR: gcloud CLI not found."
  exit 1
fi

BASE="${BUCKET%/}/${PREFIX}"
THIRTY_DAYS_AGO="$(date -v-30d +%s 2>/dev/null || date -d '30 days ago' +%s)"
WEEKLY_CUTOFF="$(date -v-"${KEEP_WEEKLY_WEEKS}"w +%s 2>/dev/null || date -d "${KEEP_WEEKLY_WEEKS} weeks ago" +%s)"
MONTHLY_CUTOFF="$(date -v-"${KEEP_MONTHLY_MONTHS}"m +%s 2>/dev/null || date -d "${KEEP_MONTHLY_MONTHS} months ago" +%s)"

declare -A kept_week
declare -A kept_month

echo "Pruning weekly/monthly backups under ${BASE}"

while IFS= read -r entry; do
  name="$(basename "${entry%/}")"
  date_part="${name:0:10}" # YYYY-MM-DD

  if [[ ! "${date_part}" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    continue
  fi

  folder_epoch="$(date -j -f "%Y-%m-%d" "${date_part}" +%s 2>/dev/null || date -d "${date_part}" +%s)"

  # Keep all backups from the most recent 30 days.
  if (( folder_epoch >= THIRTY_DAYS_AGO )); then
    continue
  fi

  # Drop everything older than monthly retention.
  if (( folder_epoch < MONTHLY_CUTOFF )); then
    echo "Deleting beyond monthly retention: ${entry}"
    gcloud storage rm --recursive "${entry}"
    continue
  fi

  week_key="$(date -j -f "%Y-%m-%d" "${date_part}" +"%G-W%V" 2>/dev/null || date -d "${date_part}" +"%G-W%V")"
  month_key="${date_part:0:7}" # YYYY-MM

  # Keep one per week within weekly window.
  if (( folder_epoch >= WEEKLY_CUTOFF )); then
    if [[ -z "${kept_week[${week_key}]:-}" ]]; then
      kept_week["${week_key}"]="${name}"
      continue
    fi
    echo "Deleting extra weekly backup: ${entry}"
    gcloud storage rm --recursive "${entry}"
    continue
  fi

  # Keep one per month within monthly window.
  if [[ -z "${kept_month[${month_key}]:-}" ]]; then
    kept_month["${month_key}"]="${name}"
    continue
  fi

  echo "Deleting extra monthly backup: ${entry}"
  gcloud storage rm --recursive "${entry}"
done < <(gcloud storage ls "${BASE}/" 2>/dev/null | sort || true)

echo "Weekly/monthly prune complete."
