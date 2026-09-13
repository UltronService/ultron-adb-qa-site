#!/usr/bin/env bash
set -euo pipefail

log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*" | tee -a "${RUN_LOG_PATH:-/dev/stdout}"
}

: "${ADB_SERIAL:?ADB_SERIAL is required}"
: "${PACKAGE_NAME:?PACKAGE_NAME is required}"
: "${MONKEY_EVENTS:=500}"
: "${RUN_LOG_PATH:=/dev/stdout}"

ADB=(adb -s "$ADB_SERIAL")

log "monkey-stress: clear logcat"
"${ADB[@]}" logcat -c >>"$RUN_LOG_PATH" 2>&1 || true

log "monkey-stress: run monkey with ${MONKEY_EVENTS} events"
"${ADB[@]}" shell monkey -p "$PACKAGE_NAME" --ignore-crashes --ignore-timeouts --ignore-security-exceptions \
  --pct-syskeys 0 "$MONKEY_EVENTS" >>"$RUN_LOG_PATH" 2>&1 || true

sleep 2
LOG_SNippet=$("${ADB[@]}" logcat -d -t 200 2>/dev/null || true)
echo "$LOG_SNippet" >>"$RUN_LOG_PATH"

if echo "$LOG_SNippet" | grep -q "AndroidRuntime: FATAL"; then
  log "monkey-stress: FAIL — FATAL exception detected"
  exit 1
fi

log "monkey-stress: PASS"
exit 0
