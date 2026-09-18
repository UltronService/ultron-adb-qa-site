# 離線套用繁中主控台更新（不需 admin-ultron remote）
# 適用：已在 sync-cloud-unique-3 / c14de3d 的辦公室 repo
# 用法：.\scripts\office-apply-zh-console.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$PatchFile = Join-Path $RepoRoot "patches\console-apk-zh-tw-full.patch"

Set-Location $RepoRoot

Write-Host "=== 套用繁中主控台 APK/錄影/時間 patch ===" -ForegroundColor Cyan

if (-not (Test-Path $PatchFile)) {
    Write-Host "ERROR: 找不到 $PatchFile" -ForegroundColor Red
    Write-Host "請先更新 repo 取得 patch 檔，或聯絡 Cloud Agent 取得完整分支。" -ForegroundColor Yellow
    exit 1
}

$head = git log --oneline -1
Write-Host "目前: $head" -ForegroundColor Gray

git apply --check $PatchFile 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARN: patch 可能已套用或 base 不同，嘗試 git apply --3way ..." -ForegroundColor Yellow
    git apply --3way $PatchFile
} else {
    git apply $PatchFile
}

Write-Host "Patch 已套用。" -ForegroundColor Green

Push-Location (Join-Path $RepoRoot "frontend")
npm install
Pop-Location

Write-Host ""
Write-Host "請執行: .\scripts\local-start.ps1" -ForegroundColor Cyan
Write-Host "然後開啟 http://127.0.0.1:43123/console" -ForegroundColor Cyan
