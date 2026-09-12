# Ultron ADB QA Site — Windows one-click frontend dev server
# Run from repo root: .\scripts\windows-start.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$FrontendDir = Join-Path $RepoRoot "frontend"

Write-Host "Ultron ADB QA Site — starting frontend..." -ForegroundColor Cyan

if (-not (Test-Path $FrontendDir)) {
    Write-Host "ERROR: frontend folder not found. Run this script from the cloned repo." -ForegroundColor Red
    Write-Host "Expected: $FrontendDir" -ForegroundColor Yellow
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not found. Install from https://nodejs.org/ then restart PowerShell." -ForegroundColor Red
    exit 1
}

Set-Location $FrontendDir

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm packages (first run only)..." -ForegroundColor Yellow
    npm install
}

Write-Host "Starting dev server at http://127.0.0.1:43123" -ForegroundColor Green
Start-Process "http://127.0.0.1:43123"
npm run dev
