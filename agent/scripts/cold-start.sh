#!/usr/bin/env bash
set -euo pipefail

log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*" | tee -a "${RUN_LOG_PATH:-/dev/stdout}"
}

: "${ADB_SERIAL:?ADB_SERIAL is required}"
: "${PACKAGE_NAME:?PACKAGE_NAME is required}"
: "${LAUNCH_TIME_MAX_MS:=3000}"
: "${RUN_LOG_PATH:=/dev/stdout}"

ADB=(adb -s "$ADB_SERIAL")

log "cold-start: force-stop $PACKAGE_NAME"
"${ADB[@]}" shell am force-stop "$PACKAGE_NAME" >>"$RUN_LOG_PATH" 2>&1 || true

log "cold-start: launch $PACKAGE_NAME"
OUTPUT=$("${ADB[@]}" shell monkey -p "$PACKAGE_NAME" -c android.intent.category.LAUNCHER 1 2>&1) || true
echo "$OUTPUT" >>"$RUN_LOG_PATH"

START_OUTPUT=$("${ADB[@]}" shell am start -W -a android.intent.action.MAIN -c android.intent.category.LAUNCHER "$PACKAGE_NAME" 2>&1) || true
echo "$START_OUTPUT" >>"$RUN_LOG_PATH"

TOTAL_TIME=$(echo "$START_OUTPUT" | awk '/TotalTime/ {print $2; exit}')
if [[ -z "${TOTAL_TIME:-}" ]]; then
  log "cold-start: unable to parse TotalTime"
  exit 1
fi

log "launch_time_ms=${TOTAL_TIME}"

if [[ "$TOTAL_TIME" -gt "$LAUNCH_TIME_MAX_MS" ]]; then
  log "cold-start: FAIL TotalTime ${TOTAL_TIME}ms > ${LAUNCH_TIME_MAX_MS}ms"
  exit 1
fi

log "cold-start: PASS"
exit 0
