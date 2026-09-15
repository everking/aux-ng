#!/usr/bin/env bash
# Prepare the Capacitor iOS app for push, and print what Apple will not automate.
#
# Apple does not provide an API to create the APNs Auth Key (.p8). That one
# download still has to happen in a browser (Account Holder or Admin).
#
# After you have the .p8, you can set:
#   APNS_P8_FILE   path to AuthKey_XXXXXXXXXX.p8
#   APNS_KEY_ID    10-character Key ID
#   APPLE_TEAM_ID  10-character Team ID
# and this script will remind you / open Firebase to upload it.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUNDLE_ID="com.auxilium.guide"
FIREBASE_PROJECT="auxilium-420904"

echo "=== Local Xcode (scriptable) ==="
echo "Entitlements: ios/App/App/App.entitlements (aps-environment=development)"
echo "Info.plist: UIBackgroundModes = remote-notification"
echo "Bundle ID: ${BUNDLE_ID}"
echo

if [[ ! -f "$ROOT/ios/App/App/App.entitlements" ]]; then
  echo "Missing entitlements file. Run this from the aux-ng repo after Capacitor iOS exists." >&2
  exit 1
fi

echo "=== Apple Developer (not scriptable) ==="
echo "Apple has no API to create an APNs .p8 key. Do this once in the browser:"
echo "  1. Paid Apple Developer Program"
echo "  2. https://developer.apple.com/account/resources/identifiers/list"
echo "     Create App ID ${BUNDLE_ID} with Push Notifications"
echo "  3. https://developer.apple.com/account/resources/authkeys/list"
echo "     Keys → + → enable APNs (Sandbox & Production) → Register → Download"
echo "     Save Key ID, Team ID, and the .p8 (downloadable only once)"
echo
open "https://developer.apple.com/account/resources/authkeys/list" 2>/dev/null || true

if [[ -n "${APNS_P8_FILE:-}" && -n "${APNS_KEY_ID:-}" && -n "${APPLE_TEAM_ID:-}" ]]; then
  if [[ ! -f "$APNS_P8_FILE" ]]; then
    echo "APNS_P8_FILE not found: $APNS_P8_FILE" >&2
    exit 1
  fi
  echo "=== Firebase upload (semi-scriptable) ==="
  echo "Firebase CLI has no stable command to upload an APNs .p8."
  echo "Opening Cloud Messaging settings. Upload:"
  echo "  file:    $APNS_P8_FILE"
  echo "  Key ID:  $APNS_KEY_ID"
  echo "  Team ID: $APPLE_TEAM_ID"
  echo "  Bundle:  $BUNDLE_ID"
  open "https://console.firebase.google.com/project/${FIREBASE_PROJECT}/settings/cloudmessaging" 2>/dev/null || true
else
  echo "=== After you have the .p8 ==="
  echo "  export APNS_P8_FILE=\"\$HOME/Downloads/AuthKey_XXXXXXXXXX.p8\""
  echo "  export APNS_KEY_ID=XXXXXXXXXX"
  echo "  export APPLE_TEAM_ID=XXXXXXXXXX"
  echo "  ./scripts/setup-ios-push.sh"
  echo
  echo "Then in Firebase: Project settings → Cloud Messaging → APNs authentication key → Upload"
  echo "  https://console.firebase.google.com/project/${FIREBASE_PROJECT}/settings/cloudmessaging"
fi

echo
echo "Simulator cannot receive real APNs. Use a physical iPhone to test push."
