# 辦公室真實測試指南

## 一鍵啟動（Windows）

在 repo 根目錄：

```powershell
.\scripts\office-real-test.ps1
```

會自動：patch runs export → adb connect → 開 Agent 視窗 → 開前端視窗。

## 真跑 vs 假跑

| 現象 | 意義 |
|------|------|
| 進度顯示 `STB-176` | 展示模式假跑 |
| 進度顯示 `Hi3751V560` | 真實 ADB 測試 |
| `/api/devices` id 為 `192.168.1.x:5555` | Agent 已讀到真機 |
| `/api/devices` id 為 `stb-176` | Agent 用 mock，需重啟 Agent |

## UAT 步驟

1. 瀏覽器 `http://localhost:43123`
2. **APK** → 安裝 Ultron Player（`com.ultron.player`）
3. **自動化** → 冷啟動時間 → 執行批次
4. **報表** → 確認有紀錄

PowerShell 驗證：

```powershell
Invoke-RestMethod http://127.0.0.1:8765/api/reports
```

## 本次修復摘要

- 前端自動帶 `package_name`，不再靜默假跑
- Windows 用 `.ps1` 腳本跑 Automation（不需 bash）
- Agent 啟動腳本補 adb PATH
