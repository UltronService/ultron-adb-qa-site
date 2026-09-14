# Ultron ADB QA Site — Windows agent (FastAPI) starter
# Run from repo root: .\scripts\windows-start-agent.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$AgentDir = Join-Path $RepoRoot "agent"
$VenvActivate = Join-Path $AgentDir ".venv\Scripts\Activate.ps1"

function Add-PathIfExists {
    param([string]$PathToAdd)
    if (Test-Path $PathToAdd) {
        $env:PATH = "$PathToAdd;$env:PATH"
    }
}

# Common adb / Git Bash locations so Agent subprocess finds real devices
@(
    "$env:LOCALAPPDATA\Android\Sdk\platform-tools",
    "$env:USERPROFILE\AppData\Local\Android\Sdk\platform-tools",
    "C:\platform-tools",
    "C:\Program Files\Git\bin",
    "C:\Program Files\Git\usr\bin"
) | ForEach-Object { Add-PathIfExists $_ }

Write-Host "Ultron ADB QA Site — starting agent..." -ForegroundColor Cyan

if (-not (Test-Path $AgentDir)) {
    Write-Host "ERROR: agent folder not found." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Python not found. Install from https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
    Write-Host "WARN: adb not in PATH — /api/devices may use mock IDs." -ForegroundColor Yellow
} else {
    Write-Host "OK: adb = $(Get-Command adb | Select-Object -ExpandProperty Source)" -ForegroundColor Green
}

Set-Location $AgentDir

if (-not (Test-Path $VenvActivate)) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
}

& $VenvActivate
pip install -r requirements.txt -q
Write-Host "Agent running at http://127.0.0.1:8765/health" -ForegroundColor Green
uvicorn main:app --reload --host 0.0.0.0 --port 8765
