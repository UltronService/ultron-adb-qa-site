# TC-STRESS-001 — Monkey 壓力測試

## 目的

以隨機 UI 操作壓力測試 App，確認無 crash（FATAL exception）。

## 前置條件

- STB Online，APK 已安裝
- 已知 package name

## 測試步驟

1. Automation → 選 **Monkey stress**
2. 設定 **Monkey events**（預設 500）
3. 輸入 **Package name**
4. 勾選 STB → **Run batch**

## 預期結果

- Pass：logcat 無 `AndroidRuntime: FATAL`
- Reports 有紀錄

## 對應自動化

- **template_id:** `monkey`
- **腳本:** `agent/scripts/monkey-stress.sh`

## 失敗處理

開 Issue：`?template=test_failure.yml&run_id={run_id}`，案例 ID = `TC-STRESS-001`
