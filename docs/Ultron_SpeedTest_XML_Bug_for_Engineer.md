# Bug：SpeedTestUtil.getConfig XML 解析失敗

**日期**：2026-09-15  
**回報來源**：STB 實機 log（Ultron Player / `com.ultron.player`）  
**裝置**：`192.168.1.148:5555`（model: taishan）  
**相關 repo**：`AaronKuan/UltronProject-copy20260425`（本機參考路徑：`C:\Users\User\Desktop\UltronProject-copy20260425-develop`）  
**優先級**：中（播放正常，測速與網路資訊回報受影響；錯誤會每約 3 秒重試一次）

---

## 1. 現象（STB log）

播放器進程存活，但測速反覆失敗：

```
W System.err: org.apache.harmony.xml.ExpatParser$ParseException: At line 1, column 1341: not well-formed (invalid token)
W System.err:   at javax.xml.parsers.SAXParser.parse(...)
W System.err:   at com.ultron.player.util.speed_test.SpeedTestUtil.getConfig(SpeedTestUtil.kt:46)
W System.err:   at com.ultron.player.util.speed_test.SpeedTestUtil.start(SpeedTestUtil.kt:28)
W System.err:   at com.ultron.player.ui.download.DownloadFragmentViewModel$doSpeedTest$1.invokeSuspend(DownloadFragmentViewModel.kt:258)
```

同時可見：

- `[PlayerAliveCheckService][isRunning][true]` → App 有在跑
- 排程／畫面素材可正常播放（例如奧創傳媒圖片輪播）
- 例外被 catch 後 `delay(3 * 1000)` 再重試 → log 會一直刷

---

## 2. 呼叫鏈

1. `DownloadFragmentViewModel.doSpeedTest()`
2. `SpeedTestUtil.start()`
3. `SpeedTestUtil.getConfig()` ← **失敗點**
4. （未到達）`getServer` / download / upload

`doSpeedTest` 失敗後會：

- `Firebase.crashlytics.recordException(e)`
- `delay(3s)`
- 再次呼叫（形成緊密重試）

---

## 3. 現況程式（重點）

檔案：`app/src/main/java/com/ultron/player/util/speed_test/SpeedTestUtil.kt`

```kotlin
private const val CONFIG_URL = "https://www.speedtest.net/speedtest-config.php"
private const val SERVER_URL = "https://www.speedtest.net/speedtest-servers-static.php"

private fun getConfig(): ConfigSetting {
    // ...
    SAXParserFactory.newInstance().newSAXParser().parse(
        ByteArrayInputStream(
            apiService.baseClient
                .newCall(Request.Builder().url(CONFIG_URL).build())
                .execute()
                .body?.bytes()
        ),
        object : DefaultHandler() { /* parse <client>/<download>/<upload> */ }
    )
    return ConfigSetting(client, download, upload)
}
```

問題摘要：

1. **假設回應一定是 Ookla 舊版 XML**，直接丟進 SAX。
2. **沒有檢查** HTTP status、`Content-Type`、body 是否以 `<?xml` / `<settings` 開頭。
3. body 為 `null` 時 `bytes()` 也可能 NPE（防禦不足）。
4. 呼叫端失敗後 **固定 3 秒重試**，放大錯誤與 Crashlytics 噪音。

---

## 4. 根因判斷

`CONFIG_URL`（`https://www.speedtest.net/speedtest-config.php`）目前**不再穩定回傳可解析的 XML**。

本機用瀏覽器以外的 HTTP client 驗證結果（2026-09-15）：

- HTTP **403 Forbidden**
- `Content-Type: text/plain`
- Body：`403 Forbidden`
- Response headers 可見 **Cloudflare**

STB 上解析錯誤落在 **line 1, column 1341**，較像拿到**較長的非 XML 內容**（例如 HTML／挑戰頁／錯誤頁），而不是預期的 Ookla config XML。  
無論 403 短文字或 HTML 長頁，結論相同：**把非 XML 餵給 SAX → `not well-formed (invalid token)`**。

補充：Ookla 舊的公開 `speedtest-config.php` / `speedtest-servers-static.php` 介面已被限制／淘汰已久，很多第三方 client 會遇到同樣問題。這比較像**外部 API 契約失效**，不是 STB 硬體問題。

---

## 5. 建議修改方向（請工程師擇一或組合）

### 方案 A（建議）：換掉 Ookla 未授權舊 XML API

- 改用公司可控的測速方式，例如：
  - 自家 CDN／伺服器上下載固定大小檔案量測 Mbps
  - 已授權的 Ookla Speedtest CLI / 官方 SDK（需授權與合規）
- 優點：長期可維護、不受 Cloudflare／舊 endpoint 影響

### 方案 B（過渡）：強化 `getConfig` 防禦 + 優雅降級

至少做到：

1. 檢查 `response.isSuccessful`（非 2xx 直接失敗，並 log status + content-type + body 前 200 chars）
2. 確認 body 看起來像 XML 再 parse（例如 trim 後以 `<` 開頭且含 `client`）
3. `body == null` 當失敗處理，不要把 null 丟進 parser
4. parse 失敗時回傳明確錯誤（自訂 exception），**不要**讓 SAX 例外一路噴 `System.err`
5. UI／ViewModel：測速失敗顯示「測速服務不可用」，不要每 3 秒無限重試  
   - 建議：指數退避，或最多 N 次，或改為使用者手動重試／每日一次

### 方案 C：若必須暫時維持 Ookla

- 評估是否仍有可用且合規的 endpoint／授權
- 仍必須做方案 B 的驗證與退避
- **不建議**用破解 Cloudflare／偽造瀏覽器當正式解法

---

## 6. 建議程式修改點（檔案清單）

| 檔案 | 建議 |
|------|------|
| `.../util/speed_test/SpeedTestUtil.kt` | 驗證 HTTP／Content-Type／XML；失敗要有明確錯誤；考慮整體換測速實作 |
| `.../ui/download/DownloadFragmentViewModel.kt` | `doSpeedTest` 的重試策略改為有上限／退避；失敗 UX |
| （可選）Crashlytics 分類 | 對「外部測速 API 不可用」不要當致命崩潰狂報，或降級為 non-fatal + rate limit |

---

## 7. 复現步驟（給工程師）

```bat
adb connect 192.168.1.148:5555
adb -s 192.168.1.148:5555 shell pidof com.ultron.player
adb -s 192.168.1.148:5555 logcat -d --pid=<PID> | findstr SpeedTestUtil
```

或在 App 內觸發下載頁／測速流程，觀察是否持續出現 `getConfig` + `not well-formed`。

本機也可快速確認 endpoint：

```bat
curl -i https://www.speedtest.net/speedtest-config.php
```

預期常看到 **403** 或非 XML body（環境／IP 可能略有差異，但「非合法 config XML」即可佐證）。

---

## 8. 驗收標準

- [ ] 測速失敗時 App **不崩潰**、log **不再每 3 秒刷同一 SAX 例外**
- [ ] 失敗時 UI 有清楚狀態（或靜默降級），不影響排程播放
- [ ] 若改為自有測速：在 STB 有線網路上可得到合理的 download／upload 數值並可回報後端
- [ ] Crashlytics 不再被此錯誤刷爆
- [ ] 播放與排程功能回歸正常（本 bug 修復不應影響播放）

---

## 9. 附註（非本 bug，但同次 log 有看到）

- `ReportHistoryWorker` 曾出現 `Worker result RETRY`（回報歷史重試）— 可另開 ticket，與測速 XML 無直接關係。

---

**撰寫**：DevBot（依 2026-09-15 STB log + 原始碼 `SpeedTestUtil.kt` + endpoint 實測）  
**連絡窗口**：Admin Ultron
