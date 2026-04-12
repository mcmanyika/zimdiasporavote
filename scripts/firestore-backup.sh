#!/usr/bin/env bash

set -euo pipefail

# Firestore full export helper.
# Required:
#   FIREBASE_PROJECT_ID   e.g. zimdiasporavote
#   FIREBASE_BACKUP_BUCKET e.g. gs://zimdiasporavote-backups
#
# Optional:
#   FIRESTORE_BACKUP_PREFIX (default: firestore-backups)

PROJECT_ID="${FIREBASE_PROJECT_ID:-}"
BUCKET="${FIREBASE_BACKUP_BUCKET:-}"
PREFIX="${FIRESTORE_BACKUP_PREFIX:-firestore-backups}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "ERROR: FIREBASE_PROJECT_ID is not set."
  exit 1
fi

if [[ -z "${BUCKET}" ]]; then
  echo "ERROR: FIREBASE_BACKUP_BUCKET is not set."
  echo "Example: export FIREBASE_BACKUP_BUCKET=gs://your-backup-bucket"
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "ERROR: gcloud CLI not found. Install Google Cloud SDK first."
  exit 1
fi

TIMESTAMP="$(date +%F-%H%M%S)"
DEST="${BUCKET%/}/${PREFIX}/${TIMESTAMP}"

echo "Using project: ${PROJECT_ID}"
echo "Export target: ${DEST}"

gcloud config set project "${PROJECT_ID}" >/dev/null
gcloud firestore export "${DEST}"

echo "Backup complete."
echo "Location: ${DEST}"
