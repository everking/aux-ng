#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env with XAI_API_KEY" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

if [[ -z "${XAI_API_KEY:-}" && -z "${OPENAI_API_KEY:-}" ]]; then
  echo "Need XAI_API_KEY and/or OPENAI_API_KEY in .env" >&2
  exit 1
fi

PROJECT="${GCP_PROJECT:-auxilium-420904}"
REGION="${GCP_REGION:-us-central1}"
ACCOUNT="${GCP_ACCOUNT:-eric.esthetix@gmail.com}"

upsert_secret() {
  local name="$1"
  local value="$2"
  local tmp
  tmp="$(mktemp)"
  printf '%s' "$value" > "$tmp"
  if gcloud secrets describe "$name" --project="$PROJECT" --account="$ACCOUNT" >/dev/null 2>&1; then
    gcloud secrets versions add "$name" --project="$PROJECT" --account="$ACCOUNT" --data-file="$tmp"
  else
    gcloud secrets create "$name" --project="$PROJECT" --account="$ACCOUNT" --data-file="$tmp"
  fi
  rm -f "$tmp"
  gcloud secrets add-iam-policy-binding "$name" \
    --project="$PROJECT" \
    --account="$ACCOUNT" \
    --member="serviceAccount:${PROJECT}@appspot.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    >/dev/null
}

SECRET_FLAGS=()
if [[ -n "${XAI_API_KEY:-}" ]]; then
  upsert_secret XAI_API_KEY "$XAI_API_KEY"
  SECRET_FLAGS+=("XAI_API_KEY=XAI_API_KEY:latest")
elif gcloud secrets describe XAI_API_KEY --project="$PROJECT" --account="$ACCOUNT" >/dev/null 2>&1; then
  SECRET_FLAGS+=("XAI_API_KEY=XAI_API_KEY:latest")
fi
if [[ -n "${OPENAI_API_KEY:-}" ]]; then
  upsert_secret OPENAI_API_KEY "$OPENAI_API_KEY"
  SECRET_FLAGS+=("OPENAI_API_KEY=OPENAI_API_KEY:latest")
elif gcloud secrets describe OPENAI_API_KEY --project="$PROJECT" --account="$ACCOUNT" >/dev/null 2>&1; then
  SECRET_FLAGS+=("OPENAI_API_KEY=OPENAI_API_KEY:latest")
fi

if [[ ${#SECRET_FLAGS[@]} -eq 0 ]]; then
  echo "No XAI_API_KEY or OPENAI_API_KEY secret available" >&2
  exit 1
fi

IFS=','
SECRET_JOINED="${SECRET_FLAGS[*]}"
unset IFS

gcloud functions deploy generateEmbedding \
  --project="$PROJECT" \
  --account="$ACCOUNT" \
  --region="$REGION" \
  --runtime=nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point=generateEmbedding \
  --source="$ROOT/functions" \
  --memory=1024MB \
  --timeout=30s \
  --set-secrets="$SECRET_JOINED"

echo "Deployed https://${REGION}-${PROJECT}.cloudfunctions.net/generateEmbedding"
