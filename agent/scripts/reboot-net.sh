#!/usr/bin/env bash
set -euo pipefail

log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*" | tee -a "${RUN_LOG_PATH:-/dev/stdout}"
}

: "${ADB_SERIAL:?ADB_SERIAL is required}"
: "${RUN_LOG_PATH:=/dev/stdout}"

ADB=(adb -s "$ADB_SERIAL")
TIMEOUT_SECONDS=120
INTERVAL=5
ELAPSED=0

log "reboot-net: reboot device"
"${ADB[@]}" reboot >>"$RUN_LOG_PATH" 2>&1 || true

log "reboot-net: wait for device"
"${ADB[@]}" wait-for-device >>"$RUN_LOG_PATH" 2>&1 || true

log "reboot-net: wait for boot complete"
while [[ "$ELAPSED" -lt "$TIMEOUT_SECONDS" ]]; do
  BOOT=$("${ADB[@]}" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || echo "")
  if [[ "$BOOT" == "1" ]]; then
    break
  fi
  sleep "$INTERVAL"
  ELAPSED=$((ELAPSED + INTERVAL))
done

if [[ "$ELAPSED" -ge "$TIMEOUT_SECONDS" ]]; then
  log "reboot-net: FAIL — boot timeout"
  exit 1
fi

log "reboot-net: ping 8.8.8.8"
ELAPSED=0
while [[ "$ELAPSED" -lt "$TIMEOUT_SECONDS" ]]; do
  if "${ADB[@]}" shell ping -c 1 -W 3 8.8.8.8 >>"$RUN_LOG_PATH" 2>&1; then
    log "reboot-net: PASS — network restored in ${ELAPSED}s"
    exit 0
  fi
  sleep "$INTERVAL"
  ELAPSED=$((ELAPSED + INTERVAL))
done

log "reboot-net: FAIL — ping timeout"
exit 1
