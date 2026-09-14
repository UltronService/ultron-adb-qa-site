#!/usr/bin/env bash
set -euo pipefail

log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*" | tee -a "${RUN_LOG_PATH:-/dev/stdout}"
}

: "${ADB_SERIAL:?ADB_SERIAL is required}"
: "${PACKAGE_NAME:?PACKAGE_NAME is required}"
: "${LAUNCH_TIME_MAX_MS:=5000}"
: "${RUN_LOG_PATH:=/dev/stdout}"
: "${LAUNCH_ACTIVITY:=${PACKAGE_NAME}/.MainActivity}"

ADB=(adb -s "$ADB_SERIAL")

log "cold-start: check package $PACKAGE_NAME"
if ! "${ADB[@]}" shell pm path "$PACKAGE_NAME" >/dev/null 2>&1; then
  log "cold-start: FAIL package not installed on $ADB_SERIAL"
  exit 1
fi

log "cold-start: force-stop $PACKAGE_NAME"
"${ADB[@]}" shell am force-stop "$PACKAGE_NAME" >>"$RUN_LOG_PATH" 2>&1 || true

log "cold-start: launch $LAUNCH_ACTIVITY"
START_OUTPUT=$("${ADB[@]}" shell am start -W -n "$LAUNCH_ACTIVITY" 2>&1) || true
echo "$START_OUTPUT" >>"$RUN_LOG_PATH"

TOTAL_TIME=$(echo "$START_OUTPUT" | awk '/TotalTime|WaitTime|ThisTime/ {print $2; exit}')
if [[ -z "${TOTAL_TIME:-}" ]]; then
  log "cold-start: unable to parse launch time from am start -W output"
  exit 1
fi

log "launch_time_ms=${TOTAL_TIME}"

if [[ "$TOTAL_TIME" -gt "$LAUNCH_TIME_MAX_MS" ]]; then
  log "cold-start: FAIL launch time ${TOTAL_TIME}ms > ${LAUNCH_TIME_MAX_MS}ms"
  exit 1
fi

log "cold-start: PASS"
exit 0
