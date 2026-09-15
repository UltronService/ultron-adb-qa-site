# Ultron UpdateSchedule HTTP 500 調查報告

**對象：** STB `192.168.1.148:5555` / package `com.ultron.player`  
**現象對應：** 下載頁 `failed:500` ← `UpdateSchedule` 收到 HTTP 500  
**調查日：** 2026-09-15  
**調查限制：** 執行端為離線 Linux box，**無法直連辦公室 LAN ADB**；無法寫入 Windows `D:\` / Desktop。本報告以（1）已知 session log、（2）裝置先前 UI 截圖、（3）product APK jadx 反編譯 完成根因導向結論。

---

## 現象

- 播放器「下載／排程同步」頁面顯示 **`failed:500`**（UI 字串實際為 `Failed: 500`）。
- 同時間 debug log 出現：
  - `[Debug][UpdateSchedule][error status code: 500]`（約 **2026-09-15 17:54:34**）
- 客戶端在收到非 200 後：
  - **不會**呼叫 `saveSchedule()` 覆寫本地排程；
  - 會延遲約 5 秒嘗試以既有本地資料 `play`。
- 結論導向：**不是「連不上伺服器」**，而是 **已連上雲端 API 並收到 HTTP 500（伺服器端錯誤）**。

---

## 環境（裝置、APK 版本、時間）

| 項目 | 值 | 來源 |
|------|-----|------|
| ADB 目標 | `192.168.1.148:5555`（另有 `192.168.1.176:5555`） | 任務環境 |
| Package | `com.ultron.player` | 任務／APK |
| Local IP | `192.168.1.148` | `stb148_screen.png` |
| Public IP | `1.164.183.8` | 同上 |
| **DeviceID** | **`101`** | 同上（UI `DeviceID: 101`；分店列 `… \| 101`） |
| UUID | `29f51a59-b1df-491a-8338-8d5b0f8dbc58` | 同上 |
| Set-Up Box | `SPX432-03-UM` | 同上 |
| VersionName | `v1.0.0(10054)_20260908` | 同上 |
| VersionCode | `10054` | 同上 |
| CLUSTER | ON | 同上 |
| 錯誤時間 | ~`2026-09-15 17:54:34` | 操作者提供之 log |
| 截圖時間（較早） | DeviceTime `2026-09-15 09:12:50`（當下 UltronService 仍 Success） | 截圖 |
| API Base（product APK） | `https://ultrontest.ddns.net/api/v1` | jadx `ApiType` |
| 反編譯 APK | GCS `…10053…product_release.apk`（裝置實裝 10054；URL／錯誤字串與 10053 一致） | GCS + 字串比對 |

**ADB 現況：** 調查 box `adb connect 192.168.1.148:5555` → 無裝置；**無法**重拉 logcat／pull SQLite／repro 重啟。需在 Windows 測試機（`C:\adb\platform-tools\adb.exe`、`machineId 8135b268-…`）補做。

---

## 證據（關鍵 log 原文、時間戳）

### 1) 操作者提供（同 session）

```
[Debug][UpdateSchedule][error status code: 500]    # ~2026-09-15 17:54:34
```

同 session **另有** SpeedTestUtil XML parse failure（**並行問題，非 500 成因**）。

### 2) 客戶端程式對應（jadx 反編譯，`DownloadFragmentViewModel$updateSchedule$1`）

```java
} else {
    int code = response.code();
    mutableLiveData3 = downloadFragmentViewModel.mScheduleApiInfo;
    mutableLiveData3.postValue("Failed: " + code);
    downloadFragmentViewModel.debugLog.updateLog(
        DownloadFragmentViewModel.TAG,
        "[UpdateSchedule][error status code: " + code + "] " + response.message());
    downloadFragmentViewModel.debugLog.sendDownloadPageLog();
    DownloadFragmentViewModel.play$default(downloadFragmentViewModel, null, 5000L, 1, null);
}
```

→ UI `Failed: 500` ≡ 下載頁 `failed:500`；log 字串與操作者紀錄**完全吻合**。

### 3) 請求組裝（`DownloadRepository.getSchedule`）

- 建立 `ApiType.Devices.Schedules(deviceId, startDate, endDate)`
- **HTTP GET**（無 body）
- Header：`Authorization: Bearer {token}`
- `startDate` = 今天；`endDate` = 今天 + 7 天

### 4) URL 定義（`ApiType.Devices.Schedules.getUrl`）

```java
return "https://ultrontest.ddns.net/api/v1/devices/"
    + this.deviceId + "/schedules" + genQueryStr(this.queryParams);
// queryParams: startDate, endDate
```

### 5) 路由存活探測（無 token，調查端）

```
GET https://ultrontest.ddns.net/api/v1/devices/101/schedules?startDate=2026-09-15&endDate=2026-09-22
→ HTTP 401 {"message":"Unauthenticated."}
```

證明路由存在；**500 必為已通過／嘗試通過認證後之伺服器內部錯誤**（或中介層），非 DNS／連線失敗。

### 6) 時間線（已知片段）

1. 較早（~09:12）：148 已登入、DeviceID=101、ONLINE、GOOGLE／UltronService 探測 Success  
2. APK／下載頁觸發 `updateSchedule`  
3. ~17:54:34：`[UpdateSchedule][error status code: 500]` → UI `Failed: 500`  
4. 同 session：SpeedTestUtil XML 解析失敗（並行）  
5. 客戶端可能仍以舊本地排程 Play（5s delay）

---

## 請求是什麼（URL／API 名稱）

| 項目 | 內容 |
|------|------|
| API 名稱（客戶端） | `UpdateSchedule` → `DownloadRepository.getSchedule` → `ApiType.Devices.Schedules` |
| Response 型別 | `BrandsSchedules`（Moshi） |
| Method | **GET** |
| **完整 URL 模板** | `https://ultrontest.ddns.net/api/v1/devices/{deviceId}/schedules?startDate={YYYY-MM-DD}&endDate={YYYY-MM-DD}` |
| **本機實例** | `https://ultrontest.ddns.net/api/v1/devices/101/schedules?startDate=2026-09-15&endDate=2026-09-22`（endDate 以當日+7 為準） |
| Auth | `Authorization: Bearer <login token>` |

**搜尋過程（已成功）：**

1. GCS product APK `10053` → unzip → `strings` on `classes.dex` → 找到 base URL 與 `[UpdateSchedule][error status code: `  
2. jadx 反編譯 `ApiType` / `DownloadRepository` / `updateSchedule$1` → 確認 path `/devices/{id}/schedules`  
3. 探測 API → 401（路由存在）  
4. QA `adb_service.py` 僅讀本地 SQLite，**不是**雲端 UpdateSchedule URL（已區隔）

**未果項目：** 裝置上即時 OkHttp URL log（需 live logcat）；10054 APK 於同一 GCS 檔名 pattern 回 404（改以 10053 反編譯；錯誤字串與 URL 常量一致）。

---

## 結論：500 是雲端／伺服器錯誤；客戶端已連上並收到 500

1. 客戶端只有在 `response.code()` 已取回且 **≠ 200** 時才寫入 `[UpdateSchedule][error status code: …]`。  
2. 出現 **明確的 `500`** ⇒ TCP/TLS／DNS 已成功，HTTP 層收到伺服器狀態碼 500。  
3. UI `Failed: 500` 與上述分支為同一條路徑。  
4. **根因應查後端**（Laravel on `ultrontest.ddns.net`：`GET /api/v1/devices/{id}/schedules`）於該時間點的 exception／access log／該 deviceId=101 的排程資料產生邏輯。  
5. 客戶端在 500 時**不更新**本地 schedule DB；若本地仍有舊排程可能繼續播，但下載頁會顯示失敗。

---

## 可能後端原因清單（假設，標成待驗證）

1. **待驗證** `deviceId=101` 在該時間點排程查詢 SQL／Eloquent 例外（N+1、null relation、壞 JSON）  
2. **待驗證** `startDate`/`endDate` 區間資料量過大 → timeout／memory → 500  
3. **待驗證** 品牌／分店「多專案排程」專案／media 關聯缺資料或髒資料  
4. **待驗證** 中介授權通過後業務層未 catch 的 PHP Error  
5. **待驗證** 依賴服務（DB、GCS media meta、快取）短暫故障  
6. **待驗證** 僅特定 device／branch 觸發（對照 176 是否同時 500）  
7. **較不像** 客戶端 URL 拼錯（常量寫死且 401 探測證明路由）  
8. **較不像** SpeedTest XML 問題導致 500（不同程式路徑）

---

## 建議工程師下一步

1. 在 **2026-09-15 ~17:54:34（Asia/Taipei）** 查 `ultrontest.ddns.net` nginx／Laravel `storage/logs`／access log：  
   - path 含 `/api/v1/devices/101/schedules`  
   - status 500 的 request id、stack trace、response body  
2. 用該 device 的 Bearer token（或後台模擬）重放：  
   `GET /api/v1/devices/101/schedules?startDate=2026-09-15&endDate=2026-09-22`  
   保存完整 response body。  
3. 對照 DB：device 101、其 brand/branch、當日±7 天 schedule／project／media。  
4. 在 Windows 測試機補做（補齊本報告缺口）：  
   ```powershell
   & C:\adb\platform-tools\adb.exe -s 192.168.1.148:5555 logcat -d > logcat_full.txt
   # filter UpdateSchedule / status code / SpeedTestUtil
   & C:\adb\platform-tools\adb.exe -s 192.168.1.148:5555 shell "run-as com.ultron.player sqlite3 databases/ultron_project `"SELECT brandName,branchName,categoryName,deviceId,lastGetScheduleDate FROM login;`""
   ```  
5. 可選：force-stop + `am start -n com.ultron.player/.MainActivity` 後立刻抓新 log（確認是否仍 500）。  
6. 修復後驗證：下載頁顯示毫秒數（成功）而非 `Failed: 500`，且 `lastGetScheduleDate` 更新。

---

## 與測速 XML 問題的區隔

| | UpdateSchedule 500 | SpeedTestUtil XML |
|--|--------------------|-------------------|
| 模組 | `DownloadFragmentViewModel.updateSchedule` / `getSchedule` | `SpeedTestUtil` / `doSpeedTest` |
| 對外呼叫 | `GET …/devices/{id}/schedules` | 測速設定 XML（獨立） |
| 失敗表現 | UI `Failed: 500`；log `error status code: 500` | XML parse failure |
| 因果 | **本票主因** | **同 session 並行雜訊，非 500 原因** |

請勿將測速 XML 失敗當成排程 500 的根因；可另開 ticket。

---

## 附件檔名列表

目錄（調查產出）：`update-schedule-500/`

| 檔名 | 說明 |
|------|------|
| `Ultron_UpdateSchedule_500_Investigation.md` | 本報告 |
| `logcat_filtered.txt` | 已知 log＋反編譯對應（無 live dump） |
| `device_info.txt` | 裝置身分彙整 |
| `schedule_db_snapshot.txt` | DB 查詢腳本／未拉取說明 |
| `investigation_meta.txt` | 調查限制 |
| `ApiType_Devices_Schedules_excerpt.java` | URL 反編譯摘錄 |
| `DownloadRepository_getSchedule_excerpt.java` | GET + Bearer 摘錄 |
| `updateSchedule_error_branch_excerpt.java` | 500→UI 映射摘錄 |
| `ApiType_decompiled.java` | 完整 ApiType |
| `apk_strings_schedule.txt` | DEX schedule 相關字串 |

### 路徑狀態

| 目標路徑 | 狀態 |
|----------|------|
| 調查 box：`/workspace/ultron-inv/update-schedule-500/` | ✅ 已寫入 |
| GitHub repo sync（若 push 成功）：`sync/update-schedule-500/` | 見 push 結果 |
| `D:\Cursor\ultron-adb-qa-site\sync\update-schedule-500\` | ❌ 調查端無 Windows 磁碟掛載 |
| `C:\Users\User\Desktop\Ultron_UpdateSchedule_500_Investigation.md` | ❌ 同上；請父代理／本機複製 |

---

*報告結束*
