#!/usr/bin/env bash

set -euo pipefail

# Firestore restore helper.
# Required:
#   FIREBASE_PROJECT_ID e.g. defend-constitution-plat-dba4c
#
# Usage:
#   npm run restore:firestore -- gs://bucket/path/to/export-folder

PROJECT_ID="${FIREBASE_PROJECT_ID:-}"
SOURCE_PATH="${1:-}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "ERROR: FIREBASE_PROJECT_ID is not set."
  exit 1
fi

if [[ -z "${SOURCE_PATH}" ]]; then
  echo "ERROR: Missing export source path."
  echo "Usage: npm run restore:firestore -- gs://bucket/path/to/export-folder"
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "ERROR: gcloud CLI not found. Install Google Cloud SDK first."
  exit 1
fi

echo "Using project: ${PROJECT_ID}"
echo "Restore source: ${SOURCE_PATH}"
echo
echo "WARNING: Import will overwrite matching documents."
read -r -p "Type 'yes' to continue: " CONFIRM

if [[ "${CONFIRM}" != "yes" ]]; then
  echo "Restore cancelled."
  exit 0
fi

gcloud config set project "${PROJECT_ID}" >/dev/null
gcloud firestore import "${SOURCE_PATH}"

echo "Restore complete."
