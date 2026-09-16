#!/usr/bin/env bash
# Build the Angular app and the Capacitor iOS shell.
# Usage:
#   ./build-ios.sh              # build + sync (Xcode project ready)
#   ./build-ios.sh run          # launch on a connected iPhone, else Simulator
#   ./build-ios.sh run device   # require a physical iPhone
#   ./build-ios.sh run sim      # iPhone 17 Simulator only
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# Capacitor CLI 8 requires Node >= 22. Prefer Homebrew if nvm is on 20.
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
else
  NODE_MAJOR=0
fi
if [[ "$NODE_MAJOR" -lt 22 && -x /opt/homebrew/bin/node ]]; then
  export PATH="/opt/homebrew/bin:$PATH"
fi
if [[ "$(node -p "process.versions.node.split('.')[0]")" -lt 22 ]]; then
  echo "Need Node.js >= 22 for Capacitor (current: $(node -v))" >&2
  exit 1
fi

echo "Node $(node -v)"

PLIST_SRC="$ROOT/secrets/GoogleService-Info.plist"
PLIST_DST="$ROOT/ios/App/App/GoogleService-Info.plist"
if [[ -f "$PLIST_SRC" ]]; then
  cp "$PLIST_SRC" "$PLIST_DST"
elif [[ ! -f "$PLIST_DST" ]]; then
  echo "Missing secrets/GoogleService-Info.plist (download it from Firebase for com.auxilium.guide)." >&2
  exit 1
fi

npx ng build --configuration development
npx cap sync ios

if [[ "${1:-}" == "run" ]]; then
  MODE="${2:-auto}"
  pick_physical() {
    npx cap run ios --list 2>/dev/null | awk '
      /simulator/ { next }
      /^Name/ { next }
      /^---/ { next }
      /iOS/ {
        print $NF
        exit
      }'
  }
  pick_iphone17() {
    local want_booted="${1:-}"
    xcrun simctl list devices available | awk -v want="$want_booted" '
      /iPhone 17 \(/ {
        if (want == "booted" && $0 !~ /Booted/) next
        if (match($0, /[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/)) {
          print substr($0, RSTART, RLENGTH)
          exit
        }
      }'
  }

  TARGET=""
  if [[ "$MODE" != "sim" ]]; then
    TARGET="${IOS_DEVICE_ID:-$(pick_physical)}"
  fi
  if [[ -z "$TARGET" && "$MODE" == "device" ]]; then
    echo "No physical iPhone found. Unlock it, keep it on the same network or USB, then retry." >&2
    exit 1
  fi
  if [[ -z "$TARGET" ]]; then
    TARGET="${IOS_SIMULATOR_ID:-$(pick_iphone17 booted)}"
  fi
  if [[ -z "$TARGET" ]]; then
    TARGET="$(pick_iphone17)"
  fi
  if [[ -n "$TARGET" ]]; then
    echo "Installing on $TARGET"
    npx cap run ios --target "$TARGET"
  else
    npx cap run ios --target "iPhone 17"
  fi
  echo "Launched Auxilium."
else
  echo "iOS project is ready. Open with: npx cap open ios"
  echo "Physical iPhone: ./build-ios.sh run"
  echo "Simulator only:  ./build-ios.sh run sim"
fi
