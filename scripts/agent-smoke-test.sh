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

code=$(curl -s -o /tmp/agent-test-body.json -w "%{http_code}" \
  -X POST "$BASE_URL/api/devices/connect" \
  -H "Content-Type: application/json" \
  -d '{"address":"192.168.1.99:5555"}')
if [[ "$code" == "200" ]]; then
  echo "PASS devices connect mock ($code)"
  pass=$((pass + 1))
else
  echo "FAIL devices connect ($code)"
  fail=$((fail + 1))
fi

code=$(curl -s -o /tmp/agent-test-body.json -w "%{http_code}" \
  -X POST "$BASE_URL/api/automation/run" \
  -H "Content-Type: application/json" \
  -d '{"template_id":"cold-start","device_ids":["stb-1"],"params":{}}')
if [[ "$code" == "200" ]]; then
  echo "PASS automation run ($code)"
  pass=$((pass + 1))
else
  echo "FAIL automation run ($code)"
  fail=$((fail + 1))
fi

echo "---"
echo "Results: $pass passed, $fail failed"
exit "$fail"
