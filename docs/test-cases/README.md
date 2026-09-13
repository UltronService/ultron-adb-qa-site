# Ultron QA 測試案例索引

## 案例 ID 格式

`TC-{模組}-{序號}`

| 模組代碼 | 說明 |
|----------|------|
| BOOT | 啟動 / 冷啟動 |
| STRESS | 壓力測試 |
| PLAY | 播放穩定性 |
| NET | 網路 / 重開機 |

## 案例清單

| ID | 名稱 | template_id | 優先級 | 狀態 |
|----|------|-------------|--------|------|
| [TC-BOOT-001](./TC-BOOT-001-cold-start.md) | 冷啟動時間 | `cold-start` | P0 | 就緒 |
| [TC-STRESS-001](./TC-STRESS-001-monkey.md) | Monkey 壓力測試 | `monkey` | P1 | 就緒 |
| [TC-PLAY-001](./TC-PLAY-001-long-playback.md) | 長時間播放穩定 | `long-play` | P1 | 就緒 |
| [TC-NET-001](./TC-NET-001-reboot-restore.md) | 重開機網路恢復 | `reboot-net` | P2 | 就緒 |

## 失敗時開 Issue

自動化測試失敗時，請使用 GitHub **Test Failure (Automation)** 模板：

https://github.com/UltronService/ultron-adb-qa-site/issues/new?template=test_failure.yml

Automation 頁面失敗後也會提供帶 `run_id` 的連結。

一般 Bug（非自動化）請用 **Bug Report** 模板：

https://github.com/UltronService/ultron-adb-qa-site/issues/new?template=bug_report.yml
