#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${AGENT_URL:-http://127.0.0.1:8765}"

pass=0
fail=0

check() {
  local name="$1"
  local url="$2"
  local expected_code="${3:-200}"
  local code
  code=$(curl -s -o /tmp/agent-test-body.json -w "%{http_code}" "$url")
  if [[ "$code" == "$expected_code" ]]; then
    echo "PASS $name ($code)"
    pass=$((pass + 1))
  else
    echo "FAIL $name (expected $expected_code got $code)"
    cat /tmp/agent-test-body.json 2>/dev/null || true
    fail=$((fail + 1))
  fi
}

echo "Agent smoke tests against $BASE_URL"
echo "---"

check "health" "$BASE_URL/health"
check "devices list" "$BASE_URL/api/devices"
check "automation templates" "$BASE_URL/api/automation/templates"
check "apk list" "$BASE_URL/api/apk"
check "reports list" "$BASE_URL/api/reports"
check "runs list" "$BASE_URL/api/runs"

code=$(curl -s -o /tmp/agent-test-body.json -w "%{http_code}" \
  -X POST "$BASE_URL/api/devices/connect" \
  -H "Content-Type: application/json" \
  -d '{"address":"192.168.1.176:5555"}')
if [[ "$code" == "200" ]]; then
  echo "PASS devices connect ($code)"
  pass=$((pass + 1))
else
  echo "SKIP devices connect ($code — STB 可能離線)"
fi

DEVICE_ID="${SMOKE_DEVICE_ID:-}"
if [[ -z "$DEVICE_ID" ]]; then
  DEVICE_ID=$(python3 - <<'PY'
import json, urllib.request
try:
    data = json.load(urllib.request.urlopen("http://127.0.0.1:8765/api/devices", timeout=5))
    online = [d["id"] for d in data if d.get("online")]
    print(online[0] if online else "")
except Exception:
    print("")
PY
)
fi

if [[ -n "$DEVICE_ID" ]]; then
  check "schedule media" "$BASE_URL/api/devices/$DEVICE_ID/schedule-media"
  code=$(curl -s -o /tmp/agent-test-body.json -w "%{http_code}" \
    -X POST "$BASE_URL/api/automation/run" \
    -H "Content-Type: application/json" \
    -d "{\"template_id\":\"cold-start\",\"device_ids\":[\"$DEVICE_ID\"],\"params\":{\"package_name\":\"com.ultron.player\",\"launch_time_max_ms\":\"5000\"}}")
  if [[ "$code" == "200" ]]; then
    echo "PASS automation run ($code)"
    pass=$((pass + 1))
    run_id=$(python3 -c "import json; print(json.load(open('/tmp/agent-test-body.json')).get('run_id',''))" 2>/dev/null || true)
    if [[ -n "$run_id" ]]; then
      check "runs detail" "$BASE_URL/api/runs/$run_id"
    fi
  else
    echo "FAIL automation run ($code)"
    cat /tmp/agent-test-body.json 2>/dev/null || true
    fail=$((fail + 1))
  fi
else
  echo "SKIP automation run (無線上裝置，設 SMOKE_DEVICE_ID=serial 可重試)"
fi

echo "---"
echo "Results: $pass passed, $fail failed"
exit "$fail"
