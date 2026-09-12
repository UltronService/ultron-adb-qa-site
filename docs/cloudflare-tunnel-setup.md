# Cloudflare Tunnel 設定指南

讓 GitHub Pages（HTTPS）能連到辦公室 Windows 上的 Agent（ADB）。

## 架構

```
GitHub Pages UI  ──HTTPS──►  Cloudflare Tunnel  ──►  本機 Agent :8765  ──►  STB (ADB)
```

---

## 前置條件

- 辦公室 Windows 已能 `adb connect` 到 STB
- Agent 可正常回應：http://127.0.0.1:8765/health
- 免費 [Cloudflare 帳號](https://dash.cloudflare.com/sign-up)（Quick Tunnel 不需網域）

---

## 方案 A：Quick Tunnel（測試用，最快）

### 1. 安裝 cloudflared（Windows PowerShell）

```powershell
winget install Cloudflare.cloudflared
```

或下載：https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

### 2. 啟動 Agent + Tunnel

**方式一 — 一鍵開兩個視窗**

```powershell
cd C:\Users\User\ultron-adb-qa-site
.\scripts\windows-start-all.ps1
```

**方式二 — 手動**

視窗 1：

```powershell
.\scripts\windows-start-agent.ps1
```

視窗 2（等 Agent 起來後）：

```powershell
.\scripts\windows-start-tunnel.ps1
```

### 3. 複製 Tunnel URL

Tunnel 視窗會顯示類似：

```
https://random-words-here.trycloudflare.com
```

**整段 https URL 複製下來**（不要加尾斜線）。

### 4. 設 GitHub Secret

1. 開 https://github.com/UltronService/ultron-adb-qa-site/settings/secrets/actions
2. **New repository secret**
3. Name：`VITE_AGENT_URL`
4. Value：貼上 `https://xxx.trycloudflare.com`
5. Save

### 5. 重新部署 GitHub Pages

1. 開 https://github.com/UltronService/ultron-adb-qa-site/actions
2. 選 **Deploy GitHub Pages** → **Run workflow** → Run
3. 等綠 ✓ 後開 https://ultronservice.github.io/ultron-adb-qa-site/devices

### 6. 驗收

| 步驟 | 預期 |
|------|------|
| Tunnel URL + `/health` | `{"status":"ok"}` |
| Pages `/devices` | 顯示真實 STB（非 mock） |
| Add Device / Scan LAN | 有回應 |

> Quick Tunnel URL **每次重啟會變**，需更新 GitHub Secret 並重新 deploy。

---

## 方案 B：Named Tunnel（正式環境，固定網址）

需有自己的網域並托管在 Cloudflare。

### 1. 登入 Cloudflare

```powershell
cloudflared tunnel login
```

瀏覽器選你的網域並授權。

### 2. 建立 Tunnel

```powershell
cloudflared tunnel create ultron-qa-agent
```

記下輸出的 **Tunnel ID**。

### 3. 設定 config

複製 `config/cloudflared.example.yml` 到 `C:\Users\User\.cloudflared\config.yml`，修改：

- `tunnel:` → 你的 Tunnel ID
- `credentials-file:` → `C:\Users\User\.cloudflared\<TUNNEL_ID>.json`
- `hostname:` → 例如 `ultron-qa-agent.yourdomain.com`

### 4. DNS 指向 Tunnel

```powershell
cloudflared tunnel route dns ultron-qa-agent ultron-qa-agent.yourdomain.com
```

### 5. 啟動

```powershell
$env:CLOUDFLARE_TUNNEL_NAME = "ultron-qa-agent"
.\scripts\windows-start-tunnel.ps1
```

### 6. GitHub Secret

`VITE_AGENT_URL` = `https://ultron-qa-agent.yourdomain.com`

重新 Run workflow 部署 Pages。

---

## GitHub Actions 說明

Workflow 會讀取 secret `VITE_AGENT_URL` 並在 build 時注入前端：

```yaml
env:
  VITE_AGENT_URL: ${{ secrets.VITE_AGENT_URL }}
```

未設定 secret 時，Pages 版仍顯示 mock 資料（Agent 離線 fallback）。

---

## 常見問題

| 現象 | 處理 |
|------|------|
| Pages 仍顯示 mock | Secret 未設或 deploy 在設 secret 之前；重新 Run workflow |
| Mixed content 錯誤 | Tunnel URL 必須是 **https://** |
| CORS 錯誤 | Agent 已允許 `*`，確認 Tunnel 指到 `:8765` |
| Logcat 無資料 | WebSocket 需 Tunnel 運行中；Named Tunnel 較穩定 |
| Quick URL 失效 | 重啟 tunnel 後更新 secret + redeploy |

---

## 日常操作

1. 開機後執行 `.\scripts\windows-start-all.ps1`
2. Quick Tunnel：更新 secret（若 URL 變了）→ Run workflow
3. Named Tunnel：URL 固定，通常只需保持 tunnel 運行
