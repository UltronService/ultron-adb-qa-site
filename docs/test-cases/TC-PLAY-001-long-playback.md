# TC-PLAY-001 — 長時間播放穩定

## 目的

App 長時間運行不 crash、不 ANR。

## 前置條件

- STB Online，APK 已安裝並可進入主畫面或播放頁

## 測試步驟

1. Automation → **Long playback**
2. 設定 **Duration (minutes)**（預設 30）
3. 輸入 **Package name**
4. 勾選 STB → **Run batch**

## 預期結果

- 監控期間 process 存活
- 無 crash / ANR → Pass

## 對應自動化

- **template_id:** `long-play`
- **腳本:** `agent/scripts/long-playback.sh`

## 失敗處理

開 Issue：`?template=test_failure.yml&run_id={run_id}`，案例 ID = `TC-PLAY-001`
