# Ultron ADB QA — 辦公室真實測試一鍵啟動（Windows）
# 用法：在 repo 根目錄 .\scripts\office-real-test.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "=== Ultron 真實測試準備 ===" -ForegroundColor Cyan
Set-Location $RepoRoot

& "$RepoRoot\scripts\patch-runs-export.ps1"

if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: adb 不在 PATH。請安裝 Android platform-tools。" -ForegroundColor Red
    exit 1
}

Write-Host "`n[1/4] 連線 STB..." -ForegroundColor Yellow
adb connect 192.168.1.176:5555
adb connect 192.168.1.148:5555
adb devices -l

Write-Host "`n[2/4] 啟動 Agent（新視窗，請保持開啟）..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RepoRoot'; .\scripts\windows-start-agent.ps1"
Start-Sleep -Seconds 10

Write-Host "`n[3/4] 驗證 Agent..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8765/health" -TimeoutSec 8
    Write-Host "OK: health = $($health.status)" -ForegroundColor Green
    $devices = Invoke-RestMethod -Uri "http://127.0.0.1:8765/api/devices" -TimeoutSec 8
    $devices | Format-Table id, label, online -AutoSize
    $mockIds = @($devices | Where-Object { $_.id -like 'stb-*' })
    if ($mockIds.Count -gt 0) {
        Write-Host "WARN: 裝置 id 仍是 stb-*（mock）。請在 Agent 視窗 Ctrl+C 後，用「同一個」已能跑 adb 的 PowerShell 重跑 windows-start-agent.ps1" -ForegroundColor Yellow
    } else {
        Write-Host "OK: 真實 ADB 裝置 id 已就緒。" -ForegroundColor Green
    }
} catch {
    Write-Host "FAIL: Agent 未回應 — $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n[4/4] 啟動前端（新視窗）..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RepoRoot\frontend'; if (-not (Test-Path node_modules)) { npm install }; npm run dev"

Write-Host "`n=== 接下來在瀏覽器 ===" -ForegroundColor Cyan
Write-Host "1. 開 http://localhost:43123"
Write-Host "2. APK 頁 → 安裝 com.ultron.player 到兩台 STB（若尚未安裝）"
Write-Host "3. 自動化 → 冷啟動時間 → 執行批次（進度應顯示 Hi3751V560，不是 STB-176）"
Write-Host "4. 報表 → 應有測試紀錄"
Write-Host "`n快速確認：Invoke-RestMethod http://127.0.0.1:8765/api/reports" -ForegroundColor Gray
