# 辦公室首日 UAT — 一日流程

明天進辦公室後，依序完成以下項目。預估 **1～2 小時**（含 Tunnel 設定）。

## 事前（在家可先做）

- [ ] WSL sync 分支到 GitHub：`cursor/apk-ultron-player-wire`
- [ ] 下載 GCS APK 到本機備用（見 [ultron-apk-source.md](./ultron-apk-source.md)）

---

## Step 1 — 啟動 Agent（Windows PowerShell）

```powershell
cd C:\Users\User\ultron-adb-qa-site
.\scripts\windows-start-agent.ps1
```

確認：`http://127.0.0.1:8765/health` 回 200

---

## Step 2 — 連線 STB

```powershell
adb connect 192.168.1.176:5555
adb connect 192.168.1.148:5555
adb devices -l
```

或在 QA 網站 **Devices** 頁輸入 IP connect。

---

## Step 3 — Cloudflare Tunnel（若用 GitHub Pages）

```powershell
.\scripts\windows-start-all.ps1
```

1. 複製 `https://xxx.trycloudflare.com` URL
2. GitHub repo → Settings → Secrets → `VITE_AGENT_URL` = 該 URL
3. Actions → Deploy GitHub Pages → Run workflow

本地 preview 可跳過 Tunnel，用 `npm run dev` + Agent proxy。

---

## Step 4 — APK 安裝 UAT

見 [apk-uat.md](./apk-uat.md)

| # | 操作 | 預期 |
|---|------|------|
| 1 | `/apk` 上傳 GCS 下載的 APK | 顯示 Ultron Player、code 10053 |
| 2 | 勾 `.176`、`.148` → Install | `installed and launched` |
| 3 | STB 螢幕 | Ultron Player 主畫面 |

---

## Step 5 — Console logcat UAT（Phase 2）

| # | 操作 | 預期 |
|---|------|------|
| 1 | 開 `/console`，選 STB | Logcat 有即時 log（非 2 秒 mock 輪播） |
| 2 | Package 維持 `com.ultron.player` | 只見 App 相關 log |
| 3 | 點 **Export .log** | 下載 `.log` 檔，內容 > 0 行 |
| 4 | 操作 App（播放等） | log 有新增行 |

---

## Step 6 — 收尾

- [ ] Android repo 改回 **Private**（若不再需要 Agent clone）
- [ ] 將 UAT 結果回報 Project（通過 / 阻塞項）
- [ ] 留存 Export 的 `.log` 供後續比對

---

## 常見阻塞

| 現象 | 處理 |
|------|------|
| Pages 無 STB | Tunnel + Secret 未設；或 Agent 未跑 |
| logcat 仍是 mock 三行輪播 | Agent 未更新到 Phase 2 分支 |
| Install failed | `adb devices` 確認 online |
| logcat 空 | App 未啟動；確認 package 與 pid |
