# TC-NET-001 — 重開機網路恢復

## 目的

STB 重開機後網路可在 120 秒內恢復（ping 8.8.8.8 成功）。

## 前置條件

- STB Online
- 不需指定 package（reboot-net 模板）

## 測試步驟

1. Automation → **Reboot network restore**
2. 勾選 STB → **Run batch**
3. 等待 reboot 與 ping 完成（最長約 2 分鐘）

## 預期結果

- Pass：boot 完成且 ping 成功
- Fail：超時或 ping 失敗

## 對應自動化

- **template_id:** `reboot-net`
- **腳本:** `agent/scripts/reboot-net.sh`

## 失敗處理

開 Issue：`?template=test_failure.yml&run_id={run_id}`，案例 ID = `TC-NET-001`
