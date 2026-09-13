# Ultron Player APK 來源

## 推薦：GCS 預編譯 APK（立即可用）

| 項目 | 值 |
|------|-----|
| 下載 | [UltronProject2022_v1.0.0(10053)_20260907_product_release.apk](https://storage.googleapis.com/ultron-local/APKs/UltronProject2022_v1.0.0(10053)_20260907_product_release.apk) |
| 大小 | ~21.7 MB |
| 應用名稱 | Ultron Player |
| Package | `com.ultron.player` |
| Version | `v1.0.0(10053)_20260907`（code 10053） |
| Flavor | `product` |
| Launch | `com.ultron.player/.MainActivity` |

無需 build，可直接用 adb 或 QA Site `/apk` 上傳後批次安裝。

## 備選：從原始碼 build

Public repo：https://github.com/AaronKuan/UltronProject-copy20260425

```bash
git clone -b develop https://github.com/AaronKuan/UltronProject-copy20260425.git
cd UltronProject-copy20260425
./gradlew assembleDemoRelease   # QA 建議 demo flavor
```

| 項目 | 值 |
|------|-----|
| Version code（repo 預設） | 10042 |
| API | `https://ultrontest.ddns.net` |

## 安裝到機上盒

```bash
curl -LO "https://storage.googleapis.com/ultron-local/APKs/UltronProject2022_v1.0.0(10053)_20260907_product_release.apk"
adb install -r UltronProject2022_v1.0.0\(10053\)_20260907_product_release.apk
adb shell am start -n com.ultron.player/.MainActivity
```

或在 QA Site **APK Repository**（`/apk`）上傳後批次安裝。

## UAT

見 [apk-uat.md](./apk-uat.md)
