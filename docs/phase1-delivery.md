# Phase 1 交付說明

## 本次交付內容

### Agent API（FastAPI，port 8765）

| 模組 | 端點 | 功能 |
|------|------|------|
| Health | `GET /health` | 健康檢查 |
| Devices | `GET/POST /api/devices` | 列表、連線、LAN 掃描 |
| Console | `POST /api/console/{id}/screenshot` 等 | 截圖、按鍵、文字、Logcat WS |
| APK | `GET/POST /api/apk` | 列表、上傳、批次安裝 |
| Automation | `GET/POST /api/automation/*` | 模板、執行、進度 |
| Reports | `GET /api/reports/*` | 歷史、diff |

Cloud VM 無 adb 時 Devices 回 mock 資料；辦公室主機有 adb 時回真實 STB。

### Frontend

- 五頁已接 Agent API，Agent 離線時 fallback mock
- 本地 dev：`/agent-api` proxy → `:8765`（免 CORS）
- GitHub Pages：需 Cloudflare Tunnel 指向辦公室 Agent

### 測試結果（Cloud VM）

```
Agent smoke tests: 7 passed, 0 failed
Frontend build: OK
```

執行：`./scripts/agent-smoke-test.sh`

---

## 本地啟動（辦公室 Windows）

**終端 1 — Agent**

```powershell
cd C:\Users\User\ultron-adb-qa-site
.\scripts\windows-start-agent.ps1
```

確認：http://127.0.0.1:8765/health → `{"status":"ok"}`

**終端 2 — Frontend**

```powershell
cd C:\Users\User\ultron-adb-qa-site\frontend
npm run dev -- --host 0.0.0.0 --port 5174
```

開：http://127.0.0.1:5174/devices

**ADB 連線（同網段）**

```bash
adb connect 192.168.1.176:5555
adb connect 192.168.1.148:5555
adb devices -l
```

---

## UAT 驗收清單

| # | 步驟 | 預期 |
|---|------|------|
| 1 | 開 `/devices`，Agent 運行中 | 顯示真實 STB（Hi3751V560、g k6760v100） |
| 2 | 輸入 IP → Add Device | 新裝置出現在列表 |
| 3 | Scan LAN | 列表刷新 |
| 4 | 開 `/console`，選裝置 → Capture now | 有回應（mock 或真實截圖） |
| 5 | 開 `/apk` → Choose file 上傳 .apk | 表格多一列 |
| 6 | 勾 STB → Install to selected | 顯示 installed 結果 |
| 7 | 開 `/automation` → Run batch | 右側進度表更新 |
| 8 | 開 `/reports` | 歷史列表 + View diff |
| 9 | GitHub Pages 網址 | UI 正常（Agent 離線時 mock） |

---

## 同步到 GitHub

```bash
cd ~/ultron-adb-qa-site
git pull origin main
git push github main
```

---

## 下一步（Phase 2+）

1. Cloudflare Tunnel — Pages UI 連辦公室 Agent
2. APK repo 授權 — 整合 `UltronProject2022`
3. Console 真實 screencap + logcat
4. Reports 真實 screenshot diff
