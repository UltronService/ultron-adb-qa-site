# Ultron ADB QA Site — pull latest console branch and start (Windows office)
# Run from repo root: .\scripts\office-update-and-start.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Branch = "cursor/console-apk-zh-tw-c5d8"

Set-Location $RepoRoot

Write-Host "Ultron ADB QA Site - office update + start" -ForegroundColor Cyan
Write-Host "Branch: $Branch" -ForegroundColor Gray

$remotes = @(git remote)
$remote = if ($remotes -contains "github") { "github" } elseif ($remotes -contains "origin") { "origin" } else { $remotes[0] }

Write-Host "Fetching $remote..." -ForegroundColor Yellow
git fetch $remote $Branch

Write-Host "Checking out $Branch..." -ForegroundColor Yellow
git checkout $Branch 2>$null
if ($LASTEXITCODE -ne 0) {
    git checkout -b $Branch "$remote/$Branch"
}

Write-Host "Pulling latest..." -ForegroundColor Yellow
git pull $remote $Branch

Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Push-Location (Join-Path $RepoRoot "frontend")
npm install
Pop-Location

& (Join-Path $RepoRoot "scripts\local-start.ps1")
