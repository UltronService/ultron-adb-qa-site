# 辦公室更新 — 繁中主控台（APK / 錄影 / 時間）

## 一鍵更新

在 **PowerShell** 於 repo 根目錄執行：

```powershell
cd D:\Cursor\ultron-adb-qa-site
.\scripts\office-update-and-start.ps1
```

腳本會：

1. 加入 `admin-ultron` remote（若尚未存在）
2. 拉取分支 `cursor/console-apk-zh-tw-c5d8`
3. 安裝 frontend 依賴
4. 啟動 Agent（8765）+ Frontend（43123）

## 確認更新成功

開啟 http://127.0.0.1:43123/console ，左側應看到：

- **App 安裝 / 卸載 / 啟動**（含覆蓋安裝、允許降版）
- **STB 日期與時間**
- 即時預覽區有 **錄影 30 秒**

頁面標題應為 **互動主控台**（非 Interactive Console）。

## 手動更新（腳本失敗時）

```powershell
cd D:\Cursor\ultron-adb-qa-site
git remote add admin-ultron https://origin.cursor.com/git/admin-ultron/ultron-adb-qa-site.git
git fetch admin-ultron cursor/console-apk-zh-tw-c5d8
git checkout -B cursor/console-apk-zh-tw-c5d8 admin-ultron/cursor/console-apk-zh-tw-c5d8
cd frontend
npm install
cd ..
.\scripts\local-start.ps1
```

## 常見問題

| 現象 | 原因 | 解法 |
|------|------|------|
| 仍是舊版繁中 UI | 沒拉到新分支 | 重跑 `office-update-and-start.ps1` |
| 變成英文 Interactive Console | 誤 checkout 到 main | 重新 checkout 上方分支 |
| Agent 離線 | PowerShell 視窗被關閉 | 重跑 `local-start.ps1` |
