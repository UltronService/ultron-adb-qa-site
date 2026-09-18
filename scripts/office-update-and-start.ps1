# Ultron ADB QA Site — pull zh-TW console branch and start (Windows office)
# Run from repo root: .\scripts\office-update-and-start.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Branch = "cursor/console-apk-zh-tw-c5d8"
$AdminUltronUrl = "https://github.com/admin-ultron/ultron-adb-qa-site.git"

Set-Location $RepoRoot

Write-Host ""
Write-Host "=== Ultron ADB QA — 更新繁中主控台 ===" -ForegroundColor Cyan
Write-Host "目標分支: $Branch" -ForegroundColor Gray
Write-Host "Repo: $RepoRoot" -ForegroundColor Gray
Write-Host ""

function Test-RemoteBranch {
    param([string]$Remote, [string]$BranchName)
    git ls-remote --heads $Remote $BranchName 2>$null | Out-Null
    return $LASTEXITCODE -eq 0
}

$remotes = @(git remote)
if ($remotes -notcontains "admin-ultron") {
    Write-Host "加入 admin-ultron remote（繁中主控台分支來源）..." -ForegroundColor Yellow
    git remote add admin-ultron $AdminUltronUrl
    $remotes = @(git remote)
}

$fetchRemote = $null
foreach ($candidate in @("admin-ultron", "origin", "github")) {
    if ($remotes -contains $candidate) {
        if (Test-RemoteBranch -Remote $candidate -BranchName $Branch) {
            $fetchRemote = $candidate
            break
        }
    }
}

if (-not $fetchRemote) {
    Write-Host "ERROR: 找不到分支 $Branch" -ForegroundColor Red
    Write-Host "請確認網路正常，或手動執行：" -ForegroundColor Yellow
    Write-Host "  git fetch admin-ultron $Branch" -ForegroundColor Gray
    exit 1
}

Write-Host "從 $fetchRemote 拉取 $Branch ..." -ForegroundColor Yellow
git fetch $fetchRemote $Branch

$currentBranch = git branch --show-current
if ($currentBranch -ne $Branch) {
    git checkout $Branch 2>$null
    if ($LASTEXITCODE -ne 0) {
        git checkout -b $Branch "$fetchRemote/$Branch"
    }
}

git reset --hard "$fetchRemote/$Branch"

Write-Host ""
Write-Host "目前 commit: $(git log --oneline -1)" -ForegroundColor Green

$consolePage = Join-Path $RepoRoot "frontend\src\pages\console-page.tsx"
if (Test-Path $consolePage) {
    $content = Get-Content $consolePage -Raw
    if ($content -match "互動主控台" -and $content -match "App 安裝") {
        Write-Host "UI 版本: 繁中主控台（含 APK / 錄影 / 時間設定）" -ForegroundColor Green
    } elseif ($content -match "互動主控台") {
        Write-Host "UI 版本: 繁中主控台（舊版，缺少 APK 區塊）" -ForegroundColor Yellow
    } elseif ($content -match "Interactive Console") {
        Write-Host "UI 版本: 英文版（admin-ultron main）— 非預期！" -ForegroundColor Red
        Write-Host "請確認分支是否正確。" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "安裝 frontend 依賴..." -ForegroundColor Yellow
Push-Location (Join-Path $RepoRoot "frontend")
npm install
Pop-Location

Write-Host ""
Write-Host "啟動 Agent + Frontend..." -ForegroundColor Yellow
Write-Host "完成後開啟: http://127.0.0.1:43123/console" -ForegroundColor Cyan
Write-Host ""

& (Join-Path $RepoRoot "scripts\local-start.ps1")
