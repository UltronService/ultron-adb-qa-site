#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXPECTED_HEAD="05dd5b0"

echo "=== Ultron 辦公室首日 Step 1–3 ==="

cd "$REPO_ROOT"

RUNS_PY="$REPO_ROOT/agent/routers/runs.py"
if grep -q 'HTMLResponse | JSONResponse' "$RUNS_PY" 2>/dev/null; then
  echo "Applying runs export hotfix..."
  sed -i 's/from fastapi.responses import FileResponse, HTMLResponse, JSONResponse/from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, Response/' "$RUNS_PY"
  sed -i 's/@router.get("\/{run_id}\/export")/@router.get("\/{run_id}\/export", response_model=None)/' "$RUNS_PY"
  sed -i 's/) -> HTMLResponse | JSONResponse:/) -> Response:/' "$RUNS_PY"
fi

echo ""
echo "[1/5] 更新 GitHub main..."
git checkout main
git pull github main
HEAD="$(git rev-parse --short HEAD)"
if [[ "$HEAD" != "$EXPECTED_HEAD" ]]; then
  echo "WARN: HEAD=$HEAD（預期 $EXPECTED_HEAD），仍繼續。"
else
  echo "OK: HEAD=$HEAD"
fi

echo ""
echo "[2/5] 連線 STB..."
command -v adb >/dev/null || { echo "ERROR: adb 不在 PATH"; exit 1; }
adb connect 192.168.1.176:5555 || true
adb connect 192.168.1.148:5555 || true
adb devices -l

echo ""
echo "[3/5] 啟動 Agent..."
cd "$REPO_ROOT/agent"
if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
pip install -q -r requirements.txt

SESSION="ultron-agent"
tmux -f /exec-daemon/tmux.portal.conf has-session -t "=$SESSION" 2>/dev/null || \
  tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION" -c "$REPO_ROOT/agent" -- "${SHELL:-bash}" -l
tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION:0.0" \
  "source .venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8765" C-m
sleep 5

echo ""
echo "[4/5] Health check..."
curl -sf "http://127.0.0.1:8765/health" | head -c 200
echo ""

echo ""
echo "[5/5] Smoke tests..."
bash "$REPO_ROOT/scripts/agent-smoke-test.sh" || true

echo ""
echo "=== 下一步 ==="
echo "cd frontend && npm install && npm run dev"
echo "瀏覽器 → 裝置 / 自動化 / 報表 UAT"
