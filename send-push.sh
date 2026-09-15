#!/usr/bin/env bash
# List registered push devices, or send a notification by list number.
# Usage:
#   ./send-push.sh
#   ./send-push.sh 3 "This is a message"
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

PROJECT="${GCP_PROJECT:-auxilium-420904}"
ACCOUNT="${GCP_ACCOUNT:-eric.esthetix@gmail.com}"
DATABASE="${FIRESTORE_DATABASE:-aux-db}"
TITLE="${PUSH_TITLE:-Auxilium}"

usage() {
  cat <<EOF
Usage:
  ./send-push.sh
  ./send-push.sh <n> <message>

  no args     numbered list of registered devices
  n + message send that message to device n (1-based)

GCP_PROJECT=${PROJECT}  GCP_ACCOUNT=${ACCOUNT}
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "Need gcloud on PATH" >&2
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "Need python3 on PATH" >&2
  exit 1
fi

ACCESS="$(gcloud auth print-access-token --account="$ACCOUNT")"

# Prints a JSON array of {id, platform, createdAt, lastSeenAt, token, label}
fetch_devices() {
  ACCESS="$ACCESS" PROJECT="$PROJECT" DATABASE="$DATABASE" python3 - <<'PY'
import json, os, urllib.error, urllib.parse, urllib.request

project = os.environ["PROJECT"]
database = os.environ["DATABASE"]
access = os.environ["ACCESS"]
base = f"https://firestore.googleapis.com/v1/projects/{project}/databases/{database}/documents/pushTokens"

def sval(fields, key):
    v = (fields or {}).get(key) or {}
    return v.get("stringValue") or v.get("timestampValue") or ""

docs = []
page = None
while True:
    q = {"pageSize": "100"}
    if page:
        q["pageToken"] = page
    url = base + "?" + urllib.parse.urlencode(q)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {access}"})
    with urllib.request.urlopen(req) as resp:
        data = json.load(resp)
    for doc in data.get("documents") or []:
        fields = doc.get("fields") or {}
        token = sval(fields, "token")
        if not token:
            continue
        doc_id = doc.get("name", "").rsplit("/", 1)[-1]
        platform = sval(fields, "platform") or "unknown"
        last_seen = sval(fields, "lastSeenAt")
        created = sval(fields, "createdAt")
        name = sval(fields, "deviceName") or sval(fields, "name")
        label = name or f"{platform} {doc_id[:12]}"
        docs.append({
            "id": doc_id,
            "platform": platform,
            "createdAt": created,
            "lastSeenAt": last_seen,
            "token": token,
            "label": label,
        })
    page = data.get("nextPageToken")
    if not page:
        break

docs.sort(key=lambda d: (d["lastSeenAt"] or "", d["id"]), reverse=True)
print(json.dumps(docs))
PY
}

print_list() {
  python3 - <<'PY'
import json, os
docs = json.loads(os.environ["DEVICES"])
if not docs:
    print("No registered devices.")
    raise SystemExit(0)
print("Registered devices:")
for i, d in enumerate(docs, 1):
    seen = d.get("lastSeenAt") or "never"
    print(f"  {i}. {d['label']}  last seen {seen}")
PY
}

DEVICES="$(fetch_devices)"
export DEVICES

if [[ $# -eq 0 ]]; then
  print_list
  exit 0
fi

if [[ ! "${1}" =~ ^[0-9]+$ ]]; then
  usage >&2
  exit 1
fi
INDEX="$1"
shift
MESSAGE="${*:-}"
if [[ -z "$MESSAGE" ]]; then
  echo "Need a message. Example: ./send-push.sh 1 \"Hello\"" >&2
  exit 1
fi

ACCESS="$ACCESS" PROJECT="$PROJECT" TITLE="$TITLE" INDEX="$INDEX" MESSAGE="$MESSAGE" \
DEVICES="$DEVICES" python3 - <<'PY'
import json, os, sys, urllib.error, urllib.request

docs = json.loads(os.environ["DEVICES"])
try:
    n = int(os.environ["INDEX"])
except ValueError:
    print("Device number must be an integer", file=sys.stderr)
    sys.exit(1)
if n < 1 or n > len(docs):
    print(f"No device {n}. {len(docs)} registered. Run ./send-push.sh for the list.", file=sys.stderr)
    sys.exit(1)

device = docs[n - 1]
project = os.environ["PROJECT"]
title = os.environ["TITLE"]
message = os.environ["MESSAGE"]
access = os.environ["ACCESS"]
body = {
    "message": {
        "token": device["token"],
        "notification": {"title": title, "body": message},
        "apns": {"payload": {"aps": {"sound": "default"}}},
    }
}
url = f"https://fcm.googleapis.com/v1/projects/{project}/messages:send"
req = urllib.request.Request(
    url,
    data=json.dumps(body).encode(),
    headers={
        "Authorization": f"Bearer {access}",
        "Content-Type": "application/json",
    },
    method="POST",
)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.load(resp)
except urllib.error.HTTPError as e:
    err = e.read().decode()
    print(f"FCM send failed ({e.code}): {err}", file=sys.stderr)
    sys.exit(1)

print(f"Sent to {n} ({device['label']}): {message}")
if data.get("name"):
    print(data["name"])
PY
