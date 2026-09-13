# Ultron ADB QA Site — 辦公室首日一鍵準備（Windows）
# 用法：在 repo 根目錄 .\scripts\office-day1.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ExpectedHead = "05dd5b0"

Write-Host "=== Ultron 辦公室首日 Step 1–3 ===" -ForegroundColor Cyan

Set-Location $RepoRoot

& "$RepoRoot\scripts\patch-runs-export.ps1"

Write-Host "`n[1/5] 更新 GitHub main..." -ForegroundColor Yellow
git checkout main
git pull github main
$head = (git rev-parse --short HEAD)
if ($head -ne $ExpectedHead) {
    Write-Host "WARN: HEAD=$head（預期 $ExpectedHead），仍繼續。" -ForegroundColor Yellow
} else {
    Write-Host "OK: HEAD=$head" -ForegroundColor Green
}

Write-Host "`n[2/5] 連線 STB..." -ForegroundColor Yellow
if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: adb 不在 PATH。請安裝 Android platform-tools。" -ForegroundColor Red
    exit 1
}
adb connect 192.168.1.176:5555
adb connect 192.168.1.148:5555
adb devices -l

Write-Host "`n[3/5] 啟動 Agent（新視窗）..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RepoRoot'; .\scripts\windows-start-agent.ps1"
Start-Sleep -Seconds 8

Write-Host "`n[4/5] Health check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8765/health" -TimeoutSec 5
    Write-Host "OK: Agent health = $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "FAIL: Agent 未回應。請看 Agent 視窗錯誤。" -ForegroundColor Red
    exit 1
}

Write-Host "`n[5/5] Smoke tests..." -ForegroundColor Yellow
& "$RepoRoot\scripts\agent-smoke-test.sh"
if ($LASTEXITCODE -ne 0) {
    Write-Host "部分 smoke 失敗（無 STB 時 automation 可能失敗，可忽略）。" -ForegroundColor Yellow
}

Write-Host "`n=== 下一步 ===" -ForegroundColor Cyan
Write-Host "1. 新終端：cd frontend && npm install && npm run dev"
Write-Host "2. 瀏覽器開 dev 站 → 裝置 / 自動化 / 報表 UAT"
Write-Host "3. 若要線上 Pages：.\scripts\windows-start-all.ps1 並設 VITE_AGENT_URL"
Write-Host "完成。" -ForegroundColor Green
