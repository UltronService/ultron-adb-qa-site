# APK 模組 UAT — Ultron Player

## 前置

1. 辦公室 Windows 主機：Agent 運行中（`scripts/windows-start-agent.ps1`）
2. STB 已連線：`192.168.1.176:5555`、`192.168.1.148:5555`
3. 已 build APK：

```bash
cd UltronProject-copy20260425
./gradlew assembleDemoRelease
```

4. （GitHub Pages 驗收）Tunnel + `VITE_AGENT_URL` 已設定

## 步驟

| # | 操作 | 預期 |
|---|------|------|
| 1 | 開 `/apk` | 看到 **Ultron Player build reference** 面板（package `com.ultron.player`） |
| 2 | 點 **Choose file** 上傳 demo release `.apk` | 列表顯示 Ultron Player、正確 package、version code 10042（或 aapt 讀到的值） |
| 3 | 勾選 `.176` 與 `.148` STB | 兩台出現在 install checklist |
| 4 | 點 **Install to selected** | 兩台狀態為 `installed and launched` |
| 5 | 看 STB 螢幕 | Ultron Player 主畫面出現 |
| 6 | `adb -s 192.168.1.176:5555 shell pm list packages \| grep ultron` | 顯示 `com.ultron.player` |

## 失敗排查

| 現象 | 檢查 |
|------|------|
| 上傳後 package 錯誤 | 檔名含 `ultron` 會套用預設；有 aapt 時以 aapt 為準 |
| Install failed | Agent 是否連到 STB；`adb devices` 是否 online |
| installed 但未 launch | 手動 `adb shell am start -n com.ultron.player/.MainActivity` |
| 頁面無 STB | Devices 頁先 connect；Agent 是否在辦公室主機運行 |
