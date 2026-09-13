#!/usr/bin/env bash
set -euo pipefail

log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*" | tee -a "${RUN_LOG_PATH:-/dev/stdout}"
}

: "${ADB_SERIAL:?ADB_SERIAL is required}"
: "${PACKAGE_NAME:?PACKAGE_NAME is required}"
: "${DURATION_MINUTES:=30}"
: "${RUN_LOG_PATH:=/dev/stdout}"

ADB=(adb -s "$ADB_SERIAL")
INTERVAL_SECONDS=30
TOTAL_SECONDS=$((DURATION_MINUTES * 60))
ELAPSED=0

log "long-playback: launch $PACKAGE_NAME"
"${ADB[@]}" shell monkey -p "$PACKAGE_NAME" -c android.intent.category.LAUNCHER 1 >>"$RUN_LOG_PATH" 2>&1 || true

"${ADB[@]}" logcat -c >>"$RUN_LOG_PATH" 2>&1 || true

log "long-playback: monitor for ${DURATION_MINUTES} minutes"
while [[ "$ELAPSED" -lt "$TOTAL_SECONDS" ]]; do
  if ! "${ADB[@]}" shell pidof "$PACKAGE_NAME" >/dev/null 2>&1; then
    log "long-playback: FAIL — process not running after ${ELAPSED}s"
    exit 1
  fi

  LOG_SNippet=$("${ADB[@]}" logcat -d -t 50 2>/dev/null || true)
  if echo "$LOG_SNippet" | grep -Eq "AndroidRuntime: FATAL|ANR in"; then
    echo "$LOG_SNippet" >>"$RUN_LOG_PATH"
    log "long-playback: FAIL — crash or ANR detected"
    exit 1
  fi

  sleep "$INTERVAL_SECONDS"
  ELAPSED=$((ELAPSED + INTERVAL_SECONDS))
  log "long-playback: elapsed ${ELAPSED}s / ${TOTAL_SECONDS}s"
done

log "long-playback: PASS"
exit 0
