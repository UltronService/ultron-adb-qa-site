# TC-BOOT-001 — 冷啟動時間

## 目的

確認 TV App 冷啟動時間在可接受範圍內（預設 ≤ 3000ms）。

## 前置條件

- STB 已透過 ADB 連線（Devices 頁顯示 Online）
- 目標 APK 已安裝
- 測試 package：`com.example.tvapp`（依實際 build 調整）

## 測試步驟

1. 開啟 Ultron QA Site → **Automation**
2. 選模板 **Cold start time**
3. 輸入正確 **Package name**
4. 勾選目標 STB（如 STB-176）
5. 按 **Run batch**
6. 等待完成，查看 Pass / Fail

## 預期結果

- 所有選定 STB 顯示 **Pass**
- Reports 頁出現本次 run 紀錄
- 啟動時間 ≤ 3000ms（可在 log 見 `launch_time_ms=`）

## 對應自動化

- **template_id:** `cold-start`
- **Agent 腳本:** `agent/scripts/cold-start.sh`

## 失敗處理

1. 到 Reports 頁確認 run_id
2. 開 Issue（帶 run_id）：
   `https://github.com/UltronService/ultron-adb-qa-site/issues/new?template=test_failure.yml&run_id={run_id}`
3. 填寫：Template ID = `cold-start`、Device ID、失敗步驟、測試案例 ID = `TC-BOOT-001`
